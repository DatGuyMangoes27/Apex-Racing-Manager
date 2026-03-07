import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface GenerationSummary {
  textTasks: number
  imageTasks: number
  byCategory: Record<string, { text: number; image: number }>
  estimatedApiCalls: number
  estimatedDays: number
}

interface ProgressEvent {
  type: string
  taskId?: string
  entityName?: string
  category?: string
  taskType?: string
  message: string
  current?: number
  total?: number
  imagesRemaining?: number
  timestamp?: number
}

interface StudioState {
  apiKeys: string[]       // Multiple API keys
  projectRoot: string
  dailyBudget: number
  isLoading: boolean
  summary: GenerationSummary | null
  generationLog: ProgressEvent[]
  isGenerating: boolean
  generationType: 'text' | 'image' | null
  imagesRemaining: number
}

interface StudioContextType extends StudioState {
  setApiKeys: (keys: string[]) => void
  setDailyBudget: (budget: number) => void
  selectProjectRoot: () => Promise<boolean>
  refreshSummary: () => Promise<void>
  startTextGen: () => Promise<void>
  startImageGen: () => Promise<void>
  pauseGen: () => Promise<void>
  resumeGen: () => Promise<void>
  stopGen: () => Promise<void>
  publishToApp: () => Promise<{ success: boolean; error?: string }>
}

const StudioContext = createContext<StudioContextType | null>(null)

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used within StudioProvider')
  return ctx
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [apiKeys, setApiKeysState] = useState<string[]>([])
  const [projectRoot, setProjectRoot] = useState('')
  const [dailyBudget, setDailyBudgetState] = useState(2000)
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<GenerationSummary | null>(null)
  const [generationLog, setGenerationLog] = useState<ProgressEvent[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationType, setGenerationType] = useState<'text' | 'image' | null>(null)
  const [imagesRemaining, setImagesRemaining] = useState(2000)

  // Load config on mount
  useEffect(() => {
    async function init() {
      try {
        const config = await window.api.getConfig()
        // Support both old single key and new multi-key format
        if (config?.apiKeys && Array.isArray(config.apiKeys)) {
          setApiKeysState(config.apiKeys as string[])
        } else if (config?.apiKey) {
          setApiKeysState([config.apiKey as string])
        }
        if (config?.dailyBudget) setDailyBudgetState(config.dailyBudget as number)
        const root = await window.api.getProjectRoot()
        setProjectRoot(root)

        // Load initial summary
        const sum = await window.api.getGenerationSummary(config?.dailyBudget as number || 2000)
        if (!sum.error) setSummary(sum as GenerationSummary)

        // Check images remaining
        const remaining = await window.api.getImagesRemaining()
        setImagesRemaining(remaining)
      } catch (err) {
        console.error('Failed to init:', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Listen for generation progress events
  useEffect(() => {
    const unsub = window.api.onGenerationProgress((event) => {
      const entry: ProgressEvent = { ...event, timestamp: Date.now() }
      setGenerationLog(prev => [...prev.slice(-500), entry])

      // Update images remaining
      if (event.imagesRemaining !== undefined) {
        setImagesRemaining(event.imagesRemaining)
      }

      // Handle terminal events
      if (event.type === 'batch_complete' || event.type === 'budget_exhausted') {
        setIsGenerating(false)
        setGenerationType(null)
      }
    })
    return unsub
  }, [])

  const setApiKeys = useCallback(async (keys: string[]) => {
    const filtered = keys.filter(k => k.trim())
    setApiKeysState(filtered)
    await window.api.saveConfig({ apiKeys: filtered, dailyBudget })
  }, [dailyBudget])

  const setDailyBudget = useCallback(async (budget: number) => {
    setDailyBudgetState(budget)
    await window.api.saveConfig({ apiKeys, dailyBudget: budget })
  }, [apiKeys])

  const selectProjectRoot = useCallback(async () => {
    const result = await window.api.setProjectRoot()
    if (result.success && result.projectRoot) {
      setProjectRoot(result.projectRoot)
      // Refresh summary with new root
      const sum = await window.api.getGenerationSummary(dailyBudget)
      if (!sum.error) setSummary(sum as GenerationSummary)
      return true
    }
    return false
  }, [dailyBudget])

  const refreshSummary = useCallback(async () => {
    const sum = await window.api.getGenerationSummary(dailyBudget)
    if (!sum.error) setSummary(sum as GenerationSummary)
    const remaining = await window.api.getImagesRemaining()
    setImagesRemaining(remaining)
  }, [dailyBudget])

  const startTextGen = useCallback(async () => {
    if (apiKeys.length === 0) return
    setIsGenerating(true)
    setGenerationType('text')
    const result = await window.api.startTextGeneration(apiKeys, dailyBudget)
    if (!result.success) {
      setIsGenerating(false)
      setGenerationType(null)
      setGenerationLog(prev => [...prev, { type: 'error', message: result.error || 'Failed to start', timestamp: Date.now() }])
    }
  }, [apiKeys, dailyBudget])

  const startImageGen = useCallback(async () => {
    if (apiKeys.length === 0) return
    setIsGenerating(true)
    setGenerationType('image')
    const result = await window.api.startImageGeneration(apiKeys, dailyBudget)
    if (!result.success) {
      setIsGenerating(false)
      setGenerationType(null)
      setGenerationLog(prev => [...prev, { type: 'error', message: result.error || 'Failed to start', timestamp: Date.now() }])
    }
  }, [apiKeys, dailyBudget])

  const pauseGen = useCallback(async () => {
    await window.api.pauseGeneration()
  }, [])

  const resumeGen = useCallback(async () => {
    await window.api.resumeGeneration()
  }, [])

  const stopGen = useCallback(async () => {
    await window.api.stopGeneration()
    setIsGenerating(false)
    setGenerationType(null)
  }, [])

  const publish = useCallback(async () => {
    return await window.api.publishToApp()
  }, [])

  return (
    <StudioContext.Provider value={{
      apiKeys, projectRoot, dailyBudget, isLoading, summary, generationLog,
      isGenerating, generationType, imagesRemaining,
      setApiKeys, setDailyBudget, selectProjectRoot, refreshSummary,
      startTextGen, startImageGen, pauseGen, resumeGen, stopGen,
      publishToApp: publish,
    }}>
      {children}
    </StudioContext.Provider>
  )
}
