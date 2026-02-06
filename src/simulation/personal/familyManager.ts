// ============================================
// FAMILY MANAGER
// ============================================
// Handles children, child development, and dynasty tracking.

import {
  Child,
  ChildTrait,
  ChildCareerPath,
  ChildGender,
  ChildInteraction,
  ChildRacingResult,
  FamilyTree,
  FamilyMember,
  DynastyAchievement,
  Partner,
  CHILD_TRAITS,
  RELATIONSHIP_CONFIG,
  DYNASTY_ACHIEVEMENTS,
  getChildTraitById,
  calculateChildDevelopmentCost
} from '../../data/family-config'
import type { Country } from '../../data/personal-finance-config'

// ============================================
// CHILD GENERATION
// ============================================

const CHILD_FIRST_NAMES_MALE = [
  'Alexander', 'Sebastian', 'Nicholas', 'Maximilian', 'Theodore', 'Oliver',
  'Lucas', 'Benjamin', 'William', 'James', 'Charles', 'Frederick', 'Henry',
  'Edward', 'George', 'Philip', 'Michael', 'Daniel', 'David', 'Thomas'
]

const CHILD_FIRST_NAMES_FEMALE = [
  'Isabella', 'Victoria', 'Charlotte', 'Sophia', 'Alexandra', 'Elizabeth',
  'Catherine', 'Margaret', 'Olivia', 'Emma', 'Grace', 'Eleanor', 'Alice',
  'Caroline', 'Beatrice', 'Amelia', 'Violet', 'Rose', 'Lily', 'Aurora'
]

export function generateChild(
  playerLastName: string,
  partner: Partner,
  playerTraits: string[],
  currentWeek: number,
  currentYear: number
): Child {
  const gender: ChildGender = Math.random() > 0.5 ? 'male' : 'female'
  
  const firstName = gender === 'male'
    ? CHILD_FIRST_NAMES_MALE[Math.floor(Math.random() * CHILD_FIRST_NAMES_MALE.length)]
    : CHILD_FIRST_NAMES_FEMALE[Math.floor(Math.random() * CHILD_FIRST_NAMES_FEMALE.length)]
  
  // Generate traits - some inherited, some random
  const traits = generateChildTraits(playerTraits, partner.traits)
  
  // Calculate initial development scores based on traits
  const development = calculateInitialDevelopment(traits)
  
  return {
    id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    firstName,
    lastName: playerLastName,
    gender,
    birthDate: { week: currentWeek, year: currentYear },
    age: 0,
    biologicalParentIds: ['player', partner.id],
    isAdopted: false,
    traits,
    development,
    bondLevel: 80, // Start with high bond for newborn
    recentInteractions: [],
    education: {
      currentLevel: 'preschool',
      schoolType: 'public',
      performance: 70,
      extracurriculars: []
    },
    careerPath: 'undecided',
    careerInterestLevel: 50,
    happiness: 90
  }
}

function generateChildTraits(playerTraits: string[], partnerTraits: string[]): string[] {
  const traits: string[] = []
  const allParentTraits = [...playerTraits, ...partnerTraits]
  
  // Check inheritance from parent traits (mapped to child traits)
  const parentToChildMap: Record<string, string[]> = {
    'competitive': ['competitive', 'determined'],
    'ambitious': ['ambitious', 'determined'],
    'calm': ['calm'],
    'racing_enthusiast': ['racing_obsessed', 'natural_talent'],
    'supportive': ['nurturing'],
    'practical': ['technical_mind']
  }
  
  for (const parentTrait of allParentTraits) {
    const potentialChildTraits = parentToChildMap[parentTrait] || []
    for (const childTraitId of potentialChildTraits) {
      const trait = getChildTraitById(childTraitId)
      if (trait && trait.inheritedChance) {
        if (Math.random() * 100 < trait.inheritedChance && !traits.includes(childTraitId)) {
          traits.push(childTraitId)
        }
      }
    }
  }
  
  // Add 1-2 random traits
  const randomCount = 1 + Math.floor(Math.random() * 2) - traits.length
  if (randomCount > 0) {
    const availableTraits = CHILD_TRAITS.filter(t => !traits.includes(t.id))
    const shuffled = [...availableTraits].sort(() => Math.random() - 0.5)
    traits.push(...shuffled.slice(0, randomCount).map(t => t.id))
  }
  
  return traits.slice(0, 3) // Max 3 traits
}

function calculateInitialDevelopment(traits: string[]): Child['development'] {
  const development = {
    racingAptitude: 40 + Math.floor(Math.random() * 20),
    academicAptitude: 40 + Math.floor(Math.random() * 20),
    socialSkills: 40 + Math.floor(Math.random() * 20),
    creativity: 40 + Math.floor(Math.random() * 20),
    discipline: 40 + Math.floor(Math.random() * 20),
    ambition: 40 + Math.floor(Math.random() * 20),
    physicalFitness: 50
  }
  
  // Apply trait modifiers
  for (const traitId of traits) {
    const trait = getChildTraitById(traitId)
    if (trait?.effects) {
      development.racingAptitude += trait.effects.racingAptitude || 0
      development.academicAptitude += trait.effects.academicAptitude || 0
      development.socialSkills += trait.effects.socialSkills || 0
      development.creativity += trait.effects.creativity || 0
      development.discipline += trait.effects.discipline || 0
      development.ambition += trait.effects.ambition || 0
    }
  }
  
  // Clamp values
  Object.keys(development).forEach(key => {
    development[key as keyof typeof development] = Math.max(0, Math.min(100, development[key as keyof typeof development]))
  })
  
  return development
}

// ============================================
// CHILD DEVELOPMENT
// ============================================

export function ageChildByYear(child: Child): Child {
  const newAge = child.age + 1
  
  // Update education level
  let education = { ...child.education }
  if (newAge === 5) education.currentLevel = 'elementary'
  else if (newAge === 11) education.currentLevel = 'middle_school'
  else if (newAge === 14) education.currentLevel = 'high_school'
  else if (newAge === 18) education.currentLevel = 'university'
  else if (newAge === 22) education.currentLevel = 'graduated'
  
  // Natural development growth (slows with age)
  const growthRate = Math.max(0.5, 2 - newAge / 10)
  const development = { ...child.development }
  
  Object.keys(development).forEach(key => {
    const k = key as keyof typeof development
    development[k] = Math.min(100, development[k] + Math.floor(Math.random() * growthRate * 3))
  })
  
  // Physical fitness peaks in late teens
  if (newAge >= 16 && newAge <= 25) {
    development.physicalFitness = Math.min(100, development.physicalFitness + 2)
  } else if (newAge > 30) {
    development.physicalFitness = Math.max(40, development.physicalFitness - 1)
  }
  
  // Career interest develops with age
  let careerInterestLevel = child.careerInterestLevel
  if (newAge >= 10 && child.racingDevelopment?.isActive) {
    careerInterestLevel = Math.min(100, careerInterestLevel + 5)
  }
  
  return {
    ...child,
    age: newAge,
    education,
    development,
    careerInterestLevel
  }
}

export function interactWithChild(
  child: Child,
  interactionType: ChildInteraction['type'],
  currentWeek: number,
  currentYear: number
): Child {
  const interactions: Record<ChildInteraction['type'], { bondImpact: number; happinessImpact: number; description: string }> = {
    quality_time: { bondImpact: 5, happinessImpact: 8, description: 'Spent quality time together' },
    racing_activity: { bondImpact: 7, happinessImpact: 10, description: 'Racing activity together' },
    education_support: { bondImpact: 3, happinessImpact: 4, description: 'Helped with education' },
    discipline: { bondImpact: -2, happinessImpact: -5, description: 'Had to discipline' },
    celebration: { bondImpact: 8, happinessImpact: 15, description: 'Celebrated achievement' },
    support: { bondImpact: 6, happinessImpact: 10, description: 'Provided emotional support' }
  }
  
  const effect = interactions[interactionType]
  
  const newInteraction: ChildInteraction = {
    type: interactionType,
    description: effect.description,
    date: { week: currentWeek, year: currentYear },
    bondImpact: effect.bondImpact,
    happinessImpact: effect.happinessImpact
  }
  
  return {
    ...child,
    bondLevel: Math.max(0, Math.min(100, child.bondLevel + effect.bondImpact)),
    happiness: Math.max(0, Math.min(100, child.happiness + effect.happinessImpact)),
    recentInteractions: [...child.recentInteractions.slice(-9), newInteraction]
  }
}

// ============================================
// RACING DEVELOPMENT
// ============================================

export function startRacingDevelopment(
  child: Child,
  currentWeek: number,
  currentYear: number
): Child {
  if (child.age < RELATIONSHIP_CONFIG.childAgeForKarting) {
    return child // Too young
  }
  
  // Calculate potential based on traits and development
  const racingPotential = Math.min(100, Math.round(
    child.development.racingAptitude * 0.4 +
    child.development.discipline * 0.2 +
    child.development.physicalFitness * 0.2 +
    child.development.ambition * 0.1 +
    (child.traits.includes('natural_talent') ? 15 : 0) +
    (child.traits.includes('racing_obsessed') ? 10 : 0)
  ))
  
  return {
    ...child,
    racingDevelopment: {
      isActive: true,
      currentLevel: 'karting',
      yearsExperience: 0,
      results: [],
      potentialRating: racingPotential,
      currentRating: Math.round(racingPotential * 0.3) // Start at 30% of potential
    },
    careerPath: 'racing_driver',
    careerInterestLevel: Math.min(100, child.careerInterestLevel + 20)
  }
}

export function progressRacingDevelopment(child: Child): Child {
  if (!child.racingDevelopment?.isActive) return child
  
  const racing = { ...child.racingDevelopment }
  racing.yearsExperience += 1
  
  // Improvement based on potential, discipline, and training
  const improvementRate = (
    (racing.potentialRating - racing.currentRating) * 0.1 +
    child.development.discipline * 0.02
  )
  
  racing.currentRating = Math.min(
    racing.potentialRating,
    racing.currentRating + improvementRate
  )
  
  // Level progression based on age and ability
  if (child.age >= RELATIONSHIP_CONFIG.childAgeForJuniorFormula && racing.currentLevel === 'karting') {
    if (racing.currentRating >= 60) {
      racing.currentLevel = 'junior_formula'
    }
  }
  
  if (child.age >= 17 && racing.currentLevel === 'junior_formula') {
    if (racing.currentRating >= 70) {
      racing.currentLevel = 'regional'
    }
  }
  
  if (child.age >= 19 && racing.currentLevel === 'regional') {
    if (racing.currentRating >= 80) {
      racing.currentLevel = 'national'
    }
  }
  
  if (child.age >= 21 && racing.currentLevel === 'national') {
    if (racing.currentRating >= 85) {
      racing.currentLevel = 'professional'
    }
  }
  
  return { ...child, racingDevelopment: racing }
}

export function simulateChildRace(
  child: Child,
  eventName: string,
  currentWeek: number,
  currentYear: number
): { child: Child; result: ChildRacingResult } {
  if (!child.racingDevelopment?.isActive) {
    throw new Error('Child is not in racing development')
  }
  
  const racing = child.racingDevelopment
  const totalParticipants = racing.currentLevel === 'karting' ? 30 : 
                            racing.currentLevel === 'junior_formula' ? 24 : 20
  
  // Calculate expected position based on rating
  const ratingPercentile = racing.currentRating / 100
  const basePosition = Math.round(totalParticipants * (1 - ratingPercentile))
  
  // Add randomness (±30%)
  const variance = Math.floor(basePosition * 0.3 * (Math.random() - 0.5) * 2)
  const position = Math.max(1, Math.min(totalParticipants, basePosition + variance))
  
  const result: ChildRacingResult = {
    event: eventName,
    position,
    totalParticipants,
    level: racing.currentLevel,
    date: { week: currentWeek, year: currentYear }
  }
  
  // Update racing development with result
  const updatedRacing = {
    ...racing,
    results: [...racing.results.slice(-19), result]
  }
  
  // Good results boost rating slightly, experience helps
  if (position <= 3) {
    updatedRacing.currentRating = Math.min(
      updatedRacing.potentialRating,
      updatedRacing.currentRating + 1
    )
  }
  
  return {
    child: { ...child, racingDevelopment: updatedRacing },
    result
  }
}

// ============================================
// DYNASTY TRACKING
// ============================================

export function createFamilyTree(
  founderFirstName: string,
  founderLastName: string,
  currentWeek: number,
  currentYear: number
): FamilyTree {
  const founderId = 'player'
  
  return {
    founderId,
    founderName: `${founderFirstName} ${founderLastName}`,
    dynastyStartDate: { week: currentWeek, year: currentYear },
    members: [{
      id: founderId,
      firstName: founderFirstName,
      lastName: founderLastName,
      relationship: 'player',
      generation: 1,
      isAlive: true,
      birthDate: undefined, // Set from player data
      teamLeadership: {
        startDate: { week: currentWeek, year: currentYear },
        championshipsWon: 0,
        teamHighestTier: 'Unknown'
      }
    }],
    marriages: [],
    achievements: [],
    legacy: {
      generationsActive: 1,
      totalFamilyChampionships: 0,
      totalFamilyWins: 0,
      totalFamilyRaces: 0,
      yearsInMotorsport: 0,
      familyNetWorth: 0,
      notableDrivers: [],
      notableTeamPrincipals: [founderFirstName + ' ' + founderLastName]
    }
  }
}

export function addPartnerToFamilyTree(
  tree: FamilyTree,
  partner: Partner,
  currentWeek: number,
  currentYear: number
): FamilyTree {
  const newMember: FamilyMember = {
    id: partner.id,
    firstName: partner.firstName,
    lastName: partner.lastName,
    relationship: 'spouse',
    generation: 1,
    isAlive: true
  }
  
  const marriage = {
    partner1Id: 'player',
    partner2Id: partner.id,
    marriageDate: { week: currentWeek, year: currentYear },
    childrenIds: []
  }
  
  return {
    ...tree,
    members: [...tree.members, newMember],
    marriages: [...tree.marriages, marriage]
  }
}

export function addChildToFamilyTree(
  tree: FamilyTree,
  child: Child
): FamilyTree {
  const newMember: FamilyMember = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    relationship: 'child',
    generation: 2,
    isAlive: true,
    birthDate: child.birthDate
  }
  
  // Add to parents' marriage record
  const marriages = tree.marriages.map(m => {
    if (m.partner1Id === 'player') {
      return { ...m, childrenIds: [...m.childrenIds, child.id] }
    }
    return m
  })
  
  // Check for achievement
  const achievements = [...tree.achievements]
  if (!achievements.find(a => a.id === 'first_child')) {
    achievements.push({
      id: 'first_child',
      name: 'New Generation',
      description: 'Welcomed your first child to the family',
      unlockedDate: child.birthDate,
      category: 'family'
    })
  }
  
  return {
    ...tree,
    members: [...tree.members, newMember],
    marriages,
    achievements,
    legacy: {
      ...tree.legacy,
      generationsActive: Math.max(tree.legacy.generationsActive, 2)
    }
  }
}

export function recordFamilyRacingAchievement(
  tree: FamilyTree,
  memberId: string,
  achievement: 'win' | 'championship',
  currentWeek: number,
  currentYear: number
): FamilyTree {
  const member = tree.members.find(m => m.id === memberId)
  if (!member) return tree
  
  const updatedMembers = tree.members.map(m => {
    if (m.id !== memberId) return m
    
    const racing = m.racingCareer || {
      active: true,
      totalRaces: 0,
      wins: 0,
      championships: 0,
      peakRating: 0
    }
    
    return {
      ...m,
      racingCareer: {
        ...racing,
        wins: achievement === 'win' ? racing.wins + 1 : racing.wins,
        championships: achievement === 'championship' ? racing.championships + 1 : racing.championships
      }
    }
  })
  
  const legacy = { ...tree.legacy }
  if (achievement === 'win') {
    legacy.totalFamilyWins += 1
  } else {
    legacy.totalFamilyChampionships += 1
  }
  
  // Check for dynasty achievements
  const achievements = [...tree.achievements]
  
  if (member.generation > 1 && achievement === 'win') {
    if (!achievements.find(a => a.id === 'child_wins_race')) {
      achievements.push({
        id: 'child_wins_race',
        name: 'Chip Off The Block',
        description: `${member.firstName} won their first race`,
        unlockedDate: { week: currentWeek, year: currentYear },
        category: 'racing'
      })
    }
  }
  
  if (member.generation > 1 && achievement === 'championship') {
    if (!achievements.find(a => a.id === 'child_wins_championship')) {
      achievements.push({
        id: 'child_wins_championship',
        name: 'Racing Dynasty',
        description: `${member.firstName} won a championship`,
        unlockedDate: { week: currentWeek, year: currentYear },
        category: 'racing'
      })
    }
  }
  
  if (legacy.totalFamilyChampionships >= 10) {
    if (!achievements.find(a => a.id === 'ten_family_championships')) {
      achievements.push({
        id: 'ten_family_championships',
        name: 'Legendary Dynasty',
        description: 'The family has won 10 championships',
        unlockedDate: { week: currentWeek, year: currentYear },
        category: 'legacy'
      })
    }
  }
  
  return {
    ...tree,
    members: updatedMembers,
    achievements,
    legacy
  }
}

// ============================================
// SUCCESSION
// ============================================

export interface SuccessionCandidate {
  child: Child
  score: number
  strengths: string[]
  weaknesses: string[]
  readiness: 'not_ready' | 'developing' | 'ready' | 'highly_qualified'
}

export function evaluateSuccessionCandidates(children: Child[]): SuccessionCandidate[] {
  const minAge = RELATIONSHIP_CONFIG.childMinAgeForSuccession
  
  return children
    .filter(child => child.age >= minAge - 5) // Include those approaching age
    .map(child => {
      const strengths: string[] = []
      const weaknesses: string[] = []
      let score = 0
      
      // Age factor
      if (child.age >= minAge) {
        score += 20
      } else {
        weaknesses.push(`Too young (${minAge - child.age} years until eligible)`)
        score -= 10
      }
      
      // Development factors
      if (child.development.ambition >= 70) {
        score += 15
        strengths.push('Highly ambitious')
      }
      if (child.development.discipline >= 70) {
        score += 10
        strengths.push('Strong discipline')
      }
      if (child.development.socialSkills >= 70) {
        score += 10
        strengths.push('Excellent people skills')
      }
      if (child.development.academicAptitude >= 70) {
        score += 5
        strengths.push('Academically capable')
      }
      
      // Racing background
      if (child.racingDevelopment?.isActive) {
        score += 10
        strengths.push('Racing experience')
        
        if (child.racingDevelopment.currentLevel === 'professional') {
          score += 15
          strengths.push('Professional racing career')
        }
      }
      
      // Career path
      if (child.careerPath === 'team_manager' || child.careerPath === 'racing_driver') {
        score += 10
        strengths.push(`Career in ${child.careerPath.replace('_', ' ')}`)
      }
      
      // Bond level (do they actually want to?)
      if (child.bondLevel >= 80) {
        score += 10
        strengths.push('Strong family bond')
      } else if (child.bondLevel < 50) {
        score -= 10
        weaknesses.push('Distant relationship')
      }
      
      // Interest level
      if (child.careerInterestLevel >= 80) {
        score += 15
        strengths.push('Very interested in taking over')
      } else if (child.careerInterestLevel < 40) {
        score -= 10
        weaknesses.push('Low interest in the team')
      }
      
      // Traits
      if (child.traits.includes('business_minded')) {
        score += 10
        strengths.push('Business minded')
      }
      if (child.traits.includes('determined')) {
        score += 5
        strengths.push('Determined')
      }
      
      // Calculate readiness
      let readiness: SuccessionCandidate['readiness'] = 'not_ready'
      if (child.age >= minAge) {
        if (score >= 80) readiness = 'highly_qualified'
        else if (score >= 60) readiness = 'ready'
        else if (score >= 40) readiness = 'developing'
      } else if (score >= 50) {
        readiness = 'developing'
      }
      
      return {
        child,
        score: Math.max(0, Math.min(100, score)),
        strengths,
        weaknesses,
        readiness
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function prepareSuccessor(
  child: Child,
  mentorshipWeeks: number
): Child {
  // Each week of mentorship improves relevant skills
  const improvement = Math.min(20, mentorshipWeeks * 0.5)
  
  return {
    ...child,
    development: {
      ...child.development,
      ambition: Math.min(100, child.development.ambition + improvement * 0.3),
      discipline: Math.min(100, child.development.discipline + improvement * 0.2),
      socialSkills: Math.min(100, child.development.socialSkills + improvement * 0.2)
    },
    careerInterestLevel: Math.min(100, child.careerInterestLevel + improvement),
    bondLevel: Math.min(100, child.bondLevel + improvement * 0.5)
  }
}

// ============================================
// WEEKLY FAMILY PROCESSING
// ============================================

export function processWeeklyFamily(
  children: Child[],
  familyTree: FamilyTree,
  currentWeek: number,
  currentYear: number
): {
  updatedChildren: Child[]
  updatedTree: FamilyTree
  monthlyChildCosts: number
  events: string[]
} {
  const events: string[] = []
  let monthlyChildCosts = 0
  
  // Process each child
  const updatedChildren = children.map(child => {
    let updatedChild = { ...child }
    
    // Calculate monthly costs (divided by ~4 for weekly)
    monthlyChildCosts += calculateChildDevelopmentCost(child) / 4
    
    // Weekly bond decay if no recent interaction
    const recentInteraction = child.recentInteractions.find(
      i => i.date.year === currentYear && Math.abs(i.date.week - currentWeek) <= 2
    )
    
    if (!recentInteraction) {
      updatedChild.bondLevel = Math.max(20, updatedChild.bondLevel - 0.5)
    }
    
    // Check for birthday (simplified - once per year)
    if (currentWeek === 1) {
      updatedChild = ageChildByYear(updatedChild)
      events.push(`${child.firstName} is now ${updatedChild.age} years old!`)
      
      // Special age milestones
      if (updatedChild.age === RELATIONSHIP_CONFIG.childAgeForKarting) {
        events.push(`${child.firstName} is now old enough to start karting!`)
      }
      if (updatedChild.age === RELATIONSHIP_CONFIG.childAgeForAdulthood) {
        events.push(`${child.firstName} has reached adulthood!`)
      }
    }
    
    return updatedChild
  })
  
  // Update family tree legacy
  const updatedTree: FamilyTree = {
    ...familyTree,
    legacy: {
      ...familyTree.legacy,
      yearsInMotorsport: currentYear - familyTree.dynastyStartDate.year
    }
  }
  
  return {
    updatedChildren,
    updatedTree,
    monthlyChildCosts,
    events
  }
}

// ============================================
// CHILD CAREER PATHS
// ============================================

export function setChildCareerPath(child: Child, path: ChildCareerPath): Child {
  return {
    ...child,
    careerPath: path,
    careerInterestLevel: path === 'racing_driver' || path === 'team_manager' 
      ? Math.max(child.careerInterestLevel, 60)
      : child.careerInterestLevel
  }
}

export function getCareerPathDescription(path: ChildCareerPath): string {
  const descriptions: Record<ChildCareerPath, string> = {
    racing_driver: 'Pursuing a career as a professional racing driver',
    team_manager: 'Training to manage and lead the family racing team',
    engineer: 'Studying engineering to work in motorsport development',
    business: 'Building a career in business outside of racing',
    media: 'Working in motorsport media and journalism',
    other: 'Pursuing interests outside of motorsport',
    undecided: 'Career path not yet decided'
  }
  return descriptions[path]
}
