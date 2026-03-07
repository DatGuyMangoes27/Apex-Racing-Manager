/// <reference types="vite/client" />

interface Window {
  api: {
    // Config
    getProjectRoot: () => Promise<string>
    getConfig: () => Promise<{ apiKey?: string; apiKeys?: string[]; projectRoot: string; dailyBudget?: number }>
    saveConfig: (config: Record<string, unknown>) => Promise<boolean>
    setProjectRoot: (rootPath?: string) => Promise<{ success: boolean; projectRoot?: string; error?: string }>

    // File I/O
    readJson: (filePath: string) => Promise<any>
    writeJson: (filePath: string, data: unknown) => Promise<boolean>
    fileExists: (filePath: string) => Promise<boolean>
    listFiles: (dirPath: string, extension?: string) => Promise<string[]>
    writeImage: (filePath: string, base64Data: string) => Promise<boolean>
    getImagePath: (relativePath: string) => Promise<string>

    // State
    readState: (name: string) => Promise<any>
    writeState: (name: string, data: unknown) => Promise<boolean>

    // Existing data
    loadExistingProfiles: (filename: string) => Promise<any[]>
    loadExistingManifest: () => Promise<any>
    readSourceFile: (relativePath: string) => Promise<string | null>

    // Publish
    publishToApp: () => Promise<{ success: boolean; error?: string }>

    // Utilities
    countImages: (relativePath: string) => Promise<number>
    selectFolder: () => Promise<string | null>

    // Generation Engine
    getGenerationSummary: (dailyBudget?: number) => Promise<{
      textTasks: number
      imageTasks: number
      byCategory: Record<string, { text: number; image: number }>
      estimatedApiCalls: number
      estimatedDays: number
      error?: string
    }>
    getBatchState: () => Promise<{
      completedIds: string[]
      failedIds: Record<string, string>
      imagesBudgetUsedToday: number
      lastBudgetResetDate: string
      dailyBudget: number
      totalProcessed: number
      totalFailed: number
      lastProcessedAt: string
    } | null>
    getImagesRemaining: () => Promise<number>
    startTextGeneration: (apiKeys: string | string[], dailyBudget?: number) => Promise<{ success: boolean; taskCount?: number; error?: string }>
    startImageGeneration: (apiKeys: string | string[], dailyBudget?: number) => Promise<{ success: boolean; taskCount?: number; error?: string }>
    pauseGeneration: () => Promise<boolean>
    resumeGeneration: () => Promise<boolean>
    stopGeneration: () => Promise<boolean>

    // Content Browser
    listGeneratedProfiles: (category: string) => Promise<any[]>
    loadProfile: (category: string, id: string) => Promise<any>

    // Events
    onGenerationProgress: (callback: (event: {
      type: string
      taskId?: string
      entityName?: string
      category?: string
      taskType?: string
      message: string
      current?: number
      total?: number
      imagesRemaining?: number
    }) => void) => () => void
  }
}
