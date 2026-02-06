/**
 * Real Driver Facts Database
 * 
 * Known facts about real drivers who appear in AMS2 content.
 * This data is used to ensure narrative generation preserves accurate
 * biographical information while embellishing with fictional career details.
 * 
 * Format: Driver name (as appears in game) -> Known facts
 */

import type { RealDriverInfo } from '../store/rivalStore'

// ============================================================================
// REAL DRIVER FACTS DATABASE
// ============================================================================

/**
 * Known facts for real-world drivers
 * Key: Driver name as it appears in-game (may be partial match)
 */
export const REAL_DRIVER_FACTS: Record<string, RealDriverInfo> = {
  // ============================================
  // STOCK CAR BRASIL - Current/Recent Drivers
  // ============================================
  
  // Former F1 drivers
  'Rubens Barrichello': {
    realNationality: 'Brazilian',
    knownFor: 'Former F1 driver with Ferrari and Brawn GP, 11 Grand Prix wins. Most race starts in F1 history at time of retirement.'
  },
  'Felipe Massa': {
    realNationality: 'Brazilian', 
    knownFor: 'Former F1 driver, 11 Grand Prix wins. Lost 2008 title by one point in dramatic final race at Brazil.'
  },
  'Tony Kanaan': {
    realNationality: 'Brazilian',
    knownFor: '2004 IndyCar champion, 2013 Indianapolis 500 winner. Multiple Indy 500 pole positions.'
  },
  'Nelsinho Piquet': {
    realNationality: 'Brazilian',
    knownFor: 'Former F1 driver, Formula E champion. Son of three-time F1 World Champion Nelson Piquet.'
  },
  'Ricardo Zonta': {
    realNationality: 'Brazilian',
    knownFor: 'Former F1 driver with BAR and Jordan. FIA GT Championship winner.'
  },
  
  // Stock Car Brasil Champions
  'Daniel Serra': {
    realNationality: 'Brazilian',
    knownFor: 'Multiple Stock Car Brasil champion. Son of Brazilian racing legend Chico Serra.'
  },
  'Cacá Bueno': {
    realNationality: 'Brazilian',
    knownFor: 'Five-time Stock Car Brasil champion. One of the most successful drivers in series history.'
  },
  'Ricardo Maurício': {
    realNationality: 'Brazilian',
    knownFor: 'Multiple Stock Car Brasil champion. Known for consistent performances across seasons.'
  },
  'Thiago Camilo': {
    realNationality: 'Brazilian',
    knownFor: 'Stock Car Brasil champion. Former F3 Sudamericana champion.'
  },
  'Gabriel Casagrande': {
    realNationality: 'Brazilian',
    knownFor: 'Young Stock Car Brasil race winner. Rising star in Brazilian motorsport.'
  },
  
  // ============================================
  // PORSCHE SUPERCUP / CARRERA CUP
  // ============================================
  
  'Larry ten Voorde': {
    realNationality: 'Dutch',
    knownFor: 'Multiple Porsche Supercup champion. Dominant force in Porsche one-make racing.'
  },
  'Laurin Heinrich': {
    realNationality: 'German',
    knownFor: 'Porsche Supercup champion. Young German talent in GT racing.'
  },
  'Dylan Pereira': {
    realNationality: 'Luxembourgish',
    knownFor: 'Porsche Supercup race winner. Represents Luxembourg in international motorsport.'
  },
  'Ayhancan Güven': {
    realNationality: 'Turkish',
    knownFor: 'Porsche Supercup front-runner. Leading Turkish racing talent.'
  },
  'Marvin Klein': {
    realNationality: 'French',
    knownFor: 'Porsche Supercup race winner and title contender. French GT racing talent.'
  },
  'Kay van Berlo': {
    realNationality: 'Dutch',
    knownFor: 'Porsche Supercup regular. Competitive Dutch driver in Porsche racing.'
  },
  
  // ============================================
  // GT3 / GT RACING
  // ============================================
  
  'Maro Engel': {
    realNationality: 'German',
    knownFor: 'Mercedes-AMG factory driver. Multiple DTM and GT race winner. Former F1 test driver.'
  },
  'Maximilian Götz': {
    realNationality: 'German',
    knownFor: '2021 DTM Champion with Mercedes-AMG. Factory GT driver.'
  },
  'Jules Gounon': {
    realNationality: 'French',
    knownFor: 'Bentley and Mercedes factory driver. GT World Challenge race winner.'
  },
  'Raffaele Marciello': {
    realNationality: 'Swiss-Italian',
    knownFor: 'Mercedes-AMG factory driver. Multiple GT championship winner. Former F1 test driver.'
  },
  'Michael Christensen': {
    realNationality: 'Danish',
    knownFor: 'Porsche factory driver. WEC and IMSA race winner. Le Mans class winner.'
  },
  'Kévin Estre': {
    realNationality: 'French',
    knownFor: 'Porsche factory driver. Le Mans class winner. WEC champion.'
  },
  'Laurens Vanthoor': {
    realNationality: 'Belgian',
    knownFor: 'Porsche factory driver. IMSA champion. Multiple GT race winner.'
  },
  'Earl Bamber': {
    realNationality: 'New Zealander',
    knownFor: 'Two-time Le Mans 24 Hours overall winner with Porsche. WEC champion.'
  },
  'Nick Tandy': {
    realNationality: 'British',
    knownFor: 'Le Mans 24 Hours overall winner. Porsche factory driver turned Corvette.'
  },
  
  // ============================================
  // WEC / IMSA - LMDh/HYPERCAR
  // ============================================
  
  'André Lotterer': {
    realNationality: 'German',
    knownFor: 'Three-time Le Mans 24 Hours winner. Former Super Formula champion. Porsche factory driver.'
  },
  'Brendon Hartley': {
    realNationality: 'New Zealander',
    knownFor: 'Two-time WEC champion with Toyota. Former F1 driver. Le Mans winner.'
  },
  'Kamui Kobayashi': {
    realNationality: 'Japanese',
    knownFor: 'Former F1 driver. Le Mans winner with Toyota. Known for spectacular overtakes.'
  },
  'Mike Conway': {
    realNationality: 'British',
    knownFor: 'Multiple Le Mans winner with Toyota. Former IndyCar driver.'
  },
  'Sébastien Buemi': {
    realNationality: 'Swiss',
    knownFor: 'Le Mans winner, WEC champion with Toyota. Former F1 driver. Formula E champion.'
  },
  'Dries Vanthoor': {
    realNationality: 'Belgian',
    knownFor: 'BMW M Motorsport LMDh driver. GT racing specialist. Brother of Laurens Vanthoor.'
  },
  'Sheldon van der Linde': {
    realNationality: 'South African',
    knownFor: 'BMW M Motorsport driver. DTM race winner. Youngest GT3 race winner.'
  },
  'Marco Wittmann': {
    realNationality: 'German',
    knownFor: 'Two-time DTM champion with BMW. Factory GT and LMDh driver.'
  },
  
  // ============================================
  // SUPERCARS CHAMPIONSHIP (Australia)
  // ============================================
  
  'Shane van Gisbergen': {
    realNationality: 'New Zealander',
    knownFor: 'Three-time Supercars champion. Won NASCAR Cup debut race. Known for aggressive driving.'
  },
  'Scott McLaughlin': {
    realNationality: 'New Zealander',
    knownFor: 'Three-time Supercars champion. Now full-time IndyCar driver with Team Penske.'
  },
  'Jamie Whincup': {
    realNationality: 'Australian',
    knownFor: 'Seven-time Supercars champion. Most successful driver in Supercars history. Now team principal.'
  },
  'Chaz Mostert': {
    realNationality: 'Australian',
    knownFor: 'Bathurst 1000 winner. Supercars race winner. Known for car control.'
  },
  'Will Davison': {
    realNationality: 'Australian',
    knownFor: 'Multiple Bathurst 1000 winner. Long-time Supercars front-runner.'
  },
  'Anton De Pasquale': {
    realNationality: 'Australian',
    knownFor: 'Dick Johnson Racing driver. Young Supercars talent. Multiple race winner.'
  },
  'Cameron Waters': {
    realNationality: 'Australian',
    knownFor: 'Supercars race winner. Tickford Racing driver. Rising star of Supercars.'
  },
  
  // ============================================
  // DTM / TOURING CARS
  // ============================================
  
  'Timo Glock': {
    realNationality: 'German',
    knownFor: 'Former F1 driver. Almost won 2008 Brazilian GP. DTM driver.'
  },
  'Lucas Auer': {
    realNationality: 'Austrian',
    knownFor: 'DTM race winner. Mercedes junior. Nephew of F1 legend Gerhard Berger.'
  },
  'Philipp Eng': {
    realNationality: 'Austrian',
    knownFor: 'BMW DTM driver. GT and DTM race winner. Known for consistency.'
  },
  
  // ============================================
  // FORMULA RACING
  // ============================================
  
  'Enzo Fittipaldi': {
    realNationality: 'Brazilian',
    knownFor: 'IndyCar driver. Grandson of two-time F1 champion Emerson Fittipaldi.'
  },
  'Pietro Fittipaldi': {
    realNationality: 'Brazilian',
    knownFor: 'IndyCar driver. Former F1 reserve driver for Haas. Grandson of Emerson Fittipaldi.'
  },
  
  // ============================================
  // HISTORIC / LEGENDS
  // ============================================
  
  'Emerson Fittipaldi': {
    realNationality: 'Brazilian',
    knownFor: 'Two-time F1 World Champion (1972, 1974). Two-time Indianapolis 500 winner. Racing legend.'
  },
  'Nelson Piquet': {
    realNationality: 'Brazilian',
    knownFor: 'Three-time F1 World Champion (1981, 1983, 1987). One of Brazil\'s greatest drivers.'
  },
  'Ayrton Senna': {
    realNationality: 'Brazilian',
    knownFor: 'Three-time F1 World Champion. Considered one of the greatest F1 drivers ever. Iconic rivalry with Prost.'
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get real driver info by name (supports partial matching)
 */
export function getRealDriverInfo(driverName: string): RealDriverInfo | undefined {
  // Exact match first
  if (REAL_DRIVER_FACTS[driverName]) {
    return REAL_DRIVER_FACTS[driverName]
  }
  
  // Try partial match (last name)
  const nameParts = driverName.split(' ')
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1]
    for (const [key, info] of Object.entries(REAL_DRIVER_FACTS)) {
      if (key.endsWith(lastName)) {
        return info
      }
    }
  }
  
  return undefined
}

/**
 * Check if a driver is a known real driver
 */
export function isRealDriver(driverName: string): boolean {
  return getRealDriverInfo(driverName) !== undefined
}

/**
 * Get all real driver names
 */
export function getAllRealDriverNames(): string[] {
  return Object.keys(REAL_DRIVER_FACTS)
}

/**
 * Get real drivers by nationality
 */
export function getRealDriversByNationality(nationality: string): string[] {
  return Object.entries(REAL_DRIVER_FACTS)
    .filter(([_, info]) => info.realNationality?.toLowerCase().includes(nationality.toLowerCase()))
    .map(([name, _]) => name)
}

/**
 * Get real driver facts as a map for batch narrative generation
 */
export function getRealDriverFactsMap(driverNames: string[]): Record<string, RealDriverInfo> {
  const result: Record<string, RealDriverInfo> = {}
  
  for (const name of driverNames) {
    const info = getRealDriverInfo(name)
    if (info) {
      result[name] = info
    }
  }
  
  return result
}

