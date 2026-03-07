import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Car,
  Users,
  Calendar,
  DollarSign,
  Mail,
  Flag,
  ClipboardList,
  Settings,
  FileText,
  Save,
  Check,
  Trophy,
  Heart,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useCareerStore, forceSaveCareer, saveToNativeDB } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { useToast } from '@/components/ui'

// ─── Trimmed sidebar: 6 core + 2 utility ─────────────────────────────────

const FONT_BLACK = "'Arial Black', 'Arial', sans-serif"

const mainNav = [
  { path: '/home',     icon: Home,       label: 'HOME' },
  { path: '/garage',   icon: Car,        label: 'GARAGE' },
  { path: '/paddock',  icon: Users,      label: 'TEAM' },
  { path: '/calendar', icon: Calendar,   label: 'RACES' },
  { path: '/finances', icon: DollarSign, label: 'FINANCE' },
  { path: '/emails',   icon: Mail,       label: 'INBOX' },
]

const utilNav = [
  { path: '/race-day',     icon: Flag,          label: 'RACE' },
  { path: '/series-entry', icon: ClipboardList, label: 'SERIES' },
  { path: '/settings',     icon: Settings,      label: 'SETTINGS' },
  { path: '/logs',         icon: FileText,      label: 'LOGS' },
]

export function Sidebar() {
  const location = useLocation()
  const { careerState, player, hasActiveCareer, getUnreadEmailCount } = useCareerStore()
  const { getStandings, getSeriesById } = useRivalStore()
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const unreadCount = getUnreadEmailCount('action')
  const digestCount = useMemo(
    () => (careerState?.emails || []).filter(e => !e.read && !e.archived && (e.interruptClass === 'digest' || e.digestMode === 'digest')).length,
    [careerState?.emails]
  )

  // Budget
  const budget = careerState?.ownedTeam?.budgets?.cash ?? 0
  const formatBudget = (b: number) => {
    if (b >= 1_000_000) return `$${(b / 1_000_000).toFixed(1)}M`
    if (b >= 1_000) return `$${(b / 1_000).toFixed(0)}K`
    return `$${b}`
  }

  // Championship rank (real data)
  const rank = useMemo(() => {
    if (!player || !careerState) return '--'
    const entries = careerState.seriesEntries ?? []
    const seriesId = player.currentSeriesId || entries[0]?.seriesId
    if (!seriesId) return '--'
    const standings = getStandings(seriesId) ?? []
    const teamName = careerState.ownedTeam?.name ?? ''
    const teamDriverIds = (careerState.ownedTeam?.drivers ?? []).map((d: { driverId: string }) => d.driverId)
    const playerName = `${player.firstName} ${player.lastName}`
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i]
      if (s.teamName === teamName || teamDriverIds.includes(s.driverId) || s.driverName === playerName) {
        const n = i + 1
        const sfx = ['th', 'st', 'nd', 'rd']
        const v = n % 100
        return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0])
      }
    }
    return '--'
  }, [player, careerState, getStandings])

  // Team morale
  const morale = Math.round(careerState?.ownedTeam?.teamMorale ?? 0)

  // Is there a race this week? (highlight RACE DAY button)
  const raceThisWeek = useMemo(() => {
    if (!player || !careerState) return false
    const entries = careerState.seriesEntries ?? []
    for (const entry of entries) {
      const series = getSeriesById(entry.seriesId)
      if (series?.calendar?.some((r: { week: number }) => r.week === careerState.currentWeek)) return true
    }
    return false
  }, [player, careerState, getSeriesById])

  const handleSave = async () => {
    if (!hasActiveCareer || isSaving) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      forceSaveCareer()
      await saveToNativeDB()
      setSaveSuccess(true)
      addToast({ type: 'success', message: 'Career saved successfully.', duration: 2000 })
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      addToast({ type: 'error', message: 'Failed to save career.', duration: 3000 })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="w-[96px] h-full bg-black border-r-[0.8px] border-[#e5e7eb] flex flex-col shrink-0"
      style={{ fontFamily: FONT_BLACK }}
    >
      {/* ── Logo ── */}
      <div className="h-[72px] flex items-center justify-center border-b-[0.8px] border-[#1e2939]">
        <span className="text-[28px] text-white leading-[36px]">A</span>
      </div>

      {/* ── Main Nav (6 core screens) ── */}
      <nav className="flex-1 flex flex-col pt-[12px] min-h-0">
        <div className="flex flex-col gap-[2px]">
          {mainNav.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/paddock' && location.pathname.startsWith('/paddock'))
            const isInbox = item.path === '/emails'

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative h-[64px] flex flex-col items-center justify-center gap-[3px]"
              >
                {isActive && (
                  <div className="absolute left-0 top-[10px] w-[4px] h-[44px] bg-white rounded-tr-full rounded-br-full" />
                )}
                <div className="relative">
                  <item.icon
                    className="w-[22px] h-[22px]"
                    style={{ color: isActive ? '#ffffff' : '#6b7280' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {isInbox && unreadCount > 0 && (
                    <div className="absolute -top-[4px] -right-[6px] bg-[#f54900] rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-[3px]">
                      <span className="text-[8px] text-white leading-[8px]">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </div>
                  )}
                  {isInbox && unreadCount === 0 && digestCount > 0 && (
                    <div className="absolute -top-[2px] -right-[4px] bg-[#6b7280] rounded-full w-[8px] h-[8px]" />
                  )}
                </div>
                <span
                  className="text-[8px] tracking-[0.4px] leading-[12px]"
                  style={{ color: isActive ? '#ffffff' : '#6b7280' }}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>

        {/* ── Utility nav (pushed to bottom of nav area) ── */}
        <div className="mt-auto border-t border-[#1e2939] pt-[6px] pb-[4px] flex flex-col gap-[2px]">
          {utilNav.map((item) => {
            const isActive = location.pathname === item.path
            const isRaceDay = item.path === '/race-day'
            const highlight = isRaceDay && raceThisWeek && !isActive

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative h-[44px] flex flex-col items-center justify-center gap-[2px]"
              >
                {isActive && (
                  <div className="absolute left-0 top-[4px] w-[3px] h-[36px] bg-white rounded-tr-full rounded-br-full" />
                )}
                <item.icon
                  className={`w-[18px] h-[18px] ${highlight ? 'animate-pulse' : ''}`}
                  style={{ color: isActive ? '#ffffff' : highlight ? '#f59e0b' : '#6b7280' }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className="text-[7px] tracking-[0.3px] leading-[10px]"
                  style={{ color: isActive ? '#ffffff' : highlight ? '#f59e0b' : '#6b7280' }}
                >
                  {isRaceDay && raceThisWeek ? 'RACE!' : item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ── Bottom Stats (real data) ── */}
      <div className="border-t-[0.8px] border-[#1e2939] px-[10px] pt-[12px] pb-[8px] flex flex-col gap-[10px]">
        <div className="flex flex-col items-center">
          <DollarSign className="w-[16px] h-[16px] text-white/60" />
          <span className="text-[11px] text-white text-center leading-[16px] mt-[2px]">
            {formatBudget(budget)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Trophy className="w-[16px] h-[16px] text-white/60" />
          <span className="text-[11px] text-white text-center leading-[16px] mt-[2px]">
            {rank}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Heart className="w-[16px] h-[16px] text-white/60" />
          <span className="text-[11px] text-white text-center leading-[16px] mt-[2px]">
            {morale}%
          </span>
        </div>
      </div>

      {/* ── Save Button ── */}
      {hasActiveCareer && (
        <div className="border-t-[0.8px] border-[#1e2939] p-[6px]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex flex-col items-center justify-center gap-[2px] py-[6px] rounded-lg transition-all hover:bg-white/10"
          >
            {saveSuccess ? (
              <Check className="w-[16px] h-[16px] text-green-400" />
            ) : (
              <Save
                className={`w-[16px] h-[16px] text-[#6b7280] ${isSaving ? 'animate-spin' : ''}`}
              />
            )}
            <span className="text-[7px] tracking-[0.3px] text-[#6b7280]">
              {isSaving ? 'SAVING' : saveSuccess ? 'SAVED' : 'SAVE'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
