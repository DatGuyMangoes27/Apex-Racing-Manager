import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BoardMoodWidgetProps {
  mood?: number
  className?: string
}

export function BoardMoodWidget({ mood = 50, className = '' }: BoardMoodWidgetProps) {
  const icon = mood >= 60 ? <TrendingUp className="w-4 h-4 text-green-400" /> :
               mood <= 40 ? <TrendingDown className="w-4 h-4 text-red-400" /> :
               <Minus className="w-4 h-4 text-yellow-400" />
  const label = mood >= 75 ? 'Very Happy' : mood >= 60 ? 'Satisfied' : mood >= 40 ? 'Neutral' : mood >= 25 ? 'Concerned' : 'Unhappy'

  return (
    <div className={`bg-surface rounded-lg p-3 border border-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted font-medium">Board Mood</span>
        {icon}
      </div>
      <div className="text-lg font-bold text-text-primary">{mood}%</div>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${mood}%`, backgroundColor: mood >= 60 ? '#22c55e' : mood >= 40 ? '#eab308' : '#ef4444' }} />
      </div>
    </div>
  )
}
