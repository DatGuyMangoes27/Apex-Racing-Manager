/**
 * Contact profile generation tasks.
 * Generates 600 contacts across 25+ types.
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'
import { generateContactTraits } from '../stat-generator'
import { buildPortraitPrompt } from '../prompt-engine'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/profiles'
const IMAGE_OUTPUT_DIR = 'public/images/generated/contacts'

const TOTAL_CONTACTS = 600

// 25+ contact types with target distribution
const CONTACT_TYPE_WEIGHTS: [string, number][] = [
  ['business_mogul', 30],
  ['tech_entrepreneur', 35],
  ['actor', 25],
  ['musician', 25],
  ['athlete', 30],
  ['celebrity', 20],
  ['film_director', 15],
  ['fashion_designer', 15],
  ['agent', 20],
  ['lawyer', 25],
  ['banker', 20],
  ['sponsor_exec', 30],
  ['politician', 15],
  ['diplomat', 10],
  ['professor', 15],
  ['doctor', 15],
  ['architect', 10],
  ['chef', 15],
  ['journalist', 25],
  ['influencer', 25],
  ['philanthropist', 15],
  ['military_officer', 10],
  ['pilot', 15],
  ['yacht_captain', 10],
  ['artist', 20],
]

const NATIONALITIES = [
  'British', 'Italian', 'German', 'French', 'Spanish', 'Brazilian', 'Japanese',
  'Australian', 'Canadian', 'American', 'Dutch', 'Austrian', 'Swiss', 'Belgian',
  'Mexican', 'Argentine', 'Colombian', 'Finnish', 'Swedish', 'Norwegian',
  'Danish', 'Polish', 'Czech', 'Portuguese', 'South Korean', 'Indian',
  'Chinese', 'Thai', 'Malaysian', 'South African', 'New Zealand', 'Irish',
  'Turkish', 'Greek', 'Romanian', 'Croatian', 'Chilean', 'Peruvian',
  'Lebanese', 'Moroccan', 'Egyptian', 'Nigerian', 'Kenyan', 'Filipino',
  'Vietnamese', 'Indonesian', 'Emirati', 'Saudi', 'Qatari', 'Singaporean',
]

function seedRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h |= 0; h = h + 0x6D2B79F5 | 0
    let t = Math.imul(h ^ h >>> 15, 1 | h)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function intRange(min: number, max: number, rng: () => number): number {
  return Math.floor(min + rng() * (max - min + 1))
}

export function createContactTextTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []

  // Build type assignment list matching weights
  const typeAssignments: string[] = []
  const totalWeight = CONTACT_TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  for (const [type, weight] of CONTACT_TYPE_WEIGHTS) {
    const count = Math.round((weight / totalWeight) * TOTAL_CONTACTS)
    for (let i = 0; i < count; i++) {
      typeAssignments.push(type)
    }
  }
  // Fill remaining slots
  while (typeAssignments.length < TOTAL_CONTACTS) {
    typeAssignments.push(CONTACT_TYPE_WEIGHTS[typeAssignments.length % CONTACT_TYPE_WEIGHTS.length][0])
  }

  for (let i = 0; i < TOTAL_CONTACTS; i++) {
    const contactId = `contact-${String(i).padStart(4, '0')}`
    const rng = seedRandom(contactId)
    const contactType = typeAssignments[i]
    const taskId = `contact-text-${contactId}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `contact-${contactId}.json`)

    if (fs.existsSync(outputPath)) continue

    const nationality = pick(NATIONALITIES, rng)
    const age = intRange(22, 65, rng)
    const gender = rng() > 0.55 ? 'female' : 'male'
    const traits = generateContactTraits(contactId, contactType)

    tasks.push({
      id: taskId,
      entityId: contactId,
      entityName: `Contact ${i + 1} (${contactType.replace(/_/g, ' ')})`,
      category: 'contacts',
      type: 'text',
      priority: 4,
      prompt: buildContactProfilePrompt(contactId, contactType, nationality, age, gender, traits),
      outputPath,
      metadata: { contactType, nationality, age, gender, ...traits },
    })
  }

  return tasks
}

export function createContactImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const profilesDir = path.join(projectRoot, TEXT_OUTPUT_DIR)
  if (!fs.existsSync(profilesDir)) return []

  const contactFiles = fs.readdirSync(profilesDir).filter(f => f.startsWith('contact-'))

  for (const file of contactFiles) {
    const contactId = file.replace('.json', '')
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${contactId}.png`)

    if (fs.existsSync(imagePath)) continue

    try {
      const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf-8'))
      const taskId = `contact-image-${contactId}`

      const prompt = buildPortraitPrompt({
        id: contactId,
        age: profile.age || 35,
        gender: profile.gender || 'male',
        nationality: profile.nationality || 'British',
        type: profile.contactType || 'business_mogul',
        category: 'contact',
        traits: profile.traits,
        physical: profile.physical || generateDefaultPhysical(contactId),
      })

      tasks.push({
        id: taskId,
        entityId: contactId,
        entityName: profile.name || contactId,
        category: 'contacts',
        type: 'image',
        priority: 4,
        prompt,
        outputPath: imagePath,
      })
    } catch {
      // Skip corrupt files
    }
  }

  return tasks
}

function buildContactProfilePrompt(
  contactId: string,
  contactType: string,
  nationality: string,
  age: number,
  gender: string,
  traits: ReturnType<typeof generateContactTraits>
): string {
  const typeTitle = contactType.replace(/_/g, ' ')

  return `Generate a complete social contact profile for a motorsport career management game.

Contact Type: ${typeTitle}
Nationality: ${nationality}
Age: ${age}
Gender: ${gender}
Personality Traits: ${traits.traits.join(', ')}
Interests: ${traits.interests.join(', ')}
Education: ${traits.educationLevel}
Wealth Level: ${traits.wealthLevel.replace(/_/g, ' ')}
Social Circle: ${traits.socialCircle.replace(/_/g, ' ')}

Return a JSON object with EXACTLY these fields:
{
  "name": "A realistic full name matching nationality and gender",
  "nationality": "${nationality}",
  "age": ${age},
  "gender": "${gender}",
  "contactType": "${contactType}",
  "bio": "A 2-3 paragraph biography covering their professional achievements, personality, and connection to the motorsport world. Explain why a racing driver might cross paths with them.",
  "physical": {
    "skinTone": "A realistic skin tone",
    "hairColor": "Hair color",
    "hairStyle": "Specific hair style",
    "eyeColor": "Eye color",
    "facialHair": ${gender === 'male' ? '"Facial hair or null"' : 'null'},
    "description": "A 2-sentence physical description"
  },
  "connectionToMotorsport": "How this person is connected to the racing world (1-2 sentences)",
  "meetingContext": "Where/how the player would realistically meet this person",
  "conversationTopics": ["4-5 things this person loves to talk about"],
  "canHelp": ["2-3 ways this contact could benefit the player's career"],
  "personality_summary": "A one-line personality summary"
}

Make every contact feel unique and three-dimensional. They should feel like real people with lives beyond the game.`
}

function generateDefaultPhysical(id: string): any {
  const rng = seedRandom(id + '-phys')
  const tones = ['very fair', 'fair', 'light', 'olive', 'medium', 'tan', 'medium brown', 'dark brown', 'very dark']
  const hairs = ['black', 'dark brown', 'brown', 'auburn', 'blonde', 'dark blonde', 'gray', 'silver', 'white', 'red']
  const styles = ['short', 'medium', 'long', 'cropped', 'wavy', 'curly', 'slicked back', 'bald', 'receding', 'natural']
  const eyes = ['brown', 'dark brown', 'hazel', 'green', 'blue', 'gray', 'amber']

  return {
    skinTone: pick(tones, rng),
    hairColor: pick(hairs, rng),
    hairStyle: pick(styles, rng),
    eyeColor: pick(eyes, rng),
    facialHair: null,
    description: '',
  }
}
