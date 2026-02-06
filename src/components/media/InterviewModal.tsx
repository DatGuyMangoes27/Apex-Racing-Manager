/**
 * Interview Modal Component
 * 
 * Full interactive interview experience with AI-generated questions,
 * tone-based responses, and outcome determination.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Radio,
  Tv,
  Globe,
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign
} from 'lucide-react';
  outcome: InterviewOutcome
  bonusMultiplier: number
  headline: string
  finalPayment: number
}

const TIER_CONFIG: Record<InterviewTier, { 
  icon: typeof Mic
  color: string
  bgColor: string
  borderColor: string
  name: string
  riskLevel?: 'low' | 'medium' | 'high' | 'very_high'
  specialEffect?: string
}> = {
  local: {
    icon: FileText,
    color: 'text-text-muted',
    bgColor: 'bg-surface-secondary',
    borderColor: 'border-surface-border',
    name: 'Local Blog',
    riskLevel: 'low'
  },
  national: {
    icon: Radio,
    color: 'text-status-info',
    bgColor: 'bg-status-info/10',
    borderColor: 'border-status-info/30',
    name: 'National Media',
    riskLevel: 'medium'
  },
  global: {
    icon: Globe,
    color: 'text-accent-gold',
    bgColor: 'bg-accent-gold/10',
    borderColor: 'border-accent-gold/30',
    name: 'Global Motorsport',
    riskLevel: 'medium'
  },
  tv: {
    icon: Tv,
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10',
    borderColor: 'border-accent-red/30',
    name: 'TV Appearance',
    riskLevel: 'high'
  },
  // New interview types
  podcast: {
    icon: Mic,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    name: 'Podcast',
    riskLevel: 'low',
    specialEffect: 'Casual atmosphere, builds personality'
  },
  documentary: {
    icon: Tv,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    name: 'Documentary',
    riskLevel: 'low',
    specialEffect: 'Controlled narrative, prestige boost'
  },
  live_stream: {
    icon: Radio,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    name: 'Live Stream',
    riskLevel: 'high',
    specialEffect: 'Direct fan engagement, can go wrong'
  },
  rival_media: {
    icon: AlertTriangle,
    color: 'text-status-danger',
    bgColor: 'bg-status-danger/10',
    borderColor: 'border-status-danger/30',
    name: 'Rival Media',
    riskLevel: 'very_high',
    specialEffect: 'Trap questions, drama potential'
  },
  sponsor_arranged: {
    icon: DollarSign,
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    borderColor: 'border-status-success/30',
    name: 'Sponsor Arranged',
    riskLevel: 'low',
    specialEffect: '+10% sponsor satisfaction'
  }
}

const TONE_BADGES: Record<MediaTone, { variant: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'gold'; label: string }> = {
  confident: { variant: 'gold', label: 'Confident' },
  humble: { variant: 'blue', label: 'Humble' },
  bold: { variant: 'orange', label: 'Bold' },
  diplomatic: { variant: 'green', label: 'Diplomatic' },
  aggressive: { variant: 'red', label: 'Aggressive' },
  deflecting: { variant: 'default', label: 'Deflecting' }
}

const OUTCOME_CONFIG: Record<InterviewOutcome, {
  icon: typeof CheckCircle
  color: string
  bgColor: string
  title: string
}> = {
  success: {
    icon: CheckCircle,
    color: 'text-status-success',
    bgColor: 'bg-status-success/20',
    title: 'Interview Success!'
  },
  neutral: {
    icon: AlertTriangle,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/20',
    title: 'Standard Performance'
  },
  disaster: {
    icon: XCircle,
    color: 'text-status-error',
    bgColor: 'bg-status-error/20',
    title: 'Interview Disaster!'
  }
}

export function InterviewModal({ isOpen, onClose, onComplete, context, payment }: InterviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [responses, setResponses] = useState<InterviewResult['responses']>([])
  const [showOutcome, setShowOutcome] = useState(false)
  const [outcome, setOutcome] = useState<{ outcome: InterviewOutcome; bonusMultiplier: number; headline: string } | null>(null)
  
  const tierConfig = TIER_CONFIG[context.tier]
  const TierIcon = tierConfig.icon
  
  // Generate questions when modal opens
  useEffect(() => {
    if (isOpen) {
      generateQuestions()
    }
  }, [isOpen])
  
  const generateQuestions = async () => {
    setIsLoading(true)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setResponses([])
    setShowOutcome(false)
    setOutcome(null)
    
    try {
      const generated = await generateInterviewQuestions(context)
      setQuestions(generated)
    } catch (e) {
      console.error('[InterviewModal] Failed to generate questions:', e)
    } finally {
      setIsLoading(false)
    }
  }
  
  const currentQuestion = questions[currentQuestionIndex]
  
  const handleSelectResponse = () => {
    if (!selectedOption || !currentQuestion) return
    
    const option = currentQuestion.options.find(o => o.id === selectedOption)
    if (!option) return
    
    const newResponses = [
      ...responses,
      {
        questionId: currentQuestion.id,
        optionId: option.id,
        tone: option.tone,
        hiddenEffects: option.hiddenEffects
      }
    ]
    setResponses(newResponses)
    
    // Move to next question or show outcome
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
    } else {
      // Calculate outcome
      const result = calculateInterviewOutcome(
        newResponses.map(r => ({ tone: r.tone, hiddenEffects: r.hiddenEffects })),
        context.tier
      )
      setOutcome(result)
      setShowOutcome(true)
    }
  }
  
  const handleComplete = () => {
    if (!outcome) return
    
    const finalPayment = Math.floor(payment * outcome.bonusMultiplier)
    
    onComplete({
      responses,
      outcome: outcome.outcome,
      bonusMultiplier: outcome.bonusMultiplier,
      headline: outcome.headline,
      finalPayment
    })
    onClose()
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="min-h-[500px]">
        {/* Header */}
        <div className={`p-4 rounded-xl mb-6 ${tierConfig.bgColor} border ${tierConfig.borderColor}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${tierConfig.bgColor}`}>
              <TierIcon className={`w-7 h-7 ${tierConfig.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`font-display font-bold text-xl ${tierConfig.color}`}>
                {context.outletName}
              </h2>
              <p className="text-text-muted text-sm">{tierConfig.name} Interview</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-status-success">
                <DollarSign className="w-4 h-4" />
                <span className="font-mono font-bold">${payment.toLocaleString()}</span>
              </div>
              <p className="text-xs text-text-muted">Base Payment</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-10 h-10 animate-spin text-accent-red mb-4" />
              <p className="text-text-muted">Preparing interview questions...</p>
            </motion.div>
          ) : showOutcome && outcome ? (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              {/* Outcome Display */}
              <div className={`w-20 h-20 mx-auto rounded-full ${OUTCOME_CONFIG[outcome.outcome].bgColor} flex items-center justify-center mb-6`}>
                {(() => {
                  const OutcomeIcon = OUTCOME_CONFIG[outcome.outcome].icon
                  return <OutcomeIcon className={`w-10 h-10 ${OUTCOME_CONFIG[outcome.outcome].color}`} />
                })()}
              </div>
              
              <h3 className={`font-display font-bold text-2xl mb-2 ${OUTCOME_CONFIG[outcome.outcome].color}`}>
                {OUTCOME_CONFIG[outcome.outcome].title}
              </h3>
              
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                "{outcome.headline}"
              </p>
              
              {/* Payment Result */}
              <Card variant="glass" padding="lg" className="max-w-sm mx-auto mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Final Payment</span>
                  <div className="flex items-center gap-2">
                    {outcome.bonusMultiplier !== 1.0 && (
                      <Badge variant={outcome.bonusMultiplier > 1 ? 'green' : 'red'}>
                        {outcome.bonusMultiplier > 1 ? '+' : ''}{Math.round((outcome.bonusMultiplier - 1) * 100)}%
                      </Badge>
                    )}
                    <span className={`font-mono font-bold text-xl ${
                      outcome.outcome === 'success' ? 'text-status-success' :
                      outcome.outcome === 'disaster' ? 'text-status-error' :
                      'text-white'
                    }`}>
                      ${Math.floor(payment * outcome.bonusMultiplier).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
              
              {/* Responses Summary */}
              <div className="flex justify-center gap-2 mb-8">
                {responses.map((r, i) => (
                  <Badge key={i} variant={TONE_BADGES[r.tone].variant} size="sm">
                    Q{i + 1}: {TONE_BADGES[r.tone].label}
                  </Badge>
                ))}
              </div>
              
              <Button variant="primary" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Interview
              </Button>
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-muted">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div 
                      key={i}
                      className={`w-8 h-1 rounded-full transition-colors ${
                        i < currentQuestionIndex ? 'bg-status-success' :
                        i === currentQuestionIndex ? 'bg-accent-red' :
                        'bg-surface-secondary'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Question */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium mb-2">{currentQuestion.question}</p>
                  <p className="text-sm text-text-muted italic">{currentQuestion.context}</p>
                </div>
              </div>
              
              {/* Response Options */}
              <div className="space-y-3 ml-16">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedOption(selectedOption === option.id ? null : option.id)}
                    className={`
                      w-full p-4 rounded-xl border text-left transition-all
                      ${selectedOption === option.id 
                        ? `${tierConfig.bgColor} ${tierConfig.borderColor} ring-2 ring-${tierConfig.color.replace('text-', '')}/50`
                        : 'bg-surface border-surface-border hover:border-surface-secondary'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-text-secondary group-hover:text-white transition-colors mb-2">
                          "{option.text}"
                        </p>
                        <Badge variant={TONE_BADGES[option.tone].variant} size="sm">
                          {TONE_BADGES[option.tone].label}
                        </Badge>
                      </div>
                      {selectedOption === option.id && (
                        <ChevronRight className={`w-5 h-5 ${tierConfig.color} flex-shrink-0`} />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* Confirm Button */}
              <AnimatePresence>
                {selectedOption && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="ml-16"
                  >
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleSelectResponse}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {currentQuestionIndex < questions.length - 1 ? 'Answer & Continue' : 'Give Final Answer'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-text-muted">No questions available. Please try again.</p>
              <Button variant="ghost" onClick={generateQuestions} className="mt-4">
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
