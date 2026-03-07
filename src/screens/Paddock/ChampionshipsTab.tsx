import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Flag, Users, Target, Award, Star, Crown,
  Filter, Search, Calendar, MapPin, Globe2, Clock,
  ChevronRight, ChevronDown, Car, Layers, X, DollarSign, Building2,
  TrendingUp, TrendingDown, Medal, Route, Info, History,
  CheckCircle, PlusCircle, AlertCircle, Zap, Timer
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Badge,
  Button,
  DriverPortrait,
  ChampionshipBadge
} from '@/components/ui'
import { getDriverPortrait, getChampionshipLogo } from '@/utils/generated-assets'
import { useRivalStore } from '@/store/rivalStore'
import type { ChampionshipType, Series, Team, RivalDriver } from '@/store/rivalStore'
import { useCareerStore } from '@/store/careerStore'
import type { TeamSeriesEntry } from '@/store/careerStore'
import { getCategoryImage, type ImageCategory } from '@/data/stock-images'
import { getTrackById } from '@/data/ams2-tracks'
import { getTrackNarrative } from '@/data/track-narratives'

type FilterMode = 'your-entries' | 'available' | 'all'
type GroupBy = 'type' | 'tier' | 'region'

const TYPE_LABELS: Record<ChampionshipType, { label: string; icon: React.ReactNode; color: string }> = {
  'spec-series': { label: 'Spec Series', icon: <Car className="w-4 h-4" />, color: 'text-blue-400' },
  'national': { label: 'National', icon: <Flag className="w-4 h-4" />, color: 'text-green-400' },
  'continental': { label: 'Continental', icon: <Globe2 className="w-4 h-4" />, color: 'text-purple-400' },
  'international': { label: 'International', icon: <Globe2 className="w-4 h-4" />, color: 'text-cyan-400' },
  'multi-class': { label: 'Multi-Class', icon: <Layers className="w-4 h-4" />, color: 'text-orange-400' },
  'historic': { label: 'Historic', icon: <Clock className="w-4 h-4" />, color: 'text-amber-400' },
  'club': { label: 'Club & Amateur', icon: <Users className="w-4 h-4" />, color: 'text-teal-400' },
  'endurance-special': { label: 'Special Events', icon: <Zap className="w-4 h-4" />, color: 'text-red-400' },
  'single-class': { label: 'Single Class', icon: <Car className="w-4 h-4" />, color: 'text-blue-400' },
  'sprint': { label: 'Sprint', icon: <Timer className="w-4 h-4" />, color: 'text-green-400' },
  'endurance': { label: 'Endurance', icon: <Clock className="w-4 h-4" />, color: 'text-orange-400' },
  'mixed': { label: 'Mixed', icon: <Layers className="w-4 h-4" />, color: 'text-purple-400' },
}

const TIER_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'entry': { label: 'Entry Level', icon: <Flag className="w-4 h-4" />, color: 'text-gray-400' },
  'amateur': { label: 'Amateur', icon: <Users className="w-4 h-4" />, color: 'text-blue-400' },
  'semi-pro': { label: 'Semi-Pro', icon: <Target className="w-4 h-4" />, color: 'text-teal-400' },
  'professional': { label: 'Professional', icon: <Award className="w-4 h-4" />, color: 'text-purple-400' },
  'pro': { label: 'Pro Series', icon: <Award className="w-4 h-4" />, color: 'text-orange-400' },
  'elite': { label: 'Elite', icon: <Star className="w-4 h-4" />, color: 'text-yellow-400' },
  'pinnacle': { label: 'Pinnacle', icon: <Crown className="w-4 h-4" />, color: 'text-accent-gold' }
}

// Map championship types to image categories
const TYPE_TO_IMAGE: Record<string, ImageCategory> = {
  'international': 'prototype',
  'multi-class': 'prototype',
  'continental': 'gt-racing',
  'national': 'touring',
  'spec-series': 'spec-series',
  'historic': 'historic',
}

// Map tiers to image categories
const TIER_TO_IMAGE: Record<string, ImageCategory> = {
  'pinnacle': 'formula',
  'elite': 'prototype',
  'pro': 'gt-racing',
  'professional': 'gt-racing',
  'semi-pro': 'spec-series',
  'amateur': 'karting',
  'entry': 'karting',
}

export function ChampionshipsTab() {
  const { series, teams, rivals } = useRivalStore()
  const { careerState } = useCareerStore()
  
  const [filterMode, setFilterMode] = useState<FilterMode>('your-entries')
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['international', 'multi-class', 'spec-series']))
  const [selectedChampionship, setSelectedChampionship] = useState<Series | null>(null)

  // Team owner data
  const ownedTeam = careerState?.ownedTeam
  const seriesEntries = careerState?.seriesEntries || []
  const teamCars = careerState?.cars || []
  const teamRep = ownedTeam?.reputation ?? 0
  
  const safeSeries = Array.isArray(series) ? series : []
  const safeTeams = Array.isArray(teams) ? teams : []
  const safeRivals = Array.isArray(rivals) ? rivals : []
  
  // Check if team is entered in a series
  const isEnteredInSeries = (seriesId: string): TeamSeriesEntry | undefined => {
    return seriesEntries.find(e => e.seriesId === seriesId)
  }
  
  // Check if team owns a car compatible with a series
  const hasCompatibleCar = (champ: Series): boolean => {
    if (!teamCars || teamCars.length === 0) return false
    const seriesCarClasses = champ.carClassIds || [champ.carClassId]
    return teamCars.some(car => seriesCarClasses.includes(car.chassisId))
  }
  
  // Check if team can enter a series (meets requirements)
  const canEnterSeries = (champ: Series): { canEnter: boolean; reason?: string } => {
    if (!ownedTeam) return { canEnter: false, reason: 'No team owned' }
    if (isEnteredInSeries(champ.id)) return { canEnter: false, reason: 'Already entered' }
    if (!hasCompatibleCar(champ)) {
      return { canEnter: false, reason: 'No compatible car' }
    }
    if (teamRep < champ.minReputation) {
      return { canEnter: false, reason: `Need ${champ.minReputation - teamRep} more rep` }
    }
    return { canEnter: true }
  }
  
  // Get teams for selected championship
  const selectedChampTeams = useMemo(() => {
    if (!selectedChampionship) return []
    return safeTeams.filter(t => t.seriesId === selectedChampionship.id)
  }, [selectedChampionship, safeTeams])
  
  // Get drivers for selected championship
  const selectedChampDrivers = useMemo(() => {
    if (!selectedChampionship) return []
    const driverIds = selectedChampTeams.flatMap(t => t.drivers)
    return safeRivals.filter(r => driverIds.includes(r.id))
  }, [selectedChampionship, selectedChampTeams, safeRivals])

  // Filter and group championships
  const groupedChampionships = useMemo(() => {
    let filtered = [...safeSeries]
    
    // Apply filter mode
    if (filterMode === 'your-entries') {
      // Only show series the team has entered
      const enteredSeriesIds = seriesEntries.map(e => e.seriesId)
      filtered = filtered.filter(s => enteredSeriesIds.includes(s.id))
    } else if (filterMode === 'available') {
      // Show series the team can enter (has compatible car, meets rep, not already entered)
      filtered = filtered.filter(s => {
        const entry = isEnteredInSeries(s.id)
        if (entry) return false // Already entered
        if (!hasCompatibleCar(s)) return false // No compatible car
        return teamRep >= s.minReputation
      })
    }
    // 'all' mode shows everything
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.shortName.toLowerCase().includes(query) ||
        s.carClassName?.toLowerCase().includes(query)
      )
    }
    
    // Group by selected criteria
    const groups: Record<string, Series[]> = {}
    
    filtered.forEach(s => {
      let groupKey: string
      switch (groupBy) {
        case 'type':
          groupKey = s.championshipType || 'other'
          break
        case 'tier':
          groupKey = s.tier
          break
        case 'region':
          groupKey = s.region || 'Global'
          break
        default:
          groupKey = 'other'
      }
      
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(s)
    })
    
    // Sort championships within each group by prestige
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (b.prestige || 0) - (a.prestige || 0))
    })
    
    return groups
  }, [safeSeries, filterMode, groupBy, searchQuery, seriesEntries, teamRep])

  // Get entry status for display
  const getEntryStatus = (championship: Series): { entered: boolean; entry?: TeamSeriesEntry } => {
    const entry = isEnteredInSeries(championship.id)
    return { entered: !!entry, entry }
  }

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Get label and icon for group
  const getGroupConfig = (groupKey: string) => {
    if (groupBy === 'type') {
      return TYPE_LABELS[groupKey as ChampionshipType] || { label: groupKey, icon: <Trophy className="w-4 h-4" />, color: 'text-text-muted' }
    }
    if (groupBy === 'tier') {
      return TIER_CONFIG[groupKey] || { label: groupKey, icon: <Trophy className="w-4 h-4" />, color: 'text-text-muted' }
    }
    // Region
    return { label: groupKey, icon: <MapPin className="w-4 h-4" />, color: 'text-text-muted' }
  }

  // Determine group order
  const groupOrder = useMemo(() => {
    if (groupBy === 'type') {
      return ['international', 'endurance-special', 'multi-class', 'continental', 'national', 'spec-series', 'club', 'historic']
    }
    if (groupBy === 'tier') {
      return ['pinnacle', 'elite', 'pro', 'professional', 'semi-pro', 'amateur', 'entry']
    }
    // Region - alphabetical
    return Object.keys(groupedChampionships).sort()
  }, [groupBy, groupedChampionships])

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Filters Sidebar */}
      <div className="col-span-3 space-y-4">
        <Card variant="glass" padding="md">
          <CardHeader title="Filters" />
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search championships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
            />
          </div>

          {/* Filter Mode - Team Owner Perspective */}
          <div className="space-y-2 mb-4">
            <label className="text-xs text-text-muted uppercase tracking-wider">View</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFilterMode('your-entries')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left
                  ${filterMode === 'your-entries' 
                    ? 'bg-accent-red text-white' 
                    : 'bg-surface hover:bg-surface-secondary text-text-muted'
                  }
                `}
              >
                <CheckCircle className="w-4 h-4" />
                Your Entries ({seriesEntries.length})
              </button>
              <button
                onClick={() => setFilterMode('available')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left
                  ${filterMode === 'available' 
                    ? 'bg-accent-red text-white' 
                    : 'bg-surface hover:bg-surface-secondary text-text-muted'
                  }
                `}
              >
                <PlusCircle className="w-4 h-4" />
                Available to Enter
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left
                  ${filterMode === 'all' 
                    ? 'bg-accent-red text-white' 
                    : 'bg-surface hover:bg-surface-secondary text-text-muted'
                  }
                `}
              >
                <Globe2 className="w-4 h-4" />
                All Series
              </button>
            </div>
          </div>

          {/* Group By */}
          <div className="space-y-2">
            <label className="text-xs text-text-muted uppercase tracking-wider">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
            >
              <option value="type">Type (Spec, National, etc.)</option>
              <option value="tier">Tier (Entry to Pinnacle)</option>
              <option value="region">Region (Global, Europe, etc.)</option>
            </select>
          </div>
        </Card>

        {/* Team Status Overview */}
        <Card variant="glass" padding="md">
          <CardHeader title="Your Team Status" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Active Entries</span>
              <span className="font-bold text-status-success">{seriesEntries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Team Reputation</span>
              <span className="font-bold text-accent-gold">{teamRep}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Eligible Series</span>
              <span className="font-bold text-blue-400">
                {safeSeries.filter(s => canEnterSeries(s).canEnter).length}
              </span>
            </div>
            <div className="pt-2 border-t border-surface-border">
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Total Series</span>
                <span className="font-bold">{safeSeries.length}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Championship List */}
      <div className="col-span-9 space-y-4">
        {groupOrder.map(groupKey => {
          const championships = groupedChampionships[groupKey]
          if (!championships || championships.length === 0) return null
          
          const config = getGroupConfig(groupKey)
          const isExpanded = expandedGroups.has(groupKey)
          
          // Get image for this group
          const groupImageCategory = groupBy === 'type' 
            ? TYPE_TO_IMAGE[groupKey] || 'gt-racing'
            : groupBy === 'tier'
              ? TIER_TO_IMAGE[groupKey] || 'gt-racing'
              : 'gt-racing'
          const groupImage = getCategoryImage(groupImageCategory)
          
          return (
            <Card key={groupKey} variant="glass" padding="none" className="overflow-hidden">
              {/* Group Header with Hero Image */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full relative overflow-hidden"
              >
                {/* Background image */}
                <div className="absolute inset-0 h-16">
                  <img 
                    src={groupImage}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/70" />
                </div>
                
                <div className="relative flex items-center justify-between p-4 hover:bg-surface/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`${config.color}`}>{config.icon}</div>
                    <h3 className="font-display font-semibold">{config.label}</h3>
                    <Badge variant="default" size="sm">{championships.length}</Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  </motion.div>
                </div>
              </button>
              
              {/* Championship Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="divide-y divide-surface-border">
                      {championships.map((championship, index) => {
                        const teamCount = safeTeams.filter(t => t.seriesId === championship.id).length
                        const entryStatus = getEntryStatus(championship)
                        const canEnter = canEnterSeries(championship)
                        
                        return (
                          <motion.div
                            key={championship.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedChampionship(championship)}
                            className={`p-4 hover:bg-surface/30 cursor-pointer transition-colors ${
                              entryStatus.entered ? 'bg-status-success/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Entry Status Indicator */}
                              <div className="w-12 text-center">
                                {entryStatus.entered ? (
                                  <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center bg-status-success/20">
                                    <CheckCircle className="w-5 h-5 text-status-success" />
                                  </div>
                                ) : (
                                  <div className={`
                                    w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold
                                    ${championship.prestige >= 90 ? 'bg-accent-gold/20 text-accent-gold' :
                                      championship.prestige >= 75 ? 'bg-orange-500/20 text-orange-400' :
                                      championship.prestige >= 50 ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-surface text-text-muted'
                                    }
                                  `}>
                                    {championship.prestige || 50}
                                  </div>
                                )}
                              </div>
                              
                              {/* Championship Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{championship.name}</h4>
                                  {entryStatus.entered && (
                                    <Badge variant="green" size="sm">Entered</Badge>
                                  )}
                                  {championship.multiClass && (
                                    <Badge variant="orange" size="sm">Multi-Class</Badge>
                                  )}
                                  {championship.historicEra && (
                                    <Badge variant="default" size="sm">{championship.historicEra}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-text-muted">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {teamCount} competitors
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {championship.calendar?.length || 0} rounds
                                  </span>
                                  {championship.region && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {championship.region}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${championship.prizePool?.toLocaleString() || '0'} pool
                                  </span>
                                </div>
                              </div>
                              
                              {/* Tier & Entry Status */}
                              <div className="text-right">
                                <Badge 
                                  variant={
                                    championship.tier === 'pinnacle' ? 'green' :
                                    championship.tier === 'elite' ? 'blue' :
                                    championship.tier === 'pro' ? 'orange' :
                                    'default'
                                  }
                                  size="sm"
                                >
                                  {TIER_CONFIG[championship.tier]?.label || championship.tier}
                                </Badge>
                                {!entryStatus.entered && (
                                  <p className={`text-xs mt-1 ${canEnter.canEnter ? 'text-status-success' : 'text-text-muted'}`}>
                                    {canEnter.canEnter ? 'Eligible to enter' : canEnter.reason}
                                  </p>
                                )}
                                {entryStatus.entered && (
                                  <p className="text-xs text-status-success mt-1">
                                    Entered
                                  </p>
                                )}
                              </div>
                              
                              <ChevronRight className="w-5 h-5 text-text-muted" />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
        
        {Object.keys(groupedChampionships).length === 0 && (
          <Card variant="glass" padding="lg">
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">No championships match your filters</p>
            </div>
          </Card>
        )}
      </div>
      
      {/* Championship Detail Slide-in Panel */}
      <ChampionshipDetailPanel
        isOpen={!!selectedChampionship}
        championship={selectedChampionship}
        teams={selectedChampTeams}
        drivers={selectedChampDrivers}
        ownedTeam={ownedTeam}
        seriesEntry={selectedChampionship ? isEnteredInSeries(selectedChampionship.id) : undefined}
        canEnterResult={selectedChampionship ? canEnterSeries(selectedChampionship) : { canEnter: false }}
        onClose={() => setSelectedChampionship(null)}
      />
    </div>
  )
}

// Championship Detail Panel Component - Team Owner Perspective
interface ChampionshipDetailPanelProps {
  isOpen: boolean
  championship: Series | null
  teams: Team[]
  drivers: RivalDriver[]
  ownedTeam: any | undefined
  seriesEntry: TeamSeriesEntry | undefined
  canEnterResult: { canEnter: boolean; reason?: string }
  onClose: () => void
}

function ChampionshipDetailPanel({ 
  isOpen,
  championship, 
  teams, 
  drivers,
  ownedTeam,
  seriesEntry,
  canEnterResult,
  onClose 
}: ChampionshipDetailPanelProps) {
  const [activeSection, setActiveSection] = useState<'standings' | 'competitors' | 'calendar' | 'entry'>('standings')
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  
  // Get standings for this championship
  const { seasonStandings, getStandings } = useRivalStore()
  const champId = championship?.id
  const standings = champId ? (seasonStandings[champId] || getStandings(champId) || []) : []
  
  // Get team's position and points from standings
  const teamStanding = ownedTeam ? standings.find(s => s.teamId === ownedTeam.id) : null
  const teamPosition = teamStanding?.position
  const teamPoints = teamStanding?.points || 0
  
  // Sort teams by prestige (these are competitors)
  const competitorTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.prestige - a.prestige)
  }, [teams])
  
  // Find your team's drivers in standings
  const yourDriverStandings = useMemo(() => {
    if (!ownedTeam) return []
    const yourDriverIds = ownedTeam.drivers?.map((d: any) => d.driverId) || []
    return standings.filter(s => yourDriverIds.includes(s.driverId) || s.teamId === ownedTeam.id)
  }, [standings, ownedTeam])

  return (
    <AnimatePresence
      onExitComplete={() => console.log('[ChampDetailPanel] AnimatePresence onExitComplete fired')}
    >
      {isOpen && championship && (
        <>
          {/* Backdrop */}
          <motion.div
            key="championship-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={(def) => console.log('[ChampDetailPanel] Backdrop animation COMPLETE:', def)}
            onClick={() => { console.log('[ChampDetailPanel] Backdrop clicked, calling onClose'); onClose() }}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Panel */}
          <motion.div
            key="championship-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onAnimationComplete={(def) => console.log('[ChampDetailPanel] Panel animation COMPLETE:', def)}
            className="fixed top-0 right-0 h-full w-[500px] bg-background border-l border-surface-border shadow-2xl z-50 flex flex-col"
          >
      {/* Header with Hero Image */}
      <div className="relative border-b border-surface-border overflow-hidden">
        {/* Background Hero */}
        <div className="absolute inset-0 h-40">
          <img 
            src={getCategoryImage(TYPE_TO_IMAGE[championship.championshipType || 'national'] || 'gt-racing')}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
        </div>
        
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ChampionshipBadge
                  src={getChampionshipLogo(championship.id)}
                  name={championship.name}
                  size="lg"
                />
                <div>
                  <h2 className="font-display font-bold text-xl drop-shadow-lg">{championship.name}</h2>
                  <p className="text-text-secondary text-sm drop-shadow">{championship.shortName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {seriesEntry ? (
                  <Badge variant="green">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Entered
                  </Badge>
                ) : canEnterResult.canEnter ? (
                  <Badge variant="blue">
                    <PlusCircle className="w-3 h-3 mr-1" />
                    Eligible
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {canEnterResult.reason}
                  </Badge>
                )}
                <Badge 
                  variant={
                    championship.tier === 'pinnacle' ? 'green' :
                    championship.tier === 'elite' ? 'blue' :
                    championship.tier === 'pro' ? 'orange' :
                    'default'
                  }
                >
                  {TIER_CONFIG[championship.tier]?.label || championship.tier}
                </Badge>
                {championship.multiClass && (
                  <Badge variant="orange">Multi-Class</Badge>
                )}
                {championship.region && (
                  <Badge variant="default">
                    <MapPin className="w-3 h-3 mr-1" />
                    {championship.region}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="backdrop-blur-sm bg-surface/30">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Section Tabs - Team Owner Perspective */}
      <div className="flex border-b border-surface-border">
        {(['standings', 'competitors', 'calendar', 'entry'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`
              flex-1 py-3 text-sm font-medium transition-colors relative
              ${activeSection === section ? 'text-accent-red' : 'text-text-muted hover:text-text-primary'}
            `}
          >
            {section === 'standings' && <Medal className="w-4 h-4 inline mr-2" />}
            {section === 'competitors' && <Building2 className="w-4 h-4 inline mr-2" />}
            {section === 'calendar' && <Calendar className="w-4 h-4 inline mr-2" />}
            {section === 'entry' && <DollarSign className="w-4 h-4 inline mr-2" />}
            {section === 'standings' ? 'Standings' :
             section === 'competitors' ? 'Competitors' :
             section === 'calendar' ? 'Calendar' : 'Entry Info'}
            {activeSection === section && (
              <motion.div
                layoutId="detailTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-red"
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeSection === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Your Team's Position Summary (if entered) */}
              {seriesEntry && yourDriverStandings.length > 0 && (
                <Card variant="glass" padding="sm" className="mb-4 border border-status-success/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                    <span className="text-sm font-medium text-status-success">Your Team's Standings</span>
                  </div>
                  <div className="space-y-2">
                    {yourDriverStandings.map(standing => (
                      <div key={standing.driverId} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{standing.driverName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-accent-gold font-bold">P{standing.position}</span>
                          <span>{standing.points} pts</span>
                          <span className="text-text-muted">{standing.wins} wins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm text-text-muted">
                  Championship Standings
                </h3>
                <Badge variant="default" size="sm">
                  {standings.length} Drivers
                </Badge>
              </div>
              
              {standings.length > 0 ? (
                <div className="space-y-2">
                  {standings.slice(0, 20).map((standing, index) => {
                    const driver = drivers.find(d => d.id === standing.driverId)
                    const isYourDriver = yourDriverStandings.some(s => s.driverId === standing.driverId)
                    
                    return (
                      <motion.div
                        key={standing.driverId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`
                          flex items-center gap-3 p-3 bg-surface rounded-lg
                          ${isYourDriver ? 'ring-2 ring-status-success/50 bg-status-success/5' : ''}
                        `}
                      >
                        {/* Position */}
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${standing.position === 1 ? 'bg-accent-gold/20 text-accent-gold' :
                            standing.position === 2 ? 'bg-gray-400/20 text-gray-400' :
                            standing.position === 3 ? 'bg-orange-700/20 text-orange-600' :
                            'bg-surface-secondary text-text-muted'
                          }
                        `}>
                          {standing.position}
                        </div>
                        
                        {/* Driver Info */}
                        <DriverPortrait
                          src={getDriverPortrait(standing.driverName, driver?.country)}
                          name={standing.driverName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {standing.driverName}
                              {isYourDriver && <span className="text-status-success ml-1">(Your Driver)</span>}
                            </p>
                          </div>
                          <p className="text-xs text-text-muted truncate">
                            {standing.teamName}
                          </p>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <p className="font-bold text-accent-gold">{standing.wins}</p>
                            <p className="text-text-muted">Wins</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-accent-orange">{standing.podiums}</p>
                            <p className="text-text-muted">Pods</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{standing.races}</p>
                            <p className="text-text-muted">Races</p>
                          </div>
                          <div className="text-center min-w-[50px]">
                            <p className="font-bold text-lg">{standing.points}</p>
                            <p className="text-text-muted">Pts</p>
                          </div>
                        </div>
                        
                        {/* Career Stage Indicator */}
                        {driver && (
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
                            {driver.careerStage === 'peak' && <Star className="w-3 h-3" />}
                          </Badge>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Medal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Season hasn't started yet</p>
                  <p className="text-xs mt-1">Standings will appear after the first race</p>
                </div>
              )}
            </motion.div>
          )}
          
          {activeSection === 'competitors' && (
            <motion.div
              key="competitors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm text-text-muted">
                  {competitorTeams.length} Competitor Teams
                </h3>
                {seriesEntry && (
                  <Badge variant="green" size="sm">
                    Your Team Entered
                  </Badge>
                )}
              </div>
              
              {competitorTeams.map((team, index) => {
                const teamDrivers = drivers.filter(d => team.drivers.includes(d.id))
                const teamStandings = standings.filter(s => s.teamId === team.id)
                const teamPoints = teamStandings.reduce((sum, s) => sum + s.points, 0)
                const teamWins = teamStandings.reduce((sum, s) => sum + s.wins, 0)
                
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-surface rounded-xl border border-surface-border hover:border-surface-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: `${team.color}20`, color: team.color }}
                        >
                          {team.prestige}
                        </div>
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-xs text-text-muted">{team.shortName}</p>
                        </div>
                      </div>
                      {/* Development Trend */}
                      <Badge 
                        variant={
                          team.development && team.development.totalPoints > (team.development.seasonStartPoints || 0) ? 'green' :
                          team.development && team.development.totalPoints < (team.development.seasonStartPoints || 0) ? 'orange' :
                          'default'
                        } 
                        size="sm"
                      >
                        {team.development && team.development.totalPoints > (team.development.seasonStartPoints || 0) && <TrendingUp className="w-3 h-3 mr-1" />}
                        {team.development && team.development.totalPoints < (team.development.seasonStartPoints || 0) && <TrendingDown className="w-3 h-3 mr-1" />}
                        {team.development ? (team.development.totalPoints > (team.development.seasonStartPoints || 0) ? 'Improving' : team.development.totalPoints < (team.development.seasonStartPoints || 0) ? 'Declining' : 'Stable') : 'Stable'}
                      </Badge>
                    </div>
                    
                    {/* Team Performance & Resources */}
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div className="text-center p-2 bg-background/50 rounded-lg">
                        <p className="font-bold text-accent-gold">{teamWins}</p>
                        <p className="text-text-muted">Wins</p>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded-lg">
                        <p className="font-bold">{teamPoints}</p>
                        <p className="text-text-muted">Points</p>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded-lg">
                        <p className="font-bold capitalize">{team.budget}</p>
                        <p className="text-text-muted">Budget</p>
                      </div>
                    </div>
                    
                    {/* Facilities Level */}
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                      <Building2 className="w-3 h-3" />
                      <span>Facilities: {team.facilities}</span>
                    </div>
                    
                    {/* Driver Lineup */}
                    {(team.realDrivers?.length > 0 || teamDrivers.length > 0) && (
                      <div className="pt-3 border-t border-surface-border">
                        <p className="text-xs text-text-muted mb-2">Driver Lineup:</p>
                        <div className="space-y-2">
                          {/* Show real drivers first (from team data) */}
                          {team.realDrivers?.map((driver, idx) => (
                            <div 
                              key={`real-${idx}`}
                              className="flex items-center justify-between px-2 py-1.5 bg-background rounded"
                            >
                              <span className="text-sm font-medium">{driver.name}</span>
                            </div>
                          ))}
                          {/* Show rival drivers if no real drivers */}
                          {!team.realDrivers?.length && teamDrivers.map(driver => {
                            const driverStanding = standings.find(s => s.driverId === driver.id)
                            return (
                              <div 
                                key={driver.id}
                                className="flex items-center justify-between px-2 py-1.5 bg-background rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{driver.firstName} {driver.lastName}</span>
                                  <Badge 
                                    variant={
                                      driver.careerStage === 'rising' ? 'green' :
                                      driver.careerStage === 'peak' ? 'blue' :
                                      driver.careerStage === 'declining' ? 'orange' :
                                      'default'
                                    }
                                    size="sm"
                                  >
                                    {driver.careerStage}
                                  </Badge>
                                </div>
                                {driverStanding && (
                                  <span className="text-xs text-text-muted">
                                    P{driverStanding.position} • {driverStanding.points}pts
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
              
              {competitorTeams.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No competitors yet</p>
                  <p className="text-xs mt-1">Teams will appear once the season starts</p>
                </div>
              )}
            </motion.div>
          )}
          
          {activeSection === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <h3 className="font-medium text-sm text-text-muted mb-4">
                {championship.calendar?.length || 0} Rounds
              </h3>
              
              {championship.calendar?.map((race, index) => {
                const track = getTrackById(race.trackId)
                const narrative = getTrackNarrative(race.trackId)
                const isSelected = selectedTrackId === race.trackId
                
                return (
                  <motion.div
                    key={race.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      bg-surface rounded-lg overflow-hidden cursor-pointer transition-all
                      ${isSelected ? 'ring-2 ring-accent-red' : 'hover:bg-surface-secondary'}
                    `}
                    onClick={() => setSelectedTrackId(isSelected ? null : race.trackId)}
                  >
                    {/* Track Header */}
                    <div className="flex items-center gap-4 p-3">
                      <div className="w-8 h-8 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-sm font-bold">
                        {race.round}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{race.trackName}</p>
                          {narrative?.nickname && (
                            <span className="text-xs text-accent-gold italic">"{narrative.nickname}"</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{race.layoutName} • {race.lengthKm.toFixed(2)}km</p>
                      </div>
                      <div className="text-right text-xs text-text-muted">
                        <p className="flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {race.country}
                        </p>
                        <p>Week {race.week}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {/* Expanded Track Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-surface-border"
                        >
                          <div className="p-4 space-y-4">
                            {/* Track Info */}
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div className="p-2 bg-background/50 rounded-lg text-center">
                                <p className="text-text-muted">Type</p>
                                <p className="font-medium capitalize">{track?.type || 'Permanent'}</p>
                              </div>
                              <div className="p-2 bg-background/50 rounded-lg text-center">
                                <p className="text-text-muted">Region</p>
                                <p className="font-medium capitalize">{track?.region?.replace('_', ' ') || 'Unknown'}</p>
                              </div>
                              <div className="p-2 bg-background/50 rounded-lg text-center">
                                <p className="text-text-muted">Layouts</p>
                                <p className="font-medium">{track?.layoutCount || 1}</p>
                              </div>
                            </div>
                            
                            {/* Track Narrative */}
                            {narrative && (
                              <>
                                {/* Atmosphere */}
                                <div>
                                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Atmosphere
                                  </p>
                                  <p className="text-sm text-text-secondary italic">"{narrative.atmosphere}"</p>
                                </div>
                                
                                {/* Track Character */}
                                <div>
                                  <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                                    <Route className="w-3 h-3" /> Character
                                  </p>
                                  <p className="text-sm">{narrative.trackCharacter}</p>
                                </div>
                                
                                {/* Famous Corners */}
                                {narrative.famousCorners?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                                      <Target className="w-3 h-3" /> Famous Corners
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {narrative.famousCorners.slice(0, 3).map((corner, idx) => (
                                        <span 
                                          key={idx}
                                          className="px-2 py-1 bg-background/50 rounded text-xs"
                                          title={corner.description}
                                        >
                                          {corner.name}
                                          {corner.difficulty && (
                                            <span className={`ml-1 ${
                                              corner.difficulty === 'extreme' ? 'text-accent-red' :
                                              corner.difficulty === 'hard' ? 'text-accent-orange' :
                                              'text-text-muted'
                                            }`}>
                                              ({corner.difficulty})
                                            </span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Overtaking Spots */}
                                {narrative.overtakingSpots?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" /> Overtaking Opportunities
                                    </p>
                                    <p className="text-sm">{narrative.overtakingSpots.join(', ')}</p>
                                  </div>
                                )}
                                
                                {/* Key Factors */}
                                {narrative.keyFactors?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-text-muted mb-2">Key Factors for Success</p>
                                    <div className="flex flex-wrap gap-1">
                                      {narrative.keyFactors.map((factor, idx) => (
                                        <Badge key={idx} variant="default" size="sm">{factor}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* History Snippet */}
                                {narrative.historySnippets?.length > 0 && (
                                  <div className="pt-2 border-t border-surface-border">
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                                      <History className="w-3 h-3" /> Did You Know?
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                      {narrative.historySnippets[0]}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {!narrative && (
                              <p className="text-sm text-text-muted text-center py-4">
                                Track narrative not yet generated. Race here to unlock!
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
              
              {(!championship.calendar || championship.calendar.length === 0) && (
                <div className="text-center py-12 text-text-muted">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Calendar not available</p>
                </div>
              )}
            </motion.div>
          )}
          
          {activeSection === 'entry' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Entry Status */}
              <Card variant="glass" padding="md">
                <CardHeader title="Entry Status" />
                {seriesEntry ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-status-success/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-status-success" />
                      <div>
                        <p className="font-medium text-status-success">Currently Entered</p>
                        <p className="text-xs text-text-muted">Your team is competing in this series</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-background/50 rounded-lg text-center">
                        <p className="text-text-muted text-xs">Position</p>
                        <p className="font-bold text-lg">P{teamPosition || '-'}</p>
                      </div>
                      <div className="p-2 bg-background/50 rounded-lg text-center">
                        <p className="text-text-muted text-xs">Points</p>
                        <p className="font-bold text-lg">{teamPoints}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {canEnterResult.canEnter ? (
                      <div className="flex items-center gap-2 p-3 bg-status-success/10 rounded-lg">
                        <PlusCircle className="w-5 h-5 text-status-success" />
                        <div>
                          <p className="font-medium text-status-success">Eligible to Enter</p>
                          <p className="text-xs text-text-muted">Your team meets all requirements</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-status-error/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-status-error" />
                        <div>
                          <p className="font-medium text-status-error">Not Eligible</p>
                          <p className="text-xs text-text-muted">{canEnterResult.reason}</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant={canEnterResult.canEnter ? "primary" : "ghost"} 
                      className="w-full"
                      disabled={!canEnterResult.canEnter}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Enter Series
                    </Button>
                  </div>
                )}
              </Card>
              
              {/* Entry Requirements */}
              <Card variant="glass" padding="md">
                <CardHeader title="Entry Requirements" />
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Compatible Car</span>
                    <div className="flex items-center gap-2">
                      <span className={canEnterResult.reason?.includes('compatible car') ? 'text-status-error' : 'text-status-success'}>
                        {canEnterResult.reason?.includes('compatible car') ? 'Required' : 'Owned'}
                      </span>
                      {canEnterResult.reason?.includes('compatible car') ? (
                        <AlertCircle className="w-4 h-4 text-status-error" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-status-success" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Min Reputation</span>
                    <div className="flex items-center gap-2">
                      <span className={ownedTeam && ownedTeam.reputation >= championship.minReputation ? 'text-status-success' : 'text-status-error'}>
                        {championship.minReputation}
                      </span>
                      {ownedTeam && (
                        ownedTeam.reputation >= championship.minReputation ? (
                          <CheckCircle className="w-4 h-4 text-status-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-status-error" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Grid Size</span>
                    <span>{championship.gridSize} cars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Format</span>
                    <span className="capitalize">{championship.format || 'Sprint'}</span>
                  </div>
                </div>
              </Card>
              
              {/* Entry Costs & Prize Money */}
              <Card variant="glass" padding="md">
                <CardHeader title="Financial Details" />
                <div className="space-y-3 text-sm">
                  <div className="pb-2 border-b border-surface-border">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Entry Costs (Estimated)</p>
                    <div className="flex justify-between text-status-error">
                      <span>Season Entry Fee</span>
                      <span>-${((championship.prizePool || 0) * 0.1).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pb-2 border-b border-surface-border">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Prize Money</p>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Per Win</span>
                      <span className="text-status-success">+${championship.prizeMoney.win.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Per Podium</span>
                      <span className="text-accent-gold">+${championship.prizeMoney.podium.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Per Point</span>
                      <span>+${championship.prizeMoney.points.toLocaleString()}</span>
                    </div>
                  </div>
                  {championship.prizePool > 0 && (
                    <div className="flex justify-between pt-1 font-bold">
                      <span>Total Prize Pool</span>
                      <span className="text-status-success">${championship.prizePool.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Car Classes */}
              <Card variant="glass" padding="md">
                <CardHeader title="Car Classes" />
                <div className="space-y-2">
                  {championship.carClassIds?.map((classId, index) => (
                    <div key={classId} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                      <Car className="w-4 h-4 text-text-muted" />
                      <span className="text-sm">{classId}</span>
                      {index === 0 && (
                        <Badge variant="default" size="sm">Primary</Badge>
                      )}
                    </div>
                  ))}
                  {(!championship.carClassIds || championship.carClassIds.length === 0) && (
                    <div className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                      <Car className="w-4 h-4 text-text-muted" />
                      <span className="text-sm">{championship.carClassName}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </>
      )}
    </AnimatePresence>
  )
}
