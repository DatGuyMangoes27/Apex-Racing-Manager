import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Factory, Building2, Trophy, Star,
  ChevronDown, Search, Filter, Flag, Award
} from 'lucide-react'
import { Card, Badge, Modal, ManufacturerBadge } from '@/components/ui'
import { getManufacturerLogo } from '@/utils/generated-assets'
import { useRivalStore, Series } from '@/store/rivalStore'
import { 
  AMS2_MANUFACTURERS, 
  getManufacturerById 
} from '@/data/manufacturers'
import { 
  RacingProgram, 
  getProgramsByManufacturer 
} from '@/data/racing-programs'

type SortType = 'name' | 'tier' | 'teams' | 'programs'

export function ManufacturersTab() {
  const { teams, getSeriesById } = useRivalStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortType>('tier')
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set())
  const [selectedProgram, setSelectedProgram] = useState<RacingProgram | null>(null)
  const [showProgramModal, setShowProgramModal] = useState(false)

  // Manufacturers with their teams and programs
  const manufacturerData = useMemo(() => {
    return AMS2_MANUFACTURERS.map(manufacturer => {
      // Get all teams for this manufacturer
      const manufacturerTeams = teams.filter(t => t.manufacturerId === manufacturer.id)
      
      // Get all programs for this manufacturer
      const programs = getProgramsByManufacturer(manufacturer.id)
      
      // Get unique series this manufacturer competes in
      const seriesIds = new Set<string>()
      manufacturerTeams.forEach(t => seriesIds.add(t.seriesId))
      const activeSeries = Array.from(seriesIds).map(id => getSeriesById(id)).filter(Boolean) as Series[]
      
      return {
        manufacturer,
        teams: manufacturerTeams,
        programs,
        series: activeSeries,
        worksTeamCount: manufacturerTeams.filter(t => t.programType === 'works').length,
        factoryTeamCount: manufacturerTeams.filter(t => t.programType === 'factory-supported').length,
        customerTeamCount: manufacturerTeams.filter(t => t.programType === 'customer').length
      }
    }).filter(m => m.teams.length > 0) // Only show manufacturers with teams
  }, [teams, getSeriesById])

  // Filter and sort
  const filteredManufacturers = useMemo(() => {
    let result = [...manufacturerData]
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(m => 
        m.manufacturer.name.toLowerCase().includes(query) ||
        m.manufacturer.country.toLowerCase().includes(query) ||
        m.teams.some(t => t.name.toLowerCase().includes(query))
      )
    }
    
    // Apply sort
    result.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.manufacturer.name.localeCompare(b.manufacturer.name)
        case 'tier':
            const tierOrder: Record<string, number> = { 'premium': 0, 'luxury': 1, 'mainstream': 2, 'budget': 3 }
          return (tierOrder[a.manufacturer.tier] || 3) - (tierOrder[b.manufacturer.tier] || 3)
        case 'teams':
          return b.teams.length - a.teams.length
        case 'programs':
          return b.programs.length - a.programs.length
        default:
          return 0
      }
    })
    
    return result
  }, [manufacturerData, searchQuery, sort])

  // Toggle expansion
  const toggleManufacturer = (id: string) => {
    const newExpanded = new Set(expandedManufacturers)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedManufacturers(newExpanded)
  }

  // Stats
  const stats = useMemo(() => ({
    manufacturers: manufacturerData.length,
    totalPrograms: manufacturerData.reduce((acc, m) => acc + m.programs.length, 0),
    worksTeams: manufacturerData.reduce((acc, m) => acc + m.worksTeamCount, 0),
    totalTeams: manufacturerData.reduce((acc, m) => acc + m.teams.length, 0)
  }), [manufacturerData])

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
              <Factory className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.manufacturers}</p>
              <p className="text-sm text-text-muted">Manufacturers</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-status-success">{stats.totalPrograms}</p>
              <p className="text-sm text-text-muted">Racing Programs</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-red/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-accent-red" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-accent-red">{stats.worksTeams}</p>
              <p className="text-sm text-text-muted">Works Teams</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
              <Building2 className="w-6 h-6 text-text-muted" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.totalTeams}</p>
              <p className="text-sm text-text-muted">Total Teams</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search manufacturers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-red"
          >
            <option value="tier">Sort: Tier</option>
            <option value="name">Sort: Name</option>
            <option value="teams">Sort: Team Count</option>
            <option value="programs">Sort: Programs</option>
          </select>
        </div>
      </Card>

      {/* Manufacturer List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredManufacturers.map(({ manufacturer, teams: manuTeams, programs, series: manuSeries, worksTeamCount, factoryTeamCount }, index) => {
            const isExpanded = expandedManufacturers.has(manufacturer.id)
            
            return (
              <motion.div
                key={manufacturer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card variant="glass" padding="none" className="overflow-hidden">
                  {/* Manufacturer Header */}
                  <button
                    onClick={() => toggleManufacturer(manufacturer.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-surface/30 transition-colors"
                  >
                    {/* Manufacturer Badge */}
                    <ManufacturerBadge
                      src={getManufacturerLogo(manufacturer.id)}
                      name={manufacturer.name}
                      size="xl"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-lg">{manufacturer.name}</h3>
                        <Badge variant={
                          manufacturer.tier === 'premium' ? 'green' :
                          manufacturer.tier === 'luxury' ? 'blue' :
                          'default'
                        } size="sm">
                          {manufacturer.tier.charAt(0).toUpperCase() + manufacturer.tier.slice(1)}
                        </Badge>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {manufacturer.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {manuTeams.length} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {programs.length} programs
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {manuSeries.length} series
                        </span>
                        {worksTeamCount > 0 && (
                          <Badge variant="green" size="sm">{worksTeamCount} Works</Badge>
                        )}
                        {factoryTeamCount > 0 && (
                          <Badge variant="blue" size="sm">{factoryTeamCount} Factory</Badge>
                        )}
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    </motion.div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-surface-border"
                      >
                        <div className="p-4 space-y-4">
                          {/* Racing Programs */}
                          {programs.length > 0 && (
                            <div>
                              <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Racing Programs
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                {programs.map(program => (
                                  <div
                                    key={program.id}
                                    onClick={() => {
                                      setSelectedProgram(program)
                                      setShowProgramModal(true)
                                    }}
                                    className="p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-secondary transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium">{program.name}</h5>
                                      <Badge variant={
                                        program.programType === 'works' ? 'green' :
                                        program.programType === 'factory-supported' ? 'blue' :
                                        program.programType === 'spec-series' ? 'orange' :
                                        'default'
                                      } size="sm">
                                        {program.programType.replace('-', ' ')}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-text-muted line-clamp-2">
                                      {program.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                                      <span>{program.teamEntryIds.length} entries</span>
                                      <span>•</span>
                                      <span>{program.seriesIds.length} series</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Team Entries */}
                          <div>
                            <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              Team Entries ({manuTeams.length})
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {manuTeams.slice(0, 9).map(team => {
                                const teamSeries = getSeriesById(team.seriesId)
                                return (
                                  <div key={team.id} className="p-2 bg-surface rounded-lg">
                                    <p className="font-medium text-sm truncate">{team.name}</p>
                                    <p className="text-xs text-text-muted truncate">
                                      {teamSeries?.shortName || team.seriesId}
                                    </p>
                                    <Badge 
                                      variant={
                                        team.programType === 'works' ? 'green' :
                                        team.programType === 'factory-supported' ? 'blue' :
                                        'default'
                                      } 
                                      size="sm"
                                      className="mt-1"
                                    >
                                      {team.programType || 'independent'}
                                    </Badge>
                                  </div>
                                )
                              })}
                              {manuTeams.length > 9 && (
                                <div className="p-2 bg-surface rounded-lg flex items-center justify-center">
                                  <span className="text-sm text-text-muted">
                                    +{manuTeams.length - 9} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Active Series */}
                          <div>
                            <h4 className="text-sm text-text-muted mb-3 flex items-center gap-2">
                              <Trophy className="w-4 h-4" />
                              Active Championships ({manuSeries.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {manuSeries.map(s => (
                                <Badge key={s.id} variant="default" size="sm">
                                  {s.shortName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredManufacturers.length === 0 && (
          <Card variant="glass" padding="lg">
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">No manufacturers match your search</p>
            </div>
          </Card>
        )}
      </div>

      {/* Program Detail Modal */}
      <Modal
        isOpen={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        title="Racing Program"
        size="lg"
      >
        {selectedProgram && (
          <ProgramDetailView program={selectedProgram} />
        )}
      </Modal>
    </div>
  )
}

// Program Detail Component
interface ProgramDetailViewProps {
  program: RacingProgram
}

function ProgramDetailView({ program }: ProgramDetailViewProps) {
  const { teams, getSeriesById } = useRivalStore()
  const manufacturer = program.manufacturerId ? getManufacturerById(program.manufacturerId) : null
  
  const programTeams = teams.filter(t => program.teamEntryIds.includes(t.id))
  const programSeries = program.seriesIds.map(id => getSeriesById(id)).filter(Boolean) as Series[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <div 
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ 
            backgroundColor: '#66630',
            borderLeft: '4px solid #666'
          }}
        >
          <Award className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl">{program.name}</h3>
          <p className="text-text-muted">
            {manufacturer?.name || 'Unknown'} • {program.programType.replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </p>
        </div>
        <Badge variant={
          program.programType === 'works' ? 'green' :
          program.programType === 'factory-supported' ? 'blue' :
          program.programType === 'spec-series' ? 'orange' :
          'default'
        }>
          {program.programType.replace('-', ' ')}
        </Badge>
      </div>

      {/* Description */}
      <div className="p-4 bg-surface/50 rounded-xl">
        <p className="text-text-secondary">{program.description}</p>
      </div>

      {/* Program Details */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-xl text-center">
          <p className="text-2xl font-display font-bold">{programTeams.length}</p>
          <p className="text-sm text-text-muted">Team Entries</p>
        </div>
        <div className="p-4 bg-surface rounded-xl text-center">
          <p className="text-2xl font-display font-bold">{programSeries.length}</p>
          <p className="text-sm text-text-muted">Championships</p>
        </div>
        <div className="p-4 bg-surface rounded-xl text-center">
          <p className="text-2xl font-display font-bold text-accent-gold">
            {program.salaryMultiplier ? `${program.salaryMultiplier}x` : '1.0x'}
          </p>
          <p className="text-sm text-text-muted">Salary Multiplier</p>
        </div>
      </div>

      {/* Team Entries */}
      <div>
        <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Team Entries
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {programTeams.map(team => {
            const teamSeries = getSeriesById(team.seriesId)
            return (
              <div key={team.id} className="p-3 bg-surface rounded-lg flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ 
                    backgroundColor: team.color + '30',
                    color: team.color
                  }}
                >
                  {team.shortName}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{team.name}</p>
                  <p className="text-xs text-text-muted">{teamSeries?.name || team.seriesId}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Championships */}
      <div>
        <h4 className="text-text-muted text-sm mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Active Championships
        </h4>
        <div className="flex flex-wrap gap-2">
          {programSeries.map(s => (
            <div key={s.id} className="px-3 py-2 bg-surface rounded-lg">
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-text-muted">{s.tier} tier</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

