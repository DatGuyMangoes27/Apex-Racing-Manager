// ============================================
// LIFESTYLE & HEALTH CONFIGURATION
// ============================================
// Configuration for lifestyle levels, health, hobbies, and personal brand.

export type HobbyType = 
  | 'golf'
  | 'yachting'
  | 'car_collecting'
  | 'horse_racing'
  | 'art_collecting'
  | 'wine_collecting'
  | 'flying'
  | 'fishing'
  | 'photography'

export interface HobbyCompetition {
  id: string
  hobbyType: HobbyType
  name: string
  description: string
  frequency: 'monthly' | 'quarterly' | 'annual'
  minimumSkillLevel: number
  entryFee: number
  prizes: Array<{
    place: number
    cashReward: number
    prestigeBonus: number
  }>
  participantRange: {
    min: number
    max: number
  }
}

export type EquipmentTier = 'starter' | 'intermediate' | 'professional' | 'elite'

export interface LifestyleLevel {
  tier: 'modest' | 'comfortable' | 'affluent' | 'luxurious' | 'ultra_luxury'
  monthlyCost: number
}

export interface LifestyleTier {
  level: LifestyleLevel
  name: string
  description: string
}

export const LIFESTYLE_TIERS: LifestyleTier[] = [
  { level: { tier: 'modest', monthlyCost: 5000 }, name: 'Modest', description: 'Basic living' },
  { level: { tier: 'comfortable', monthlyCost: 15000 }, name: 'Comfortable', description: 'Comfortable lifestyle' },
  { level: { tier: 'affluent', monthlyCost: 50000 }, name: 'Affluent', description: 'Affluent lifestyle' },
  { level: { tier: 'luxurious', monthlyCost: 150000 }, name: 'Luxurious', description: 'Luxurious lifestyle' },
  { level: { tier: 'ultra_luxury', monthlyCost: 500000 }, name: 'Ultra Luxury', description: 'Ultra luxury lifestyle' }
]

export const HOBBY_COMPETITIONS: Record<HobbyType, HobbyCompetition[]> = {
  golf: [
    { id: 'golf_club_tourney', hobbyType: 'golf', name: 'Club Tournament', description: 'Local club championship', frequency: 'monthly', minimumSkillLevel: 20, entryFee: 500, prizes: [{ place: 1, cashReward: 5000, prestigeBonus: 3 }, { place: 2, cashReward: 2500, prestigeBonus: 1 }, { place: 3, cashReward: 1000, prestigeBonus: 0 }], participantRange: { min: 16, max: 32 } },
    { id: 'golf_regional', hobbyType: 'golf', name: 'Regional Amateur', description: 'Regional amateur championship', frequency: 'quarterly', minimumSkillLevel: 50, entryFee: 2500, prizes: [{ place: 1, cashReward: 25000, prestigeBonus: 8 }, { place: 2, cashReward: 10000, prestigeBonus: 4 }, { place: 3, cashReward: 5000, prestigeBonus: 2 }], participantRange: { min: 48, max: 96 } },
    { id: 'golf_celebrity', hobbyType: 'golf', name: 'Celebrity Pro-Am', description: 'High-profile charity event', frequency: 'annual', minimumSkillLevel: 60, entryFee: 50000, prizes: [{ place: 1, cashReward: 100000, prestigeBonus: 20 }, { place: 2, cashReward: 50000, prestigeBonus: 10 }, { place: 3, cashReward: 25000, prestigeBonus: 5 }], participantRange: { min: 24, max: 48 } }
  ],
  yachting: [
    { id: 'yacht_regatta', hobbyType: 'yachting', name: 'Local Regatta', description: 'Weekend sailing race', frequency: 'monthly', minimumSkillLevel: 25, entryFee: 2500, prizes: [{ place: 1, cashReward: 15000, prestigeBonus: 5 }, { place: 2, cashReward: 7500, prestigeBonus: 2 }, { place: 3, cashReward: 3000, prestigeBonus: 1 }], participantRange: { min: 8, max: 20 } },
    { id: 'yacht_offshore', hobbyType: 'yachting', name: 'Offshore Championship', description: 'Multi-day offshore race', frequency: 'quarterly', minimumSkillLevel: 60, entryFee: 25000, prizes: [{ place: 1, cashReward: 100000, prestigeBonus: 15 }, { place: 2, cashReward: 50000, prestigeBonus: 8 }, { place: 3, cashReward: 25000, prestigeBonus: 4 }], participantRange: { min: 12, max: 30 } }
  ],
  car_collecting: [
    { id: 'car_concours', hobbyType: 'car_collecting', name: 'Local Concours', description: 'Regional car show', frequency: 'monthly', minimumSkillLevel: 30, entryFee: 1000, prizes: [{ place: 1, cashReward: 5000, prestigeBonus: 5 }, { place: 2, cashReward: 2500, prestigeBonus: 2 }, { place: 3, cashReward: 1000, prestigeBonus: 1 }], participantRange: { min: 20, max: 50 } },
    { id: 'car_pebble', hobbyType: 'car_collecting', name: 'Elite Concours', description: 'Prestigious automotive gathering', frequency: 'annual', minimumSkillLevel: 70, entryFee: 25000, prizes: [{ place: 1, cashReward: 100000, prestigeBonus: 25 }, { place: 2, cashReward: 50000, prestigeBonus: 12 }, { place: 3, cashReward: 25000, prestigeBonus: 6 }], participantRange: { min: 50, max: 150 } }
  ],
  horse_racing: [
    { id: 'horse_local', hobbyType: 'horse_racing', name: 'Stakes Race', description: 'Local stakes competition', frequency: 'monthly', minimumSkillLevel: 35, entryFee: 10000, prizes: [{ place: 1, cashReward: 50000, prestigeBonus: 8 }, { place: 2, cashReward: 25000, prestigeBonus: 4 }, { place: 3, cashReward: 10000, prestigeBonus: 2 }], participantRange: { min: 8, max: 16 } },
    { id: 'horse_graded', hobbyType: 'horse_racing', name: 'Graded Stakes', description: 'Major graded race', frequency: 'quarterly', minimumSkillLevel: 65, entryFee: 50000, prizes: [{ place: 1, cashReward: 250000, prestigeBonus: 18 }, { place: 2, cashReward: 100000, prestigeBonus: 8 }, { place: 3, cashReward: 50000, prestigeBonus: 4 }], participantRange: { min: 10, max: 20 } }
  ],
  art_collecting: [
    { id: 'art_exhibition', hobbyType: 'art_collecting', name: 'Collection Exhibition', description: 'Featured collector showcase', frequency: 'quarterly', minimumSkillLevel: 40, entryFee: 5000, prizes: [{ place: 1, cashReward: 0, prestigeBonus: 15 }, { place: 2, cashReward: 0, prestigeBonus: 8 }, { place: 3, cashReward: 0, prestigeBonus: 4 }], participantRange: { min: 10, max: 20 } }
  ],
  wine_collecting: [
    { id: 'wine_tasting', hobbyType: 'wine_collecting', name: 'Blind Tasting Competition', description: 'Sommelier-judged tasting', frequency: 'monthly', minimumSkillLevel: 30, entryFee: 1000, prizes: [{ place: 1, cashReward: 5000, prestigeBonus: 5 }, { place: 2, cashReward: 2500, prestigeBonus: 2 }, { place: 3, cashReward: 1000, prestigeBonus: 1 }], participantRange: { min: 12, max: 24 } }
  ],
  flying: [
    { id: 'fly_airshow', hobbyType: 'flying', name: 'Air Show Performance', description: 'Demonstration flying', frequency: 'quarterly', minimumSkillLevel: 50, entryFee: 5000, prizes: [{ place: 1, cashReward: 25000, prestigeBonus: 12 }, { place: 2, cashReward: 10000, prestigeBonus: 6 }, { place: 3, cashReward: 5000, prestigeBonus: 3 }], participantRange: { min: 8, max: 20 } }
  ],
  fishing: [
    { id: 'fish_tournament', hobbyType: 'fishing', name: 'Fishing Tournament', description: 'Weekend catch competition', frequency: 'monthly', minimumSkillLevel: 20, entryFee: 500, prizes: [{ place: 1, cashReward: 10000, prestigeBonus: 3 }, { place: 2, cashReward: 5000, prestigeBonus: 1 }, { place: 3, cashReward: 2500, prestigeBonus: 0 }], participantRange: { min: 20, max: 50 } },
    { id: 'fish_championship', hobbyType: 'fishing', name: 'Championship Series', description: 'Major fishing championship', frequency: 'annual', minimumSkillLevel: 60, entryFee: 10000, prizes: [{ place: 1, cashReward: 100000, prestigeBonus: 10 }, { place: 2, cashReward: 50000, prestigeBonus: 5 }, { place: 3, cashReward: 25000, prestigeBonus: 2 }], participantRange: { min: 50, max: 100 } }
  ],
  photography: [
    { id: 'photo_contest', hobbyType: 'photography', name: 'Photo Contest', description: 'Monthly themed competition', frequency: 'monthly', minimumSkillLevel: 25, entryFee: 100, prizes: [{ place: 1, cashReward: 2500, prestigeBonus: 3 }, { place: 2, cashReward: 1000, prestigeBonus: 1 }, { place: 3, cashReward: 500, prestigeBonus: 0 }], participantRange: { min: 50, max: 200 } },
    { id: 'photo_exhibition', hobbyType: 'photography', name: 'Gallery Exhibition', description: 'Featured photographer showcase', frequency: 'annual', minimumSkillLevel: 60, entryFee: 2500, prizes: [{ place: 1, cashReward: 25000, prestigeBonus: 12 }, { place: 2, cashReward: 10000, prestigeBonus: 6 }, { place: 3, cashReward: 5000, prestigeBonus: 3 }], participantRange: { min: 20, max: 50 } }
  ]
}

// Helper function for competitions
export function getCompetitionsForHobby(hobbyType: HobbyType): HobbyCompetition[] {
  return HOBBY_COMPETITIONS[hobbyType] || []
}

export function getAvailableCompetitions(hobbyType: HobbyType, skillLevel: number): HobbyCompetition[] {
  const competitions = HOBBY_COMPETITIONS[hobbyType] || []
  return competitions.filter(c => skillLevel >= c.minimumSkillLevel)
}

// ============================================
// HOBBY ACHIEVEMENTS
// ============================================

export type AchievementCondition = 'skill_level' | 'hours_invested' | 'competition_wins' | 'years_active' | 'equipment_tier'

export interface HobbyAchievement {
  id: string
  hobbyType: HobbyType | 'any'
  name: string
  description: string
  condition: AchievementCondition
  threshold: number
  reward: {
    type: 'prestige' | 'cash' | 'unlock' | 'stress_reduction'
    value: number
    unlockId?: string
  }
  icon: string
}

export const HOBBY_ACHIEVEMENTS: HobbyAchievement[] = [
  // General achievements (any hobby)
  { id: 'ach_beginner', hobbyType: 'any', name: 'New Passion', description: 'Start your first hobby', condition: 'skill_level', threshold: 1, reward: { type: 'prestige', value: 2 }, icon: '🌱' },
  { id: 'ach_dedicated', hobbyType: 'any', name: 'Dedicated Hobbyist', description: 'Reach skill level 25', condition: 'skill_level', threshold: 25, reward: { type: 'prestige', value: 5 }, icon: '📚' },
  { id: 'ach_enthusiast', hobbyType: 'any', name: 'True Enthusiast', description: 'Reach skill level 50', condition: 'skill_level', threshold: 50, reward: { type: 'prestige', value: 10 }, icon: '⭐' },
  { id: 'ach_expert', hobbyType: 'any', name: 'Expert', description: 'Reach skill level 75', condition: 'skill_level', threshold: 75, reward: { type: 'prestige', value: 20 }, icon: '🏆' },
  { id: 'ach_master', hobbyType: 'any', name: 'Master', description: 'Reach skill level 100', condition: 'skill_level', threshold: 100, reward: { type: 'prestige', value: 50 }, icon: '👑' },
  { id: 'ach_time_100', hobbyType: 'any', name: 'Committed', description: 'Invest 100 hours', condition: 'hours_invested', threshold: 100, reward: { type: 'stress_reduction', value: 5 }, icon: '⏰' },
  { id: 'ach_time_500', hobbyType: 'any', name: 'Seasoned', description: 'Invest 500 hours', condition: 'hours_invested', threshold: 500, reward: { type: 'prestige', value: 8 }, icon: '📅' },
  { id: 'ach_time_1000', hobbyType: 'any', name: 'Veteran', description: 'Invest 1000 hours', condition: 'hours_invested', threshold: 1000, reward: { type: 'prestige', value: 15 }, icon: '🎖️' },
  { id: 'ach_years_5', hobbyType: 'any', name: 'Long-term Hobbyist', description: '5 years active', condition: 'years_active', threshold: 5, reward: { type: 'prestige', value: 10 }, icon: '🗓️' },
  { id: 'ach_years_10', hobbyType: 'any', name: 'Lifelong Passion', description: '10 years active', condition: 'years_active', threshold: 10, reward: { type: 'prestige', value: 25 }, icon: '💎' },
  { id: 'ach_win_first', hobbyType: 'any', name: 'First Victory', description: 'Win your first competition', condition: 'competition_wins', threshold: 1, reward: { type: 'prestige', value: 5 }, icon: '🥇' },
  { id: 'ach_win_5', hobbyType: 'any', name: 'Serial Winner', description: 'Win 5 competitions', condition: 'competition_wins', threshold: 5, reward: { type: 'prestige', value: 15 }, icon: '🏅' },
  { id: 'ach_elite_equip', hobbyType: 'any', name: 'Elite Equipped', description: 'Acquire elite equipment', condition: 'equipment_tier', threshold: 4, reward: { type: 'prestige', value: 10 }, icon: '💼' },
  
  // Golf specific
  { id: 'ach_golf_ace', hobbyType: 'golf', name: 'Golf Ace', description: 'Reach skill 75 in golf', condition: 'skill_level', threshold: 75, reward: { type: 'cash', value: 25000 }, icon: '⛳' },
  
  // Yachting specific
  { id: 'ach_yacht_captain', hobbyType: 'yachting', name: 'Captain', description: 'Reach skill 75 in yachting', condition: 'skill_level', threshold: 75, reward: { type: 'prestige', value: 25 }, icon: '⚓' },
  
  // Flying specific
  { id: 'ach_pilot_ace', hobbyType: 'flying', name: 'Ace Pilot', description: 'Reach skill 75 in flying', condition: 'skill_level', threshold: 75, reward: { type: 'prestige', value: 30 }, icon: '✈️' }
]

// Helper functions for achievements
export function getAchievementsForHobby(hobbyType: HobbyType): HobbyAchievement[] {
  return HOBBY_ACHIEVEMENTS.filter(a => a.hobbyType === hobbyType || a.hobbyType === 'any')
}

export function checkAchievementProgress(
  achievement: HobbyAchievement, 
  hobby: Hobby, 
  competitionWins: number = 0,
  equipmentTier: EquipmentTier | null = null
): { completed: boolean; progress: number } {
  let currentValue = 0
  
  switch (achievement.condition) {
    case 'skill_level':
      currentValue = hobby.skillLevel
      break
    case 'hours_invested':
      currentValue = hobby.hoursInvested || 0
      break
    case 'years_active':
      currentValue = hobby.yearsActive || 0
      break
    case 'competition_wins':
      currentValue = competitionWins
      break
    case 'equipment_tier':
      const tierValues: Record<EquipmentTier, number> = { starter: 1, intermediate: 2, professional: 3, elite: 4 }
      currentValue = equipmentTier ? tierValues[equipmentTier] : 0
      break
  }
  
  return {
    completed: currentValue >= achievement.threshold,
    progress: Math.min(100, (currentValue / achievement.threshold) * 100)
  }
}

// ============================================
// HOBBY MONETIZATION
// ============================================

export type MonetizationType = 'teaching' | 'sponsorship' | 'content_creation' | 'consulting'

export interface HobbyMonetization {
  type: MonetizationType
  name: string
  description: string
  minimumSkillLevel: number
  minimumPrestige?: number
  monthlyIncome: number     // Base income, scales with skill
  skillMultiplier: number   // How much skill affects income
  prestigeRequirement?: number
}

export const HOBBY_MONETIZATION_OPTIONS: Record<HobbyType, HobbyMonetization[]> = {
  golf: [
    { type: 'teaching', name: 'Golf Lessons', description: 'Teach beginners and intermediates', minimumSkillLevel: 50, monthlyIncome: 2000, skillMultiplier: 0.04 },
    { type: 'content_creation', name: 'Golf Content', description: 'Create instructional content', minimumSkillLevel: 40, monthlyIncome: 1000, skillMultiplier: 0.03 },
    { type: 'sponsorship', name: 'Equipment Sponsorship', description: 'Brand partnership', minimumSkillLevel: 75, minimumPrestige: 60, monthlyIncome: 5000, skillMultiplier: 0.08 }
  ],
  yachting: [
    { type: 'consulting', name: 'Sailing Consultant', description: 'Advise on yacht purchases', minimumSkillLevel: 60, monthlyIncome: 5000, skillMultiplier: 0.06 },
    { type: 'sponsorship', name: 'Marine Sponsorship', description: 'Brand ambassador', minimumSkillLevel: 80, minimumPrestige: 70, monthlyIncome: 10000, skillMultiplier: 0.10 }
  ],
  car_collecting: [
    { type: 'consulting', name: 'Automotive Consultant', description: 'Advise on collectible car purchases', minimumSkillLevel: 50, monthlyIncome: 3000, skillMultiplier: 0.05 },
    { type: 'content_creation', name: 'Car Content', description: 'Create automotive content', minimumSkillLevel: 40, monthlyIncome: 2000, skillMultiplier: 0.04 }
  ],
  horse_racing: [
    { type: 'consulting', name: 'Racing Consultant', description: 'Advise on horse purchases', minimumSkillLevel: 60, monthlyIncome: 8000, skillMultiplier: 0.08 },
    { type: 'sponsorship', name: 'Racing Sponsorship', description: 'Stable sponsor partnerships', minimumSkillLevel: 75, minimumPrestige: 65, monthlyIncome: 15000, skillMultiplier: 0.12 }
  ],
  art_collecting: [
    { type: 'consulting', name: 'Art Advisor', description: 'Advise on art acquisitions', minimumSkillLevel: 55, monthlyIncome: 5000, skillMultiplier: 0.06 },
    { type: 'content_creation', name: 'Art Criticism', description: 'Write about art', minimumSkillLevel: 45, monthlyIncome: 2000, skillMultiplier: 0.03 }
  ],
  wine_collecting: [
    { type: 'consulting', name: 'Wine Consultant', description: 'Advise on wine purchases', minimumSkillLevel: 50, monthlyIncome: 3000, skillMultiplier: 0.05 },
    { type: 'content_creation', name: 'Wine Writing', description: 'Write about wine', minimumSkillLevel: 40, monthlyIncome: 1500, skillMultiplier: 0.03 }
  ],
  flying: [
    { type: 'teaching', name: 'Flight Instruction', description: 'Certified flight instructor', minimumSkillLevel: 70, monthlyIncome: 4000, skillMultiplier: 0.05 },
    { type: 'consulting', name: 'Aviation Consultant', description: 'Advise on aircraft purchases', minimumSkillLevel: 60, monthlyIncome: 6000, skillMultiplier: 0.07 }
  ],
  fishing: [
    { type: 'teaching', name: 'Fishing Guide', description: 'Guide fishing trips', minimumSkillLevel: 45, monthlyIncome: 1500, skillMultiplier: 0.03 },
    { type: 'content_creation', name: 'Fishing Content', description: 'Create fishing content', minimumSkillLevel: 35, monthlyIncome: 800, skillMultiplier: 0.02 },
    { type: 'sponsorship', name: 'Tackle Sponsorship', description: 'Equipment partnerships', minimumSkillLevel: 65, monthlyIncome: 2500, skillMultiplier: 0.04 }
  ],
  photography: [
    { type: 'teaching', name: 'Photography Classes', description: 'Teach photography', minimumSkillLevel: 45, monthlyIncome: 1500, skillMultiplier: 0.03 },
    { type: 'content_creation', name: 'Photography Content', description: 'Sell photos and tutorials', minimumSkillLevel: 35, monthlyIncome: 1000, skillMultiplier: 0.025 },
    { type: 'consulting', name: 'Commercial Photography', description: 'Commercial photo work', minimumSkillLevel: 55, monthlyIncome: 4000, skillMultiplier: 0.05 }
  ]
}

// Helper functions for monetization
export function getMonetizationOptions(hobbyType: HobbyType): HobbyMonetization[] {
  return HOBBY_MONETIZATION_OPTIONS[hobbyType] || []
}

export function getAvailableMonetization(hobbyType: HobbyType, skillLevel: number, prestige: number = 0): HobbyMonetization[] {
  const options = HOBBY_MONETIZATION_OPTIONS[hobbyType] || []
  return options.filter(m => 
    skillLevel >= m.minimumSkillLevel && 
    (!m.minimumPrestige || prestige >= m.minimumPrestige)
  )
}

export function calculateMonetizationIncome(option: HobbyMonetization, skillLevel: number): number {
  // Base income + skill bonus
  const skillBonus = (skillLevel - option.minimumSkillLevel) * option.skillMultiplier * option.monthlyIncome
  return Math.round(option.monthlyIncome + skillBonus)
}

// ============================================
// PERSONAL BRAND
// ============================================

export interface PersonalBrand {
  brandValue: number              // 0-100
  publicImage: number             // 0-100
  mediaPresence: number           // 0-100
  
  // Active deals
  endorsements: Endorsement[]
  mediaDeals: MediaDeal[]
  
  // Speaking/appearances
  speakingFee: number             // Per engagement
  annualAppearances: number
  
  // Reputation tracking
  reputationEvents: ReputationEvent[]
  
  // Privacy & social media
  privacyLevel?: 'open_book' | 'balanced' | 'private' | 'reclusive'
  socialMediaFollowing?: number
}

export interface Endorsement {
  id: string
  brandName: string
  industry: string
  annualValue: number
  durationYears: number
  yearsRemaining: number
  
  // Requirements
  minimumPublicImage: number
  exclusivity: boolean            // Can't endorse competitors
  
  // Bonuses
  publicImageBonus: number
  
  // Status
  status?: 'active' | 'pending' | 'expired' | 'rejected'
}

export interface MediaDeal {
  id: string
  type: 'autobiography' | 'documentary' | 'podcast' | 'reality_show' | 'consulting'
  name: string
  
  totalValue: number
  upfrontPayment: number
  royaltiesPercentage?: number
  
  startDate: { week: number; year: number }
  durationWeeks: number
  
  publicImageImpact: number       // Can be positive or negative
  timeCommitmentHoursPerWeek: number
}

export interface ReputationEvent {
  id: string
  type: 'positive' | 'negative' | 'neutral'
  category: 'racing' | 'business' | 'personal' | 'charity' | 'scandal'
  description: string
  impact: number                  // -100 to +100
  date: { week: number; year: number }
  decayWeeks: number              // How long until impact fades
}

// ============================================
// SOCIAL CIRCLE
// ============================================

export type ContactType =
  | 'business_mogul'
  | 'celebrity'
  | 'politician'
  | 'athlete'
  | 'journalist'
  | 'team_owner'
  | 'driver'
  | 'sponsor_exec'
  | 'banker'
  | 'lawyer'

export interface SocialContact {
  id: string
  name: string
  type: ContactType
  
  // Relationship
  relationshipLevel: number       // 0-100
  trustLevel: number              // 0-100
  lastInteraction: { week: number; year: number }
  
  // Value they provide
  benefits: {
    sponsorConnections?: number
    investmentTips?: number
    legalHelp?: number
    mediaInfluence?: number
    politicalInfluence?: number
    racingInsider?: number
  }
  
  // Favors
  favorsOwed: number              // They owe you
  favorsOwing: number             // You owe them
}

export const CONTACT_TYPE_BENEFITS: Record<ContactType, SocialContact['benefits']> = {
  business_mogul: { sponsorConnections: 20, investmentTips: 30 },
  celebrity: { mediaInfluence: 30, sponsorConnections: 15 },
  politician: { politicalInfluence: 40, legalHelp: 15 },
  athlete: { mediaInfluence: 15 },
  journalist: { mediaInfluence: 40 },
  team_owner: { racingInsider: 40, sponsorConnections: 20 },
  driver: { racingInsider: 30 },
  sponsor_exec: { sponsorConnections: 50 },
  banker: { investmentTips: 40, legalHelp: 10 },
  lawyer: { legalHelp: 50 }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getLifestyleTier(level: LifestyleLevel): LifestyleTier {
  return LIFESTYLE_TIERS.find(t => t.level === level) || LIFESTYLE_TIERS[0]
}

export function calculateAgeEffects(age: number): {
  physicalDecline: number
  wisdomBonus: number
  networkBonus: number
  energyPenalty: number
} {
  // Peak performance around 40-50 for team owner
  const physicalDecline = age > 50 ? (age - 50) * 0.5 : 0
  const wisdomBonus = Math.min(30, age * 0.5)
  const networkBonus = Math.min(25, (age - 25) * 0.5)
  const energyPenalty = age > 60 ? (age - 60) * 1 : 0
  
  return { physicalDecline, wisdomBonus, networkBonus, energyPenalty }
}

export function calculateLifeExpectancy(
  baseAge: number,
  health: OwnerHealth,
  lifestyleLevel: LifestyleLevel
): number {
  // Base expectancy
  let expectancy = 82
  
  // Health factors
  expectancy += (health.physicalHealth - 50) * 0.1
  expectancy += (health.mentalHealth - 50) * 0.05
  expectancy -= health.stressLevel * 0.05
  
  // Healthcare quality
  const healthcareBonuses: Record<string, number> = {
    basic: 0,
    premium: 2,
    concierge: 4,
    world_class: 7
  }
  expectancy += healthcareBonuses[health.healthcareLevel]
  
  // Lifestyle (moderate living is best)
  if (lifestyleLevel === 'comfortable' || lifestyleLevel === 'affluent') {
    expectancy += 2
  } else if (lifestyleLevel === 'frugal') {
    expectancy -= 1
  } else if (lifestyleLevel === 'ultra_luxury') {
    expectancy += 3 // Access to best healthcare
  }
  
  // Active conditions
  for (const condition of health.activeConditions) {
    if (condition.severity === 'serious') expectancy -= 3
    else if (condition.severity === 'critical') expectancy -= 7
    else if (condition.severity === 'moderate') expectancy -= 1
  }
  
  return Math.max(baseAge + 5, Math.round(expectancy))
}

export function getHealthConditionDescription(health: number): HealthCondition {
  if (health >= 90) return 'excellent'
  if (health >= 70) return 'good'
  if (health >= 50) return 'fair'
  if (health >= 30) return 'poor'
  return 'critical'
}
