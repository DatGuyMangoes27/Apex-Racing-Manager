import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VideoContext = 'home' | 'calendar' | 'raceday' | 'garage' | 'finances' | 'media' | 'training' | 'contracts' | 'stats' | 'personal'

interface SettingsStore {
  // AMS2 Integration
  ams2Path: string | null
  autoWriteAIFiles: boolean
  telemetryEnabled: boolean
  telemetryPort: number
  
  // Visual Settings
  videoBackgroundsEnabled: boolean
  currentVideoContext: VideoContext
  reducedMotion: boolean
  
  // Gameplay
  difficultyModifier: number  // 0.8 - 1.2: Affects AI skill scaling
  realisticFinances: boolean
  autosaveEnabled: boolean
  autosaveInterval: number    // Minutes
  
  // Actions
  setAMS2Path: (path: string) => void
  setAutoWriteAIFiles: (enabled: boolean) => void
  setTelemetryEnabled: (enabled: boolean) => void
  setTelemetryPort: (port: number) => void
  setVideoBackgroundsEnabled: (enabled: boolean) => void
  setCurrentVideoContext: (context: VideoContext) => void
  setReducedMotion: (enabled: boolean) => void
  setDifficultyModifier: (modifier: number) => void
  setRealisticFinances: (enabled: boolean) => void
  setAutosaveEnabled: (enabled: boolean) => void
  setAutosaveInterval: (interval: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Defaults
      ams2Path: null,
      autoWriteAIFiles: true,
      telemetryEnabled: true,
      telemetryPort: 5606,
      videoBackgroundsEnabled: true,
      currentVideoContext: 'home',
      reducedMotion: false,
      difficultyModifier: 1.0,
      realisticFinances: true,
      autosaveEnabled: true,
      autosaveInterval: 5,
      
      // Actions
      setAMS2Path: (path) => set({ ams2Path: path }),
      setAutoWriteAIFiles: (enabled) => set({ autoWriteAIFiles: enabled }),
      setTelemetryEnabled: (enabled) => set({ telemetryEnabled: enabled }),
      setTelemetryPort: (port) => set({ telemetryPort: port }),
      setVideoBackgroundsEnabled: (enabled) => set({ videoBackgroundsEnabled: enabled }),
      setCurrentVideoContext: (context) => set({ currentVideoContext: context }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setDifficultyModifier: (modifier) => set({ difficultyModifier: modifier }),
      setRealisticFinances: (enabled) => set({ realisticFinances: enabled }),
      setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),
      setAutosaveInterval: (interval) => set({ autosaveInterval: interval })
    }),
    {
      name: 'ams2-settings-storage'
    }
  )
)












