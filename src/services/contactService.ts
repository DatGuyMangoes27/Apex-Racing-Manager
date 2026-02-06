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
export function getContactPortrait(contact: ContactInfo & { portraitId?: string; gender?: Gender }): string {
  // If we have a specific portrait ID, use it
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
        return getStaffPortrait(contact.portraitId)
      default:
        return ''
    }
  }
  
  // Fallback - generate a portrait based on type and gender
  if (contact.type === 'partner' || contact.type === 'potential_date') {
    return getRandomPartnerPortrait(contact.gender)
  }
  
  return ''
}

/**
 * Assign a gender-matched portrait to a new contact
 * Returns the portrait path and the portrait ID for storage
 */
export function assignGenderMatchedPortrait(
  gender: Gender, 
  contactType: ContactType
): { portraitPath: string; portraitId: string } {
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
 * Generate a new contact from an encounter
 * Includes a template-based bio immediately, with async AI upgrade available
 */
export function generateNewContact(
  contactType: ContactType,
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number
): ContactInfo & { portraitId: string; gender: Gender } {
  const { firstName, lastName } = generateName(gender)
  const { portraitId } = assignGenderMatchedPortrait(gender, contactType)
  
  const isRomantic = contactType === 'partner' || contactType === 'potential_date'
  const name = `${firstName} ${lastName}`
  const traits = generateMixedTraits(3 + Math.floor(Math.random() * 2)) // 3-4 traits
  const occupation = getRandomItem(OCCUPATIONS)
  const nationality = getRandomItem(NATIONALITIES)
  const age = generateAge(contactType)
  
  // Generate template-based bio immediately (sync)
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
    currentMood: createPositiveMood(), // They're happy to meet you!
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
 * Generate a potential date (more detailed info)
 * Includes a template-based bio immediately, with async AI upgrade available
 */
export function generatePotentialDate(
  gender: Gender,
  metAt: string,
  metWeek: number,
  metYear: number,
  playerAge: number
): PotentialDate & { portraitId: string; gender: Gender } {
  const { firstName, lastName } = generateName(gender)
  const { portraitId } = assignGenderMatchedPortrait(gender, 'potential_date')
  
  // Age should be reasonably close to player
  const ageDiff = Math.floor(Math.random() * 15) - 7 // -7 to +7 years
  const age = Math.max(21, Math.min(55, playerAge + ageDiff))
  
  const occupation = getRandomItem(OCCUPATIONS)
  const nationality = getRandomItem(NATIONALITIES)
  const traits = generateMixedTraits(4 + Math.floor(Math.random() * 2)) // 4-5 traits
  const interests = getRandomItems(INTERESTS, 5 + Math.floor(Math.random() * 3)) // 5-7 interests
  const name = `${firstName} ${lastName}`
  
  // Generate template-based bio immediately (sync)
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
  
  // Chemistry / interest level varies - not everyone is into you!
  const chemistryRoll = Math.random()
  let interestLevel: number
  let compatibilityScore: number
  if (chemistryRoll < 0.3) {
    // Low interest - they're not really feeling it
    interestLevel = 10 + Math.floor(Math.random() * 25) // 10-35
    compatibilityScore = 20 + Math.floor(Math.random() * 30) // 20-50
  } else if (chemistryRoll < 0.6) {
    // Moderate interest - could go either way
    interestLevel = 35 + Math.floor(Math.random() * 30) // 35-65
    compatibilityScore = 40 + Math.floor(Math.random() * 30) // 40-70
  } else {
    // High interest - genuine chemistry
    interestLevel = 65 + Math.floor(Math.random() * 35) // 65-100
    compatibilityScore = 60 + Math.floor(Math.random() * 40) // 60-100
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
  // Infer gender from name or use default (could be enhanced with actual gender data)
  const gender: Gender = 'female' // Default, could be enhanced
  const portraitId = partner.id || `${partner.firstName}-${partner.lastName}`.toLowerCase()
  
  // Calculate relationship level from relationship status
  const relationshipLevel = partner.relationshipStatus === 'married' ? 95 :
                           partner.relationshipStatus === 'engaged' ? 85 :
                           partner.relationshipStatus === 'dating' ? 70 : 60
  
  return {
    id: `partner_${partner.id || generateId('p')}`,
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
  
  // Add key team staff (team principal/manager)
  // This would be expanded based on your team staff structure
  // For now, we'll skip this as it requires more team data integration
  
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
  currentYear: number
): Conversation {
  const message: TextMessage = {
    id: generateId('msg'),
    conversationId: `conv_${contact.id}`,
    sender: 'npc',
    content: introMessage,
    tone: contact.type === 'potential_date' ? 'friendly' : 'casual',
    timestamp: { 
      week: currentWeek, 
      day: Math.floor(Math.random() * 7) + 1,
      hour: 10 + Math.floor(Math.random() * 10),
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
    lastMessageTime: { week: currentWeek, day: 1, year: currentYear },
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
// EXPORTS
// ============================================

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
