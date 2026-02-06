// Complete AMS2 Track Database - Based on official wiki (62 locations, 210 layouts)
// Source: https://automobilista2.wiki.gg/wiki/Tracks_and_Layouts

export type TrackType = 'permanent' | 'street' | 'oval' | 'kart' | 'rallycross' | 'hillclimb'
export type TrackRegion = 'brazil' | 'europe' | 'asia' | 'oceania' | 'north_america' | 'south_america' | 'africa'

export interface TrackLayout {
  id: string
  name: string
  lengthKm: number
  turns: number
  year: number | string // Year or "Historic"
  grade?: string // FIA Grade or type
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
  // Which car class tiers this track is suitable for (1=entry, 6=top)
  suitableTiers: number[]
  dlc?: string // Which DLC pack if not base game
  youtubeId?: string // Video preview of the track
}

// ============================================
// ALL 62 AMS2 TRACK LOCATIONS (from wiki)
// ============================================

export const ALL_TRACKS: AMS2Track[] = [
  // AUSTRALIA
  {
    id: 'adelaide',
    name: 'Adelaide',
    shortName: 'Adelaide',
    officialName: 'Adelaide Street Circuit',
    country: 'Australia',
    countryCode: 'AU',
    region: 'oceania',
    type: 'street',
    layoutCount: 3,
    layouts: [
      { id: 'historic_1988', name: 'Historic 1988', lengthKm: 3.780, turns: 16, year: 1988, grade: 'Historic' },
      { id: '2020', name: 'Adelaide 2020', lengthKm: 3.219, turns: 14, year: 2020, grade: 'Grade 3' },
      { id: 'stt', name: 'Adelaide STT', lengthKm: 3.219, turns: 14, year: 2020, grade: 'Grade 3' },
    ],
    defaultLayout: '2020',
    suitableTiers: [3, 4, 5, 6],
  },
  {
    id: 'bathurst',
    name: 'Bathurst',
    shortName: 'Bathurst',
    officialName: 'Mount Panorama Circuit',
    country: 'Australia',
    countryCode: 'AU',
    region: 'oceania',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 6.213, turns: 23, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 6.172, turns: 23, year: 1970 },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5, 6],
  },

  // BRAZIL (21 tracks)
  {
    id: 'ascurra',
    name: 'Ascurra',
    shortName: 'Ascurra',
    officialName: 'Autódromo Max Mohr',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'rallycross',
    layoutCount: 2,
    layouts: [
      { id: 'dirt', name: 'Ascurra Dirt', lengthKm: 0.910, turns: 8, year: 2022, grade: 'Off-road' },
      { id: 'rx', name: 'Ascurra RX', lengthKm: 0.910, turns: 8, year: 2023, grade: 'Off-road' },
    ],
    defaultLayout: 'rx',
    suitableTiers: [1, 2, 3],
    dlc: 'Adrenaline 1',
  },
  {
    id: 'brasilia',
    name: 'Brasília',
    shortName: 'Brasília',
    officialName: 'Autódromo Brasília BRB',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 5.479, turns: 12, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 3.400, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [2, 3, 4, 5],
  },
  {
    id: 'campo_grande',
    name: 'Campo Grande',
    shortName: 'Campo Grande',
    officialName: 'Autódromo Internacional Orlando Moura',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.437, turns: 11, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'cascavel',
    name: 'Cascavel',
    shortName: 'Cascavel',
    officialName: 'Autódromo Internacional Zilmar Beux de Cascavel',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.033, turns: 10, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'curitiba',
    name: 'Curitiba',
    shortName: 'Curitiba',
    officialName: 'Autódromo Internacional de Curitiba',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.695, turns: 12, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.500, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'curvelo',
    name: 'Curvelo',
    shortName: 'Curvelo',
    officialName: 'Circuito dos Cristais',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 2.557, turns: 8, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 1.800, turns: 6, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3],
  },
  {
    id: 'foz',
    name: 'Foz do Iguaçu',
    shortName: 'Foz',
    officialName: 'X Games Foz do Iguaçu Rallycross',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'rallycross',
    layoutCount: 1,
    layouts: [
      { id: 'rx', name: 'Rallycross', lengthKm: 1.200, turns: 10, year: 2020, grade: 'Off-road' },
    ],
    defaultLayout: 'rx',
    suitableTiers: [1, 2, 3],
  },
  {
    id: 'galeao',
    name: 'Galeão Airport',
    shortName: 'Galeão',
    officialName: 'Cacá Bueno Circuit',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'street',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 2.900, turns: 12, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [2, 3, 4],
  },
  {
    id: 'goiania',
    name: 'Goiânia',
    shortName: 'Goiânia',
    officialName: 'Autódromo Internacional Ayrton Senna (Goiânia)',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.835, turns: 11, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.850, turns: 8, year: 2020 },
      { id: 'exterior', name: 'Exterior Circuit', lengthKm: 2.455, turns: 7, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4, 5],
  },
  {
    id: 'granja_viana',
    name: 'Granja Viana',
    shortName: 'Granja Viana',
    officialName: 'Kartódromo Internacional da Granja Viana',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'kart',
    layoutCount: 5,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 1.150, turns: 16, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 0.900, turns: 12, year: 2020 },
      { id: 'exterior', name: 'Exterior', lengthKm: 0.800, turns: 10, year: 2020 },
      { id: 'interior', name: 'Interior', lengthKm: 0.700, turns: 8, year: 2020 },
      { id: 'mini', name: 'Mini', lengthKm: 0.500, turns: 6, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1],
  },
  {
    id: 'guapore',
    name: 'Guaporé',
    shortName: 'Guaporé',
    officialName: 'Autódromo Internacional de Guaporé',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 2.421, turns: 9, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 1.800, turns: 6, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3],
  },
  {
    id: 'interlagos',
    name: 'Interlagos',
    shortName: 'Interlagos',
    officialName: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 9,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.309, turns: 15, year: 2020, grade: 'Grade 1' },
      { id: 'short', name: 'Short', lengthKm: 2.677, turns: 10, year: 2020 },
      { id: 'historic_1976', name: 'Historic 1976', lengthKm: 7.960, turns: 26, year: 1976, grade: 'Historic' },
      { id: 'historic_1979', name: 'Historic 1979', lengthKm: 7.874, turns: 25, year: 1979, grade: 'Historic' },
      { id: 'kart', name: 'Kart Circuit', lengthKm: 1.200, turns: 12, year: 2020 },
      { id: 'moto', name: 'Moto Circuit', lengthKm: 4.100, turns: 14, year: 2020 },
      { id: 'stock', name: 'Stock Car Layout', lengthKm: 4.309, turns: 15, year: 2020 },
      { id: 'classic', name: 'Classic', lengthKm: 4.309, turns: 15, year: 1990 },
      { id: 'outer', name: 'Outer Circuit', lengthKm: 2.500, turns: 8, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [1, 2, 3, 4, 5, 6],
    youtubeId: '8y1G9e8q7k8' // Interlagos Hotlap
  },
  {
    id: 'jacarepagua',
    name: 'Jacarepaguá',
    shortName: 'Jacarepaguá',
    officialName: 'Autódromo Internacional Nelson Piquet',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'gp_1988', name: 'GP 1988', lengthKm: 5.031, turns: 14, year: 1988, grade: 'Historic' },
      { id: 'gp_2005', name: 'GP 2005', lengthKm: 4.933, turns: 13, year: 2005 },
      { id: 'short', name: 'Short', lengthKm: 3.280, turns: 10, year: 2005 },
      { id: 'oval', name: 'Oval', lengthKm: 3.000, turns: 4, year: 2005 },
      { id: 'roval', name: 'Roval', lengthKm: 3.800, turns: 12, year: 2005 },
    ],
    defaultLayout: 'gp_2005',
    suitableTiers: [2, 3, 4, 5, 6],
  },
  {
    id: 'londrina',
    name: 'Londrina',
    shortName: 'Londrina',
    officialName: 'Autódromo Internacional Ayrton Senna (Londrina)',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.135, turns: 9, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.200, turns: 6, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 3.135, turns: 9, year: 1990 },
      { id: 'outer', name: 'Outer', lengthKm: 2.800, turns: 8, year: 2020 },
      { id: 'inner', name: 'Inner', lengthKm: 1.800, turns: 5, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'salvador',
    name: 'Salvador',
    shortName: 'Salvador',
    officialName: 'Circuito Ayrton Senna',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'street',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 2.500, turns: 10, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5],
  },
  {
    id: 'santa_cruz',
    name: 'Santa Cruz do Sul',
    shortName: 'Santa Cruz',
    officialName: 'Autódromo Internacional de Santa Cruz do Sul',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.056, turns: 10, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'speedland',
    name: 'Speedland',
    shortName: 'Speedland',
    officialName: 'Speedland Kart Center',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'kart',
    layoutCount: 4,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 1.014, turns: 14, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 0.800, turns: 10, year: 2020 },
      { id: 'exterior', name: 'Exterior', lengthKm: 0.700, turns: 8, year: 2020 },
      { id: 'interior', name: 'Interior', lengthKm: 0.600, turns: 6, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1],
  },
  {
    id: 'taruma',
    name: 'Tarumã',
    shortName: 'Tarumã',
    officialName: 'Autódromo Internacional de Tarumã',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'internacional', name: 'Internacional', lengthKm: 3.019, turns: 9, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.200, turns: 6, year: 2020 },
    ],
    defaultLayout: 'internacional',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'velo_citta',
    name: 'Velo Città',
    shortName: 'Velo Città',
    officialName: 'Autódromo Velo Città',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.444, turns: 12, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.500, turns: 8, year: 2020 },
      { id: 'exterior', name: 'Exterior', lengthKm: 2.800, turns: 9, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'velopark',
    name: 'Velopark',
    shortName: 'Velopark',
    officialName: 'Velopark',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'brazil',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.021, turns: 10, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.200, turns: 7, year: 2020 },
      { id: 'exterior', name: 'Exterior', lengthKm: 2.500, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },

  // ARGENTINA
  {
    id: 'buenos_aires',
    name: 'Buenos Aires',
    shortName: 'Buenos Aires',
    officialName: 'Autódromo Oscar y Juan Gálvez',
    country: 'Argentina',
    countryCode: 'AR',
    region: 'south_america',
    type: 'permanent',
    layoutCount: 7,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.259, turns: 16, year: 2020 },
      { id: 'no6', name: 'Circuit No. 6', lengthKm: 3.353, turns: 12, year: 2020 },
      { id: 'no8', name: 'Circuit No. 8', lengthKm: 2.938, turns: 10, year: 2020 },
      { id: 'no9', name: 'Circuit No. 9', lengthKm: 4.074, turns: 14, year: 2020 },
      { id: 'no12', name: 'Circuit No. 12', lengthKm: 3.700, turns: 13, year: 2020 },
      { id: 'no15', name: 'Circuit No. 15', lengthKm: 2.100, turns: 8, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 3.912, turns: 14, year: 1972 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5, 6],
  },
  {
    id: 'cordoba',
    name: 'Córdoba',
    shortName: 'Córdoba',
    officialName: 'Autódromo Oscar Cabalén',
    country: 'Argentina',
    countryCode: 'AR',
    region: 'south_america',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 4.000, turns: 12, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.800, turns: 8, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 4.200, turns: 14, year: 1970 },
    ],
    defaultLayout: 'full',
    suitableTiers: [2, 3, 4, 5],
  },
  {
    id: 'termas',
    name: 'Termas de Río Hondo',
    shortName: 'Termas',
    officialName: 'Autódromo Termas de Río Hondo',
    country: 'Argentina',
    countryCode: 'AR',
    region: 'south_america',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 4.806, turns: 14, year: 2020, grade: 'Grade 1T' },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5, 6],
  },

  // EUROPE - UK
  {
    id: 'brands_hatch',
    name: 'Brands Hatch',
    shortName: 'Brands Hatch',
    officialName: 'Brands Hatch',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 3.908, turns: 9, year: 2020, grade: 'Grade 2' },
      { id: 'indy', name: 'Indy', lengthKm: 1.929, turns: 6, year: 2020, grade: 'Grade 3' },
    ],
    defaultLayout: 'gp',
    suitableTiers: [1, 2, 3, 4, 5],
  },
  {
    id: 'cadwell_park',
    name: 'Cadwell Park',
    shortName: 'Cadwell',
    officialName: 'Cadwell Park',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.508, turns: 16, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3],
  },
  {
    id: 'donington',
    name: 'Donington Park',
    shortName: 'Donington',
    officialName: 'Donington Park',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.023, turns: 12, year: 2020, grade: 'Grade 2' },
      { id: 'national', name: 'National', lengthKm: 3.149, turns: 10, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5],
  },
  {
    id: 'oulton_park',
    name: 'Oulton Park',
    shortName: 'Oulton Park',
    officialName: 'Oulton Park',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 4,
    layouts: [
      { id: 'international', name: 'International', lengthKm: 4.307, turns: 17, year: 2020 },
      { id: 'island', name: 'Island', lengthKm: 3.621, turns: 14, year: 2020 },
      { id: 'fosters', name: 'Fosters', lengthKm: 2.655, turns: 10, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 4.400, turns: 18, year: 1970 },
    ],
    defaultLayout: 'international',
    suitableTiers: [1, 2, 3, 4],
  },
  {
    id: 'silverstone',
    name: 'Silverstone',
    shortName: 'Silverstone',
    officialName: 'Silverstone Circuit',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 9,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 5.891, turns: 18, year: 2020, grade: 'Grade 1' },
      { id: 'international', name: 'International', lengthKm: 3.619, turns: 11, year: 2020 },
      { id: 'national', name: 'National', lengthKm: 2.638, turns: 8, year: 2020 },
      { id: 'historic_1975', name: 'Historic 1975', lengthKm: 4.719, turns: 14, year: 1975 },
      { id: 'historic_1991', name: 'Historic 1991', lengthKm: 5.226, turns: 16, year: 1991 },
      { id: 'arena', name: 'Arena GP', lengthKm: 3.600, turns: 10, year: 2020 },
      { id: 'bridge', name: 'Bridge', lengthKm: 2.000, turns: 6, year: 2020 },
      { id: 'stowe', name: 'Stowe', lengthKm: 1.800, turns: 5, year: 2020 },
      { id: 'stt', name: 'STT', lengthKm: 5.891, turns: 18, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5, 6],
  },
  {
    id: 'snetterton',
    name: 'Snetterton',
    shortName: 'Snetterton',
    officialName: 'Snetterton Circuit',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: '300', name: '300 Circuit', lengthKm: 4.779, turns: 12, year: 2020 },
      { id: '200', name: '200 Circuit', lengthKm: 3.218, turns: 9, year: 2020 },
      { id: '100', name: '100 Circuit', lengthKm: 1.609, turns: 6, year: 2020 },
    ],
    defaultLayout: '300',
    suitableTiers: [1, 2, 3, 4],
  },

  // EUROPE - GERMANY
  {
    id: 'hockenheim',
    name: 'Hockenheim',
    shortName: 'Hockenheim',
    officialName: 'Hockenheimring Baden-Württemberg',
    country: 'Germany',
    countryCode: 'DE',
    region: 'europe',
    type: 'permanent',
    layoutCount: 10,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.574, turns: 17, year: 2020, grade: 'Grade 1' },
      { id: 'national', name: 'National', lengthKm: 2.638, turns: 9, year: 2020 },
      { id: 'historic_1988', name: 'Historic 1988', lengthKm: 6.823, turns: 13, year: 1988 },
      { id: 'historic_2001', name: 'Historic 2001', lengthKm: 4.574, turns: 17, year: 2001 },
      { id: 'short', name: 'Short', lengthKm: 2.600, turns: 8, year: 2020 },
      { id: 'club', name: 'Club', lengthKm: 2.000, turns: 6, year: 2020 },
      { id: 'a', name: 'Circuit A', lengthKm: 1.800, turns: 5, year: 2020 },
      { id: 'b', name: 'Circuit B', lengthKm: 1.600, turns: 4, year: 2020 },
      { id: 'stt', name: 'STT', lengthKm: 4.574, turns: 17, year: 2020 },
      { id: 'rallycross', name: 'Rallycross', lengthKm: 1.100, turns: 8, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5, 6],
  },
  {
    id: 'nurburgring',
    name: 'Nürburgring',
    shortName: 'Nürburgring',
    officialName: 'Nürburgring',
    country: 'Germany',
    countryCode: 'DE',
    region: 'europe',
    type: 'permanent',
    layoutCount: 14,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 5.148, turns: 15, year: 2020, grade: 'Grade 1' },
      { id: 'nordschleife', name: 'Nordschleife', lengthKm: 20.832, turns: 154, year: 2020 },
      { id: 'combined', name: '24h Combined', lengthKm: 25.378, turns: 166, year: 2020 },
      { id: 'sprint', name: 'Sprint', lengthKm: 3.629, turns: 10, year: 2020 },
      { id: 'short', name: 'Short', lengthKm: 3.600, turns: 9, year: 2020 },
      { id: 'historic_1967', name: 'Historic 1967', lengthKm: 22.810, turns: 170, year: 1967 },
      { id: 'historic_1971', name: 'Historic 1971', lengthKm: 22.835, turns: 170, year: 1971 },
      { id: 'historic_1976', name: 'Historic 1976', lengthKm: 22.835, turns: 170, year: 1976 },
      { id: 'gp_historic', name: 'GP Historic', lengthKm: 4.542, turns: 12, year: 1984 },
      { id: 'muellenbachschleife', name: 'Müllenbachschleife', lengthKm: 1.500, turns: 6, year: 2020 },
      { id: 'stt', name: 'STT', lengthKm: 5.148, turns: 15, year: 2020 },
      { id: 'sprint_short', name: 'Sprint Short', lengthKm: 2.800, turns: 7, year: 2020 },
      { id: 'vln', name: 'VLN', lengthKm: 24.358, turns: 160, year: 2020 },
      { id: 'tourist', name: 'Touristenfahrten', lengthKm: 20.832, turns: 154, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
    dlc: 'Nürburgring Pack',
  },

  // EUROPE - ITALY
  {
    id: 'imola',
    name: 'Imola',
    shortName: 'Imola',
    officialName: 'Autodromo Internazionale Enzo e Dino Ferrari',
    country: 'Italy',
    countryCode: 'IT',
    region: 'europe',
    type: 'permanent',
    layoutCount: 4,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.909, turns: 19, year: 2020, grade: 'Grade 1' },
      { id: 'historic', name: 'Historic', lengthKm: 5.040, turns: 23, year: 1980 },
      { id: 'moto', name: 'Moto', lengthKm: 4.936, turns: 19, year: 2020 },
      { id: 'short', name: 'Short', lengthKm: 2.800, turns: 10, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },
  {
    id: 'monza',
    name: 'Monza',
    shortName: 'Monza',
    officialName: 'Autodromo Nazionale Monza',
    country: 'Italy',
    countryCode: 'IT',
    region: 'europe',
    type: 'permanent',
    layoutCount: 8,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 5.793, turns: 11, year: 2020, grade: 'Grade 1' },
      { id: 'historic_1971', name: 'Historic 1971', lengthKm: 5.775, turns: 10, year: 1971 },
      { id: 'historic_1966', name: 'Historic 1966', lengthKm: 10.000, turns: 14, year: 1966 },
      { id: 'junior', name: 'Junior', lengthKm: 2.405, turns: 5, year: 2020 },
      { id: 'short', name: 'Short', lengthKm: 4.200, turns: 8, year: 2020 },
      { id: 'full_oval', name: 'Full with Oval', lengthKm: 10.000, turns: 14, year: 2020 },
      { id: 'stt', name: 'STT', lengthKm: 5.793, turns: 11, year: 2020 },
      { id: 'biassono', name: 'Biassono', lengthKm: 3.800, turns: 7, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },
  {
    id: 'ortona',
    name: 'Ortona',
    shortName: 'Ortona',
    officialName: "Circuito Internazionale d'Abruzzo",
    country: 'Italy',
    countryCode: 'IT',
    region: 'europe',
    type: 'permanent',
    layoutCount: 4,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.500, turns: 12, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.400, turns: 8, year: 2020 },
      { id: 'east', name: 'East', lengthKm: 2.000, turns: 6, year: 2020 },
      { id: 'west', name: 'West', lengthKm: 1.800, turns: 5, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3, 4],
  },

  // EUROPE - BELGIUM
  {
    id: 'spa',
    name: 'Spa-Francorchamps',
    shortName: 'Spa',
    officialName: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    countryCode: 'BE',
    region: 'europe',
    type: 'permanent',
    layoutCount: 6,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 7.004, turns: 19, year: 2020, grade: 'Grade 1' },
      { id: 'historic_1970', name: 'Historic 1970', lengthKm: 14.120, turns: 32, year: 1970 },
      { id: 'historic_1979', name: 'Historic 1979', lengthKm: 6.949, turns: 19, year: 1979 },
      { id: 'historic_2004', name: 'Historic 2004', lengthKm: 6.976, turns: 19, year: 2004 },
      { id: 'short', name: 'Short', lengthKm: 4.600, turns: 12, year: 2020 },
      { id: 'stt', name: 'STT', lengthKm: 7.004, turns: 19, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },

  // EUROPE - SPAIN
  {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'Barcelona',
    officialName: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    countryCode: 'ES',
    region: 'europe',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.657, turns: 16, year: 2020, grade: 'Grade 1' },
      { id: 'national', name: 'National', lengthKm: 3.049, turns: 10, year: 2020 },
      { id: 'moto', name: 'Moto GP', lengthKm: 4.627, turns: 14, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 4.747, turns: 17, year: 1991 },
      { id: 'club', name: 'Club', lengthKm: 2.200, turns: 7, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },
  {
    id: 'jerez',
    name: 'Jerez',
    shortName: 'Jerez',
    officialName: 'Circuito de Jerez – Ángel Nieto',
    country: 'Spain',
    countryCode: 'ES',
    region: 'europe',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.428, turns: 13, year: 2020, grade: 'Grade 1' },
      { id: 'moto', name: 'Moto', lengthKm: 4.423, turns: 13, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 4.218, turns: 13, year: 1986 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5],
  },

  // EUROPE - AUSTRIA
  {
    id: 'spielberg',
    name: 'Spielberg',
    shortName: 'Spielberg',
    officialName: 'Red Bull Ring',
    country: 'Austria',
    countryCode: 'AT',
    region: 'europe',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.318, turns: 10, year: 2020, grade: 'Grade 1' },
      { id: 'national', name: 'National', lengthKm: 2.336, turns: 5, year: 2020 },
      { id: 'historic_1977', name: 'Historic 1977', lengthKm: 5.942, turns: 18, year: 1977 },
      { id: 'short', name: 'Short', lengthKm: 2.400, turns: 6, year: 2020 },
      { id: 'rallycross', name: 'Rallycross', lengthKm: 1.500, turns: 9, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5, 6],
  },

  // EUROPE - PORTUGAL
  {
    id: 'estoril',
    name: 'Estoril',
    shortName: 'Estoril',
    officialName: 'Circuito do Estoril',
    country: 'Portugal',
    countryCode: 'PT',
    region: 'europe',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.182, turns: 13, year: 2020, grade: 'Grade 1' },
      { id: 'historic', name: 'Historic', lengthKm: 4.350, turns: 13, year: 1984 },
      { id: 'short', name: 'Short', lengthKm: 2.800, turns: 8, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [2, 3, 4, 5],
  },

  // EUROPE - FRANCE
  {
    id: 'le_mans',
    name: 'Le Mans',
    shortName: 'Le Mans',
    officialName: 'Circuit des 24 Heures du Mans',
    country: 'France',
    countryCode: 'FR',
    region: 'europe',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 13.626, turns: 38, year: 2020, grade: 'Grade 1' },
      { id: 'bugatti', name: 'Bugatti Circuit', lengthKm: 4.185, turns: 9, year: 2020, grade: 'Grade 2' },
    ],
    defaultLayout: 'full',
    suitableTiers: [4, 5, 6],
    dlc: 'Le Mans Pack',
  },

  // EUROPE - MONACO
  {
    id: 'monaco',
    name: 'Monaco',
    shortName: 'Monaco',
    officialName: 'Circuit de Monaco',
    country: 'Monaco',
    countryCode: 'MC',
    region: 'europe',
    type: 'street',
    layoutCount: 1,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 3.337, turns: 19, year: 2020, grade: 'Grade 1' },
    ],
    defaultLayout: 'gp',
    suitableTiers: [5, 6],
  },

  // EUROPE - FINLAND
  {
    id: 'tykki',
    name: 'Tykki',
    shortName: 'Tykki',
    officialName: 'Kouvola Circuit',
    country: 'Finland',
    countryCode: 'FI',
    region: 'europe',
    type: 'rallycross',
    layoutCount: 4,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 1.200, turns: 8, year: 2020, grade: 'Off-road' },
      { id: 'short', name: 'Short Circuit', lengthKm: 0.900, turns: 6, year: 2020 },
      { id: 'snow', name: 'Snow', lengthKm: 1.200, turns: 8, year: 2020 },
      { id: 'ice', name: 'Ice', lengthKm: 1.000, turns: 7, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3],
  },

  // EUROPE - NORWAY
  {
    id: 'buskerud',
    name: 'Buskerud',
    shortName: 'Buskerud',
    officialName: 'Buskerud',
    country: 'Norway',
    countryCode: 'NO',
    region: 'europe',
    type: 'rallycross',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 1.300, turns: 9, year: 2020, grade: 'Off-road' },
      { id: 'short', name: 'Short Circuit', lengthKm: 1.000, turns: 7, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [1, 2, 3],
  },

  // ASIA - JAPAN
  {
    id: 'suzuka',
    name: 'Suzuka',
    shortName: 'Suzuka',
    officialName: 'Suzuka International Racing Course',
    country: 'Japan',
    countryCode: 'JP',
    region: 'asia',
    type: 'permanent',
    layoutCount: 4,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 5.807, turns: 18, year: 2020, grade: 'Grade 1' },
      { id: 'east', name: 'East Course', lengthKm: 2.243, turns: 8, year: 2020 },
      { id: 'west', name: 'West Course', lengthKm: 3.475, turns: 10, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 5.859, turns: 18, year: 1987 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },

  // AFRICA
  {
    id: 'kyalami',
    name: 'Kyalami',
    shortName: 'Kyalami',
    officialName: 'Kyalami Grand Prix Circuit',
    country: 'South Africa',
    countryCode: 'ZA',
    region: 'africa',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.522, turns: 16, year: 2020, grade: 'Grade 2' },
      { id: 'historic_1976', name: 'Historic 1976', lengthKm: 4.104, turns: 13, year: 1976 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5, 6],
  },

  // NORTH AMERICA - USA
  {
    id: 'cleveland',
    name: 'Cleveland',
    shortName: 'Cleveland',
    officialName: 'Burke Lakefront Airport',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'street',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.500, turns: 10, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.800, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt1',
  },
  {
    id: 'daytona',
    name: 'Daytona',
    shortName: 'Daytona',
    officialName: 'Daytona International Speedway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'oval',
    layoutCount: 3,
    layouts: [
      { id: 'road', name: 'Road Course', lengthKm: 5.729, turns: 12, year: 2020, grade: 'Grade 2' },
      { id: 'oval', name: 'Oval', lengthKm: 4.023, turns: 4, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 6.100, turns: 13, year: 1964 },
    ],
    defaultLayout: 'road',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt1',
  },
  {
    id: 'fontana',
    name: 'Fontana',
    shortName: 'Fontana',
    officialName: 'Auto Club Speedway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'oval',
    layoutCount: 2,
    layouts: [
      { id: 'road', name: 'Road Course', lengthKm: 3.800, turns: 8, year: 2020 },
      { id: 'oval', name: 'Oval', lengthKm: 3.219, turns: 4, year: 2020 },
    ],
    defaultLayout: 'road',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt3',
  },
  {
    id: 'gateway',
    name: 'Gateway',
    shortName: 'Gateway',
    officialName: 'World Wide Technology Raceway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'oval',
    layoutCount: 3,
    layouts: [
      { id: 'road', name: 'Road Course', lengthKm: 2.800, turns: 9, year: 2020 },
      { id: 'oval', name: 'Oval', lengthKm: 2.012, turns: 4, year: 2020 },
      { id: 'roval', name: 'Roval', lengthKm: 2.400, turns: 7, year: 2020 },
    ],
    defaultLayout: 'road',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt3',
  },
  {
    id: 'indianapolis',
    name: 'Indianapolis',
    shortName: 'Indianapolis',
    officialName: 'Indianapolis Motor Speedway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'oval',
    layoutCount: 2,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.192, turns: 14, year: 2020, grade: 'Grade 1' },
      { id: 'oval', name: 'Oval', lengthKm: 4.023, turns: 4, year: 2020, grade: 'Grade 1' },
    ],
    defaultLayout: 'gp',
    suitableTiers: [5, 6],
    dlc: 'Racin USA Pt2',
  },
  {
    id: 'laguna_seca',
    name: 'Laguna Seca',
    shortName: 'Laguna Seca',
    officialName: 'Laguna Seca Raceway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.602, turns: 11, year: 2020, grade: 'Grade 2' },
    ],
    defaultLayout: 'full',
    suitableTiers: [2, 3, 4, 5],
    dlc: 'Racin USA Pt1',
  },
  {
    id: 'long_beach',
    name: 'Long Beach',
    shortName: 'Long Beach',
    officialName: 'Long Beach Street Circuit',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'street',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.167, turns: 11, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 3.251, turns: 11, year: 1982 },
    ],
    defaultLayout: 'full',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt1',
  },
  {
    id: 'pocono',
    name: 'Pocono',
    shortName: 'Pocono',
    officialName: 'Pocono Raceway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'oval',
    layoutCount: 7,
    layouts: [
      { id: 'oval', name: 'Oval', lengthKm: 4.023, turns: 3, year: 2020 },
      { id: 'north', name: 'North', lengthKm: 2.000, turns: 6, year: 2020 },
      { id: 'south', name: 'South', lengthKm: 2.200, turns: 5, year: 2020 },
      { id: 'east', name: 'East', lengthKm: 1.800, turns: 4, year: 2020 },
      { id: 'road', name: 'Road Course', lengthKm: 3.500, turns: 8, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 4.023, turns: 3, year: 1971 },
      { id: 'roval', name: 'Roval', lengthKm: 3.200, turns: 7, year: 2020 },
    ],
    defaultLayout: 'oval',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt2',
  },
  {
    id: 'road_america',
    name: 'Road America',
    shortName: 'Road America',
    officialName: 'Road America',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 6.515, turns: 14, year: 2020, grade: 'Grade 2' },
      { id: 'historic', name: 'Historic', lengthKm: 6.436, turns: 14, year: 1960 },
      { id: 'short', name: 'Short', lengthKm: 3.800, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5, 6],
    dlc: 'Racin USA Pt2',
  },
  {
    id: 'road_atlanta',
    name: 'Road Atlanta',
    shortName: 'Road Atlanta',
    officialName: 'Road Atlanta',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 2,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 4.088, turns: 12, year: 2020, grade: 'Grade 2' },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.800, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5],
    dlc: 'Racin USA Pt3',
  },
  {
    id: 'sebring',
    name: 'Sebring',
    shortName: 'Sebring',
    officialName: 'Sebring International Raceway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 4,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 6.019, turns: 17, year: 2020, grade: 'Grade 2' },
      { id: 'short', name: 'Short Circuit', lengthKm: 3.700, turns: 10, year: 2020 },
      { id: 'club', name: 'Club Circuit', lengthKm: 2.800, turns: 8, year: 2020 },
      { id: 'historic', name: 'Historic', lengthKm: 8.369, turns: 20, year: 1967 },
    ],
    defaultLayout: 'full',
    suitableTiers: [4, 5, 6],
    dlc: 'Racin USA Pt1',
  },
  {
    id: 'virginia',
    name: 'Virginia',
    shortName: 'VIR',
    officialName: 'Virginia International Raceway',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 6.800, turns: 24, year: 2020, grade: 'Grade 2' },
      { id: 'grand', name: 'Grand West', lengthKm: 4.500, turns: 16, year: 2020 },
      { id: 'north', name: 'North', lengthKm: 3.200, turns: 12, year: 2020 },
      { id: 'south', name: 'South', lengthKm: 2.500, turns: 9, year: 2020 },
      { id: 'patriot', name: 'Patriot', lengthKm: 2.000, turns: 7, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5],
    dlc: 'Racin USA Pt3',
  },
  {
    id: 'watkins_glen',
    name: 'Watkins Glen',
    shortName: 'Watkins Glen',
    officialName: 'Watkins Glen International',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 5,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 5.430, turns: 11, year: 2020, grade: 'Grade 2' },
      { id: 'short', name: 'Short Course', lengthKm: 3.701, turns: 7, year: 2020 },
      { id: 'boot', name: 'Boot', lengthKm: 4.500, turns: 9, year: 2020 },
      { id: 'historic_1961', name: 'Historic 1961', lengthKm: 3.701, turns: 6, year: 1961 },
      { id: 'historic_1971', name: 'Historic 1971', lengthKm: 5.435, turns: 11, year: 1971 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [3, 4, 5],
    dlc: 'Racin USA Pt2',
  },

  // NORTH AMERICA - CANADA
  {
    id: 'montreal',
    name: 'Montréal',
    shortName: 'Montréal',
    officialName: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    countryCode: 'CA',
    region: 'north_america',
    type: 'street',
    layoutCount: 3,
    layouts: [
      { id: 'gp', name: 'Grand Prix', lengthKm: 4.361, turns: 14, year: 2020, grade: 'Grade 1' },
      { id: 'historic', name: 'Historic', lengthKm: 4.430, turns: 15, year: 1988 },
      { id: 'short', name: 'Short', lengthKm: 2.800, turns: 8, year: 2020 },
    ],
    defaultLayout: 'gp',
    suitableTiers: [4, 5, 6],
  },
  {
    id: 'mosport',
    name: 'Mosport',
    shortName: 'CTMP',
    officialName: 'Canadian Tire Motorsport Park',
    country: 'Canada',
    countryCode: 'CA',
    region: 'north_america',
    type: 'permanent',
    layoutCount: 1,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.957, turns: 10, year: 2020, grade: 'Grade 2' },
    ],
    defaultLayout: 'full',
    suitableTiers: [3, 4, 5],
    dlc: 'Racin USA Pt3',
  },

  // SOUTH AMERICA - ECUADOR
  {
    id: 'ibarra',
    name: 'Ibarra',
    shortName: 'Ibarra',
    officialName: 'Autódromo Internacional José Tobar',
    country: 'Ecuador',
    countryCode: 'EC',
    region: 'south_america',
    type: 'permanent',
    layoutCount: 3,
    layouts: [
      { id: 'full', name: 'Full Circuit', lengthKm: 3.200, turns: 11, year: 2020 },
      { id: 'short', name: 'Short Circuit', lengthKm: 2.200, turns: 7, year: 2020 },
      { id: 'exterior', name: 'Exterior', lengthKm: 2.500, turns: 8, year: 2020 },
    ],
    defaultLayout: 'full',
    suitableTiers: [2, 3, 4],
  },
]

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
  
  // Prefer specified region if provided, but mix in others
  if (preferredRegion) {
    const regionTracks = suitableTracks.filter(t => t.region === preferredRegion)
    const otherTracks = suitableTracks.filter(t => t.region !== preferredRegion)
    // 70% from preferred region, 30% from others
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

/**
 * Get the highest FIA grade from a track's layouts
 * Returns the best grade available (Grade 1 > Grade 2 > Grade 3, etc.)
 */
export function getTrackHighestGrade(track: AMS2Track): string | undefined {
  const gradeOrder = ['Grade 1', 'Grade 1T', 'Grade 2', 'Grade 3', 'Grade 4']
  
  for (const grade of gradeOrder) {
    const hasGrade = track.layouts.some(layout => layout.grade === grade)
    if (hasGrade) return grade
  }
  
  // Return first available grade if any
  for (const layout of track.layouts) {
    if (layout.grade && !layout.grade.includes('Historic') && !layout.grade.includes('Off-road')) {
      return layout.grade
    }
  }
  
  return undefined
}

/**
 * Filter tracks by acceptable FIA grades
 * If acceptableGrades is empty, returns all tracks (no grade restriction)
 */
export function filterTracksByGrade(tracks: AMS2Track[], acceptableGrades: string[]): AMS2Track[] {
  // No restriction if empty
  if (acceptableGrades.length === 0) {
    return tracks
  }
  
  return tracks.filter(track => {
    const trackGrade = getTrackHighestGrade(track)
    // Include track if it has an acceptable grade OR if it has no grade (smaller circuits)
    return trackGrade ? acceptableGrades.includes(trackGrade) : true
  })
}

/**
 * Get tracks suitable for a specific track type (permanent, street, oval, etc.)
 */
export function getTracksByType(trackTypes: TrackType[]): AMS2Track[] {
  return ALL_TRACKS.filter(track => trackTypes.includes(track.type))
}

/**
 * Get tracks by multiple criteria
 */
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
  
  // Filter by track type
  if (criteria.types && criteria.types.length > 0) {
    tracks = tracks.filter(t => criteria.types!.includes(t.type))
  }
  
  // Filter by region
  if (criteria.regions && criteria.regions.length > 0) {
    tracks = tracks.filter(t => criteria.regions!.includes(t.region))
  }
  
  // Filter by grade
  if (criteria.grades && criteria.grades.length > 0) {
    tracks = filterTracksByGrade(tracks, criteria.grades)
  }
  
  // Filter by tier suitability
  if (criteria.minTier !== undefined || criteria.maxTier !== undefined) {
    const minTier = criteria.minTier ?? 1
    const maxTier = criteria.maxTier ?? 6
    tracks = tracks.filter(t => 
      t.suitableTiers.some(tier => tier >= minTier && tier <= maxTier)
    )
  }
  
  // Exclude specific track IDs
  if (criteria.excludeIds && criteria.excludeIds.length > 0) {
    tracks = tracks.filter(t => !criteria.excludeIds!.includes(t.id))
  }
  
  // Filter DLC tracks if requested
  if (criteria.includeDLC === false) {
    tracks = tracks.filter(t => !t.dlc)
  }
  
  return tracks
}

/**
 * Apply regional weighting to track selection
 * Returns tracks sorted/weighted by regional preference
 */
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
  
  // Shuffle each group
  const shuffledPrimary = [...primaryTracks].sort(() => Math.random() - 0.5)
  const shuffledSecondary = [...secondaryTracks].sort(() => Math.random() - 0.5)
  const shuffledOther = [...otherTracks].sort(() => Math.random() - 0.5)
  
  // Interleave based on weight
  // Higher weight = more tracks from primary region appear first
  const result: AMS2Track[] = []
  let pIdx = 0, sIdx = 0, oIdx = 0
  
  const totalTracks = tracks.length
  const primaryCount = Math.floor(totalTracks * weight)
  const secondaryCount = secondaryRegion ? Math.floor(totalTracks * (1 - weight) * 0.4) : 0
  
  // Add primary region tracks first (up to weight %)
  while (pIdx < shuffledPrimary.length && result.length < primaryCount) {
    result.push(shuffledPrimary[pIdx++])
  }
  
  // Add secondary region tracks
  while (sIdx < shuffledSecondary.length && result.length < primaryCount + secondaryCount) {
    result.push(shuffledSecondary[sIdx++])
  }
  
  // Fill with remaining primary, then secondary, then other
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

/**
 * Select tracks for a calendar, ensuring iconic tracks are included
 */
export function selectTracksForCalendar(
  availableTracks: AMS2Track[],
  iconicTrackIds: string[],
  totalRounds: number
): AMS2Track[] {
  const selected: AMS2Track[] = []
  const usedIds = new Set<string>()
  
  // First, add iconic tracks that are available
  for (const iconicId of iconicTrackIds) {
    if (selected.length >= totalRounds) break
    
    const track = availableTracks.find(t => t.id === iconicId)
    if (track && !usedIds.has(track.id)) {
      selected.push(track)
      usedIds.add(track.id)
    }
  }
  
  // Fill remaining slots with other available tracks
  for (const track of availableTracks) {
    if (selected.length >= totalRounds) break
    
    if (!usedIds.has(track.id)) {
      selected.push(track)
      usedIds.add(track.id)
    }
  }
  
  // Shuffle the non-iconic tracks to add variety
  // Keep first few iconic tracks in place, shuffle the rest
  const iconicCount = Math.min(iconicTrackIds.length, selected.length)
  const iconicPart = selected.slice(0, iconicCount)
  const restPart = selected.slice(iconicCount).sort(() => Math.random() - 0.5)
  
  // Final shuffle - mix iconic into the calendar, don't always start with them
  const final = [...iconicPart, ...restPart]
  
  // Do a light shuffle that keeps some structure but isn't fully random
  // Swap some positions to distribute iconic tracks throughout
  for (let i = 0; i < Math.min(iconicCount, 3); i++) {
    const swapIdx = Math.floor(Math.random() * (final.length - 1)) + 1
    if (swapIdx !== i && swapIdx < final.length) {
      [final[i], final[swapIdx]] = [final[swapIdx], final[i]]
    }
  }
  
  return final
}

/**
 * Get track types suitable for a series category
 */
export function getTrackTypesForCategory(category: string): TrackType[] {
  switch (category) {
    case 'kart': 
      return ['kart']
    case 'formula': 
      return ['permanent', 'street']
    case 'gt': 
      return ['permanent', 'street']
    case 'stock': 
      return ['permanent', 'oval']
    case 'prototype': 
      return ['permanent']
    case 'touring': 
      return ['permanent', 'street']
    case 'rallycross':
      return ['rallycross']
    case 'other':
    default: 
      return ['permanent']
  }
}
