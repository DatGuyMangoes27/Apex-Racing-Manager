// ============================================
// INTERRUPTION EVENT MODAL
// ============================================
// Shows when a mid-day interruption event triggers.
// Presents the situation and two choices, highlighting the
// driver-owner-life trade-off in each option.

import { motion } from 'framer-motion'
import { 
  AlertCircle, Zap, Clock, Gauge, Briefcase, Heart,
  ChevronRight
} from 'lucide-react'
import { Modal, Button, Badge } from '@/components/ui'
import type { InterruptionEvent, InterruptionChoice } from '@/simulation/events/interruptions'

interface InterruptionModalProps {
  isOpen: boolean
  event: InterruptionEvent | null
  hoursRemaining: number
  onChoice: (choice: InterruptionChoice) => void
}

const ROLE_STYLES = {
  racing: { icon: Gauge, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', label: 'Racing' },
  business: { icon: Briefcase, color: 'text-accent-orange', bg: 'bg-accent-orange/20', border: 'border-accent-orange/40', label: 'Business' },
  life: { icon: Heart, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Life' },
}

const URGENCY_STYLES = {
  low: { variant: 'default' as const, label: 'Optional' },
  medium: { variant: 'orange' as const, label: 'Attention Needed' },
  high: { variant: 'red' as const, label: 'Urgent' },
}

export function InterruptionModal({ isOpen, event, hoursRemaining, onChoice }: InterruptionModalProps) {
  if (!event) return null
  
  const categoryStyle = ROLE_STYLES[event.category]
  const urgencyStyle = URGENCY_STYLES[event.urgency]
  const CategoryIcon = categoryStyle.icon
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot dismiss without choosing
      title=""
      size="md"
    >
      <div className="space-y-5">
        {/* Header with urgency and category */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${categoryStyle.bg} border ${categoryStyle.border} flex items-center justify-center`}
          >
            <CategoryIcon className={`w-8 h-8 ${categoryStyle.color}`} />
          </motion.div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant={urgencyStyle.variant} size="sm">
              <AlertCircle className="w-3 h-3 mr-1" />
              {urgencyStyle.label}
            </Badge>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.color}`}>
              {categoryStyle.label}
            </span>
          </div>
          
          <h2 className="font-display font-bold text-xl">{event.title}</h2>
        </div>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-sm leading-relaxed text-center px-2"
        >
          {event.description}
        </motion.p>
        
        {/* Choices */}
        <div className="space-y-3">
          {event.choices.map((choice, index) => {
            const choiceStyle = ROLE_STYLES[choice.roleServed]
            const ChoiceIcon = choiceStyle.icon
            const canAfford = hoursRemaining >= choice.timeCost
            
            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => canAfford && onChoice(choice)}
                disabled={!canAfford}
                className={`
                  w-full p-4 rounded-xl border text-left transition-all
                  ${canAfford 
                    ? `${choiceStyle.bg} ${choiceStyle.border} hover:scale-[1.02] hover:shadow-lg cursor-pointer` 
                    : 'bg-surface/30 border-surface-border/30 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${choiceStyle.bg} flex items-center justify-center shrink-0`}>
                    <ChoiceIcon className={`w-5 h-5 ${choiceStyle.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-white">{choice.text}</span>
                      <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                    </div>
                    
                    {/* Effects preview */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {choice.timeCost > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface/50 text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {choice.timeCost}h
                        </span>
                      )}
                      {Object.entries(choice.effects).map(([stat, value]) => {
                        const isPositive = ['fatigue', 'stress'].includes(stat) ? value < 0 : value > 0
                        return (
                          <span 
                            key={stat}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isPositive ? 'bg-status-success/20 text-status-success' : 'bg-accent-red/20 text-accent-red'
                            }`}
                          >
                            {value > 0 ? '+' : ''}{typeof value === 'number' && Math.abs(value) >= 1000 ? `$${(value/1000).toFixed(0)}k` : value} {formatStatName(stat)}
                          </span>
                        )
                      })}
                    </div>
                    
                    {/* Role served tag */}
                    <div className="mt-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${choiceStyle.color}`}>
                        Serves: {choiceStyle.label}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!canAfford && (
                  <p className="text-xs text-accent-red mt-2">
                    Not enough hours remaining ({hoursRemaining}h left, needs {choice.timeCost}h)
                  </p>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

function formatStatName(stat: string): string {
  const names: Record<string, string> = {
    sponsorSatisfaction: 'Sponsor',
    reputation: 'Rep',
    fatigue: 'Fatigue',
    stress: 'Stress',
    confidence: 'Confidence',
    fitness: 'Fitness',
    morale: 'Morale',
    fanSentiment: 'Fans',
    teamCash: 'Budget',
    cash: 'Cash',
    boardMood: 'Board',
    carReliability: 'Reliability',
    partnerHappiness: 'Partner',
    teamDevelopment: 'R&D',
    wetSkill: 'Wet Skill',
  }
  return names[stat] ?? stat
}
