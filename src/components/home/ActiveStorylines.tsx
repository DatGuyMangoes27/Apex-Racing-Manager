/**
 * ActiveStorylines — Active narrative arcs with progress and suggested next action
 * 
 * Shows active storylines derived from game state:
 *   - Championship Push
 *   - Sponsor Contract
 *   - Facility Upgrade
 *   - Relationship Arc
 *   - R&D Project
 *   - Financial Goal
 *   - Reputation Milestone
 *   - Active Promises (from the Promise System)
 * 
 * Each storyline has a progress bar, trend indicator, and clickable action.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  Handshake,
  Building2,
  Heart,
  Beaker,
  DollarSign,
  Star,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Compass,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card, CardHeader } from '@/components/ui'
import { getActiveStorylines, type ActiveStoryline } from '@/simulation/activities/suggestionEngine'

const CATEGORY_ICONS: Record<ActiveStoryline['category'], React.ReactNode> = {
  championship: <Trophy className="w-4 h-4" />,
  sponsor: <Handshake className="w-4 h-4" />,
  facility: <Building2 className="w-4 h-4" />,
  relationship: <Heart className="w-4 h-4" />,
  rnd: <Beaker className="w-4 h-4" />,
  financial: <DollarSign className="w-4 h-4" />,
  reputation: <Star className="w-4 h-4" />,
  promise: <ShieldCheck className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<ActiveStoryline['category'], string> = {
  championship: 'text-accent-red',
  sponsor: 'text-accent-gold',
  facility: 'text-accent-blue',
  relationship: 'text-pink-400',
  rnd: 'text-purple-400',
  financial: 'text-status-success',
  reputation: 'text-accent-orange',
  promise: 'text-cyan-400',
}

const CATEGORY_BAR_COLORS: Record<ActiveStoryline['category'], string> = {
  championship: 'bg-accent-red',
  sponsor: 'bg-accent-gold',
  facility: 'bg-accent-blue',
  relationship: 'bg-pink-400',
  rnd: 'bg-purple-400',
  financial: 'bg-status-success',
  reputation: 'bg-accent-orange',
  promise: 'bg-cyan-400',
}

const TREND_ICONS: Record<ActiveStoryline['trend'], React.ReactNode> = {
  improving: <TrendingUp className="w-3 h-3 text-status-success" />,
  declining: <TrendingDown className="w-3 h-3 text-accent-red" />,
  stable: <Minus className="w-3 h-3 text-text-muted" />,
}

export function ActiveStorylines({ compact = false, maxItems }: { compact?: boolean; maxItems?: number }) {
  const navigate = useNavigate()
  const { careerState, player } = useCareerStore()

  const storylines = useMemo(() => {
    if (!careerState || !player) return []
    return getActiveStorylines(careerState, player as unknown as Record<string, unknown>)
  }, [careerState, player])

  if (storylines.length === 0) return null

  const limit = maxItems ?? (compact ? 3 : 6)

  return (
    <Card>
      {!compact && (
        <CardHeader
          title="Working Towards"
          subtitle="Active storylines and goals"
          icon={<Compass className="w-4 h-4" />}
        />
      )}
      <div className={`${compact ? 'p-3 space-y-2' : 'p-4 grid grid-cols-1 md:grid-cols-2 gap-3'}`}>
        {storylines.slice(0, limit).map((storyline, index) => (
          <StorylineCard
            key={storyline.id}
            storyline={storyline}
            index={index}
            onClick={() => navigate(storyline.action.path)}
            compact={compact}
          />
        ))}
      </div>
    </Card>
  )
}

function StorylineCard({
  storyline,
  index,
  onClick,
  compact = false,
}: {
  storyline: ActiveStoryline
  index: number
  onClick: () => void
  compact?: boolean
}) {
  const iconColor = CATEGORY_COLORS[storyline.category] || 'text-text-muted'
  const barColor = CATEGORY_BAR_COLORS[storyline.category] || 'bg-surface-secondary'

  return (
    <motion.div
      className={`group rounded-lg border border-surface-border/50 bg-surface-secondary/20 hover:bg-surface-secondary/40 hover:border-surface-border cursor-pointer transition-all ${compact ? 'p-2' : 'p-3'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
    >
      {/* Header row */}
      <div className={`flex items-center gap-2 ${compact ? 'mb-1' : 'mb-1.5'}`}>
        <span className={iconColor}>
          {CATEGORY_ICONS[storyline.category]}
        </span>
        <h4 className={`font-display font-semibold text-text-primary flex-1 truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {storyline.title}
        </h4>
        {TREND_ICONS[storyline.trend]}
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-[11px] text-text-muted mb-2 line-clamp-1">
          {storyline.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${storyline.progress}%` }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
          />
        </div>
        <span className="text-[10px] font-mono text-text-muted">{storyline.progress}%</span>
        <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Action label */}
      {!compact && (
        <div className="mt-1.5">
          <span className="text-[10px] text-accent-orange opacity-0 group-hover:opacity-100 transition-opacity">
            {storyline.action.label}
          </span>
        </div>
      )}
    </motion.div>
  )
}
