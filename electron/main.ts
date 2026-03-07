import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { registerXMLGeneratorHandlers } from './xml/generator'
import { registerSharedMemoryHandlers, stopTelemetry } from './shared-memory'
import { initDatabase, registerDatabaseHandlers, closeDatabase } from './db/database'
import { registerCommentaryHandlers, stopCommentary } from './commentary'
import { registerNarrativeHandlers } from './narrative'
import { registerLiveryHandlers } from './livery/generator'

// Get __dirname for Electron main process
// Vite will transform import.meta.url for CommonJS output
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0D0D0F',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Window controls via IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false)
  })

  if (isDev) {
    // Use environment variable set by vite-plugin-electron, fallback to default
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    // In production, the app is packaged and resources are in different locations
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading production index from:', indexPath)
    console.log('__dirname:', __dirname)
    console.log('app.getAppPath():', app.getAppPath())
    
    mainWindow.loadFile(indexPath)
    
    // Open devtools in production for debugging (can be removed later)
    // mainWindow.webContents.openDevTools()
    
    // Log any load errors
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription)
    })
  }

  mainWindow.on('closed', () => {
    // Stop all background processes before window reference is cleared
    console.log('[Main] Window closed, stopping background processes...')
    stopTelemetry()
    stopCommentary()
    mainWindow = null
  })
}

// AMS2 Launch and File Dialog handlers
function registerAMS2Handlers() {
  // Launch AMS2
  ipcMain.handle('ams2:launch', async (_event, gamePath: string, options?: { noVR?: boolean }) => {
    try {
      // Try different executable names
      const executables = ['AMS2AVX.exe', 'AMS2.exe']
      let exePath = ''
      
      for (const exe of executables) {
        const fullPath = path.join(gamePath, exe)
        if (existsSync(fullPath)) {
          exePath = fullPath
          break
        }
      }
      
      // Build launch arguments
      const launchArgs: string[] = []
      
      // Add -novr flag to prevent VR from launching
      if (options?.noVR !== false) {
        // Default to no VR unless explicitly set to false
        launchArgs.push('-novr')
      }
      
      if (!exePath) {
        // Try launching via Steam with -novr argument
        // Steam URL with launch options: steam://run/1066890//-novr/
        const steamUrl = options?.noVR !== false 
          ? 'steam://run/1066890//-novr/'
          : 'steam://rungameid/1066890'
        await shell.openExternal(steamUrl)
        return { success: true, method: 'steam', noVR: options?.noVR !== false }
      }
      
      console.log('Launching AMS2:', exePath, 'with args:', launchArgs)
      
      // Launch the executable with arguments
      const child = spawn(exePath, launchArgs, {
        cwd: gamePath,
        detached: true,
        stdio: 'ignore'
      })
      child.unref()
      
      return { success: true, method: 'direct', path: exePath, args: launchArgs }
    } catch (err: any) {
      console.error('Failed to launch AMS2:', err)
      return { success: false, error: err.message }
    }
  })
  
  // Validate AMS2 path
  ipcMain.handle('ams2:validatePath', async (_event, gamePath: string) => {
    try {
      const executables = ['AMS2AVX.exe', 'AMS2.exe']
      for (const exe of executables) {
        if (existsSync(path.join(gamePath, exe))) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  })
  
  // Open directory dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select AMS2 Installation Folder'
    })
    return result
  })
  
  // Open file dialog
  ipcMain.handle('dialog:openFile', async (_event, options: any) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      ...options
    })
    return result
  })
  
  // Get logs from file (when debug page opens)
  ipcMain.handle('logs:getBuffered', async () => {
    const { getLogsFromFile } = await import('./services/debugLogger')
    return getLogsFromFile()
  })
  
  // Clear log files
  ipcMain.handle('logs:clearFiles', async () => {
    const { clearLogFiles } = await import('./services/debugLogger')
    clearLogFiles()
  })
  
  // Save logs to file
  ipcMain.handle('logs:saveToFile', async (_event, telemetryLogs: any[], commentaryLogs: any[]) => {
    try {
      const { dialog } = await import('electron')
      const fs = await import('fs')
      const path = await import('path')
      
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Debug Logs',
        defaultPath: `career-mod-logs-${new Date().toISOString().slice(0,10)}.txt`,
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      })
      
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' }
      }
      
      // Format logs
      let content = '=== CAREER MOD DEBUG LOGS ===\n'
      content += `Generated: ${new Date().toISOString()}\n\n`
      
      content += '=== TELEMETRY LOGS ===\n'
      for (const log of telemetryLogs) {
        content += `[${log.timeStr}] ${log.type}: ${log.message}`
        if (log.details) content += ` | ${JSON.stringify(log.details)}`
        content += '\n'
      }
      
      content += '\n=== COMMENTARY LOGS ===\n'
      for (const log of commentaryLogs) {
        content += `[${log.timeStr}] ${log.type}: ${log.message}`
        if (log.details) content += ` | ${JSON.stringify(log.details)}`
        content += '\n'
      }
      
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('[Main] Save logs error:', error)
      return { success: false, error: String(error) }
    }
  })
}

app.whenReady().then(async () => {
  createWindow()
  
  // Set up debug logger with main window reference
  const { setLoggerWindow } = await import('./services/debugLogger')
  setLoggerWindow(mainWindow)
  
  // Initialise SQLite database (must happen before IPC handlers)
  try {
    initDatabase()
  } catch (err) {
    console.error('[Main] Failed to initialise SQLite database:', err)
    console.error('[Main] Database operations will be unavailable — IPC handlers will still register')
  }

  // Register all IPC handlers
  registerXMLGeneratorHandlers()
  registerSharedMemoryHandlers(mainWindow)  // Using shared memory instead of UDP
  registerDatabaseHandlers()
  registerAMS2Handlers()
  registerCommentaryHandlers(mainWindow)
  registerNarrativeHandlers()
  registerLiveryHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean shutdown: close SQLite database and stop background services
app.on('will-quit', () => {
  closeDatabase()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Export for use in other modules
export { mainWindow }

