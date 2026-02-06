/**
 * Media Timeline Component
 * 
 * Displays chronological history of all media events.
 */

import { motion } from 'framer-motion'
import { 
  Mic, Radio, Share2, Users, 
  ChevronDown, ChevronUp, Briefcase
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { MediaEvent, MediaEventType, MediaTone } from '@/store/careerStore'

interface MediaTimelineProps {
  events: MediaEvent[]
  maxInitialDisplay?: number
}

const EVENT_TYPE_CONFIG: Record<MediaEventType, {
  icon: typeof Mic
  label: string
  color: string
}> = {
  press_conference: {
    icon: Mic,
    label: 'Press Conference',
    color: 'text-accent-red'
  },
  interview: {
    icon: Radio,
    label: 'Interview',
    color: 'text-status-info'
  },
  social_post: {
    icon: Share2,
    label: 'Social Media',
    color: 'text-purple-400'
  },
  team_event: {
    icon: Users,
    label: 'Team Event',
    color: 'text-accent-gold'
  }
}

const TONE_BADGES: Record<MediaTone, { variant: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'gold'; label: string }> = {
  confident: { variant: 'gold', label: 'Confident' },
  humble: { variant: 'blue', label: 'Humble' },
  bold: { variant: 'orange', label: 'Bold' },
  diplomatic: { variant: 'green', label: 'Diplomatic' },
  aggressive: { variant: 'red', label: 'Aggressive' },
  deflecting: { variant: 'default', label: 'Deflecting' }
}

export function MediaTimeline({ events, maxInitialDisplay = 5 }: MediaTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  
  const sortedEvents = [...events].reverse() // Most recent first
  const displayEvents = showAll ? sortedEvents : sortedEvents.slice(0, maxInitialDisplay)
  
  if (events.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader title="Media Activity" />
        <div className="text-center py-8 text-text-muted">
          <Mic className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No media activity yet</p>
          <p className="text-xs mt-1">Your media history will appear here</p>
        </div>
      </Card>
    )
  }
  
  return (
    <Card variant="default" padding="lg">
      <CardHeader 
        title="Media Activity" 
        subtitle={`${events.length} total events`}
      />
      
      <div className="relative max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-surface-border" style={{ minHeight: '100%' }} />
        
        <div className="space-y-4">
          {displayEvents.map((event, index) => {
            const config = EVENT_TYPE_CONFIG[event.type]
            const Icon = config.icon
            const toneBadge = event.response?.tone ? TONE_BADGES[event.response.tone] : null
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className={`absolute left-3 w-4 h-4 rounded-full bg-surface border-2 border-surface-border flex items-center justify-center`}>
                  <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                </div>
                
                <div className="p-3 bg-surface-elevated rounded-lg border border-surface-border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      Week {event.week}, Year {event.year}
                    </span>
                  </div>
                  
                  {event.eventContext && (
                    <p className="text-xs text-text-muted mb-2 capitalize">
                      {event.eventContext.replace(/_/g, ' ')}
                    </p>
                  )}
                  
                  {event.response && (
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary italic">
                        "{event.response.responseText}"
                      </p>
                      {toneBadge && (
                        <Badge variant={toneBadge.variant} size="sm">
                          {toneBadge.label}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {event.headline && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                      <span className="text-text-muted">Headline: </span>
                      <span className="text-text-secondary">"{event.headline}"</span>
                    </div>
                  )}
                  
                  {event.rivalMentioned && (
                    <div className="mt-2">
                      <Badge variant="red" size="sm">
                        Mentioned {event.rivalMentioned}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Impact Badges */}
                  {(event.sponsorImpacts && event.sponsorImpacts.length > 0) || event.teamImpact ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.sponsorImpacts?.map((impact, idx) => (
                        <div 
                          key={`impact-${idx}`}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            impact.change > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          title={`${impact.sponsorName}: ${impact.reason}`}
                        >
                          <Briefcase className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[60px]">{impact.sponsorName.split(' ')[0]}</span>
                          <span className="font-mono">
                            {impact.change > 0 ? '+' : ''}{impact.change}%
                          </span>
                        </div>
                      ))}
                      {event.teamImpact && (
                        <div 
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            event.teamImpact.change > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          title={`Team: ${event.teamImpact.reason}`}
                        >
                          <Users className="w-2.5 h-2.5" />
                          <span>Team</span>
                          <span className="font-mono">
                            {event.teamImpact.change > 0 ? '+' : ''}{event.teamImpact.change}%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Show more/less button */}
        {events.length > maxInitialDisplay && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-2 p-2 text-sm text-text-muted hover:text-white transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {events.length - maxInitialDisplay} More
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}

