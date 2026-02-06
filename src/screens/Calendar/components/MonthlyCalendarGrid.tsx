/**
 * MonthlyCalendarGrid
 * Full monthly calendar view with day cells and activity indicators
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Flag,
  AlertTriangle,
  _Plus
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { 
  ScheduledActivity, 
  getDayName 
} from '@/store/careerStore'
import { RaceEvent } from '@/store/rivalStore'
import { CalendarDayCell } from './CalendarDayCell'
import { calculateWeekNumber } from '@/utils/calendar'

interface MonthlyCalendarGridProps {
  currentWeek: number
  currentDay: number
  currentYear: number
  calendar: RaceEvent[]  // Race events
  scheduledActivities: ScheduledActivity[]
  mandatoryActivities: ScheduledActivity[]
  onDayClick: (week: number, day: number) => void
  onAddActivity: (week: number, day: number) => void
}

// Helper to convert week/day to month info
function getMonthFromWeek(week: number, startYear: number): { month: number; year: number } {
  // Assuming week 1 starts in January
  const totalDays = (week - 1) * 7
  const date = new Date(startYear, 0, 1 + totalDays)
  return { month: date.getMonth(), year: date.getFullYear() }
}

// Get all days in a month with their week numbers
function getMonthDays(year: number, month: number, startYear: number): Array<{
  day: number
  week: number
  dayOfWeek: number
  isCurrentMonth: boolean
}> {
  const days: Array<{ day: number; week: number; dayOfWeek: number; isCurrentMonth: boolean }> = []
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Fill in days from previous month to complete first week
  const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    const week = calculateWeekNumber(date, startYear)
    days.push({
      day: date.getDate(),
      week,
      dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(), // Sunday = 7
      isCurrentMonth: false
    })
  }
  
  // Fill in days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const week = calculateWeekNumber(date, startYear)
    days.push({
      day: d,
      week,
      dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(),
      isCurrentMonth: true
    })
  }
  
  // Fill in days from next month to complete last week
  const remainingDays = 7 - (days.length % 7)
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      const week = calculateWeekNumber(date, startYear)
      days.push({
        day: i,
        week,
        dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(),
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

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  // Calculate which month to show based on current week
  const initialMonth = getMonthFromWeek(currentWeek, currentYear)
  const [displayMonth, setDisplayMonth] = useState(initialMonth.month)
  const [displayYear, setDisplayYear] = useState(initialMonth.year)
  
  // Get days for the displayed month
  const monthDays = useMemo(() => 
    getMonthDays(displayYear, displayMonth, currentYear),
    [displayYear, displayMonth, currentYear]
  )
  
  // Create a map of activities by week/day (includes all days for multi-day activities)
  const activityMap = useMemo(() => {
    const map: Record<string, ScheduledActivity[]> = {}
    scheduledActivities.forEach(activity => {
      const spanDays = activity.spanDays || 1
      // Add activity to all days it spans
      for (let d = 0; d < spanDays; d++) {
        const dayNum = activity.scheduledDay + d
        // Handle week overflow (activity spanning into next week)
        const weekNum = dayNum > 7 ? activity.scheduledWeek + 1 : activity.scheduledWeek
        const actualDay = dayNum > 7 ? dayNum - 7 : dayNum
        
        const key = `${weekNum}-${actualDay}`
        if (!map[key]) map[key] = []
        // Mark if this is a continuation day (not the start)
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
  
  // Create a map of races by week
  const raceMap = useMemo(() => {
    const map: Record<number, RaceEvent> = {}
    calendar.forEach(race => {
      map[race.week] = race
    })
    return map
  }, [calendar])
  
  // Navigate months
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
  
  const goToToday = () => {
    const today = getMonthFromWeek(currentWeek, currentYear)
    setDisplayMonth(today.month)
    setDisplayYear(today.year)
  }
  
  // Group days into weeks for grid display
  const weeks = useMemo(() => {
    const result: typeof monthDays[] = []
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7))
    }
    return result
  }, [monthDays])
  
  // Get unique week numbers for the row labels
  const _weekNumbers = useMemo(() => {
    const numbers = new Set<number>()
    monthDays.forEach(d => {
      if (d.isCurrentMonth) numbers.add(d.week)
    })
    return Array.from(numbers).sort((a, b) => a - b)
  }, [monthDays])

  return (
    <Card variant="glass" padding="lg" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </h2>
            <p className="text-sm text-text-muted">
              Week {currentWeek} • {getDayName(currentDay)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-text-muted flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-red/30" />
          <span>Race Week</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-blue/30" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-orange/30" />
          <span>Mandatory</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-purple/30 border-l-2 border-accent-purple" />
          <span>Multi-day</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="default" className="h-4 text-[10px] px-1">3</Badge>
          <span>Activities</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="border border-surface-secondary rounded-xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-surface-secondary/50">
          <div className="p-2 text-center text-xs font-medium text-text-muted border-r border-surface-secondary">
            Week
          </div>
          {DAY_HEADERS.map(day => (
            <div 
              key={day}
              className="p-2 text-center text-xs font-medium text-text-muted border-r border-surface-secondary last:border-r-0"
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
              // Get the week number from the first day that's in current month
              const weekNum = weekDays.find(d => d.isCurrentMonth)?.week || weekDays[0].week
              const race = raceMap[weekNum]
              const isCurrentWeekRow = weekNum === currentWeek
              
              return (
                <div 
                  key={weekIndex}
                  className={`
                    grid grid-cols-[60px_repeat(7,1fr)] border-t border-surface-secondary
                    ${isCurrentWeekRow ? 'bg-accent-blue/5' : ''}
                  `}
                >
                  {/* Week Number */}
                  <div className={`
                    p-2 text-center border-r border-surface-secondary flex flex-col items-center justify-center
                    ${isCurrentWeekRow ? 'bg-accent-blue/10' : 'bg-surface-secondary/30'}
                  `}>
                    <span className={`text-sm font-mono font-bold ${isCurrentWeekRow ? 'text-accent-blue' : 'text-text-muted'}`}>
                      {weekNum}
                    </span>
                    {race && (
                      <Flag className="w-3 h-3 text-accent-red mt-1" />
                    )}
                  </div>
                  
                  {/* Day Cells */}
                  {weekDays.map((dayInfo, dayIndex) => {
                    const isToday = dayInfo.week === currentWeek && dayInfo.dayOfWeek === currentDay
                    const isPast = dayInfo.week < currentWeek || 
                      (dayInfo.week === currentWeek && dayInfo.dayOfWeek < currentDay)
                    const activities = activityMap[`${dayInfo.week}-${dayInfo.dayOfWeek}`] || []
                    const hasMandatory = activities.some(a => a.mandatory)
                    const dayRace = dayInfo.dayOfWeek >= 5 && dayInfo.dayOfWeek <= 7 ? race : undefined // Races typically Fri-Sun
                    
                    return (
                      <CalendarDayCell
                        key={dayIndex}
                        day={dayInfo.day}
                        week={dayInfo.week}
                        dayOfWeek={dayInfo.dayOfWeek}
                        isCurrentMonth={dayInfo.isCurrentMonth}
                        isToday={isToday}
                        isPast={isPast}
                        activities={activities}
                        race={dayRace}
                        hasMandatory={hasMandatory}
                        onClick={() => onDayClick(dayInfo.week, dayInfo.dayOfWeek)}
                        onAddActivity={() => onAddActivity(dayInfo.week, dayInfo.dayOfWeek)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Quick Stats */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-text-muted">
            {scheduledActivities.filter(a => a.status === 'scheduled').length} scheduled activities
          </span>
          {mandatoryActivities.length > 0 && (
            <span className="text-accent-orange flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {mandatoryActivities.length} mandatory
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {calendar.filter(r => r.week >= currentWeek).slice(0, 3).map(race => (
            <Badge key={race.id} variant="red" className="text-xs">
              R{race.round}: Week {race.week}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
