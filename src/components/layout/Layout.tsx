import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Calendar, FastForward, Flag } from 'lucide-react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { FloatingHelpButton } from '@/components/Help'
import { EndDayModal } from '@/components/owner/EndDayModal'
import { FastForwardConfigModal } from './FastForwardConfigModal'
import { useCareerStore, getDayName } from '@/store/careerStore'
import { getDaySummary } from '@/simulation/timeBudget'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function Layout({ children, showSidebar = false }: LayoutProps) {
  const location = useLocation()
  const isMenuScreen = location.pathname === '/' || location.pathname === '/menu'
  const shouldShowSidebar = showSidebar && !isMenuScreen

  const { careerState, advanceDay, getActivitiesForDay, fastForwardPeriod, stopFastForward } = useCareerStore()
  const currentDay = careerState?.currentDay ?? 1
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2024
  const dayBudget = careerState?.dayBudget
  const daySummary = dayBudget ? getDaySummary(dayBudget) : null
  const hoursRemaining = daySummary?.hoursRemaining ?? dayBudget?.hoursRemaining ?? 16
  const activitiesCompleted = daySummary?.activitiesCompleted ?? dayBudget?.dayLog?.length ?? 0
  const incompleteActivities = getActivitiesForDay ? getActivitiesForDay(currentWeek, currentDay) : []
  const missedNotificationsToday = (careerState?.missedNotifications ?? []).filter(
    notification => notification.timestamp.week === currentWeek
      && notification.timestamp.day === currentDay
      && notification.timestamp.year === currentYear
  )
  const [showEndDayModal, setShowEndDayModal] = useState(false)
  const [showFFConfig, setShowFFConfig] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [transitionInfo, setTransitionInfo] = useState({ day: 1, week: 1, year: 2024 })

  const isFastForwarding = careerState?.fastForward?.isActive ?? false
  const ffTargetWeek = careerState?.fastForward?.targetWeek
  const ffSkippedDays = careerState?.fastForward?.skippedDays ?? 0
  const ffStopReason = careerState?.fastForward?.lastStopReason

  const handleEndDay = () => setShowEndDayModal(true)

  const handleConfirmEndDay = () => {
    setShowEndDayModal(false)
    const cd = careerState?.currentDay ?? 1
    const cw = careerState?.currentWeek ?? 1
    const cy = careerState?.currentYear ?? 2024
    const newDay = cd >= 7 ? 1 : cd + 1
    const newWeek = cd >= 7 ? cw + 1 : cw
    const newYear = cd >= 7 && cw >= 52 ? cy + 1 : cy
    setTransitionInfo({ day: newDay, week: newWeek > 52 ? 1 : newWeek, year: newYear })
    setShowTransition(true)
    advanceDay()
    setTimeout(() => setShowTransition(false), 1500)
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {/* ── Figma Sidebar (96px black) ── */}
        {shouldShowSidebar && <Sidebar />}

        {/* ── Main Content ── */}
        <main className="flex-1 min-h-0 min-w-0 relative overflow-hidden bg-white">
          {children}
          {shouldShowSidebar && <FloatingHelpButton />}
        </main>
      </div>

      {/* Modals rendered at top level */}
      <FastForwardConfigModal isOpen={showFFConfig} onClose={() => setShowFFConfig(false)} />
      <EndDayModal
        isOpen={showEndDayModal}
        onClose={() => setShowEndDayModal(false)}
        onConfirm={handleConfirmEndDay}
        hoursRemaining={hoursRemaining}
        activitiesCompleted={activitiesCompleted}
        missedNotifications={missedNotificationsToday}
        incompleteActivities={incompleteActivities}
      />

      {/* ── Day Transition Overlay ── */}
      <AnimatePresence>
        {showTransition && !isFastForwarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-black flex items-center justify-center border-2 border-black"
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[#99a1af] text-lg mb-2"
                style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}
              >
                TIME ADVANCES
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.3 }}
                className="text-4xl text-black"
                style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}
              >
                {getDayName(transitionInfo.day)}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[#4a5565] text-xl mt-2"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                Week {transitionInfo.week}, Season {transitionInfo.year}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fast-Forward Overlay ── */}
      <AnimatePresence>
        {isFastForwarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center"
          >
            <div className="text-center" style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-black border-2 border-white/20 flex items-center justify-center"
              >
                <FastForward className="w-10 h-10 text-white" />
              </motion.div>
              <p className="text-[#99a1af] text-sm tracking-widest mb-3">FAST FORWARD</p>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`${currentWeek}-${currentDay}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-5xl text-white"
                >
                  {getDayName(currentDay)}
                </motion.h2>
              </AnimatePresence>
              <p className="text-[#4a5565] text-xl mt-2" style={{ fontFamily: "'Arial', sans-serif" }}>
                Week {currentWeek}, Season {currentYear}
              </p>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                <div className="text-[#99a1af]">
                  <span className="text-white font-mono">{ffSkippedDays}</span> days skipped
                </div>
                {ffTargetWeek && (
                  <div className="text-[#99a1af] flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-white" />
                    Target: Week {ffTargetWeek}
                  </div>
                )}
              </div>
              <button
                onClick={() => stopFastForward('manual', 'Fast forward stopped by player.')}
                className="mt-8 px-6 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm hover:bg-white/20 transition-colors"
              >
                Stop Fast Forward
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
