/**
 * Sponsor profile generation tasks.
 * Generates 500 sponsors with full Sponsor-shaped JSON (name, story, paymentTiers, requirements, visibility, etc.).
 * No runtime derivation — all values come from generated output.
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/profiles'
const IMAGE_OUTPUT_DIR = 'public/images/generated/logos/sponsors'

const TOTAL_SPONSORS = 500

const CATEGORIES = [
  'energy_drinks', 'oil_fuel', 'tires', 'tech_gaming', 'equipment', 'watches',
  'lifestyle', 'automotive', 'financial', 'local', 'gaming', 'apparel',
  'finance', 'tech', 'luxury'
] as const

const TIERS = ['entry', 'mid', 'high', 'elite'] as const

const COUNTRIES = [
  'USA', 'Germany', 'UK', 'Italy', 'France', 'Japan', 'Austria', 'Switzerland',
  'Netherlands', 'Spain', 'Brazil', 'Australia', 'Canada', 'South Korea',
  'UAE', 'Saudi Arabia', 'India', 'China', 'Mexico', 'Belgium', 'Sweden',
  'Monaco', 'Singapore', 'Hong Kong', 'Ireland', 'Finland', 'Poland',
  'Czech Republic', 'Hungary', 'Portugal', 'Argentina', 'South Africa',
  'New Zealand', 'Malaysia', 'Thailand', 'Indonesia', 'Turkey', 'Russia'
]

const VISIBILITY_OPTIONS = ['always', 'unlock_after_reputation', 'unlock_after_contact', 'approach_only'] as const

function seedRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h |= 0; h = h + 0x6D2B79F5 | 0
    const t = Math.imul(h ^ h >>> 15, 1 | h)
    const u = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((u ^ u >>> 14) >>> 0) / 4294967296
  }
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickWeighted<T>(items: [T, number][], rng: () => number): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [item, w] of items) {
    r -= w
    if (r <= 0) return item
  }
  return items[items.length - 1][0]
}

export function createSponsorTextTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const visibilityWeights: [typeof VISIBILITY_OPTIONS[number], number][] = [
    ['always', 55],
    ['unlock_after_reputation', 25],
    ['unlock_after_contact', 12],
    ['approach_only', 8],
  ]

  for (let i = 0; i < TOTAL_SPONSORS; i++) {
    const sponsorId = `sponsor-${String(i).padStart(4, '0')}`
    const rng = seedRandom(sponsorId)
    const category = pick(CATEGORIES, rng)
    const tier = pick(TIERS, rng)
    const country = pick(COUNTRIES, rng)
    const visibility = pickWeighted(visibilityWeights, rng)

    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `sponsor-${sponsorId}.json`)
    if (fs.existsSync(outputPath)) continue

    const taskId = `sponsor-text-${sponsorId}`
    tasks.push({
      id: taskId,
      entityId: sponsorId,
      entityName: `Sponsor ${i + 1} (${category})`,
      category: 'sponsors',
      type: 'text',
      priority: 4,
      prompt: buildSponsorProfilePrompt(sponsorId, category, tier, country, visibility),
      outputPath,
      metadata: { category, tier, country, visibility },
    })
  }

  return tasks
}

function buildSponsorProfilePrompt(
  sponsorId: string,
  category: string,
  tier: string,
  country: string,
  visibility: string
): string {
  return `You are generating a sponsor profile for a motorsport career management game. The sponsor will appear in a "Sponsor Market" where team owners seek sponsorship deals.

SEED DATA (use these exact values for the indicated fields):
- id: "${sponsorId}"
- category: "${category}"
- tier: "${tier}"
- country: "${country}"
- visibility: "${visibility}"
${visibility === 'unlock_after_reputation' ? '- Assign unlockReputation a number between 30 and 80 (reputation threshold at which this sponsor becomes visible).' : ''}

Generate a FICTIONAL but realistic brand appropriate for motorsport sponsorship. Use the category to inspire the type of company (e.g. energy_drinks = beverage brand, watches = luxury watchmaker, tech = software/hardware company). Invent a plausible name and short description.

Return a single JSON object with NO markdown and NO code fence. Use EXACTLY this structure (all fields required unless marked optional):

{
  "id": "${sponsorId}",
  "name": "Invented brand name",
  "category": "${category}",
  "tier": "${tier}",
  "country": "${country}",
  "description": "One sentence tagline or short description of the brand.",
  "story": "2-4 sentences: why this brand sponsors motorsport, their history or values, what they seek from a partnership. Make it specific and believable.",
  "paymentTiers": {
    "entry": { "monthly": <number>, "winBonus": <number>, "podiumBonus": <number>, "championshipBonus": <number> },
    "mid": { "monthly": <number>, "winBonus": <number>, "podiumBonus": <number>, "championshipBonus": <number> },
    "elite": { "monthly": <number>, "winBonus": <number>, "podiumBonus": <number>, "championshipBonus": <number> }
  },
  "requirements": {
    "minReputation": <0-90>,
    "minMarketability": <0-90>,
    "seriesTiers": ["optional array e.g. pro, elite"],
    "nationalities": ["optional array of country names for bonus"],
    "minWins": <optional number>,
    "minPodiums": <optional number>
  },
  "priority": {
    "primary": "performance|media|events|brand_alignment|balanced",
    "secondary": "performance|media|events|brand_alignment|balanced",
    "weight": <1-5>
  },
  "expectations": {
    "minSeasonWins": <optional>,
    "minSeasonPodiums": <optional>,
    "requiredShoutouts": <optional>,
    "requiredEvents": <optional>,
    "noControversyClause": <optional boolean>,
    "preferredImageStyle": "professional|edgy|family_friendly|luxury|technical"
  },
  "visibility": "${visibility}"${visibility === 'unlock_after_reputation' ? ',\n  "unlockReputation": <number 30-80>' : ''},
  "imagePath": "logos/sponsors/${sponsorId}.png"
}

IMPORTANT: Output must be valid JSON only. Do not use undefined or trailing commas. If visibility is not "unlock_after_reputation", omit the "unlockReputation" field entirely.

Payment guidelines (realistic motorsport figures, in USD):
- entry tier: monthly roughly 5k-25k, winBonus 2k-10k, podiumBonus 1k-5k, championshipBonus 15k-75k
- mid tier: monthly 25k-80k, winBonus 10k-35k, podiumBonus 5k-18k, championshipBonus 80k-250k
- elite tier: monthly 80k-400k, winBonus 35k-150k, podiumBonus 18k-80k, championshipBonus 250k-1.5M
Scale by sponsor tier (entry/mid/high/elite) and category—luxury and energy_drinks can be at the high end.

Output ONLY the JSON object, no other text.`
}

export function createSponsorImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const profilesDir = path.join(projectRoot, TEXT_OUTPUT_DIR)
  if (!fs.existsSync(profilesDir)) return []

  const sponsorFiles = fs.readdirSync(profilesDir).filter(f => f.startsWith('sponsor-') && f.endsWith('.json'))
  const logoDir = path.join(projectRoot, IMAGE_OUTPUT_DIR)
  if (!fs.existsSync(path.dirname(logoDir))) return tasks

  for (const file of sponsorFiles) {
    const sponsorId = file.replace('sponsor-', '').replace('.json', '')
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${sponsorId}.png`)

    if (fs.existsSync(imagePath)) continue

    try {
      const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf-8'))
      const name = profile.name || 'Sponsor'
      const category = profile.category || 'tech'
      const country = profile.country || 'USA'
      const taskId = `sponsor-image-${sponsorId}`

      const prompt = `Professional, clean logo for a fictional ${category.replace(/_/g, ' ')} brand named "${name}", based in ${country}. Style: suitable for motorsport sponsorship, recognizable at small sizes, no text unless it is the brand name. Flat design or minimal 3D. PNG, transparent or solid background.`

      tasks.push({
        id: taskId,
        entityId: sponsorId,
        entityName: `Logo ${name}`,
        category: 'sponsors',
        type: 'image',
        priority: 5,
        prompt,
        outputPath: imagePath,
      })
    } catch {
      // Skip corrupt files
    }
  }

  return tasks
}
