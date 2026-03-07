/**
 * Sponsor Impact Feed Component
 * 
 * Shows media events that significantly impacted sponsor or team satisfaction.
 */

import { useState } from 'react'
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface SponsorImpact {
  id: string
  sponsorName: string
  event: string
  change: number
  timestamp?: string
}

interface SponsorImpactFeedProps {
  impacts?: SponsorImpact[]
  className?: string
}

export function SponsorImpactFeed({ impacts = [], className = '' }: SponsorImpactFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const displayItems = expanded ? impacts : impacts.slice(0, 5)

  if (impacts.length === 0) {
    return (
      <div className={`text-sm text-text-muted p-4 ${className}`}>
        No sponsor impacts to display
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayItems.map((impact, i) => (
        <div key={impact.id || i} className="flex items-center gap-3 p-2 rounded-lg bg-surface/50">
          <div className={`p-1.5 rounded ${impact.change >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {impact.change >= 0 ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">{impact.sponsorName}</div>
            <div className="text-xs text-text-muted truncate">{impact.event}</div>
          </div>
          <span className={`text-xs font-bold ${impact.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {impact.change > 0 ? '+' : ''}{impact.change}%
          </span>
        </div>
      ))}
      {impacts.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-400 hover:text-blue-300">
          {expanded ? 'Show less' : `Show ${impacts.length - 5} more`}
        </button>
      )}
    </div>
  )
}
