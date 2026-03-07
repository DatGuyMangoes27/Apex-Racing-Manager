/**
 * Negotiation Modal Component
 * 
 * Displays current sponsor negotiation state, allows reviewing and adjusting
 * offer terms, and handles accepting/countering/declining negotiations.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Handshake,
  DollarSign,
  Trophy,
  Medal,
  Crown,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
  Send,
  MessageSquare,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  Megaphone,
  Users,
  LineChart,
  Star,
  Calendar,
  Camera,
  Gift,
  Sparkles,
  Shield,
  Ban,
  ArrowRight
} from 'lucide-react'
import { Modal, Button, Badge, Card, useToast, SponsorLogo } from '@/components/ui'
import { getSponsorLogo } from '@/utils/generated-assets'
import {
  SponsorNegotiation,
  SponsorOffer,
  NegotiationRound,
  TeamSponsorSlot,
  OwnedTeam,
  useCareerStore,
  Email
} from '@/store/careerStore'
import {
  calculateOfferDifference,
  isCounterAcceptable,
  processSponsorCounterResponse,
  acceptNegotiation,
  NEGOTIATION_CONFIG,
  getSponsorDeclinePenalty,
  DECLINE_COOLDOWN_WEEKS,
  getResponseDelay
} from '@/simulation/sponsors/negotiation'
import {
  generateCounterResponseEmail,
  generateTeamCounterEmail,
  generateAcceptanceEmail,
  generateFallbackEmail,
  buildEmailContext,
  isNegotiationAIAvailable
} from '@/services/sponsorNegotiationAI'
import { 
  SPONSOR_CATEGORIES, 
  getSponsorPriority, 
  getDefaultExpectations,
  type SponsorPriority,
  type SponsorExpectations
} from '@/data/sponsors'
import { getSponsorById, getSponsorLogoPath } from '@/services/preGeneratedContentService'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { createTeamTransaction } from '@/simulation/finances/teamFinances'
import { isSlotAvailable } from '@/simulation/finances/teamSponsors'

// ============================================
// TYPES
// ============================================

interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  negotiation: SponsorNegotiation
  team: OwnedTeam
}

interface OfferAdjustment {
  monthlyPayment: number
  winBonus: number
  podiumBonus: number
  championshipBonus: number
  duration: number
}

// ============================================
// CONSTANTS
// ============================================

const SLOT_LABELS: Record<TeamSponsorSlot, string> = {
  title: 'Title Sponsor',
  primary: 'Primary Sponsor',
  secondary: 'Secondary Sponsor',
  associate: 'Associate Sponsor'
}

const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  formal: 'Professional and structured in negotiations',
  casual: 'Relaxed and flexible in discussions',
  demanding: 'Expects results and has high standards',
  friendly: 'Open to finding mutually beneficial terms',
  corporate: 'Process-driven with clear parameters'
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NegotiationModal({ isOpen, onClose, negotiation, team }: NegotiationModalProps) {
  const { addEmail, careerState, updateCareerState, consumeHoursFromBudget, addPersonalCalendarEntry } = useCareerStore()

  // Record that the player has "contacted" this sponsor (unlocks visibility for unlock_after_contact sponsors)
  useEffect(() => {
    if (!isOpen || !negotiation?.sponsorId || !careerState) return
    const contacted = careerState.contactedSponsorIds ?? []
    if (contacted.includes(negotiation.sponsorId)) return
    updateCareerState({ contactedSponsorIds: [...contacted, negotiation.sponsorId] })
  }, [isOpen, negotiation?.sponsorId, careerState, updateCareerState])
  const { addToast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [counterMode, setCounterMode] = useState(false)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [counterOffer, setCounterOffer] = useState<OfferAdjustment>({
    monthlyPayment: negotiation.currentOffer.monthlyPayment,
    winBonus: negotiation.currentOffer.winBonus,
    podiumBonus: negotiation.currentOffer.podiumBonus,
    championshipBonus: negotiation.currentOffer.championshipBonus,
    duration: negotiation.currentOffer.duration
  })
  
  const currentWeek = careerState?.currentWeek || 1
  const currentYear = careerState?.currentYear || 2024
  
  // Calculate value differences
  const currentTotalValue = useMemo(() => {
    const o = negotiation.currentOffer
    return (o.monthlyPayment * 12) + (o.winBonus * 3) + (o.podiumBonus * 6) + (o.championshipBonus || 0)
  }, [negotiation.currentOffer])
  
  const counterTotalValue = useMemo(() => {
    return (counterOffer.monthlyPayment * 12) + (counterOffer.winBonus * 3) + 
           (counterOffer.podiumBonus * 6) + (counterOffer.championshipBonus || 0)
  }, [counterOffer])
  
  const valueChange = useMemo(() => {
    return ((counterTotalValue - currentTotalValue) / currentTotalValue) * 100
  }, [currentTotalValue, counterTotalValue])
  
  const initialTotalValue = useMemo(() => {
    const o = negotiation.initialOffer
    return (o.monthlyPayment * 12) + (o.winBonus * 3) + (o.podiumBonus * 6) + (o.championshipBonus || 0)
  }, [negotiation.initialOffer])
  
  const progressFromInitial = useMemo(() => {
    return ((currentTotalValue - initialTotalValue) / initialTotalValue) * 100
  }, [currentTotalValue, initialTotalValue])
  
  // Validate counter offer
  const counterValidation = useMemo(() => {
    const offerToValidate: SponsorOffer = {
      ...negotiation.currentOffer,
      ...counterOffer
    }
    return isCounterAcceptable(negotiation, offerToValidate)
  }, [negotiation, counterOffer])
  
  // Category info
  const categoryInfo = SPONSOR_CATEGORIES[negotiation.sponsorCategory as keyof typeof SPONSOR_CATEGORIES] || {
    name: negotiation.sponsorCategory,
    icon: '🏢'
  }
  
  // Sponsor priority and expectations
  const sponsor = getSponsorById(negotiation.sponsorId)
  const priority = sponsor ? (sponsor.priority || getSponsorPriority(sponsor)) : { primary: 'exposure', secondary: 'media' }
  const expectations = sponsor ? (sponsor.expectations || getDefaultExpectations(sponsor)) : {}
  
  // Check if player can take action
  const canTakeAction = negotiation.status === 'reviewing_offer'
  const activeSponsorsInOfferSlot = (team.finances?.sponsors || []).filter(
    (s) => s.active && s.slot === negotiation.currentOffer.slot
  )
  const slotStillAvailable = isSlotAvailable(team, negotiation.currentOffer.slot)
  const slotIsFull = !slotStillAvailable
  const [selectedReplacementSponsorId, setSelectedReplacementSponsorId] = useState<string>('')
  const selectedReplacementSponsor = activeSponsorsInOfferSlot.find((s) => s.id === selectedReplacementSponsorId) || activeSponsorsInOfferSlot[0] || null
  const activeSlotSponsorNames = activeSponsorsInOfferSlot.map((s) => s.sponsorName)
  const canReplaceExistingSponsor = slotIsFull && activeSponsorsInOfferSlot.length > 0 && !!selectedReplacementSponsor
  const replacementYearsRemaining = selectedReplacementSponsor
    ? Math.max(1, (selectedReplacementSponsor.startYear + selectedReplacementSponsor.duration) - currentYear)
    : 0
  const buyoutRateBySlot: Record<TeamSponsorSlot, number> = {
    title: 0.85,
    primary: 0.7,
    secondary: 0.6,
    associate: 0.5
  }
  const switchMonthsBySlot: Record<TeamSponsorSlot, number> = {
    title: 6,
    primary: 4,
    secondary: 3,
    associate: 2
  }
  const boardPenaltyBySlot: Record<TeamSponsorSlot, number> = {
    title: 12,
    primary: 8,
    secondary: 6,
    associate: 4
  }
  const repPenaltyScaleBySlot: Record<TeamSponsorSlot, { min: number; max: number; divisor: number }> = {
    title: { min: 8, max: 20, divisor: 300000 },
    primary: { min: 6, max: 16, divisor: 450000 },
    secondary: { min: 4, max: 12, divisor: 600000 },
    associate: { min: 3, max: 10, divisor: 800000 }
  }
  const replacementBuyoutCost = selectedReplacementSponsor
    ? Math.round(selectedReplacementSponsor.monthlyPayment * 12 * replacementYearsRemaining * buyoutRateBySlot[negotiation.currentOffer.slot])
    : 0
  const replacementSwitchFee = canReplaceExistingSponsor
    ? Math.round(negotiation.currentOffer.monthlyPayment * switchMonthsBySlot[negotiation.currentOffer.slot])
    : 0
  const replacementTotalPenalty = replacementBuyoutCost + replacementSwitchFee
  const repScale = repPenaltyScaleBySlot[negotiation.currentOffer.slot]
  const replacementRepPenalty = canReplaceExistingSponsor
    ? Math.min(repScale.max, Math.max(repScale.min, Math.round(replacementTotalPenalty / repScale.divisor)))
    : 0
  const replacementBoardPenalty = canReplaceExistingSponsor ? boardPenaltyBySlot[negotiation.currentOffer.slot] : 0
  
  // Handle accept
  const handleAccept = async () => {
    if (!canTakeAction || isProcessing) return
    setIsProcessing(true)
    
    try {
      // Convert negotiation to deal
      const newDeal = acceptNegotiation(negotiation, currentYear)
      
      // Generate acceptance email
      const emailContext = buildEmailContext(negotiation, team, currentWeek, currentYear)
      let emailContent = isNegotiationAIAvailable()
        ? await generateAcceptanceEmail({
            ...emailContext,
            offer: negotiation.currentOffer,
            initiatedBy: negotiation.initiatedBy,
            roundNumber: negotiation.rounds.length
          })
        : null
      
      if (!emailContent) {
        emailContent = generateFallbackEmail('acceptance', emailContext)
      }
      
      // Add confirmation email
      const emailId = `acceptance_${negotiation.id}_${Date.now()}`
      addEmail({
        category: 'sponsor',
        subject: emailContent.subject,
        sender: emailContent.sender,
        senderRole: emailContent.senderRole,
        preview: emailContent.preview,
        body: emailContent.body,
        receivedDay: new Date().getDay() || 7,
        receivedWeek: currentWeek,
        receivedYear: currentYear,
        read: false,
        starred: true,
        archived: false,
        actionType: 'acknowledge'
      } as Omit<Email, 'id'>)
      
      // Update store - add sponsor deal, update negotiation status
      useCareerStore.setState(state => {
        if (!state.careerState?.ownedTeam?.finances) return state
        const currentTeam = state.careerState.ownedTeam
        const currentFinances = currentTeam.finances
        
        const updatedNegotiations = currentFinances.activeNegotiations.map(n =>
          n.id === negotiation.id
            ? { ...n, status: 'accepted' as const, lastEmailId: emailId }
            : n
        )

        const replacementTarget = canReplaceExistingSponsor
          ? (currentFinances.sponsors || []).find((s) => s.id === selectedReplacementSponsor!.id)
          : null
        const updatedSponsors = replacementTarget
          ? (currentFinances.sponsors || []).map((s) =>
              s.id === replacementTarget.id
                ? { ...s, active: false, satisfaction: Math.max(0, (s.satisfaction || 70) - 40) }
                : s
            )
          : (currentFinances.sponsors || [])

        const updatedCash = replacementTarget
          ? (currentTeam.budgets?.cash || 0) - replacementTotalPenalty
          : (currentTeam.budgets?.cash || 0)
        const replacementTx = replacementTarget
          ? createTeamTransaction(
              'expense',
              'other',
              replacementTotalPenalty,
              `Sponsor buyout: replaced ${replacementTarget.sponsorName} (${SLOT_LABELS[replacementTarget.slot]}) with ${negotiation.sponsorName}`,
              currentWeek,
              currentYear,
              { sponsorId: replacementTarget.id }
            )
          : null
        
        return {
          ...state,
          ...(state.player ? {
            player: {
              ...state.player,
              reputation: replacementTarget
                ? Math.max(0, (currentTeam.reputation ?? 50) - replacementRepPenalty)
                : currentTeam.reputation
            }
          } : {}),
          careerState: {
            ...state.careerState,
            ownedTeam: {
              ...currentTeam,
              reputation: replacementTarget
                ? Math.max(0, (currentTeam.reputation ?? 50) - replacementRepPenalty)
                : currentTeam.reputation,
              boardMood: replacementTarget
                ? Math.max(0, (currentTeam.boardMood ?? 50) - replacementBoardPenalty)
                : currentTeam.boardMood,
              budgets: {
                ...currentTeam.budgets,
                cash: updatedCash,
                yearToDateExpenses: (currentTeam.budgets?.yearToDateExpenses || 0) + (replacementTarget ? replacementTotalPenalty : 0)
              },
              finances: {
                ...currentFinances,
                sponsors: [...updatedSponsors, newDeal],
                activeNegotiations: updatedNegotiations,
                transactions: replacementTx
                  ? [...(currentFinances.transactions || []), replacementTx]
                  : (currentFinances.transactions || [])
              }
            }
          }
        }
      })
      
      // === TIME BUDGET + CALENDAR INTEGRATION ===
      const negotiateTimeCost = getActivityTimeCost('sponsor_negotiation')
      if (negotiateTimeCost.hours > 0) {
        consumeHoursFromBudget(negotiateTimeCost.hours, negotiateTimeCost.drain, `Sponsor Deal: ${negotiation.sponsorName}`, 'sponsor_negotiation')
      }
      addPersonalCalendarEntry({
        name: `Sponsor Deal Signed: ${negotiation.sponsorName}`,
        description: `Finalized sponsorship deal with ${negotiation.sponsorName} as ${SLOT_LABELS[negotiation.currentOffer.slot].toLowerCase()}`,
        activityId: 'sponsor_negotiation',
        week: currentWeek,
        day: careerState?.currentDay ?? 1,
        duration: negotiateTimeCost.hours,
        drainLevel: negotiateTimeCost.drain,
        calendarEntryType: 'team',
        category: 'sponsor',
        immediate: true
      })

      addToast({
        type: canReplaceExistingSponsor ? 'warning' : 'success',
        title: canReplaceExistingSponsor ? 'Deal Signed (Buyout Applied)' : 'Deal Signed!',
        message: canReplaceExistingSponsor
          ? `${negotiation.sponsorName} replaced your ${SLOT_LABELS[negotiation.currentOffer.slot].toLowerCase()}. Buyout/restructure cost: $${replacementTotalPenalty.toLocaleString()}.`
          : `${negotiation.sponsorName} is now a ${SLOT_LABELS[negotiation.currentOffer.slot].toLowerCase()} for ${team.name}!`,
        duration: 5000
      })
      
      onClose()
    } catch (error) {
      console.error('[NegotiationModal] Error accepting deal:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to finalize the deal. Please try again.',
        duration: 4000
      })
    }
    
    setIsProcessing(false)
  }
  
  // Handle counter offer
  const handleCounter = async () => {
    if (!canTakeAction || isProcessing || !counterValidation.acceptable) return
    setIsProcessing(true)
    
    try {
      const counterOfferFull: SponsorOffer = {
        ...negotiation.currentOffer,
        ...counterOffer
      }
      
      // Generate team's counter email
      const emailContext = buildEmailContext(negotiation, team, currentWeek, currentYear)
      let teamEmailContent = isNegotiationAIAvailable()
        ? await generateTeamCounterEmail(
            {
              ...emailContext,
              offer: counterOfferFull,
              initiatedBy: negotiation.initiatedBy,
              roundNumber: negotiation.rounds.length + 1
            },
            negotiation.currentOffer
          )
        : null
      
      if (!teamEmailContent) {
        teamEmailContent = generateFallbackEmail('outreach', emailContext)
      }
      
      // Add team's counter email to sent
      const teamEmailId = `counter_team_${negotiation.id}_${Date.now()}`
      addEmail({
        category: 'sponsor',
        subject: `RE: ${negotiation.sponsorName} Partnership`,
        sender: 'Commercial Director',
        senderRole: `Commercial Director, ${team.name}`,
        preview: teamEmailContent.preview,
        body: teamEmailContent.body,
        receivedDay: new Date().getDay() || 7,
        receivedWeek: currentWeek,
        receivedYear: currentYear,
        read: true,  // Sent email - marked as read
        starred: false,
        archived: false,
        actionType: 'acknowledge',
        actionData: { type: 'outreach_sent' }  // Mark as sent email
      } as Omit<Email, 'id'>)
      
      // Update negotiation state - move to counter_pending
      useCareerStore.setState(state => {
        if (!state.careerState?.ownedTeam?.finances) return state
        
        const newRound: NegotiationRound = {
          roundNumber: negotiation.rounds.length + 1,
          proposedBy: 'team',
          offer: counterOfferFull,
          emailId: teamEmailId
        }
        
        const updatedNegotiations = state.careerState.ownedTeam.finances.activeNegotiations.map(n =>
          n.id === negotiation.id
            ? {
                ...n,
                status: 'counter_pending' as const,
                rounds: [...n.rounds, newRound],
                lastActivityWeek: currentWeek,
                lastActivityYear: currentYear,
                lastEmailId: teamEmailId,
                // Sponsor response time varies by tier/personality
                nextResponseWeek: currentWeek + getResponseDelay(
                  { tier: negotiation.sponsorTier, personality: negotiation.personality },
                  'counter'
                )
              }
            : n
        )
        
        return {
          ...state,
          careerState: {
            ...state.careerState,
            ownedTeam: {
              ...state.careerState.ownedTeam,
              finances: {
                ...state.careerState.ownedTeam.finances,
                activeNegotiations: updatedNegotiations
              }
            }
          }
        }
      })
      
      // === TIME BUDGET + CALENDAR INTEGRATION ===
      const counterTimeCost = getActivityTimeCost('sponsor_negotiation')
      if (counterTimeCost.hours > 0) {
        consumeHoursFromBudget(Math.ceil(counterTimeCost.hours / 2), counterTimeCost.drain, `Counter Offer: ${negotiation.sponsorName}`, 'sponsor_negotiation')
      }
      addPersonalCalendarEntry({
        name: `Counter Offer: ${negotiation.sponsorName}`,
        description: `Sent counter proposal to ${negotiation.sponsorName} (Round ${negotiation.rounds.length + 1})`,
        activityId: 'sponsor_negotiation',
        week: currentWeek,
        day: careerState?.currentDay ?? 1,
        duration: Math.ceil(counterTimeCost.hours / 2),
        drainLevel: counterTimeCost.drain,
        calendarEntryType: 'team',
        category: 'sponsor',
        immediate: true
      })

      addToast({
        type: 'info',
        title: 'Counter Sent',
        message: `Your counter proposal has been sent to ${negotiation.sponsorName}. Check back in a few days.`,
        duration: 4000
      })
      
      setCounterMode(false)
      onClose()
    } catch (error) {
      console.error('[NegotiationModal] Error sending counter:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send counter offer. Please try again.',
        duration: 4000
      })
    }
    
    setIsProcessing(false)
  }
  
  // Handle decline with gameplay effects
  const handleDecline = () => {
    if (!canTakeAction || isProcessing) return
    
    const reputationPenalty = getSponsorDeclinePenalty(negotiation.sponsorTier as any)
    const cooldownExpiryWeek = ((currentYear - 1) * 52) + currentWeek + DECLINE_COOLDOWN_WEEKS
    
    // Update negotiation status + apply gameplay effects
    useCareerStore.setState(state => {
      if (!state.careerState?.ownedTeam?.finances) return state
      
      const updatedNegotiations = state.careerState.ownedTeam.finances.activeNegotiations.map(n =>
        n.id === negotiation.id
          ? { ...n, status: 'declined' as const }
          : n
      )
      
      // Apply reputation penalty
      const currentReputation = state.careerState.ownedTeam?.reputation ?? 50
      const newReputation = Math.max(0, currentReputation - reputationPenalty)
      
      // Add to declined cooldowns
      const existingCooldowns = state.careerState.ownedTeam.finances.declinedSponsorCooldowns ?? {}
      const updatedCooldowns = {
        ...existingCooldowns,
        [negotiation.sponsorId]: cooldownExpiryWeek
      }
      
      return {
        ...state,
        ...(state.player ? {
          player: {
            ...state.player,
            reputation: newReputation
          }
        } : {}),
        careerState: {
          ...state.careerState,
          ownedTeam: {
            ...state.careerState.ownedTeam,
            reputation: newReputation,
            finances: {
              ...state.careerState.ownedTeam.finances,
              activeNegotiations: updatedNegotiations,
              declinedSponsorCooldowns: updatedCooldowns
            }
          }
        }
      }
    })
    
    const penaltyMsg = reputationPenalty > 0 ? ` Team reputation -${reputationPenalty}.` : ''
    addToast({
      type: 'info',
      title: 'Negotiation Ended',
      message: `You have declined the offer from ${negotiation.sponsorName}.${penaltyMsg}`,
      duration: 4000
    })
    
    onClose()
  }
  
  // Adjust counter offer
  const adjustValue = (field: keyof OfferAdjustment, direction: 'up' | 'down') => {
    const increments = {
      monthlyPayment: 1000,
      winBonus: 500,
      podiumBonus: 250,
      championshipBonus: 5000,
      duration: 1
    }
    
    const currentValue = counterOffer[field]
    const increment = increments[field] * (direction === 'up' ? 1 : -1)
    const newValue = Math.max(0, currentValue + increment)
    
    // Duration limits
    if (field === 'duration') {
      setCounterOffer(prev => ({
        ...prev,
        duration: Math.max(1, Math.min(5, newValue))
      }))
    } else {
      setCounterOffer(prev => ({
        ...prev,
        [field]: newValue
      }))
    }
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sponsor Negotiation"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
          <SponsorLogo
            src={getSponsorLogoPath(negotiation.sponsorId) || getSponsorLogo(negotiation.sponsorId)}
            name={negotiation.sponsorName}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-xl">{negotiation.sponsorName}</h3>
              <Badge 
                variant={negotiation.status === 'reviewing_offer' ? 'green' : 
                         negotiation.status === 'counter_pending' ? 'orange' : 'default'}
              >
                {negotiation.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">
              {PERSONALITY_DESCRIPTIONS[negotiation.personality]} | Patience: {negotiation.patience}/5
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Round</p>
            <p className="font-mono font-bold text-lg">
              {negotiation.rounds.length + 1}/{negotiation.maxRounds}
            </p>
          </div>
        </div>

        {/* Waiting for sponsor response (after you clicked Approach) */}
        {(negotiation.status === 'outreach_sent' || negotiation.status === 'pending_response') && (() => {
          // Calculate expected response week from absolute nextResponseWeek
          const absResponseWeek = negotiation.nextResponseWeek
          const responseWeek = absResponseWeek ? ((absResponseWeek - 1) % 52) + 1 : null
          const responseYear = absResponseWeek ? Math.floor((absResponseWeek - 1) / 52) + 1 : null
          
          const steps = [
            { label: 'Outreach Sent', done: true },
            { label: 'Awaiting Response', done: false, active: true },
            { label: 'Offer Received', done: false }
          ]
          
          return (
            <Card variant="glass" padding="lg" className="space-y-5">
              {/* Progress Timeline */}
              <div className="flex items-center justify-center gap-0">
                {steps.map((step, idx) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done 
                          ? 'bg-status-success text-white' 
                          : step.active 
                            ? 'bg-accent-blue/20 border-2 border-accent-blue text-accent-blue' 
                            : 'bg-surface border border-border text-text-muted'
                      }`}>
                        {step.done ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs mt-1 whitespace-nowrap ${
                        step.done ? 'text-status-success' : step.active ? 'text-accent-blue' : 'text-text-muted'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-1 mt-[-16px] ${step.done ? 'bg-status-success' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Sponsor Summary */}
              <div className="p-3 bg-background rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tier</span>
                  <Badge variant="default" size="sm">{negotiation.sponsorTier}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Category</span>
                  <span>{categoryInfo.icon} {categoryInfo.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Style</span>
                  <span>{PERSONALITY_DESCRIPTIONS[negotiation.personality]}</span>
                </div>
                {responseWeek && (
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Expected response
                    </span>
                    <span className="font-mono text-accent-blue">
                      Week {responseWeek}{responseYear && responseYear !== currentYear ? `, ${responseYear}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-text-muted text-center max-w-md mx-auto">
                You&apos;ll receive an <strong>email</strong> when {negotiation.sponsorName} responds.
                Advance the week and check your inbox.
              </p>
              
              <div className="flex justify-center">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </Card>
          )
        })()}

        {/* Contract and actions — only when sponsor has responded with an offer */}
        {(negotiation.status === 'reviewing_offer' || negotiation.status === 'counter_pending') && (
        <>
        {/* Progress from Initial */}
        {negotiation.rounds.length > 0 && (
          <div className="p-3 bg-surface rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Progress from initial offer</span>
              <span className={progressFromInitial >= 0 ? 'text-status-success' : 'text-status-danger'}>
                {progressFromInitial >= 0 ? '+' : ''}{progressFromInitial.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${progressFromInitial >= 0 ? 'bg-status-success' : 'bg-status-danger'}`}
                style={{ 
                  width: `${Math.min(100, Math.abs(progressFromInitial) + 50)}%`,
                  marginLeft: progressFromInitial < 0 ? `${50 - Math.abs(progressFromInitial)}%` : '50%'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Current Offer */}
        <div className="p-4 bg-surface rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent-gold" />
              {counterMode ? 'Your Counter Proposal' : 'Current Offer'}
            </h4>
            <Badge variant="blue">{SLOT_LABELS[negotiation.currentOffer.slot]}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <OfferField
              icon={<DollarSign className="w-4 h-4" />}
              label="Monthly Payment"
              value={counterMode ? counterOffer.monthlyPayment : negotiation.currentOffer.monthlyPayment}
              format="currency"
              editable={counterMode}
              onIncrease={() => adjustValue('monthlyPayment', 'up')}
              onDecrease={() => adjustValue('monthlyPayment', 'down')}
            />
            <OfferField
              icon={<Trophy className="w-4 h-4" />}
              label="Win Bonus"
              value={counterMode ? counterOffer.winBonus : negotiation.currentOffer.winBonus}
              format="currency"
              editable={counterMode}
              onIncrease={() => adjustValue('winBonus', 'up')}
              onDecrease={() => adjustValue('winBonus', 'down')}
            />
            <OfferField
              icon={<Medal className="w-4 h-4" />}
              label="Podium Bonus"
              value={counterMode ? counterOffer.podiumBonus : negotiation.currentOffer.podiumBonus}
              format="currency"
              editable={counterMode}
              onIncrease={() => adjustValue('podiumBonus', 'up')}
              onDecrease={() => adjustValue('podiumBonus', 'down')}
            />
            <OfferField
              icon={<Crown className="w-4 h-4" />}
              label="Championship Bonus"
              value={counterMode ? counterOffer.championshipBonus : negotiation.currentOffer.championshipBonus}
              format="currency"
              editable={counterMode}
              onIncrease={() => adjustValue('championshipBonus', 'up')}
              onDecrease={() => adjustValue('championshipBonus', 'down')}
            />
            <OfferField
              icon={<Clock className="w-4 h-4" />}
              label="Duration"
              value={counterMode ? counterOffer.duration : negotiation.currentOffer.duration}
              format="years"
              editable={counterMode}
              onIncrease={() => adjustValue('duration', 'up')}
              onDecrease={() => adjustValue('duration', 'down')}
            />
            <div className="p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-accent-gold" />
                <span className="text-xs text-text-muted">Est. Annual Value</span>
              </div>
              <p className="font-mono font-bold text-lg text-status-success">
                ${(counterMode ? counterTotalValue : currentTotalValue).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Counter mode value change indicator */}
          {counterMode && Math.abs(valueChange) > 0.1 && (
            <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${
              valueChange > 0 ? 'bg-status-success/10' : 'bg-status-danger/10'
            }`}>
              {valueChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-status-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-status-danger" />
              )}
              <span className={`text-sm ${valueChange > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                {valueChange > 0 ? '+' : ''}{valueChange.toFixed(1)}% from current offer
              </span>
            </div>
          )}
          
          {/* Counter validation warning */}
          {counterMode && !counterValidation.acceptable && (
            <div className="mt-3 p-2 bg-status-warning/10 border border-status-warning/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm text-status-warning">{counterValidation.reason}</span>
            </div>
          )}
        </div>
        
        {/* Performance Targets */}
        <div className="p-4 bg-surface rounded-xl">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-status-info" />
            Performance Targets
          </h4>
          <div className="space-y-2">
            {negotiation.currentOffer.targets.map((target, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-lg text-sm">
                <div className="w-2 h-2 rounded-full bg-status-info" />
                <span>{target.description}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sponsor Expectations - REVEALED DURING NEGOTIATIONS */}
        <div className="p-4 bg-surface rounded-xl border border-accent-gold/20">
          <h4 className="font-medium flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            What {negotiation.sponsorName} Values
          </h4>
          
          {/* Priority Focus */}
          <div className="mb-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue" className="flex items-center gap-1">
                {getPriorityIcon(priority.primary)}
                Primary: {formatPriorityLabel(priority.primary)}
              </Badge>
              {priority.secondary && (
                <Badge variant="default" className="flex items-center gap-1">
                  {getPriorityIcon(priority.secondary)}
                  Secondary: {formatPriorityLabel(priority.secondary)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Expectations Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Media Requirements */}
            <div className="p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium">Media Exposure</span>
              </div>
              <div className="space-y-1">
                <ExpectationBar 
                  label="Social Posts" 
                  value={expectations?.requiredShoutouts ?? 4} 
                  max={12}
                  suffix="/season"
                />
                <ExpectationBar 
                  label="Interviews" 
                  value={expectations?.requiredInterviews ?? 0} 
                  max={6}
                  suffix="/season"
                />
                {expectations?.viralPostBonus && (
                  <div className="flex items-center gap-1 text-xs text-status-success">
                    <Check className="w-3 h-3" />
                    <span>Viral content bonuses</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Event Requirements */}
            <div className="p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium">Event Commitments</span>
              </div>
              <div className="space-y-1">
                <ExpectationBar 
                  label="Sponsor Events" 
                  value={expectations?.requiredEvents ?? 2} 
                  max={10}
                  suffix="/year"
                />
                <ExpectationBar 
                  label="Exclusive Appearances" 
                  value={expectations?.exclusiveAppearances ?? 0} 
                  max={5}
                  suffix="/year"
                />
                {(expectations?.productLaunches ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-status-success">
                    <Check className="w-3 h-3" />
                    <span>{expectations.productLaunches ?? 0} product launch appearance{(expectations.productLaunches ?? 0) > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Performance Expectations */}
            <div className="p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LineChart className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium">Performance Expectations</span>
              </div>
              <div className="space-y-1">
                {expectations?.championshipTarget && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Championship Target</span>
                    <span className="font-mono">{formatChampTarget(expectations.championshipTarget)}</span>
                  </div>
                )}
                {(expectations?.minSeasonWins ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Win Target</span>
                    <span className="font-mono">{expectations.minSeasonWins}+ wins</span>
                  </div>
                )}
                {(expectations?.minSeasonPodiums ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Podium Target</span>
                    <span className="font-mono">{expectations.minSeasonPodiums}+ podiums</span>
                  </div>
                )}
                {(expectations?.maxDNFs ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Max DNFs Allowed</span>
                    <span className="font-mono">{expectations.maxDNFs}</span>
                  </div>
                )}
                {!expectations?.championshipTarget && !expectations?.minSeasonWins && !expectations?.minSeasonPodiums && (
                  <span className="text-text-muted text-xs">No specific targets</span>
                )}
              </div>
            </div>
            
            {/* Special Clauses */}
            <div className="p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium">Special Requirements</span>
              </div>
              <div className="space-y-1 text-xs">
                {expectations?.noControversyClause && (
                  <div className="flex items-center gap-1 text-status-warning">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Professional image clause</span>
                  </div>
                )}
                {expectations?.exclusiveCategoryClause && (
                  <div className="flex items-center gap-1 text-status-warning">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Category exclusivity required</span>
                  </div>
                )}
                {expectations?.rivalExclusivity && expectations.rivalExclusivity.length > 0 && (
                  <div className="flex items-center gap-1 text-status-info">
                    <Star className="w-3 h-3" />
                    <span>Rival exclusivity clause</span>
                  </div>
                )}
                {expectations?.preferredImageStyle && (
                  <div className="flex items-center gap-1 text-text-muted">
                    <span>Image: {expectations.preferredImageStyle}</span>
                  </div>
                )}
                {!expectations?.noControversyClause && 
                 !expectations?.exclusiveCategoryClause && 
                 !expectations?.rivalExclusivity?.length && (
                  <span className="text-text-muted">No special clauses</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Negotiation Tip */}
          <div className="mt-4 p-2 bg-accent-gold/10 rounded-lg flex items-start gap-2">
            <Megaphone className="w-4 h-4 text-accent-gold mt-0.5" />
            <p className="text-xs text-text-secondary">
              <span className="font-medium text-accent-gold">Negotiation tip:</span>{' '}
              {priority.primary === 'media' && 'This sponsor values media exposure highly. Highlighting your social reach and marketing efforts can help secure better terms.'}
              {priority.primary === 'events' && 'This sponsor wants event presence. Consider offering additional hospitality appearances to strengthen your position.'}
              {priority.primary === 'performance' && 'Results matter most to this sponsor. A strong track record or ambitious targets can improve negotiations.'}
              {priority.primary === 'prestige' && 'Brand prestige is paramount. Emphasize your team\'s reputation and championship aspirations.'}
              {priority.primary === 'exposure' && 'Maximum visibility is the goal. TV time and race coverage are key negotiating points.'}
              {priority.primary === 'technology' && 'Technical excellence matters. Showcase any innovations or engineering achievements.'}
            </p>
          </div>
        </div>
        
        {/* Negotiation History */}
        {negotiation.rounds.length > 0 && (
          <div className="p-4 bg-surface rounded-xl">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-medium flex items-center gap-2">
                <History className="w-5 h-5 text-text-muted" />
                Negotiation History ({negotiation.rounds.length} rounds)
              </h4>
              {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2"
              >
                {negotiation.rounds.map((round, idx) => (
                  <div key={idx} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={round.proposedBy === 'team' ? 'blue' : 'purple'} size="sm">
                        Round {round.roundNumber} - {round.proposedBy === 'team' ? 'Your Offer' : 'Their Offer'}
                      </Badge>
                      {round.response && (
                        <Badge 
                          variant={round.response === 'accept' ? 'green' : 
                                   round.response === 'counter' ? 'orange' : 'red'}
                          size="sm"
                        >
                          {round.response}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">
                      ${round.offer.monthlyPayment.toLocaleString()}/mo + 
                      ${round.offer.winBonus.toLocaleString()} win + 
                      ${round.offer.podiumBonus.toLocaleString()} podium
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
        
        {/* Accept Confirmation Panel */}
        {showAcceptConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-status-success/5 border border-status-success/30 rounded-xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <h4 className="font-medium">Confirm Deal with {negotiation.sponsorName}?</h4>
                <p className="text-xs text-text-muted">Review the terms before signing</p>
              </div>
            </div>
            
            <div className="p-3 bg-background rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Slot</span>
                <span className="font-medium">{SLOT_LABELS[negotiation.currentOffer.slot]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Monthly Payment</span>
                <span className="font-mono text-status-success">${negotiation.currentOffer.monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Win Bonus</span>
                <span className="font-mono">${negotiation.currentOffer.winBonus.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Podium Bonus</span>
                <span className="font-mono">${negotiation.currentOffer.podiumBonus.toLocaleString()}</span>
              </div>
              {(negotiation.currentOffer.championshipBonus ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Championship Bonus</span>
                  <span className="font-mono">${(negotiation.currentOffer.championshipBonus ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Duration</span>
                <span className="font-mono">{negotiation.currentOffer.duration} year{negotiation.currentOffer.duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm">
                <span className="text-text-muted font-medium">Est. Annual Value</span>
                <span className="font-mono font-bold text-status-success">${currentTotalValue.toLocaleString()}</span>
              </div>
              {canReplaceExistingSponsor && selectedReplacementSponsor && (
                <div className="pt-2 border-t border-status-danger/30 space-y-1.5">
                  <p className="text-xs font-semibold text-status-danger">Replacing an active {SLOT_LABELS[negotiation.currentOffer.slot].toLowerCase()} triggers contract buyout penalties</p>
                  {activeSponsorsInOfferSlot.length > 1 ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-muted whitespace-nowrap">Replace sponsor</span>
                      <select
                        className="bg-surface border border-surface-border rounded px-2 py-1 text-xs flex-1"
                        value={selectedReplacementSponsor?.id || ''}
                        onChange={(e) => setSelectedReplacementSponsorId(e.target.value)}
                      >
                        {activeSponsorsInOfferSlot.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sponsorName} (${s.monthlyPayment.toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Replacing sponsor</span>
                      <span className="font-medium">{selectedReplacementSponsor.sponsorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Buyout + restructuring fee</span>
                    <span className="font-mono text-status-danger">${replacementTotalPenalty.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Reputation / Board</span>
                    <span className="font-mono text-status-danger">-{replacementRepPenalty} / -{replacementBoardPenalty}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => { setShowAcceptConfirm(false); handleAccept() }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Handshake className="w-4 h-4 mr-2" />
                )}
                {canReplaceExistingSponsor ? 'Buy out & Replace' : 'Confirm Deal'}
              </Button>
              <Button variant="ghost" onClick={() => setShowAcceptConfirm(false)} disabled={isProcessing}>
                Go Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* Decline Confirmation Panel */}
        {showDeclineConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-status-danger/5 border border-status-danger/30 rounded-xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-status-danger/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-status-danger" />
              </div>
              <div>
                <h4 className="font-medium">Decline offer from {negotiation.sponsorName}?</h4>
                <p className="text-xs text-text-muted">This will have consequences for your team</p>
              </div>
            </div>
            
            <div className="p-3 bg-background rounded-lg space-y-3">
              {/* Reputation impact */}
              {(() => {
                const repPenalty = getSponsorDeclinePenalty(negotiation.sponsorTier as any)
                return repPenalty > 0 ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-status-danger" />
                    <span className="text-text-muted">Reputation impact:</span>
                    <span className="font-mono text-status-danger">-{repPenalty}</span>
                  </div>
                ) : null
              })()}
              
              {/* Cooldown */}
              <div className="flex items-center gap-2 text-sm">
                <Ban className="w-4 h-4 text-status-warning" />
                <span className="text-text-muted">
                  {negotiation.sponsorName} won&apos;t consider approaches for {DECLINE_COOLDOWN_WEEKS} weeks
                </span>
              </div>
              
              {/* Missed income */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-status-warning" />
                <span className="text-text-muted">Missed income:</span>
                <span className="font-mono text-status-warning">${negotiation.currentOffer.monthlyPayment.toLocaleString()}/mo</span>
              </div>
              
              {/* Slot */}
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-text-muted" />
                <span className="text-text-muted">
                  {activeSlotSponsorNames.length > 0
                    ? `${SLOT_LABELS[negotiation.currentOffer.slot]} slot stays with ${activeSlotSponsorNames.join(', ')}`
                    : `${SLOT_LABELS[negotiation.currentOffer.slot]} slot remains vacant`}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 !text-status-danger !border-status-danger/30 hover:!bg-status-danger/10"
                onClick={() => { setShowDeclineConfirm(false); handleDecline() }}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Confirm Decline
              </Button>
              <Button variant="secondary" onClick={() => setShowDeclineConfirm(false)} disabled={isProcessing}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {!showAcceptConfirm && !showDeclineConfirm && (
        <div className="flex gap-3 pt-4 border-t border-surface-border">
          {!counterMode ? (
            <>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  if (activeSponsorsInOfferSlot.length > 0 && !selectedReplacementSponsorId) {
                    setSelectedReplacementSponsorId(activeSponsorsInOfferSlot[0].id)
                  }
                  setShowAcceptConfirm(true)
                }}
                disabled={!canTakeAction || isProcessing}
              >
                {isProcessing ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Accept Deal
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setCounterOffer({
                    monthlyPayment: negotiation.currentOffer.monthlyPayment,
                    winBonus: negotiation.currentOffer.winBonus,
                    podiumBonus: negotiation.currentOffer.podiumBonus,
                    championshipBonus: negotiation.currentOffer.championshipBonus,
                    duration: negotiation.currentOffer.duration
                  })
                  setCounterMode(true)
                }}
                disabled={!canTakeAction || isProcessing || negotiation.rounds.length >= negotiation.maxRounds - 1}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Counter Offer
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeclineConfirm(true)}
                disabled={!canTakeAction || isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCounter}
                disabled={!counterValidation.acceptable || isProcessing}
              >
                {isProcessing ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Counter
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCounterMode(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
        )}
        
        {/* Warning for near max rounds */}
        {negotiation.rounds.length >= negotiation.maxRounds - 1 && canTakeAction && (
          <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-warning" />
            <span className="text-sm text-status-warning">
              This is likely your final chance to negotiate. The sponsor may walk away if you counter again.
            </span>
          </div>
        )}
        </>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface OfferFieldProps {
  icon: React.ReactNode
  label: string
  value: number
  format: 'currency' | 'years'
  editable?: boolean
  onIncrease?: () => void
  onDecrease?: () => void
}

function OfferField({ icon, label, value, format, editable, onIncrease, onDecrease }: OfferFieldProps) {
  const formattedValue = format === 'currency' 
    ? `$${value.toLocaleString()}`
    : `${value} year${value !== 1 ? 's' : ''}`
  
  return (
    <div className="p-3 bg-background rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-text-muted">{icon}</span>
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-mono font-bold text-lg">{formattedValue}</p>
        {editable && (
          <div className="flex gap-1">
            <button
              onClick={onDecrease}
              className="w-6 h-6 rounded bg-surface hover:bg-surface-highlight flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onIncrease}
              className="w-6 h-6 rounded bg-surface hover:bg-surface-highlight flex items-center justify-center transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// PRIORITY HELPERS
// ============================================

function getPriorityIcon(priority: string): React.ReactNode {
  const iconClass = "w-3 h-3 mr-1"
  switch (priority) {
    case 'media': return <Camera className={iconClass} />
    case 'events': return <Calendar className={iconClass} />
    case 'performance': return <LineChart className={iconClass} />
    case 'prestige': return <Crown className={iconClass} />
    case 'exposure': return <Megaphone className={iconClass} />
    case 'technology': return <Zap className={iconClass} />
    default: return <Star className={iconClass} />
  }
}

function formatPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    media: 'Media & Social',
    events: 'Events & Hospitality',
    performance: 'On-Track Results',
    prestige: 'Brand Prestige',
    exposure: 'TV Exposure',
    technology: 'Technical Innovation'
  }
  return labels[priority] || priority
}

function formatChampTarget(target: string): string {
  const labels: Record<string, string> = {
    win: 'Championship',
    top3: 'Top 3',
    top5: 'Top 5',
    top10: 'Top 10',
    points: 'Points Finish'
  }
  return labels[target] || target
}

// ============================================
// EXPECTATION BAR COMPONENT
// ============================================

interface ExpectationBarProps {
  label: string
  value: number
  max: number
  suffix?: string
}

function ExpectationBar({ label, value, max, suffix = '' }: ExpectationBarProps) {
  const percentage = Math.min(100, (value / max) * 100)
  
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono">{value}{suffix}</span>
      </div>
      <div className="h-1.5 bg-background-darker rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            percentage > 75 ? 'bg-status-warning' : 
            percentage > 50 ? 'bg-status-info' : 
            'bg-status-success'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default NegotiationModal
