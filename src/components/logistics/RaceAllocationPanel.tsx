// ============================================
// RACE ALLOCATION PANEL
// ============================================
// Plan, ship, and track spare parts kits for race weekends

import React, { useState, useMemo } from 'react'
import { 
  Flag, 
  Package, 
  Truck, 
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowRight,
  Calendar,
  _Send,
  Gauge,
  Car,
  CircleDot,
  ArrowUpDown,
  Cog
} from 'lucide-react'
import type { Card, CardContent } from '@/components/ui/Card';
  switch (type) {
    case 'engine': return <Gauge className={className} />
    case 'chassis': return <Car className={className} />
    case 'brakes': return <CircleDot className={className} />
    case 'suspension': return <ArrowUpDown className={className} />
    case 'gearbox': return <Cog className={className} />
  }
}

// ============================================
// KIT STATUS BADGE
// ============================================

const KitStatusBadge: React.FC<{ status: RaceSparesKitStatus }> = ({ status }) => {
  switch (status) {
    case 'planning':
      return (
        <Badge variant="secondary" className="bg-accent-blue/20 text-accent-blue border-accent-blue/30">
          <Package className="w-3 h-3 mr-1" />
          Planning
        </Badge>
      )
    case 'shipping':
      return (
        <Badge className="bg-accent-purple text-white">
          <Truck className="w-3 h-3 mr-1" />
          In Transit
        </Badge>
      )
    case 'at_track':
      return (
        <Badge className="bg-status-success text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          At Track
        </Badge>
      )
    case 'returned':
      return (
        <Badge variant="outline" className="text-text-secondary">
          <ArrowRight className="w-3 h-3 mr-1" />
          Returned
        </Badge>
      )
    case 'used':
      return (
        <Badge variant="outline" className="text-text-tertiary">
          Used
        </Badge>
      )
  }
}

// ============================================
// SHIPPING URGENCY INDICATOR
// ============================================

interface ShippingUrgencyProps {
  urgency: 'ok' | 'ship_now' | 'urgent' | 'too_late'
}

const ShippingUrgencyIndicator: React.FC<ShippingUrgencyProps> = ({ urgency }) => {
  switch (urgency) {
    case 'ok':
      return null
    case 'ship_now':
      return (
        <div className="flex items-center gap-1 text-status-warning text-sm">
          <Clock className="w-4 h-4" />
          Ship this week
        </div>
      )
    case 'urgent':
      return (
        <div className="flex items-center gap-1 text-accent-orange text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Express shipping required!
        </div>
      )
    case 'too_late':
      return (
        <div className="flex items-center gap-1 text-status-danger text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          May not arrive in time!
        </div>
      )
  }
}

// ============================================
// PART ALLOCATION ROW
// ============================================

interface PartAllocationRowProps {
  partType: SparePartType
  allocated: number
  required: number
  available: number
  status: 'ok' | 'low' | 'over'
  isEditing: boolean
  onAdd?: () => void
  onRemove?: () => void
}

const PartAllocationRow: React.FC<PartAllocationRowProps> = ({
  partType,
  allocated,
  required,
  available,
  status,
  isEditing,
  onAdd,
  onRemove
}) => {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${
      status === 'low' ? 'bg-status-danger/10' :
      status === 'over' ? 'bg-status-warning/10' :
      'bg-surface-medium'
    }`}>
      <div className="flex items-center gap-2">
        <PartTypeIcon type={partType} className="w-4 h-4 text-text-secondary" />
        <span className="text-sm text-text-primary">{SPARE_PART_NAMES[partType]}</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Current allocation */}
        <div className="flex items-center gap-1">
          <span className={`font-medium ${
            status === 'low' ? 'text-status-danger' :
            status === 'over' ? 'text-status-warning' :
            'text-text-primary'
          }`}>
            {allocated}
          </span>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-secondary">{required}</span>
        </div>
        
        {/* Edit controls */}
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRemove}
              disabled={allocated === 0}
              className="h-6 w-6 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onAdd}
              disabled={available === 0}
              className="h-6 w-6 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        {/* Available at HQ */}
        {isEditing && (
          <span className="text-xs text-text-tertiary">
            ({available} avail.)
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// RACE KIT CARD
// ============================================

interface RaceKitCardProps {
  kit: RaceSparesKit
  state: SparePartsState
  hqRegion: WorldRegion
  currentWeek: number
  currentYear: number
  isExpanded: boolean
  onToggle: () => void
  onAllocatePart?: (raceId: string, partType: SparePartType) => void
  onRemovePart?: (raceId: string, partType: SparePartType) => void
  onAutoAllocate?: (raceId: string) => void
  onShipKit?: (raceId: string, method: ShippingMethod) => void
}

const RaceKitCard: React.FC<RaceKitCardProps> = ({
  kit,
  state,
  hqRegion,
  currentWeek,
  currentYear,
  isExpanded,
  onToggle,
  onAllocatePart,
  onRemovePart,
  onAutoAllocate,
  onShipKit
}) => {
  const allocationStatus = getKitAllocationStatus(kit)
  const shippingUrgency = kit.status === 'planning' 
    ? getKitShippingUrgency(kit, hqRegion, currentWeek, currentYear)
    : 'ok'
  
  const weeksUntilRace = (kit.raceYear - currentYear) * 52 + (kit.raceWeek - currentWeek)
  
  // Get shipping options if planning
  const shippingOptions = kit.status === 'planning' 
    ? getShippingOptions(
        SPARE_PART_TYPES.map(type => ({ 
          type, 
          count: kit.allocatedParts[type].length 
        })).filter(p => p.count > 0),
        hqRegion,
        kit.trackRegion,
        currentWeek,
        currentYear
      )
    : []
  
  const totalAllocated = Object.values(kit.allocatedParts).reduce(
    (sum, parts) => sum + parts.length, 0
  )
  
  return (
    <Card className={`bg-surface-dark border-border-subtle ${
      shippingUrgency === 'urgent' || shippingUrgency === 'too_late' 
        ? 'border-status-danger/50' 
        : ''
    }`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-surface-medium/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-medium rounded-lg">
              <Flag className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <div className="font-medium text-text-primary">{kit.raceName}</div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="w-3 h-3" />
                {getRegionDisplayName(kit.trackRegion)}
                <span className="text-text-tertiary">•</span>
                <Calendar className="w-3 h-3" />
                Week {kit.raceWeek}, Year {kit.raceYear}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ShippingUrgencyIndicator urgency={shippingUrgency} />
            <KitStatusBadge status={kit.status} />
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </div>
        </div>
        
        {/* Quick summary */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Package className="w-4 h-4 text-text-secondary" />
            <span className={allocationStatus.isComplete ? 'text-status-success' : 'text-status-warning'}>
              {totalAllocated} parts allocated
            </span>
            {!allocationStatus.isComplete && (
              <span className="text-text-tertiary">(incomplete)</span>
            )}
          </div>
          <div className="text-sm text-text-secondary">
            {weeksUntilRace > 0 ? `${weeksUntilRace} weeks until race` : 'Race this week!'}
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="border-t border-border-subtle">
          {/* Allocation grid */}
          <div className="mb-4">
            <div className="text-sm font-medium text-text-secondary mb-2">
              Parts Allocation
            </div>
            <div className="space-y-1">
              {SPARE_PART_TYPES.map(partType => {
                const partStatus = allocationStatus.partStatus[partType]
                const availableAtHQ = countPartsByTypeAtLocation(state, partType, 'hq')
                
                return (
                  <PartAllocationRow
                    key={partType}
                    partType={partType}
                    allocated={partStatus.allocated}
                    required={partStatus.required}
                    available={availableAtHQ}
                    status={partStatus.status}
                    isEditing={kit.status === 'planning'}
                    onAdd={() => onAllocatePart?.(kit.raceId, partType)}
                    onRemove={() => onRemovePart?.(kit.raceId, partType)}
                  />
                )
              })}
            </div>
          </div>
          
          {/* Actions for planning kits */}
          {kit.status === 'planning' && (
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              {/* Auto-allocate button */}
              {!allocationStatus.isComplete && onAutoAllocate && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onAutoAllocate(kit.raceId)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Auto-Allocate Recommended Parts
                </Button>
              )}
              
              {/* Shipping options */}
              {totalAllocated > 0 && (
                <div>
                  <div className="text-sm font-medium text-text-secondary mb-2">
                    Ship to Track
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {shippingOptions.map(option => {
                      const config = SHIPPING_METHODS[option.method]
                      const willArriveInTime = option.arrivalYear < kit.raceYear || 
                        (option.arrivalYear === kit.raceYear && option.arrivalWeek < kit.raceWeek)
                      
                      return (
                        <Button
                          key={option.method}
                          variant={(option.method === 'standard' ? 'default' : 'outline') as ButtonVariant}
                          className={`flex-col h-auto py-3 ${
                            !willArriveInTime ? 'opacity-50' : ''
                          }`}
                          onClick={() => onShipKit?.(kit.raceId, option.method)}
                          disabled={!willArriveInTime}
                        >
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            ${option.cost.toLocaleString()}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            Arrives: Wk {option.arrivalWeek}
                            {!willArriveInTime && ' (Too late!)'}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Info for shipped kits */}
          {kit.status === 'shipping' && kit.shipmentId && (
            <div className="flex items-center gap-2 text-sm text-accent-purple">
              <Truck className="w-4 h-4" />
              <span>Kit is in transit to the track</span>
            </div>
          )}
          
          {/* Info for at-track kits */}
          {kit.status === 'at_track' && (
            <div className="flex items-center gap-2 text-sm text-status-success">
              <CheckCircle className="w-4 h-4" />
              <span>Kit has arrived and is ready for the race</span>
            </div>
          )}
          
          {/* Used parts info */}
          {kit.usedParts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="text-sm text-text-secondary">
                Parts used during race: <span className="text-text-primary">{kit.usedParts.length}</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface RaceAllocationPanelProps {
  state: SparePartsState
  hqRegion: WorldRegion
  currentWeek: number
  currentYear: number
  onAllocatePart?: (raceId: string, partType: SparePartType) => void
  onRemovePart?: (raceId: string, partType: SparePartType) => void
  onAutoAllocate?: (raceId: string) => void
  onShipKit?: (raceId: string, method: ShippingMethod) => void
}

export const RaceAllocationPanel: React.FC<RaceAllocationPanelProps> = ({
  state,
  hqRegion,
  currentWeek,
  currentYear,
  onAllocatePart,
  onRemovePart,
  onAutoAllocate,
  onShipKit
}) => {
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null)
  
  // Sort kits by race date
  const sortedKits = useMemo(() => {
    return [...state.raceSparesKits]
      .filter(kit => kit.status !== 'returned' && kit.status !== 'used')
      .sort((a, b) => {
        if (a.raceYear !== b.raceYear) return a.raceYear - b.raceYear
        return a.raceWeek - b.raceWeek
      })
  }, [state.raceSparesKits])
  
  const planningKits = sortedKits.filter(k => k.status === 'planning')
  const activeKits = sortedKits.filter(k => k.status === 'shipping' || k.status === 'at_track')
  
  // Count kits needing attention
  const urgentKits = planningKits.filter(kit => {
    const urgency = getKitShippingUrgency(kit, hqRegion, currentWeek, currentYear)
    return urgency === 'urgent' || urgency === 'too_late'
  })
  
  return (
    <div className="space-y-4">
      {/* Summary header */}
      <Card className="bg-surface-dark border-border-subtle">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-text-primary">{sortedKits.length}</div>
                <div className="text-sm text-text-secondary">Active Race Kits</div>
              </div>
              <div className="h-8 w-px bg-border-subtle" />
              <div>
                <div className="text-2xl font-bold text-accent-blue">{planningKits.length}</div>
                <div className="text-sm text-text-secondary">Planning</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-purple">{activeKits.filter(k => k.status === 'shipping').length}</div>
                <div className="text-sm text-text-secondary">In Transit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-status-success">{activeKits.filter(k => k.status === 'at_track').length}</div>
                <div className="text-sm text-text-secondary">At Track</div>
              </div>
            </div>
            
            {urgentKits.length > 0 && (
              <div className="flex items-center gap-2 text-status-danger">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{urgentKits.length} kit{urgentKits.length > 1 ? 's' : ''} need urgent shipping!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Kits list */}
      {sortedKits.length === 0 ? (
        <Card className="bg-surface-dark border-border-subtle">
          <CardContent className="py-12 text-center">
            <Flag className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-secondary">No upcoming race kits</p>
            <p className="text-sm text-text-tertiary mt-1">
              Race kits are automatically created 4 weeks before each race
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedKits.map(kit => (
            <RaceKitCard
              key={kit.raceId}
              kit={kit}
              state={state}
              hqRegion={hqRegion}
              currentWeek={currentWeek}
              currentYear={currentYear}
              isExpanded={expandedKitId === kit.raceId}
              onToggle={() => setExpandedKitId(
                expandedKitId === kit.raceId ? null : kit.raceId
              )}
              onAllocatePart={onAllocatePart}
              onRemovePart={onRemovePart}
              onAutoAllocate={onAutoAllocate}
              onShipKit={onShipKit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RaceAllocationPanel
