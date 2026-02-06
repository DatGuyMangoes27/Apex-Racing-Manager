/// <reference types="vite/client" />

// Electron API types for preload bridge
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ElectronAPI {
  isMaximized: () => Promise<boolean>
  onMaximizedChange: (callback: (maximized: boolean) => void) => void
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  showSaveDialog: (options: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) => Promise<{ canceled: boolean; filePath?: string }>
  showOpenDialog: (options: { filters: Array<{ name: string; extensions: string[] }>; properties: string[] }) => Promise<{ canceled: boolean; filePaths?: string[] }>
  saveFile: (filePath: string, data: string) => Promise<void>
  readFile: (filePath: string) => Promise<string>
  getAMS2DocsPath: () => Promise<string>
  getAMS2TracksPath: () => Promise<string>
  getAMS2CarsPath: () => Promise<string>
  parseXMLFile: (filePath: string) => Promise<unknown>
  // IPC renderer methods
  on: (channel: string, callback: (...args: any[]) => void) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  removeListener?: (channel: string, callback: (...args: any[]) => void) => void
  // Telemetry-specific
  startTelemetry?: (...args: any[]) => any
  stopTelemetry?: (...args: any[]) => any
  getTelemetryStatus?: (...args: any[]) => Promise<any>
  onTelemetryData?: (callback: (...args: any[]) => void) => any
  onTelemetryStatus?: (callback: (...args: any[]) => void) => any
  onTelemetryError?: (callback: (...args: any[]) => void) => any
  onTelemetryLog?: (callback: (...args: any[]) => void) => any
  onCommentaryLog?: (callback: (...args: any[]) => void) => any
  // Career save/load
  saveCareer?: (...args: any[]) => Promise<any>
  loadCareer?: (...args: any[]) => Promise<any>
  // Log management
  getBufferedLogs?: (...args: any[]) => Promise<any>
  saveLogsToFile?: (...args: any[]) => Promise<any>
  // Settings
  getSettings?: (...args: any[]) => Promise<any>
  // Commentary system
  startScheduler?: (...args: any[]) => any
  updateSchedulerLap?: (...args: any[]) => any
  stopScheduler?: (...args: any[]) => any
  generateContentPool?: (...args: any[]) => Promise<any>
  clearContentPool?: (...args: any[]) => any
  setCommentaryCareerData?: (...args: any[]) => any
  setCommentaryAPIKeys?: (...args: any[]) => any
  setCommentaryVoices?: (...args: any[]) => any
  setPitReporterVoice?: (...args: any[]) => any
  setCommentaryEnabled?: (...args: any[]) => any
  testCommentaryConnection?: (...args: any[]) => Promise<any>
  testCommentaryEvent?: (...args: any[]) => Promise<any>
  onCommentaryScript?: (callback: (...args: any[]) => void) => any
  getCommentaryAudioDevices?: (...args: any[]) => Promise<any>
  testCommentaryAudio?: (...args: any[]) => Promise<any>
  setCommentaryAudioDevice?: (...args: any[]) => any
  testCommentaryBanter?: (...args: any[]) => Promise<any>
  testCommentaryStreaming?: (...args: any[]) => Promise<any>
  testCommentaryQueueSequence?: (...args: any[]) => Promise<any>
  // Streaming audio
  onStreamingAudioChunk?: (callback: (...args: any[]) => void) => any
  onStreamingAudioEnd?: (callback: (...args: any[]) => void) => any
  onStreamingAudioStop?: (callback: (...args: any[]) => void) => any
  // Narrative generation
  generateDriverNarratives?: (...args: any[]) => Promise<any>
  generateTeamNarratives?: (...args: any[]) => Promise<any>
  // Allow any additional methods from preload bridge
  [key: string]: ((...args: any[]) => any) | undefined
}

interface Window {
  electronAPI?: ElectronAPI
  electron?: ElectronAPI
}
