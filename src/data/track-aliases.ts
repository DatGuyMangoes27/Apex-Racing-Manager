/**
 * Track Name Alias System
 * 
 * Maps various track name variations (from AMS2 telemetry, user input, etc.)
 * to canonical track IDs for consistent historical tracking.
 * 
 * The canonical ID matches the `id` field in ams2-tracks.ts
 */

// Type for track alias entries
export interface TrackAliasEntry {
  canonicalId: string
  canonicalName: string
  aliases: string[]
}

/**
 * Master list of track aliases organized by canonical ID
 */
export const TRACK_ALIAS_REGISTRY: TrackAliasEntry[] = [
  // ============================================
  // AUSTRALIA
  // ============================================
  {
    canonicalId: 'adelaide',
    canonicalName: 'Adelaide',
    aliases: [
      'Adelaide Street Circuit',
      'Adelaide 2020',
      'Adelaide STT',
      'Adelaide Historic',
      'Adelaide Historic 1988',
    ]
  },
  {
    canonicalId: 'bathurst',
    canonicalName: 'Bathurst',
    aliases: [
      'Mount Panorama Circuit',
      'Mount Panorama',
      'Bathurst 1000',
      'Bathurst Full Circuit',
      'The Mountain',
    ]
  },

  // ============================================
  // BRAZIL
  // ============================================
  {
    canonicalId: 'ascurra',
    canonicalName: 'Ascurra',
    aliases: [
      'Autódromo Max Mohr',
      'Autodromo Max Mohr',
      'Ascurra Dirt',
      'Ascurra RX',
    ]
  },
  {
    canonicalId: 'brasilia',
    canonicalName: 'Brasília',
    aliases: [
      'Brasilia',
      'Autódromo Brasília BRB',
      'Autodromo Brasilia BRB',
      'Brasília Short',
    ]
  },
  {
    canonicalId: 'campo_grande',
    canonicalName: 'Campo Grande',
    aliases: [
      'Autódromo Internacional Orlando Moura',
      'Autodromo Internacional Orlando Moura',
      'Campo Grande Circuit',
    ]
  },
  {
    canonicalId: 'cascavel',
    canonicalName: 'Cascavel',
    aliases: [
      'Autódromo Internacional Zilmar Beux de Cascavel',
      'Autodromo Internacional Zilmar Beux de Cascavel',
      'Cascavel Circuit',
    ]
  },
  {
    canonicalId: 'curitiba',
    canonicalName: 'Curitiba',
    aliases: [
      'Autódromo Internacional de Curitiba',
      'Autodromo Internacional de Curitiba',
      'Curitiba Short',
    ]
  },
  {
    canonicalId: 'curvelo',
    canonicalName: 'Curvelo',
    aliases: [
      'Circuito dos Cristais',
      'Curvelo Short',
    ]
  },
  {
    canonicalId: 'foz',
    canonicalName: 'Foz do Iguaçu',
    aliases: [
      'Foz',
      'Foz do Iguacu',
      'X Games Foz do Iguaçu Rallycross',
      'X Games Foz do Iguacu Rallycross',
    ]
  },
  {
    canonicalId: 'galeao',
    canonicalName: 'Galeão Airport',
    aliases: [
      'Galeao',
      'Galeao Airport',
      'Cacá Bueno Circuit',
      'Caca Bueno Circuit',
      'Galeão',
    ]
  },
  {
    canonicalId: 'goiania',
    canonicalName: 'Goiânia',
    aliases: [
      'Goiania',
      'Autódromo Internacional Ayrton Senna (Goiânia)',
      'Autodromo Internacional Ayrton Senna Goiania',
      'Goiania Ayrton Senna',
      'Goiânia Short',
      'Goiânia Exterior',
    ]
  },
  {
    canonicalId: 'granja_viana',
    canonicalName: 'Granja Viana',
    aliases: [
      'Kartódromo Internacional da Granja Viana',
      'Kartodromo Internacional da Granja Viana',
      'Granja Viana Kart',
    ]
  },
  {
    canonicalId: 'guapore',
    canonicalName: 'Guaporé',
    aliases: [
      'Guapore',
      'Autódromo Internacional de Guaporé',
      'Autodromo Internacional de Guapore',
      'Guaporé Short',
    ]
  },
  {
    canonicalId: 'interlagos',
    canonicalName: 'Interlagos',
    aliases: [
      'Autódromo José Carlos Pace',
      'Autodromo Jose Carlos Pace',
      'José Carlos Pace',
      'Jose Carlos Pace',
      'São Paulo',
      'Sao Paulo',
      'Brazilian Grand Prix',
      'Brazil GP',
      'Interlagos GP',
      'Interlagos Grand Prix',
      'Interlagos Short',
      'Interlagos Historic',
      'Interlagos Historic 1976',
      'Interlagos Historic 1979',
      'Interlagos Kart',
      'Interlagos Moto',
      'Interlagos Stock',
      'Interlagos Classic',
      'Interlagos Outer',
    ]
  },
  {
    canonicalId: 'jacarepagua',
    canonicalName: 'Jacarepaguá',
    aliases: [
      'Jacarepagua',
      'Autódromo Internacional Nelson Piquet',
      'Autodromo Internacional Nelson Piquet',
      'Nelson Piquet Circuit',
      'Rio de Janeiro',
      'Jacarepaguá GP',
      'Jacarepaguá Oval',
      'Jacarepaguá Roval',
    ]
  },
  {
    canonicalId: 'londrina',
    canonicalName: 'Londrina',
    aliases: [
      'Autódromo Internacional Ayrton Senna (Londrina)',
      'Autodromo Internacional Ayrton Senna Londrina',
      'Londrina Ayrton Senna',
      'Londrina Short',
      'Londrina Historic',
    ]
  },
  {
    canonicalId: 'salvador',
    canonicalName: 'Salvador',
    aliases: [
      'Circuito Ayrton Senna',
      'Salvador Street Circuit',
    ]
  },
  {
    canonicalId: 'santa_cruz',
    canonicalName: 'Santa Cruz do Sul',
    aliases: [
      'Santa Cruz',
      'Autódromo Internacional de Santa Cruz do Sul',
      'Autodromo Internacional de Santa Cruz do Sul',
    ]
  },
  {
    canonicalId: 'speedland',
    canonicalName: 'Speedland',
    aliases: [
      'Speedland Kart Center',
      'Speedland Kart',
      'Speedland Short',
    ]
  },
  {
    canonicalId: 'taruma',
    canonicalName: 'Tarumã',
    aliases: [
      'Taruma',
      'Autódromo Internacional de Tarumã',
      'Autodromo Internacional de Taruma',
      'Tarumã Internacional',
      'Tarumã Short',
    ]
  },
  {
    canonicalId: 'velo_citta',
    canonicalName: 'Velo Città',
    aliases: [
      'Velo Citta',
      'Autódromo Velo Città',
      'Autodromo Velo Citta',
      'Velo Città Short',
      'Velo Città Exterior',
    ]
  },
  {
    canonicalId: 'velopark',
    canonicalName: 'Velopark',
    aliases: [
      'Velopark Circuit',
      'Velopark Short',
      'Velopark Exterior',
    ]
  },

  // ============================================
  // ARGENTINA
  // ============================================
  {
    canonicalId: 'buenos_aires',
    canonicalName: 'Buenos Aires',
    aliases: [
      'Autódromo Oscar y Juan Gálvez',
      'Autodromo Oscar y Juan Galvez',
      'Oscar y Juan Gálvez',
      'Galvez',
      'Argentine Grand Prix',
      'Argentina GP',
      'Buenos Aires GP',
      'Buenos Aires No. 6',
      'Buenos Aires No. 8',
      'Buenos Aires No. 9',
      'Buenos Aires No. 12',
      'Buenos Aires No. 15',
      'Buenos Aires Historic',
    ]
  },
  {
    canonicalId: 'cordoba',
    canonicalName: 'Córdoba',
    aliases: [
      'Cordoba',
      'Autódromo Oscar Cabalén',
      'Autodromo Oscar Cabalen',
      'Oscar Cabalén',
      'Córdoba Short',
      'Córdoba Historic',
    ]
  },
  {
    canonicalId: 'termas',
    canonicalName: 'Termas de Río Hondo',
    aliases: [
      'Termas',
      'Termas de Rio Hondo',
      'Autódromo Termas de Río Hondo',
      'Autodromo Termas de Rio Hondo',
      'Argentina MotoGP',
    ]
  },

  // ============================================
  // UNITED KINGDOM
  // ============================================
  {
    canonicalId: 'brands_hatch',
    canonicalName: 'Brands Hatch',
    aliases: [
      'Brands',
      'Brands Hatch GP',
      'Brands Hatch Grand Prix',
      'Brands Hatch Indy',
    ]
  },
  {
    canonicalId: 'cadwell_park',
    canonicalName: 'Cadwell Park',
    aliases: [
      'Cadwell',
      'Cadwell Full',
    ]
  },
  {
    canonicalId: 'donington',
    canonicalName: 'Donington Park',
    aliases: [
      'Donington',
      'Donington GP',
      'Donington Grand Prix',
      'Donington National',
    ]
  },
  {
    canonicalId: 'oulton_park',
    canonicalName: 'Oulton Park',
    aliases: [
      'Oulton',
      'Oulton Park International',
      'Oulton Park Island',
      'Oulton Park Fosters',
      'Oulton Park Historic',
    ]
  },
  {
    canonicalId: 'silverstone',
    canonicalName: 'Silverstone',
    aliases: [
      'Silverstone Circuit',
      'British Grand Prix',
      'British GP',
      'Silverstone GP',
      'Silverstone Grand Prix',
      'Silverstone International',
      'Silverstone National',
      'Silverstone Historic',
      'Silverstone Historic 1975',
      'Silverstone Historic 1991',
      'Silverstone Arena',
      'Silverstone Bridge',
      'Silverstone Stowe',
      'Silverstone STT',
    ]
  },
  {
    canonicalId: 'snetterton',
    canonicalName: 'Snetterton',
    aliases: [
      'Snetterton Circuit',
      'Snetterton 300',
      'Snetterton 200',
      'Snetterton 100',
    ]
  },

  // ============================================
  // GERMANY
  // ============================================
  {
    canonicalId: 'hockenheim',
    canonicalName: 'Hockenheim',
    aliases: [
      'Hockenheimring',
      'Hockenheimring Baden-Württemberg',
      'Hockenheimring Baden-Wurttemberg',
      'German Grand Prix',
      'Germany GP',
      'Hockenheim GP',
      'Hockenheim National',
      'Hockenheim Historic',
      'Hockenheim Historic 1988',
      'Hockenheim Historic 2001',
      'Hockenheim Short',
      'Hockenheim Club',
      'Hockenheim STT',
    ]
  },
  {
    canonicalId: 'nurburgring',
    canonicalName: 'Nürburgring',
    aliases: [
      'Nurburgring',
      'Nuerburgring',
      'Nordschleife',
      'Green Hell',
      'The Green Hell',
      'Nürburgring Nordschleife',
      'Nurburgring Nordschleife',
      'Nürburgring GP',
      'Nurburgring GP',
      'Nürburgring Grand Prix',
      'Nürburgring 24h',
      'Nürburgring 24 Hours',
      'N24',
      'Nürburgring Combined',
      'Nurburgring Combined',
      'Nürburgring Sprint',
      'Nürburgring Historic',
    ]
  },

  // ============================================
  // ITALY
  // ============================================
  {
    canonicalId: 'imola',
    canonicalName: 'Imola',
    aliases: [
      'Autodromo Internazionale Enzo e Dino Ferrari',
      'Autodromo Enzo e Dino Ferrari',
      'Enzo e Dino Ferrari',
      'San Marino Grand Prix',
      'San Marino GP',
      'Emilia Romagna Grand Prix',
      'Emilia Romagna GP',
      'Imola GP',
      'Imola Historic',
    ]
  },
  {
    canonicalId: 'monza',
    canonicalName: 'Monza',
    aliases: [
      'Autodromo Nazionale Monza',
      'Autodromo Nazionale di Monza',
      'Temple of Speed',
      'Italian Grand Prix',
      'Italy GP',
      'Italian GP',
      'Monza GP',
      'Monza Grand Prix',
      'Monza Historic',
      'Monza Junior',
      'Monza Historic 1966',
      'Monza Historic 1971',
      'Monza Oval',
    ]
  },
  {
    canonicalId: 'ortona',
    canonicalName: 'Ortona',
    aliases: [
      "Circuito Internazionale d'Abruzzo",
      'Circuito Internazionale di Abruzzo',
      'Abruzzo',
    ]
  },

  // ============================================
  // BELGIUM
  // ============================================
  {
    canonicalId: 'spa',
    canonicalName: 'Spa-Francorchamps',
    aliases: [
      'Spa',
      'Circuit de Spa-Francorchamps',
      'Spa Francorchamps',
      'Belgian Grand Prix',
      'Belgium GP',
      'Spa GP',
      'Spa 24h',
      'Spa 24 Hours',
      '24 Hours of Spa',
      'Spa Historic',
      'Spa Short',
      'Spa Endurance',
    ]
  },

  // ============================================
  // SPAIN
  // ============================================
  {
    canonicalId: 'barcelona',
    canonicalName: 'Barcelona',
    aliases: [
      'Circuit de Barcelona-Catalunya',
      'Circuit de Catalunya',
      'Catalunya',
      'Catalonia',
      'Spanish Grand Prix',
      'Spain GP',
      'Spanish GP',
      'Barcelona-Catalunya',
      'Barcelona GP',
      'Barcelona National',
      'Barcelona Moto',
    ]
  },
  {
    canonicalId: 'jerez',
    canonicalName: 'Jerez',
    aliases: [
      'Circuito de Jerez – Ángel Nieto',
      'Circuito de Jerez Angel Nieto',
      'Circuito de Jerez',
      'Ángel Nieto',
      'Angel Nieto',
      'Jerez GP',
      'Jerez Short',
    ]
  },

  // ============================================
  // AUSTRIA
  // ============================================
  {
    canonicalId: 'spielberg',
    canonicalName: 'Spielberg',
    aliases: [
      'Red Bull Ring',
      'A1-Ring',
      'A1 Ring',
      'Österreichring',
      'Osterreichring',
      'Austrian Grand Prix',
      'Austria GP',
      'Spielberg GP',
      'Red Bull Ring Short',
      'Red Bull Ring National',
    ]
  },

  // ============================================
  // PORTUGAL
  // ============================================
  {
    canonicalId: 'estoril',
    canonicalName: 'Estoril',
    aliases: [
      'Circuito do Estoril',
      'Autódromo do Estoril',
      'Autodromo do Estoril',
      'Portuguese Grand Prix',
      'Portugal GP',
      'Estoril GP',
      'Estoril Short',
    ]
  },

  // ============================================
  // FRANCE
  // ============================================
  {
    canonicalId: 'le_mans',
    canonicalName: 'Le Mans',
    aliases: [
      'Circuit des 24 Heures du Mans',
      'Circuit de la Sarthe',
      'La Sarthe',
      '24 Heures du Mans',
      '24 Hours of Le Mans',
      '24h Le Mans',
      '24h of Le Mans',
      'Le Mans 24h',
      'Le Mans 24 Hours',
      'French Grand Prix',
      'France GP',
      'Le Mans GP',
      'Le Mans Bugatti',
      'Bugatti Circuit',
    ]
  },

  // ============================================
  // MONACO
  // ============================================
  {
    canonicalId: 'monaco',
    canonicalName: 'Monaco',
    aliases: [
      'Circuit de Monaco',
      'Monte Carlo',
      'Monte-Carlo',
      'Monaco Grand Prix',
      'Monaco GP',
      'Monaco Street Circuit',
    ]
  },

  // ============================================
  // FINLAND
  // ============================================
  {
    canonicalId: 'tykki',
    canonicalName: 'Tykki',
    aliases: [
      'Kouvola Circuit',
      'Kouvola',
      'Tykki RX',
      'Tykki Rallycross',
    ]
  },

  // ============================================
  // NORWAY
  // ============================================
  {
    canonicalId: 'buskerud',
    canonicalName: 'Buskerud',
    aliases: [
      'Buskerud RX',
      'Buskerud Rallycross',
      'Hell',
      'Hell Rallycross',
    ]
  },

  // ============================================
  // JAPAN
  // ============================================
  {
    canonicalId: 'suzuka',
    canonicalName: 'Suzuka',
    aliases: [
      'Suzuka International Racing Course',
      'Suzuka Circuit',
      'Japanese Grand Prix',
      'Japan GP',
      'Suzuka GP',
      'Suzuka 1000km',
      'Suzuka East',
      'Suzuka West',
    ]
  },

  // ============================================
  // SOUTH AFRICA
  // ============================================
  {
    canonicalId: 'kyalami',
    canonicalName: 'Kyalami',
    aliases: [
      'Kyalami Grand Prix Circuit',
      'Kyalami Racing Circuit',
      'South African Grand Prix',
      'South Africa GP',
      'Kyalami GP',
      'Kyalami Historic',
      'Kyalami 9 Hours',
    ]
  },

  // ============================================
  // UNITED STATES
  // ============================================
  {
    canonicalId: 'cleveland',
    canonicalName: 'Cleveland',
    aliases: [
      'Burke Lakefront Airport',
      'Burke Lakefront',
      'Cleveland Street Circuit',
    ]
  },
  {
    canonicalId: 'daytona',
    canonicalName: 'Daytona',
    aliases: [
      'Daytona International Speedway',
      'Daytona 24',
      'Daytona 24h',
      '24 Hours of Daytona',
      '24h of Daytona',
      'Daytona 500',
      'Rolex 24',
      'Rolex 24 at Daytona',
      'Daytona Road Course',
      'Daytona Oval',
      'Daytona Tri-Oval',
      'Daytona Roval',
      'Daytona Speedway',
    ]
  },
  {
    canonicalId: 'fontana',
    canonicalName: 'Fontana',
    aliases: [
      'Auto Club Speedway',
      'California Speedway',
      'Fontana Speedway',
      'Fontana Oval',
      'Fontana Roval',
    ]
  },
  {
    canonicalId: 'gateway',
    canonicalName: 'Gateway',
    aliases: [
      'World Wide Technology Raceway',
      'Gateway Motorsports Park',
      'St. Louis',
      'Gateway Oval',
      'Gateway Road Course',
    ]
  },
  {
    canonicalId: 'indianapolis',
    canonicalName: 'Indianapolis',
    aliases: [
      'Indianapolis Motor Speedway',
      'Indy',
      'IMS',
      'The Brickyard',
      'Brickyard',
      'Indianapolis 500',
      'Indy 500',
      'Indy500',
      'Indianapolis GP',
      'Indy GP',
      'Indianapolis Road Course',
      'Indianapolis Oval',
      'Indy Oval',
      'United States Grand Prix',
      'US Grand Prix',
      'US GP',
      'USGP',
    ]
  },
  {
    canonicalId: 'laguna_seca',
    canonicalName: 'Laguna Seca',
    aliases: [
      'Laguna Seca Raceway',
      'WeatherTech Raceway Laguna Seca',
      'Mazda Raceway Laguna Seca',
      'Monterey',
      'The Corkscrew',
      'Laguna',
    ]
  },
  {
    canonicalId: 'long_beach',
    canonicalName: 'Long Beach',
    aliases: [
      'Long Beach Street Circuit',
      'Streets of Long Beach',
      'Long Beach Grand Prix',
      'Long Beach GP',
    ]
  },
  {
    canonicalId: 'pocono',
    canonicalName: 'Pocono',
    aliases: [
      'Pocono Raceway',
      'Tricky Triangle',
      'Pocono Oval',
      'Pocono Road Course',
    ]
  },
  {
    canonicalId: 'road_america',
    canonicalName: 'Road America',
    aliases: [
      'Elkhart Lake',
      'America\'s National Park of Speed',
    ]
  },
  {
    canonicalId: 'road_atlanta',
    canonicalName: 'Road Atlanta',
    aliases: [
      'Road Atlanta',
      'Petit Le Mans',
      'Road Atlanta Moto',
    ]
  },
  {
    canonicalId: 'mosport',
    canonicalName: 'Mosport',
    aliases: [
      'CTMP',
      'Canadian Tire Motorsport Park',
      'Mosport Park',
    ]
  },
  {
    canonicalId: 'sebring',
    canonicalName: 'Sebring',
    aliases: [
      'Sebring International Raceway',
      '12 Hours of Sebring',
      'Sebring 12h',
      'Sebring 12 Hours',
      '12h of Sebring',
      'Sebring Full',
      'Sebring Short',
      'Sebring Club',
    ]
  },
  {
    canonicalId: 'virginia',
    canonicalName: 'Virginia',
    aliases: [
      'VIR',
      'Virginia International Raceway',
      'VIR Full',
      'VIR Grand',
      'VIR North',
      'VIR South',
      'VIR Patriot',
    ]
  },
  {
    canonicalId: 'watkins_glen',
    canonicalName: 'Watkins Glen',
    aliases: [
      'Watkins Glen International',
      'The Glen',
      'Watkins Glen Full',
      'Watkins Glen Short',
      'Watkins Glen Boot',
      '6 Hours of Watkins Glen',
      'United States Grand Prix (Watkins Glen)',
    ]
  },

  // ============================================
  // CANADA
  // ============================================
  {
    canonicalId: 'montreal',
    canonicalName: 'Montréal',
    aliases: [
      'Montreal',
      'Circuit Gilles Villeneuve',
      'Gilles Villeneuve',
      'Ile Notre-Dame',
      'Canadian Grand Prix',
      'Canada GP',
      'Montreal GP',
    ]
  },
  // ============================================
  // ECUADOR
  // ============================================
  {
    canonicalId: 'ibarra',
    canonicalName: 'Ibarra',
    aliases: [
      'Autódromo Internacional José Tobar',
      'Autodromo Internacional Jose Tobar',
      'José Tobar',
      'Jose Tobar',
    ]
  },
]

/**
 * Flattened lookup map for O(1) alias resolution
 * Key: lowercase alias, Value: canonical track ID
 */
export const TRACK_ALIAS_MAP: Record<string, string> = {}

// Build the lookup map from the registry
TRACK_ALIAS_REGISTRY.forEach(entry => {
  // Add the canonical ID and name as self-references
  TRACK_ALIAS_MAP[entry.canonicalId.toLowerCase()] = entry.canonicalId
  TRACK_ALIAS_MAP[entry.canonicalName.toLowerCase()] = entry.canonicalId
  
  // Add all aliases
  entry.aliases.forEach(alias => {
    TRACK_ALIAS_MAP[alias.toLowerCase()] = entry.canonicalId
  })
})

/**
 * Normalize a track name from telemetry or user input to a canonical ID
 * 
 * @param trackName - Raw track name from any source
 * @returns Canonical track ID or a generated ID if no match found
 */
export function normalizeTrackName(trackName: string): string {
  if (!trackName) return 'unknown'
  
  // First, try exact match (case-insensitive)
  const normalized = trackName.toLowerCase().trim()
  if (TRACK_ALIAS_MAP[normalized]) {
    return TRACK_ALIAS_MAP[normalized]
  }
  
  // Try removing common suffixes/prefixes
  const cleanedVariants = [
    normalized,
    normalized.replace(/\s*(gp|grand prix|circuit|raceway|speedway|international)\s*/gi, ' ').trim(),
    normalized.replace(/\s*(full|short|historic|national|club)\s*/gi, ' ').trim(),
    normalized.replace(/\s*\d{4}\s*/g, ' ').trim(), // Remove years
    normalized.replace(/[-_]/g, ' ').trim(),
    normalized.replace(/\s+/g, ' ').trim(),
  ]
  
  for (const variant of cleanedVariants) {
    if (TRACK_ALIAS_MAP[variant]) {
      return TRACK_ALIAS_MAP[variant]
    }
  }
  
  // Try partial match (check if any alias contains the input or vice versa)
  const aliasEntries = Object.entries(TRACK_ALIAS_MAP)
  for (const [alias, canonicalId] of aliasEntries) {
    if (alias.includes(normalized) || normalized.includes(alias)) {
      return canonicalId
    }
  }
  
  // No match found - generate a fallback ID
  console.warn(`[TrackAliases] No match found for track: "${trackName}", generating fallback ID`)
  return trackName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

/**
 * Get the canonical display name for a track ID
 * 
 * @param trackId - Canonical track ID
 * @returns Display name or the ID if not found
 */
export function getTrackDisplayName(trackId: string): string {
  const entry = TRACK_ALIAS_REGISTRY.find(e => e.canonicalId === trackId)
  return entry?.canonicalName || trackId
}

/**
 * Check if a track name/ID is recognized in the system
 */
export function isKnownTrack(trackNameOrId: string): boolean {
  return TRACK_ALIAS_MAP[trackNameOrId.toLowerCase()] !== undefined
}

/**
 * Get all aliases for a given canonical track ID
 */
export function getTrackAliases(canonicalId: string): string[] {
  const entry = TRACK_ALIAS_REGISTRY.find(e => e.canonicalId === canonicalId)
  return entry ? [entry.canonicalName, ...entry.aliases] : []
}








