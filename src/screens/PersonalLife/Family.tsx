import { Users } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { FamilyPanel } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'

export function PersonalLifeFamily() {
  const { player, careerState, personalLifeState } = usePersonalLifeState()

  if (!player || !careerState || !personalLifeState) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family"
        subtitle={`${player.firstName} ${player.lastName} - Family & Relationships`}
        icon={<Users className="w-6 h-6" />}
      />
      
      <FamilyPanel
        partner={personalLifeState.partner}
        children={personalLifeState.children}
        familyTree={personalLifeState.familyTree}
        finances={personalLifeState.finances}
        currentWeek={careerState.currentWeek}
        currentYear={careerState.currentYear}
        pregnancy={(personalLifeState as any).pregnancy}
      />
    </div>
  )
}

export default PersonalLifeFamily
