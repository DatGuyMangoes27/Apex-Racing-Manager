// ============================================
// NARRATIVE BRIDGES
// ============================================
// Connects personal life state to racing context with
// short narrative snippets. These appear in the End Day modal
// and before race weekends to make the player FEEL how their
// life choices affect their racing.

export interface NarrativeBridge {
  id: string
  text: string
  category: 'warning' | 'positive' | 'neutral'
  icon: string
}

interface PlayerContext {
  fatigue: number
  stress: number
  fitness: number
  confidence: number
  hasPartner: boolean
  partnerHappiness?: number
  hasChildren: boolean
  hoursUsedToday: number
  isRaceWeek: boolean
  daysUntilRace: number
  boardMood: number
  teamMorale: number
  bankBalance: number
  recentDNF: boolean
}

/**
 * Generate contextual narrative snippets based on current player state.
 * These bridge personal life to racing performance narratively.
 * Returns 0-2 snippets (we don't want to spam the player).
 */
export function generateNarrativeBridges(context: PlayerContext): NarrativeBridge[] {
  const bridges: NarrativeBridge[] = []
  const candidates: NarrativeBridge[] = []
  
  // === HIGH FATIGUE NARRATIVES ===
  if (context.fatigue >= 80 && context.isRaceWeek) {
    candidates.push({
      id: 'fatigue_race_week',
      text: 'You can feel the exhaustion in your bones. Race week, and you\'re already running on fumes. The cockpit is going to feel like a furnace.',
      category: 'warning',
      icon: '😰',
    })
  } else if (context.fatigue >= 70 && context.daysUntilRace <= 3) {
    candidates.push({
      id: 'fatigue_pre_race',
      text: 'Your reaction times feel sluggish. A few more rest days before the race would have helped.',
      category: 'warning',
      icon: '😴',
    })
  } else if (context.fatigue >= 60) {
    candidates.push({
      id: 'fatigue_general',
      text: 'The long hours are starting to add up. Your body is telling you to slow down.',
      category: 'warning',
      icon: '⚡',
    })
  }
  
  // === STRESS NARRATIVES ===
  if (context.stress >= 80) {
    candidates.push({
      id: 'stress_critical',
      text: 'Your mind is racing even when you\'re not on track. Sleep has been difficult. If this keeps up, burnout is a real risk.',
      category: 'warning',
      icon: '🧠',
    })
  } else if (context.stress >= 60 && context.isRaceWeek) {
    candidates.push({
      id: 'stress_race_week',
      text: 'The pressure is mounting. Between the business and the racing, you feel pulled in every direction.',
      category: 'warning',
      icon: '😤',
    })
  }
  
  // === PARTNER NARRATIVES ===
  if (context.hasPartner && context.partnerHappiness !== undefined) {
    if (context.partnerHappiness < 30) {
      candidates.push({
        id: 'partner_unhappy',
        text: 'Things are tense at home. Your partner barely looked at you this morning. The distraction is weighing on you.',
        category: 'warning',
        icon: '💔',
      })
    } else if (context.partnerHappiness >= 80 && context.isRaceWeek) {
      candidates.push({
        id: 'partner_supportive',
        text: 'Your partner wished you luck this morning with a genuine smile. Having someone in your corner makes all the difference.',
        category: 'positive',
        icon: '❤️',
      })
    }
  }
  
  // === FITNESS NARRATIVES ===
  if (context.fitness >= 80 && context.isRaceWeek) {
    candidates.push({
      id: 'fitness_peak',
      text: 'Your body feels sharp and ready. All those gym sessions are paying off — you feel physically prepared for anything the race throws at you.',
      category: 'positive',
      icon: '💪',
    })
  } else if (context.fitness < 40 && context.isRaceWeek) {
    candidates.push({
      id: 'fitness_low',
      text: 'You feel heavier than usual. The physical demands of a full race distance are going to test you more than they should.',
      category: 'warning',
      icon: '🏋️',
    })
  }
  
  // === CONFIDENCE NARRATIVES ===
  if (context.confidence >= 80) {
    candidates.push({
      id: 'confidence_high',
      text: 'Everything feels dialed in. You know the car, you know the track, and you believe you can win.',
      category: 'positive',
      icon: '🔥',
    })
  } else if (context.confidence < 30 && context.isRaceWeek) {
    candidates.push({
      id: 'confidence_low',
      text: 'Doubt has been creeping in. The last few results haven\'t helped. You need a strong showing to turn things around.',
      category: 'warning',
      icon: '😕',
    })
  }
  
  // === FINANCIAL PRESSURE NARRATIVES ===
  if (context.bankBalance < 10000) {
    candidates.push({
      id: 'money_tight',
      text: 'The bank balance is getting dangerously low. Every decision now carries extra weight — you can\'t afford mistakes on or off the track.',
      category: 'warning',
      icon: '💸',
    })
  }
  
  // === TEAM MORALE NARRATIVES ===
  if (context.teamMorale < 30) {
    candidates.push({
      id: 'morale_low',
      text: 'The mood in the garage is grim. Your team is going through the motions, not fighting for every tenth. They need their leader.',
      category: 'warning',
      icon: '👥',
    })
  } else if (context.teamMorale >= 85 && context.isRaceWeek) {
    candidates.push({
      id: 'morale_high',
      text: 'There\'s a buzz in the garage. The team is fired up and ready to give you everything they\'ve got this weekend.',
      category: 'positive',
      icon: '🙌',
    })
  }
  
  // === BOARD PRESSURE NARRATIVES ===
  if (context.boardMood < 25) {
    candidates.push({
      id: 'board_critical',
      text: 'You can feel the board breathing down your neck. Results need to improve, and fast, or decisions will be made for you.',
      category: 'warning',
      icon: '📉',
    })
  }
  
  // === POST-DNF NARRATIVES ===
  if (context.recentDNF && context.isRaceWeek) {
    candidates.push({
      id: 'post_dnf',
      text: 'The memory of the last DNF still stings. You need a clean race this weekend to rebuild momentum.',
      category: 'neutral',
      icon: '🏁',
    })
  }
  
  // === WELL-RESTED NARRATIVES ===
  if (context.fatigue < 20 && context.stress < 30 && context.isRaceWeek) {
    candidates.push({
      id: 'well_rested',
      text: 'You slept well, ate well, and feel sharp. This is what race preparation should feel like.',
      category: 'positive',
      icon: '✨',
    })
  }
  
  // Select up to 2 bridges, prioritizing warnings, then positives
  const warnings = candidates.filter(b => b.category === 'warning')
  const positives = candidates.filter(b => b.category === 'positive')
  const neutrals = candidates.filter(b => b.category === 'neutral')
  
  // Pick 1 warning (if any) + 1 positive/neutral (if any)
  if (warnings.length > 0) {
    bridges.push(warnings[Math.floor(Math.random() * warnings.length)])
  }
  if (positives.length > 0) {
    bridges.push(positives[Math.floor(Math.random() * positives.length)])
  } else if (neutrals.length > 0) {
    bridges.push(neutrals[Math.floor(Math.random() * neutrals.length)])
  }
  
  return bridges.slice(0, 2)
}
