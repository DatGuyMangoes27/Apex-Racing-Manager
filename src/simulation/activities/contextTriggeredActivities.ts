/**
 * Context-triggered activities: after car purchase, after series entry.
 * These are created when the player buys a car or enters a series, and
 * appear on the calendar with a deadline (e.g. within 5 days).
 */

import type { ScheduledActivity, ActivityEffect, DrainLevel, CalendarEntryType } from '@/store/careerStore'
import { getActivityTimeCost } from '@/data/activity-time-costs'

const emptyEffect: ActivityEffect = {}

function deadlineFromNow(week: number, day: number, addDays: number): { week: number; day: number } {
  let totalDays = day + addDays
  let w = week
  while (totalDays > 7) {
    totalDays -= 7
    w++
  }
  return { week: w, day: totalDays }
}

function makeActivity(
  templateId: string,
  name: string,
  description: string,
  category: 'team' | 'maintenance',
  week: number,
  day: number,
  duration: number,
  deadline: { week: number; day: number },
  triggeredBy: 'after_car_purchase' | 'after_series_entry'
): ScheduledActivity {
  const cost = getActivityTimeCost(templateId)
  return {
    id: `${templateId}_${week}_${day}_${Date.now()}`,
    templateId,
    name,
    description,
    category,
    scheduledWeek: week,
    scheduledDay: day,
    duration,
    spanDays: 1,
    status: 'scheduled',
    requiredCash: 0,
    triggeredBy,
    mandatory: true,
    deadline,
    canReschedule: true,
    rescheduleDeadline: deadline.week,
    effectsOnComplete: emptyEffect,
    effectsOnMiss: { boardMood: -2 },
    requiresDriver: false,
    requiresOwner: true,
    urgencyLevel: 'high',
    drainLevel: (cost?.drain ?? 'normal') as DrainLevel,
    calendarEntryType: (cost?.calendarType ?? 'mandatory') as CalendarEntryType,
    scheduledPeriod: cost?.preferredPeriod || cost?.allowedPeriods?.[0],
  }
}

/**
 * Create mandatory activities to schedule after a car purchase.
 * Call from careerStore.purchaseCar() and append to scheduledActivities.
 */
export function createPostCarPurchaseActivities(
  currentWeek: number,
  currentDay: number
): ScheduledActivity[] {
  const deadline = deadlineFromNow(currentWeek, currentDay, 5)
  return [
    makeActivity(
      'context_car_handover',
      'Car Handover / Delivery',
      'Manufacturer or dealer handover; sign-off, paperwork, keys.',
      'team',
      currentWeek,
      currentDay,
      2,
      deadline,
      'after_car_purchase'
    ),
    makeActivity(
      'context_technical_briefing',
      'Technical Briefing',
      'Team or seller walks you through the car: systems, setup, maintenance.',
      'team',
      currentWeek,
      currentDay,
      2,
      deadline,
      'after_car_purchase'
    ),
  ]
}

/**
 * Create mandatory activities to schedule after entering a series.
 * Call from careerStore.enterSeries() and append to scheduledActivities.
 */
export function createPostSeriesEntryActivities(
  currentWeek: number,
  currentDay: number
): ScheduledActivity[] {
  const deadline = deadlineFromNow(currentWeek, currentDay, 7)
  return [
    makeActivity(
      'context_series_briefing',
      'Series Registration Briefing',
      'Organizer meeting: rules, calendar, scrutineering dates, media obligations.',
      'team',
      currentWeek,
      currentDay,
      2,
      deadline,
      'after_series_entry'
    ),
    makeActivity(
      'context_entry_paperwork',
      'Entry Confirmation / Paperwork',
      'Sign entry form, pay balance if any, submit driver list.',
      'team',
      currentWeek,
      currentDay,
      1,
      deadline,
      'after_series_entry'
    ),
  ]
}
