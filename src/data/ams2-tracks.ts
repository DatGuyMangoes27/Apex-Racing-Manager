// AMS2 Track Database - Built from authoritative layout reference
// All layouts come from ams2-layout-reference.ts (the single source of truth)

import { AMS2_LAYOUT_REFERENCE, type AMS2LayoutReferenceRecord } from './ams2-layout-reference'

export type TrackType = 'permanent' | 'street' | 'oval' | 'kart' | 'rallycross' | 'hillclimb'
export type TrackRegion = 'brazil' | 'europe' | 'asia' | 'oceania' | 'north_america' | 'south_america' | 'africa'

export interface TrackLayout {
  id: string
  name: string
  lengthKm: number
  turns: number
  year: number | string
  grade?: string
  sourceLayoutName?: string
  defaultDate?: string
  altitudeM?: number
  sourceVerified?: boolean
}

export interface AMS2Track {
  id: string
  name: string
  shortName: string
  officialName: string
  country: string
  countryCode: string
  region: TrackRegion
  type: TrackType
  layoutCount: number
  layouts: TrackLayout[]
  defaultLayout: string
  suitableTiers: number[]
  dlc?: string
  youtubeId?: string
}

// ============================================
// VENUE METADATA (game-specific data not in the reference)
// ============================================

interface VenueMeta {
  id: string
  name: string
  shortName: string
  officialName: string
  country: string
  countryCode: string
  region: TrackRegion
  type: TrackType
  suitableTiers: number[]
  defaultLayoutId?: string
  layoutPrefixes?: string[]
  dlc?: string
  youtubeId?: string
}

const VENUE_META: Record<string, VenueMeta> = {
  // AUSTRALIA
  'Adelaide': {
    id: 'adelaide', name: 'Adelaide', shortName: 'Adelaide', officialName: 'Adelaide Street Circuit',
    country: 'Australia', countryCode: 'AU', region: 'oceania', type: 'street', suitableTiers: [3, 4, 5, 6],
  },
  'Bathurst': {
    id: 'bathurst', name: 'Bathurst', shortName: 'Bathurst', officialName: 'Mount Panorama Circuit',
    country: 'Australia', countryCode: 'AU', region: 'oceania', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },

  // BRAZIL
  'Ascurra': {
    id: 'ascurra', name: 'Ascurra', shortName: 'Ascurra', officialName: 'Autódromo Max Mohr',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'rallycross', suitableTiers: [1, 2, 3],
    defaultLayoutId: 'rx',
  },
  'Brasilia': {
    id: 'brasilia', name: 'Brasília', shortName: 'Brasília', officialName: 'Autódromo Brasília BRB',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [2, 3, 4, 5],
  },
  'Campo Grande': {
    id: 'campo_grande', name: 'Campo Grande', shortName: 'Campo Grande', officialName: 'Autódromo Internacional Orlando Moura',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Cascavel': {
    id: 'cascavel', name: 'Cascavel', shortName: 'Cascavel', officialName: 'Autódromo Internacional Zilmar Beux de Cascavel',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Curitiba': {
    id: 'curitiba', name: 'Curitiba', shortName: 'Curitiba', officialName: 'Autódromo Internacional de Curitiba',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Curvelo': {
    id: 'curvelo', name: 'Curvelo', shortName: 'Curvelo', officialName: 'Circuito dos Cristais',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3],
  },
  'Foz': {
    id: 'foz', name: 'Foz do Iguaçu', shortName: 'Foz', officialName: 'X Games Foz do Iguaçu Rallycross',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'rallycross', suitableTiers: [1, 2, 3],
  },
  'Galeao Airport': {
    id: 'galeao', name: 'Galeão Airport', shortName: 'Galeão', officialName: 'Cacá Bueno Circuit',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'street', suitableTiers: [2, 3, 4],
    layoutPrefixes: ['Galeao Airport'],
  },
  'Goiânia': {
    id: 'goiania', name: 'Goiânia', shortName: 'Goiânia', officialName: 'Autódromo Internacional Ayrton Senna (Goiânia)',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4, 5],
  },
  'Granja Viana': {
    id: 'granja_viana', name: 'Granja Viana', shortName: 'Granja Viana', officialName: 'Kartódromo Internacional da Granja Viana',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'kart', suitableTiers: [1],
  },
  'Guaporé': {
    id: 'guapore', name: 'Guaporé', shortName: 'Guaporé', officialName: 'Autódromo Internacional de Guaporé',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3],
  },
  'Interlagos': {
    id: 'interlagos', name: 'Interlagos', shortName: 'Interlagos', officialName: 'Autódromo José Carlos Pace',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4, 5, 6],
    defaultLayoutId: 'gp', youtubeId: '8y1G9e8q7k8',
  },
  'Jacarepaguá': {
    id: 'jacarepagua', name: 'Jacarepaguá', shortName: 'Jacarepaguá', officialName: 'Autódromo Internacional Nelson Piquet',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [2, 3, 4, 5, 6],
  },
  'Londrina': {
    id: 'londrina', name: 'Londrina', shortName: 'Londrina', officialName: 'Autódromo Internacional Ayrton Senna (Londrina)',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Salvador': {
    id: 'salvador', name: 'Salvador', shortName: 'Salvador', officialName: 'Circuito Ayrton Senna',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'street', suitableTiers: [3, 4, 5],
  },
  'Santa Cruz do Sul': {
    id: 'santa_cruz', name: 'Santa Cruz do Sul', shortName: 'Santa Cruz', officialName: 'Autódromo Internacional de Santa Cruz do Sul',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Speedland': {
    id: 'speedland', name: 'Speedland', shortName: 'Speedland', officialName: 'Speedland Kart Center',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'kart', suitableTiers: [1],
  },
  'Tarumã': {
    id: 'taruma', name: 'Tarumã', shortName: 'Tarumã', officialName: 'Autódromo Internacional de Tarumã',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
    defaultLayoutId: 'international',
  },
  'Velo Cittá': {
    id: 'velo_citta', name: 'Velo Città', shortName: 'Velo Città', officialName: 'Autódromo Velo Città',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Velopark': {
    id: 'velopark', name: 'Velopark', shortName: 'Velopark', officialName: 'Velopark',
    country: 'Brazil', countryCode: 'BR', region: 'brazil', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },

  // ARGENTINA
  'Buenos Aires': {
    id: 'buenos_aires', name: 'Buenos Aires', shortName: 'Buenos Aires', officialName: 'Autódromo Oscar y Juan Gálvez',
    country: 'Argentina', countryCode: 'AR', region: 'south_america', type: 'permanent', suitableTiers: [2, 3, 4, 5, 6],
  },
  'Córdoba': {
    id: 'cordoba', name: 'Córdoba', shortName: 'Córdoba', officialName: 'Autódromo Oscar Cabalén',
    country: 'Argentina', countryCode: 'AR', region: 'south_america', type: 'permanent', suitableTiers: [2, 3, 4, 5],
  },
  'Termas de Río Hondo': {
    id: 'termas', name: 'Termas de Río Hondo', shortName: 'Termas', officialName: 'Autódromo Termas de Río Hondo',
    country: 'Argentina', countryCode: 'AR', region: 'south_america', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },

  // EUROPE - UK
  'Brands Hatch': {
    id: 'brands_hatch', name: 'Brands Hatch', shortName: 'Brands Hatch', officialName: 'Brands Hatch',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [1, 2, 3, 4, 5],
  },
  'Cadwell Park': {
    id: 'cadwell_park', name: 'Cadwell Park', shortName: 'Cadwell', officialName: 'Cadwell Park',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [1, 2, 3],
  },
  'Donington Park': {
    id: 'donington', name: 'Donington Park', shortName: 'Donington', officialName: 'Donington Park',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5],
    layoutPrefixes: ['Donington'],
  },
  'Oulton Park': {
    id: 'oulton_park', name: 'Oulton Park', shortName: 'Oulton Park', officialName: 'Oulton Park',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },
  'Silverstone': {
    id: 'silverstone', name: 'Silverstone', shortName: 'Silverstone', officialName: 'Silverstone Circuit',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5, 6],
  },
  'Snetterton': {
    id: 'snetterton', name: 'Snetterton', shortName: 'Snetterton', officialName: 'Snetterton Circuit',
    country: 'United Kingdom', countryCode: 'GB', region: 'europe', type: 'permanent', suitableTiers: [1, 2, 3, 4],
  },

  // EUROPE - GERMANY
  'Hockenheimring': {
    id: 'hockenheim', name: 'Hockenheim', shortName: 'Hockenheim', officialName: 'Hockenheimring Baden-Württemberg',
    country: 'Germany', countryCode: 'DE', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5, 6],
    layoutPrefixes: ['Hockenheim'],
  },
  'Nürburgring': {
    id: 'nurburgring', name: 'Nürburgring', shortName: 'Nürburgring', officialName: 'Nürburgring',
    country: 'Germany', countryCode: 'DE', region: 'europe', type: 'permanent', suitableTiers: [3, 4, 5, 6],
    layoutPrefixes: ['Nürburgring', 'Nurburgring', 'Nordschleife'],
    defaultLayoutId: 'gp_2020',
  },

  // EUROPE - ITALY
  'Imola': {
    id: 'imola', name: 'Imola', shortName: 'Imola', officialName: 'Autodromo Internazionale Enzo e Dino Ferrari',
    country: 'Italy', countryCode: 'IT', region: 'europe', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },
  'Monza': {
    id: 'monza', name: 'Monza', shortName: 'Monza', officialName: 'Autodromo Nazionale Monza',
    country: 'Italy', countryCode: 'IT', region: 'europe', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },
  'Ortona': {
    id: 'ortona', name: 'Ortona', shortName: 'Ortona', officialName: "Circuito Internazionale d'Abruzzo",
    country: 'Italy', countryCode: 'IT', region: 'europe', type: 'kart', suitableTiers: [1, 2, 3, 4],
  },

  // EUROPE - BELGIUM
  'Spa-Francorchamps': {
    id: 'spa', name: 'Spa-Francorchamps', shortName: 'Spa', officialName: 'Circuit de Spa-Francorchamps',
    country: 'Belgium', countryCode: 'BE', region: 'europe', type: 'permanent', suitableTiers: [3, 4, 5, 6],
    defaultLayoutId: '2020',
  },

  // EUROPE - SPAIN
  'Barcelona': {
    id: 'barcelona', name: 'Barcelona', shortName: 'Barcelona', officialName: 'Circuit de Barcelona-Catalunya',
    country: 'Spain', countryCode: 'ES', region: 'europe', type: 'permanent', suitableTiers: [3, 4, 5, 6],
    layoutPrefixes: ['Circuit de Barcelona-Catalunya', 'Barcelona-Catalunya'],
  },
  'Jerez': {
    id: 'jerez', name: 'Jerez', shortName: 'Jerez', officialName: 'Circuito de Jerez – Ángel Nieto',
    country: 'Spain', countryCode: 'ES', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5],
  },

  // EUROPE - AUSTRIA
  'Spielberg (Red Bull Ring)': {
    id: 'spielberg', name: 'Spielberg', shortName: 'Spielberg', officialName: 'Red Bull Ring',
    country: 'Austria', countryCode: 'AT', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5, 6],
    layoutPrefixes: ['Spielberg', 'Red Bull Ring'],
  },

  // EUROPE - PORTUGAL
  'Cascais (Estoril)': {
    id: 'estoril', name: 'Estoril', shortName: 'Estoril', officialName: 'Circuito do Estoril',
    country: 'Portugal', countryCode: 'PT', region: 'europe', type: 'permanent', suitableTiers: [2, 3, 4, 5],
    layoutPrefixes: ['Cascais', 'Estoril'],
  },

  // EUROPE - FRANCE
  'La Sarthe': {
    id: 'le_mans', name: 'Le Mans', shortName: 'Le Mans', officialName: 'Circuit des 24 Heures du Mans',
    country: 'France', countryCode: 'FR', region: 'europe', type: 'permanent', suitableTiers: [4, 5, 6],
    layoutPrefixes: ['Le Mans'],
  },

  // EUROPE - MONACO
  'Azure Circuit (Monaco)': {
    id: 'monaco', name: 'Monaco', shortName: 'Monaco', officialName: 'Circuit de Monaco',
    country: 'Monaco', countryCode: 'MC', region: 'europe', type: 'street', suitableTiers: [5, 6],
    layoutPrefixes: ['Azure Circuit'],
  },

  // EUROPE - FINLAND
  'Tykki': {
    id: 'tykki', name: 'Tykki', shortName: 'Tykki', officialName: 'Kouvola Circuit',
    country: 'Finland', countryCode: 'FI', region: 'europe', type: 'rallycross', suitableTiers: [1, 2, 3],
  },

  // EUROPE - NORWAY
  'Buskerud': {
    id: 'buskerud', name: 'Buskerud', shortName: 'Buskerud', officialName: 'Buskerud',
    country: 'Norway', countryCode: 'NO', region: 'europe', type: 'rallycross', suitableTiers: [1, 2, 3],
  },

  // ASIA - JAPAN
  'Kansai (Suzuka)': {
    id: 'suzuka', name: 'Suzuka', shortName: 'Suzuka', officialName: 'Suzuka International Racing Course',
    country: 'Japan', countryCode: 'JP', region: 'asia', type: 'permanent', suitableTiers: [3, 4, 5, 6],
    layoutPrefixes: ['Kansai', 'Suzuka'],
    defaultLayoutId: 'gp',
  },

  // AFRICA
  'Kyalami': {
    id: 'kyalami', name: 'Kyalami', shortName: 'Kyalami', officialName: 'Kyalami Grand Prix Circuit',
    country: 'South Africa', countryCode: 'ZA', region: 'africa', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },

  // NORTH AMERICA - USA
  'Cleveland': {
    id: 'cleveland', name: 'Cleveland', shortName: 'Cleveland', officialName: 'Burke Lakefront Airport',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'street', suitableTiers: [4, 5, 6],
  },
  'Daytona': {
    id: 'daytona', name: 'Daytona', shortName: 'Daytona', officialName: 'Daytona International Speedway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'oval', suitableTiers: [4, 5, 6],
    defaultLayoutId: 'sports_car_course',
  },
  'Fontana': {
    id: 'fontana', name: 'Fontana', shortName: 'Fontana', officialName: 'Auto Club Speedway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'oval', suitableTiers: [4, 5, 6],
    layoutPrefixes: ['Auto Club Speedway'],
  },
  'Gateway': {
    id: 'gateway', name: 'Gateway', shortName: 'Gateway', officialName: 'World Wide Technology Raceway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'oval', suitableTiers: [4, 5, 6],
    layoutPrefixes: ['WWT Raceway'],
  },
  'Indianapolis': {
    id: 'indianapolis', name: 'Indianapolis', shortName: 'Indianapolis', officialName: 'Indianapolis Motor Speedway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'oval', suitableTiers: [5, 6],
    layoutPrefixes: ['Indianapolis Motor Speedway'],
  },
  'Laguna Seca': {
    id: 'laguna_seca', name: 'Laguna Seca', shortName: 'Laguna Seca', officialName: 'Laguna Seca Raceway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [2, 3, 4, 5],
  },
  'Long Beach': {
    id: 'long_beach', name: 'Long Beach', shortName: 'Long Beach', officialName: 'Long Beach Street Circuit',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'street', suitableTiers: [4, 5, 6],
  },
  'Pocono': {
    id: 'pocono', name: 'Pocono', shortName: 'Pocono', officialName: 'Pocono Raceway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'oval', suitableTiers: [4, 5, 6],
  },
  'Road America': {
    id: 'road_america', name: 'Road America', shortName: 'Road America', officialName: 'Road America',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [3, 4, 5, 6],
  },
  'Road Atlanta': {
    id: 'road_atlanta', name: 'Road Atlanta', shortName: 'Road Atlanta', officialName: 'Road Atlanta',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [4, 5, 6],
  },
  'Sebring': {
    id: 'sebring', name: 'Sebring', shortName: 'Sebring', officialName: 'Sebring International Raceway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [4, 5, 6],
  },
  'Virginia': {
    id: 'virginia', name: 'Virginia', shortName: 'VIR', officialName: 'Virginia International Raceway',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [3, 4, 5],
    layoutPrefixes: ['VIR', 'Virginia International Raceway'],
  },
  'Watkins Glen': {
    id: 'watkins_glen', name: 'Watkins Glen', shortName: 'Watkins Glen', officialName: 'Watkins Glen International',
    country: 'United States', countryCode: 'US', region: 'north_america', type: 'permanent', suitableTiers: [3, 4, 5],
  },

  // NORTH AMERICA - CANADA
  'Montreal': {
    id: 'montreal', name: 'Montréal', shortName: 'Montréal', officialName: 'Circuit Gilles Villeneuve',
    country: 'Canada', countryCode: 'CA', region: 'north_america', type: 'street', suitableTiers: [4, 5, 6],
  },
  'Mosport': {
    id: 'mosport', name: 'Mosport', shortName: 'CTMP', officialName: 'Canadian Tire Motorsport Park',
    country: 'Canada', countryCode: 'CA', region: 'north_america', type: 'permanent', suitableTiers: [3, 4, 5],
  },

  // SOUTH AMERICA - ECUADOR
  'Ibarra': {
    id: 'ibarra', name: 'Ibarra', shortName: 'Ibarra', officialName: 'Autódromo Internacional José Tobar',
    country: 'Ecuador', countryCode: 'EC', region: 'south_america', type: 'permanent', suitableTiers: [2, 3, 4],
    layoutPrefixes: ['Autódromo Yahuarcocha', 'Autodromo Yahuarcocha', 'Yahuarcocha'],
  },
}

// ============================================
// LAYOUT ID GENERATION
// ============================================

function normalizeForMatch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/_+/g, '_')
}

function generateLayoutId(trackName: string, layoutName: string, prefixes?: string[]): string {
  const normalizedLayout = normalizeForMatch(layoutName)
  const allPrefixes = [trackName, ...(prefixes || [])].map(normalizeForMatch)
  allPrefixes.sort((a, b) => b.length - a.length)

  for (const prefix of allPrefixes) {
    if (normalizedLayout.startsWith(prefix)) {
      const remainder = normalizedLayout.slice(prefix.length).trim()
      if (remainder === '') return 'default'
      return slugify(remainder)
    }
  }

  return slugify(normalizedLayout)
}

// ============================================
// BUILD FROM REFERENCE
// ============================================

function buildTracksFromReference(): AMS2Track[] {
  const groups = new Map<string, AMS2LayoutReferenceRecord[]>()
  for (const record of AMS2_LAYOUT_REFERENCE) {
    const existing = groups.get(record.track) || []
    existing.push(record)
    groups.set(record.track, existing)
  }

  const tracks: AMS2Track[] = []
  const unmappedTracks: string[] = []

  for (const [refTrackName, records] of groups) {
    const meta = VENUE_META[refTrackName]
    if (!meta) {
      unmappedTracks.push(refTrackName)
      continue
    }

    const layoutIds = new Set<string>()
    const layouts: TrackLayout[] = records.map(record => {
      let id = generateLayoutId(refTrackName, record.layout, meta.layoutPrefixes)

      let finalId = id
      let suffix = 2
      while (layoutIds.has(finalId)) {
        finalId = `${id}_${suffix}`
        suffix++
      }
      layoutIds.add(finalId)

      return {
        id: finalId,
        name: record.layout,
        lengthKm: typeof record.lengthKm === 'number' ? record.lengthKm : 0,
        turns: typeof record.turns === 'number' ? record.turns : 0,
        year: record.year,
        grade: record.grade ?? undefined,
        sourceLayoutName: record.layout,
        defaultDate: record.defaultDate ?? undefined,
        altitudeM: typeof record.altitudeM === 'number' ? record.altitudeM : undefined,
        sourceVerified: true,
      }
    })

    const defaultLayoutId = meta.defaultLayoutId ||
      (layouts.find(l => l.id === 'default')?.id) ||
      layouts[0]?.id || 'default'

    const dlc = meta.dlc ?? records.find(r => r.dlc)?.dlc ?? undefined

    tracks.push({
      id: meta.id,
      name: meta.name,
      shortName: meta.shortName,
      officialName: meta.officialName,
      country: meta.country,
      countryCode: meta.countryCode,
      region: meta.region,
      type: meta.type,
      layoutCount: layouts.length,
      layouts,
      defaultLayout: defaultLayoutId,
      suitableTiers: meta.suitableTiers,
      dlc: dlc || undefined,
      youtubeId: meta.youtubeId,
    })
  }

  if (unmappedTracks.length > 0) {
    console.warn(`[AMS2] Reference tracks without venue metadata: ${unmappedTracks.join(', ')}`)
  }

  return tracks
}

export const ALL_TRACKS: AMS2Track[] = buildTracksFromReference()

export const AMS2_SOURCE_SYNC_AUDIT = {
  totalLayouts: ALL_TRACKS.reduce((sum, track) => sum + track.layouts.length, 0),
  verifiedLayouts: ALL_TRACKS.reduce(
    (sum, track) => sum + track.layouts.filter(layout => layout.sourceVerified).length,
    0
  ),
  unmatchedLayouts: ALL_TRACKS.flatMap(track =>
    track.layouts
      .filter(layout => !layout.sourceVerified)
      .map(layout => `${track.id}:${layout.id}`)
  ),
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getTrackById(id: string): AMS2Track | undefined {
  return ALL_TRACKS.find(track => track.id === id)
}

export function getTracksForTier(tier: number): AMS2Track[] {
  return ALL_TRACKS.filter(track => track.suitableTiers.includes(tier))
}

export function getTracksByRegion(region: TrackRegion): AMS2Track[] {
  return ALL_TRACKS.filter(track => track.region === region)
}

export function getTracksByCountry(countryCode: string): AMS2Track[] {
  return ALL_TRACKS.filter(track => track.countryCode === countryCode)
}

export function getLayoutById(trackId: string, layoutId: string): TrackLayout | undefined {
  const track = getTrackById(trackId)
  return track?.layouts.find(layout => layout.id === layoutId)
}

export function generateCalendarTracks(
  tier: number,
  count: number,
  preferredRegion?: TrackRegion
): { trackId: string; layoutId: string; trackName: string; country: string }[] {
  let suitableTracks = getTracksForTier(tier)

  if (preferredRegion) {
    const regionTracks = suitableTracks.filter(t => t.region === preferredRegion)
    const otherTracks = suitableTracks.filter(t => t.region !== preferredRegion)
    const regionCount = Math.ceil(count * 0.7)
    const otherCount = count - regionCount

    const shuffledRegion = [...regionTracks].sort(() => Math.random() - 0.5).slice(0, regionCount)
    const shuffledOther = [...otherTracks].sort(() => Math.random() - 0.5).slice(0, otherCount)
    suitableTracks = [...shuffledRegion, ...shuffledOther].sort(() => Math.random() - 0.5)
  } else {
    suitableTracks = [...suitableTracks].sort(() => Math.random() - 0.5)
  }

  const selected = suitableTracks.slice(0, Math.min(count, suitableTracks.length))

  return selected.map(track => ({
    trackId: track.id,
    layoutId: track.defaultLayout,
    trackName: track.name,
    country: track.country
  }))
}

// Alias for backwards compatibility
export const AMS2_TRACKS = ALL_TRACKS
export type Track = AMS2Track

// Stats for reference
export const TRACK_STATS = {
  total: ALL_TRACKS.length,
  totalLayouts: ALL_TRACKS.reduce((sum, track) => sum + track.layoutCount, 0),
  byRegion: {
    brazil: ALL_TRACKS.filter(t => t.region === 'brazil').length,
    europe: ALL_TRACKS.filter(t => t.region === 'europe').length,
    northAmerica: ALL_TRACKS.filter(t => t.region === 'north_america').length,
    southAmerica: ALL_TRACKS.filter(t => t.region === 'south_america').length,
    asia: ALL_TRACKS.filter(t => t.region === 'asia').length,
    oceania: ALL_TRACKS.filter(t => t.region === 'oceania').length,
    africa: ALL_TRACKS.filter(t => t.region === 'africa').length,
  }
}

// ============================================
// ENHANCED CALENDAR GENERATION UTILITIES
// ============================================

export function getTrackHighestGrade(track: AMS2Track): string | undefined {
  const gradeOrder = ['Grade 1', 'Grade 1T', 'Grade 2', 'Grade 3', 'Grade 4']

  for (const grade of gradeOrder) {
    const hasGrade = track.layouts.some(layout => layout.grade === grade)
    if (hasGrade) return grade
  }

  for (const layout of track.layouts) {
    if (layout.grade && !layout.grade.includes('Historic') && !layout.grade.includes('Off-road')) {
      return layout.grade
    }
  }

  return undefined
}

export function filterTracksByGrade(tracks: AMS2Track[], acceptableGrades: string[]): AMS2Track[] {
  if (acceptableGrades.length === 0) {
    return tracks
  }

  return tracks.filter(track => {
    const trackGrade = getTrackHighestGrade(track)
    return trackGrade ? acceptableGrades.includes(trackGrade) : true
  })
}

export function getTracksByType(trackTypes: TrackType[]): AMS2Track[] {
  return ALL_TRACKS.filter(track => trackTypes.includes(track.type))
}

export interface TrackFilterCriteria {
  types?: TrackType[]
  regions?: TrackRegion[]
  grades?: string[]
  minTier?: number
  maxTier?: number
  excludeIds?: string[]
  includeDLC?: boolean
}

export function getTracksFiltered(criteria: TrackFilterCriteria): AMS2Track[] {
  let tracks = [...ALL_TRACKS]

  if (criteria.types && criteria.types.length > 0) {
    tracks = tracks.filter(t => criteria.types!.includes(t.type))
  }

  if (criteria.regions && criteria.regions.length > 0) {
    tracks = tracks.filter(t => criteria.regions!.includes(t.region))
  }

  if (criteria.grades && criteria.grades.length > 0) {
    tracks = filterTracksByGrade(tracks, criteria.grades)
  }

  if (criteria.minTier !== undefined || criteria.maxTier !== undefined) {
    const minTier = criteria.minTier ?? 1
    const maxTier = criteria.maxTier ?? 6
    tracks = tracks.filter(t =>
      t.suitableTiers.some(tier => tier >= minTier && tier <= maxTier)
    )
  }

  if (criteria.excludeIds && criteria.excludeIds.length > 0) {
    tracks = tracks.filter(t => !criteria.excludeIds!.includes(t.id))
  }

  if (criteria.includeDLC === false) {
    tracks = tracks.filter(t => !t.dlc)
  }

  return tracks
}

export function applyRegionalWeighting(
  tracks: AMS2Track[],
  primaryRegion: TrackRegion,
  weight: number,
  secondaryRegion?: TrackRegion
): AMS2Track[] {
  const primaryTracks = tracks.filter(t => t.region === primaryRegion)
  const secondaryTracks = secondaryRegion
    ? tracks.filter(t => t.region === secondaryRegion)
    : []
  const otherTracks = tracks.filter(t =>
    t.region !== primaryRegion &&
    (!secondaryRegion || t.region !== secondaryRegion)
  )

  const shuffledPrimary = [...primaryTracks].sort(() => Math.random() - 0.5)
  const shuffledSecondary = [...secondaryTracks].sort(() => Math.random() - 0.5)
  const shuffledOther = [...otherTracks].sort(() => Math.random() - 0.5)

  const result: AMS2Track[] = []
  let pIdx = 0, sIdx = 0, oIdx = 0

  const totalTracks = tracks.length
  const primaryCount = Math.floor(totalTracks * weight)
  const secondaryCount = secondaryRegion ? Math.floor(totalTracks * (1 - weight) * 0.4) : 0

  while (pIdx < shuffledPrimary.length && result.length < primaryCount) {
    result.push(shuffledPrimary[pIdx++])
  }

  while (sIdx < shuffledSecondary.length && result.length < primaryCount + secondaryCount) {
    result.push(shuffledSecondary[sIdx++])
  }

  while (pIdx < shuffledPrimary.length) {
    result.push(shuffledPrimary[pIdx++])
  }
  while (sIdx < shuffledSecondary.length) {
    result.push(shuffledSecondary[sIdx++])
  }
  while (oIdx < shuffledOther.length) {
    result.push(shuffledOther[oIdx++])
  }

  return result
}

export function selectTracksForCalendar(
  availableTracks: AMS2Track[],
  iconicTrackIds: string[],
  totalRounds: number
): AMS2Track[] {
  const selected: AMS2Track[] = []
  const usedIds = new Set<string>()

  for (const iconicId of iconicTrackIds) {
    if (selected.length >= totalRounds) break

    const track = availableTracks.find(t => t.id === iconicId)
    if (track && !usedIds.has(track.id)) {
      selected.push(track)
      usedIds.add(track.id)
    }
  }

  for (const track of availableTracks) {
    if (selected.length >= totalRounds) break

    if (!usedIds.has(track.id)) {
      selected.push(track)
      usedIds.add(track.id)
    }
  }

  const iconicCount = Math.min(iconicTrackIds.length, selected.length)
  const iconicPart = selected.slice(0, iconicCount)
  const restPart = selected.slice(iconicCount).sort(() => Math.random() - 0.5)

  const final = [...iconicPart, ...restPart]

  for (let i = 0; i < Math.min(iconicCount, 3); i++) {
    const swapIdx = Math.floor(Math.random() * (final.length - 1)) + 1
    if (swapIdx !== i && swapIdx < final.length) {
      [final[i], final[swapIdx]] = [final[swapIdx], final[i]]
    }
  }

  return final
}

export function getTrackTypesForCategory(category: string): { types: TrackType[], includeOvalRoadCourses: boolean } {
  switch (category) {
    case 'kart':
      return { types: ['kart'], includeOvalRoadCourses: false }

    case 'formula':
      return { types: ['permanent', 'street'], includeOvalRoadCourses: true }

    case 'gt':
    case 'gt-sportscar':
      return { types: ['permanent', 'street'], includeOvalRoadCourses: true }

    case 'stock':
      return { types: ['permanent'], includeOvalRoadCourses: false }

    case 'stock-usa':
      return { types: ['oval', 'permanent', 'street'], includeOvalRoadCourses: false }

    case 'prototype':
    case 'endurance':
      return { types: ['permanent'], includeOvalRoadCourses: true }

    case 'touring':
      return { types: ['permanent', 'street'], includeOvalRoadCourses: false }

    case 'spec-series':
      return { types: ['permanent', 'street'], includeOvalRoadCourses: false }

    case 'rallycross':
      return { types: ['rallycross'], includeOvalRoadCourses: false }

    case 'other':
    default:
      return { types: ['permanent'], includeOvalRoadCourses: false }
  }
}

export function getTracksForCategory(
  category: string,
  regions?: TrackRegion[],
  grades?: string[]
): AMS2Track[] {
  const { types, includeOvalRoadCourses } = getTrackTypesForCategory(category)

  let tracks = ALL_TRACKS.filter(track => {
    if (types.includes(track.type)) return true

    if (includeOvalRoadCourses && track.type === 'oval') {
      const hasRoadLayout = track.layouts.some(l =>
        l.id === 'road' || l.id === 'gp' || l.id === 'roval' ||
        l.id.includes('road') || l.id.includes('sports_car')
      )
      return hasRoadLayout
    }

    return false
  })

  if (regions && regions.length > 0) {
    tracks = tracks.filter(t => regions.includes(t.region))
  }

  if (grades && grades.length > 0) {
    tracks = filterTracksByGrade(tracks, grades)
  }

  return tracks
}

export function sortTracksByRegionPriority(
  tracks: AMS2Track[],
  primaryRegion: TrackRegion
): AMS2Track[] {
  const primary = tracks.filter(t => t.region === primaryRegion)
  const others = tracks.filter(t => t.region !== primaryRegion)

  const shuffledPrimary = [...primary].sort(() => Math.random() - 0.5)
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5)

  return [...shuffledPrimary, ...shuffledOthers]
}
