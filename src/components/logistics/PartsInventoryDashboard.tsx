// ============================================
// SPARE PARTS INVENTORY DASHBOARD
// ============================================
// Main dashboard for viewing and managing spare parts inventory

import React from 'react'
  switch (type) {
    case 'engine': return <Gauge className={className} />
    case 'chassis': return <Car className={className} />
    case 'brakes': return <CircleDot className={className} />
    case 'suspension': return <ArrowUpDown className={className} />
    case 'gearbox': return <Cog className={className} />
  }
}

// ============================================
// INVENTORY SUMMARY CARD
// ============================================

interface InventorySummaryCardProps {
  state: SparePartsState
  manufacturingLevel: number
}

const InventorySummaryCard: React.FC<InventorySummaryCardProps> = ({ state, _manufacturingLevel }) => {
  const totalSummary = getTotalInventorySummary(state)
  const totalParts = Object.values(totalSummary).reduce((sum, s) => sum + s.count, 0)
  const totalValue = Object.values(totalSummary).reduce((sum, s) => sum + s.totalValue, 0)
  
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-accent-blue" />
          Total Inventory
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-text-primary">{totalParts}</div>
            <div className="text-sm text-text-secondary">Total Parts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-green">
              ${(totalValue / 1000).toFixed(0)}K
            </div>
            <div className="text-sm text-text-secondary">Total Value</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {SPARE_PART_TYPES.map(partType => {
            const summary = totalSummary[partType]
            return (
              <div key={partType} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <PartTypeIcon type={partType} className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-primary">{SPARE_PART_NAMES[partType]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">{summary.count}</span>
                  {summary.avgQuality > 0 && (
                    <span className={`text-xs ${getQualityColorClass(summary.avgQuality)}`}>
                      {summary.avgQuality}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// HQ STORAGE CARD
// ============================================

interface HQStorageCardProps {
  state: SparePartsState
  manufacturingLevel: number
  onManageClick?: () => void
}

const HQStorageCard: React.FC<HQStorageCardProps> = ({ state, manufacturingLevel, onManageClick }) => {
  const hqCapacity = getHQCapacityInfo(state, manufacturingLevel)
  const hqSummary = getInventorySummary(state, 'hq')
  const capacityPercent = Math.round((hqCapacity.current / hqCapacity.max) * 100)
  
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Factory className="w-5 h-5 text-accent-orange" />
            HQ Storage
          </CardTitle>
          {onManageClick && (
            <Button variant="ghost" size="sm" onClick={onManageClick}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Capacity bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Capacity</span>
            <span className="text-text-primary">{hqCapacity.current} / {hqCapacity.max}</span>
          </div>
          <div className="h-2 bg-surface-medium rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                capacityPercent > 90 ? 'bg-status-danger' :
                capacityPercent > 70 ? 'bg-status-warning' :
                'bg-accent-blue'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
        
        {/* Parts breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {SPARE_PART_TYPES.map(partType => {
            const summary = hqSummary[partType]
            return (
              <div key={partType} className="flex items-center gap-1.5 text-sm">
                <PartTypeIcon type={partType} className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-text-primary">{summary.count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// ACTIVE OPERATIONS CARD
// ============================================

interface ActiveOperationsCardProps {
  state: SparePartsState
  manufacturingLevel: number
}

const ActiveOperationsCard: React.FC<ActiveOperationsCardProps> = ({ state, _manufacturingLevel }) => {
  const shipmentsSummary = getShipmentsSummary(state)
  const ordersSummary = getOrdersSummary(state)
  const mfgStatus = getManufacturingQueueStatus(state)
  
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-purple" />
          Active Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Shipments */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary">In Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={shipmentsSummary.inTransit > 0 ? 'default' : 'secondary'}>
              {shipmentsSummary.inTransit} shipments
            </Badge>
            <span className="text-xs text-text-secondary">
              ({shipmentsSummary.partsInTransit} parts)
            </span>
          </div>
        </div>
        
        {/* Orders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary">Pending Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={ordersSummary.pending > 0 ? 'default' : 'secondary'}>
              {ordersSummary.pending} orders
            </Badge>
            <span className="text-xs text-text-secondary">
              ({ordersSummary.totalParts} parts)
            </span>
          </div>
        </div>
        
        {/* Manufacturing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary">Manufacturing</span>
          </div>
          <div className="flex items-center gap-2">
            {mfgStatus.currentJob ? (
              <>
                <Badge variant="default" className="bg-accent-orange text-white">
                  In Progress
                </Badge>
                <span className="text-xs text-text-secondary">
                  +{mfgStatus.queuedJobs} queued
                </span>
              </>
            ) : (
              <Badge variant="secondary">Idle</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// WAREHOUSE LIST
// ============================================

interface WarehouseListProps {
  state: SparePartsState
  onWarehouseClick?: (warehouseId: string) => void
  onAddWarehouse?: () => void
}

const WarehouseList: React.FC<WarehouseListProps> = ({ state, onWarehouseClick, onAddWarehouse }) => {
  const activeWarehouses = getActiveWarehouses(state)
  
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-accent-green" />
            Regional Warehouses
          </CardTitle>
          {onAddWarehouse && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddWarehouse}
              className="border-accent-green text-accent-green hover:bg-accent-green/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Rent Warehouse
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeWarehouses.length === 0 ? (
          <div className="text-center py-6 text-text-secondary">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No regional warehouses active</p>
            <p className="text-xs mb-4">Rent warehouses to store parts closer to races</p>
            {onAddWarehouse && (
              <Button 
                onClick={onAddWarehouse}
                className="bg-accent-green hover:bg-accent-green/80 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Rent Your First Warehouse
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {activeWarehouses.map(warehouse => {
              const summary = getInventorySummary(state, warehouse.id)
              const totalParts = Object.values(summary).reduce((sum, s) => sum + s.count, 0)
              const capacityPercent = Math.round((totalParts / warehouse.capacity) * 100)
              
              return (
                <div 
                  key={warehouse.id}
                  className="p-3 bg-surface-medium rounded-lg cursor-pointer hover:bg-surface-light transition-colors"
                  onClick={() => onWarehouseClick?.(warehouse.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-text-primary">{warehouse.name}</div>
                      <div className="text-xs text-text-secondary">
                        {getRegionDisplayName(warehouse.region)} • {warehouse.country}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      ${warehouse.weeklyRentalCost.toLocaleString()}/wk
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-dark rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          capacityPercent > 90 ? 'bg-status-danger' :
                          capacityPercent > 70 ? 'bg-status-warning' :
                          'bg-accent-blue'
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary">
                      {totalParts}/{warehouse.capacity}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// QUICK ACTIONS
// ============================================

interface QuickActionsProps {
  onOrderParts?: () => void
  onManufactureParts?: () => void
  onShipParts?: () => void
  onViewRaceKits?: () => void
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onOrderParts,
  onManufactureParts,
  onShipParts,
  onViewRaceKits
}) => {
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={onOrderParts}
          >
            <Package className="w-4 h-4 mr-2 text-accent-blue" />
            <div className="text-left">
              <div className="font-medium">Order Parts</div>
              <div className="text-xs text-text-secondary">From manufacturers</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={onManufactureParts}
          >
            <Factory className="w-4 h-4 mr-2 text-accent-orange" />
            <div className="text-left">
              <div className="font-medium">Manufacture</div>
              <div className="text-xs text-text-secondary">In-house production</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={onShipParts}
          >
            <Truck className="w-4 h-4 mr-2 text-accent-purple" />
            <div className="text-left">
              <div className="font-medium">Ship Parts</div>
              <div className="text-xs text-text-secondary">To warehouses/races</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={onViewRaceKits}
          >
            <ArrowRight className="w-4 h-4 mr-2 text-accent-green" />
            <div className="text-left">
              <div className="font-medium">Race Kits</div>
              <div className="text-xs text-text-secondary">Allocate for races</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN DASHBOARD
// ============================================

interface PartsInventoryDashboardProps {
  state: SparePartsState
  manufacturingLevel: number
  onOrderParts?: () => void
  onManufactureParts?: () => void
  onShipParts?: () => void
  onViewRaceKits?: () => void
  onWarehouseClick?: (warehouseId: string) => void
  onAddWarehouse?: () => void
  onManageHQ?: () => void
}

export const PartsInventoryDashboard: React.FC<PartsInventoryDashboardProps> = ({
  state,
  manufacturingLevel,
  onOrderParts,
  onManufactureParts,
  onShipParts,
  onViewRaceKits,
  onWarehouseClick,
  onAddWarehouse,
  onManageHQ
}) => {
  return (
    <div className="space-y-4">
      {/* Top row - Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InventorySummaryCard state={state} manufacturingLevel={manufacturingLevel} />
        <HQStorageCard 
          state={state} 
          manufacturingLevel={manufacturingLevel} 
          onManageClick={onManageHQ}
        />
        <ActiveOperationsCard state={state} manufacturingLevel={manufacturingLevel} />
      </div>
      
      {/* Middle row - Warehouses and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WarehouseList 
          state={state}
          onWarehouseClick={onWarehouseClick}
          onAddWarehouse={onAddWarehouse}
        />
        <QuickActions
          onOrderParts={onOrderParts}
          onManufactureParts={onManufactureParts}
          onShipParts={onShipParts}
          onViewRaceKits={onViewRaceKits}
        />
      </div>
    </div>
  )
}

export default PartsInventoryDashboard
