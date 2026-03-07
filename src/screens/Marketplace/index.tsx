import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Car, DollarSign, Wrench, Clock, History, Filter, Star,
  AlertCircle, Gavel, Tag, Shield, Gauge, Settings, FileText, Award,
  Building2, Flag, Trophy, RefreshCw, Check, X, ChevronRight, ChevronDown,
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { getManufacturerLogo } from '@/utils/generated-assets'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { MarketplaceListing, FavorTier, CarCondition } from '@/simulation/marketplace'
import { AMS2_CAR_CLASSES } from '@/data/ams2-cars'
import { getManufacturer } from '@/data/manufacturers'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { routeNotification } from '@/services/notificationRouter'

// ============================================
// FIGMA-EXACT MARKETPLACE
// White theme · black borders · Arial Black
// ============================================

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

type ListingTypeTab = 'new' | 'used' | 'auction'
type ConditionFilter = 'all' | CarCondition
type SortOption = 'price-asc' | 'price-desc' | 'condition' | 'performance' | 'reliability'

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${n.toLocaleString()}`
  return `$${n}`
}
function fmtMi(m: number): string {
  if (m >= 1_000_000) return `${(m / 1_000_000).toFixed(1)}M km`
  if (m >= 1_000) return `${(m / 1_000).toFixed(0)}K km`
  return `${m} km`
}
function timeLeft(endW: number, endY: number, cW: number, cY: number): string {
  const w = (endY - cY) * 52 + (endW - cW)
  if (w <= 0) return 'Ended'
  if (w < 4) return `${w}w`
  return `${Math.floor(w / 4)}mo`
}
const condColor: Record<CarCondition, string> = {
  excellent: '#00a63e', good: '#0a0a0a', fair: '#f59e0b', project: '#ef4444',
}

// ── Wear Bar ──────────────────────────────────────────────────
function WearBar({ label, value }: { label: string; value: number }) {
  const c = value >= 80 ? '#ef4444' : value >= 60 ? '#f59e0b' : value >= 40 ? '#eab308' : '#00a63e'
  return (
    <div className="flex items-center gap-[8px]">
      <span className="text-[11px] text-[#4a5565] w-[80px] shrink-0" style={FR}>{label}</span>
      <div className="flex-1 h-[6px] bg-[#f3f4f6] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: c }} />
      </div>
      <span className="text-[11px] text-[#0a0a0a] w-[32px] text-right" style={FBold}>{value}%</span>
    </div>
  )
}

// ── Listing Card ──────────────────────────────────────────────
function ListingCard({ listing, cW, cY, onSelect, canAfford }: {
  listing: MarketplaceListing; cW: number; cY: number; onSelect: () => void; canAfford: boolean
}) {
  const isAuction = listing.listingType === 'auction'
  return (
    <div
      className={`${CARD} cursor-pointer hover:border-black transition-colors`}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-[140px] bg-[#f3f4f6]">
        {listing.liveryPath ? (
          <img src={listing.liveryPath} alt={listing.liveryName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-[40px] h-[40px] text-[#d1d5dc]" />
          </div>
        )}
        <div className="absolute top-[10px] left-[10px] flex gap-[6px]">
          <span
            className="text-[9px] text-white px-[8px] py-[3px] rounded-full"
            style={{ ...FB, background: condColor[listing.condition] }}
          >
            {listing.condition.toUpperCase()}
          </span>
          {isAuction && (
            <span className="text-[9px] text-white bg-[#ef4444] px-[8px] py-[3px] rounded-full" style={FB}>
              AUCTION
            </span>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="p-[16px]">
        <p className="text-[13px] text-[#0a0a0a] leading-[20px] truncate mb-[4px]" style={FB}>
          {listing.carClassName}
        </p>
        <div className="flex items-center gap-[12px] text-[11px] text-[#4a5565] mb-[12px]" style={FR}>
          <span>Perf {listing.performance}</span>
          <span>Rel {listing.reliability}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[18px] text-[#0a0a0a] leading-[24px]" style={FB}>{fmt(listing.currentPrice)}</span>
          {!canAfford && (
            <span className="text-[9px] text-[#ef4444] border-[0.8px] border-[#ef4444] rounded-full px-[8px] py-[2px]" style={FB}>
              OVER BUDGET
            </span>
          )}
          {isAuction && listing.auctionEndWeek && (
            <span className="text-[10px] text-[#4a5565]" style={FR}>
              {timeLeft(listing.auctionEndWeek, listing.auctionEndYear || cY, cW, cY)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Overlay Modal Shell ──────────────────────────────────────
function Overlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[24px] border-[0.8px] border-black/20 max-h-[90vh] overflow-y-auto w-[900px] max-w-[95vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ── Car Details Modal ──────────────────────────────────────────
function CarDetailsModal({ listing, isOpen, onClose, onPurchase, onBid, canAfford, teamBudget, cW, cY, mfgRel }: {
  listing: MarketplaceListing; isOpen: boolean; onClose: () => void; onPurchase: () => void
  onBid: (amount: number) => void; canAfford: boolean; teamBudget: number; cW: number; cY: number
  mfgRel: { favor: number; tier: FavorTier; carDiscount: number; partsDiscount: number } | null
}) {
  const [bidAmount, setBidAmount] = useState(listing.currentBid ? Math.ceil(listing.currentBid * 1.1) : listing.minimumBid || 0)
  const mfgId = listing.manufacturerId?.toLowerCase().replace(/\s+/g, '-') || ''
  const mfg = getManufacturer(mfgId)
  const allSeries = useRivalStore((s) => s.series)
  const compatSeries = useMemo(
    () => allSeries.filter((s) => s.carClassId === listing.carClassId || s.carClassIds?.includes(listing.carClassId)),
    [listing.carClassId, allSeries]
  )
  const isAuction = listing.listingType === 'auction'
  const minBid = listing.currentBid ? listing.currentBid + Math.max(1000, Math.round(listing.currentBid * 0.05)) : listing.minimumBid || 0
  const canBid = bidAmount >= minBid && bidAmount <= teamBudget

  return (
    <Overlay open={isOpen} onClose={onClose}>
      <div className="p-[32px] flex flex-col gap-[24px]">
        {/* Hero */}
        <div className="relative h-[200px] bg-[#f3f4f6] rounded-[16px] overflow-hidden">
          {listing.liveryPath ? (
            <img src={listing.liveryPath} alt={listing.liveryName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-[64px] h-[64px] text-[#d1d5dc]" />
            </div>
          )}
          <div className="absolute top-[16px] left-[16px] flex gap-[8px]">
            <span className="text-[10px] text-white bg-black px-[10px] py-[4px] rounded-full" style={FB}>
              {listing.listingType.toUpperCase()}
            </span>
            <span className="text-[10px] text-white px-[10px] py-[4px] rounded-full" style={{ ...FB, background: condColor[listing.condition] }}>
              {listing.condition.toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} className="absolute top-[16px] right-[16px] bg-white/90 w-[32px] h-[32px] rounded-full flex items-center justify-center">
            <X className="w-[16px] h-[16px] text-black" />
          </button>
        </div>

        <h2 className="text-[24px] text-[#0a0a0a] leading-[32px]" style={FB}>{listing.carClassName}</h2>

        {/* Two columns */}
        <div className="flex gap-[24px]">
          {/* Left: Stats & Wear */}
          <div className="flex-1 flex flex-col gap-[16px]">
            <div className="flex gap-[12px]">
              <div className="flex-1 bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[4px]" style={FR}>PERFORMANCE</p>
                <p className="text-[24px] text-[#0a0a0a]" style={FB}>{listing.performance}</p>
              </div>
              <div className="flex-1 bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[4px]" style={FR}>RELIABILITY</p>
                <p className="text-[24px] text-[#0a0a0a]" style={FB}>{listing.reliability}%</p>
              </div>
              {listing.listingType !== 'new' && (
                <div className="flex-1 bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                  <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[4px]" style={FR}>MILEAGE</p>
                  <p className="text-[18px] text-[#0a0a0a]" style={FB}>{fmtMi(listing.mileage)}</p>
                </div>
              )}
            </div>
            <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px] flex flex-col gap-[8px]">
              <p className="text-[12px] text-[#0a0a0a] mb-[4px]" style={FB}>PART CONDITION</p>
              <WearBar label="Engine" value={listing.partWear.engine} />
              <WearBar label="Chassis" value={listing.partWear.chassis} />
              <WearBar label="Gearbox" value={listing.partWear.gearbox} />
              <WearBar label="Brakes" value={listing.partWear.brakes} />
              <WearBar label="Suspension" value={listing.partWear.suspension} />
            </div>
            {listing.installedUpgrades.length > 0 && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[12px] text-[#0a0a0a] mb-[10px]" style={FB}>UPGRADES</p>
                {listing.installedUpgrades.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-[6px] border-b-[0.8px] border-black/5 last:border-0">
                    <div>
                      <p className="text-[12px] text-[#0a0a0a]" style={FBold}>{u.name}</p>
                      <p className="text-[10px] text-[#4a5565] capitalize" style={FR}>{u.type}</p>
                    </div>
                    <span className="text-[11px] text-[#00a63e]" style={FB}>+{u.effect}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: History, Price, Series, Manufacturer */}
          <div className="flex-1 flex flex-col gap-[16px]">
            {listing.provenance && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[12px] text-[#0a0a0a] mb-[10px]" style={FB}>HISTORY</p>
                <div className="flex flex-col gap-[6px] text-[12px]" style={FR}>
                  <div className="flex justify-between">
                    <span className="text-[#4a5565]">Previous Owners</span>
                    <span className="text-[#0a0a0a]" style={FBold}>{listing.provenance.previousOwners}</span>
                  </div>
                  {listing.provenance.raceHistory && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#4a5565]">Races</span>
                        <span className="text-[#0a0a0a]" style={FBold}>{listing.provenance.raceHistory.races}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4a5565]">Wins / Podiums</span>
                        <span className="text-[#0a0a0a]" style={FBold}>{listing.provenance.raceHistory.wins} / {listing.provenance.raceHistory.podiums}</span>
                      </div>
                    </>
                  )}
                  {listing.provenance.accidentHistory != null && listing.provenance.accidentHistory > 0 && (
                    <div className="flex items-center gap-[6px] text-[#ef4444] pt-[4px]">
                      <AlertCircle className="w-[12px] h-[12px]" />
                      <span>{listing.provenance.accidentHistory} accident{listing.provenance.accidentHistory > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {listing.priceBreakdown && listing.listingType !== 'new' && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[12px] text-[#0a0a0a] mb-[10px]" style={FB}>PRICE BREAKDOWN</p>
                <div className="flex flex-col gap-[4px] text-[12px]" style={FR}>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Base MSRP</span><span>{fmt(listing.priceBreakdown.base)}</span></div>
                  {listing.priceBreakdown.wearDiscount !== 0 && <div className="flex justify-between text-[#ef4444]"><span>Wear</span><span>{fmt(listing.priceBreakdown.wearDiscount)}</span></div>}
                  {listing.priceBreakdown.mileageDiscount !== 0 && <div className="flex justify-between text-[#ef4444]"><span>Mileage</span><span>{fmt(listing.priceBreakdown.mileageDiscount)}</span></div>}
                  {listing.priceBreakdown.upgradeValue > 0 && <div className="flex justify-between text-[#00a63e]"><span>Upgrades</span><span>+{fmt(listing.priceBreakdown.upgradeValue)}</span></div>}
                  <div className="flex justify-between border-t-[0.8px] border-black/10 pt-[6px] mt-[4px]">
                    <span style={FB}>Final Price</span><span style={FB}>{fmt(listing.currentPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            {compatSeries.length > 0 && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[12px] text-[#0a0a0a] mb-[10px]" style={FB}>COMPATIBLE SERIES</p>
                {compatSeries.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-[5px] border-b-[0.8px] border-black/5 last:border-0">
                    <span className="text-[12px] text-[#0a0a0a]" style={FBold}>{s.name}</span>
                    <span className="text-[10px] text-[#4a5565] capitalize" style={FR}>{s.tier}</span>
                  </div>
                ))}
                {compatSeries.length > 4 && <p className="text-[10px] text-[#4a5565] mt-[4px]" style={FR}>+{compatSeries.length - 4} more</p>}
              </div>
            )}

            {mfg && (
              <div className="bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
                <p className="text-[12px] text-[#0a0a0a] mb-[8px]" style={FB}>{mfg.name.toUpperCase()}</p>
                <div className="flex flex-col gap-[4px] text-[11px]" style={FR}>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Country</span><span>{mfg.country}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Tier</span><span className="capitalize" style={FB}>{mfg.tier}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Support</span><span style={{ color: mfg.supportQuality >= 80 ? '#00a63e' : '#f59e0b' }}>{mfg.supportQuality}%</span></div>
                  {mfgRel && mfgRel.carDiscount > 0 && (
                    <div className="flex justify-between text-[#00a63e]"><span>Your Discount</span><span style={FB}>-{Math.round(mfgRel.carDiscount * 100)}%</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t-[0.8px] border-black/10 pt-[20px]">
          {isAuction ? (
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#4a5565] tracking-[0.5px]" style={FR}>CURRENT BID</p>
                  <p className="text-[24px] text-[#0a0a0a]" style={FB}>{listing.currentBid ? fmt(listing.currentBid) : fmt(listing.minimumBid || 0)}</p>
                  <p className="text-[11px] text-[#4a5565]" style={FR}>
                    {listing.bidCount || 0} bids | Ends {timeLeft(listing.auctionEndWeek!, listing.auctionEndYear!, cW, cY)}
                  </p>
                </div>
                {listing.playerBid !== undefined && (
                  <div className="text-right">
                    <p className="text-[10px] text-[#4a5565]" style={FR}>YOUR BID</p>
                    <p className="text-[20px]" style={{ ...FB, color: listing.playerBid >= (listing.currentBid || 0) ? '#00a63e' : '#ef4444' }}>
                      {fmt(listing.playerBid)}
                    </p>
                    <p className="text-[11px]" style={{ color: listing.playerBid >= (listing.currentBid || 0) ? '#00a63e' : '#ef4444' }}>
                      {listing.playerBid >= (listing.currentBid || 0) ? 'Winning' : 'Outbid'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-[12px]">
                <div className="flex-1">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={minBid}
                    step={1000}
                    className="w-full h-[44px] px-[16px] bg-[#f9fafb] border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none focus:border-black"
                    style={FR}
                  />
                  <p className="text-[10px] text-[#4a5565] mt-[4px]" style={FR}>Min: {fmt(minBid)}</p>
                </div>
                <button
                  onClick={() => onBid(bidAmount)}
                  disabled={!canBid}
                  className="bg-black h-[44px] rounded-[16px] px-[24px] flex items-center gap-[8px] hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Gavel className="w-[16px] h-[16px] text-white" />
                  <span className="text-[14px] text-white" style={FB}>PLACE BID</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px]" style={FR}>PRICE</p>
                <p className="text-[28px] text-[#0a0a0a]" style={FB}>{fmt(listing.currentPrice)}</p>
                <p className="text-[11px] text-[#4a5565]" style={FR}>Budget: {fmt(teamBudget)}</p>
              </div>
              <button
                onClick={onPurchase}
                disabled={!canAfford}
                className="bg-black h-[48px] rounded-[16px] px-[28px] flex items-center gap-[10px] hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-[18px] h-[18px] text-white" />
                <span className="text-[16px] text-white" style={FB}>PURCHASE</span>
              </button>
            </div>
          )}
          {!canAfford && !isAuction && (
            <div className="flex items-center gap-[8px] mt-[8px] text-[#ef4444]">
              <AlertCircle className="w-[14px] h-[14px]" />
              <span className="text-[12px]" style={FR}>Insufficient funds</span>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Marketplace() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const careerState = useCareerStore((s) => s.careerState)
  const refreshMarketplaceListings = useCareerStore((s) => s.refreshMarketplaceListings)
  const purchaseFromMarketplace = useCareerStore((s) => s.purchaseFromMarketplace)
  const placeBid = useCareerStore((s) => s.placeBid)
  const getManufacturerRelationship = useCareerStore((s) => s.getManufacturerRelationship)
  const getManufacturerDiscount = useCareerStore((s) => s.getManufacturerDiscount)
  const consumeHoursFromBudget = useCareerStore((s) => s.consumeHoursFromBudget)
  const addPersonalCalendarEntry = useCareerStore((s) => s.addPersonalCalendarEntry)

  const [activeTab, setActiveTab] = useState<ListingTypeTab>('new')
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('price-asc')
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successName, setSuccessName] = useState('')
  const [successImg, setSuccessImg] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const teamBudget = careerState?.ownedTeam?.budgets.cash || 0
  const cW = careerState?.currentWeek || 1
  const cY = careerState?.currentYear || 2026

  useEffect(() => {
    if (careerState && (!careerState.marketplaceListings || careerState.marketplaceListings.length === 0)) {
      refreshMarketplaceListings()
    }
  }, [careerState, refreshMarketplaceListings])

  const availableClasses = useMemo(() => {
    const ls = careerState?.marketplaceListings || []
    const ids = new Set(ls.map((l) => l.carClassId))
    return AMS2_CAR_CLASSES.filter((cc) => ids.has(cc.id))
  }, [careerState?.marketplaceListings])

  const filteredListings = useMemo(() => {
    let ls = (careerState?.marketplaceListings || []).filter((l) => l.listingType === activeTab)
    if (conditionFilter !== 'all') ls = ls.filter((l) => l.condition === conditionFilter)
    if (classFilter !== 'all') ls = ls.filter((l) => l.carClassId === classFilter)
    const condOrd: Record<CarCondition, number> = { excellent: 0, good: 1, fair: 2, project: 3 }
    switch (sortOption) {
      case 'price-asc': ls = [...ls].sort((a, b) => a.currentPrice - b.currentPrice); break
      case 'price-desc': ls = [...ls].sort((a, b) => b.currentPrice - a.currentPrice); break
      case 'condition': ls = [...ls].sort((a, b) => condOrd[a.condition] - condOrd[b.condition]); break
      case 'performance': ls = [...ls].sort((a, b) => b.performance - a.performance); break
      case 'reliability': ls = [...ls].sort((a, b) => b.reliability - a.reliability); break
    }
    return ls
  }, [careerState?.marketplaceListings, activeTab, conditionFilter, classFilter, sortOption])

  const counts = useMemo(() => {
    const ls = careerState?.marketplaceListings || []
    return { new: ls.filter((l) => l.listingType === 'new').length, used: ls.filter((l) => l.listingType === 'used').length, auction: ls.filter((l) => l.listingType === 'auction').length }
  }, [careerState?.marketplaceListings])

  const mfgRel = useMemo(() => {
    if (!selectedListing) return null
    const id = selectedListing.manufacturerId?.toLowerCase().replace(/\s+/g, '-') || ''
    const rel = getManufacturerRelationship(id)
    const disc = getManufacturerDiscount(id)
    return { favor: rel?.favor ?? 0, tier: disc.tier, carDiscount: disc.carDiscount, partsDiscount: disc.partsDiscount }
  }, [selectedListing, getManufacturerRelationship, getManufacturerDiscount])

  const executePurchase = () => {
    if (!selectedListing) return
    const targetSeries = selectedListing.seriesCompatible[0]
    const success = purchaseFromMarketplace(selectedListing.id, targetSeries, selectedListing.carClassName, 0)
    if (success) {
      const tc = getActivityTimeCost('car_shopping')
      if (tc.hours > 0) consumeHoursFromBudget(tc.hours, tc.drain, `Car Purchase: ${selectedListing.carClassName}`, 'car_shopping')
      addPersonalCalendarEntry({ name: `Car Purchase: ${selectedListing.carClassName}`, description: `Purchased from marketplace`, activityId: 'car_shopping', week: careerState!.currentWeek, day: careerState!.currentDay ?? 1, duration: tc.hours, drainLevel: tc.drain, calendarEntryType: 'personal', category: 'team', immediate: true })
      routeNotification({ category: 'supply_chain', subject: 'Car Purchase Confirmed', body: `Your ${selectedListing.carClassName} is now in your garage.`, emailCategory: 'team' })
      addToast({ type: 'success', message: `${selectedListing.carClassName} added to your garage!` })
      setSuccessName(selectedListing.carClassName)
      setSuccessImg(selectedListing.liveryPath || '')
      setShowConfirm(false)
      setSelectedListing(null)
      setShowSuccess(true)
    } else {
      addToast({ type: 'error', message: 'Purchase failed — check your budget.' })
    }
  }

  const handleBid = (amount: number) => {
    if (!selectedListing) return
    const success = placeBid(selectedListing.id, amount)
    if (success) {
      const tc = getActivityTimeCost('car_shopping')
      if (tc.hours > 0) consumeHoursFromBudget(Math.ceil(tc.hours / 2), tc.drain, `Bid: ${selectedListing.carClassName}`, 'car_shopping')
      addToast({ type: 'success', message: `Bid of ${fmt(amount)} placed!` })
      const updated = (careerState?.marketplaceListings || []).find((l) => l.id === selectedListing.id)
      if (updated) setSelectedListing(updated)
    } else {
      addToast({ type: 'error', message: 'Bid failed — minimum not met.' })
    }
  }

  if (!careerState?.ownedTeam) {
    return (
      <div className="flex items-center justify-center h-full bg-white" style={FB}>
        <p className="text-[24px] text-[#4a5565]">Start a career to access the marketplace</p>
      </div>
    )
  }

  const tabs: { id: ListingTypeTab; label: string; count: number }[] = [
    { id: 'new', label: 'NEW', count: counts.new },
    { id: 'used', label: 'USED', count: counts.used },
    { id: 'auction', label: 'AUCTIONS', count: counts.auction },
  ]

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-[36px]" style={FB}>MARKETPLACE</h1>
            <p className="text-[14px] text-[#4a5565] leading-[20px] mt-[4px]" style={FR}>
              Browse and purchase cars. Budget: <span style={FB}>{fmt(teamBudget)}</span>
            </p>
          </div>
          <button
            onClick={() => { refreshMarketplaceListings(); addToast({ type: 'info', message: 'Listings refreshed' }) }}
            className="border-[0.8px] border-black/20 h-[40px] rounded-[12px] px-[16px] flex items-center gap-[8px] hover:bg-[#f3f4f6] transition-colors"
          >
            <RefreshCw className="w-[16px] h-[16px] text-[#0a0a0a]" />
            <span className="text-[12px] text-[#0a0a0a]" style={FB}>REFRESH</span>
          </button>
        </div>

        {/* Tabs + Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-[4px]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`h-[40px] rounded-[12px] px-[16px] flex items-center gap-[6px] transition-colors ${
                  activeTab === t.id ? 'bg-black text-white' : 'bg-[#f3f4f6] text-[#0a0a0a] hover:bg-[#e5e7eb]'
                }`}
              >
                <span className="text-[12px]" style={FB}>{t.label}</span>
                <span className={`text-[10px] ${activeTab === t.id ? 'text-white/70' : 'text-[#4a5565]'}`}>({t.count})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="border-[0.8px] border-black/20 h-[36px] rounded-[10px] px-[12px] flex items-center gap-[6px] hover:bg-[#f3f4f6]"
          >
            <Filter className="w-[14px] h-[14px] text-[#4a5565]" />
            <span className="text-[11px] text-[#4a5565]" style={FB}>FILTERS</span>
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className={`${CARD} p-[20px]`}>
            <div className="flex gap-[16px]">
              <div className="flex-1">
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[6px]" style={FR}>CONDITION</p>
                <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value as ConditionFilter)}
                  className="w-full h-[36px] px-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[10px] text-[12px] outline-none" style={FR}>
                  <option value="all">All</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[6px]" style={FR}>CAR CLASS</p>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full h-[36px] px-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[10px] text-[12px] outline-none" style={FR}>
                  <option value="all">All Classes</option>
                  {availableClasses.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#4a5565] tracking-[0.5px] mb-[6px]" style={FR}>SORT BY</p>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full h-[36px] px-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[10px] text-[12px] outline-none" style={FR}>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="condition">Condition</option>
                  <option value="performance">Performance</option>
                  <option value="reliability">Reliability</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className={`${CARD} p-[48px] flex flex-col items-center justify-center`}>
            <Car className="w-[48px] h-[48px] text-[#d1d5dc] mb-[12px]" />
            <p className="text-[14px] text-[#4a5565]" style={FR}>No {activeTab} cars match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-[16px]">
            {filteredListings.map((l) => (
              <ListingCard key={l.id} listing={l} cW={cW} cY={cY} onSelect={() => setSelectedListing(l)} canAfford={teamBudget >= l.currentPrice} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedListing && !showConfirm && (
        <CarDetailsModal
          listing={selectedListing}
          isOpen
          onClose={() => setSelectedListing(null)}
          onPurchase={() => setShowConfirm(true)}
          onBid={handleBid}
          canAfford={teamBudget >= selectedListing.currentPrice}
          teamBudget={teamBudget}
          cW={cW}
          cY={cY}
          mfgRel={mfgRel}
        />
      )}

      {/* Confirm Purchase Modal */}
      <Overlay open={showConfirm && !!selectedListing} onClose={() => setShowConfirm(false)}>
        {selectedListing && (
          <div className="p-[32px] flex flex-col gap-[20px]">
            <h2 className="text-[24px] text-[#0a0a0a]" style={FB}>CONFIRM PURCHASE</h2>
            <div className="flex items-center gap-[16px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]">
              {selectedListing.liveryPath && (
                <img src={selectedListing.liveryPath} alt="" className="w-[96px] h-[64px] object-cover rounded-[10px]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div className="flex-1">
                <p className="text-[14px] text-[#0a0a0a]" style={FB}>{selectedListing.carClassName}</p>
                <p className="text-[12px] text-[#4a5565]" style={FR}>{selectedListing.condition} condition</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] text-[#0a0a0a]" style={FB}>{fmt(selectedListing.currentPrice)}</p>
                <p className="text-[11px] text-[#4a5565]" style={FR}>
                  After: {fmt(teamBudget - selectedListing.currentPrice)}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-[#4a5565]" style={FR}>
              The car will be added to your garage unassigned. Assign it to a series when ready.
            </p>
            <div className="flex gap-[12px]">
              <button onClick={() => setShowConfirm(false)} className="flex-1 h-[48px] border-[0.8px] border-black/20 rounded-[16px] text-[14px] text-[#0a0a0a] hover:bg-[#f3f4f6] transition-colors" style={FB}>
                CANCEL
              </button>
              <button onClick={executePurchase} className="flex-1 h-[48px] bg-black rounded-[16px] text-[14px] text-white flex items-center justify-center gap-[8px] hover:bg-gray-900 transition-colors" style={FB}>
                <Check className="w-[16px] h-[16px]" /> CONFIRM
              </button>
            </div>
          </div>
        )}
      </Overlay>

      {/* Success Modal */}
      <Overlay open={showSuccess} onClose={() => setShowSuccess(false)}>
        <div className="p-[32px] text-center flex flex-col items-center gap-[16px]">
          <div className="bg-[#f0fdf4] w-[64px] h-[64px] rounded-full flex items-center justify-center">
            <Check className="w-[32px] h-[32px] text-[#00a63e]" />
          </div>
          <h2 className="text-[24px] text-[#0a0a0a]" style={FB}>CAR ACQUIRED</h2>
          {successImg && <img src={successImg} alt="" className="w-[240px] h-[120px] object-cover rounded-[16px]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          <p className="text-[16px] text-[#0a0a0a]" style={FB}>{successName}</p>
          <p className="text-[12px] text-[#4a5565]" style={FR}>Assign it to a series when you're ready to compete.</p>
          <div className="flex gap-[12px]">
            <button onClick={() => setShowSuccess(false)} className="h-[44px] border-[0.8px] border-black/20 rounded-[16px] px-[24px] hover:bg-[#f3f4f6] transition-colors" style={FB}>
              <span className="text-[14px] text-[#0a0a0a]">DONE</span>
            </button>
            <button onClick={() => { setShowSuccess(false); navigate('/series-entry') }} className="h-[44px] bg-black rounded-[16px] px-[24px] flex items-center gap-[8px] hover:bg-gray-900 transition-colors" style={FB}>
              <Flag className="w-[14px] h-[14px] text-white" />
              <span className="text-[14px] text-white">ASSIGN TO SERIES</span>
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  )
}
