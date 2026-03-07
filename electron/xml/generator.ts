import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// AMS2 AI Driver XML structure - EXACT format from game files
interface AIDriverParams {
  liveryName: string     // Must match exact livery name in game
  name: string
  country: string        // 3-letter country code (BRA, USA, GBR, etc.)
  raceSkill: number      // 0-1
  qualifyingSkill: number // 0-1
  aggression: number     // 0-1
  defending: number      // 0-1
  stamina: number        // 0-1
  consistency: number    // 0-1
  startReactions: number // 0-1
  wetSkill: number       // 0-1
  tireManagement: number // 0-1
  fuelManagement: number // 0-1
  blueFlagConceding: number    // 0-1
  weatherTyreChanges: number   // 0-1
  avoidanceOfMistakes: number  // 0-1
  avoidanceOfForcedMistakes: number // 0-1
  vehicleReliability: number   // 0-1
}

interface XMLGeneratorConfig {
  ams2Path: string
  backupEnabled: boolean
}

// AMS2 Custom AI Driver XML format
// IMPORTANT: Files must match EXACT car class names from the game's CustomAIDrivers folder
// The XML structure must be EXACTLY as AMS2 expects - no extra fields!

// Complete mapping from internal carClassId to AMS2 filename (without .xml extension)
// These MUST match the exact filenames in: {AMS2_Install}/UserData/CustomAIDrivers/
const CAR_CLASS_ID_TO_AMS2_FILENAME: Record<string, string> = {
  // Karts
  'kart-rental': 'KartRental',
  'kart-gx390': 'KartGX390',
  'kart-125cc': 'Kart125cc',
  'kart-shifter': 'KartShifter',
  'superkart': 'SuperKart',
  'kart-cross': 'KartCross',
  
  // Formula - Entry/Amateur
  'formula-vee': 'F-Vee',
  'formula-vee-gen2': 'F-Vee_Gen2',
  'formula-trainer': 'F-Trainer',
  'formula-trainer-advanced': 'F-Trainer_A',
  'formula-junior': 'F-Junior',
  'formula-inter': 'F-Inter',
  
  // Formula - Professional
  'formula-3': 'F-3',
  'formula-reiza': 'F-Reiza',
  'formula-ultimate': 'F-Ultimate',
  'formula-ultimate-gen2': 'F-Ultimate_Gen2',
  
  // Formula USA
  'formula-usa-gen1': 'F-USA_Gen1',
  'formula-usa-gen2': 'F-USA_Gen2',
  'formula-usa-gen3': 'F-USA_Gen3',
  'formula-usa-2023': 'F-USA_2023',
  
  // Formula Classic/Retro/Vintage
  'formula-classic-gen1': 'F-Classic_Gen1',
  'formula-classic-gen2': 'F-Classic_Gen2',
  'formula-classic-gen3': 'F-Classic_Gen3',
  'formula-classic-gen4': 'F-Classic_Gen4',
  'formula-retro-gen1': 'F-Retro_Gen1',
  'formula-retro-gen2': 'F-Retro_Gen2',
  'formula-retro-gen3': 'F-Retro_Gen3',
  'formula-vintage-gen1': 'F-Vintage_Gen1',
  'formula-vintage-gen2': 'F-Vintage_Gen2',
  'formula-v10-gen1': 'F-V10_Gen1',
  'formula-v10-gen2': 'F-V10_Gen2',
  'formula-v12': 'F-V12',
  'formula-hitech-gen1': 'F-HiTech_Gen1',
  'formula-hitech-gen2': 'F-HiTech_Gen2',
  'formula-dirt': 'F-Dirt',
  
  // GT Cars
  'gt3': 'GT3',
  'gt3-gen2': 'GT3_Gen2',
  'gt4': 'GT4',
  'gt5': 'GT5',
  'gte': 'GTE',
  'gt1': 'GT1',
  'gt1-05': 'GT1_05',
  'gt2-05': 'GT2_05',
  'gt-open': 'GTOpen',
  'gtr-04': 'GTR_04',
  
  // Prototypes
  'prototype-1': 'P1',
  'prototype-1-gen2': 'P1Gen2',
  'prototype-2': 'P2',
  'prototype-3': 'P3',
  'prototype-4': 'P4',
  'lmp1-05': 'LMP1_05',
  'lmp2-05': 'LMP2_05',
  'lmp2-gen1': 'LMP2_Gen1',
  'lmp2': 'LMP2',
  'lmdh': 'LMDh',
  'dpi': 'DPI',
  'hypercar': 'Hypercars',
  'group-c': 'Group C',
  
  // Stock Cars Brazil
  'stock-car-v8': 'StockCarV8',
  'stock-car-2020': 'StockCarV8_2020',
  'stock-car-2021': 'StockCarV8_2021',
  'stock-car-2022': 'StockCarV8_2022',
  'stock-car-2023': 'StockCarV8_2023',
  'stock-car-2024': 'StockCarV8_2024',
  'stock-car-99': 'StockCar99',
  'old-stock': 'OldStock',
  
  // Touring Cars
  'group-a': 'Group A',
  'supercars': 'Supercars',
  'super-v8': 'SuperV8',
  'procar': 'Procar',
  
  // Brazilian Series
  'copa-fusca': 'CopaFusca',
  'copa-uno': 'CopaUno',
  'copa-classic-b': 'CopaClassicB',
  'copa-classic-fl': 'CopaClassicFL',
  'copa-truck': 'CopaTruck',
  'montana': 'Montana',
  'opala-79': 'Opala79',
  'opala-86': 'Opala86',
  'sprint-race': 'SprintRace',
  
  // One-Make Series
  'carrera-cup': 'Carrera Cup',
  'carrera-cup-brasil': 'Carrera CupB',
  'super-trofeo': 'Super Trofeo',
  'g40-cup': 'G40Cup',
  'g55-supercup': 'G55Supercup',
  'mini-challenge': 'MiniChallenge',
  'lancer-cup': 'LancerCup',
  'tsi-cup': 'TSICup',
  
  // Caterham
  'caterham-academy': 'Cat_Academy',
  'caterham-superlight': 'Cat_Superlight',
  'caterham-supersport': 'Cat_Supersport',
  'caterham-620r': 'Cat620R',
  
  // Stock USA (NASCAR)
  'stock-usa-gen1': 'Stock_USA_Gen1',
  'stock-usa-gen2': 'Stock_USA_Gen2',
  'stock-usa-gen3': 'Stock_USA_Gen3',
  'stock-usa-gen3-lm': 'Stock_USA_Gen3_LM',
  
  // Aussie Racing Cars / Other
  'arc-camaro': 'ARC_Cam',
  'hot-cars': 'Hot Cars',
  'street': 'Street',
  'rallycross': 'RX',
  'stt': 'STT',
  'st96': 'ST96',
  'tc60s': 'TC60S',
  'tc60s2': 'TC60S2',
  'tc70s': 'TC70S',
  'les-2025': 'LES_2025',
}

// Generate XML content for a single AI driver in AMS2's EXACT format
// FULL STATS MODE: Outputs all skill values so the career mod's difficulty systems
// (RPG modifiers, form, team dev, career stage) actually affect in-game AI behavior.
function generateDriverXML(driver: AIDriverParams): string {
  return `	<driver livery_name="${escapeXML(driver.liveryName || driver.name)}">
		<name>${escapeXML(driver.name)}</name>
		<country>${escapeXML(driver.country || 'USA')}</country>
		<race_skill>${driver.raceSkill.toFixed(4)}</race_skill>
		<qualifying_skill>${driver.qualifyingSkill.toFixed(4)}</qualifying_skill>
		<aggression>${driver.aggression.toFixed(4)}</aggression>
		<defending>${driver.defending.toFixed(4)}</defending>
		<stamina>${driver.stamina.toFixed(4)}</stamina>
		<consistency>${driver.consistency.toFixed(4)}</consistency>
		<start_reactions>${driver.startReactions.toFixed(4)}</start_reactions>
		<wet_skill>${driver.wetSkill.toFixed(4)}</wet_skill>
		<tyre_management>${driver.tireManagement.toFixed(4)}</tyre_management>
		<fuel_management>${driver.fuelManagement.toFixed(4)}</fuel_management>
		<blue_flag_conceding>${driver.blueFlagConceding.toFixed(4)}</blue_flag_conceding>
		<weather_tyre_changes>${driver.weatherTyreChanges.toFixed(4)}</weather_tyre_changes>
		<avoidance_of_mistakes>${driver.avoidanceOfMistakes.toFixed(4)}</avoidance_of_mistakes>
		<avoidance_of_forced_mistakes>${driver.avoidanceOfForcedMistakes.toFixed(4)}</avoidance_of_forced_mistakes>
		<vehicle_reliability>${driver.vehicleReliability.toFixed(4)}</vehicle_reliability>
	</driver>`
}

// Generate complete XML file for a grid of drivers in AMS2's EXACT format
function generateGridXML(drivers: AIDriverParams[], seriesName: string): string {
  const driversXML = drivers.map(generateDriverXML).join('\n')
  
  // AMS2's exact format - use custom_ai_drivers tag and proper encoding
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--Generated by AMS2 Career Companion - ${seriesName}-->
<custom_ai_drivers>
${driversXML}
</custom_ai_drivers>`
}

/**
 * Get the correct AMS2 car class filename from carClassId
 * This is the PRIMARY method - use carClassId when available
 * 
 * @param carClassId - Internal car class ID (e.g., 'prototype-4', 'carrera-cup')
 * @returns AMS2 filename without extension (e.g., 'P4', 'Carrera Cup')
 */
function getAMS2FileNameFromClassId(carClassId: string): string | null {
  return CAR_CLASS_ID_TO_AMS2_FILENAME[carClassId] || null
}

/**
 * Get the correct AMS2 car class filename
 * Prioritizes carClassId if provided, falls back to series name pattern matching
 * 
 * @param seriesName - Series name (for logging/fallback)
 * @param carClassId - Optional internal car class ID (preferred)
 * @returns AMS2 filename without extension
 */
function getCarClassFileName(seriesName: string, carClassId?: string): string {
  // PRIORITY 1: Use carClassId mapping if provided
  if (carClassId) {
    const mappedName = getAMS2FileNameFromClassId(carClassId)
    if (mappedName) {
      console.log(`[XML Generator] Mapped carClassId '${carClassId}' to AMS2 file '${mappedName}.xml'`)
      return mappedName
    }
    console.warn(`[XML Generator] No mapping found for carClassId '${carClassId}', falling back to series name`)
  }
  
  // PRIORITY 2: Try to extract car class from series name (legacy fallback)
  const patterns = [
    { match: /GT3\s*Gen\s*2/i, file: 'GT3_Gen2' },
    { match: /GT3/i, file: 'GT3' },
    { match: /GT4/i, file: 'GT4' },
    { match: /GT5/i, file: 'GT5' },
    { match: /GTE/i, file: 'GTE' },
    { match: /Stock\s*Car.*2024/i, file: 'StockCarV8_2024' },
    { match: /Stock\s*Car.*2023/i, file: 'StockCarV8_2023' },
    { match: /Stock\s*Car/i, file: 'StockCarV8' },
    { match: /Formula\s*Ultimate.*Gen\s*2/i, file: 'F-Ultimate_Gen2' },
    { match: /Formula\s*Ultimate/i, file: 'F-Ultimate' },
    { match: /Formula\s*Reiza/i, file: 'F-Reiza' },
    { match: /Formula\s*3/i, file: 'F-3' },
    { match: /Formula\s*USA.*2023/i, file: 'F-USA_2023' },
    { match: /LMP2/i, file: 'LMP2' },
    { match: /LMDh/i, file: 'LMDh' },
    { match: /Hypercar/i, file: 'Hypercars' },
    { match: /Prototype\s*4|P4/i, file: 'P4' },
    { match: /Prototype\s*3|P3/i, file: 'P3' },
    { match: /Prototype\s*2|P2/i, file: 'P2' },
    { match: /Prototype\s*1|P1/i, file: 'P1' },
    { match: /Carrera\s*Cup/i, file: 'Carrera Cup' },
    { match: /Super\s*Trofeo/i, file: 'Super Trofeo' },
    { match: /Caterham.*620/i, file: 'Cat620R' },
    { match: /Caterham.*Academy/i, file: 'Cat_Academy' },
    { match: /Caterham.*Superlight/i, file: 'Cat_Superlight' },
    { match: /Caterham.*Supersport/i, file: 'Cat_Supersport' },
  ]
  
  for (const { match, file } of patterns) {
    if (match.test(seriesName)) {
      console.log(`[XML Generator] Matched series name '${seriesName}' to AMS2 file '${file}.xml'`)
      return file
    }
  }
  
  // Fallback: sanitize series name (this is BAD - will likely not work in AMS2)
  console.warn(`[XML Generator] WARNING: No mapping found for series '${seriesName}' - file may not work in AMS2!`)
  return seriesName.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// Escape special characters for XML
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Get the default AMS2 CustomAIDrivers path
// NOTE: AMS2 reads CustomAIDrivers from the GAME INSTALLATION folder, not Documents!
// Common Steam paths: 
//   - C:\Program Files (x86)\Steam\steamapps\common\Automobilista 2\UserData\CustomAIDrivers
//   - D:\SteamLibrary\steamapps\common\Automobilista 2\UserData\CustomAIDrivers
// The user should configure this path in Settings since Steam install locations vary
function getDefaultAMS2Path(): string {
  // Try common Steam library locations
  const commonPaths = [
    // Default Steam location
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Automobilista 2\\UserData\\CustomAIDrivers',
    // Secondary Steam library (common on D: drive)
    'D:\\SteamLibrary\\steamapps\\common\\Automobilista 2\\UserData\\CustomAIDrivers',
    'E:\\SteamLibrary\\steamapps\\common\\Automobilista 2\\UserData\\CustomAIDrivers',
    'F:\\SteamLibrary\\steamapps\\common\\Automobilista 2\\UserData\\CustomAIDrivers',
    'G:\\SteamLibrary\\steamapps\\common\\Automobilista 2\\UserData\\CustomAIDrivers',
  ]
  
  // Check if any common path exists
  for (const testPath of commonPaths) {
    // Check if parent directory exists (UserData folder)
    const parentDir = path.dirname(testPath)
    if (fs.existsSync(parentDir)) {
      console.log(`[XML Generator] Found AMS2 installation at: ${testPath}`)
      return testPath
    }
  }
  
  // Fallback to first common path (user will need to configure in settings)
  console.warn('[XML Generator] AMS2 installation not found at common locations - user should configure path in Settings')
  return commonPaths[0]
}

// Ensure the CustomAIDrivers directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Backup existing AI files before overwriting
function backupExistingFiles(dirPath: string, fileName: string): void {
  const filePath = path.join(dirPath, fileName)
  if (fs.existsSync(filePath)) {
    const backupDir = path.join(dirPath, 'backups')
    ensureDirectoryExists(backupDir)
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`)
    
    fs.copyFileSync(filePath, backupPath)
  }
}

// Write AI driver XML to file
function writeAIDriverFile(
  drivers: AIDriverParams[], 
  seriesName: string, 
  config: XMLGeneratorConfig,
  carClassId?: string
): { success: boolean; filePath: string; error?: string } {
  try {
    const dirPath = config.ams2Path || getDefaultAMS2Path()
    ensureDirectoryExists(dirPath)
    
    // Use carClassId mapping (preferred) or fall back to series name matching
    const carClassName = getCarClassFileName(seriesName, carClassId)
    const fileName = `${carClassName}.xml`
    const filePath = path.join(dirPath, fileName)
    
    console.log(`[XML Generator] Writing to: ${filePath}`)
    
    // Backup if enabled
    if (config.backupEnabled) {
      backupExistingFiles(dirPath, fileName)
    }
    
    // Generate and write XML
    const xmlContent = generateGridXML(drivers, seriesName)
    fs.writeFileSync(filePath, xmlContent, 'utf-8')
    
    return { success: true, filePath }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[XML Generator] Error writing file: ${errorMessage}`)
    return { success: false, filePath: '', error: errorMessage }
  }
}

// Remove career AI files (cleanup)
function removeCareerFiles(config: XMLGeneratorConfig): { success: boolean; error?: string } {
  try {
    const dirPath = config.ams2Path || getDefaultAMS2Path()
    
    if (!fs.existsSync(dirPath)) {
      return { success: true }
    }
    
    const files = fs.readdirSync(dirPath)
    const careerFiles = files.filter(f => f.startsWith('career_') && f.endsWith('.xml'))
    
    careerFiles.forEach(file => {
      fs.unlinkSync(path.join(dirPath, file))
    })
    
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// List all career AI files
function listCareerFiles(config: XMLGeneratorConfig): string[] {
  try {
    const dirPath = config.ams2Path || getDefaultAMS2Path()
    
    if (!fs.existsSync(dirPath)) {
      return []
    }
    
    const files = fs.readdirSync(dirPath)
    return files.filter(f => f.startsWith('career_') && f.endsWith('.xml'))
  } catch {
    return []
  }
}

// Championship standing structure for generating AI params
interface ChampionshipStanding {
  driverId: string
  driverName: string
  teamId: string
  teamName: string
  points: number
  wins: number
  podiums: number
  races: number
  position: number
  isPlayer: boolean
}

// === NEW: Persistent driver data with form system ===
interface PersistentDriverData {
  driverId: string
  driverName: string
  country: string
  liveryName?: string
  // Core persistent skill (0-1)
  baseSkill: number
  // Current form modifier (-0.15 to +0.15)
  weekendForm: number
  // Team development bonus (0 to +0.05) - AI teams that have developed get stronger
  teamDevBonus?: number
  // Detailed stats from rivalStore
  stats: {
    raceSkill: number
    qualifyingSkill: number
    aggression: number
    defending: number
    consistency: number
    wetSkill: number
    tireManagement: number
    fuelManagement: number
    stamina: number
    startReactions: number
  }
  // Form streak for confidence modifier
  formStreak: number
  // Career stage for additional modifiers
  careerStage: 'rising' | 'peak' | 'declining' | 'veteran'
  // Championship position (for standings-based adjustments)
  championshipPosition: number
  totalDrivers: number
  // Season performance
  seasonWins: number
  seasonPodiums: number
  isPlayer: boolean
}

/**
 * Generate AI driver parameters from persistent driver data with form
 * 
 * UPDATED: Now follows the F1 mod approach - all parameters are boosted based on
 * effective skill level, with high minimums to ensure competitive AI.
 * 
 * Key insight: AMS2 XML skills work TOGETHER - low values in ANY parameter
 * (like start_reactions or consistency) will drag down overall performance
 * even if race_skill is high.
 */
function generateAIDriverFromPersistentData(driver: PersistentDriverData): AIDriverParams {
  // Apply weekend form AND team development bonus to base skill
  // teamDevBonus represents the team's car development advantage (0 to +0.05)
  const teamBonus = driver.teamDevBonus || 0
  const effectiveSkill = clamp(driver.baseSkill + driver.weekendForm + teamBonus)
  
  // Small random variance for this specific race (±1.5% - reduced from ±2%)
  const raceVariance = () => (Math.random() - 0.5) * 0.03
  
  // Confidence modifier from form streak
  let confidenceModifier = 0
  if (driver.formStreak >= 3) confidenceModifier = 0.02
  else if (driver.formStreak >= 2) confidenceModifier = 0.01
  else if (driver.formStreak <= -3) confidenceModifier = -0.02
  else if (driver.formStreak <= -2) confidenceModifier = -0.01
  
  // Career stage modifiers
  let stageConsistencyBonus = 0
  let stageAggressionModifier = 0
  switch (driver.careerStage) {
    case 'rising':
      stageAggressionModifier = 0.03 // Young = more aggressive
      stageConsistencyBonus = -0.01 // Slightly less consistent (reduced penalty)
      break
    case 'peak':
      stageConsistencyBonus = 0.02 // Peak = most consistent
      break
    case 'declining':
      stageConsistencyBonus = -0.01
      break
    case 'veteran':
      stageAggressionModifier = -0.02 // Veterans are more cautious
      stageConsistencyBonus = 0.02 // Very consistent
      break
  }
  
  // Calculate position-based modifier (championship leaders get slight boost)
  const positionFactor = driver.totalDrivers > 1 
    ? 1 - ((driver.championshipPosition - 1) / (driver.totalDrivers - 1))
    : 0.5
  const positionBonus = positionFactor * 0.03 // Max 3% bonus for leader (reduced)
  
  // Season performance bonuses
  const winBonus = Math.min(0.03, driver.seasonWins * 0.01)
  const podiumBonus = Math.min(0.02, driver.seasonPodiums * 0.005)
  
  // === F1 MOD APPROACH: All skills scale with effective skill ===
  // Instead of using raw stats, we boost everything based on how good the driver is
  // This ensures top drivers have high values ACROSS THE BOARD
  
  // Minimum skill floor based on effective skill (pro drivers = high minimums)
  // effectiveSkill of 0.8+ = minimum 0.85 for all stats
  // effectiveSkill of 0.6 = minimum 0.75 for all stats
  const skillFloor = 0.70 + (effectiveSkill * 0.20) // Range: 0.70 to 0.90 minimum
  
  // Helper to boost a stat based on effective skill while maintaining some variance
  const boostStat = (baseStat: number, modifier: number = 0): number => {
    // Blend the base stat with effective skill (70% effective skill, 30% original stat variance)
    const blended = (effectiveSkill * 0.7) + (baseStat * 0.3) + modifier
    // Apply floor and clamp
    return clamp(Math.max(skillFloor, blended) + raceVariance())
  }
  
  // === CORE PACE STATS (most important for lap times) ===
  // These should be HIGH and match each other for top drivers
  const raceSkill = clamp(effectiveSkill + confidenceModifier + positionBonus + winBonus + raceVariance())
  // Qualifying skill should match or EXCEED race skill (like F1 mod's Hamilton: quali 1.0, race 0.98)
  const qualifyingSkill = clamp(effectiveSkill + confidenceModifier + 0.02 + raceVariance())
  
  // === CONSISTENCY & MISTAKE AVOIDANCE (critical for race pace) ===
  // F1 mod has Hamilton at 0.97 consistency - top drivers should be very consistent
  const consistency = boostStat(driver.stats.consistency, stageConsistencyBonus + podiumBonus)
  const avoidanceOfMistakes = clamp(Math.max(consistency, skillFloor + 0.05) + raceVariance())
  
  // === RACE CRAFT STATS ===
  const defending = boostStat(driver.stats.defending, confidenceModifier * 0.5)
  const avoidanceOfForcedMistakes = clamp(Math.max(defending * 0.98, skillFloor) + raceVariance())
  
  // === START REACTIONS (was 0.60 before - way too low!) ===
  // F1 mod has Hamilton at 0.95 - this is CRITICAL for race starts
  // Minimum should be 0.80 for any professional driver
  const startReactionsFloor = Math.max(0.80, skillFloor)
  const startReactions = clamp(Math.max(startReactionsFloor, boostStat(driver.stats.startReactions)) + raceVariance())
  
  // === PHYSICAL & MANAGEMENT STATS ===
  const stamina = boostStat(driver.stats.stamina)
  const tireManagement = boostStat(driver.stats.tireManagement)
  const fuelManagement = boostStat(driver.stats.fuelManagement)
  const wetSkill = boostStat(driver.stats.wetSkill)
  
  // === AGGRESSION (can vary more - personality trait) ===
  // This one can stay lower as it's not about pace, it's about behavior
  const aggression = clamp(driver.stats.aggression + stageAggressionModifier + raceVariance())
  
  // === DERIVED/SECONDARY STATS ===
  const blueFlagConceding = clamp(0.80 + positionFactor * 0.15)
  const weatherTyreChanges = clamp(0.80 + effectiveSkill * 0.15)
  const vehicleReliability = clamp(0.88 + effectiveSkill * 0.10) // Higher base reliability
  
  return {
    liveryName: driver.liveryName || driver.driverName,
    name: driver.driverName,
    country: driver.country || 'USA',
    raceSkill,
    qualifyingSkill,
    aggression,
    defending,
    stamina,
    consistency,
    startReactions,
    wetSkill,
    tireManagement,
    fuelManagement,
    blueFlagConceding,
    weatherTyreChanges,
    avoidanceOfMistakes,
    avoidanceOfForcedMistakes,
    vehicleReliability
  }
}

// Generate AI driver parameters from championship standings (legacy method)
// Better performing drivers get higher AI skill values
function generateAIDriverFromStanding(
  standing: ChampionshipStanding,
  totalDrivers: number
): AIDriverParams {
  // Calculate base skill from championship position
  // Leader gets ~0.90, last place gets ~0.55
  const positionFactor = 1 - ((standing.position - 1) / Math.max(1, totalDrivers - 1))
  const baseSkill = 0.55 + (positionFactor * 0.35)
  
  // Bonus for wins and podiums
  const winBonus = Math.min(0.08, standing.wins * 0.015)
  const podiumBonus = Math.min(0.04, standing.podiums * 0.008)
  
  // Calculate individual skills with some variance
  const skillVariance = () => (Math.random() * 0.08) - 0.04 // ±4%
  
  const raceSkill = clamp(baseSkill + winBonus + skillVariance())
  const qualifyingSkill = clamp(baseSkill + skillVariance())
  
  // Aggression: winners tend to be more aggressive but controlled
  const aggression = clamp(0.55 + (winBonus * 2) + skillVariance())
  
  // Defending: better positions = better defenders
  const defending = clamp(baseSkill * 0.95 + skillVariance())
  
  // Stamina: generally high for all
  const stamina = clamp(0.85 + positionFactor * 0.1 + skillVariance())
  
  // Consistency: higher if more podiums relative to races
  const consistencyBonus = standing.races > 0 ? (standing.podiums / standing.races) * 0.12 : 0
  const consistency = clamp(0.65 + positionFactor * 0.2 + consistencyBonus + skillVariance())
  
  // Start reactions: slight variance
  const startReactions = clamp(0.80 + positionFactor * 0.15 + skillVariance())
  
  // Wet skill: based on overall performance
  const wetSkill = clamp(baseSkill * 0.9 + skillVariance())
  
  // Management skills
  const tireManagement = clamp(0.70 + positionFactor * 0.2 + skillVariance())
  const fuelManagement = clamp(0.75 + positionFactor * 0.15 + skillVariance())
  
  // Additional skills
  const blueFlagConceding = clamp(0.75 + positionFactor * 0.15)
  const weatherTyreChanges = clamp(0.70 + positionFactor * 0.2)
  const avoidanceOfMistakes = clamp(consistency)
  const avoidanceOfForcedMistakes = clamp(defending * 0.95)
  const vehicleReliability = clamp(0.80 + positionFactor * 0.15)
  
  return {
    liveryName: standing.driverName, // Will need to be matched to actual livery
    name: standing.driverName,
    country: 'USA', // Default - would need lookup
    raceSkill,
    qualifyingSkill,
    aggression,
    defending,
    stamina,
    consistency,
    startReactions,
    wetSkill,
    tireManagement,
    fuelManagement,
    blueFlagConceding,
    weatherTyreChanges,
    avoidanceOfMistakes,
    avoidanceOfForcedMistakes,
    vehicleReliability
  }
}

// Clamp value between 0 and 1
function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

// Generate AI drivers XML from championship standings
function generateCareerAIDrivers(
  standings: ChampionshipStanding[],
  seriesName: string,
  config: XMLGeneratorConfig
): { success: boolean; filePath: string; error?: string; driversGenerated: number } {
  try {
    // Filter out the player and convert standings to AI params
    const aiDrivers = standings
      .filter(s => !s.isPlayer)
      .map(standing => generateAIDriverFromStanding(standing, standings.length))
    
    if (aiDrivers.length === 0) {
      return { 
        success: false, 
        filePath: '', 
        error: 'No AI drivers to generate (all drivers are players?)',
        driversGenerated: 0
      }
    }
    
    // Write the XML file
    const result = writeAIDriverFile(aiDrivers, seriesName, config)
    
    return {
      ...result,
      driversGenerated: aiDrivers.length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, filePath: '', error: errorMessage, driversGenerated: 0 }
  }
}

// Register IPC handlers
export function registerXMLGeneratorHandlers(): void {
  // Backward compatibility for deprecated channel
  ipcMain.handle('xml:generateGrid', async (_event, data: any) => {
    try {
      if (data?.drivers && data?.seriesName && data?.config) {
        return generateRaceWeekendAIDrivers(
          data.drivers,
          data.seriesName,
          data.config,
          data.carClassId,
          data.aiModifier
        )
      }
      if (data?.standings && data?.seriesName && data?.config) {
        return generateCareerAIDrivers(data.standings, data.seriesName, data.config)
      }
      return { success: false, filePath: '', error: 'Invalid XML generation payload', driversGenerated: 0 }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, filePath: '', error: errorMessage, driversGenerated: 0 }
    }
  })

  // Write AI drivers to XML
  ipcMain.handle('ams2:writeAIDriver', async (_event, data: {
    drivers: AIDriverParams[]
    seriesName: string
    config: XMLGeneratorConfig
  }) => {
    return writeAIDriverFile(data.drivers, data.seriesName, data.config)
  })
  
  // Get default path
  ipcMain.handle('ams2:getDefaultPath', async () => {
    return getDefaultAMS2Path()
  })
  
  // Check if path exists
  ipcMain.handle('ams2:checkPath', async (_event, customPath?: string) => {
    const dirPath = customPath || getDefaultAMS2Path()
    return fs.existsSync(dirPath)
  })
  
  // List career files
  ipcMain.handle('ams2:listCareerFiles', async (_event, config: XMLGeneratorConfig) => {
    return listCareerFiles(config)
  })
  
  // Remove career files
  ipcMain.handle('ams2:removeCareerFiles', async (_event, config: XMLGeneratorConfig) => {
    return removeCareerFiles(config)
  })
  
  // Validate AI driver data
  ipcMain.handle('ams2:validateDriverData', async (_event, driver: AIDriverParams) => {
    const errors: string[] = []
    
    if (!driver.name || driver.name.trim() === '') {
      errors.push('Driver name is required')
    }
    
    const numericFields: (keyof AIDriverParams)[] = [
      'raceSkill', 'qualifyingSkill', 'aggression', 'defending',
      'consistency', 'wetSkill', 'tireManagement', 'fuelManagement',
      'stamina', 'startReactions', 'blueFlagConceding', 'weatherTyreChanges',
      'avoidanceOfMistakes', 'avoidanceOfForcedMistakes', 'vehicleReliability'
    ]
    
    numericFields.forEach(field => {
      const value = driver[field]
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        errors.push(`${field} must be between 0 and 1`)
      }
    })
    
    return { valid: errors.length === 0, errors }
  })
  
  // Generate AI drivers from career championship standings
  ipcMain.handle('ams2:generateCareerAI', async (_event, data: {
    standings: ChampionshipStanding[]
    seriesName: string
    config: XMLGeneratorConfig
  }) => {
    return generateCareerAIDrivers(data.standings, data.seriesName, data.config)
  })
  
  // NEW: Generate AI drivers from persistent driver data with form
  ipcMain.handle('ams2:generateRaceWeekendAI', async (_event, data: {
    drivers: PersistentDriverData[]
    seriesName: string
    config: XMLGeneratorConfig
    carClassId?: string  // Internal car class ID for proper filename mapping
    aiModifier?: number  // Optional RPG modifier (-0.03 to +0.03)
  }) => {
    return generateRaceWeekendAIDrivers(data.drivers, data.seriesName, data.config, data.carClassId, data.aiModifier)
  })
  
  // Generate AI params for a single hired driver with their training boosts
  ipcMain.handle('ams2:generateHiredDriverAI', async (_event, data: {
    driver: PersistentDriverData
    skillBoosts?: Record<string, number>  // From TeamDriver.development.skillBoosts
  }) => {
    try {
      const aiParams = generateHiredDriverAI(data.driver, data.skillBoosts)
      return { success: true, aiParams }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  })
}

/**
 * Apply RPG modifier to AI driver stats
 * Modifier is a decimal value (-0.03 to +0.03)
 * Negative = AI gets weaker (player advantage)
 * Positive = AI gets stronger (player disadvantage)
 */
function applyRPGModifierToDriver(driver: AIDriverParams, modifier: number): AIDriverParams {
  // Clamp modifier to reasonable range
  const clampedMod = Math.min(0.03, Math.max(-0.03, modifier))
  
  // Helper to apply modifier and clamp result
  const applyMod = (value: number, modMultiplier: number = 1) => {
    const modified = value + (clampedMod * modMultiplier)
    return Math.min(1, Math.max(0, modified))
  }
  
  return {
    ...driver,
    // Core racing stats get full modifier
    raceSkill: applyMod(driver.raceSkill),
    qualifyingSkill: applyMod(driver.qualifyingSkill),
    consistency: applyMod(driver.consistency),
    avoidanceOfMistakes: applyMod(driver.avoidanceOfMistakes),
    // Defensive stats get half modifier
    defending: applyMod(driver.defending, 0.5),
    // These stats are less affected
    aggression: driver.aggression,
    stamina: driver.stamina,
    startReactions: driver.startReactions,
    wetSkill: driver.wetSkill,
    tireManagement: driver.tireManagement,
    fuelManagement: driver.fuelManagement,
    blueFlagConceding: driver.blueFlagConceding,
    weatherTyreChanges: driver.weatherTyreChanges,
    avoidanceOfForcedMistakes: driver.avoidanceOfForcedMistakes,
    vehicleReliability: driver.vehicleReliability
  }
}

/**
 * Generate AI drivers XML for a race weekend using persistent driver data with form
 * This is the primary method for auto-generating AI before races
 * 
 * @param drivers - Array of persistent driver data (MUST include liveryName for each driver!)
 * @param seriesName - Name of the series for comments
 * @param config - XML generator configuration
 * @param carClassId - Internal car class ID for correct AMS2 filename mapping
 * @param aiModifier - Optional RPG modifier (-0.03 to +0.03) to adjust all AI stats
 */
function generateRaceWeekendAIDrivers(
  drivers: PersistentDriverData[],
  seriesName: string,
  config: XMLGeneratorConfig,
  carClassId?: string,
  aiModifier?: number
): { success: boolean; filePath: string; error?: string; driversGenerated: number; modifierApplied?: number } {
  try {
    console.log(`[XML Generator] Starting generation for ${seriesName} (carClassId: ${carClassId || 'NOT PROVIDED'})`)
    
    // Filter out the player and convert to AI params
    let aiDrivers = drivers
      .filter(d => !d.isPlayer)
      .map(driver => generateAIDriverFromPersistentData(driver))
    
    if (aiDrivers.length === 0) {
      return { 
        success: false, 
        filePath: '', 
        error: 'No AI drivers to generate',
        driversGenerated: 0
      }
    }
    
    // Warn if any drivers are missing livery names
    const missingLivery = aiDrivers.filter(d => !d.liveryName || d.liveryName === d.name)
    if (missingLivery.length > 0) {
      console.warn(`[XML Generator] WARNING: ${missingLivery.length} drivers missing proper liveryName - AI may not work correctly in AMS2!`)
      missingLivery.slice(0, 5).forEach(d => console.warn(`  - ${d.name}`))
    }
    
    // Apply RPG modifier if provided
    if (aiModifier !== undefined && aiModifier !== 0) {
      console.log(`[XML Generator] Applying RPG modifier: ${(aiModifier * 100).toFixed(1)}%`)
      aiDrivers = aiDrivers.map(driver => applyRPGModifierToDriver(driver, aiModifier))
    }
    
    // Write the XML file with carClassId for proper filename
    const result = writeAIDriverFile(aiDrivers, seriesName, config, carClassId)
    
    console.log(`[XML Generator] Generated ${aiDrivers.length} AI drivers for ${seriesName}${aiModifier ? ` with ${(aiModifier * 100).toFixed(1)}% modifier` : ''}`)
    
    return {
      ...result,
      driversGenerated: aiDrivers.length,
      modifierApplied: aiModifier
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[XML Generator] Error: ${errorMessage}`)
    return { success: false, filePath: '', error: errorMessage, driversGenerated: 0 }
  }
}

// ============================================
// HIRED DRIVER DEVELOPMENT SUPPORT
// ============================================

/**
 * Interface for hired driver training skill boosts
 * These are accumulated from training programs and applied to AI generation
 */
interface HiredDriverSkillBoosts {
  raceSkill?: number
  qualifyingSkill?: number
  consistency?: number
  wetSkill?: number
  defending?: number
  aggression?: number
  stamina?: number
}

/**
 * Apply hired driver skill boosts to persistent driver data
 * This should be called before generating AI XML to incorporate training gains
 * 
 * @param driver - The base persistent driver data
 * @param skillBoosts - Accumulated skill boosts from training programs
 * @returns Modified driver data with applied boosts
 */
function applyHiredDriverBoosts(
  driver: PersistentDriverData,
  skillBoosts: HiredDriverSkillBoosts
): PersistentDriverData {
  if (!skillBoosts || Object.keys(skillBoosts).length === 0) {
    return driver
  }
  
  // Apply boosts to the underlying stats
  const boostedStats = { ...driver.stats }
  
  if (skillBoosts.raceSkill) {
    boostedStats.raceSkill = clamp(boostedStats.raceSkill + skillBoosts.raceSkill)
  }
  if (skillBoosts.qualifyingSkill) {
    boostedStats.qualifyingSkill = clamp(boostedStats.qualifyingSkill + skillBoosts.qualifyingSkill)
  }
  if (skillBoosts.consistency) {
    boostedStats.consistency = clamp(boostedStats.consistency + skillBoosts.consistency)
  }
  if (skillBoosts.wetSkill) {
    boostedStats.wetSkill = clamp(boostedStats.wetSkill + skillBoosts.wetSkill)
  }
  if (skillBoosts.defending) {
    boostedStats.defending = clamp(boostedStats.defending + skillBoosts.defending)
  }
  if (skillBoosts.aggression) {
    // Aggression boost can be negative (reducing variance is good)
    boostedStats.aggression = clamp(boostedStats.aggression + skillBoosts.aggression)
  }
  if (skillBoosts.stamina) {
    boostedStats.stamina = clamp(boostedStats.stamina + skillBoosts.stamina)
  }
  
  // Also boost the base skill based on total training gains
  const totalBoost = Object.values(skillBoosts).reduce((sum, val) => sum + (val || 0), 0)
  const averageBoost = totalBoost / Object.keys(skillBoosts).length
  const baseSkillBoost = Math.min(0.05, averageBoost * 0.5) // Cap at +5% base skill from training
  
  console.log(`[XML Generator] Applied hired driver boosts: base +${(baseSkillBoost * 100).toFixed(1)}%, stats:`, skillBoosts)
  
  return {
    ...driver,
    baseSkill: clamp(driver.baseSkill + baseSkillBoost),
    stats: boostedStats
  }
}

/**
 * Generate AI driver XML specifically for a hired driver with their development data
 * This outputs FULL skill values (not minimal) to properly reflect their training
 * 
 * @param driver - Persistent driver data
 * @param skillBoosts - Skill boosts from team's training programs
 * @returns AI driver parameters with full skill values
 */
function generateHiredDriverAI(
  driver: PersistentDriverData,
  skillBoosts?: HiredDriverSkillBoosts
): AIDriverParams {
  // Apply any training boosts first
  const boostedDriver = skillBoosts 
    ? applyHiredDriverBoosts(driver, skillBoosts)
    : driver
  
  // Generate using the standard function (which produces full skill values)
  const aiParams = generateAIDriverFromPersistentData(boostedDriver)
  
  // Log for debugging
  console.log(`[XML Generator] Generated hired driver AI for ${driver.driverName}:`, {
    baseSkill: boostedDriver.baseSkill.toFixed(3),
    raceSkill: aiParams.raceSkill.toFixed(3),
    qualifyingSkill: aiParams.qualifyingSkill.toFixed(3),
    consistency: aiParams.consistency.toFixed(3)
  })
  
  return aiParams
}

export {
  generateDriverXML,
  generateGridXML,
  writeAIDriverFile,
  removeCareerFiles,
  listCareerFiles,
  getDefaultAMS2Path,
  getCarClassFileName,
  getAMS2FileNameFromClassId,
  generateCareerAIDrivers,
  generateAIDriverFromStanding,
  generateRaceWeekendAIDrivers,
  generateAIDriverFromPersistentData,
  applyRPGModifierToDriver,
  applyHiredDriverBoosts,
  generateHiredDriverAI,
  CAR_CLASS_ID_TO_AMS2_FILENAME,
  AIDriverParams,
  XMLGeneratorConfig,
  ChampionshipStanding,
  PersistentDriverData,
  HiredDriverSkillBoosts
}


