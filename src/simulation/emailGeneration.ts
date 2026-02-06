/**
 * Email Generation Utilities
 * 
 * Converts various game events into email messages for the inbox system.
 * Uses AI for dynamic generation when available, with template fallback.
 */

import { Email, EmailCategory, BoardTarget, CareerState } from '@/store/careerStore'
import { SponsorDeal } from '@/simulation/finances'
import { InvitationalEvent } from '@/data/invitational-events'
import { SPONSORS } from '@/data/sponsors'
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
  _GeneratedEmailContent
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
  // Look up sponsor tier from SPONSORS database
  const sponsorData = SPONSORS.find(s => s.id === sponsor.sponsorId)
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
  return {
    category: 'system' as EmailCategory,
    subject: `Welcome to ${teamName}!`,
    sender: 'Race Series Administration',
    senderRole: 'Series Officials',
    preview: `Congratulations on establishing ${teamName}. Your team registration is now complete...`,
    body: `Dear Team Principal,

Congratulations on the establishment of ${teamName}!

Your team registration has been processed and you are now officially recognized as a competitor. As you embark on this exciting journey, here are some key points to remember:

• Monitor your board targets closely - they expect results
• Keep an eye on your financial runway
• Maintain your fleet in race-ready condition
• Respond to sponsor inquiries promptly

Your inbox will be your primary communication hub for all team matters, including:
• Sponsor negotiations
• Board communications
• Race invitations
• Contract offers
• Media requests

We wish you the best of luck in your racing endeavors!

Regards,
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
    sender: 'Team Manager',
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
