/**
 * Driver narrative & image generation tasks.
 * Handles all 544+ existing drivers plus 200 rookies.
 */

import path from 'path'
import { GenerationTask } from '../batch-processor'
import { DataReader, ExistingDriver } from '../data-reader'
import { generateDriverStats } from '../stat-generator'
import { buildPortraitPrompt } from '../prompt-engine'
import fs from 'fs'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/narratives'
const IMAGE_OUTPUT_DIR = 'public/images/generated/drivers'

export function createDriverTextTasks(reader: DataReader, projectRoot: string): GenerationTask[] {
  const drivers = reader.loadAllDriverProfiles()
  const tasks: GenerationTask[] = []

  for (const driver of drivers) {
    const taskId = `driver-text-${driver.id}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `driver-${driver.id}.json`)

    // Skip if output already exists
    if (fs.existsSync(outputPath)) continue

    const stats = generateDriverStats(driver.id, driver.age, driver.personality)
    const facts = reader.extractRealDriverFacts()
    const driverFacts = facts[driver.id]

    const prompt = buildDriverNarrativePrompt(driver, stats, driverFacts)

    tasks.push({
      id: taskId,
      entityId: driver.id,
      entityName: driver.name,
      category: 'drivers',
      type: 'text',
      priority: 3, // Medium priority (teams and tracks first)
      prompt,
      outputPath,
      metadata: { stats, age: driver.age, nationality: driver.nationality },
    })
  }

  return tasks
}

export function createDriverImageTasks(reader: DataReader, projectRoot: string): GenerationTask[] {
  const drivers = reader.loadAllDriverProfiles()
  const tasks: GenerationTask[] = []

  for (const driver of drivers) {
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${driver.id}.png`)

    // Skip if image already exists (keep existing driver portraits)
    if (fs.existsSync(imagePath)) continue

    const taskId = `driver-image-${driver.id}`
    const stats = generateDriverStats(driver.id, driver.age, driver.personality)

    const prompt = buildPortraitPrompt({
      id: driver.id,
      age: driver.age,
      gender: 'male', // Most racing drivers, default
      nationality: driver.nationalityAdjective || driver.nationality,
      category: 'driver',
      personality: driver.personality || stats.personality,
      physical: driver.physical || {
        skinTone: 'light',
        hairColor: 'dark brown',
        hairStyle: 'short',
        eyeColor: 'brown',
        facialHair: null,
        description: '',
      },
      teamName: driver.teams?.[0],
      careerStage: driver.careerStage || stats.careerStage,
    })

    tasks.push({
      id: taskId,
      entityId: driver.id,
      entityName: driver.name,
      category: 'drivers',
      type: 'image',
      priority: 10, // LOW priority - drivers last for images
      prompt,
      outputPath: imagePath,
    })
  }

  return tasks
}

function buildDriverNarrativePrompt(
  driver: ExistingDriver,
  stats: ReturnType<typeof generateDriverStats>,
  realFacts?: { realAge?: number; knownFor?: string }
): string {
  const teamsList = driver.teams?.join(', ') || 'independent'
  const knownFor = realFacts?.knownFor ? `\nKnown for: ${realFacts.knownFor}` : ''

  return `You are a motorsport journalist writing for a premium racing encyclopedia.

Generate a rich, detailed JSON profile for this racing driver:

Name: ${driver.name}
Nationality: ${driver.nationality}
Age: ${driver.age}
Career Stage: ${stats.careerStage}
Personality: ${stats.personality}
Teams: ${teamsList}${knownFor}
Overall Skill Level: ${(stats.baseSkill * 100).toFixed(0)}/100

Physical appearance:
- Skin tone: ${driver.physical?.skinTone || 'unknown'}
- Hair: ${driver.physical?.hairColor || ''} ${driver.physical?.hairStyle || ''}
- Eyes: ${driver.physical?.eyeColor || ''}

Return a JSON object with EXACTLY these fields:
{
  "biography": "A 3-4 paragraph backstory covering their origin, how they got into racing, defining moments, and current career status. Make it vivid and personal with specific anecdotes.",
  "drivingStyle": "A paragraph describing their unique driving approach - how they attack corners, manage tires, handle pressure, etc.",
  "rivalries": ["Name 2-3 fictional rival drivers and a brief reason for each rivalry"],
  "quirks": ["3 unique personal quirks or habits, like a pre-race ritual or superstition"],
  "nickname": "A racing nickname that fits their personality",
  "famousQuote": "A memorable quote attributed to this driver about racing or life",
  "careerHighlight": "Their single greatest career moment described in 1-2 sentences",
  "careerLowPoint": "Their worst career moment described in 1-2 sentences"
}

Be creative but consistent with their stats and personality. Make each narrative UNIQUE and memorable.`
}
