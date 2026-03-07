/**
 * Compose Post Modal Component
 * 
 * Allows players to compose social media posts with tone selection,
 * preview generated content, AI-generated images, and see engagement results.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Heart, MessageCircle, Share2, 
  Flame, Loader2, AlertTriangle, TrendingUp,
  Users, Star, Shield, Zap, Scale, Eye,
  ImagePlus, RefreshCw, ImageOff, Image as ImageIcon
} from 'lucide-react'
import { Modal, Button, Card } from '@/components/ui';
import type { MediaTone, SocialPost } from '@/store/careerStore';
import type { EngagementResult, AIPostContext, PostImageContext } from '@/services/mediaAI';
import { generateAISocialPost, generatePostText, simulateEngagement, generatePostImage } from '@/services/mediaAI';
import { getRandomImage, type ImageCategory } from '@/data/stock-images';

interface ComposePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPost: (post: SocialPost, engagement: EngagementResult) => void
  postType: string
  postTypeName: string
  postTypeIcon?: React.ReactNode
  context: {
    playerName: string
    teamName: string
    seriesName: string
    followerCount: number
    lastRaceResult?: { position: number; trackName: string }
    isRaceWeek?: boolean
    isPostRace?: boolean
    upcomingTrack?: string
    recentWin?: boolean
    recentPodium?: boolean
    recentDNF?: boolean
    // Enriched context
    teamTier?: string
    staffCount?: number
    carCount?: number
    seasonsCompleted?: number
    sponsorCount?: number
    // Image generation context
    carType?: string
    hasSeriesEntry?: boolean
    facilityDescriptions?: string[]
    sponsorNames?: string[]
    teamMorale?: string
    baseCountry?: string
  }
  engagementContext: {
    rivalName?: string
    controversyLevel?: number
    [key: string]: unknown
  }
}

const TONE_OPTIONS = [
  { tone: 'humble', icon: Shield, label: 'Humble', description: 'Grateful and modest', risk: 'Low engagement, Low risk' },
  { tone: 'confident', icon: Star, label: 'Confident', description: 'Self-assured but respectful', risk: 'Balanced engagement/risk' },
  { tone: 'diplomatic', icon: Scale, label: 'Diplomatic', description: 'Careful and professional', risk: 'Low engagement, Very low risk' },
  { tone: 'bold', icon: Zap, label: 'Bold', description: 'Making statements', risk: 'High engagement, Medium risk' },
  { tone: 'aggressive', icon: Flame, label: 'Aggressive', description: 'No filter, provocative', risk: 'Very high engagement, High risk' },
  { tone: 'deflecting', icon: Eye, label: 'Minimal', description: 'Short and simple', risk: 'Very low engagement, No risk' }
]

/**
 * Map post types to stock image categories for fallback when AI image gen is unavailable
 */
const POST_TYPE_FALLBACK_IMAGES: Record<string, ImageCategory> = {
  post_race_win: 'victory',
  post_race_podium: 'victory',
  training_update: 'garage',
  fan_appreciation: 'paddock',
  charity_highlight: 'paddock',
  race_photo: 'gt-racing',
  behind_scenes: 'garage',
  team_appreciation: 'pit-stop',
  fan_qa: 'paddock',
  sponsor_shoutout: 'paddock',
  track_preview: 'track-aerial',
  throwback_memory: 'historic',
  equipment_showcase: 'garage',
  lifestyle_post: 'paddock',
  championship_push: 'gt-racing',
  comeback_update: 'gt-racing',
  rival_callout: 'gt-racing',
  team_criticism: 'pit-stop',
  incident_reaction: 'rain-racing',
  paddock_gossip: 'paddock',
  media_clap_back: 'paddock',
}

export function ComposePostModal({ 
  isOpen, 
  onClose, 
  onPost, 
  postType,
  postTypeName,
  postTypeIcon,
  context,
  engagementContext
}: ComposePostModalProps) {
  const [selectedTone, setSelectedTone] = useState<MediaTone>('confident')
  const [postContent, setPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isGeneratingPost, setIsGeneratingPost] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [engagementResult, setEngagementResult] = useState<EngagementResult | null>(null)
  
  // Image generation state
  const [imageEnabled, setImageEnabled] = useState(true)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  
  // Generate image for the post
  const handleGenerateImage = useCallback(async () => {
    setIsGeneratingImage(true)
    setImageError(false)
    setGeneratedImageUrl(null)
    
    const imageContext: PostImageContext = {
      postType,
      tone: selectedTone,
      playerName: context.playerName,
      teamName: context.teamName,
      seriesName: context.seriesName,
      trackName: context.lastRaceResult?.trackName || context.upcomingTrack,
      rivalName: engagementContext.rivalName as string | undefined,
      isVictory: context.recentWin,
      isPodium: context.recentPodium,
      isDNF: context.recentDNF,
      // Full team state for context-aware images
      teamTier: context.teamTier,
      carCount: context.carCount,
      carType: context.carType,
      hasSeriesEntry: context.hasSeriesEntry,
      staffCount: context.staffCount,
      facilityDescriptions: context.facilityDescriptions,
      sponsorNames: context.sponsorNames,
      isFirstSeason: (context.seasonsCompleted ?? 0) === 0,
      seasonsCompleted: context.seasonsCompleted,
      teamMorale: context.teamMorale,
      baseCountry: context.baseCountry,
    }
    
    const imageUrl = await generatePostImage(imageContext)
    
    if (imageUrl) {
      setGeneratedImageUrl(imageUrl)
    } else {
      // Context-aware fallback: don't show race imagery if team has no car
      let fallbackCategory: ImageCategory
      if ((context.carCount ?? 0) === 0) {
        // No car — use garage or paddock scenes, never racing imagery
        fallbackCategory = 'paddock'
      } else {
        fallbackCategory = POST_TYPE_FALLBACK_IMAGES[postType] || 'paddock'
      }
      setGeneratedImageUrl(getRandomImage(fallbackCategory))
      setImageError(true)
    }
    
    setIsGeneratingImage(false)
  }, [postType, selectedTone, context, engagementContext])
  
  // Generate post preview when tone changes - try AI first, fall back to templates
  useEffect(() => {
    if (!isOpen || !selectedTone) return
    
    let cancelled = false
    
    const generatePost = async () => {
      setIsGeneratingPost(true)
      
      // Try AI generation first
      const aiContext: AIPostContext = {
        playerName: context.playerName,
        teamName: context.teamName,
        seriesName: context.seriesName,
        postType,
        tone: selectedTone,
        lastRaceResult: context.lastRaceResult,
        followerCount: context.followerCount,
        rivalName: engagementContext.rivalName,
        controversyLevel: engagementContext.controversyLevel,
        // Pass race week context for contextual posts
        isRaceWeek: context.isRaceWeek,
        isPostRace: context.isPostRace,
        upcomingTrack: context.upcomingTrack,
        recentWin: context.recentWin,
        recentPodium: context.recentPodium,
        recentDNF: context.recentDNF,
        // Enriched team context
        teamTier: context.teamTier,
        staffCount: context.staffCount,
        carCount: context.carCount,
        seasonsCompleted: context.seasonsCompleted,
        sponsorCount: context.sponsorCount,
      }
      
      const aiPost = await generateAISocialPost(aiContext)
      
      if (cancelled) return
      
      if (aiPost) {
        setPostContent(aiPost)
      } else {
        // Fall back to template generation
        const content = generatePostText({
          ...context,
          postType,
          tone: selectedTone
        })
        setPostContent(content)
      }
      
      setIsGeneratingPost(false)
    }
    
    generatePost()
    
    return () => {
      cancelled = true
    }
  }, [isOpen, selectedTone, postType, context.playerName, context.teamName, context.seriesName])
  
  // Trigger image generation when modal opens or image toggle is enabled
  useEffect(() => {
    if (isOpen && imageEnabled && !generatedImageUrl && !isGeneratingImage) {
      handleGenerateImage()
    }
  }, [isOpen, imageEnabled])
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTone('confident')
      setShowResults(false)
      setEngagementResult(null)
      setIsPosting(false)
      setGeneratedImageUrl(null)
      setImageError(false)
    }
  }, [isOpen])
  
  const handlePost = async () => {
    setIsPosting(true)
    
    // Simulate a small delay for effect
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Simulate engagement
    const result = simulateEngagement(
      context.followerCount,
      3.5, // Default engagement rate
      postType,
      selectedTone,
      engagementContext
    )
    
    setEngagementResult(result)
    setShowResults(true)
    setIsPosting(false)
  }
  
  const handleComplete = () => {
    if (!engagementResult) return
    
    const post: SocialPost = {
      id: `post_${Date.now()}`,
      week: 0, // Will be set by parent
      year: 0, // Will be set by parent
      type: postType,
      tone: selectedTone,
      content: postContent,
      imageDataUrl: imageEnabled && generatedImageUrl ? generatedImageUrl : undefined,
      engagement: {
        likes: engagementResult.likes,
        comments: engagementResult.comments,
        shares: engagementResult.shares
      },
      wentViral: engagementResult.wentViral,
      hadBacklash: engagementResult.hadBacklash,
      fanReactions: engagementResult.fanReactions
    }
    
    onPost(post, engagementResult)
    onClose()
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="min-h-[500px]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl">{postTypeIcon}</span>
          <div>
            <h2 className="font-display font-bold text-xl">{postTypeName}</h2>
            <p className="text-text-muted text-sm">Compose your post</p>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {showResults && engagementResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Viral Badge */}
              {engagementResult.wentViral && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-red to-accent-orange rounded-full text-white font-bold">
                    <Flame className="w-5 h-5" />
                    POST WENT VIRAL! 🔥
                  </div>
                </motion.div>
              )}
              
              {/* Backlash Warning */}
              {engagementResult.hadBacklash && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-3"
                >
                  <AlertTriangle className="w-6 h-6 text-status-error flex-shrink-0" />
                  <div>
                    <p className="font-medium text-status-error">Post received backlash</p>
                    <p className="text-sm text-text-muted">Some fans didn't appreciate the tone</p>
                  </div>
                </motion.div>
              )}
              
              {/* Post Preview */}
              <Card variant="glass" padding="lg">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center text-white font-bold">
                    {context.playerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{context.playerName}</p>
                    <p className="text-xs text-text-muted">Just now</p>
                  </div>
                </div>
                
                {/* Generated Image */}
                {imageEnabled && generatedImageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <img 
                      src={generatedImageUrl} 
                      alt="Post image" 
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                )}
                
                <p className="text-text-secondary mb-4">{postContent}</p>
                
                {/* Engagement Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-surface-border">
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Heart className={`w-5 h-5 ${engagementResult.wentViral ? 'text-accent-red' : 'text-text-muted'}`} />
                    <AnimatedCounter value={engagementResult.likes} />
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <MessageCircle className="w-5 h-5 text-text-muted" />
                    <AnimatedCounter value={engagementResult.comments} />
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Share2 className="w-5 h-5 text-text-muted" />
                    <AnimatedCounter value={engagementResult.shares} />
                  </motion.div>
                </div>
              </Card>
              
              {/* Fan Reactions */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-text-muted">Fan Reactions</h4>
                <div className="space-y-2">
                  {engagementResult.fanReactions.map((reaction, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`p-3 rounded-lg text-sm ${
                        reaction.includes('🙄') || reaction.includes('Overrated') || reaction.includes('cringe') || reaction.includes('Focus on')
                          ? 'bg-status-error/10 text-status-error'
                          : reaction.includes('🔥') || reaction.includes('Legend') || reaction.includes('GOAT')
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-surface-secondary text-text-secondary'
                      }`}
                    >
                      {reaction}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Follower Gain */}
              {engagementResult.followerGain > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-status-success"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">+{engagementResult.followerGain.toLocaleString()} new followers!</span>
                </motion.div>
              )}
              
              <Button variant="primary" className="w-full" onClick={handleComplete}>
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="compose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Tone Selection */}
              <div>
                <h4 className="text-sm font-medium mb-3">Choose your tone</h4>
                <div className="grid grid-cols-3 gap-3">
                  {TONE_OPTIONS.map(({ tone, icon: Icon, label, description, risk }) => (
                    <motion.button
                      key={tone}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTone(tone)}
                      className={`
                        p-4 rounded-xl border text-left transition-all
                        ${selectedTone === tone 
                          ? 'bg-accent-red/20 border-accent-red ring-2 ring-accent-red/50' 
                          : 'bg-surface border-surface-border hover:border-surface-secondary'}
                      `}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${selectedTone === tone ? 'text-accent-red' : 'text-text-muted'}`} />
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-text-muted mt-1">{description}</p>
                      <p className={`text-xs mt-2 ${
                        risk.includes('High risk') ? 'text-status-error' :
                        risk.includes('Medium risk') ? 'text-status-warning' :
                        'text-text-muted'
                      }`}>
                        {risk}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Image Generation Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Post Image</h4>
                  <button
                    onClick={() => {
                      const newEnabled = !imageEnabled
                      setImageEnabled(newEnabled)
                      if (!newEnabled) {
                        setGeneratedImageUrl(null)
                        setImageError(false)
                      }
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${imageEnabled 
                        ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' 
                        : 'bg-surface-secondary text-text-muted border border-surface-border hover:border-surface-secondary'}
                    `}
                  >
                    {imageEnabled ? (
                      <>
                        <ImagePlus className="w-3.5 h-3.5" />
                        AI Image On
                      </>
                    ) : (
                      <>
                        <ImageOff className="w-3.5 h-3.5" />
                        No Image
                      </>
                    )}
                  </button>
                </div>
                
                {imageEnabled && (
                  <div className="rounded-xl overflow-hidden border border-surface-border mb-1">
                    {isGeneratingImage ? (
                      <div className="aspect-video bg-surface-secondary flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <ImageIcon className="w-8 h-8 text-text-muted opacity-30" />
                          <Loader2 className="w-5 h-5 text-accent-red animate-spin absolute -bottom-1 -right-1" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-text-muted">Generating image...</p>
                          <p className="text-xs text-text-muted/60 mt-1">Nano Banana Pro is working its magic</p>
                        </div>
                      </div>
                    ) : generatedImageUrl ? (
                      <div className="relative group">
                        <img 
                          src={generatedImageUrl} 
                          alt="Generated post image" 
                          className="w-full aspect-video object-cover"
                        />
                        {imageError && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-text-muted flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-status-warning" />
                            Using stock image
                          </div>
                        )}
                        <button
                          onClick={handleGenerateImage}
                          className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-xs text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-video bg-surface-secondary flex items-center justify-center">
                        <button
                          onClick={handleGenerateImage}
                          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg text-sm text-text-muted hover:text-white transition-colors border border-surface-border"
                        >
                          <ImagePlus className="w-4 h-4" />
                          Generate Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Post Preview */}
              <div>
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <Card variant="glass" padding="lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center text-white font-bold">
                      {context.playerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{context.playerName}</p>
                      <p className="text-xs text-text-muted">Draft</p>
                    </div>
                  </div>
                  {isGeneratingPost ? (
                    <div className="flex items-center gap-2 text-text-muted py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating post...</span>
                    </div>
                  ) : (
                    <p className="text-text-secondary">{postContent}</p>
                  )}
                </Card>
              </div>
              
              {/* Audience Stats */}
              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-text-muted" />
                  <span className="text-sm">Posting to</span>
                </div>
                <span className="font-mono font-bold">{context.followerCount.toLocaleString()} followers</span>
              </div>
              
              {/* Risk Warning for aggressive tones */}
              {(selectedTone === 'aggressive' || selectedTone === 'bold') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-xl flex items-center gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />
                  <p className="text-sm text-status-warning">
                    {selectedTone === 'aggressive' 
                      ? 'Aggressive posts have high backlash risk and may upset sponsors'
                      : 'Bold posts attract attention but may draw criticism'
                    }
                  </p>
                </motion.div>
              )}
              
              {/* Post Button */}
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={handlePost}
                disabled={isPosting || isGeneratingPost || isGeneratingImage}
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : isGeneratingPost || isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isGeneratingImage ? 'Generating image...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}

// Animated counter component
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 1000
    const steps = 20
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <span className="font-mono">
      {displayValue.toLocaleString()}
    </span>
  )
}
