import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  Star,
  Trophy,
  AlertTriangle,
  Newspaper,
  Heart,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye,
  EyeOff,
  Mic,
  Award,
  Handshake,
  Swords,
  MessageSquare,
  Clock,
  Plus,
  ChevronDown,
  Building,
  Globe,
  X,
  Activity,
  UserPlus,
  Megaphone,
  Scale,
  HeartHandshake as HandHeart,
  Zap
} from 'lucide-react';
import { Card, CardHeader, Badge, Button, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useCareerStore } from '@/store/careerStore'
import { SCANDAL_RESPONSES, CHARITY_CAUSE_CONFIG, SOCIAL_EVENT_TEMPLATES } from '@/data/social-events-config'

interface ScandalResponseViewProps {
  scandal: any
  onClose: () => void
  onRespond: (strategy: string) => void
}

function ScandalResponseView({ scandal, onClose, onRespond }: ScandalResponseViewProps) {
  const { addToast } = useToast()
  
  // Calculate estimated cost for each response
  const baseCost = scandal.severity === 'catastrophic' ? 500000 :
                   scandal.severity === 'major' ? 200000 :
                   scandal.severity === 'moderate' ? 75000 : 25000
  
  const handleResponse = (type: 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin') => {
    const result = onRespond(scandal.id, type)
    addToast({
      type: result.success ? (result.message.includes('backfired') ? 'warning' : 'success') : 'error',
      title: result.success ? 'Response Issued' : 'Response Failed',
      message: result.message
    })
    if (result.success) {
      onClose()
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-status-danger/10 rounded-lg">
        <h4 className="font-medium mb-2">{scandal.name}</h4>
        <p className="text-sm text-text-muted">{scandal.description}</p>
      </div>

      <p className="text-sm text-text-muted">
        Choose how to respond. Your response will affect public perception and the scandal's outcome.
      </p>

      <div className="space-y-3">
        {(Object.entries(SCANDAL_RESPONSES) as [keyof typeof SCANDAL_RESPONSES, typeof SCANDAL_RESPONSES[keyof typeof SCANDAL_RESPONSES]][]).map(([type, response]) => {
          const estimatedCost = Math.floor(baseCost * response.costMultiplier)
          return (
            <div 
              key={type}
              className="p-4 bg-background rounded-lg cursor-pointer hover:bg-surface transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{response.name}</h4>
                <Badge variant="outline">
                  ~${estimatedCost.toLocaleString()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                <div>Effectiveness (if guilty): {response.effectivenessIfGuilty}%</div>
                <div>Effectiveness (if innocent): {response.effectivenessIfInnocent}%</div>
                <div>Media reaction: {response.mediaReaction > 0 ? '+' : ''}{response.mediaReaction}</div>
                <div>Risk of backfire: {response.riskOfBackfire}%</div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => handleResponse(type as 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin')}
              >
                Choose This Response
              </Button>
            </div>
          )
        })}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

// ============================================
// CONTACT DETAIL VIEW
// ============================================

const BENEFIT_LABELS: Record<string, { label: string; description: string }> = {
  sponsorConnections: { label: 'Sponsor Connections', description: 'May lead to endorsement opportunities' },
  investmentTips: { label: 'Investment Tips', description: 'Provides a small cash bonus' },
  legalHelp: { label: 'Legal Help', description: 'Reduces scandal impact' },
  mediaInfluence: { label: 'Media Influence', description: 'Adds a positive reputation event' },
  politicalInfluence: { label: 'Political Influence', description: 'Reduces regulatory risk' },
  racingInsider: { label: 'Racing Insider', description: 'Team development insight bonus' }
}

interface ContactDetailViewProps {
  contact: SocialContact
  currentWeek: number
  currentYear: number
  onInteract: (quality: 'poor' | 'neutral' | 'good' | 'excellent') => void
  onAskFavor: (favorType: string) => void
  onClose: () => void
}

function ContactDetailView({ contact, currentWeek: _currentWeek, currentYear: _currentYear, onInteract, onAskFavor, onClose }: ContactDetailViewProps) {
  const activeBenefits = Object.entries(contact.benefits).filter(([_, value]) => value && value > 0)
  
  return (
    <div className="space-y-4">
      {/* Contact Overview */}
      <div className="flex items-center gap-4 p-4 bg-background rounded-lg">
        <div className="w-14 h-14 rounded-full bg-accent-blue/20 flex items-center justify-center">
          <Users className="w-7 h-7 text-accent-blue" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{contact.name}</h3>
          <p className="text-sm text-text-muted capitalize">{contact.type.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Relationship & Trust Meters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-background rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-text-muted">Relationship</span>
            <span className="text-xs font-mono">{contact.relationshipLevel}/100</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                contact.relationshipLevel >= 70 ? 'bg-status-success' :
                contact.relationshipLevel >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              style={{ width: `${contact.relationshipLevel}%` }}
            />
          </div>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-text-muted">Trust</span>
            <span className="text-xs font-mono">{contact.trustLevel}/100</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                contact.trustLevel >= 70 ? 'bg-accent-blue' :
                contact.trustLevel >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              style={{ width: `${contact.trustLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Favor Balance & Last Interaction */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-2 bg-background rounded-lg text-center">
          <p className="text-xs text-text-muted">Favors Owed</p>
          <p className="font-mono font-bold text-lg text-status-success">{contact.favorsOwed}</p>
          <p className="text-[10px] text-text-muted">They owe you</p>
        </div>
        <div className="p-2 bg-background rounded-lg text-center">
          <p className="text-xs text-text-muted">Favors Owing</p>
          <p className="font-mono font-bold text-lg text-accent-orange">{contact.favorsOwing}</p>
          <p className="text-[10px] text-text-muted">You owe them</p>
        </div>
        <div className="p-2 bg-background rounded-lg text-center">
          <p className="text-xs text-text-muted">Last Contact</p>
          <p className="font-mono font-bold text-sm">
            W{contact.lastInteraction.week}
          </p>
          <p className="text-[10px] text-text-muted">Y{contact.lastInteraction.year}</p>
        </div>
      </div>

      {/* Spend Time */}
      <div className="border-t border-surface-border pt-4">
        <p className="text-sm font-medium mb-2">Spend Time Together</p>
        <div className="grid grid-cols-4 gap-2">
          {([
            { quality: 'poor' as const, label: 'Quick Chat', desc: 'Brief catch-up' },
            { quality: 'neutral' as const, label: 'Coffee', desc: 'Casual meetup' },
            { quality: 'good' as const, label: 'Dinner', desc: 'Quality time' },
            { quality: 'excellent' as const, label: 'Weekend', desc: 'Deep bonding' }
          ]).map(opt => (
            <button
              key={opt.quality}
              onClick={() => onInteract(opt.quality)}
              className="p-2 bg-background rounded-lg hover:bg-surface transition-colors text-center"
            >
              <p className="text-xs font-medium">{opt.label}</p>
              <p className="text-[10px] text-text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ask Favors */}
      {activeBenefits.length > 0 && (
        <div className="border-t border-surface-border pt-4">
          <p className="text-sm font-medium mb-2">Ask a Favor</p>
          {contact.relationshipLevel < 40 && (
            <p className="text-xs text-status-warning mb-2">
              Relationship must be at least 40 to ask favors (currently {contact.relationshipLevel})
            </p>
          )}
          <div className="space-y-2">
            {activeBenefits.map(([key, value]) => {
              const info = BENEFIT_LABELS[key] || { label: key, description: '' }
              const canAsk = contact.relationshipLevel >= 40
              return (
                <button
                  key={key}
                  onClick={() => canAsk && onAskFavor(key)}
                  disabled={!canAsk}
                  className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    canAsk 
                      ? 'bg-background hover:bg-surface cursor-pointer' 
                      : 'bg-background opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-text-muted">{info.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={canAsk ? 'green' : 'default'} size="sm">
                      Power: {value}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

// ============================================
// SOCIAL ACTIVITY LOG
// ============================================

function getLogIcon(type: SocialLogType) {
  switch (type) {
    case 'event_attended': return <Calendar className="w-4 h-4 text-accent-gold" />
    case 'contact_met': return <UserPlus className="w-4 h-4 text-status-success" />
    case 'scandal_update': return <AlertTriangle className="w-4 h-4 text-status-error" />
    case 'rivalry_update': return <Swords className="w-4 h-4 text-accent-orange" />
    case 'endorsement': return <Award className="w-4 h-4 text-accent-gold" />
    case 'philanthropy': return <HandHeart className="w-4 h-4 text-status-success" />
    case 'invitation': return <Newspaper className="w-4 h-4 text-status-info" />
    case 'public_image': return <Star className="w-4 h-4 text-accent-gold" />
    case 'social_media': return <Megaphone className="w-4 h-4 text-status-info" />
    case 'privacy': return <Shield className="w-4 h-4 text-text-muted" />
    default: return <Zap className="w-4 h-4 text-text-muted" />
  }
}

function getLogColor(impact?: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive': return 'border-status-success/30 bg-status-success/5'
    case 'negative': return 'border-status-error/30 bg-status-error/5'
    default: return 'border-surface-border bg-surface/50'
  }
}

function getLogBadgeVariant(impact?: 'positive' | 'negative' | 'neutral'): 'green' | 'red' | 'default' {
  switch (impact) {
    case 'positive': return 'green'
    case 'negative': return 'red'
    default: return 'default'
  }
}

interface SocialActivityLogProps {
  entries: SocialLogEntry[]
  currentWeek: number
  currentYear: number
  maxDisplay?: number
}

function SocialActivityLog({ entries, currentWeek: _currentWeek, currentYear: _currentYear, maxDisplay = 8 }: SocialActivityLogProps) {
  const [expanded, setExpanded] = useState(false)
  
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.week - a.week
  })
  
  const displayEntries = expanded ? sortedEntries : sortedEntries.slice(0, maxDisplay)
  const hasMore = sortedEntries.length > maxDisplay
  
  return (
    <Card variant="default" padding="md">
      <CardHeader 
        title="Activity Log" 
        icon={<Activity className="w-4 h-4 text-text-muted" />}
        action={
          <Badge variant="default" size="sm">
            {entries.length}
          </Badge>
        }
      />
      
      <div className="space-y-2">
        {displayEntries.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No social activity yet — advance a few weeks
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: index * 0.03 }}
                className={`p-2 rounded-lg border ${getLogColor(entry.impact)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getLogIcon(entry.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium truncate">{entry.title}</h4>
                      <Badge 
                        variant={getLogBadgeVariant(entry.impact)} 
                        size="sm"
                        className="shrink-0"
                      >
                        W{entry.week}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {entry.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show Less' : `Show ${sortedEntries.length - maxDisplay} More`}
          </Button>
        )}
      </div>
    </Card>
  )
}

/** Compact inline version shown above the tabs */
function SocialActivityLogCompact({ entries, currentWeek: _currentWeek, currentYear: _currentYear }: { entries: SocialLogEntry[]; currentWeek: number; currentYear: number }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <Card variant="default" padding="sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium">Recent Activity</span>
          <Badge variant="default" size="sm">{entries.length} new</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-2 px-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-2 rounded-lg border ${getLogColor(entry.impact)} flex items-start gap-2`}
                >
                  <div className="mt-0.5">{getLogIcon(entry.type)}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{entry.title}</span>
                    <p className="text-xs text-text-muted line-clamp-1">{entry.description}</p>
                  </div>
                  <Badge variant={getLogBadgeVariant(entry.impact)} size="sm">W{entry.week}</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

interface FoundationCardProps {
  foundation: CharityFoundation
  index: number
  onDonate: (foundation: CharityFoundation) => void
  onPlanGala: (foundation: CharityFoundation) => void
}

function FoundationCard({ foundation, index, onDonate, onPlanGala }: FoundationCardProps) {
  const causeConfig = CHARITY_CAUSE_CONFIG[foundation.cause]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-background rounded-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{foundation.name}</h4>
          <p className="text-sm text-text-muted">{causeConfig?.name}</p>
        </div>
        <Badge variant="outline">
          Est. {foundation.establishedDate.year}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-text-muted">Annual Budget</p>
          <p className="font-mono">${foundation.annualBudget.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Total Donated</p>
          <p className="font-mono text-accent-gold">${foundation.totalDonated.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Impact Score</p>
          <p className="font-mono">{foundation.impactScore}/100</p>
        </div>
        <div>
          <p className="text-text-muted">Tax Deduction</p>
          <p className="font-mono">{foundation.taxDeductionPercentage}%</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          onClick={() => onDonate(foundation)}
        >
          Donate
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={() => onPlanGala(foundation)}
        >
          Plan Gala
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN SOCIAL PANEL COMPONENT
// ============================================

interface SocialPanelProps {
  personalBrand?: any
  socialContacts?: any[]
  upcomingEvents?: any[]
  rivalries?: any[]
  activeScandals?: any[]
  charityFoundations?: any[]
  socialLog?: any[]
  currentWeek?: number
  currentYear?: number
  className?: string
  onInteractWithContact?: (contactId: string, quality: 'poor' | 'neutral' | 'good' | 'excellent') => { success: boolean; message: string }
  onAskContactForFavor?: (contactId: string, favorType: string) => { success: boolean; message: string; benefitValue?: number }
  onRespondToScandal?: (scandalId: string, responseType: 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin') => { success: boolean; message: string }
  onDonateToFoundation?: (foundationId: string, amount: number) => { success: boolean; message: string }
  onPlanGala?: (foundationId: string, budget: number) => { success: boolean; message: string }
  onScheduleEvent?: (eventType: string, eventWeek: number, options?: { tier?: 'standard' | 'vip' | 'vip_table'; invitedContactIds?: string[] }) => { success: boolean; message: string }
  onDismissEvent?: (eventId: string) => { success: boolean; message: string }
  onResolveRivalry?: (rivalryId: string, resolution: 'reconciliation' | 'total_victory' | 'defeat' | 'fade_away') => { success: boolean; message: string }
}

export function SocialPanel({
  personalBrand,
  socialContacts = [],
  upcomingEvents = [],
  rivalries = [],
  activeScandals = [],
  charityFoundations = [],
  socialLog = [],
  currentWeek = 1,
  currentYear = 2024,
  className = '',
  onInteractWithContact,
  onAskContactForFavor,
  onRespondToScandal,
  onDonateToFoundation,
  onPlanGala,
  onScheduleEvent,
  onDismissEvent,
  onResolveRivalry
}: SocialPanelProps) {
  const { addToast } = useToast()
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [selectedScandal, setSelectedScandal] = useState<any>(null)
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [bookingEvent, setBookingEvent] = useState<any>(null)
  const [bookingTier, setBookingTier] = useState<'standard' | 'vip' | 'vip_table'>('standard')
  const [bookingWeek, setBookingWeek] = useState(currentWeek + 1)
  const [bookingGuests, setBookingGuests] = useState<string[]>([])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Scandals */}
      {activeScandals.length > 0 && (
        <Card>
          <CardHeader title="Active Scandals" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} />
          <div className="p-4 space-y-2">
            {activeScandals.map((scandal: any, i: number) => (
              <div key={i} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => setSelectedScandal(scandal)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{scandal.title || 'Scandal'}</span>
                  <Badge variant="red">Active</Badge>
                </div>
                <p className="text-xs text-text-muted mt-1">{scandal.description || 'Requires your attention'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Rivalries */}
      {rivalries.filter((r: any) => r.isActive).length > 0 && (
        <Card>
          <CardHeader title="Active Rivalries" icon={<Swords className="w-4 h-4 text-accent-orange" />} />
          <div className="p-4 space-y-2">
            {rivalries.filter((r: any) => r.isActive).map((rivalry: any) => (
              <div key={rivalry.id} className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{rivalry.rivalName}</span>
                  <Badge variant={rivalry.intensity > 70 ? 'red' : rivalry.intensity > 40 ? 'orange' : 'outline'} size="sm">
                    Intensity: {rivalry.intensity}%
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">{rivalry.origin}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                  <span>Clashes: {rivalry.publicClashes || 0}</span>
                  <span>•</span>
                  <span>Stress: +{rivalry.stressIncrease || 0}%</span>
                  <span>•</span>
                  <span>Motivation: +{rivalry.motivationBonus || 0}%</span>
                </div>
                {onResolveRivalry && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => {
                      const result = onResolveRivalry(rivalry.id, 'reconciliation')
                      addToast({ type: result.success ? 'success' : 'error', title: result.success ? 'Rivalry Resolved' : 'Error', message: result.message })
                    }}>
                      Reconcile
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const result = onResolveRivalry(rivalry.id, 'fade_away')
                      addToast({ type: result.success ? 'info' : 'error', title: result.success ? 'Moving On' : 'Error', message: result.message })
                    }}>
                      Let it Fade
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Social Events - Schedule & Upcoming */}
      <Card>
        <CardHeader 
          title="Social Events" 
          subtitle={upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming` : 'Schedule events to grow your network'}
          icon={<Calendar className="w-4 h-4 text-accent-gold" />} 
          action={
            onScheduleEvent && (
              <Button variant="secondary" size="sm" onClick={() => setShowEventPicker(!showEventPicker)}>
                <Plus className="w-3 h-3 mr-1" />
                {showEventPicker ? 'Close' : 'Schedule'}
              </Button>
            )
          }
        />
        <div className="p-4 space-y-3">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-2">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="p-3 rounded-lg bg-accent-gold/5 border border-accent-gold/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{event.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">Week {event.date?.week}</Badge>
                      {onDismissEvent && (
                        <button 
                          onClick={() => {
                            const result = onDismissEvent(event.id)
                            addToast({
                              type: result.success ? 'success' : 'error',
                              title: result.success ? 'Event Cancelled' : 'Error',
                              message: result.message
                            })
                          }}
                          className="text-text-muted hover:text-status-danger transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">{event.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                    <span className="capitalize">{event.dresscode?.replace(/_/g, ' ')}</span>
                    {event.isHosting && <Badge variant="blue" size="sm">Hosting</Badge>}
                    {event.attendanceTier === 'vip' && <Badge variant="green" size="sm">VIP</Badge>}
                    {event.attendanceTier === 'vip_table' && <Badge variant="green" size="sm">VIP Table</Badge>}
                    {event.invitedContactIds && event.invitedContactIds.length > 0 && (
                      <Badge variant="default" size="sm">+{event.invitedContactIds.length} guest{event.invitedContactIds.length > 1 ? 's' : ''}</Badge>
                    )}
                    {event.inviteOnly && <Badge variant="default" size="sm">Invite Only</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingEvents.length === 0 && !showEventPicker && (
            <p className="text-sm text-text-muted text-center py-3">
              No upcoming events. Schedule events to meet new contacts and build your reputation.
            </p>
          )}

          {/* Event Picker / Booking Panel */}
          <AnimatePresence>
            {showEventPicker && !bookingEvent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-surface-border pt-3 space-y-2">
                  <p className="text-xs text-text-muted mb-2">Choose an event to book:</p>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {SOCIAL_EVENT_TEMPLATES.map((template) => {
                      const cost = template.isHosting && template.hostingCostMultiplier 
                        ? template.cost * template.hostingCostMultiplier 
                        : template.cost
                      const meetsReputation = !template.minimumReputation || 
                        (personalBrand?.publicImage ?? 0) >= template.minimumReputation
                      
                      return (
                        <div 
                          key={template.type}
                          className={`p-3 rounded-lg border transition-colors ${
                            meetsReputation 
                              ? 'bg-background border-border/50 hover:bg-surface cursor-pointer' 
                              : 'bg-background/50 border-border/30 opacity-60'
                          }`}
                          onClick={() => {
                            if (!meetsReputation) return
                            setBookingEvent(template)
                            setBookingTier('standard')
                            setBookingWeek(currentWeek + 1)
                            setBookingGuests([])
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{template.name}</span>
                            <div className="flex items-center gap-2">
                              {template.isHosting && <Badge variant="blue" size="sm">Host</Badge>}
                              <Badge variant={cost === 0 ? 'green' : 'default'} size="sm">
                                {cost === 0 ? 'Free' : `$${cost.toLocaleString()}`}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-text-muted mb-2">{template.description}</p>
                          <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                            <span className="capitalize">{template.dresscode.replace(/_/g, ' ')}</span>
                            {template.minimumReputation && (
                              <span className={meetsReputation ? 'text-status-success' : 'text-status-danger'}>
                                Rep: {template.minimumReputation}+
                              </span>
                            )}
                            <span>+{template.effects.networkingOpportunities} Networking</span>
                            <span>+{template.effects.mediaExposure} Media</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Booking Panel — shown after selecting an event */}
            {bookingEvent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-t border-surface-border pt-4 space-y-4"
              >
                {/* Event Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{bookingEvent.name}</h4>
                    <p className="text-xs text-text-muted">{bookingEvent.description}</p>
                  </div>
                  <button onClick={() => setBookingEvent(null)} className="text-text-muted hover:text-text-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Week Picker */}
                <div>
                  <p className="text-xs text-text-muted mb-1">Schedule for week:</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map(offset => {
                      const w = currentWeek + offset
                      return (
                        <button
                          key={offset}
                          onClick={() => setBookingWeek(w)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            bookingWeek === w 
                              ? 'bg-accent-blue text-white' 
                              : 'bg-background hover:bg-surface text-text-muted'
                          }`}
                        >
                          Week {w}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tier Selector */}
                {bookingEvent.tierOptions && bookingEvent.tierOptions.vipCostMultiplier > 1 && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Attendance tier:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['standard', 'vip', 'vip_table'] as const).map(tier => {
                        const tierOpts = bookingEvent.tierOptions
                        const baseCost = bookingEvent.isHosting && bookingEvent.hostingCostMultiplier
                          ? bookingEvent.cost * bookingEvent.hostingCostMultiplier
                          : bookingEvent.cost
                        const tierCost = tier === 'vip' ? Math.floor(baseCost * tierOpts.vipCostMultiplier)
                          : tier === 'vip_table' ? Math.floor(baseCost * tierOpts.tableCostMultiplier)
                          : baseCost
                        const maxGuests = tier === 'vip_table' ? tierOpts.tableMaxPlusOnes
                          : tier === 'vip' ? tierOpts.vipMaxPlusOnes
                          : tierOpts.maxPlusOnes
                        const label = tier === 'standard' ? 'Standard' : tier === 'vip' ? 'VIP' : 'VIP Table'
                        
                        return (
                          <button
                            key={tier}
                            onClick={() => {
                              setBookingTier(tier)
                              // Trim guests if exceeding new max
                              if (bookingGuests.length > maxGuests) {
                                setBookingGuests(bookingGuests.slice(0, maxGuests))
                              }
                            }}
                            className={`p-2 rounded-lg border text-center transition-colors ${
                              bookingTier === tier 
                                ? 'border-accent-blue bg-accent-blue/10' 
                                : 'border-border/50 bg-background hover:bg-surface'
                            }`}
                          >
                            <p className="text-xs font-medium">{label}</p>
                            <p className="text-[10px] text-text-muted">
                              {tierCost === 0 ? 'Free' : `$${tierCost.toLocaleString()}`}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {maxGuests > 0 ? `${maxGuests} guest${maxGuests > 1 ? 's' : ''}` : 'No guests'}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Contact Invite Picker */}
                {(() => {
                  const tierOpts = bookingEvent.tierOptions
                  const maxGuests = !tierOpts ? 0
                    : bookingTier === 'vip_table' ? tierOpts.tableMaxPlusOnes
                    : bookingTier === 'vip' ? tierOpts.vipMaxPlusOnes
                    : tierOpts.maxPlusOnes
                  
                  if (maxGuests <= 0 || socialContacts.length === 0) return null
                  
                  return (
                    <div>
                      <p className="text-xs text-text-muted mb-1">
                        Invite guests ({bookingGuests.length}/{maxGuests}):
                        {tierOpts.plusOneCost > 0 && (
                          <span className="ml-1">${tierOpts.plusOneCost.toLocaleString()} per guest</span>
                        )}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {socialContacts.map((contact: any) => {
                          const isSelected = bookingGuests.includes(contact.id)
                          const relLevel = contact.relationshipLevel ?? contact.relationship ?? 50
                          const tooLow = relLevel < 20
                          const canSelect = !tooLow && (isSelected || bookingGuests.length < maxGuests)
                          const contactType = contact.type || 'friend'
                          const isPartnerOrDate = contactType === 'partner' || contactType === 'potential_date'
                          
                          return (
                            <button
                              key={contact.id}
                              disabled={!canSelect}
                              onClick={() => {
                                if (isSelected) {
                                  setBookingGuests(bookingGuests.filter(id => id !== contact.id))
                                } else if (canSelect) {
                                  setBookingGuests([...bookingGuests, contact.id])
                                }
                              }}
                              className={`p-2 rounded-lg border text-left transition-colors ${
                                isSelected 
                                  ? 'border-accent-blue bg-accent-blue/10' 
                                  : canSelect 
                                    ? 'border-border/50 bg-background hover:bg-surface'
                                    : 'border-border/30 bg-background/50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {isPartnerOrDate ? (
                                  <Heart className="w-3 h-3 text-pink-400 shrink-0" />
                                ) : (
                                  <Users className="w-3 h-3 text-text-muted shrink-0" />
                                )}
                                <span className="text-xs font-medium truncate">{contact.name}</span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] text-text-muted capitalize">{contactType.replace(/_/g, ' ')}</span>
                                <span className={`text-[10px] font-mono ${
                                  relLevel >= 60 ? 'text-status-success' : relLevel >= 30 ? 'text-text-muted' : 'text-status-danger'
                                }`}>
                                  {tooLow ? 'May decline' : `${relLevel}`}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Total Cost & Confirm */}
                {(() => {
                  const tierOpts = bookingEvent.tierOptions
                  const baseCost = bookingEvent.isHosting && bookingEvent.hostingCostMultiplier
                    ? bookingEvent.cost * bookingEvent.hostingCostMultiplier
                    : bookingEvent.cost
                  const tierCost = bookingTier === 'vip' && tierOpts ? Math.floor(baseCost * tierOpts.vipCostMultiplier)
                    : bookingTier === 'vip_table' && tierOpts ? Math.floor(baseCost * tierOpts.tableCostMultiplier)
                    : baseCost
                  const guestCost = bookingGuests.length * (tierOpts?.plusOneCost || 0)
                  const totalCost = tierCost + guestCost
                  const tierLabel = bookingTier === 'vip' ? ' (VIP)' : bookingTier === 'vip_table' ? ' (VIP Table)' : ''
                  
                  return (
                    <div className="border-t border-surface-border pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm">
                          <span className="text-text-muted">Total: </span>
                          <span className="font-mono font-bold">${totalCost.toLocaleString()}</span>
                          {guestCost > 0 && (
                            <span className="text-xs text-text-muted ml-1">(+${guestCost.toLocaleString()} guests)</span>
                          )}
                        </div>
                        <span className="text-xs text-text-muted capitalize">
                          {bookingEvent.dresscode?.replace(/_/g, ' ')} attire
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (!onScheduleEvent) return
                            const result = onScheduleEvent(bookingEvent.type, bookingWeek, {
                              tier: bookingTier,
                              invitedContactIds: bookingGuests.length > 0 ? bookingGuests : undefined
                            })
                            addToast({
                              type: result.success ? 'success' : 'error',
                              title: result.success ? 'Event Booked' : 'Cannot Book',
                              message: result.message
                            })
                            if (result.success) {
                              setBookingEvent(null)
                              setShowEventPicker(false)
                            }
                          }}
                        >
                          Confirm Booking{tierLabel}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setBookingEvent(null)}>
                          Back
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Social Contacts */}
      <Card>
        <CardHeader title="Social Network" subtitle={`${socialContacts.length} contacts`} icon={<Users className="w-4 h-4" />} />
        <div className="p-4">
          {socialContacts.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No social contacts yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {socialContacts.slice(0, 8).map((contact: any, i: number) => (
                <div key={i} className="p-2 rounded-lg bg-surface/50 border border-border/50 cursor-pointer hover:bg-surface transition-colors" onClick={() => setSelectedContact(contact)}>
                  <div className="text-sm font-medium text-text-primary truncate">{contact.name || 'Contact'}</div>
                  <div className="text-xs text-text-muted">{contact.type || 'Friend'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Charity Foundations */}
      {charityFoundations.length > 0 && (
        <Card>
          <CardHeader title="Foundations" icon={<Heart className="w-4 h-4 text-pink-400" />} />
          <div className="p-4 space-y-3">
            {charityFoundations.map((foundation: any, i: number) => (
              <FoundationCard
                key={i}
                foundation={foundation}
                index={i}
                onDonate={(f) => {
                  if (onDonateToFoundation) {
                    const amount = Math.floor((f.annualBudget || 100000) / 12)
                    const result = onDonateToFoundation(f.id, amount)
                    addToast({
                      type: result.success ? 'success' : 'error',
                      title: result.success ? 'Donation Made' : 'Donation Failed',
                      message: result.message
                    })
                  }
                }}
                onPlanGala={(f) => {
                  if (onPlanGala) {
                    const budget = Math.floor((f.annualBudget || 100000) / 4)
                    const result = onPlanGala(f.id, budget)
                    addToast({
                      type: result.success ? 'success' : 'error',
                      title: result.success ? 'Gala Planned' : 'Gala Failed',
                      message: result.message
                    })
                  }
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Social Activity Log */}
      {socialLog.length > 0 && (
        <Card>
          <CardHeader title="Recent Activity" icon={<Activity className="w-4 h-4" />} />
          <div className="p-4">
            <SocialActivityLogCompact entries={socialLog} currentWeek={currentWeek} currentYear={currentYear} />
          </div>
        </Card>
      )}

      {/* Scandal Response Modal */}
      {selectedScandal && (
        <Modal isOpen={!!selectedScandal} onClose={() => setSelectedScandal(null)} title="Scandal Response">
          <ScandalResponseView 
            scandal={selectedScandal} 
            onClose={() => setSelectedScandal(null)} 
            onRespond={onRespondToScandal ?? (() => setSelectedScandal(null))} 
          />
        </Modal>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <Modal isOpen={!!selectedContact} onClose={() => setSelectedContact(null)} title={selectedContact.name || 'Contact'}>
          <ContactDetailView
            contact={selectedContact}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onInteract={(quality) => {
              if (onInteractWithContact) {
                const result = onInteractWithContact(selectedContact.id, quality)
                addToast({
                  type: result.success ? 'success' : 'error',
                  title: result.success ? 'Time Spent' : 'Failed',
                  message: result.message
                })
              }
              setSelectedContact(null)
            }}
            onAskFavor={(favorType) => {
              if (onAskContactForFavor) {
                const result = onAskContactForFavor(selectedContact.id, favorType)
                addToast({
                  type: result.success ? 'success' : 'error',
                  title: result.success ? 'Favor Granted' : 'Favor Denied',
                  message: result.message
                })
              }
              setSelectedContact(null)
            }}
            onClose={() => setSelectedContact(null)}
          />
        </Modal>
      )}
    </div>
  )
}
