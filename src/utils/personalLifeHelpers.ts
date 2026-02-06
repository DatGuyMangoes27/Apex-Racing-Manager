// ============================================
// PERSONAL LIFE HELPER FUNCTIONS
// ============================================
// Utility functions for personal life state management

import type { 
  PersonalTransaction, 
  PersonalTransactionType, 
  PersonalTransactionCategory 
} from '@/data/personal-finance-config'
import type { Endorsement, Hobby, PersonalStaff, LifestyleLevel, StaffRole } from '@/data/lifestyle-config'
import type { CharityFoundation, CharityCause } from '@/data/social-events-config'
import type { Child } from '@/data/family-config'

// ============================================
// ID GENERATION
// ============================================

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// TRANSACTION HELPERS
// ============================================

export function createTransaction(
  type: PersonalTransactionType,
  category: PersonalTransactionCategory,
  amount: number,
  description: string,
  week: number,
  year: number,
  options?: {
    taxDeductible?: boolean
    relatedPropertyId?: string
    relatedInvestmentId?: string
    relatedLoanId?: string
  }
): PersonalTransaction {
  return {
    id: generateId('txn'),
    date: { week, year },
    type,
    category,
    amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    description,
    taxDeductible: options?.taxDeductible ?? false,
    relatedPropertyId: options?.relatedPropertyId,
    relatedInvestmentId: options?.relatedInvestmentId,
    relatedLoanId: options?.relatedLoanId
  }
}

// ============================================
// RELATIONSHIP HELPERS
// ============================================

/**
 * Calculate the chance of a proposal being accepted based on relationship level
 * Returns true if accepted, false if rejected
 */
export function calculateProposalAcceptance(relationshipLevel: number): boolean {
  // Base chance starts at 10% and increases with relationship level
  // At 50 relationship: ~30% chance
  // At 70 relationship: ~50% chance
  // At 90 relationship: ~90% chance
  const baseChance = 0.1
  const bonusChance = (relationshipLevel / 100) * 0.8
  const totalChance = baseChance + bonusChance
  
  return Math.random() < totalChance
}

/**
 * Calculate happiness change based on date type
 */
export function getDateHappinessBonus(dateType: string): { happiness: number; love: number } {
  switch (dateType) {
    case 'romantic_dinner':
      return { happiness: 5, love: 3 }
    case 'weekend_getaway':
      return { happiness: 15, love: 10 }
    case 'movie_night':
      return { happiness: 3, love: 2 }
    case 'fancy_restaurant':
      return { happiness: 8, love: 5 }
    case 'vacation':
      return { happiness: 20, love: 15 }
    default:
      return { happiness: 3, love: 2 }
  }
}

/**
 * Calculate gift happiness bonus based on gift type
 */
export function getGiftHappinessBonus(giftType: string): number {
  switch (giftType) {
    case 'flowers':
      return 3
    case 'jewelry':
      return 10
    case 'luxury_watch':
      return 20
    case 'car':
      return 30
    case 'surprise':
      return 5
    default:
      return 3
  }
}

// ============================================
// ENDORSEMENT HELPERS
// ============================================

/**
 * Generate a random endorsement offer based on category and public image
 * Returns null if no offer is made (based on random chance)
 */
export function generateEndorsementOffer(
  category: string, 
  publicImage: number
): Endorsement | null {
  // Higher public image = higher chance of getting an offer
  const baseChance = publicImage / 200 // 50% at 100 public image
  
  if (Math.random() > baseChance) {
    return null // No offer this time
  }
  
  // Generate offer based on category
  const endorsementData = getEndorsementDataByCategory(category, publicImage)
  const durationYears = Math.floor(Math.random() * 3) + 1 // 1-3 years
  
  return {
    id: generateId('endorsement'),
    brandName: endorsementData.brand,
    industry: endorsementData.category,
    annualValue: endorsementData.value,
    durationYears,
    yearsRemaining: durationYears,
    minimumPublicImage: Math.max(40, publicImage - 20),
    exclusivity: Math.random() > 0.5,
    publicImageBonus: 2 + Math.floor(Math.random() * 5)
  }
}

function getEndorsementDataByCategory(category: string, publicImage: number): {
  brand: string
  category: string
  value: number
} {
  // Value scales with public image
  const valueMultiplier = 1 + (publicImage / 100)
  
  switch (category) {
    case 'luxury_watches':
      return {
        brand: getRandomItem(['Rolex', 'TAG Heuer', 'Omega', 'IWC', 'Richard Mille']),
        category: 'luxury_watches',
        value: Math.floor((500000 + Math.random() * 1500000) * valueMultiplier)
      }
    case 'automotive':
      return {
        brand: getRandomItem(['Mercedes-AMG', 'Porsche', 'Ferrari', 'Lamborghini', 'McLaren']),
        category: 'automotive',
        value: Math.floor((1000000 + Math.random() * 4000000) * valueMultiplier)
      }
    case 'fashion':
      return {
        brand: getRandomItem(['Hugo Boss', 'Armani', 'Ralph Lauren', 'Tommy Hilfiger', 'Versace']),
        category: 'fashion',
        value: Math.floor((200000 + Math.random() * 800000) * valueMultiplier)
      }
    case 'technology':
      return {
        brand: getRandomItem(['Apple', 'Samsung', 'Sony', 'Microsoft', 'AMD']),
        category: 'technology',
        value: Math.floor((300000 + Math.random() * 700000) * valueMultiplier)
      }
    case 'beverages':
      return {
        brand: getRandomItem(['Red Bull', 'Monster', 'Coca-Cola', 'Pepsi', 'Heineken']),
        category: 'beverages',
        value: Math.floor((400000 + Math.random() * 600000) * valueMultiplier)
      }
    default:
      return {
        brand: getRandomItem(['Generic Brand', 'Local Sponsor', 'Regional Partner']),
        category: 'other',
        value: Math.floor((100000 + Math.random() * 200000) * valueMultiplier)
      }
  }
}

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

// ============================================
// FOUNDATION HELPERS
// ============================================

/**
 * Create a new charity foundation
 */
export function createFoundation(
  name: string,
  cause: CharityCause,
  initialDonation: number,
  week: number,
  year: number
): CharityFoundation {
  return {
    id: generateId('foundation'),
    name,
    cause,
    establishedDate: { week, year },
    totalDonated: initialDonation,
    annualBudget: initialDonation,
    impactScore: 10, // Starting impact (0-100)
    publicAwareness: 5, // Starting awareness (0-100)
    taxDeductionPercentage: 30, // Standard deduction
    reputationBonus: 5,
    annualGalaDate: undefined
  }
}

// ============================================
// HOBBY HELPERS
// ============================================

/**
 * Create a new hobby with initial stats
 */
export function createHobby(
  type: string,
  name: string,
  description: string,
  initialInvestment: number,
  annualCost: number
): Hobby {
  return {
    type: type as any,
    name,
    description,
    annualCost,
    initialInvestment,
    currentMonthlyCost: Math.floor(annualCost / 12),
    stressReduction: 5,
    networkingOpportunities: 3,
    publicImageBonus: 2,
    skillLevel: 1, // Start at level 1
    yearsActive: 0,
    hoursInvested: 0,
    progressToNextLevel: 0,
    competitionWins: 0,
    competitionsEntered: 0,
    unlockedAchievements: [],
    monthlyMonetizationIncome: 0,
    canHostEvents: false,
    prestigeLevel: 10
  }
}

// ============================================
// STAFF HELPERS
// ============================================

/**
 * Create a new personal staff member
 */
export function createStaffMember(
  role: StaffRole,
  salary: number,
  options?: {
    competenceBonus?: number    // For referred candidates
    startingSatisfaction?: number
    name?: string
  }
): PersonalStaff {
  const names: Record<string, string[]> = {
    personal_assistant: ['James', 'Sarah', 'Michael', 'Emma'],
    chef: ['Pierre', 'Maria', 'Antonio', 'Chen'],
    housekeeper: ['Rosa', 'Anna', 'Margaret', 'Helen'],
    driver: ['Thomas', 'David', 'Carlos', 'Alex'],
    security: ['John', 'Mark', 'Viktor', 'Sergei'],
    nanny: ['Sophie', 'Clara', 'Isabella', 'Grace'],
    trainer: ['Mike', 'Chris', 'Jessica', 'Ryan'],
    financial_advisor: ['Robert', 'William', 'Elizabeth', 'Catherine']
  }
  
  const roleNames = names[role] || ['Assistant']
  const firstName = getRandomItem(roleNames)
  const staffName = options?.name || `${firstName} ${getRandomItem(['Smith', 'Johnson', 'Garcia', 'Mueller', 'Rossi'])}`
  
  const baseCompetence = 60 + Math.floor(Math.random() * 30)
  const competence = Math.min(100, baseCompetence + (options?.competenceBonus || 0))
  
  return {
    id: generateId('staff'),
    role,
    name: staffName,
    yearsEmployed: 0,
    salary: Math.floor(salary / 12), // Convert annual to monthly
    annualSalary: salary,
    competence,
    loyalty: 70 + Math.floor(Math.random() * 20),
    satisfaction: options?.startingSatisfaction ?? (75 + Math.floor(Math.random() * 15)), // Start satisfied (75-90)
    benefits: getStaffBenefits(role),
    
    // Compensation tracking
    totalRaisesThisYear: 0,
    
    // Performance tracking
    weeksAtLowSatisfaction: 0,
    hasGivenNotice: false,
    
    // Referral tracking
    canProvideReferral: false,
    referralsProvided: 0
  }
}

function getStaffBenefits(role: StaffRole): PersonalStaff['benefits'] {
  switch (role) {
    case 'personal_assistant':
      return { timeFreedPerWeek: 10, stressReduction: 5 }
    case 'chef':
      return { timeFreedPerWeek: 5, stressReduction: 3 }
    case 'housekeeper':
      return { timeFreedPerWeek: 8, stressReduction: 2 }
    case 'driver':
      return { timeFreedPerWeek: 6, stressReduction: 3 }
    case 'security':
      return { securityBonus: 15, stressReduction: 5 }
    case 'nanny':
      return { childcareQuality: 80, timeFreedPerWeek: 15, stressReduction: 8 }
    case 'trainer':
      return { stressReduction: 10 }
    case 'financial_advisor':
      return { financialAdviceQuality: 80, stressReduction: 3 }
    default:
      return { stressReduction: 2 }
  }
}

// ============================================
// CHILD RACING HELPERS
// ============================================

/**
 * Initialize racing development for a child
 */
export function initializeChildRacing(child: Child): Child {
  return {
    ...child,
    racingDevelopment: {
      isActive: true,
      currentLevel: 'karting',
      yearsExperience: 0,
      results: [],
      potentialRating: 60 + Math.floor(Math.random() * 40), // 60-100 potential
      currentRating: 30 + Math.floor(Math.random() * 20) // 30-50 starting
    },
    careerPath: 'racing_driver',
    careerInterestLevel: 70 + Math.floor(Math.random() * 30)
  }
}

// ============================================
// VALUE CALCULATIONS
// ============================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate monthly cost for a lifestyle level
 */
export function getLifestyleMonthlyCost(level: LifestyleLevel): number {
  const costs: Record<LifestyleLevel, number> = {
    frugal: 3000,
    modest: 8000,
    comfortable: 20000,
    affluent: 50000,
    luxury: 150000,
    luxurious: 200000,
    ultra_luxury: 500000
  }
  return costs[level] || 20000
}

/**
 * Get public image bonus for lifestyle level
 */
export function getLifestyleImageBonus(level: LifestyleLevel): number {
  const bonuses: Record<LifestyleLevel, number> = {
    frugal: -5,
    modest: 0,
    comfortable: 5,
    affluent: 10,
    luxury: 15,
    luxurious: 20,
    ultra_luxury: 50
  }
  return bonuses[level] || 0
}
