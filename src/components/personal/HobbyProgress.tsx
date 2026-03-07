import { useState, useMemo } from 'react'
import { Star, TrendingUp } from 'lucide-react'

interface HobbyProgressProps {
  hobby?: { name: string; skillLevel: number; hoursInvested: number; progressToNextLevel: number }
  className?: string
}

export function HobbyProgress({ hobby, className = '' }: HobbyProgressProps) {
  if (!hobby) return null

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{hobby.name}</span>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-text-muted">Lvl {hobby.skillLevel}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${hobby.progressToNextLevel || 0}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-text-muted">
        <span>{hobby.hoursInvested}h invested</span>
        <span>{Math.round(hobby.progressToNextLevel || 0)}% to next level</span>
      </div>
    </div>
  )
}

export default HobbyProgress
