import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { TutorialStep, getTutorialProgress } from './tutorialSteps'
import { Button } from '@/components/ui'

interface TutorialOverlayProps {
  step: TutorialStep
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onNavigate: (path: string) => void
  canGoBack: boolean
  stepNumber: number
  totalSteps: number
}

export function TutorialOverlay({
  step,
  onNext,
  onPrevious,
  onSkip,
  onNavigate,
  canGoBack,
  stepNumber,
  totalSteps
}: TutorialOverlayProps) {
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Find and highlight target element
  useEffect(() => {
    if (step.targetSelector && step.highlight) {
      const targetElement = document.querySelector(step.targetSelector)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        setSpotlightRect(rect)
        
        // Scroll element into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setSpotlightRect(null)
      }
    } else {
      setSpotlightRect(null)
    }
  }, [step.targetSelector, step.highlight])

  const handleAction = () => {
    if (step.action?.type === 'navigate' && step.action.path) {
      onNavigate(step.action.path)
    } else if (step.action?.type === 'complete') {
      onNext()
    } else {
      onNext()
    }
  }

  const progress = getTutorialProgress(step.id)

  // Calculate tooltip position based on spotlight
  const getTooltipStyle = () => {
    if (!spotlightRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const padding = 20
    const _tooltipWidth = 400

    switch (step.position) {
      case 'top':
        return {
          top: `${spotlightRect.top - padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: `${spotlightRect.bottom + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.left - padding}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.right + padding}px`,
          transform: 'translate(0, -50%)'
        }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }
  }

  return (
    <AnimatePresence>
      <div ref={overlayRef} className="fixed inset-0 z-[200]">
        {/* Backdrop with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          {spotlightRect ? (
            <svg className="w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={spotlightRect.left - 8}
                    y={spotlightRect.top - 8}
                    width={spotlightRect.width + 16}
                    height={spotlightRect.height + 16}
                    rx="8"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.8)"
                mask="url(#spotlight-mask)"
              />
              {/* Spotlight border */}
              <rect
                x={spotlightRect.left - 8}
                y={spotlightRect.top - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx="8"
                fill="none"
                stroke="rgba(255, 128, 0, 0.5)"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          ) : (
            <div className="w-full h-full bg-black/80 backdrop-blur-sm" />
          )}
        </motion.div>

        {/* Tutorial Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={getTooltipStyle()}
          className="absolute w-[400px] max-w-[90vw] pointer-events-auto"
        >
          <div className="bg-surface border border-accent-orange/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-gradient-to-r from-accent-orange/20 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-orange" />
                </div>
                <span className="text-sm text-text-muted">
                  Step {stepNumber} of {totalSteps}
                </span>
              </div>
              <button
                onClick={onSkip}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-secondary transition-colors"
                title="Skip Tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-surface-secondary">
              <motion.div
                className="h-full bg-accent-orange"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-border bg-background/50 flex items-center justify-between">
              <div>
                {canGoBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevious}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-text-muted"
                >
                  Skip Tutorial
                </Button>
                <Button
                  variant="racing"
                  size="sm"
                  onClick={handleAction}
                >
                  {step.action?.label || 'Next'}
                  {step.action?.type !== 'complete' && (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
