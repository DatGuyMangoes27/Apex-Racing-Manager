/**
 * Engagement Display Component
 * 
 * Shows social media engagement metrics with animated counters.
 */

import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Flame, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { SocialMediaState, FOLLOWER_MILESTONES } from '@/store/careerStore'

interface EngagementDisplayProps {
  socialState: SocialMediaState
  compact?: boolean
}

export function EngagementDisplay({ socialState, compact = false }: EngagementDisplayProps) {
  // Find current and next milestone
  const milestoneThresholds = Object.keys(FOLLOWER_MILESTONES).map(Number).sort((a, b) => a - b)
  const currentMilestone = milestoneThresholds.filter(m => socialState.followerCount >= m).pop()
  const nextMilestone = milestoneThresholds.find(m => m > socialState.followerCount)
  
  const progressToNext = nextMilestone 
    ? ((socialState.followerCount - (currentMilestone || 0)) / (nextMilestone - (currentMilestone || 0))) * 100
    : 100
  
  if (compact) {
    return (
      <Card variant="racing" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-status-info" />
            <div>
              <p className="font-mono font-bold text-lg">{formatFollowers(socialState.followerCount)}</p>
              <p className="text-xs text-text-muted">followers</p>
            </div>
          </div>
          {socialState.verifiedStatus && (
            <Badge variant="blue" size="sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </Card>
    )
  }
  
  return (
    <Card variant="racing" padding="lg">
      <CardHeader title="Social Media Stats" />
      
      <div className="space-y-4">
        {/* Follower Count */}
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-status-info/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Followers</p>
              <p className="font-display font-bold text-2xl">{formatFollowers(socialState.followerCount)}</p>
            </div>
          </div>
          {socialState.verifiedStatus && (
            <Badge variant="blue">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        
        {/* Engagement Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-accent-red" />
              <span className="text-sm text-text-muted">Engagement Rate</span>
            </div>
            <p className="font-display font-bold text-xl">{socialState.engagementRate.toFixed(1)}%</p>
            <p className="text-xs text-text-muted mt-1">
              {socialState.engagementRate >= 5 ? 'Excellent' : 
               socialState.engagementRate >= 3 ? 'Good' : 'Building'}
            </p>
          </div>
          
          <div className="p-4 bg-background/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-accent-orange" />
              <span className="text-sm text-text-muted">Viral Posts</span>
            </div>
            <p className="font-display font-bold text-xl">{socialState.viralPosts}</p>
            <p className="text-xs text-text-muted mt-1">
              {socialState.totalPosts > 0 
                ? `${((socialState.viralPosts / socialState.totalPosts) * 100).toFixed(0)}% viral rate`
                : 'No posts yet'
              }
            </p>
          </div>
        </div>
        
        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>Progress to {FOLLOWER_MILESTONES[nextMilestone as keyof typeof FOLLOWER_MILESTONES].name}</span>
              <span>{formatFollowers(nextMilestone)}</span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-red to-accent-orange rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              {formatFollowers(nextMilestone - socialState.followerCount)} more to unlock!
            </p>
          </div>
        )}
        
        {/* Current Milestone Badge */}
        {currentMilestone && FOLLOWER_MILESTONES[currentMilestone as keyof typeof FOLLOWER_MILESTONES] && (
          <div className="flex items-center justify-center gap-2 p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-xl">
            <TrendingUp className="w-4 h-4 text-accent-gold" />
            <span className="text-sm text-accent-gold font-medium">
              {FOLLOWER_MILESTONES[currentMilestone as keyof typeof FOLLOWER_MILESTONES].name}
            </span>
          </div>
        )}
        
        {/* Last Post Engagement */}
        {socialState.lastPostEngagement && (
          <div className="pt-4 border-t border-surface-border">
            <p className="text-xs text-text-muted mb-3">Last Post Performance</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent-red" />
                <span className="font-mono text-sm">{formatNumber(socialState.lastPostEngagement.likes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-text-muted" />
                <span className="font-mono text-sm">{formatNumber(socialState.lastPostEngagement.comments)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-text-muted" />
                <span className="font-mono text-sm">{formatNumber(socialState.lastPostEngagement.shares)}</span>
              </div>
              <Badge 
                variant={
                  socialState.lastPostEngagement.sentiment === 'positive' ? 'green' :
                  socialState.lastPostEngagement.sentiment === 'negative' ? 'red' :
                  'default'
                }
                size="sm"
              >
                {socialState.lastPostEngagement.sentiment}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toLocaleString()
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toLocaleString()
}








