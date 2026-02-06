/**
 * GOAT Achievement System
 * 
 * Comprehensive achievement, milestone, and record tracking system
 * for the "Becoming the GOAT" career progression feature.
 */

// ============================================
// GOAT TIER PROGRESSION
// ============================================

export type GOATTier = 
  | 'rookie'           // Starting out
  | 'club_racer'       // Getting competitive
  | 'regional_champion'// Making a name
  | 'professional'     // Established pro
  | 'star'             // Rising fame
  | 'legend'           // All-time great
  | 'goat'             // Greatest of All Time

export interface GOATTierDefinition {
  id: GOATTier
  name: string
  description: string
  repMin: number
  repMax: number
  requirements: {
    minRaces?: number
    minWins?: number
    minPodiums?: number
    minChampionships?: number
    minTripleCrownLegs?: number
    minRecordsBroken?: number
  }
}

export const GOAT_TIERS: GOATTierDefinition[] = [
  {
    id: 'rookie',
    name: 'Rookie',
    description: 'Just starting your racing journey',
    repMin: 0,
    repMax: 20,
    requirements: {}
  },
  {
    id: 'club_racer',
    name: 'Club Racer',
    description: 'Earning respect on the local scene',
    repMin: 20,
    repMax: 35,
    requirements: { minRaces: 5, minPodiums: 1 }
  },
  {
    id: 'regional_champion',
    name: 'Regional Champion',
    description: 'A champion in your region',
    repMin: 35,
    repMax: 50,
    requirements: { minWins: 5, minChampionships: 1 }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'A full-time racing professional',
    repMin: 50,
    repMax: 65,
    requirements: { minWins: 20, minChampionships: 2 }
  },
  {
    id: 'star',
    name: 'Star',
    description: 'A household name in motorsport',
    repMin: 65,
    repMax: 80,
    requirements: { minWins: 50, minChampionships: 3 }
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'An all-time great of the sport',
    repMin: 80,
    repMax: 90,
    requirements: { minWins: 100, minChampionships: 5 }
  },
  {
    id: 'goat',
    name: 'GOAT',
    description: 'The Greatest of All Time',
    repMin: 90,
    repMax: 100,
    requirements: { 
      minChampionships: 7, 
      minTripleCrownLegs: 3,
      minRecordsBroken: 3
    }
  }
]

// ============================================
// MILESTONE SYSTEM
// ============================================

export type MilestoneCategory = 
  | 'career_firsts'
  | 'career_volume'
  | 'streaks'
  | 'track_mastery'
  | 'series_progression'
  | 'special_challenges'

export type MilestoneRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Milestone {
  id: string
  name: string
  description: string
  category: MilestoneCategory
  rarity: MilestoneRarity
  icon: string  // Emoji or icon identifier
  
  // Unlock conditions
  conditions: {
    totalRaces?: number
    totalWins?: number
    totalPodiums?: number
    totalPoles?: number
    totalFastestLaps?: number
    championships?: number
    consecutiveWins?: number
    consecutivePodiums?: number
    consecutivePoints?: number
    trackWins?: { trackId: string; minWins: number }
    tracksWonAt?: { trackIds: string[]; all: boolean }  // All or any
    seriesChampionship?: string  // Specific series
    seriesChampionships?: string[]  // Win all these
    wetRaceWins?: number
    nightRaceWins?: number
    multiClassWins?: number
    comebackWins?: number  // Win from P10+
    lastLapWins?: number
    perfectSeasons?: number
    seasonsCompleted?: number
    grandSlams?: number  // Pole + lead every lap + win + fastest lap
    hatTricks?: number   // Pole + win + fastest lap
    tripleLegs?: { crown: string; legs: string[] }
    recordBroken?: { recordId: string }
    dnfFreeSeasons?: number
  }
  
  // Rewards
  rewards?: {
    reputationBonus?: number
    unlockTitle?: string
    unlockBadge?: string
  }
  
  // For UI ordering
  sortOrder: number
}

export type MilestoneStatus = 'locked' | 'unlocked' | 'newly_unlocked'

// ============================================
// CAREER FIRSTS (8 achievements)
// ============================================

export const CAREER_FIRST_MILESTONES: Milestone[] = [
  {
    id: 'first-race',
    name: 'First Steps',
    description: 'Complete your first race',
    category: 'career_firsts',
    rarity: 'common',
    icon: '🏁',
    conditions: { totalRaces: 1 },
    sortOrder: 1
  },
  {
    id: 'first-podium',
    name: 'On the Box',
    description: 'Score your first podium finish',
    category: 'career_firsts',
    rarity: 'common',
    icon: '🥉',
    conditions: { totalPodiums: 1 },
    sortOrder: 2
  },
  {
    id: 'first-win',
    name: 'Taste of Victory',
    description: 'Win your first race',
    category: 'career_firsts',
    rarity: 'uncommon',
    icon: '🏆',
    conditions: { totalWins: 1 },
    sortOrder: 3
  },
  {
    id: 'first-pole',
    name: 'Front Row Start',
    description: 'Qualify on pole position',
    category: 'career_firsts',
    rarity: 'uncommon',
    icon: '🔵',
    conditions: { totalPoles: 1 },
    sortOrder: 4
  },
  {
    id: 'first-fastest-lap',
    name: 'Purple Sector King',
    description: 'Set the fastest lap in a race',
    category: 'career_firsts',
    rarity: 'uncommon',
    icon: '💜',
    conditions: { totalFastestLaps: 1 },
    sortOrder: 5
  },
  {
    id: 'first-championship',
    name: 'Champion',
    description: 'Win your first championship',
    category: 'career_firsts',
    rarity: 'rare',
    icon: '👑',
    conditions: { championships: 1 },
    rewards: { reputationBonus: 5, unlockTitle: 'Champion' },
    sortOrder: 6
  },
  {
    id: 'first-hat-trick',
    name: 'Hat Trick',
    description: 'Win from pole with fastest lap',
    category: 'career_firsts',
    rarity: 'rare',
    icon: '🎩',
    conditions: { hatTricks: 1 },
    sortOrder: 7
  },
  {
    id: 'first-grand-slam',
    name: 'Grand Slam',
    description: 'Pole, lead every lap, win, and fastest lap',
    category: 'career_firsts',
    rarity: 'epic',
    icon: '💎',
    conditions: { grandSlams: 1 },
    rewards: { reputationBonus: 3 },
    sortOrder: 8
  }
]

// ============================================
// CAREER VOLUME MILESTONES (24 achievements)
// ============================================

export const CAREER_VOLUME_MILESTONES: Milestone[] = [
  // Race counts
  {
    id: 'races-10',
    name: 'Getting Started',
    description: 'Complete 10 races',
    category: 'career_volume',
    rarity: 'common',
    icon: '🔟',
    conditions: { totalRaces: 10 },
    sortOrder: 10
  },
  {
    id: 'races-25',
    name: 'Quarter Century',
    description: 'Complete 25 races',
    category: 'career_volume',
    rarity: 'common',
    icon: '2️⃣5️⃣',
    conditions: { totalRaces: 25 },
    sortOrder: 11
  },
  {
    id: 'races-50',
    name: 'Half Ton',
    description: 'Complete 50 races',
    category: 'career_volume',
    rarity: 'uncommon',
    icon: '5️⃣0️⃣',
    conditions: { totalRaces: 50 },
    sortOrder: 12
  },
  {
    id: 'races-100',
    name: 'Century Club',
    description: 'Complete 100 races',
    category: 'career_volume',
    rarity: 'rare',
    icon: '💯',
    conditions: { totalRaces: 100 },
    rewards: { unlockTitle: 'Veteran' },
    sortOrder: 13
  },
  {
    id: 'races-200',
    name: 'Double Century',
    description: 'Complete 200 races',
    category: 'career_volume',
    rarity: 'epic',
    icon: '🔢',
    conditions: { totalRaces: 200 },
    sortOrder: 14
  },
  {
    id: 'races-500',
    name: 'Iron Man',
    description: 'Complete 500 races',
    category: 'career_volume',
    rarity: 'legendary',
    icon: '🦾',
    conditions: { totalRaces: 500 },
    rewards: { reputationBonus: 5, unlockTitle: 'Iron Man' },
    sortOrder: 15
  },
  
  // Win counts
  {
    id: 'wins-5',
    name: 'Starting to Shine',
    description: '5 career wins',
    category: 'career_volume',
    rarity: 'uncommon',
    icon: '⭐',
    conditions: { totalWins: 5 },
    sortOrder: 20
  },
  {
    id: 'wins-10',
    name: 'Double Digits',
    description: '10 career wins',
    category: 'career_volume',
    rarity: 'uncommon',
    icon: '🌟',
    conditions: { totalWins: 10 },
    sortOrder: 21
  },
  {
    id: 'wins-25',
    name: 'Silver Milestone',
    description: '25 career wins',
    category: 'career_volume',
    rarity: 'rare',
    icon: '🥈',
    conditions: { totalWins: 25 },
    sortOrder: 22
  },
  {
    id: 'wins-50',
    name: 'Golden Fifty',
    description: '50 career wins',
    category: 'career_volume',
    rarity: 'rare',
    icon: '🥇',
    conditions: { totalWins: 50 },
    rewards: { reputationBonus: 5 },
    sortOrder: 23
  },
  {
    id: 'wins-100',
    name: 'Triple Digits',
    description: '100 career wins',
    category: 'career_volume',
    rarity: 'epic',
    icon: '💫',
    conditions: { totalWins: 100 },
    rewards: { reputationBonus: 10, unlockTitle: 'Centurion' },
    sortOrder: 24
  },
  {
    id: 'wins-150',
    name: 'Legend Territory',
    description: '150 career wins',
    category: 'career_volume',
    rarity: 'legendary',
    icon: '🌠',
    conditions: { totalWins: 150 },
    rewards: { reputationBonus: 10 },
    sortOrder: 25
  },
  
  // Podium counts
  {
    id: 'podiums-10',
    name: 'Consistent Performer',
    description: '10 podium finishes',
    category: 'career_volume',
    rarity: 'common',
    icon: '🎖️',
    conditions: { totalPodiums: 10 },
    sortOrder: 30
  },
  {
    id: 'podiums-25',
    name: 'Regular on the Box',
    description: '25 podium finishes',
    category: 'career_volume',
    rarity: 'uncommon',
    icon: '🏅',
    conditions: { totalPodiums: 25 },
    sortOrder: 31
  },
  {
    id: 'podiums-50',
    name: 'Podium Hunter',
    description: '50 podium finishes',
    category: 'career_volume',
    rarity: 'rare',
    icon: '🎯',
    conditions: { totalPodiums: 50 },
    sortOrder: 32
  },
  {
    id: 'podiums-100',
    name: 'Century of Podiums',
    description: '100 podium finishes',
    category: 'career_volume',
    rarity: 'epic',
    icon: '🎪',
    conditions: { totalPodiums: 100 },
    rewards: { reputationBonus: 5 },
    sortOrder: 33
  },
  
  // Pole counts
  {
    id: 'poles-10',
    name: 'Qualifying Specialist',
    description: '10 pole positions',
    category: 'career_volume',
    rarity: 'uncommon',
    icon: '🔷',
    conditions: { totalPoles: 10 },
    sortOrder: 40
  },
  {
    id: 'poles-25',
    name: 'Saturday King',
    description: '25 pole positions',
    category: 'career_volume',
    rarity: 'rare',
    icon: '🔹',
    conditions: { totalPoles: 25 },
    sortOrder: 41
  },
  {
    id: 'poles-50',
    name: 'Grid Dominator',
    description: '50 pole positions',
    category: 'career_volume',
    rarity: 'epic',
    icon: '💠',
    conditions: { totalPoles: 50 },
    rewards: { unlockTitle: 'Pole King' },
    sortOrder: 42
  },
  
  // Championship counts
  {
    id: 'championships-2',
    name: 'Back to Back',
    description: 'Win 2 championships',
    category: 'career_volume',
    rarity: 'rare',
    icon: '2️⃣',
    conditions: { championships: 2 },
    sortOrder: 50
  },
  {
    id: 'championships-3',
    name: 'Three-peat',
    description: 'Win 3 championships',
    category: 'career_volume',
    rarity: 'rare',
    icon: '3️⃣',
    conditions: { championships: 3 },
    sortOrder: 51
  },
  {
    id: 'championships-5',
    name: 'Dynasty Builder',
    description: 'Win 5 championships',
    category: 'career_volume',
    rarity: 'epic',
    icon: '5️⃣',
    conditions: { championships: 5 },
    rewards: { reputationBonus: 10, unlockTitle: 'Dynasty Builder' },
    sortOrder: 52
  },
  {
    id: 'championships-7',
    name: 'Matching Legends',
    description: 'Win 7 championships (ties Schumacher/Hamilton)',
    category: 'career_volume',
    rarity: 'legendary',
    icon: '7️⃣',
    conditions: { championships: 7 },
    rewards: { reputationBonus: 15 },
    sortOrder: 53
  },
  {
    id: 'championships-8',
    name: 'The Greatest',
    description: 'Win 8 championships (beats all-time record)',
    category: 'career_volume',
    rarity: 'legendary',
    icon: '8️⃣',
    conditions: { championships: 8 },
    rewards: { reputationBonus: 20, unlockTitle: 'The Greatest' },
    sortOrder: 54
  }
]

// ============================================
// STREAK ACHIEVEMENTS (9 milestones)
// ============================================

export const STREAK_MILESTONES: Milestone[] = [
  {
    id: 'streak-wins-3',
    name: 'Winning Form',
    description: '3 consecutive race wins',
    category: 'streaks',
    rarity: 'uncommon',
    icon: '🔥',
    conditions: { consecutiveWins: 3 },
    sortOrder: 60
  },
  {
    id: 'streak-wins-5',
    name: 'Hot Streak',
    description: '5 consecutive race wins',
    category: 'streaks',
    rarity: 'rare',
    icon: '🔥🔥',
    conditions: { consecutiveWins: 5 },
    sortOrder: 61
  },
  {
    id: 'streak-wins-7',
    name: 'Untouchable',
    description: '7 consecutive race wins',
    category: 'streaks',
    rarity: 'epic',
    icon: '🔥🔥🔥',
    conditions: { consecutiveWins: 7 },
    rewards: { reputationBonus: 5 },
    sortOrder: 62
  },
  {
    id: 'streak-wins-10',
    name: 'Dominant Force',
    description: '10 consecutive race wins',
    category: 'streaks',
    rarity: 'epic',
    icon: '⚡',
    conditions: { consecutiveWins: 10 },
    rewards: { reputationBonus: 10 },
    sortOrder: 63
  },
  {
    id: 'streak-wins-15',
    name: 'Schumacher-esque',
    description: '15 consecutive race wins',
    category: 'streaks',
    rarity: 'legendary',
    icon: '👑⚡',
    conditions: { consecutiveWins: 15 },
    rewards: { reputationBonus: 15, unlockTitle: 'Unstoppable' },
    sortOrder: 64
  },
  {
    id: 'streak-podiums-5',
    name: 'Reliable',
    description: '5 consecutive podium finishes',
    category: 'streaks',
    rarity: 'uncommon',
    icon: '📈',
    conditions: { consecutivePodiums: 5 },
    sortOrder: 65
  },
  {
    id: 'streak-podiums-10',
    name: 'Mr. Consistent',
    description: '10 consecutive podium finishes',
    category: 'streaks',
    rarity: 'rare',
    icon: '📊',
    conditions: { consecutivePodiums: 10 },
    rewards: { unlockTitle: 'Mr. Consistent' },
    sortOrder: 66
  },
  {
    id: 'streak-points-10',
    name: 'Points Machine',
    description: '10 consecutive points finishes',
    category: 'streaks',
    rarity: 'uncommon',
    icon: '⬆️',
    conditions: { consecutivePoints: 10 },
    sortOrder: 67
  },
  {
    id: 'streak-points-20',
    name: 'Reliability King',
    description: '20 consecutive points finishes',
    category: 'streaks',
    rarity: 'rare',
    icon: '📍',
    conditions: { consecutivePoints: 20 },
    sortOrder: 68
  }
]

// ============================================
// TRACK MASTERY MILESTONES (20+ milestones)
// ============================================

export const TRACK_MASTERY_MILESTONES: Milestone[] = [
  // Legendary Venues
  {
    id: 'king-of-interlagos',
    name: 'King of Interlagos',
    description: '5+ wins at Interlagos',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇧🇷',
    conditions: { trackWins: { trackId: 'interlagos', minWins: 5 } },
    rewards: { unlockTitle: 'King of Interlagos' },
    sortOrder: 100
  },
  {
    id: 'spa-master',
    name: 'Spa Francorchamps Master',
    description: '5+ wins at Spa',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇧🇪',
    conditions: { trackWins: { trackId: 'spa', minWins: 5 } },
    rewards: { unlockTitle: 'Spa Master' },
    sortOrder: 101
  },
  {
    id: 'monza-king',
    name: 'Temple of Speed Victor',
    description: '5+ wins at Monza',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇮🇹',
    conditions: { trackWins: { trackId: 'monza', minWins: 5 } },
    rewards: { unlockTitle: 'Temple of Speed Victor' },
    sortOrder: 102
  },
  {
    id: 'silverstone-ace',
    name: 'Silverstone Ace',
    description: '5+ wins at Silverstone',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇬🇧',
    conditions: { trackWins: { trackId: 'silverstone', minWins: 5 } },
    rewards: { unlockTitle: 'Silverstone Ace' },
    sortOrder: 103
  },
  {
    id: 'monaco-specialist',
    name: 'Monaco Specialist',
    description: '3+ wins at Monaco (hard track!)',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇲🇨',
    conditions: { trackWins: { trackId: 'monaco', minWins: 3 } },
    rewards: { reputationBonus: 5, unlockTitle: 'Monaco Specialist' },
    sortOrder: 104
  },
  {
    id: 'nurburgring-survivor',
    name: 'Green Hell Survivor',
    description: 'Complete 10 races at Nürburgring Nordschleife',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🌲',
    conditions: { trackWins: { trackId: 'nurburgring', minWins: 0 } }, // Note: This needs special handling for visits
    sortOrder: 105
  },
  {
    id: 'nordschleife-win',
    name: 'Conquer the Green Hell',
    description: 'Win at Nürburgring Nordschleife',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🌲🏆',
    conditions: { trackWins: { trackId: 'nurburgring', minWins: 1 } },
    rewards: { reputationBonus: 3 },
    sortOrder: 106
  },
  
  // Le Mans Achievements
  {
    id: 'le-mans-winner',
    name: 'Le Mans Victor',
    description: 'Win at Le Mans',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇫🇷🏆',
    conditions: { trackWins: { trackId: 'le_mans', minWins: 1 } },
    rewards: { reputationBonus: 5 },
    sortOrder: 107
  },
  {
    id: 'le-mans-3',
    name: 'Le Mans Hat Trick',
    description: '3 wins at Le Mans',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇫🇷🎩',
    conditions: { trackWins: { trackId: 'le_mans', minWins: 3 } },
    rewards: { reputationBonus: 10 },
    sortOrder: 108
  },
  {
    id: 'le-mans-9',
    name: 'Kristensen Chaser',
    description: '9 wins at Le Mans (ties Tom Kristensen)',
    category: 'track_mastery',
    rarity: 'legendary',
    icon: '🇫🇷👑',
    conditions: { trackWins: { trackId: 'le_mans', minWins: 9 } },
    rewards: { reputationBonus: 15 },
    sortOrder: 109
  },
  {
    id: 'le-mans-10',
    name: 'Le Mans Legend',
    description: '10 wins at Le Mans (beats all-time record)',
    category: 'track_mastery',
    rarity: 'legendary',
    icon: '🇫🇷🌟',
    conditions: { trackWins: { trackId: 'le_mans', minWins: 10 } },
    rewards: { reputationBonus: 20, unlockTitle: 'Le Mans Legend' },
    sortOrder: 110
  },
  
  // Indianapolis Achievements  
  {
    id: 'indy-winner',
    name: 'Indianapolis 500 Winner',
    description: 'Win at Indianapolis Oval',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇺🇸🏆',
    conditions: { trackWins: { trackId: 'indianapolis', minWins: 1 } },
    rewards: { reputationBonus: 5 },
    sortOrder: 111
  },
  {
    id: 'indy-4',
    name: 'Indy Royalty',
    description: '4 Indy 500 wins (ties Foyt/Mears/Castroneves)',
    category: 'track_mastery',
    rarity: 'legendary',
    icon: '🇺🇸👑',
    conditions: { trackWins: { trackId: 'indianapolis', minWins: 4 } },
    rewards: { reputationBonus: 15 },
    sortOrder: 112
  },
  {
    id: 'indy-5',
    name: 'Indy GOAT',
    description: '5 Indy 500 wins (beats all-time record)',
    category: 'track_mastery',
    rarity: 'legendary',
    icon: '🇺🇸🌟',
    conditions: { trackWins: { trackId: 'indianapolis', minWins: 5 } },
    rewards: { reputationBonus: 20, unlockTitle: 'Indy GOAT' },
    sortOrder: 113
  },
  
  // Other Major Tracks
  {
    id: 'daytona-winner',
    name: 'Daytona Champion',
    description: 'Win at Daytona',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🏎️',
    conditions: { trackWins: { trackId: 'daytona', minWins: 1 } },
    sortOrder: 114
  },
  {
    id: 'bathurst-king',
    name: 'King of the Mountain',
    description: '5+ wins at Bathurst',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇦🇺',
    conditions: { trackWins: { trackId: 'bathurst', minWins: 5 } },
    rewards: { unlockTitle: 'King of the Mountain' },
    sortOrder: 115
  },
  {
    id: 'suzuka-master',
    name: 'Suzuka Specialist',
    description: '5+ wins at Suzuka',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇯🇵',
    conditions: { trackWins: { trackId: 'suzuka', minWins: 5 } },
    rewards: { unlockTitle: 'Suzuka Master' },
    sortOrder: 116
  },
  
  // Brazilian Circuit Mastery
  {
    id: 'brazil-all-tracks',
    name: 'Brazilian Tour',
    description: 'Win at every Brazilian track',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇧🇷🗺️',
    conditions: { 
      tracksWonAt: { 
        trackIds: ['interlagos', 'taruma', 'goiania', 'cascavel', 'curitiba', 'brasilia', 'londrina', 'salvador', 'santa_cruz', 'velopark', 'velo_citta', 'jacarepagua', 'campo_grande', 'curvelo', 'guapore', 'galeao', 'granja_viana', 'speedland', 'foz', 'ascurra'],
        all: true 
      } 
    },
    rewards: { reputationBonus: 10, unlockTitle: 'Brazilian Tour Champion' },
    sortOrder: 117
  },
  {
    id: 'taruma-legend',
    name: 'Tarumã Legend',
    description: '5+ wins at Tarumã',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇧🇷⭐',
    conditions: { trackWins: { trackId: 'taruma', minWins: 5 } },
    sortOrder: 118
  },
  {
    id: 'goiania-king',
    name: 'Goiânia King',
    description: '5+ wins at Goiânia',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇧🇷👑',
    conditions: { trackWins: { trackId: 'goiania', minWins: 5 } },
    sortOrder: 119
  },
  {
    id: 'cascavel-master',
    name: 'Cascavel Master',
    description: '5+ wins at Cascavel',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇧🇷🏁',
    conditions: { trackWins: { trackId: 'cascavel', minWins: 5 } },
    sortOrder: 120
  },
  
  // European Grand Tour
  {
    id: 'europe-grand-tour',
    name: 'European Grand Tour',
    description: 'Win at Spa, Monza, Silverstone, Nürburgring, and Monaco',
    category: 'track_mastery',
    rarity: 'legendary',
    icon: '🇪🇺🏆',
    conditions: { 
      tracksWonAt: { 
        trackIds: ['spa', 'monza', 'silverstone', 'nurburgring', 'monaco'],
        all: true 
      } 
    },
    rewards: { reputationBonus: 15, unlockTitle: 'European Grand Tour Champion' },
    sortOrder: 121
  },
  {
    id: 'hockenheim-hero',
    name: 'Hockenheim Hero',
    description: '5+ wins at Hockenheim',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇩🇪',
    conditions: { trackWins: { trackId: 'hockenheim', minWins: 5 } },
    sortOrder: 122
  },
  {
    id: 'imola-legend',
    name: 'Imola Legend',
    description: '5+ wins at Imola',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇮🇹⭐',
    conditions: { trackWins: { trackId: 'imola', minWins: 5 } },
    sortOrder: 123
  },
  {
    id: 'brands-hatch-ace',
    name: 'Brands Hatch Ace',
    description: '5+ wins at Brands Hatch',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇬🇧⭐',
    conditions: { trackWins: { trackId: 'brands_hatch', minWins: 5 } },
    sortOrder: 124
  },
  
  // American Dream
  {
    id: 'american-triple',
    name: 'American Triple',
    description: 'Win at Daytona, Sebring, and Indianapolis',
    category: 'track_mastery',
    rarity: 'epic',
    icon: '🇺🇸🎯',
    conditions: { 
      tracksWonAt: { 
        trackIds: ['daytona', 'sebring', 'indianapolis'],
        all: true 
      } 
    },
    rewards: { reputationBonus: 10 },
    sortOrder: 125
  },
  {
    id: 'road-america-king',
    name: 'Road America King',
    description: '5+ wins at Road America',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇺🇸👑',
    conditions: { trackWins: { trackId: 'road_america', minWins: 5 } },
    sortOrder: 126
  },
  {
    id: 'laguna-seca-corkscrew',
    name: 'Corkscrew Conqueror',
    description: '5+ wins at Laguna Seca',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🔄',
    conditions: { trackWins: { trackId: 'laguna_seca', minWins: 5 } },
    sortOrder: 127
  },
  {
    id: 'watkins-glen-master',
    name: 'Watkins Glen Master',
    description: '5+ wins at Watkins Glen',
    category: 'track_mastery',
    rarity: 'rare',
    icon: '🇺🇸🏁',
    conditions: { trackWins: { trackId: 'watkins_glen', minWins: 5 } },
    sortOrder: 128
  }
]

// ============================================
// SERIES PROGRESSION MILESTONES (30+ milestones)
// ============================================

export const SERIES_PROGRESSION_MILESTONES: Milestone[] = [
  // Karting
  {
    id: 'kart-graduate',
    name: 'Kart Graduate',
    description: 'Win a karting championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🏎️',
    conditions: { seriesChampionship: 'kart-125cc' },
    sortOrder: 200
  },
  {
    id: 'kart-triple',
    name: 'Kart Triple Crown',
    description: 'Win 125cc, Shifter, and Superkart championships',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🏎️👑',
    conditions: { seriesChampionships: ['kart-125cc', 'kart-shifter', 'superkart'] },
    rewards: { reputationBonus: 5 },
    sortOrder: 201
  },
  {
    id: 'superkart-champ',
    name: 'Superkart Champion',
    description: 'Win the Superkart championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🏎️⚡',
    conditions: { seriesChampionship: 'superkart' },
    sortOrder: 202
  },
  
  // Formula Ladder
  {
    id: 'formula-vee-grad',
    name: 'Formula Vee Graduate',
    description: 'Win Formula Vee championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🏁',
    conditions: { seriesChampionship: 'formula-vee' },
    sortOrder: 210
  },
  {
    id: 'f3-champion',
    name: 'F3 Champion',
    description: 'Win F3 championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '3️⃣',
    conditions: { seriesChampionship: 'f3' },
    sortOrder: 211
  },
  {
    id: 'formula-reiza-king',
    name: 'Formula Reiza King',
    description: 'Win Formula Reiza championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇧🇷🏆',
    conditions: { seriesChampionship: 'formula-reiza' },
    sortOrder: 212
  },
  {
    id: 'formula-usa-champ',
    name: 'Formula USA Champion',
    description: 'Win Formula USA championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇺🇸🏆',
    conditions: { seriesChampionship: 'formula-usa' },
    sortOrder: 213
  },
  {
    id: 'formula-ultimate-champ',
    name: 'Formula Ultimate Champion',
    description: 'Win Formula Ultimate (F1-style) championship',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🏆👑',
    conditions: { seriesChampionship: 'formula-ultimate' },
    rewards: { reputationBonus: 10, unlockTitle: 'World Champion' },
    sortOrder: 214
  },
  {
    id: 'formula-ladder-complete',
    name: 'Complete the Ladder',
    description: 'Win championships in F-Vee, F3, and Formula Ultimate',
    category: 'series_progression',
    rarity: 'epic',
    icon: '📈🏆',
    conditions: { seriesChampionships: ['formula-vee', 'f3', 'formula-ultimate'] },
    rewards: { reputationBonus: 15, unlockTitle: 'Ladder Master' },
    sortOrder: 215
  },
  
  // GT Racing
  {
    id: 'gt5-graduate',
    name: 'GT5 Graduate',
    description: 'Win GT5 championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🚗',
    conditions: { seriesChampionship: 'gt5' },
    sortOrder: 220
  },
  {
    id: 'gt4-champion',
    name: 'GT4 Champion',
    description: 'Win GT4 championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🚙',
    conditions: { seriesChampionship: 'gt4' },
    sortOrder: 221
  },
  {
    id: 'gt3-champion',
    name: 'GT3 Champion',
    description: 'Win GT3 championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🏎️',
    conditions: { seriesChampionship: 'gt3' },
    rewards: { reputationBonus: 5 },
    sortOrder: 222
  },
  {
    id: 'gt-ladder',
    name: 'GT Ladder Complete',
    description: 'Win GT5, GT4, and GT3 championships',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🚗📈',
    conditions: { seriesChampionships: ['gt5', 'gt4', 'gt3'] },
    rewards: { reputationBonus: 10, unlockTitle: 'GT Master' },
    sortOrder: 223
  },
  
  // Prototype/Endurance
  {
    id: 'p4-graduate',
    name: 'Prototype Graduate',
    description: 'Win P4 championship',
    category: 'series_progression',
    rarity: 'uncommon',
    icon: '🏁',
    conditions: { seriesChampionship: 'p4' },
    sortOrder: 230
  },
  {
    id: 'p3-champion',
    name: 'LMP3 Champion',
    description: 'Win P3/LMP3 championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🏎️',
    conditions: { seriesChampionship: 'lmp3' },
    sortOrder: 231
  },
  {
    id: 'lmp2-champion',
    name: 'LMP2 Champion',
    description: 'Win LMP2 championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🏎️⭐',
    conditions: { seriesChampionship: 'lmp2' },
    sortOrder: 232
  },
  {
    id: 'lmdh-champion',
    name: 'LMDh Champion',
    description: 'Win LMDh championship',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🏎️👑',
    conditions: { seriesChampionship: 'lmdh' },
    rewards: { reputationBonus: 10 },
    sortOrder: 233
  },
  {
    id: 'wec-champion',
    name: 'WEC World Champion',
    description: 'Win WEC championship',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🌍🏆',
    conditions: { seriesChampionship: 'wec' },
    rewards: { reputationBonus: 10, unlockTitle: 'WEC World Champion' },
    sortOrder: 234
  },
  {
    id: 'imsa-champion',
    name: 'IMSA Champion',
    description: 'Win IMSA championship',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🇺🇸🏆',
    conditions: { seriesChampionship: 'imsa' },
    rewards: { reputationBonus: 10, unlockTitle: 'IMSA Champion' },
    sortOrder: 235
  },
  {
    id: 'prototype-master',
    name: 'Prototype Master',
    description: 'Win LMDh in both WEC and IMSA',
    category: 'series_progression',
    rarity: 'legendary',
    icon: '🏎️🌟',
    conditions: { seriesChampionships: ['wec', 'imsa'] },
    rewards: { reputationBonus: 15, unlockTitle: 'Prototype Master' },
    sortOrder: 236
  },
  
  // Spec Series
  {
    id: 'carrera-cup-champ',
    name: 'Carrera Cup Champion',
    description: 'Win Porsche Carrera Cup',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🐎',
    conditions: { seriesChampionship: 'porsche-carrera-cup' },
    sortOrder: 240
  },
  {
    id: 'supercup-champ',
    name: 'Supercup Champion',
    description: 'Win Porsche Supercup',
    category: 'series_progression',
    rarity: 'epic',
    icon: '🐎👑',
    conditions: { seriesChampionship: 'porsche-supercup' },
    rewards: { reputationBonus: 5 },
    sortOrder: 241
  },
  {
    id: 'super-trofeo-champ',
    name: 'Super Trofeo Champion',
    description: 'Win Lamborghini Super Trofeo',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🐂',
    conditions: { seriesChampionship: 'lamborghini-super-trofeo' },
    sortOrder: 242
  },
  {
    id: 'caterham-ladder',
    name: 'Caterham Ladder',
    description: 'Win Academy, Superlight, and 620R championships',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇬🇧🏁',
    conditions: { seriesChampionships: ['caterham-academy', 'caterham-superlight', 'caterham-620r'] },
    rewards: { reputationBonus: 5 },
    sortOrder: 243
  },
  {
    id: 'ginetta-double',
    name: 'Ginetta Double',
    description: 'Win G40 and G55 championships',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇬🇧⭐',
    conditions: { seriesChampionships: ['ginetta-g40', 'ginetta-g55'] },
    sortOrder: 244
  },
  
  // National Championships
  {
    id: 'stock-car-brasil-champ',
    name: 'Stock Car Brasil Champion',
    description: 'Win Stock Car Brasil championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇧🇷🏆',
    conditions: { seriesChampionship: 'stock-car-brasil' },
    rewards: { reputationBonus: 5, unlockTitle: 'Stock Car Brasil Champion' },
    sortOrder: 250
  },
  {
    id: 'supercars-champion',
    name: 'Supercars Champion',
    description: 'Win Australian Supercars championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🇦🇺🏆',
    conditions: { seriesChampionship: 'supercars' },
    rewards: { reputationBonus: 5, unlockTitle: 'Supercars Champion' },
    sortOrder: 251
  },
  {
    id: 'copa-truck-champion',
    name: 'Copa Truck Champion',
    description: 'Win Copa Truck championship',
    category: 'series_progression',
    rarity: 'rare',
    icon: '🚚🏆',
    conditions: { seriesChampionship: 'copa-truck' },
    rewards: { unlockTitle: 'Copa Truck Champion' },
    sortOrder: 252
  }
]

// ============================================
// SPECIAL CHALLENGE MILESTONES (15+ milestones)
// ============================================

export const SPECIAL_CHALLENGE_MILESTONES: Milestone[] = [
  {
    id: 'perfect-season',
    name: 'Perfect Season',
    description: 'Win every race in a championship season',
    category: 'special_challenges',
    rarity: 'legendary',
    icon: '💯',
    conditions: { perfectSeasons: 1 },
    rewards: { reputationBonus: 20, unlockTitle: 'Perfectionist' },
    sortOrder: 300
  },
  {
    id: 'undefeated-quali',
    name: 'Qualifying King',
    description: 'Pole position for an entire season',
    category: 'special_challenges',
    rarity: 'legendary',
    icon: '🔵👑',
    conditions: { /* Special handling needed */ },
    rewards: { reputationBonus: 15 },
    sortOrder: 301
  },
  {
    id: 'clean-sweep',
    name: 'Clean Sweep',
    description: 'Win, pole, fastest lap every race in a season',
    category: 'special_challenges',
    rarity: 'legendary',
    icon: '🧹🏆',
    conditions: { /* Special handling needed */ },
    rewards: { reputationBonus: 25, unlockTitle: 'Dominant Champion' },
    sortOrder: 302
  },
  {
    id: 'comeback-king',
    name: 'Comeback King',
    description: 'Win a race from P10+ on the grid',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '↩️',
    conditions: { comebackWins: 1 },
    sortOrder: 303
  },
  {
    id: 'comeback-master',
    name: 'Comeback Master',
    description: 'Win 5 races from P10+ on the grid',
    category: 'special_challenges',
    rarity: 'epic',
    icon: '↩️👑',
    conditions: { comebackWins: 5 },
    rewards: { unlockTitle: 'Comeback Master' },
    sortOrder: 304
  },
  {
    id: 'last-lap-hero',
    name: 'Last Lap Hero',
    description: 'Win a race with a last-lap overtake',
    category: 'special_challenges',
    rarity: 'epic',
    icon: '⏱️',
    conditions: { lastLapWins: 1 },
    rewards: { reputationBonus: 3 },
    sortOrder: 305
  },
  {
    id: 'wet-weather-master',
    name: 'Rainmeister',
    description: 'Win 10 wet races',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '🌧️',
    conditions: { wetRaceWins: 10 },
    rewards: { unlockTitle: 'Rainmeister' },
    sortOrder: 306
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Win 5 night races',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '🌙',
    conditions: { nightRaceWins: 5 },
    rewards: { unlockTitle: 'Night Owl' },
    sortOrder: 307
  },
  {
    id: 'multi-class-king',
    name: 'Multi-Class Master',
    description: 'Win overall in 10 multi-class races',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '🏁🏁',
    conditions: { multiClassWins: 10 },
    sortOrder: 308
  },
  {
    id: 'world-traveler',
    name: 'World Traveler',
    description: 'Win on every continent (Europe, Americas, Asia, Oceania, Africa)',
    category: 'special_challenges',
    rarity: 'epic',
    icon: '🌍',
    conditions: { /* Special handling - track regions */ },
    rewards: { reputationBonus: 10, unlockTitle: 'World Traveler' },
    sortOrder: 309
  },
  {
    id: 'decade-driver',
    name: 'Decade Driver',
    description: 'Race for 10+ career seasons',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '📅',
    conditions: { seasonsCompleted: 10 },
    rewards: { unlockTitle: 'Decade Driver' },
    sortOrder: 310
  },
  {
    id: 'iron-man-season',
    name: 'Iron Man Season',
    description: 'Complete every race in a season without DNF',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '🦾🏁',
    conditions: { dnfFreeSeasons: 1 },
    sortOrder: 311
  },
  {
    id: 'underdog-victory',
    name: 'Giant Killer',
    description: 'Win in a lower-tier car against higher-tier opposition',
    category: 'special_challenges',
    rarity: 'rare',
    icon: '🏆⬆️',
    conditions: { /* Special handling needed */ },
    rewards: { reputationBonus: 3 },
    sortOrder: 312
  },
  {
    id: 'career-longevity',
    name: 'Racing Legend',
    description: 'Race for 20+ career seasons',
    category: 'special_challenges',
    rarity: 'epic',
    icon: '⏳',
    conditions: { seasonsCompleted: 20 },
    rewards: { reputationBonus: 10, unlockTitle: 'Racing Legend' },
    sortOrder: 313
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    description: 'Win championships in Formula, GT, and Prototype categories',
    category: 'special_challenges',
    rarity: 'epic',
    icon: '🎯',
    conditions: { /* Special handling - category tracking */ },
    rewards: { reputationBonus: 15, unlockTitle: 'All-Rounder' },
    sortOrder: 314
  }
]

// ============================================
// TRIPLE CROWN DEFINITIONS
// ============================================

export interface TripleCrownLeg {
  id: string
  name: string
  description: string
  trackId: string
  seriesIds: string[]  // Any of these series count
  eventType?: 'race' | 'championship'  // Race win or championship required?
}

export interface TripleCrown {
  id: string
  name: string
  description: string
  rarity: MilestoneRarity
  icon: string
  legs: TripleCrownLeg[]
  historicalAchievers?: string[]  // Real drivers who achieved this
  rewards: {
    reputationBonus: number
    unlockTitle: string
  }
}

export const TRIPLE_CROWNS: TripleCrown[] = [
  {
    id: 'motorsport-triple-crown',
    name: 'Motorsport Triple Crown',
    description: 'Win Monaco GP, Indianapolis 500, and Le Mans 24h - only Graham Hill achieved this!',
    rarity: 'legendary',
    icon: '👑👑👑',
    legs: [
      {
        id: 'monaco-gp',
        name: 'Monaco Grand Prix',
        description: 'Win at Monaco',
        trackId: 'monaco',
        seriesIds: ['formula-ultimate', 'formula-reiza'],
        eventType: 'race'
      },
      {
        id: 'indy-500',
        name: 'Indianapolis 500',
        description: 'Win at Indianapolis Oval',
        trackId: 'indianapolis',
        seriesIds: ['formula-usa', 'indycar'],
        eventType: 'race'
      },
      {
        id: 'le-mans-24h',
        name: '24 Hours of Le Mans',
        description: 'Win at Le Mans',
        trackId: 'le_mans',
        seriesIds: ['wec', 'imsa', 'lmdh'],
        eventType: 'race'
      }
    ],
    historicalAchievers: ['Graham Hill'],
    rewards: {
      reputationBonus: 30,
      unlockTitle: 'Triple Crown Champion'
    }
  },
  {
    id: 'endurance-triple-crown',
    name: 'Endurance Triple Crown',
    description: 'Win Daytona 24h, Sebring 12h, and Le Mans 24h - only ~10 drivers ever!',
    rarity: 'legendary',
    icon: '🏁🏁🏁',
    legs: [
      {
        id: 'daytona-24h',
        name: '24 Hours of Daytona',
        description: 'Win at Daytona',
        trackId: 'daytona',
        seriesIds: ['imsa', 'wec'],
        eventType: 'race'
      },
      {
        id: 'sebring-12h',
        name: '12 Hours of Sebring',
        description: 'Win at Sebring',
        trackId: 'sebring',
        seriesIds: ['imsa', 'wec'],
        eventType: 'race'
      },
      {
        id: 'le-mans-24h-endurance',
        name: '24 Hours of Le Mans',
        description: 'Win at Le Mans',
        trackId: 'le_mans',
        seriesIds: ['wec', 'imsa'],
        eventType: 'race'
      }
    ],
    historicalAchievers: ['Tom Kristensen', 'Hurley Haywood', 'Al Holbert', 'Mauro Baldi', 'Emanuale Pirro', 'Frank Biela', 'Marco Werner', 'Allan McNish', 'Rinaldo Capello', 'Earl Bamber'],
    rewards: {
      reputationBonus: 25,
      unlockTitle: 'Endurance Triple Crown Champion'
    }
  },
  {
    id: 'big-six-endurance',
    name: 'Big Six Endurance',
    description: 'Win at all six legendary endurance events',
    rarity: 'legendary',
    icon: '6️⃣🏆',
    legs: [
      {
        id: 'daytona-24h-big6',
        name: '24 Hours of Daytona',
        description: 'Win at Daytona',
        trackId: 'daytona',
        seriesIds: ['imsa'],
        eventType: 'race'
      },
      {
        id: 'sebring-12h-big6',
        name: '12 Hours of Sebring',
        description: 'Win at Sebring',
        trackId: 'sebring',
        seriesIds: ['imsa'],
        eventType: 'race'
      },
      {
        id: 'le-mans-big6',
        name: '24 Hours of Le Mans',
        description: 'Win at Le Mans',
        trackId: 'le_mans',
        seriesIds: ['wec'],
        eventType: 'race'
      },
      {
        id: 'spa-24h',
        name: '24 Hours of Spa',
        description: 'Win at Spa 24h',
        trackId: 'spa',
        seriesIds: ['gt-world-challenge', 'blancpain'],
        eventType: 'race'
      },
      {
        id: 'nurburgring-24h',
        name: '24 Hours of Nürburgring',
        description: 'Win at Nürburgring 24h',
        trackId: 'nurburgring',
        seriesIds: ['n24', 'vln'],
        eventType: 'race'
      },
      {
        id: 'petit-le-mans',
        name: 'Petit Le Mans',
        description: 'Win at Road Atlanta (Petit Le Mans)',
        trackId: 'road_atlanta',
        seriesIds: ['imsa'],
        eventType: 'race'
      }
    ],
    rewards: {
      reputationBonus: 35,
      unlockTitle: 'Endurance Legend'
    }
  },
  {
    id: 'brazilian-triple',
    name: 'Brazilian Triple',
    description: 'AMS2-specific: Win at Interlagos, Stock Car Brasil championship, and Carrera Cup Brasil championship',
    rarity: 'epic',
    icon: '🇧🇷👑',
    legs: [
      {
        id: 'interlagos-win',
        name: 'Interlagos Victory',
        description: 'Win at Interlagos',
        trackId: 'interlagos',
        seriesIds: ['*'], // Any series
        eventType: 'race'
      },
      {
        id: 'stock-car-brasil-title',
        name: 'Stock Car Brasil Championship',
        description: 'Win Stock Car Brasil title',
        trackId: '*', // Any track
        seriesIds: ['stock-car-brasil'],
        eventType: 'championship'
      },
      {
        id: 'carrera-cup-brasil-title',
        name: 'Carrera Cup Brasil Championship',
        description: 'Win Carrera Cup Brasil title',
        trackId: '*',
        seriesIds: ['porsche-carrera-cup-brasil'],
        eventType: 'championship'
      }
    ],
    rewards: {
      reputationBonus: 20,
      unlockTitle: 'Brazilian Triple Champion'
    }
  }
]

// ============================================
// HISTORICAL RECORDS TO BEAT
// ============================================

export interface HistoricalRecord {
  id: string
  name: string
  description: string
  category: 'formula' | 'endurance' | 'indycar' | 'supercars' | 'general'
  recordHolder: string
  recordValue: number
  valueType: 'count' | 'percentage' | 'time'
  yourValuePath: string  // Path to player stat to compare
  beatReward: {
    reputationBonus: number
    unlockTitle?: string
  }
}

export const HISTORICAL_RECORDS: HistoricalRecord[] = [
  // Formula 1/Ultimate Records
  {
    id: 'f1-most-championships',
    name: 'Most F1 Championships',
    description: 'Beat the record for most World Championships',
    category: 'formula',
    recordHolder: 'Michael Schumacher / Lewis Hamilton',
    recordValue: 7,
    valueType: 'count',
    yourValuePath: 'championships',
    beatReward: { reputationBonus: 25, unlockTitle: 'Record-Breaking Champion' }
  },
  {
    id: 'f1-most-wins',
    name: 'Most F1 Race Wins',
    description: 'Beat Lewis Hamilton\'s record of 104 wins',
    category: 'formula',
    recordHolder: 'Lewis Hamilton',
    recordValue: 104,
    valueType: 'count',
    yourValuePath: 'totalWins',
    beatReward: { reputationBonus: 20, unlockTitle: 'Most Victorious' }
  },
  {
    id: 'f1-most-poles',
    name: 'Most Pole Positions',
    description: 'Beat Lewis Hamilton\'s record of 104 poles',
    category: 'formula',
    recordHolder: 'Lewis Hamilton',
    recordValue: 104,
    valueType: 'count',
    yourValuePath: 'totalPoles',
    beatReward: { reputationBonus: 15, unlockTitle: 'Pole King' }
  },
  {
    id: 'f1-most-podiums',
    name: 'Most Podium Finishes',
    description: 'Beat Lewis Hamilton\'s record of 201 podiums',
    category: 'formula',
    recordHolder: 'Lewis Hamilton',
    recordValue: 201,
    valueType: 'count',
    yourValuePath: 'totalPodiums',
    beatReward: { reputationBonus: 15 }
  },
  {
    id: 'f1-most-fastest-laps',
    name: 'Most Fastest Laps',
    description: 'Beat Michael Schumacher\'s record of 77 fastest laps',
    category: 'formula',
    recordHolder: 'Michael Schumacher',
    recordValue: 77,
    valueType: 'count',
    yourValuePath: 'totalFastestLaps',
    beatReward: { reputationBonus: 10 }
  },
  
  // Endurance Records
  {
    id: 'le-mans-most-wins',
    name: 'Most Le Mans Wins',
    description: 'Beat Tom Kristensen\'s record of 9 Le Mans wins',
    category: 'endurance',
    recordHolder: 'Tom Kristensen',
    recordValue: 9,
    valueType: 'count',
    yourValuePath: 'trackHistory.le_mans.wins',
    beatReward: { reputationBonus: 25, unlockTitle: 'Le Mans GOAT' }
  },
  {
    id: 'sebring-most-wins',
    name: 'Most Sebring Wins',
    description: 'Beat the record of 5 Sebring 12h wins',
    category: 'endurance',
    recordHolder: 'Various',
    recordValue: 5,
    valueType: 'count',
    yourValuePath: 'trackHistory.sebring.wins',
    beatReward: { reputationBonus: 15, unlockTitle: 'Sebring Legend' }
  },
  {
    id: 'daytona-most-wins',
    name: 'Most Daytona 24h Wins',
    description: 'Beat the record of 5 Daytona 24h wins',
    category: 'endurance',
    recordHolder: 'Various',
    recordValue: 5,
    valueType: 'count',
    yourValuePath: 'trackHistory.daytona.wins',
    beatReward: { reputationBonus: 15, unlockTitle: 'Daytona Legend' }
  },
  
  // IndyCar/Formula USA Records
  {
    id: 'indy500-most-wins',
    name: 'Most Indy 500 Wins',
    description: 'Beat the record of 4 Indy 500 wins (Foyt/Mears/Castroneves)',
    category: 'indycar',
    recordHolder: 'A.J. Foyt / Rick Mears / Helio Castroneves',
    recordValue: 4,
    valueType: 'count',
    yourValuePath: 'trackHistory.indianapolis.wins',
    beatReward: { reputationBonus: 25, unlockTitle: 'Indy Legend' }
  },
  {
    id: 'indycar-most-championships',
    name: 'Most IndyCar Championships',
    description: 'Beat A.J. Foyt\'s record of 7 IndyCar championships',
    category: 'indycar',
    recordHolder: 'A.J. Foyt',
    recordValue: 7,
    valueType: 'count',
    yourValuePath: 'indyCarChampionships',
    beatReward: { reputationBonus: 20 }
  },
  
  // Australian Supercars Records
  {
    id: 'bathurst-most-wins',
    name: 'Most Bathurst 1000 Wins',
    description: 'Beat Peter Brock\'s record of 9 Bathurst wins',
    category: 'supercars',
    recordHolder: 'Peter Brock',
    recordValue: 9,
    valueType: 'count',
    yourValuePath: 'trackHistory.bathurst.wins',
    beatReward: { reputationBonus: 20, unlockTitle: 'King of the Mountain' }
  },
  {
    id: 'supercars-most-championships',
    name: 'Most Supercars Championships',
    description: 'Beat the V8 era record of 4 championships',
    category: 'supercars',
    recordHolder: 'Various',
    recordValue: 4,
    valueType: 'count',
    yourValuePath: 'supercarsChampionships',
    beatReward: { reputationBonus: 15 }
  },
  
  // ===== GENERAL CAREER RECORDS =====
  // These apply to all drivers regardless of series
  {
    id: 'career-total-wins',
    name: 'Career Race Wins',
    description: 'Your total race wins across all series',
    category: 'general',
    recordHolder: 'Your Personal Best',
    recordValue: 50,
    valueType: 'count',
    yourValuePath: 'totalWins',
    beatReward: { reputationBonus: 10, unlockTitle: '50 Win Club' }
  },
  {
    id: 'career-total-podiums',
    name: 'Career Podiums',
    description: 'Your total podium finishes across all series',
    category: 'general',
    recordHolder: 'Your Personal Best',
    recordValue: 100,
    valueType: 'count',
    yourValuePath: 'totalPodiums',
    beatReward: { reputationBonus: 10, unlockTitle: 'Century Podiums' }
  },
  {
    id: 'career-total-poles',
    name: 'Career Pole Positions',
    description: 'Your total pole positions across all series',
    category: 'general',
    recordHolder: 'Your Personal Best',
    recordValue: 50,
    valueType: 'count',
    yourValuePath: 'totalPoles',
    beatReward: { reputationBonus: 10, unlockTitle: 'Pole Master' }
  },
  {
    id: 'career-total-championships',
    name: 'Career Championships',
    description: 'Your total championships across all series',
    category: 'general',
    recordHolder: 'Your Personal Best',
    recordValue: 5,
    valueType: 'count',
    yourValuePath: 'championships',
    beatReward: { reputationBonus: 20, unlockTitle: 'Multi-Champion' }
  },
  {
    id: 'career-total-races',
    name: 'Career Race Starts',
    description: 'Your total race entries across all series',
    category: 'general',
    recordHolder: 'Your Personal Best',
    recordValue: 200,
    valueType: 'count',
    yourValuePath: 'totalRaces',
    beatReward: { reputationBonus: 10, unlockTitle: 'Career Veteran' }
  },
  {
    id: 'career-win-rate',
    name: 'Win Rate Target',
    description: 'Target 25% win rate across your career',
    category: 'general',
    recordHolder: 'Elite Standard',
    recordValue: 25,
    valueType: 'percentage',
    yourValuePath: 'winPercentage',
    beatReward: { reputationBonus: 15, unlockTitle: 'Elite Racer' }
  }
]

// ============================================
// COMBINED MILESTONE LIST
// ============================================

export const ALL_MILESTONES: Milestone[] = [
  ...CAREER_FIRST_MILESTONES,
  ...CAREER_VOLUME_MILESTONES,
  ...STREAK_MILESTONES,
  ...TRACK_MASTERY_MILESTONES,
  ...SERIES_PROGRESSION_MILESTONES,
  ...SPECIAL_CHALLENGE_MILESTONES
]

// ============================================
// GOAT PROGRESS INTERFACE
// ============================================

export interface TripleCrownProgress {
  [crownId: string]: {
    [legId: string]: boolean
  }
}

export interface RecordProgress {
  recordId: string
  currentValue: number
  recordValue: number
  beaten: boolean
  beatenDate?: string
}

export interface GOATProgress {
  currentTier: GOATTier
  tierProgress: number // 0-100 progress toward next tier
  
  // Milestone tracking
  milestones: Record<string, MilestoneStatus>
  newlyUnlocked: string[] // IDs of milestones unlocked this session
  
  // Triple Crown tracking
  tripleCrowns: TripleCrownProgress
  completedCrowns: string[] // IDs of completed triple crowns
  
  // Record tracking
  recordProgress: Record<string, RecordProgress>
  recordsBroken: number
  
  // Stats for tier calculation
  totalMilestonesUnlocked: number
  legendaryMilestonesUnlocked: number
  
  // Titles earned
  earnedTitles: string[]
  currentTitle?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current GOAT tier based on stats
 */
export function calculateGOATTier(
  reputation: number,
  wins: number,
  championships: number,
  tripleLegsCompleted: number,
  recordsBroken: number
): GOATTierDefinition {
  // Check tiers from highest to lowest
  for (let i = GOAT_TIERS.length - 1; i >= 0; i--) {
    const tier = GOAT_TIERS[i]
    const req = tier.requirements
    
    if (
      reputation >= tier.repMin &&
      (!req.minWins || wins >= req.minWins) &&
      (!req.minChampionships || championships >= req.minChampionships) &&
      (!req.minTripleCrownLegs || tripleLegsCompleted >= req.minTripleCrownLegs) &&
      (!req.minRecordsBroken || recordsBroken >= req.minRecordsBroken)
    ) {
      return tier
    }
  }
  
  return GOAT_TIERS[0] // Default to rookie
}

/**
 * Calculate progress toward the next tier (0-100)
 * Returns the MINIMUM progress across all requirements (the bottleneck)
 */
export function calculateTierProgress(
  currentTier: GOATTier,
  playerStats: {
    reputation: number
    totalWins: number
    totalPodiums: number
    totalRaces: number
    championships: number
  }
): number {
  const tierIndex = GOAT_TIERS.findIndex(t => t.id === currentTier)
  if (tierIndex === GOAT_TIERS.length - 1) return 100 // Max tier
  
  const next = GOAT_TIERS[tierIndex + 1]
  const progressValues: number[] = []
  
  // Reputation progress
  if (next.repMin > 0) {
    progressValues.push(Math.min(100, (playerStats.reputation / next.repMin) * 100))
  }
  
  // Races progress
  if (next.requirements.minRaces) {
    progressValues.push(Math.min(100, (playerStats.totalRaces / next.requirements.minRaces) * 100))
  }
  
  // Podiums progress
  if (next.requirements.minPodiums) {
    progressValues.push(Math.min(100, (playerStats.totalPodiums / next.requirements.minPodiums) * 100))
  }
  
  // Wins progress
  if (next.requirements.minWins) {
    progressValues.push(Math.min(100, (playerStats.totalWins / next.requirements.minWins) * 100))
  }
  
  // Championships progress
  if (next.requirements.minChampionships) {
    progressValues.push(Math.min(100, (playerStats.championships / next.requirements.minChampionships) * 100))
  }
  
  // If no requirements, return 100
  if (progressValues.length === 0) return 100
  
  // Return minimum progress (bottleneck requirement)
  return Math.round(Math.min(...progressValues))
}

/**
 * Check if a milestone condition is met
 */
export function checkMilestoneCondition(
  milestone: Milestone,
  playerStats: {
    totalRaces: number
    totalWins: number
    totalPodiums: number
    totalPoles: number
    totalFastestLaps?: number
    championships: number
    consecutiveWins?: number
    consecutivePodiums?: number
    consecutivePoints?: number
    trackHistory?: Record<string, { wins: number; visits: number }>
    seriesChampionships?: string[]
    hatTricks?: number
    grandSlams?: number
    wetRaceWins?: number
    nightRaceWins?: number
    comebackWins?: number
    seasonsCompleted?: number
    perfectSeasons?: number
    dnfFreeSeasons?: number
    multiClassWins?: number
    lastLapWins?: number
    giantKillerWins?: number
    continentsWonAt?: string[]
    categoriesWithChampionships?: string[] // e.g., ['formula', 'gt', 'prototype']
    qualifyingKingSeasons?: number // Seasons with pole at every race
    cleanSweepSeasons?: number // Seasons with win+pole+FL at every race
  }
): boolean {
  const c = milestone.conditions
  
  // If there are no conditions at all, don't auto-unlock
  if (!c || Object.keys(c).length === 0) return false
  
  // Track which conditions we've actually checked
  let conditionsChecked = 0
  let conditionsPassed = 0
  
  // Basic stats checks
  if (c.totalRaces !== undefined) {
    conditionsChecked++
    if (playerStats.totalRaces >= c.totalRaces) conditionsPassed++
  }
  if (c.totalWins !== undefined) {
    conditionsChecked++
    if (playerStats.totalWins >= c.totalWins) conditionsPassed++
  }
  if (c.totalPodiums !== undefined) {
    conditionsChecked++
    if (playerStats.totalPodiums >= c.totalPodiums) conditionsPassed++
  }
  if (c.totalPoles !== undefined) {
    conditionsChecked++
    if (playerStats.totalPoles >= c.totalPoles) conditionsPassed++
  }
  if (c.totalFastestLaps !== undefined) {
    conditionsChecked++
    if ((playerStats.totalFastestLaps || 0) >= c.totalFastestLaps) conditionsPassed++
  }
  if (c.championships !== undefined) {
    conditionsChecked++
    if (playerStats.championships >= c.championships) conditionsPassed++
  }
  if (c.consecutiveWins !== undefined) {
    conditionsChecked++
    if ((playerStats.consecutiveWins || 0) >= c.consecutiveWins) conditionsPassed++
  }
  if (c.consecutivePodiums !== undefined) {
    conditionsChecked++
    if ((playerStats.consecutivePodiums || 0) >= c.consecutivePodiums) conditionsPassed++
  }
  if (c.consecutivePoints !== undefined) {
    conditionsChecked++
    if ((playerStats.consecutivePoints || 0) >= c.consecutivePoints) conditionsPassed++
  }
  if (c.hatTricks !== undefined) {
    conditionsChecked++
    if ((playerStats.hatTricks || 0) >= c.hatTricks) conditionsPassed++
  }
  if (c.grandSlams !== undefined) {
    conditionsChecked++
    if ((playerStats.grandSlams || 0) >= c.grandSlams) conditionsPassed++
  }
  if (c.wetRaceWins !== undefined) {
    conditionsChecked++
    if ((playerStats.wetRaceWins || 0) >= c.wetRaceWins) conditionsPassed++
  }
  if (c.nightRaceWins !== undefined) {
    conditionsChecked++
    if ((playerStats.nightRaceWins || 0) >= c.nightRaceWins) conditionsPassed++
  }
  if (c.comebackWins !== undefined) {
    conditionsChecked++
    if ((playerStats.comebackWins || 0) >= c.comebackWins) conditionsPassed++
  }
  if (c.seasonsCompleted !== undefined) {
    conditionsChecked++
    if ((playerStats.seasonsCompleted || 0) >= c.seasonsCompleted) conditionsPassed++
  }
  if (c.perfectSeasons !== undefined) {
    conditionsChecked++
    if ((playerStats.perfectSeasons || 0) >= c.perfectSeasons) conditionsPassed++
  }
  if (c.dnfFreeSeasons !== undefined) {
    conditionsChecked++
    if ((playerStats.dnfFreeSeasons || 0) >= c.dnfFreeSeasons) conditionsPassed++
  }
  
  // Multi-class wins check
  if (c.multiClassWins !== undefined) {
    conditionsChecked++
    if ((playerStats.multiClassWins || 0) >= c.multiClassWins) conditionsPassed++
  }
  
  // Last lap wins check
  if (c.lastLapWins !== undefined) {
    conditionsChecked++
    if ((playerStats.lastLapWins || 0) >= c.lastLapWins) conditionsPassed++
  }
  
  // Track wins check
  if (c.trackWins) {
    conditionsChecked++
    const trackStats = playerStats.trackHistory?.[c.trackWins.trackId]
    if (trackStats && trackStats.wins >= c.trackWins.minWins) conditionsPassed++
  }
  
  // Tracks won at check (all tracks)
  if (c.tracksWonAt) {
    conditionsChecked++
    if (playerStats.trackHistory && c.tracksWonAt.all) {
      const allWon = c.tracksWonAt.trackIds.every(
        trackId => (playerStats.trackHistory?.[trackId]?.wins ?? 0) > 0
      ) ?? false
      if (allWon) conditionsPassed++
    }
  }
  
  // Series championship check
  if (c.seriesChampionship) {
    conditionsChecked++
    if (playerStats.seriesChampionships?.includes(c.seriesChampionship)) {
      conditionsPassed++
    }
  }
  
  // Multiple series championships check
  if (c.seriesChampionships) {
    conditionsChecked++
    if (playerStats.seriesChampionships) {
      const allWon = c.seriesChampionships.every(
        series => playerStats.seriesChampionships?.includes(series)
      )
      if (allWon) conditionsPassed++
    }
  }
  
  // ================================================
  // SPECIAL CONDITIONS - require specific tracking
  // These must be EXPLICITLY checked - don't auto-pass
  // ================================================
  
  // Qualifying King - pole at every race in a season
  // This requires season-level tracking
  if ('qualifyingKingSeasons' in c || milestone.id === 'qualifying-king') {
    conditionsChecked++
    if ((playerStats.qualifyingKingSeasons || 0) >= 1) conditionsPassed++
  }
  
  // Clean Sweep - win+pole+FL at every race in a season
  if ('cleanSweepSeasons' in c || milestone.id === 'clean-sweep') {
    conditionsChecked++
    if ((playerStats.cleanSweepSeasons || 0) >= 1) conditionsPassed++
  }
  
  // Giant Killer - beat higher-tier cars
  if ('giantKillerWins' in c || milestone.id === 'giant-killer') {
    conditionsChecked++
    if ((playerStats.giantKillerWins || 0) >= 1) conditionsPassed++
  }
  
  // World Traveler - win on every continent
  if (milestone.id === 'world-traveler') {
    conditionsChecked++
    const requiredContinents = ['europe', 'americas', 'asia', 'oceania', 'africa']
    if (playerStats.continentsWonAt) {
      const allContinents = requiredContinents.every(c => playerStats.continentsWonAt?.includes(c))
      if (allContinents) conditionsPassed++
    }
  }
  
  // All-Rounder - championships in Formula, GT, and Prototype
  if (milestone.id === 'all-rounder') {
    conditionsChecked++
    const requiredCategories = ['formula', 'gt', 'prototype']
    if (playerStats.categoriesWithChampionships) {
      const allCategories = requiredCategories.every(c => playerStats.categoriesWithChampionships?.includes(c))
      if (allCategories) conditionsPassed++
    }
  }
  
  // If no conditions were checkable, don't unlock
  if (conditionsChecked === 0) return false
  
  // All checked conditions must pass
  return conditionsPassed === conditionsChecked
}

/**
 * Get milestone by ID
 */
export function getMilestoneById(id: string): Milestone | undefined {
  return ALL_MILESTONES.find(m => m.id === id)
}

/**
 * Get milestones by category
 */
export function getMilestonesByCategory(category: MilestoneCategory): Milestone[] {
  return ALL_MILESTONES.filter(m => m.category === category).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Get milestones by rarity
 */
export function getMilestonesByRarity(rarity: MilestoneRarity): Milestone[] {
  return ALL_MILESTONES.filter(m => m.rarity === rarity)
}

/**
 * Initialize empty GOAT progress
 */
export function createDefaultGOATProgress(): GOATProgress {
  const milestones: Record<string, MilestoneStatus> = {}
  ALL_MILESTONES.forEach(m => {
    milestones[m.id] = 'locked'
  })
  
  const tripleCrowns: TripleCrownProgress = {}
  TRIPLE_CROWNS.forEach(crown => {
    tripleCrowns[crown.id] = {}
    crown.legs.forEach(leg => {
      tripleCrowns[crown.id][leg.id] = false
    })
  })
  
  const recordProgress: Record<string, RecordProgress> = {}
  HISTORICAL_RECORDS.forEach(record => {
    recordProgress[record.id] = {
      recordId: record.id,
      currentValue: 0,
      recordValue: record.recordValue,
      beaten: false
    }
  })
  
  return {
    currentTier: 'rookie',
    tierProgress: 0,
    milestones,
    newlyUnlocked: [],
    tripleCrowns,
    completedCrowns: [],
    recordProgress,
    recordsBroken: 0,
    totalMilestonesUnlocked: 0,
    legendaryMilestonesUnlocked: 0,
    earnedTitles: [],
    currentTitle: undefined
  }
}

// ============================================
// COMMENTARY HELPER FUNCTIONS
// ============================================

/**
 * Records near breaking - for commentary system
 * Returns records where player is within threshold of breaking
 */
export interface RecordNearBreaking {
  recordId: string
  recordName: string
  recordHolder: string
  recordValue: number
  currentValue: number
  remaining: number
  category: string
}

export function getRecordsNearBreaking(
  goatProgress: GOATProgress | undefined,
  playerStats: { 
    totalWins?: number
    totalPodiums?: number
    totalPoles?: number
    totalFastestLaps?: number
    championships?: number
    totalRaces?: number
  },
  threshold = 5
): RecordNearBreaking[] {
  if (!goatProgress?.recordProgress) return []
  
  const nearBreaking: RecordNearBreaking[] = []
  
  for (const record of HISTORICAL_RECORDS) {
    const progress = goatProgress.recordProgress[record.id]
    if (!progress || progress.beaten) continue
    
    // Get current value from either progress tracking or player stats
    let currentValue = progress.currentValue || 0
    
    // Fall back to player stats if progress isn't tracked
    if (currentValue === 0) {
      switch (record.yourValuePath) {
        case 'totalWins':
          currentValue = playerStats.totalWins || 0
          break
        case 'totalPodiums':
          currentValue = playerStats.totalPodiums || 0
          break
        case 'totalPoles':
          currentValue = playerStats.totalPoles || 0
          break
        case 'totalFastestLaps':
          currentValue = playerStats.totalFastestLaps || 0
          break
        case 'championships':
          currentValue = playerStats.championships || 0
          break
        case 'totalRaces':
          currentValue = playerStats.totalRaces || 0
          break
      }
    }
    
    const remaining = record.recordValue - currentValue
    
    // Include if within threshold and not already broken
    if (remaining > 0 && remaining <= threshold) {
      nearBreaking.push({
        recordId: record.id,
        recordName: record.name,
        recordHolder: record.recordHolder,
        recordValue: record.recordValue,
        currentValue,
        remaining,
        category: record.category
      })
    }
  }
  
  // Sort by how close they are (closest first)
  return nearBreaking.sort((a, b) => a.remaining - b.remaining)
}

/**
 * Triple Crown progress - for commentary system
 * Returns progress on each triple crown
 */
export interface TripleCrownProgressSummary {
  crownId: string
  crownName: string
  legsCompleted: number
  totalLegs: number
  nextLeg?: string
  completedLegNames: string[]
  isComplete: boolean
  rarity: string
}

export function getTripleCrownProgress(
  goatProgress: GOATProgress | undefined
): TripleCrownProgressSummary[] {
  if (!goatProgress?.tripleCrowns) return []
  
  return TRIPLE_CROWNS.map(crown => {
    const crownProgress = goatProgress.tripleCrowns[crown.id] || {}
    const completedLegNames: string[] = []
    let nextLeg: string | undefined
    
    let legsCompleted = 0
    for (const leg of crown.legs) {
      if (crownProgress[leg.id]) {
        legsCompleted++
        completedLegNames.push(leg.name)
      } else if (!nextLeg) {
        nextLeg = leg.name
      }
    }
    
    return {
      crownId: crown.id,
      crownName: crown.name,
      legsCompleted,
      totalLegs: crown.legs.length,
      nextLeg,
      completedLegNames,
      isComplete: legsCompleted === crown.legs.length,
      rarity: crown.rarity
    }
  }).filter(crown => crown.legsCompleted > 0 || crown.totalLegs === 3) // Only show crowns with progress or main ones
}

/**
 * Get the next GOAT tier and what's needed
 */
export function getNextTierInfo(currentTier: GOATTier): {
  nextTierName: string
  requirements: string[]
} | null {
  const tierIndex = GOAT_TIERS.findIndex(t => t.id === currentTier)
  if (tierIndex === -1 || tierIndex >= GOAT_TIERS.length - 1) return null
  
  const nextTier = GOAT_TIERS[tierIndex + 1]
  const requirements: string[] = []
  
  if (nextTier.repMin > 0) requirements.push(`${nextTier.repMin}+ reputation`)
  if (nextTier.requirements.minWins) requirements.push(`${nextTier.requirements.minWins}+ wins`)
  if (nextTier.requirements.minChampionships) requirements.push(`${nextTier.requirements.minChampionships}+ championships`)
  if (nextTier.requirements.minTripleCrownLegs) requirements.push(`${nextTier.requirements.minTripleCrownLegs}+ Triple Crown legs`)
  if (nextTier.requirements.minRecordsBroken) requirements.push(`${nextTier.requirements.minRecordsBroken}+ records broken`)
  
  return {
    nextTierName: nextTier.name,
    requirements
  }
}

/**
 * Check if a potential win would break any record
 */
export function checkIfWinBreaksRecord(
  goatProgress: GOATProgress | undefined,
  playerStats: { totalWins?: number; championships?: number }
): string | null {
  if (!goatProgress?.recordProgress) return null
  
  // Check win-based records
  const winsAfter = (playerStats.totalWins || 0) + 1
  
  for (const record of HISTORICAL_RECORDS) {
    if (record.yourValuePath === 'totalWins') {
      const progress = goatProgress.recordProgress[record.id]
      if (!progress?.beaten && winsAfter > record.recordValue) {
        return `${record.name} (beating ${record.recordHolder})`
      }
    }
  }
  
  return null
}

