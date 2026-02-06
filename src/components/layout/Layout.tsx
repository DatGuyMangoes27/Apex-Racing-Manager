import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { FloatingHelpButton } from '@/components/Help'
import { EndDayModal } from '@/components/owner/EndDayModal'
import { useCareerStore, getDayName } from '@/store/careerStore'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function Layout({ children, showSidebar = false }: LayoutProps) {
  const { careerState, advanceDay } = useCareerStore()
  const [showEndDayModal, setShowEndDayModal] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [transitionInfo, setTransitionInfo] = useState({ day: 1, week: 1, year: 2024 })

  const handleEndDay = () => {
    setShowEndDayModal(true)
  }

  const handleConfirmEndDay = () => {
    setShowEndDayModal(false)
    const currentDay = careerState?.currentDay ?? 1
    const currentWeek = careerState?.currentWeek ?? 1
    const currentYear = careerState?.currentYear ?? 2024
    const newDay = currentDay >= 7 ? 1 : currentDay + 1
    const newWeek = currentDay >= 7 ? currentWeek + 1 : currentWeek
    const newYear = currentDay >= 7 && currentWeek >= 52 ? currentYear + 1 : currentYear
    setTransitionInfo({ day: newDay, week: newWeek > 52 ? 1 : newWeek, year: newYear })
    setShowTransition(true)
    advanceDay()
    setTimeout(() => setShowTransition(false), 1500)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar onEndDay={handleEndDay} />}
        <main className="flex-1 overflow-auto relative">
          <div className="min-h-full p-6">
            {children}
          </div>
          {/* Floating help button on all screens */}
          {showSidebar && <FloatingHelpButton />}
        </main>
      </div>

      {/* End Day Modal - rendered at top level to escape sidebar stacking context */}
      <EndDayModal
        isOpen={showEndDayModal}
        onClose={() => setShowEndDayModal(false)}
        onConfirmEndDay={handleConfirmEndDay}
      />

      {/* Day Transition Overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
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
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center"
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-text-muted text-lg mb-2"
              >
                TIME ADVANCES
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.3 }}
                className="font-display font-black text-4xl bg-gradient-to-r from-accent-red via-accent-orange to-accent-gold bg-clip-text text-transparent"
              >
                {getDayName(transitionInfo.day)}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-text-secondary text-xl mt-2"
              >
                Week {transitionInfo.week}, Season {transitionInfo.year}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-2 mt-8"
              >
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i + 1 === transitionInfo.day ? 'bg-accent-red' : 'bg-surface-secondary'}`}
                    animate={i + 1 === transitionInfo.day ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: 2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


