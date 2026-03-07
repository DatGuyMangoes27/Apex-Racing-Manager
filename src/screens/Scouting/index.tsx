import { useState, useMemo } from 'react'
import { Search, Eye, EyeOff, ChevronRight, Star, DollarSign, Users, Shield, Target } from 'lucide-react'
import { getDriverPortrait } from '@/utils/generated-assets'
import { useScoutingStore, type ScoutingLevel, type DriverIntelligence } from '@/store/scoutingStore'
import { useRivalStore } from '@/store/rivalStore'
import { useCareerStore } from '@/store/careerStore'
import { motion, AnimatePresence } from 'framer-motion'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

const LEVEL_COLORS: Record<ScoutingLevel, string> = {
  'unknown': 'bg-gray-500',
  'basic': 'bg-[#3b82f6]',
  'familiar': 'bg-[#00a63e]',
  'detailed': 'bg-[#8b5cf6]',
  'complete': 'bg-[#f59e0b]'
}

const LEVEL_BADGE_STYLES: Record<ScoutingLevel, string> = {
  'unknown': 'bg-gray-100 text-gray-600',
  'basic': 'bg-[#dbeafe] text-[#3b82f6]',
  'familiar': 'bg-[#dcfce7] text-[#00a63e]',
  'detailed': 'bg-[#ede9fe] text-[#8b5cf6]',
  'complete': 'bg-[#fef3c7] text-[#b45309]'
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
  
  const allDrivers = useMemo(() => {
    const seriesId = player.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId || ''
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
  }, [player.currentSeriesId, careerState.seriesEntries, rivalStore])
  
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
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <Search className="w-[28px] h-[28px] text-[#0a0a0a]" />
            <div>
              <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>Driver Scouting</h1>
              <p className="text-[14px] text-[#4a5565]" style={FR}>Intelligence on rival drivers</p>
            </div>
          </div>
          <div className="flex items-center gap-[16px] text-[14px]" style={FR}>
            <div className="flex items-center gap-[6px] text-[#0a0a0a]">
              <DollarSign className="w-[16px] h-[16px] text-[#00a63e]" />
              <span>Budget: ${scoutingStore.scoutingBudget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-[6px] text-[#0a0a0a]">
              <Shield className="w-[16px] h-[16px] text-[#3b82f6]" />
              <span>Intel Network: Lv.{scoutingStore.teamIntelLevel}</span>
            </div>
          </div>
        </div>
        
        {/* Scouting Message */}
        <AnimatePresence>
          {scoutingMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#dcfce7] border-[0.8px] border-[#00a63e]/30 rounded-[16px] px-[16px] py-[12px] text-[14px] text-[#0a0a0a]"
              style={FR}
            >
              {scoutingMessage}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Filters */}
        <div className="flex gap-[16px] items-center">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#4a5565]" />
            <input
              type="text"
              placeholder="Search drivers or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-[40px] pr-[16px] py-[10px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[12px] text-[14px] text-[#0a0a0a] focus:outline-none focus:border-black/30"
              style={FR}
            />
          </div>
          
          <div className="flex gap-[4px]">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-[12px] py-[8px] rounded-[10px] text-[12px] transition-colors ${
                filterLevel === 'all' ? 'bg-black text-white' : 'bg-[#f9fafb] text-[#4a5565] hover:text-[#0a0a0a] border-[0.8px] border-black/10'
              }`}
              style={FBold}
            >
              All
            </button>
            {LEVEL_ORDER.map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-[12px] py-[8px] rounded-[10px] text-[12px] transition-colors ${
                  filterLevel === level ? 'bg-black text-white' : 'bg-[#f9fafb] text-[#4a5565] hover:text-[#0a0a0a] border-[0.8px] border-black/10'
                }`}
                style={FBold}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
          {/* Driver List */}
          <div className="lg:col-span-2 flex flex-col gap-[8px]">
            <h3 className="text-[13px] text-[#4a5565] uppercase tracking-wider mb-[12px]" style={FBold}>
              Rival Drivers ({driversWithIntel.length})
            </h3>
            
            {driversWithIntel.length === 0 ? (
              <div className={`${INNER} p-[32px] text-center`}>
                <Users className="w-[32px] h-[32px] mx-auto mb-[8px] text-[#4a5565] opacity-50" />
                <p className="text-[14px] text-[#4a5565]" style={FR}>No drivers found matching your criteria.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-[4px]">
                {driversWithIntel.map(driver => (
                  <motion.button
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver.id)}
                    className={`w-full flex items-center gap-[12px] px-[16px] py-[12px] rounded-[16px] text-left transition-colors ${
                      selectedDriver === driver.id 
                        ? 'bg-[#f9fafb] border-[0.8px] border-black/20' 
                        : 'bg-white hover:bg-[#f9fafb] border-[0.8px] border-transparent'
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    {/* Position */}
                    <div className="w-[32px] text-center">
                      <span className="text-[13px] text-[#4a5565]" style={FBold}>
                        P{driver.position || '?'}
                      </span>
                    </div>
                    
                    {/* Intel Level Bar */}
                    <div className={`w-[4px] h-[32px] rounded-full ${LEVEL_COLORS[driver.level]}`} />
                    
                    {/* Portrait */}
                    <img
                      src={getDriverPortrait(driver.name)}
                      alt={driver.name}
                      className="w-[36px] h-[36px] rounded-full object-cover bg-[#f3f4f6]"
                    />
                    
                    {/* Driver Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[14px] text-[#0a0a0a] truncate" style={FBold}>{driver.name}</span>
                        {driver.level === 'complete' && (
                          <Star className="w-[14px] h-[14px] text-[#f59e0b] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[12px] text-[#4a5565] truncate block" style={FR}>
                        {driver.level === 'unknown' ? '???' : driver.team || 'Unknown team'}
                      </span>
                    </div>
                    
                    {/* Intel Level Badge */}
                    <span className={`text-[11px] px-[8px] py-[3px] rounded-[8px] ${LEVEL_BADGE_STYLES[driver.level]}`} style={FBold}>
                      {LEVEL_LABELS[driver.level]}
                    </span>
                    
                    {/* Scout Cost */}
                    {driver.level !== 'complete' && (
                      <span className="text-[12px] text-[#4a5565]" style={FR}>
                        ${driver.scoutCost.toLocaleString()}
                      </span>
                    )}
                    
                    <ChevronRight className="w-[16px] h-[16px] text-[#4a5565] flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
          
          {/* Detail Panel */}
          <div className="flex flex-col gap-[16px]">
            {selectedDriverData ? (
              <motion.div
                key={selectedDriverData.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${CARD} p-[20px] flex flex-col gap-[16px]`}
              >
                <div className="flex items-center gap-[12px]">
                  <img
                    src={getDriverPortrait(selectedDriverData.name)}
                    alt={selectedDriverData.name}
                    className="w-[56px] h-[56px] rounded-full object-cover bg-[#f3f4f6]"
                  />
                  <div>
                    <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>{selectedDriverData.name}</h3>
                    <p className="text-[13px] text-[#4a5565]" style={FR}>
                      {selectedDriverData.level !== 'unknown' ? selectedDriverData.team : 'Team Unknown'}
                    </p>
                  </div>
                </div>
                
                {/* Intel Level Progress */}
                <div>
                  <div className="flex justify-between text-[12px] mb-[4px]">
                    <span className="text-[#4a5565]" style={FR}>Intelligence Level</span>
                    <span className="text-[#0a0a0a]" style={FBold}>{LEVEL_LABELS[selectedDriverData.level]}</span>
                  </div>
                  <div className="flex gap-[4px]">
                    {LEVEL_ORDER.map((level, i) => (
                      <div
                        key={level}
                        className={`h-[8px] flex-1 rounded-full ${
                          LEVEL_ORDER.indexOf(selectedDriverData.level) >= i
                            ? LEVEL_COLORS[level]
                            : 'bg-[#f3f4f6]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Known Data */}
                <div className="flex flex-col gap-[8px]">
                  <h4 className="text-[13px] text-[#4a5565]" style={FBold}>Known Information</h4>
                  
                  {selectedDriverData.level === 'unknown' && (
                    <p className="text-[12px] text-[#4a5565] italic" style={FR}>
                      Very little is known about this driver. Scout them to learn more.
                    </p>
                  )}
                  
                  {selectedDriverData.level !== 'unknown' && (
                    <div className="flex flex-col gap-[6px]">
                      <InfoRow icon={<Eye className="w-[12px] h-[12px]" />} label="Team" value={selectedDriverData.team || 'Unknown'} known={true} />
                      <InfoRow icon={<Eye className="w-[12px] h-[12px]" />} label="Championship Pos" value={`P${selectedDriverData.position || '?'}`} known={true} />
                      <InfoRow 
                        icon={selectedDriverData.level !== 'unknown' && selectedDriverData.level !== 'basic' ? <Eye className="w-[12px] h-[12px]" /> : <EyeOff className="w-[12px] h-[12px]" />} 
                        label="Individual Stats" 
                        value={scoutingStore.canSeeData(selectedDriverData.id, 'individualStats') ? 'Visible' : 'Hidden'} 
                        known={scoutingStore.canSeeData(selectedDriverData.id, 'individualStats')} 
                      />
                      <InfoRow 
                        icon={selectedDriverData.level === 'detailed' || selectedDriverData.level === 'complete' ? <Eye className="w-[12px] h-[12px]" /> : <EyeOff className="w-[12px] h-[12px]" />} 
                        label="Exact Stat Values" 
                        value={scoutingStore.canSeeData(selectedDriverData.id, 'exactValues') ? 'Visible' : 'Hidden'} 
                        known={scoutingStore.canSeeData(selectedDriverData.id, 'exactValues')} 
                      />
                      <InfoRow 
                        icon={selectedDriverData.level === 'complete' ? <Eye className="w-[12px] h-[12px]" /> : <EyeOff className="w-[12px] h-[12px]" />} 
                        label="Contract Details" 
                        value={scoutingStore.canSeeData(selectedDriverData.id, 'contractDetails') ? 'Visible' : 'Hidden'} 
                        known={scoutingStore.canSeeData(selectedDriverData.id, 'contractDetails')} 
                      />
                      <InfoRow 
                        icon={selectedDriverData.level === 'complete' ? <Eye className="w-[12px] h-[12px]" /> : <EyeOff className="w-[12px] h-[12px]" />} 
                        label="Form Trends" 
                        value={scoutingStore.canSeeData(selectedDriverData.id, 'formTrends') ? 'Visible' : 'Hidden'} 
                        known={scoutingStore.canSeeData(selectedDriverData.id, 'formTrends')} 
                      />
                    </div>
                  )}
                </div>
                
                {/* Races Shared */}
                {selectedDriverData.intel && (
                  <div className="text-[12px] text-[#4a5565]" style={FR}>
                    Races shared: {selectedDriverData.intel.racedAgainst}
                  </div>
                )}
                
                {/* Scout Button */}
                {selectedDriverData.level !== 'complete' && (
                  <button
                    onClick={() => handleScout(selectedDriverData.id, selectedDriverData.name)}
                    className="w-full flex items-center justify-center gap-[8px] px-[16px] py-[12px] bg-black hover:bg-black/80 text-white rounded-[16px] text-[14px] transition-colors"
                    style={FBold}
                  >
                    <Target className="w-[16px] h-[16px]" />
                    Scout Driver (${selectedDriverData.scoutCost.toLocaleString()})
                  </button>
                )}
                
                {selectedDriverData.level === 'complete' && (
                  <div className="flex items-center gap-[8px] px-[16px] py-[12px] bg-[#dcfce7] border-[0.8px] border-[#00a63e]/20 rounded-[16px] text-[14px] text-[#00a63e]" style={FR}>
                    <Star className="w-[16px] h-[16px]" />
                    Full Intelligence — No further scouting needed
                  </div>
                )}
              </motion.div>
            ) : (
              <div className={`${INNER} p-[32px] text-center`}>
                <Eye className="w-[32px] h-[32px] mx-auto mb-[8px] text-[#4a5565] opacity-50" />
                <p className="text-[14px] text-[#4a5565]" style={FR}>Select a driver to view intelligence</p>
              </div>
            )}
            
            {/* Team Intelligence Network */}
            <div className={`${CARD} p-[20px] flex flex-col gap-[12px]`}>
              <h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>Intelligence Network</h4>
              <div className="flex items-center gap-[8px]">
                <div className="flex gap-[2px]">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-[24px] h-[12px] rounded-[4px] ${
                        level <= scoutingStore.teamIntelLevel 
                          ? 'bg-black' 
                          : 'bg-[#f3f4f6]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-[#4a5565]" style={FR}>Level {scoutingStore.teamIntelLevel}/5</span>
              </div>
              <p className="text-[12px] text-[#4a5565]" style={FR}>
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
                  className="w-full px-[12px] py-[10px] bg-[#f9fafb] hover:bg-[#f3f4f6] border-[0.8px] border-black/10 rounded-[12px] text-[13px] transition-colors"
                  style={FBold}
                >
                  Upgrade to Lv.{scoutingStore.teamIntelLevel + 1} — ${((scoutingStore.teamIntelLevel + 1) * 5000).toLocaleString()}
                </button>
              )}
            </div>
            
            {/* Recent Reports */}
            {scoutingStore.scoutingReports.length > 0 && (
              <div className={`${CARD} p-[20px] flex flex-col gap-[12px]`}>
                <h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>Recent Reports</h4>
                <div className="flex flex-col gap-[8px] max-h-[192px] overflow-y-auto">
                  {scoutingStore.scoutingReports.slice(-5).reverse().map(report => (
                    <div key={report.id} className="flex items-center gap-[8px] text-[12px]" style={FR}>
                      <div className={`w-[6px] h-[6px] rounded-full ${LEVEL_COLORS[report.levelAfter]}`} />
                      <span className="truncate flex-1 text-[#0a0a0a]">{report.driverName}</span>
                      <span className="text-[#4a5565]">{LEVEL_LABELS[report.levelBefore]} → {LEVEL_LABELS[report.levelAfter]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, known }: { icon: React.ReactNode; label: string; value: string; known: boolean }) {
  return (
    <div className={`flex items-center gap-[8px] text-[12px] ${known ? 'text-[#0a0a0a]' : 'text-[#4a5565] opacity-50'}`} style={FR}>
      {icon}
      <span className="w-[112px]">{label}</span>
      <span style={FBold}>{known ? value : '???'}</span>
    </div>
  )
}

export default Scouting
