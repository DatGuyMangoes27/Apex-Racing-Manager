/**
 * AI Modifier System
 * 
 * Calculates modifiers that adjust AI opponent skill values in the XML files
 * based on player progression, condition, and perks.
 * 
 * Range: -3% to +3% (subtle but meaningful)
 * Negative = AI gets weaker (player advantage)
 * Positive = AI gets stronger (player disadvantage)
 */

import { PlayerDriver, RaceResult } from '@/store/careerStore';

const MILESTONE_EFFECTS: Record<string, {
  aiEffect: Array<{ stat: string; modifier: number }>;
  economicEffect: string
}> = {
  firstRaceCompleted: {
    aiEffect: [],
    economicEffect: 'Career started'
  },
  firstPointsFinish: {
    aiEffect: [{ stat: 'consistency', modifier: -0.001 }],
    economicEffect: '+2% sponsor bonuses'
  },
  firstPodium: {
    aiEffect: [{ stat: 'consistency', modifier: -0.002 }],
    economicEffect: '+5% sponsor bonuses'
  },
  firstWin: {
    aiEffect: [{ stat: 'raceSkill', modifier: -0.003 }],
    economicEffect: '+10% prize money'
  },
  firstPolePosition: {
    aiEffect: [{ stat: 'qualifyingSkill', modifier: -0.002 }],
    economicEffect: '+5% qualifying bonuses'
  },
  firstChampionship: {
    aiEffect: [{ stat: 'raceSkill', modifier: -0.005 }],
    economicEffect: '+15% contract salary'
  },
  races10: {
    aiEffect: [{ stat: 'defending', modifier: -0.002 }],
    economicEffect: '-1 AP training cost'
  },
  races25: {
    aiEffect: [{ stat: 'qualifyingSkill', modifier: -0.003 }],
    economicEffect: 'Unlock mid-tier sponsors'
  },
  races50: {
    aiEffect: [{ stat: 'consistency', modifier: -0.003 }],
    economicEffect: 'Unlock elite sponsors'
  },
  races100: {
    aiEffect: [
      { stat: 'raceSkill', modifier: -0.005 },
      { stat: 'qualifyingSkill', modifier: -0.005 },
      { stat: 'consistency', modifier: -0.005 }
    ],
    economicEffect: 'Legend status - permanent rep bonus'
  },
  wins5: {
    aiEffect: [{ stat: 'avoidanceOfMistakes', modifier: -0.002 }],
    economicEffect: '+5% rep gains'
  },
  wins10: {
    aiEffect: [{ stat: 'raceSkill', modifier: -0.002 }],
    economicEffect: '+10% rep gains'
  },
  wins25: {
    aiEffect: [{ stat: 'raceSkill', modifier: -0.003 }],
    economicEffect: '+15% rep gains'
  },
  championships3: {
    aiEffect: [{ stat: 'qualifyingSkill', modifier: -0.005 }],
    economicEffect: 'Legendary contract offers'
  },
  championships5: {
    aiEffect: [
      { stat: 'raceSkill', modifier: -0.005 },
      { stat: 'qualifyingSkill', modifier: -0.005 }
    ],
    economicEffect: 'Hall of Fame status'
  }
}

// Injury severity penalties (AI gets stronger when player is hurt)
const INJURY_PENALTIES: Record<InjuryState['severity'], number> = {
  none: 0,
  minor: 0.01,     // +1%
  moderate: 0.015, // +1.5%
  major: 0.02      // +2%
}

// Fatigue thresholds
const FATIGUE_PENALTY_THRESHOLD = 80  // Fatigue level above which penalty applies
const FATIGUE_PENALTY = 0.005         // +0.5%

// Pressure thresholds
const MENTAL_STRENGTH_LOW = 40        // Below this, pressure penalty applies
const PRESSURE_PENALTY = 0.005        // +0.5%

// Form bonus
const PODIUM_STREAK_THRESHOLD = 3     // Consecutive podiums needed for bonus
const FORM_BONUS = -0.003             // -0.3%

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Calculate the total AI modifier based on current RPG state
 */
export function calculateAIModifier(
  player: PlayerDriver,
  rpgState: RPGState
): AIModifierResult {
  const breakdown: AIModifierBreakdown = {
    teamDevelopment: 0,
    milestonePerks: 0,
    formBonus: 0,
    injuryPenalty: 0,
    fatiguePenalty: 0,
    pressurePenalty: 0,
    total: 0
  }

  // Return default if no valid state
  if (!rpgState || !player) {
    return {
      modifier: 0,
      breakdown,
      description: 'No RPG state available'
    }
  }

  // 1. Team Development Bonus (0 to -1.5%)
  // Higher development = bigger AI nerf
  const devProgress = (rpgState.teamDevelopment?.points ?? 0) / 100  // 0-1
  breakdown.teamDevelopment = devProgress * TEAM_DEV_MAX_BONUS

  // 2. Milestone Perks (cumulative)
  breakdown.milestonePerks = rpgState.milestones 
    ? calculateMilestonePerkModifier(rpgState.milestones)
    : 0

  // 3. Form Bonus (good recent results)
  if ((rpgState.recentPodiumStreak ?? 0) >= PODIUM_STREAK_THRESHOLD) {
    breakdown.formBonus = FORM_BONUS
  }

  // 4. Injury Penalty (AI gets stronger)
  const injurySeverity = rpgState.injury?.severity ?? 'none'
  breakdown.injuryPenalty = INJURY_PENALTIES[injurySeverity] ?? 0

  // 5. Fatigue Penalty
  if ((player.mentalState?.fatigue ?? 0) >= FATIGUE_PENALTY_THRESHOLD) {
    breakdown.fatiguePenalty = FATIGUE_PENALTY
  }

  // 6. Pressure Penalty (title fight with low mental strength)
  const inTitleFight = isInTitleFight(rpgState)
  if (inTitleFight && (player.stats?.mentalStrength ?? 100) < MENTAL_STRENGTH_LOW) {
    breakdown.pressurePenalty = PRESSURE_PENALTY
  }

  // Calculate total and clamp
  const rawTotal = 
    breakdown.teamDevelopment +
    breakdown.milestonePerks +
    breakdown.formBonus +
    breakdown.injuryPenalty +
    breakdown.fatiguePenalty +
    breakdown.pressurePenalty

  breakdown.total = clamp(rawTotal, MIN_MODIFIER, MAX_MODIFIER)

  // Generate description
  const description = generateModifierDescription(breakdown)

  return {
    modifier: breakdown.total,
    breakdown,
    description
  }
}

/**
 * Calculate cumulative modifier from unlocked milestone perks
 */
function calculateMilestonePerkModifier(milestones: MilestoneProgress): number {
  let total = 0

  for (const [key, unlocked] of Object.entries(milestones)) {
    if (unlocked) {
      const perk = MILESTONE_PERKS[key as keyof MilestoneProgress]
      if (perk?.aiEffect) {
        for (const effect of perk.aiEffect) {
          total += effect.modifier
        }
      }
    }
  }

  return total
}

/**
 * Check if player is in a title fight (close to leader, late in season)
 */
function isInTitleFight(rpgState: RPGState): boolean {
  if (!rpgState) return false
  if ((rpgState.roundsRemaining ?? 0) <= 0) return false
  if ((rpgState.championshipPosition ?? 0) === 0) return false
  
  // In title fight if:
  // - Within top 3 positions
  // - Less than 5 rounds remaining
  // - Points gap is realistic to close
  const inTop3 = (rpgState.championshipPosition ?? 99) <= 3
  const lateSeason = (rpgState.roundsRemaining ?? 99) <= 5
  const closeInPoints = (rpgState.pointsToLeader ?? 999) <= (rpgState.roundsRemaining ?? 0) * 25 // Max 25 points per race

  return inTop3 && lateSeason && closeInPoints
}

/**
 * Generate human-readable description of the modifier
 */
function generateModifierDescription(breakdown: AIModifierBreakdown): string {
  const parts: string[] = []
  const totalPercent = (breakdown.total * 100).toFixed(1)

  if (breakdown.teamDevelopment !== 0) {
    parts.push(`Team Dev: ${(breakdown.teamDevelopment * 100).toFixed(1)}%`)
  }
  if (breakdown.milestonePerks !== 0) {
    parts.push(`Perks: ${(breakdown.milestonePerks * 100).toFixed(1)}%`)
  }
  if (breakdown.formBonus !== 0) {
    parts.push(`Hot Streak: ${(breakdown.formBonus * 100).toFixed(1)}%`)
  }
  if (breakdown.injuryPenalty !== 0) {
    parts.push(`Injury: +${(breakdown.injuryPenalty * 100).toFixed(1)}%`)
  }
  if (breakdown.fatiguePenalty !== 0) {
    parts.push(`Fatigue: +${(breakdown.fatiguePenalty * 100).toFixed(1)}%`)
  }
  if (breakdown.pressurePenalty !== 0) {
    parts.push(`Pressure: +${(breakdown.pressurePenalty * 100).toFixed(1)}%`)
  }

  if (parts.length === 0) {
    return 'No active modifiers'
  }

  const prefix = breakdown.total < 0 ? 'Advantage' : breakdown.total > 0 ? 'Disadvantage' : 'Neutral'
  return `${prefix} (${totalPercent}%): ${parts.join(', ')}`
}

// ============================================
// MILESTONE TRACKING
// ============================================

/**
 * Check and update milestone progress based on player stats
 */
export function updateMilestones(
  currentMilestones: MilestoneProgress,
  player: PlayerDriver
): MilestoneProgress {
  return {
    // Race milestones
    firstRaceCompleted: currentMilestones.firstRaceCompleted || player.totalRaces >= 1,
    firstPointsFinish: currentMilestones.firstPointsFinish || hasPointsFinish(player),
    firstPodium: currentMilestones.firstPodium || player.totalPodiums >= 1,
    firstWin: currentMilestones.firstWin || player.totalWins >= 1,
    firstPolePosition: currentMilestones.firstPolePosition || player.totalPoles >= 1,
    firstChampionship: currentMilestones.firstChampionship || player.championships >= 1,
    
    // Career milestones
    races10: currentMilestones.races10 || player.totalRaces >= 10,
    races25: currentMilestones.races25 || player.totalRaces >= 25,
    races50: currentMilestones.races50 || player.totalRaces >= 50,
    races100: currentMilestones.races100 || player.totalRaces >= 100,
    wins5: currentMilestones.wins5 || player.totalWins >= 5,
    wins10: currentMilestones.wins10 || player.totalWins >= 10,
    wins25: currentMilestones.wins25 || player.totalWins >= 25,
    championships3: currentMilestones.championships3 || player.championships >= 3,
    championships5: currentMilestones.championships5 || player.championships >= 5
  }
}

/**
 * Check if player has ever scored points
 */
function hasPointsFinish(player: PlayerDriver): boolean {
  return player.raceHistory.some(race => race.points > 0)
}

/**
 * Calculate recent podium streak from race history
 */
export function calculatePodiumStreak(raceHistory: RaceResult[]): number {
  if (raceHistory.length === 0) return 0

  // Sort by date descending (most recent first)
  const sortedRaces = [...raceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let streak = 0
  for (const race of sortedRaces) {
    if (race.racePosition <= 3 && !race.dnf) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ============================================
// DEFAULT STATE CREATORS
// ============================================

/**
 * Create default milestone progress (all false)
 */
export function createDefaultMilestones(): MilestoneProgress {
  return {
    firstRaceCompleted: false,
    firstPointsFinish: false,
    firstPodium: false,
    firstWin: false,
    firstPolePosition: false,
    firstChampionship: false,
    races10: false,
    races25: false,
    races50: false,
    races100: false,
    wins5: false,
    wins10: false,
    wins25: false,
    championships3: false,
    championships5: false
  }
}

/**
 * Create default team development state
 */
export function createDefaultTeamDevelopment(): TeamDevelopmentState {
  return {
    points: 0,
    weeklyGrowthRate: 0,
    lastUpdatedWeek: 0
  }
}

/**
 * Create default injury state
 */
export function createDefaultInjuryState(): InjuryState {
  return {
    injured: false,
    severity: 'none',
    recoveryWeeksRemaining: 0,
    originalRecoveryWeeks: 0
  }
}

/**
 * Create default RPG state
 */
export function createDefaultRPGState(): RPGState {
  return {
    teamDevelopment: createDefaultTeamDevelopment(),
    milestones: createDefaultMilestones(),
    injury: createDefaultInjuryState(),
    recentPodiumStreak: 0,
    championshipPosition: 0,
    totalDriversInChampionship: 0,
    roundsRemaining: 0,
    pointsToLeader: 0
  }
}

// ============================================
// AI STAT APPLICATION
// ============================================

/**
 * Apply AI modifier to a specific stat value
 * The modifier is added directly (e.g., 0.85 race skill + (-0.02 modifier) = 0.83)
 */
export function applyModifierToStat(
  baseStat: number,
  modifier: number,
  _statName?: string
): number {
  // Some stats might have specific modifiers based on perks
  // For now, apply the general modifier to all stats
  const modified = baseStat + modifier
  return clamp(modified, 0, 1)
}

/**
 * Apply modifiers to all AI driver stats
 */
export function applyModifiersToAIDriver(
  driver: {
    raceSkill: number
    qualifyingSkill: number
    aggression: number
    defending: number
    stamina: number
    consistency: number
    startReactions: number
    wetSkill: number
    tireManagement: number
    fuelManagement: number
    blueFlagConceding: number
    weatherTyreChanges: number
    avoidanceOfMistakes: number
    avoidanceOfForcedMistakes: number
    vehicleReliability: number
  },
  modifierResult: AIModifierResult
): typeof driver {
  const mod = modifierResult.modifier

  return {
    ...driver,
    raceSkill: applyModifierToStat(driver.raceSkill, mod, 'raceSkill'),
    qualifyingSkill: applyModifierToStat(driver.qualifyingSkill, mod, 'qualifyingSkill'),
    consistency: applyModifierToStat(driver.consistency, mod, 'consistency'),
    avoidanceOfMistakes: applyModifierToStat(driver.avoidanceOfMistakes, mod, 'avoidanceOfMistakes'),
    defending: applyModifierToStat(driver.defending, mod * 0.5, 'defending'), // Half modifier for defending
    // These stats are less affected by player progression
    aggression: driver.aggression,
    stamina: driver.stamina,
    startReactions: driver.startReactions,
    wetSkill: driver.wetSkill,
    tireManagement: driver.tireManagement,
    fuelManagement: driver.fuelManagement,
    blueFlagConceding: driver.blueFlagConceding,
    weatherTyreChanges: driver.weatherTyreChanges,
    avoidanceOfForcedMistakes: driver.avoidanceOfForcedMistakes,
    vehicleReliability: driver.vehicleReliability
  }
}

// ============================================
// HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Get newly unlocked milestones by comparing old and new state
 */
export function getNewlyUnlockedMilestones(
  oldMilestones: MilestoneProgress,
  newMilestones: MilestoneProgress
): Array<{ key: keyof MilestoneProgress; perk: typeof MILESTONE_PERKS[keyof MilestoneProgress] }> {
  const newlyUnlocked: Array<{ key: keyof MilestoneProgress; perk: typeof MILESTONE_PERKS[keyof MilestoneProgress] }> = []

  for (const key of Object.keys(newMilestones) as Array<keyof MilestoneProgress>) {
    if (!oldMilestones[key] && newMilestones[key]) {
      newlyUnlocked.push({
        key,
        perk: MILESTONE_PERKS[key]
      })
    }
  }

  return newlyUnlocked
}

/**
 * Format milestone name for display
 */
export function formatMilestoneName(key: keyof MilestoneProgress): string {
  const names: Record<keyof MilestoneProgress, string> = {
    firstRaceCompleted: 'First Race Completed',
    firstPointsFinish: 'First Points Finish',
    firstPodium: 'First Podium',
    firstWin: 'First Victory',
    firstPolePosition: 'First Pole Position',
    firstChampionship: 'First Championship',
    races10: '10 Races',
    races25: '25 Races',
    races50: '50 Races',
    races100: '100 Races',
    wins5: '5 Wins',
    wins10: '10 Wins',
    wins25: '25 Wins',
    championships3: '3 Championships',
    championships5: '5 Championships'
  }
  return names[key] || key
}
