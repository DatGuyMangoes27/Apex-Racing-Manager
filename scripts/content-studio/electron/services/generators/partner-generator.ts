/**
 * Partner profile generation tasks.
 * Generates 500 potential partners with full profiles.
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'
import { generatePartnerTraits } from '../stat-generator'
import { buildPortraitPrompt } from '../prompt-engine'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/profiles'
const IMAGE_OUTPUT_DIR = 'public/images/generated/partners'

const TOTAL_PARTNERS = 500

const NATIONALITIES = [
  'British', 'Italian', 'German', 'French', 'Spanish', 'Brazilian', 'Japanese',
  'Australian', 'Canadian', 'American', 'Dutch', 'Austrian', 'Swiss', 'Belgian',
  'Mexican', 'Argentine', 'Colombian', 'Finnish', 'Swedish', 'Norwegian',
  'Danish', 'Polish', 'Czech', 'Portuguese', 'South Korean', 'Indian',
  'Chinese', 'Thai', 'Malaysian', 'South African', 'New Zealand', 'Irish',
  'Turkish', 'Greek', 'Romanian', 'Croatian', 'Chilean', 'Peruvian',
  'Cuban', 'Puerto Rican', 'Hawaiian', 'Icelandic', 'Filipino', 'Vietnamese',
  'Lebanese', 'Moroccan', 'Egyptian', 'Nigerian', 'Kenyan',
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

export function createPartnerTextTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []

  for (let i = 0; i < TOTAL_PARTNERS; i++) {
    const partnerId = `partner-${String(i).padStart(4, '0')}`
    const rng = seedRandom(partnerId)
    const taskId = `partner-text-${partnerId}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `partner-${partnerId}.json`)

    if (fs.existsSync(outputPath)) continue

    const nationality = pick(NATIONALITIES, rng)
    const age = intRange(20, 42, rng)
    const gender = rng() > 0.15 ? 'female' : 'male'
    const traits = generatePartnerTraits(partnerId)

    tasks.push({
      id: taskId,
      entityId: partnerId,
      entityName: `Partner ${i + 1}`,
      category: 'partners',
      type: 'text',
      priority: 4,
      prompt: buildPartnerProfilePrompt(partnerId, nationality, age, gender, traits),
      outputPath,
      metadata: { nationality, age, gender, ...traits },
    })
  }

  return tasks
}

export function createPartnerImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const profilesDir = path.join(projectRoot, TEXT_OUTPUT_DIR)
  if (!fs.existsSync(profilesDir)) return []

  const partnerFiles = fs.readdirSync(profilesDir).filter(f => f.startsWith('partner-'))

  for (const file of partnerFiles) {
    const partnerId = file.replace('.json', '')
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${partnerId}.png`)

    if (fs.existsSync(imagePath)) continue

    try {
      const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf-8'))
      const taskId = `partner-image-${partnerId}`

      const prompt = buildPortraitPrompt({
        id: partnerId,
        age: profile.age || 28,
        gender: profile.gender || 'female',
        nationality: profile.nationality || 'British',
        category: 'partner',
        traits: profile.traits,
        style: profile.style,
        physical: profile.physical || generateDefaultPartnerPhysical(partnerId),
      })

      tasks.push({
        id: taskId,
        entityId: partnerId,
        entityName: profile.name || partnerId,
        category: 'partners',
        type: 'image',
        priority: 3,  // Higher priority for partners (they use the Pro model)
        prompt,
        outputPath: imagePath,
        model: 'gemini-3-pro-image-preview',  // Nano Banana Pro for high-quality partner portraits
      })
    } catch {
      // Skip corrupt files
    }
  }

  return tasks
}

function buildPartnerProfilePrompt(
  partnerId: string,
  nationality: string,
  age: number,
  gender: string,
  traits: ReturnType<typeof generatePartnerTraits>
): string {
  return `Generate a complete profile for a potential romantic partner in a motorsport career management game.

Nationality: ${nationality}
Age: ${age}
Gender: ${gender}
Career: ${traits.career.replace(/_/g, ' ')}
Career Income: $${traits.careerIncome}/month
Personality Traits: ${traits.traits.join(', ')}
Style: ${traits.style}
Education Level: ${traits.educationLevel}
Wealth Level: ${traits.wealthLevel.replace(/_/g, ' ')}
Social Circle: ${traits.socialCircle.replace(/_/g, ' ')}

Desires:
- Wants children: ${traits.desires.wantsChildren ? 'Yes' : 'No'} (${traits.desires.desiredChildrenCount})
- Wants marriage: ${traits.desires.wantsMarriage ? 'Yes' : 'No'}
- Lifestyle expectations: ${traits.desires.lifestyleExpectations}
- Quality time importance: ${traits.desires.qualityTimeImportance}/100
- Social life importance: ${traits.desires.socialLifeImportance}/100

Return a JSON object with EXACTLY these fields:
{
  "name": "A realistic full name matching nationality and gender",
  "nationality": "${nationality}",
  "age": ${age},
  "gender": "${gender}",
  "bio": "A 2-3 paragraph personal biography covering their background, career, personality, and what they look for in a partner. Make it feel like a dating profile meets a character bio.",
  "physical": {
    "skinTone": "A realistic skin tone for their nationality and appearance",
    "hairColor": "Natural or styled hair color",
    "hairStyle": "Specific detailed hair style",
    "eyeColor": "Eye color",
    "facialHair": ${gender === 'male' ? '"Facial hair style or null"' : 'null'},
    "description": "A 2-sentence physical description emphasizing their most distinctive features"
  },
  "meetingContext": "How the player might realistically meet this person (e.g., at a charity gala, through a mutual friend, at a team sponsor event)",
  "firstImpression": "A vivid 1-2 sentence description of what the player notices when first meeting them",
  "interests": ["5-6 specific hobbies and interests"],
  "dealBreakers": ["2-3 things that would end a relationship for this person"],
  "loveLanguage": "Their primary love language and how it manifests"
}

Make every partner feel like a distinct, three-dimensional person. Vary appearances widely - different body types, styles, features.`
}

function generateDefaultPartnerPhysical(id: string): any {
  const rng = seedRandom(id + '-phys')
  const tones = ['very fair', 'fair', 'light', 'light olive', 'olive', 'medium', 'tan', 'medium brown', 'dark brown', 'very dark']
  const hairs = ['black', 'dark brown', 'brown', 'light brown', 'auburn', 'red', 'blonde', 'dark blonde', 'platinum', 'gray']
  const styles = ['long straight', 'long wavy', 'shoulder length', 'short bob', 'pixie cut', 'braided', 'curly', 'natural afro', 'updo', 'messy bun']
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
