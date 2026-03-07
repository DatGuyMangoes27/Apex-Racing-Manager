import { useState } from 'react'
import { Wrench, Zap, TrendingUp } from 'lucide-react'

export function RnDTab() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-text-primary">Research & Development</h2>
      </div>
      <p className="text-sm text-text-muted">
        Manage your team's R&D priorities and development direction.
      </p>
    </div>
  )
}

export default RnDTab
