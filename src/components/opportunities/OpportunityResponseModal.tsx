/**
 * Opportunity Response Modal
 * 
 * Displays opportunity details and allows the player to accept or decline.
 * For accepted opportunities, allows scheduling on the calendar.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, TrendingUp, PiggyBank, Receipt, Briefcase, Building2, 
  ArrowUpRight, ArrowDownRight, Check, X, Clock, Trophy, Award, 
  Star, Sparkles, RefreshCw, AlertCircle, Lock, Unlock, Filter,
  ChevronDown, Search, Globe, Wrench, Zap, Target, AlertTriangle,
  Megaphone, ShieldAlert, Mic, TrendingUp as ViralIcon, Users, History,
  Heart, MessageSquare, Share2, Ban
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Modal, useToast, Input, SatisfactionMeter } from '@/components/ui'
import { useCareerStore, SponsorDeal } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import {
  calculateLivingExpenses,
  getAllSponsorsWithEligibility,
  SponsorEligibility,
  getSponsorPersonality
} from '@/simulation/finances';

interface OpportunityResponseModalProps {
  opportunity: any
  isOpen: boolean
  onClose: () => void
  currentWeek: number
  currentYear: number
  scheduledActivities: any[]
}

export default function OpportunityResponseModal({
  opportunity,
  isOpen,
  onClose,
  currentWeek,
  currentYear,
  scheduledActivities
}: OpportunityResponseModalProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  
  const { acceptOpportunity, declineOpportunity } = useCareerStore()
  
  // Generate available weeks for scheduling
  const availableWeeks = useMemo(() => {
    const weeks: number[] = []
    for (let i = 0; i < 52; i++) {
      const week = currentWeek + i
      if (week <= 52) {
        weeks.push(week)
      }
    }
    return weeks
  }, [currentWeek])
  
  // Check for scheduling conflicts
  const getWeekConflicts = (week: number) => {
    return scheduledActivities.filter(
      a => a.scheduledWeek === week && a.status === 'scheduled'
    )
  }
  
  // Calculate rewards summary
  const rewardsSummary = useMemo(() => {
    const rewards = opportunity.rewards
    const items: { icon: typeof DollarSign; label: string; value: string; color: string }[] = []
    
    if (rewards.cash) {
      items.push({
        icon: DollarSign,
        label: 'Payment',
        value: `$${rewards.cash.toLocaleString()}`,
        color: 'text-status-success'
      })
    }
    if (rewards.reputation) {
      items.push({
        icon: TrendingUp,
        label: 'Reputation',
        value: `+${rewards.reputation}`,
        color: 'text-accent-orange'
      })
    }
    if (rewards.fanSentiment) {
      items.push({
        icon: Heart,
        label: 'Fan Sentiment',
        value: `+${rewards.fanSentiment}`,
        color: 'text-status-info'
      })
    }
    if (rewards.manufacturerFavor) {
      items.push({
        icon: Factory,
        label: 'Manufacturer Relations',
        value: `+${rewards.manufacturerFavor}`,
        color: 'text-accent-purple'
      })
    }
    if (rewards.sponsorSatisfaction) {
      items.push({
        icon: Building2,
        label: 'Sponsor Satisfaction',
        value: `+${rewards.sponsorSatisfaction}%`,
        color: 'text-accent-gold'
      })
    }
    if (rewards.mediaExposure) {
      items.push({
        icon: Sparkles,
        label: 'Media Exposure',
        value: `+${rewards.mediaExposure}`,
        color: 'text-accent-blue'
      })
    }
    
    return items
  }, [opportunity.rewards])
  
  // Calculate consequences summary
  const consequencesSummary = useMemo(() => {
    const cons = opportunity.consequences
    const items: { icon: typeof TrendingDown; label: string; value: string; color: string }[] = []
    
    if (cons.reputationLoss) {
      items.push({
        icon: TrendingDown,
        label: 'Reputation',
        value: `-${cons.reputationLoss}`,
        color: 'text-status-error'
      })
    }
    if (cons.fanSentimentLoss) {
      items.push({
        icon: Heart,
        label: 'Fan Sentiment',
        value: `-${cons.fanSentimentLoss}`,
        color: 'text-status-error'
      })
    }
    if (cons.relationshipLoss) {
      items.push({
        icon: AlertTriangle,
        label: `${cons.relationshipLoss.type} Relations`,
        value: `-${cons.relationshipLoss.amount}`,
        color: 'text-status-warning'
      })
    }
    
    return items
  }, [opportunity.consequences])
  
  // Handle accept
  const handleAccept = () => {
    if (!selectedWeek) return
    
    acceptOpportunity(opportunity.instanceId, selectedWeek, selectedDay)
    onClose()
  }
  
  // Handle decline
  const handleDecline = () => {
    declineOpportunity(opportunity.instanceId)
    onClose()
  }
  
  // Days until expiry
  const daysUntilExpiry = useMemo(() => {
    const expiresInWeeks = opportunity.expiresWeek - currentWeek
    if (opportunity.expiresYear > currentYear) {
      return expiresInWeeks + 52
    }
    return Math.max(0, expiresInWeeks * 7)
  }, [opportunity, currentWeek, currentYear])
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAccepting ? 'Schedule Opportunity' : 'Opportunity Received'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getCategoryColor(opportunity.category)}`}>
            {getCategoryIcon(opportunity.category)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" size="sm">
                {getCategoryLabel(opportunity.category)}
              </Badge>
              <Badge 
                variant={daysUntilExpiry <= 7 ? 'red' : 'default'} 
                size="sm"
              >
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilExpiry} days to respond
              </Badge>
            </div>
            <h3 className="font-display font-bold text-xl">{opportunity.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-text-muted text-sm">
              {getOrganizerIcon(opportunity.organizerType)}
              <span>{opportunity.organizerName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-accent-gold">
              <Star className="w-4 h-4" />
              <span className="font-bold">{opportunity.prestige}</span>
            </div>
            <span className="text-xs text-text-muted">Prestige</span>
          </div>
        </div>
        
        {/* Description / Email */}
        <Card variant="glass" padding="md">
          <p className="text-sm text-text-secondary whitespace-pre-line">
            {opportunity.emailBodyTemplate}
          </p>
        </Card>
        
        {/* Time Commitment */}
        <div className="flex items-center gap-4 p-3 bg-surface rounded-lg">
          <Clock className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-sm font-medium">Time Commitment</p>
            <p className="text-xs text-text-muted">
              {opportunity.duration} hours over {opportunity.durationDays} day{opportunity.durationDays > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Benefits Section */}
        {rewardsSummary.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-status-success mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Benefits if Accepted
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {rewardsSummary.map((reward, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 bg-surface rounded-lg"
                >
                  <reward.icon className={`w-4 h-4 ${reward.color}`} />
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">{reward.label}</span>
                    <p className={`font-bold text-sm ${reward.color}`}>{reward.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Consequences Section */}
        {consequencesSummary.length > 0 && !isAccepting && (
          <div>
            <h4 className="text-sm font-semibold text-status-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Consequences if Declined
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {consequencesSummary.map((consequence, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 bg-status-error/10 border border-status-error/20 rounded-lg"
                >
                  <consequence.icon className={`w-4 h-4 ${consequence.color}`} />
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">{consequence.label}</span>
                    <p className={`font-bold text-sm ${consequence.color}`}>{consequence.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Scheduling Section (when accepting) */}
        {isAccepting && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-blue" />
              Select Week & Day
            </h4>
            
            {/* Week Selection */}
            <div className="grid grid-cols-4 gap-2">
              {availableWeeks.map(week => {
                const conflicts = getWeekConflicts(week)
                const hasConflicts = conflicts.length > 0
                
                return (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${selectedWeek === week 
                        ? 'border-accent-blue bg-accent-blue/20' 
                        : 'border-surface-secondary hover:border-surface-tertiary'}
                      ${hasConflicts ? 'opacity-70' : ''}
                    `}
                  >
                    <p className="font-bold">Week {week}</p>
                    {hasConflicts && (
                      <p className="text-xs text-status-warning mt-1">
                        {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Day Selection */}
            {selectedWeek && (
              <div>
                <p className="text-sm text-text-muted mb-2">Select starting day:</p>
                <div className="grid grid-cols-7 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => {
                    const dayName = getDayName(day)
                    const hasConflict = scheduledActivities.some(
                      a => a.scheduledWeek === selectedWeek && 
                           a.scheduledDay === day && 
                           a.status === 'scheduled'
                    )
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        disabled={hasConflict}
                        className={`
                          p-2 rounded text-xs transition-all
                          ${selectedDay === day 
                            ? 'bg-accent-blue text-white' 
                            : hasConflict 
                              ? 'bg-status-error/20 text-status-error cursor-not-allowed' 
                              : 'bg-surface hover:bg-surface-secondary'}
                        `}
                      >
                        {dayName.substring(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-secondary">
          {!isAccepting ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setIsAccepting(true)}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAccepting(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAccept}
                disabled={!selectedWeek}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Confirm Schedule
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default OpportunityResponseModal
