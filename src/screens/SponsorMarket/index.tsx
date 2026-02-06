/**
 * Sponsor Market Screen
 * 
 * Browse available sponsors, view compatibility scores, and initiate outreach.
 * Shows interest levels, filters by category/tier, and manages negotiations.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Search,
  Filter,
  Globe,
  Wrench,
  Zap,
  Star,
  TrendingUp,
  Lock,
  Unlock,
  Send,
  MessageSquare,
  Clock,
  Check,
  X,
  AlertCircle,
  _ChevronDown,
  _Target,
  _Wallet,
  _Mail,
  Camera,
  Calendar,
  LineChart,
  Crown,
  Megaphone,
  Sparkles
} from 'lucide-react'
import {
  Card,
  Button,
  Badge,
  PageHeader,
  _Tabs,
  _TabsList,
  _TabsTrigger,
  _TabsContent,
  Modal,
  useToast,
  Input,
  SponsorLogo
} from '@/components/ui';

interface SponsorDetailViewProps {
  sponsor: any
  team: any
  onApproach: () => void
  isContacting: boolean
}

function SponsorDetailView({ sponsor, team, onApproach, isContacting }: SponsorDetailViewProps) {
  const categoryInfo = SPONSOR_CATEGORIES[sponsor.category]
  
  const interestColor = sponsor.interestLevel >= 70 ? 'text-status-success' :
                        sponsor.interestLevel >= 50 ? 'text-status-info' :
                        sponsor.interestLevel >= 30 ? 'text-status-warning' : 'text-status-danger'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <SponsorLogo
          src={getSponsorLogo(sponsor.id || sponsor.name)}
          name={sponsor.name}
          height="lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-bold text-xl">{sponsor.name}</h3>
            {sponsor.canApproach ? (
              <Badge variant="green" size="sm">
                <Unlock className="w-3 h-3 mr-1" />
                Can Approach
              </Badge>
            ) : sponsor.alreadySponsoring ? (
              <Badge variant="blue" size="sm">
                <Check className="w-3 h-3 mr-1" />
                Active Sponsor
              </Badge>
            ) : sponsor.inNegotiation ? (
              <Badge variant="orange" size="sm">
                <MessageSquare className="w-3 h-3 mr-1" />
                In Negotiation
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
          <p className="text-text-muted text-sm">{sponsor.description}</p>
          <p className="text-xs text-text-muted mt-1">{categoryInfo.name} | {sponsor.country}</p>
        </div>
      </div>
      
      {/* Interest Level */}
      <div className="p-4 bg-surface rounded-xl">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Sponsor Interest</span>
          <span className={`font-mono font-bold ${interestColor}`}>{sponsor.interestLevel}%</span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full ${
              sponsor.interestLevel >= 70 ? 'bg-status-success' :
              sponsor.interestLevel >= 50 ? 'bg-status-info' :
              sponsor.interestLevel >= 30 ? 'bg-status-warning' : 'bg-status-danger'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${sponsor.interestLevel}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-text-muted">
          {sponsor.interestLevel >= 70 ? 'Very interested - high chance of positive response' :
           sponsor.interestLevel >= 50 ? 'Moderately interested - good chance of response' :
           sponsor.interestLevel >= 30 ? 'Low interest - may decline or offer less' :
           'Very low interest - unlikely to respond positively'}
        </p>
      </div>
      
      {/* Affiliation Bonuses */}
      {(sponsor.hasNationalityBonus || sponsor.hasManufacturerBonus || 
        sponsor.nationalityBonus?.length || sponsor.manufacturerBonus?.length) && (
        <div className="p-4 bg-surface rounded-xl">
          <h4 className="font-medium mb-3">Affiliation Bonuses</h4>
          <div className="space-y-2">
            {sponsor.hasNationalityBonus && (
              <div className="flex items-center gap-2 p-2 bg-status-success/10 rounded-lg">
                <Globe className="w-4 h-4 text-status-success" />
                <span className="text-sm">+20% Nationality Match ({team.baseCountry})</span>
              </div>
            )}
            {sponsor.hasManufacturerBonus && (
              <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span className="text-sm">+20% Manufacturer Match ({team.manufacturerAlignment})</span>
              </div>
            )}
            {!sponsor.hasNationalityBonus && sponsor.nationalityBonus?.length && (
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <Globe className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">
                  +20% for teams from: {sponsor.nationalityBonus.join(', ')}
                </span>
              </div>
            )}
            {!sponsor.hasManufacturerBonus && sponsor.manufacturerBonus?.length && (
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <Wrench className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">
                  +20% for: {sponsor.manufacturerBonus.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* What They Value - Preview */}
      <div className="p-4 bg-surface rounded-xl border border-accent-gold/20">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-gold" />
          What They Value
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="blue" className="flex items-center gap-1">
            {getPriorityIcon(sponsor.sponsorPriority?.primary ?? 'exposure', 'w-3 h-3 mr-1')}
            Primary: {formatPriorityLabel(sponsor.sponsorPriority?.primary ?? 'exposure')}
          </Badge>
          <Badge variant="default" className="flex items-center gap-1">
            {getPriorityIcon(sponsor.sponsorPriority?.secondary ?? 'media', 'w-3 h-3 mr-1')}
            Secondary: {formatPriorityLabel(sponsor.sponsorPriority?.secondary ?? 'media')}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-background rounded">
            <Camera className="w-3 h-3 text-blue-400" />
            <span>Media: {sponsor.sponsorExpectations?.requiredShoutouts ?? 4} posts/season</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-background rounded">
            <Calendar className="w-3 h-3 text-purple-400" />
            <span>Events: {sponsor.sponsorExpectations?.requiredEvents ?? 2}/yr</span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Full requirements revealed during negotiation
        </p>
      </div>
      
      {/* Requirements */}
      <div className="p-4 bg-surface rounded-xl">
        <h4 className="font-medium mb-3">Requirements</h4>
        <div className="space-y-2">
          <RequirementRow
            label="Minimum Reputation"
            current={team.reputation}
            required={sponsor.requirements.minReputation}
            met={team.reputation >= sponsor.requirements.minReputation * 0.7}
          />
          {sponsor.requirements.minWins && (
            <RequirementRow
              label="Career Wins"
              current={0}
              required={sponsor.requirements.minWins}
              met={false}
            />
          )}
          {sponsor.requirements.minPodiums && (
            <RequirementRow
              label="Career Podiums"
              current={0}
              required={sponsor.requirements.minPodiums}
              met={false}
            />
          )}
        </div>
      </div>
      
      {/* Estimated Value */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded-xl text-center">
          <p className="text-xs text-text-muted mb-1">Est. Monthly</p>
          <p className="font-mono font-bold text-2xl text-status-success">
            ${sponsor.estimatedMonthly.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-background rounded-xl text-center">
          <p className="text-xs text-text-muted mb-1">Est. Annual Value</p>
          <p className="font-mono font-bold text-2xl text-status-success">
            ${sponsor.estimatedAnnual.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Approach Reason */}
      {!sponsor.canApproach && sponsor.approachReason && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-status-warning" />
            <span className="text-sm text-status-warning">{sponsor.approachReason}</span>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="pt-4 border-t border-surface-border">
        {sponsor.canApproach ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={onApproach}
            disabled={isContacting}
          >
            {isContacting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending Outreach...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Contact Sponsor
              </>
            )}
          </Button>
        ) : sponsor.inNegotiation ? (
          <Button variant="secondary" className="w-full" disabled>
            <MessageSquare className="w-4 h-4 mr-2" />
            Check Inbox for Updates
          </Button>
        ) : sponsor.alreadySponsoring ? (
          <Button variant="secondary" className="w-full" disabled>
            <Check className="w-4 h-4 mr-2" />
            Already Partnered
          </Button>
        ) : (
          <Button variant="ghost" className="w-full" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Requirements Not Met
          </Button>
        )}
      </div>
    </div>
  )
}

interface RequirementRowProps {
  label: string
  current: number
  required: number
  met: boolean
}

function RequirementRow({ label, current, required, met }: RequirementRowProps) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${
      met ? 'bg-status-success/10' : 'bg-status-danger/10'
    }`}>
      <div className="flex items-center gap-2">
        {met ? (
          <Check className="w-4 h-4 text-status-success" />
        ) : (
          <X className="w-4 h-4 text-status-danger" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm">
        <span className={met ? 'text-status-success' : 'text-status-danger'}>
          {Math.round(current)}
        </span>
        <span className="text-text-muted"> / {required}</span>
      </div>
    </div>
  )
}

// ============================================
// PRIORITY HELPERS
// ============================================

function getPriorityIcon(priority: string, className: string = 'w-4 h-4'): React.ReactNode {
  switch (priority) {
    case 'media': return <Camera className={className} />
    case 'events': return <Calendar className={className} />
    case 'performance': return <LineChart className={className} />
    case 'prestige': return <Crown className={className} />
    case 'exposure': return <Megaphone className={className} />
    case 'technology': return <Zap className={className} />
    default: return <Star className={className} />
  }
}

function formatPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    media: 'Media',
    events: 'Events',
    performance: 'Results',
    prestige: 'Prestige',
    exposure: 'Exposure',
    technology: 'Tech'
  }
  retur