/**
 * Image Utilities for AMS2 Career Mode
 * Maps car classes and tracks to their corresponding image files
 * Supports both folder-based and flat file organization
 */

// Import the generated manifest
import imageManifest from '@/data/image-manifest.json'

// Type the manifest properly
interface ImageManifest {
  generatedAt: string
  cars: Record<string, string[]>
  flat: string[]
  tracks: string[]
}

const manifest = imageManifest as ImageManifest

// Get base URL from Vite (will be './' in production Electron builds)
const BASE_URL = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/')

// Debug: Log manifest stats on module load
console.log('[Images] Manifest loaded:')
console.log('[Images] - Car folders:', Object.keys(manifest.cars).length)
console.log('[Images] - Flat files:', manifest.flat?.length || 0)
console.log('[Images] - Tracks:', manifest.tracks?.length || 0)
if (Object.keys(manifest.cars).length > 0) {
  console.log('[Images] - Sample folder:', Object.keys(manifest.cars)[0])
}
if (manifest.flat && manifest.flat.length > 0) {
  console.log('[Images] - Sample flat files:', manifest.flat.slice(0, 3))
}

function buildCarImagePath(file: string, folder?: string): string {
  // Use full encodeURIComponent for consistent encoding
  // This encodes spaces (%20), hash (%23), and other special chars
  // The browser will send this as-is, and the server should decode properly
  let path: string
  if (folder) {
    path = `${BASE_URL}images/cars/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`
  } else {
    path = `${BASE_URL}images/cars/${encodeURIComponent(file)}`
  }
  // Debug first time this is called
  if (!buildCarImagePath._logged) {
    console.log(`[Images] buildCarImagePath example:`)
    console.log(`  - Input file: "${file}"`)
    console.log(`  - Output path: "${path}"`)
    buildCarImagePath._logged = true
  }
  return path
}
// Add property for debug logging
buildCarImagePath._logged = false

// ============================================
// LIVERY-TO-CLASS PATTERN MATCHING
// ============================================

// Patterns to match flat livery filenames to car class IDs
// Order matters - more specific patterns should come first
const LIVERY_CLASS_PATTERNS: [string, string[]][] = [
  // GT3 cars (most specific first)
  ['gt3-gen2', ['GT3 Evo', 'GT3 evo II', 'GT3 EVO']],
  ['gt3', ['GT3', 'GTR Nismo', 'GT-R Nismo', 'NSX GT3', '488 GT3', '720S GT3', 'R8 LMS GT3', 'AMG GT3', 'M4 GT3', 'Vantage GT3', '911 GT3 R']],
  
  // GT4 cars
  ['gt4', ['GT4', 'A110 GT4', 'AMR GT4', 'Cayman GT4', 'M4 GT4', 'R8 LMS GT4']],
  
  // GTE cars
  ['gte', ['GTE', 'RSR GTE', '488 GTE', 'Vantage GTE', '911 RSR', 'Corvette C8.R', 'M8 GTE']],
  
  // Hypercar / LMDh / GTP
  ['lmdh-gtp', ['LMDh', 'GTP', 'M Hybrid V8', '963', '499P', 'Cadillac V-Series.R', 'LMDH']],
  ['hypercar', ['Hypercar', 'A424', '9X8', 'GR010', 'Toyota GR010', 'Glickenhaus', 'SCG 007']],
  
  // LMP / Prototype
  ['p1-gen2', ['P1 Gen2', 'P1Gen2']],
  ['p1-gen1', ['P1 ']],
  ['lmp2-gen2', ['LMP2', 'Oreca 07', 'Dallara P217', 'Ligier JS P2']],
  ['lmp1-2005', ['LMP1', 'R15', 'R18', '908']],
  ['dpi', ['DPi', 'Cadillac DPi', 'Mazda DPi', 'Acura DPi']],
  
  // One-make series
  ['carrera-cup', ['GT3 Cup', '911 GT3 Cup', 'Porsche Cup']],
  ['super-trofeo', ['Super Trofeo', 'Huracan ST', 'Huracán ST', 'ST EVO']],
  ['ginetta-g55-supercup', ['G55', 'Ginetta G55']],
  ['caterham-620r', ['620R', 'Caterham 620']],
  ['caterham-supersport', ['Supersport', 'Caterham Supersport']],
  ['caterham-superlight', ['Superlight', 'Caterham Superlight']],
  ['caterham-academy', ['Academy', 'Caterham Academy']],
  ['jcw', ['JCW', 'MINI JCW', 'Mini Challenge']],
  
  // Touring cars
  ['group-a', ['DTM', 'Group A', 'V8 quattro', 'E30 M3', 'Sierra RS500', 'Skyline GT-R R32']],
  ['group-c', ['Group C', 'XJR-9', 'C9', '962', '787B', 'Jaguar XJR']],
  ['super-v8', ['Super V8', 'V8 Supercar', 'Falcon FG', 'Commodore VF']],
  ['supercar', ['Supercar', 'Mustang GT', 'Camaro ZL1', 'Gen3']],
  ['arc', ['ARC Camaro', 'ARC']],
  
  // Stock cars Brazil
  ['stock-car-2024', ['Stock Car 2024', 'StockCar 2024']],
  ['stock-car-2023', ['Stock Car 2023', 'StockCar 2023', 'Cruze Stock 2023', 'Corolla Stock 2023']],
  ['stock-car-2022', ['Stock Car 2022', 'StockCar 2022', 'Cruze Stock', 'Corolla Stock']],
  
  // Stock cars USA (NASCAR)
  ['stock-usa-gen3', ['Camaro ZL1 1LE', 'Mustang NASCAR', 'Toyota Camry NASCAR', 'Next Gen']],
  ['stock-usa-gen2', ['Stock USA Gen2', 'COT', 'Car of Tomorrow']],
  ['stock-usa-gen1', ['Stock USA Gen1']],
  
  // Historic Stock Brazil
  ['old-stock-race', ['Old Stock', 'Opala Stock']],
  ['stock-car-1979', ['Opala 79', 'Opala 1979']],
  ['stock-car-1986', ['Opala 86', 'Opala 1986']],
  ['stock-car-1999', ['Stock Car 99', 'StockCar 99']],
  
  // Formula cars
  ['formula-ultimate', ['F-Ultimate', 'Formula Ultimate']],
  ['formula-usa-2023', ['IndyCar', 'F-USA', 'Dallara IR-18', 'IR18']],
  ['f3', ['F3', 'Formula 3', 'Dallara F3']],
  ['formula-inter', ['F-Inter', 'Formula Inter']],
  ['formula-trainer', ['F-Trainer', 'Formula Trainer']],
  ['formula-vee', ['F-Vee', 'Formula Vee']],
  ['formula-reiza', ['F-Reiza', 'Formula Reiza']],
  
  // Formula Classic/Retro
  ['formula-retro-v10', ['V10', 'F-V10']],
  ['formula-classic-g3', ['F-Classic Gen3', 'Classic Gen3']],
  ['formula-classic-g2', ['F-Classic Gen2', 'Classic Gen2']],
  ['formula-classic-g1', ['F-Classic Gen1', 'Classic Gen1', 'F-Classic_Gen1']],
  
  // Karts
  ['superkart', ['SuperKart', 'Super Kart', '250cc Kart']],
  ['kart-shifter', ['Shifter Kart', 'KZ Kart', 'Kart Shifter']],
  ['kart-125cc', ['125cc', 'Kart 125']],
  ['kart-4t-race', ['GX390', 'Kart Race', 'Kart 4T Race']],
  ['kart-4t-rental', ['Rental Kart', 'Kart Rental']],
  ['kartcross', ['Kartcross', 'Kart Cross']],
  
  // Vintage Touring
  ['vintage-touring-t1', ['TC60', 'Touring 60s', 'Willys Interlagos', 'DKW Vemag']],
  ['vintage-touring-t2', ['TC70', 'Touring 70s', 'Corvette C3', '911 RSR 74']],
  ['hot-cars', ['Hot Cars', 'Lola T70', 'Ford GT40']],
  ['m1-procar', ['M1 Procar', 'BMW M1']],
  ['copa-classic-b', ['Copa Classic B', 'Chevette', 'Passat']],
  ['copa-classic-fl', ['Copa Classic FL', 'Fusca', 'Beetle']],
  
  // Rallycross
  ['rallycross', ['RX', 'Rallycross', 'World RX']],
  ['super-trophy-truck', ['Trophy Truck', 'STT', 'Baja']],
  
  // Street cars
  ['street-car', ['Street', 'Road Car']],
  
  // GT Open / GT1
  ['gt-open', ['GT Open', 'GTOpen']],
  ['gt1', ['GT1', 'McLaren F1 GTR', 'Porsche 911 GT1', 'Mercedes CLK GTR']],
  ['gt1-2005', ['GT1 05', 'DBR9', 'Corvette C6.R', 'Saleen S7']],
  ['gt2-2005', ['GT2 05', 'Porsche 997 GT3 RSR', '997 RSR']],
  
  // Ligier European Series
  ['ligier-european', ['Ligier JS', 'LES', 'JS2 R', 'JS P4']],
  
  // GT5 (entry level GT)
  ['gt5', ['GT5', 'Ginetta G40', 'Aston Martin V8 Vantage GT5']],
  
  // P3/P4 (small prototypes)
  ['p4', ['P4', 'Ligier JS P4', 'MCR', 'Norma M30']],
  ['p3', ['P3', 'Ligier JS P3']],
  ['p2', ['P2', 'Radical SR3', 'Radical SR8']],
]

/**
 * Match a flat livery filename to a car class ID
 */
function matchLiveryToClass(liveryName: string): string | null {
  const upperName = liveryName.toUpperCase()
  
  for (const [classId, patterns] of LIVERY_CLASS_PATTERNS) {
    for (const pattern of patterns) {
      if (upperName.includes(pattern.toUpperCase())) {
        return classId
      }
    }
  }
  
  return null
}

// Debug: test a few known liveries at startup to verify matching works
const testLiveries = [
  'AMR Vantage GT3 Evo #007.png',
  'BMW M4 GT3 #10.png',
  'Aston Martin Valkyrie Hypercar #007.png',
  'Cadillac V-Series.R #5.png',
  'Porsche 963 #5 (IMSA 2024).png',
  'Alpine A424 #38.png'
]
console.log('[Images] Pattern matching test:')
for (const name of testLiveries) {
  const matched = matchLiveryToClass(name)
  console.log(`[Images]   "${name}" => ${matched || 'NO MATCH'}`)
}

/**
 * Get flat liveries that match a specific car class
 */
function getFlatLiveriesForClass(classId: string): string[] {
  if (!manifest.flat || manifest.flat.length === 0) {
    console.log(`[Images] getFlatLiveriesForClass(${classId}): No flat files in manifest`)
    return []
  }
  
  const matchingLiveries: string[] = []
  
  for (const liveryFile of manifest.flat) {
    const matchedClass = matchLiveryToClass(liveryFile)
    if (matchedClass === classId) {
      matchingLiveries.push(liveryFile)
    }
  }
  
  if (matchingLiveries.length === 0) {
    console.log(`[Images] getFlatLiveriesForClass(${classId}): No matches found from ${manifest.flat.length} flat files`)
  }
  
  return matchingLiveries
}

// ============================================
// CAR CLASS IMAGE MAPPING
// ============================================

// Maps car class IDs to folder names in /images/cars/
// This mapping must match IDs from ams2-cars.ts to actual folder names
const CLASS_FOLDER_MAP: Record<string, string> = {
  // Karts
  'kart-4t-rental': 'KartRental',
  'kart-4t-race': 'KartGX390',
  'kart-125cc': 'Kart125cc',
  'kart-shifter': 'KartShifter',
  'superkart': 'SuperKart',
  'kartcross': 'Kartcross',
  
  // Formula - Entry/Junior
  'formula-vee': 'F-Vee',
  'formula-trainer': 'F-Trainer',
  'formula-trainer-advanced': 'F-Trainer_A',
  'f3': 'F-3',
  'formula-inter': 'F-Inter',
  
  // Formula - Pro
  'formula-ultimate': 'F-Ultimate_Gen2',
  'formula-usa-2023': 'F-USA_2023',
  'formula-reiza': 'F-Reiza',
  
  // Formula - Classic/Retro/Vintage
  'formula-classic-g1': 'F-Classic_Gen1',
  'formula-classic-g2': 'F-Classic_Gen2',
  'formula-classic-g3': 'F-Classic_Gen3',
  'formula-retro-v10': 'F-V10_Gen2',
  
  // GT Cars - Modern
  'gt5': 'GT5',
  'gt4': 'GT4',
  'gt3': 'GT3',
  'gt3-gen2': 'GT3_Gen2',
  'gte': 'GTE',
  'gt-open': 'GTOpen',
  
  // GT Cars - Historic
  'gt-classic': 'GT1',
  'gt1': 'GT1',
  'gt1-2005': 'GT1_05',
  'gt2-2005': 'GT2_05',
  'gtr-2004': 'GTR_04',
  
  // Prototypes
  'p1-gen1': 'P1',
  'p1-gen2': 'P1Gen2',
  'p2': 'P2',
  'p3': 'P3',
  'p4': 'P4',
  'lmp1-2005': 'LMP1_05',
  'lmp2-gen1': 'LMP2_Gen1',
  'lmp2-gen2': 'LMP2_Gen2',
  'lmp2-2005': 'LMP2_05',
  'hypercar': 'Hypercars',
  'lmdh-gtp': 'LMDh',
  
  // One-Make Series
  'carrera-cup': 'Carrera Cup',
  'super-trofeo': 'Super Trofeo',
  'ginetta-g55-supercup': 'G55Supercup',
  'caterham-academy': 'Cat_Academy',
  'caterham-superlight': 'Cat_Superlight',
  'caterham-supersport': 'Cat_Supersport',
  'caterham-620r': 'Cat620R',
  'jcw': 'MiniChallenge',
  
  // Touring
  'tsi-cup': 'TSICup',
  'sprint-race': 'SprintRace',
  'lancer-cup': 'LancerCup',
  'super-v8': 'SuperV8',
  'supercar': 'Supercars',
  'arc': 'ARC_Cam',
  
  // Stock Cars Brazil
  'stock-car-2022': 'StockCarV8_2022',
  'stock-car-2023': 'StockCarV8_2023',
  'stock-car-2024': 'StockCarV8_2024',
  
  // Stock Cars USA (NASCAR)
  'stock-usa-gen1': 'Stock_USA_Gen1',
  'stock-usa-gen2': 'Stock_USA_Gen2',
  'stock-usa-gen3': 'Stock_USA_Gen3',
  'stock-usa-gen3-lm': 'Stock_USA_Gen3',
  
  // Historic Stock
  'old-stock-race': 'OldStock',
  'stock-car-1979': 'Opala79',
  'stock-car-1986': 'Opala86',
  'stock-car-1999': 'StockCar99',
  
  // Rallycross/Off-road
  'rallycross': 'RX',
  'super-trophy-truck': 'STT',
  
  // Street/Road Cars
  'street-car': 'Street',
  
  // Historic Touring
  'group-a': 'Group A',
  'group-c': 'Group C',
  'hot-cars': 'Hot Cars',
  'm1-procar': 'Procar',
  'vintage-touring-t1': 'TC60S',
  'vintage-touring-t2': 'TC70S',
  'copa-classic-b': 'CopaClassicB',
  'copa-classic-fl': 'CopaClassicFL',
  
  // Ligier European Series
  'ligier-european': 'LES_2025',
  
  // DPi
  'dpi': 'DPi',
}

/**
 * Get the folder path for a car class
 */
export function getCarClassFolder(classId: string): string | null {
  return CLASS_FOLDER_MAP[classId] || null
}

/**
 * Get a random livery image from a car class folder
 */
export function getCarClassImage(classId: string): string {
  const folder = CLASS_FOLDER_MAP[classId]
  if (!folder) {
    return `${BASE_URL}images/cars/placeholder.png` // Fallback
  }
  return buildCarImagePath('', folder).replace(/\/$/, '') // folder path only
}

/**
 * Get a specific livery image (first one found as representative)
 * This is async because we'd need to list directory - for now returns folder
 */
export function getCarClassRepresentativeImage(classId: string): string {
  const folder = CLASS_FOLDER_MAP[classId]
  if (!folder) {
    return ''
  }
  // Always use relative path for Electron compatibility
  return buildCarImagePath('', folder).replace(/\/$/, '')
}

// ============================================
// TRACK IMAGE MAPPING
// ============================================

/**
 * Get track image path from track name and layout
 * Always uses manifest lookup first to ensure the image exists
 * Returns empty string if no match found to prevent 404 errors
 */
export function getTrackImage(trackName: string, layoutName?: string): string {
  // Always try manifest lookup first
  const manifestMatch = findTrackImageFromManifest(trackName, layoutName)
  if (manifestMatch) {
    return manifestMatch
  }
  
  // Don't return a path that doesn't exist - return empty string instead
  // This prevents 404 errors in the console
  return ''
}

/**
 * Get track image from track ID and layout ID
 * Uses manifest lookup to ensure the image exists
 */
export function getTrackImageById(trackId: string, layoutId?: string): string {
  // Map common track IDs to their image names
  const trackNameMap: Record<string, string> = {
    'adelaide': 'Adelaide',
    'bathurst': 'Bathurst 2020',
    'interlagos': 'Interlagos GP',
    'spa': 'Spa-Francorchamps 2020',
    'spa-2022': 'Spa-Francorchamps 2022',
    'monza': 'Monza',
    'silverstone': 'Silverstone',
    'nurburgring': 'Nurburgring GP 2020',
    'nordschleife': 'Nordschleife 2020',
    'hockenheim': 'Hockenheim',
    'imola': 'Imola',
    'le-mans': 'Circuit des 24 Heures du Mans',
    'brands-hatch': 'Brands Hatch',
    'donington': 'Donington GP',
    'snetterton': 'Snetterton 300',
    'oulton-park': 'Oulton Park International',
    'cadwell-park': 'Cadwell Park',
    'barcelona': 'Circuit de Barcelona-Catalunya GP',
    'jerez': 'Jerez',
    'kyalami': 'Kyalami',
    'laguna-seca': 'Laguna Seca 2020',
    'watkins-glen': 'Watkins Glen GP',
    'road-atlanta': 'Road Atlanta',
    'road-america': 'Road America',
    'sebring': 'Sebring',
    'daytona': 'Daytona Sports Car Course',
    'indianapolis': 'Indianapolis Motor Speedway Road Course',
    'mosport': 'Mosport',
    'montreal': 'Montreal',
    'long-beach': 'Long Beach',
    'curitiba': 'Curitiba',
    'goiania': 'Goiania',
    'cascavel': 'Cascavel',
    'londrina': 'Londrina Long',
    'taruma': 'Taruma Internacional',
    'velopark': 'Velopark 2017',
    'velo-citta': 'Velo Citta',
    'spielberg': 'Spielberg',
    'kansai': 'Kansai GP',
  }
  
  const trackName = trackNameMap[trackId] || trackId
  
  // Use manifest lookup to ensure the image exists
  const manifestMatch = findTrackImageFromManifest(trackName, layoutId)
  if (manifestMatch) {
    return manifestMatch
  }
  
  // Fallback: return empty string instead of a path that might not exist
  return ''
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if an image exists (client-side)
 */
export async function checkImageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/**
 * Get all livery images for a class (returns folder path for now)
 */
export function getClassLiveries(classId: string): string {
  const folder = CLASS_FOLDER_MAP[classId]
  if (!folder) return ''
  return buildCarImagePath('', folder).replace(/\/$/, '')
}

/**
 * Build a specific livery image path
 */
export function getLiveryImage(classId: string, liveryName: string): string {
  const folder = CLASS_FOLDER_MAP[classId]
  if (!folder) return ''
  return buildCarImagePath(`${liveryName}.png`, folder)
}

// ============================================
// MANIFEST-BASED FUNCTIONS
// ============================================

/**
 * Get all livery images for a car class from the manifest
 * Checks both folder-based liveries and flat file liveries
 */
export function getClassLiveriesFromManifest(classId: string): string[] {
  const results: string[] = []
  
  console.log(`[Images] Looking up liveries for class: ${classId}`)
  console.log(`[Images] BASE_URL: "${BASE_URL}"`)
  
  // 1. Check folder-based liveries (legacy structure)
  const folder = CLASS_FOLDER_MAP[classId]
  console.log(`[Images] Folder mapping for ${classId}: ${folder || 'NONE'}`)
  
  if (folder) {
    const files = manifest.cars[folder]
    console.log(`[Images] Files in folder "${folder}":`, files?.length || 0)
    if (files && files.length > 0) {
      const folderPaths = files.map(f => buildCarImagePath(f, folder))
      console.log(`[Images] Sample folder paths:`, folderPaths.slice(0, 2))
      results.push(...folderPaths)
    }
  }
  
  // 2. Check flat file liveries (new structure with pattern matching)
  const flatLiveries = getFlatLiveriesForClass(classId)
  console.log(`[Images] Flat liveries for ${classId}:`, flatLiveries.length)
  if (flatLiveries.length > 0) {
    const flatPaths = flatLiveries.map(f => buildCarImagePath(f))
    console.log(`[Images] Sample flat paths:`, flatPaths.slice(0, 2))
    results.push(...flatPaths)
  }
  
  console.log(`[Images] Total liveries for ${classId}:`, results.length)
  if (results.length > 0) {
    console.log(`[Images] First path: ${results[0]}`)
  }
  
  return results
}

/**
 * Get a random livery image for a car class
 */
export function getRandomLiveryImage(classId: string): string {
  const liveries = getClassLiveriesFromManifest(classId)
  if (liveries.length === 0) return ''
  
  const randomIndex = Math.floor(Math.random() * liveries.length)
  return liveries[randomIndex]
}

/**
 * Get the first (representative) livery image for a car class
 */
export function getFirstLiveryImage(classId: string): string {
  const liveries = getClassLiveriesFromManifest(classId)
  if (liveries.length === 0) return ''
  return liveries[0]
}

/**
 * Check if a track image exists in the manifest
 */
export function hasTrackImage(trackName: string, layoutName?: string): boolean {
  const searchName = layoutName 
    ? `${trackName} ${layoutName}.png`
    : `${trackName}.png`
  
  return manifest.tracks.includes(searchName)
}

/**
 * Normalize track name for matching (remove common variations)
 */
function normalizeTrackNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*(park|grand prix|gp|circuit|international|raceway|speedway)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get image path (relative for Electron compatibility)
 */
function getImagePath(filename: string, subfolder: 'tracks' | 'cars' = 'tracks'): string {
  // Use encodeURIComponent for consistent encoding
  // Always use relative path './' for Electron compatibility
  // This ensures paths work correctly with file:// protocol and base: './'
  return `./images/${subfolder}/${encodeURIComponent(filename)}`
}

/**
 * Find best matching track image from manifest
 */
export function findTrackImageFromManifest(trackName: string, layoutName?: string): string | null {
  // Try exact match with layout
  if (layoutName) {
    const exactMatch = `${trackName} ${layoutName}.png`
    if (manifest.tracks.includes(exactMatch)) {
      return getImagePath(exactMatch, 'tracks')
    }
  }
  
  // Try base track name
  const baseName = `${trackName}.png`
  if (manifest.tracks.includes(baseName)) {
    return getImagePath(baseName, 'tracks')
  }
  
  // Try partial match (starts with)
  const partialMatch = manifest.tracks.find(t => 
    t.toLowerCase().startsWith(trackName.toLowerCase())
  )
  if (partialMatch) {
    return getImagePath(partialMatch, 'tracks')
  }
  
  // Try normalized matching (handles "Donington Park" -> "Donington GP")
  const normalizedTrackName = normalizeTrackNameForMatching(trackName)
  const normalizedMatch = manifest.tracks.find(t => {
    const normalizedManifestName = normalizeTrackNameForMatching(t.replace('.png', ''))
    // Exact match after normalization
    if (normalizedManifestName === normalizedTrackName) return true
    // One starts with the other (handles "Donington" matching "Donington GP")
    if (normalizedManifestName.startsWith(normalizedTrackName) || 
        normalizedTrackName.startsWith(normalizedManifestName)) return true
    // Check if they share the same first significant word
    const trackFirstWord = normalizedTrackName.split(' ')[0]
    const manifestFirstWord = normalizedManifestName.split(' ')[0]
    if (trackFirstWord.length > 2 && trackFirstWord === manifestFirstWord) return true
    return false
  })
  if (normalizedMatch) {
    return getImagePath(normalizedMatch, 'tracks')
  }
  
  // Try fuzzy match (contains key words) - more lenient
  const trackWords = normalizedTrackName.split(' ').filter(w => w.length > 2)
  if (trackWords.length > 0) {
    const fuzzyMatch = manifest.tracks.find(t => {
      const normalizedT = normalizeTrackNameForMatching(t.replace('.png', ''))
      // Check if any significant word from track name appears in manifest name
      return trackWords.some(word => normalizedT.includes(word)) ||
             normalizedT.split(' ').some(mWord => trackWords.includes(mWord))
    })
    if (fuzzyMatch) {
      return getImagePath(fuzzyMatch, 'tracks')
    }
  }
  
  return null
}

/**
 * Get track image count
 */
export function getTrackImageCount(): number {
  return manifest.tracks.length
}

/**
 * Get total livery count (folder + flat)
 */
export function getTotalLiveryCount(): number {
  const folderCount = Object.values(manifest.cars)
    .reduce((sum, arr) => sum + arr.length, 0)
  const flatCount = manifest.flat?.length || 0
  return folderCount + flatCount
}

/**
 * Get flat livery count
 */
export function getFlatLiveryCount(): number {
  return manifest.flat?.length || 0
}

// Export the mapping for external use
export { CLASS_FOLDER_MAP, manifest as imageManifest, matchLiveryToClass, getFlatLiveriesForClass }

