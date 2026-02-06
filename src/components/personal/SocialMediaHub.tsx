import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageCircle,
  Share2,
  Users,
  AlertTriangle,
  Flame,
  Eye,
  Send,
  Image,
  Video,
  Smile,
  Sparkles,
  Shield,
  Ban,
  ThumbsUp,
  ThumbsDown,
  Zap
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Modal, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type { 
  SocialMediaProfile, 
  SocialPost, 
  TrollEncounter,
  PostTopic,
  PostTone
} from '@/data/social-media-config'
import { generateSocialComments } from '@/services/dialogueAI'

// ============================================
// TYPES
// ============================================

interface SocialMediaHubProps {
  profiles: Record<string, SocialMediaProfile>
  recentPosts: SocialPost[]
  pendingTrolls: TrollEncounter[]
  onCreatePost: (platform: string, topic: PostTopic, tone: PostTone) => void
  onRespondToTroll: (trollId: string, responseType: string) => void
  onSchedulePost: (post: Partial<SocialPost>) => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  tiktok: <Zap className="w-5 h-5" />
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  twitter: 'from-blue-400 to-blue-500',
  youtube: 'from-red-500 to-red-600',
  linkedin: 'from-blue-600 to-blue-700',
  tiktok: 'from-black to-gray-800'
}

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

const POST_TOPICS: { id: PostTopic; label: string; icon: React.ReactNode }[] = [
  { id: 'race_result', label: 'Race Result', icon: <Flame className="w-4 h-4" /> },
  { id: 'behind_scenes', label: 'Behind the Scenes', icon: <Eye className="w-4 h-4" /> },
  { id: 'personal_life', label: 'Personal Life', icon: <Heart className="w-4 h-4" /> },
  { id: 'partner_appreciation', label: 'Partner Appreciation', icon: <Heart className="w-4 h-4 text-pink-400" /> },
  { id: 'hobby', label: 'Hobby Update', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'charity', label: 'Charity/Cause', icon: <Users className="w-4 h-4" /> },
  { id: 'milestone_celebration', label: 'Milestone', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'controversial_opinion', label: 'Hot Take', icon: <AlertTriangle className="w-4 h-4 text-yellow-400" /> }
]

const POST_TONES: { id: PostTone; label: string; risk: string }[] = [
  { id: 'humble', label: 'Humble', risk: 'Safe' },
  { id: 'confident', label: 'Confident', risk: 'Low' },
  { id: 'funny', label: 'Funny', risk: 'Medium' },
  { id: 'serious', label: 'Serious', risk: 'Low' },
  { id: 'controversial', label: 'Controversial', risk: 'High' }
]

// ============================================
// SUB-COMPONENTS
// ============================================

function PlatformCard({
  platform,
  profile,
  onSelect
}: {
  platform: string
  profile: SocialMediaProfile
  onSelect: () => void
}) {
  const isGrowing = profile.followersGrowthRate > 0
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className="bg-surface-dark/50 rounded-xl p-4 border border-border/10 hover:border-racing-red/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PLATFORM_COLORS[platform]} flex items-center justify-center text-white`}>
          {PLATFORM_ICONS[platform]}
        </div>
        <div className={`flex items-center gap-1 ${isGrowing ? 'text-green-400' : 'text-red-400'}`}>
          {isGrowing ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isGrowing ? '+' : ''}{formatFollowers(profile.followersGrowthRate)}/week
          </span>
        </div>
      </div>
      
      <h3 className="font-medium capitalize mb-1">{platform}</h3>
      <p className="text-2xl font-bold">{formatFollowers(profile.followers)}</p>
      <p className="text-xs text-text-muted">followers</p>
      
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/10">
        <div className="text-center">
          <p className="text-sm font-medium">{profile.engagementRate.toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted">Engagement</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{profile.totalPosts}</p>
          <p className="text-[10px] text-text-muted">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{profile.viralPosts}</p>
          <p className="text-[10px] text-text-muted">Viral</p>
        </div>
      </div>
    </motion.div>
  )
}

function RecentPostCard({ post }: { post: SocialPost }) {
  return (
    <div className="bg-surface-dark/30 rounded-xl p-4 border border-border/10">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[post.platform]} flex items-center justify-center text-white`}>
            {PLATFORM_ICONS[post.platform]}
          </div>
          <div>
            <p className="text-sm font-medium capitalize">{post.platform}</p>
            <p className="text-xs text-text-muted capitalize">{post.topic.replace('_', ' ')}</p>
          </div>
        </div>
        {post.wentViral && (
          <Badge variant="warning" size="sm">
            <Flame className="w-3 h-3 mr-1" />
            Viral
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-text-secondary line-clamp-2 mb-3">{post.contentPreview}</p>
      
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span>{formatFollowers(post.likes)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{formatFollowers(post.comments)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share2 className="w-4 h-4" />
          <span>{formatFollowers(post.shares)}</span>
        </div>
      </div>
      
      {post.followerChange !== 0 && (
        <div className={`mt-2 text-xs ${post.followerChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {post.followerChange > 0 ? '+' : ''}{formatFollowers(post.followerChange)} followers
        </div>
      )}
    </div>
  )
}

function TrollAlertCard({
  troll,
  onRespond
}: {
  troll: TrollEncounter
  onRespond: (responseType: string) => void
}) {
  const [showOptions, setShowOptions] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="font-medium text-red-400">Troll Alert</span>
          <Badge variant="outline" size="sm" className="capitalize">
            {troll.visibility} visibility
          </Badge>
        </div>
        <span className="text-xs text-text-muted">@{troll.trollUsername}</span>
      </div>
      
      <p className="text-sm text-text-secondary mb-3 italic">"{troll.content}"</p>
      
      <p className="text-xs text-text-muted mb-3">
        Attack type: <span className="capitalize">{troll.attackType.replace('_', ' ')}</span>
      </p>
      
      {!showOptions ? (
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => setShowOptions(true)}
        >
          Respond
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Choose your response:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond('ignore')}
            >
              Ignore
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond('classy_response')}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Classy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond('funny_comeback')}
            >
              <Smile className="w-3 h-3 mr-1" />
              Roast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond('block')}
            >
              <Ban className="w-3 h-3 mr-1" />
              Block
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onRespond('aggressive')}
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              Clap Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond('legal_threat')}
            >
              <Shield className="w-3 h-3 mr-1" />
              Legal
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function CreatePostModal({
  isOpen,
  onClose,
  profiles,
  onCreate
}: {
  isOpen: boolean
  onClose: () => void
  profiles: Record<string, SocialMediaProfile>
  onCreate: (platform: string, topic: PostTopic, tone: PostTone) => void
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [selectedTopic, setSelectedTopic] = useState<PostTopic>('race_result')
  const [selectedTone, setSelectedTone] = useState<PostTone>('humble')
  const [step, setStep] = useState(1)
  
  const handleCreate = () => {
    onCreate(selectedPlatform, selectedTopic, selectedTone)
    onClose()
    setStep(1)
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="lg">
      <div className="space-y-6">
        {step === 1 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Select Platform</h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(profiles).map(([platform, profile]) => (
                  <motion.button
                    key={platform}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`
                      p-3 rounded-xl text-center transition-colors
                      ${selectedPlatform === platform 
                        ? 'bg-racing-red/20 border-2 border-racing-red' 
                        : 'bg-surface-dark/50 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[platform]} flex items-center justify-center text-white mb-2`}>
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <p className="text-xs capitalize">{platform}</p>
                    <p className="text-[10px] text-text-muted">{formatFollowers(profile.followers)}</p>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div>
              <h4 className="font-medium mb-3">What do you want to post about?</h4>
              <div className="grid grid-cols-2 gap-2">
                {POST_TOPICS.map(topic => (
                  <motion.button
                    key={topic.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`
                      p-3 rounded-xl text-left flex items-center gap-3 transition-colors
                      ${selectedTopic === topic.id 
                        ? 'bg-racing-red/20 border-2 border-racing-red' 
                        : 'bg-surface-dark/50 border-2 border-transparent'
                      }
                    `}
                  >
                    {topic.icon}
                    <span className="text-sm">{topic.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
              </Button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Choose your tone</h4>
              <div className="space-y-2">
                {POST_TONES.map(tone => (
                  <motion.button
                    key={tone.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`
                      w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors
                      ${selectedTone === tone.id 
                        ? 'bg-racing-red/20 border-2 border-racing-red' 
                        : 'bg-surface-dark/50 border-2 border-transparent'
                      }
                    `}
                  >
                    <span className="font-medium">{tone.label}</span>
                    <Badge 
                      variant={tone.risk === 'Safe' ? 'success' : tone.risk === 'High' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {tone.risk} Risk
                    </Badge>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="bg-surface-dark/50 rounded-xl p-4">
              <h4 className="text-sm font-medium mb-2">Post Preview</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded bg-gradient-to-br ${PLATFORM_COLORS[selectedPlatform]} flex items-center justify-center text-white`}>
                  {PLATFORM_ICONS[selectedPlatform]}
                </div>
                <span className="text-sm capitalize">{selectedPlatform}</span>
              </div>
              <p className="text-sm text-text-muted">
                Topic: <span className="text-text-secondary capitalize">{selectedTopic.replace('_', ' ')}</span>
              </p>
              <p className="text-sm text-text-muted">
                Tone: <span className="text-text-secondary capitalize">{selectedTone}</span>
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCreate}>
                <Send className="w-4 h-4 mr-1" />
                Create Post
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SocialMediaHub({
  profiles,
  recentPosts,
  pendingTrolls,
  onCreatePost,
  onRespondToTroll,
  onSchedulePost
}: SocialMediaHubProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Calculate totals
  const totalFollowers = useMemo(() =>
    Object.values(profiles).reduce((sum, p) => sum + p.followers, 0),
    [profiles]
  )
  
  const totalGrowth = useMemo(() =>
    Object.values(profiles).reduce((sum, p) => sum + p.followersGrowthRate, 0),
    [profiles]
  )
  
  const averageEngagement = useMemo(() => {
    const rates = Object.values(profiles).map(p => p.engagementRate)
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
  }, [profiles])
  
  const totalViralPosts = useMemo(() =>
    Object.values(profiles).reduce((sum, p) => sum + p.viralPosts, 0),
    [profiles]
  )
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="racing" padding="md" className="col-span-1">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-racing-red" />
            <div>
              <p className="text-2xl font-bold">{formatFollowers(totalFollowers)}</p>
              <p className="text-xs text-text-muted">Total Followers</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`} />
          <p className={`text-xl font-bold ${totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalGrowth >= 0 ? '+' : ''}{formatFollowers(totalGrowth)}
          </p>
          <p className="text-xs text-text-muted">Weekly Growth</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{averageEngagement.toFixed(1)}%</p>
          <p className="text-xs text-text-muted">Avg Engagement</p>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-xl font-bold">{totalViralPosts}</p>
          <p className="text-xs text-text-muted">Viral Posts</p>
        </Card>
      </div>
      
      {/* Troll Alerts */}
      {pendingTrolls.length > 0 && (
        <Card variant="glass" padding="lg">
          <CardHeader 
            title="Troll Alerts" 
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            subtitle={`${pendingTrolls.length} pending responses`}
          />
          <div className="space-y-3 mt-4">
            {pendingTrolls.map(troll => (
              <TrollAlertCard
                key={troll.id}
                troll={troll}
                onRespond={(type) => onRespondToTroll(troll.id, type)}
              />
            ))}
          </div>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Platforms</TabsTrigger>
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <CardHeader 
                title="Your Platforms" 
                icon={<Sparkles className="w-5 h-5" />}
              />
              <Button onClick={() => setShowCreateModal(true)}>
                <Send className="w-4 h-4 mr-1" />
                Create Post
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(profiles).map(([platform, profile]) => (
                <PlatformCard
                  key={platform}
                  platform={platform}
                  profile={profile}
                  onSelect={() => {}}
                />
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="posts">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Recent Posts" 
              icon={<Image className="w-5 h-5" />}
              subtitle={`${recentPosts.length} posts`}
            />
            
            {recentPosts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {recentPosts.map(post => (
                  <RecentPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                <p className="text-text-muted mb-4">
                  Start posting to grow your following and engage with fans.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Post
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card variant="racing" padding="lg">
            <CardHeader 
              title="Create Content" 
              icon={<Send className="w-5 h-5" />}
              subtitle="Share updates with your followers"
            />
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowCreateModal(true)}
                className="p-6 bg-surface-dark/50 rounded-xl text-center hover:bg-surface-dark/80 transition-colors"
              >
                <Image className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                <h4 className="font-medium">Photo Post</h4>
                <p className="text-xs text-text-muted mt-1">Share a moment</p>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowCreateModal(true)}
                className="p-6 bg-surface-dark/50 rounded-xl text-center hover:bg-surface-dark/80 transition-colors"
              >
                <Video className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h4 className="font-medium">Video Post</h4>
                <p className="text-xs text-text-muted mt-1">Behind the scenes</p>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowCreateModal(true)}
                className="p-6 bg-surface-dark/50 rounded-xl text-center hover:bg-surface-dark/80 transition-colors"
              >
                <MessageCircle className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h4 className="font-medium">Text Update</h4>
                <p className="text-xs text-text-muted mt-1">Share thoughts</p>
              </motion.button>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-400">Posting Tips</h4>
                  <ul className="text-sm text-text-muted mt-1 space-y-1">
                    <li>• Post consistently to maintain engagement</li>
                    <li>• Controversial posts can backfire with sponsors</li>
                    <li>• Partner appreciation posts boost relationship meters</li>
                    <li>• Behind-the-scenes content has high engagement</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        profiles={profiles}
        onCreate={onCreatePost}
      />
    </div>
  )
}

export default SocialMediaHub
