/**
 * WeekCalendarCard — Figma-inspired 7-day calendar strip
 * Shows week number, month, day names + numbers, current day highlighted in green.
 * Race indicators below day numbers.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function WeekCalendarCard() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const calendarData = useMemo(() => {
    if (!careerState) return null
    const week = careerState.currentWeek ?? 1
    const day = careerState.currentDay ?? 1
    const year = careerState.currentYear ?? 2026

    // Build 7 days for the week
    const baseDate = 10 + (week - 1) * 7 // Simplified day-of-month calculation
    const days = DAY_NAMES.map((name, i) => {
      const dayNum = baseDate + i
      const isCurrent = i + 1 === day
      // Check if there are activities or races on this day
      const hasRace = i >= 5 // Sat/Sun are race days
      const hasActivity = careerState.weeklySchedule?.[i + 1]?.length > 0
      return { name, dayNum, isCurrent, hasRace, hasActivity }
    })

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const monthIdx = Math.min(11, Math.floor((week - 1) / 4))

    return { week, days, month: monthNames[monthIdx], year }
  }, [careerState])

  if (!calendarData) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/calendar')}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-300" />
          <span className="font-display font-black text-sm text-white tracking-tight">
            WEEK {calendarData.week}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {calendarData.month} {calendarData.year}
        </span>
      </div>

      {/* Days grid */}
      <div className="flex items-stretch p-3 gap-1.5">
        {calendarData.days.map((day) => (
          <div
            key={day.name}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors ${
              day.isCurrent
                ? 'bg-emerald-500/90 shadow-md shadow-emerald-500/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08]'
            }`}
          >
            <span className={`text-[9px] font-display font-black tracking-wider ${
              day.isCurrent ? 'text-white' : 'text-slate-500'
            }`}>
              {day.name}
            </span>
            <span className={`text-lg font-display font-black ${
              day.isCurrent ? 'text-white' : 'text-white/90'
            }`}>
              {day.dayNum}
            </span>
            {/* Race/activity indicator */}
            {(day.hasRace || day.hasActivity) && (
              <div className="flex gap-0.5">
                {day.hasRace && (
                  <span className={`text-[7px] font-bold ${
                    day.isCurrent ? 'text-white/80' : 'text-orange-400'
                  }`}>
                    1 RACE
                  </span>
                )}
                {day.hasActivity && !day.hasRace && (
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    day.isCurrent ? 'bg-white/60' : 'bg-emerald-400/60'
                  }`} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
