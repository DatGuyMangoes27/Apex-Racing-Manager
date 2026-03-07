import { motion } from 'framer-motion'
import { Landmark } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { LoansPanel } from '@/components/finances/LoansPanel'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

export default function Loans() {
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  if (!ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="p-[24px] flex flex-col gap-[24px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`${CARD} p-[32px] text-center`}>
              <Landmark className="w-[48px] h-[48px] mx-auto mb-[16px] text-[#4a5565]" />
              <h2 className="text-[22px] text-[#0a0a0a] tracking-[-0.5px] mb-[8px]" style={FB}>No Team Owned</h2>
              <p className="text-[15px] text-[#4a5565]" style={FR}>
                You need to own a team to access loans and financing options.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col gap-[24px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-[12px]">
                <Landmark className="w-[28px] h-[28px] text-[#0a0a0a]" />
                <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>
                  Loans & Financing
                </h1>
              </div>
              <p className="text-[14px] text-[#4a5565] mt-[4px] ml-[40px]" style={FR}>
                Manage bank loans, credit lines, and private investors
              </p>
            </div>
          </div>

          {/* Loans Panel */}
          <LoansPanel 
            teamId={ownedTeam.id}
            tier={ownedTeam.tier}
          />
        </motion.div>
      </div>
    </div>
  )
}
