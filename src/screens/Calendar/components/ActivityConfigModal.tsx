/**
 * ActivityConfigModal
 * Full activity configuration modal with venue, guests, catering, media, and budget
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  MapPin,
  Users,
  Utensils,
  Camera,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  Building2,
  Handshake,
  Newspaper,
  Star,
  Clock,
  Zap,
  Heart,
  Wrench,
  User,
  Lock,
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { 
  ActivityTemplate,
  ActivityConfiguration,
  ActivityGuests,
  MediaCoverageConfig,
  SponsorRepInvite,
  MediaInvite,
  VIPGuest,
  BudgetCategory,
  ACTIVITY_TEMPLATES,
  useCareerStore,
  getDayName
} from '@/store/careerStore'
import { 
  VENUES, 
  Venue, 
  getVenuesForActivity, 
  getAvailableVenues,
  getPrestigeDescription,
  calculateVenueCost
} from '@/data/venues'
import { 
  CATERING_OPTIONS, 
  CateringOption,
  getCateringForEventType,
  calculateCateringCost,
  getTierDisplayName
} from '@/data/catering'
import {
  calculateGuestLimits,
  getEstimatedAttendance,
  getGuestTypeEffectDescription,
  VIP_GUEST_EFFECTS,
  MEDIA_INVITE_EFFECTS,
  type VIPGuestType,
  type MediaInviteType,
  type GuestTypeLimit
} from '@/data/guest-effects-config'
import { getEffectiveVenueCapacity } from '@/data/venues'
import { DAY_PERIODS, DAY_PERIOD_ORDER, type DayPeriod } from '@/data/day-periods-config'
import { getActivityTimeCost } from '@/data/activity-time-costs'

interface ActivityConfigModalProps {
  isOpen: boolean
  week: number
  day: number
  activityTemplate?: ActivityTemplate
  onClose: () => void
  onSchedule: (templateId: string, week: number, day: number, config: ActivityConfiguration, period?: DayPeriod) => void
}

type ConfigStep = 'template' | 'venue' | 'guests' | 'catering' | 'media' | 'review'

export function ActivityConfigModal({
  isOpen,
  week,
  day,
  activityTemplate,
  onClose,
  onSchedule
}: ActivityConfigModalProps) {
  const { careerState, player, validateActivityRequirements } = useCareerStore()
  
  // Configuration state
  const [currentStep, setCurrentStep] = useState<ConfigStep>(activityTemplate ? 'venue' : 'template')
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(activityTemplate || null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedCatering, setSelectedCatering] = useState<CateringOption | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriod | null>(null)
  
  // Guest configuration
  const [sponsorReps, setSponsorReps] = useState<SponsorRepInvite[]>([])
  const [mediaInvites, setMediaInvites] = useState<MediaInvite[]>([])
  const [vipGuests, setVipGuests] = useState<VIPGuest[]>([])
  const [fanCount, setFanCount] = useState(0)
  const [fanTicketPrice, setFanTicketPrice] = useState(0)
  const [merchandiseAvailable, setMerchandiseAvailable] = useState(false)
  
  // Media coverage
  const [mediaCoverage, setMediaCoverage] = useState<MediaCoverageConfig>({
    pressRelease: false,
    photographerHired: false,
    videoTeamHired: false,
    livestream: false,
    exclusiveInterviews: false,
    socialMediaCoverage: true
  })
  
  // Custom name
  const [customName, setCustomName] = useState('')
  
  // Reset when template changes
  useEffect(() => {
    if (activityTemplate) {
      setSelectedTemplate(activityTemplate)
      setCurrentStep('venue')
      // Auto-select preferred period
      const timeCost = getActivityTimeCost(activityTemplate.id)
      if (timeCost.preferredPeriod) {
        setSelectedPeriod(timeCost.preferredPeriod)
      } else if (timeCost.allowedPeriods && timeCost.allowedPeriods.length === 1) {
        setSelectedPeriod(timeCost.allowedPeriods[0])
      } else {
        setSelectedPeriod(null)
      }
    }
  }, [activityTemplate])
  
  // Get available templates
  const availableTemplates = useMemo(() => {
    return ACTIVITY_TEMPLATES.filter(t => {
      if (!t.isConfigurable) return false
      const validation = validateActivityRequirements(t.id)
      return validation.valid
    })
  }, [validateActivityRequirements])
  
  // Get available venues for selected template - filtered by supportedVenueTypes
  const availableVenues = useMemo(() => {
    if (!selectedTemplate) return []
    const teamRep = player?.reputation || 50
    
    // Filter by template's supported venue types if specified
    if (selectedTemplate.supportedVenueTypes?.length) {
      return VENUES.filter(v => 
        selectedTemplate.supportedVenueTypes!.includes(v.type) &&
        (!v.requirements?.minTeamReputation || teamRep >= v.requirements.minTeamReputation)
      )
    }
    
    return getAvailableVenues(teamRep, selectedTemplate.category)
  }, [selectedTemplate, player?.reputation])
  
  // Get available catering
  const availableCatering = useMemo(() => {
    if (!selectedTemplate) return CATERING_OPTIONS
    const eventType = selectedTemplate.category === 'sponsor' ? 'sponsor' : 
                      selectedTemplate.category === 'media' ? 'media' :
                      selectedTemplate.category === 'team' ? 'team' :
                      selectedTemplate.category === 'development' ? 'team' :
                      selectedTemplate.category === 'personal' ? 'team' :
                      selectedTemplate.category === 'lifestyle' ? 'fan' :
                      'team'
    return getCateringForEventType(eventType)
  }, [selectedTemplate])
  
  // Marketing facility level
  const marketingLevel = careerState?.ownedTeam?.facilities?.marketing?.level ?? 1
  
  // Effective venue capacity (dynamic for team_hq based on marketing level)
  const effectiveVenueCapacity = useMemo(() => {
    if (!selectedVenue) return 50
    return getEffectiveVenueCapacity(selectedVenue, marketingLevel)
  }, [selectedVenue, marketingLevel])
  
  // Calculate total guests
  const totalGuests = useMemo(() => {
    const sponsorTotal = sponsorReps.reduce((sum, s) => sum + s.count, 0)
    const mediaTotal = mediaInvites.reduce((sum, m) => sum + m.count, 0)
    const vipTotal = vipGuests.reduce((sum, v) => sum + v.count, 0)
    return sponsorTotal + mediaTotal + vipTotal + fanCount
  }, [sponsorReps, mediaInvites, vipGuests, fanCount])
  
  // Dynamic guest limits based on player state, venue, and facility level
  const guestLimits = useMemo(() => {
    if (!selectedVenue) return null
    return calculateGuestLimits({
      playerState: {
        reputation: player?.reputation ?? 50,
        boardMood: careerState?.ownedTeam?.boardMood ?? 50,
        fanSentiment: careerState?.ownedTeam?.fanSentiment ?? 50,
        personalFollowers: careerState?.personalLife?.brand?.socialMediaFollowing ?? 0
      },
      venueType: selectedVenue.type,
      venuePrestige: selectedVenue.prestigeLevel,
      venueCapacityMax: effectiveVenueCapacity,
      marketingLevel,
      currentTotalGuests: totalGuests
    })
  }, [selectedVenue, player?.reputation, careerState?.ownedTeam?.boardMood, 
      careerState?.ownedTeam?.fanSentiment, careerState?.personalLife?.brand?.socialMediaFollowing,
      effectiveVenueCapacity, marketingLevel, totalGuests])
  
  // Remaining venue capacity
  const remainingCapacity = effectiveVenueCapacity - totalGuests
  
  // Calculate costs
  const costs = useMemo(() => {
    let venueCost = 0
    let cateringCost = 0
    let mediaCost = 0
    let guestCosts = 0
    
    if (selectedVenue) {
      venueCost = calculateVenueCost(selectedVenue, 1, player?.reputation || 50)
    }
    
    if (selectedCatering && totalGuests > 0) {
      const cateringCalc = calculateCateringCost(selectedCatering, totalGuests)
      cateringCost = cateringCalc.total
    }
    
    // Media costs
    if (mediaCoverage.pressRelease) mediaCost += 500
    if (mediaCoverage.photographerHired) mediaCost += 1000
    if (mediaCoverage.videoTeamHired) mediaCost += 3000
    if (mediaCoverage.livestream) mediaCost += 2000
    
    // VIP treatment costs
    const vipTreatmentCount = sponsorReps.filter(s => s.vipTreatment).reduce((sum, s) => sum + s.count, 0)
    guestCosts += vipTreatmentCount * 200
    
    // Exclusive media access costs
    const exclusiveMediaCount = mediaInvites.filter(m => m.exclusiveAccess).reduce((sum, m) => sum + m.count, 0)
    guestCosts += exclusiveMediaCount * 500
    
    const baseCost = selectedTemplate?.baseCost || 0
    const subtotal = venueCost + cateringCost + mediaCost + guestCosts + baseCost
    
    // Fan revenue offset
    const fanRevenue = fanCount * fanTicketPrice
    
    const total = Math.max(0, subtotal - fanRevenue)
    
    return {
      venueCost,
      cateringCost,
      mediaCost,
      guestCosts,
      baseCost,
      subtotal,
      fanRevenue,
      total
    }
  }, [selectedVenue, selectedCatering, totalGuests, mediaCoverage, sponsorReps, mediaInvites, fanCount, fanTicketPrice, selectedTemplate, player?.reputation])
  
  // Budget category information
  const budgetCategory = selectedTemplate?.budgetCategory || 'operations'
  
  // Map budget category to budget field and display name
  const budgetFieldMap: Record<BudgetCategory, string> = {
    development: 'developmentBudget',
    marketing: 'marketingBudget',
    travel: 'travelBudget',
    contingency: 'contingencyBudget',
    operations: 'cash',
    personal: 'cash'
  }
  
  const budgetCategoryNames: Record<BudgetCategory, string> = {
    development: 'Development & R&D',
    marketing: 'Marketing & PR',
    travel: 'Travel & Logistics',
    contingency: 'Contingency Reserve',
    operations: 'Operations',
    personal: 'Personal'
  }
  
  // Get current budget values
  const teamBudgets = careerState?.ownedTeam?.budgets
  const teamCash = teamBudgets?.cash ?? player?.finances?.bankBalance ?? 0
  const budgetField = budgetFieldMap[budgetCategory]
  const categoryBudget = teamBudgets ? (teamBudgets[budgetField as keyof typeof teamBudgets] as number) ?? 0 : 0
  
  // Calculate if this would cause overspend
  const wouldOverspend = costs.total > categoryBudget && categoryBudget >= 0
  const overspendAmount = wouldOverspend ? costs.total - Math.max(0, categoryBudget) : 0
  
  // Soft enforcement: Allow overspend but warn
  // Only block if trying to spend more than 2x total available
  const totalAvailable = budgetField === 'cash' 
    ? teamCash 
    : categoryBudget + teamCash
  const canAfford = costs.total <= totalAvailable * 2 // Extreme overspend protection
  
  // Active sponsors for guest selection
  const activeSponsors = useMemo(() => {
    return (player?.finances?.sponsorDeals || []).filter(s => s.active)
  }, [player?.finances?.sponsorDeals])
  
  // Build configuration
  const buildConfiguration = (): ActivityConfiguration => {
    return {
      venueId: selectedVenue?.id || 'team_hq',
      venueName: selectedVenue?.name,
      guests: {
        sponsorReps,
        mediaInvites,
        fanAttendees: fanCount > 0 ? {
          count: fanCount,
          ticketPrice: fanTicketPrice,
          merchandiseAvailable
        } : undefined,
        vipGuests,
        totalCount: totalGuests
      },
      cateringId: selectedCatering?.id || 'basic_refreshments',
      cateringName: selectedCatering?.name,
      mediaCoverage,
      allocatedBudget: costs.total,
      estimatedCost: costs.total,
      customName: customName || undefined
    }
  }
  
  // Handle schedule
  const handleSchedule = () => {
    if (!selectedTemplate) return
    const config = buildConfiguration()
    onSchedule(selectedTemplate.id, week, day, config, selectedPeriod ?? undefined)
    onClose()
  }
  
  // Dynamic step navigation based on template flags
  const steps: ConfigStep[] = useMemo(() => {
    const baseSteps: ConfigStep[] = ['template']
    
    if (!selectedTemplate) return [...baseSteps, 'venue', 'guests', 'catering', 'media', 'review']
    
    // Only show venue step if there are venue choices (not just HQ)
    const hasVenueChoice = !selectedTemplate.supportedVenueTypes || 
      selectedTemplate.supportedVenueTypes.length !== 1 || 
      selectedTemplate.supportedVenueTypes[0] !== 'team_hq'
    if (hasVenueChoice) {
      baseSteps.push('venue')
    }
    
    // Only show guests step if any guest types are allowed
    const hasGuestOptions = selectedTemplate.allowsSponsorGuests || 
      selectedTemplate.allowsMediaGuests || 
      selectedTemplate.allowsFanAttendees ||
      selectedTemplate.allowsVIPGuests
    if (hasGuestOptions) {
      baseSteps.push('guests')
    }
    
    // Only show catering step if catering is allowed/required
    if (selectedTemplate.requiresCatering || hasGuestOptions) {
      baseSteps.push('catering')
    }
    
    // Only show media step if media coverage is allowed
    if (selectedTemplate.allowsMediaCoverage) {
      baseSteps.push('media')
    }
    
    baseSteps.push('review')
    return baseSteps
  }, [selectedTemplate])
  
  const currentStepIndex = steps.indexOf(currentStep)
  
  const canProceed = () => {
    switch (currentStep) {
      case 'template': return !!selectedTemplate
      case 'venue': return !!selectedVenue
      case 'guests': return true // Optional
      case 'catering': return !!selectedCatering || !selectedTemplate?.requiresCatering
      case 'media': return true // Optional
      case 'review': return canAfford
      default: return false
    }
  }
  
  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }
  
  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }
  
  // Auto-select venue if only one option (like team_hq)
  useEffect(() => {
    if (selectedTemplate && availableVenues.length === 1 && !selectedVenue) {
      setSelectedVenue(availableVenues[0])
    }
  }, [selectedTemplate, availableVenues, selectedVenue])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A1E] border border-surface-secondary rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-secondary flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold">
              Schedule Activity
            </h2>
            <p className="text-sm text-text-muted">
              {getDayName(day)}, Week {week}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Cost Display */}
            <div className="text-right">
              <p className="text-sm text-text-muted">
                {budgetCategoryNames[budgetCategory]}
              </p>
              <p className={`text-lg font-bold ${
                !canAfford ? 'text-status-error' : 
                wouldOverspend ? 'text-status-warning' : 
                'text-status-success'
              }`}>
                ${costs.total.toLocaleString()}
              </p>
              {selectedTemplate && (
                <p className={`text-xs ${categoryBudget >= costs.total ? 'text-text-muted' : 'text-status-warning'}`}>
                  Budget: ${categoryBudget.toLocaleString()}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="px-4 py-3 border-b border-surface-secondary bg-surface-secondary/30">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = step === currentStep
              const isCompleted = index < currentStepIndex
              const labels: Record<ConfigStep, string> = {
                template: 'Activity',
                venue: 'Venue',
                guests: 'Guests',
                catering: 'Catering',
                media: 'Media',
                review: 'Review'
              }
              
              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => index <= currentStepIndex && setCurrentStep(step)}
                    disabled={index > currentStepIndex}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-accent-blue text-white' : ''}
                      ${isCompleted ? 'bg-status-success/20 text-status-success' : ''}
                      ${!isActive && !isCompleted ? 'text-text-muted' : ''}
                      ${index <= currentStepIndex ? 'cursor-pointer hover:bg-surface-secondary' : 'cursor-not-allowed'}
                    `}
                  >
                    {isCompleted && <Check className="w-4 h-4" />}
                    <span className="text-sm font-medium">{labels[step]}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-text-muted mx-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* Template Selection */}
            {currentStep === 'template' && (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold mb-4">Select Activity Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableTemplates.map(template => {
                    const isSelected = selectedTemplate?.id === template.id
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isSelected 
                            ? 'border-status-success bg-status-success/15 shadow-[0_0_15px_rgba(0,210,106,0.3)]' 
                            : 'border-surface-secondary hover:border-accent-blue/50 hover:bg-surface-secondary/30'}
                        `}
                      >
                        {/* Selection checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-success flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-status-success/20' : 'bg-surface-secondary'}`}>
                            {template.category === 'sponsor' && <Handshake className="w-5 h-5 text-accent-gold" />}
                            {template.category === 'team' && <Users className="w-5 h-5 text-accent-blue" />}
                            {template.category === 'media' && <Newspaper className="w-5 h-5 text-accent-orange" />}
                            {template.category === 'development' && <Zap className="w-5 h-5 text-accent-purple" />}
                            {template.category === 'personal' && <User className="w-5 h-5 text-accent-blue" />}
                            {template.category === 'maintenance' && <Wrench className="w-5 h-5 text-text-muted" />}
                            {template.category === 'lifestyle' && <Heart className="w-5 h-5 text-status-success" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isSelected ? 'text-status-success' : ''}`}>{template.name}</p>
                            <p className="text-xs text-text-muted mt-1 line-clamp-2">{template.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {template.duration}h
                              </Badge>
                              {template.baseCost > 0 && (
                                <Badge variant="red" className="text-xs">
                                  ${template.baseCost.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Venue Selection */}
            {currentStep === 'venue' && (
              <motion.div
                key="venue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold mb-4">Select Venue</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableVenues.map(venue => {
                    const isSelected = selectedVenue?.id === venue.id
                    return (
                      <button
                        key={venue.id}
                        onClick={() => setSelectedVenue(venue)}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isSelected 
                            ? 'border-status-success bg-status-success/15 shadow-[0_0_15px_rgba(0,210,106,0.3)]' 
                            : 'border-surface-secondary hover:border-accent-blue/50 hover:bg-surface-secondary/30'}
                        `}
                      >
                        {/* Selection checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-success flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${isSelected ? 'text-status-success' : 'text-text-muted'}`} />
                            <span className={`font-medium ${isSelected ? 'text-status-success' : ''}`}>{venue.name}</span>
                          </div>
                          <Badge variant={venue.prestigeLevel >= 4 ? 'gold' : 'default'} className="text-xs">
                            {getPrestigeDescription(venue.prestigeLevel)}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mb-2">{venue.city}, {venue.country}</p>
                        <p className="text-xs text-text-muted mb-2">{venue.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">
                            Capacity: {venue.capacity.min}-{venue.capacity.max}
                          </span>
                          <span className={`text-sm font-bold ${isSelected ? 'text-status-success' : 'text-accent-blue'}`}>
                            ${calculateVenueCost(venue, 1, player?.reputation || 50).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Guest Management */}
            {currentStep === 'guests' && (
              <motion.div
                key="guests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Guest Management</h3>
                      <p className="text-xs text-text-muted mt-1">
                        {selectedTemplate?.category === 'sponsor' && 'Invite sponsor representatives to strengthen relationships'}
                        {selectedTemplate?.category === 'media' && 'Select which media outlets to invite for coverage'}
                        {selectedTemplate?.category === 'team' && 'Choose team members and stakeholders to attend'}
                        {selectedTemplate?.category === 'development' && 'Select engineers and technical staff'}
                      </p>
                    </div>
                    <Badge variant="blue">Total: {totalGuests} guests</Badge>
                  </div>
                  
                  {/* Venue Capacity Bar */}
                  <div className="p-3 rounded-lg bg-surface-secondary/30 border border-surface-secondary">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-text-muted flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedVenue?.name || 'Venue'} capacity
                      </span>
                      <span className={`text-xs font-medium ${remainingCapacity < 0 ? 'text-status-error' : remainingCapacity < 10 ? 'text-accent-orange' : 'text-text-secondary'}`}>
                        {totalGuests} / {effectiveVenueCapacity}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          totalGuests / effectiveVenueCapacity > 0.9 
                            ? 'bg-status-error' 
                            : totalGuests / effectiveVenueCapacity > 0.7 
                              ? 'bg-accent-orange' 
                              : 'bg-accent-blue'
                        }`}
                        style={{ width: `${Math.min(100, (totalGuests / effectiveVenueCapacity) * 100)}%` }}
                      />
                    </div>
                    {selectedVenue?.type === 'team_hq' && marketingLevel < 5 && (
                      <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent-purple" />
                        Upgrade Marketing facility for more capacity (currently Level {marketingLevel})
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Sponsor Reps */}
                {selectedTemplate?.allowsSponsorGuests !== false && (
                  <div className="p-4 rounded-xl border border-surface-secondary">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-accent-gold" />
                      Sponsor Representatives
                    </h4>
                    {activeSponsors.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-text-muted mb-3">
                          Select which sponsors to invite and how many representatives from each
                        </p>
                        {activeSponsors.map(sponsor => {
                          const existing = sponsorReps.find(s => s.sponsorId === sponsor.sponsorId)
                          const isInvited = (existing?.count || 0) > 0
                          return (
                            <div 
                              key={sponsor.sponsorId} 
                              className={`
                                flex items-center justify-between p-3 rounded-lg border-2 transition-all
                                ${isInvited 
                                  ? 'bg-accent-gold/10 border-accent-gold/50' 
                                  : 'bg-surface-secondary/30 border-transparent'}
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isInvited}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSponsorReps(prev => [...prev, { 
                                        sponsorId: sponsor.sponsorId, 
                                        sponsorName: sponsor.sponsorName, 
                                        count: 2, 
                                        vipTreatment: false 
                                      }])
                                    } else {
                                      setSponsorReps(prev => prev.filter(s => s.sponsorId !== sponsor.sponsorId))
                                    }
                                  }}
                                  className="w-5 h-5 rounded accent-accent-gold"
                                />
                                <div>
                                  <span className="text-sm font-medium">{sponsor.sponsorName}</span>
                                  <p className="text-xs text-text-muted">Active Sponsor</p>
                                </div>
                              </div>
                              {isInvited && (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted">Reps:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="20"
                                      value={existing?.count || 2}
                                      onChange={(e) => {
                                        const count = Math.max(1, parseInt(e.target.value) || 1)
                                        setSponsorReps(prev => prev.map(s => 
                                          s.sponsorId === sponsor.sponsorId 
                                            ? { ...s, count }
                                            : s
                                        ))
                                      }}
                                      className="w-14 px-2 py-1 rounded bg-surface-secondary text-center text-sm"
                                    />
                                  </div>
                                  <label className="flex items-center gap-1 text-xs bg-accent-gold/20 px-2 py-1 rounded">
                                    <input
                                      type="checkbox"
                                      checked={existing?.vipTreatment || false}
                                      onChange={(e) => {
                                        setSponsorReps(prev => prev.map(s => 
                                          s.sponsorId === sponsor.sponsorId 
                                            ? { ...s, vipTreatment: e.target.checked }
                                            : s
                                        ))
                                      }}
                                      className="rounded"
                                    />
                                    VIP Treatment
                                  </label>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-surface-secondary/20 rounded-lg">
                        <Handshake className="w-10 h-10 text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-muted">No sponsors signed yet</p>
                        <p className="text-xs text-text-muted mt-1">
                          Sign sponsors through the Sponsors menu to invite them to events
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Media Invites */}
                {selectedTemplate?.allowsMediaGuests !== false && (
                  <div className="p-4 rounded-xl border border-surface-secondary">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-accent-orange" />
                      Media Invitations
                    </h4>
                    <p className="text-xs text-text-muted mb-3">
                      Invite media outlets for coverage - better media presence increases reputation impact
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { type: 'local_press' as const, label: 'Local Press', desc: 'Regional newspapers and radio', reach: 'Low reach, friendly coverage' },
                        { type: 'national_media' as const, label: 'National Media', desc: 'Major TV and newspapers', reach: 'High reach, professional coverage' },
                        { type: 'international' as const, label: 'International Media', desc: 'Global motorsport outlets', reach: 'Worldwide reach, scrutinized coverage' },
                        { type: 'influencers' as const, label: 'Influencers', desc: 'Social media personalities', reach: 'Young audience, viral potential' }
                      ]).map(item => {
                        const limit = guestLimits?.media[item.type]
                        const isHidden = limit && limit.venueAffinity === 0
                        const isLocked = limit && !limit.available
                        const existing = mediaInvites.find(m => m.type === item.type)
                        const isInvited = (existing?.count || 0) > 0
                        
                        // Get dynamic max: min of reputation limit and remaining capacity
                        const dynamicMax = limit 
                          ? Math.max(1, Math.min(limit.maxCount, (existing?.count || 0) + remainingCapacity))
                          : 50
                        
                        // Calculate acceptance estimate
                        const acceptanceEst = isInvited && existing ? getEstimatedAttendance({
                          type: item.type,
                          invitedCount: existing.count,
                          reputation: player?.reputation ?? 50,
                          venuePrestige: selectedVenue?.prestigeLevel ?? 2,
                          marketingLevel
                        }) : null
                        
                        // Hidden types: venue affinity 0
                        if (isHidden) return null
                        
                        return (
                          <div 
                            key={item.type} 
                            className={`
                              p-3 rounded-lg border-2 transition-all
                              ${isLocked 
                                ? 'bg-surface-secondary/10 border-transparent opacity-60'
                                : isInvited 
                                  ? 'bg-accent-orange/10 border-accent-orange/50' 
                                  : 'bg-surface-secondary/30 border-transparent'}
                            `}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isLocked ? (
                                  <Lock className="w-4 h-4 text-text-muted" />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isInvited}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const defaultCount = Math.min(3, dynamicMax)
                                        setMediaInvites(prev => [...prev, { type: item.type, count: defaultCount, exclusiveAccess: false }])
                                      } else {
                                        setMediaInvites(prev => prev.filter(m => m.type !== item.type))
                                      }
                                    }}
                                    className="w-4 h-4 rounded accent-accent-orange"
                                  />
                                )}
                                <span className={`text-sm font-medium ${isLocked ? 'text-text-muted' : ''}`}>{item.label}</span>
                              </div>
                              {isInvited && !isLocked && (
                                <input
                                  type="number"
                                  min="1"
                                  max={dynamicMax}
                                  value={existing?.count || 3}
                                  onChange={(e) => {
                                    const count = Math.max(1, Math.min(dynamicMax, parseInt(e.target.value) || 1))
                                    setMediaInvites(prev => prev.map(m => 
                                      m.type === item.type ? { ...m, count } : m
                                    ))
                                  }}
                                  className="w-14 px-2 py-1 rounded bg-surface-secondary text-center text-sm"
                                />
                              )}
                            </div>
                            <p className="text-xs text-text-muted">{item.desc}</p>
                            
                            {isLocked && limit?.unlockRequirement && (
                              <p className="text-xs text-accent-orange/70 mt-1 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {limit.unlockRequirement}
                              </p>
                            )}
                            
                            {!isLocked && (
                              <p className="text-xs text-accent-orange/70 mt-1">{item.reach}</p>
                            )}
                            
                            {limit?.warningText && !isLocked && (
                              <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {limit.warningText}
                              </p>
                            )}
                            
                            {/* Effect description tooltip */}
                            {!isLocked && (
                              <p className="text-xs text-text-muted/60 mt-1 italic">
                                {getGuestTypeEffectDescription(item.type)}
                              </p>
                            )}
                            
                            {/* Acceptance rate estimate */}
                            {isInvited && acceptanceEst && (
                              <p className="text-xs text-accent-blue/70 mt-1">
                                Est. {acceptanceEst.min}-{acceptanceEst.max} of {existing?.count} will attend
                              </p>
                            )}
                            
                            {isInvited && !isLocked && (
                              <label className="flex items-center gap-1 text-xs mt-2 bg-accent-orange/20 px-2 py-1 rounded w-fit">
                                <input
                                  type="checkbox"
                                  checked={existing?.exclusiveAccess || false}
                                  onChange={(e) => {
                                    setMediaInvites(prev => prev.map(m => 
                                      m.type === item.type 
                                        ? { ...m, exclusiveAccess: e.target.checked }
                                        : m
                                    ))
                                  }}
                                  className="rounded"
                                />
                                Exclusive Access (+$500/person)
                              </label>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Fan Attendees */}
                {selectedTemplate?.allowsFanAttendees && (
                  <div className="p-4 rounded-xl border border-surface-secondary">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-blue" />
                      Fan Attendees
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Number of Fans</label>
                        <input
                          type="number"
                          min="0"
                          max={selectedVenue?.capacity.max || 1000}
                          value={fanCount}
                          onChange={(e) => setFanCount(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-secondary text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Ticket Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={fanTicketPrice}
                          onChange={(e) => setFanTicketPrice(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-secondary text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={merchandiseAvailable}
                            onChange={(e) => setMerchandiseAvailable(e.target.checked)}
                            className="rounded"
                          />
                          Merchandise
                        </label>
                      </div>
                    </div>
                    {fanCount > 0 && fanTicketPrice > 0 && (
                      <p className="text-xs text-status-success mt-2">
                        Revenue: ${(fanCount * fanTicketPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                {/* VIP Guests */}
                {selectedTemplate?.allowsVIPGuests && (
                  <div className="p-4 rounded-xl border border-surface-secondary">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent-purple" />
                      VIP Guests
                    </h4>
                    <p className="text-xs text-text-muted mb-3">
                      Invite high-profile guests to elevate the event's prestige and networking potential
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { type: 'board_members' as const, label: 'Board Members', desc: 'Team board of directors' },
                        { type: 'potential_sponsors' as const, label: 'Potential Sponsors', desc: 'Prospective business partners' },
                        { type: 'celebrities' as const, label: 'Celebrities', desc: 'Public figures and influencers' },
                        { type: 'officials' as const, label: 'Motorsport Officials', desc: 'Series organizers and stewards' },
                        { type: 'drivers' as const, label: 'Guest Drivers', desc: 'Other racing drivers' }
                      ]).map(item => {
                        const limit = guestLimits?.vip[item.type]
                        const isHidden = limit && limit.venueAffinity === 0
                        const isLocked = limit && !limit.available
                        const existing = vipGuests.find(v => v.type === item.type)
                        const isInvited = (existing?.count || 0) > 0
                        
                        // Get dynamic max: min of reputation limit and remaining capacity
                        const dynamicMax = limit 
                          ? Math.max(1, Math.min(limit.maxCount, (existing?.count || 0) + remainingCapacity))
                          : 20
                        
                        // Calculate acceptance estimate
                        const acceptanceEst = isInvited && existing ? getEstimatedAttendance({
                          type: item.type,
                          invitedCount: existing.count,
                          reputation: player?.reputation ?? 50,
                          venuePrestige: selectedVenue?.prestigeLevel ?? 2,
                          marketingLevel
                        }) : null
                        
                        // Hidden types: venue affinity 0
                        if (isHidden) return null
                        
                        return (
                          <div 
                            key={item.type} 
                            className={`
                              p-3 rounded-lg border-2 transition-all
                              ${isLocked 
                                ? 'bg-surface-secondary/10 border-transparent opacity-60'
                                : isInvited 
                                  ? 'bg-accent-purple/10 border-accent-purple/50' 
                                  : 'bg-surface-secondary/30 border-transparent'}
                            `}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isLocked ? (
                                  <Lock className="w-4 h-4 text-text-muted" />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isInvited}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const defaultCount = Math.min(2, dynamicMax)
                                        setVipGuests(prev => [...prev, { type: item.type, count: defaultCount }])
                                      } else {
                                        setVipGuests(prev => prev.filter(v => v.type !== item.type))
                                      }
                                    }}
                                    className="w-4 h-4 rounded accent-accent-purple"
                                  />
                                )}
                                <span className={`text-sm font-medium ${isLocked ? 'text-text-muted' : ''}`}>{item.label}</span>
                              </div>
                              {isInvited && !isLocked && (
                                <input
                                  type="number"
                                  min="1"
                                  max={dynamicMax}
                                  value={existing?.count || 2}
                                  onChange={(e) => {
                                    const count = Math.max(1, Math.min(dynamicMax, parseInt(e.target.value) || 1))
                                    setVipGuests(prev => prev.map(v => 
                                      v.type === item.type ? { ...v, count } : v
                                    ))
                                  }}
                                  className="w-14 px-2 py-1 rounded bg-surface-secondary text-center text-sm"
                                />
                              )}
                            </div>
                            <p className="text-xs text-text-muted">{item.desc}</p>
                            
                            {isLocked && limit?.unlockRequirement && (
                              <p className="text-xs text-accent-purple/70 mt-1 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {limit.unlockRequirement}
                              </p>
                            )}
                            
                            {limit?.warningText && !isLocked && (
                              <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {limit.warningText}
                              </p>
                            )}
                            
                            {/* Effect description */}
                            {!isLocked && (
                              <p className="text-xs text-text-muted/60 mt-1 italic">
                                {getGuestTypeEffectDescription(item.type)}
                              </p>
                            )}
                            
                            {/* Acceptance rate estimate */}
                            {isInvited && acceptanceEst && (
                              <p className="text-xs text-accent-blue/70 mt-1">
                                Est. {acceptanceEst.min}-{acceptanceEst.max} of {existing?.count} will attend
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Catering Selection */}
            {currentStep === 'catering' && (
              <motion.div
                key="catering"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Catering Selection</h3>
                  <span className="text-sm text-text-muted">For {totalGuests} guests</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {availableCatering.map(option => {
                    const costCalc = calculateCateringCost(option, totalGuests)
                    const isSelected = selectedCatering?.id === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedCatering(option)}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isSelected 
                            ? 'border-status-success bg-status-success/15 shadow-[0_0_15px_rgba(0,210,106,0.3)]' 
                            : 'border-surface-secondary hover:border-accent-blue/50 hover:bg-surface-secondary/30'}
                        `}
                      >
                        {/* Selection checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-success flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Utensils className={`w-4 h-4 ${isSelected ? 'text-status-success' : 'text-text-muted'}`} />
                            <span className={`font-medium ${isSelected ? 'text-status-success' : ''}`}>{option.name}</span>
                          </div>
                          <Badge variant={option.qualityRating >= 4 ? 'gold' : 'default'} className="text-xs">
                            {getTierDisplayName(option.tier)}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mb-2">{option.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">
                            ${option.costPerPerson}/person
                          </span>
                          <span className={`text-sm font-bold ${isSelected ? 'text-status-success' : 'text-accent-blue'}`}>
                            ${costCalc.total.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Media Coverage */}
            {currentStep === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold mb-4">Media Coverage Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'pressRelease', label: 'Press Release', cost: 500, icon: Newspaper, desc: 'Basic media coverage and announcement' },
                    { key: 'photographerHired', label: 'Professional Photography', cost: 1000, icon: Camera, desc: 'High-quality photos for social media' },
                    { key: 'videoTeamHired', label: 'Video Production', cost: 3000, icon: Camera, desc: 'Professional promotional video' },
                    { key: 'livestream', label: 'Livestream', cost: 2000, icon: Camera, desc: 'Live broadcast for fan engagement' },
                    { key: 'exclusiveInterviews', label: 'Exclusive Interviews', cost: 0, icon: Newspaper, desc: 'One-on-one media interviews (time cost)' },
                    { key: 'socialMediaCoverage', label: 'Social Media Posts', cost: 0, icon: Star, desc: 'Internal team social media coverage' }
                  ].map(item => {
                    const isSelected = mediaCoverage[item.key as keyof MediaCoverageConfig]
                    return (
                      <button
                        key={item.key}
                        onClick={() => setMediaCoverage(prev => ({ ...prev, [item.key]: !prev[item.key as keyof MediaCoverageConfig] }))}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isSelected
                            ? 'border-status-success bg-status-success/15 shadow-[0_0_15px_rgba(0,210,106,0.3)]' 
                            : 'border-surface-secondary hover:border-accent-blue/50 hover:bg-surface-secondary/30'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-status-success/20' : 'bg-surface-secondary'}
                          `}>
                            {isSelected 
                              ? <Check className="w-5 h-5 text-status-success" />
                              : <item.icon className="w-5 h-5 text-text-muted" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${isSelected ? 'text-status-success' : ''}`}>{item.label}</span>
                              {item.cost > 0 ? (
                                <Badge variant="red" className="text-xs">${item.cost.toLocaleString()}</Badge>
                              ) : (
                                <Badge variant="green" className="text-xs">Free</Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Review */}
            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold mb-4">Review & Confirm</h3>
                
                {/* Summary Card */}
                <Card variant="surface" padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Activity</span>
                    <span className="font-medium">{customName || selectedTemplate?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Venue</span>
                    <span className="font-medium">{selectedVenue?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Catering</span>
                    <span className="font-medium">{selectedCatering?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total Guests</span>
                    <span className="font-medium">{totalGuests}</span>
                  </div>
                </Card>
                
                {/* Cost Breakdown */}
                <Card variant="surface" padding="md">
                  <h4 className="font-medium mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Venue</span>
                      <span>${costs.venueCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Catering</span>
                      <span>${costs.cateringCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Media</span>
                      <span>${costs.mediaCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Guest Services</span>
                      <span>${costs.guestCosts.toLocaleString()}</span>
                    </div>
                    {costs.baseCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Base Cost</span>
                        <span>${costs.baseCost.toLocaleString()}</span>
                      </div>
                    )}
                    {costs.fanRevenue > 0 && (
                      <div className="flex justify-between text-status-success">
                        <span>Fan Revenue</span>
                        <span>-${costs.fanRevenue.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-surface-secondary pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className={canAfford ? 'text-status-success' : 'text-status-error'}>
                        ${costs.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                    {/* Budget Category Info */}
                  <div className="mt-3 pt-3 border-t border-surface-secondary">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-muted">Budget Category</span>
                      <span className="font-medium">{budgetCategoryNames[budgetCategory]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Category Balance</span>
                      <span className={categoryBudget < 0 ? 'text-status-error' : categoryBudget < costs.total ? 'text-status-warning' : 'text-status-success'}>
                        ${categoryBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">After Activity</span>
                      <span className={(categoryBudget - costs.total) < 0 ? 'text-status-error' : 'text-status-success'}>
                        ${(categoryBudget - costs.total).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Overspend Warning */}
                  {wouldOverspend && (
                    <div className="mt-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-status-warning">Budget Overspend Warning</p>
                          <p className="text-sm text-text-muted mt-1">
                            This activity will exceed your {budgetCategoryNames[budgetCategory]} budget by ${overspendAmount.toLocaleString()}.
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            <strong>Consequences:</strong>
                            {budgetCategory === 'development' && ' Development speed reduced by 10%'}
                            {budgetCategory === 'marketing' && ' Sponsor satisfaction penalties'}
                            {budgetCategory === 'travel' && ' Team morale penalties'}
                            {budgetCategory === 'contingency' && ' Board mood affected, reduced emergency funds'}
                            {budgetCategory === 'operations' && ' Operational efficiency reduced, staff morale impact'}
                            {budgetCategory === 'personal' && ' Increased financial stress, personal wellbeing impact'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!canAfford && (
                    <div className="mt-3 p-2 rounded-lg bg-status-error/10 border border-status-error/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-status-error" />
                      <span className="text-sm text-status-error">
                        Extreme overspend blocked - reduce activity scope or reallocate budget
                      </span>
                    </div>
                  )}
                </Card>
                
                {/* Time Slot Picker */}
                <Card variant="surface" padding="md">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-blue" />
                    Time Slot
                  </h4>
                  {(() => {
                    const timeCost = selectedTemplate ? getActivityTimeCost(selectedTemplate.id) : null
                    const allowedPeriods = timeCost?.allowedPeriods
                    const periodIcons: Record<DayPeriod, typeof Sun> = {
                      morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon,
                    }
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {DAY_PERIOD_ORDER.map(period => {
                          const config = DAY_PERIODS[period]
                          const PIcon = periodIcons[period]
                          const isAllowed = !allowedPeriods || allowedPeriods.includes(period)
                          const isSelected = selectedPeriod === period
                          return (
                            <button
                              key={period}
                              disabled={!isAllowed}
                              onClick={() => setSelectedPeriod(isSelected ? null : period)}
                              className={`
                                flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all
                                ${!isAllowed 
                                  ? 'opacity-30 cursor-not-allowed border-surface-secondary bg-surface-secondary/20'
                                  : isSelected
                                    ? 'border-accent-blue bg-accent-blue/15 text-accent-blue ring-1 ring-accent-blue/40'
                                    : 'border-surface-secondary bg-surface-secondary/30 hover:border-accent-blue/50 text-text-secondary'
                                }
                              `}
                            >
                              <PIcon className="w-3.5 h-3.5" />
                              <span className="font-medium">{config.shortLabel}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {!selectedPeriod && (
                    <p className="mt-2 text-[10px] text-text-muted">No slot selected — flexible scheduling</p>
                  )}
                </Card>

                {/* Custom Name */}
                <div>
                  <label className="text-sm text-text-muted block mb-2">Custom Activity Name (optional)</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedTemplate?.name}
                    className="w-full px-4 py-2 rounded-lg bg-surface-secondary border border-surface-secondary focus:border-accent-blue outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-surface-secondary flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={currentStepIndex === 0 ? onClose : prevStep}
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep === 'review' ? (
            <Button 
              variant="primary" 
              onClick={handleSchedule}
              disabled={!canAfford}
            >
              <Check className="w-4 h-4 mr-2" />
              Schedule Activity
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
