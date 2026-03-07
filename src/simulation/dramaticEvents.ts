/**
 * Dramatic Events System
 * 
 * State-triggered narrative events that create emotional peaks between races.
 * Unlike random events, these fire based on specific game state conditions:
 * - Financial crises
 * - Championship momentum shifts
 * - Staff/sponsor breakdowns
 * - Personal milestones
 * - Rivalry escalation
 * 
 * Each event generates an email + optional interactive scenario via the calendar.
 */

import { getStaffNameOrFallback } from '@/services/eventContentGenerator'
import type { 
  CareerState, 
  PlayerDriver, 
  ScheduledActivity, 
  ActivityCategory, 
  ActivityEffect 
} from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export interface DramaticEventTrigger {
  id: string
  name: string
  category: 'financial' | 'championship' | 'staff' | 'sponsor' | 'personal' | 'rivalry' | 'media'
  severity: 'moderate' | 'major' | 'critical'
  
  /** Condition function: returns true if this event should trigger */
  condition: (ctx: DramaticEventContext) => boolean
  
  /** Cooldown in weeks before this event can trigger again */
  cooldownWeeks: number
  
  /** Maximum times this event can trigger per season (0 = unlimited) */
  maxPerSeason: number
  
  /** Generate the event content */
  generate: (ctx: DramaticEventContext) => DramaticEventPayload
}

export interface DramaticEventContext {
  careerState: CareerState
  player: PlayerDriver
  currentWeek: number
  currentYear: number
  
  // Derived state
  teamCash: number
  weeklyBurnRate: number
  weeksOfCashLeft: number
  boardMood: number
  teamMorale: number
  championshipPosition: number
  pointsToLeader: number
  totalDrivers: number
  recentResultsTrend: 'improving' | 'declining' | 'stable'
  lastRacePosition: number
  bestResultThisSeason: number
  sponsorCount: number
  lowestSponsorSatisfaction: number
  staffCount: number
  avgStaffMorale: number
  consecutiveWins: number
  consecutivePodiums: number
  consecutiveNonPoints: number
  driverMorale: number
  driverStress: number
  playerReputation: number
  
  // Track previously fired events
  firedEventIds: string[]
}

export interface DramaticEventPayload {
  triggerId: string
  
  // Email that gets sent
  email: {
    subject: string
    body: string
    sender: string
    senderRole: string
    category: string
    priority: 'normal' | 'urgent' | 'critical'
  }
  
  // Optional activity that gets scheduled
  activity?: {
    name: string
    description: string
    category: ActivityCategory
    duration: number
    deadlineDays: number
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
    effectsOnComplete: ActivityEffect
    effectsOnMiss: ActivityEffect
  }
  
  // Immediate effects (applied when event fires)
  immediateEffects?: ActivityEffect
}

export interface DramaticEventRecord {
  triggerId: string
  week: number
  year: number
}

// ============================================
// EVENT TRIGGERS
// ============================================

const DRAMATIC_TRIGGERS: DramaticEventTrigger[] = [
  // ==========================================
  // FINANCIAL CRISIS EVENTS
  // ==========================================
  {
    id: 'financial_crisis_imminent',
    name: 'Running Out of Money',
    category: 'financial',
    severity: 'critical',
    cooldownWeeks: 12,
    maxPerSeason: 2,
    condition: (ctx) => ctx.weeksOfCashLeft > 0 && ctx.weeksOfCashLeft <= 4 && ctx.teamCash > 0,
    generate: (ctx) => ({
      triggerId: 'financial_crisis_imminent',
      email: {
        subject: 'URGENT: Financial Emergency Meeting Required',
        body: `Dear Boss,\n\nI need to bring something critical to your attention. Based on our current burn rate of $${Math.abs(ctx.weeklyBurnRate).toLocaleString()}/week, we have approximately ${ctx.weeksOfCashLeft} weeks of operating cash remaining.\n\nWe need to take immediate action:\n- Review and cut non-essential spending\n- Accelerate sponsor payment schedules\n- Consider emergency cost reductions\n\nI've scheduled an urgent board meeting to discuss options. This cannot wait.\n\nRegards,\nFinance Director`,
        sender: 'Finance Director',
        senderRole: 'Finance',
        category: 'team',
        priority: 'critical'
      },
      activity: {
        name: 'Emergency Financial Meeting',
        description: 'The team is running dangerously low on funds. A crisis meeting is required to determine cuts and survival strategy.',
        category: 'team',
        duration: 3,
        deadlineDays: 3,
        urgencyLevel: 'critical',
        effectsOnComplete: { boardMood: 5, teamMorale: -3 },
        effectsOnMiss: { boardMood: -15, teamMorale: -10 }
      },
      immediateEffects: { stress: 10 }
    })
  },
  
  {
    id: 'bankrupt_warning',
    name: 'Bankruptcy Warning',
    category: 'financial',
    severity: 'critical',
    cooldownWeeks: 20,
    maxPerSeason: 1,
    condition: (ctx) => ctx.teamCash <= 0,
    generate: (_ctx) => ({
      triggerId: 'bankrupt_warning',
      email: {
        subject: 'CRITICAL: Team Finances in the Red',
        body: `This is a formal notice that team operating accounts have entered negative balance.\n\nImmediate consequences:\n- Staff salary payments may be delayed\n- Supplier relationships are at risk\n- The board is demanding answers\n\nWe must find additional revenue or make emergency cuts immediately.\n\nThe Finance Department`,
        sender: 'Finance Department',
        senderRole: 'Finance',
        category: 'team',
        priority: 'critical'
      },
      immediateEffects: { 
        stress: 15, 
        boardMood: -10,
        teamMorale: -5
      }
    })
  },

  // ==========================================
  // CHAMPIONSHIP MOMENTUM EVENTS
  // ==========================================
  {
    id: 'championship_contender',
    name: 'Championship Fight',
    category: 'championship',
    severity: 'major',
    cooldownWeeks: 8,
    maxPerSeason: 2,
    condition: (ctx) => ctx.championshipPosition <= 3 && ctx.pointsToLeader <= 20 && ctx.totalDrivers > 5,
    generate: (ctx) => ({
      triggerId: 'championship_contender',
      email: {
        subject: 'The Title Fight Is ON!',
        body: `Boss,\n\nThe numbers don't lie — we're ${ctx.pointsToLeader} points off the championship lead in P${ctx.championshipPosition}. This is real. We are genuine title contenders.\n\nThe whole paddock is talking about us. Media requests are flooding in. The team can feel the momentum building.\n\nI've never seen morale this high. Let's not let this opportunity slip away.\n\nYour Race Strategist`,
        sender: 'Race Strategist',
        senderRole: 'Strategy',
        category: 'team',
        priority: 'urgent'
      },
      immediateEffects: { 
        confidence: 5,
        teamMorale: 5,
        reputation: 2
      }
    })
  },
  
  {
    id: 'winning_streak',
    name: 'Winning Streak',
    category: 'championship',
    severity: 'major',
    cooldownWeeks: 6,
    maxPerSeason: 3,
    condition: (ctx) => ctx.consecutiveWins >= 2,
    generate: (ctx) => ({
      triggerId: 'winning_streak',
      email: {
        subject: `${ctx.consecutiveWins} Wins in a Row! The Team is Flying!`,
        body: `What a run we're on! ${ctx.consecutiveWins} consecutive victories!\n\nThe whole factory is buzzing. Sponsors are thrilled. The media can't stop talking about us.\n\nBut here's the thing — momentum is fragile. Let's stay grounded, keep working hard, and keep this streak going.\n\nThe team wants to celebrate together. Shall I organise something?\n\n${getStaffNameOrFallback('team_manager', 'Team Operations')}`,
        sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
        senderRole: 'Management',
        category: 'team',
        priority: 'normal'
      },
      immediateEffects: { 
        confidence: 8,
        teamMorale: 8,
        reputation: 3,
        boardMood: 5
      }
    })
  },
  
  {
    id: 'losing_streak',
    name: 'Results Crisis',
    category: 'championship',
    severity: 'major',
    cooldownWeeks: 6,
    maxPerSeason: 2,
    condition: (ctx) => ctx.consecutiveNonPoints >= 3,
    generate: (ctx) => ({
      triggerId: 'losing_streak',
      email: {
        subject: 'We Need to Talk About Results',
        body: `Boss,\n\n${ctx.consecutiveNonPoints} consecutive races without points. The mood in the factory has taken a hit.\n\nI'm hearing whispers of concern from the engineers. Some sponsors have been asking difficult questions.\n\nWe need a clear plan to turn this around. Can we schedule a meeting to discuss our approach?\n\n${getStaffNameOrFallback('chief_engineer', 'Engineering Dept.')}`,
        sender: getStaffNameOrFallback('chief_engineer', 'Engineering Dept.'),
        senderRole: 'Engineering',
        category: 'team',
        priority: 'urgent'
      },
      activity: {
        name: 'Crisis Team Meeting',
        description: 'Results have been poor. The team needs direction and a clear recovery plan.',
        category: 'team',
        duration: 3,
        deadlineDays: 5,
        urgencyLevel: 'high',
        effectsOnComplete: { teamMorale: 5, boardMood: 3, confidence: 3 },
        effectsOnMiss: { teamMorale: -8, boardMood: -5 }
      },
      immediateEffects: { 
        stress: 8,
        confidence: -5
      }
    })
  },
  
  {
    id: 'podium_streak',
    name: 'Consistent Podiums',
    category: 'championship',
    severity: 'moderate',
    cooldownWeeks: 8,
    maxPerSeason: 2,
    condition: (ctx) => ctx.consecutivePodiums >= 3 && ctx.consecutiveWins < 2,
    generate: (ctx) => ({
      triggerId: 'podium_streak',
      email: {
        subject: `${ctx.consecutivePodiums} Straight Podiums - Consistency is Key`,
        body: `The stats speak for themselves — ${ctx.consecutivePodiums} consecutive podium finishes.\n\nWe might not always be winning, but this level of consistency shows the car is strong and the team is executing well.\n\nKeep pushing. The wins will come.\n\nData Analyst`,
        sender: 'Data Analyst',
        senderRole: 'Analysis',
        category: 'team',
        priority: 'normal'
      },
      immediateEffects: { 
        confidence: 3,
        teamMorale: 3,
        reputation: 1
      }
    })
  },

  // ==========================================
  // STAFF EVENTS
  // ==========================================
  {
    id: 'staff_morale_crisis',
    name: 'Staff Morale Crisis',
    category: 'staff',
    severity: 'major',
    cooldownWeeks: 10,
    maxPerSeason: 2,
    condition: (ctx) => ctx.avgStaffMorale < 35 && ctx.staffCount >= 3,
    generate: (_ctx) => ({
      triggerId: 'staff_morale_crisis',
      email: {
        subject: 'Staff Morale at Critical Low',
        body: `I need to flag something serious. Staff morale across the team has dropped to dangerous levels.\n\nSeveral key personnel have expressed frustration. I've heard talk of people "looking around" — that means they're considering leaving.\n\nIf we don't address this quickly, we risk losing experienced staff at the worst possible time.\n\nI recommend immediate action: team meeting, bonus consideration, or at minimum — acknowledgement from leadership.\n\n${getStaffNameOrFallback('team_manager', 'Team Operations')}`,
        sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
        senderRole: 'Management',
        category: 'team',
        priority: 'urgent'
      },
      activity: {
        name: 'Staff Morale Emergency Meeting',
        description: 'Staff morale has hit rock bottom. Address concerns before key people start leaving.',
        category: 'team',
        duration: 2,
        deadlineDays: 5,
        urgencyLevel: 'high',
        effectsOnComplete: { teamMorale: 8, boardMood: 2 },
        effectsOnMiss: { teamMorale: -10, boardMood: -5 }
      }
    })
  },
  
  // ==========================================
  // SPONSOR EVENTS
  // ==========================================
  {
    id: 'sponsor_unhappy_warning',
    name: 'Sponsor Satisfaction Crisis',
    category: 'sponsor',
    severity: 'major',
    cooldownWeeks: 8,
    maxPerSeason: 3,
    condition: (ctx) => ctx.lowestSponsorSatisfaction < 30 && ctx.sponsorCount > 0,
    generate: (_ctx) => ({
      triggerId: 'sponsor_unhappy_warning',
      email: {
        subject: 'Sponsor Threatening to Pull Out',
        body: `Boss, we have a problem. One of our sponsors is extremely unhappy with the partnership so far.\n\nThey've hinted that they may not renew — or worse, could invoke early termination clauses if things don't improve.\n\nI'd recommend reaching out personally. A face-to-face meeting could help smooth things over before it's too late.\n\n${getStaffNameOrFallback('pr_manager', 'Team Operations')}`,
        sender: getStaffNameOrFallback('pr_manager', 'Team Operations'),
        senderRole: 'Media/PR',
        category: 'sponsor',
        priority: 'urgent'
      },
      activity: {
        name: 'Emergency Sponsor Meeting',
        description: 'A key sponsor is threatening to terminate their contract. Schedule an urgent face-to-face to salvage the relationship.',
        category: 'sponsor',
        duration: 3,
        deadlineDays: 7,
        urgencyLevel: 'high',
        effectsOnComplete: { sponsorSatisfaction: 10, reputation: 1 },
        effectsOnMiss: { sponsorSatisfaction: -15, reputation: -3, boardMood: -5 }
      }
    })
  },

  // ==========================================
  // BOARD/GOVERNANCE EVENTS
  // ==========================================
  {
    id: 'board_losing_patience',
    name: 'Board Losing Patience',
    category: 'financial',
    severity: 'major',
    cooldownWeeks: 12,
    maxPerSeason: 2,
    condition: (ctx) => ctx.boardMood < 25,
    generate: (_ctx) => ({
      triggerId: 'board_losing_patience',
      email: {
        subject: 'The Board is Demanding Answers',
        body: `This is a formal communication from the board of directors.\n\nWe have noted a sustained period of unsatisfactory performance across multiple areas. The board's confidence in current management direction is wavering.\n\nA formal review has been scheduled. Be prepared to present a comprehensive plan for improvement, or the board may consider structural changes to the management team.\n\nBoard Secretary`,
        sender: 'Board Secretary',
        senderRole: 'Board',
        category: 'team',
        priority: 'critical'
      },
      activity: {
        name: 'Emergency Board Review',
        description: 'The board has lost confidence. Present a compelling turnaround plan or face consequences.',
        category: 'team',
        duration: 4,
        deadlineDays: 7,
        urgencyLevel: 'critical',
        effectsOnComplete: { boardMood: 10, confidence: -3 },
        effectsOnMiss: { boardMood: -20, teamMorale: -10, reputation: -5 }
      },
      immediateEffects: { stress: 12 }
    })
  },

  // ==========================================
  // PERSONAL/PLAYER EVENTS
  // ==========================================
  {
    id: 'burnout_warning',
    name: 'Burnout Warning',
    category: 'personal',
    severity: 'major',
    cooldownWeeks: 10,
    maxPerSeason: 1,
    condition: (ctx) => ctx.driverStress > 80 && ctx.driverMorale < 30,
    generate: (_ctx) => ({
      triggerId: 'burnout_warning',
      email: {
        subject: 'You Need to Take Care of Yourself',
        body: `Hey,\n\nI know things have been intense lately, but I'm worried about you. The long hours, the pressure, the travel — it's clearly taking a toll.\n\nI've seen this before in motorsport. People push themselves until they break. Don't let that be you.\n\nTake a day off. Seriously. The team will manage. Your health comes first.\n\nYour closest confidant`,
        sender: 'Personal Assistant',
        senderRole: 'Personal',
        category: 'personal',
        priority: 'urgent'
      },
      immediateEffects: { 
        stress: 5, // Ironic - even the warning adds stress
        confidence: -3
      }
    })
  },
  
  {
    id: 'reputation_milestone_high',
    name: 'Rising Star Recognition',
    category: 'media',
    severity: 'moderate',
    cooldownWeeks: 16,
    maxPerSeason: 1,
    condition: (ctx) => ctx.playerReputation >= 75 && ctx.recentResultsTrend === 'improving',
    generate: (_ctx) => ({
      triggerId: 'reputation_milestone_high',
      email: {
        subject: 'Media Profile Feature: "The Rising Star"',
        body: `Good news! A major motorsport publication wants to do a feature profile on you.\n\nThey're calling it "The Rising Star" — covering your career journey, the team's growth, and your vision for the future.\n\nThis is excellent exposure. It could attract new sponsors and talent. Shall I schedule the interview?\n\n${getStaffNameOrFallback('pr_manager', 'Team Operations')}`,
        sender: getStaffNameOrFallback('pr_manager', 'Team Operations'),
        senderRole: 'Media/PR',
        category: 'media',
        priority: 'normal'
      },
      activity: {
        name: 'Magazine Profile Interview',
        description: 'A major motorsport publication wants to feature you. Great opportunity for exposure.',
        category: 'media',
        duration: 2,
        deadlineDays: 7,
        urgencyLevel: 'low',
        effectsOnComplete: { reputation: 5, marketability: 3, fanSentiment: 5 },
        effectsOnMiss: { reputation: -2 }
      },
      immediateEffects: { confidence: 3 }
    })
  },
  
  {
    id: 'first_season_momentum',
    name: 'Finding Your Feet',
    category: 'personal',
    severity: 'moderate',
    cooldownWeeks: 52, // Once per season
    maxPerSeason: 1,
    condition: (ctx) => {
      // Only in year 1, around week 6-10
      const careerYears = ctx.currentYear - (ctx.careerState.startYear || ctx.currentYear)
      return careerYears === 0 && ctx.currentWeek >= 6 && ctx.currentWeek <= 10
    },
    generate: (ctx) => ({
      triggerId: 'first_season_momentum',
      email: {
        subject: 'Reflection: Your First Season So Far',
        body: `Boss,\n\nI know you're busy, but I wanted to share something.\n\nA few weeks ago, we were a bunch of people with a dream and a barely-there budget. Look at us now — we're actually racing. We're competing.\n\n${ctx.bestResultThisSeason <= 10 
          ? `A top-${ctx.bestResultThisSeason} finish already! Nobody expected that from us.`
          : `The results might not be where we want them yet, but every race we finish is a victory in itself at this stage.`
        }\n\nWhatever happens, this first season is something to be proud of. Keep going.\n\n${getStaffNameOrFallback('team_manager', 'Your Team')}`,
        sender: getStaffNameOrFallback('team_manager', 'Team Operations'),
        senderRole: 'Management',
        category: 'personal',
        priority: 'normal'
      },
      immediateEffects: { 
        confidence: 5,
        teamMorale: 3,
        stress: -5
      }
    })
  },

  // ==========================================
  // MEDIA DRAMA EVENTS
  // ==========================================
  {
    id: 'media_controversy',
    name: 'Media Controversy',
    category: 'media',
    severity: 'moderate',
    cooldownWeeks: 12,
    maxPerSeason: 2,
    condition: (ctx) => ctx.playerReputation >= 40 && Math.random() < 0.08, // 8% chance per check when notable enough
    generate: (_ctx) => ({
      triggerId: 'media_controversy',
      email: {
        subject: 'Media Situation - Needs Your Attention',
        body: `We have a situation. A journalist has published a piece that's generating some negative buzz around the team.\n\nThe article questions our technical approach and suggests internal tensions. While not entirely accurate, it's getting traction on social media.\n\nWe have three options:\n1. Issue a formal denial\n2. Ignore it and let it blow over\n3. Address it head-on with a press statement\n\nWhat's your call?\n\n${getStaffNameOrFallback('pr_manager', 'Team Operations')}`,
        sender: getStaffNameOrFallback('pr_manager', 'Team Operations'),
        senderRole: 'Media/PR',
        category: 'media',
        priority: 'urgent'
      },
      activity: {
        name: 'Media Crisis Response',
        description: 'A negative media story is circulating. Decide how to respond.',
        category: 'media',
        duration: 1,
        deadlineDays: 3,
        urgencyLevel: 'medium',
        effectsOnComplete: { reputation: 2, stress: -3 },
        effectsOnMiss: { reputation: -5, sponsorSatisfaction: -3 }
      }
    })
  }
]

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

/**
 * Check all dramatic event triggers and fire any that match.
 * Called once per week during weekly processing.
 */
export function checkDramaticEvents(
  careerState: CareerState,
  player: PlayerDriver,
  firedEvents: DramaticEventRecord[]
): DramaticEventPayload[] {
  const ctx = buildDramaticContext(careerState, player, firedEvents)
  const results: DramaticEventPayload[] = []
  
  for (const trigger of DRAMATIC_TRIGGERS) {
    // Check cooldown
    const lastFired = firedEvents
      .filter(e => e.triggerId === trigger.id)
      .sort((a, b) => (b.year * 52 + b.week) - (a.year * 52 + a.week))[0]
    
    if (lastFired) {
      const weeksSinceLastFired = 
        (ctx.currentYear - lastFired.year) * 52 + (ctx.currentWeek - lastFired.week)
      if (weeksSinceLastFired < trigger.cooldownWeeks) continue
    }
    
    // Check max per season
    if (trigger.maxPerSeason > 0) {
      const firedThisSeason = firedEvents.filter(
        e => e.triggerId === trigger.id && e.year === ctx.currentYear
      ).length
      if (firedThisSeason >= trigger.maxPerSeason) continue
    }
    
    // Check condition
    try {
      if (trigger.condition(ctx)) {
        const payload = trigger.generate(ctx)
        results.push(payload)
      }
    } catch (err) {
      console.warn(`[DramaticEvents] Error evaluating trigger ${trigger.id}:`, err)
    }
  }
  
  // Limit to max 2 dramatic events per week to avoid overwhelming the player
  return results.slice(0, 2)
}

// ============================================
// CONTEXT BUILDER
// ============================================

function buildDramaticContext(
  careerState: CareerState,
  player: PlayerDriver,
  firedEvents: DramaticEventRecord[]
): DramaticEventContext {
  const ownedTeam = careerState.ownedTeam
  const teamCash = ownedTeam?.budgets?.cash ?? 0
  
  // Estimate weekly burn rate from recent financial data
  const weeklyBurnRate = ownedTeam?.budgets?.weeklyBurnRate ?? -10000
  const weeksOfCashLeft = weeklyBurnRate < 0 
    ? Math.max(0, Math.floor(teamCash / Math.abs(weeklyBurnRate)))
    : 999
  
  // Race results analysis
  const raceHistory = player.raceHistory || []
  const recentRaces = raceHistory.slice(-5)
  const lastRace = recentRaces[recentRaces.length - 1]
  
  // Consecutive wins/podiums/non-points
  let consecutiveWins = 0
  let consecutivePodiums = 0
  let consecutiveNonPoints = 0
  
  for (let i = raceHistory.length - 1; i >= 0; i--) {
    const race = raceHistory[i]
    if (race.dnf) break
    if (race.racePosition === 1) {
      consecutiveWins++
      consecutivePodiums++
    } else if (race.racePosition <= 3) {
      consecutiveWins = 0 // Streak broken for wins
      consecutivePodiums++
    } else {
      break
    }
  }
  
  for (let i = raceHistory.length - 1; i >= 0; i--) {
    const race = raceHistory[i]
    if (race.dnf || race.racePosition > 10) {
      consecutiveNonPoints++
    } else {
      break
    }
  }
  
  // Trend analysis
  let recentResultsTrend: 'improving' | 'declining' | 'stable' = 'stable'
  if (recentRaces.length >= 3) {
    const firstHalf = recentRaces.slice(0, Math.floor(recentRaces.length / 2))
    const secondHalf = recentRaces.slice(Math.floor(recentRaces.length / 2))
    const firstAvg = firstHalf.reduce((s, r) => s + (r.dnf ? 20 : r.racePosition), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s, r) => s + (r.dnf ? 20 : r.racePosition), 0) / secondHalf.length
    
    if (secondAvg < firstAvg - 2) recentResultsTrend = 'improving'
    else if (secondAvg > firstAvg + 2) recentResultsTrend = 'declining'
  }
  
  // Best result this season
  const thisSeasonRaces = raceHistory.filter(r => r.year === careerState.currentYear && !r.dnf)
  const bestResultThisSeason = thisSeasonRaces.length > 0
    ? Math.min(...thisSeasonRaces.map(r => r.racePosition))
    : 99
  
  // Staff stats
  const staff = ownedTeam?.staff ?? []
  const avgStaffMorale = staff.length > 0
    ? staff.reduce((s, m) => s + (m.morale ?? 70), 0) / staff.length
    : 70
  
  // Sponsor stats
  const sponsors = player.finances?.sponsorDeals ?? []
  const lowestSponsorSatisfaction = sponsors.length > 0
    ? Math.min(...sponsors.map(s => s.satisfaction ?? 70))
    : 100
  
  // Championship position (approximate from career state)
  const championshipPosition = (careerState as any).championshipPosition ?? 10
  const pointsToLeader = (careerState as any).pointsToLeader ?? 100
  const totalDrivers = (careerState as any).totalDriversInChampionship ?? 20
  
  return {
    careerState,
    player,
    currentWeek: careerState.currentWeek,
    currentYear: careerState.currentYear,
    teamCash,
    weeklyBurnRate,
    weeksOfCashLeft,
    boardMood: ownedTeam?.boardMood ?? 50,
    teamMorale: ownedTeam?.teamMorale ?? 70,
    championshipPosition,
    pointsToLeader,
    totalDrivers,
    recentResultsTrend,
    lastRacePosition: lastRace?.racePosition ?? 99,
    bestResultThisSeason,
    sponsorCount: sponsors.length,
    lowestSponsorSatisfaction,
    staffCount: staff.length,
    avgStaffMorale,
    consecutiveWins,
    consecutivePodiums,
    consecutiveNonPoints,
    driverMorale: player.mentalState?.morale ?? 50,
    driverStress: player.mentalState?.stress ?? 30,
    playerReputation: player.reputation ?? 30,
    firedEventIds: firedEvents.map(e => e.triggerId)
  }
}
