import { motion } from 'framer-motion'
import { Car, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { useCareerStore, TeamCar } from '@/store/careerStore'

interface FleetHealthWidgetProps {
  compact?: boolean
}

// Calculate overall fleet health (inverse of wear)
function calculateFleetHealth(cars: TeamCar[]): number {
  if (cars.length === 0) return 100
  const totalHealth = cars.reduce((sum, car) => sum + (100 - (car.wear ?? 0)), 0)
  return Math.round(totalHealth / cars.length)
}

// Get car health status
function getCarStatus(car: TeamCar) {
  const health = 100 - (car.wear ?? 0)
  if (health >= 80) return { color: 'text-status-success', bg: 'bg-status-success', label: 'Good' }
  if (health >= 60) return { color: 'text-accent-blue', bg: 'bg-accent-blue', label: 'Fair' }
  if (health >= 40) return { color: 'text-accent-orange', bg: 'bg-accent-orange', label: 'Worn' }
  if (health >= 20) return { color: 'text-status-warning', bg: 'bg-status-warning', label: 'Critical' }
  return { color: 'text-status-error', bg: 'bg-status-error', label: 'Failing' }
}

export function FleetHealthWidget({ compact = false }: FleetHealthWidgetProps) {
  const { careerState } = useCareerStore()
  
  const cars = careerState?.cars ?? []
  const fleetHealth = calculateFleetHealth(cars)
  const carsNeedingService = cars.filter(c => (c.wear ?? 0) > 60).length
  
  // Get overall fleet status
  const getFleetStatus = (health: number) => {
    if (health >= 80) return { color: 'text-status-success', bg: 'bg-status-success', label: 'Race Ready', variant: 'green' as const }
    if (health >= 60) return { color: 'text-accent-blue', bg: 'bg-accent-blue', label: 'Good', variant: 'blue' as const }
    if (health >= 40) return { color: 'text-accent-orange', bg: 'bg-accent-orange', label: 'Needs Work', variant: 'orange' as const }
    if (health >= 20) return { color: 'text-status-warning', bg: 'bg-status-warning', label: 'Concerning', variant: 'orange' as const }
    return { color: 'text-status-error', bg: 'bg-status-error', label: 'Critical', variant: 'red' as const }
  }
  
  const fleetStatus = getFleetStatus(fleetHealth)
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${fleetStatus.bg}/10 flex items-center justify-center ${fleetStatus.color}`}>
          <Car className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Fleet Health</p>
          <p className="font-display font-bold text-xl">{fleetHealth}%</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Fleet Status"
        icon={<Car className="w-5 h-5" />}
        action={
          <Badge variant={fleetStatus.variant} size="lg">
            {fleetStatus.label}
          </Badge>
        }
      />
      
      {/* Overall Health Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Overall Condition</span>
          <span className={`font-mono font-bold ${fleetStatus.color}`}>{fleetHealth}%</span>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${fleetStatus.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${fleetHealth}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      
      {/* Individual Cars */}
      {cars.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium">Vehicles ({cars.length})</h4>
          {cars.map((car) => {
            const carStatus = getCarStatus(car)
            const carHealth = 100 - (car.wear ?? 0)
            
            return (
              <div 
                key={car.carId} 
                className="p-3 bg-surface-secondary/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {car.inService ? (
                      <Wrench className="w-4 h-4 text-accent-orange animate-pulse" />
                    ) : carHealth < 40 ? (
                      <AlertTriangle className="w-4 h-4 text-status-warning" />
                    ) : (
                      <CheckCircle2 className={`w-4 h-4 ${carStatus.color}`} />
                    )}
                    <span className="text-sm font-medium">
                      {car.liveryName || `Car ${car.carId.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {car.inService && (
                      <Badge variant="orange" size="sm">In Service</Badge>
                    )}
                    <span className={`text-xs font-mono ${carStatus.color}`}>
                      {carHealth}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${carStatus.bg} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${carHealth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                  <span>Perf: {car.performance}</span>
                  <span>Rel: {car.reliability}</span>
                  <span>{car.mileage.toLocaleString()} km</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          No vehicles in fleet
        </p>
      )}
      
      {/* Service Warning */}
      {carsNeedingService > 0 && (
        <div className="mt-4 p-3 rounded-lg flex items-center gap-2 bg-status-warning/10 border border-status-warning/30">
          <Wrench className="w-4 h-4 text-status-warning" />
          <span className="text-sm">
            {carsNeedingService} car{carsNeedingService > 1 ? 's' : ''} need{carsNeedingService === 1 ? 's' : ''} maintenance
          </span>
        </div>
      )}
    </Card>
  )
}
