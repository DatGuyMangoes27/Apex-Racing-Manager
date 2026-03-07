/**
 * Email Generation Utilities
 * 
 * Converts various game events into email messages for the inbox system.
 * Uses AI for dynamic generation when available, with template fallback.
 */

import { Email, EmailCategory, BoardTarget, CareerState, TeamSponsorDeal } from '@/store/careerStore'
import { getStaffNameOrFallback } from '@/services/eventContentGenerator'
import { SponsorDeal } from '@/simulation/finances'
import { generateScheduleSuggestions, generateSuggestions, type ScheduleSuggestion } from '@/simulation/activities/suggestionEngine'
import { getWeek1Length } from '@/utils/calendar'
import { InvitationalEvent } from '@/data/invitational-events'
import { getSponsorById } from '@/services/preGeneratedContentService'
import {
  isAIEmailAvailable,
  generateSponsorEmail as aiGenerateSponsorEmail,
  generateInvitationEmail as aiGenerateInvitationEmail,
  generateBoardEmail as aiGenerateBoardEmail,
  generateWelcomeEmail as aiGenerateWelcomeEmail,
  generateWeeklySummaryEmail as aiGenerateWeeklySummaryEmail,
  SponsorEmailContext,
  InvitationEmailContext,
  BoardEmailContext,
  EmailGenerationContext,
  GeneratedEmailContent
} from '@/services/emailAI'

// Generate sponsor names for communications
const SPONSOR_REPRESENTATIVES = [
  'James Mitchell', 'Sarah Chen', 'Michael Torres', 'Emma Williams',
  'David Kim', 'Lisa Anderson', 'Robert Martinez', 'Jennifer Taylor'
]

function getRandomRepName(): string {
  return SPONSOR_REPRESENTATIVES[Math.floor(Math.random() * SPONSOR_REPRESENTATIVES.length)]
}

/**
 * Helper to create base email context
 */
function createBaseContext(careerState: CareerState, teamName?: string): EmailGenerationContext {
  return {
    category: 'system',
    playerName: '', // Can be populated if available
    teamName: teamName || careerState.ownedTeam?.name || 'Your Team',
    currentWeek: careerState.currentWeek,
    currentYear: careerState.currentYear,
    boardMood: careerState.ownedTeam?.boardMood,
    cash: careerState.ownedTeam?.budgets?.cash
  }
}

/**
 * Generate an email for a new sponsor offer
 * Tries AI generation first, falls back to template
 */
export async function generateSponsorOfferEmailAsync(
  sponsor: SponsorDeal,
  careerState: CareerState
): Promise<Omit<Email, 'id'>> {
  // Try AI generation if available
  if (isAIEmailAvailable()) {
    try {
      const context: SponsorEmailContext = {
        ...createBaseContext(careerState),
        category: 'sponsor',
        sponsor,
        emailType: 'offer'
      }
      
      const aiContent = await aiGenerateSponsorEmail(context)
      if (aiContent) {
        return {
          category: 'sponsor' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: careerState.currentDay ?? 1,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: false,
          archived: false,
          requiresAction: true,
          interruptClass: 'critical',
          actionType: 'accept_decline',
          actionData: { sponsorId: sponsor.id, type: 'sponsor_offer' },
          expiresWeek: careerState.currentWeek + 4
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  // Fallback to template
  return generateSponsorOfferEmail(sponsor, careerState)
}

/**
 * Template-based sponsor offer email (synchronous fallback)
 */
export function generateSponsorOfferEmail(
  sponsor: SponsorDeal,
  careerState: CareerState
): Omit<Email, 'id'> {
  const repName = getRandomRepName()
  // Look up sponsor tier from pre-generated sponsor pool
  const sponsorData = getSponsorById(sponsor.sponsorId)
  const sponsorTier = sponsorData?.tier || 'mid'
  // Convert duration from seasons to approximate months (1 season ≈ 6 months)
  const durationMonths = sponsor.duration * 6
  
  return {
    category: 'sponsor' as EmailCategory,
    subject: `Sponsorship Opportunity: ${sponsor.sponsorName}`,
    sender: repName,
    senderRole: `Marketing Director, ${sponsor.sponsorName}`,
    preview: `We're interested in sponsoring your racing career with a ${sponsorTier} tier partnership...`,
    body: `Dear Team Principal,

I hope this message finds you well. I'm reaching out on behalf of ${sponsor.sponsorName} regarding a potential sponsorship partnership.

We've been following your team's progress with great interest and believe there's an excellent opportunity for mutual benefit. We're prepared to offer:

• Monthly Payment: $${sponsor.monthlyPayment.toLocaleString()}
• Win Bonus: $${sponsor.bonusPerWin.toLocaleString()}
• Podium Bonus: $${sponsor.bonusPerPodium.toLocaleString()}
• Contract Duration: ${durationMonths} months

This ${sponsorTier} tier partnership would include prominent branding placement and joint marketing activities.

Please review the attached terms and let us know if you'd like to discuss further. This offer is valid for a limited time.

Best regards,
${repName}
Marketing Director
${sponsor.sponsorName}`,
    receivedDay: careerState.currentDay ?? 1,
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: false,
    archived: false,
    requiresAction: true,
    interruptClass: 'critical',
    actionType: 'accept_decline',
    actionData: { sponsorId: sponsor.id, type: 'sponsor_offer' },
    expiresWeek: careerState.currentWeek + 4
  }
}

/**
 * Generate an email for a sponsor warning (low satisfaction)
 * Tries AI generation first, falls back to template
 */
export async function generateSponsorWarningEmailAsync(
  sponsor: SponsorDeal,
  careerState: CareerState
): Promise<Omit<Email, 'id'>> {
  if (isAIEmailAvailable()) {
    try {
      const context: SponsorEmailContext = {
        ...createBaseContext(careerState),
        category: 'sponsor',
        sponsor,
        emailType: 'warning'
      }
      
      const aiContent = await aiGenerateSponsorEmail(context)
      if (aiContent) {
        return {
          category: 'sponsor' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: careerState.currentDay ?? 1,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: false,
          archived: false,
          actionType: 'acknowledge'
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  return generateSponsorWarningEmail(sponsor, careerState)
}

/**
 * Template-based sponsor warning email (synchronous fallback)
 */
export function generateSponsorWarningEmail(
  sponsor: SponsorDeal,
  careerState: CareerState
): Omit<Email, 'id'> {
  const repName = getRandomRepName()
  const satisfaction = sponsor.satisfaction ?? 50
  
  return {
    category: 'sponsor' as EmailCategory,
    subject: `Performance Concerns - ${sponsor.sponsorName}`,
    sender: repName,
    senderRole: `Account Manager, ${sponsor.sponsorName}`,
    preview: `We need to discuss recent performance metrics. Our satisfaction has dropped to ${satisfaction}%...`,
    body: `Dear Team Principal,

I'm writing to express some concerns regarding our sponsorship agreement with your team.

Our current satisfaction level has dropped to ${satisfaction}%, which is below our expectations for this partnership. While we value our relationship and want it to succeed, we need to see improvement in the following areas:

${sponsor.targets?.map(t => `• ${t.type}: Target ${t.targetValue}, Current ${t.currentProgress}`).join('\n') || '• Overall performance improvement needed'}

We remain committed to this partnership but will be monitoring progress closely. Please don't hesitate to reach out if you'd like to discuss strategies for improvement.

Best regards,
${repName}
Account Manager
${sponsor.sponsorName}`,
    receivedDay: careerState.currentDay ?? 1,
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: false,
    archived: false,
    actionType: 'acknowledge'
  }
}

/**
 * Generate an email for a race invitation
 * Tries AI generation first, falls back to template
 */
export async function generateInvitationEmailAsync(
  invitation: InvitationalEvent,
  careerState: CareerState
): Promise<Omit<Email, 'id'>> {
  if (isAIEmailAvailable()) {
    try {
      const context: InvitationEmailContext = {
        ...createBaseContext(careerState),
        category: 'invitation',
        invitation
      }
      
      const aiContent = await aiGenerateInvitationEmail(context)
      if (aiContent) {
        return {
          category: 'invitation' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: careerState.currentDay ?? 1,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: false,
          archived: false,
          actionType: 'accept_decline',
          actionData: { invitationId: invitation.instanceId, type: 'invitation' },
          expiresWeek: invitation.expiresWeek
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  return generateInvitationEmail(invitation, careerState)
}

/**
 * Template-based invitation email (synchronous fallback)
 */
export function generateInvitationEmail(
  invitation: InvitationalEvent,
  careerState: CareerState
): Omit<Email, 'id'> {
  return {
    category: 'invitation' as EmailCategory,
    subject: `Race Invitation: ${invitation.name}`,
    sender: invitation.organizerName,
    senderRole: 'Event Organizer',
    preview: `You've been invited to participate in the ${invitation.name} at ${invitation.trackName}...`,
    body: `Dear Team Principal,

We are delighted to extend an invitation to your team to participate in the ${invitation.name}.

Event Details:
• Track: ${invitation.trackName}
• Week: ${invitation.week}
• Class: ${invitation.carClassName}
• Prestige: ${invitation.prestige} points

${invitation.assignedCar ? `
Your Assigned Drive:
#${invitation.assignedCar.liveryNumber} ${invitation.assignedCar.name}
${invitation.assignedCar.liveryName}
` : ''}

Rewards:
• Prize Pool: $${invitation.rewards.prize.toLocaleString()}
• Reputation Bonus: +${invitation.rewards.reputationBonus}

${invitation.description}

Please respond by Week ${invitation.expiresWeek} to secure your entry.

We look forward to seeing you on the grid!

Best regards,
${invitation.organizerName}`,
    receivedDay: careerState.currentDay ?? 1,
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: false,
    archived: false,
    actionType: 'accept_decline',
    actionData: { invitationId: invitation.instanceId, type: 'invitation' },
    expiresWeek: invitation.expiresWeek
  }
}

/**
 * Generate an email for board target warnings
 * Tries AI generation first, falls back to template
 */
export async function generateBoardWarningEmailAsync(
  target: BoardTarget,
  warningLevel: 'concern' | 'warning' | 'critical',
  careerState: CareerState
): Promise<Omit<Email, 'id'>> {
  if (isAIEmailAvailable()) {
    try {
      const context: BoardEmailContext = {
        ...createBaseContext(careerState),
        category: 'board',
        targetDescription: target.description,
        targetProgress: target.currentProgress,
        targetValue: target.targetValue,
        severity: target.severity === 'expected' ? 'recommended' : target.severity === 'bonus' ? 'recommended' : target.severity,
        warningLevel
      }
      
      const aiContent = await aiGenerateBoardEmail(context)
      if (aiContent) {
        return {
          category: 'board' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: careerState.currentDay ?? 1,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: warningLevel === 'critical',
          archived: false,
          actionType: 'acknowledge'
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  return generateBoardWarningEmail(target, warningLevel, careerState)
}

/**
 * Template-based board warning email (synchronous fallback)
 */
export function generateBoardWarningEmail(
  target: BoardTarget,
  warningLevel: 'concern' | 'warning' | 'critical',
  careerState: CareerState
): Omit<Email, 'id'> {
  const titles = {
    concern: 'Board Concern',
    warning: 'Board Warning',
    critical: 'URGENT: Board Review Required'
  }
  
  const tones = {
    concern: 'The board has noted some areas requiring attention',
    warning: 'The board is increasingly concerned about recent performance',
    critical: 'The board requires an immediate explanation for the current situation'
  }
  
  return {
    category: 'board' as EmailCategory,
    subject: `${titles[warningLevel]}: ${target.description}`,
    sender: 'Board of Directors',
    senderRole: 'Team Ownership',
    preview: `${tones[warningLevel]}. Target progress: ${target.currentProgress}/${target.targetValue}...`,
    body: `To the Team Principal,

${tones[warningLevel]}.

Target: ${target.description}
Current Progress: ${target.currentProgress}/${target.targetValue}
Severity: ${target.severity.toUpperCase()}

${warningLevel === 'critical' 
  ? 'Failure to address this matter may result in serious consequences for team leadership. We expect a detailed action plan within the week.'
  : 'We trust you will take the necessary steps to address this matter. Please keep the board informed of your progress.'}

The Board of Directors`,
    receivedDay: careerState.currentDay ?? 1,
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: warningLevel === 'critical',
    archived: false,
    actionType: 'acknowledge'
  }
}

/**
 * Generate a welcome email for new team creation
 * Tries AI generation first, falls back to template
 */
export async function generateWelcomeEmailAsync(
  teamName: string,
  careerState: CareerState
): Promise<Omit<Email, 'id'>> {
  if (isAIEmailAvailable()) {
    try {
      const context = createBaseContext(careerState, teamName)
      
      const aiContent = await aiGenerateWelcomeEmail(teamName, context)
      if (aiContent) {
        return {
          category: 'system' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: careerState.currentDay ?? 1,
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: true,
          archived: false,
          actionType: 'acknowledge'
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  return generateWelcomeEmail(teamName, careerState)
}

/**
 * Template-based welcome email (synchronous fallback)
 */
export function generateWelcomeEmail(
  teamName: string,
  careerState: CareerState
): Omit<Email, 'id'> {
  const cash = careerState.ownedTeam?.budgets?.cash ?? 0
  return {
    category: 'system' as EmailCategory,
    subject: `Welcome to ${teamName} — Your First Week Action Plan`,
    sender: 'Race Series Administration',
    senderRole: 'Series Officials',
    preview: `Congratulations on establishing ${teamName}! Here's exactly what you need to do in your first week...`,
    body: `Dear Team Principal,

Congratulations on the official registration of ${teamName}! You are now recognized as a competitor.

YOUR FIRST WEEK — ACTION PLAN:

Here's what you need to do to get your team race-ready. We recommend tackling these roughly in order:

1. BUY A CAR — Visit the Marketplace and purchase a car. Budget: $${(cash / 1000).toFixed(0)}k available. This is your #1 priority.

2. HIRE KEY STAFF — Go to the Staff Market and recruit at minimum a Chief Engineer. They'll handle your car setup and engineering. A Strategist is your next key hire.

3. ENTER A RACING SERIES — Browse available championships in Series Entry. Match the series to your car type and budget. Pay the entry fee to register.

4. ASSIGN A DRIVER — In the Garage, assign yourself or a hired driver to your car. No driver = no racing.

5. FIND SPONSORS — Check the Sponsor Market for deals. Sponsors provide regular income to keep the lights on.

DON'T WORRY — over the coming days, your team staff will send you detailed guidance on each of these topics and every other aspect of running a racing team.

COMMUNICATION:
• Business matters arrive in your EMAIL INBOX (check the sidebar)
• Personal matters arrive on your PHONE (also in the sidebar)
• Read and respond promptly — some offers expire!

Good luck out there. The racing world awaits.

Race Series Administration`,
    receivedDay: careerState.currentDay ?? 1,
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: true,
    archived: false,
    actionType: 'acknowledge'
  }
}

/**
 * Generate a weekly team summary email
 * Tries AI generation first, falls back to template
 */
export async function generateWeeklySummaryEmailAsync(
  careerState: CareerState,
  cash: number,
  boardMood: number,
  upcomingRaceWeek?: number
): Promise<Omit<Email, 'id'>> {
  const isRaceWeek = upcomingRaceWeek === careerState.currentWeek
  
  if (isAIEmailAvailable()) {
    try {
      const context: EmailGenerationContext = {
        ...createBaseContext(careerState),
        category: 'team',
        cash,
        boardMood
      }
      
      const aiContent = await aiGenerateWeeklySummaryEmail(context, isRaceWeek)
      if (aiContent) {
        return {
          category: 'team' as EmailCategory,
          subject: aiContent.subject,
          sender: aiContent.sender,
          senderRole: aiContent.senderRole,
          preview: aiContent.preview,
          body: aiContent.body,
          receivedDay: 1, // Always Monday
          receivedWeek: careerState.currentWeek,
          receivedYear: careerState.currentYear,
          read: false,
          starred: false,
          archived: false
        }
      }
    } catch (e) {
      console.warn('[EmailGeneration] AI generation failed, using template:', e)
    }
  }
  
  return generateWeeklySummaryEmail(careerState, cash, boardMood, upcomingRaceWeek)
}

/**
 * Template-based weekly summary email (synchronous fallback)
 */
export function generateWeeklySummaryEmail(
  careerState: CareerState,
  cash: number,
  boardMood: number,
  upcomingRaceWeek?: number
): Omit<Email, 'id'> {
  const isRaceWeek = upcomingRaceWeek === careerState.currentWeek
  
  return {
    category: 'team' as EmailCategory,
    subject: `Weekly Report - Week ${careerState.currentWeek}`,
    sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
    senderRole: 'Internal Operations',
    preview: `Your weekly team status update. Cash: $${(cash / 1000).toFixed(0)}k, Board Mood: ${boardMood}%...`,
    body: `Team Principal,

Here is your weekly operations summary:

FINANCIAL STATUS
• Current Balance: $${cash.toLocaleString()}
• Board Mood: ${boardMood}%

${isRaceWeek 
  ? `RACE WEEK ALERT
This is a race week! Ensure all preparations are complete:
• Vehicle readiness check
• Staff briefings
• Strategy review`
  : `OPERATIONS
No immediate race this week. Consider:
• Development activities
• Sponsor meetings
• Staff evaluations`}

Reply if you need any clarification.

Your Team Manager`,
    receivedDay: 1, // Always Monday
    receivedWeek: careerState.currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: false,
    archived: false
  }
}

// ============================================
// PA WEEKLY PLANNING EMAIL
// ============================================

/**
 * Generate the PA weekly planning email.
 * 
 * Early game (weeks 1-12): Always generated (free onboarding assistant).
 * After week 12: Requires a PA on staff — degrades to just mandatory reminders without one.
 */
export function generateWeeklyPlanningEmail(
  careerState: CareerState,
  player: Record<string, unknown> | null
): Omit<Email, 'id'> | null {
  if (!careerState || !player) return null

  const currentWeek = careerState.currentWeek
  const personalLife = (careerState as Record<string, unknown>).personalLife as Record<string, unknown> | undefined
  const personalStaffArr = (personalLife?.staff ?? []) as Array<Record<string, unknown>>
  const paStaffMember = personalStaffArr.find(s => s.role === 'personal_assistant')
  
  // Julia Green is always present from career start — always full content
  const fullContent = true
  
  // Determine how many days are actually in this week
  // Week 1 is a partial week starting on Jan 1's day-of-week (e.g. Thu for 2026 = 4 days)
  const currentYear = careerState.currentYear ?? new Date().getFullYear()
  const week1Length = getWeek1Length(currentYear)
  const jan1DayOfWeek = 8 - week1Length // e.g. 4 days → Jan 1 is day 4 (Thursday)
  const isPartialWeek = currentWeek === 1 && jan1DayOfWeek > 1
  const daysInWeek = currentWeek === 1 ? week1Length : 7
  const weekStartDay = currentWeek === 1 ? jan1DayOfWeek : 1
  
  // Get mandatory activities for the week
  const mandatoryActivities = (careerState.scheduledActivities || []).filter(
    a => a.mandatory && a.scheduledWeek === currentWeek && a.status === 'scheduled'
  )
  
  // Get contextual suggestions (only for full content)
  const suggestions = fullContent ? generateSuggestions(careerState, player) : []
  const scheduleSuggestions = fullContent ? generateScheduleSuggestions(careerState, player) : []
  
  // Separate suggestions by category
  const highUrgency = suggestions.filter(s => s.urgency === 'high')
  const mediumUrgency = suggestions.filter(s => s.urgency === 'medium')
  const mediaSuggestions = suggestions.filter(s => s.category === 'media')
  const personalSuggestions = suggestions.filter(s => s.category === 'personal')
  
  // Build email body
  const lines: string[] = []
  
  const fullDayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  lines.push(`Good morning, Boss!`)
  lines.push(``)
  if (isPartialWeek) {
    lines.push(`Here's your planning overview for Week ${currentWeek}. Just a heads up — it's a short week! We start on ${fullDayNames[weekStartDay]} and have ${daysInWeek} day${daysInWeek > 1 ? 's' : ''} (${fullDayNames[weekStartDay]}–Sunday).`)
  } else {
    lines.push(`Here's your weekly planning overview for Week ${currentWeek}.`)
  }
  lines.push(``)
  
  // --- Must Do Section ---
  lines.push(`MUST DO THIS WEEK`)
  lines.push(`─────────────────`)
  if (mandatoryActivities.length > 0) {
    for (const act of mandatoryActivities) {
      const deadline = act.deadline ? ` (due Day ${act.deadline.day ?? act.deadline.week ?? '?'})` : ''
      lines.push(`• ${act.name} — ${act.duration}h${deadline}`)
    }
  } else {
    lines.push(`• No mandatory activities this week — you have a flexible schedule!`)
  }
  lines.push(``)
  
  if (fullContent) {
    // --- Recommended Section ---
    if (highUrgency.length > 0 || mediumUrgency.length > 0) {
      lines.push(`RECOMMENDED`)
      lines.push(`───────────`)
      for (const s of [...highUrgency, ...mediumUrgency].slice(0, 5)) {
        const urgencyTag = s.urgency === 'high' ? ' [URGENT]' : ''
        lines.push(`• ${s.text}${urgencyTag} — ${s.reason}`)
      }
      lines.push(``)
    }
    
    // --- Media & PR Section ---
    if (mediaSuggestions.length > 0) {
      lines.push(`MEDIA & PR`)
      lines.push(`──────────`)
      for (const s of mediaSuggestions.slice(0, 3)) {
        lines.push(`• ${s.text} — ${s.reason}`)
      }
      lines.push(``)
    }
    
    // --- Personal Touch Section ---
    if (personalSuggestions.length > 0) {
      lines.push(`PERSONAL LIFE`)
      lines.push(`─────────────`)
      for (const s of personalSuggestions.slice(0, 3)) {
        lines.push(`• ${s.text} — ${s.reason}`)
      }
      lines.push(``)
    }
    
    // --- Hours estimate ---
    const mandatoryHours = mandatoryActivities.reduce((sum, a) => sum + (a.duration || 2), 0)
    const suggestedHours = scheduleSuggestions.reduce((sum, s) => sum + s.hours, 0)
    const totalAvailableHours = 16 * daysInWeek
    const freeHours = Math.max(0, totalAvailableHours - mandatoryHours - suggestedHours)
    
    lines.push(`TIME BUDGET ESTIMATE`)
    lines.push(`────────────────────`)
    lines.push(`• Mandatory: ${mandatoryHours}h`)
    lines.push(`• Suggested: ${suggestedHours}h`)
    lines.push(`• Free time: ~${freeHours}h`)
    lines.push(``)
    // List out what auto-schedule will do so the player can make an informed choice
    if (scheduleSuggestions.length > 0) {
      lines.push(`IF YOU CLICK "AUTO-SCHEDULE", I'LL ADD:`)
      lines.push(`──────────────────────────────────`)
      const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      for (const s of scheduleSuggestions) {
        const dayLabel = dayNames[s.suggestedDay] || `Day ${s.suggestedDay}`
        lines.push(`• ${s.name} (${s.hours}h) — ${dayLabel} — ${s.reason}`)
      }
      lines.push(``)
      lines.push(`Click "Auto-Schedule" below to confirm, or head to the Calendar to plan manually.`)
    } else {
      lines.push(`No specific activities to suggest this week — your schedule looks good! Head to the Calendar if you want to plan anything manually.`)
    }
  }
  
  lines.push(``)
  lines.push(`Have a productive week!`)
  
  // Julia Green is the PA — use her name directly
  const senderName = (paStaffMember?.name as string) || 'Julia Green'
  
  const subject = `Weekly Planner — Week ${currentWeek}`
  
  return {
    category: 'system' as EmailCategory,
    subject,
    sender: senderName,
    senderRole: 'Personal Assistant',
    preview: mandatoryActivities.length > 0 
      ? `${mandatoryActivities.length} mandatory task${mandatoryActivities.length > 1 ? 's' : ''} this week. ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}.`
      : `No mandatory tasks this week. ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}.`,
    body: lines.join('\n'),
    receivedDay: weekStartDay,  // First day of the week (day 1 for full weeks, jan1DayOfWeek for Week 1)
    receivedWeek: currentWeek,
    receivedYear: careerState.currentYear,
    read: false,
    starred: true,  // PA emails are always starred for visibility
    archived: false,
    actionType: fullContent ? 'auto_schedule' : 'acknowledge',
    actionData: fullContent ? { suggestions: scheduleSuggestions } : undefined,
  }
}

// ============================================
// TEAM SPONSOR OFFER EMAIL (delayed delivery)
// ============================================

const SPONSOR_OFFER_SUBJECTS = [
  'Partnership Proposal',
  'Sponsorship Inquiry',
  'Business Opportunity',
  'Collaboration Proposal',
  'Branding Partnership Offer'
]

/**
 * Generate an email for a team sponsor offer that arrives after a media event.
 * The email directs the player to the Sponsor Market to review the pending offer.
 */
export function generateTeamSponsorOfferEmail(
  deal: TeamSponsorDeal,
  deliveryDay: number,
  deliveryWeek: number,
  deliveryYear: number
): Omit<Email, 'id'> {
  const repName = getRandomRepName()
  const sponsorData = getSponsorById(deal.sponsorId)
  const sponsorName = deal.sponsorName
  const slotLabel = deal.slot === 'title' ? 'Title Sponsor'
    : deal.slot === 'primary' ? 'Primary Sponsor'
    : deal.slot === 'secondary' ? 'Secondary Sponsor'
    : 'Associate Sponsor'
  const subjectPick = SPONSOR_OFFER_SUBJECTS[Math.floor(Math.random() * SPONSOR_OFFER_SUBJECTS.length)]
  const category = sponsorData?.category?.replace(/_/g, ' ') || 'industry'
  const tier = sponsorData?.tier || 'mid'

  return {
    category: 'sponsor' as EmailCategory,
    subject: `${subjectPick}: ${sponsorName}`,
    sender: repName,
    senderRole: `Business Development, ${sponsorName}`,
    preview: `Following our recent meeting, ${sponsorName} would like to propose a ${slotLabel.toLowerCase()} partnership...`,
    body: `Dear Team Principal,

It was a pleasure meeting your team at the recent event. I'm writing on behalf of ${sponsorName} to formally express our interest in a sponsorship partnership.

After seeing your operation firsthand and discussing with our ${category} marketing division, we believe there's a strong alignment between our brand and your racing programme.

We'd like to propose a ${slotLabel} arrangement with the following terms:

• Monthly Payment: $${deal.monthlyPayment.toLocaleString()}
• Win Bonus: $${deal.winBonus.toLocaleString()}
• Podium Bonus: $${deal.podiumBonus.toLocaleString()}${deal.championshipBonus > 0 ? `\n• Championship Bonus: $${deal.championshipBonus.toLocaleString()}` : ''}
• Contract Duration: ${deal.duration} year${deal.duration > 1 ? 's' : ''}

You can review the full offer details in the Sponsor Market. We look forward to your response.

Best regards,
${repName}
Business Development
${sponsorName}`,
    receivedDay: deliveryDay,
    receivedWeek: deliveryWeek,
    receivedYear: deliveryYear,
    read: false,
    starred: false,
    archived: false,
    requiresAction: true,
    actionType: 'navigate',
    actionData: { screen: 'sponsor-market', type: 'team_sponsor_offer', dealId: deal.id },
    expiresWeek: deliveryWeek + 4
  }
}
