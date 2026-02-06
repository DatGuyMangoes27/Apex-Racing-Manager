import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { 
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
  _Scale,
  HeartHandshake as HandHeart,
  Zap
} from 'lucide-react';
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

function ContactDetailView({ contact, _currentWeek, _currentYear, onInteract, onAskFavor, onClose }: ContactDetailViewProps) {
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

function SocialActivityLog({ entries, _currentWeek, _currentYear, maxDisplay = 8 }: SocialActivityLogProps) {
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
function SocialActivityLogCompact({ entries, _currentWeek, _currentYear }: { entries: SocialLogEntry[]; currentWeek: number; currentYear: number }) {
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
