export type NarrativeThreadState = 'seed' | 'build' | 'tension' | 'payoff' | 'cooldown'

export type NarrativeThreadType =
  | 'title_fight'
  | 'sponsor_pressure'
  | 'contract_watch'
  | 'team_momentum'
  | 'underdog_watch'

export interface NarrativeThread {
  id: string
  type: NarrativeThreadType
  state: NarrativeThreadState
  confidence: number
  startedRound: number
  updatedRound: number
  expiryRound: number
  entities: Array<{ type: string; id: string; name?: string }>
  payload?: Record<string, unknown>
}

export interface NarrativeThreadInput {
  currentRound?: number
  titleFightStatus?: string
  contractEndingSoon?: boolean
  sponsorPressureLevel?: 'none' | 'low' | 'moderate' | 'high'
  seasonAvgFinish?: number
  teamName?: string
  playerName?: string
  worldSnapshot?: {
    marketSignals?: {
      sponsorsAtRisk?: number
      budgetPressure?: 'none' | 'low' | 'moderate' | 'high'
    }
    coverageLanes?: {
      underdogs?: string[]
      frontRunners?: string[]
    }
  }
}

function toThreadState(score: number): NarrativeThreadState {
  if (score >= 85) return 'payoff'
  if (score >= 65) return 'tension'
  if (score >= 40) return 'build'
  return 'seed'
}

function clampConfidence(value: number): number {
  if (value < 0.35) return 0.35
  if (value > 0.98) return 0.98
  return Math.round(value * 100) / 100
}

function upsertThread(
  next: NarrativeThread[],
  existing: NarrativeThread[],
  incoming: Omit<NarrativeThread, 'state' | 'confidence' | 'updatedRound' | 'startedRound' | 'expiryRound'>,
  score: number,
  round: number
): void {
  const previous = existing.find((thread) => thread.id === incoming.id)
  const state = toThreadState(score)
  const confidence = clampConfidence(score / 100)

  if (!previous) {
    next.push({
      ...incoming,
      state,
      confidence,
      startedRound: round,
      updatedRound: round,
      expiryRound: round + 6,
    })
    return
  }

  next.push({
    ...previous,
    ...incoming,
    state,
    confidence,
    updatedRound: round,
    expiryRound: Math.max(previous.expiryRound, round + 5),
  })
}

export function evolveNarrativeThreads(
  existing: NarrativeThread[],
  input: NarrativeThreadInput
): NarrativeThread[] {
  const round = input.currentRound || 0
  const updated: NarrativeThread[] = []
  const teamId = input.teamName?.trim() || 'unknown-team'
  const playerId = input.playerName?.replace(/\s+/g, ' ').trim() || 'unknown-driver'

  // Title fight threads - at round 0/1, seed with lower intensity; after round 1, use full scoring
  if (round >= 1) {
    const titleFightScore =
      input.titleFightStatus === 'must_win'
        ? 90
        : input.titleFightStatus === 'close_battle'
          ? 75
          : input.titleFightStatus === 'leading'
            ? 55
            : round <= 1 ? 0 : 20
    if (titleFightScore >= 40) {
      upsertThread(
        updated,
        existing,
        {
          id: `title_fight:${playerId}`,
          type: 'title_fight',
          entities: [{ type: 'driver', id: playerId, name: playerId }],
          payload: { titleFightStatus: input.titleFightStatus },
        },
        titleFightScore,
        round
      )
    }
  }

  const sponsorRisk = input.worldSnapshot?.marketSignals?.sponsorsAtRisk ?? 0
  const sponsorPressureScore =
    input.sponsorPressureLevel === 'high'
      ? 88
      : input.sponsorPressureLevel === 'moderate'
        ? 66
        : sponsorRisk > 0
          ? 52
          : 0
  if (sponsorPressureScore >= 40) {
    upsertThread(
      updated,
      existing,
      {
        id: `sponsor_pressure:${teamId}`,
        type: 'sponsor_pressure',
        entities: [{ type: 'team', id: teamId, name: input.teamName }],
        payload: { sponsorPressureLevel: input.sponsorPressureLevel, sponsorsAtRisk: sponsorRisk },
      },
      sponsorPressureScore,
      round
    )
  }

  if (input.contractEndingSoon) {
    upsertThread(
      updated,
      existing,
      {
        id: `contract_watch:${playerId}`,
        type: 'contract_watch',
        entities: [{ type: 'driver', id: playerId, name: playerId }],
        payload: { contractEndingSoon: true },
      },
      72,
      round
    )
  }

  // Team momentum needs at least one round of data and a known team name
  if (round >= 1 && teamId !== 'unknown-team') {
    const seasonAvg = input.seasonAvgFinish ?? 10
    const momentumScore = seasonAvg <= 4 ? 80 : seasonAvg <= 7 ? 60 : seasonAvg >= 11 ? 70 : 35
    if (momentumScore >= 40) {
      upsertThread(
        updated,
        existing,
        {
          id: `team_momentum:${teamId}`,
          type: 'team_momentum',
          entities: [{ type: 'team', id: teamId, name: input.teamName }],
          payload: { seasonAvgFinish: input.seasonAvgFinish },
        },
        momentumScore,
        round
      )
    }
  }

  const underdogs = input.worldSnapshot?.coverageLanes?.underdogs || []
  if (underdogs.length > 0) {
    upsertThread(
      updated,
      existing,
      {
        id: `underdog_watch:${round}`,
        type: 'underdog_watch',
        entities: underdogs.slice(0, 3).map((team) => ({ type: 'team', id: team, name: team })),
        payload: { teams: underdogs.slice(0, 5) },
      },
      58,
      round
    )
  }

  const carriedForward = existing
    .filter((thread) => thread.expiryRound >= round && !updated.some((next) => next.id === thread.id))
    .map((thread) => {
      const staleRounds = round - thread.updatedRound
      if (staleRounds >= 3 && thread.state !== 'cooldown') {
        return {
          ...thread,
          state: 'cooldown' as NarrativeThreadState,
          updatedRound: round,
          expiryRound: round + 2,
          confidence: clampConfidence(thread.confidence * 0.85),
        }
      }
      return thread
    })

  return [...updated, ...carriedForward].slice(0, 16)
}

