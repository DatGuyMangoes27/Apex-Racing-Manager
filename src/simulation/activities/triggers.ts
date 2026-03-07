/**
 * Activity Trigger System
 * Generates dynamic activities based on career events
 * Triggers are checked after race results, sponsor events, and on week advance
 */

import { 
  ScheduledActivity, 
  ActivityTriggerSource,
  ActivityMissConsequences,
  ACTIVITY_TEMPLATES,
  ActivityCategory,
  DrainLevel,
  CalendarEntryType
} from '@/store/careerStore'
import { TRIGGERED_ACTIVITY_COSTS, getActivityTimeCost } from '@/data/activity-time-costs'

// Trigger definition - conditions that generate activities
export interface ActivityTrigger {
  id: string
  name: string
  description: string
  source: ActivityTriggerSource
  
  // Conditions for trigger to fire
  conditions: {
    minReputation?: number
    maxReputation?: number
    hasSponsors?: boolean
    hasStaff?: boolean
    inSeason?: boolean
    weekRange?: { min: number; max: number }
    raceResult?: 'win' | 'podium' | 'points' | 'dnf' | 'any'
    sponsorSatisfaction?: { operator: 'lt' | 'gt' | 'eq'; value: number }
    boardMood?: { operator: 'lt' | 'gt' | 'eq'; value: number }
    staffMorale?: { operator: 'lt' | 'gt' | 'eq'; value: number }
    randomChance?: number  // 0-100 percentage chance
  }
  
  // What gets generated
  generatedActivity: {
    templateId?: string           // Use existing template
    customName: string
    customDescription: string
    category: ActivityCategory
    duration: number
    spanDays?: number             // Number of days the activity spans
    mandatory: boolean
    deadline?: number             // Weeks from trigger to complete
    suggestedWeek?: 'next' | 'current' | number  // When to schedule
    
    // Effects specific to this trigger
    effects: {
      onComplete: {
        boardMood?: number
        sponsorSatisfaction?: number
        teamMorale?: number
        reputation?: number
        cash?: number
        fanSentiment?: number
      }
      onMiss: ActivityMissConsequences
    }
  }
  
  // Cooldown to prevent spam
  cooldownWeeks?: number
  maxPerSeason?: number
  
  // Priority (higher = generated first)
  priority: number
}

// ============================================
// RACE RESULT TRIGGERS
// ============================================

const RACE_RESULT_TRIGGERS: ActivityTrigger[] = [
  {
    id: 'trigger_race_win_celebration',
    name: 'Victory Celebration',
    description: 'Celebrate a race win with sponsors and media',
    source: 'race_win',
    conditions: {
      raceResult: 'win'
    },
    generatedActivity: {
      customName: 'Victory Celebration Event',
      customDescription: 'Celebrate your race win with sponsors, media, and fans. A great opportunity to boost relationships.',
      category: 'sponsor',
      duration: 4,
      mandatory: false,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          sponsorSatisfaction: 10,
          boardMood: 5,
          reputation: 3,
          fanSentiment: 15
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 0,  // Can trigger every win
    priority: 90
  },
  {
    id: 'trigger_race_win_press',
    name: 'Victory Press Conference',
    description: 'Media opportunity after a race win',
    source: 'race_win',
    conditions: {
      raceResult: 'win',
      minReputation: 30
    },
    generatedActivity: {
      customName: 'Winner\'s Press Conference',
      customDescription: 'International media want to interview you after your impressive victory.',
      category: 'media',
      duration: 2,
      mandatory: false,
      deadline: 1,
      suggestedWeek: 'current',
      effects: {
        onComplete: {
          reputation: 5,
          fanSentiment: 10,
          sponsorSatisfaction: 3
        },
        onMiss: {
          reputationPenalty: -2
        }
      }
    },
    cooldownWeeks: 0,
    priority: 85
  },
  {
    id: 'trigger_race_podium_sponsor_dinner',
    name: 'Podium Sponsor Dinner',
    description: 'Sponsor celebration after podium finish',
    source: 'race_podium',
    conditions: {
      raceResult: 'podium',
      hasSponsors: true
    },
    generatedActivity: {
      customName: 'Sponsor Celebration Dinner',
      customDescription: 'Your sponsors want to celebrate your podium finish with a special dinner.',
      category: 'sponsor',
      duration: 3,
      mandatory: false,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          sponsorSatisfaction: 8,
          boardMood: 3,
          reputation: 1
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 2,
    priority: 70
  },
  {
    id: 'trigger_championship_lead',
    name: 'Championship Leader Meeting',
    description: 'Board wants a strategy review after taking championship lead',
    source: 'championship_lead',
    conditions: {
      raceResult: 'any'
    },
    generatedActivity: {
      customName: 'Championship Strategy Review',
      customDescription: 'The board wants to discuss championship strategy now that you\'re in the lead.',
      category: 'team',
      duration: 4,
      mandatory: true,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          boardMood: 10,
          teamMorale: 5
        },
        onMiss: {
          boardMoodPenalty: -15,
          reputationPenalty: -3
        }
      }
    },
    cooldownWeeks: 8,
    maxPerSeason: 3,
    priority: 95
  },
  {
    id: 'trigger_dnf_team_debrief',
    name: 'DNF Team Debrief',
    description: 'Team meeting required after a DNF',
    source: 'race_dnf',
    conditions: {
      raceResult: 'dnf'
    },
    generatedActivity: {
      customName: 'DNF Analysis Meeting',
      customDescription: 'The team needs to analyze what went wrong and how to prevent future DNFs.',
      category: 'team',
      duration: 3,
      mandatory: true,
      deadline: 1,
      suggestedWeek: 'current',
      effects: {
        onComplete: {
          teamMorale: 5,
          boardMood: 2
        },
        onMiss: {
          boardMoodPenalty: -10,
          reputationPenalty: -2
        }
      }
    },
    cooldownWeeks: 0,
    priority: 100
  },
  {
    id: 'trigger_dnf_sponsor_damage_control',
    name: 'DNF Sponsor Damage Control',
    description: 'Reassure sponsors after a DNF',
    source: 'race_dnf',
    conditions: {
      raceResult: 'dnf',
      hasSponsors: true,
      sponsorSatisfaction: { operator: 'lt', value: 60 }
    },
    generatedActivity: {
      customName: 'Sponsor Reassurance Meeting',
      customDescription: 'Your sponsors are concerned after the DNF. Meet with them to reassure your commitment.',
      category: 'sponsor',
      duration: 2,
      mandatory: true,
      deadline: 1,
      suggestedWeek: 'current',
      effects: {
        onComplete: {
          sponsorSatisfaction: 5
        },
        onMiss: {
          sponsorPenalties: [], // Will be populated dynamically
          reputationPenalty: -3
        }
      }
    },
    cooldownWeeks: 4,
    priority: 85
  }
]

// ============================================
// SPONSOR OBLIGATION TRIGGERS
// ============================================

const SPONSOR_TRIGGERS: ActivityTrigger[] = [
  {
    id: 'trigger_new_sponsor_launch',
    name: 'New Sponsor Launch Event',
    description: 'Mandatory launch event for new sponsor',
    source: 'sponsor_obligation',
    conditions: {
      hasSponsors: true
    },
    generatedActivity: {
      customName: 'Sponsor Launch Event',
      customDescription: 'Your new sponsor requires a launch event to announce the partnership.',
      category: 'sponsor',
      duration: 6,
      mandatory: true,
      deadline: 4,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          sponsorSatisfaction: 15,
          reputation: 5,
          fanSentiment: 10
        },
        onMiss: {
          sponsorPenalties: [], // Populated dynamically
          contractViolation: true,
          reputationPenalty: -5
        }
      }
    },
    maxPerSeason: 4,
    priority: 100
  },
  {
    id: 'trigger_sponsor_warning_meeting',
    name: 'Sponsor Relationship Meeting',
    description: 'Required meeting when sponsor satisfaction is low',
    source: 'sponsor_warning',
    conditions: {
      hasSponsors: true,
      sponsorSatisfaction: { operator: 'lt', value: 50 }
    },
    generatedActivity: {
      customName: 'Sponsor Relationship Repair',
      customDescription: 'A sponsor is unhappy and requires an urgent meeting to discuss the partnership.',
      category: 'sponsor',
      duration: 3,
      mandatory: true,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          sponsorSatisfaction: 10
        },
        onMiss: {
          sponsorPenalties: [],
          reputationPenalty: -5
        }
      }
    },
    cooldownWeeks: 4,
    priority: 95
  },
  {
    id: 'trigger_sponsor_anniversary',
    name: 'Sponsor Anniversary Celebration',
    description: 'Optional celebration for sponsor partnership anniversary',
    source: 'sponsor_anniversary',
    conditions: {
      hasSponsors: true,
      minReputation: 40
    },
    generatedActivity: {
      customName: 'Partnership Anniversary Event',
      customDescription: 'Celebrate a year of successful partnership with your sponsor.',
      category: 'sponsor',
      duration: 4,
      mandatory: false,
      deadline: 4,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          sponsorSatisfaction: 12,
          reputation: 2,
          boardMood: 3
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 52,  // Once per year
    maxPerSeason: 2,
    priority: 50
  }
]

// ============================================
// BOARD/TEAM TRIGGERS
// ============================================

const BOARD_TEAM_TRIGGERS: ActivityTrigger[] = [
  {
    id: 'trigger_board_warning_presentation',
    name: 'Board Crisis Presentation',
    description: 'Mandatory presentation when board mood is critically low',
    source: 'board_warning',
    conditions: {
      boardMood: { operator: 'lt', value: 40 }
    },
    generatedActivity: {
      customName: 'Emergency Board Presentation',
      customDescription: 'The board is concerned about team performance and requires a presentation on your plans.',
      category: 'team',
      duration: 4,
      mandatory: true,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          boardMood: 8,
          teamMorale: 2
        },
        onMiss: {
          boardMoodPenalty: -20,
          reputationPenalty: -5,
          fineAmount: 50000
        }
      }
    },
    cooldownWeeks: 6,
    priority: 100
  },
  {
    id: 'trigger_staff_morale_crisis',
    name: 'Staff Morale Crisis',
    description: 'Required team building when staff morale is critically low',
    source: 'staff_morale_low',
    conditions: {
      hasStaff: true,
      staffMorale: { operator: 'lt', value: 30 }
    },
    generatedActivity: {
      customName: 'Emergency Team Building',
      customDescription: 'Staff morale has hit rock bottom. An urgent team building session is required.',
      category: 'team',
      duration: 8,
      mandatory: true,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          teamMorale: 12,
          boardMood: 2
        },
        onMiss: {
          boardMoodPenalty: -10,
          reputationPenalty: -3
        }
      }
    },
    cooldownWeeks: 8,
    priority: 90
  },
  {
    id: 'trigger_new_staff_onboarding',
    name: 'New Staff Onboarding',
    description: 'Integration session for newly hired staff',
    source: 'new_staff',
    conditions: {
      hasStaff: true
    },
    generatedActivity: {
      customName: 'Staff Onboarding Session',
      customDescription: 'Help your new team member integrate with the existing staff.',
      category: 'team',
      duration: 4,
      mandatory: false,
      deadline: 3,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          teamMorale: 10,
          boardMood: 3
        },
        onMiss: {
          boardMoodPenalty: -5
        }
      }
    },
    maxPerSeason: 4,
    priority: 60
  },
  {
    id: 'trigger_facility_showcase',
    name: 'Facility Upgrade Showcase',
    description: 'Media opportunity after facility upgrade',
    source: 'facility_upgrade',
    conditions: {
      minReputation: 30
    },
    generatedActivity: {
      customName: 'Facility Showcase Event',
      customDescription: 'Show off your newly upgraded facilities to media and potential sponsors.',
      category: 'media',
      duration: 4,
      mandatory: false,
      deadline: 4,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          reputation: 5,
          fanSentiment: 8,
          sponsorSatisfaction: 5,
          boardMood: 5
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 12,
    maxPerSeason: 2,
    priority: 45
  }
]

// ============================================
// SEASONAL TRIGGERS
// ============================================

const SEASONAL_TRIGGERS: ActivityTrigger[] = [
  {
    id: 'trigger_preseason_testing',
    name: 'Pre-Season Testing',
    description: 'Development opportunity in pre-season',
    source: 'pre_season',
    conditions: {
      weekRange: { min: 1, max: 4 }
    },
    generatedActivity: {
      customName: 'Pre-Season Testing Program',
      customDescription: 'Early season testing to prepare for the championship.',
      category: 'development',
      duration: 8,
      mandatory: false,
      deadline: 4,
      suggestedWeek: 2,
      effects: {
        onComplete: {
          teamMorale: 5,
          boardMood: 5
        },
        onMiss: {}
      }
    },
    maxPerSeason: 1,
    priority: 70
  },
  {
    id: 'trigger_preseason_sponsor_launch',
    name: 'Season Launch Event',
    description: 'Sponsor launch for new season',
    source: 'pre_season',
    conditions: {
      weekRange: { min: 1, max: 6 },
      hasSponsors: true
    },
    generatedActivity: {
      customName: 'Season Launch Gala',
      customDescription: 'Launch the new season with a grand event for sponsors and media.',
      category: 'sponsor',
      duration: 6,
      mandatory: false,
      deadline: 6,
      suggestedWeek: 3,
      effects: {
        onComplete: {
          sponsorSatisfaction: 5,
          reputation: 2,
          fanSentiment: 8,
          boardMood: 4
        },
        onMiss: {}
      }
    },
    maxPerSeason: 1,
    priority: 80
  },
  {
    id: 'trigger_midseason_review',
    name: 'Mid-Season Review',
    description: 'Board review at mid-season',
    source: 'mid_season',
    conditions: {
      weekRange: { min: 20, max: 28 }
    },
    generatedActivity: {
      customName: 'Mid-Season Performance Review',
      customDescription: 'Board wants to review first-half performance and adjust strategy.',
      category: 'team',
      duration: 4,
      mandatory: true,
      deadline: 3,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          boardMood: 4,
          teamMorale: 2
        },
        onMiss: {
          boardMoodPenalty: -15,
          reputationPenalty: -3
        }
      }
    },
    maxPerSeason: 1,
    priority: 85
  },
  {
    id: 'trigger_season_end_awards',
    name: 'Season Awards Ceremony',
    description: 'End of season celebration',
    source: 'season_end',
    conditions: {
      weekRange: { min: 45, max: 52 },
      minReputation: 40
    },
    generatedActivity: {
      customName: 'End of Season Awards Gala',
      customDescription: 'Celebrate the season\'s achievements at the annual awards ceremony.',
      category: 'sponsor',
      duration: 6,
      mandatory: false,
      deadline: 4,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          reputation: 2,
          fanSentiment: 5,
          sponsorSatisfaction: 3,
          teamMorale: 5,
          boardMood: 5
        },
        onMiss: {
          reputationPenalty: -3
        }
      }
    },
    maxPerSeason: 1,
    priority: 75
  }
]

// ============================================
// RANDOM OPPORTUNITY TRIGGERS
// ============================================

const RANDOM_TRIGGERS: ActivityTrigger[] = [
  {
    id: 'trigger_media_interview_request',
    name: 'Media Interview Request',
    description: 'Random media interview opportunity',
    source: 'media_request',
    conditions: {
      minReputation: 25,
      randomChance: 15  // 15% chance per week
    },
    generatedActivity: {
      customName: 'Media Interview Opportunity',
      customDescription: 'A major publication wants to feature you in an exclusive interview.',
      category: 'media',
      duration: 2,
      mandatory: false,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          reputation: 4,
          fanSentiment: 8,
          sponsorSatisfaction: 2
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 4,
    maxPerSeason: 6,
    priority: 40
  },
  {
    id: 'trigger_charity_invitation',
    name: 'Charity Event Invitation',
    description: 'Invitation to participate in charity event',
    source: 'charity_invitation',
    conditions: {
      minReputation: 35,
      randomChance: 10
    },
    generatedActivity: {
      customName: 'Charity Fundraiser',
      customDescription: 'You\'ve been invited to participate in a charity event for a good cause.',
      category: 'media',
      duration: 4,
      mandatory: false,
      deadline: 3,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          reputation: 6,
          fanSentiment: 15,
          boardMood: 5
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 8,
    maxPerSeason: 3,
    priority: 35
  },
  {
    id: 'trigger_crisis_pr',
    name: 'PR Crisis Management',
    description: 'Respond to negative media coverage',
    source: 'crisis_management',
    conditions: {
      randomChance: 5  // Rare
    },
    generatedActivity: {
      customName: 'PR Crisis Response',
      customDescription: 'Negative press coverage requires an immediate response to protect your reputation.',
      category: 'media',
      duration: 3,
      mandatory: true,
      deadline: 1,
      suggestedWeek: 'current',
      effects: {
        onComplete: {
          reputation: 2  // Damage control, limited positive
        },
        onMiss: {
          reputationPenalty: -10,
          sponsorPenalties: [],
          boardMoodPenalty: -8
        }
      }
    },
    cooldownWeeks: 12,
    maxPerSeason: 2,
    priority: 100
  },
  {
    id: 'trigger_sponsor_opportunity',
    name: 'Potential Sponsor Meeting',
    description: 'Opportunity to meet potential new sponsor',
    source: 'random_opportunity',
    conditions: {
      minReputation: 45,
      randomChance: 8
    },
    generatedActivity: {
      customName: 'Potential Sponsor Meeting',
      customDescription: 'A potential new sponsor has expressed interest in partnering with you.',
      category: 'sponsor',
      duration: 3,
      mandatory: false,
      deadline: 2,
      suggestedWeek: 'next',
      effects: {
        onComplete: {
          reputation: 2,
          boardMood: 5
          // Note: Could trigger new sponsor offer generation
        },
        onMiss: {}
      }
    },
    cooldownWeeks: 6,
    maxPerSeason: 4,
    priority: 55
  }
]

// ============================================
// COMBINED TRIGGERS EXPORT
// ============================================

export const ALL_ACTIVITY_TRIGGERS: ActivityTrigger[] = [
  ...RACE_RESULT_TRIGGERS,
  ...SPONSOR_TRIGGERS,
  ...BOARD_TEAM_TRIGGERS,
  ...SEASONAL_TRIGGERS,
  ...RANDOM_TRIGGERS
].sort((a, b) => b.priority - a.priority)  // Sort by priority

// ============================================
// TRIGGER EVALUATION HELPERS
// ============================================

export interface TriggerContext {
  currentWeek: number
  currentDay: number
  reputation: number
  hasSponsors: boolean
  hasStaff: boolean
  hasDrivers: boolean
  boardMood: number
  avgSponsorSatisfaction: number
  avgStaffMorale: number
  lastRaceResult?: 'win' | 'podium' | 'points' | 'dnf' | null
  isChampionshipLeader?: boolean
  recentTriggers: { triggerId: string; week: number }[]
  activityCounts: Record<string, number>  // templateId -> count this season
}

/**
 * Check if a trigger's conditions are met
 */
export function evaluateTriggerConditions(
  trigger: ActivityTrigger,
  context: TriggerContext
): boolean {
  const { conditions } = trigger
  
  // Reputation checks
  if (conditions.minReputation && context.reputation < conditions.minReputation) return false
  if (conditions.maxReputation && context.reputation > conditions.maxReputation) return false
  
  // Resource checks
  if (conditions.hasSponsors && !context.hasSponsors) return false
  if (conditions.hasStaff && !context.hasStaff) return false
  
  // Race-result triggers require drivers to exist
  if (conditions.raceResult && !context.hasDrivers) return false
  
  // Week range check
  if (conditions.weekRange) {
    if (context.currentWeek < conditions.weekRange.min || context.currentWeek > conditions.weekRange.max) {
      return false
    }
  }
  
  // Race result check
  if (conditions.raceResult && conditions.raceResult !== 'any') {
    if (context.lastRaceResult !== conditions.raceResult) return false
  }
  
  // Sponsor satisfaction check
  if (conditions.sponsorSatisfaction) {
    const sat = context.avgSponsorSatisfaction
    const { operator, value } = conditions.sponsorSatisfaction
    if (operator === 'lt' && sat >= value) return false
    if (operator === 'gt' && sat <= value) return false
    if (operator === 'eq' && sat !== value) return false
  }
  
  // Board mood check
  if (conditions.boardMood) {
    const mood = context.boardMood
    const { operator, value } = conditions.boardMood
    if (operator === 'lt' && mood >= value) return false
    if (operator === 'gt' && mood <= value) return false
    if (operator === 'eq' && mood !== value) return false
  }
  
  // Staff morale check
  if (conditions.staffMorale) {
    const morale = context.avgStaffMorale
    const { operator, value } = conditions.staffMorale
    if (operator === 'lt' && morale >= value) return false
    if (operator === 'gt' && morale <= value) return false
    if (operator === 'eq' && morale !== value) return false
  }
  
  // Random chance check
  if (conditions.randomChance !== undefined) {
    const roll = Math.random() * 100
    if (roll > conditions.randomChance) return false
  }
  
  // Cooldown check
  if (trigger.cooldownWeeks) {
    const lastTrigger = context.recentTriggers.find(t => t.triggerId === trigger.id)
    if (lastTrigger && (context.currentWeek - lastTrigger.week) < trigger.cooldownWeeks) {
      return false
    }
  }
  
  // Max per season check
  if (trigger.maxPerSeason) {
    const count = context.activityCounts[trigger.id] || 0
    if (count >= trigger.maxPerSeason) return false
  }
  
  return true
}

/**
 * Generate a scheduled activity from a trigger
 */
export function createActivityFromTrigger(
  trigger: ActivityTrigger,
  context: TriggerContext,
  additionalData?: {
    sponsorId?: string
    staffId?: string
    raceRound?: number
  }
): ScheduledActivity {
  const { generatedActivity } = trigger
  
  // Determine scheduled week
  let scheduledWeek = context.currentWeek + 1
  if (generatedActivity.suggestedWeek === 'current') {
    scheduledWeek = context.currentWeek
  } else if (typeof generatedActivity.suggestedWeek === 'number') {
    scheduledWeek = generatedActivity.suggestedWeek
  }
  
  // Calculate deadline week
  const deadline = generatedActivity.deadline 
    ? context.currentWeek + generatedActivity.deadline
    : undefined
  
  const activity: ScheduledActivity = {
    id: `triggered_${trigger.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: generatedActivity.templateId || trigger.id,
    name: generatedActivity.customName,
    description: generatedActivity.customDescription,
    category: generatedActivity.category,
    scheduledWeek,
    scheduledDay: 1,  // Default to Monday
    duration: generatedActivity.duration,
    spanDays: generatedActivity.spanDays || 1,
    status: 'scheduled',
    
    // Effects
    effectsOnComplete: {
      boardMood: generatedActivity.effects.onComplete.boardMood,
      sponsorSatisfaction: generatedActivity.effects.onComplete.sponsorSatisfaction,
      teamMorale: generatedActivity.effects.onComplete.teamMorale,
      reputation: generatedActivity.effects.onComplete.reputation,
      cash: generatedActivity.effects.onComplete.cash,
      fanSentiment: generatedActivity.effects.onComplete.fanSentiment
    },
    effectsOnMiss: {
      boardMood: generatedActivity.effects.onMiss.boardMoodPenalty,
      reputation: generatedActivity.effects.onMiss.reputationPenalty
    },
    
    // Requirements — infer from trigger source; only race/driver-related triggers need a driver
    requiresDriver: ['race_win', 'race_podium', 'race_dnf', 'championship_lead'].includes(trigger.source),
    
    // Trigger info
    triggeredBy: trigger.source,
    triggerData: {
      sponsorId: additionalData?.sponsorId,
      staffId: additionalData?.staffId,
      raceRound: additionalData?.raceRound
    },
    autoScheduled: true,
    suggestedWeek: scheduledWeek,
    
    // Mandatory settings
    mandatory: generatedActivity.mandatory,
    canReschedule: !generatedActivity.mandatory,
    rescheduleDeadline: deadline,
    missConsequences: generatedActivity.effects.onMiss,
    
    // Time Budget System: drain level and calendar type from cost config
    drainLevel: (TRIGGERED_ACTIVITY_COSTS[trigger.id]?.drain ?? 'normal') as DrainLevel,
    calendarEntryType: (TRIGGERED_ACTIVITY_COSTS[trigger.id]?.calendarType ?? 
      (generatedActivity.mandatory ? 'mandatory' : 'personal')) as CalendarEntryType,
    
    // Day period scheduling from activity time cost config
    scheduledPeriod: (() => {
      const tc = getActivityTimeCost(generatedActivity.templateId || trigger.id)
      return tc.preferredPeriod || tc.allowedPeriods?.[0]
    })()
  }
  
  return activity
}

/**
 * Get all triggers that should fire given the current context
 */
export function getTriggeredActivities(context: TriggerContext): ActivityTrigger[] {
  return ALL_ACTIVITY_TRIGGERS.filter(trigger => 
    evaluateTriggerConditions(trigger, context)
  )
}

// Export trigger categories for filtering
export const TRIGGER_CATEGORIES = {
  raceResults: RACE_RESULT_TRIGGERS,
  sponsor: SPONSOR_TRIGGERS,
  boardTeam: BOARD_TEAM_TRIGGERS,
  seasonal: SEASONAL_TRIGGERS,
  random: RANDOM_TRIGGERS
}
