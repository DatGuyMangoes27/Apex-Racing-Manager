import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion';
import { Wind, Car, Gauge, Monitor, Factory, Megaphone, Building2, Users, DollarSign, TrendingUp, Star, Lock, ChevronRight, Plus, ArrowUpDown, Settings, Wrench, Zap, CheckCircle, AlertTriangle, Clock, Award, ArrowUpRight, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { getStaffPortrait, getRandomStaffPortraitByRole, getPortraitByManifestId, getFallbackPortrait } from '@/utils/generated-assets'
import { useCareerStore, normalizeFacilityState } from '@/store/careerStore'
import type { CareerState, HiredFacilityStaff, FacilityState } from '@/store/careerStore'
import type { TeamTier } from '@/store/rivalStore'
import {
  FACILITY_TYPES,
  FACILITY_NAMES,
  FACILITY_ICONS,
  FACILITY_DESCRIPTIONS,
  FACILITY_RD_MAPPING,
  FACILITY_STAFF_ROLES,
  MAX_FACILITY_LEVEL,
  getFacilityLevelConfig,
  getFacilitySummary,
  calculateFacilityWeeklyCost,
  canUpgradeFacility,
  getCombinedRdBonus,
  getManufacturingSpeedBonus,
  getMarketingBonus,
  getActiveSynergies,
  getAvailableProjects,
  getProjectCostForTier,
  getMaxFacilityStaff,
  getMaxConcurrentUpgrades,
  calculateStaffEffectivenessBonus,
  FACILITY_CONDITION_CONFIG,
  getConditionEffectiveness,
  calculateRepairCost,
  getUpgradeDuration,
  calculateFacilityUpgradeCost,
  getNextFacilityGrade,
  getFacilityRebuildConfig,
  calculateFacilityRebuildCost,
  FACILITY_GRADE_BONUSES,
  FACILITY_GRADE_ORDER,
} from '@/data/facility-config'
import type { FacilityType, FacilityProject, FacilitySynergy } from '@/data/facility-config'
import { formatCurrency } from '@/data/financial-config'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import { routeNotification } from '@/services/notificationRouter'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

const FACILITY_ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-[20px] h-[20px]" />,
  Car: <Car className="w-[20px] h-[20px]" />,
  Gauge: <Gauge className="w-[20px] h-[20px]" />,
  Monitor: <Monitor className="w-[20px] h-[20px]" />,
  Factory: <Factory className="w-[20px] h-[20px]" />,
  Megaphone: <Megaphone className="w-[20px] h-[20px]" />
}

const LEVEL_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-gray-100', text: 'text-gray-500' },
  2: { bg: 'bg-blue-50', text: 'text-blue-600' },
  3: { bg: 'bg-purple-50', text: 'text-purple-600' },
  4: { bg: 'bg-amber-50', text: 'text-amber-600' },
  5: { bg: 'bg-yellow-50', text: 'text-[#f59e0b]' }
}

const GRADE_COLORS: Record<string, { bg: string; text: string; pill: string }> = {
  entry:        { bg: 'bg-gray-100',   text: 'text-gray-600',   pill: 'bg-gray-100 text-gray-600' },
  amateur:      { bg: 'bg-green-50',   text: 'text-[#00a63e]',  pill: 'bg-green-50 text-[#00a63e]' },
  'semi-pro':   { bg: 'bg-blue-50',    text: 'text-blue-600',   pill: 'bg-blue-50 text-blue-600' },
  professional: { bg: 'bg-purple-50',  text: 'text-purple-600', pill: 'bg-purple-50 text-purple-600' },
  pro:          { bg: 'bg-amber-50',   text: 'text-amber-600',  pill: 'bg-amber-50 text-amber-600' },
  elite:        { bg: 'bg-orange-50',  text: 'text-orange-600', pill: 'bg-orange-50 text-orange-600' },
  pinnacle:     { bg: 'bg-red-50',     text: 'text-[#ef4444]',  pill: 'bg-red-50 text-[#ef4444]' },
}

export function Facilities() {
  const { 
    careerState,
    upgradeFacility,
    buildFacility,
    rebuildFacility,
    consumeHoursFromBudget,
    addPersonalCalendarEntry
  } = useCareerStore()
  const { addToast } = useToast()
  
  const [selectedFacility, setSelectedFacility] = useState<FacilityType | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (!careerState?.ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="flex items-center justify-center h-[384px]">
          <div className="text-center">
            <Building2 className="w-[64px] h-[64px] mx-auto mb-[16px] text-[#4a5565] opacity-50" />
            <h2 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No Team Owned</h2>
            <p className="text-[14px] text-[#4a5565]" style={FR}>You need to own a team to manage facilities.</p>
          </div>
        </div>
      </div>
    )
  }

  const team = careerState.ownedTeam
  const tier: TeamTier = team.tier || 'amateur'
  const facilities = team.facilities
  const staff = team.facilityStaff || []
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear

  const normalizeFacility = (facility: any): FacilityState => {
    return normalizeFacilityState(facility, tier)
  }

  const calculateWeeksRemaining = (facilityState: any) => {
    const normalized = normalizeFacility(facilityState)
    if (!normalized.upgradeInProgress || !normalized.upgradeCompletionWeek || !normalized.upgradeCompletionYear) {
      return 0
    }
    const currentTotalWeeks = (currentYear * 52) + currentWeek
    const completionTotalWeeks = (normalized.upgradeCompletionYear * 52) + normalized.upgradeCompletionWeek
    return Math.max(0, completionTotalWeeks - currentTotalWeeks)
  }

  const totalWeeklyCost = useMemo(() => {
    if (!facilities) return 0
    let total = 0
    FACILITY_TYPES.forEach(type => {
      const f = normalizeFacility(facilities[type])
      total += calculateFacilityWeeklyCost(f.grade || tier, f.level, type)
    })
    return total
  }, [facilities, tier])

  const facilityLevelsMap: Record<FacilityType, number> = useMemo(() => ({
    aero: facilities?.aero?.level || 1,
    chassis: facilities?.chassis?.level || 1,
    engine: facilities?.engine?.level || 1,
    sim: facilities?.sim?.level || 1,
    manufacturing: facilities?.manufacturing?.level || 1,
    marketing: facilities?.marketing?.level || 1
  }), [facilities])

  const activeSynergies = useMemo(() => getActiveSynergies(facilityLevelsMap), [facilityLevelsMap])

  const maxFacilityStaffCount = useMemo(() => getMaxFacilityStaff(tier, facilityLevelsMap), [tier, facilityLevelsMap])
  const totalHiredStaff = staff.length

  const facilityGradesMap: Record<FacilityType, TeamTier> = useMemo(() => ({
    aero: facilities?.aero?.grade || tier,
    chassis: facilities?.chassis?.grade || tier,
    engine: facilities?.engine?.grade || tier,
    sim: facilities?.sim?.grade || tier,
    manufacturing: facilities?.manufacturing?.grade || tier,
    marketing: facilities?.marketing?.grade || tier
  }), [facilities, tier])

  const rdBonuses = useMemo(() => {
    if (!facilities) return { aerodynamics: 0, chassis: 0, powertrain: 0, electronics: 0 }
    return {
      aerodynamics: getCombinedRdBonus('aerodynamics', facilityLevelsMap, undefined, facilityGradesMap) - 1,
      chassis: getCombinedRdBonus('chassis', facilityLevelsMap, undefined, facilityGradesMap) - 1,
      powertrain: getCombinedRdBonus('powertrain', facilityLevelsMap, undefined, facilityGradesMap) - 1,
      electronics: getCombinedRdBonus('electronics', facilityLevelsMap, undefined, facilityGradesMap) - 1
    }
  }, [facilities, facilityLevelsMap, facilityGradesMap])

  const upgradesInProgress = useMemo(() => {
    if (!facilities) return []
    return FACILITY_TYPES.filter(type => facilities[type]?.upgradeInProgress || facilities[type]?.rebuildInProgress)
  }, [facilities])

  const handleStartUpgrade = (facilityType: FacilityType) => {
    const result = upgradeFacility(facilityType)
    if (result.success) {
      const upgradeTimeCost = getActivityTimeCost('facility_inspection')
      if (upgradeTimeCost.hours > 0) {
        consumeHoursFromBudget(upgradeTimeCost.hours, upgradeTimeCost.drain, `Facility Upgrade: ${FACILITY_NAMES[facilityType]}`, 'facility_inspection')
      }
      addPersonalCalendarEntry({
        name: `Facility Upgrade: ${FACILITY_NAMES[facilityType]}`,
        description: `Started upgrade for ${FACILITY_NAMES[facilityType]}`,
        activityId: 'facility_inspection',
        week: careerState?.currentWeek ?? 1,
        day: careerState?.currentDay ?? 1,
        duration: upgradeTimeCost.hours,
        drainLevel: upgradeTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'team',
        immediate: true
      })
      routeNotification({
        category: 'facility',
        subject: `Facility Upgrade Started: ${FACILITY_NAMES[facilityType]}`,
        body: `The ${FACILITY_NAMES[facilityType]} upgrade has been approved and construction is underway. Expected completion in ${result.duration} weeks.`,
      })
      addToast({ type: 'success', title: 'Upgrade Started', message: `${FACILITY_NAMES[facilityType]} upgrade has begun. It will complete in ${result.duration} weeks.`, duration: 4000 })
      setShowUpgradeModal(false)
    } else {
      addToast({ type: 'error', title: 'Upgrade Failed', message: result.error || 'Unable to start upgrade', duration: 4000 })
    }
  }

  const handleStartRebuild = (facilityType: FacilityType) => {
    const result = rebuildFacility(facilityType)
    if (result.success) {
      const upgradeTimeCost = getActivityTimeCost('facility_inspection')
      if (upgradeTimeCost.hours > 0) {
        consumeHoursFromBudget(upgradeTimeCost.hours, upgradeTimeCost.drain, `Facility Rebuild: ${FACILITY_NAMES[facilityType]}`, 'facility_inspection')
      }
      addPersonalCalendarEntry({
        name: `Facility Rebuild: ${FACILITY_NAMES[facilityType]}`,
        description: `Started major rebuild for ${FACILITY_NAMES[facilityType]}`,
        activityId: 'facility_inspection',
        week: careerState?.currentWeek ?? 1,
        day: careerState?.currentDay ?? 1,
        duration: upgradeTimeCost.hours,
        drainLevel: upgradeTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'team',
        immediate: true
      })
      routeNotification({
        category: 'facility',
        subject: `Facility Rebuild Started: ${FACILITY_NAMES[facilityType]}`,
        body: `Major construction has begun to rebuild the ${FACILITY_NAMES[facilityType]} to a higher grade. Expected completion in ${result.duration} weeks.`,
      })
      addToast({ type: 'success', title: 'Rebuild Started', message: `${FACILITY_NAMES[facilityType]} rebuild has begun. It will complete in ${result.duration} weeks.`, duration: 4000 })
      setShowUpgradeModal(false)
    } else {
      addToast({ type: 'error', title: 'Rebuild Failed', message: result.error || 'Unable to start rebuild', duration: 4000 })
    }
  }

  const handleStartBuild = (facilityType: FacilityType) => {
    const result = buildFacility(facilityType)
    if (result.success) {
      const timeCost = getActivityTimeCost('facility_inspection')
      if (timeCost.hours > 0) {
        consumeHoursFromBudget(timeCost.hours, timeCost.drain, `Facility Build: ${FACILITY_NAMES[facilityType]}`, 'facility_inspection')
      }
      addPersonalCalendarEntry({
        name: `Build: ${FACILITY_NAMES[facilityType]}`,
        description: `Construction started for ${FACILITY_NAMES[facilityType]}`,
        activityId: 'facility_inspection',
        week: careerState?.currentWeek ?? 1,
        day: careerState?.currentDay ?? 1,
        duration: timeCost.hours,
        drainLevel: timeCost.drain,
        calendarEntryType: 'personal',
        category: 'team',
        immediate: true
      })
      routeNotification({
        category: 'facility',
        subject: `Construction Started: ${FACILITY_NAMES[facilityType]}`,
        body: `Construction of the ${FACILITY_NAMES[facilityType]} has begun. Expected completion in ${result.duration} weeks.`,
      })
      addToast({ type: 'success', title: 'Construction Started', message: `${FACILITY_NAMES[facilityType]} will be ready in ${result.duration} weeks.`, duration: 4000 })
    } else {
      addToast({ type: 'error', title: 'Build Failed', message: result.error || 'Unable to start construction', duration: 4000 })
    }
  }

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div>
          <div className="flex items-center gap-[12px] mb-[4px]">
            <Building2 className="w-[28px] h-[28px] text-[#0a0a0a]" />
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Facilities Management</h1>
          </div>
          <p className="text-[14px] text-[#4a5565]" style={FR}>{team.name} - Upgrade and manage your team's facilities</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-[16px]">
          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-[20px] h-[20px] text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Weekly Costs</p>
                <p className="text-[18px] text-[#ef4444]" style={FB}>{formatCurrency(totalWeeklyCost)}</p>
              </div>
            </div>
          </div>

          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-[20px] h-[20px] text-[#00a63e]" />
              </div>
              <div>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Avg R&D Bonus</p>
                <p className="text-[18px] text-[#00a63e]" style={FB}>
                  +{Math.round((Object.values(rdBonuses).reduce((a, b) => a + b, 0) / 4) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-amber-50 flex items-center justify-center">
                <Wrench className="w-[20px] h-[20px] text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Upgrades Active</p>
                <p className="text-[18px] text-[#0a0a0a]" style={FB}>
                  {upgradesInProgress.length} / {getMaxConcurrentUpgrades(tier)}
                </p>
                {upgradesInProgress.length >= getMaxConcurrentUpgrades(tier) && (
                  <p className="text-[11px] text-[#f59e0b]" style={FR}>At capacity</p>
                )}
              </div>
            </div>
          </div>

          <div className={INNER}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-purple-50 flex items-center justify-center">
                <Building2 className="w-[20px] h-[20px] text-purple-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#4a5565]" style={FR}>Built Facilities</p>
                <p className="text-[18px] text-[#0a0a0a]" style={FB}>
                  {FACILITY_TYPES.filter(t => !facilities?.[t]?.notBuilt).length} / {FACILITY_TYPES.length}
                </p>
                <p className="text-[11px] text-[#4a5565]" style={FR}>Bonuses from all built</p>
              </div>
            </div>
          </div>
        </div>

        {/* R&D Bonus Summary */}
        <div className={`${CARD} p-[24px]`}>
          <div className="mb-[16px]">
            <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>R&D Development Bonuses</h3>
            <p className="text-[13px] text-[#4a5565]" style={FR}>Current bonuses from facility levels applied to car development</p>
          </div>
          <div className="grid grid-cols-4 gap-[16px]">
            {Object.entries(rdBonuses).map(([area, bonus]) => (
              <div key={area} className={INNER}>
                <p className="text-[13px] text-[#4a5565] capitalize mb-[4px]" style={FR}>{area}</p>
                <p className={`text-[26px] ${bonus > 0 ? 'text-[#00a63e]' : 'text-[#4a5565]'}`} style={FB}>
                  +{Math.round(bonus * 100)}%
                </p>
                <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Development speed</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Synergies */}
        {activeSynergies.length > 0 && (
          <div className={`${CARD} p-[24px]`}>
            <div className="mb-[16px]">
              <h3 className="text-[18px] text-[#0a0a0a]" style={FB}>Active Synergies</h3>
              <p className="text-[13px] text-[#4a5565]" style={FR}>Bonuses from facilities working together</p>
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              {activeSynergies.map(synergy => (
                <div key={synergy.id} className="p-[12px] bg-purple-50 border-[0.8px] border-purple-200 rounded-[16px]">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <Zap className="w-[16px] h-[16px] text-purple-600" />
                    <p className="text-[13px] text-purple-700" style={FBold}>{synergy.name}</p>
                  </div>
                  <p className="text-[12px] text-[#4a5565] mb-[8px]" style={FR}>{synergy.description}</p>
                  <div className="flex items-center gap-[8px]">
                    <span className="px-[8px] py-[2px] bg-purple-100 text-purple-700 text-[11px] rounded-[6px]" style={FBold}>
                      +{Math.round(synergy.rdBonus * 100)}% R&D
                    </span>
                    <span className="text-[11px] text-[#4a5565]" style={FR}>{synergy.affectedAreas.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilities Grid */}
        <div className="grid grid-cols-3 gap-[24px]">
          {FACILITY_TYPES.map((facilityType, index) => {
            const rawFacilityState = facilities?.[facilityType]
            const facilityState = normalizeFacility(rawFacilityState)
            const level = facilityState.level
            const facilityGrade = facilityState.grade || tier
            const levelConfig = getFacilityLevelConfig(level, facilityType, facilityGrade)
            const summary = getFacilitySummary(facilityType, level, tier, facilityGrade)
            const isUpgrading = facilityState.upgradeInProgress
            const isRebuilding = facilityState.rebuildInProgress
            const isNotBuilt = facilityState.notBuilt === true
            const isBuildingNew = facilityState.buildInProgress === true
            const upgradeWeeksLeft = calculateWeeksRemaining(rawFacilityState)
            const buildWeeksLeft = isNotBuilt && isBuildingNew ? (() => {
              if (!facilityState.buildCompletionWeek || !facilityState.buildCompletionYear) return 0
              const current = currentYear * 52 + currentWeek
              const done = facilityState.buildCompletionYear * 52 + facilityState.buildCompletionWeek
              return Math.max(0, done - current)
            })() : 0
            const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS[1]
            const gradeColor = GRADE_COLORS[facilityGrade] || GRADE_COLORS['amateur']
            const gradeBonus = FACILITY_GRADE_BONUSES[facilityGrade]
            const upgradeCheck = canUpgradeFacility(facilityType, level, team.reputation || 50, tier, facilityLevelsMap)
            const canAfford = (team.budgets?.cash || 0) >= summary.upgradeCost
            const buildCost = summary.upgradeCost // approximate for display
            const canAffordBuild = (team.budgets?.cash || 0) >= buildCost
            
            return (
              <motion.div
                key={facilityType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className={`${CARD} p-[20px] transition-all hover:shadow-lg ${
                    isNotBuilt ? 'opacity-75 bg-[#f9fafb]' :
                    isUpgrading ? 'ring-1 ring-[#f59e0b]/50' :
                    isRebuilding ? 'ring-1 ring-purple-400/50' : ''
                  } ${!isNotBuilt ? 'cursor-pointer' : ''}`}
                  onClick={!isNotBuilt ? () => { setSelectedFacility(facilityType); setShowUpgradeModal(true) } : undefined}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-[16px]">
                    <div className="flex items-center gap-[12px]">
                      <div className={`w-[48px] h-[48px] rounded-[12px] ${isNotBuilt ? 'bg-gray-100' : levelColor.bg} flex items-center justify-center ${isNotBuilt ? 'text-gray-400' : levelColor.text}`}>
                        {FACILITY_ICON_COMPONENTS[FACILITY_ICONS[facilityType]]}
                      </div>
                      <div>
                        <h3 className="text-[14px] text-[#0a0a0a]" style={FB}>{FACILITY_NAMES[facilityType]}</h3>
                        <p className="text-[12px] text-[#4a5565]" style={FR}>{isNotBuilt ? 'Not constructed' : levelConfig.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-[4px]">
                      {isNotBuilt ? (
                        <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] bg-gray-100 text-gray-500" style={FBold}>Not Built</span>
                      ) : (
                        <>
                          <span className={`px-[8px] py-[2px] text-[11px] rounded-[6px] ${gradeColor.pill}`} style={FBold}>
                            {gradeBonus?.description || facilityGrade}
                          </span>
                          <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] bg-[#f9fafb] text-[#0a0a0a]" style={FBold}>
                            Level {level}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Build-in-progress banner */}
                  {isNotBuilt && isBuildingNew && (
                    <div className="mb-[16px] p-[12px] bg-blue-50 border-[0.8px] border-blue-200 rounded-[12px]">
                      <div className="flex items-center justify-between mb-[8px]">
                        <span className="text-[12px] text-blue-600 flex items-center gap-[8px]" style={FBold}>
                          <Wrench className="w-[16px] h-[16px] animate-pulse" />
                          Under Construction
                        </span>
                        <span className="text-[12px] text-[#0a0a0a]" style={FBold}>{buildWeeksLeft} weeks left</span>
                      </div>
                    </div>
                  )}

                  {/* Upgrade Progress */}
                  {!isNotBuilt && isUpgrading && (
                    <div className="mb-[16px] p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px]">
                      <div className="flex items-center justify-between mb-[8px]">
                        <span className="text-[12px] text-[#f59e0b] flex items-center gap-[8px]" style={FBold}>
                          <Wrench className="w-[16px] h-[16px] animate-pulse" />
                          Upgrading to Level {level + 1}
                        </span>
                        <span className="text-[12px] text-[#0a0a0a]" style={FBold}>{upgradeWeeksLeft} weeks left</span>
                      </div>
                      <div className="h-[8px] bg-white rounded-full overflow-hidden">
                        <motion.div className="h-full bg-[#f59e0b] rounded-full" initial={{ width: 0 }} animate={{ width: `${100 - (upgradeWeeksLeft / (summary.upgradeDuration || 1) * 100)}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  )}

                  {/* Rebuild Progress */}
                  {!isNotBuilt && isRebuilding && (
                    <div className="mb-[16px] p-[12px] bg-purple-50 border-[0.8px] border-purple-200 rounded-[12px]">
                      <div className="flex items-center justify-between mb-[8px]">
                        <span className="text-[12px] text-purple-600 flex items-center gap-[8px]" style={FBold}>
                          <Building2 className="w-[16px] h-[16px] animate-pulse" />
                          Rebuilding to {facilityState.rebuildTargetGrade} grade
                        </span>
                        <span className="text-[12px] text-[#0a0a0a]" style={FBold}>{upgradeWeeksLeft} weeks left</span>
                      </div>
                      <div className="h-[8px] bg-white rounded-full overflow-hidden">
                        <motion.div className="h-full bg-purple-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(5, 100 - (upgradeWeeksLeft / (getFacilityRebuildConfig(facilityState.rebuildTargetGrade!)?.durationWeeks || 1) * 100))}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  )}

                  {/* Passive bonus preview or Not-Built placeholder */}
                  {isNotBuilt ? (
                    <div className="p-[12px] bg-gray-50 border-[0.8px] border-gray-200 rounded-[12px] mb-[16px]">
                      <p className="text-[12px] text-gray-500" style={FR}>
                        {facilityType === 'manufacturing' ? (
                          `Build this to unlock parts manufacturing speed bonuses.`
                        ) : facilityType === 'marketing' ? (
                          `Build this to boost sponsor interest and deal rates.`
                        ) : (
                          `Build this to unlock ${FACILITY_RD_MAPPING[facilityType] || facilityType} R&D bonuses.`
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-[12px] mb-[16px]">
                      <div className="p-[8px] bg-[#f9fafb] rounded-[8px]">
                        {facilityType === 'manufacturing' ? (
                          <>
                            <p className="text-[11px] text-[#4a5565]" style={FR}>Build Speed</p>
                            <p className="text-[14px] text-[#2563eb]" style={FB}>-{Math.round((1 - getManufacturingSpeedBonus(level)) * 100)}% time</p>
                          </>
                        ) : facilityType === 'marketing' ? (
                          <>
                            <p className="text-[11px] text-[#4a5565]" style={FR}>Sponsor Interest</p>
                            <p className="text-[14px] text-purple-600" style={FB}>+{Math.round((getMarketingBonus(level) - 1) * 100)}%</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[11px] text-[#4a5565]" style={FR}>R&D Bonus (passive)</p>
                            <p className="text-[14px] text-[#00a63e]" style={FB}>+{Math.round((levelConfig.rdBonus - 1) * 100)}%</p>
                          </>
                        )}
                      </div>
                      <div className="p-[8px] bg-[#f9fafb] rounded-[8px]">
                        <p className="text-[11px] text-[#4a5565]" style={FR}>Weekly Cost</p>
                        <p className="text-[14px] text-[#ef4444]" style={FB}>{formatCurrency(summary.weeklyCost)}</p>
                      </div>
                    </div>
                  )}

                  {/* Build CTA for not-yet-built facilities */}
                  {isNotBuilt && !isBuildingNew && (
                    <div className="flex items-center justify-between pt-[12px] border-t border-black/10">
                      <div>
                        <p className="text-[11px] text-[#4a5565]" style={FR}>Build Cost</p>
                        <p className={`text-[14px] ${canAffordBuild ? 'text-[#0a0a0a]' : 'text-[#ef4444]'}`} style={FB}>{formatCurrency(buildCost)}</p>
                      </div>
                      <button
                        disabled={!canAffordBuild}
                        onClick={(e) => { e.stopPropagation(); handleStartBuild(facilityType) }}
                        className={`h-[32px] px-[12px] rounded-[12px] text-[12px] transition-colors ${
                          canAffordBuild
                            ? 'bg-black text-white hover:bg-black/90'
                            : 'bg-[#f9fafb] text-[#4a5565] cursor-not-allowed'
                        }`}
                        style={FBold}
                      >
                        {canAffordBuild ? (
                          <span className="flex items-center gap-[4px]"><Plus className="w-[12px] h-[12px]" /> Build</span>
                        ) : (
                          <span className="flex items-center gap-[4px]"><DollarSign className="w-[12px] h-[12px]" /> Can't Afford</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Upgrade Button */}
                  {!isNotBuilt && !isUpgrading && level < MAX_FACILITY_LEVEL && (
                    <div className="flex items-center justify-between pt-[12px] border-t border-black/10">
                      <div>
                        <p className="text-[11px] text-[#4a5565]" style={FR}>Upgrade Cost</p>
                        <p className={`text-[14px] ${canAfford ? 'text-[#0a0a0a]' : 'text-[#ef4444]'}`} style={FB}>{formatCurrency(summary.upgradeCost)}</p>
                      </div>
                      <button
                        disabled={!upgradeCheck.allowed || !canAfford}
                        onClick={(e) => { e.stopPropagation(); setSelectedFacility(facilityType); setShowUpgradeModal(true) }}
                        className={`h-[32px] px-[12px] rounded-[12px] text-[12px] transition-colors ${
                          upgradeCheck.allowed && canAfford
                            ? 'bg-black text-white hover:bg-black/90'
                            : 'bg-[#f9fafb] text-[#4a5565] cursor-not-allowed'
                        }`}
                        style={FBold}
                      >
                        {!upgradeCheck.allowed ? (
                          <span className="flex items-center gap-[4px]"><Lock className="w-[12px] h-[12px]" /> Locked</span>
                        ) : !canAfford ? (
                          <span className="flex items-center gap-[4px]"><DollarSign className="w-[12px] h-[12px]" /> Can't Afford</span>
                        ) : (
                          <span className="flex items-center gap-[4px]"><ArrowUpRight className="w-[12px] h-[12px]" /> Upgrade</span>
                        )}
                      </button>
                    </div>
                  )}

                  {!isNotBuilt && level === MAX_FACILITY_LEVEL && !isRebuilding && (
                    <div className="pt-[12px] border-t border-black/10 text-center">
                      {getNextFacilityGrade(facilityGrade) ? (
                        <span className="px-[10px] py-[4px] text-[11px] bg-purple-50 text-purple-600 rounded-[8px] inline-flex items-center gap-[4px]" style={FBold}>
                          <Building2 className="w-[12px] h-[12px]" />
                          Rebuild Available
                        </span>
                      ) : (
                        <span className="px-[10px] py-[4px] text-[11px] bg-[#f59e0b]/10 text-[#f59e0b] rounded-[8px] inline-flex items-center gap-[4px]" style={FBold}>
                          <Star className="w-[12px] h-[12px]" />
                          Maximum Grade & Level
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Upgrade Detail Modal */}
        {showUpgradeModal && selectedFacility !== null && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => { setShowUpgradeModal(false); setSelectedFacility(null) }}>
            <div className="bg-white rounded-[24px] max-w-[640px] w-full max-h-[85vh] overflow-y-auto p-[24px]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-[16px]">
                <h2 className="text-[20px] text-[#0a0a0a]" style={FB}>{FACILITY_NAMES[selectedFacility]} Details</h2>
                <button onClick={() => { setShowUpgradeModal(false); setSelectedFacility(null) }} className="w-[32px] h-[32px] rounded-full bg-[#f9fafb] flex items-center justify-center text-[#4a5565] hover:bg-black/10 transition-colors text-[18px]">&times;</button>
              </div>
              <FacilityDetailPanel
                facilityType={selectedFacility}
                team={team}
                tier={tier}
                currentWeek={currentWeek}
                currentYear={currentYear}
                onUpgrade={() => handleStartUpgrade(selectedFacility)}
                onRebuild={() => handleStartRebuild(selectedFacility)}
              />
            </div>
          </div>
        )}

        {/* Staff Assignment Modal removed — staff assignment no longer used */}
      </div>
    </div>
  )
}

// ============================================
// Facility Detail Panel
// ============================================

interface FacilityDetailPanelProps {
  facilityType: FacilityType
  team: CareerState['ownedTeam']
  tier: TeamTier
  currentWeek: number
  currentYear: number
  onUpgrade: () => void
  onRebuild: () => void
}

function FacilityDetailPanel({ facilityType, team, tier, currentWeek, currentYear, onUpgrade, onRebuild }: FacilityDetailPanelProps) {
  if (!team) return null
  
  const facilities = team.facilities
  const rawFacilityState = facilities?.[facilityType]
  const facilityState = normalizeFacilityState(rawFacilityState, tier)
  const level = facilityState.level
  const facilityGrade = facilityState.grade || tier
  const levelConfig = getFacilityLevelConfig(level, facilityType, facilityGrade)
  const nextLevelConfig = level < MAX_FACILITY_LEVEL ? getFacilityLevelConfig(level + 1, facilityType, facilityGrade) : null
  const summary = getFacilitySummary(facilityType, level, tier, facilityGrade)
  const isUpgrading = facilityState.upgradeInProgress
  const isRebuilding = facilityState.rebuildInProgress
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS[1]
  const gradeColor = GRADE_COLORS[facilityGrade] || GRADE_COLORS['amateur']
  const gradeBonus = FACILITY_GRADE_BONUSES[facilityGrade]
  
  const nextGrade = getNextFacilityGrade(facilityGrade)
  const rebuildConfig = nextGrade ? getFacilityRebuildConfig(nextGrade) : null
  const rebuildCost = nextGrade ? calculateFacilityRebuildCost(facilityType, nextGrade) : 0
  const canAffordRebuild = (team?.budgets?.cash || 0) >= rebuildCost
  const meetsRebuildReputation = (team?.reputation || 0) >= (rebuildConfig?.minReputation || 0)
  
  const upgradeWeeksRemaining = useMemo(() => {
    if ((!facilityState.upgradeInProgress && !facilityState.rebuildInProgress) || !facilityState.upgradeCompletionWeek || !facilityState.upgradeCompletionYear) return 0
    const currentTotalWeeks = (currentYear * 52) + currentWeek
    const completionTotalWeeks = (facilityState.upgradeCompletionYear * 52) + facilityState.upgradeCompletionWeek
    return Math.max(0, completionTotalWeeks - currentTotalWeeks)
  }, [facilityState, currentWeek, currentYear])
  
  const facilityLevels: Record<FacilityType, number> = {
    aero: facilities?.aero?.level || 1, chassis: facilities?.chassis?.level || 1, engine: facilities?.engine?.level || 1,
    sim: facilities?.sim?.level || 1, manufacturing: facilities?.manufacturing?.level || 1, marketing: facilities?.marketing?.level || 1
  }
  const upgradeCheck = canUpgradeFacility(facilityType, level, team.reputation || 50, tier, facilityLevels)
  const canAfford = (team.budgets?.cash || 0) >= summary.upgradeCost

  const rdAreas = FACILITY_RD_MAPPING[facilityType]
  const staffRole = FACILITY_STAFF_ROLES[facilityType]
  
  const assignedFacilityStaff = (team.facilityStaff || []).filter(s => s.assignedFacility === facilityType)
  const staffEffectiveness = useMemo(() => {
    if (assignedFacilityStaff.length === 0) return 0
    return calculateStaffEffectivenessBonus(facilityType, assignedFacilityStaff.map(s => ({ skills: s.skills || { reliability: 50, strategy: 50, pit: 50 }, specializations: s.specializations, experience: s.experience })))
  }, [assignedFacilityStaff, facilityType])
  
  const projects = useMemo(() => getAvailableProjects(facilityType, level), [facilityType, level])

  return (
    <div className="space-y-[24px]">
      {/* Header */}
      <div className="flex items-center gap-[16px] p-[16px] bg-[#f9fafb] rounded-[16px]">
        <div className={`w-[64px] h-[64px] rounded-[16px] ${levelColor.bg} flex items-center justify-center ${levelColor.text}`}>
          {FACILITY_ICON_COMPONENTS[FACILITY_ICONS[facilityType]]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-[12px] mb-[4px]">
            <h3 className="text-[20px] text-[#0a0a0a]" style={FB}>{FACILITY_NAMES[facilityType]}</h3>
            <span className={`px-[8px] py-[2px] text-[11px] rounded-[6px] ${gradeColor.pill}`} style={FBold}>{gradeBonus?.description || facilityGrade}</span>
            <span className="px-[8px] py-[2px] text-[11px] rounded-[6px] bg-[#f9fafb] text-[#0a0a0a] border-[0.8px] border-black/10" style={FBold}>Level {level} - {levelConfig.name}</span>
          </div>
          <p className="text-[13px] text-[#4a5565]" style={FR}>{levelConfig.description}</p>
          {gradeBonus && gradeBonus.rdBonusAdd !== 0 && (
            <p className="text-[12px] text-[#2563eb] mt-[4px]" style={FR}>
              Grade bonus: {gradeBonus.rdBonusAdd > 0 ? '+' : ''}{Math.round(gradeBonus.rdBonusAdd * 100)}% R&D
              {gradeBonus.staffSlotsAdd > 0 && `, +${gradeBonus.staffSlotsAdd} staff slots`}
            </p>
          )}
        </div>
      </div>

      {/* Current Level Stats */}
      <div>
        <h4 className="text-[13px] text-[#4a5565] mb-[12px]" style={FBold}>Current Performance</h4>
        <div className="grid grid-cols-4 gap-[12px]">
          {facilityType === 'manufacturing' ? (
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Build Speed</p>
              <p className="text-[20px] text-[#2563eb]" style={FB}>-{Math.round((1 - getManufacturingSpeedBonus(level)) * 100)}%</p>
            </div>
          ) : facilityType === 'marketing' ? (
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Sponsor Boost</p>
              <p className="text-[20px] text-purple-600" style={FB}>+{Math.round((getMarketingBonus(level) - 1) * 100)}%</p>
            </div>
          ) : (
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>R&D Bonus</p>
              <p className="text-[20px] text-[#00a63e]" style={FB}>+{Math.round((levelConfig.rdBonus - 1) * 100)}%</p>
            </div>
          )}
          <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
            <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Staff ({assignedFacilityStaff.length})</p>
            <p className="text-[20px] text-[#0a0a0a]" style={FB}>{levelConfig.staffSlots} slots</p>
          </div>
          <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
            <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Staff Boost</p>
            <p className={`text-[20px] ${staffEffectiveness > 0 ? 'text-[#2563eb]' : 'text-[#4a5565]'}`} style={FB}>
              {staffEffectiveness > 0 ? `+${Math.round(staffEffectiveness * 100)}%` : 'None'}
            </p>
          </div>
          <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
            <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Weekly Cost</p>
            <p className="text-[20px] text-[#ef4444]" style={FB}>{formatCurrency(summary.weeklyCost)}</p>
          </div>
        </div>
      </div>

      {/* R&D Impact */}
      {rdAreas.length > 0 && (
        <div className="p-[16px] bg-green-50 border-[0.8px] border-green-200 rounded-[16px]">
          <h4 className="text-[13px] text-[#00a63e] flex items-center gap-[8px] mb-[8px]" style={FBold}>
            <Zap className="w-[16px] h-[16px]" /> R&D Development Areas Affected
          </h4>
          <div className="flex flex-wrap gap-[8px]">
            {rdAreas.map(area => (
              <span key={area} className="px-[8px] py-[2px] bg-green-100 text-[#00a63e] text-[11px] rounded-[6px] capitalize" style={FBold}>{area}</span>
            ))}
          </div>
          <p className="text-[11px] text-[#4a5565] mt-[8px]" style={FR}>
            Facility level (+{Math.round((levelConfig.rdBonus - 1) * 100)}%)
            {staffEffectiveness > 0 && ` + Staff (+${Math.round(staffEffectiveness * 100)}%)`}
            {' = '}combined development speed bonus for these areas.
          </p>
        </div>
      )}

      {/* Special Bonuses */}
      {facilityType === 'manufacturing' && (
        <div className="p-[16px] bg-blue-50 border-[0.8px] border-blue-200 rounded-[16px]">
          <h4 className="text-[13px] text-[#2563eb] flex items-center gap-[8px] mb-[8px]" style={FBold}>
            <Factory className="w-[16px] h-[16px]" /> Manufacturing Impact
          </h4>
          <p className="text-[13px] text-[#0a0a0a]" style={FR}>Part production and R&D upgrade completion time reduced by <span style={FB}>{Math.round((1 - getManufacturingSpeedBonus(level)) * 100)}%</span></p>
          <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Affects how quickly upgrades complete and parts are manufactured.</p>
        </div>
      )}
      {facilityType === 'marketing' && (
        <div className="p-[16px] bg-purple-50 border-[0.8px] border-purple-200 rounded-[16px]">
          <h4 className="text-[13px] text-purple-600 flex items-center gap-[8px] mb-[8px]" style={FBold}>
            <Megaphone className="w-[16px] h-[16px]" /> Marketing Impact
          </h4>
          <p className="text-[13px] text-[#0a0a0a]" style={FR}>Sponsor interest multiplied by <span style={FB}>x{getMarketingBonus(level).toFixed(2)}</span> (+{Math.round((getMarketingBonus(level) - 1) * 100)}%)</p>
          <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Directly affects how many sponsors approach you.</p>
        </div>
      )}

      {/* Staff Role Info */}
      <div className="p-[16px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px]">
        <h4 className="text-[13px] text-[#0a0a0a] flex items-center gap-[8px] mb-[8px]" style={FBold}>
          <Users className="w-[16px] h-[16px]" /> Staff: {staffRole.title} ({assignedFacilityStaff.length}/{levelConfig.staffSlots})
        </h4>
        <p className="text-[13px] text-[#4a5565] mb-[8px]" style={FR}>{staffRole.description}</p>
        <div className="flex gap-[8px] mb-[8px]">
          <span className="text-[11px] text-[#4a5565]" style={FR}>Key Skills:</span>
          {staffRole.skillsRequired.map(skill => (
            <span key={skill} className="px-[6px] py-[1px] border-[0.8px] border-black/10 rounded-[6px] text-[11px] text-[#4a5565] capitalize" style={FR}>{skill}</span>
          ))}
        </div>
        {staffEffectiveness > 0 && <p className="text-[11px] text-[#00a63e]" style={FR}>Current staff providing +{Math.round(staffEffectiveness * 100)}% effectiveness.</p>}
        {assignedFacilityStaff.length === 0 && <p className="text-[11px] text-[#f59e0b]" style={FR}>No staff assigned. Hire and assign staff to boost output.</p>}
      </div>

      {/* Facility Projects */}
      {projects.length > 0 && (
        <div>
          <h4 className="text-[13px] text-[#4a5565] mb-[12px] flex items-center gap-[8px]" style={FBold}>
            <Settings className="w-[16px] h-[16px]" /> Available Projects
          </h4>
          <div className="space-y-[8px]">
            {projects.map(project => {
              const projectCost = getProjectCostForTier(project, tier)
              const canAffordProject = (team?.budgets?.cash || 0) >= projectCost
              return (
                <div key={project.id} className="p-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[12px]">
                  <div className="flex items-start justify-between mb-[4px]">
                    <div>
                      <p className="text-[13px] text-[#0a0a0a]" style={FBold}>{project.name}</p>
                      <p className="text-[11px] text-[#4a5565]" style={FR}>{project.description}</p>
                    </div>
                    <span className={`px-[8px] py-[2px] text-[11px] rounded-[6px] ${canAffordProject ? 'bg-green-50 text-[#00a63e]' : 'bg-[#f9fafb] text-[#4a5565]'}`} style={FBold}>
                      {formatCurrency(projectCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-[12px] mt-[8px] text-[11px] text-[#4a5565]" style={FR}>
                    <span><Clock className="w-[12px] h-[12px] inline mr-[4px]" />{project.durationWeeks}w</span>
                    {project.effects.rdSpeedBonus && <span className="px-[6px] py-[1px] bg-green-50 text-[#00a63e] rounded-[4px]">+{Math.round(project.effects.rdSpeedBonus * 100)}% R&D</span>}
                    {project.effects.reliabilityBonus && <span className="px-[6px] py-[1px] bg-blue-50 text-blue-600 rounded-[4px]">+{Math.round(project.effects.reliabilityBonus * 100)}% Rel</span>}
                    {project.effects.sponsorInterestBonus && <span className="px-[6px] py-[1px] bg-purple-50 text-purple-600 rounded-[4px]">+{Math.round(project.effects.sponsorInterestBonus * 100)}% Sponsors</span>}
                    {project.effects.manufacturingSpeedBonus && <span className="px-[6px] py-[1px] bg-blue-50 text-blue-600 rounded-[4px]">+{Math.round(project.effects.manufacturingSpeedBonus * 100)}% Build</span>}
                    <span>Lasts {project.effectDurationWeeks}w</span>
                    {project.cooldownWeeks > 0 && <span>CD: {project.cooldownWeeks}w</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upgrade Section */}
      {!isUpgrading && level < MAX_FACILITY_LEVEL && nextLevelConfig && (
        <div className="border-t border-black/10 pt-[24px]">
          <h4 className="text-[13px] text-[#4a5565] mb-[12px]" style={FBold}>Upgrade to Level {level + 1}</h4>
          <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px]">
              <p className="text-[11px] text-[#4a5565] mb-[8px]" style={FR}>Current (Level {level})</p>
              <div className="space-y-[4px] text-[13px]" style={FR}>
                <p className="text-[#0a0a0a]">R&D Bonus: <span style={FB}>+{Math.round((levelConfig.rdBonus - 1) * 100)}%</span></p>
                <p className="text-[#0a0a0a]">Staff Slots: <span style={FB}>{levelConfig.staffSlots}</span></p>
                <p className="text-[#0a0a0a]">Weekly Cost: <span className="text-[#ef4444]" style={FB}>{formatCurrency(summary.weeklyCost)}</span></p>
              </div>
            </div>
            <div className="p-[16px] bg-green-50 border-[0.8px] border-green-200 rounded-[12px]">
              <p className="text-[11px] text-[#00a63e] mb-[8px]" style={FR}>After Upgrade (Level {level + 1})</p>
              <div className="space-y-[4px] text-[13px]" style={FR}>
                <p className="text-[#0a0a0a]">R&D Bonus: <span className="text-[#00a63e]" style={FB}>+{Math.round((nextLevelConfig.rdBonus - 1) * 100)}%</span></p>
                <p className="text-[#0a0a0a]">Staff Slots: <span style={FB}>{nextLevelConfig.staffSlots}</span></p>
                <p className="text-[#0a0a0a]">Weekly Cost: <span className="text-[#ef4444]" style={FB}>{formatCurrency(calculateFacilityWeeklyCost(facilityGrade, level + 1, facilityType))}</span></p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[12px] mb-[16px]">
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Upgrade Cost</p>
              <p className={`text-[18px] ${canAfford ? 'text-[#0a0a0a]' : 'text-[#ef4444]'}`} style={FB}>{formatCurrency(summary.upgradeCost)}</p>
              {!canAfford && <p className="text-[11px] text-[#ef4444] mt-[4px]" style={FR}>Need {formatCurrency(summary.upgradeCost - (team.budgets?.cash || 0))} more</p>}
            </div>
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Build Time</p>
              <p className="text-[18px] text-[#0a0a0a]" style={FB}>{summary.upgradeDuration}w</p>
              <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>~{Math.round(summary.upgradeDuration / 4.3)} months</p>
            </div>
            <div className="p-[16px] bg-red-50 border-[0.8px] border-red-200 rounded-[12px] text-center">
              <p className="text-[11px] text-[#ef4444] mb-[4px]" style={FR}>Weekly Cost Change</p>
              <p className="text-[18px] text-[#ef4444]" style={FB}>+{formatCurrency(calculateFacilityWeeklyCost(facilityGrade, level + 1, facilityType) - summary.weeklyCost)}</p>
              <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>{formatCurrency(summary.weeklyCost)} → {formatCurrency(calculateFacilityWeeklyCost(facilityGrade, level + 1, facilityType))}/wk</p>
            </div>
          </div>

          {!upgradeCheck.allowed && (
            <div className="flex items-start gap-[12px] p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px] mb-[16px]">
              <AlertCircle className="w-[20px] h-[20px] text-[#f59e0b] mt-[2px]" />
              <p className="text-[13px] text-[#f59e0b]" style={FR}>{upgradeCheck.reason}</p>
            </div>
          )}

          {(() => {
            const maxConcurrent = getMaxConcurrentUpgrades(tier)
            const currentUpgrades = FACILITY_TYPES.filter(t => { const f = team.facilities?.[t]; return f && typeof f === 'object' && (f.upgradeInProgress || f.rebuildInProgress) }).length
            if (currentUpgrades < maxConcurrent) return null
            return (
              <div className="flex items-start gap-[12px] p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px] mb-[16px]">
                <AlertCircle className="w-[20px] h-[20px] text-[#f59e0b] mt-[2px]" />
                <p className="text-[13px] text-[#f59e0b]" style={FR}>All {maxConcurrent} construction slot{maxConcurrent > 1 ? 's' : ''} in use.</p>
              </div>
            )
          })()}

          <button
            disabled={!upgradeCheck.allowed || !canAfford || FACILITY_TYPES.filter(t => { const f = team.facilities?.[t]; return f && typeof f === 'object' && (f.upgradeInProgress || f.rebuildInProgress) }).length >= getMaxConcurrentUpgrades(tier)}
            onClick={onUpgrade}
            className="w-full h-[48px] bg-black text-white rounded-[16px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-black/90 transition-colors disabled:bg-[#f9fafb] disabled:text-[#4a5565] disabled:cursor-not-allowed"
            style={FBold}
          >
            {!upgradeCheck.allowed ? (
              <><Lock className="w-[16px] h-[16px]" /> Requirements Not Met</>
            ) : FACILITY_TYPES.filter(t => { const f = team.facilities?.[t]; return f && typeof f === 'object' && (f.upgradeInProgress || f.rebuildInProgress) }).length >= getMaxConcurrentUpgrades(tier) ? (
              <><Clock className="w-[16px] h-[16px]" /> No Construction Slots</>
            ) : !canAfford ? (
              <><DollarSign className="w-[16px] h-[16px]" /> Insufficient Funds</>
            ) : (
              <><ArrowUpRight className="w-[16px] h-[16px]" /> Start Upgrade ({summary.upgradeDuration} weeks)</>
            )}
          </button>
        </div>
      )}

      {/* Upgrade In Progress */}
      {isUpgrading && (
        <div className="p-[16px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[16px]">
          <div className="flex items-center gap-[12px] mb-[12px]">
            <Wrench className="w-[20px] h-[20px] text-[#f59e0b] animate-pulse" />
            <div>
              <p className="text-[14px] text-[#f59e0b]" style={FBold}>Upgrade In Progress</p>
              <p className="text-[13px] text-[#4a5565]" style={FR}>{upgradeWeeksRemaining} weeks remaining</p>
            </div>
          </div>
          <div className="h-[12px] bg-white rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#f59e0b] rounded-full" initial={{ width: 0 }} animate={{ width: `${100 - (upgradeWeeksRemaining / (summary.upgradeDuration || 1) * 100)}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      )}

      {/* Rebuild In Progress */}
      {isRebuilding && (
        <div className="p-[16px] bg-purple-50 border-[0.8px] border-purple-200 rounded-[16px]">
          <div className="flex items-center gap-[12px] mb-[12px]">
            <Building2 className="w-[20px] h-[20px] text-purple-600 animate-pulse" />
            <div>
              <p className="text-[14px] text-purple-600" style={FBold}>Rebuilding to {facilityState.rebuildTargetGrade} Grade</p>
              <p className="text-[13px] text-[#4a5565]" style={FR}>{upgradeWeeksRemaining} weeks remaining — Major construction project</p>
            </div>
          </div>
          <div className="h-[12px] bg-white rounded-full overflow-hidden">
            <motion.div className="h-full bg-purple-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(5, 100 - (upgradeWeeksRemaining / (rebuildConfig?.durationWeeks || 1) * 100))}%` }} transition={{ duration: 0.5 }} />
          </div>
          <p className="text-[11px] text-[#4a5565] mt-[8px]" style={FR}>When complete, this facility will reset to Level 1 of {facilityState.rebuildTargetGrade} grade with improved baseline.</p>
        </div>
      )}

      {/* Max Level — Rebuild */}
      {level === MAX_FACILITY_LEVEL && !isUpgrading && !isRebuilding && nextGrade && rebuildConfig && (
        <div className="border-t border-black/10 pt-[24px]">
          <h4 className="text-[13px] text-purple-600 mb-[12px] flex items-center gap-[8px]" style={FBold}>
            <Building2 className="w-[16px] h-[16px]" /> Rebuild to {FACILITY_GRADE_BONUSES[nextGrade]?.description || nextGrade} Grade
          </h4>
          <p className="text-[13px] text-[#4a5565] mb-[16px]" style={FR}>
            Your facility has reached Level 5. You can undertake a major rebuild to <span className="text-purple-600" style={FBold}>{nextGrade}</span> grade.
            This resets to Level 1 but with significantly better baseline performance.
          </p>
          
          <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px]">
              <p className="text-[11px] text-[#4a5565] mb-[8px]" style={FR}>Current ({gradeBonus?.description} L{level})</p>
              <div className="space-y-[4px] text-[13px]" style={FR}>
                <p className="text-[#0a0a0a]">R&D Bonus: <span style={FB}>+{Math.round((levelConfig.rdBonus - 1) * 100)}%</span></p>
                <p className="text-[#0a0a0a]">Staff Slots: <span style={FB}>{levelConfig.staffSlots}</span></p>
                <p className="text-[#0a0a0a]">Weekly Cost: <span className="text-[#ef4444]" style={FB}>{formatCurrency(summary.weeklyCost)}</span></p>
              </div>
            </div>
            <div className="p-[16px] bg-purple-50 border-[0.8px] border-purple-200 rounded-[12px]">
              <p className="text-[11px] text-purple-600 mb-[8px]" style={FR}>After Rebuild ({FACILITY_GRADE_BONUSES[nextGrade]?.description} L1)</p>
              <div className="space-y-[4px] text-[13px]" style={FR}>
                <p className="text-[#0a0a0a]">R&D Bonus: <span className="text-purple-600" style={FB}>+{Math.round((getFacilityLevelConfig(1, facilityType, nextGrade).rdBonus - 1) * 100)}%</span></p>
                <p className="text-[#0a0a0a]">Staff Slots: <span style={FB}>{getFacilityLevelConfig(1, facilityType, nextGrade).staffSlots}</span></p>
                <p className="text-[#0a0a0a]">Weekly Cost: <span className="text-[#ef4444]" style={FB}>{formatCurrency(calculateFacilityWeeklyCost(nextGrade, 1, facilityType))}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[12px] mb-[16px]">
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Rebuild Cost</p>
              <p className={`text-[18px] ${canAffordRebuild ? 'text-[#0a0a0a]' : 'text-[#ef4444]'}`} style={FB}>{formatCurrency(rebuildCost)}</p>
              {!canAffordRebuild && <p className="text-[11px] text-[#ef4444] mt-[4px]" style={FR}>Need {formatCurrency(rebuildCost - (team?.budgets?.cash || 0))} more</p>}
            </div>
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Construction Time</p>
              <p className="text-[18px] text-[#0a0a0a]" style={FB}>{rebuildConfig.durationWeeks}w</p>
              <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>~{Math.round(rebuildConfig.durationWeeks / 4.3)} months</p>
            </div>
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>Rep. Required</p>
              <p className={`text-[18px] ${meetsRebuildReputation ? 'text-[#00a63e]' : 'text-[#ef4444]'}`} style={FB}>{rebuildConfig.minReputation}</p>
              <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Current: {team?.reputation || 0}</p>
            </div>
          </div>

          {!meetsRebuildReputation && (
            <div className="flex items-start gap-[12px] p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px] mb-[16px]">
              <AlertCircle className="w-[20px] h-[20px] text-[#f59e0b] mt-[2px]" />
              <p className="text-[13px] text-[#f59e0b]" style={FR}>Need reputation {rebuildConfig.minReputation} to rebuild (current: {team?.reputation || 0})</p>
            </div>
          )}

          {(() => {
            const maxConcurrent = getMaxConcurrentUpgrades(tier)
            const currentUpgrades = FACILITY_TYPES.filter(t => { const f = team?.facilities?.[t]; return f && typeof f === 'object' && (f.upgradeInProgress || f.rebuildInProgress) }).length
            if (currentUpgrades < maxConcurrent) return null
            return (
              <div className="flex items-start gap-[12px] p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px] mb-[16px]">
                <AlertCircle className="w-[20px] h-[20px] text-[#f59e0b] mt-[2px]" />
                <p className="text-[13px] text-[#f59e0b]" style={FR}>All {maxConcurrent} construction slot{maxConcurrent > 1 ? 's' : ''} in use.</p>
              </div>
            )
          })()}

          <button
            disabled={!canAffordRebuild || !meetsRebuildReputation || FACILITY_TYPES.filter(t => { const f = team?.facilities?.[t]; return f && typeof f === 'object' && (f.upgradeInProgress || f.rebuildInProgress) }).length >= getMaxConcurrentUpgrades(tier)}
            onClick={onRebuild}
            className="w-full h-[48px] bg-purple-600 text-white rounded-[16px] text-[14px] flex items-center justify-center gap-[8px] hover:bg-purple-700 transition-colors disabled:bg-[#f9fafb] disabled:text-[#4a5565] disabled:cursor-not-allowed"
            style={FBold}
          >
            {!meetsRebuildReputation ? (
              <><Lock className="w-[16px] h-[16px]" /> Reputation Too Low</>
            ) : !canAffordRebuild ? (
              <><DollarSign className="w-[16px] h-[16px]" /> Insufficient Funds</>
            ) : (
              <><Building2 className="w-[16px] h-[16px]" /> Start Rebuild ({rebuildConfig.durationWeeks} weeks)</>
            )}
          </button>
        </div>
      )}

      {/* Already at pinnacle max */}
      {level === MAX_FACILITY_LEVEL && !nextGrade && !isRebuilding && (
        <div className="p-[16px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[16px] text-center">
          <Star className="w-[32px] h-[32px] text-[#f59e0b] mx-auto mb-[8px]" />
          <p className="text-[14px] text-[#f59e0b]" style={FB}>Pinnacle Grade - Maximum Level</p>
          <p className="text-[13px] text-[#4a5565]" style={FR}>This facility is operating at peak performance.</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Staff Assignment Panel
// ============================================

interface StaffAssignmentPanelProps {
  facilityType: FacilityType
  staff: HiredFacilityStaff[]
  facilities: NonNullable<CareerState['ownedTeam']>['facilities']
  onAssign: (staffId: string, facilityType: FacilityType) => void
  onRemove: (staffId: string) => void
}

function StaffAssignmentPanel({ facilityType, staff, facilities, onAssign, onRemove }: StaffAssignmentPanelProps) {
  const facilityState = facilities?.[facilityType]
  const level = facilityState?.level || 1
  const facilityGradeForStaff = facilityState?.grade as TeamTier | undefined
  const levelConfig = getFacilityLevelConfig(level, facilityType, facilityGradeForStaff)
  const staffRole = FACILITY_STAFF_ROLES[facilityType]
  
  const assignedStaff = staff?.filter(s => s.assignedFacility === facilityType) || []
  const unassignedStaff = staff?.filter(s => !s.assignedFacility) || []
  const slotsAvailable = levelConfig.staffSlots - assignedStaff.length

  return (
    <div className="space-y-[24px]">
      {/* Current Assignments */}
      <div>
        <h4 className="text-[13px] text-[#0a0a0a] mb-[12px] flex items-center gap-[8px]" style={FBold}>
          <Users className="w-[16px] h-[16px]" /> Currently Assigned ({assignedStaff.length}/{levelConfig.staffSlots})
        </h4>
        {assignedStaff.length > 0 ? (
          <div className="space-y-[8px]">
            {assignedStaff.map(member => (
              <div key={member.id} className="flex items-center justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                <div className="flex items-center gap-[12px]">
                  <img
                    src={member.portraitId ? (getPortraitByManifestId(member.portraitId) || getFallbackPortrait(member.gender || 'male')) : (getStaffPortrait(member.id) || getRandomStaffPortraitByRole(member.role))}
                    alt={member.name}
                    className="w-[36px] h-[36px] rounded-full object-cover bg-gray-200"
                  />
                  <div>
                    <p className="text-[13px] text-[#0a0a0a]" style={FBold}>{member.name}</p>
                    <p className="text-[11px] text-[#4a5565] capitalize" style={FR}>{member.role}</p>
                  </div>
                </div>
                <button onClick={() => onRemove(member.id)} className="h-[28px] px-[10px] border-[0.8px] border-black/20 rounded-[8px] text-[11px] text-[#4a5565] hover:bg-red-50 hover:text-[#ef4444] hover:border-red-200 transition-colors" style={FBold}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
            <Users className="w-[32px] h-[32px] mx-auto mb-[8px] text-[#4a5565] opacity-50" />
            <p className="text-[13px] text-[#4a5565]" style={FR}>No staff assigned to this facility</p>
          </div>
        )}
      </div>

      {/* Ideal Role */}
      <div className="p-[12px] bg-blue-50 border-[0.8px] border-blue-200 rounded-[12px]">
        <p className="text-[13px] text-[#2563eb]" style={FR}><strong style={FBold}>Ideal Role:</strong> {staffRole.title}</p>
        <p className="text-[11px] text-[#4a5565] mt-[4px]" style={FR}>Key skills: {staffRole.skillsRequired.join(', ')}</p>
      </div>

      {/* Available Staff */}
      {slotsAvailable > 0 && (
        <div>
          <h4 className="text-[13px] text-[#0a0a0a] mb-[12px]" style={FBold}>
            Available Staff ({slotsAvailable} slot{slotsAvailable !== 1 ? 's' : ''} available)
          </h4>
          {unassignedStaff.length > 0 ? (
            <div className="space-y-[8px] max-h-[240px] overflow-y-auto">
              {unassignedStaff.map(member => {
                const relevantSkills = staffRole.skillsRequired.filter(skill => member.skills && (member.skills as any)[skill] !== undefined)
                const avgSkill = relevantSkills.length > 0 ? relevantSkills.reduce((sum, skill) => sum + ((member.skills as any)?.[skill] || 50), 0) / relevantSkills.length : 50
                return (
                  <div key={member.id} className="flex items-center justify-between p-[12px] bg-[#f9fafb] rounded-[12px]">
                    <div className="flex items-center gap-[12px] flex-1">
                      <img
                        src={member.portraitId ? (getPortraitByManifestId(member.portraitId) || getFallbackPortrait(member.gender || 'male')) : (getStaffPortrait(member.id) || getRandomStaffPortraitByRole(member.role))}
                        alt={member.name}
                        className="w-[36px] h-[36px] rounded-full object-cover bg-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-[13px] text-[#0a0a0a]" style={FBold}>{member.name}</p>
                        <div className="flex items-center gap-[8px] text-[11px] text-[#4a5565]" style={FR}>
                          <span className="capitalize">{member.role}</span>
                          <span>·</span>
                          <span className={avgSkill >= 70 ? 'text-[#00a63e]' : avgSkill >= 50 ? 'text-[#f59e0b]' : 'text-[#4a5565]'}>
                            Skill Match: {Math.round(avgSkill)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onAssign(member.id, facilityType)} className="h-[28px] px-[10px] bg-black text-white rounded-[8px] text-[11px] hover:bg-black/90 transition-colors" style={FBold}>
                      Assign
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-[16px] bg-[#f9fafb] rounded-[12px] text-center">
              <p className="text-[13px] text-[#4a5565]" style={FR}>No unassigned staff available</p>
              <p className="text-[11px] text-[#4a5565] mt-[4px] mb-[12px]" style={FR}>Hire more staff or remove assignments from other facilities</p>
              <Link to="/staff-market">
                <button className="h-[32px] px-[16px] border-[0.8px] border-black/20 rounded-[12px] text-[12px] text-[#0a0a0a] hover:bg-[#f9fafb] transition-colors" style={FBold}>
                  Browse Staff Market
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {slotsAvailable === 0 && unassignedStaff.length > 0 && (
        <div className="p-[12px] bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/30 rounded-[12px]">
          <p className="text-[13px] text-[#f59e0b]" style={FR}>All staff slots are filled. Upgrade the facility to unlock more slots.</p>
        </div>
      )}
    </div>
  )
}
