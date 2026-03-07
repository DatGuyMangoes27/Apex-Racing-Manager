import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, Heart, Brain, Dumbbell, Wind, Pill,
  Home, Car, Users, Coffee, Star, Sparkles,
  Plus, AlertTriangle, TrendingUp, TrendingDown, ArrowRight,
  Award, Crown, ChevronDown, ChevronUp, Zap, Shield,
  Gem, Utensils, PawPrint, GraduationCap,
  Plane, Shirt, Info
} from 'lucide-react'
import { 
  Card, 
  CardHeader, 
  Badge, 
  Button,
  Modal,
  StaffPortrait
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { getStaffPortrait, getRandomStaffPortraitByRole, getLifestyleImage, getVehicleImage, getPetImage, getLifestyleImageId } from '@/utils/generated-assets'
import type {
  OwnerHealth,
  Hobby,
  PersonalStaff,
  LifestyleLevel,
  StaffRole,
  HobbyType
} from '@/data/lifestyle-config';
import { useCareerStore } from '@/store/careerStore'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'
import type { PersonalFinancialState } from '@/data/personal-finance-config'
import type { LifestyleAssets, OwnedVehicle, Membership, PetType } from '@/data/lifestyle-assets-config'
import type { Course } from '@/data/education-config'
import { 
  PET_ACTIVITY_CONFIG, 
  FITNESS_ACTIVITIES 
} from '@/data/lifestyle-activities-config'
import { 
  HOBBY_TEMPLATES, 
  HOBBY_ACTIVITY_CONFIG, 
  STAFF_TEMPLATES 
} from '@/data/lifestyle-config'
import {
  getVehicleCatalog,
  getMembershipCatalog,
  getFurnishingCatalog,
  getServiceCatalog,
  getExperienceCatalog,
  getCollectibleCatalog,
  getPetCatalog,
  getWardrobeCatalog,
  getDietCatalog
} from '@/simulation/personal/lifestyleAssetsManager'
import { generatePropertyListings } from '@/simulation/investments/realEstateManager'
import { COURSE_CATALOG } from '@/data/education-config'
import { getLifestyleRecommendation } from '@/simulation/personal/lifestyleManager'
import { getAssetSummary, getTotalAssetValue, calculateLifestyleScore, processWeeklyLifestyleBonuses } from '@/simulation/personal/lifestyleAssetsManager'
import { LIFESTYLE_LEVEL_THRESHOLDS, LIFESTYLE_SCORE_WEIGHTS } from '@/data/lifestyle-assets-config'
import type { LifestyleScoreBreakdown } from '@/data/lifestyle-assets-config'

// ============================================
// TYPES
// ============================================

interface LifestylePanelProps {
  health: OwnerHealth
  lifestyleLevel: LifestyleLevel
  hobbies: Hobby[]
  staff: PersonalStaff[]
  finances: PersonalFinancialState
  currentWeek: number
  currentYear: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LifestylePanel({
  health,
  lifestyleLevel,
  hobbies,
  staff,
  finances,
  currentWeek,
  currentYear
}: LifestylePanelProps) {
  const { careerState } = useCareerStore()
  const { addToast } = useToast()
  
  // Modal state
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showFurnishingModal, setShowFurnishingModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCollectibleModal, setShowCollectibleModal] = useState(false)
  const [showPetModal, setShowPetModal] = useState(false)
  const [showWardrobeModal, setShowWardrobeModal] = useState(false)
  const [showDietModal, setShowDietModal] = useState(false)
  const [showExperienceModal, setShowExperienceModal] = useState(false)
  const [showHobbyModal, setShowHobbyModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showHealthcareModal, setShowHealthcareModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  
  // Property browse state
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number | null>(null)
  const [showMortgageCalc, setShowMortgageCalc] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [propertyCountryFilter, setPropertyCountryFilter] = useState<string>('all')
  const [mortgageDownPercent, setMortgageDownPercent] = useState(20)
  const [mortgageTermYears, setMortgageTermYears] = useState(25)
  
  // Sell confirmation modal state
  const [pendingSale, setPendingSale] = useState<{
    type: string
    id: string
    name: string
    purchasePrice: number
    currentValue: number
    resaleMultiplier: number
    estimatedProceeds: number
    feeLabel: string
    sellFn: () => { success: boolean; message: string; proceeds?: number }
  } | null>(null)
  
  // Personal life actions
  const {
    sellOwnedVehicle,
    setAsPrimaryVehicle,
    cancelClubMembership,
    sellOwnedFurnishing,
    cancelServiceSubscription,
    sellOwnedCollectible,
    practiceHobby,
    fireStaff,
    studyCourse,
    spendTimeWithPet,
    rehomeOwnedPet,
    sellOwnedWardrobeItem,
    cancelDietPlan,
    doWorkout,
    startHobby,
    hireStaff,
    upgradeHealthcare,
    buyVehicle,
    joinClubMembership,
    buyFurnishing,
    subscribeToService,
    bookLuxuryExperience,
    buyCollectible,
    adoptNewPet,
    buyWardrobeItem,
    subscribeToDiet,
    buyProperty,
    sellOwnedProperty,
    enrollInCourse,
    getAvailableVehicles,
    getAvailableMemberships,
    getAvailableFurnishings,
    getAvailableServices,
    getAvailableExperiences,
    getAvailableCollectibles,
    getAvailablePets,
    getAvailableWardrobe,
    getAvailableDiets,
    getCourseCatalog
  } = usePersonalLifeActions()
  
  // Get assets from personalLife state (need to access from careerState)
  const assets: LifestyleAssets & { properties?: any[] } = useMemo(() => {
    const personalLife = careerState?.personalLife
    const baseAssets = personalLife?.lifestyleAssets || personalLife?.assets || {
      vehicles: [],
      furnishings: [],
      memberships: [],
      services: [],
      experiences: [],
      collectibles: [],
      pets: [],
      wardrobe: [],
      dietPlan: null
    }
    // Add properties if they exist in personalLife
    return {
      ...baseAssets,
      properties: (personalLife as any)?.properties || []
    }
  }, [careerState?.personalLife])
  
  // Get hours remaining from day budget
  const hoursRemaining = careerState?.dayBudget?.hoursRemaining ?? 16
  
  // Get active courses from education state
  const activeCourses: Course[] = useMemo(() => {
    const personalLife = careerState?.personalLife
    return (personalLife as any)?.education?.enrolledCourses || []
  }, [careerState?.personalLife])
  
  // Catalogs
  const vehicleCatalog = useMemo(() => getAvailableVehicles(), [])
  const membershipCatalog = useMemo(() => getAvailableMemberships(), [])
  const furnishingCatalog = useMemo(() => getAvailableFurnishings(), [])
  const serviceCatalog = useMemo(() => getAvailableServices(), [])
  const experienceCatalog = useMemo(() => getAvailableExperiences(), [])
  const collectibleCatalog = useMemo(() => getAvailableCollectibles(), [])
  const petCatalog = useMemo(() => getAvailablePets(), [])
  const wardrobeCatalog = useMemo(() => getAvailableWardrobe(), [])
  const dietCatalog = useMemo(() => getAvailableDiets(), [])
  const propertyCatalog = useMemo(() => {
    // Compute directly from finances prop to avoid stale closure from hook
    const budgetMin = 50000
    const budgetMax = Math.max((finances?.liquidCash ?? 0) * 5, 5000000)
    return generatePropertyListings(40, budgetMin, budgetMax)
  }, [Math.floor((finances?.liquidCash ?? 0) / 500000)])
  const courseCatalog = useMemo(() => getCourseCatalog(), [])
  
  // Computed values (using centralized asset summary)
  const assetSummary = useMemo(() => getAssetSummary(assets), [assets])
  const totalAssetValue = useMemo(() => getTotalAssetValue(assets), [assets])
  
  const totalVehicleValue = assetSummary.vehicleValue
  const totalFurnishingValue = assetSummary.furnishingValue
  const monthlyMembershipCost = assetSummary.annualMembershipFees / 12
  
  const monthlyServiceCost = useMemo(() => 
    (assets.services || []).reduce((sum, s) => sum + s.monthlyFee, 0),
    [assets.services]
  )
  
  const totalCollectibleValue = assetSummary.collectibleValue
  
  const monthlyHobbyCost = useMemo(() => 
    hobbies.reduce((sum, h) => sum + (h.currentMonthlyCost || 0), 0),
    [hobbies]
  )
  
  const monthlyStaffCost = useMemo(() => 
    staff.reduce((sum, s) => sum + s.salary, 0),
    [staff]
  )
  
  const monthlyPetCost = useMemo(() => 
    (assets.pets || []).reduce((sum, p) => sum + p.monthlyUpkeep, 0),
    [assets.pets]
  )
  
  const totalWardrobeValue = useMemo(() => 
    (assets.wardrobe || []).reduce((sum, w) => sum + w.currentValue, 0),
    [assets.wardrobe]
  )
  
  return (
    <div className="space-y-6">
      {/* Health Metrics + Mental & Workouts at top */}
      <div className="grid grid-cols-4 gap-4">
        <HealthMetric icon={<Heart className="w-5 h-5" />} label="Health" value={health.physicalHealth} color="red" />
        <HealthMetric icon={<Brain className="w-5 h-5" />} label="Mental" value={health.mentalHealth} color="purple" />
        <HealthMetric icon={<Dumbbell className="w-5 h-5" />} label="Fitness" value={health.fitness} color="blue" />
        <HealthMetric icon={<Wind className="w-5 h-5" />} label="Stress" value={health.stressLevel ?? health.stress ?? 0} color="orange" inverted />
      </div>

      {/* Workouts – horizontal layout at top */}
      <Card variant="glass" padding="md">
        <div className="flex items-center gap-1.5 mb-3">
          <Dumbbell className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="font-medium text-sm">Workouts</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {FITNESS_ACTIVITIES.map((activity) => {
            const canDo = hoursRemaining >= activity.hoursRequired
            return (
              <div key={activity.id} className="p-3 bg-background rounded-lg min-w-[140px] max-w-[180px] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs">{activity.name}</span>
                  <Badge variant="outline" size="xs" className="text-[9px]">{activity.hoursRequired}h</Badge>
                </div>
                <p className="text-[10px] text-text-muted mb-1.5 line-clamp-2">{activity.description}</p>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-text-muted mb-2">
                  {activity.benefits.fitnessBonus ? <span>+{activity.benefits.fitnessBonus} fit</span> : null}
                  {activity.benefits.stressReduction ? <span>-{activity.benefits.stressReduction} stress</span> : null}
                  {activity.benefits.healthBonus ? <span>+{activity.benefits.healthBonus} health</span> : null}
                </div>
                <button
                  className={`w-full mt-auto text-[10px] py-1.5 rounded transition-colors ${
                    canDo
                      ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                      : 'bg-surface text-text-muted cursor-not-allowed'
                  }`}
                  disabled={!canDo}
                  title={!canDo ? `Need ${activity.hoursRequired}h, only ${hoursRemaining.toFixed(1)}h left` : ''}
                  onClick={() => { const r = doWorkout(activity.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Workout' : 'Failed', message: r.message }) }}
                >
                  Start ({activity.hoursRequired}h)
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Lifestyle Score — Expanded Panel */}
      <LifestyleScorePanel
        careerState={careerState}
        lifestyleLevel={lifestyleLevel}
        staff={staff}
        hobbies={hobbies}
        health={health}
        finances={finances}
        assets={assets}
      />

      {/* Assets Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* ===== ROW 1: Properties, Vehicles, Memberships ===== */}
        
        {/* Properties */}
        <AssetSection
          icon={<Home className="w-4 h-4" />}
          title="Properties"
          count={(assets.properties || []).length}
          subtitle={`${(assets.properties || []).length} owned`}
          onAdd={() => setShowPropertyModal(true)}
        >
          {(assets.properties || []).length > 0 ? (assets.properties || []).map((prop, i) => (
            <CompactItemRow key={prop.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{prop.name || prop.type}</span>
                <Badge variant="outline" size="xs" className="text-[9px] capitalize">{prop.type}</Badge>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>${(prop.currentValue || prop.purchasePrice || 0).toLocaleString()}</span>
                <span>{prop.location}</span>
              </div>
              {!prop.isPlayerRental && (
                <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const value = prop.currentValue || prop.purchasePrice || 0
                    setPendingSale({ type: 'Property', id: prop.id, name: prop.name || `${prop.location} property`, purchasePrice: prop.purchasePrice || 0, currentValue: value, resaleMultiplier: 1.0, estimatedProceeds: value, feeLabel: 'Sold at market value (agent fees handled separately)', sellFn: () => sellOwnedProperty(prop.id) })
                  }}>
                  Sell ~${(prop.currentValue || prop.purchasePrice || 0).toLocaleString()}
                </button>
              )}
            </CompactItemRow>
          )) : <EmptySection icon={<Home className="w-8 h-8" />} label="No properties yet" actionLabel="Buy property" onAction={() => setShowPropertyModal(true)} />}
        </AssetSection>

        {/* Vehicles */}
        <AssetSection
          icon={<Car className="w-4 h-4" />}
          title="Vehicles"
          count={assets.vehicles.length}
          subtitle={`$${totalVehicleValue.toLocaleString()} value`}
          onAdd={() => setShowVehicleModal(true)}
        >
          {assets.vehicles.length > 0 ? assets.vehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={index}
              onSell={(id) => {
                const v = assets.vehicles.find(veh => veh.id === id)
                if (!v) return
                const mult = 0.85
                const proceeds = Math.round(v.currentValue * mult)
                setPendingSale({ type: 'Vehicle', id, name: `${v.brand} ${v.model}`, purchasePrice: v.purchasePrice, currentValue: v.currentValue, resaleMultiplier: mult, estimatedProceeds: proceeds, feeLabel: '15% dealer/broker fee', sellFn: () => sellOwnedVehicle(id) })
              }}
              onSetPrimary={(id) => { const r = setAsPrimaryVehicle(id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Set Primary' : 'Failed', message: r.message }) }}
            />
          )) : <EmptySection icon={<Car className="w-8 h-8" />} label="No vehicles" actionLabel="Browse" onAction={() => setShowVehicleModal(true)} />}
        </AssetSection>

        {/* Memberships */}
        <AssetSection
          icon={<Award className="w-4 h-4" />}
          title="Memberships"
          count={assets.memberships.length}
          subtitle={`$${monthlyMembershipCost.toLocaleString()}/mo`}
          onAdd={() => setShowMembershipModal(true)}
        >
          {assets.memberships.length > 0 ? assets.memberships.map((membership, index) => (
            <MembershipCard key={membership.id} membership={membership} index={index}
              onCancel={(id) => { const r = cancelClubMembership(id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Cancelled' : 'Failed', message: r.message }) }}
            />
          )) : <EmptySection icon={<Award className="w-8 h-8" />} label="No memberships" actionLabel="Browse" onAction={() => setShowMembershipModal(true)} />}
        </AssetSection>

        {/* ===== ROW 2: Furnishings, Services, Collectibles ===== */}
        
        {/* Furnishings */}
        <AssetSection
          icon={<Sparkles className="w-4 h-4" />}
          title="Furnishings"
          count={assets.furnishings.length}
          subtitle={`$${totalFurnishingValue.toLocaleString()} value`}
          onAdd={() => setShowFurnishingModal(true)}
        >
          {assets.furnishings.length > 0 ? assets.furnishings.map((f, i) => (
            <CompactItemRow key={f.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{f.name}</span>
                <Badge variant="outline" size="xs" className="text-[9px] capitalize">{f.tier}</Badge>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>${f.currentValue.toLocaleString()}</span>
                <span>+{f.comfortBonus} comfort</span>
              </div>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  const mult = 0.50
                  const proceeds = Math.round(f.currentValue * mult)
                  setPendingSale({ type: 'Furnishing', id: f.id, name: f.name, purchasePrice: f.purchasePrice, currentValue: f.currentValue, resaleMultiplier: mult, estimatedProceeds: proceeds, feeLabel: '50% resale for used furnishings', sellFn: () => sellOwnedFurnishing(f.id) })
                }}>
                Sell ~${Math.round(f.currentValue * 0.50).toLocaleString()}
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<Sparkles className="w-8 h-8" />} label="No furnishings" actionLabel="Shop" onAction={() => setShowFurnishingModal(true)} />}
        </AssetSection>

        {/* Luxury Services */}
        <AssetSection
          icon={<Star className="w-4 h-4" />}
          title="Services"
          count={(assets.services || []).length}
          subtitle={`$${monthlyServiceCost.toLocaleString()}/mo`}
          onAdd={() => setShowServiceModal(true)}
        >
          {(assets.services || []).length > 0 ? (assets.services || []).map((s, i) => (
            <CompactItemRow key={s.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{s.name}</span>
                <Badge variant="outline" size="xs" className="text-[9px] capitalize">{s.tier}</Badge>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>${s.monthlyFee.toLocaleString()}/mo</span>
                <span>-{s.stressReduction} stress</span>
              </div>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { const r = cancelServiceSubscription(s.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Cancelled' : 'Failed', message: r.message }) }}>
                Cancel
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<Star className="w-8 h-8" />} label="No services" actionLabel="Browse" onAction={() => setShowServiceModal(true)} />}
        </AssetSection>

        {/* Collectibles */}
        <AssetSection
          icon={<Gem className="w-4 h-4" />}
          title="Collectibles"
          count={(assets.collectibles || []).length}
          subtitle={`$${totalCollectibleValue.toLocaleString()} value`}
          onAdd={() => setShowCollectibleModal(true)}
        >
          {(assets.collectibles || []).length > 0 ? (assets.collectibles || []).map((c, i) => (
            <CompactItemRow key={c.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{c.name}</span>
                <Badge variant="outline" size="xs" className="text-[9px] capitalize">{c.rarity}</Badge>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mb-1">
                <span>${c.currentValue.toLocaleString()}</span>
                <span className={c.currentValue >= c.purchasePrice ? 'text-status-success' : 'text-status-danger'}>
                  {c.currentValue >= c.purchasePrice ? '+' : ''}{((c.currentValue - c.purchasePrice) / c.purchasePrice * 100).toFixed(1)}%
                </span>
              </div>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  const mult = 0.90
                  const proceeds = Math.round(c.currentValue * mult)
                  setPendingSale({ type: 'Collectible', id: c.id, name: c.name, purchasePrice: c.purchasePrice, currentValue: c.currentValue, resaleMultiplier: mult, estimatedProceeds: proceeds, feeLabel: '10% auction commission', sellFn: () => sellOwnedCollectible(c.id) })
                }}>
                Sell ~${Math.round(c.currentValue * 0.90).toLocaleString()}
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<Gem className="w-8 h-8" />} label="No collectibles" actionLabel="Browse" onAction={() => setShowCollectibleModal(true)} />}
        </AssetSection>

        {/* ===== ROW 3: Hobbies, Staff, Education ===== */}
        
        {/* Hobbies */}
        <AssetSection
          icon={<Coffee className="w-4 h-4" />}
          title="Hobbies"
          count={hobbies.length}
          subtitle={`$${monthlyHobbyCost.toLocaleString()}/mo`}
          onAdd={() => setShowHobbyModal(true)}
        >
          {hobbies.length > 0 ? hobbies.map((hobby, index) => (
            <HobbyCard key={hobby.type} hobby={hobby} index={index} hoursRemaining={hoursRemaining}
              onPractice={(h) => { const r = practiceHobby(h.type); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Practice' : 'Failed', message: r.success ? `${r.message} +${r.skillGain || 0}%` : r.message }) }}
            />
          )) : <EmptySection icon={<Coffee className="w-8 h-8" />} label="No hobbies" actionLabel="Start One" onAction={() => setShowHobbyModal(true)} />}
        </AssetSection>

        {/* Staff */}
        <AssetSection
          icon={<Users className="w-4 h-4" />}
          title="Staff"
          count={staff.length}
          subtitle={`$${monthlyStaffCost.toLocaleString()}/mo`}
          onAdd={() => setShowStaffModal(true)}
        >
          {staff.length > 0 ? staff.map((member, index) => (
            <StaffCard key={member.id} staff={member} index={index}
              onFire={(staffId) => { const r = fireStaff(staffId); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Dismissed' : 'Failed', message: r.message }) }}
            />
          )) : <EmptySection icon={<Users className="w-8 h-8" />} label="No staff" actionLabel="Hire" onAction={() => setShowStaffModal(true)} />}
        </AssetSection>

        {/* Education */}
        <AssetSection
          icon={<GraduationCap className="w-4 h-4" />}
          title="Education"
          count={activeCourses.length}
          subtitle={activeCourses.length > 0 ? `${activeCourses.length} active` : 'No courses'}
          onAdd={() => setShowCourseModal(true)}
        >
          {activeCourses.length > 0 ? activeCourses.map((c: any, i: number) => (
            <CompactItemRow key={c.id} index={i}>
              <span className="font-medium text-xs truncate">{c.name}</span>
              <div className="flex justify-between text-[10px] text-text-muted mb-1">
                <span>{c.provider}</span>
                <span>{c.modulesCompleted}/{c.totalModules} modules</span>
              </div>
              <div className="h-1 bg-surface rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-accent-blue" style={{ width: `${(c.modulesCompleted / c.totalModules) * 100}%` }} />
              </div>
              <button 
                className={`w-full text-[10px] py-1 rounded transition-colors ${
                  hoursRemaining >= 2 
                    ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20' 
                    : 'bg-surface text-text-muted cursor-not-allowed'
                }`}
                disabled={hoursRemaining < 2}
                title={hoursRemaining < 2 ? `Need 2h, only ${hoursRemaining.toFixed(1)}h left` : ''}
                onClick={() => { const r = studyCourse(c.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Study Session' : 'Failed', message: r.message }) }}>
                Study (2h)
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<GraduationCap className="w-8 h-8" />} label="No courses" actionLabel="Enroll" onAction={() => setShowCourseModal(true)} />}
        </AssetSection>

        {/* ===== ROW 4: Pets, Wardrobe, Diet ===== */}
        
        {/* Pets */}
        <AssetSection
          icon={<PawPrint className="w-4 h-4" />}
          title="Pets"
          count={(assets.pets || []).length}
          subtitle={`$${monthlyPetCost.toLocaleString()}/mo`}
          onAdd={() => setShowPetModal(true)}
        >
          {(assets.pets || []).length > 0 ? (assets.pets || []).map((pet, i) => {
            const petHours = PET_ACTIVITY_CONFIG[pet.type as PetType]?.hoursRequired ?? 1
            const canSpendTime = hoursRemaining >= petHours
            return (
            <CompactItemRow key={pet.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{pet.name}</span>
                <Badge variant="outline" size="xs" className="text-[9px]">{pet.breed}</Badge>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mb-1">
                <span>${pet.monthlyUpkeep.toLocaleString()}/mo</span>
                <span>-{pet.stressReduction} stress</span>
              </div>
              <button 
                className={`w-full text-[10px] py-1 rounded transition-colors mb-1 ${
                  canSpendTime 
                    ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20' 
                    : 'bg-surface text-text-muted cursor-not-allowed'
                }`}
                disabled={!canSpendTime}
                title={!canSpendTime ? `Need ${petHours}h, only ${hoursRemaining.toFixed(1)}h left` : ''}
                onClick={() => { const r = spendTimeWithPet(pet.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Time with Pet' : 'Failed', message: r.message }) }}>
                Spend Time ({petHours}h, -{pet.stressReduction} stress)
              </button>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { const r = rehomeOwnedPet(pet.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Rehomed' : 'Failed', message: r.message }) }}>
                Rehome
              </button>
            </CompactItemRow>
            )
          }) : <EmptySection icon={<PawPrint className="w-8 h-8" />} label="No pets" actionLabel="Adopt" onAction={() => setShowPetModal(true)} />}
        </AssetSection>

        {/* Wardrobe */}
        <AssetSection
          icon={<Shirt className="w-4 h-4" />}
          title="Wardrobe"
          count={(assets.wardrobe || []).length}
          subtitle={`$${totalWardrobeValue.toLocaleString()} value`}
          onAdd={() => setShowWardrobeModal(true)}
        >
          {(assets.wardrobe || []).length > 0 ? (assets.wardrobe || []).map((item, i) => (
            <CompactItemRow key={item.id} index={i}>
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-xs truncate">{item.name}</span>
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>{item.brand}</span>
                <span>+{item.prestigeBonus} prestige</span>
              </div>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  const mult = 0.30
                  const value = item.currentValue || item.purchasePrice || 0
                  const proceeds = Math.round(value * mult)
                  setPendingSale({ type: 'Wardrobe', id: item.id, name: `${item.brand} ${item.name}`, purchasePrice: item.purchasePrice || 0, currentValue: value, resaleMultiplier: mult, estimatedProceeds: proceeds, feeLabel: 'Used luxury resale value', sellFn: () => sellOwnedWardrobeItem(item.id) })
                }}>
                Sell ~${Math.round((item.currentValue || item.purchasePrice || 0) * 0.30).toLocaleString()}
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<Shirt className="w-8 h-8" />} label="No wardrobe" actionLabel="Shop" onAction={() => setShowWardrobeModal(true)} />}
        </AssetSection>

        {/* Diet & Nutrition + Experiences */}
        <Card variant="glass" padding="sm" className="flex flex-col">
          {/* Diet Section */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Utensils className="w-4 h-4 text-text-muted flex-shrink-0" />
              <span className="font-medium text-sm truncate">Diet</span>
              {assets.dietPlan && <Badge variant="green" size="xs">Active</Badge>}
            </div>
            <button className="text-accent-blue hover:text-accent-blue/80 flex-shrink-0"
              onClick={() => setShowDietModal(true)}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {assets.dietPlan ? (
            <div className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors mb-3">
              <span className="font-medium text-xs">{assets.dietPlan.name}</span>
              <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                <span>${assets.dietPlan.monthlyFee}/mo</span>
                <span>+{assets.dietPlan.healthBonus} health</span>
              </div>
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                onClick={() => { const r = cancelDietPlan(); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Cancelled' : 'Failed', message: r.message }) }}>
                Cancel Plan
              </button>
            </div>
          ) : (
            <div className="text-center py-3 mb-3">
              <p className="text-[10px] text-text-muted mb-1">No diet plan</p>
              <Button variant="ghost" size="xs" onClick={() => setShowDietModal(true)}>
                <Plus className="w-3 h-3 mr-1" />Choose Plan
              </Button>
            </div>
          )}
          
          {/* Experiences sub-section */}
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Plane className="w-4 h-4 text-text-muted flex-shrink-0" />
                <span className="font-medium text-sm truncate">Experiences</span>
                <Badge variant="outline" size="xs">{(assets.experiences || []).length}</Badge>
              </div>
              <button className="text-accent-blue hover:text-accent-blue/80 flex-shrink-0"
                onClick={() => setShowExperienceModal(true)}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {(assets.experiences || []).length > 0 ? (assets.experiences || []).map((exp, _i) => (
                <div key={exp.id} className="p-1.5 bg-background rounded text-[10px] text-text-muted">
                  <span className="font-medium text-xs text-text-primary">{exp.name}</span>
                  <div className="flex justify-between mt-0.5">
                    <span>${exp.cost.toLocaleString()}</span>
                    <span>{exp.completedWeek ? 'Completed' : exp.duration}</span>
                  </div>
                </div>
              )) : (
                <Button variant="ghost" size="xs" className="w-full" onClick={() => setShowExperienceModal(true)}>
                  <Plus className="w-3 h-3 mr-1" />Book Experience
                </Button>
              )}
            </div>
          </div>
        </Card>

      </div>

      {/* Hobby Selection Modal */}
      <Modal
        isOpen={showHobbyModal}
        onClose={() => setShowHobbyModal(false)}
        title="Start a New Hobby"
        size="full"
      >
        <HobbySelectionView 
          currentHobbies={hobbies}
          onClose={() => setShowHobbyModal(false)}
          onStartHobby={(type, _name) => {
            const result = startHobby(type)
            addToast({
              type: result.success ? 'success' : 'error',
              title: result.success ? 'New Hobby Started' : 'Failed',
              message: result.message
            })
            setShowHobbyModal(false)
          }}
        />
      </Modal>

      {/* Staff Hiring Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="Hire Personal Staff"
        size="full"
      >
        <StaffHiringView 
          currentStaff={staff}
          onClose={() => setShowStaffModal(false)}
          onHire={(role) => {
            const result = hireStaff(role as StaffRole)
            addToast({
              type: result.success ? 'success' : 'error',
              title: result.success ? 'Staff Hired' : 'Hiring Failed',
              message: result.message
            })
            setShowStaffModal(false)
          }}
        />
      </Modal>

      {/* Healthcare Upgrade Modal */}
      <Modal
        isOpen={showHealthcareModal}
        onClose={() => setShowHealthcareModal(false)}
        title="Upgrade Healthcare"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Better healthcare means better health outcomes and a longer life expectancy.
          </p>
          <div className="p-4 bg-surface rounded-lg">
            <p className="text-sm text-text-muted mb-2">Current Plan</p>
            <p className="font-medium capitalize">
              {health.healthcareLevel.replace('_', ' ')}
            </p>
            <p className="text-sm text-text-muted">
              ${health.annualHealthcareCost.toLocaleString()}/year
            </p>
          </div>
          <div className="space-y-3">
            {[
              { level: 'basic' as const, name: 'Basic Healthcare', cost: 5000, description: 'Standard coverage' },
              { level: 'standard' as const, name: 'Standard Healthcare', cost: 15000, description: 'Good coverage and access' },
              { level: 'premium' as const, name: 'Premium Healthcare', cost: 25000, description: 'Better coverage and faster access' },
              { level: 'executive' as const, name: 'Executive Healthcare', cost: 50000, description: '24/7 personal physician access' }
            ].filter(option => option.cost > health.annualHealthcareCost).map((option) => (
              <button
                key={option.level}
                className="w-full p-4 bg-surface hover:bg-surface/80 rounded-lg text-left transition-colors"
                onClick={() => {
                  const result = upgradeHealthcare(option.level)
                  addToast({
                    type: result.success ? 'success' : 'error',
                    title: result.success ? 'Healthcare Upgraded' : 'Upgrade Failed',
                    message: result.message
                  })
                  setShowHealthcareModal(false)
                }}
              >
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-text-muted">${option.cost.toLocaleString()}/year - {option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Vehicle Purchase Modal */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Showroom"
        size="full"
      >
        <VehicleSelectionView 
          catalog={vehicleCatalog}
          liquidCash={finances.liquidCash}
          onClose={() => setShowVehicleModal(false)}
          onPurchase={(index) => {
            const result = buyVehicle(index)
            addToast({
              type: result.success ? 'success' : 'error',
              title: result.success ? 'Vehicle Purchased' : 'Purchase Failed',
              message: result.message
            })
            if (result.success) {
              setShowVehicleModal(false)
            }
          }}
        />
      </Modal>

      {/* Membership Join Modal */}
      <Modal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        title="Join a Club"
        size="full"
      >
        <MembershipSelectionView 
          catalog={membershipCatalog}
          currentMemberships={assets.memberships}
          liquidCash={finances.liquidCash}
          netWorth={finances.cachedNetWorth || 0}
          onClose={() => setShowMembershipModal(false)}
          onJoin={(id, tier) => {
            const result = joinClubMembership(id, tier)
            addToast({
              type: result.success ? 'success' : 'error',
              title: result.success ? 'Membership Activated' : 'Join Failed',
              message: result.message
            })
            if (result.success) {
              setShowMembershipModal(false)
            }
          }}
        />
      </Modal>

      {/* Furnishing Purchase Modal */}
      <Modal isOpen={showFurnishingModal} onClose={() => setShowFurnishingModal(false)} title="Home Furnishings" size="full">
        <CatalogGrid
          items={furnishingCatalog.map((f, i) => ({ id: f.id, name: f.name, description: f.description, price: f.basePrice, tags: [f.category, f.tier], index: i, imageId: getLifestyleImageId('furnishings', f.id, { category: f.category, tier: f.tier }), imageCategory: 'furnishings' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = buyFurnishing(item.id, 'primary')
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Purchased' : 'Failed', message: r.message })
            if (r.success) setShowFurnishingModal(false)
          }}
          onClose={() => setShowFurnishingModal(false)}
        />
      </Modal>

      {/* Service Subscription Modal */}
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title="Luxury Services" size="full">
        <CatalogGrid
          items={serviceCatalog.map((s, i) => ({ id: s.id, name: s.name, description: s.description, price: s.monthlyFee, tags: [s.type], index: i, priceLabel: '/mo', imageId: getLifestyleImageId('services', s.id, { type: s.type }), imageCategory: 'services' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = subscribeToService(item.id, 'standard')
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Subscribed' : 'Failed', message: r.message })
            if (r.success) setShowServiceModal(false)
          }}
          onClose={() => setShowServiceModal(false)}
          actionLabel="Subscribe"
        />
      </Modal>

      {/* Experience Booking Modal */}
      <Modal isOpen={showExperienceModal} onClose={() => setShowExperienceModal(false)} title="Experiences & Travel" size="full">
        <CatalogGrid
          items={experienceCatalog.map((e, i) => ({ id: e.id, name: e.name, description: e.description, price: e.cost, tags: [e.type, e.duration], index: i, imageId: getLifestyleImageId('experiences', e.id), imageCategory: 'experiences' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = bookLuxuryExperience(item.id)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Booked!' : 'Failed', message: r.message })
            if (r.success) setShowExperienceModal(false)
          }}
          onClose={() => setShowExperienceModal(false)}
          actionLabel="Book"
        />
      </Modal>

      {/* Collectible Purchase Modal */}
      <Modal isOpen={showCollectibleModal} onClose={() => setShowCollectibleModal(false)} title="Collectibles Market" size="full">
        <CatalogGrid
          items={collectibleCatalog.map((c, i) => ({ id: c.id, name: c.name, description: c.description, price: c.basePrice, tags: [c.category, c.rarity], index: i, imageId: getLifestyleImageId('collectibles', c.id, { category: c.category }), imageCategory: 'collectibles' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = buyCollectible(item.id)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Acquired' : 'Failed', message: r.message })
            if (r.success) setShowCollectibleModal(false)
          }}
          onClose={() => setShowCollectibleModal(false)}
          actionLabel="Acquire"
        />
      </Modal>

      {/* Pet Adoption Modal */}
      <Modal isOpen={showPetModal} onClose={() => setShowPetModal(false)} title="Adopt a Pet" size="full">
        <CatalogGrid
          items={petCatalog.map((p, i) => ({ id: p.id, name: `${p.breed}`, description: p.description, price: p.basePrice, tags: [p.type, `$${p.monthlyUpkeep}/mo upkeep`], index: i, imageId: getLifestyleImageId('pets', p.id), imageCategory: 'pets' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const petEntry = petCatalog.find(p => p.id === item.id)
            const r = adoptNewPet(item.id, petEntry?.breed || 'Buddy')
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Welcome Home!' : 'Failed', message: r.message })
            if (r.success) setShowPetModal(false)
          }}
          onClose={() => setShowPetModal(false)}
          actionLabel="Adopt"
        />
      </Modal>

      {/* Wardrobe Shopping Modal */}
      <Modal isOpen={showWardrobeModal} onClose={() => setShowWardrobeModal(false)} title="Fashion & Wardrobe" size="full">
        <CatalogGrid
          items={wardrobeCatalog.map((w, i) => ({ id: w.id, name: w.name, description: `${w.brand} - ${w.description}`, price: w.basePrice, tags: [w.category], index: i, imageId: getLifestyleImageId('wardrobe', w.id, { category: w.category }), imageCategory: 'wardrobe' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = buyWardrobeItem(item.id)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Purchased' : 'Failed', message: r.message })
            if (r.success) setShowWardrobeModal(false)
          }}
          onClose={() => setShowWardrobeModal(false)}
        />
      </Modal>

      {/* Diet Selection Modal */}
      <Modal isOpen={showDietModal} onClose={() => setShowDietModal(false)} title="Diet & Nutrition Plans" size="full">
        <CatalogGrid
          items={dietCatalog.map((d, i) => ({ id: d.id, name: d.name, description: d.description, price: d.monthlyFee, tags: [d.type, `+${d.healthBonus} health`, `+${d.fitnessBonus} fitness`], index: i, priceLabel: '/mo', imageId: d.id.replace(/_/g, '-'), imageCategory: 'diet' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = subscribeToDiet(item.id)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Plan Started' : 'Failed', message: r.message })
            if (r.success) setShowDietModal(false)
          }}
          onClose={() => setShowDietModal(false)}
          actionLabel="Start Plan"
        />
      </Modal>

      {/* Property Browse & Purchase Modal */}
      <Modal isOpen={showPropertyModal} onClose={() => { setShowPropertyModal(false); setSelectedPropertyIndex(null); setShowMortgageCalc(false) }} title="Property Market — Buy, Mortgage or Rent" size="full">
        {selectedPropertyIndex !== null && propertyCatalog[selectedPropertyIndex] ? (() => {
          const listing = propertyCatalog[selectedPropertyIndex] as any
          const prop = listing.property || listing
          const price = listing.askingPrice || listing.listPrice || prop.currentValue || 0
          const monthlyRent = Math.round(price * 0.04 / 12)
          const loanAmount = Math.round(price * (1 - mortgageDownPercent / 100))
          const rate = 0.045 / 12
          const nPayments = mortgageTermYears * 12
          const monthlyMortgage = rate > 0 ? Math.round(loanAmount * (rate * Math.pow(1 + rate, nPayments)) / (Math.pow(1 + rate, nPayments) - 1)) : 0
          const downPayment = Math.round(price * mortgageDownPercent / 100)

          return showMortgageCalc ? (
            // Mortgage Calculator View
            <div className="space-y-4 p-4">
              <button onClick={() => setShowMortgageCalc(false)} className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1">&larr; Back to property</button>
              <h3 className="text-lg font-bold">{listing.name}</h3>
              <p className="text-sm text-text-secondary">Property Price: <span className="text-text-primary font-mono">${price.toLocaleString()}</span></p>
              
              <div className="bg-surface-700 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Down Payment: {mortgageDownPercent}% (${downPayment.toLocaleString()})</label>
                  <input type="range" min={10} max={50} step={5} value={mortgageDownPercent} onChange={e => setMortgageDownPercent(Number(e.target.value))} className="w-full accent-accent-primary" />
                  <div className="flex justify-between text-xs text-text-tertiary"><span>10%</span><span>50%</span></div>
                </div>
                <div>
                  <label className="text-sm text-text-secondary block mb-1">Term: {mortgageTermYears} years</label>
                  <div className="flex gap-2">
                    {[10, 15, 20, 25, 30].map(y => (
                      <button key={y} onClick={() => setMortgageTermYears(y)} className={`px-3 py-1 rounded text-sm ${mortgageTermYears === y ? 'bg-accent-primary text-white' : 'bg-surface-600 text-text-secondary hover:bg-surface-500'}`}>{y}y</button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-surface-500 pt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-secondary">Loan Amount:</span> <span className="font-mono">${loanAmount.toLocaleString()}</span></div>
                  <div><span className="text-text-secondary">Monthly Payment:</span> <span className="font-mono text-accent-primary font-bold">${monthlyMortgage.toLocaleString()}</span></div>
                  <div><span className="text-text-secondary">Interest Rate:</span> <span className="font-mono">~4.5%</span></div>
                  <div><span className="text-text-secondary">Total Interest:</span> <span className="font-mono">${(monthlyMortgage * nPayments - loanAmount).toLocaleString()}</span></div>
                </div>
                {finances.liquidCash < downPayment && (
                  <div className="bg-status-danger/20 border border-status-danger/40 rounded p-2 text-sm text-status-danger">Insufficient funds for down payment. Need ${downPayment.toLocaleString()}, have ${finances.liquidCash.toLocaleString()}</div>
                )}
              </div>
              <button
                disabled={finances.liquidCash < downPayment}
                onClick={() => {
                  const r = buyProperty(selectedPropertyIndex, { paymentMethod: 'mortgage', downPaymentPercent: mortgageDownPercent, mortgageTermYears })
                  addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Mortgage Approved!' : 'Denied', message: r.message })
                  if (r.success) { setShowPropertyModal(false); setSelectedPropertyIndex(null); setShowMortgageCalc(false) }
                }}
                className="w-full py-2 rounded-lg bg-accent-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90"
              >Apply for Mortgage</button>
            </div>
          ) : (
            // Property Detail View
            <div className="space-y-4 p-4">
              <button onClick={() => setSelectedPropertyIndex(null)} className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1">&larr; Back to listings</button>
              <div className="flex gap-4">
                <div className="w-48 h-32 bg-surface-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={getLifestyleImage('properties', listing.name || '', { type: prop.type })} alt={listing.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-bold">{listing.name}</h3>
                  <p className="text-sm text-text-secondary">{prop.city}, {prop.country} &bull; {prop.neighborhood}</p>
                  <p className="text-xl font-mono font-bold text-accent-primary">${price.toLocaleString()}</p>
                  <div className="flex gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 bg-surface-600 rounded">{(prop.type || '').replace('_', ' ')}</span>
                    {prop.bedrooms > 0 && <span className="px-2 py-0.5 bg-surface-600 rounded">{prop.bedrooms} bed</span>}
                    {prop.bathrooms > 0 && <span className="px-2 py-0.5 bg-surface-600 rounded">{prop.bathrooms} bath</span>}
                    {prop.squareMeters > 0 && <span className="px-2 py-0.5 bg-surface-600 rounded">{prop.squareMeters}m²</span>}
                    <span className="px-2 py-0.5 bg-surface-600 rounded">{(prop.quality || 'good').replace('_', ' ')}</span>
                  </div>
                  {(prop.features || []).length > 0 && <div className="flex gap-1 flex-wrap text-xs text-text-tertiary">{prop.features.map((f: string) => <span key={f} className="px-1.5 py-0.5 bg-surface-700 rounded">{f.replace('_', ' ')}</span>)}</div>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-surface-700 rounded p-2 text-center"><p className="text-text-tertiary text-xs">Maintenance</p><p className="font-mono">${(prop.monthlyMaintenance || 0).toLocaleString()}/mo</p></div>
                <div className="bg-surface-700 rounded p-2 text-center"><p className="text-text-tertiary text-xs">Tax</p><p className="font-mono">${Math.round((prop.annualPropertyTax || 0) / 12).toLocaleString()}/mo</p></div>
                <div className="bg-surface-700 rounded p-2 text-center"><p className="text-text-tertiary text-xs">Insurance</p><p className="font-mono">${(prop.insuranceCost || 0).toLocaleString()}/mo</p></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { const r = buyProperty(selectedPropertyIndex, { paymentMethod: 'cash' }); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Purchased!' : 'Failed', message: r.message }); if (r.success) { setShowPropertyModal(false); setSelectedPropertyIndex(null) } }}
                  disabled={finances.liquidCash < price}
                  className="py-2 rounded-lg bg-status-success/20 border border-status-success/40 text-status-success text-sm font-medium hover:bg-status-success/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  Buy Cash<br/><span className="text-xs font-mono">${price.toLocaleString()}</span>
                </button>
                <button onClick={() => setShowMortgageCalc(true)}
                  className="py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/40 text-accent-primary text-sm font-medium hover:bg-accent-primary/30">
                  Mortgage<br/><span className="text-xs font-mono">~${Math.round(price * 0.8 * 0.045 / 12 * (Math.pow(1.00375, 300)) / (Math.pow(1.00375, 300) - 1)).toLocaleString()}/mo</span>
                </button>
                <button onClick={() => { const r = buyProperty(selectedPropertyIndex, { paymentMethod: 'rent' }); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Rented!' : 'Failed', message: r.message }); if (r.success) { setShowPropertyModal(false); setSelectedPropertyIndex(null) } }}
                  className="py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/30">
                  Rent<br/><span className="text-xs font-mono">${monthlyRent.toLocaleString()}/mo</span>
                </button>
              </div>
            </div>
          )
        })() : (
          // Property Listings Grid
          <div className="space-y-3 p-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="bg-surface-700 border border-surface-500 rounded px-2 py-1 text-sm text-text-primary" style={{ colorScheme: 'dark' }}>
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="mansion">Mansion</option>
                <option value="penthouse">Penthouse</option>
                <option value="beach_house">Beach House</option>
                <option value="ski_chalet">Ski Chalet</option>
                <option value="land">Land</option>
              </select>
              <select value={propertyCountryFilter} onChange={e => setPropertyCountryFilter(e.target.value)} className="bg-surface-700 border border-surface-500 rounded px-2 py-1 text-sm text-text-primary" style={{ colorScheme: 'dark' }}>
                <option value="all">All Countries</option>
                {[...new Set(propertyCatalog.map((p: any) => (p.property || p).country))].sort().map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-xs text-text-tertiary ml-auto self-center">
                {propertyCatalog.filter((p: any) => { const prop = p.property || p; return (propertyFilter === 'all' || prop.type === propertyFilter) && (propertyCountryFilter === 'all' || prop.country === propertyCountryFilter) }).length} listings
              </span>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
              {propertyCatalog
                .map((p: any, i: number) => ({ listing: p, index: i }))
                .filter(({ listing }: any) => {
                  const prop = listing.property || listing
                  return (propertyFilter === 'all' || prop.type === propertyFilter) && (propertyCountryFilter === 'all' || prop.country === propertyCountryFilter)
                })
                .map(({ listing, index }: any) => {
                  const prop = listing.property || listing
                  const price = listing.askingPrice || listing.listPrice || prop.currentValue || 0
                  return (
                    <button key={index} onClick={() => setSelectedPropertyIndex(index)} className="bg-surface-700 rounded-lg overflow-hidden text-left hover:bg-surface-600 transition-colors border border-surface-500 hover:border-accent-primary/50">
                      <div className="h-24 bg-surface-600 flex items-center justify-center overflow-hidden">
                        <img src={getLifestyleImage('properties', listing.name || '', { type: prop.type })} alt={listing.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                      <div className="p-2 space-y-0.5">
                        <p className="text-sm font-medium truncate">{listing.name}</p>
                        <p className="text-xs text-text-secondary truncate">{prop.city}, {prop.country}</p>
                        <p className="text-sm font-mono font-bold text-accent-primary">${price.toLocaleString()}</p>
                        <div className="flex gap-1 text-xs">
                          <span className="px-1 py-0.5 bg-surface-600 rounded">{(prop.type || '').replace('_', ' ')}</span>
                          {prop.bedrooms > 0 && <span className="px-1 py-0.5 bg-surface-600 rounded">{prop.bedrooms}bd</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </Modal>

      {/* Course Enrollment Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Education & Courses" size="full">
        <CatalogGrid
          items={courseCatalog.map((c: any, i: number) => ({ id: `course_${i}`, name: c.name, description: `${c.provider} - ${c.format?.replace('_', ' ')} (${c.totalHours}h)`, price: c.enrollmentFee, tags: [c.category, c.format?.replace('_', ' ')], index: i, imageId: getLifestyleImageId('courses', c.id || `course_${i}`, { category: c.category }), imageCategory: 'courses' }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = enrollInCourse(item.index)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Enrolled!' : 'Failed', message: r.message })
            if (r.success) setShowCourseModal(false)
          }}
          onClose={() => setShowCourseModal(false)}
          actionLabel="Enroll"
        />
      </Modal>

      {/* Sell Confirmation Modal */}
      <Modal isOpen={!!pendingSale} onClose={() => setPendingSale(null)} title="" size="sm">
        {pendingSale && (() => {
          const gainLoss = pendingSale.currentValue - pendingSale.purchasePrice
          const gainLossPercent = pendingSale.purchasePrice > 0 ? ((gainLoss / pendingSale.purchasePrice) * 100) : 0
          const fees = pendingSale.currentValue - pendingSale.estimatedProceeds
          const netGainLoss = pendingSale.estimatedProceeds - pendingSale.purchasePrice
          const isProfit = netGainLoss >= 0

          return (
            <div className="space-y-5 px-1">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-status-danger/15 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5 text-status-danger" />
                </div>
                <h3 className="text-lg font-bold">Sell {pendingSale.type}?</h3>
                <p className="text-sm text-text-secondary">{pendingSale.name}</p>
              </div>

              {/* Price Breakdown */}
              <div className="bg-surface-700/60 rounded-xl p-4 space-y-3">
                {/* Purchase -> Current Value */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Purchased for</span>
                  <span className="font-mono text-text-secondary">${pendingSale.purchasePrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Current market value</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium">${pendingSale.currentValue.toLocaleString()}</span>
                    {gainLoss !== 0 && (
                      <span className={`text-[10px] font-mono flex items-center gap-0.5 ${gainLoss >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                        {gainLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Fee line */}
                {fees > 0 && (
                  <div className="flex items-center justify-between text-sm border-t border-surface-500/50 pt-2">
                    <span className="text-text-tertiary">{pendingSale.feeLabel}</span>
                    <span className="font-mono text-status-danger">-${fees.toLocaleString()}</span>
                  </div>
                )}

                {/* Divider + Final proceeds */}
                <div className="border-t border-surface-500 pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">You&apos;ll receive</span>
                  <span className="font-mono font-bold text-xl text-accent-primary">${pendingSale.estimatedProceeds.toLocaleString()}</span>
                </div>

                {/* Net gain/loss summary */}
                <div className={`flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-1.5 ${isProfit ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'}`}>
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  Net {isProfit ? 'profit' : 'loss'}: <span className="font-mono">${Math.abs(netGainLoss).toLocaleString()}</span>
                  {pendingSale.purchasePrice > 0 && (
                    <span className="opacity-70">({isProfit ? '+' : ''}{((netGainLoss / pendingSale.purchasePrice) * 100).toFixed(1)}%)</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingSale(null)}
                  className="flex-1 py-2.5 rounded-lg bg-surface-600 text-text-secondary text-sm font-medium hover:bg-surface-500 transition-colors"
                >
                  Keep It
                </button>
                <button
                  onClick={() => {
                    const r = pendingSale.sellFn()
                    addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Sold!' : 'Sale Failed', message: r.message })
                    setPendingSale(null)
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-status-danger text-white text-sm font-bold hover:bg-status-danger/90 transition-colors"
                >
                  Sell for ${pendingSale.estimatedProceeds.toLocaleString()}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// ============================================
// REUSABLE LAYOUT COMPONENTS
// ============================================

interface AssetSectionProps {
  icon: React.ReactNode
  title: string
  count: number
  subtitle: string
  onAdd: () => void
  children: React.ReactNode
}

function AssetSection({ icon, title, count, subtitle, onAdd, children }: AssetSectionProps) {
  return (
    <Card variant="glass" padding="sm" className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-text-muted flex-shrink-0">{icon}</span>
          <span className="font-medium text-sm truncate">{title}</span>
          <Badge variant="outline" size="xs">{count}</Badge>
        </div>
        <button className="text-accent-blue hover:text-accent-blue/80 flex-shrink-0" onClick={onAdd}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-text-muted mb-2">{subtitle}</p>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px]">
        {children}
      </div>
    </Card>
  )
}

interface CompactItemRowProps {
  index: number
  children: React.ReactNode
}

function CompactItemRow({ index, children }: CompactItemRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors"
    >
      {children}
    </motion.div>
  )
}

interface EmptySectionProps {
  icon: React.ReactNode
  label: string
  actionLabel: string
  onAction: () => void
}

function EmptySection({ icon, label, actionLabel, onAction }: EmptySectionProps) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto mb-2 text-text-muted opacity-40">{icon}</div>
      <p className="text-xs text-text-muted mb-2">{label}</p>
      <Button variant="ghost" size="xs" onClick={onAction}>
        <Plus className="w-3 h-3 mr-1" />
        {actionLabel}
      </Button>
    </div>
  )
}

// Generic Catalog Grid for purchase modals
interface CatalogGridItem {
  id: string
  name: string
  description: string
  price: number
  tags: string[]
  index: number
  priceLabel?: string
  imageId?: string
  imageCategory?: string
}

interface CatalogGridProps {
  items: CatalogGridItem[]
  liquidCash: number
  onPurchase: (item: CatalogGridItem) => void
  onClose: () => void
  actionLabel?: string
}

function LifestyleImageWithFallback({ imageCategory, imageId, alt, className = 'w-full h-full object-cover' }: { imageCategory: string; imageId: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = getLifestyleImage(imageCategory, imageId)
  const FallbackIcon = imageCategory === 'pets' ? PawPrint : imageCategory === 'wardrobe' ? Shirt : imageCategory === 'collectibles' ? Gem : imageCategory === 'vehicles' ? Car : imageCategory === 'properties' ? Home : imageCategory === 'courses' ? GraduationCap : imageCategory === 'diet' ? Utensils : imageCategory === 'experiences' ? Plane : imageCategory === 'services' ? Star : imageCategory === 'furnishings' ? Sparkles : Star
  return (
    <div className="rounded-md overflow-hidden mb-2 h-36 bg-surface-secondary flex items-center justify-center">
      {!failed && src ? (
        <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <FallbackIcon className="w-10 h-10 text-text-muted/50" aria-hidden />
      )}
    </div>
  )
}

function CatalogGrid({ items, liquidCash, onPurchase, onClose, actionLabel = 'Purchase' }: CatalogGridProps) {
  const [filter, setFilter] = useState<string | null>(null)
  
  const allTags = [...new Set(items.flatMap(i => i.tags).filter(Boolean))]
  const filteredItems = filter ? items.filter(i => i.tags.includes(filter)) : items
  
  return (
    <div className="space-y-4">
      <p className="text-text-muted text-sm">
        Available Cash: <span className="font-mono font-bold">${liquidCash.toLocaleString()}</span>
      </p>
      
      {allTags.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === null ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(null)}>All</Button>
          {allTags.slice(0, 8).map(tag => (
            <Button key={tag} variant={filter === tag ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(tag)} className="capitalize">
              {tag.replace('_', ' ')}
            </Button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
        {filteredItems.map((item) => {
          const canAfford = liquidCash >= item.price
          return (
            <Card key={item.id} variant="default" padding="md" className={!canAfford ? 'opacity-50' : ''}>
              {/* Image thumbnail */}
              {item.imageId && item.imageCategory && (
                <LifestyleImageWithFallback imageCategory={item.imageCategory} imageId={item.imageId} alt={item.name} />
              )}
              <h4 className="font-medium text-sm mb-1">{item.name}</h4>
              <p className="text-xs text-text-muted mb-2 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="outline" size="xs" className="capitalize text-[9px]">{tag.replace('_', ' ')}</Badge>
                ))}
              </div>
              <p className="font-mono font-bold text-lg mb-2">${item.price.toLocaleString()}{item.priceLabel || ''}</p>
              <Button variant="primary" size="sm" className="w-full" disabled={!canAfford}
                onClick={() => onPurchase(item)}>
                {canAfford ? actionLabel : 'Can\'t Afford'}
              </Button>
            </Card>
          )
        })}
      </div>
      
      <Button variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface HealthMetricProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'red' | 'purple' | 'blue' | 'orange' | 'green'
  inverted?: boolean
}

function HealthMetric({ icon, label, value, color, inverted }: HealthMetricProps) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? Math.round(value) : 0
  const displayValue = inverted ? safeValue : safeValue
  const colorClasses = {
    red: 'bg-red-500/20 text-red-500',
    purple: 'bg-purple-500/20 text-purple-500',
    blue: 'bg-blue-500/20 text-blue-500',
    orange: 'bg-orange-500/20 text-orange-500',
    green: 'bg-green-500/20 text-green-500'
  }
  const barColors = {
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500'
  }

  return (
    <div className="p-4 bg-background rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="font-mono font-bold text-2xl">{displayValue}</span>
        <span className="text-text-muted text-sm mb-1">/100</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColors[color]}`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  )
}

interface HobbyCardProps {
  hobby: Hobby
  index: number
  onPractice: (hobby: Hobby) => void
  hoursRemaining: number
}

function HobbyCard({ hobby, index, onPractice, hoursRemaining }: HobbyCardProps) {
  // Use actual activity config for accurate stress reduction and time cost
  const activityConfig = HOBBY_ACTIVITY_CONFIG[hobby.type as HobbyType]
  const hoursNeeded = activityConfig?.hoursRequired ?? 2
  const stressReduction = activityConfig?.stressReduction ?? 8
  const canPractice = hoursRemaining >= hoursNeeded
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors"
    >
      {/* Name + level */}
      <div className="flex items-center gap-1 mb-1">
        <span className="font-medium text-xs truncate">{hobby.name}</span>
        <Badge variant="outline" size="xs" className="text-[9px]">Lv.{hobby.skillLevel}</Badge>
      </div>
      
      {/* Cost & Hours */}
      <div className="flex justify-between text-[10px] text-text-muted mb-1">
        <span>${(hobby.currentMonthlyCost || 0).toLocaleString()}/mo</span>
        <span>{hobby.hoursInvested}h</span>
      </div>

      {/* Skill Progress */}
      <div className="mb-1.5">
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-blue"
            style={{ width: `${hobby.progressToNextLevel}%` }}
          />
        </div>
        <p className="text-[10px] text-text-muted mt-0.5">{hobby.progressToNextLevel}%</p>
      </div>

      <button 
        className={`w-full text-[10px] py-1 rounded transition-colors ${
          canPractice 
            ? 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20' 
            : 'bg-surface text-text-muted cursor-not-allowed'
        }`}
        onClick={() => canPractice && onPractice(hobby)}
        disabled={!canPractice}
        title={!canPractice ? `Need ${hoursNeeded}h, only ${hoursRemaining.toFixed(1)}h left` : ''}
      >
        Practice ({hoursNeeded}h, -{stressReduction} stress)
      </button>
    </motion.div>
  )
}

interface StaffCardProps {
  staff: PersonalStaff
  index: number
  onFire?: (staffId: string) => void
}

function StaffCard({ staff, index, onFire }: StaffCardProps) {
  const satisfactionColor = staff.satisfaction >= 70 
    ? 'text-status-success' 
    : staff.satisfaction >= 40 
      ? 'text-status-warning' 
      : 'text-status-danger'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors"
    >
      {/* Portrait + Name */}
      <div className="flex items-center gap-2 mb-1">
        <StaffPortrait
          src={getStaffPortrait(staff.id) || getRandomStaffPortraitByRole(staff.role)}
          name={staff.name}
          role={staff.role.replace('_', ' ')}
          size="xs"
        />
        <div className="min-w-0">
          <span className="font-medium text-xs truncate block">{staff.name}</span>
          <p className="text-[10px] text-text-muted capitalize truncate">
            {staff.role.replace('_', ' ')} • {staff.yearsEmployed}yr{staff.yearsEmployed !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      {/* Salary & Satisfaction */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-xs font-bold">${Math.round(staff.salary).toLocaleString()}/mo</span>
        <span className={`text-[10px] font-mono ${satisfactionColor}`}>
          {staff.satisfaction}%
        </span>
      </div>

      {/* Dismiss on hover */}
      {onFire && (
        <button 
          className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onFire(staff.id)}
        >
          Dismiss
        </button>
      )}
    </motion.div>
  )
}

interface HobbySelectionViewProps {
  currentHobbies: Hobby[]
  onClose: () => void
  onStartHobby: (hobbyType: string, hobbyName: string) => void
}

function HobbySelectionView({ currentHobbies, onClose, onStartHobby }: HobbySelectionViewProps) {
  // Use actual HOBBY_TEMPLATES data for accurate pricing
  const availableHobbies = Object.entries(HOBBY_TEMPLATES)
    .filter(([type]) => !currentHobbies.find(h => h.type === type))

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Hobbies help reduce stress and can provide networking opportunities.
      </p>
      
      <div className="grid grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
        {availableHobbies.map(([type, config]) => (
          <Card key={type} variant="default" padding="md" hoverable className="cursor-pointer">
            <h4 className="font-medium text-lg mb-2">{config.name}</h4>
            <p className="text-sm text-text-muted mb-3">{config.description}</p>
            
            <div className="space-y-1.5 text-xs text-text-muted mb-4">
              <p className="text-[10px] uppercase tracking-wider mb-1">Initial Investment</p>
              <p className="font-mono font-bold text-lg text-text-primary mb-2">${config.initialInvestment.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wider mb-1">Ongoing Cost</p>
              <p className="font-mono font-bold text-sm text-text-primary">${config.annualCost.toLocaleString()}<span className="text-xs font-normal text-text-muted">/year</span></p>
              <p>${Math.round(config.annualCost / 12).toLocaleString()}/month</p>
            </div>
            
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full"
              onClick={() => onStartHobby(type, config.name)}
            >
              Start Hobby
            </Button>
          </Card>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

interface StaffHiringViewProps {
  currentStaff: PersonalStaff[]
  onClose: () => void
  onHire: (role: string) => void
}

function StaffHiringView({ currentStaff, onClose, onHire }: StaffHiringViewProps) {
  // Use actual STAFF_TEMPLATES for accurate pricing
  const availableRoles = Object.entries(STAFF_TEMPLATES)
    .filter(([role]) => !currentStaff.find(s => s.role === role))

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Personal staff can help manage your daily life and reduce stress.
      </p>
      
      <div className="grid grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
        {availableRoles.map(([role, config]) => (
          <Card
            key={role}
            variant="default"
            padding="md"
          >
            <h4 className="font-medium text-lg mb-1">{config.title}</h4>
            <p className="text-sm text-text-muted mb-3 capitalize">{role.replace(/_/g, ' ')}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {config.benefits.map((benefit, i) => (
                <Badge key={i} variant="outline" size="sm">{benefit}</Badge>
              ))}
            </div>
            
            <p className="font-mono font-bold text-lg mb-1">
              ${config.baseSalary.toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mb-3">per year (${Math.round(config.baseSalary / 12).toLocaleString()}/mo)</p>
            
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full"
              onClick={() => onHire(role)}
            >
              Hire
            </Button>
          </Card>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

// ============================================
// LIFESTYLE SCORE PANEL
// ============================================

const CATEGORY_META: { key: keyof Omit<LifestyleScoreBreakdown, 'total' | 'level'>; label: string; icon: typeof Home; max: number; color: string }[] = [
  { key: 'housing', label: 'Housing', icon: Home, max: LIFESTYLE_SCORE_WEIGHTS.housing.maxPoints, color: 'bg-blue-500' },
  { key: 'vehicles', label: 'Vehicles', icon: Car, max: LIFESTYLE_SCORE_WEIGHTS.vehicles.maxPoints, color: 'bg-emerald-500' },
  { key: 'collections', label: 'Collections', icon: Gem, max: LIFESTYLE_SCORE_WEIGHTS.collections.maxPoints, color: 'bg-purple-500' },
  { key: 'furnishings', label: 'Furnishings', icon: Sparkles, max: LIFESTYLE_SCORE_WEIGHTS.furnishings.maxPoints, color: 'bg-amber-500' },
  { key: 'memberships', label: 'Memberships', icon: Crown, max: LIFESTYLE_SCORE_WEIGHTS.memberships.maxPoints, color: 'bg-rose-500' },
  { key: 'staff', label: 'Staff', icon: Users, max: LIFESTYLE_SCORE_WEIGHTS.staff.maxPoints, color: 'bg-cyan-500' },
  { key: 'hobbies', label: 'Hobbies', icon: Coffee, max: LIFESTYLE_SCORE_WEIGHTS.hobbies.maxPoints, color: 'bg-orange-500' },
]

function LifestyleScorePanel({ careerState, lifestyleLevel, staff, hobbies, health, finances, assets }: {
  careerState: any
  lifestyleLevel: LifestyleLevel
  staff: PersonalStaff[]
  hobbies: Hobby[]
  health: OwnerHealth
  finances: PersonalFinancialState
  assets: LifestyleAssets & { properties?: any[] }
}) {
  const [showLevelGuide, setShowLevelGuide] = useState(false)

  // Compute score breakdown from actual data (with NaN safety)
  const scoreBreakdown = useMemo<LifestyleScoreBreakdown>(() => {
    const storedScore = careerState?.personalLife?.lifestyleScore
    let raw: LifestyleScoreBreakdown
    if (storedScore && typeof storedScore === 'object' && typeof storedScore.total === 'number' && !isNaN(storedScore.total)) {
      raw = storedScore as LifestyleScoreBreakdown
    } else {
      // Fallback: compute on-the-fly
      const primaryResidenceValue = (assets.properties || [])
        .filter((p: any) => !p.isPlayerRental)
        .reduce((max: number, p: any) => Math.max(max, p.currentValue || p.purchasePrice || 0), 0)
      const collectionsValue = (assets.collectibles || [])
        .reduce((sum: number, c: any) => sum + (c.currentValue || c.purchasePrice || 0), 0)
      raw = calculateLifestyleScore(primaryResidenceValue, assets, collectionsValue, staff, hobbies)
    }
    // Sanitise every numeric field to prevent NaN in the UI
    return {
      housing: isNaN(raw.housing) ? 0 : raw.housing,
      vehicles: isNaN(raw.vehicles) ? 0 : raw.vehicles,
      collections: isNaN(raw.collections) ? 0 : raw.collections,
      furnishings: isNaN(raw.furnishings) ? 0 : raw.furnishings,
      memberships: isNaN(raw.memberships) ? 0 : raw.memberships,
      staff: isNaN(raw.staff) ? 0 : raw.staff,
      hobbies: isNaN(raw.hobbies) ? 0 : raw.hobbies,
      total: isNaN(raw.total) ? 0 : raw.total,
      level: raw.level || 'frugal'
    }
  }, [careerState?.personalLife?.lifestyleScore, assets, staff, hobbies])

  // Current level info
  const currentTier = typeof lifestyleLevel === 'string' ? lifestyleLevel : lifestyleLevel.tier
  const currentThreshold = LIFESTYLE_LEVEL_THRESHOLDS.find(t => t.level === currentTier) || LIFESTYLE_LEVEL_THRESHOLDS[0]
  const currentIndex = LIFESTYLE_LEVEL_THRESHOLDS.indexOf(currentThreshold)
  const nextThreshold = currentIndex < LIFESTYLE_LEVEL_THRESHOLDS.length - 1 ? LIFESTYLE_LEVEL_THRESHOLDS[currentIndex + 1] : null
  const pointsToNext = nextThreshold ? nextThreshold.minScore - scoreBreakdown.total : 0

  // Progress within current tier (0-100%)
  const tierMin = currentThreshold.minScore
  const tierMax = nextThreshold ? nextThreshold.minScore : 100
  const tierProgress = tierMax > tierMin ? Math.min(100, Math.max(0, ((scoreBreakdown.total - tierMin) / (tierMax - tierMin)) * 100)) : 100

  // Weekly bonuses from assets
  const weeklyBonuses = useMemo(() => processWeeklyLifestyleBonuses(assets), [assets])

  // Lifestyle recommendation
  const netWorth = (finances?.liquidCash ?? 0) + (finances?.totalAssets ?? 0)
  const recommended = getLifestyleRecommendation(netWorth)
  const recommendedTier = typeof recommended === 'string' ? recommended : recommended.tier

  // Total monthly expenses — read from the same finances.monthlyExpenses that the Wealth tab uses
  // so both screens always show identical numbers
  const totalMonthlyCosts = useMemo(() => {
    const exp = finances?.monthlyExpenses
    if (!exp) return 0
    return Math.round(
      (exp.personalStaff || 0) +
      (exp.mortgagePayments || 0) +
      (exp.loanPayments || 0) +
      (exp.familyExpenses || 0) +
      (exp.hobbies || 0) +
      (exp.philanthropy || 0) +
      (exp.services || 0) +
      (exp.dietPlan || 0) +
      (exp.petUpkeep || 0) +
      (exp.vehicleCosts || 0) +
      (exp.membershipFees || 0) +
      (exp.rent || 0) +
      (exp.other || 0)
    )
  }, [finances?.monthlyExpenses])

  // Bonus entries for display (only non-zero)
  const bonusEntries = useMemo(() => {
    const entries: { label: string; value: string; icon: typeof Heart }[] = []
    if (weeklyBonuses.totalStressReduction > 0) entries.push({ label: 'Stress reduction', value: `-${weeklyBonuses.totalStressReduction.toFixed(1)}/wk`, icon: Wind })
    if (weeklyBonuses.totalHealthBonus > 0) entries.push({ label: 'Health bonus', value: `+${weeklyBonuses.totalHealthBonus.toFixed(1)}/wk`, icon: Heart })
    if (weeklyBonuses.totalFitnessBonus > 0) entries.push({ label: 'Fitness bonus', value: `+${weeklyBonuses.totalFitnessBonus.toFixed(1)}/wk`, icon: Dumbbell })
    if (weeklyBonuses.totalPrestigeBonus > 0) entries.push({ label: 'Prestige', value: `+${weeklyBonuses.totalPrestigeBonus.toFixed(1)}`, icon: Crown })
    if (weeklyBonuses.totalNetworkingBonus > 0) entries.push({ label: 'Networking', value: `+${weeklyBonuses.totalNetworkingBonus.toFixed(1)}`, icon: Users })
    if (weeklyBonuses.totalConfidenceBoost > 0) entries.push({ label: 'Confidence', value: `+${weeklyBonuses.totalConfidenceBoost.toFixed(1)}`, icon: Shield })
    if (weeklyBonuses.timeFreedPerWeek > 0) entries.push({ label: 'Time freed', value: `+${weeklyBonuses.timeFreedPerWeek.toFixed(0)}h/wk`, icon: Zap })
    if (weeklyBonuses.totalEnergyBonus > 0) entries.push({ label: 'Energy', value: `+${weeklyBonuses.totalEnergyBonus.toFixed(1)}/wk`, icon: Activity })
    if (weeklyBonuses.totalHappinessBoost > 0) entries.push({ label: 'Happiness', value: `+${weeklyBonuses.totalHappinessBoost.toFixed(1)}/wk`, icon: Star })
    return entries
  }, [weeklyBonuses])

  // Find weakest categories (lowest percentage of max)
  const improvementHints = useMemo(() => {
    return CATEGORY_META
      .map(c => ({ ...c, score: scoreBreakdown[c.key] as number, pct: ((scoreBreakdown[c.key] as number) / c.max) * 100 }))
      .filter(c => c.pct < 50)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
  }, [scoreBreakdown])

  return (
    <Card variant="glass" padding="md">
      {/* Section 1: Score + Level Header */}
      <div className="flex items-start gap-4">
        {/* Circular score gauge */}
        <div className="flex-shrink-0">
          <div className="h-20 w-20 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-600" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5"
                strokeDasharray={`${(scoreBreakdown.total / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                className="text-accent-blue"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-lg font-bold leading-none">{scoreBreakdown.total}</span>
              <span className="text-[10px] text-text-muted leading-none">/100</span>
            </div>
          </div>
        </div>

        {/* Level info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg capitalize">{currentThreshold.name}</h3>
            <Badge variant="default" size="sm">{currentTier.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-text-muted mb-2">{currentThreshold.description}</p>

          {/* Tier progress bar */}
          {nextThreshold && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                <span>{currentThreshold.name}</span>
                <span>{pointsToNext} pts to {nextThreshold.name}</span>
              </div>
              <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-blue to-accent-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
          {!nextThreshold && (
            <p className="text-xs text-accent-gold font-medium mb-2">Maximum lifestyle level reached</p>
          )}

          {/* Recommendation + costs */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
            {recommendedTier !== currentTier && (
              <span>Recommended: <span className="text-accent-primary capitalize">{recommendedTier.replace('_', ' ')}</span></span>
            )}
            <span>Monthly costs: <span className="text-text-primary">${totalMonthlyCosts.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Section 2: Category Breakdown */}
      <div className="mt-4 space-y-1.5">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Score Breakdown</h4>
        {CATEGORY_META.map(cat => {
          const score = scoreBreakdown[cat.key] as number
          const pct = cat.max > 0 ? (score / cat.max) * 100 : 0
          const Icon = cat.icon
          return (
            <div key={cat.key} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <span className="text-xs w-20 text-text-secondary truncate">{cat.label}</span>
              <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-text-muted w-12 text-right">{score}/{cat.max}</span>
            </div>
          )
        })}
      </div>

      {/* Section 3: Current Level Effects */}
      {bonusEntries.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Lifestyle Effects</h4>
          <div className="grid grid-cols-3 gap-2">
            {bonusEntries.map((entry, i) => {
              const Icon = entry.icon
              return (
                <div key={i} className="flex items-center gap-1.5 bg-surface-700/50 rounded-lg px-2 py-1.5">
                  <Icon className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-text-muted block leading-tight truncate">{entry.label}</span>
                    <span className="text-xs font-medium text-accent-green leading-tight">{entry.value}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {bonusEntries.length === 0 && (
        <div className="mt-4 p-3 bg-surface-700/30 rounded-lg text-center">
          <p className="text-xs text-text-muted">No active lifestyle bonuses — purchase assets & services to unlock effects</p>
        </div>
      )}

      {/* Improvement hints */}
      {improvementHints.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Areas to Improve</h4>
          <div className="flex flex-wrap gap-1.5">
            {improvementHints.map(cat => (
              <span key={cat.key} className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full">
                <cat.icon className="w-3 h-3" />
                {cat.label} ({cat.score}/{cat.max})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Level Guide (collapsible) */}
      <button
        onClick={() => setShowLevelGuide(!showLevelGuide)}
        className="mt-3 w-full flex items-center justify-between text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
      >
        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Level Guide</span>
        {showLevelGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {showLevelGuide && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-1.5 pt-1">
            {LIFESTYLE_LEVEL_THRESHOLDS.map((tier, i) => {
              const isActive = tier.level === currentTier
              const nextTier = i < LIFESTYLE_LEVEL_THRESHOLDS.length - 1 ? LIFESTYLE_LEVEL_THRESHOLDS[i + 1] : null
              const rangeMax = nextTier ? nextTier.minScore - 1 : 100
              return (
                <div key={tier.level} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${isActive ? 'bg-accent-blue/10 ring-1 ring-accent-blue/30' : 'bg-surface-700/30'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${isActive ? 'bg-accent-blue' : 'bg-surface-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isActive ? 'text-accent-blue' : 'text-text-secondary'}`}>{tier.name}</span>
                      <span className="text-text-muted font-mono">{tier.minScore}–{rangeMax} pts</span>
                    </div>
                    <p className="text-text-muted mt-0.5 leading-snug">{tier.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </Card>
  )
}

// ============================================
// LIFESTYLE ASSETS SUB-COMPONENTS
// ============================================

interface ScoreComponentProps {
  label: string
  value: number
  max: number
}

function ScoreComponent({ label, value, max }: ScoreComponentProps) {
  const percentage = (value / max) * 100
  return (
    <div className="text-center">
      <div className="h-16 w-16 mx-auto relative">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-surface"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${percentage * 1.76} 176`}
            className="text-accent-blue"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-bold">{value}</span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

interface VehicleCardProps {
  vehicle: OwnedVehicle
  index: number
  onSell: (id: string) => void
  onSetPrimary: (id: string) => void
}

function VehicleCard({ vehicle, index, onSell, onSetPrimary }: VehicleCardProps) {
  const appreciation = vehicle.currentValue - vehicle.purchasePrice
  const appreciationPercent = ((appreciation / vehicle.purchasePrice) * 100).toFixed(1)
  const monthlyCost = vehicle.monthlyMaintenanceCost + vehicle.monthlyInsuranceCost
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors"
    >
      {/* Top row: Name + badge */}
      <div className="flex items-center gap-1 mb-1">
        <span className="font-medium text-xs truncate">{vehicle.brand} {vehicle.model}</span>
        {vehicle.isPrimaryVehicle && <Badge variant="blue" size="xs">P</Badge>}
      </div>
      
      {/* Value row */}
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-mono text-xs font-bold">${vehicle.currentValue.toLocaleString()}</span>
        <span className={`text-[10px] font-mono ${appreciation >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
          {appreciation >= 0 ? '+' : ''}{appreciationPercent}%
        </span>
      </div>
      
      {/* Details row */}
      <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
        <span>${monthlyCost.toLocaleString()}/mo</span>
        <span>{vehicle.condition}%</span>
      </div>

      {/* Actions - only visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!vehicle.isPrimaryVehicle && (
          <button 
            className="flex-1 text-[10px] text-accent-blue hover:underline"
            onClick={() => onSetPrimary(vehicle.id)}
          >
            Set Primary
          </button>
        )}
        <button 
          className="flex-1 text-[10px] text-status-danger hover:underline"
          onClick={() => onSell(vehicle.id)}
        >
          Sell ~${Math.round(vehicle.currentValue * 0.85).toLocaleString()}
        </button>
      </div>
    </motion.div>
  )
}

interface MembershipCardProps {
  membership: Membership
  index: number
  onCancel: (id: string) => void
}

function MembershipCard({ membership, index, onCancel }: MembershipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-2 bg-background rounded-lg group hover:bg-surface/50 transition-colors"
    >
      {/* Name + tier */}
      <div className="flex items-center gap-1 mb-1">
        <span className="font-medium text-xs truncate">{membership.name}</span>
        <Badge variant="outline" size="xs" className="capitalize flex-shrink-0 text-[9px]">
          {membership.membershipTier}
        </Badge>
      </div>
      
      {/* Location */}
      <p className="text-[10px] text-text-muted mb-1 truncate">
        {membership.location} • {membership.yearsAsMember}yr
      </p>
      
      {/* Cost */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-xs font-bold">${Math.round(membership.annualFee / 12).toLocaleString()}/mo</span>
        <span className="text-[10px] text-text-muted">+{membership.prestigeBonus} prest.</span>
      </div>

      {/* Cancel on hover */}
      <button 
        className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onCancel(membership.id)}
      >
        Cancel
      </button>
    </motion.div>
  )
}

function VehicleImageWithFallback({ brand, model }: { brand: string; model: string }) {
  const [failed, setFailed] = useState(false)
  const src = getVehicleImage(`${brand} ${model}`)
  return (
    <div className="rounded-md overflow-hidden mb-2 h-44 bg-surface-secondary flex items-center justify-center">
      {!failed && src ? (
        <img
          src={src}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Car className="w-12 h-12 text-text-muted/50" aria-hidden />
      )}
    </div>
  )
}

interface VehicleSelectionViewProps {
  catalog: ReturnType<typeof import('@/simulation/personal/lifestyleAssetsManager').getVehicleCatalog>
  liquidCash: number
  onClose: () => void
  onPurchase: (index: number) => void
}

function VehicleSelectionView({ catalog, liquidCash, onClose, onPurchase }: VehicleSelectionViewProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  
  const vehicleTypes = [...new Set(catalog.map(v => v.type))]
  const filteredVehicles = selectedType 
    ? catalog.filter(v => v.type === selectedType)
    : catalog

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Available Cash: <span className="font-mono font-bold">${liquidCash.toLocaleString()}</span>
      </p>
      
      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={selectedType === null ? 'primary' : 'ghost'} 
          size="sm"
          onClick={() => setSelectedType(null)}
        >
          All
        </Button>
        {vehicleTypes.map(type => (
          <Button 
            key={type}
            variant={selectedType === type ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setSelectedType(type)}
          >
            {type.replace('_', ' ')}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
        {filteredVehicles.map((vehicle) => {
          const canAfford = liquidCash >= vehicle.price
          return (
            <Card 
              key={vehicle.index} 
              variant="default" 
              padding="md"
              className={!canAfford ? 'opacity-50' : ''}
            >
              {/* Vehicle Image */}
              <VehicleImageWithFallback brand={vehicle.brand} model={vehicle.model} />
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{vehicle.brand} {vehicle.model}</h4>
                <Badge variant={vehicle.isCollectible ? 'green' : 'outline'} size="sm">
                  {vehicle.type.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="font-mono font-bold text-lg mb-2">
                ${vehicle.price.toLocaleString()}
              </p>
              
              <div className="flex justify-between text-xs text-text-muted mb-3">
                <span>Prestige: {vehicle.prestige}</span>
                <span>Enjoyment: {vehicle.enjoyment}</span>
              </div>
              
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
                disabled={!canAfford}
                onClick={() => onPurchase(vehicle.index)}
              >
                {canAfford ? 'Purchase' : 'Insufficient Funds'}
              </Button>
            </Card>
          )
        })}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

interface MembershipSelectionViewProps {
  catalog: ReturnType<typeof import('@/simulation/personal/lifestyleAssetsManager').getMembershipCatalog>
  currentMemberships: Membership[]
  liquidCash: number
  netWorth: number
  onClose: () => void
  onJoin: (id: string, tier: 'standard' | 'gold' | 'platinum' | 'founding') => void
}

function MembershipSelectionView({ 
  catalog, 
  currentMemberships, 
  liquidCash, 
  netWorth,
  onClose, 
  onJoin 
}: MembershipSelectionViewProps) {
  const [selectedMembership, setSelectedMembership] = useState<string | null>(null)
  
  // Filter out memberships already owned
  const availableMemberships = catalog.filter(
    m => !currentMemberships.find(cm => cm.clubId === m.id)
  )

  const selectedClub = selectedMembership 
    ? catalog.find(m => m.id === selectedMembership)
    : null

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Available Cash: <span className="font-mono font-bold">${liquidCash.toLocaleString()}</span>
        {' '} • Net Worth: <span className="font-mono font-bold">${netWorth.toLocaleString()}</span>
      </p>
      
      {!selectedMembership ? (
        // Club Selection
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {availableMemberships.map((club) => {
            const meetsNetWorth = !club.minimumNetWorth || netWorth >= club.minimumNetWorth
            const canAfford = liquidCash >= club.initializationFee
            const isAvailable = meetsNetWorth && canAfford
            
            return (
              <div 
                key={club.id}
                className={`p-4 bg-background rounded-lg ${!isAvailable ? 'opacity-50' : 'cursor-pointer hover:bg-surface'}`}
                onClick={() => isAvailable && setSelectedMembership(club.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{club.name}</h4>
                    <p className="text-sm text-text-muted">{club.location}</p>
                  </div>
                  <Badge variant="outline" size="sm" className="capitalize">
                    {club.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-text-muted mb-2">{club.description}</p>
                
                <div className="flex gap-4 text-xs">
                  <span>Init: ${club.initializationFee.toLocaleString()}</span>
                  <span>Annual: ${club.annualFee.toLocaleString()}</span>
                  <span>+{club.prestigeBonus} prestige</span>
                </div>
                
                {!meetsNetWorth && (
                  <p className="text-xs text-status-warning mt-2">
                    Requires ${club.minimumNetWorth?.toLocaleString()} net worth
                  </p>
                )}
                {club.requiresSponsorship && (
                  <p className="text-xs text-text-muted mt-1">
                    Requires sponsorship • {club.waitlistMonths}mo waitlist
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : selectedClub && (
        // Tier Selection
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMembership(null)}>
            ← Back to clubs
          </Button>
          
          <div className="p-4 bg-surface rounded-lg">
            <h4 className="font-medium text-lg">{selectedClub.name}</h4>
            <p className="text-sm text-text-muted">{selectedClub.description}</p>
          </div>
          
          <p className="text-sm font-medium">Select Membership Tier:</p>
          
          <div className="space-y-3">
            {selectedClub.tiers.map((tier) => {
              const totalCost = selectedClub.initializationFee + tier.additionalFee
              const canAfford = liquidCash >= totalCost
              
              return (
                <div 
                  key={tier.tier}
                  className={`p-4 bg-background rounded-lg ${!canAfford ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium capitalize">{tier.tier} Tier</h5>
                    <span className="font-mono">${totalCost.toLocaleString()} to join</span>
                  </div>
                  
                  <p className="text-sm text-text-muted mb-2">
                    +{tier.additionalPrestige} additional prestige
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tier.perks.map((perk, i) => (
                      <Badge key={i} variant="outline" size="sm">{perk}</Badge>
                    ))}
                  </div>
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    disabled={!canAfford}
                    onClick={() => onJoin(selectedClub.id, tier.tier)}
                  >
                    {canAfford ? 'Join' : 'Insufficient Funds'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}
