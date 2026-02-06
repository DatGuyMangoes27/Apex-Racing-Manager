import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Car,
  DollarSign,
  Wrench,
  Clock,
  History,
  Filter,
  Star,
  AlertCircle,
  Gavel,
  Tag,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button, Modal } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { MarketplaceListing, FavorTier } from '@/simulation/marketplace'

interface CarDetailsModalProps {
  listing: MarketplaceListing
  isOpen: boolean
  onClose: () => void
  onPurchase: () => void
  onBid: (amount: number) => void
  canAfford: boolean
  teamBudget: number
  currentWeek: number
  currentYear: number
  manufacturerRelationship: { favor: number; tier: FavorTier; carDiscount: number; partsDiscount: number } | null
}

function CarDetailsModal({ 
  listing, 
  isOpen, 
  onClose, 
  onPurchase, 
  onBid, 
  canAfford, 
  teamBudget,
  currentWeek,
  currentYear,
  manufacturerRelationship
}: CarDetailsModalProps) {
  const [bidAmount, setBidAmount] = useState<number>(
    listing.currentBid 
      ? Math.ceil(listing.currentBid * 1.1) 
      : listing.minimumBid || 0
  )
  
  // Get manufacturer data
  const manufacturerId = listing.manufacturerId?.toLowerCase().replace(/\s+/g, '-') || ''
  const manufacturer = getManufacturer(manufacturerId)
  
  // Get series from rivalStore
  const allSeries = useRivalStore(state => state.series)
  
  // Get compatible series for this car class
  // Check both primary carClassId and carClassIds array (for multi-class series)
  const compatibleSeries = useMemo(() => {
    return allSeries.filter(series => 
      series.carClassId === listing.carClassId ||
      (series.carClassIds && series.carClassIds.includes(listing.carClassId))
    )
  }, [listing.carClassId, allSeries])
  
  // Calculate estimated costs based on class, manufacturer, and condition
  const estimatedCosts = useMemo(() => {
    // Realistic per-race repair costs by car category (before wear/condition modifiers)
    const CLASS_REPAIR_COSTS: Record<string, { min: number, avg: number, max: number }> = {
      // Hypercars/LMDh - extremely expensive, complex hybrid systems
      'hypercar': { min: 15000, avg: 35000, max: 80000 },
      'lmdh-gtp': { min: 12000, avg: 28000, max: 65000 },
      // LMP2 - Professional prototypes
      'lmp2-gen1': { min: 8000, avg: 18000, max: 40000 },
      'lmp2-gen2': { min: 9000, avg: 20000, max: 45000 },
      'p3': { min: 4000, avg: 8000, max: 18000 },
      // GT3/GTE - High-level GT racing
      'gt3': { min: 4000, avg: 8000, max: 20000 },
      'gt3-gen2': { min: 5000, avg: 10000, max: 25000 },
      'gte': { min: 6000, avg: 12000, max: 28000 },
      // GT4/GT5 - Semi-professional GT
      'gt4': { min: 2000, avg: 4500, max: 10000 },
      'gt5': { min: 1500, avg: 3000, max: 7000 },
      // Touring/Stock cars
      'supercar': { min: 3000, avg: 6000, max: 15000 },
      'stock-car-2024': { min: 2500, avg: 5000, max: 12000 },
      'stock-car-2023': { min: 2500, avg: 5000, max: 12000 },
      'stock-car-2022': { min: 2500, avg: 5000, max: 12000 },
      // Formula cars
      'formula-ultimate-gen2': { min: 8000, avg: 18000, max: 45000 },
      'formula-ultimate': { min: 7000, avg: 15000, max: 38000 },
      'formula-inter': { min: 3500, avg: 7000, max: 16000 },
      'f3': { min: 2500, avg: 5000, max: 12000 },
      'formula-usa-2023': { min: 2000, avg: 4000, max: 9000 },
      // Entry-level/club racing
      'copa-classic': { min: 800, avg: 1500, max: 3500 },
      'ginetta-g55-supercup': { min: 1200, avg: 2500, max: 5500 },
      'carrera-cup': { min: 2500, avg: 5000, max: 12000 },
      'jcw': { min: 600, avg: 1200, max: 2800 },
      'tsi-cup': { min: 500, avg: 1000, max: 2500 },
      'caterham-academy': { min: 300, avg: 600, max: 1400 },
      'caterham-superlight': { min: 400, avg: 800, max: 1800 },
      'caterham-supersport': { min: 500, avg: 1000, max: 2200 },
      'caterham-620r': { min: 700, avg: 1400, max: 3200 },
      // Karts
      'kart-gx390': { min: 100, avg: 200, max: 500 },
      'kart-shifter': { min: 200, avg: 400, max: 900 },
      'kart-super': { min: 250, avg: 500, max: 1100 },
      'kart-125cc': { min: 150, avg: 300, max: 700 }
    }
    
    // Get base costs for this class (fallback to price-based calculation)
    const classId = listing.carClassId.toLowerCase()
    const classCosts = CLASS_REPAIR_COSTS[classId] || {
      min: Math.round(listing.currentPrice * 0.003),
      avg: Math.round(listing.currentPrice * 0.008),
      max: Math.round(listing.currentPrice * 0.02)
    }
    
    // Wear multiplier - higher wear = more frequent repairs
    const avgWear = Object.values(listing.partWear).reduce((a, b) => a + b, 0) / 5
    const wearMultiplier = 1 + (avgWear / 80) // Up to 2.25x at 100% wear
    
    // Manufacturer support quality affects costs (higher quality = lower costs)
    const supportMultiplier = manufacturer?.supportQuality 
      ? 1.5 - (manufacturer.supportQuality / 200) // 95 quality = 1.025x, 70 quality = 1.15x
      : 1.1
    
    // Manufacturer tier affects premium
    const tierMultiplier = manufacturer?.tier === 'luxury' ? 1.25 
      : manufacturer?.tier === 'premium' ? 1.1 
      : manufacturer?.tier === 'budget' ? 0.85 
      : 1.0
    
    const finalMultiplier = wearMultiplier * supportMultiplier * tierMultiplier
    
    // Get manufacturer parts costs or realistic defaults based on car price
    const partsCosts = manufacturer?.partsCosts || {
      engine: Math.round(listing.currentPrice * 0.08),
      chassis: Math.round(listing.currentPrice * 0.06),
      brakes: Math.round(listing.currentPrice * 0.018),
      suspension: Math.round(listing.currentPrice * 0.025),
      gearbox: Math.round(listing.currentPrice * 0.05)
    }
    
    return {
      perRaceRepair: {
        min: Math.round(classCosts.min * finalMultiplier),
        max: Math.round(classCosts.max * finalMultiplier),
        avg: Math.round(classCosts.avg * finalMultiplier)
      },
      seasonMaintenance: Math.round(classCosts.avg * 12 * finalMultiplier),
      partsCosts,
      totalPartsReplacement: Object.values(partsCosts).reduce((a, b) => a + b, 0)
    }
  }, [listing, manufacturer])
  
  const isAuction = listing.listingType === 'auction'
  const minimumBid = listing.currentBid 
    ? listing.currentBid + Math.max(1000, Math.round(listing.currentBid * 0.05))
    : listing.minimumBid || 0
  
  const canBid = bidAmount >= minimumBid && bidAmount <= teamBudget
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={listing.carClassName}
      size="xl"
    >
      <div className="space-y-6">
        {/* Hero Image */}
        <div className="relative h-64 bg-surface-elevated rounded-lg overflow-hidden">
          {listing.liveryPath ? (
            <img 
              src={listing.liveryPath}
              alt={listing.liveryName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-24 h-24 text-text-muted" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={listing.listingType === 'new' ? 'default' : listing.listingType === 'auction' ? 'red' : 'outline'}>
              {listing.listingType.toUpperCase()}
            </Badge>
            <Badge variant={CONDITION_BADGES[listing.condition]}>
              {listing.condition.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Stats & Wear */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gauge className="w-5 h-5 text-accent-red" />
              Performance & Condition
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Performance</div>
                <div className="text-2xl font-bold text-accent-red">{listing.performance}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Reliability</div>
                <div className="text-2xl font-bold text-status-info">{listing.reliability}%</div>
              </div>
            </div>
            
            {listing.listingType !== 'new' && (
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Mileage</div>
                <div className="text-xl font-semibold">{formatMileage(listing.mileage)}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-text-secondary">Part Condition</h4>
              <WearBar label="Engine" value={listing.partWear.engine} />
              <WearBar label="Chassis" value={listing.partWear.chassis} />
              <WearBar label="Gearbox" value={listing.partWear.gearbox} />
              <WearBar label="Brakes" value={listing.partWear.brakes} />
              <WearBar label="Suspension" value={listing.partWear.suspension} />
            </div>
          </div>
          
          {/* Right Column - History & Price */}
          <div className="space-y-4">
            {/* Upgrades */}
            {listing.installedUpgrades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-accent-gold" />
                  Installed Upgrades
                </h3>
                <div className="space-y-2">
                  {listing.installedUpgrades.map(upgrade => (
                    <div key={upgrade.id} className="flex items-center justify-between bg-surface-elevated rounded p-2">
                      <div>
                        <div className="font-medium">{upgrade.name}</div>
                        <div className="text-xs text-text-muted capitalize">{upgrade.type}</div>
                      </div>
                      <Badge variant="outline">+{upgrade.effect}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Provenance */}
            {listing.provenance && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-status-info" />
                  History
                </h3>
                <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Previous Owners</span>
                    <span>{listing.provenance.previousOwners}</span>
                  </div>
                  {listing.provenance.raceHistory && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Races</span>
                        <span>{listing.provenance.raceHistory.races}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Wins / Podiums</span>
                        <span>{listing.provenance.raceHistory.wins} / {listing.provenance.raceHistory.podiums}</span>
                      </div>
                    </>
                  )}
                  {listing.provenance.notableResults && listing.provenance.notableResults.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-sm text-text-muted mb-1">Notable Results</div>
                      {listing.provenance.notableResults.map((result, i) => (
                        <div key={i} className="text-sm flex items-center gap-1">
                          <Award className="w-3 h-3 text-accent-gold" />
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                  {listing.provenance.accidentHistory && listing.provenance.accidentHistory > 0 && (
                    <div className="text-sm text-status-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {listing.provenance.accidentHistory} accident{listing.provenance.accidentHistory > 1 ? 's' : ''} on record
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Price Breakdown */}
            {listing.priceBreakdown && listing.listingType !== 'new' && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-accent-gold" />
                  Price Breakdown
                </h3>
                <div className="bg-surface-elevated rounded-lg p-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Base MSRP</span>
                    <span>{formatCurrency(listing.priceBreakdown.base)}</span>
                  </div>
                  {listing.priceBreakdown.wearDiscount !== 0 && (
                    <div className="flex justify-between text-status-error">
                      <span>Wear Discount</span>
                      <span>{formatCurrency(listing.priceBreakdown.wearDiscount)}</span>
                    </div>
                  )}
                  {listing.priceBreakdown.mileageDiscount !== 0 && (
                    <div className="flex justify-between text-status-error">
                      <span>Mileage Discount</span>
                      <span>{formatCurrency(listing.priceBreakdown.mileageDiscount)}</span>
                    </div>
                  )}
                  {listing.priceBreakdown.serviceBonus > 0 && (
                    <div className="flex justify-between text-status-success">
                      <span>Service History</span>
                      <span>+{formatCurrency(listing.priceBreakdown.serviceBonus)}</span>
                    </div>
                  )}
                  {listing.priceBreakdown.provenanceBonus !== 0 && (
                    <div className={`flex justify-between ${listing.priceBreakdown.provenanceBonus > 0 ? 'text-status-success' : 'text-status-error'}`}>
                      <span>Provenance</span>
                      <span>{listing.priceBreakdown.provenanceBonus > 0 ? '+' : ''}{formatCurrency(listing.priceBreakdown.provenanceBonus)}</span>
                    </div>
                  )}
                  {listing.priceBreakdown.upgradeValue > 0 && (
                    <div className="flex justify-between text-status-success">
                      <span>Upgrade Value</span>
                      <span>+{formatCurrency(listing.priceBreakdown.upgradeValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Final Price</span>
                    <span className="text-accent-gold">{formatCurrency(listing.currentPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Manufacturer Info Section */}
        {manufacturer && (
          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-status-info" />
              Manufacturer: {manufacturer.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4 text-text-muted" />
                  <span className="text-text-muted">Country:</span>
                  <span>{manufacturer.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <History className="w-4 h-4 text-text-muted" />
                  <span className="text-text-muted">Founded:</span>
                  <span>{manufacturer.founded}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-text-muted" />
                  <span className="text-text-muted">Specialties:</span>
                  <span className="capitalize">{manufacturer.specialties.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-text-muted" />
                  <span className="text-text-muted">Tier:</span>
                  <Badge variant={manufacturer.tier === 'luxury' ? 'red' : manufacturer.tier === 'premium' ? 'yellow' : 'outline'}>
                    {manufacturer.tier.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="w-4 h-4 text-text-muted" />
                  <span className="text-text-muted">Support Quality:</span>
                  <span className={manufacturer.supportQuality >= 90 ? 'text-status-success' : manufacturer.supportQuality >= 70 ? 'text-accent-gold' : 'text-status-error'}>
                    {manufacturer.supportQuality}%
                  </span>
                </div>
              </div>
              
              {/* Your Relationship */}
              <div className="bg-surface-elevated rounded-lg p-4">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Your Relationship</h4>
                {manufacturerRelationship ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Favor Level</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              manufacturerRelationship.tier === 'platinum' ? 'bg-gradient-to-r from-accent-gold to-status-success' :
                              manufacturerRelationship.tier === 'gold' ? 'bg-accent-gold' :
                              manufacturerRelationship.tier === 'silver' ? 'bg-text-secondary' :
                              manufacturerRelationship.tier === 'bronze' ? 'bg-accent-orange' : 'bg-surface-border'
                            }`}
                            style={{ width: `${manufacturerRelationship.favor}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{manufacturerRelationship.favor}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Status</span>
                      <Badge variant={
                        manufacturerRelationship.tier === 'platinum' ? 'green' :
                        manufacturerRelationship.tier === 'gold' ? 'yellow' :
                        manufacturerRelationship.tier === 'silver' || manufacturerRelationship.tier === 'bronze' ? 'outline' : 'default'
                      }>
                        {manufacturerRelationship.tier.toUpperCase()}
                      </Badge>
                    </div>
                    {manufacturerRelationship.carDiscount > 0 && (
                      <div className="flex items-center justify-between text-status-success">
                        <span className="text-sm">Car Discount</span>
                        <span className="text-sm font-medium">-{Math.round(manufacturerRelationship.carDiscount * 100)}%</span>
                      </div>
                    )}
                    {manufacturerRelationship.partsDiscount > 0 && (
                      <div className="flex items-center justify-between text-status-success">
                        <span className="text-sm">Parts Discount</span>
                        <span className="text-sm font-medium">-{Math.round(manufacturerRelationship.partsDiscount * 100)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">
                    No relationship yet. Purchase to build favor!
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-text-muted mt-2 italic">{manufacturer.description}</p>
          </div>
        )}
        
        {/* Series Compatibility Section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-accent-gold" />
            Compatible Series
          </h3>
          {compatibleSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {compatibleSeries.slice(0, 6).map(series => (
                <div key={series.id} className="flex items-center justify-between bg-surface-elevated rounded p-2">
                  <div>
                    <div className="font-medium text-sm">{series.name}</div>
                    <div className="text-xs text-text-muted capitalize">{series.tier} Tier</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {series.category || 'Racing'}
                  </Badge>
                </div>
              ))}
              {compatibleSeries.length > 6 && (
                <div className="text-xs text-text-muted col-span-2 text-center">
                  +{compatibleSeries.length - 6} more series...
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-text-muted bg-surface-elevated rounded p-3">
              No specific series compatibility found. This car can be used in custom races.
            </div>
          )}
        </div>
        
        {/* Estimated Costs Section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-status-warning" />
            Estimated Running Costs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-text-secondary">Per Race</h4>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Repair Range</span>
                <span>{formatCurrency(estimatedCosts.perRaceRepair.min)} - {formatCurrency(estimatedCosts.perRaceRepair.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Average</span>
                <span className="text-accent-gold">{formatCurrency(estimatedCosts.perRaceRepair.avg)}</span>
              </div>
            </div>
            
            <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-text-secondary">Season Estimate</h4>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Maintenance (12 races)</span>
                <span>{formatCurrency(estimatedCosts.seasonMaintenance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Full Parts Replacement</span>
                <span>{formatCurrency(estimatedCosts.totalPartsReplacement)}</span>
              </div>
            </div>
          </div>
          
          {/* Parts Cost Breakdown */}
          <div className="mt-3 text-xs text-text-muted">
            <span className="font-medium">Parts costs: </span>
            Engine: {formatCurrency(estimatedCosts.partsCosts.engine)} | 
            Chassis: {formatCurrency(estimatedCosts.partsCosts.chassis)} | 
            Gearbox: {formatCurrency(estimatedCosts.partsCosts.gearbox)} | 
            Brakes: {formatCurrency(estimatedCosts.partsCosts.brakes)} | 
            Suspension: {formatCurrency(estimatedCosts.partsCosts.suspension)}
          </div>
        </div>
        
        {/* Action Section */}
        <div className="border-t border-border pt-4">
          {isAuction ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-muted">Current Bid</div>
                  <div className="text-2xl font-bold text-accent-gold">
                    {listing.currentBid ? formatCurrency(listing.currentBid) : formatCurrency(listing.minimumBid || 0)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {listing.bidCount || 0} bid{(listing.bidCount || 0) !== 1 ? 's' : ''} | 
                    Ends in {getTimeRemaining(listing.auctionEndWeek!, listing.auctionEndYear!, currentWeek, currentYear)}
                  </div>
                </div>
                
                {listing.playerBid !== undefined && (
                  <div className={`text-right ${listing.playerBid >= (listing.currentBid || 0) ? 'text-status-success' : 'text-status-error'}`}>
                    <div className="text-sm">Your Bid</div>
                    <div className="text-xl font-bold">{formatCurrency(listing.playerBid)}</div>
                    <div className="text-sm">{listing.playerBid >= (listing.currentBid || 0) ? 'Winning' : 'Outbid'}</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    min={minimumBid}
                    step={1000}
                    className="w-full px-3 py-2 bg-surface-dark text-text-primary rounded border border-border focus:border-accent-red outline-none"
                  />
                  <div className="text-xs text-text-muted mt-1">
                    Minimum bid: {formatCurrency(minimumBid)}
                  </div>
                </div>
                <Button 
                  onClick={() => onBid(bidAmount)}
                  disabled={!canBid}
                  variant="primary"
                  size="lg"
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Place Bid
                </Button>
              </div>
              
              {bidAmount > teamBudget && (
                <div className="text-sm text-status-error flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Insufficient funds. Budget: {formatCurrency(teamBudget)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-muted">Price</div>
                <div className="text-2xl font-bold text-accent-gold">{formatCurrency(listing.currentPrice)}</div>
                <div className="text-sm text-text-muted">Budget: {formatCurrency(teamBudget)}</div>
              </div>
              
              <Button 
                onClick={onPurchase}
                disabled={!canAfford}
                variant="primary"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase Car
              </Button>
            </div>
          )}
          
          {!canAfford && !isAuction && (
            <div className="mt-2 text-sm text-status-error flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Insufficient funds to purchase this car
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Marketplace() {
  const { addToast } = useToast()
  const careerState = useCareerStore(state => state.careerState)
  const refreshMarketplaceListings = useCareerStore(state => state.refreshMarketplaceListings)
  const purchaseFromMarketplace = useCareerStore(state => state.purchaseFromMarketplace)
  const placeBid = useCareerStore(state => state.placeBid)
  const _getMarketplaceListings = useCareerStore(state => state.getMarketplaceListings)
  const getManufacturerRelationship = useCareerStore(state => state.getManufacturerRelationship)
  const getManufacturerDiscount = useCareerStore(state => state.getManufacturerDiscount)
  const consumeHoursFromBudget = useCareerStore(state => state.consumeHoursFromBudget)
  const addPersonalCalendarEntry = useCareerStore(state => state.addPersonalCalendarEntry)
  const getSeriesById = useRivalStore(state => state.getSeriesById)
  
  const [activeTab, setActiveTab] = useState<ListingTypeTab>('new')
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all')
  const [classFilter, setClassFilter] = useState<ClassFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('price-asc')
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const teamBudget = careerState?.ownedTeam?.budgets.cash || 0
  const currentWeek = careerState?.currentWeek || 1
  const currentYear = careerState?.currentYear || 2024
  
  // Generate listings if empty
  useEffect(() => {
    if (careerState && (!careerState.marketplaceListings || careerState.marketplaceListings.length === 0)) {
      refreshMarketplaceListings()
    }
  }, [careerState, refreshMarketplaceListings])
  
  // Get unique car classes from listings
  const availableClasses = useMemo(() => {
    const listings = careerState?.marketplaceListings || []
    const classIds = new Set(listings.map(l => l.carClassId))
    return AMS2_CAR_CLASSES.filter(cc => classIds.has(cc.id))
  }, [careerState?.marketplaceListings])
  
  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let listings = careerState?.marketplaceListings || []
    
    // Filter by tab (listing type)
    listings = listings.filter(l => l.listingType === activeTab)
    
    // Filter by condition
    if (conditionFilter !== 'all') {
      listings = listings.filter(l => l.condition === conditionFilter)
    }
    
    // Filter by class
    if (classFilter !== 'all') {
      listings = listings.filter(l => l.carClassId === classFilter)
    }
    
    // Sort
    switch (sortOption) {
      case 'price-asc':
        listings = [...listings].sort((a, b) => a.currentPrice - b.currentPrice)
        break
      case 'price-desc':
        listings = [...listings].sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'condition':
        const condOrder: Record<CarCondition, number> = { excellent: 0, good: 1, fair: 2, project: 3 }
        listings = [...listings].sort((a, b) => condOrder[a.condition] - condOrder[b.condition])
        break
      case 'performance':
        listings = [...listings].sort((a, b) => b.performance - a.performance)
        break
      case 'reliability':
        listings = [...listings].sort((a, b) => b.reliability - a.reliability)
        break
    }
    
    return listings
  }, [careerState?.marketplaceListings, activeTab, conditionFilter, classFilter, sortOption])
  
  // Count listings by type
  const listingCounts = useMemo(() => {
    const listings = careerState?.marketplaceListings || []
    return {
      new: listings.filter(l => l.listingType === 'new').length,
      used: listings.filter(l => l.listingType === 'used').length,
      auction: listings.filter(l => l.listingType === 'auction').length
    }
  }, [careerState?.marketplaceListings])
  
  // Get manufacturer relationship for selected listing
  const selectedManufacturerRelationship = useMemo(() => {
    if (!selectedListing) return null
    
    const manufacturerId = selectedListing.manufacturerId?.toLowerCase().replace(/\s+/g, '-') || ''
    const relationship = getManufacturerRelationship(manufacturerId)
    const discount = getManufacturerDiscount(manufacturerId)
    
    if (!relationship) {
      return {
        favor: 0,
        tier: discount.tier,
        carDiscount: discount.carDiscount,
        partsDiscount: discount.partsDiscount
      }
    }
    
    return {
      favor: relationship.favor,
      tier: discount.tier,
      carDiscount: discount.carDiscount,
      partsDiscount: discount.partsDiscount
    }
  }, [selectedListing, getManufacturerRelationship, getManufacturerDiscount])
  
  const handlePurchase = () => {
    if (!selectedListing) return
    
    // Get the target series ID from the listing
    const targetSeriesId = selectedListing.seriesCompatible[0]
    
    // Check if we already have an entry for this series
    const existingEntry = careerState?.seriesEntries?.find(
      entry => entry.seriesId === targetSeriesId
    )
    
    // Calculate entry fee only if we don't have an existing entry
    let entryFee = 0
    if (!existingEntry && targetSeriesId) {
      // Get series data to determine tier
      const seriesData = getSeriesById(targetSeriesId)
      if (seriesData?.tier) {
        entryFee = calculateEntryFee(seriesData.tier)
        console.log(`[Marketplace] New series entry required. Tier: ${seriesData.tier}, Fee: ${entryFee}`)
      }
    }
    
    const success = purchaseFromMarketplace(
      selectedListing.id,
      targetSeriesId,
      selectedListing.carClassName,
      entryFee
    )
    
    if (success) {
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const purchaseTimeCost = getActivityTimeCost('car_shopping')
      if (purchaseTimeCost.hours > 0) {
        consumeHoursFromBudget(purchaseTimeCost.hours, purchaseTimeCost.drain, `Car Purchase: ${selectedListing.carClassName}`, 'car_shopping')
      }
      addPersonalCalendarEntry({
        name: `Car Purchase: ${selectedListing.carClassName}`,
        description: `Purchased ${selectedListing.carClassName} from marketplace`,
        activityId: 'car_shopping',
        week: careerState!.currentWeek,
        day: careerState!.currentDay ?? 1,
        duration: purchaseTimeCost.hours,
        drainLevel: purchaseTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'team',
        immediate: true
      })
      routeNotification({
        category: 'supply_chain',
        subject: 'Car Purchase Confirmed',
        body: `Your purchase of the ${selectedListing.carClassName} has been completed. The car is now in your garage.`,
        emailCategory: 'team'
      })

      const entryMessage = entryFee > 0 
        ? ` (including ${formatCurrency(entryFee)} entry fee)`
        : ''
      addToast({
        type: 'success',
        title: 'Car Purchased!',
        message: `You now own the ${selectedListing.carClassName}${entryMessage}`
      })
      setSelectedListing(null)
    } else {
      addToast({
        type: 'error',
        title: 'Purchase Failed',
        message: 'Unable to complete the purchase. Check your budget.'
      })
    }
  }
  
  const handleBid = (amount: number) => {
    if (!selectedListing) return
    
    const success = placeBid(selectedListing.id, amount)
    
    if (success) {
      // === TIME BUDGET INTEGRATION ===
      const bidTimeCost = getActivityTimeCost('car_shopping') // 2h low drain for bid research
      if (bidTimeCost.hours > 0) {
        consumeHoursFromBudget(Math.ceil(bidTimeCost.hours / 2), bidTimeCost.drain, `Bid: ${selectedListing.carClassName}`, 'car_shopping')
      }

      addToast({
        type: 'success',
        title: 'Bid Placed!',
        message: `Your bid of ${formatCurrency(amount)} has been placed`
      })
      // Update selected listing to reflect new bid
      const updatedListings = careerState?.marketplaceListings || []
      const updated = updatedListings.find(l => l.id === selectedListing.id)
      if (updated) setSelectedListing(updated)
    } else {
      addToast({
        type: 'error',
        title: 'Bid Failed',
        message: 'Unable to place bid. Minimum bid not met.'
      })
    }
  }
  
  const handleRefresh = () => {
    refreshMarketplaceListings()
    addToast({
      type: 'info',
      title: 'Marketplace Refreshed',
      message: 'New listings have been generated'
    })
  }
  
  if (!careerState || !careerState.ownedTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Car className="w-16 h-16 text-text-muted mx-auto" />
          <p className="text-text-muted">Start a team owner career to access the marketplace</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      <PageHeader 
        title="Car Marketplace"
        subtitle={`Browse and purchase cars for your team. Budget: ${formatCurrency(teamBudget)}`}
        icon={<ShoppingCart className="w-6 h-6 text-accent-red" />}
        actions={
          <Button variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Listings
          </Button>
        }
      />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ListingTypeTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              New ({listingCounts.new})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Used ({listingCounts.used})
            </TabsTrigger>
            <TabsTrigger value="auction" className="flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              Auctions ({listingCounts.auction})
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Condition Filter */}
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">Condition</label>
                    <select
                      value={conditionFilter}
                      onChange={e => setConditionFilter(e.target.value as ConditionFilter)}
                      className="w-full px-3 py-2 bg-surface-elevated text-text-primary rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent-red [&>option]:bg-surface-elevated [&>option]:text-text-primary"
                    >
                      <option value="all">All Conditions</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  
                  {/* Class Filter */}
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">Car Class</label>
                    <select
                      value={classFilter}
                      onChange={e => setClassFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-elevated text-text-primary rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent-red [&>option]:bg-surface-elevated [&>option]:text-text-primary"
                    >
                      <option value="all">All Classes</option>
                      {availableClasses.map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Sort */}
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">Sort By</label>
                    <select
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value as SortOption)}
                      className="w-full px-3 py-2 bg-surface-elevated text-text-primary rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent-red [&>option]:bg-surface-elevated [&>option]:text-text-primary"
                    >
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="condition">Condition</option>
                      <option value="performance">Performance</option>
                      <option value="reliability">Reliability</option>
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Listings Grid */}
        <TabsContent value={activeTab} className="mt-6">
          {filteredListings.length === 0 ? (
            <Card className="p-8 text-center">
              <Car className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No {activeTab} cars available matching your filters</p>
              <Button variant="ghost" className="mt-4" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Listings
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentWeek={currentWeek}
                  currentYear={currentYear}
                  onSelect={() => setSelectedListing(listing)}
                  canAfford={teamBudget >= listing.currentPrice}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Car Details Modal */}
      {selectedListing && (
        <CarDetailsModal
          listing={selectedListing}
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onPurchase={handlePurchase}
          onBid={handleBid}
          canAfford={teamBudget >= selectedListing.currentPrice}
          teamBudget={teamBudget}
          currentWeek={currentWeek}
          currentYear={currentYear}
          manufacturerRelationship={selectedManufacturerRelationship}
        />
      )}
    </div>
  )
}
