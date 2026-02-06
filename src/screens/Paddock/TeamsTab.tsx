import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  Users,
  Factory,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  History,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'

// Get unique manufacturers from teams
  const manufacturers = useMemo(() => {
    const manuIds = new Set<string>()
    teams.forEach(t => {
      if (t.manufacturerId) manuIds.add(t.manufacturerId)
    })
    return Array.from(manuIds).map(id => {
      const manu = getManufacturerById(id)
      return manu || { id, name: id }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [teams])

  // Calculate team performance from standings
  const getTeamPerformance = (team: Team): { wins: number; podiums: number; points: number } => {
    const standings = seasonStandings[team.seriesId] || []
    const teamStandings = standings.filter(s => s.teamId === team.id)
    return {
      wins: teamStandings.reduce((sum, s) => sum + s.wins, 0),
      podiums: teamStandings.reduce((sum, s) => sum + s.podiums, 0),
      points: teamStandings.reduce((sum, s) => sum + s.points, 0)
    }
  }

  // All teams with performance data
  const allTeamsWithData = useMemo(() => {
    return teams.map(team => ({
      team,
      series: getSeriesById(team.seriesId),
      performance: getTeamPerformance(team),
      isInYourSeries: enteredSeriesIds.includes(team.seriesId)
    }))
  }, [teams, getSeriesById, enteredSeriesIds, seasonStandings])

  // Filter and sort competitor teams
  const filteredTeams = useMemo(() => {
    let result = [...allTeamsWithData]

    // Filter by your series or all
    if (filter === 'your-series') {
      result = result.filter(t => t.isInYourSeries)
    }

    // Filter by championship
    if (selectedChampionship !== 'all') {
      result = result.filter(t => t.team.seriesId === selectedChampionship)
    }

    // Filter by manufacturer
    if (selectedManufacturer !== 'all') {
      result = result.filter(t => t.team.manufacturerId === selectedManufacturer)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t => 
        t.team.name.toLowerCase().includes(query) ||
        t.team.shortName.toLowerCase().includes(query) ||
        t.team.country.toLowerCase().includes(query) ||
        t.series?.name.toLowerCase().includes(query)
      )
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sort) {
        case 'performance': return b.performance.points - a.performance.points
        case 'prestige': return b.team.prestige - a.team.prestige
        case 'budget': {
          const budgetOrder: Record<string, number> = { 'factory': 4, 'high': 3, 'medium': 2, 'low': 1 }
          return (budgetOrder[b.team.budget] || 0) - (budgetOrder[a.team.budget] || 0)
        }
        case 'name': return a.team.name.localeCompare(b.team.name)
        default: return 0
      }
    })

    return result
  }, [allTeamsWithData, filter, sort, searchQuery, selectedChampionship, selectedManufacturer])

  // Competitor stats
  const stats = useMemo(() => {
    const competitorsInYourSeries = allTeamsWithData.filter(t => t.isInYourSeries)
    return {
      competitorsInSeries: competitorsInYourSeries.length,
      totalWins: competitorsInYourSeries.reduce((sum, t) => sum + t.performance.wins, 0),
      leadingTeam: competitorsInYourSeries.sort((a, b) => b.performance.points - a.performance.points)[0]?.team.name || 'N/A'
    }
  }, [allTeamsWithData])

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    setShowTeamModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Competitor Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-red/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent-red" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.competitorsInSeries}</p>
              <p className="text-sm text-text-muted">Competitors in Your Series</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-accent-gold">{stats.totalWins}</p>
              <p className="text-sm text-text-muted">Competitor Wins</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center">
              <Medal className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-lg font-display font-bold truncate">{stats.leadingTeam}</p>
              <p className="text-sm text-text-muted">Leading Team</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters - Competitor Analysis */}
      <Card variant="glass" padding="md">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search competitor teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
            />
          </div>

          {/* Your Series vs All Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
          >
            <option value="your-series">Your Series Only</option>
            <option value="all">All Teams</option>
          </select>

          {/* Championship Filter */}
          <select
            value={selectedChampionship}
            onChange={(e) => setSelectedChampionship(e.target.value)}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
          >
            <option value="all">All Championships</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>{s.shortName}</option>
            ))}
          </select>

          {/* Manufacturer Filter */}
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
          >
            <option value="all">All Manufacturers</option>
            {manufacturers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
          >
            <option value="performance">Sort: Performance</option>
            <option value="prestige">Sort: Prestige</option>
            <option value="budget">Sort: Budget</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </Card>

      {/* Competitor Team List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTeams.map(({ team, series, performance, isInYourSeries }, index) => {
            // Get team drivers
            const teamDrivers = rivals.filter(r => r.currentTeamId === team.id && r.careerActive)
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleTeamClick(team)}
                className="cursor-pointer"
              >
                <Card 
                  variant="glass" 
                  padding="none"
                  className={`
                    overflow-hidden transition-all hover:scale-[1.005]
                    ${isInYourSeries ? 'border-accent-red/30 hover:border-accent-red/50' : ''}
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Team Logo */}
                      <TeamLogo
                        src={getTeamLogo(team.id)}
                        name={team.shortName}
                        primaryColor={team.color}
                        size="xl"
                      />

                      {/* Team Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold truncate">{team.name}</h3>
                          <span className="text-xs text-text-muted">({team.country})</span>
                          {isInYourSeries && (
                            <Badge variant="red" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              Competitor
                            </Badge>
                          )}
                          {team.programType === 'works' && (
                            <Badge variant="green" size="sm">
                              <Factory className="w-3 h-3 mr-1" />
                              Works
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mb-2">{series?.name || 'Unknown Series'}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-accent-gold" />
                            Prestige: {team.prestige}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <DollarSign className="w-3 h-3 text-status-success" />
                            {team.budget} Budget
                          </span>
                          <span className="text-text-muted capitalize">
                            {team.facilities} facilities
                          </span>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex items-center gap-4 text-center">
                        <div>
                          <p className="font-bold text-lg text-accent-gold">{performance.wins}</p>
                          <p className="text-xs text-text-muted">Wins</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-accent-orange">{performance.podiums}</p>
                          <p className="text-xs text-text-muted">Podiums</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg">{performance.points}</p>
                          <p className="text-xs text-text-muted">Points</p>
                        </div>
                      </div>

                      {/* Development Trend */}
                      <div className="text-right">
                        {(() => {
                          const dev = team.development
                          const trajectory = dev && dev.totalPoints > (dev.seasonStartPoints || 50) ? 'improving' :
                                            dev && dev.totalPoints < (dev.seasonStartPoints || 50) ? 'declining' :
                                            null
                          return (
                            <Badge 
                              variant={
                                trajectory === 'improving' ? 'green' :
                                trajectory === 'declining' ? 'orange' :
                                'default'
                              }
                            >
                              {trajectory === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                              {trajectory === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                              {!trajectory && <Minus className="w-3 h-3 mr-1" />}
                              {trajectory || 'Stable'}
                            </Badge>
                          )
                        })()}
                        <p className="text-xs text-text-muted mt-1">
                          {teamDrivers.length} driver{teamDrivers.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredTeams.length === 0 && (
          <Card variant="glass" padding="lg">
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">
                {filter === 'your-series' && seriesEntries.length === 0 
                  ? 'Enter a series to see competitor teams' 
                  : 'No teams match your filters'
                }
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Team Detail Modal - Competitor Intel */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title="Competitor Intel"
        size="md"
      >
        {selectedTeam && (
          <TeamDetailView 
            team={selectedTeam}
            series={getSeriesById(selectedTeam.seriesId)}
            ownedTeam={ownedTeam ?? undefined}
            performance={getTeamPerformance(selectedTeam)}
            seasonStandings={seasonStandings[selectedTeam.seriesId] || []}
          />
        )}
      </Modal>
    </div>
  )
}

// Team Detail Component - Competitor Intel View
interface TeamDetailViewProps {
  team: Team
  series?: Series
  ownedTeam?: OwnedTeam
  performance: { wins: number; podiums: number; points: number }
  seasonStandings: SeasonStanding[]
}

function TeamDetailView({ team, series, ownedTeam, performance, seasonStandings }: TeamDetailViewProps) {
  const { rivals } = useRivalStore()
  const manufacturer = team.manufacturerId ? getManufacturerById(team.manufacturerId) : null
  const narrative = getTeamNarrative(team.id)
  
  // Get team drivers from rivals
  const teamDrivers = rivals.filter(r => r.currentTeamId === team.id && r.careerActive)
  
  // Get driver standings
  const _driverStandings = seasonStandings.filter(s => s.teamId === team.id)
  
  // Calculate development status
  const development = team.development
  const isImproving = development && development.totalPoints > (development.seasonStartPoints || 50)
  const isDeclining = development && development.totalPoints < (development.seasonStartPoints || 50)
  
  // Determine trajectory
  const getTrajectory = () => {
    if (narrative?.currentTrajectory) return narrative.currentTrajectory
    if (isImproving) return 'A team on the rise, showing consistent development'
    if (isDeclining) return 'Struggling to find pace, falling behind in development'
    return 'Maintaining steady performance'
  }
  
  // Comparison with your team
  const _yourTeamBudgetOrder: Record<string, number> = { 'factory': 4, 'high': 3, 'medium': 2, 'low': 1 }
  const canCompare = ownedTeam !== undefined

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <TeamLogo
          src={getTeamLogo(team.id)}
          name={team.shortName}
          primaryColor={team.color}
          size="2xl"
        />
        <div className="flex-1">
          <h3 className="font-display font-bold text-2xl">{team.name}</h3>
          <p className="text-text-muted">
            {series?.name || 'Unknown Series'} • {team.country}
            {manufacturer && ` • ${manufacturer.name}`}
          </p>
        </div>
        <div className="text-right">
          {/* Development Trajectory */}
          <Badge 
            variant={
              isImproving ? 'green' :
              isDeclining ? 'orange' :
              'default'
            }
            size="md"
          >
            {isImproving && <TrendingUp className="w-4 h-4 mr-1" />}
            {isDeclining && <TrendingDown className="w-4 h-4 mr-1" />}
            {!isImproving && !isDeclining && <Minus className="w-4 h-4 mr-1" />}
            {isImproving ? 'Rising' : isDeclining ? 'Struggling' : 'Stable'}
          </Badge>
        </div>
      </div>
      
      {/* Season Performance Summary */}
      <Card variant="glass" padding="md">
        <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Season Performance
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="font-bold text-2xl text-accent-gold">{performance.wins}</p>
            <p className="text-xs text-text-muted">Wins</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="font-bold text-2xl text-accent-orange">{performance.podiums}</p>
            <p className="text-xs text-text-muted">Podiums</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="font-bold text-2xl">{performance.points}</p>
            <p className="text-xs text-text-muted">Points</p>
          </div>
        </div>
      </Card>

      {/* Team Story Section - NEW */}
      {narrative && (
        <div className="space-y-4">
          {/* Origin Story */}
          <Card variant="glass" padding="md">
            <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Team Story
            </h4>
            <p className="text-sm text-text-secondary italic mb-3">"{narrative.origin}"</p>
            {narrative.foundingStory && (
              <p className="text-sm text-text-secondary">{narrative.foundingStory}</p>
            )}
          </Card>

          {/* Philosophy & Culture */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="glass" padding="md">
              <h4 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                <Quote className="w-3 h-3" />
                Philosophy
              </h4>
              <p className="text-sm">{narrative.philosophy}</p>
            </Card>
            <Card variant="glass" padding="md">
              <h4 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                <Globe2 className="w-3 h-3" />
                Cultural Identity
              </h4>
              <p className="text-sm">{narrative.culturalIdentity}</p>
            </Card>
          </div>

          {/* Reputation & Standing */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="glass" padding="md">
              <h4 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                <Wrench className="w-3 h-3" />
                Technical Reputation
              </h4>
              <p className="text-sm">{narrative.technicalReputation}</p>
            </Card>
            <Card variant="glass" padding="md">
              <h4 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Paddock Standing
              </h4>
              <p className="text-sm">{narrative.paddockStanding}</p>
            </Card>
          </div>

          {/* Achievements */}
          {(narrative.achievements?.length > 0 || narrative.titleCount > 0) && (
            <Card variant="glass" padding="md">
              <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
                {narrative.titleCount > 0 && (
                  <Badge variant="gold" size="sm">{narrative.titleCount}x Champions</Badge>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                {narrative.achievements?.map((achievement, idx) => (
                  <Badge key={idx} variant="default" size="sm">{achievement}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Famous Alumni */}
          {narrative.famousAlumni?.length > 0 && (
            <Card variant="glass" padding="md">
              <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Famous Alumni
              </h4>
              <div className="flex flex-wrap gap-2">
                {narrative.famousAlumni.map((driver, idx) => (
                  <span key={idx} className="px-2 py-1 bg-surface rounded text-sm">
                    {driver}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Current Form & Trajectory */}
          <Card variant="glass" padding="md">
            <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Current Form
            </h4>
            <p className="text-sm mb-2">{getTrajectory()}</p>
            {narrative.recentForm && (
              <p className="text-xs text-text-muted">{narrative.recentForm}</p>
            )}
          </Card>

          {/* Anecdotes */}
          {narrative.anecdotes?.length > 0 && (
            <Card variant="glass" padding="md">
              <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Did You Know?
              </h4>
              <div className="space-y-2">
                {narrative.anecdotes.slice(0, 2).map((anecdote, idx) => (
                  <p key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-accent-gold">•</span>
                    {anecdote}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Development Status - NEW */}
      {development && (
        <Card variant="glass" padding="md">
          <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Development Status
            {isImproving && <Badge variant="green" size="sm">Improving</Badge>}
            {isDeclining && <Badge variant="red" size="sm">Struggling</Badge>}
          </h4>
          
          {/* Overall Development */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">Overall Development</span>
              <span className="text-sm font-bold">{Math.round(development.totalPoints)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  development.totalPoints >= 70 ? 'bg-status-success' :
                  development.totalPoints >= 50 ? 'bg-accent-orange' :
                  'bg-accent-red'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${development.totalPoints}%` }}
              />
            </div>
          </div>
          
          {/* Area Breakdown */}
          {development.areaPoints && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(development.areaPoints).map(([area, points]) => (
                <div key={area} className="p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted capitalize">{area}</span>
                    <span className="text-xs font-bold">{Math.round(points as number)}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-red rounded-full"
                      style={{ width: `${points as number}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Development Rate */}
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Development Rate</span>
              <span className={`font-bold ${
                development.developmentRate >= 1.2 ? 'text-status-success' :
                development.developmentRate >= 0.8 ? 'text-accent-orange' :
                'text-accent-red'
              }`}>
                {development.developmentRate.toFixed(2)}x
                {development.developmentRate >= 1.2 && ' (Fast)'}
                {development.developmentRate < 0.8 && ' (Slow)'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Program Info */}
      {(team.programType || team.manufacturerId) && (
        <div className="p-4 bg-surface/50 rounded-xl">
          <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Program Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {manufacturer && (
              <div>
                <p className="text-xs text-text-muted">Manufacturer</p>
                <p className="font-medium">{manufacturer.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-text-muted">Program Type</p>
              <Badge variant={
                team.programType === 'works' ? 'green' :
                team.programType === 'factory-supported' ? 'blue' :
                team.programType === 'customer' ? 'orange' :
                'default'
              }>
                {team.programType?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Independent'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Section - Enhanced */}
      <div>
        <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Current Drivers
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {/* Real drivers first */}
          {team.realDrivers?.map((driver, idx) => (
            <div key={`real-${idx}`} className="p-3 bg-surface rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center font-bold text-sm">
                {driver.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium">{driver.name}</p>
                <p className="text-xs text-text-muted">{driver.country}</p>
              </div>
            </div>
          ))}
          {/* AI drivers if no real drivers */}
          {!team.realDrivers?.length && teamDrivers.map(driver => (
            <div key={driver.id} className="p-3 bg-surface rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center font-bold text-sm">
                {driver.firstName[0]}{driver.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                <p className="text-xs text-text-muted">{driver.nationality}</p>
              </div>
              <Badge 
                variant={
                  driver.careerStage === 'rising' ? 'green' :
                  driver.careerStage === 'peak' ? 'blue' :
                  driver.careerStage === 'declining' ? 'orange' :
                  'default'
                }
                size="sm"
              >
                {driver.careerStage === 'rising' && <TrendingUp className="w-3 h-3" />}
                {driver.careerStage === 'declining' && <TrendingDown className="w-3 h-3" />}
              </Badge>
            </div>
          ))}
          {!team.realDrivers?.length && teamDrivers.length === 0 && (
            <p className="text-sm text-text-muted col-span-2 text-center py-4">No drivers assigned</p>
          )}
        </div>
      </div>

      {/* Team Resources */}
      <Card variant="glass" padding="md">
        <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Team Resources
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between p-3 bg-background rounded-lg">
            <span className="text-text-muted">Prestige</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-gold rounded-full"
                  style={{ width: `${team.prestige}%` }}
                />
              </div>
              <span className="font-mono font-bold">{team.prestige}</span>
            </div>
          </div>
          <div className="flex justify-between p-3 bg-background rounded-lg">
            <span className="text-text-muted">Budget</span>
            <Badge variant={
              team.budget === 'factory' ? 'green' :
              team.budget === 'high' ? 'blue' :
              team.budget === 'medium' ? 'orange' : 'default'
            }>
              {team.budget.charAt(0).toUpperCase() + team.budget.slice(1)}
            </Badge>
          </div>
          <div className="flex justify-between p-3 bg-background rounded-lg">
            <span className="text-text-muted">Facilities</span>
            <span className="font-medium capitalize">{team.facilities}</span>
          </div>
          <div className="flex justify-between p-3 bg-background rounded-lg">
            <span className="text-text-muted">Driver Count</span>
            <span className="font-medium">{teamDrivers.length}</span>
          </div>
        </div>
      </Card>

      {/* Comparison with Your Team */}
      {canCompare && ownedTeam && (
        <Card variant="glass" padding="md">
          <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Comparison vs Your Team
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <span className="text-sm">Prestige</span>
              <div className="flex items-center gap-4">
                <span className={team.prestige > (ownedTeam.reputation || 0) ? 'text-accent-red font-bold' : 'text-text-muted'}>
                  {team.prestige}
                </span>
                <span className="text-text-muted">vs</span>
                <span className={team.prestige <= (ownedTeam.reputation || 0) ? 'text-status-success font-bold' : 'text-text-muted'}>
                  {ownedTeam.reputation || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <span className="text-sm">Budget Level</span>
              <div className="flex items-center gap-4">
                <Badge variant={team.budget === 'factory' ? 'green' : team.budget === 'high' ? 'blue' : 'default'} size="sm">
                  {team.budget}
                </Badge>
                <span className="text-text-muted">vs</span>
                <Badge variant="blue" size="sm">
                  Your Team
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <span className="text-sm">Facilities</span>
              <div className="flex items-center gap-4">
                <span className="capitalize">{team.facilities}</span>
                <span className="text-text-muted">vs</span>
                <span className="capitalize">Your Team</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* No Narrative Message */}
      {!narrative && (
        <div className="text-center py-6 bg-surface/50 rounded-xl">
          <Info className="w-10 h-10 mx-auto text-text-muted mb-2" />
          <p className="text-text-muted">Team story not yet generated</p>
          <p className="text-xs text-text-muted mt-1">
            More information will be revealed as you progress
          </p>
        </div>
      )}
    </div>
  )
}
