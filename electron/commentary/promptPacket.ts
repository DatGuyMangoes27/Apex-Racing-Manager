import type { CommentaryEventType, EventContext } from './engine'

interface PromptPacketOptions {
  theme?: string
  topic?: string
}

export type CoverageLane =
  | 'player'
  | 'rival'
  | 'front_runner'
  | 'underdog'
  | 'midfield'
  | 'team_story'

const ACTION_EVENTS = new Set<string>([
  'OVERTAKE',
  'POSITION_LOST',
  'BATTLE_FORMING',
  'UNDER_PRESSURE',
  'GAP_CLOSING',
  'GAP_OPENING',
  'PRESSURE_BUILDING',
  'DEFENSIVE_DRIVING',
  'MOMENTUM_BUILDING',
  'RECOVERY_DRIVE',
  'CONSISTENCY_PRAISE',
  'FINAL_LAPS',
  'LEADER_GAP_CLOSING',
  'LEADER_GAP_OPENING',
  'LEADER_ATTACK_WINDOW',
  'LEADER_BATTLE_INTENSIFIES',
  'LEADER_ESCAPE',
])

const STRATEGY_EVENTS = new Set<string>([
  'PIT_ENTRY',
  'PIT_EXIT',
  'PIT_ACTIVITY',
  'WEATHER_CHANGE',
  'RAIN_INCOMING',
  'RAIN_INTENSIFYING',
  'TRACK_DRYING',
  'DAMAGE_REPORT',
  'ENGINE_WARNING',
  'AERO_DAMAGE',
])

const SEASON_EVENTS = new Set<string>([
  'COLOR_COMMENTARY',
  'TEAM_INFO',
  'DRIVER_BACKGROUND',
  'CHAMPIONSHIP_UPDATE',
  'RIVALRY_MENTION',
  'SPONSOR_PRESSURE_MENTION',
  'TEAM_PRESSURE_MENTION',
  'MEDIA_HEADLINE_CALLBACK',
  'RACE_WIN',
  'PODIUM_FINISH',
  'RACE_FINISH',
])

const FINISH_EVENTS = new Set<string>([
  'RACE_WIN',
  'PODIUM_FINISH',
  'RACE_FINISH',
  'SESSION_END',
])

const COVERAGE_HISTORY_SIZE = 4
const coverageHistory: CoverageLane[] = []

interface CoverageDirective {
  lane: CoverageLane
  target?: string
  instruction: string
}

export interface PromptPacketBuildResult {
  packet: string
  coverageLane: CoverageLane
  coverageTarget?: string
  threadTelemetry: {
    hasGuide: boolean
    activeStates: string[]
    stateCounts: Record<string, number>
    finishResolutionRule: boolean
    activePayoff: number
    activeCooldown: number
  }
}

function firstN<T>(list: T[] | undefined, n: number): T[] {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.slice(0, n)
}

function rankThreads(context: EventContext, limit: number) {
  const threads = context.narrativeThreads || []
  if (!Array.isArray(threads) || threads.length === 0) return []

  const stateWeight: Record<string, number> = {
    payoff: 4,
    tension: 3,
    build: 2,
    seed: 1,
    cooldown: 0,
  }

  return [...threads]
    .sort((a, b) => (stateWeight[b.state] || 0) - (stateWeight[a.state] || 0))
    .slice(0, Math.max(1, limit))
}

function threadTypeLabel(type: string): string {
  if (type === 'title_fight') return 'title fight'
  if (type === 'sponsor_pressure') return 'sponsor pressure'
  if (type === 'contract_watch') return 'contract watch'
  if (type === 'team_momentum') return 'team momentum'
  if (type === 'underdog_watch') return 'underdog watch'
  return type.replace(/_/g, ' ')
}

function trackCoverageLane(lane: CoverageLane): void {
  coverageHistory.push(lane)
  if (coverageHistory.length > COVERAGE_HISTORY_SIZE) {
    coverageHistory.shift()
  }
}

export function getCoverageHistorySnapshot(): CoverageLane[] {
  return [...coverageHistory]
}

export function setCoverageHistorySnapshot(history: Array<CoverageLane | string>): void {
  coverageHistory.length = 0
  const sanitized = history.filter((lane): lane is CoverageLane =>
    lane === 'player' ||
    lane === 'rival' ||
    lane === 'front_runner' ||
    lane === 'underdog' ||
    lane === 'midfield' ||
    lane === 'team_story'
  )
  const tail = sanitized.slice(-COVERAGE_HISTORY_SIZE)
  tail.forEach((lane) => coverageHistory.push(lane))
}

function weightedPick(weights: Array<{ lane: CoverageLane; weight: number }>): CoverageLane {
  const total = weights.reduce((acc, item) => acc + Math.max(0, item.weight), 0)
  if (total <= 0) return 'player'

  let roll = Math.random() * total
  for (const item of weights) {
    roll -= Math.max(0, item.weight)
    if (roll <= 0) return item.lane
  }
  return weights[weights.length - 1]?.lane || 'player'
}

function pickTargetForLane(lane: CoverageLane, context: EventContext): string | undefined {
  const world = context.worldSnapshot

  if (lane === 'player') return context.playerName
  if (lane === 'rival') return context.rivalName || context.overtakenDriver
  if (lane === 'team_story') {
    // Pick a random OTHER team for broadcast variety — real commentators don't only talk about one team
    const otherTeams = (context as any).teamNarratives?.filter((t: any) => t.name !== context.teamName) || []
    if (otherTeams.length > 0) {
      return otherTeams[Math.floor(Math.random() * otherTeams.length)].name
    }
    return context.teamName
  }

  if (!world) return undefined
  if (lane === 'front_runner') return world.coverageLanes.frontRunners[0]
  if (lane === 'underdog') return world.coverageLanes.underdogs[0]
  if (lane === 'midfield') return world.coverageLanes.midfield[0]
  return undefined
}

function chooseCoverageDirective(eventType: CommentaryEventType, context: EventContext): CoverageDirective {
  const world = context.worldSnapshot
  const hasWorld = Boolean(world)
  const hasRival = Boolean(context.rivalName || context.overtakenDriver)

  const hasDriverNarratives = (context as any).driverNarratives?.length > 0
  const baseWeights: Array<{ lane: CoverageLane; weight: number }> = [
    { lane: 'player', weight: 2.0 },
    { lane: 'rival', weight: hasRival ? 2.5 : 0 },
    { lane: 'front_runner', weight: hasWorld || hasDriverNarratives ? 2.5 : 0 },
    { lane: 'underdog', weight: hasWorld || hasDriverNarratives ? 2.2 : 0 },
    { lane: 'midfield', weight: hasWorld || hasDriverNarratives ? 2.0 : 0 },
    { lane: 'team_story', weight: context.teamName ? 1.8 : 0 },
  ]

  if (ACTION_EVENTS.has(eventType)) {
    baseWeights.forEach((item) => {
      if (item.lane === 'player') item.weight += 1.2
      if (item.lane === 'rival') item.weight += 0.8
      if (item.lane === 'front_runner') item.weight += 0.2
    })
  }

  if (STRATEGY_EVENTS.has(eventType)) {
    baseWeights.forEach((item) => {
      if (item.lane === 'team_story') item.weight += 0.9
      if (item.lane === 'front_runner') item.weight += 0.4
      if (item.lane === 'player') item.weight += 0.5
    })
  }

  if (SEASON_EVENTS.has(eventType)) {
    baseWeights.forEach((item) => {
      if (item.lane === 'front_runner') item.weight += 0.9
      if (item.lane === 'underdog') item.weight += 0.8
      if (item.lane === 'team_story') item.weight += 0.6
      if (item.lane === 'rival') item.weight += 0.5
    })
  }

  // Penalize recently used lanes to enforce rotation.
  const adjusted = baseWeights.map((item) => {
    const recencyPenalty = coverageHistory.reduce((penalty, lane, idx) => {
      if (lane !== item.lane) return penalty
      const distanceFromLatest = coverageHistory.length - 1 - idx
      return penalty + (distanceFromLatest === 0 ? 2.2 : distanceFromLatest === 1 ? 1.2 : 0.6)
    }, 0)
    return { lane: item.lane, weight: Math.max(0, item.weight - recencyPenalty) }
  })

  const lane = weightedPick(adjusted)
  trackCoverageLane(lane)
  const target = pickTargetForLane(lane, context)

  const noPlayerRule = lane !== 'player'
    ? ` DO NOT mention ${context.playerName} or their team in this line — keep the focus elsewhere.`
    : ''

  const instruction = lane === 'player'
    ? `Keep the camera anchored on ${context.playerName}, but still sound aware of the wider field.`
    : lane === 'rival'
    ? `Frame this as a duel storyline with ${target || 'the nearest rival'}.${noPlayerRule}`
    : lane === 'front_runner'
    ? `Briefly widen the lens to the front of the field${target ? `, especially ${target}` : ''}, then connect back naturally.${noPlayerRule}`
    : lane === 'underdog'
    ? `Include one underdog pulse${target ? ` around ${target}` : ''} to keep paddock depth in the call.${noPlayerRule}`
    : lane === 'midfield'
    ? `Reference midfield pressure${target ? ` featuring ${target}` : ''} for broadcast balance.${noPlayerRule}`
    : `Touch on team-side stakes${target ? ` for ${target}` : ''} (board/sponsor/trajectory) if it fits.${noPlayerRule}`

  return { lane, target, instruction }
}

export function buildThreadContinuitySummary(context: EventContext, limit = 4): string {
  const top = rankThreads(context, limit)

  if (top.length === 0) return ''

  const lines = top.map((thread) => {
    const entities = (thread.entities || [])
      .map((entity) => entity.name || entity.id)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
    return `- ${thread.type} [${thread.state}]${entities ? ` around ${entities}` : ''}`
  })

  return `SEASON CONTINUITY THREADS (persisted memory):\n${lines.join('\n')}`
}

export function buildThreadCallbackGuide(
  eventType: CommentaryEventType,
  context: EventContext,
  limit = 3
): string {
  const top = rankThreads(context, limit)
  if (top.length === 0) return ''

  const isFinish = FINISH_EVENTS.has(eventType)
  const lines: string[] = ['THREAD CALLBACK CUES (state-aware language):']

  top.forEach((thread) => {
    const entityNames = (thread.entities || [])
      .map((entity) => entity.name || entity.id)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ')
    const scope = entityNames || 'the paddock story'
    const threadLabel = threadTypeLabel(thread.type)

    if (thread.state === 'seed') {
      lines.push(`- [seed] ${threadLabel}: frame this as an early signal around ${scope}; avoid big conclusions.`)
      return
    }
    if (thread.state === 'build') {
      lines.push(`- [build] ${threadLabel}: connect this moment to a developing pattern around ${scope}.`)
      return
    }
    if (thread.state === 'tension') {
      if (isFinish) {
        // Promote tension to resolution language at session end — the arc must close
        lines.push(`- [tension→payoff] ${threadLabel}: the session ends with the tension around ${scope} unresolved — close the loop with a verdict or cliffhanger ("that question is answered today" / "we'll have to wait for the next round").`)
      } else {
        lines.push(`- [tension] ${threadLabel}: use pressure language around ${scope} (stakes rising, little margin left).`)
      }
      return
    }
    if (thread.state === 'payoff') {
      lines.push(
        isFinish
          ? `- [payoff] ${threadLabel}: close the loop around ${scope} with resolution phrasing ("that arc pays off today").`
          : `- [payoff] ${threadLabel}: identify this as the payoff beat around ${scope}, not just another update.`
      )
      return
    }
    lines.push(
      isFinish
        ? `- [cooldown] ${threadLabel}: acknowledge the pressure easing around ${scope} and what comes next.`
        : `- [cooldown] ${threadLabel}: treat this as aftershock/settling phase around ${scope}.`
    )
  })

  if (isFinish) {
    lines.push('- Resolution rule: resolve at least one active thread in your wording before sign-off.')
  } else {
    lines.push('- Continuity rule: tie this line to one thread state if relevant, then return to live action.')
  }

  return lines.join('\n')
}

function getThreadTelemetry(
  eventType: CommentaryEventType,
  context: EventContext,
  limit = 3
): PromptPacketBuildResult['threadTelemetry'] {
  const top = rankThreads(context, limit)
  const isFinish = FINISH_EVENTS.has(eventType)
  const stateCounts: Record<string, number> = {}
  top.forEach((thread) => {
    stateCounts[thread.state] = (stateCounts[thread.state] || 0) + 1
  })
  const activeStates = Object.keys(stateCounts)
  // For finish events, tension threads are promoted to effective payoff
  const activePayoff = (stateCounts.payoff || 0) + (isFinish ? (stateCounts.tension || 0) : 0)
  const activeCooldown = stateCounts.cooldown || 0
  return {
    hasGuide: top.length > 0,
    activeStates,
    stateCounts,
    finishResolutionRule: isFinish && top.length > 0,
    activePayoff,
    activeCooldown,
  }
}

export function buildPromptPacket(
  eventType: CommentaryEventType,
  context: EventContext,
  options: PromptPacketOptions = {}
): PromptPacketBuildResult {
  const coverage = chooseCoverageDirective(eventType, context)
  const lines: string[] = []

  lines.push(`PROMPT PACKET (relevance-filtered for ${eventType}):`)
  lines.push(`- Driver focus: ${context.playerName}`)
  lines.push(`- Track/session: ${context.trackName} / ${context.sessionType || 'Race'}`)
  if (context.playerPosition > 0) {
    lines.push(`- Core race state: P${context.playerPosition}, Lap ${context.currentLap}/${context.totalLaps}`)
  } else {
    lines.push(`- Session state: In pits / pre-session (no position yet), Lap ${context.currentLap}/${context.totalLaps}`)
  }
  lines.push(`- Producer coverage lane: ${coverage.lane}`)
  if (coverage.target) {
    lines.push(`- Coverage target: ${coverage.target}`)
  }
  lines.push(`- Coverage instruction: ${coverage.instruction}`)

  if (ACTION_EVENTS.has(eventType)) {
    if (context.gapAhead !== undefined) lines.push(`- Immediate attack gap: ${context.gapAhead.toFixed(1)}s`)
    if (context.gapBehind !== undefined) lines.push(`- Immediate defense gap: ${context.gapBehind.toFixed(1)}s`)
    if (context.overtakenDriver) lines.push(`- Active opponent in focus: ${context.overtakenDriver}`)
    if (context.rivalName) lines.push(`- Rival in this window: ${context.rivalName}`)
    if (context.momentumStatus) lines.push(`- Momentum status: ${context.momentumStatus}`)
    if (context.pressureStability) lines.push(`- Pressure handling: ${context.pressureStability}`)
  }

  if (STRATEGY_EVENTS.has(eventType)) {
    if (context.fuelLapsRemaining !== undefined) lines.push(`- Fuel horizon: ~${context.fuelLapsRemaining} laps`)
    if (context.weatherCondition) lines.push(`- Weather state: ${context.weatherCondition}`)
    if (context.weatherTrend) lines.push(`- Weather trend: ${context.weatherTrend}`)
    if (context.carHealthStatus) lines.push(`- Car health: ${context.carHealthStatus}`)
    if (context.maxTyreWear !== undefined) lines.push(`- Max tyre wear: ${(context.maxTyreWear * 100).toFixed(0)}%`)
  }

  if (SEASON_EVENTS.has(eventType)) {
    if (context.championshipPosition !== undefined) {
      lines.push(`- Championship standing: P${context.championshipPosition} (${context.championshipPoints || 0} pts)`)
    }
    if (context.titleFightStatus) lines.push(`- Title pressure: ${context.titleFightStatus}`)
    if (context.teamSatisfactionStatus) lines.push(`- Team mood: ${context.teamSatisfactionStatus}`)
    if (context.sponsorPressureLevel) lines.push(`- Sponsor pressure: ${context.sponsorPressureLevel}`)

    const topStandings = firstN(context.fullStandings, 3)
    if (topStandings.length > 0) {
      lines.push(`- Top standings snapshot:`)
      topStandings.forEach((entry) => {
        lines.push(`  * P${entry.position} ${entry.name} (${entry.points} pts)`)
      })
    }
  }

  const world = context.worldSnapshot
  if (world) {
    lines.push(`- World pulse: ${world.teamCount} teams, ${world.driverCount} drivers, ${world.racesRemaining} races left`)
    lines.push(`- Market pressure: sponsorsAtRisk=${world.marketSignals.sponsorsAtRisk}, budget=${world.marketSignals.budgetPressure}`)
    const laneTargets = firstN(world.coverageLanes.frontRunners, 2)
      .concat(firstN(world.coverageLanes.underdogs, 2))
      .filter(Boolean)
    if (laneTargets.length > 0) {
      lines.push(`- Coverage lanes now: ${laneTargets.join(', ')}`)
    }
  }

  const threadSummary = buildThreadContinuitySummary(context, 3)
  if (threadSummary) {
    lines.push(threadSummary)
  }
  const threadCallbacks = buildThreadCallbackGuide(eventType, context, 3)
  const threadTelemetry = getThreadTelemetry(eventType, context, 3)
  if (threadCallbacks) {
    lines.push(threadCallbacks)
  }

  if (options.theme) lines.push(`- Selected narrative theme: ${options.theme}`)
  if (options.topic) lines.push(`- Selected topic angle: ${options.topic}`)

  lines.push(`- Rule: use this packet as priority context; ignore unrelated data.`)

  return {
    packet: `${lines.join('\n')}\n`,
    coverageLane: coverage.lane,
    coverageTarget: coverage.target,
    threadTelemetry,
  }
}
