/**
 * Pressure System
 * 
 * Calculates championship pressure and its effects on player and AI.
 * High pressure with low mental strength = harder races.
 * Media scrutiny from player background adds additional pressure.
 */

import type { PlayerBackground } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export interface PressureState {
  currentPressure: number       // 0-100
  pressureType: 'normal' | 'high' | 'extreme' | 'critical'
  titleFight: boolean
  homeRace: boolean
  lastResult: string
  streakType: 'none' | 'winning' | 'losing'
  streakLength: number
}

export interface PressureEffect {
  aiModifier: number
  reputationMultiplier: number
  stressChange: number
  description: string
}

interface PressureEvent {
  title: string
  severity: 'low' | 'medium' | 'high'
}

// ============================================
// CORE FUNCTIONS
// ============================================

export function calculatePressure(
  championshipPosition: number,
  pointsToLeader: number,
  roundsRemaining: number,
  totalRounds: number,
  isHomeRace: boolean,
  isContractYear: boolean,
  recentResults: number[],
  playerBackground?: PlayerBackground
): PressureState {
  let pressure = 20 // Base pressure

  // Championship position pressure
  if (championshipPosition <= 3) pressure += 15
  else if (championshipPosition <= 5) pressure += 10
  else if (championshipPosition <= 10) pressure += 5

  // Title fight detection
  const titleFight = championshipPosition <= 3 && pointsToLeader < 30 && roundsRemaining <= totalRounds * 0.4
  if (titleFight) pressure += 20

  // End-of-season intensity
  if (roundsRemaining <= 3) pressure += 15
  else if (roundsRemaining <= 6) pressure += 8

  // Home race pressure
  if (isHomeRace) pressure += 10

  // Contract year pressure
  if (isContractYear) pressure += 10

  // Streak detection
  let streakType: 'none' | 'winning' | 'losing' = 'none'
  let streakLength = 0
  if (recentResults.length > 0) {
    const isWinning = recentResults[0] <= 3
    streakType = isWinning ? 'winning' : recentResults[0] > 10 ? 'losing' : 'none'
    for (const result of recentResults) {
      if (isWinning && result <= 3) streakLength++
      else if (!isWinning && result > 10) streakLength++
      else break
    }
  }

  if (streakType === 'winning' && streakLength >= 3) pressure += 10 // Pressure to maintain
  if (streakType === 'losing' && streakLength >= 3) pressure += 15  // Pressure to recover

  // Background modifier
  if (playerBackground) {
    const bg = playerBackground as any
    if (bg.mediaScrutiny === 'high') pressure += 8
    else if (bg.mediaScrutiny === 'medium') pressure += 4
  }

  // Clamp and determine type
  pressure = Math.max(0, Math.min(100, pressure))
  let pressureType: PressureState['pressureType'] = 'normal'
  if (pressure >= 80) pressureType = 'critical'
  else if (pressure >= 60) pressureType = 'extreme'
  else if (pressure >= 40) pressureType = 'high'

  return {
    currentPressure: pressure,
    pressureType,
    titleFight,
    homeRace: isHomeRace,
    lastResult: recentResults.length > 0 ? `P${recentResults[0]}` : 'none',
    streakType,
    streakLength
  }
}

export function calculatePressureAIModifier(
  state: PressureState,
  mentalStrength: number
): PressureEffect {
  const mentalFactor = mentalStrength / 100 // 0 to 1
  const pressureImpact = state.currentPressure / 100

  // High mental strength reduces negative effects
  const aiModifier = pressureImpact > 0.6
    ? -(pressureImpact - 0.6) * 0.05 * (1 - mentalFactor * 0.7)
    : pressureImpact * 0.01 * mentalFactor // Small positive when handling pressure well

  const reputationMultiplier = state.titleFight ? 1.5 : state.currentPressure > 60 ? 1.2 : 1.0

  let stressChange = 0
  if (state.currentPressure > 70) stressChange = Math.round((state.currentPressure - 70) * 0.3 * (1 - mentalFactor * 0.5))
  else if (state.currentPressure < 30) stressChange = -2 // Relief from low pressure

  let description = 'No significant pressure'
  if (state.pressureType === 'critical') description = 'Immense pressure — every decision is magnified'
  else if (state.pressureType === 'extreme') description = 'High pressure — the spotlight is on you'
  else if (state.pressureType === 'high') description = 'Building pressure — stay focused'

  return { aiModifier, reputationMultiplier, stressChange, description }
}

export function processWeeklyPressure(
  currentPressure: number,
  isRaceWeek: boolean
): number {
  // Pressure naturally decays during non-race weeks
  if (!isRaceWeek) {
    return Math.max(10, currentPressure - 3)
  }
  // Race weeks maintain or slightly build pressure
  return Math.min(100, currentPressure + 2)
}

export function createPressureEvent(
  state: PressureState,
  _currentWeek: number,
  _currentYear: number
): PressureEvent | null {
  if (state.currentPressure >= 60) {
    return {
      title: state.pressureType === 'critical' ? 'Critical Pressure Alert'
        : state.pressureType === 'extreme' ? 'Championship Pressure Mounting'
        : 'Pressure Building',
      severity: state.currentPressure >= 80 ? 'high' : state.currentPressure >= 60 ? 'medium' : 'low'
    }
  }
  return null
}

export function getPressureStatus(pressure: number): { level: string; icon: string; color: string } {
  if (pressure >= 80) return { level: 'Critical', icon: '🔴', color: 'text-red-500' }
  if (pressure >= 60) return { level: 'Extreme', icon: '🟠', color: 'text-orange-500' }
  if (pressure >= 40) return { level: 'High', icon: '🟡', color: 'text-yellow-500' }
  if (pressure >= 20) return { level: 'Moderate', icon: '🟢', color: 'text-green-500' }
  return { level: 'Low', icon: '🔵', color: 'text-blue-500' }
}

export function getBackgroundPressureDescription(background: PlayerBackground): string | null {
  const bg = background as any
  if (bg.mediaScrutiny === 'high') {
    return 'Your high-profile background means extra media scrutiny and public pressure.'
  }
  if (bg.mediaScrutiny === 'medium') {
    return 'Your background attracts moderate media attention, adding some pressure.'
  }
  return null
}
