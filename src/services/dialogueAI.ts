/**
 * Dialogue AI Service
 * 
 * Uses Gemini Flash to dynamically generate dialogue choices and NPC responses
 * for the messaging/social simulation system.
 * Falls back to templates if AI is unavailable.
 */

import type {
  MessageChoice,
  MessageTone,
  MessageChoiceCategory,
  MessageIntentTag,
  NpcResponse,
  SocialBio
} from '@/data/messaging-config';
import { getNextGeminiApiKey } from '@/services/geminiKeyRotation';

export interface DialogueGenerationContext {
  // Contact info
  contactName: string
  contactType: 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date' | 'team_staff' | 'rival_driver' | 'sponsor_rep' | 'team_principal'
  traits: string[]
  bio?: SocialBio
  
  // ── Full profile block (from pre-gen data) ──
  fullProfileBlock?: string       // Formatted text block with ALL pre-gen fields for AI
  knowledgeTier?: 'public' | 'paddock' | 'inner_circle' | 'team_only' | 'partner_only'
  
  // Relationship state
  relationshipStatus?: string
  relationshipLevel: number
  affectionMeter: number
  romanceMeter: number
  trustMeter: number
  
  // Emergent romance — true if this friend can become a romantic interest
  romanticEligible?: boolean
  
  // Current mood
  currentMood: string
  moodEnergy: string
  
  // Conversation history
  lastMessageFromThem?: string
  daysSinceLastContact: number
  /** Whether the player is currently in an active texting session (same game-day, mid-conversation) */
  isActiveSession: boolean
  /** Last few messages for continuity */
  recentMessageHistory?: string[]
  /** Topics discussed previously (from topic tracking) */
  previousTopics?: Array<{ topic: string; sentiment: string; summary?: string }>
  
  // Recent events (filtered by knowledge tier)
  recentEvents: Array<{
    event: string
    weeksAgo: number
    wasPositive: boolean
  }>
  
  // Player context
  playerName: string
  playerRecentRaceResult?: string
  playerCurrentStress: number
  
  // ── Extended player context (new) ──
  playerState?: {
    // Mental/physical
    stress: number
    fatigue: number
    morale: number
    confidence: number
    injuryStatus?: string        // e.g. "muscle strain, 2 weeks recovery" or null
    pressureLevel?: string       // 'normal' | 'high' | 'extreme' | 'critical'
  }
  
  racingContext?: {
    lastRaces: Array<{ position: number; track: string; series: string; dnf: boolean; fastestLap: boolean; wetRace: boolean }>
    championshipPosition?: number
    pointsToLeader?: number
    roundsRemaining?: number
    seasonWins: number
    seasonPodiums: number
    seasonDNFs: number
    consecutiveWins: number
    consecutivePodiums: number
    isRaceWeek: boolean
    nextRaceTrack?: string
    daysUntilNextRace?: number
    weatherForecast?: string     // For next race weekend
  }
  
  teamContext?: {
    teamName: string
    teamTier: string
    seriesNames: string[]
    staffCount: number
    teamMorale?: number
    boardMood?: number
    facilityUpgradeInProgress?: boolean
    recentStaffChange?: string   // "Hired new chief engineer" or "Lost strategist"
    carDevelopmentNote?: string  // "New aero package ready" or "R&D stalled"
  }
  
  financialContext?: {
    cashHealth: 'critical' | 'tight' | 'stable' | 'comfortable' | 'excellent'
    runwayWeeks?: number
    costCapPercent?: number
    recentSponsorDeal?: string
    recentSponsorLoss?: string
    personalNetWorth?: number
    lifestyleLevel?: string
    hasActiveLoans?: boolean
    investmentPerformance?: string // 'up' | 'down' | 'stable'
  }
  
  // Game time (for scheduling invitations)
  currentWeek?: number
  currentDay?: number
  
  personalContext?: {
    partnerStatus?: string       // 'single', 'dating Maria', 'married to Sofia'
    partnerHappiness?: number
    childrenSummary?: string     // "2 kids: Max (5), Luna (2)"
    activeScandalType?: string
    activeRivalry?: string       // "Heated rivalry with Carlos Martinez"
    recentSocialEvent?: string
    foundationCause?: string
    currentHobby?: string
    vacationPlanned?: boolean
  }
  
  mediaContext?: {
    followerCount?: number
    recentPostWentViral?: boolean
    recentControversy?: boolean
    fanSentiment?: string        // 'positive' | 'neutral' | 'negative'
    recentHeadline?: string      // Most recent press clipping about player
  }
  
  // ── Staff-specific context (for team_staff contacts) ──
  staffDomainContext?: string     // Domain-specific data: budget numbers, car performance, media requests, etc.
  
  // ── Rival-specific context (for rival_driver contacts) ──
  rivalContext?: {
    recentH2HResult?: string     // "You beat them by 2 positions at Monza"
    championshipGap?: number     // Points gap between player and this rival
    onTrackIncident?: boolean    // Recent on-track clash
    sameTeamHistory?: boolean    // Were ever teammates
  }
  
  // ── Sponsor-specific context (for sponsor_rep contacts) ──
  sponsorContext?: {
    sponsorSatisfaction?: number
    sponsorPayment?: number
    contractWeeksRemaining?: number
    recentActivation?: string
    warningIssued?: boolean
  }
  
  // ── Invitation decline context ──
  /** If the NPC's last message included an invitation/action request, describe it here so the AI can offer a decline option */
  lastNpcActionRequest?: string
}

// ============================================
// KNOWLEDGE TIER SYSTEM
// ============================================

import type { ContactInfo, ContactType, KnowledgeTier } from '@/types/personalLife'

/**
 * Determine what knowledge tier a contact has - i.e., what game state they would
 * realistically know about.
 */
export function getKnowledgeTier(contact: ContactInfo): KnowledgeTier {
  const type = contact.type
  const relLevel = contact.relationshipLevel
  
  // Partner always gets the deepest tier
  if (type === 'partner') return 'partner_only'
  
  // Team staff get team-level knowledge
  if (type === 'team_staff') return 'team_only'
  
  // Close friends/family (relationship > 70) get inner circle
  if ((type === 'family' || type === 'friend') && relLevel > 70) return 'inner_circle'
  if (type === 'family') return 'inner_circle'
  
  // Paddock people (rival drivers, team principals, sponsor reps) get paddock knowledge
  if (type === 'rival_driver' || type === 'team_principal' || type === 'sponsor_rep') return 'paddock'
  
  // Business contacts with decent relationship get paddock knowledge
  if (type === 'business' && relLevel > 50) return 'paddock'
  
  // Everyone else gets public only
  return 'public'
}

// ============================================
// FULL PROFILE BLOCK BUILDER
// ============================================

/**
 * Build a comprehensive text block from a contact's pre-gen data for the AI.
 * This ensures Gemini always knows WHO it's playing.
 */
export function buildFullProfileBlock(contact: ContactInfo): string {
  const lines: string[] = []
  
  lines.push('CHARACTER PROFILE:')
  lines.push(`Name: ${contact.name}`)
  if (contact.age) lines.push(`Age: ${contact.age}`)
  if (contact.nationality) lines.push(`Nationality: ${contact.nationality}`)
  if (contact.gender) lines.push(`Gender: ${contact.gender}`)
  if (contact.occupation) lines.push(`Occupation: ${contact.occupation}`)
  
  // Personality
  if (contact.personalitySummary) {
    lines.push(`\nPersonality: ${contact.personalitySummary}`)
  }
  if (contact.traits.length > 0) {
    lines.push(`Traits: ${contact.traits.join(', ')}`)
  }
  if (contact.interests && contact.interests.length > 0) {
    lines.push(`Interests: ${contact.interests.join(', ')}`)
  }
  
  // Contact-specific fields
  if (contact.conversationTopics && contact.conversationTopics.length > 0) {
    lines.push(`Natural conversation topics: ${contact.conversationTopics.join(', ')}`)
  }
  if (contact.canHelp && contact.canHelp.length > 0) {
    lines.push(`How they can help you: ${contact.canHelp.join(', ')}`)
  }
  if (contact.connectionToMotorsport) {
    lines.push(`Connection to motorsport: ${contact.connectionToMotorsport}`)
  }
  if (contact.metAt) {
    lines.push(`How you met: ${contact.metAt}`)
  }
  if (contact.educationLevel) lines.push(`Education: ${contact.educationLevel}`)
  if (contact.wealthLevel) lines.push(`Wealth level: ${contact.wealthLevel}`)
  if (contact.socialCircle) lines.push(`Social circle: ${contact.socialCircle}`)
  
  // Romantic-specific fields
  if (contact.loveLanguage) lines.push(`\nLove language: ${contact.loveLanguage}`)
  if (contact.firstImpression) lines.push(`First impression of you: ${contact.firstImpression}`)
  if (contact.style) lines.push(`Personal style: ${contact.style}`)
  if (contact.dealBreakers && contact.dealBreakers.length > 0) {
    lines.push(`Deal breakers: ${contact.dealBreakers.join(', ')}`)
  }
  if (contact.desires) {
    lines.push(`Wants children: ${contact.desires.wantsChildren ? `Yes (${contact.desires.desiredChildrenCount})` : 'No'}`)
    lines.push(`Wants marriage: ${contact.desires.wantsMarriage ? 'Yes' : 'No'}`)
    lines.push(`Lifestyle expectations: ${contact.desires.lifestyleExpectations}`)
    lines.push(`Quality time importance: ${contact.desires.qualityTimeImportance}/10`)
    lines.push(`Privacy importance: ${contact.desires.privacyImportance}/10`)
  }
  
  // Staff-specific fields
  if (contact.staffRole) lines.push(`\nRole: ${contact.staffRole.replace(/_/g, ' ')}`)
  if (contact.staffPersonality) lines.push(`Work personality: ${contact.staffPersonality}`)
  if (contact.staffQuirks && contact.staffQuirks.length > 0) {
    lines.push(`Quirks: ${contact.staffQuirks.join(', ')}`)
  }
  
  // Rival driver fields
  if (contact.driverPersonality) lines.push(`\nDriving personality: ${contact.driverPersonality}`)
  if (contact.driverCareerStage) lines.push(`Career stage: ${contact.driverCareerStage}`)
  if (contact.driverTeamName) lines.push(`Team: ${contact.driverTeamName}`)
  if (contact.driverSeriesName) lines.push(`Series: ${contact.driverSeriesName}`)
  
  // Sponsor rep fields
  if (contact.sponsorName) lines.push(`\nRepresents: ${contact.sponsorName}`)
  if (contact.sponsorTier) lines.push(`Sponsor tier: ${contact.sponsorTier}`)
  
  // Team principal fields
  if (contact.teamPhilosophy) lines.push(`\nTeam philosophy: ${contact.teamPhilosophy}`)
  
  // Bio
  if (contact.bio) {
    lines.push('\nBACKGROUND:')
    if (contact.bio.background) lines.push(contact.bio.background)
    if (contact.bio.careerNarrative) lines.push(`Career: ${contact.bio.careerNarrative}`)
    if (contact.bio.lifeSituation) lines.push(`Current life: ${contact.bio.lifeSituation}`)
    if (contact.bio.anecdotes && contact.bio.anecdotes.length > 0) {
      lines.push('Fun facts:')
      contact.bio.anecdotes.forEach(a => lines.push(`- ${a}`))
    }
  }
  
  return lines.join('\n')
}

// ============================================
// MAIN CONTEXT BUILDER
// ============================================

/**
 * Build complete dialogue context from game state.
 * This is the "everything function" that gives Gemini full awareness.
 * Data is filtered by the contact's knowledge tier.
 */
export function buildDialogueContext(
  contact: ContactInfo,
  conversation: { messages: Array<{ sender: string; content: string; isSessionEnd?: boolean; timestamp?: { week?: number; day?: number; year?: number } }>; topicHistory?: Array<{ topic: string; sentiment: string; summary?: string }>; conversationStage?: string; exchangesToday?: number; lastExchangeDay?: number } | undefined,
  gameState: {
    player: {
      firstName: string
      lastName: string
      mentalState: { stress: number; fatigue?: number; morale?: number; confidence?: number }
      health?: { injuryState?: { type?: string; severity?: string; recoveryWeeksRemaining?: number } }
      reputation: number
      raceHistory: Array<{ position: number; trackName?: string; seriesName?: string; dnf?: boolean; fastestLap?: boolean; wetRace?: boolean; week: number; year: number }>
      totalWins: number
      totalPodiums: number
      consecutiveWins: number
      consecutivePodiums: number
      totalFastestLaps?: number
      championships: number
    }
    currentWeek: number
    currentYear: number
    currentDay: number
    nextRaceWeek?: number
    nextRaceTrack?: string
    seasonCompleted?: boolean
    ownedTeam?: {
      name: string
      tier: string
      boardMood: number
      teamMorale?: number
      staff: Array<{ name: string; role: string }>
      facilityStaff?: Array<{ name: string; role: string }>
      finances: { cash: number; weeklyBurnRate?: number }
      budgets?: { costCapSpend?: number; costCapLimit?: number }
      spareParts?: { criticalShortage?: boolean }
    } | null
    seriesEntries?: Array<{ seriesId: string; seriesName?: string; standings?: { position?: number; points?: number; pointsToLeader?: number; roundsRemaining?: number } }>
    personalLife?: {
      partner?: { firstName: string; lastName: string; happiness: number; relationshipStatus?: string }
      children?: Array<{ firstName: string; age: number }>
      messaging?: { contacts: Array<{ id: string }> }
      lifestyleLevel?: { tier: string }
      rivalries?: Array<{ rivalName: string; intensity: number; isActive: boolean }>
      scandals?: Array<{ type: string; isResolved: boolean; publicKnowledge: boolean }>
      foundations?: Array<{ name: string; cause: string }>
    }
    socialPosts?: Array<{ wentViral?: boolean; hadBacklash?: boolean; engagement?: { likes: number } }>
    socialMediaState?: { totalFollowers?: number }
    pressClippings?: Array<{ headline: string; week: number; year: number }>
    boardTargets?: Array<{ description: string; progress?: number }>
  }
): DialogueGenerationContext {
  const tier = getKnowledgeTier(contact)
  const p = gameState.player
  const team = gameState.ownedTeam
  const pLife = gameState.personalLife
  
  // ── Calculate days since last contact ──
  // Use the actual message timestamp to compute real elapsed days
  const lastMsg = conversation?.messages?.slice(-1)?.[0]
  const lastMsgTimestamp = (lastMsg as any)?.timestamp as { week?: number; day?: number; year?: number } | undefined
  const currentAbsoluteDay = (gameState.currentYear * 365) + (gameState.currentWeek * 7) + gameState.currentDay
  const lastMsgAbsoluteDay = lastMsgTimestamp?.week != null && lastMsgTimestamp?.day != null
    ? ((lastMsgTimestamp.year ?? gameState.currentYear) * 365) + (lastMsgTimestamp.week * 7) + (lastMsgTimestamp.day || 1)
    : 0
  const daysSinceLastContact = lastMsgAbsoluteDay > 0
    ? Math.max(0, currentAbsoluteDay - lastMsgAbsoluteDay)
    : 7  // default for conversations with no messages
  
  // ── Build recent events (filtered by tier) ──
  const recentEvents: Array<{ event: string; weeksAgo: number; wasPositive: boolean }> = []
  
  // Race results (public knowledge)
  const recentRaces = (p.raceHistory || []).slice(-3)
  for (const race of recentRaces) {
    const weeksAgo = Math.max(0, gameState.currentWeek - race.week)
    if (weeksAgo > 4) continue
    if (race.dnf) {
      recentEvents.push({ event: `DNF at ${race.trackName || 'unknown track'}`, weeksAgo, wasPositive: false })
    } else if (race.position === 1) {
      recentEvents.push({ event: `Won at ${race.trackName || 'unknown track'}${race.fastestLap ? ' with fastest lap' : ''}`, weeksAgo, wasPositive: true })
    } else if (race.position <= 3) {
      recentEvents.push({ event: `P${race.position} at ${race.trackName || 'unknown track'}`, weeksAgo, wasPositive: true })
    } else if (race.position <= 10) {
      recentEvents.push({ event: `P${race.position} at ${race.trackName || 'unknown track'}`, weeksAgo, wasPositive: race.position <= 5 })
    }
  }
  
  // Championship context (public)
  const standing = gameState.seriesEntries?.[0]?.standings
  if (standing?.position === 1) {
    recentEvents.push({ event: `Leading the championship by ${standing.pointsToLeader || 0} points`, weeksAgo: 0, wasPositive: true })
  } else if (standing?.position && standing.position <= 3) {
    recentEvents.push({ event: `P${standing.position} in championship, ${Math.abs(standing.pointsToLeader || 0)} points from leader`, weeksAgo: 0, wasPositive: false })
  }
  
  // Paddock+ knowledge events
  if (tier !== 'public') {
    if (team && team.boardMood < 40) {
      recentEvents.push({ event: 'Board is unhappy with team direction', weeksAgo: 0, wasPositive: false })
    }
    if (team && (team.teamMorale ?? 75) < 40) {
      recentEvents.push({ event: 'Team morale is low', weeksAgo: 0, wasPositive: false })
    }
  }
  
  // Inner circle+ knowledge
  if (tier === 'inner_circle' || tier === 'partner_only' || tier === 'team_only') {
    if (p.mentalState.stress > 70) {
      recentEvents.push({ event: 'Player is very stressed', weeksAgo: 0, wasPositive: false })
    }
    if (pLife?.scandals?.some(s => !s.isResolved && s.publicKnowledge)) {
      const scandal = pLife.scandals.find(s => !s.isResolved)
      recentEvents.push({ event: `Active scandal: ${scandal?.type}`, weeksAgo: 0, wasPositive: false })
    }
  }
  
  // Media events (public)
  const recentViral = gameState.socialPosts?.slice(-5)?.find(p => p.wentViral)
  if (recentViral) {
    recentEvents.push({ event: 'Recent social media post went viral', weeksAgo: 0, wasPositive: true })
  }
  const recentBacklash = gameState.socialPosts?.slice(-5)?.find(p => p.hadBacklash)
  if (recentBacklash) {
    recentEvents.push({ event: 'Recent social media controversy', weeksAgo: 0, wasPositive: false })
  }
  
  // ── Build the context ──
  const ctx: DialogueGenerationContext = {
    contactName: contact.name,
    contactType: contact.type,
    traits: contact.traits,
    bio: contact.bio,
    fullProfileBlock: buildFullProfileBlock(contact),
    knowledgeTier: tier,
    
    relationshipStatus: contact.datingStatus || (contact.type === 'partner' ? 'partner' : undefined),
    relationshipLevel: contact.relationshipLevel,
    affectionMeter: contact.affectionMeter,
    romanceMeter: contact.romanceMeter,
    trustMeter: contact.trustMeter,
    romanticEligible: contact.romanticEligible,
    
    currentMood: contact.currentMood?.overall || 'neutral',
    moodEnergy: contact.currentMood?.energy || 'medium',
    
    lastMessageFromThem: conversation?.messages?.filter(m => m.sender === 'npc')?.slice(-1)?.[0]?.content,
    daysSinceLastContact,
    // Active session = same game-day AND the last message was NOT a session-ending farewell
    // Also check conversationStage — if 'cooling_off', the previous session ended
    isActiveSession: daysSinceLastContact === 0 
      && conversation?.conversationStage !== 'cooling_off'
      && !conversation?.messages?.slice(-1)?.[0]?.isSessionEnd,
    recentMessageHistory: (() => {
      // Include session boundary markers so the AI knows where conversations end
      const msgs = conversation?.messages?.slice(-8) || []
      const history: string[] = []
      for (const m of msgs) {
        if (m.isSessionEnd) {
          history.push(`[${m.sender === 'npc' ? contact.name : 'You'}: ${m.content}]`)
          history.push('--- conversation ended ---')
        } else {
          history.push(`${m.sender === 'npc' ? contact.name : 'You'}: ${m.content}`)
        }
      }
      return history.slice(-8) // Cap at 8 entries (including markers)
    })(),
    previousTopics: conversation?.topicHistory?.slice(-10),
    
    recentEvents,
    
    playerName: `${p.firstName} ${p.lastName}`,
    playerRecentRaceResult: recentRaces.length > 0 
      ? (recentRaces[recentRaces.length - 1].dnf ? 'dnf' :
         recentRaces[recentRaces.length - 1].position === 1 ? 'win' :
         recentRaces[recentRaces.length - 1].position <= 3 ? 'podium' :
         recentRaces[recentRaces.length - 1].position <= 10 ? 'points' : 'poor')
      : undefined,
    playerCurrentStress: p.mentalState.stress,
    
    // Extended player state (filtered by tier)
    playerState: (tier !== 'public') ? {
      stress: p.mentalState.stress,
      fatigue: p.mentalState.fatigue ?? 0,
      morale: p.mentalState.morale ?? 50,
      confidence: p.mentalState.confidence ?? 50,
      injuryStatus: p.health?.injuryState?.type 
        ? `${p.health.injuryState.type} (${p.health.injuryState.severity}, ${p.health.injuryState.recoveryWeeksRemaining} weeks recovery)`
        : undefined,
    } : undefined,
    
    racingContext: {
      lastRaces: recentRaces.map(r => ({
        position: r.position,
        track: r.trackName || 'Unknown',
        series: r.seriesName || 'Unknown',
        dnf: !!r.dnf,
        fastestLap: !!r.fastestLap,
        wetRace: !!r.wetRace,
      })),
      championshipPosition: standing?.position,
      pointsToLeader: standing?.pointsToLeader ? Math.abs(standing.pointsToLeader) : undefined,
      roundsRemaining: standing?.roundsRemaining,
      seasonWins: p.totalWins,
      seasonPodiums: p.totalPodiums,
      seasonDNFs: recentRaces.filter(r => r.dnf).length,
      consecutiveWins: p.consecutiveWins,
      consecutivePodiums: p.consecutivePodiums,
      isRaceWeek: gameState.nextRaceWeek === gameState.currentWeek,
      nextRaceTrack: gameState.nextRaceTrack,
      daysUntilNextRace: gameState.nextRaceWeek ? Math.max(0, (gameState.nextRaceWeek - gameState.currentWeek) * 7) : undefined,
    },
    
    // Team context (paddock+ only)
    teamContext: (tier !== 'public' && team) ? {
      teamName: team.name,
      teamTier: team.tier,
      seriesNames: gameState.seriesEntries?.map(e => e.seriesName || e.seriesId) || [],
      staffCount: (team.staff?.length || 0) + (team.facilityStaff?.length || 0),
      teamMorale: team.teamMorale,
      boardMood: tier === 'team_only' || tier === 'partner_only' ? team.boardMood : undefined,
    } : undefined,
    
    // Financial context (inner circle+ only)
    financialContext: (tier === 'inner_circle' || tier === 'team_only' || tier === 'partner_only') && team ? {
      cashHealth: team.finances.cash > 500000 ? 'excellent' :
                  team.finances.cash > 200000 ? 'comfortable' :
                  team.finances.cash > 50000 ? 'stable' :
                  team.finances.cash > 10000 ? 'tight' : 'critical',
      costCapPercent: team.budgets?.costCapSpend && team.budgets?.costCapLimit 
        ? Math.round((team.budgets.costCapSpend / team.budgets.costCapLimit) * 100)
        : undefined,
      lifestyleLevel: pLife?.lifestyleLevel?.tier,
    } : undefined,
    
    // Personal context (inner circle+ only)
    personalContext: (tier === 'inner_circle' || tier === 'partner_only') ? {
      partnerStatus: pLife?.partner 
        ? `${pLife.partner.relationshipStatus || 'with'} ${pLife.partner.firstName}`
        : 'single',
      partnerHappiness: tier === 'partner_only' ? pLife?.partner?.happiness : undefined,
      childrenSummary: pLife?.children && pLife.children.length > 0
        ? pLife.children.map(c => `${c.firstName} (${c.age})`).join(', ')
        : undefined,
      activeRivalry: pLife?.rivalries?.find(r => r.isActive)
        ? `Rivalry with ${pLife.rivalries.find(r => r.isActive)!.rivalName} (intensity: ${pLife.rivalries.find(r => r.isActive)!.intensity})`
        : undefined,
      foundationCause: pLife?.foundations?.[0]?.cause,
    } : undefined,
    
    // Game time (for scheduling invitations)
    currentWeek: gameState.currentWeek,
    currentDay: gameState.currentDay,
    
    // Media context (public)
    mediaContext: {
      followerCount: gameState.socialMediaState?.totalFollowers,
      recentPostWentViral: !!recentViral,
      recentControversy: !!recentBacklash,
      recentHeadline: gameState.pressClippings?.slice(-1)?.[0]?.headline,
    },
  }
  
  return ctx
}

export interface MessageChoiceGeneration {
  choices: GeneratedChoice[]
}

export interface GeneratedChoice {
  category: string
  preview: string
  fullMessage: string
  tone: string
  intentTag: string
  riskLevel: 'safe' | 'mild' | 'risky' | 'bold'
  expectedReaction: string
}

export interface NpcResponseGeneration {
  message: string
  tone: string
  mood: string
  affectionChange: number
  romanceChange: number
  trustChange: number
  emotionalReaction: string
  suggestedFollowUp?: string
  wantsToMeetUp: boolean
  actionRequest?: {
    type: string
    description: string
    timeCost?: number
    moneyCost?: number
    suggestedDay?: number
    suggestedWeek?: number
    eventName?: string
    venue?: string
  } | null
}

// ============================================
// GEMINI API INTEGRATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

/**
 * Get the stored Gemini API key.
 * Primary source: commentary-settings (where the Settings screen saves it).
 * Fallbacks: app-settings, career-settings (legacy).
 */
function getApiKey(): string | null {
  return getNextGeminiApiKey()
}

/**
 * Check if AI dialogue generation is available
 */
export function isDialogueAIAvailable(): boolean {
  return !!getApiKey()
}

/**
 * Safely parse JSON from API response
 */
function safeParseJSON(content: string): any {
  let jsonStr = content.trim()
  
  // Step 1: Strip markdown code fences (may appear anywhere, not just at start)
  // Handle ```json ... ``` wrapping even if preceded by text like "Here is the JSON:"
  const fenceMatch = jsonStr.match(/```(?:json|JSON)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  } else {
    // Also strip leading/trailing fences with anchors as a fallback
    jsonStr = jsonStr.replace(/^```(?:json|JSON)?\s*/i, '')
    jsonStr = jsonStr.replace(/\s*```\s*$/i, '')
    jsonStr = jsonStr.trim()
  }
  
  // Step 2: If not starting with { or [, extract JSON
  if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
    const jsonObjMatch = jsonStr.match(/(\{[\s\S]*\})/)
    const jsonArrMatch = jsonStr.match(/(\[[\s\S]*\])/)
    if (jsonObjMatch) jsonStr = jsonObjMatch[1]
    else if (jsonArrMatch) jsonStr = jsonArrMatch[1]
  }
  
  // Step 3: Fix trailing commas
  jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
  
  // Attempt 1: parse as-is
  try { return JSON.parse(jsonStr) } catch { /* continue */ }
  
  // Attempt 2: repair truncated JSON (close unclosed brackets/braces)
  try {
    let repaired = jsonStr
    // Count unmatched braces/brackets
    let braces = 0, brackets = 0, inString = false, escaped = false
    for (const ch of repaired) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') braces++
      else if (ch === '}') braces--
      else if (ch === '[') brackets++
      else if (ch === ']') brackets--
    }
    // If truncated mid-string, close the string
    if (inString) repaired += '"'
    // Remove any trailing incomplete key-value pair (e.g., `"key": ` or `"key": "val`)
    repaired = repaired.replace(/,\s*"[^"]*":\s*"?[^",}\]]*$/, '')
    repaired = repaired.replace(/,\s*$/, '')
    // Close unclosed brackets/braces
    while (brackets > 0) { repaired += ']'; brackets-- }
    while (braces > 0) { repaired += '}'; braces-- }
    // Fix trailing commas created by truncation
    repaired = repaired.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    return JSON.parse(repaired)
  } catch { /* continue */ }
  
  // Attempt 3: strip all control chars and try again
  try {
    const cleaned = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse JSON from response: ${jsonStr.slice(0, 200)}...`)
  }
}

/**
 * Truncate text to a safe character limit (Gemini has token limits,
 * ~4 chars per token, keep well under the input limit).
 */
function truncatePrompt(text: string, maxChars: number = 12000): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n...[context truncated for length]'
}

/**
 * Call Gemini API with retry logic
 */
async function callGeminiAPI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 10000,
  responseFormat?: {
    type: 'json_object'
    schema?: Record<string, unknown>
  }
): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  // Safety-truncate both prompts to avoid 400 errors from oversized payloads
  // Gemini flash models accept ~1M tokens; 8K chars (~2K tokens) for system
  // and 16K chars (~4K tokens) for user is well within limits while giving
  // rich context for NPC dialogue, bios, etc.
  const safeSystem = truncatePrompt(systemPrompt, 8000)
  const safeUser = truncatePrompt(userPrompt, 16000)

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        messages: [
          { role: 'system', content: safeSystem },
          { role: 'user', content: safeUser }
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
        // Gemini's OpenAI-compatible endpoint only supports { type: 'json_object' }
        // — the 'schema' field is not recognized and causes 400 errors.
        // Schema guidance is already embedded in the system/user prompts.
        ...(responseFormat ? { response_format: { type: responseFormat.type } } : {})
      })
    })

    if (!response.ok) {
      // Retry once with a stable model if Gemini 3 preview fails
      if (response.status >= 400 && response.status < 500) {
        const fallbackResponse = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            messages: [
              { role: 'system', content: safeSystem },
              { role: 'user', content: safeUser }
            ],
            max_tokens: maxTokens,
            temperature: 0.8,
            ...(responseFormat ? { response_format: { type: responseFormat.type } } : {})
          })
        })
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          return fallbackData.choices?.[0]?.message?.content || null
        }
      }
      const errorBody = await response.text().catch(() => 'no body')
      console.warn(`[DialogueAI] API error ${response.status}:`, errorBody)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.warn('[DialogueAI] API call failed:', error)
    return null
  }
}

// ============================================
// PERSONALITY PROMPTS
// ============================================

const PERSONALITY_PROMPTS: Record<string, string> = {
  // ── Original traits ──
  supportive: "They are warm, encouraging, and always interested in your racing career. They celebrate your wins genuinely and comfort you after losses.",
  jealous: "They can be insecure and need reassurance. They notice when you mention other people and can get upset easily.",
  ambitious: "They have their own career goals and respect drive in others. They appreciate being treated as equals and don't like being patronized.",
  romantic: "They love grand gestures, meaningful dates, and expressions of affection. They notice the little things and appreciate romance.",
  independent: "They value their own space and don't need constant attention, but appreciate quality time when together.",
  practical: "They are down-to-earth and sensible. They appreciate genuine effort over expensive gestures.",
  glamorous: "They enjoy the finer things in life and social events. They like being seen and appreciated.",
  private: "They prefer staying out of the spotlight and value quiet, intimate moments over public displays.",
  adventurous: "They love trying new things and spontaneous plans. They get bored with routine easily.",
  nurturing: "They are caring and attentive. They worry about your wellbeing and want to take care of you.",
  // ── Previously missing traits ──
  controlling: "They need to feel in control. They give unsolicited advice, question your decisions, and get upset when you act independently. Texts tend to be directive.",
  materialistic: "They measure success in possessions and status symbols. They reference expensive brands, luxury experiences, and are impressed by wealth. They notice your spending.",
  dramatic: "Everything is either the best thing ever or a complete disaster. They use lots of exclamation marks, capitals for emphasis, and their emotions swing quickly.",
  possessive: "They want to know where you are and who you're with. They get anxious when you don't reply quickly. They're territorial about your attention.",
  party_animal: "They're always talking about the next event, who was at what party, and inviting you out. Their texts come late at night and reference social scenes.",
  commitment_phobic: "They deflect serious relationship talks with humor or topic changes. They're fun and engaging but get visibly uncomfortable with future plans.",
  passive_aggressive: "They say 'it's fine' when it isn't. They make subtle digs disguised as jokes. Their displeasure comes through in subtext, not direct confrontation.",
  self_centered: "They steer conversations back to themselves. They respond to your news with their own stories. They expect attention but rarely ask about your day.",
  secretive: "They give vague answers about their own life. They're curious about yours but don't reciprocate. Their messages can feel guarded.",
  workaholic: "They often text about being busy or tired from work. They cancel plans due to work. They respect your career drive but expect the same dedication.",
  high_maintenance: "They have strong opinions about quality and standards. They're not easily impressed and expect effort. Average gestures get lukewarm reactions.",
  racing_enthusiast: "They genuinely follow racing and bring it up naturally. They know drivers, tracks, and results. They're excited about your race weekends.",
  social_butterfly: "They know everyone, always have plans, and love connecting people. They're chatty, upbeat, and energized by social interaction.",
}

// ============================================
// TEXTING STYLE CONFIG
// ============================================

interface TextingStyle {
  lengthPreference: 'very_short' | 'short' | 'medium' | 'long'
  emojiUsage: 'none' | 'rare' | 'moderate' | 'heavy'
  formality: 'formal' | 'casual' | 'very_casual'
  punctuation: 'proper' | 'minimal' | 'excessive'
  quirks: string[]
}

const TEXTING_STYLE_CONFIG: Record<string, TextingStyle> = {
  glamorous: {
    lengthPreference: 'medium',
    emojiUsage: 'heavy',
    formality: 'casual',
    punctuation: 'excessive',
    quirks: ['Uses sparkle and heart emojis', 'Mentions brands or places by name', 'Signs off with kisses (xx)']
  },
  private: {
    lengthPreference: 'short',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Keeps messages brief and to the point', 'Rarely shares personal details unprompted']
  },
  dramatic: {
    lengthPreference: 'long',
    emojiUsage: 'heavy',
    formality: 'very_casual',
    punctuation: 'excessive',
    quirks: ['Uses CAPS for emphasis', 'Multiple exclamation marks!!!', 'Emotional reactions to everything']
  },
  practical: {
    lengthPreference: 'short',
    emojiUsage: 'none',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Straight to the point', 'Rarely uses emojis', 'Prefers logistics over small talk']
  },
  supportive: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Asks how you are doing', 'Uses encouraging language', 'Sends follow-up messages to check in']
  },
  jealous: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Sometimes asks probing questions about your day', 'Reads into delays in replying', 'Can shift tone quickly']
  },
  ambitious: {
    lengthPreference: 'medium',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['References their own achievements naturally', 'Respects efficiency in communication']
  },
  romantic: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Uses affectionate nicknames', 'Sends good morning/night texts', 'References shared memories']
  },
  independent: {
    lengthPreference: 'short',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Doesn\'t always respond immediately', 'Keeps things chill and low-pressure']
  },
  adventurous: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'very_casual',
    punctuation: 'minimal',
    quirks: ['Sends spontaneous plans and ideas', 'Uses travel and nature emojis', 'Gets excited easily']
  },
  nurturing: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Asks about your health and wellbeing', 'Worries if you seem stressed', 'Sends caring follow-ups']
  },
  controlling: {
    lengthPreference: 'medium',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Gives unsolicited advice', 'Asks where you are and what you\'re doing', 'Phrases things as instructions']
  },
  materialistic: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Name-drops brands and restaurants', 'Comments on luxury items', 'Compares things to expensive alternatives']
  },
  possessive: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Double-texts when you don\'t reply', 'Asks who you\'re with', 'Gets clingy in tone when insecure']
  },
  party_animal: {
    lengthPreference: 'short',
    emojiUsage: 'heavy',
    formality: 'very_casual',
    punctuation: 'minimal',
    quirks: ['Uses party and drink emojis', 'Texts late at night', 'Always inviting you somewhere']
  },
  commitment_phobic: {
    lengthPreference: 'short',
    emojiUsage: 'moderate',
    formality: 'very_casual',
    punctuation: 'minimal',
    quirks: ['Deflects serious topics with humor', 'Keeps things light and breezy', 'Avoids making firm plans']
  },
  passive_aggressive: {
    lengthPreference: 'short',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Says "it\'s fine" when it isn\'t', 'Makes sarcastic comments disguised as jokes', 'Uses ellipsis (...) to imply displeasure']
  },
  self_centered: {
    lengthPreference: 'long',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Talks about themselves a lot', 'Redirects conversations to their own news', 'Rarely asks questions about you']
  },
  secretive: {
    lengthPreference: 'very_short',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'minimal',
    quirks: ['Gives vague answers', 'Changes subject when asked personal questions', 'Mysterious and guarded']
  },
  workaholic: {
    lengthPreference: 'short',
    emojiUsage: 'rare',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Mentions being busy or at work', 'Replies at odd hours', 'Cancels plans via text']
  },
  high_maintenance: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['Has opinions about everything', 'Reacts lukewarmly to average gestures', 'Expects quick replies']
  },
  racing_enthusiast: {
    lengthPreference: 'medium',
    emojiUsage: 'moderate',
    formality: 'casual',
    punctuation: 'proper',
    quirks: ['References specific races and drivers', 'Uses racing terminology naturally', 'Gets excited about race weekends']
  },
  social_butterfly: {
    lengthPreference: 'medium',
    emojiUsage: 'heavy',
    formality: 'very_casual',
    punctuation: 'excessive',
    quirks: ['Always has social plans to share', 'Name-drops people they know', 'Uses lots of exclamation marks and emojis']
  }
}

/**
 * Build a texting style instruction block from a contact's traits.
 * This gets injected into the AI prompt to ensure consistent texting personality.
 */
function buildTextingStyleBlock(traits: string[]): string {
  // Find the dominant trait style (first match wins for primary style)
  let dominantStyle: TextingStyle | null = null
  let dominantTraitName = ''
  
  for (const trait of traits) {
    if (TEXTING_STYLE_CONFIG[trait]) {
      dominantStyle = TEXTING_STYLE_CONFIG[trait]
      dominantTraitName = trait
      break
    }
  }
  
  if (!dominantStyle) return ''
  
  // Collect additional quirks from secondary traits
  const allQuirks = [...dominantStyle.quirks]
  for (const trait of traits.slice(1)) {
    const style = TEXTING_STYLE_CONFIG[trait]
    if (style && trait !== dominantTraitName) {
      // Add 1-2 quirks from secondary traits
      allQuirks.push(...style.quirks.slice(0, 1))
    }
  }
  
  const lengthGuide: Record<string, string> = {
    very_short: 'Keep messages very short (1-2 sentences max, often just a few words)',
    short: 'Write short messages (1-3 sentences)',
    medium: 'Write medium-length messages (2-4 sentences)',
    long: 'Write longer messages (3-5 sentences, detailed and expressive)'
  }
  
  const emojiGuide: Record<string, string> = {
    none: 'Do NOT use any emojis',
    rare: 'Rarely use emojis (at most 1 per message, only when very appropriate)',
    moderate: 'Use emojis naturally (1-2 per message when fitting)',
    heavy: 'Use emojis liberally (2-4 per message, expressive and fun)'
  }
  
  const formalityGuide: Record<string, string> = {
    formal: 'Use proper grammar, full words, and polite phrasing',
    casual: 'Use casual but readable language, occasional abbreviations',
    very_casual: 'Use very casual texting style - abbreviations, slang, lowercase ok'
  }
  
  const punctuationGuide: Record<string, string> = {
    proper: 'Use standard punctuation',
    minimal: 'Use minimal punctuation (skip periods, sparse commas)',
    excessive: 'Use expressive punctuation (!! ?! ... multiple marks for emphasis)'
  }
  
  return `\nTEXTING STYLE (IMPORTANT - follow this closely):
- ${lengthGuide[dominantStyle.lengthPreference]}
- ${emojiGuide[dominantStyle.emojiUsage]}
- ${formalityGuide[dominantStyle.formality]}
- ${punctuationGuide[dominantStyle.punctuation]}
- Specific quirks: ${allQuirks.join('; ')}`
}

function getPersonalityPrompt(traits: string[]): string {
  return traits
    .map(t => PERSONALITY_PROMPTS[t] || '')
    .filter(Boolean)
    .join(' ')
}

// ============================================
// TRAIT-AWARE FALLBACK TEMPLATES
// ============================================

const FALLBACK_TEMPLATES: Record<string, {
  greeting: string[]
  afterAbsence: string[]
  positiveReply: string[]
  negativeReply: string[]
}> = {
  dramatic: {
    greeting: ['OMG hiii!! I was literally JUST thinking about you!', 'Babe!! Where have you BEEN?!'],
    afterAbsence: ['I honestly thought you forgot about me...', 'FINALLY! I was about to send a search party!'],
    positiveReply: ['That is AMAZING!! I\'m SO happy for you!!', 'No way!! That\'s incredible!!!'],
    negativeReply: ['Ugh that\'s the WORST. I\'m so sorry', 'Are you kidding me?! That\'s terrible!']
  },
  practical: {
    greeting: ['Hey. What\'s up?', 'Hi, how are things?'],
    afterAbsence: ['Been a while. Everything ok?', 'Hey stranger. Hope you\'re well.'],
    positiveReply: ['That\'s great news. Well deserved.', 'Good to hear. You earned it.'],
    negativeReply: ['Sorry to hear that. What\'s the plan?', 'That\'s rough. Let me know if you need anything.']
  },
  glamorous: {
    greeting: ['Hiii darling! xx', 'Hey gorgeous, how are you? xx'],
    afterAbsence: ['Well well, look who remembered me! xx', 'There you are! Missed you xx'],
    positiveReply: ['Oh that\'s fabulous!! So proud of you xx', 'Amazing news darling!!'],
    negativeReply: ['Oh no, that\'s awful. Are you ok? xx', 'I\'m so sorry babe. That\'s really unfair xx']
  },
  supportive: {
    greeting: ['Hey! How are you doing? Everything ok?', 'Hi! I was just thinking about you. How\'s your day?'],
    afterAbsence: ['Hey! I was getting worried. Is everything alright?', 'So good to hear from you! How have you been?'],
    positiveReply: ['That\'s amazing! I\'m so proud of you!', 'You deserve this so much! Well done!'],
    negativeReply: ['I\'m so sorry. I\'m here for you, always.', 'That\'s really tough. What can I do to help?']
  },
  jealous: {
    greeting: ['Hey... missed you. What have you been up to?', 'Finally texting me back, huh?'],
    afterAbsence: ['Oh, so you DO remember I exist?', 'Where have you been? I was starting to worry...'],
    positiveReply: ['That\'s great. Wish I could have been there with you.', 'Happy for you! Were you celebrating with anyone?'],
    negativeReply: ['That sucks. At least you have me, right?', 'I\'m sorry. Come over, let me cheer you up.']
  },
  adventurous: {
    greeting: ['Hey! What are you up to? Anything fun?', 'Yo! I just had the craziest idea...'],
    afterAbsence: ['Whoa, it\'s been ages! We need to do something fun', 'Hey stranger! Ready for an adventure?'],
    positiveReply: ['That\'s sick! We should celebrate properly', 'YES! That calls for something spontaneous'],
    negativeReply: ['That\'s rough. You know what you need? A change of scenery.', 'Sorry to hear that. Let\'s get out of here and clear your head.']
  },
  private: {
    greeting: ['Hey.', 'Hi, how are you?'],
    afterAbsence: ['Hey. Been a while.', 'Hi. Hope things are ok.'],
    positiveReply: ['That\'s great. Really happy for you.', 'Good news. You deserve it.'],
    negativeReply: ['Sorry to hear that.', 'That\'s tough. I\'m here if you need to talk.']
  },
  controlling: {
    greeting: ['Hey. Did you handle that thing I mentioned?', 'Hi. What\'s your plan for today?'],
    afterAbsence: ['You really should check in more often.', 'I was wondering where you\'d gone. You should let me know.'],
    positiveReply: ['Good. I knew that would work out if you followed the plan.', 'See? I told you it would be fine.'],
    negativeReply: ['Well, what did I say? You should have listened.', 'That\'s unfortunate. Let me tell you what you should do next.']
  },
  materialistic: {
    greeting: ['Hey! You won\'t believe what I just bought...', 'Hi! Just got back from the most amazing restaurant'],
    afterAbsence: ['Oh hey! I was just at this incredible new place...', 'Finally! I have so much to tell you about'],
    positiveReply: ['That\'s fantastic! We should celebrate somewhere nice', 'Amazing! You should treat yourself to something special'],
    negativeReply: ['That\'s terrible. Retail therapy?', 'Sorry babe. Nothing a nice dinner can\'t help with.']
  },
  possessive: {
    greeting: ['Hey! Where are you?', 'Hi baby, I miss you so much. What are you doing?'],
    afterAbsence: ['Why haven\'t you been texting me? I was so worried!', 'Do you know how long it\'s been since you messaged me?'],
    positiveReply: ['That\'s great! I wish I was there with you though', 'Amazing! Next time take me with you ok?'],
    negativeReply: ['Come home. I need to be with you right now.', 'I\'m sorry baby. Let me take care of you.']
  },
  nurturing: {
    greeting: ['Hey sweetie, how are you feeling today?', 'Hi! Have you eaten? Are you taking care of yourself?'],
    afterAbsence: ['I\'ve been worried about you! Are you ok?', 'There you are! I was starting to fret. How are you?'],
    positiveReply: ['Oh that\'s wonderful! I\'m so happy for you!', 'You worked so hard for this. So proud of you!'],
    negativeReply: ['Oh no, come here. It\'ll be ok, I promise.', 'I\'m so sorry love. Let me make you something warm.']
  },
  party_animal: {
    greeting: ['yooo whats good!!', 'heyyy!! you coming out tonight??'],
    afterAbsence: ['duuude where u been?? missed u at the party!', 'omg finally!! we need to catch up over drinks'],
    positiveReply: ['LETS GOOO!! drinks on you tonight!!', 'yesss!! thats sick, we celebrating!!'],
    negativeReply: ['damn that sucks. you need a night out trust me', 'ugh sorry. come out tonight itll take your mind off it']
  },
  self_centered: {
    greeting: ['Hey! So the craziest thing happened to me today...', 'Oh hi! I have so much to tell you'],
    afterAbsence: ['Finally! I\'ve been dying to tell someone about my week', 'Oh good you\'re here. Guess what happened to me?'],
    positiveReply: ['That\'s nice! Reminds me of when I...', 'Cool! Something similar happened to me actually...'],
    negativeReply: ['Oh that sucks. Anyway, you won\'t believe what happened at my...', 'Sorry to hear that. I had a rough day too actually...']
  },
  commitment_phobic: {
    greeting: ['Hey! What\'s happening?', 'Sup! Anything fun going on?'],
    afterAbsence: ['Oh hey! No worries about the silence, I get it', 'Hey! We\'re both busy people, no big deal'],
    positiveReply: ['Nice one! Let\'s not overthink it and just enjoy the moment', 'That\'s awesome! Living the dream'],
    negativeReply: ['Ah that\'s rough. But hey, tomorrow\'s another day right?', 'Sorry to hear that. These things have a way of working out']
  },
  passive_aggressive: {
    greeting: ['Oh, hi. Didn\'t expect to hear from you.', 'Hey. Nice of you to text.'],
    afterAbsence: ['Oh, you\'re alive. Good to know.', 'Well look who finally remembered their phone exists.'],
    positiveReply: ['That\'s great. For you, I mean.', 'Oh wonderful. Must be nice.'],
    negativeReply: ['Hmm. That\'s... interesting. Sorry I guess.', 'Well that\'s a shame. I\'m sure it\'ll be fine though.']
  },
  workaholic: {
    greeting: ['Hey, quick one - how are you?', 'Hi! Between meetings but wanted to say hi'],
    afterAbsence: ['Sorry, been swamped at work. How are you?', 'I know, I know, I\'ve been MIA. Work\'s been insane.'],
    positiveReply: ['That\'s great! Hard work pays off.', 'Well earned. You put in the hours.'],
    negativeReply: ['Sorry to hear that. Sometimes you just have to push through.', 'That\'s tough. At least there\'s always tomorrow to try again.']
  },
  racing_enthusiast: {
    greeting: ['Hey! Did you see that qualifying session?!', 'Hi! I was just reading about the latest track updates'],
    afterAbsence: ['Hey! I\'ve been following your races. How\'s the car feeling?', 'There he is! How\'s the championship looking?'],
    positiveReply: ['That\'s incredible! What a result! How was the car?', 'YES! I knew you had it in you! Tell me everything'],
    negativeReply: ['Tough break. What happened? Mechanical or setup?', 'That\'s racing though. Next one will be better.']
  },
  high_maintenance: {
    greeting: ['Hey. I hope you have something interesting planned for us.', 'Hi. What are you up to?'],
    afterAbsence: ['Well, I was starting to wonder if you\'d forgotten about me.', 'Oh, you\'re back. I expected to hear from you sooner.'],
    positiveReply: ['That\'s good. About time things went right.', 'Nice. You should take me somewhere to celebrate properly.'],
    negativeReply: ['That\'s a shame. You should really sort that out.', 'Hmm. Well, I\'m sure you\'ll figure it out.']
  },
  secretive: {
    greeting: ['Hey.', 'Hi. How are things?'],
    afterAbsence: ['Hey. Missed your messages.', 'Hi.'],
    positiveReply: ['Good for you.', 'Nice.'],
    negativeReply: ['Sorry to hear.', 'That\'s rough.']
  }
}

// ============================================
// INITIAL MESSAGE GENERATION (Career Creation)
// ============================================

export interface InitialMessageContext {
  contactName: string
  contactType: string              // friend, business, partner, rival, etc.
  contactBio?: string              // Full biography
  personalitySummary?: string
  connectionToMotorsport?: string
  meetingContext?: string           // How you met / your relationship history
  traits?: string[]
  conversationTopics?: string[]
  canHelp?: string[]
  occupation?: string
  // Player context
  playerFirstName: string
  playerLastName: string
  playerBackground: string         // self_made, racing_dynasty, tech_investor, etc.
  teamName: string
  relationshipStatus?: string      // dating, married (for partners)
}

const INITIAL_MESSAGE_SYSTEM_PROMPT = `You are writing the VERY FIRST text message that a person sends to a new racing team owner in a motorsport career simulation game.

This message should feel like a real text from someone who ALREADY KNOWS the player. It is NOT a cold introduction — these are existing contacts from before the career started.

CRITICAL RULES:
1. The "Role/Relationship" field defines WHO this person is to the player. This is the MOST IMPORTANT context. An accountant writes about finances. A college friend writes casually about old times. A racing club president writes about grassroots racing.
2. Do NOT make the contact sound like a personal assistant, secretary, or employee UNLESS their occupation literally says "Personal Assistant."
3. If the contact type is "partner" and there is a relationship status (dating/married), write a ROMANTIC/SUPPORTIVE partner message — warm, loving, excited about the team venture. NOT a business or professional message.
4. Reference their actual relationship to the player naturally (don't be heavy-handed).
5. Acknowledge the player's new racing team venture in a way that fits the contact's occupation and personality.
6. The message MUST be a single complete sentence or two. Keep it between 50 and 180 characters. End with punctuation (period, exclamation, question mark, or emoji). Do NOT end mid-sentence.
7. Do NOT offer advice outside this person's expertise.
8. Match the contact's personality traits (e.g. cautious people are measured, enthusiastic people are excited).

Respond with ONLY valid JSON: {"message": "the complete text message"}`

/**
 * Generate a contextually appropriate initial message for a starter contact.
 * Uses Gemini to produce a first message that matches the contact's personality,
 * relationship to the player, and expertise.
 */
export async function generateInitialMessage(
  context: InitialMessageContext
): Promise<string | null> {
  if (!isDialogueAIAvailable()) return null

  const isPartnerContact = context.contactType === 'partner' || !!context.relationshipStatus
  
  const userPrompt = `Generate the first text message from this person to the player:

CONTACT:
- Name: ${context.contactName}
- Role/Relationship to player: ${context.meetingContext || 'Old acquaintance'}
- Occupation: ${context.occupation || 'Unknown'}
- Contact type: ${context.contactType}
${context.contactBio ? `- Background info: ${context.contactBio.slice(0, 250)}` : ''}
${context.personalitySummary ? `- Personality: ${context.personalitySummary.slice(0, 200)}` : ''}
${context.connectionToMotorsport ? `- Motorsport connection: ${context.connectionToMotorsport}` : ''}
${context.traits?.length ? `- Personality traits: ${context.traits.join(', ')}` : ''}
${context.conversationTopics?.length ? `- Usually talks about: ${context.conversationTopics.slice(0, 3).join(', ')}` : ''}
${context.canHelp?.length ? `- Can help with: ${context.canHelp.slice(0, 3).join(', ')}` : ''}

PLAYER:
- Name: ${context.playerFirstName} ${context.playerLastName}
- Background: ${context.playerBackground.replace(/_/g, ' ')}
- Team: ${context.teamName}
${context.relationshipStatus ? `- Relationship with contact: ${context.relationshipStatus}` : ''}

${isPartnerContact 
  ? `IMPORTANT: This is the player's ROMANTIC PARTNER (${context.relationshipStatus}). Write a warm, loving, supportive message about the new racing team. Use affectionate language — they love the player. Do NOT write a business or professional message.`
  : `IMPORTANT: This person's role is "${context.meetingContext || context.occupation || 'acquaintance'}". Write their message from THAT perspective. They are NOT the player's assistant or secretary.`}

Write a COMPLETE text message (end with punctuation or emoji). Keep it under 180 characters. Do NOT leave the message unfinished.`

  try {
    const response = await callGeminiAPI(
      INITIAL_MESSAGE_SYSTEM_PROMPT,
      userPrompt,
      10000,  // Generous token budget to avoid truncation
      { type: 'json_object' }  // Ensure clean JSON without markdown wrapping
    )

    if (!response) return null

    const parsed = safeParseJSON(response)
    if (parsed?.message && typeof parsed.message === 'string') {
      const msg = parsed.message.trim()
      // Accept if complete
      if (msg.length > 10 && looksComplete(msg)) {
        return msg
      }
      // Try to repair truncated messages (trim to last complete sentence)
      const repaired = repairTruncatedMessage(msg)
      if (repaired) {
        console.log('[DialogueAI] Repaired truncated initial message:', repaired.slice(0, 80))
        return repaired
      }
      console.warn('[DialogueAI] Initial message too broken to repair, rejecting:', msg.slice(0, 80))
      return null
    }
    
    // If we can't parse the JSON, try to use the response as-is (strip quotes)
    const cleaned = response.trim().replace(/^["']|["']$/g, '')
    if (cleaned.length > 10 && cleaned.length < 500) {
      if (looksComplete(cleaned)) return cleaned
      const repaired = repairTruncatedMessage(cleaned)
      if (repaired) return repaired
    }

    return null
  } catch (error) {
    console.warn('[DialogueAI] Failed to generate initial message:', error)
    return null
  }
}

/**
 * Check whether a generated message looks complete (not truncated mid-sentence).
 * A complete message ends with punctuation, emoji, or a closing quote.
 */
function looksComplete(text: string): boolean {
  if (!text || text.length === 0) return false
  const trimmed = text.trimEnd()
  // Terminal punctuation, emoji range, closing quotes, or common endings
  const lastChar = trimmed.charAt(trimmed.length - 1)
  // Standard punctuation endings
  if ('.!?…"\')\u201D\u2019'.includes(lastChar)) return true
  // Emoji: check if the last codepoint is in emoji ranges (simplified check)
  const lastCodePoint = trimmed.codePointAt(trimmed.length - (lastChar.length === 2 ? 2 : 1)) || 0
  if (lastCodePoint >= 0x1F300) return true  // Most emoji are above this
  // Common texting endings like "lol", "haha", "ok", etc.
  const lowerEnd = trimmed.slice(-5).toLowerCase()
  if (/(?:lol|haha|ok|yeah|sure|omg|btw|tbh|rn|tho|dude|bro)$/i.test(lowerEnd)) return true
  return false
}

/**
 * Attempt to repair a truncated message by trimming to the last complete sentence.
 * Returns the repaired message or null if nothing salvageable.
 */
function repairTruncatedMessage(text: string): string | null {
  if (!text || text.length < 15) return null
  const trimmed = text.trimEnd()
  
  // Already complete?
  if (looksComplete(trimmed)) return trimmed
  
  // Strategy 1: Find the last sentence-ending punctuation and trim there
  // Look for the last .!? or emoji followed by a space or end-of-string
  const lastSentenceEnd = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('.\u201D'),  // ."
    trimmed.lastIndexOf('!"'),
    trimmed.lastIndexOf('?"'),
  )
  
  if (lastSentenceEnd > 15) {
    // Include the punctuation character
    const repaired = trimmed.slice(0, lastSentenceEnd + 1).trimEnd()
    if (repaired.length > 15 && looksComplete(repaired)) {
      return repaired
    }
  }
  
  // Strategy 2: Find the last .!? at any position
  for (let i = trimmed.length - 1; i >= 15; i--) {
    const ch = trimmed[i]
    if (ch === '.' || ch === '!' || ch === '?') {
      const repaired = trimmed.slice(0, i + 1)
      if (repaired.length > 15) return repaired
    }
  }
  
  // Strategy 3: Find the last emoji
  for (let i = trimmed.length - 1; i >= 15; i--) {
    const cp = trimmed.codePointAt(i) || 0
    if (cp >= 0x1F300) {
      // Include the full emoji (might be 2 code units)
      const end = cp > 0xFFFF ? i + 2 : i + 1
      const repaired = trimmed.slice(0, end)
      if (repaired.length > 15) return repaired
    }
  }
  
  // Strategy 4: If the message is reasonably long (>60 chars), just add an ellipsis
  if (trimmed.length > 60) {
    // Trim to the last word boundary
    const lastSpace = trimmed.lastIndexOf(' ')
    if (lastSpace > 30) {
      return trimmed.slice(0, lastSpace).trimEnd() + '...'
    }
  }
  
  return null
}

/**
 * Generate initial messages for a batch of contacts (parallel, with rate limiting).
 * Returns a map of contactId -> message. Falls back to null for failed generations.
 */
export async function generateInitialMessagesBatch(
  contexts: (InitialMessageContext & { contactId: string })[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // Process in batches of 3 to avoid rate limiting
  for (let i = 0; i < contexts.length; i += 3) {
    const batch = contexts.slice(i, i + 3)
    const batchResults = await Promise.allSettled(
      batch.map(async (ctx) => {
        const msg = await generateInitialMessage(ctx)
        return { id: ctx.contactId, message: msg }
      })
    )
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value.message) {
        results.set(result.value.id, result.value.message)
      }
    }
    
    // Small delay between batches to be nice to the API
    if (i + 3 < contexts.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}

// ============================================
// MESSAGE CHOICE GENERATION
// ============================================

/** Derive an intentTag from category + tone when the AI doesn't provide one (fallback / old cache). */
function inferIntentTag(category: string, tone: string): string {
  // Romantic / flirty categories are the clearest signals
  if (category === 'flirt' || tone === 'flirty') return 'flirting'
  if (category === 'romantic' || tone === 'romantic') return 'romance'
  
  // Map other categories
  if (category === 'support' || tone === 'supportive') return 'supportive'
  if (category === 'apology' || tone === 'apologetic') return 'apologetic'
  if (category === 'tease' || tone === 'playful') return 'banter'
  if (tone === 'confrontational') return 'confrontational'
  if (tone === 'professional') return 'professional'
  if (category === 'invitation' || category === 'make_plans') return 'planning'
  if (category === 'question' || category === 'check_in') return 'curious'
  if (category === 'share_news') return 'news'
  if (category === 'compliment' && tone !== 'flirty') return 'friendly'
  
  // Default
  return 'friendly'
}

const MESSAGE_CHOICE_SYSTEM_PROMPT = `You are a dialogue writer for a racing career simulation game. 
Generate realistic text message options that a racing team owner might send.

IMPORTANT RULES:
1. Generate exactly 4-5 message choices
2. Each choice should have a different tone/approach
3. Include at least one "safe" option and one "bold" option
4. Messages should feel natural, not robotic — real texting style, not formal letters
5. Consider the relationship level - don't be too forward if relationship is low
6. Reference recent events, their interests, or previous conversation topics when relevant
7. Mix lengths: some short (1 sentence), some medium (2-3 sentences), one longer (up to 300 characters)
8. Reference their specific personality, interests, or background from their profile to make messages feel personal
9. If previous conversation topics are provided, follow up on them naturally
10. Match the contact's formality level — casual friends get casual texts, business contacts get professional ones
11. For staff contacts, reference their work domain (engineering, strategy, PR, finance, etc.)
12. For rival drivers, include competitive banter appropriate to their personality type

TOPIC BOUNDARIES (CRITICAL):
13. Keep the conversation within topics this person would ACTUALLY talk about. Check their occupation, interests, and "conversation topics" fields. A journalist should be asked about media/coverage/stories, NOT about investment opportunities. An engineer should be asked about car setup, NOT about PR strategy.
14. The player is a racing team owner — their messages should reflect what they'd naturally discuss with THIS specific person based on their relationship and expertise. Don't generate messages that assume the contact has skills/connections outside their listed profile.
15. If you need to vary topics, pull from the contact's listed interests, their occupation domain, their "how they can help" field, and shared experiences (racing, paddock life, mutual friends). Do NOT invent topics outside their profile.

Respond with ONLY valid JSON in this exact format (no markdown, no backticks, no extra text):
{
  "choices": [
    {
      "category": "greeting|compliment|flirt|check_in|support|apology|invitation|share_news|make_plans|question|small_talk|tease|decline",
      "preview": "Short preview (5-10 words)",
      "fullMessage": "The actual message to send",
      "tone": "friendly|flirty|romantic|supportive|apologetic|casual|excited|playful|professional|concerned|warm|neutral|confrontational",
      "intentTag": "flirting|romance|friendly|supportive|professional|banter|confrontational|apologetic|planning|curious|news",
      "riskLevel": "safe|mild|risky|bold",
      "expectedReaction": "Brief description of likely response"
    }
  ]
}

INTENT TAG RULES (CRITICAL — the player sees these tags to understand the purpose of each reply):
- "flirting": Use when the message is actively trying to create romantic interest (compliments on looks, suggestive language, testing chemistry). This signals "I'm trying to turn this into something romantic."
- "romance": Use when deepening an EXISTING romantic relationship (sweet nothings, love declarations, date planning with a partner). Different from flirting — this is for people already dating/married.
- "friendly": General friendly conversation, catching up, sharing laughs.
- "supportive": Offering comfort, encouragement, or emotional support.
- "professional": Business talk, work matters, career discussions.
- "banter": Playful teasing, jokes, lighthearted ribbing.
- "confrontational": Calling someone out, picking a fight, expressing anger.
- "apologetic": Saying sorry, making amends, damage control.
- "planning": Making plans, scheduling meetups, coordinating logistics.
- "curious": Asking questions, showing genuine interest in their life/work.
- "news": Sharing or reacting to news and events.`

export async function generateMessageChoices(
  context: DialogueGenerationContext
): Promise<MessageChoice[]> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  // Build bio context section if available
  const bioSection = context.bio ? `
THEIR BACKGROUND:
${context.bio.background}

THEIR CAREER:
${context.bio.careerNarrative}

PERSONALITY:
${context.bio.personalityDescription}

CURRENT LIFE:
${context.bio.lifeSituation}

FUN FACTS ABOUT THEM:
${context.bio.anecdotes.map(a => `- ${a}`).join('\n')}
` : ''
  
  // Build extended context sections
  const racingSection = context.racingContext ? `
RACING SITUATION:
${context.racingContext.lastRaces.length > 0 
  ? context.racingContext.lastRaces.map(r => `- ${r.dnf ? 'DNF' : `P${r.position}`} at ${r.track} (${r.series})${r.fastestLap ? ' [fastest lap]' : ''}${r.wetRace ? ' [wet race]' : ''}`).join('\n')
  : '- No recent races'}
${context.racingContext.championshipPosition ? `- Championship: P${context.racingContext.championshipPosition}${context.racingContext.pointsToLeader ? `, ${context.racingContext.pointsToLeader} pts ${context.racingContext.championshipPosition === 1 ? 'ahead' : 'behind leader'}` : ''}` : ''}
${context.racingContext.isRaceWeek ? `- IT IS RACE WEEK at ${context.racingContext.nextRaceTrack}!` : context.racingContext.nextRaceTrack ? `- Next race: ${context.racingContext.nextRaceTrack} in ${context.racingContext.daysUntilNextRace || '?'} days` : ''}
${context.racingContext.consecutiveWins > 1 ? `- On a ${context.racingContext.consecutiveWins}-race winning streak!` : ''}
${context.racingContext.consecutivePodiums > 2 ? `- ${context.racingContext.consecutivePodiums} consecutive podiums` : ''}` : ''

  const teamSection = context.teamContext ? `
TEAM:
- Team: ${context.teamContext.teamName} (${context.teamContext.teamTier})
- Series: ${context.teamContext.seriesNames.join(', ')}
- Staff: ${context.teamContext.staffCount} people
${context.teamContext.teamMorale !== undefined ? `- Team morale: ${context.teamContext.teamMorale > 70 ? 'high' : context.teamContext.teamMorale > 40 ? 'average' : 'low'}` : ''}
${context.teamContext.boardMood !== undefined ? `- Board mood: ${context.teamContext.boardMood > 70 ? 'pleased' : context.teamContext.boardMood > 40 ? 'neutral' : 'unhappy'}` : ''}` : ''

  const financeSection = context.financialContext ? `
FINANCES:
- Cash health: ${context.financialContext.cashHealth}
${context.financialContext.costCapPercent ? `- Cost cap usage: ${context.financialContext.costCapPercent}%` : ''}
${context.financialContext.lifestyleLevel ? `- Lifestyle: ${context.financialContext.lifestyleLevel}` : ''}` : ''

  const personalSection = context.personalContext ? `
PERSONAL LIFE:
${context.personalContext.partnerStatus ? `- Relationship: ${context.personalContext.partnerStatus}` : ''}
${context.personalContext.childrenSummary ? `- Children: ${context.personalContext.childrenSummary}` : ''}
${context.personalContext.activeRivalry ? `- ${context.personalContext.activeRivalry}` : ''}
${context.personalContext.foundationCause ? `- Runs foundation for: ${context.personalContext.foundationCause}` : ''}` : ''

  const topicSection = context.previousTopics && context.previousTopics.length > 0 ? `
PREVIOUS CONVERSATION TOPICS (for memory — ${context.isActiveSession ? 'you may naturally reference these' : 'AVOID repeating recent topics, bring up something NEW'}):
${context.previousTopics.map(t => `- "${t.topic}" (${t.sentiment})${t.summary ? `: ${t.summary}` : ''}`).join('\n')}` : ''

  const historySection = context.recentMessageHistory && context.recentMessageHistory.length > 0 ? `
RECENT MESSAGES IN THIS CONVERSATION:
${context.recentMessageHistory.join('\n')}` : ''

  const staffDomainSection = context.staffDomainContext ? `
THEIR WORK DOMAIN CONTEXT:
${context.staffDomainContext}` : ''

  const rivalSection = context.rivalContext ? `
HEAD-TO-HEAD WITH THIS RIVAL:
${context.rivalContext.recentH2HResult || 'No recent encounters'}
${context.rivalContext.championshipGap !== undefined ? `Championship gap: ${Math.abs(context.rivalContext.championshipGap)} points` : ''}
${context.rivalContext.onTrackIncident ? 'Recent on-track incident between you!' : ''}` : ''

  const sponsorSection = context.sponsorContext ? `
SPONSOR RELATIONSHIP:
- Satisfaction: ${context.sponsorContext.sponsorSatisfaction || 'unknown'}/100
${context.sponsorContext.warningIssued ? '- WARNING ISSUED - they are unhappy' : ''}
${context.sponsorContext.contractWeeksRemaining ? `- Contract expires in ${context.sponsorContext.contractWeeksRemaining} weeks` : ''}` : ''

  const userPrompt = `Generate message options for texting ${context.contactName}.

${context.fullProfileBlock || ''}

RELATIONSHIP WITH YOU:
- Type: ${context.contactType}
- Status: ${context.relationshipStatus || 'acquaintance'}
- Relationship Level: ${context.relationshipLevel}/100
- Affection: ${context.affectionMeter}/100
- Romance: ${context.romanceMeter}/100
- Trust: ${context.trustMeter}/100
${context.romanticEligible ? '- ROMANTICALLY ELIGIBLE: This person is someone the player could potentially develop a romantic relationship with. Flirty message options ARE allowed if the affection level supports it (40+). Include at least one flirty option when affection is above 40.' : ''}
${context.isActiveSession 
  ? '- CURRENTLY TEXTING RIGHT NOW (same day, active conversation in progress)' 
  : context.daysSinceLastContact === 0 
    ? '- Same day, but previous conversation session has ended. This is a NEW conversation.'
    : `- Days since last contact: ${context.daysSinceLastContact}. This is a NEW conversation — do not continue the old topic.`}
- What they know about you: ${context.knowledgeTier || 'public'} knowledge tier
${context.isActiveSession ? '\n⚠️ ACTIVE SESSION: You are in the middle of a live texting conversation RIGHT NOW. Do NOT act as if time has passed or days have gone by. Continue the conversation flow naturally from the recent messages below.' : `\n⚠️ NEW CONVERSATION: The previous chat session has ended${context.daysSinceLastContact > 0 ? ` (${context.daysSinceLastContact} days ago)` : ''}. Generate FRESH openers — a new greeting, a new topic, a new reason to text. Do NOT continue the old conversation thread. Real people start new texts with new topics, not by picking up mid-sentence from last time.`}

THEIR PERSONALITY TRAITS:
${personalityDesc || 'No specific traits known.'}
${bioSection}
THEIR CURRENT STATE:
- Mood: ${context.currentMood} (${context.moodEnergy} energy)
${context.isActiveSession 
  ? (context.lastMessageFromThem ? `- Their last message: "${context.lastMessageFromThem}"` : '- Starting a new conversation')
  : '- This is a fresh conversation. Start with an appropriate opener/greeting.'}
${historySection}
${topicSection}

YOUR CONTEXT (${context.playerName}, racing team owner):
- Current stress: ${context.playerCurrentStress}/100
${context.playerState ? `- Fatigue: ${context.playerState.fatigue}/100, Morale: ${context.playerState.morale}/100, Confidence: ${context.playerState.confidence}/100` : ''}
${context.playerState?.injuryStatus ? `- INJURED: ${context.playerState.injuryStatus}` : ''}
${context.playerState?.pressureLevel ? `- Pressure: ${context.playerState.pressureLevel}` : ''}
${racingSection}
${teamSection}
${financeSection}
${personalSection}
${staffDomainSection}
${rivalSection}
${sponsorSection}

RECENT EVENTS (things ${context.contactName} may know about based on their ${context.knowledgeTier || 'public'} knowledge):
${context.recentEvents.length > 0 
  ? context.recentEvents.map(e => `- ${e.event} (${e.weeksAgo} weeks ago, ${e.wasPositive ? 'positive' : 'negative'})`).join('\n')
  : '- No notable recent events'}

${context.mediaContext?.recentHeadline ? `Latest headline about you: "${context.mediaContext.recentHeadline}"` : ''}
${context.mediaContext?.followerCount ? `Your social media followers: ${(context.mediaContext.followerCount / 1000).toFixed(0)}K` : ''}
${context.lastNpcActionRequest ? `
IMPORTANT — DECLINE OPTION REQUIRED:
The contact just invited you to something: "${context.lastNpcActionRequest}".
You MUST include at least one response option that POLITELY DECLINES the invitation (e.g., "I appreciate the invite but I'm swamped this week", "Rain check? Got a lot on my plate right now").
Mark the decline option with category: "decline" so the system can handle it properly.
The decline should feel natural and not rude — the player should be able to say no gracefully.` : ''}

Generate 4-5 message options. Vary message length (some short, some medium, one longer up to 300 characters). Reference their specific interests, personality, background, or previous conversation topics to make messages feel deeply personal and aware. If it's race week, the conversation should have a racing energy.`

  const response = await callGeminiAPI(
    MESSAGE_CHOICE_SYSTEM_PROMPT,
    userPrompt,
    10000,
    {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          choices: {
            type: 'array',
            minItems: 4,
            maxItems: 5,
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                preview: { type: 'string' },
                fullMessage: { type: 'string' },
                tone: { type: 'string' },
                intentTag: { type: 'string' },
                riskLevel: { type: 'string' },
                expectedReaction: { type: 'string' }
              },
              required: ['category', 'preview', 'fullMessage', 'tone', 'intentTag', 'riskLevel', 'expectedReaction'],
              additionalProperties: false
            }
          }
        },
        required: ['choices'],
        additionalProperties: false
      }
    }
  )
  
  if (response) {
    try {
      const parsed = safeParseJSON(response) as MessageChoiceGeneration
      if (!parsed?.choices || !Array.isArray(parsed.choices)) {
        console.warn('[DialogueAI] Parsed response missing choices array:', parsed)
        return generateFallbackChoices(context)
      }
      return parsed.choices.map((c, i) => ({
        id: `choice_${Date.now()}_${i}`,
        category: c.category as MessageChoiceCategory,
        preview: c.preview,
        fullMessage: c.fullMessage,
        tone: c.tone as MessageTone,
        intentTag: (c.intentTag || inferIntentTag(c.category, c.tone)) as MessageIntentTag,
        riskLevel: c.riskLevel,
        couldBackfire: c.riskLevel === 'risky' || c.riskLevel === 'bold',
        expectedEffects: {},
        likelyResponses: [c.expectedReaction]
      }))
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse message choices:', e)
      console.warn('[DialogueAI] Raw response (first 500 chars):', response.slice(0, 500))
    }
  }
  
  // Fallback to templates
  return generateFallbackChoices(context)
}

// ============================================
// OCCUPATION-BASED ACTION REQUEST GUIDANCE
// ============================================

/**
 * Returns AI prompt guidance constraining what action requests an NPC can offer
 * based on their occupation and contact type.
 */
function getOccupationActionGuidance(contactType: string, fullProfileBlock?: string): string {
  // Extract occupation from profile block if available
  const occupationMatch = fullProfileBlock?.match(/Occupation:\s*(.+)/i)
  const occupation = occupationMatch?.[1]?.trim()?.toLowerCase() || ''
  
  const lines: string[] = ['OCCUPATION CONSTRAINTS FOR ACTION REQUESTS:']
  
  if (occupation.includes('journalist') || occupation.includes('reporter') || occupation.includes('media') || occupation.includes('editor') || occupation.includes('press')) {
    lines.push('- You are a MEDIA/JOURNALISM professional. You can offer: media coverage, interviews, article features, introductions to media/paddock contacts, invitations to press events or social gatherings.')
    lines.push('- You CANNOT offer: investment opportunities, startup deals, business ventures, financial advice, sponsorship deals, or anything outside media/journalism.')
    lines.push('- Allowed actionRequest types: media_request, social_invite, introduction (media/paddock people only), dinner_invite')
  } else if (contactType === 'sponsor_rep') {
    lines.push('- You are a SPONSOR REPRESENTATIVE. You can offer: sponsor-related appearances, brand events, introductions to business contacts, social invitations.')
    lines.push('- Allowed actionRequest types: sponsor_appearance, social_invite, introduction, dinner_invite')
  } else if (contactType === 'team_staff') {
    lines.push('- You are TEAM STAFF. You can offer: work-related advice, social hangouts, team-related introductions.')
    lines.push('- Allowed actionRequest types: advice (work-related only), social_invite, dinner_invite')
  } else if (contactType === 'rival_driver' || contactType === 'rival') {
    lines.push('- You are a RIVAL DRIVER. You can offer: competitive wagers, race tickets to friends/family, social hangouts, competitive banter.')
    lines.push('- Allowed actionRequest types: social_invite, race_tickets, dinner_invite')
  } else if (contactType === 'partner' || contactType === 'potential_date') {
    lines.push('- You are a ROMANTIC INTEREST. You can offer: dates, dinner invitations, social outings, quality time activities.')
    lines.push('- Allowed actionRequest types: date_request, dinner_invite, social_invite')
  } else if (contactType === 'family') {
    lines.push('- You are FAMILY. You can offer: family gatherings, social outings, dinner invitations, advice, charity support.')
    lines.push('- Allowed actionRequest types: social_invite, dinner_invite, advice, charity_ask, race_tickets')
  } else if (occupation.includes('lawyer') || occupation.includes('attorney') || occupation.includes('legal')) {
    lines.push('- You are a LEGAL professional. You can offer: legal advice, contract-related help, introductions to business contacts.')
    lines.push('- Allowed actionRequest types: advice (legal only), introduction, social_invite, dinner_invite')
  } else if (occupation.includes('engineer') || occupation.includes('mechanic') || occupation.includes('technical')) {
    lines.push('- You are a TECHNICAL professional. You can offer: technical advice, engineering insights, introductions to technical contacts.')
    lines.push('- Allowed actionRequest types: advice (technical only), social_invite, dinner_invite, introduction')
  } else if (occupation.includes('financ') || occupation.includes('account') || occupation.includes('banker') || occupation.includes('invest')) {
    lines.push('- You are a FINANCE professional. You can offer: financial advice, investment insights, introductions to financial contacts.')
    lines.push('- Allowed actionRequest types: advice (financial only), career_favor (finance-related only), introduction, social_invite, dinner_invite')
  } else {
    // Generic friend/business contact
    lines.push('- Only offer actionRequests that align with your specific occupation and expertise listed in your profile.')
    lines.push('- Allowed actionRequest types: social_invite, dinner_invite, advice (only in your field), introduction (only to people in your network)')
  }
  
  lines.push('- Do NOT offer career_favor unless it genuinely relates to your occupation. A journalist cannot offer startup leads. A friend cannot offer sponsor deals.')
  
  return lines.join('\n')
}

/**
 * Validate and potentially reject an action request that doesn't fit the contact's profile.
 * This is a hard-code safety net in case the AI ignores the prompt constraints.
 */
function validateActionRequestForContact(
  actionRequest: { type: string; description: string; timeCost?: number; moneyCost?: number; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string },
  contactType: string,
  fullProfileBlock?: string
): typeof actionRequest | null {
  const occupation = (fullProfileBlock?.match(/Occupation:\s*(.+)/i)?.[1]?.trim()?.toLowerCase()) || ''
  let type = actionRequest.type
  
  // Smart fallback: if AI returned an actionRequest without a type, infer from context
  if (!type && actionRequest.description) {
    const desc = actionRequest.description.toLowerCase()
    if (desc.includes('dinner') || desc.includes('restaurant') || desc.includes('eat') || desc.includes('wine') || desc.includes('meal')) {
      type = 'dinner_invite'
    } else if (desc.includes('date') || desc.includes('romantic') || desc.includes('evening together')) {
      type = 'date_request'
    } else if (desc.includes('event') || desc.includes('party') || desc.includes('gathering') || desc.includes('meetup')) {
      type = 'social_invite'
    } else if (desc.includes('interview') || desc.includes('press') || desc.includes('article') || desc.includes('coverage')) {
      type = 'media_request'
    } else if (desc.includes('sponsor') || desc.includes('appearance') || desc.includes('brand')) {
      type = 'sponsor_appearance'
    } else if (desc.includes('charity') || desc.includes('fundrais') || desc.includes('donation')) {
      type = 'charity_ask'
    } else if (desc.includes('introduce') || desc.includes('introduction') || desc.includes('connect you with')) {
      type = 'introduction'
    } else {
      // Default based on contact type
      type = (contactType === 'partner' || contactType === 'potential_date') ? 'dinner_invite' : 'social_invite'
    }
    actionRequest = { ...actionRequest, type }
    console.log(`[DialogueAI] Inferred action request type "${type}" from description for ${contactType} contact`)
  }
  
  if (!type) return null  // No type and no description to infer from
  
  // Universal allowed types for everyone
  const universalAllowed = ['social_invite', 'dinner_invite']
  if (universalAllowed.includes(type)) return actionRequest
  
  // Contact-type-specific allowed types
  const typeAllowMap: Record<string, string[]> = {
    partner: ['date_request', 'social_invite', 'dinner_invite'],
    potential_date: ['date_request', 'social_invite', 'dinner_invite'],
    family: ['social_invite', 'dinner_invite', 'race_tickets', 'advice', 'charity_ask'],
    friend: ['social_invite', 'dinner_invite', 'race_tickets', 'advice', 'charity_ask', 'introduction'],
    team_staff: ['advice', 'social_invite', 'dinner_invite'],
    rival_driver: ['social_invite', 'race_tickets', 'dinner_invite'],
    rival: ['social_invite', 'race_tickets', 'dinner_invite'],
    team_principal: ['social_invite', 'dinner_invite', 'introduction', 'advice'],
    sponsor_rep: ['sponsor_appearance', 'social_invite', 'introduction', 'dinner_invite'],
  }
  
  // Occupation-specific overrides
  if (occupation.includes('journalist') || occupation.includes('reporter') || occupation.includes('media') || occupation.includes('editor')) {
    const journoAllowed = ['media_request', 'social_invite', 'dinner_invite', 'introduction']
    if (!journoAllowed.includes(type)) {
      console.log(`[DialogueAI] Blocked action request type "${type}" from journalist contact (not in allowed list)`)
      return null
    }
    return actionRequest
  }
  
  // Check against type allow map
  const allowed = typeAllowMap[contactType]
  if (allowed && !allowed.includes(type)) {
    console.log(`[DialogueAI] Blocked action request type "${type}" from ${contactType} contact (not in allowed list)`)
    return null
  }
  
  // Block career_favor from non-business contacts
  if (type === 'career_favor' && contactType !== 'business') {
    console.log(`[DialogueAI] Blocked career_favor from non-business contact type "${contactType}"`)
    return null
  }
  
  return actionRequest
}

// ============================================
// NPC RESPONSE GENERATION
// ============================================

const NPC_RESPONSE_SYSTEM_PROMPT = `You are simulating how a SPECIFIC person responds to a text message in a racing career game.
You ARE this character. You must stay completely in character based on the detailed profile provided.

CRITICAL CHARACTER RULES:
1. You ARE this character — use their personality, background, interests, and quirks consistently
2. Reference your specific interests, career, or anecdotes from your profile NATURALLY (don't force it)
3. Never contradict your established personality, traits, or history
4. Your texting style reflects your personality: formal people use proper grammar, casual people use slang, dramatic people use exclamation marks, quiet people send shorter messages
5. Consider your current mood, your relationship level with the player, and your knowledge tier
6. If the player references something you wouldn't know (based on your knowledge tier), react with confusion or curiosity
7. Reference previous conversation topics when relevant (show you remember)
8. Meter changes should be small (-5 to +5 typically) — bigger for milestone moments
9. Only suggest meeting up if it makes sense for your personality and the context
10. If you're a staff member, reference your work domain naturally
11. If you're a rival driver, maintain competitive energy appropriate to your personality type
12. If you're a sponsor rep, balance friendliness with professional sponsorship interests

OCCUPATION & EXPERTISE BOUNDARIES (VERY IMPORTANT):
- You MUST stay within the boundaries of your occupation and expertise. A journalist talks about media, stories, and motorsport coverage — NOT about startup investments or business deals. An engineer talks about cars and technology — NOT about financial advice. A lawyer talks about contracts — NOT about race strategy.
- Do NOT offer help, favours, or propositions outside your professional domain. If you are a journalist, you can offer press coverage, introductions to media contacts, or feedback on public image. You do NOT pitch investment opportunities, startup deals, or business ventures.
- Your conversation topics should align with your listed interests, your occupation, and your "conversation topics" and "how they can help" fields from your profile. Do NOT invent capabilities you don't have.
- If the player tries to steer the conversation into an area outside your expertise, respond naturally as someone who doesn't work in that field — redirect to what you actually know about.

CONVERSATION FLOW (VERY IMPORTANT — follow strictly):
- Not every message requires a substantive reply. If the conversation has reached a natural conclusion, set "shouldEndConversation" to true. Real people don't keep texting indefinitely.
- PLANS CONFIRMED = CONVERSATION OVER. When a time, date, or place has been agreed upon (e.g., "8 PM sounds great!", "See you Friday!", "Perfect, let's do it"), you MUST set "shouldEndConversation" to true. Send a SHORT, warm closing message (e.g., "Can't wait! See you tonight!", "It's a date! ❤️"). Do NOT ask follow-up questions after confirmation. Do NOT try to keep the conversation going.
- GOODBYES = DONE. If the player says goodbye, wraps up, or sends a clear closing message, respond briefly and set "shouldEndConversation" to true.
- Sometimes a simple acknowledgment ("Sounds good!", "Will do!", a thumbs-up) is more natural than a long response. Match the energy of the message you received.
- After 3+ exchanges in a row, lean toward wrapping up naturally rather than introducing new topics. Real texting conversations don't go on forever.

IMPORTANT: Suggest a conversation topic tag in the "topicTag" field — a 1-3 word label for what this exchange is about (e.g., "race_results", "personal_stress", "date_planning", "car_setup", "championship_fight").

INVITATION FREQUENCY (CRITICAL):
- Most conversations should NOT include an actionRequest. Only about 1 in 4-5 conversations should naturally lead to an invitation.
- Do NOT invite the player to something in the FIRST exchange of a new conversation. Let the conversation develop first — invitations should come after 2-3 exchanges minimum.
- If the conversation was just started (first or second message), set actionRequest to null.
- Only include an invitation when it genuinely flows from the conversation topic, NOT as a default way to make the conversation "interesting."
- If you already invited them to something recently (check conversation history), do NOT invite them again.

ACTION REQUESTS: If your response naturally includes an invitation, offer, or request for the player to do something (e.g., inviting them to dinner, offering to introduce a sponsor, asking them to attend an event, requesting a favor), populate the "actionRequest" field. These create real in-game actions the player can accept or decline. Use null if no action is offered. You MUST only suggest actions that make sense for your occupation and character:
- Journalists/media: media_request, social_invite, introduction (to media/paddock people)
- Sponsor reps: sponsor_appearance, social_invite, introduction (to business contacts)
- Friends/family: social_invite, dinner_invite, race_tickets, advice, charity_ask
- Romantic interests: date_request, dinner_invite, social_invite
- Team staff: advice (work-related), social_invite
- Rival drivers: social_invite, race_tickets, wager (competitive)
- Business contacts: introduction, social_invite, dinner_invite, career_favor (ONLY if relevant to their actual profession)
Do NOT use career_favor for things outside your expertise. A journalist should NEVER offer a startup investment lead.
When including an actionRequest, you MUST include ALL of these fields:
- "suggestedDay" (1-7, where 1=Monday, 3=Wednesday, 5=Friday, 6=Saturday, 7=Sunday) — the day of the week for the event
- "suggestedWeek" — the game week number for the event (use the current week from GAME TIME below, or current+1 for next week)
- "eventName" — a short 2-5 word title for the event (e.g., "Luxury Partners Gathering", "Dinner at Nobu", "Charity Gala")
- "venue" (optional) — where the event takes place if mentioned

Respond with ONLY valid JSON in this exact format (no markdown, no backticks, no extra text). Vary response length (short to medium, max 400 chars). Do not include line breaks:
{
  "message": "Their response message",
  "tone": "friendly|confrontational|warm|flirty|concerned|excited|neutral|professional|playful|casual|apologetic",
  "mood": "happy|neutral|sad|angry|excited|worried|romantic|focused|amused",
  "affectionChange": 0,
  "romanceChange": 0,
  "trustChange": 0,
  "emotionalReaction": "delighted|happy|pleased|neutral|disappointed|upset|angry|amused|intrigued",
  "suggestedFollowUp": "Optional hint for player's next message",
  "wantsToMeetUp": false,
  "shouldEndConversation": false,
  "topicTag": "topic_label",
  "actionRequest": null
}`

export async function generateNpcResponse(
  context: DialogueGenerationContext,
  playerMessage: string,
  messageCategory: string
): Promise<NpcResponse> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  const textingStyleBlock = buildTextingStyleBlock(context.traits)
  
  // Build bio context section if available
  const bioSection = context.bio ? `
THEIR BACKGROUND:
${context.bio.background}

THEIR CAREER:
${context.bio.careerNarrative}

DETAILED PERSONALITY:
${context.bio.personalityDescription}

CURRENT LIFE:
${context.bio.lifeSituation}
` : ''
  
  // Build occupation-specific guidance for action requests
  const occupationGuidance = getOccupationActionGuidance(context.contactType, context.fullProfileBlock)
  
  // Build conversation history section so NPC has context of the full exchange
  const npcHistorySection = context.recentMessageHistory && context.recentMessageHistory.length > 0 ? `
CONVERSATION HISTORY (your recent exchange — use this for context):
${context.recentMessageHistory.join('\n')}` : ''
  
  const userPrompt = `Generate ${context.contactName}'s response to this message.

${context.fullProfileBlock || ''}

THEIR PERSONALITY TRAITS:
${personalityDesc || 'No specific traits known.'}
${textingStyleBlock}
${bioSection}
RELATIONSHIP:
- Type: ${context.contactType}
- Status: ${context.relationshipStatus || 'friends'}
- Relationship Level: ${context.relationshipLevel}/100
- Affection: ${context.affectionMeter}/100
- Romance: ${context.romanceMeter}/100
- Trust: ${context.trustMeter}/100

THEIR CURRENT STATE:
- Mood: ${context.currentMood} (${context.moodEnergy} energy)
${context.isActiveSession 
  ? '- You are CURRENTLY texting each other right now (same day, active conversation)' 
  : context.daysSinceLastContact === 0
    ? '- Previous conversation ended earlier today. The player is starting a NEW conversation.'
    : `- Days since you last talked: ${context.daysSinceLastContact}. The player is reaching out fresh.`}
${context.isActiveSession ? '\n⚠️ This is an ACTIVE, LIVE conversation happening right now. Continue naturally from the message below — do NOT greet them as if you haven\'t spoken in a while.' : '\n⚠️ This is a NEW conversation. The player is texting after a break. Respond naturally to their new message — acknowledge the time gap if appropriate, react to what they said, but don\'t just continue the previous conversation topic.'}
${npcHistorySection}

THE MESSAGE THEY RECEIVED:
"${playerMessage}"
(Message type: ${messageCategory})
${(() => {
  const lowerMsg = playerMessage.toLowerCase()
  const confirmPhrases = ['sounds perfect', 'sounds great', 'sounds good', "let's do it", "i'm in", "can't wait", "see you", 'deal', 'perfect', 'count me in', 'absolutely', "it's a date", 'pm is perfect', 'pm is great', 'pm sounds', 'am sounds', 'looking forward']
  const isConfirmation = confirmPhrases.some(p => lowerMsg.includes(p))
  return isConfirmation ? '\n⚠️ PLAN CONFIRMATION DETECTED: The player is agreeing to plans. Send a brief, warm closing message and set shouldEndConversation to TRUE. Do NOT ask follow-up questions or try to extend the conversation.' : ''
})()}

CONTEXT:
${context.recentEvents.length > 0 
  ? context.recentEvents.map(e => `- ${e.event} (${e.weeksAgo} weeks ago)`).join('\n')
  : '- No notable recent events'}

GAME TIME: Week ${context.currentWeek || 1}, Day ${context.currentDay || 1} (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun). Use these for actionRequest scheduling — suggestedWeek should be ${context.currentWeek || 1} (this week) or ${(context.currentWeek || 1) + 1} (next week).

${occupationGuidance}

How does ${context.contactName} respond? Keep it under 400 characters, single line, no line breaks. Their response should reflect their unique background and personality. Stay strictly within their occupation and expertise — do NOT have them offer things outside their profession. They might reference their career, interests, or life experiences naturally in conversation. If the conversation has reached a natural conclusion or plans have been confirmed, you MUST set shouldEndConversation to true and keep your response SHORT.`

  const response = await callGeminiAPI(
    NPC_RESPONSE_SYSTEM_PROMPT,
    userPrompt,
    10000,
    {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          tone: { type: 'string' },
          mood: { type: 'string' },
          affectionChange: { type: 'number' },
          romanceChange: { type: 'number' },
          trustChange: { type: 'number' },
          emotionalReaction: { type: 'string' },
          suggestedFollowUp: { type: 'string' },
          wantsToMeetUp: { type: 'boolean' },
          shouldEndConversation: { type: 'boolean' },
          topicTag: { type: 'string' },
          actionRequest: {
            type: ['object', 'null'],
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              timeCost: { type: 'number' },
              moneyCost: { type: 'number' },
              suggestedDay: { type: 'number' },
              suggestedWeek: { type: 'number' },
              eventName: { type: 'string' },
              venue: { type: 'string' }
            },
            required: ['type', 'description']
          }
        },
        required: ['message', 'tone', 'mood', 'affectionChange', 'romanceChange', 'trustChange', 'emotionalReaction', 'suggestedFollowUp', 'wantsToMeetUp', 'shouldEndConversation', 'topicTag'],
        additionalProperties: false
      }
    }
  )
  
  if (response) {
    try {
      const parsed = safeParseJSON(response) as NpcResponseGeneration
      // Validate action request against occupation constraints
      let validatedActionRequest = parsed.actionRequest ?? null
      if (validatedActionRequest) {
        validatedActionRequest = validateActionRequestForContact(validatedActionRequest, context.contactType, context.fullProfileBlock)
      }
      
      return {
        message: parsed.message,
        tone: parsed.tone as MessageTone,
        mood: parsed.mood,
        affectionChange: Math.max(-10, Math.min(10, parsed.affectionChange)),
        romanceChange: Math.max(-10, Math.min(10, parsed.romanceChange)),
        trustChange: Math.max(-10, Math.min(10, parsed.trustChange)),
        emotionalReaction: parsed.emotionalReaction as NpcResponse['emotionalReaction'],
        suggestedFollowUp: parsed.suggestedFollowUp,
        wantsToMeetUp: parsed.wantsToMeetUp,
        shouldEndConversation: parsed.shouldEndConversation ?? false,
        actionRequest: validatedActionRequest
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse NPC response:', e)
    }
  }
  
  // Fallback
  return generateFallbackResponse(context, playerMessage, messageCategory)
}

// ============================================
// GIFT REACTION GENERATION
// ============================================

export interface GiftReactionContext {
  contactName: string
  traits: string[]
  relationshipLevel: number
  giftName: string
  giftValue: number
  occasion?: string
  theirPreferences?: string[]
}

export interface GiftReaction {
  message: string
  reaction: 'loved' | 'liked' | 'neutral' | 'disappointed'
  affectionChange: number
  trustChange: number
}

const GIFT_REACTION_SYSTEM_PROMPT = `You are simulating how someone reacts to receiving a gift.
Consider their personality, the gift, and the occasion.

Respond with ONLY valid JSON:
{
  "message": "Their reaction message",
  "reaction": "loved|liked|neutral|disappointed",
  "affectionChange": 0,
  "trustChange": 0
}`

export async function generateGiftReaction(
  context: GiftReactionContext
): Promise<GiftReaction> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `How does ${context.contactName} react to receiving this gift?

THEIR PERSONALITY:
${personalityDesc}

GIFT DETAILS:
- Gift: ${context.giftName}
- Value: $${context.giftValue.toLocaleString()}
${context.occasion ? `- Occasion: ${context.occasion}` : '- No special occasion'}

RELATIONSHIP LEVEL: ${context.relationshipLevel}/100
${context.theirPreferences ? `\nTHEIR KNOWN PREFERENCES: ${context.theirPreferences.join(', ')}` : ''}`

  const response = await callGeminiAPI(GIFT_REACTION_SYSTEM_PROMPT, userPrompt, 10000)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      return {
        message: parsed.message,
        reaction: parsed.reaction,
        affectionChange: Math.max(-5, Math.min(15, parsed.affectionChange)),
        trustChange: Math.max(-5, Math.min(10, parsed.trustChange))
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse gift reaction:', e)
    }
  }
  
  // Fallback
  return {
    message: `Thank you for the ${context.giftName}! That's so thoughtful.`,
    reaction: 'liked',
    affectionChange: 3,
    trustChange: 1
  }
}

// ============================================
// DATE MOMENT GENERATION
// ============================================

export interface DateMomentContext {
  contactName: string
  traits: string[]
  relationshipLevel: number
  dateType: string
  location: string
  momentInDate: 'arrival' | 'during' | 'end'
}

export interface DateMoment {
  description: string
  playerOptions: {
    choice: string
    outcome: string
    affectionChange: number
  }[]
}

const DATE_MOMENT_SYSTEM_PROMPT = `You are generating a romantic moment during a date for a game.
Create an interesting situation with 3 player choice options.

Respond with ONLY valid JSON:
{
  "description": "What's happening in this moment",
  "playerOptions": [
    {
      "choice": "What player can say/do",
      "outcome": "What happens",
      "affectionChange": 0
    }
  ]
}`

export async function generateDateMoment(
  context: DateMomentContext
): Promise<DateMoment> {
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `Generate a ${context.momentInDate} moment during a ${context.dateType} with ${context.contactName}.

THEIR PERSONALITY:
${personalityDesc}

DATE DETAILS:
- Type: ${context.dateType}
- Location: ${context.location}
- Relationship Level: ${context.relationshipLevel}/100
- Moment: ${context.momentInDate === 'arrival' ? 'Just arrived' : context.momentInDate === 'during' ? 'Middle of date' : 'End of date'}

Generate an interesting moment with 3 player choices.`

  const response = await callGeminiAPI(DATE_MOMENT_SYSTEM_PROMPT, userPrompt, 10000)
  
  if (response) {
    try {
      return safeParseJSON(response)
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse date moment:', e)
    }
  }
  
  // Fallback
  return {
    description: `You're enjoying a nice ${context.dateType} with ${context.contactName}.`,
    playerOptions: [
      { choice: 'Compliment them', outcome: 'They smile warmly', affectionChange: 2 },
      { choice: 'Share a funny story', outcome: 'They laugh', affectionChange: 1 },
      { choice: 'Ask about their day', outcome: 'They appreciate your interest', affectionChange: 1 }
    ]
  }
}

// ============================================
// SOCIAL MEDIA COMMENT GENERATION
// ============================================

export interface SocialCommentContext {
  postTopic: string
  postTone: string
  followerCount: number
  controversyLevel: number
  trollDensity: number
}

export interface GeneratedComments {
  positive: { username: string; content: string }[]
  negative: { username: string; content: string }[]
  neutral: { username: string; content: string }[]
}

const SOCIAL_COMMENTS_SYSTEM_PROMPT = `Generate realistic social media comments for a racing team owner's post.
Include a mix of supportive fans, critics, and trolls based on the context.

Respond with ONLY valid JSON:
{
  "positive": [{"username": "@fan123", "content": "comment"}],
  "negative": [{"username": "@hater99", "content": "comment"}],
  "neutral": [{"username": "@user", "content": "comment"}]
}`

export async function generateSocialComments(
  context: SocialCommentContext
): Promise<GeneratedComments> {
  const userPrompt = `Generate comments for a social media post.

POST DETAILS:
- Topic: ${context.postTopic}
- Tone: ${context.postTone}
- Follower count: ${context.followerCount.toLocaleString()}
- Controversy level: ${context.controversyLevel}/100
- Troll density: ${context.trollDensity}/100

Generate 3 positive, 2 negative, and 2 neutral comments.`

  const response = await callGeminiAPI(SOCIAL_COMMENTS_SYSTEM_PROMPT, userPrompt, 10000)
  
  if (response) {
    try {
      return safeParseJSON(response)
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse social comments:', e)
    }
  }
  
  // Fallback
  return {
    positive: [
      { username: '@racingfan2024', content: 'Great post! Keep up the good work!' },
      { username: '@speedster99', content: 'Legend! 🔥' }
    ],
    negative: [
      { username: '@critic123', content: 'Overrated...' }
    ],
    neutral: [
      { username: '@observer', content: 'Interesting' }
    ]
  }
}

// ============================================
// SOCIAL CHARACTER BIO GENERATION
// ============================================

export interface SocialBioContext {
  name: string
  age: number
  gender?: 'male' | 'female'
  occupation?: string
  nationality?: string
  traits: string[]
  interests?: string[]
  metAt?: string
  contactType: 'partner' | 'family' | 'friend' | 'business' | 'rival' | 'potential_date'
  // Partner-specific
  origin?: string          // PartnerOrigin for partners
  career?: string          // PartnerCareer for partners
}

const SOCIAL_BIO_SYSTEM_PROMPT = `You are a character writer for a racing career simulation game.
Generate a rich, believable backstory and personality profile for an NPC that the player meets socially.

IMPORTANT RULES:
1. Write in third person ("She is...", "He grew up...")
2. Make the background feel grounded and realistic, not fantastical
3. The character lives in the world of motorsport glamour, high society, and jet-setting
4. Anecdotes should be specific, memorable, and help the player connect with the character
5. Keep all text concise - this is for a game UI, not a novel
6. The personality description should naturally weave in their traits
7. The life situation should feel current and dynamic

Respond with ONLY valid JSON in this exact format:
{
  "background": "2-3 sentences about where they grew up, family background, and what shaped them",
  "careerNarrative": "1-2 sentences about their professional journey and current work life",
  "anecdotes": ["fun fact 1", "fun fact 2", "fun fact 3"],
  "personalityDescription": "A paragraph (3-4 sentences) that describes how they come across in person, weaving in their personality traits naturally",
  "lifeSituation": "1 sentence about their current life context or recent change"
}`

/**
 * Generate a rich bio for a social character using AI.
 *
 * Lookup priority:
 *   1. Pre-generated Content Studio data (instant, no API call)
 *   2. Gemini AI generation (async API call)
 *   3. Template-based fallback (sync, always works)
 */
export async function generateSocialBio(
  context: SocialBioContext
): Promise<SocialBio> {
  // ── 1. Try pre-generated content first ──
  try {
    const { isContentLoaded, getStaffById, getPartnerById, getContactById, extractStaffBio, extractPartnerBio, extractContactBio } = await import('@/services/preGeneratedContentService')

    if (isContentLoaded()) {
      // Try to match by name (pre-gen entities use their full name as a lookup key)
      const nameId = context.name?.replace(/\s+/g, '-').toLowerCase()

      // Check staff pool
      const staffMatch = getStaffById(nameId) || getStaffById(context.name)
      if (staffMatch) {
        const bio = extractStaffBio(staffMatch)
        console.log(`[DialogueAI] Using pre-generated staff bio for ${context.name}`)
        return bio
      }

      // Check partner pool
      const partnerMatch = getPartnerById(nameId) || getPartnerById(context.name)
      if (partnerMatch) {
        const bio = extractPartnerBio(partnerMatch)
        console.log(`[DialogueAI] Using pre-generated partner bio for ${context.name}`)
        return bio
      }

      // Check contact pool
      const contactMatch = getContactById(nameId) || getContactById(context.name)
      if (contactMatch) {
        const bio = extractContactBio(contactMatch)
        console.log(`[DialogueAI] Using pre-generated contact bio for ${context.name}`)
        return bio
      }
    }
  } catch {
    // Pre-gen service not available, continue to Gemini
  }

  // ── 2. Gemini AI generation ──
  const personalityDesc = getPersonalityPrompt(context.traits)
  
  const userPrompt = `Generate a character profile for ${context.name}.

CHARACTER DETAILS:
- Name: ${context.name}
- Age: ${context.age}
- Gender: ${context.gender || 'unknown'}
- Occupation: ${context.occupation || 'unknown'}
- Nationality: ${context.nationality || 'unknown'}
- Contact Type: ${context.contactType}
${context.origin ? `- How they met the player: ${context.origin.replace(/_/g, ' ')}` : ''}
${context.career ? `- Career field: ${context.career.replace(/_/g, ' ')}` : ''}

PERSONALITY TRAITS: ${context.traits.join(', ')}
${personalityDesc ? `\nTRAIT DESCRIPTIONS:\n${personalityDesc}` : ''}

${context.interests && context.interests.length > 0 ? `INTERESTS: ${context.interests.join(', ')}` : ''}

WORLD CONTEXT:
This person exists in the world of Formula racing. The player is a racing team owner who is wealthy and famous. Generate a backstory appropriate for someone a racing team owner would meet ${context.metAt ? `at a ${context.metAt}` : 'socially'}.

Generate a compelling, realistic character profile.`

  const response = await callGeminiAPI(SOCIAL_BIO_SYSTEM_PROMPT, userPrompt, 10000)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      return {
        background: parsed.background || '',
        careerNarrative: parsed.careerNarrative || '',
        anecdotes: Array.isArray(parsed.anecdotes) ? parsed.anecdotes.slice(0, 3) : [],
        personalityDescription: parsed.personalityDescription || '',
        lifeSituation: parsed.lifeSituation || ''
      }
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse social bio:', e)
    }
  }
  
  // ── 3. Template-based fallback ──
  return generateFallbackSocialBio(context)
}

/**
 * Generate a batch of social bios efficiently (for migration).
 * Checks pre-generated data first, then sends remaining to Gemini in batches.
 */
export async function generateSocialBioBatch(
  contexts: SocialBioContext[]
): Promise<Map<string, SocialBio>> {
  const results = new Map<string, SocialBio>()
  
  if (contexts.length === 0) return results

  // ── 1. Try pre-generated data for each context ──
  const remaining: SocialBioContext[] = []
  try {
    const { isContentLoaded, getStaffById, getPartnerById, getContactById, extractStaffBio, extractPartnerBio, extractContactBio } = await import('@/services/preGeneratedContentService')

    if (isContentLoaded()) {
      for (const ctx of contexts) {
        const nameId = ctx.name?.replace(/\s+/g, '-').toLowerCase()
        
        const staffMatch = getStaffById(nameId) || getStaffById(ctx.name)
        if (staffMatch) { results.set(ctx.name, extractStaffBio(staffMatch)); continue }

        const partnerMatch = getPartnerById(nameId) || getPartnerById(ctx.name)
        if (partnerMatch) { results.set(ctx.name, extractPartnerBio(partnerMatch)); continue }

        const contactMatch = getContactById(nameId) || getContactById(ctx.name)
        if (contactMatch) { results.set(ctx.name, extractContactBio(contactMatch)); continue }

        remaining.push(ctx)
      }

      if (results.size > 0) {
        console.log(`[DialogueAI] Resolved ${results.size}/${contexts.length} bios from pre-generated data`)
      }
    } else {
      remaining.push(...contexts)
    }
  } catch {
    remaining.push(...contexts)
  }

  if (remaining.length === 0) return results

  // ── 2. Gemini batch for remaining contexts ──
  const batchSize = Math.min(5, remaining.length)
  const batch = remaining.slice(0, batchSize)
  
  const characterSummaries = batch.map((ctx, i) => 
    `CHARACTER ${i + 1} (${ctx.name}):
- Age: ${ctx.age}, Gender: ${ctx.gender || 'unknown'}
- Occupation: ${ctx.occupation || 'unknown'}, Nationality: ${ctx.nationality || 'unknown'}
- Traits: ${ctx.traits.join(', ')}
${ctx.interests ? `- Interests: ${ctx.interests.join(', ')}` : ''}
- Contact Type: ${ctx.contactType}
${ctx.metAt ? `- Met at: ${ctx.metAt}` : ''}`
  ).join('\n\n')

  const batchSystemPrompt = `You are a character writer for a racing career simulation game.
Generate rich, believable backstories for multiple NPCs. The player is a racing team owner.

Respond with ONLY valid JSON as an array:
[
  {
    "name": "Character Name",
    "background": "2-3 sentences",
    "careerNarrative": "1-2 sentences",
    "anecdotes": ["fact 1", "fact 2", "fact 3"],
    "personalityDescription": "3-4 sentence paragraph",
    "lifeSituation": "1 sentence"
  }
]`

  const userPrompt = `Generate character profiles for these ${batch.length} characters:\n\n${characterSummaries}`

  const response = await callGeminiAPI(batchSystemPrompt, userPrompt, 10000)
  
  if (response) {
    try {
      const parsed = safeParseJSON(response)
      const bios = Array.isArray(parsed) ? parsed : [parsed]
      
      bios.forEach((bio: any, i: number) => {
        if (i < batch.length) {
          results.set(batch[i].name, {
            background: bio.background || '',
            careerNarrative: bio.careerNarrative || '',
            anecdotes: Array.isArray(bio.anecdotes) ? bio.anecdotes.slice(0, 3) : [],
            personalityDescription: bio.personalityDescription || '',
            lifeSituation: bio.lifeSituation || ''
          })
        }
      })
    } catch (e) {
      console.warn('[DialogueAI] Failed to parse bio batch:', e)
    }
  }
  
  // Fill in any missing with fallbacks
  for (const ctx of batch) {
    if (!results.has(ctx.name)) {
      results.set(ctx.name, generateFallbackSocialBio(ctx))
    }
  }
  
  // Handle remaining characters beyond the batch with individual fallbacks
  for (let i = batchSize; i < remaining.length; i++) {
    results.set(remaining[i].name, generateFallbackSocialBio(remaining[i]))
  }
  
  return results
}

// ============================================
// TEMPLATE-BASED BIO FALLBACK
// ============================================

const BACKGROUND_TEMPLATES = {
  origins: [
    'grew up in a close-knit family in {city}',
    'was raised in the bustling heart of {city}',
    'spent their formative years in {city}, surrounded by {influence}',
    'comes from a well-connected family in {city}',
    'had a cosmopolitan upbringing, splitting time between {city} and the countryside'
  ],
  influences: [
    'art and culture', 'business and entrepreneurship', 'academia and science',
    'sports and competition', 'music and creativity', 'travel and adventure'
  ],
  cities: {
    // Core nationalities (keep legacy + full nationality key)
    'American': ['New York', 'Los Angeles', 'Miami', 'San Francisco', 'Chicago'],
    'British': ['London', 'Manchester', 'Edinburgh', 'Oxford', 'Brighton'],
    'French': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'],
    'Italian': ['Milan', 'Rome', 'Florence', 'Turin', 'Naples'],
    'German': ['Munich', 'Berlin', 'Hamburg', 'Frankfurt', 'Stuttgart'],
    'Spanish': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Marbella'],
    'Australian': ['Sydney', 'Melbourne', 'Gold Coast', 'Perth', 'Brisbane'],
    'Brazilian': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Curitiba'],
    'Japanese': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
    // Duplicate full-country keys for legacy compat
    'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Oxford', 'Brighton'],
    'United States': ['New York', 'Los Angeles', 'Miami', 'San Francisco', 'Chicago'],
    'Monaco': ['Monte Carlo', 'Monaco-Ville', 'La Condamine', 'Fontvieille'],
    'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    // New expanded nationalities
    'Dutch': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    'Finnish': ['Helsinki', 'Tampere', 'Turku', 'Espoo'],
    'Austrian': ['Vienna', 'Salzburg', 'Graz', 'Innsbruck'],
    'Belgian': ['Brussels', 'Antwerp', 'Ghent', 'Bruges'],
    'Swiss': ['Zurich', 'Geneva', 'Basel', 'Lausanne'],
    'Danish': ['Copenhagen', 'Aarhus', 'Odense'],
    'Swedish': ['Stockholm', 'Gothenburg', 'Malmö'],
    'Norwegian': ['Oslo', 'Bergen', 'Stavanger', 'Tromsø'],
    'Polish': ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw'],
    'Czech': ['Prague', 'Brno', 'Ostrava'],
    'Hungarian': ['Budapest', 'Debrecen', 'Szeged'],
    'Portuguese': ['Lisbon', 'Porto', 'Faro', 'Cascais'],
    'Greek': ['Athens', 'Thessaloniki', 'Mykonos', 'Santorini'],
    'Irish': ['Dublin', 'Cork', 'Galway', 'Limerick'],
    'Romanian': ['Bucharest', 'Cluj-Napoca', 'Timisoara'],
    'Croatian': ['Zagreb', 'Split', 'Dubrovnik'],
    'Serbian': ['Belgrade', 'Novi Sad', 'Nis'],
    'Ukrainian': ['Kyiv', 'Lviv', 'Odesa', 'Kharkiv'],
    'Turkish': ['Istanbul', 'Ankara', 'Izmir', 'Antalya'],
    'Russian': ['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan'],
    'Monegasque': ['Monte Carlo', 'Monaco-Ville', 'La Condamine'],
    'Luxembourgish': ['Luxembourg City', 'Esch-sur-Alzette'],
    // Americas
    'Argentine': ['Buenos Aires', 'Mendoza', 'Córdoba', 'Rosario'],
    'Mexican': ['Mexico City', 'Monterrey', 'Guadalajara', 'Cancún'],
    'Canadian': ['Toronto', 'Montreal', 'Vancouver', 'Calgary'],
    'Colombian': ['Bogotá', 'Medellín', 'Cartagena', 'Cali'],
    'Chilean': ['Santiago', 'Valparaíso', 'Viña del Mar'],
    'Venezuelan': ['Caracas', 'Maracaibo', 'Valencia'],
    'Peruvian': ['Lima', 'Cusco', 'Arequipa'],
    'Uruguayan': ['Montevideo', 'Punta del Este'],
    // Asia & Pacific
    'Chinese': ['Shanghai', 'Beijing', 'Shenzhen', 'Hong Kong', 'Guangzhou'],
    'South Korean': ['Seoul', 'Busan', 'Incheon', 'Jeju'],
    'Indian': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Thai': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
    'Indonesian': ['Jakarta', 'Bali', 'Surabaya', 'Yogyakarta'],
    'Filipino': ['Manila', 'Cebu', 'Davao'],
    'New Zealander': ['Auckland', 'Wellington', 'Queenstown', 'Christchurch'],
    'Singaporean': ['Singapore'],
    'Malaysian': ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
    'Vietnamese': ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
    'Taiwanese': ['Taipei', 'Kaohsiung', 'Taichung'],
    // Africa & Middle East
    'South African': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'],
    'Nigerian': ['Lagos', 'Abuja', 'Port Harcourt'],
    'Kenyan': ['Nairobi', 'Mombasa', 'Nakuru'],
    'Moroccan': ['Casablanca', 'Marrakech', 'Rabat', 'Tangier'],
    'Egyptian': ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
    'Emirati': ['Dubai', 'Abu Dhabi', 'Sharjah'],
    'Saudi': ['Riyadh', 'Jeddah', 'Dammam'],
    'Israeli': ['Tel Aviv', 'Jerusalem', 'Haifa'],
    'Lebanese': ['Beirut', 'Byblos', 'Tripoli'],
    'Qatari': ['Doha', 'Al Wakrah', 'Lusail'],
    'Bahraini': ['Manama', 'Muharraq', 'Riffa'],
    'Ghanaian': ['Accra', 'Kumasi', 'Tamale']
  } as Record<string, string[]>
}

const CAREER_NARRATIVES: Record<string, string[]> = {
  'Marketing Executive': [
    'Built a reputation in luxury brand marketing before pivoting to the automotive world.',
    'Climbed the ranks at a top agency and now leads campaigns for premium lifestyle brands.'
  ],
  'Doctor': [
    'Completed residency at a prestigious teaching hospital and now practices in private medicine.',
    'Specializes in sports medicine, which naturally draws them into the racing world.'
  ],
  'Lawyer': [
    'Works at a top-tier firm handling high-profile corporate cases and celebrity clients.',
    'Specializes in international commercial law, often dealing with motorsport contracts.'
  ],
  'Architect': [
    'Designs luxury residences and commercial spaces for high-net-worth clients.',
    'Known for blending modern aesthetics with sustainable design principles.'
  ],
  'Investment Banker': [
    'Manages portfolios for ultra-high-net-worth individuals in the sports and entertainment sector.',
    'Made a name in M&A deals involving luxury automotive brands.'
  ],
  'Fashion Designer': [
    'Launched their own label after years working at major fashion houses in Milan and Paris.',
    'Their collections often draw inspiration from motorsport aesthetics and engineering.'
  ],
  'Tech Entrepreneur': [
    'Founded a successful startup and now scouts for the next big thing in automotive tech.',
    'Built and sold a tech company, now angel investing in racing-adjacent ventures.'
  ],
  'Journalist': [
    'Covers the intersection of luxury, sport, and celebrity for a major international publication.',
    'Started in local news and worked their way up to covering the motorsport beat globally.'
  ],
  'Actress': [
    'Has appeared in several critically acclaimed films and is a fixture on the festival circuit.',
    'Rose to fame through a breakout role and now balances acting with producing.'
  ],
  'Model': [
    'Has graced the covers of major fashion magazines and walked for top designers.',
    'Transitioned from modeling into brand ambassadorship and lifestyle curation.'
  ],
  'Pilot': [
    'Flies private jets for executives and celebrities, with a passion for aviation history.',
    'Trained in the military before transitioning to civilian aviation in the luxury sector.'
  ],
  'Event Planner': [
    'Orchestrates exclusive galas and private parties for the elite motorsport community.',
    'Known for creating unforgettable experiences at Grand Prix weekends.'
  ],
  'Real Estate Developer': [
    'Develops luxury properties in Monaco, Dubai, and other jet-set destinations.',
    'Has a keen eye for locations where the racing elite want to live.'
  ],
  'Art Gallery Owner': [
    'Curates exhibitions that attract collectors from the motorsport and luxury worlds.',
    'Turned a passion for contemporary art into a thriving gallery business.'
  ],
  'Restaurant Owner': [
    'Runs acclaimed restaurants in cities that host Grand Prix events.',
    'Their flagship restaurant is a favorite post-race destination for drivers and team owners.'
  ],
  'Music Producer': [
    'Has produced chart-topping albums and is a regular at exclusive after-parties.',
    'Blends their love of electronic music with the high-energy world of motorsport.'
  ],
  'Fitness Trainer': [
    'Trains elite athletes and celebrities, specializing in performance and recovery.',
    'Built a fitness empire catering to high-profile clients in the sports world.'
  ],
  'Photographer': [
    'Captures moments at Grand Prix events and high-society gatherings for top publications.',
    'Known for intimate portrait work that reveals the person behind the public image.'
  ],
  'PR Manager': [
    'Manages crisis communications and image for high-profile personalities in motorsport.',
    'Has a reputation for turning bad press into career opportunities for their clients.'
  ],
  'Venture Capitalist': [
    'Invests in early-stage companies with a focus on automotive and clean energy.',
    'Has a portfolio that includes several racing-adjacent tech companies.'
  ],
  'Charity Director': [
    'Runs a major international charity focused on youth development through sport.',
    'Connects the wealthy motorsport community with causes that make a real difference.'
  ],
  'Social Media Influencer': [
    'Built a massive following documenting the glamorous side of the racing world.',
    'Parlayed social media fame into brand deals with luxury and automotive companies.'
  ],
  // NEW: Expanded occupation career narratives
  'Hedge Fund Manager': [
    'Runs a multi-billion fund focused on sports and entertainment assets.',
    'Made their fortune timing market shifts and now enjoys the spoils at racetracks worldwide.'
  ],
  'Private Equity Partner': [
    'Specializes in acquiring and growing luxury lifestyle brands.',
    'Led several high-profile buyouts in the automotive and hospitality sectors.'
  ],
  'Financial Advisor': [
    'Manages wealth for athletes and entertainers, understanding their unique financial needs.',
    'Built a boutique firm that caters exclusively to the motorsport community.'
  ],
  'Cryptocurrency Trader': [
    'Made an early fortune in crypto and now divides time between trading and the social circuit.',
    'Known in fintech circles for bold bets that usually pay off.'
  ],
  'Day Trader': [
    'Lives by the markets and thrives on the adrenaline of rapid-fire decisions.',
    'Treats trading like a sport, tracking performance metrics obsessively.'
  ],
  'Accountant': [
    'Handles complex financial structures for racing teams and luxury businesses.',
    'Known for being the discreet financial backbone behind several high-profile personalities.'
  ],
  'Insurance Broker': [
    'Specializes in insuring supercars, yachts, and high-value racing assets.',
    'Has an encyclopedic knowledge of risk that makes for surprisingly fascinating conversation.'
  ],
  'Management Consultant': [
    'Advises corporations on strategy, often traveling between global offices.',
    'Brings analytical rigor to every conversation, whether about business or weekend plans.'
  ],
  'CEO': [
    'Runs a company and is used to making decisions that affect hundreds of people.',
    'Built a company from scratch and now enjoys the lifestyle their success affords.'
  ],
  'CFO': [
    'Oversees finances for a major corporation, balancing budgets worth billions.',
    'Has a sharp analytical mind that extends to every aspect of life.'
  ],
  'Business Development Director': [
    'Opens new markets for their firm, traveling extensively across continents.',
    'Has a gift for spotting opportunities and building partnerships from scratch.'
  ],
  'Property Manager': [
    'Oversees luxury property portfolios in Monaco, London, and Dubai.',
    'Knows the real estate market inside and out, always scouting the next investment.'
  ],
  'Software Engineer': [
    'Builds cutting-edge applications and has a deep appreciation for precision engineering.',
    'Worked at top tech companies before going freelance to enjoy a more flexible lifestyle.'
  ],
  'AI Researcher': [
    'Pushes the boundaries of artificial intelligence at a leading research lab.',
    'Fascinated by the parallels between machine learning and racing strategy optimization.'
  ],
  'Robotics Engineer': [
    'Designs autonomous systems and sees motorsport as the ultimate proving ground.',
    'Their work bridges the gap between factory automation and cutting-edge racing tech.'
  ],
  'Data Scientist': [
    'Analyzes massive datasets to uncover patterns, a skill that translates well to race strategy.',
    'Built prediction models used by sports betting firms before moving into consultancy.'
  ],
  'Game Developer': [
    'Creates immersive gaming experiences and is a massive motorsport fan.',
    'Worked on a popular racing simulation and brings insider knowledge to conversations.'
  ],
  'Cybersecurity Expert': [
    'Protects high-value organizations from digital threats, maintaining a low but powerful profile.',
    'Has a quiet intensity that comes from years of working in high-stakes digital warfare.'
  ],
  'UX Designer': [
    'Designs intuitive digital experiences for luxury brands and tech startups.',
    'Has an eye for detail and aesthetics that extends to all aspects of life.'
  ],
  'CTO': [
    'Leads technology strategy for a fast-growing company, bridging vision and execution.',
    'Known for spotting tech trends early and translating them into business advantages.'
  ],
  'Product Manager': [
    'Ships products used by millions, balancing user needs with business goals.',
    'Has a methodical approach to problem-solving that serves them well socially too.'
  ],
  'Blockchain Developer': [
    'Builds decentralized applications and is deeply invested in the future of digital ownership.',
    'Attends crypto conferences and racing events with equal enthusiasm.'
  ],
  'Surgeon': [
    'Performs life-saving operations and carries the calm confidence of someone used to high-pressure decisions.',
    'Specializes in reconstructive surgery and has treated several racing accident survivors.'
  ],
  'Physiotherapist': [
    'Works with elite athletes to optimize performance and recovery.',
    'Has treated several racing drivers and understands the physical demands of the sport.'
  ],
  'Sports Psychologist': [
    'Helps athletes master the mental game, from pre-race nerves to post-season burnout.',
    'Brings a unique understanding of high-performance mindsets to every conversation.'
  ],
  'Dentist': [
    'Runs a high-end practice catering to celebrity and sports clientele.',
    'Has a perfectionist streak that extends far beyond dental work.'
  ],
  'Veterinarian': [
    'Cares for animals with the same dedication others bring to human medicine.',
    'Has a gentle, nurturing nature that makes everyone around them feel at ease.'
  ],
  'Pharmacist': [
    'Runs a successful pharmacy chain with locations near major sporting venues.',
    'Has deep knowledge of health and wellness that they happily share.'
  ],
  'Nutritionist': [
    'Advises elite athletes on optimal nutrition for peak performance.',
    'Helped several racing drivers fine-tune their diets for better race-day concentration.'
  ],
  'Dermatologist': [
    'Has a thriving practice and is known for their expertise in skincare for outdoor athletes.',
    'Combines medical precision with an aesthetic eye that shows in everything they do.'
  ],
  'Psychiatrist': [
    'Helps high-achievers navigate the psychological pressures of public life.',
    'Brings deep empathy and insight to conversations, making people feel truly heard.'
  ],
  'Neuroscientist': [
    'Studies the brain at a leading research institution, fascinated by human performance.',
    'Can explain the neuroscience behind split-second racing decisions with infectious enthusiasm.'
  ],
  'Marine Biologist': [
    'Studies ocean ecosystems and has traveled to some of the most remote places on Earth.',
    'Brings a perspective shaped by nature that contrasts beautifully with the glamorous racing world.'
  ],
  'Judge': [
    'Presides over complex cases and carries an air of authority softened by fairness.',
    'Has seen it all from the bench and brings wisdom and perspective to social settings.'
  ],
  'Diplomat': [
    'Navigates international relations with tact and grace honed over decades.',
    'Has lived in numerous countries and speaks several languages fluently.'
  ],
  'Ambassador': [
    'Represents their country abroad and moves through diplomatic circles with ease.',
    'Their social calendar rivals that of any celebrity, spanning state dinners to Grand Prix events.'
  ],
  'Patent Attorney': [
    'Protects cutting-edge innovations, including several motorsport technologies.',
    'Has a precise mind that appreciates both the legal and engineering sides of racing.'
  ],
  'Human Rights Lawyer': [
    'Fights for justice internationally and brings passion and principle to everything they do.',
    'Uses their racing connections to raise awareness for human rights causes.'
  ],
  'Policy Advisor': [
    'Shapes government policy on sport, transport, or energy - all areas that touch motorsport.',
    'Has insider knowledge of regulatory landscapes that makes for fascinating conversation.'
  ],
  'Tax Attorney': [
    'Helps high-net-worth individuals navigate complex international tax structures.',
    'Knows exactly how racing drivers and team owners structure their finances.'
  ],
  'Lobbyist': [
    'Influences policy decisions behind the scenes with charm and strategic thinking.',
    'Has connections in both government and industry that span the globe.'
  ],
  'Film Director': [
    'Has directed critically acclaimed films and brings a cinematic perspective to everything.',
    'Currently working on a documentary about the intersection of speed, danger, and human ambition.'
  ],
  'Screenwriter': [
    'Crafts compelling stories for screen and stage, always observing the world for material.',
    'Once pitched a racing drama that drew on real paddock stories (names changed, of course).'
  ],
  'Interior Designer': [
    'Creates stunning living spaces for the rich and famous across Europe.',
    'Has designed the homes of several racing personalities and team principals.'
  ],
  'Choreographer': [
    'Directs movement for stage and screen, bringing artistic vision to performance.',
    'Sees parallels between the precision of dance and the precision of racing.'
  ],
  'Author': [
    'Has published several bestselling novels and brings a storyteller\'s eye to every encounter.',
    'Currently researching a book set in the world of motorsport.'
  ],
  'Painter': [
    'Creates large-scale works that have been exhibited in galleries worldwide.',
    'Has done commissioned pieces for racing teams, capturing the energy of the sport.'
  ],
  'Sculptor': [
    'Works with metal and stone to create pieces that bridge art and engineering.',
    'Has created trophy designs for several prestigious racing events.'
  ],
  'Animator': [
    'Brings characters and worlds to life through animation at a major studio.',
    'Has a playful, creative energy that makes them fun to be around.'
  ],
  'Graphic Designer': [
    'Creates visual identities for brands, including several in the motorsport space.',
    'Has an eye for color, composition, and detail that extends to all aspects of life.'
  ],
  'DJ': [
    'Plays sets at exclusive clubs and Grand Prix afterparties around the world.',
    'Has a unique ability to read a room and create the perfect atmosphere.'
  ],
  'Musician': [
    'Performs and records music that blends genres in unexpected ways.',
    'Has played at several racing events and charity concerts in the paddock.'
  ],
  'Art Curator': [
    'Manages exhibitions at a prestigious gallery, connecting artists with collectors.',
    'Has an encyclopedic knowledge of art history and a sharp eye for emerging talent.'
  ],
  'Documentary Filmmaker': [
    'Creates compelling documentaries about human achievement and extreme sports.',
    'Currently filming a series about the personal lives of racing personalities.'
  ],
  'Racing Driver': [
    'Competes at a professional level and shares the same passion for speed.',
    'Understands the demands of the racing calendar better than anyone.'
  ],
  'Personal Trainer': [
    'Transforms bodies and mindsets for elite clients who demand results.',
    'Has trained several racing drivers to peak physical condition.'
  ],
  'Sports Agent': [
    'Represents athletes and negotiates contracts worth millions.',
    'Knows every team principal, sponsor, and media contact in the motorsport world.'
  ],
  'Sports Commentator': [
    'Brings races to life for millions of viewers with expert analysis and enthusiasm.',
    'A familiar face in the paddock who knows everyone and everything about the sport.'
  ],
  'Olympic Athlete': [
    'Competed at the highest level and brings elite athletic discipline to daily life.',
    'Now retired from competition but still deeply connected to the world of sport.'
  ],
  'Coach': [
    'Mentors aspiring athletes and has an instinct for unlocking human potential.',
    'Brings a motivational energy to social settings that lifts everyone around them.'
  ],
  'Yoga Instructor': [
    'Teaches mindfulness and movement to high-profile clients seeking balance.',
    'Brings a calm, centered presence that contrasts nicely with the racing world.'
  ],
  'Equestrian': [
    'Competes in show jumping and shares the same love of precision and courage.',
    'Moves between the equestrian and motorsport worlds with equal comfort.'
  ],
  'Professional Golfer': [
    'Competes on the pro circuit and shares the same sponsor relationships as racing.',
    'Known for their calm under pressure, a trait honed on championship courses.'
  ],
  'Chef': [
    'Runs a Michelin-starred restaurant that is a favorite among the racing elite.',
    'Creates culinary experiences that rival the excitement of race day.'
  ],
  'Sommelier': [
    'Has an extraordinary palate and can recommend the perfect wine for any occasion.',
    'Works at an exclusive restaurant frequented by the motorsport community.'
  ],
  'Hotel Manager': [
    'Runs a luxury hotel that hosts racing teams and celebrities during Grand Prix weekends.',
    'Has an impeccable attention to detail and a gift for making people feel welcome.'
  ],
  'Concierge': [
    'Arranges the impossible for ultra-high-net-worth clients as a lifestyle concierge.',
    'Has a contact list that reads like a who\'s who of the global elite.'
  ],
  'Luxury Travel Agent': [
    'Designs bespoke travel experiences for clients who expect the extraordinary.',
    'Plans race-weekend itineraries that combine the best of sport and leisure.'
  ],
  'Casino Manager': [
    'Runs operations at one of Monaco\'s legendary casinos.',
    'Understands risk and reward in a way that resonates with racing personalities.'
  ],
  'Nightclub Owner': [
    'Owns the hottest venues in Ibiza, Monaco, and Miami.',
    'Their parties during race weekends are the most sought-after invitations.'
  ],
  'Wine Merchant': [
    'Sources rare vintages for private collectors and exclusive restaurants.',
    'Has a passion for terroir that parallels the precision of motorsport engineering.'
  ],
  'Vineyard Owner': [
    'Produces award-winning wines at their estate in Tuscany, Napa, or Bordeaux.',
    'Invites racing friends to harvest season celebrations at their vineyard.'
  ],
  'Yacht Captain': [
    'Commands luxury vessels for the ultra-wealthy around the Mediterranean.',
    'Docks in Monaco for the Grand Prix every year, becoming a fixture of race weekend.'
  ],
  'Yacht Broker': [
    'Sells multi-million dollar yachts to the motorsport and entertainment elite.',
    'Understands the luxury lifestyle from the inside and can talk boats for hours.'
  ],
  'Aviation Consultant': [
    'Advises racing teams and wealthy individuals on private aviation solutions.',
    'Has logged thousands of flight hours and brings calm authority to any situation.'
  ],
  'Professor': [
    'Holds a chair at a prestigious university and brings academic depth to conversations.',
    'Studies a subject that occasionally intersects with the world of motorsport.'
  ],
  'Researcher': [
    'Conducts groundbreaking research that pushes the boundaries of human knowledge.',
    'Brings intellectual curiosity and rigor to social settings in a refreshing way.'
  ],
  'University Dean': [
    'Leads one of the world\'s top academic institutions with vision and authority.',
    'Moves between the academic and social elite with equal comfort.'
  ],
  'Archaeologist': [
    'Uncovers ancient civilizations and brings incredible stories from excavation sites.',
    'Has a sense of adventure and discovery that makes them endlessly fascinating.'
  ],
  'Jeweler': [
    'Creates bespoke pieces for royalty, celebrities, and the racing elite.',
    'Has an eye for beauty and craftsmanship that makes their work truly exceptional.'
  ],
  'Perfumer': [
    'Creates exclusive fragrances for a prestigious fashion house.',
    'Has an extraordinary sense of smell and an appreciation for subtlety in all things.'
  ],
  'Antique Dealer': [
    'Trades in rare antiques and has a showroom that attracts collectors from around the world.',
    'Can tell the history of any object at a glance and loves sharing those stories.'
  ],
  'Auctioneer': [
    'Commands the room at major auction houses, selling art and collectibles worth millions.',
    'Has a commanding presence and theatrical flair that makes them unforgettable.'
  ],
  'Private Investigator': [
    'Handles discreet investigations for high-profile clients, including racing teams.',
    'Has an observant, analytical mind and notices things others miss.'
  ],
  'Life Coach': [
    'Guides high-achievers through career transitions and personal growth.',
    'Has a gift for asking the right questions and helping people see their own potential.'
  ],
  'Stylist': [
    'Styles celebrities and athletes for public appearances and magazine covers.',
    'Has an eye for fashion that transforms how people present themselves to the world.'
  ],
  'Winemaker': [
    'Crafts exceptional wines using traditional methods at a boutique winery.',
    'Brings the same patience and precision to life that they bring to winemaking.'
  ],
  'Military Officer (Retired)': [
    'Served with distinction and now applies military discipline to business ventures.',
    'Carries an air of authority and calm that comes from years of service.'
  ],
  'Astronaut (Retired)': [
    'Has seen Earth from space and brings a profound perspective to everything.',
    'Now works in aerospace consulting and is a sought-after speaker on human achievement.'
  ],
  // Partner career types
  'model': ['Has graced the covers of major fashion magazines and walked for top designers.'],
  'athlete': ['Competes at an elite level and shares the same drive and discipline as a racing team owner.'],
  'business_exec': ['Runs a division at a multinational corporation, balancing boardroom pressure with social grace.'],
  'doctor': ['Practices medicine at a prestigious institution, bringing a grounded perspective to the jet-set world.'],
  'lawyer': ['Handles high-profile cases that occasionally intersect with the motorsport world.'],
  'entrepreneur': ['Built a business from the ground up and understands the pressures of leadership firsthand.'],
  'artist': ['Creates work that has been exhibited internationally, bringing a creative and free-spirited energy.'],
  'journalist': ['Covers the world of luxury, sport, and celebrity, with insider access everywhere.'],
  'scientist': ['Conducts cutting-edge research, bringing intellectual depth and curiosity to every conversation.'],
  'socialite': ['Moves through high society with ease, knowing everyone worth knowing in the paddock and beyond.'],
  'racing_driver': ['Shares the same passion for speed and competition, creating an instant connection.'],
  'engineer': ['Has a technical mind that appreciates the engineering side of motorsport.'],
  'team_staff': ['Works in the motorsport industry, understanding the demands and rhythms of the racing calendar.'],
  'none': ['Is between career chapters, taking time to figure out the next move.']
}

const PERSONALITY_DESCRIPTIONS_TEMPLATE: Record<string, string[]> = {
  supportive: [
    'the kind of person who remembers the small things and checks in when times are tough',
    'always the first to celebrate others\' wins and offer a shoulder during losses'
  ],
  ambitious: [
    'driven by clear goals and doesn\'t settle for anything less than excellence',
    'has a competitive edge that makes them both inspiring and occasionally intense'
  ],
  romantic: [
    'believes in grand gestures and meaningful moments',
    'has a way of making people feel like the only person in the room'
  ],
  adventurous: [
    'always planning the next trip or trying something new',
    'gets restless with routine and thrives on spontaneity'
  ],
  intellectual: [
    'can hold a conversation on almost anything and loves learning',
    'approaches life with curiosity and values depth over small talk'
  ],
  caring: [
    'has a natural warmth that puts everyone at ease',
    'genuinely invests in the wellbeing of people around them'
  ],
  humorous: [
    'can find humor in almost any situation and loves to make people laugh',
    'has a quick wit that keeps conversations lively and entertaining'
  ],
  sophisticated: [
    'moves through social situations with effortless grace and poise',
    'has refined tastes and an appreciation for the finer things'
  ],
  creative: [
    'sees the world differently and brings a unique perspective to everything',
    'always working on some project or idea that sparks their imagination'
  ],
  confident: [
    'carries themselves with a quiet assurance that commands attention',
    'knows what they want and isn\'t afraid to go after it'
  ],
  independent: [
    'values their own space and doesn\'t need anyone else to feel complete',
    'has built a life they\'re proud of on their own terms'
  ],
  passionate: [
    'throws themselves wholeheartedly into whatever catches their interest',
    'has an infectious energy when talking about things they care about'
  ],
  loyal: [
    'the kind of person who stands by you no matter what',
    'values deep, lasting connections over surface-level socializing'
  ],
  spontaneous: [
    'lives in the moment and makes every day an adventure',
    'has a knack for turning ordinary plans into unforgettable experiences'
  ],
  thoughtful: [
    'notices details others miss and remembers what matters to people',
    'takes time to consider things carefully before acting'
  ],
  charismatic: [
    'draws people in with natural magnetism and genuine interest',
    'has a presence that lights up any room they walk into'
  ],
  driven: [
    'relentlessly pursues their goals with focus and determination',
    'inspires others with their work ethic and vision'
  ],
  compassionate: [
    'feels deeply for others and goes out of their way to help',
    'brings empathy and understanding to every interaction'
  ],
  elegant: [
    'carries themselves with timeless grace and understated style',
    'appreciates beauty in all forms, from fashion to art to conversation'
  ],
  witty: [
    'always has a clever remark ready and keeps conversations sparkling',
    'has a sharp mind that makes even mundane topics entertaining'
  ],
  // Partner-specific traits
  jealous: [
    'can be possessive and needs frequent reassurance',
    'watches closely and sometimes reads too much into situations'
  ],
  social_butterfly: [
    'thrives in social settings and knows everyone at every event',
    'has an enormous social circle and loves bringing people together'
  ],
  private: [
    'guards their personal life carefully and avoids the spotlight',
    'prefers intimate gatherings to large public events'
  ],
  glamorous: [
    'always impeccably dressed and turns heads wherever they go',
    'has a taste for luxury and expects nothing less'
  ],
  practical: [
    'grounded and sensible, preferring substance over flash',
    'values genuine effort and authenticity over expensive gestures'
  ],
  nurturing: [
    'has a natural instinct to take care of people around them',
    'dreams of building a warm, loving family environment'
  ],
  racing_enthusiast: [
    'genuinely passionate about motorsport, not just the glamour',
    'can talk about racing strategy and engineering as easily as fashion'
  ],
  high_maintenance: [
    'expects the best in everything and isn\'t shy about saying so',
    'has exacting standards that can be both impressive and demanding'
  ],
  // NEW: Expanded positive traits
  generous: [
    'gives freely of their time, money, and attention without keeping score',
    'the kind of person who picks up the check before anyone notices'
  ],
  optimistic: [
    'sees possibility where others see problems, bringing infectious positivity',
    'has an unshakeable belief that things will work out, which can be both inspiring and frustrating'
  ],
  empathetic: [
    'feels deeply what others are going through and responds with genuine understanding',
    'has an almost uncanny ability to read people and anticipate their needs'
  ],
  patient: [
    'rarely rushes into things and gives people the space they need',
    'has a calm steadiness that makes them an anchor in any social situation'
  ],
  reliable: [
    'the person everyone calls when they need something done right',
    'shows up when they say they will and follows through on every promise'
  ],
  humble: [
    'downplays their achievements and lets their work speak for itself',
    'has accomplished more than most but you\'d never know it from talking to them'
  ],
  sincere: [
    'means exactly what they say and expects the same from others',
    'brings a refreshing honesty to conversations that can be disarming'
  ],
  warm: [
    'makes everyone feel welcome from the first moment of meeting',
    'has an inviting energy that turns strangers into friends quickly'
  ],
  disciplined: [
    'approaches life with structure and self-control that borders on impressive',
    'sets goals and achieves them methodically, whether in career or personal life'
  ],
  grateful: [
    'never takes anything for granted and expresses appreciation openly',
    'has a grounded perspective that comes from remembering where they started'
  ],
  playful: [
    'approaches life with a lightness that makes everyday moments fun',
    'has a childlike sense of wonder that they\'ve never lost'
  ],
  'open-minded': [
    'willing to try anything once and genuinely curious about different perspectives',
    'approaches new ideas and cultures with enthusiasm rather than judgment'
  ],
  principled: [
    'has a strong moral compass and stands by their values even when it\'s hard',
    'earns deep respect through their unwavering integrity'
  ],
  forgiving: [
    'doesn\'t hold grudges and gives people second chances',
    'believes in moving forward and not letting resentment weigh things down'
  ],
  // NEW: Negative traits
  materialistic: [
    'measures success in material possessions and isn\'t shy about flaunting wealth',
    'has expensive tastes and a tendency to judge others by what they own'
  ],
  secretive: [
    'keeps their cards close to their chest and reveals very little about themselves',
    'has an air of mystery that can be intriguing but also isolating'
  ],
  controlling: [
    'likes things done their way and struggles when others don\'t comply',
    'has a need for control that can make spontaneity feel threatening'
  ],
  impulsive: [
    'acts first and thinks later, which leads to both great adventures and regrettable decisions',
    'has a reckless streak that can be exciting in the moment but exhausting over time'
  ],
  arrogant: [
    'carries an air of superiority that can rub people the wrong way',
    'has genuine talent but an ego that sometimes overshadows it'
  ],
  cynical: [
    'sees hidden motives in everything and trusts very few people',
    'has been burned enough times to approach the world with deep skepticism'
  ],
  unreliable: [
    'has a habit of cancelling plans and not following through on commitments',
    'means well but consistently lets people down when it matters most'
  ],
  dramatic: [
    'turns every minor inconvenience into a crisis and thrives on emotional intensity',
    'has a flair for theatrics that can be entertaining but also exhausting'
  ],
  gossipy: [
    'knows everyone\'s business and can\'t resist sharing the latest scoop',
    'is a social hub but struggles to keep confidences'
  ],
  workaholic: [
    'defines themselves through their career and struggles to switch off',
    'cancels plans for work so often that friends have stopped being surprised'
  ],
  aloof: [
    'keeps an emotional distance that can feel cold or disinterested',
    'takes a long time to warm up and many people give up before they do'
  ],
  manipulative: [
    'has a talent for getting what they want, often at others\' expense',
    'plays social chess several moves ahead, which can be impressive and unsettling'
  ],
  vain: [
    'obsessively concerned with their appearance and how others perceive them',
    'spends more time in front of the mirror than most and expects constant compliments'
  ],
  entitled: [
    'expects special treatment everywhere and becomes difficult when they don\'t get it',
    'grew up with privilege and assumes the world revolves around their needs'
  ],
  petty: [
    'holds onto small grievances and brings them up at the worst possible times',
    'keeps a mental tally of perceived slights that surprises people with its detail'
  ],
  'passive-aggressive': [
    'expresses displeasure through subtle digs and silent treatment rather than direct confrontation',
    'says "it\'s fine" when it clearly isn\'t, leaving others to decode the real message'
  ],
  judgmental: [
    'forms strong opinions quickly and isn\'t afraid to share them, even when unsolicited',
    'has high standards for everyone around them that few can consistently meet'
  ],
  'self-centered': [
    'steers every conversation back to themselves and their experiences',
    'genuinely doesn\'t realize how little they ask about other people\'s lives'
  ],
  impatient: [
    'wants everything done yesterday and visibly struggles when things take time',
    'has a restless energy that makes waiting feel like torture'
  ],
  reckless: [
    'takes risks that others would consider foolish and somehow usually lands on their feet',
    'lives like there\'s no tomorrow, which is exciting until consequences catch up'
  ],
  dismissive: [
    'brushes off other people\'s concerns with frustrating ease',
    'has a habit of minimizing things that matter to others while magnifying their own issues'
  ],
  argumentative: [
    'will debate anything and everything, turning casual conversations into heated discussions',
    'has strong opinions on topics most people don\'t even think about'
  ],
  condescending: [
    'talks down to people without realizing it, making others feel small',
    'has a way of explaining things that implies everyone else is a step behind'
  ],
  // NEW: Complex / neutral traits
  perfectionist: [
    'holds themselves and others to impossibly high standards',
    'produces exceptional work but at the cost of constant stress and dissatisfaction'
  ],
  'old-fashioned': [
    'values tradition and manners in a world that often moves too fast for their taste',
    'has a charm that comes from a different era, which some find refreshing and others find limiting'
  ],
  restless: [
    'always looking for the next thing and struggles to stay in one place or role for long',
    'has a wandering spirit that makes them exciting but hard to pin down'
  ],
  competitive: [
    'turns everything into a contest and hates losing more than they love winning',
    'pushes themselves and others to excel, which can be motivating or exhausting'
  ],
  stubborn: [
    'once they\'ve made up their mind, nothing can change it',
    'has an iron will that serves them well in career but creates friction in relationships'
  ],
  sarcastic: [
    'uses humor as both a shield and a weapon, keeping people at arm\'s length',
    'has a razor-sharp wit that can be hilarious or cutting depending on the target'
  ],
  intense: [
    'approaches everything with a depth of focus and emotion that can be overwhelming',
    'doesn\'t know how to do anything at half-measure'
  ],
  mysterious: [
    'reveals themselves slowly, like a novel you can\'t put down',
    'has an enigmatic quality that makes people want to know more'
  ],
  reserved: [
    'takes time to open up but is deeply loyal once they do',
    'observes more than they speak, choosing their words carefully'
  ],
  idealistic: [
    'believes the world can be better and isn\'t afraid to say so',
    'sometimes struggles with the gap between how things are and how they should be'
  ],
  eccentric: [
    'marches to the beat of their own drum in a way that\'s either delightful or bewildering',
    'has unusual habits and interests that make them unforgettable'
  ],
  blunt: [
    'says exactly what they think, which is refreshing until it\'s about you',
    'values honesty over tact, sometimes to the detriment of social harmony'
  ],
  calculating: [
    'thinks several steps ahead in every situation, a trait that serves them well in business',
    'approaches relationships strategically, which some find impressive and others find cold'
  ],
  overprotective: [
    'guards the people they care about fiercely, sometimes to a suffocating degree',
    'their concern comes from a good place but can feel controlling'
  ],
  nostalgic: [
    'lives partly in the past, always comparing present experiences to cherished memories',
    'has a sentimental streak that makes them deeply romantic but sometimes resistant to change'
  ],
  mischievous: [
    'has a playful streak and loves pushing boundaries just to see what happens',
    'always the one with a twinkle in their eye and a plan for some harmless trouble'
  ],
  rebellious: [
    'instinctively pushes back against authority and convention',
    'has a nonconformist spirit that makes them either thrilling or exhausting to be around'
  ],
  obsessive: [
    'when they get interested in something, they go all in to an extraordinary degree',
    'has deep expertise in niche topics because they can\'t let things go half-explored'
  ],
  opinionated: [
    'has strong views on everything and is never short of something to say',
    'makes conversations lively but sometimes steamrolls quieter voices'
  ],
  fiery: [
    'burns with a passionate intensity that can be both attractive and volatile',
    'quick to anger but just as quick to forgive, living life at emotional full-throttle'
  ]
}

const LIFE_SITUATIONS = [
  'Recently relocated to {city} to be closer to the European racing circuit.',
  'Just returned from an extended trip abroad and is settling back into social life.',
  'Going through an exciting career transition that has them buzzing with energy.',
  'Recently launched a new project and is looking for like-minded people to connect with.',
  'Has been focusing on personal growth and is in a great place right now.',
  'Just moved into a new place in {city} and is rediscovering the local scene.',
  'Is at a crossroads professionally and open to new opportunities and connections.',
  'Recently achieved a major milestone and is celebrating by expanding their social circle.',
  'Balancing a busy career with a desire to enjoy life more outside of work.',
  'Has been traveling extensively and is looking to put down roots for a while.',
  'Just got out of a long relationship and is rediscovering who they are.',
  'Recently became single after years of marriage and is navigating a new chapter.',
  'Moved to {city} on a whim after a life-changing trip that shifted their perspective.',
  'Is recovering from a career setback but determined to come back stronger.',
  'Just received a major promotion and is adjusting to a more visible, demanding role.',
  'Sold their business last year and is figuring out what to do with newfound freedom.',
  'Recently inherited a family estate near {city} and is deciding whether to settle there.',
  'Training for their first marathon while juggling a demanding career.',
  'Has been volunteering abroad and just returned with a broader worldview.',
  'Is writing a book about their experiences and is looking for new stories to tell.',
  'Just adopted a rescue dog and their social life now revolves around the dog park.',
  'Recently got into investing and is obsessed with learning about new markets.',
  'Is in the middle of renovating a villa near {city} and loves talking about the process.',
  'Just celebrated a birthday milestone and is feeling reflective about what comes next.',
  'Split time between {city} and another city, always on the move between two lives.'
]

const ANECDOTE_TEMPLATES = [
  'Once accidentally walked into the wrong VIP lounge at a Grand Prix and ended up making three new business contacts.',
  'Has a hidden talent for {hobby} that surprises everyone who finds out.',
  'Speaks {languages} languages fluently, picked up from years of international living.',
  'Is secretly an excellent cook who specializes in {cuisine} cuisine.',
  'Once ran into a celebrity at {place} and didn\'t recognize them, leading to a hilarious conversation.',
  'Has a collection of {collectible} that they\'re quietly proud of.',
  'Trained in {skill} as a teenager and still practices when no one is watching.',
  'Their go-to karaoke song is always something unexpectedly {genre}.',
  'Volunteers anonymously at a local {charity_type} every month.',
  'Has an irrational fear of {fear} that they try very hard to hide.',
  'Once won a bet by {achievement} and still brings it up at parties.',
  'Their phone background is a photo of {sentimental_thing}, which tells you everything about their priorities.',
  'Can name every Grand Prix winner from the last decade, despite claiming not to follow racing that closely.',
  'Has a morning routine that involves {routine} and refuses to start the day without it.',
  'Keeps a journal that they\'ve maintained since they were {journal_age} years old.',
  // NEW: More diverse anecdotes
  'Once got lost in {city_random} for three hours and considers it one of the best days of their life.',
  'Has a secret playlist of {genre} that they would never admit to listening to publicly.',
  'Was once mistaken for a famous person at {place} and played along for an entire evening.',
  'Keeps a detailed spreadsheet tracking every restaurant they\'ve ever eaten at, with ratings.',
  'Can fix almost anything mechanical, a skill inherited from a parent who was a {mechanical_relative}.',
  'Has been skydiving {skydive_count} times and plans to do it at least once more this year.',
  'Once cooked dinner for {celebrity_count} people at a charity event and somehow pulled it off.',
  'Their most prized possession is a signed {memorabilia} that they found at a flea market.',
  'Secretly writes {creative_hobby} under a pen name that even their closest friends don\'t know.',
  'Was a competitive {youth_sport} player as a teenager and still follows the sport closely.',
  'Has a tattoo that they got during a trip to {tattoo_city} that has a meaning only they know.',
  'Once accidentally booked a hotel in the wrong country and decided to just go with it.',
  'Learned to {unusual_skill} during lockdown and now does it almost obsessively.',
  'Has an alter ego that comes out specifically at karaoke nights.',
  'Made a pact with a friend to {pact_goal} by age 40, and they\'re determined to keep it.'
]

const ANECDOTE_FILLS: Record<string, string[]> = {
  hobby: ['painting watercolors', 'playing the piano', 'doing stand-up comedy', 'woodworking', 'salsa dancing', 'pottery', 'baking sourdough', 'playing chess competitively', 'restoring vintage motorcycles', 'knitting', 'DJing'],
  languages: ['three', 'four', 'three', 'two', 'five'],
  cuisine: ['Italian', 'Japanese', 'French', 'Thai', 'Argentinian', 'Mediterranean', 'Korean', 'Mexican', 'Indian', 'Moroccan'],
  place: ['an airport lounge', 'a coffee shop in Monaco', 'a charity gala', 'a ski resort', 'a yacht party', 'a bookshop in Paris', 'a Tokyo ramen shop', 'a London members\' club'],
  collectible: ['vintage watches', 'first-edition books', 'rare vinyl records', 'antique maps', 'racing memorabilia', 'vintage motorsport posters', 'classic car models', 'limited-edition sneakers'],
  skill: ['fencing', 'classical piano', 'martial arts', 'ballet', 'sailing', 'archery', 'boxing', 'figure skating', 'competitive swimming'],
  genre: ['80s power ballad', 'country', 'opera', 'punk rock', 'jazz standard', 'K-pop', 'death metal', 'Bollywood musical number', 'Disney soundtrack'],
  charity_type: ['animal shelter', 'youth mentoring program', 'food bank', 'hospital', 'children\'s literacy program', 'refugee support center'],
  fear: ['pigeons', 'escalators', 'clowns', 'thunderstorms', 'butterflies', 'revolving doors', 'mascots', 'deep water', 'house spiders'],
  achievement: ['eating an entire pizza in under 10 minutes', 'doing a backflip on a dare', 'correctly guessing every race winner in a season', 'holding their breath for three minutes', 'finishing a triathlon on zero training'],
  sentimental_thing: ['their childhood pet', 'a sunset they caught in Santorini', 'their parents on their wedding day', 'a mountain they climbed last summer', 'their first car', 'a handwritten letter from someone special'],
  routine: ['a specific brand of espresso', 'a 5K run', 'twenty minutes of meditation', 'reading the news in three languages', 'cold plunge followed by breathing exercises', 'journaling and green tea'],
  journal_age: ['fourteen', 'sixteen', 'twelve', 'fifteen', 'ten'],
  // NEW: fills for expanded anecdote templates
  city_random: ['Tokyo', 'Marrakech', 'Buenos Aires', 'Istanbul', 'Lisbon', 'Bangkok', 'Prague', 'Havana'],
  mechanical_relative: ['mechanic', 'carpenter', 'engineer', 'boat builder', 'watchmaker'],
  skydive_count: ['seven', 'twelve', 'twenty', 'five', 'thirty'],
  celebrity_count: ['forty', 'sixty', 'eighty', 'a hundred'],
  memorabilia: ['racing helmet', 'guitar', 'first-edition novel', 'film poster', 'basketball jersey'],
  creative_hobby: ['poetry', 'short fiction', 'a food blog', 'song lyrics', 'mystery novels'],
  youth_sport: ['tennis', 'football', 'swimming', 'volleyball', 'basketball', 'hockey', 'athletics'],
  tattoo_city: ['Tokyo', 'Barcelona', 'Bali', 'New York', 'Bangkok', 'Berlin'],
  unusual_skill: ['solve a Rubik\'s cube in under two minutes', 'do handstands', 'make sourdough bread from scratch', 'juggle', 'do magic card tricks'],
  pact_goal: ['run a marathon together', 'visit every continent', 'start a business together', 'learn to surf']
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillAnecdote(template: string): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const options = ANECDOTE_FILLS[key]
    return options ? pickRandom(options) : match
  })
}

function getCityForNationality(nationality: string): string {
  const cities = BACKGROUND_TEMPLATES.cities[nationality]
  if (cities && cities.length > 0) {
    return pickRandom(cities)
  }
  return pickRandom(['London', 'Paris', 'New York', 'Milan', 'Monaco'])
}

/**
 * Template-based fallback bio generation when AI is unavailable
 */
export function generateFallbackSocialBio(context: SocialBioContext): SocialBio {
  const city = getCityForNationality(context.nationality || 'British')
  const influence = pickRandom(BACKGROUND_TEMPLATES.influences)
  
  // Background
  const originTemplate = pickRandom(BACKGROUND_TEMPLATES.origins)
  const originSentence = originTemplate
    .replace('{city}', city)
    .replace('{influence}', influence)
  
  const educationSnippets = [
    `After studying abroad, ${context.name.split(' ')[0]} found their way into the world of ${context.occupation || 'their profession'}.`,
    `${context.name.split(' ')[0]} always had a drive to succeed, which led them naturally into ${context.occupation || 'their field'}.`,
    `A chance encounter at university set ${context.name.split(' ')[0]} on the path to becoming ${context.occupation ? `a ${context.occupation}` : 'who they are today'}.`
  ]
  
  const background = `${context.name.split(' ')[0]} ${originSentence}. ${pickRandom(educationSnippets)}`
  
  // Career narrative
  const occupation = context.occupation || context.career || 'none'
  const careerOptions = CAREER_NARRATIVES[occupation] || CAREER_NARRATIVES['none'] || [
    `Works in ${occupation.replace(/_/g, ' ')} and has built a solid reputation in their field.`
  ]
  const careerNarrative = pickRandom(careerOptions)
  
  // Personality description
  const traitDescriptions = context.traits
    .map(t => {
      const options = PERSONALITY_DESCRIPTIONS_TEMPLATE[t]
      return options ? pickRandom(options) : null
    })
    .filter(Boolean)
  
  const firstName = context.name.split(' ')[0]
  let personalityDescription: string
  if (traitDescriptions.length >= 2) {
    personalityDescription = `${firstName} is ${traitDescriptions[0]}. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'}'s also ${traitDescriptions[1]}.`
    if (traitDescriptions.length >= 3) {
      personalityDescription += ` Those who know ${context.gender === 'female' ? 'her' : context.gender === 'male' ? 'him' : 'them'} well say ${context.gender === 'female' ? 'she' : context.gender === 'male' ? 'he' : 'they'}'s ${traitDescriptions[2]}.`
    }
  } else if (traitDescriptions.length === 1) {
    personalityDescription = `${firstName} is ${traitDescriptions[0]}. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'} makes a strong impression on everyone ${context.gender === 'female' ? 'she' : context.gender === 'male' ? 'he' : 'they'} meets.`
  } else {
    personalityDescription = `${firstName} is the kind of person who leaves an impression. ${context.gender === 'female' ? 'She' : context.gender === 'male' ? 'He' : 'They'} carries ${context.gender === 'female' ? 'herself' : context.gender === 'male' ? 'himself' : 'themselves'} with a quiet confidence that draws people in.`
  }
  
  // Life situation
  const lifeSituationTemplate = pickRandom(LIFE_SITUATIONS)
  const lifeSituation = lifeSituationTemplate.replace('{city}', city)
  
  // Anecdotes (pick 2-3 unique ones)
  const shuffledAnecdotes = [...ANECDOTE_TEMPLATES].sort(() => Math.random() - 0.5)
  const anecdoteCount = 2 + Math.floor(Math.random() * 2) // 2 or 3
  const anecdotes = shuffledAnecdotes.slice(0, anecdoteCount).map(fillAnecdote)
  
  return {
    background,
    careerNarrative,
    anecdotes,
    personalityDescription,
    lifeSituation
  }
}

// ============================================
// FALLBACK GENERATORS (Template-based)
// ============================================

function generateFallbackChoices(context: DialogueGenerationContext): MessageChoice[] {
  const choices: MessageChoice[] = []
  
  // Always include a casual greeting
  choices.push({
    id: `fallback_greeting_${Date.now()}`,
    category: 'greeting',
    preview: 'Hey, how are you?',
    fullMessage: `Hey ${context.contactName}! How's it going?`,
    tone: 'friendly',
    intentTag: 'friendly',
    riskLevel: 'safe',
    couldBackfire: false,
    expectedEffects: { affection: 1 },
    likelyResponses: ['neutral_greeting']
  })
  
  // Check-in if haven't talked recently
  if (context.daysSinceLastContact > 3) {
    choices.push({
      id: `fallback_checkin_${Date.now()}`,
      category: 'check_in',
      preview: 'Just checking in',
      fullMessage: `Hey, just wanted to check in. Been a few days since we talked. Everything okay?`,
      tone: 'supportive',
      intentTag: 'supportive',
      riskLevel: 'safe',
      couldBackfire: false,
      expectedEffects: { trust: 2 },
      likelyResponses: ['appreciative']
    })
  }
  
  // Flirty option if relationship is good (partner or romantically eligible friend)
  if (context.relationshipLevel >= 50 && context.contactType === 'partner') {
    choices.push({
      id: `fallback_flirt_${Date.now()}`,
      category: 'flirt',
      preview: 'Thinking about you',
      fullMessage: `Can't stop thinking about you today. Just wanted you to know.`,
      tone: 'romantic',
      intentTag: 'romance',
      riskLevel: 'mild',
      couldBackfire: false,
      expectedEffects: { romance: 3, affection: 2 },
      likelyResponses: ['flattered']
    })
  } else if (context.romanticEligible && context.affectionMeter >= 40) {
    choices.push({
      id: `fallback_flirt_eligible_${Date.now()}`,
      category: 'flirt',
      preview: 'You look great today',
      fullMessage: `By the way, you looked really great the other day. Just thought I'd mention it.`,
      tone: 'flirty',
      intentTag: 'flirting',
      riskLevel: 'mild',
      couldBackfire: true,
      expectedEffects: { romance: 2, affection: 1 },
      likelyResponses: ['flattered', 'surprised']
    })
  }
  
  // Share news if recent race
  if (context.playerRecentRaceResult) {
    const isGood = context.playerRecentRaceResult === 'win' || context.playerRecentRaceResult === 'podium'
    choices.push({
      id: `fallback_news_${Date.now()}`,
      category: 'share_news',
      preview: isGood ? 'Great news from the race!' : 'Tough day at the track',
      fullMessage: isGood 
        ? `Great result at the race today! Wish you could have been there to celebrate!`
        : `Tough day at the track. Could use some cheering up if you're free to talk.`,
      tone: isGood ? 'excited' : 'casual',
      intentTag: 'news',
      riskLevel: 'safe',
      couldBackfire: false,
      expectedEffects: { affection: 1 },
      likelyResponses: isGood ? ['congratulations'] : ['supportive']
    })
  }
  
  // Make plans
  choices.push({
    id: `fallback_plans_${Date.now()}`,
    category: 'make_plans',
    preview: 'Want to hang out?',
    fullMessage: `Hey, what are you up to this weekend? Would love to see you.`,
    tone: 'casual',
    intentTag: 'planning',
    riskLevel: 'mild',
    couldBackfire: true,
    expectedEffects: { affection: 2 },
    likelyResponses: ['interested', 'busy']
  })
  
  return choices.slice(0, 5) // Return max 5 choices
}

function generateFallbackResponse(
  context: DialogueGenerationContext,
  _playerMessage: string,
  _messageCategory: string
): NpcResponse {
  // Default response based on relationship and mood
  const isPositiveMood = ['happy', 'excited', 'romantic'].includes(context.currentMood)
  const isGoodRelationship = context.relationshipLevel >= 60
  const isLongAbsence = context.daysSinceLastContact > 14
  
  let message = ''
  let affectionChange = 0
  let trustChange = 0
  let emotionalReaction: NpcResponse['emotionalReaction'] = 'neutral'
  
  // ── Try trait-aware fallback templates ──
  const dominantTrait = context.traits.find(t => FALLBACK_TEMPLATES[t])
  const templates = dominantTrait ? FALLBACK_TEMPLATES[dominantTrait] : null
  
  if (templates) {
    // Use personality-specific templates
    if (isLongAbsence) {
      message = templates.afterAbsence[Math.floor(Math.random() * templates.afterAbsence.length)]
      trustChange -= 1
      emotionalReaction = isGoodRelationship ? 'pleased' : 'neutral'
    } else if (isPositiveMood && isGoodRelationship) {
      message = templates.positiveReply[Math.floor(Math.random() * templates.positiveReply.length)]
      affectionChange = 2
      trustChange = 1
      emotionalReaction = 'happy'
    } else if (context.currentMood === 'sad' || context.currentMood === 'worried') {
      message = templates.negativeReply[Math.floor(Math.random() * templates.negativeReply.length)]
      trustChange = 2
      emotionalReaction = 'pleased'
    } else {
      message = templates.greeting[Math.floor(Math.random() * templates.greeting.length)]
      if (isPositiveMood) {
        affectionChange = 1
        emotionalReaction = 'pleased'
      } else {
        emotionalReaction = 'neutral'
      }
    }
  } else {
    // Generic fallback (no matching trait template)
    if (isLongAbsence) {
      message = `Oh, hey! It's been a while. ${isGoodRelationship ? 'I was starting to wonder about you!' : 'What made you think of me?'}`
      trustChange -= 1
      emotionalReaction = isGoodRelationship ? 'pleased' : 'neutral'
    } else if (isPositiveMood && isGoodRelationship) {
      message = `Hey! So good to hear from you! ${context.lastMessageFromThem ? 'I was just thinking about you.' : ''}`
      affectionChange = 2
      trustChange = 1
      emotionalReaction = 'happy'
    } else if (isPositiveMood) {
      message = `Hey! How's it going?`
      affectionChange = 1
      emotionalReaction = 'pleased'
    } else if (context.currentMood === 'sad' || context.currentMood === 'worried') {
      message = `Hey... Thanks for reaching out.`
      trustChange = 2
      emotionalReaction = 'pleased'
    } else {
      message = `Hey, what's up?`
      emotionalReaction = 'neutral'
    }
  }
  
  return {
    message,
    tone: isPositiveMood ? 'warm' : 'neutral',
    mood: context.currentMood,
    affectionChange,
    romanceChange: 0,
    trustChange,
    emotionalReaction,
    wantsToMeetUp: false,
    actionRequest: null
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Generate a complete conversation turn (player choices + initial context)
 */
export async function generateConversationTurn(
  context: DialogueGenerationContext
): Promise<{
  choices: MessageChoice[]
  contextualGreeting?: string
}> {
  const choices = await generateMessageChoices(context)
  
  // Generate contextual greeting if they sent the last message
  let contextualGreeting: string | undefined
  if (context.lastMessageFromThem) {
    contextualGreeting = `Responding to: "${context.lastMessageFromThem}"`
  }
  
  return { choices, contextualGreeting }
}

/**
 * Process a complete message exchange
 */
export async function processMessageExchange(
  context: DialogueGenerationContext,
  selectedChoice: MessageChoice
): Promise<{
  sentMessage: string
  response: NpcResponse
  updatedMeters: {
    affection: number
    romance: number
    trust: number
  }
}> {
  const response = await generateNpcResponse(
    context,
    selectedChoice.fullMessage,
    selectedChoice.category
  )
  
  return {
    sentMessage: selectedChoice.fullMessage,
    response,
    updatedMeters: {
      affection: context.affectionMeter + response.affectionChange,
      romance: context.romanceMeter + response.romanceChange,
      trust: context.trustMeter + response.trustChange
    }
  }
}

// ============================================
// NPC-INITIATED MESSAGE GENERATION (Gemini)
// ============================================

const NPC_INITIATED_SYSTEM_PROMPT = `You are writing an unprompted text message from an NPC to the player in a motorsport career simulation game.
The NPC is texting the player FIRST — this is NOT a reply, it's a message the NPC is initiating on their own.

RULES:
1. You ARE this character. Stay completely in character based on the profile provided.
2. The message should feel natural — like a real text someone would send.
3. Keep it SHORT (30-200 characters). Real texts are brief.
4. Reference the EVENT that triggered this message naturally (don't be heavy-handed).
5. Stay STRICTLY within your occupation and expertise. A journalist talks about media/stories. A friend talks about life. Staff talks about work.
6. Match your texting style to your personality: formal people write properly, casual people use slang/abbreviations, enthusiastic people use emojis.
7. Do NOT offer things outside your expertise (journalists don't pitch investments, friends don't offer sponsorship deals).
8. If there's no strong reason to text, a brief check-in is fine ("Hey, how's it going?", "Thinking about you", "Saw your race!").
9. Consider your relationship level — low-relationship contacts are more formal/brief. High-relationship contacts are warmer/more personal.
10. If the message naturally involves an INVITATION or OFFER (dinner, event, meetup, date, etc.), include an "actionRequest" so it becomes a real in-game action the player can accept or decline. Otherwise set actionRequest to null.

INVITATION RESTRAINT (CRITICAL):
- The MAJORITY of your messages should be simple conversation starters, reactions, or check-ins WITHOUT an actionRequest.
- Only include an actionRequest when you have a genuine, specific reason (a real event, a planned dinner, etc.) — not just to make the message more engaging.
- Casual check-ins, reactions to events, and friendly messages should have actionRequest: null.
- Most of the time (roughly 4 out of 5 messages), you should NOT include an invitation. Just text them naturally.

ACTION REQUEST TYPES (only use when the message genuinely includes an invitation/offer):
- Partners/dates: dinner_invite, date_request, social_invite
- Friends: social_invite, dinner_invite
- Journalists/media: media_request, social_invite
- Sponsor reps: sponsor_appearance, social_invite
- Staff: social_invite, advice
- Rivals: social_invite, race_tickets
- Family: social_invite, dinner_invite
- Anyone: charity_ask, introduction

Respond with ONLY valid JSON:
{
  "message": "The text message content",
  "tone": "friendly|warm|excited|concerned|professional|playful|competitive|casual|supportive",
  "actionRequest": null or { "type": "dinner_invite", "description": "Brief description", "suggestedDay": 5, "suggestedWeek": 12, "eventName": "Dinner at Nobu", "venue": "Nobu Monaco", "timeCost": 2 }
}`

/**
 * Generate an NPC-initiated message using Gemini AI.
 * Falls back to null if AI is unavailable (caller should use template fallback).
 */
export async function generateNpcInitiatedMessage(
  contact: ContactInfo,
  eventType: string,
  eventDetail?: string,
  conversationHistory?: string[],
  playerContext?: {
    playerName: string
    recentRaceResult?: string
    teamName?: string
    championshipPosition?: number
    currentWeek?: number
    currentDay?: number
  }
): Promise<{ message: string; tone: string; actionRequest?: { type: string; description: string; suggestedDay?: number; suggestedWeek?: number; eventName?: string; venue?: string; timeCost?: number; moneyCost?: number } | null } | null> {
  if (!isDialogueAIAvailable()) return null
  
  const profileBlock = buildFullProfileBlock(contact)
  // Extract traits from the contact for texting style
  const contactTraits: string[] = contact.traits || []
  const textingStyleBlock = buildTextingStyleBlock(contactTraits)
  
  const userPrompt = `Generate an unprompted text message from ${contact.name} to the player.

${profileBlock}
${textingStyleBlock}

RELATIONSHIP:
- Type: ${contact.type}
- Level: ${contact.relationshipLevel}/100
- Trust: ${contact.trustMeter}/100

${eventType !== 'weekly_checkin' ? `TRIGGER EVENT: ${eventType.replace(/_/g, ' ')}${eventDetail ? ` — ${eventDetail}` : ''}` : 'No specific event — this is a casual check-in or follow-up.'}

${playerContext?.playerName ? `PLAYER: ${playerContext.playerName}` : ''}
${playerContext?.teamName ? `TEAM: ${playerContext.teamName}` : ''}
${playerContext?.recentRaceResult ? `RECENT RACE: ${playerContext.recentRaceResult}` : ''}
${playerContext?.championshipPosition ? `CHAMPIONSHIP: P${playerContext.championshipPosition}` : ''}

${conversationHistory && conversationHistory.length > 0 ? `RECENT CONVERSATION HISTORY:\n${conversationHistory.slice(-4).join('\n')}` : 'No recent conversation.'}

GAME TIME: Week ${playerContext?.currentWeek || 1}, Day ${playerContext?.currentDay || 1} (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun).

Write a short, natural text message (30-200 chars) that ${contact.name} would send unprompted. Stay in character and follow the texting style specified above.
If the message naturally includes an invitation, offer, or request to do something together (dinner, event, meetup, date, etc.), include an actionRequest with:
- "suggestedDay" (1-7, 1=Monday), "suggestedWeek" (${playerContext?.currentWeek || 1} for this week, ${(playerContext?.currentWeek || 1) + 1} for next week)
- "eventName" (short 2-5 word title), "venue" (optional location)
Otherwise set actionRequest to null.`

  try {
    const response = await callGeminiAPI(
      NPC_INITIATED_SYSTEM_PROMPT,
      userPrompt,
      10000  // Generous token budget to avoid truncation
    )
    
    if (response) {
      const parsed = safeParseJSON(response) as { message?: string; tone?: string; actionRequest?: any }
      if (parsed?.message) {
        // Validate actionRequest if present
        let validatedAction = parsed.actionRequest ?? null
        if (validatedAction && validatedAction.type && validatedAction.description) {
          const validTypes = ['social_invite', 'dinner_invite', 'date_request', 'introduction', 'sponsor_appearance', 'career_favor', 'race_tickets', 'advice', 'media_request', 'charity_ask']
          if (!validTypes.includes(validatedAction.type)) {
            validatedAction = null
          }
        } else {
          validatedAction = null
        }
        
        return {
          message: parsed.message,
          tone: parsed.tone || 'friendly',
          actionRequest: validatedAction,
        }
      }
    }
  } catch (e) {
    console.warn('[DialogueAI] Failed to generate NPC-initiated message:', e)
  }
  
  return null
}

// ============================================
// INVITATION ANALYSIS (for message migration)
// ============================================

/**
 * Analyze a single NPC message to determine if it contains an invitation,
 * and if so, extract structured invitation data using Gemini AI.
 * 
 * Returns null if AI is unavailable.
 * Returns { isInvitation: false } if the message is not an invitation.
 * Returns full structured data if the message IS an invitation.
 */
export async function analyzeMessageForInvitation(
  messageContent: string,
  contactName: string,
  contactType: string,
  currentWeek: number,
  currentDay: number
): Promise<{
  isInvitation: boolean
  type?: string
  eventName?: string
  description?: string
  venue?: string
  suggestedDay?: number
  suggestedWeek?: number
  timeCost?: number
} | null> {
  if (!isDialogueAIAvailable()) return null

  const userPrompt = `Analyze this text message from ${contactName} (${contactType}) and determine if it contains an invitation, offer, or request to meet up / attend something.

MESSAGE:
"${messageContent}"

GAME TIME: Week ${currentWeek}, Day ${currentDay} (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun).

If the message contains an invitation or offer to do something together, extract:
- "isInvitation": true
- "type": one of: dinner_invite, social_invite, date_request, media_request, sponsor_appearance, charity_ask, introduction, race_tickets, advice, career_favor
- "eventName": a short 2-6 word name for the event that captures what was actually described (e.g., "Luxury Partners Gathering", "Dinner at Nobu", "Press Conference", "Charity Gala"). Do NOT use generic names like "Event with X" — use the actual event described.
- "description": a 1-sentence summary of the invitation
- "venue": the location if mentioned, otherwise null
- "suggestedDay": day of week as 1-7 if a specific day was mentioned (1=Monday through 7=Sunday), otherwise null
- "suggestedWeek": ${currentWeek} if "this week" or a day this week was mentioned, ${currentWeek + 1} if "next week" or a day next week was implied, otherwise null
- "timeCost": estimated hours the event would take (1-4), default 2

If the message does NOT contain any invitation (just normal conversation, news, reaction, etc.), return:
- "isInvitation": false

Respond with ONLY valid JSON, no markdown, no backticks.`

  try {
    const response = await callGeminiAPI(
      'You are a message analyzer. Extract structured invitation data from text messages. Respond only with valid JSON.',
      userPrompt,
      4000,
      {
        type: 'json_object',
        schema: {
          type: 'object',
          properties: {
            isInvitation: { type: 'boolean' },
            type: { type: 'string' },
            eventName: { type: 'string' },
            description: { type: 'string' },
            venue: { type: 'string' },
            suggestedDay: { type: 'number' },
            suggestedWeek: { type: 'number' },
            timeCost: { type: 'number' },
          },
          required: ['isInvitation']
        }
      }
    )

    if (response) {
      const parsed = safeParseJSON(response)
      if (parsed && typeof parsed.isInvitation === 'boolean') {
        // Validate type if it's an invitation
        if (parsed.isInvitation && parsed.type) {
          const validTypes = ['social_invite', 'dinner_invite', 'date_request', 'introduction', 'sponsor_appearance', 'career_favor', 'race_tickets', 'advice', 'media_request', 'charity_ask']
          if (!validTypes.includes(parsed.type)) {
            parsed.type = 'social_invite' // Safe fallback
          }
        }
        return parsed
      }
    }
  } catch (e) {
    console.warn('[DialogueAI] Failed to analyze message for invitation:', e)
  }

  return null
}
