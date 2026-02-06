// ============================================
// FINANCIAL CHARTS COMPONENT
// ============================================
// Simple chart visualizations for financial data

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { TeamTransaction, TeamTransactionCategory } from '@/store/careerStore'
import { formatCurrency } from '@/data/financial-config'

interface FinancialChartsProps {
  transactions: TeamTransaction[]
  currentWeek: number
  currentYear: number
}

const CATEGORY_LABELS: Record<TeamTransactionCategory, string> = {
  team_sponsor: 'Sponsors',
  prize_race: 'Race Prizes',
  prize_championship: 'Championship',
  manufacturer_support: 'Manufacturer',
  series_revenue: 'Series Revenue',
  entry_fee: 'Entry Fees',
  manufacturer_lease: 'Lease',
  development: 'Development',
  travel: 'Travel',
  facilities: 'Facilities',
  salaries: 'Staff Salaries',
  marketing: 'Marketing',
  sponsor_event: 'Sponsor Events',
  sponsor_bonus: 'Sponsor Bonuses',
  car_maintenance: 'Maintenance',
  repairs: 'Repairs',
  other: 'Other',
  loan_disbursement: 'Loan Disbursement',
  loan_payment: 'Loan Payment',
  loan_interest: 'Loan Interest',
  credit_line_draw: 'Credit Line Draw',
  credit_line_repay: 'Credit Line Repay',
  credit_line_fee: 'Credit Line Fee',
  investor_milestone_penalty: 'Investor Penalty',
  investment_purchase: 'Investment Purchase',
  investment_sale: 'Investment Sale',
  investment_income: 'Investment Income',
  dividend: 'Dividend',
  rental_income: 'Rental Income',
  business_revenue: 'Business Revenue',
  business_expense: 'Business Expense',
  equity_sale: 'Equity Sale',
  merchandise_sales: 'Merchandise Sales',
  merchandise_production: 'Merchandise Production',
  merchandise_store_costs: 'Store Costs'
}

const INCOME_COLORS = [
  'bg-accent-gold',
  'bg-status-success',
  'bg-blue-500',
  'bg-purple-500',
  'bg-cyan-500'
]

const EXPENSE_COLORS = [
  'bg-status-danger',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-red-400'
]

interface CategoryBreakdown {
  category: TeamTransactionCategory
  amount: number
  percentage: number
  color: string
}

export function FinancialCharts({ 
  transactions, 
  currentWeek, 
  currentYear 
}: FinancialChartsProps) {
  // Calculate income breakdown by category
  const incomeBreakdown = useMemo((): CategoryBreakdown[] => {
    const incomeByCategory = transactions
      .filter(tx => tx.type === 'income' && tx.year === currentYear)
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount
        return acc
      }, {} as Record<TeamTransactionCategory, number>)
    
    const total = Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0)
    
    return Object.entries(incomeByCategory)
      .map(([category, amount], idx) => ({
        category: category as TeamTransactionCategory,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: INCOME_COLORS[idx % INCOME_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, currentYear])
  
  // Calculate expense breakdown by category
  const expenseBreakdown = useMemo((): CategoryBreakdown[] => {
    const expenseByCategory = transactions
      .filter(tx => tx.type === 'expense' && tx.year === currentYear)
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount
        return acc
      }, {} as Record<TeamTransactionCategory, number>)
    
    const total = Object.values(expenseByCategory).reduce((sum, val) => sum + val, 0)
    
    return Object.entries(expenseByCategory)
      .map(([category, amount], idx) => ({
        category: category as TeamTransactionCategory,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: EXPENSE_COLORS[idx % EXPENSE_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, currentYear])
  
  // Calculate weekly cash flow trend
  const weeklyTrend = useMemo(() => {
    const weeklyData: { week: number; income: number; expenses: number; net: number }[] = []
    
    // Group transactions by week for current year
    const weeklyGroups = transactions
      .filter(tx => tx.year === currentYear)
      .reduce((acc, tx) => {
        if (!acc[tx.week]) {
          acc[tx.week] = { income: 0, expenses: 0 }
        }
        if (tx.type === 'income') {
          acc[tx.week].income += tx.amount
        } else {
          acc[tx.week].expenses += tx.amount
        }
        return acc
      }, {} as Record<number, { income: number; expenses: number }>)
    
    // Convert to array and calculate net
    for (let week = 1; week <= currentWeek; week++) {
      const data = weeklyGroups[week] || { income: 0, expenses: 0 }
      weeklyData.push({
        week,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      })
    }
    
    return weeklyData
  }, [transactions, currentWeek, currentYear])
  
  // Get max value for scaling bar charts
  const maxWeeklyValue = useMemo(() => {
    return Math.max(
      ...weeklyTrend.map(w => Math.max(w.income, w.expenses)),
      1 // Prevent division by zero
    )
  }, [weeklyTrend])
  
  // Total income and expenses
  const totals = useMemo(() => {
    const income = incomeBreakdown.reduce((sum, item) => sum + item.amount, 0)
    const expenses = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [incomeBreakdown, expenseBreakdown])
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income Breakdown */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Income Sources" 
          subtitle={`Total: ${formatCurrency(totals.income)}`}
          icon={<TrendingUp className="w-5 h-5 text-status-success" />}
        />
        
        {/* Pie Chart Visual (Bar representation) */}
        <div className="mb-4">
          <div className="h-4 rounded-full overflow-hidden flex bg-surface">
            {incomeBreakdown.map((item, idx) => (
              <motion.div
                key={item.category}
                className={item.color}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {incomeBreakdown.map((item, idx) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-sm">{CATEGORY_LABELS[item.category]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">{item.percentage.toFixed(1)}%</span>
                <span className="text-sm font-mono text-status-success">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </motion.div>
          ))}
          
          {incomeBreakdown.length === 0 && (
            <p className="text-center py-4 text-text-muted">No income recorded yet</p>
          )}
        </div>
      </Card>
      
      {/* Expense Breakdown */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Expense Breakdown" 
          subtitle={`Total: ${formatCurrency(totals.expenses)}`}
          icon={<TrendingDown className="w-5 h-5 text-status-danger" />}
        />
        
        {/* Pie Chart Visual (Bar representation) */}
        <div className="mb-4">
          <div className="h-4 rounded-full overflow-hidden flex bg-surface">
            {expenseBreakdown.map((item, idx) => (
              <motion.div
                key={item.category}
                className={item.color}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {expenseBreakdown.map((item, idx) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-sm">{CATEGORY_LABELS[item.category]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">{item.percentage.toFixed(1)}%</span>
                <span className="text-sm font-mono text-status-danger">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </motion.div>
          ))}
          
          {expenseBreakdown.length === 0 && (
            <p className="text-center py-4 text-text-muted">No expenses recorded yet</p>
          )}
        </div>
      </Card>
      
      {/* Weekly Cash Flow */}
      <Card variant="glass" padding="lg" className="lg:col-span-2">
        <CardHeader 
          title="Weekly Cash Flow" 
          subtitle={`Season ${currentYear} - Week ${currentWeek}`}
          icon={<BarChart3 className="w-5 h-5 text-accent-gold" />}
        />
        
        {/* Net Change Summary */}
        <div className={`mb-4 p-4 rounded-lg ${
          totals.net >= 0 ? 'bg-status-success/10' : 'bg-status-danger/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm">Net Change (YTD)</span>
            <span className={`font-mono font-bold text-lg ${
              totals.net >= 0 ? 'text-status-success' : 'text-status-danger'
            }`}>
              {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
            </span>
          </div>
        </div>
        
        {/* Mini Bar Chart */}
        <div className="relative h-40 flex items-end gap-1">
          {weeklyTrend.slice(-20).map((week, idx) => {
            const incomeHeight = (week.income / maxWeeklyValue) * 100
            const expenseHeight = (week.expenses / maxWeeklyValue) * 100
            
            return (
              <div 
                key={week.week} 
                className="flex-1 flex gap-px items-end h-full"
                title={`Week ${week.week}: Income ${formatCurrency(week.income)}, Expenses ${formatCurrency(week.expenses)}`}
              >
                <motion.div
                  className="flex-1 bg-status-success/70 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${incomeHeight}%` }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                />
                <motion.div
                  className="flex-1 bg-status-danger/70 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${expenseHeight}%` }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                />
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-status-success/70 rounded" />
            <span className="text-sm text-text-muted">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-status-danger/70 rounded" />
            <span className="text-sm text-text-muted">Expenses</span>
          </div>
        </div>
        
        {weeklyTrend.length === 0 && (
          <p className="text-center py-8 text-text-muted">No data available yet</p>
        )}
      </Card>
    </div>
  )
}
