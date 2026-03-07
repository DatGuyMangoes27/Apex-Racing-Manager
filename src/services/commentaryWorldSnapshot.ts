export interface CommentaryWorldSnapshotTeam {
  id: string
  name: string
  shortName?: string
  points: number
  wins: number
  avgFinish?: number
  trend?: 'rising' | 'stable' | 'falling'
  reliabilityRisk?: 'low' | 'moderate' | 'high'
  sponsorPressure?: 'none' | 'low' | 'moderate' | 'high'
}

export interface CommentaryWorldSnapshotDriver {
  id: string
  name: string
  teamId?: string
  teamName?: string
  points?: number
  wins?: number
  recentForm?: string
  rivalryIntensity?: number
}

export interface CommentaryWorldSnapshot {
  generatedAt: string
  seriesId?: string
  seriesName?: string
  currentRound: number
  totalRounds: number
  racesRemaining: number
  titleFightStatus?: string
  teamCount: number
  driverCount: number
  teams: CommentaryWorldSnapshotTeam[]
  drivers: CommentaryWorldSnapshotDriver[]
  coverageLanes: {
    frontRunners: string[]
    midfield: string[]
    underdogs: string[]
  }
  marketSignals: {
    activeSponsors: number
    sponsorsAtRisk: number
    budgetPressure: 'none' | 'low' | 'moderate' | 'high'
    boardPressure?: number
  }
}

interface BuildCommentaryWorldSnapshotInput {
  seriesId?: string
  seriesName?: string
  currentRound?: number
  totalRounds?: number
  racesRemaining?: number
  titleFightStatus?: string
  standings?: Array<{
    position?: number
    driverName?: string
    teamName?: string
    points?: number
    wins?: number
    avgFinish?: number
  }>
  teams?: Array<{
    id?: string
    name?: string
    shortName?: string
    performanceTrend?: 'rising' | 'stable' | 'falling'
    narrative?: {
      recentForm?: string
    }
  }>
  drivers?: Array<{
    id?: string
    firstName?: string
    lastName?: string
    currentTeamId?: string
    currentTeamName?: string
    totalWins?: number
    rivalryIntensity?: number
    narrative?: {
      recentForm?: string
    }
  }>
  sponsorDeals?: Array<{
    active?: boolean
    satisfaction?: number
  }>
  ownedTeam?: {
    boardMood?: number
    budgets?: {
      runwayWeeks?: number
    }
  }
}

function toBudgetPressure(runwayWeeks?: number): 'none' | 'low' | 'moderate' | 'high' {
  if (typeof runwayWeeks !== 'number') return 'none'
  if (runwayWeeks <= 2) return 'high'
  if (runwayWeeks <= 6) return 'moderate'
  if (runwayWeeks <= 12) return 'low'
  return 'none'
}

function toReliabilityRisk(avgFinish?: number): 'low' | 'moderate' | 'high' {
  if (typeof avgFinish !== 'number') return 'moderate'
  if (avgFinish <= 6) return 'low'
  if (avgFinish <= 12) return 'moderate'
  return 'high'
}

export function buildCommentaryWorldSnapshot(
  input: BuildCommentaryWorldSnapshotInput
): CommentaryWorldSnapshot {
  const standings = input.standings || []
  const standingsByTeam = new Map<
    string,
    {
      points: number
      wins: number
      finishAccumulator: number
      finishCount: number
    }
  >()

  for (const row of standings) {
    const teamName = row.teamName || 'Unknown Team'
    const aggregate = standingsByTeam.get(teamName) || {
      points: 0,
      wins: 0,
      finishAccumulator: 0,
      finishCount: 0,
    }
    aggregate.points += row.points || 0
    aggregate.wins += row.wins || 0
    if (typeof row.avgFinish === 'number' && Number.isFinite(row.avgFinish)) {
      aggregate.finishAccumulator += row.avgFinish
      aggregate.finishCount += 1
    }
    standingsByTeam.set(teamName, aggregate)
  }

  const teamsByName = new Map((input.teams || []).map((team) => [team.name || 'Unknown Team', team]))
  const teams: CommentaryWorldSnapshotTeam[] = Array.from(standingsByTeam.entries())
    .map(([teamName, aggregate]) => {
      const sourceTeam = teamsByName.get(teamName)
      const avgFinish = aggregate.finishCount > 0 ? aggregate.finishAccumulator / aggregate.finishCount : undefined
      return {
        id: sourceTeam?.id || teamName,
        name: teamName,
        shortName: sourceTeam?.shortName,
        points: aggregate.points,
        wins: aggregate.wins,
        avgFinish: avgFinish ? Math.round(avgFinish * 10) / 10 : undefined,
        trend: sourceTeam?.performanceTrend || 'stable',
        reliabilityRisk: toReliabilityRisk(avgFinish),
        sponsorPressure: 'none',
      }
    })
    .sort((a, b) => b.points - a.points)

  const drivers: CommentaryWorldSnapshotDriver[] = (input.drivers || []).map((driver) => {
    const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim()
    const standing = standings.find((row) => row.driverName === name)
    return {
      id: driver.id || name || 'unknown-driver',
      name: name || 'Unknown Driver',
      teamId: driver.currentTeamId,
      teamName: driver.currentTeamName || standing?.teamName,
      points: standing?.points || 0,
      wins: standing?.wins || driver.totalWins || 0,
      recentForm: driver.narrative?.recentForm,
      rivalryIntensity: driver.rivalryIntensity,
    }
  })

  const frontRunners = teams.slice(0, 3).map((team) => team.name)
  const midfield = teams.slice(3, 8).map((team) => team.name)
  const underdogs = teams.slice(8).map((team) => team.name)

  const activeSponsors = (input.sponsorDeals || []).filter((deal) => deal.active !== false)
  const sponsorsAtRisk = activeSponsors.filter((deal) => (deal.satisfaction ?? 70) < 40).length
  const sponsorPressure =
    activeSponsors.length === 0
      ? 'none'
      : sponsorsAtRisk / activeSponsors.length >= 0.5
        ? 'high'
        : sponsorsAtRisk > 0
          ? 'moderate'
          : 'low'

  return {
    generatedAt: new Date().toISOString(),
    seriesId: input.seriesId,
    seriesName: input.seriesName,
    currentRound: input.currentRound || 0,
    totalRounds: input.totalRounds || 0,
    racesRemaining: input.racesRemaining || 0,
    titleFightStatus: input.titleFightStatus,
    teamCount: teams.length,
    driverCount: drivers.length,
    teams: teams.map((team) => ({ ...team, sponsorPressure })),
    drivers,
    coverageLanes: {
      frontRunners,
      midfield,
      underdogs,
    },
    marketSignals: {
      activeSponsors: activeSponsors.length,
      sponsorsAtRisk,
      budgetPressure: toBudgetPressure(input.ownedTeam?.budgets?.runwayWeeks),
      boardPressure: input.ownedTeam?.boardMood,
    },
  }
}
