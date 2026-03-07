const HARDCODED_GEMINI_KEYS: string[] = [
  'AIzaSyBFjSas_oPmExetZO32yWF40RO8g8XH_Zw',
  'AIzaSyAf17iK_RZFGW1pNi4uUXGlhQuDNKRZ50A',
  'AIzaSyBLwC5Y-LCYLgmbeva6LN-dTvZo-gQHg6E',
  'AIzaSyDX26JyS5PQgukeSU_J_QnBP_yt6FMHe5I',
]

const ROTATION_CURSOR_KEY = 'gemini-key-rotation-cursor-global'

function pushKeys(target: string[], value: unknown) {
  if (!value) return
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === 'string' && v.trim()) target.push(v.trim())
    }
    return
  }
  if (typeof value === 'string' && value.trim()) {
    const chunks = value
      .split(/[\n,;]/)
      .map(v => v.trim())
      .filter(Boolean)
    target.push(...chunks)
  }
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()
  return values.filter(v => {
    if (seen.has(v)) return false
    seen.add(v)
    return true
  })
}

function readCommentarySettings(): Record<string, any> {
  try {
    const raw = localStorage.getItem('commentary-settings')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeCommentarySettings(next: Record<string, any>) {
  try {
    localStorage.setItem('commentary-settings', JSON.stringify(next))
  } catch {
    // no-op
  }
}

export function getGeminiKeyPool(): string[] {
  const keys: string[] = []

  const commentary = readCommentarySettings()
  pushKeys(keys, commentary.geminiKeys)
  pushKeys(keys, commentary.geminiKey)

  try {
    const appStr = localStorage.getItem('app-settings')
    if (appStr) {
      const parsed = JSON.parse(appStr)
      pushKeys(keys, parsed?.geminiApiKeys)
      pushKeys(keys, parsed?.geminiApiKey)
    }
  } catch {
    // ignore
  }

  try {
    const careerStr = localStorage.getItem('career-settings')
    if (careerStr) {
      const parsed = JSON.parse(careerStr)
      pushKeys(keys, parsed?.state?.geminiApiKeys)
      pushKeys(keys, parsed?.state?.geminiApiKey)
    }
  } catch {
    // ignore
  }

  try {
    pushKeys(keys, (import.meta as any)?.env?.VITE_GEMINI_API_KEYS)
  } catch {
    // ignore
  }

  const unique = dedupe(keys)
  if (unique.length > 0) return unique

  // Seed commentary-settings for app-wide consumption when no saved keys exist.
  const seeded = dedupe(HARDCODED_GEMINI_KEYS)
  const seededSettings = {
    ...commentary,
    geminiKeys: seeded,
    geminiKey: seeded[0] || '',
  }
  writeCommentarySettings(seededSettings)
  return seeded
}

export function getNextGeminiApiKey(): string | null {
  const pool = getGeminiKeyPool()
  if (pool.length === 0) return null

  let cursor = 0
  try {
    const raw = localStorage.getItem(ROTATION_CURSOR_KEY)
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= 0) {
      cursor = parsed % pool.length
    }
  } catch {
    // ignore
  }

  const selected = pool[cursor]
  const nextCursor = (cursor + 1) % pool.length

  try {
    localStorage.setItem(ROTATION_CURSOR_KEY, String(nextCursor))
  } catch {
    // ignore
  }

  // Keep commentary-settings.geminiKey aligned so legacy readers still work.
  const commentary = readCommentarySettings()
  if (commentary.geminiKey !== selected || !Array.isArray(commentary.geminiKeys)) {
    writeCommentarySettings({
      ...commentary,
      geminiKey: selected,
      geminiKeys: pool,
    })
  }

  return selected
}

