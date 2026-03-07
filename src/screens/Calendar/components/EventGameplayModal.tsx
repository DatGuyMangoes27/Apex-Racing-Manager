/**
 * EventGameplayModal
 * Interactive gameplay modal for attending scheduled events
 * Features multi-round interactions with AI-generated content
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronRight, Star, Users, Briefcase, Mic, Trophy, Loader2, X, Building2, Sparkles, MessageSquare, TrendingUp, TrendingDown, Award, Target, Check, MapPin, Zap, Heart, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, Badge, Modal, StaffPortrait } from '@/components/ui';
import { useCareerStore } from '@/store/careerStore';
import type { ScheduledActivity } from '@/store/careerStore';
import { STAFF_ROLE_NAMES, TRAIT_DESCRIPTIONS, TRAIT_EFFECTS, STAFF_ROLE_DESCRIPTIONS } from '@/data/facility-staff-config';
import type { FacilityStaffMember, TeamStaffMember } from '@/data/facility-staff-config';
import { getStaffPortrait, getRandomStaffPortraitByRole, getPortraitByManifestId, getFallbackPortrait } from '@/utils/generated-assets';
import { generateEventScenario, getStaffNameOrFallback, teamHasStaff, type EventScenario as GeminiEventScenario, type EventRound as GeminiEventRound } from '@/services/eventContentGenerator';
import type { ChoicePromiseDefinition } from '@/simulation/promises';
import { createPromiseFromChoice } from '@/simulation/promises';

interface EventChoice {
  id: string;
  text: string;
  tone?: string;
  effects: { outcome: string; [key: string]: any };
  promise?: ChoicePromiseDefinition;
}

interface EventRound {
  id: string;
  prompt?: string;
  situation?: string;
  npcDialogue?: string;
  npcName?: string;
  npcRole?: string;
  choices: EventChoice[];
  selectedChoiceId?: string;
  outcome?: string;
}

interface EventScenario {
  intro?: string;
  rounds: EventRound[];
  totalOutcome?: { success?: boolean; summary?: string; effects: any };
}

type ActivityEffect = Record<string, number | boolean | string>

interface EventGameplayModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  activity: ScheduledActivity | null;
  onComplete: (activityId: string, effects: any) => void;
  teamContext?: {
    teamName?: string;
    reputation?: number;
    sponsors?: any[];
    staff?: any[];
    drivers?: any[];
  };
}

/**
 * Infer the outcome of a choice from its numeric effect modifiers.
 * Used as a fallback when effects.outcome is missing (e.g. AI-generated content).
 */
function inferOutcome(effects: Record<string, any>): 'good' | 'bad' | 'neutral' {
  if (effects.outcome === 'good' || effects.outcome === 'bad' || effects.outcome === 'neutral') {
    return effects.outcome as 'good' | 'bad' | 'neutral'
  }
  const sum = Object.entries(effects).reduce((acc, [key, value]) => {
    if (key !== 'outcome' && typeof value === 'number') return acc + value
    return acc
  }, 0)
  if (sum > 0) return 'good'
  if (sum < 0) return 'bad'
  return 'neutral'
}

/** Display metadata for each effect key shown on the results screen */
const EFFECT_DISPLAY: Record<string, { label: string; description: string; format?: 'currency' }> = {
  boardMood:           { label: 'Board Mood',           description: 'How satisfied the board is with your leadership' },
  teamMorale:          { label: 'Team Morale',          description: 'Staff motivation and willingness to perform' },
  budgetImpact:        { label: 'Budget Impact',        description: 'Direct financial cost or savings to the team', format: 'currency' },
  reputation:          { label: 'Reputation',           description: 'Your standing in the motorsport community' },
  driverMorale:        { label: 'Driver Morale',        description: 'Your personal motivation and mental state' },
  sponsorSatisfaction: { label: 'Sponsor Satisfaction', description: 'How happy your sponsors are with results' },
  developmentPoints:   { label: 'Development Points',   description: 'R&D progress toward car upgrades' },
  fanSentiment:        { label: 'Fan Sentiment',        description: 'Public perception and fan engagement' },
  cash:                { label: 'Cash',                 description: 'Direct payment or expense', format: 'currency' },
  driverFatigue:       { label: 'Fatigue',              description: 'Physical and mental exhaustion' },
  confidence:          { label: 'Confidence',           description: 'Self-belief and conviction in decisions' },
  stress:              { label: 'Stress',               description: 'Pressure and mental strain' },
  fitness:             { label: 'Fitness',              description: 'Physical conditioning level' },
  marketability:       { label: 'Marketability',        description: 'Commercial appeal to sponsors and media' },
  mentalStrength:      { label: 'Mental Strength',      description: 'Resilience under pressure' },
}

/** Format an effect value for display */
function formatEffectValue(key: string, value: number): string {
  const meta = EFFECT_DISPLAY[key]
  if (meta?.format === 'currency') {
    const absVal = Math.abs(value)
    const formatted = absVal >= 1000 ? `$${(absVal / 1000).toFixed(absVal % 1000 === 0 ? 0 : 1)}k` : `$${absVal}`
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return value > 0 ? `+${value}` : `${value}`
}

export function EventGameplayModal({ isOpen, onClose, onCancel, activity, onComplete, teamContext: _teamContext }: EventGameplayModalProps) {
  const [scenario, setScenario] = useState<EventScenario | null>(null)
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [gameState, setGameState] = useState<'loading' | 'intro' | 'playing' | 'conclusion' | 'complete'>('loading')
  const [cumulativeEffects, setCumulativeEffects] = useState<Record<string, number>>({})
  const [selectedChoices, setSelectedChoices] = useState<string[]>([])
  const [collectedPromises, setCollectedPromises] = useState<ChoicePromiseDefinition[]>([])
  const [selectedChoiceObjects, setSelectedChoiceObjects] = useState<EventChoice[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  /** For interview mode: show the candidate's answer after the owner picks a question */
  const [interviewAnswer, setInterviewAnswer] = useState<string | null>(null)
  
  const { addPromise, queueFeedbackEmail, careerState } = useCareerStore()
  
  // Detect interview mode — owner asks questions, candidate answers
  const isInterviewMode = activity?.templateId === 'staff_interview'
  
  // Track whether the candidate profile sidebar is expanded
  const [showCandidateProfile, setShowCandidateProfile] = useState(true)
  
  // Resolve the interview candidate from the store so we can display their profile
  const interviewCandidate = useMemo(() => {
    if (!isInterviewMode || !activity?.triggerData?.interviewCandidateId) return null
    const candidateId = activity.triggerData.interviewCandidateId as string
    const state = careerState
    if (!state) return null
    // Check facility staff market
    let found: any = (state.facilityStaffMarket || []).find((s: any) => s.id === candidateId)
    if (!found) {
      // Check world staff pool
      const poolEntry = (state.worldStaffPool || []).find((w: any) => w.staff?.id === candidateId)
      if (poolEntry) found = poolEntry.staff
    }
    return found || null
  }, [isInterviewMode, activity?.triggerData?.interviewCandidateId, careerState])

  const handleClose = () => { setScenario(null); setCurrentRoundIndex(0); setGameState('loading'); setSelectedChoices([]); setCollectedPromises([]); setSelectedChoiceObjects([]); setInterviewAnswer(null); setShowCandidateProfile(true); if (onClose) onClose(); else if (onCancel) onCancel(); }

  // Category icon/color helpers
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sponsor': return Briefcase
      case 'team': return Users
      case 'media': return Mic
      case 'development': return Building2
      case 'personal': return Star
      default: return Building2
    }
  }
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sponsor': return 'text-accent-gold'
      case 'team': return 'text-accent-blue'
      case 'media': return 'text-accent-red'
      case 'development': return 'text-accent-purple'
      case 'personal': return 'text-status-success'
      default: return 'text-text-muted'
    }
  }
  
  // Generate scenario on open -- uses Gemini via eventContentGenerator, falls back to templates
  useEffect(() => {
    if (isOpen && activity && !scenario) {
      setIsGenerating(true)
      
      // Try Gemini-powered generation first, then fall back to local templates
      generateEventScenario(activity)
        .then((geminiResult) => {
          if (geminiResult) {
            // Convert eventContentGenerator format to modal format
            const converted: EventScenario = {
              intro: geminiResult.description,
              rounds: geminiResult.rounds.map((r: GeminiEventRound) => ({
                id: `round_${r.roundNumber}`,
                situation: r.situation,
                prompt: r.question,
                npcDialogue: r.question,
                npcName: r.speakerName,
                npcRole: r.speakerRole,
                choices: r.choices.map(c => {
                  // Convert AI promise metadata to ChoicePromiseDefinition
                  const promiseDef: ChoicePromiseDefinition | undefined = c.promise ? {
                    text: c.promise.text,
                    shortText: c.promise.shortText,
                    category: c.promise.category,
                    evaluation: inferEvaluationFromCategory(c.promise.category),
                    deadlineWeeks: c.promise.deadlineWeeks || 4,
                    stakeholderRoles: [c.promise.stakeholderRole || r.speakerRole || 'Team Member'],
                    stakeholderCategory: mapCategoryToStakeholder(activity?.category),
                    rewardsIfKept: inferRewardsFromCategory(c.promise.category),
                    penaltiesIfBroken: inferPenaltiesFromCategory(c.promise.category)
                  } : undefined
                  
                  return {
                    id: c.id,
                    text: c.text,
                    tone: c.tone,
                    effects: {
                      outcome: c.followUp || 'Your response was noted.',
                      ...(c.effects || {})
                    },
                    ...(promiseDef ? { promise: promiseDef } : {})
                  }
                })
              })),
              totalOutcome: undefined
            }
            setScenario(converted)
            setIsGenerating(false)
            setGameState(converted.intro ? 'intro' : 'playing')
          } else {
            // Fallback to local templates
            const cat = activity.category || 'generic'
            let generated: EventScenario
            if (cat === 'sponsor') generated = generateSponsorFallback(activity)
            else if (cat === 'team') generated = generateTeamFallback(activity)
            else if (cat === 'media') generated = generateMediaFallback(activity)
            else if (cat === 'development') generated = generateDevelopmentFallback(activity)
            else if (cat === 'personal') generated = generatePersonalFallback(activity)
            else generated = generateGenericFallback(activity)
            setScenario(generated)
            setIsGenerating(false)
            setGameState(generated.intro ? 'intro' : 'playing')
          }
        })
        .catch(() => {
          // On any error, fall back to local templates
          const cat = activity.category || 'generic'
          let generated: EventScenario
          if (cat === 'sponsor') generated = generateSponsorFallback(activity)
          else if (cat === 'team') generated = generateTeamFallback(activity)
          else if (cat === 'media') generated = generateMediaFallback(activity)
          else if (cat === 'development') generated = generateDevelopmentFallback(activity)
          else if (cat === 'personal') generated = generatePersonalFallback(activity)
          else generated = generateGenericFallback(activity)
          setScenario(generated)
          setIsGenerating(false)
          setGameState(generated.intro ? 'intro' : 'playing')
        })
    }
  }, [isOpen, activity])

  const currentRound = scenario?.rounds?.[currentRoundIndex]

  /**
   * In interview mode, after the owner picks a question the candidate's answer
   * is shown. Clicking "Continue" calls this to advance to the next round.
   */
  const handleInterviewContinue = () => {
    if (!scenario || !currentRound) return
    const selectedChoice = currentRound.choices.find(c => c.id === currentRound.selectedChoiceId)
    if (!selectedChoice) return
    
    setInterviewAnswer(null)
    
    // Collect promise if the choice carries one
    if (selectedChoice.promise) {
      setCollectedPromises(prev => [...prev, selectedChoice.promise!])
    }
    setSelectedChoiceObjects(prev => [...prev, selectedChoice])

    // Apply effects
    setCumulativeEffects(prev => {
      const newEffects = { ...prev }
      Object.entries(selectedChoice.effects).forEach(([key, value]) => {
        if (key !== 'outcome' && key !== 'followUp' && typeof value === 'number') {
          newEffects[key] = (newEffects[key] || 0) + value
        }
      })
      return newEffects
    })

    // Move to next round or conclusion
    if (currentRoundIndex < scenario.rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1)
    } else {
      setSelectedChoices(prev => [...prev, currentRound.selectedChoiceId!])
      finaliseScenario(scenario, [...selectedChoices, currentRound.selectedChoiceId!])
    }
  }

  const handleChoice = (choiceId: string) => {
    if (!scenario || !currentRound) return
    const selectedChoice = currentRound.choices.find(c => c.id === choiceId)
    if (!selectedChoice) return

    // Interview mode: show the candidate's answer first, then wait for "Continue"
    if (isInterviewMode) {
      // Get the candidate's answer — from choice-level followUp or effects.outcome
      const candidateAnswer = (selectedChoice as any).followUp
        || (typeof selectedChoice.effects.outcome === 'string' && selectedChoice.effects.outcome.length > 30
          ? selectedChoice.effects.outcome
          : null)
        || 'The candidate considers your question carefully before responding.'
      
      setInterviewAnswer(candidateAnswer)
      
      // Mark the round as selected but don't advance yet
      const updatedRounds = [...scenario.rounds]
      updatedRounds[currentRoundIndex] = {
        ...currentRound,
        selectedChoiceId: choiceId,
        outcome: candidateAnswer
      }
      setScenario({ ...scenario, rounds: updatedRounds })
      return
    }

    // Collect promise if the choice carries one
    if (selectedChoice.promise) {
      setCollectedPromises(prev => [...prev, selectedChoice.promise!])
    }
    
    // Track the full choice object for feedback email generation
    setSelectedChoiceObjects(prev => [...prev, selectedChoice])

    // Apply effects
    setCumulativeEffects(prev => {
      const newEffects = { ...prev }
      Object.entries(selectedChoice.effects).forEach(([key, value]) => {
        if (key !== 'outcome' && typeof value === 'number') {
          newEffects[key] = (newEffects[key] || 0) + value
        }
      })
      return newEffects
    })

    // Update round with selection
    const updatedRounds = [...scenario.rounds]
    updatedRounds[currentRoundIndex] = {
      ...currentRound,
      selectedChoiceId: choiceId,
      outcome: inferOutcome(selectedChoice.effects) === 'good' 
        ? 'Your response was well received.'
        : inferOutcome(selectedChoice.effects) === 'bad'
        ? 'That didn\'t go as well as hoped.'
        : 'A neutral response.'
    }
    
    setScenario({ ...scenario, rounds: updatedRounds })
    
    // Move to next round or conclusion
    setTimeout(() => {
      if (currentRoundIndex < scenario.rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1)
      } else {
        setSelectedChoices(prev => [...prev, choiceId])
        finaliseScenario(scenario, [...selectedChoices, choiceId])
      }
    }, 1500)
  }
  
  /** Calculate final outcome and show conclusion screen */
  const finaliseScenario = (scen: EventScenario, allChoiceIds: string[]) => {
    const goodChoices = allChoiceIds.filter((cid, i) => {
      const round = scen.rounds[i]
      const choice = round?.choices.find(c => c.id === cid)
      return choice ? inferOutcome(choice.effects) === 'good' : false
    }).length
    
    const totalRounds = scen.rounds.length
    // For interviews, all choices are equally valid — base success on cumulative effects
    const successRate = isInterviewMode
      ? (Object.values(cumulativeEffects).reduce((sum, v) => sum + (v > 0 ? v : 0), 0) > 3 ? 0.8 : 0.5)
      : goodChoices / totalRounds
    
    // Combine accumulated effects with base activity effects
    if (!activity) return
    const baseEffects = activity.effectsOnComplete || {}
    const finalEffects: ActivityEffect = { ...baseEffects }
    
    // Apply accumulated modifiers
    Object.entries(cumulativeEffects).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue = (baseEffects[key as keyof ActivityEffect] as number) || 0;
        (finalEffects as any)[key] = currentValue + value
      }
    })
    
    // Bonus/penalty based on overall performance
    if (successRate >= 0.75) {
      Object.entries(finalEffects).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0) {
          (finalEffects as any)[key] = Math.round(value * 1.10)
        }
      })
    } else if (successRate < 0.4) {
      Object.entries(finalEffects).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0) {
          (finalEffects as any)[key] = Math.round(value * 0.4)
        }
      })
    }
    
    // Set conclusion
    setScenario({
      ...scen,
      totalOutcome: {
        success: successRate >= 0.5,
        summary: isInterviewMode
          ? (successRate >= 0.75
            ? 'Excellent interview! You asked insightful questions and got a clear picture of this candidate.'
            : successRate >= 0.5
            ? 'Good interview. You covered the key topics and have a decent understanding of the candidate.'
            : 'The interview was adequate, but you may have missed some important areas.')
          : (successRate >= 0.75 
            ? 'Excellent! The event was a resounding success.'
            : successRate >= 0.5
            ? 'Good work. The event went well overall.'
            : 'The event had some challenges, but you got through it.'),
        effects: finalEffects
      }
    })
    
    setGameState('conclusion')
  }
  
  // Complete the event — register promises and queue feedback emails
  const handleComplete = () => {
    if (!activity || !scenario?.totalOutcome) return
    
    const currentWeek = careerState?.currentWeek ?? 1
    const currentYear = careerState?.currentYear ?? 2025
    
    // Register any promises the player made during the event
    const allPromises = [...collectedPromises]
    // Also check the last choice (may not be in collectedPromises yet due to React batching)
    const lastChoice = selectedChoiceObjects[selectedChoiceObjects.length - 1]
    if (lastChoice?.promise && !allPromises.includes(lastChoice.promise)) {
      allPromises.push(lastChoice.promise)
    }
    
    for (const promiseDef of allPromises) {
      // Get current stat values for baseline tracking
      const statValues: Record<string, number> = {
        teamMorale: careerState?.ownedTeam?.staff?.reduce((sum, s) => sum + (s.morale || 70), 0) / Math.max(1, careerState?.ownedTeam?.staff?.length || 1) || 70,
        boardMood: careerState?.ownedTeam?.boardMood ?? 50,
        sponsorSatisfaction: 70, // average placeholder
        reputation: 50,
        fanSentiment: careerState?.ownedTeam?.fanSentiment ?? 50,
        driverMorale: 70,
        confidence: 50
      }
      
      const promise = createPromiseFromChoice(
        promiseDef,
        activity.id,
        activity.name,
        currentWeek,
        currentYear,
        statValues
      )
      addPromise(promise)
    }
    
    // Generate feedback emails from event attendees
    generatePostActivityFeedback(
      activity,
      selectedChoiceObjects,
      scenario,
      currentWeek,
      currentYear
    )
    
    onComplete(activity.id, scenario.totalOutcome.effects)
    handleClose()
  }
  
  /**
   * Generate feedback emails from NPCs who attended the event.
   * Called after event completion — emails are queued for next-day delivery.
   */
  function generatePostActivityFeedback(
    act: ScheduledActivity,
    choices: EventChoice[],
    scen: EventScenario,
    week: number,
    year: number
  ) {
    if (choices.length === 0) return
    
    const goodChoices = choices.filter(c => inferOutcome(c.effects) === 'good')
    const badChoices = choices.filter(c => inferOutcome(c.effects) === 'bad')
    const promiseChoices = choices.filter(c => c.promise)
    const success = scen.totalOutcome?.success ?? false
    
    // Get a relevant NPC from the scenario rounds
    const npc = scen.rounds.find(r => r.npcName)
    const senderName = npc?.npcName ?? (
      act.category === 'sponsor' ? getStaffNameOrFallback('pr_manager', 'Partnership Dept.')
        : act.category === 'team' ? getStaffNameOrFallback('team_manager', 'Team Operations')
        : 'Event Coordinator'
    )
    const senderRole = npc?.npcRole ?? act.category
    
    // Determine email category
    const emailCategory = act.category === 'sponsor' ? 'sponsor' 
      : act.category === 'media' ? 'media' 
      : 'team'
    
    // Generate primary feedback email
    let subject: string
    let body: string
    
    // Build commitments section listing ALL promises made
    let commitmentsSection = ''
    if (promiseChoices.length > 0) {
      commitmentsSection = '\n\n**Your Commitments:**\n'
      commitmentsSection += promiseChoices.map(c => `- "${c.promise!.shortText}"`).join('\n')
      commitmentsSection += '\n\nThese will be tracked. The team will be watching to see if you follow through.'
    }
    
    if (success && goodChoices.length >= 2) {
      subject = `Re: ${act.name} — Great Session`
      body = `Just wanted to follow up on ${act.name}.\n\n`
      body += `I thought it went really well. `
      if (goodChoices.length > 0) {
        body += `Your point about "${goodChoices[0].text.substring(0, 80)}..." was particularly well received. `
      }
      body += commitmentsSection
      body += `\n\nLooking forward to seeing the results.`
    } else if (badChoices.length >= 2) {
      subject = `Re: ${act.name} — Some Concerns`
      body = `Following up on ${act.name}.\n\n`
      body += `I'll be honest — a few things didn't land well. `
      if (badChoices.length > 0) {
        body += `When you said "${badChoices[0].text.substring(0, 80)}...", it wasn't what people were expecting to hear. `
      }
      body += `\n\nI'd suggest being more mindful of how your words are received. People are watching closely.`
      body += commitmentsSection
    } else {
      subject = `Re: ${act.name} — Follow Up`
      body = `Quick follow up on ${act.name}.\n\n`
      body += `Overall a decent session. `
      if (goodChoices.length > 0) {
        body += `Your approach was mostly well received. `
      }
      if (badChoices.length > 0) {
        body += `There were a couple of moments that could have gone better. `
      }
      body += commitmentsSection
      body += `\n\nKeep it up.`
    }
    
    queueFeedbackEmail({
      category: emailCategory as any,
      subject,
      sender: senderName,
      senderRole,
      preview: body.substring(0, 100) + '...',
      body,
      receivedDay: (careerState?.currentDay ?? 1),
      receivedWeek: week,
      receivedYear: year,
      actionType: 'acknowledge'
    })
  }
  
  const CategoryIcon = activity ? getCategoryIcon(activity.category) : Building2
  const categoryColor = activity ? getCategoryColor(activity.category) : 'text-text-muted'
  
  if (!isOpen || !activity) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-[#1A1A1E] border border-surface-secondary rounded-2xl w-full max-h-[85vh] overflow-hidden flex flex-col ${
          isInterviewMode && interviewCandidate ? 'max-w-5xl' : 'max-w-3xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center`}>
              <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">{activity.name}</h2>
              <p className="text-sm text-text-muted">
                {activity.configuration?.venueName || 'Team HQ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Interview mode: toggle candidate profile */}
            {isInterviewMode && interviewCandidate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCandidateProfile(!showCandidateProfile)}
                className="text-xs gap-1"
              >
                <User className="w-4 h-4" />
                Profile
                {showCandidateProfile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            )}
            {gameState === 'playing' && scenario && (
              <Badge variant="blue">
                Round {currentRoundIndex + 1} of {scenario.rounds.length}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Content — side-by-side layout for interviews with candidate profile */}
        <div className={`flex-1 overflow-hidden flex ${isInterviewMode && interviewCandidate && showCandidateProfile ? 'flex-row' : ''}`}>
        
        {/* Interview Candidate Profile Sidebar */}
        {isInterviewMode && interviewCandidate && showCandidateProfile && (
          <div className="w-72 flex-shrink-0 border-r border-surface-secondary overflow-y-auto p-4 space-y-4">
            {/* Portrait & Header */}
            <div className="text-center">
              <StaffPortrait
                src={
                  ('portraitId' in interviewCandidate && interviewCandidate.portraitId)
                    ? (getPortraitByManifestId(interviewCandidate.portraitId) || getFallbackPortrait(interviewCandidate.gender || 'male'))
                    : (getStaffPortrait(interviewCandidate.id) || getRandomStaffPortraitByRole(interviewCandidate.role))
                }
                name={interviewCandidate.name}
                role={STAFF_ROLE_NAMES[interviewCandidate.role as keyof typeof STAFF_ROLE_NAMES] || interviewCandidate.role}
                size="2xl"
              />
              <h3 className="text-base font-display font-bold mt-3">{interviewCandidate.name}</h3>
              <p className="text-sm text-text-muted">
                {STAFF_ROLE_NAMES[interviewCandidate.role as keyof typeof STAFF_ROLE_NAMES] || interviewCandidate.role?.replace(/_/g, ' ')}
              </p>
            </div>
            
            {/* Quick Info */}
            <div className="space-y-1.5 text-xs text-text-muted">
              {interviewCandidate.nationality && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span>{interviewCandidate.nationality}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 flex-shrink-0" />
                <span>{interviewCandidate.age} years old</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-3 h-3 flex-shrink-0" />
                <span>{interviewCandidate.experience} yrs experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 flex-shrink-0" />
                <span>Reputation: {interviewCandidate.reputation}</span>
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Skills
              </h4>
              <div className="space-y-2">
                {interviewCandidate.skills && Object.entries(interviewCandidate.skills).map(([skill, value]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="capitalize text-text-muted">{skill}</span>
                      <span className={`font-mono font-bold ${
                        (value as number) >= 70 ? 'text-status-success' :
                        (value as number) >= 50 ? 'text-accent-orange' : 'text-text-muted'
                      }`}>{value as number}</span>
                    </div>
                    <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          (value as number) >= 70 ? 'bg-status-success' :
                          (value as number) >= 50 ? 'bg-accent-orange' : 'bg-text-muted'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Traits */}
            {interviewCandidate.traits && interviewCandidate.traits.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Traits
                </h4>
                <div className="space-y-1.5">
                  {interviewCandidate.traits.map((trait: string) => {
                    const effect = TRAIT_EFFECTS[trait as keyof typeof TRAIT_EFFECTS]
                    return (
                      <div key={trait} className="p-2 rounded-lg bg-surface-secondary/60">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium capitalize">{trait.replace(/_/g, ' ')}</span>
                          {effect && (
                            <Badge variant="purple" size="sm" className="text-[10px]">
                              +{Math.round(effect.bonusValue * 100)}%
                            </Badge>
                          )}
                        </div>
                        {TRAIT_DESCRIPTIONS[trait as keyof typeof TRAIT_DESCRIPTIONS] && (
                          <p className="text-[10px] text-text-muted leading-tight">
                            {TRAIT_DESCRIPTIONS[trait as keyof typeof TRAIT_DESCRIPTIONS]}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Staff Category */}
            <div className={`p-2 rounded-lg text-xs ${
              interviewCandidate.staffCategory === 'team' 
                ? 'bg-accent-purple/10 border border-accent-purple/30' 
                : 'bg-accent-blue/10 border border-accent-blue/30'
            }`}>
              <div className="flex items-center gap-1.5">
                {interviewCandidate.staffCategory === 'team' ? (
                  <>
                    <Award className="w-3.5 h-3.5 text-accent-purple" />
                    <span className="font-medium text-accent-purple">Team / Race Staff</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-accent-blue" />
                    <span className="font-medium text-accent-blue">Facility Staff</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Salary Expectation */}
            {interviewCandidate.salary && (
              <div className="p-2 rounded-lg bg-surface-secondary/40">
                <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Salary Expectation</p>
                <p className="text-sm font-mono font-bold text-accent-gold">
                  ${interviewCandidate.salary.toLocaleString()}/wk
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Main Event Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {gameState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                <p className="text-text-muted">Preparing event...</p>
                {isGenerating && (
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-gold" />
                    Generating unique scenario...
                  </p>
                )}
              </motion.div>
            )}
            
            {/* Intro State */}
            {gameState === 'intro' && scenario && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <CategoryIcon className={`w-16 h-16 ${categoryColor} mx-auto mb-4`} />
                  <h3 className="text-xl font-display font-bold mb-2">{activity.name}</h3>
                  <p className="text-text-muted">
                    {activity.configuration?.venueName || 'Team HQ'}
                  </p>
                </div>
                
                <Card variant="surface" padding="lg">
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {scenario.intro}
                  </p>
                </Card>
                
                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={() => setGameState('playing')}
                    className="min-w-[200px]"
                  >
                    Begin Event
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Playing State */}
            {gameState === 'playing' && currentRound && (
              <motion.div
                key={`round-${currentRoundIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                {/* Progress indicator */}
                <div className="flex gap-1">
                  {scenario?.rounds.map((_, i) => (
                    <div 
                      key={i}
                      className={`
                        flex-1 h-1.5 rounded-full transition-colors
                        ${i < currentRoundIndex ? 'bg-status-success' : ''}
                        ${i === currentRoundIndex ? 'bg-accent-blue' : ''}
                        ${i > currentRoundIndex ? 'bg-surface-secondary' : ''}
                      `}
                    />
                  ))}
                </div>
                
                {/* Situation */}
                <Card variant="surface" padding="lg">
                  <p className="text-text-secondary leading-relaxed">
                    {currentRound.situation}
                  </p>
                </Card>
                
                {/* NPC Dialogue — in interview mode show as scene direction, otherwise as dialogue */}
                {currentRound.npcDialogue && !isInterviewMode && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="flex-1 bg-surface-secondary/50 rounded-xl p-4">
                      {currentRound.npcName && (
                        <p className="text-sm font-medium text-accent-blue mb-1">
                          {currentRound.npcName}
                          {currentRound.npcRole && (
                            <span className="text-text-muted font-normal ml-2">
                              {currentRound.npcRole}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-text-secondary italic">"{currentRound.npcDialogue}"</p>
                    </div>
                  </div>
                )}
                
                {/* Choices / Questions */}
                {!currentRound.selectedChoiceId ? (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted font-medium">
                      {isInterviewMode ? 'Choose your question:' : 'Choose your response:'}
                    </p>
                    {currentRound.choices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoice(choice.id)}
                        className="w-full p-4 rounded-xl border-2 border-surface-secondary hover:border-accent-blue/50 
                                 bg-surface-secondary/30 hover:bg-surface-secondary/50 text-left transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center 
                                         text-xs font-bold group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-text-primary">{choice.text}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge 
                                variant={
                                  choice.tone === 'confident' ? 'blue' :
                                  choice.tone === 'diplomatic' ? 'green' :
                                  choice.tone === 'honest' ? 'default' :
                                  choice.tone === 'deflecting' ? 'gold' :
                                  choice.tone === 'professional' ? 'blue' :
                                  choice.tone === 'friendly' ? 'green' :
                                  'red'
                                }
                                className="text-xs"
                              >
                                {choice.tone}
                              </Badge>
                              {choice.promise && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  <Target className="w-3 h-3" />
                                  Commitment
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : isInterviewMode && interviewAnswer ? (
                  /* Interview mode: show the candidate's answer with a Continue button */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Show which question the owner asked */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div className="flex-1 bg-accent-blue/5 rounded-xl p-4 border border-accent-blue/20">
                        <p className="text-sm font-medium text-accent-blue mb-1">
                          You <span className="text-text-muted font-normal ml-2">Team Owner</span>
                        </p>
                        <p className="text-text-secondary italic">
                          "{currentRound.choices.find(c => c.id === currentRound.selectedChoiceId)?.text}"
                        </p>
                      </div>
                    </div>
                    
                    {/* Candidate's answer */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1 bg-surface-secondary/50 rounded-xl p-4">
                        <p className="text-sm font-medium text-status-info mb-1">
                          {activity?.name?.replace('Interview: ', '') || 'Candidate'}
                          <span className="text-text-muted font-normal ml-2">Candidate</span>
                        </p>
                        <p className="text-text-secondary italic">"{interviewAnswer}"</p>
                      </div>
                    </div>
                    
                    {/* Continue button */}
                    <div className="flex justify-end">
                      <Button variant="primary" onClick={handleInterviewContinue}>
                        {currentRoundIndex < (scenario?.rounds.length ?? 0) - 1
                          ? 'Next Question'
                          : 'Conclude Interview'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-surface-secondary/30 border border-surface-secondary"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {currentRound.outcome?.includes('well received') ? (
                        <TrendingUp className="w-5 h-5 text-status-success" />
                      ) : currentRound.outcome?.includes('didn\'t go') ? (
                        <TrendingDown className="w-5 h-5 text-status-error" />
                      ) : (
                        <Check className="w-5 h-5 text-text-muted" />
                      )}
                      <span className="text-sm text-text-muted">{currentRound.outcome}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* Conclusion State */}
            {gameState === 'conclusion' && scenario?.totalOutcome && (
              <motion.div
                key="conclusion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  {scenario.totalOutcome.success ? (
                    <Award className="w-16 h-16 text-status-success mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="w-16 h-16 text-status-warning mx-auto mb-4" />
                  )}
                  <h3 className="text-xl font-display font-bold mb-2">
                    {isInterviewMode ? 'Interview Complete' : 'Event Complete'}
                  </h3>
                  <p className="text-text-muted">{scenario.totalOutcome.summary}</p>
                </div>
                
                {/* Effects Summary */}
                <Card variant="surface" padding="lg">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent-blue" />
                    Results
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(scenario.totalOutcome.effects).map(([key, value]) => {
                      if (value === undefined || value === 0 || typeof value === 'boolean' || typeof value === 'string') return null
                      const numValue = value as number
                      const isPositive = numValue > 0
                      const meta = EFFECT_DISPLAY[key]
                      const displayLabel = meta?.label ?? key.replace(/([A-Z])/g, ' $1').trim()
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/30">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-text-primary capitalize">{displayLabel}</span>
                            {meta?.description && (
                              <span className="text-[10px] text-text-muted leading-tight truncate">{meta.description}</span>
                            )}
                          </div>
                          <span className={`font-bold whitespace-nowrap ml-2 ${isPositive ? 'text-status-success' : 'text-status-error'}`}>
                            {formatEffectValue(key, numValue)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
                
                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={handleComplete}
                    className="min-w-[200px]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete Event
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>{/* end flex row wrapper */}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// FALLBACK SCENARIO GENERATORS
// ============================================

function generateSponsorFallback(activity: ScheduledActivity): EventScenario {
  const sponsorNames = activity.configuration?.guests?.sponsorReps?.map(s => s.sponsorName) || ['your sponsors']
  
  return {
    intro: `You arrive at ${activity.configuration?.venueName || 'the venue'} for ${activity.name}. Representatives from ${sponsorNames.join(', ')} are already present, ready to discuss your partnership.

The atmosphere is professional but friendly. It's important to make a good impression and reinforce the value of your partnership.`,
    rounds: [
      {
        id: 'sponsor_1',
        situation: 'The sponsor representatives greet you warmly. They ask about your recent performance and what the future holds for the team.',
        npcName: 'Sponsor Representative',
        npcRole: 'Partnership Manager',
        npcDialogue: 'We\'ve been following your progress closely. How do you see the partnership evolving this season?',
        choices: [
          {
            id: 'confident',
            text: 'We\'re building something special here. Our trajectory is only going up, and having your support makes all the difference.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 3, reputation: 1 } }
          },
          {
            id: 'diplomatic',
            text: 'We value our partnership greatly. We\'re focused on continuous improvement and making the most of every opportunity.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2 } }
          },
          {
            id: 'honest',
            text: 'We\'ve had our challenges, but we\'re learning and adapting. Your support has been crucial through it all.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { sponsorSatisfaction: 1 } }
          },
          {
            id: 'deflecting',
            text: 'Let\'s focus on the positive aspects. We have some exciting plans that I think will interest you.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'sponsor_2',
        situation: 'The conversation shifts to brand visibility and activation opportunities.',
        npcDialogue: 'Our marketing team has been tracking impressions. How can we maximize our brand\'s presence going forward?',
        choices: [
          {
            id: 'proactive',
            text: 'I have several ideas for joint activations - social media content, fan engagement events, and exclusive behind-the-scenes access.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 4 } },
            promise: {
              text: 'Deliver a fan engagement or media event within the next 3 weeks as promised to sponsors',
              shortText: 'Fan engagement event',
              category: 'strategy',
              evaluation: { type: 'schedule_activity', activityCategory: 'media' },
              deadlineWeeks: 3,
              stakeholderRoles: ['Sponsor Representative'],
              stakeholderCategory: 'sponsor',
              rewardsIfKept: { sponsorSatisfaction: 5, reputation: 2 },
              penaltiesIfBroken: { sponsorSatisfaction: -6, reputation: -2 }
            }
          },
          {
            id: 'collaborative',
            text: 'I\'d love to hear your team\'s ideas too. A collaborative approach usually yields the best results.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2, boardMood: 1 } }
          },
          {
            id: 'standard',
            text: 'We\'ll continue with our current approach - car livery, team gear, and social media mentions.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { sponsorSatisfaction: 1 } }
          }
        ]
      },
      {
        id: 'sponsor_3',
        situation: 'Before the event concludes, the representative mentions they\'re reviewing partnership budgets.',
        npcDialogue: 'Budget season is coming up. Is there anything specific you need that could help performance?',
        choices: [
          {
            id: 'strategic',
            text: 'Additional development budget would help us compete at a higher level, which means more visibility for you.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2, cash: 5000 } },
            promise: {
              text: 'Invest in R&D development to improve competitive performance as discussed with sponsors',
              shortText: 'Invest in R&D',
              category: 'investment',
              evaluation: { type: 'spending_target', spendingCategory: 'development', spendingAmount: 5000 },
              deadlineWeeks: 4,
              stakeholderRoles: ['Sponsor Representative'],
              stakeholderCategory: 'sponsor',
              rewardsIfKept: { sponsorSatisfaction: 4, boardMood: 2 },
              penaltiesIfBroken: { sponsorSatisfaction: -5, boardMood: -2 }
            }
          },
          {
            id: 'grateful',
            text: 'We\'re grateful for the current support. If there\'s room to grow, we\'d use it wisely.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 3 } }
          },
          {
            id: 'modest',
            text: 'We\'re managing well with current resources. Let\'s focus on delivering results first.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { boardMood: 2 } }
          }
        ]
      }
    ]
  }
}

function generateTeamFallback(activity: ScheduledActivity): EventScenario {
  const tid = activity.templateId.toLowerCase()

  // ----- STAFF INTERVIEW activities -----
  if (tid.includes('staff_interview')) {
    const candidateName = activity.name?.replace('Interview: ', '') || 'the candidate'
    
    // Look up the full candidate profile from the store
    const candidateId = activity.triggerData?.interviewCandidateId
    const state = useCareerStore.getState()
    const careerState = state.careerState
    let candidate: any = null
    if (candidateId && careerState) {
      candidate = (careerState.facilityStaffMarket || []).find((s: any) => s.id === candidateId)
      if (!candidate) {
        const poolEntry = (careerState.worldStaffPool || []).find((w: any) => w.staff?.id === candidateId)
        if (poolEntry) candidate = poolEntry.staff
      }
    }
    
    // Derive role-specific and personality-specific content
    const roleName = candidate?.role ? (STAFF_ROLE_NAMES[candidate.role as keyof typeof STAFF_ROLE_NAMES] || candidate.role.replace(/_/g, ' ')) : 'this position'
    const exp = candidate?.experience || 0
    const rep = candidate?.reputation || 50
    const traits = candidate?.traits || []
    const nationality = candidate?.nationality || ''
    const age = candidate?.age || 30
    const isVeteran = exp >= 10 || age >= 40
    const isYoung = exp <= 3 || age <= 25
    const isHighRep = rep >= 70
    const isFacility = candidate?.staffCategory === 'facility'
    const bioBackground = candidate?.preGenBio?.background || candidate?.bio?.background || ''
    const highlights = candidate?.preGenBio?.careerHighlights || candidate?.bio?.careerHighlights || []
    const strengths = candidate?.preGenBio?.strengths || candidate?.bio?.strengths || []
    const weaknesses = candidate?.preGenBio?.weaknesses || candidate?.bio?.weaknesses || []
    const personalityNote = candidate?.preGenBio?.personalityNote || candidate?.bio?.personalityNote || ''
    
    // Tailor answers based on candidate profile
    const motivationAnswer = isVeteran
      ? `I've spent ${exp} years in this industry and I know what a team with real potential looks like. ${bioBackground ? bioBackground.slice(0, 120) + '...' : ''} I'm not here to coast — I want to bring everything I've learned to help you succeed.`
      : isYoung
      ? `Honestly? This is the kind of opportunity young engineers dream about. I may not have decades of experience, but I've got the drive and the technical foundation. ${highlights.length > 0 ? `I'm proud of ${highlights[0]}.` : ''} I want to prove myself here.`
      : `I've been following your team's progress and I see a real opportunity to make an impact. ${bioBackground ? bioBackground.slice(0, 100) + '...' : 'My background has prepared me well for this kind of challenge.'}`
    
    const pressureAnswer = isHighRep
      ? `I've been in high-pressure environments my entire career${nationality ? ` — from ${nationality} to the international stage` : ''}. ${personalityNote || 'I\'m known for staying composed when it matters.'} Pressure doesn't faze me; it sharpens my focus.`
      : isYoung
      ? `I won't pretend I've seen it all, but I've handled intense deadlines during my training and early roles. ${strengths.length > 0 ? `My strength in ${strengths[0]} helps me stay grounded.` : ''} I'm eager to prove I can handle whatever you throw at me.`
      : `Pressure is part of the job — I've accepted that a long time ago. ${personalityNote || 'I keep my head down and focus on solutions, not problems.'} In my experience, preparation is the best defence against chaos.`
    
    const experienceAnswer = isFacility
      ? `As a ${roleName}, I've spent my career focused on ${traits.length > 0 ? traits.slice(0, 2).join(' and ').replace(/_/g, ' ') : 'delivering results'}. ${highlights.length > 0 ? `A career highlight: ${highlights[0]}.` : `With ${exp} years of experience, I bring deep domain knowledge.`} I know how to optimise ${roleName.toLowerCase()} workflows and deliver under tight deadlines.`
      : `My experience as a ${roleName} has taught me how to balance race-weekend intensity with long-term development goals. ${highlights.length > 0 ? highlights[0] + '.' : `I've worked ${exp} years in motorsport and understand what it takes.`} I can bring that same discipline here.`
    
    const personalAnswer = nationality
      ? `I grew up in ${nationality}, which gave me a deep appreciation for precision engineering and motorsport culture. Outside of work, ${weaknesses.length > 0 ? `I'll admit I can be a bit ${weaknesses[0].toLowerCase()} at times, but` : ''} I try to stay connected to why I love racing — whether that's watching old race footage or tinkering with projects at home.`
      : `Outside of work, I'm a motorsport enthusiast through and through. I believe a healthy balance makes you sharper when it counts. ${personalityNote || "I'm the kind of person who's always curious and always learning."}`
    
    const technicalAnswer = isFacility
      ? `In a ${roleName} role, I'd approach it systematically. ${traits.includes('analytical') || traits.includes('detail_oriented') ? 'Data drives every decision I make. ' : ''}I'd analyse where we're losing the most performance per dollar spent, then prioritise accordingly. ${strengths.length > 0 ? `My strength in ${strengths[0]} would be particularly useful here.` : 'Gut feeling has its place, but not when allocating budget.'}`
      : `For a ${roleName}, it's about knowing your priorities at each stage of the season. Early on, you build a reliable foundation. Later, you take calculated risks for performance. ${traits.includes('innovative') || traits.includes('risk_taker') ? "I'm naturally inclined toward bold moves, but always backed by solid analysis." : "I believe in steady, data-driven progress — no gambles without evidence."}`
    
    const conflictAnswer = isVeteran
      ? `After ${exp} years, you learn that disagreements are where the best ideas come from — if you handle them right. I once had a serious technical dispute with a lead engineer. Instead of escalating, I suggested we both present our data independently. The result was a solution neither of us would have found alone.`
      : `I had a disagreement with a senior colleague early in my career about a technical approach. Rather than backing down or being confrontational, I prepared a clear comparison of both methods. ${personalityNote || 'I believe respect and evidence are the best tools for resolving conflict.'} We ended up combining the best of both approaches.`
    
    const chaosAnswer = isHighRep
      ? `In this industry, chaos is practically a job requirement. ${highlights.length > 1 ? `I recall ${highlights[1]} — ` : ''}I've learned to prioritise ruthlessly, communicate clearly, and make fast decisions with incomplete data. ${traits.includes('calm_under_pressure') ? "Staying calm when everyone else panics — that's where I excel." : "You deal with the crisis first, debrief later."}`
      : `We had a critical issue just before a major deadline — ${isFacility ? 'a simulation model completely failed validation' : 'a component failed scrutineering minutes before the session'}. I reorganised the team, broke the problem into manageable pieces, and we solved it under extreme time pressure. ${personalityNote || 'In chaos, I stay calm and focus on what needs to happen next.'}`
    
    const futureAnswer = isVeteran
      ? `At this stage of my career, it's not about personal advancement — it's about legacy. In two years, I want to have built systems and trained people that make this team stronger with or without me. ${strengths.length > 0 ? `My ${strengths[0]} will be a key part of that.` : 'That\'s what real success looks like.'}`
      : `In two years, I want to be someone this team can't imagine operating without. ${isYoung ? "I know I'm young, but that means I'll grow with the team." : "I want to earn trust through consistent results."} Success means the team performs better because I'm here.`
    
    const cultureAnswer = personalityNote
      ? `${personalityNote} That's what I'd bring to the team dynamic. ${traits.length > 0 ? `My ${traits[0].replace(/_/g, ' ')} nature means ` : ''}I lift others when things get tough and I hold myself to high standards without being difficult to work with.`
      : `I'm the kind of person who leads by example. I work hard, support my colleagues, and make sure everyone has what they need. ${isVeteran ? 'With my experience, I can also mentor younger team members.' : 'I believe great culture is built through daily actions, not grand speeches.'}`
    
    const commitmentAnswer = isHighRep
      ? `I've dedicated ${exp} years to this sport — that should tell you everything about my commitment. ${nationality ? `I've relocated across countries for my career. ` : ''}Long hours and race travel are part of what I signed up for. When I join a team, I'm all in.`
      : `Completely. I didn't apply for a 9-to-5. ${isYoung ? "I'm at a stage where I want to pour everything into my career." : "I understand exactly what this industry demands."} When I commit to something, I commit fully. ${personalityNote || "You won't find me cutting corners."}`
    
    const questionsAnswer = isHighRep
      ? `Yes — what's your technical development roadmap for the next two seasons? ${isFacility ? "For a facility operation like yours, long-term investment strategy matters as much as the people." : "For a race team, I want to know your ambitions and how realistic the targets are."} If the vision aligns, I'm ready to sign today.`
      : `Just one thing — what's your vision for this team over the next few years? I want to make sure the ambition here matches what I'm looking for. ${isYoung ? "I want to grow somewhere, not just fill a seat." : "If the fit is right, I'm all in."}`
    
    return {
      intro: `You sit down in the meeting room for the interview with ${candidateName}${candidate ? `, a ${age}-year-old ${nationality} ${roleName} with ${exp} years of experience` : ''}. Their CV is on the table in front of you. Time to find out if they're the right fit for ${activity.configuration?.venueName || 'your team'}.`,
      rounds: [
        {
          id: 'interview_1',
          situation: `${candidateName} takes a seat across from you. ${isVeteran ? 'They carry themselves with the quiet confidence of someone who\'s been through countless interviews.' : isYoung ? 'They look sharp and eager, clearly excited about this opportunity.' : 'They seem prepared but there\'s a hint of nervousness. This is their chance to impress.'}`,
          choices: [
            {
              id: 'motivation',
              text: `So, ${candidateName} — tell me, what specifically drew you to this team? We're still building here.`,
              tone: 'diplomatic',
              effects: { outcome: motivationAnswer, modifiers: { teamMorale: 1, boardMood: 1 } }
            },
            {
              id: 'pressure',
              text: `I'll be straight with you — the ${roleName} role demands long hours and high pressure. What makes you think you can handle it?`,
              tone: 'bold',
              effects: { outcome: pressureAnswer, modifiers: { boardMood: 2 } }
            },
            {
              id: 'experience',
              text: `Walk me through your most relevant experience as a ${roleName}. What have you done that prepares you for this specific role?`,
              tone: 'professional',
              effects: { outcome: experienceAnswer, modifiers: { teamMorale: 1, boardMood: 1 } }
            },
            {
              id: 'personal',
              text: "Before we dive into the technical stuff — tell me a bit about yourself. What do you do outside of work?",
              tone: 'friendly',
              effects: { outcome: personalAnswer, modifiers: { teamMorale: 2 } }
            }
          ]
        },
        {
          id: 'interview_2',
          situation: `${candidateName} has loosened up and seems more confident. ${isVeteran ? 'Their experience shows — every answer is measured and thoughtful.' : isYoung ? 'Their enthusiasm is infectious, even if some answers show their relative inexperience.' : 'Time to dig into their technical ability and problem-solving.'}`,
          choices: [
            {
              id: 'technical',
              text: isFacility
                ? `As a ${roleName}, if you had limited budget and had to choose between upgrading equipment or hiring more staff, how would you approach that?`
                : "If you had limited budget and had to choose between reliability improvements and performance gains, how would you approach that?",
              tone: 'professional',
              effects: { outcome: technicalAnswer, modifiers: { boardMood: 2, teamMorale: 1 } }
            },
            {
              id: 'conflict',
              text: "Tell me about a time you disagreed with a colleague. How did you resolve it?",
              tone: 'diplomatic',
              effects: { outcome: conflictAnswer, modifiers: { teamMorale: 2 } }
            },
            {
              id: 'chaos',
              text: "Things change fast in racing. Give me a real example of how you've handled a chaotic situation.",
              tone: 'bold',
              effects: { outcome: chaosAnswer, modifiers: { teamMorale: 1, boardMood: 1 } }
            }
          ]
        },
        {
          id: 'interview_3',
          situation: `The interview is nearing its end. ${candidateName} ${isHighRep ? 'seems relaxed and assured — they know their worth in this market' : 'maintains steady eye contact — they clearly want this role'}. Time to explore fit and expectations.`,
          choices: [
            {
              id: 'future',
              text: "Where do you see yourself in two years if you join us? What does success look like?",
              tone: 'professional',
              effects: { outcome: futureAnswer, modifiers: { boardMood: 2, reputation: 1 } }
            },
            {
              id: 'culture',
              text: "Our culture is still being shaped. What would you bring to the team dynamic?",
              tone: 'diplomatic',
              effects: { outcome: cultureAnswer, modifiers: { teamMorale: 2, reputation: 1 } }
            },
            {
              id: 'commitment',
              text: "I expect full commitment from everyone — long hours, weekends, race travel. Are you truly prepared for that?",
              tone: 'bold',
              effects: { outcome: commitmentAnswer, modifiers: { boardMood: 2 } }
            },
            {
              id: 'questions',
              text: "Is there anything you want to ask me about the team?",
              tone: 'friendly',
              effects: { outcome: questionsAnswer, modifiers: { teamMorale: 2, reputation: 1 } }
            }
          ]
        }
      ]
    }
  }

  // ----- FINANCE / BUDGET activities -----
  if (tid.includes('finance') || tid.includes('budget')) {
    return {
      intro: `You sit down with the finance team for ${activity.name}. Spreadsheets and projections are laid out on the table. The numbers will shape every decision you make this season.`,
      rounds: [
        {
          id: 'fin_1',
          situation: 'The Finance Director presents the current cash position and projected runway.',
          npcName: 'Finance Director',
          npcDialogue: 'Here\'s where we stand. We need to decide how aggressive we want to be with spending this period. What\'s your priority?',
          choices: [
            {
              id: 'invest_rd',
              text: 'Prioritise R&D investment. Performance gains on the car will attract sponsors long-term.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { developmentPoints: 3, boardMood: 1 } },
              promise: {
                text: 'Allocate more budget to R&D to improve car performance',
                shortText: 'Increase R&D budget',
                category: 'investment',
                evaluation: { type: 'maintain_stat', stat: 'boardMood', minValue: 60 },
                deadlineWeeks: 4,
                stakeholderRoles: ['Finance Director'],
                stakeholderCategory: 'board',
                rewardsIfKept: { boardMood: 4, developmentPoints: 2 },
                penaltiesIfBroken: { boardMood: -5 }
              }
            },
            {
              id: 'conserve',
              text: 'Be conservative. Build a financial buffer so we\'re not caught out by unexpected costs.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { boardMood: 3 } }
            },
            {
              id: 'balance',
              text: 'Split it evenly across departments. No one area should be starved of resources.',
              tone: 'diplomatic',
              effects: { outcome: 'neutral', modifiers: { teamMorale: 1, boardMood: 1 } }
            }
          ]
        },
        {
          id: 'fin_2',
          situation: 'A discussion about revenue streams and how to grow income beyond race winnings.',
          npcName: 'Commercial Manager',
          npcDialogue: 'We have three possible revenue initiatives. Which direction should we push hardest?',
          choices: [
            {
              id: 'sponsorship',
              text: 'Focus on attracting new sponsors. We need stronger commercial partnerships.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 2, boardMood: 1 } }
            },
            {
              id: 'merch',
              text: 'Invest in merchandise and fan engagement. Build the brand from the ground up.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 1, fanSentiment: 2 } }
            },
            {
              id: 'cost_cut',
              text: 'Before we chase revenue, let\'s reduce unnecessary costs and get leaner.',
              tone: 'honest',
              effects: { outcome: 'neutral', modifiers: { boardMood: 2 } }
            }
          ]
        },
        {
          id: 'fin_3',
          situation: 'The board representative asks about financial targets for the coming weeks.',
          npcName: 'Board Representative',
          npcDialogue: 'What can the board expect in terms of financial progress? We need something concrete.',
          choices: [
            {
              id: 'ambitious_targets',
              text: 'We\'ll aim to be cash-flow positive within two months. Aggressive but achievable.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { boardMood: 4 } },
              promise: {
                text: 'Achieve positive cash flow within the committed timeline',
                shortText: 'Positive cash flow target',
                category: 'performance',
                evaluation: { type: 'maintain_stat', stat: 'boardMood', minValue: 65 },
                deadlineWeeks: 8,
                stakeholderRoles: ['Board Representative'],
                stakeholderCategory: 'board',
                rewardsIfKept: { boardMood: 6, reputation: 2 },
                penaltiesIfBroken: { boardMood: -8, reputation: -2 }
              }
            },
            {
              id: 'steady',
              text: 'We\'ll stabilise first, then grow. I\'d rather under-promise and over-deliver.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { boardMood: 2 } }
            },
            {
              id: 'deflect',
              text: 'It\'s too early to commit to specific numbers. Let me review and come back to you.',
              tone: 'deflecting',
              effects: { outcome: 'bad', modifiers: { boardMood: -2 } }
            }
          ]
        }
      ]
    }
  }

  // ----- HR / STAFFING activities -----
  if (tid.includes('hr') || tid.includes('staffing')) {
    return {
      intro: `You sit down with the HR manager for ${activity.name}. The team structure and staffing priorities need your direction. The right hires now will define the team's trajectory.`,
      rounds: [
        {
          id: 'hr_1',
          situation: 'The HR Manager presents the current team structure and highlights gaps.',
          npcName: 'HR Manager',
          npcDialogue: 'We have some key positions unfilled. Given our budget, which area should we prioritise hiring for first?',
          choices: [
            {
              id: 'engineering',
              text: 'Engineering talent. We need stronger technical capability to develop the car.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 1 } }
            },
            {
              id: 'operations',
              text: 'Operations and logistics. Race weekends need to run like clockwork.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
            },
            {
              id: 'commercial',
              text: 'Commercial and marketing. We need people who can bring in sponsors and grow revenue.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 1, boardMood: 1 } }
            }
          ]
        },
        {
          id: 'hr_2',
          situation: 'A discussion about team culture and how to retain talent.',
          npcName: 'HR Manager',
          npcDialogue: 'We\'ve had some interest from staff at rival teams, but they want assurances about our long-term plans. How should we position ourselves?',
          choices: [
            {
              id: 'ambitious_pitch',
              text: 'Tell them we\'re building something special. This is the ground floor of a future championship team.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { teamMorale: 3, reputation: 1 } },
              promise: {
                text: 'Build a competitive team environment that retains and attracts top talent',
                shortText: 'Build competitive team culture',
                category: 'development',
                evaluation: { type: 'maintain_stat', stat: 'teamMorale', minValue: 65 },
                deadlineWeeks: 6,
                stakeholderRoles: ['HR Manager'],
                stakeholderCategory: 'team',
                rewardsIfKept: { teamMorale: 5, reputation: 2 },
                penaltiesIfBroken: { teamMorale: -5, reputation: -2 }
              }
            },
            {
              id: 'honest_pitch',
              text: 'Be transparent about where we are. The right people will be motivated by the challenge.',
              tone: 'honest',
              effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
            },
            {
              id: 'competitive_salary',
              text: 'Offer competitive packages. Money talks, especially when we\'re the underdog.',
              tone: 'diplomatic',
              effects: { outcome: 'neutral', modifiers: { boardMood: -1, teamMorale: 1 } }
            }
          ]
        },
        {
          id: 'hr_3',
          situation: 'Final topic: staff development and training programmes.',
          npcName: 'HR Manager',
          npcDialogue: 'Should we invest in training our existing staff or focus purely on hiring experienced people?',
          choices: [
            {
              id: 'train',
              text: 'Invest in our people. Training builds loyalty and fills gaps we can\'t afford to hire for.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 4 } }
            },
            {
              id: 'hire_experienced',
              text: 'We need experienced heads right now. Training takes too long when you\'re behind.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: -1 } }
            },
            {
              id: 'mix',
              text: 'A mix of both. Bring in one or two experienced leaders and develop the rest internally.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 2, developmentPoints: 1 } }
            }
          ]
        }
      ]
    }
  }

  // ----- OPERATIONS REVIEW activities -----
  if (tid.includes('operations') || tid.includes('review')) {
    const tmName = getStaffNameOrFallback('team_manager', 'Operations Lead')
    return {
      intro: `The team gathers for ${activity.name}. This is a chance to reflect on what's working, what's not, and where to focus next.${teamHasStaff() ? ' Key staff have prepared their updates.' : ''}`,
      rounds: [
        {
          id: 'ops_1',
          situation: `${tmName} presents a summary of recent operations and flags areas of concern.`,
          npcName: tmName,
          npcDialogue: 'We\'ve identified some bottlenecks in our workflow. The biggest issue is turnaround time between sessions. How do you want to address this?',
          choices: [
            {
              id: 'process',
              text: 'Redesign our processes. Let\'s map out every step and eliminate waste.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { teamMorale: 2, developmentPoints: 1 } }
            },
            {
              id: 'people',
              text: 'It\'s a people issue. We need better communication between departments.',
              tone: 'honest',
              effects: { outcome: 'good', modifiers: { teamMorale: 3 } }
            },
            {
              id: 'equipment',
              text: 'Invest in better tools and equipment. Our team is held back by what they have to work with.',
              tone: 'confident',
              effects: { outcome: 'neutral', modifiers: { boardMood: -1, developmentPoints: 2 } }
            }
          ]
        },
        {
          id: 'ops_2',
          situation: 'Staff feedback on what\'s going well and what needs attention.',
          npcName: 'Chief Mechanic',
          npcDialogue: 'The team\'s been working hard but we\'re spread thin. Morale is okay but people are tired. What\'s your message to the team?',
          choices: [
            {
              id: 'acknowledge',
              text: 'I see the effort and I appreciate it. Let\'s find ways to give people breathing room.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 4 } },
              promise: {
                text: 'Reduce team workload pressure in the coming weeks',
                shortText: 'Ease team workload',
                category: 'wellbeing',
                evaluation: { type: 'schedule_activity', activityCategory: 'personal' },
                deadlineWeeks: 3,
                stakeholderRoles: ['Chief Mechanic'],
                stakeholderCategory: 'team',
                rewardsIfKept: { teamMorale: 5, confidence: 2 },
                penaltiesIfBroken: { teamMorale: -6 }
              }
            },
            {
              id: 'push',
              text: 'We\'re in a critical phase. I need everyone to dig deep for a few more weeks.',
              tone: 'confident',
              effects: { outcome: 'bad', modifiers: { teamMorale: -2, boardMood: 2 } }
            },
            {
              id: 'rotate',
              text: 'Let\'s rotate responsibilities so no one is carrying too much for too long.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 3 } }
            }
          ]
        },
        {
          id: 'ops_3',
          situation: 'Setting priorities for the next phase of operations.',
          npcName: tmName,
          npcDialogue: 'Looking ahead, what should our operational focus be?',
          choices: [
            {
              id: 'reliability',
              text: 'Reliability and consistency. We need to be a team that executes perfectly every race weekend.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { teamMorale: 2, boardMood: 2 } }
            },
            {
              id: 'speed',
              text: 'Speed of development. We need to iterate faster than our rivals.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 1 } }
            },
            {
              id: 'culture',
              text: 'Team culture first. A happy, aligned team will outperform a stressed, talented one.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 4 } }
            }
          ]
        }
      ]
    }
  }

  // ----- HANDOFF MEETING -----
  if (tid.includes('handoff')) {
    const handoffNpc = getStaffNameOrFallback('team_manager', 'Onboarding Advisor')
    return {
      intro: `This is it -- ${activity.name}. The onboarding period is over and from here, you're running the show.${teamHasStaff() ? ' Your team is here to hand over the reins officially.' : ' Time to take the wheel.'}`,
      rounds: [
        {
          id: 'handoff_1',
          situation: 'The outgoing operations lead summarises what they\'ve set up and what still needs attention.',
          npcName: 'Operations Lead',
          npcDialogue: 'I\'ve done what I can to get things moving. There are a few loose ends though. What do you want to tackle first as the new boss?',
          choices: [
            {
              id: 'team_structure',
              text: 'I want to review the team structure and make sure we have the right people in the right roles.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { teamMorale: 2, boardMood: 2 } }
            },
            {
              id: 'finances',
              text: 'Finances first. I need to fully understand our cash position before making any big moves.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { boardMood: 3 } }
            },
            {
              id: 'performance',
              text: 'Car performance. Everything else supports getting faster on track.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 1 } }
            }
          ]
        },
        {
          id: 'handoff_2',
          situation: 'Your team looks to you for your leadership philosophy.',
          npcName: handoffNpc,
          npcDialogue: 'Now that you\'re fully in charge, what kind of team principal do you want to be?',
          choices: [
            {
              id: 'hands_on',
              text: 'I\'m hands-on. I want to be involved in every decision until I fully understand how this team operates.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { teamMorale: 2, boardMood: 1 } }
            },
            {
              id: 'delegate',
              text: 'I trust the experts. I\'ll set the direction and let the team execute. My door is always open.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { teamMorale: 4 } }
            },
            {
              id: 'results',
              text: 'Results-driven. I care about outcomes. Show me what you can do and you\'ll have my full support.',
              tone: 'honest',
              effects: { outcome: 'good', modifiers: { boardMood: 3, teamMorale: 1 } }
            }
          ]
        }
      ]
    }
  }

  // ----- DEFAULT: Generic team meeting fallback -----
  const defaultCE = getStaffNameOrFallback('chief_engineer', 'Lead Engineer')
  const hasTeam = teamHasStaff()
  return {
    intro: `${hasTeam ? 'The team gathers at' : 'You sit down at'} ${activity.configuration?.venueName || 'the meeting room'} for ${activity.name}.${hasTeam ? ' Engineers, mechanics, and key staff are present, ready to discuss the team\'s direction.' : ' Time to plan the team\'s direction.'}

This is an important opportunity to ${hasTeam ? 'align the team and address any concerns' : 'set priorities and plan your next moves'}.`,
    rounds: [
      {
        id: 'team_1',
        situation: `${defaultCE} presents recent data and asks for your input on development priorities.`,
        npcName: defaultCE,
        npcDialogue: 'We have limited resources. Should we focus on fixing our weaknesses or building on our strengths?',
        choices: [
          {
            id: 'weakness',
            text: 'Let\'s address our weaknesses. We can\'t afford to have any glaring issues holding us back.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 1 } }
          },
          {
            id: 'strength',
            text: 'Build on our strengths. Let\'s maximize what we do well and make it our competitive advantage.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2 } }
          },
          {
            id: 'balanced',
            text: 'A balanced approach - incremental improvements across the board.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 1, teamMorale: 1 } }
          }
        ]
      },
      {
        id: 'team_2',
        situation: 'A team member raises concerns about workload and morale.',
        npcName: 'Team Member',
        npcDialogue: 'The pace has been intense. Some of us are feeling the pressure. How are we addressing burnout?',
        choices: [
          {
            id: 'supportive',
            text: 'Your wellbeing is a priority. Let\'s look at our schedule and find ways to ease the pressure.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 5 } },
            promise: {
              text: 'Address team burnout by scheduling lighter workloads or personal time',
              shortText: 'Address team burnout',
              category: 'wellbeing',
              evaluation: { type: 'schedule_activity', activityCategory: 'personal' },
              deadlineWeeks: 2,
              stakeholderRoles: ['Team Member'],
              stakeholderCategory: 'team',
              rewardsIfKept: { teamMorale: 6, confidence: 2 },
              penaltiesIfBroken: { teamMorale: -8, confidence: -3 }
            }
          },
          {
            id: 'motivational',
            text: 'The hard work will pay off. We\'re building something great here, and I appreciate everyone\'s dedication.',
            tone: 'confident',
            effects: { outcome: 'neutral', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'direct',
            text: 'This is a competitive environment. We need to push through, but I hear your concerns.',
            tone: 'honest',
            effects: { outcome: 'bad', modifiers: { teamMorale: -2, boardMood: 1 } }
          }
        ]
      },
      {
        id: 'team_3',
        situation: 'The meeting concludes with a discussion about upcoming goals.',
        npcDialogue: 'What\'s our realistic target for the next few races?',
        choices: [
          {
            id: 'ambitious',
            text: 'We\'re going for wins. Anything less than podiums should feel like a missed opportunity.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { teamMorale: 3, boardMood: 2 } },
            promise: {
              text: 'Achieve a top 3 finish in the next few races as you told the team',
              shortText: 'Top 3 race finish',
              category: 'performance',
              evaluation: { type: 'race_result', maxPosition: 3, withinRaces: 3 },
              deadlineWeeks: 6,
              stakeholderRoles: ['Chief Engineer', 'Team Member'],
              stakeholderCategory: 'team',
              rewardsIfKept: { teamMorale: 8, boardMood: 5, reputation: 3 },
              penaltiesIfBroken: { teamMorale: -6, boardMood: -4, reputation: -2 }
            }
          },
          {
            id: 'realistic',
            text: 'Consistent points finishes. Let\'s build momentum race by race.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2, boardMood: 1 } }
          },
          {
            id: 'cautious',
            text: 'Let\'s see where we are after the next race and adjust from there.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { teamMorale: 1 } }
          }
        ]
      }
    ]
  }
}

function generateMediaFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `The media event is about to begin at ${activity.configuration?.venueName || 'the venue'}. Journalists and cameras are set up, ready to hear from you.

Remember: everything you say could end up in headlines. Choose your words carefully.`,
    rounds: [
      {
        id: 'media_1',
        situation: 'A journalist asks about your recent performance and expectations.',
        npcName: 'Sports Journalist',
        npcRole: 'Motorsport Weekly',
        npcDialogue: 'Your recent results have been mixed. Are you satisfied with where the team is right now?',
        choices: [
          {
            id: 'positive',
            text: 'We\'re making progress every race. The results don\'t always show it, but the data tells a positive story.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { reputation: 2, fanSentiment: 2 } }
          },
          {
            id: 'honest',
            text: 'We know we can do better. We\'re working hard to find those extra tenths.',
            tone: 'honest',
            effects: { outcome: 'good', modifiers: { reputation: 1, fanSentiment: 3 } }
          },
          {
            id: 'defensive',
            text: 'Results aren\'t everything. The competition is fierce and we\'re holding our own.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { reputation: -1 } }
          }
        ]
      },
      {
        id: 'media_2',
        situation: 'A question comes up about a rival team\'s recent success.',
        npcDialogue: 'What do you think about [Rival Team]\'s performance this season?',
        choices: [
          {
            id: 'respectful',
            text: 'They\'ve done a great job. Credit where it\'s due. It motivates us to work harder.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { reputation: 2 } }
          },
          {
            id: 'competitive',
            text: 'They\'re doing well, but we\'re not far behind. The season is long.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fanSentiment: 2 } }
          },
          {
            id: 'dismissive',
            text: 'We focus on ourselves. I don\'t pay much attention to what others are doing.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'media_3',
        situation: 'A fan question is relayed through social media.',
        npcDialogue: 'A fan asks: What message do you have for your supporters?',
        choices: [
          {
            id: 'grateful',
            text: 'Our fans are incredible. Their support keeps us going, especially during tough times. We race for them.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { fanSentiment: 5, reputation: 1 } }
          },
          {
            id: 'promise',
            text: 'Keep believing in us. We\'re working to give you something to celebrate soon.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fanSentiment: 3 } },
            promise: {
              text: 'Deliver a result worth celebrating — score points or better in an upcoming race',
              shortText: 'Score points soon',
              category: 'performance',
              evaluation: { type: 'race_result', maxPosition: 10, withinRaces: 2 },
              deadlineWeeks: 4,
              stakeholderRoles: ['Sports Journalist'],
              stakeholderCategory: 'media',
              rewardsIfKept: { fanSentiment: 6, reputation: 3 },
              penaltiesIfBroken: { fanSentiment: -5, reputation: -3 }
            }
          },
          {
            id: 'standard',
            text: 'Thank you for the support. We appreciate everyone who follows us.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { fanSentiment: 1 } }
          }
        ]
      }
    ]
  }
}

function generateDevelopmentFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `The ${activity.name} session begins. Engineers and technical staff are gathered, data and simulations ready for review.

This is where the car gets faster - through careful analysis and smart decisions.`,
    rounds: [
      {
        id: 'dev_1',
        situation: 'The data shows two potential development paths.',
        npcName: 'Lead Engineer',
        npcDialogue: 'We can optimize for straight-line speed or cornering. Which direction should we take?',
        choices: [
          {
            id: 'speed',
            text: 'Straight-line speed. It\'s easier to measure and defend positions.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 3 } }
          },
          {
            id: 'cornering',
            text: 'Cornering. That\'s where races are won and lost.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 3 } }
          },
          {
            id: 'balance',
            text: 'Let\'s find a balance. We need to be competitive everywhere.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 2 } }
          }
        ]
      },
      {
        id: 'dev_2',
        situation: 'A junior engineer proposes an unconventional approach.',
        npcDialogue: 'I have an idea that\'s a bit unorthodox, but the simulations look promising...',
        choices: [
          {
            id: 'encourage',
            text: 'Let\'s hear it. Innovation comes from trying new things.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 3 } },
            promise: {
              text: 'Follow through on supporting innovative development approaches',
              shortText: 'Support R&D innovation',
              category: 'development',
              evaluation: { type: 'spending_target', spendingCategory: 'development', spendingAmount: 3000 },
              deadlineWeeks: 4,
              stakeholderRoles: ['Lead Engineer'],
              stakeholderCategory: 'team',
              rewardsIfKept: { teamMorale: 4, developmentPoints: 3 },
              penaltiesIfBroken: { teamMorale: -5, developmentPoints: -1 }
            }
          },
          {
            id: 'cautious',
            text: 'Interesting. Let\'s run more simulations before committing.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 1, teamMorale: 1 } }
          },
          {
            id: 'dismiss',
            text: 'We should stick to proven methods. Too risky to experiment now.',
            tone: 'deflecting',
            effects: { outcome: 'bad', modifiers: { teamMorale: -2 } }
          }
        ]
      }
    ]
  }
}

function generatePersonalFallback(activity: ScheduledActivity): EventScenario {
  const tid = activity.templateId.toLowerCase()

  // ----- NETWORKING EVENT -----
  if (tid.includes('networking')) {
    return {
      intro: `You arrive at ${activity.name}. The room is buzzing with industry figures -- team owners, engineers, sponsors, and media personalities. A few familiar faces nod in your direction. Time to make the most of it.`,
      rounds: [
        {
          id: 'net_1',
          situation: 'You spot a group of team principals from established teams having a conversation near the bar.',
          npcName: 'Established Team Principal',
          npcDialogue: 'Ah, the new kid on the block! Tell us -- what made you jump into team ownership?',
          choices: [
            {
              id: 'passion',
              text: 'Pure passion for the sport. I saw an opportunity and I couldn\'t let it pass.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 3, confidence: 1 } }
            },
            {
              id: 'business',
              text: 'I see it as a business opportunity as much as a sporting one. The commercial potential is huge.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 2, boardMood: 1 } }
            },
            {
              id: 'humble',
              text: 'I\'m still learning. I\'m here because I want to surround myself with people who know the sport better than I do.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { reputation: 2, teamMorale: 1 } }
            }
          ]
        },
        {
          id: 'net_2',
          situation: 'A potential sponsor approaches you. They\'re interested in motorsport but haven\'t committed to anyone yet.',
          npcName: 'Corporate Executive',
          npcDialogue: 'We\'ve been looking at several teams. What would make your team the right partner for our brand?',
          choices: [
            {
              id: 'sell_vision',
              text: 'We\'re a fresh brand with a growing fanbase. Early partners get the most exposure as we rise through the ranks.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 2, marketability: 2 } },
              promise: {
                text: 'Grow the team\'s brand visibility to attract new sponsors',
                shortText: 'Grow brand visibility',
                category: 'strategy',
                evaluation: { type: 'improve_stat', stat: 'reputation', delta: 3 },
                deadlineWeeks: 6,
                stakeholderRoles: ['Corporate Executive'],
                stakeholderCategory: 'sponsor',
                rewardsIfKept: { reputation: 4, marketability: 3 },
                penaltiesIfBroken: { reputation: -2 }
              }
            },
            {
              id: 'data_driven',
              text: 'I can show you the numbers -- our social engagement is growing fast and our demographic is exactly what brands want.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { reputation: 1, marketability: 2 } }
            },
            {
              id: 'casual',
              text: 'Let\'s grab a drink and talk about it properly. I\'d rather get to know you before making a pitch.',
              tone: 'diplomatic',
              effects: { outcome: 'neutral', modifiers: { reputation: 1 } }
            }
          ]
        },
        {
          id: 'net_3',
          situation: 'An industry journalist corners you for an off-the-record chat.',
          npcName: 'Industry Journalist',
          npcDialogue: 'Off the record -- what\'s the real story with your team? Any surprises coming this season?',
          choices: [
            {
              id: 'tease',
              text: 'We have a few things in the works. Keep watching -- you\'ll want to cover us.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 2, fanSentiment: 2 } }
            },
            {
              id: 'guarded',
              text: 'You know I can\'t say too much. But I\'m very excited about where we\'re headed.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { reputation: 1 } }
            },
            {
              id: 'open',
              text: 'Honestly, we\'re still finding our feet. But the potential is there and the team believes in what we\'re building.',
              tone: 'honest',
              effects: { outcome: 'good', modifiers: { reputation: 2, teamMorale: 1 } }
            }
          ]
        }
      ]
    }
  }

  // ----- CHARITY / PUBLIC APPEARANCE -----
  if (tid.includes('charity') || tid.includes('visibility') || tid.includes('appearance')) {
    return {
      intro: `You arrive at ${activity.name}. Cameras and event organisers are ready. This is a chance to build your public profile and show the human side of the team. How you present yourself matters.`,
      rounds: [
        {
          id: 'char_1',
          situation: 'The event organiser introduces you to the crowd and asks you to say a few words.',
          npcName: 'Event Organiser',
          npcDialogue: 'The audience would love to hear from you. What brings you here today?',
          choices: [
            {
              id: 'genuine',
              text: 'This cause is close to my heart. Motorsport has given me so much, and it\'s important to give back.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { reputation: 3, fanSentiment: 3 } }
            },
            {
              id: 'team_focused',
              text: 'The whole team wanted to be involved. We believe in being more than just a racing team.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 2, teamMorale: 2 } }
            },
            {
              id: 'brief',
              text: 'I\'m happy to be here. Let\'s enjoy the event -- actions speak louder than words.',
              tone: 'honest',
              effects: { outcome: 'neutral', modifiers: { reputation: 1, fanSentiment: 1 } }
            }
          ]
        },
        {
          id: 'char_2',
          situation: 'A local media crew asks for a quick interview about your involvement.',
          npcName: 'Local Reporter',
          npcDialogue: 'Can you tell us about your plans for community engagement going forward?',
          choices: [
            {
              id: 'commit',
              text: 'Absolutely. We\'re looking at regular community events and youth engagement programmes. This is just the start.',
              tone: 'confident',
              effects: { outcome: 'good', modifiers: { reputation: 3, fanSentiment: 2 } },
              promise: {
                text: 'Follow through on community engagement and maintain a positive public profile',
                shortText: 'Community engagement commitment',
                category: 'strategy',
                evaluation: { type: 'maintain_stat', stat: 'reputation', minValue: 50 },
                deadlineWeeks: 6,
                stakeholderRoles: ['Local Reporter'],
                stakeholderCategory: 'media',
                rewardsIfKept: { reputation: 4, fanSentiment: 3 },
                penaltiesIfBroken: { reputation: -3, fanSentiment: -2 }
              }
            },
            {
              id: 'measured',
              text: 'We want to do more, but I want to make sure we do it right rather than just making promises.',
              tone: 'diplomatic',
              effects: { outcome: 'good', modifiers: { reputation: 2 } }
            },
            {
              id: 'redirect',
              text: 'Today is about the event, not about us. Let\'s keep the focus on the cause.',
              tone: 'honest',
              effects: { outcome: 'good', modifiers: { reputation: 1, fanSentiment: 2 } }
            }
          ]
        }
      ]
    }
  }

  // ----- DEFAULT: Generic personal activity -----
  return {
    intro: `You step away from the racing world for ${activity.name}. Sometimes the best thing you can do for performance is recharge.`,
    rounds: [
      {
        id: 'personal_1',
        situation: 'You have some free time to yourself. How do you want to spend it?',
        choices: [
          {
            id: 'active',
            text: 'Hit the gym or go for a run to clear your head and build fitness.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fitness: 3, driverMorale: 1 } }
          },
          {
            id: 'social',
            text: 'Catch up with friends or family -- quality time you rarely get during the season.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { driverMorale: 3, confidence: 2 } }
          },
          {
            id: 'relax',
            text: 'Just rest. Sleep in, watch something, and decompress completely.',
            tone: 'deflecting',
            effects: { outcome: 'good', modifiers: { driverMorale: 2, stress: -2 } }
          }
        ]
      },
      {
        id: 'personal_2',
        situation: 'An unexpected message arrives -- a former colleague wants to meet for coffee and discuss a potential opportunity.',
        choices: [
          {
            id: 'accept',
            text: 'Agree to meet. Could be a useful connection, and you\'re curious.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { reputation: 2, marketability: 1 } },
            promise: {
              text: 'Follow up on the networking opportunity -- maintain or grow your reputation',
              shortText: 'Grow reputation',
              category: 'strategy',
              evaluation: { type: 'improve_stat', stat: 'reputation', delta: 2 },
              deadlineWeeks: 4,
              stakeholderRoles: ['Team Manager'],
              stakeholderCategory: 'personal',
              rewardsIfKept: { reputation: 3, marketability: 2 },
              penaltiesIfBroken: { reputation: -1 }
            }
          },
          {
            id: 'postpone',
            text: 'Suggest meeting another time -- today is about you, not business.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { driverMorale: 1, stress: -1 } }
          },
          {
            id: 'decline',
            text: 'Politely decline. You need boundaries between work and personal life.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { stress: -2 } }
          }
        ]
      }
    ]
  }
}

function generateGenericFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `You arrive for ${activity.name}. The venue is prepared and everyone is ready to begin.`,
    rounds: [
      {
        id: 'generic_1',
        situation: 'The event begins with introductions and setting expectations.',
        choices: [
          {
            id: 'engage',
            text: 'Take an active role in leading discussions and setting the agenda.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { reputation: 1, teamMorale: 1 } }
          },
          {
            id: 'participate',
            text: 'Participate thoughtfully, listening as much as speaking.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'observe',
            text: 'Take a more observational approach, speaking only when necessary.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'generic_2',
        situation: 'A decision needs to be made about how to proceed.',
        choices: [
          {
            id: 'decisive',
            text: 'Make a clear decision and move forward confidently.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { boardMood: 2 } }
          },
          {
            id: 'collaborative',
            text: 'Seek input from others before deciding.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'defer',
            text: 'Defer the decision for now - more information is needed.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      }
    ]
  }
}

// ============================================
// AI PROMISE CONVERSION HELPERS
// ============================================

import type { PromiseEvaluation, PromiseCategory } from '@/simulation/promises'
import type { ActivityEffect } from '@/store/careerStore'

/** Infer a reasonable evaluation from the promise category */
function inferEvaluationFromCategory(category: PromiseCategory): PromiseEvaluation {
  switch (category) {
    case 'performance':
      return { type: 'race_result', maxPosition: 5, withinRaces: 3 }
    case 'investment':
      return { type: 'spending_target', spendingCategory: 'development', spendingAmount: 5000 }
    case 'wellbeing':
      return { type: 'schedule_activity', activityCategory: 'personal' }
    case 'strategy':
      return { type: 'schedule_activity', activityCategory: 'media' }
    case 'development':
      return { type: 'spending_target', spendingCategory: 'development', spendingAmount: 3000 }
    default:
      return { type: 'maintain_stat', stat: 'teamMorale', threshold: 60 }
  }
}

/** Infer rewards based on promise category */
function inferRewardsFromCategory(category: PromiseCategory): ActivityEffect {
  switch (category) {
    case 'performance': return { teamMorale: 5, boardMood: 3, reputation: 2 }
    case 'investment': return { boardMood: 3, sponsorSatisfaction: 3 }
    case 'wellbeing': return { teamMorale: 6, confidence: 2 }
    case 'strategy': return { sponsorSatisfaction: 4, reputation: 2 }
    case 'development': return { teamMorale: 3, developmentPoints: 2 }
    default: return { teamMorale: 3, boardMood: 2 }
  }
}

/** Infer penalties based on promise category */
function inferPenaltiesFromCategory(category: PromiseCategory): ActivityEffect {
  switch (category) {
    case 'performance': return { teamMorale: -5, boardMood: -3, reputation: -2 }
    case 'investment': return { boardMood: -4, sponsorSatisfaction: -3 }
    case 'wellbeing': return { teamMorale: -7, confidence: -3 }
    case 'strategy': return { sponsorSatisfaction: -5, reputation: -2 }
    case 'development': return { teamMorale: -4, developmentPoints: -1 }
    default: return { teamMorale: -3, boardMood: -2 }
  }
}

/** Map activity category to stakeholder category */
function mapCategoryToStakeholder(activityCategory?: string): 'team' | 'sponsor' | 'media' | 'board' | 'personal' {
  switch (activityCategory) {
    case 'sponsor': return 'sponsor'
    case 'media': return 'media'
    case 'personal': return 'personal'
    case 'team':
    case 'development':
    case 'maintenance':
    default: return 'team'
  }
}
