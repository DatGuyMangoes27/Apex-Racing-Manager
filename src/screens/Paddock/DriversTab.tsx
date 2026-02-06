import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Flag,
  Zap,
  Activity,
  Lock,
  History,
  Swords,
  MapPin,
  Calendar,
  Crown,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { RivalDriver } from '@/store/rivalStore'

type SortType = 'skill' | 'form' | 'name' | 'team'
type IntelFilterType = 'your-series' | 'all' | 'free-agents'

export function DriversTab() {
  const [marketSort, setMarketSort] = useState<SortType>('skill')
  
  // Intel tab filters  
  const [intelFilter, setIntelFilter] = useState<IntelFilterType>('your-series')
  const [intelSort, setIntelSort] = useState<SortType>('form')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<string>('all')
  const [selectedDriver, setSelectedDriver] = useState<RivalDriver | null>(null)
  const [showDriverModal, setShowDriverModal] = useState(false)

  // Active drivers only
  const activeDrivers = useMemo(() => 
    rivals.filter(r => r.careerActive),
    [rivals]
  )
  
  // Get driver performance from standings
  const getDriverPerformance = (driverId: string): { wins: number; podiums: number; points: number; position: number | null } => {
    for (const seriesId in seasonStandings) {
      const standing = seasonStandings[seriesId].find(s => s.driverId === driverId)
      if (standing) {
        return {
          wins: standing.wins,
          podiums: standing.podiums,
          points: standing.points,
          position: standing.position
        }
      }
    }
    return { wins: 0, podiums: 0, points: 0, position: null }
  }

  // All drivers with enriched data
  const enrichedDrivers = useMemo(() => {
    return activeDrivers.map(driver => {
      const team = getTeamById(driver.currentTeamId)
      const driverSeries = getSeriesById(driver.currentSeriesId)
      const isInYourSeries = enteredSeriesIds.includes(driver.currentSeriesId)
      const performance = getDriverPerformance(driver.id)
      const contractExpiring = driver.contractEndYear <= currentYear + 1
      const isFreeAgent = !driver.currentTeamId || driver.contractEndYear <= currentYear
      
      return {
        driver,
        team,
        series: driverSeries,
        scoutingLevel: getScoutingLevel(driver.id),
        intel: getDriverIntelligence(driver.id),
        isInYourSeries,
        tier: (driverSeries?.tier || 'amateur') as TeamTier,
        performance,
        contractExpiring,
        isFreeAgent
      }
    })
  }, [activeDrivers, getTeamById, getSeriesById, enteredSeriesIds, getScoutingLevel, getDriverIntelligence, currentYear])

  // Driver Market - filtered drivers for hiring
  const marketDrivers = useMemo(() => {
    let result = [...enrichedDrivers]
    
    // Apply market-specific filters
    if (marketFilter === 'expiring') {
      result = result.filter(d => d.contractExpiring && !d.isFreeAgent)
    } else if (marketFilter === 'free-agents') {
      result = result.filter(d => d.isFreeAgent)
    } else if (marketFilter === 'prospects') {
      // Rising stars from lower tiers
      result = result.filter(d => 
        d.driver.careerStage === 'rising' && 
        d.driver.age < 26 &&
        ['entry', 'amateur', 'semi-pro'].includes(d.tier)
      )
    }
    
    // Apply series filter
    if (selectedSeries !== 'all') {
      result = result.filter(d => d.driver.currentSeriesId === selectedSeries)
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => 
        d.driver.firstName.toLowerCase().includes(query) ||
        d.driver.lastName.toLowerCase().includes(query) ||
        d.team?.name.toLowerCase().includes(query)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      switch (marketSort) {
        case 'skill':
          return b.driver.baseSkill - a.driver.baseSkill
        case 'salary':
          return a.driver.salary - b.driver.salary
        case 'age':
          return a.driver.age - b.driver.age
        case 'reputation':
          return b.driver.reputation - a.driver.reputation
        default:
          return a.driver.lastName.localeCompare(b.driver.lastName)
      }
    })
    
    return result
  }, [enrichedDrivers, marketFilter, marketSort, searchQuery, selectedSeries])

  // Rival Intel - drivers in your series for strategy
  const intelDrivers = useMemo(() => {
    let result = [...enrichedDrivers]
    
    // Filter by your series or all
    if (intelFilter === 'your-series') {
      result = result.filter(d => d.isInYourSeries)
    }
    
    // Apply series filter
    if (selectedSeries !== 'all') {
      result = result.filter(d => d.driver.currentSeriesId === selectedSeries)
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => 
        d.driver.firstName.toLowerCase().includes(query) ||
        d.driver.lastName.toLowerCase().includes(query) ||
        d.team?.name.toLowerCase().includes(query)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      switch (intelSort) {
        case 'form':
          return b.driver.currentForm - a.driver.currentForm
        case 'skill':
          return b.driver.baseSkill - a.driver.baseSkill
        case 'reputation':
          return b.driver.reputation - a.driver.reputation
        default:
          return a.driver.lastName.localeCompare(b.driver.lastName)
      }
    })
    
    return result
  }, [enrichedDrivers, intelFilter, intelSort, searchQuery, selectedSeries])

  // Stats for each mode
  const marketStats = useMemo(() => ({
    total: enrichedDrivers.length,
    expiring: enrichedDrivers.filter(d => d.contractExpiring && !d.isFreeAgent).length,
    freeAgents: enrichedDrivers.filter(d => d.isFreeAgent).length,
    prospects: enrichedDrivers.filter(d => 
      d.driver.careerStage === 'rising' && 
      d.driver.age < 26
    ).length
  }), [enrichedDrivers])
  
  const intelStats = useMemo(() => ({
    inYourSeries: enrichedDrivers.filter(d => d.isInYourSeries).length,
    risingStars: enrichedDrivers.filter(d => d.isInYourSeries && d.driver.careerStage === 'rising').length,
    peakDrivers: enrichedDrivers.filter(d => d.isInYourSeries && d.driver.careerStage === 'peak').length
  }), [enrichedDrivers])

  const handleScout = (driverId: string, driverName: string) => {
    const report = scoutDriver(driverId, driverName)
    if (report) {
      console.log('Scouted:', report)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('market')}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${activeSubTab === 'market'
              ? 'bg-accent-red text-white shadow-lg'
              : 'bg-surface hover:bg-surface-secondary text-text-muted'
            }
          `}
        >
          <ShoppingCart className="w-5 h-5" />
          Driver Market
        </button>
        <button
          onClick={() => setActiveSubTab('intel')}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${activeSubTab === 'intel'
              ? 'bg-accent-red text-white shadow-lg'
              : 'bg-surface hover:bg-surface-secondary text-text-muted'
            }
          `}
        >
          <Radar className="w-5 h-5" />
          Rival Intel
        </button>
      </div>

      {/* Driver Market View */}
      {activeSubTab === 'market' && (
        <>
          {/* Market Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
                  <Users className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{marketStats.total}</p>
                  <p className="text-sm text-text-muted">Total Drivers</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-orange/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-accent-orange">{marketStats.expiring}</p>
                  <p className="text-sm text-text-muted">Expiring Contracts</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-status-success" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-status-success">{marketStats.freeAgents}</p>
                  <p className="text-sm text-text-muted">Free Agents</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-gold" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-accent-gold">{marketStats.prospects}</p>
                  <p className="text-sm text-text-muted">Rising Prospects</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Market Filters */}
          <Card variant="glass" padding="md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
                />
              </div>

              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value as MarketFilterType)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="all">All Drivers</option>
                <option value="expiring">Expiring Contracts</option>
                <option value="free-agents">Free Agents</option>
                <option value="prospects">Rising Prospects</option>
              </select>

              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="all">All Championships</option>
                {series.filter(s => s.isModern).map(s => (
                  <option key={s.id} value={s.id}>{s.shortName}</option>
                ))}
              </select>

              <select
                value={marketSort}
                onChange={(e) => setMarketSort(e.target.value as SortType)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="skill">Sort: Skill</option>
                <option value="salary">Sort: Salary</option>
                <option value="age">Sort: Age</option>
                <option value="reputation">Sort: Reputation</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </Card>
        </>
      )}

      {/* Rival Intel View */}
      {activeSubTab === 'intel' && (
        <>
          {/* Intel Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-red/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent-red" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{intelStats.inYourSeries}</p>
                  <p className="text-sm text-text-muted">Drivers in Your Series</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-status-success" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-status-success">{intelStats.risingStars}</p>
                  <p className="text-sm text-text-muted">Rising Threats</p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-accent-gold" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-accent-gold">{intelStats.peakDrivers}</p>
                  <p className="text-sm text-text-muted">Peak Performers</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Intel Filters */}
          <Card variant="glass" padding="md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search rival drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
                />
              </div>

              <select
                value={intelFilter}
                onChange={(e) => setIntelFilter(e.target.value as IntelFilterType)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="your-series">Your Series Only</option>
                <option value="all">All Drivers</option>
              </select>

              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="all">All Championships</option>
                {series.filter(s => s.isModern).map(s => (
                  <option key={s.id} value={s.id}>{s.shortName}</option>
                ))}
              </select>

              <select
                value={intelSort}
                onChange={(e) => setIntelSort(e.target.value as SortType)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
              >
                <option value="form">Sort: Current Form</option>
                <option value="skill">Sort: Skill</option>
                <option value="reputation">Sort: Reputation</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </Card>
        </>
      )}

      {/* Driver Grid - Market View */}
      {activeSubTab === 'market' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {marketDrivers.map(({ driver, team, series, _scoutingLevel, contractExpiring, isFreeAgent, _performance }, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    setSelectedDriver(driver)
                    setShowDriverModal(true)
                  }}
                  className="cursor-pointer"
                >
                  <Card 
                    variant="glass" 
                    padding="none"
                    className={`
                      overflow-hidden transition-all hover:scale-[1.01]
                      ${isFreeAgent ? 'border-status-success/30' : contractExpiring ? 'border-accent-orange/30' : ''}
                    `}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Driver Portrait */}
                        <DriverPortrait
                          src={getDriverPortrait(`${driver.firstName} ${driver.lastName}`, driver.nationality)}
                          name={`${driver.firstName} ${driver.lastName}`}
                          country={driver.nationality}
                          teamColor={team?.color}
                          size="xl"
                        />

                        {/* Driver Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-semibold truncate">
                              {driver.firstName} {driver.lastName}
                            </h3>
                            <span className="text-xs text-text-muted">Age {driver.age}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-text-muted">
                            <span>{team?.shortName || 'Free Agent'}</span>
                            <span>•</span>
                            <span>{series?.shortName || 'Unknown'}</span>
                          </div>
                          
                          {/* Skill Bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  driver.baseSkill >= 0.8 ? 'bg-accent-gold' :
                                  driver.baseSkill >= 0.6 ? 'bg-status-success' :
                                  driver.baseSkill >= 0.4 ? 'bg-accent-orange' :
                                  'bg-text-muted'
                                }`}
                                style={{ width: `${driver.baseSkill * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{Math.round(driver.baseSkill * 100)}</span>
                          </div>
                        </div>

                        {/* Contract & Salary */}
                        <div className="text-right">
                          {isFreeAgent ? (
                            <Badge variant="green" size="sm">
                              <UserPlus className="w-3 h-3 mr-1" />
                              Free Agent
                            </Badge>
                          ) : contractExpiring ? (
                            <Badge variant="orange" size="sm">
                              <FileText className="w-3 h-3 mr-1" />
                              Contract {driver.contractEndYear}
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Until {driver.contractEndYear}
                            </Badge>
                          )}
                          <p className="text-xs text-status-success mt-1">
                            ${driver.salary.toLocaleString()}/race
                          </p>
                        </div>
                      </div>

                      {/* Market Info Footer */}
                      <div className="mt-3 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            driver.careerStage === 'rising' ? 'green' :
                            driver.careerStage === 'peak' ? 'blue' :
                            driver.careerStage === 'declining' ? 'orange' :
                            'default'
                          } size="sm">
                            {driver.careerStage === 'rising' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {driver.careerStage === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {driver.careerStage}
                          </Badge>
                        </div>
                        <span className="text-text-muted">
                          Market Value: <span className="text-accent-gold">${driver.marketValue.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {marketDrivers.length === 0 && (
            <Card variant="glass" padding="lg">
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p className="text-text-muted">No drivers match your market filters</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Driver Grid - Intel View */}
      {activeSubTab === 'intel' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {intelDrivers.map(({ driver, team, series, performance, isInYourSeries }, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    setSelectedDriver(driver)
                    setShowDriverModal(true)
                  }}
                  className="cursor-pointer"
                >
                  <Card 
                    variant="glass" 
                    padding="none"
                    className={`
                      overflow-hidden transition-all hover:scale-[1.01]
                      ${isInYourSeries ? 'border-accent-red/30' : ''}
                    `}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Driver Portrait */}
                        <DriverPortrait
                          src={getDriverPortrait(`${driver.firstName} ${driver.lastName}`, driver.nationality)}
                          name={`${driver.firstName} ${driver.lastName}`}
                          country={driver.nationality}
                          teamColor={team?.color}
                          size="xl"
                        />

                        {/* Driver Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-semibold truncate">
                              {driver.firstName} {driver.lastName}
                            </h3>
                            {isInYourSeries && (
                              <Badge variant="red" size="sm">
                                <Target className="w-3 h-3 mr-1" />
                                Rival
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-text-muted">
                            <span>{team?.shortName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{series?.shortName || 'Unknown'}</span>
                          </div>
                          
                          {/* Form Indicator */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-text-muted">Form:</span>
                            <div className={`text-sm font-bold ${
                              driver.currentForm > 0.05 ? 'text-status-success' :
                              driver.currentForm < -0.05 ? 'text-accent-red' :
                              'text-text-muted'
                            }`}>
                              {driver.currentForm > 0 ? '+' : ''}{(driver.currentForm * 100).toFixed(1)}%
                            </div>
                            {driver.formStreak !== 0 && (
                              <span className={`text-xs ${driver.formStreak > 0 ? 'text-status-success' : 'text-accent-red'}`}>
                                ({driver.formStreak > 0 ? '+' : ''}{driver.formStreak} streak)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="text-center">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="font-bold text-accent-gold">{performance.wins}</p>
                              <p className="text-xs text-text-muted">Wins</p>
                            </div>
                            <div>
                              <p className="font-bold text-accent-orange">{performance.podiums}</p>
                              <p className="text-xs text-text-muted">Pods</p>
                            </div>
                            <div>
                              <p className="font-bold">{performance.points}</p>
                              <p className="text-xs text-text-muted">Pts</p>
                            </div>
                          </div>
                          {performance.position && (
                            <p className="text-xs text-text-muted mt-1">
                              Standing: P{performance.position}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Strengths/Weaknesses Footer */}
                      <div className="mt-3 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
                        <Badge variant={
                          driver.careerStage === 'rising' ? 'green' :
                          driver.careerStage === 'peak' ? 'blue' :
                          driver.careerStage === 'declining' ? 'orange' :
                          'default'
                        } size="sm">
                          {driver.careerStage === 'rising' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {driver.careerStage === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {driver.careerStage}
                        </Badge>
                        <div className="flex items-center gap-2 text-text-muted">
                          <span>Skill: {Math.round(driver.baseSkill * 100)}</span>
                          <span>•</span>
                          <span>Rep: {driver.reputation}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {intelDrivers.length === 0 && (
            <Card variant="glass" padding="lg">
              <div className="text-center py-12">
                <Radar className="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p className="text-text-muted">
                  {intelFilter === 'your-series' && seriesEntries.length === 0
                    ? 'Enter a series to see rival intel'
                    : 'No drivers match your intel filters'
                  }
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Driver Detail Modal */}
      <Modal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        title={activeSubTab === 'market' ? 'Driver Profile' : 'Rival Intel'}
        size="lg"
      >
        {selectedDriver && (
          <DriverDetailView 
            driver={selectedDriver}
            team={getTeamById(selectedDriver.currentTeamId)}
            series={getSeriesById(selectedDriver.currentSeriesId)}
            onScout={handleScout}
            isTeammate={false}
            viewMode={activeSubTab}
            ownedTeam={ownedTeam ?? undefined}
            performance={getDriverPerformance(selectedDriver.id)}
          />
        )}
      </Modal>
    </div>
  )
}

// Driver Detail Component - Supports both Market and Intel views
interface DriverDetailViewProps {
  driver: RivalDriver
  team?: Team
  series?: { tier: string }
  onScout: (driverId: string, driverName: string) => void
  isTeammate?: boolean
  viewMode: SubTab
  ownedTeam?: OwnedTeam
  performance?: { wins: number; podiums: number; points: number; position: number | null }
}

function DriverDetailView({ driver, team, _series, _onScout, _isTeammate = false, viewMode, ownedTeam, performance }: DriverDetailViewProps) {
  const { 
    getScoutingLevel, 
    _canSeeData, 
    scoutingBudget,
    getDriverIntelligence,
    teamIntelLevel
  } = useScoutingStore()
  
  const scoutingLevel = getScoutingLevel(driver.id)
  const driverIntel = getDriverIntelligence(driver.id)
  const driverName = `${driver.firstName} ${driver.lastName}`
  
  // For team owner mode, we have full visibility on drivers
  const _effectiveLevel = 'complete' as ScoutingLevel
  const _canSeeTeam = true
  const _canSeeAge = true
  const canSeeStats = true
  const canSeeExact = true
  const canSeeCareer = true
  const canSeeContract = true
  const canSeeForm = true

  const scoutingCost = driverIntel?.scoutingCost ?? calculateScoutingCost(scoutingLevel, teamIntelLevel)
  const _canUpgrade = scoutingLevel !== 'complete' && scoutingCost <= scoutingBudget

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <DriverPortrait
          src={getDriverPortrait(`${driver.firstName} ${driver.lastName}`, driver.nationality)}
          name={`${driver.firstName} ${driver.lastName}`}
          country={driver.nationality}
          teamColor={team?.color}
          size="2xl"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-2xl">{driverName}</h3>
            <Badge variant={
              driver.careerStage === 'rising' ? 'green' :
              driver.careerStage === 'peak' ? 'blue' :
              driver.careerStage === 'declining' ? 'orange' :
              'default'
            } size="sm">
              {driver.careerStage === 'rising' && <TrendingUp className="w-3 h-3 mr-1" />}
              {driver.careerStage === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
              {driver.careerStage}
            </Badge>
          </div>
          <p className="text-text-muted flex items-center gap-2">
            <Flag className="w-4 h-4" />
            {driver.nationality}
            <span>• Age {driver.age}</span>
            {team && <span>• {team.name}</span>}
          </p>
        </div>
        <div className="text-right">
          {/* Different info based on view mode */}
          {viewMode === 'market' ? (
            <>
              <p className="text-xs text-text-muted">Expected Salary</p>
              <p className="font-bold text-lg text-status-success">${driver.salary.toLocaleString()}/race</p>
              <p className="text-xs text-text-muted mt-1">Contract until {driver.contractEndYear}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-text-muted">Current Form</p>
              <p className={`font-bold text-lg ${
                driver.currentForm > 0.05 ? 'text-status-success' :
                driver.currentForm < -0.05 ? 'text-accent-red' :
                'text-text-muted'
              }`}>
                {driver.currentForm > 0 ? '+' : ''}{(driver.currentForm * 100).toFixed(1)}%
              </p>
              {performance?.position && (
                <p className="text-xs text-text-muted mt-1">Standing: P{performance.position}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Market View: Hiring Action */}
      {viewMode === 'market' && ownedTeam && (
        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Make Offer</h4>
              <p className="text-sm text-text-muted">
                Interested in signing this driver? Start negotiations.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-text-muted">Market Value</p>
                <p className="font-bold text-accent-gold">${driver.marketValue.toLocaleString()}</p>
              </div>
              <Button variant="primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Contact Driver
              </Button>
            </div>
          </div>
          {driver.contractEndYear > new Date().getFullYear() + 1 && (
            <p className="text-xs text-accent-orange mt-2 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Driver is under contract until {driver.contractEndYear}. May require buyout.
            </p>
          )}
        </Card>
      )}

      {/* Intel View: Performance Summary */}
      {viewMode === 'intel' && performance && (
        <Card variant="glass" padding="md">
          <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Season Performance
          </h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-background/50 rounded-lg">
              <p className="font-bold text-xl text-accent-gold">{performance.wins}</p>
              <p className="text-xs text-text-muted">Wins</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg">
              <p className="font-bold text-xl text-accent-orange">{performance.podiums}</p>
              <p className="text-xs text-text-muted">Podiums</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg">
              <p className="font-bold text-xl">{performance.points}</p>
              <p className="text-xs text-text-muted">Points</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg">
              <p className="font-bold text-xl">{performance.position || '-'}</p>
              <p className="text-xs text-text-muted">Position</p>
            </div>
          </div>
        </Card>
      )}

      {/* Skills Section */}
      <div>
        <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Driver Skills
        </h4>
        {canSeeStats ? (
          <div className="grid grid-cols-2 gap-3">
            {SKILL_LABELS.map(({ key, label, icon }) => {
              const value = driver.stats[key as keyof typeof driver.stats]
              return (
                <div key={key} className="p-3 bg-surface rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted flex items-center gap-2">
                      {icon}
                      {label}
                    </span>
                    {canSeeExact ? (
                      <span className="font-mono text-sm">{Math.round(value * 100)}</span>
                    ) : (
                      <span className="text-xs text-text-muted">
                        {value >= 0.8 ? 'Excellent' :
                         value >= 0.6 ? 'Good' :
                         value >= 0.4 ? 'Average' : 'Weak'}
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        value >= 0.8 ? 'bg-accent-gold' :
                        value >= 0.6 ? 'bg-status-success' :
                        value >= 0.4 ? 'bg-accent-orange' :
                        'bg-text-muted'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6 bg-surface/50 rounded-xl text-center">
            <Lock className="w-8 h-8 mx-auto text-text-muted mb-2" />
            <p className="text-text-muted">Scout this driver to reveal skills</p>
          </div>
        )}
      </div>

      {/* Career History */}
      {canSeeCareer && (
        <div>
          <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Career Statistics
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className="text-2xl font-display font-bold">{driver.totalRaces}</p>
              <p className="text-xs text-text-muted">Races</p>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className="text-2xl font-display font-bold text-accent-gold">{driver.totalWins}</p>
              <p className="text-xs text-text-muted">Wins</p>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className="text-2xl font-display font-bold text-accent-orange">{driver.totalPodiums}</p>
              <p className="text-xs text-text-muted">Podiums</p>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className="text-2xl font-display font-bold text-status-success">{driver.championships}</p>
              <p className="text-xs text-text-muted">Championships</p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details */}
      {canSeeContract && (
        <div>
          <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Contract Information
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Current Team</p>
              <p className="font-medium">{team?.name || 'Unknown'}</p>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Contract Ends</p>
              <p className="font-medium">{driver.contractEndYear}</p>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Estimated Salary</p>
              <p className="font-medium text-status-success">${driver.salary.toLocaleString()}/race</p>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-sm text-text-muted">Market Value</p>
              <p className="font-medium text-accent-gold">${driver.marketValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Trends */}
      {canSeeForm && (
        <div>
          <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Current Form
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className={`text-lg font-bold ${
                driver.currentForm > 0 ? 'text-status-success' :
                driver.currentForm < 0 ? 'text-accent-red' :
                'text-text-muted'
              }`}>
                {driver.currentForm > 0 ? '+' : ''}{(driver.currentForm * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted">Form Modifier</p>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <p className={`text-lg font-bold ${
                driver.formStreak > 0 ? 'text-status-success' :
                driver.formStreak < 0 ? 'text-accent-red' :
                'text-text-muted'
              }`}>
                {driver.formStreak > 0 ? '+' : ''}{driver.formStreak}
              </p>
              <p className="text-xs text-text-muted">Streak</p>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <Badge variant={
                driver.careerStage === 'rising' ? 'green' :
                driver.careerStage === 'peak' ? 'blue' :
                driver.careerStage === 'declining' ? 'orange' :
                'default'
              }>
                {driver.careerStage.charAt(0).toUpperCase() + driver.careerStage.slice(1)}
              </Badge>
              <p className="text-xs text-text-muted mt-1">Career Stage</p>
            </div>
          </div>
        </div>
      )}

      {/* Driver Narrative Section */}
      {driver.narrative && (
        <DriverNarrativeSection narrative={driver.narrative} driverName={driverName} />
      )}

      {/* Track Affinities */}
      {canSeeForm && driver.trackAffinities && Object.keys(driver.trackAffinities).length > 0 && (
        <TrackAffinitiesSection affinities={driver.trackAffinities} />
      )}

      {/* Relationship with Player */}
      {canSeeCareer && (
        <div>
          <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
            {driver.relationshipWithPlayer >= 0 ? <Heart className="w-4 h-4" /> : <HeartOff className="w-4 h-4" />}
            Relationship
          </h4>
          <div className="p-3 bg-surface rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Opinion of You</span>
              <span className={`font-bold ${
                driver.relationshipWithPlayer > 20 ? 'text-status-success' :
                driver.relationshipWithPlayer < -20 ? 'text-accent-red' :
                'text-text-muted'
              }`}>
                {driver.relationshipWithPlayer > 50 ? 'Friendly' :
                 driver.relationshipWithPlayer > 20 ? 'Respectful' :
                 driver.relationshipWithPlayer > -20 ? 'Neutral' :
                 driver.relationshipWithPlayer > -50 ? 'Wary' : 'Hostile'}
              </span>
            </div>
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  driver.relationshipWithPlayer > 20 ? 'bg-status-success' :
                  driver.relationshipWithPlayer < -20 ? 'bg-accent-red' :
                  'bg-accent-orange'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, (driver.relationshipWithPlayer + 100) / 2))}%` }}
              />
            </div>
            {driver.rivalryIntensity > 50 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-accent-red">
                <Swords className="w-3 h-3" />
                <span>Rivalry Intensity: {driver.rivalryIntensity}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Driver Narrative Section Component
function DriverNarrativeSection({ narrative, _driverName }: { narrative: DriverNarrative; driverName: string }) {
  const [expanded, setExpanded] = useState(false)
  const { rivals } = useRivalStore()
  
  // Get rival drivers for rivalries
  const getRivalDriver = (rivalId: string) => rivals.find(r => r.id === rivalId)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-text-muted text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          Driver Story
        </h4>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent-red flex items-center gap-1 hover:underline"
        >
          {expanded ? 'Show Less' : 'Show More'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Origin Story - Always visible */}
      <Card variant="glass" padding="md">
        <p className="text-sm text-text-secondary italic">"{narrative.origin}"</p>
      </Card>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Career Path */}
            {narrative.careerPath && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Career Path
                </h5>
                <p className="text-sm">{narrative.careerPath}</p>
              </Card>
            )}

            {/* Breakout Moment */}
            {narrative.breakoutMoment && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  Breakout Moment
                </h5>
                <p className="text-sm">{narrative.breakoutMoment}</p>
              </Card>
            )}

            {/* Driving Style */}
            {narrative.drivingStyle && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <Car className="w-3 h-3" />
                  Driving Style
                </h5>
                <Badge 
                  variant={
                    narrative.drivingStyle === 'aggressive' ? 'red' :
                    narrative.drivingStyle === 'smooth' ? 'green' :
                    narrative.drivingStyle === 'calculated' ? 'blue' :
                    narrative.drivingStyle === 'defensive' ? 'orange' :
                    'default'
                  }
                  size="sm"
                  className="mb-2"
                >
                  {narrative.drivingStyle.charAt(0).toUpperCase() + narrative.drivingStyle.slice(1)}
                </Badge>
                {narrative.styleDescription && (
                  <p className="text-sm text-text-secondary">{narrative.styleDescription}</p>
                )}
              </Card>
            )}

            {/* Known Rivalries */}
            {narrative.knownRivalries && narrative.knownRivalries.length > 0 && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-3 flex items-center gap-2">
                  <Swords className="w-3 h-3" />
                  Known Rivalries
                </h5>
                <div className="space-y-2">
                  {narrative.knownRivalries.map((rivalry, idx) => {
                    const rivalDriver = getRivalDriver(rivalry.driverId)
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-xs font-bold text-accent-red">
                            {rivalDriver ? `${rivalDriver.firstName[0]}${rivalDriver.lastName[0]}` : '??'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {rivalDriver ? `${rivalDriver.firstName} ${rivalDriver.lastName}` : 'Unknown Driver'}
                            </p>
                            <p className="text-xs text-text-muted">{rivalry.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted">Intensity</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < Math.ceil(rivalry.intensity / 20) ? 'bg-accent-red' : 'bg-surface-secondary'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Career Milestones */}
            {narrative.careerMilestones && narrative.careerMilestones.length > 0 && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-3 flex items-center gap-2">
                  <Crown className="w-3 h-3" />
                  Career Milestones
                </h5>
                <div className="space-y-2">
                  {narrative.careerMilestones.slice(0, 5).map((milestone, idx) => (
                    <MilestoneItem key={idx} milestone={milestone} />
                  ))}
                </div>
              </Card>
            )}

            {/* Anecdotes */}
            {narrative.anecdotes && narrative.anecdotes.length > 0 && (
              <Card variant="glass" padding="md">
                <h5 className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Did You Know?
                </h5>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Milestone Item Component
function MilestoneItem({ milestone }: { milestone: DriverMilestone }) {
  const track = milestone.trackId ? getTrackById(milestone.trackId) : null
  
  const getIcon = () => {
    switch (milestone.type) {
      case 'first_win': return <Trophy className="w-4 h-4 text-accent-gold" />
      case 'first_pole': return <Flag className="w-4 h-4 text-purple-400" />
      case 'championship': return <Crown className="w-4 h-4 text-accent-gold" />
      case 'first_podium': return <Award className="w-4 h-4 text-accent-orange" />
      case 'debut': return <Star className="w-4 h-4 text-blue-400" />
      case 'milestone_win': return <Trophy className="w-4 h-4 text-status-success" />
      default: return <Star className="w-4 h-4 text-text-muted" />
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-2 bg-background/50 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm">{milestone.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
          <span>{milestone.year}</span>
          {track && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {track.shortName}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Track Affinities Section
function TrackAffinitiesSection({ affinities }: { affinities: Record<string, number> }) {
  // Sort tracks by affinity
  const sortedTracks = Object.entries(affinities)
    .map(([trackId, bonus]) => ({
      trackId,
      bonus,
      track: getTrackById(trackId)
    }))
    .filter(t => t.track)
    .sort((a, b) => b.bonus - a.bonus)
  
  const bestTracks = sortedTracks.filter(t => t.bonus > 0).slice(0, 3)
  const worstTracks = sortedTracks.filter(t => t.bonus < 0).slice(-3).reverse()
  
  if (bestTracks.length === 0 && worstTracks.length === 0) return null
  
  return (
    <div>
      <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Track Affinities
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {bestTracks.length > 0 && (
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-status-success mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Strong At
            </p>
            <div className="space-y-1">
              {bestTracks.map(({ track, bonus }) => (
                <div key={track!.id} className="flex justify-between text-sm">
                  <span>{track!.shortName}</span>
                  <span className="text-status-success font-mono">+{(bonus * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {worstTracks.length > 0 && (
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-accent-red mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Struggles At
            </p>
            <div className="space-y-1">
              {worstTracks.map(({ track, bonus }) => (
                <div key={track!.id} className="flex justify-between text-sm">
                  <span>{track!.shortName}</span>
                  <span className="text-accent-red font-mono">{(bonus * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
