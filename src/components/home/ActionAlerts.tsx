/**
 * ActionAlerts — Premium dark glass alert cards
 * Severity-coded (critical/warning/info) with subtle glow accents.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Mail,
  Target,
  Wrench,
  DollarSign,
  Ticket,
  Users,
  CalendarX,
  ChevronRight,
  BellRing,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

interface AlertItem {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  path: string
}

const severityConfig = {
  critical: {
    border: 'rgba(225,6,0,0.25)',
    bg: 'rgba(225,6,0,0.06)',
    glow: 'rgba(225,6,0,0.15)',
    iconBg: 'rgba(225,6,0,0.15)',
    iconColor: 'text-red-400',
    textColor: 'text-red-400',
  },
  warning: {
    border: 'rgba(255,128,0,0.25)',
    bg: 'rgba(255,128,0,0.04)',
    glow: 'rgba(255,128,0,0.1)',
    iconBg: 'rgba(255,128,0,0.15)',
    iconColor: 'text-orange-400',
    textColor: 'text-orange-400',
  },
  info: {
    border: 'rgba(100,149,237,0.2)',
    bg: 'rgba(100,149,237,0.04)',
    glow: 'rgba(100,149,237,0.08)',
    iconBg: 'rgba(100,149,237,0.12)',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-400',
  },
}

export function ActionAlerts({ compact = false, maxAlerts }: { compact?: boolean; maxAlerts?: number }) {
  const navigate = useNavigate()
  const { careerState, getUnreadEmailCount } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  const alerts = useMemo(() => {
    if (!careerState) return []
    const items: AlertItem[] = []

    // 1. Unread emails with expiring actions
    const unreadCount = getUnreadEmailCount()
    const expiringEmails = careerState.emails?.filter(
      e => !e.read && !e.archived && e.expiresWeek && e.expiresWeek <= (careerState.currentWeek || 0) + 2
    ) || []

    if (expiringEmails.length > 0) {
      items.push({
        id: 'expiring-emails',
        icon: <Mail className="w-4 h-4" />,
        label: `${expiringEmails.length} expiring email${expiringEmails.length > 1 ? 's' : ''}`,
        description: 'Time-sensitive offers need your response',
        severity: 'critical',
        path: '/emails',
      })
    } else if (unreadCount > 0) {
      items.push({
        id: 'unread-emails',
        icon: <Mail className="w-4 h-4" />,
        label: `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
        description: 'Check your inbox for updates',
        severity: 'info',
        path: '/emails',
      })
    }

    // 2. Board targets at risk
    const atRiskTargets = careerState.boardTargets?.filter(
      t => !t.met && !t.exceeded && t.currentProgress < t.targetValue * 0.5
    ) || []
    if (atRiskTargets.length > 0) {
      items.push({
        id: 'board-targets',
        icon: <Target className="w-4 h-4" />,
        label: `${atRiskTargets.length} board target${atRiskTargets.length > 1 ? 's' : ''} at risk`,
        description: atRiskTargets[0]?.description || 'Performance below expectations',
        severity: atRiskTargets.some(t => t.severity === 'critical') ? 'critical' : 'warning',
        path: '/finances',
      })
    }

    // 3. Cars needing service
    const damagedCars = careerState.cars?.filter(car => {
      if (!car.partWear) return false
      const avgWear = Object.values(car.partWear).reduce((sum, w) => sum + (typeof w === 'number' ? w : 0), 0) /
        Math.max(1, Object.values(car.partWear).filter(w => typeof w === 'number').length)
      return avgWear > 60
    }) || []
    if (damagedCars.length > 0) {
      items.push({
        id: 'car-service',
        icon: <Wrench className="w-4 h-4" />,
        label: `${damagedCars.length} car${damagedCars.length > 1 ? 's' : ''} need${damagedCars.length === 1 ? 's' : ''} service`,
        description: 'High component wear detected',
        severity: 'warning',
        path: '/garage',
      })
    }

    // 4. Low financial runway
    if (ownedTeam) {
      const cash = ownedTeam.budgets?.cash ?? ownedTeam.finances?.cash ?? 0
      const weeklyBurn = (ownedTeam.staff?.reduce((s, st) => s + (st.weeklyWage || 0), 0) || 0) +
        (ownedTeam.drivers?.reduce((s, d) => s + (d.weeklyWage || 0), 0) || 0) +
        (ownedTeam.facilityStaff?.reduce((s, fs) => s + (fs.weeklyWage || 0), 0) || 0)
      const runway = weeklyBurn > 0 ? Math.floor(cash / weeklyBurn) : 999

      if (runway < 8) {
        items.push({
          id: 'low-funds',
          icon: <DollarSign className="w-4 h-4" />,
          label: runway <= 4 ? 'Critical: Funds running out' : 'Low financial runway',
          description: `~${runway} weeks of operating cash remaining`,
          severity: runway <= 4 ? 'critical' : 'warning',
          path: '/finances',
        })
      }
    }

    // 5. Expiring invitations
    const expiringInvites = careerState.pendingInvitations?.filter(
      inv => inv.expiresWeek <= (careerState.currentWeek || 0) + 2
    ) || []
    if (expiringInvites.length > 0) {
      items.push({
        id: 'expiring-invitations',
        icon: <Ticket className="w-4 h-4" />,
        label: `${expiringInvites.length} invitation${expiringInvites.length > 1 ? 's' : ''} expiring soon`,
        description: expiringInvites[0]?.trackName ? `${expiringInvites[0].trackName} event` : 'Respond before it expires',
        severity: 'warning',
        path: '/calendar',
      })
    }

    // 6. Staff with low morale or high fatigue
    const strugglingStaff = ownedTeam?.staff?.filter(
      s => (s.morale !== undefined && s.morale < 30) || (s.fatigue !== undefined && s.fatigue > 80)
    ) || []
    if (strugglingStaff.length > 0) {
      items.push({
        id: 'staff-issues',
        icon: <Users className="w-4 h-4" />,
        label: `${strugglingStaff.length} staff member${strugglingStaff.length > 1 ? 's' : ''} struggling`,
        description: 'Low morale or high fatigue detected',
        severity: 'warning',
        path: '/garage',
      })
    }

    // 7. Calendar conflicts
    const conflicts = careerState.pendingConflicts?.filter(c => !c.resolved) || []
    if (conflicts.length > 0) {
      items.push({
        id: 'calendar-conflicts',
        icon: <CalendarX className="w-4 h-4" />,
        label: `${conflicts.length} calendar conflict${conflicts.length > 1 ? 's' : ''}`,
        description: 'Overlapping race events need resolution',
        severity: 'critical',
        path: '/calendar',
      })
    }

    // 8. Board mood very low
    if (ownedTeam && ownedTeam.boardMood < 30) {
      items.push({
        id: 'board-mood',
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Board is unhappy',
        description: `Board satisfaction at ${ownedTeam.boardMood}%`,
        severity: ownedTeam.boardMood < 15 ? 'critical' : 'warning',
        path: '/finances',
      })
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 }
    const limit = maxAlerts ?? 5
    return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, limit)
  }, [careerState, ownedTeam, getUnreadEmailCount])

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(52,211,153,0.12)' }}
        >
          <BellRing className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">All clear</p>
          <p className="text-xs text-slate-500">No urgent actions needed right now</p>
        </div>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity]
          return (
            <motion.button
              key={alert.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(alert.path)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-105 ${cfg.iconColor}`}
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              {alert.icon}
              <span className="text-slate-300 truncate max-w-[140px]">{alert.label}</span>
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity]
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(alert.path)}
              className="cursor-pointer group"
            >
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {/* Severity icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconColor}`}
                  style={{ background: cfg.iconBg }}
                >
                  {alert.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{alert.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{alert.description}</p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
