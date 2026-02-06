import { useState, useMemo } from 'react'
import { Search, Eye, EyeOff, ChevronRight, Star, DollarSign, Users, Shield, Target } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { useScoutingStore, type ScoutingLevel, type DriverIntelligence } from '@/store/scoutingStore'
import { useRivalStore } from '@/store/rivalStore'
import { useCareerStore } from '@/store/careerStore'
import { motion, AnimatePresence } from 'framer-motion'

const LEVEL_COLORS: Record<ScoutingLevel, string> = {
  'unknown': 'bg-gray-600',
  'basic': 'bg-blue-600',
  'familiar': 'bg-green-600',
  'detailed': 'bg-purple-600',
  'complete': 'bg-yellow-500'
}

const LEVEL_LABELS: Record<ScoutingLevel, string> = {
  'unknown': 'Unknown',
  'basic': 'Basic',
  'familiar': 'Familiar',
  'detailed': 'Detailed',
  'complete': 'Complete'
}

const LEVEL_ORDER: ScoutingLevel[] = ['unknown', 'basic', 'familiar', 'detailed', 'complete']

export function Scouting() {
  const { careerState, player } = useCareerStore()
  const scoutingStore = useScoutingStore()
  const rivalStore = useRivalStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<ScoutingLevel | 'all'>('all')
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [scoutingMessage, setScoutingMessage] = useState<string | null>(null)
  
  if (!careerState || !player) return null
  
  // Get all known drivers from rival store
  const allDrivers = useMemo(() => {
    const seriesId = player.currentSeriesId || ''
    const standings = rivalStore.getStandings(seriesId)
    const drivers: Array<{ id: string; name: string; team?: string; position?: number }> = []
    
    if (standings) {
      for (const entry of standings) {
        if (entry.driverId !== 'player') {
          drivers.push({
            id: entry.driverId,
            name: entry.driverName || entry.driverId,
            team: entry.entryName,
            position: entry.position
          })
        }
      }
    }
    
    return drivers
  }, [player.currentSeriesId, rivalStore])
  
  // Merge with scouting intelligence
  const driversWithIntel = useMemo(() => {
    return allDrivers.map(driver => {
      const intel = scoutingStore.getDriverIntelligence(driver.id)
      const level = scoutingStore.getScoutingLevel(driver.id)
      const cost = scoutingStore.getEstimatedScoutingCost(driver.id)
      
      return { ...driver, intel, level, scoutCost: cost }
    }).filter(d => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!d.name.toLowerCase().includes(q) && !(d.team || '').toLowerCase().includes(q)) return false
      }
      if (filterLevel !== 'all' && d.level !== filterLevel) return false
      return true
    }).sort((a, b) => {
      // Sort by scouting level (more known first), then by championship position
      const levelDiff = LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level)
      if (levelDiff !== 0) return levelDiff
      return (a.position || 99) - (b.position || 99)
    })
  }, [allDrivers, scoutingStore, searchQuery, filterLevel])
  
  const selectedDriverData = selectedDriver 
    ? driversWithIntel.find(d => d.id === selectedDriver) 
    : null
  
  const handleScout = (driverId: string, driverName: string) => {
    const report = scoutingStore.scoutDriver(driverId, driverName)
    if (report) {
      setScoutingMessage(`Scouting report received for ${driverName}: Intelligence upgraded to ${LEVEL_LABELS[report.levelAfter]}`)
      setTimeout(() => setScoutingMessage(null), 4000)
    } else {
      setScoutingMessage('Insufficient budget or driver already fully scouted.')
      setTimeout(() => setScoutingMessage(null), 3000)
    }
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Scouting"
        subtitle="Intelligence on rival drivers"
        icon={<Search className="w-6 h-6" />}
        rightElement={
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-accent-primary" />
              <span>Budget: ${scoutingStore.scoutingBudget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-accent-secondary" />
              <span>Intel Network: Lv.{scoutingStore.teamIntelLevel}</span>
            </div>
          </div>
        }
      />
      
      {/* Scouting Message */}
      <AnimatePresence>
        {scoutingMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent-primary/20 border border-accent-primary/30 rounded-lg px-4 py-3 text-sm"
          >
            {scoutingMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search drivers or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-sm"
          />
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterLevel === 'all' ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-muted hover:text-text-primary'
            }`}
          >
            All
          </button>
          {LEVEL_ORDER.map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterLevel === level ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Rival Drivers ({driversWithIntel.length})
          </h3>
          
          {driversWithIntel.length === 0 ? (
            <div className="bg-bg-secondary rounded-lg p-8 text-center text-text-muted">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No drivers found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {driversWithIntel.map(driver => (
                <motion.button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedDriver === driver.id 
                      ? 'bg-accent-primary/20 border border-accent-primary/30' 
                      : 'bg-bg-secondary hover:bg-bg-tertiary border border-transparent'
                  }`}
                  whileHover={{ x: 2 }}
                >
                  {/* Position */}
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold text-text-muted">
                      P{driver.position || '?'}
                    </span>
                  </div>
                  
                  {/* Intel Level Badge */}
                  <div className={`w-2 h-8 rounded-full ${LEVEL_COLORS[driver.level]}`} />
                  
                  {/* Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{driver.name}</span>
                      {driver.level === 'complete' && (
                        <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-text-muted truncate block">
                      {driver.level === 'unknown' ? '???' : driver.team || 'Unknown team'}
                    </span>
                  </div>
                  
                  {/* Intel Level */}
                  <span className={`text-xs px-2 py-0.5 rounded ${LEVEL_COLORS[driver.level]} text-white`}>
                    {LEVEL_LABELS[driver.level]}
                  </span>
                  
                  {/* Scout Cost */}
                  {driver.level !== 'complete' && (
                    <span className="text-xs text-text-muted">
                      ${driver.scoutCost.toLocaleString()}
                    </span>
                  )}
                  
                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
        
        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedDriverData ? (
            <motion.div
              key={selectedDriverData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-bg-secondary rounded-lg p-5 space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold">{selectedDriverData.name}</h3>
                <p className="text-sm text-text-muted">
                  {selectedDriverData.level !== 'unknown' ? selectedDriverData.team : 'Team Unknown'}
                </p>
              </div>
              
              {/* Intel Level Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Intelligence Level</span>
                  <span className="font-medium">{LEVEL_LABELS[selectedDriverData.level]}</span>
                </div>
                <div className="flex gap-1">
                  {LEVEL_ORDER.map((level, i) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full ${
                        LEVEL_ORDER.indexOf(selectedDriverData.level) >= i
                          ? LEVEL_COLORS[level]
                          : 'bg-bg-tertiary'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Known Data */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-muted">Known Information</h4>
                
                {selectedDriverData.level === 'unknown' && (
                  <p className="text-xs text-text-muted italic">
                    Very little is known about this driver. Scout them to learn more.
                  </p>
                )}
                
                {selectedDriverData.level !== 'unknown' && (
                  <div className="space-y-1.5">
                    <InfoRow icon={<Eye className="w-3 h-3" />} label="Team" value={selectedDriverData.team || 'Unknown'} known={true} />
                    <InfoRow icon={<Eye className="w-3 h-3" />} label="Championship Pos" value={`P${selectedDriverData.position || '?'}`} known={true} />
                    <InfoRow 
                      icon={selectedDriverData.level !== 'unknown' && selectedDriverData.level !== 'basic' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} 
                      label="Individual Stats" 
                      value={scoutingStore.canSeeData(selectedDriverData.id, 'individualStats') ? 'Visible' : 'Hidden'} 
                      known={scoutingStore.canSeeData(selectedDriverData.id, 'individualStats')} 
                    />
                    <InfoRow 
                      icon={selectedDriverData.level === 'detailed' || selectedDriverData.level === 'complete' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} 
                      label="Exact Stat Values" 
                      value={scoutingStore.canSeeData(selectedDriverData.id, 'exactValues') ? 'Visible' : 'Hidden'} 
                      known={scoutingStore.canSeeData(selectedDriverData.id, 'exactValues')} 
                    />
                    <InfoRow 
                      icon={selectedDriverData.level === 'complete' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} 
                      label="Contract Details" 
                      value={scoutingStore.canSeeData(selectedDriverData.id, 'contractDetails') ? 'Visible' : 'Hidden'} 
                      known={scoutingStore.canSeeData(selectedDriverData.id, 'contractDetails')} 
                    />
                    <InfoRow 
                      icon={selectedDriverData.level === 'complete' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} 
                      label="Form Trends" 
                      value={scoutingStore.canSeeData(selectedDriverData.id, 'formTrends') ? 'Visible' : 'Hidden'} 
                      known={scoutingStore.canSeeData(selectedDriverData.id, 'formTrends')} 
                    />
                  </div>
                )}
              </div>
              
              {/* Races Shared */}
              {selectedDriverData.intel && (
                <div className="text-xs text-text-muted">
                  Races shared: {selectedDriverData.intel.racedAgainst}
                </div>
              )}
              
              {/* Scout Button */}
              {selectedDriverData.level !== 'complete' && (
                <button
                  onClick={() => handleScout(selectedDriverData.id, selectedDriverData.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Scout Driver (${selectedDriverData.scoutCost.toLocaleString()})
                </button>
              )}
              
              {selectedDriverData.level === 'complete' && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                  <Star className="w-4 h-4" />
                  Full Intelligence — No further scouting needed
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-bg-secondary rounded-lg p-8 text-center text-text-muted">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a driver to view intelligence</p>
            </div>
          )}
          
          {/* Team Intelligence Network */}
          <div className="bg-bg-secondary rounded-lg p-5 space-y-3">
            <h4 className="text-sm font-semibold">Intelligence Network</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(level => (
                  <div
                    key={level}
                    className={`w-6 h-3 rounded ${
                      level <= scoutingStore.teamIntelLevel 
                        ? 'bg-accent-primary' 
                        : 'bg-bg-tertiary'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">Level {scoutingStore.teamIntelLevel}/5</span>
            </div>
            <p className="text-xs text-text-muted">
              Higher intelligence network levels unlock automatic scouting and reduce manual scouting costs.
            </p>
            {scoutingStore.teamIntelLevel < 5 && (
              <button
                onClick={() => {
                  const cost = (scoutingStore.teamIntelLevel + 1) * 5000
                  const success = scoutingStore.upgradeTeamIntel(cost)
                  if (success) {
                    setScoutingMessage(`Intelligence network upgraded to Level ${scoutingStore.teamIntelLevel}!`)
                    setTimeout(() => setScoutingMessage(null), 3000)
                  }
                }}
                className="w-full px-3 py-2 bg-bg-tertiary hover:bg-accent-primary/20 rounded text-xs font-medium transition-colors"
              >
                Upgrade to Lv.{scoutingStore.teamIntelLevel + 1} — ${((scoutingStore.teamIntelLevel + 1) * 5000).toLocaleString()}
              </button>
            )}
          </div>
          
          {/* Recent Reports */}
          {scoutingStore.scoutingReports.length > 0 && (
            <div className="bg-bg-secondary rounded-lg p-5 space-y-3">
              <h4 className="text-sm font-semibold">Recent Reports</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scoutingStore.scoutingReports.slice(-5).reverse().map(report => (
                  <div key={report.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${LEVEL_COLORS[report.levelAfter]}`} />
                    <span className="truncate flex-1">{report.driverName}</span>
                    <span className="text-text-muted">{LEVEL_LABELS[report.levelBefore]} → {LEVEL_LABELS[report.levelAfter]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, known }: { icon: React.ReactNode; label: string; value: string; known: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${known ? 'text-text-primary' : 'text-text-muted opacity-50'}`}>
      {icon}
      <span className="w-28">{label}</span>
      <span className="font-medium">{known ? value : '???'}</span>
    </div>
  )
}

export default Scouting
