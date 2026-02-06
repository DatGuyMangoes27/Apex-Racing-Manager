/**
 * Media Persona Card Component
 * 
 * Displays the player's current media persona, level, and public perception.
 * Does NOT show stat effects - purely narrative/personality display.
 */

import { motion } from 'framer-motion'
import { 
  User, Shield, Flame, Scale, Swords, Eye,
  Star, TrendingUp, AlertTriangle
} from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { MediaPersona, MediaTone, MediaPersonaLevel } from '@/store/careerStore'

interface MediaPersonaCardProps {
  persona: MediaPersona
  totalInteractions: number
}

const TONE_CONFIG: Record<MediaTone | 'unknown', {
  icon: typeof User
  label: string
  description: string
  color: string
}> = {
  confident: {
    icon: Star,
    label: 'The Confident One',
    description: 'You project self-belief and assurance',
    color: 'text-accent-gold'
  },
  humble: {
    icon: User,
    label: 'The Humble Racer',
    description: 'You let results speak for themselves',
    color: 'text-status-info'
  },
  bold: {
    icon: Flame,
    label: 'The Bold Statement Maker',
    description: 'You make headlines with daring claims',
    color: 'text-accent-orange'
  },
  diplomatic: {
    icon: Scale,
    label: 'The Diplomat',
    description: 'You navigate press with care and balance',
    color: 'text-status-success'
  },
  aggressive: {
    icon: Swords,
    label: 'The Provocateur',
    description: 'You speak your mind without filter',
    color: 'text-accent-red'
  },
  deflecting: {
    icon: Shield,
    label: 'The Private One',
    description: 'You keep your cards close to your chest',
    color: 'text-text-muted'
  },
  unknown: {
    icon: Eye,
    label: 'Unknown Quantity',
    description: 'The media is still figuring you out',
    color: 'text-text-muted'
  }
}

const LEVEL_CONFIG: Record<MediaPersonaLevel, {
  label: string
  description: string
  minInteractions: number
}> = {
  unknown: {
    label: 'Unknown',
    description: 'Not enough media exposure',
    minInteractions: 0
  },
  emerging: {
    label: 'Emerging',
    description: 'Your media persona is forming',
    minInteractions: 10
  },
  established: {
    label: 'Established',
    description: 'The press knows what to expect',
    minInteractions: 25
  },
  iconic: {
    label: 'Iconic',
    description: 'Your media presence is legendary',
    minInteractions: 50
  }
}

export function MediaPersonaCard({ persona, totalInteractions }: MediaPersonaCardProps) {
  const toneConfig = TONE_CONFIG[persona.dominantTone]
  const levelConfig = LEVEL_CONFIG[persona.personaLevel]
  const Icon = toneConfig.icon
  
  // Calculate progress to next level
  const currentLevel = persona.personaLevel
  const levels: MediaPersonaLevel[] = ['unknown', 'emerging', 'established', 'iconic']
  const currentLevelIndex = levels.indexOf(currentLevel)
  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null
  
  let progressPercent = 100
  if (nextLevel) {
    const currentMin = LEVEL_CONFIG[currentLevel].minInteractions
    const nextMin = LEVEL_CONFIG[nextLevel].minInteractions
    progressPercent = Math.min(100, ((totalInteractions - currentMin) / (nextMin - currentMin)) * 100)
  }
  
  return (
    <Card variant="racing" padding="lg">
      <CardHeader title="Media Persona" />
      
      <div className="space-y-4">
        {/* Main Persona Display */}
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-14 h-14 rounded-xl bg-surface-secondary flex items-center justify-center ${toneConfig.color}`}
            animate={{ 
              scale: persona.personaLevel === 'iconic' ? [1, 1.05, 1] : 1 
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Icon className="w-7 h-7" />
          </motion.div>
          
          <div className="flex-1">
            <h3 className={`font-display font-bold text-lg ${toneConfig.color}`}>
              {toneConfig.label}
            </h3>
            <p className="text-sm text-text-muted">
              {toneConfig.description}
            </p>
          </div>
        </div>
        
        {/* Level Badge */}
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
          <div>
            <p className="text-xs text-text-muted">Persona Level</p>
            <p className="font-semibold">{levelConfig.label}</p>
          </div>
          <Badge 
            variant={
              persona.personaLevel === 'iconic' ? 'gold' :
              persona.personaLevel === 'established' ? 'blue' :
              persona.personaLevel === 'emerging' ? 'green' :
              'default'
            }
          >
            {totalInteractions} interactions
          </Badge>
        </div>
        
        {/* Progress to Next Level */}
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress to {LEVEL_CONFIG[nextLevel].label}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent-red to-accent-orange"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {/* Public Perception & Controversy */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-status-success" />
              <span className="text-xs text-text-muted">Public Perception</span>
            </div>
            <p className="font-display font-bold text-lg">
              {persona.publicPerception >= 70 ? 'Beloved' :
               persona.publicPerception >= 50 ? 'Respected' :
               persona.publicPerception >= 30 ? 'Mixed' : 'Disliked'}
            </p>
          </div>
          
          <div className="p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${persona.controversyLevel > 30 ? 'text-accent-orange' : 'text-text-muted'}`} />
              <span className="text-xs text-text-muted">Controversy</span>
            </div>
            <p className={`font-display font-bold text-lg ${persona.controversyLevel > 50 ? 'text-accent-orange' : ''}`}>
              {persona.controversyLevel >= 70 ? 'High Profile' :
               persona.controversyLevel >= 40 ? 'Under Scrutiny' :
               persona.controversyLevel >= 20 ? 'Some Attention' : 'Low Key'}
            </p>
          </div>
        </div>
        
        {/* Tone Distribution (compact) */}
        {totalInteractions >= 5 && (
          <div>
            <p className="text-xs text-text-muted mb-2">Response History</p>
            <div className="flex gap-1 h-3">
              {Object.entries(persona.toneHistory)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([tone, count]) => {
                  const config = TONE_CONFIG[tone as MediaTone]
                  const percent = (count / totalInteractions) * 100
                  return (
                    <motion.div
                      key={tone}
                      className={`rounded-full ${config?.color?.replace('text-', 'bg-')}`}
                      style={{ width: `${percent}%`, opacity: 0.8 }}
                      title={`${tone}: ${count} responses (${Math.round(percent)}%)`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                    />
                  )
                })
              }
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(persona.toneHistory)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([tone, count]) => {
                  const config = TONE_CONFIG[tone as MediaTone]
                  return (
                    <span key={tone} className={`text-xs ${config?.color}`}>
                      {tone}: {count}
                    </span>
                  )
                })
              }
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}








