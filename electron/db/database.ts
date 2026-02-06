import { ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// Note: In production, this would use better-sqlite3
// For now, we'll use a JSON-based storage as a placeholder
// that can be easily replaced with SQLite later

interface DatabaseConfig {
  dbPath: string
}

interface CareerData {
  player: unknown
  careerState: unknown
  rivals: unknown[]
  teams: unknown[]
  series: unknown[]
  raceHistory: unknown[]
  seasonStandings: Record<string, unknown[]>
  newsEvents: unknown[]
  savedAt: string
}

// Get default database path
function getDefaultDBPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'career_data.json')
}

// Ensure directory exists
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Save career data using atomic write (write to temp file, then rename)
function saveCareerData(data: CareerData, config?: DatabaseConfig): { success: boolean; error?: string } {
  try {
    const dbPath = config?.dbPath || getDefaultDBPath()
    ensureDirectoryExists(dbPath)
    
    const saveData = {
      ...data,
      savedAt: new Date().toISOString()
    }
    
    const jsonData = JSON.stringify(saveData, null, 2)
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dbPath + '.tmp'
    fs.writeFileSync(tempPath, jsonData, 'utf-8')
    
    // Verify the temp file is valid JSON before replacing main file
    try {
      const verify = fs.readFileSync(tempPath, 'utf-8')
      JSON.parse(verify)
    } catch {
      fs.unlinkSync(tempPath)
      return { success: false, error: 'Save verification failed - temp file was corrupt' }
    }
    
    // Rename temp to main (atomic on most filesystems)
    fs.renameSync(tempPath, dbPath)
    
    // Also create a backup
    const backupPath = dbPath.replace('.json', `_backup_${Date.now()}.json`)
    fs.writeFileSync(backupPath, jsonData, 'utf-8')
    
    // Keep only last 5 backups
    cleanupOldBackups(path.dirname(dbPath))
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Validate that parsed data has required fields
function isValidCareerData(data: any): data is CareerData {
  return data && typeof data === 'object' && data.player && data.careerState
}

// Try to load from backup files
function tryLoadFromBackup(dir: string): { success: boolean; data?: CareerData; error?: string } {
  try {
    const files = fs.readdirSync(dir)
    const backups = files
      .filter(f => f.includes('_backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: parseInt(f.match(/_backup_(\d+)\.json/)?.[1] || '0')
      }))
      .sort((a, b) => b.time - a.time) // Most recent first
    
    for (const backup of backups) {
      try {
        const content = fs.readFileSync(path.join(dir, backup.name), 'utf-8')
        const data = JSON.parse(content)
        if (isValidCareerData(data)) {
          console.log(`[Database] Recovered from backup: ${backup.name}`)
          return { success: true, data }
        }
      } catch {
        // Try next backup
        continue
      }
    }
    
    return { success: false, error: 'No valid backup found' }
  } catch {
    return { success: false, error: 'Failed to read backup directory' }
  }
}

// Load career data with fallback to backups if main file is corrupt
function loadCareerData(config?: DatabaseConfig): { success: boolean; data?: CareerData; error?: string } {
  const dbPath = config?.dbPath || getDefaultDBPath()
  
  // Try loading main save file
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'No saved career found' }
    }
    
    const content = fs.readFileSync(dbPath, 'utf-8')
    const data = JSON.parse(content)
    
    if (isValidCareerData(data)) {
      return { success: true, data }
    }
    
    // Main file exists but is invalid - try backups
    console.error('[Database] Main save file is invalid/corrupt - trying backups...')
  } catch (error) {
    // Main file is corrupt or unreadable - try backups
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Database] Main save file error: ${errorMessage} - trying backups...`)
  }
  
  // Fallback: try loading from backup files
  const dir = path.dirname(dbPath)
  const backupResult = tryLoadFromBackup(dir)
  
  if (backupResult.success && backupResult.data) {
    // Restore the backup as the main file
    try {
      fs.writeFileSync(dbPath, JSON.stringify(backupResult.data, null, 2), 'utf-8')
      console.log('[Database] Restored backup as main save file')
    } catch {
      console.error('[Database] Could not restore backup as main file')
    }
    return backupResult
  }
  
  return { success: false, error: 'Save file corrupt and no valid backups found' }
}

// Delete career data
function deleteCareerData(config?: DatabaseConfig): { success: boolean; error?: string } {
  try {
    const dbPath = config?.dbPath || getDefaultDBPath()
    
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Cleanup old backup files
function cleanupOldBackups(dir: string): void {
  try {
    const files = fs.readdirSync(dir)
    const backups = files
      .filter(f => f.includes('_backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: parseInt(f.match(/_backup_(\d+)\.json/)?.[1] || '0')
      }))
      .sort((a, b) => b.time - a.time)
    
    // Remove backups beyond the 5th
    backups.slice(5).forEach(backup => {
      fs.unlinkSync(path.join(dir, backup.name))
    })
  } catch {
    // Ignore cleanup errors
  }
}

// Check if career exists
function careerExists(config?: DatabaseConfig): boolean {
  const dbPath = config?.dbPath || getDefaultDBPath()
  return fs.existsSync(dbPath)
}

// Get save info without loading full data
function getSaveInfo(config?: DatabaseConfig): { exists: boolean; savedAt?: string; size?: number } {
  const dbPath = config?.dbPath || getDefaultDBPath()
  
  if (!fs.existsSync(dbPath)) {
    return { exists: false }
  }
  
  try {
    const stats = fs.statSync(dbPath)
    const content = fs.readFileSync(dbPath, 'utf-8')
    const data = JSON.parse(content)
    
    return {
      exists: true,
      savedAt: data.savedAt,
      size: stats.size
    }
  } catch {
    return { exists: false }
  }
}

// Export career to file
function exportCareer(exportPath: string, config?: DatabaseConfig): { success: boolean; error?: string } {
  try {
    const result = loadCareerData(config)
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'No data to export' }
    }
    
    fs.writeFileSync(exportPath, JSON.stringify(result.data, null, 2), 'utf-8')
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Import career from file
function importCareer(importPath: string, config?: DatabaseConfig): { success: boolean; error?: string } {
  try {
    if (!fs.existsSync(importPath)) {
      return { success: false, error: 'Import file not found' }
    }
    
    const content = fs.readFileSync(importPath, 'utf-8')
    const data = JSON.parse(content) as CareerData
    
    // Validate basic structure
    if (!data.player || !data.careerState) {
      return { success: false, error: 'Invalid career file format' }
    }
    
    return saveCareerData(data, config)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Register IPC handlers
export function registerDatabaseHandlers(): void {
  ipcMain.handle('db:saveCareer', async (_event, data: CareerData) => {
    return saveCareerData(data)
  })
  
  ipcMain.handle('db:loadCareer', async () => {
    return loadCareerData()
  })
  
  ipcMain.handle('db:deleteCareer', async () => {
    return deleteCareerData()
  })
  
  ipcMain.handle('db:careerExists', async () => {
    return careerExists()
  })
  
  ipcMain.handle('db:getSaveInfo', async () => {
    return getSaveInfo()
  })
  
  ipcMain.handle('db:exportCareer', async (_event, exportPath: string) => {
    return exportCareer(exportPath)
  })
  
  ipcMain.handle('db:importCareer', async (_event, importPath: string) => {
    return importCareer(importPath)
  })
  
  ipcMain.handle('db:getDefaultPath', async () => {
    return getDefaultDBPath()
  })
}

export {
  saveCareerData,
  loadCareerData,
  deleteCareerData,
  careerExists,
  getSaveInfo,
  exportCareer,
  importCareer,
  getDefaultDBPath,
  CareerData,
  DatabaseConfig
}












