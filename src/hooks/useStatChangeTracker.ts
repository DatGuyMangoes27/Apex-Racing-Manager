// ============================================
// STAT CHANGE TRACKER
// ============================================
// Watches key game stats and detects when they change,
// emitting events that the UI can display as floating indicators.
// This makes the consequences of player decisions VISIBLE.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCareerStore } from '@/store/careerStore'

export type StatChangeType = 
  | 'reputation' 
  | 'cash' 
  | 'teamCash'
  | 'boardMood' 
  | 'fatigue' 
  | 'stress'
  | 'fitness'
  | 'morale'
  | 'fanSentiment'
  | 'sponsorSatisfaction'

export interface StatChange {
  id: string
  type: StatChangeType
  label: string
  oldValue: number
  newValue: number
  delta: number
  isPositive: boolean
  icon: string
  color: string
  timestamp: number
}

interface TrackedStats {
  reputation: number
  cash: number
  teamCash: number
  boardMood: number
  fatigue: number
  stress: number
  fitness: number
  morale: number
  fanSentiment: number
}

const STAT_CONFIG: Record<StatChangeType, { label: string; icon: string; positiveColor: string; negativeColor: string; format: (v: number) => string }> = {
  reputation: { 
    label: 'Reputation', icon: '⭐', 
    positiveColor: 'text-accent-gold', negativeColor: 'text-accent-red',
    format: (v) => v.toFixed(1)
  },
  cash: { 
    label: 'Personal Cash', icon: '💰', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => `$${Math.abs(v).toLocaleString()}`
  },
  teamCash: { 
    label: 'Team Budget', icon: '🏢', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => `$${Math.abs(v).toLocaleString()}`
  },
  boardMood: { 
    label: 'Board Mood', icon: '📊', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => `${v.toFixed(0)}%`
  },
  fatigue: { 
    label: 'Fatigue', icon: '😴', 
    positiveColor: 'text-cyan-400', negativeColor: 'text-accent-orange',  // Lower fatigue is good
    format: (v) => v.toFixed(0)
  },
  stress: { 
    label: 'Stress', icon: '😰', 
    positiveColor: 'text-cyan-400', negativeColor: 'text-accent-orange',  // Lower stress is good
    format: (v) => v.toFixed(0)
  },
  fitness: { 
    label: 'Fitness', icon: '💪', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => v.toFixed(0)
  },
  morale: { 
    label: 'Team Morale', icon: '🙌', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => v.toFixed(0)
  },
  fanSentiment: { 
    label: 'Fan Sentiment', icon: '👥', 
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => v.toFixed(0)
  },
  sponsorSatisfaction: {
    label: 'Sponsor Satisfaction', icon: '🤝',
    positiveColor: 'text-status-success', negativeColor: 'text-accent-red',
    format: (v) => `${v.toFixed(0)}%`
  },
}

/** Minimum change thresholds to avoid noise from rounding */
const MIN_CHANGE_THRESHOLDS: Record<StatChangeType, number> = {
  reputation: 0.05,
  cash: 100,
  teamCash: 500,
  boardMood: 0.5,
  fatigue: 1,
  stress: 1,
  fitness: 0.5,
  morale: 1,
  fanSentiment: 1,
  sponsorSatisfaction: 1,
}

function extractStats(state: ReturnType<typeof useCareerStore.getState>): TrackedStats | null {
  const { player, careerState } = state
  if (!player || !careerState) return null
  
  return {
    reputation: player.reputation ?? 0,
    cash: player.finances?.bankBalance ?? 0,
    teamCash: careerState.ownedTeam?.budgets?.cash ?? 0,
    boardMood: careerState.ownedTeam?.boardMood ?? 50,
    fatigue: player.mentalState?.fatigue ?? 0,
    stress: player.mentalState?.stress ?? 0,
    fitness: player.stats?.fitness ?? 50,
    morale: careerState.ownedTeam?.teamMorale ?? 50,
    fanSentiment: careerState.ownedTeam?.fanSentiment ?? 50,
  }
}

/**
 * Hook that tracks stat changes and returns recent changes for display.
 * Changes auto-expire after `displayDuration` ms.
 */
export function useStatChangeTracker(displayDuration: number = 4000) {
  const [changes, setChanges] = useState<StatChange[]>([])
  const prevStats = useRef<TrackedStats | null>(null)
  const isInitialized = useRef(false)
  
  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useCareerStore.subscribe((state) => {
      const currentStats = extractStats(state)
      if (!currentStats) return
      
      // First run: just capture initial state, don't emit changes
      if (!isInitialized.current) {
        prevStats.current = currentStats
        isInitialized.current = true
        return
      }
      
      if (!prevStats.current) {
        prevStats.current = currentStats
        return
      }
      
      const newChanges: StatChange[] = []
      
      for (const [key, value] of Object.entries(currentStats) as [StatChangeType, number][]) {
        const oldValue = prevStats.current[key as keyof TrackedStats]
        const delta = value - oldValue
        const threshold = MIN_CHANGE_THRESHOLDS[key] ?? 0.1
        
        if (Math.abs(delta) >= threshold) {
          const config = STAT_CONFIG[key]
          // For fatigue and stress, DECREASE is positive
          const invertedStats: StatChangeType[] = ['fatigue', 'stress']
          const isPositive = invertedStats.includes(key) ? delta < 0 : delta > 0
          
          newChanges.push({
            id: `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: key,
            label: config.label,
            oldValue,
            newValue: value,
            delta,
            isPositive,
            icon: config.icon,
            color: isPositive ? config.positiveColor : config.negativeColor,
            timestamp: Date.now(),
          })
        }
      }
      
      if (newChanges.length > 0) {
        setChanges(prev => [...prev, ...newChanges])
        
        // Auto-remove after displayDuration
        setTimeout(() => {
          const cutoff = Date.now() - displayDuration
          setChanges(prev => prev.filter(c => c.timestamp > cutoff))
        }, displayDuration)
      }
      
      prevStats.current = currentStats
    })
    
    return unsubscribe
  }, [displayDuration])
  
  const dismissChange = useCallback((id: string) => {
    setChanges(prev => prev.filter(c => c.id !== id))
  }, [])
  
  const dismissAll = useCallback(() => {
    setChanges([])
  }, [])
  
  return { changes, dismissChange, dismissAll }
}
