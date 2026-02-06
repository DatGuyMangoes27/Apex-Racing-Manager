// ============================================
// DEEP HOBBY SYSTEM CONFIGURATION
// ============================================
// Extended hobby system with skill trees, lessons, practice, and milestones.
// Builds upon the basic hobbies in lifestyle-config.ts

// ============================================
// HOBBY CATEGORIES
// ============================================

export type HobbyCategory = 
  | 'music'
  | 'language'
  | 'culinary'
  | 'sport'
  | 'creative'
  | 'intellectual'
  | 'collecting'

export type MasteryTier = 
  | 'novice'        // 0-19
  | 'beginner'      // 20-39
  | 'intermediate'  // 40-59
  | 'advanced'      // 60-79
  | 'expert'        // 80-94
  | 'master'        // 95-100

// ============================================
// DEEP HOBBY INTERFACE
// ============================================

export interface DeepHobby {
  id: string
  name: string
  category: HobbyCategory
  description: string
  
  // Skill progression
  currentLevel: number          // 0-100
  experiencePoints: number
  xpToNextLevel: number
  masteryTier: MasteryTier
  
  // Learning
  hasInstructor: boolean
  instructor?: HobbyInstructor
  lessonsCompleted: number
  nextLessonAvailable?: { week: number; day: number; year: number }
  
  // Practice
  practiceHoursThisWeek: number
  practiceHoursTotal: number
  optimalPracticeHours: number    // Diminishing returns after this
  lastPracticeDay?: { week: number; day: number; year: number }
  streakDays: number              // Consecutive days practiced
  longestStreak: number
  
  // Achievements & Milestones
  milestonesUnlocked: string[]
  canPerformPublicly: boolean     // Unlocked at certain level
  canTeachOthers: boolean         // Unlocked at master level
  
  // Social aspects
  hobbyContacts: string[]         // People met through this hobby
  eventsAttended: number          // Hobby-related events
  competitionsEntered: number
  competitionWins: number
  awardsWon: string[]
  
  // Costs
  monthlyCost: number
  totalInvested: number
  
  // Time tracking
  startDate: { week: number; year: number }
  yearsActive: number
  
  // Effects on player
  stressReductionBonus: number
  networkingBonus: number
  publicImageBonus: number
  
  // Special unlocks
  specialAbilities: string[]
}

// ============================================
// INSTRUCTOR SYSTEM
// ============================================

export interface HobbyInstructor {
  id: string
  name: string
  hobbyId: string
  
  // Quality
  skillLevel: number            // 70-100
  teachingAbility: number       // How well they convey knowledge
  reputation: string            // "World-renowned pianist", etc.
  
  // Costs
  lessonCost: number            // Per lesson
  frequency: 'weekly' | 'biweekly' | 'monthly'
  
  // Relationship
  relationshipLevel: number     // 0-100, can become a social contact
  lessonsGiven: number
  
  // Special traits
  traits: InstructorTrait[]
  
  // Availability
  isAvailable: boolean
  bookedUntilWeek?: number
}

export type InstructorTrait = 
  | 'patient'           // Better for beginners
  | 'demanding'         // Faster progress but more stress
  | 'celebrity'         // Boosts public image
  | 'connected'         // Introduces you to people
  | 'inspiring'         // Extra motivation
  | 'perfectionist'     // Higher skill ceiling
  | 'retired_champion'  // Special techniques

// ============================================
// LESSON SYSTEM
// ============================================

export interface HobbyLesson {
  id: string
  hobbyId: string
  instructorId: string
  
  lessonType: 'private' | 'group' | 'masterclass' | 'workshop' | 'online'
  cost: number
  duration: number  // hours
  
  // Learning outcomes
  xpGain: { min: number; max: number }
  skillFocus?: string             // Specific technique being learned
  
  // Social
  otherStudents?: string[]        // Potential new contacts in group lessons
  networkingOpportunity: boolean
  
  // Scheduling
  scheduledFor: { week: number; day: number; year: number }
  isCompleted: boolean
  
  // Results (after completion)
  actualXpGained?: number
  feedback?: string
  breakthroughMoment?: boolean    // Special learning moment
}

export const LESSON_TYPES: Record<string, {
  xpMultiplier: number
  costMultiplier: number
  networkingBonus: number
  description: string
}> = {
  private: {
    xpMultiplier: 1.5,
    costMultiplier: 2.0,
    networkingBonus: 0,
    description: 'One-on-one instruction for maximum learning'
  },
  group: {
    xpMultiplier: 1.0,
    costMultiplier: 0.5,
    networkingBonus: 15,
    description: 'Learn with peers and make connections'
  },
  masterclass: {
    xpMultiplier: 2.0,
    costMultiplier: 5.0,
    networkingBonus: 25,
    description: 'Intensive session with a master'
  },
  workshop: {
    xpMultiplier: 1.2,
    costMultiplier: 1.0,
    networkingBonus: 20,
    description: 'Hands-on learning with practical focus'
  },
  online: {
    xpMultiplier: 0.7,
    costMultiplier: 0.3,
    networkingBonus: 0,
    description: 'Flexible learning from anywhere'
  }
}

// ============================================
// MILESTONE SYSTEM
// ============================================

export interface HobbyMilestone {
  id: string
  hobbyId: string
  name: string
  description: string
  levelRequired: number
  
  // Unlock conditions
  requiresPracticeHours?: number
  requiresLessons?: number
  requiresCompetitions?: number
  
  // Rewards
  unlocksAbility?: string         // "Can play at charity events"
  unlocksEvent?: string           // "Invited to amateur tournament"
  reputationBonus?: number
  networkingBonus?: number
  contactUnlock?: string          // Meet someone famous in the field
  publicImageBonus?: number
  
  // Display
  icon: string
  celebrationText: string
}

// ============================================
// HOBBY DEFINITIONS
// ============================================

export interface HobbyDefinition {
  id: string
  name: string
  category: HobbyCategory
  description: string
  
  // Costs
  initialInvestment: number       // Equipment, etc.
  monthlyCost: number
  lessonCostBase: number
  
  // Learning curve
  difficultyLevel: number         // 1-10
  xpPerPracticeHour: number
  optimalPracticeHours: number
  
  // Effects
  baseStressReduction: number
  baseNetworkingBonus: number
  basePublicImageBonus: number
  
  // Milestones
  milestones: Omit<HobbyMilestone, 'hobbyId'>[]
  
  // Racing connection
  hasRacingConnection: boolean
  racingConnectionDescription?: string
}

export const DEEP_HOBBIES: HobbyDefinition[] = [
  // ============================================
  // MUSIC
  // ============================================
  {
    id: 'piano',
    name: 'Piano',
    category: 'music',
    description: 'Master the keys from classical to jazz',
    initialInvestment: 15000,
    monthlyCost: 500,
    lessonCostBase: 150,
    difficultyLevel: 7,
    xpPerPracticeHour: 10,
    optimalPracticeHours: 10,
    baseStressReduction: 20,
    baseNetworkingBonus: 10,
    basePublicImageBonus: 15,
    hasRacingConnection: false,
    milestones: [
      { id: 'piano_first_song', name: 'First Song', description: 'Can play a complete piece', levelRequired: 10, icon: '🎵', celebrationText: 'You played your first complete song!' },
      { id: 'piano_party_piece', name: 'Party Piece', description: 'Can entertain guests at home', levelRequired: 25, unlocksAbility: 'Perform at home gatherings', icon: '🎹', celebrationText: 'You can now impress guests!' },
      { id: 'piano_public', name: 'Public Performance', description: 'Can play at charity events', levelRequired: 50, unlocksEvent: 'Charity performance invitations', reputationBonus: 5, icon: '🎤', celebrationText: 'You\'re ready for the spotlight!' },
      { id: 'piano_concert', name: 'Concert Ready', description: 'Invited to perform at galas', levelRequired: 75, publicImageBonus: 10, unlocksEvent: 'Gala performances', icon: '🎼', celebrationText: 'World-class venues await!' },
      { id: 'piano_virtuoso', name: 'Virtuoso', description: 'World-class amateur', levelRequired: 95, publicImageBonus: 20, contactUnlock: 'Famous musicians', icon: '👑', celebrationText: 'You\'ve achieved virtuoso status!' }
    ]
  },
  {
    id: 'guitar',
    name: 'Guitar',
    category: 'music',
    description: 'From acoustic ballads to electric solos',
    initialInvestment: 5000,
    monthlyCost: 200,
    lessonCostBase: 100,
    difficultyLevel: 6,
    xpPerPracticeHour: 12,
    optimalPracticeHours: 8,
    baseStressReduction: 25,
    baseNetworkingBonus: 15,
    basePublicImageBonus: 12,
    hasRacingConnection: false,
    milestones: [
      { id: 'guitar_chords', name: 'Chord Master', description: 'Know all basic chords', levelRequired: 15, icon: '🎸', celebrationText: 'You\'ve mastered the basics!' },
      { id: 'guitar_campfire', name: 'Campfire Ready', description: 'Can lead singalongs', levelRequired: 30, unlocksAbility: 'Casual performances', icon: '🔥', celebrationText: 'Perfect for those team building moments!' },
      { id: 'guitar_jam', name: 'Jam Session', description: 'Can jam with other musicians', levelRequired: 50, networkingBonus: 10, icon: '🎵', celebrationText: 'Time to find your band!' },
      { id: 'guitar_stage', name: 'Stage Presence', description: 'Can perform professionally', levelRequired: 75, publicImageBonus: 15, icon: '🎤', celebrationText: 'Rock star status unlocked!' }
    ]
  },
  
  // ============================================
  // LANGUAGES
  // ============================================
  {
    id: 'italian',
    name: 'Italian',
    category: 'language',
    description: 'The language of Ferrari, Lamborghini, and passion',
    initialInvestment: 500,
    monthlyCost: 300,
    lessonCostBase: 75,
    difficultyLevel: 5,
    xpPerPracticeHour: 15,
    optimalPracticeHours: 7,
    baseStressReduction: 10,
    baseNetworkingBonus: 25,
    basePublicImageBonus: 10,
    hasRacingConnection: true,
    racingConnectionDescription: 'Invaluable for Italian sponsors and teams',
    milestones: [
      { id: 'italian_basics', name: 'Ciao!', description: 'Basic greetings and phrases', levelRequired: 10, icon: '🇮🇹', celebrationText: 'You can introduce yourself in Italian!' },
      { id: 'italian_order', name: 'Menu Master', description: 'Can order at restaurants', levelRequired: 25, icon: '🍝', celebrationText: 'No more pointing at the menu!' },
      { id: 'italian_convo', name: 'Conversational', description: 'Can hold basic conversations', levelRequired: 45, unlocksAbility: 'Italian media interviews', networkingBonus: 15, icon: '💬', celebrationText: 'You can chat with Italian contacts!' },
      { id: 'italian_business', name: 'Business Italian', description: 'Can discuss business in Italian', levelRequired: 65, networkingBonus: 25, icon: '💼', celebrationText: 'Italian sponsors are impressed!' },
      { id: 'italian_fluent', name: 'Fluent', description: 'Native-level fluency', levelRequired: 90, publicImageBonus: 15, contactUnlock: 'Italian racing legends', icon: '🎓', celebrationText: 'Perfetto! You\'re fluent in Italian!' }
    ]
  },
  {
    id: 'japanese',
    name: 'Japanese',
    category: 'language',
    description: 'Connect with Japanese manufacturers and culture',
    initialInvestment: 800,
    monthlyCost: 400,
    lessonCostBase: 100,
    difficultyLevel: 9,
    xpPerPracticeHour: 8,
    optimalPracticeHours: 10,
    baseStressReduction: 15,
    baseNetworkingBonus: 20,
    basePublicImageBonus: 12,
    hasRacingConnection: true,
    racingConnectionDescription: 'Opens doors with Toyota, Honda, and Nissan',
    milestones: [
      { id: 'japanese_hiragana', name: 'Hiragana', description: 'Can read basic characters', levelRequired: 15, icon: 'あ', celebrationText: 'You\'ve mastered hiragana!' },
      { id: 'japanese_greetings', name: 'Polite Greetings', description: 'Proper Japanese etiquette', levelRequired: 30, networkingBonus: 10, icon: '🙇', celebrationText: 'Your politeness impresses Japanese contacts!' },
      { id: 'japanese_convo', name: 'Conversational', description: 'Can discuss topics in Japanese', levelRequired: 55, unlocksAbility: 'Japanese media appearances', icon: '💬', celebrationText: 'You can hold your own in Japanese!' },
      { id: 'japanese_fluent', name: 'Fluent', description: 'Near-native fluency', levelRequired: 90, contactUnlock: 'Japanese racing executives', icon: '🎌', celebrationText: 'Incredible achievement!' }
    ]
  },
  {
    id: 'german',
    name: 'German',
    category: 'language',
    description: 'The language of Porsche, Mercedes, and BMW',
    initialInvestment: 500,
    monthlyCost: 300,
    lessonCostBase: 80,
    difficultyLevel: 6,
    xpPerPracticeHour: 12,
    optimalPracticeHours: 7,
    baseStressReduction: 10,
    baseNetworkingBonus: 22,
    basePublicImageBonus: 8,
    hasRacingConnection: true,
    racingConnectionDescription: 'Essential for German manufacturers and DTM connections',
    milestones: [
      { id: 'german_basics', name: 'Guten Tag!', description: 'Basic German greetings', levelRequired: 10, icon: '🇩🇪', celebrationText: 'You can greet in German!' },
      { id: 'german_convo', name: 'Conversational', description: 'Can discuss basic topics', levelRequired: 45, networkingBonus: 15, icon: '💬', celebrationText: 'German contacts appreciate your effort!' },
      { id: 'german_technical', name: 'Technical German', description: 'Can discuss engineering', levelRequired: 65, unlocksAbility: 'Technical discussions with engineers', icon: '⚙️', celebrationText: 'Engineers respect your expertise!' },
      { id: 'german_fluent', name: 'Fluent', description: 'Business-level fluency', levelRequired: 85, contactUnlock: 'German motorsport executives', icon: '🎓', celebrationText: 'Ausgezeichnet! You\'re fluent!' }
    ]
  },
  
  // ============================================
  // CULINARY
  // ============================================
  {
    id: 'cooking',
    name: 'Gourmet Cooking',
    category: 'culinary',
    description: 'Master the culinary arts from home cooking to haute cuisine',
    initialInvestment: 10000,
    monthlyCost: 800,
    lessonCostBase: 200,
    difficultyLevel: 5,
    xpPerPracticeHour: 14,
    optimalPracticeHours: 6,
    baseStressReduction: 25,
    baseNetworkingBonus: 15,
    basePublicImageBonus: 10,
    hasRacingConnection: false,
    milestones: [
      { id: 'cooking_basics', name: 'Home Chef', description: 'Can prepare quality meals', levelRequired: 15, icon: '👨‍🍳', celebrationText: 'Your cooking is getting good!' },
      { id: 'cooking_romantic', name: 'Romantic Dinners', description: 'Can prepare impressive date meals', levelRequired: 30, unlocksAbility: 'Home-cooked date nights', icon: '❤️', celebrationText: 'Perfect for impressing your partner!' },
      { id: 'cooking_host', name: 'Dinner Party Host', description: 'Can host multi-course events', levelRequired: 50, unlocksEvent: 'Hosted dinner parties', networkingBonus: 15, icon: '🍽️', celebrationText: 'Your dinner parties are legendary!' },
      { id: 'cooking_celebrity', name: 'Celebrity Chef', description: 'Cookbook deal opportunity', levelRequired: 80, publicImageBonus: 15, unlocksEvent: 'Cookbook offer', icon: '📖', celebrationText: 'Publishers are interested in your recipes!' },
      { id: 'cooking_master', name: 'Master Chef', description: 'Professional-level skills', levelRequired: 95, contactUnlock: 'Celebrity chefs', icon: '⭐', celebrationText: 'You could open your own restaurant!' }
    ]
  },
  {
    id: 'wine',
    name: 'Wine Expertise',
    category: 'culinary',
    description: 'Become a sommelier-level wine expert',
    initialInvestment: 25000,
    monthlyCost: 2000,
    lessonCostBase: 300,
    difficultyLevel: 6,
    xpPerPracticeHour: 10,
    optimalPracticeHours: 4,
    baseStressReduction: 15,
    baseNetworkingBonus: 25,
    basePublicImageBonus: 15,
    hasRacingConnection: false,
    milestones: [
      { id: 'wine_basics', name: 'Wine Novice', description: 'Know the major varieties', levelRequired: 15, icon: '🍷', celebrationText: 'You can appreciate good wine!' },
      { id: 'wine_tasting', name: 'Tasting Notes', description: 'Can blind taste varieties', levelRequired: 35, icon: '👃', celebrationText: 'Your palate is developing!' },
      { id: 'wine_cellar', name: 'Cellar Curator', description: 'Build an impressive collection', levelRequired: 55, unlocksAbility: 'Host wine tastings', networkingBonus: 20, icon: '🏰', celebrationText: 'Your cellar impresses visitors!' },
      { id: 'wine_sommelier', name: 'Sommelier Level', description: 'Professional-grade expertise', levelRequired: 80, contactUnlock: 'Vineyard owners', publicImageBonus: 10, icon: '🎓', celebrationText: 'You rival professional sommeliers!' }
    ]
  },
  
  // ============================================
  // SPORTS
  // ============================================
  {
    id: 'golf',
    name: 'Golf',
    category: 'sport',
    description: 'The classic networking sport',
    initialInvestment: 5000,
    monthlyCost: 3000,
    lessonCostBase: 150,
    difficultyLevel: 7,
    xpPerPracticeHour: 10,
    optimalPracticeHours: 8,
    baseStressReduction: 20,
    baseNetworkingBonus: 35,
    basePublicImageBonus: 10,
    hasRacingConnection: true,
    racingConnectionDescription: 'Many sponsor deals happen on the golf course',
    milestones: [
      { id: 'golf_basics', name: 'On the Fairway', description: 'Can complete 18 holes', levelRequired: 15, icon: '⛳', celebrationText: 'You can play a full round!' },
      { id: 'golf_bogey', name: 'Bogey Golfer', description: 'Averaging bogey or better', levelRequired: 35, icon: '🏌️', celebrationText: 'You\'re becoming respectable!' },
      { id: 'golf_corporate', name: 'Corporate Ready', description: 'Good enough for business golf', levelRequired: 50, unlocksAbility: 'Sponsor golf outings', networkingBonus: 20, icon: '💼', celebrationText: 'Sponsors want you on their team!' },
      { id: 'golf_scratch', name: 'Scratch Golfer', description: 'Playing at par', levelRequired: 80, publicImageBonus: 10, unlocksEvent: 'Celebrity golf tournaments', icon: '🏆', celebrationText: 'You\'re a scratch golfer!' },
      { id: 'golf_champion', name: 'Club Champion', description: 'Tournament winner', levelRequired: 95, contactUnlock: 'Pro golfers', icon: '👑', celebrationText: 'You could turn pro!' }
    ]
  },
  {
    id: 'tennis',
    name: 'Tennis',
    category: 'sport',
    description: 'Elegant sport with high-end social circles',
    initialInvestment: 2000,
    monthlyCost: 1500,
    lessonCostBase: 100,
    difficultyLevel: 6,
    xpPerPracticeHour: 12,
    optimalPracticeHours: 6,
    baseStressReduction: 25,
    baseNetworkingBonus: 20,
    basePublicImageBonus: 8,
    hasRacingConnection: false,
    milestones: [
      { id: 'tennis_rally', name: 'Rally Ready', description: 'Can maintain a rally', levelRequired: 20, icon: '🎾', celebrationText: 'You can hold a rally!' },
      { id: 'tennis_club', name: 'Club Player', description: 'Competitive at club level', levelRequired: 45, unlocksEvent: 'Club tournaments', icon: '🏸', celebrationText: 'You can compete at your club!' },
      { id: 'tennis_doubles', name: 'Doubles Partner', description: 'Sought after for doubles', levelRequired: 60, networkingBonus: 15, icon: '👥', celebrationText: 'Everyone wants you as their partner!' },
      { id: 'tennis_advanced', name: 'Advanced Player', description: 'Tournament-level skills', levelRequired: 85, publicImageBonus: 10, contactUnlock: 'Tennis pros', icon: '🏆', celebrationText: 'Impressive skills on the court!' }
    ]
  },
  
  // ============================================
  // CREATIVE
  // ============================================
  {
    id: 'photography',
    name: 'Photography',
    category: 'creative',
    description: 'Capture moments from landscapes to motorsport',
    initialInvestment: 15000,
    monthlyCost: 500,
    lessonCostBase: 150,
    difficultyLevel: 5,
    xpPerPracticeHour: 15,
    optimalPracticeHours: 8,
    baseStressReduction: 20,
    baseNetworkingBonus: 15,
    basePublicImageBonus: 12,
    hasRacingConnection: true,
    racingConnectionDescription: 'Document your racing journey',
    milestones: [
      { id: 'photo_basics', name: 'Manual Mode', description: 'Mastered camera settings', levelRequired: 15, icon: '📷', celebrationText: 'You understand your camera!' },
      { id: 'photo_composition', name: 'Eye for Composition', description: 'Consistently good photos', levelRequired: 35, icon: '🖼️', celebrationText: 'Your composition is improving!' },
      { id: 'photo_exhibit', name: 'First Exhibition', description: 'Photos worthy of showing', levelRequired: 55, unlocksEvent: 'Photo exhibition opportunity', publicImageBonus: 8, icon: '🎨', celebrationText: 'Your work could be exhibited!' },
      { id: 'photo_motorsport', name: 'Motorsport Photographer', description: 'Capture racing action', levelRequired: 70, unlocksAbility: 'Sell racing photos', icon: '🏎️', celebrationText: 'Your racing photos are professional quality!' },
      { id: 'photo_artist', name: 'Photographic Artist', description: 'Gallery-level work', levelRequired: 90, contactUnlock: 'Famous photographers', publicImageBonus: 15, icon: '⭐', celebrationText: 'You\'re a true artist!' }
    ]
  },
  {
    id: 'painting',
    name: 'Painting',
    category: 'creative',
    description: 'Express yourself through oils, acrylics, or watercolors',
    initialInvestment: 3000,
    monthlyCost: 400,
    lessonCostBase: 120,
    difficultyLevel: 6,
    xpPerPracticeHour: 12,
    optimalPracticeHours: 6,
    baseStressReduction: 30,
    baseNetworkingBonus: 10,
    basePublicImageBonus: 15,
    hasRacingConnection: false,
    milestones: [
      { id: 'paint_basics', name: 'First Canvas', description: 'Completed first painting', levelRequired: 10, icon: '🎨', celebrationText: 'Your first painting is done!' },
      { id: 'paint_style', name: 'Finding Style', description: 'Developing personal style', levelRequired: 35, icon: '✨', celebrationText: 'Your unique style is emerging!' },
      { id: 'paint_gift', name: 'Gift Worthy', description: 'Paintings make great gifts', levelRequired: 50, unlocksAbility: 'Paint personalized gifts', icon: '🎁', celebrationText: 'Friends want your paintings!' },
      { id: 'paint_gallery', name: 'Gallery Ready', description: 'Work accepted by galleries', levelRequired: 75, publicImageBonus: 12, unlocksEvent: 'Gallery exhibition', icon: '🖼️', celebrationText: 'Galleries want your work!' },
      { id: 'paint_auction', name: 'Auction House', description: 'Paintings sell at auction', levelRequired: 90, publicImageBonus: 20, contactUnlock: 'Art collectors', icon: '💰', celebrationText: 'Collectors bid on your art!' }
    ]
  },
  
  // ============================================
  // INTELLECTUAL
  // ============================================
  {
    id: 'chess',
    name: 'Chess',
    category: 'intellectual',
    description: 'Strategic thinking that helps in business and racing',
    initialInvestment: 500,
    monthlyCost: 100,
    lessonCostBase: 80,
    difficultyLevel: 8,
    xpPerPracticeHour: 10,
    optimalPracticeHours: 5,
    baseStressReduction: 15,
    baseNetworkingBonus: 15,
    basePublicImageBonus: 5,
    hasRacingConnection: true,
    racingConnectionDescription: 'Strategic thinking translates to race strategy',
    milestones: [
      { id: 'chess_basics', name: 'Know the Moves', description: 'Understand all pieces', levelRequired: 10, icon: '♟️', celebrationText: 'You know the basics!' },
      { id: 'chess_tactics', name: 'Tactical Vision', description: 'Can spot combinations', levelRequired: 30, icon: '👁️', celebrationText: 'You\'re seeing ahead!' },
      { id: 'chess_club', name: 'Club Player', description: 'Competitive at club level', levelRequired: 55, unlocksEvent: 'Chess tournaments', icon: '🏆', celebrationText: 'You can compete!' },
      { id: 'chess_master', name: 'Master Level', description: 'Expert-level play', levelRequired: 85, publicImageBonus: 10, contactUnlock: 'Chess grandmasters', icon: '♚', celebrationText: 'Master-level achieved!' }
    ]
  }
]

// ============================================
// XP AND LEVELING
// ============================================

export function calculateXpForLevel(level: number): number {
  // Exponential curve - each level requires more XP
  return Math.floor(100 * Math.pow(1.1, level))
}

export function calculateLevelFromXp(totalXp: number): number {
  let level = 0
  let xpNeeded = 0
  
  while (xpNeeded <= totalXp && level < 100) {
    level++
    xpNeeded += calculateXpForLevel(level)
  }
  
  return Math.min(level - 1, 100)
}

export function getMasteryTier(level: number): MasteryTier {
  if (level >= 95) return 'master'
  if (level >= 80) return 'expert'
  if (level >= 60) return 'advanced'
  if (level >= 40) return 'intermediate'
  if (level >= 20) return 'beginner'
  return 'novice'
}

export function calculatePracticeXp(
  hobby: DeepHobby,
  hours: number,
  hasInstructor: boolean
): number {
  const definition = DEEP_HOBBIES.find(h => h.id === hobby.id)
  if (!definition) return 0
  
  let baseXp = definition.xpPerPracticeHour * hours
  
  // Instructor bonus
  if (hasInstructor && hobby.instructor) {
    const teachingBonus = hobby.instructor.teachingAbility / 100
    baseXp *= (1 + teachingBonus * 0.5)
  }
  
  // Diminishing returns after optimal hours
  if (hours > definition.optimalPracticeHours) {
    const extraHours = hours - definition.optimalPracticeHours
    const penaltyFactor = 0.5  // 50% XP for hours over optimal
    baseXp = (definition.xpPerPracticeHour * definition.optimalPracticeHours) +
             (definition.xpPerPracticeHour * extraHours * penaltyFactor)
  }
  
  // Streak bonus
  if (hobby.streakDays >= 7) baseXp *= 1.1    // 10% bonus for week streak
  if (hobby.streakDays >= 30) baseXp *= 1.15  // 15% bonus for month streak
  
  return Math.round(baseXp)
}

// ============================================
// INSTRUCTOR GENERATION
// ============================================

export function generateInstructor(hobbyId: string, quality: 'basic' | 'good' | 'elite'): HobbyInstructor {
  const names = [
    'Maria Rossi', 'James Chen', 'Sophie Laurent', 'Hans Mueller',
    'Yuki Tanaka', 'Carlos Reyes', 'Emma Thompson', 'Luca Bianchi',
    'Kenji Nakamura', 'Isabella Garcia'
  ]
  
  const qualityModifiers = {
    basic: { skillMin: 60, skillMax: 75, costMultiplier: 0.7 },
    good: { skillMin: 75, skillMax: 90, costMultiplier: 1.0 },
    elite: { skillMin: 90, skillMax: 100, costMultiplier: 2.5 }
  }
  
  const mod = qualityModifiers[quality]
  const definition = DEEP_HOBBIES.find(h => h.id === hobbyId)
  
  const traits: InstructorTrait[] = []
  if (quality === 'elite') {
    traits.push('celebrity', 'connected')
  } else if (quality === 'good') {
    traits.push(Math.random() > 0.5 ? 'patient' : 'inspiring')
  } else {
    traits.push('patient')
  }
  
  return {
    id: `instructor_${hobbyId}_${Date.now()}`,
    name: names[Math.floor(Math.random() * names.length)],
    hobbyId,
    skillLevel: Math.floor(Math.random() * (mod.skillMax - mod.skillMin) + mod.skillMin),
    teachingAbility: Math.floor(Math.random() * 30 + 60),
    reputation: quality === 'elite' ? 'World-renowned instructor' : 
                quality === 'good' ? 'Respected local teacher' : 'Qualified instructor',
    lessonCost: Math.round((definition?.lessonCostBase || 100) * mod.costMultiplier),
    frequency: 'weekly',
    relationshipLevel: 30,
    lessonsGiven: 0,
    traits,
    isAvailable: true
  }
}

// ============================================
// HOBBY FACTORY
// ============================================

export function createDeepHobby(hobbyId: string, startDate: { week: number; year: number }): DeepHobby | null {
  const definition = DEEP_HOBBIES.find(h => h.id === hobbyId)
  if (!definition) return null
  
  return {
    id: `hobby_${hobbyId}_${Date.now()}`,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    
    currentLevel: 0,
    experiencePoints: 0,
    xpToNextLevel: calculateXpForLevel(1),
    masteryTier: 'novice',
    
    hasInstructor: false,
    lessonsCompleted: 0,
    
    practiceHoursThisWeek: 0,
    practiceHoursTotal: 0,
    optimalPracticeHours: definition.optimalPracticeHours,
    streakDays: 0,
    longestStreak: 0,
    
    milestonesUnlocked: [],
    canPerformPublicly: false,
    canTeachOthers: false,
    
    hobbyContacts: [],
    eventsAttended: 0,
    competitionsEntered: 0,
    competitionWins: 0,
    awardsWon: [],
    
    monthlyCost: definition.monthlyCost,
    totalInvested: definition.initialInvestment,
    
    startDate,
    yearsActive: 0,
    
    stressReductionBonus: definition.baseStressReduction,
    networkingBonus: definition.baseNetworkingBonus,
    publicImageBonus: definition.basePublicImageBonus,
    
    specialAbilities: []
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getHobbyDefinition(id: string): HobbyDefinition | undefined {
  return DEEP_HOBBIES.find(h => h.id === id)
}

export function getUnlockedMilestones(hobby: DeepHobby): HobbyMilestone[] {
  const definition = getHobbyDefinition(hobby.id.replace('hobby_', '').split('_')[0])
  if (!definition) return []
  
  return definition.milestones
    .filter(m => hobby.currentLevel >= m.levelRequired)
    .map(m => ({ ...m, hobbyId: hobby.id }))
}

export function getNextMilestone(hobby: DeepHobby): HobbyMilestone | null {
  const definition = getHobbyDefinition(hobby.id.replace('hobby_', '').split('_')[0])
  if (!definition) return null
  
  const next = definition.milestones
    .filter(m => hobby.currentLevel < m.levelRequired)
    .sort((a, b) => a.levelRequired - b.levelRequired)[0]
  
  return next ? { ...next, hobbyId: hobby.id } : null
}
