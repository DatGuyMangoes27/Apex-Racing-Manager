/**
 * MonthlyCalendarGrid
 * Full monthly calendar view matching the Figma Schedule design
 * Clean grid with colored event pills and legend bar
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Flag,
  AlertTriangle,
  Plus,
  AlertCircle,
  Wrench,
  Users,
  Settings
} from 'lucide-react'
import { 
  ScheduledActivity, 
  getDayName 
} from '@/store/careerStore'
import { RaceEvent } from '@/store/rivalStore'
import { CalendarDayCell } from './CalendarDayCell'
import { calculateWeekNumber, getGameWeekAndDayFromDate } from '@/utils/calendar'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

interface MonthlyCalendarGridProps {
  currentWeek: number
  currentDay: number
  currentYear: number
  calendar: RaceEvent[]
  scheduledActivities: ScheduledActivity[]
  mandatoryActivities: ScheduledActivity[]
  onDayClick: (week: number, day: number) => void
  onAddActivity: (week: number, day: number) => void
}

function getMonthFromWeek(week: number, startYear: number): { month: number; year: number } {
  const totalDays = (week - 1) * 7
  const date = new Date(startYear, 0, 1 + totalDays)
  return { month: date.getMonth(), year: date.getFullYear() }
}

export type MonthDayInfo = {
  day: number
  week: number
  dayOfWeek: number
  gameWeek: number
  gameDay: number
  isCurrentMonth: boolean
}

// Sunday-first calendar grid
function getMonthDays(year: number, month: number, startYear: number): MonthDayInfo[] {
  const days: MonthDayInfo[] = []
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Sunday = 0, so getDay() gives correct offset for Sunday-first
  const firstDayOfWeek = firstDay.getDay()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    const week = calculateWeekNumber(date, startYear)
    const { week: gameWeek, day: gameDay } = getGameWeekAndDayFromDate(date, startYear)
    days.push({
      day: date.getDate(),
      week,
      dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(),
      gameWeek,
      gameDay,
      isCurrentMonth: false
    })
  }
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const week = calculateWeekNumber(date, startYear)
    const { week: gameWeek, day: gameDay } = getGameWeekAndDayFromDate(date, startYear)
    days.push({
      day: d,
      week,
      dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(),
      gameWeek,
      gameDay,
      isCurrentMonth: true
    })
  }
  
  const remainingDays = 7 - (days.length % 7)
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      const week = calculateWeekNumber(date, startYear)
      const { week: gameWeek, day: gameDay } = getGameWeekAndDayFromDate(date, startYear)
      days.push({
        day: i,
        week,
        dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(),
        gameWeek,
        gameDay,
        isCurrentMonth: false
      })
    }
  }
  
  return days
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function MonthlyCalendarGrid({
  currentWeek,
  currentDay,
  currentYear,
  calendar,
  scheduledActivities,
  mandatoryActivities,
  onDayClick,
  onAddActivity
}: MonthlyCalendarGridProps) {
  const initialMonth = getMonthFromWeek(currentWeek, currentYear)
  const [displayMonth, setDisplayMonth] = useState(initialMonth.month)
  const [displayYear, setDisplayYear] = useState(initialMonth.year)
  
  const monthDays = useMemo(() => 
    getMonthDays(displayYear, displayMonth, currentYear),
    [displayYear, displayMonth, currentYear]
  )
  
  const activityMap = useMemo(() => {
    const map: Record<string, ScheduledActivity[]> = {}
    scheduledActivities.forEach(activity => {
      const spanDays = activity.spanDays || 1
      for (let d = 0; d < spanDays; d++) {
        const dayNum = activity.scheduledDay + d
        const weekNum = dayNum > 7 ? activity.scheduledWeek + 1 : activity.scheduledWeek
        const actualDay = dayNum > 7 ? dayNum - 7 : dayNum
        
        const key = `${weekNum}-${actualDay}`
        if (!map[key]) map[key] = []
        const activityWithPosition = {
          ...activity,
          _isSpanContinuation: d > 0,
          _spanPosition: d + 1,
          _totalSpanDays: spanDays
        }
        map[key].push(activityWithPosition as ScheduledActivity)
      }
    })
    return map
  }, [scheduledActivities])
  
  const raceMap = useMemo(() => {
    const map: Record<number, RaceEvent> = {}
    calendar.forEach(race => {
      map[race.week] = race
    })
    return map
  }, [calendar])
  
  const prevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11)
      setDisplayYear(displayYear - 1)
    } else {
      setDisplayMonth(displayMonth - 1)
    }
  }
  
  const nextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0)
      setDisplayYear(displayYear + 1)
    } else {
      setDisplayMonth(displayMonth + 1)
    }
  }
  
  const weeks = useMemo(() => {
    const result: typeof monthDays[] = []
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7))
    }
    return result
  }, [monthDays])
  
  // Check if prev month is before the season start
  const isPrevDisabled = displayYear < currentYear || (displayYear === currentYear && displayMonth === 0)

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          className={`h-[43px] px-[20px] bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] text-[12px] text-black transition-opacity ${isPrevDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white cursor-pointer'}`}
          style={FB}
        >
          ← PREV MONTH
        </button>
        
        <span className="text-[14px] text-black" style={FB}>
          {MONTH_NAMES[displayMonth]} {displayYear}
        </span>
        
        <button
          onClick={nextMonth}
          className="h-[43px] px-[20px] bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] text-[12px] text-black hover:bg-white cursor-pointer transition-opacity"
          style={FB}
        >
          NEXT MONTH →
        </button>
      </div>
      
      {/* Calendar Card */}
      <div className="bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-[#e5e7eb] border-b-[1.6px] border-black">
          {DAY_HEADERS.map((day, i) => (
            <div 
              key={day}
              className={`py-[14px] text-center text-[12px] text-black ${i < 6 ? 'border-r-[1.6px] border-black' : ''}`}
              style={FB}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${displayMonth}-${displayYear}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {weeks.map((weekDays, weekIndex) => {
              const weekNum = weekDays.find(d => d.isCurrentMonth && d.gameWeek > 0)?.gameWeek
                ?? weekDays.find(d => d.gameWeek > 0)?.gameWeek
                ?? weekDays.find(d => d.isCurrentMonth)?.week
                ?? weekDays[0].week
              const race = raceMap[weekNum]
              
              return (
                <div 
                  key={weekIndex}
                  className="grid grid-cols-7"
                >
                  {weekDays.map((dayInfo, dayIndex) => {
                    const isToday = dayInfo.gameWeek === currentWeek && dayInfo.gameDay === currentDay
                    const isPast = dayInfo.gameWeek > 0 && (
                      dayInfo.gameWeek < currentWeek ||
                      (dayInfo.gameWeek === currentWeek && dayInfo.gameDay < currentDay)
                    )
                    const activities = dayInfo.gameWeek > 0
                      ? (activityMap[`${dayInfo.gameWeek}-${dayInfo.gameDay}`] || [])
                      : []
                    const hasMandatory = activities.some(a => a.mandatory)
                    const dayRace = dayInfo.dayOfWeek >= 5 && dayInfo.dayOfWeek <= 7 ? race : undefined
                    
                    // Determine if this column is even/odd for checkerboard coloring
                    const isEvenCol = dayIndex % 2 === 0
                    
                    return (
                      <CalendarDayCell
                        key={dayIndex}
                        day={dayInfo.day}
                        week={dayInfo.gameWeek}
                        dayOfWeek={dayInfo.dayOfWeek}
                        isCurrentMonth={dayInfo.isCurrentMonth}
                        isToday={isToday}
                        isPast={isPast}
                        activities={activities}
                        race={dayRace}
                        hasMandatory={hasMandatory}
                        isEvenCol={isEvenCol}
                        isLastRow={weekIndex === weeks.length - 1}
                        isLastCol={dayIndex === 6}
                        onClick={() => onDayClick(dayInfo.gameWeek, dayInfo.gameDay)}
                        onAddActivity={() => onAddActivity(dayInfo.gameWeek, dayInfo.gameDay)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Legend Bar */}
      <div className="bg-[rgba(255,255,255,0.8)] border-[1.6px] border-black rounded-[16px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] px-[18px] py-[16px]">
        <div className="flex items-center justify-center gap-[24px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] rounded-[4px] bg-black flex items-center justify-center">
              <Flag className="w-[12px] h-[12px] text-white" />
            </div>
            <span className="text-[12px] text-black uppercase" style={FB}>Race</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] rounded-[4px] bg-[#e7000b] flex items-center justify-center">
              <AlertCircle className="w-[12px] h-[12px] text-white" />
            </div>
            <span className="text-[12px] text-black uppercase" style={FB}>Deadline</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] rounded-[4px] bg-[#d08700] flex items-center justify-center">
              <Wrench className="w-[12px] h-[12px] text-white" />
            </div>
            <span className="text-[12px] text-black uppercase" style={FB}>Maintenance</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] rounded-[4px] bg-[#155dfc] flex items-center justify-center">
              <Users className="w-[12px] h-[12px] text-white" />
            </div>
            <span className="text-[12px] text-black uppercase" style={FB}>Meeting</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] rounded-[4px] bg-[#9810fa] flex items-center justify-center">
              <Settings className="w-[12px] h-[12px] text-white" />
            </div>
            <span className="text-[12px] text-black uppercase" style={FB}>Development</span>
          </div>
        </div>
      </div>
    </div>
  )
}
