// Rival AI simulation system
import { RivalDriver, Series, Personality, RivalStats } from '@/store/rivalStore'
import { TeamTier } from '@/data/ams2-teams-real'

// First names by region
const FIRST_NAMES: Record<string, string[]> = {
  Brazil: ['Lucas', 'Gabriel', 'Pedro', 'Rafael', 'Bruno', 'Felipe', 'Carlos', 'Diego', 'Marcos', 'André'],
  UK: ['James', 'Oliver', 'George', 'Harry', 'Jack', 'William', 'Thomas', 'Charlie', 'Oscar', 'Henry'],
  Germany: ['Max', 'Leon', 'Paul', 'Felix', 'Lukas', 'Jonas', 'Tim', 'Niklas', 'Florian', 'Sebastian'],
  Italy: ['Marco', 'Luca', 'Alessandro', 'Andrea', 'Francesco', 'Lorenzo', 'Matteo', 'Davide', 'Simone', 'Fabio'],
  Spain: ['Carlos', 'Pablo', 'Diego', 'Alejandro', 'Daniel', 'Fernando', 'Sergio', 'Javier', 'Miguel', 'Adrián'],
  France: ['Lucas', 'Hugo', 'Louis', 'Raphaël', 'Jules', 'Arthur', 'Pierre', 'Maxime', 'Antoine', 'Théo'],
  Netherlands: ['Daan', 'Bram', 'Luuk', 'Sem', 'Finn', 'Jesse', 'Milan', 'Ruben', 'Thijs', 'Max'],
  Australia: ['Jack', 'Oliver', 'William', 'Noah', 'Thomas', 'James', 'Lucas', 'Henry', 'Ethan', 'Alexander'],
  USA: ['James', 'Robert', 'John', 'Michael', 'William', 'David', 'Joseph', 'Charles', 'Daniel', 'Matthew'],
  Japan: ['Yuki', 'Hiroto', 'Ren', 'Sota', 'Haruto', 'Yuto', 'Kento', 'Riku', 'Takumi', 'Kaito'],
}

// Last names by region
const LAST_NAMES: Record<string, string[]> = {
  Brazil: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Almeida', 'Rodrigues', 'Martins'],
  UK: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson'],
  Germany: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
  Italy: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
  Spain: ['García', 'Martínez', 'López', 'Sánchez', 'González', 'Rodríguez', 'Fernández', 'Pérez', 'Gómez', 'Díaz'],
  France: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'],
  Netherlands: ['de Jong', 'de Vries', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'Mulder', 'Bos'],
  Australia: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'Anderson', 'Thomas', 'Harris'],
  USA: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
  Japan: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
}

const NATIONALITIES = Object.keys(FIRST_NAMES)
const PERSONALITIES: Personality[] = ['aggressive', 'calculating', 'inconsistent', 'steady', 'flashy', 'defensive']

// Generate a random rival driver
export function generateRivalDriver(
  seriesId: string,
  teamId: string,
  age?: number
): RivalDriver {
  const nationality = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)]
  const firstName = FIRST_NAMES[nationality][Math.floor(Math.random() * FIRST_NAMES[nationality].length)]
  const lastName = LAST_NAMES[nationality][Math.floor(Math.random() * LAST_NAMES[nationality].length)]
  const driverAge = age ?? 18 + Math.floor(Math.random() * 20)
  const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]
  
  // Base skill varies by age - younger drivers have potential, older have experience
  const experienceBonus = Math.min(0.2, (driverAge - 18) * 0.015)
  const baseSkill = 0.4 + Math.random() * 0.4 + experienceBonus
  
  const stats = generateStatsForPersonality(personality, baseSkill)
  
  // Determine career stage based on age
  const careerStage: CareerStage = 
    driverAge < 23 ? 'rising' :
    driverAge < 32 ? 'peak' :
    driverAge < 38 ? 'declining' : 'veteran'
  
  return {
    id: `rival_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    firstName,
    lastName,
    nationality,
    age: driverAge,
    dateOfBirth: new Date(new Date().getFullYear() - driverAge, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    personality,
    stats,
    peakAge: 25 + Math.floor(Math.random() * 8),
    declineRate: 0.01 + Math.random() * 0.02,
    currentTeamId: teamId,
    currentSeriesId: seriesId,
    contractEndYear: new Date().getFullYear() + 1 + Math.floor(Math.random() * 3),
    salary: Math.floor(Math.random() * 50000),
    marketValue: Math.floor(baseSkill * 1000000),
    reputation: Math.floor(baseSkill * 100),
    totalRaces: 0,
    totalWins: 0,
    totalPodiums: 0,
    championships: 0,
    careerActive: true,
    relationshipWithPlayer: 0,
    rivalryIntensity: 0,
    // New persistent skill system fields
    baseSkill,
    currentForm: 0,
    formStreak: 0,
    developmentRate: careerStage === 'rising' ? 0.01 + Math.random() * 0.02 : 0,
    careerStage,
    seasonStats: {
      wins: 0,
      podiums: 0,
      points: 0,
      races: 0,
      avgFinish: 0,
      bestFinish: 99,
      dnfs: 0
    },
    trackAffinities: {},
    lastRacePosition: 10,
    weekendForm: 0
  }
}

type CareerStage = 'rising' | 'peak' | 'declining' | 'veteran'

// Generate stats based on personality
function generateStatsForPersonality(personality: Personality, baseSkill: number): RivalStats {
  const variance = 0.15
  const v = () => (Math.random() - 0.5) * variance
  
  const base: RivalStats = {
    raceSkill: clamp(baseSkill + v()),
    qualifyingSkill: clamp(baseSkill + v()),
    aggression: Math.random(),
    defending: clamp(baseSkill + v()),
    consistency: clamp(baseSkill + v()),
    wetSkill: clamp(baseSkill + v() * 2),
    tireManagement: clamp(baseSkill + v()),
    fuelManagement: clamp(baseSkill + v()),
    stamina: clamp(baseSkill + v()),
    startReactions: Math.random()
  }
  
  // Apply personality modifiers
  switch (personality) {
    case 'aggressive':
      base.aggression = clamp(0.7 + Math.random() * 0.3)
      base.defending = clamp(base.defending + 0.1)
      base.tireManagement = clamp(base.tireManagement - 0.1)
      break
    case 'calculating':
      base.consistency = clamp(base.consistency + 0.15)
      base.tireManagement = clamp(base.tireManagement + 0.1)
      base.aggression = clamp(0.3 + Math.random() * 0.3)
      break
    case 'inconsistent':
      base.consistency = clamp(base.consistency - 0.2)
      base.raceSkill = clamp(base.raceSkill + 0.1) // High peaks
      break
    case 'steady':
      base.consistency = clamp(base.consistency + 0.2)
      base.aggression = clamp(0.3 + Math.random() * 0.2)
      break
    case 'flashy':
      base.qualifyingSkill = clamp(base.qualifyingSkill + 0.15)
      base.startReactions = clamp(0.7 + Math.random() * 0.3)
      base.aggression = clamp(0.5 + Math.random() * 0.3)
      break
    case 'defensive':
      base.defending = clamp(base.defending + 0.2)
      base.aggression = clamp(0.1 + Math.random() * 0.3)
      base.tireManagement = clamp(base.tireManagement + 0.1)
      break
  }
  
  return base
}

// Age-based skill progression/decline
export function applyAgeProgression(rival: RivalDriver, currentYear: number): RivalDriver {
  const yearsActive = currentYear - (new Date(rival.dateOfBirth).getFullYear() + 18)
  const isPastPeak = rival.age > rival.peakAge
  
  let modifier = 0
  
  if (!isPastPeak) {
    // Still improving
    modifier = 0.01 * (1 - yearsActive / 10) // Slower improvement over time
  } else {
    // Declining
    const yearsPastPeak = rival.age - rival.peakAge
    modifier = -rival.declineRate * yearsPastPeak
  }
  
  // Apply modifier to relevant stats
  const newStats: RivalStats = {
    ...rival.stats,
    raceSkill: clamp(rival.stats.raceSkill + modifier),
    qualifyingSkill: clamp(rival.stats.qualifyingSkill + modifier),
    consistency: clamp(rival.stats.consistency + modifier * 0.5),
    stamina: clamp(rival.stats.stamina + modifier * 1.5) // Stamina declines faster
  }
  
  return {
    ...rival,
    age: rival.age + 1,
    stats: newStats
  }
}

// Simulate a season for a rival (without player)
export function simulateRivalSeason(rival: RivalDriver, series: Series): {
  wins: number
  podiums: number
  points: number
  averagePosition: number
} {
  const raceCount = series.calendar.length || 10
  let wins = 0
  let podiums = 0
  let totalPositions = 0
  
  for (let i = 0; i < raceCount; i++) {
    const position = simulateRacePosition(rival, series.tier)
    totalPositions += position
    
    if (position === 1) wins++
    if (position <= 3) podiums++
  }
  
  return {
    wins,
    podiums,
    points: calculateSeasonPoints(wins, podiums, raceCount),
    averagePosition: totalPositions / raceCount
  }
}

// Simulate a single race position for a rival
function simulateRacePosition(rival: RivalDriver, _seriesTier: TeamTier): number {
  const basePosition = 10 - (rival.stats.raceSkill * 8) // Skill maps to ~2-10
  const varianceFromConsistency = (1 - rival.stats.consistency) * 8
  const randomVariance = (Math.random() - 0.5) * varianceFromConsistency
  
  let position = Math.round(basePosition + randomVariance)
  position = Math.max(1, Math.min(20, position)) // Clamp 1-20
  
  return position
}

// Calculate championship points
function calculateSeasonPoints(wins: number, podiums: number, races: number): number {
  return wins * 25 + (podiums - wins) * 18 + Math.floor(races * 5)
}

// Check if rival should retire
export function shouldRivalRetire(rival: RivalDriver): boolean {
  if (rival.age < 35) return false
  if (rival.age > 45) return true
  
  // Chance increases with age
  const retirementChance = (rival.age - 35) * 0.1
  return Math.random() < retirementChance
}

// Generate a rookie to replace retired driver
export function generateRookie(seriesId: string, teamId: string): RivalDriver {
  return generateRivalDriver(seriesId, teamId, 18 + Math.floor(Math.random() * 4))
}

// Update rivalry intensity based on on-track incidents
export function updateRivalryIntensity(
  rival: RivalDriver,
  hadIncident: boolean,
  playerBeatRival: boolean
): RivalDriver {
  let intensityChange = 0
  let relationshipChange = 0
  
  if (hadIncident) {
    intensityChange += 15
    relationshipChange -= 10
  }
  
  if (playerBeatRival) {
    intensityChange += 2
    relationshipChange -= 1
  } else {
    intensityChange -= 1
    relationshipChange += 1
  }
  
  return {
    ...rival,
    rivalryIntensity: clamp(rival.rivalryIntensity + intensityChange, 0, 100),
    relationshipWithPlayer: Math.max(-100, Math.min(100, rival.relationshipWithPlayer + relationshipChange))
  }
}

// Helper to clamp values
function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

// Get rival's mood/behavior based on relationship
export function getRivalMood(rival: RivalDriver): 'friendly' | 'neutral' | 'hostile' | 'rival' {
  if (rival.rivalryIntensity > 70) return 'rival'
  if (rival.relationshipWithPlayer < -50) return 'hostile'
  if (rival.relationshipWithPlayer > 50) return 'friendly'
  return 'neutral'
}


