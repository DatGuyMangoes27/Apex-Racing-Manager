/**
 * Season Narrative Generator
 * 
 * Scans race history, financial data, and career events to generate
 * a "Story of Your Season" — 3-5 narrative bullet points highlighting
 * the most memorable moments of the player's season.
 */

import { RaceResult, PlayerDriver, CareerState, SeasonSummary } from '@/store/careerStore'

export interface SeasonStoryMoment {
  id: string
  icon: string           // Emoji icon
  text: string           // Narrative text
  category: 'racing' | 'financial' | 'personal' | 'rivalry' | 'milestone'
  importance: number     // 1-10, higher = more important
}

interface SeasonNarrativeContext {
  player: PlayerDriver
  careerState: CareerState
  summary: SeasonSummary
  seasonRaces: RaceResult[]    // All races from this season
}

/**
 * Generate the season's story moments, sorted by importance
 */
export function generateSeasonStory(context: SeasonNarrativeContext): SeasonStoryMoment[] {
  const moments: SeasonStoryMoment[] = []
  const { player, careerState, summary, seasonRaces } = context

  if (seasonRaces.length === 0) return moments

  // ============================================
  // RACING MOMENTS
  // ============================================

  // First ever win
  const allWinsBeforeSeason = player.raceHistory.filter(
    r => r.racePosition === 1 && !seasonRaces.includes(r)
  )
  const firstWinThisSeason = seasonRaces.find(r => r.racePosition === 1)
  if (firstWinThisSeason && allWinsBeforeSeason.length === 0) {
    moments.push({
      id: 'first_ever_win',
      icon: '🏆',
      text: `This was the season you took your first ever victory — at ${firstWinThisSeason.trackName}${firstWinThisSeason.wasWet ? ' in the rain' : ''}!`,
      category: 'racing',
      importance: 10
    })
  }

  // Best race (biggest qualifying to race gain)
  const bestGainer = seasonRaces
    .filter(r => !r.dnf && r.qualifyingPosition > r.racePosition)
    .sort((a, b) => (b.qualifyingPosition - b.racePosition) - (a.qualifyingPosition - a.racePosition))[0]
  
  if (bestGainer && (bestGainer.qualifyingPosition - bestGainer.racePosition) >= 5) {
    moments.push({
      id: 'best_comeback',
      icon: '🚀',
      text: `Your drive from P${bestGainer.qualifyingPosition} to P${bestGainer.racePosition} at ${bestGainer.trackName} was the comeback of the season.`,
      category: 'racing',
      importance: 7
    })
  }

  // Worst race (biggest drop from qualifying)
  const worstDrop = seasonRaces
    .filter(r => !r.dnf && r.racePosition > r.qualifyingPosition)
    .sort((a, b) => (b.racePosition - b.qualifyingPosition) - (a.racePosition - a.qualifyingPosition))[0]
  
  if (worstDrop && (worstDrop.racePosition - worstDrop.qualifyingPosition) >= 5) {
    moments.push({
      id: 'worst_drop',
      icon: '😤',
      text: `Things went wrong at ${worstDrop.trackName} — qualifying P${worstDrop.qualifyingPosition} but finishing P${worstDrop.racePosition} was a weekend to forget.`,
      category: 'racing',
      importance: 5
    })
  }

  // DNF drama
  const dnfs = seasonRaces.filter(r => r.dnf)
  if (dnfs.length >= 3) {
    moments.push({
      id: 'dnf_plague',
      icon: '💥',
      text: `Reliability was a nightmare — ${dnfs.length} retirements cost you dearly, including ${dnfs[0].trackName} and ${dnfs[1].trackName}.`,
      category: 'racing',
      importance: 7
    })
  } else if (dnfs.length === 1) {
    moments.push({
      id: 'single_dnf',
      icon: '💥',
      text: `A retirement at ${dnfs[0].trackName} was the only blemish on an otherwise clean season.`,
      category: 'racing',
      importance: 4
    })
  }

  // Win streak
  let longestWinStreak = 0
  let currentStreak = 0
  let streakStart = ''
  let streakEnd = ''
  let bestStreakStart = ''
  let bestStreakEnd = ''
  
  for (const race of seasonRaces) {
    if (race.racePosition === 1 && !race.dnf) {
      currentStreak++
      if (currentStreak === 1) streakStart = race.trackName
      streakEnd = race.trackName
      if (currentStreak > longestWinStreak) {
        longestWinStreak = currentStreak
        bestStreakStart = streakStart
        bestStreakEnd = streakEnd
      }
    } else {
      currentStreak = 0
    }
  }

  if (longestWinStreak >= 3) {
    moments.push({
      id: 'win_streak',
      icon: '🔥',
      text: `A dominant ${longestWinStreak}-race winning streak from ${bestStreakStart} to ${bestStreakEnd} left the competition stunned.`,
      category: 'racing',
      importance: 9
    })
  }

  // Podium streak
  let longestPodiumStreak = 0
  let podiumStreakCount = 0
  for (const race of seasonRaces) {
    if (race.racePosition <= 3 && !race.dnf) {
      podiumStreakCount++
      longestPodiumStreak = Math.max(longestPodiumStreak, podiumStreakCount)
    } else {
      podiumStreakCount = 0
    }
  }
  if (longestPodiumStreak >= 5 && longestWinStreak < 3) {
    moments.push({
      id: 'podium_streak',
      icon: '🥇',
      text: `Consistency was your weapon — ${longestPodiumStreak} consecutive podium finishes showed true championship form.`,
      category: 'racing',
      importance: 7
    })
  }

  // Wet weather specialist
  const wetRaces = seasonRaces.filter(r => r.wasWet)
  const wetWins = wetRaces.filter(r => r.racePosition === 1)
  if (wetWins.length >= 2) {
    moments.push({
      id: 'rain_master',
      icon: '🌧️',
      text: `You proved to be a rain master — ${wetWins.length} wins in wet conditions at ${wetWins.map(r => r.trackName).join(' and ')}.`,
      category: 'racing',
      importance: 6
    })
  }

  // Fastest laps
  const fastestLaps = seasonRaces.filter(r => r.fastestLap)
  if (fastestLaps.length >= 3) {
    moments.push({
      id: 'speed_demon',
      icon: '⚡',
      text: `Raw pace was never in question — you set ${fastestLaps.length} fastest laps across the season.`,
      category: 'racing',
      importance: 5
    })
  }

  // ============================================
  // CHAMPIONSHIP NARRATIVE
  // ============================================

  if (summary.isChampion) {
    if (summary.wins >= summary.races * 0.5) {
      moments.push({
        id: 'dominant_champion',
        icon: '👑',
        text: `A dominant championship campaign — winning ${summary.wins} of ${summary.races} races to take the title by sheer force.`,
        category: 'racing',
        importance: 10
      })
    } else if (summary.wins <= 2) {
      moments.push({
        id: 'consistency_champion',
        icon: '👑',
        text: `The title was won through sheer consistency — ${summary.podiums} podiums and relentless points-scoring made the difference.`,
        category: 'racing',
        importance: 10
      })
    }
  } else if (summary.finalPosition === 2) {
    moments.push({
      id: 'so_close',
      icon: '😢',
      text: `So close yet so far — P2 in the championship. The lessons learned this season will fuel next year's title bid.`,
      category: 'racing',
      importance: 8
    })
  }

  // ============================================
  // FINANCIAL MOMENTS
  // ============================================

  const teamCash = careerState.ownedTeam?.budgets?.cash ?? 0
  const totalPrizeMoney = summary.prizeMoney

  // Big earner
  if (totalPrizeMoney > 200000) {
    moments.push({
      id: 'big_earner',
      icon: '💰',
      text: `A lucrative season — $${(totalPrizeMoney / 1000).toFixed(0)}k in prize money alone kept the team's coffers healthy.`,
      category: 'financial',
      importance: 4
    })
  }

  // Near bankruptcy (low team cash)
  if (teamCash < 50000 && teamCash > 0) {
    moments.push({
      id: 'financial_tightrope',
      icon: '📉',
      text: `Finances were tight all season — you ended with just $${teamCash.toLocaleString()} in the team budget. Survival was an achievement in itself.`,
      category: 'financial',
      importance: 6
    })
  }

  // Sponsor count
  const activeSponsors = player.finances.sponsorDeals.filter(d => d.active)
  if (activeSponsors.length >= 3) {
    moments.push({
      id: 'sponsor_magnet',
      icon: '🤝',
      text: `Your growing reputation attracted ${activeSponsors.length} sponsors — the commercial side of the team is thriving.`,
      category: 'financial',
      importance: 3
    })
  }

  // ============================================
  // MILESTONE MOMENTS
  // ============================================

  // Career total race milestone crossed this season
  const racesBeforeSeason = player.totalRaces - seasonRaces.length
  const raceMilestones = [100, 50, 25, 10]
  for (const milestone of raceMilestones) {
    if (racesBeforeSeason < milestone && player.totalRaces >= milestone) {
      moments.push({
        id: `milestone_${milestone}_races`,
        icon: '🎯',
        text: `You reached ${milestone} career races this season — a significant milestone in your racing journey.`,
        category: 'milestone',
        importance: milestone >= 50 ? 6 : 4
      })
      break // Only show the biggest milestone
    }
  }

  // Championship count milestone
  if (summary.isChampion) {
    if (player.championships === 1) {
      moments.push({
        id: 'first_championship',
        icon: '🏅',
        text: `Your first ever championship! This is just the beginning.`,
        category: 'milestone',
        importance: 10
      })
    } else if (player.championships === 3) {
      moments.push({
        id: 'triple_champion',
        icon: '🏅',
        text: `Three-time champion. You're building a legacy that will be remembered.`,
        category: 'milestone',
        importance: 9
      })
    } else if (player.championships === 5) {
      moments.push({
        id: 'five_championships',
        icon: '🏅',
        text: `Five championships. You've entered the all-time greats conversation.`,
        category: 'milestone',
        importance: 10
      })
    }
  }

  // Perfect season (all podiums, no DNFs)
  const allPodiums = seasonRaces.every(r => r.racePosition <= 3 && !r.dnf)
  if (allPodiums && seasonRaces.length >= 5) {
    moments.push({
      id: 'perfect_season',
      icon: '✨',
      text: `A perfect season — every single race finished on the podium. Extraordinary consistency.`,
      category: 'racing',
      importance: 10
    })
  }

  // ============================================
  // PERSONAL LIFE MOMENTS (if data available)
  // ============================================
  
  const personalLife = careerState.personalLife
  if (personalLife) {
    // Partner events
    if (personalLife.partner?.relationshipStatus === 'married' && personalLife.partner?.marriageDate) {
      // Check if marriage happened this season (rough check)
      const marriageYear = personalLife.partner.marriageDate.year
      if (marriageYear === summary.year) {
        moments.push({
          id: 'got_married',
          icon: '💍',
          text: `Off the track, you married ${personalLife.partner.firstName} ${personalLife.partner.lastName} — balancing racing and personal life like a champion.`,
          category: 'personal',
          importance: 8
        })
      }
    }
    
    // Children
    if (personalLife.children && personalLife.children.length > 0) {
      const newChildren = personalLife.children.filter((c: any) => c.birthYear === summary.year)
      if (newChildren.length > 0) {
        moments.push({
          id: 'new_child',
          icon: '👶',
          text: `The biggest win of the year wasn't on track — you became a parent.`,
          category: 'personal',
          importance: 9
        })
      }
    }
  }

  // ============================================
  // Sort by importance and return top 5
  // ============================================
  return moments
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
}
