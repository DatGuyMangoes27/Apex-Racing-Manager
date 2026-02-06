// ============================================
// STAFF JOB MARKET SIMULATION
// Candidate generation, weekly refresh, and AI negotiation logic
// ============================================

import type { 
  StaffCandidate, 
  StaffSpecialization, 
  StaffPersonality,
  StaffContractOffer,
  StaffNegotiation,
  StaffImpactPreview,
  TeamStaffRole,
  TeamStaff,
  _FacilityType,
  StaffBio,
  WorkHistoryEntry
} from '@/store/careerStore'

import {
  STAFF_SPECIALIZATIONS,
  STAFF_PERSONALITIES,
  ROLE_SALARY_RANGES,
  getSpecializationsForRole,
  calculateBaseSalary,
  getSpecializationsByRarity,
  checkPersonalityChemistry,
  _STAFF_FIRST_NAMES,
  _STAFF_LAST_NAMES,
  _STAFF_NATIONALITIES,
  // Legacy imports still used by other parts of this file
  _STAFF_ACHIEVEMENTS
} from '@/data/staff-traits'

import { pickNationality, pickGender, generateStaffName } from '@/data/staff-names'
import { getPortraitIdByGender } from '@/utils/generated-assets'

// ============================================
// CANDIDATE GENERATION
// ============================================

/**
 * Generate a unique ID for staff candidates
 */
function generateCandidateId(): string {
  return `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Pick random item from array
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Pick N random items from array without duplicates
 */
function randomPickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Generate random number in range
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ============================================
// BIO & CAREER HISTORY GENERATION
// ============================================

/**
 * Teams that staff members might have previously worked for
 */
const PREVIOUS_TEAMS = [
  'Scuderia Ferrari', 'McLaren Racing', 'Red Bull Racing', 'Mercedes-AMG Petronas',
  'Aston Martin', 'Alpine F1', 'Williams Racing', 'Haas F1', 'Alfa Romeo Racing',
  'AlphaTauri', 'Racing Point', 'Renault F1', 'Toro Rosso', 'Force India',
  'Sauber', 'Lotus F1', 'Caterham', 'Marussia', 'Manor Racing',
  'BMW Sauber', 'Toyota Racing', 'Honda Racing', 'BAR Honda',
  'Jordan Grand Prix', 'Minardi', 'Jaguar Racing', 'Stewart Grand Prix',
  // Lower series teams
  'Prema Racing', 'ART Grand Prix', 'DAMS', 'Carlin', 'Hitech GP',
  'MP Motorsport', 'UNI-Virtuosi', 'Campos Racing', 'Charouz Racing',
  // Other motorsport
  'Porsche Motorsport', 'Audi Sport', 'Penske Racing', 'Andretti Autosport',
  'Chip Ganassi Racing', 'Arrow McLaren SP', 'Toyota Gazoo Racing',
  'BMW Motorsport', 'Mercedes DTM', 'Aston Martin Racing'
]

/**
 * Role-specific job titles for work history
 */
const ROLE_TITLES: Record<TeamStaffRole, string[]> = {
  chief_engineer: ['Race Engineer', 'Performance Engineer', 'Vehicle Dynamics Engineer', 'Senior Engineer', 'Lead Engineer', 'Chief Engineer'],
  technical_director: ['Head of Aerodynamics', 'Chief Designer', 'Technical Director', 'Head of Engineering', 'Deputy Technical Director'],
  strategist: ['Strategy Analyst', 'Junior Strategist', 'Strategy Engineer', 'Lead Strategist', 'Head of Strategy'],
  team_manager: ['Operations Coordinator', 'Logistics Manager', 'Team Coordinator', 'Operations Manager', 'Team Manager'],
  pr_manager: ['Media Coordinator', 'Communications Officer', 'PR Coordinator', 'PR Manager', 'Head of Communications'],
  crew_chief: ['Pit Crew Member', 'Mechanic', 'Senior Mechanic', 'Crew Supervisor', 'Crew Chief', 'Head of Pit Operations'],
  data_engineer: ['Data Analyst', 'Telemetry Engineer', 'Simulation Engineer', 'Senior Data Engineer', 'Head of Data Analysis'],
  reserve_driver: ['Test Driver', 'Development Driver', 'Simulator Driver', 'Reserve Driver', 'Third Driver']
}

/**
 * Role-specific achievements for work history
 */
const ROLE_ACHIEVEMENTS: Record<TeamStaffRole, string[]> = {
  chief_engineer: [
    'Led development of championship-winning car',
    'Pioneered innovative suspension design',
    'Achieved 15% improvement in cornering performance',
    'Developed race-winning setup philosophy',
    'Mentored multiple engineers now in senior roles',
    'Key contributor to double world championship'
  ],
  technical_director: [
    'Directed complete car redesign program',
    'Led team to first constructor\'s championship',
    'Introduced ground-breaking aerodynamic concepts',
    'Oversaw development of record-breaking car',
    'Built engineering department from ground up',
    'Achieved unprecedented development efficiency'
  ],
  strategist: [
    'Called strategy for 12 race victories',
    'Developed proprietary strategy simulation tools',
    'Turned potential P5 into race win at Monaco',
    'Perfect tire strategy calls in wet conditions',
    'Key contributor to championship-deciding race',
    'Revolutionized team\'s approach to race planning'
  ],
  team_manager: [
    'Reduced operational costs by 20%',
    'Built efficient trackside logistics system',
    'Managed successful factory expansion project',
    'Coordinated 200+ personnel across multiple sites',
    'Achieved industry-leading staff retention rates',
    'Streamlined race weekend operations'
  ],
  pr_manager: [
    'Secured major title sponsorship deal',
    'Managed successful crisis communications',
    'Built social media following to 5M+ fans',
    'Coordinated launch event with global reach',
    'Established strong journalist relationships',
    'Won industry award for communications excellence'
  ],
  crew_chief: [
    'Led crew to sub-2-second pit stops',
    'Achieved 99.8% pit stop reliability rate',
    'Trained pit crew that set world record',
    'Reduced mechanical DNFs by 40%',
    'Implemented improved pre-race checks',
    'Key role in reliability turnaround season'
  ],
  data_engineer: [
    'Developed real-time strategy optimization system',
    'Created predictive tire degradation model',
    'Built driver performance analysis platform',
    'Achieved 95% correlation between sim and track',
    'Implemented machine learning for setup optimization',
    'Discovered key aero insights through data mining'
  ],
  reserve_driver: [
    'Completed 5,000+ km of development testing',
    'Scored points on debut race weekend',
    'Set fastest lap in practice sessions',
    'Crucial simulator work for car development',
    'Stepped up for injured driver, scored podium',
    'Key contributor to setup development'
  ]
}

/**
 * Personality descriptions for bio generation
 */
const PERSONALITY_DESCRIPTIONS: Record<StaffPersonality, string[]> = {
  ambitious: [
    'Known for pushing themselves and their colleagues to achieve more',
    'Always looking for the next challenge and opportunity to prove themselves',
    'Driven by a desire to reach the top of the sport',
    'Never satisfied with the status quo, always seeking improvement'
  ],
  loyal: [
    'Values long-term relationships and team stability above all',
    'Known for their dedication and commitment to their colleagues',
    'Prefers building something lasting over chasing short-term gains',
    'A steady presence who colleagues know they can rely on'
  ],
  demanding: [
    'Expects excellence from themselves and everyone around them',
    'Known for their exacting standards and attention to detail',
    'Doesn\'t accept excuses and pushes for the best possible results',
    'A perfectionist who sets the bar high for the entire team'
  ],
  flexible: [
    'Adapts easily to new situations and challenges',
    'Known for their easy-going nature and ability to work with anyone',
    'Thrives in dynamic environments where plans change quickly',
    'A calming presence who helps the team navigate uncertain situations'
  ]
}

/**
 * Generate career history for a staff member
 */
export function generateCareerHistory(
  role: TeamStaffRole,
  experience: number,
  reputation: number,
  currentStatus: 'available' | 'employed' | 'retiring'
): WorkHistoryEntry[] {
  const history: WorkHistoryEntry[] = []
  const titles = ROLE_TITLES[role]
  const achievements = ROLE_ACHIEVEMENTS[role]
  const currentYear = new Date().getFullYear()
  
  // Number of positions based on experience (typically 2-5 jobs)
  const numPositions = Math.min(5, Math.max(2, Math.floor(experience / 4) + 1))
  
  // Available teams (shuffle to get variety)
  const availableTeams = [...PREVIOUS_TEAMS].sort(() => Math.random() - 0.5)
  
  let yearPointer = currentYear - experience
  
  for (let i = 0; i < numPositions; i++) {
    const isCurrentJob = i === numPositions - 1 && currentStatus === 'employed'
    const isFirstJob = i === 0
    
    // Duration: first job shorter, later jobs longer
    const minDuration = isFirstJob ? 1 : 2
    const maxDuration = isFirstJob ? 3 : Math.min(8, experience - (numPositions - i - 1) * 2)
    const duration = randomInRange(minDuration, Math.max(minDuration, maxDuration))
    
    const startYear = yearPointer
    const endYear = isCurrentJob ? currentYear : yearPointer + duration
    
    // Title progression: earlier jobs = lower titles
    const titleIndex = Math.min(titles.length - 1, Math.floor((i / numPositions) * titles.length))
    const title = titles[titleIndex]
    
    // Team selection (higher rep = more likely to have worked at top teams)
    const teamIndex = reputation > 70 
      ? randomInRange(0, Math.floor(availableTeams.length / 3))
      : reputation > 50
        ? randomInRange(0, Math.floor(availableTeams.length / 2))
        : randomInRange(Math.floor(availableTeams.length / 3), availableTeams.length - 1)
    
    const team = availableTeams[teamIndex]
    availableTeams.splice(teamIndex, 1)  // Remove to avoid duplicates
    if (availableTeams.length === 0) availableTeams.push(...PREVIOUS_TEAMS)
    
    // Achievement chance: higher for later/better jobs
    const achievementChance = (i / numPositions) * 0.5 + (reputation / 200)
    const achievement = Math.random() < achievementChance 
      ? randomPick(achievements)
      : undefined
    
    history.push({
      team,
      role: title,
      years: isCurrentJob ? `${startYear}-Present` : `${startYear}-${endYear}`,
      achievement
    })
    
    yearPointer = endYear + (isCurrentJob ? 0 : randomInRange(0, 1))  // Small gaps between jobs
  }
  
  return history
}

/**
 * Generate a comprehensive staff biography
 */
export function generateStaffBio(
  name: string,
  role: TeamStaffRole,
  nationality: string,
  age: number,
  experience: number,
  reputation: number,
  personality: StaffPersonality,
  specializations: StaffSpecialization[],
  currentStatus: 'available' | 'employed' | 'retiring'
): StaffBio {
  // Generate work history first
  const workHistory = generateCareerHistory(role, experience, reputation, currentStatus)
  
  // Get role name for narrative
  const roleInfo = ROLE_SALARY_RANGES[role]
  const roleName = roleInfo.name.toLowerCase()
  
  // Build background narrative
  const recentTeam = workHistory[workHistory.length - 1]?.team || 'a top motorsport team'
  const firstTeam = workHistory[0]?.team || 'the lower formulae'
  
  const backgroundIntros = [
    `${name} began their motorsport journey ${experience} years ago at ${firstTeam}`,
    `A ${nationality} ${roleName} with ${experience} years in the sport, ${name} first made their mark at ${firstTeam}`,
    `Starting out at ${firstTeam}, ${name} has spent ${experience} years building a reputation as a skilled ${roleName}`,
    `${name}'s ${experience}-year career in motorsport began with a role at ${firstTeam}`
  ]
  
  const reputationDescriptors = reputation > 75 
    ? ['highly respected', 'widely regarded as one of the best', 'with an excellent reputation']
    : reputation > 50
      ? ['well-regarded', 'respected in the paddock', 'with a solid reputation']
      : ['developing', 'up-and-coming', 'building their reputation']
  
  const statusEndings = {
    available: `Currently seeking new opportunities after leaving ${recentTeam}.`,
    employed: `Currently working at ${recentTeam}, but open to the right opportunity.`,
    retiring: `Considering retirement after a distinguished career, but might be tempted by the right project.`
  }
  
  const background = `${randomPick(backgroundIntros)}. Now ${randomPick(reputationDescriptors)} in the industry, they have worked their way up through increasingly demanding roles. ${statusEndings[currentStatus]}`
  
  // Generate career highlights
  const careerHighlights: string[] = []
  
  // Add achievements from work history
  for (const entry of workHistory) {
    if (entry.achievement) {
      careerHighlights.push(`${entry.achievement} at ${entry.team}`)
    }
  }
  
  // Add specialization-based highlights
  for (const specId of specializations) {
    const _spec = STAFF_SPECIALIZATIONS[specId]
    const specHighlights: Record<StaffSpecialization, string> = {
      setup_wizard: 'Renowned for exceptional car setup abilities',
      pit_master: 'Known for coordinating world-class pit stops',
      data_analyst: 'Expert at extracting performance insights from data',
      motivator: 'Recognized for inspiring teams to exceed expectations',
      cost_cutter: 'Achieved significant budget efficiencies without sacrificing performance',
      talent_scout: 'Discovered multiple talents who went on to successful careers',
      media_savvy: 'Built strong relationships with media and sponsors',
      tire_whisperer: 'Deep understanding of tire behavior and strategy',
      reliability_guru: 'Track record of exceptional mechanical reliability',
      aero_specialist: 'Pioneered innovative aerodynamic solutions'
    }
    if (specHighlights[specId]) {
      careerHighlights.push(specHighlights[specId])
    }
  }
  
  // Ensure at least 2-3 highlights
  if (careerHighlights.length < 2) {
    const genericHighlights = [
      `Worked with multiple race-winning drivers`,
      `Contributed to significant performance improvements`,
      `Built strong relationships across the paddock`,
      `Known for professionalism and work ethic`
    ]
    while (careerHighlights.length < 2) {
      const highlight = randomPick(genericHighlights)
      if (!careerHighlights.includes(highlight)) {
        careerHighlights.push(highlight)
      }
    }
  }
  
  // Personality note
  const personalityNote = randomPick(PERSONALITY_DESCRIPTIONS[personality])
  
  // Generate strengths based on role and specializations
  const strengths: string[] = []
  
  // Role-based strengths
  const roleStrengths: Record<TeamStaffRole, string[]> = {
    chief_engineer: ['Car development', 'Race weekend engineering', 'Driver feedback interpretation', 'Setup optimization'],
    technical_director: ['Strategic planning', 'Team leadership', 'Technical vision', 'R&D direction'],
    strategist: ['Race strategy', 'Data analysis', 'Quick decision-making', 'Scenario planning'],
    team_manager: ['Operations management', 'People coordination', 'Logistics planning', 'Budget management'],
    pr_manager: ['Media relations', 'Crisis management', 'Sponsor communications', 'Brand building'],
    crew_chief: ['Pit operations', 'Team coordination', 'Reliability management', 'Quality control'],
    data_engineer: ['Telemetry analysis', 'Simulation', 'Performance modeling', 'Data visualization'],
    reserve_driver: ['Testing feedback', 'Simulator work', 'Development driving', 'Car setup input']
  }
  strengths.push(...randomPickN(roleStrengths[role], 2))
  
  // Specialization-based strengths
  for (const specId of specializations) {
    const spec = STAFF_SPECIALIZATIONS[specId]
    strengths.push(spec.name)
  }
  
  // Generate weaknesses (more subtle, 1-2 items)
  const weaknesses: string[] = []
  const possibleWeaknesses: Record<StaffPersonality, string[]> = {
    ambitious: ['May prioritize personal advancement', 'Can be impatient with slower progress', 'Sometimes takes on too much'],
    loyal: ['Resistant to necessary changes', 'May stay in comfort zone', 'Can be slow to adapt'],
    demanding: ['Can create pressure on colleagues', 'High standards may cause friction', 'Struggles with imperfection'],
    flexible: ['May lack strong convictions', 'Can be indecisive under pressure', 'Sometimes too accommodating']
  }
  weaknesses.push(randomPick(possibleWeaknesses[personality]))
  
  if (experience < 5) {
    weaknesses.push('Limited experience at the highest level')
  } else if (age > 55) {
    weaknesses.push('May be set in their ways')
  }
  
  return {
    background,
    careerHighlights: careerHighlights.slice(0, 4),  // Cap at 4 highlights
    workHistory,
    personalityNote,
    strengths: [...new Set(strengths)].slice(0, 4),  // Remove duplicates, cap at 4
    weaknesses: weaknesses.slice(0, 2)  // Cap at 2
  }
}

/**
 * Generate specializations for a candidate based on role and reputation
 */
function generateSpecializations(
  role: TeamStaffRole,
  reputation: number
): StaffSpecialization[] {
  const compatibleSpecs = getSpecializationsForRole(role)
  if (compatibleSpecs.length === 0) return []
  
  // Higher reputation = more likely to have rare specializations
  const hasRareChance = reputation > 70 ? 0.4 : reputation > 50 ? 0.2 : 0.05
  const hasUncommonChance = reputation > 50 ? 0.6 : reputation > 30 ? 0.4 : 0.2
  
  const specs: StaffSpecialization[] = []
  const rareSpecs = getSpecializationsByRarity('rare').filter(s => compatibleSpecs.includes(s))
  const uncommonSpecs = getSpecializationsByRarity('uncommon').filter(s => compatibleSpecs.includes(s))
  const commonSpecs = getSpecializationsByRarity('common').filter(s => compatibleSpecs.includes(s))
  
  // Try for rare first
  if (rareSpecs.length > 0 && Math.random() < hasRareChance) {
    specs.push(randomPick(rareSpecs))
  }
  
  // Then uncommon
  if (specs.length < 2 && uncommonSpecs.length > 0 && Math.random() < hasUncommonChance) {
    const available = uncommonSpecs.filter(s => !specs.includes(s))
    if (available.length > 0) {
      specs.push(randomPick(available))
    }
  }
  
  // Fill with common if needed (most candidates get at least one)
  if (specs.length === 0 && commonSpecs.length > 0 && Math.random() < 0.7) {
    specs.push(randomPick(commonSpecs))
  }
  
  // Small chance for second common spec
  if (specs.length === 1 && commonSpecs.length > 1 && Math.random() < 0.3) {
    const available = commonSpecs.filter(s => !specs.includes(s))
    if (available.length > 0) {
      // Check for incompatibilities
      const existingSpec = STAFF_SPECIALIZATIONS[specs[0]]
      const validSpecs = available.filter(s => 
        !existingSpec.incompatibleWith?.includes(s)
      )
      if (validSpecs.length > 0) {
        specs.push(randomPick(validSpecs))
      }
    }
  }
  
  return specs
}

/**
 * Generate a single staff candidate
 */
export function generateStaffCandidate(
  role: TeamStaffRole,
  reputationTier: 'low' | 'mid' | 'high' = 'mid'
): StaffCandidate {
  // Determine reputation range based on tier
  const repRanges = {
    low: [20, 45],
    mid: [40, 70],
    high: [65, 95]
  }
  const [minRep, maxRep] = repRanges[reputationTier]
  const reputation = randomInRange(minRep, maxRep)
  
  // Generate gender-aware name with nationality from new pool
  const gender = pickGender()
  const nat = pickNationality()
  const { firstName, lastName } = generateStaffName(gender, nat.region)
  const nationality = nat.country
  const personality = randomPick(['ambitious', 'loyal', 'demanding', 'flexible'] as StaffPersonality[])
  
  // Generate a unique ID and assign persistent portrait
  const id = generateCandidateId()
  const _portraitId = getPortraitIdByGender(gender, id)
  
  // Age and experience correlate with reputation
  const minAge = 25 + Math.floor(reputation / 10)
  const maxAge = 35 + Math.floor(reputation / 5)
  const age = randomInRange(minAge, maxAge)
  const experience = Math.max(1, age - 23 - randomInRange(0, 5))
  
  // Generate skills based on reputation (with variance)
  const baseSkill = reputation * 0.8 + randomInRange(-10, 10)
  const skills = {
    reliability: Math.max(10, Math.min(100, Math.round(baseSkill + randomInRange(-15, 15)))),
    strategy: Math.max(10, Math.min(100, Math.round(baseSkill + randomInRange(-15, 15)))),
    pit: Math.max(10, Math.min(100, Math.round(baseSkill + randomInRange(-15, 15)))),
    aeroAssist: role === 'chief_engineer' || role === 'technical_director' 
      ? Math.max(10, Math.min(100, Math.round(baseSkill + randomInRange(-15, 15))))
      : undefined
  }
  
  // Generate specializations
  const specializations = generateSpecializations(role, reputation)
  
  // Calculate salary expectation
  const salaryExpectation = calculateBaseSalary(role, reputation, personality, specializations)
  
  // Contract preference (higher reputation = wants longer contracts)
  const contractPreference = reputation > 70 ? randomInRange(2, 3) : 
                            reputation > 40 ? randomInRange(1, 2) : 1
  
  // Availability (most are immediate, some have notice periods)
  const availability = Math.random() < 0.7 ? 0 : randomInRange(1, 4)
  
  // Status
  const statusRoll = Math.random()
  const currentStatus = statusRoll < 0.6 ? 'available' : 
                       statusRoll < 0.9 ? 'employed' : 'retiring'
  
  // Generate comprehensive bio with career history
  const name = `${firstName} ${lastName}`
  const bio = generateStaffBio(
    name,
    role,
    nationality,
    age,
    experience,
    reputation,
    personality,
    specializations,
    currentStatus
  )
  
  return {
    id,
    name,
    role,
    nationality,
    age,
    experience,
    reputation,
    skills,
    specializations,
    personality,
    currentStatus,
    salaryExpectation,
    contractPreference,
    availability,
    interestedTeams: [],  // Will be populated by AI team interest simulation
    bio
  }
}

/**
 * Generate the full staff job market (15-20 candidates across all roles)
 */
export function generateStaffMarket(): StaffCandidate[] {
  const candidates: StaffCandidate[] = []
  
  // Roles to fill market with (weighted by typical demand)
  const roleDistribution: { role: TeamStaffRole; count: number }[] = [
    { role: 'chief_engineer', count: 3 },
    { role: 'technical_director', count: 2 },
    { role: 'strategist', count: 4 },
    { role: 'team_manager', count: 3 },
    { role: 'pr_manager', count: 2 },
    { role: 'reserve_driver', count: 2 },
    { role: 'crew_chief', count: 2 },
    { role: 'data_engineer', count: 2 }
  ]
  
  // Reputation tier distribution
  const tierDistribution = ['low', 'mid', 'mid', 'mid', 'high'] as const
  
  for (const { role, count } of roleDistribution) {
    for (let i = 0; i < count; i++) {
      const tier = randomPick([...tierDistribution])
      candidates.push(generateStaffCandidate(role, tier))
    }
  }
  
  return candidates
}

/**
 * Refresh market - remove some candidates, add new ones
 */
export function refreshStaffMarket(
  currentMarket: StaffCandidate[],
  _weekNumber: number
): StaffCandidate[] {
  // Remove 20-40% of candidates (they got hired elsewhere or changed mind)
  const removalCount = Math.floor(currentMarket.length * (0.2 + Math.random() * 0.2))
  const remaining = [...currentMarket]
    .sort(() => Math.random() - 0.5)
    .slice(removalCount)
  
  // Decrease availability countdown for remaining
  for (const candidate of remaining) {
    if (candidate.availability > 0) {
      candidate.availability--
    }
  }
  
  // Add new candidates to reach target of 15-20
  const targetCount = randomInRange(15, 20)
  const newCandidatesNeeded = Math.max(0, targetCount - remaining.length)
  
  const roles: TeamStaffRole[] = ['chief_engineer', 'technical_director', 'strategist', 
    'team_manager', 'pr_manager', 'reserve_driver', 'crew_chief', 'data_engineer']
  const tiers = ['low', 'mid', 'mid', 'high'] as const
  
  for (let i = 0; i < newCandidatesNeeded; i++) {
    const role = randomPick(roles)
    const tier = randomPick([...tiers])
    remaining.push(generateStaffCandidate(role, tier))
  }
  
  return remaining
}

// ============================================
// NEGOTIATION LOGIC
// ============================================

/**
 * Calculate how the candidate feels about an offer
 */
export function evaluateOffer(
  candidate: StaffCandidate,
  offer: StaffContractOffer
): {
  satisfaction: number  // 0-100, how happy they are with the offer
  acceptanceChance: number  // 0-1, chance they accept
  issues: string[]  // What they don't like
} {
  const issues: string[] = []
  let satisfaction = 50  // Start neutral
  
  const personalityDef = STAFF_PERSONALITIES[candidate.personality]
  const expectedSalary = candidate.salaryExpectation
  
  // Salary evaluation (biggest factor)
  const salaryRatio = offer.salary / expectedSalary
  if (salaryRatio >= 1.1) {
    satisfaction += 25
  } else if (salaryRatio >= 1.0) {
    satisfaction += 15
  } else if (salaryRatio >= 0.9) {
    satisfaction += 5
  } else if (salaryRatio >= 0.8) {
    satisfaction -= 10
    issues.push('Salary is below expectations')
  } else if (salaryRatio >= 0.7) {
    satisfaction -= 25
    issues.push('Salary is significantly below expectations')
  } else {
    satisfaction -= 40
    issues.push('Salary offer is insulting')
  }
  
  // Signing bonus evaluation
  const roleRange = ROLE_SALARY_RANGES[candidate.role]
  const expectedBonus = (roleRange.signingBonusRange[0] + roleRange.signingBonusRange[1]) / 2
  const bonusRatio = offer.signingBonus / expectedBonus
  if (bonusRatio >= 1.2) {
    satisfaction += 10
  } else if (bonusRatio >= 0.8) {
    satisfaction += 5
  } else if (bonusRatio < 0.5) {
    satisfaction -= 5
    issues.push('Signing bonus is low')
  }
  
  // Contract length vs preference
  const lengthDiff = offer.contractLength - candidate.contractPreference
  if (lengthDiff === 0) {
    satisfaction += 5
  } else if (lengthDiff > 0 && candidate.personality === 'loyal') {
    satisfaction += 8  // Loyal likes longer contracts
  } else if (lengthDiff > 0 && candidate.personality === 'ambitious') {
    satisfaction -= 5
    issues.push('Would prefer a shorter contract')
  } else if (lengthDiff < -1) {
    satisfaction -= 10
    issues.push('Contract is too short')
  }
  
  // Performance bonus
  if (offer.performanceBonus > 0) {
    satisfaction += Math.min(10, offer.performanceBonus / 1000)
  }
  
  // Buyout clause (ambitious types want lower, loyal don't care)
  if (candidate.personality === 'ambitious' && offer.buyoutClause > expectedSalary * 6) {
    satisfaction -= 5
    issues.push('Buyout clause is too restrictive')
  }
  
  // Apply personality modifier
  satisfaction = Math.round(satisfaction * (1 + personalityDef.negotiationModifier))
  
  // Clamp satisfaction
  satisfaction = Math.max(0, Math.min(100, satisfaction))
  
  // Calculate acceptance chance
  // Base: satisfaction / 100, modified by flexibility
  let acceptanceChance = satisfaction / 100
  acceptanceChance *= (1 + personalityDef.negotiationModifier)
  acceptanceChance = Math.max(0, Math.min(1, acceptanceChance))
  
  return { satisfaction, acceptanceChance, issues }
}

/**
 * Generate AI counter-offer based on candidate preferences
 */
export function generateCounterOffer(
  candidate: StaffCandidate,
  playerOffer: StaffContractOffer,
  negotiationRound: number
): StaffContractOffer {
  const _personalityDef = STAFF_PERSONALITIES[candidate.personality]
  
  // Counter-offers get less aggressive each round
  const aggressiveness = 1 - (negotiationRound * 0.15)
  
  // Calculate what they want
  const wantedSalary = candidate.salaryExpectation
  const roleRange = ROLE_SALARY_RANGES[candidate.role]
  const wantedBonus = (roleRange.signingBonusRange[0] + roleRange.signingBonusRange[1]) / 2
  
  // Meet somewhere between player offer and their expectations
  const meetingPoint = 0.4 + (negotiationRound * 0.15)  // Gets closer to player each round
  
  return {
    salary: Math.round(playerOffer.salary + (wantedSalary - playerOffer.salary) * aggressiveness * (1 - meetingPoint)),
    signingBonus: Math.round(playerOffer.signingBonus + (wantedBonus - playerOffer.signingBonus) * aggressiveness * (1 - meetingPoint)),
    performanceBonus: Math.max(playerOffer.performanceBonus, Math.round(wantedSalary * 0.1)),
    contractLength: candidate.contractPreference,
    buyoutClause: playerOffer.buyoutClause || Math.round(wantedSalary * 3)
  }
}

/**
 * Process a negotiation round
 */
export function processNegotiationRound(
  negotiation: StaffNegotiation,
  candidate: StaffCandidate,
  playerOffer: StaffContractOffer
): StaffNegotiation {
  const evaluation = evaluateOffer(candidate, playerOffer)
  
  // Update negotiation state
  const updatedNegotiation = {
    ...negotiation,
    playerOffer,
    negotiationRounds: negotiation.negotiationRounds + 1
  }
  
  // Determine mood based on satisfaction trend
  if (evaluation.satisfaction >= 70) {
    updatedNegotiation.mood = 'positive'
  } else if (evaluation.satisfaction >= 40) {
    updatedNegotiation.mood = 'neutral'
  } else {
    updatedNegotiation.mood = 'negative'
  }
  
  // Check for immediate acceptance (very good offer)
  if (evaluation.acceptanceChance > 0.85 || 
      (evaluation.satisfaction >= 75 && negotiation.negotiationRounds >= 1)) {
    updatedNegotiation.stage = 'accepted'
    return updatedNegotiation
  }
  
  // Check for rejection (terrible offer or too many rounds)
  if (evaluation.satisfaction < 25 || negotiation.negotiationRounds >= negotiation.maxRounds) {
    if (evaluation.satisfaction < 35) {
      updatedNegotiation.stage = 'rejected'
      return updatedNegotiation
    }
    // Final round - take it or leave it
    updatedNegotiation.stage = 'final'
    return updatedNegotiation
  }
  
  // Generate counter-offer
  updatedNegotiation.candidateCounter = generateCounterOffer(
    candidate,
    playerOffer,
    negotiation.negotiationRounds
  )
  updatedNegotiation.stage = 'counter'
  
  return updatedNegotiation
}

/**
 * Create initial negotiation state
 */
export function initiateNegotiation(
  candidate: StaffCandidate,
  initialOffer: StaffContractOffer,
  currentWeek: number
): StaffNegotiation {
  return {
    id: `neg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    candidateId: candidate.id,
    candidateName: candidate.name,
    stage: 'initial',
    playerOffer: initialOffer,
    negotiationRounds: 0,
    maxRounds: 3,
    mood: 'neutral',
    startedWeek: currentWeek,
    expiresWeek: currentWeek + 2  // 2 weeks to complete negotiation
  }
}

// ============================================
// IMPACT CALCULATION
// ============================================

/**
 * Calculate the full impact preview for a candidate
 */
export function calculateCandidateImpact(
  candidate: StaffCandidate,
  existingStaff: TeamStaff[],
  _currentTeamMorale: number
): StaffImpactPreview {
  // Development bonuses based on skills and specializations
  const developmentBonus = {
    aero: 0,
    chassis: 0,
    engine: 0,
    sim: 0,
    manufacturing: 0,
    marketing: 0
  }
  
  // Base skill contribution (0-20% based on average skill)
  const avgSkill = (candidate.skills.reliability + candidate.skills.strategy + candidate.skills.pit) / 3
  const baseDevBonus = (avgSkill / 100) * 0.2
  
  // Role-specific facility bonuses
  if (candidate.role === 'chief_engineer') {
    developmentBonus.chassis = baseDevBonus
    developmentBonus.engine = baseDevBonus * 0.8
    developmentBonus.aero = baseDevBonus * 0.6
  } else if (candidate.role === 'technical_director') {
    developmentBonus.aero = baseDevBonus
    developmentBonus.chassis = baseDevBonus
    developmentBonus.engine = baseDevBonus
    developmentBonus.sim = baseDevBonus * 0.5
  } else if (candidate.role === 'strategist') {
    developmentBonus.sim = baseDevBonus
  } else if (candidate.role === 'team_manager') {
    developmentBonus.manufacturing = baseDevBonus * 0.5
  } else if (candidate.role === 'pr_manager') {
    developmentBonus.marketing = baseDevBonus
  } else if (candidate.role === 'crew_chief') {
    // Crew Chief: Pit operations and reliability focus
    developmentBonus.manufacturing = baseDevBonus * 0.8  // Part quality improvement
  } else if (candidate.role === 'data_engineer') {
    // Data Engineer: Simulation and setup optimization focus
    developmentBonus.sim = baseDevBonus * 1.2  // Primary sim improvement
    developmentBonus.aero = baseDevBonus * 0.4  // Data insights help aero
  } else if (candidate.role === 'reserve_driver') {
    developmentBonus.sim = baseDevBonus * 0.6  // Simulator work
  }
  
  // Specialization bonuses
  for (const specId of candidate.specializations) {
    const spec = STAFF_SPECIALIZATIONS[specId]
    if (spec.primaryEffect.type === 'development') {
      if (spec.primaryEffect.target === 'aero_rd_speed') {
        developmentBonus.aero += spec.primaryEffect.value
      } else if (spec.primaryEffect.target === 'sim_effectiveness') {
        developmentBonus.sim += spec.secondaryEffect?.value || 0
      }
    }
  }
  
  // Race performance bonuses
  const racePerformance = {
    pitStopBonus: 0,
    strategyBonus: 0,
    reliabilityBonus: 0,
    tireManagement: 0
  }
  
  // Skill-based race bonuses
  racePerformance.strategyBonus = (candidate.skills.strategy / 100) * 0.1
  racePerformance.pitStopBonus = (candidate.skills.pit / 100) * 0.05
  racePerformance.reliabilityBonus = (candidate.skills.reliability / 100) * 0.08
  
  // Role-specific race performance bonuses
  if (candidate.role === 'crew_chief') {
    // Crew Chief significantly improves pit stops and reliability
    racePerformance.pitStopBonus += (candidate.skills.pit / 100) * 0.12
    racePerformance.reliabilityBonus += (candidate.skills.reliability / 100) * 0.10
  } else if (candidate.role === 'data_engineer') {
    // Data Engineer improves strategy through data insights
    racePerformance.strategyBonus += (candidate.skills.strategy / 100) * 0.06
  }
  
  // Specialization race bonuses
  for (const specId of candidate.specializations) {
    const spec = STAFF_SPECIALIZATIONS[specId]
    if (spec.primaryEffect.type === 'race') {
      switch (spec.primaryEffect.target) {
        case 'pit_stop_time':
          racePerformance.pitStopBonus += Math.abs(spec.primaryEffect.value)
          break
        case 'tire_management':
          racePerformance.tireManagement += spec.primaryEffect.value
          break
        case 'mechanical_failures':
          racePerformance.reliabilityBonus += Math.abs(spec.primaryEffect.value)
          break
        case 'race_strategy':
          racePerformance.strategyBonus += spec.primaryEffect.value
          break
      }
    }
  }
  
  // Team impact
  const teamImpact = {
    moraleBonus: 0,
    chemistryScore: 50,  // Neutral baseline
    budgetImpact: 0
  }
  
  // Morale from motivator trait
  if (candidate.specializations.includes('motivator')) {
    teamImpact.moraleBonus = 5
  }
  
  // Calculate chemistry with existing staff
  let chemistryTotal = 0
  let chemistryCount = 0
  for (const staff of existingStaff) {
    if (staff.personality) {
      const chemistry = checkPersonalityChemistry(candidate.personality, staff.personality)
      if (chemistry === 'positive') chemistryTotal += 20
      else if (chemistry === 'negative') chemistryTotal -= 15
      chemistryCount++
    }
  }
  if (chemistryCount > 0) {
    teamImpact.chemistryScore = 50 + (chemistryTotal / chemistryCount)
  }
  
  // Budget impact (annual cost)
  teamImpact.budgetImpact = (candidate.salaryExpectation * 12) + 
    (ROLE_SALARY_RANGES[candidate.role].signingBonusRange[0] + 
     ROLE_SALARY_RANGES[candidate.role].signingBonusRange[1]) / 2
  
  return {
    developmentBonus,
    racePerformance,
    teamImpact
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  STAFF_SPECIALIZATIONS,
  STAFF_PERSONALITIES,
  ROLE_SALARY_RANGES
} from '@/data/staff-traits'
