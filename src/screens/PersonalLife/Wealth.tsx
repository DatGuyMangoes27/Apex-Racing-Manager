import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { PageHeader, Button, Modal, Card, CardHeader } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { WealthOverview, CollectionShowcase } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'

interface InvestorOffer {
  id: string
  investorName: string
  investorType: 'private_equity' | 'angel' | 'corporate' | 'consortium'
  amount: number
  equityPercent: number
  terms: string
}

export function PersonalLifeWealth() {
  const { player, careerState, personalLifeState, teamName } = usePersonalLifeState()
  const { injectCapital, withdrawFunds, setOwnerSalary, seekInvestors, acceptInvestorOffer } = usePersonalLifeActions()
  const { addToast } = useToast()
  const [pendingOffer, setPendingOffer] = useState<InvestorOffer | null>(null)

  if (!player || !careerState || !personalLifeState) return null

  const personalLife = personalLifeState ?? (careerState as any)?.personalLife
  const stockHoldings = (personalLife as any)?.stockHoldings ?? []
  const businessVentures = (personalLife as any)?.businessVentures ?? []
  const properties = (personalLife as any)?.properties ?? []

  const handleInjectCapital = (amount: number) => {
    const result = injectCapital(amount)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Capital Injected' : 'Failed',
      message: result.message
    })
  }

  const handleWithdrawFunds = (amount: number) => {
    const result = withdrawFunds(amount)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Funds Withdrawn' : 'Failed',
      message: result.message
    })
  }

  const handleSeekInvestors = () => {
    const result = seekInvestors()
    if (result.success && result.offer) {
      // Show the offer modal instead of just a toast
      setPendingOffer(result.offer)
    } else {
      addToast({
        type: 'warning',
        title: 'No Investors Found',
        message: result.message
      })
    }
  }
  
  const handleAcceptOffer = () => {
    if (!pendingOffer) return
    
    const result = acceptInvestorOffer(pendingOffer)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Investment Accepted!' : 'Failed',
      message: result.message
    })
    setPendingOffer(null)
  }
  
  const handleDeclineOffer = () => {
    addToast({
      type: 'info',
      title: 'Offer Declined',
      message: 'You can seek new investors at any time.'
    })
    setPendingOffer(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wealth & Investments"
        subtitle={`${player.firstName} ${player.lastName} - Financial Overview`}
        icon={<Wallet className="w-6 h-6" />}
      />
      
      <WealthOverview
        finances={personalLifeState.finances}
        teamEquity={personalLifeState.teamEquity}
        teamName={teamName}
        teamBalance={careerState.ownedTeam?.budgets?.cash ?? 0}
        currentWeek={careerState.currentWeek}
        currentYear={careerState.currentYear}
        onInjectCapital={handleInjectCapital}
        onWithdrawFunds={handleWithdrawFunds}
        onSeekInvestors={handleSeekInvestors}
        onSetOwnerSalary={setOwnerSalary}
        stockHoldings={stockHoldings}
        businessVentures={businessVentures}
        properties={properties}
      />

      {/* Collections */}
      {(careerState as any).expandedPersonalLife?.collections && (
        <CollectionShowcase
          collections={(careerState as any).expandedPersonalLife.collections}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
          bankBalance={player.finances.bankBalance}
        />
      )}
      
      {/* Investor Offer Modal */}
      <Modal
        isOpen={!!pendingOffer}
        onClose={() => setPendingOffer(null)}
        title="Investment Offer Received"
      >
        {pendingOffer && (
          <div className="space-y-4">
            <div className="p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
              <h3 className="font-bold text-lg">{pendingOffer.investorName}</h3>
              <p className="text-sm text-text-muted capitalize">
                {pendingOffer.investorType.replace(/_/g, ' ')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-sm text-text-muted">Investment Amount</p>
                <p className="font-mono font-bold text-xl text-status-success">
                  ${pendingOffer.amount.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-sm text-text-muted">Equity Requested</p>
                <p className="font-mono font-bold text-xl text-accent-gold">
                  {pendingOffer.equityPercent}%
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Terms & Conditions</p>
              <p className="font-medium">{pendingOffer.terms}</p>
            </div>
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                Your ownership will decrease from{' '}
                <span className="font-mono font-bold">
                  {personalLifeState.teamEquity?.ownershipPercent ?? 100}%
                </span>
                {' '}to{' '}
                <span className="font-mono font-bold">
                  {(personalLifeState.teamEquity?.ownershipPercent ?? 100) - pendingOffer.equityPercent}%
                </span>
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleDeclineOffer}>
                Decline
              </Button>
              <Button variant="primary" onClick={handleAcceptOffer}>
                Accept Investment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PersonalLifeWealth
