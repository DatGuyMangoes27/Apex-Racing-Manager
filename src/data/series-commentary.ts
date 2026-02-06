/**
 * Series Commentary Profiles
 * 
 * Defines how commentary should sound for different types of racing series.
 * Each category has its own terminology, forbidden terms, and cultural context.
 * 
 * This prevents F1-centric commentary bleeding into GT, Touring, or other series.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SeriesCategory = 
  | 'touring'       // Stock Car Brasil, Supercars, BTCC-style
  | 'gt-sportscar'  // GT3, GT4, GT World Challenge
  | 'formula'       // Open-wheel (not F1)
  | 'formula-f1'    // Only Formula Ultimate (F1-style)
  | 'endurance'     // WEC, IMSA, long-distance
  | 'spec-series'   // Porsche Cup, Lamborghini Trofeo, Caterham
  | 'prototype'     // LMP2, P3, P4
  | 'historic'      // Classic cars, Group C
  | 'entry-level'   // Copa series, beginner championships

export interface SeriesTerminology {
  overtake: string[]      // Words for passing
  battle: string[]        // Words for fighting for position
  leader: string[]        // Ways to refer to the leader
  gap: string[]           // Describing intervals
  speed: string[]         // Describing pace
  driver: string[]        // How to reference competitors
  mistake: string[]       // Describing errors
  weather: string[]       // Weather-related terms
  pit: string[]           // Pit stop terminology
  start: string[]         // Race start terminology
  finish: string[]        // Race end terminology
}

export interface SeriesCommentaryProfile {
  category: SeriesCategory
  displayName: string
  
  // Technical features
  hasDRS: boolean              // Only Formula Ultimate (F1)
  hasPushToPass: boolean       // Stock Car Brasil, some open-wheel
  hasBoostButton: boolean      // Some touring/GT series
  hasClassRacing: boolean      // WEC, IMSA, multi-class events
  hasDriverChanges: boolean    // Endurance - driver swaps during race
  hasBalanceOfPerformance: boolean  // GT racing - BoP
  
  // Terminology
  terminology: SeriesTerminology
  
  // Commentary style
  broadcasterStyles: string[]  // Series-appropriate commentary styles
  energyLevel: 'high' | 'medium' | 'measured'  // Base energy for this series
  
  // Content rules
  avoidTerms: string[]         // Terms that shouldn't be used for this series
  preferredTerms: string[]     // Terms that fit this series well
  
  // Cultural context
  culturalContext: string      // Regional/series flavor and atmosphere
  keyNarratives: string[]      // Common storylines in this type of racing
}

// ============================================
// TERMINOLOGY SETS
// ============================================

const TOURING_TERMINOLOGY: SeriesTerminology = {
  overtake: ['passes', 'gets by', 'muscles past', 'gets alongside', 'makes a move', 'barges through', 'outbrakes'],
  battle: ['door-to-door', 'side-by-side', 'swapping paint', 'wheel-to-wheel', 'scrap', 'fight', 'tussle'],
  leader: ['leader', 'race leader', 'front-runner', 'the man out front', 'pace-setter'],
  gap: ['margin', 'gap', 'lead', 'interval', 'cushion', 'breathing room'],
  speed: ['pace', 'speed', 'momentum', 'flying', 'charging', 'on a charge'],
  driver: ['racer', 'driver', 'the man', 'competitor'],
  mistake: ['goes wide', 'locks up', 'runs deep', 'loses the rear', 'gets out of shape', 'moment'],
  weather: ['grip', 'conditions', 'slippery', 'treacherous'],
  pit: ['pits', 'pit lane', 'pit window', 'service'],
  start: ['lights out', 'green flag', 'rolling start', 'standing start'],
  finish: ['checkered flag', 'takes the win', 'crosses the line', 'victory']
}

const GT_TERMINOLOGY: SeriesTerminology = {
  overtake: ['passes', 'gets by', 'makes the move stick', 'completes the pass', 'finds a way through'],
  battle: ['close quarters', 'manufacturer battle', 'class battle', 'trading positions'],
  leader: ['race leader', 'overall leader', 'class leader', 'pro leader', 'am leader'],
  gap: ['margin', 'gap', 'interval', 'buffer'],
  speed: ['pace', 'straight-line speed', 'sector pace', 'consistency'],
  driver: ['driver', 'factory driver', 'bronze driver', 'gentleman driver', 'pro'],
  mistake: ['runs wide', 'exceeds track limits', 'gets out of shape', 'minor mistake'],
  weather: ['track evolution', 'grip levels', 'conditions'],
  pit: ['pit stop', 'driver change', 'pit window', 'pit delta', 'service'],
  start: ['lights out', 'race start', 'green flag'],
  finish: ['checkered flag', 'takes the class win', 'overall victory']
}

const FORMULA_TERMINOLOGY: SeriesTerminology = {
  overtake: ['passes', 'overtakes', 'makes the move', 'goes around the outside', 'dives inside'],
  battle: ['wheel-to-wheel', 'fighting for position', 'defending hard', 'under pressure'],
  leader: ['leader', 'race leader', 'championship leader'],
  gap: ['gap', 'margin', 'interval', 'delta'],
  speed: ['pace', 'lap time', 'sector time', 'flying'],
  driver: ['driver', 'young charger', 'rookie', 'veteran'],
  mistake: ['locks up', 'runs wide', 'loses the rear', 'spins'],
  weather: ['track temperature', 'conditions', 'grip'],
  pit: ['pits', 'pit stop', 'pit window'],
  start: ['lights out', 'standing start', 'formation lap complete'],
  finish: ['checkered flag', 'takes victory', 'crosses the line']
}

const ENDURANCE_TERMINOLOGY: SeriesTerminology = {
  overtake: ['gets by', 'passes', 'completes the move', 'makes position'],
  battle: ['class battle', 'category fight', 'prototype versus GT', 'traffic management'],
  leader: ['overall leader', 'class leader', 'outright leader'],
  gap: ['margin', 'gap to class', 'overall gap', 'laps behind'],
  speed: ['stint pace', 'fuel-adjusted pace', 'long-run speed', 'consistency'],
  driver: ['driver', 'current stint driver', 'third driver', 'night driver'],
  mistake: ['slight error', 'contact', 'time lost in traffic'],
  weather: ['changing conditions', 'day into night', 'temperature drop'],
  pit: ['driver change', 'pit stop', 'full service', 'splash and dash', 'double stint'],
  start: ['rolling start', 'race underway', 'endurance begins'],
  finish: ['checkered flag', 'completes the distance', 'takes overall honors', 'class victory']
}

const SPEC_TERMINOLOGY: SeriesTerminology = {
  overtake: ['gets by', 'makes the pass', 'finds a way through', 'outbrakes'],
  battle: ['close racing', 'identical machinery', 'driver skill on display'],
  leader: ['leader', 'race leader', 'series leader'],
  gap: ['margin', 'gap', 'lead'],
  speed: ['pace', 'speed', 'momentum'],
  driver: ['driver', 'racer', 'competitor', 'young talent'],
  mistake: ['runs wide', 'loses time', 'small error'],
  weather: ['grip', 'track conditions'],
  pit: ['pits', 'pit lane'],
  start: ['lights out', 'green flag'],
  finish: ['checkered flag', 'takes the win', 'first across the line']
}

// ============================================
// SERIES PROFILES
// ============================================

export const SERIES_PROFILES: Record<SeriesCategory, SeriesCommentaryProfile> = {
  'touring': {
    category: 'touring',
    displayName: 'Touring Car Racing',
    hasDRS: false,
    hasPushToPass: true,  // Stock Car Brasil has push-to-pass
    hasBoostButton: false,
    hasClassRacing: false,
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,
    terminology: TOURING_TERMINOLOGY,
    broadcasterStyles: [
      'Enthusiastic Brazilian commentator with national pride',
      'Excitable touring car specialist',
      'Passionate motorsport veteran',
      'Local radio-style energetic delivery'
    ],
    energyLevel: 'high',
    avoidTerms: [
      'DRS', 'DRS zone', 'DRS detection',
      'undercut', 'overcut',
      'formation lap',
      'team radio',
      'pit wall',
      'delta time',
      'degradation',
      'tyre cliff',
      'aero wash',
      'dirty air'
    ],
    preferredTerms: [
      'push-to-pass', 'button', 'boost remaining',
      'door-to-door', 'contact racing',
      'pack racing', 'slipstream battle',
      'national championship', 'home race'
    ],
    culturalContext: 'Pack racing with close battles, contact is part of the show. National pride and passionate fans. Push-to-pass strategy adds tactical element. Manufacturer rivalry is key.',
    keyNarratives: [
      'Championship battle between local heroes',
      'Manufacturer pride and factory backing',
      'Veteran experience versus young talent',
      'Home track advantage',
      'Push-to-pass strategy and timing'
    ]
  },

  'gt-sportscar': {
    category: 'gt-sportscar',
    displayName: 'GT & Sportscar Racing',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: true,
    hasDriverChanges: false,  // Sprint races typically don't
    hasBalanceOfPerformance: true,
    terminology: GT_TERMINOLOGY,
    broadcasterStyles: [
      'Knowledgeable GT racing expert',
      'Manufacturer-aware analyst',
      'Measured professional broadcaster',
      'Sportscar racing specialist'
    ],
    energyLevel: 'medium',
    avoidTerms: [
      'DRS', 'DRS zone',
      'formation lap',
      'grid penalty',
      'power unit',
      'MGU-K', 'MGU-H', 'ERS',
      'dirty air',
      'undercut'
    ],
    preferredTerms: [
      'Balance of Performance', 'BoP',
      'manufacturer battle',
      'Pro-Am', 'Silver Cup', 'Bronze',
      'factory driver', 'works team',
      'GT3 regulations', 'GT4 regulations',
      'class leader', 'overall leader'
    ],
    culturalContext: 'Manufacturer rivalry is everything. Balance of Performance keeps competition close. Mix of professional and gentleman drivers adds storylines. Factory backing versus privateer effort.',
    keyNarratives: [
      'Manufacturer championship battle',
      'Factory teams versus privateers',
      'Pro drivers supporting Am teammates',
      'Balance of Performance debates',
      'Gentleman driver improvement'
    ]
  },

  'formula': {
    category: 'formula',
    displayName: 'Formula Racing',
    hasDRS: false,  // Most formula series don't have DRS
    hasPushToPass: true,  // Some have overtake buttons
    hasBoostButton: false,
    hasClassRacing: false,
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,
    terminology: FORMULA_TERMINOLOGY,
    broadcasterStyles: [
      'Professional single-seater analyst',
      'Development series expert',
      'Young driver talent spotter',
      'Open-wheel racing specialist'
    ],
    energyLevel: 'medium',
    avoidTerms: [
      'DRS', 'DRS zone', 'DRS detection',  // Only F1 has DRS
      'power unit',
      'MGU-K', 'MGU-H', 'ERS',
      'Sprint Shootout',
      'pit wall',
      'team principal'
    ],
    preferredTerms: [
      'single-seater', 'open-wheel',
      'development series', 'ladder series',
      'future star', 'young talent',
      'racing line', 'slipstream'
    ],
    culturalContext: 'Development pathway for future stars. Pure racing with identical or similar machinery. Drivers proving themselves for higher categories. Team dynamics in junior formulas.',
    keyNarratives: [
      'Future stars learning their craft',
      'Stepping stone to higher categories',
      'Pure driver skill on display',
      'Academy drivers and their backing',
      'Regional versus international talent'
    ]
  },

  'formula-f1': {
    category: 'formula-f1',
    displayName: 'Formula 1 Style',
    hasDRS: true,  // Only this category has DRS
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: false,
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,
    terminology: {
      ...FORMULA_TERMINOLOGY,
      overtake: ['overtakes', 'passes', 'gets the move done', 'uses DRS to get by'],
    },
    broadcasterStyles: [
      'World feed style professional broadcaster',
      'Technical analyst with deep knowledge',
      'Excited lead commentator',
      'Measured expert summarizer'
    ],
    energyLevel: 'high',
    avoidTerms: [
      'push-to-pass',
      'amateur',
      'gentleman driver'
    ],
    preferredTerms: [
      'DRS', 'DRS zone', 'DRS detection',
      'pit wall', 'race engineer',
      'team radio', 'strategy call',
      'undercut', 'overcut',
      'tyre degradation', 'tyre cliff',
      'dirty air', 'aero wake'
    ],
    culturalContext: 'Pinnacle of motorsport. Global audience. Technical innovation at its finest. Team strategy battles alongside driver skill.',
    keyNarratives: [
      'Championship battle between rivals',
      'Team orders and controversy',
      'Strategy versus raw pace',
      'Technical development race',
      'DRS battles and defensive driving'
    ]
  },

  'endurance': {
    category: 'endurance',
    displayName: 'Endurance Racing',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: true,
    hasDriverChanges: true,
    hasBalanceOfPerformance: true,
    terminology: ENDURANCE_TERMINOLOGY,
    broadcasterStyles: [
      'Marathon racing storyteller',
      'Multi-class racing expert',
      'Patient endurance specialist',
      'Strategy-focused analyst'
    ],
    energyLevel: 'measured',
    avoidTerms: [
      'DRS',
      'sprint race',
      'reverse grid',
      'push-to-pass'
    ],
    preferredTerms: [
      'driver change', 'double stint', 'triple stint',
      'pit window', 'fuel strategy',
      'traffic', 'class battle',
      'prototype', 'hypercar', 'GT',
      'overall', 'class victory',
      'wear and tear', 'reliability'
    ],
    culturalContext: 'Racing is a marathon not a sprint. Strategy and reliability as important as speed. Multi-class traffic management. Driver crews working together. Night racing adds drama.',
    keyNarratives: [
      'Strategy playing out over hours',
      'Driver crew chemistry',
      'Prototype versus GT traffic',
      'Reliability drama',
      'Night-time battles and atmospherics'
    ]
  },

  'spec-series': {
    category: 'spec-series',
    displayName: 'Spec Series',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: false,  // Sometimes Pro-Am classes
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,  // All cars identical
    terminology: SPEC_TERMINOLOGY,
    broadcasterStyles: [
      'Brand enthusiast commentator',
      'Close racing specialist',
      'Talent-spotting analyst',
      'Accessible and relatable host'
    ],
    energyLevel: 'high',
    avoidTerms: [
      'DRS',
      'Balance of Performance',
      'factory team',
      'power advantage',
      'aero package'
    ],
    preferredTerms: [
      'identical machinery', 'same equipment',
      'pure driver skill', 'no excuses',
      'spec racing', 'one-make',
      'customer racing', 'arrive and drive'
    ],
    culturalContext: 'Ultimate test of driver skill in identical machinery. No excuses - the car is the same for everyone. Brand experience and customer racing. Stepping stone series for many.',
    keyNarratives: [
      'Pure driver skill comparison',
      'No equipment excuses',
      'Close competitive racing',
      'Brand experience and passion',
      'Talent emerging through the ranks'
    ]
  },

  'prototype': {
    category: 'prototype',
    displayName: 'Prototype Racing',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: true,
    hasDriverChanges: false,  // Sprint format
    hasBalanceOfPerformance: true,
    terminology: {
      ...GT_TERMINOLOGY,
      leader: ['prototype leader', 'overall leader', 'LMP2 leader'],
    },
    broadcasterStyles: [
      'Prototype racing expert',
      'Technical analyst',
      'Sportscar specialist'
    ],
    energyLevel: 'medium',
    avoidTerms: [
      'DRS',
      'touring car',
      'push-to-pass'
    ],
    preferredTerms: [
      'prototype', 'LMP2', 'P3', 'P4',
      'downforce', 'aero efficiency',
      'sprint format', 'closed cockpit'
    ],
    culturalContext: 'Pure speed machines. Development pathway for endurance racing. Technical excellence and aerodynamic efficiency.',
    keyNarratives: [
      'Speed and downforce spectacle',
      'Development for future Le Mans',
      'Technical innovation',
      'Pro-Am teamwork'
    ]
  },

  'historic': {
    category: 'historic',
    displayName: 'Historic Racing',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: true,
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,
    terminology: {
      ...GT_TERMINOLOGY,
      driver: ['driver', 'owner', 'gentleman racer', 'collector'],
      battle: ['respectful battle', 'careful racing', 'preserving the heritage'],
    },
    broadcasterStyles: [
      'Nostalgic motorsport historian',
      'Reverent classic car expert',
      'Measured vintage racing specialist'
    ],
    energyLevel: 'measured',
    avoidTerms: [
      'DRS',
      'push-to-pass',
      'modern technology',
      'hybrid',
      'data analysis'
    ],
    preferredTerms: [
      'classic', 'vintage', 'historic',
      'period correct', 'era-appropriate',
      'preservation', 'heritage',
      'Group C', 'Group A', 'Group B'
    ],
    culturalContext: 'Preserving motorsport heritage. Respecting irreplaceable machinery. Celebrating the golden eras. Owner-drivers and passionate collectors.',
    keyNarratives: [
      'Preserving racing history',
      'Irreplaceable machinery on track',
      'Golden era memories',
      'Passionate owner-drivers'
    ]
  },

  'entry-level': {
    category: 'entry-level',
    displayName: 'Entry Level Racing',
    hasDRS: false,
    hasPushToPass: false,
    hasBoostButton: false,
    hasClassRacing: false,
    hasDriverChanges: false,
    hasBalanceOfPerformance: false,
    terminology: SPEC_TERMINOLOGY,
    broadcasterStyles: [
      'Encouraging supportive commentator',
      'Grassroots racing enthusiast',
      'Accessible and welcoming host',
      'Local racing specialist'
    ],
    energyLevel: 'high',
    avoidTerms: [
      'DRS',
      'factory team',
      'works driver',
      'championship pressure',
      'big-money'
    ],
    preferredTerms: [
      'first season', 'learning curve',
      'grassroots', 'club racing',
      'budget racing', 'accessible',
      'fun', 'passion project'
    ],
    culturalContext: 'Where racing dreams begin. Learning racecraft. Affordable accessible racing. Fun and passion over big budgets. Community atmosphere.',
    keyNarratives: [
      'First steps in racing',
      'Learning racecraft',
      'Community and friendship',
      'Budget constraints and creativity',
      'Dreams of moving up'
    ]
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the commentary profile for a series category
 */
export function getSeriesProfile(category: SeriesCategory): SeriesCommentaryProfile {
  return SERIES_PROFILES[category] || SERIES_PROFILES['gt-sportscar']
}

/**
 * Check if a term should be avoided for a given series
 */
export function shouldAvoidTerm(category: SeriesCategory, term: string): boolean {
  const profile = getSeriesProfile(category)
  return profile.avoidTerms.some(avoided => 
    term.toLowerCase().includes(avoided.toLowerCase())
  )
}

/**
 * Get a random term from a terminology category
 */
export function getRandomTerm(category: SeriesCategory, termType: keyof SeriesTerminology): string {
  const profile = getSeriesProfile(category)
  const terms = profile.terminology[termType]
  return terms[Math.floor(Math.random() * terms.length)]
}

/**
 * Get a random broadcaster style for a series
 */
export function getRandomBroadcasterStyle(category: SeriesCategory): string {
  const profile = getSeriesProfile(category)
  return profile.broadcasterStyles[Math.floor(Math.random() * profile.broadcasterStyles.length)]
}

/**
 * Build avoid-terms prompt section for LLM
 */
export function buildAvoidTermsPrompt(category: SeriesCategory): string {
  const profile = getSeriesProfile(category)
  
  if (profile.avoidTerms.length === 0) return ''
  
  return `
CRITICAL - DO NOT USE THESE TERMS (wrong for this series type):
${profile.avoidTerms.map(t => `- "${t}"`).join('\n')}

${!profile.hasDRS ? 'This series does NOT have DRS - NEVER mention DRS, DRS zones, or DRS detection.' : ''}
${!profile.hasPushToPass ? 'This series does NOT have push-to-pass or boost buttons.' : ''}
`
}

/**
 * Build preferred-terms prompt section for LLM
 */
export function buildPreferredTermsPrompt(category: SeriesCategory): string {
  const profile = getSeriesProfile(category)
  
  return `
USE THESE TERMS WHEN APPROPRIATE (authentic for this series):
${profile.preferredTerms.map(t => `- "${t}"`).join('\n')}

SERIES CONTEXT:
${profile.culturalContext}

KEY STORYLINES TO REFERENCE:
${profile.keyNarratives.map(n => `- ${n}`).join('\n')}
`
}

// ============================================
// CHAMPIONSHIP TO CATEGORY MAPPING
// ============================================

/**
 * Default mapping of championship IDs to series categories
 */
export const CHAMPIONSHIP_CATEGORY_DEFAULTS: Record<string, SeriesCategory> = {
  // Touring
  'stock-car-brasil': 'touring',
  'supercars': 'touring',
  'sprint-race-brasil': 'touring',
  'copa-truck': 'touring',
  
  // GT
  'gt-world-challenge-europe': 'gt-sportscar',
  'gt3-sprint-series': 'gt-sportscar',
  'gt4-european-series': 'gt-sportscar',
  'gt5-challenge': 'gt-sportscar',
  'gt-america': 'gt-sportscar',
  
  // Spec - Porsche
  'carrera-cup-world': 'spec-series',
  'carrera-cup-brasil': 'spec-series',
  'porsche-supercup': 'spec-series',
  
  // Spec - Lamborghini
  'super-trofeo-europe': 'spec-series',
  'super-trofeo-world': 'spec-series',
  
  // Spec - Caterham
  'caterham-academy': 'spec-series',
  'caterham-superlight': 'spec-series',
  'caterham-supersport': 'spec-series',
  'caterham-620r': 'spec-series',
  
  // Spec - Ginetta
  'ginetta-g40-cup': 'spec-series',
  'ginetta-g55-supercup': 'spec-series',
  
  // Spec - MINI
  'mini-challenge': 'spec-series',
  
  // Formula
  'formula-3-championship': 'formula',
  'formula-inter': 'formula',
  'formula-reiza': 'formula',
  'formula-usa': 'formula',
  'formula-vee': 'formula',
  'formula-trainer': 'formula',
  'formula-ultimate': 'formula-f1',  // Only this one gets F1 treatment
  
  // Endurance / Prototype
  'wec': 'endurance',
  'imsa-gtp': 'endurance',
  'lmdh-sprint': 'prototype',
  'lmp2-proam': 'prototype',
  'prototype-3-challenge': 'prototype',
  'prototype-4-development': 'prototype',
  
  // Historic
  'group-c-legends': 'historic',
  'gt1-championship': 'historic',
  
  // Entry Level
  'copa-fusca': 'entry-level',
  'copa-uno': 'entry-level',
  'copa-classic-b': 'entry-level',
}

/**
 * Get the series category for a championship
 */
export function getChampionshipCategory(championshipId: string): SeriesCategory {
  return CHAMPIONSHIP_CATEGORY_DEFAULTS[championshipId] || 'gt-sportscar'
}


