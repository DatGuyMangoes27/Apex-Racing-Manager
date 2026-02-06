import { User } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { PersonalLifeDashboard, RetirementPlanner } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'

export function PersonalLife() {
  const { player, careerState, personalLifeState, teamName } = usePersonalLifeState()

  if (!player || !careerState || !personalLifeState) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Life"
        subtitle={`${player.firstName} ${player.lastName} - Personal Management`}
        icon={<User className="w-6 h-6" />}
      />
      
      <PersonalLifeDashboard
        state={personalLifeState}
        currentWeek={careerState.currentWeek}
        currentYear={careerState.currentYear}
        teamName={teamName}
        onUpdateState={(updates) => {
          // This will be implemented to update personal life state in the store
          console.log('Personal life state update:', updates)
        }}
      />
      
      {/* Retirement Planner (shows when expanded state exists) */}
      {(careerState as any).expandedPersonalLife?.retirement && (
        <RetirementPlanner
          retirement={(careerState as any).expandedPersonalLife.retirement}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
          playerAge={(player as any).age || 25}
          yearsInSport={careerState.currentYear - ((careerState as any).careerStartYear || careerState.currentYear)}
          totalWins={player.totalWins || 0}
          totalChampionships={(player as any).championships || 0}
          bankBalance={player.finances.bankBalance}
        />
      )}
    </div>
  )
}

export default PersonalLife
