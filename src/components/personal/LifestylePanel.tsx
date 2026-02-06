import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, Heart, Brain, Dumbbell, Wind, Pill,
  Home, Car, Users, Coffee, Star, Sparkles,
  Plus, AlertTriangle,
  Award, Crown,
  Gem, Utensils, PawPrint, GraduationCap,
  Plane, Shirt
} from 'lucide-react'
import { 
  Card, 
  CardHeader, 
  Badge, 
  Button,
  Modal
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
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
  getDietCatalog,
  calculateTotalMonthlyCosts
} from '@/simulation/personal/lifestyleAssetsManager'
import { generatePropertyListings } from '@/simulation/investments/realEstateManager'
import { COURSE_CATALOG } from '@/data/education-config'

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
    getPropertyListings,
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
    return (personalLife as any)?.education?.activeCourses || []
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
  const propertyCatalog = useMemo(() => getPropertyListings(), [])
  const courseCatalog = useMemo(() => getCourseCatalog(), [])
  
  // Computed values
  const totalVehicleValue = useMemo(() => 
    assets.vehicles.reduce((sum, v) => sum + v.currentValue, 0),
    [assets.vehicles]
  )
  
  const monthlyMembershipCost = useMemo(() => 
    assets.memberships.reduce((sum, m) => sum + (m.annualFee / 12), 0),
    [assets.memberships]
  )
  
  const totalFurnishingValue = useMemo(() => 
    assets.furnishings.reduce((sum, f) => sum + f.currentValue, 0),
    [assets.furnishings]
  )
  
  const monthlyServiceCost = useMemo(() => 
    (assets.services || []).reduce((sum, s) => sum + s.monthlyFee, 0),
    [assets.services]
  )
  
  const totalCollectibleValue = useMemo(() => 
    (assets.collectibles || []).reduce((sum, c) => sum + c.currentValue, 0),
    [assets.collectibles]
  )
  
  const monthlyHobbyCost = useMemo(() => 
    hobbies.reduce((sum, h) => sum + (h.currentMonthlyCost || 0), 0),
    [hobbies]
  )
  
  const monthlyStaffCost = useMemo(() => 
    staff.reduce((sum, s) => sum + (s.salary / 12), 0),
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
      {/* Health Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <HealthMetric icon={<Heart className="w-5 h-5" />} label="Health" value={health.physicalHealth} color="red" />
        <HealthMetric icon={<Brain className="w-5 h-5" />} label="Mental" value={health.mentalHealth} color="purple" />
        <HealthMetric icon={<Dumbbell className="w-5 h-5" />} label="Fitness" value={health.fitness} color="blue" />
        <HealthMetric icon={<Wind className="w-5 h-5" />} label="Stress" value={health.stress} color="orange" inverted />
      </div>

      {/* Lifestyle Score */}
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg mb-1">Lifestyle Score</h3>
            <p className="text-sm text-text-muted capitalize">{lifestyleLevel.replace('_', ' ')}</p>
          </div>
          <ScoreComponent label="Score" value={health.lifestyleScore || 0} max={100} />
        </div>
      </Card>

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
              <button className="w-full text-[10px] text-status-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { const r = (buyProperty as any)(prop.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Sold' : 'Failed', message: r.message }) }}>
                Sell
              </button>
            </CompactItemRow>
          )) : <EmptySection icon={<Home className="w-8 h-8" />} label="No properties" actionLabel="Browse" onAction={() => setShowPropertyModal(true)} />}
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
              onSell={(id) => { const r = sellOwnedVehicle(id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Vehicle Sold' : 'Sale Failed', message: r.message }) }}
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
                onClick={() => { const r = sellOwnedFurnishing(f.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Sold' : 'Failed', message: r.message }) }}>
                Sell
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
                onClick={() => { const r = sellOwnedCollectible(c.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Sold' : 'Failed', message: r.message }) }}>
                Sell
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
                onClick={() => { const r = sellOwnedWardrobeItem(item.id); addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Sold' : 'Failed', message: r.message }) }}>
                Sell
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

        {/* Fitness & Workouts */}
        <Card variant="glass" padding="sm" className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <Dumbbell className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="font-medium text-sm">Workouts</span>
          </div>
          <div className="space-y-1.5">
            {FITNESS_ACTIVITIES.map((activity) => {
              const canDo = hoursRemaining >= activity.hoursRequired
              return (
                <div key={activity.id} className="p-2 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">{activity.name}</span>
                    <Badge variant="outline" size="xs" className="text-[9px]">{activity.hoursRequired}h</Badge>
                  </div>
                  <p className="text-[10px] text-text-muted mb-1.5">{activity.description}</p>
                  <div className="flex gap-2 text-[10px] text-text-muted mb-1.5">
                    {activity.benefits.fitnessBonus ? <span>+{activity.benefits.fitnessBonus} fitness</span> : null}
                    {activity.benefits.stressReduction ? <span>-{activity.benefits.stressReduction} stress</span> : null}
                    {activity.benefits.healthBonus ? <span>+{activity.benefits.healthBonus} health</span> : null}
                  </div>
                  <button
                    className={`w-full text-[10px] py-1 rounded transition-colors ${
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

      </div>

      {/* Hobby Selection Modal */}
      <Modal
        isOpen={showHobbyModal}
        onClose={() => setShowHobbyModal(false)}
        title="Start a New Hobby"
        size="lg"
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
        size="lg"
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
        size="lg"
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
        size="lg"
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
      <Modal isOpen={showFurnishingModal} onClose={() => setShowFurnishingModal(false)} title="Home Furnishings" size="lg">
        <CatalogGrid
          items={furnishingCatalog.map((f, i) => ({ id: f.id, name: f.name, description: f.description, price: f.basePrice, tags: [f.category, f.tier], index: i }))}
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
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title="Luxury Services" size="lg">
        <CatalogGrid
          items={serviceCatalog.map((s, i) => ({ id: s.id, name: s.name, description: s.description, price: s.monthlyFee, tags: [s.type], index: i, priceLabel: '/mo' }))}
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
      <Modal isOpen={showExperienceModal} onClose={() => setShowExperienceModal(false)} title="Experiences & Travel" size="lg">
        <CatalogGrid
          items={experienceCatalog.map((e, i) => ({ id: e.id, name: e.name, description: e.description, price: e.cost, tags: [e.type, e.duration], index: i }))}
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
      <Modal isOpen={showCollectibleModal} onClose={() => setShowCollectibleModal(false)} title="Collectibles Market" size="lg">
        <CatalogGrid
          items={collectibleCatalog.map((c, i) => ({ id: c.id, name: c.name, description: c.description, price: c.basePrice, tags: [c.category, c.rarity], index: i }))}
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
      <Modal isOpen={showPetModal} onClose={() => setShowPetModal(false)} title="Adopt a Pet" size="lg">
        <CatalogGrid
          items={petCatalog.map((p, i) => ({ id: p.id, name: `${p.breed}`, description: p.description, price: p.basePrice, tags: [p.type, `$${p.monthlyUpkeep}/mo upkeep`], index: i }))}
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
      <Modal isOpen={showWardrobeModal} onClose={() => setShowWardrobeModal(false)} title="Fashion & Wardrobe" size="lg">
        <CatalogGrid
          items={wardrobeCatalog.map((w, i) => ({ id: w.id, name: w.name, description: `${w.brand} - ${w.description}`, price: w.basePrice, tags: [w.category], index: i }))}
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
      <Modal isOpen={showDietModal} onClose={() => setShowDietModal(false)} title="Diet & Nutrition Plans" size="lg">
        <CatalogGrid
          items={dietCatalog.map((d, i) => ({ id: d.id, name: d.name, description: d.description, price: d.monthlyFee, tags: [d.type, `+${d.healthBonus} health`, `+${d.fitnessBonus} fitness`], index: i, priceLabel: '/mo' }))}
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

      {/* Property Purchase Modal */}
      <Modal isOpen={showPropertyModal} onClose={() => setShowPropertyModal(false)} title="Real Estate Listings" size="lg">
        <CatalogGrid
          items={propertyCatalog.map((p: any, i: number) => ({ id: p.id || `prop_${i}`, name: p.name, description: `${p.location || 'Location TBD'} - ${p.type?.replace('_', ' ') || 'Property'}`, price: p.listPrice || p.price || 0, tags: [p.type?.replace('_', ' ') || ''], index: i }))}
          liquidCash={finances.liquidCash}
          onPurchase={(item) => {
            const r = buyProperty(item.index)
            addToast({ type: r.success ? 'success' : 'error', title: r.success ? 'Property Purchased!' : 'Failed', message: r.message })
            if (r.success) setShowPropertyModal(false)
          }}
          onClose={() => setShowPropertyModal(false)}
        />
      </Modal>

      {/* Course Enrollment Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Education & Courses" size="lg">
        <CatalogGrid
          items={courseCatalog.map((c: any, i: number) => ({ id: `course_${i}`, name: c.name, description: `${c.provider} - ${c.format?.replace('_', ' ')} (${c.totalHours}h)`, price: c.enrollmentFee, tags: [c.category, c.format?.replace('_', ' ')], index: i }))}
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
}

interface CatalogGridProps {
  items: CatalogGridItem[]
  liquidCash: number
  onPurchase: (item: CatalogGridItem) => void
  onClose: () => void
  actionLabel?: string
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
      
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {filteredItems.map((item) => {
          const canAfford = liquidCash >= item.price
          return (
            <Card key={item.id} variant="default" padding="sm" className={!canAfford ? 'opacity-50' : ''}>
              <h4 className="font-medium text-sm mb-1">{item.name}</h4>
              <p className="text-xs text-text-muted mb-2 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="outline" size="xs" className="capitalize text-[9px]">{tag.replace('_', ' ')}</Badge>
                ))}
              </div>
              <p className="font-mono font-bold text-sm mb-2">${item.price.toLocaleString()}{item.priceLabel || ''}</p>
              <Button variant="primary" size="xs" className="w-full" disabled={!canAfford}
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
  const displayValue = inverted ? value : value
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
  // Get config from hobby data or use defaults
  const config = (hobby as any).config || { stressReduction: 10, name: hobby.name }
  const activityConfig = HOBBY_ACTIVITY_CONFIG[hobby.type as HobbyType]
  const hoursNeeded = activityConfig?.hoursRequired ?? 2
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
        Practice ({hoursNeeded}h, -{config?.stressReduction || 0} stress)
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
      {/* Name */}
      <div className="flex items-center gap-1 mb-1">
        <span className="font-medium text-xs truncate">{staff.name}</span>
      </div>
      
      {/* Role */}
      <p className="text-[10px] text-text-muted mb-1 capitalize truncate">
        {staff.role.replace('_', ' ')} • {staff.yearsEmployed}yr{staff.yearsEmployed !== 1 ? 's' : ''}
      </p>
      
      {/* Salary & Satisfaction */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-xs font-bold">${Math.round(staff.salary / 12).toLocaleString()}/mo</span>
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
  // Get hobby templates from the hook or use a default list
  const hobbyTypes: HobbyType[] = ['golf', 'yachting', 'car_collecting', 'horse_racing', 'art_collecting', 'wine_collecting', 'flying', 'fishing', 'photography']
  const availableHobbies = hobbyTypes
    .filter(type => !currentHobbies.find(h => h.type === type))
    .map(type => [type, { name: type.replace('_', ' '), description: `${type} hobby`, initialInvestment: 5000, annualCost: 2000, stressReduction: 10, networkingOpportunities: 0 }])

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Hobbies help reduce stress and can provide networking opportunities.
      </p>
      
      <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
        {availableHobbies.map(([type, config]) => (
          <Card key={type} variant="default" padding="md" hoverable className="cursor-pointer">
            <h4 className="font-medium mb-2">{config.name}</h4>
            <p className="text-sm text-text-muted mb-3">{config.description}</p>
            
            <div className="space-y-1 text-xs text-text-muted mb-3">
              <p>Initial investment: ${config.initialInvestment.toLocaleString()}</p>
              <p>Annual cost: ${config.annualCost.toLocaleString()}</p>
              <p>Stress reduction: -{config.stressReduction}/session</p>
              {config.networkingOpportunities > 0 && (
                <p>Networking: +{config.networkingOpportunities}</p>
              )}
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
  // Get staff templates from the hook or use default roles
  const staffRoles: StaffRole[] = ['personal_assistant', 'chef', 'driver', 'security', 'trainer', 'therapist']
  const availableRoles = staffRoles
    .filter(role => !currentStaff.find(s => s.role === role))
    .map(role => [role, { description: `${role.replace('_', ' ')} role`, benefits: { stressReduction: 5 }, baseSalary: 50000 }])

  return (
    <div className="space-y-4">
      <p className="text-text-muted">
        Personal staff can help manage your daily life and reduce stress.
      </p>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {availableRoles.map(([role, config]) => (
          <div 
            key={role}
            className="flex items-center justify-between p-4 bg-background rounded-lg"
          >
            <div>
              <h4 className="font-medium capitalize">{role.replace('_', ' ')}</h4>
              <p className="text-sm text-text-muted">{config.description}</p>
              <div className="flex gap-2 mt-2">
                {config.benefits.stressReduction && config.benefits.stressReduction > 0 && (
                  <Badge variant="outline" size="sm">
                    -{config.benefits.stressReduction} stress
                  </Badge>
                )}
                {config.benefits.timeFreedPerWeek && config.benefits.timeFreedPerWeek > 0 && (
                  <Badge variant="outline" size="sm">
                    +{config.benefits.timeFreedPerWeek}h freed
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg">
                ${config.baseSalary.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">per year</p>
              <Button 
                variant="primary" 
                size="sm" 
                className="mt-2"
                onClick={() => onHire(role)}
              >
                Hire
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Cancel
      </Button>
    </div>
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
          Sell
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
      
      <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
        {filteredVehicles.map((vehicle) => {
          const canAfford = liquidCash >= vehicle.price
          return (
            <Card 
              key={vehicle.index} 
              variant="default" 
              padding="md"
              className={!canAfford ? 'opacity-50' : ''}
            >
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
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
