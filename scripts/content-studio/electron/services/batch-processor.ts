/**
 * Batch Processor - Orchestrates text and image generation with:
 * - PARALLEL workers (configurable concurrency, default 10)
 * - Daily image budget tracking (2000/day default)
 * - Resume across sessions (saves state to disk)
 * - Priority ordering (non-drivers before drivers for images)
 * - Real-time progress events via callback
 * - Pause/stop support
 * - Automatic backoff when rate limited
 */

import fs from 'fs'
import path from 'path'
import { generateTextBatch } from './gemini-text'
import { generateImage, ImageResult } from './gemini-image'

export interface GenerationTask {
  id: string
  entityId: string
  entityName: string
  category: string
  type: 'text' | 'image'
  priority: number
  prompt: string
  outputPath: string
  model?: string            // Override the default model (e.g. 'gemini-3-pro-image-preview' for partners)
  metadata?: Record<string, any>
}

export interface BatchState {
  completedIds: string[]
  failedIds: Record<string, string>
  imagesBudgetUsedToday: number
  lastBudgetResetDate: string
  dailyBudget: number
  totalProcessed: number
  totalFailed: number
  lastProcessedAt: string
}

export type ProgressCallback = (event: ProgressEvent) => void

export interface ProgressEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'paused' | 'budget_exhausted' | 'batch_complete' | 'rate_limited'
  taskId?: string
  entityName?: string
  category?: string
  taskType?: 'text' | 'image'
  message: string
  current?: number
  total?: number
  imagesRemaining?: number
}

const DEFAULT_TEXT_CONCURRENCY = 20
const DEFAULT_IMAGE_CONCURRENCY = 20  // 20 parallel workers for standard model images
const PRO_MODEL_DELAY_MS = 15000      // 15s minimum between requests per key for premium models
const RATE_LIMIT_COOLDOWN = 30000     // 30s cooldown when rate limited
const STATE_SAVE_INTERVAL = 10        // Save state every N completions

export class BatchProcessor {
  private stateFile: string
  private state: BatchState
  private running = false
  private paused = false
  private rateLimited = false
  private onProgress: ProgressCallback
  private apiKeys: string[]          // Multiple API keys for round-robin
  private projectRoot: string
  private concurrency: number
  private activeWorkers = 0
  private processed = 0
  private totalPending = 0
  private keyIndex = 0               // Round-robin counter
  private keyLastUsed: Map<string, number> = new Map()  // Per-key timing for pro model throttling

  constructor(
    projectRoot: string,
    apiKeys: string | string[],       // Accept single key or array of keys
    onProgress: ProgressCallback,
    dailyBudget: number = 2000,
    concurrency?: number
  ) {
    this.projectRoot = projectRoot
    // Normalize to array, filter empty
    this.apiKeys = (Array.isArray(apiKeys) ? apiKeys : [apiKeys]).filter(k => k.trim())
    if (this.apiKeys.length === 0) throw new Error('No API keys provided')
    this.onProgress = onProgress
    // Scale concurrency with number of keys (4 workers per key for text, 2 for images)
    this.concurrency = concurrency || Math.max(DEFAULT_TEXT_CONCURRENCY, this.apiKeys.length * 4)
    this.stateFile = path.join(projectRoot, 'scripts', 'content-studio-data', 'batch-state.json')

    this.state = this.loadState(dailyBudget)
    this.checkDailyReset()
  }

  // Get next API key (round-robin across all keys)
  private getNextKey(): string {
    const key = this.apiKeys[this.keyIndex % this.apiKeys.length]
    this.keyIndex++
    return key
  }

  // ---- Public API ----

  get isRunning() { return this.running }
  get isPaused() { return this.paused }

  getState(): BatchState { return { ...this.state } }

  getImagesRemaining(): number {
    this.checkDailyReset()
    return Math.max(0, this.state.dailyBudget - this.state.imagesBudgetUsedToday)
  }

  pause() {
    this.paused = true
    this.onProgress({ type: 'paused', message: 'Generation paused by user' })
  }

  resume() {
    this.paused = false
  }

  stop() {
    this.running = false
    this.paused = false
    this.saveState()
  }

  isCompleted(taskId: string): boolean {
    return this.state.completedIds.includes(taskId)
  }

  /**
   * Process a batch of tasks with parallel workers.
   * For image batches, automatically splits into two phases:
   *   Phase 1: Premium model tasks (e.g. Nano Banana Pro) with 1 worker per key + spacing
   *   Phase 2: Standard model tasks with full concurrency
   */
  async processBatch(tasks: GenerationTask[], concurrencyOverride?: number): Promise<void> {
    if (this.running) {
      console.log('Batch already running, ignoring new batch call')
      return
    }

    this.running = true
    this.paused = false
    this.processed = 0
    this.rateLimited = false

    // Sort by priority, filter completed
    const sorted = [...tasks].sort((a, b) => a.priority - b.priority)
    const pending = sorted.filter(t => !this.state.completedIds.includes(t.id))
    this.totalPending = pending.length

    if (pending.length === 0) {
      this.running = false
      this.onProgress({
        type: 'batch_complete',
        message: 'All tasks already complete!',
        current: 0,
        total: 0,
      })
      return
    }

    // Split into premium model tasks and standard tasks
    const premiumTasks = pending.filter(t => !!t.model)
    const standardTasks = pending.filter(t => !t.model)

    const maxWorkers = concurrencyOverride || this.concurrency
    const isImageBatch = pending.some(t => t.type === 'image')
    const standardConcurrency = isImageBatch
      ? Math.min(maxWorkers, DEFAULT_IMAGE_CONCURRENCY)
      : maxWorkers
    // Premium model: 1 worker per API key (with built-in delay between requests)
    const premiumConcurrency = this.apiKeys.length

    const totalMsg = premiumTasks.length > 0
      ? `Starting batch: ${pending.length} tasks (${premiumTasks.length} premium + ${standardTasks.length} standard) across ${this.apiKeys.length} API key(s) (${sorted.length - pending.length} already complete)`
      : `Starting batch: ${pending.length} tasks with ${standardConcurrency} parallel workers across ${this.apiKeys.length} API key(s) (${sorted.length - pending.length} already complete)`

    this.onProgress({
      type: 'start',
      message: totalMsg,
      total: pending.length,
      current: 0,
    })

    // Launch premium and standard pools SIMULTANEOUSLY (different models, separate rate limits)
    const pools: Promise<void>[] = []

    if (premiumTasks.length > 0 && this.running) {
      this.onProgress({
        type: 'progress',
        message: `[Pro] Launching ${premiumTasks.length} premium model tasks with ${premiumConcurrency} workers (1 per key, ${PRO_MODEL_DELAY_MS / 1000}s spacing)`,
        current: this.processed,
        total: this.totalPending,
      })
      pools.push(this.runWorkerPool(premiumTasks, premiumConcurrency, true))
    }

    if (standardTasks.length > 0 && this.running) {
      this.onProgress({
        type: 'progress',
        message: `[Standard] Launching ${standardTasks.length} standard model tasks with ${standardConcurrency} workers`,
        current: this.processed,
        total: this.totalPending,
      })
      pools.push(this.runWorkerPool(standardTasks, standardConcurrency, false))
    }

    await Promise.all(pools)

    this.saveState()
    this.running = false

    this.onProgress({
      type: 'batch_complete',
      message: `Batch finished: ${this.processed} processed, ${Object.keys(this.state.failedIds).length} failed`,
      current: this.processed,
      total: this.totalPending,
    })
  }

  /**
   * Run a pool of workers against a task list.
   * @param isPremium  If true, each worker waits for per-key cooldown between requests
   */
  private async runWorkerPool(
    taskList: GenerationTask[],
    concurrency: number,
    isPremium: boolean
  ): Promise<void> {
    let nextIndex = 0

    const getNextTask = (): GenerationTask | null => {
      while (nextIndex < taskList.length) {
        const task = taskList[nextIndex++]

        // For image tasks, check budget
        if (task.type === 'image') {
          this.checkDailyReset()
          if (this.state.imagesBudgetUsedToday >= this.state.dailyBudget) {
            this.onProgress({
              type: 'budget_exhausted',
              message: `Daily image budget exhausted (${this.state.dailyBudget}). Will resume tomorrow.`,
              imagesRemaining: 0,
            })
            return null
          }
        }

        return task
      }
      return null
    }

    // Each worker in premium mode is pinned to a specific key
    const worker = async (workerId: number): Promise<void> => {
      // In premium mode, each worker uses a dedicated key (pinned)
      const pinnedKey = isPremium ? this.apiKeys[(workerId - 1) % this.apiKeys.length] : ''

      while (this.running) {
        // Wait while paused
        while (this.paused && this.running) {
          await new Promise(r => setTimeout(r, 500))
        }
        if (!this.running) break

        // Wait while rate limited
        while (this.rateLimited && this.running) {
          await new Promise(r => setTimeout(r, 1000))
        }
        if (!this.running) break

        const task = getNextTask()
        if (!task) break

        // Choose API key: pinned for premium, round-robin for standard
        const apiKey = isPremium ? pinnedKey : this.getNextKey()
        const keyNum = this.apiKeys.indexOf(apiKey) + 1

        // Premium model: enforce per-key spacing to avoid rate limits
        if (isPremium) {
          const lastUsed = this.keyLastUsed.get(apiKey) || 0
          const elapsed = Date.now() - lastUsed
          if (elapsed < PRO_MODEL_DELAY_MS) {
            const waitMs = PRO_MODEL_DELAY_MS - elapsed
            await new Promise(r => setTimeout(r, waitMs))
          }
        }

        this.activeWorkers++

        try {
          const modelLabel = task.model ? ' [Pro]' : ''
          this.onProgress({
            type: 'progress',
            taskId: task.id,
            entityName: task.entityName,
            category: task.category,
            taskType: task.type,
            message: `[W${workerId}/K${keyNum}]${modelLabel} ${task.type === 'text' ? 'Generating text' : 'Generating image'}: ${task.entityName}`,
            current: this.processed,
            total: this.totalPending,
            imagesRemaining: task.type === 'image' ? this.getImagesRemaining() : undefined,
          })

          // Track key usage time BEFORE the call
          if (isPremium) {
            this.keyLastUsed.set(apiKey, Date.now())
          }

          if (task.type === 'text') {
            await this.processTextTask(task, apiKey)
          } else {
            await this.processImageTask(task, apiKey, task.model)
          }

          // Mark complete
          this.state.completedIds.push(task.id)
          this.state.totalProcessed++
          this.state.lastProcessedAt = new Date().toISOString()
          this.processed++

          this.onProgress({
            type: 'complete',
            taskId: task.id,
            entityName: task.entityName,
            category: task.category,
            taskType: task.type,
            message: `[W${workerId}]${modelLabel} Done: ${task.entityName}`,
            current: this.processed,
            total: this.totalPending,
            imagesRemaining: task.type === 'image' ? this.getImagesRemaining() : undefined,
          })

          // Periodic state save
          if (this.processed % STATE_SAVE_INTERVAL === 0) {
            this.saveState()
          }

        } catch (err: any) {
          const isRateLimit = err?.message?.includes('429') ||
            err?.message?.includes('QUOTA') ||
            err?.message?.includes('rate') ||
            err?.message?.includes('RESOURCE_EXHAUSTED')

          if (isRateLimit) {
            this.rateLimited = true
            const cooldown = isPremium ? RATE_LIMIT_COOLDOWN * 2 : RATE_LIMIT_COOLDOWN
            this.onProgress({
              type: 'rate_limited',
              message: `Rate limited! All workers cooling down for ${cooldown / 1000}s...`,
              current: this.processed,
              total: this.totalPending,
            })
            nextIndex = Math.max(0, nextIndex - 1)
            await new Promise(r => setTimeout(r, cooldown))
            this.rateLimited = false
          } else {
            this.state.failedIds[task.id] = err.message || 'Unknown error'
            this.state.totalFailed++

            this.onProgress({
              type: 'error',
              taskId: task.id,
              entityName: task.entityName,
              category: task.category,
              taskType: task.type,
              message: `[W${workerId}] Failed: ${task.entityName} - ${err.message}`,
              current: this.processed,
              total: this.totalPending,
            })
          }
        } finally {
          this.activeWorkers--
        }
      }
    }

    const workers: Promise<void>[] = []
    for (let i = 0; i < concurrency; i++) {
      workers.push(worker(i + 1))
    }
    await Promise.all(workers)
    this.saveState()
  }

  // ---- Internal ----

  private async processTextTask(task: GenerationTask, apiKey: string) {
    const result = await generateTextBatch(apiKey, task.prompt)

    const dir = path.dirname(task.outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    if (typeof result === 'object') {
      fs.writeFileSync(task.outputPath, JSON.stringify(result, null, 2))
    } else {
      fs.writeFileSync(task.outputPath, String(result))
    }
  }

  private async processImageTask(task: GenerationTask, apiKey: string, model?: string) {
    const result: ImageResult = await generateImage(apiKey, task.prompt, undefined, model)

    if (!result.success) {
      throw new Error(result.error || 'Image generation failed')
    }

    const dir = path.dirname(task.outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const ext = result.mimeType?.includes('png') ? '.png' : '.jpg'
    const basePath = task.outputPath.replace(/\.(png|jpg|jpeg)$/i, '')
    const filePath = basePath + ext
    const buffer = Buffer.from(result.base64Data!, 'base64')
    fs.writeFileSync(filePath, buffer)

    this.state.imagesBudgetUsedToday++
  }

  private checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]
    if (this.state.lastBudgetResetDate !== today) {
      this.state.imagesBudgetUsedToday = 0
      this.state.lastBudgetResetDate = today
    }
  }

  private loadState(dailyBudget: number): BatchState {
    const dir = path.dirname(this.stateFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    if (fs.existsSync(this.stateFile)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'))
        loaded.dailyBudget = dailyBudget
        return loaded
      } catch {
        // Corrupted state, start fresh
      }
    }

    return {
      completedIds: [],
      failedIds: {},
      imagesBudgetUsedToday: 0,
      lastBudgetResetDate: new Date().toISOString().split('T')[0],
      dailyBudget,
      totalProcessed: 0,
      totalFailed: 0,
      lastProcessedAt: '',
    }
  }

  private saveState() {
    const dir = path.dirname(this.stateFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2))
  }
}
