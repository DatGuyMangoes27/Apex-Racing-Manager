/**
 * Championship logo generation tasks.
 * Generates logos for all championships defined in src/data/championships.ts.
 * 
 * - Reads championship data directly from the TypeScript source file
 * - Generates 1:1 aspect ratio logos using AI image generation
 * - Saves to public/images/generated/logos/championships/{championship-id}.png
 * - Skips championships that already have logos (unless force regeneration)
 * 
 * This replaces/supplements the standalone generator in gen6-venues-ui.js
 * by integrating championship logo generation into the Content Studio pipeline.
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'

const IMAGE_OUTPUT_DIR = 'public/images/generated/logos/championships'
const CHAMPIONSHIPS_FILE = 'src/data/championships.ts'

// ============================================================
// CHAMPIONSHIP DATA EXTRACTION
// ============================================================

interface ChampionshipData {
  id: string
  name: string
  shortName: string
  type: string
  region: string
  tier: string
  prestige: number
  multiClass: boolean
  format: string
  historicEra?: string
  manufacturer?: string
}

/**
 * Extract championship data from the TypeScript source file.
 * Uses regex to parse the championship objects without requiring
 * TypeScript compilation or module loading.
 */
function extractChampionships(projectRoot: string): ChampionshipData[] {
  const filePath = path.join(projectRoot, CHAMPIONSHIPS_FILE)
  if (!fs.existsSync(filePath)) {
    console.warn(`Championships file not found: ${filePath}`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const championships: ChampionshipData[] = []

  // Match championship objects - extract key fields
  const champRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"](?:,\s*shortName:\s*['"]([^'"]+)['"])?[^}]*?type:\s*['"]([^'"]+)['"][^}]*?region:\s*['"]([^'"]+)['"][^}]*?tier:\s*['"]([^'"]+)['"][^}]*?format:\s*['"]([^'"]+)['"][^}]*?multiClass:\s*(true|false)[^}]*?prestige:\s*(\d+)/gs

  let match
  while ((match = champRegex.exec(content)) !== null) {
    const champ: ChampionshipData = {
      id: match[1],
      name: match[2],
      shortName: match[3] || match[2].substring(0, 6),
      type: match[4],
      region: match[5],
      tier: match[6],
      format: match[7],
      multiClass: match[8] === 'true',
      prestige: parseInt(match[9]),
    }

    // Try to extract historicEra if present
    const historicMatch = content.substring(match.index, match.index + 1000).match(/historicEra:\s*['"]([^'"]+)['"]/)
    if (historicMatch) {
      champ.historicEra = historicMatch[1]
    }

    // Try to extract manufacturer if present
    const mfgMatch = content.substring(match.index, match.index + 1000).match(/manufacturer:\s*['"]([^'"]+)['"]/)
    if (mfgMatch) {
      champ.manufacturer = mfgMatch[1]
    }

    championships.push(champ)
  }

  return championships
}

// ============================================================
// PROMPT BUILDING
// ============================================================

const TIER_DESCRIPTIONS: Record<string, string> = {
  'pinnacle': 'Elite world championship series with the highest production values',
  'elite': 'Top-tier professional racing championship with premium branding',
  'pro': 'Professional racing series with strong commercial presence',
  'professional': 'Professional racing series with strong commercial presence',
  'semi-pro': 'Competitive regional championship with growing identity',
  'amateur': 'Amateur racing series with community-focused branding',
  'entry': 'Entry-level racing championship with fresh, welcoming identity',
}

const REGION_STYLES: Record<string, string> = {
  'Global': 'International world championship feel, universal design language',
  'Europe': 'European motorsport tradition, classic racing heritage',
  'Americas': 'American racing heritage, bold and dynamic',
  'Asia-Pacific': 'Asian motorsport style, modern and technological',
  'Brazil': 'Brazilian racing passion, vibrant and energetic colors',
  'Australia': 'Australian racing identity, bold outback spirit',
  'USA': 'American stock car and oval racing heritage, stars and speed',
}

const TYPE_STYLES: Record<string, string> = {
  'spec-series': 'Single manufacturer branding, clean manufacturer-aligned design',
  'national': 'National pride and country identity, flag-inspired elements',
  'continental': 'Regional prestige, multi-country scope',
  'international': 'Global championship, world-class prestige',
  'historic': 'Vintage heritage, retro design elements, classic motorsport nostalgia',
  'multi-class': 'Multi-class racing, layered complexity, prototype-GT dynamic',
  'club': 'Friendly club atmosphere, accessible community racing',
  'endurance-special': 'Iconic standalone event, legendary race branding',
}

function buildChampionshipLogoPrompt(champ: ChampionshipData): string {
  const tierDesc = TIER_DESCRIPTIONS[champ.tier] || 'Professional racing series'
  const regionStyle = REGION_STYLES[champ.region] || 'International motorsport'
  const typeStyle = TYPE_STYLES[champ.type] || 'Professional racing championship'

  let extraContext = ''
  if (champ.historicEra) {
    extraContext += ` Era: ${champ.historicEra} vintage racing.`
  }
  if (champ.manufacturer) {
    extraContext += ` Associated with ${champ.manufacturer} brand identity.`
  }
  if (champ.type === 'endurance-special') {
    extraContext += ' Iconic standalone endurance race event. Legendary, prestigious.'
  }
  if (champ.type === 'club') {
    extraContext += ' Friendly, approachable club racing event. Community spirit.'
  }
  if (champ.format === 'endurance') {
    extraContext += ' Endurance racing format - emphasize stamina and duration.'
  }
  if (champ.multiClass) {
    extraContext += ' Multi-class racing event with different car categories.'
  }

  return `Professional racing championship logo design for "${champ.name}". ${tierDesc}. ${regionStyle}. ${typeStyle}.${extraContext} Dynamic, prestigious championship branding. Trophy or laurel wreath elements where appropriate. No text, iconic emblem only. Clean vector style on white background. Suitable for use as a badge at small sizes. High-quality motorsport championship identity.`
}

// ============================================================
// TASK GENERATION
// ============================================================

/**
 * Create image generation tasks for championship logos.
 * Skips championships that already have a generated logo file.
 */
export function createChampionshipImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const championships = extractChampionships(projectRoot)

  if (championships.length === 0) {
    console.warn('No championships extracted from source file')
    return tasks
  }

  const logoDir = path.join(projectRoot, IMAGE_OUTPUT_DIR)
  // Ensure the output directory exists
  if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true })
  }

  for (const champ of championships) {
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${champ.id}.png`)

    // Skip if logo already exists
    if (fs.existsSync(imagePath)) continue

    const taskId = `championship-logo-${champ.id}`
    const prompt = buildChampionshipLogoPrompt(champ)

    tasks.push({
      id: taskId,
      entityId: champ.id,
      entityName: `Logo: ${champ.shortName}`,
      category: 'championships',
      type: 'image',
      priority: 3, // Higher priority than portraits, same as scenes
      prompt,
      outputPath: imagePath,
      metadata: {
        name: champ.name,
        shortName: champ.shortName,
        type: champ.type,
        region: champ.region,
        tier: champ.tier,
        prestige: champ.prestige,
      },
    })
  }

  return tasks
}

/**
 * Create image generation tasks for ALL championship logos,
 * including ones that already exist (for regeneration).
 */
export function createChampionshipRegenerateAllTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const championships = extractChampionships(projectRoot)

  if (championships.length === 0) {
    console.warn('No championships extracted from source file')
    return tasks
  }

  const logoDir = path.join(projectRoot, IMAGE_OUTPUT_DIR)
  if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true })
  }

  for (const champ of championships) {
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${champ.id}.png`)
    const taskId = `championship-logo-regen-${champ.id}`
    const prompt = buildChampionshipLogoPrompt(champ)

    tasks.push({
      id: taskId,
      entityId: champ.id,
      entityName: `Logo: ${champ.shortName}`,
      category: 'championships',
      type: 'image',
      priority: 3,
      prompt,
      outputPath: imagePath,
      metadata: {
        name: champ.name,
        shortName: champ.shortName,
        type: champ.type,
        region: champ.region,
        tier: champ.tier,
        prestige: champ.prestige,
        regenerate: true,
      },
    })
  }

  return tasks
}
