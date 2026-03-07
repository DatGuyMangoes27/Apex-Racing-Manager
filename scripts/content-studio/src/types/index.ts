/**
 * Content Studio TypeScript types.
 * These are for the studio UI itself - the actual generated data
 * uses generic JSON structures that match the Gemini output.
 */

// Profile types
export interface DriverProfile {
  id: string
  name: string
  nationality: string
  age: number
  careerStage: string
  personality: string
  biography: string
  drivingStyle: string
  rivalries: string[]
  quirks: string[]
  nickname: string
  famousQuote: string
  careerHighlight: string
  careerLowPoint: string
  physical: PhysicalDescription
  hasImage: boolean
  imagePath?: string
}

export interface PhysicalDescription {
  skinTone: string
  hairColor: string
  hairStyle: string
  eyeColor: string
  facialHair: string | null
  description: string
}

export interface StaffProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  role: string
  bio: string
  physical: PhysicalDescription
  personality: string
  quirks: string[]
  skills: Record<string, number>
  hasImage: boolean
  imagePath?: string
}

export interface PartnerProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  bio: string
  physical: PhysicalDescription
  career: string
  traits: string[]
  interests: string[]
  style: string
  educationLevel: string
  wealthLevel: string
  socialCircle: string
  desires: {
    wantsChildren: boolean
    desiredChildrenCount: number
    wantsMarriage: boolean
    lifestyleExpectations: string
    qualityTimeImportance: number
    socialLifeImportance: number
    privacyImportance: number
  }
  meetingContext: string
  firstImpression: string
  dealBreakers: string[]
  loveLanguage: string
  hasImage: boolean
  imagePath?: string
}

export interface ContactProfile {
  id: string
  name: string
  nationality: string
  age: number
  gender: string
  contactType: string
  bio: string
  physical: PhysicalDescription
  traits: string[]
  interests: string[]
  educationLevel: string
  wealthLevel: string
  socialCircle: string
  connectionToMotorsport: string
  meetingContext: string
  conversationTopics: string[]
  canHelp: string[]
  personalitySummary: string
  hasImage: boolean
  imagePath?: string
}

export interface TeamNarrative {
  id: string
  origin: string
  philosophy: string
  achievements: string[]
  teamPrincipal: {
    name: string
    background: string
    nationality: string
  }
  keyFigures: {
    name: string
    role: string
    description: string
  }[]
  headquarters: string
  reputation: string
  fanBase: string
}

export interface TrackNarrative {
  id: string
  history: string
  atmosphere: string
  keyCorners: string[]
  drivingAdvice: string
  famousRaces: string[]
  localCulture: string
  weatherPatterns: string
  trackRecord: string
}

export interface PreRaceContent {
  id: string
  atmosphereSnippets: string[]
  driverSnippets: string[]
  strategyPoints: string[]
  historicalReferences: string[]
  weatherCommentary: string[]
  gridWalkQuotes: string[]
}

// Extended contact types (25+)
export type ContactType =
  | 'business_mogul' | 'tech_entrepreneur' | 'actor' | 'musician' | 'athlete'
  | 'celebrity' | 'film_director' | 'fashion_designer' | 'agent' | 'lawyer'
  | 'banker' | 'sponsor_exec' | 'politician' | 'diplomat' | 'professor'
  | 'doctor' | 'architect' | 'chef' | 'journalist' | 'influencer'
  | 'philanthropist' | 'military_officer' | 'pilot' | 'yacht_captain' | 'artist'

export type EducationLevel = 'self-taught' | 'undergraduate' | 'postgraduate' | 'PhD' | 'trades'
export type WealthLevel = 'modest' | 'comfortable' | 'wealthy' | 'ultra_wealthy'
export type SocialCircle =
  | 'racing_world' | 'high_society' | 'creative_scene' | 'tech_world'
  | 'sports_world' | 'academic' | 'entertainment' | 'business_world'
