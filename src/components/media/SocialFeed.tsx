/**
 * Social Feed Component
 * 
 * Displays timeline of past social media posts with engagement metrics.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, MessageCircle, Share2, Flame, 
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { SocialPost, MediaTone } from '@/store/careerStore'

interface SocialFeedProps {
  posts: SocialPost[]
  playerName: string
  maxInitialDisplay?: number
}

const TONE_BADGES: Record<MediaTone, { variant: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'gold'; label: string }> = {
  confident: { variant: 'gold', label: 'Confident' },
  humble: { variant: 'blue', label: 'Humble' },
  bold: { variant: 'orange', label: 'Bold' },
  diplomatic: { variant: 'green', label: 'Diplomatic' },
  aggressive: { variant: 'red', label: 'Aggressive' },
  deflecting: { variant: 'default', label: 'Minimal' }
}

const POST_TYPE_ICONS: Record<string, string> = {
  training_update: '💪',
  fan_appreciation: '🙏',
  charity_highlight: '❤️',
  post_race_win: '🏆',
  post_race_podium: '🥇',
  race_photo: '📸',
  behind_scenes: '🎬',
  team_appreciation: '🤝',
  fan_qa: '🎤'
}

export function SocialFeed({ posts, playerName, maxInitialDisplay = 5 }: SocialFeedProps) {
  const [showAll, setShowAll] = useState(false)
  
  const sortedPosts = [...posts].reverse() // Most recent first
  const displayPosts = showAll ? sortedPosts : sortedPosts.slice(0, maxInitialDisplay)
  
  if (posts.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader title="Your Posts" />
        <div className="text-center py-8 text-text-muted">
          <span className="text-4xl mb-3 block">📱</span>
          <p className="text-sm">No posts yet</p>
          <p className="text-xs mt-1">Start posting to build your social presence!</p>
        </div>
      </Card>
    )
  }
  
  return (
    <Card variant="default" padding="lg">
      <CardHeader 
        title="Your Posts" 
        subtitle={`${posts.length} total posts`}
      />
      
      <div className="space-y-4">
        {displayPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl border ${
              post.wentViral 
                ? 'bg-gradient-to-r from-accent-red/10 to-accent-orange/10 border-accent-red/30' 
                : post.hadBacklash
                ? 'bg-status-error/5 border-status-error/20'
                : 'bg-surface border-surface-border'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center text-white font-bold">
                  {playerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{playerName}</span>
                    {post.wentViral && (
                      <Badge variant="orange" size="sm">
                        <Flame className="w-3 h-3 mr-1" />
                        Viral
                      </Badge>
                    )}
                    {post.hadBacklash && (
                      <Badge variant="red" size="sm">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Backlash
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">Week {post.week}, Year {post.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{POST_TYPE_ICONS[post.type] || '📝'}</span>
                <Badge variant={TONE_BADGES[post.tone].variant} size="sm">
                  {TONE_BADGES[post.tone].label}
                </Badge>
              </div>
            </div>
            
            {/* Post Image */}
            {post.imageDataUrl && (
              <div className="mb-3 -mx-4 overflow-hidden">
                <img 
                  src={post.imageDataUrl} 
                  alt={`${post.type.replace(/_/g, ' ')} post`}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}
            
            {/* Content */}
            <p className="text-text-secondary text-sm mb-3">{post.content}</p>
            
            {/* Engagement */}
            <div className="flex items-center gap-6 pt-3 border-t border-surface-border">
              <div className="flex items-center gap-2 text-sm">
                <Heart className={`w-4 h-4 ${post.wentViral ? 'text-accent-red' : 'text-text-muted'}`} />
                <span className="font-mono">{formatNumber(post.engagement.likes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-text-muted" />
                <span className="font-mono">{formatNumber(post.engagement.comments)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Share2 className="w-4 h-4 text-text-muted" />
                <span className="font-mono">{formatNumber(post.engagement.shares)}</span>
              </div>
              {post.followerGain != null && post.followerGain !== 0 && (
                <div className={`flex items-center gap-2 text-sm ${post.followerGain > 0 ? 'text-status-success' : 'text-status-error'}`}>
                  {post.followerGain > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-mono">{post.followerGain > 0 ? '+' : ''}{formatNumber(post.followerGain)}</span>
                </div>
              )}
            </div>
            
            {/* Sample Reactions (show top 2) */}
            {post.fanReactions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-border/50">
                <p className="text-xs text-text-muted mb-2">Top reactions:</p>
                <div className="flex flex-wrap gap-2">
                  {post.fanReactions.slice(0, 2).map((reaction, i) => (
                    <span 
                      key={i} 
                      className={`text-xs px-2 py-1 rounded-full ${
                        reaction.includes('🙄') || reaction.includes('Overrated')
                          ? 'bg-status-error/10 text-status-error'
                          : 'bg-surface-secondary text-text-secondary'
                      }`}
                    >
                      {reaction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        
        {/* Show more/less */}
        {posts.length > maxInitialDisplay && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-2 p-3 text-sm text-text-muted hover:text-white transition-colors rounded-lg hover:bg-surface-secondary"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {posts.length - maxInitialDisplay} More Posts
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}








