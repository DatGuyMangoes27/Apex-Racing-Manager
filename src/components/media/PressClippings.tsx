/**
 * Press Clippings Component
 * 
 * Displays a rolling feed of AI-generated headlines from press conferences.
 * This is the primary feedback mechanism for media interactions - no stat displays.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, AlertTriangle, MessageSquare } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { PressClipping } from '@/store/careerStore'

interface PressClippingsProps {
  clippings: PressClipping[]
  maxDisplay?: number
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: TrendingUp,
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    borderColor: 'border-status-success/30',
    label: 'Positive'
  },
  neutral: {
    icon: Newspaper,
    color: 'text-text-muted',
    bgColor: 'bg-surface-secondary',
    borderColor: 'border-surface-border',
    label: 'Neutral'
  },
  negative: {
    icon: TrendingDown,
    color: 'text-status-error',
    bgColor: 'bg-status-error/10',
    borderColor: 'border-status-error/30',
    label: 'Negative'
  },
  controversial: {
    icon: AlertTriangle,
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    borderColor: 'border-accent-orange/30',
    label: 'Controversial'
  }
}

export function PressClippings({ clippings, maxDisplay = 5 }: PressClippingsProps) {
  const displayClippings = clippings.slice(-maxDisplay).reverse()
  
  if (displayClippings.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader title="Press Clippings" />
        <div className="text-center py-8 text-text-muted">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No press coverage yet</p>
          <p className="text-xs mt-1">Complete press conferences to see headlines</p>
        </div>
      </Card>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Press Clippings" 
        subtitle={`${clippings.length} total articles`}
      />
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayClippings.map((clipping, index) => {
            const config = SENTIMENT_CONFIG[clipping.sentiment]
            const Icon = config.icon
            
            return (
              <motion.div
                key={clipping.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  p-3 rounded-lg border
                  ${config.bgColor} ${config.borderColor}
                `}
              >
                {/* Headline Image */}
              {clipping.imageDataUrl && (
                <div className="-mx-3 -mt-3 mb-3 overflow-hidden rounded-t-lg">
                  <img 
                    src={clipping.imageDataUrl} 
                    alt={clipping.headline}
                    className="w-full aspect-[3/2] object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight mb-1">
                      "{clipping.headline}"
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{clipping.outlet}</span>
                      <span>•</span>
                      <span>Week {clipping.week}</span>
                    </div>
                    
                    {/* Rival response if present */}
                    {clipping.rivalResponse && (
                      <div className="mt-2 p-2 bg-background/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3 h-3 mt-0.5 text-accent-red flex-shrink-0" />
                          <p className="text-xs text-text-secondary italic">
                            {clipping.rivalResponse}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Badge 
                    variant={
                      clipping.sentiment === 'positive' ? 'green' :
                      clipping.sentiment === 'negative' ? 'red' :
                      clipping.sentiment === 'controversial' ? 'orange' : 
                      'default'
                    } 
                    size="sm"
                  >
                    {config.label}
                  </Badge>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Card>
  )
}

/**
 * Latest headline popup for immediate feedback
 */
export function HeadlinePopup({ 
  clipping, 
  onDismiss 
}: { 
  clipping: PressClipping
  onDismiss: () => void 
}) {
  const config = SENTIMENT_CONFIG[clipping.sentiment]
  const Icon = config.icon
  
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`
        fixed bottom-6 right-6 max-w-md p-4 rounded-xl border shadow-2xl z-50
        ${config.bgColor} ${config.borderColor}
      `}
    >
      {/* Headline Image in Popup */}
      {clipping.imageDataUrl && (
        <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
          <img 
            src={clipping.imageDataUrl}
            alt={clipping.headline}
            className="w-full aspect-[3/2] object-cover"
          />
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-1">{clipping.outlet}</p>
          <p className="font-display font-semibold text-lg leading-tight">
            "{clipping.headline}"
          </p>
          
          {clipping.rivalResponse && (
            <div className="mt-3 p-2 bg-background/50 rounded-lg">
              <p className="text-xs text-accent-red mb-1">Rival Response:</p>
              <p className="text-sm italic">"{clipping.rivalResponse}"</p>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-text-muted hover:text-white transition-colors"
      >
        <span className="sr-only">Dismiss</span>
        ×
      </button>
    </motion.div>
  )
}


