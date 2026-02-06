import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Lightbulb,
  Wind,
  Newspaper,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { TeamDevelopmentEvent, DevelopmentEventType, AREA_EFFECTS } from '@/simulation/teamDevelopment'

interface EventFeedProps {
  events: TeamDevelopmentEvent[]
  maxDisplay?: number
}

export function EventFeed({ events, maxDisplay = 5 }: EventFeedProps) {
  const [expanded, setExpanded] = useState(false)
  
  // Sort by most recent first
  const sortedEvents = [...events].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.week - a.week
  })
  
  const displayEvents = expanded ? sortedEvents : sortedEvents.slice(0, maxDisplay)
  const hasMore = sortedEvents.length > maxDisplay
  
  const getEventIcon = (type: DevelopmentEventType) => {
    switch (type) {
      case 'breakthrough': return <Zap className="w-4 h-4 text-status-success" />
      case 'setback': return <AlertTriangle className="w-4 h-4 text-status-error" />
      case 'supplier_issue': return <DollarSign className="w-4 h-4 text-status-warning" />
      case 'engineer_insight': return <Lightbulb className="w-4 h-4 text-accent-gold" />
      case 'wind_tunnel': return <Wind className="w-4 h-4 text-status-info" />
      case 'rival_upgrade': return <Newspaper className="w-4 h-4 text-accent-orange" />
      case 'regulation_change': return <AlertTriangle className="w-4 h-4 text-status-warning" />
      default: return <TrendingUp className="w-4 h-4" />
    }
  }
  
  const getEventColor = (type: DevelopmentEventType): string => {
    switch (type) {
      case 'breakthrough':
      case 'wind_tunnel':
      case 'engineer_insight':
        return 'border-status-success/30 bg-status-success/5'
      case 'setback':
      case 'regulation_change':
        return 'border-status-error/30 bg-status-error/5'
      case 'supplier_issue':
        return 'border-status-warning/30 bg-status-warning/5'
      case 'rival_upgrade':
        return 'border-accent-orange/30 bg-accent-orange/5'
      default:
        return 'border-surface-border bg-surface/50'
    }
  }
  
  const getEventBadgeVariant = (type: DevelopmentEventType): 'green' | 'red' | 'yellow' | 'orange' | 'blue' | 'default' => {
    switch (type) {
      case 'breakthrough':
      case 'wind_tunnel':
      case 'engineer_insight':
        return 'green'
      case 'setback':
      case 'regulation_change':
        return 'red'
      case 'supplier_issue':
        return 'yellow'
      case 'rival_upgrade':
        return 'orange'
      default:
        return 'default'
    }
  }
  
  return (
    <Card variant="default" padding="md">
      <CardHeader 
        title="Development News" 
        icon={<Newspaper className="w-4 h-4 text-text-muted" />}
        action={
          <Badge variant="default" size="sm">
            {events.length}
          </Badge>
        }
      />
      
      <div className="space-y-2">
        {displayEvents.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No development events yet this season
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: index * 0.03 }}
                className={`p-2 rounded-lg border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium truncate">{event.title}</h4>
                      <Badge 
                        variant={getEventBadgeVariant(event.type)} 
                        size="sm"
                        className="shrink-0"
                      >
                        W{event.week}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                    
                    {/* Effect Summary */}
                    {event.effects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.effects.map((effect, i) => (
                          <span 
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              effect.value > 0 
                                ? (effect.type === 'points' ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning')
                                : 'bg-status-error/20 text-status-error'
                            }`}
                          >
                            {effect.type === 'points' && `${effect.value > 0 ? '+' : ''}${effect.value} pts`}
                            {effect.type === 'cost' && `${Math.round((effect.value - 1) * 100)}% cost`}
                            {effect.type === 'efficiency' && `${Math.round((effect.value - 1) * 100)}% efficiency`}
                            {effect.area && ` (${AREA_EFFECTS[effect.area]?.name || effect.area})`}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Rival team indicator */}
                    {!event.isPlayerTeam && event.teamId && (
                      <span className="text-[10px] text-accent-orange mt-1 block">
                        Rival team
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* Show More Button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show Less' : `Show ${sortedEvents.length - maxDisplay} More`}
          </Button>
        )}
      </div>
    </Card>
  )
}







