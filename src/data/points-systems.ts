/**
 * Points Systems for AMS2 Career Mode
 * 
 * Each championship has its own authentic point system.
 * Simplified to single-race format for easier AMS2 integration.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PointsSystem {
  id: string
  name: string
  points: Record<number, number>  // Position -> Points
  fastestLap?: number             // Bonus points for fastest lap
  polePosition?: number           // Bonus points for pole position
}

// ============================================
// POINTS SYSTEMS
// ============================================

export const POINTS_SYSTEMS: Record<string, PointsSystem> = {
  // Stock Car Brasil style - Higher points spread
  'stock-car-brasil': {
    id: 'stock-car-brasil',
    name: 'Stock Car Brasil',
    points: { 
      1: 30, 2: 24, 3: 20, 4: 18, 5: 16, 
      6: 14, 7: 12, 8: 10, 9: 8, 10: 6, 
      11: 5, 12: 4, 13: 3, 14: 2, 15: 1 
    },
    fastestLap: 1,
    polePosition: 1
  },

  // GT World Challenge / SRO style
  'gt-sprint': {
    id: 'gt-sprint',
    name: 'GT Sprint Series',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
    fastestLap: 1
  },

  // Formula style
  'formula': {
    id: 'formula',
    name: 'Formula Series',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
    fastestLap: 1,
    polePosition: 2
  },

  // Porsche Carrera Cup style
  'carrera-cup': {
    id: 'carrera-cup',
    name: 'Carrera Cup',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
    fastestLap: 1,
    polePosition: 1
  },

  // Lamborghini Super Trofeo style
  'super-trofeo': {
    id: 'super-trofeo',
    name: 'Super Trofeo',
    points: { 
      1: 20, 2: 15, 3: 12, 4: 10, 5: 8, 
      6: 6, 7: 4, 8: 3, 9: 2, 10: 1 
    },
    fastestLap: 1
  },

  // Endurance racing (WEC, IMSA) - Single long race
  'endurance': {
    id: 'endurance',
    name: 'Endurance',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
  },

  // Entry-level / Club racing - Lower points spread
  'entry-level': {
    id: 'entry-level',
    name: 'Entry Level',
    points: { 
      1: 20, 2: 15, 3: 12, 4: 10, 5: 8, 
      6: 6, 7: 5, 8: 4, 9: 3, 10: 2,
      11: 1
    },
  },

  // Caterham style - Tighter points spread
  'caterham': {
    id: 'caterham',
    name: 'Caterham Championship',
    points: { 
      1: 20, 2: 17, 3: 15, 4: 13, 5: 11, 
      6: 9, 7: 7, 8: 5, 9: 3, 10: 2, 
      11: 1 
    },
  },

  // Ginetta style - High points spread
  'ginetta': {
    id: 'ginetta',
    name: 'Ginetta Championship',
    points: { 
      1: 34, 2: 30, 3: 27, 4: 24, 5: 21, 
      6: 19, 7: 17, 8: 15, 9: 13, 10: 11,
      11: 9, 12: 7, 13: 5, 14: 3, 15: 2, 16: 1
    },
  },

  // Australian Supercars style - Very high points
  'supercars': {
    id: 'supercars',
    name: 'Supercars',
    points: { 
      1: 150, 2: 138, 3: 129, 4: 120, 5: 111, 
      6: 102, 7: 93, 8: 84, 9: 75, 10: 66,
      11: 57, 12: 48, 13: 39, 14: 30, 15: 21,
      16: 18, 17: 15, 18: 12, 19: 9, 20: 6,
      21: 3, 22: 2, 23: 1
    },
  },

  // Copa Truck Brasil
  'copa-truck': {
    id: 'copa-truck',
    name: 'Copa Truck',
    points: { 
      1: 25, 2: 20, 3: 16, 4: 14, 5: 12, 
      6: 10, 7: 8, 8: 6, 9: 4, 10: 2, 
      11: 1 
    },
  },

  // Standard F1-style (fallback)
  'standard': {
    id: 'standard',
    name: 'Standard',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
    fastestLap: 1
  },

  // Historic racing - lower stakes
  'historic': {
    id: 'historic',
    name: 'Historic',
    points: { 
      1: 20, 2: 15, 3: 12, 4: 10, 5: 8, 
      6: 6, 7: 4, 8: 3, 9: 2, 10: 1 
    },
  },

  // Prototype series (LMP2, P3, P4)
  'prototype': {
    id: 'prototype',
    name: 'Prototype',
    points: { 
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1 
    },
    fastestLap: 1
  },

  // MINI Challenge style
  'mini-challenge': {
    id: 'mini-challenge',
    name: 'MINI Challenge',
    points: { 
      1: 50, 2: 46, 3: 43, 4: 40, 5: 37, 
      6: 34, 7: 31, 8: 28, 9: 25, 10: 22,
      11: 19, 12: 16, 13: 13, 14: 10, 15: 7
    },
  },

  // Karting - Tight points spread, many positions
  'karting': {
    id: 'karting',
    name: 'Karting',
    points: { 
      1: 25, 2: 22, 3: 20, 4: 18, 5: 16, 
      6: 14, 7: 12, 8: 10, 9: 8, 10: 6,
      11: 5, 12: 4, 13: 3, 14: 2, 15: 1
    },
  },

  // Stock USA (NASCAR-style) - Higher total points
  'stock-usa': {
    id: 'stock-usa',
    name: 'Stock USA',
    points: { 
      1: 40, 2: 35, 3: 34, 4: 33, 5: 32, 
      6: 31, 7: 30, 8: 29, 9: 28, 10: 27,
      11: 26, 12: 25, 13: 24, 14: 23, 15: 22,
      16: 21, 17: 20, 18: 19, 19: 18, 20: 17,
      21: 16, 22: 15, 23: 14, 24: 13, 25: 12,
      26: 11, 27: 10, 28: 9, 29: 8, 30: 7,
      31: 6, 32: 5, 33: 4, 34: 3, 35: 2, 36: 1
    },
  },

  // Rallycross - Mixed surface, heat-based
  'rallycross': {
    id: 'rallycross',
    name: 'Rallycross',
    points: { 
      1: 28, 2: 22, 3: 18, 4: 15, 5: 12, 
      6: 10, 7: 8, 8: 6, 9: 4, 10: 2,
      11: 1
    },
    fastestLap: 2
  },

  // Club racing - Low-key, everyone gets something
  'club': {
    id: 'club',
    name: 'Club Racing',
    points: { 
      1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 
      6: 5, 7: 4, 8: 3, 9: 2, 10: 1
    },
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a points system by ID, with fallback to standard
 */
export function getPointsSystem(id: string): PointsSystem {
  return POINTS_SYSTEMS[id] || POINTS_SYSTEMS['standard']
}

/**
 * Get points for a specific position
 */
export function getPointsForPosition(system: PointsSystem, position: number): number {
  return system.points[position] || 0
}

/**
 * Get total possible points for a race (for standings calculations)
 */
export function getMaxPointsForRace(system: PointsSystem): number {
  if (!system?.points?.[1]) return 25 // Default to F1-style if missing
  return system.points[1] + (system.fastestLap || 0) + (system.polePosition || 0)
}

// ============================================
// CHAMPIONSHIP TO POINTS SYSTEM MAPPING
// ============================================

/**
 * Default mapping of championship types to points systems
 * Used when migrating existing careers
 */
export const CHAMPIONSHIP_POINTS_DEFAULTS: Record<string, string> = {
  // National Touring
  'stock-car-brasil': 'stock-car-brasil',
  'supercars-championship': 'supercars',
  'sprint-race-brasil': 'stock-car-brasil',
  'copa-truck': 'copa-truck',
  'super-v8': 'supercars',
  
  // GT Series
  'gt-world-challenge-europe': 'gt-sprint',
  'gt3-sprint-series': 'gt-sprint',
  'gt4-european-series': 'gt-sprint',
  'gt5-challenge': 'entry-level',
  'gt-america': 'gt-sprint',
  
  // Spec - Porsche
  'carrera-cup-world': 'carrera-cup',
  'carrera-cup-brasil': 'carrera-cup',
  'porsche-supercup': 'carrera-cup',
  
  // Spec - Lamborghini
  'super-trofeo-europe': 'super-trofeo',
  'super-trofeo-world': 'super-trofeo',
  
  // Spec - Caterham
  'caterham-academy': 'caterham',
  'caterham-superlight': 'caterham',
  'caterham-supersport': 'caterham',
  'caterham-620r': 'caterham',
  
  // Spec - Ginetta
  'ginetta-g40-cup': 'ginetta',
  'ginetta-g55-supercup': 'ginetta',
  
  // Spec - MINI
  'mini-challenge': 'mini-challenge',
  
  // Formula
  'formula-3': 'formula',
  'formula-inter': 'formula',
  'formula-reiza': 'formula',
  'formula-usa': 'formula',
  'formula-ultimate': 'standard',
  'formula-vee': 'entry-level',
  'formula-trainer': 'entry-level',
  
  // Endurance / Prototype
  'wec': 'endurance',
  'imsa-gtp': 'endurance',
  'lmdh-sprint': 'prototype',
  'lmp2-proam': 'prototype',
  'prototype-3-challenge': 'prototype',
  'prototype-4-development': 'entry-level',
  
  // Historic
  'group-c-revival': 'historic',
  'gt1-championship': 'historic',
  'hypercar-trackday': 'historic',
  'gte-legends': 'historic',
  'dpi-invitational': 'historic',
  'group-a-historic': 'historic',
  'formula-classic-86': 'historic',
  'formula-classic-88': 'historic',
  'formula-classic-90': 'historic',
  'formula-vintage': 'historic',
  'tc-legends-brasil': 'historic',
  'opala-historic': 'historic',
  'copa-classic-brasil': 'historic',
  'copa-classic-fusca-liga': 'historic',
  
  // Entry Level
  'copa-fusca': 'entry-level',
  'copa-uno': 'entry-level',
  'aussie-racing-cars': 'entry-level',
  
  // Karting
  'rental-kart-cup-brasil': 'karting',
  'karting-4t-championship': 'karting',
  'cik-fia-karting': 'karting',
  'shifter-kart-world-series': 'karting',
  'superkart-championship': 'karting',
  'kartcross-brasil': 'karting',
  'weekend-kart-league': 'club',
  'junior-kart-academy': 'club',
  
  // Regional GT
  'gt-world-challenge-asia': 'gt-sprint',
  'gt3-asia-sprint': 'gt-sprint',
  'gt4-asia-cup': 'gt-sprint',
  'intercontinental-gt-challenge': 'endurance',
  'gt3-americas-sprint': 'gt-sprint',
  'gt5-americas-challenge': 'entry-level',
  'british-gt-club': 'club',
  'japanese-gt-weekend': 'club',
  'nordic-gt-trophy': 'club',
  'brazilian-gt-sprint': 'club',
  
  // Stock USA
  'stock-usa-cup': 'stock-usa',
  'stock-usa-xfinity': 'stock-usa',
  'oval-thunder-cup': 'stock-usa',
  'short-track-challenge': 'club',
  'old-stock-race-championship': 'entry-level',
  'daytona-500': 'stock-usa',
  
  // Multi-class endurance
  'european-le-mans': 'endurance',
  'asian-le-mans': 'endurance',
  'brazilian-endurance': 'endurance',
  'prototype-gt-challenge': 'endurance',
  'endurance-rookie-cup': 'club',
  'motorsport-games-gt': 'club',
  
  // One-off endurance specials
  '24h-le-mans': 'endurance',
  'daytona-24h': 'endurance',
  'spa-24h': 'endurance',
  'nurburgring-24h': 'endurance',
  'bathurst-12h': 'endurance',
  'suzuka-10h': 'endurance',
  'sao-paulo-6h': 'endurance',
  'kyalami-9h': 'endurance',
  
  // One-off sprint specials
  'indianapolis-500': 'formula',
  'bathurst-1000': 'supercars',
  'macau-grand-prix': 'formula',
  'nascar-le-mans': 'stock-usa',
  'night-racing-challenge': 'gt-sprint',
  
  // Club/mini series
  'track-day-championship': 'club',
  'gentleman-driver-cup': 'club',
  'weekend-warrior-caterham': 'club',
  'rookie-formula-cup': 'club',
  'fun-racing-mini': 'club',
  'brazilian-club-racing': 'club',
  'interlagos-sprint-festival': 'club',
  'phillip-island-gt-sprint': 'club',
  'brands-hatch-club': 'club',
  'sepang-gt-weekend': 'club',
  'sonoma-sprint-cup': 'club',
  'adelaide-street-festival': 'club',
  
  // Prototype expansion
  'p2-sprint-brasil': 'prototype',
  'p1-brazilian-championship': 'prototype',
  'p1-gen2-sprint': 'prototype',
  'ligier-european-championship': 'prototype',
  'lmp2-gen2-proam': 'prototype',
  
  // Regional spec
  'carrera-cup-asia': 'carrera-cup',
  'carrera-cup-north-america': 'carrera-cup',
  'super-trofeo-north-america': 'super-trofeo',
  'super-trofeo-asia': 'super-trofeo',
  'formula-trainer-advanced-series': 'entry-level',
  'lancer-cup-asia': 'entry-level',
  
  // Rallycross
  'world-rallycross': 'rallycross',
  'americas-rallycross': 'rallycross',
  'trophy-truck-series': 'rallycross',
  'kartcross-weekend-cup': 'club',
  
  // Touring/road
  'tsi-cup-brasil': 'entry-level',
  'lancer-cup-brasil': 'entry-level',
  'street-car-track-day': 'club',
  'brazilian-touring-festival': 'club',
  'asia-touring-cup': 'entry-level',
  
  // Historic multi-round
  'formula-retro-v10-masters': 'historic',
  'gt-classic-trophy': 'historic',
  'fia-gt-2005-revival': 'historic',
  'le-mans-2005-revival': 'historic',
  'm1-procar-series': 'historic',
  'hot-cars-brasil-series': 'historic',
  'vintage-touring-t1-trophy': 'historic',
  'vintage-touring-t2-festival': 'historic',
  'stock-car-brasil-retro': 'historic',
  'gtr-revival-series': 'historic',
  
  // Creative events
  'porsche-motorsport-festival': 'club',
  'bmw-racing-festival': 'club',
  'all-star-race-of-champions': 'gt-sprint',
  'oval-thunder-night': 'stock-usa',
  'formula-festival': 'club',
}

/**
 * Get default points system for a championship
 */
export function getChampionshipPointsDefault(championshipId: string): string {
  return CHAMPIONSHIP_POINTS_DEFAULTS[championshipId] || 'standard'
}
