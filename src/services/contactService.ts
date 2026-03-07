// ============================================
// CONTACT SERVICE
// ============================================
// Manages contact generation, synchronization, and the encounter system.
// Contacts are only added when you actually meet people in-game.

import type { ContactInfo, PotentialDate, MessagingState, SocialBio } from '@/types/personalLife'
import type { NpcMood, Conversation, TextMessage } from '@/data/messaging-config'
import type { Partner, Child } from '@/data/family-config'
import type { CareerState } from '@/store/careerStore'
import { 
  getPartnerPortrait, 
  getRandomPartnerPortrait, 
  getChildPortrait,
  getStaffPortrait,
  getDriverPortrait,
  getPartnerAsset,
  getAllPartnerIds
} from '@/utils/generated-assets'
import { generateId } from '@/utils/personalLifeHelpers'
import { generateSocialBio, generateFallbackSocialBio } from '@/services/dialogueAI'
import type { SocialBioContext } from '@/services/dialogueAI'
import {
  getRandomContactByGender,
  getRandomPartnerByGender,
  extractContactBio,
  extractPartnerBio,
  getPreGenPortrait,
  isContentLoaded,
  type PreGenContactProfile,
  type PreGenPartnerProfile
} from '@/services/preGeneratedContentService'

// ============================================
// TYPES
// ============================================

export type ContactType = 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date'

export type EventType = 
  | 'gala'
  | 'paddock_social'
  | 'sponsor_meeting'
  | 'race_incident'
  | 'contract_negotiation'
  | 'social_scene'
  | 'team_celebration'
  | 'media_event'

export type Gender = 'male' | 'female'

export type DatingPreference = 'men' | 'women' | 'both' | 'none'

export interface EncounterResult {
  success: boolean
  contact?: ContactInfo
  introMessage?: string
  metAt: string
  chemistryOutcome?: 'mutual_interest' | 'just_friends' | 'one_sided' | 'no_chemistry'
}

export interface EncounterConfig {
  contactTypes: ContactType[]
  baseChance: number
  fameMultiplier: number
  romanticChance?: number // Chance that encounter is romantic (if single)
}

// ============================================
// NAME GENERATION (Internationally diverse)
// ============================================

const MALE_FIRST_NAMES = [
  // English
  'James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Andrew',
  'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Edward', 'Jason',
  'Ryan', 'Jacob', 'Nicholas', 'Benjamin', 'Samuel', 'Alexander', 'Sebastian',
  'Marcus', 'Lucas', 'Oliver', 'Ethan', 'Mason', 'Logan', 'Henry', 'Nathan',
  'Dylan', 'Liam', 'Noah', 'Caleb', 'Connor', 'Adrian', 'Dominic', 'Maxwell',
  // French
  'Pierre', 'Jean', 'Louis', 'Antoine', 'Julien', 'Maxime', 'Remy', 'Hugo',
  // German / Austrian / Swiss
  'Hans', 'Klaus', 'Stefan', 'Lukas', 'Florian', 'Tobias', 'Niklas', 'Moritz',
  // Italian
  'Marco', 'Giovanni', 'Luca', 'Matteo', 'Alessandro', 'Lorenzo', 'Fabio', 'Nico',
  // Spanish / Latin American
  'Carlos', 'Miguel', 'Diego', 'Alejandro', 'Rafael', 'Javier', 'Pablo', 'Santiago',
  'Mateo', 'Thiago', 'Emiliano', 'Bruno',
  // Portuguese / Brazilian
  'Felipe', 'Pedro', 'Gustavo', 'Rodrigo', 'Tiago', 'Caio',
  // Dutch / Belgian
  'Lars', 'Bram', 'Sander', 'Daan', 'Joost', 'Pieter', 'Ruben',
  // Scandinavian
  'Erik', 'Axel', 'Magnus', 'Oskar', 'Emil', 'Nils', 'Rasmus', 'Sven',
  // Eastern European
  'Viktor', 'Ivan', 'Dmitri', 'Andrei', 'Sergei', 'Tomasz', 'Jakub', 'Marek',
  // Japanese
  'Yuki', 'Kenji', 'Takeshi', 'Hiroshi', 'Ryota', 'Haruto', 'Kaito', 'Ren',
  // Chinese / Korean
  'Chen', 'Wei', 'Jun', 'Hao', 'Min-Jun', 'Seo-Jun', 'Ji-Hoon', 'Sung',
  // Indian
  'Raj', 'Arjun', 'Vikram', 'Rohan', 'Aarav', 'Kiran', 'Dev', 'Sanjay',
  // Middle Eastern / North African
  'Omar', 'Ahmed', 'Karim', 'Hassan', 'Youssef', 'Khalid', 'Tariq', 'Rami',
  // African
  'Kwame', 'Ade', 'Chidi', 'Tendai', 'Kofi', 'Jabari',
  // Southeast Asian
  'Bao', 'Anh', 'Ryu', 'Tanawat', 'Rizal'
]

const FEMALE_FIRST_NAMES = [
  // English
  'Emma', 'Olivia', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Harper',
  'Sarah', 'Emily', 'Jessica', 'Elizabeth', 'Victoria', 'Alexandra', 'Katherine',
  'Grace', 'Hannah', 'Lily', 'Scarlett', 'Chloe', 'Zoey', 'Audrey', 'Violet',
  'Penelope', 'Claire', 'Ruby', 'Madeline', 'Stella', 'Hazel', 'Eleanor',
  'Nora', 'Ivy', 'Alice', 'Savannah', 'Piper', 'Willow', 'Eloise',
  // French
  'Marie', 'Camille', 'Juliette', 'Manon', 'Margaux', 'Colette', 'Aurelie',
  // German / Austrian / Swiss
  'Lena', 'Mila', 'Hanna', 'Frieda', 'Klara', 'Annika', 'Greta', 'Heidi',
  // Italian
  'Giulia', 'Chiara', 'Francesca', 'Alessia', 'Bianca', 'Sienna', 'Gioia', 'Elisa',
  // Spanish / Latin American
  'Sofia', 'Valentina', 'Lucia', 'Camila', 'Mariana', 'Daniela', 'Catalina', 'Paloma',
  'Ximena', 'Renata', 'Fernanda',
  // Portuguese / Brazilian
  'Ana', 'Beatriz', 'Larissa', 'Isabela', 'Leticia',
  // Dutch / Belgian
  'Lotte', 'Femke', 'Sanne', 'Eva', 'Fleur', 'Daphne',
  // Scandinavian
  'Ingrid', 'Freya', 'Astrid', 'Sigrid', 'Elsa', 'Linnea', 'Saga', 'Maja',
  // Eastern European
  'Natasha', 'Katarina', 'Anastasia', 'Milena', 'Daria', 'Tatiana', 'Petra', 'Ivana',
  // Japanese
  'Aiko', 'Sakura', 'Mei', 'Hana', 'Rin', 'Akari', 'Yui',
  // Chinese / Korean
  'Mei-Ling', 'Xiao', 'Li-Wei', 'Ji-Yeon', 'Soo-Min', 'Hye-Jin', 'Min-Ah',
  // Indian
  'Priya', 'Ananya', 'Diya', 'Aisha', 'Kavya', 'Meera', 'Tara', 'Rani',
  // Middle Eastern / North African
  'Fatima', 'Leila', 'Yasmin', 'Amira', 'Nadia', 'Zahra', 'Layla', 'Soraya',
  // African
  'Amara', 'Zuri', 'Nia', 'Adaeze', 'Thandiwe', 'Imani',
  // Southeast Asian
  'Linh', 'Mai', 'Suri', 'Aya', 'Malaya', 'Ariya'
]

const LAST_NAMES = [
  // English / American
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Wright', 'Hill',
  'Scott', 'Green', 'Baker', 'Adams', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Parker', 'Evans', 'Turner', 'Collins', 'Stewart', 'Morgan', 'Murphy', 'Brooks',
  // Spanish / Latin American
  'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Sanchez',
  'Ramirez', 'Torres', 'Flores', 'Rivera', 'Morales', 'Vargas', 'Castillo',
  // French
  'Dubois', 'Leclerc', 'Bernard', 'Laurent', 'Moreau', 'Lefebvre', 'Girard', 'Duval',
  // German / Austrian
  'Mueller', 'Schmidt', 'Weber', 'Fischer', 'Bauer', 'Hoffmann', 'Richter', 'Klein',
  // Italian
  'Rossi', 'Ferrari', 'Conti', 'Marino', 'Romano', 'Colombo', 'Mancini', 'Bianchi',
  // Dutch / Belgian
  'De Vries', 'Van den Berg', 'Bakker', 'Visser', 'Jansen', 'Mertens',
  // Scandinavian
  'Eriksson', 'Johansson', 'Lindberg', 'Nilsson', 'Larsen', 'Hansen', 'Pedersen',
  // Japanese
  'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Nakamura', 'Kobayashi', 'Sato',
  // Chinese / Korean
  'Kim', 'Park', 'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Huang', 'Cho', 'Yoon',
  // Indian
  'Singh', 'Patel', 'Sharma', 'Kumar', 'Reddy', 'Gupta', 'Kapoor', 'Malhotra',
  // Middle Eastern / North African
  'Al-Rashid', 'Al-Farsi', 'Hadid', 'Nazari', 'Khoury', 'Osman', 'El-Amin',
  // Eastern European
  'Nowak', 'Kowalski', 'Horvat', 'Popov', 'Petrovic', 'Novak',
  // Portuguese / Brazilian
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Ferreira',
  // African
  'Okafor', 'Mensah', 'Nkosi', 'Diallo', 'Banda', 'Osei'
]

// ============================================
// OCCUPATIONS (~85 professions)
// ============================================

const OCCUPATIONS = [
  // Business & Finance
  'Marketing Executive', 'Investment Banker', 'Venture Capitalist', 'Hedge Fund Manager',
  'Private Equity Partner', 'Financial Advisor', 'Cryptocurrency Trader', 'Day Trader',
  'Accountant', 'Insurance Broker', 'Management Consultant', 'CEO', 'CFO',
  'Business Development Director', 'Real Estate Developer', 'Property Manager',
  // Tech
  'Software Engineer', 'AI Researcher', 'Robotics Engineer', 'Data Scientist',
  'Game Developer', 'Cybersecurity Expert', 'UX Designer', 'CTO', 'Tech Entrepreneur',
  'Product Manager', 'Blockchain Developer',
  // Medical & Science
  'Doctor', 'Surgeon', 'Physiotherapist', 'Sports Psychologist', 'Dentist',
  'Veterinarian', 'Pharmacist', 'Nutritionist', 'Dermatologist', 'Psychiatrist',
  'Neuroscientist', 'Marine Biologist',
  // Law & Government
  'Lawyer', 'Judge', 'Diplomat', 'Ambassador', 'Patent Attorney', 'Human Rights Lawyer',
  'Policy Advisor', 'Tax Attorney', 'Lobbyist',
  // Creative & Media
  'Fashion Designer', 'Journalist', 'Actress', 'Model', 'Film Director', 'Screenwriter',
  'Interior Designer', 'Choreographer', 'Music Producer', 'Photographer', 'PR Manager',
  'Social Media Influencer', 'Author', 'Painter', 'Sculptor', 'Animator',
  'Graphic Designer', 'DJ', 'Musician', 'Art Curator', 'Documentary Filmmaker',
  // Sport & Fitness
  'Racing Driver', 'Personal Trainer', 'Sports Agent', 'Sports Commentator',
  'Olympic Athlete', 'Coach', 'Fitness Trainer', 'Yoga Instructor',
  'Equestrian', 'Professional Golfer',
  // Hospitality & Lifestyle
  'Event Planner', 'Restaurant Owner', 'Chef', 'Sommelier', 'Hotel Manager',
  'Concierge', 'Luxury Travel Agent', 'Casino Manager', 'Nightclub Owner',
  'Wine Merchant', 'Vineyard Owner',
  // Maritime & Aviation
  'Pilot', 'Yacht Captain', 'Yacht Broker', 'Aviation Consultant',
  // Academic & Education
  'Professor', 'Researcher', 'University Dean', 'Archaeologist',
  // Other
  'Charity Director', 'Art Gallery Owner', 'Architect', 'Jeweler', 'Perfumer',
  'Antique Dealer', 'Auctioneer', 'Private Investigator', 'Life Coach', 'Stylist',
  'Winemaker', 'Military Officer (Retired)', 'Astronaut (Retired)'
]

// ============================================
// TRAITS (Positive + Negative + Complex = ~79)
// ============================================

// Positive traits
const POSITIVE_TRAITS = [
  'supportive', 'ambitious', 'romantic', 'adventurous', 'intellectual',
  'caring', 'humorous', 'sophisticated', 'creative', 'confident',
  'independent', 'passionate', 'loyal', 'spontaneous', 'thoughtful',
  'charismatic', 'driven', 'compassionate', 'elegant', 'witty',
  'generous', 'optimistic', 'empathetic', 'patient', 'reliable',
  'humble', 'sincere', 'warm', 'disciplined', 'grateful',
  'playful', 'open-minded', 'principled', 'nurturing', 'forgiving'
]

// Negative traits
const NEGATIVE_TRAITS = [
  'materialistic', 'secretive', 'controlling', 'impulsive', 'arrogant',
  'cynical', 'jealous', 'unreliable', 'dramatic', 'gossipy',
  'workaholic', 'aloof', 'manipulative', 'vain', 'entitled',
  'petty', 'passive-aggressive', 'judgmental', 'self-centered', 'impatient',
  'reckless', 'dismissive', 'argumentative', 'condescending'
]

// Complex / neutral traits
const COMPLEX_TRAITS = [
  'perfectionist', 'old-fashioned', 'restless', 'competitive', 'stubborn',
  'sarcastic', 'intense', 'mysterious', 'reserved', 'idealistic',
  'eccentric', 'blunt', 'calculating', 'overprotective', 'nostalgic',
  'mischievous', 'rebellious', 'obsessive', 'opinionated', 'fiery'
]

// Combined trait pool for generation
const TRAITS = [...POSITIVE_TRAITS, ...NEGATIVE_TRAITS, ...COMPLEX_TRAITS]

// ============================================
// INTERESTS (~75 interests)
// ============================================

const INTERESTS = [
  // Sports & Fitness
  'Motorsport', 'Golf', 'Tennis', 'Sailing', 'Skiing', 'Hiking', 'Fitness',
  'Polo', 'Equestrian', 'Surfing', 'Scuba Diving', 'Boxing', 'Yoga',
  'Marathon Running', 'Cycling', 'Climbing', 'Martial Arts', 'Fencing',
  'Cricket', 'Rugby', 'Snowboarding', 'Kitesurfing', 'Archery', 'Triathlon',
  'Swimming', 'Paddleboarding', 'Wakeboarding', 'Karting', 'Track Days',
  // Culture & Arts
  'Art', 'Music', 'Theater', 'Photography', 'Architecture', 'Reading',
  'Opera', 'Ballet', 'Cinema', 'History', 'Philosophy', 'Languages',
  'Antiques', 'Calligraphy', 'Poetry', 'Stand-up Comedy', 'Documentary Films',
  'Classical Music', 'Jazz', 'Street Art', 'Contemporary Dance', 'Literature',
  // Food & Drink
  'Fine Dining', 'Wine', 'Cooking', 'Coffee Culture', 'Craft Beer',
  'Whiskey', 'Cigars', 'Cocktail Making', 'Food Tourism', 'Baking',
  // Lifestyle & Leisure
  'Travel', 'Fashion', 'Charity Work', 'Technology', 'Gaming',
  'Astronomy', 'Meditation', 'Volunteering', 'Podcasts', 'Collecting Watches',
  'Interior Design', 'Sustainable Living', 'Vintage Cars', 'Drone Racing',
  'Board Games', 'Escape Rooms', 'True Crime', 'Gardening', 'Bird Watching',
  'Woodworking', 'Pottery', 'Piloting', 'Skydiving', 'Chess'
]

// ============================================
// NATIONALITIES (~55 nationalities)
// ============================================

const NATIONALITIES = [
  // Europe
  'British', 'French', 'Italian', 'German', 'Spanish', 'Dutch', 'Finnish',
  'Austrian', 'Belgian', 'Swiss', 'Danish', 'Swedish', 'Norwegian', 'Polish',
  'Czech', 'Hungarian', 'Portuguese', 'Greek', 'Irish', 'Romanian', 'Croatian',
  'Serbian', 'Ukrainian', 'Turkish', 'Russian', 'Monegasque', 'Luxembourgish',
  // Americas
  'American', 'Brazilian', 'Argentine', 'Mexican', 'Canadian', 'Colombian',
  'Chilean', 'Venezuelan', 'Peruvian', 'Uruguayan',
  // Asia & Pacific
  'Japanese', 'Chinese', 'South Korean', 'Indian', 'Thai', 'Indonesian',
  'Filipino', 'Australian', 'New Zealander', 'Singaporean', 'Malaysian',
  'Vietnamese', 'Taiwanese',
  // Africa & Middle East
  'South African', 'Nigerian', 'Kenyan', 'Moroccan', 'Egyptian', 'Emirati',
  'Saudi', 'Israeli', 'Lebanese', 'Qatari', 'Bahraini', 'Ghanaian'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function getRandomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function generateAge(contactType: ContactType): number {
  switch (contactType) {
    case 'potential_date':
      return 22 + Math.floor(Math.random() * 20) // 22-42
    case 'business':
      return 30 + Math.floor(Math.random() * 30) // 30-60
    case 'rival':
      return 25 + Math.floor(Math.random() * 25) // 25-50
    default:
      return 25 + Math.floor(Math.random() * 20) // 25-45
  }
}

function generateName(gender: Gender): { firstName: string; lastName: string } {
  const firstNames = gender === 'male' ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES
  return {
    firstName: getRandomItem(firstNames),
    lastName: getRandomItem(LAST_NAMES)
  }
}

/**
 * Generate a mixed bag of traits: mostly positive, some negative/complex
 * This creates more realistic, flawed characters
 */
function generateMixedTraits(count: number): string[] {
  // Weighted selection: ~55% positive, ~25% complex, ~20% negative
  const traits: string[] = []
  const usedTraits = new Set<string>()
  
  while (traits.length < count) {
    const roll = Math.random()
    let pool: string[]
    if (roll < 0.55) {
      pool = POSITIVE_TRAITS
    } else if (roll < 0.80) {
      pool = COMPLEX_TRAITS
    } else {
      pool = NEGATIVE_TRAITS
    }
    
    const trait = getRandomItem(pool)
    if (!usedTraits.has(trait)) {
      usedTraits.add(trait)
      traits.push(trait)
    }
  }
  
  return traits
}

// ============================================
// ENCOUNTER CONFIGURATION
// ============================================

export const ENCOUNTER_CONFIG: Record<EventType, EncounterConfig> = {
  gala: {
    contactTypes: ['business', 'potential_date', 'friend'],
    baseChance: 0.5,
    fameMultiplier: 0.005, // +0.5% per fame point
    romanticChance: 0.4
  },
  paddock_social: {
    contactTypes: ['rival', 'business', 'friend'],
    baseChance: 0.35,
    fameMultiplier: 0.003,
    romanticChance: 0.1
  },
  sponsor_meeting: {
    contactTypes: ['business'],
    baseChance: 0.6,
    fameMultiplier: 0.002,
    romanticChance: 0
  },
  race_incident: {
    contactTypes: ['rival'],
    baseChance: 0.7,
    fameMultiplier: 0.001,
    romanticChance: 0
  },
  contract_negotiation: {
    contactTypes: ['business'],
    baseChance: 0.4,
    fameMultiplier: 0.003,
    romanticChance: 0
  },
  social_scene: {
    contactTypes: ['potential_date', 'friend'],
    baseChance: 0.45,
    fameMultiplier: 0.005,
    romanticChance: 0.7
  },
  team_celebration: {
    contactTypes: ['friend', 'potential_date'],
    baseChance: 0.3,
    fameMultiplier: 0.004,
    romanticChance: 0.25
  },
  media_event: {
    contactTypes: ['business', 'friend'],
    baseChance: 0.35,
    fameMultiplier: 0.006,
    romanticChance: 0.15
  }
}

// ============================================
// INTRO MESSAGE TEMPLATES
// ============================================

const INTRO_MESSAGES: Record<ContactType, string[]> = {
  partner: [
    "Hey! It was really great meeting you 💕",
    "I had such a wonderful time talking with you!",
    "Hi! I've been thinking about our conversation all day 😊"
  ],
  potential_date: [
    "Hey! It was lovely meeting you at the event! 😊",
    "Hi there! I really enjoyed our chat earlier.",
    "Hey! I hope I'm not being too forward, but I wanted to say hi!",
    "It was great meeting you! I'd love to continue our conversation sometime.",
    "Hi! I couldn't stop thinking about our conversation. Hope you're having a great day!"
  ],
  family: [
    "Hey sweetie! Just checking in on you.",
    "Hi! How's everything going?",
    "Just wanted to say I'm proud of you!"
  ],
  friend: [
    "Hey! Great meeting you! We should hang out sometime.",
    "It was cool chatting with you earlier!",
    "Hey mate! That was a fun event, wasn't it?"
  ],
  business: [
    "It was a pleasure meeting you. Let's stay in touch.",
    "Great connecting with you today. Looking forward to future opportunities.",
    "Following up from our conversation - I think there could be some synergies here."
  ],
  rival: [
    "Don't think this changes anything between us on track.",
    "Good luck out there. You're going to need it.",
    "May the best team win. Just know that's going to be us."
  ]
}

// ============================================
// PORTRAIT FUNCTIONS
// ============================================

/**
 * Get the portrait path for a contact based on their type and stored portrait ID
 */
export function getContactPortrait(contact: ContactInfo & { portraitId?: string; gender?: Gender; pregenId?: string }): string {
  // ── First check for pre-generated portrait (most reliable for pool-sourced contacts) ──
  const pregenId = contact.pregenId || contact.portraitId
  if (pregenId) {
    const preGenPath = getPreGenPortrait(pregenId)
    if (preGenPath) return preGenPath
  }
  
  // If we have a specific portrait ID, use type-specific portrait getters
  if (contact.portraitId) {
    switch (contact.type) {
      case 'partner':
      case 'potential_date':
        return getPartnerPortrait(contact.portraitId)
      case 'family':
        return getChildPortrait(contact.portraitId)
      case 'rival':
        return getDriverPortrait(contact.portraitId)
      case 'business':
      case 'friend':
        return getStaffPortrait(contact.portraitId)
      default:
        return getStaffPortrait(contact.portraitId)
    }
  }
  
  // Fallback - generate a portrait based on type and gender
  if (contact.type === 'partner' || contact.type === 'potential_date') {
    return getRandomPartnerPortrait(contact.gender)
  }
  
  return ''
}

/**
 * Assign a gender-matched portrait to a new contact.
 * Checks pre-generated portraits first, then falls back to manifest-based portraits.
 * Returns the portrait path and the portrait ID for storage.
 */
export function assignGenderMatchedPortrait(
  gender: Gender, 
  contactType: ContactType,
  preGenEntityId?: string
): { portraitPath: string; portraitId: string } {
  // ── Check for pre-generated portrait by entity ID ──
  if (preGenEntityId) {
    const preGenPath = getPreGenPortrait(preGenEntityId)
    if (preGenPath) {
      return {
        portraitPath: preGenPath,
        portraitId: preGenEntityId
      }
    }
  }

  // For romantic contacts, use partner portraits with gender filtering
  if (contactType === 'partner' || contactType === 'potential_date') {
    // Get all partner IDs and find one with matching gender
    const allPartnerIds = getAllPartnerIds()
    const matchingPartners: string[] = []
    
    for (const partnerId of allPartnerIds) {
      const partnerAsset = getPartnerAsset(partnerId)
      if (partnerAsset && partnerAsset.gender === gender) {
        matchingPartners.push(partnerId)
      }
    }
    
    if (matchingPartners.length > 0) {
      const selectedId = getRandomItem(matchingPartners)
      return {
        portraitPath: getPartnerPortrait(selectedId),
        portraitId: selectedId
      }
    }
    
    // Fallback to random portrait
    return {
      portraitPath: getRandomPartnerPortrait(gender),
      portraitId: `random_${gender}_${Date.now()}`
    }
  }
  
  // For other contact types, no specific portrait assignment
  return {
    portraitPath: '',
    portraitId: ''
  }
}

// ============================================
// DEFAULT MOOD
// ============================================

function createDefaultMood(): NpcMood {
  return {
    overall: 'neutral',
    energy: 'medium',
    receptiveness: 70,
    recentEvents: []
  }
}

function createPositiveMood(): NpcMood {
  return {
    overall: 'happy',
    energy: 'high',
    receptiveness: 85,
    recentEvents: []
  }
}

// ============================================
// CONTACT GENERATION
// ============================================

/**
 * Generate a new contact from an encounter.
 * Tries pre-generated Content Studio data first, falls back to runtime generation.
 * Includes a template-based bio immediately, with async AI upgrade available.
 */
export function generateNewContact(
  contactType: ContactType,
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number
): ContactInfo & { portraitId: string; gender: Gender } {
  // ── Try pre-generated pool first ──
  if (isContentLoaded()) {
    const preGen = getRandomContactByGender(gender)
    if (preGen) {
      return buildContactFromPreGen(preGen, contactType, gender, metAt, metWeek, metYear)
    }
  }

  // ── Fallback: runtime generation (original logic) ──
  const { firstName, lastName } = generateName(gender)
  const { portraitId } = assignGenderMatchedPortrait(gender, contactType)
  
  const isRomantic = contactType === 'partner' || contactType === 'potential_date'
  const name = `${firstName} ${lastName}`
  const traits = generateMixedTraits(3 + Math.floor(Math.random() * 2))
  const occupation = getRandomItem(OCCUPATIONS)
  const nationality = getRandomItem(NATIONALITIES)
  const age = generateAge(contactType)
  
  const bioContext: SocialBioContext = {
    name,
    age,
    gender,
    occupation,
    nationality,
    traits,
    contactType,
    metAt
  }
  const bio = generateFallbackSocialBio(bioContext)
  
  return {
    id: generateId('contact'),
    name,
    type: contactType,
    traits,
    bio,
    relationshipLevel: contactType === 'rival' ? 20 : 30,
    affectionMeter: isRomantic ? 40 : 30,
    romanceMeter: isRomantic ? 30 : 0,
    trustMeter: contactType === 'rival' ? 20 : 40,
    currentMood: createPositiveMood(),
    isOnline: Math.random() > 0.5,
    lastSeen: 'Just now',
    isFavorite: false,
    metAt,
    metWeek,
    metYear,
    datingStatus: isRomantic ? 'stranger' : undefined,
    portraitId,
    gender
  }
}

/**
 * Build a ContactInfo from a pre-generated contact profile.
 */
function buildContactFromPreGen(
  preGen: PreGenContactProfile,
  contactType: ContactType,
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number
): ContactInfo & { portraitId: string; gender: Gender } {
  const isRomantic = contactType === 'partner' || contactType === 'potential_date'

  // Extract bio from pre-generated data
  const preGenBio = extractContactBio(preGen)
  const bio: SocialBio = {
    background: preGenBio.background,
    careerNarrative: preGenBio.careerNarrative,
    anecdotes: preGenBio.anecdotes,
    personalityDescription: preGenBio.personalityDescription,
    lifeSituation: preGenBio.lifeSituation
  }

  // Portrait from pre-gen or fallback
  const portraitId = getPreGenPortrait(preGen.id)
    || assignGenderMatchedPortrait(gender, contactType).portraitId

  return {
    id: preGen.id,
    name: preGen.name,
    type: contactType,
    traits: preGen.traits?.slice(0, 4) || generateMixedTraits(3),
    bio,
    relationshipLevel: contactType === 'rival' ? 20 : 30,
    affectionMeter: isRomantic ? 40 : 30,
    romanceMeter: isRomantic ? 30 : 0,
    trustMeter: contactType === 'rival' ? 20 : 40,
    currentMood: createPositiveMood(),
    isOnline: Math.random() > 0.5,
    lastSeen: 'Just now',
    isFavorite: false,
    metAt,
    metWeek,
    metYear,
    datingStatus: isRomantic ? 'stranger' : undefined,
    portraitId,
    gender
  }
}

/**
 * Asynchronously upgrade a contact's bio with AI-generated content
 * Call after contact creation to replace template bio with richer AI version
 */
export async function upgradeContactBioWithAI(
  contact: ContactInfo & { portraitId?: string; gender?: Gender },
  extraContext?: { occupation?: string; nationality?: string; age?: number; interests?: string[] }
): Promise<SocialBio> {
  const bioContext: SocialBioContext = {
    name: contact.name,
    age: extraContext?.age || 30,
    gender: contact.gender,
    occupation: extraContext?.occupation,
    nationality: extraContext?.nationality,
    traits: contact.traits,
    interests: extraContext?.interests,
    contactType: contact.type,
    metAt: contact.metAt
  }
  return generateSocialBio(bioContext)
}

/**
 * Generate a potential date (more detailed info).
 * Tries pre-generated Content Studio partner data first, falls back to runtime generation.
 * Includes a template-based bio immediately, with async AI upgrade available.
 */
export function generatePotentialDate(
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number,
  playerAge: number
): PotentialDate & { portraitId: string; gender: Gender } {
  // ── Try pre-generated partner pool first (dates use partner profiles) ──
  if (isContentLoaded()) {
    const preGen = getRandomPartnerByGender(gender)
    if (preGen) {
      return buildDateFromPreGen(preGen, gender, metAt, metWeek, metYear, playerAge)
    }
  }

  // ── Fallback: runtime generation (original logic) ──
  const { firstName, lastName } = generateName(gender)
  const { portraitId } = assignGenderMatchedPortrait(gender, 'potential_date')
  
  const ageDiff = Math.floor(Math.random() * 15) - 7
  const age = Math.max(21, Math.min(55, playerAge + ageDiff))
  
  const occupation = getRandomItem(OCCUPATIONS)
  const nationality = getRandomItem(NATIONALITIES)
  const traits = generateMixedTraits(4 + Math.floor(Math.random() * 2))
  const interests = getRandomItems(INTERESTS, 5 + Math.floor(Math.random() * 3))
  const name = `${firstName} ${lastName}`
  
  const bioContext: SocialBioContext = {
    name,
    age,
    gender,
    occupation,
    nationality,
    traits,
    interests,
    contactType: 'potential_date',
    metAt
  }
  const bio = generateFallbackSocialBio(bioContext)
  
  const chemistryRoll = Math.random()
  let interestLevel: number
  let compatibilityScore: number
  if (chemistryRoll < 0.3) {
    interestLevel = 10 + Math.floor(Math.random() * 25)
    compatibilityScore = 20 + Math.floor(Math.random() * 30)
  } else if (chemistryRoll < 0.6) {
    interestLevel = 35 + Math.floor(Math.random() * 30)
    compatibilityScore = 40 + Math.floor(Math.random() * 30)
  } else {
    interestLevel = 65 + Math.floor(Math.random() * 35)
    compatibilityScore = 60 + Math.floor(Math.random() * 40)
  }
  
  return {
    id: generateId('date'),
    firstName,
    lastName,
    age,
    occupation,
    nationality,
    traits,
    interests,
    bio,
    compatibilityScore,
    interestLevel,
    metAt,
    metWeek,
    metYear,
    conversationStage: 'stranger',
    portraitId,
    gender
  }
}

/**
 * Build a PotentialDate from a pre-generated partner profile.
 */
function buildDateFromPreGen(
  preGen: PreGenPartnerProfile,
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number,
  playerAge: number
): PotentialDate & { portraitId: string; gender: Gender } {
  const nameParts = preGen.name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Unknown'

  const preGenBio = extractPartnerBio(preGen)
  const bio: SocialBio = {
    background: preGenBio.background,
    careerNarrative: preGenBio.careerNarrative,
    anecdotes: preGenBio.anecdotes,
    personalityDescription: preGenBio.personalityDescription,
    lifeSituation: preGenBio.lifeSituation
  }

  const portraitId = getPreGenPortrait(preGen.id)
    || assignGenderMatchedPortrait(gender, 'potential_date').portraitId

  // Chemistry from seeded randomness
  const chemistryRoll = Math.random()
  let interestLevel: number
  let compatibilityScore: number
  if (chemistryRoll < 0.3) {
    interestLevel = 10 + Math.floor(Math.random() * 25)
    compatibilityScore = 20 + Math.floor(Math.random() * 30)
  } else if (chemistryRoll < 0.6) {
    interestLevel = 35 + Math.floor(Math.random() * 30)
    compatibilityScore = 40 + Math.floor(Math.random() * 30)
  } else {
    interestLevel = 65 + Math.floor(Math.random() * 35)
    compatibilityScore = 60 + Math.floor(Math.random() * 40)
  }

  return {
    id: preGen.id,
    firstName,
    lastName,
    age: preGen.age,
    occupation: preGen.career?.replace(/_/g, ' ') || getRandomItem(OCCUPATIONS),
    nationality: preGen.nationality,
    traits: preGen.traits?.slice(0, 5) || generateMixedTraits(4),
    interests: preGen.interests?.slice(0, 7) || getRandomItems(INTERESTS, 5),
    bio,
    compatibilityScore,
    interestLevel,
    metAt,
    metWeek,
    metYear,
    conversationStage: 'stranger',
    portraitId,
    gender
  }
}

/**
 * Build a friend/business ContactInfo from a partner pool profile.
 * Can replace an existing starter slot: set type to match the slot and romanticEligible
 * only when the profile's gender matches the player's orientation (otherwise they're just a normal contact).
 */
export function buildFriendFromPartnerPool(
  preGen: PreGenPartnerProfile,
  metWeek: number,
  metYear: number,
  options?: { type?: 'friend' | 'business'; romanticEligible?: boolean }
): { contact: ContactInfo & { portraitId: string; gender: Gender }; conversation: Conversation } {
  const gender: Gender = preGen.gender as Gender
  const nameParts = preGen.name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Unknown'
  const contactType = options?.type ?? 'friend'
  const romanticEligible = options?.romanticEligible ?? true

  const preGenBio = extractPartnerBio(preGen)
  const bio: SocialBio = {
    background: preGenBio.background,
    careerNarrative: preGenBio.careerNarrative,
    anecdotes: preGenBio.anecdotes,
    personalityDescription: preGenBio.personalityDescription,
    lifeSituation: preGenBio.lifeSituation
  }

  const portraitId = getPreGenPortrait(preGen.id)
    || assignGenderMatchedPortrait(gender, contactType).portraitId

  const occupation = preGen.career?.replace(/_/g, ' ') || getRandomItem(OCCUPATIONS)

  const contact: ContactInfo & { portraitId: string; gender: Gender } = {
    id: `starter_${contactType}_${preGen.id}`,
    name: preGen.name,
    type: contactType,
    traits: preGen.traits?.slice(0, 4) || generateMixedTraits(3),
    bio,
    
    // Standard friend meters — romance starts at zero (hidden)
    relationshipLevel: 30,
    affectionMeter: 30,
    romanceMeter: 0,
    trustMeter: 40,
    currentMood: createPositiveMood(),
    
    isOnline: Math.random() > 0.4,
    lastSeen: 'Recently',
    isFavorite: false,
    metAt: preGen.meetingContext || 'Through mutual friends before your racing career',
    metWeek,
    metYear,
    portraitId,
    gender,
    isStarterContact: true,
    
    // ── Emergent romance: only true when gender matches player's orientation ──
    romanticEligible: romanticEligible ? true : undefined,
    partnerPoolId: preGen.id,
    pregenId: preGen.id,
    
    // ── Carry over partner-pool data (stored but not displayed until romance activates) ──
    nationality: preGen.nationality,
    age: preGen.age,
    occupation,
    interests: preGen.interests?.slice(0, 7) || [],
    educationLevel: preGen.educationLevel,
    wealthLevel: preGen.wealthLevel,
    socialCircle: preGen.socialCircle,
    desires: preGen.desires ? {
      wantsChildren: preGen.desires.wantsChildren,
      desiredChildrenCount: preGen.desires.desiredChildrenCount,
      wantsMarriage: preGen.desires.wantsMarriage,
      lifestyleExpectations: preGen.desires.lifestyleExpectations,
      qualityTimeImportance: preGen.desires.qualityTimeImportance,
      socialLifeImportance: preGen.desires.socialLifeImportance,
      privacyImportance: preGen.desires.privacyImportance,
    } : undefined,
    dealBreakers: preGen.dealBreakers,
    loveLanguage: preGen.loveLanguage,
    firstImpression: preGen.firstImpression,
    style: preGen.style,
    
    // ── Conversation topics based on their occupation and interests ──
    conversationTopics: [
      occupation,
      ...(preGen.interests?.slice(0, 3) || []),
      'lifestyle', 'mutual friends'
    ],
  }

  // Create a natural intro conversation
  const introMessages = [
    `Hey! Great to have you on here. Been meaning to catch up — how's everything going with the racing?`,
    `So glad we're connected! I've been following your racing career from afar. Would love to hear more about it sometime.`,
    `Hey ${firstName}! It's been a while. How's life treating you? I saw something about your team the other day.`,
  ]
  const introMsg = introMessages[Math.floor(Math.random() * introMessages.length)]
  const conversation = createConversation(contact, introMsg, metWeek, metYear)

  return { contact, conversation }
}

/**
 * Asynchronously upgrade a potential date's bio with AI-generated content
 */
export async function upgradeDateBioWithAI(
  date: PotentialDate & { gender?: Gender }
): Promise<SocialBio> {
  const bioContext: SocialBioContext = {
    name: `${date.firstName} ${date.lastName}`,
    age: date.age,
    gender: date.gender,
    occupation: date.occupation,
    nationality: date.nationality,
    traits: date.traits,
    interests: date.interests,
    contactType: 'potential_date',
    metAt: date.metAt
  }
  return generateSocialBio(bioContext)
}

// ============================================
// ENCOUNTER SYSTEM
// ============================================

/**
 * Determine what gender a romantic encounter should be based on dating preference
 */
function getGenderForRomanticEncounter(datingPreference?: DatingPreference): Gender | null {
  if (!datingPreference || datingPreference === 'none') return null
  if (datingPreference === 'men') return 'male'
  if (datingPreference === 'women') return 'female'
  // 'both' - random
  return Math.random() > 0.5 ? 'male' : 'female'
}

/**
 * Roll for chemistry outcome when a romantic encounter fires
 * Not everyone will be romantically interested - some just want to be friends
 */
function rollChemistry(): 'mutual_interest' | 'just_friends' | 'one_sided' | 'no_chemistry' {
  const roll = Math.random()
  if (roll < 0.40) return 'mutual_interest'   // 40% - genuine mutual romantic interest
  if (roll < 0.70) return 'just_friends'       // 30% - they'd rather be friends
  if (roll < 0.90) return 'one_sided'          // 20% - one-sided, could be won over
  return 'no_chemistry'                         // 10% - no spark at all
}

/**
 * Roll for an encounter at an event
 * Returns a new contact if successful, null otherwise
 * Now supports dating preferences and romantic rejection
 */
export function rollEventEncounter(
  eventType: EventType,
  playerStats: {
    fame: number // 0-100
    publicImage: number // 0-100
    hasPartner: boolean
    playerAge: number
    datingPreference?: DatingPreference
    preferredGender?: Gender // Legacy support
  },
  currentWeek: number,
  currentYear: number
): EncounterResult {
  const config = ENCOUNTER_CONFIG[eventType]
  
  // Calculate encounter chance
  let chance = config.baseChance
  chance += (playerStats.fame * config.fameMultiplier)
  chance += (playerStats.publicImage * 0.002) // Slight bonus from public image
  
  // Cap at 90%
  chance = Math.min(0.9, chance)
  
  // Roll for encounter
  if (Math.random() > chance) {
    return {
      success: false,
      metAt: getEventDisplayName(eventType)
    }
  }
  
  // Determine contact type
  let contactType = getRandomItem(config.contactTypes)
  
  // Determine dating preference (new system, falls back to legacy)
  const datingPref = playerStats.datingPreference || 
    (playerStats.preferredGender === 'male' ? 'men' : 
     playerStats.preferredGender === 'female' ? 'women' : 'both')
  
  // Check if this should be a romantic encounter
  const canBeRomantic = !playerStats.hasPartner && 
    datingPref !== 'none' &&
    config.romanticChance && 
    Math.random() < config.romanticChance
  
  let chemistryOutcome: EncounterResult['chemistryOutcome'] = undefined
  
  if (canBeRomantic) {
    // Roll chemistry to see if they're actually interested romantically
    chemistryOutcome = rollChemistry()
    
    if (chemistryOutcome === 'mutual_interest' || chemistryOutcome === 'one_sided') {
      contactType = 'potential_date'
    } else {
      // Chemistry didn't click romantically - they become a friend instead
      contactType = 'friend'
    }
  }
  
  // Determine gender
  let gender: Gender
  if (contactType === 'potential_date') {
    const romanticGender = getGenderForRomanticEncounter(datingPref)
    gender = romanticGender || (Math.random() > 0.5 ? 'male' : 'female')
  } else {
    // Random gender for non-romantic contacts
    gender = Math.random() > 0.5 ? 'male' : 'female'
  }
  
  const metAt = getEventDisplayName(eventType)
  
  // Generate the contact
  const contact = generateNewContact(
    contactType,
    gender,
    metAt,
    currentWeek,
    currentYear
  )
  
  // Generate intro message
  const introMessages = INTRO_MESSAGES[contactType]
  const introMessage = getRandomItem(introMessages)
  
  return {
    success: true,
    contact,
    introMessage,
    metAt,
    chemistryOutcome
  }
}

function getEventDisplayName(eventType: EventType): string {
  const names: Record<EventType, string> = {
    gala: 'Charity Gala',
    paddock_social: 'Paddock Social Event',
    sponsor_meeting: 'Sponsor Meeting',
    race_incident: 'Race Weekend',
    contract_negotiation: 'Contract Meeting',
    social_scene: 'Social Outing',
    team_celebration: 'Team Celebration',
    media_event: 'Media Event'
  }
  return names[eventType]
}

// ============================================
// AUTOMATIC CONTACT SYNC
// ============================================

/**
 * Create a contact from an existing partner
 */
export function createContactFromPartner(partner: Partner): ContactInfo & { portraitId: string; gender: Gender } {
  // Use partner's actual gender if available, fall back to a sensible default
  const gender: Gender = (partner as any).gender || 'female'
  const portraitId = partner.id || `${partner.firstName}-${partner.lastName}`.toLowerCase()
  
  // Calculate relationship level from relationship status
  const relationshipLevel = partner.relationshipStatus === 'married' ? 95 :
                           partner.relationshipStatus === 'engaged' ? 85 :
                           partner.relationshipStatus === 'dating' ? 70 : 60
  
  // Avoid double-prefixing: partner.id may already start with 'partner_'
  const rawId = partner.id || generateId('p')
  const contactId = rawId.startsWith('partner_') ? rawId : `partner_${rawId}`
  
  return {
    id: contactId,
    name: `${partner.firstName} ${partner.lastName}`,
    type: 'partner',
    traits: partner.traits || ['supportive', 'loving'],
    relationshipLevel,
    affectionMeter: partner.happiness || 75,
    romanceMeter: partner.loveLevel || 70,
    trustMeter: partner.trustLevel || 80,
    currentMood: createDefaultMood(),
    isOnline: true,
    lastSeen: 'Now',
    isFavorite: true,
    portraitId,
    gender
  }
}

/**
 * Create a contact from a child (if old enough)
 */
export function createContactFromChild(child: Child, currentYear: number): (ContactInfo & { portraitId: string; gender: Gender }) | null {
  // Calculate age from birthDate
  const birthYear = child.birthDate?.year || (currentYear - child.age)
  const age = currentYear - birthYear
  
  // Children need to be at least 10 to have a phone
  if (age < 10) {
    return null
  }
  
  const gender = (child.gender === 'male' ? 'male' : child.gender === 'female' ? 'female' : 'male') as Gender
  const portraitId = child.id || `child-${child.firstName}`.toLowerCase()
  
  return {
    id: `child_${child.id || generateId('c')}`,
    name: child.firstName,
    type: 'family',
    traits: child.traits || ['loving'],
    relationshipLevel: child.bondLevel || 90,
    affectionMeter: 90,
    romanceMeter: 0,
    trustMeter: 95,
    currentMood: createDefaultMood(),
    isOnline: age >= 13, // Teens are always online lol
    lastSeen: age >= 13 ? 'Online' : 'Yesterday',
    isFavorite: true,
    portraitId,
    gender
  }
}

/**
 * Sync automatic contacts from career state
 * Returns contacts that should always exist based on game state
 */
export function syncAutomaticContacts(
  careerState: CareerState,
  existingContacts: ContactInfo[]
): ContactInfo[] {
  const automaticContacts: ContactInfo[] = []
  const existingIds = new Set(existingContacts.map(c => c.id))
  
  // Add partner if exists
  const personalLife = careerState.personalLife
  if (personalLife?.family?.partner) {
    const partnerContact = createContactFromPartner(personalLife.family.partner)
    if (!existingIds.has(partnerContact.id)) {
      automaticContacts.push(partnerContact)
    }
  }
  
  // Add children if old enough
  if (personalLife?.family?.children) {
    for (const child of personalLife.family.children) {
      const childContact = createContactFromChild(child, careerState.currentYear)
      if (childContact && !existingIds.has(childContact.id)) {
        automaticContacts.push(childContact)
      }
    }
  }
  
  // ── Add PA (Julia Green) as a phone contact ──
  if (personalLife?.staff) {
    const paStaff = (personalLife.staff as Array<{ id: string; name: string; role: string }>)
      .find(s => s.role === 'personal_assistant')
    if (paStaff) {
      // Avoid double-prefixing: staff ID may already start with 'pa_'
      const rawId = paStaff.id || 'julia_green'
      const paContactId = rawId.startsWith('pa_') ? rawId : `pa_${rawId}`
      if (!existingIds.has(paContactId)) {
        const paContact: ContactInfo = {
          id: paContactId,
          name: paStaff.name || 'Julia Green',
          type: 'business',
          traits: ['organized', 'friendly', 'reliable'],
          gender: 'female',
          occupation: 'Personal Assistant',
          age: 28,
          bio: generateFallbackSocialBio({
            name: paStaff.name || 'Julia Green',
            age: 28,
            gender: 'female',
            contactType: 'business',
            occupation: 'Personal Assistant',
            traits: ['organized', 'friendly', 'reliable'],
            nationality: 'British',
            metAt: 'your team',
          }),
          relationshipLevel: 70,
          affectionMeter: 60,
          romanceMeter: 0,
          trustMeter: 80,
          currentMood: 'friendly' as NpcMood,
          isOnline: true,
          isFavorite: true,
          metAt: 'Hired as your PA',
          metWeek: 1,
          metYear: careerState.currentYear,
          staffRole: 'personal_assistant',
          messagingStyle: {
            frequency: 'medium',
            messageLength: 'medium',
            emojiUsage: 'moderate',
            responseSpeed: 'fast',
            formality: 'casual',
          },
        }
        automaticContacts.push(paContact)
        existingIds.add(paContactId)
      }
    }
  }
  
  // ── Add key team staff as contacts ──
  if (careerState.ownedTeam?.staff) {
    // Add top staff: Team Principal, Chief Engineer, etc.
    const keyRoles = ['team_principal', 'chief_engineer', 'technical_director', 'race_engineer', 'strategist', 'sporting_director']
    for (const staff of careerState.ownedTeam.staff) {
      if (keyRoles.includes(staff.role) || (careerState.ownedTeam.staff.length <= 6)) {
        const staffContactId = `staff_${staff.id || staff.name.toLowerCase().replace(/\s+/g, '_')}`
        if (!existingIds.has(staffContactId)) {
          const staffContact = createContactFromStaff(
            { id: staffContactId, name: staff.name, role: staff.role, nationality: (staff as any).nationality },
            careerState.currentWeek,
            careerState.currentYear
          )
          staffContact.id = staffContactId
          automaticContacts.push(staffContact)
        }
      }
    }
  }
  
  // ── Add active sponsor representatives as contacts ──
  if (careerState.ownedTeam?.sponsorDeals || (careerState as any).sponsorDeals) {
    const deals = careerState.ownedTeam?.sponsorDeals || (careerState as any).sponsorDeals || []
    for (const deal of deals.slice(0, 5)) { // Cap at 5 sponsor contacts
      const sponsorContactId = `sponsor_rep_${deal.id || deal.sponsorId}`
      if (!existingIds.has(sponsorContactId)) {
        const repName = deal.repName || `${deal.sponsorName || deal.name || 'Sponsor'} Rep`
        const sponsorContact = createContactFromSponsorDeal(
          {
            id: deal.id || deal.sponsorId || `sp_${Math.random().toString(36).substr(2, 5)}`,
            name: deal.sponsorName || deal.name || 'Sponsor',
            tier: deal.tier || 'minor',
            category: (deal as any).category || 'automotive',
          },
          repName,
          careerState.currentWeek,
          careerState.currentYear
        )
        sponsorContact.id = sponsorContactId
        automaticContacts.push(sponsorContact)
      }
    }
  }
  
  // ── Add rival drivers from entered series ──
  if (careerState.seriesEntries) {
    // Get drivers from rival store if available
    try {
      const rivalStore = (window as any).__rivalStore
      if (rivalStore?.rivals) {
        for (const rival of rivalStore.rivals.slice(0, 6)) { // Top 6 rivals
          const rivalContactId = `rival_${rival.id}`
          if (!existingIds.has(rivalContactId)) {
            const rivalContact = createContactFromRival(
              {
                id: rival.id,
                firstName: rival.firstName || rival.name?.split(' ')[0] || 'Driver',
                lastName: rival.lastName || rival.name?.split(' ').slice(1).join(' ') || '',
                nationality: rival.nationality || 'Unknown',
                age: rival.age || 25,
                personality: rival.personality || 'balanced',
                careerStage: rival.careerStage || 'mid-career',
                currentTeamId: rival.currentTeamId || rival.teamId || '',
                currentSeriesId: rival.currentSeriesId || rival.seriesId || '',
              },
              rival.teamName || 'Unknown Team',
              rival.seriesName || 'Unknown Series',
              careerState.currentWeek,
              careerState.currentYear
            )
            rivalContact.id = rivalContactId
            automaticContacts.push(rivalContact)
          }
        }
      }
    } catch {
      // Rival store not available yet
    }
  }
  
  return [...existingContacts, ...automaticContacts]
}

// ============================================
// CONVERSATION CREATION
// ============================================

/**
 * Create a new conversation for a contact with an intro message
 */
export function createConversation(
  contact: ContactInfo,
  introMessage: string,
  currentWeek: number,
  currentYear: number,
  currentDay?: number,
  currentHour?: number
): Conversation {
  // For Week 1, the starting day depends on what day Jan 1 falls on (e.g. Thursday=4 for 2026).
  // Ensure message timestamps only use days that actually exist in the week.
  const jan1 = new Date(currentYear, 0, 1)
  const jan1DayOfWeek = jan1.getDay() === 0 ? 7 : jan1.getDay()
  const firstDayInWeek = currentWeek === 1 ? jan1DayOfWeek : 1
  const dayRange = 7 - firstDayInWeek + 1  // number of valid days in this week
  const msgDay = currentDay ?? (firstDayInWeek + Math.floor(Math.random() * dayRange))

  // Message hour: if a current game hour is provided, place the message slightly before it
  // so it never appears in the future. For career-start messages (currentHour=7),
  // this gives ~6:00-6:45 AM ("messages you woke up to").
  // If no currentHour is given, use a random reasonable hour.
  const msgHour = currentHour != null
    ? Math.max(5, currentHour - 1) + Math.random() * 0.75
    : 8 + Math.floor(Math.random() * 10)  // 8 AM - 5 PM for runtime

  const message: TextMessage = {
    id: generateId('msg'),
    conversationId: `conv_${contact.id}`,
    sender: 'npc',
    content: introMessage,
    tone: contact.type === 'potential_date' ? 'friendly' : 'casual',
    timestamp: { 
      week: currentWeek, 
      day: msgDay,
      hour: msgHour,
      year: currentYear 
    },
    isRead: false
  }
  
  return {
    id: `conv_${contact.id}`,
    contactId: contact.id,
    contactName: contact.name,
    contactType: mapContactTypeToConversationCategory(contact.type),
    isActive: true,
    lastMessageTime: { week: currentWeek, day: msgDay, year: currentYear },
    unreadCount: 1,
    messages: [message],
    relationshipLevel: contact.relationshipLevel,
    currentMood: contact.currentMood,
    awaitingResponse: true,
    conversationStage: 'new'
  }
}

function mapContactTypeToConversationCategory(type: ContactType): 'romantic' | 'family' | 'business' | 'social' | 'media' | 'rival' {
  switch (type) {
    case 'partner':
    case 'potential_date':
      return 'romantic'
    case 'family':
      return 'family'
    case 'business':
      return 'business'
    case 'rival':
      return 'rival'
    default:
      return 'social'
  }
}

// ============================================
// STARTER CONTACTS GENERATION
// ============================================

import type { StarterContactArchetype, RelationshipStatusOption } from '@/data/starter-contacts-config'
import type { Partner as FamilyPartner, PartnerCareer, PartnerOrigin, RelationshipStatus } from '@/data/family-config'

export interface StarterContactSelection {
  archetype: StarterContactArchetype
  enabled: boolean
  customFirstName?: string
  customLastName?: string
}

export interface PartnerCreationConfig {
  firstName: string
  gender: Gender
  traits: string[]                         // Trait IDs from PARTNER_TRAIT_OPTIONS
  relationshipStatus: 'dating' | 'married'
}

/**
 * Map archetype descriptions to pre-gen contact pool contactType values.
 * This lets us find a pre-generated profile that fits the narrative role.
 */
export const ARCHETYPE_TO_POOL_TYPE: Record<string, string[]> = {
  // ── Self-made background ──
  'sm_business_partner': ['business_mogul', 'tech_entrepreneur', 'banker'],
  'sm_accountant': ['banker', 'lawyer', 'business_mogul'],
  'sm_racing_club': ['athlete', 'pilot', 'journalist'],
  'sm_former_employee': ['influencer', 'tech_entrepreneur', 'journalist'],
  // ── Racing dynasty ──
  'rd_family_friend': ['business_mogul', 'diplomat', 'philanthropist'],
  'rd_childhood_friend': ['athlete', 'influencer', 'journalist'],
  'rd_journalist': ['journalist', 'influencer', 'film_director'],
  'rd_family_lawyer': ['lawyer', 'banker', 'business_mogul'],
  'rd_mechanic': ['tech_entrepreneur', 'architect', 'pilot'],
  // ── Tech investor ──
  'ti_cofounder': ['tech_entrepreneur', 'business_mogul', 'architect'],
  'ti_vc_partner': ['banker', 'business_mogul', 'tech_entrepreneur'],
  'ti_tech_journo': ['journalist', 'influencer', 'film_director'],
  'ti_college_friend': ['tech_entrepreneur', 'professor', 'artist'],
  // ── Former driver ──
  'fd_teammate': ['athlete', 'influencer', 'pilot'],
  'fd_engineer': ['tech_entrepreneur', 'professor', 'architect'],
  'fd_agent': ['agent', 'business_mogul', 'lawyer'],
  'fd_fan_organizer': ['influencer', 'journalist', 'musician'],
  'fd_journalist': ['journalist', 'influencer', 'film_director'],
  // ── Finance mogul ──
  'fm_banker': ['banker', 'business_mogul', 'tech_entrepreneur'],
  'fm_lawyer': ['lawyer', 'banker', 'diplomat'],
  'fm_golf_friend': ['business_mogul', 'politician', 'philanthropist'],
  'fm_advisor': ['banker', 'business_mogul', 'lawyer'],
  // ── Passionate enthusiast ──
  'pe_best_friend': ['athlete', 'musician', 'pilot'],
  'pe_mechanic': ['tech_entrepreneur', 'architect', 'business_mogul'],
  'pe_forum_friend': ['influencer', 'journalist', 'tech_entrepreneur'],
  'pe_family_member': ['professor', 'doctor', 'philanthropist'],
  // ── Corporate executive ──
  'ce_assistant': ['business_mogul', 'tech_entrepreneur', 'diplomat'],
  'ce_board_colleague': ['business_mogul', 'politician', 'banker'],
  'ce_industry_contact': ['business_mogul', 'tech_entrepreneur', 'diplomat'],
  'ce_club_friend': ['philanthropist', 'business_mogul', 'politician'],
  'ce_pr_consultant': ['journalist', 'influencer', 'film_director'],
  // ── Lottery winner ──
  'lw_best_friend': ['athlete', 'musician', 'artist'],
  'lw_cousin': ['doctor', 'professor', 'philanthropist'],
  'lw_financial_advisor': ['banker', 'business_mogul', 'lawyer'],
  'lw_neighbor': ['business_mogul', 'artist', 'chef'],
}

/**
 * Generate full ContactInfo objects from selected starter contact archetypes.
 * NOW pulls from the pre-generated contact pool (600 profiles) instead of
 * using hardcoded name arrays. Falls back to archetype defaults if pool unavailable.
 */
export function generateStarterContacts(
  selections: StarterContactSelection[],
  currentWeek: number,
  currentYear: number,
  /** Pre-selected profiles (from career creation UI reroll). If provided, uses these instead of picking new ones. */
  preSelectedProfiles?: (PreGenContactProfile | null)[]
): { contacts: ContactInfo[]; conversations: Record<string, Conversation> } {
  const contacts: ContactInfo[] = []
  const conversations: Record<string, Conversation> = {}

  for (let selIdx = 0; selIdx < selections.length; selIdx++) {
    const sel = selections[selIdx]
    if (!sel.enabled) continue
    const arch = sel.archetype

    // ── Use pre-selected profile if provided, otherwise try to pull from pool ──
    let preGen: PreGenContactProfile | null = preSelectedProfiles?.[selIdx] ?? null
    
    if (!preGen && isContentLoaded()) {
      const poolTypes = ARCHETYPE_TO_POOL_TYPE[arch.id] || []
      // Try each preferred pool type until we find an unused profile
      for (const poolType of poolTypes) {
        preGen = getRandomContactByGender(arch.gender, poolType)
        if (preGen) break
      }
      // Fallback: any contact of the right gender
      if (!preGen) {
        preGen = getRandomContactByGender(arch.gender)
      }
    }

    // Build contact from pre-gen profile or fall back to archetype defaults
    const name = preGen ? preGen.name : `${sel.customFirstName || arch.defaultFirstName} ${sel.customLastName || arch.defaultLastName}`
    const age = preGen ? preGen.age : arch.ageRange[0] + Math.floor(Math.random() * (arch.ageRange[1] - arch.ageRange[0]))

    const { portraitId } = assignGenderMatchedPortrait(arch.gender, arch.type, preGen?.id)

    const bio: SocialBio = preGen ? extractContactBio(preGen) : generateFallbackSocialBio({
      name,
      age,
      gender: arch.gender,
      occupation: arch.occupation,
      traits: arch.traits,
      contactType: arch.type,
      metAt: 'Before your racing career'
    } as SocialBioContext)

    const contact: ContactInfo & { portraitId: string; gender: Gender } = {
      id: preGen ? `starter_${preGen.id}` : `starter_${arch.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type: arch.type,
      traits: preGen?.traits?.length ? preGen.traits : arch.traits,
      bio,
      relationshipLevel: arch.startingRelationshipLevel,
      affectionMeter: arch.startingAffectionLevel,
      romanceMeter: 0,
      trustMeter: arch.startingTrustLevel,
      currentMood: createPositiveMood(),
      isOnline: Math.random() > 0.4,
      lastSeen: 'Recently',
      isFavorite: false,
      metAt: preGen?.meetingContext || 'Before your racing career',
      metWeek: currentWeek,
      metYear: currentYear,
      portraitId,
      gender: arch.gender,
      isStarterContact: true,
      // ── Populate rich fields from pre-gen data ──
      ...(preGen ? {
        nationality: preGen.nationality,
        age: preGen.age,
        occupation: arch.occupation,  // Always use archetype role, not pre-gen pool type
        personalitySummary: preGen.personalitySummary,
        interests: preGen.interests,
        conversationTopics: preGen.conversationTopics,
        canHelp: preGen.canHelp,
        connectionToMotorsport: preGen.connectionToMotorsport,
        educationLevel: preGen.educationLevel,
        wealthLevel: preGen.wealthLevel,
        socialCircle: preGen.socialCircle,
        pregenId: preGen.id,
      } : {}),
    }

    contacts.push(contact)

    // Create initial conversation with the intro message
    // Pass hour=7 (day start) so messages appear as "received before your day started"
    const conv = createConversation(contact, arch.introMessage, currentWeek, currentYear, undefined, 7)
    conversations[conv.id] = conv
  }

  return { contacts, conversations }
}

/**
 * Map a pre-gen partner's career string to the PartnerCareer union.
 */
function mapPreGenCareerToPartnerCareer(careerStr: string): PartnerCareer {
  const lc = careerStr.toLowerCase()
  if (lc.includes('model') || lc.includes('fashion')) return 'model'
  if (lc.includes('athlet') || lc.includes('fitness') || lc.includes('trainer')) return 'athlete'
  if (lc.includes('business') || lc.includes('ceo') || lc.includes('executive') || lc.includes('venture') || lc.includes('marketing')) return 'business_exec'
  if (lc.includes('doctor') || lc.includes('surgeon') || lc.includes('medical')) return 'doctor'
  if (lc.includes('lawyer') || lc.includes('attorney') || lc.includes('legal')) return 'lawyer'
  if (lc.includes('journalist') || lc.includes('writer') || lc.includes('editor')) return 'journalist'
  if (lc.includes('engineer') || lc.includes('software') || lc.includes('tech')) return 'engineer'
  if (lc.includes('artist') || lc.includes('painter') || lc.includes('photographer') || lc.includes('film') || lc.includes('director')) return 'artist'
  if (lc.includes('scientist') || lc.includes('professor') || lc.includes('researcher')) return 'scientist'
  if (lc.includes('socialite') || lc.includes('actor') || lc.includes('actress') || lc.includes('celebrity')) return 'socialite'
  if (lc.includes('racing') || lc.includes('driver') || lc.includes('motorsport')) return 'racing_driver'
  return 'entrepreneur'
}

/**
 * Generate a Partner object from career creation partner configuration.
 * NOW pulls from the pre-generated partner pool (500 profiles) instead of
 * using random name arrays. Falls back to random generation if pool unavailable.
 */
export function generateStarterPartner(
  config: PartnerCreationConfig,
  currentYear: number,
  /** Pre-selected partner profile (from career creation UI reroll). If provided, uses this instead of picking new. */
  preSelectedPartner?: PreGenPartnerProfile | null
): FamilyPartner {
  // ── Use pre-selected partner if provided, otherwise try to pull from pool ──
  const preGen: PreGenPartnerProfile | null = preSelectedPartner !== undefined
    ? preSelectedPartner
    : (isContentLoaded() ? getRandomPartnerByGender(config.gender) : null)

  const firstName = preGen ? preGen.name.split(' ')[0] : config.firstName
  const lastName = preGen ? (preGen.name.split(' ').slice(1).join(' ') || getRandomItem(LAST_NAMES)) : getRandomItem(LAST_NAMES)
  const age = preGen ? preGen.age : (25 + Math.floor(Math.random() * 12))
  const nationality = preGen ? preGen.nationality : getRandomItem(NATIONALITIES)

  // Map career creation traits to partner trait IDs
  const partnerTraitIds = preGen?.traits?.length
    ? preGen.traits
    : (config.traits.length > 0 ? config.traits : ['supportive'])

  // Determine career type from pre-gen or fall back to random occupation
  const career: PartnerCareer = preGen
    ? mapPreGenCareerToPartnerCareer(preGen.career || '')
    : 'entrepreneur'

  const relationshipStatus: RelationshipStatus = config.relationshipStatus === 'married' ? 'married' : 'dating'
  const metYear = currentYear - (config.relationshipStatus === 'married' ? 3 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 2))

  return {
    id: preGen ? `partner_pregen_${preGen.id}` : `partner_starter_${Date.now()}`,
    firstName,
    lastName,
    age,
    nationality,
    origin: 'social_circle' as PartnerOrigin,
    career,
    careerIncome: 3000 + Math.floor(Math.random() * 5000),
    traits: partnerTraitIds,
    relationshipStatus,
    relationshipStartDate: { week: 1, year: metYear },
    ...(config.relationshipStatus === 'married' ? {
      marriageDate: { week: 20 + Math.floor(Math.random() * 20), year: currentYear - 1 - Math.floor(Math.random() * 3) }
    } : {}),
    happiness: 75,
    loveLevel: config.relationshipStatus === 'married' ? 80 : 65,
    trustLevel: config.relationshipStatus === 'married' ? 85 : 60,
    compatibilityScore: 65 + Math.floor(Math.random() * 20),
    recentMoodFactors: [{
      reason: 'Excited about the new racing team',
      impact: 15,
      weeksRemaining: 8,
      category: 'career'
    }],
    childrenIds: [],
    desires: preGen?.desires ? {
      wantsChildren: preGen.desires.wantsChildren,
      desiredChildrenCount: preGen.desires.desiredChildrenCount,
      wantsMarriage: config.relationshipStatus !== 'married' && preGen.desires.wantsMarriage,
      lifestyleExpectations: preGen.desires.lifestyleExpectations || 'comfortable',
      qualityTimeImportance: preGen.desires.qualityTimeImportance,
      careerSupportImportance: 50 + Math.floor(Math.random() * 30),
      socialLifeImportance: preGen.desires.socialLifeImportance,
      privacyImportance: preGen.desires.privacyImportance,
    } : {
      wantsChildren: Math.random() > 0.3,
      desiredChildrenCount: 1 + Math.floor(Math.random() * 2),
      wantsMarriage: config.relationshipStatus !== 'married',
      lifestyleExpectations: 'comfortable',
      qualityTimeImportance: 60 + Math.floor(Math.random() * 30),
      careerSupportImportance: 50 + Math.floor(Math.random() * 30),
      socialLifeImportance: 40 + Math.floor(Math.random() * 40),
      privacyImportance: 30 + Math.floor(Math.random() * 40),
    },
    // ── Store pre-gen metadata for rich display ──
    ...(preGen ? {
      pregenId: preGen.id,
      bio: preGen.bio,
      interests: preGen.interests,
      style: preGen.style,
      educationLevel: preGen.educationLevel,
      wealthLevel: preGen.wealthLevel,
      socialCircle: preGen.socialCircle,
      loveLanguage: preGen.loveLanguage,
      meetingContext: preGen.meetingContext,
      firstImpression: preGen.firstImpression,
      dealBreakers: preGen.dealBreakers,
    } as Record<string, unknown> : {}),
  }
}

/**
 * Generate a ContactInfo for a starter partner so they appear in the messaging contacts.
 * Now enriched with pre-gen metadata if available (bio, interests, etc.).
 */
export function generateStarterPartnerContact(
  partner: FamilyPartner,
  partnerGender: Gender,
  currentWeek: number,
  currentYear: number
): { contact: ContactInfo; conversation: Conversation } {
  const gender: Gender = partnerGender
  const { portraitId } = assignGenderMatchedPortrait(gender, 'partner')

  const relationshipLevel = partner.relationshipStatus === 'married' ? 90 : 70
  const partnerAny = partner as FamilyPartner & Record<string, unknown>

  // If the partner was built from a pre-gen profile, grab the rich fields
  const pregenId = partnerAny.pregenId as string | undefined
  const preGenBio = partnerAny.bio as string | undefined
  
  // Avoid double-prefixing: partner.id may already start with 'partner_'
  const rawPartnerId = partner.id || generateId('p')
  const contactId = rawPartnerId.startsWith('partner_') ? rawPartnerId : `partner_${rawPartnerId}`

  const contact: ContactInfo & { portraitId: string; gender: Gender } = {
    id: contactId,
    name: `${partner.firstName} ${partner.lastName}`,
    type: 'partner',
    traits: partner.traits,
    relationshipLevel,
    affectionMeter: partner.happiness,
    romanceMeter: partner.loveLevel,
    trustMeter: partner.trustLevel,
    currentMood: createPositiveMood(),
    isOnline: true,
    lastSeen: 'Now',
    isFavorite: true,
    metAt: (partnerAny.meetingContext as string) || 'Before your racing career',
    metWeek: currentWeek,
    metYear: currentYear,
    portraitId,
    gender,
    nationality: partner.nationality,
    age: partner.age,
    occupation: partner.career?.replace(/_/g, ' '),
    // Rich pre-gen fields
    ...(pregenId ? {
      pregenId,
      interests: (partnerAny.interests as string[]) || [],
      personalitySummary: (partnerAny.firstImpression as string) || undefined,
      educationLevel: (partnerAny.educationLevel as string) || undefined,
      wealthLevel: (partnerAny.wealthLevel as string) || undefined,
      socialCircle: (partnerAny.socialCircle as string) || undefined,
      loveLanguage: (partnerAny.loveLanguage as string) || undefined,
      firstImpression: (partnerAny.firstImpression as string) || undefined,
      dealBreakers: (partnerAny.dealBreakers as string[]) || undefined,
      style: (partnerAny.style as string) || undefined,
      desires: partner.desires,
      bio: preGenBio ? {
        background: preGenBio,
        careerNarrative: `Works as a ${partner.career?.replace(/_/g, ' ') || 'professional'}`,
        personalityDescription: (partnerAny.firstImpression as string) || '',
        lifeSituation: (partnerAny.meetingContext as string) || '',
        anecdotes: ((partnerAny.interests as string[]) || []).slice(0, 3),
      } : undefined,
    } : {}),
  }

  const introMessage = partner.relationshipStatus === 'married'
    ? "Good luck today! I know this racing team is going to be amazing. I'm so proud of you! \u2764\ufe0f"
    : "Hey! So excited about the new team! I'll be cheering for you every step of the way \ud83d\ude0a"

  // Pass hour=7 (day start) so partner message appears as "received before your day started"
  const conversation = createConversation(contact, introMessage, currentWeek, currentYear, undefined, 7)

  return { contact, conversation }
}

// ============================================
// EXPORTS
// ============================================
// NEW CONTACT TYPES: Staff, Rivals, Sponsor Reps, Team Principals
// ============================================
// These factory functions create phone contacts from the various pre-gen pools
// and game state systems (staff roster, rival store, team narratives).

import {
  getStaffById,
  getStaffByName,
  extractStaffBio,
  type PreGenStaffProfile,
  type PreGenTeamNarrative
} from '@/services/preGeneratedContentService'
import { computeMessagingStyle } from '@/data/messaging-config'

/**
 * Create a phone contact from a team staff member.
 * Uses the pre-gen staff pool to get personality, quirks, and bio.
 */
export function createContactFromStaff(
  staff: { id: string; name: string; role: string; nationality?: string },
  currentWeek: number,
  currentYear: number
): ContactInfo {
  // Try to find the pre-gen profile for this staff member
  const preGen = getStaffByName(staff.name) || getStaffById(staff.id)
  
  const traits = preGen?.quirks || []
  const bio: SocialBio = preGen
    ? extractStaffBio(preGen)
    : generateFallbackSocialBio({
        name: staff.name,
        type: 'business',
        occupation: staff.role.replace(/_/g, ' '),
        traits: [],
        nationality: staff.nationality || 'Unknown',
        metAt: 'your team',
      })

  const contact: ContactInfo = {
    id: `staff-${staff.id}`,
    name: staff.name,
    type: 'team_staff',
    traits,
    gender: (preGen?.gender as 'male' | 'female') || undefined,
    nationality: preGen?.nationality || staff.nationality,
    age: preGen?.age,
    occupation: staff.role.replace(/_/g, ' '),
    bio,
    pregenId: preGen?.id,
    personalitySummary: preGen?.personality,
    staffRole: staff.role,
    staffPersonality: preGen?.personality,
    staffQuirks: preGen?.quirks,
    relationshipLevel: 55,  // Start with decent professional relationship
    affectionMeter: 30,
    romanceMeter: 0,
    trustMeter: 50,
    currentMood: { overall: 'neutral', energy: 'medium', receptiveness: 70, recentEvents: [] },
    metAt: `Hired at ${currentYear}`,
    metWeek: currentWeek,
    metYear: currentYear,
    messagingStyle: computeMessagingStyle(traits),
  }

  // Set portrait if available
  if (preGen?.imagePath) {
    contact.portraitId = preGen.imagePath
  }

  return contact
}

/**
 * Create a phone contact from a rival driver.
 * Uses the rivalry system data + driver narrative pool.
 */
export function createContactFromRival(
  rival: {
    id: string
    firstName: string
    lastName: string
    nationality: string
    age: number
    personality: string
    careerStage: string
    currentTeamId: string
    currentSeriesId: string
    totalWins?: number
    championships?: number
    narrative?: any
  },
  teamName: string,
  seriesName: string,
  currentWeek: number,
  currentYear: number
): ContactInfo {
  // Map rival personality to texting traits
  const personalityTraitMap: Record<string, string[]> = {
    aggressive: ['competitive', 'direct', 'bold', 'impatient'],
    calculating: ['analytical', 'measured', 'formal', 'patient'],
    flashy: ['dramatic', 'social_butterfly', 'extrovert', 'casual'],
    steady: ['practical', 'supportive', 'laid_back', 'reserved'],
    inconsistent: ['dramatic', 'anxious', 'extrovert', 'verbose'],
    defensive: ['cautious', 'formal', 'reserved', 'serious'],
  }
  
  const traits = personalityTraitMap[rival.personality] || ['competitive']
  
  const bio: SocialBio = {
    background: rival.narrative?.background || `${rival.firstName} ${rival.lastName} is a ${rival.careerStage} racing driver from ${rival.nationality}.`,
    careerNarrative: `Races for ${teamName} in the ${seriesName}. ${rival.totalWins ? `Has ${rival.totalWins} career wins` : 'Looking for breakthrough results'}${rival.championships ? ` and ${rival.championships} championship${rival.championships > 1 ? 's' : ''}` : ''}.`,
    personalityDescription: `Known for a ${rival.personality} driving style. ${rival.careerStage === 'rising' ? 'An up-and-coming talent.' : rival.careerStage === 'peak' ? 'At the peak of their career.' : rival.careerStage === 'declining' ? 'An experienced veteran.' : 'A seasoned veteran.'}`,
    lifeSituation: `Currently racing in the ${seriesName} for ${teamName}.`,
    anecdotes: [],
  }

  const contact: ContactInfo = {
    id: `rival-${rival.id}`,
    name: `${rival.firstName} ${rival.lastName}`,
    type: 'rival_driver',
    traits,
    nationality: rival.nationality,
    age: rival.age,
    occupation: 'Racing Driver',
    bio,
    driverPersonality: rival.personality as any,
    driverCareerStage: rival.careerStage as any,
    driverTeamName: teamName,
    driverSeriesName: seriesName,
    relationshipLevel: 35,  // Start as professional acquaintances
    affectionMeter: 20,
    romanceMeter: 0,
    trustMeter: 30,
    currentMood: { overall: 'neutral', energy: 'high', receptiveness: 50, recentEvents: [] },
    metAt: `On the grid in the ${seriesName}`,
    metWeek: currentWeek,
    metYear: currentYear,
    messagingStyle: computeMessagingStyle(traits),
  }

  return contact
}

/**
 * Create a phone contact from a sponsor representative.
 * Each active sponsor gets a named contact person.
 */
export function createContactFromSponsorDeal(
  sponsor: {
    id: string
    name: string
    category?: string
    tier?: string
    story?: string
  },
  repName: string,
  currentWeek: number,
  currentYear: number
): ContactInfo {
  const traits = ['professional', 'formal', 'ambitious']
  
  const bio: SocialBio = {
    background: `${repName} works as a partnership manager for ${sponsor.name}.`,
    careerNarrative: sponsor.story || `Manages motorsport sponsorship deals for ${sponsor.name}, a ${sponsor.tier || 'mid'}-tier ${sponsor.category || 'brand'}.`,
    personalityDescription: 'A polished professional who balances friendliness with clear business objectives.',
    lifeSituation: `Based at ${sponsor.name} headquarters. Frequent traveler to race events.`,
    anecdotes: [`Passionate about the brand and its racing heritage.`],
  }

  return {
    id: `sponsor-rep-${sponsor.id}`,
    name: repName,
    type: 'sponsor_rep',
    traits,
    occupation: 'Sponsorship Manager',
    bio,
    sponsorName: sponsor.name,
    sponsorTier: sponsor.tier,
    sponsorCategory: sponsor.category,
    relationshipLevel: 45,
    affectionMeter: 20,
    romanceMeter: 0,
    trustMeter: 40,
    currentMood: { overall: 'neutral', energy: 'medium', receptiveness: 65, recentEvents: [] },
    metAt: `Sponsor signing with ${sponsor.name}`,
    metWeek: currentWeek,
    metYear: currentYear,
    messagingStyle: computeMessagingStyle(traits),
  }
}

/**
 * Create a phone contact from a rival team principal.
 * Uses the pre-gen team narrative data.
 */
export function createContactFromTeamPrincipal(
  teamNarrative: PreGenTeamNarrative,
  seriesName: string,
  currentWeek: number,
  currentYear: number
): ContactInfo {
  const tp = teamNarrative.teamPrincipal
  const traits = ['formal', 'ambitious', 'professional', 'competitive']
  
  const bio: SocialBio = {
    background: tp.background || `${tp.name} leads the racing team with a focus on ${teamNarrative.philosophy || 'excellence'}.`,
    careerNarrative: `Team Principal of a ${seriesName} outfit.${teamNarrative.achievements?.length ? ` Notable achievements: ${teamNarrative.achievements.slice(0, 2).join(', ')}.` : ''}`,
    personalityDescription: `A driven team leader known for ${teamNarrative.reputation || 'competitive spirit'}.`,
    lifeSituation: `Based at ${teamNarrative.headquarters || 'team headquarters'}. Manages all aspects of the racing operation.`,
    anecdotes: teamNarrative.keyFigures?.slice(0, 2).map(f => `Works closely with ${f.name} (${f.role})`) || [],
  }

  return {
    id: `tp-${teamNarrative.id}`,
    name: tp.name,
    type: 'team_principal',
    traits,
    nationality: tp.nationality,
    occupation: 'Team Principal',
    bio,
    teamNarrativeId: teamNarrative.id,
    teamPhilosophy: teamNarrative.philosophy,
    relationshipLevel: 25,  // Start as distant professional
    affectionMeter: 15,
    romanceMeter: 0,
    trustMeter: 20,
    currentMood: { overall: 'neutral', energy: 'high', receptiveness: 40, recentEvents: [] },
    metAt: `Paddock at the ${seriesName}`,
    metWeek: currentWeek,
    metYear: currentYear,
    messagingStyle: computeMessagingStyle(traits),
  }
}

// ============================================

// ============================================
// GROUP CHAT CREATION
// ============================================

import type { GroupConversation, GroupChatType } from '@/types/personalLife'

/**
 * Create automatic group chats based on game state.
 * Called during syncAutomaticContacts to ensure group chats exist.
 */
export function syncGroupChats(
  careerState: CareerState,
  existingContacts: ContactInfo[],
  existingGroupChats: Record<string, GroupConversation>
): Record<string, GroupConversation> {
  const groupChats = { ...existingGroupChats }
  
  // ── Team Staff Group Chat ──
  if (careerState.ownedTeam) {
    const teamGroupId = 'group_team_staff'
    if (!groupChats[teamGroupId]) {
      const teamStaffIds = existingContacts
        .filter(c => c.type === 'team_staff')
        .map(c => c.id)
      
      if (teamStaffIds.length >= 2) {
        groupChats[teamGroupId] = {
          id: teamGroupId,
          name: `${careerState.ownedTeam.name} Team`,
          type: 'team_staff' as GroupChatType,
          participantIds: teamStaffIds,
          messages: [],
          lastMessageTime: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear },
          unreadCount: 0,
          avatarContactIds: teamStaffIds.slice(0, 4),
        }
      }
    }
  }
  
  // ── Family Group Chat ──
  const familyGroupId = 'group_family'
  if (!groupChats[familyGroupId]) {
    const familyIds = existingContacts
      .filter(c => c.type === 'family' || c.type === 'partner')
      .map(c => c.id)
    
    if (familyIds.length >= 2) {
      groupChats[familyGroupId] = {
        id: familyGroupId,
        name: 'Family',
        type: 'family' as GroupChatType,
        participantIds: familyIds,
        messages: [],
        lastMessageTime: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear },
        unreadCount: 0,
        avatarContactIds: familyIds.slice(0, 4),
      }
    }
  }
  
  // ── Series Drivers Group Chat (paddock banter) ──
  const rivalIds = existingContacts
    .filter(c => c.type === 'rival_driver')
    .map(c => c.id)
  
  if (rivalIds.length >= 3) {
    const driversGroupId = 'group_series_drivers'
    if (!groupChats[driversGroupId]) {
      groupChats[driversGroupId] = {
        id: driversGroupId,
        name: 'Paddock Group',
        type: 'series_drivers' as GroupChatType,
        participantIds: rivalIds.slice(0, 8), // Cap at 8 drivers
        messages: [],
        lastMessageTime: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear },
        unreadCount: 0,
        avatarContactIds: rivalIds.slice(0, 4),
      }
    }
  }
  
  // ── Friend Group Chat ──
  const friendGroupId = 'group_friends'
  if (!groupChats[friendGroupId]) {
    const friendIds = existingContacts
      .filter(c => c.type === 'friend')
      .map(c => c.id)
    
    if (friendIds.length >= 3) {
      groupChats[friendGroupId] = {
        id: friendGroupId,
        name: 'The Squad',
        type: 'friend_group' as GroupChatType,
        participantIds: friendIds.slice(0, 6),
        messages: [],
        lastMessageTime: { week: careerState.currentWeek, day: careerState.currentDay, year: careerState.currentYear },
        unreadCount: 0,
        avatarContactIds: friendIds.slice(0, 4),
      }
    }
  }
  
  return groupChats
}

// ============================================
// SOCIAL GRAPH - WHO KNOWS WHO
// ============================================

/**
 * Build social connections based on logical groupings.
 * Returns a map: contactId → [ids of contacts they know].
 * 
 * Rules:
 * - All team_staff know each other
 * - All rival_drivers in the same series know each other
 * - Family members know each other
 * - Sponsor reps know team_staff (business overlap)
 * - Friends introduced by the same person know each other
 * - Partner knows family
 */
export function buildSocialGraph(contacts: ContactInfo[]): Record<string, string[]> {
  const graph: Record<string, Set<string>> = {}
  
  // Initialize
  for (const c of contacts) {
    graph[c.id] = new Set<string>()
  }
  
  // Helper to connect two contacts
  const connect = (a: string, b: string) => {
    if (a === b) return
    graph[a]?.add(b)
    graph[b]?.add(a)
  }
  
  // ── Team staff all know each other ──
  const teamStaff = contacts.filter(c => c.type === 'team_staff')
  for (let i = 0; i < teamStaff.length; i++) {
    for (let j = i + 1; j < teamStaff.length; j++) {
      connect(teamStaff[i].id, teamStaff[j].id)
    }
  }
  
  // ── Rival drivers know each other ──
  const rivals = contacts.filter(c => c.type === 'rival_driver')
  for (let i = 0; i < rivals.length; i++) {
    for (let j = i + 1; j < rivals.length; j++) {
      // Same series = definitely know each other
      if (rivals[i].driverSeriesName && rivals[i].driverSeriesName === rivals[j].driverSeriesName) {
        connect(rivals[i].id, rivals[j].id)
      }
    }
  }
  
  // ── Team principals know rival drivers (they're all in the paddock) ──
  const principals = contacts.filter(c => c.type === 'team_principal')
  for (const principal of principals) {
    for (const rival of rivals) {
      connect(principal.id, rival.id)
    }
    // Principals know other principals
    for (const other of principals) {
      connect(principal.id, other.id)
    }
  }
  
  // ── Family members know each other ──
  const family = contacts.filter(c => c.type === 'family' || c.type === 'partner')
  for (let i = 0; i < family.length; i++) {
    for (let j = i + 1; j < family.length; j++) {
      connect(family[i].id, family[j].id)
    }
  }
  
  // ── Sponsor reps know team staff ──
  const sponsors = contacts.filter(c => c.type === 'sponsor_rep')
  for (const sponsor of sponsors) {
    for (const staff of teamStaff) {
      connect(sponsor.id, staff.id)
    }
  }
  
  // ── Contacts introduced by the same person know each other ──
  const introducedGroups: Record<string, string[]> = {}
  for (const c of contacts) {
    if (c.introducedBy) {
      if (!introducedGroups[c.introducedBy]) introducedGroups[c.introducedBy] = []
      introducedGroups[c.introducedBy].push(c.id)
    }
  }
  for (const group of Object.values(introducedGroups)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        connect(group[i], group[j])
      }
    }
  }
  
  // ── Friends who met at the same event know each other ──
  const metAtGroups: Record<string, string[]> = {}
  for (const c of contacts) {
    if (c.metAt && c.type === 'friend') {
      if (!metAtGroups[c.metAt]) metAtGroups[c.metAt] = []
      metAtGroups[c.metAt].push(c.id)
    }
  }
  for (const group of Object.values(metAtGroups)) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        connect(group[i], group[j])
      }
    }
  }
  
  // Convert Sets to arrays
  const result: Record<string, string[]> = {}
  for (const [id, connections] of Object.entries(graph)) {
    result[id] = Array.from(connections)
  }
  
  return result
}

/**
 * Get the list of contact IDs that a given contact knows (from the social graph).
 */
export function getContactKnownPeople(contactId: string, socialGraph: Record<string, string[]>): string[] {
  return socialGraph[contactId] || []
}

export {
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  LAST_NAMES,
  OCCUPATIONS,
  TRAITS,
  POSITIVE_TRAITS,
  NEGATIVE_TRAITS,
  COMPLEX_TRAITS,
  INTERESTS,
  NATIONALITIES,
  getRandomItem,
  getRandomItems,
  generateAge,
  generateMixedTraits,
  generateName
}

// ============================================
// DYNAMIC ONLINE STATUS
// ============================================

/**
 * Calculate whether a contact should appear "online" right now.
 * Based on time-of-day (game hour), their personality, and contact type.
 * Call this when rendering the chat list or entering a conversation.
 */
export function calculateContactOnlineStatus(
  contact: ContactInfo,
  gameHour: number,        // 0-23
  gameDay: number,         // 1-7 (Mon-Sun)
): { isOnline: boolean; lastSeen: string } {
  // PA (Julia) is always online during work hours
  if (contact.metAt === 'Hired as your PA') {
    const online = gameHour >= 7 && gameHour <= 22
    return { isOnline: online, lastSeen: online ? 'Online' : 'Last seen today' }
  }
  
  // Partner is usually online except late night / early morning
  if (contact.type === 'partner') {
    const online = gameHour >= 7 && gameHour <= 23
    return { isOnline: online, lastSeen: online ? 'Online' : 'Sleeping' }
  }
  
  // Family - available during reasonable hours
  if (contact.type === 'family') {
    const online = gameHour >= 8 && gameHour <= 21
    return { isOnline: online, lastSeen: online ? 'Online' : 'Last seen recently' }
  }
  
  // Team staff - online during work hours, sometimes evenings
  if (contact.type === 'team_staff') {
    const workHours = gameHour >= 8 && gameHour <= 19
    const eveningCheck = gameHour >= 19 && gameHour <= 21 && Math.random() > 0.5
    const online = workHours || eveningCheck
    return { isOnline: online, lastSeen: online ? 'Online' : gameHour < 8 ? 'Last seen yesterday' : 'Last seen today' }
  }
  
  // Sponsor reps - business hours only
  if (contact.type === 'sponsor_rep') {
    const online = gameHour >= 9 && gameHour <= 18 && gameDay <= 5
    return { isOnline: online, lastSeen: online ? 'Online' : 'Last seen recently' }
  }
  
  // Rival drivers - irregular schedule, more active on race weekends
  if (contact.type === 'rival_driver') {
    // Use a deterministic-ish pattern based on contact name hash + hour
    const hash = contact.name.charCodeAt(0) + contact.name.charCodeAt(contact.name.length - 1)
    const onlineHours = [(hash % 12) + 8, ((hash + 7) % 14) + 8, ((hash + 3) % 10) + 10]
    const online = onlineHours.some(h => Math.abs(gameHour - h) <= 1)
    return { isOnline: online, lastSeen: online ? 'Online' : 'Last seen recently' }
  }
  
  // Friends and business contacts - semi-random based on personality
  const responseSpeed = (contact as any).messagingStyle?.responseSpeed || 'normal'
  const frequency = (contact as any).messagingStyle?.frequency || 'medium'
  
  // More active contacts are online more often
  const baseOnlineChance = frequency === 'very_high' ? 0.7 :
                           frequency === 'high' ? 0.55 :
                           frequency === 'medium' ? 0.4 :
                           frequency === 'low' ? 0.25 : 0.15
  
  // Everyone's offline at night
  if (gameHour < 7 || gameHour > 23) {
    return { isOnline: false, lastSeen: 'Last seen today' }
  }
  
  // Use deterministic random based on name + hour + day so it's stable within the same game-hour
  const seed = (contact.name.charCodeAt(0) * 31 + gameHour * 7 + gameDay * 13) % 100
  const online = (seed / 100) < baseOnlineChance
  
  // Last seen text
  if (online) return { isOnline: true, lastSeen: 'Online' }
  
  if (responseSpeed === 'instant' || responseSpeed === 'fast') {
    return { isOnline: false, lastSeen: 'Last seen recently' }
  }
  return { isOnline: false, lastSeen: gameHour < 12 ? 'Last seen yesterday' : 'Last seen today' }
}
