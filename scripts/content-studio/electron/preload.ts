import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  // Config
  getProjectRoot: () => ipcRenderer.invoke('get-project-root'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-config', config),
  setProjectRoot: (rootPath?: string) => ipcRenderer.invoke('set-project-root', rootPath),

  // File I/O
  readJson: (filePath: string) => ipcRenderer.invoke('read-json', filePath),
  writeJson: (filePath: string, data: unknown) => ipcRenderer.invoke('write-json', filePath, data),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  listFiles: (dirPath: string, extension?: string) => ipcRenderer.invoke('list-files', dirPath, extension),
  writeImage: (filePath: string, base64Data: string) => ipcRenderer.invoke('write-image', filePath, base64Data),
  getImagePath: (relativePath: string) => ipcRenderer.invoke('get-image-path', relativePath),

  // State persistence
  readState: (name: string) => ipcRenderer.invoke('read-state', name),
  writeState: (name: string, data: unknown) => ipcRenderer.invoke('write-state', name, data),

  // Existing data from main project
  loadExistingProfiles: (filename: string) => ipcRenderer.invoke('load-existing-profiles', filename),
  loadExistingManifest: () => ipcRenderer.invoke('load-existing-manifest'),
  readSourceFile: (relativePath: string) => ipcRenderer.invoke('read-source-file', relativePath),

  // Publish
  publishToApp: () => ipcRenderer.invoke('publish-to-app'),

  // Utilities
  countImages: (relativePath: string) => ipcRenderer.invoke('count-images', relativePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // ============================================================
  // Generation Engine
  // ============================================================

  getGenerationSummary: (dailyBudget?: number) => ipcRenderer.invoke('get-generation-summary', dailyBudget),
  getBatchState: () => ipcRenderer.invoke('get-batch-state'),
  getImagesRemaining: () => ipcRenderer.invoke('get-images-remaining'),

  // Start/stop generation (accepts single key or array of keys)
  startTextGeneration: (apiKeys: string | string[], dailyBudget?: number) =>
    ipcRenderer.invoke('start-text-generation', apiKeys, dailyBudget),
  startImageGeneration: (apiKeys: string | string[], dailyBudget?: number) =>
    ipcRenderer.invoke('start-image-generation', apiKeys, dailyBudget),
  pauseGeneration: () => ipcRenderer.invoke('pause-generation'),
  resumeGeneration: () => ipcRenderer.invoke('resume-generation'),
  stopGeneration: () => ipcRenderer.invoke('stop-generation'),

  // ============================================================
  // Content Browser
  // ============================================================

  listGeneratedProfiles: (category: string) =>
    ipcRenderer.invoke('list-generated-profiles', category),
  loadProfile: (category: string, id: string) =>
    ipcRenderer.invoke('load-profile', category, id),

  // ============================================================
  // Generation progress events (main -> renderer)
  // ============================================================

  onGenerationProgress: (callback: (event: any) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, event: any) => callback(event)
    ipcRenderer.on('generation-progress', handler)
    return () => ipcRenderer.removeListener('generation-progress', handler)
  },
}

contextBridge.exposeInMainWorld('api', api)
