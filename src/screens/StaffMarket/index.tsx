import { useState, useMemo, useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Filter, RefreshCw, DollarSign, TrendingUp, Star,
  Briefcase, MapPin, Clock, Award, ChevronRight, UserPlus, UserMinus,
  Building2, AlertCircle, Check, X, Zap, Target, Heart, Info, Handshake,
  ThumbsUp, ThumbsDown, Minus, Plus, MessageSquare
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, PageHeader, Modal, useToast, Progress, StaffPortrait } from '@/components/ui'
import { getStaffPortrait, getRandomStaffPortraitByRole, getPortraitByManifestId, getFallbackPortrait } from '@/utils/generated-assets'
import { useCareerStore, HiredFacilityStaff, FacilityType } from '@/store/careerStore'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { routeNotification } from '@/services/notificationRouter'
import { formatCurrency } from '@/data/financial-config'
import {
  FacilityStaffMember,
  TeamStaffMember,
  StaffMember,
  FacilityStaffRole,
  TeamStaffRole,
  StaffRole,
  FACILITY_STAFF_ROLE_NAMES,
  TEAM_STAFF_ROLE_NAMES,
  STAFF_ROLE_NAMES,
  FACILITY_STAFF_ROLE_DESCRIPTIONS,
  TEAM_STAFF_ROLE_DESCRIPTIONS,
  STAFF_ROLE_DESCRIPTIONS,
  STAFF_ROLE_CATEGORY,
  ROLE_FACILITY_MAPPING,
  TRAIT_DESCRIPTIONS,
  TRAIT_EFFECTS,
  calculateContractCost,
  calculateYearlySalaryCost,
  calculateFacilityEffectiveness,
  BASE_SALARY_BY_ROLE
} from '@/data/facility-staff-config'
import {
  FACILITY_NAMES,
  FACILITY_TYPES,
  getFacilityLevelConfig
} from '@/data/facility-config'

// Role icons for facility staff
const FACILITY_ROLE_ICONS: Record<FacilityStaffRole, React.ReactNode> = {
  aerodynamicist: <Zap className="w-4 h-4" />,
  structural_engineer: <Building2 className="w-4 h-4" />,
  power_unit_engineer: <Target className="w-4 h-4" />,
  simulation_specialist: <TrendingUp className="w-4 h-4" />,
  production_manager: <Briefcase className="w-4 h-4" />,
  marketing_manager: <Heart className="w-4 h-4" />,
  junior_engineer: <Users className="w-4 h-4" />,
  senior_engineer: <Award className="w-4 h-4" />,
  department_head: <Star className="w-4 h-4" />
}

// Role icons for team/race staff
const TEAM_ROLE_ICONS: Record<TeamStaffRole, React.ReactNode> = {
  chief_engineer: <Star className="w-4 h-4" />,
  technical_director: <Award className="w-4 h-4" />,
  strategist: <Target className="w-4 h-4" />,
  race_engineer: <TrendingUp className="w-4 h-4" />,
  crew_chief: <Briefcase className="w-4 h-4" />,
  team_manager: <Users className="w-4 h-4" />,
  pr_manager: <Heart className="w-4 h-4" />,
  data_analyst: <TrendingUp className="w-4 h-4" />,
  performance_engineer: <Zap className="w-4 h-4" />
}

// Combined role icons
const ROLE_ICONS: Record<StaffRole, React.ReactNode> = {
  ...FACILITY_ROLE_ICONS,
  ...TEAM_ROLE_ICONS
}

// Skill colors
const SKILL_COLORS = {
  technical: 'text-blue-400',
  management: 'text-purple-400',
  innovation: 'text-amber-400',
  reliability: 'text-green-400',
  communication: 'text-pink-400'
}

export function StaffMarket() {
  const {
    careerState,
    refreshFacilityStaffMarket,
    hireFacilityStaff,
    fireFacilityStaff,
    assignFacilityStaffToFacility,
    unassignFacilityStaffFromFacility,
    consumeHoursFromBudget,
    addPersonalCalendarEntry
  } = useCareerStore()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<'market' | 'hired'>('market')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | HiredFacilityStaff | null>(null)
  const [showFireModal, setShowFireModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)
  const [filterRole, setFilterRole] = useState<StaffRole | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'facility' | 'team'>('all')
  const [filterFacility, setFilterFacility] = useState<FacilityType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'reputation' | 'salary' | 'skill'>('reputation')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Negotiation state
  const [negotiationStage, setNegotiationStage] = useState<'offer' | 'counter' | 'final' | 'accepted' | 'rejected'>('offer')
  const [negotiationRound, setNegotiationRound] = useState(0)
  const [candidateMood, setCandidateMood] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [counterOffer, setCounterOffer] = useState<{
    salary: number
    signingBonus: number
    contractLength: number
    performanceBonus: number
  } | null>(null)
  const [offerForm, setOfferForm] = useState({
    salary: 0,
    signingBonus: 0,
    contractLength: 1,
    performanceBonus: 0
  })

  // Auto-refresh market if empty
  useEffect(() => {
    if (careerState?.ownedTeam && (!careerState.facilityStaffMarket || careerState.facilityStaffMarket.length === 0)) {
      refreshFacilityStaffMarket()
    }
  }, [careerState?.ownedTeam])

  if (!careerState?.ownedTeam) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Team Owned</h2>
          <p className="text-text-muted">You need to own a team to hire facility staff.</p>
        </div>
      </div>
    )
  }

  const team = careerState.ownedTeam
  const market = careerState.facilityStaffMarket || []
  const hiredStaff = team.facilityStaff || []
  const cash = team.budgets?.cash || 0

  // Filter and sort market
  const filteredMarket = useMemo(() => {
    let filtered = [...market] as StaffMember[]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        STAFF_ROLE_NAMES[s.role].toLowerCase().includes(query) ||
        s.nationality.toLowerCase().includes(query)
      )
    }

    // Category filter (facility vs team staff)
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.staffCategory === filterCategory)
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(s => s.role === filterRole)
    }

    // Facility filter (only applies to facility staff)
    if (filterFacility !== 'all') {
      filtered = filtered.filter(s => {
        if (s.staffCategory === 'team') return false // Team staff don't work in facilities
        return ROLE_FACILITY_MAPPING[s.role as FacilityStaffRole]?.includes(filterFacility)
      })
    }

    // Sort
    switch (sortBy) {
      case 'reputation':
        filtered.sort((a, b) => b.reputation - a.reputation)
        break
      case 'salary':
        filtered.sort((a, b) => a.salary - b.salary)
        break
      case 'skill':
        filtered.sort((a, b) => {
          const avgA = Object.values(a.skills).reduce((x, y) => x + y, 0) / 5
          const avgB = Object.values(b.skills).reduce((x, y) => x + y, 0) / 5
          return avgB - avgA
        })
        break
    }

    return filtered
  }, [market, searchQuery, filterRole, filterCategory, filterFacility, sortBy])

  // Filter hired staff
  const filteredHired = useMemo(() => {
    let filtered = [...hiredStaff]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        STAFF_ROLE_NAMES[s.role]?.toLowerCase().includes(query)
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(s => s.role === filterRole)
    }

    if (filterFacility !== 'all') {
      filtered = filtered.filter(s => s.assignedFacility === filterFacility)
    }

    return filtered
  }, [hiredStaff, searchQuery, filterRole, filterFacility])

  // Calculate weekly payroll
  const weeklyPayroll = useMemo(() => {
    return hiredStaff.reduce((sum, s) => sum + s.salary, 0)
  }, [hiredStaff])

  // Start negotiation with default offer
  const startNegotiation = (staff: StaffMember) => {
    // Set default offer based on staff expectations
    const baseSalary = staff.salary
    const baseSigningBonus = calculateContractCost(staff as FacilityStaffMember)
    
    setOfferForm({
      salary: Math.round(baseSalary * 0.9), // Start slightly below expectation
      signingBonus: Math.round(baseSigningBonus * 0.85),
      contractLength: staff.contractYears || 1,
      performanceBonus: Math.round(baseSalary * 4) // ~1 month salary as performance bonus
    })
    setNegotiationStage('offer')
    setNegotiationRound(0)
    setCandidateMood('neutral')
    setCounterOffer(null)
    setShowDetailModal(false)
    setShowNegotiationModal(true)
  }

  // Evaluate offer and determine response
  const evaluateOffer = (staff: StaffMember) => {
    const expectedSalary = staff.salary
    const expectedBonus = calculateContractCost(staff as FacilityStaffMember)
    
    // Calculate satisfaction score
    const salaryRatio = offerForm.salary / expectedSalary
    const bonusRatio = offerForm.signingBonus / expectedBonus
    
    let satisfaction = 50
    
    // Salary evaluation (biggest factor)
    if (salaryRatio >= 1.1) satisfaction += 30
    else if (salaryRatio >= 1.0) satisfaction += 20
    else if (salaryRatio >= 0.9) satisfaction += 10
    else if (salaryRatio >= 0.8) satisfaction -= 10
    else if (salaryRatio >= 0.7) satisfaction -= 25
    else satisfaction -= 40
    
    // Signing bonus
    if (bonusRatio >= 1.2) satisfaction += 15
    else if (bonusRatio >= 0.9) satisfaction += 5
    else if (bonusRatio < 0.6) satisfaction -= 15
    
    // Contract length bonus
    if (offerForm.contractLength >= (staff.contractYears || 1)) satisfaction += 5
    
    // Performance bonus
    if (offerForm.performanceBonus > 0) satisfaction += Math.min(10, offerForm.performanceBonus / 1000)
    
    return Math.max(0, Math.min(100, satisfaction))
  }

  // Submit offer
  const submitOffer = () => {
    if (!selectedStaff || 'hiredWeek' in selectedStaff) return // Only StaffMember, not HiredFacilityStaff
    
    const satisfaction = evaluateOffer(selectedStaff)
    const newRound = negotiationRound + 1
    setNegotiationRound(newRound)
    
    // Determine mood
    if (satisfaction >= 70) setCandidateMood('positive')
    else if (satisfaction >= 40) setCandidateMood('neutral')
    else setCandidateMood('negative')
    
    // High satisfaction = accept
    if (satisfaction >= 80) {
      setNegotiationStage('accepted')
      return
    }
    
    // Very low satisfaction = reject
    if (satisfaction < 25) {
      setNegotiationStage('rejected')
      return
    }
    
    // Max 3 rounds
    if (newRound >= 3) {
      if (satisfaction >= 50) {
        setNegotiationStage('final')
      } else {
        setNegotiationStage('rejected')
      }
      return
    }
    
    // Generate counter offer
    const expectedSalary = selectedStaff.salary
    const expectedBonus = calculateContractCost(selectedStaff as FacilityStaffMember)
    const meetingPoint = 0.3 + (newRound * 0.2) // Gets closer to player each round
    
    setCounterOffer({
      salary: Math.round(offerForm.salary + (expectedSalary - offerForm.salary) * (1 - meetingPoint)),
      signingBonus: Math.round(offerForm.signingBonus + (expectedBonus - offerForm.signingBonus) * (1 - meetingPoint)),
      contractLength: selectedStaff.contractYears || 1,
      performanceBonus: Math.max(offerForm.performanceBonus, Math.round(expectedSalary * 4))
    })
    setNegotiationStage('counter')
  }

  // Accept counter offer
  const acceptCounterOffer = () => {
    if (counterOffer) {
      setOfferForm(counterOffer)
      setNegotiationStage('accepted')
    }
  }

  // Final hire with negotiated terms
  const finalizeHire = () => {
    if (!selectedStaff) return

    const result = hireFacilityStaff(selectedStaff.id)
    if (result.success) {
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const hiringTimeCost = getActivityTimeCost('staff_hiring')
      if (hiringTimeCost.hours > 0) {
        consumeHoursFromBudget(hiringTimeCost.hours, hiringTimeCost.drain, `Hire: ${selectedStaff.name}`, 'staff_hiring')
      }
      addPersonalCalendarEntry({
        name: `Staff Hiring: ${selectedStaff.name}`,
        description: `Signed ${selectedStaff.name} to the team`,
        activityId: 'staff_hiring',
        week: careerState?.currentWeek ?? 1,
        day: careerState?.currentDay ?? 1,
        duration: hiringTimeCost.hours,
        drainLevel: hiringTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'team',
        immediate: true
      })
      routeNotification({
        category: 'staff_hr',
        subject: `New Hire: ${selectedStaff.name}`,
        body: `${selectedStaff.name} has signed their contract and will be joining the team. Their onboarding process is underway.`,
      })
      
      addToast({
        type: 'success',
        title: 'Contract Signed!',
        message: `${selectedStaff.name} has agreed to join your team at ${formatCurrency(offerForm.salary)}/week!`,
        duration: 4000
      })
      setShowNegotiationModal(false)
      setSelectedStaff(null)
    } else {
      addToast({
        type: 'error',
        title: 'Hiring Failed',
        message: result.error || 'Unable to complete the hire',
        duration: 4000
      })
    }
  }


  // Handle fire
  const handleFire = () => {
    if (!selectedStaff) return

    const result = fireFacilityStaff(selectedStaff.id)
    if (result.success) {
      addToast({
        type: 'info',
        title: 'Staff Terminated',
        message: `${selectedStaff.name} has left the team.`,
        duration: 4000
      })
      setShowFireModal(false)
      setSelectedStaff(null)
    } else {
      addToast({
        type: 'error',
        title: 'Termination Failed',
        message: result.error || 'Unable to terminate staff member',
        duration: 4000
      })
    }
  }

  // Handle assignment
  const handleAssign = (facilityType: FacilityType) => {
    if (!selectedStaff) return

    const result = assignFacilityStaffToFacility(selectedStaff.id, facilityType)
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Staff Assigned',
        message: `${selectedStaff.name} is now working in ${FACILITY_NAMES[facilityType]}.`,
        duration: 3000
      })
      setShowAssignModal(false)
      setSelectedStaff(null)
    } else {
      addToast({
        type: 'error',
        title: 'Assignment Failed',
        message: result.error || 'Unable to assign staff',
        duration: 4000
      })
    }
  }

  // Handle unassign
  const handleUnassign = (staffId: string) => {
    const result = unassignFacilityStaffFromFacility(staffId)
    if (result.success) {
      addToast({
        type: 'info',
        title: 'Staff Unassigned',
        message: 'Staff member is now unassigned.',
        duration: 3000
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Market"
        subtitle="Hire and manage your team's personnel - both factory staff and race crew"
        icon={<Users className="w-6 h-6" />}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-info/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-status-info" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Staff</p>
              <p className="font-mono font-bold text-lg">{hiredStaff.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-danger/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-status-danger" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Weekly Payroll</p>
              <p className="font-mono font-bold text-lg text-status-danger">
                {formatCurrency(weeklyPayroll)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-success/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Assigned</p>
              <p className="font-mono font-bold text-lg">
                {hiredStaff.filter(s => s.assignedFacility).length} / {hiredStaff.length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Available Budget</p>
              <p className="font-mono font-bold text-lg">
                {formatCurrency(cash)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-surface-border pb-4">
        <Button
          variant={activeTab === 'market' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('market')}
        >
          <Search className="w-4 h-4 mr-2" />
          Staff Market ({market.length})
        </Button>
        <Button
          variant={activeTab === 'hired' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('hired')}
        >
          <Users className="w-4 h-4 mr-2" />
          My Staff ({hiredStaff.length})
        </Button>

        <div className="flex-1" />

        {activeTab === 'market' && (
          <Button
            variant="secondary"
            onClick={() => refreshFacilityStaffMarket()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Market
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, role, or nationality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as 'all' | 'facility' | 'team')}
          className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
        >
          <option value="all">All Staff Types</option>
          <option value="facility">Facility Staff (R&D)</option>
          <option value="team">Team Staff (Race)</option>
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as StaffRole | 'all')}
          className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
        >
          <option value="all">All Roles</option>
          {filterCategory !== 'team' && (
            <optgroup label="Facility Staff">
              {Object.entries(FACILITY_STAFF_ROLE_NAMES).map(([role, name]) => (
                <option key={role} value={role}>{name}</option>
              ))}
            </optgroup>
          )}
          {filterCategory !== 'facility' && (
            <optgroup label="Team/Race Staff">
              {Object.entries(TEAM_STAFF_ROLE_NAMES).map(([role, name]) => (
                <option key={role} value={role}>{name}</option>
              ))}
            </optgroup>
          )}
        </select>

        {filterCategory !== 'team' && (
          <select
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value as FacilityType | 'all')}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
          >
            <option value="all">All Facilities</option>
            {FACILITY_TYPES.map(type => (
              <option key={type} value={type}>{FACILITY_NAMES[type]}</option>
            ))}
          </select>
        )}

        {activeTab === 'market' && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'reputation' | 'salary' | 'skill')}
            className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="salary">Sort by Salary (Low)</option>
            <option value="skill">Sort by Skill</option>
          </select>
        )}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {activeTab === 'market' ? (
            filteredMarket.length > 0 ? (
              filteredMarket.map((staff, index) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  index={index}
                  isHired={false}
                  canAfford={cash >= calculateContractCost(staff as FacilityStaffMember)}
                  onHire={() => {
                    setSelectedStaff(staff)
                    startNegotiation(staff)
                  }}
                  onViewDetails={() => {
                    setSelectedStaff(staff)
                    setShowDetailModal(true)
                  }}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-text-muted">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No staff members match your filters.</p>
              </div>
            )
          ) : (
            filteredHired.length > 0 ? (
              filteredHired.map((staff, index) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  index={index}
                  isHired={true}
                  canAfford={true}
                  onFire={() => {
                    setSelectedStaff(staff)
                    setShowFireModal(true)
                  }}
                  onAssign={() => {
                    setSelectedStaff(staff)
                    setShowAssignModal(true)
                  }}
                  onUnassign={() => handleUnassign(staff.id)}
                  onViewDetails={() => {
                    setSelectedStaff(staff)
                    setShowDetailModal(true)
                  }}
                />
              ))
            ) : (
              <div className="col-span-3">
                <div className="text-center py-12 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-accent-orange/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-accent-orange" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">No Staff Hired Yet</h3>
                  <p className="text-text-muted mb-4">
                    Hire skilled staff to improve your team's performance. Key roles include Chief Engineer (car reliability), 
                    Strategist (race tactics), and Performance Analysts (development speed).
                  </p>
                  <div className="p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg text-left mb-4">
                    <h4 className="text-sm font-medium text-accent-gold mb-2">Hiring Tips:</h4>
                    <ul className="text-xs text-text-secondary space-y-1">
                      <li>- Chief Engineer and Strategist should be hired first</li>
                      <li>- Higher-skilled staff cost more but perform better</li>
                      <li>- Check contract length before committing</li>
                    </ul>
                  </div>
                  <Button variant="secondary" onClick={() => setActiveTab('market')}>
                    Browse Available Staff
                  </Button>
                </div>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Fire Confirmation Modal */}
      <Modal
        isOpen={showFireModal && selectedStaff !== null}
        onClose={() => {
          setShowFireModal(false)
          setSelectedStaff(null)
        }}
        title="Confirm Termination"
        size="md"
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
              <div className="w-14 h-14 rounded-full bg-status-danger/20 flex items-center justify-center text-status-danger">
                <UserMinus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedStaff.name}</h3>
                <p className="text-sm text-text-muted">
                  {STAFF_ROLE_NAMES[selectedStaff.role]}
                </p>
              </div>
            </div>

            <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
              <p className="text-sm text-status-warning">
                Terminating this staff member will cost <span className="font-mono font-bold">
                  {formatCurrency(selectedStaff.salary * 2)}
                </span> in severance pay (2 weeks salary).
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-border">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowFireModal(false)
                  setSelectedStaff(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleFire}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Terminate
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Contract Negotiation Modal */}
      <Modal
        isOpen={showNegotiationModal && selectedStaff !== null}
        onClose={() => {
          setShowNegotiationModal(false)
          setSelectedStaff(null)
        }}
        title="Contract Negotiation"
        size="lg"
      >
        {selectedStaff && (
          <div className="space-y-6">
            {/* Header with staff info */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                'staffCategory' in selectedStaff && selectedStaff.staffCategory === 'team'
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {ROLE_ICONS[selectedStaff.role]}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{selectedStaff.name}</h3>
                <p className="text-sm text-text-muted">{STAFF_ROLE_NAMES[selectedStaff.role]}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  candidateMood === 'positive' ? 'bg-status-success/20 text-status-success' :
                  candidateMood === 'negative' ? 'bg-status-danger/20 text-status-danger' :
                  'bg-surface-secondary text-text-muted'
                }`}>
                  {candidateMood === 'positive' ? <ThumbsUp className="w-4 h-4" /> :
                   candidateMood === 'negative' ? <ThumbsDown className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                  <span className="capitalize">{candidateMood}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Round {negotiationRound}/3</p>
              </div>
            </div>

            {/* Negotiation Result Messages */}
            {negotiationStage === 'accepted' && (
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-6 h-6 text-status-success" />
                  <div>
                    <p className="font-medium text-status-success">Offer Accepted!</p>
                    <p className="text-sm text-text-muted">{selectedStaff.name} is happy with your offer and ready to sign.</p>
                  </div>
                </div>
              </div>
            )}

            {negotiationStage === 'rejected' && (
              <div className="p-4 bg-status-danger/10 border border-status-danger/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <ThumbsDown className="w-6 h-6 text-status-danger" />
                  <div>
                    <p className="font-medium text-status-danger">Offer Rejected</p>
                    <p className="text-sm text-text-muted">{selectedStaff.name} is not interested in your offer. The negotiations have broken down.</p>
                  </div>
                </div>
              </div>
            )}

            {negotiationStage === 'final' && (
              <div className="p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-status-warning" />
                  <div>
                    <p className="font-medium text-status-warning">Final Decision</p>
                    <p className="text-sm text-text-muted">{selectedStaff.name} will accept your current offer, but won't negotiate further.</p>
                  </div>
                </div>
              </div>
            )}

            {negotiationStage === 'counter' && counterOffer && (
              <div className="p-4 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Handshake className="w-6 h-6 text-accent-orange mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-accent-orange">Counter Offer</p>
                    <p className="text-sm text-text-muted mb-3">{selectedStaff.name} has made a counter proposal:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-background rounded">
                        <span className="text-text-muted">Salary:</span>
                        <span className="ml-2 font-mono font-bold">{formatCurrency(counterOffer.salary)}/wk</span>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <span className="text-text-muted">Signing:</span>
                        <span className="ml-2 font-mono font-bold">{formatCurrency(counterOffer.signingBonus)}</span>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <span className="text-text-muted">Length:</span>
                        <span className="ml-2 font-mono font-bold">{counterOffer.contractLength} yr</span>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <span className="text-text-muted">Perf. Bonus:</span>
                        <span className="ml-2 font-mono font-bold">{formatCurrency(counterOffer.performanceBonus)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Offer Form (shown during offer or counter stages) */}
            {(negotiationStage === 'offer' || negotiationStage === 'counter') && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-text-muted uppercase tracking-wide">Your Offer</h4>
                
                {/* Salary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="text-text-muted">Weekly Salary</label>
                    <span className="text-xs text-text-muted">
                      (Expects: {formatCurrency(selectedStaff.salary)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, salary: Math.max(100, prev.salary - 500) }))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="number"
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 bg-background border border-surface-border rounded-lg text-center font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, salary: prev.salary + 500 }))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Signing Bonus */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="text-text-muted">Signing Bonus</label>
                    <span className="text-xs text-text-muted">
                      (Standard: {formatCurrency(calculateContractCost(selectedStaff as FacilityStaffMember))})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, signingBonus: Math.max(0, prev.signingBonus - 5000) }))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="number"
                      value={offerForm.signingBonus}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, signingBonus: parseInt(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 bg-background border border-surface-border rounded-lg text-center font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, signingBonus: prev.signingBonus + 5000 }))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Contract Length */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="text-text-muted">Contract Length (Years)</label>
                    <span className="text-xs text-text-muted">
                      (Prefers: {selectedStaff.contractYears} yr)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, contractLength: Math.max(1, prev.contractLength - 1) }))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 py-2 bg-background border border-surface-border rounded-lg text-center font-mono">
                      {offerForm.contractLength} year{offerForm.contractLength > 1 ? 's' : ''}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, contractLength: Math.min(5, prev.contractLength + 1) }))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Performance Bonus */}
                <div className="space-y-2">
                  <label className="text-sm text-text-muted">Annual Performance Bonus</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, performanceBonus: Math.max(0, prev.performanceBonus - 1000) }))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="number"
                      value={offerForm.performanceBonus}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, performanceBonus: parseInt(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 bg-background border border-surface-border rounded-lg text-center font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOfferForm(prev => ({ ...prev, performanceBonus: prev.performanceBonus + 1000 }))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Summary */}
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h4 className="font-medium text-sm mb-3">Cost Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Signing Bonus:</span>
                  <span className="font-mono text-status-danger">{formatCurrency(offerForm.signingBonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Weekly Salary:</span>
                  <span className="font-mono">{formatCurrency(offerForm.salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Year 1 Total:</span>
                  <span className="font-mono text-status-warning">{formatCurrency(offerForm.signingBonus + (offerForm.salary * 52) + offerForm.performanceBonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Your Cash:</span>
                  <span className={`font-mono ${cash >= offerForm.signingBonus ? 'text-status-success' : 'text-status-danger'}`}>
                    {formatCurrency(cash)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-surface-border">
              {negotiationStage === 'offer' && (
                <>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setShowNegotiationModal(false)
                      setSelectedStaff(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={cash < offerForm.signingBonus}
                    onClick={submitOffer}
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Submit Offer
                  </Button>
                </>
              )}

              {negotiationStage === 'counter' && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowNegotiationModal(false)
                      setSelectedStaff(null)
                    }}
                  >
                    Walk Away
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={cash < offerForm.signingBonus}
                    onClick={submitOffer}
                  >
                    Counter Offer
                  </Button>
                  {counterOffer && (
                    <Button
                      variant="primary"
                      disabled={cash < counterOffer.signingBonus}
                      onClick={acceptCounterOffer}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept Their Terms
                    </Button>
                  )}
                </>
              )}

              {negotiationStage === 'final' && (
                <>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setShowNegotiationModal(false)
                      setSelectedStaff(null)
                    }}
                  >
                    Walk Away
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={cash < offerForm.signingBonus}
                    onClick={() => setNegotiationStage('accepted')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept & Sign
                  </Button>
                </>
              )}

              {negotiationStage === 'accepted' && (
                <>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setShowNegotiationModal(false)
                      setSelectedStaff(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={cash < offerForm.signingBonus}
                    onClick={finalizeHire}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Contract
                  </Button>
                </>
              )}

              {negotiationStage === 'rejected' && (
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowNegotiationModal(false)
                    setSelectedStaff(null)
                  }}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign to Facility Modal */}
      <Modal
        isOpen={showAssignModal && selectedStaff !== null}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedStaff(null)
        }}
        title={`Assign ${selectedStaff?.name || 'Staff'} to Facility`}
        size="md"
      >
        {selectedStaff && (
          <AssignmentPanel
            staff={selectedStaff as HiredFacilityStaff}
            facilities={team.facilities}
            facilityStaff={hiredStaff}
            onAssign={handleAssign}
            onClose={() => {
              setShowAssignModal(false)
              setSelectedStaff(null)
            }}
          />
        )}
      </Modal>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        staff={selectedStaff as StaffMember | null}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedStaff(null)
        }}
        onNegotiate={activeTab === 'market' ? () => {
          setShowDetailModal(false)
          if (selectedStaff && !('hiredWeek' in selectedStaff)) startNegotiation(selectedStaff)
        } : undefined}
        canAfford={selectedStaff && !('hiredWeek' in selectedStaff) && selectedStaff.staffCategory === 'facility' ? cash >= calculateContractCost(selectedStaff as FacilityStaffMember) : false}
        cash={cash}
      />
    </div>
  )
}

// ============================================
// Staff Card Component
// ============================================

interface StaffCardProps {
  staff: StaffMember | HiredFacilityStaff
  index: number
  isHired: boolean
  canAfford: boolean
  onHire?: () => void
  onFire?: () => void
  onAssign?: () => void
  onUnassign?: () => void
  onViewDetails?: () => void
}

const StaffCard = forwardRef<HTMLDivElement, StaffCardProps>(function StaffCard({
  staff,
  index,
  isHired,
  canAfford,
  onHire,
  onFire,
  onAssign,
  onUnassign,
  onViewDetails
}, ref) {
  const avgSkill = Math.round(Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5)
  const hiredStaff = staff as HiredFacilityStaff
  const isFacilityStaff = 'staffCategory' in staff ? staff.staffCategory === 'facility' : true
  const isTeamStaff = 'staffCategory' in staff && staff.staffCategory === 'team'

  // Get best suited facilities for this role (only for facility staff)
  const suitedFacilities = isFacilityStaff ? ROLE_FACILITY_MAPPING[staff.role as FacilityStaffRole] : []

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        variant="glass"
        padding="md"
        className={`cursor-pointer transition-all hover:border-accent-blue/50 ${
          !canAfford && !isHired ? 'opacity-60' : ''
        }`}
        onClick={onViewDetails}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <StaffPortrait
              src={
                ('portraitId' in staff && staff.portraitId) 
                  ? (getPortraitByManifestId(staff.portraitId) || getFallbackPortrait(('gender' in staff && staff.gender) || 'male'))
                  : (getStaffPortrait(staff.id) || getRandomStaffPortraitByRole(staff.role))
              }
              name={staff.name}
              role={STAFF_ROLE_NAMES[staff.role]}
              size="lg"
            />
            <div>
              <h4 className="font-bold">{staff.name}</h4>
              <p className="text-xs text-text-muted">
                {STAFF_ROLE_NAMES[staff.role]}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={staff.reputation >= 70 ? 'green' : staff.reputation >= 40 ? 'yellow' : 'default'} size="sm">
              <Star className="w-3 h-3 mr-1" />
              {staff.reputation}
            </Badge>
            <Badge variant={isTeamStaff ? 'purple' : 'default'} size="sm" className="text-[10px]">
              {isTeamStaff ? 'Race Staff' : 'Facility'}
            </Badge>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {staff.nationality}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {staff.experience}y exp
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            {staff.age}yo
          </span>
        </div>

        {/* Skills Summary */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          {Object.entries(staff.skills).map(([skill, value]) => (
            <div key={skill} className="text-center">
              <div className={`text-xs font-medium ${SKILL_COLORS[skill as keyof typeof SKILL_COLORS]}`}>
                {value}
              </div>
              <div className="text-[10px] text-text-muted uppercase">
                {skill.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>

        {/* Suited Facilities (Facility Staff only) or Team Info */}
        {isFacilityStaff && suitedFacilities.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-3">
            {suitedFacilities.slice(0, 3).map(facility => (
              <Badge key={facility} variant="outline" size="sm" className="text-xs">
                {FACILITY_NAMES[facility]}
              </Badge>
            ))}
            {suitedFacilities.length > 3 && (
              <Badge variant="outline" size="sm" className="text-xs">
                +{suitedFacilities.length - 3}
              </Badge>
            )}
          </div>
        ) : isTeamStaff && 'racesWorked' in staff ? (
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" size="sm" className="text-xs">
              {(staff as TeamStaffMember).racesWorked || 0} races
            </Badge>
            {(staff as TeamStaffMember).championshipsWon && (staff as TeamStaffMember).championshipsWon! > 0 && (
              <Badge variant="green" size="sm" className="text-xs">
                🏆 {(staff as TeamStaffMember).championshipsWon} titles
              </Badge>
            )}
          </div>
        ) : null}

        {/* Traits */}
        {staff.traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {staff.traits.slice(0, 2).map(trait => (
              <Badge key={trait} variant="purple" size="sm" className="text-xs capitalize">
                {trait.replace('_', ' ')}
              </Badge>
            ))}
            {staff.traits.length > 2 && (
              <Badge variant="purple" size="sm" className="text-xs">
                +{staff.traits.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Salary / Assignment */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-border">
          {isHired ? (
            <>
              <div>
                <p className="text-xs text-text-muted">Weekly Salary</p>
                <p className="font-mono font-bold text-status-danger">
                  {formatCurrency(staff.salary)}
                </p>
              </div>
              {isFacilityStaff ? (
                hiredStaff.assignedFacility ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="green" size="sm">
                      <Building2 className="w-3 h-3 mr-1" />
                      {FACILITY_NAMES[hiredStaff.assignedFacility]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnassign?.()
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign?.()
                    }}
                  >
                    Assign
                  </Button>
                )
              ) : (
                <Badge variant="purple" size="sm">
                  Race Crew
                </Badge>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-text-muted">Signing Bonus</p>
                <p className={`font-mono font-bold ${canAfford ? 'text-white' : 'text-status-danger'}`}>
                  {formatCurrency(calculateContractCost(staff as FacilityStaffMember))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails?.()
                  }}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onHire?.()
                  }}
                >
                  <Handshake className="w-3 h-3 mr-1" />
                  Negotiate
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  )
})

// ============================================
// Assignment Panel Component
// ============================================

interface AssignmentPanelProps {
  staff: HiredFacilityStaff
  facilities: any
  facilityStaff: HiredFacilityStaff[]
  onAssign: (facilityType: FacilityType) => void
  onClose: () => void
}

function AssignmentPanel({ staff, facilities, facilityStaff, onAssign, onClose }: AssignmentPanelProps) {
  // Ensure staff is facility staff (not team staff)
  const isFacilityRole = staff.role in ROLE_FACILITY_MAPPING
  const facilityRole = isFacilityRole ? staff.role as FacilityStaffRole : null
  
  // Calculate effectiveness for each facility
  const facilityEffectiveness = useMemo(() => {
    const effectiveness: Record<FacilityType, number> = {} as Record<FacilityType, number>
    if (!facilityRole) return effectiveness
    FACILITY_TYPES.forEach(type => {
      effectiveness[type] = calculateFacilityEffectiveness(staff as FacilityStaffMember, type)
    })
    return effectiveness
  }, [staff, facilityRole])

  // Get current assignments
  const facilityAssignments = useMemo(() => {
    const assignments: Record<FacilityType, number> = {} as Record<FacilityType, number>
    FACILITY_TYPES.forEach(type => {
      assignments[type] = facilityStaff.filter(s => s.assignedFacility === type).length
    })
    return assignments
  }, [facilityStaff])

  // Best suited facilities for this role
  const suitedFacilities = facilityRole ? ROLE_FACILITY_MAPPING[facilityRole] : []

  return (
    <div className="space-y-4">
      {/* Staff Info */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue">
          {ROLE_ICONS[staff.role]}
        </div>
        <div>
          <h4 className="font-bold">{staff.name}</h4>
          <p className="text-sm text-text-muted">{facilityRole ? FACILITY_STAFF_ROLE_NAMES[facilityRole] : STAFF_ROLE_NAMES[staff.role]}</p>
        </div>
      </div>

      {/* Suited Facilities Note */}
      <div className="p-3 bg-status-info/10 border border-status-info/30 rounded-lg">
        <p className="text-sm text-status-info">
          <strong>Best suited for:</strong>{' '}
          {suitedFacilities.map((f: FacilityType) => FACILITY_NAMES[f]).join(', ')}
        </p>
      </div>

      {/* Facility Options */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {FACILITY_TYPES.map(type => {
          const facilityState = facilities?.[type]
          const level = facilityState?.level || 1
          const levelConfig = getFacilityLevelConfig(level)
          const currentAssigned = facilityAssignments[type]
          const slotsAvailable = levelConfig.staffSlots - currentAssigned
          const effectiveness = facilityEffectiveness[type]
          const isSuited = suitedFacilities.includes(type)

          return (
            <div
              key={type}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                slotsAvailable > 0
                  ? 'bg-surface border-surface-border hover:border-accent-blue/50 cursor-pointer'
                  : 'bg-background border-surface-border/50 opacity-60'
              }`}
              onClick={() => slotsAvailable > 0 && onAssign(type)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSuited ? 'bg-status-success/20 text-status-success' : 'bg-surface-elevated'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{FACILITY_NAMES[type]}</span>
                    {isSuited && (
                      <Badge variant="green" size="sm">Suited</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    Level {level} • {currentAssigned}/{levelConfig.staffSlots} staff
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Effectiveness</p>
                <p className={`font-mono font-bold ${
                  effectiveness >= 70 ? 'text-status-success' :
                  effectiveness >= 50 ? 'text-status-warning' : 'text-text-muted'
                }`}>
                  {effectiveness}%
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-surface-border">
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Staff Detail Modal Component
// ============================================

interface StaffDetailModalProps {
  staff: StaffMember | null
  isOpen: boolean
  onClose: () => void
  onNegotiate?: () => void
  canAfford: boolean
  cash: number
}

export function StaffDetailModal({ staff, isOpen, onClose, onNegotiate, canAfford, cash }: StaffDetailModalProps) {
  if (!staff) return null

  const avgSkill = Math.round(Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5)
  const isTeamStaff = staff.staffCategory === 'team'
  const teamStaff = staff as TeamStaffMember
  const signingBonus = calculateContractCost(staff as FacilityStaffMember)
  const yearlySalary = calculateYearlySalaryCost(staff as FacilityStaffMember)

  // For facility staff, get suited facilities
  const suitedFacilities = !isTeamStaff ? ROLE_FACILITY_MAPPING[staff.role as FacilityStaffRole] : []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Profile"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isTeamStaff ? 'bg-accent-purple/20' : 'bg-accent-blue/20'
          }`}>
            <div className={`w-10 h-10 ${isTeamStaff ? 'text-accent-purple' : 'text-accent-blue'}`}>
              {ROLE_ICONS[staff.role]}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-display font-bold">{staff.name}</h2>
              <Badge variant={staff.reputation >= 70 ? 'green' : staff.reputation >= 40 ? 'yellow' : 'default'}>
                <Star className="w-3 h-3 mr-1" />
                Rep: {staff.reputation}
              </Badge>
            </div>
            <p className="text-lg text-text-muted">{STAFF_ROLE_NAMES[staff.role]}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {staff.nationality}
              </span>
              <span>•</span>
              <span>{staff.age} years old</span>
              <span>•</span>
              <span>{staff.experience} years experience</span>
            </div>
          </div>
        </div>

        {/* Staff Type Badge */}
        <div className={`p-3 rounded-lg ${isTeamStaff ? 'bg-accent-purple/10 border border-accent-purple/30' : 'bg-accent-blue/10 border border-accent-blue/30'}`}>
          <div className="flex items-center gap-2">
            {isTeamStaff ? (
              <>
                <Award className="w-5 h-5 text-accent-purple" />
                <div>
                  <p className="font-medium text-accent-purple">Team/Race Staff</p>
                  <p className="text-xs text-text-muted">Works trackside during race weekends - pit wall, strategy, pit crew management</p>
                </div>
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 text-accent-blue" />
                <div>
                  <p className="font-medium text-accent-blue">Facility Staff</p>
                  <p className="text-xs text-text-muted">Works at HQ/Factory on R&D, manufacturing, and development</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Skills */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-cyan" />
                Skills
              </h3>
              <div className="space-y-3">
                {Object.entries(staff.skills).map(([skill, value]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{skill}</span>
                      <span className={`font-mono font-bold ${
                        value >= 70 ? 'text-status-success' :
                        value >= 50 ? 'text-accent-orange' : 'text-text-muted'
                      }`}>{value}</span>
                    </div>
                    <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          value >= 70 ? 'bg-status-success' :
                          value >= 50 ? 'bg-accent-orange' : 'bg-text-muted'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-surface-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">Average</span>
                    <span className={`font-mono font-bold ${
                      avgSkill >= 70 ? 'text-status-success' :
                      avgSkill >= 50 ? 'text-accent-orange' : 'text-text-muted'
                    }`}>{avgSkill}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Traits */}
            {staff.traits.length > 0 && (
              <Card className="p-4">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-status-error" />
                  Traits
                </h3>
                <div className="space-y-2">
                  {staff.traits.map(trait => {
                    const effect = TRAIT_EFFECTS[trait]
                    return (
                      <div key={trait} className="p-2 rounded-lg bg-surface-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{trait.replace('_', ' ')}</span>
                          <Badge variant="purple" size="sm">
                            +{Math.round(effect.bonusValue * 100)}% {effect.bonusType}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted">{TRAIT_DESCRIPTIONS[trait]}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Contract & Role Info */}
          <div className="space-y-4">
            {/* Contract Details */}
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-status-success" />
                Contract Expectations
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Weekly Salary</span>
                  <span className="font-mono font-bold text-status-danger">
                    {formatCurrency(staff.salary)}/wk
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Signing Bonus</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(signingBonus)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Yearly Salary</span>
                  <span className="font-mono font-bold text-status-warning">
                    {formatCurrency(yearlySalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Contract Length</span>
                  <span className="font-mono">{staff.contractYears} year{staff.contractYears > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Availability</span>
                  <Badge variant={staff.availability === 'available' ? 'green' : 'default'} size="sm">
                    {staff.availability === 'available' ? 'Immediately' : staff.availability}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Role Description */}
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent-blue" />
                Role Information
              </h3>
              <p className="text-sm text-text-muted mb-3">
                {STAFF_ROLE_DESCRIPTIONS[staff.role]}
              </p>
              
              {/* Facility Staff: Suited Facilities */}
              {!isTeamStaff && suitedFacilities.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Best Suited For</p>
                  <div className="flex flex-wrap gap-1">
                    {suitedFacilities.map(facility => (
                      <Badge key={facility} variant="default" size="sm">
                        <Building2 className="w-3 h-3 mr-1" />
                        {FACILITY_NAMES[facility]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Staff: Race Experience */}
              {isTeamStaff && (
                <div className="space-y-2 mt-3 pt-3 border-t border-surface-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Races Worked
                    </span>
                    <span className="font-mono">{teamStaff.racesWorked || 0}</span>
                  </div>
                  {(teamStaff.championshipsWon || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Championships Won
                      </span>
                      <span className="font-mono text-accent-gold">{teamStaff.championshipsWon}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-border">
          <div>
            {!canAfford && (
              <div className="flex items-center gap-2 text-status-danger text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Insufficient funds (need {formatCurrency(signingBonus)}, have {formatCurrency(cash)})</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {onNegotiate && (
              <Button
                variant="primary"
                onClick={onNegotiate}
              >
                <Handshake className="w-4 h-4 mr-2" />
                Start Negotiation
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
