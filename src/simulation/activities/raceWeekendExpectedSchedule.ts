/**
 * Race weekend "expected" activities — auto-appear on calendar, can skip with consequence.
 * Sponsor commitments, media obligations, and operational duties.
 */

import type { ScheduledActivity, ActivityEffect } from '@/store/careerStore'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import type { DrainLevel, CalendarEntryType } from '@/store/careerStore'

export interface RaceWeekendExpectedTemplate {
  id: string
  name: string
  description: string
  category: 'sponsor' | 'team' | 'media'
  day: number  // 4=Thu, 5=Fri, 6=Sat, 7=Sun
  duration: number
  effectsOnComplete?: ActivityEffect
  effectsOnMiss: ActivityEffect
}

const RACE_WEEKEND_EXPECTED: RaceWeekendExpectedTemplate[] = [
  {
    id: 'race_expected_pre_race_press_conference',
    name: 'Pre-Race Press Conference',
    description: 'Official media conference before the weekend sessions begin.',
    category: 'media',
    day: 5,
    duration: 2,
    effectsOnComplete: { reputation: 1, fanSentiment: 1 },
    effectsOnMiss: { reputation: -1, fanSentiment: -2 },
  },
  {
    id: 'race_expected_sponsor_hospitality',
    name: 'Sponsor Hospitality Appearance',
    description: 'Expected appearance at sponsor hospitality at the track.',
    category: 'sponsor',
    day: 4,
    duration: 2,
    effectsOnComplete: { sponsorSatisfaction: 2, reputation: 1 },
    effectsOnMiss: { sponsorSatisfaction: -5 },
  },
  {
    id: 'race_expected_fan_meet',
    name: 'Fan Meet & Greet',
    description: 'Autograph session and fan engagement.',
    category: 'media',
    day: 5,
    duration: 2,
    effectsOnComplete: { fanSentiment: 2, reputation: 1 },
    effectsOnMiss: { fanSentiment: -3, reputation: -1 },
  },
  {
    id: 'race_expected_driver_briefing',
    name: 'Pre-Session Strategy Briefing',
    description: 'Final strategy and setup review before qualifying/race sessions.',
    category: 'team',
    day: 6,
    duration: 2,
    effectsOnComplete: { teamMorale: 1, boardMood: 1 },
    effectsOnMiss: { teamMorale: -3 },
  },
  {
    id: 'race_expected_scrutineering',
    name: 'Scrutineering Attendance',
    description: 'Car must pass technical inspection; owner/driver often required.',
    category: 'team',
    day: 6,
    duration: 2,
    effectsOnComplete: { boardMood: 1 },
    effectsOnMiss: { boardMood: -2 },
  },
  {
    id: 'race_expected_post_qualifying_media',
    name: 'Post-Qualifying Media Scrum',
    description: 'Short media availability after qualifying results.',
    category: 'media',
    day: 6,
    duration: 1,
    effectsOnComplete: { reputation: 1 },
    effectsOnMiss: { reputation: -1, fanSentiment: -1 },
  },
  {
    id: 'race_expected_post_race_press_conference',
    name: 'Post-Race Press Conference',
    description: 'Mandatory post-race media conference and Q&A.',
    category: 'media',
    day: 7,
    duration: 2,
    effectsOnComplete: { reputation: 2, fanSentiment: 1 },
    effectsOnMiss: { reputation: -2, fanSentiment: -2 },
  },
  {
    id: 'race_expected_post_race_sponsor_commitment',
    name: 'Post-Race Sponsor Commitment',
    description: 'Meet sponsor reps and partners after the race weekend.',
    category: 'sponsor',
    day: 7,
    duration: 2,
    effectsOnComplete: { sponsorSatisfaction: 3, reputation: 1 },
    effectsOnMiss: { sponsorSatisfaction: -6 },
  },
]

/**
 * Get expected (skip-with-consequence) activities for a given day of a race week.
 */
export function getRaceWeekendExpectedForDay(
  week: number,
  day: number
): RaceWeekendExpectedTemplate[] {
  return RACE_WEEKEND_EXPECTED.filter((t) => t.day === day)
}

/**
 * Create ScheduledActivity entries for race weekend expected activities.
 * mandatory: false so they can be skipped; effectsOnMiss applied if skipped.
 */
export function createRaceWeekendExpectedActivities(
  week: number,
  day: number
): ScheduledActivity[] {
  const templates = getRaceWeekendExpectedForDay(week, day)
  const activities: ScheduledActivity[] = []
  for (const t of templates) {
    const cost = getActivityTimeCost(t.id)
    activities.push({
      id: `${t.id}_${week}_${day}_${Date.now()}`,
      templateId: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      scheduledWeek: week,
      scheduledDay: day,
      duration: t.duration,
      spanDays: 1,
      status: 'scheduled',
      requiredCash: 0,
      triggeredBy: 'race_weekend_expected',
      mandatory: false,
      deadline: { week, day },
      effectsOnComplete: t.effectsOnComplete || {},
      effectsOnMiss: t.effectsOnMiss,
      requiresDriver:
        t.id.includes('driver_briefing') ||
        t.id.includes('scrutineering') ||
        t.id.includes('press_conference') ||
        t.id.includes('post_qualifying_media'),
      requiresOwner: true,
      urgencyLevel: 'medium',
      drainLevel: (cost?.drain ?? 'normal') as DrainLevel,
      calendarEntryType: (cost?.calendarType ?? 'mandatory') as CalendarEntryType,
      scheduledPeriod: cost?.preferredPeriod || cost?.allowedPeriods?.[0],
    })
  }
  return activities
}
