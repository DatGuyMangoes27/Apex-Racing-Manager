// ============================================
// ACTIVITY TIME COSTS CONFIGURATION
// ============================================
// Centralized registry of time costs, drain levels, and calendar entry types
// for ALL activities across the game. Used by the time budget system.

import type { DrainLevel, CalendarEntryType } from '@/store/careerStore'

export interface ActivityTimeCost {
  hours: number               // Clock hours consumed
  drain: DrainLevel           // How tiring (affects fatigue carry-over)
  calendarType: CalendarEntryType  // How it displays on calendar
  label?: string              // Optional display name override
}

// ============================================
// MANDATORY ACTIVITY TIME COSTS
// (matches templateIds from mandatoryActivities.ts)
// ============================================

export const MANDATORY_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  // Post-race
  'mandatory_race_debrief':           { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'Race Debrief' },
  'mandatory_car_damage_assessment':  { hours: 2, drain: 'normal',  calendarType: 'team',      label: 'Damage Assessment' },  // Delegatable
  
  // Periodic
  'mandatory_board_meeting':          { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Board Meeting' },
  'mandatory_financial_review':       { hours: 3, drain: 'normal',  calendarType: 'mandatory', label: 'Financial Review' },
  'mandatory_sponsor_quarterly':      { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Quarterly Review' },
  
  // Pre-race
  'mandatory_pre_race_briefing':      { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Pre-Race Briefing' },
  'mandatory_car_scrutineering':      { hours: 3, drain: 'normal',  calendarType: 'team',      label: 'Technical Inspection' },  // Delegatable
  
  // Season milestones
  'mandatory_season_opener_media':    { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Season Launch' },
  'mandatory_mid_season_review':      { hours: 4, drain: 'normal',  calendarType: 'mandatory', label: 'Mid-Season Review' },
  'mandatory_end_of_season':          { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Season Wrap-Up' },
}

// ============================================
// TRIGGERED ACTIVITY TIME COSTS
// (matches trigger IDs from triggers.ts)
// ============================================

export const TRIGGERED_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  // Race result triggers
  'trigger_race_win_celebration':         { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Victory Celebration' },
  'trigger_race_win_press':               { hours: 2, drain: 'normal',  calendarType: 'personal', label: "Winner's Press Conference" },
  'trigger_race_podium_sponsor_dinner':   { hours: 3, drain: 'low',     calendarType: 'personal', label: 'Sponsor Celebration Dinner' },
  'trigger_championship_lead':            { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Championship Strategy Review' },
  'trigger_dnf_team_debrief':             { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'DNF Analysis' },
  'trigger_dnf_sponsor_damage_control':   { hours: 2, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Reassurance' },
  
  // Sponsor triggers
  'trigger_new_sponsor_launch':           { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Launch Event' },
  'trigger_sponsor_warning_meeting':      { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Repair Meeting' },
  'trigger_sponsor_anniversary':          { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Partnership Anniversary' },
  
  // Board/team triggers
  'trigger_board_warning_presentation':   { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Emergency Board Presentation' },
  'trigger_staff_morale_crisis':          { hours: 8, drain: 'high',    calendarType: 'mandatory', label: 'Emergency Team Building' },
  'trigger_new_staff_onboarding':         { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Staff Onboarding' },
  'trigger_facility_showcase':            { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Facility Showcase' },
  
  // Seasonal triggers
  'trigger_preseason_testing':            { hours: 8, drain: 'normal',  calendarType: 'personal', label: 'Pre-Season Testing' },
  'trigger_preseason_sponsor_launch':     { hours: 6, drain: 'high',    calendarType: 'personal', label: 'Season Launch Gala' },
  'trigger_midseason_review':             { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Mid-Season Review' },
  'trigger_season_end_awards':            { hours: 6, drain: 'normal',  calendarType: 'personal', label: 'Awards Gala' },
  
  // Random triggers
  'trigger_media_interview_request':      { hours: 2, drain: 'normal',  calendarType: 'personal', label: 'Media Interview' },
  'trigger_charity_invitation':           { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Charity Fundraiser' },
  'trigger_crisis_pr':                    { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'PR Crisis Response' },
  'trigger_sponsor_opportunity':          { hours: 3, drain: 'normal',  calendarType: 'personal', label: 'Sponsor Meeting' },
}

// ============================================
// MEDIA & PR ACTION TIME COSTS
// ============================================

export const MEDIA_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'press_conference':           { hours: 2, drain: 'normal',      calendarType: 'personal' },
  'press_conference_pre_race':  { hours: 2, drain: 'normal',      calendarType: 'mandatory' },
  'press_conference_post_race': { hours: 2, drain: 'high',        calendarType: 'mandatory' },
  'fan_event':                  { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'sponsor_interview':          { hours: 2, drain: 'normal',      calendarType: 'personal' },
  'media_duty':                 { hours: 2, drain: 'normal',      calendarType: 'mandatory' },
  'social_media_content':       { hours: 1, drain: 'low',         calendarType: 'personal' },
  'exclusive_content':          { hours: 2, drain: 'normal',      calendarType: 'personal' },
  'press_release_review':       { hours: 1, drain: 'low',         calendarType: 'personal' },
  'controversy_response':       { hours: 2, drain: 'high',        calendarType: 'mandatory' },
  'podcast_session':            { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'documentary_session':        { hours: 4, drain: 'normal',      calendarType: 'personal' },
  'book_deal_session':          { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'speaking_engagement':        { hours: 4, drain: 'high',        calendarType: 'personal' },
  'masterclass_delivery':       { hours: 3, drain: 'normal',      calendarType: 'personal' },
}

// ============================================
// BUSINESS & MANAGEMENT ACTION TIME COSTS
// ============================================

export const BUSINESS_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'contract_negotiation':     { hours: 3, drain: 'normal',  calendarType: 'personal' },
  'sponsor_negotiation':      { hours: 2, drain: 'normal',  calendarType: 'personal' },
  'sponsor_meeting':          { hours: 2, drain: 'normal',  calendarType: 'personal' },
  'investor_meeting':         { hours: 2, drain: 'normal',  calendarType: 'personal' },
  'staff_interview':          { hours: 1, drain: 'normal',  calendarType: 'personal' },
  'staff_hiring':             { hours: 2, drain: 'normal',  calendarType: 'personal' },
  'facility_inspection':      { hours: 2, drain: 'low',     calendarType: 'personal' },
  'season_planning':          { hours: 3, drain: 'normal',  calendarType: 'personal' },
  'seek_investors':           { hours: 2, drain: 'normal',  calendarType: 'personal' },
  'loan_meeting':             { hours: 2, drain: 'normal',  calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - FAMILY ACTION TIME COSTS
// ============================================

export const FAMILY_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'date_casual':            { hours: 2, drain: 'low',         calendarType: 'personal' },
  'date_dinner':            { hours: 3, drain: 'low',         calendarType: 'personal' },
  'date_elaborate':         { hours: 4, drain: 'low',         calendarType: 'personal' },
  'date_adventure':         { hours: 5, drain: 'normal',      calendarType: 'personal' },
  'date_weekend':           { hours: 16, drain: 'low',        calendarType: 'personal' },  // Full day
  'propose':                { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'wedding_planning':       { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'wedding_day':            { hours: 16, drain: 'high',       calendarType: 'personal' },  // Full day
  'quality_time_child':     { hours: 2, drain: 'low',         calendarType: 'personal' },
  'family_activity':        { hours: 3, drain: 'low',         calendarType: 'personal' },
  'child_racing_session':   { hours: 3, drain: 'low',         calendarType: 'personal' },
  'gift_shopping':          { hours: 1, drain: 'low',         calendarType: 'personal' },
  'announce_pregnancy':     { hours: 1, drain: 'low',         calendarType: 'personal' },
  'dating_scene':           { hours: 2, drain: 'low',         calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - HOBBY ACTION TIME COSTS
// ============================================

export const HOBBY_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'hobby_practice':           { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_piano':              { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_guitar':             { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_golf':               { hours: 3, drain: 'low',           calendarType: 'personal' },
  'hobby_tennis':             { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_photography':        { hours: 3, drain: 'restorative',   calendarType: 'personal' },
  'hobby_painting':           { hours: 2, drain: 'restorative',   calendarType: 'personal' },
  'hobby_chess':              { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_cooking':            { hours: 2, drain: 'low',           calendarType: 'personal' },
  'hobby_wine_tasting':       { hours: 3, drain: 'low',           calendarType: 'personal' },
  'hobby_language_lesson':    { hours: 2, drain: 'normal',        calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - SOCIAL ACTION TIME COSTS
// ============================================

export const SOCIAL_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'social_event':           { hours: 4, drain: 'normal',      calendarType: 'personal' },
  'gala':                   { hours: 5, drain: 'high',         calendarType: 'personal' },
  'charity_event':          { hours: 4, drain: 'normal',       calendarType: 'personal' },
  'foundation_meeting':     { hours: 2, drain: 'normal',       calendarType: 'personal' },
  'activism_activity':      { hours: 3, drain: 'normal',       calendarType: 'personal' },
  'networking_event':       { hours: 3, drain: 'normal',       calendarType: 'personal' },
  'donation_ceremony':      { hours: 1, drain: 'low',          calendarType: 'personal' },
  'seek_endorsements':      { hours: 1, drain: 'normal',       calendarType: 'personal' },
  'start_foundation':       { hours: 2, drain: 'normal',       calendarType: 'personal' },
  'respond_scandal':        { hours: 2, drain: 'high',         calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - EDUCATION ACTION TIME COSTS
// ============================================

export const EDUCATION_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'course_session':         { hours: 3, drain: 'normal',      calendarType: 'personal' },
  'study_session':          { hours: 2, drain: 'low',          calendarType: 'personal' },
  'exam_prep':              { hours: 3, drain: 'normal',       calendarType: 'personal' },
  'exam_day':               { hours: 4, drain: 'high',         calendarType: 'personal' },
  'book_reading':           { hours: 1, drain: 'restorative',  calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - HEALTH & WELLNESS TIME COSTS
// ============================================

export const HEALTH_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'medical_appointment':    { hours: 2, drain: 'normal',       calendarType: 'personal' },
  'therapy_session':        { hours: 1, drain: 'low',          calendarType: 'personal' },
  'gym_exercise':           { hours: 2, drain: 'restorative',  calendarType: 'personal' },
  'treatment_session':      { hours: 2, drain: 'normal',       calendarType: 'personal' },
  'spa_visit':              { hours: 3, drain: 'restorative',  calendarType: 'personal' },
  'health_checkup':         { hours: 2, drain: 'normal',       calendarType: 'personal' },
}

// ============================================
// PERSONAL LIFE - LIFESTYLE & COLLECTIONS
// ============================================

export const LIFESTYLE_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'luxury_experience':      { hours: 4, drain: 'low',          calendarType: 'personal' },
  'collection_appraisal':   { hours: 2, drain: 'low',          calendarType: 'personal' },
  'concours_exhibition':    { hours: 8, drain: 'normal',       calendarType: 'personal' },  // Full event day
  'property_viewing':       { hours: 3, drain: 'low',          calendarType: 'personal' },
  'car_shopping':           { hours: 2, drain: 'low',          calendarType: 'personal' },
}

// ============================================
// TRAVEL TIME COSTS
// ============================================

export const TRAVEL_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'travel_short_haul':      { hours: 5, drain: 'normal',       calendarType: 'travel' },   // Domestic / nearby
  'travel_medium_haul':     { hours: 9, drain: 'high',         calendarType: 'travel' },   // Continental
  'travel_long_haul':       { hours: 14, drain: 'high',        calendarType: 'travel' },   // Intercontinental
  'travel_ultra_long':      { hours: 16, drain: 'high',        calendarType: 'travel' },   // Full day transit
}

// ============================================
// RACE DAY (Special - full day)
// ============================================

export const RACE_DAY_COST: ActivityTimeCost = { 
  hours: 16, drain: 'high', calendarType: 'mandatory', label: 'Race Day' 
}

// ============================================
// TEAM / PASSIVE EVENTS (no owner time cost)
// ============================================

export const TEAM_PASSIVE_COSTS: Record<string, ActivityTimeCost> = {
  'manufacturing_progress':   { hours: 0, drain: 'normal', calendarType: 'team' },
  'parts_delivery':           { hours: 0, drain: 'normal', calendarType: 'team' },
  'facility_upgrade_progress':{ hours: 0, drain: 'normal', calendarType: 'team' },
  'rnd_milestone':            { hours: 0, drain: 'normal', calendarType: 'team' },
  'staff_training_progress':  { hours: 0, drain: 'normal', calendarType: 'team' },
  'merchandise_production':   { hours: 0, drain: 'normal', calendarType: 'team' },
  'car_repair':               { hours: 0, drain: 'normal', calendarType: 'team' },
  'investment_update':        { hours: 0, drain: 'normal', calendarType: 'team' },
  'salary_payment':           { hours: 0, drain: 'normal', calendarType: 'team' },
  'sponsor_payment':          { hours: 0, drain: 'normal', calendarType: 'team' },
  'loan_payment':             { hours: 0, drain: 'normal', calendarType: 'team' },
  'living_expense':           { hours: 0, drain: 'normal', calendarType: 'team' },
  'championship_standings':   { hours: 0, drain: 'normal', calendarType: 'team' },
  'transfer_news':            { hours: 0, drain: 'normal', calendarType: 'team' },
}

// ============================================
// UNIFIED LOOKUP
// ============================================

/** All activity time costs in a single flat map for easy lookup */
export const ALL_ACTIVITY_TIME_COSTS: Record<string, ActivityTimeCost> = {
  ...MANDATORY_ACTIVITY_COSTS,
  ...TRIGGERED_ACTIVITY_COSTS,
  ...MEDIA_ACTION_COSTS,
  ...BUSINESS_ACTION_COSTS,
  ...FAMILY_ACTION_COSTS,
  ...HOBBY_ACTION_COSTS,
  ...SOCIAL_ACTION_COSTS,
  ...EDUCATION_ACTION_COSTS,
  ...HEALTH_ACTION_COSTS,
  ...LIFESTYLE_ACTION_COSTS,
  ...TRAVEL_ACTION_COSTS,
  ...TEAM_PASSIVE_COSTS,
}

/**
 * Look up time cost for an activity. Falls back to sensible defaults.
 */
export function getActivityTimeCost(activityId: string): ActivityTimeCost {
  return ALL_ACTIVITY_TIME_COSTS[activityId] ?? { hours: 1, drain: 'normal', calendarType: 'personal' }
}

/**
 * Check if an activity requires owner's personal time (hours > 0 and not team-only).
 */
export function requiresOwnerTime(activityId: string): boolean {
  const cost = ALL_ACTIVITY_TIME_COSTS[activityId]
  if (!cost) return true  // Default to requiring time if unknown
  return cost.hours > 0 && cost.calendarType !== 'team'
}
