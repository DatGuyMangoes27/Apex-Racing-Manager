import { useState } from 'react'
import { TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'

interface InvestmentsPanelProps {
  investments?: any[]
  className?: string
}

export function InvestmentsPanel({ investments = [], className = '' }: InvestmentsPanelProps) {
  return (
    <Card className={className}>
      <CardHeader title="Investments" icon={<TrendingUp className="w-4 h-4" />} />
      <div className="p-4">
        {investments.length === 0 ? (
          <p className="text-sm text-text-muted">No active investments. Visit the investments screen to get started.</p>
        ) : (
          <div className="space-y-2">
            {investments.map((inv: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-surface/50">
                <span className="text-sm text-text-primary">{inv.name || 'Investment'}</span>
                <span className="text-sm font-medium text-green-400">${(inv.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default InvestmentsPanel
