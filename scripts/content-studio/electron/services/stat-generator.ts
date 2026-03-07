/**
 * Deterministic stat/trait generation using seeded random.
 * Given a seed string, always produces the same output.
 */

// Simple seeded PRNG (mulberry32)
function seedRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h |= 0; h = h + 0x6D2B79F5 | 0
    let t = Math.imul(h ^ h >>> 15, 1 | h)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, n)
}

function range(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min)
}

function intRange(min: number, max: number, rng: () => number): number {
  return Math.floor(range(min, max + 1, rng))
}

// ============================================================
// Driver stats
// ============================================================

const DRIVER_PERSONALITIES = ['aggressive', 'calculating', 'steady', 'flashy', 'defensive', 'inconsistent'] as const

export function generateDriverStats(driverId: string, age: number, existingPersonality?: string) {
  const rng = seedRandom(driverId + '-stats')

  const personality = existingPersonality || pick([...DRIVER_PERSONALITIES], rng)

  // Career stage from age
  let careerStage: string
  if (age < 22) careerStage = 'rising'
  else if (age < 28) careerStage = rng() > 0.3 ? 'rising' : 'peak'
  else if (age < 34) careerStage = 'peak'
  else if (age < 38) careerStage = rng() > 0.5 ? 'declining' : 'peak'
  else careerStage = 'veteran'

  // Base skill varies with career stage
  const skillRanges: Record<string, [number, number]> = {
    'rising': [0.40, 0.65],
    'peak': [0.55, 0.80],
    'declining': [0.45, 0.70],
    'veteran': [0.35, 0.60],
  }
  const [minSkill, maxSkill] = skillRanges[careerStage] || [0.4, 0.7]
  const baseSkill = range(minSkill, maxSkill, rng)

  // Individual stats influenced by personality
  const personalityMods: Record<string, Partial<Record<string, number>>> = {
    aggressive: { aggression: 0.1, defending: -0.05, consistency: -0.05 },
    calculating: { consistency: 0.08, tireManagement: 0.06, aggression: -0.05 },
    steady: { consistency: 0.1, defending: 0.05, startReactions: -0.05 },
    flashy: { qualifyingSkill: 0.08, startReactions: 0.06, consistency: -0.08 },
    defensive: { defending: 0.1, tireManagement: 0.05, aggression: -0.08 },
    inconsistent: { startReactions: 0.05, aggression: 0.05, consistency: -0.12 },
  }

  const mods = personalityMods[personality] || {}

  const stat = (key: string) => {
    const base = baseSkill + range(-0.1, 0.1, rng)
    const mod = mods[key] || 0
    return Math.max(0.1, Math.min(0.99, base + mod))
  }

  const stats = {
    raceSkill: stat('raceSkill'),
    qualifyingSkill: stat('qualifyingSkill'),
    aggression: stat('aggression'),
    defending: stat('defending'),
    consistency: stat('consistency'),
    wetSkill: stat('wetSkill'),
    tireManagement: stat('tireManagement'),
    fuelManagement: stat('fuelManagement'),
    stamina: stat('stamina'),
    startReactions: stat('startReactions'),
  }

  const peakAge = intRange(25, 33, rng)
  const declineRate = range(0.01, 0.03, rng)
  const developmentRate = age < 25 ? range(0.015, 0.035, rng) : range(0.005, 0.015, rng)
  const marketValue = Math.round(baseSkill * 1000000 * range(0.8, 1.2, rng))
  const reputation = Math.round(baseSkill * 100 * range(0.8, 1.2, rng))
  const salary = Math.round(baseSkill * 50000 * range(0.5, 1.5, rng))

  const dob = `${2026 - age}-${String(intRange(1, 12, rng)).padStart(2, '0')}-${String(intRange(1, 28, rng)).padStart(2, '0')}`

  return {
    personality,
    careerStage,
    baseSkill: Math.round(baseSkill * 1000) / 1000,
    stats,
    peakAge,
    declineRate: Math.round(declineRate * 1000) / 1000,
    developmentRate: Math.round(developmentRate * 1000) / 1000,
    marketValue,
    reputation,
    salary,
    dateOfBirth: dob,
  }
}

// ============================================================
// Staff skills
// ============================================================

const STAFF_TRAITS = [
  'perfectionist', 'fast_worker', 'team_player', 'lone_wolf', 'innovator',
  'reliable', 'ambitious', 'loyal', 'mentor', 'experienced',
  'methodical', 'creative', 'detail_oriented', 'big_picture', 'calm_under_pressure'
]

const STAFF_PERSONALITIES = ['ambitious', 'loyal', 'demanding', 'flexible', 'visionary', 'pragmatic'] as const

export function generateStaffSkills(staffId: string, role: string, tier: string = 'mid') {
  const rng = seedRandom(staffId + '-skills')

  const tierRanges: Record<string, [number, number]> = {
    low: [20, 50],
    mid: [40, 70],
    high: [60, 90],
    elite: [75, 95],
  }
  const [minSkill, maxSkill] = tierRanges[tier] || tierRanges.mid

  const skills = {
    technical: intRange(minSkill, maxSkill, rng),
    management: intRange(minSkill, maxSkill, rng),
    innovation: intRange(minSkill, maxSkill, rng),
    reliability: intRange(minSkill, maxSkill, rng),
    communication: intRange(minSkill, maxSkill, rng),
  }

  const personality = pick([...STAFF_PERSONALITIES], rng)
  const traits = pickN(STAFF_TRAITS, intRange(1, 3, rng), rng)
  const experience = intRange(1, 25, rng)
  const reputation = intRange(minSkill - 10, maxSkill + 10, rng)
  const baseSalary = { low: 3000, mid: 6000, high: 10000, elite: 15000 }
  const salary = Math.round((baseSalary[tier as keyof typeof baseSalary] || 6000) * range(0.7, 1.3, rng))
  const contractYears = intRange(1, 3, rng)

  return { skills, personality, traits, experience, reputation, salary, contractYears }
}

// ============================================================
// Partner traits & desires
// ============================================================

const PARTNER_TRAITS = [
  'supportive', 'ambitious', 'social_butterfly', 'private', 'glamorous', 'practical',
  'nurturing', 'adventurous', 'racing_enthusiast', 'high_maintenance', 'independent',
  'jealous', 'materialistic', 'controlling', 'secretive', 'workaholic', 'dramatic',
  'possessive', 'party_animal', 'commitment_phobic', 'passive_aggressive', 'self_centered',
  'generous', 'optimistic', 'empathetic',
]

const PARTNER_CAREERS = [
  'model', 'athlete', 'business_exec', 'doctor', 'lawyer', 'entrepreneur',
  'artist', 'journalist', 'scientist', 'socialite', 'racing_driver', 'engineer', 'team_staff', 'none'
]

const CAREER_INCOMES: Record<string, number> = {
  model: 15000, athlete: 25000, business_exec: 30000, doctor: 20000, lawyer: 25000,
  entrepreneur: 35000, artist: 8000, journalist: 10000, scientist: 12000, socialite: 5000,
  racing_driver: 50000, engineer: 15000, team_staff: 8000, none: 0,
}

const STYLES = ['elegant', 'casual', 'sporty', 'glamorous', 'bohemian', 'professional']
const EDUCATION_LEVELS = ['self-taught', 'undergraduate', 'postgraduate', 'PhD', 'trades'] as const
const WEALTH_LEVELS = ['modest', 'comfortable', 'wealthy', 'ultra_wealthy'] as const
const SOCIAL_CIRCLES = ['racing_world', 'high_society', 'creative_scene', 'tech_world', 'sports_world', 'academic', 'entertainment', 'business_world'] as const

export function generatePartnerTraits(partnerId: string) {
  const rng = seedRandom(partnerId + '-traits')

  const career = pick(PARTNER_CAREERS, rng)
  const careerIncome = Math.round(CAREER_INCOMES[career] * range(0.7, 1.3, rng))
  const traits = pickN(PARTNER_TRAITS, intRange(2, 3, rng), rng)
  const style = pick(STYLES, rng)

  const hasMaterialistic = traits.includes('materialistic') || traits.includes('glamorous')
  const hasAmbitious = traits.includes('ambitious')

  const desires = {
    wantsChildren: rng() > 0.3,
    desiredChildrenCount: intRange(0, 3, rng),
    wantsMarriage: !traits.includes('commitment_phobic') && rng() > 0.2,
    lifestyleExpectations: hasMaterialistic ? pick(['luxury', 'ultra_luxury'] as const, rng)
      : hasAmbitious ? pick(['affluent', 'luxury'] as const, rng)
      : pick(['modest', 'comfortable', 'affluent'] as const, rng),
    qualityTimeImportance: intRange(30, 90, rng),
    careerSupportImportance: intRange(20, 80, rng),
    socialLifeImportance: traits.includes('social_butterfly') ? intRange(70, 95, rng) : intRange(20, 70, rng),
    privacyImportance: traits.includes('private') ? intRange(70, 95, rng) : intRange(20, 60, rng),
  }

  // Derive enrichment fields from career
  const educationLevel = deriveEducation(career, rng)
  const wealthLevel = deriveWealth(career, careerIncome, rng)
  const socialCircle = deriveSocialCircle(career, rng)

  return { career, careerIncome, traits, style, desires, educationLevel, wealthLevel, socialCircle }
}

// ============================================================
// Contact traits & interests
// ============================================================

const POSITIVE_TRAITS = ['supportive', 'ambitious', 'romantic', 'adventurous', 'intellectual', 'caring', 'humorous', 'sophisticated', 'creative', 'confident', 'independent', 'passionate', 'loyal', 'spontaneous', 'thoughtful', 'charismatic', 'driven', 'compassionate', 'elegant', 'witty', 'generous', 'optimistic', 'empathetic', 'patient', 'reliable', 'humble', 'sincere', 'warm', 'disciplined', 'grateful', 'playful', 'open-minded', 'principled', 'nurturing', 'forgiving']
const NEGATIVE_TRAITS = ['materialistic', 'secretive', 'controlling', 'impulsive', 'arrogant', 'cynical', 'jealous', 'unreliable', 'dramatic', 'gossipy', 'workaholic', 'aloof', 'manipulative', 'vain', 'entitled', 'petty', 'passive-aggressive', 'judgmental', 'self-centered', 'impatient', 'reckless', 'dismissive', 'argumentative', 'condescending']
const COMPLEX_TRAITS = ['perfectionist', 'old-fashioned', 'restless', 'competitive', 'stubborn', 'sarcastic', 'intense', 'mysterious', 'reserved', 'idealistic', 'eccentric', 'blunt', 'calculating', 'overprotective', 'nostalgic', 'mischievous', 'rebellious', 'obsessive', 'opinionated', 'fiery']

const INTERESTS = [
  'Polo', 'Equestrian', 'Surfing', 'Scuba Diving', 'Boxing', 'Yoga', 'Marathon Running', 'Cycling', 'Climbing', 'Martial Arts', 'Fencing', 'Cricket', 'Rugby', 'Snowboarding',
  'Opera', 'Ballet', 'Cinema', 'History', 'Philosophy', 'Languages', 'Antiques', 'Poetry', 'Classical Music', 'Jazz', 'Contemporary Dance',
  'Gardening', 'Gaming', 'Astronomy', 'Meditation', 'Volunteering', 'Podcasts', 'Collecting Watches', 'Coffee Culture', 'Craft Beer', 'Whiskey', 'Interior Design', 'Sustainable Living', 'Vintage Cars', 'Drone Racing', 'Board Games',
  'Photography', 'Cooking', 'Wine Tasting', 'Travel', 'Architecture', 'Fashion', 'Technology', 'Art Collecting', 'Tennis', 'Golf', 'Sailing', 'Motorsport', 'Football', 'Basketball',
  'Reading', 'Writing', 'Music Production', 'Fitness', 'Hiking', 'Camping', 'Skiing', 'Swimming', 'Dancing', 'Theater', 'Painting', 'Sculpture',
]

export function generateContactTraits(contactId: string, contactType: string) {
  const rng = seedRandom(contactId + '-traits')

  // Weighted trait mix: 55% positive, 25% complex, 20% negative
  const traitCount = intRange(4, 5, rng)
  const traits: string[] = []
  for (let i = 0; i < traitCount; i++) {
    const roll = rng()
    if (roll < 0.55) traits.push(pick(POSITIVE_TRAITS, rng))
    else if (roll < 0.80) traits.push(pick(COMPLEX_TRAITS, rng))
    else traits.push(pick(NEGATIVE_TRAITS, rng))
  }
  // Deduplicate
  const uniqueTraits = [...new Set(traits)]

  const interests = pickN(INTERESTS, intRange(5, 7, rng), rng)
  const educationLevel = deriveEducationForContact(contactType, rng)
  const wealthLevel = deriveWealthForContact(contactType, rng)
  const socialCircle = deriveSocialCircleForContact(contactType, rng)

  return { traits: uniqueTraits, interests, educationLevel, wealthLevel, socialCircle }
}

// ============================================================
// Derived field helpers
// ============================================================

function deriveEducation(career: string, rng: () => number): typeof EDUCATION_LEVELS[number] {
  const map: Record<string, typeof EDUCATION_LEVELS[number][]> = {
    doctor: ['postgraduate', 'PhD'],
    lawyer: ['postgraduate'],
    scientist: ['PhD', 'postgraduate'],
    engineer: ['postgraduate', 'undergraduate'],
    business_exec: ['postgraduate', 'undergraduate'],
    journalist: ['undergraduate', 'postgraduate'],
    model: ['undergraduate', 'self-taught'],
    artist: ['undergraduate', 'self-taught', 'trades'],
    athlete: ['undergraduate', 'self-taught'],
    entrepreneur: ['undergraduate', 'self-taught', 'postgraduate'],
    socialite: ['undergraduate', 'self-taught'],
    racing_driver: ['self-taught', 'undergraduate'],
    team_staff: ['undergraduate', 'trades'],
    none: ['self-taught', 'undergraduate'],
  }
  return pick(map[career] || ['undergraduate'], rng)
}

function deriveWealth(career: string, income: number, rng: () => number): typeof WEALTH_LEVELS[number] {
  if (income > 30000) return rng() > 0.3 ? 'wealthy' : 'ultra_wealthy'
  if (income > 15000) return rng() > 0.4 ? 'wealthy' : 'comfortable'
  if (income > 8000) return 'comfortable'
  return rng() > 0.5 ? 'comfortable' : 'modest'
}

function deriveSocialCircle(career: string, rng: () => number): typeof SOCIAL_CIRCLES[number] {
  const map: Record<string, typeof SOCIAL_CIRCLES[number][]> = {
    racing_driver: ['racing_world', 'sports_world'],
    engineer: ['racing_world', 'tech_world'],
    team_staff: ['racing_world'],
    journalist: ['entertainment', 'racing_world'],
    model: ['high_society', 'entertainment'],
    athlete: ['sports_world'],
    business_exec: ['business_world', 'high_society'],
    doctor: ['academic'],
    lawyer: ['business_world'],
    scientist: ['academic', 'tech_world'],
    entrepreneur: ['business_world', 'tech_world'],
    artist: ['creative_scene'],
    socialite: ['high_society', 'entertainment'],
    none: ['racing_world'],
  }
  return pick(map[career] || ['business_world'], rng)
}

function deriveEducationForContact(type: string, rng: () => number): typeof EDUCATION_LEVELS[number] {
  const map: Record<string, typeof EDUCATION_LEVELS[number][]> = {
    professor: ['PhD'],
    doctor: ['PhD', 'postgraduate'],
    lawyer: ['postgraduate'],
    diplomat: ['postgraduate'],
    tech_entrepreneur: ['postgraduate', 'undergraduate', 'self-taught'],
    architect: ['postgraduate'],
    journalist: ['undergraduate', 'postgraduate'],
    military_officer: ['undergraduate', 'postgraduate'],
    chef: ['trades', 'self-taught'],
    artist: ['undergraduate', 'self-taught'],
    pilot: ['undergraduate'],
    yacht_captain: ['trades', 'undergraduate'],
  }
  return pick(map[type] || ['undergraduate', 'self-taught'], rng)
}

function deriveWealthForContact(type: string, rng: () => number): typeof WEALTH_LEVELS[number] {
  const map: Record<string, typeof WEALTH_LEVELS[number][]> = {
    business_mogul: ['ultra_wealthy'],
    celebrity: ['wealthy', 'ultra_wealthy'],
    philanthropist: ['ultra_wealthy'],
    tech_entrepreneur: ['wealthy', 'ultra_wealthy'],
    banker: ['wealthy', 'ultra_wealthy'],
    politician: ['comfortable', 'wealthy'],
    athlete: ['wealthy'],
    actor: ['wealthy'],
    film_director: ['wealthy'],
    fashion_designer: ['comfortable', 'wealthy'],
    diplomat: ['wealthy'],
    agent: ['wealthy'],
    sponsor_exec: ['wealthy'],
    lawyer: ['wealthy'],
    doctor: ['wealthy'],
    architect: ['comfortable', 'wealthy'],
    musician: ['comfortable', 'wealthy'],
    influencer: ['comfortable', 'wealthy'],
    journalist: ['comfortable'],
    professor: ['modest', 'comfortable'],
    chef: ['comfortable'],
    artist: ['modest', 'comfortable'],
    pilot: ['comfortable', 'wealthy'],
    yacht_captain: ['comfortable'],
    military_officer: ['comfortable'],
  }
  return pick(map[type] || ['comfortable'], rng)
}

function deriveSocialCircleForContact(type: string, rng: () => number): typeof SOCIAL_CIRCLES[number] {
  const map: Record<string, typeof SOCIAL_CIRCLES[number][]> = {
    actor: ['entertainment'],
    musician: ['creative_scene', 'entertainment'],
    athlete: ['sports_world'],
    politician: ['business_world'],
    celebrity: ['entertainment', 'high_society'],
    business_mogul: ['business_world'],
    agent: ['business_world', 'entertainment'],
    lawyer: ['business_world'],
    banker: ['business_world'],
    sponsor_exec: ['racing_world', 'business_world'],
    tech_entrepreneur: ['tech_world'],
    fashion_designer: ['creative_scene', 'high_society'],
    film_director: ['entertainment', 'creative_scene'],
    chef: ['creative_scene'],
    professor: ['academic'],
    military_officer: ['business_world'],
    diplomat: ['high_society'],
    influencer: ['entertainment'],
    philanthropist: ['high_society'],
    doctor: ['academic'],
    architect: ['creative_scene'],
    journalist: ['entertainment'],
    artist: ['creative_scene'],
    pilot: ['sports_world'],
    yacht_captain: ['high_society'],
  }
  return pick(map[type] || ['business_world'], rng)
}
