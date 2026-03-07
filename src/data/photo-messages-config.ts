// ============================================
// PHOTO MESSAGES CONFIGURATION
// ============================================
// Probability tables, category weights, caption pools, scene prompts,
// and event overrides for the AI-generated photo message system.

import type { PhotoMessageCategory } from '@/data/messaging-config'
import type { ContactType } from '@/types/personalLife'

// ============================================
// PROBABILITY: Should this message have a photo?
// ============================================

/**
 * Base probability that an NPC message includes a photo, by contact type.
 * Partners send photos most often; business contacts almost never.
 */
export const PHOTO_CHANCE_BY_CONTACT_TYPE: Record<ContactType, number> = {
  partner:        0.22,
  potential_date: 0.15,
  family:         0.12,
  friend:         0.08,
  rival_driver:   0.05,
  team_staff:     0.03,
  sponsor_rep:    0.02,
  business:       0.02,
  rival:          0.04,
  team_principal: 0.01,
}

/**
 * Maximum photo messages generated per weekly processing batch.
 * Caps API usage and save game bloat.
 */
export const MAX_PHOTOS_PER_WEEK = 3

// ============================================
// CATEGORY WEIGHTS: What kind of photo?
// ============================================

interface CategoryWeight {
  category: PhotoMessageCategory
  weight: number
  /** Only include this category if children exist in the game state */
  requiresChildren?: boolean
}

/**
 * Per contact type, how likely each photo category is.
 * Weights are relative (they don't need to sum to 100).
 */
export const PHOTO_CATEGORY_WEIGHTS: Record<string, CategoryWeight[]> = {
  partner: [
    { category: 'selfie', weight: 30 },
    { category: 'food', weight: 15 },
    { category: 'scenery', weight: 15 },
    { category: 'couple_memory', weight: 10 },
    { category: 'activity', weight: 10 },
    { category: 'race_day', weight: 10 },
    { category: 'pet', weight: 5 },
    { category: 'event', weight: 5 },
    { category: 'kids', weight: 20, requiresChildren: true },
  ],

  potential_date: [
    { category: 'selfie', weight: 35 },
    { category: 'food', weight: 15 },
    { category: 'scenery', weight: 15 },
    { category: 'activity', weight: 15 },
    { category: 'event', weight: 10 },
    { category: 'pet', weight: 10 },
  ],

  family: [
    { category: 'kids', weight: 40, requiresChildren: true },
    { category: 'activity', weight: 20 },
    { category: 'scenery', weight: 15 },
    { category: 'food', weight: 10 },
    { category: 'event', weight: 15 },
  ],

  friend: [
    { category: 'scenery', weight: 25 },
    { category: 'food', weight: 20 },
    { category: 'event', weight: 20 },
    { category: 'activity', weight: 15 },
    { category: 'selfie', weight: 10 },
    { category: 'race_day', weight: 10 },
  ],

  rival_driver: [
    { category: 'selfie', weight: 25 },
    { category: 'race_day', weight: 35 },
    { category: 'activity', weight: 20 },
    { category: 'event', weight: 20 },
  ],

  team_staff: [
    { category: 'work', weight: 40 },
    { category: 'race_day', weight: 30 },
    { category: 'food', weight: 15 },
    { category: 'event', weight: 15 },
  ],

  sponsor_rep: [
    { category: 'event', weight: 40 },
    { category: 'work', weight: 30 },
    { category: 'food', weight: 20 },
    { category: 'race_day', weight: 10 },
  ],

  team_principal: [
    { category: 'race_day', weight: 40 },
    { category: 'work', weight: 30 },
    { category: 'event', weight: 20 },
    { category: 'food', weight: 10 },
  ],

  // Fallback for any type not listed
  _default: [
    { category: 'scenery', weight: 30 },
    { category: 'food', weight: 25 },
    { category: 'selfie', weight: 20 },
    { category: 'event', weight: 15 },
    { category: 'activity', weight: 10 },
  ],
}

// ============================================
// CAPTION TEMPLATES
// ============================================

/**
 * Pool of caption strings per photo category.
 * {childName} is replaced at runtime if available.
 */
export const PHOTO_CAPTIONS: Record<PhotoMessageCategory, string[]> = {
  selfie: [
    'Missing you today',
    'Thinking of you 💕',
    'New look, what do you think?',
    'Ready for date night!',
    'Just got home from work',
    'Good morning from here',
    'How do I look?',
    'Guess where I am!',
    'Having a great day, wish you were here',
    'Bored at home 😴',
  ],

  scenery: [
    'Saw this and thought of you',
    'Wish you were here ✨',
    'Beautiful morning walk',
    'The view from here is incredible',
    'Sometimes you just have to stop and look',
    'Nature therapy',
    'Found a new favorite spot',
    'This reminded me of us',
  ],

  kids: [
    'Look how big they\'re getting!',
    'Someone made you a drawing today',
    'Park day! 🌳',
    'Like parent, like child',
    '{childName} says hi!',
    '{childName} wanted to show you this',
    'Growing up so fast',
    'Having the best time with {childName}',
    'Someone misses you!',
    '{childName} had a great day today',
  ],

  food: [
    'Guess where I am 🍝',
    'Made your favorite tonight',
    'You NEED to try this place',
    'Dinner is ready!',
    'Treating myself tonight',
    'This looks too good not to share',
    'New restaurant find!',
    'Cooking up something special',
  ],

  activity: [
    'Great workout today 💪',
    'Trying something new!',
    'This is so much fun',
    'My new hobby is going well',
    'Beautiful day for it',
    'Finally got around to doing this',
    'Living my best life',
  ],

  couple_memory: [
    'Remember this? 💕',
    'Throwback to the best times',
    'Found this old photo of us',
    'I miss days like this',
    'Look what popped up in my memories',
    'We should do this again soon',
  ],

  pet: [
    'Look at this face 🐾',
    'Someone wants your attention',
    'Sleeping angel',
    'Best cuddle buddy',
    'Our little troublemaker',
    'This one misses you too',
  ],

  work: [
    'Big day at the office',
    'Working hard or hardly working?',
    'New project coming together',
    'The grind never stops',
    'Exciting stuff happening at work',
  ],

  event: [
    'Having an amazing time!',
    'You should have come!',
    'The vibe here is incredible',
    'Out with friends tonight 🎉',
    'Great event!',
    'Met some interesting people tonight',
  ],

  race_day: [
    'Watching from the grandstand! 🏁',
    'Your car looks incredible out there',
    'So proud of you today',
    'The atmosphere here is electric!',
    'Look at this view from the paddock',
    'Race day vibes!',
    'The crowd is going wild!',
    'Best seats in the house',
  ],
}

// ============================================
// SCENE PROMPTS FOR AI IMAGE GENERATION
// ============================================

/**
 * Pool of scene descriptions used in AI image generation prompts.
 * Combined with the person's physical description for person-categories.
 * Each prompt should describe a SCENE without describing the person
 * (the reference image handles that).
 */
export const PHOTO_SCENE_PROMPTS: Record<PhotoMessageCategory, string[]> = {
  selfie: [
    'Casual phone selfie at a cozy café with warm ambient lighting, coffee cup visible in background, natural smile, relaxed vibe',
    'Quick mirror selfie in a stylish outfit, bedroom or hallway background, natural indoor lighting',
    'Outdoor selfie on a sunny day, park or garden in the background, natural daylight, hair slightly windswept',
    'Selfie at a rooftop bar in the evening, city lights in the background, warm sunset glow',
    'Relaxed selfie on the couch at home, cozy blanket visible, soft lamp lighting, authentic candid feel',
    'Morning selfie with fresh face, kitchen or balcony background, soft morning light streaming in',
    'Selfie at a restaurant table, elegant dinner setting visible in the background, warm candlelight',
    'Beach selfie with ocean and sand visible, sunglasses on, bright sunny day, vacation vibes',
    'Gym selfie after a workout, slightly sweaty, gym equipment in background, fluorescent lighting',
    'Selfie walking through a charming European street, old buildings and cobblestones visible',
  ],

  kids: [
    'Candid phone photo of this child playing in a sunny park, green grass and playground equipment in background, joyful expression, natural daylight',
    'Phone photo of this child drawing at a kitchen table, colorful crayons and paper visible, focused happy expression, warm indoor lighting',
    'Photo of this child eating ice cream, messy face, laughing, outdoor café or park setting, bright day',
    'Candid shot of this child playing with toys on a living room floor, cozy home setting, soft natural light from window',
    'Photo of this child at the beach building sandcastles, bucket and spade visible, sunny day, ocean in background',
    'School photo style shot of this child in neat clothes, sitting nicely, slight smile, indoor setting',
    'Photo of this child on a swing, mid-air, huge smile, park setting with trees, sunny day',
  ],

  scenery: [
    'Beautiful sunset over a coastal town, warm golden hour colors, taken from a hilltop viewpoint, phone camera quality, no people',
    'Stunning mountain vista with snow-capped peaks, clear blue sky, wildflowers in foreground, phone camera perspective',
    'Charming narrow European street with colorful buildings, cobblestones, hanging flower baskets, soft afternoon light',
    'Tropical beach with crystal clear turquoise water, white sand, palm trees, bright sunny day, phone quality',
    'Autumn forest path with golden and red leaves, sunlight filtering through trees, peaceful and serene mood',
    'City skyline at dusk with lights starting to glow, river or waterfront in foreground, purple and orange sky',
    'Rolling countryside with green fields, distant farmhouse, fluffy clouds, golden afternoon light',
    'Japanese garden with cherry blossoms, small bridge over koi pond, zen atmosphere, soft diffused light',
  ],

  food: [
    'Appetizing plate of pasta at an upscale Italian restaurant, warm ambient lighting, overhead phone camera angle, instagram food photography style',
    'Freshly baked homemade pizza on a kitchen counter, steam rising, rustic cutting board, warm kitchen lighting',
    'Beautifully plated sushi spread on a dark table, chopsticks, soy sauce, elegant Japanese restaurant setting',
    'Colorful smoothie bowl with fresh fruits and granola, bright morning light, café table, top-down view',
    'Juicy gourmet burger with fries, casual restaurant setting, ketchup and condiments, phone photo angle',
    'Homemade dinner on a nice plate, candles on the dining table, romantic home-cooked meal vibes',
    'Fresh breakfast spread with eggs, avocado toast, orange juice, morning light through kitchen window',
    'Decadent chocolate dessert at a fancy restaurant, elegant plating, dim moody lighting',
  ],

  activity: [
    'View from a hiking trail with panoramic mountain scenery, hiking boots visible at bottom of frame, bright day',
    'Yoga mat on a terrace overlooking a city, morning light, peaceful atmosphere, water bottle visible',
    'Indoor rock climbing wall, colorful holds, viewed from below, gym setting with high ceilings',
    'Tennis court from the baseline, racquet in foreground, sunny day, well-maintained court',
    'Cycling on a scenic coastal road, handlebars visible in frame, ocean to one side, beautiful day',
    'Art studio workspace with paintings and brushes, colorful paint splatters, creative messy environment',
    'Sailing on calm waters, boat deck and rigging visible, blue sky, peaceful ocean scene',
  ],

  couple_memory: [
    'Romantic dinner setting for two at a candlelit restaurant, wine glasses, roses, warm intimate atmosphere, slightly nostalgic filter',
    'Two pairs of feet on a sandy beach at sunset, waves lapping, golden light, vacation memory vibes',
    'Amusement park scene with ferris wheel lit up at night, cotton candy, happy vibrant atmosphere',
    'Picnic blanket in a beautiful park, cheese and wine spread out, dappled sunlight through trees',
    'Two coffee cups together on a café table with a rainy window view, cozy and intimate mood',
    'Sunset viewed from a balcony, two chairs side by side, wine glasses, romantic golden hour',
  ],

  pet: [
    'Adorable golden retriever lying on a couch, sleepy eyes, cozy living room, soft lighting',
    'Playful cat sitting on a windowsill, sunlight streaming in, curious expression, indoor scene',
    'Small dog in a cute sweater, sitting in a park, autumn leaves around, happy tongue-out expression',
    'Cat curled up on a bed, fluffy and content, bedroom with soft blankets, warm indoor lighting',
    'Dog at the beach, running with a ball, splashing in shallow water, sunny day, action shot',
    'Two puppies playing together on a grassy lawn, playful tumbling, bright outdoor light',
  ],

  work: [
    'Modern office desk with laptop, coffee cup, and notebooks, large windows with city view, professional and clean',
    'Engineering workshop or garage with technical equipment, detailed parts on workbench, focused work environment',
    'Presentation slide visible on a screen in a modern conference room, professional setting',
    'Creative workspace with mood boards, design materials, and a drawing tablet, artistic and organized',
    'Race team garage with car parts and telemetry screens visible, professional motorsport environment',
  ],

  event: [
    'Crowded party or gala event, elegant decorations, people socializing in background (blurred), warm festive lighting',
    'Outdoor summer festival with string lights and food stalls, vibrant atmosphere, evening time',
    'Charity gala ballroom with chandeliers, round tables, formal attire visible in blurred background',
    'Rooftop party with city skyline as backdrop, fairy lights, cocktails, sunset or evening sky',
    'Concert or live music venue, stage lights visible, excited crowd atmosphere, energetic vibe',
    'Art gallery opening, white walls with paintings, wine glasses, sophisticated crowd in background',
  ],

  race_day: [
    'View from a racing circuit grandstand showing race cars speeding past on track, excited crowd atmosphere, {trackName} motorsport event, phone camera quality',
    'Pit lane view with race cars being worked on by mechanics, high-energy motorsport atmosphere, team logos visible',
    'Paddock walkway at a race event, team hospitality units visible, busy race weekend atmosphere',
    'Starting grid with cars lined up, pre-race tension, officials and team staff around, bright race day',
    'Podium celebration viewed from the crowd, champagne spray, winner on top step, racing trophy visible',
    'Inside a VIP hospitality suite overlooking the race track, drinks on table, panoramic view of circuit',
  ],
}

// ============================================
// EVENT-BASED PHOTO OVERRIDES
// ============================================

interface EventPhotoOverride {
  /** Contact types that can trigger this override */
  contactTypes: string[]
  /** Photo category to use */
  category: PhotoMessageCategory
  /** Override caption (optional — falls back to regular pool) */
  captionOverrides?: string[]
  /** Probability multiplier (stacks with base photo chance) */
  chanceBoost: number
}

/**
 * When a specific game event fires, certain contact types have boosted
 * probability of sending a specific photo type.
 */
export const EVENT_PHOTO_OVERRIDES: Record<string, EventPhotoOverride> = {
  race_win: {
    contactTypes: ['partner', 'family', 'friend', 'potential_date'],
    category: 'race_day',
    captionOverrides: [
      'SO PROUD OF YOU!! 🏆',
      'YESSSS!! That was incredible!',
      'Winner winner! Look at this view!',
      'The crowd went absolutely wild!',
    ],
    chanceBoost: 0.40,
  },

  race_podium: {
    contactTypes: ['partner', 'family', 'friend'],
    category: 'race_day',
    captionOverrides: [
      'Podium!! Amazing!',
      'Watching you up there was incredible!',
    ],
    chanceBoost: 0.25,
  },

  race_crash: {
    contactTypes: ['partner', 'family'],
    category: 'selfie',
    captionOverrides: [
      'Please tell me you\'re okay',
      'Watching that was terrifying',
    ],
    chanceBoost: 0.15,
  },

  child_milestone: {
    contactTypes: ['partner', 'family'],
    category: 'kids',
    captionOverrides: [
      'You need to see this!',
      'They grow up so fast 🥺',
      'Can you believe it?!',
    ],
    chanceBoost: 0.50,
  },

  vacation_started: {
    contactTypes: ['partner', 'friend'],
    category: 'scenery',
    captionOverrides: [
      'This view!! 😍',
      'Finally relaxing',
      'Paradise found',
    ],
    chanceBoost: 0.45,
  },

  player_birthday: {
    contactTypes: ['partner', 'family', 'friend', 'potential_date'],
    category: 'selfie',
    captionOverrides: [
      'Happy birthday! Look what I got you 🎂',
      'Birthday selfie for the birthday legend!',
    ],
    chanceBoost: 0.35,
  },

  partner_anniversary: {
    contactTypes: ['partner'],
    category: 'couple_memory',
    captionOverrides: [
      'Happy anniversary, love 💕',
      'Look what came up in my memories today',
      'Best years of my life',
    ],
    chanceBoost: 0.60,
  },

  championship_clinched: {
    contactTypes: ['partner', 'family', 'friend', 'team_staff'],
    category: 'race_day',
    captionOverrides: [
      'CHAMPION!! I\'m literally crying right now!',
      'This is the best day ever!',
      'Celebrating tonight!',
    ],
    chanceBoost: 0.55,
  },

  holiday_greetings: {
    contactTypes: ['partner', 'family', 'friend', 'potential_date'],
    category: 'selfie',
    captionOverrides: [
      'Happy holidays! 🎄',
      'Season\'s greetings from us!',
      'Holiday vibes',
    ],
    chanceBoost: 0.30,
  },

  new_year: {
    contactTypes: ['partner', 'family', 'friend', 'potential_date'],
    category: 'event',
    captionOverrides: [
      'Happy New Year!! 🎆',
      'Cheers to a new year!',
      'New year, same us',
    ],
    chanceBoost: 0.35,
  },

  hobby_achievement: {
    contactTypes: ['partner', 'friend'],
    category: 'activity',
    captionOverrides: [
      'Finally did it!',
      'Look what I achieved today!',
      'Hard work pays off',
    ],
    chanceBoost: 0.30,
  },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Pick a random caption from the pool for a given category.
 * Replaces {childName} token if a name is provided.
 */
export function pickRandomCaption(category: PhotoMessageCategory, childName?: string): string {
  const pool = PHOTO_CAPTIONS[category]
  if (!pool || pool.length === 0) return ''

  let caption = pool[Math.floor(Math.random() * pool.length)]

  if (childName) {
    caption = caption.replace(/\{childName\}/g, childName)
  } else {
    // Remove {childName} references if no name available
    caption = caption.replace(/\{childName\}/g, 'the little one')
  }

  return caption
}

/**
 * Pick a weighted random photo category for a given contact type.
 * Filters out categories that require children if none exist.
 */
export function pickPhotoCategory(
  contactType: string,
  hasChildren: boolean
): PhotoMessageCategory {
  const weights = PHOTO_CATEGORY_WEIGHTS[contactType] || PHOTO_CATEGORY_WEIGHTS._default
  const eligible = weights.filter(w => {
    if (w.requiresChildren && !hasChildren) return false
    return true
  })

  if (eligible.length === 0) return 'scenery'

  const totalWeight = eligible.reduce((sum, w) => sum + w.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of eligible) {
    roll -= entry.weight
    if (roll <= 0) return entry.category
  }

  return eligible[0].category
}

/**
 * Determine if a message should include a photo, given the contact type
 * and optional event override boost.
 */
export function shouldAttachPhoto(
  contactType: ContactType,
  eventType?: string
): { shouldAttach: boolean; forcedCategory?: PhotoMessageCategory; captionOverrides?: string[] } {
  let chance = PHOTO_CHANCE_BY_CONTACT_TYPE[contactType] ?? 0.05

  // Check event overrides
  if (eventType) {
    const override = EVENT_PHOTO_OVERRIDES[eventType]
    if (override && override.contactTypes.includes(contactType)) {
      chance = Math.min(1, chance + override.chanceBoost)

      if (Math.random() <= chance) {
        return {
          shouldAttach: true,
          forcedCategory: override.category,
          captionOverrides: override.captionOverrides,
        }
      }
      return { shouldAttach: false }
    }
  }

  return {
    shouldAttach: Math.random() <= chance,
  }
}
