/**
 * Scouting Store - Driver Intelligence System
 * 
 * Manages player's knowledge about rival drivers through:
 * - Racing against them (auto-scout)
 * - Active scouting actions (costs time/money)
 * - Team intelligence networks
 * 
 * Drivers start as "unknown" with limited info visible,
 * and more details are revealed as scouting level increases.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ScoutingLevel = 
  | 'unknown'     // Name and nationality only
  | 'basic'       // + Team, age, overall rating
  | 'familiar'    // + Individual stat categories (race skill, wet skill, etc.)
  | 'detailed'    // + Exact stat values, career history
  | 'complete'    // + Contract details, form trends, development trajectory

export interface DriverIntelligence {
  driverId: string
  driverName: string
  level: ScoutingLevel
  lastUpdated: number        // Timestamp
  racedAgainst: number       // Number of races shared
  scoutingCost: number       // Cost to upgrade to next level
  // What the player knows (revealed based on level)
  knownData: {
    team?: boolean
    age?: boolean
    nationality?: boolean
    overallRating?: boolean
    individualStats?: boolean
    exactValues?: boolean
    careerHistory?: boolean
    contractDetails?: boolean
    formTrends?: boolean
    developmentTrajectory?: boolean
  }
  // Scouting notes (player can add custom notes)
  notes?: string
}

export interface ScoutingReport {
  id: string
  driverId: string
  driverName: string
  timestamp: number
  levelBefore: ScoutingLevel
  levelAfter: ScoutingLevel
  cost: number
  source: 'race' | 'manual' | 'team-intel' | 'news'
  insights?: string[]
}

interface ScoutingStore {
  // State
  driverIntelligence: Record<string, DriverIntelligence>
  scoutingReports: ScoutingReport[]
  scoutingBudget: number       // Available budget for scouting
  teamIntelLevel: number       // 0-5: Team's intelligence network quality
  
  // Actions
  getDriverIntelligence: (driverId: string) => DriverIntelligence | undefined
  getScoutingLevel: (driverId: string) => ScoutingLevel
  canSeeData: (driverId: string, dataType: keyof DriverIntelligence['knownData']) => boolean
  getEstimatedScoutingCost: (driverId: string) => number
  
  // Scouting actions
  recordRaceAgainst: (driverIds: string[], driverNames?: Record<string, string>) => void
  scoutDriver: (driverId: string, driverName: string) => ScoutingReport | null
  upgradeTeamIntel: (cost: number) => boolean
  setScoutingBudget: (budget: number) => void
  addScoutingBudget: (amount: number) => void
  
  // Bulk operations
  initializeDrivers: (drivers: Array<{ id: string; name: string }>) => void
  getKnownDrivers: () => DriverIntelligence[]
  getDriversByLevel: (level: ScoutingLevel) => DriverIntelligence[]
  
  // Auto-knowledge (teammates, famous drivers)
  syncTeammateKnowledge: (teammateIds: string[], teammateNames: Record<string, string>) => void
  applyAutoKnowledge: (drivers: Array<{ id: string; name: string; tier: TeamTier; reputation: number }>) => void
  setDriverToComplete: (driverId: string, driverName: string) => void
  
  // Notes
  addDriverNote: (driverId: string, note: string) => void
  
  // Reset
  resetScouting: () => void
}

// ============================================
// SCOUTING LEVEL CONFIGURATION
// ============================================

const SCOUTING_LEVELS: ScoutingLevel[] = ['unknown', 'basic', 'familiar', 'detailed', 'complete']

const LEVEL_REQUIREMENTS: Record<ScoutingLevel, { racesNeeded: number; cost: number }> = {
  'unknown': { racesNeeded: 0, cost: 0 },
  'basic': { racesNeeded: 1, cost: 500 },
  'familiar': { racesNeeded: 3, cost: 2000 },
  'detailed': { racesNeeded: 8, cost: 5000 },
  'complete': { racesNeeded: 15, cost: 15000 },
}

const LEVEL_DATA_REVEAL: Record<ScoutingLevel, Array<keyof DriverIntelligence['knownData']>> = {
  'unknown': ['nationality'],
  'basic': ['nationality', 'team', 'age', 'overallRating'],
  'familiar': ['nationality', 'team', 'age', 'overallRating', 'individualStats'],
  'detailed': ['nationality', 'team', 'age', 'overallRating', 'individualStats', 'exactValues', 'careerHistory'],
  'complete': ['nationality', 'team', 'age', 'overallRating', 'individualStats', 'exactValues', 'careerHistory', 'contractDetails', 'formTrends', 'developmentTrajectory'],
}

function getNextLevel(current: ScoutingLevel): ScoutingLevel | null {
  const currentIndex = SCOUTING_LEVELS.indexOf(current)
  if (currentIndex >= SCOUTING_LEVELS.length - 1) return null
  return SCOUTING_LEVELS[currentIndex + 1]
}

function getKnownDataForLevel(level: ScoutingLevel): DriverIntelligence['knownData'] {
  const revealed = LEVEL_DATA_REVEAL[level]
  return {
    nationality: revealed.includes('nationality'),
    team: revealed.includes('team'),
    age: revealed.includes('age'),
    overallRating: revealed.includes('overallRating'),
    individualStats: revealed.includes('individualStats'),
    exactValues: revealed.includes('exactValues'),
    careerHistory: revealed.includes('careerHistory'),
    contractDetails: revealed.includes('contractDetails'),
    formTrends: revealed.includes('formTrends'),
    developmentTrajectory: revealed.includes('developmentTrajectory'),
  }
}

/**
 * Calculate the cost to scout a driver from their current level to the next level
 * Exported so UI can calculate costs for uninitialized drivers
 */
export function calculateScoutingCost(level: ScoutingLevel, teamIntelLevel: number): number {
  const nextLevel = getNextLevel(level)
  if (!nextLevel) return 0
  
  const baseCost = LEVEL_REQUIREMENTS[nextLevel].cost
  // Team intel reduces scouting costs (up to 50% at max level)
  const discount = teamIntelLevel * 0.1 // 10% per level
  return Math.round(baseCost * (1 - discount))
}

/**
 * Tier type for determining auto-knowledge levels
 */
export type TeamTier = 'entry' | 'amateur' | 'semi-pro' | 'professional' | 'pro' | 'elite' | 'pinnacle'

/**
 * Determine baseline scouting level based on driver's series tier
 * Famous drivers in top-tier series are known publicly
 */
export function getAutoKnowledgeLevel(tier: TeamTier, driverReputation: number): ScoutingLevel {
  // Championship-winning drivers or legends are well-known
  if (driverReputation >= 80) return 'basic'
  
  // Top-tier drivers are celebrities - basic public info known
  if (tier === 'pinnacle' || tier === 'elite') return 'basic'
  
  // Pro/professional drivers get media coverage
  if (tier === 'pro' || tier === 'professional') {
    return driverReputation >= 50 ? 'basic' : 'unknown'
  }
  
  // Lower tiers are mostly unknown unless they have reputation
  if (driverReputation >= 60) return 'basic'
  
  return 'unknown'
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useScoutingStore = create<ScoutingStore>()(
  persist(
    (set, get) => ({
      driverIntelligence: {},
      scoutingReports: [],
      scoutingBudget: 10000, // Starting budget
      teamIntelLevel: 0,

      getDriverIntelligence: (driverId) => {
        return get().driverIntelligence[driverId]
      },

      getScoutingLevel: (driverId) => {
        const intel = get().driverIntelligence[driverId]
        return intel?.level || 'unknown'
      },

      canSeeData: (driverId, dataType) => {
        const intel = get().driverIntelligence[driverId]
        if (!intel) return dataType === 'nationality' // Always show nationality
        return intel.knownData[dataType] || false
      },

      getEstimatedScoutingCost: (driverId) => {
        const { driverIntelligence, teamIntelLevel } = get()
        const intel = driverIntelligence[driverId]
        // If driver has intel entry, use their stored cost; otherwise calculate from unknown
        if (intel) {
          return intel.scoutingCost
        }
        return calculateScoutingCost('unknown', teamIntelLevel)
      },

      recordRaceAgainst: (driverIds, driverNames = {}) => {
        const { driverIntelligence, teamIntelLevel } = get()
        const updates: Record<string, DriverIntelligence> = { ...driverIntelligence }
        
        driverIds.forEach(driverId => {
          const existing = updates[driverId]
          const name = driverNames[driverId] || driverId
          
          if (existing) {
            // Increment race count
            const newRaceCount = existing.racedAgainst + 1
            
            // Check if auto-upgrade is triggered
            let newLevel = existing.level
            const nextLevel = getNextLevel(existing.level)
            if (nextLevel) {
              const racesNeeded = LEVEL_REQUIREMENTS[nextLevel].racesNeeded
              // Auto-upgrade at 50% of the race requirement (racing gives partial intel)
              if (newRaceCount >= Math.ceil(racesNeeded / 2)) {
                newLevel = nextLevel
                console.log(`[Scouting] ${name} auto-upgraded to ${newLevel} after ${newRaceCount} races`)
              }
            }
            
            updates[driverId] = {
              ...existing,
              racedAgainst: newRaceCount,
              level: newLevel,
              knownData: getKnownDataForLevel(newLevel),
              scoutingCost: calculateScoutingCost(newLevel, teamIntelLevel),
              lastUpdated: Date.now()
            }
          } else {
            // First encounter - create with 'basic' level
            updates[driverId] = {
              driverId,
              driverName: name,
              level: 'basic',
              lastUpdated: Date.now(),
              racedAgainst: 1,
              scoutingCost: calculateScoutingCost('basic', teamIntelLevel),
              knownData: getKnownDataForLevel('basic')
            }
            console.log(`[Scouting] First race against ${name} - now at basic level`)
          }
        })
        
        set({ driverIntelligence: updates })
      },

      scoutDriver: (driverId, driverName) => {
        const { driverIntelligence, scoutingBudget, teamIntelLevel, scoutingReports } = get()
        const existing = driverIntelligence[driverId]
        
        // Create entry if doesn't exist
        const current = existing || {
          driverId,
          driverName,
          level: 'unknown' as ScoutingLevel,
          lastUpdated: Date.now(),
          racedAgainst: 0,
          scoutingCost: calculateScoutingCost('unknown', teamIntelLevel),
          knownData: getKnownDataForLevel('unknown')
        }
        
        const nextLevel = getNextLevel(current.level)
        if (!nextLevel) {
          console.log(`[Scouting] ${driverName} already at max level`)
          return null
        }
        
        const cost = current.scoutingCost
        if (cost > scoutingBudget) {
          console.log(`[Scouting] Not enough budget to scout ${driverName} (need ${cost}, have ${scoutingBudget})`)
          return null
        }
        
        // Perform scouting
        const report: ScoutingReport = {
          id: `scout_${Date.now()}_${driverId}`,
          driverId,
          driverName,
          timestamp: Date.now(),
          levelBefore: current.level,
          levelAfter: nextLevel,
          cost,
          source: 'manual',
          insights: generateScoutingInsights(nextLevel)
        }
        
        const updated: DriverIntelligence = {
          ...current,
          level: nextLevel,
          knownData: getKnownDataForLevel(nextLevel),
          scoutingCost: calculateScoutingCost(nextLevel, teamIntelLevel),
          lastUpdated: Date.now()
        }
        
        set({
          driverIntelligence: {
            ...driverIntelligence,
            [driverId]: updated
          },
          scoutingBudget: scoutingBudget - cost,
          scoutingReports: [...scoutingReports, report]
        })
        
        console.log(`[Scouting] Scouted ${driverName}: ${current.level} -> ${nextLevel} (cost: $${cost})`)
        return report
      },

      upgradeTeamIntel: (cost) => {
        const { teamIntelLevel, scoutingBudget } = get()
        
        if (teamIntelLevel >= 5) {
          console.log('[Scouting] Team intel already at max level')
          return false
        }
        
        if (cost > scoutingBudget) {
          console.log(`[Scouting] Not enough budget for team intel upgrade (need ${cost}, have ${scoutingBudget})`)
          return false
        }
        
        set({
          teamIntelLevel: teamIntelLevel + 1,
          scoutingBudget: scoutingBudget - cost
        })
        
        console.log(`[Scouting] Team intel upgraded to level ${teamIntelLevel + 1}`)
        return true
      },

      setScoutingBudget: (budget) => {
        set({ scoutingBudget: budget })
      },

      addScoutingBudget: (amount) => {
        set((state) => ({ scoutingBudget: state.scoutingBudget + amount }))
      },

      initializeDrivers: (drivers) => {
        const { driverIntelligence, teamIntelLevel } = get()
        const updates: Record<string, DriverIntelligence> = { ...driverIntelligence }
        
        drivers.forEach(driver => {
          if (!updates[driver.id]) {
            updates[driver.id] = {
              driverId: driver.id,
              driverName: driver.name,
              level: 'unknown',
              lastUpdated: Date.now(),
              racedAgainst: 0,
              scoutingCost: calculateScoutingCost('unknown', teamIntelLevel),
              knownData: getKnownDataForLevel('unknown')
            }
          }
        })
        
        set({ driverIntelligence: updates })
      },

      getKnownDrivers: () => {
        const { driverIntelligence } = get()
        return Object.values(driverIntelligence).filter(d => d.level !== 'unknown')
      },

      getDriversByLevel: (level) => {
        const { driverIntelligence } = get()
        return Object.values(driverIntelligence).filter(d => d.level === level)
      },

      addDriverNote: (driverId, note) => {
        const { driverIntelligence } = get()
        const existing = driverIntelligence[driverId]
        if (!existing) return
        
        set({
          driverIntelligence: {
            ...driverIntelligence,
            [driverId]: {
              ...existing,
              notes: note
            }
          }
        })
      },

      /**
       * Sync teammate knowledge - teammates are fully known (complete level)
       * Called when player signs a contract or changes teams
       */
      syncTeammateKnowledge: (teammateIds, teammateNames) => {
        const { driverIntelligence } = get()
        const updates: Record<string, DriverIntelligence> = { ...driverIntelligence }
        
        teammateIds.forEach(teammateId => {
          const name = teammateNames[teammateId] || teammateId
          const existing = updates[teammateId]
          
          // Set teammates to complete - you know everything about them
          updates[teammateId] = {
            driverId: teammateId,
            driverName: name,
            level: 'complete',
            lastUpdated: Date.now(),
            racedAgainst: existing?.racedAgainst || 0,
            scoutingCost: 0, // Already at max
            knownData: getKnownDataForLevel('complete'),
            notes: existing?.notes
          }
          
          console.log(`[Scouting] Teammate ${name} set to complete knowledge`)
        })
        
        set({ driverIntelligence: updates })
      },

      /**
       * Apply automatic knowledge based on driver tier and reputation
       * Famous drivers in top series are publicly known
       */
      applyAutoKnowledge: (drivers) => {
        const { driverIntelligence, teamIntelLevel } = get()
        const updates: Record<string, DriverIntelligence> = { ...driverIntelligence }
        
        drivers.forEach(driver => {
          const existing = updates[driver.id]
          const autoLevel = getAutoKnowledgeLevel(driver.tier, driver.reputation)
          
          // Only upgrade if auto-knowledge would be better than current
          const currentLevel = existing?.level || 'unknown'
          const currentIndex = SCOUTING_LEVELS.indexOf(currentLevel)
          const autoIndex = SCOUTING_LEVELS.indexOf(autoLevel)
          
          if (autoIndex > currentIndex || !existing) {
            updates[driver.id] = {
              driverId: driver.id,
              driverName: driver.name,
              level: autoLevel,
              lastUpdated: Date.now(),
              racedAgainst: existing?.racedAgainst || 0,
              scoutingCost: calculateScoutingCost(autoLevel, teamIntelLevel),
              knownData: getKnownDataForLevel(autoLevel),
              notes: existing?.notes
            }
          }
        })
        
        set({ driverIntelligence: updates })
      },

      /**
       * Directly set a driver to complete knowledge level
       * Used for teammates or special circumstances
       */
      setDriverToComplete: (driverId, driverName) => {
        const { driverIntelligence } = get()
        const existing = driverIntelligence[driverId]
        
        set({
          driverIntelligence: {
            ...driverIntelligence,
            [driverId]: {
              driverId,
              driverName,
              level: 'complete',
              lastUpdated: Date.now(),
              racedAgainst: existing?.racedAgainst || 0,
              scoutingCost: 0,
              knownData: getKnownDataForLevel('complete'),
              notes: existing?.notes
            }
          }
        })
        
        console.log(`[Scouting] ${driverName} set to complete knowledge`)
      },

      resetScouting: () => {
        set({
          driverIntelligence: {},
          scoutingReports: [],
          scoutingBudget: 10000,
          teamIntelLevel: 0
        })
      }
    }),
    {
      name: 'ams2-scouting-storage'
    }
  )
)

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateScoutingInsights(level: ScoutingLevel): string[] {
  const insights: string[] = []
  
  switch (level) {
    case 'basic':
      insights.push('Identified driver\'s current team and position')
      insights.push('Confirmed age and nationality')
      break
    case 'familiar':
      insights.push('Analyzed on-track performance patterns')
      insights.push('Identified strengths in specific conditions')
      insights.push('Noted typical race pace and consistency')
      break
    case 'detailed':
      insights.push('Compiled detailed performance statistics')
      insights.push('Reviewed complete career history')
      insights.push('Analyzed race-by-race form trends')
      break
    case 'complete':
      insights.push('Obtained contract details and salary information')
      insights.push('Predicted future development trajectory')
      insights.push('Identified negotiation leverage points')
      break
  }
  
  return insights
}

/**
 * Get the display name for a scouting level
 */
export function getScoutingLevelName(level: ScoutingLevel): string {
  switch (level) {
    case 'unknown': return 'Unknown'
    case 'basic': return 'Basic Intel'
    case 'familiar': return 'Familiar'
    case 'detailed': return 'Detailed Report'
    case 'complete': return 'Complete Dossier'
  }
}

/**
 * Get the icon/emoji for a scouting level
 */
export function getScoutingLevelIcon(level: ScoutingLevel): string {
  switch (level) {
    case 'unknown': return '❓'
    case 'basic': return '📋'
    case 'familiar': return '👤'
    case 'detailed': return '📊'
    case 'complete': return '🎯'
  }
}

/**
 * Get what percentage of a driver's info is known
 */
export function getIntelPercentage(level: ScoutingLevel): number {
  switch (level) {
    case 'unknown': return 10
    case 'basic': return 30
    case 'familiar': return 55
    case 'detailed': return 80
    case 'complete': return 100
  }
}
