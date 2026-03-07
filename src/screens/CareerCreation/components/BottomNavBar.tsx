import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowRight, Play } from 'lucide-react'
import { useCareerCreation } from '../CareerCreationContext'

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }

const STEP_LABELS: Record<string, string> = {
  background: 'Background',
  location: 'Headquarters',
  teamIdentity: 'Team Identity',
  managerCreation: 'Create Manager',
  review: 'Review',
}

interface BottomNavBarProps {
  onStartCareer?: () => void
  forwardDisabled?: boolean
}

export default function BottomNavBar({ onStartCareer, forwardDisabled }: BottomNavBarProps) {
  const {
    currentStep,
    stepOrder,
    currentStepIndex,
    canGoBack,
    canGoForward,
    isLastStep,
    goBack,
    goForward,
  } = useCareerCreation()

  // BackgroundStep and LocationStep have their own navigation
  if (currentStep === 'background' || currentStep === 'location') return null

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="shrink-0"
      style={{ borderTop: '0.8px solid rgba(0,0,0,0.2)', background: 'white' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Back button */}
        <div className="w-40">
          {canGoBack && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#4a5565] hover:text-[#0a0a0a] transition-colors"
              style={FONT_BLACK}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">BACK</span>
            </motion.button>
          )}
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-2">
          {stepOrder.map((step, idx) => {
            const isActive = idx === currentStepIndex
            const isPast = idx < currentStepIndex
            return (
              <motion.div
                key={step}
                animate={{
                  width: isActive ? 32 : 8,
                  backgroundColor: isActive
                    ? '#000000'
                    : isPast
                      ? 'rgba(0,0,0,0.5)'
                      : 'rgba(0,0,0,0.15)',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            )
          })}
        </div>

        {/* Forward / Start button */}
        <div className="w-40 flex justify-end">
          <AnimatePresence mode="wait">
            {isLastStep ? (
              <motion.button
                key="start"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                whileHover={{ scale: forwardDisabled ? 1 : 1.03 }}
                whileTap={{ scale: forwardDisabled ? 1 : 0.97 }}
                onClick={onStartCareer}
                disabled={forwardDisabled}
                className="bg-black rounded-2xl flex items-center gap-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: 48 }}
              >
                <span className="text-base text-white leading-6" style={FONT_BLACK}>
                  START
                </span>
                <Play className="w-5 h-5 text-white fill-white" />
              </motion.button>
            ) : (
              <motion.button
                key="continue"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                whileHover={{ scale: forwardDisabled ? 1 : 1.03 }}
                whileTap={{ scale: forwardDisabled ? 1 : 0.97 }}
                onClick={goForward}
                disabled={forwardDisabled}
                className="bg-black rounded-2xl flex items-center gap-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: 48 }}
              >
                <span className="text-base text-white leading-6" style={FONT_BLACK}>
                  CONTINUE
                </span>
                <ArrowRight className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
