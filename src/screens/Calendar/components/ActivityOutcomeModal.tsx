/**
 * ActivityOutcomeModal
 * 
 * Unified completion modal for ALL personal/lifestyle/social activities.
 * Shows an AI-generated narrative, stat effects breakdown, relationship
 * meter changes, bonus indicators, and contextual reactions.
 * 
 * Adapts its display based on the activity category:
 * - social/romance: relationship meters, love language bonuses, partner reaction
 * - fitness: fitness/health/stress stats, driver fitness link
 * - wellness: stress/health/mental strength
 * - hobby: skill progress bar, stress reduction
 * - education: module progress bar, course completion %
 * - pet: pet happiness, stress reduction
 * - family: family bond, partner happiness
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  HeartHandshake,
  Home,
  Dumbbell,
  Leaf,
  GraduationCap,
  Palette,
  PawPrint,
  Heart,
  Star,
  Loader2,
  Sparkles,
  Check,
  Target,
  X,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  Smile,
  ArrowRight,
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import type { ScheduledActivity, ActivityCategory } from '@/store/careerStore'
import { generateActivityOutcomeNarrative, type ActivityOutcomeContext } from '@/services/eventContentGenerator'

// ============================================
// TYPES
// ============================================

export interface DisplayableEffect {
  key: string
  label: string
  value: number
  isPositive: boolean
  icon?: typeof Heart
  color?: string
}

export interface BonusBreakdown {
  label: string
  description: string
  multiplier: number  // e.g., 1.5 for +50%
  active: boolean
}

export interface MeterChange {
  label: string
  before: number
  after: number
  max: number
  color: string
}

export interface ActivityOutcomeData {
  narrative?: string                   // AI-generated (loaded async)
  appliedEffects: DisplayableEffect[]
  bonuses?: BonusBreakdown[]
  meterChanges?: MeterChange[]
  partnerReaction?: string
  outcomeQuality: 'great' | 'good' | 'neutral' | 'poor'
  narrativeContext: ActivityOutcomeContext  // For generating AI narrative
}

interface ActivityOutcomeModalProps {
  isOpen: boolean
  activity: ScheduledActivity | null
  outcomeData: ActivityOutcomeData | null
  onDone: (activityId: string) => void
  onClose: () => void
}

// ============================================
// CATEGORY DISPLAY HELPERS
// ============================================

function getCategoryIcon(category: ActivityCategory) {
  switch (category) {
    case 'social': return Users
    case 'romance': return HeartHandshake
    case 'family': return Home
    case 'fitness': return Dumbbell
    case 'wellness': return Leaf
    case 'education': return GraduationCap
    case 'hobby': return Palette
    case 'pet': return PawPrint
    case 'personal': return Heart
    case 'lifestyle': return Star
    default: return Heart
  }
}

function getCategoryColor(category: ActivityCategory) {
  switch (category) {
    case 'social': return 'text-pink-400'
    case 'romance': return 'text-rose-400'
    case 'family': return 'text-amber-400'
    case 'fitness': return 'text-cyan-400'
    case 'wellness': return 'text-teal-400'
    case 'education': return 'text-indigo-400'
    case 'hobby': return 'text-emerald-400'
    case 'pet': return 'text-orange-400'
    case 'personal': return 'text-status-success'
    case 'lifestyle': return 'text-status-success'
    default: return 'text-text-muted'
  }
}

function getCategoryBg(category: ActivityCategory) {
  switch (category) {
    case 'social': return 'bg-pink-400/20'
    case 'romance': return 'bg-rose-400/20'
    case 'family': return 'bg-amber-400/20'
    case 'fitness': return 'bg-cyan-400/20'
    case 'wellness': return 'bg-teal-400/20'
    case 'education': return 'bg-indigo-400/20'
    case 'hobby': return 'bg-emerald-400/20'
    case 'pet': return 'bg-orange-400/20'
    case 'personal': return 'bg-status-success/20'
    case 'lifestyle': return 'bg-status-success/20'
    default: return 'bg-surface-secondary'
  }
}

function getCategoryLabel(category: ActivityCategory) {
  switch (category) {
    case 'social': return 'Social'
    case 'romance': return 'Romance'
    case 'family': return 'Family'
    case 'fitness': return 'Fitness'
    case 'wellness': return 'Wellness'
    case 'education': return 'Education'
    case 'hobby': return 'Hobby'
    case 'pet': return 'Pet Care'
    case 'personal': return 'Personal'
    case 'lifestyle': return 'Lifestyle'
    default: return 'Activity'
  }
}

function getOutcomeQualityLabel(quality: string) {
  switch (quality) {
    case 'great': return { label: 'Outstanding', color: 'text-status-success', bg: 'bg-status-success/20' }
    case 'good': return { label: 'Went Well', color: 'text-accent-blue', bg: 'bg-accent-blue/20' }
    case 'neutral': return { label: 'Uneventful', color: 'text-text-muted', bg: 'bg-surface-secondary' }
    case 'poor': return { label: 'Could Be Better', color: 'text-accent-orange', bg: 'bg-accent-orange/20' }
    default: return { label: 'Complete', color: 'text-text-muted', bg: 'bg-surface-secondary' }
  }
}

function getEffectIcon(key: string) {
  switch (key) {
    case 'affection': return Heart
    case 'trust': return Shield
    case 'romance': return HeartHandshake
    case 'stressReduction': case 'stress': return Brain
    case 'fitnessBonus': case 'fitness': return Dumbbell
    case 'healthBonus': case 'health': return Leaf
    case 'happinessBoost': case 'happiness': return Smile
    case 'skillProgress': return TrendingUp
    case 'petHappiness': return PawPrint
    case 'moduleProgress': return GraduationCap
    case 'mentalStrength': return Brain
    case 'confidence': return Zap
    default: return Star
  }
}

// ============================================
// COMPONENT
// ============================================

export function ActivityOutcomeModal({
  isOpen,
  activity,
  outcomeData,
  onDone,
  onClose,
}: ActivityOutcomeModalProps) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate AI narrative when modal opens
  useEffect(() => {
    if (isOpen && outcomeData && !narrative) {
      setIsGenerating(true)
      generateActivityOutcomeNarrative(outcomeData.narrativeContext)
        .then((text) => setNarrative(text))
        .catch(() => setNarrative('The activity went as expected.'))
        .finally(() => setIsGenerating(false))
    }
    if (!isOpen) {
      setNarrative(null)
      setIsGenerating(false)
    }
  }, [isOpen, outcomeData])

  if (!isOpen || !activity || !outcomeData) return null

  const category = activity.category || 'personal'
  const CategoryIcon = getCategoryIcon(category as ActivityCategory)
  const categoryColor = getCategoryColor(category as ActivityCategory)
  const categoryBg = getCategoryBg(category as ActivityCategory)
  const categoryLabel = getCategoryLabel(category as ActivityCategory)
  const outcomeInfo = getOutcomeQualityLabel(outcomeData.outcomeQuality)
  const hasRelationshipBonuses = outcomeData.bonuses && outcomeData.bonuses.length > 0
  const hasMeterChanges = outcomeData.meterChanges && outcomeData.meterChanges.length > 0

  const handleDone = () => {
    onDone(activity.id)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !isGenerating && handleDone()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1A1A1E] border border-surface-secondary rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-secondary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${categoryBg} flex items-center justify-center`}>
                    <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold">{activity.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${categoryColor}`}>{categoryLabel}</span>
                      <span className="text-xs text-text-muted">•</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${outcomeInfo.bg} ${outcomeInfo.color}`}>
                        {outcomeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDone}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <AnimatePresence mode="wait">
                {/* Loading state */}
                {isGenerating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10"
                  >
                    <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                    <p className="text-text-muted text-sm">Completing activity...</p>
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-gold" />
                      Generating summary...
                    </p>
                  </motion.div>
                )}

                {/* Content ready */}
                {!isGenerating && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Success header */}
                    <div className="text-center">
                      <CheckCircle className={`w-12 h-12 mx-auto mb-2 ${categoryColor}`} />
                      <h3 className="text-lg font-display font-bold">Activity Complete</h3>
                    </div>

                    {/* AI Narrative */}
                    {narrative && (
                      <Card variant="surface" padding="lg">
                        <p className="text-text-secondary leading-relaxed whitespace-pre-line text-sm">
                          {narrative}
                        </p>
                      </Card>
                    )}

                    {/* Relationship Meter Changes (before → after bars) */}
                    {hasMeterChanges && (
                      <Card variant="surface" padding="lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-accent-blue" />
                          Relationship Changes
                        </h4>
                        <div className="space-y-3">
                          {outcomeData.meterChanges!.map((meter) => {
                            const delta = meter.after - meter.before
                            const isPositive = delta > 0
                            return (
                              <div key={meter.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-text-muted">{meter.label}</span>
                                  <span className={`font-bold ${isPositive ? 'text-status-success' : 'text-status-error'}`}>
                                    {isPositive ? '+' : ''}{delta.toFixed(1)}
                                    <span className="text-text-muted font-normal ml-1">
                                      ({Math.round(meter.before)} <ArrowRight className="w-3 h-3 inline" /> {Math.round(meter.after)})
                                    </span>
                                  </span>
                                </div>
                                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden relative">
                                  {/* Before value (dimmed) */}
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full opacity-30"
                                    style={{
                                      width: `${(meter.before / meter.max) * 100}%`,
                                      backgroundColor: meter.color,
                                    }}
                                  />
                                  {/* After value */}
                                  <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ backgroundColor: meter.color }}
                                    initial={{ width: `${(meter.before / meter.max) * 100}%` }}
                                    animate={{ width: `${(meter.after / meter.max) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )}

                    {/* Bonus Indicators (love language, shared interests) */}
                    {hasRelationshipBonuses && (
                      <Card variant="surface" padding="lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-accent-gold" />
                          Bonuses
                        </h4>
                        <div className="space-y-2">
                          {outcomeData.bonuses!.map((bonus, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                bonus.active
                                  ? 'bg-accent-gold/10 border border-accent-gold/30'
                                  : 'bg-surface-secondary/30 opacity-50'
                              }`}
                            >
                              <div>
                                <span className={`font-medium ${bonus.active ? 'text-accent-gold' : 'text-text-muted'}`}>
                                  {bonus.label}
                                </span>
                                <p className="text-text-muted text-[10px] mt-0.5">{bonus.description}</p>
                              </div>
                              {bonus.active && (
                                <span className="text-accent-gold font-bold whitespace-nowrap ml-2">
                                  +{Math.round((bonus.multiplier - 1) * 100)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Effects Grid */}
                    {outcomeData.appliedEffects.length > 0 && (
                      <Card variant="surface" padding="lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-accent-blue" />
                          Effects
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {outcomeData.appliedEffects.map((effect) => {
                            const EffectIcon = effect.icon || getEffectIcon(effect.key)
                            return (
                              <div
                                key={effect.key}
                                className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary/30"
                              >
                                <EffectIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  effect.isPositive ? 'text-status-success' : 'text-status-error'
                                }`} />
                                <span className="text-xs text-text-muted truncate">{effect.label}</span>
                                <span className={`text-xs font-bold ml-auto ${
                                  effect.isPositive ? 'text-status-success' : 'text-status-error'
                                }`}>
                                  {effect.isPositive ? '+' : ''}{typeof effect.value === 'number' && effect.value % 1 !== 0 ? effect.value.toFixed(1) : effect.value}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )}

                    {/* Partner/Contact Reaction */}
                    {outcomeData.partnerReaction && (
                      <div className="text-center py-2">
                        <p className="text-sm text-text-secondary italic">
                          "{outcomeData.partnerReaction}"
                        </p>
                      </div>
                    )}

                    {/* Done button */}
                    <div className="flex justify-center pt-2">
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
