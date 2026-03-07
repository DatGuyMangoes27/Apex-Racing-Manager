import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Check, ArrowRight, Calendar } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import type { QuickDecisionPrompt, QuickDecisionOption } from '@/simulation/dailyBriefing'

export function QuickDecisionCard() {
  const { careerState } = useCareerStore()
  const applyQuickDecisionEffects = useCareerStore(s => s.applyQuickDecisionEffects)
  const [selectedOption, setSelectedOption] = useState<QuickDecisionOption | null>(null)
  const [effectsSummary, setEffectsSummary] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)
  
  const dailyBriefing = (careerState as any)?.dailyBriefing
  const quickDecision = dailyBriefing?.quickDecision as QuickDecisionPrompt | null | undefined
  
  if (!quickDecision || dismissed || selectedOption) {
    if (selectedOption) {
      // Determine if outcome was positive, negative, or neutral based on effects
      const hasPositiveEffects = effectsSummary.some(e => e.includes('↑') || e.includes('+$') || e.includes('📅'))
      const hasNegativeEffects = effectsSummary.some(e => e.includes('↓') || e.includes('-$'))
      const borderColor = hasPositiveEffects && !hasNegativeEffects
        ? 'border-l-status-success'
        : hasNegativeEffects && !hasPositiveEffects
          ? 'border-l-status-warning'
          : 'border-l-accent-blue'
      
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`border-l-4 ${borderColor}`}>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-status-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-status-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{quickDecision?.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{selectedOption.resultMessage}</p>
                  
                  {/* Effects summary */}
                  {effectsSummary.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {effectsSummary.map((effect, i) => {
                        const isPositive = effect.includes('↑') || effect.includes('+$') || effect.includes('📅') || effect.includes('🔍')
                        const isNegative = effect.includes('↓') || effect.includes('-$')
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                              isPositive
                                ? 'bg-green-500/10 text-green-400'
                                : isNegative
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-blue-500/10 text-blue-400'
                            }`}
                          >
                            {effect}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    }
    return null
  }
  
  const handleSelect = (option: QuickDecisionOption) => {
    setSelectedOption(option)
    
    // Apply effects through the store action
    const result = applyQuickDecisionEffects(
      quickDecision.id,
      option.id,
      option.effects,
      quickDecision.title,
      option.text,
      option.scheduleActivityId
    )
    
    setEffectsSummary(result.effectsSummary)
  }
  
  // Build preview hints for each option
  const getOptionHints = (option: QuickDecisionOption): string[] => {
    const hints: string[] = []
    const e = option.effects
    if (option.scheduleActivityId) hints.push('Schedules activity')
    if (e.budgetImpact && e.budgetImpact < 0) hints.push(`-$${Math.abs(e.budgetImpact).toLocaleString()}`)
    if (e.budgetImpact && e.budgetImpact > 0) hints.push(`+$${e.budgetImpact.toLocaleString()}`)
    if (e.cash && e.cash < 0) hints.push(`-$${Math.abs(e.cash).toLocaleString()}`)
    if (e.cash && e.cash > 0) hints.push(`+$${e.cash.toLocaleString()}`)
    if (e.teamMorale) hints.push(`Morale ${e.teamMorale > 0 ? '+' : ''}${e.teamMorale}`)
    if (e.driverMorale) hints.push(`Driver ${e.driverMorale > 0 ? '+' : ''}${e.driverMorale}`)
    if (e.reputation) hints.push(`Rep ${e.reputation > 0 ? '+' : ''}${e.reputation}`)
    if (e.confidence) hints.push(`Confidence ${e.confidence > 0 ? '+' : ''}${e.confidence}`)
    if (e.stress) hints.push(`Stress ${e.stress > 0 ? '+' : ''}${e.stress}`)
    if (e.developmentPoints) hints.push(`Dev ${e.developmentPoints > 0 ? '+' : ''}${e.developmentPoints}`)
    if (e.fanSentiment) hints.push(`Fans ${e.fanSentiment > 0 ? '+' : ''}${e.fanSentiment}`)
    if (e.boardMood) hints.push(`Board ${e.boardMood > 0 ? '+' : ''}${e.boardMood}`)
    if (e.sponsorSatisfaction) hints.push(`Sponsors ${e.sponsorSatisfaction > 0 ? '+' : ''}${e.sponsorSatisfaction}`)
    if (e.marketability) hints.push(`Market ${e.marketability > 0 ? '+' : ''}${e.marketability}`)
    if (e.driverFatigue) hints.push(`Fatigue ${e.driverFatigue > 0 ? '+' : ''}${e.driverFatigue}`)
    return hints
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="border-l-4 border-l-accent-blue">
        <CardHeader
          title="Quick Decision"
          icon={<Zap className="w-4 h-4 text-accent-blue" />}
          action={
            <button 
              onClick={() => setDismissed(true)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Dismiss
            </button>
          }
        />
        <CardContent>
          <p className="text-sm font-medium mb-1">{quickDecision.title}</p>
          <p className="text-xs text-text-muted mb-3">{quickDecision.description}</p>
          
          <div className="space-y-2">
            {quickDecision.options.map((option) => {
              const hints = getOptionHints(option)
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className="w-full text-left p-3 rounded-lg bg-surface-secondary/30 hover:bg-surface-secondary/60 border border-transparent hover:border-accent-blue/30 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-accent-blue transition-colors flex-shrink-0" />
                    <span className="text-sm">{option.text}</span>
                    {option.scheduleActivityId && (
                      <Calendar className="w-3 h-3 text-text-muted/50 ml-auto flex-shrink-0" title="Adds activity to calendar" />
                    )}
                  </div>
                  {/* Effect hint badges */}
                  {hints.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                      {hints.map((hint, i) => {
                        const isNeg = hint.startsWith('-') || hint.includes(' -') || hint.includes('Stress +')
                        const isPos = (hint.startsWith('+') || hint.includes(' +') || hint === 'Schedules activity') && !isNeg
                        return (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isPos
                                ? 'bg-green-500/10 text-green-400/70'
                                : isNeg
                                  ? 'bg-red-500/10 text-red-400/70'
                                  : 'bg-white/5 text-text-muted/60'
                            }`}
                          >
                            {hint}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
