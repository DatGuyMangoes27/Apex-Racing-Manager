import { motion } from 'framer-motion'
import { Landmark } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { LoansPanel } from '@/components/finances/LoansPanel'

export default function Loans() {
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  if (!ownedTeam) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8"
      >
        <div className="glass-card p-8 text-center">
          <Landmark className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h2 className="text-xl font-display font-bold mb-2">No Team Owned</h2>
          <p className="text-text-muted">
            You need to own a team to access loans and financing options.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Landmark className="w-7 h-7 text-accent-orange" />
            Loans & Financing
          </h1>
          <p className="text-text-muted mt-1">
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
  )
}
