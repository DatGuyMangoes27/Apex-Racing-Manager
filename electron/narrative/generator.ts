/**
 * Narrative Generator Service
 * 
 * Generates rich backstory content for drivers and tracks using batched LLM calls.
 * Used at career creation for drivers and lazily for tracks.
 */

type DrivingStyle = 'aggressive' | 'smooth' | 'calculated' | 'unpredictable' | 'defensive'

interface DriverRivalry {
  driverId: string
  intensity: number
  reason: string
}

interface DriverMilestone {
  year?: number
  title: string
  detail?: string
}

interface RealDriverInfo {
  knownFor?: string
  [key: string]: unknown
}

interface DriverNarrative {
  origin: string
  careerPath: string
  breakoutMoment: string
  drivingStyle: DrivingStyle
  styleDescription: string
  knownRivalries: DriverRivalry[]
  trackHistory: Record<string, unknown>
  anecdotes: string[]
  careerMilestones: DriverMilestone[]
  generatedAt: string
  generatedVersion: number
  realDriverInfo?: RealDriverInfo
  [key: string]: unknown
}

interface FamousCorner {
  name: string
  description: string
  sectorPosition: 1 | 2 | 3
  cornerNumber?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
}

interface NotableMoment {
  year: number
  description: string
  category?: 'overtake' | 'crash' | 'weather' | 'finish' | 'controversy' | 'record'
}

interface SectorNotes {
  sector1: string
  sector2: string
  sector3: string
}

interface TrackNarrative {
  trackId: string
  nickname?: string
  atmosphere: string
  trackCharacter: string
  famousCorners: FamousCorner[]
  historySnippets: string[]
  notableMoments: NotableMoment[]
  overtakingSpots: string[]
  keyFactors: string[]
  sectorNotes: SectorNotes
  weatherNotes?: string
  generatedAt: string
  generatedVersion: number
  [key: string]: unknown
}

interface TeamNarrative {
  teamId?: string
  teamName?: string
  origin: string
  philosophy: string
  culturalIdentity: string
  technicalReputation: string
  paddockStanding: string
  achievements: string[]
  famousAlumni: string[]
  currentTrajectory: string
  anecdotes: string[]
  generatedAt: string
  generatedVersion: number
  [key: string]: unknown
}

// ============================================================================
// TYPES
// ============================================================================

export interface DriverBasicInfo {
  id: string
  name: string
  firstName: string
  lastName: string
  nationality: string
  age: number
  teamName: string
  teamTier: 'entry' | 'amateur' | 'semi-pro' | 'pro' | 'elite'
  personality: string
  careerStage: string
  totalWins?: number
  totalPodiums?: number
  championships?: number
}

export interface TrackBasicInfo {
  trackId: string
  trackName: string
  country: string
  lengthKm: number
  layoutType: string      // e.g., "Grand Prix Circuit", "National Circuit", "Oval"
  corners?: number
  category?: string       // e.g., "formula", "gt", "stock"
}

export interface TeamBasicInfo {
  id: string
  name: string
  shortName: string
  country: string
  tier: 'factory' | 'pro' | 'semi-pro' | 'amateur' | 'entry'
  budget: 'low' | 'medium' | 'high' | 'factory'
  facilities: 'basic' | 'standard' | 'professional' | 'elite'
  prestige: number        // 0-100
  seriesName: string      // Name of the series they compete in
  driverNames: string[]   // Current drivers
}

export interface NarrativeGenerationProgress {
  total: number
  completed: number
  currentBatch: string
  status: 'idle' | 'generating' | 'complete' | 'error'
  error?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 15 // Generate 15 driver narratives per API call
const API_TIMEOUT = 60000 // 60 second timeout for API calls

// ============================================================================
// DRIVER NARRATIVE GENERATION
// ============================================================================

/**
 * Generate narratives for a batch of drivers in a single API call
 */
async function generateDriverBatchNarratives(
  drivers: DriverBasicInfo[],
  seriesName: string,
  apiKey: string,
  realDriverData?: Record<string, RealDriverInfo>
): Promise<Record<string, DriverNarrative>> {
  
  const driverList = drivers.map((d, idx) => {
    const realInfo = realDriverData?.[d.name]
    const realContext = realInfo 
      ? `[REAL DRIVER - preserve these facts: ${realInfo.knownFor || 'professional racer'}]`
      : ''
    
    return `${idx + 1}. ${d.name} (${d.nationality}, age ${d.age}, ${d.teamName}, ${d.teamTier} tier, personality: ${d.personality}, career stage: ${d.careerStage}${d.totalWins ? `, ${d.totalWins} wins` : ''}) ${realContext}`
  }).join('\n')
  
  const prompt = `Generate compelling backstory narratives for these ${drivers.length} racing drivers competing in ${seriesName}.

DRIVERS:
${driverList}

For EACH driver, generate a JSON object with these fields:
- "origin": 2-3 sentences about where they're from and how they got into racing
- "careerPath": 2-3 sentences about their journey to this level
- "breakoutMoment": 1-2 sentences about a defining moment that put them on the map
- "drivingStyle": ONE of: "aggressive", "smooth", "calculated", "unpredictable", "defensive"
- "styleDescription": 1 sentence describing their on-track approach
- "anecdotes": Array of 2-3 fun facts or quirky details about them
- "knownRivalries": Array of 0-2 rivalries with OTHER drivers in this list (use their names, include "reason" field)

CRITICAL RULES:
- For drivers marked [REAL DRIVER], keep their real nationality and any known facts accurate
- Make narratives VARIED - not everyone is a "rising star" or "comeback story"
- Include some struggling drivers, controversial figures, steady performers
- Rivalries should reference OTHER DRIVERS IN THIS LIST by name
- Be creative but believable for motorsport

Return ONLY a valid JSON object with driver names as keys:
{
  "Driver Name 1": { ... narrative fields ... },
  "Driver Name 2": { ... narrative fields ... }
}`

  try {
    console.log(`[NarrativeGen] Generating batch of ${drivers.length} driver narratives for ${seriesName}...`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
    
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
            content: 'You are a motorsport historian and storyteller. Generate rich, varied backstories for racing drivers. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.85
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[NarrativeGen] API error:', error)
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('Empty response from API')
    }
    
    // Parse JSON - handle markdown code blocks
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    const parsed = JSON.parse(jsonStr)
    
    // Convert to DriverNarrative format with proper typing
    const narratives: Record<string, DriverNarrative> = {}
    
    for (const driver of drivers) {
      const raw = parsed[driver.name]
      if (!raw) {
        console.warn(`[NarrativeGen] No narrative found for ${driver.name}, using fallback`)
        narratives[driver.id] = createFallbackNarrative(driver)
        continue
      }
      
      narratives[driver.id] = {
        origin: raw.origin || `From ${driver.nationality}, began racing at a young age.`,
        careerPath: raw.careerPath || `Worked through the ranks to reach ${seriesName}.`,
        breakoutMoment: raw.breakoutMoment || `Caught attention with consistent performances.`,
        drivingStyle: validateDrivingStyle(raw.drivingStyle),
        styleDescription: raw.styleDescription || 'A capable all-rounder.',
        knownRivalries: parseRivalries(raw.knownRivalries, drivers),
        trackHistory: {},
        anecdotes: Array.isArray(raw.anecdotes) ? raw.anecdotes.slice(0, 3) : [],
        careerMilestones: [],
        realDriverInfo: realDriverData?.[driver.name],
        generatedAt: new Date().toISOString(),
        generatedVersion: 1
      }
    }
    
    console.log(`[NarrativeGen] Successfully generated ${Object.keys(narratives).length} narratives`)
    return narratives
    
  } catch (error) {
    console.error('[NarrativeGen] Batch generation failed:', error)
    
    // Return fallback narratives for all drivers
    const fallbacks: Record<string, DriverNarrative> = {}
    for (const driver of drivers) {
      fallbacks[driver.id] = createFallbackNarrative(driver)
    }
    return fallbacks
  }
}

/**
 * Generate narratives for all drivers in a series
 */
export async function generateSeriesNarratives(
  drivers: DriverBasicInfo[],
  seriesName: string,
  apiKey: string,
  realDriverData?: Record<string, RealDriverInfo>,
  onProgress?: (progress: NarrativeGenerationProgress) => void
): Promise<Record<string, DriverNarrative>> {
  
  const allNarratives: Record<string, DriverNarrative> = {}
  const batches: DriverBasicInfo[][] = []
  
  // Split drivers into batches
  for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
    batches.push(drivers.slice(i, i + BATCH_SIZE))
  }
  
  console.log(`[NarrativeGen] Generating narratives for ${drivers.length} drivers in ${batches.length} batches`)
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    
    onProgress?.({
      total: drivers.length,
      completed: i * BATCH_SIZE,
      currentBatch: `Batch ${i + 1}/${batches.length}`,
      status: 'generating'
    })
    
    const batchNarratives = await generateDriverBatchNarratives(
      batch,
      seriesName,
      apiKey,
      realDriverData
    )
    
    Object.assign(allNarratives, batchNarratives)
    
    // Small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  onProgress?.({
    total: drivers.length,
    completed: drivers.length,
    currentBatch: 'Complete',
    status: 'complete'
  })
  
  return allNarratives
}

// ============================================================================
// TEAM NARRATIVE GENERATION
// ============================================================================

const TEAM_BATCH_SIZE = 10 // Generate 10 team narratives per API call

/**
 * Generate narratives for a batch of teams in a single API call
 */
async function generateTeamBatchNarratives(
  teams: TeamBasicInfo[],
  seriesName: string,
  apiKey: string
): Promise<Record<string, TeamNarrative>> {
  
  const teamList = teams.map((t, idx) => {
    return `${idx + 1}. ${t.name} (${t.country}, ${t.tier} tier, ${t.budget} budget, ${t.facilities} facilities, prestige: ${t.prestige}/100, drivers: ${t.driverNames.join(', ')})`
  }).join('\n')
  
  const prompt = `Generate compelling backstory narratives for these ${teams.length} racing teams competing in ${seriesName}.

TEAMS:
${teamList}

For EACH team, generate a JSON object with these fields:
- "origin": 2-3 sentences about when/how the team was founded and their early years
- "philosophy": 2 sentences about what makes this team tick - their approach to racing
- "culturalIdentity": 1 sentence - "family outfit", "corporate powerhouse", "underdog", "perfectionist", etc.
- "technicalReputation": 1-2 sentences about their technical/engineering reputation
- "paddockStanding": 1 sentence about how they're viewed by other teams
- "achievements": Array of 2-4 notable achievements (championships, famous wins)
- "titleCount": Number of championships won (0 for smaller teams)
- "famousAlumni": Array of 1-3 fictional or plausible driver names who raced for this team previously
- "currentTrajectory": 1 sentence about where the team is headed (rising, stable, rebuilding)
- "recentForm": 1 sentence about how they've been performing lately
- "anecdotes": Array of 2-3 fun facts or quirky details about the team

CRITICAL RULES:
- Match narrative tone to team tier (factory teams are established giants, entry teams are scrappy newcomers)
- Make each team DISTINCTIVE - different origins, philosophies, trajectories
- Include struggling teams, controversial teams, traditional powerhouses, hungry challengers
- Be creative but believable for motorsport
- Higher prestige teams should have more achievements

Return ONLY a valid JSON object with team names as keys:
{
  "Team Name 1": { ... narrative fields ... },
  "Team Name 2": { ... narrative fields ... }
}`

  try {
    console.log(`[NarrativeGen] Generating batch of ${teams.length} team narratives for ${seriesName}...`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
    
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
            content: 'You are a motorsport historian and team biographer. Generate rich, varied backstories for racing teams. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.85
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[NarrativeGen] API error:', error)
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('Empty response from API')
    }
    
    // Parse JSON - handle markdown code blocks
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    const parsed = JSON.parse(jsonStr)
    
    // Convert to TeamNarrative format with proper typing
    const narratives: Record<string, TeamNarrative> = {}
    
    for (const team of teams) {
      const raw = parsed[team.name]
      if (!raw) {
        console.warn(`[NarrativeGen] No narrative found for ${team.name}, using fallback`)
        narratives[team.id] = createFallbackTeamNarrative(team)
        continue
      }
      
      narratives[team.id] = {
        teamId: team.id,
        origin: raw.origin || `A ${team.tier} tier team from ${team.country}.`,
        foundingStory: raw.foundingStory,
        philosophy: raw.philosophy || `Focused on competitive performance in ${seriesName}.`,
        culturalIdentity: raw.culturalIdentity || 'A professional racing outfit.',
        technicalReputation: raw.technicalReputation || 'Building their technical expertise.',
        paddockStanding: raw.paddockStanding || 'Respected competitors.',
        fanBase: raw.fanBase,
        achievements: Array.isArray(raw.achievements) ? raw.achievements.slice(0, 5) : [],
        titleCount: typeof raw.titleCount === 'number' ? raw.titleCount : 0,
        famousAlumni: Array.isArray(raw.famousAlumni) ? raw.famousAlumni.slice(0, 5) : [],
        teamPrincipal: raw.teamPrincipal,
        keyFigures: Array.isArray(raw.keyFigures) ? raw.keyFigures : undefined,
        currentTrajectory: raw.currentTrajectory || 'Continuing their racing program.',
        recentForm: raw.recentForm || 'Competitive this season.',
        anecdotes: Array.isArray(raw.anecdotes) ? raw.anecdotes.slice(0, 4) : [],
        generatedAt: new Date().toISOString(),
        generatedVersion: 1
      }
    }
    
    console.log(`[NarrativeGen] Successfully generated ${Object.keys(narratives).length} team narratives`)
    return narratives
    
  } catch (error) {
    console.error('[NarrativeGen] Batch generation failed:', error)
    
    // Return fallback narratives for all teams
    const fallbacks: Record<string, TeamNarrative> = {}
    for (const team of teams) {
      fallbacks[team.id] = createFallbackTeamNarrative(team)
    }
    return fallbacks
  }
}

/**
 * Generate narratives for all teams in a series
 */
export async function generateTeamSeriesNarratives(
  teams: TeamBasicInfo[],
  seriesName: string,
  apiKey: string,
  onProgress?: (progress: NarrativeGenerationProgress) => void
): Promise<Record<string, TeamNarrative>> {
  
  const allNarratives: Record<string, TeamNarrative> = {}
  const batches: TeamBasicInfo[][] = []
  
  // Split teams into batches
  for (let i = 0; i < teams.length; i += TEAM_BATCH_SIZE) {
    batches.push(teams.slice(i, i + TEAM_BATCH_SIZE))
  }
  
  console.log(`[NarrativeGen] Generating team narratives for ${teams.length} teams in ${batches.length} batches`)
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    
    onProgress?.({
      total: teams.length,
      completed: i * TEAM_BATCH_SIZE,
      currentBatch: `Team Batch ${i + 1}/${batches.length}`,
      status: 'generating'
    })
    
    const batchNarratives = await generateTeamBatchNarratives(
      batch,
      seriesName,
      apiKey
    )
    
    Object.assign(allNarratives, batchNarratives)
    
    // Small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  onProgress?.({
    total: teams.length,
    completed: teams.length,
    currentBatch: 'Complete',
    status: 'complete'
  })
  
  return allNarratives
}

/**
 * Create fallback team narrative when generation fails
 */
function createFallbackTeamNarrative(team: TeamBasicInfo): TeamNarrative {
  const trajectories = ['On the rise', 'Maintaining their position', 'Rebuilding', 'A stable presence', 'Looking to bounce back']
  const identities = ['family outfit', 'professional operation', 'ambitious newcomer', 'established competitor', 'technical innovator']
  
  return {
    teamId: team.id,
    origin: `${team.name} was established in ${team.country} with a passion for motorsport.`,
    philosophy: `A ${team.tier} tier outfit focused on consistent performance and driver development.`,
    culturalIdentity: identities[Math.floor(Math.random() * identities.length)],
    technicalReputation: team.facilities === 'elite' 
      ? 'World-class facilities and engineering expertise.'
      : team.facilities === 'professional'
      ? 'Strong technical department always pushing for improvements.'
      : 'Building their technical capabilities race by race.',
    paddockStanding: 'Respected competitors in the paddock.',
    achievements: team.prestige > 70 
      ? ['Championship contender', 'Multiple race wins'] 
      : team.prestige > 40 
      ? ['Podium finishes', 'Strong performances']
      : ['Building momentum'],
    titleCount: team.prestige > 80 ? Math.floor((team.prestige - 80) / 10) + 1 : 0,
    famousAlumni: [],
    currentTrajectory: trajectories[Math.floor(Math.random() * trajectories.length)],
    recentForm: 'Competitive this season.',
    anecdotes: [],
    generatedAt: new Date().toISOString(),
    generatedVersion: 1
  }
}

// ============================================================================
// TRACK NARRATIVE GENERATION
// ============================================================================

/**
 * Generate a narrative for a single track
 */
export async function generateTrackNarrative(
  track: TrackBasicInfo,
  apiKey: string
): Promise<TrackNarrative> {
  
  const prompt = `Generate rich commentary content for this racing circuit:

TRACK: ${track.trackName}
COUNTRY: ${track.country}
LENGTH: ${track.lengthKm}km
TYPE: ${track.layoutType}
${track.corners ? `CORNERS: ${track.corners}` : ''}
${track.category ? `CATEGORY: ${track.category} racing` : ''}

Generate a JSON object with these fields:
- "atmosphere": 2-3 sentences capturing the feeling/vibe of this circuit
- "trackCharacter": 1-2 sentences about what kind of circuit it is (fast, technical, etc.)
- "nickname": A famous nickname if one exists, or null
- "famousCorners": Array of 2-4 famous corners with "name", "description" (1 sentence), "sectorPosition" (1, 2, or 3)
- "historySnippets": Array of 2-3 historical facts about this track
- "notableMoments": Array of 1-2 memorable racing moments with "year" and "description"
- "overtakingSpots": Array of 2-3 places where overtaking commonly happens
- "keyFactors": Array of 2-3 key factors for success (e.g., "tire management", "brave braking")
- "weatherNotes": 1 sentence about typical weather conditions, or null
- "sectorNotes": Object with "sector1", "sector2", "sector3" - each a 1-sentence commentary about that sector

Be accurate about real tracks. For fictional/game tracks, be creative but believable.
Return ONLY valid JSON.`

  try {
    console.log(`[NarrativeGen] Generating track narrative for ${track.trackName}...`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
    
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
            content: 'You are a motorsport commentator and track expert. Generate vivid, accurate track descriptions. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.75
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('Empty response')
    }
    
    // Parse JSON
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    const raw = JSON.parse(jsonStr)
    
    const narrative: TrackNarrative = {
      trackId: track.trackId,
      atmosphere: raw.atmosphere || `A challenging circuit in ${track.country}.`,
      trackCharacter: raw.trackCharacter || `A ${track.lengthKm}km circuit demanding respect.`,
      nickname: raw.nickname || undefined,
      famousCorners: parseCorners(raw.famousCorners),
      historySnippets: Array.isArray(raw.historySnippets) ? raw.historySnippets : [],
      notableMoments: parseNotableMoments(raw.notableMoments),
      overtakingSpots: Array.isArray(raw.overtakingSpots) ? raw.overtakingSpots : [],
      keyFactors: Array.isArray(raw.keyFactors) ? raw.keyFactors : [],
      weatherNotes: raw.weatherNotes || undefined,
      sectorNotes: parseSectorNotes(raw.sectorNotes),
      generatedAt: new Date().toISOString(),
      generatedVersion: 1
    }
    
    console.log(`[NarrativeGen] Successfully generated narrative for ${track.trackName}`)
    return narrative
    
  } catch (error) {
    console.error(`[NarrativeGen] Track narrative generation failed for ${track.trackName}:`, error)
    return createFallbackTrackNarrative(track)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateDrivingStyle(style: string): DrivingStyle {
  const valid: DrivingStyle[] = ['aggressive', 'smooth', 'calculated', 'unpredictable', 'defensive']
  if (valid.includes(style as DrivingStyle)) {
    return style as DrivingStyle
  }
  return 'calculated' // default
}

function parseRivalries(raw: any[], drivers: DriverBasicInfo[]): DriverRivalry[] {
  if (!Array.isArray(raw)) return []
  
  const driverNames = new Set(drivers.map(d => d.name.toLowerCase()))
  
  return raw
    .filter(r => r && typeof r === 'object')
    .map(r => {
      // Try to find the rival driver by name
      const rivalName = r.rivalName || r.driverName || r.name || ''
      const matchedDriver = drivers.find(d => 
        d.name.toLowerCase() === rivalName.toLowerCase() ||
        d.lastName?.toLowerCase() === rivalName.toLowerCase()
      )
      
      return {
        driverId: matchedDriver?.id || rivalName,
        intensity: typeof r.intensity === 'number' ? Math.min(100, Math.max(0, r.intensity)) : 50,
        reason: r.reason || 'On-track battles'
      }
    })
    .slice(0, 2) // Max 2 rivalries
}

function parseCorners(raw: any[]): FamousCorner[] {
  if (!Array.isArray(raw)) return []
  
  return raw
    .filter(c => c && typeof c === 'object' && c.name)
    .map(c => ({
      name: c.name,
      description: c.description || 'A challenging corner.',
      sectorPosition: [1, 2, 3].includes(c.sectorPosition) ? c.sectorPosition : 1,
      cornerNumber: typeof c.cornerNumber === 'number' ? c.cornerNumber : undefined,
      difficulty: ['easy', 'medium', 'hard', 'extreme'].includes(c.difficulty) ? c.difficulty : undefined
    }))
    .slice(0, 4)
}

function parseNotableMoments(raw: any[]): NotableMoment[] {
  if (!Array.isArray(raw)) return []
  
  return raw
    .filter(m => m && typeof m === 'object' && m.description)
    .map(m => ({
      year: typeof m.year === 'number' ? m.year : 2020,
      description: m.description,
      category: ['overtake', 'crash', 'weather', 'finish', 'controversy', 'record'].includes(m.category) 
        ? m.category 
        : undefined
    }))
    .slice(0, 3)
}

function parseSectorNotes(raw: any): SectorNotes {
  if (!raw || typeof raw !== 'object') {
    return {
      sector1: 'The opening sector sets the tone.',
      sector2: 'The middle sector is crucial.',
      sector3: 'The final sector leads back to the start.'
    }
  }
  
  return {
    sector1: raw.sector1 || 'The opening sector.',
    sector2: raw.sector2 || 'The middle sector.',
    sector3: raw.sector3 || 'The final sector.'
  }
}

function createFallbackNarrative(driver: DriverBasicInfo): DriverNarrative {
  const styles: DrivingStyle[] = ['aggressive', 'smooth', 'calculated', 'unpredictable', 'defensive']
  
  return {
    origin: `Hailing from ${driver.nationality}, ${driver.firstName} discovered a passion for racing early in life.`,
    careerPath: `After years of development, earned a seat at ${driver.teamName}.`,
    breakoutMoment: `Impressed with strong performances that caught the attention of team bosses.`,
    drivingStyle: styles[Math.floor(Math.random() * styles.length)],
    styleDescription: `A ${driver.personality} competitor who gives everything on track.`,
    knownRivalries: [],
    trackHistory: {},
    anecdotes: [],
    careerMilestones: [],
    generatedAt: new Date().toISOString(),
    generatedVersion: 1
  }
}

function createFallbackTrackNarrative(track: TrackBasicInfo): TrackNarrative {
  return {
    trackId: track.trackId,
    atmosphere: `${track.trackName} offers a unique challenge in ${track.country}.`,
    trackCharacter: `A ${track.lengthKm}km circuit that demands precision and commitment.`,
    famousCorners: [],
    historySnippets: [`A prominent venue on the ${track.category || 'racing'} calendar.`],
    notableMoments: [],
    overtakingSpots: ['Turn 1', 'Main straight'],
    keyFactors: ['Track knowledge', 'Consistent pace'],
    sectorNotes: {
      sector1: 'Setting up the lap.',
      sector2: 'Building momentum.',
      sector3: 'Bringing it home.'
    },
    generatedAt: new Date().toISOString(),
    generatedVersion: 1
  }
}

export { createFallbackTeamNarrative }