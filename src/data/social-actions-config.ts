// ============================================
// SOCIAL ACTIONS CONFIGURATION
// ============================================
// Centralized definitions for all social interactions available
// through the Phone's "Interact" panel. Values are tuned so that:
//  - Weekly decay (-0.5 to -2) eats ~1-2 small interactions just to maintain
//  - Building 30→80 takes ~30-50 deliberate actions over many in-game months
//  - Grand gestures feel impactful (+4-5) but never trivialise the grind
//  - Gifts give LESS than time-based activities

import type { ContactType } from '@/types/personalLife'

// ── Types ──

export type SocialActionCategory =
  | 'gift'
  | 'casual'
  | 'dining'
  | 'romantic'
  | 'event_invite'
  | 'professional'

export type LoveLanguageType =
  | 'words_of_affirmation'
  | 'acts_of_service'
  | 'receiving_gifts'
  | 'quality_time'
  | 'physical_touch'

export interface SocialAction {
  id: string
  name: string
  category: SocialActionCategory
  icon: string
  cost: number                    // Cash cost ($)
  timeCost: number                // Hours consumed (0 for gifts)
  availableFor: ContactType[]     // Which contact types can use this
  minRelationship?: number        // Minimum relationship level to unlock
  effects: {
    affection: number
    trust: number
    romance?: number              // Only applied when contact is partner / potential_date
  }
  description: string
  cooldownWeeks?: number          // Weeks before you can repeat with the same contact
  loveLanguageTag?: LoveLanguageType   // Which love language this action appeals to
  interestTags?: string[]              // Interest categories for shared-interest bonuses
}

// ── Category display metadata ──

export const SOCIAL_ACTION_CATEGORIES: {
  id: SocialActionCategory
  label: string
  icon: string
}[] = [
  { id: 'gift',          label: 'Gifts',         icon: '🎁' },
  { id: 'casual',        label: 'Hangouts',      icon: '☕' },
  { id: 'dining',        label: 'Dining & Drinks', icon: '🍽️' },
  { id: 'romantic',      label: 'Romantic',       icon: '💕' },
  { id: 'event_invite',  label: 'Invitations',    icon: '🎟️' },
  { id: 'professional',  label: 'Professional',   icon: '💼' },
]

// ── Contact-type visibility per category ──

const ROMANTIC_TYPES: ContactType[] = ['partner', 'potential_date']
const PERSONAL_TYPES: ContactType[] = ['partner', 'potential_date', 'friend', 'family']
const SOCIAL_TYPES: ContactType[] = ['partner', 'potential_date', 'friend', 'family', 'business', 'team_staff']
const BROAD_TYPES: ContactType[] = ['partner', 'potential_date', 'friend', 'family', 'business', 'sponsor_rep', 'team_staff']
const PROFESSIONAL_TYPES: ContactType[] = ['business', 'sponsor_rep', 'team_principal', 'team_staff']

// ── All social action definitions ──

export const SOCIAL_ACTIONS: SocialAction[] = [
  // ========================================
  // GIFTS (12 options)
  // ========================================
  {
    id: 'gift_greeting_card',
    name: 'Greeting Card',
    category: 'gift',
    icon: '💌',
    cost: 10,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 0.5, trust: 0 },
    description: 'A simple, thoughtful card.',
    loveLanguageTag: 'words_of_affirmation',
  },
  {
    id: 'gift_chocolates',
    name: 'Chocolates',
    category: 'gift',
    icon: '🍫',
    cost: 30,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 0.5, trust: 0 },
    description: 'A classic box of fine chocolates.',
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['fine_dining', 'luxury'],
  },
  {
    id: 'gift_flowers',
    name: 'Flowers',
    category: 'gift',
    icon: '💐',
    cost: 50,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 1, trust: 0 },
    description: 'A beautiful bouquet.',
    loveLanguageTag: 'receiving_gifts',
  },
  {
    id: 'gift_book_vinyl',
    name: 'Book / Vinyl',
    category: 'gift',
    icon: '📚',
    cost: 40,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 1, trust: 0.5 },
    description: 'Something picked with them in mind.',
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['art', 'music', 'culture'],
  },
  {
    id: 'gift_wine',
    name: 'Bottle of Wine',
    category: 'gift',
    icon: '🍷',
    cost: 80,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 1, trust: 0 },
    description: 'A premium bottle from a good year.',
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['fine_dining', 'luxury'],
  },
  {
    id: 'gift_perfume',
    name: 'Perfume / Cologne',
    category: 'gift',
    icon: '✨',
    cost: 120,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 1.5, trust: 0, romance: 0.5 },
    description: 'A luxury fragrance — personal and intimate.',
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['fashion', 'luxury'],
  },
  {
    id: 'gift_concert_tickets',
    name: 'Concert Tickets',
    category: 'gift',
    icon: '🎫',
    cost: 200,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 2, trust: 0.5 },
    description: 'Two tickets to a show they\'d love.',
    loveLanguageTag: 'quality_time',
    interestTags: ['music', 'entertainment', 'nightlife'],
  },
  {
    id: 'gift_jewelry',
    name: 'Jewelry',
    category: 'gift',
    icon: '💍',
    cost: 500,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 2, trust: 0, romance: 1 },
    description: 'A tasteful piece of jewelry.',
    minRelationship: 25,
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['fashion', 'luxury'],
  },
  {
    id: 'gift_designer_clothing',
    name: 'Designer Clothing',
    category: 'gift',
    icon: '👗',
    cost: 800,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 2.5, trust: 0, romance: 0.5 },
    description: 'High-end fashion from a top label.',
    minRelationship: 30,
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['fashion', 'luxury'],
  },
  {
    id: 'gift_luxury_watch',
    name: 'Luxury Watch',
    category: 'gift',
    icon: '⌚',
    cost: 2000,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 3, trust: 0, romance: 1 },
    description: 'An exclusive timepiece.',
    minRelationship: 40,
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['luxury', 'fashion'],
  },
  {
    id: 'gift_surprise_trip',
    name: 'Surprise Trip',
    category: 'gift',
    icon: '✈️',
    cost: 5000,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 4, trust: 1, romance: 2 },
    description: 'Flights and hotel to somewhere special.',
    minRelationship: 50,
    loveLanguageTag: 'quality_time',
    interestTags: ['travel', 'adventure'],
  },
  {
    id: 'gift_new_car',
    name: 'New Car',
    category: 'gift',
    icon: '🚗',
    cost: 50000,
    timeCost: 0,
    availableFor: PERSONAL_TYPES,
    effects: { affection: 5, trust: 2, romance: 3 },
    description: 'The ultimate grand gesture.',
    minRelationship: 60,
    loveLanguageTag: 'receiving_gifts',
    interestTags: ['luxury', 'motorsport'],
  },

  // ========================================
  // CASUAL HANGOUTS (8 options)
  // ========================================
  {
    id: 'casual_coffee',
    name: 'Coffee Meetup',
    category: 'casual',
    icon: '☕',
    cost: 30,
    timeCost: 1,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1, trust: 0.5 },
    description: 'Grab a quick coffee and catch up.',
    loveLanguageTag: 'quality_time',
  },
  {
    id: 'casual_lunch',
    name: 'Grab Lunch',
    category: 'casual',
    icon: '🥪',
    cost: 80,
    timeCost: 1.5,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1, trust: 1 },
    description: 'A relaxed lunch together.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining'],
  },
  {
    id: 'casual_walk',
    name: 'Go for a Walk / Jog',
    category: 'casual',
    icon: '🚶',
    cost: 0,
    timeCost: 1,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 0.5, trust: 1 },
    description: 'Fresh air and easy conversation.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fitness', 'nature'],
  },
  {
    id: 'casual_watch_game',
    name: 'Watch a Game Together',
    category: 'casual',
    icon: '📺',
    cost: 100,
    timeCost: 3,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1.5, trust: 1 },
    description: 'Cheer on a team over drinks and snacks.',
    loveLanguageTag: 'quality_time',
    interestTags: ['sports', 'motorsport', 'entertainment'],
  },
  {
    id: 'casual_drive',
    name: 'Go for a Drive',
    category: 'casual',
    icon: '🏎️',
    cost: 50,
    timeCost: 2,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1, trust: 1 },
    description: 'Hit the road and enjoy the scenery.',
    loveLanguageTag: 'quality_time',
    interestTags: ['motorsport', 'adventure', 'travel'],
  },
  {
    id: 'casual_gym',
    name: 'Hit the Gym Together',
    category: 'casual',
    icon: '🏋️',
    cost: 0,
    timeCost: 1.5,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1, trust: 1.5 },
    description: 'A workout session builds mutual respect.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fitness', 'sports'],
  },
  {
    id: 'casual_videogames',
    name: 'Play Video Games',
    category: 'casual',
    icon: '🎮',
    cost: 0,
    timeCost: 2,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1.5, trust: 0.5 },
    description: 'Some friendly competition on the couch.',
    loveLanguageTag: 'quality_time',
    interestTags: ['gaming', 'entertainment'],
  },
  {
    id: 'casual_shopping',
    name: 'Go Shopping',
    category: 'casual',
    icon: '🛍️',
    cost: 200,
    timeCost: 3,
    availableFor: SOCIAL_TYPES,
    effects: { affection: 1.5, trust: 0.5 },
    description: 'Browse shops and hang out downtown.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fashion', 'luxury'],
  },

  // ========================================
  // DINING & DRINKS (6 options)
  // ========================================
  {
    id: 'dining_casual_dinner',
    name: 'Casual Dinner',
    category: 'dining',
    icon: '🍝',
    cost: 150,
    timeCost: 2,
    availableFor: BROAD_TYPES,
    effects: { affection: 1.5, trust: 1 },
    description: 'Good food and easy conversation.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining'],
  },
  {
    id: 'dining_fine_dining',
    name: 'Fine Dining',
    category: 'dining',
    icon: '🥂',
    cost: 500,
    timeCost: 3,
    availableFor: BROAD_TYPES,
    effects: { affection: 2.5, trust: 1.5, romance: 0.5 },
    description: 'An upscale restaurant experience.',
    minRelationship: 20,
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining', 'luxury'],
  },
  {
    id: 'dining_drinks',
    name: 'Drinks at a Bar',
    category: 'dining',
    icon: '🍺',
    cost: 80,
    timeCost: 2,
    availableFor: BROAD_TYPES,
    effects: { affection: 1, trust: 1 },
    description: 'Unwind over a couple of drinks.',
    loveLanguageTag: 'quality_time',
    interestTags: ['nightlife'],
  },
  {
    id: 'dining_bbq',
    name: 'Host a BBQ / House Party',
    category: 'dining',
    icon: '🔥',
    cost: 300,
    timeCost: 4,
    availableFor: BROAD_TYPES,
    effects: { affection: 2, trust: 1.5 },
    description: 'Invite them over for a relaxed gathering.',
    minRelationship: 25,
    loveLanguageTag: 'acts_of_service',
    interestTags: ['socializing', 'fine_dining'],
  },
  {
    id: 'dining_brunch',
    name: 'Brunch',
    category: 'dining',
    icon: '🥞',
    cost: 100,
    timeCost: 1.5,
    availableFor: BROAD_TYPES,
    effects: { affection: 1, trust: 1 },
    description: 'A laid-back weekend brunch.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining'],
  },
  {
    id: 'dining_wine_tasting',
    name: 'Wine Tasting',
    category: 'dining',
    icon: '🍷',
    cost: 250,
    timeCost: 3,
    availableFor: BROAD_TYPES,
    effects: { affection: 2, trust: 1 },
    description: 'Sample fine wines at a local vineyard.',
    minRelationship: 20,
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining', 'luxury', 'travel'],
  },

  // ========================================
  // ROMANTIC (9 options)
  // ========================================
  {
    id: 'romantic_coffee_date',
    name: 'Coffee Date',
    category: 'romantic',
    icon: '☕',
    cost: 50,
    timeCost: 1,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 1, trust: 0, romance: 1 },
    description: 'A low-key date to get to know each other.',
    loveLanguageTag: 'quality_time',
  },
  {
    id: 'romantic_dinner',
    name: 'Romantic Dinner',
    category: 'romantic',
    icon: '🕯️',
    cost: 300,
    timeCost: 2.5,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 2, trust: 1, romance: 2 },
    description: 'Candlelight, good wine, and connection.',
    minRelationship: 15,
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining', 'luxury'],
  },
  {
    id: 'romantic_movie',
    name: 'Movie Night',
    category: 'romantic',
    icon: '🎬',
    cost: 100,
    timeCost: 2,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 1.5, trust: 0, romance: 1.5 },
    description: 'A cosy movie night together.',
    loveLanguageTag: 'physical_touch',
    interestTags: ['entertainment'],
  },
  {
    id: 'romantic_concert',
    name: 'Concert',
    category: 'romantic',
    icon: '🎵',
    cost: 500,
    timeCost: 4,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 2, trust: 1, romance: 2 },
    description: 'Live music and a great atmosphere.',
    minRelationship: 20,
    loveLanguageTag: 'quality_time',
    interestTags: ['music', 'entertainment', 'nightlife'],
  },
  {
    id: 'romantic_cook_together',
    name: 'Cook Dinner Together',
    category: 'romantic',
    icon: '👨‍🍳',
    cost: 80,
    timeCost: 2,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 2, trust: 1.5, romance: 2 },
    description: 'Make something delicious as a team.',
    minRelationship: 20,
    loveLanguageTag: 'acts_of_service',
    interestTags: ['fine_dining'],
  },
  {
    id: 'romantic_stargazing',
    name: 'Stargazing / Beach Walk',
    category: 'romantic',
    icon: '🌙',
    cost: 0,
    timeCost: 2,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 1.5, trust: 1, romance: 2 },
    description: 'Quiet moments under the open sky.',
    minRelationship: 15,
    loveLanguageTag: 'physical_touch',
    interestTags: ['nature', 'adventure'],
  },
  {
    id: 'romantic_weekend_getaway',
    name: 'Weekend Getaway',
    category: 'romantic',
    icon: '🏖️',
    cost: 3000,
    timeCost: 16,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 4, trust: 2, romance: 3 },
    description: 'Escape for a couple of days together.',
    minRelationship: 40,
    cooldownWeeks: 4,
    loveLanguageTag: 'physical_touch',
    interestTags: ['travel', 'adventure', 'luxury'],
  },
  {
    id: 'romantic_adventure',
    name: 'Adventure Date',
    category: 'romantic',
    icon: '🪂',
    cost: 800,
    timeCost: 5,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 3, trust: 2, romance: 2 },
    description: 'Skydiving, hiking, or something thrilling.',
    minRelationship: 30,
    cooldownWeeks: 2,
    loveLanguageTag: 'quality_time',
    interestTags: ['adventure', 'fitness', 'sports'],
  },
  {
    id: 'romantic_spa_day',
    name: 'Spa Day Together',
    category: 'romantic',
    icon: '🧖',
    cost: 600,
    timeCost: 4,
    availableFor: ROMANTIC_TYPES,
    effects: { affection: 2.5, trust: 1, romance: 2 },
    description: 'Relax and recharge side by side.',
    minRelationship: 25,
    cooldownWeeks: 2,
    loveLanguageTag: 'physical_touch',
    interestTags: ['luxury', 'wellness'],
  },

  // ========================================
  // EVENT INVITATIONS (4 options)
  // ========================================
  {
    id: 'invite_race',
    name: 'Invite to Next Race',
    category: 'event_invite',
    icon: '🏁',
    cost: 0,
    timeCost: 8,
    availableFor: BROAD_TYPES,
    effects: { affection: 3, trust: 2 },
    description: 'Paddock pass for the next race weekend.',
    cooldownWeeks: 4,
    loveLanguageTag: 'quality_time',
    interestTags: ['motorsport', 'sports', 'adventure'],
  },
  {
    id: 'invite_facility_tour',
    name: 'Invite to Team Facility Tour',
    category: 'event_invite',
    icon: '🏭',
    cost: 0,
    timeCost: 2,
    availableFor: BROAD_TYPES,
    effects: { affection: 2, trust: 1.5 },
    description: 'Show them around the factory and garage.',
    cooldownWeeks: 8,
    loveLanguageTag: 'quality_time',
    interestTags: ['motorsport', 'technology'],
  },
  {
    id: 'invite_gala',
    name: 'Invite to Gala / Social Event',
    category: 'event_invite',
    icon: '🎭',
    cost: 0,
    timeCost: 5,
    availableFor: BROAD_TYPES,
    effects: { affection: 2.5, trust: 1.5 },
    description: 'Bring them as your plus-one to an event.',
    cooldownWeeks: 4,
    loveLanguageTag: 'quality_time',
    interestTags: ['socializing', 'fashion', 'luxury'],
  },
  {
    id: 'invite_charity',
    name: 'Invite to Charity Event',
    category: 'event_invite',
    icon: '🎗️',
    cost: 0,
    timeCost: 3,
    availableFor: BROAD_TYPES,
    effects: { affection: 2, trust: 2 },
    description: 'Join forces for a good cause.',
    cooldownWeeks: 4,
    loveLanguageTag: 'acts_of_service',
    interestTags: ['charity', 'socializing'],
  },

  // ========================================
  // PROFESSIONAL / BUSINESS (4 options)
  // ========================================
  {
    id: 'professional_lunch',
    name: 'Business Lunch',
    category: 'professional',
    icon: '🍽️',
    cost: 200,
    timeCost: 1.5,
    availableFor: PROFESSIONAL_TYPES,
    effects: { affection: 1, trust: 1.5 },
    description: 'Talk shop over a good meal.',
    loveLanguageTag: 'quality_time',
    interestTags: ['fine_dining'],
  },
  {
    id: 'professional_golf',
    name: 'Golf Outing',
    category: 'professional',
    icon: '⛳',
    cost: 500,
    timeCost: 4,
    availableFor: PROFESSIONAL_TYPES,
    effects: { affection: 1.5, trust: 2 },
    description: 'Eighteen holes and deal-making.',
    minRelationship: 20,
    cooldownWeeks: 2,
    loveLanguageTag: 'quality_time',
    interestTags: ['sports', 'luxury'],
  },
  {
    id: 'professional_meeting',
    name: 'Private Meeting',
    category: 'professional',
    icon: '🤝',
    cost: 0,
    timeCost: 1,
    availableFor: PROFESSIONAL_TYPES,
    effects: { affection: 0, trust: 1.5 },
    description: 'A focused one-on-one discussion.',
    loveLanguageTag: 'words_of_affirmation',
  },
  {
    id: 'professional_networking_drinks',
    name: 'Networking Drinks',
    category: 'professional',
    icon: '🍸',
    cost: 150,
    timeCost: 2,
    availableFor: PROFESSIONAL_TYPES,
    effects: { affection: 1, trust: 1 },
    description: 'Build rapport over cocktails.',
    loveLanguageTag: 'quality_time',
    interestTags: ['nightlife', 'socializing'],
  },
]

// ── Helpers ──

/** Get actions available for a specific contact type */
export function getActionsForContactType(contactType: ContactType): SocialAction[] {
  return SOCIAL_ACTIONS.filter(a => a.availableFor.includes(contactType))
}

/** Get actions grouped by category for a contact type */
export function getGroupedActionsForContact(contactType: ContactType): Record<SocialActionCategory, SocialAction[]> {
  const available = getActionsForContactType(contactType)
  const grouped: Record<SocialActionCategory, SocialAction[]> = {
    gift: [],
    casual: [],
    dining: [],
    romantic: [],
    event_invite: [],
    professional: [],
  }
  for (const action of available) {
    grouped[action.category].push(action)
  }
  return grouped
}

/** Look up a single action by ID */
export function getSocialActionById(id: string): SocialAction | undefined {
  return SOCIAL_ACTIONS.find(a => a.id === id)
}

// ============================================
// LOVE LANGUAGE & INTEREST BONUS SYSTEM
// ============================================

/**
 * Calculate the love language bonus multiplier for a social action.
 * Returns 1.5 if the action's loveLanguageTag matches the contact's love language,
 * 1.0 otherwise (no penalty for mismatch).
 */
export function getLoveLanguageMultiplier(
  action: SocialAction,
  contactLoveLanguage?: string
): number {
  if (!action.loveLanguageTag || !contactLoveLanguage) return 1.0
  
  // Normalize the contact's love language string to match our tag format
  const normalized = contactLoveLanguage.toLowerCase().replace(/[\s-]+/g, '_')
  
  // Handle common variations
  const aliases: Record<string, LoveLanguageType> = {
    'words_of_affirmation': 'words_of_affirmation',
    'acts_of_service': 'acts_of_service',
    'receiving_gifts': 'receiving_gifts',
    'quality_time': 'quality_time',
    'physical_touch': 'physical_touch',
    // Common natural language variations
    'gifts': 'receiving_gifts',
    'touch': 'physical_touch',
    'time': 'quality_time',
    'service': 'acts_of_service',
    'words': 'words_of_affirmation',
    'affirmation': 'words_of_affirmation',
  }
  
  const matchedType = aliases[normalized] || normalized
  return action.loveLanguageTag === matchedType ? 1.5 : 1.0
}

/**
 * Calculate the shared interest bonus multiplier for a social action.
 * Returns 1.0 + 0.3 per matching interest, capped at 2.0 (+100%).
 */
export function getInterestBonusMultiplier(
  action: SocialAction,
  contactInterests?: string[]
): number {
  if (!action.interestTags || !contactInterests || contactInterests.length === 0) return 1.0
  
  // Normalize contact interests to lowercase for matching
  const normalizedInterests = contactInterests.map(i => i.toLowerCase().replace(/[\s-]+/g, '_'))
  
  let matchCount = 0
  for (const tag of action.interestTags) {
    const tagLower = tag.toLowerCase()
    if (normalizedInterests.some(interest => 
      interest.includes(tagLower) || tagLower.includes(interest) ||
      // Fuzzy keyword match for multi-word interests
      interest.split('_').some(word => word.length > 3 && tagLower.includes(word))
    )) {
      matchCount++
    }
  }
  
  return Math.min(2.0, 1.0 + matchCount * 0.3)
}

/**
 * Calculate the combined bonus multiplier for a social action.
 * Combines love language and interest bonuses additively.
 * Max combined bonus: +130% (love language +50% + interests cap +80%)
 */
export function getCombinedBonusMultiplier(
  action: SocialAction,
  contactLoveLanguage?: string,
  contactInterests?: string[]
): number {
  const loveBonus = getLoveLanguageMultiplier(action, contactLoveLanguage) - 1.0 // 0 or 0.5
  const interestBonus = getInterestBonusMultiplier(action, contactInterests) - 1.0 // 0 to 1.0
  
  return 1.0 + loveBonus + interestBonus // 1.0 to 2.3, effectively capped
}
