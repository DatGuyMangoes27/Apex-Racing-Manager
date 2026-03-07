/**
 * Suggestion Engine — Shared Heuristics for Contextual Suggestions
 * 
 * Generates actionable suggestions based on current game state.
 * Used by:
 *  - PA Weekly Planning Email
 *  - Auto-Scheduler
 *  - Sidebar "PA Tips" widget
 *  - Dashboard Active Storylines
 */

import type { CareerState, ScheduledActivity } from '@/store/careerStore'
import { getWeek1Length } from '@/utils/calendar'

// ============================================
// TYPES
// ============================================

export interface ContextualSuggestion {
  id: string
  text: string
  reason: string
  urgency: 'low' | 'medium' | 'high'
  action: { label: string; path: string } | { label: string; activityTemplateId: string }
  category: 'team' | 'personal' | 'driving' | 'business' | 'media'
}

export interface ScheduleSuggestion {
  templateId: string
  name: string
  hours: number
  suggestedDay: number
  category: 'mandatory' | 'recommended' | 'personal'
  reason: string
  priority: number
}

export interface LifeBalanceScores {
  teamHealth: {
    composite: number
    boardMood: number
    teamMorale: number
    financialRunway: number
    sponsorSatisfaction: number
  }
  personalLife: {
    composite: number
    partnerHappiness: number
    stress: number
    mentalHealth: number
    socialLife: number
  }
  driverPerformance: {
    composite: number
    fitness: number
    confidence: number
    carReadiness: number
    championshipScore: number
  }
}

// ============================================
// HELPER: Clamp value 0-100
// ============================================
function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

// ============================================
// CALCULATE LIFE BALANCE SCORES
// ============================================

export function calculateLifeBalanceScores(
  careerState: CareerState,
  player: { mentalState: Record<string, number>; stats?: Record<string, number>; reputation?: number; raceHistory?: Array<{ racePosition: number; dnf: boolean }> } | null
): LifeBalanceScores {
  const ownedTeam = careerState?.ownedTeam as Record<string, unknown> | undefined
  const personalLife = (careerState as Record<string, unknown>)?.personalLife as Record<string, unknown> | undefined
  const budgets = ownedTeam?.budgets as Record<string, unknown> | undefined
  const teamFinances = ownedTeam?.finances as Record<string, unknown> | undefined
  const teamSponsors = (teamFinances?.sponsors ?? []) as Array<Record<string, unknown>>

  // --- Team Health ---
  const boardMood = clamp(Number(ownedTeam?.boardMood ?? 50))

  // Team morale: computed from individual staff morale (source of truth), with teamMorale field as fallback
  let teamMorale = 0
  const staff = (ownedTeam?.staff ?? []) as Array<Record<string, unknown>>
  if (staff.length > 0) {
    const totalMorale = staff.reduce((sum, s) => sum + Number(s.morale ?? 70), 0)
    teamMorale = clamp(Math.round(totalMorale / staff.length))
  } else {
    // No staff yet — fall back to stored teamMorale field
    teamMorale = clamp(Number((ownedTeam as Record<string, unknown>)?.teamMorale ?? 50))
  }

  // Financial runway: prefer stored value, fall back to cash / weeklyBurn
  let financialRunway = 0
  const storedRunway = Number(budgets?.runwayWeeks ?? 0)
  if (storedRunway > 0) {
    financialRunway = clamp(Math.min(storedRunway / 20, 1) * 100)
  } else if (budgets) {
    const cash = Number(budgets.cash ?? 0)
    const staff = (ownedTeam?.staff ?? []) as Array<Record<string, unknown>>
    const facilityStaff = (ownedTeam?.facilityStaff ?? []) as Array<Record<string, unknown>>
    const drivers = (ownedTeam?.drivers ?? []) as Array<Record<string, unknown>>
    const weeklyBurn = [...staff, ...facilityStaff, ...drivers].reduce(
      (sum, s) => sum + Number(s.weeklyWage ?? 0), 0
    )
    const computedRunway = weeklyBurn > 0 ? Math.floor(cash / weeklyBurn) : 20
    financialRunway = clamp(Math.min(computedRunway / 20, 1) * 100)
  }

  // Sponsor satisfaction: check team sponsors, then fall back to player sponsor deals
  let sponsorSatisfaction = 0
  const activeTeamSponsors = teamSponsors.filter(s => s.active !== false)
  if (activeTeamSponsors.length > 0) {
    const avgSat = activeTeamSponsors.reduce((sum, s) => sum + Number(s.satisfaction ?? s.happiness ?? 50), 0) / activeTeamSponsors.length
    sponsorSatisfaction = clamp(avgSat)
  } else {
    // Fall back to player's personal sponsor deals
    const playerFinances = (player as Record<string, unknown>)?.finances as Record<string, unknown> | undefined
    const playerDeals = (playerFinances?.sponsorDeals ?? []) as Array<Record<string, unknown>>
    if (playerDeals.length > 0) {
      const avgSat = playerDeals.reduce((sum, s) => sum + Number(s.satisfaction ?? 50), 0) / playerDeals.length
      sponsorSatisfaction = clamp(avgSat)
    }
  }

  const teamComposite = Math.round(
    boardMood * 0.3 + teamMorale * 0.25 + financialRunway * 0.25 + sponsorSatisfaction * 0.2
  )

  // --- Personal Life ---
  const partner = personalLife?.partner as Record<string, unknown> | undefined
  const hasPartner = !!partner
  const partnerHappiness = hasPartner ? clamp(Number(partner.happiness ?? 50)) : 0

  // Stress: raw value (higher = more stressed = worse)
  const stress = clamp(Number(player?.mentalState?.stress ?? 0))

  const health = personalLife?.health as Record<string, unknown> | undefined
  const mentalHealth = clamp(Number(health?.mentalHealth ?? 60))

  // Social life derived from recent interactions
  const socialLog = (personalLife as Record<string, unknown>)?.socialLog as Array<unknown> | undefined
  const recentSocialCount = socialLog?.filter((entry: unknown) => {
    const e = entry as Record<string, unknown>
    return Number(e.week ?? 0) >= (careerState.currentWeek - 4)
  }).length ?? 0
  const socialLife = clamp(Math.min(recentSocialCount / 4, 1) * 100)

  // Composite: use inverted stress (low stress = good) for the composite calculation
  // If no partner, redistribute partner weight among remaining metrics
  const stressForComposite = 100 - stress
  let personalComposite: number
  if (hasPartner) {
    personalComposite = Math.round(
      partnerHappiness * 0.3 + stressForComposite * 0.3 + mentalHealth * 0.25 + socialLife * 0.15
    )
  } else {
    // No partner — redistribute among stress, mental health, social life
    personalComposite = Math.round(
      stressForComposite * 0.4 + mentalHealth * 0.35 + socialLife * 0.25
    )
  }

  // --- Driver Performance ---
  const fitness = clamp(Number(player?.stats?.fitness ?? player?.mentalState?.fitness ?? 50))
  const confidence = clamp(Number(player?.mentalState?.confidence ?? 50))

  // Car readiness: read from careerState.cars (where cars actually live), not ownedTeam.cars
  let carReadiness = 0
  const actualCars = (careerState.cars ?? []) as Array<Record<string, unknown>>
  if (actualCars.length > 0) {
    const avgWear = actualCars.reduce((sum, c) => {
      const partWear = c.partWear as Record<string, unknown> | undefined
      if (partWear) {
        const wearValues = Object.values(partWear).filter((v): v is number => typeof v === 'number')
        if (wearValues.length > 0) {
          return sum + (wearValues.reduce((s, w) => s + w, 0) / wearValues.length)
        }
      }
      return sum + Number(c.wear ?? c.avgWear ?? 30)
    }, 0) / actualCars.length
    carReadiness = clamp(100 - avgWear)
  }

  // Championship score: derive from player race history (average finishing position mapped to 0-100)
  let championshipScore = 0
  const raceHistory = player?.raceHistory
  if (raceHistory && raceHistory.length > 0) {
    // Use last 5 races (or all if fewer) for recency weighting
    const recentRaces = raceHistory.slice(-5)
    const avgPosition = recentRaces.reduce((sum, r) => {
      if (r.dnf) return sum + 20 // DNF counts as a P20 equivalent
      return sum + r.racePosition
    }, 0) / recentRaces.length
    // Map: P1 avg -> 100, P10 avg -> 50, P20 avg -> 0
    championshipScore = clamp(Math.round(100 - ((avgPosition - 1) / 19) * 100))
  }

  const driverComposite = Math.round(
    fitness * 0.25 + confidence * 0.25 + carReadiness * 0.3 + championshipScore * 0.2
  )

  return {
    teamHealth: {
      composite: teamComposite,
      boardMood,
      teamMorale,
      financialRunway,
      sponsorSatisfaction,
    },
    personalLife: {
      composite: personalComposite,
      partnerHappiness,
      stress,
      mentalHealth,
      socialLife,
    },
    driverPerformance: {
      composite: driverComposite,
      fitness,
      confidence,
      carReadiness,
      championshipScore,
    },
  }
}

// ============================================
// GENERATE CONTEXTUAL SUGGESTIONS
// ============================================

export function generateSuggestions(
  careerState: CareerState,
  player: Record<string, unknown> | null
): ContextualSuggestion[] {
  const suggestions: ContextualSuggestion[] = []
  if (!careerState || !player) return suggestions

  const ownedTeam = careerState.ownedTeam as Record<string, unknown> | undefined
  const personalLife = (careerState as Record<string, unknown>).personalLife as Record<string, unknown> | undefined
  const mentalState = player.mentalState as Record<string, number> | undefined
  const stats = player.stats as Record<string, number> | undefined
  const currentWeek = careerState.currentWeek ?? 1

  // ── Derive team state awareness ──
  // Cars are stored on careerState, not ownedTeam
  const teamCars = ((careerState as Record<string, unknown>).cars ?? []) as Array<Record<string, unknown>>
  const hasCars = teamCars.length > 0

  const teamDrivers = (ownedTeam?.drivers ?? []) as Array<Record<string, unknown>>
  const hasDrivers = teamDrivers.length > 0

  const teamStaff = (ownedTeam?.staff ?? []) as Array<Record<string, unknown>>
  const hiredRoles = new Set(teamStaff.map(s => s.role as string))

  const seriesEntries = ((careerState as Record<string, unknown>).seriesEntries ?? []) as Array<Record<string, unknown>>
  const hasSeriesEntry = seriesEntries.length > 0

  const teamFinances = ownedTeam?.finances as Record<string, unknown> | undefined
  const teamSponsors = (teamFinances?.sponsors ?? (ownedTeam as Record<string, unknown>)?.sponsorDeals ?? []) as Array<Record<string, unknown>>
  const activeSponsors = teamSponsors.filter(s => s.active !== false)
  const hasSponsors = activeSponsors.length > 0

  // ── Race timing ──
  const nextRaceWeek = Number((careerState as any).nextRaceWeek ?? 0)
  const isPreRaceWeek = nextRaceWeek > 0 && (nextRaceWeek - currentWeek) <= 2 && (nextRaceWeek - currentWeek) > 0
  const raceHistory = (player.raceHistory ?? []) as Array<Record<string, unknown>>
  const lastRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null
  const isPostRaceWeek = !!lastRace && Number(lastRace.week ?? 0) === currentWeek - 1

  // ── Social / media metrics ──
  const teamMedia = (careerState as any).teamMediaState as Record<string, unknown> | undefined
  const teamFollowers = Number((teamMedia?.teamSocial as any)?.followers ?? 1000)
  const fanSentiment = Number(teamMedia?.fanSentiment ?? (ownedTeam as any)?.fanSentiment ?? 50)

  // ── Staff health ──
  const avgStaffMorale = teamStaff.length > 0
    ? teamStaff.reduce((sum, m) => sum + Number((m as any).morale ?? 50), 0) / teamStaff.length
    : 50
  const lowMoraleStaff = teamStaff.filter(s => Number((s as any).morale ?? 50) < 40)

  // ── Contract expiry ──
  const expiringContracts = teamStaff.filter(s => {
    const endYear = Number((s as any).contract?.endYear ?? 9999)
    return endYear === (careerState.currentYear ?? 9999)
  })

  // ── Family / relationships ──
  const hasPartner = !!(personalLife?.partner || (personalLife?.family as any)?.partner)
  const hasChildren = ((personalLife?.family as any)?.children ?? []).length > 0
  const hasFamily = hasPartner || hasChildren

  // ── Hobbies ──
  const activeHobbiesArr = ((personalLife as any)?.hobbies?.active ?? (personalLife as any)?.hobbies ?? []) as Array<Record<string, unknown>>
  const hasHobbies = Array.isArray(activeHobbiesArr) && activeHobbiesArr.length > 0

  // ── Player stats ──
  const reputation = Number(player.reputation ?? (stats as any)?.reputation ?? 50)
  const confidence = Number(mentalState?.confidence ?? 50)
  const fatigue = Number(mentalState?.fatigue ?? (player as any).fatigue ?? 30)

  // ── Financial runway ──
  const runwayWeeks = Number((ownedTeam?.budgets as Record<string, unknown>)?.runwayWeeks ?? 20)

  // ============================================
  // 1. STATE-AWARE ONBOARDING SUGGESTIONS
  //    These fire based on what the team is missing.
  // ============================================

  // No car — highest priority; you can't do anything without one
  if (!hasCars) {
    suggestions.push({
      id: 'suggest_buy_car',
      text: 'Buy a car from the Marketplace',
      reason: 'You need a car before you can race or develop anything',
      urgency: 'high',
      action: { label: 'Browse Marketplace', path: '/marketplace' },
      category: 'team',
    })
  }

  // Has car but no series entry
  if (hasCars && !hasSeriesEntry) {
    suggestions.push({
      id: 'suggest_enter_series',
      text: 'Enter a racing series',
      reason: 'You have a car — now register for a championship',
      urgency: 'high',
      action: { label: 'Series Entry', path: '/series-entry' },
      category: 'team',
    })
  }

  // Missing key staff roles (show up to 2 at a time)
  const keyRoles: Array<{ role: string; label: string }> = [
    { role: 'chief_engineer', label: 'Chief Engineer' },
    { role: 'strategist', label: 'Race Strategist' },
    { role: 'race_engineer', label: 'Race Engineer' },
    { role: 'crew_chief', label: 'Crew Chief' },
    { role: 'team_manager', label: 'Team Manager' },
  ]
  let staffVacanciesShown = 0
  for (const { role, label } of keyRoles) {
    if (!hiredRoles.has(role) && staffVacanciesShown < 2) {
      suggestions.push({
        id: `suggest_hire_${role}`,
        text: `Hire a ${label}`,
        reason: `You're missing a ${label} — check the Staff Market`,
        urgency: staffVacanciesShown === 0 ? 'high' : 'medium',
        action: { label: 'Staff Market', path: '/staff-market' },
        category: 'team',
      })
      staffVacanciesShown++
    }
  }

  // No sponsors
  if (!hasSponsors) {
    suggestions.push({
      id: 'suggest_find_sponsors',
      text: 'Find a sponsor',
      reason: 'Sponsors fund your operations — visit the Sponsor Market',
      urgency: 'medium',
      action: { label: 'Sponsor Market', path: '/sponsor-market' },
      category: 'business',
    })
  }

  // Has car + series entry but no hired drivers
  if (hasCars && hasSeriesEntry && !hasDrivers) {
    suggestions.push({
      id: 'suggest_scout_drivers',
      text: 'Scout for drivers',
      reason: 'You need a hired driver for your second car',
      urgency: 'medium',
      action: { label: 'Scouting', path: '/scouting' },
      category: 'team',
    })
  }

  // Early-game facility review (weeks 1-4 only)
  if (currentWeek <= 4) {
    suggestions.push({
      id: 'suggest_review_facilities',
      text: 'Review your facilities',
      reason: 'Inspect your HQ and plan upgrades',
      urgency: 'low',
      action: { label: 'Facilities', path: '/facilities' },
      category: 'team',
    })
  }

  // Early-game gym suggestion (weeks 1-4 only)
  if (currentWeek <= 4) {
    suggestions.push({
      id: 'suggest_gym_early',
      text: 'Schedule a gym session',
      reason: 'Build a fitness routine early — it pays off on race day',
      urgency: 'low',
      action: { label: 'Open Calendar', activityTemplateId: 'fitness_session' },
      category: 'personal',
    })
  }

  // Season planning (early game, no series yet)
  if (currentWeek <= 4 && !hasSeriesEntry) {
    suggestions.push({
      id: 'suggest_season_planning',
      text: 'Plan your first season',
      reason: 'Map out your goals and priorities for the year ahead',
      urgency: 'low',
      action: { label: 'Open Calendar', activityTemplateId: 'team_meeting' },
      category: 'team',
    })
  }

  // ============================================
  // 2. DELEGATION INSIGHT TIPS
  //    Fire from week 2+ so they don't overwhelm week 1.
  //    Teach the player about staff delegation benefits.
  // ============================================

  if (currentWeek >= 2) {
    if (!hiredRoles.has('team_manager')) {
      suggestions.push({
        id: 'suggest_delegation_team_manager',
        text: 'Hire a Team Manager',
        reason: 'They can handle staff interviews and day-to-day operations for you',
        urgency: 'low',
        action: { label: 'Staff Market', path: '/staff-market' },
        category: 'team',
      })
    }
    if (!hiredRoles.has('pr_manager') && currentWeek >= 3) {
      suggestions.push({
        id: 'suggest_delegation_pr_manager',
        text: 'Hire a PR Manager',
        reason: 'They deal with media requests and sponsor communications so you don\'t have to',
        urgency: 'low',
        action: { label: 'Staff Market', path: '/staff-market' },
        category: 'team',
      })
    }
    if (!hiredRoles.has('chief_engineer') && hasCars) {
      suggestions.push({
        id: 'suggest_delegation_chief_engineer',
        text: 'Hire a Chief Engineer',
        reason: 'Unlocks R&D project slots and oversees car development',
        urgency: 'low',
        action: { label: 'Staff Market', path: '/staff-market' },
        category: 'team',
      })
    }
    if (!hiredRoles.has('strategist') && hasSeriesEntry) {
      suggestions.push({
        id: 'suggest_delegation_strategist',
        text: 'Hire a Race Strategist',
        reason: 'With a Strategist on board, race strategy is handled automatically',
        urgency: 'low',
        action: { label: 'Staff Market', path: '/staff-market' },
        category: 'team',
      })
    }
  }

  // ============================================
  // 3. STANDARD PROBLEM-BASED SUGGESTIONS
  //    These fire when metrics drop below thresholds.
  // ============================================

  // --- Team Health ---
  const boardMood = Number(ownedTeam?.boardMood ?? 50)
  if (boardMood < 50) {
    suggestions.push({
      id: 'suggest_board_meeting',
      text: 'Schedule a Board Meeting',
      reason: `Board mood is low (${boardMood}%)`,
      urgency: boardMood < 30 ? 'high' : 'medium',
      action: { label: 'Open Calendar', path: '/calendar' },
      category: 'team',
    })
  }

  // Derive team morale from individual staff (source of truth), with teamMorale field as fallback
  const suggStaff = (ownedTeam?.staff ?? []) as Array<Record<string, unknown>>
  const teamMorale = suggStaff.length > 0
    ? Math.round(suggStaff.reduce((sum, s) => sum + Number(s.morale ?? 70), 0) / suggStaff.length)
    : Number((ownedTeam as Record<string, unknown>)?.teamMorale ?? 50)
  if (teamMorale < 45) {
    suggestions.push({
      id: 'suggest_team_building',
      text: 'Plan a Team Building activity',
      reason: `Staff morale is ${teamMorale}% — a boost would help`,
      urgency: teamMorale < 30 ? 'high' : 'medium',
      action: { label: 'Open Calendar', path: '/calendar' },
      category: 'team',
    })
  }

  // --- Business ---
  const emails = careerState.emails || []
  const expiringSponsors = emails.filter(
    e => e.category === 'sponsor' && !e.archived && e.expiresWeek && 
         e.expiresWeek <= careerState.currentWeek + 2
  )
  if (expiringSponsors.length > 0) {
    suggestions.push({
      id: 'suggest_sponsor_expiring',
      text: `${expiringSponsors.length} sponsor offer${expiringSponsors.length > 1 ? 's' : ''} expiring soon`,
      reason: 'Review them before they expire',
      urgency: 'high',
      action: { label: 'Check Inbox', path: '/emails' },
      category: 'business',
    })
  }

  const unreadCount = emails.filter(e => !e.read && !e.archived).length
  if (unreadCount > 5) {
    suggestions.push({
      id: 'suggest_inbox',
      text: `Catch up on your inbox (${unreadCount} unread)`,
      reason: 'Important messages may be waiting',
      urgency: unreadCount > 10 ? 'medium' : 'low',
      action: { label: 'Open Inbox', path: '/emails' },
      category: 'business',
    })
  }

  if (runwayWeeks < 8) {
    suggestions.push({
      id: 'suggest_financial',
      text: `Financial runway is ${runwayWeeks} weeks`,
      reason: runwayWeeks < 4 ? 'Critical — find new sponsors or cut costs urgently' : 'Consider cost cuts or new sponsors',
      urgency: runwayWeeks < 4 ? 'high' : 'medium',
      action: { label: 'View Finances', path: '/finances' },
      category: 'business',
    })
  }

  // --- Personal Life ---
  const partner = personalLife?.partner as Record<string, unknown> | undefined
  if (partner) {
    const happiness = Number(partner.happiness ?? 50)
    if (happiness < 50) {
      suggestions.push({
        id: 'suggest_date_night',
        text: `Plan a date with ${partner.name || 'your partner'}`,
        reason: `Partner happiness is at ${happiness}%`,
        urgency: happiness < 30 ? 'high' : 'medium',
        action: { label: 'Schedule Date', path: '/calendar' },
        category: 'personal',
      })
    }
    
    const lastInteraction = Number(partner.lastDateWeek ?? 0)
    const weeksSinceDate = careerState.currentWeek - lastInteraction
    if (weeksSinceDate >= 3 && happiness >= 50) {
      suggestions.push({
        id: 'suggest_partner_neglect',
        text: `You haven't scheduled a date in ${weeksSinceDate} weeks`,
        reason: `Keep the relationship strong`,
        urgency: weeksSinceDate > 5 ? 'high' : 'low',
        action: { label: 'Plan Something', path: '/calendar' },
        category: 'personal',
      })
    }
  }

  const stress = Number(mentalState?.stress ?? 30)
  if (stress > 60) {
    suggestions.push({
      id: 'suggest_rest',
      text: `Take an afternoon off`,
      reason: `Your stress is at ${stress}% — rest is recommended`,
      urgency: stress > 80 ? 'high' : 'medium',
      action: { label: 'Schedule Rest', path: '/calendar' },
      category: 'personal',
    })
  }

  // --- Driving (only when relevant — suppress if no car) ---
  const fitness = Number(stats?.fitness ?? mentalState?.fitness ?? 50)
  if (fitness < 50) {
    suggestions.push({
      id: 'suggest_workout',
      text: 'Schedule a workout session',
      reason: `Fitness is low (${fitness}%) — affects race performance`,
      urgency: fitness < 30 ? 'high' : 'medium',
      action: { label: 'Open Calendar', path: '/calendar' },
      category: 'driving',
    })
  }

  // Car wear / not serviced — ONLY if team has cars
  if (hasCars) {
    const maxWear = Math.max(...teamCars.map(c => Number(c.wear ?? (c as any).avgWear ?? 0)), 0)
    if (maxWear > 60) {
      suggestions.push({
        id: 'suggest_car_service',
        text: 'Service your car before the next race',
        reason: `Car wear is at ${maxWear}%`,
        urgency: maxWear > 80 ? 'high' : 'medium',
        action: { label: 'Open Garage', path: '/garage' },
        category: 'driving',
      })
    }
  }

  // R&D idle — ONLY if team has cars (can't R&D without a car)
  if (hasCars) {
    const rndProjects = (ownedTeam as Record<string, unknown>)?.activeRnD as Array<unknown> | undefined
    if (!rndProjects || rndProjects.length === 0) {
      suggestions.push({
        id: 'suggest_rnd',
        text: 'Start a new R&D project',
        reason: 'No active research — development is stalling',
        urgency: 'low',
        action: { label: 'Open Garage', path: '/garage' },
        category: 'driving',
      })
    }
  }

  // Hobby near milestone
  const hobbies = (personalLife as Record<string, unknown>)?.hobbies as Record<string, unknown> | undefined
  const activeHobbies = hobbies?.active as Array<Record<string, unknown>> | undefined
  if (activeHobbies) {
    for (const hobby of activeHobbies) {
      const progress = Number(hobby.progress ?? 0)
      const nextLevel = Number(hobby.nextLevelAt ?? 100)
      if (nextLevel > 0 && (nextLevel - progress) / nextLevel < 0.15) {
        suggestions.push({
          id: `suggest_hobby_${hobby.id}`,
          text: `One more session to level up ${hobby.name || 'a hobby'}`,
          reason: `Almost at the next milestone`,
          urgency: 'low',
          action: { label: 'Schedule Session', path: '/calendar' },
          category: 'personal',
        })
        break
      }
    }
  }

  // ============================================
  // 4. MEDIA & PR SUGGESTIONS
  //    Boost visibility, fan sentiment, and sponsor satisfaction
  // ============================================

  // Social media content — when followers are low or it's been a while
  if (teamFollowers < 5000 || currentWeek % 3 === 0) {
    suggestions.push({
      id: 'suggest_social_media_content',
      text: 'Create social media content',
      reason: teamFollowers < 5000
        ? `Team followers are only ${teamFollowers.toLocaleString()} — content boosts visibility`
        : 'Regular content keeps fans engaged',
      urgency: 'low',
      action: { label: 'Schedule Content Day', path: '/calendar' },
      category: 'media',
    })
  }

  // Press / media day — when reputation is low and you have a series entry
  if (reputation < 40 && hasSeriesEntry) {
    suggestions.push({
      id: 'suggest_press_day',
      text: 'Schedule a Media Day',
      reason: `Reputation is at ${reputation}% — media coverage would help`,
      urgency: 'medium',
      action: { label: 'Schedule Media Day', path: '/calendar' },
      category: 'media',
    })
  }

  // Podcast appearance — periodic, reputation gated
  if (currentWeek >= 4 && reputation >= 15 && currentWeek % 6 <= 1) {
    suggestions.push({
      id: 'suggest_podcast',
      text: 'Do a podcast appearance',
      reason: 'Easy way to boost reputation and connect with fans',
      urgency: 'low',
      action: { label: 'Schedule Podcast', path: '/calendar' },
      category: 'media',
    })
  }

  // Fan event — when fan sentiment drops
  if (fanSentiment < 40 && hasSeriesEntry) {
    suggestions.push({
      id: 'suggest_fan_event',
      text: 'Host a Fan Appreciation Event',
      reason: `Fan sentiment is at ${fanSentiment}% — show them some love`,
      urgency: 'medium',
      action: { label: 'Schedule Event', path: '/calendar' },
      category: 'media',
    })
  }

  // Documentary / behind-the-scenes — mid-game, reputation gated
  if (reputation >= 25 && currentWeek >= 8 && currentWeek % 12 <= 1) {
    suggestions.push({
      id: 'suggest_documentary',
      text: 'Film behind-the-scenes content',
      reason: 'Great for fan engagement and sponsor visibility',
      urgency: 'low',
      action: { label: 'Schedule Filming', path: '/calendar' },
      category: 'media',
    })
  }

  // Charity event — seasonal, reputation gated
  if (reputation >= 20 && currentWeek >= 6 && currentWeek % 12 <= 1) {
    suggestions.push({
      id: 'suggest_charity_event',
      text: 'Host a charity karting event',
      reason: 'Great for PR, community relations, and team morale',
      urgency: 'low',
      action: { label: 'Schedule Event', path: '/calendar' },
      category: 'media',
    })
  }

  // ============================================
  // 5. LIFESTYLE & RELATIONSHIP SUGGESTIONS
  //    Personal well-being, family, and self-improvement
  // ============================================

  // Hobby session — when player has hobbies and is stressed
  if (hasHobbies && stress > 40) {
    suggestions.push({
      id: 'suggest_hobby_session',
      text: 'Spend time on your hobby',
      reason: `Stress is at ${stress}% — hobbies help you decompress`,
      urgency: 'low',
      action: { label: 'Schedule Hobby Time', path: '/calendar' },
      category: 'personal',
    })
  }

  // Family time — if player has partner or children
  if (hasFamily) {
    suggestions.push({
      id: 'suggest_family_time',
      text: 'Schedule family time this weekend',
      reason: 'Quality time with loved ones reduces stress and boosts morale',
      urgency: 'low',
      action: { label: 'Schedule Family Day', path: '/calendar' },
      category: 'personal',
    })
  }

  // Wellness retreat — when stress or fatigue is high
  if (stress > 50 || fatigue > 60) {
    suggestions.push({
      id: 'suggest_wellness_retreat',
      text: 'Book a wellness retreat',
      reason: stress > 50
        ? `Stress is at ${stress}% — a retreat would help you recharge`
        : `Fatigue is high — consider some serious downtime`,
      urgency: 'medium',
      action: { label: 'Schedule Retreat', path: '/calendar' },
      category: 'personal',
    })
  }

  // Mental coaching — low confidence or pre-race week
  if (confidence < 40 || isPreRaceWeek) {
    suggestions.push({
      id: 'suggest_mental_coaching',
      text: 'Book a mental coaching session',
      reason: confidence < 40
        ? `Confidence is at ${confidence}% — a coach can help`
        : 'Mental preparation before race weekend',
      urgency: isPreRaceWeek ? 'medium' : 'low',
      action: { label: 'Schedule Coaching', path: '/calendar' },
      category: 'personal',
    })
  }

  // Education — early game growth
  if (currentWeek <= 8) {
    suggestions.push({
      id: 'suggest_education',
      text: 'Take a course or workshop',
      reason: 'Invest in yourself — business or engineering courses pay off long-term',
      urgency: 'low',
      action: { label: 'Schedule Course', path: '/calendar' },
      category: 'personal',
    })
  }

  // Networking event — when reputation is low
  if (reputation < 30 && currentWeek >= 4) {
    suggestions.push({
      id: 'suggest_networking_event',
      text: 'Attend an industry networking event',
      reason: `Reputation is ${reputation}% — networking builds connections`,
      urgency: 'low',
      action: { label: 'Schedule Networking', path: '/calendar' },
      category: 'personal',
    })
  }

  // ============================================
  // 6. BUSINESS & SPONSOR SUGGESTIONS
  //    Revenue, relationships, and contract management
  // ============================================

  // Sponsor scouting — when sponsors are missing or thin
  if (!hasSponsors || activeSponsors.length < 2) {
    suggestions.push({
      id: 'suggest_sponsor_scouting',
      text: 'Research potential sponsors',
      reason: activeSponsors.length === 0
        ? 'You have no sponsors — research who might be interested'
        : 'Only one sponsor — diversify your funding sources',
      urgency: 'medium',
      action: { label: 'Schedule Research', path: '/calendar' },
      category: 'business',
    })
  }

  // Networking dinner — periodic
  if (currentWeek >= 4 && currentWeek % 8 <= 1) {
    suggestions.push({
      id: 'suggest_networking_dinner',
      text: 'Attend a networking dinner',
      reason: 'Build industry connections with team principals, engineers, and sponsors',
      urgency: 'low',
      action: { label: 'Schedule Dinner', path: '/calendar' },
      category: 'business',
    })
  }

  // Investor meeting — when finances are tight and reputation is decent
  if (runwayWeeks < 12 && reputation >= 40) {
    suggestions.push({
      id: 'suggest_investor_meeting',
      text: 'Meet with potential investors',
      reason: `Financial runway is ${runwayWeeks} weeks — investors could help`,
      urgency: runwayWeeks < 6 ? 'high' : 'medium',
      action: { label: 'Schedule Meeting', path: '/calendar' },
      category: 'business',
    })
  }

  // Contract review — when contracts are expiring this year
  if (expiringContracts.length > 0) {
    suggestions.push({
      id: 'suggest_contract_review',
      text: `Review ${expiringContracts.length} expiring contract${expiringContracts.length > 1 ? 's' : ''}`,
      reason: 'Staff contracts are expiring this year — negotiate renewals',
      urgency: 'high',
      action: { label: 'Schedule Review', path: '/calendar' },
      category: 'business',
    })
  }

  // ============================================
  // 7. POST-RACE SUGGESTIONS
  //    Analysis and recovery after a race weekend
  // ============================================

  if (isPostRaceWeek) {
    // Driver debrief
    if (hasDrivers) {
      suggestions.push({
        id: 'suggest_driver_debrief',
        text: 'Debrief your driver on last race',
        reason: 'Review performance while it\'s fresh — improves development',
        urgency: 'medium',
        action: { label: 'Schedule Debrief', path: '/calendar' },
        category: 'team',
      })
    }

    // Data analysis
    if (hasSeriesEntry) {
      suggestions.push({
        id: 'suggest_data_analysis',
        text: 'Analyze race data from last weekend',
        reason: 'Telemetry review helps identify setup improvements',
        urgency: 'medium',
        action: { label: 'Schedule Analysis', path: '/calendar' },
        category: 'driving',
      })
    }

    // Post-race rest
    if (stress > 50) {
      suggestions.push({
        id: 'suggest_post_race_rest',
        text: 'Take some downtime after the race',
        reason: `Stress is at ${stress}% — recovery is important`,
        urgency: 'low',
        action: { label: 'Schedule Rest', path: '/calendar' },
        category: 'personal',
      })
    }
  }

  // ============================================
  // 8. PRE-RACE & STAFF SUGGESTIONS
  //    Logistics, preparation, and staff development
  // ============================================

  // Transport logistics — before race week
  if (isPreRaceWeek && hasSeriesEntry) {
    suggestions.push({
      id: 'suggest_transport_logistics',
      text: 'Plan race weekend logistics',
      reason: 'Ensure cars, equipment, and staff are ready for the race',
      urgency: 'medium',
      action: { label: 'Schedule Planning', path: '/calendar' },
      category: 'team',
    })
  }

  // Staff training — when morale is low across the team
  if (avgStaffMorale < 45 || lowMoraleStaff.length >= 2) {
    suggestions.push({
      id: 'suggest_staff_training',
      text: 'Run a staff training workshop',
      reason: lowMoraleStaff.length >= 2
        ? `${lowMoraleStaff.length} staff members have low morale — training boosts skills and spirit`
        : `Average staff morale is ${Math.round(avgStaffMorale)}% — invest in your people`,
      urgency: 'medium',
      action: { label: 'Schedule Workshop', path: '/calendar' },
      category: 'team',
    })
  }

  // Leadership coaching — when board mood is troublesome
  const boardMoodForCoaching = Number(ownedTeam?.boardMood ?? 50)
  if (boardMoodForCoaching < 45 && reputation >= 20) {
    suggestions.push({
      id: 'suggest_leadership_coaching',
      text: 'Book a leadership coaching session',
      reason: `Board mood is at ${boardMoodForCoaching}% — sharpen your management skills`,
      urgency: 'low',
      action: { label: 'Schedule Coaching', path: '/calendar' },
      category: 'personal',
    })
  }

  // ============================================
  // De-duplicate: if a delegation tip and a hire tip target the same role,
  // keep only the higher-urgency one (the hire tip)
  // ============================================
  const seen = new Map<string, ContextualSuggestion>()
  const deduped: ContextualSuggestion[] = []
  const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  for (const s of suggestions) {
    // Extract the role key from delegation tips and hire tips
    const roleMatch = s.id.match(/suggest_(?:hire|delegation)_(.+)/)
    const dedupeKey = roleMatch ? `role_${roleMatch[1]}` : s.id
    const existing = seen.get(dedupeKey)
    if (existing) {
      // Keep higher urgency (lower number)
      if (urgencyOrder[s.urgency] < urgencyOrder[existing.urgency]) {
        seen.set(dedupeKey, s)
      }
    } else {
      seen.set(dedupeKey, s)
    }
  }
  for (const s of suggestions) {
    const roleMatch = s.id.match(/suggest_(?:hire|delegation)_(.+)/)
    const dedupeKey = roleMatch ? `role_${roleMatch[1]}` : s.id
    if (seen.get(dedupeKey) === s) {
      deduped.push(s)
    }
  }

  // Sort by urgency
  deduped.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  return deduped
}

// ============================================
// GENERATE SCHEDULE SUGGESTIONS (for PA email + auto-scheduler)
// ============================================

export function generateScheduleSuggestions(
  careerState: CareerState,
  player: Record<string, unknown> | null
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = []
  if (!careerState || !player) return suggestions

  const contextualSuggestions = generateSuggestions(careerState, player)
  
  // Map contextual suggestions to schedule suggestions with specific time slots
  // Week 1 is a partial week — only days from Jan 1's day-of-week through Sunday exist
  const currentYear = careerState.currentYear ?? new Date().getFullYear()
  const week1Len = getWeek1Length(currentYear)
  const jan1Day = 8 - week1Len // e.g. 4 days in week 1 → Jan 1 is day 4 (Thursday)
  const weekStartDay = careerState.currentWeek === 1 ? jan1Day : 1
  let daySlot = weekStartDay // Start filling from first available day
  let priority = 100
  
  for (const cs of contextualSuggestions) {
    let templateId = ''
    let hours = 2
    let category: ScheduleSuggestion['category'] = 'recommended'
    
    // Map suggestion types to activity templates / time slots.
    // Navigation-only suggestions (buy car, enter series, hire staff, etc.)
    // are skipped here — they guide the player to pages, not calendar activities.
    switch (cs.id) {
      // --- Team / Strategy ---
      case 'suggest_board_meeting':
        templateId = 'board_strategy_session'
        hours = 6
        category = 'recommended'
        break
      case 'suggest_team_building':
        templateId = 'team_building'
        hours = 3
        category = 'recommended'
        break
      case 'suggest_season_planning':
        templateId = 'team_meeting'
        hours = 3
        category = 'recommended'
        break
      case 'suggest_review_facilities':
        templateId = 'facility_planning'
        hours = 6
        category = 'recommended'
        break
      case 'suggest_staff_training':
        templateId = 'staff_training'
        hours = 6
        category = 'recommended'
        break
      case 'suggest_leadership_coaching':
        templateId = 'leadership_coaching'
        hours = 3
        category = 'recommended'
        break

      // --- Development / Driving ---
      case 'suggest_car_service':
        templateId = 'car_service'
        hours = 8
        category = 'recommended'
        break
      case 'suggest_rnd':
        templateId = 'engineering_review'
        hours = 6
        category = 'recommended'
        break

      // --- Post-race ---
      case 'suggest_driver_debrief':
        templateId = 'driver_debrief'
        hours = 3
        category = 'recommended'
        daySlot = 1 // Monday after race
        break
      case 'suggest_data_analysis':
        templateId = 'data_analysis'
        hours = 4
        category = 'recommended'
        daySlot = 2 // Tuesday after race
        break
      case 'suggest_post_race_rest':
        templateId = 'rest_day'
        hours = 8
        category = 'personal'
        daySlot = 1
        break

      // --- Pre-race ---
      case 'suggest_transport_logistics':
        templateId = 'transport_logistics'
        hours = 3
        category = 'recommended'
        break

      // --- Business / Sponsors ---
      case 'suggest_sponsor_scouting':
        templateId = 'sponsor_scouting'
        hours = 3
        category = 'recommended'
        break
      case 'suggest_networking_dinner':
        templateId = 'networking_dinner'
        hours = 4
        category = 'recommended'
        break
      case 'suggest_investor_meeting':
        templateId = 'investor_meeting'
        hours = 4
        category = 'recommended'
        break
      case 'suggest_contract_review':
        templateId = 'contract_negotiations'
        hours = 4
        category = 'recommended'
        break

      // --- Media / PR ---
      case 'suggest_social_media_content':
        templateId = 'social_media_content'
        hours = 3
        category = 'recommended'
        break
      case 'suggest_press_day':
        templateId = 'press_day'
        hours = 8
        category = 'recommended'
        break
      case 'suggest_podcast':
        templateId = 'podcast_appearance'
        hours = 3
        category = 'recommended'
        break
      case 'suggest_fan_event':
        templateId = 'fan_event'
        hours = 4
        category = 'recommended'
        break
      case 'suggest_documentary':
        templateId = 'documentary_filming'
        hours = 4
        category = 'recommended'
        break
      case 'suggest_charity_event':
        templateId = 'charity_event'
        hours = 6
        category = 'recommended'
        break

      // --- Personal / Lifestyle ---
      case 'suggest_rest':
        templateId = 'rest_day'
        hours = 8
        category = 'personal'
        break
      case 'suggest_workout':
      case 'suggest_gym_early':
        templateId = 'fitness_session'
        hours = 2
        category = 'personal'
        break
      case 'suggest_date_night':
      case 'suggest_partner_neglect':
        templateId = 'family_time'
        hours = 6
        category = 'personal'
        daySlot = 6 // Suggest weekends for dates
        break
      case 'suggest_hobby_session':
        templateId = 'hobby_time'
        hours = 3
        category = 'personal'
        daySlot = 5 // Friday
        break
      case 'suggest_family_time':
        templateId = 'family_time'
        hours = 6
        category = 'personal'
        daySlot = 7 // Sunday
        break
      case 'suggest_wellness_retreat':
        templateId = 'wellness_retreat'
        hours = 8
        category = 'personal'
        daySlot = 6 // Weekend
        break
      case 'suggest_mental_coaching':
        templateId = 'mental_coaching'
        hours = 3
        category = 'personal'
        break
      case 'suggest_education':
        templateId = 'education_course'
        hours = 4
        category = 'personal'
        break
      case 'suggest_networking_event':
        templateId = 'networking_event'
        hours = 3
        category = 'personal'
        break

      default:
        // Skip navigation-only suggestions (buy car, hire staff, etc.)
        continue
    }
    
    // Clamp suggestedDay to valid range for this week
    // (don't place on days before the week starts, e.g. Mon-Wed in a Thu-start week 1)
    const clampedDay = Math.max(weekStartDay, Math.min(daySlot, 7))
    
    suggestions.push({
      templateId,
      name: cs.text,
      hours,
      suggestedDay: clampedDay,
      category,
      reason: cs.reason,
      priority: priority--,
    })
    
    daySlot++
    if (daySlot > 5) daySlot = 6 // Push overflow to weekend
  }
  
  return suggestions
}

// ============================================
// GET ACTIVE STORYLINES (for dashboard)
// ============================================

export interface ActiveStoryline {
  id: string
  title: string
  description: string
  progress: number        // 0-100
  category: 'championship' | 'sponsor' | 'facility' | 'relationship' | 'rnd' | 'financial' | 'reputation' | 'promise'
  action: { label: string; path: string }
  trend: 'improving' | 'declining' | 'stable'
}

export function getActiveStorylines(
  careerState: CareerState,
  player: Record<string, unknown> | null
): ActiveStoryline[] {
  const storylines: ActiveStoryline[] = []
  if (!careerState || !player) return storylines
  
  const ownedTeam = careerState.ownedTeam as Record<string, unknown> | undefined
  const personalLife = (careerState as Record<string, unknown>).personalLife as Record<string, unknown> | undefined
  
  // --- Championship Push ---
  const currentSeries = (player as Record<string, unknown>).currentSeriesId as string | undefined
  if (currentSeries) {
    const raceHistory = (player as Record<string, unknown>).raceHistory as Array<Record<string, unknown>> | undefined
    const totalRaces = raceHistory?.length ?? 0
    const wins = raceHistory?.filter(r => Number(r.racePosition) === 1).length ?? 0
    const podiums = raceHistory?.filter(r => Number(r.racePosition) <= 3).length ?? 0
    
    storylines.push({
      id: 'championship',
      title: 'Championship Campaign',
      description: totalRaces > 0
        ? `${wins} win${wins !== 1 ? 's' : ''}, ${podiums} podium${podiums !== 1 ? 's' : ''} from ${totalRaces} race${totalRaces !== 1 ? 's' : ''}`
        : 'Season not yet started',
      progress: Math.min(totalRaces * 5, 100),
      category: 'championship',
      action: { label: 'View Standings', path: '/paddock' },
      trend: 'stable',
    })
  }

  // --- Sponsor Contract ---
  const sponsors = (ownedTeam?.finances as Record<string, unknown>)?.sponsors as Array<Record<string, unknown>> | undefined
  if (sponsors && sponsors.length > 0) {
    const expiringSponsors = sponsors.filter(s => {
      const endWeek = Number(s.endWeek ?? s.contractEndWeek ?? 999)
      return endWeek - careerState.currentWeek <= 4
    })
    if (expiringSponsors.length > 0) {
      const sponsor = expiringSponsors[0]
      const weeksLeft = Number(sponsor.endWeek ?? sponsor.contractEndWeek ?? 0) - careerState.currentWeek
      storylines.push({
        id: 'sponsor_expiring',
        title: `Sponsor: ${sponsor.name || 'Contract Expiring'}`,
        description: `${weeksLeft > 0 ? weeksLeft : 0} week${weeksLeft !== 1 ? 's' : ''} remaining — review renewal terms`,
        progress: clamp(100 - (weeksLeft / 8) * 100),
        category: 'sponsor',
        action: { label: 'Review Sponsors', path: '/sponsor-market' },
        trend: weeksLeft <= 2 ? 'declining' : 'stable',
      })
    }
  }

  // --- Facility Upgrade ---
  const facilities = ownedTeam?.facilities as Record<string, unknown> | undefined
  const activeUpgrade = (facilities as Record<string, unknown>)?.activeUpgrade as Record<string, unknown> | undefined
  if (activeUpgrade) {
    const progress = Number(activeUpgrade.progress ?? 0)
    const weeksRemaining = Number(activeUpgrade.weeksRemaining ?? 0)
    storylines.push({
      id: 'facility_upgrade',
      title: `Facility: ${activeUpgrade.name || 'Upgrade in Progress'}`,
      description: `${progress}% complete — ${weeksRemaining} week${weeksRemaining !== 1 ? 's' : ''} remaining`,
      progress: clamp(progress),
      category: 'facility',
      action: { label: 'View Facilities', path: '/facilities' },
      trend: 'improving',
    })
  }

  // --- Relationship Arc ---
  const partner = personalLife?.partner as Record<string, unknown> | undefined
  if (partner && partner.name) {
    const happiness = Number(partner.happiness ?? 50)
    const prevHappiness = Number(partner.previousHappiness ?? happiness)
    const trend: ActiveStoryline['trend'] = happiness > prevHappiness ? 'improving' 
      : happiness < prevHappiness ? 'declining' : 'stable'
    
    storylines.push({
      id: 'relationship',
      title: `Relationship: ${partner.name}`,
      description: happiness >= 70 ? 'Things are going well' 
        : happiness >= 40 ? 'Could use more attention'
        : 'Needs immediate attention',
      progress: clamp(happiness),
      category: 'relationship',
      action: { label: 'Personal Life', path: '/personal-life' },
      trend,
    })
  }

  // --- R&D Project ---
  const rndProjects = (ownedTeam as Record<string, unknown>)?.activeRnD as Array<Record<string, unknown>> | undefined
  if (rndProjects && rndProjects.length > 0) {
    const project = rndProjects[0]
    const progress = Number(project.progress ?? 0)
    const weeksRemaining = Number(project.weeksRemaining ?? 0)
    storylines.push({
      id: 'rnd_project',
      title: `R&D: ${project.name || 'Active Project'}`,
      description: `${progress}% complete — finishing in ${weeksRemaining} week${weeksRemaining !== 1 ? 's' : ''}`,
      progress: clamp(progress),
      category: 'rnd',
      action: { label: 'View Garage', path: '/garage' },
      trend: 'improving',
    })
  }

  // --- Financial Goal ---
  const cash = Number((ownedTeam?.budgets as Record<string, unknown>)?.cash ?? 0)
  const runwayWeeks = Number((ownedTeam?.budgets as Record<string, unknown>)?.runwayWeeks ?? 20)
  if (runwayWeeks < 12) {
    storylines.push({
      id: 'financial_goal',
      title: 'Financial Stability',
      description: `Runway at ${runwayWeeks} weeks — ${cash < 0 ? 'in the red!' : 'consider cost management'}`,
      progress: clamp((runwayWeeks / 20) * 100),
      category: 'financial',
      action: { label: 'View Finances', path: '/finances' },
      trend: runwayWeeks < 6 ? 'declining' : 'stable',
    })
  }

  // --- Reputation Milestone ---
  const reputation = Number((player as Record<string, unknown>).reputation ?? 50)
  const nextTier = reputation < 25 ? { name: 'Known', target: 25 }
    : reputation < 50 ? { name: 'Respected', target: 50 }
    : reputation < 75 ? { name: 'Famous', target: 75 }
    : reputation < 90 ? { name: 'Legendary', target: 90 }
    : null
  
  if (nextTier) {
    const pointsNeeded = nextTier.target - reputation
    storylines.push({
      id: 'reputation',
      title: `Reputation: ${nextTier.name}`,
      description: `${pointsNeeded.toFixed(1)} points from '${nextTier.name}' tier`,
      progress: clamp((reputation / nextTier.target) * 100),
      category: 'reputation',
      action: { label: 'View Paddock', path: '/paddock' },
      trend: 'stable',
    })
  }

  // --- Active Promises (from the Promise System) ---
  const promises = (careerState as Record<string, unknown>).promises as Array<Record<string, unknown>> | undefined
  if (promises && promises.length > 0) {
    const activePromises = promises.filter(p => p.status === 'active')
    for (const promise of activePromises.slice(0, 3)) { // Cap at 3 promise storylines
      const madeAtWeek = Number(promise.madeAtWeek ?? careerState.currentWeek)
      const deadlineWeek = Number(promise.deadlineWeek ?? careerState.currentWeek + 8)
      const totalDuration = Math.max(1, deadlineWeek - madeAtWeek)
      const elapsed = careerState.currentWeek - madeAtWeek
      const progress = clamp(Math.round((elapsed / totalDuration) * 100))
      const weeksRemaining = Math.max(0, deadlineWeek - careerState.currentWeek)

      // Determine trend based on urgency
      const trend: ActiveStoryline['trend'] = weeksRemaining <= 2 ? 'declining'
        : weeksRemaining <= 4 ? 'stable'
        : 'improving'

      // Map promise category to a navigable path
      const promiseCategory = String(promise.category ?? 'performance')
      const pathMap: Record<string, string> = {
        performance: '/paddock',
        investment: '/finances',
        wellbeing: '/personal-life',
        strategy: '/garage',
        development: '/garage',
      }
      const navPath = pathMap[promiseCategory] ?? '/calendar'

      storylines.push({
        id: `promise_${promise.id}`,
        title: String(promise.shortText ?? promise.text ?? 'Active Commitment'),
        description: `Promised during ${promise.sourceActivityName ?? 'event'} — ${weeksRemaining} wk${weeksRemaining !== 1 ? 's' : ''} remaining`,
        progress,
        category: 'promise',
        action: { label: 'View Details', path: navPath },
        trend,
      })
    }
  }

  return storylines
}

// ============================================
// WEEKLY OVERVIEW DATA (for the overview bar)
// ============================================

export interface DayOverview {
  day: number           // 1-7
  dayName: string
  mandatory: number     // Hours
  team: number
  personal: number
  driving: number
  free: number
  activities: Array<{ name: string; hours: number; type: string }>
}

export function getWeeklyOverview(careerState: CareerState): DayOverview[] {
  const days: DayOverview[] = []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const MAX_HOURS = 16
  
  const weekActivities = (careerState.scheduledActivities || []).filter(
    (a: ScheduledActivity) => a.scheduledWeek === careerState.currentWeek && a.status === 'scheduled'
  )
  
  // Week 1 is a partial week — only days from Jan 1's day-of-week through Sunday exist
  // e.g. 2026 starts on Thursday (day 4), so week 1 only has days 4-7 (Thu-Sun)
  const currentYear = careerState.currentYear ?? new Date().getFullYear()
  const week1Length = getWeek1Length(currentYear)
  const jan1DayOfWeek = 8 - week1Length // e.g. 4 days in week 1 → Jan 1 is day 4 (Thursday)
  const startDay = careerState.currentWeek === 1 ? jan1DayOfWeek : 1
  
  for (let d = startDay; d <= 7; d++) {
    const dayActivities = weekActivities.filter((a: ScheduledActivity) => {
      // Check if this day falls within the activity's span
      if (a.spanDays && a.spanDays > 1) {
        return d >= a.scheduledDay && d < a.scheduledDay + a.spanDays
      }
      return a.scheduledDay === d
    })
    
    let mandatory = 0
    let team = 0
    let personal = 0
    let driving = 0
    const actList: DayOverview['activities'] = []
    
    for (const act of dayActivities) {
      const hours = act.duration || 2
      const type = act.mandatory ? 'mandatory'
        : (act.category === 'personal' || act.category === 'lifestyle') ? 'personal'
        : (act.category === 'race' || act.category === 'development') ? 'driving'
        : 'team'
      
      switch (type) {
        case 'mandatory': mandatory += hours; break
        case 'personal': personal += hours; break
        case 'driving': driving += hours; break
        default: team += hours; break
      }
      
      actList.push({ name: act.name, hours, type })
    }
    
    const usedHours = mandatory + team + personal + driving
    const free = Math.max(0, MAX_HOURS - usedHours)
    
    days.push({
      day: d,
      dayName: dayNames[d - 1],
      mandatory,
      team,
      personal,
      driving,
      free,
      activities: actList,
    })
  }
  
  return days
}
