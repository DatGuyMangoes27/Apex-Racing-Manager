import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import {
  Home,
  Calendar,
  Flag,
  Car,
  DollarSign,
  Factory,
  Save,
  Check,
  Mail,
  Trophy,
  Briefcase,
  ChevronRight,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'
import { useSettingsStore } from '@/store/settingsStore'
import { useCareerStore, forceSaveCareer, saveToNativeDB, getDayName } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNotifications } from '@/hooks'
import { useToast } from '@/components/ui'
import { getPeriodForHour } from '@/data/day-periods-config'

// ─── NAV ITEMS (9 core items) ───────────────────────────────────────────
interface NavItem {
  path: string
  icon: LucideIcon
  label: string
  context: 'home' | 'calendar' | 'raceday' | 'garage' | 'finances' | 'media' | 'personal'
  raceWeekHighlight?: boolean
}

const navItems: NavItem[] = [
  { path: '/home',         icon: Home,       label: 'Home',      context: 'home' },
  { path: '/emails',       icon: Mail,       label: 'Mail',      context: 'home' },
  { path: '/garage',       icon: Car,        label: 'Car',       context: 'garage' },
  { path: '/facilities',   icon: Factory,    label: 'HQ',        context: 'finances' },
  { path: '/finances',     icon: DollarSign, label: 'Team',      context: 'finances' },
  { path: '/staff-market', icon: Briefcase,  label: 'Staff',     context: 'finances' },
  { path: '/paddock',      icon: Trophy,     label: 'Standings', context: 'home' },
  { path: '/calendar',     icon: Calendar,   label: 'Calendar',  context: 'calendar' },
  { path: '/race-day',     icon: Flag,       label: 'Race',      context: 'raceday', raceWeekHighlight: true },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────

interface BottomNavProps {
  onEndDay?: () => void
  onFastForward?: () => void
  onOpenFFConfig?: () => void
}

export function BottomNav({ onEndDay, onFastForward, onOpenFFConfig }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { setCurrentVideoContext } = useSettingsStore()
  const {
    player,
    careerState,
    hasActiveCareer,
    getUnreadEmailCount,
    startFastForwardToRaceWeek,
    stopFastForward
  } = useCareerStore()
  const { getSeriesById } = useRivalStore()
  const { hasNotifications, getNotificationCount, getNotificationsForScreen } = useNotifications()
  const { addToast } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const unreadEmailCount = getUnreadEmailCount()

  // Race week detection
  const currentRaceThisWeek = useMemo(() => {
    if (!careerState || !player) return null
    const resolvedSeriesId = player.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId
    if (!resolvedSeriesId) return null
    const series = getSeriesById(resolvedSeriesId)
    return series?.calendar?.find(r => r.week === careerState.currentWeek) ?? null
  }, [careerState, player, getSeriesById])

  // Day/time budget data
  const dayData = useMemo(() => {
    if (!careerState || !player) return null
    const currentDay = careerState.currentDay ?? 1
    const currentWeek = careerState.currentWeek
    const currentYear = careerState.currentYear
    const resolvedSeriesId = player.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId
    const currentSeries = resolvedSeriesId ? getSeriesById(resolvedSeriesId) : null
    const calendar = currentSeries?.calendar ?? []
    const currentRace = calendar.find(r => r.week === currentWeek)
    const nextRace = calendar.find(r => r.week > currentWeek)
    const upcomingRace = currentRace || nextRace
    const isRaceWeekend = !!currentRace && currentDay >= 5
    const isAutoFastForwarding = careerState.fastForward?.isActive ?? false
    const dayName = getDayName(currentDay)
    const dayBudget = careerState.dayBudget
    const hoursRemaining = dayBudget?.hoursRemaining ?? 16
    const currentHour = dayBudget?.currentHour ?? 7
    const period = getPeriodForHour(currentHour)

    return {
      currentDay, currentWeek, currentYear, dayName,
      hoursRemaining, period,
      upcomingRace, isRaceWeekend, isAutoFastForwarding,
    }
  }, [careerState, player, getSeriesById])

  // Notification helpers
  const getNotificationColor = (path: string) => {
    const notifs = getNotificationsForScreen(path)
    if (notifs.length === 0) return ''
    switch (notifs[0].type) {
      case 'warning': return 'bg-status-warning'
      case 'action': return 'bg-accent-red'
      case 'info': return 'bg-status-info'
      default: return 'bg-accent-red'
    }
  }

  const handleNavClick = (context: NavItem['context']) => {
    setCurrentVideoContext(context)
  }

  const handleManualSave = async () => {
    if (!hasActiveCareer || isSaving) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      forceSaveCareer()
      await saveToNativeDB()
      setSaveSuccess(true)
      addToast({ type: 'success', title: 'Game Saved', message: 'Your career has been saved successfully.', duration: 2000 })
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Failed to save your career. Please try again.', duration: 3000 })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <nav className="h-14 bg-surface/80 backdrop-blur-xl border-t border-surface-border flex items-stretch shrink-0 relative z-30">
      {/* ── 14 NAV ITEMS ─────────────────────────────────────────────── */}
      <div className="flex flex-1 items-stretch">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/home' && location.pathname.startsWith(item.path))
          const notifCount = getNotificationCount(item.path)
          const hasNotif = hasNotifications(item.path)
          const notifColor = getNotificationColor(item.path)
          const isEmailsItem = item.path === '/emails'
          const emailNotifCount = isEmailsItem ? unreadEmailCount : 0
          const hasEmailNotif = isEmailsItem && unreadEmailCount > 0
          const isRaceHighlight = item.raceWeekHighlight && !!currentRaceThisWeek && !isActive

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.context)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 px-0.5 min-w-0 flex-1 transition-all duration-150',
                'hover:bg-surface-secondary/50',
                isActive && 'bg-surface-secondary/70',
                isRaceHighlight && 'bg-accent-orange/10'
              )}
            >
              <div className="relative">
                <item.icon
                  className={clsx(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-accent-red' :
                    isRaceHighlight ? 'text-accent-orange animate-pulse' :
                    'text-text-muted'
                  )}
                />
                {(hasNotif || hasEmailNotif) && (
                  <span className={clsx(
                    'absolute -top-1 -right-1.5 min-w-[12px] h-[12px] rounded-full text-[7px] font-bold text-white flex items-center justify-center px-0.5',
                    hasEmailNotif ? 'bg-accent-blue' : notifColor
                  )}>
                    {emailNotifCount > 0 ? (emailNotifCount > 99 ? '99+' : emailNotifCount) :
                     notifCount > 1 ? notifCount : ''}
                  </span>
                )}
              </div>
              <span className={clsx(
                'text-[8px] font-display font-medium leading-none transition-colors',
                isActive ? 'text-white' :
                isRaceHighlight ? 'text-accent-orange' :
                'text-text-muted'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent-red rounded-b"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          )
        })}
      </div>

      {/* ── DAY CONTROL ZONE — MM style: date + CONTINUE ──────── */}
      {dayData && (
        <div className="flex items-center gap-3 px-4 border-l border-surface-border shrink-0">
          {/* Date display like MM: "Monday\n11/04/2022" */}
          <div className="text-right leading-tight">
            <span className="text-xs font-display font-bold text-text-primary block">
              {dayData.dayName}
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              W{dayData.currentWeek}/{dayData.currentYear}
            </span>
          </div>

          {/* CONTINUE button like MM */}
          {(() => {
            if (dayData.isAutoFastForwarding) {
              return (
                <button
                  onClick={() => stopFastForward('manual', 'Fast forward stopped by player.')}
                  className="px-5 py-2.5 bg-accent-red font-display font-bold text-sm text-white rounded hover:bg-accent-red/90 transition-colors flex items-center gap-2"
                >
                  STOP
                </button>
              )
            }

            const isNight = dayData.period === 'night'
            const noHours = dayData.hoursRemaining <= 0

            return (
              <button
                onClick={() => {
                  if (isNight || noHours) {
                    onEndDay?.()
                  } else {
                    onFastForward?.()
                  }
                }}
                className="px-6 py-2.5 bg-accent-red font-display font-bold text-sm text-white rounded hover:bg-accent-red/90 transition-colors flex items-center gap-2"
              >
                CONTINUE
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          })()}
        </div>
      )}
    </nav>
  )
}
