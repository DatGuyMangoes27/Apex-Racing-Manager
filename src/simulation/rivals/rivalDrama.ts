/**
 * Rival Mid-Season Drama Generator
 * 
 * Generates drama events and news items based on rival performance,
 * championship standings, and rivalry intensity. These create a
 * living, breathing competitive world around the player.
 */

import type { Email } from '@/store/careerStore'

export interface RivalDramaContext {
  playerName: string
  playerPosition: number
  playerPoints: number
  playerWins: number
  playerReputation: number
  currentWeek: number
  currentYear: number
  standings: Array<{
    driverName: string
    position: number
    points: number
    wins: number
    podiums: number
    isPlayer?: boolean
  }>
  /** Recent form of the closest rival */
  closestRival?: {
    name: string
    position: number
    points: number
    wins: number
    formStreak: number    // -5 to +5
    lastRacePosition: number
    relationshipWithPlayer: number // -100 to 100
    rivalryIntensity: number       // 0-100
  }
  seriesName: string
}

export interface RivalDramaResult {
  emails: Omit<Email, 'id'>[]
}

/**
 * Generate rival drama content for the weekly advance.
 * Returns 0-1 emails per week (not every week has drama).
 */
export function generateRivalDrama(context: RivalDramaContext): RivalDramaResult {
  const emails: Omit<Email, 'id'>[] = []
  
  if (!context.standings || context.standings.length < 2) return { emails }
  
  // Only generate drama ~30% of weeks, and not in the first few weeks
  if (context.currentWeek < 6 || Math.random() > 0.30) return { emails }
  
  const rival = context.closestRival
  const pointsGap = rival ? Math.abs(context.playerPoints - rival.points) : 999
  
  // ============================================
  // STANDINGS UPDATE (when fight is close)
  // ============================================
  if (rival && pointsGap <= 30 && context.currentWeek >= 10) {
    const playerAhead = context.playerPosition < rival.position
    
    if (playerAhead && pointsGap <= 10) {
      emails.push({
        category: 'team',
        subject: `Championship Alert: ${rival.name} Closing In`,
        sender: 'Team Analyst',
        senderRole: 'Performance Analysis',
        preview: `The championship gap to ${rival.name} is just ${pointsGap} points...`,
        body: `Boss,\n\nThe championship situation is getting tense. ${rival.name} is just ${pointsGap} points behind you in the ${context.seriesName} standings.\n\n${
          rival.formStreak > 2 
            ? `They're in excellent form right now — ${rival.formStreak} strong results in a row. We need to be on our game.`
            : rival.formStreak < -2
              ? `The good news is their recent form has been poor. We have an opportunity to build a gap.`
              : `Their form is steady. Every point matters from here.`
        }\n\nStay focused. The team believes in you.\n\nYour Team Analyst`,
        receivedDay: 1,
        receivedWeek: context.currentWeek,
        receivedYear: context.currentYear,
        read: false,
        starred: false,
        archived: false,
      })
    } else if (!playerAhead && pointsGap <= 15) {
      emails.push({
        category: 'team',
        subject: `Championship Update: ${pointsGap} Points to Close`,
        sender: 'Team Analyst',
        senderRole: 'Performance Analysis',
        preview: `You're ${pointsGap} points behind ${rival.name} in the championship...`,
        body: `Boss,\n\nHere's your championship update. You're currently ${pointsGap} points behind ${rival.name} in P${rival.position}.\n\n${
          rival.formStreak < -1
            ? `Their recent form has been shaky — this could be our window to strike.`
            : `They've been consistent, but there's plenty of racing left. A strong weekend could change everything.`
        }\n\nThe math says we need to outscore them by about ${Math.ceil(pointsGap / Math.max(1, 52 - context.currentWeek))} points per round. Very achievable.\n\nKeep pushing.\n\nYour Team Analyst`,
        receivedDay: 1,
        receivedWeek: context.currentWeek,
        receivedYear: context.currentYear,
        read: false,
        starred: false,
        archived: false,
      })
    }
  }
  
  // ============================================
  // RIVAL WIN CELEBRATION / TAUNT
  // ============================================
  if (rival && rival.lastRacePosition === 1 && rival.rivalryIntensity > 40) {
    if (Math.random() < 0.5) {
      emails.push({
        category: 'media',
        subject: `${rival.name} Celebrates Victory`,
        sender: 'Motorsport News',
        senderRole: 'News Desk',
        preview: `${rival.name} was jubilant after their win last weekend...`,
        body: `RACE REPORT\n\n${rival.name} celebrated ${rival.wins > 3 ? 'yet another' : 'a'} victory last weekend in the ${context.seriesName}.\n\n${
          rival.relationshipWithPlayer < -20 
            ? `In the post-race interview, they made a pointed comment: "Some people talk, we deliver. That's the difference."\n\nThe paddock believes this was aimed at ${context.playerName}.`
            : rival.relationshipWithPlayer > 20
              ? `Speaking after the race, they said: "${context.playerName} pushed me hard. It's a privilege to race against them."`
              : `${rival.name} was diplomatic in the media pen, but the steely determination was clear: they want this championship.`
        }\n\nStandings: ${context.standings.slice(0, 3).map(s => `${s.position}. ${s.driverName} (${s.points}pts)`).join(' | ')}`,
        receivedDay: 2,
        receivedWeek: context.currentWeek,
        receivedYear: context.currentYear,
        read: false,
        starred: false,
        archived: false,
      })
    }
  }
  
  // ============================================
  // FORM COMPARISONS
  // ============================================
  if (rival && context.currentWeek >= 12 && Math.random() < 0.25) {
    const _playerAvgPos = context.playerPoints > 0 ? context.playerPosition : 99
    const _rivalFormDesc = rival.formStreak > 2 ? 'on fire' : rival.formStreak < -2 ? 'struggling' : 'steady'
    
    if (rival.formStreak > 2 && context.playerWins < rival.wins) {
      emails.push({
        category: 'media',
        subject: `Analysis: ${rival.name}'s Red-Hot Form`,
        sender: 'Motorsport Weekly',
        senderRole: 'Chief Analyst',
        preview: `${rival.name} has been in sensational form recently...`,
        body: `FORM GUIDE\n\n${rival.name} is currently the form driver of the ${context.seriesName}. Their recent run of ${Math.abs(rival.formStreak)} strong results has seen them climb to P${rival.position} in the championship with ${rival.points} points.\n\nBy comparison, ${context.playerName} sits in P${context.playerPosition} with ${context.playerPoints} points.\n\n"${rival.name} is driving at an incredibly high level right now," said one pundit. "If they maintain this form, the championship could be theirs."\n\nThe question is: can anyone stop them?`,
        receivedDay: 3,
        receivedWeek: context.currentWeek,
        receivedYear: context.currentYear,
        read: false,
        starred: false,
        archived: false,
      })
    } else if (rival.formStreak < -2 && context.playerWins > rival.wins) {
      emails.push({
        category: 'media',
        subject: `${rival.name}'s Title Hopes Fading?`,
        sender: 'Motorsport Weekly',
        senderRole: 'Chief Analyst',
        preview: `After another difficult weekend, questions surround ${rival.name}...`,
        body: `FORM GUIDE\n\n${rival.name}'s championship campaign has hit turbulence. After ${Math.abs(rival.formStreak)} consecutive poor results, their title hopes are looking increasingly fragile.\n\nMeanwhile, ${context.playerName} continues to deliver, sitting in P${context.playerPosition} with ${context.playerPoints} points.\n\n"Something has changed in ${rival.name}'s approach," noted one team boss. "The confidence that defined their early-season form seems to have evaporated."\n\nCan ${rival.name} turn it around, or is the championship slipping away?`,
        receivedDay: 3,
        receivedWeek: context.currentWeek,
        receivedYear: context.currentYear,
        read: false,
        starred: false,
        archived: false,
      })
    }
  }
  
  // ============================================
  // RIVALRY ESCALATION
  // ============================================
  if (rival && rival.rivalryIntensity > 60 && rival.relationshipWithPlayer < -30 && Math.random() < 0.20) {
    emails.push({
      category: 'media',
      subject: `Tension Boils Over: ${context.playerName} vs ${rival.name}`,
      sender: 'Paddock Insider',
      senderRole: 'Exclusive Report',
      preview: `Sources say the relationship between the two title contenders has reached breaking point...`,
      body: `EXCLUSIVE\n\nThe rivalry between ${context.playerName} and ${rival.name} has reached new heights, according to paddock sources.\n\nInsiders report that the two have barely spoken since the last round, with team personnel describing the atmosphere as "toxic" whenever both are in the paddock.\n\n${
        rival.rivalryIntensity > 80 
          ? `"This is beyond normal competition," said one experienced team boss. "This is personal now. Something is going to give."`
          : `"There's a real edge to it now," said a paddock observer. "Both of them believe they deserve the championship, and neither is willing to back down."`
      }\n\nWith ${Math.max(0, 52 - context.currentWeek)} weeks remaining in the season, the question is whether this rivalry will produce drama on or off the track.`,
      receivedDay: 4,
      receivedWeek: context.currentWeek,
      receivedYear: context.currentYear,
      read: false,
      starred: false,
      archived: false,
    })
  }
  
  // Only return max 1 email per week to avoid spam
  return { emails: emails.slice(0, 1) }
}
