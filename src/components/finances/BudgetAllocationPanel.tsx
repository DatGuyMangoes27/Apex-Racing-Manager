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
  useToast
} from '@/components/ui';
  const getValueColor = (val: string) => {
    if (['Fast', 'High', 'Secure'].includes(val)) return 'text-status-success'
    if (['Normal', 'Medium', 'Moderate'].includes(val)) return 'text-status-warning'
    return 'text-status-danger'
  }
  
  const getValueIcon = (val: string) => {
    if (['Fast', 'High', 'Secure'].includes(val)) return <TrendingUp className="w-4 h-4" />
    if (['Normal', 'Medium', 'Moderate'].includes(val)) return <Zap className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`flex items-center gap-1 font-medium ${getValueColor(value)}`}>
        {getValueIcon(value)}
        <span>{value}</span>
      </div>
    </div>
  )
}

export default BudgetAllocationPanel
