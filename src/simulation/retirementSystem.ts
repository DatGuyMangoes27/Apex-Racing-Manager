/**
 * Retirement / Career End System
 * 
 * Tracks retirement readiness, generates retirement prompts,
 * and provides career legacy summary at the end.
 */

export interface RetirementCheck {
  shouldPrompt: boolean
  reason?: string
  urgency: 'none' | 'gentle' | 'moderate' | 'strong'
}

export interface CareerLegacy {
  // Stats
  totalSeasons: number
  totalRaces: number
  totalWins: number
  totalPodiums: number
  totalPoles: number
  totalChampionships: number
  
  // Narrative
  careerRating: 'legendary' | 'outstanding' | 'successful' | 'respectable' | 'modest'
  highlights: string[]
  epitaph: string
  
  // Financial
  totalEarnings: number
  teamValue: number
  
  // Legacy
  dynastyGeneration: number
  legendScore: number
}

export interface RetirementContext {
  playerAge: number
  yearsInSport: number
  totalWins: number
  totalChampionships: number
  totalRaces: number
  totalPodiums: number
  totalPoles: number
  recentSeasonPositions: number[] // Last 3 season championship positions
  currentFitness: number
  currentStress: number
  totalEarnings: number
  teamValue: number
  dynastyGeneration: number
  hasSuccessor: boolean
  currentWeek: number
  currentYear: number
  injuryCount: number
  boardMood: number
}

// ============================================
// RETIREMENT TRIGGER CHECKS
// ============================================

export function checkRetirementTriggers(ctx: RetirementContext): RetirementCheck {
  const triggers: Array<{ check: boolean; reason: string; urgency: 'gentle' | 'moderate' | 'strong' }> = []
  
  // Age-based triggers
  if (ctx.playerAge >= 45) {
    triggers.push({
      check: true,
      reason: 'At 45+, the physical demands of racing are becoming increasingly challenging.',
      urgency: 'strong'
    })
  } else if (ctx.playerAge >= 40) {
    triggers.push({
      check: Math.random() < 0.15,
      reason: 'At 40, you\'re among the oldest active drivers. Have you thought about what comes next?',
      urgency: 'moderate'
    })
  } else if (ctx.playerAge >= 35) {
    triggers.push({
      check: Math.random() < 0.05,
      reason: 'You\'re entering the twilight years of most racing careers.',
      urgency: 'gentle'
    })
  }
  
  // Performance decline triggers
  if (ctx.recentSeasonPositions.length >= 3) {
    const avgPos = ctx.recentSeasonPositions.reduce((a, b) => a + b, 0) / ctx.recentSeasonPositions.length
    const declining = ctx.recentSeasonPositions.every((pos, i) => 
      i === 0 || pos >= ctx.recentSeasonPositions[i - 1]
    )
    
    if (declining && avgPos > 10) {
      triggers.push({
        check: true,
        reason: 'Your championship positions have been declining for three consecutive seasons.',
        urgency: 'moderate'
      })
    }
  }
  
  // Health triggers
  if (ctx.currentFitness < 30) {
    triggers.push({
      check: Math.random() < 0.2,
      reason: 'Your fitness levels are worryingly low. The physical demands of racing may be taking their toll.',
      urgency: 'moderate'
    })
  }
  
  if (ctx.injuryCount >= 5) {
    triggers.push({
      check: Math.random() < 0.1,
      reason: 'Multiple injuries over your career are raising concerns about long-term health.',
      urgency: 'gentle'
    })
  }
  
  // Achievement-based triggers (retire on a high)
  if (ctx.totalChampionships >= 3 && ctx.yearsInSport >= 10) {
    triggers.push({
      check: Math.random() < 0.05,
      reason: 'With multiple championships under your belt, you could retire as a legend. Going out on top is rare.',
      urgency: 'gentle'
    })
  }
  
  // Burnout triggers
  if (ctx.currentStress >= 80 && ctx.yearsInSport >= 5) {
    triggers.push({
      check: Math.random() < 0.1,
      reason: 'The constant pressure is taking its toll. Is this still what you want?',
      urgency: 'moderate'
    })
  }
  
  // Find the highest urgency trigger that activated
  const activeTriggers = triggers.filter(t => t.check)
  if (activeTriggers.length === 0) {
    return { shouldPrompt: false, urgency: 'none' }
  }
  
  const urgencyOrder = { strong: 3, moderate: 2, gentle: 1 }
  activeTriggers.sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency])
  
  return {
    shouldPrompt: true,
    reason: activeTriggers[0].reason,
    urgency: activeTriggers[0].urgency
  }
}

// ============================================
// CAREER LEGACY CALCULATOR
// ============================================

export function calculateCareerLegacy(ctx: RetirementContext): CareerLegacy {
  // Calculate legend score
  let legendScore = 0
  legendScore += ctx.totalChampionships * 100
  legendScore += ctx.totalWins * 10
  legendScore += ctx.totalPodiums * 3
  legendScore += ctx.totalPoles * 5
  legendScore += ctx.yearsInSport * 5
  legendScore += ctx.totalRaces * 1
  legendScore += Math.floor(ctx.totalEarnings / 100000) * 2
  legendScore += ctx.dynastyGeneration > 1 ? 50 : 0
  
  // Career rating
  let careerRating: CareerLegacy['careerRating']
  if (legendScore >= 500) careerRating = 'legendary'
  else if (legendScore >= 300) careerRating = 'outstanding'
  else if (legendScore >= 150) careerRating = 'successful'
  else if (legendScore >= 50) careerRating = 'respectable'
  else careerRating = 'modest'
  
  // Generate highlights
  const highlights: string[] = []
  if (ctx.totalChampionships > 0) {
    highlights.push(`🏆 ${ctx.totalChampionships}x Champion — a true title contender`)
  }
  if (ctx.totalWins >= 20) {
    highlights.push(`🏁 ${ctx.totalWins} career wins — a serial winner`)
  } else if (ctx.totalWins >= 5) {
    highlights.push(`🏁 ${ctx.totalWins} career victories`)
  } else if (ctx.totalWins >= 1) {
    highlights.push(`🏁 ${ctx.totalWins} hard-fought win${ctx.totalWins > 1 ? 's' : ''}`)
  }
  if (ctx.totalRaces >= 100) {
    highlights.push(`📅 ${ctx.totalRaces} races — an iron man of motorsport`)
  }
  if (ctx.yearsInSport >= 15) {
    highlights.push(`⏳ ${ctx.yearsInSport} years in the sport — a true veteran`)
  }
  if (ctx.totalEarnings >= 1000000) {
    highlights.push(`💰 Earned over $${(ctx.totalEarnings / 1000000).toFixed(1)}M in career earnings`)
  }
  if (ctx.dynastyGeneration > 1) {
    highlights.push(`👑 Part of a ${ctx.dynastyGeneration}-generation racing dynasty`)
  }
  if (ctx.teamValue > 0) {
    highlights.push(`🏢 Built a team valued at $${ctx.teamValue.toLocaleString()}`)
  }
  
  // Generate epitaph
  const epitaph = generateEpitaph(ctx, careerRating)
  
  return {
    totalSeasons: ctx.yearsInSport,
    totalRaces: ctx.totalRaces,
    totalWins: ctx.totalWins,
    totalPodiums: ctx.totalPodiums,
    totalPoles: ctx.totalPoles,
    totalChampionships: ctx.totalChampionships,
    careerRating,
    highlights,
    epitaph,
    totalEarnings: ctx.totalEarnings,
    teamValue: ctx.teamValue,
    dynastyGeneration: ctx.dynastyGeneration,
    legendScore
  }
}

function generateEpitaph(ctx: RetirementContext, rating: CareerLegacy['careerRating']): string {
  switch (rating) {
    case 'legendary':
      return `A true legend of motorsport. ${ctx.totalChampionships} championships, ${ctx.totalWins} wins, and a career that will be remembered for generations. They didn't just race — they defined an era.`
    case 'outstanding':
      return `An outstanding career by any measure. From their first race to their last, they showed the world what it means to compete at the highest level. ${ctx.totalWins} wins tell the story of a champion.`
    case 'successful':
      return `A successful career built on determination, skill, and an unwavering love for racing. ${ctx.yearsInSport} years of competition, countless memories, and a legacy that stands proud.`
    case 'respectable':
      return `A respectable career in a brutally competitive sport. Not every driver becomes a champion, but every driver who steps into a race car deserves respect. ${ctx.totalRaces} races of giving it everything.`
    default:
      return `Every racing career begins with a dream. While the results may not have matched the ambition, the journey was worth every moment. The paddock will miss them.`
  }
}

// ============================================
// RETIREMENT EMAIL GENERATOR
// ============================================

export function generateRetirementPromptEmail(check: RetirementCheck, ctx: RetirementContext): {
  subject: string
  body: string
  category: string
  sender: string
  senderRole: string
} | null {
  if (!check.shouldPrompt) return null
  
  const senders = {
    gentle: { sender: 'Motorsport Journalist', role: 'Media' },
    moderate: { sender: 'Sports Psychologist', role: 'Mental Performance' },
    strong: { sender: 'Team Doctor', role: 'Medical' }
  }
  
  const { sender, role } = senders[check.urgency as 'gentle' | 'moderate' | 'strong'] || senders.gentle
  
  return {
    subject: check.urgency === 'strong' 
      ? '⚠️ Serious Discussion: Your Racing Future'
      : check.urgency === 'moderate'
        ? '💭 Thoughts on the Future'
        : '📝 Career Reflection Piece',
    body: `${check.reason}\n\n` +
      `**Your Career at a Glance:**\n` +
      `- Age: ${ctx.playerAge}\n` +
      `- Seasons: ${ctx.yearsInSport}\n` +
      `- Wins: ${ctx.totalWins}\n` +
      `- Championships: ${ctx.totalChampionships}\n\n` +
      (check.urgency === 'strong'
        ? 'This isn\'t meant to pressure you, but it\'s worth having an honest conversation about what comes next. You can explore retirement options in your Personal Life section.'
        : check.urgency === 'moderate'
          ? 'Take some time to reflect. There\'s no rush, but thinking about the future is part of being a professional.'
          : 'Just food for thought. The best drivers know when to hang up their helmet — on their own terms.'),
    category: 'personal',
    sender,
    senderRole: role
  }
}
