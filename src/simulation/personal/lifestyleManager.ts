// ============================================
// LIFESTYLE MANAGER
// ============================================
// Handles health, hobbies, personal brand, and social circle simulation.

import {
  LifestyleLevel,
  LifestyleTier,
  OwnerHealth,
  HealthIssue,
  Hobby,
  HobbyType,
  PersonalBrand,
  Endorsement,
  MediaDeal,
  ReputationEvent,
  SocialContact,
  ContactType,
  PersonalVehicle,
  PersonalStaff,
  StaffRole,
  LIFESTYLE_TIERS,
  HEALTH_CONDITIONS,
  HEALTHCARE_COSTS,
  HEALTHCARE_BENEFITS,
  HOBBY_TEMPLATES,
  STAFF_TEMPLATES,
  CONTACT_TYPE_BENEFITS,
  getLifestyleTier,
  calculateAgeEffects,
  calculateLifeExpectancy,
  getHealthConditionDescription
} from '../../data/lifestyle-config'

// ============================================
// HEALTH MANAGEMENT
// ============================================

export function createInitialHealth(age: number): OwnerHealth {
  // Health based on age with some variance
  const ageHealthPenalty = Math.max(0, (age - 30) * 0.3)
  
  return {
    physicalHealth: Math.max(40, 85 - ageHealthPenalty + Math.floor(Math.random() * 10 - 5)),
    fitness: Math.max(30, 70 - ageHealthPenalty + Math.floor(Math.random() * 20 - 10)),
    mentalHealth: 75 + Math.floor(Math.random() * 15 - 7),
    stressLevel: 30 + Math.floor(Math.random() * 20),
    burnoutRisk: 10 + Math.floor(Math.random() * 15),
    age,
    lifeExpectancy: 82,
    activeConditions: [],
    healthcareLevel: 'premium',
    annualHealthcareCost: HEALTHCARE_COSTS.premium,
    lastCheckupWeek: 1,
    lastCheckupYear: 2024
  }
}

export function processWeeklyHealth(
  health: OwnerHealth,
  workHours: number,
  qualityTimeHours: number,
  exerciseHours: number,
  lifestyle: LifestyleLevel,
  currentWeek: number,
  currentYear: number
): {
  updatedHealth: OwnerHealth
  events: string[]
  newConditions: HealthIssue[]
} {
  const events: string[] = []
  const newConditions: HealthIssue[] = []
  
  let health_ = { ...health }
  
  // Work affects stress
  if (workHours > 60) {
    health_.stressLevel = Math.min(100, health_.stressLevel + 3)
    health_.burnoutRisk = Math.min(100, health_.burnoutRisk + 2)
  } else if (workHours > 50) {
    health_.stressLevel = Math.min(100, health_.stressLevel + 1)
  } else if (workHours < 40) {
    health_.stressLevel = Math.max(0, health_.stressLevel - 1)
    health_.burnoutRisk = Math.max(0, health_.burnoutRisk - 1)
  }
  
  // Quality time reduces stress
  health_.stressLevel = Math.max(0, health_.stressLevel - qualityTimeHours * 0.5)
  health_.mentalHealth = Math.min(100, health_.mentalHealth + qualityTimeHours * 0.2)
  
  // Exercise improves fitness and physical health
  if (exerciseHours >= 3) {
    health_.fitness = Math.min(100, health_.fitness + 0.5)
    health_.physicalHealth = Math.min(100, health_.physicalHealth + 0.2)
    health_.stressLevel = Math.max(0, health_.stressLevel - 2)
  } else if (exerciseHours === 0) {
    health_.fitness = Math.max(20, health_.fitness - 0.3)
  }
  
  // Lifestyle affects health
  const lifestyleTier = getLifestyleTier(lifestyle)
  health_.stressLevel = Math.max(0, health_.stressLevel - lifestyleTier.stressReduction * 0.1)
  
  // High stress damages mental health
  if (health_.stressLevel > 80) {
    health_.mentalHealth = Math.max(20, health_.mentalHealth - 0.5)
    
    // Risk of anxiety/burnout
    if (Math.random() * 100 < health_.stressLevel / 10) {
      const burnoutCondition = HEALTH_CONDITIONS.find(c => c.name === 'Burnout')
      if (burnoutCondition && !health_.activeConditions.find(c => c.name === 'Burnout')) {
        const newCondition: HealthIssue = {
          ...burnoutCondition,
          id: `condition-${Date.now()}`,
          weeksDiagnosed: 0,
          isBeingTreated: false
        }
        newConditions.push(newCondition)
        events.push('You\'ve been diagnosed with burnout. Consider reducing workload.')
      }
    }
  }
  
  // Age-related checks (annual)
  if (currentWeek === 1) {
    health_.age += 1
    events.push(`Happy birthday! You are now ${health_.age} years old.`)
    
    // Age-related health decline
    if (health_.age > 50) {
      health_.physicalHealth = Math.max(30, health_.physicalHealth - 1)
      health_.fitness = Math.max(20, health_.fitness - 0.5)
    }
    
    // Random age-related condition chance
    if (health_.age > 55 && Math.random() < 0.1) {
      // 10% chance per year of developing a condition
      const possibleConditions = HEALTH_CONDITIONS.filter(
        c => c.severity !== 'critical' && 
        !health_.activeConditions.find(ac => ac.name === c.name)
      )
      if (possibleConditions.length > 0) {
        const randomCondition = possibleConditions[Math.floor(Math.random() * possibleConditions.length)]
        const newCondition: HealthIssue = {
          ...randomCondition,
          id: `condition-${Date.now()}`,
          weeksDiagnosed: 0,
          isBeingTreated: false
        }
        newConditions.push(newCondition)
        events.push(`You've been diagnosed with ${randomCondition.name}.`)
      }
    }
    
    // Update life expectancy
    health_.lifeExpectancy = calculateLifeExpectancy(health_.age, health_, lifestyle)
  }
  
  // Process existing conditions
  health_.activeConditions = health_.activeConditions.map(condition => ({
    ...condition,
    weeksDiagnosed: condition.weeksDiagnosed + 1
  }))
  
  // Add new conditions
  health_.activeConditions = [...health_.activeConditions, ...newConditions]
  
  // Apply condition effects
  for (const condition of health_.activeConditions) {
    if (condition.affectsPhysical) {
      health_.physicalHealth = Math.max(10, health_.physicalHealth + condition.physicalImpact * 0.05)
    }
    if (condition.affectsMental) {
      health_.mentalHealth = Math.max(10, health_.mentalHealth + condition.mentalImpact * 0.05)
    }
  }
  
  return {
    updatedHealth: health_,
    events,
    newConditions
  }
}

export function treatCondition(
  health: OwnerHealth,
  conditionId: string
): {
  updatedHealth: OwnerHealth
  cost: number
  message: string
} {
  const condition = health.activeConditions.find(c => c.id === conditionId)
  if (!condition) {
    return { updatedHealth: health, cost: 0, message: 'Condition not found' }
  }
  
  if (!condition.isTreatable) {
    return { updatedHealth: health, cost: 0, message: 'This condition cannot be treated' }
  }
  
  const updatedConditions = health.activeConditions.map(c => {
    if (c.id === conditionId) {
      return { ...c, isBeingTreated: true }
    }
    return c
  })
  
  return {
    updatedHealth: { ...health, activeConditions: updatedConditions },
    cost: condition.treatmentCost || 0,
    message: `Started treatment for ${condition.name}`
  }
}

export function upgradeHealthcare(
  health: OwnerHealth,
  newLevel: OwnerHealth['healthcareLevel']
): OwnerHealth {
  return {
    ...health,
    healthcareLevel: newLevel,
    annualHealthcareCost: HEALTHCARE_COSTS[newLevel]
  }
}

// ============================================
// HOBBY MANAGEMENT
// ============================================

export function startHobby(hobbyType: HobbyType): Hobby {
  const template = HOBBY_TEMPLATES[hobbyType]
  return {
    ...template,
    skillLevel: 1,
    yearsActive: 0,
    hoursInvested: 0,
    progressToNextLevel: 0,
    currentMonthlyCost: Math.floor(template.annualCost / 12)
  }
}

export function processHobbyProgress(hobby: Hobby): Hobby {
  // Progress toward next level
  const progressGain = Math.max(5, 15 - hobby.skillLevel * 0.1) // Harder to progress at higher levels
  const newProgress = (hobby.progressToNextLevel || 0) + progressGain
  
  // Check for level up (every 100% progress)
  let newSkillLevel = hobby.skillLevel
  let remainingProgress = newProgress
  
  if (newProgress >= 100) {
    newSkillLevel = Math.min(100, hobby.skillLevel + 1)
    remainingProgress = newProgress - 100
  }
  
  return {
    ...hobby,
    skillLevel: newSkillLevel,
    progressToNextLevel: remainingProgress,
    hoursInvested: (hobby.hoursInvested || 0) + 2, // ~2 hours per practice session
    yearsActive: hobby.yearsActive
  }
}

export function processAnnualHobby(hobby: Hobby): Hobby {
  return {
    ...hobby,
    yearsActive: hobby.yearsActive + 1
  }
}

export function calculateHobbyBenefits(hobbies: Hobby[]): {
  totalStressReduction: number
  totalNetworkingBonus: number
  totalPublicImageBonus: number
  totalAnnualCost: number
} {
  return hobbies.reduce((acc, hobby) => ({
    totalStressReduction: acc.totalStressReduction + hobby.stressReduction,
    totalNetworkingBonus: acc.totalNetworkingBonus + hobby.networkingOpportunities,
    totalPublicImageBonus: acc.totalPublicImageBonus + hobby.publicImageBonus,
    totalAnnualCost: acc.totalAnnualCost + hobby.annualCost
  }), {
    totalStressReduction: 0,
    totalNetworkingBonus: 0,
    totalPublicImageBonus: 0,
    totalAnnualCost: 0
  })
}

// ============================================
// PERSONAL BRAND MANAGEMENT
// ============================================

export function createInitialBrand(reputation: number): PersonalBrand {
  return {
    brandValue: Math.min(100, reputation * 0.8),
    publicImage: 50 + Math.floor(Math.random() * 20),
    mediaPresence: 30 + Math.floor(Math.random() * 20),
    endorsements: [],
    mediaDeals: [],
    speakingFee: 5000,
    annualAppearances: 0,
    reputationEvents: []
  }
}

export function addEndorsement(
  brand: PersonalBrand,
  endorsement: Omit<Endorsement, 'id' | 'yearsRemaining'>
): PersonalBrand {
  const newEndorsement: Endorsement = {
    ...endorsement,
    id: `endorsement-${Date.now()}`,
    yearsRemaining: endorsement.durationYears
  }
  
  return {
    ...brand,
    endorsements: [...brand.endorsements, newEndorsement],
    brandValue: Math.min(100, brand.brandValue + 5),
    publicImage: Math.min(100, brand.publicImage + endorsement.publicImageBonus)
  }
}

export function processAnnualEndorsements(brand: PersonalBrand): {
  updatedBrand: PersonalBrand
  totalIncome: number
  expiredDeals: string[]
} {
  let totalIncome = 0
  const expiredDeals: string[] = []
  
  const updatedEndorsements = brand.endorsements
    .map(e => {
      totalIncome += e.annualValue
      const updated = { ...e, yearsRemaining: e.yearsRemaining - 1 }
      if (updated.yearsRemaining <= 0) {
        expiredDeals.push(e.brandName)
      }
      return updated
    })
    .filter(e => e.yearsRemaining > 0)
  
  return {
    updatedBrand: { ...brand, endorsements: updatedEndorsements },
    totalIncome,
    expiredDeals
  }
}

export function addMediaDeal(
  brand: PersonalBrand,
  deal: Omit<MediaDeal, 'id'>
): PersonalBrand {
  const newDeal: MediaDeal = {
    ...deal,
    id: `media-deal-${Date.now()}`
  }
  
  return {
    ...brand,
    mediaDeals: [...brand.mediaDeals, newDeal],
    mediaPresence: Math.min(100, brand.mediaPresence + 10)
  }
}

export function addReputationEvent(
  brand: PersonalBrand,
  event: Omit<ReputationEvent, 'id'>
): PersonalBrand {
  const newEvent: ReputationEvent = {
    ...event,
    id: `rep-event-${Date.now()}`
  }
  
  const publicImageChange = event.impact * 0.3
  const brandValueChange = event.impact * 0.2
  
  return {
    ...brand,
    reputationEvents: [...brand.reputationEvents.slice(-19), newEvent],
    publicImage: Math.max(0, Math.min(100, brand.publicImage + publicImageChange)),
    brandValue: Math.max(0, Math.min(100, brand.brandValue + brandValueChange))
  }
}

export function processWeeklyBrand(
  brand: PersonalBrand,
  currentWeek: number,
  currentYear: number
): PersonalBrand {
  // Decay old reputation events
  const updatedEvents = brand.reputationEvents
    .map(e => ({ ...e, decayWeeks: e.decayWeeks - 1 }))
    .filter(e => e.decayWeeks > 0)
  
  // Media deals update
  const activeDeals = brand.mediaDeals.filter(deal => {
    const weeksElapsed = (currentYear - deal.startDate.year) * 52 + (currentWeek - deal.startDate.week)
    return weeksElapsed < deal.durationWeeks
  })
  
  // Natural decay of brand value without activity
  let brandValue = brand.brandValue
  if (brand.reputationEvents.filter(e => e.type === 'positive').length === 0) {
    brandValue = Math.max(20, brandValue - 0.1)
  }
  
  // Update speaking fee based on brand value
  const speakingFee = Math.round(1000 + brand.brandValue * 500 + brand.publicImage * 200)
  
  return {
    ...brand,
    reputationEvents: updatedEvents,
    mediaDeals: activeDeals,
    brandValue,
    speakingFee
  }
}

// ============================================
// SOCIAL CIRCLE MANAGEMENT
// ============================================

export function createSocialContact(
  type: ContactType,
  name: string,
  initialRelationship: number = 30
): SocialContact {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    relationshipLevel: initialRelationship,
    trustLevel: initialRelationship * 0.8,
    lastInteraction: { week: 1, year: 2024 },
    benefits: CONTACT_TYPE_BENEFITS[type],
    favorsOwed: 0,
    favorsOwing: 0
  }
}

export function interactWithContact(
  contact: SocialContact,
  interactionQuality: 'poor' | 'neutral' | 'good' | 'excellent',
  currentWeek: number,
  currentYear: number
): SocialContact {
  const qualityBonuses = {
    poor: -5,
    neutral: 1,
    good: 5,
    excellent: 10
  }
  
  const bonus = qualityBonuses[interactionQuality]
  
  return {
    ...contact,
    relationshipLevel: Math.max(0, Math.min(100, contact.relationshipLevel + bonus)),
    trustLevel: Math.max(0, Math.min(100, contact.trustLevel + bonus * 0.5)),
    lastInteraction: { week: currentWeek, year: currentYear }
  }
}

export function askContactForFavor(
  contact: SocialContact,
  favorType: keyof SocialContact['benefits']
): {
  success: boolean
  contact: SocialContact
  benefitValue: number
  message: string
} {
  // Need good relationship to ask favors
  if (contact.relationshipLevel < 40) {
    return {
      success: false,
      contact,
      benefitValue: 0,
      message: `Your relationship with ${contact.name} isn't strong enough to ask for favors.`
    }
  }
  
  // Check if they can help with this type of favor
  const benefitValue = contact.benefits[favorType] || 0
  if (benefitValue === 0) {
    return {
      success: false,
      contact,
      benefitValue: 0,
      message: `${contact.name} can't help with that type of request.`
    }
  }
  
  // Success chance based on relationship and trust
  const successChance = (contact.relationshipLevel + contact.trustLevel) / 2
  const success = Math.random() * 100 < successChance
  
  if (success) {
    return {
      success: true,
      contact: {
        ...contact,
        favorsOwing: contact.favorsOwing + 1,
        relationshipLevel: Math.max(0, contact.relationshipLevel - 5) // Using favor costs relationship
      },
      benefitValue,
      message: `${contact.name} agreed to help!`
    }
  } else {
    return {
      success: false,
      contact: {
        ...contact,
        relationshipLevel: Math.max(0, contact.relationshipLevel - 2)
      },
      benefitValue: 0,
      message: `${contact.name} wasn't able to help this time.`
    }
  }
}

export function processWeeklySocialCircle(
  contacts: SocialContact[],
  currentWeek: number,
  currentYear: number
): SocialContact[] {
  return contacts.map(contact => {
    // Relationship decay if no recent interaction
    const weeksSinceInteraction = 
      (currentYear - contact.lastInteraction.year) * 52 + 
      (currentWeek - contact.lastInteraction.week)
    
    let decay = 0
    if (weeksSinceInteraction > 4) {
      decay = 0.5
    }
    if (weeksSinceInteraction > 12) {
      decay = 1
    }
    if (weeksSinceInteraction > 26) {
      decay = 2
    }
    
    return {
      ...contact,
      relationshipLevel: Math.max(10, contact.relationshipLevel - decay),
      trustLevel: Math.max(5, contact.trustLevel - decay * 0.5)
    }
  })
}

// ============================================
// STAFF MANAGEMENT
// ============================================

export function hireStaff(
  role: StaffRole,
  name: string,
  competenceLevel: number = 70
): PersonalStaff {
  const template = STAFF_TEMPLATES[role]
  
  // Competence affects salary
  const salaryMultiplier = 0.7 + (competenceLevel / 100) * 0.6
  
  return {
    id: `staff-${Date.now()}`,
    role,
    name,
    yearsEmployed: 0,
    salary: Math.round((template.baseSalary * salaryMultiplier) / 12), // Monthly salary
    annualSalary: Math.round(template.baseSalary * salaryMultiplier),
    competence: competenceLevel,
    loyalty: 50,
    satisfaction: 75, // Start with good satisfaction
    totalRaisesThisYear: 0,
    weeksAtLowSatisfaction: 0,
    hasGivenNotice: false,
    canProvideReferral: true,
    referralsProvided: 0,
    benefits: template.benefits
  }
}

export function processAnnualStaff(staff: PersonalStaff[]): {
  updatedStaff: PersonalStaff[]
  totalSalaryCost: number
  totalBenefits: {
    timeFreed: number
    stressReduction: number
    securityBonus: number
    publicImageBonus: number
  }
} {
  let totalSalaryCost = 0
  const totalBenefits = {
    timeFreed: 0,
    stressReduction: 0,
    securityBonus: 0,
    publicImageBonus: 0
  }
  
  const updatedStaff = staff.map(s => {
    totalSalaryCost += s.salary
    
    // Apply benefits scaled by competence
    const competenceMultiplier = s.competence / 100
    totalBenefits.timeFreed += (s.benefits.timeFreedPerWeek || 0) * competenceMultiplier
    totalBenefits.stressReduction += (s.benefits.stressReduction || 0) * competenceMultiplier
    totalBenefits.securityBonus += (s.benefits.securityBonus || 0) * competenceMultiplier
    totalBenefits.publicImageBonus += (s.benefits.publicImageBonus || 0) * competenceMultiplier
    
    // Loyalty increases with tenure
    return {
      ...s,
      yearsEmployed: s.yearsEmployed + 1,
      loyalty: Math.min(100, s.loyalty + 5),
      competence: Math.min(100, s.competence + 1) // Slight improvement with experience
    }
  })
  
  return { updatedStaff, totalSalaryCost, totalBenefits }
}

/**
 * Process weekly staff satisfaction and check for turnover
 */
export function processWeeklyStaff(
  staff: PersonalStaff[],
  currentWeek: number,
  currentYear: number
): {
  updatedStaff: PersonalStaff[]
  staffWhoQuit: PersonalStaff[]
  notifications: string[]
} {
  const staffWhoQuit: PersonalStaff[] = []
  const notifications: string[] = []
  
  const updatedStaff = staff.map(s => {
    let updated = { ...s }
    
    // Base weekly satisfaction decay (-2)
    let satisfactionChange = -2
    
    // Check if recently received bonus (within 4 weeks)
    const weeksSinceBonus = s.lastBonusWeek 
      ? (currentYear - (s.lastBonusYear || currentYear)) * 52 + (currentWeek - s.lastBonusWeek)
      : 999
    if (weeksSinceBonus < 4) satisfactionChange += 3
    
    // Check if underpaid compared to market rate
    const template = STAFF_TEMPLATES[s.role]
    const marketRate = template?.baseSalary || s.annualSalary
    if (s.annualSalary < marketRate * 0.9) {
      satisfactionChange -= 3
    } else if (s.annualSalary > marketRate * 1.1) {
      satisfactionChange += 1 // Slightly happier if well-paid
    }
    
    // Loyalty provides satisfaction stability
    if (s.loyalty >= 80) satisfactionChange += 1
    if (s.loyalty >= 50) satisfactionChange += 0.5
    
    // Apply satisfaction change
    updated.satisfaction = Math.max(0, Math.min(100, s.satisfaction + satisfactionChange))
    
    // Track weeks at low satisfaction
    if (updated.satisfaction < 30) {
      updated.weeksAtLowSatisfaction = (s.weeksAtLowSatisfaction || 0) + 1
    } else {
      updated.weeksAtLowSatisfaction = 0
    }
    
    // Check for notice/quitting
    if (s.hasGivenNotice && s.noticeWeeksRemaining !== undefined) {
      updated.noticeWeeksRemaining = s.noticeWeeksRemaining - 1
      if (updated.noticeWeeksRemaining <= 0) {
        staffWhoQuit.push(updated)
        notifications.push(`${s.name} (${s.role.replace('_', ' ')}) has left your employment.`)
        return null // Will be filtered out
      }
    } else if (!s.hasGivenNotice) {
      // Check for turnover based on satisfaction
      const quitChance = checkStaffTurnover(updated)
      if (Math.random() < quitChance) {
        updated.hasGivenNotice = true
        updated.noticeWeeksRemaining = 2 // 2 weeks notice
        notifications.push(`${s.name} has given their 2 weeks notice due to low satisfaction.`)
      }
    }
    
    // Check referral eligibility
    updated.canProvideReferral = 
      updated.satisfaction >= 80 && 
      updated.loyalty >= 70 && 
      updated.yearsEmployed >= 2
    
    return updated
  }).filter((s): s is PersonalStaff => s !== null)
  
  return { updatedStaff, staffWhoQuit, notifications }
}

/**
 * Calculate turnover/quit chance based on satisfaction
 */
function checkStaffTurnover(staff: PersonalStaff): number {
  if (staff.satisfaction < 15) {
    // 25% weekly chance + may badmouth (prestige hit)
    return 0.25
  }
  if (staff.satisfaction < 30) {
    // 10% weekly chance to quit
    return 0.10
  }
  if (staff.satisfaction < 50) {
    // 2% weekly chance
    return 0.02
  }
  return 0 // High satisfaction = no quit risk
}

/**
 * Give a staff member a raise
 */
export function giveStaffRaise(
  staff: PersonalStaff,
  percentIncrease: number,
  currentWeek: number,
  currentYear: number
): {
  updatedStaff: PersonalStaff
  success: boolean
  message: string
} {
  // Max 20% raise per year
  if (percentIncrease > 20) {
    return {
      updatedStaff: staff,
      success: false,
      message: 'Maximum raise is 20% per year'
    }
  }
  
  // Check if already had max raises this year
  if ((staff.totalRaisesThisYear || 0) >= 2) {
    return {
      updatedStaff: staff,
      success: false,
      message: 'Staff has already received maximum raises this year'
    }
  }
  
  const newAnnualSalary = Math.round(staff.annualSalary * (1 + percentIncrease / 100))
  const newMonthlySalary = Math.round(newAnnualSalary / 12)
  
  const updatedStaff: PersonalStaff = {
    ...staff,
    annualSalary: newAnnualSalary,
    salary: newMonthlySalary,
    satisfaction: Math.min(100, staff.satisfaction + 20),
    loyalty: Math.min(100, staff.loyalty + 5),
    lastRaiseWeek: currentWeek,
    lastRaiseYear: currentYear,
    totalRaisesThisYear: (staff.totalRaisesThisYear || 0) + 1,
    hasGivenNotice: false, // Cancel any notice if given raise
    noticeWeeksRemaining: undefined
  }
  
  return {
    updatedStaff,
    success: true,
    message: `Gave ${staff.name} a ${percentIncrease}% raise. New salary: $${newAnnualSalary.toLocaleString()}/year`
  }
}

/**
 * Give a staff member a bonus
 */
export function giveStaffBonus(
  staff: PersonalStaff,
  amount: number,
  currentWeek: number,
  currentYear: number
): {
  updatedStaff: PersonalStaff
  success: boolean
  message: string
} {
  if (amount <= 0) {
    return {
      updatedStaff: staff,
      success: false,
      message: 'Bonus amount must be positive'
    }
  }
  
  // Calculate satisfaction boost based on bonus size relative to salary
  const bonusRatio = amount / staff.annualSalary
  let satisfactionBoost = 10 // Base boost
  if (bonusRatio >= 0.1) satisfactionBoost = 20  // 10%+ bonus
  if (bonusRatio >= 0.2) satisfactionBoost = 30  // 20%+ bonus
  
  const updatedStaff: PersonalStaff = {
    ...staff,
    satisfaction: Math.min(100, staff.satisfaction + satisfactionBoost),
    loyalty: Math.min(100, staff.loyalty + 3),
    lastBonusWeek: currentWeek,
    lastBonusYear: currentYear,
    hasGivenNotice: false, // Cancel any notice if given bonus
    noticeWeeksRemaining: undefined
  }
  
  return {
    updatedStaff,
    success: true,
    message: `Gave ${staff.name} a $${amount.toLocaleString()} bonus. Satisfaction +${satisfactionBoost}`
  }
}

/**
 * Request a referral from a happy staff member
 */
export function requestStaffReferral(
  staff: PersonalStaff,
  roleNeeded: StaffRole
): {
  success: boolean
  message: string
  referredCandidate?: {
    name: string
    role: StaffRole
    competence: number
    startingSatisfaction: number
  }
} {
  if (!staff.canProvideReferral) {
    return {
      success: false,
      message: `${staff.name} is not eligible to provide referrals (needs 80+ satisfaction, 70+ loyalty, 2+ years)`
    }
  }
  
  // Referral candidates start with higher competence
  const baseCompetence = 50
  const competenceBonus = 10 + Math.floor(Math.random() * 10) // +10-20
  
  // Generate a candidate name
  const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Ashley', 'William', 'Amanda']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson']
  const candidateName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
  
  return {
    success: true,
    message: `${staff.name} referred ${candidateName} for the ${roleNeeded.replace('_', ' ')} position`,
    referredCandidate: {
      name: candidateName,
      role: roleNeeded,
      competence: baseCompetence + competenceBonus,
      startingSatisfaction: 85 // Referrals start happier
    }
  }
}

// ============================================
// LIFESTYLE LEVEL MANAGEMENT
// ============================================

export function calculateMonthlyCosts(
  lifestyle: LifestyleLevel,
  staff: PersonalStaff[],
  hobbies: Hobby[],
  health: OwnerHealth
): {
  lifestyleBase: number
  staffSalaries: number
  hobbyCosts: number
  healthcareCosts: number
  total: number
} {
  const tier = getLifestyleTier(lifestyle)
  
  const lifestyleBase = tier.baseMonthlyCost
  const staffSalaries = staff.reduce((sum, s) => sum + s.salary / 12, 0)
  const hobbyCosts = hobbies.reduce((sum, h) => sum + h.annualCost / 12, 0)
  const healthcareCosts = health.annualHealthcareCost / 12
  
  return {
    lifestyleBase,
    staffSalaries,
    hobbyCosts,
    healthcareCosts,
    total: lifestyleBase + staffSalaries + hobbyCosts + healthcareCosts
  }
}

export function canAffordLifestyle(
  level: LifestyleLevel,
  netWorth: number
): { canAfford: boolean; reason?: string } {
  const tier = getLifestyleTier(level)
  
  if (netWorth < tier.minimumNetWorth) {
    return {
      canAfford: false,
      reason: `Requires minimum net worth of $${tier.minimumNetWorth.toLocaleString()}`
    }
  }
  
  return { canAfford: true }
}

export function getLifestyleRecommendation(netWorth: number): LifestyleLevel {
  // Find highest affordable lifestyle
  const affordable = LIFESTYLE_TIERS
    .filter(t => t.minimumNetWorth <= netWorth)
    .sort((a, b) => b.minimumNetWorth - a.minimumNetWorth)
  
  return affordable[0]?.level || 'frugal'
}
