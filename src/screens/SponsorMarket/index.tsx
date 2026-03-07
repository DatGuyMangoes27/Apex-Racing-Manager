/**
 * Sponsor Market Screen (team-only)
 *
 * View active team sponsors, pending offers, seek by slot, and browse all sponsors.
 * Requires an owned team; shows empty state otherwise.
 */

import { useState, useMemo, useEffect } from 'react'
import { Building2, Search, Loader2, Handshake, Clock, MessageSquare, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import {
  TeamSponsorsContent,
  TeamSponsorDetailView
} from '@/components/finances/TeamSponsorsContent'
import { NegotiationModal } from '@/components/sponsors'
import type { TeamSponsorDeal, SponsorNegotiation, NegotiationStatus, OwnedTeam, TeamSponsorSlot } from '@/store/careerStore'
import { getSponsors, getSponsorCategories, getSponsorLogoPath, isContentLoaded, ensureContentLoaded } from '@/services/preGeneratedContentService'
import { getSponsorLogo } from '@/utils/generated-assets'
import { calculateSponsorInterest } from '@/simulation/sponsors'
import { getSponsorSlotLabel } from '@/simulation/finances/teamSponsors'
import { SPONSOR_CATEGORIES } from '@/data/sponsors'
import type { Sponsor, SponsorTier, SponsorCategory } from '@/data/sponsors'
import { useToast } from '@/components/ui'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

const TIER_OPTIONS: { value: '' | SponsorTier; label: string }[] = [
  { value: '', label: 'All tiers' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' },
  { value: 'elite', label: 'Elite' }
]

function SponsorMarket() {
  const { careerState, startTeamSponsorNegotiation } = useCareerStore()
  const preGenContentLoaded = useCareerStore((s) => s.preGenContentLoaded)
  const { addToast } = useToast()
  const [selectedSponsor, setSelectedSponsor] = useState<TeamSponsorDeal | null>(null)
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [negotiationForModal, setNegotiationForModal] = useState<SponsorNegotiation | null>(null)
  const [selectedBrowseSponsor, setSelectedBrowseSponsor] = useState<Sponsor | null>(null)
  const [browseTier, setBrowseTier] = useState<'' | SponsorTier>('')
  const [browseCategory, setBrowseCategory] = useState<SponsorCategory | ''>('')
  const [contentReloadKey, setContentReloadKey] = useState(0)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [activeTab, setActiveTab] = useState<'offers' | 'negotiations' | 'browse'>('offers')

  useEffect(() => {
    if (!isContentLoaded()) {
      setIsLoadingContent(true)
      ensureContentLoaded().then((success) => {
        setIsLoadingContent(false)
        if (success) {
          setContentReloadKey((k) => k + 1)
          if (!preGenContentLoaded) {
            useCareerStore.setState({ preGenContentLoaded: true })
          }
        }
      })
    }
  }, [preGenContentLoaded])

  if (!careerState) return null

  const ownedTeam = careerState.ownedTeam

  if (!ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="p-[24px] flex flex-col gap-[24px]">
          <div className="flex items-center gap-[12px]">
            <Building2 className="w-[28px] h-[28px] text-[#0a0a0a]" />
            <div>
              <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Sponsors</h1>
              <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>Team sponsorship deals and offers</p>
            </div>
          </div>
          <div className={`${CARD} p-[64px] text-center`}>
            <Building2 className="w-[64px] h-[64px] mx-auto mb-[16px] text-[#4a5565] opacity-60" />
            <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No team yet</h3>
            <p className="text-[14px] text-[#4a5565] max-w-[480px] mx-auto" style={FR}>
              Start or join a team to seek sponsors. Sponsor deals are for your team, not personal driver deals.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const reputation = ownedTeam.reputation ?? 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allSponsors = useMemo(() => getSponsors(), [preGenContentLoaded, contentReloadKey])
  const currentSponsorIds = new Set((ownedTeam.finances?.sponsors ?? []).map((s) => s.sponsorId))
  const browseSponsors = useMemo(() => {
    return allSponsors
      .filter((s) => !currentSponsorIds.has(s.id))
      .filter((s) => {
        const vis = s.visibility ?? 'always'
        if (vis === 'approach_only') return false
        return true
      })
      .filter((s) => !browseTier || s.tier === browseTier)
      .filter((s) => !browseCategory || s.category === browseCategory)
      .sort((a, b) => {
        const tierOrder = { entry: 0, mid: 1, high: 2, elite: 3 }
        return (tierOrder[a.tier] ?? 0) - (tierOrder[b.tier] ?? 0)
      })
  }, [allSponsors, currentSponsorIds, reputation, browseTier, browseCategory])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => getSponsorCategories(), [preGenContentLoaded, contentReloadKey])

  const activeNegCount = (ownedTeam.finances?.activeNegotiations ?? []).filter(
    n => !['accepted', 'declined', 'sponsor_withdrew', 'expired'].includes(n.status)
  ).length

  const handleApproach = (sponsor: Sponsor, desiredSlot?: TeamSponsorSlot) => {
    const neg = startTeamSponsorNegotiation(sponsor.id, desiredSlot)
    if (neg) {
      addToast({ message: `Approach sent to ${sponsor.name}. Check your inbox after advancing the week for their response.`, type: 'success' })
      setNegotiationForModal(neg)
      setSelectedBrowseSponsor(null)
    } else {
      addToast({ message: 'Cannot approach: already in talks or requirements not met.', type: 'warning' })
    }
  }

  const tabs = [
    { id: 'offers' as const, label: 'Offers & active' },
    { id: 'negotiations' as const, label: 'Negotiations', badge: activeNegCount > 0 ? activeNegCount : null },
    { id: 'browse' as const, label: 'Browse all sponsors' },
  ]

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        <div className="flex items-center gap-[12px]">
          <Building2 className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Sponsors</h1>
            <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>Team sponsorship deals, pending offers, and seek new partners by slot</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-[4px] border-b border-black/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-[8px] px-[16px] py-[10px] text-[14px] border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-[#0a0a0a]'
                  : 'border-transparent text-[#4a5565] hover:text-[#0a0a0a]'
              }`}
              style={activeTab === tab.id ? FBold : FR}
            >
              {tab.label}
              {tab.badge && (
                <span className="bg-[#3b82f6] text-white text-[11px] px-[6px] py-[1px] rounded-[6px]" style={FR}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'offers' && (
          <TeamSponsorsContent
            team={ownedTeam}
            currentYear={careerState.currentYear}
            onSelectSponsor={(sponsor) => {
              setSelectedSponsor(sponsor)
              setShowSponsorModal(true)
            }}
            onNegotiate={(negotiation) => {
              setNegotiationForModal(negotiation)
            }}
          />
        )}

        {activeTab === 'negotiations' && (
          <NegotiationsTab
            negotiations={ownedTeam.finances?.activeNegotiations ?? []}
            currentWeek={careerState.currentWeek}
            currentYear={careerState.currentYear}
            onOpenNegotiation={(neg) => setNegotiationForModal(neg)}
          />
        )}

        {activeTab === 'browse' && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[14px] text-[#4a5565]" style={FR}>
              Start with entry and mid-tier sponsors; high and elite sponsors unlock as your team reputation grows.
            </p>
            <div className={`${CARD} p-[16px]`}>
              <div className="flex flex-wrap gap-[16px] items-center">
                <div className="flex items-center gap-[8px]">
                  <span className="text-[14px] text-[#4a5565]" style={FR}>Tier</span>
                  <select
                    className="bg-white border-[0.8px] border-black/20 rounded-[8px] px-[8px] py-[6px] text-[14px] outline-none"
                    style={FR}
                    value={browseTier}
                    onChange={(e) => setBrowseTier((e.target.value || '') as '' | SponsorTier)}
                  >
                    {TIER_OPTIONS.map((o) => (
                      <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[14px] text-[#4a5565]" style={FR}>Category</span>
                  <select
                    className="bg-white border-[0.8px] border-black/20 rounded-[8px] px-[8px] py-[6px] text-[14px] outline-none"
                    style={FR}
                    value={browseCategory}
                    onChange={(e) => setBrowseCategory((e.target.value || '') as SponsorCategory | '')}
                  >
                    <option value="">All</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{SPONSOR_CATEGORIES[cat]?.name ?? cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className={`${CARD} p-[16px]`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[16px]">
                {browseSponsors.map((s) => {
                  const vis = s.visibility ?? 'always'
                  const unlockRep = s.unlockReputation ?? 0
                  const isLocked = vis === 'unlock_after_reputation' && reputation < unlockRep
                  return (
                    <BrowseSponsorCard
                      key={s.id}
                      sponsor={s}
                      team={ownedTeam}
                      isLocked={isLocked}
                      unlockAtReputation={isLocked ? unlockRep : undefined}
                      onClick={() => !isLocked && setSelectedBrowseSponsor(s)}
                    />
                  )
                })}
              </div>
              {browseSponsors.length === 0 && isLoadingContent && (
                <div className="text-center py-[48px] text-[#4a5565]">
                  <Loader2 className="w-[48px] h-[48px] mx-auto mb-[8px] opacity-50 animate-spin" />
                  <p className="text-[14px]" style={FR}>Loading sponsor database...</p>
                </div>
              )}
              {browseSponsors.length === 0 && !isLoadingContent && (
                <div className="text-center py-[48px] text-[#4a5565]">
                  <Search className="w-[48px] h-[48px] mx-auto mb-[8px] opacity-50" />
                  <p className="text-[14px]" style={FR}>No sponsors match the filters or you already have deals with all visible sponsors.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sponsor Detail Modal */}
      {showSponsorModal && selectedSponsor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowSponsorModal(false); setSelectedSponsor(null) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-[24px]">
              <TeamSponsorDetailView
                sponsor={selectedSponsor}
                currentYear={careerState.currentYear}
                onClose={() => { setShowSponsorModal(false); setSelectedSponsor(null) }}
                onNegotiate={(negotiation) => { setNegotiationForModal(negotiation); setShowSponsorModal(false); setSelectedSponsor(null) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Browse Sponsor Detail Modal */}
      {selectedBrowseSponsor && ownedTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setSelectedBrowseSponsor(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-[24px]">
              <TeamSponsorDetailView
                sponsorProfile={selectedBrowseSponsor}
                team={ownedTeam}
                currentYear={careerState.currentYear}
                onClose={() => setSelectedBrowseSponsor(null)}
                onApproach={handleApproach}
              />
            </div>
          </div>
        </div>
      )}

      {ownedTeam && negotiationForModal && (
        <NegotiationModal
          isOpen={!!negotiationForModal}
          onClose={() => setNegotiationForModal(null)}
          negotiation={negotiationForModal}
          team={ownedTeam}
        />
      )}
    </div>
  )
}

// ============================================
// Negotiation status helpers
// ============================================
const NEGOTIATION_STATUS_CONFIG: Record<NegotiationStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Clock
  description: string
}> = {
  outreach_sent: {
    label: 'Outreach sent',
    color: 'text-[#3b82f6]',
    bgColor: 'bg-[#eff6ff]',
    icon: MessageSquare,
    description: 'Waiting for the sponsor to acknowledge your approach'
  },
  pending_response: {
    label: 'Awaiting reply',
    color: 'text-[#f59e0b]',
    bgColor: 'bg-[#fffbeb]',
    icon: Clock,
    description: 'The sponsor is reviewing — expect a reply soon'
  },
  reviewing_offer: {
    label: 'Action needed',
    color: 'text-[#00a63e]',
    bgColor: 'bg-[#f0fdf4]',
    icon: Handshake,
    description: 'The sponsor sent an offer — review and respond'
  },
  counter_pending: {
    label: 'Counter sent',
    color: 'text-[#f59e0b]',
    bgColor: 'bg-[#fffbeb]',
    icon: Clock,
    description: 'You sent a counter-offer — waiting for their response'
  },
  accepted: {
    label: 'Accepted',
    color: 'text-[#00a63e]',
    bgColor: 'bg-[#f0fdf4]',
    icon: CheckCircle2,
    description: 'Deal finalised'
  },
  declined: {
    label: 'Declined',
    color: 'text-[#ef4444]',
    bgColor: 'bg-[#fef2f2]',
    icon: XCircle,
    description: 'You declined the offer'
  },
  sponsor_withdrew: {
    label: 'Withdrawn',
    color: 'text-[#ef4444]',
    bgColor: 'bg-[#fef2f2]',
    icon: XCircle,
    description: 'The sponsor walked away from talks'
  },
  expired: {
    label: 'Expired',
    color: 'text-[#4a5565]',
    bgColor: 'bg-[#f9fafb]',
    icon: AlertTriangle,
    description: 'Negotiation timed out'
  }
}

function NegotiationsTab({
  negotiations,
  currentWeek,
  currentYear,
  onOpenNegotiation
}: {
  negotiations: SponsorNegotiation[]
  currentWeek: number
  currentYear: number
  onOpenNegotiation: (neg: SponsorNegotiation) => void
}) {
  const activeStatuses: NegotiationStatus[] = ['outreach_sent', 'pending_response', 'reviewing_offer', 'counter_pending']
  const active = negotiations.filter(n => activeStatuses.includes(n.status))
  const finished = negotiations.filter(n => !activeStatuses.includes(n.status))
  const reviewableOffers = active.filter((n) => n.status === 'reviewing_offer' && !!n.currentOffer)

  const sorted = [...active].sort((a, b) => {
    if (a.status === 'reviewing_offer' && b.status !== 'reviewing_offer') return -1
    if (b.status === 'reviewing_offer' && a.status !== 'reviewing_offer') return 1
    const aWeek = a.lastActivityYear * 52 + a.lastActivityWeek
    const bWeek = b.lastActivityYear * 52 + b.lastActivityWeek
    return bWeek - aWeek
  })

  const slotOrder: TeamSponsorSlot[] = ['title', 'primary', 'secondary', 'associate']
  const groupedReviewable = slotOrder
    .map((slot) => ({
      slot,
      offers: reviewableOffers
        .filter((n) => n.currentOffer.slot === slot)
        .sort((a, b) => b.currentOffer.monthlyPayment - a.currentOffer.monthlyPayment)
    }))
    .filter((group) => group.offers.length > 0)

  if (negotiations.length === 0) {
    return (
      <div className={`${CARD} p-[64px] text-center`}>
        <Handshake className="w-[64px] h-[64px] mx-auto mb-[16px] text-[#4a5565] opacity-60" />
        <h3 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No negotiations</h3>
        <p className="text-[14px] text-[#4a5565] max-w-[480px] mx-auto" style={FR}>
          Approach a sponsor from the Browse tab to start a negotiation. Active talks will appear here so you can track who still needs to reply.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {groupedReviewable.length > 0 && (
        <div className={`${CARD} p-[16px]`}>
          <h3 className="text-[14px] text-[#0a0a0a] mb-[12px]" style={FBold}>Offer comparison by slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[12px]">
            {groupedReviewable.map((group) => (
              <div key={group.slot} className={INNER}>
                <div className="flex items-center justify-between mb-[8px]">
                  <p className="text-[12px] uppercase tracking-wide text-[#4a5565]" style={FBold}>{getSponsorSlotLabel(group.slot)}</p>
                  <span className="text-[12px] text-[#4a5565] border-[0.8px] border-black/10 rounded-[6px] px-[6px] py-[1px]" style={FR}>{group.offers.length}</span>
                </div>
                <div className="flex flex-col gap-[8px]">
                  {group.offers.map((neg) => (
                    <button
                      key={neg.id}
                      type="button"
                      className="w-full text-left rounded-[8px] border-[0.8px] border-black/10 px-[8px] py-[6px] hover:border-black/30 transition-colors"
                      onClick={() => onOpenNegotiation(neg)}
                    >
                      <p className="text-[14px] text-[#0a0a0a] truncate" style={FBold}>{neg.sponsorName}</p>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>
                        ${(neg.currentOffer.monthlyPayment / 1000).toFixed(0)}k/mo | +${(neg.currentOffer.winBonus / 1000).toFixed(0)}k win
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div>
          <h3 className="text-[13px] text-[#4a5565] uppercase tracking-wider mb-[12px]" style={FBold}>
            In Progress ({sorted.length})
          </h3>
          <div className="flex flex-col gap-[12px]">
            {sorted.map(neg => (
              <NegotiationRow
                key={neg.id}
                negotiation={neg}
                currentWeek={currentWeek}
                currentYear={currentYear}
                onClick={() => onOpenNegotiation(neg)}
              />
            ))}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div>
          <h3 className="text-[13px] text-[#4a5565] uppercase tracking-wider mb-[12px]" style={FBold}>
            Completed ({finished.length})
          </h3>
          <div className="flex flex-col gap-[12px] opacity-60">
            {finished.map(neg => (
              <NegotiationRow
                key={neg.id}
                negotiation={neg}
                currentWeek={currentWeek}
                currentYear={currentYear}
                onClick={() => onOpenNegotiation(neg)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NegotiationRow({
  negotiation,
  currentWeek,
  currentYear,
  onClick
}: {
  negotiation: SponsorNegotiation
  currentWeek: number
  currentYear: number
  onClick: () => void
}) {
  const config = NEGOTIATION_STATUS_CONFIG[negotiation.status]
  const StatusIcon = config.icon
  const logoSrc = getSponsorLogo(negotiation.sponsorId) || getSponsorLogoPath(negotiation.sponsorId)

  const weeksAgo = (currentYear * 52 + currentWeek) - (negotiation.startedYear * 52 + negotiation.startedWeek)

  const isWaiting = negotiation.status === 'outreach_sent' || negotiation.status === 'pending_response' || negotiation.status === 'counter_pending'
  let responseIn: string | null = null
  if (isWaiting && negotiation.nextResponseWeek) {
    const currentAbs = (currentYear - 1) * 52 + currentWeek
    const diff = negotiation.nextResponseWeek - currentAbs
    if (diff > 0) {
      responseIn = diff === 1 ? 'next week' : `in ~${diff} weeks`
    } else {
      responseIn = 'any day now'
    }
  }

  const offer = negotiation.currentOffer
  const monthlyStr = offer ? `$${(offer.monthlyPayment / 1000).toFixed(0)}k/mo` : ''
  const roundStr = `Round ${negotiation.rounds.length}/${negotiation.maxRounds}`

  return (
    <div
      className={`${CARD} p-[16px] cursor-pointer hover:shadow-sm transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center gap-[16px]">
        {/* Logo */}
        <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 flex items-center justify-center overflow-hidden shrink-0">
          <img src={logoSrc} alt={negotiation.sponsorName} className="w-full h-full object-contain p-[4px]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] mb-[4px]">
            <h4 className="text-[14px] text-[#0a0a0a] truncate" style={FBold}>{negotiation.sponsorName}</h4>
            <span className={`${config.bgColor} ${config.color} flex items-center gap-[4px] px-[8px] py-[2px] rounded-[8px] text-[12px] shrink-0`} style={FR}>
              <StatusIcon className="w-[12px] h-[12px]" />
              {config.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[4px] text-[12px] text-[#4a5565]" style={FR}>
            <span className="capitalize">{negotiation.sponsorTier} tier</span>
            <span>{roundStr}</span>
            {monthlyStr && <span>{monthlyStr}</span>}
            <span>Slot: {negotiation.currentOffer?.slot ?? '—'}</span>
            <span>Started {weeksAgo === 0 ? 'this week' : weeksAgo === 1 ? 'last week' : `${weeksAgo} weeks ago`}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="text-right shrink-0">
          {negotiation.status === 'reviewing_offer' && (
            <div className="flex items-center gap-[6px] text-[#00a63e] text-[14px]" style={FBold}>
              <Handshake className="w-[16px] h-[16px]" />
              <span>Review offer</span>
            </div>
          )}
          {isWaiting && responseIn && (
            <div className="flex items-center gap-[6px] text-[#4a5565] text-[14px]" style={FR}>
              <Clock className="w-[16px] h-[16px]" />
              <span>Reply {responseIn}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BrowseSponsorCard({
  sponsor,
  team,
  isLocked,
  unlockAtReputation,
  onClick
}: {
  sponsor: Sponsor
  team: OwnedTeam
  isLocked?: boolean
  unlockAtReputation?: number
  onClick: () => void
}) {
  const logoSrc = getSponsorLogo(sponsor.id) || getSponsorLogoPath(sponsor.id)
  const interest = !isLocked ? calculateSponsorInterest(sponsor, team) : 0
  const categoryLabel = SPONSOR_CATEGORIES[sponsor.category]?.name ?? sponsor.category
  const subtitle = `${sponsor.tier} · ${categoryLabel}`

  return (
    <div
      className={`${CARD} p-[16px] transition-colors ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
      onClick={isLocked ? undefined : onClick}
    >
      <div className="flex items-start justify-between mb-[12px]">
        <div className="flex items-center gap-[12px]">
          <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f9fafb] border-[0.8px] border-black/10 flex items-center justify-center overflow-hidden shrink-0">
            <img src={logoSrc} alt={sponsor.name} className="w-full h-full object-contain p-[2px]" />
          </div>
          <div>
            <h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>{sponsor.name}</h4>
            <p className="text-[12px] text-[#4a5565]" style={FR}>{subtitle}</p>
          </div>
        </div>
        {unlockAtReputation != null && (
          <span className="bg-[#fffbeb] text-[#f59e0b] px-[8px] py-[2px] rounded-[8px] text-[11px]" style={FR}>
            Unlocks at rep. {unlockAtReputation}
          </span>
        )}
      </div>
      <div className="flex items-center gap-[8px] mb-[8px] text-[12px]" style={FR}>
        <span className="text-[#4a5565]">Interest:</span>
        <div className="flex-1 h-[6px] bg-[#f3f4f6] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              interest >= 60 ? 'bg-[#00a63e]' : interest >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
            }`}
            style={{ width: `${Math.min(100, interest)}%` }}
          />
        </div>
        <span className="text-[#0a0a0a]">{interest}%</span>
      </div>
      <p className="text-[12px] text-[#4a5565] text-center mb-[12px]" style={FR}>
        Approach to negotiate terms
      </p>
      {!isLocked && (
        <button
          className="w-full border-[0.8px] border-black/20 rounded-[12px] py-[8px] text-[13px] hover:bg-black/5 transition-colors"
          style={FR}
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          View
        </button>
      )}
    </div>
  )
}

export default SponsorMarket
