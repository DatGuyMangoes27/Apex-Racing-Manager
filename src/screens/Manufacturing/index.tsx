import { useState } from 'react'
import { Factory, Package, Flag, AlertTriangle } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { PartsInventoryDashboard, ManufacturingQueue, RaceAllocationPanel, RentWarehouseModal } from '@/components/logistics'
import { wouldNotificationDeliver } from '@/services/notificationRouter'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

type ManufacturingTab = 'inventory' | 'production' | 'race-kits'

export default function Manufacturing() {
  const { careerState } = useCareerStore()
  const [activeTab, setActiveTab] = useState<ManufacturingTab>('inventory')
  const [rentWarehouseOpen, setRentWarehouseOpen] = useState(false)

  const ownedTeam = careerState?.ownedTeam
  const spareParts = ownedTeam?.spareParts
  const manufacturingLevel = ownedTeam?.facilities?.manufacturing?.level ?? 1
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2026
  const hqRegion = 'europe' as any

  if (!spareParts) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="p-[24px] flex flex-col gap-[24px]">
          <div className="flex items-center gap-[12px]">
            <Factory className="w-[28px] h-[28px] text-[#0a0a0a]" />
            <div>
              <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Manufacturing &amp; Logistics</h1>
              <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>Manage your spare parts production, inventory, and race shipments</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-[80px] text-center">
            <Factory className="w-[64px] h-[64px] text-[#4a5565] opacity-40 mb-[16px]" />
            <p className="text-[18px] text-[#0a0a0a]" style={FBold}>No Spare Parts System</p>
            <p className="text-[14px] text-[#4a5565] mt-[4px] max-w-[480px]" style={FR}>
              Your team doesn't have a spare parts system set up yet. This will become available as your team grows.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'inventory' as const, label: 'Inventory', icon: <Package className="w-[16px] h-[16px]" /> },
    { id: 'production' as const, label: 'Production Queue', icon: <Factory className="w-[16px] h-[16px]" /> },
    { id: 'race-kits' as const, label: 'Race Kits', icon: <Flag className="w-[16px] h-[16px]" /> },
  ]

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        <div className="flex items-center gap-[12px]">
          <Factory className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Manufacturing &amp; Logistics</h1>
            <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>Manage your spare parts production, inventory, and race shipments</p>
          </div>
        </div>

        {(() => {
          const deliveryCheck = wouldNotificationDeliver('manufacturing')
          if (deliveryCheck.quality !== 'full' && deliveryCheck.missingRole) {
            return (
              <div className="flex items-center gap-[8px] p-[12px] rounded-[12px] bg-[#fffbeb] border-[0.8px] border-[#f59e0b]/30 text-[14px]" style={FR}>
                <AlertTriangle className="w-[16px] h-[16px] text-[#f59e0b] flex-shrink-0" />
                <span className="text-[#92400e]">
                  Manufacturing alerts may be {deliveryCheck.quality === 'missed' ? 'missed' : 'delayed'} —{' '}
                  hire a <span style={FBold}>{deliveryCheck.missingRole}</span> for full coverage
                </span>
              </div>
            )
          }
          return null
        })()}

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
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'inventory' && (
          <PartsInventoryDashboard
            state={spareParts}
            manufacturingLevel={manufacturingLevel}
            onOrderParts={() => setActiveTab('production')}
            onManufactureParts={() => setActiveTab('production')}
            onShipParts={() => setActiveTab('race-kits')}
            onViewRaceKits={() => setActiveTab('race-kits')}
            onAddWarehouse={() => setRentWarehouseOpen(true)}
          />
        )}

        {activeTab === 'production' && (
          <ManufacturingQueue
            state={spareParts}
            manufacturingLevel={manufacturingLevel}
            currentWeek={currentWeek}
            currentYear={currentYear}
          />
        )}

        {activeTab === 'race-kits' && (
          <RaceAllocationPanel
            state={spareParts}
            hqRegion={hqRegion}
            currentWeek={currentWeek}
            currentYear={currentYear}
          />
        )}

        <RentWarehouseModal
          isOpen={rentWarehouseOpen}
          onClose={() => setRentWarehouseOpen(false)}
          state={spareParts}
        />
      </div>
    </div>
  )
}
