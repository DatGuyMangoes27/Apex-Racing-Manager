// ============================================
// RETIREMENT & LEGACY CONFIGURATION
// ============================================
// System for retirement planning, post-racing careers, and legacy building.

// ============================================
// POST-RACING PATHS
// ============================================

export type PostRacingPath = 
  | 'team_principal'
  | 'team_owner_continued'
  | 'pundit'
  | 'racing_school'
  | 'fia_role'
  | 'business_ventures'
  | 'politics'
  | 'philanthropy_full_time'
  | 'leisure'
  | 'author'
  | 'motorsport_ambassador'

// ============================================
// RETIREMENT PLAN
// ============================================

export interface RetirementPlan {
  // Timeline
  plannedRetirementAge?: number
  plannedRetirementYear?: number
  yearsUntilRetirement?: number
  
  // Financial readiness
  retirementFund: number
  targetRetirementFund: number
  passiveIncomeStreams: PassiveIncome[]
  projectedMonthlyIncome: number
  financiallyReady: boolean
  
  // What's next
  primaryPath?: PostRacingCareerPlan
  primaryPlan?: string  // Alias: string ID when used as reference (preferred in components)
  backupPath?: PostRacingCareerPlan
  exploredPaths: PostRacingCareerPlan[]
  
  // Legacy
  legacyGoals: LegacyGoal[]
  successionPlan?: SuccessionPlan
  
  // Readiness
  mentalReadiness: number       // 0-100, are you ready to stop?
  identityCrisisRisk: number    // Risk of struggling post-racing
  supportNetwork: number        // 0-100, people to lean on
  
  // Preparations
  preparationSteps: RetirementPreparation[]
  advisorsConsulted: string[]
}

export interface PassiveIncome {
  id: string
  source: string
  type: 'investments' | 'real_estate' | 'royalties' | 'pension' | 'endorsements' | 'business'
  monthlyAmount: number
  isGuaranteed: boolean
  expiresDate?: { year: number }
}

// ============================================
// POST-RACING CAREER
// ============================================

export interface PostRacingCareerPlan {
  id?: string  // Optional: can be derived from path when not provided
  path: PostRacingPath
  name: string
  description: string
  
  // Requirements
  financialRequirement: number
  skillsRequired: SkillRequirement[]
  contactsRequired: string[]
  reputationRequired: number
  requirements?: Array<{ met: boolean; description: string }>  // Alias: simplified requirements array (should be populated for component use)
  
  // Preparation
  preparationSteps: PreparationStep[]
  currentProgress?: number       // 0-100 (optional in catalog, required when instantiated)
  estimatedPrepTime: number     // Months
  
  // Outcomes
  expectedIncome: { min: number; max: number } | number  // Can be object or number
  fulfillmentRating: number     // 0-100
  publicProfileMaintained: boolean
  stressLevel: 'low' | 'medium' | 'high'
  timeCommitment: 'minimal' | 'part_time' | 'full_time' | 'demanding'
  
  // Risks
  risks: string[]
  successProbability: number    // 0-100
  
  // Alias properties for component compatibility
  // expectedIncomeNumber provides a number version when expectedIncome is an object (average of min/max)
  expectedIncomeNumber?: number  // Alias: numeric version of expectedIncome
}

export interface SkillRequirement {
  skill: string
  requiredLevel: number
  currentLevel: number
  gap: number
}

export interface PreparationStep {
  id: string
  description: string
  category: 'education' | 'networking' | 'financial' | 'skill' | 'certification' | 'experience'
  
  isCompleted: boolean
  completedDate?: { week: number; year: number }
  
  cost?: number
  timeRequired?: number         // Weeks
  
  unlocks?: string              // What this enables
}

// ============================================
// LEGACY SYSTEM
// ============================================

export interface LegacyGoal {
  id: string
  type: LegacyType
  name: string
  description: string
  
  // Progress
  isComplete: boolean
  progressPercent: number
  
  // Requirements
  requirements: string[]
  
  // Impact
  howRemembered: string         // "The driver who..."
  lastingImpact: string         // What it creates for others
  
  // Recognition
  publicAwareness: number       // 0-100, how many people know
  historicalSignificance: number
}

export type LegacyType = 
  | 'racing_achievement'
  | 'record'
  | 'institution'
  | 'family_dynasty'
  | 'charitable'
  | 'cultural'
  | 'mentorship'
  | 'innovation'

// ============================================
// SUCCESSION PLANNING
// ============================================

export interface SuccessionPlan {
  // Team succession (if owner)
  teamSuccessor?: TeamSuccessor | string  // Alias: can be object or string name
  transitionPlan: TransitionStep[] | string[]  // Alias: can be array of objects or strings
  
  // Family
  childInRacing?: string
  familyInvolvement: string
  
  // Knowledge transfer
  mentoringDrivers: string[]
  knowledgeDocumented: boolean
  writtenWisdom?: string  // Alias: written legacy content
  
  // Wealth transfer
  estatePlan: boolean
  trustsEstablished: boolean
  inheritanceStrategy: 'equal' | 'merit_based' | 'team_focused' | 'charity'
}

export interface TeamSuccessor {
  id: string
  name: string
  relationship: 'child' | 'family' | 'trusted_employee' | 'external_hire' | 'investor'
  
  readiness: number             // 0-100
  yearsUntilReady: number
  
  strengths: string[]
  developmentAreas: string[]
  
  publicAcceptance: number      // How fans/sponsors view them
}

export interface TransitionStep {
  id: string
  phase: 'preparation' | 'gradual_handover' | 'shadow_period' | 'full_transition'
  description: string
  
  duration: number              // Weeks
  isComplete: boolean
  
  responsibilities: string[]    // What transfers in this phase
}

// ============================================
// RETIREMENT PREPARATION
// ============================================

export interface RetirementPreparation {
  id: string
  category: 'financial' | 'personal' | 'professional' | 'health' | 'social'
  name: string
  description: string
  
  importance: 'critical' | 'important' | 'recommended' | 'optional'
  
  isStarted: boolean
  isComplete: boolean
  progress: number              // 0-100
  
  cost?: number
  timeRequired?: number         // Weeks
  
  provider?: string             // Who helps with this
}

// ============================================
// POST-RACING CAREER CATALOG
// ============================================

export const POST_RACING_CAREERS: (Omit<PostRacingCareerPlan, 'currentProgress'> & { id?: string })[] = [
  {
    path: 'team_principal',
    name: 'Team Principal',
    description: 'Lead a racing team as principal/team manager',
    financialRequirement: 5000000,
    skillsRequired: [
      { skill: 'leadership', requiredLevel: 80, currentLevel: 0, gap: 80 },
      { skill: 'motorsport_management', requiredLevel: 70, currentLevel: 0, gap: 70 },
      { skill: 'business_acumen', requiredLevel: 60, currentLevel: 0, gap: 60 }
    ],
    contactsRequired: ['Team owners', 'FIA officials', 'Sponsors'],
    reputationRequired: 70,
    preparationSteps: [
      { id: 'tp_1', description: 'Complete FIA Team Management License', category: 'certification', isCompleted: false, cost: 5000, timeRequired: 26 },
      { id: 'tp_2', description: 'Build relationships with team owners', category: 'networking', isCompleted: false, timeRequired: 52 },
      { id: 'tp_3', description: 'Take business management courses', category: 'education', isCompleted: false, cost: 50000, timeRequired: 26 }
    ],
    estimatedPrepTime: 24,
    expectedIncome: { min: 500000, max: 5000000 },
    fulfillmentRating: 85,
    publicProfileMaintained: true,
    stressLevel: 'high',
    timeCommitment: 'demanding',
    risks: ['High pressure', 'Job security depends on results', 'Constant travel'],
    successProbability: 60
  },
  {
    path: 'pundit',
    name: 'TV Pundit/Commentator',
    description: 'Analyze and commentate on racing for television',
    financialRequirement: 500000,
    skillsRequired: [
      { skill: 'communication', requiredLevel: 80, currentLevel: 0, gap: 80 },
      { skill: 'charisma', requiredLevel: 70, currentLevel: 0, gap: 70 },
      { skill: 'technical_knowledge', requiredLevel: 60, currentLevel: 0, gap: 60 }
    ],
    contactsRequired: ['Broadcasting executives', 'Production companies'],
    reputationRequired: 60,
    preparationSteps: [
      { id: 'pun_1', description: 'Media training course', category: 'education', isCompleted: false, cost: 10000, timeRequired: 4 },
      { id: 'pun_2', description: 'Practice commentary (podcasts, social media)', category: 'experience', isCompleted: false, timeRequired: 26 },
      { id: 'pun_3', description: 'Build media relationships', category: 'networking', isCompleted: false, timeRequired: 26 }
    ],
    estimatedPrepTime: 12,
    expectedIncome: { min: 200000, max: 2000000 },
    fulfillmentRating: 70,
    publicProfileMaintained: true,
    stressLevel: 'medium',
    timeCommitment: 'part_time',
    risks: ['Competition for positions', 'Public scrutiny of opinions'],
    successProbability: 75
  },
  {
    path: 'racing_school',
    name: 'Racing School Owner',
    description: 'Start and run a racing driver development school',
    financialRequirement: 2000000,
    skillsRequired: [
      { skill: 'teaching', requiredLevel: 60, currentLevel: 0, gap: 60 },
      { skill: 'business_acumen', requiredLevel: 50, currentLevel: 0, gap: 50 },
      { skill: 'technical_knowledge', requiredLevel: 70, currentLevel: 0, gap: 70 }
    ],
    contactsRequired: ['Track owners', 'Karting organizations', 'Junior formula contacts'],
    reputationRequired: 50,
    preparationSteps: [
      { id: 'rs_1', description: 'Coaching certification', category: 'certification', isCompleted: false, cost: 5000, timeRequired: 8 },
      { id: 'rs_2', description: 'Business plan development', category: 'financial', isCompleted: false, cost: 10000, timeRequired: 8 },
      { id: 'rs_3', description: 'Secure track partnership', category: 'networking', isCompleted: false, timeRequired: 26 }
    ],
    estimatedPrepTime: 18,
    expectedIncome: { min: 100000, max: 1000000 },
    fulfillmentRating: 90,
    publicProfileMaintained: true,
    stressLevel: 'medium',
    timeCommitment: 'full_time',
    risks: ['Capital intensive', 'Liability concerns', 'Seasonal demand'],
    successProbability: 65
  },
  {
    path: 'fia_role',
    name: 'FIA/Governing Body Role',
    description: 'Take a position in motorsport governance',
    financialRequirement: 1000000,
    skillsRequired: [
      { skill: 'leadership', requiredLevel: 70, currentLevel: 0, gap: 70 },
      { skill: 'political_savvy', requiredLevel: 80, currentLevel: 0, gap: 80 },
      { skill: 'motorsport_knowledge', requiredLevel: 90, currentLevel: 0, gap: 90 }
    ],
    contactsRequired: ['FIA officials', 'National federation contacts', 'Team owners'],
    reputationRequired: 80,
    preparationSteps: [
      { id: 'fia_1', description: 'Join national motorsport federation', category: 'experience', isCompleted: false, timeRequired: 52 },
      { id: 'fia_2', description: 'Build FIA relationships', category: 'networking', isCompleted: false, timeRequired: 104 },
      { id: 'fia_3', description: 'Governance/law courses', category: 'education', isCompleted: false, cost: 30000, timeRequired: 26 }
    ],
    estimatedPrepTime: 48,
    expectedIncome: { min: 300000, max: 1500000 },
    fulfillmentRating: 75,
    publicProfileMaintained: true,
    stressLevel: 'medium',
    timeCommitment: 'full_time',
    risks: ['Political nature', 'Slow progression', 'Controversial decisions'],
    successProbability: 40
  },
  {
    path: 'business_ventures',
    name: 'Business Entrepreneur',
    description: 'Launch and run businesses outside motorsport',
    financialRequirement: 5000000,
    skillsRequired: [
      { skill: 'business_acumen', requiredLevel: 70, currentLevel: 0, gap: 70 },
      { skill: 'leadership', requiredLevel: 60, currentLevel: 0, gap: 60 },
      { skill: 'networking', requiredLevel: 60, currentLevel: 0, gap: 60 }
    ],
    contactsRequired: ['Investors', 'Business mentors', 'Industry experts'],
    reputationRequired: 50,
    preparationSteps: [
      { id: 'bus_1', description: 'MBA or business education', category: 'education', isCompleted: false, cost: 150000, timeRequired: 104 },
      { id: 'bus_2', description: 'Identify business opportunities', category: 'experience', isCompleted: false, timeRequired: 26 },
      { id: 'bus_3', description: 'Build investment network', category: 'networking', isCompleted: false, timeRequired: 52 }
    ],
    estimatedPrepTime: 36,
    expectedIncome: { min: -500000, max: 10000000 },
    fulfillmentRating: 80,
    publicProfileMaintained: false,
    stressLevel: 'high',
    timeCommitment: 'demanding',
    risks: ['Financial risk', 'High failure rate', 'Different skill set needed'],
    successProbability: 50
  },
  {
    path: 'philanthropy_full_time',
    name: 'Full-Time Philanthropist',
    description: 'Dedicate yourself to charitable work',
    financialRequirement: 10000000,
    skillsRequired: [
      { skill: 'leadership', requiredLevel: 50, currentLevel: 0, gap: 50 },
      { skill: 'communication', requiredLevel: 60, currentLevel: 0, gap: 60 }
    ],
    contactsRequired: ['Foundation experts', 'Charity leaders'],
    reputationRequired: 60,
    preparationSteps: [
      { id: 'phil_1', description: 'Establish charitable foundation', category: 'financial', isCompleted: false, cost: 100000, timeRequired: 26 },
      { id: 'phil_2', description: 'Identify causes and partners', category: 'experience', isCompleted: false, timeRequired: 26 },
      { id: 'phil_3', description: 'Build foundation team', category: 'networking', isCompleted: false, timeRequired: 26 }
    ],
    estimatedPrepTime: 24,
    expectedIncome: { min: 0, max: 200000 },
    fulfillmentRating: 95,
    publicProfileMaintained: true,
    stressLevel: 'low',
    timeCommitment: 'part_time',
    risks: ['Requires significant wealth', 'Results hard to measure'],
    successProbability: 90
  },
  {
    path: 'leisure',
    name: 'Retirement (Leisure)',
    description: 'Enjoy retirement with hobbies and family',
    financialRequirement: 20000000,
    skillsRequired: [],
    contactsRequired: [],
    reputationRequired: 0,
    preparationSteps: [
      { id: 'leis_1', description: 'Secure passive income streams', category: 'financial', isCompleted: false, timeRequired: 52 },
      { id: 'leis_2', description: 'Develop hobbies and interests', category: 'experience', isCompleted: false, timeRequired: 26 },
      { id: 'leis_3', description: 'Mental preparation for retirement', category: 'experience', isCompleted: false, timeRequired: 26 }
    ],
    estimatedPrepTime: 12,
    expectedIncome: { min: 0, max: 0 },
    fulfillmentRating: 70,
    publicProfileMaintained: false,
    stressLevel: 'low',
    timeCommitment: 'minimal',
    risks: ['Identity loss', 'Boredom', 'Loss of purpose'],
    successProbability: 80
  }
]

// ============================================
// LEGACY GOALS CATALOG
// ============================================

export const LEGACY_GOALS: Omit<LegacyGoal, 'id' | 'isComplete' | 'progressPercent'>[] = [
  {
    type: 'racing_achievement',
    name: 'Championship Legacy',
    description: 'Win multiple championships as a team owner',
    requirements: ['Win at least 3 championships'],
    howRemembered: 'The championship-winning team builder',
    lastingImpact: 'Established one of motorsport\'s great teams',
    publicAwareness: 90,
    historicalSignificance: 95
  },
  {
    type: 'institution',
    name: 'The Academy',
    description: 'Create a renowned driver development academy',
    requirements: ['Establish racing school', 'Graduate drivers to professional racing'],
    howRemembered: 'Mentor to a generation of drivers',
    lastingImpact: 'Trained the next generation of racing talent',
    publicAwareness: 70,
    historicalSignificance: 80
  },
  {
    type: 'family_dynasty',
    name: 'Racing Dynasty',
    description: 'Establish a multi-generational racing family',
    requirements: ['Child becomes professional driver', 'Multiple family members in motorsport'],
    howRemembered: 'Founder of a racing dynasty',
    lastingImpact: 'Created a lasting family legacy in motorsport',
    publicAwareness: 85,
    historicalSignificance: 90
  },
  {
    type: 'charitable',
    name: 'Giving Back',
    description: 'Make significant charitable impact',
    requirements: ['Donate over $10M lifetime', 'Establish successful foundation'],
    howRemembered: 'The philanthropist who used racing for good',
    lastingImpact: 'Changed lives through charitable work',
    publicAwareness: 75,
    historicalSignificance: 70
  },
  {
    type: 'innovation',
    name: 'The Innovator',
    description: 'Pioneer new technologies or methods in racing',
    requirements: ['Develop breakthrough technology', 'Change how racing is done'],
    howRemembered: 'The innovator who changed the sport',
    lastingImpact: 'Advanced motorsport technology',
    publicAwareness: 80,
    historicalSignificance: 95
  },
  {
    type: 'mentorship',
    name: 'The Teacher',
    description: 'Mentor future champions',
    requirements: ['Mentor a driver who wins championship', 'Known for developing talent'],
    howRemembered: 'The mentor behind champions',
    lastingImpact: 'Shaped the careers of future legends',
    publicAwareness: 65,
    historicalSignificance: 75
  }
]

// ============================================
// CONFIGURATION
// ============================================

export const RETIREMENT_CONFIG = {
  // Financial
  minimumRetirementFund: 5000000,
  recommendedRetirementFund: 20000000,
  luxuryRetirementFund: 50000000,
  
  // Monthly income needs
  basicMonthlyNeeds: 15000,
  comfortableMonthlyNeeds: 50000,
  luxuryMonthlyNeeds: 150000,
  
  // Mental readiness
  mentalReadinessDecayIfForced: 20, // If retiring unwillingly
  identityCrisisBaseRisk: 40,
  
  // Preparation
  idealPrepYears: 3,
  minimumPrepYears: 1,
  
  // Transition
  gradualTransitionBonus: 20,     // Mental readiness bonus for gradual transition
  coldTurkeyPenalty: 30,          // Mental health penalty for sudden retirement
  
  // Success factors
  supportNetworkImpact: 0.3,      // How much support network affects adjustment
  hobbiesImpact: 0.2,             // How much hobbies help
  purposeImpact: 0.5              // How much having a purpose helps
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createRetirementPlan(): RetirementPlan {
  return {
    retirementFund: 0,
    targetRetirementFund: RETIREMENT_CONFIG.recommendedRetirementFund,
    passiveIncomeStreams: [],
    projectedMonthlyIncome: 0,
    financiallyReady: false,
    exploredPaths: [],
    legacyGoals: [],
    mentalReadiness: 50,
    identityCrisisRisk: RETIREMENT_CONFIG.identityCrisisBaseRisk,
    supportNetwork: 50,
    preparationSteps: [],
    advisorsConsulted: []
  }
}

export function createLegacyGoal(template: typeof LEGACY_GOALS[0]): LegacyGoal {
  return {
    id: `legacy_${Date.now()}`,
    ...template,
    isComplete: false,
    progressPercent: 0
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateFinancialReadiness(
  retirementFund: number,
  passiveIncome: number,
  targetMonthlyExpenses: number
): { isReady: boolean; yearsOfRunway: number; shortfall: number } {
  const annualExpenses = targetMonthlyExpenses * 12
  const annualPassive = passiveIncome * 12
  const netAnnualNeed = annualExpenses - annualPassive
  
  if (netAnnualNeed <= 0) {
    return { isReady: true, yearsOfRunway: 999, shortfall: 0 }
  }
  
  const yearsOfRunway = retirementFund / netAnnualNeed
  const isReady = yearsOfRunway >= 30 // Assume 30 years needed
  const shortfall = isReady ? 0 : (30 - yearsOfRunway) * netAnnualNeed
  
  return { isReady, yearsOfRunway: Math.round(yearsOfRunway), shortfall: Math.round(shortfall) }
}

export function calculateMentalReadiness(
  yearsInRacing: number,
  hasHobbies: boolean,
  hasPurpose: boolean,
  supportNetwork: number,
  isVoluntary: boolean
): number {
  let readiness = 30 // Base
  
  // Experience helps
  readiness += Math.min(20, yearsInRacing)
  
  // Hobbies
  if (hasHobbies) readiness += 15
  
  // Purpose
  if (hasPurpose) readiness += 20
  
  // Support
  readiness += supportNetwork * 0.15
  
  // Voluntary
  if (!isVoluntary) readiness -= 20
  
  return Math.max(0, Math.min(100, readiness))
}

export function getCareerPathById(path: PostRacingPath): typeof POST_RACING_CAREERS[0] | undefined {
  return POST_RACING_CAREERS.find(c => c.path === path)
}

export function assessRetirementReadiness(plan: RetirementPlan): {
  overall: 'not_ready' | 'partially_ready' | 'ready' | 'well_prepared'
  financial: number
  mental: number
  professional: number
  recommendations: string[]
} {
  const financial = plan.financiallyReady ? 100 : (plan.retirementFund / plan.targetRetirementFund) * 100
  const mental = plan.mentalReadiness
  const professional = plan.primaryPath?.currentProgress ?? 0
  
  const average = (financial + mental + professional) / 3
  
  let overall: 'not_ready' | 'partially_ready' | 'ready' | 'well_prepared'
  if (average >= 80) overall = 'well_prepared'
  else if (average >= 60) overall = 'ready'
  else if (average >= 40) overall = 'partially_ready'
  else overall = 'not_ready'
  
  const recommendations: string[] = []
  if (financial < 60) recommendations.push('Increase retirement savings')
  if (mental < 60) recommendations.push('Work on mental preparation and hobbies')
  if ((plan.primaryPath?.currentProgress ?? 0) < 60) recommendations.push('Develop post-racing career path')
  if (!plan.successionPlan) recommendations.push('Create succession plan for team')
  if (plan.legacyGoals.length === 0) recommendations.push('Define legacy goals')
  
  return { overall, financial, mental, professional, recommendations }
}
