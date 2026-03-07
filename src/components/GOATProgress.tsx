import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Star,
  Award,
  Target,
  Crown,
  TrendingUp,
  CheckCircle2,
  Circle,
  Medal,
  getMilestonesByCategory,
  createDefaultGOATProgress,
  GOAT_TIERS,
  ALL_MILESTONES,
  TRIPLE_CROWNS,
  HISTORICAL_RECORDS,
  type GOATTier,
  type MilestoneRarity,
  type MilestoneCategory,
  type Milestone,
  type GOATProgress as GOATProgressType
} from '@/data/achievements'
import { useState, useMemo } from 'react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { useCareerStore, type PlayerDriver } from '@/store/careerStore'

// Calculate progress toward a milestone based on player stats
function calculateMilestoneProgress(milestone: Milestone, player: PlayerDriver): { progress: number; label: string } {
  const c = milestone.conditions
  
  // Check each condition and return the one with most progress
  let bestProgress = 0
  let bestLabel = ''
  
  if (c.totalRaces && c.totalRaces > 0) {
    const prog = (player.totalRaces / c.totalRaces) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.totalRaces}/${c.totalRaces} races`
    }
  }
  
  if (c.totalWins && c.totalWins > 0) {
    const prog = (player.totalWins / c.totalWins) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.totalWins}/${c.totalWins} wins`
    }
  }
  
  if (c.totalPodiums && c.totalPodiums > 0) {
    const prog = (player.totalPodiums / c.totalPodiums) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.totalPodiums}/${c.totalPodiums} podiums`
    }
  }
  
  if (c.totalPoles && c.totalPoles > 0) {
    const prog = (player.totalPoles / c.totalPoles) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.totalPoles}/${c.totalPoles} poles`
    }
  }
  
  if (c.championships && c.championships > 0) {
    const prog = ((player.championships || 0) / c.championships) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.championships || 0}/${c.championships} titles`
    }
  }
  
  if (c.consecutiveWins && c.consecutiveWins > 0) {
    const prog = ((player.consecutiveWins || 0) / c.consecutiveWins) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.consecutiveWins || 0}/${c.consecutiveWins} in a row`
    }
  }
  
  if (c.consecutivePodiums && c.consecutivePodiums > 0) {
    const prog = ((player.consecutivePodiums || 0) / c.consecutivePodiums) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.consecutivePodiums || 0}/${c.consecutivePodiums} podiums streak`
    }
  }
  
  if (c.hatTricks && c.hatTricks > 0) {
    const prog = ((player.hatTricks || 0) / c.hatTricks) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.hatTricks || 0}/${c.hatTricks} hat tricks`
    }
  }
  
  if (c.grandSlams && c.grandSlams > 0) {
    const prog = ((player.grandSlams || 0) / c.grandSlams) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.grandSlams || 0}/${c.grandSlams} grand slams`
    }
  }
  
  if (c.seasonsCompleted && c.seasonsCompleted > 0) {
    const prog = ((player.seasonsCompleted || 0) / c.seasonsCompleted) * 100
    if (prog > bestProgress || !bestLabel) {
      bestProgress = prog
      bestLabel = `${player.seasonsCompleted || 0}/${c.seasonsCompleted} seasons`
    }
  }
  
  // Default if no trackable condition
  if (!bestLabel) {
    return { progress: 0, label: 'Not started' }
  }
  
  return { progress: bestProgress, label: bestLabel }
}

// Tier visual configuration
// Tier visual config - using app's red/dark color scheme with tier-specific accents
const TIER_CONFIG: Record<GOATTier, { 
  color: string; 
  bgColor: string; 
  icon: typeof Trophy;
  accentColor: string;
  borderColor: string;
}> = {
  rookie: { 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-500/10', 
    icon: Circle,
    accentColor: 'bg-slate-500',
    borderColor: 'border-slate-600/50'
  },
  club_racer: { 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10', 
    icon: Target,
    accentColor: 'bg-blue-500',
    borderColor: 'border-blue-600/50'
  },
  regional_champion: { 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/10', 
    icon: Award,
    accentColor: 'bg-green-500',
    borderColor: 'border-green-600/50'
  },
  professional: { 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10', 
    icon: Medal,
    accentColor: 'bg-amber-500',
    borderColor: 'border-amber-600/50'
  },
  star: { 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/10', 
    icon: Star,
    accentColor: 'bg-orange-500',
    borderColor: 'border-orange-600/50'
  },
  legend: { 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10', 
    icon: Trophy,
    accentColor: 'bg-purple-500',
    borderColor: 'border-purple-600/50'
  },
  goat: { 
    color: 'text-accent-gold', 
    bgColor: 'bg-accent-gold/10', 
    icon: Crown,
    accentColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
    borderColor: 'border-accent-gold/50'
  }
}

const _RARITY_COLORS: Record<MilestoneRarity, string> = {
  common: 'text-gray-400 border-gray-600',
  uncommon: 'text-green-400 border-green-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-amber-400 border-amber-500'
}

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  career_firsts: 'Career Firsts',
  career_volume: 'Career Volume',
  streaks: 'Streaks',
  track_mastery: 'Track Mastery',
  series_progression: 'Series Progression',
  special_challenges: 'Special Challenges'
}

interface GOATProgressPanelProps {
  goatProgress?: GOATProgressType;
  player?: any;
  currentYear?: number;
}

export function GOATProgressPanel({ goatProgress: propGoatProgress, player: propPlayer, _currentYear }: GOATProgressPanelProps) {
  const store = useCareerStore()
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'all'>('all')
  const [showTripleCrowns, setShowTripleCrowns] = useState(false)
  const [showRecords, setShowRecords] = useState(false)
  
  // Use props if provided, otherwise fall back to store
  const player = propPlayer || store.player
  const effectiveReputation = (store.careerState?.ownedTeam?.reputation ?? player?.reputation ?? 0)
  
  if (!player) return null
  
  // Use goatProgress from props/player, or create a default one to show all milestones
  const goatProgress = propGoatProgress || player.goatProgress || createDefaultGOATProgress()
  
  const currentTierDef = GOAT_TIERS.find(t => t.id === goatProgress.currentTier) || GOAT_TIERS[0]
  const tierConfig = TIER_CONFIG[goatProgress.currentTier as GOATTier]
  const TierIcon = tierConfig.icon
  
  // Calculate milestone stats
  const totalMilestones = ALL_MILESTONES.length
  const unlockedMilestones = Object.values(goatProgress.milestones).filter(
    s => s === 'unlocked' || s === 'newly_unlocked'
  ).length
  
  // Filter milestones by category
  const displayMilestones = selectedCategory === 'all' 
    ? ALL_MILESTONES 
    : getMilestonesByCategory(selectedCategory)
  
  // Get next tier info
  const currentTierIndex = GOAT_TIERS.findIndex(t => t.id === goatProgress.currentTier)
  const nextTier = currentTierIndex < GOAT_TIERS.length - 1 ? GOAT_TIERS[currentTierIndex + 1] : null
  const isMaxTier = !nextTier
  
  return (
    <div className="space-y-6">
      {/* Tier Progress Section */}
      <Card variant="glass" padding="lg">
        <div className="flex items-start gap-6">
          {/* Current Tier Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl ${tierConfig.bgColor} border ${tierConfig.borderColor} flex items-center justify-center`}>
                <TierIcon className={`w-8 h-8 ${tierConfig.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Current Tier</p>
                <h2 className={`font-display text-2xl font-bold ${tierConfig.color}`}>
                  {currentTierDef.name}
                </h2>
                <p className="text-sm text-text-muted">{currentTierDef.description}</p>
              </div>
            </div>
            
            {/* Tier Progress Track */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Progress to {nextTier?.name || 'Max Tier'}</span>
                <span className={`font-mono font-bold ${tierConfig.color}`}>
                  {isMaxTier ? '🏆 MAX' : `${goatProgress.tierProgress}%`}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${isMaxTier ? 100 : goatProgress.tierProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${tierConfig.accentColor}`}
                />
              </div>
              
              {/* Tier Steps */}
              <div className="flex items-center gap-1 mt-4">
                {GOAT_TIERS.map((tier, index) => {
                  const TierStepIcon = TIER_CONFIG[tier.id].icon
                  const stepConfig = TIER_CONFIG[tier.id]
                  const isCompleted = currentTierIndex >= index
                  const isCurrent = tier.id === goatProgress.currentTier
                  
                  return (
                    <div key={tier.id} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isCompleted 
                            ? `${stepConfig.bgColor} border ${stepConfig.borderColor}` 
                            : 'bg-surface-secondary/30 border border-surface-border/30'
                        } ${isCurrent ? 'ring-2 ring-accent-red ring-offset-2 ring-offset-background' : ''}`}
                        title={tier.name}
                      >
                        <TierStepIcon className={`w-4 h-4 ${isCompleted ? stepConfig.color : 'text-text-muted/30'}`} />
                      </div>
                      <span className={`text-[10px] mt-1 ${isCompleted ? 'text-text-primary' : 'text-text-muted/50'} ${isCurrent ? 'font-bold' : ''}`}>
                        {tier.name.split('_').map(w => w.charAt(0).toUpperCase()).join('')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Next Tier Requirements */}
          <div className="w-72 shrink-0">
            <div className="p-4 rounded-xl bg-surface-secondary/50 border border-surface-border/50">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-red" />
                {isMaxTier ? 'GOAT Achieved!' : `Requirements for ${nextTier?.name}`}
              </h3>
              
              {isMaxTier ? (
                <p className="text-sm text-text-muted">
                  Congratulations! You've reached the pinnacle of motorsport greatness.
                </p>
              ) : nextTier?.requirements && (
                <div className="space-y-2">
                  {nextTier.requirements.minRaces && (
                    <RequirementRow
                      label="Races"
                      current={player.totalRaces}
                      required={nextTier.requirements.minRaces}
                    />
                  )}
                  {nextTier.requirements.minWins && (
                    <RequirementRow
                      label="Wins"
                      current={player.totalWins}
                      required={nextTier.requirements.minWins}
                    />
                  )}
                  {nextTier.requirements.minPodiums && (
                    <RequirementRow
                      label="Podiums"
                      current={player.totalPodiums}
                      required={nextTier.requirements.minPodiums}
                    />
                  )}
                  {nextTier.requirements.minChampionships && (
                    <RequirementRow
                      label="Championships"
                      current={player.championships || 0}
                      required={nextTier.requirements.minChampionships}
                    />
                  )}
                  {nextTier.repMin > 0 && (
                    <RequirementRow
                      label="Team Reputation"
                      current={Math.round(effectiveReputation * 10) / 10}
                      required={nextTier.repMin}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          label="Milestones"
          value={unlockedMilestones}
          total={totalMilestones}
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard 
          label="Triple Crowns"
          value={goatProgress.completedCrowns?.length || 0}
          total={TRIPLE_CROWNS.length}
          icon={Crown}
          color="text-amber-400"
        />
        <StatCard 
          label="Records Broken"
          value={goatProgress.recordsBroken || 0}
          total={HISTORICAL_RECORDS.length}
          icon={TrendingUp}
          color="text-purple-400"
        />
        <StatCard 
          label="Championships"
          value={player.championships || 0}
          total={null}
          icon={Medal}
          color="text-accent-red"
        />
      </div>
      
      {/* Section Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowTripleCrowns(!showTripleCrowns); setShowRecords(false) }}
          className={`px-4 py-2 rounded-lg transition-all ${
            showTripleCrowns 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
              : 'bg-surface-secondary hover:bg-surface-secondary/80 text-text-muted'
          }`}
        >
          <Crown className="w-4 h-4 inline mr-2" />
          Triple Crowns
        </button>
        <button
          onClick={() => { setShowRecords(!showRecords); setShowTripleCrowns(false) }}
          className={`px-4 py-2 rounded-lg transition-all ${
            showRecords 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
              : 'bg-surface-secondary hover:bg-surface-secondary/80 text-text-muted'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Records
        </button>
      </div>
      
      {/* Triple Crowns Section */}
      <AnimatePresence>
        {showTripleCrowns && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TripleCrownsSection goatProgress={goatProgress} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Records Section */}
      <AnimatePresence>
        {showRecords && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <RecordsSection goatProgress={goatProgress} player={player} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Milestones Section */}
      <Card variant="glass" padding="lg">
        <CardHeader title="Milestones" subtitle={`${unlockedMilestones} of ${totalMilestones} unlocked`} />
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterButton
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            label="All"
          />
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <FilterButton
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat as MilestoneCategory)}
              label={label}
            />
          ))}
        </div>
        
        {/* Milestone Grid - 3 columns for better readability with descriptions */}
        <div className="grid grid-cols-3 gap-4">
          {displayMilestones.map((milestone, index) => {
            const status = goatProgress.milestones[milestone.id] || 'locked'
            const isUnlocked = status === 'unlocked' || status === 'newly_unlocked'
            const { progress, label } = calculateMilestoneProgress(milestone, player)
            
            return (
              <MilestoneCard
                key={milestone.id}
                name={milestone.name}
                description={milestone.description}
                icon={milestone.icon}
                rarity={milestone.rarity}
                isUnlocked={isUnlocked}
                progress={isUnlocked ? 100 : progress}
                progressLabel={label}
                index={index}
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  total, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number | null; 
  icon: typeof Trophy; 
  color: string;
}) {
  const progress = total ? (value / total) * 100 : null
  
  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-surface-secondary/50 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="font-display text-xl font-bold text-text-primary">
            {value}
            {total !== null && <span className="text-text-muted text-sm font-normal">/{total}</span>}
          </p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
      {progress !== null && (
        <div className="mt-2 h-1 bg-surface-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-accent-red'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Card>
  )
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
        active 
          ? 'bg-accent-red text-white' 
          : 'bg-surface-secondary hover:bg-surface-secondary/80 text-text-muted'
      }`}
    >
      {label}
    </button>
  )
}

function RequirementRow({ label, current, required }: { label: string; current: number; required: number }) {
  const isMet = current >= required
  const progress = Math.min(100, (current / required) * 100)
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${isMet ? 'bg-green-500' : 'bg-accent-red'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`font-mono text-xs ${isMet ? 'text-green-400' : 'text-text-muted'}`}>
          {current}/{required}
          {isMet && ' ✓'}
        </span>
      </div>
    </div>
  )
}

// Rarity background gradients for unlocked milestones
const RARITY_BG: Record<MilestoneRarity, string> = {
  common: 'from-slate-600/20 to-slate-800/20',
  uncommon: 'from-green-600/20 to-green-800/20',
  rare: 'from-blue-600/20 to-blue-800/20',
  epic: 'from-purple-600/20 to-purple-800/20',
  legendary: 'from-amber-600/20 to-amber-800/20'
}

const RARITY_BORDER: Record<MilestoneRarity, string> = {
  common: 'border-slate-500/50',
  uncommon: 'border-green-500/50',
  rare: 'border-blue-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-amber-500/50'
}

const RARITY_TEXT: Record<MilestoneRarity, string> = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400'
}

function MilestoneCard({ 
  name, 
  description, 
  icon, 
  rarity, 
  isUnlocked, 
  progress,
  progressLabel,
  index 
}: { 
  name: string;
  description: string;
  icon: string;
  rarity: MilestoneRarity;
  isUnlocked: boolean;
  progress: number; // 0-100
  progressLabel?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      className={`p-4 rounded-xl border transition-all ${
        isUnlocked 
          ? `bg-gradient-to-br ${RARITY_BG[rarity]} ${RARITY_BORDER[rarity]}` 
          : 'bg-surface-secondary/30 border-surface-border/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isUnlocked 
            ? `bg-gradient-to-br ${RARITY_BG[rarity]}` 
            : 'bg-surface-secondary/50'
        }`}>
          <span className={`text-xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>{icon}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm truncate ${isUnlocked ? RARITY_TEXT[rarity] : 'text-text-muted'}`}>
              {name}
            </h4>
            {isUnlocked && (
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${RARITY_TEXT[rarity]}`} />
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{description}</p>
          
          {/* Progress Bar */}
          {!isUnlocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">{progressLabel || 'Progress'}</span>
                <span className={`font-mono ${progress >= 100 ? 'text-green-400' : 'text-text-muted'}`}>
                  {Math.min(progress, 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    progress >= 100 
                      ? 'bg-green-500' 
                      : progress >= 50 
                        ? 'bg-amber-500' 
                        : 'bg-accent-red'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TripleCrownsSection({ goatProgress }: { goatProgress: GOATProgressType }) {
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Triple Crowns" 
        subtitle="The ultimate achievements in motorsport"
      />
      
      <div className="space-y-6">
        {TRIPLE_CROWNS.map(crown => {
          const crownProgress = goatProgress.tripleCrowns?.[crown.id] || {}
          const legsCompleted = crown.legs.filter(leg => crownProgress[leg.id]).length
          const isComplete = legsCompleted === crown.legs.length
          
          return (
            <div 
              key={crown.id}
              className={`p-4 rounded-xl border-2 ${
                isComplete 
                  ? 'border-amber-500 bg-amber-500/10' 
                  : 'border-surface-border bg-surface-secondary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{crown.icon}</span>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      {crown.name}
                      {isComplete && <span className="ml-2 text-amber-400">✓ COMPLETE</span>}
                    </h3>
                    <p className="text-sm text-text-muted">{crown.description}</p>
                  </div>
                </div>
                <Badge variant={isComplete ? 'gold' : 'default'}>
                  {legsCompleted}/{crown.legs.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {crown.legs.map(leg => {
                  const isLegComplete = crownProgress[leg.id]
                  
                  return (
                    <div 
                      key={leg.id}
                      className={`p-3 rounded-lg ${
                        isLegComplete 
                          ? 'bg-green-500/20 border border-green-500/50' 
                          : 'bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isLegComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-text-muted" />
                        )}
                        <span className={`font-medium ${isLegComplete ? 'text-green-400' : ''}`}>
                          {leg.name}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">{leg.description}</p>
                    </div>
                  )
                })}
              </div>
              
              {crown.historicalAchievers && crown.historicalAchievers.length > 0 && (
                <p className="text-xs text-text-muted mt-3">
                  Historical achievers: {crown.historicalAchievers.join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const CATEGORY_INFO: Record<string, { label: string; color: string; icon: string }> = {
  formula: { label: 'Formula/Open Wheel', color: 'text-red-400', icon: '🏎️' },
  endurance: { label: 'Endurance Racing', color: 'text-blue-400', icon: '🌙' },
  indycar: { label: 'IndyCar/Oval Racing', color: 'text-amber-400', icon: '🏁' },
  supercars: { label: 'Touring Cars', color: 'text-green-400', icon: '🚗' },
  general: { label: 'General', color: 'text-purple-400', icon: '🏆' }
}

function RecordsSection({ goatProgress, player }: { goatProgress: GOATProgressType; player: PlayerDriver }) {
  // Default to 'general' category since it applies to everyone
  const [selectedCategory, setSelectedCategory] = useState<string>('general')
  
  // Group records by category
  const recordsByCategory = useMemo(() => {
    const groups: Record<string, typeof HISTORICAL_RECORDS> = {}
    for (const record of HISTORICAL_RECORDS) {
      if (!groups[record.category]) {
        groups[record.category] = []
      }
      groups[record.category].push(record)
    }
    return groups
  }, [])
  
  // Get current value from player for a record
  const getPlayerValue = (valuePath: string): number => {
    if (valuePath.startsWith('trackHistory.')) {
      const parts = valuePath.split('.')
      const trackId = parts[1]
      const stat = parts[2]
      return (player.trackHistory?.[trackId] as any)?.[stat] || 0
    }
    // Calculate win percentage dynamically
    if (valuePath === 'winPercentage') {
      if (player.totalRaces === 0) return 0
      return Math.round((player.totalWins / player.totalRaces) * 100)
    }
    return (player as any)[valuePath] || 0
  }
  
  // Filter records based on selection
  const displayRecords = selectedCategory === 'all' 
    ? HISTORICAL_RECORDS 
    : recordsByCategory[selectedCategory] || []
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Historical Records" 
        subtitle="Challenge the legends of motorsport"
      />
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            selectedCategory === 'all'
              ? 'bg-accent-red/20 text-accent-red border border-accent-red/50'
              : 'bg-surface-secondary hover:bg-surface-secondary/80 text-text-muted'
          }`}
        >
          All Records
        </button>
        {Object.entries(CATEGORY_INFO).map(([cat, info]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              selectedCategory === cat
                ? `bg-surface-secondary ${info.color} border border-current/50`
                : 'bg-surface-secondary hover:bg-surface-secondary/80 text-text-muted'
            }`}
          >
            <span>{info.icon}</span>
            {info.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {displayRecords.map(record => {
          const progress = goatProgress.recordProgress?.[record.id]
          const currentValue = progress?.currentValue || getPlayerValue(record.yourValuePath)
          const progressPercent = Math.min(100, (currentValue / record.recordValue) * 100)
          const isBroken = progress?.beaten || currentValue > record.recordValue
          const catInfo = CATEGORY_INFO[record.category]
          
          return (
            <div 
              key={record.id}
              className={`p-4 rounded-xl transition-all ${
                isBroken 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50' 
                  : 'bg-surface-secondary/50 border border-surface-border/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{catInfo.icon}</span>
                    <h4 className="font-medium">
                      {record.name}
                    </h4>
                    {isBroken && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        🏆 RECORD HOLDER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{record.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-display text-xl font-bold text-accent-red">
                    {currentValue}{record.valueType === 'percentage' ? '%' : ''} 
                    <span className="text-text-muted text-sm font-normal"> / {record.recordValue}{record.valueType === 'percentage' ? '%' : ''}</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {record.recordHolder}
                  </p>
                </div>
              </div>
              
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    isBroken 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : progressPercent > 50 
                        ? 'bg-amber-500' 
                        : 'bg-accent-red'
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function _EmptyGOATProgress() {
  return (
    <Card variant="glass" padding="lg" className="text-center py-12">
      <Trophy className="w-16 h-16 mx-auto text-text-muted mb-4" />
      <h3 className="font-display text-xl font-semibold mb-2">
        Your GOAT Journey Awaits
      </h3>
      <p className="text-text-muted max-w-md mx-auto">
        Start racing to begin tracking your progress toward becoming the Greatest of All Time!
      </p>
    </Card>
  )
}

export default GOATProgressPanel
