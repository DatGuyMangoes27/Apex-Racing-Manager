/**
 * Commentary Content Pool System
 * 
 * Pre-generates color commentary content at race start to enable
 * continuous TV broadcast-style commentary without excessive API calls.
 */

import type { DriverNarrative, RivalDriver } from '../../src/store/rivalStore'
import type { TrackNarrative } from '../../src/data/track-narratives'
import { 
  getSeriesProfile, 
  buildAvoidTermsPrompt, 
  buildPreferredTermsPrompt,
  SeriesCategory 
} from '../../src/data/series-commentary'

// ============================================================================
// TYPES
// ============================================================================

export type ContentCategory = 
  | 'track_atmosphere'
  | 'track_history' 
  | 'corner_callout'
  | 'driver_background'
  | 'driver_style'
  | 'driver_rivalry'
  | 'championship_context'
  | 'strategy_talk'
  | 'weather_observation'
  | 'position_battle'
  | 'gap_analysis'
  | 'sector_observation'

export type VoiceRole = 'lead' | 'analyst'

export interface GeneratedLine {
  id: string
  text: string
  category: ContentCategory
  voice: VoiceRole
  priority: number           // 1-10, higher = more important
  relevantLap?: 'early' | 'mid' | 'late' | 'final' | 'any'
  driverId?: string          // If about a specific driver
  sectorRelevant?: 1 | 2 | 3 // If sector-specific
  used: boolean
  generatedAt: number
}

export interface RaceContentPool {
  raceId: string
  trackId: string
  seriesId: string
  
  // Content buckets
  trackContent: GeneratedLine[]
  driverContent: GeneratedLine[]
  championshipContent: GeneratedLine[]
  strategyContent: GeneratedLine[]
  
  // Tracking
  usedIds: Set<string>
  generatedAt: number
  totalGenerated: number
}

export interface ContentPoolContext {
  trackId: string
  trackName: string
  trackNarrative?: TrackNarrative
  
  seriesId: string
  seriesName: string
  seriesCategory?: SeriesCategory  // For series-specific commentary
  
  drivers: Array<{
    id: string
    name: string
    teamName: string
    position: number
    narrative?: DriverNarrative
    pointsPosition?: number
  }>
  
  championshipStandings?: Array<{
    driverName: string
    points: number
    position: number
    wins: number
  }>
  
  playerName: string
  playerPosition?: number
  playerPointsPosition?: number
  
  currentLap?: number
  totalLaps: number
  weather?: string
}

// ============================================================================
// CONTENT POOL STATE
// ============================================================================

let currentPool: RaceContentPool | null = null

/**
 * Get current content pool
 */
export function getContentPool(): RaceContentPool | null {
  return currentPool
}

/**
 * Clear content pool
 */
export function clearContentPool(): void {
  currentPool = null
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate the pre-race content pool
 * Called when RaceDay screen loads, before race starts
 */
export async function generateRaceContentPool(
  context: ContentPoolContext,
  apiKey: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<RaceContentPool> {
  
  console.log(`[ContentPool] Generating content for ${context.trackName} (${context.seriesName})`)
  
  const pool: RaceContentPool = {
    raceId: `${context.seriesId}-${context.trackId}-${Date.now()}`,
    trackId: context.trackId,
    seriesId: context.seriesId,
    trackContent: [],
    driverContent: [],
    championshipContent: [],
    strategyContent: [],
    usedIds: new Set(),
    generatedAt: Date.now(),
    totalGenerated: 0
  }
  
  try {
    // Generate all content in a single batched API call for efficiency
    onProgress?.('Generating commentary content...', 0.1)
    
    const allContent = await generateBatchedContent(context, apiKey)
    
    // Sort content into categories
    for (const line of allContent) {
      switch (line.category) {
        case 'track_atmosphere':
        case 'track_history':
        case 'corner_callout':
        case 'sector_observation':
          pool.trackContent.push(line)
          break
        case 'driver_background':
        case 'driver_style':
        case 'driver_rivalry':
          pool.driverContent.push(line)
          break
        case 'championship_context':
        case 'position_battle':
        case 'gap_analysis':
          pool.championshipContent.push(line)
          break
        case 'strategy_talk':
        case 'weather_observation':
          pool.strategyContent.push(line)
          break
      }
    }
    
    pool.totalGenerated = allContent.length
    currentPool = pool
    
    onProgress?.('Content pool ready', 1.0)
    console.log(`[ContentPool] Generated ${pool.totalGenerated} lines of commentary`)
    
    return pool
    
  } catch (error) {
    console.error('[ContentPool] Generation failed:', error)
    // Return empty pool on failure
    currentPool = pool
    return pool
  }
}

/**
 * Generate all content in a single batched API call
 */
async function generateBatchedContent(
  context: ContentPoolContext,
  apiKey: string
): Promise<GeneratedLine[]> {
  
  // Build context for the LLM
  const trackContext = context.trackNarrative 
    ? `
Track: ${context.trackName}
Atmosphere: ${context.trackNarrative.atmosphere}
Character: ${context.trackNarrative.trackCharacter}
${context.trackNarrative.nickname ? `Nickname: "${context.trackNarrative.nickname}"` : ''}
Famous corners: ${context.trackNarrative.famousCorners.map(c => c.name).join(', ')}
Key factors: ${context.trackNarrative.keyFactors.join(', ')}
${context.trackNarrative.weatherNotes || ''}`
    : `Track: ${context.trackName}`
  
  // Get top drivers with narratives
  const topDrivers = context.drivers.slice(0, 10)
  const driverContext = topDrivers.map(d => {
    const narrative = d.narrative
    if (narrative) {
      return `${d.name} (${d.teamName}, P${d.position}): ${narrative.styleDescription}. ${narrative.anecdotes?.[0] || ''}`
    }
    return `${d.name} (${d.teamName}, P${d.position})`
  }).join('\n')
  
  // Championship context
  const champContext = context.championshipStandings?.slice(0, 5).map((s, i) => 
    `${i + 1}. ${s.driverName}: ${s.points}pts (${s.wins} wins)`
  ).join('\n') || 'Championship standings not available'
  
  // Get series-specific commentary profile
  const seriesCategory = context.seriesCategory || 'gt-sportscar'
  const seriesProfile = getSeriesProfile(seriesCategory)
  const avoidTermsSection = buildAvoidTermsPrompt(seriesCategory)
  const preferredTermsSection = buildPreferredTermsPrompt(seriesCategory)
  
  const prompt = `Generate TV broadcast-style commentary content for this race.

SERIES TYPE: ${seriesProfile.displayName}
This is ${seriesProfile.category.toUpperCase()} racing.
${seriesProfile.culturalContext}

${avoidTermsSection}
${preferredTermsSection}

TRACK:
${trackContext}

TOP DRIVERS:
${driverContext}

CHAMPIONSHIP:
${champContext}

RACE INFO:
- Series: ${context.seriesName}
- Total Laps: ${context.totalLaps}
- Player: ${context.playerName}${context.playerPointsPosition ? ` (P${context.playerPointsPosition} in championship)` : ''}
${context.weather ? `- Weather: ${context.weather}` : ''}

Generate commentary lines for a natural-sounding TV broadcast. Mix of:
- Track atmosphere/history (3-5 lines)
- Driver backgrounds/stories (5-8 lines about different drivers)
- Championship implications (3-5 lines)
- Strategy observations (3-5 lines)
- Sector/corner callouts (3-5 lines)

For each line, specify:
- "text": The actual commentary (15-40 words, natural speech)
- "category": One of: track_atmosphere, track_history, corner_callout, driver_background, driver_style, championship_context, strategy_talk, sector_observation
- "voice": "lead" for exciting/action commentary, "analyst" for insight/technical
- "lap_phase": "early", "mid", "late", "final", or "any"
- "driver_name": If about a specific driver (optional)

Return JSON array of objects. No markdown, just valid JSON.`

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a motorsport broadcast producer creating commentary content. Generate varied, natural-sounding lines. Return ONLY valid JSON array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.85
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return generateFallbackContent(context)
    }
    
    // Parse JSON
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    const rawLines = JSON.parse(jsonStr)
    
    // Convert to GeneratedLine format
    return rawLines.map((raw: any, idx: number) => ({
      id: `gen-${Date.now()}-${idx}`,
      text: raw.text || raw.content || '',
      category: mapCategory(raw.category),
      voice: raw.voice === 'analyst' ? 'analyst' : 'lead',
      priority: getPriority(raw.category),
      relevantLap: mapLapPhase(raw.lap_phase),
      driverId: findDriverId(raw.driver_name, context.drivers),
      used: false,
      generatedAt: Date.now()
    })).filter((line: GeneratedLine) => line.text.length > 10)
    
  } catch (error) {
    console.error('[ContentPool] Batch generation failed:', error)
    return generateFallbackContent(context)
  }
}

// ============================================================================
// CONTENT SELECTION
// ============================================================================

/**
 * Get next available content from the pool
 */
export function getNextContent(
  category?: ContentCategory,
  lapPhase?: 'early' | 'mid' | 'late' | 'final',
  voice?: VoiceRole
): GeneratedLine | null {
  if (!currentPool) return null
  
  // Combine all content buckets
  const allContent = [
    ...currentPool.trackContent,
    ...currentPool.driverContent,
    ...currentPool.championshipContent,
    ...currentPool.strategyContent
  ]
  
  // Filter by criteria
  let candidates = allContent.filter(line => {
    if (line.used) return false
    if (category && line.category !== category) return false
    if (voice && line.voice !== voice) return false
    if (lapPhase && line.relevantLap !== 'any' && line.relevantLap !== lapPhase) return false
    return true
  })
  
  if (candidates.length === 0) {
    // Fallback: get any unused content
    candidates = allContent.filter(line => !line.used)
  }
  
  if (candidates.length === 0) return null
  
  // Sort by priority and pick randomly from top candidates
  candidates.sort((a, b) => b.priority - a.priority)
  const topCandidates = candidates.slice(0, Math.min(5, candidates.length))
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]
  
  // Mark as used
  selected.used = true
  currentPool.usedIds.add(selected.id)
  
  return selected
}

/**
 * Get content about a specific driver
 */
export function getDriverContent(driverId: string): GeneratedLine | null {
  if (!currentPool) return null
  
  const candidate = currentPool.driverContent.find(
    line => !line.used && line.driverId === driverId
  )
  
  if (candidate) {
    candidate.used = true
    currentPool.usedIds.add(candidate.id)
  }
  
  return candidate || null
}

/**
 * Get sector-specific content
 */
export function getSectorContent(sector: 1 | 2 | 3): GeneratedLine | null {
  if (!currentPool) return null
  
  const candidate = currentPool.trackContent.find(
    line => !line.used && (line.sectorRelevant === sector || line.category === 'sector_observation')
  )
  
  if (candidate) {
    candidate.used = true
    currentPool.usedIds.add(candidate.id)
  }
  
  return candidate || null
}

/**
 * Get championship/position content
 */
export function getChampionshipContent(): GeneratedLine | null {
  return getNextContent('championship_context')
}

/**
 * Get pool statistics
 */
export function getPoolStats(): { total: number; used: number; remaining: number } | null {
  if (!currentPool) return null
  
  const total = currentPool.totalGenerated
  const used = currentPool.usedIds.size
  
  return {
    total,
    used,
    remaining: total - used
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapCategory(raw: string): ContentCategory {
  const mapping: Record<string, ContentCategory> = {
    'track_atmosphere': 'track_atmosphere',
    'track_history': 'track_history',
    'corner_callout': 'corner_callout',
    'driver_background': 'driver_background',
    'driver_style': 'driver_style',
    'driver_rivalry': 'driver_rivalry',
    'championship_context': 'championship_context',
    'strategy_talk': 'strategy_talk',
    'weather_observation': 'weather_observation',
    'position_battle': 'position_battle',
    'gap_analysis': 'gap_analysis',
    'sector_observation': 'sector_observation'
  }
  
  return mapping[raw?.toLowerCase()] || 'track_atmosphere'
}

function mapLapPhase(raw: string): GeneratedLine['relevantLap'] {
  if (!raw) return 'any'
  const phase = raw.toLowerCase()
  if (['early', 'mid', 'late', 'final'].includes(phase)) {
    return phase as GeneratedLine['relevantLap']
  }
  return 'any'
}

function getPriority(category: string): number {
  const priorities: Record<string, number> = {
    'championship_context': 8,
    'driver_rivalry': 7,
    'driver_background': 6,
    'driver_style': 5,
    'track_atmosphere': 5,
    'corner_callout': 4,
    'strategy_talk': 4,
    'track_history': 3,
    'sector_observation': 3,
    'weather_observation': 2
  }
  return priorities[category] || 5
}

function findDriverId(name: string | undefined, drivers: ContentPoolContext['drivers']): string | undefined {
  if (!name) return undefined
  const driver = drivers.find(d => 
    d.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(d.name.split(' ').pop()?.toLowerCase() || '')
  )
  return driver?.id
}

function generateFallbackContent(context: ContentPoolContext): GeneratedLine[] {
  // Generate basic fallback content without API
  const lines: GeneratedLine[] = []
  
  // Track content
  lines.push({
    id: `fallback-track-1`,
    text: `Welcome to ${context.trackName} for today's ${context.seriesName} race.`,
    category: 'track_atmosphere',
    voice: 'lead',
    priority: 8,
    relevantLap: 'early',
    used: false,
    generatedAt: Date.now()
  })
  
  lines.push({
    id: `fallback-track-2`,
    text: `We have ${context.totalLaps} laps ahead of us today, and it should be quite a battle.`,
    category: 'track_atmosphere',
    voice: 'lead',
    priority: 7,
    relevantLap: 'early',
    used: false,
    generatedAt: Date.now()
  })
  
  // Add a line for each top driver
  context.drivers.slice(0, 5).forEach((driver, idx) => {
    lines.push({
      id: `fallback-driver-${idx}`,
      text: `${driver.name} starts from P${driver.position} today, representing ${driver.teamName}.`,
      category: 'driver_background',
      voice: 'analyst',
      priority: 5,
      relevantLap: 'early',
      driverId: driver.id,
      used: false,
      generatedAt: Date.now()
    })
  })
  
  // Championship content
  if (context.championshipStandings && context.championshipStandings.length > 0) {
    const leader = context.championshipStandings[0]
    lines.push({
      id: `fallback-champ-1`,
      text: `${leader.driverName} leads the championship with ${leader.points} points heading into today's race.`,
      category: 'championship_context',
      voice: 'analyst',
      priority: 7,
      relevantLap: 'any',
      used: false,
      generatedAt: Date.now()
    })
  }
  
  // Strategy content
  lines.push({
    id: `fallback-strategy-1`,
    text: `Tire management will be key today. Let's see who can make their rubber last.`,
    category: 'strategy_talk',
    voice: 'analyst',
    priority: 4,
    relevantLap: 'mid',
    used: false,
    generatedAt: Date.now()
  })
  
  return lines
}

