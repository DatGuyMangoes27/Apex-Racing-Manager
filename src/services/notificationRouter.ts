// ============================================
// NOTIFICATION ROUTING SERVICE
// ============================================
// Central service that routes all notifications through the right channel:
// - Personal stuff -> Phone text messages from contacts
// - Team/business stuff -> Email from named staff with role titles
//
// Quality tiers:
// - full: Sender exists -> detailed, timely, actionable
// - degraded: No specific person -> vague, delayed, generic department
// - missed: Nobody to send it -> notification never arrives

import { useCareerStore, type Email, type EmailCategory } from '@/store/careerStore'
import {
  NOTIFICATION_SENDERS,
  ACTIVITY_TO_SENDER,
  type NotificationSender,
  type ResolvedSender,
  type NotificationQuality,
} from '@/data/notification-senders'
import type { Conversation } from '@/data/messaging-config'

// ============================================
// TYPES
// ============================================

export interface NotificationParams {
  /** Key into ACTIVITY_TO_SENDER or NOTIFICATION_SENDERS */
  category: string
  /** Email subject or message headline */
  subject: string
  /** Full notification body */
  body: string
  /** Shorter/vaguer version for degraded notifications */
  degradedBody?: string
  /** Email category for inbox filing */
  emailCategory?: EmailCategory
  /** Whether the notification has actions (accept/decline, navigate, etc.) */
  actionType?: Email['actionType']
  /** Linked data for actions */
  actionData?: Record<string, unknown>
  /** Urgency level */
  urgency?: 'low' | 'normal' | 'high'
  /** Delay in days for degraded delivery (default: 1-2) */
  degradedDelay?: number
}

export interface NotificationResult {
  /** Whether the notification was delivered */
  delivered: boolean
  /** Quality of delivery */
  quality: NotificationQuality
  /** Channel used */
  channel: 'phone' | 'email' | null
  /** Name of resolved sender (if any) */
  senderName: string | null
  /** Reason if not delivered */
  reason?: string
}

// ============================================
// SENDER RESOLUTION
// ============================================

/**
 * Resolves a dynamic sender name from the current game state.
 * Looks up actual staff members, partner, personal staff, etc.
 */
function resolveSender(senderConfig: NotificationSender): ResolvedSender {
  const state = useCareerStore.getState()
  const { careerState } = state
  
  if (!careerState) {
    return {
      name: senderConfig.fallbackDepartment || senderConfig.role,
      role: senderConfig.role,
      channel: senderConfig.channel,
      quality: 'missed'
    }
  }
  
  // ---- TEAM STAFF (Email channel) ----
  if (senderConfig.channel === 'email' && senderConfig.staffRoleKey) {
    const resolvedStaff = findTeamStaffByRole(senderConfig.staffRoleKey, careerState)
    
    if (resolvedStaff) {
      return {
        name: resolvedStaff.name,
        role: senderConfig.role,
        channel: 'email',
        quality: 'full',
        portraitId: resolvedStaff.portraitId
      }
    }
    
    // No staff for this role -> degraded email from department
    if (!senderConfig.requiresSender) {
      return {
        name: senderConfig.fallbackDepartment || senderConfig.role,
        role: senderConfig.role,
        channel: 'email',
        quality: 'degraded'
      }
    }
    
    // Required but missing -> missed
    return {
      name: senderConfig.role,
      role: senderConfig.role,
      channel: 'email',
      quality: 'missed'
    }
  }
  
  // ---- PERSONAL CONTACTS (Phone channel) ----
  if (senderConfig.channel === 'phone' && senderConfig.personalLifeField) {
    const resolvedContact = findPersonalContact(senderConfig.personalLifeField, careerState)
    
    if (resolvedContact) {
      return {
        name: resolvedContact.name,
        role: senderConfig.role,
        channel: 'phone',
        quality: 'full',
        contactId: resolvedContact.id,
        portraitId: resolvedContact.portraitId,
        contactType: senderConfig.contactType
      }
    }
    
    // Phone messages REQUIRE a contact to exist
    return {
      name: senderConfig.role,
      role: senderConfig.role,
      channel: 'phone',
      quality: 'missed'
    }
  }
  
  // Fallback
  return {
    name: senderConfig.name === 'dynamic' ? senderConfig.role : senderConfig.name,
    role: senderConfig.role,
    channel: senderConfig.channel,
    quality: senderConfig.requiresSender ? 'missed' : 'degraded'
  }
}

/**
 * Find a team staff member by their role key.
 * Searches ownedTeam.staff and ownedTeam.facilityStaff.
 */
function findTeamStaffByRole(
  roleKey: string,
  careerState: NonNullable<ReturnType<typeof useCareerStore.getState>['careerState']>
): { name: string; id: string; portraitId?: string } | null {
  const ownedTeam = careerState.ownedTeam
  if (!ownedTeam) return null
  
  // Search main staff roster
  const staff = ownedTeam.staff ?? []
  const facilityStaff = ownedTeam.facilityStaff ?? []
  
  // Try to match by role (flexible matching)
  const roleMatches: Record<string, string[]> = {
    'manufacturing_head': ['manufacturing', 'production', 'factory'],
    'facilities_manager': ['facilities', 'operations'],
    'finance_director': ['finance', 'cfo', 'accounting'],
    'sponsorship_manager': ['sponsorship', 'commercial', 'partnerships'],
    'hr_director': ['hr', 'human_resources', 'personnel'],
    'technical_director': ['technical', 'engineering', 'chief_engineer', 'td'],
    'pr_manager': ['pr', 'media', 'communications', 'press'],
    'board_chairman': ['chairman', 'board', 'director'],
    'logistics_coordinator': ['logistics', 'transport', 'operations'],
    'legal_counsel': ['legal', 'counsel', 'compliance'],
    'supply_chain': ['supply', 'procurement', 'purchasing'],
    'race_engineer': ['race_engineer', 'engineer', 'performance'],
    'team_manager': ['team_manager', 'manager', 'principal'],
  }
  
  const searchTerms = roleMatches[roleKey] ?? [roleKey]
  
  // Search all staff
  const allStaff = [...staff, ...facilityStaff]
  for (const member of allStaff) {
    const memberRole = ((member as unknown as Record<string, unknown>).role as string || '').toLowerCase()
    const memberSpecialty = ((member as unknown as Record<string, unknown>).specialty as string || '').toLowerCase()
    
    for (const term of searchTerms) {
      if (memberRole.includes(term) || memberSpecialty.includes(term)) {
        const name = ((member as unknown as Record<string, unknown>).name as string) || senderConfig_fallbackName(roleKey)
        const id = ((member as unknown as Record<string, unknown>).id as string) || roleKey
        return { name, id }
      }
    }
  }
  
  return null
}

/** Generate a plausible fallback name for a role */
function senderConfig_fallbackName(roleKey: string): string {
  const names: Record<string, string> = {
    'manufacturing_head': 'Manufacturing Lead',
    'facilities_manager': 'Facilities Lead',
    'finance_director': 'Finance Lead',
    'technical_director': 'Chief Engineer',
    'team_manager': 'Team Manager',
  }
  return names[roleKey] ?? 'Team Staff'
}

/**
 * Find a personal contact (partner, child, friend, personal staff, etc.)
 */
function findPersonalContact(
  fieldPath: string,
  careerState: NonNullable<ReturnType<typeof useCareerStore.getState>['careerState']>
): { name: string; id: string; portraitId?: string } | null {
  const personalLife = careerState.personalLife
  const messaging = careerState.messaging
  
  switch (fieldPath) {
    case 'partner': {
      const partner = personalLife?.partner
      if (partner && partner.firstName) {
        const fullName = `${partner.firstName} ${partner.lastName || ''}`.trim()
        return { name: fullName, id: `partner_${partner.id || fullName}` }
      }
      return null
    }
    
    case 'children': {
      const children = personalLife?.children ?? []
      if (children.length > 0) {
        const child = children[0] as unknown as Record<string, unknown>
        return { 
          name: (child.firstName as string) || 'Your Child', 
          id: (child.id as string) || 'child_0' 
        }
      }
      return null
    }
    
    case 'family': {
      // Check messaging contacts for family type
      if (messaging?.contacts) {
        const familyContact = (messaging.contacts as unknown as Array<Record<string, unknown>>).find(
          c => c.type === 'family'
        )
        if (familyContact) {
          return { 
            name: familyContact.name as string, 
            id: familyContact.id as string 
          }
        }
      }
      return null
    }
    
    case 'friends': {
      if (messaging?.contacts) {
        const friendContact = (messaging.contacts as unknown as Array<Record<string, unknown>>).find(
          c => c.type === 'social' || c.type === 'friend'
        )
        if (friendContact) {
          return { 
            name: friendContact.name as string, 
            id: friendContact.id as string 
          }
        }
      }
      return null
    }
    
    case 'personalStaff.trainer':
    case 'personalStaff.doctor':
    case 'personalStaff.assistant':
    case 'personalStaff.instructor': {
      const staffType = fieldPath.split('.')[1]
      const personalStaff = personalLife?.staff ?? []
      const found = (personalStaff as unknown as Array<Record<string, unknown>>).find(
        s => (s.role as string || '').toLowerCase().includes(staffType)
      )
      if (found) {
        return { 
          name: found.name as string, 
          id: found.id as string 
        }
      }
      return null
    }
    
    case 'foundation': {
      const foundations = personalLife?.foundations ?? []
      if (foundations.length > 0) {
        const f = foundations[0] as unknown as Record<string, unknown>
        return { 
          name: (f.name as string) || 'Foundation',
          id: (f.id as string) || 'foundation_0'
        }
      }
      return null
    }
    
    case 'socialContacts': {
      if (messaging?.contacts) {
        const social = messaging.contacts.find(
          c => c.type === 'friend' || c.type === 'business'
        )
        if (social) {
          return { 
            name: social.name, 
            id: social.id 
          }
        }
      }
      return null
    }
    
    default:
      return null
  }
}

// ============================================
// MAIN ROUTING FUNCTION
// ============================================

/**
 * Route a notification through the appropriate channel.
 * This is the main entry point for all notifications in the game.
 */
export function routeNotification(params: NotificationParams): NotificationResult {
  const { category, subject, body, degradedBody, emailCategory, actionType } = params
  
  // Look up the sender key for this category
  const senderKey = ACTIVITY_TO_SENDER[category] ?? category
  const senderConfig = NOTIFICATION_SENDERS[senderKey]
  
  if (!senderConfig) {
    // Unknown category - send as generic team email
    return sendAsEmail({
      subject,
      body,
      sender: 'Team HQ',
      senderRole: 'Team Management',
      emailCategory: emailCategory ?? 'team',
      actionType,
      quality: 'degraded'
    })
  }
  
  // Resolve the actual sender from game state
  const resolved = resolveSender(senderConfig)
  
  // Handle missed notifications
  if (resolved.quality === 'missed') {
    console.log(`[NotificationRouter] MISSED: "${subject}" - no sender for category "${category}" (${senderConfig.role})`)
    return {
      delivered: false,
      quality: 'missed',
      channel: null,
      senderName: null,
      reason: `No ${senderConfig.role} available to send this notification`
    }
  }
  
  // Route based on channel
  if (resolved.channel === 'email') {
    return sendAsEmail({
      subject: resolved.quality === 'degraded' ? `[Delayed] ${subject}` : subject,
      body: resolved.quality === 'degraded' ? (degradedBody || createDegradedBody(body, senderConfig.role)) : body,
      sender: resolved.name,
      senderRole: resolved.role,
      emailCategory: emailCategory ?? mapToEmailCategory(senderKey),
      actionType: resolved.quality === 'full' ? actionType : undefined, // No actions on degraded
      quality: resolved.quality
    })
  }
  
  if (resolved.channel === 'phone') {
    return sendAsPhoneMessage({
      contactId: resolved.contactId!,
      contactName: resolved.name,
      message: body,
      contactType: resolved.contactType
    })
  }
  
  return {
    delivered: false,
    quality: 'missed',
    channel: null,
    senderName: null,
    reason: 'Unknown channel'
  }
}

// ============================================
// CHANNEL DELIVERY FUNCTIONS
// ============================================

function sendAsEmail(params: {
  subject: string
  body: string
  sender: string
  senderRole: string
  emailCategory: EmailCategory
  actionType?: Email['actionType']
  quality: NotificationQuality
}): NotificationResult {
  const state = useCareerStore.getState()
  const { careerState } = state
  
  if (!careerState) {
    return { delivered: false, quality: 'missed', channel: null, senderName: null, reason: 'No career state' }
  }
  
  const currentDay = careerState.currentDay ?? 1
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear
  
  // For degraded emails, delay by 1-2 days
  const deliveryDay = params.quality === 'degraded' 
    ? Math.min(7, currentDay + 1 + Math.floor(Math.random() * 2))
    : currentDay
  const deliveryWeek = deliveryDay > 7 ? currentWeek + 1 : currentWeek
  
  const emailData: Omit<Email, 'id'> = {
    category: params.emailCategory,
    subject: params.subject,
    sender: params.sender,
    senderRole: params.senderRole,
    preview: params.body.substring(0, 100),
    body: params.quality === 'degraded' 
      ? params.body + `\n\n---\nNote: This update was delayed. Consider hiring a dedicated ${params.senderRole} for faster, more detailed updates.`
      : params.body,
    receivedDay: deliveryDay > 7 ? deliveryDay - 7 : deliveryDay,
    receivedWeek: deliveryWeek,
    receivedYear: currentYear,
    read: false,
    starred: false,
    archived: false,
    actionType: params.actionType,
  }
  
  // Use the store's addEmail action
  state.addEmail(emailData)
  
  console.log(`[NotificationRouter] EMAIL (${params.quality}): "${params.subject}" from ${params.sender}, ${params.senderRole}`)
  
  return {
    delivered: true,
    quality: params.quality,
    channel: 'email',
    senderName: params.sender
  }
}

function sendAsPhoneMessage(params: {
  contactId: string
  contactName: string
  message: string
  contactType?: string
}): NotificationResult {
  const state = useCareerStore.getState()
  const { careerState } = state
  
  if (!careerState) {
    return { delivered: false, quality: 'missed', channel: null, senderName: null, reason: 'No career state' }
  }
  
  // Find or reference the conversation with this contact
  const messaging = careerState.messaging
  if (!messaging) {
    console.log(`[NotificationRouter] PHONE: No messaging state - cannot deliver to ${params.contactName}`)
    return { delivered: false, quality: 'missed', channel: 'phone', senderName: params.contactName, reason: 'No messaging state' }
  }
  
  // Find existing conversation
  // conversations is Record<string, Conversation>, convert to array for searching
  const conversationsDict = messaging.conversations ?? {}
  const conversationsArray = Object.values(conversationsDict) as Conversation[]
  let conversation = conversationsArray.find(
    c => c.contactId === params.contactId
  )
  
  const currentDay = careerState.currentDay ?? 1
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear
  
  // Create the text message
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversationId: conversation ? (conversation.id as string) : `conv_${params.contactId}`,
    sender: 'npc' as const,
    content: params.message,
    tone: 'friendly' as const,
    timestamp: { week: currentWeek, day: currentDay, hour: 10, year: currentYear },
    isRead: false
  }
  
  if (conversation) {
    // Add message to existing conversation
    const messages = conversation.messages ?? []
    const updatedConversation = {
      ...conversation,
      messages: [newMessage, ...messages],
      lastMessageTime: { week: currentWeek, day: currentDay, year: currentYear },
      unreadCount: (conversation.unreadCount || 0) + 1
    }
    
    // Update the conversations Record
    const updatedConversations = {
      ...conversationsDict,
      [conversation.id]: updatedConversation
    }
    
    state.updateCareerState({
      messaging: {
        ...messaging,
        conversations: updatedConversations
      }
    })
  } else {
    // Create a new conversation
    const newConversation: Conversation = {
      id: `conv_${params.contactId}`,
      contactId: params.contactId,
      contactName: params.contactName,
      contactType: (params.contactType === 'partner' ? 'romantic' : params.contactType === 'family' ? 'family' : 'social') as Conversation['contactType'],
      isActive: true,
      lastMessageTime: { week: currentWeek, day: currentDay, year: currentYear },
      unreadCount: 1,
      messages: [newMessage],
      relationshipLevel: 50,
      currentMood: {
        overall: 'neutral',
        energy: 'medium',
        receptiveness: 70,
        recentEvents: []
      },
      awaitingResponse: false,
      conversationStage: 'new'
    }
    
    state.updateCareerState({
      messaging: {
        ...messaging,
        conversations: {
          ...conversationsDict,
          [newConversation.id]: newConversation
        }
      }
    })
  }
  
  console.log(`[NotificationRouter] PHONE (full): "${params.message.substring(0, 50)}..." from ${params.contactName}`)
  
  return {
    delivered: true,
    quality: 'full',
    channel: 'phone',
    senderName: params.contactName
  }
}

// ============================================
// HELPERS
// ============================================

/** Map sender category to email category */
function mapToEmailCategory(senderKey: string): EmailCategory {
  const mapping: Record<string, EmailCategory> = {
    'manufacturing': 'team',
    'facility': 'team',
    'finances': 'team',
    'sponsor': 'sponsor',
    'staff_hr': 'team',
    'technical': 'team',
    'media_pr': 'media',
    'board': 'board',
    'logistics': 'team',
    'legal': 'contract',
    'supply_chain': 'team',
    'race_engineer': 'team',
    'team_manager': 'team',
  }
  return mapping[senderKey] ?? 'team'
}

/** Create a vaguer version of the notification body for degraded delivery */
function createDegradedBody(originalBody: string, missingRole: string): string {
  // Truncate and make vaguer
  const shortened = originalBody.split('.').slice(0, 2).join('.') + '.'
  return `${shortened}\n\n(This update lacks specific details because there is no dedicated ${missingRole} on staff.)`
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Send a team notification (auto-routes to email from the right staff member).
 */
export function notifyTeam(
  activityId: string,
  subject: string,
  body: string,
  options?: Partial<NotificationParams>
): NotificationResult {
  return routeNotification({
    category: activityId,
    subject,
    body,
    emailCategory: 'team',
    ...options
  })
}

/**
 * Send a personal notification (auto-routes to phone from the right contact).
 */
export function notifyPersonal(
  category: string,
  message: string,
  options?: Partial<NotificationParams>
): NotificationResult {
  return routeNotification({
    category,
    subject: message.substring(0, 50),
    body: message,
    ...options
  })
}

/**
 * Check if a notification would be delivered (without actually sending it).
 * Useful for UI - show "you'd miss this without a PR Manager" hints.
 */
export function wouldNotificationDeliver(category: string): {
  wouldDeliver: boolean
  quality: NotificationQuality
  missingRole?: string
} {
  const senderKey = ACTIVITY_TO_SENDER[category] ?? category
  const senderConfig = NOTIFICATION_SENDERS[senderKey]
  
  if (!senderConfig) {
    return { wouldDeliver: true, quality: 'degraded' }
  }
  
  const resolved = resolveSender(senderConfig)
  
  return {
    wouldDeliver: resolved.quality !== 'missed',
    quality: resolved.quality,
    missingRole: resolved.quality !== 'full' ? senderConfig.role : undefined
  }
}
