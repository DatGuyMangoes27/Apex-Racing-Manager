// ============================================
// ACTIVITY TIME COSTS CONFIGURATION
// ============================================
// Centralized registry of time costs, drain levels, and calendar entry types
// for ALL activities across the game. Used by the time budget system.

import type { DrainLevel, CalendarEntryType } from '@/store/careerStore'
import type { DayPeriod } from '@/data/day-periods-config'

export interface ActivityTimeCost {
  hours: number               // Clock hours consumed
  drain: DrainLevel           // How tiring (affects fatigue carry-over)
  calendarType: CalendarEntryType  // How it displays on calendar
  label?: string              // Optional display name override
  allowedPeriods?: DayPeriod[]     // If set, activity can only be done during these day periods
  preferredPeriod?: DayPeriod      // Flavor/auto-schedule hint for best time of day
}

// ============================================
// MANDATORY ACTIVITY TIME COSTS
// (matches templateIds from mandatoryActivities.ts)
// ============================================

export const MANDATORY_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  // Post-race
  'mandatory_race_debrief':           { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'Race Debrief',              allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'mandatory_car_damage_assessment':  { hours: 2, drain: 'normal',  calendarType: 'team',      label: 'Damage Assessment',         allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },  // Delegatable
  
  // Periodic
  'mandatory_board_meeting':          { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Board Meeting',             allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'mandatory_financial_review':       { hours: 3, drain: 'normal',  calendarType: 'mandatory', label: 'Financial Review',          allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'mandatory_sponsor_quarterly':      { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Quarterly Review',  allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  
  // Pre-race
  'mandatory_pre_race_briefing':      { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Pre-Race Briefing',         allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
  'mandatory_car_scrutineering':      { hours: 3, drain: 'normal',  calendarType: 'team',      label: 'Technical Inspection',      allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },  // Delegatable
  
  // Season milestones (full-day events, start in morning)
  'mandatory_season_opener_media':    { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Season Launch',             allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
  'mandatory_mid_season_review':      { hours: 4, drain: 'normal',  calendarType: 'mandatory', label: 'Mid-Season Review',         allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'mandatory_end_of_season':          { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Season Wrap-Up',            allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
}

// ============================================
// ONBOARDING ACTIVITY TIME COSTS
// (matches ids from onboardingMandatorySchedule.ts)
// ============================================

export const ONBOARDING_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  'onboarding_team_briefing':         { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Team Briefing',           allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_facility_walkthrough':  { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Facility Walkthrough',    allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_inbox_comms':          { hours: 1, drain: 'low',     calendarType: 'team',      label: 'Inbox & Comms',           allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },
  'onboarding_finance_intro':        { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Finance Intro',           allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_hr_staffing_intro':    { hours: 1, drain: 'low',     calendarType: 'team',      label: 'HR Intro',                allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_calendar_time':        { hours: 1, drain: 'low',     calendarType: 'team',      label: 'Calendar & Time',         allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },
  'onboarding_sponsor_expectations':  { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Sponsor Expectations',   allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_garage_car_intro':     { hours: 1, drain: 'low',     calendarType: 'team',      label: 'Garage Intro',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_intro_press':          { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Intro Press',             allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'onboarding_media_pr_intro':       { hours: 2, drain: 'normal',  calendarType: 'team',      label: 'Media / PR Intro',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_partner_dinner':       { hours: 2, drain: 'low',     calendarType: 'personal', label: 'Partner Dinner',           allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'onboarding_week1_wrap':           { hours: 1, drain: 'low',     calendarType: 'team',      label: 'Week 1 Wrap',             allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'onboarding_gym_fitness':          { hours: 1, drain: 'normal',  calendarType: 'personal', label: 'Gym / Fitness',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_board_intro':          { hours: 2, drain: 'high',    calendarType: 'mandatory', label: 'Board Intro',             allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_social_media_obligation': { hours: 1, drain: 'low', calendarType: 'team',      label: 'Social Media',            allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'onboarding_budget_allocation':    { hours: 2, drain: 'normal',  calendarType: 'mandatory', label: 'Budget Allocation',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_first_sponsor_checkin': { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Sponsor Check-in',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_sponsor_outreach_prep': { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Sponsor Outreach Prep',   allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'onboarding_industry_networking':  { hours: 2, drain: 'normal',  calendarType: 'personal', label: 'Networking',               allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'onboarding_safety_briefing':      { hours: 1, drain: 'normal',  calendarType: 'mandatory', label: 'Safety Briefing',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_operations_review':    { hours: 2, drain: 'normal',  calendarType: 'team',      label: 'Operations Review',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_charity_visibility':   { hours: 2, drain: 'normal',  calendarType: 'personal', label: 'Charity Appearance',       allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'onboarding_photo_shoot':          { hours: 2, drain: 'normal',  calendarType: 'team',      label: 'Photo Shoot',             allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'onboarding_handoff_meeting':      { hours: 1, drain: 'low',     calendarType: 'mandatory', label: 'Handoff Meeting',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'onboarding_attract_sponsors_session': { hours: 2, drain: 'normal', calendarType: 'team',   label: 'Attract Sponsors',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
}

// ============================================
// CONTEXT-TRIGGERED (after car purchase / series entry)
// ============================================

export const CONTEXT_TRIGGERED_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  'context_car_handover':        { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Car Handover',                  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'context_technical_briefing':   { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Technical Briefing',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'context_series_briefing':     { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Series Registration Briefing',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'context_entry_paperwork':     { hours: 1, drain: 'low',     calendarType: 'mandatory', label: 'Entry Paperwork',               allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
}

// ============================================
// RACE WEEKEND EXPECTED (skip with consequence)
// ============================================

export const RACE_WEEKEND_EXPECTED_COSTS: Record<string, ActivityTimeCost> = {
  'race_expected_pre_race_press_conference':  { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Pre-Race Press Conference', allowedPeriods: ['morning'],              preferredPeriod: 'morning' },
  'race_expected_sponsor_hospitality': { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Sponsor Hospitality',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'race_expected_fan_meet':            { hours: 2, drain: 'normal', calendarType: 'personal',  label: 'Fan Meet & Greet',     allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'race_expected_driver_briefing':     { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Driver Briefing',      allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'race_expected_scrutineering':       { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Scrutineering',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'race_expected_post_qualifying_media':      { hours: 1, drain: 'normal', calendarType: 'mandatory', label: 'Post-Qualifying Media',    allowedPeriods: ['afternoon'],            preferredPeriod: 'afternoon' },
  'race_expected_post_race_press_conference': { hours: 2, drain: 'high',   calendarType: 'mandatory', label: 'Post-Race Press Conference', allowedPeriods: ['evening'],              preferredPeriod: 'evening' },
  'race_expected_post_race_sponsor_commitment': { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Post-Race Sponsor Commitment', allowedPeriods: ['evening'],            preferredPeriod: 'evening' },
}

// ============================================
// TRIGGERED ACTIVITY TIME COSTS
// (matches trigger IDs from triggers.ts)
// ============================================

export const TRIGGERED_ACTIVITY_COSTS: Record<string, ActivityTimeCost> = {
  // Race result triggers
  'trigger_race_win_celebration':         { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Victory Celebration',           allowedPeriods: ['evening'],                    preferredPeriod: 'evening' },
  'trigger_race_win_press':               { hours: 2, drain: 'normal',  calendarType: 'personal', label: "Winner's Press Conference",     allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'trigger_race_podium_sponsor_dinner':   { hours: 3, drain: 'low',     calendarType: 'personal', label: 'Sponsor Celebration Dinner',    allowedPeriods: ['evening'],                    preferredPeriod: 'evening' },
  'trigger_championship_lead':            { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Championship Strategy Review', allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_dnf_team_debrief':             { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'DNF Analysis',                 allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_dnf_sponsor_damage_control':   { hours: 2, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Reassurance',          allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  
  // Sponsor triggers
  'trigger_new_sponsor_launch':           { hours: 6, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Launch Event',         allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
  'trigger_sponsor_warning_meeting':      { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'Sponsor Repair Meeting',       allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_sponsor_anniversary':          { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Partnership Anniversary',       allowedPeriods: ['evening'],                    preferredPeriod: 'evening' },
  
  // Board/team triggers
  'trigger_board_warning_presentation':   { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Emergency Board Presentation', allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_staff_morale_crisis':          { hours: 8, drain: 'high',    calendarType: 'mandatory', label: 'Emergency Team Building',      allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
  'trigger_new_staff_onboarding':         { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Staff Onboarding',              allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_facility_showcase':            { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Facility Showcase',             allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  
  // Seasonal triggers
  'trigger_preseason_testing':            { hours: 8, drain: 'normal',  calendarType: 'personal', label: 'Pre-Season Testing',            allowedPeriods: ['morning'],                    preferredPeriod: 'morning' },
  'trigger_preseason_sponsor_launch':     { hours: 6, drain: 'high',    calendarType: 'personal', label: 'Season Launch Gala',            allowedPeriods: ['evening'],                    preferredPeriod: 'evening' },
  'trigger_midseason_review':             { hours: 4, drain: 'high',    calendarType: 'mandatory', label: 'Mid-Season Review',            allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'trigger_season_end_awards':            { hours: 6, drain: 'normal',  calendarType: 'personal', label: 'Awards Gala',                   allowedPeriods: ['evening'],                    preferredPeriod: 'evening' },
  
  // Random triggers
  'trigger_media_interview_request':      { hours: 2, drain: 'normal',  calendarType: 'personal', label: 'Media Interview',               allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'trigger_charity_invitation':           { hours: 4, drain: 'normal',  calendarType: 'personal', label: 'Charity Fundraiser',            allowedPeriods: ['afternoon', 'evening'],       preferredPeriod: 'evening' },
  'trigger_crisis_pr':                    { hours: 3, drain: 'high',    calendarType: 'mandatory', label: 'PR Crisis Response',      allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },  // Crisis — urgent, any working hour
  'trigger_sponsor_opportunity':          { hours: 3, drain: 'normal',  calendarType: 'personal', label: 'Sponsor Meeting',               allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
}

// ============================================
// MEDIA & PR ACTION TIME COSTS
// ============================================

export const MEDIA_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'press_conference':           { hours: 2, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'press_conference_pre_race':  { hours: 2, drain: 'normal',      calendarType: 'mandatory',   allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'press_conference_post_race': { hours: 2, drain: 'high',        calendarType: 'mandatory',   allowedPeriods: ['afternoon', 'evening'],       preferredPeriod: 'afternoon' },
  'fan_event':                  { hours: 3, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['afternoon', 'evening'],       preferredPeriod: 'afternoon' },
  'sponsor_interview':          { hours: 2, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'media_duty':                 { hours: 2, drain: 'normal',      calendarType: 'mandatory',   allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'social_media_content':       { hours: 1, drain: 'low',         calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon', 'evening', 'night'],  preferredPeriod: 'afternoon' },  // Flexible
  'exclusive_content':          { hours: 2, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'press_release_review':       { hours: 1, drain: 'low',         calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'controversy_response':       { hours: 2, drain: 'high',        calendarType: 'mandatory',   allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },  // Crisis — urgent
  'podcast_session':            { hours: 3, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['afternoon', 'evening'],       preferredPeriod: 'afternoon' },
  'documentary_session':        { hours: 4, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
  'book_deal_session':          { hours: 3, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'afternoon' },
  'speaking_engagement':        { hours: 4, drain: 'high',        calendarType: 'personal',    allowedPeriods: ['afternoon', 'evening'],       preferredPeriod: 'evening' },
  'masterclass_delivery':       { hours: 3, drain: 'normal',      calendarType: 'personal',    allowedPeriods: ['morning', 'afternoon'],       preferredPeriod: 'morning' },
}

// ============================================
// BUSINESS & MANAGEMENT ACTION TIME COSTS
// ============================================

export const BUSINESS_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'contract_negotiation':     { hours: 3, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'sponsor_negotiation':      { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'sponsor_meeting':          { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'investor_meeting':         { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'staff_interview':          { hours: 1, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'staff_hiring':             { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'facility_inspection':      { hours: 2, drain: 'low',     calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'season_planning':          { hours: 3, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'seek_investors':           { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'loan_meeting':             { hours: 2, drain: 'normal',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
}

// ============================================
// PERSONAL LIFE - FAMILY ACTION TIME COSTS
// ============================================

export const FAMILY_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'date_casual':            { hours: 2, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'date_dinner':            { hours: 3, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'date_elaborate':         { hours: 4, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'date_adventure':         { hours: 5, drain: 'normal',      calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'date_weekend':           { hours: 16, drain: 'low',        calendarType: 'personal',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },  // Full day
  'propose':                { hours: 3, drain: 'normal',      calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'wedding_planning':       { hours: 3, drain: 'normal',      calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'wedding_day':            { hours: 16, drain: 'high',       calendarType: 'personal',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },  // Full day
  'quality_time_child':     { hours: 2, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'family_activity':        { hours: 3, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'child_racing_session':   { hours: 3, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'gift_shopping':          { hours: 1, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'announce_pregnancy':     { hours: 1, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'dating_scene':           { hours: 2, drain: 'low',         calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
}

// ============================================
// PERSONAL LIFE - HOBBY ACTION TIME COSTS
// ============================================

export const HOBBY_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'hobby_practice':           { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'hobby_piano':              { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'hobby_guitar':             { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'hobby_golf':               { hours: 3, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'hobby_tennis':             { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'hobby_photography':        { hours: 3, drain: 'restorative',   calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'hobby_painting':           { hours: 2, drain: 'restorative',   calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'hobby_chess':              { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'hobby_cooking':            { hours: 2, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'hobby_wine_tasting':       { hours: 3, drain: 'low',           calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'hobby_language_lesson':    { hours: 2, drain: 'normal',        calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
}

// ============================================
// PERSONAL LIFE - SOCIAL ACTION TIME COSTS
// ============================================

export const SOCIAL_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'social_event':           { hours: 4, drain: 'normal',      calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'gala':                   { hours: 5, drain: 'high',         calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'charity_event':          { hours: 4, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'foundation_meeting':     { hours: 2, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'activism_activity':      { hours: 3, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'networking_event':       { hours: 3, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'donation_ceremony':      { hours: 1, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'seek_endorsements':      { hours: 1, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'start_foundation':       { hours: 2, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'respond_scandal':        { hours: 2, drain: 'high',         calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },  // Crisis — urgent

  // Contact social actions (from social-actions-config.ts)
  // Gifts (instant — no time cost, tagged as afternoon for display)
  'gift_greeting_card':     { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_chocolates':        { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_flowers':           { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_book_vinyl':        { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_wine':              { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_perfume':           { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_concert_tickets':   { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_jewelry':           { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_designer_clothing': { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_luxury_watch':      { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_surprise_trip':     { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'gift_new_car':           { hours: 0, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'afternoon' },

  // Casual hangouts
  'casual_coffee':          { hours: 1, drain: 'low',          calendarType: 'personal', label: 'Coffee Meetup',      allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'casual_lunch':           { hours: 1.5, drain: 'low',        calendarType: 'personal', label: 'Grab Lunch',         allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'casual_walk':            { hours: 1, drain: 'restorative',  calendarType: 'personal', label: 'Walk / Jog',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'casual_watch_game':      { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Watch a Game',       allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },
  'casual_drive':           { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Go for a Drive',     allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'casual_gym':             { hours: 1.5, drain: 'normal',     calendarType: 'personal', label: 'Gym Session',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'casual_videogames':      { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Video Games',        allowedPeriods: ['afternoon', 'evening', 'night'],  preferredPeriod: 'evening' },
  'casual_shopping':        { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Shopping Trip',      allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },

  // Dining & drinks
  'dining_casual_dinner':   { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Casual Dinner',      allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'dining_fine_dining':     { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Fine Dining',        allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'dining_drinks':          { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Drinks at a Bar',    allowedPeriods: ['evening', 'night'],      preferredPeriod: 'evening' },
  'dining_bbq':             { hours: 4, drain: 'low',          calendarType: 'personal', label: 'BBQ / House Party',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'dining_brunch':          { hours: 1.5, drain: 'low',        calendarType: 'personal', label: 'Brunch',             allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'dining_wine_tasting':    { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Wine Tasting',       allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },

  // Romantic
  'romantic_coffee_date':   { hours: 1, drain: 'low',          calendarType: 'personal', label: 'Coffee Date',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'romantic_dinner':        { hours: 2.5, drain: 'low',        calendarType: 'personal', label: 'Romantic Dinner',    allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'romantic_movie':         { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Movie Night',        allowedPeriods: ['evening', 'night'],      preferredPeriod: 'evening' },
  'romantic_concert':       { hours: 4, drain: 'low',          calendarType: 'personal', label: 'Concert',            allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'romantic_cook_together': { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Cook Together',      allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'romantic_stargazing':    { hours: 2, drain: 'restorative',  calendarType: 'personal', label: 'Stargazing',         allowedPeriods: ['night'],                 preferredPeriod: 'night' },
  'romantic_weekend_getaway': { hours: 16, drain: 'low',       calendarType: 'personal', label: 'Weekend Getaway',    allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'romantic_adventure':     { hours: 5, drain: 'normal',       calendarType: 'personal', label: 'Adventure Date',     allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'romantic_spa_day':       { hours: 4, drain: 'restorative',  calendarType: 'personal', label: 'Spa Day',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Event invitations
  'invite_race':            { hours: 8, drain: 'normal',       calendarType: 'personal', label: 'Invite to Race',     allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'invite_facility_tour':   { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Facility Tour',      allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'invite_gala':            { hours: 5, drain: 'normal',       calendarType: 'personal', label: 'Invite to Gala',     allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'invite_charity':         { hours: 3, drain: 'normal',       calendarType: 'personal', label: 'Invite to Charity',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'evening' },

  // Professional
  'professional_lunch':     { hours: 1.5, drain: 'low',        calendarType: 'personal', label: 'Business Lunch',       allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'professional_golf':      { hours: 4, drain: 'low',          calendarType: 'personal', label: 'Golf Outing',          allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'professional_meeting':   { hours: 1, drain: 'low',          calendarType: 'personal', label: 'Private Meeting',      allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'professional_networking_drinks': { hours: 2, drain: 'low',  calendarType: 'personal', label: 'Networking Drinks',    allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
}

// ============================================
// PERSONAL LIFE - EDUCATION ACTION TIME COSTS
// ============================================

export const EDUCATION_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'course_session':         { hours: 3, drain: 'normal',      calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],          preferredPeriod: 'morning' },
  'study_session':          { hours: 2, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening'], preferredPeriod: 'afternoon' },
  'exam_prep':              { hours: 3, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],          preferredPeriod: 'morning' },
  'exam_day':               { hours: 4, drain: 'high',         calendarType: 'personal',  allowedPeriods: ['morning'],                      preferredPeriod: 'morning' },
  'book_reading':           { hours: 1, drain: 'restorative',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon', 'evening', 'night'],  preferredPeriod: 'evening' },
}

// ============================================
// PERSONAL LIFE - HEALTH & WELLNESS TIME COSTS
// ============================================

export const HEALTH_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'medical_appointment':    { hours: 2, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'therapy_session':        { hours: 1, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'gym_exercise':           { hours: 2, drain: 'restorative',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'treatment_session':      { hours: 2, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'spa_visit':              { hours: 3, drain: 'restorative',  calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'health_checkup':         { hours: 2, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
}

// ============================================
// PERSONAL LIFE - LIFESTYLE & COLLECTIONS
// ============================================

export const LIFESTYLE_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'luxury_experience':      { hours: 4, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'collection_appraisal':   { hours: 2, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'concours_exhibition':    { hours: 8, drain: 'normal',       calendarType: 'personal',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },  // Full event day
  'property_viewing':       { hours: 3, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'car_shopping':           { hours: 2, drain: 'low',          calendarType: 'personal',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
}

// ============================================
// TRAVEL TIME COSTS
// ============================================

export const TRAVEL_ACTION_COSTS: Record<string, ActivityTimeCost> = {
  'travel_short_haul':      { hours: 5, drain: 'normal',       calendarType: 'travel',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },   // Domestic / nearby
  'travel_medium_haul':     { hours: 9, drain: 'high',         calendarType: 'travel',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },   // Continental
  'travel_long_haul':       { hours: 14, drain: 'high',        calendarType: 'travel',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },   // Intercontinental
  'travel_ultra_long':      { hours: 16, drain: 'high',        calendarType: 'travel',  allowedPeriods: ['morning'],               preferredPeriod: 'morning' },   // Full day transit
}

// ============================================
// RACE WEEKEND SESSIONS (practice, qualifying, race)
// ============================================

export const RACE_SESSION_COSTS: Record<string, ActivityTimeCost> = {
  'race_practice':   { hours: 4, drain: 'normal', calendarType: 'mandatory', label: 'Free Practice',  allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'race_qualifying': { hours: 2, drain: 'normal', calendarType: 'mandatory', label: 'Qualifying',     allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'race_race':       { hours: 8, drain: 'high',   calendarType: 'mandatory', label: 'Race',           allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
}

// ============================================
// RACE DAY (Special - full day, legacy)
// ============================================

export const RACE_DAY_COST: ActivityTimeCost = { 
  hours: 16, drain: 'high', calendarType: 'mandatory', label: 'Race Day',
  allowedPeriods: ['morning'], preferredPeriod: 'morning'  // Full day starts in the morning
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
// PA SUGGESTION ENGINE / AUTO-SCHEDULER TEMPLATES
// (matches templateIds from suggestionEngine.ts)
// ============================================

export const PA_SUGGESTION_COSTS: Record<string, ActivityTimeCost> = {
  // Team / Strategy
  'board_strategy_session':   { hours: 6, drain: 'high',        calendarType: 'mandatory', label: 'Board Strategy Session',      allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'team_building':            { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Team Building',               allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'team_lunch':               { hours: 1, drain: 'low',         calendarType: 'personal',  label: 'Team Lunch',                  allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'team_photo_session':       { hours: 2, drain: 'normal',      calendarType: 'personal',  label: 'Team Photo Session',          allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'team_meeting':             { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Team Strategy Meeting',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'workshop_maintenance':     { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Workshop Maintenance',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'workshop_upgrade':         { hours: 4, drain: 'normal',      calendarType: 'personal',  label: 'Workshop Upgrade',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'facility_planning':        { hours: 6, drain: 'normal',      calendarType: 'personal',  label: 'Facility Upgrade Planning',   allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'staff_training':           { hours: 6, drain: 'normal',      calendarType: 'personal',  label: 'Staff Training Day',          allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'leadership_coaching':      { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Leadership Coaching',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Development / Driving
  'car_service':              { hours: 8, drain: 'normal',      calendarType: 'personal',  label: 'Car Service Day',             allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'engineering_review':       { hours: 6, drain: 'normal',      calendarType: 'personal',  label: 'Engineering Review',          allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'driver_debrief':           { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Driver Debrief',              allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'data_analysis':            { hours: 4, drain: 'normal',      calendarType: 'personal',  label: 'Data Analysis',               allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'rest_day':                 { hours: 8, drain: 'restorative',  calendarType: 'personal', label: 'Rest Day',                    allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'transport_logistics':      { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Transport Logistics',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Business / Sponsors
  'sponsor_scouting':         { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Sponsor Research Day',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'networking_dinner':        { hours: 4, drain: 'normal',      calendarType: 'personal',  label: 'Networking Dinner',           allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'contract_negotiations':    { hours: 4, drain: 'normal',      calendarType: 'personal',  label: 'Contract Negotiations',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Media / PR
  'press_day':                { hours: 8, drain: 'high',        calendarType: 'personal',  label: 'Press Day',                   allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'podcast_appearance':       { hours: 3, drain: 'normal',      calendarType: 'personal',  label: 'Podcast Appearance',          allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'factory_tour_media':       { hours: 2, drain: 'normal',      calendarType: 'personal',  label: 'Factory Tour (Media)',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'charity_appearance':       { hours: 2, drain: 'low',         calendarType: 'personal',  label: 'Charity Appearance',          allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'school_visit':             { hours: 2, drain: 'normal',      calendarType: 'personal',  label: 'School Visit',                allowedPeriods: ['afternoon'],             preferredPeriod: 'afternoon' },
  'documentary_filming':      { hours: 4, drain: 'normal',      calendarType: 'personal',  label: 'Documentary Filming',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Personal / Lifestyle
  'fitness_session':          { hours: 2, drain: 'restorative',  calendarType: 'personal', label: 'Fitness Training',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'family_time':              { hours: 6, drain: 'low',          calendarType: 'personal', label: 'Family Day',                  allowedPeriods: ['morning', 'afternoon', 'evening'],  preferredPeriod: 'morning' },
  'hobby_time':               { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Hobby Time',                  allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'wellness_retreat':         { hours: 8, drain: 'restorative',  calendarType: 'personal', label: 'Wellness Retreat',            allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'mental_coaching':          { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Mental Coaching',             allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'education_course':         { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Education & Learning',        allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Additional ACTIVITY_TEMPLATES (manually schedulable by player)
  'test_session':             { hours: 8, drain: 'high',         calendarType: 'personal', label: 'Private Test Session',        allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'simulator_session':        { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Simulator Session',           allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'training_session':         { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Training Session',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'data_analysis_session':    { hours: 3, drain: 'normal',       calendarType: 'personal', label: 'Data Analysis Session',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'quick_inspection':         { hours: 2, drain: 'low',          calendarType: 'personal', label: 'Quick Inspection',            allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'investor_coffee':          { hours: 1, drain: 'normal',       calendarType: 'personal', label: 'Investor Coffee',             allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'paddock_public_lunch':     { hours: 1, drain: 'normal',       calendarType: 'personal', label: 'Public Paddock Lunch',        allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'sponsor_acquisition_pitch':{ hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Sponsor Pitch',               allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'staff_recruitment_day':    { hours: 6, drain: 'normal',       calendarType: 'personal', label: 'Staff Recruitment Day',       allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'marketing_campaign':       { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Marketing Campaign',          allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
  'factory_tour':             { hours: 4, drain: 'low',          calendarType: 'personal', label: 'Factory Tour',                allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'budget_review':            { hours: 3, drain: 'normal',       calendarType: 'mandatory',label: 'Budget Review',               allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'supplier_negotiations':    { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Supplier Negotiations',       allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'community_outreach':       { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Community Outreach',          allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'safety_briefing':          { hours: 2, drain: 'normal',       calendarType: 'mandatory',label: 'Safety Briefing',             allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'wind_tunnel_session':      { hours: 6, drain: 'normal',       calendarType: 'personal', label: 'Wind Tunnel Session',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'parts_procurement':        { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Parts Procurement',           allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'car_shakedown':            { hours: 8, drain: 'high',         calendarType: 'personal', label: 'Car Shakedown',               allowedPeriods: ['morning'],               preferredPeriod: 'morning' },
  'equipment_inventory':      { hours: 3, drain: 'low',          calendarType: 'personal', label: 'Equipment Inventory',         allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },
  'staff_review':             { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Staff Review',                allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'morning' },

  // Sponsor activities from ACTIVITY_TEMPLATES
  'sponsor_event_small':      { hours: 4, drain: 'normal',       calendarType: 'personal', label: 'Sponsor Meet & Greet',        allowedPeriods: ['afternoon', 'evening'],  preferredPeriod: 'afternoon' },
  'sponsor_event_major':      { hours: 6, drain: 'high',         calendarType: 'personal', label: 'Major Sponsor Gala',          allowedPeriods: ['evening'],               preferredPeriod: 'evening' },
  'sponsor_product_launch':   { hours: 6, drain: 'normal',       calendarType: 'personal', label: 'Product Launch',              allowedPeriods: ['morning', 'afternoon'],  preferredPeriod: 'afternoon' },
}

// ============================================
// UNIFIED LOOKUP
// ============================================

/** All activity time costs in a single flat map for easy lookup */
export const ALL_ACTIVITY_TIME_COSTS: Record<string, ActivityTimeCost> = {
  ...MANDATORY_ACTIVITY_COSTS,
  ...ONBOARDING_ACTIVITY_COSTS,
  ...CONTEXT_TRIGGERED_ACTIVITY_COSTS,
  ...RACE_WEEKEND_EXPECTED_COSTS,
  ...RACE_SESSION_COSTS,
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
  ...PA_SUGGESTION_COSTS,
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
