import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion';
import { Wind, Car, Gauge, Monitor, Factory, Megaphone, Building2, Users, DollarSign, TrendingUp, Star, Lock, ChevronRight, Plus, ArrowUpDown, Settings, Wrench, Zap, CheckCircle, AlertTriangle, Clock, Award } from 'lucide-react'
import { Card, CardHeader, Badge, Button, Progress } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import type { FacilityType } from '@/data/facility-config'

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Gauge: <Gauge className="w-5 h-5" />,
  Monitor: <Monitor className="w-5 h-5" />,
  Factory: <Factory className="w-5 h-5" />,
  Megaphone: <Megaphone className="w-5 h-5" />
}

// Level colors
const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  2: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  3: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  4: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  5: { bg: 'bg-accent-gold/20', text: 'text-accent-gold', border: 'border-accent-gold/30' }
}

export function Facilities() {
  const { 
    careerState,
    upgradeFacility,
    assignFacilityStaffToFacility,
    unassignFacilityStaffFromFacility,
    consumeHoursFromBudget,
    addPersonalCalendarEntry
  } = useCareerStore()
  const { addToast } = useToast()
  
  const [selectedFacility, setSelectedFacility] = useState<FacilityType | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)

  if (!careerState?.ownedTeam) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Team Owned</h2>
          <p className="text-text-muted">You need to own a team to manage facilities.</p>
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

  // Helper to normalize facility data (handles legacy format where facility was just a number)
  const normalizeFacility = (facility: any): { level: number; upgradeInProgress: boolean; upgradeCompletionWeek?: number; upgradeCompletionYear?: number; assignedStaff: string[] } => {
    if (typeof facility === 'number') {
      return { level: facility, upgradeInProgress: false, assignedStaff: [] }
    }
    return {
      level: facility?.level ?? 1,
      upgradeInProgress: facility?.upgradeInProgress ?? false,
      upgradeCompletionWeek: facility?.upgradeCompletionWeek,
      upgradeCompletionYear: facility?.upgradeCompletionYear,
      assignedStaff: facility?.assignedStaff ?? []
    }
  }

  // Helper to calculate weeks remaining for an upgrade
  const calculateWeeksRemaining = (facilityState: any) => {
    const normalized = normalizeFacility(facilityState)
    if (!normalized.upgradeInProgress || !normalized.upgradeCompletionWeek || !normalized.upgradeCompletionYear) {
      return 0
    }
    
    // Calculate total weeks from year 0 for both dates
    const currentTotalWeeks = (currentYear * 52) + currentWeek
    const completionTotalWeeks = (normalized.upgradeCompletionYear * 52) + normalized.upgradeCompletionWeek
    
    return Math.max(0, completionTotalWeeks - currentTotalWeeks)
  }

  // Calculate total weekly costs
  const totalWeeklyCost = useMemo(() => {
    if (!facilities) return 0
    let total = 0
    FACILITY_TYPES.forEach(type => {
      const level = facilities[type]?.level || 1
      total += calculateFacilityWeeklyCost(tier, level)
    })
    return total
  }, [facilities, tier])

  // Calculate R&D bonuses
  const rdBonuses = useMemo(() => {
    if (!facilities) return { aerodynamics: 0, chassis: 0, powertrain: 0, electronics: 0 }
    
    const facilityLevels: Record<FacilityType, number> = {
      aero: facilities.aero?.level || 1,
      chassis: facilities.chassis?.level || 1,
      engine: facilities.engine?.level || 1,
      sim: facilities.sim?.level || 1,
      manufacturing: facilities.manufacturing?.level || 1,
      marketing: facilities.marketing?.level || 1
    }
    
    return {
      aerodynamics: getCombinedRdBonus('aerodynamics', facilityLevels) - 1,
      chassis: getCombinedRdBonus('chassis', facilityLevels) - 1,
      powertrain: getCombinedRdBonus('powertrain', facilityLevels) - 1,
      electronics: getCombinedRdBonus('electronics', facilityLevels) - 1
    }
  }, [facilities])

  // Check for upgrades in progress
  const upgradesInProgress = useMemo(() => {
    if (!facilities) return []
    return FACILITY_TYPES.filter(type => facilities[type]?.upgradeInProgress)
  }, [facilities])

  // Handle upgrade start
  const handleStartUpgrade = (facilityType: FacilityType) => {
    const result = upgradeFacility(facilityType)
    if (result.success) {
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
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
      
      addToast({
        type: 'success',
        title: 'Upgrade Started',
        message: `${FACILITY_NAMES[facilityType]} upgrade has begun. It will complete in ${result.duration} weeks.`,
        duration: 4000
      })
      setShowUpgradeModal(false)
    } else {
      addToast({
        type: 'error',
        title: 'Upgrade Failed',
        message: result.error || 'Unable to start upgrade',
        duration: 4000
      })
    }
  }

  // Handle staff assignment
  const handleAssignStaff = (staffId: string, facilityType: FacilityType) => {
    const result = assignFacilityStaffToFacility(staffId, facilityType)
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Staff Assigned',
        message: `Staff member assigned to ${FACILITY_NAMES[facilityType]}`,
        duration: 3000
      })
    }
  }

  // Handle staff removal
  const handleRemoveStaff = (staffId: string) => {
    unassignFacilityStaffFromFacility(staffId)
    addToast({
      type: 'info',
      title: 'Staff Unassigned',
      message: 'Staff member removed from facility',
      duration: 3000
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities Management"
        subtitle={`${team.name} - Upgrade and manage your team's facilities`}
        icon={<Building2 className="w-6 h-6" />}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-info/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-status-info" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Weekly Costs</p>
              <p className="font-mono font-bold text-lg text-status-danger">
                {formatCurrency(totalWeeklyCost)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Avg R&D Bonus</p>
              <p className="font-mono font-bold text-lg text-status-success">
                +{Math.round((Object.values(rdBonuses).reduce((a, b) => a + b, 0) / 4) * 100)}%
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Upgrades Active</p>
              <p className="font-mono font-bold text-lg">
                {upgradesInProgress.length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Facility Staff</p>
                <p className="font-mono font-bold text-lg">
                  {staff.filter(s => s.assignedFacility).length} / {staff.length}
                </p>
              </div>
            </div>
            <Link to="/staff-market">
              <Button variant="secondary" size="sm">
                Hire Staff
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* R&D Bonus Summary */}
      <Card variant="racing" padding="lg">
        <CardHeader 
          title="R&D Development Bonuses" 
          subtitle="Current bonuses from facility levels applied to car development"
        />
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(rdBonuses).map(([area, bonus]) => (
            <div 
              key={area}
              className="p-4 bg-background/50 rounded-xl border border-surface-border"
            >
              <p className="text-sm text-text-muted capitalize mb-1">{area}</p>
              <p className={`font-mono font-bold text-2xl ${bonus > 0 ? 'text-status-success' : 'text-text-muted'}`}>
                +{Math.round(bonus * 100)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                Development speed
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Facilities Grid */}
      <div className="grid grid-cols-3 gap-6">
        {FACILITY_TYPES.map((facilityType, index) => {
          const rawFacilityState = facilities?.[facilityType]
          const facilityState = normalizeFacility(rawFacilityState)
          const level = facilityState.level
          const levelConfig = getFacilityLevelConfig(level)
          const summary = getFacilitySummary(facilityType, level, tier)
          const isUpgrading = facilityState.upgradeInProgress
          const upgradeWeeksLeft = calculateWeeksRemaining(rawFacilityState)
          const assignedStaff = staff.filter(s => s.assignedFacility === facilityType)
          const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS[1]
          
          // Check if can upgrade
          const facilityLevels: Record<FacilityType, number> = {
            aero: facilities?.aero?.level || 1,
            chassis: facilities?.chassis?.level || 1,
            engine: facilities?.engine?.level || 1,
            sim: facilities?.sim?.level || 1,
            manufacturing: facilities?.manufacturing?.level || 1,
            marketing: facilities?.marketing?.level || 1
          }
          const upgradeCheck = canUpgradeFacility(
            facilityType,
            level,
            team.reputation || 50,
            tier,
            facilityLevels
          )
          const canAfford = (team.budgets?.cash || 0) >= summary.upgradeCost
          
          return (
            <motion.div
              key={facilityType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                variant="glass" 
                padding="lg"
                className={`cursor-pointer transition-all hover:border-accent-blue/50 ${
                  isUpgrading ? 'border-accent-gold/50' : ''
                }`}
                onClick={() => {
                  setSelectedFacility(facilityType)
                  setShowUpgradeModal(true)
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${levelColor.bg} flex items-center justify-center ${levelColor.text}`}>
                      {FACILITY_ICON_COMPONENTS[FACILITY_ICONS[facilityType]]}
                    </div>
                    <div>
                      <h3 className="font-bold">{FACILITY_NAMES[facilityType]}</h3>
                      <p className="text-xs text-text-muted">{levelConfig.name}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={level === 5 ? 'yellow' : level >= 3 ? 'purple' : 'default'}
                    size="sm"
                  >
                    Level {level}
                  </Badge>
                </div>

                {/* Upgrade Progress */}
                {isUpgrading && (
                  <div className="mb-4 p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-accent-gold flex items-center gap-2">
                        <Wrench className="w-4 h-4 animate-pulse" />
                        Upgrading to Level {level + 1}
                      </span>
                      <span className="text-sm font-mono">{upgradeWeeksLeft} weeks left</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-accent-gold rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - (upgradeWeeksLeft / (summary.upgradeDuration || 1) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-xs text-text-muted">R&D Bonus</p>
                    <p className="font-mono font-bold text-status-success">
                      +{Math.round((levelConfig.rdBonus - 1) * 100)}%
                    </p>
                  </div>
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-xs text-text-muted">Weekly Cost</p>
                    <p className="font-mono font-bold text-status-danger">
                      {formatCurrency(summary.weeklyCost)}
                    </p>
                  </div>
                </div>

                {/* Staff Slots */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">Staff ({assignedStaff.length}/{levelConfig.staffSlots})</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFacility(facilityType)
                        setShowStaffModal(true)
                      }}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: levelConfig.staffSlots }).map((_, i) => (
                      <div 
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < assignedStaff.length 
                            ? 'bg-status-success' 
                            : 'bg-surface-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Upgrade Button */}
                {!isUpgrading && level < MAX_FACILITY_LEVEL && (
                  <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                    <div>
                      <p className="text-xs text-text-muted">Upgrade Cost</p>
                      <p className={`font-mono font-bold ${canAfford ? 'text-white' : 'text-status-danger'}`}>
                        {formatCurrency(summary.upgradeCost)}
                      </p>
                    </div>
                    <Button 
                      variant={upgradeCheck.allowed && canAfford ? 'primary' : 'ghost'}
                      size="sm"
                      disabled={!upgradeCheck.allowed || !canAfford}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFacility(facilityType)
                        setShowUpgradeModal(true)
                      }}
                    >
                      {!upgradeCheck.allowed ? (
                        <><Lock className="w-3 h-3 mr-1" /> Locked</>
                      ) : !canAfford ? (
                        <><DollarSign className="w-3 h-3 mr-1" /> Can't Afford</>
                      ) : (
                        <><ArrowUpRight className="w-3 h-3 mr-1" /> Upgrade</>
                      )}
                    </Button>
                  </div>
                )}

                {level === MAX_FACILITY_LEVEL && (
                  <div className="pt-3 border-t border-surface-border text-center">
                    <Badge variant="yellow" size="sm">
                      <Star className="w-3 h-3 mr-1" />
                      Maximum Level
                    </Badge>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Upgrade Detail Modal */}
      <Modal
        isOpen={showUpgradeModal && selectedFacility !== null}
        onClose={() => {
          setShowUpgradeModal(false)
          setSelectedFacility(null)
        }}
        title={`${selectedFacility ? FACILITY_NAMES[selectedFacility] : ''} Details`}
        size="lg"
      >
        {selectedFacility && (
          <FacilityDetailPanel
            facilityType={selectedFacility}
            team={team}
            tier={tier}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onUpgrade={() => handleStartUpgrade(selectedFacility)}
          />
        )}
      </Modal>

      {/* Staff Assignment Modal */}
      <Modal
        isOpen={showStaffModal && selectedFacility !== null}
        onClose={() => {
          setShowStaffModal(false)
          setSelectedFacility(null)
        }}
        title={`Assign Staff to ${selectedFacility ? FACILITY_NAMES[selectedFacility] : ''}`}
        size="md"
      >
        {selectedFacility && (
          <StaffAssignmentPanel
            facilityType={selectedFacility}
            staff={staff}
            facilities={facilities}
            onAssign={handleAssignStaff}
            onRemove={handleRemoveStaff}
          />
        )}
      </Modal>
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
}

function FacilityDetailPanel({ facilityType, team, tier, currentWeek, currentYear, onUpgrade }: FacilityDetailPanelProps) {
  if (!team) return null
  
  const facilities = team.facilities
  const facilityState = facilities?.[facilityType]
  const level = facilityState?.level || 1
  const levelConfig = getFacilityLevelConfig(level)
  const nextLevelConfig = level < MAX_FACILITY_LEVEL ? getFacilityLevelConfig(level + 1) : null
  const summary = getFacilitySummary(facilityType, level, tier)
  const isUpgrading = facilityState?.upgradeInProgress
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS[1]
  
  // Calculate weeks remaining for upgrade
  const upgradeWeeksRemaining = useMemo(() => {
    if (!facilityState?.upgradeInProgress || !facilityState.upgradeCompletionWeek || !facilityState.upgradeCompletionYear) {
      return 0
    }
    const currentTotalWeeks = (currentYear * 52) + currentWeek
    const completionTotalWeeks = (facilityState.upgradeCompletionYear * 52) + facilityState.upgradeCompletionWeek
    return Math.max(0, completionTotalWeeks - currentTotalWeeks)
  }, [facilityState, currentWeek, currentYear])
  
  // Check upgrade requirements
  const facilityLevels: Record<FacilityType, number> = {
    aero: facilities?.aero?.level || 1,
    chassis: facilities?.chassis?.level || 1,
    engine: facilities?.engine?.level || 1,
    sim: facilities?.sim?.level || 1,
    manufacturing: facilities?.manufacturing?.level || 1,
    marketing: facilities?.marketing?.level || 1
  }
  const upgradeCheck = canUpgradeFacility(
    facilityType,
    level,
    team.reputation || 50,
    tier,
    facilityLevels
  )
  const canAfford = (team.budgets?.cash || 0) >= summary.upgradeCost

  // Get related R&D areas
  const rdAreas = FACILITY_RD_MAPPING[facilityType]
  const staffRole = FACILITY_STAFF_ROLES[facilityType]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <div className={`w-16 h-16 rounded-xl ${levelColor.bg} flex items-center justify-center ${levelColor.text}`}>
          {FACILITY_ICON_COMPONENTS[FACILITY_ICONS[facilityType]]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-bold text-xl">{FACILITY_NAMES[facilityType]}</h3>
            <Badge variant={level === 5 ? 'yellow' : level >= 3 ? 'purple' : 'default'}>
              Level {level} - {levelConfig.name}
            </Badge>
          </div>
          <p className="text-text-muted text-sm">{FACILITY_DESCRIPTIONS[facilityType]}</p>
        </div>
      </div>

      {/* Current Level Stats */}
      <div>
        <h4 className="text-sm font-medium text-text-muted mb-3">Current Performance</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">R&D Bonus</p>
            <p className="font-mono font-bold text-2xl text-status-success">
              +{Math.round((levelConfig.rdBonus - 1) * 100)}%
            </p>
          </div>
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">Staff Capacity</p>
            <p className="font-mono font-bold text-2xl">
              {levelConfig.staffSlots}
            </p>
          </div>
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">Weekly Cost</p>
            <p className="font-mono font-bold text-2xl text-status-danger">
              {formatCurrency(summary.weeklyCost)}
            </p>
          </div>
        </div>
      </div>

      {/* R&D Impact */}
      {rdAreas.length > 0 && (
        <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
          <h4 className="text-sm font-medium mb-2 text-status-success flex items-center gap-2">
            <Zap className="w-4 h-4" />
            R&D Development Areas Affected
          </h4>
          <div className="flex flex-wrap gap-2">
            {rdAreas.map(area => (
              <Badge key={area} variant="green" size="sm" className="capitalize">
                {area}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            Higher facility levels increase development speed for these areas.
          </p>
        </div>
      )}

      {/* Special Bonuses */}
      {facilityType === 'manufacturing' && (
        <div className="p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-xl">
          <h4 className="text-sm font-medium mb-2 text-accent-blue flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Manufacturing Bonus
          </h4>
          <p className="text-sm">
            Upgrade completion time reduced by <span className="font-mono font-bold">
              {Math.round((1 - getManufacturingSpeedBonus(level)) * 100)}%
            </span>
          </p>
        </div>
      )}

      {facilityType === 'marketing' && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <h4 className="text-sm font-medium mb-2 text-purple-400 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Marketing Bonus
          </h4>
          <p className="text-sm">
            Sponsor interest increased by <span className="font-mono font-bold">
              +{Math.round((getMarketingBonus(level) - 1) * 100)}%
            </span>
          </p>
        </div>
      )}

      {/* Staff Role Info */}
      <div className="p-4 bg-surface border border-surface-border rounded-xl">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Ideal Staff: {staffRole.title}
        </h4>
        <p className="text-sm text-text-muted mb-2">{staffRole.description}</p>
        <div className="flex gap-2">
          <span className="text-xs text-text-muted">Key Skills:</span>
          {staffRole.skillsRequired.map(skill => (
            <Badge key={skill} variant="outline" size="sm" className="text-xs capitalize">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Upgrade Section */}
      {!isUpgrading && level < MAX_FACILITY_LEVEL && nextLevelConfig && (
        <>
          <div className="border-t border-surface-border pt-6">
            <h4 className="text-sm font-medium text-text-muted mb-3">Upgrade to Level {level + 1}</h4>
            
            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-background rounded-xl">
                <p className="text-xs text-text-muted mb-2">Current (Level {level})</p>
                <div className="space-y-1 text-sm">
                  <p>R&D Bonus: <span className="font-mono">+{Math.round((levelConfig.rdBonus - 1) * 100)}%</span></p>
                  <p>Staff Slots: <span className="font-mono">{levelConfig.staffSlots}</span></p>
                  <p>Weekly Cost: <span className="font-mono text-status-danger">{formatCurrency(summary.weeklyCost)}</span></p>
                </div>
              </div>
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
                <p className="text-xs text-status-success mb-2">After Upgrade (Level {level + 1})</p>
                <div className="space-y-1 text-sm">
                  <p>R&D Bonus: <span className="font-mono text-status-success">+{Math.round((nextLevelConfig.rdBonus - 1) * 100)}%</span></p>
                  <p>Staff Slots: <span className="font-mono">{nextLevelConfig.staffSlots}</span></p>
                  <p>Weekly Cost: <span className="font-mono text-status-danger">{formatCurrency(calculateFacilityWeeklyCost(tier, level + 1))}</span></p>
                </div>
              </div>
            </div>

            {/* Upgrade Cost & Duration */}
            <div className="flex items-center gap-4 p-4 bg-background rounded-xl mb-4">
              <div className="flex-1">
                <p className="text-sm text-text-muted">Upgrade Cost</p>
                <p className={`font-mono font-bold text-xl ${canAfford ? 'text-white' : 'text-status-danger'}`}>
                  {formatCurrency(summary.upgradeCost)}
                </p>
                {!canAfford && (
                  <p className="text-xs text-status-danger">
                    Insufficient funds (have: {formatCurrency(team.budgets?.cash || 0)})
                  </p>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted">Duration</p>
                <p className="font-mono font-bold text-xl">
                  {summary.upgradeDuration} weeks
                </p>
              </div>
            </div>

            {/* Requirement Warning */}
            {!upgradeCheck.allowed && (
              <div className="flex items-start gap-3 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-status-warning mt-0.5" />
                <p className="text-sm text-status-warning">
                  {upgradeCheck.reason}
                </p>
              </div>
            )}

            {/* Upgrade Button */}
            <Button
              variant="primary"
              className="w-full"
              disabled={!upgradeCheck.allowed || !canAfford}
              onClick={onUpgrade}
            >
              {!upgradeCheck.allowed ? (
                <><Lock className="w-4 h-4 mr-2" /> Requirements Not Met</>
              ) : !canAfford ? (
                <><DollarSign className="w-4 h-4 mr-2" /> Insufficient Funds</>
              ) : (
                <><ArrowUpRight className="w-4 h-4 mr-2" /> Start Upgrade</>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Upgrade In Progress */}
      {isUpgrading && (
        <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Wrench className="w-5 h-5 text-accent-gold animate-pulse" />
            <div>
              <p className="font-medium text-accent-gold">Upgrade In Progress</p>
              <p className="text-sm text-text-muted">
                {upgradeWeeksRemaining} weeks remaining
              </p>
            </div>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${100 - (upgradeWeeksRemaining / summary.upgradeDuration * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Max Level */}
      {level === MAX_FACILITY_LEVEL && (
        <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-xl text-center">
          <Star className="w-8 h-8 text-accent-gold mx-auto mb-2" />
          <p className="font-bold text-accent-gold">Maximum Level Reached</p>
          <p className="text-sm text-text-muted">This facility is operating at peak performance.</p>
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
  const levelConfig = getFacilityLevelConfig(level)
  const staffRole = FACILITY_STAFF_ROLES[facilityType]
  
  const assignedStaff = staff?.filter(s => s.assignedFacility === facilityType) || []
  const unassignedStaff = staff?.filter(s => !s.assignedFacility) || []
  const slotsAvailable = levelConfig.staffSlots - assignedStaff.length

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Currently Assigned ({assignedStaff.length}/{levelConfig.staffSlots})
        </h4>
        
        {assignedStaff.length > 0 ? (
          <div className="space-y-2">
            {assignedStaff.map(member => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 bg-surface rounded-lg"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-text-muted capitalize">{member.role}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRemove(member.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-background rounded-lg text-center text-text-muted">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No staff assigned to this facility</p>
          </div>
        )}
      </div>

      {/* Ideal Role */}
      <div className="p-3 bg-status-info/10 border border-status-info/30 rounded-lg">
        <p className="text-sm text-status-info">
          <strong>Ideal Role:</strong> {staffRole.title}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Key skills: {staffRole.skillsRequired.join(', ')}
        </p>
      </div>

      {/* Available Staff */}
      {slotsAvailable > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">
            Available Staff ({slotsAvailable} slot{slotsAvailable !== 1 ? 's' : ''} available)
          </h4>
          
          {unassignedStaff.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedStaff.map(member => {
                // Calculate skill match
                const relevantSkills = staffRole.skillsRequired.filter(skill => 
                  member.skills && (member.skills as any)[skill] !== undefined
                )
                const avgSkill = relevantSkills.length > 0
                  ? relevantSkills.reduce((sum, skill) => sum + ((member.skills as any)?.[skill] || 50), 0) / relevantSkills.length
                  : 50
                
                return (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="capitalize">{member.role}</span>
                        <span>•</span>
                        <span className={avgSkill >= 70 ? 'text-status-success' : avgSkill >= 50 ? 'text-status-warning' : 'text-text-muted'}>
                          Skill Match: {Math.round(avgSkill)}%
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => onAssign(member.id, facilityType)}
                    >
                      Assign
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 bg-background rounded-lg text-center text-text-muted">
              <p>No unassigned staff available</p>
              <p className="text-xs mt-1 mb-3">Hire more staff or remove assignments from other facilities</p>
              <Link to="/staff-market">
                <Button variant="secondary" size="sm">
                  Browse Staff Market
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {slotsAvailable === 0 && unassignedStaff.length > 0 && (
        <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <p className="text-sm text-status-warning">
            All staff slots are filled. Upgrade the facility to unlock more slots.
          </p>
        </div>
      )}
    </div>
  )
}
