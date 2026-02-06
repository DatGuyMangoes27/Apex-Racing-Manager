/**
 * Narrative Module Index
 * 
 * Exports narrative generation functionality and sets up IPC handlers.
 */

import { ipcMain } from 'electron'
import { 
  generateSeriesNarratives,
  generateTrackNarrative,
  generateTeamSeriesNarratives,
  type DriverBasicInfo,
  type TrackBasicInfo,
  type TeamBasicInfo,
  type NarrativeGenerationProgress
} from './generator'

// Track generation progress for UI updates
let currentProgress: NarrativeGenerationProgress = {
  total: 0,
  completed: 0,
  currentBatch: '',
  status: 'idle'
}

/**
 * Register IPC handlers for narrative generation
 */
export function registerNarrativeHandlers(): void {
  console.log('[Narrative] Registering IPC handlers...')
  
  // Generate driver narratives for a series
  ipcMain.handle('narrative:generateDrivers', async (event, args: {
    drivers: DriverBasicInfo[]
    seriesName: string
    apiKey: string
    realDriverData?: Record<string, { realAge?: number; realNationality?: string; knownFor?: string }>
  }) => {
    const { drivers, seriesName, apiKey, realDriverData } = args
    
    console.log(`[Narrative] IPC request: generate ${drivers.length} driver narratives for ${seriesName}`)
    
    try {
      const narratives = await generateSeriesNarratives(
        drivers,
        seriesName,
        apiKey,
        realDriverData,
        (progress) => {
          currentProgress = progress
          // Send progress updates to renderer
          event.sender.send('narrative:progress', progress)
        }
      )
      
      return { success: true, narratives }
    } catch (error) {
      console.error('[Narrative] Driver generation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
  
  // Generate track narrative
  ipcMain.handle('narrative:generateTrack', async (_event, args: {
    track: TrackBasicInfo
    apiKey: string
  }) => {
    const { track, apiKey } = args
    
    console.log(`[Narrative] IPC request: generate track narrative for ${track.trackName}`)
    
    try {
      const narrative = await generateTrackNarrative(track, apiKey)
      return { success: true, narrative }
    } catch (error) {
      console.error('[Narrative] Track generation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
  
  // Generate team narratives for a series
  ipcMain.handle('narrative:generateTeams', async (event, args: {
    teams: TeamBasicInfo[]
    seriesName: string
    apiKey: string
  }) => {
    const { teams, seriesName, apiKey } = args
    
    console.log(`[Narrative] IPC request: generate ${teams.length} team narratives for ${seriesName}`)
    
    try {
      const narratives = await generateTeamSeriesNarratives(
        teams,
        seriesName,
        apiKey,
        (progress) => {
          currentProgress = progress
          // Send progress updates to renderer
          event.sender.send('narrative:progress', progress)
        }
      )
      
      return { success: true, narratives }
    } catch (error) {
      console.error('[Narrative] Team generation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
  
  // Get current generation progress
  ipcMain.handle('narrative:getProgress', () => {
    return currentProgress
  })
  
  console.log('[Narrative] IPC handlers registered')
}

// Re-export types and functions
export { 
  generateSeriesNarratives, 
  generateTrackNarrative,
  generateTeamSeriesNarratives,
  type DriverBasicInfo,
  type TrackBasicInfo,
  type TeamBasicInfo,
  type NarrativeGenerationProgress
}

