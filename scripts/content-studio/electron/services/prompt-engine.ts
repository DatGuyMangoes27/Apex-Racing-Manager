/**
 * Unique Portrait Prompt Engine
 * Builds a distinctive portrait prompt for every person using 7 varied dimensions.
 * Deterministic - same seed always produces same prompt.
 */

// Seeded PRNG
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

// ============================================================
// DIMENSION 1: Settings / Locations
// ============================================================

const SETTINGS: Record<string, string[]> = {
  team_principal: [
    'in an F1-style paddock hospitality suite with team branding visible',
    'standing by a pit wall with timing monitors glowing behind them',
    'in a sleek modern office with championship trophies on glass shelves',
    'walking through a race paddock at golden hour',
    'seated in a luxury motorhome with the team crest on the wall',
    'on an outdoor terrace overlooking a race circuit',
    'in a press conference room with microphones and team backdrop',
  ],
  chief_engineer: [
    'in a dimly lit wind tunnel control room with screens everywhere',
    'surrounded by CAD workstations and coffee cups in a factory',
    'next to a stripped-down race car chassis in a clean workshop',
    'in a simulation room with triple-screen rigs behind them',
    'in a white-walled R&D lab with carbon fiber samples on the desk',
    'at a portable engineering station at a race circuit',
  ],
  technical_director: [
    'in a glass-walled corner office overlooking a factory floor',
    'at a whiteboard covered in aero diagrams and CFD printouts',
    'in a data center with server racks and telemetry dashboards',
    'walking through a pristine manufacturing facility',
  ],
  strategist: [
    'in front of a wall of live timing screens showing race data',
    'at a compact desk with multiple laptops and weather radar',
    'in a race control room with team radio headsets on the desk',
    'in a strategy briefing room with a projected circuit map',
  ],
  race_engineer: [
    'on a pit wall with a headset around their neck, circuit behind',
    'in a cramped data room surrounded by telemetry printouts',
    'at a portable workstation in a race team garage',
    'walking through a pit lane at dusk, garages lit behind',
  ],
  default_staff: [
    'in a modern open-plan motorsport team office',
    'in a team factory corridor with racing memorabilia on walls',
    'at a standing desk in a bright, clean workspace',
    'in a hospitality area with team colors on the walls',
    'in a paddock tent during a race weekend',
  ],
  actor: [
    'on a film set with soft cinematic lighting behind',
    'at a red carpet premiere, flashbulbs catching their face',
    'in a vintage Hollywood-style dressing room',
    'relaxing in a director\'s chair on a sound stage',
  ],
  musician: [
    'in a recording studio with mixing boards and warm amber light',
    'backstage at a concert venue, instruments visible behind',
    'in a rooftop terrace with a city skyline at sunset',
    'in a cozy vinyl record shop with shelves behind',
  ],
  athlete: [
    'in a world-class training facility, equipment in background',
    'post-workout with a towel over one shoulder, gym behind',
    'at a sunlit outdoor stadium with empty seats behind',
    'on a yacht deck in athletic casual wear, ocean behind',
  ],
  business_mogul: [
    'in a penthouse corner office with floor-to-ceiling city views',
    'at a mahogany boardroom table, city lights outside',
    'in a private members club with leather chairs and dim lighting',
    'on the steps of a financial district building',
  ],
  tech_entrepreneur: [
    'in a minimalist startup office with whiteboard walls',
    'at a standing desk with multiple monitors showing code',
    'in a Silicon Valley campus courtyard, modern architecture behind',
    'in a co-working space with exposed brick and neon signs',
  ],
  fashion_designer: [
    'in a haute couture atelier with fabric swatches and mannequins',
    'backstage at a fashion show, models blurred behind',
    'in a sleek showroom with dramatic spotlighting',
    'at a fabric market, rolls of colorful textiles around',
  ],
  chef: [
    'in a Michelin-starred restaurant kitchen, copper pans gleaming',
    'at an outdoor market in Provence, fresh produce around',
    'behind a gleaming stainless steel counter, flames in background',
    'in a farmhouse kitchen with herbs hanging from the ceiling',
  ],
  doctor: [
    'in a modern medical office with anatomical art on the wall',
    'in a hospital corridor with soft natural light from windows',
    'at a medical conference with presentation screens behind',
  ],
  lawyer: [
    'in a mahogany-paneled law office with leather-bound books',
    'stepping out of a courthouse in a metropolitan city',
    'at a glass-walled corner office overlooking a city',
  ],
  professor: [
    'in a book-lined university office with afternoon sun streaming in',
    'at a lecture podium in an ornate academic hall',
    'in a research library surrounded by open texts and notebooks',
  ],
  diplomat: [
    'in an embassy reception room with flags and formal decor',
    'at a UN-style conference setting with name placards',
    'in a grand government building with marble columns',
  ],
  pilot: [
    'in a private jet cockpit, instruments glowing softly',
    'on an airport tarmac at sunset, aircraft behind',
    'in an aviation lounge with runway views',
  ],
  yacht_captain: [
    'on the bridge of a luxury yacht, ocean stretching behind',
    'at a Mediterranean marina with superyachts in background',
    'on a teak deck at sunset, nautical equipment visible',
  ],
  partner: [
    'in a sunlit cafe terrace in a European city',
    'at a rooftop bar with a city skyline at golden hour',
    'walking through a botanical garden in soft light',
    'in a cozy bookshop with warm overhead lighting',
    'at an art gallery opening, paintings blurred behind',
    'in a luxury hotel lobby with marble and warm tones',
    'at a beachside restaurant at sunset',
    'in a vibrant street market with color all around',
  ],
  default: [
    'in a tastefully decorated interior with natural light',
    'against a clean, softly blurred urban backdrop',
    'in a modern space with interesting architectural elements',
    'outdoors with pleasant natural scenery behind',
  ],
}

// ============================================================
// DIMENSION 2: Expression / Mood
// ============================================================

const EXPRESSIONS: Record<string, string[]> = {
  aggressive: ['intense focused stare with fierce competitive energy', 'jaw set with determined fire in their eyes', 'sharp hawk-like gaze full of ambition'],
  calculating: ['thoughtful analytical gaze, one eyebrow slightly raised', 'quiet intelligence behind a knowing half-smile', 'pensive expression, deep in strategic thought'],
  steady: ['calm composed demeanor radiating quiet confidence', 'serene focused expression, steady and reliable', 'warm steady gaze with understated authority'],
  flashy: ['charismatic confident grin, eyes sparkling with charm', 'dazzling smile with effortless star quality', 'playful smirk dripping with swagger'],
  defensive: ['cautious observant expression, guarded but alert', 'watchful eyes with a hint of wariness', 'measured careful gaze, reading the situation'],
  inconsistent: ['energetic animated expression caught mid-thought', 'unpredictable sparkle in their eyes, restless energy', 'wide-eyed enthusiasm barely contained'],
  ambitious: ['sharp determined gaze hungry for success', 'commanding expression radiating drive and purpose'],
  loyal: ['warm genuine smile with kind trustworthy eyes', 'steady honest gaze full of quiet dependability'],
  demanding: ['piercing evaluating stare that expects excellence', 'stern focused expression that brooks no nonsense'],
  flexible: ['easy relaxed smile with approachable warmth', 'open friendly expression adaptable and easygoing'],
  visionary: ['faraway inspired look seeing possibilities others miss', 'bright passionate eyes full of creative energy'],
  pragmatic: ['practical no-nonsense expression grounded and real', 'clear direct gaze cutting through complexity'],
  default: [
    'mid-laugh with genuine warmth, eyes crinkling',
    'slight knowing smirk, confident and at ease',
    'warm approachable smile with relaxed confidence',
    'pensive and reflective, gazing slightly off-camera',
    'quiet intensity, deeply focused yet composed',
    'cool detached elegance with a hint of mystery',
    'weathered determination in their expression',
    'infectious enthusiasm, caught in a moment of joy',
    'relaxed and easygoing with natural charm',
    'sharp and alert, radiating competence',
  ],
}

// ============================================================
// DIMENSION 3: Composition / Framing
// ============================================================

const COMPOSITIONS = [
  'Close-up portrait, head and shoulders, slight three-quarter angle',
  'Environmental portrait from chest up, background in context',
  'Candid moment, slightly off-center composition, natural feel',
  'Over-the-shoulder look back at camera, dynamic angle',
  'Seated portrait, leaning slightly forward with engaged posture',
  'Standing portrait from waist up, confident stance',
  'Side profile with face turned slightly toward camera',
  'Full face straight-on, powerful direct gaze at lens',
  'Three-quarter view with one hand resting on chin',
  'Medium shot caught mid-action, authentic and unposed',
]

// ============================================================
// DIMENSION 4: Lighting
// ============================================================

const LIGHTING = [
  'Rembrandt lighting with dramatic shadows on one side of the face',
  'Golden hour warm sunlight creating a soft amber glow',
  'Cool blue studio backlighting with fill from the front',
  'Natural window light, soft and directional, slight shadows',
  'Neon-accented dramatic lighting with colored reflections',
  'Overcast soft diffused outdoor light, even and flattering',
  'Spotlight from above, cinema-style with depth',
  'Warm ambient candlelit-style glow, intimate mood',
  'High-contrast editorial lighting, sharp and defined',
  'Soft bokeh with subject sharp, dreamy background blur',
  'Split lighting, half face lit half in shadow, moody',
  'Broad daylight with reflector fill, clean and bright',
  'Dappled light through trees or blinds creating patterns',
  'Ring light catchlights in eyes, modern and clean',
]

// ============================================================
// DIMENSION 5: Clothing (role-specific)
// ============================================================

const CLOTHING: Record<string, string[]> = {
  team_principal: [
    'wearing a tailored dark suit with team-colored pocket square',
    'in team-branded polo shirt with an expensive watch visible',
    'wearing a crisp white shirt with sleeves rolled up, team lanyard',
    'in a fitted blazer over team polo, radio earpiece in ear',
  ],
  chief_engineer: [
    'in a dark navy team polo with engineering lanyard and radio earpiece',
    'wearing a clean team softshell jacket over polo shirt',
    'in a button-down shirt with team badge, sleeves rolled to elbows',
  ],
  strategist: [
    'wearing noise-cancelling headset around neck, team polo',
    'in a lightweight team jacket with data tablet in hand',
  ],
  race_engineer: [
    'in a team race suit or overalls, headset visible',
    'wearing team polo with pit pass lanyard, sunglasses pushed up',
  ],
  default_staff: [
    'in professional team-branded polo and slacks',
    'wearing a smart casual button-down with team badge',
    'in a clean team softshell over a collared shirt',
  ],
  actor: [
    'in an effortlessly stylish designer outfit', 'wearing a classic black ensemble with statement jewelry',
    'in a tailored suit with creative flair, open collar',
  ],
  musician: [
    'in a vintage band tee under a leather jacket', 'wearing layered bohemian-style clothing',
    'in all-black with silver accessories and rings',
  ],
  athlete: [
    'in premium athletic wear with a sleek performance jacket', 'wearing a fitted compression top showing athletic build',
    'in casual sportswear with a designer cap',
  ],
  business_mogul: [
    'in an impeccably tailored charcoal suit with cufflinks', 'wearing a cashmere overcoat over a bespoke shirt',
    'in power suit with subtle luxury watch and monogrammed cuffs',
  ],
  tech_entrepreneur: [
    'wearing a fitted black turtleneck and slim dark jeans', 'in a casual blazer over a graphic tee, minimalist style',
    'in a premium hoodie and clean sneakers, understated wealth',
  ],
  fashion_designer: [
    'in a bold avant-garde outfit with architectural details', 'wearing all-black with statement oversized glasses',
    'draped in their own designs, creative and sculptural',
  ],
  chef: [
    'in pristine white chef\'s coat with sleeves rolled up, kitchen towel on shoulder',
    'wearing a black chef\'s apron over a simple white tee',
  ],
  doctor: [
    'in a crisp white lab coat over business casual', 'wearing a sharp button-down with stethoscope visible',
  ],
  lawyer: [
    'in a power suit with a silk tie and pocket square', 'wearing a classic navy blazer with gold buttons',
  ],
  professor: [
    'in a tweed blazer with elbow patches over a turtleneck', 'wearing reading glasses pushed up on their head, cardigan',
  ],
  diplomat: [
    'in formal diplomatic attire, perfectly pressed suit', 'wearing a tasteful blazer with a flag pin on the lapel',
  ],
  military_officer: [
    'in a well-fitted navy blazer with brass buttons, hint of medals', 'wearing a crisp dress shirt with military precision',
  ],
  pilot: [
    'in aviator sunglasses pushed up, wearing a leather flight jacket', 'in a crisp white pilot shirt with epaulettes',
  ],
  yacht_captain: [
    'in a navy polo with epaulettes and nautical stripes', 'wearing a casual linen shirt, tanned and salt-weathered',
  ],
  partner: [
    'in elegant evening wear that suits their personality',
    'wearing smart casual with personal style showing through',
    'dressed stylishly in designer pieces that reflect their taste',
  ],
  default: [
    'in well-fitted smart casual that reflects their personality',
    'wearing tasteful clothing appropriate to their world',
  ],
}

// ============================================================
// DIMENSION 6: Distinguishing Details (trait-based)
// ============================================================

const TRAIT_DETAILS: Record<string, string[]> = {
  eccentric: ['wearing an unusual vintage brooch on their lapel', 'with a distinctive colorful pocket watch chain', 'sporting unique mismatched cufflinks'],
  intellectual: ['wire-rimmed reading glasses perched on their nose', 'a well-worn book tucked under one arm', 'ink stains faintly visible on their fingers'],
  adventurous: ['subtle tan lines from outdoor life, weathered leather watch', 'a small scar on their chin from an old adventure', 'windswept hair with a rugged outdoors quality'],
  glamorous: ['impeccable makeup with diamond earrings catching the light', 'flawless styling with a statement luxury piece', 'perfectly manicured with a glinting designer ring'],
  rebellious: ['visible tattoo sleeve peeking from under a rolled cuff', 'unconventional piercings adding edge to their look', 'deliberately undone hair with a devil-may-care attitude'],
  creative: ['paint-flecked hands or artist\'s rings', 'a creative asymmetric hairstyle', 'interesting hand-crafted jewelry'],
  ambitious: ['a power watch visible at the cuff', 'sharp manicured nails and polished appearance', 'everything about them screams upward trajectory'],
  mysterious: ['eyes that hold secrets, slightly shadowed', 'a hint of something hidden in their enigmatic expression', 'dark understated clothing that reveals nothing'],
  nurturing: ['warm laugh lines around kind eyes', 'a gentle softness to their features', 'approachable warmth in every detail'],
  perfectionist: ['not a hair out of place, meticulous grooming', 'crisp pressed clothing without a single wrinkle', 'symmetrical precise styling'],
  default: ['a distinctive personal touch that sets them apart', 'subtle details reflecting their unique character'],
}

// ============================================================
// DIMENSION 7: Photography Style
// ============================================================

const PHOTOGRAPHY_STYLES = [
  'Shot on 85mm f/1.4 lens, shallow depth of field, magazine editorial quality',
  'Cinematic portrait with subtle film grain and moody atmosphere',
  'Clean polished headshot, razor-sharp focus, corporate magazine style',
  'Lifestyle photography with natural candid feel, documentary style',
  'Fashion editorial aesthetic, high contrast with dramatic shadows',
  'Fine art portrait with painterly quality and rich tonal range',
  'Photojournalistic style, capturing an authentic unguarded moment',
  'Modern commercial portrait with clean lines and controlled lighting',
  'Vintage-inspired portrait with warm tones and classic composition',
]

// ============================================================
// Main prompt builder
// ============================================================

export interface PromptInput {
  id: string
  age: number
  gender: string
  nationality: string
  role?: string          // For staff
  type?: string          // For contacts
  category: string       // driver, partner, contact, staff, etc.
  personality?: string   // For drivers/staff
  traits?: string[]      // For partners/contacts
  physical: {
    skinTone: string
    hairColor: string
    hairStyle: string
    eyeColor: string
    facialHair: string | null
    description: string
  }
  teamName?: string
  careerStage?: string
  style?: string
}

export function buildPortraitPrompt(input: PromptInput): string {
  const rng = seedRandom(input.id + '-prompt')

  // 1. Setting
  const settingKey = input.role || input.type || input.category || 'default'
  const settingPool = SETTINGS[settingKey] || SETTINGS.default_staff || SETTINGS.default
  const setting = pick(settingPool, rng)

  // 2. Expression
  const exprKey = input.personality || 'default'
  const exprPool = EXPRESSIONS[exprKey] || EXPRESSIONS.default
  const expression = pick(exprPool, rng)

  // 3. Composition
  const composition = pick(COMPOSITIONS, rng)

  // 4. Lighting
  const lighting = pick(LIGHTING, rng)

  // 5. Clothing
  const clothingKey = input.role || input.type || input.category || 'default'
  const clothingPool = CLOTHING[clothingKey] || CLOTHING.default_staff || CLOTHING.default
  const clothing = pick(clothingPool, rng)

  // 6. Distinguishing detail (from traits)
  let detail = ''
  if (input.traits && input.traits.length > 0) {
    for (const trait of input.traits) {
      if (TRAIT_DETAILS[trait]) {
        detail = pick(TRAIT_DETAILS[trait], rng)
        break
      }
    }
  }
  if (!detail) {
    detail = pick(TRAIT_DETAILS.default, rng)
  }

  // 7. Photography style
  const photoStyle = pick(PHOTOGRAPHY_STYLES, rng)

  // Build the physical description naturally
  const genderWord = input.gender === 'female' ? 'woman' : 'man'
  const physDesc = buildPhysicalDescription(input.physical, input.gender)

  // Build role/context line
  let roleContext = ''
  if (input.category === 'driver' || input.category === 'rookies') {
    const stageDesc = input.careerStage === 'rookie' ? 'up-and-coming' :
      input.careerStage === 'rising' ? 'rising star' :
      input.careerStage === 'peak' ? 'established' :
      input.careerStage === 'veteran' ? 'veteran' : ''
    roleContext = `${stageDesc} racing driver`.trim()
    if (input.teamName) roleContext += ` competing for ${input.teamName}`
  } else if (input.role) {
    const roleTitle = input.role.replace(/_/g, ' ')
    roleContext = `${roleTitle} in motorsport`
    if (input.teamName) roleContext += ` at ${input.teamName}`
  } else if (input.type) {
    const typeTitle = input.type.replace(/_/g, ' ')
    roleContext = typeTitle
  } else if (input.category === 'partner') {
    roleContext = input.style ? `${input.style} individual` : 'person'
  }

  // Assemble the prompt
  const lines = [
    `${composition} of a ${input.age}-year-old ${input.nationality} ${genderWord}${roleContext ? `, ${roleContext}` : ''}.`,
    physDesc + '.',
    clothing + '.',
    expression + '.',
    detail + '.',
    setting + '.',
    lighting + '.',
    photoStyle + '.',
  ]

  return lines.filter(l => l.trim() !== '.').join('\n')
}

function buildPhysicalDescription(physical: PromptInput['physical'], gender: string): string {
  const parts: string[] = []

  if (physical.skinTone) parts.push(`${physical.skinTone} skin`)
  if (physical.hairColor && physical.hairStyle) {
    parts.push(`${physical.hairColor} ${physical.hairStyle} hair`)
  }
  if (physical.eyeColor) parts.push(`${physical.eyeColor} eyes`)
  if (physical.facialHair && physical.facialHair !== 'clean shaven' && gender === 'male') {
    parts.push(physical.facialHair)
  }

  return parts.join(', ')
}
