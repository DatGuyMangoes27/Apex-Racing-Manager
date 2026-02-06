/**
 * Race Readiness Score Calculator
 * 
 * Aggregates multiple factors into a single 0-100 score that tells
 * the player how prepared they are for the upcoming race. This gives
 * players a clear weekly target: "Get my Race Readiness from 62 to 80."
 * 
 * Factors:
 * - Fatigue (inverted — lower fatigue = higher readiness)
 * - Fitness
 * - Confidence
 * - Stress (inverted)
 * - Car Condition (average part wear, inverted)
 * - Team Development
 * - Recent Form (last 3 races)
 */

export interface RaceReadinessBreakdown {
  fatigue: { score: number; label: string; weight: number }
  fitness: { score: number; label: string; weight: number }
  confidence: { score: number; label: string; weight: number }
  stress: { score: number; label: string; weight: number }
  carCondition: { score: number; label: string; weight: number }
  teamDevelopment: { score: number; label: string; weight: number }
  recentForm: { score: number; label: string; weight: number }
}

export interface RaceReadinessResult {
  score: number                        // 0-100 composite score
  rating: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
  color: string                        // Tailwind color class
  breakdown: RaceReadinessBreakdown
  advice: string                       // Brief tip for improvement
}

interface RaceReadinessInput {
  fatigue: number        // 0-100 (lower is better)
  fitness: number        // 0-100 (higher is better)
  confidence: number     // 0-100 (higher is better)
  stress: number         // 0-100 (lower is better)
  avgPartWear: number    // 0-100 (lower is better)
  teamDevPoints: number  // 0-100 (higher is better)
  recentPositions: number[]  // Last 3 race positions (lower is better)
  totalParticipants: number  // Grid size for normalizing positions
}

const WEIGHTS = {
  fatigue: 0.25,
  fitness: 0.15,
  confidence: 0.10,
  stress: 0.15,
  carCondition: 0.15,
  teamDevelopment: 0.10,
  recentForm: 0.10,
}

export function calculateRaceReadiness(input: RaceReadinessInput): RaceReadinessResult {
  const breakdown: RaceReadinessBreakdown = {
    fatigue: {
      score: Math.max(0, Math.min(100, 100 - input.fatigue)),
      label: input.fatigue >= 80 ? 'Exhausted' : input.fatigue >= 50 ? 'Tired' : input.fatigue >= 25 ? 'Fresh' : 'Well Rested',
      weight: WEIGHTS.fatigue,
    },
    fitness: {
      score: Math.max(0, Math.min(100, input.fitness)),
      label: input.fitness >= 80 ? 'Peak' : input.fitness >= 60 ? 'Good' : input.fitness >= 40 ? 'Average' : 'Unfit',
      weight: WEIGHTS.fitness,
    },
    confidence: {
      score: Math.max(0, Math.min(100, input.confidence)),
      label: input.confidence >= 70 ? 'High' : input.confidence >= 40 ? 'Steady' : 'Low',
      weight: WEIGHTS.confidence,
    },
    stress: {
      score: Math.max(0, Math.min(100, 100 - input.stress)),
      label: input.stress >= 70 ? 'Overwhelmed' : input.stress >= 40 ? 'Under Pressure' : 'Calm',
      weight: WEIGHTS.stress,
    },
    carCondition: {
      score: Math.max(0, Math.min(100, 100 - input.avgPartWear)),
      label: input.avgPartWear < 20 ? 'Excellent' : input.avgPartWear < 40 ? 'Good' : input.avgPartWear < 65 ? 'Worn' : 'Critical',
      weight: WEIGHTS.carCondition,
    },
    teamDevelopment: {
      score: Math.max(0, Math.min(100, input.teamDevPoints)),
      label: input.teamDevPoints >= 70 ? 'Advanced' : input.teamDevPoints >= 40 ? 'Developing' : 'Basic',
      weight: WEIGHTS.teamDevelopment,
    },
    recentForm: {
      score: calculateFormScore(input.recentPositions, input.totalParticipants),
      label: getFormLabel(input.recentPositions, input.totalParticipants),
      weight: WEIGHTS.recentForm,
    },
  }

  // Calculate weighted composite score
  const score = Math.round(
    breakdown.fatigue.score * breakdown.fatigue.weight +
    breakdown.fitness.score * breakdown.fitness.weight +
    breakdown.confidence.score * breakdown.confidence.weight +
    breakdown.stress.score * breakdown.stress.weight +
    breakdown.carCondition.score * breakdown.carCondition.weight +
    breakdown.teamDevelopment.score * breakdown.teamDevelopment.weight +
    breakdown.recentForm.score * breakdown.recentForm.weight
  )

  const rating = score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : score >= 35 ? 'poor' : 'critical'
  const color = score >= 80 ? 'text-status-success' : score >= 65 ? 'text-green-400' : score >= 50 ? 'text-accent-orange' : score >= 35 ? 'text-orange-500' : 'text-status-error'

  // Generate improvement advice
  const advice = generateAdvice(breakdown)

  return { score, rating, color, breakdown, advice }
}

function calculateFormScore(positions: number[], gridSize: number): number {
  if (positions.length === 0) return 50 // Neutral if no races
  
  const grid = Math.max(gridSize, 10)
  // Convert positions to normalized scores (P1 = 100, last = 0)
  const scores = positions.map(pos => {
    if (pos <= 0) return 50
    return Math.max(0, Math.min(100, ((grid - pos) / (grid - 1)) * 100))
  })
  
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function getFormLabel(positions: number[], gridSize: number): string {
  const score = calculateFormScore(positions, gridSize)
  if (positions.length === 0) return 'No Data'
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Strong'
  if (score >= 40) return 'Mixed'
  return 'Poor'
}

function generateAdvice(breakdown: RaceReadinessBreakdown): string {
  // Find the lowest-scoring factor with highest weight (biggest opportunity)
  const factors = Object.entries(breakdown) as [keyof RaceReadinessBreakdown, RaceReadinessBreakdown[keyof RaceReadinessBreakdown]][]
  const worstFactor = factors
    .sort((a, b) => (a[1].score * a[1].weight) - (b[1].score * b[1].weight))[0]

  switch (worstFactor[0]) {
    case 'fatigue':
      return 'Fatigue is your biggest concern — prioritize rest and recovery.'
    case 'fitness':
      return 'Your fitness could be better — consider a training session.'
    case 'confidence':
      return 'Confidence is low — a sim session or positive results would help.'
    case 'stress':
      return 'Stress levels are high — take time for personal activities.'
    case 'carCondition':
      return 'Your car needs attention — check part wear and repair if needed.'
    case 'teamDevelopment':
      return 'Team development is lagging — invest in R&D when possible.'
    case 'recentForm':
      return 'Recent results have been tough — focus on race preparation.'
    default:
      return 'You\'re well-prepared for the race!'
  }
}
