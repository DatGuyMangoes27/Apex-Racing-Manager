import { ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import Database from 'better-sqlite3'
import * as crypto from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CareerData {
  player: unknown
  careerState: unknown
  rivals: unknown[]
  teams: unknown[]
  series: unknown[]
  raceHistory: unknown[]
  seasonStandings: Record<string, unknown[]>
  newsEvents?: unknown[]
  pendingContractOffers?: unknown[]
  preGenUsedIds?: unknown
  schemaVersion?: number
  savedAt: string
}

interface DatabaseConfig {
  dbPath: string
}

type CommentaryEntityType = 'driver' | 'team' | 'owner' | 'staff' | 'sponsor' | 'track' | 'series'

interface CommentaryEntityRef {
  type: CommentaryEntityType
  id: string
  name?: string
}

interface CommentaryMentionInput {
  seasonId?: string
  round?: number
  sessionType?: string
  eventType: string
  speaker: string
  script: string
  entities?: CommentaryEntityRef[]
  claimType?: string
  confidence?: number
  source?: string
  createdAt?: string
}

interface CommentaryMentionRecord extends CommentaryMentionInput {
  id: number
  entities: CommentaryEntityRef[]
  claimType: string
  confidence: number
  source: string
  createdAt: string
}

interface CommentaryMentionQuery {
  seasonId?: string
  currentRound?: number
  lookbackRounds?: number
  entityType?: CommentaryEntityType
  entityId?: string
  limit?: number
}

interface CommentaryEntityStateInput {
  entityType: CommentaryEntityType
  entityId: string
  stateKey: string
  value: unknown
  roundUpdated?: number
  updatedAt?: string
}

interface CommentaryEntityStateRecord extends CommentaryEntityStateInput {
  updatedAt: string
}

// The logical keys we split the monolithic save into.
// Each key becomes a row in the career_chunks table.
const CHUNK_KEYS = [
  'player',
  'careerState',
  'rivals',
  'teams',
  'series',
  'raceHistory',
  'seasonStandings',
  'pendingContractOffers',
  'preGenUsedIds',
] as const

type ChunkKey = (typeof CHUNK_KEYS)[number]

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let db: Database.Database | null = null

// In-memory hash cache so we can skip unchanged chunks without querying the DB
const hashCache = new Map<string, string>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultDBDir(): string {
  return app.getPath('userData')
}

function getDefaultDBPath(): string {
  return path.join(getDefaultDBDir(), 'career.db')
}

/** Legacy JSON path (for migration) */
function getLegacyJSONPath(): string {
  return path.join(getDefaultDBDir(), 'career_data.json')
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** Fast content hash using MD5 (we only need change-detection, not security) */
function hashContent(json: string): string {
  return crypto.createHash('md5').update(json).digest('hex')
}

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------

export function initDatabase(config?: DatabaseConfig): void {
  const dbPath = config?.dbPath || getDefaultDBPath()
  ensureDirectoryExists(dbPath)

  console.log(`[Database] Opening SQLite database at ${dbPath}`)

  db = new Database(dbPath)

  // Enable WAL mode for crash-safety and better concurrent read performance
  db.pragma('journal_mode = WAL')
  // Synchronous NORMAL is a good balance of safety and speed with WAL
  db.pragma('synchronous = NORMAL')

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS career_chunks (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      hash       TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS commentary_mentions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id   TEXT,
      round       INTEGER,
      session_type TEXT,
      event_type  TEXT NOT NULL,
      speaker     TEXT NOT NULL,
      script      TEXT NOT NULL,
      entities_json TEXT NOT NULL,
      claim_type  TEXT NOT NULL,
      confidence  REAL NOT NULL,
      source      TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commentary_mentions_created
      ON commentary_mentions(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_commentary_mentions_season_round
      ON commentary_mentions(season_id, round);

    CREATE TABLE IF NOT EXISTS commentary_entity_state (
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      state_key   TEXT NOT NULL,
      value_json  TEXT NOT NULL,
      round_updated INTEGER,
      updated_at  TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id, state_key)
    );
  `)

  // Populate the in-memory hash cache from any existing rows
  const rows = db.prepare('SELECT key, hash FROM career_chunks').all() as { key: string; hash: string }[]
  for (const row of rows) {
    hashCache.set(row.key, row.hash)
  }

  // Run one-time migration from legacy JSON file if needed
  migrateFromJSON()

  console.log('[Database] SQLite database ready')
}

// ---------------------------------------------------------------------------
// JSON → SQLite migration
// ---------------------------------------------------------------------------

function migrateFromJSON(): void {
  if (!db) return

  const legacyPath = getLegacyJSONPath()

  // Only migrate if the legacy file exists AND we have no data yet
  const existingCount = (db.prepare('SELECT COUNT(*) as cnt FROM career_chunks').get() as { cnt: number }).cnt
  if (existingCount > 0) {
    // Database already has data — nothing to migrate
    return
  }

  if (!fs.existsSync(legacyPath)) {
    // No legacy file either — fresh install
    return
  }

  console.log('[Database] Found legacy career_data.json — migrating to SQLite...')

  try {
    const content = fs.readFileSync(legacyPath, 'utf-8')
    const data = JSON.parse(content) as CareerData

    if (!data || !data.player || !data.careerState) {
      console.error('[Database] Legacy JSON file is invalid — skipping migration')
      return
    }

    // Save into SQLite using the normal save path
    const result = saveCareerData(data)
    if (!result.success) {
      console.error('[Database] Migration save failed:', result.error)
      return
    }

    // Record migration timestamp
    const upsertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')
    upsertMeta.run('json_migrated_at', new Date().toISOString())

    // Rename legacy file so it's not re-migrated, but keep it as a safety net
    const migratedPath = legacyPath + '.migrated'
    try {
      fs.renameSync(legacyPath, migratedPath)
      console.log(`[Database] Legacy file renamed to ${path.basename(migratedPath)}`)
    } catch {
      console.warn('[Database] Could not rename legacy file — it will be ignored on next launch')
    }

    // Also rename any backup files
    try {
      const dir = path.dirname(legacyPath)
      const files = fs.readdirSync(dir)
      const backups = files.filter(f => f.includes('career_data_backup_') && f.endsWith('.json'))
      for (const backup of backups) {
        try {
          fs.renameSync(path.join(dir, backup), path.join(dir, backup + '.migrated'))
        } catch {
          // Ignore individual backup rename failures
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    console.log('[Database] Migration from JSON to SQLite complete')
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Database] Migration failed: ${msg}`)
    console.error('[Database] The legacy JSON file has been left intact — will try again next launch')
  }
}

// ---------------------------------------------------------------------------
// Core CRUD operations
// ---------------------------------------------------------------------------

function saveCareerData(data: CareerData): { success: boolean; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const now = new Date().toISOString()

    const upsertChunk = db.prepare(`
      INSERT INTO career_chunks (key, value, hash, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        hash = excluded.hash,
        updated_at = excluded.updated_at
    `)

    const upsertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')

    // Build a map of key → value from the incoming data object
    const chunks = buildChunkMap(data)

    // Run the upserts in a single transaction for atomicity and speed
    const writeTransaction = db.transaction(() => {
      let written = 0
      let skipped = 0

      for (const [key, jsonValue] of chunks) {
        const hash = hashContent(jsonValue)

        // Skip if the hash hasn't changed (chunk is identical)
        if (hashCache.get(key) === hash) {
          skipped++
          continue
        }

        upsertChunk.run(key, jsonValue, hash, now)
        hashCache.set(key, hash)
        written++
      }

      // Always update the savedAt timestamp
      upsertMeta.run('savedAt', now)
      upsertMeta.run('schemaVersion', String(data.schemaVersion ?? 2))

      return { written, skipped }
    })

    const { written, skipped } = writeTransaction()
    if (written > 0) {
      console.log(`[Database] Saved: ${written} chunks written, ${skipped} unchanged`)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] Save error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

function loadCareerData(): { success: boolean; data?: CareerData; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const rows = db.prepare('SELECT key, value FROM career_chunks').all() as { key: string; value: string }[]

    if (rows.length === 0) {
      // No data in database — check if legacy JSON file exists as fallback
      return tryLoadLegacyJSON()
    }

    // Assemble the CareerData object from chunks
    const assembled = assembleCareerData(rows)

    if (!assembled || !assembled.player || !assembled.careerState) {
      return { success: false, error: 'Loaded data is missing required fields (player, careerState)' }
    }

    return { success: true, data: assembled }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] Load error:', errorMessage)

    // Fallback: try legacy JSON
    const fallback = tryLoadLegacyJSON()
    if (fallback.success) {
      console.log('[Database] Recovered from legacy JSON fallback')
      return fallback
    }

    return { success: false, error: errorMessage }
  }
}

function deleteCareerData(): { success: boolean; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    db.exec('DELETE FROM career_chunks')
    db.exec('DELETE FROM meta')
    hashCache.clear()
    console.log('[Database] Career data deleted')
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

function careerExists(): boolean {
  if (!db) return false
  try {
    const row = db.prepare("SELECT 1 FROM career_chunks WHERE key = 'player' LIMIT 1").get()
    return !!row
  } catch {
    return false
  }
}

function getSaveInfo(): { exists: boolean; savedAt?: string; size?: number } {
  if (!db) return { exists: false }

  try {
    const hasData = careerExists()
    if (!hasData) return { exists: false }

    const metaRow = db.prepare("SELECT value FROM meta WHERE key = 'savedAt'").get() as { value: string } | undefined
    const dbPath = getDefaultDBPath()
    let size: number | undefined
    try {
      size = fs.statSync(dbPath).size
    } catch {
      // Ignore
    }

    return {
      exists: true,
      savedAt: metaRow?.value,
      size,
    }
  } catch {
    return { exists: false }
  }
}

function saveCommentaryMention(
  mention: CommentaryMentionInput
): { success: boolean; id?: number; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const createdAt = mention.createdAt || new Date().toISOString()
    const entities = mention.entities ?? []
    const confidence = Math.max(0, Math.min(1, mention.confidence ?? 0.7))
    const claimType = mention.claimType || mention.eventType || 'general'
    const source = mention.source || 'commentary'

    const insert = db.prepare(`
      INSERT INTO commentary_mentions (
        season_id, round, session_type, event_type, speaker, script,
        entities_json, claim_type, confidence, source, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insert.run(
      mention.seasonId ?? null,
      typeof mention.round === 'number' ? mention.round : null,
      mention.sessionType ?? null,
      mention.eventType,
      mention.speaker,
      mention.script,
      JSON.stringify(entities),
      claimType,
      confidence,
      source,
      createdAt
    )

    return { success: true, id: Number(result.lastInsertRowid) }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] saveCommentaryMention error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

function getRecentCommentaryMentions(
  query: CommentaryMentionQuery = {}
): { success: boolean; data?: CommentaryMentionRecord[]; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const limit = Math.max(1, Math.min(200, query.limit ?? 40))
    const where: string[] = []
    const params: unknown[] = []

    if (query.seasonId) {
      where.push('season_id = ?')
      params.push(query.seasonId)
    }
    if (typeof query.currentRound === 'number' && typeof query.lookbackRounds === 'number') {
      const minRound = Math.max(0, query.currentRound - query.lookbackRounds)
      where.push('(round IS NULL OR round >= ?)')
      params.push(minRound)
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const sql = `
      SELECT id, season_id, round, session_type, event_type, speaker, script, entities_json,
             claim_type, confidence, source, created_at
      FROM commentary_mentions
      ${whereClause}
      ORDER BY id DESC
      LIMIT ?
    `
    params.push(limit)

    const rows = db.prepare(sql).all(...params) as Array<{
      id: number
      season_id: string | null
      round: number | null
      session_type: string | null
      event_type: string
      speaker: string
      script: string
      entities_json: string
      claim_type: string
      confidence: number
      source: string
      created_at: string
    }>

    const mapped = rows.map((row) => {
      let entities: CommentaryEntityRef[] = []
      try {
        const parsed = JSON.parse(row.entities_json)
        if (Array.isArray(parsed)) {
          entities = parsed as CommentaryEntityRef[]
        }
      } catch {
        entities = []
      }

      return {
        id: row.id,
        seasonId: row.season_id ?? undefined,
        round: row.round ?? undefined,
        sessionType: row.session_type ?? undefined,
        eventType: row.event_type,
        speaker: row.speaker,
        script: row.script,
        entities,
        claimType: row.claim_type,
        confidence: row.confidence,
        source: row.source,
        createdAt: row.created_at,
      } as CommentaryMentionRecord
    })

    const filtered = mapped.filter((item) => {
      if (!query.entityType && !query.entityId) return true
      return item.entities.some((entity) => {
        const typeMatch = query.entityType ? entity.type === query.entityType : true
        const idMatch = query.entityId ? entity.id === query.entityId : true
        return typeMatch && idMatch
      })
    })

    return { success: true, data: filtered }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] getRecentCommentaryMentions error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

function upsertCommentaryEntityState(
  input: CommentaryEntityStateInput
): { success: boolean; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const updatedAt = input.updatedAt || new Date().toISOString()
    const upsert = db.prepare(`
      INSERT INTO commentary_entity_state (
        entity_type, entity_id, state_key, value_json, round_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(entity_type, entity_id, state_key) DO UPDATE SET
        value_json = excluded.value_json,
        round_updated = excluded.round_updated,
        updated_at = excluded.updated_at
    `)

    upsert.run(
      input.entityType,
      input.entityId,
      input.stateKey,
      JSON.stringify(input.value),
      typeof input.roundUpdated === 'number' ? input.roundUpdated : null,
      updatedAt
    )
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] upsertCommentaryEntityState error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

function getCommentaryEntityState(
  entityType: CommentaryEntityType,
  entityId: string
): { success: boolean; data?: CommentaryEntityStateRecord[]; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialised' }
  }

  try {
    const rows = db.prepare(`
      SELECT entity_type, entity_id, state_key, value_json, round_updated, updated_at
      FROM commentary_entity_state
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY state_key ASC
    `).all(entityType, entityId) as Array<{
      entity_type: CommentaryEntityType
      entity_id: string
      state_key: string
      value_json: string
      round_updated: number | null
      updated_at: string
    }>

    const data = rows.map((row) => {
      let value: unknown = null
      try {
        value = JSON.parse(row.value_json)
      } catch {
        value = null
      }
      return {
        entityType: row.entity_type,
        entityId: row.entity_id,
        stateKey: row.state_key,
        value,
        roundUpdated: row.round_updated ?? undefined,
        updatedAt: row.updated_at,
      }
    })

    return { success: true, data }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Database] getCommentaryEntityState error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

function exportCareer(exportPath: string): { success: boolean; error?: string } {
  try {
    const result = loadCareerData()
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

function importCareer(importPath: string): { success: boolean; error?: string } {
  try {
    if (!fs.existsSync(importPath)) {
      return { success: false, error: 'Import file not found' }
    }

    const content = fs.readFileSync(importPath, 'utf-8')
    const data = JSON.parse(content) as CareerData

    if (!data.player || !data.careerState) {
      return { success: false, error: 'Invalid career file format' }
    }

    // Clear existing data before import
    deleteCareerData()

    return saveCareerData(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// ---------------------------------------------------------------------------
// Chunk helpers
// ---------------------------------------------------------------------------

/** Split a CareerData object into a Map of chunk-key → JSON string */
function buildChunkMap(data: CareerData): Map<string, string> {
  const map = new Map<string, string>()

  // Each chunk key maps to its corresponding field on CareerData.
  // We stringify each independently so we can hash & diff per-chunk.
  const mapping: Record<ChunkKey, unknown> = {
    player: data.player,
    careerState: data.careerState,
    rivals: data.rivals ?? [],
    teams: data.teams ?? [],
    series: data.series ?? [],
    raceHistory: data.raceHistory ?? [],
    seasonStandings: data.seasonStandings ?? {},
    pendingContractOffers: data.pendingContractOffers ?? [],
    preGenUsedIds: data.preGenUsedIds ?? null,
  }

  for (const key of CHUNK_KEYS) {
    const value = mapping[key]
    // Use compact JSON (no pretty-print) for storage — saves space and hashing time
    map.set(key, JSON.stringify(value))
  }

  return map
}

/** Reassemble a CareerData object from database rows */
function assembleCareerData(rows: { key: string; value: string }[]): CareerData {
  const parsed: Record<string, unknown> = {}
  for (const row of rows) {
    try {
      parsed[row.key] = JSON.parse(row.value)
    } catch {
      console.error(`[Database] Failed to parse chunk: ${row.key}`)
      parsed[row.key] = row.key === 'seasonStandings' ? {} : []
    }
  }

  // Read metadata
  let savedAt = new Date().toISOString()
  let schemaVersion = 2
  if (db) {
    const savedAtRow = db.prepare("SELECT value FROM meta WHERE key = 'savedAt'").get() as { value: string } | undefined
    const versionRow = db.prepare("SELECT value FROM meta WHERE key = 'schemaVersion'").get() as { value: string } | undefined
    if (savedAtRow) savedAt = savedAtRow.value
    if (versionRow) schemaVersion = parseInt(versionRow.value, 10) || 2
  }

  return {
    player: parsed.player ?? null,
    careerState: parsed.careerState ?? null,
    rivals: (parsed.rivals as unknown[]) ?? [],
    teams: (parsed.teams as unknown[]) ?? [],
    series: (parsed.series as unknown[]) ?? [],
    raceHistory: (parsed.raceHistory as unknown[]) ?? [],
    seasonStandings: (parsed.seasonStandings as Record<string, unknown[]>) ?? {},
    pendingContractOffers: (parsed.pendingContractOffers as unknown[]) ?? [],
    preGenUsedIds: parsed.preGenUsedIds ?? undefined,
    schemaVersion,
    savedAt,
  }
}

// ---------------------------------------------------------------------------
// Legacy JSON fallback (for migration edge cases)
// ---------------------------------------------------------------------------

function tryLoadLegacyJSON(): { success: boolean; data?: CareerData; error?: string } {
  const legacyPath = getLegacyJSONPath()

  if (!fs.existsSync(legacyPath)) {
    return { success: false, error: 'No saved career found' }
  }

  try {
    const content = fs.readFileSync(legacyPath, 'utf-8')
    const data = JSON.parse(content) as CareerData

    if (data && data.player && data.careerState) {
      console.log('[Database] Loaded from legacy JSON file (fallback)')
      return { success: true, data }
    }
    return { success: false, error: 'Legacy JSON file is invalid' }
  } catch {
    // Also try backup files
    return tryLoadFromBackup(path.dirname(legacyPath))
  }
}

/** Try to load from legacy backup files (last resort) */
function tryLoadFromBackup(dir: string): { success: boolean; data?: CareerData; error?: string } {
  try {
    const files = fs.readdirSync(dir)
    const backups = files
      .filter(f => f.includes('_backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: parseInt(f.match(/_backup_(\d+)\.json/)?.[1] || '0'),
      }))
      .sort((a, b) => b.time - a.time)

    for (const backup of backups) {
      try {
        const content = fs.readFileSync(path.join(dir, backup.name), 'utf-8')
        const data = JSON.parse(content) as CareerData
        if (data && data.player && data.careerState) {
          console.log(`[Database] Recovered from legacy backup: ${backup.name}`)
          return { success: true, data }
        }
      } catch {
        continue
      }
    }

    return { success: false, error: 'No valid backup found' }
  } catch {
    return { success: false, error: 'Failed to read backup directory' }
  }
}

// ---------------------------------------------------------------------------
// Cleanup — call on app quit
// ---------------------------------------------------------------------------

export function closeDatabase(): void {
  if (db) {
    try {
      // Checkpoint WAL before closing for a clean state
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
      console.log('[Database] Database closed cleanly')
    } catch (error) {
      console.error('[Database] Error closing database:', error)
    }
    db = null
    hashCache.clear()
  }
}

// ---------------------------------------------------------------------------
// IPC handler registration
// ---------------------------------------------------------------------------

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

  ipcMain.handle('db:saveCommentaryMention', async (_event, mention: CommentaryMentionInput) => {
    return saveCommentaryMention(mention)
  })

  ipcMain.handle('db:getRecentCommentaryMentions', async (_event, query?: CommentaryMentionQuery) => {
    return getRecentCommentaryMentions(query)
  })

  ipcMain.handle('db:upsertCommentaryEntityState', async (_event, input: CommentaryEntityStateInput) => {
    return upsertCommentaryEntityState(input)
  })

  ipcMain.handle('db:getCommentaryEntityState', async (_event, entityType: CommentaryEntityType, entityId: string) => {
    return getCommentaryEntityState(entityType, entityId)
  })
}

// ---------------------------------------------------------------------------
// Exports (keep the same public surface for other electron modules)
// ---------------------------------------------------------------------------

export {
  saveCareerData,
  loadCareerData,
  deleteCareerData,
  careerExists,
  getSaveInfo,
  exportCareer,
  importCareer,
  getDefaultDBPath,
  saveCommentaryMention,
  getRecentCommentaryMentions,
  upsertCommentaryEntityState,
  getCommentaryEntityState,
  CareerData,
  DatabaseConfig,
  CommentaryEntityType,
  CommentaryEntityRef,
  CommentaryMentionInput,
  CommentaryMentionRecord,
  CommentaryMentionQuery,
  CommentaryEntityStateInput,
  CommentaryEntityStateRecord,
}









