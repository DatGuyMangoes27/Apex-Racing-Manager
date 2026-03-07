import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { useCareerStore, createDefaultExtendedFinancialState } from '@/store/careerStore'
import type { TeamTier } from '@/store/rivalStore'
import { MerchandiseDashboard } from '@/components/finances/MerchandiseDashboard'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

export default function Merchandise() {
  const { careerState, updateOwnedTeam } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam
  const [showIntroNudge, setShowIntroNudge] = useState(true)
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2024

  useEffect(() => {
    if (ownedTeam && !ownedTeam.finances?.extended) {
      updateOwnedTeam({
        finances: {
          ...ownedTeam.finances,
          extended: createDefaultExtendedFinancialState()
        }
      })
    }
  }, [ownedTeam?.id, ownedTeam?.finances?.extended, updateOwnedTeam])

  const merchandise = useMemo(() => {
    if (!ownedTeam?.finances?.extended?.merchandise) {
      return createDefaultExtendedFinancialState().merchandise
    }
    return ownedTeam.finances.extended.merchandise
  }, [ownedTeam?.finances?.extended?.merchandise])

  const teamTier: TeamTier = (ownedTeam?.tier as TeamTier) || 'amateur'

  if (!ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="p-[24px] flex flex-col gap-[24px]">
          <div className={`${CARD} p-[32px] text-center`}>
            <ShoppingBag className="w-[48px] h-[48px] mx-auto mb-[16px] text-[#4a5565]" />
            <h2 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No Team Owned</h2>
            <p className="text-[14px] text-[#4a5565]" style={FR}>
              You need to own a team to manage merchandise.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        <div className="flex items-center gap-[12px]">
          <ShoppingBag className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Merchandise</h1>
            <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>
              Design products, manage collections, and run your team store
            </p>
          </div>
        </div>

        {showIntroNudge && (
          <div className={`${CARD} p-[16px]`} style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
            <div className="flex items-start justify-between gap-[16px]">
              <p className="text-[14px] text-[#4a5565]" style={FR}>
                <span style={FBold}>Tip:</span> Add products in the Products tab, then use Stores → Manage to add them to your Team Online Store so they can sell.
              </p>
              <button
                onClick={() => setShowIntroNudge(false)}
                className="p-[6px] hover:bg-black/5 rounded-[8px] shrink-0 transition-colors"
              >
                <X className="w-[16px] h-[16px]" />
              </button>
            </div>
          </div>
        )}

        <MerchandiseDashboard
          merchandise={merchandise}
          currentWeek={currentWeek}
          currentYear={currentYear}
          teamTier={teamTier}
        />
      </div>
    </div>
  )
}
