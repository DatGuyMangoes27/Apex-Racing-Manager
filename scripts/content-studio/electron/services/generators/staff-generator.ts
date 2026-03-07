/**
 * Staff profile generation tasks.
 * Handles:
 * - Player hiring pool (750 staff across all types)
 * - AI team staff (27 per team x 117 teams)
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'
import { DataReader } from '../data-reader'
import { generateStaffSkills } from '../stat-generator'
import { buildPortraitPrompt } from '../prompt-engine'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/profiles'
const IMAGE_OUTPUT_DIR = 'public/images/generated/staff'

const STAFF_ROLES = {
  team: [
    'team_principal', 'chief_engineer', 'technical_director', 'head_of_aero',
    'race_engineer', 'strategist', 'sporting_director', 'head_of_operations', 'performance_engineer'
  ],
  facility: [
    'simulator_engineer', 'data_analyst', 'composite_technician', 'machinist',
    'electronics_engineer', 'quality_control', 'logistics_coordinator',
    'it_systems_manager', 'wind_tunnel_operator', 'paint_shop_specialist',
    'fabricator', 'test_driver_coordinator', 'hr_manager', 'finance_controller',
    'marketing_coordinator', 'pr_officer', 'catering_manager', 'security_chief'
  ],
}

const NATIONALITIES = [
  'British', 'Italian', 'German', 'French', 'Spanish', 'Brazilian', 'Japanese',
  'Australian', 'Canadian', 'American', 'Dutch', 'Austrian', 'Swiss', 'Belgian',
  'Mexican', 'Argentine', 'Colombian', 'Finnish', 'Swedish', 'Norwegian',
  'Danish', 'Polish', 'Czech', 'Hungarian', 'Portuguese', 'South Korean',
  'Indian', 'Chinese', 'Thai', 'Malaysian', 'Singaporean', 'South African',
  'New Zealand', 'Irish', 'Scottish', 'Welsh', 'Russian', 'Turkish',
  'Greek', 'Romanian', 'Croatian', 'Serbian', 'Chilean', 'Peruvian',
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

// ---- Hiring Pool Tasks ----

export function createStaffPoolTextTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const totalPool = 750

  // Split proportionally across role types
  const teamStaffCount = Math.round(totalPool * 0.35) // ~263
  const facilityStaffCount = totalPool - teamStaffCount // ~487

  // Generate team staff pool
  for (let i = 0; i < teamStaffCount; i++) {
    const staffId = `pool-team-${String(i).padStart(4, '0')}`
    const rng = seedRandom(staffId)
    const role = pick(STAFF_ROLES.team, rng)
    const taskId = `staff-pool-text-${staffId}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `staff-${staffId}.json`)

    if (fs.existsSync(outputPath)) continue

    const nationality = pick(NATIONALITIES, rng)
    const age = intRange(24, 60, rng)
    const tier = pick(['low', 'mid', 'mid', 'high'] as const, rng)
    const skills = generateStaffSkills(staffId, role, tier)
    const gender = rng() > 0.75 ? 'female' : 'male'

    tasks.push({
      id: taskId,
      entityId: staffId,
      entityName: `Staff Pool ${i + 1} (${role.replace(/_/g, ' ')})`,
      category: 'staff',
      type: 'text',
      priority: 4,
      prompt: buildStaffProfilePrompt(staffId, role, nationality, age, gender, tier, skills),
      outputPath,
      metadata: { role, nationality, age, gender, tier, skills },
    })
  }

  // Generate facility staff pool
  for (let i = 0; i < facilityStaffCount; i++) {
    const staffId = `pool-facility-${String(i).padStart(4, '0')}`
    const rng = seedRandom(staffId)
    const role = pick(STAFF_ROLES.facility, rng)
    const taskId = `staff-pool-text-${staffId}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `staff-${staffId}.json`)

    if (fs.existsSync(outputPath)) continue

    const nationality = pick(NATIONALITIES, rng)
    const age = intRange(22, 55, rng)
    const tier = pick(['low', 'low', 'mid', 'mid', 'high'] as const, rng)
    const skills = generateStaffSkills(staffId, role, tier)
    const gender = rng() > 0.70 ? 'female' : 'male'

    tasks.push({
      id: taskId,
      entityId: staffId,
      entityName: `Staff Pool ${teamStaffCount + i + 1} (${role.replace(/_/g, ' ')})`,
      category: 'staff',
      type: 'text',
      priority: 4,
      prompt: buildStaffProfilePrompt(staffId, role, nationality, age, gender, tier, skills),
      outputPath,
      metadata: { role, nationality, age, gender, tier, skills },
    })
  }

  return tasks
}

// ---- AI Team Staff Tasks ----

export function createAITeamStaffTextTasks(reader: DataReader, projectRoot: string): GenerationTask[] {
  const teams = reader.extractTeams()
  const tasks: GenerationTask[] = []

  for (const team of teams) {
    const teamTier = mapTeamTier(team.tier)

    // 9 team staff + 18 facility staff = 27 per team
    const teamStaffCount = 9
    const facilityStaffCount = 18

    for (let i = 0; i < teamStaffCount; i++) {
      const staffId = `ai-${team.id}-team-${String(i).padStart(2, '0')}`
      const rng = seedRandom(staffId)
      const role = STAFF_ROLES.team[i % STAFF_ROLES.team.length]
      const taskId = `ai-staff-text-${staffId}`
      const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `staff-${staffId}.json`)

      if (fs.existsSync(outputPath)) continue

      const nationality = pick(NATIONALITIES, rng)
      const age = intRange(28, 60, rng)
      const gender = rng() > 0.78 ? 'female' : 'male'
      const skills = generateStaffSkills(staffId, role, teamTier)

      tasks.push({
        id: taskId,
        entityId: staffId,
        entityName: `${team.name} - ${role.replace(/_/g, ' ')}`,
        category: 'ai-team-staff',
        type: 'text',
        priority: 5,
        prompt: buildStaffProfilePrompt(staffId, role, nationality, age, gender, teamTier, skills, team.name),
        outputPath,
        metadata: { role, teamId: team.id, teamName: team.name, nationality, age, gender, tier: teamTier, skills },
      })
    }

    for (let i = 0; i < facilityStaffCount; i++) {
      const staffId = `ai-${team.id}-fac-${String(i).padStart(2, '0')}`
      const rng = seedRandom(staffId)
      const role = STAFF_ROLES.facility[i % STAFF_ROLES.facility.length]
      const taskId = `ai-staff-text-${staffId}`
      const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `staff-${staffId}.json`)

      if (fs.existsSync(outputPath)) continue

      const nationality = pick(NATIONALITIES, rng)
      const age = intRange(22, 55, rng)
      const gender = rng() > 0.65 ? 'female' : 'male'
      const skills = generateStaffSkills(staffId, role, teamTier)

      tasks.push({
        id: taskId,
        entityId: staffId,
        entityName: `${team.name} - ${role.replace(/_/g, ' ')}`,
        category: 'ai-team-staff',
        type: 'text',
        priority: 5,
        prompt: buildStaffProfilePrompt(staffId, role, nationality, age, gender, teamTier, skills, team.name),
        outputPath,
        metadata: { role, teamId: team.id, teamName: team.name, nationality, age, gender, tier: teamTier, skills },
      })
    }
  }

  return tasks
}

// ---- Staff Image Tasks (for pool + AI team staff) ----

export function createStaffImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []
  const profilesDir = path.join(projectRoot, TEXT_OUTPUT_DIR)
  if (!fs.existsSync(profilesDir)) return []

  const staffFiles = fs.readdirSync(profilesDir).filter(f => f.startsWith('staff-'))

  for (const file of staffFiles) {
    const staffId = file.replace('staff-', '').replace('.json', '')
    const imagePath = path.join(projectRoot, IMAGE_OUTPUT_DIR, `${staffId}.png`)

    if (fs.existsSync(imagePath)) continue

    try {
      const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf-8'))
      const taskId = `staff-image-${staffId}`

      const prompt = buildPortraitPrompt({
        id: staffId,
        age: profile.age || 35,
        gender: profile.gender || 'male',
        nationality: profile.nationality || 'British',
        role: profile.role || 'default_staff',
        category: 'staff',
        personality: profile.personality,
        physical: profile.physical || generateDefaultPhysical(staffId),
        teamName: profile.teamName,
      })

      tasks.push({
        id: taskId,
        entityId: staffId,
        entityName: profile.name || staffId,
        category: 'staff',
        type: 'image',
        priority: 5, // Medium-high for staff images (before drivers)
        prompt,
        outputPath: imagePath,
      })
    } catch {
      // Skip corrupt files
    }
  }

  return tasks
}

// ---- Helpers ----

function mapTeamTier(tier: string): string {
  const map: Record<string, string> = {
    professional: 'elite',
    semi_professional: 'high',
    amateur_elite: 'high',
    amateur: 'mid',
    grassroots: 'low',
  }
  return map[tier] || 'mid'
}

function buildStaffProfilePrompt(
  staffId: string,
  role: string,
  nationality: string,
  age: number,
  gender: string,
  tier: string,
  skills: any,
  teamName?: string
): string {
  const roleTitle = role.replace(/_/g, ' ')
  const teamContext = teamName ? `\nTeam: ${teamName}` : '\nAvailable for hire (free agent)'
  const tierDesc = tier === 'elite' ? 'elite, world-class' :
    tier === 'high' ? 'highly experienced' :
    tier === 'mid' ? 'competent, experienced' : 'entry-level, developing'

  return `Generate a complete staff member profile for a motorsport career management game.

Role: ${roleTitle}
Nationality: ${nationality}
Age: ${age}
Gender: ${gender}
Experience Level: ${tierDesc}${teamContext}
Skills: Technical ${skills.skills.technical}/100, Management ${skills.skills.management}/100, Innovation ${skills.skills.innovation}/100
Personality: ${skills.personality}
Traits: ${skills.traits.join(', ')}

Return a JSON object with EXACTLY these fields:
{
  "name": "A realistic full name matching the nationality and gender",
  "nationality": "${nationality}",
  "age": ${age},
  "gender": "${gender}",
  "role": "${role}",
  "bio": "A 2-3 paragraph professional biography covering their career journey, how they got into motorsport, their approach to their role, and what makes them distinctive.",
  "physical": {
    "skinTone": "A realistic skin tone for their nationality",
    "hairColor": "Natural hair color",
    "hairStyle": "Specific hair style description",
    "eyeColor": "Eye color",
    "facialHair": ${gender === 'male' ? '"Specific facial hair or null"' : 'null'},
    "description": "A 1-sentence physical description"
  },
  "personality": "${skills.personality}",
  "quirks": ["2-3 unique workplace quirks or habits"]
}

Make every person distinct and memorable. Vary physical appearances widely.`
}

function generateDefaultPhysical(id: string): any {
  const rng = seedRandom(id + '-phys')
  const tones = ['very fair', 'fair', 'light', 'light olive', 'olive', 'medium', 'tan', 'medium brown', 'dark brown', 'very dark']
  const hairs = ['black', 'dark brown', 'brown', 'light brown', 'auburn', 'red', 'blonde', 'dark blonde', 'gray', 'silver', 'white']
  const styles = ['short cropped', 'medium length', 'long', 'buzzed', 'wavy', 'curly', 'straight', 'slicked back', 'messy']
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
