// ============================================
// CAREER BACKGROUNDS & TRAITS SYSTEM
// ============================================

import { DriverStats } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export type MediaScrutinyLevel = 'low' | 'normal' | 'high' | 'intense'

export interface BackstoryTrait {
  id: string
  name: string
  description: string
  category: 'origin' | 'skill' | 'fame' | 'wealth' | 'connection'
  effects: TraitEffects
  incompatibleWith?: string[]  // Trait IDs that can't be combined
  icon: string  // Lucide icon name
}

export interface TraitEffects {
  // Stat modifiers
  statModifiers?: Partial<DriverStats>
  
  // Starting conditions
  startingMoneyModifier?: number      // Multiplier (e.g., 1.5 = +50%)
  startingReputationModifier?: number // Flat addition
  
  // Social/Media
  socialMediaFollowers?: number
  mediaScrutinyChange?: 1 | -1        // Increases or decreases scrutiny level
  marketabilityBonus?: number
  
  // Connections
  manufacturerAffinity?: string       // Specific manufacturer ID
  connectionBonus?: number            // % bonus to contract interest
  engineerRelationshipBonus?: number
  
  // Special flags
  needsToProveWorth?: boolean
  hasPayDriverStigma?: boolean
  startsWithSponsor?: boolean
}

export interface FamilyLegacy {
  fatherName: string
  fatherNationality: string
  championships: number
  famousSeries: string
  connectionBonus: number  // Percentage
}

export interface PlayerBackground {
  // Core Identity
  scenarioId: string                    // Preset ID or 'custom'
  backstoryTraits: string[]             // Trait IDs
  
  // Manufacturer Affiliation
  affiliatedManufacturer?: string       // e.g., 'bmw', 'porsche' (Academy)
  manufacturerRelationship: number      // -100 to 100
  
  // Fame/Media
  socialMediaFollowers: number          // Starting followers
  mediaScrutinyLevel: MediaScrutinyLevel
  publicImageRating: number             // 0-100
  
  // Family/Connections  
  familyLegacy?: FamilyLegacy
  
  // Special Flags
  hasProvenRacingRecord: boolean        // Ex-pro, national champ
  hasEngineeringBackground: boolean     // Mechanic's kid
  isSimRacingCrossover: boolean         // Sim champion
  needsToProveWorth: boolean            // Skeptics to overcome
  hasPayDriverStigma: boolean           // Rich amateur perception
  
  // Relationship modifiers (applied at career start)
  engineerRelationshipBonus: number     // Added to starting engineer relationships
  rivalJealousyPenalty: number          // Subtracted from rival relationships
}

export type BackgroundScenarioId = 
  | 'karting_prodigy'
  | 'late_bloomer' 
  | 'rich_amateur'
  | 'ex_pro_comeback'
  | 'sim_racing_champion'
  | 'factory_academy'
  | 'racing_dynasty'
  | 'mechanics_kid'
  | 'recovering_champion'
  | 'second_career'
  | 'national_champion'
  | 'privateer'
  | 'custom'

export interface BackgroundScenario {
  id: BackgroundScenarioId
  name: string
  description: string
  tagline: string  // Short catchy description
  
  // Starting conditions
  startAge: number
  startingMoney: number
  startingReputation: number
  baseStats: DriverStats
  
  // Background effects
  background: Omit<PlayerBackground, 'scenarioId' | 'backstoryTraits'>
  
  // UI
  icon: string  // Lucide icon name
  color: string // Accent color for the card
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
}

// ============================================
// BACKSTORY TRAITS
// ============================================

export const BACKSTORY_TRAITS: Record<string, BackstoryTrait> = {
  famous_parent: {
    id: 'famous_parent',
    name: 'Famous Parent',
    description: 'Your parent was a racing legend. Doors open easily, but expectations are sky-high.',
    category: 'connection',
    effects: {
      connectionBonus: 25,
      mediaScrutinyChange: 1,
      startingReputationModifier: 15
    },
    icon: 'Crown'
  },
  
  karting_phenom: {
    id: 'karting_phenom',
    name: 'Karting Phenom',
    description: 'Multiple karting championships under your belt. Raw talent recognized early.',
    category: 'skill',
    effects: {
      statModifiers: { racecraft: 15, consistency: 5 },
      startingReputationModifier: 10
    },
    icon: 'Zap'
  },
  
  engineering_degree: {
    id: 'engineering_degree',
    name: 'Engineering Degree',
    description: 'University education in automotive engineering. You speak the engineers\' language.',
    category: 'skill',
    effects: {
      statModifiers: { technicalFeedback: 20, racecraft: -5 },
      engineerRelationshipBonus: 30
    },
    incompatibleWith: ['school_dropout'],
    icon: 'Wrench'
  },
  
  social_media_star: {
    id: 'social_media_star',
    name: 'Social Media Star',
    description: 'Your online presence is massive. Sponsors love you, but the pressure is real.',
    category: 'fame',
    effects: {
      socialMediaFollowers: 750000,
      marketabilityBonus: 15, // Reduced: online following doesn't directly translate to racing brand
      mediaScrutinyChange: 1
    },
    icon: 'Smartphone'
  },
  
  military_service: {
    id: 'military_service',
    name: 'Military Service',
    description: 'Years of discipline and physical training. Unshakeable under pressure.',
    category: 'origin',
    effects: {
      statModifiers: { 
        fitness: 20, 
        mentalStrength: 15,
        racecraft: -10 
      }
    },
    icon: 'Shield'
  },
  
  sim_racing_background: {
    id: 'sim_racing_background',
    name: 'Sim Racing Background',
    description: 'Thousands of hours in simulators. Track knowledge is incredible, but skeptics abound.',
    category: 'skill',
    effects: {
      statModifiers: { consistency: 10, wetSkill: 5 },
      socialMediaFollowers: 200000,
      needsToProveWorth: true
    },
    icon: 'Monitor'
  },
  
  wealthy_family: {
    id: 'wealthy_family',
    name: 'Wealthy Family',
    description: 'Money is no object. But you\'ll need to prove you\'re not just another pay driver.',
    category: 'wealth',
    effects: {
      startingMoneyModifier: 3.0,
      hasPayDriverStigma: true,
      needsToProveWorth: true
    },
    icon: 'Banknote'
  },
  
  sponsored_prodigy: {
    id: 'sponsored_prodigy',
    name: 'Sponsored Prodigy',
    description: 'A major sponsor spotted you early. You have backing, but also obligations.',
    category: 'connection',
    effects: {
      startsWithSponsor: true,
      startingMoneyModifier: 1.5,
      mediaScrutinyChange: 1
    },
    icon: 'BadgeCheck'
  },
  
  humble_origins: {
    id: 'humble_origins',
    name: 'Humble Origins',
    description: 'You come from nothing. Every opportunity has been earned through pure grit.',
    category: 'origin',
    effects: {
      statModifiers: { mentalStrength: 10 },
      startingMoneyModifier: 0.5,
      mediaScrutinyChange: -1
    },
    incompatibleWith: ['wealthy_family', 'famous_parent'],
    icon: 'Home'
  },
  
  local_hero: {
    id: 'local_hero',
    name: 'Local Hero',
    description: 'A legend in your home region. Strong local following and sponsor interest.',
    category: 'fame',
    effects: {
      socialMediaFollowers: 100000,
      connectionBonus: 10,
      startingReputationModifier: 5
    },
    icon: 'MapPin'
  },
  
  natural_talent: {
    id: 'natural_talent',
    name: 'Natural Talent',
    description: 'Some things can\'t be taught. You have an innate feel for the car.',
    category: 'skill',
    effects: {
      statModifiers: { 
        racecraft: 10, 
        wetSkill: 10,
        tireManagement: 5 
      }
    },
    icon: 'Sparkles'
  },
  
  comeback_story: {
    id: 'comeback_story',
    name: 'Comeback Story',
    description: 'You\'ve overcome adversity. The media loves an underdog.',
    category: 'origin',
    effects: {
      mediaScrutinyChange: 1,
      statModifiers: { mentalStrength: 15 },
      needsToProveWorth: true
    },
    icon: 'TrendingUp'
  }
}

// ============================================
// PRESET SCENARIOS
// ============================================

export const BACKGROUND_SCENARIOS: Record<BackgroundScenarioId, BackgroundScenario> = {
  // ========== ORIGINAL 4 SCENARIOS (updated) ==========
  karting_prodigy: {
    id: 'karting_prodigy',
    name: 'Young Karting Prodigy',
    description: 'A teenage sensation with raw talent but limited funds. Your karting success has caught the eye of scouts.',
    tagline: 'Raw talent seeking opportunity',
    startAge: 16,
    startingMoney: 25000, // Realistic: parents helped fund karting
    startingReputation: 20,
    baseStats: {
      racecraft: 70,
      consistency: 55,
      wetSkill: 50,
      tireManagement: 45,
      technicalFeedback: 40,
      mentalStrength: 50,
      fitness: 75,
      marketability: 15 // Reduced: unknown teenager, needs to build brand
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 5000,
      mediaScrutinyLevel: 'low',
      publicImageRating: 50,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: false,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 0,
      rivalJealousyPenalty: 0
    },
    icon: 'Zap',
    color: 'orange',
    difficulty: 'medium'
  },
  
  late_bloomer: {
    id: 'late_bloomer',
    name: 'Late Bloomer',
    description: 'You\'ve worked hard and saved up to pursue your racing dream. Moderate skills, but determined and mentally strong.',
    tagline: 'Never too late to chase dreams',
    startAge: 24,
    startingMoney: 180000, // Realistic: years of saving while working
    startingReputation: 15,
    baseStats: {
      racecraft: 55,
      consistency: 60,
      wetSkill: 50,
      tireManagement: 55,
      technicalFeedback: 50,
      mentalStrength: 65,
      fitness: 60,
      marketability: 15 // Reduced: complete unknown, starting from scratch
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 1000,
      mediaScrutinyLevel: 'low',
      publicImageRating: 40,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 0,
      rivalJealousyPenalty: 0
    },
    icon: 'Clock',
    color: 'blue',
    difficulty: 'hard'
  },
  
  rich_amateur: {
    id: 'rich_amateur',
    name: 'Wealthy Amateur',
    description: 'Money isn\'t an issue - your family can fund any seat. But you\'ll need to prove you have the talent to match.',
    tagline: 'Funding secured, respect pending',
    startAge: 30,
    startingMoney: 2500000, // Realistic: trust fund / family money for GT3+ seats
    startingReputation: 25,
    baseStats: {
      racecraft: 45,
      consistency: 50,
      wetSkill: 45,
      tireManagement: 50,
      technicalFeedback: 55,
      mentalStrength: 55,
      fitness: 50,
      marketability: 20 // Reduced: money can't buy a brand
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 25000,
      mediaScrutinyLevel: 'normal',
      publicImageRating: 55,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: true,
      engineerRelationshipBonus: 0,
      rivalJealousyPenalty: -15
    },
    icon: 'Banknote',
    color: 'gold',
    difficulty: 'easy'
  },
  
  ex_pro_comeback: {
    id: 'ex_pro_comeback',
    name: 'Ex-Pro Comeback',
    description: 'Once a promising talent who raced in F3. After years away, you\'re back. The skills are rusty, but the reputation remains.',
    tagline: 'Unfinished business',
    startAge: 35,
    startingMoney: 350000, // Realistic: saved from previous pro career
    startingReputation: 50,
    baseStats: {
      racecraft: 65,
      consistency: 70,
      wetSkill: 60,
      tireManagement: 70,
      technicalFeedback: 75,
      mentalStrength: 70,
      fitness: 45,
      marketability: 25 // Reduced: some name recognition from past career
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 50000,
      mediaScrutinyLevel: 'normal',
      publicImageRating: 60,
      hasProvenRacingRecord: true,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 20,
      rivalJealousyPenalty: 0
    },
    icon: 'RotateCcw',
    color: 'purple',
    difficulty: 'medium'
  },
  
  // ========== NEW SCENARIOS ==========
  sim_racing_champion: {
    id: 'sim_racing_champion',
    name: 'Sim Racing Champion',
    description: 'World champion in esports racing, you\'ve proven yourself virtually. Now it\'s time to silence the skeptics in real cars.',
    tagline: 'From pixels to podiums',
    startAge: 22,
    startingMoney: 60000, // Realistic: esports winnings + streaming income
    startingReputation: 30,
    baseStats: {
      racecraft: 60,
      consistency: 70,
      wetSkill: 55,
      tireManagement: 65,
      technicalFeedback: 60,
      mentalStrength: 55,
      fitness: 50,
      marketability: 25 // Reduced: online following doesn't equal real-world brand
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 500000,
      mediaScrutinyLevel: 'high',
      publicImageRating: 65,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: true,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 10,
      rivalJealousyPenalty: -10
    },
    icon: 'Monitor',
    color: 'cyan',
    difficulty: 'medium'
  },
  
  factory_academy: {
    id: 'factory_academy',
    name: 'Factory Academy Graduate',
    description: 'Selected for a manufacturer\'s junior program, you\'ve trained with the best. Now you must deliver results to earn a works seat.',
    tagline: 'Manufacturer\'s chosen one',
    startAge: 19,
    startingMoney: 15000, // Realistic: limited personal funds, academy funded
    startingReputation: 35,
    baseStats: {
      racecraft: 65,
      consistency: 60,
      wetSkill: 55,
      tireManagement: 55,
      technicalFeedback: 65,
      mentalStrength: 50,
      fitness: 70,
      marketability: 20 // Reduced: unproven junior, manufacturer backing doesn't equal personal brand
    },
    background: {
      affiliatedManufacturer: undefined, // Set during career creation
      manufacturerRelationship: 50,
      socialMediaFollowers: 15000,
      mediaScrutinyLevel: 'high',
      publicImageRating: 55,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: false,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 15,
      rivalJealousyPenalty: -5
    },
    icon: 'GraduationCap',
    color: 'red',
    difficulty: 'medium'
  },
  
  racing_dynasty: {
    id: 'racing_dynasty',
    name: 'Racing Dynasty',
    description: 'Your father was a champion. His name opens every door, but the shadow he casts is long. Can you forge your own legacy?',
    tagline: 'Living up to the name',
    startAge: 18,
    startingMoney: 400000, // Realistic: family racing wealth
    startingReputation: 45,
    baseStats: {
      racecraft: 60,
      consistency: 55,
      wetSkill: 50,
      tireManagement: 50,
      technicalFeedback: 55,
      mentalStrength: 45,
      fitness: 65,
      marketability: 30 // Reduced: famous name helps but still unproven
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 20,
      socialMediaFollowers: 250000,
      mediaScrutinyLevel: 'intense',
      publicImageRating: 70,
      familyLegacy: {
        fatherName: 'Marcus',
        fatherNationality: 'Brazil',
        championships: 2,
        famousSeries: 'Formula 3',
        connectionBonus: 25
      },
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 10,
      rivalJealousyPenalty: -20
    },
    icon: 'Crown',
    color: 'gold',
    difficulty: 'hard'
  },
  
  mechanics_kid: {
    id: 'mechanics_kid',
    name: 'Mechanic\'s Kid',
    description: 'You grew up in the garage, handing tools to your parent. You understand cars like few drivers do. Now prove you can drive them too.',
    tagline: 'Born in the workshop',
    startAge: 21,
    startingMoney: 45000, // Realistic: modest savings from work
    startingReputation: 15,
    baseStats: {
      racecraft: 50,
      consistency: 55,
      wetSkill: 50,
      tireManagement: 60,
      technicalFeedback: 80,
      mentalStrength: 60,
      fitness: 55,
      marketability: 15 // Reduced: complete unknown, technical skill != brand appeal
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 2000,
      mediaScrutinyLevel: 'low',
      publicImageRating: 40,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: true,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 40,
      rivalJealousyPenalty: 0
    },
    icon: 'Wrench',
    color: 'slate',
    difficulty: 'hard'
  },
  
  recovering_champion: {
    id: 'recovering_champion',
    name: 'Recovering Champion',
    description: 'A horrific crash ended your championship run. After years of rehabilitation, you\'re medically cleared. Time to reclaim your throne.',
    tagline: 'The comeback king',
    startAge: 29,
    startingMoney: 300000, // Realistic: savings from championship career
    startingReputation: 60,
    baseStats: {
      racecraft: 70,
      consistency: 65,
      wetSkill: 65,
      tireManagement: 70,
      technicalFeedback: 70,
      mentalStrength: 60,
      fitness: 55,
      marketability: 35 // Reduced: comeback story has appeal but brand faded during absence
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 30,
      socialMediaFollowers: 150000,
      mediaScrutinyLevel: 'intense',
      publicImageRating: 75,
      hasProvenRacingRecord: true,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 25,
      rivalJealousyPenalty: -10
    },
    icon: 'Heart',
    color: 'red',
    difficulty: 'medium'
  },
  
  second_career: {
    id: 'second_career',
    name: 'Second Career',
    description: 'Ex-professional athlete turned racing driver. Your fitness is elite, but racecraft must be learned. The novelty attracts sponsors.',
    tagline: 'New challenge, same fire',
    startAge: 32,
    startingMoney: 600000, // Realistic: professional athlete savings
    startingReputation: 25,
    baseStats: {
      racecraft: 40,
      consistency: 50,
      wetSkill: 40,
      tireManagement: 45,
      technicalFeedback: 45,
      mentalStrength: 75,
      fitness: 85,
      marketability: 40 // Reduced: crossover appeal but unproven in motorsport
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 300000,
      mediaScrutinyLevel: 'high',
      publicImageRating: 70,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 0,
      rivalJealousyPenalty: -5
    },
    icon: 'Medal',
    color: 'green',
    difficulty: 'expert'
  },
  
  national_champion: {
    id: 'national_champion',
    name: 'National Champion',
    description: 'You dominated your home country\'s championship. Now it\'s time to prove yourself on the international stage.',
    tagline: 'Local legend, global ambitions',
    startAge: 23,
    startingMoney: 120000, // Realistic: national prize money + local sponsors
    startingReputation: 40,
    baseStats: {
      racecraft: 65,
      consistency: 65,
      wetSkill: 55,
      tireManagement: 60,
      technicalFeedback: 55,
      mentalStrength: 60,
      fitness: 65,
      marketability: 25 // Reduced: local hero, limited international recognition
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 75000,
      mediaScrutinyLevel: 'normal',
      publicImageRating: 60,
      hasProvenRacingRecord: true,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 5,
      rivalJealousyPenalty: 0
    },
    icon: 'Flag',
    color: 'emerald',
    difficulty: 'medium'
  },
  
  privateer: {
    id: 'privateer',
    name: 'Privateer',
    description: 'You\'ve saved everything to run your own program. No salary, but you keep prize money and choose your path. Ultimate independence.',
    tagline: 'Owner, driver, legend',
    startAge: 28,
    startingMoney: 1200000, // Realistic: running own GT program requires capital
    startingReputation: 20,
    baseStats: {
      racecraft: 55,
      consistency: 60,
      wetSkill: 55,
      tireManagement: 60,
      technicalFeedback: 65,
      mentalStrength: 70,
      fitness: 55,
      marketability: 20 // Reduced: independent operator, no brand yet
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 10000,
      mediaScrutinyLevel: 'low',
      publicImageRating: 45,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: true,
      isSimRacingCrossover: false,
      needsToProveWorth: true,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 20,
      rivalJealousyPenalty: 0
    },
    icon: 'Rocket',
    color: 'indigo',
    difficulty: 'expert'
  },
  
  // Custom scenario - placeholder values, traits will modify
  custom: {
    id: 'custom',
    name: 'Custom Background',
    description: 'Build your own unique story by selecting traits that define your character.',
    tagline: 'Write your own legend',
    startAge: 22,
    startingMoney: 75000, // Realistic base: enough for entry tier seat
    startingReputation: 20,
    baseStats: {
      racecraft: 50,
      consistency: 50,
      wetSkill: 50,
      tireManagement: 50,
      technicalFeedback: 50,
      mentalStrength: 50,
      fitness: 50,
      marketability: 15 // Reduced: blank slate, build from nothing
    },
    background: {
      affiliatedManufacturer: undefined,
      manufacturerRelationship: 0,
      socialMediaFollowers: 5000,
      mediaScrutinyLevel: 'normal',
      publicImageRating: 50,
      hasProvenRacingRecord: false,
      hasEngineeringBackground: false,
      isSimRacingCrossover: false,
      needsToProveWorth: false,
      hasPayDriverStigma: false,
      engineerRelationshipBonus: 0,
      rivalJealousyPenalty: 0
    },
    icon: 'Pencil',
    color: 'violet',
    difficulty: 'medium'
  }
}

// ============================================
// MANUFACTURER OPTIONS FOR ACADEMY
// ============================================

export const ACADEMY_MANUFACTURERS = [
  { id: 'bmw', name: 'BMW Junior Team', color: '#0066B1' },
  { id: 'porsche', name: 'Porsche Motorsport Junior', color: '#D5001C' },
  { id: 'ferrari', name: 'Ferrari Driver Academy', color: '#DC0000' },
  { id: 'mercedes', name: 'Mercedes-AMG Junior', color: '#00D2BE' },
  { id: 'audi', name: 'Audi Sport Academy', color: '#BB0A30' },
  { id: 'mclaren', name: 'McLaren Driver Development', color: '#FF8700' },
  { id: 'aston-martin', name: 'Aston Martin Racing Academy', color: '#006F62' }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all available traits
 */
export function getAllTraits(): BackstoryTrait[] {
  return Object.values(BACKSTORY_TRAITS)
}

/**
 * Get traits by category
 */
export function getTraitsByCategory(category: BackstoryTrait['category']): BackstoryTrait[] {
  return Object.values(BACKSTORY_TRAITS).filter(t => t.category === category)
}

/**
 * Check if traits are compatible
 */
export function areTraitsCompatible(traitIds: string[]): boolean {
  for (const traitId of traitIds) {
    const trait = BACKSTORY_TRAITS[traitId]
    if (trait?.incompatibleWith) {
      for (const incompatible of trait.incompatibleWith) {
        if (traitIds.includes(incompatible)) {
          return false
        }
      }
    }
  }
  return true
}

/**
 * Calculate combined effects from multiple traits
 */
export function calculateTraitEffects(traitIds: string[]): TraitEffects {
  const combined: TraitEffects = {
    statModifiers: {},
    startingMoneyModifier: 1.0,
    startingReputationModifier: 0,
    socialMediaFollowers: 0,
    connectionBonus: 0,
    engineerRelationshipBonus: 0,
    needsToProveWorth: false,
    hasPayDriverStigma: false,
    startsWithSponsor: false
  }
  
  for (const traitId of traitIds) {
    const trait = BACKSTORY_TRAITS[traitId]
    if (!trait) continue
    
    const effects = trait.effects
    
    // Merge stat modifiers
    if (effects.statModifiers) {
      for (const [stat, value] of Object.entries(effects.statModifiers)) {
        const key = stat as keyof DriverStats
        combined.statModifiers![key] = (combined.statModifiers![key] || 0) + (value || 0)
      }
    }
    
    // Multiply money modifiers
    if (effects.startingMoneyModifier) {
      combined.startingMoneyModifier! *= effects.startingMoneyModifier
    }
    
    // Add reputation modifiers
    if (effects.startingReputationModifier) {
      combined.startingReputationModifier! += effects.startingReputationModifier
    }
    
    // Take max social followers
    if (effects.socialMediaFollowers) {
      combined.socialMediaFollowers = Math.max(
        combined.socialMediaFollowers!,
        effects.socialMediaFollowers
      )
    }
    
    // Add connection bonuses
    if (effects.connectionBonus) {
      combined.connectionBonus! += effects.connectionBonus
    }
    
    // Add engineer relationship bonuses
    if (effects.engineerRelationshipBonus) {
      combined.engineerRelationshipBonus! += effects.engineerRelationshipBonus
    }
    
    // OR the boolean flags
    if (effects.needsToProveWorth) combined.needsToProveWorth = true
    if (effects.hasPayDriverStigma) combined.hasPayDriverStigma = true
    if (effects.startsWithSponsor) combined.startsWithSponsor = true
  }
  
  return combined
}

/**
 * Apply trait effects to a background scenario
 */
export function applyTraitsToScenario(
  baseScenario: BackgroundScenario,
  traitIds: string[],
  customAge?: number
): BackgroundScenario {
  const effects = calculateTraitEffects(traitIds)
  
  // Clone the scenario
  const modified: BackgroundScenario = JSON.parse(JSON.stringify(baseScenario))
  
  // Apply age if custom
  if (customAge) {
    modified.startAge = customAge
  }
  
  // Apply money modifier
  modified.startingMoney = Math.round(modified.startingMoney * (effects.startingMoneyModifier || 1))
  
  // Apply reputation modifier
  modified.startingReputation = Math.min(100, Math.max(0, 
    modified.startingReputation + (effects.startingReputationModifier || 0)
  ))
  
  // Apply stat modifiers
  if (effects.statModifiers) {
    for (const [stat, value] of Object.entries(effects.statModifiers)) {
      const key = stat as keyof DriverStats
      modified.baseStats[key] = Math.min(100, Math.max(0, modified.baseStats[key] + (value || 0)))
    }
  }
  
  // Apply social media followers
  if (effects.socialMediaFollowers && effects.socialMediaFollowers > modified.background.socialMediaFollowers) {
    modified.background.socialMediaFollowers = effects.socialMediaFollowers
  }
  
  // Apply connection bonus
  if (effects.connectionBonus) {
    if (modified.background.familyLegacy) {
      modified.background.familyLegacy.connectionBonus += effects.connectionBonus
    }
  }
  
  // Apply engineer relationship bonus
  modified.background.engineerRelationshipBonus += effects.engineerRelationshipBonus || 0
  
  // Apply flags
  if (effects.needsToProveWorth) modified.background.needsToProveWorth = true
  if (effects.hasPayDriverStigma) modified.background.hasPayDriverStigma = true
  
  // Apply media scrutiny changes
  let scrutinyLevels: MediaScrutinyLevel[] = ['low', 'normal', 'high', 'intense']
  let currentIdx = scrutinyLevels.indexOf(modified.background.mediaScrutinyLevel)
  
  for (const traitId of traitIds) {
    const trait = BACKSTORY_TRAITS[traitId]
    if (trait?.effects.mediaScrutinyChange) {
      currentIdx = Math.min(3, Math.max(0, currentIdx + trait.effects.mediaScrutinyChange))
    }
  }
  modified.background.mediaScrutinyLevel = scrutinyLevels[currentIdx]
  
  return modified
}

/**
 * Create a default PlayerBackground from a scenario
 */
export function createBackgroundFromScenario(
  scenario: BackgroundScenario,
  traitIds: string[] = [],
  affiliatedManufacturer?: string
): PlayerBackground {
  return {
    scenarioId: scenario.id,
    backstoryTraits: traitIds,
    affiliatedManufacturer: affiliatedManufacturer || scenario.background.affiliatedManufacturer,
    manufacturerRelationship: scenario.background.manufacturerRelationship,
    socialMediaFollowers: scenario.background.socialMediaFollowers,
    mediaScrutinyLevel: scenario.background.mediaScrutinyLevel,
    publicImageRating: scenario.background.publicImageRating,
    familyLegacy: scenario.background.familyLegacy,
    hasProvenRacingRecord: scenario.background.hasProvenRacingRecord,
    hasEngineeringBackground: scenario.background.hasEngineeringBackground,
    isSimRacingCrossover: scenario.background.isSimRacingCrossover,
    needsToProveWorth: scenario.background.needsToProveWorth,
    hasPayDriverStigma: scenario.background.hasPayDriverStigma,
    engineerRelationshipBonus: scenario.background.engineerRelationshipBonus,
    rivalJealousyPenalty: scenario.background.rivalJealousyPenalty
  }
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: BackgroundScenarioId): BackgroundScenario | undefined {
  return BACKGROUND_SCENARIOS[id]
}

/**
 * Get all preset scenarios (excluding custom)
 */
export function getPresetScenarios(): BackgroundScenario[] {
  return Object.values(BACKGROUND_SCENARIOS).filter(s => s.id !== 'custom')
}

/**
 * Format social media followers for display
 */
export function formatFollowers(count: number): string {
  return count.toLocaleString()
}

/**
 * Get difficulty description
 */
export function getDifficultyDescription(difficulty: BackgroundScenario['difficulty']): string {
  switch (difficulty) {
    case 'easy': return 'Good starting resources, fewer obstacles'
    case 'medium': return 'Balanced challenge with room to grow'
    case 'hard': return 'Limited resources, must prove yourself'
    case 'expert': return 'Maximum challenge, steep learning curve'
  }
}

