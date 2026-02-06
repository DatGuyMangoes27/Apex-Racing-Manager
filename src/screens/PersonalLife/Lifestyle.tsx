import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { LifestylePanel, HobbyProgress, VacationPlanner } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'

export function PersonalLifeLifestyle() {
  const { player, careerState, personalLifeState } = usePersonalLifeState()

  if (!player || !careerState || !personalLifeState) return null

  const expandedState = (careerState as any).expandedPersonalLife

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lifestyle & Health"
        subtitle={`${player.firstName} ${player.lastName} - Health & Wellbeing`}
        icon={<Activity className="w-6 h-6" />}
      />
      
      <LifestylePanel
        health={personalLifeState.health}
        lifestyleLevel={personalLifeState.lifestyleLevel}
        hobbies={personalLifeState.hobbies}
        staff={personalLifeState.staff}
        finances={personalLifeState.finances}
        currentWeek={careerState.currentWeek}
        currentYear={careerState.currentYear}
      />
      
      {/* Hobby Deep Dive */}
      {expandedState?.hobbies && (
        <HobbyProgress
          hobbies={expandedState.hobbies}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
        />
      )}
      
      {/* Vacation Planner */}
      {expandedState?.travel && (
        <VacationPlanner
          travel={expandedState.travel}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
          bankBalance={player.finances.bankBalance}
        />
      )}
    </div>
  )
}

export default PersonalLifeLifestyle
