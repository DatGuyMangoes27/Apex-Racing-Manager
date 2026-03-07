/**
 * Shared team sponsors content: pending offers + active sponsors.
 * Used by Sponsor Market screen and Team Finances → Sponsors tab.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Clock, Target, Search, Check, X, AlertTriangle, Shield, Ban, DollarSign, Handshake } from 'lucide-react'
import { Card, CardHeader, Badge, Button, SponsorLogo } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import type { OwnedTeam, TeamSponsorDeal, TeamSponsorSlot, SponsorNegotiation } from '@/store/careerStore'
import {
  getSponsorSatisfactionStatus,
  getSponsorSlotLabel,
  isSlotAvailable,
  getSlotCapacity
} from '@/simulation/finances/teamSponsors'
import { getSponsorDeclinePenalty, DECLINE_COOLDOWN_WEEKS } from '@/simulation/sponsors/negotiation'
import { createTeamTransaction } from '@/simulation/finances/teamFinances'
import { getSponsorLogo } from '@/utils/generated-assets'
import { getSponsorById, getSponsorLogoPath } from '@/services/preGeneratedContentService'
import { useToast } from '@/components/ui'
import { calculateSponsorInterest } from '@/simulation/sponsors'
import { getSponsorPriority, getDefaultExpectations, SPONSOR_CATEGORIES } from '@/data/sponsors'
import type { Sponsor } from '@/data/sponsors'

const SLOT_CONFIG: { slot: TeamSponsorSlot; label: string }[] = [
  { slot: 'title', label: 'Title Sponsor' },
  { slot: 'primary', label: 'Primary Partner' },
  { slot: 'secondary', label: 'Secondary Sponsor' },
  { slot: 'associate', label: 'Associate Sponsor' }
]

export interface TeamSponsorsContentProps {
  team: OwnedTeam
  currentYear: number
  onSelectSponsor: (sponsor: TeamSponsorDeal) => void
  /** When user approaches a suggested sponsor, open negotiation modal. */
  onNegotiate?: (negotiation: SponsorNegotiation) => void
  /** Optional slot-based "Find" actions (e.g. Find Title Sponsor) - render above the lists. Default true. */
  showSlotActions?: boolean
}

export function TeamSponsorsContent({
  team,
  currentYear,
  onSelectSponsor,
  onNegotiate,
  showSlotActions = true
}: TeamSponsorsContentProps) {
  const { seekSponsorsBySlot, clearSuggestedSponsorsForSlot, startTeamSponsorNegotiation } = useCareerStore()
  const { addToast } = useToast()
  const activeSponsors = team.finances?.sponsors?.filter(s => s.active) || []
  const activeSponsorsBySlot = SLOT_CONFIG
    .map(({ slot, label }) => ({
      slot,
      label,
      sponsors: activeSponsors.filter((sponsor) => sponsor.slot === slot)
    }))
    .filter((group) => group.sponsors.length > 0)
  const pendingOffers = team.finances?.pendingSponsorOffers || []
  const pendingOffersBySlot = SLOT_CONFIG
    .map(({ slot, label }) => ({
      slot,
      label,
      offers: pendingOffers
        .filter((offer) => offer.slot === slot)
        .sort((a, b) => b.monthlyPayment - a.monthlyPayment)
    }))
    .filter((group) => group.offers.length > 0)
  const suggestedForSlot = team.finances?.suggestedSponsorsForSlot ?? null

  const handleSeekSlot = (slot: TeamSponsorSlot) => {
    seekSponsorsBySlot(slot)
    const label = SLOT_CONFIG.find(c => c.slot === slot)?.label ?? slot
    addToast({
      title: 'Sponsors found',
      description: `Showing sponsors open to a ${label} deal. Approach them to start talks.`,
      variant: 'success'
    })
  }

  return (
    <div className="space-y-6">
      {showSlotActions && (
        <Card variant="glass" padding="md">
          <CardHeader
            title="Seek sponsors by slot"
            subtitle="Find sponsors open to an approach for a specific partnership tier (no contract yet)"
          />
          <div className="flex flex-wrap gap-2">
            {SLOT_CONFIG.map(({ slot, label }) => {
              const available = isSlotAvailable(team, slot)
              const { current, max } = getSlotCapacity(team, slot)
              const slotLabel = max > 10 ? label : `${label} (${current}/${max})`
              return (
                <Button
                  key={slot}
                  variant="secondary"
                  size="sm"
                  disabled={!available}
                  onClick={() => handleSeekSlot(slot)}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {slotLabel}
                </Button>
              )
            })}
          </div>
          <p className="text-sm text-text-muted mt-3">
            Or browse all sponsors and filter by tier and category to find and approach specific partners.
          </p>
        </Card>
      )}

      {/* Sponsors open to an approach (from Seek by slot) — not pre-made offers */}
      {suggestedForSlot && suggestedForSlot.sponsorIds.length > 0 && (
        <SuggestedSponsorsForSlotCard
          team={team}
          slot={suggestedForSlot.slot}
          sponsorIds={suggestedForSlot.sponsorIds}
          onApproach={(sponsorId) => {
            const neg = startTeamSponsorNegotiation(sponsorId, suggestedForSlot.slot)
            if (neg) {
              clearSuggestedSponsorsForSlot()
              addToast({ title: 'Approach sent', description: 'Check your inbox after advancing the week for their response.', variant: 'success' })
              onNegotiate?.(neg)
            }
          }}
          onClear={clearSuggestedSponsorsForSlot}
        />
      )}

      {pendingOffers.length > 0 && (
        <Card variant="racing" padding="lg">
          <CardHeader
            title="Sponsor Offers"
            subtitle={`${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} waiting`}
          />
          {pendingOffersBySlot.length > 1 && (
            <div className="mb-4 rounded-xl border border-surface-border/60 bg-background/30 p-3">
              <p className="text-sm font-medium mb-3">Compare offers by partnership tier</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {pendingOffersBySlot.map((group) => (
                  <div key={group.slot} className="rounded-lg border border-surface-border/50 p-2 bg-surface/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.label}</p>
                      <Badge variant="outline" size="sm">{group.offers.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {group.offers.map((offer) => (
                        <button
                          key={offer.id}
                          type="button"
                          className="w-full text-left rounded-md border border-surface-border/50 px-2 py-1.5 hover:border-accent-blue/50 hover:bg-surface/40 transition-colors"
                          onClick={() => onSelectSponsor(offer)}
                        >
                          <p className="text-sm font-medium truncate">{offer.sponsorName}</p>
                          <p className="text-xs text-text-muted">
                            ${offer.monthlyPayment.toLocaleString()}/mo | +${offer.winBonus.toLocaleString()} win
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {pendingOffers.map((offer, index) => (
              <TeamSponsorOfferCard
                key={offer.id}
                offer={offer}
                team={team}
                index={index}
                onView={() => onSelectSponsor(offer)}
              />
            ))}
          </div>
        </Card>
      )}
      <Card variant="glass" padding="lg">
        <CardHeader
          title="Active Sponsors"
          subtitle={`${activeSponsors.length} sponsor${activeSponsors.length !== 1 ? 's' : ''}`}
        />
        {activeSponsors.length > 0 ? (
          <div className="space-y-5">
            {activeSponsorsBySlot.map((group) => (
              <div key={group.slot}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.label}</p>
                  <Badge variant="outline" size="sm">{group.sponsors.length}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {group.sponsors.map((sponsor, index) => (
                    <ActiveTeamSponsorCard
                      key={sponsor.id}
                      sponsor={sponsor}
                      index={index}
                      currentYear={currentYear}
                      onClick={() => onSelectSponsor(sponsor)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active sponsors</p>
            <p className="text-sm mt-1">Use the buttons above to seek sponsors for each slot, or they may approach as your reputation grows.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

interface TeamSponsorOfferCardProps {
  offer: TeamSponsorDeal
  team: OwnedTeam
  index: number
  onView: () => void
}

function TeamSponsorOfferCard({ offer, team, index, onView }: TeamSponsorOfferCardProps) {
  const logoSrc = getSponsorLogo(offer.sponsorId) || getSponsorLogoPath(offer.sponsorId)
  const sponsorProfile = getSponsorById(offer.sponsorId) as Sponsor | null
  const interest = sponsorProfile && team ? calculateSponsorInterest(sponsorProfile, team) : null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="default" padding="md" className="cursor-pointer hover:border-accent-blue/50 transition-colors" onClick={onView}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <SponsorLogo
              src={logoSrc}
              name={offer.sponsorName}
              height="md"
            />
            <div>
              <h4 className="font-medium">{offer.sponsorName}</h4>
              <p className="text-sm text-text-muted">{getSponsorSlotLabel(offer.slot)}</p>
            </div>
          </div>
          <Badge variant="orange" size="sm">New</Badge>
        </div>
        {interest !== null && (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-text-muted">Interest:</span>
            <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  interest >= 60 ? 'bg-status-success' : interest >= 40 ? 'bg-status-warning' : 'bg-status-danger'
                }`}
                style={{ width: `${Math.min(100, interest)}%` }}
              />
            </div>
            <span className="font-mono">{interest}%</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-text-muted">Monthly</p>
            <p className="font-mono font-bold text-status-success">${offer.monthlyPayment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Win</p>
            <p className="font-mono font-bold text-accent-gold">+${offer.winBonus.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Podium</p>
            <p className="font-mono font-bold text-accent-blue">+${offer.podiumBonus.toLocaleString()}</p>
          </div>
        </div>
        <Button variant="secondary" className="w-full mt-3" size="sm">
          View Details
        </Button>
      </Card>
    </motion.div>
  )
}

function SuggestedSponsorsForSlotCard({
  team,
  slot,
  sponsorIds,
  onApproach,
  onClear
}: {
  team: OwnedTeam
  slot: TeamSponsorSlot
  sponsorIds: string[]
  onApproach: (sponsorId: string) => void
  onClear: () => void
}) {
  const slotLabel = SLOT_CONFIG.find(c => c.slot === slot)?.label ?? slot
  return (
    <Card variant="racing" padding="lg">
      <CardHeader
        title={`Sponsors open to a ${slotLabel} deal`}
        subtitle="These sponsors are interested in talking. Approach them to start negotiations (they’ll respond by email)."
      />
      <div className="grid grid-cols-2 gap-4">
        {sponsorIds.map((sponsorId) => {
          const sponsor = getSponsorById(sponsorId) as Sponsor | null
          if (!sponsor) return null
          const interest = calculateSponsorInterest(sponsor, team)
          const logoSrc = getSponsorLogo(sponsorId) || getSponsorLogoPath(sponsorId)
          return (
            <Card key={sponsorId} variant="default" padding="md" className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <SponsorLogo src={logoSrc} name={sponsor.name} height="md" />
                <h4 className="font-medium">{sponsor.name}</h4>
              </div>
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-text-muted">Interest:</span>
                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      interest >= 60 ? 'bg-status-success' : interest >= 40 ? 'bg-status-warning' : 'bg-status-danger'
                    }`}
                    style={{ width: `${Math.min(100, interest)}%` }}
                  />
                </div>
                <span className="font-mono">{interest}%</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-auto" onClick={() => onApproach(sponsorId)}>
                Approach
              </Button>
            </Card>
          )
        })}
      </div>
      <Button variant="ghost" size="sm" className="mt-3" onClick={onClear}>
        Dismiss
      </Button>
    </Card>
  )
}

interface ActiveTeamSponsorCardProps {
  sponsor: TeamSponsorDeal
  index: number
  currentYear: number
  onClick: () => void
}

function ActiveTeamSponsorCard({ sponsor, index, currentYear, onClick }: ActiveTeamSponsorCardProps) {
  const yearsRemaining = (sponsor.startYear + sponsor.duration) - currentYear
  const satisfactionStatus = getSponsorSatisfactionStatus(sponsor.satisfaction)
  const isWarning = sponsor.satisfaction < 60
  const isCritical = sponsor.satisfaction < 40

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        variant="glass"
        padding="md"
        hoverable
        className={`cursor-pointer ${
          isCritical ? 'border-red-500/50' : isWarning ? 'border-amber-500/30' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <SponsorLogo
              src={getSponsorLogo(sponsor.sponsorId) || getSponsorLogoPath(sponsor.sponsorId)}
              name={sponsor.sponsorName}
              height="md"
            />
            <div>
              <h4 className="font-medium">{sponsor.sponsorName}</h4>
              <div className="mt-1">
                <Badge variant="outline" size="sm">{getSponsorSlotLabel(sponsor.slot)}</Badge>
              </div>
            </div>
          </div>
          <Badge variant={isCritical ? 'red' : isWarning ? 'yellow' : 'green'} size="sm">
            {isCritical ? 'At Risk' : isWarning ? 'Warning' : 'Active'}
          </Badge>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Satisfaction</span>
            <span className={satisfactionStatus.color}>{sponsor.satisfaction}%</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                sponsor.satisfaction >= 60 ? 'bg-status-success' :
                sponsor.satisfaction >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              style={{ width: `${sponsor.satisfaction}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">
            <Clock className="w-3 h-3 inline mr-1" />
            {yearsRemaining} yr{yearsRemaining !== 1 ? 's' : ''} left
          </span>
          <span className="font-mono text-status-success">
            ${sponsor.monthlyPayment.toLocaleString()}/mo
          </span>
        </div>
      </Card>
    </motion.div>
  )
}

function BrowseApproachActions({
  team,
  sponsorProfile,
  onApproach,
  onClose
}: {
  team: OwnedTeam
  sponsorProfile: Sponsor
  onApproach: (sponsor: Sponsor, desiredSlot?: TeamSponsorSlot) => void
  onClose: () => void
}) {
  const [selectedSlot, setSelectedSlot] = useState<TeamSponsorSlot>('associate')
  const availableSlots = SLOT_CONFIG.filter(({ slot }) => isSlotAvailable(team, slot))
  const effectiveSlot = availableSlots.some(({ slot }) => slot === selectedSlot)
    ? selectedSlot
    : availableSlots[0]?.slot ?? 'associate'

  return (
    <div className="flex flex-col gap-2">
      {availableSlots.length > 1 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-text-muted">Partner as</label>
          <select
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm"
            value={effectiveSlot}
            onChange={(e) => setSelectedSlot(e.target.value as TeamSponsorSlot)}
          >
            {availableSlots.map(({ slot, label }) => (
              <option key={slot} value={slot}>{label}</option>
            ))}
          </select>
        </div>
      )}
      <Button variant="primary" className="w-full" onClick={() => onApproach(sponsorProfile, effectiveSlot)}>
        Approach
      </Button>
      <Button variant="ghost" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

function TeamSponsorDetailActions({
  deal,
  onAccept,
  onDecline,
  onClose,
  onNegotiate
}: {
  deal: TeamSponsorDeal
  onAccept: () => void
  onDecline: () => void
  onClose: () => void
  onNegotiate?: (negotiation: SponsorNegotiation) => void
}) {
  const { acceptTeamSponsorOffer, declineTeamSponsorOffer, startTeamSponsorNegotiation } = useCareerStore()
  const { addToast } = useToast()
  const team = useCareerStore((s) => s.careerState?.ownedTeam)
  const currentWeek = useCareerStore((s) => s.careerState?.currentWeek ?? 1)
  const currentYear = useCareerStore((s) => s.careerState?.currentYear ?? new Date().getFullYear())
  const activeNegotiations = team?.finances?.activeNegotiations ?? []
  const activeSponsorsInSlot = (team?.finances?.sponsors || []).filter((s) => s.active && s.slot === deal.slot)
  const slotStillAvailable = team ? isSlotAvailable(team, deal.slot) : true
  const slotIsFull = !slotStillAvailable
  const [selectedReplacementSponsorId, setSelectedReplacementSponsorId] = useState<string>('')
  const selectedReplacementSponsor = activeSponsorsInSlot.find((s) => s.id === selectedReplacementSponsorId) || activeSponsorsInSlot[0] || null
  const canReplaceExistingSponsor = slotIsFull && !!selectedReplacementSponsor
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
    ? Math.round(selectedReplacementSponsor.monthlyPayment * 12 * replacementYearsRemaining * buyoutRateBySlot[deal.slot])
    : 0
  const replacementSwitchFee = canReplaceExistingSponsor ? Math.round(deal.monthlyPayment * switchMonthsBySlot[deal.slot]) : 0
  const replacementTotalPenalty = replacementBuyoutCost + replacementSwitchFee
  const repScale = repPenaltyScaleBySlot[deal.slot]
  const replacementRepPenalty = canReplaceExistingSponsor
    ? Math.min(repScale.max, Math.max(repScale.min, Math.round(replacementTotalPenalty / repScale.divisor)))
    : 0
  const replacementBoardPenalty = canReplaceExistingSponsor ? boardPenaltyBySlot[deal.slot] : 0
  const canProceedAccept = slotStillAvailable || canReplaceExistingSponsor
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)

  // Look up sponsor for tier info
  const sponsorData = getSponsorById(deal.sponsorId) as Sponsor | null

  const handleAccept = () => {
    if (acceptTeamSponsorOffer(deal.id)) {
      addToast({ title: 'Deal accepted', description: 'Sponsor has been added to your team.', variant: 'success' })
      onAccept()
    } else if (canReplaceExistingSponsor && team && selectedReplacementSponsor) {
      useCareerStore.setState(state => {
        if (!state.careerState?.ownedTeam?.finances) return state
        const current = state.careerState.ownedTeam
        const currentYearLocal = state.careerState.currentYear ?? new Date().getFullYear()
        const pending = current.finances.pendingSponsorOffers || []
        const offer = pending.find(d => d.id === deal.id)
        if (!offer) return state

        const replacedSponsor = (current.finances.sponsors || []).find((s) => s.id === selectedReplacementSponsor.id)
        if (!replacedSponsor) return state

        const deactivatedCurrentSlotSponsor = (current.finances.sponsors || []).map((s) =>
          s.id === replacedSponsor.id
            ? { ...s, active: false, satisfaction: Math.max(0, (s.satisfaction || 70) - 40) }
            : s
        )
        const newTitleDeal = { ...offer, active: true, startYear: currentYearLocal }
        const updatedCash = (current.budgets?.cash || 0) - replacementTotalPenalty
        const replacementTx = createTeamTransaction(
          'expense',
          'other',
          replacementTotalPenalty,
          `Sponsor buyout: replaced ${replacedSponsor.sponsorName} (${getSponsorSlotLabel(replacedSponsor.slot)}) with ${offer.sponsorName}`,
          state.careerState.currentWeek ?? currentWeek,
          currentYearLocal,
          { sponsorId: replacedSponsor.id }
        )

        return {
          ...state,
          ...(state.player ? {
            player: {
              ...state.player,
              reputation: Math.max(0, (current.reputation ?? 50) - replacementRepPenalty)
            }
          } : {}),
          careerState: {
            ...state.careerState,
            ownedTeam: {
              ...current,
              reputation: Math.max(0, (current.reputation ?? 50) - replacementRepPenalty),
              boardMood: Math.max(0, (current.boardMood ?? 50) - replacementBoardPenalty),
              budgets: {
                ...current.budgets,
                cash: updatedCash,
                yearToDateExpenses: (current.budgets?.yearToDateExpenses || 0) + replacementTotalPenalty
              },
              finances: {
                ...current.finances,
                sponsors: [...deactivatedCurrentSlotSponsor, newTitleDeal],
                pendingSponsorOffers: pending.filter(d => d.id !== deal.id),
                transactions: [...(current.finances.transactions || []), replacementTx]
              }
            }
          }
        }
      })

      addToast({
        title: 'Title sponsor replaced',
        description: `Paid $${replacementTotalPenalty.toLocaleString()} buyout/restructuring fee. Rep -${replacementRepPenalty}.`,
        variant: 'warning'
      })
      onAccept()
    } else {
      addToast({
        title: 'Cannot accept offer',
        description: `${getSponsorSlotLabel(deal.slot)} slot is currently full.`,
        variant: 'warning'
      })
    }
  }

  const handleDecline = () => {
    // Apply gameplay effects before declining
    const sponsorTier = sponsorData?.tier ?? 'mid'
    const reputationPenalty = getSponsorDeclinePenalty(sponsorTier)
    
    // Apply effects in store
    useCareerStore.setState(state => {
      if (!state.careerState?.ownedTeam) return state
      const currentWeek = state.careerState.currentWeek ?? 1
      const currentYear = state.careerState.currentYear ?? 2024
      const cooldownExpiryWeek = ((currentYear - 1) * 52) + currentWeek + DECLINE_COOLDOWN_WEEKS
      const currentReputation = state.careerState.ownedTeam.reputation ?? 50
      const existingCooldowns = state.careerState.ownedTeam.finances?.declinedSponsorCooldowns ?? {}
      
      return {
        ...state,
        ...(state.player ? {
          player: {
            ...state.player,
            reputation: Math.max(0, currentReputation - reputationPenalty)
          }
        } : {}),
        careerState: {
          ...state.careerState,
          ownedTeam: {
            ...state.careerState.ownedTeam,
            reputation: Math.max(0, currentReputation - reputationPenalty),
            finances: {
              ...state.careerState.ownedTeam.finances,
              declinedSponsorCooldowns: {
                ...existingCooldowns,
                [deal.sponsorId]: cooldownExpiryWeek
              }
            }
          }
        }
      }
    })
    
    declineTeamSponsorOffer(deal.id)
    const penaltyMsg = reputationPenalty > 0 ? ` Reputation -${reputationPenalty}.` : ''
    addToast({ title: 'Offer declined', description: `Sponsor offer has been declined.${penaltyMsg}`, variant: 'default' })
    onDecline()
  }

  const handleNegotiate = () => {
    const existing = activeNegotiations.find(
      (n) => n.sponsorId === deal.sponsorId && !['accepted', 'declined', 'expired', 'sponsor_withdrew'].includes(n.status)
    )
    if (existing && onNegotiate) {
      onNegotiate(existing)
      return
    }
    const negotiation = startTeamSponsorNegotiation(deal.sponsorId, deal.slot)
    if (negotiation && onNegotiate) {
      addToast({ title: 'Negotiation started', description: 'You can now discuss terms with the sponsor.', variant: 'success' })
      onNegotiate(negotiation)
    } else if (!negotiation) {
      addToast({ title: 'Cannot negotiate', description: 'Already in talks or requirements not met.', variant: 'warning' })
    }
  }

  // Estimated annual value
  const annualValue = (deal.monthlyPayment * 12) + (deal.winBonus * 3) + (deal.podiumBonus * 6) + ((deal as any).championshipBonus ?? 0)

  if (showAcceptConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-status-success/5 border border-status-success/30 rounded-xl space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-status-success/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-status-success" />
          </div>
          <h4 className="font-medium text-sm">Accept {deal.sponsorName}?</h4>
        </div>
        <div className="p-2 bg-background rounded-lg space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Slot</span>
            <span className="font-medium">{getSponsorSlotLabel(deal.slot)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Monthly</span>
            <span className="font-mono text-status-success">${deal.monthlyPayment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Duration</span>
            <span className="font-mono">{deal.duration} yr{deal.duration !== 1 ? 's' : ''}</span>
          </div>
          <div className="pt-1.5 border-t border-border flex justify-between">
            <span className="text-text-muted">Est. Annual</span>
            <span className="font-mono font-bold text-status-success">${annualValue.toLocaleString()}</span>
          </div>
          {canReplaceExistingSponsor && (
            <div className="pt-2 border-t border-status-danger/30 space-y-1.5">
              <p className="text-xs font-semibold text-status-danger">Replacing an active {getSponsorSlotLabel(deal.slot).toLowerCase()} triggers contract buyout penalties</p>
              {activeSponsorsInSlot.length > 1 ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted whitespace-nowrap">Replace sponsor</span>
                  <select
                    className="bg-surface border border-surface-border rounded px-2 py-1 text-xs flex-1"
                    value={selectedReplacementSponsor?.id || ''}
                    onChange={(e) => setSelectedReplacementSponsorId(e.target.value)}
                  >
                    {activeSponsorsInSlot.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sponsorName} (${s.monthlyPayment.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              ) : selectedReplacementSponsor ? (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Replacing sponsor</span>
                  <span className="font-medium">{selectedReplacementSponsor.sponsorName}</span>
                </div>
              ) : null}
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
            disabled={!canProceedAccept}
            onClick={() => { setShowAcceptConfirm(false); handleAccept() }}
          >
            <Handshake className="w-4 h-4 mr-1" />
            {canReplaceExistingSponsor ? 'Buy out & Replace' : 'Confirm'}
          </Button>
          <Button variant="ghost" onClick={() => setShowAcceptConfirm(false)}>Go Back</Button>
        </div>
        {!canProceedAccept && (
          <p className="text-xs text-status-warning">
            Slot is already full. Decline this offer or wait for an opening.
          </p>
        )}
      </motion.div>
    )
  }

  if (showDeclineConfirm) {
    const sponsorTier = sponsorData?.tier ?? 'mid'
    const repPenalty = getSponsorDeclinePenalty(sponsorTier)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-status-danger/5 border border-status-danger/30 rounded-xl space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-status-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-status-danger" />
          </div>
          <h4 className="font-medium text-sm">Decline {deal.sponsorName}?</h4>
        </div>
        <div className="p-2 bg-background rounded-lg space-y-1.5 text-sm">
          {repPenalty > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-status-danger" />
              <span className="text-text-muted">Reputation:</span>
              <span className="font-mono text-status-danger">-{repPenalty}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Ban className="w-3.5 h-3.5 text-status-warning" />
            <span className="text-text-muted">Cooldown: {DECLINE_COOLDOWN_WEEKS} weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-status-warning" />
            <span className="text-text-muted">Missed: ${deal.monthlyPayment.toLocaleString()}/mo</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 !text-status-danger !border-status-danger/30 hover:!bg-status-danger/10"
            onClick={() => { setShowDeclineConfirm(false); handleDecline() }}
          >
            <X className="w-4 h-4 mr-1" /> Confirm Decline
          </Button>
          <Button variant="secondary" onClick={() => setShowDeclineConfirm(false)}>Cancel</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          disabled={!canProceedAccept}
          onClick={() => {
            if (activeSponsorsInSlot.length > 0 && !selectedReplacementSponsorId) {
              setSelectedReplacementSponsorId(activeSponsorsInSlot[0].id)
            }
            setShowAcceptConfirm(true)
          }}
        >
          Accept
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setShowDeclineConfirm(true)}>
          Decline
        </Button>
      </div>
      {onNegotiate && (
        <Button variant="secondary" className="w-full" onClick={handleNegotiate}>
          Negotiate
        </Button>
      )}
      <Button variant="ghost" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

export interface TeamSponsorDetailViewProps {
  /** When from offer/active list */
  sponsor?: TeamSponsorDeal | null
  /** When from browse (no deal yet) */
  sponsorProfile?: Sponsor | null
  team?: OwnedTeam | null
  currentYear: number
  onClose: () => void
  onNegotiate?: (negotiation: SponsorNegotiation) => void
  /** When in browse mode, call with sponsor and optional slot to start negotiation */
  onApproach?: (sponsor: Sponsor, desiredSlot?: TeamSponsorSlot) => void
}

export function TeamSponsorDetailView({
  sponsor: sponsorDeal,
  sponsorProfile: sponsorProfileProp,
  team: teamProp,
  currentYear,
  onClose,
  onNegotiate,
  onApproach
}: TeamSponsorDetailViewProps) {
  const isBrowseMode = !!sponsorProfileProp && !sponsorDeal
  const sponsor = sponsorDeal
  const team = teamProp ?? useCareerStore((s) => s.careerState?.ownedTeam)
  const sponsorProfile = sponsorProfileProp ?? (sponsor ? (getSponsorById(sponsor.sponsorId) as Sponsor | null) : null)
  const yearsRemaining = sponsor ? (sponsor.startYear + sponsor.duration) - currentYear : 0
  const satisfactionStatus = sponsor ? getSponsorSatisfactionStatus(sponsor.satisfaction) : { label: '', color: '' }
  const logoSrc = sponsorProfile
    ? getSponsorLogo(sponsorProfile.id) || getSponsorLogoPath(sponsorProfile.id)
    : sponsor
      ? getSponsorLogo(sponsor.sponsorId) || getSponsorLogoPath(sponsor.sponsorId)
      : ''
  const displayName = sponsorProfile?.name ?? sponsor?.sponsorName ?? 'Sponsor'
  const interest = sponsorProfile && team ? calculateSponsorInterest(sponsorProfile, team) : null
  const priority = sponsorProfile ? getSponsorPriority(sponsorProfile) : null
  const expectations = sponsorProfile ? getDefaultExpectations(sponsorProfile) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <SponsorLogo
          src={logoSrc}
          name={displayName}
          height="lg"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-xl">{displayName}</h3>
          {sponsor && <p className="text-text-muted">{getSponsorSlotLabel(sponsor.slot)} Sponsor</p>}
          {sponsorProfile && (
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" size="sm">
                {sponsorProfile.tier}
              </Badge>
              <Badge variant="outline" size="sm">
                {SPONSOR_CATEGORIES[sponsorProfile.category]?.name ?? sponsorProfile.category}
              </Badge>
              <span className="text-xs text-text-muted">{sponsorProfile.country}</span>
            </div>
          )}
        </div>
        {!isBrowseMode && sponsor && (
          <Badge variant={sponsor.active ? 'green' : 'orange'} size="sm">
            {sponsor.active ? 'Active' : 'Pending'}
          </Badge>
        )}
      </div>
      {sponsorProfile && (
        <>
          {interest !== null && (
            <div className="p-4 bg-surface rounded-xl">
              <h4 className="font-medium mb-2">Interest in your team</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      interest >= 60 ? 'bg-status-success' : interest >= 40 ? 'bg-status-warning' : 'bg-status-danger'
                    }`}
                    style={{ width: `${Math.min(100, interest)}%` }}
                  />
                </div>
                <span className="text-sm font-mono">{interest}%</span>
              </div>
            </div>
          )}
          {(priority || expectations) && (
            <div className="p-4 bg-surface rounded-xl">
              <h4 className="font-medium mb-2">Priorities & expectations</h4>
              <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                {priority && (
                  <li>Primary: {priority.primary}, secondary: {priority.secondary ?? '—'}, weight: {priority.weight}/5</li>
                )}
                {expectations?.minSeasonPodiums != null && (
                  <li>Min. podiums per season: {expectations.minSeasonPodiums}</li>
                )}
                {expectations?.championshipTarget && (
                  <li>Championship target: {expectations.championshipTarget}</li>
                )}
                {expectations?.requiredShoutouts != null && (
                  <li>Required shoutouts: {expectations.requiredShoutouts}/season</li>
                )}
              </ul>
            </div>
          )}
          {sponsorProfile.requirements && (
            <div className="p-4 bg-surface rounded-xl">
              <h4 className="font-medium mb-2">Requirements</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {sponsorProfile.requirements.minReputation > 0 && (
                  <span className="text-text-muted">Min. reputation: {sponsorProfile.requirements.minReputation}</span>
                )}
                {sponsorProfile.requirements.minMarketability > 0 && (
                  <span className="text-text-muted">Min. marketability: {sponsorProfile.requirements.minMarketability}</span>
                )}
                {sponsorProfile.requirements.minWins != null && sponsorProfile.requirements.minWins > 0 && (
                  <span className="text-text-muted">Min. wins: {sponsorProfile.requirements.minWins}</span>
                )}
              </div>
            </div>
          )}
          {sponsorProfile.story && (
            <div className="p-4 bg-surface rounded-xl">
              <h4 className="font-medium mb-2">Background</h4>
              <p className="text-sm text-text-muted">{sponsorProfile.story}</p>
            </div>
          )}
        </>
      )}
      {sponsor && (
        <div className="p-4 bg-surface rounded-xl">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Sponsor Satisfaction</span>
            <span className={satisfactionStatus.color}>{satisfactionStatus.label}</span>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                sponsor.satisfaction >= 60 ? 'bg-status-success' :
                sponsor.satisfaction >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${sponsor.satisfaction}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">
            {sponsor.warningIssued && !sponsor.finalWarningIssued && '⚠️ Warning issued - improve performance'}
            {sponsor.finalWarningIssued && '❌ Final warning - contract at risk'}
          </p>
        </div>
      )}
      {sponsor && (
      <>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Monthly Payment</span>
          <p className="font-mono font-bold text-xl text-status-success">
            ${sponsor.monthlyPayment.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Contract Length</span>
          <p className="font-mono font-bold text-xl">
            {yearsRemaining} yr{yearsRemaining !== 1 ? 's' : ''} left
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Win Bonus</span>
          <p className="font-mono font-bold text-xl text-accent-gold">
            +${sponsor.winBonus.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <span className="text-text-muted text-sm">Podium Bonus</span>
          <p className="font-mono font-bold text-xl text-accent-blue">
            +${sponsor.podiumBonus.toLocaleString()}
          </p>
        </div>
        {sponsor.championshipBonus > 0 && (
          <div className="p-3 bg-background rounded-lg col-span-2">
            <span className="text-text-muted text-sm">Championship Bonus</span>
            <p className="font-mono font-bold text-xl text-purple-400">
              +${sponsor.championshipBonus.toLocaleString()}
            </p>
          </div>
        )}
      </div>
      <div className="p-4 bg-surface rounded-xl">
        <h4 className="font-medium mb-3">Season Performance</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-muted">Races</p>
            <p className="font-mono font-bold text-xl">{sponsor.seasonRaces}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Wins</p>
            <p className="font-mono font-bold text-xl text-accent-gold">{sponsor.seasonWins}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Podiums</p>
            <p className="font-mono font-bold text-xl text-accent-blue">{sponsor.seasonPodiums}</p>
          </div>
        </div>
      </div>
      {sponsor.targets.length > 0 && (
        <div className="p-4 bg-surface rounded-xl">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Contract Targets
          </h4>
          <div className="space-y-2">
            {sponsor.targets.map(target => (
              <div
                key={target.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  target.exceeded ? 'bg-status-success/20' :
                  target.met ? 'bg-status-info/20' : 'bg-background'
                }`}
              >
                <span className="text-sm">{target.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {target.currentValue}/{target.targetValue}
                  </span>
                  {target.exceeded ? (
                    <Badge variant="green" size="sm">Exceeded!</Badge>
                  ) : target.met ? (
                    <Badge variant="blue" size="sm">Complete</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-medium">Estimated Annual Value</span>
          <span className="font-mono font-bold text-2xl text-status-success">
            ${(sponsor.monthlyPayment * 12).toLocaleString()}
          </span>
        </div>
      </div>
      {!sponsor.active && (
        <TeamSponsorDetailActions
          deal={sponsor}
          onAccept={() => onClose()}
          onDecline={() => onClose()}
          onClose={onClose}
          onNegotiate={onNegotiate}
        />
      )}
      {sponsor.active && (
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
      </>
      )}
      {isBrowseMode && sponsorProfile && onApproach && team && (
        <BrowseApproachActions
          team={team}
          sponsorProfile={sponsorProfile}
          onApproach={onApproach}
          onClose={onClose}
        />
      )}
    </div>
  )
}
