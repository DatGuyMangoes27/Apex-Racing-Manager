// ============================================
// ROLE CATEGORY SYSTEM
// ============================================
// Categorizes activities into Driver/Owner/Life buckets
// to make the driver-owner tension visible in the UI.

import type { DayLogEntry } from '@/store/careerStore'

export type RoleCategory = 'racing' | 'business' | 'life'

export interface RoleSplit {
  racing: number    // Hours spent on driver/racing prep
  business: number  // Hours spent on owner/team duties
  life: number      // Hours spent on personal life
  total: number
}

export interface RoleSplitSummary extends RoleSplit {
  dominantRole: RoleCategory
  racingPercent: number
  businessPercent: number
  lifePercent: number
  balance: 'well-balanced' | 'racing-heavy' | 'business-heavy' | 'life-heavy'
  insight: string
}

// ============================================
// ACTIVITY -> ROLE MAPPING
// ============================================

/** Activities that directly improve race performance or driver readiness */
const RACING_ACTIVITIES = new Set([
  // Health & fitness (directly affects driver stats)
  'gym_exercise', 'gym_intense', 'spa_visit', 'therapy_session',
  'medical_appointment', 'health_checkup', 'treatment_session',
  
  // Race preparation
  'mandatory_race_debrief', 'mandatory_pre_race_briefing',
  'mandatory_car_scrutineering',
  'trigger_dnf_team_debrief',
  'trigger_preseason_testing',
  'trigger_championship_lead',
  
  // Training & simulation
  'simulator', 'simulator_session', 'reaction_training',
  'wet_practice', 'track_walk', 'fitness_training',
  'driver_coaching', 'data_review',
  
  // Race day
  'race_day', 'practice_session', 'qualifying_session',
])

/** Activities that manage/grow the team business */
const BUSINESS_ACTIVITIES = new Set([
  // Governance & finance
  'mandatory_board_meeting', 'mandatory_financial_review',
  'mandatory_sponsor_quarterly',
  'trigger_board_warning_presentation',
  
  // Season milestones
  'mandatory_season_opener_media', 'mandatory_mid_season_review',
  'mandatory_end_of_season',
  
  // Sponsor & partnerships
  'sponsor_negotiation', 'sponsor_meeting', 'sponsor_interview',
  'trigger_new_sponsor_launch', 'trigger_sponsor_warning_meeting',
  'trigger_sponsor_anniversary', 'trigger_sponsor_opportunity',
  'trigger_dnf_sponsor_damage_control',
  
  // Staff & HR
  'staff_interview', 'staff_hiring', 
  'trigger_new_staff_onboarding', 'trigger_staff_morale_crisis',
  
  // Operations
  'facility_inspection', 'trigger_facility_showcase',
  'season_planning', 'contract_negotiation',
  'investor_meeting', 'seek_investors', 'loan_meeting',
  
  // Media & PR (team-related)
  'press_conference', 'press_conference_pre_race', 'press_conference_post_race',
  'media_duty', 'controversy_response', 'trigger_crisis_pr',
  'press_release_review',
  
  // Travel (for the team)
  'travel_short_haul', 'travel_medium_haul', 'travel_long_haul', 'travel_ultra_long',
])

/** 
 * Categorize an activity into Racing / Business / Life.
 * Uses explicit mapping first, then falls back to prefix/pattern matching.
 */
export function categorizeActivity(activityId: string): RoleCategory {
  // Explicit matches
  if (RACING_ACTIVITIES.has(activityId)) return 'racing'
  if (BUSINESS_ACTIVITIES.has(activityId)) return 'business'
  
  // Prefix matching for common patterns
  const id = activityId.toLowerCase()
  
  // Mandatory activities default to business (governance duties)
  if (id.startsWith('mandatory_')) return 'business'
  
  // Triggered business events
  if (id.startsWith('trigger_sponsor_') || id.startsWith('trigger_board_') || id.startsWith('trigger_staff_')) return 'business'
  
  // Family activities -> life
  if (id.startsWith('date_') || id.startsWith('quality_time') || id.startsWith('family_') || 
      id.startsWith('child_') || id.startsWith('gift_') || id.startsWith('wedding') || 
      id.startsWith('propose') || id.startsWith('announce_') || id.startsWith('dating_')) return 'life'
  
  // Hobby activities -> life
  if (id.startsWith('hobby_')) return 'life'
  
  // Social activities -> life
  if (id.startsWith('social_') || id.startsWith('gala') || id.startsWith('charity_') || 
      id.startsWith('foundation_') || id.startsWith('activism_') || id.startsWith('networking_') ||
      id.startsWith('donation_') || id.startsWith('seek_endorsements') || id.startsWith('start_foundation') ||
      id.startsWith('respond_scandal')) return 'life'
  
  // Education -> life
  if (id.startsWith('course_') || id.startsWith('study_') || id.startsWith('exam_') || id.startsWith('book_')) return 'life'
  
  // Health -> racing (fitness directly affects driving)
  if (id.startsWith('gym_') || id.startsWith('medical_') || id.startsWith('therapy_') || 
      id.startsWith('treatment_') || id.startsWith('spa_') || id.startsWith('health_')) return 'racing'
  
  // Lifestyle -> life
  if (id.startsWith('luxury_') || id.startsWith('collection_') || id.startsWith('concours_') || 
      id.startsWith('property_') || id.startsWith('car_shopping')) return 'life'
  
  // Celebrations -> life
  if (id.includes('celebration') || id.includes('awards') || id.includes('dinner')) return 'life'
  
  // Media content creation -> business
  if (id.includes('media') || id.includes('press') || id.includes('interview') || 
      id.includes('podcast') || id.includes('documentary') || id.includes('speaking') || 
      id.includes('masterclass') || id.includes('book_deal')) return 'business'
  
  // Default: personal life
  return 'life'
}

// ============================================
// SPLIT CALCULATION
// ============================================

/**
 * Calculate the role split from a day's activity log.
 */
export function calculateRoleSplit(dayLog: DayLogEntry[]): RoleSplit {
  const split: RoleSplit = { racing: 0, business: 0, life: 0, total: 0 }
  
  for (const entry of dayLog) {
    const category = categorizeActivity(entry.activityId)
    split[category] += entry.hoursSpent
    split.total += entry.hoursSpent
  }
  
  // Round to 1 decimal
  split.racing = Math.round(split.racing * 10) / 10
  split.business = Math.round(split.business * 10) / 10
  split.life = Math.round(split.life * 10) / 10
  split.total = Math.round(split.total * 10) / 10
  
  return split
}

/**
 * Get a full summary with percentages, dominant role, and contextual insight.
 */
export function getRoleSplitSummary(dayLog: DayLogEntry[]): RoleSplitSummary {
  const split = calculateRoleSplit(dayLog)
  
  const racingPercent = split.total > 0 ? Math.round((split.racing / split.total) * 100) : 0
  const businessPercent = split.total > 0 ? Math.round((split.business / split.total) * 100) : 0
  const lifePercent = split.total > 0 ? Math.round((split.life / split.total) * 100) : 0
  
  // Determine dominant role
  let dominantRole: RoleCategory = 'racing'
  if (split.business >= split.racing && split.business >= split.life) dominantRole = 'business'
  else if (split.life >= split.racing && split.life >= split.business) dominantRole = 'life'
  
  // Determine balance
  const threshold = 50 // If any category is >50%, it's "heavy"
  let balance: RoleSplitSummary['balance'] = 'well-balanced'
  if (racingPercent >= threshold) balance = 'racing-heavy'
  else if (businessPercent >= threshold) balance = 'business-heavy'
  else if (lifePercent >= threshold) balance = 'life-heavy'
  
  // Generate contextual insight
  const insight = generateInsight(split, balance, racingPercent, businessPercent, lifePercent)
  
  return {
    ...split,
    dominantRole,
    racingPercent,
    businessPercent,
    lifePercent,
    balance,
    insight,
  }
}

function generateInsight(
  split: RoleSplit, 
  balance: RoleSplitSummary['balance'],
  _racingPct: number, 
  _businessPct: number, 
  _lifePct: number
): string {
  if (split.total === 0) return 'Full rest day. Recovery will help for the next race.'
  
  switch (balance) {
    case 'racing-heavy':
      return 'Focused on race prep today. Your driving should benefit, but the business waits for no one.'
    case 'business-heavy':
      if (split.racing === 0) return 'All business, no track time. Your race sharpness may dull.'
      return 'Heavy on the business side. The team benefits, but don\'t neglect the cockpit.'
    case 'life-heavy':
      if (split.racing === 0 && split.business === 0) return 'A personal day. Recharging, but the team and car need attention too.'
      return 'Leaning into personal time today. Good for stress, but keep an eye on the bigger picture.'
    case 'well-balanced':
      if (split.racing > 0 && split.business > 0 && split.life > 0) {
        return 'Balanced across all roles. The mark of a driver-owner who has it all under control.'
      }
      if (split.racing > 0 && split.business > 0) {
        return 'Split between racing and business. A productive day for the driver-owner.'
      }
      return 'A varied day. Keeping all plates spinning.'
  }
}

// ============================================
// WEEKLY AGGREGATION
// ============================================

export interface WeeklyRoleSplit {
  daily: RoleSplit[]         // Per-day splits (up to 7)
  totals: RoleSplit          // Aggregate for the week
  racingPercent: number
  businessPercent: number
  lifePercent: number
  balance: RoleSplitSummary['balance']
  weekInsight: string
}

/**
 * Aggregate role splits across multiple days for a weekly summary.
 */
export function getWeeklyRoleSplit(dailyLogs: DayLogEntry[][]): WeeklyRoleSplit {
  const daily = dailyLogs.map(log => calculateRoleSplit(log))
  
  const totals: RoleSplit = { racing: 0, business: 0, life: 0, total: 0 }
  for (const day of daily) {
    totals.racing += day.racing
    totals.business += day.business
    totals.life += day.life
    totals.total += day.total
  }
  
  totals.racing = Math.round(totals.racing * 10) / 10
  totals.business = Math.round(totals.business * 10) / 10
  totals.life = Math.round(totals.life * 10) / 10
  totals.total = Math.round(totals.total * 10) / 10
  
  const racingPercent = totals.total > 0 ? Math.round((totals.racing / totals.total) * 100) : 0
  const businessPercent = totals.total > 0 ? Math.round((totals.business / totals.total) * 100) : 0
  const lifePercent = totals.total > 0 ? Math.round((totals.life / totals.total) * 100) : 0
  
  const threshold = 50
  let balance: RoleSplitSummary['balance'] = 'well-balanced'
  if (racingPercent >= threshold) balance = 'racing-heavy'
  else if (businessPercent >= threshold) balance = 'business-heavy'
  else if (lifePercent >= threshold) balance = 'life-heavy'
  
  let weekInsight = 'A balanced week across all responsibilities.'
  if (balance === 'racing-heavy') weekInsight = 'You prioritized the cockpit this week. Race performance should improve, but the business side may need catch-up.'
  else if (balance === 'business-heavy') weekInsight = 'A heavy business week. The team infrastructure benefits, but your race edge might be slipping.'
  else if (balance === 'life-heavy') weekInsight = 'You invested in yourself this week. Lower stress, but the team and car need your attention.'
  
  return { daily, totals, racingPercent, businessPercent, lifePercent, balance, weekInsight }
}
