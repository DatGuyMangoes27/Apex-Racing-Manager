/**
 * Julia's Weekly Briefing Card — Premium dark glass design
 * PA briefing with avatar glow, scannable bullet points, and CTA.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Zap } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

interface BriefingLine {
  text: string
  path?: string
  urgency: 'normal' | 'warning' | 'good'
}

function buildBriefing(
  careerState: NonNullable<ReturnType<typeof useCareerStore>['careerState']>,
  player: NonNullable<ReturnType<typeof useCareerStore>['player']>,
  standings: Array<{ isPlayer?: boolean; points: number; name?: string; driverName?: string }> | null
): { greeting: string; callToAction: string | null; callToActionPath: string | null; lines: BriefingLine[] } {
  const lines: BriefingLine[] = []
  const week = careerState.currentWeek
  const teamCash = careerState.ownedTeam?.budgets?.cash ?? 0

  // ── RACE CONTEXT
  let nextRaceWeek: number | null = null
  let nextRaceName: string | null = null
  const seriesEntries = careerState.seriesEntries || []
  for (const entry of seriesEntries) {
    const cal = (entry as any).calendar || []
    const upcoming = cal.find((r: any) => r.week >= week)
    if (upcoming) {
      if (nextRaceWeek === null || upcoming.week < nextRaceWeek) {
        nextRaceWeek = upcoming.week
        nextRaceName = upcoming.trackName || upcoming.name || null
      }
    }
  }

  const weeksToRace = nextRaceWeek !== null ? nextRaceWeek - week : null
  if (weeksToRace === 0) {
    lines.push({ text: `Race weekend — ${nextRaceName ?? 'track'}. Time to perform.`, urgency: 'good', path: '/race-day' })
  } else if (weeksToRace === 1) {
    lines.push({ text: `Race at ${nextRaceName ?? 'the next round'} is next week.`, urgency: 'warning', path: '/race-day' })
  } else if (weeksToRace !== null && weeksToRace <= 3) {
    lines.push({ text: `${weeksToRace} weeks until ${nextRaceName ?? 'your next race'}.`, urgency: 'normal' })
  }

  // ── CHAMPIONSHIP POSITION
  if (standings && standings.length > 1) {
    const playerIdx = standings.findIndex(s => s.isPlayer)
    if (playerIdx >= 0) {
      const pos = playerIdx + 1
      const leader = standings[0]
      const playerPts = standings[playerIdx].points
      const leaderPts = leader.points
      const gap = leaderPts - playerPts

      if (pos === 1) {
        const chaser = standings[1]
        const lead = playerPts - chaser.points
        lines.push({ text: `Championship leader — ${lead} points clear.`, urgency: 'good', path: '/paddock' })
      } else if (pos <= 3) {
        lines.push({ text: `P${pos} in the championship, ${gap} points off the lead.`, urgency: 'normal', path: '/paddock' })
      } else {
        lines.push({ text: `P${pos} in the standings — ${gap} points behind the leader.`, urgency: 'normal', path: '/paddock' })
      }
    }
  }

  // ── FINANCES
  if (teamCash < 0) {
    lines.push({ text: `Team bank is in the red (${teamCash < 0 ? '-' : ''}$${Math.abs(teamCash).toLocaleString()}). Urgent.`, urgency: 'warning', path: '/finances' })
  } else if (teamCash < 50000) {
    lines.push({ text: `Team cash running low — $${teamCash.toLocaleString()} remaining.`, urgency: 'warning', path: '/finances' })
  } else {
    lines.push({ text: `Team finances healthy at $${teamCash.toLocaleString()}.`, urgency: 'good' })
  }

  // ── SPONSORS
  const sponsors = (careerState.ownedTeam?.finances?.sponsors || []) as Array<{ active?: boolean; satisfaction?: number; name?: string; expiresWeek?: number }>
  const activeSponsors = sponsors.filter(s => s.active)
  const expiringSoon = activeSponsors.filter(s => s.expiresWeek && s.expiresWeek - week <= 3 && s.expiresWeek >= week)
  const unhappy = activeSponsors.filter(s => typeof s.satisfaction === 'number' && s.satisfaction < 40)

  if (expiringSoon.length > 0) {
    const names = expiringSoon.map(s => s.name).join(', ')
    lines.push({ text: `${names} contract${expiringSoon.length > 1 ? 's' : ''} expiring soon — worth a conversation.`, urgency: 'warning', path: '/sponsor-market' })
  } else if (unhappy.length > 0) {
    lines.push({ text: `${unhappy[0].name} satisfaction is low. Check in soon.`, urgency: 'warning', path: '/sponsor-market' })
  }

  // ── DECISIONS IN INBOX
  const decisionEmails = (careerState.emails || []).filter(
    e => !e.read && !e.archived && (
      e.actionType === 'accept_decline' ||
      e.actionType === 'review_counter' ||
      e.actionType === 'delegation_approval'
    )
  )
  if (decisionEmails.length > 0) {
    lines.push({
      text: `${decisionEmails.length} decision${decisionEmails.length > 1 ? 's' : ''} waiting in your inbox.`,
      urgency: 'warning',
      path: '/emails'
    })
  }

  // ── GREETING
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const greeting = `${timeOfDay}, boss.`

  // ── CALL TO ACTION
  let callToAction: string | null = null
  let callToActionPath: string | null = null

  if (decisionEmails.length > 0) {
    callToAction = `${decisionEmails.length} decision${decisionEmails.length > 1 ? 's' : ''} need${decisionEmails.length === 1 ? 's' : ''} your call`
    callToActionPath = '/emails'
  } else if (teamCash < 0) {
    callToAction = 'Team finances need attention'
    callToActionPath = '/finances'
  } else if (expiringSoon.length > 0) {
    callToAction = `${expiringSoon[0].name} contract expiring — act now`
    callToActionPath = '/sponsor-market'
  } else if (weeksToRace === 0) {
    callToAction = "It's race day — head to the paddock"
    callToActionPath = '/race-day'
  } else if (weeksToRace === 1) {
    callToAction = 'Race prep — check car readiness'
    callToActionPath = '/garage'
  } else if (!nextRaceWeek) {
    callToAction = 'No race scheduled — enter a series'
    callToActionPath = '/series-entry'
  }

  return { greeting, callToAction, callToActionPath, lines: lines.slice(0, 4) }
}

const urgencyColors: Record<BriefingLine['urgency'], { dot: string; text: string }> = {
  normal: { dot: 'bg-slate-500', text: 'text-slate-400' },
  warning: { dot: 'bg-orange-400', text: 'text-orange-400' },
  good: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
}

export function JuliaBriefingCard({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getStandings } = useRivalStore()

  const briefing = useMemo(() => {
    if (!careerState || !player) return null
    const standings = player.currentSeriesId ? getStandings(player.currentSeriesId) : null
    return buildBriefing(careerState, player, standings)
  }, [careerState, player, getStandings])

  if (!briefing) return null

  const displayLines = compact ? briefing.lines.slice(0, 2) : briefing.lines

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header bar with Julia avatar glow */}
      <div
        className={`flex items-center gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Avatar with glow */}
        <div className="relative">
          <div
            className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center flex-shrink-0`}
            style={{
              background: 'linear-gradient(135deg, rgba(225,6,0,0.7), rgba(255,128,0,0.7))',
              boxShadow: '0 0 16px rgba(225,6,0,0.3), 0 0 4px rgba(255,128,0,0.2)',
            }}
          >
            <Zap className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          {/* Online pulse dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#1e1e22]" />
        </div>

        <div className="flex-1 min-w-0">
          {compact ? (
            <p className="text-[10px] text-slate-500 font-medium truncate">{briefing.greeting}</p>
          ) : (
            <>
              <p className="text-xs font-display font-bold text-slate-300 tracking-wider uppercase">Julia Green</p>
              <p className="text-[10px] text-slate-500 font-medium">Personal Assistant</p>
            </>
          )}
        </div>
        {!compact && (
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-slate-500"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            W{careerState?.currentWeek}
          </span>
        )}
      </div>

      {/* Briefing content */}
      <div className={`${compact ? 'px-3 py-2 space-y-1.5' : 'px-4 py-3 space-y-2.5'}`}>
        {!compact && <p className="text-sm font-medium text-slate-300">{briefing.greeting}</p>}

        {displayLines.map((line, i) => {
          const colors = urgencyColors[line.urgency]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={line.path ? () => navigate(line.path!) : undefined}
              className={`flex items-start gap-2.5 ${line.path ? 'cursor-pointer group' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-[6px] flex-shrink-0 ${colors.dot}`} />
              <p className={`${compact ? 'text-[11px] leading-tight' : 'text-[13px] leading-snug'} ${colors.text} ${
                line.path ? 'group-hover:text-slate-200 transition-colors' : ''
              } ${compact ? 'line-clamp-1' : ''}`}>
                {line.text}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Call to action */}
      {briefing.callToAction && briefing.callToActionPath && (
        <button
          onClick={() => navigate(briefing.callToActionPath!)}
          className={`w-full flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'} group transition-colors`}
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(225,6,0,0.04)',
          }}
        >
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-display font-bold tracking-wide truncate`}
            style={{ color: '#E10600' }}
          >
            {briefing.callToAction}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}
    </motion.div>
  )
}
