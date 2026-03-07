/**
 * Onboarding Mandatory Schedule
 *
 * Lean, fast-forward-friendly onboarding. Only 4 activities block the player
 * in the first 2 weeks — the rest are optional suggestions that add flavour
 * but never block progress or fast-forward.
 *
 * Design goal: new player should reach their first race within 10–15 minutes
 * of starting a career, with fast-forward working from day 1.
 */

import type { ActivityCategory, ActivityEffect } from '@/store/careerStore'

export interface OnboardingActivityTemplate {
  id: string
  name: string
  description: string
  category: ActivityCategory
  week: number
  day: number
  duration: number
  baseCost: number
  requiresDriver: boolean
  requiresOwner: boolean
  effectsOnComplete: ActivityEffect
  effectsOnMiss: ActivityEffect
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  /** 'personal' | 'team' | 'mandatory' for calendar display */
  calendarEntryType: 'personal' | 'team' | 'mandatory'
  /** Only schedule this activity when the team has at least one active sponsor */
  requiresSponsors?: boolean
  /** Only schedule this activity when the team has NO sponsors (alternate for same slot) */
  onlyWhenNoSponsors?: boolean
  /** Only schedule this activity when the team has at least one hired staff member */
  requiresStaff?: boolean
}

const emptyEffect: ActivityEffect = {}

// ============================================
// ONBOARDING SCHEDULE
// ============================================
//
// MANDATORY (urgencyLevel high/critical, calendarEntryType 'mandatory'):
//   Only 4. These give real gameplay effects. Miss them and something hurts.
//   Fast-forward will respect these.
//
// OPTIONAL SUGGESTIONS (urgencyLevel 'low', calendarEntryType 'personal'/'team'):
//   Scattered across weeks 1–2 as nice-to-dos.
//   Never block fast-forward. Player can ignore them entirely.

export const ONBOARDING_MANDATORY_SCHEDULE: OnboardingActivityTemplate[] = [

  // ── MANDATORY #1 ───────────────────────────────────────────────────────────
  // Week 1, Day 1 — Team Briefing (the only Day 1 block)
  {
    id: 'onboarding_team_briefing',
    name: 'Team Briefing',
    description: 'Meet your ops team and understand how the season will run. Sets the tone for everything that follows.',
    category: 'team',
    week: 1,
    day: 1,
    duration: 2,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: { teamMorale: 8, boardMood: 3 },
    effectsOnMiss: { teamMorale: -8, boardMood: -5 },
    urgencyLevel: 'high',
    calendarEntryType: 'mandatory',
    requiresStaff: true,
  },

  // ── MANDATORY #2 ───────────────────────────────────────────────────────────
  // Week 1, Day 4 — Media intro (has real rep/marketability effects)
  {
    id: 'onboarding_intro_press',
    name: 'Launch Press Interview',
    description: 'Your first public appearance as a team owner. A few key quotes, a photo, and you are on the map.',
    category: 'media',
    week: 1,
    day: 4,
    duration: 2,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: { reputation: 4, marketability: 3 },
    effectsOnMiss: { reputation: -2 },
    urgencyLevel: 'high',
    calendarEntryType: 'mandatory',
  },

  // ── MANDATORY #3 ───────────────────────────────────────────────────────────
  // Week 2, Day 1 — Board Intro (critical — missing it hurts badly)
  {
    id: 'onboarding_board_intro',
    name: 'Board Introduction',
    description: 'Your first meeting with the board. They set expectations. Skipping this sends completely the wrong signal.',
    category: 'team',
    week: 2,
    day: 1,
    duration: 2,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: { boardMood: 8 },
    effectsOnMiss: { boardMood: -12, teamMorale: -4 },
    urgencyLevel: 'critical',
    calendarEntryType: 'mandatory',
  },

  // ── MANDATORY #4 ───────────────────────────────────────────────────────────
  // Week 2, Day 4 — Safety Briefing (required for race entry, has real effects)
  {
    id: 'onboarding_safety_briefing',
    name: 'Safety & Compliance Briefing',
    description: 'Mandatory FIA-aligned safety briefing before your first race. Non-negotiable.',
    category: 'team',
    week: 2,
    day: 4,
    duration: 1,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: emptyEffect,
    effectsOnMiss: { teamMorale: -5, boardMood: -4 },
    urgencyLevel: 'high',
    calendarEntryType: 'mandatory',
    requiresStaff: true,
  },

  // ── OPTIONAL SUGGESTIONS ───────────────────────────────────────────────────
  // These are shown on the calendar as suggestions. Player can do them for
  // bonuses, or ignore them and fast-forward. None block progress.

  {
    id: 'onboarding_gym_fitness',
    name: 'Fitness Session',
    description: 'Get race-ready early.',
    category: 'personal',
    week: 1,
    day: 6,
    duration: 1,
    baseCost: 0,
    requiresDriver: true,
    requiresOwner: true,
    effectsOnComplete: { fitness: 3 },
    effectsOnMiss: emptyEffect,
    urgencyLevel: 'low',
    calendarEntryType: 'personal',
  },
  {
    id: 'onboarding_first_sponsor_checkin',
    name: 'Sponsor Check-in',
    description: 'Touch base with your first sponsor or explore new ones.',
    category: 'sponsor',
    week: 2,
    day: 3,
    duration: 2,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: { sponsorSatisfaction: 5 },
    effectsOnMiss: emptyEffect,
    urgencyLevel: 'low',
    calendarEntryType: 'team',
    requiresSponsors: true,
  },
  {
    id: 'onboarding_sponsor_outreach_prep',
    name: 'Sponsor Outreach Prep',
    description: 'Prepare your pitch deck for approaching sponsors.',
    category: 'sponsor',
    week: 2,
    day: 3,
    duration: 2,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: { reputation: 2 },
    effectsOnMiss: emptyEffect,
    urgencyLevel: 'low',
    calendarEntryType: 'team',
    onlyWhenNoSponsors: true,
  },
]

/**
 * Get all onboarding activities scheduled for a given (week, day).
 * Only returns activities for weeks 1–3 (onboarding window).
 */
export function getOnboardingMandatoryForDay(
  week: number,
  day: number
): OnboardingActivityTemplate[] {
  if (week < 1 || week > 3) return []
  return ONBOARDING_MANDATORY_SCHEDULE.filter(
    (t) => t.week === week && t.day === day
  )
}
