/**
 * Daily Briefing System
 * 
 * Generates contextual "morning briefing" content each day to make
 * quiet days feel alive. Includes:
 * - Daily summary/briefing email from team manager
 * - Race week countdown messaging
 * - Quick decision prompts (small choices with minor effects)
 * - Paddock news headlines
 */

import type { CareerState, PlayerDriver, ActivityEffect } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export interface DailyBriefingContent {
  /** Morning briefing email from team manager */
  briefingEmail?: BriefingEmail
  
  /** Quick decision prompt (optional, ~30% chance per day) */
  quickDecision?: QuickDecisionPrompt
  
  /** News headlines for the day */
  newsHeadlines: NewsHeadline[]
}

export interface BriefingEmail {
  subject: string
  body: string
  sender: string
  senderRole: string
  category: string
}

export interface QuickDecisionPrompt {
  id: string
  title: string
  description: string
  options: QuickDecisionOption[]
}

export interface QuickDecisionOption {
  id: string
  text: string
  /** Immediate effects applied when this option is selected */
  effects: ActivityEffect
  resultMessage: string
  /** If set, schedules this activity template for today instead of applying morale effects directly */
  scheduleActivityId?: string
}

export interface NewsHeadline {
  id: string
  headline: string
  source: string
  category: 'racing' | 'transfer' | 'technical' | 'business' | 'scandal'
  isAboutPlayer: boolean
}

// ============================================
// CONTEXT
// ============================================

interface BriefingContext {
  currentWeek: number
  currentDay: number
  currentYear: number
  dayName: string
  
  // Race info
  nextRaceTrack?: string
  nextRaceWeek?: number
  daysToNextRace: number
  isRaceWeek: boolean
  lastRaceResult?: { position: number; track: string }
  
  // Team state
  teamName: string
  teamCash: number
  boardMood: number
  teamMorale: number
  staffCount: number
  
  // Player state
  playerName: string
  reputation: number
  stress: number
  fatigue: number
  hoursAvailable: number
  
  // Schedule
  activitiesToday: number
  mandatoryActivitiesToday: number
  
  // Season
  championshipPosition: number
  racesRemaining: number
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export function generateDailyBriefing(
  careerState: CareerState,
  player: PlayerDriver
): DailyBriefingContent {
  const ctx = buildBriefingContext(careerState, player)
  
  return {
    briefingEmail: generateMorningBriefing(ctx),
    quickDecision: maybeGenerateQuickDecision(ctx),
    newsHeadlines: generateNewsHeadlines(ctx)
  }
}

// ============================================
// MORNING BRIEFING EMAIL
// ============================================

function generateMorningBriefing(ctx: BriefingContext): BriefingEmail {
  const greeting = getGreeting(ctx)
  const weatherLine = getWeatherLine(ctx)
  const scheduleSection = getScheduleSection(ctx)
  const raceCountdown = getRaceCountdown(ctx)
  const keyMetrics = getKeyMetrics(ctx)
  const closingLine = getClosingLine(ctx)
  
  const body = [
    greeting,
    '',
    weatherLine,
    '',
    scheduleSection,
    raceCountdown ? `\n${raceCountdown}` : '',
    '',
    keyMetrics,
    '',
    closingLine,
    '',
    'Your Team Manager'
  ].filter(Boolean).join('\n')
  
  return {
    subject: `📋 ${ctx.dayName} Briefing — Week ${ctx.currentWeek}`,
    body,
    sender: 'Team Manager',
    senderRole: 'Management',
    category: 'team'
  }
}

function getGreeting(ctx: BriefingContext): string {
  if (ctx.stress > 70) {
    return `Good morning, boss. I know things have been intense — take it one step at a time today.`
  }
  if (ctx.isRaceWeek) {
    return `Good morning! Race week energy in the paddock today. Everyone's fired up.`
  }
  if (ctx.fatigue > 60) {
    return `Morning, boss. You've been working hard lately. Remember to pace yourself.`
  }
  
  const greetings = [
    `Good morning, boss. Here's your daily rundown.`,
    `Morning! Let's have a productive ${ctx.dayName}.`,
    `Another day, another opportunity. Here's what's on the agenda.`,
    `Rise and shine. The factory's already buzzing. Here's what you need to know.`
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

function getWeatherLine(ctx: BriefingContext): string {
  if (ctx.isRaceWeek) {
    const conditions = ['Sunny and dry', 'Cloudy with a chance of rain', 'Overcast but dry', 'Clear skies']
    return `📍 Track conditions: ${conditions[Math.floor(Math.random() * conditions.length)]}`
  }
  return ''
}

function getScheduleSection(ctx: BriefingContext): string {
  if (ctx.activitiesToday > 0) {
    const mandatory = ctx.mandatoryActivitiesToday > 0 
      ? ` (${ctx.mandatoryActivitiesToday} mandatory)` 
      : ''
    return `📅 Today's schedule: ${ctx.activitiesToday} activit${ctx.activitiesToday === 1 ? 'y' : 'ies'}${mandatory}\n⏰ Available hours: ${ctx.hoursAvailable}h`
  }
  return `📅 No scheduled activities today. You have ${ctx.hoursAvailable}h available.\n💡 This is a good time to schedule optional activities or review strategy.`
}

function getRaceCountdown(ctx: BriefingContext): string {
  if (ctx.isRaceWeek) {
    return `🏁 RACE WEEK! ${ctx.nextRaceTrack || 'Race'} this weekend!\nThe whole team is focused on delivering. Make sure all preparations are complete.`
  }
  
  if (ctx.daysToNextRace > 0 && ctx.daysToNextRace <= 14) {
    return `🏁 Race countdown: ${ctx.daysToNextRace} days until ${ctx.nextRaceTrack || 'next race'}`
  }
  
  if (ctx.lastRaceResult) {
    return `📊 Last race: P${ctx.lastRaceResult.position} at ${ctx.lastRaceResult.track}`
  }
  
  return ''
}

function getKeyMetrics(ctx: BriefingContext): string {
  const lines: string[] = ['📊 Key Metrics:']
  
  if (ctx.teamCash < 50000) {
    lines.push(`  💰 Budget: $${ctx.teamCash.toLocaleString()} ⚠️ LOW`)
  }
  
  if (ctx.boardMood < 40) {
    lines.push(`  🏛️ Board Mood: ${ctx.boardMood}% — needs attention`)
  }
  
  if (ctx.teamMorale < 50) {
    lines.push(`  👥 Team Morale: ${ctx.teamMorale}% — could be better`)
  }
  
  if (ctx.championshipPosition <= 5) {
    lines.push(`  🏆 Championship: P${ctx.championshipPosition}`)
  }
  
  if (lines.length === 1) {
    lines.push(`  ✅ All systems nominal. Keep it up.`)
  }
  
  return lines.join('\n')
}

function getClosingLine(ctx: BriefingContext): string {
  if (ctx.boardMood < 30) return `The board is watching. Let's show them what we can do.`
  if (ctx.stress > 75) return `Please take care of yourself today, boss.`
  if (ctx.isRaceWeek) return `Let's bring home some points this weekend!`
  
  const closings = [
    `Let me know if you need anything.`,
    `Have a good one, boss.`,
    `The team is behind you. Let's make today count.`,
    `Anything you need, just shout.`
  ]
  return closings[Math.floor(Math.random() * closings.length)]
}

// ============================================
// QUICK DECISION PROMPTS
// ============================================

function maybeGenerateQuickDecision(ctx: BriefingContext): QuickDecisionPrompt | undefined {
  // ~25% chance of a quick decision per day
  if (Math.random() > 0.25) return undefined
  
  const decisions = getAvailableDecisions(ctx)
  if (decisions.length === 0) return undefined
  
  return decisions[Math.floor(Math.random() * decisions.length)]
}

function getAvailableDecisions(ctx: BriefingContext): QuickDecisionPrompt[] {
  const decisions: QuickDecisionPrompt[] = []
  const uid = `w${ctx.currentWeek}d${ctx.currentDay}`
  
  // ──────────────────────────────────────────
  // TEAM & MORALE DECISIONS
  // ──────────────────────────────────────────
  
  // Staff lunch request (always available)
  decisions.push({
    id: `quick_lunch_${uid}`,
    title: 'Team Lunch Request',
    description: 'Your team manager asks if you\'d like to organise a team lunch today. It\'ll take an hour but could boost morale.',
    options: [
      { id: 'yes', text: 'Sure, let\'s do it. Team bonding is important.', effects: {}, scheduleActivityId: 'team_lunch', resultMessage: 'Team lunch scheduled! Should be great for bonding if it goes well.' },
      { id: 'no', text: 'Not today. We need to stay focused.', effects: { teamMorale: -2 }, resultMessage: 'The team\'s a bit disappointed, but they understand. Back to work.' },
      { id: 'pizza', text: 'Order pizza for everyone. On me.', effects: { budgetImpact: -500 }, resultMessage: 'Pizza ordered! A nice gesture, though it\'s not quite the same as proper bonding time.' }
    ]
  })
  
  // Staff birthday (always available)
  decisions.push({
    id: `quick_birthday_${uid}`,
    title: 'Staff Birthday',
    description: 'It\'s one of your engineer\'s birthdays today. The team suggests getting a cake and taking a short break to celebrate.',
    options: [
      { id: 'celebrate', text: 'Absolutely! Get a cake and celebrate together.', effects: { teamMorale: 3, budgetImpact: -150 }, resultMessage: 'The team had a great time celebrating! The birthday engineer was touched.' },
      { id: 'card', text: 'A card and a handshake will do. We\'re busy.', effects: { teamMorale: -1 }, resultMessage: 'The engineer appreciated the card, though some colleagues wished for more.' },
      { id: 'bonus', text: 'Give them a personal bonus as a birthday gift.', effects: { teamMorale: 2, budgetImpact: -1000 }, resultMessage: 'Generous move. The engineer is over the moon, and word spreads to the rest of the team.' }
    ]
  })
  
  // Coffee machine broken
  decisions.push({
    id: `quick_coffee_${uid}`,
    title: 'Coffee Machine Emergency',
    description: 'The main coffee machine in the factory has broken down. Staff morale is… fragile.',
    options: [
      { id: 'fix', text: 'Get it fixed immediately. This is a priority.', effects: { budgetImpact: -500, teamMorale: 1 }, resultMessage: 'Repair technician called. Crisis averted. The team can function again.' },
      { id: 'upgrade', text: 'Time for an upgrade. Get a proper espresso machine.', effects: { budgetImpact: -2500, teamMorale: 4 }, resultMessage: 'New espresso machine installed. The factory has never been happier.' },
      { id: 'ignore', text: 'They can drink water. Not a priority.', effects: { teamMorale: -3 }, resultMessage: 'Productivity drops noticeably. Some engineers are visibly grumpy.' }
    ]
  })
  
  // Staff conflict
  if (ctx.staffCount > 3) {
    decisions.push({
      id: `quick_conflict_${uid}`,
      title: 'Staff Disagreement',
      description: 'Two senior staff members have a disagreement about the development direction. It\'s getting personal.',
      options: [
        { id: 'mediate', text: 'Call them both in. I\'ll mediate.', effects: { teamMorale: 2, stress: 5 }, resultMessage: 'You helped them find common ground. Respect restored.' },
        { id: 'delegate', text: 'Have the team manager sort it out.', effects: { teamMorale: -1 }, resultMessage: 'It got resolved eventually, but both feel you should have stepped in.' },
        { id: 'side', text: 'Back the more experienced member. Seniority matters.', effects: { teamMorale: -2, boardMood: 1 }, resultMessage: 'The senior staff member is pleased, but the other feels undermined. Risky move.' }
      ]
    })
  }
  
  // Team morale check (when morale is low)
  if (ctx.teamMorale < 50) {
    decisions.push({
      id: `quick_morale_boost_${uid}`,
      title: 'Morale is Low',
      description: 'The team manager flags that morale is particularly low right now. A gesture could help.',
      options: [
        { id: 'teambuilding', text: 'Schedule a team building afternoon.', effects: {}, scheduleActivityId: 'team_building', resultMessage: 'Team building day scheduled. Hopefully it lifts spirits.' },
        { id: 'speech', text: 'Give a motivational speech to the team.', effects: { teamMorale: 2, confidence: 1 }, resultMessage: 'You rallied the troops. Not everyone was convinced, but it helped.' },
        { id: 'bonuses', text: 'Announce small performance bonuses this month.', effects: { teamMorale: 5, budgetImpact: -5000 }, resultMessage: 'Money talks. The team perks up noticeably.' }
      ]
    })
  }
  
  // Overtime request
  if (ctx.isRaceWeek || ctx.daysToNextRace <= 7) {
    decisions.push({
      id: `quick_overtime_${uid}`,
      title: 'Overtime Request',
      description: 'The chief engineer asks if the team can work overtime this week to finish critical preparation work.',
      options: [
        { id: 'approve', text: 'Yes, pay overtime rates. The race matters.', effects: { developmentPoints: 2, budgetImpact: -3000, teamMorale: -1 }, resultMessage: 'Extra hours logged. The car should be better prepared, though the team is tired.' },
        { id: 'deny', text: 'No overtime. Tired engineers make mistakes.', effects: { teamMorale: 1 }, resultMessage: 'The team appreciates the balance, though the chief engineer is frustrated.' },
        { id: 'voluntary', text: 'Make it voluntary with time off in lieu.', effects: { developmentPoints: 1, teamMorale: 1 }, resultMessage: 'Some volunteer, some don\'t. A fair compromise.' }
      ]
    })
  }
  
  // Team photo opportunity
  if (!ctx.isRaceWeek && ctx.reputation > 20) {
    decisions.push({
      id: `quick_team_photo_${uid}`,
      title: 'Team Photo Day',
      description: 'The marketing department suggests scheduling a team photo session for sponsor materials and the website.',
      options: [
        { id: 'schedule', text: 'Good idea. Let\'s do it properly.', effects: {}, scheduleActivityId: 'team_photo_session', resultMessage: 'Photo session scheduled. Should produce great content for sponsors.' },
        { id: 'quick', text: 'Just take a quick group selfie outside. Good enough.', effects: { fanSentiment: 1, teamMorale: 1 }, resultMessage: 'Casual but authentic. Fans actually love the informal vibe.' },
        { id: 'skip', text: 'Not now. We have bigger priorities.', effects: { fanSentiment: -1 }, resultMessage: 'The marketing team is disappointed. Those sponsor decks will have to wait.' }
      ]
    })
  }
  
  // ──────────────────────────────────────────
  // MEDIA & PR DECISIONS
  // ──────────────────────────────────────────
  
  // Quick interview opportunity
  if (ctx.reputation > 30) {
    decisions.push({
      id: `quick_media_${uid}`,
      title: 'Quick Interview Request',
      description: 'A local radio station wants a 10-minute phone interview about the upcoming race. Easy exposure.',
      options: [
        { id: 'accept', text: 'Happy to do it. Good for visibility.', effects: { reputation: 1, marketability: 1 }, resultMessage: 'Quick interview done. You came across well.' },
        { id: 'decline', text: 'I\'m too busy today. Decline politely.', effects: { reputation: -1 }, resultMessage: 'They understood, but you missed an easy exposure opportunity.' },
        { id: 'delegate', text: 'Have the PR manager handle it and mention the team sponsors.', effects: { sponsorSatisfaction: 1 }, resultMessage: 'PR handled it professionally. Sponsors get a mention.' }
      ]
    })
  }
  
  // Journalist factory tour
  if (ctx.reputation > 40 && !ctx.isRaceWeek) {
    decisions.push({
      id: `quick_factorytour_${uid}`,
      title: 'Journalist Factory Tour',
      description: 'A well-known motorsport journalist has asked to visit your factory for a feature article. Could be great exposure.',
      options: [
        { id: 'accept', text: 'Welcome them in. Schedule a proper tour.', effects: {}, scheduleActivityId: 'factory_tour_media', resultMessage: 'Factory tour scheduled. This could be a great piece for the team.' },
        { id: 'limited', text: 'Allow a brief visit but keep sensitive areas off-limits.', effects: { reputation: 1, fanSentiment: 1 }, resultMessage: 'Controlled visit done. Decent article but they wanted more access.' },
        { id: 'decline', text: 'Too risky. Competitors could learn from the photos.', effects: { reputation: -1 }, resultMessage: 'The journalist was disappointed. They might write about your secrecy instead.' }
      ]
    })
  }
  
  // Podcast invitation
  if (ctx.reputation > 25) {
    decisions.push({
      id: `quick_podcast_${uid}`,
      title: 'Podcast Invitation',
      description: 'A popular motorsport podcast wants you on their next episode. It\'d be a remote interview, about an hour.',
      options: [
        { id: 'accept', text: 'Love podcasts. I\'m in.', effects: { reputation: 2, fanSentiment: 3, personalFollowers: 500, marketability: 1 }, resultMessage: 'Great episode! The hosts loved your stories. Engagement was high.' },
        { id: 'later', text: 'Not this week. Ask them to reschedule.', effects: {}, resultMessage: 'They\'ll come back to you. No harm done — for now.' },
        { id: 'decline', text: 'Decline. I prefer to stay out of the spotlight.', effects: { reputation: -1, fanSentiment: -1 }, resultMessage: 'Opportunity missed. Fans are wondering why you\'re so media-shy.' }
      ]
    })
  }
  
  // Social media strategy (not race week)
  if (!ctx.isRaceWeek) {
    decisions.push({
      id: `quick_social_${uid}`,
      title: 'Social Media Content',
      description: 'The PR team wants guidance on today\'s social media post theme.',
      options: [
        { id: 'bts', text: 'Behind-the-scenes factory tour content.', effects: { fanSentiment: 2, reputation: 1, teamFollowers: 300 }, resultMessage: 'Fans love the behind-the-scenes look! Great engagement.' },
        { id: 'throwback', text: 'Throwback to our last great result.', effects: { fanSentiment: 1, teamFollowers: 150 }, resultMessage: 'Nice nostalgia post. Good engagement.' },
        { id: 'skip', text: 'Skip today. Don\'t post for the sake of posting.', effects: { fanSentiment: -1 }, resultMessage: 'The algorithm doesn\'t forgive inactivity. Engagement drops slightly.' }
      ]
    })
  }
  
  // Viral moment (random, reputation-dependent)
  if (ctx.reputation > 50) {
    decisions.push({
      id: `quick_viral_${uid}`,
      title: 'Viral Opportunity',
      description: 'A funny clip from the factory has gone semi-viral on social media. The PR team wants to amplify it.',
      options: [
        { id: 'amplify', text: 'Share it on our official channels. Lean into it!', effects: { fanSentiment: 4, teamFollowers: 2000, personalFollowers: 800, teamMorale: 1 }, resultMessage: 'The clip blows up! Great organic engagement and the team is loving the attention.' },
        { id: 'cautious', text: 'Let it run naturally. Don\'t force it.', effects: { fanSentiment: 1, teamFollowers: 500 }, resultMessage: 'It fizzles out after a day. Still some positive engagement though.' },
        { id: 'remove', text: 'Take it down. We need to control our image.', effects: { fanSentiment: -2, teamMorale: -1 }, resultMessage: 'Fans noticed it disappeared. Some accuse you of being "no fun". Team is deflated.' }
      ]
    })
  }
  
  // Fan mail
  decisions.push({
    id: `quick_fanmail_${uid}`,
    title: 'Fan Letter',
    description: 'A young fan has written a heartfelt letter about how your team inspired them to study engineering. The PR team asks how to respond.',
    options: [
      { id: 'personal', text: 'Write a personal reply and send team merchandise.', effects: { fanSentiment: 3, reputation: 1, budgetImpact: -100, driverMorale: 1 }, resultMessage: 'The fan is ecstatic. Their parents posted your reply on social media — heartwarming stuff.' },
      { id: 'standard', text: 'Send a standard reply with an autograph card.', effects: { fanSentiment: 1 }, resultMessage: 'Nice gesture. Standard but appreciated.' },
      { id: 'ignore', text: 'We don\'t have time for fan mail right now.', effects: { fanSentiment: -1 }, resultMessage: 'The letter sits unanswered. A small thing, but it says something.' }
    ]
  })
  
  // ──────────────────────────────────────────
  // DRIVER RELATIONSHIP DECISIONS
  // ──────────────────────────────────────────
  
  // Driver check-in
  if (ctx.fatigue < 50) {
    decisions.push({
      id: `quick_driver_chat_${uid}`,
      title: 'Driver Check-in',
      description: 'You have a few minutes free. Worth checking in with your driver to see how they\'re feeling?',
      options: [
        { id: 'yes', text: 'Good idea. Let\'s have a quick coffee.', effects: { driverMorale: 2, confidence: 1 }, resultMessage: 'Good chat with the driver. They appreciated the time.' },
        { id: 'no', text: 'They seem fine. No need right now.', effects: { driverMorale: -1 }, resultMessage: 'Your driver is fine — for now. But they notice when you don\'t check in.' },
        { id: 'formal', text: 'Schedule a proper debrief instead. Let\'s be structured.', effects: {}, scheduleActivityId: 'driver_debrief', resultMessage: 'Formal debrief session scheduled. A more structured approach.' }
      ]
    })
  }
  
  // Driver fitness concern
  if (ctx.fatigue > 60) {
    decisions.push({
      id: `quick_driver_fatigue_${uid}`,
      title: 'Driver Fatigue Warning',
      description: 'The team physiotherapist reports your driver looks worn out. They suggest a lighter schedule.',
      options: [
        { id: 'rest', text: 'Give them the afternoon off. Health comes first.', effects: { driverMorale: 3, driverFatigue: -15, confidence: 1 }, resultMessage: 'The driver rested up. They\'ll be sharper for it.' },
        { id: 'pushthrough', text: 'We can\'t afford downtime. Push through.', effects: { driverMorale: -2, stress: 5 }, resultMessage: 'The driver soldiers on, but they\'re clearly running on fumes.' },
        { id: 'physio', text: 'Book an extra physio session instead.', effects: { driverFatigue: -8, budgetImpact: -500 }, resultMessage: 'The physio session helped take the edge off. Not a full rest, but better.' }
      ]
    })
  }
  
  // Driver wants helmet change
  decisions.push({
    id: `quick_helmet_${uid}`,
    title: 'Helmet Design Request',
    description: 'Your driver wants to run a special helmet design at the next race — a tribute to a childhood hero. It\'ll cost a bit to produce.',
    options: [
      { id: 'approve', text: 'Love it. Let them express themselves.', effects: { driverMorale: 3, fanSentiment: 2, budgetImpact: -800 }, resultMessage: 'The new helmet looks fantastic. Fans and media love the story behind it.' },
      { id: 'deny', text: 'Stick to the team livery colours. Brand consistency matters.', effects: { driverMorale: -2, sponsorSatisfaction: 1 }, resultMessage: 'The driver is disappointed, but sponsors appreciate the consistency.' },
      { id: 'compromise', text: 'Small tribute elements only. Keep it subtle.', effects: { driverMorale: 1, budgetImpact: -300 }, resultMessage: 'A nice compromise. The driver adds a small nod to their hero.' }
    ]
  })
  
  // Driver confidence (when low confidence)
  if (ctx.stress > 40) {
    decisions.push({
      id: `quick_confidence_${uid}`,
      title: 'Driver Confidence Dip',
      description: 'Your driver seems less confident lately. The data engineer noticed they\'re being cautious in corners. Time for a pep talk?',
      options: [
        { id: 'peptalk', text: 'Pull them aside. Remind them how good they are.', effects: { confidence: 3, driverMorale: 2, stress: -3 }, resultMessage: 'Your words clearly resonated. They look more determined.' },
        { id: 'data', text: 'Show them the telemetry — they ARE fast. Let the numbers talk.', effects: { confidence: 2, developmentPoints: 1 }, resultMessage: 'Hard to argue with data. They see they\'re closer to the pace than they thought.' },
        { id: 'ignore', text: 'It\'ll sort itself out. Confidence comes with results.', effects: { confidence: -1, driverMorale: -1 }, resultMessage: 'The issue festers. Lap times aren\'t improving.' }
      ]
    })
  }
  
  // ──────────────────────────────────────────
  // FACILITY & WORKSHOP DECISIONS
  // ──────────────────────────────────────────
  
  // Workshop maintenance
  if (ctx.teamCash > 20000) {
    decisions.push({
      id: `quick_facility_${uid}`,
      title: 'Workshop Maintenance',
      description: 'The workshop floor needs cleaning and some equipment needs recalibrating. Do it now or wait until it\'s quiet?',
      options: [
        { id: 'now', text: 'Do it now. Clean workspace = better work.', effects: {}, scheduleActivityId: 'workshop_maintenance', resultMessage: 'Workshop maintenance scheduled. Should keep the engineers happy.' },
        { id: 'later', text: 'Wait until we have a gap in the schedule.', effects: { teamMorale: -1 }, resultMessage: 'The messy workshop nags at a few engineers, but it\'ll wait.' },
        { id: 'upgrade', text: 'While we\'re at it, upgrade the calibration equipment.', effects: {}, scheduleActivityId: 'workshop_upgrade', resultMessage: 'Equipment upgrade scheduled! Expensive, but should pay dividends in accuracy.' }
      ]
    })
  }
  
  // Safety briefing (always relevant)
  decisions.push({
    id: `quick_safety_${uid}`,
    title: 'Safety Protocol Update',
    description: 'The health & safety officer reminds you the team is overdue for a safety briefing. It\'s quick but mandatory by the end of the month.',
    options: [
      { id: 'now', text: 'Do it today. Let\'s stay compliant.', effects: {}, scheduleActivityId: 'safety_briefing', resultMessage: 'Safety briefing scheduled. The board will appreciate the diligence.' },
      { id: 'later', text: 'We\'ll get to it next week. No rush.', effects: { boardMood: -2 }, resultMessage: 'Pushing it back. Don\'t forget — non-compliance is expensive.' },
      { id: 'email', text: 'Send a safety reminder email instead. Good enough.', effects: { boardMood: -1, teamMorale: 1 }, resultMessage: 'Email sent. Technically not a briefing, but it\'s something. The board may disagree.' }
    ]
  })
  
  // IT/Tech issue
  decisions.push({
    id: `quick_it_issue_${uid}`,
    title: 'IT System Slowdown',
    description: 'The factory network has been sluggish all morning. Engineers are complaining it\'s slowing down simulation work.',
    options: [
      { id: 'fix', text: 'Call in IT support immediately.', effects: { budgetImpact: -1500, teamMorale: 1, developmentPoints: 1 }, resultMessage: 'IT support resolved the issue. Simulations are running smoothly again.' },
      { id: 'restart', text: 'Have everyone restart their machines. Classic fix.', effects: { teamMorale: -1 }, resultMessage: 'Some improvement, but the underlying issue persists. Engineers are not impressed.' },
      { id: 'upgrade', text: 'This keeps happening. Invest in a proper server upgrade.', effects: { budgetImpact: -8000, teamMorale: 3, developmentPoints: 2 }, resultMessage: 'New server infrastructure ordered. No more bottlenecks. Engineers are thrilled.' }
    ]
  })
  
  // Parking / facilities
  if (ctx.staffCount > 5) {
    decisions.push({
      id: `quick_parking_${uid}`,
      title: 'Parking Complaints',
      description: 'Several staff members have complained about the lack of parking spaces. The car park is always full by 8am.',
      options: [
        { id: 'expand', text: 'Rent additional parking spaces from the neighbouring lot.', effects: { budgetImpact: -2000, teamMorale: 2 }, resultMessage: 'Extra parking secured. No more circling the block at 7:55am.' },
        { id: 'carpool', text: 'Encourage carpooling with an incentive scheme.', effects: { budgetImpact: -500, teamMorale: 1 }, resultMessage: 'A few take you up on it. At least it\'s a start.' },
        { id: 'ignore', text: 'Parking is not a team priority right now.', effects: { teamMorale: -2 }, resultMessage: 'The grumbling continues. It\'s a small thing, but small things add up.' }
      ]
    })
  }
  
  // Break room renovation
  decisions.push({
    id: `quick_breakroom_${uid}`,
    title: 'Break Room Condition',
    description: 'The team break room is looking tired. Stained sofas, flickering lights, and the microwave sounds like a turbine.',
    options: [
      { id: 'renovate', text: 'Full renovation. Our people deserve a proper space.', effects: { budgetImpact: -5000, teamMorale: 5, boardMood: 1 }, resultMessage: 'New break room incoming! The team is genuinely excited about this.' },
      { id: 'patch', text: 'Replace the worst items. Keep costs down.', effects: { budgetImpact: -1000, teamMorale: 2 }, resultMessage: 'New microwave and a fresh sofa. It\'s something.' },
      { id: 'ignore', text: 'It\'s a break room, not a hotel. Leave it.', effects: { teamMorale: -2 }, resultMessage: 'The team sighs. Another thing that won\'t get fixed.' }
    ]
  })
  
  // ──────────────────────────────────────────
  // DEVELOPMENT & TECHNICAL DECISIONS
  // ──────────────────────────────────────────
  
  // Engineer proposes new approach
  if (ctx.teamCash > 10000) {
    decisions.push({
      id: `quick_engineer_idea_${uid}`,
      title: 'Engineer\'s Proposal',
      description: 'A junior engineer has pitched an unconventional aerodynamic concept. The chief engineer is sceptical but intrigued.',
      options: [
        { id: 'fund', text: 'Give them a small budget to prototype it.', effects: { budgetImpact: -4000, developmentPoints: 3, teamMorale: 2 }, resultMessage: 'The prototype shows promise! Even the chief engineer is coming around.' },
        { id: 'research', text: 'Run simulations first. Don\'t commit resources yet.', effects: {}, scheduleActivityId: 'data_analysis_session', resultMessage: 'Data analysis session scheduled. Let the numbers decide.' },
        { id: 'reject', text: 'Stick to proven methods. We can\'t afford experiments.', effects: { teamMorale: -2 }, resultMessage: 'The junior engineer is deflated. Innovation takes a back seat.' }
      ]
    })
  }
  
  // Data analysis opportunity
  if (!ctx.isRaceWeek) {
    decisions.push({
      id: `quick_data_review_${uid}`,
      title: 'Data Review Opportunity',
      description: 'The data engineers have compiled last race\'s telemetry into a detailed report. Worth reviewing together?',
      options: [
        { id: 'review', text: 'Schedule a deep dive session with the engineers.', effects: {}, scheduleActivityId: 'data_analysis_session', resultMessage: 'Data session scheduled. Should give us useful insights for the next race.' },
        { id: 'summary', text: 'Just send me the executive summary. I trust the team.', effects: { developmentPoints: 1, confidence: 1 }, resultMessage: 'Summary reviewed. Quick insights absorbed, though you might have missed nuances.' },
        { id: 'skip', text: 'We need to look forward, not back. Move on.', effects: { developmentPoints: -1 }, resultMessage: 'Some valuable data goes unexamined. The engineers feel their work was wasted.' }
      ]
    })
  }
  
  // Supplier discount opportunity
  if (ctx.teamCash > 15000) {
    decisions.push({
      id: `quick_supplier_${uid}`,
      title: 'Supplier Discount Offer',
      description: 'Your parts supplier is offering a 20% discount on a bulk order — but you\'d need to commit now. The parts would be useful all season.',
      options: [
        { id: 'buy', text: 'Lock in the deal. 20% off is significant.', effects: { budgetImpact: -12000, developmentPoints: 2 }, resultMessage: 'Bulk order placed. Good deal — these parts will last the season.' },
        { id: 'negotiate', text: 'Counter with 30% off. They want our business.', effects: { budgetImpact: -9000, developmentPoints: 2, reputation: 1 }, resultMessage: 'They agreed to 25%. Even better deal! Your negotiation skills impress.' },
        { id: 'decline', text: 'Too much cash tied up in stock. Decline.', effects: {}, resultMessage: 'No deal. You\'ll pay full price when you need parts later, but your cash flow is protected.' }
      ]
    })
  }
  
  // ──────────────────────────────────────────
  // FINANCIAL & BUSINESS DECISIONS
  // ──────────────────────────────────────────
  
  // Sponsor wants extra branding
  decisions.push({
    id: `quick_sponsor_branding_${uid}`,
    title: 'Sponsor Branding Request',
    description: 'A sponsor asks if their logo can be made larger on the car. It would look a bit cluttered, but they\'re paying good money.',
    options: [
      { id: 'approve', text: 'Their money, their visibility. Make it bigger.', effects: { sponsorSatisfaction: 3, fanSentiment: -1 }, resultMessage: 'Sponsor is very happy. The car looks a bit busier, but they\'re paying the bills.' },
      { id: 'compromise', text: 'Offer a different, more prominent position instead.', effects: { sponsorSatisfaction: 2, reputation: 1 }, resultMessage: 'Creative solution. Sponsor gets visibility without cluttering the livery.' },
      { id: 'deny', text: 'The livery design stays as is. Brand integrity matters.', effects: { sponsorSatisfaction: -2, fanSentiment: 1 }, resultMessage: 'Purists approve, but the sponsor isn\'t thrilled. They might remember this at renewal time.' }
    ]
  })
  
  // Cost-cutting suggestion
  if (ctx.teamCash < 100000) {
    decisions.push({
      id: `quick_costcut_${uid}`,
      title: 'Cost-Cutting Suggestion',
      description: 'The finance director suggests cutting the travel catering budget by 40% to save money. "Sandwiches are fine," they say.',
      options: [
        { id: 'cut', text: 'Agreed. Savings are savings.', effects: { budgetImpact: 3000, teamMorale: -3 }, resultMessage: 'Budget trimmed. The team notices the cheaper food immediately. Not popular.' },
        { id: 'moderate', text: 'Cut by 20% instead. Find a balance.', effects: { budgetImpact: 1500, teamMorale: -1 }, resultMessage: 'Modest savings made. The team barely notices the change.' },
        { id: 'reject', text: 'Our people work hard. Don\'t touch the food budget.', effects: { teamMorale: 2 }, resultMessage: 'The team appreciates you standing up for them. The finance director sighs.' }
      ]
    })
  }
  
  // Merchandise opportunity
  decisions.push({
    id: `quick_merch_${uid}`,
    title: 'Merchandise Idea',
    description: 'A designer has mocked up a limited-edition team cap. It looks great and could sell well, but you\'d need to invest in production.',
    options: [
      { id: 'produce', text: 'Go for it. Invest in a small production run.', effects: { budgetImpact: -3000, fanSentiment: 3, teamFollowers: 500 }, resultMessage: 'The caps sell out in days! Good profit and great fan engagement.' },
      { id: 'online', text: 'Do a pre-order campaign to reduce risk.', effects: { budgetImpact: -500, fanSentiment: 2, teamFollowers: 300 }, resultMessage: 'Pre-orders look promising. Lower risk, but slower rollout.' },
      { id: 'pass', text: 'Nice idea, but we have bigger fish to fry.', effects: { fanSentiment: -1 }, resultMessage: 'The designer is deflated. A missed opportunity for fan engagement.' }
    ]
  })
  
  // ──────────────────────────────────────────
  // COMMUNITY & CHARITY DECISIONS
  // ──────────────────────────────────────────
  
  // Charity event invitation
  if (ctx.reputation > 20) {
    decisions.push({
      id: `quick_charity_${uid}`,
      title: 'Charity Event Invitation',
      description: 'A local children\'s charity has invited you to attend their annual fundraiser. It\'s good PR but takes an afternoon.',
      options: [
        { id: 'attend', text: 'We\'ll be there. Schedule it.', effects: {}, scheduleActivityId: 'charity_appearance', resultMessage: 'Charity appearance scheduled. Great for the community and our reputation.' },
        { id: 'donate', text: 'Can\'t attend, but send a generous donation and signed merchandise.', effects: { reputation: 1, budgetImpact: -2000, fanSentiment: 2 }, resultMessage: 'The charity is grateful. Your donation is acknowledged publicly.' },
        { id: 'decline', text: 'Politely decline. We\'re too busy this season.', effects: { reputation: -1 }, resultMessage: 'Understandable, but it doesn\'t look great. Community engagement matters.' }
      ]
    })
  }
  
  // School visit request
  if (!ctx.isRaceWeek) {
    decisions.push({
      id: `quick_school_${uid}`,
      title: 'School Visit Request',
      description: 'A local school asks if someone from the team could visit and talk about STEM careers in motorsport.',
      options: [
        { id: 'visit', text: 'I\'ll go personally. Great to inspire the next generation.', effects: {}, scheduleActivityId: 'school_visit', resultMessage: 'School visit scheduled. Rewarding experience ahead!' },
        { id: 'send', text: 'Send one of our engineers. They\'ll be more relatable.', effects: { reputation: 1, fanSentiment: 2, teamMorale: 1 }, resultMessage: 'The engineer gave an inspiring talk. Kids loved it, and the engineer felt valued.' },
        { id: 'decline', text: 'We can\'t spare anyone right now.', effects: { fanSentiment: -1 }, resultMessage: 'Shame. The school found someone else. Missed a chance to connect with the community.' }
      ]
    })
  }
  
  // Charity donation request
  decisions.push({
    id: `quick_charity_donate_${uid}`,
    title: 'Charity Donation Request',
    description: 'A motorsport safety charity asks for a donation towards their research into improved crash protection.',
    options: [
      { id: 'generous', text: 'Donate generously. Safety matters most.', effects: { budgetImpact: -5000, reputation: 3, boardMood: 2 }, resultMessage: 'Generous donation made. The motorsport community takes notice of your commitment to safety.' },
      { id: 'modest', text: 'Make a modest contribution. Every bit helps.', effects: { budgetImpact: -1000, reputation: 1 }, resultMessage: 'A respectable contribution. The charity is grateful.' },
      { id: 'decline', text: 'We\'re stretched too thin this season. Maybe next year.', effects: { reputation: -1 }, resultMessage: 'Not a great look, but the budget is the budget.' }
    ]
  })
  
  // ──────────────────────────────────────────
  // EXTERNAL & PADDOCK DECISIONS
  // ──────────────────────────────────────────
  
  // Rival team principal invites for coffee
  if (ctx.reputation > 30) {
    decisions.push({
      id: `quick_rival_coffee_${uid}`,
      title: 'Coffee with a Rival',
      description: 'A rival team principal invites you for an informal coffee. Could be networking or mind games — hard to tell.',
      options: [
        { id: 'accept', text: 'Accept. Information flows both ways.', effects: { reputation: 1, stress: 3, confidence: 1 }, resultMessage: 'Interesting conversation. You learned a few things, but so did they. A fair exchange.' },
        { id: 'public', text: 'Suggest a lunch at a public restaurant instead. Safer.', effects: {}, scheduleActivityId: 'paddock_public_lunch', resultMessage: 'Public paddock lunch scheduled. More formal, but less risk of mind games.' },
        { id: 'decline', text: 'Politely decline. Trust no one in this paddock.', effects: { reputation: -1 }, resultMessage: 'They take note of the refusal. Maybe you\'re right to be cautious, maybe not.' }
      ]
    })
  }
  
  // Governing body meeting
  if (ctx.reputation > 40) {
    decisions.push({
      id: `quick_fia_meeting_${uid}`,
      title: 'Governing Body Meeting',
      description: 'The series organisers have invited team principals to a meeting about potential rule changes next season. Attendance is optional.',
      options: [
        { id: 'attend', text: 'Attend in person. We need a voice at the table.', effects: { reputation: 2, boardMood: 2, stress: 5 }, resultMessage: 'You made your case well. Some of your suggestions may influence the new regulations.' },
        { id: 'virtual', text: 'Attend virtually. Save the travel time.', effects: { reputation: 1, boardMood: 1 }, resultMessage: 'You listened in and made a few points. Less impact than being there in person, but efficient.' },
        { id: 'skip', text: 'Skip it. Rules are rules — we\'ll adapt.', effects: { reputation: -1, boardMood: -1 }, resultMessage: 'The other principals noted your absence. You might not like what they decided.' }
      ]
    })
  }
  
  // Potential investor contact
  if (ctx.reputation > 35 && ctx.teamCash < 200000) {
    decisions.push({
      id: `quick_investor_${uid}`,
      title: 'Investor Interest',
      description: 'A wealthy motorsport enthusiast has expressed interest in learning about your team over coffee. Could be nothing, could be big.',
      options: [
        { id: 'meet', text: 'Take the meeting. You never know.', effects: {}, scheduleActivityId: 'investor_coffee', resultMessage: 'Coffee meeting scheduled. Could lead to something significant.' },
        { id: 'call', text: 'Suggest a phone call first. Less commitment.', effects: { boardMood: 1, reputation: 1 }, resultMessage: 'Good call. They seemed genuine. They might follow up with a bigger proposal.' },
        { id: 'decline', text: 'We\'re not looking for outside investment right now.', effects: { boardMood: -2 }, resultMessage: 'The board questions turning away potential investment. Bold move.' }
      ]
    })
  }
  
  // ──────────────────────────────────────────
  // RACE WEEK SPECIFIC DECISIONS
  // ──────────────────────────────────────────
  
  if (ctx.isRaceWeek) {
    // Pre-race superstition
    decisions.push({
      id: `quick_superstition_${uid}`,
      title: 'Race Day Ritual',
      description: 'Your driver insists on eating the same breakfast before every race. Today the hotel doesn\'t have it. They\'re freaking out.',
      options: [
        { id: 'find', text: 'Send someone to find it. Whatever it takes.', effects: { driverMorale: 3, confidence: 2, budgetImpact: -200, stress: 3 }, resultMessage: 'After a frantic search, the exact breakfast is found. Driver is relieved and focused.' },
        { id: 'calm', text: 'Sit with them. Explain it\'s the skill, not the breakfast.', effects: { driverMorale: 1, confidence: -1, mentalStrength: 1 }, resultMessage: 'They grudgingly accept. It takes mental effort, but it\'s a growth moment.' },
        { id: 'dismiss', text: 'It\'s just food. Tell them to get over it.', effects: { driverMorale: -3, confidence: -2 }, resultMessage: 'The driver stews in frustration. Not the ideal pre-race headspace.' }
      ]
    })
    
    // Weather strategy
    decisions.push({
      id: `quick_weather_${uid}`,
      title: 'Weather Uncertainty',
      description: 'The forecast shows a 40% chance of rain for the race. Do you commit to a wet or dry setup?',
      options: [
        { id: 'wet', text: 'Set up for rain. If it comes, we\'ll be the fastest.', effects: { confidence: 2 }, resultMessage: 'Bold call. If it rains, you\'ll look like a genius. If not…' },
        { id: 'dry', text: 'Stick with dry setup. Probability favours it.', effects: { confidence: 1 }, resultMessage: 'Playing the percentages. Safe, but you won\'t have an edge if conditions change.' },
        { id: 'compromise', text: 'Split the setup. Prepare for both.', effects: { developmentPoints: 1 }, resultMessage: 'A balanced setup. Not optimal for either condition, but versatile.' }
      ]
    })
    
    // Grid walk invitation
    decisions.push({
      id: `quick_gridwalk_${uid}`,
      title: 'Grid Walk Interview',
      description: 'A TV crew wants a quick grid walk interview before the race. It\'s live and high-visibility.',
      options: [
        { id: 'accept', text: 'Do it. Great exposure for the team.', effects: { reputation: 2, fanSentiment: 3, personalFollowers: 600, sponsorSatisfaction: 2 }, resultMessage: 'You came across great on live TV. Sponsors saw their branding front and centre.' },
        { id: 'driver', text: 'Let the driver do it. They need the visibility.', effects: { driverMorale: 2, fanSentiment: 2, personalFollowers: 300 }, resultMessage: 'The driver handled it well. Good exposure for them personally.' },
        { id: 'decline', text: 'Focus on the race. No distractions.', effects: { confidence: 1, fanSentiment: -1 }, resultMessage: 'Full focus on the race. The TV crew moves on to someone else.' }
      ]
    })
  }
  
  // ──────────────────────────────────────────
  // PERSONAL / LIFESTYLE DECISIONS
  // ──────────────────────────────────────────
  
  // Work-life balance
  if (ctx.stress > 50) {
    decisions.push({
      id: `quick_worklife_${uid}`,
      title: 'Early Finish Today?',
      description: 'It\'s been a long week. Your PA suggests finishing early today — "you look knackered, boss."',
      options: [
        { id: 'yes', text: 'You know what, they\'re right. Heading home.', effects: { stress: -8, driverFatigue: -5, driverMorale: 1 }, resultMessage: 'An evening off does wonders. You feel sharper already.' },
        { id: 'compromise', text: 'I\'ll leave an hour early. That\'s enough.', effects: { stress: -3 }, resultMessage: 'A small concession. Better than nothing.' },
        { id: 'no', text: 'There\'s too much to do. I\'ll rest when the season\'s over.', effects: { stress: 5, boardMood: 1 }, resultMessage: 'Admirable dedication. Unsustainable, but admirable.' }
      ]
    })
  }
  
  // Networking event
  if (ctx.reputation > 20 && !ctx.isRaceWeek) {
    decisions.push({
      id: `quick_networking_${uid}`,
      title: 'Industry Networking Event',
      description: 'There\'s a motorsport industry networking event tonight. Could be useful for contacts and sponsors.',
      options: [
        { id: 'attend', text: 'I\'ll go. Networking is investing.', effects: { reputation: 2, sponsorSatisfaction: 1, stress: 5, sponsorLeadsGenerated: 1 }, resultMessage: 'Good evening. Made some promising contacts and raised the team\'s profile.' },
        { id: 'send', text: 'Send the commercial director. They\'re better at this.', effects: { reputation: 1, sponsorLeadsGenerated: 1 }, resultMessage: 'Smart delegation. Your commercial director made good connections.' },
        { id: 'skip', text: 'Skip it. I hate small talk.', effects: { stress: -2 }, resultMessage: 'A quiet evening instead. Sometimes that\'s more valuable.' }
      ]
    })
  }
  
  return decisions
}

// ============================================
// NEWS HEADLINES
// ============================================

function generateNewsHeadlines(ctx: BriefingContext): NewsHeadline[] {
  const headlines: NewsHeadline[] = []
  
  // Always generate 2-4 headlines
  const count = 2 + Math.floor(Math.random() * 3)
  
  const racingHeadlines = [
    { h: 'Regulation changes for next season under discussion by governing body', c: 'technical' as const },
    { h: 'Tire manufacturer announces new compound for upcoming rounds', c: 'technical' as const },
    { h: 'Safety improvements at circuit confirmed for race weekend', c: 'racing' as const },
    { h: 'Fan attendance records broken at last event', c: 'business' as const },
    { h: 'New team rumoured to be preparing entry for next season', c: 'business' as const },
    { h: 'Technical directive expected to impact car performance', c: 'technical' as const },
    { h: 'Championship sponsors announce expanded partnership deal', c: 'business' as const },
    { h: 'Former champion tipped for team principal role', c: 'transfer' as const },
    { h: 'Young driver impresses in testing session', c: 'racing' as const },
    { h: 'Team fined for pitlane infringement at previous round', c: 'racing' as const },
    { h: 'Driver academy graduates move closer to race seats', c: 'transfer' as const },
    { h: 'Cost cap compliance results expected this week', c: 'business' as const },
    { h: 'Wind tunnel allocation changes spark debate among teams', c: 'technical' as const },
    { h: 'Night race logistics present unique challenge for teams', c: 'racing' as const }
  ]
  
  const transferHeadlines = [
    { h: 'Key engineer reportedly in talks with rival team', c: 'transfer' as const },
    { h: 'Driver market heats up as contract talks begin', c: 'transfer' as const },
    { h: 'Veteran engineer announces retirement plans', c: 'transfer' as const },
    { h: 'Sponsorship deal collapse forces team to seek alternatives', c: 'business' as const },
    { h: 'Development driver signed to long-term contract', c: 'transfer' as const }
  ]
  
  const allHeadlines = [...racingHeadlines, ...transferHeadlines]
  
  // Pick random headlines
  const shuffled = allHeadlines.sort(() => Math.random() - 0.5)
  
  // Maybe add a player-related headline
  if (ctx.reputation > 40 && Math.random() < 0.3) {
    const playerHeadlines = [
      `${ctx.teamName} owner tipped as "one to watch" in paddock circles`,
      `${ctx.teamName}'s recent form attracting interest from bigger sponsors`,
      `Industry insiders praise ${ctx.teamName}'s development trajectory`,
      `${ctx.teamName} academy investment set to pay dividends`,
    ]
    headlines.push({
      id: `news_player_${ctx.currentWeek}_${ctx.currentDay}`,
      headline: playerHeadlines[Math.floor(Math.random() * playerHeadlines.length)],
      source: 'Paddock Insider',
      category: 'business',
      isAboutPlayer: true
    })
  }
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    headlines.push({
      id: `news_${ctx.currentWeek}_${ctx.currentDay}_${i}`,
      headline: shuffled[i].h,
      source: ['Motorsport Weekly', 'Race Insider', 'Pit Lane News', 'Grid Report', 'Speed Chronicle'][Math.floor(Math.random() * 5)],
      category: shuffled[i].c,
      isAboutPlayer: false
    })
  }
  
  return headlines
}

// ============================================
// CONTEXT BUILDER
// ============================================

function buildBriefingContext(
  careerState: CareerState,
  player: PlayerDriver
): BriefingContext {
  const ownedTeam = careerState.ownedTeam
  const currentDay = careerState.currentDay ?? 1
  const currentWeek = careerState.currentWeek
  
  // Find next race
  // Try to find from calendar
  let nextRaceTrack: string | undefined
  let nextRaceWeek: number | undefined
  let isRaceWeek = false
  let daysToNextRace = 999
  
  // Look through racing calendars
  const entries = (careerState as any).seriesEntries || []
  for (const entry of entries) {
    const calendar = entry.calendar || []
    for (const event of calendar) {
      if (event.week >= currentWeek && event.type !== 'test') {
        if (event.week === currentWeek) {
          isRaceWeek = true
          nextRaceTrack = event.trackName || event.name
          nextRaceWeek = event.week
        } else if (!nextRaceWeek || event.week < nextRaceWeek) {
          nextRaceTrack = event.trackName || event.name
          nextRaceWeek = event.week
        }
        break
      }
    }
  }
  
  if (nextRaceWeek) {
    daysToNextRace = (nextRaceWeek - currentWeek) * 7 + (7 - currentDay)
  }
  
  // Last race
  const raceHistory = player.raceHistory || []
  const lastRace = raceHistory[raceHistory.length - 1]
  
  // Activities today
  const activities = careerState.scheduledActivities || []
  const todayActivities = activities.filter(a => 
    a.scheduledWeek === currentWeek && 
    a.scheduledDay === currentDay && 
    a.status === 'scheduled'
  )
  
  return {
    currentWeek,
    currentDay,
    currentYear: careerState.currentYear,
    dayName: DAY_NAMES[currentDay] || `Day ${currentDay}`,
    nextRaceTrack,
    nextRaceWeek,
    daysToNextRace,
    isRaceWeek,
    lastRaceResult: lastRace ? { position: lastRace.racePosition, track: lastRace.trackName } : undefined,
    teamName: ownedTeam?.name || 'Your Team',
    teamCash: ownedTeam?.budgets?.cash ?? 0,
    boardMood: ownedTeam?.boardMood ?? 50,
    teamMorale: ownedTeam?.teamMorale ?? 70,
    staffCount: ownedTeam?.staff?.length ?? 0,
    playerName: `${player.firstName} ${player.lastName}`.trim() || 'Boss',
    reputation: player.reputation ?? 30,
    stress: player.mentalState?.stress ?? 30,
    fatigue: player.mentalState?.fatigue ?? 30,
    hoursAvailable: careerState.dayBudget?.hoursRemaining ?? 16,
    activitiesToday: todayActivities.length,
    mandatoryActivitiesToday: todayActivities.filter(a => a.mandatory).length,
    championshipPosition: (careerState as any).championshipPosition ?? 10,
    racesRemaining: (careerState as any).racesRemaining ?? 0
  }
}
