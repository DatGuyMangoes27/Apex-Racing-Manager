import { User } from 'lucide-react'
import { PersonalLifeDashboard, RetirementPlanner } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

export function PersonalLife() {
  const { player, careerState, personalLifeState, teamName } = usePersonalLifeState()

  if (!player || !careerState || !personalLifeState) return null

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Page Header */}
        <div className="flex items-center gap-[12px]">
          <User className="w-[24px] h-[24px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>
              Personal Life
            </h1>
            <p className="text-[14px] text-[#4a5565]" style={FR}>
              {`${player.firstName} ${player.lastName} - Personal Management`}
            </p>
          </div>
        </div>
        
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
    </div>
  )
}

export default PersonalLife
