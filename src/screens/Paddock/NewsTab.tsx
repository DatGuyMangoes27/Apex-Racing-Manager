/**
 * NewsTab - Paddock News and Simulation Insights
 * 
 * Shows transfer news, driver movements, and simulation insights
 * about rising/declining drivers and teams.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Newspaper, TrendingUp, TrendingDown, Users, Building2,
  ArrowRight, Crown, Star, AlertTriangle, Calendar,
  Filter, RefreshCw, Trophy, Award, Flame, Snowflake,
  UserPlus, UserMinus, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { 
  useRivalStore, 
  RivalDriver, 
  Team, 
  Series,
  TransferNews 
} from '@/store/rivalStore'
import { useCareerStore } from '@/store/careerStore'

type ViewMode = 'all' | 'transfers' | 'insights'

export function NewsTab() {
  const { rivals, teams, series } = useRivalStore()
  const { player, careerState } = useCareerStore()
  const currentYear = careerState?.currentYear ?? new Date().getFullYear()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  
  // Get active drivers and teams
  const activeDrivers = useMemo(() => 
    rivals.filter(r => r.careerActive),
    [rivals]
  )
  
  // Calculate simulation insights
  const insights = useMemo(() => {
    // Rising Stars - young drivers showing improvement
    const risingStars = activeDrivers
      .filter(d => d.careerStage === 'rising' && d.age < 28 && d.currentForm > 0.05)
      .sort((a, b) => b.currentForm - a.currentForm)
      .slice(0, 5)
    
    // Declining Veterans - older drivers losing pace
    const decliningVeterans = activeDrivers
      .filter(d => (d.careerStage === 'declining' || d.careerStage === 'veteran') && d.currentForm < -0.05)
      .sort((a, b) => a.currentForm - b.currentForm)
      .slice(0, 5)
    
    // Peak Performers - drivers at their best
    const peakPerformers = activeDrivers
      .filter(d => d.careerStage === 'peak' && d.baseSkill >= 0.75)
      .sort((a, b) => b.baseSkill - a.baseSkill)
      .slice(0, 5)
    
    // Hot Teams - teams showing development progress
    const hotTeams = teams
      .filter(t => t.development && t.development.totalPoints > (t.development.seasonStartPoints || 50))
      .map(t => ({
        team: t,
        improvement: t.development!.totalPoints - (t.development!.seasonStartPoints || 50)
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5)
    
    // Struggling Teams - teams falling behind
    const strugglingTeams = teams
      .filter(t => t.development && t.development.totalPoints < (t.development.seasonStartPoints || 50))
      .map(t => ({
        team: t,
        decline: (t.development!.seasonStartPoints || 50) - t.development!.totalPoints
      }))
      .sort((a, b) => b.decline - a.decline)
      .slice(0, 5)
    
    // Contract Expirations - drivers with expiring contracts
    const contractExpirations = activeDrivers
      .filter(d => d.contractEndYear === currentYear)
      .slice(0, 10)
    
    // Retirement Watch - veterans who might retire
    const retirementWatch = activeDrivers
      .filter(d => d.age >= 36 || (d.careerStage === 'veteran' && d.baseSkill < 0.5))
      .sort((a, b) => b.age - a.age)
      .slice(0, 5)
    
    return {
      risingStars,
      decliningVeterans,
      peakPerformers,
      hotTeams,
      strugglingTeams,
      contractExpirations,
      retirementWatch
    }
  }, [activeDrivers, teams, currentYear])
  
  // Get series name helper
  const getSeriesName = (seriesId: string) => {
    const s = series.find(ser => ser.id === seriesId)
    return s?.shortName || seriesId
  }
  
  // Get team name helper
  const getTeamName = (teamId: string) => {
    const t = teams.find(team => team.id === teamId)
    return t?.shortName || teamId
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-red/20 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-accent-red" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Paddock News</h2>
            <p className="text-sm text-text-muted">Transfer news and simulation insights</p>
          </div>
        </div>
        
        {/* View Mode Filter */}
        <div className="flex gap-2">
          {(['all', 'transfers', 'insights'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${viewMode === mode 
                  ? 'bg-accent-red text-white' 
                  : 'bg-surface hover:bg-surface-secondary text-text-muted'
                }
              `}
            >
              {mode === 'all' ? 'All News' : mode === 'transfers' ? 'Transfers' : 'Insights'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Transfer News Section */}
        {(viewMode === 'all' || viewMode === 'transfers') && (
          <div className={viewMode === 'all' ? 'col-span-5' : 'col-span-12'}>
            <Card variant="glass" padding="md">
              <CardHeader 
                title="Transfer News" 
                icon={<RefreshCw className="w-4 h-4" />}
              />
              
              {false ? (
                <div className="space-y-3 mt-4">
                  {/* Transfer news feature coming soon */}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-50" />
                  <p className="text-text-muted">No transfer news yet</p>
                  <p className="text-xs text-text-muted mt-1">
                    News will appear after the season ends
                  </p>
                </div>
              )}
              
              {/* Contract Expirations */}
              {insights.contractExpirations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-surface-border">
                  <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Contracts Expiring This Year
                  </h4>
                  <div className="space-y-2">
                    {insights.contractExpirations.slice(0, 5).map(driver => (
                      <div 
                        key={driver.id}
                        className="flex items-center justify-between p-2 bg-surface rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center text-xs font-bold text-accent-orange">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{driver.firstName} {driver.lastName}</p>
                            <p className="text-xs text-text-muted">{getTeamName(driver.currentTeamId)}</p>
                          </div>
                        </div>
                        <Badge variant="orange" size="sm">Free Agent Soon</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Retirement Watch */}
              {insights.retirementWatch.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Retirement Watch
                  </h4>
                  <div className="space-y-2">
                    {insights.retirementWatch.map(driver => (
                      <div 
                        key={driver.id}
                        className="flex items-center justify-between p-2 bg-surface rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-xs font-bold text-gray-400">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{driver.firstName} {driver.lastName}</p>
                            <p className="text-xs text-text-muted">Age {driver.age}</p>
                          </div>
                        </div>
                        <Badge variant="default" size="sm">May Retire</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Simulation Insights Section */}
        {(viewMode === 'all' || viewMode === 'insights') && (
          <div className={viewMode === 'all' ? 'col-span-7' : 'col-span-12'}>
            <div className="grid grid-cols-2 gap-4">
              {/* Rising Stars */}
              <Card variant="glass" padding="md">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-status-success">
                  <TrendingUp className="w-4 h-4" />
                  Rising Stars
                </h4>
                {insights.risingStars.length > 0 ? (
                  <div className="space-y-2">
                    {insights.risingStars.map(driver => (
                      <DriverInsightItem 
                        key={driver.id} 
                        driver={driver} 
                        variant="rising"
                        getTeamName={getTeamName}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No rising stars currently
                  </p>
                )}
              </Card>

              {/* Peak Performers */}
              <Card variant="glass" padding="md">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-accent-gold">
                  <Crown className="w-4 h-4" />
                  Peak Performers
                </h4>
                {insights.peakPerformers.length > 0 ? (
                  <div className="space-y-2">
                    {insights.peakPerformers.map(driver => (
                      <DriverInsightItem 
                        key={driver.id} 
                        driver={driver} 
                        variant="peak"
                        getTeamName={getTeamName}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No peak performers currently
                  </p>
                )}
              </Card>

              {/* Declining Veterans */}
              <Card variant="glass" padding="md">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-accent-orange">
                  <TrendingDown className="w-4 h-4" />
                  Declining Veterans
                </h4>
                {insights.decliningVeterans.length > 0 ? (
                  <div className="space-y-2">
                    {insights.decliningVeterans.map(driver => (
                      <DriverInsightItem 
                        key={driver.id} 
                        driver={driver} 
                        variant="declining"
                        getTeamName={getTeamName}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No declining veterans currently
                  </p>
                )}
              </Card>

              {/* Hot Teams */}
              <Card variant="glass" padding="md">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-accent-red">
                  <Flame className="w-4 h-4" />
                  Hot Teams
                </h4>
                {insights.hotTeams.length > 0 ? (
                  <div className="space-y-2">
                    {insights.hotTeams.map(({ team, improvement }) => (
                      <TeamInsightItem 
                        key={team.id} 
                        team={team} 
                        change={improvement}
                        variant="hot"
                        getSeriesName={getSeriesName}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No hot teams currently
                  </p>
                )}
              </Card>

              {/* Struggling Teams - Full width */}
              <Card variant="glass" padding="md" className="col-span-2">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-blue-400">
                  <Snowflake className="w-4 h-4" />
                  Struggling Teams
                </h4>
                {insights.strugglingTeams.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {insights.strugglingTeams.map(({ team, decline }) => (
                      <TeamInsightItem 
                        key={team.id} 
                        team={team} 
                        change={-decline}
                        variant="struggling"
                        getSeriesName={getSeriesName}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No struggling teams currently
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Transfer News Item Component
function TransferNewsItem({ news }: { news: TransferNews }) {
  const getIcon = () => {
    switch (news.type) {
      case 'retirement': return <UserMinus className="w-4 h-4 text-gray-400" />
      case 'promotion': return <ArrowUpRight className="w-4 h-4 text-status-success" />
      case 'demotion': return <ArrowDownRight className="w-4 h-4 text-accent-orange" />
      default: return <RefreshCw className="w-4 h-4 text-text-muted" />
    }
  }
  
  const getBgColor = () => {
    switch (news.type) {
      case 'retirement': return 'bg-gray-500/10'
      case 'promotion': return 'bg-status-success/10'
      case 'demotion': return 'bg-accent-orange/10'
      default: return 'bg-surface'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-lg ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{news.headline}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            <span>{news.driverName}</span>
            {news.fromTeam && news.toTeam && (
              <>
                <span>•</span>
                <span>{news.fromTeam}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{news.toTeam}</span>
              </>
            )}
          </div>
        </div>
        <Badge 
          variant={
            news.type === 'retirement' ? 'default' :
            news.type === 'promotion' ? 'green' :
            'orange'
          }
          size="sm"
        >
          {news.type.charAt(0).toUpperCase() + news.type.slice(1)}
        </Badge>
      </div>
    </motion.div>
  )
}

// Driver Insight Item Component
interface DriverInsightItemProps {
  driver: RivalDriver
  variant: 'rising' | 'peak' | 'declining'
  getTeamName: (id: string) => string
}

function DriverInsightItem({ driver, variant, getTeamName }: DriverInsightItemProps) {
  const colors = {
    rising: { bg: 'bg-status-success/20', text: 'text-status-success' },
    peak: { bg: 'bg-accent-gold/20', text: 'text-accent-gold' },
    declining: { bg: 'bg-accent-orange/20', text: 'text-accent-orange' }
  }
  
  return (
    <div className="flex items-center justify-between p-2 bg-surface rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${colors[variant].bg} flex items-center justify-center text-xs font-bold ${colors[variant].text}`}>
          {driver.firstName[0]}{driver.lastName[0]}
        </div>
        <div>
          <p className="text-sm font-medium">{driver.firstName} {driver.lastName}</p>
          <p className="text-xs text-text-muted">{getTeamName(driver.currentTeamId)} • Age {driver.age}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xs font-bold ${colors[variant].text}`}>
          {variant === 'rising' && `+${(driver.currentForm * 100).toFixed(0)}%`}
          {variant === 'peak' && `${Math.round(driver.baseSkill * 100)} skill`}
          {variant === 'declining' && `${(driver.currentForm * 100).toFixed(0)}%`}
        </p>
        <p className="text-xs text-text-muted">
          {variant === 'rising' && 'form'}
          {variant === 'peak' && 'rating'}
          {variant === 'declining' && 'form'}
        </p>
      </div>
    </div>
  )
}

// Team Insight Item Component
interface TeamInsightItemProps {
  team: Team
  change: number
  variant: 'hot' | 'struggling'
  getSeriesName: (id: string) => string
}

function TeamInsightItem({ team, change, variant, getSeriesName }: TeamInsightItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-surface rounded-lg">
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: `${team.color}30`, color: team.color }}
        >
          {team.shortName.slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{team.shortName}</p>
          <p className="text-xs text-text-muted">{getSeriesName(team.seriesId)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xs font-bold ${variant === 'hot' ? 'text-accent-red' : 'text-blue-400'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}
        </p>
        <p className="text-xs text-text-muted">dev pts</p>
      </div>
    </div>
  )
}

export default NewsTab
