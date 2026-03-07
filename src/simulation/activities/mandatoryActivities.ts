/**
 * Mandatory Activities System
 * Activities that auto-generate and MUST be completed
 */

import { ActivityCategory, ActivityEffect, ScheduledActivity, DrainLevel, CalendarEntryType } from '@/store/careerStore'
import { MANDATORY_ACTIVITY_COSTS, getActivityTimeCost } from '@/data/activity-time-costs'

// Mandatory activity trigger types
export type MandatoryTrigger = 
  | 'post_race'           // After every race
  | 'weekly_interval'     // Every X weeks
  | 'pre_race'           // Before race weeks
  | 'sponsor_contract'   // Per sponsor schedule
  | 'financial_period'   // Monthly/quarterly
  | 'season_milestone'   // Start/mid/end of season

export interface MandatoryActivityTemplate {
  id: string
  name: string
  description: string
  category: ActivityCategory
  trigger: MandatoryTrigger
  triggerInterval?: number        // Weeks between triggers (for weekly_interval)
  triggerOffset?: number          // Days after trigger event
  deadlineDays: number            // Days to complete after appearing
  duration: number                // Hours
  baseCost: number
  
  // Requirements
  requiresDriver: boolean
  requiresOwner: boolean          // Owner must attend (can't delegate)
  
  // Effects
  effectsOnComplete: ActivityEffect
  effectsOnMiss: ActivityEffect
  
  // Display
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  warningDaysBefore: number       // Send warning email X days before deadline

  /** Only trigger when the team has at least one active sponsor */
  requiresSponsors?: boolean
  /** Only trigger when the team has at least one hired staff member */
  requiresStaff?: boolean
}

// ============================================
// MANDATORY ACTIVITY TEMPLATES
// ============================================

export const MANDATORY_ACTIVITY_TEMPLATES: MandatoryActivityTemplate[] = [
  // === POST-RACE ACTIVITIES ===
  {
    id: 'mandatory_race_debrief',
    name: 'Race Debrief',
    description: 'Review race performance with the team. Discuss strategy, incidents, and areas for improvement.',
    category: 'team',
    trigger: 'post_race',
    triggerOffset: 1,              // 1 day after race
    deadlineDays: 3,               // Must complete within 3 days
    duration: 3,
    baseCost: 0,
    requiresDriver: true,          // Driver needs to attend
    requiresOwner: true,           // Owner must be present
    effectsOnComplete: {
      teamMorale: 2,
      boardMood: 1,
      developmentPoints: 2
    },
    effectsOnMiss: {
      teamMorale: -10,
      boardMood: -5,
      driverMorale: -5
    },
    urgencyLevel: 'high',
    warningDaysBefore: 1
  },
  
  {
    id: 'mandatory_car_damage_assessment',
    name: 'Car Damage Assessment',
    description: 'Technical review of any damage sustained during the race. Required before next event.',
    category: 'maintenance',
    trigger: 'post_race',
    triggerOffset: 1,
    deadlineDays: 5,
    duration: 2,
    baseCost: 500,
    requiresDriver: false,
    requiresOwner: false,          // Can delegate to chief engineer
    effectsOnComplete: {
      developmentPoints: 1
    },
    effectsOnMiss: {
      boardMood: -3
      // Also: hidden reliability penalty for next race
    },
    urgencyLevel: 'medium',
    warningDaysBefore: 2
  },
  
  // === PERIODIC ACTIVITIES ===
  {
    id: 'mandatory_board_meeting',
    name: 'Board Meeting',
    description: 'Quarterly strategic meeting with the board of directors. Review performance and set direction.',
    category: 'team',
    trigger: 'weekly_interval',
    triggerInterval: 8,            // Every 8 weeks
    deadlineDays: 7,               // Within that week
    duration: 4,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,           // Owner MUST attend
    effectsOnComplete: {
      boardMood: 4,
      teamMorale: 1
    },
    effectsOnMiss: {
      boardMood: -20,
      teamMorale: -5
      // Also: potential board warning
    },
    urgencyLevel: 'critical',
    warningDaysBefore: 3
  },
  
  {
    id: 'mandatory_financial_review',
    name: 'Financial Review',
    description: 'Monthly review of team finances, budget allocation, and cash flow projections.',
    category: 'team',
    trigger: 'weekly_interval',
    triggerInterval: 4,            // Every 4 weeks
    deadlineDays: 5,
    duration: 3,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,           // Owner must review finances
    effectsOnComplete: {
      boardMood: 2
    },
    effectsOnMiss: {
      boardMood: -15,
      sponsorSatisfaction: -5      // Sponsors worry about financial stability
    },
    urgencyLevel: 'high',
    warningDaysBefore: 2
  },
  
  {
    id: 'mandatory_sponsor_quarterly',
    name: 'Sponsor Quarterly Review',
    description: 'Mandatory check-in with sponsors to review deliverables and discuss ongoing partnership.',
    category: 'sponsor',
    trigger: 'weekly_interval',
    triggerInterval: 12,           // Every 12 weeks (quarterly)
    deadlineDays: 7,
    duration: 4,
    baseCost: 1000,
    requiresDriver: true,          // Sponsors want to see the driver
    requiresOwner: true,
    effectsOnComplete: {
      sponsorSatisfaction: 10,
      boardMood: 1
    },
    effectsOnMiss: {
      sponsorSatisfaction: -15,
      boardMood: -5,
      reputation: -2
    },
    urgencyLevel: 'high',
    warningDaysBefore: 3,
    requiresSponsors: true,
  },
  
  // === PRE-RACE ACTIVITIES ===
  {
    id: 'mandatory_pre_race_briefing',
    name: 'Pre-Race Strategy Briefing',
    description: 'Essential strategy meeting before the race weekend. Discuss approach and contingencies.',
    category: 'team',
    trigger: 'pre_race',
    triggerOffset: -3,             // 3 days before race
    deadlineDays: 2,               // Must complete before race
    duration: 2,
    baseCost: 0,
    requiresDriver: true,
    requiresOwner: true,
    effectsOnComplete: {
      teamMorale: 1,
      driverMorale: 1
    },
    effectsOnMiss: {
      teamMorale: -5,
      driverMorale: -8
      // Also: strategy effectiveness penalty for race
    },
    urgencyLevel: 'high',
    warningDaysBefore: 1
  },
  
  {
    id: 'mandatory_car_scrutineering',
    name: 'Car Technical Inspection',
    description: 'Mandatory technical compliance check. Car must pass before race entry.',
    category: 'maintenance',
    trigger: 'pre_race',
    triggerOffset: -2,             // 2 days before race
    deadlineDays: 1,
    duration: 3,
    baseCost: 2000,
    requiresDriver: false,
    requiresOwner: false,
    effectsOnComplete: {},         // Just required
    effectsOnMiss: {
      boardMood: -10
      // Also: cannot race without this
    },
    urgencyLevel: 'critical',
    warningDaysBefore: 1
  },
  
  // === SEASON MILESTONES ===
  {
    id: 'mandatory_season_opener_media',
    name: 'Season Launch Press Event',
    description: 'Official season launch with media. Present team goals and introduce drivers.',
    category: 'media',
    trigger: 'season_milestone',
    deadlineDays: 7,
    duration: 6,
    baseCost: 5000,
    requiresDriver: true,
    requiresOwner: true,
    effectsOnComplete: {
      reputation: 2,
      fanSentiment: 5,
      sponsorSatisfaction: 3
    },
    effectsOnMiss: {
      reputation: -5,
      fanSentiment: -10,
      sponsorSatisfaction: -8
    },
    urgencyLevel: 'high',
    warningDaysBefore: 3
  },
  
  {
    id: 'mandatory_mid_season_review',
    name: 'Mid-Season Performance Review',
    description: 'Comprehensive review at the season midpoint. Assess progress against targets.',
    category: 'team',
    trigger: 'season_milestone',
    deadlineDays: 7,
    duration: 4,
    baseCost: 0,
    requiresDriver: false,
    requiresOwner: true,
    effectsOnComplete: {
      boardMood: 2,
      teamMorale: 1
    },
    effectsOnMiss: {
      boardMood: -10,
      teamMorale: -5
    },
    urgencyLevel: 'medium',
    warningDaysBefore: 2
  },
  
  {
    id: 'mandatory_end_of_season',
    name: 'End of Season Wrap-up',
    description: 'Final review of the season. Celebrate successes, analyze failures, plan for next year.',
    category: 'team',
    trigger: 'season_milestone',
    deadlineDays: 14,
    duration: 6,
    baseCost: 3000,
    requiresDriver: true,
    requiresOwner: true,
    effectsOnComplete: {
      teamMorale: 4,
      boardMood: 2,
      driverMorale: 2
    },
    effectsOnMiss: {
      teamMorale: -8,
      boardMood: -8,
      driverMorale: -5
    },
    urgencyLevel: 'medium',
    warningDaysBefore: 5
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a mandatory activity should be triggered
 */
export function shouldTriggerActivity(
  template: MandatoryActivityTemplate,
  context: {
    currentWeek: number
    currentDay: number
    lastRaceWeek?: number
    nextRaceWeek?: number
    seasonStartWeek: number
    seasonEndWeek: number
    seasonMidpoint: number
    existingActivities: ScheduledActivity[]
    hasSponsors?: boolean
    hasRaceCalendar?: boolean
    hasStaff?: boolean
    hasDrivers?: boolean
  }
): boolean {
  // Check if already scheduled
  const alreadyScheduled = context.existingActivities.some(
    a => a.templateId === template.id && 
         (a.status === 'scheduled' || a.status === 'completed')
  )
  
  if (alreadyScheduled) return false

  if (template.requiresSponsors && !context.hasSponsors) return false
  if (template.requiresStaff && !context.hasStaff) return false
  if (template.requiresDriver && !context.hasDrivers) return false
  
  switch (template.trigger) {
    case 'post_race':
      // Trigger if we just had a race
      if (!context.lastRaceWeek) return false
      const daysSinceRace = (context.currentWeek - context.lastRaceWeek) * 7 + context.currentDay
      return daysSinceRace >= (template.triggerOffset || 0) && daysSinceRace <= (template.triggerOffset || 0) + 1
      
    case 'pre_race':
      // Trigger if race is coming up
      if (!context.nextRaceWeek) return false
      const daysToRace = (context.nextRaceWeek - context.currentWeek) * 7 - context.currentDay
      return daysToRace === Math.abs(template.triggerOffset || 3)
      
    case 'weekly_interval':
      // Trigger every X weeks
      const interval = template.triggerInterval || 4
      return context.currentWeek % interval === 0 && context.currentDay === 1
      
    case 'season_milestone':
      if (!context.hasRaceCalendar) return false
      // Check specific season milestones
      if (template.id === 'mandatory_season_opener_media') {
        return context.currentWeek === context.seasonStartWeek && context.currentDay === 1
      }
      if (template.id === 'mandatory_mid_season_review') {
        return context.currentWeek === context.seasonMidpoint && context.currentDay === 1
      }
      if (template.id === 'mandatory_end_of_season') {
        return context.currentWeek === context.seasonEndWeek && context.currentDay === 1
      }
      return false
      
    default:
      return false
  }
}

/**
 * Create a mandatory activity from template
 */
export function createMandatoryActivity(
  template: MandatoryActivityTemplate,
  week: number,
  day: number,
  deadlineWeek: number,
  deadlineDay: number
): ScheduledActivity {
  // Mandatory activities can be moved, but with a meaningful admin fee.
  const rescheduleCost = template.baseCost > 0
    ? Math.floor(template.baseCost * 0.35)
    : 500

  return {
    id: `mandatory_${template.id}_${week}_${Date.now()}`,
    templateId: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    scheduledWeek: week,
    scheduledDay: day,
    duration: template.duration,
    spanDays: 1,  // Mandatory activities are single-day
    status: 'scheduled',
    requiredCash: template.baseCost,
    
    // Mark as mandatory with deadline
    triggeredBy: 'mandatory',
    mandatory: true,
    canReschedule: true,
    rescheduleCost,
    deadline: {
      week: deadlineWeek,
      day: deadlineDay
    },
    missConsequences: template.effectsOnMiss,
    
    // Effects
    effectsOnComplete: template.effectsOnComplete,
    effectsOnMiss: template.effectsOnMiss,
    
    // Requirements
    requiresDriver: template.requiresDriver,
    requiresOwner: template.requiresOwner,
    
    // UI
    urgencyLevel: template.urgencyLevel,
    
    // Time Budget System: drain level and calendar type from cost config
    drainLevel: (MANDATORY_ACTIVITY_COSTS[template.id]?.drain ?? 'normal') as DrainLevel,
    calendarEntryType: (MANDATORY_ACTIVITY_COSTS[template.id]?.calendarType ?? 
      (template.requiresOwner ? 'mandatory' : 'team')) as CalendarEntryType,
    
    // Day period scheduling from activity time cost config
    scheduledPeriod: (() => {
      const tc = getActivityTimeCost(template.id)
      return tc.preferredPeriod || tc.allowedPeriods?.[0]
    })()
  } as ScheduledActivity
}

/**
 * Calculate deadline from trigger
 */
export function calculateDeadline(
  triggerWeek: number,
  triggerDay: number,
  deadlineDays: number
): { week: number; day: number } {
  let totalDays = triggerDay + deadlineDays
  let week = triggerWeek
  
  while (totalDays > 7) {
    totalDays -= 7
    week++
  }
  
  return { week, day: totalDays }
}

/**
 * Get urgency color for UI
 */
export function getUrgencyColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low': return 'text-text-muted'
    case 'medium': return 'text-status-warning'
    case 'high': return 'text-accent-orange'
    case 'critical': return 'text-status-error'
  }
}

/**
 * Get days until deadline
 */
export function getDaysUntilDeadline(
  currentWeek: number,
  currentDay: number,
  deadlineWeek: number,
  deadlineDay: number
): number {
  return (deadlineWeek - currentWeek) * 7 + (deadlineDay - currentDay)
}
