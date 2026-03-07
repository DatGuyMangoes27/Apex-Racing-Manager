import { useState, useMemo, useEffect, forwardRef } from 'react'
import {
  Users, Search, Filter, RefreshCw, DollarSign, TrendingUp, Star,
  Briefcase, MapPin, Clock, Award, ChevronRight, UserPlus, UserMinus,
  Building2, AlertCircle, Check, X, Zap, Target, Heart, Info, Handshake,
  ThumbsUp, ThumbsDown, Minus, Plus, MessageSquare, Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui'
import { getStaffPortrait, getRandomStaffPortraitByRole, getPortraitByManifestId, getFallbackPortrait } from '@/utils/generated-assets'
import { useCareerStore, HiredFacilityStaff, FacilityType, WorldStaffMember, getDayName } from '@/store/careerStore'
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
  BASE_SALARY_BY_ROLE,
  enrichStaffBios,
  generateRuntimeBio
} from '@/data/facility-staff-config'
import {
  FACILITY_NAMES,
  FACILITY_TYPES,
  getFacilityLevelConfig
} from '@/data/facility-config'
import { getStaffById, getStaffByName } from '@/services/preGeneratedContentService'
import { getDateFromWeekAndDay, isValidWeekDay } from '@/utils/calendar'
import { DelegationPanel } from '@/components/owner'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

function Portrait({ src, name, size = 48 }: { src: string; name: string; size?: number }) {
  return (
    <div className="rounded-full bg-[#f9fafb] border-[0.8px] border-black/10 overflow-hidden shrink-0" style={{ width: size, height: size }}>
      <img src={src} alt={name} className="w-full h-full object-cover" />
    </div>
  )
}

const FACILITY_ROLE_ICONS: Record<FacilityStaffRole, React.ReactNode> = {
  aerodynamicist: <Zap className="w-[16px] h-[16px]" />,
  structural_engineer: <Building2 className="w-[16px] h-[16px]" />,
  power_unit_engineer: <Target className="w-[16px] h-[16px]" />,
  simulation_specialist: <TrendingUp className="w-[16px] h-[16px]" />,
  production_manager: <Briefcase className="w-[16px] h-[16px]" />,
  marketing_manager: <Heart className="w-[16px] h-[16px]" />,
  junior_engineer: <Users className="w-[16px] h-[16px]" />,
  senior_engineer: <Award className="w-[16px] h-[16px]" />,
  department_head: <Star className="w-[16px] h-[16px]" />
}

const TEAM_ROLE_ICONS: Record<TeamStaffRole, React.ReactNode> = {
  chief_engineer: <Star className="w-[16px] h-[16px]" />,
  technical_director: <Award className="w-[16px] h-[16px]" />,
  strategist: <Target className="w-[16px] h-[16px]" />,
  race_engineer: <TrendingUp className="w-[16px] h-[16px]" />,
  crew_chief: <Briefcase className="w-[16px] h-[16px]" />,
  team_manager: <Users className="w-[16px] h-[16px]" />,
  pr_manager: <Heart className="w-[16px] h-[16px]" />,
  data_analyst: <TrendingUp className="w-[16px] h-[16px]" />,
  performance_engineer: <Zap className="w-[16px] h-[16px]" />
}

const ROLE_ICONS: Record<StaffRole, React.ReactNode> = {
  ...FACILITY_ROLE_ICONS,
  ...TEAM_ROLE_ICONS
}

const SKILL_COLORS: Record<string, string> = {
  technical: 'text-[#3b82f6]',
  management: 'text-[#a855f7]',
  innovation: 'text-[#f59e0b]',
  reliability: 'text-[#00a63e]',
  communication: 'text-[#ec4899]'
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
    addPersonalCalendarEntry,
    poachAIStaff,
    confirmPoachHire,
    isCandidateInterviewed,
    getInterviewEligibleStaff,
    getActivitiesForDay,
    checkScheduleConflict,
    scheduleStaffInterview,
    markCandidateSignedElsewhere,
    requestDelegatedSearch,
    getDelegatedShortlist,
    resolveShortlist,
    setPendingShortlistId,
    removeFromShortlist,
    getInterviewedCandidates
  } = useCareerStore()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<'market' | 'shortlist' | 'hired'>('market')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | HiredFacilityStaff | null>(null)
  const [showFireModal, setShowFireModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)
  const [filterRole, setFilterRole] = useState<StaffRole | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'facility' | 'team'>('all')
  const [filterFacility, setFilterFacility] = useState<FacilityType | 'all'>('all')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'free-agent' | 'under-contract'>('all')
  const [sortBy, setSortBy] = useState<'reputation' | 'salary' | 'skill'>('reputation')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPoachModal, setShowPoachModal] = useState(false)
  const [poachResult, setPoachResult] = useState<{ hired?: boolean; counterOffer?: boolean; message?: string; buyoutCost?: number; offeredSalary?: number; confirmed?: boolean } | null>(null)
  const [poachDeclinedInterview, setPoachDeclinedInterview] = useState<boolean | null>(null)
  const [marketPage, setMarketPage] = useState(0)
  const MARKET_PAGE_SIZE = 30

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
  const [showInterviewChoiceModal, setShowInterviewChoiceModal] = useState(false)
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false)
  const [scheduleWeek, setScheduleWeek] = useState(1)
  const [scheduleDay, setScheduleDay] = useState(1)
  const [scheduleConductedBy, setScheduleConductedBy] = useState<'owner' | string>('owner')
  const [rejectionReason, setRejectionReason] = useState<'not_interested' | 'signed_elsewhere' | null>(null)
  const [showDelegateSearchModal, setShowDelegateSearchModal] = useState(false)
  const [delegateSearchRole, setDelegateSearchRole] = useState<StaffRole>('team_manager')
  const [showShortlistModal, setShowShortlistModal] = useState(false)
  const [shortlistIdToShow, setShortlistIdToShow] = useState<string | null>(null)

  useEffect(() => {
    if (careerState?.ownedTeam && (!careerState.facilityStaffMarket || careerState.facilityStaffMarket.length === 0)) {
      refreshFacilityStaffMarket()
    }
  }, [careerState?.ownedTeam])

  useEffect(() => {
    setMarketPage(0)
  }, [searchQuery, filterRole, filterCategory, filterFacility, filterAvailability, sortBy])

  if (!careerState?.ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <Users className="w-[64px] h-[64px] mx-auto mb-[16px] text-[#4a5565] opacity-50" />
          <h2 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No Team Owned</h2>
          <p className="text-[14px] text-[#4a5565]" style={FR}>You need to own a team to hire facility staff.</p>
        </div>
      </div>
    )
  }

  const team = careerState.ownedTeam
  const freeAgentMarket = careerState.facilityStaffMarket || []
  const hiredStaff = team.facilityStaff || []
  const cash = team.budgets?.cash || 0
  const worldPool = careerState.worldStaffPool || []

  const staffEmployerMap = useMemo(() => {
    const map = new Map<string, WorldStaffMember>()
    for (const member of worldPool) {
      map.set(member.staff.id, member)
    }
    return map
  }, [worldPool])

  const employedAIStaff = useMemo(() => {
    return worldPool.filter(m => m.status === 'employed_ai').map(m => m.staff)
  }, [worldPool])

  const market = useMemo(() => {
    if (filterAvailability === 'free-agent') return freeAgentMarket
    if (filterAvailability === 'under-contract') return employedAIStaff
    const seen = new Set<string>()
    const combined: StaffMember[] = []
    for (const s of freeAgentMarket) { if (!seen.has(s.id)) { seen.add(s.id); combined.push(s) } }
    for (const s of employedAIStaff) { if (!seen.has(s.id)) { seen.add(s.id); combined.push(s) } }
    return combined
  }, [freeAgentMarket, employedAIStaff, filterAvailability])

  const filteredMarket = useMemo(() => {
    let filtered = [...market] as StaffMember[]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => {
        const poolEntry = staffEmployerMap.get(s.id)
        const employer = poolEntry?.employedBy || ''
        return s.name.toLowerCase().includes(query) || STAFF_ROLE_NAMES[s.role].toLowerCase().includes(query) || s.nationality.toLowerCase().includes(query) || employer.toLowerCase().includes(query)
      })
    }
    if (filterCategory !== 'all') filtered = filtered.filter(s => s.staffCategory === filterCategory)
    if (filterRole !== 'all') filtered = filtered.filter(s => s.role === filterRole)
    if (filterFacility !== 'all') {
      filtered = filtered.filter(s => {
        if (s.staffCategory === 'team') return false
        return ROLE_FACILITY_MAPPING[s.role as FacilityStaffRole]?.includes(filterFacility)
      })
    }
    switch (sortBy) {
      case 'reputation': filtered.sort((a, b) => b.reputation - a.reputation); break
      case 'salary': filtered.sort((a, b) => a.salary - b.salary); break
      case 'skill': filtered.sort((a, b) => { const avgA = Object.values(a.skills).reduce((x, y) => x + y, 0) / 5; const avgB = Object.values(b.skills).reduce((x, y) => x + y, 0) / 5; return avgB - avgA }); break
    }
    return filtered
  }, [market, searchQuery, filterRole, filterCategory, filterFacility, sortBy, staffEmployerMap])

  const filteredHired = useMemo(() => {
    let filtered = [...hiredStaff]
    if (searchQuery) { const query = searchQuery.toLowerCase(); filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || STAFF_ROLE_NAMES[s.role]?.toLowerCase().includes(query)) }
    if (filterRole !== 'all') filtered = filtered.filter(s => s.role === filterRole)
    if (filterFacility !== 'all') filtered = filtered.filter(s => s.assignedFacility === filterFacility)
    return filtered
  }, [hiredStaff, searchQuery, filterRole, filterFacility])

  const interviewedIds = careerState.staffInterviewedCandidateIds || []
  const conductedByMap = careerState.staffInterviewConductedBy || {}
  const shortlistedCandidates = useMemo(() => getInterviewedCandidates(), [interviewedIds.length, freeAgentMarket, worldPool])
  const weeklyPayroll = useMemo(() => hiredStaff.reduce((sum, s) => sum + s.salary, 0), [hiredStaff])

  const startNegotiation = (staff: StaffMember) => {
    const baseSalary = staff.salary
    const baseSigningBonus = calculateContractCost(staff as FacilityStaffMember)
    setOfferForm({ salary: Math.round(baseSalary * 0.9), signingBonus: Math.round(baseSigningBonus * 0.85), contractLength: staff.contractYears || 1, performanceBonus: Math.round(baseSalary * 4) })
    setNegotiationStage('offer'); setNegotiationRound(0); setCandidateMood('neutral'); setCounterOffer(null); setRejectionReason(null)
    setShowDetailModal(false); setShowNegotiationModal(true)
  }

  const evaluateOffer = (staff: StaffMember) => {
    const expectedSalary = staff.salary
    const expectedBonus = calculateContractCost(staff as FacilityStaffMember)
    const salaryRatio = offerForm.salary / expectedSalary
    const bonusRatio = offerForm.signingBonus / expectedBonus
    let satisfaction = 50
    if (salaryRatio >= 1.1) satisfaction += 30; else if (salaryRatio >= 1.0) satisfaction += 20; else if (salaryRatio >= 0.9) satisfaction += 10; else if (salaryRatio >= 0.8) satisfaction -= 10; else if (salaryRatio >= 0.7) satisfaction -= 25; else satisfaction -= 40
    if (bonusRatio >= 1.2) satisfaction += 15; else if (bonusRatio >= 0.9) satisfaction += 5; else if (bonusRatio < 0.6) satisfaction -= 15
    if (offerForm.contractLength >= (staff.contractYears || 1)) satisfaction += 5
    if (offerForm.performanceBonus > 0) satisfaction += Math.min(10, offerForm.performanceBonus / 1000)
    return Math.max(0, Math.min(100, satisfaction))
  }

  const submitOffer = () => {
    if (!selectedStaff || 'hiredWeek' in selectedStaff) return
    const satisfaction = evaluateOffer(selectedStaff)
    const newRound = negotiationRound + 1
    setNegotiationRound(newRound)
    if (satisfaction >= 70) setCandidateMood('positive'); else if (satisfaction >= 40) setCandidateMood('neutral'); else setCandidateMood('negative')
    if (satisfaction >= 80) { setNegotiationStage('accepted'); return }
    if (satisfaction >= 65 && satisfaction < 80 && Math.random() < 0.3) { setNegotiationStage('accepted'); return }
    if (satisfaction < 25) { setNegotiationStage('rejected'); if (Math.random() < 0.35) { markCandidateSignedElsewhere(selectedStaff.id); setRejectionReason('signed_elsewhere') } else { setRejectionReason('not_interested') }; return }
    if (newRound >= 3) { if (satisfaction >= 50) { setNegotiationStage('final') } else { setNegotiationStage('rejected'); if (Math.random() < 0.35) { markCandidateSignedElsewhere(selectedStaff.id); setRejectionReason('signed_elsewhere') } else { setRejectionReason('not_interested') } }; return }
    const expectedSalary = selectedStaff.salary
    const expectedBonus = calculateContractCost(selectedStaff as FacilityStaffMember)
    const meetingPoint = 0.3 + (newRound * 0.2)
    setCounterOffer({
      salary: Math.round(offerForm.salary + (expectedSalary - offerForm.salary) * (1 - meetingPoint)),
      signingBonus: Math.round(offerForm.signingBonus + (expectedBonus - offerForm.signingBonus) * (1 - meetingPoint)),
      contractLength: selectedStaff.contractYears || 1,
      performanceBonus: Math.max(offerForm.performanceBonus, Math.round(expectedSalary * 4))
    })
    setNegotiationStage('counter')
  }

  const acceptCounterOffer = () => { if (counterOffer) { setOfferForm(counterOffer); setNegotiationStage('accepted') } }

  const finalizeHire = () => {
    if (!selectedStaff) return
    const terms = negotiationStage === 'accepted' && counterOffer
      ? { salary: counterOffer.salary, signingBonus: counterOffer.signingBonus, contractLength: counterOffer.contractLength, performanceBonus: counterOffer.performanceBonus }
      : { salary: offerForm.salary, signingBonus: offerForm.signingBonus, contractLength: offerForm.contractLength, performanceBonus: offerForm.performanceBonus }
    const result = hireFacilityStaff(selectedStaff.id, terms)
    if (result.success) {
      const hiringTimeCost = getActivityTimeCost('staff_hiring')
      if (hiringTimeCost.hours > 0) consumeHoursFromBudget(hiringTimeCost.hours, hiringTimeCost.drain, `Hire: ${selectedStaff.name}`, 'staff_hiring')
      addPersonalCalendarEntry({ name: `Staff Hiring: ${selectedStaff.name}`, description: `Signed ${selectedStaff.name} to the team`, activityId: 'staff_hiring', week: careerState?.currentWeek ?? 1, day: careerState?.currentDay ?? 1, duration: hiringTimeCost.hours, drainLevel: hiringTimeCost.drain, calendarEntryType: 'personal', category: 'team', immediate: true })
      routeNotification({ category: 'staff_hr', subject: `New Hire: ${selectedStaff.name}`, body: `${selectedStaff.name} has signed their contract and will be joining the team. Their onboarding process is underway.` })
      addToast({ type: 'success', title: 'Contract Signed!', message: `${selectedStaff.name} has agreed to join your team at ${formatCurrency(offerForm.salary)}/week!`, duration: 4000 })
      setShowNegotiationModal(false); setSelectedStaff(null)
    } else {
      addToast({ type: 'error', title: 'Hiring Failed', message: result.error || 'Unable to complete the hire', duration: 4000 })
    }
  }

  const handleFire = () => {
    if (!selectedStaff) return
    const result = fireFacilityStaff(selectedStaff.id)
    if (result.success) { addToast({ type: 'info', title: 'Staff Terminated', message: `${selectedStaff.name} has left the team.`, duration: 4000 }); setShowFireModal(false); setSelectedStaff(null) }
    else { addToast({ type: 'error', title: 'Termination Failed', message: result.error || 'Unable to terminate staff member', duration: 4000 }) }
  }

  const handleAssign = (facilityType: FacilityType) => {
    if (!selectedStaff) return
    const result = assignFacilityStaffToFacility(selectedStaff.id, facilityType)
    if (result.success) { addToast({ type: 'success', title: 'Staff Assigned', message: `${selectedStaff.name} is now working in ${FACILITY_NAMES[facilityType]}.`, duration: 3000 }); setShowAssignModal(false); setSelectedStaff(null) }
    else { addToast({ type: 'error', title: 'Assignment Failed', message: result.error || 'Unable to assign staff', duration: 4000 }) }
  }

  const handleUnassign = (staffId: string) => {
    const result = unassignFacilityStaffFromFacility(staffId)
    if (result.success) addToast({ type: 'info', title: 'Staff Unassigned', message: 'Staff member is now unassigned.', duration: 3000 })
  }

  const tabItems = [
    { id: 'market' as const, label: `Staff Market (${freeAgentMarket.length} free / ${employedAIStaff.length} contracted)`, icon: <Search className="w-[16px] h-[16px]" /> },
    { id: 'shortlist' as const, label: `Shortlist (${shortlistedCandidates.length})`, icon: <Handshake className="w-[16px] h-[16px]" /> },
    { id: 'hired' as const, label: `My Staff (${hiredStaff.length})`, icon: <Users className="w-[16px] h-[16px]" /> },
  ]

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <Users className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Staff Market</h1>
            <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>Hire and manage your team's personnel - both factory staff and race crew</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-[16px]">
          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#eff6ff] flex items-center justify-center"><Users className="w-[20px] h-[20px] text-[#3b82f6]" /></div>
              <div><p className="text-[13px] text-[#4a5565]" style={FR}>Total Staff</p><p className="text-[18px] text-[#0a0a0a]" style={FBold}>{hiredStaff.length}</p></div>
            </div>
          </div>
          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fef2f2] flex items-center justify-center"><DollarSign className="w-[20px] h-[20px] text-[#ef4444]" /></div>
              <div><p className="text-[13px] text-[#4a5565]" style={FR}>Weekly Payroll</p><p className="text-[18px] text-[#ef4444]" style={FBold}>{formatCurrency(weeklyPayroll)}</p></div>
            </div>
          </div>
          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f0fdf4] flex items-center justify-center"><Briefcase className="w-[20px] h-[20px] text-[#00a63e]" /></div>
              <div><p className="text-[13px] text-[#4a5565]" style={FR}>Assigned</p><p className="text-[18px] text-[#0a0a0a]" style={FBold}>{hiredStaff.filter(s => s.assignedFacility).length} / {hiredStaff.length}</p></div>
            </div>
          </div>
          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fffbeb] flex items-center justify-center"><Target className="w-[20px] h-[20px] text-[#f59e0b]" /></div>
              <div><p className="text-[13px] text-[#4a5565]" style={FR}>Available Budget</p><p className="text-[18px] text-[#0a0a0a]" style={FBold}>{formatCurrency(cash)}</p></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-[16px] border-b border-black/10 pb-[16px] flex-wrap">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-[8px] px-[16px] py-[8px] rounded-[12px] text-[14px] transition-colors ${
                activeTab === tab.id ? 'bg-black text-white' : 'text-[#4a5565] hover:bg-black/5'
              }`}
              style={activeTab === tab.id ? FBold : FR}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          {activeTab === 'market' && (
            <div className="flex gap-[8px]">
              {getInterviewEligibleStaff().length > 0 && (
                <button onClick={() => setShowDelegateSearchModal(true)} className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[8px] text-[13px] flex items-center gap-[6px] hover:bg-black/5 transition-colors" style={FR}>
                  <Users className="w-[14px] h-[14px]" /> Delegate search
                </button>
              )}
              <button onClick={() => refreshFacilityStaffMarket()} className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[8px] text-[13px] flex items-center gap-[6px] hover:bg-black/5 transition-colors" style={FR}>
                <RefreshCw className="w-[14px] h-[14px]" /> Refresh Market
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-[12px] flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-[16px] h-[16px] absolute left-[12px] top-1/2 -translate-y-1/2 text-[#4a5565]" />
            <input type="text" placeholder="Search by name, role, or nationality..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-[36px] pr-[16px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none focus:border-black/40" style={FR} />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR}>
            <option value="all">All Staff Types</option>
            <option value="facility">Facility Staff (R&D)</option>
            <option value="team">Team Staff (Race)</option>
          </select>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as any)} className="px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR}>
            <option value="all">All Roles</option>
            {filterCategory !== 'team' && <optgroup label="Facility Staff">{Object.entries(FACILITY_STAFF_ROLE_NAMES).map(([role, name]) => <option key={role} value={role}>{name}</option>)}</optgroup>}
            {filterCategory !== 'facility' && <optgroup label="Team/Race Staff">{Object.entries(TEAM_STAFF_ROLE_NAMES).map(([role, name]) => <option key={role} value={role}>{name}</option>)}</optgroup>}
          </select>
          {filterCategory !== 'team' && (
            <select value={filterFacility} onChange={(e) => setFilterFacility(e.target.value as any)} className="px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR}>
              <option value="all">All Facilities</option>
              {FACILITY_TYPES.map(type => <option key={type} value={type}>{FACILITY_NAMES[type]}</option>)}
            </select>
          )}
          {activeTab === 'market' && (
            <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value as any)} className="px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR}>
              <option value="all">All Availability</option>
              <option value="free-agent">Free Agents Only</option>
              <option value="under-contract">Under Contract (Poachable)</option>
            </select>
          )}
          {activeTab === 'market' && (
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR}>
              <option value="reputation">Sort by Reputation</option>
              <option value="salary">Sort by Salary (Low)</option>
              <option value="skill">Sort by Skill</option>
            </select>
          )}
        </div>

        {/* Pagination top */}
        {activeTab === 'market' && filteredMarket.length > MARKET_PAGE_SIZE && (
          <div className="flex items-center justify-between text-[14px]" style={FR}>
            <p className="text-[#4a5565]">Showing {marketPage * MARKET_PAGE_SIZE + 1}-{Math.min((marketPage + 1) * MARKET_PAGE_SIZE, filteredMarket.length)} of {filteredMarket.length} staff</p>
            <div className="flex items-center gap-[8px]">
              <button disabled={marketPage === 0} onClick={() => setMarketPage(p => Math.max(0, p - 1))} className="px-[12px] py-[6px] hover:bg-black/5 rounded-[8px] disabled:opacity-40 transition-colors">Previous</button>
              <span className="text-[#4a5565]">{marketPage + 1} / {Math.ceil(filteredMarket.length / MARKET_PAGE_SIZE)}</span>
              <button disabled={(marketPage + 1) * MARKET_PAGE_SIZE >= filteredMarket.length} onClick={() => setMarketPage(p => p + 1)} className="px-[12px] py-[6px] hover:bg-black/5 rounded-[8px] disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Staff Grid */}
        <div className="grid grid-cols-3 gap-[16px]">
          {activeTab === 'market' ? (
            filteredMarket.length > 0 ? (
              filteredMarket.slice(marketPage * MARKET_PAGE_SIZE, (marketPage + 1) * MARKET_PAGE_SIZE).map((staff, index) => {
                const poolEntry = staffEmployerMap.get(staff.id)
                const employer = poolEntry?.status === 'employed_ai' ? poolEntry.employedBy : undefined
                const buyout = employer ? staff.salary * 4 * Math.max(1, staff.contractYears || 2) : 0
                const affordable = employer ? cash >= buyout : cash >= calculateContractCost(staff as FacilityStaffMember)
                return (
                  <StaffCard key={staff.id} staff={staff} index={index} isHired={false} canAfford={affordable} employedBy={employer}
                    onHire={() => { setSelectedStaff(staff); if (isCandidateInterviewed(staff.id)) { startNegotiation(staff) } else { setShowInterviewChoiceModal(true) } }}
                    onPoach={() => { setSelectedStaff(staff); setPoachResult(null); setPoachDeclinedInterview(Math.random() < 0.35); setShowPoachModal(true) }}
                    onViewDetails={() => { setSelectedStaff(staff); setShowDetailModal(true) }} />
                )
              })
            ) : (
              <div className="col-span-3 text-center py-[48px] text-[#4a5565]">
                <Users className="w-[48px] h-[48px] mx-auto mb-[12px] opacity-50" />
                <p style={FR}>No staff members match your filters.</p>
              </div>
            )
          ) : activeTab === 'shortlist' ? (
            shortlistedCandidates.length > 0 ? (
              <>
                <div className="col-span-3 mb-[8px]">
                  <div className={`${CARD} p-[16px]`}>
                    <h3 className="text-[14px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}>
                      <Target className="w-[16px] h-[16px] text-[#f59e0b]" /> Candidate Comparison
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]" style={FR}>
                        <thead>
                          <tr className="border-b border-black/10 text-[#4a5565]">
                            <th className="text-left py-[8px] pr-[16px]" style={FBold}>Name</th>
                            <th className="text-left py-[8px] pr-[16px]" style={FBold}>Role</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>Rep</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>TEC</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>MGT</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>INN</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>REL</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>COM</th>
                            <th className="text-center py-[8px] pr-[8px]" style={FBold}>Avg</th>
                            <th className="text-right py-[8px] pr-[8px]" style={FBold}>Salary</th>
                            <th className="text-left py-[8px] pl-[8px]" style={FBold}>Traits</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shortlistedCandidates.map((staff) => {
                            const skills = staff.skills as Record<string, number>
                            const skillValues = Object.values(skills)
                            const avg = Math.round(skillValues.reduce((a, b) => a + b, 0) / Math.max(1, skillValues.length))
                            const skillKeys = ['technical', 'management', 'innovation', 'reliability', 'communication']
                            return (
                              <tr key={staff.id} className="border-b border-black/5 hover:bg-black/[0.02] cursor-pointer" onClick={() => { setSelectedStaff(staff); setShowDetailModal(true) }}>
                                <td className="py-[8px] pr-[16px] text-[#0a0a0a]" style={FBold}>{staff.name}</td>
                                <td className="py-[8px] pr-[16px] text-[#4a5565]">{STAFF_ROLE_NAMES[staff.role]}</td>
                                <td className="py-[8px] pr-[8px] text-center"><span className={staff.reputation >= 75 ? 'text-[#f59e0b]' : staff.reputation >= 50 ? 'text-[#0a0a0a]' : 'text-[#4a5565]'} style={FBold}>{staff.reputation}</span></td>
                                {skillKeys.map(sk => (<td key={sk} className="py-[8px] pr-[8px] text-center"><span className={(skills[sk] || 0) >= 75 ? 'text-[#f59e0b]' : (skills[sk] || 0) >= 50 ? 'text-[#0a0a0a]' : 'text-[#4a5565]'} style={FBold}>{skills[sk] || 0}</span></td>))}
                                <td className="py-[8px] pr-[8px] text-center"><span className={avg >= 75 ? 'text-[#f59e0b]' : avg >= 50 ? 'text-[#0a0a0a]' : 'text-[#4a5565]'} style={FBold}>{avg}</span></td>
                                <td className="py-[8px] pr-[8px] text-right text-[#ef4444]">{formatCurrency(staff.salary)}/w</td>
                                <td className="py-[8px] pl-[8px]"><div className="flex flex-wrap gap-[4px]">{staff.traits.slice(0, 2).map(t => <span key={t} className="px-[6px] py-[2px] bg-[#faf5ff] text-[#a855f7] rounded-[4px] text-[10px] capitalize">{t.replace('_', ' ')}</span>)}</div></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {shortlistedCandidates.map((staff, index) => {
                  const poolEntry = staffEmployerMap.get(staff.id)
                  const employer = poolEntry?.status === 'employed_ai' ? poolEntry.employedBy : undefined
                  const buyout = employer ? staff.salary * 4 * Math.max(1, staff.contractYears || 2) : 0
                  const affordable = employer ? cash >= buyout : cash >= calculateContractCost(staff as FacilityStaffMember)
                  const conductor = conductedByMap[staff.id]
                  const conductorLabel = !conductor || conductor === 'owner' ? 'You' : (hiredStaff.find(s => s.id === conductor)?.name || 'Staff')
                  return (
                    <StaffCard key={staff.id} staff={staff} index={index} isHired={false} canAfford={affordable} employedBy={employer} interviewConductedBy={conductorLabel}
                      onHire={() => { setSelectedStaff(staff); startNegotiation(staff) }}
                      onPoach={employer ? () => { setSelectedStaff(staff); setPoachResult(null); setPoachDeclinedInterview(Math.random() < 0.35); setShowPoachModal(true) } : undefined}
                      onViewDetails={() => { setSelectedStaff(staff); setShowDetailModal(true) }}
                      onRemoveFromShortlist={() => { removeFromShortlist(staff.id); addToast({ type: 'info', title: 'Removed from Shortlist', message: `${staff.name} has been removed from your shortlist.`, duration: 3000 }) }} />
                  )
                })}
              </>
            ) : (
              <div className="col-span-3 text-center py-[48px] max-w-[480px] mx-auto">
                <div className="w-[64px] h-[64px] rounded-full bg-[#eff6ff] flex items-center justify-center mx-auto mb-[16px]"><Handshake className="w-[32px] h-[32px] text-[#3b82f6]" /></div>
                <h3 className="text-[18px] text-[#0a0a0a] mb-[8px]" style={FB}>No Interviewed Candidates</h3>
                <p className="text-[14px] text-[#4a5565] mb-[16px]" style={FR}>Candidates you interview will appear here so you can compare them side by side before making a hiring decision.</p>
                <div className={`${INNER} text-left mb-[16px]`}>
                  <h4 className="text-[14px] text-[#3b82f6] mb-[8px]" style={FBold}>How to Interview:</h4>
                  <ul className="text-[12px] text-[#4a5565] space-y-[4px]" style={FR}>
                    <li>- Browse the Staff Market and click "Negotiate" on a candidate</li>
                    <li>- Choose "Schedule Interview" to add it to your calendar</li>
                    <li>- Complete the interview activity on the Calendar screen</li>
                    <li>- The candidate will then appear here for comparison</li>
                  </ul>
                </div>
                <button onClick={() => setActiveTab('market')} className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}>Browse Staff Market</button>
              </div>
            )
          ) : (
            filteredHired.length > 0 ? (
              filteredHired.map((staff, index) => (
                <StaffCard key={staff.id} staff={staff} index={index} isHired={true} canAfford={true}
                  onFire={() => { setSelectedStaff(staff); setShowFireModal(true) }}
                  onAssign={() => { setSelectedStaff(staff); setShowAssignModal(true) }}
                  onUnassign={() => handleUnassign(staff.id)}
                  onViewDetails={() => { setSelectedStaff(staff); setShowDetailModal(true) }} />
              ))
            ) : (
              <div className="col-span-3 text-center py-[48px] max-w-[480px] mx-auto">
                <div className="w-[64px] h-[64px] rounded-full bg-[#fff7ed] flex items-center justify-center mx-auto mb-[16px]"><Users className="w-[32px] h-[32px] text-[#f97316]" /></div>
                <h3 className="text-[18px] text-[#0a0a0a] mb-[8px]" style={FB}>No Staff Hired Yet</h3>
                <p className="text-[14px] text-[#4a5565] mb-[16px]" style={FR}>Hire skilled staff to improve your team's performance. Key roles include Chief Engineer (car reliability), Strategist (race tactics), and Performance Analysts (development speed).</p>
                <div className={`${INNER} text-left mb-[16px]`}>
                  <h4 className="text-[14px] text-[#f59e0b] mb-[8px]" style={FBold}>Hiring Tips:</h4>
                  <ul className="text-[12px] text-[#4a5565] space-y-[4px]" style={FR}>
                    <li>- Chief Engineer and Strategist should be hired first</li>
                    <li>- Higher-skilled staff cost more but perform better</li>
                    <li>- Check contract length before committing</li>
                  </ul>
                </div>
                <button onClick={() => setActiveTab('market')} className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}>Browse Available Staff</button>
              </div>
            )
          )}
        </div>

        {/* Bottom Pagination */}
        {activeTab === 'market' && filteredMarket.length > MARKET_PAGE_SIZE && (
          <div className="flex items-center justify-center gap-[8px]" style={FR}>
            <button disabled={marketPage === 0} onClick={() => { setMarketPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-[12px] py-[6px] hover:bg-black/5 rounded-[8px] text-[14px] disabled:opacity-40 transition-colors">Previous</button>
            <span className="text-[14px] text-[#4a5565]">Page {marketPage + 1} of {Math.ceil(filteredMarket.length / MARKET_PAGE_SIZE)}</span>
            <button disabled={(marketPage + 1) * MARKET_PAGE_SIZE >= filteredMarket.length} onClick={() => { setMarketPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-[12px] py-[6px] hover:bg-black/5 rounded-[8px] text-[14px] disabled:opacity-40 transition-colors">Next</button>
          </div>
        )}

        {activeTab === 'hired' && hiredStaff.length > 0 && <DelegationPanel />}
      </div>

      {/* ===== MODALS ===== */}

      {/* Fire Modal */}
      {showFireModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowFireModal(false); setSelectedStaff(null) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Confirm Termination</h2>
              <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px]">
                <div className="w-[56px] h-[56px] rounded-full bg-[#fef2f2] flex items-center justify-center text-[#ef4444]"><UserMinus className="w-[24px] h-[24px]" /></div>
                <div><h3 className="text-[18px] text-[#0a0a0a]" style={FBold}>{selectedStaff.name}</h3><p className="text-[14px] text-[#4a5565]" style={FR}>{STAFF_ROLE_NAMES[selectedStaff.role]}</p></div>
              </div>
              <div className="p-[12px] bg-[#fffbeb] border-[0.8px] border-[#f59e0b]/30 rounded-[12px]">
                <p className="text-[14px] text-[#92400e]" style={FR}>Terminating this staff member will cost <span style={FBold}>{formatCurrency(selectedStaff.salary * 2)}</span> in severance pay (2 weeks salary).</p>
              </div>
              <div className="flex gap-[12px] pt-[16px] border-t border-black/10">
                <button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowFireModal(false); setSelectedStaff(null) }}>Cancel</button>
                <button className="flex-1 bg-[#ef4444] text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-[#dc2626] transition-colors" style={FBold} onClick={handleFire}><UserMinus className="w-[16px] h-[16px]" /> Terminate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Choice Modal */}
      {showInterviewChoiceModal && selectedStaff && !('hiredWeek' in selectedStaff) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowInterviewChoiceModal(false); setSelectedStaff(null) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[440px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Hiring approach</h2>
              <p className="text-[14px] text-[#4a5565]" style={FR}>You haven&apos;t interviewed <span style={FBold}>{selectedStaff.name}</span> yet. Schedule an interview (appears on your calendar) or send an offer without interviewing.</p>
              <div className="flex flex-col gap-[8px]">
                <button className="w-full bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors" style={FBold}
                  onClick={() => { setShowInterviewChoiceModal(false); setScheduleWeek(careerState?.currentWeek ?? 1); setScheduleDay(careerState?.currentDay ?? 1); setScheduleConductedBy('owner'); setShowScheduleInterviewModal(true) }}>
                  <Calendar className="w-[16px] h-[16px]" /> Schedule interview
                </button>
                <button className="w-full border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}
                  onClick={() => { setShowInterviewChoiceModal(false); if (selectedStaff) startNegotiation(selectedStaff) }}>Send offer anyway</button>
                <button className="w-full py-[10px] text-[14px] text-[#4a5565] hover:bg-black/5 rounded-[8px] transition-colors" style={FR}
                  onClick={() => { setShowInterviewChoiceModal(false); setSelectedStaff(null) }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleInterviewModal && selectedStaff && !('hiredWeek' in selectedStaff) && (() => {
        const currentWeek = careerState?.currentWeek ?? 1
        const currentDay = careerState?.currentDay ?? 1
        const currentYear = careerState?.currentYear ?? new Date().getFullYear()
        const eligibleStaff = getInterviewEligibleStaff()
        const interviewHours = getActivityTimeCost('staff_interview')?.hours ?? 1
        const TOTAL_DAY_HOURS = 16
        const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const isPast = (w: number, d: number) => w < currentWeek || (w === currentWeek && d < currentDay)
        const isOwnerConducted = scheduleConductedBy === 'owner'
        const getOwnerHoursUsed = (w: number, d: number) => { const activities = getActivitiesForDay(w, d); return activities.filter(a => a.requiresOwner).reduce((sum, a) => sum + (a.duration ?? 0), 0) }
        const isAvailable = (w: number, d: number) => {
          if (!isValidWeekDay(w, d, currentYear)) return false
          if (isPast(w, d)) return false
          if (isOwnerConducted) { const conflict = checkScheduleConflict(w, d, false, true); if (conflict.hasConflict) return false; const used = getOwnerHoursUsed(w, d); return used + interviewHours <= TOTAL_DAY_HOURS }
          return true
        }
        const weeksToShow = 4
        const weekRows = Array.from({ length: weeksToShow }, (_, i) => currentWeek + i)
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowScheduleInterviewModal(false); setSelectedStaff(null) }}>
            <div className="bg-white rounded-[24px] w-full max-w-[560px]" onClick={e => e.stopPropagation()}>
              <div className="p-[24px] flex flex-col gap-[16px]">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Schedule interview: {selectedStaff.name}</h2>
                <div>
                  <label className="block text-[14px] text-[#4a5565] mb-[4px]" style={FBold}>Conducted by</label>
                  <select className="w-full px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR} value={scheduleConductedBy} onChange={(e) => setScheduleConductedBy(e.target.value as any)}>
                    <option value="owner">Myself</option>
                    {eligibleStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[12px] text-[#4a5565] mb-[8px]" style={FR}>Pick a date — only days when you have time available are selectable.</p>
                  <div className="border-[0.8px] border-black/10 rounded-[12px] overflow-hidden">
                    <div className="grid grid-cols-8 bg-[#f9fafb] text-center text-[12px] text-[#4a5565]" style={FBold}>
                      <div className="p-[6px] border-b border-r border-black/10">Wk</div>
                      {DAY_HEADERS.map(h => <div key={h} className="p-[6px] border-b border-r border-black/10 last:border-r-0">{h}</div>)}
                    </div>
                    {weekRows.map(w => (
                      <div key={w} className="grid grid-cols-8 text-center text-[14px]" style={FR}>
                        <div className="p-[4px] border-b border-r border-black/10 text-[#4a5565]" style={FBold}>{w}</div>
                        {[1, 2, 3, 4, 5, 6, 7].map(d => {
                          const available = isAvailable(w, d)
                          const past = isPast(w, d)
                          const selected = scheduleWeek === w && scheduleDay === d
                          const date = getDateFromWeekAndDay(w, d, currentYear)
                          const dateNum = date.getDate()
                          return (
                            <button key={`${w}-${d}`} type="button" disabled={!available} onClick={() => { if (available) { setScheduleWeek(w); setScheduleDay(d) } }}
                              className={`p-[8px] border-b border-r border-black/10 last:border-r-0 min-w-[2rem] ${!available ? 'opacity-40 cursor-not-allowed text-[#4a5565]' : 'hover:bg-[#eff6ff] cursor-pointer'} ${selected ? 'bg-[#3b82f6]/20 text-[#3b82f6] ring-1 ring-[#3b82f6]' : ''} ${past && !available ? 'bg-[#f9fafb]' : ''}`}
                              style={selected ? FBold : FR}>
                              {dateNum}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  {scheduleWeek && scheduleDay && <p className="text-[12px] text-[#4a5565] mt-[8px]" style={FR}>Selected: Week {scheduleWeek}, {getDayName(scheduleDay)}</p>}
                </div>
                <div className="flex gap-[8px] pt-[8px]">
                  <button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowScheduleInterviewModal(false); setSelectedStaff(null) }}>Cancel</button>
                  <button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={!isAvailable(scheduleWeek, scheduleDay)}
                    onClick={() => { const activityId = scheduleStaffInterview(selectedStaff.id, scheduleWeek, scheduleDay, scheduleConductedBy); if (activityId) { addToast({ type: 'success', title: 'Interview scheduled', message: `Interview with ${selectedStaff.name} is on your calendar for Week ${scheduleWeek}, ${getDayName(scheduleDay)}.`, duration: 4000 }); setShowScheduleInterviewModal(false); setSelectedStaff(null) } }}>
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delegate Search Modal */}
      {showDelegateSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setShowDelegateSearchModal(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[440px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Delegate search to staff</h2>
              <p className="text-[14px] text-[#4a5565]" style={FR}>Have your Team Manager (or other delegate) find and interview candidates for a role. You will receive a shortlist by email to approve.</p>
              <div>
                <label className="block text-[14px] text-[#4a5565] mb-[4px]" style={FBold}>Role to fill</label>
                <select className="w-full px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-[14px] outline-none" style={FR} value={delegateSearchRole} onChange={(e) => setDelegateSearchRole(e.target.value as StaffRole)}>
                  {Object.entries(STAFF_ROLE_NAMES).map(([role, name]) => <option key={role} value={role}>{name}</option>)}
                </select>
              </div>
              <div className="flex gap-[8px]">
                <button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => setShowDelegateSearchModal(false)}>Cancel</button>
                <button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] hover:bg-black/80 transition-colors" style={FBold}
                  onClick={() => { const id = requestDelegatedSearch(delegateSearchRole); if (id) { addToast({ type: 'success', title: 'Search delegated', message: 'Your team will send you a shortlist by email.', duration: 4000 }); setShowDelegateSearchModal(false) } }}>Delegate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist Modal */}
      {showShortlistModal && shortlistIdToShow && (() => {
        const shortlist = getDelegatedShortlist(shortlistIdToShow)
        if (!shortlist) return null
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowShortlistModal(false); setShortlistIdToShow(null) }}>
            <div className="bg-white rounded-[24px] w-full max-w-[560px]" onClick={e => e.stopPropagation()}>
              <div className="p-[24px] flex flex-col gap-[16px]">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Shortlist – approve a candidate</h2>
                <p className="text-[14px] text-[#4a5565]" style={FR}>From <span style={FBold}>{shortlist.delegateStaffName}</span> for <span style={FBold}>{shortlist.role}</span>. Approve one to go to contract negotiation.</p>
                <div className="flex flex-col gap-[8px]">
                  {shortlist.shortlist.map((c) => (
                    <div key={c.id} className={`${INNER} flex items-center justify-between`}>
                      <div><p className="text-[14px] text-[#0a0a0a]" style={FBold}>{c.name}</p><p className="text-[12px] text-[#4a5565]" style={FR}>{c.role} · {formatCurrency(c.salary)}/wk · Rep {c.reputation}</p></div>
                      <button className="bg-black text-white rounded-[16px] px-[12px] py-[6px] text-[13px] hover:bg-black/80 transition-colors" style={FBold}
                        onClick={() => { const staff = resolveShortlist(shortlistIdToShow, c.id); setShowShortlistModal(false); setShortlistIdToShow(null); if (staff) { setSelectedStaff(staff); startNegotiation(staff) } }}>Approve</button>
                    </div>
                  ))}
                </div>
                <button className="w-full py-[10px] text-[14px] text-[#4a5565] hover:bg-black/5 rounded-[8px] transition-colors" style={FR}
                  onClick={() => { resolveShortlist(shortlistIdToShow, null); setShowShortlistModal(false); setShortlistIdToShow(null); addToast({ type: 'info', title: 'Shortlist rejected', message: 'You can request a new search from Delegate search.', duration: 3000 }) }}>Reject shortlist</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Negotiation Modal */}
      {showNegotiationModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[640px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[24px]">
              <div className="flex items-center gap-[16px]">
                <div className={`w-[56px] h-[56px] rounded-full flex items-center justify-center ${'staffCategory' in selectedStaff && selectedStaff.staffCategory === 'team' ? 'bg-[#faf5ff] text-[#a855f7]' : 'bg-[#eff6ff] text-[#3b82f6]'}`}>{ROLE_ICONS[selectedStaff.role]}</div>
                <div className="flex-1"><h3 className="text-[18px] text-[#0a0a0a]" style={FB}>{selectedStaff.name}</h3><p className="text-[14px] text-[#4a5565]" style={FR}>{STAFF_ROLE_NAMES[selectedStaff.role]}</p></div>
                <div className="text-right">
                  <div className={`flex items-center gap-[8px] px-[12px] py-[4px] rounded-full text-[14px] ${candidateMood === 'positive' ? 'bg-[#f0fdf4] text-[#00a63e]' : candidateMood === 'negative' ? 'bg-[#fef2f2] text-[#ef4444]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FR}>
                    {candidateMood === 'positive' ? <ThumbsUp className="w-[16px] h-[16px]" /> : candidateMood === 'negative' ? <ThumbsDown className="w-[16px] h-[16px]" /> : <Minus className="w-[16px] h-[16px]" />}
                    <span className="capitalize">{candidateMood}</span>
                  </div>
                  <p className="text-[12px] text-[#4a5565] mt-[4px]" style={FR}>Round {negotiationRound}/3</p>
                </div>
              </div>

              {negotiationStage === 'accepted' && (<div className="p-[16px] bg-[#f0fdf4] border-[0.8px] border-[#00a63e]/30 rounded-[16px] flex items-center gap-[12px]"><ThumbsUp className="w-[24px] h-[24px] text-[#00a63e]" /><div><p className="text-[14px] text-[#00a63e]" style={FBold}>Offer Accepted!</p><p className="text-[13px] text-[#4a5565]" style={FR}>{selectedStaff.name} is happy with your offer and ready to sign.</p></div></div>)}
              {negotiationStage === 'rejected' && (<div className="p-[16px] bg-[#fef2f2] border-[0.8px] border-[#ef4444]/30 rounded-[16px] flex items-center gap-[12px]"><ThumbsDown className="w-[24px] h-[24px] text-[#ef4444]" /><div><p className="text-[14px] text-[#ef4444]" style={FBold}>Offer Rejected</p><p className="text-[13px] text-[#4a5565]" style={FR}>{rejectionReason === 'signed_elsewhere' ? `${selectedStaff.name} has accepted an offer elsewhere and is no longer available.` : `${selectedStaff.name} is not interested in your offer. The negotiations have broken down.`}</p></div></div>)}
              {negotiationStage === 'final' && (<div className="p-[16px] bg-[#fffbeb] border-[0.8px] border-[#f59e0b]/30 rounded-[16px] flex items-center gap-[12px]"><MessageSquare className="w-[24px] h-[24px] text-[#f59e0b]" /><div><p className="text-[14px] text-[#f59e0b]" style={FBold}>Final Decision</p><p className="text-[13px] text-[#4a5565]" style={FR}>{selectedStaff.name} will accept your current offer, but won't negotiate further.</p></div></div>)}

              {negotiationStage === 'counter' && counterOffer && (
                <div className="p-[16px] bg-[#fff7ed] border-[0.8px] border-[#f97316]/30 rounded-[16px]">
                  <div className="flex items-start gap-[12px]">
                    <Handshake className="w-[24px] h-[24px] text-[#f97316] mt-[2px]" />
                    <div className="flex-1">
                      <p className="text-[14px] text-[#f97316]" style={FBold}>Counter Offer</p>
                      <p className="text-[13px] text-[#4a5565] mb-[12px]" style={FR}>{selectedStaff.name} has made a counter proposal:</p>
                      <div className="grid grid-cols-2 gap-[8px]">
                        <div className="p-[8px] bg-white rounded-[8px]"><span className="text-[12px] text-[#4a5565]" style={FR}>Salary:</span> <span className="ml-[8px] text-[13px]" style={FBold}>{formatCurrency(counterOffer.salary)}/wk</span></div>
                        <div className="p-[8px] bg-white rounded-[8px]"><span className="text-[12px] text-[#4a5565]" style={FR}>Signing:</span> <span className="ml-[8px] text-[13px]" style={FBold}>{formatCurrency(counterOffer.signingBonus)}</span></div>
                        <div className="p-[8px] bg-white rounded-[8px]"><span className="text-[12px] text-[#4a5565]" style={FR}>Length:</span> <span className="ml-[8px] text-[13px]" style={FBold}>{counterOffer.contractLength} yr</span></div>
                        <div className="p-[8px] bg-white rounded-[8px]"><span className="text-[12px] text-[#4a5565]" style={FR}>Perf. Bonus:</span> <span className="ml-[8px] text-[13px]" style={FBold}>{formatCurrency(counterOffer.performanceBonus)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(negotiationStage === 'offer' || negotiationStage === 'counter') && (
                <div className="flex flex-col gap-[16px]">
                  <h4 className="text-[13px] text-[#4a5565] uppercase tracking-wide" style={FBold}>Your Offer</h4>
                  {[
                    { label: 'Weekly Salary', key: 'salary' as const, step: 500, min: 100, expect: `Expects: ${formatCurrency(selectedStaff.salary)}` },
                    { label: 'Signing Bonus', key: 'signingBonus' as const, step: 5000, min: 0, expect: `Standard: ${formatCurrency(calculateContractCost(selectedStaff as FacilityStaffMember))}` },
                    { label: 'Annual Performance Bonus', key: 'performanceBonus' as const, step: 1000, min: 0, expect: '' },
                  ].map(field => (
                    <div key={field.key} className="flex flex-col gap-[8px]">
                      <div className="flex justify-between text-[14px]"><label className="text-[#4a5565]" style={FR}>{field.label}</label>{field.expect && <span className="text-[12px] text-[#4a5565]" style={FR}>({field.expect})</span>}</div>
                      <div className="flex items-center gap-[8px]">
                        <button className="p-[8px] hover:bg-black/5 rounded-[8px] transition-colors" onClick={() => setOfferForm(prev => ({ ...prev, [field.key]: Math.max(field.min, prev[field.key] - field.step) }))}><Minus className="w-[16px] h-[16px]" /></button>
                        <input type="number" value={offerForm[field.key]} onChange={(e) => setOfferForm(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))} className="flex-1 px-[12px] py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-center text-[14px] outline-none" style={FR} />
                        <button className="p-[8px] hover:bg-black/5 rounded-[8px] transition-colors" onClick={() => setOfferForm(prev => ({ ...prev, [field.key]: prev[field.key] + field.step }))}><Plus className="w-[16px] h-[16px]" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex justify-between text-[14px]"><label className="text-[#4a5565]" style={FR}>Contract Length (Years)</label><span className="text-[12px] text-[#4a5565]" style={FR}>(Prefers: {selectedStaff.contractYears} yr)</span></div>
                    <div className="flex items-center gap-[8px]">
                      <button className="p-[8px] hover:bg-black/5 rounded-[8px] transition-colors" onClick={() => setOfferForm(prev => ({ ...prev, contractLength: Math.max(1, prev.contractLength - 1) }))}><Minus className="w-[16px] h-[16px]" /></button>
                      <div className="flex-1 py-[10px] bg-white border-[0.8px] border-black/20 rounded-[12px] text-center text-[14px]" style={FR}>{offerForm.contractLength} year{offerForm.contractLength > 1 ? 's' : ''}</div>
                      <button className="p-[8px] hover:bg-black/5 rounded-[8px] transition-colors" onClick={() => setOfferForm(prev => ({ ...prev, contractLength: Math.min(5, prev.contractLength + 1) }))}><Plus className="w-[16px] h-[16px]" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              <div className={`${INNER}`}>
                <h4 className="text-[14px] text-[#0a0a0a] mb-[12px]" style={FBold}>Cost Summary</h4>
                <div className="grid grid-cols-2 gap-[12px] text-[14px]" style={FR}>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Signing Bonus:</span><span className="text-[#ef4444]" style={FBold}>{formatCurrency(offerForm.signingBonus)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Weekly Salary:</span><span style={FBold}>{formatCurrency(offerForm.salary)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Year 1 Total:</span><span className="text-[#f59e0b]" style={FBold}>{formatCurrency(offerForm.signingBonus + (offerForm.salary * 52) + offerForm.performanceBonus)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Your Cash:</span><span className={cash >= offerForm.signingBonus ? 'text-[#00a63e]' : 'text-[#ef4444]'} style={FBold}>{formatCurrency(cash)}</span></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-[12px] pt-[16px] border-t border-black/10">
                {negotiationStage === 'offer' && (<><button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>Cancel</button><button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={cash < offerForm.signingBonus} onClick={submitOffer}><Handshake className="w-[16px] h-[16px]" /> Submit Offer</button></>)}
                {negotiationStage === 'counter' && (<><button className="px-[16px] py-[10px] text-[14px] text-[#4a5565] hover:bg-black/5 rounded-[8px] transition-colors" style={FR} onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>Walk Away</button><button className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors disabled:opacity-40" style={FR} disabled={cash < offerForm.signingBonus} onClick={submitOffer}>Counter Offer</button>{counterOffer && <button className="bg-black text-white rounded-[16px] px-[16px] py-[10px] text-[14px] flex items-center gap-[8px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={cash < counterOffer.signingBonus} onClick={acceptCounterOffer}><Check className="w-[16px] h-[16px]" /> Accept Their Terms</button>}</>)}
                {negotiationStage === 'final' && (<><button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>Walk Away</button><button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={cash < offerForm.signingBonus} onClick={() => setNegotiationStage('accepted')}><Check className="w-[16px] h-[16px]" /> Accept &amp; Sign</button></>)}
                {negotiationStage === 'accepted' && (<><button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>Cancel</button><button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={cash < offerForm.signingBonus} onClick={finalizeHire}><UserPlus className="w-[16px] h-[16px]" /> Sign Contract</button></>)}
                {negotiationStage === 'rejected' && (<button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowNegotiationModal(false); setSelectedStaff(null) }}>Close</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowAssignModal(false); setSelectedStaff(null) }}>
          <div className="bg-white rounded-[24px] w-full max-w-[560px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-[24px]">
              <h2 className="text-[20px] tracking-[-0.5px] mb-[16px]" style={FB}>Assign {selectedStaff.name} to Facility</h2>
              <AssignmentPanel staff={selectedStaff as HiredFacilityStaff} facilities={team.facilities} facilityStaff={hiredStaff} onAssign={handleAssign} onClose={() => { setShowAssignModal(false); setSelectedStaff(null) }} />
            </div>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      <StaffDetailModal staff={selectedStaff as StaffMember | null} isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedStaff(null) }}
        onNegotiate={(activeTab === 'market' || activeTab === 'shortlist') ? () => { setShowDetailModal(false); if (selectedStaff && !('hiredWeek' in selectedStaff)) { if (activeTab === 'shortlist' || isCandidateInterviewed(selectedStaff.id)) { startNegotiation(selectedStaff) } else { setShowInterviewChoiceModal(true) } } } : undefined}
        canAfford={selectedStaff && !('hiredWeek' in selectedStaff) ? cash >= calculateContractCost(selectedStaff as FacilityStaffMember) : false}
        cash={cash} />

      {/* Poach Modal */}
      {showPoachModal && selectedStaff && !('hiredWeek' in selectedStaff) && (() => {
        const poolEntry = staffEmployerMap.get(selectedStaff.id)
        const employer = poolEntry?.employedBy || 'Unknown Team'
        const currentSalary = selectedStaff.salary
        const estimatedYears = Math.max(1, selectedStaff.contractYears || 2)
        const buyout = currentSalary * 4 * estimatedYears
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowPoachModal(false); setSelectedStaff(null); setPoachResult(null); setPoachDeclinedInterview(null) }}>
            <div className="bg-white rounded-[24px] w-full max-w-[560px]" onClick={e => e.stopPropagation()}>
              <div className="p-[24px] flex flex-col gap-[16px]">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Approach Staff Member</h2>
                <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px]">
                  <Portrait src={('portraitId' in selectedStaff && selectedStaff.portraitId) ? (getPortraitByManifestId(selectedStaff.portraitId) || getFallbackPortrait(('gender' in selectedStaff && selectedStaff.gender) || 'male')) : (getStaffPortrait(selectedStaff.id) || getRandomStaffPortraitByRole(selectedStaff.role))} name={selectedStaff.name} size={56} />
                  <div className="flex-1">
                    <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>{selectedStaff.name}</h3>
                    <p className="text-[14px] text-[#4a5565]" style={FR}>{STAFF_ROLE_NAMES[selectedStaff.role]}</p>
                    <p className="text-[12px] text-[#ef4444] mt-[4px]" style={FR}>Currently at {employer}</p>
                  </div>
                  <span className={`px-[8px] py-[4px] rounded-[8px] text-[13px] flex items-center gap-[4px] ${selectedStaff.reputation >= 70 ? 'bg-[#f0fdf4] text-[#00a63e]' : selectedStaff.reputation >= 40 ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FR}><Star className="w-[12px] h-[12px]" /> {selectedStaff.reputation}</span>
                </div>

                {poachDeclinedInterview === true ? (
                  <div className="flex flex-col gap-[16px]">
                    <div className="p-[16px] rounded-[16px] text-center bg-[#fef2f2] border-[0.8px] border-[#ef4444]/30">
                      <p className="text-[18px] text-[#ef4444] mb-[8px]" style={FB}>Declined interview</p>
                      <p className="text-[14px] text-[#4a5565]" style={FR}>{selectedStaff.name} is under contract with {employer} and has declined an interview at this time. They&apos;re not interested in discussing a move.</p>
                    </div>
                    <button className="w-full border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowPoachModal(false); setSelectedStaff(null); setPoachDeclinedInterview(null) }}>Close</button>
                  </div>
                ) : !poachResult ? (
                  <>
                    <div className="p-[12px] bg-[#fff7ed] border-[0.8px] border-[#f97316]/30 rounded-[12px]">
                      <p className="text-[14px] text-[#9a3412]" style={FR}>Approaching a contracted staff member requires paying a buyout clause of <span style={FBold}>{formatCurrency(buyout)}</span>. Salary offer will be set at 125% of their current wages.</p>
                    </div>
                    <div className="flex gap-[12px]">
                      <button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowPoachModal(false); setSelectedStaff(null) }}>Cancel</button>
                      <button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors disabled:opacity-40" style={FBold} disabled={cash < buyout}
                        onClick={() => { const offer = Math.round(currentSalary * 1.25); const result = poachAIStaff(selectedStaff.id, offer); if (result.success) { setPoachResult({ hired: result.hired, counterOffer: result.counterOffer, message: result.message, buyoutCost: result.buyoutCost, offeredSalary: result.offeredSalary }) } else { setPoachResult({ hired: false, message: result.error }) } }}>
                        <UserPlus className="w-[16px] h-[16px]" /> {cash < buyout ? 'Insufficient Funds' : `Approach (${formatCurrency(buyout)})`}
                      </button>
                    </div>
                  </>
                ) : poachResult.hired && !poachResult.confirmed ? (
                  <div className="flex flex-col gap-[16px]">
                    <div className="p-[16px] rounded-[16px] text-center bg-[#fffbeb] border-[0.8px] border-[#f59e0b]/30"><p className="text-[18px] text-[#f59e0b] mb-[8px]" style={FB}>Interested in Joining!</p><p className="text-[14px] text-[#4a5565]" style={FR}>{poachResult.message}</p></div>
                    <div className={INNER}>
                      <div className="flex justify-between text-[14px] mb-[8px]" style={FR}><span className="text-[#4a5565]">Buyout Clause</span><span style={FBold}>{formatCurrency(poachResult.buyoutCost || 0)}</span></div>
                      <div className="flex justify-between text-[14px]" style={FR}><span className="text-[#4a5565]">Weekly Salary</span><span style={FBold}>{formatCurrency(poachResult.offeredSalary || 0)}/week</span></div>
                    </div>
                    <div className="flex gap-[12px]">
                      <button className="flex-1 border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowPoachModal(false); setSelectedStaff(null); setPoachResult(null) }}>Walk Away</button>
                      <button className="flex-1 bg-black text-white rounded-[16px] py-[10px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/80 transition-colors" style={FBold}
                        onClick={() => { const result = confirmPoachHire(selectedStaff.id, poachResult.offeredSalary || 0); if (result.success) { setPoachResult({ ...poachResult, confirmed: true, message: result.message }); addToast({ type: 'success', title: 'Staff Hired!', message: result.message || `Successfully signed ${selectedStaff.name}`, duration: 5000 }) } else { setPoachResult({ hired: false, confirmed: false, message: result.error }) } }}>
                        <UserPlus className="w-[16px] h-[16px]" /> Confirm Hire
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[16px]">
                    <div className={`p-[16px] rounded-[16px] text-center ${poachResult.confirmed ? 'bg-[#f0fdf4] border-[0.8px] border-[#00a63e]/30' : poachResult.counterOffer ? 'bg-[#fff7ed] border-[0.8px] border-[#f97316]/30' : 'bg-[#fef2f2] border-[0.8px] border-[#ef4444]/30'}`}>
                      <p className={`text-[18px] mb-[8px] ${poachResult.confirmed ? 'text-[#00a63e]' : poachResult.counterOffer ? 'text-[#f97316]' : 'text-[#ef4444]'}`} style={FB}>{poachResult.confirmed ? 'Successfully Hired!' : poachResult.counterOffer ? 'Counter Offer Made' : 'Approach Failed'}</p>
                      <p className="text-[14px] text-[#4a5565]" style={FR}>{poachResult.message}</p>
                    </div>
                    <button className="w-full border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={() => { setShowPoachModal(false); setSelectedStaff(null); setPoachResult(null); refreshFacilityStaffMarket() }}>Close</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
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
  employedBy?: string
  interviewConductedBy?: string
  onHire?: () => void
  onPoach?: () => void
  onFire?: () => void
  onAssign?: () => void
  onUnassign?: () => void
  onViewDetails?: () => void
  onRemoveFromShortlist?: () => void
}

const StaffCard = forwardRef<HTMLDivElement, StaffCardProps>(function StaffCard({ staff, index, isHired, canAfford, employedBy, interviewConductedBy, onHire, onPoach, onFire, onAssign, onUnassign, onViewDetails, onRemoveFromShortlist }, ref) {
  const avgSkill = Math.round(Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5)
  const hiredStaffRef = staff as HiredFacilityStaff
  const isFacilityStaff = 'staffCategory' in staff ? staff.staffCategory === 'facility' : true
  const isTeamStaff = 'staffCategory' in staff && staff.staffCategory === 'team'
  const suitedFacilities = isFacilityStaff ? ROLE_FACILITY_MAPPING[staff.role as FacilityStaffRole] : []

  return (
    <div ref={ref} className={`${CARD} p-[16px] cursor-pointer transition-all hover:shadow-sm ${!canAfford && !isHired ? 'opacity-60' : ''}`} onClick={onViewDetails}>
      <div className="flex items-start justify-between mb-[12px]">
        <div className="flex items-center gap-[12px]">
          <Portrait src={('portraitId' in staff && staff.portraitId) ? (getPortraitByManifestId(staff.portraitId) || getFallbackPortrait(('gender' in staff && staff.gender) || 'male')) : (getStaffPortrait(staff.id) || getRandomStaffPortraitByRole(staff.role))} name={staff.name} size={48} />
          <div><h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>{staff.name}</h4><p className="text-[12px] text-[#4a5565]" style={FR}>{STAFF_ROLE_NAMES[staff.role]}</p></div>
        </div>
        <div className="flex flex-col items-end gap-[4px]">
          <span className={`px-[8px] py-[2px] rounded-[8px] text-[12px] flex items-center gap-[4px] ${staff.reputation >= 70 ? 'bg-[#f0fdf4] text-[#00a63e]' : staff.reputation >= 40 ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FR}><Star className="w-[12px] h-[12px]" /> {staff.reputation}</span>
          <span className={`px-[8px] py-[2px] rounded-[8px] text-[10px] ${isTeamStaff ? 'bg-[#faf5ff] text-[#a855f7]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FR}>{isTeamStaff ? 'Race Staff' : 'Facility'}</span>
        </div>
      </div>

      <div className="flex items-center gap-[16px] text-[12px] text-[#4a5565] mb-[12px]" style={FR}>
        <span className="flex items-center gap-[4px]"><MapPin className="w-[12px] h-[12px]" /> {staff.nationality}</span>
        <span className="flex items-center gap-[4px]"><Clock className="w-[12px] h-[12px]" /> {staff.experience}y exp</span>
        <span className="flex items-center gap-[4px]"><Award className="w-[12px] h-[12px]" /> {staff.age}yo</span>
      </div>

      {employedBy && !isHired && (
        <div className="flex items-center gap-[4px] mb-[12px] px-[8px] py-[4px] bg-[#fef2f2] border-[0.8px] border-[#ef4444]/20 rounded-[8px]">
          <Briefcase className="w-[12px] h-[12px] text-[#ef4444]" />
          <span className="text-[12px] text-[#ef4444]" style={FBold}>Under Contract: {employedBy}</span>
        </div>
      )}

      <div className="grid grid-cols-5 gap-[4px] mb-[12px]">
        {Object.entries(staff.skills).map(([skill, value]) => (
          <div key={skill} className="text-center">
            <div className={`text-[12px] ${SKILL_COLORS[skill] || 'text-[#4a5565]'}`} style={FBold}>{value}</div>
            <div className="text-[10px] text-[#4a5565] uppercase" style={FR}>{skill.slice(0, 3)}</div>
          </div>
        ))}
      </div>

      {isFacilityStaff && suitedFacilities.length > 0 ? (
        <div className="flex flex-wrap gap-[4px] mb-[12px]">
          {suitedFacilities.slice(0, 3).map(facility => <span key={facility} className="border-[0.8px] border-black/10 rounded-[6px] px-[6px] py-[2px] text-[11px] text-[#4a5565]" style={FR}>{FACILITY_NAMES[facility]}</span>)}
          {suitedFacilities.length > 3 && <span className="border-[0.8px] border-black/10 rounded-[6px] px-[6px] py-[2px] text-[11px] text-[#4a5565]" style={FR}>+{suitedFacilities.length - 3}</span>}
        </div>
      ) : isTeamStaff && 'racesWorked' in staff ? (
        <div className="flex flex-wrap gap-[4px] mb-[12px]">
          <span className="border-[0.8px] border-black/10 rounded-[6px] px-[6px] py-[2px] text-[11px] text-[#4a5565]" style={FR}>{(staff as TeamStaffMember).racesWorked || 0} races</span>
          {(staff as TeamStaffMember).championshipsWon && (staff as TeamStaffMember).championshipsWon! > 0 && <span className="bg-[#f0fdf4] text-[#00a63e] rounded-[6px] px-[6px] py-[2px] text-[11px]" style={FR}>🏆 {(staff as TeamStaffMember).championshipsWon} titles</span>}
        </div>
      ) : null}

      {staff.traits.length > 0 && (
        <div className="flex flex-wrap gap-[4px] mb-[12px]">
          {staff.traits.slice(0, 2).map(trait => <span key={trait} className="bg-[#faf5ff] text-[#a855f7] rounded-[6px] px-[6px] py-[2px] text-[11px] capitalize" style={FR}>{trait.replace('_', ' ')}</span>)}
          {staff.traits.length > 2 && <span className="bg-[#faf5ff] text-[#a855f7] rounded-[6px] px-[6px] py-[2px] text-[11px]" style={FR}>+{staff.traits.length - 2}</span>}
        </div>
      )}

      {interviewConductedBy && (
        <div className="flex items-center justify-between mb-[12px]">
          <span className="bg-[#f0fdf4] text-[#00a63e] px-[8px] py-[2px] rounded-[8px] text-[12px] flex items-center gap-[4px]" style={FR}><Check className="w-[12px] h-[12px]" /> Interviewed by {interviewConductedBy}</span>
          {onRemoveFromShortlist && (
            <button className="text-[12px] text-[#4a5565] hover:text-[#ef4444] px-[8px] py-[4px] hover:bg-black/5 rounded-[8px] flex items-center gap-[4px] transition-colors" style={FR} onClick={(e) => { e.stopPropagation(); onRemoveFromShortlist() }}><X className="w-[12px] h-[12px]" /> Remove</button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-[12px] border-t border-black/10">
        {isHired ? (
          <>
            <div><p className="text-[12px] text-[#4a5565]" style={FR}>Weekly Salary</p><p className="text-[14px] text-[#ef4444]" style={FBold}>{formatCurrency(staff.salary)}</p></div>
            {isFacilityStaff ? (
              hiredStaffRef.assignedFacility ? (
                <div className="flex items-center gap-[8px]">
                  <span className="bg-[#f0fdf4] text-[#00a63e] px-[8px] py-[2px] rounded-[8px] text-[12px] flex items-center gap-[4px]" style={FR}><Building2 className="w-[12px] h-[12px]" /> {FACILITY_NAMES[hiredStaffRef.assignedFacility]}</span>
                  <button className="p-[4px] hover:bg-black/5 rounded-[6px] transition-colors" onClick={(e) => { e.stopPropagation(); onUnassign?.() }}><X className="w-[12px] h-[12px]" /></button>
                </div>
              ) : (
                <button className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[6px] text-[13px] hover:bg-black/5 transition-colors" style={FR} onClick={(e) => { e.stopPropagation(); onAssign?.() }}>Assign</button>
              )
            ) : (
              <span className="bg-[#faf5ff] text-[#a855f7] px-[8px] py-[2px] rounded-[8px] text-[12px]" style={FR}>Race Crew</span>
            )}
          </>
        ) : (
          <>
            <div><p className="text-[12px] text-[#4a5565]" style={FR}>{employedBy ? 'Buyout Cost' : 'Signing Bonus'}</p><p className={`text-[14px] ${canAfford ? 'text-[#0a0a0a]' : 'text-[#ef4444]'}`} style={FBold}>{employedBy ? formatCurrency(staff.salary * 4 * Math.max(1, staff.contractYears || 2)) : formatCurrency(calculateContractCost(staff as FacilityStaffMember))}</p></div>
            <div className="flex gap-[8px]">
              <button className="px-[10px] py-[6px] text-[12px] hover:bg-black/5 rounded-[8px] flex items-center gap-[4px] transition-colors" style={FR} onClick={(e) => { e.stopPropagation(); onViewDetails?.() }}><Info className="w-[12px] h-[12px]" /> Details</button>
              {employedBy ? (
                <button className="border-[0.8px] border-black/20 rounded-[12px] px-[10px] py-[6px] text-[12px] flex items-center gap-[4px] hover:bg-black/5 transition-colors" style={FR} onClick={(e) => { e.stopPropagation(); onPoach?.() }}><UserPlus className="w-[12px] h-[12px]" /> Approach</button>
              ) : (
                <button className="bg-black text-white rounded-[12px] px-[10px] py-[6px] text-[12px] flex items-center gap-[4px] hover:bg-black/80 transition-colors" style={FBold} onClick={(e) => { e.stopPropagation(); onHire?.() }}><Handshake className="w-[12px] h-[12px]" /> Negotiate</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

// ============================================
// Assignment Panel Component
// ============================================

function AssignmentPanel({ staff, facilities, facilityStaff, onAssign, onClose }: { staff: HiredFacilityStaff; facilities: any; facilityStaff: HiredFacilityStaff[]; onAssign: (facilityType: FacilityType) => void; onClose: () => void }) {
  const isFacilityRole = staff.role in ROLE_FACILITY_MAPPING
  const facilityRole = isFacilityRole ? staff.role as FacilityStaffRole : null

  const facilityEffectiveness = useMemo(() => {
    const effectiveness: Record<FacilityType, number> = {} as Record<FacilityType, number>
    if (!facilityRole) return effectiveness
    FACILITY_TYPES.forEach(type => { effectiveness[type] = calculateFacilityEffectiveness(staff as FacilityStaffMember, type) })
    return effectiveness
  }, [staff, facilityRole])

  const facilityAssignments = useMemo(() => {
    const assignments: Record<FacilityType, number> = {} as Record<FacilityType, number>
    FACILITY_TYPES.forEach(type => { assignments[type] = facilityStaff.filter(s => s.assignedFacility === type).length })
    return assignments
  }, [facilityStaff])

  const suitedFacilities = facilityRole ? ROLE_FACILITY_MAPPING[facilityRole] : []

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px]">
        <div className="w-[48px] h-[48px] rounded-full bg-[#eff6ff] flex items-center justify-center text-[#3b82f6]">{ROLE_ICONS[staff.role]}</div>
        <div><h4 className="text-[14px] text-[#0a0a0a]" style={FBold}>{staff.name}</h4><p className="text-[13px] text-[#4a5565]" style={FR}>{facilityRole ? FACILITY_STAFF_ROLE_NAMES[facilityRole] : STAFF_ROLE_NAMES[staff.role]}</p></div>
      </div>
      <div className="p-[12px] bg-[#eff6ff] border-[0.8px] border-[#3b82f6]/30 rounded-[12px]">
        <p className="text-[14px] text-[#1d4ed8]" style={FR}><span style={FBold}>Best suited for:</span> {suitedFacilities.map((f: FacilityType) => FACILITY_NAMES[f]).join(', ')}</p>
      </div>
      <div className="flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
        {FACILITY_TYPES.map(type => {
          const facilityState = facilities?.[type]
          const level = facilityState?.level || 1
          const levelConfig = getFacilityLevelConfig(level, type, facilityState?.grade as any)
          const currentAssigned = facilityAssignments[type]
          const slotsAvailable = levelConfig.staffSlots - currentAssigned
          const effectiveness = facilityEffectiveness[type]
          const isSuited = suitedFacilities.includes(type)
          return (
            <div key={type} className={`flex items-center justify-between p-[12px] rounded-[12px] border-[0.8px] transition-all ${slotsAvailable > 0 ? 'border-black/10 hover:border-black/30 cursor-pointer bg-white' : 'border-black/5 opacity-60 bg-[#f9fafb]'}`} onClick={() => slotsAvailable > 0 && onAssign(type)}>
              <div className="flex items-center gap-[12px]">
                <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center ${isSuited ? 'bg-[#f0fdf4] text-[#00a63e]' : 'bg-[#f9fafb] text-[#4a5565]'}`}><Building2 className="w-[20px] h-[20px]" /></div>
                <div>
                  <div className="flex items-center gap-[8px]"><span className="text-[14px] text-[#0a0a0a]" style={FBold}>{FACILITY_NAMES[type]}</span>{isSuited && <span className="bg-[#f0fdf4] text-[#00a63e] px-[6px] py-[1px] rounded-[6px] text-[11px]" style={FR}>Suited</span>}</div>
                  <p className="text-[12px] text-[#4a5565]" style={FR}>Level {level} • {currentAssigned}/{levelConfig.staffSlots} staff</p>
                </div>
              </div>
              <div className="text-right"><p className="text-[12px] text-[#4a5565]" style={FR}>Effectiveness</p><p className={`text-[14px] ${effectiveness >= 70 ? 'text-[#00a63e]' : effectiveness >= 50 ? 'text-[#f59e0b]' : 'text-[#4a5565]'}`} style={FBold}>{effectiveness}%</p></div>
            </div>
          )
        })}
      </div>
      <div className="pt-[16px] border-t border-black/10">
        <button className="w-full border-[0.8px] border-black/20 rounded-[12px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

// ============================================
// Staff Detail Modal Component
// ============================================

export function StaffDetailModal({ staff, isOpen, onClose, onNegotiate, canAfford, cash }: { staff: StaffMember | null; isOpen: boolean; onClose: () => void; onNegotiate?: () => void; canAfford: boolean; cash: number }) {
  const { attachStaffPreGenBio } = useCareerStore()

  const snapshot = staff ? ('preGenBio' in staff ? staff.preGenBio : undefined) : undefined
  const preGenById = staff && !snapshot ? getStaffById(staff.id) : null
  const preGenByName = staff && !snapshot && !preGenById ? getStaffByName(staff.name) : null
  const preGen = preGenById ?? preGenByName ?? null

  const enrichedBio = useMemo(() => {
    if (snapshot || preGen || !staff) return null
    enrichStaffBios([staff])
    if (staff.preGenBio) return staff.preGenBio
    return { bio: generateRuntimeBio(staff), personality: '', quirks: [] as string[], physicalDescription: undefined as string | undefined }
  }, [staff?.id, snapshot, preGen])

  const bio = snapshot ?? (preGen ? { bio: preGen.bio || '', personality: preGen.personality || '', quirks: preGen.quirks || [], physicalDescription: preGen.physical?.description } : enrichedBio)

  useEffect(() => {
    if (staff && !snapshot && staff.id) {
      const bioToAttach = preGen ? { bio: preGen.bio || '', personality: preGen.personality || '', quirks: preGen.quirks || [], physicalDescription: preGen.physical?.description } : (enrichedBio && enrichedBio.bio) ? enrichedBio : null
      if (bioToAttach) attachStaffPreGenBio(staff.id, { bio: bioToAttach.bio, personality: bioToAttach.personality, quirks: bioToAttach.quirks, physicalDescription: bioToAttach.physicalDescription })
    }
  }, [staff, snapshot, preGen, enrichedBio, attachStaffPreGenBio])

  if (!staff || !isOpen) return null

  const avgSkill = Math.round(Object.values(staff.skills).reduce((a, b) => a + b, 0) / 5)
  const isTeamStaff = staff.staffCategory === 'team'
  const teamStaff = staff as TeamStaffMember
  const signingBonus = calculateContractCost(staff as FacilityStaffMember)
  const yearlySalary = calculateYearlySalaryCost(staff as FacilityStaffMember)
  const suitedFacilities = !isTeamStaff ? ROLE_FACILITY_MAPPING[staff.role as FacilityStaffRole] : []

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-[24px] flex flex-col gap-[24px]">
          <div className="flex items-start gap-[24px]">
            <Portrait src={('portraitId' in staff && staff.portraitId) ? (getPortraitByManifestId(staff.portraitId) || getFallbackPortrait(('gender' in staff && staff.gender) || 'male')) : (getStaffPortrait(staff.id) || getRandomStaffPortraitByRole(staff.role))} name={staff.name} size={80} />
            <div className="flex-1">
              <div className="flex items-center gap-[12px] mb-[4px]">
                <h2 className="text-[24px] text-[#0a0a0a] tracking-[-0.5px]" style={FB}>{staff.name}</h2>
                <span className={`px-[8px] py-[4px] rounded-[8px] text-[13px] flex items-center gap-[4px] ${staff.reputation >= 70 ? 'bg-[#f0fdf4] text-[#00a63e]' : staff.reputation >= 40 ? 'bg-[#fffbeb] text-[#f59e0b]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FR}><Star className="w-[14px] h-[14px]" /> Rep: {staff.reputation}</span>
              </div>
              <p className="text-[18px] text-[#4a5565]" style={FR}>{STAFF_ROLE_NAMES[staff.role]}</p>
              <div className="flex items-center gap-[16px] mt-[8px] text-[14px] text-[#4a5565]" style={FR}>
                <span className="flex items-center gap-[4px]"><MapPin className="w-[16px] h-[16px]" /> {staff.nationality}</span>
                <span>•</span><span>{staff.age} years old</span><span>•</span><span>{staff.experience} years experience</span>
              </div>
            </div>
          </div>

          <div className={`p-[12px] rounded-[12px] ${isTeamStaff ? 'bg-[#faf5ff] border-[0.8px] border-[#a855f7]/30' : 'bg-[#eff6ff] border-[0.8px] border-[#3b82f6]/30'}`}>
            <div className="flex items-center gap-[8px]">
              {isTeamStaff ? (<><Award className="w-[20px] h-[20px] text-[#a855f7]" /><div><p className="text-[14px] text-[#a855f7]" style={FBold}>Team/Race Staff</p><p className="text-[12px] text-[#4a5565]" style={FR}>Works trackside during race weekends - pit wall, strategy, pit crew management</p></div></>) : (<><Building2 className="w-[20px] h-[20px] text-[#3b82f6]" /><div><p className="text-[14px] text-[#3b82f6]" style={FBold}>Facility Staff</p><p className="text-[12px] text-[#4a5565]" style={FR}>Works at HQ/Factory on R&D, manufacturing, and development</p></div></>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[24px]">
            <div className="flex flex-col gap-[16px]">
              <div className={`${CARD} p-[16px]`}>
                <h3 className="text-[14px] text-[#0a0a0a] mb-[16px] flex items-center gap-[8px]" style={FBold}><Zap className="w-[16px] h-[16px] text-[#06b6d4]" /> Skills</h3>
                <div className="flex flex-col gap-[12px]">
                  {Object.entries(staff.skills).map(([skill, value]) => (
                    <div key={skill}>
                      <div className="flex justify-between text-[14px] mb-[4px]"><span className="capitalize" style={FR}>{skill}</span><span className={`${value >= 70 ? 'text-[#00a63e]' : value >= 50 ? 'text-[#f97316]' : 'text-[#4a5565]'}`} style={FBold}>{value}</span></div>
                      <div className="h-[8px] bg-[#f3f4f6] rounded-full overflow-hidden"><div className={`h-full transition-all ${value >= 70 ? 'bg-[#00a63e]' : value >= 50 ? 'bg-[#f97316]' : 'bg-[#9ca3af]'}`} style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                  <div className="pt-[8px] border-t border-black/10 flex justify-between"><span className="text-[14px] text-[#4a5565]" style={FR}>Average</span><span className={`${avgSkill >= 70 ? 'text-[#00a63e]' : avgSkill >= 50 ? 'text-[#f97316]' : 'text-[#4a5565]'}`} style={FBold}>{avgSkill}</span></div>
                </div>
              </div>
              {staff.traits.length > 0 && (
                <div className={`${CARD} p-[16px]`}>
                  <h3 className="text-[14px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}><Heart className="w-[16px] h-[16px] text-[#ef4444]" /> Traits</h3>
                  <div className="flex flex-col gap-[8px]">
                    {staff.traits.map(trait => { const effect = TRAIT_EFFECTS[trait]; return (
                      <div key={trait} className={INNER}>
                        <div className="flex items-center justify-between mb-[4px]"><span className="text-[14px] capitalize" style={FBold}>{trait.replace('_', ' ')}</span><span className="bg-[#faf5ff] text-[#a855f7] px-[6px] py-[1px] rounded-[6px] text-[11px]" style={FR}>+{Math.round(effect.bonusValue * 100)}% {effect.bonusType}</span></div>
                        <p className="text-[12px] text-[#4a5565]" style={FR}>{TRAIT_DESCRIPTIONS[trait]}</p>
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-[16px]">
              <div className={`${CARD} p-[16px]`}>
                <h3 className="text-[14px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}><DollarSign className="w-[16px] h-[16px] text-[#00a63e]" /> Contract Expectations</h3>
                <div className="flex flex-col gap-[12px] text-[14px]" style={FR}>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Weekly Salary</span><span className="text-[#ef4444]" style={FBold}>{formatCurrency(staff.salary)}/wk</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Signing Bonus</span><span style={FBold}>{formatCurrency(signingBonus)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Yearly Salary</span><span className="text-[#f59e0b]" style={FBold}>{formatCurrency(yearlySalary)}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Contract Length</span><span>{staff.contractYears} year{staff.contractYears > 1 ? 's' : ''}</span></div>
                  <div className="flex justify-between"><span className="text-[#4a5565]">Availability</span><span className={`px-[8px] py-[2px] rounded-[8px] text-[12px] ${staff.availability === 'available' ? 'bg-[#f0fdf4] text-[#00a63e]' : 'bg-[#f9fafb] text-[#4a5565]'}`}>{staff.availability === 'available' ? 'Immediately' : staff.availability}</span></div>
                </div>
              </div>
              <div className={`${CARD} p-[16px]`}>
                <h3 className="text-[14px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}><Briefcase className="w-[16px] h-[16px] text-[#3b82f6]" /> Role Information</h3>
                <p className="text-[14px] text-[#4a5565] mb-[12px]" style={FR}>{STAFF_ROLE_DESCRIPTIONS[staff.role]}</p>
                {!isTeamStaff && suitedFacilities.length > 0 && (<div><p className="text-[12px] text-[#4a5565] uppercase tracking-wide mb-[8px]" style={FBold}>Best Suited For</p><div className="flex flex-wrap gap-[4px]">{suitedFacilities.map(facility => <span key={facility} className="border-[0.8px] border-black/10 rounded-[6px] px-[6px] py-[2px] text-[12px] text-[#4a5565] flex items-center gap-[4px]" style={FR}><Building2 className="w-[12px] h-[12px]" /> {FACILITY_NAMES[facility]}</span>)}</div></div>)}
                {isTeamStaff && (<div className="flex flex-col gap-[8px] mt-[12px] pt-[12px] border-t border-black/10 text-[14px]" style={FR}><div className="flex justify-between"><span className="text-[#4a5565] flex items-center gap-[4px]"><Clock className="w-[12px] h-[12px]" /> Races Worked</span><span>{teamStaff.racesWorked || 0}</span></div>{(teamStaff.championshipsWon || 0) > 0 && <div className="flex justify-between"><span className="text-[#4a5565] flex items-center gap-[4px]"><Award className="w-[12px] h-[12px]" /> Championships Won</span><span className="text-[#f59e0b]" style={FBold}>{teamStaff.championshipsWon}</span></div>}</div>)}
              </div>
            </div>
          </div>

          <div className={`${CARD} p-[16px]`}>
            <h3 className="text-[14px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}><Info className="w-[16px] h-[16px] text-[#06b6d4]" /> Bio</h3>
            {bio && (bio.bio || bio.personality || (bio.quirks?.length ?? 0) > 0) ? (
              <>{bio.bio && <p className="text-[14px] text-[#4a5565] mb-[12px] whitespace-pre-line" style={FR}>{bio.bio}</p>}{bio.personality && <p className="text-[14px] text-[#4a5565] mb-[12px] italic" style={FR}>&ldquo;Known for being {bio.personality}.&rdquo;</p>}{bio.physicalDescription && <p className="text-[14px] text-[#4a5565] mb-[12px]" style={FR}>{bio.physicalDescription}</p>}{bio.quirks && bio.quirks.length > 0 && <div><p className="text-[12px] text-[#4a5565] uppercase tracking-wide mb-[8px]" style={FBold}>Quirks &amp; traits</p><ul className="list-disc list-inside text-[14px] text-[#4a5565] space-y-[4px]" style={FR}>{bio.quirks.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}</>
            ) : (
              <><p className="text-[14px] text-[#4a5565]" style={FR}>{staff.name} is a {staff.nationality} {STAFF_ROLE_NAMES[staff.role]} with {staff.experience} years of experience.{STAFF_ROLE_DESCRIPTIONS[staff.role as keyof typeof STAFF_ROLE_DESCRIPTIONS] && ` ${STAFF_ROLE_DESCRIPTIONS[staff.role as keyof typeof STAFF_ROLE_DESCRIPTIONS]}`}</p>{staff.traits.length > 0 && <span className="block mt-[8px] text-[#4a5565] text-[14px]" style={FR}>Known for: {staff.traits.slice(0, 3).map(t => (TRAIT_DESCRIPTIONS as Record<string, string>)[t] || t.replace(/_/g, ' ')).join('; ')}.</span>}</>
            )}
          </div>

          <div className="flex justify-between items-center pt-[16px] border-t border-black/10">
            <div>{!canAfford && <div className="flex items-center gap-[8px] text-[#ef4444] text-[14px]" style={FR}><AlertCircle className="w-[16px] h-[16px]" /> Insufficient funds (need {formatCurrency(signingBonus)}, have {formatCurrency(cash)})</div>}</div>
            <div className="flex gap-[12px]">
              <button className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR} onClick={onClose}>Close</button>
              {onNegotiate && <button className="bg-black text-white rounded-[16px] px-[16px] py-[10px] text-[14px] flex items-center gap-[8px] hover:bg-black/80 transition-colors" style={FBold} onClick={onNegotiate}><Handshake className="w-[16px] h-[16px]" /> Start Negotiation</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
