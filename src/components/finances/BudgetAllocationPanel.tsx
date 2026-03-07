/**
 * Budget Allocation Panel
 * 
 * Allows team owners to allocate funds between different budget categories,
 * view projections, and manage financial priorities.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  FlaskConical,
  Truck,
  Megaphone,
  Shield,
  AlertTriangle,
  Check,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Target
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  useToast
} from '@/components/ui';
import { useCareerStore } from '@/store/careerStore'
import type { OwnedTeam } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

interface BudgetAllocationPanelProps {
  team: OwnedTeam
  currentWeek: number
  currentYear: number
}

interface BudgetCategoryConfig {
  key: 'developmentBudget' | 'travelBudget' | 'marketingBudget' | 'contingencyBudget'
  label: string
  shortLabel: string
  icon: React.ReactNode
  color: string
  bgColor: string
  barColor: string
  description: string
  impactLabel: string
}

// ============================================
// CONFIG
// ============================================

const BUDGET_CATEGORIES: BudgetCategoryConfig[] = [
  {
    key: 'developmentBudget',
    label: 'Development & R&D',
    shortLabel: 'Development',
    icon: <FlaskConical className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    barColor: 'bg-blue-500',
    description: 'Research, upgrades, and car development',
    impactLabel: 'Dev Speed'
  },
  {
    key: 'travelBudget',
    label: 'Travel & Logistics',
    shortLabel: 'Travel',
    icon: <Truck className="w-5 h-5" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    barColor: 'bg-orange-500',
    description: 'Race travel, freight, and transport',
    impactLabel: 'Logistics'
  },
  {
    key: 'marketingBudget',
    label: 'Marketing & PR',
    shortLabel: 'Marketing',
    icon: <Megaphone className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    barColor: 'bg-purple-500',
    description: 'Sponsor attraction, events, PR',
    impactLabel: 'Visibility'
  },
  {
    key: 'contingencyBudget',
    label: 'Contingency Reserve',
    shortLabel: 'Contingency',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    barColor: 'bg-emerald-500',
    description: 'Emergency repairs, unexpected costs',
    impactLabel: 'Safety Net'
  }
]

// ============================================
// HELPERS
// ============================================

function getImpactLevel(allocated: number, total: number): 'High' | 'Medium' | 'Low' {
  if (total <= 0) return 'Low'
  const pct = allocated / total
  if (pct >= 0.2) return 'High'
  if (pct >= 0.1) return 'Medium'
  return 'Low'
}

function getImpactColor(level: 'High' | 'Medium' | 'Low') {
  if (level === 'High') return 'text-status-success'
  if (level === 'Medium') return 'text-status-warning'
  return 'text-status-danger'
}

function getImpactIcon(level: 'High' | 'Medium' | 'Low') {
  if (level === 'High') return <TrendingUp className="w-3.5 h-3.5" />
  if (level === 'Medium') return <Zap className="w-3.5 h-3.5" />
  return <TrendingDown className="w-3.5 h-3.5" />
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toLocaleString()}`
}

// ============================================
// MAIN COMPONENT
// ============================================

function BudgetAllocationPanel({ team, currentWeek, currentYear }: BudgetAllocationPanelProps) {
  const { updateOwnedTeam } = useCareerStore()
  const { addToast } = useToast()

  const budgets = team.budgets

  // Draft allocations (what the user is editing)
  const [draftAllocations, setDraftAllocations] = useState<Record<string, number>>({
    developmentBudget: budgets.developmentBudget,
    travelBudget: budgets.travelBudget,
    marketingBudget: budgets.marketingBudget,
    contingencyBudget: budgets.contingencyBudget
  })

  const [showDetails, setShowDetails] = useState(false)

  // Total allocatable = cash + all existing category allocations
  const totalPool = useMemo(() => {
    return budgets.cash
      + budgets.developmentBudget
      + budgets.travelBudget
      + budgets.marketingBudget
      + budgets.contingencyBudget
  }, [budgets])

  // Total currently allocated in draft
  const totalDraftAllocated = useMemo(() => {
    return Object.values(draftAllocations).reduce((sum, v) => sum + v, 0)
  }, [draftAllocations])

  // Remaining unallocated (what would become cash)
  const unallocated = totalPool - totalDraftAllocated

  // Check if draft differs from current
  const hasChanges = useMemo(() => {
    return (
      draftAllocations.developmentBudget !== budgets.developmentBudget ||
      draftAllocations.travelBudget !== budgets.travelBudget ||
      draftAllocations.marketingBudget !== budgets.marketingBudget ||
      draftAllocations.contingencyBudget !== budgets.contingencyBudget
    )
  }, [draftAllocations, budgets])

  // Handle slider change
  const handleSliderChange = useCallback((key: string, value: number) => {
    setDraftAllocations(prev => {
      const newAllocations = { ...prev, [key]: value }
      // Check we don't exceed total pool
      const newTotal = Object.values(newAllocations).reduce((sum, v) => sum + v, 0)
      if (newTotal > totalPool) {
        // Clamp this value to not exceed pool
        const maxAllowed = value - (newTotal - totalPool)
        return { ...prev, [key]: Math.max(0, maxAllowed) }
      }
      return newAllocations
    })
  }, [totalPool])

  // Quick presets
  const applyPreset = useCallback((preset: 'balanced' | 'development' | 'conservative' | 'aggressive') => {
    const allocatable = Math.round(totalPool * 0.45) // Leave 55% as cash
    switch (preset) {
      case 'balanced':
        setDraftAllocations({
          developmentBudget: Math.round(allocatable * 0.40),
          travelBudget: Math.round(allocatable * 0.25),
          marketingBudget: Math.round(allocatable * 0.15),
          contingencyBudget: Math.round(allocatable * 0.20)
        })
        break
      case 'development':
        setDraftAllocations({
          developmentBudget: Math.round(allocatable * 0.60),
          travelBudget: Math.round(allocatable * 0.15),
          marketingBudget: Math.round(allocatable * 0.10),
          contingencyBudget: Math.round(allocatable * 0.15)
        })
        break
      case 'conservative':
        setDraftAllocations({
          developmentBudget: Math.round(allocatable * 0.25),
          travelBudget: Math.round(allocatable * 0.20),
          marketingBudget: Math.round(allocatable * 0.15),
          contingencyBudget: Math.round(allocatable * 0.40)
        })
        break
      case 'aggressive':
        setDraftAllocations({
          developmentBudget: Math.round(allocatable * 0.55),
          travelBudget: Math.round(allocatable * 0.20),
          marketingBudget: Math.round(allocatable * 0.20),
          contingencyBudget: Math.round(allocatable * 0.05)
        })
        break
    }
  }, [totalPool])

  // Reset to current values
  const handleReset = useCallback(() => {
    setDraftAllocations({
      developmentBudget: budgets.developmentBudget,
      travelBudget: budgets.travelBudget,
      marketingBudget: budgets.marketingBudget,
      contingencyBudget: budgets.contingencyBudget
    })
  }, [budgets])

  // Apply changes
  const handleApply = useCallback(() => {
    if (unallocated < 0) {
      addToast({
        type: 'error',
        title: 'Over Budget',
        message: 'Total allocations exceed available funds. Please reduce allocations.',
        duration: 3000
      })
      return
    }

    updateOwnedTeam({
      budgets: {
        ...budgets,
        developmentBudget: draftAllocations.developmentBudget,
        travelBudget: draftAllocations.travelBudget,
        marketingBudget: draftAllocations.marketingBudget,
        contingencyBudget: draftAllocations.contingencyBudget,
        cash: unallocated
      }
    })

    addToast({
      type: 'success',
      title: 'Budget Updated',
      message: 'Budget allocations have been applied.',
      duration: 3000
    })
  }, [draftAllocations, unallocated, budgets, updateOwnedTeam, addToast])

  // Allocation percentage of total pool
  const getAllocationPct = (amount: number) => {
    if (totalPool <= 0) return 0
    return Math.round((amount / totalPool) * 100)
  }

  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Budget Allocation" 
        subtitle={`Week ${currentWeek}, Year ${currentYear} — Total Funds: ${formatCurrency(totalPool)}`}
        action={
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="orange" size="sm">Unsaved Changes</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Less' : 'Details'}
            </Button>
          </div>
        }
      />

      {/* Visual Pool Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-muted">Fund Distribution</span>
          <span className="text-sm font-mono text-text-secondary">
            {formatCurrency(unallocated)} unallocated
          </span>
        </div>
        <div className="h-4 bg-background rounded-full overflow-hidden flex">
          {BUDGET_CATEGORIES.map(cat => {
            const pct = getAllocationPct(draftAllocations[cat.key])
            if (pct <= 0) return null
            return (
              <motion.div
                key={cat.key}
                className={`h-full ${cat.barColor} first:rounded-l-full`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                title={`${cat.shortLabel}: ${pct}%`}
              />
            )
          })}
          {unallocated > 0 && (
            <motion.div
              className="h-full bg-surface-highlight/40 last:rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${getAllocationPct(unallocated)}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              title={`Unallocated: ${getAllocationPct(unallocated)}%`}
            />
          )}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {BUDGET_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cat.barColor}`} />
              <span className="text-xs text-text-muted">{cat.shortLabel}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-highlight/40" />
            <span className="text-xs text-text-muted">Unallocated</span>
          </div>
        </div>
      </div>

      {/* Category Sliders */}
      <div className="space-y-5 mb-6">
        {BUDGET_CATEGORIES.map(cat => {
          const value = draftAllocations[cat.key]
          const pct = getAllocationPct(value)
          const impact = getImpactLevel(value, totalPool)
          // Each slider always goes 0 → totalPool for consistent feel
          const sliderMax = totalPool
          const fillPct = sliderMax > 0 ? (value / sliderMax) * 100 : 0
          const sliderColor = 
            cat.key === 'developmentBudget' ? '#3b82f6' :
            cat.key === 'travelBudget' ? '#f97316' :
            cat.key === 'marketingBudget' ? '#a855f7' :
            '#10b981'

          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${cat.bgColor} flex items-center justify-center ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{cat.label}</span>
                    {showDetails && (
                      <p className="text-xs text-text-muted">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Impact indicator */}
                  <div className={`flex items-center gap-1 ${getImpactColor(impact)}`}>
                    {getImpactIcon(impact)}
                    <span className="text-xs font-medium">{impact}</span>
                  </div>
                  <span className="font-mono text-sm font-bold min-w-[80px] text-right">
                    {formatCurrency(value)}
                  </span>
                  <Badge variant="default" size="sm" className="min-w-[40px] text-center">
                    {pct}%
                  </Badge>
                </div>
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={Math.max(1000, Math.round(totalPool / 200))}
                  value={value}
                  onChange={(e) => handleSliderChange(cat.key, Number(e.target.value))}
                  className="flex-1 h-2 bg-background rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-border
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface-border
                    [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${sliderColor} ${fillPct}%, rgba(255,255,255,0.1) ${fillPct}%)`
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Over-budget warning */}
      {unallocated < 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-status-danger/10 border border-status-danger/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0" />
          <span className="text-sm text-status-danger">
            Over-allocated by {formatCurrency(Math.abs(unallocated))}. Reduce allocations before applying.
          </span>
        </div>
      )}

      {/* Preset Strategies & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted mr-1">Presets:</span>
          <Button variant="ghost" size="sm" onClick={() => applyPreset('balanced')}>
            Balanced
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyPreset('development')}>
            R&D Focus
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyPreset('conservative')}>
            Conservative
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyPreset('aggressive')}>
            Aggressive
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleApply}
            disabled={!hasChanges || unallocated < 0}
          >
            <Check className="w-4 h-4 mr-1" />
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Expanded Details - Impact Projections */}
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-surface-border"
        >
          <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Budget Impact Projections
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {BUDGET_CATEGORIES.map(cat => {
              const value = draftAllocations[cat.key]
              const impact = getImpactLevel(value, totalPool)
              const overspend = team.budgets.budgetOverspends?.[
                cat.key === 'developmentBudget' ? 'development' :
                cat.key === 'travelBudget' ? 'travel' :
                cat.key === 'marketingBudget' ? 'marketing' : 'contingency'
              ] ?? 0

              return (
                <div key={cat.key} className="p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cat.color}>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.shortLabel}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Allocated</span>
                      <span className="font-mono">{formatCurrency(value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{cat.impactLabel}</span>
                      <span className={`font-medium ${getImpactColor(impact)}`}>{impact}</span>
                    </div>
                    {overspend > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-status-danger">Overspent</span>
                        <span className="font-mono text-status-danger">-{formatCurrency(overspend)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-surface rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-text-muted">Total Funds</p>
                <p className="font-mono font-bold text-lg">{formatCurrency(totalPool)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Allocated</p>
                <p className="font-mono font-bold text-lg text-status-info">{formatCurrency(totalDraftAllocated)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Operating Cash</p>
                <p className={`font-mono font-bold text-lg ${unallocated >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                  {formatCurrency(unallocated)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  )
}

export default BudgetAllocationPanel
export { BudgetAllocationPanel }