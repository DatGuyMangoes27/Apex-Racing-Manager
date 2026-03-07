import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plane,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Users,
  Sun,
  Mountain,
  Palmtree,
  Building2,
  Camera,
  Compass,
  Star,
  Shield,
  AlertTriangle,
  Check,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Card, Badge, Button, Modal, Tabs, TabsList, TabsTrigger, TabsContent, CardHeader } from '@/components/ui'
import { DESTINATIONS, VACATION_ACTIVITIES, createVacation } from '@/data/travel-config'
import type { Destination, Vacation, VacationActivity } from '@/data/travel-config'

const DESTINATION_ICONS: Record<string, React.ReactNode> = {
  beach: <Palmtree className="w-5 h-5" />,
  mountain: <Mountain className="w-5 h-5" />,
  city: <Building2 className="w-5 h-5" />,
  adventure: <Compass className="w-5 h-5" />,
  cultural: <Camera className="w-5 h-5" />,
  tropical: <Sun className="w-5 h-5" />,
}

const LUXURY_LABELS: Record<string, { label: string; color: string }> = {
  budget: { label: 'Budget', color: 'bg-slate-500/20 text-slate-400' },
  comfortable: { label: 'Comfortable', color: 'bg-green-500/20 text-green-400' },
  luxury: { label: 'Luxury', color: 'bg-purple-500/20 text-purple-400' },
  ultra_luxury: { label: 'Ultra Luxury', color: 'bg-yellow-500/20 text-yellow-400' },
}

const TIER_STYLES: Record<string, { label: string; color: string }> = {
  budget: { label: 'Budget', color: 'bg-slate-500' },
  comfortable: { label: 'Comfortable', color: 'bg-green-500' },
  luxury: { label: 'Luxury', color: 'bg-purple-500' },
  ultra_luxury: { label: 'Ultra Luxury', color: 'bg-yellow-500' }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`
  }
  return `$${value.toLocaleString()}`
}

// ============================================
// SUB-COMPONENTS
// ============================================

function DestinationCard({
  destination,
  onSelect,
  isSelected
}: {
  destination: Destination
  onSelect: () => void
  isSelected: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        p-4 rounded-xl text-left transition-all w-full
        ${isSelected 
          ? 'bg-racing-red/20 border-2 border-racing-red' 
          : 'bg-surface-dark/50 border-2 border-transparent hover:border-racing-red/30'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            {DESTINATION_ICONS[destination.type]}
          </div>
          <div>
            <h4 className="font-medium">{destination.name}</h4>
            <p className="text-xs text-text-muted">{destination.country}</p>
          </div>
        </div>
        {destination.celebrityHotspot && (
          <Star className="w-4 h-4 text-yellow-400" />
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <Heart className="w-4 h-4 mx-auto text-pink-400 mb-1" />
          <p className="text-xs">{destination.romanticRating}/100</p>
        </div>
        <div>
          <Shield className="w-4 h-4 mx-auto text-green-400 mb-1" />
          <p className="text-xs">{destination.privacyRating}/100</p>
        </div>
        <div>
          <Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <p className="text-xs">{destination.travelTime}h</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mt-3">
        {destination.familyFriendly && (
          <Badge variant="outline" size="sm">Family</Badge>
        )}
        {destination.adventureOptions && (
          <Badge variant="outline" size="sm">Adventure</Badge>
        )}
        {destination.luxuryOptions && (
          <Badge variant="outline" size="sm">Luxury</Badge>
        )}
      </div>
    </motion.button>
  )
}

function UpcomingVacationCard({
  vacation,
  onCancel
}: {
  vacation: Vacation
  onCancel: () => void
}) {
  return (
    <Card variant="glass" padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium">{vacation.destination.name}</h3>
            <p className="text-sm text-text-muted">{vacation.destination.country}</p>
          </div>
        </div>
        <Badge className={LUXURY_LABELS[vacation.luxuryLevel].color}>
          {LUXURY_LABELS[vacation.luxuryLevel].label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-muted" />
          <span className="text-sm">Week {vacation.startDate.week}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-sm">{vacation.duration} days</span>
        </div>
      </div>
      
      {vacation.companions.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-text-muted" />
          <span className="text-sm">{vacation.companions.map(c => c.name).join(', ')}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-3 border-t border-border/10">
        <div>
          <p className="text-xs text-text-muted">Total Cost</p>
          <p className="font-bold">{formatCurrency(vacation.totalCost)}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel Trip
        </Button>
      </div>
    </Card>
  )
}

function PlanVacationModal({
  isOpen,
  onClose,
  availableWeeks,
  partnerName,
  children,
  budget,
  onPlan
}: {
  isOpen: boolean
  onClose: () => void
  availableWeeks: number[]
  partnerName?: string
  children: { firstName: string }[]
  budget: number
  onPlan: (vacation: Vacation) => void
}) {
  const [step, setStep] = useState(1)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number>(availableWeeks[0] || 1)
  const [duration, setDuration] = useState(7)
  const [luxuryLevel, setLuxuryLevel] = useState<'budget' | 'comfortable' | 'luxury' | 'ultra_luxury'>('comfortable')
  const [companions, setCompanions] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  
  const estimatedCost = useMemo(() => {
    if (!selectedDestination) return 0
    const baseCost = {
      budget: 200,
      comfortable: 500,
      luxury: 1500,
      ultra_luxury: 5000
    }[luxuryLevel] * duration
    
    const activityCost = selectedActivities.reduce((sum, actId) => {
      const allActivities = Object.values(VACATION_ACTIVITIES).flat()
      const activity = allActivities.find(a => (a as any).id === actId)
      return sum + ((activity as any)?.cost || 0)
    }, 0)
    
    return baseCost + activityCost
  }, [selectedDestination, duration, luxuryLevel, selectedActivities])
  
  const handlePlan = () => {
    if (!selectedDestination) return
    
    const vacation = createVacation(
      selectedDestination,
      { week: selectedWeek, day: 1, year: new Date().getFullYear() },
      duration,
      luxuryLevel
    )
    
    // Add companions and activities
    vacation.companions = companions.map(name => ({
      id: `companion_${name}`,
      name,
      relationship: (partnerName && name === partnerName ? 'partner' : 
                    children.some(c => c.firstName === name) ? 'child' : 'friend') as 'partner' | 'child' | 'friend',
      addedCost: 0
    }))
    const allActivities = Object.values(VACATION_ACTIVITIES).flat().map((act, idx) => ({ ...act, id: `activity_${idx}` }))
    vacation.activities = selectedActivities
      .map(id => allActivities.find(a => a.id === id))
      .filter((a): a is VacationActivity => a !== undefined)
    
    onPlan(vacation)
    onClose()
    setStep(1)
  }
  
  const toggleCompanion = (name: string) => {
    setCompanions(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }
  
  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan Vacation" size="xl">
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-racing-red text-white' : 'bg-surface-dark text-text-muted'}
              `}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 rounded ${step > s ? 'bg-racing-red' : 'bg-surface-dark'}`} />
              )}
            </div>
          ))}
        </div>
        
        {step === 1 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Choose Destination</h4>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {DESTINATIONS.map(dest => (
                  <DestinationCard
                    key={dest.id}
                    destination={dest}
                    isSelected={selectedDestination?.id === dest.id}
                    onSelect={() => setSelectedDestination(dest)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!selectedDestination}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">When?</h4>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full bg-surface-dark border border-border/20 rounded-lg px-4 py-2"
                >
                  {availableWeeks.map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
                
                <h4 className="font-medium mt-4 mb-3">Duration</h4>
                <div className="flex gap-2">
                  {[3, 5, 7, 10, 14].map(days => (
                    <Button
                      key={days}
                      variant={duration === days ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setDuration(days)}
                    >
                      {days} days
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Luxury Level</h4>
                <div className="space-y-2">
                  {(['budget', 'comfortable', 'luxury', 'ultra_luxury'] as const).map(level => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setLuxuryLevel(level)}
                      className={`
                        w-full p-3 rounded-lg text-left flex items-center justify-between
                        ${luxuryLevel === level 
                          ? 'bg-racing-red/20 border-2 border-racing-red' 
                          : 'bg-surface-dark/50 border-2 border-transparent'
                        }
                      `}
                    >
                      <span className="capitalize">{level.replace('_', ' ')}</span>
                      <span className="text-sm text-text-muted">
                        ~${level === 'budget' ? 200 : level === 'comfortable' ? 500 : level === 'luxury' ? 1500 : 5000}/night
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Who's coming?</h4>
              <div className="flex flex-wrap gap-2">
                {partnerName && (
                  <Button
                    variant={companions.includes(partnerName) ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => toggleCompanion(partnerName)}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {partnerName}
                  </Button>
                )}
                {children.map(child => (
                  <Button
                    key={child.firstName}
                    variant={companions.includes(child.firstName) ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => toggleCompanion(child.firstName)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    {child.firstName}
                  </Button>
                ))}
                <Button
                  variant={companions.includes('Friends') ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => toggleCompanion('Friends')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Friends
                </Button>
              </div>
              
              {companions.length === 0 && (
                <p className="text-sm text-text-muted mt-2">Solo trip selected</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Activities</h4>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {Object.values(VACATION_ACTIVITIES).flat().map((act, idx) => ({ ...act, id: `activity_${idx}` })).filter((a: VacationActivity) => 
                  !selectedDestination || a.type === 'relaxation' || 
                  (selectedDestination.adventureOptions && a.type === 'adventure') ||
                  (selectedDestination.romanticRating > 50 && a.type === 'romantic')
                ).map((activity: VacationActivity) => (
                  <motion.button
                    key={activity.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleActivity(activity.id)}
                    className={`
                      p-3 rounded-lg text-left
                      ${selectedActivities.includes(activity.id) 
                        ? 'bg-racing-red/20 border-2 border-racing-red' 
                        : 'bg-surface-dark/50 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{activity.name}</span>
                      <span className="text-xs text-text-muted">{formatCurrency(activity.cost)}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{activity.duration}h</p>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
        
        {step === 4 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Trip Summary</h4>
              <Card variant="glass" padding="lg">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Destination</span>
                    <span className="font-medium">{selectedDestination?.name}, {selectedDestination?.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Dates</span>
                    <span>Week {selectedWeek} • {duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Style</span>
                    <Badge className={LUXURY_LABELS[luxuryLevel].color}>
                      {LUXURY_LABELS[luxuryLevel].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Travelers</span>
                    <span>{companions.length > 0 ? companions.join(', ') : 'Solo'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Activities</span>
                    <span>{selectedActivities.length} planned</span>
                  </div>
                  
                  <div className="pt-3 border-t border-border/10">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Total</span>
                      <span className="text-2xl font-bold text-racing-red">{formatCurrency(estimatedCost)}</span>
                    </div>
                    {estimatedCost > budget && (
                      <div className="flex items-center gap-2 mt-2 text-yellow-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Exceeds available budget ({formatCurrency(budget)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Benefits Preview */}
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <h5 className="font-medium text-green-400 mb-2">Expected Benefits</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-400">-15%</p>
                    <p className="text-xs text-text-muted">Stress</p>
                  </div>
                  {companions.includes(partnerName || '') && (
                    <div>
                      <p className="text-lg font-bold text-pink-400">+10</p>
                      <p className="text-xs text-text-muted">Relationship</p>
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-blue-400">+3</p>
                    <p className="text-xs text-text-muted">Memories</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={handlePlan}>
                <Plane className="w-4 h-4 mr-1" />
                Book Vacation
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function VacationPlanner({
  upcomingVacations,
  pastVacations,
  availableWeeks,
  currentStress,
  partnerName,
  children,
  budget,
  onPlanVacation,
  onCancelVacation
}: VacationPlannerProps) {
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  
  // Calculate vacation stats
  const totalVacationDays = useMemo(() =>
    pastVacations.reduce((sum, v) => sum + v.duration, 0),
    [pastVacations]
  )
  
  const totalMemories = useMemo(() =>
    pastVacations.reduce((sum, v) => sum + (v.outcomes?.memorablesMoments?.length || 0), 0),
    [pastVacations]
  )
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="racing" padding="md" className="col-span-1">
          <div className="flex items-center gap-3">
            <Plane className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{upcomingVacations.length}</p>
              <p className="text-xs text-text-muted">Planned Trips</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Sun className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{totalVacationDays}</p>
          <p className="text-xs text-text-muted">Days Away</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Camera className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{totalMemories}</p>
          <p className="text-xs text-text-muted">Memories</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${currentStress > 70 ? 'text-red-400' : currentStress > 40 ? 'text-yellow-400' : 'text-green-400'}`} />
          <p className="text-xl font-bold">{currentStress}%</p>
          <p className="text-xs text-text-muted">Stress Level</p>
        </Card>
      </div>
      
      {/* Stress Warning */}
      {currentStress > 60 && (
        <Card variant="glass" padding="md" className="bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-400">High Stress Detected</h4>
              <p className="text-sm text-text-muted">
                Consider planning a vacation to reduce stress and improve performance.
              </p>
            </div>
            <Button onClick={() => setShowPlanModal(true)}>
              Plan Trip
            </Button>
          </div>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingVacations.length})</TabsTrigger>
          <TabsTrigger value="past">Past Trips ({pastVacations.length})</TabsTrigger>
          <TabsTrigger value="explore">Explore Destinations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Upcoming Vacations</h3>
              <Button onClick={() => setShowPlanModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Plan New Trip
              </Button>
            </div>
            
            {upcomingVacations.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {upcomingVacations.map(vacation => (
                  <UpcomingVacationCard
                    key={vacation.id}
                    vacation={vacation}
                    onCancel={() => onCancelVacation(vacation.id)}
                  />
                ))}
              </div>
            ) : (
              <Card variant="glass" padding="lg" className="text-center">
                <Plane className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Trips Planned</h3>
                <p className="text-text-muted mb-4">
                  Take a break and plan your next adventure.
                </p>
                <Button onClick={() => setShowPlanModal(true)}>
                  Plan a Vacation
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="past">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Travel History" 
              icon={<Camera className="w-5 h-5" />}
              subtitle={`${pastVacations.length} trips completed`}
            />
            
            {pastVacations.length > 0 ? (
              <div className="space-y-3 mt-4">
                {pastVacations.map(vacation => (
                  <div 
                    key={vacation.id}
                    className="flex items-center justify-between p-3 bg-surface-dark/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                        {DESTINATION_ICONS[vacation.destination.type]}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{vacation.destination.name}</h4>
                        <p className="text-xs text-text-muted">
                          {vacation.duration} days • {vacation.companions.length > 0 ? vacation.companions.map(c => c.name).join(', ') : 'Solo'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{vacation.outcomes?.memorablesMoments?.length || 0} memories</p>
                      <p className="text-xs text-green-400">-{vacation.outcomes?.stressReduction || 0}% stress</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-muted">No past trips yet</p>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="explore">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Explore Destinations" 
              icon={<MapPin className="w-5 h-5" />}
              subtitle={`${DESTINATIONS.length} destinations available`}
            />
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              {DESTINATIONS.map(dest => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  isSelected={false}
                  onSelect={() => setShowPlanModal(true)}
                />
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Plan Modal */}
      <PlanVacationModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        availableWeeks={availableWeeks}
        partnerName={partnerName}
        children={children}
        budget={budget}
        onPlan={onPlanVacation}
      />
    </div>
  )
}

export default VacationPlanner
