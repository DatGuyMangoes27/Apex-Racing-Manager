// ============================================
// RENT WAREHOUSE MODAL
// ============================================
// Choose a logistics hub to rent as a regional parts warehouse

import React from 'react'
import { MapPin, Warehouse } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import type { SparePartsState } from '@/store/careerStore'
import { LOGISTICS_HUBS, getRegionDisplayName } from '@/data/travel-logistics'

interface RentWarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  state: SparePartsState
  onRented?: () => void
}

export function RentWarehouseModal({ isOpen, onClose, state, onRented }: RentWarehouseModalProps) {
  const rentSparePartsWarehouse = useCareerStore(s => s.rentSparePartsWarehouse)

  const alreadyRentedHubIds = new Set(
    state.warehouses.filter(w => w.rentalActive).map(w => w.hubId)
  )
  const availableHubs = LOGISTICS_HUBS.filter(hub => !alreadyRentedHubIds.has(hub.id))

  const handleRent = (hubId: string) => {
    if (rentSparePartsWarehouse(hubId)) {
      onRented?.()
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rent a regional warehouse"
      subtitle="Store parts closer to races and reduce shipping costs"
      size="lg"
    >
      <div className="p-6">
        {availableHubs.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All hubs are already rented</p>
            <p className="text-sm mt-1">Deactivate a warehouse from the Inventory tab to free a slot.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {availableHubs.map(hub => (
              <div
                key={hub.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border-subtle bg-surface-dark hover:bg-surface-medium transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent-green mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary">{hub.name}</div>
                    <div className="text-sm text-text-secondary">
                      {getRegionDisplayName(hub.region)} • {hub.country}
                    </div>
                    {hub.description && (
                      <p className="text-xs text-text-tertiary mt-1">{hub.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span>Capacity: {hub.warehouseCapacity} parts</span>
                      <span>Freight: -{hub.freightReduction}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-lg font-semibold text-accent-green">
                    ${hub.rentalCostPerWeek.toLocaleString()}<span className="text-sm font-normal text-text-secondary">/wk</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-accent-green text-accent-green hover:bg-accent-green/10"
                    onClick={() => handleRent(hub.id)}
                  >
                    Rent
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
