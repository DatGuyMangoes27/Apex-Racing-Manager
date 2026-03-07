/**
 * ActivityCompletionModal
 * Shows an AI-generated narrative summary and stat effects for auto-complete
 * activities (informational, routine, or tutorial activities that skip the
 * interactive EventGameplayModal).
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Briefcase,
  Mic,
  Building2,
  Star,
  Loader2,
  Sparkles,
  Check,
  Target,
  X,
  CheckCircle,
  HeartHandshake,
  Home,
  Dumbbell,
  Leaf,
  GraduationCap,
  Palette,
  PawPrint,
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import type { ScheduledActivity } from '@/store/careerStore'
import { generateCompletionNarrative } from '@/services/eventContentGenerator'

interface ActivityCompletionModalProps {
  isOpen: boolean
  activity: ScheduledActivity | null
  onDone: (activityId: string) => void
  onClose: () => void
}

// Category icon helper (mirrors EventGameplayModal)
function getCategoryIcon(category: string) {
  switch (category) {
    case 'sponsor': return Briefcase
    case 'team': return Users
    case 'media': return Mic
    case 'development': return Building2
    case 'personal': return Star
    case 'social': return Users
    case 'romance': return HeartHandshake
    case 'family': return Home
    case 'fitness': return Dumbbell
    case 'wellness': return Leaf
    case 'education': return GraduationCap
    case 'hobby': return Palette
    case 'pet': return PawPrint
    default: return Building2
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'sponsor': return 'text-accent-gold'
    case 'team': return 'text-accent-blue'
    case 'media': return 'text-accent-red'
    case 'development': return 'text-accent-purple'
    case 'personal': return 'text-status-success'
    case 'social': return 'text-pink-400'
    case 'romance': return 'text-rose-400'
    case 'family': return 'text-amber-400'
    case 'fitness': return 'text-cyan-400'
    case 'wellness': return 'text-teal-400'
    case 'education': return 'text-indigo-400'
    case 'hobby': return 'text-emerald-400'
    case 'pet': return 'text-orange-400'
    default: return 'text-text-muted'
  }
}

export function ActivityCompletionModal({
  isOpen,
  activity,
  onDone,
  onClose,
}: ActivityCompletionModalProps) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate narrative when modal opens
  useEffect(() => {
    if (isOpen && activity && !narrative) {
      setIsGenerating(true)
      generateCompletionNarrative(activity)
        .then((text) => {
          setNarrative(text)
        })
        .catch(() => {
          setNarrative(
            `You completed ${activity.name}. ${activity.description || 'The activity went as expected.'}`
          )
        })
        .finally(() => {
          setIsGenerating(false)
        })
    }
    // Reset when modal closes
    if (!isOpen) {
      setNarrative(null)
      setIsGenerating(false)
    }
  }, [isOpen, activity])

  if (!isOpen || !activity) return null

  const CategoryIcon = getCategoryIcon(activity.category)
  const categoryColor = getCategoryColor(activity.category)
  const effects = activity.effectsOnComplete || {}

  // Build displayable effects list
  const effectEntries = Object.entries(effects).filter(
    ([, value]) => value !== undefined && value !== 0 && typeof value !== 'boolean'
  )

  const handleDone = () => {
    onDone(activity.id)
    onClose()
  }

  const handleBackdropClick = () => {
    // Don't allow closing while loading
    if (!isGenerating) {
      handleDone()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1A1A1E] border border-surface-secondary rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-secondary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                  <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold">{activity.name}</h2>
                  <p className="text-sm text-text-muted">
                    {activity.configuration?.venueName || 'Team HQ'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDone}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Loading */}
                {isGenerating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                    <p className="text-text-muted">Completing activity...</p>
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-gold" />
                      Generating summary...
                    </p>
                  </motion.div>
                )}

                {/* Summary ready */}
                {!isGenerating && narrative && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Success icon + heading */}
                    <div className="text-center">
                      <CheckCircle className="w-14 h-14 text-status-success mx-auto mb-3" />
                      <h3 className="text-xl font-display font-bold mb-1">
                        Activity Complete
                      </h3>
                      <p className="text-sm text-text-muted">{activity.name}</p>
                    </div>

                    {/* AI narrative */}
                    <Card variant="surface" padding="lg">
                      <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                        {narrative}
                      </p>
                    </Card>

                    {/* Effects grid */}
                    {effectEntries.length > 0 && (
                      <Card variant="surface" padding="lg">
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-accent-blue" />
                          Results
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {effectEntries.map(([key, value]) => {
                            const isPositive =
                              typeof value === 'number' && value > 0
                            const displayKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .trim()
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/30"
                              >
                                <span className="text-sm text-text-muted capitalize">
                                  {displayKey}
                                </span>
                                <span
                                  className={`font-bold ${
                                    isPositive
                                      ? 'text-status-success'
                                      : 'text-status-error'
                                  }`}
                                >
                                  {isPositive ? '+' : ''}
                                  {value}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )}

                    {/* Done button */}
                    <div className="flex justify-center">
                      <Button
                        variant="primary"
                        onClick={handleDone}
                        className="min-w-[200px]"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
