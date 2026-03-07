/**
 * WeekAtAGlance — Premium 7-day strip for home screen bottom
 * Shows activities per day, current day highlighted with red-to-orange gradient.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCareerStore } from '@/store/careerStore'
import { getWeeklyOverview } from '@/simulation/activities/suggestionEngine'

export function WeekAtAGlance() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const weekData = useMemo(() => {
    if (!careerState) return null
    return getWeeklyOverview(careerState)
  }, [careerState])

  const currentDay = careerState?.currentDay ?? 1

  if (!careerState || !weekData || weekData.length === 0) return null

  return (
    <div
      className="flex items-stretch gap-1 rounded-xl p-1.5"
      style={{
        background: 'linear-gradient(135deg, rgba(30,30,34,0.9) 0%, rgba(20,20,24,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {weekData.map((day, idx) => {
        const isCurrent = day.day === currentDay
        const isPast = day.day < currentDay
        const hasActivities = day.activities.length > 0
        return (
          <motion.button
            key={day.day}
            onClick={() => navigate('/calendar')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`flex-1 flex flex-col items-center justify-center min-w-0 py-2.5 px-1 rounded-lg transition-all duration-200 ${
              isCurrent ? 'shadow-lg' : isPast ? 'opacity-50' : 'hover:bg-white/[0.03]'
            }`}
            style={isCurrent ? {
              background: 'linear-gradient(135deg, rgba(225,6,0,0.15) 0%, rgba(255,128,0,0.1) 100%)',
              border: '1px solid rgba(225,6,0,0.25)',
              boxShadow: '0 0 20px rgba(225,6,0,0.1)',
            } : {
              border: '1px solid transparent',
            }}
          >
            <span className={`text-[10px] font-display font-bold uppercase tracking-wider ${
              isCurrent ? 'text-orange-400' : isPast ? 'text-slate-600' : 'text-slate-500'
            }`}>
              {day.dayName.slice(0, 3)}
            </span>

            <div className="flex gap-[3px] mt-1.5">
              {hasActivities ? (
                day.activities.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: isCurrent
                        ? 'linear-gradient(135deg, #E10600, #FF8000)'
                        : isPast
                          ? 'rgba(100,116,139,0.3)'
                          : 'rgba(148,163,184,0.4)',
                    }}
                  />
                ))
              ) : (
                <span className={`text-[8px] ${isPast ? 'text-slate-700' : 'text-slate-600'}`}>—</span>
              )}
            </div>

            {day.free <= 2 && (
              <span
                className="text-[8px] font-mono font-bold mt-1"
                style={{ color: '#E10600' }}
              >
                {day.free}h
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
