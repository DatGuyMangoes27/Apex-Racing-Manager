// ============================================
// NOTIFICATION SENDER REGISTRY
// ============================================
// Maps notification categories to sender personas and channels.
// Personal stuff -> Phone (text messages from contacts)
// Team/business stuff -> Email (from named staff with role titles)
//
// Key mechanic: If the sender doesn't exist (no staff hired, no partner, etc.),
// the notification quality degrades or is missed entirely.

import type { ConversationCategory } from './messaging-config'

// ============================================
// TYPES
// ============================================

export type NotificationChannel = 'phone' | 'email'
export type NotificationQuality = 'full' | 'degraded' | 'missed'

export interface NotificationSender {
  /** Display name (or 'dynamic' to resolve from context) */
  name: string
  /** Role/title of the sender */
  role: string
  /** Which channel the notification goes to */
  channel: NotificationChannel
  /** For phone messages: what type of contact this is */
  contactType?: ConversationCategory
  /** Staff role key to look up from ownedTeam.staff / facilityStaff */
  staffRoleKey?: string
  /** Personal life field to resolve name from */
  personalLifeField?: string
  /** If true, notification is completely missed when sender doesn't exist */
  requiresSender: boolean
  /** Fallback department name for degraded emails (when no specific person) */
  fallbackDepartment?: string
}

export interface ResolvedSender {
  name: string
  role: string
  channel: NotificationChannel
  quality: NotificationQuality
  contactId?: string        // For phone: existing contact ID
  portraitId?: string       // Optional portrait
  contactType?: ConversationCategory
}

// ============================================
// SENDER REGISTRY
// ============================================

export const NOTIFICATION_SENDERS: Record<string, NotificationSender> = {
  // ==========================================
  // TEAM / BUSINESS -> EMAIL
  // ==========================================
  
  'manufacturing': {
    name: 'dynamic',
    role: 'Head of Manufacturing',
    channel: 'email',
    staffRoleKey: 'manufacturing_head',
    requiresSender: false,
    fallbackDepartment: 'Manufacturing Dept.'
  },
  'facility': {
    name: 'dynamic',
    role: 'Facilities Manager',
    channel: 'email',
    staffRoleKey: 'facilities_manager',
    requiresSender: false,
    fallbackDepartment: 'Facilities Dept.'
  },
  'finances': {
    name: 'dynamic',
    role: 'Finance Director',
    channel: 'email',
    staffRoleKey: 'finance_director',
    requiresSender: false,
    fallbackDepartment: 'Finance Dept.'
  },
  'sponsor': {
    name: 'dynamic',
    role: 'Sponsorship Manager',
    channel: 'email',
    staffRoleKey: 'sponsorship_manager',
    requiresSender: false,
    fallbackDepartment: 'Sponsorship Dept.'
  },
  'staff_hr': {
    name: 'dynamic',
    role: 'HR Director',
    channel: 'email',
    staffRoleKey: 'hr_director',
    requiresSender: false,
    fallbackDepartment: 'HR Dept.'
  },
  'technical': {
    name: 'dynamic',
    role: 'Technical Director',
    channel: 'email',
    staffRoleKey: 'technical_director',
    requiresSender: false,
    fallbackDepartment: 'Technical Dept.'
  },
  'media_pr': {
    name: 'dynamic',
    role: 'PR Manager',
    channel: 'email',
    staffRoleKey: 'pr_manager',
    requiresSender: false,
    fallbackDepartment: 'PR Dept.'
  },
  'board': {
    name: 'dynamic',
    role: 'Board Chairman',
    channel: 'email',
    staffRoleKey: 'board_chairman',
    requiresSender: false,
    fallbackDepartment: 'Board of Directors'
  },
  'logistics': {
    name: 'dynamic',
    role: 'Logistics Coordinator',
    channel: 'email',
    staffRoleKey: 'logistics_coordinator',
    requiresSender: false,
    fallbackDepartment: 'Logistics Dept.'
  },
  'legal': {
    name: 'dynamic',
    role: 'Legal Counsel',
    channel: 'email',
    staffRoleKey: 'legal_counsel',
    requiresSender: false,
    fallbackDepartment: 'Legal Dept.'
  },
  'supply_chain': {
    name: 'dynamic',
    role: 'Supply Chain Manager',
    channel: 'email',
    staffRoleKey: 'supply_chain',
    requiresSender: false,
    fallbackDepartment: 'Supply Chain Dept.'
  },
  'race_engineer': {
    name: 'dynamic',
    role: 'Race Engineer',
    channel: 'email',
    staffRoleKey: 'race_engineer',
    requiresSender: false,
    fallbackDepartment: 'Engineering Dept.'
  },
  'team_manager': {
    name: 'dynamic',
    role: 'Team Manager',
    channel: 'email',
    staffRoleKey: 'team_manager',
    requiresSender: false,
    fallbackDepartment: 'Team Management'
  },
  
  // ==========================================
  // PERSONAL LIFE -> PHONE
  // Requires the contact to exist!
  // ==========================================
  
  'partner': {
    name: 'dynamic',
    role: 'Partner',
    channel: 'phone',
    contactType: 'romantic',
    personalLifeField: 'partner',
    requiresSender: true   // No partner = no message
  },
  'family_child': {
    name: 'dynamic',
    role: 'Family',
    channel: 'phone',
    contactType: 'family',
    personalLifeField: 'children',
    requiresSender: true   // No children = no message
  },
  'family_general': {
    name: 'dynamic',
    role: 'Family',
    channel: 'phone',
    contactType: 'family',
    personalLifeField: 'family',
    requiresSender: true
  },
  'friend': {
    name: 'dynamic',
    role: 'Friend',
    channel: 'phone',
    contactType: 'social',
    personalLifeField: 'friends',
    requiresSender: true   // No friends = missed social opportunities
  },
  'personal_trainer': {
    name: 'dynamic',
    role: 'Personal Trainer',
    channel: 'phone',
    contactType: 'business',
    personalLifeField: 'personalStaff.trainer',
    requiresSender: true   // No trainer = no health reminders
  },
  'personal_doctor': {
    name: 'dynamic',
    role: 'Doctor',
    channel: 'phone',
    contactType: 'business',
    personalLifeField: 'personalStaff.doctor',
    requiresSender: true   // No doctor = no health reminders
  },
  'personal_assistant': {
    name: 'dynamic',
    role: 'Personal Assistant',
    channel: 'phone',
    contactType: 'business',
    personalLifeField: 'personalStaff.assistant',
    requiresSender: true   // No assistant = miss scheduling tips
  },
  'hobby_instructor': {
    name: 'dynamic',
    role: 'Instructor',
    channel: 'phone',
    contactType: 'business',
    personalLifeField: 'personalStaff.instructor',
    requiresSender: true   // No instructor = no practice reminders
  },
  'social_event_host': {
    name: 'dynamic',
    role: 'Event Organizer',
    channel: 'phone',
    contactType: 'social',
    personalLifeField: 'socialContacts',
    requiresSender: true   // No social contacts = missed invitations
  },
  'charity_foundation': {
    name: 'dynamic',
    role: 'Foundation Director',
    channel: 'phone',
    contactType: 'business',
    personalLifeField: 'foundation',
    requiresSender: true
  },
}

// ============================================
// CATEGORY MAPPING
// ============================================
// Maps activity categories / event types to the appropriate sender key

export const ACTIVITY_TO_SENDER: Record<string, string> = {
  // Mandatory activities
  'mandatory_race_debrief': 'race_engineer',
  'mandatory_car_damage_assessment': 'technical',
  'mandatory_board_meeting': 'board',
  'mandatory_financial_review': 'finances',
  'mandatory_sponsor_quarterly': 'sponsor',
  'mandatory_pre_race_briefing': 'race_engineer',
  'mandatory_car_scrutineering': 'technical',
  'mandatory_season_opener_media': 'media_pr',
  'mandatory_mid_season_review': 'board',
  'mandatory_end_of_season': 'team_manager',
  
  // Triggered activities
  'trigger_race_win_celebration': 'media_pr',
  'trigger_race_win_press': 'media_pr',
  'trigger_race_podium_sponsor_dinner': 'sponsor',
  'trigger_championship_lead': 'board',
  'trigger_dnf_team_debrief': 'race_engineer',
  'trigger_dnf_sponsor_damage_control': 'sponsor',
  'trigger_new_sponsor_launch': 'sponsor',
  'trigger_sponsor_warning_meeting': 'sponsor',
  'trigger_sponsor_anniversary': 'sponsor',
  'trigger_board_warning_presentation': 'board',
  'trigger_staff_morale_crisis': 'staff_hr',
  'trigger_new_staff_onboarding': 'staff_hr',
  'trigger_facility_showcase': 'media_pr',
  'trigger_preseason_testing': 'technical',
  'trigger_preseason_sponsor_launch': 'media_pr',
  'trigger_midseason_review': 'board',
  'trigger_season_end_awards': 'media_pr',
  'trigger_media_interview_request': 'media_pr',
  'trigger_charity_invitation': 'friend',
  'trigger_crisis_pr': 'media_pr',
  'trigger_sponsor_opportunity': 'sponsor',
  
  // Personal life events
  'date_reminder': 'partner',
  'child_milestone': 'family_child',
  'hobby_reminder': 'hobby_instructor',
  'health_checkup': 'personal_doctor',
  'exercise_reminder': 'personal_trainer',
  'social_invitation': 'friend',
  'scheduling_tip': 'personal_assistant',
  'foundation_update': 'charity_foundation',
  'gala_invitation': 'social_event_host',
  
  // Team passive events
  'manufacturing_complete': 'manufacturing',
  'parts_delivered': 'supply_chain',
  'facility_upgrade_complete': 'facility',
  'rnd_milestone': 'technical',
  'staff_training_complete': 'staff_hr',
  'financial_report': 'finances',
  'sponsor_payment': 'finances',
  'logistics_update': 'logistics',
  'contract_update': 'legal',
}

// ============================================
// HELPER: Get sender key for an activity
// ============================================

/**
 * Given an activity templateId or event type, returns the sender registry key.
 */
export function getSenderKeyForActivity(activityId: string): string {
  return ACTIVITY_TO_SENDER[activityId] ?? 'team_manager'
}

/**
 * Get the sender config for a notification category.
 */
export function getSenderConfig(category: string): NotificationSender | undefined {
  return NOTIFICATION_SENDERS[category]
}
