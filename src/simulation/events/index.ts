// Career events and narrative system
import { PlayerDriver, PlayerBackground } from '@/store/careerStore'
import { RivalDriver } from '@/store/rivalStore'

export type EventType = 
  | 'personal'
  | 'team'
  | 'rival'
  | 'sponsor'
  | 'media'
  | 'injury'
  | 'opportunity'
  | 'achievement'
  | 'reassignment'  // Works contract reassignment
  | 'background'    // Background-specific narrative events

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'critical'

export interface CareerEvent {
  id: string
  type: EventType
  severity: EventSeverity
  title: string
  description: string
  week: number
  year: number
  effects?: EventEffect[]
  choices?: EventChoice[]
  relatedRivalId?: string
  expiresIn?: number // weeks
  resolved: boolean
}

export interface EventEffect {
  stat: string
  change: number
}

export interface EventChoice {
  id: string
  text: string
  effects: EventEffect[]
  consequenceDescription: string
}

// Event templates
const EVENT_TEMPLATES: Omit<CareerEvent, 'id' | 'week' | 'year' | 'resolved'>[] = [
  // Personal events
  {
    type: 'personal',
    severity: 'minor',
    title: 'Great Training Session',
    description: 'You had an exceptionally productive training session today. Your reflexes feel sharper.',
    effects: [{ stat: 'confidence', change: 5 }]
  },
  {
    type: 'personal',
    severity: 'minor',
    title: 'Poor Sleep',
    description: 'A restless night has left you feeling tired. Make sure to rest before the next race.',
    effects: [{ stat: 'fatigue', change: 15 }]
  },
  {
    type: 'personal',
    severity: 'moderate',
    title: 'Family Visit',
    description: 'Your family surprised you with a visit. The support has boosted your morale.',
    effects: [{ stat: 'morale', change: 15 }, { stat: 'stress', change: -10 }]
  },
  
  // Team events
  {
    type: 'team',
    severity: 'minor',
    title: 'Team Dinner',
    description: 'The team organized a dinner to build camaraderie. Good for team spirit!',
    effects: [{ stat: 'morale', change: 5 }]
  },
  {
    type: 'team',
    severity: 'moderate',
    title: 'Technical Upgrade',
    description: 'The team has developed a new component that should improve lap times.',
  },
  {
    type: 'team',
    severity: 'major',
    title: 'Team Principal Change',
    description: 'The team has announced a new team principal. This could change the team dynamics.',
    choices: [
      {
        id: 'support',
        text: 'Express public support for the change',
        effects: [{ stat: 'reputation', change: 5 }],
        consequenceDescription: 'The new principal appreciates your support.'
      },
      {
        id: 'neutral',
        text: 'Stay neutral and focus on racing',
        effects: [],
        consequenceDescription: 'You keep your head down and focus on the job.'
      },
      {
        id: 'concern',
        text: 'Express concerns privately',
        effects: [{ stat: 'morale', change: -5 }],
        consequenceDescription: 'Your concerns are noted but create some tension.'
      }
    ]
  },
  
  // Rival events
  {
    type: 'rival',
    severity: 'minor',
    title: 'Rival\'s Comments',
    description: 'A rival made dismissive comments about your driving in an interview.',
    choices: [
      {
        id: 'respond',
        text: 'Fire back in the media',
        effects: [{ stat: 'rivalryIntensity', change: 20 }, { stat: 'marketability', change: 2 }],
        consequenceDescription: 'The media loves the drama. The rivalry intensifies.'
      },
      {
        id: 'ignore',
        text: 'Ignore and let racing do the talking',
        effects: [{ stat: 'mentalStrength', change: 3 }],
        consequenceDescription: 'You stay focused on what matters.'
      }
    ]
  },
  
  // Media events
  {
    type: 'media',
    severity: 'minor',
    title: 'Interview Request',
    description: 'A motorsport magazine wants to feature you in their next issue.',
    effects: [{ stat: 'marketability', change: 1 }]
  },
  {
    type: 'media',
    severity: 'moderate',
    title: 'Controversial Question',
    description: 'A journalist asked you about your team\'s performance controversially.',
    choices: [
      {
        id: 'diplomatic',
        text: 'Give a diplomatic answer',
        effects: [{ stat: 'reputation', change: 3 }],
        consequenceDescription: 'Your professionalism is noted.'
      },
      {
        id: 'honest',
        text: 'Be brutally honest',
        effects: [{ stat: 'marketability', change: 2 }, { stat: 'morale', change: -5 }],
        consequenceDescription: 'The honest take goes viral but creates internal tension.'
      },
      {
        id: 'deflect',
        text: 'Deflect the question',
        effects: [],
        consequenceDescription: 'You smoothly change the subject.'
      }
    ]
  },
  
  // Sponsor events
  {
    type: 'sponsor',
    severity: 'moderate',
    title: 'Sponsor Event',
    description: 'Your sponsor wants you to attend a promotional event.',
    effects: [{ stat: 'fatigue', change: 10 }, { stat: 'marketability', change: 2 }]
  },
  {
    type: 'sponsor',
    severity: 'minor',
    title: 'Sponsor Happy',
    description: 'Your sponsor is pleased with your recent performance. Keep it up!',
    effects: [{ stat: 'morale', change: 5 }]
  },
  
  // Injury events
  {
    type: 'injury',
    severity: 'minor',
    title: 'Minor Strain',
    description: 'You\'ve developed a minor muscle strain during training.',
    effects: [{ stat: 'fitness', change: -5 }]
  },
  {
    type: 'injury',
    severity: 'major',
    title: 'Training Injury',
    description: 'An accident during training has resulted in an injury. Recovery will take time.',
    effects: [{ stat: 'fitness', change: -20 }]
  },
  
  // Opportunity events
  {
    type: 'opportunity',
    severity: 'moderate',
    title: 'Test Drive Offer',
    description: 'A higher-tier team wants you to test their car next week.',
    effects: [{ stat: 'reputation', change: 5 }]
  },
  
  // Achievement events
  {
    type: 'achievement',
    severity: 'moderate',
    title: 'Milestone Reached',
    description: 'You\'ve reached a significant career milestone!',
    effects: [{ stat: 'morale', change: 20 }, { stat: 'reputation', change: 5 }]
  }
]

// Generate random event based on current state
export function generateRandomEvent(
  player: PlayerDriver,
  currentWeek: number,
  currentYear: number,
  rivals: RivalDriver[]
): CareerEvent | null {
  // Base chance for an event
  const eventChance = 0.15 // 15% chance per week
  
  if (Math.random() > eventChance) {
    return null
  }
  
  // Filter appropriate events based on player state
  let availableEvents = [...EVENT_TEMPLATES]
  
  // More stress = more likely negative events
  if (player.mentalState.stress > 70) {
    availableEvents = availableEvents.filter(e => 
      e.type === 'personal' || e.type === 'injury'
    )
  }
  
  // High reputation = more media events
  if (player.reputation > 50) {
    const mediaEvents = availableEvents.filter(e => e.type === 'media')
    availableEvents = [...availableEvents, ...mediaEvents] // Double chance
  }
  
  // Pick random event
  const template = availableEvents[Math.floor(Math.random() * availableEvents.length)]
  
  // If rival event, pick a rival
  let relatedRivalId: string | undefined
  if (template.type === 'rival' && rivals.length > 0) {
    const rival = rivals[Math.floor(Math.random() * rivals.length)]
    relatedRivalId = rival.id
  }
  
  return {
    ...template,
    id: `event_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    week: currentWeek,
    year: currentYear,
    relatedRivalId,
    resolved: false
  }
}

// Generate achievement event
export function generateAchievementEvent(
  achievementType: string,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const achievements: Record<string, { title: string; description: string }> = {
    first_race: { title: 'First Race Complete', description: 'You\'ve completed your first race! The journey has begun.' },
    first_podium: { title: 'First Podium!', description: 'Your first podium finish! The hard work is paying off.' },
    first_win: { title: 'First Victory!', description: 'You\'ve won your first race! A moment to remember forever.' },
    first_pole: { title: 'First Pole Position', description: 'You qualified on pole for the first time!' },
    ten_races: { title: '10 Races Milestone', description: 'You\'ve competed in 10 races. Experience is building.' },
    fifty_races: { title: '50 Races Milestone', description: '50 races complete. You\'re becoming a seasoned racer.' },
    championship: { title: 'Championship Winner!', description: 'You\'ve won the championship! A legendary achievement.' },
  }
  
  const achievement = achievements[achievementType] || { 
    title: 'Achievement Unlocked', 
    description: 'You\'ve reached a new milestone!' 
  }
  
  return {
    id: `achievement_${achievementType}_${currentYear}_${currentWeek}`,
    type: 'achievement',
    severity: 'major',
    title: achievement.title,
    description: achievement.description,
    week: currentWeek,
    year: currentYear,
    effects: [
      { stat: 'morale', change: 25 },
      { stat: 'confidence', change: 15 }
    ],
    resolved: false
  }
}

// ============================================
// GOAT SYSTEM EVENTS
// ============================================

/**
 * Generate event for GOAT milestone achievement
 */
export function generateGOATMilestoneEvent(
  milestoneId: string,
  milestoneName: string,
  milestoneDescription: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  icon: string,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const severityMap: Record<string, EventSeverity> = {
    'common': 'minor',
    'uncommon': 'minor',
    'rare': 'moderate',
    'epic': 'major',
    'legendary': 'critical'
  }
  
  const effectsMap: Record<string, EventEffect[]> = {
    'common': [{ stat: 'morale', change: 5 }, { stat: 'confidence', change: 3 }],
    'uncommon': [{ stat: 'morale', change: 10 }, { stat: 'confidence', change: 5 }],
    'rare': [{ stat: 'morale', change: 15 }, { stat: 'confidence', change: 10 }, { stat: 'reputation', change: 2 }],
    'epic': [{ stat: 'morale', change: 20 }, { stat: 'confidence', change: 15 }, { stat: 'reputation', change: 5 }],
    'legendary': [{ stat: 'morale', change: 30 }, { stat: 'confidence', change: 20 }, { stat: 'reputation', change: 10 }]
  }
  
  return {
    id: `goat_milestone_${milestoneId}_${currentYear}_${currentWeek}`,
    type: 'achievement',
    severity: severityMap[rarity] || 'moderate',
    title: `${icon} ${milestoneName}`,
    description: `Achievement Unlocked: ${milestoneDescription}\n\nYou're becoming a legend!`,
    week: currentWeek,
    year: currentYear,
    effects: effectsMap[rarity] || effectsMap['uncommon'],
    resolved: false
  }
}

/**
 * Generate event for Triple Crown leg completion
 */
export function generateTripleCrownLegEvent(
  crownName: string,
  legName: string,
  remainingLegs: number,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const isLastLeg = remainingLegs === 0
  
  return {
    id: `triple_crown_leg_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'achievement',
    severity: isLastLeg ? 'critical' : 'major',
    title: isLastLeg 
      ? `🏆 TRIPLE CROWN COMPLETE: ${crownName}!`
      : `Triple Crown Progress: ${crownName}`,
    description: isLastLeg
      ? `You have completed the ${crownName}! This is an achievement only the greatest drivers in history have managed. Your name will be remembered forever!`
      : `You've completed the ${legName} leg of the ${crownName}! Only ${remainingLegs} more leg${remainingLegs > 1 ? 's' : ''} to go. Keep pushing!`,
    week: currentWeek,
    year: currentYear,
    effects: isLastLeg 
      ? [{ stat: 'morale', change: 50 }, { stat: 'confidence', change: 30 }, { stat: 'reputation', change: 20 }]
      : [{ stat: 'morale', change: 25 }, { stat: 'confidence', change: 15 }, { stat: 'reputation', change: 5 }],
    resolved: false
  }
}

/**
 * Generate event for breaking a historical record
 */
export function generateRecordBrokenEvent(
  recordName: string,
  oldRecordHolder: string,
  oldValue: number,
  newValue: number,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  return {
    id: `record_broken_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'achievement',
    severity: 'critical',
    title: `🌟 RECORD BROKEN: ${recordName}!`,
    description: `You have broken a legendary record!\n\nPrevious record: ${oldRecordHolder} with ${oldValue}\nYour new record: ${newValue}\n\nYour name will be etched in motorsport history!`,
    week: currentWeek,
    year: currentYear,
    effects: [
      { stat: 'morale', change: 40 },
      { stat: 'confidence', change: 25 },
      { stat: 'reputation', change: 15 },
      { stat: 'marketability', change: 5 }  // Reduced from 10
    ],
    resolved: false
  }
}

/**
 * Generate event for GOAT tier upgrade
 */
export function generateGOATTierUpgradeEvent(
  newTierName: string,
  newTierDescription: string,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const tierSeverity: Record<string, EventSeverity> = {
    'Club Racer': 'minor',
    'Regional Champion': 'moderate',
    'Professional': 'moderate',
    'Star': 'major',
    'Legend': 'major',
    'GOAT': 'critical'
  }
  
  return {
    id: `goat_tier_upgrade_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'achievement',
    severity: tierSeverity[newTierName] || 'moderate',
    title: `Tier Promotion: ${newTierName}!`,
    description: `Your career has reached new heights!\n\n${newTierDescription}\n\nYou're one step closer to becoming the GOAT!`,
    week: currentWeek,
    year: currentYear,
    effects: [
      { stat: 'morale', change: 25 },
      { stat: 'confidence', change: 15 },
      { stat: 'reputation', change: 5 }
    ],
    resolved: false
  }
}

// Apply event effects to player
export function applyEventEffects(
  player: PlayerDriver,
  effects: EventEffect[]
): PlayerDriver {
  let updatedPlayer = { ...player }
  
  effects.forEach(effect => {
    switch (effect.stat) {
      case 'confidence':
        updatedPlayer.mentalState.confidence = clamp(updatedPlayer.mentalState.confidence + effect.change)
        break
      case 'stress':
        updatedPlayer.mentalState.stress = clamp(updatedPlayer.mentalState.stress + effect.change)
        break
      case 'fatigue':
        updatedPlayer.mentalState.fatigue = clamp(updatedPlayer.mentalState.fatigue + effect.change)
        break
      case 'morale':
        updatedPlayer.mentalState.morale = clamp(updatedPlayer.mentalState.morale + effect.change)
        break
      case 'fitness':
        updatedPlayer.health.fitness = clamp(updatedPlayer.health.fitness + effect.change)
        break
      case 'reputation':
        updatedPlayer.reputation = clamp(updatedPlayer.reputation + effect.change)
        break
      case 'marketability':
        updatedPlayer.stats.marketability = clamp(updatedPlayer.stats.marketability + effect.change)
        break
      case 'mentalStrength':
        updatedPlayer.stats.mentalStrength = clamp(updatedPlayer.stats.mentalStrength + effect.change)
        break
    }
  })
  
  return updatedPlayer
}

// Generate news headline from event
export function generateHeadline(event: CareerEvent, player: PlayerDriver, rival?: RivalDriver): string {
  switch (event.type) {
    case 'achievement':
      return `${player.lastName} ${event.title}`
    case 'rival':
      return rival 
        ? `${rival.lastName} vs ${player.lastName}: ${event.title}`
        : event.title
    case 'team':
      return `Team News: ${event.title}`
    case 'media':
      return `${player.lastName} in the Spotlight: ${event.title}`
    default:
      return event.title
  }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

// ============================================
// WORKS CONTRACT REASSIGNMENT EVENTS
// ============================================

export interface ReassignmentInfo {
  oldEntryId: string
  oldEntryName: string
  oldSeriesName: string
  newEntryId: string
  newEntryName: string
  newCarName: string
  newSeriesId: string
  newSeriesName: string
  reason: 'performance' | 'strategic' | 'injury-cover' | 'promotion'
}

/**
 * Check if a works driver should be reassigned between seasons
 * Called at end of season for players with canBeReassigned = true
 */
export function checkWorksReassignment(
  playerReputation: number,
  currentEntryId: string,
  allProgramEntries: Array<{
    entryId: string
    entryName: string
    carName: string
    seriesId: string
    seriesName: string
    currentDriverRep?: number
    tier: string
  }>,
  playerSeasonPosition: number,
  totalDrivers: number
): ReassignmentInfo | null {
  if (allProgramEntries.length <= 1) return null
  
  // Find current entry
  const currentEntry = allProgramEntries.find(e => e.entryId === currentEntryId)
  if (!currentEntry) return null
  
  // Determine if reassignment should happen based on performance
  const performanceRatio = playerSeasonPosition / totalDrivers
  
  // Check for PROMOTION: Player performed well and there's a higher-tier entry available
  if (performanceRatio <= 0.25) { // Top 25%
    const higherTierEntries = allProgramEntries.filter(e => {
      if (e.entryId === currentEntryId) return false
      const tierOrder = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
      const currentTierIndex = tierOrder.indexOf(currentEntry.tier)
      const entryTierIndex = tierOrder.indexOf(e.tier)
      // Higher tier OR same tier but lower driver rep
      return entryTierIndex > currentTierIndex || 
        (entryTierIndex === currentTierIndex && (e.currentDriverRep || 0) < playerReputation - 5)
    })
    
    if (higherTierEntries.length > 0) {
      // Pick the best available promotion
      const promotion = higherTierEntries.sort((a, b) => {
        const tierOrder = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
        return tierOrder.indexOf(b.tier) - tierOrder.indexOf(a.tier)
      })[0]
      
      return {
        oldEntryId: currentEntryId,
        oldEntryName: currentEntry.entryName,
        oldSeriesName: currentEntry.seriesName,
        newEntryId: promotion.entryId,
        newEntryName: promotion.entryName,
        newCarName: promotion.carName,
        newSeriesId: promotion.seriesId,
        newSeriesName: promotion.seriesName,
        reason: 'promotion'
      }
    }
  }
  
  // Check for DEMOTION: Poor performance might lead to being moved down
  if (performanceRatio >= 0.75) { // Bottom 25%
    const lowerTierEntries = allProgramEntries.filter(e => {
      if (e.entryId === currentEntryId) return false
      const tierOrder = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle']
      const currentTierIndex = tierOrder.indexOf(currentEntry.tier)
      const entryTierIndex = tierOrder.indexOf(e.tier)
      return entryTierIndex < currentTierIndex
    })
    
    // 30% chance of demotion after poor performance
    if (lowerTierEntries.length > 0 && Math.random() < 0.3) {
      const demotion = lowerTierEntries[Math.floor(Math.random() * lowerTierEntries.length)]
      return {
        oldEntryId: currentEntryId,
        oldEntryName: currentEntry.entryName,
        oldSeriesName: currentEntry.seriesName,
        newEntryId: demotion.entryId,
        newEntryName: demotion.entryName,
        newCarName: demotion.carName,
        newSeriesId: demotion.seriesId,
        newSeriesName: demotion.seriesName,
        reason: 'performance'
      }
    }
  }
  
  // Strategic reassignment (10% random chance regardless of performance)
  if (Math.random() < 0.1) {
    const otherEntries = allProgramEntries.filter(e => e.entryId !== currentEntryId)
    if (otherEntries.length > 0) {
      const newEntry = otherEntries[Math.floor(Math.random() * otherEntries.length)]
      return {
        oldEntryId: currentEntryId,
        oldEntryName: currentEntry.entryName,
        oldSeriesName: currentEntry.seriesName,
        newEntryId: newEntry.entryId,
        newEntryName: newEntry.entryName,
        newCarName: newEntry.carName,
        newSeriesId: newEntry.seriesId,
        newSeriesName: newEntry.seriesName,
        reason: 'strategic'
      }
    }
  }
  
  return null
}

/**
 * Generate a reassignment event for display
 */
export function generateReassignmentEvent(
  reassignment: ReassignmentInfo,
  programName: string,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const reasonText: Record<string, string> = {
    'promotion': 'Based on your strong performance, the team has decided to promote you to a more competitive entry.',
    'performance': 'Due to recent results, the team has decided to reassign you to a different entry.',
    'strategic': 'As part of their strategic planning for next season, the team is moving you to a different program.',
    'injury-cover': 'You\'ve been called up to cover for an injured driver at a higher-tier entry.'
  }
  
  return {
    id: `reassignment_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'reassignment',
    severity: reassignment.reason === 'promotion' ? 'major' : 'moderate',
    title: reassignment.reason === 'promotion' 
      ? `${programName} Promotion!` 
      : `${programName} Reassignment`,
    description: `${reasonText[reassignment.reason]}\n\nYou are moving from ${reassignment.oldEntryName} to ${reassignment.newEntryName}.\n\nNew car: ${reassignment.newCarName}\nNew series: ${reassignment.newSeriesName}`,
    week: currentWeek,
    year: currentYear,
    effects: reassignment.reason === 'promotion' 
      ? [{ stat: 'morale', change: 20 }, { stat: 'confidence', change: 15 }]
      : [{ stat: 'morale', change: -10 }, { stat: 'stress', change: 15 }],
    resolved: false
  }
}

// ============================================
// SPONSOR PERFORMANCE EVENTS
// ============================================

/**
 * Generate a sponsor warning event when satisfaction drops below thresholds
 */
export function generateSponsorWarningEvent(
  sponsorName: string,
  satisfaction: number,
  isFinalWarning: boolean,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  return {
    id: `sponsor_warning_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'sponsor',
    severity: isFinalWarning ? 'critical' : 'major',
    title: isFinalWarning ? `${sponsorName}: Final Warning!` : `${sponsorName}: Performance Concern`,
    description: isFinalWarning 
      ? `${sponsorName} has issued a FINAL WARNING. Your satisfaction level has dropped to ${Math.round(satisfaction)}%. If your performance does not improve immediately, they will terminate the sponsorship. This could significantly impact your finances and reputation.`
      : `${sponsorName} has expressed concerns about your recent performance. Your satisfaction level has dropped to ${Math.round(satisfaction)}%. They expect to see improvement in your results, or they may consider reducing payments.`,
    week: currentWeek,
    year: currentYear,
    effects: isFinalWarning 
      ? [{ stat: 'stress', change: 20 }, { stat: 'morale', change: -15 }]
      : [{ stat: 'stress', change: 10 }, { stat: 'morale', change: -5 }],
    resolved: false
  }
}

/**
 * Generate a sponsor termination event when contract is ended
 */
export function generateSponsorTerminationEvent(
  sponsorName: string,
  monthlyPayment: number,
  currentWeek: number,
  currentYear: number
): CareerEvent {
  return {
    id: `sponsor_terminated_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'sponsor',
    severity: 'critical',
    title: `${sponsorName} Terminates Sponsorship!`,
    description: `Due to your poor performance and low satisfaction rating, ${sponsorName} has decided to terminate your sponsorship agreement effective immediately. You will lose $${monthlyPayment.toLocaleString()} in monthly payments. This decision will also impact your reputation in the paddock.`,
    week: currentWeek,
    year: currentYear,
    effects: [
      { stat: 'morale', change: -25 },
      { stat: 'reputation', change: -3 },
      { stat: 'marketability', change: -2 },  // Reduced from -5
      { stat: 'stress', change: 15 }
    ],
    resolved: false
  }
}

/**
 * Generate a positive sponsor event when targets are met early or exceeded
 */
export function generateSponsorHappyEvent(
  sponsorName: string,
  reason: 'targets_met' | 'excellent_performance' | 'all_targets_exceeded',
  currentWeek: number,
  currentYear: number
): CareerEvent {
  const reasons: Record<string, { title: string; description: string }> = {
    'targets_met': {
      title: `${sponsorName}: Targets Achieved!`,
      description: `Congratulations! ${sponsorName} is delighted that you have met all your performance targets for this season. They will honor the full contract value and may consider extending your deal.`
    },
    'excellent_performance': {
      title: `${sponsorName}: Impressed!`,
      description: `${sponsorName} has been impressed by your recent string of strong performances. Your satisfaction rating is at an all-time high. Keep up the excellent work!`
    },
    'all_targets_exceeded': {
      title: `${sponsorName}: Outstanding Season!`,
      description: `${sponsorName} is thrilled! You haven't just met your targets - you've exceeded all of them! They are offering a 10% bonus on all payments and are already discussing a contract extension.`
    }
  }
  
  const reasonInfo = reasons[reason]
  
  return {
    id: `sponsor_happy_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'sponsor',
    severity: reason === 'all_targets_exceeded' ? 'major' : 'moderate',
    title: reasonInfo.title,
    description: reasonInfo.description,
    week: currentWeek,
    year: currentYear,
    effects: reason === 'all_targets_exceeded'
      ? [{ stat: 'morale', change: 20 }, { stat: 'confidence', change: 10 }, { stat: 'marketability', change: 1 }]  // Reduced from 3
      : [{ stat: 'morale', change: 10 }, { stat: 'confidence', change: 5 }],
    resolved: false
  }
}

// ============================================
// BACKGROUND-SPECIFIC EVENTS
// ============================================

interface BackgroundEventTemplate {
  triggerCondition: (player: PlayerDriver, background: PlayerBackground) => boolean
  event: Omit<CareerEvent, 'id' | 'week' | 'year' | 'resolved'>
}

/**
 * Background-specific event templates
 * These fire based on the player's background and current situation
 */
const BACKGROUND_EVENT_TEMPLATES: BackgroundEventTemplate[] = [
  // ========== FACTORY ACADEMY EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'factory_academy' && 
      player.totalWins >= 1 && 
      player.totalWins <= 3,
    event: {
      type: 'background',
      severity: 'major',
      title: 'Manufacturer Impressed by Your Progress',
      description: 'Your win has caught the attention of the motorsport director. They\'re considering moving you to a more prominent entry next season. Keep delivering results!',
      effects: [
        { stat: 'morale', change: 15 },
        { stat: 'confidence', change: 10 },
        { stat: 'reputation', change: 5 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'factory_academy' && 
      player.reputation >= 60 && 
      bg.manufacturerRelationship < 70,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Academy Recognition',
      description: 'The academy staff have praised your development. Your relationship with the manufacturer strengthens.',
      effects: [
        { stat: 'morale', change: 10 }
      ]
    }
  },
  
  // ========== RACING DYNASTY EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'racing_dynasty' && 
      player.totalPodiums >= 1 && 
      player.totalPodiums <= 5,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Media Compares You to Your Father',
      description: 'After your podium finish, the media can\'t resist drawing comparisons to your father. "Like father, like child," they say. The pressure to live up to the family name intensifies.',
      effects: [
        { stat: 'marketability', change: 2 },  // Reduced from 5
        { stat: 'stress', change: 10 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'racing_dynasty' && 
      player.totalWins === 0 && 
      player.totalRaces >= 10,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Critics Question Your Talent',
      description: 'Some pundits are suggesting you\'re only here because of your family name. It stings, but use it as motivation.',
      choices: [
        {
          id: 'motivated',
          text: 'Let the criticism fuel your fire',
          effects: [{ stat: 'mentalStrength', change: 5 }, { stat: 'stress', change: 5 }],
          consequenceDescription: 'You channel the negativity into determination.'
        },
        {
          id: 'ignore',
          text: 'Block out the noise',
          effects: [{ stat: 'morale', change: -5 }],
          consequenceDescription: 'You try to focus on your racing.'
        }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'racing_dynasty' && 
      player.totalWins >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'Stepping Out of the Shadow',
      description: 'Your victory proves you\'re not just riding on your family name. You\'re creating your own legacy now.',
      effects: [
        { stat: 'confidence', change: 20 },
        { stat: 'reputation', change: 5 },
        { stat: 'stress', change: -10 }
      ]
    }
  },
  
  // ========== SIM RACING CHAMPION EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'sim_racing_champion' && 
      bg.needsToProveWorth &&
      player.totalPodiums >= 1,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Critics Silenced',
      description: 'Your podium finish has silenced some skeptics who doubted a sim racer could compete in real motorsport. But there\'s still work to do to win everyone over.',
      effects: [
        { stat: 'confidence', change: 15 },
        { stat: 'morale', change: 10 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'sim_racing_champion' && 
      player.totalWins >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'From Pixels to Podiums',
      description: 'Your victory is being hailed as a breakthrough moment for sim racers crossing over to real motorsport. Major gaming companies are reaching out!',
      effects: [
        { stat: 'marketability', change: 5 },  // Reduced from 10
        { stat: 'reputation', change: 5 },
        { stat: 'morale', change: 15 }
      ]
    }
  },
  {
    triggerCondition: (_player, bg) => 
      bg.scenarioId === 'sim_racing_champion' && 
      bg.socialMediaFollowers >= 100000,
    event: {
      type: 'background',
      severity: 'minor',
      title: 'Viral Racing Moment',
      description: 'Your latest racing clip has gone viral on social media! Your following continues to grow.',
      effects: [
        { stat: 'marketability', change: 2 },  // Reduced from 5
        { stat: 'morale', change: 5 }
      ]
    }
  },
  
  // ========== MECHANIC'S KID EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'mechanics_kid' && 
      bg.hasEngineeringBackground &&
      player.stats.technicalFeedback >= 70,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Engineers Trust Your Feedback',
      description: 'Your detailed technical feedback has impressed the engineering team. They\'ve implemented your suggestions and found half a second in lap time!',
      effects: [
        { stat: 'reputation', change: 3 },
        { stat: 'confidence', change: 10 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'mechanics_kid' && 
      player.totalRaces >= 5,
    event: {
      type: 'background',
      severity: 'minor',
      title: 'Setup Wizard',
      description: 'Your ability to dial in setups is becoming legendary in the paddock. Drivers are asking for your advice.',
      effects: [
        { stat: 'reputation', change: 2 },
        { stat: 'morale', change: 5 }
      ]
    }
  },
  
  // ========== RECOVERING CHAMPION EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'recovering_champion' && 
      player.totalPodiums >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'The Comeback Kid',
      description: 'Your return to the podium after your injury is making headlines. "The champion is back," they say. It feels good to be racing at the front again.',
      effects: [
        { stat: 'morale', change: 25 },
        { stat: 'confidence', change: 15 },
        { stat: 'reputation', change: 5 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'recovering_champion' && 
      player.mentalState.confidence < 40,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Demons Resurface',
      description: 'The memories of your crash sometimes flood back. A sports psychologist might help you work through these feelings.',
      choices: [
        {
          id: 'therapy',
          text: 'Seek professional help',
          effects: [{ stat: 'mentalStrength', change: 10 }, { stat: 'stress', change: -15 }],
          consequenceDescription: 'You begin working with a professional.'
        },
        {
          id: 'push_through',
          text: 'Push through on your own',
          effects: [{ stat: 'stress', change: 10 }],
          consequenceDescription: 'You try to manage alone.'
        }
      ]
    }
  },
  
  // ========== SECOND CAREER EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'second_career' && 
      player.totalRaces >= 5 && 
      player.totalRaces <= 10,
    event: {
      type: 'background',
      severity: 'minor',
      title: 'New Sport, Same Dedication',
      description: 'Your fitness regime and mental discipline from your previous career are paying dividends. You\'re adapting faster than expected.',
      effects: [
        { stat: 'morale', change: 10 },
        { stat: 'confidence', change: 5 }
      ]
    }
  },
  {
    triggerCondition: (_player, bg) => 
      bg.scenarioId === 'second_career' && 
      bg.socialMediaFollowers >= 200000,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Crossover Star',
      description: 'Your fans from your previous sport are following your racing career closely. The crossover appeal is attracting sponsor interest.',
      effects: [
        { stat: 'marketability', change: 3 },  // Reduced from 8
        { stat: 'morale', change: 5 }
      ]
    }
  },
  
  // ========== NATIONAL CHAMPION EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'national_champion' && 
      player.totalWins >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'International Breakthrough',
      description: 'Your victory proves you can compete on the international stage. Your home country is celebrating!',
      effects: [
        { stat: 'reputation', change: 8 },
        { stat: 'morale', change: 15 },
        { stat: 'confidence', change: 10 }
      ]
    }
  },
  {
    triggerCondition: (_player, bg) => 
      bg.scenarioId === 'national_champion' && 
      bg.hasProvenRacingRecord,
    event: {
      type: 'background',
      severity: 'minor',
      title: 'Home Support',
      description: 'Fans from your home country have organized a support club. Their banners are appearing at circuits worldwide.',
      effects: [
        { stat: 'morale', change: 10 }
      ]
    }
  },
  
  // ========== PRIVATEER EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'privateer' && 
      player.finances.bankBalance < 100000,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Tight Budget',
      description: 'Running your own program is expensive. You need to find additional funding or cut costs.',
      choices: [
        {
          id: 'sponsors',
          text: 'Focus on finding sponsors',
          effects: [{ stat: 'fatigue', change: 10 }],
          consequenceDescription: 'You spend time chasing sponsorship deals.'
        },
        {
          id: 'cut_costs',
          text: 'Cut testing budget',
          effects: [{ stat: 'stress', change: 10 }],
          consequenceDescription: 'Less track time, but more budget headroom.'
        }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.scenarioId === 'privateer' && 
      player.totalPodiums >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'Privateer Success Story',
      description: 'Your podium as a privateer is inspiring other independents. You\'re proof that passion and hard work can compete with big budgets.',
      effects: [
        { stat: 'reputation', change: 10 },
        { stat: 'morale', change: 20 },
        { stat: 'marketability', change: 2 }  // Reduced from 5
      ]
    }
  },
  
  // ========== RICH AMATEUR / PAY DRIVER EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.hasPayDriverStigma && 
      player.totalPodiums >= 1,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Earning Respect',
      description: 'Your podium finish is changing perceptions. People are starting to see you as a legitimate racer, not just a pay driver.',
      effects: [
        { stat: 'confidence', change: 15 },
        { stat: 'reputation', change: 3 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.hasPayDriverStigma && 
      player.totalWins >= 1,
    event: {
      type: 'background',
      severity: 'major',
      title: 'No Longer Just a Pay Driver',
      description: 'Your victory has silenced the doubters. You\'ve proven that you belong here on merit, not just money.',
      effects: [
        { stat: 'confidence', change: 20 },
        { stat: 'morale', change: 15 },
        { stat: 'reputation', change: 5 }
      ]
    }
  },
  
  // ========== GENERAL BACKGROUND EVENTS ==========
  {
    triggerCondition: (player, bg) => 
      bg.needsToProveWorth && 
      player.totalWins >= 3,
    event: {
      type: 'background',
      severity: 'major',
      title: 'Reputation Established',
      description: 'Three wins is no fluke. You\'ve proven yourself beyond any doubt. The skeptics have been permanently silenced.',
      effects: [
        { stat: 'confidence', change: 20 },
        { stat: 'reputation', change: 8 },
        { stat: 'stress', change: -15 }
      ]
    }
  },
  {
    triggerCondition: (player, bg) => 
      bg.mediaScrutinyLevel === 'intense' && 
      player.mentalState.stress > 70,
    event: {
      type: 'background',
      severity: 'moderate',
      title: 'Media Pressure',
      description: 'The constant media attention is taking its toll. Every move you make is analyzed and criticized.',
      effects: [
        { stat: 'fatigue', change: 10 },
        { stat: 'stress', change: 5 }
      ]
    }
  }
]

/**
 * Generate a background-specific event based on player's background and current state
 */
export function generateBackgroundEvent(
  player: PlayerDriver,
  currentWeek: number,
  currentYear: number
): CareerEvent | null {
  const background = player.background
  if (!background) return null
  
  // Base chance for background event
  const eventChance = 0.08 // 8% chance per week
  if (Math.random() > eventChance) return null
  
  // Find applicable events
  const applicableEvents = BACKGROUND_EVENT_TEMPLATES.filter(template => 
    template.triggerCondition(player, background)
  )
  
  if (applicableEvents.length === 0) return null
  
  // Pick a random applicable event
  const template = applicableEvents[Math.floor(Math.random() * applicableEvents.length)]
  
  return {
    ...template.event,
    id: `bg_event_${currentYear}_${currentWeek}_${Math.random().toString(36).substr(2, 9)}`,
    week: currentWeek,
    year: currentYear,
    resolved: false
  }
}

/**
 * Generate an event when player first achieves something notable for their background
 */
export function generateBackgroundMilestoneEvent(
  player: PlayerDriver,
  milestone: 'first_podium' | 'first_win' | 'championship' | 'ten_races',
  currentWeek: number,
  currentYear: number
): CareerEvent | null {
  const background = player.background
  if (!background) return null
  
  // Customize milestone messages based on background
  const customMessages: Record<string, Record<string, { title: string; description: string; effects: EventEffect[] }>> = {
    factory_academy: {
      first_win: {
        title: 'Academy Graduate Wins!',
        description: 'Your first victory as a factory academy driver! The manufacturer is taking notice. Promotion to a more competitive entry is now a real possibility.',
        effects: [{ stat: 'morale', change: 25 }, { stat: 'confidence', change: 20 }, { stat: 'reputation', change: 8 }]
      }
    },
    racing_dynasty: {
      first_win: {
        title: `A New ${player.lastName} Champion Emerges!`,
        description: 'You\'ve won your first race! The media is in a frenzy comparing you to your legendary father. This is the beginning of your own legacy.',
        effects: [{ stat: 'morale', change: 30 }, { stat: 'marketability', change: 5 }, { stat: 'reputation', change: 10 }]  // marketability reduced from 10
      }
    },
    sim_racing_champion: {
      first_win: {
        title: 'Sim to Reality: Champion!',
        description: 'You\'ve done it! A world-first - from esports champion to real-world race winner. You\'re going viral!',
        effects: [{ stat: 'morale', change: 30 }, { stat: 'marketability', change: 8 }, { stat: 'reputation', change: 10 }]  // marketability reduced from 15
      }
    },
    recovering_champion: {
      first_win: {
        title: 'The Champion Returns!',
        description: 'From the hospital bed to the top step of the podium. Your comeback victory is the story of the season.',
        effects: [{ stat: 'morale', change: 35 }, { stat: 'confidence', change: 25 }, { stat: 'reputation', change: 10 }]
      }
    }
  }
  
  const backgroundMessages = customMessages[background.scenarioId]
  if (!backgroundMessages || !backgroundMessages[milestone]) return null
  
  const messageData = backgroundMessages[milestone]
  
  return {
    id: `bg_milestone_${milestone}_${currentYear}_${currentWeek}`,
    type: 'background',
    severity: 'major',
    title: messageData.title,
    description: messageData.description,
    week: currentWeek,
    year: currentYear,
    effects: messageData.effects,
    resolved: false
  }
}
