import { motion } from 'framer-motion'
import { 
  Target, 
  Wind, 
  Car, 
  Zap, 
  Cpu, 
  Scale,
  Minus,
  Plus
} from 'lucide-react'
import { Card, CardHeader, Button } from '@/components/ui'
import { DevelopmentArea, DevelopmentBudget, formatBudget } from '@/simulation/teamDevelopment'

interface BudgetAllocatorProps {
  budget: DevelopmentBudget
  onSetFocus: (area: DevelopmentArea | 'balanced') => void
  onSetAllocation: (amount: number) => void
}

export function BudgetAllocator({ 
  budget, 
  onSetFocus, 
  onSetAllocation 
}: BudgetAllocatorProps) {
  const focusOptions: Array<{ id: DevelopmentArea | 'balanced'; name: string; icon: React.ReactNode; description: string }> = [
    { id: 'balanced', name: 'Balanced', icon: <Scale className="w-4 h-4" />, description: 'Equal focus on all areas' },
    { id: 'aerodynamics', name: 'Aero', icon: <Wind className="w-4 h-4" />, description: 'Qualifying & top speed' },
    { id: 'chassis', name: 'Chassis', icon: <Car className="w-4 h-4" />, description: 'Handling & consistency' },
    { id: 'powertrain', name: 'Power', icon: <Zap className="w-4 h-4" />, description: 'Race pace & reliability' },
    { id: 'electronics', name: 'Elec', icon: <Cpu className="w-4 h-4" />, description: 'Wet & starts' },
  ]
  
  // Calculate allocation steps
  const minAllocation = 0
  const maxAllocation = Math.min(budget.remaining, budget.seasonTotal / 10)
  const step = Math.max(1000, Math.round(maxAllocation / 20))
  
  const handleIncrease = () => {
    const newAmount = Math.min(maxAllocation, budget.weeklyAllocation + step)
    onSetAllocation(newAmount)
  }
  
  const handleDecrease = () => {
    const newAmount = Math.max(minAllocation, budget.weeklyAllocation - step)
    onSetAllocation(newAmount)
  }
  
  const percentUsed = budget.seasonTotal > 0 
    ? ((budget.seasonTotal - budget.remaining) / budget.seasonTotal) * 100 
    : 0
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Development Strategy" 
        icon={<Target className="w-4 h-4 text-accent-orange" />}
      />
      
      <div className="space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">Season Budget</p>
            <p className="font-mono font-bold text-status-info">
              {formatBudget(budget.seasonTotal)}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">Remaining</p>
            <p className="font-mono font-bold text-status-success">
              {formatBudget(budget.remaining)}
            </p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">From Results</p>
            <p className="font-mono font-bold text-accent-gold">
              +{formatBudget(budget.bonusFromResults)}
            </p>
          </div>
        </div>
        
        {/* Budget Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Budget Used</span>
            <span className="text-text-muted">{Math.round(percentUsed)}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                percentUsed > 90 ? 'bg-status-error' :
                percentUsed > 70 ? 'bg-status-warning' :
                'bg-status-success'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
        
        {/* Weekly Allocation Control */}
        <div>
          <label className="text-sm font-medium mb-2 block">Weekly Budget Allocation</label>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleDecrease}
              disabled={budget.weeklyAllocation <= minAllocation}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 text-center">
              <p className="font-mono font-bold text-xl">
                {formatBudget(budget.weeklyAllocation)}
              </p>
              <p className="text-xs text-text-muted">per week</p>
            </div>
            
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleIncrease}
              disabled={budget.weeklyAllocation >= maxAllocation}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Slider visualization */}
          <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-orange transition-all"
              style={{ width: maxAllocation > 0 ? `${(budget.weeklyAllocation / maxAllocation) * 100}%` : '0%' }}
            />
          </div>
        </div>
        
        {/* Focus Area Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Development Focus</label>
          <div className="grid grid-cols-5 gap-2">
            {focusOptions.map(option => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSetFocus(option.id)}
                className={`
                  p-3 rounded-lg border text-center transition-all
                  ${budget.focusArea === option.id 
                    ? 'bg-accent-orange/20 border-accent-orange' 
                    : 'bg-surface border-surface-border hover:border-accent-orange/50'
                  }
                `}
              >
                <div className={`mx-auto mb-1 ${budget.focusArea === option.id ? 'text-accent-orange' : 'text-text-muted'}`}>
                  {option.icon}
                </div>
                <p className="text-xs font-medium">{option.name}</p>
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">
            {focusOptions.find(o => o.id === budget.focusArea)?.description}
          </p>
        </div>
        
        {/* Allocation Preview */}
        {budget.focusArea !== 'balanced' && (
          <div className="p-3 bg-accent-orange/10 rounded-lg border border-accent-orange/30">
            <p className="text-xs text-accent-orange">
              <strong>{focusOptions.find(o => o.id === budget.focusArea)?.name}</strong> will receive 60% of development points, 
              other areas split the remaining 40%
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

