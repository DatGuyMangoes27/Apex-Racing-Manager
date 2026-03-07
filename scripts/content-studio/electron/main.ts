import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { BatchProcessor, ProgressEvent } from './services/batch-processor'
import { createAllTextTasks, createAllImageTasks, getGenerationSummary } from './services/generators'
import { DataReader } from './services/data-reader'

// Resolve the project root (the main AMS2 Career Mod directory)
function getProjectRoot(): string {
  // 1. Check stored config first (user may have set it previously)
  const configPath = path.join(app.getPath('userData'), 'config.json')
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.projectRoot && fs.existsSync(path.join(config.projectRoot, 'src', 'data'))) {
        return config.projectRoot
      }
    } catch { /* ignore corrupt config */ }
  }

  // 2. In dev: content-studio is at scripts/content-studio/
  const devRoot = path.resolve(__dirname, '..', '..', '..')
  if (fs.existsSync(path.join(devRoot, 'src', 'data'))) {
    return devRoot
  }

  // 3. Try common locations
  const commonPaths = [
    path.join(process.env.USERPROFILE || '', 'Carrer Mod'),
    path.join(process.env.USERPROFILE || '', 'Career Mod'),
    path.join(process.env.USERPROFILE || '', 'Documents', 'Carrer Mod'),
    path.join(process.env.USERPROFILE || '', 'Documents', 'Career Mod'),
  ]
  for (const p of commonPaths) {
    if (fs.existsSync(path.join(p, 'src', 'data'))) {
      // Save it for next time
      saveProjectRoot(p)
      return p
    }
  }

  // 4. Return empty - will prompt user in the UI
  return ''
}

function saveProjectRoot(root: string) {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  let config: Record<string, any> = {}
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch { /* */ }
  }
  config.projectRoot = root
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

let mainWindow: BrowserWindow | null = null
let projectRoot: string = ''
let batchProcessor: BatchProcessor | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: 'AMS2 Content Studio',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  // In dev, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  projectRoot = getProjectRoot()
  console.log('[ContentStudio] Project root:', projectRoot)
  createWindow()
  registerIpcHandlers()
})

app.on('window-all-closed', () => {
  app.quit()
})

// ============================================================
// Path helpers
// ============================================================

function paths() {
  const scriptsOutput = path.join(projectRoot, 'scripts', 'content-studio-data', 'output')
  const publicData = path.join(projectRoot, 'public', 'data')
  const publicImages = path.join(projectRoot, 'public', 'images', 'generated')
  const existingProfiles = path.join(projectRoot, 'scripts', 'generate-assets', 'output', 'profiles')
  const srcData = path.join(projectRoot, 'src', 'data')
  const stateDir = path.join(projectRoot, 'scripts', 'content-studio-data', 'state')

  return { scriptsOutput, publicData, publicImages, existingProfiles, srcData, stateDir, projectRoot }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ============================================================
// IPC Handlers
// ============================================================

function registerIpcHandlers() {
  const p = paths()

  // Ensure all output directories exist
  ensureDir(path.join(p.scriptsOutput, 'profiles'))
  ensureDir(path.join(p.scriptsOutput, 'narratives'))
  ensureDir(p.stateDir)
  ensureDir(path.join(p.publicData, 'profiles'))
  ensureDir(path.join(p.publicData, 'teams'))
  ensureDir(path.join(p.publicData, 'tracks'))

  // --- Config ---
  ipcMain.handle('get-project-root', () => p.projectRoot)

  ipcMain.handle('get-config', () => {
    const configPath = path.join(app.getPath('userData'), 'config.json')
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
    return { apiKey: '', projectRoot: p.projectRoot }
  })

  ipcMain.handle('save-config', (_e, config: Record<string, unknown>) => {
    const configPath = path.join(app.getPath('userData'), 'config.json')
    // Merge with existing config so we don't lose projectRoot
    let existing: Record<string, any> = {}
    if (fs.existsSync(configPath)) {
      try { existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch { /* */ }
    }
    const merged = { ...existing, ...config }
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2))
    return true
  })

  // Set project root (user selected via folder picker)
  ipcMain.handle('set-project-root', async (_e, rootPath?: string) => {
    let selectedPath = rootPath
    if (!selectedPath) {
      if (!mainWindow) return { success: false, error: 'No window' }
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select your AMS2 Career Mod project folder',
        properties: ['openDirectory'],
      })
      if (result.canceled || !result.filePaths[0]) return { success: false, error: 'Cancelled' }
      selectedPath = result.filePaths[0]
    }

    // Validate
    if (!fs.existsSync(path.join(selectedPath, 'src', 'data'))) {
      return { success: false, error: 'Invalid project folder - src/data not found' }
    }

    projectRoot = selectedPath
    saveProjectRoot(selectedPath)

    return { success: true, projectRoot: selectedPath }
  })

  // --- File I/O ---
  ipcMain.handle('read-json', (_e, filePath: string) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(p.projectRoot, filePath)
    if (!fs.existsSync(fullPath)) return null
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  })

  ipcMain.handle('write-json', (_e, filePath: string, data: unknown) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(p.projectRoot, filePath)
    ensureDir(path.dirname(fullPath))
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2))
    return true
  })

  ipcMain.handle('file-exists', (_e, filePath: string) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(p.projectRoot, filePath)
    return fs.existsSync(fullPath)
  })

  ipcMain.handle('list-files', (_e, dirPath: string, extension?: string) => {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(p.projectRoot, dirPath)
    if (!fs.existsSync(fullPath)) return []
    let files = fs.readdirSync(fullPath)
    if (extension) {
      files = files.filter(f => f.endsWith(extension))
    }
    return files
  })

  ipcMain.handle('write-image', (_e, filePath: string, base64Data: string) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(p.projectRoot, filePath)
    ensureDir(path.dirname(fullPath))
    fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'))
    return true
  })

  ipcMain.handle('get-image-path', (_e, relativePath: string) => {
    return path.join(p.publicImages, relativePath)
  })

  // --- State ---
  ipcMain.handle('read-state', (_e, name: string) => {
    const statePath = path.join(p.stateDir, `${name}.json`)
    if (!fs.existsSync(statePath)) return null
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
  })

  ipcMain.handle('write-state', (_e, name: string, data: unknown) => {
    ensureDir(p.stateDir)
    const statePath = path.join(p.stateDir, `${name}.json`)
    fs.writeFileSync(statePath, JSON.stringify(data, null, 2))
    return true
  })

  // --- Existing Data ---
  ipcMain.handle('load-existing-profiles', (_e, filename: string) => {
    const filePath = path.join(p.existingProfiles, filename)
    if (!fs.existsSync(filePath)) return []
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  })

  ipcMain.handle('load-existing-manifest', () => {
    const manifestPath = path.join(p.projectRoot, 'scripts', 'generate-assets', 'output', 'manifest.json')
    if (!fs.existsSync(manifestPath)) return null
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  })

  ipcMain.handle('read-source-file', (_e, relativePath: string) => {
    const fullPath = path.join(p.projectRoot, relativePath)
    if (!fs.existsSync(fullPath)) return null
    return fs.readFileSync(fullPath, 'utf-8')
  })

  // --- Publish to App ---
  ipcMain.handle('publish-to-app', () => {
    try {
      const stats = {
        staff: 0,
        partners: 0,
        contacts: 0,
        sponsors: 0,
        driverNarratives: 0,
        teamNarratives: 0,
        preracePools: 0,
        trackNarratives: 0,
        portraits: { staff: 0, partners: 0, contacts: 0 }
      }

      // ── 1. Copy profiles into category-specific pool directories ──
      const profilesDir = path.join(p.scriptsOutput, 'profiles')
      if (fs.existsSync(profilesDir)) {
        for (const file of fs.readdirSync(profilesDir)) {
          if (!file.endsWith('.json')) continue

          let destDir: string
          if (file.startsWith('staff-')) {
            destDir = path.join(p.publicData, 'staff-pool')
            stats.staff++
          } else if (file.startsWith('partner-')) {
            destDir = path.join(p.publicData, 'partner-pool')
            stats.partners++
          } else if (file.startsWith('contact-')) {
            destDir = path.join(p.publicData, 'contact-pool')
            stats.contacts++
          } else if (file.startsWith('sponsor-')) {
            destDir = path.join(p.publicData, 'sponsor-pool')
            stats.sponsors++
          } else {
            // Legacy fallback: dump into profiles/
            destDir = path.join(p.publicData, 'profiles')
          }
          ensureDir(destDir)
          fs.copyFileSync(path.join(profilesDir, file), path.join(destDir, file))
        }
      }

      // ── 2. Copy narratives into category-specific directories ──
      const narrativesDir = path.join(p.scriptsOutput, 'narratives')
      if (fs.existsSync(narrativesDir)) {
        for (const file of fs.readdirSync(narrativesDir)) {
          if (!file.endsWith('.json')) continue

          let destDir: string
          if (file.startsWith('driver-')) {
            destDir = path.join(p.publicData, 'driver-narratives')
            stats.driverNarratives++
          } else if (file.startsWith('team-')) {
            destDir = path.join(p.publicData, 'team-narratives')
            stats.teamNarratives++
          } else if (file.startsWith('prerace-')) {
            destDir = path.join(p.publicData, 'prerace-pools')
            stats.preracePools++
          } else if (file.startsWith('track-')) {
            destDir = path.join(p.publicData, 'tracks')
            stats.trackNarratives++
          } else {
            destDir = path.join(p.publicData, 'profiles')
          }
          ensureDir(destDir)
          fs.copyFileSync(path.join(narrativesDir, file), path.join(destDir, file))
        }
      }

      // ── 3. Scan portrait images ──
      const portraitDirs = [
        { dir: path.join(p.publicImages, 'portraits', 'staff'), key: 'staff' as const },
        { dir: path.join(p.publicImages, 'partners'), key: 'partners' as const },
        { dir: path.join(p.publicImages, 'contacts'), key: 'contacts' as const }
      ]
      const portraitMap: Record<string, string> = {}
      for (const { dir, key } of portraitDirs) {
        if (fs.existsSync(dir)) {
          for (const file of fs.readdirSync(dir)) {
            if (file.endsWith('.png') || file.endsWith('.jpg')) {
              const id = file.replace(/\.(png|jpg)$/, '')
              portraitMap[id] = `${key}/${file}`
              stats.portraits[key]++
            }
          }
        }
      }

      // ── 4. Build ID index lists for the TypeScript manifest ──
      const collectIds = (dir: string): string[] => {
        if (!fs.existsSync(dir)) return []
        return fs.readdirSync(dir)
          .filter(f => f.endsWith('.json'))
          .map(f => f.replace('.json', ''))
          .sort()
      }

      const staffIds = collectIds(path.join(p.publicData, 'staff-pool'))
      const partnerIds = collectIds(path.join(p.publicData, 'partner-pool'))
      const contactIds = collectIds(path.join(p.publicData, 'contact-pool'))
      const sponsorIds = collectIds(path.join(p.publicData, 'sponsor-pool'))
      const driverNarrativeIds = collectIds(path.join(p.publicData, 'driver-narratives'))
      const teamNarrativeIds = collectIds(path.join(p.publicData, 'team-narratives'))
      const preracePoolIds = collectIds(path.join(p.publicData, 'prerace-pools'))
      const trackNarrativeIds = collectIds(path.join(p.publicData, 'tracks'))

      // ── 5. Generate TypeScript manifest ──
      const manifestTs = `// Auto-generated by Content Studio "Publish to App" — DO NOT EDIT
// Generated: ${new Date().toISOString()}

export const CONTENT_MANIFEST = {
  version: '1.0.0',
  generatedAt: '${new Date().toISOString()}',

  staff: {
    ids: ${JSON.stringify(staffIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${staffIds.length},
    basePath: '/data/staff-pool'
  },

  partners: {
    ids: ${JSON.stringify(partnerIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${partnerIds.length},
    basePath: '/data/partner-pool'
  },

  contacts: {
    ids: ${JSON.stringify(contactIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${contactIds.length},
    basePath: '/data/contact-pool'
  },

  sponsors: {
    ids: ${JSON.stringify(sponsorIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${sponsorIds.length},
    basePath: '/data/sponsor-pool'
  },

  driverNarratives: {
    ids: ${JSON.stringify(driverNarrativeIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${driverNarrativeIds.length},
    basePath: '/data/driver-narratives'
  },

  teamNarratives: {
    ids: ${JSON.stringify(teamNarrativeIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${teamNarrativeIds.length},
    basePath: '/data/team-narratives'
  },

  preracePools: {
    ids: ${JSON.stringify(preracePoolIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${preracePoolIds.length},
    basePath: '/data/prerace-pools'
  },

  trackNarratives: {
    ids: ${JSON.stringify(trackNarrativeIds, null, 4).replace(/^/gm, '    ').trim()},
    count: ${trackNarrativeIds.length},
    basePath: '/data/tracks'
  },

  portraits: ${JSON.stringify(portraitMap, null, 2).replace(/^/gm, '  ').trim()},

  stats: {
    staff: ${stats.staff},
    partners: ${stats.partners},
    contacts: ${stats.contacts},
    sponsors: ${stats.sponsors},
    driverNarratives: ${stats.driverNarratives},
    teamNarratives: ${stats.teamNarratives},
    preracePools: ${stats.preracePools},
    trackNarratives: ${stats.trackNarratives},
    totalProfiles: ${stats.staff + stats.partners + stats.contacts + stats.sponsors},
    totalNarratives: ${stats.driverNarratives + stats.teamNarratives + stats.preracePools + stats.trackNarratives}
  }
} as const

export type ContentManifest = typeof CONTENT_MANIFEST
`

      ensureDir(p.srcData)
      fs.writeFileSync(path.join(p.srcData, 'content-manifest.ts'), manifestTs)

      // ── 6. Merge championship logos into EXISTING generated-manifest.json ──
      // IMPORTANT: Always load the existing manifest first to preserve all
      // previously generated asset entries (drivers, staff portraits, etc.)
      const generatedManifestPath = path.join(p.srcData, 'generated-manifest.json')
      let manifestData: Record<string, any> = {}

      // Load existing manifest to preserve all data
      if (fs.existsSync(generatedManifestPath)) {
        try {
          manifestData = JSON.parse(fs.readFileSync(generatedManifestPath, 'utf-8'))
          console.log(`[Publish] Loaded existing generated-manifest.json (${manifestData.stats?.totalAssets ?? '?'} assets)`)
        } catch (e) {
          console.warn('[Publish] Failed to parse existing generated-manifest.json, starting fresh')
          manifestData = {}
        }
      }

      // Also merge from legacy generate-assets output if it exists
      const manifestSrc = path.join(p.scriptsOutput, 'manifest.json')
      if (fs.existsSync(manifestSrc)) {
        try {
          const legacyData = JSON.parse(fs.readFileSync(manifestSrc, 'utf-8'))
          // Deep merge legacy data into manifest (existing entries take precedence)
          for (const [key, val] of Object.entries(legacyData)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              manifestData[key] = { ...(val as Record<string, any>), ...(manifestData[key] || {}) }
            } else if (manifestData[key] === undefined) {
              manifestData[key] = val
            }
          }
        } catch (e) {
          console.warn('[Publish] Could not read legacy manifest.json:', e)
        }
      }

      // Scan for championship logos generated by Content Studio
      const champLogoDir = path.join(p.publicImages, 'logos', 'championships')
      if (fs.existsSync(champLogoDir)) {
        if (!manifestData.championships) manifestData.championships = {}
        for (const file of fs.readdirSync(champLogoDir)) {
          if (!file.endsWith('.png') && !file.endsWith('.jpg')) continue
          const champId = file.replace(/\.(png|jpg)$/, '')
          if (!manifestData.championships[champId]) {
            manifestData.championships[champId] = {
              name: champId,
              shortName: champId.substring(0, 6).toUpperCase(),
              type: 'unknown',
              region: 'unknown',
              tier: 'unknown',
              logo: `logos/championships/${file}`,
              generatedAt: new Date().toISOString()
            }
          }
        }
      }

      manifestData.lastUpdated = new Date().toISOString()
      fs.writeFileSync(generatedManifestPath, JSON.stringify(manifestData, null, 2))

      console.log(`[Publish] Complete: ${stats.staff} staff, ${stats.partners} partners, ${stats.contacts} contacts, ${stats.sponsors} sponsors, ${stats.driverNarratives} driver narr., ${stats.teamNarratives} team narr., ${stats.preracePools} prerace pools`)

      return { success: true, stats }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // --- Count images in directory ---
  ipcMain.handle('count-images', (_e, relativePath: string) => {
    const fullPath = path.join(p.publicImages, relativePath)
    if (!fs.existsSync(fullPath)) return 0
    return fs.readdirSync(fullPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length
  })

  // --- Select folder dialog ---
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // ============================================================
  // Generation Engine IPC
  // ============================================================

  // Get summary of what needs generating
  ipcMain.handle('get-generation-summary', (_e, dailyBudget?: number) => {
    try {
      return getGenerationSummary(p.projectRoot, dailyBudget || 2000)
    } catch (err) {
      return { error: String(err) }
    }
  })

  // Get batch processor state
  ipcMain.handle('get-batch-state', () => {
    return batchProcessor?.getState() || null
  })

  // Start text generation (accepts single key or array of keys)
  ipcMain.handle('start-text-generation', async (_e, apiKeys: string | string[], dailyBudget?: number) => {
    if (batchProcessor?.isRunning) {
      return { success: false, error: 'Generation already running' }
    }

    const onProgress = (event: ProgressEvent) => {
      mainWindow?.webContents.send('generation-progress', event)
    }

    try {
      batchProcessor = new BatchProcessor(p.projectRoot, apiKeys, onProgress, dailyBudget || 2000)

      const tasks = createAllTextTasks(p.projectRoot)
      // Run in background so IPC doesn't block
      batchProcessor.processBatch(tasks).catch((err: Error) => {
        mainWindow?.webContents.send('generation-progress', {
          type: 'error',
          message: `Batch failed: ${err.message}`,
        })
      })
      return { success: true, taskCount: tasks.length }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Start image generation (accepts single key or array of keys)
  ipcMain.handle('start-image-generation', async (_e, apiKeys: string | string[], dailyBudget?: number) => {
    if (batchProcessor?.isRunning) {
      return { success: false, error: 'Generation already running' }
    }

    const onProgress = (event: ProgressEvent) => {
      mainWindow?.webContents.send('generation-progress', event)
    }

    try {
      batchProcessor = new BatchProcessor(p.projectRoot, apiKeys, onProgress, dailyBudget || 2000)

      const tasks = createAllImageTasks(p.projectRoot)
      batchProcessor.processBatch(tasks).catch((err: Error) => {
        mainWindow?.webContents.send('generation-progress', {
          type: 'error',
          message: `Batch failed: ${err.message}`,
        })
      })
      return { success: true, taskCount: tasks.length }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Pause generation
  ipcMain.handle('pause-generation', () => {
    batchProcessor?.pause()
    return true
  })

  // Resume generation
  ipcMain.handle('resume-generation', () => {
    batchProcessor?.resume()
    return true
  })

  // Stop generation
  ipcMain.handle('stop-generation', () => {
    batchProcessor?.stop()
    return true
  })

  // Get images remaining today
  ipcMain.handle('get-images-remaining', () => {
    return batchProcessor?.getImagesRemaining() ?? 2000
  })

  // ============================================================
  // Content Browser IPC
  // ============================================================

  // List generated profiles by category
  ipcMain.handle('list-generated-profiles', (_e, category: string) => {
    const outputDir = path.join(p.projectRoot, 'scripts', 'content-studio-data', 'output')
    const profiles: any[] = []

    const dirs: Record<string, { dir: string; prefix: string }> = {
      drivers: { dir: 'narratives', prefix: 'driver-' },
      teams: { dir: 'narratives', prefix: 'team-' },
      tracks: { dir: 'narratives', prefix: 'track-' },
      prerace: { dir: 'narratives', prefix: 'prerace-' },
      staff: { dir: 'profiles', prefix: 'staff-' },
      partners: { dir: 'profiles', prefix: 'partner-' },
      contacts: { dir: 'profiles', prefix: 'contact-' },
    }

    // Handle image-only categories (lifestyle, misc)
    if (category === 'lifestyle' || category === 'misc') {
      const imageBaseDir = path.join(p.projectRoot, 'public', 'images', 'generated', category)
      if (!fs.existsSync(imageBaseDir)) return []
      
      const subcategories = fs.readdirSync(imageBaseDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
      
      for (const sub of subcategories) {
        const subDir = path.join(imageBaseDir, sub)
        const images = fs.readdirSync(subDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
        
        for (const img of images) {
          const id = img.replace(/\.(png|jpg)$/, '')
          profiles.push({
            id: `${sub}/${id}`,
            name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            subcategory: sub,
            hasImage: true,
            imagePath: path.join(subDir, img),
          })
        }
      }
      
      return profiles
    }

    const config = dirs[category]
    if (!config) return []

    const dir = path.join(outputDir, config.dir)
    if (!fs.existsSync(dir)) return []

    const files = fs.readdirSync(dir).filter(f => f.startsWith(config.prefix) && f.endsWith('.json'))

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
        const id = file.replace('.json', '')

        // Check for portrait image
        const imageCategories: Record<string, string> = {
          drivers: 'drivers',
          staff: 'staff',
          partners: 'partners',
          contacts: 'contacts',
        }
        const imageDir = imageCategories[category]
        let hasImage = false
        let imagePath = ''
        if (imageDir) {
          const imgFile = path.join(p.publicImages, imageDir, `${id}.png`)
          const imgFileJpg = path.join(p.publicImages, imageDir, `${id}.jpg`)
          hasImage = fs.existsSync(imgFile) || fs.existsSync(imgFileJpg)
          imagePath = hasImage ? (fs.existsSync(imgFile) ? imgFile : imgFileJpg) : ''
        }

        profiles.push({
          id,
          ...data,
          hasImage,
          imagePath,
        })
      } catch {
        // Skip corrupt files
      }
    }

    return profiles
  })

  // Load a single profile
  ipcMain.handle('load-profile', (_e, category: string, id: string) => {
    const outputDir = path.join(p.projectRoot, 'scripts', 'content-studio-data', 'output')

    const dirs: Record<string, string> = {
      drivers: 'narratives',
      teams: 'narratives',
      tracks: 'narratives',
      prerace: 'narratives',
      staff: 'profiles',
      partners: 'profiles',
      contacts: 'profiles',
    }

    const dir = dirs[category]
    if (!dir) return null

    const filePath = path.join(outputDir, dir, `${id}.json`)
    if (!fs.existsSync(filePath)) return null

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      return null
    }
  })
}
