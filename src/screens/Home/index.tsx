import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCareerStore, getDayName } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { findTrackImageFromManifest, getTrackImage } from '@/utils/images'
import { getDriverPortrait } from '@/utils/generated-assets'
import { getLiveryImage, getCarClassImage } from '@/utils/images'
import {
  Calendar,
  Mail,
  Wrench,
  Beaker,
  SmilePlus,
  ChevronRight,
  Newspaper,
  Trophy,
  Target,
  TrendingUp,
  Heart,
  Play,
  Pause,
  Star,
  Plus,
  DollarSign,
  User,
  AlertCircle,
  Check,
  X,
  Clock,
  Megaphone,
  Users,
} from 'lucide-react'

// ============================================
// FIGMA-EXACT HOME PAGE — ALL REAL GAME DATA
// White theme · black borders · Arial Black font
// Fixed pixel dimensions · no responsive scaling
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

const CARD =
  'bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden'
const CARD_HEADER =
  'flex items-center border-b-[1.6px] border-black px-[16px]'

// ─── Helper: compute real calendar dates from week/year ──────────────────
function getWeekDates(week: number, year: number): number[] {
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay() || 7
  const mondayOfWeek1 = new Date(year, 0, 1 + (1 - jan1Day))
  const monday = new Date(mondayOfWeek1)
  monday.setDate(monday.getDate() + (week - 1) * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.getDate()
  })
}

function getMonthName(week: number, year: number): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay() || 7
  const mondayOfWeek1 = new Date(year, 0, 1 + (1 - jan1Day))
  const mid = new Date(mondayOfWeek1)
  mid.setDate(mid.getDate() + (week - 1) * 7 + 3)
  return months[mid.getMonth()]
}

// ─── Helper: format money ────────────────────────────────────────────────
function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ─── Helper: compute car health from part wear ───────────────────────────
function getCarHealth(car: { partWear?: Record<string, { condition?: number }> ; reliability?: number }): number {
  if (car.partWear) {
    const parts = Object.values(car.partWear)
    if (parts.length > 0) {
      const avg = parts.reduce((sum, p) => sum + (p?.condition ?? 100), 0) / parts.length
      return Math.round(avg)
    }
  }
  return car.reliability ?? 90
}

// ─── Helper: car status from service state ───────────────────────────────
function getCarStatus(car: { inService?: boolean }): string {
  return car.inService ? 'MAINT' : 'READY'
}

// ─── WEEK CALENDAR CARD ──────────────────────────────────────────────────
function WeekCalendar() {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()
  const { getSeriesById } = useRivalStore()
  const currentDay = careerState?.currentDay ?? 1
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2026

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const dates = getWeekDates(currentWeek, currentYear)
  const monthLabel = getMonthName(currentWeek, currentYear)

  const raceDaysThisWeek = useMemo(() => {
    if (!player || !careerState) return new Set<number>()
    const entries = careerState.seriesEntries ?? []
    const days = new Set<number>()
    for (const entry of entries) {
      const series = getSeriesById(entry.seriesId)
      const race = series?.calendar?.find((r: { week: number }) => r.week === currentWeek)
      if (race) {
        if (race.sessions?.practice) days.add(5)
        if (race.sessions?.qualifying) days.add(6)
        if (race.sessions?.race) days.add(7)
      }
    }
    return days
  }, [player, careerState, currentWeek, getSeriesById])

  const scheduledActivities = useMemo(() => {
    const acts = new Set<number>()
    const schedule = careerState?.weeklySchedule
    if (schedule) {
      for (let d = 1; d <= 7; d++) {
        const dayActs = (schedule as Record<string, unknown[]>)?.[String(d)]
        if (Array.isArray(dayActs) && dayActs.length > 0) acts.add(d)
      }
    }
    return acts
  }, [careerState?.weeklySchedule])

  return (
    <div className={CARD} style={{ height: 162, cursor: 'pointer' }} onClick={() => navigate('/calendar')}>
      <div className={`${CARD_HEADER} h-[52px] justify-between`}>
        <div className="flex items-center gap-[8px]">
          <Calendar className="w-[16px] h-[16px] text-black" />
          <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>
            WEEK {currentWeek}
          </span>
        </div>
        <span className="text-[12px] text-[#4a5565] leading-[16px]" style={FONT_REGULAR}>
          {monthLabel} {currentYear}
        </span>
      </div>

      <div className="flex items-stretch px-[12px] pt-[12px] pb-[12px] gap-[4px]">
        {dayNames.map((name, i) => {
          const dayNum = i + 1
          const dateNum = dates[i]
          const isCurrent = dayNum === currentDay
          const hasRace = raceDaysThisWeek.has(dayNum)
          const hasActivity = scheduledActivities.has(dayNum)
          const hasEvent = hasRace || hasActivity

          if (isCurrent) {
            return (
              <div
                key={name}
                className="flex-1 flex flex-col items-center gap-[4px] rounded-[10px] pt-[8px] px-[8px]"
                style={{
                  background: 'black',
                  boxShadow: '0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)',
                  minHeight: 81,
                }}
              >
                <span className="text-[9px] text-white tracking-[0.45px] leading-[13.5px] text-center" style={FONT_BLACK}>
                  {name}
                </span>
                <span className="text-[18px] text-white leading-[28px] text-center" style={FONT_BLACK}>
                  {dateNum}
                </span>
                {hasRace && (
                  <span className="text-[8px] text-white/80 text-center leading-[12px]" style={FONT_REGULAR}>
                    RACE
                  </span>
                )}
              </div>
            )
          }

          return (
            <div
              key={name}
              className={`flex-1 flex flex-col items-center gap-[4px] rounded-[10px] pt-[8px] px-[8px] ${
                hasEvent ? 'bg-[#f3f4f6] border-[1.6px] border-black' : 'bg-[#f9fafb]'
              }`}
              style={{ minHeight: 81 }}
            >
              <span className="text-[9px] text-black tracking-[0.45px] leading-[13.5px] text-center" style={FONT_BLACK}>
                {name}
              </span>
              <span className="text-[18px] text-black leading-[28px] text-center" style={FONT_BLACK}>
                {dateNum}
              </span>
              {hasRace && (
                <span className="text-[8px] text-black text-center leading-[12px]" style={FONT_REGULAR}>
                  RACE
                </span>
              )}
              {hasActivity && !hasRace && (
                <span className="text-[8px] text-black text-center leading-[12px]" style={FONT_REGULAR}>
                  BUSY
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── INBOX CARD ──────────────────────────────────────────────────────────
function InboxCard() {
  const { careerState, getUnreadEmailCount } = useCareerStore()
  const navigate = useNavigate()
  const unreadCount = getUnreadEmailCount()

  const emails = useMemo(() => {
    const inbox = careerState?.emails ?? []
    return inbox
      .filter((e: { read?: boolean; archived?: boolean }) => !e.read && !e.archived)
      .slice(0, 4)
      .map((e: { sender?: string; subject?: string; requiresAction?: boolean }) => ({
        sender: (e.sender ?? 'UNKNOWN').toUpperCase(),
        subject: e.subject ?? 'No subject',
        hasAction: !!e.requiresAction,
      }))
  }, [careerState?.emails])

  if (emails.length === 0) {
    return (
      <div className={`${CARD} flex-1 flex flex-col`}>
        <div className={`${CARD_HEADER} h-[56px] justify-between`}>
          <div className="flex items-center gap-[8px]">
            <Mail className="w-[16px] h-[16px] text-black" />
            <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>INBOX</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>No unread messages</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${CARD} flex-1 flex flex-col`} onClick={() => navigate('/emails')} style={{ cursor: 'pointer' }}>
      <div className={`${CARD_HEADER} h-[56px] justify-between`}>
        <div className="flex items-center gap-[8px]">
          <Mail className="w-[16px] h-[16px] text-black" />
          <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>INBOX</span>
        </div>
        <div className="bg-black rounded-full px-[8px] py-[4px]">
          <span className="text-[12px] text-white leading-[16px]" style={FONT_BLACK}>{unreadCount}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {emails.map((email, i) => (
          <div
            key={i}
            className={`bg-[#f9fafb] flex flex-col gap-[4px] px-[12px] pt-[12px] pb-[10px] ${
              i < emails.length - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-black leading-[16px] truncate" style={FONT_BLACK}>{email.sender}</span>
              {email.hasAction && <div className="w-[12px] h-[12px] rounded-full bg-red-500 shrink-0" />}
            </div>
            <span className="text-[12px] text-[#4a5565] leading-[16px] truncate" style={FONT_REGULAR}>{email.subject}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── OPERATIONS CARD ─────────────────────────────────────────────────────
function OperationsCard() {
  const { careerState } = useCareerStore()
  const team = careerState?.ownedTeam

  const reputation = Math.round(team?.reputation ?? 0)

  const rndProgress = useMemo(() => {
    const devBudget = team?.budgets?.developmentBudget ?? 0
    const cash = team?.budgets?.cash ?? 0
    if (cash <= 0) return 0
    return Math.min(100, Math.round((devBudget / Math.max(cash, 1)) * 100))
  }, [team?.budgets])

  const morale = Math.round(team?.teamMorale ?? 0)

  const bars = [
    { icon: Star, label: 'REPUTATION', value: reputation },
    { icon: Beaker, label: 'R&D', value: rndProgress },
    { icon: SmilePlus, label: 'MORALE', value: morale },
  ]

  return (
    <div className={CARD} style={{ height: 302 }}>
      <div className={`${CARD_HEADER} h-[52px] gap-[8px]`}>
        <Wrench className="w-[16px] h-[16px] text-black" />
        <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>OPERATIONS</span>
      </div>
      <div className="flex flex-col gap-[12px] p-[16px]">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="bg-[#f9fafb] border-[1.6px] border-[#e5e7eb] rounded-[14px] px-[14px] py-[14px] flex flex-col gap-[8px]"
            style={{ height: 63 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[8px]">
                <bar.icon className="w-[16px] h-[16px] text-black" />
                <span className="text-[12px] text-black leading-[16px]" style={FONT_BLACK}>{bar.label}</span>
              </div>
              <span className="text-[14px] text-black leading-[20px]" style={FONT_BLACK}>{bar.value}%</span>
            </div>
            <div className="bg-[#e5e7eb] h-[8px] rounded-full overflow-hidden">
              <div className="bg-black h-full rounded-full transition-all duration-500" style={{ width: `${bar.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shared hook: next race data ─────────────────────────────────────────
function useNextRace() {
  const { careerState, player } = useCareerStore()
  const { getSeriesById } = useRivalStore()

  return useMemo(() => {
    if (!player || !careerState) return null
    const entries = careerState.seriesEntries ?? []
    const seriesId = player.currentSeriesId || entries[0]?.seriesId
    if (!seriesId) return null
    const series = getSeriesById(seriesId)
    if (!series?.calendar) return null
    const currentWeek = careerState.currentWeek
    const currentDay = careerState.currentDay ?? 1
    const getRaceStartDay = (race: { sessions?: { practice?: boolean; qualifying?: boolean; race?: boolean } }): number => {
      const sessionDays: number[] = []
      if (race.sessions?.practice) sessionDays.push(5)
      if (race.sessions?.qualifying) sessionDays.push(6)
      if (race.sessions?.race) sessionDays.push(7)
      return sessionDays.length > 0 ? Math.min(...sessionDays) : 7
    }
    const nextRace = series.calendar.find((r: { week: number; sessions?: { practice?: boolean; qualifying?: boolean; race?: boolean } }) =>
      r.week > currentWeek || (r.week === currentWeek && currentDay <= getRaceStartDay(r))
    )
    if (!nextRace) return null
    const raceStartDay = getRaceStartDay(nextRace)
    const daysUntil = Math.max(0, (nextRace.week - currentWeek) * 7 + (raceStartDay - currentDay))
    const layout = nextRace.layoutName || ''
    const estimatedLaps = nextRace.lengthKm > 0 ? Math.round(300 / nextRace.lengthKm) : 0
    const difficulty = series.tier === 'tier_1' ? 'HARD' : series.tier === 'tier_2' ? 'MEDIUM' : series.tier === 'tier_3' ? 'MEDIUM' : 'EASY'
    return {
      trackId: nextRace.trackId,
      trackName: nextRace.trackName,
      layoutName: layout,
      country: nextRace.country,
      week: nextRace.week,
      round: nextRace.round,
      daysUntil,
      laps: estimatedLaps,
      prize: series.prizeMoney?.win ?? 0,
      difficulty,
      seriesName: series.name,
      lengthKm: nextRace.lengthKm,
    }
  }, [player, careerState, getSeriesById])
}

// ─── CONTINUE CAREER BAR ─────────────────────────────────────────────────
function ContinueCareerBar() {
  const navigate = useNavigate()
  const { careerState, startFastForwardToRaceWeek, stopFastForward } = useCareerStore()
  const race = useNextRace()
  const [motionPhase, setMotionPhase] = useState(0)

  const ff = careerState?.fastForward
  const isPlaying = ff?.isActive === true
  const stoppedOnDecision =
    !isPlaying &&
    ff?.lastStopReason === 'critical_event' &&
    !!ff?.lastStopMessage

  const title = race?.trackName?.toUpperCase() ?? 'NO UPCOMING RACE'
  const daysLabel = race ? `${race.daysUntil}D` : '--'

  const simulationProgress = useMemo(() => {
    if (!isPlaying || !ff || !careerState) return 0
    if (ff.startedWeek <= 0 || (ff.targetWeek ?? 0) <= 0) return 0

    const toDayIndex = (year: number, week: number, day: number): number =>
      year * 364 + week * 7 + day

    const started = toDayIndex(ff.startedYear, ff.startedWeek, ff.startedDay)
    const target = toDayIndex(ff.targetYear ?? careerState.currentYear, ff.targetWeek ?? careerState.currentWeek, ff.targetDay ?? 1)
    const current = toDayIndex(careerState.currentYear, careerState.currentWeek, careerState.currentDay ?? 1)

    const total = Math.max(1, target - started)
    const elapsed = Math.max(0, current - started)
    return Math.max(0, Math.min(1, elapsed / total))
  }, [
    isPlaying,
    ff?.startedYear,
    ff?.startedWeek,
    ff?.startedDay,
    ff?.targetYear,
    ff?.targetWeek,
    ff?.targetDay,
    careerState?.currentYear,
    careerState?.currentWeek,
    careerState?.currentDay
  ])

  useEffect(() => {
    if (!isPlaying) {
      setMotionPhase(0)
      return
    }
    const startedAt = performance.now()
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      setMotionPhase((elapsed % 1800) / 1800)
    }, 60)

    return () => window.clearInterval(intervalId)
  }, [isPlaying])

  const handleContinue = () => {
    if (race && race.daysUntil === 0) {
      navigate('/race-day')
      return
    }
    if (isPlaying) {
      stopFastForward('manual')
    } else {
      startFastForwardToRaceWeek()
    }
  }

  return (
    <div
      className={`relative rounded-[16px] overflow-hidden cursor-pointer transition-all ${isPlaying ? 'bg-gray-800' : 'bg-black hover:bg-gray-900'}`}
      style={{ height: 104, boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)' }}
      onClick={handleContinue}
    >
      <div className="flex items-center justify-between h-full px-[32px]">
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-[#99a1af] tracking-[1.2px] leading-[16px]" style={FONT_BLACK}>
            {race && race.daysUntil === 0
              ? 'RACE DAY'
              : isPlaying
              ? 'SIMULATING TO RACE...'
              : stoppedOnDecision
              ? 'PAUSED — DECISION REQUIRED'
              : `ADVANCE TO RACE`}
          </span>
          {stoppedOnDecision ? (
            <span className="text-[20px] text-[#f87171] leading-[28px]" style={FONT_BLACK}>
              {ff!.lastStopMessage}
            </span>
          ) : (
            <span className="text-[30px] text-white leading-[36px]" style={FONT_BLACK}>{title}</span>
          )}
        </div>
        <div className="flex items-center gap-[12px]">
          {!isPlaying && (
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-[#99a1af] leading-[16px]" style={FONT_REGULAR}>STARTS IN</span>
              <span className="text-[30px] text-white leading-[36px]" style={FONT_BLACK}>{daysLabel}</span>
            </div>
          )}
          {isPlaying ? (
            <div className="flex items-center gap-[10px]">
              <div className="flex gap-[3px] items-end">
                <div className="w-[4px] rounded-full bg-green-400 animate-pulse" style={{ height: 16 }} />
                <div className="w-[4px] rounded-full bg-green-400 animate-pulse" style={{ height: 24, animationDelay: '0.15s' }} />
                <div className="w-[4px] rounded-full bg-green-400 animate-pulse" style={{ height: 18, animationDelay: '0.3s' }} />
              </div>
              <Pause className="w-[32px] h-[32px] text-white fill-white" />
            </div>
          ) : (
            <Play className="w-[32px] h-[32px] text-white fill-white" />
          )}
        </div>
      </div>
      {isPlaying && (
        <div className="absolute left-0 right-0 bottom-0 h-[4px] bg-white/15">
          <div
            className="h-full bg-green-400 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(3, Math.round(simulationProgress * 100))}%` }}
          />
          <div
            className="absolute top-0 h-full w-[14%] bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ left: `${motionPhase * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── RACE IMAGE CARD ─────────────────────────────────────────────────────
function RaceImageCard() {
  const navigate = useNavigate()
  const race = useNextRace()

  const trackName = race?.trackName ?? 'NO RACE'
  const words = trackName.toUpperCase().split(' ')
  const mid = Math.ceil(words.length / 2)
  const firstLine = words.slice(0, mid).join(' ')
  const secondLine = words.slice(mid).join(' ')

  const trackImage = race ? findTrackImageFromManifest(race.trackName, race.layoutName) || getTrackImage(race.trackName, race.layoutName) : ''

  return (
    <div
      className="flex-1 rounded-[24px] border-[1.6px] border-black overflow-hidden relative cursor-pointer"
      style={{ boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)', minHeight: 500 }}
      onClick={() => navigate('/race-day')}
    >
      <div className="absolute inset-0">
        {trackImage ? (
          <img src={trackImage} alt={trackName} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-[24px]">
        <div>
          {race && (
            <div className="bg-white rounded-full inline-flex items-center gap-[8px] px-[16px] py-[8px] mb-[12px]">
              <Calendar className="w-[12px] h-[12px] text-black" />
              <span className="text-[12px] text-black tracking-[1.2px] leading-[16px]" style={FONT_BLACK}>
                ROUND {race.round} &bull; {race.daysUntil === 0 ? 'TODAY' : `${race.daysUntil} DAYS`}
              </span>
            </div>
          )}
          <div style={FONT_BLACK}>
            <p className="text-[72px] text-white leading-[72px] tracking-[-3.6px]">{firstLine}</p>
            {secondLine && <p className="text-[72px] text-white leading-[72px] tracking-[-3.6px]">{secondLine}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-[16px]">
          {race && (
            <div className="flex gap-[12px]">
              <div className="flex-1 bg-[rgba(255,255,255,0.9)] rounded-[14px] pt-[12px] px-[12px] pb-[10px]">
                <p className="text-[24px] text-black text-center leading-[32px]" style={FONT_BLACK}>{race.laps}</p>
                <p className="text-[10px] text-[#4a5565] text-center tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>LAPS</p>
              </div>
              <div className="flex-1 bg-[rgba(255,255,255,0.9)] rounded-[14px] pt-[12px] px-[12px] pb-[10px]">
                <p className="text-[24px] text-black text-center leading-[32px]" style={FONT_BLACK}>{formatMoney(race.prize)}</p>
                <p className="text-[10px] text-[#4a5565] text-center tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>PRIZE</p>
              </div>
              <div className="flex-1 bg-[rgba(255,255,255,0.9)] rounded-[14px] pt-[12px] px-[12px] pb-[10px]">
                <p className="text-[24px] text-black text-center leading-[32px]" style={FONT_BLACK}>{race.difficulty}</p>
                <p className="text-[10px] text-[#4a5565] text-center tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>DIFF</p>
              </div>
            </div>
          )}
          <div
            className="bg-white h-[56px] rounded-[14px] flex items-center justify-center gap-[8px] cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); navigate('/race-day') }}
          >
            <Play className="w-[20px] h-[20px] text-black" />
            <span className="text-[16px] text-black tracking-[0.4px] leading-[24px]" style={FONT_BLACK}>RACE DETAILS</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── YOUR FLEET CARD ─────────────────────────────────────────────────────
function FleetCard() {
  const { careerState } = useCareerStore()
  const navigate = useNavigate()

  const cars = useMemo(() => {
    const teamCars = careerState?.cars ?? []
    return teamCars.slice(0, 4).map((car: { carId: string; chassisId?: string; liveryName?: string; liveryPath?: string; inService?: boolean; partWear?: Record<string, { condition?: number }>; reliability?: number }) => {
      const imgPath = car.liveryPath
        || (car.chassisId && car.liveryName ? getLiveryImage(car.chassisId, car.liveryName) : '')
        || (car.chassisId ? getCarClassImage(car.chassisId) : '')
      return {
        id: car.carId,
        name: (car.liveryName || car.chassisId || car.carId).toUpperCase(),
        health: getCarHealth(car),
        status: getCarStatus(car),
        image: imgPath,
      }
    })
  }, [careerState?.cars])

  return (
    <div className={CARD} style={{ height: 168 }}>
      <div className={`${CARD_HEADER} h-[44px] justify-between`}>
        <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>YOUR FLEET</span>
        <button onClick={() => navigate('/garage')} className="flex items-center gap-[4px]">
          <span className="text-[12px] text-black tracking-[0.3px] leading-[16px]" style={FONT_BLACK}>VIEW ALL</span>
          <ChevronRight className="w-[12px] h-[12px] text-black" />
        </button>
      </div>
      <div className="flex items-center gap-[8px] px-[12px] py-[10px]">
        {cars.length === 0 && (
          <span className="text-[12px] text-[#4a5565] flex-1 text-center" style={FONT_REGULAR}>No cars yet</span>
        )}
        {cars.map((car) => (
          <div
            key={car.id}
            className="flex flex-col items-center gap-[4px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/garage')}
            style={{ width: 100 }}
          >
            <div className="bg-[#f3f4f6] border-[1.6px] border-[#e5e7eb] rounded-[10px] overflow-hidden w-[88px] h-[56px] flex items-center justify-center">
              {car.image ? (
                <img src={car.image} alt={car.name} className="w-full h-full object-contain p-[2px]" />
              ) : (
                <Wrench className="w-[20px] h-[20px] text-[#4a5565]" />
              )}
            </div>
            <p className="text-[9px] text-black leading-[13px] truncate w-full text-center" style={FONT_BLACK}>{car.name}</p>
            <div className="flex items-center gap-[4px]">
              <div className="w-[32px] h-[4px] rounded-full bg-[#e5e7eb] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${car.health}%`, background: car.health > 70 ? '#00a63e' : car.health > 40 ? '#eab308' : '#f54900' }}
                />
              </div>
              <span
                className="text-[8px] leading-[12px]"
                style={{ ...FONT_BLACK, color: car.status === 'READY' ? '#00a63e' : '#f54900' }}
              >
                {car.status}
              </span>
            </div>
          </div>
        ))}
        {/* +1 marketplace button */}
        <div
          className="flex flex-col items-center gap-[4px] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/marketplace')}
          style={{ width: 88 }}
        >
          <div className="bg-[#f9fafb] border-[1.6px] border-dashed border-[#d1d5dc] rounded-[10px] w-[88px] h-[56px] flex items-center justify-center hover:border-black transition-colors">
            <Plus className="w-[24px] h-[24px] text-[#4a5565]" />
          </div>
          <p className="text-[9px] text-[#4a5565] leading-[13px]" style={FONT_REGULAR}>BUY CAR</p>
        </div>
      </div>
    </div>
  )
}

// ─── QUICK STATS ROW ─────────────────────────────────────────────────────
function StatsRow() {
  const { careerState, player } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()

  const stats = useMemo(() => {
    const entries = careerState?.seriesEntries ?? []
    const seriesId = player?.currentSeriesId || entries[0]?.seriesId
    if (!seriesId) return { points: 0, rank: '--', podiums: 0 }

    const standings = getStandings(seriesId) ?? []
    const playerName = player ? `${player.firstName} ${player.lastName}` : ''
    const teamName = careerState?.ownedTeam?.name ?? ''

    let totalPoints = 0
    let totalPodiums = 0
    let rank = '--'

    const teamDriverIds = (careerState?.ownedTeam?.drivers ?? []).map((d: { driverId: string }) => d.driverId)
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i]
      if (s.teamName === teamName || teamDriverIds.includes(s.driverId) || s.driverName === playerName) {
        totalPoints += s.points
        totalPodiums += s.podiums
        if (rank === '--') rank = getOrdinal(i + 1)
      }
    }

    return { points: totalPoints, rank, podiums: totalPodiums }
  }, [careerState, player, getStandings])

  const morale = Math.round(careerState?.ownedTeam?.teamMorale ?? 0)

  const items = [
    { icon: Trophy, value: stats.points.toLocaleString(), label: 'PTS' },
    { icon: Target, value: stats.rank, label: 'RANK' },
    { icon: TrendingUp, value: String(stats.podiums), label: 'PODIUM' },
    { icon: Heart, value: `${morale}%`, label: 'MORALE' },
  ]

  return (
    <div className="flex gap-[12px]" style={{ height: 97 }}>
      {items.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] relative"
          style={{ boxShadow: '0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)' }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[12px]">
            <stat.icon className="w-[20px] h-[20px] text-black" />
          </div>
          <div className="absolute left-[12px] right-[12px] top-[36px] text-center">
            <span className="text-[24px] text-black leading-[32px]" style={FONT_BLACK}>{stat.value}</span>
          </div>
          <div className="absolute left-[12px] right-[12px] top-[68px] text-center">
            <span className="text-[9px] text-[#4a5565] tracking-[0.9px] leading-[13.5px]" style={FONT_REGULAR}>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ─── QUICK DECISIONS PANEL ───────────────────────────────────────────────
function QuickDecisionsPanel() {
  const { careerState, acceptOpportunity, declineOpportunity, approveDelegationAction } = useCareerStore()
  const navigate = useNavigate()

  const decisions = useMemo(() => {
    type Decision = {
      id: string
      type: 'opportunity' | 'delegation' | 'email'
      title: string
      subtitle: string
      urgency: string
      icon: typeof AlertCircle
    }
    const items: Decision[] = []
    const currentWeek = careerState?.currentWeek ?? 1
    const currentYear = careerState?.currentYear ?? 2026

    // Pending opportunities (only urgent windows)
    const opportunities = careerState?.pendingOpportunities ?? []
    for (const opp of opportunities.filter((o: { status: string }) => o.status === 'pending')) {
      const weeksLeft = (opp.expiresYear - currentYear) * 52 + (opp.expiresWeek - currentWeek)
      if (weeksLeft > 1) continue
      items.push({
        id: opp.instanceId,
        type: 'opportunity',
        title: opp.name ?? opp.title ?? 'Opportunity',
        subtitle: opp.description?.slice(0, 60) ?? '',
        urgency: weeksLeft <= 0 ? 'NOW' : weeksLeft === 1 ? '1W LEFT' : `${weeksLeft}W LEFT`,
        icon: Megaphone,
      })
    }

    // Pending delegation approvals (only urgent windows)
    const approvals = careerState?.ownedTeam?.pendingDelegationApprovals ?? []
    for (const approval of approvals) {
      const weeksLeft = (approval.expiresYear - currentYear) * 52 + (approval.expiresWeek - currentWeek)
      if (weeksLeft > 1) continue
      items.push({
        id: approval.id,
        type: 'delegation',
        title: `${approval.staffName}: ${approval.domain}`,
        subtitle: approval.description?.slice(0, 60) ?? '',
        urgency: weeksLeft <= 0 ? 'NOW' : weeksLeft === 1 ? '1W LEFT' : `${weeksLeft}W LEFT`,
        icon: Users,
      })
    }

    // Action-required unread emails (critical/high-impact only)
    const emails = careerState?.emails ?? []
    const actionEmails = emails
      .filter((e: { read?: boolean; archived?: boolean; requiresAction?: boolean; interruptClass?: string; actionType?: string }) =>
        !e.read &&
        !e.archived &&
        (
          e.interruptClass === 'critical' ||
          e.requiresAction ||
          e.actionType === 'accept_decline' ||
          e.actionType === 'review_counter' ||
          e.actionType === 'delegation_approval'
        )
      )
      .slice(0, 2)
    for (const email of actionEmails) {
      items.push({
        id: (email as { id: string }).id,
        type: 'email',
        title: (email as { sender?: string }).sender?.toUpperCase() ?? 'EMAIL',
        subtitle: (email as { subject?: string }).subject ?? 'Action required',
        urgency: 'ACTION',
        icon: Mail,
      })
    }

    return items.slice(0, 4)
  }, [careerState])

  if (decisions.length === 0) return null

  const handleAction = (decision: { id: string; type: string }, action: 'accept' | 'decline') => {
    if (decision.type === 'opportunity') {
      if (action === 'accept') {
        const week = careerState?.currentWeek ?? 1
        const day = careerState?.currentDay ?? 1
        acceptOpportunity(decision.id, week, day)
      } else {
        declineOpportunity(decision.id)
      }
    } else if (decision.type === 'delegation') {
      if (action === 'accept') {
        approveDelegationAction(decision.id)
      }
    } else if (decision.type === 'email') {
      navigate('/emails')
    }
  }

  return (
    <div className={`${CARD} flex-1 flex flex-col min-h-0`}>
      <div className={`${CARD_HEADER} h-[44px] gap-[8px] justify-between`}>
        <div className="flex items-center gap-[8px]">
          <AlertCircle className="w-[16px] h-[16px] text-black" />
          <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>DECISIONS</span>
        </div>
        <div className="bg-[#f54900] rounded-full px-[8px] py-[2px]">
          <span className="text-[11px] text-white leading-[16px]" style={FONT_BLACK}>{decisions.length}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {decisions.map((d, i) => (
          <div
            key={d.id}
            className={`flex items-center gap-[10px] px-[12px] py-[10px] ${
              i < decisions.length - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''
            }`}
          >
            <div className="bg-[#f3f4f6] border-[1.6px] border-[#e5e7eb] rounded-[10px] shrink-0 w-[36px] h-[36px] flex items-center justify-center">
              <d.icon className="w-[16px] h-[16px] text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-black leading-[16px] truncate" style={FONT_BLACK}>{d.title}</p>
              <p className="text-[10px] text-[#4a5565] leading-[14px] truncate" style={FONT_REGULAR}>{d.subtitle}</p>
            </div>
            <div className="flex items-center gap-[4px] shrink-0">
              <span
                className="text-[8px] px-[6px] py-[2px] rounded-full border-[0.8px]"
                style={{
                  ...FONT_BLACK,
                  color: d.urgency === 'NOW' || d.urgency === 'ACTION' ? '#f54900' : '#4a5565',
                  borderColor: d.urgency === 'NOW' || d.urgency === 'ACTION' ? '#f54900' : '#d1d5dc',
                  background: d.urgency === 'NOW' || d.urgency === 'ACTION' ? '#fef2f2' : '#f9fafb',
                }}
              >
                {d.urgency}
              </span>
              {d.type !== 'email' && (
                <>
                  <button
                    onClick={() => handleAction(d, 'accept')}
                    className="w-[26px] h-[26px] rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    <Check className="w-[14px] h-[14px] text-white" />
                  </button>
                  <button
                    onClick={() => handleAction(d, 'decline')}
                    className="w-[26px] h-[26px] rounded-full bg-[#f3f4f6] border-[1.6px] border-[#e5e7eb] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
                  >
                    <X className="w-[14px] h-[14px] text-black" />
                  </button>
                </>
              )}
              {d.type === 'email' && (
                <button
                  onClick={() => handleAction(d, 'accept')}
                  className="h-[26px] rounded-full bg-black flex items-center justify-center px-[10px] hover:bg-gray-800 transition-colors"
                >
                  <span className="text-[9px] text-white" style={FONT_BLACK}>OPEN</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── NEWS FEED CARD ──────────────────────────────────────────────────────
function NewsFeedCard() {
  const { careerState } = useCareerStore()

  const newsItems = useMemo(() => {
    const clippings = careerState?.pressClippings ?? []
    const socialPosts = careerState?.socialPosts ?? []
    const events = careerState?.events ?? []
    const currentWeek = careerState?.currentWeek ?? 1
    const currentYear = careerState?.currentYear ?? 2026

    type NewsItem = { title: string; time: string; tag: string; sentiment?: string; sortKey: number }
    const items: NewsItem[] = []

    // Press clippings (media-generated news)
    for (const clip of clippings.slice(-12)) {
      const weeksAgo = currentWeek - clip.week + (currentYear - clip.year) * 52
      const timeLabel = weeksAgo <= 0 ? 'Today' : weeksAgo === 1 ? '1w ago' : `${weeksAgo}w ago`
      items.push({
        title: clip.headline,
        time: timeLabel,
        tag: clip.outlet?.toUpperCase()?.slice(0, 8) ?? 'PRESS',
        sentiment: clip.sentiment,
        sortKey: clip.year * 100 + clip.week,
      })
    }

    // Social posts (media-generated content)
    for (const post of socialPosts.slice(-8)) {
      const weeksAgo = currentWeek - (post.week ?? 0) + (currentYear - (post.year ?? currentYear)) * 52
      const timeLabel = weeksAgo <= 0 ? 'Today' : weeksAgo === 1 ? '1w ago' : `${weeksAgo}w ago`
      items.push({
        title: (post as { content?: string }).content?.slice(0, 80) ?? 'Social post',
        time: timeLabel,
        tag: 'SOCIAL',
        sortKey: (post.year ?? currentYear) * 100 + (post.week ?? 0),
      })
    }

    // Global events as fallback
    for (const event of events.slice(-8)) {
      const ev = event as { type?: string; description?: string; week?: number; year?: number }
      const weeksAgo = currentWeek - (ev.week ?? 0) + (currentYear - (ev.year ?? currentYear)) * 52
      const timeLabel = weeksAgo <= 0 ? 'Today' : weeksAgo === 1 ? '1w ago' : `${weeksAgo}w ago`
      items.push({
        title: ev.description ?? ev.type ?? 'Event',
        time: timeLabel,
        tag: (ev.type ?? 'EVENT').toUpperCase().slice(0, 8),
        sortKey: (ev.year ?? currentYear) * 100 + (ev.week ?? 0),
      })
    }

    // Sort by most recent first, take top 6
    items.sort((a, b) => b.sortKey - a.sortKey)
    return items.slice(0, 6)
  }, [careerState?.pressClippings, careerState?.socialPosts, careerState?.events, careerState?.currentWeek, careerState?.currentYear])

  if (newsItems.length === 0) {
    return (
      <div className={`${CARD} flex-1 flex flex-col`}>
        <div className={`${CARD_HEADER} h-[52px] gap-[8px]`}>
          <Newspaper className="w-[16px] h-[16px] text-black" />
          <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>NEWS FEED</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>No news yet — advance a few days</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${CARD} flex-1 flex flex-col`}>
      <div className={`${CARD_HEADER} h-[52px] gap-[8px]`}>
        <Newspaper className="w-[16px] h-[16px] text-black" />
        <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>NEWS FEED</span>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {newsItems.map((item, i) => (
          <div
            key={i}
            className={`flex gap-[12px] px-[12px] pt-[12px] pb-[10px] ${
              i < newsItems.length - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''
            }`}
          >
            <div className="bg-[#f3f4f6] border-[1.6px] border-[#e5e7eb] rounded-[14px] overflow-hidden shrink-0 w-[64px] h-[64px] flex items-center justify-center">
              <Newspaper className="w-[24px] h-[24px] text-[#4a5565]" />
            </div>
            <div className="flex-1 flex flex-col gap-[4px] min-w-0">
              <span className="text-[12px] text-black leading-[16px] truncate" style={FONT_BLACK}>{item.title}</span>
              <div className="flex items-center gap-[8px]">
                <span className="text-[10px] text-[#4a5565] leading-[15px]" style={FONT_REGULAR}>{item.time}</span>
                <span
                  className="bg-[#f3f4f6] border-[0.8px] border-[#d1d5dc] rounded-full px-[8px] py-[2px] text-[9px] text-black leading-[13.5px]"
                  style={FONT_BLACK}
                >
                  {item.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── YOUR DRIVERS CARD ───────────────────────────────────────────────────
function DriversCard() {
  const { careerState, player } = useCareerStore()
  const { rivals } = useRivalStore()
  const navigate = useNavigate()

  const displayDrivers = useMemo(() => {
    type DriverDisplay = { id: string; name: string; wins: number; overall: number; portraitUrl: string; isOwner: boolean }
    const result: DriverDisplay[] = []

    // Owner/player is always driver #1
    if (player) {
      const playerOverall = player.stats
        ? Math.round((player.stats.raceSkill + player.stats.qualifyingSkill + player.stats.consistency) / 3)
        : 0
      result.push({
        id: player.id,
        name: `${player.firstName} ${player.lastName}`.toUpperCase(),
        wins: player.totalWins ?? 0,
        overall: playerOverall,
        portraitUrl: getDriverPortrait(player.id),
        isOwner: true,
      })
    }

    // Then hired team drivers
    const teamDrivers = careerState?.ownedTeam?.drivers ?? []
    for (const td of teamDrivers.slice(0, 2)) {
      const rival = rivals.find((r: { id: string }) => r.id === td.driverId)
      const name = rival ? `${rival.firstName} ${rival.lastName}`.toUpperCase() : td.driverId.toUpperCase()
      const wins = (td as { seasonStats?: { wins?: number } }).seasonStats?.wins ?? 0
      const overall = rival
        ? Math.round((rival.stats.raceSkill + rival.stats.qualifyingSkill + rival.stats.consistency) / 3)
        : 0
      const portraitUrl = rival ? getDriverPortrait(rival.id) : ''
      result.push({ id: td.driverId, name, wins, overall, portraitUrl, isOwner: false })
    }

    return result.slice(0, 3)
  }, [player, careerState?.ownedTeam?.drivers, rivals])

  return (
    <div className={CARD} style={{ minHeight: 234 }}>
      <div className={`${CARD_HEADER} h-[52px] justify-between`}>
        <span className="text-[14px] text-black tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>YOUR DRIVERS</span>
        <button onClick={() => navigate('/paddock')} className="flex items-center gap-[4px]">
          <span className="text-[12px] text-black tracking-[0.3px] leading-[16px]" style={FONT_BLACK}>VIEW ALL</span>
          <ChevronRight className="w-[12px] h-[12px] text-black" />
        </button>
      </div>
      {displayDrivers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center h-[calc(100%-52px)]">
          <span className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>No drivers signed</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {displayDrivers.map((driver, i) => (
            <div
              key={driver.id}
              className={`flex items-center gap-[12px] px-[16px] py-[14px] ${
                i < displayDrivers.length - 1 ? 'border-b-[1.6px] border-[#f3f4f6]' : ''
              }`}
            >
              <div className="bg-[#f3f4f6] border-[1.6px] border-black rounded-full overflow-hidden shrink-0 w-[48px] h-[48px]">
                {driver.portraitUrl ? (
                  <img src={driver.portraitUrl} alt={driver.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {driver.isOwner ? (
                      <User className="w-[20px] h-[20px] text-[#4a5565]" />
                    ) : (
                      <span className="text-[14px] text-[#4a5565]" style={FONT_BLACK}>
                        {driver.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px]">
                  <p className="text-[13px] text-black leading-[20px] truncate" style={FONT_BLACK}>{driver.name}</p>
                  {driver.isOwner && (
                    <span className="bg-black text-white text-[8px] px-[6px] py-[1px] rounded-full shrink-0" style={FONT_BLACK}>OWNER</span>
                  )}
                </div>
                <p className="text-[11px] text-[#4a5565] leading-[16px]" style={FONT_REGULAR}>{driver.wins} WINS</p>
              </div>
              <span className="text-[26px] text-black leading-[32px]" style={FONT_BLACK}>{driver.overall}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NEWS + DECISIONS SPLIT ──────────────────────────────────────────────
function NewsFeedAndDecisions() {
  const { careerState } = useCareerStore()

  const hasDecisions = useMemo(() => {
    const pendingOpps = (careerState?.pendingOpportunities ?? []).filter((o: { status: string }) => o.status === 'pending')
    const pendingApprovals = careerState?.ownedTeam?.pendingDelegationApprovals ?? []
    const actionEmails = (careerState?.emails ?? []).filter((e: { read?: boolean; archived?: boolean; requiresAction?: boolean }) => !e.read && !e.archived && e.requiresAction)
    return pendingOpps.length + pendingApprovals.length + actionEmails.length > 0
  }, [careerState])

  if (!hasDecisions) {
    return <NewsFeedCard />
  }

  return (
    <div className="flex-1 flex flex-col gap-[12px] min-h-0">
      <QuickDecisionsPanel />
      <NewsFeedCard />
    </div>
  )
}

// ─── MAIN HOME PAGE ──────────────────────────────────────────────────────
export default function Home() {
  const { careerState } = useCareerStore()

  if (!careerState) {
    return (
      <div className="flex items-center justify-center h-full bg-white" style={FONT_BLACK}>
        <div className="text-center">
          <p className="text-[30px] text-black mb-[8px]">No Active Career</p>
          <p className="text-[14px] text-[#4a5565]" style={FONT_REGULAR}>Start a career to begin your journey</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white w-full h-full relative overflow-hidden">
      <div
        className="absolute rounded-full"
        style={{ width: 384, height: 384, top: 0, right: 0, background: '#f3f4f6', filter: 'blur(64px)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ width: 384, height: 384, top: 674, left: 0, background: '#f9fafb', filter: 'blur(64px)' }}
      />

      <div className="absolute inset-0 pl-[24px] py-[24px] flex flex-col">
        <div className="flex gap-[16px] flex-1 min-h-0">

          {/* LEFT COLUMN (411px) */}
          <div className="w-[411px] shrink-0 flex flex-col gap-[16px]">
            <WeekCalendar />
            <InboxCard />
            <OperationsCard />
          </div>

          {/* CENTER COLUMN (flex) */}
          <div className="flex-1 min-w-0 flex flex-col gap-[16px]">
            <ContinueCareerBar />
            <RaceImageCard />
            <FleetCard />
          </div>

          {/* RIGHT COLUMN (554px) */}
          <div className="w-[554px] shrink-0 flex flex-col gap-[16px] pr-[24px]">
            <StatsRow />
            <NewsFeedAndDecisions />
            <DriversCard />
          </div>

        </div>
      </div>
    </div>
  )
}
