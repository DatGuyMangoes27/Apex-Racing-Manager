import { motion } from 'framer-motion'
import { TrendingUp, Trophy, ChevronUp } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'

interface TeamRanking {
  teamId: string
  teamName: string
  totalPoints: number
  weeklyGain: number
}

interface DevelopmentRaceProps {
  ranking: TeamRanking[]
  playerTeamId?: string
}

export function DevelopmentRace({ 
  ranking, 
  playerTeamId 
}: DevelopmentRaceProps) {
  // Show top 6 teams
  const displayRanking = ranking.slice(0, 6)
  const maxPoints = displayRanking.length > 0 ? Math.max(...displayRanking.map(t => t.totalPoints), 1) : 100
  
  // Find player position
  const playerPosition = ranking.findIndex(t => t.teamId === playerTeamId) + 1
  const playerTeam = ranking.find(t => t.teamId === playerTeamId)
  
  return (
    <Card variant="glass" padding="md">
      <CardHeader 
        title="Development Race" 
        icon={<TrendingUp className="w-4 h-4 text-accent-red" />}
        action={
          playerPosition > 0 && (
            <Badge variant={playerPosition <= 3 ? 'green' : 'default'} size="sm">
              P{playerPosition}
            </Badge>
          )
        }
      />
      
      <div className="space-y-2">
        {displayRanking.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No development data available yet
          </p>
        ) : (
          displayRanking.map((team, index) => {
            const isPlayer = team.teamId === playerTeamId
            const progressPercent = maxPoints > 0 ? (team.totalPoints / maxPoints) * 100 : 0
            
            return (
              <motion.div
                key={team.teamId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isPlayer ? 'bg-accent-red/10 border border-accent-red/30' : 'bg-background/50'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-accent-gold text-black' : ''}
                      ${index === 1 ? 'bg-gray-400 text-black' : ''}
                      ${index === 2 ? 'bg-amber-700 text-white' : ''}
                      ${index > 2 ? 'bg-surface-secondary text-text-muted' : ''}
                    `}>
                      {index + 1}
                    </span>
                    <span className={`text-sm font-medium truncate ${isPlayer ? 'text-accent-red' : ''}`}>
                      {isPlayer ? 'You' : team.teamName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {team.weeklyGain > 0 && (
                      <span className="text-xs text-status-success flex items-center">
                        <ChevronUp className="w-3 h-3" />
                        +{team.weeklyGain.toFixed(0)}
                      </span>
                    )}
                    <span className="text-xs font-mono w-8 text-right">
                      {Math.round(team.totalPoints)}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${isPlayer ? 'bg-accent-red' : 'bg-status-info/50'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
              </motion.div>
            )
          })
        )}
      </div>
      
      {/* Leader Info */}
      {displayRanking.length > 0 && playerTeam && playerPosition > 1 && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Gap to leader</span>
            <span className="text-status-warning font-mono">
              -{Math.round(displayRanking[0].totalPoints - playerTeam.totalPoints)} pts
            </span>
          </div>
        </div>
      )}
      
      {playerPosition === 1 && playerTeam && displayRanking.length > 1 && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1">
              <Trophy className="w-3 h-3 text-accent-gold" />
              Leading by
            </span>
            <span className="text-status-success font-mono">
              +{Math.round(playerTeam.totalPoints - (displayRanking[1]?.totalPoints || 0))} pts
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

