/**
 * WeeklyOverviewBar — Compact Mon-Sun overview listing activities per day
 * 
 * Shows each day of the current week with activities listed by name.
 * Respects partial weeks (e.g. Week 1 starting on Thursday if Jan 1 is Thu).
 * Current day is highlighted with a glow.
 * Clicking a day navigates to the Calendar.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, AlertTriangle, Users, Heart, Car } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card, CardHeader } from '@/components/ui'
import { getWeeklyOverview, type DayOverview } from '@/simulation/activities/suggestionEngine'

function getCategoryIcon(type: string) {
  switch (type) {
    case 'mandatory': return AlertTriangle
    case 'team': return Users
    case 'personal': return Heart
    case 'driving': return Car
    default: return Clock
  }
}

function getCategoryTextColor(type: string): string {
  switch (type) {
    case 'mandatory': return 'text-accent-red'
    case 'team': return 'text-accent-blue'
    case 'personal': return 'text-status-success'
    case 'driving': return 'text-accent-orange'
    default: return 'text-text-muted'
  }
}

export function WeeklyOverviewBar() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const weekData = useMemo(() => {
    if (!careerState) return null
    return getWeeklyOverview(careerState)
  }, [careerState])

  const currentDay = careerState?.currentDay ?? 1

  if (!careerState || !weekData) return null

  const totalFreeHours = weekData.reduce((s, d) => s + d.free, 0)

  return (
    <Card>
      <CardHeader
        title="This Week"
        subtitle={`Week ${careerState.currentWeek} — ${totalFreeHours}h free time remaining`}
        icon={<Calendar className="w-4 h-4" />}
      />
      <div className="p-4">
        {/* Day columns */}
        <div className="flex gap-2">
          {weekData.map((day) => (
            <DayColumn
              key={day.day}
              day={day}
              isCurrent={day.day === currentDay}
              onClick={() => navigate('/calendar')}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

function DayColumn({
  day,
  isCurrent,
  onClick,
}: {
  day: DayOverview
  isCurrent: boolean
  onClick: () => void
}) {
  const scheduledCount = day.activities.length
  const usedHours = 16 - day.free

  return (
    <motion.div
      className={`flex-1 cursor-pointer rounded-lg transition-all border p-2 ${
        isCurrent
          ? 'ring-2 ring-accent-orange/50 border-accent-orange/30 bg-accent-orange/5'
          : 'border-surface-border/50 hover:bg-surface-secondary/30'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Day label + hours */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[11px] font-mono font-semibold ${
          isCurrent ? 'text-accent-orange' : 'text-text-muted'
        }`}>
          {day.dayName.slice(0, 3)}
        </span>
        <span className={`text-[9px] font-mono ${
          day.free <= 2 ? 'text-accent-red' : day.free <= 5 ? 'text-accent-orange' : 'text-text-muted'
        }`}>
          {day.free}h free
        </span>
      </div>

      {/* Activity list */}
      <div className="space-y-1 min-h-[60px]">
        {day.activities.length > 0 ? (
          <>
            {day.activities.slice(0, 3).map((act, i) => {
              const Icon = getCategoryIcon(act.type)
              const textColor = getCategoryTextColor(act.type)
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 text-[9px]"
                >
                  <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${textColor}`} />
                  <span className="text-text-secondary truncate flex-1">{act.name}</span>
                  <span className="text-text-muted flex-shrink-0">{act.hours}h</span>
                </div>
              )
            })}
            {day.activities.length > 3 && (
              <span className="text-[9px] text-text-muted">
                +{day.activities.length - 3} more
              </span>
            )}
          </>
        ) : (
          <span className="text-[9px] text-text-muted/50 italic">No activities</span>
        )}
      </div>
    </motion.div>
  )
}
