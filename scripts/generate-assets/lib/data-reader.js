/**
 * Data Reader
 * Parses TypeScript game data files to extract entities for asset generation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../../src/data');

/**
 * Extract all unique drivers from ams2-teams-real.ts
 * @returns {Promise<Array<{name: string, country: string, teams: string[]}>>}
 */
export async function extractDrivers() {
  const filePath = path.join(DATA_DIR, 'ams2-teams-real.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Parse all team blocks to get driver-team associations
  const driverMap = new Map();
  
  // Match team blocks with their drivers
  const teamBlockRegex = /{\s*id:\s*'([^']+)'[^}]*name:\s*'([^']+)'[^}]*drivers:\s*\[(.*?)\]/gs;
  let match;
  
  while ((match = teamBlockRegex.exec(content)) !== null) {
    const teamId = match[1];
    const teamName = match[2];
    const driversJson = match[3];
    
    // Parse individual drivers from the array
    const driverRegex = /{"name":"([^"]+)","country":"([^"]+)"}/g;
    let driverMatch;
    
    while ((driverMatch = driverRegex.exec(driversJson)) !== null) {
      const name = driverMatch[1];
      const country = driverMatch[2];
      const key = `${name}|${country}`;
      
      if (!driverMap.has(key)) {
        driverMap.set(key, {
          name,
          country,
          teams: []
        });
      }
      driverMap.get(key).teams.push(teamName);
    }
  }
  
  // Convert to array and generate IDs
  const drivers = Array.from(driverMap.values()).map(driver => ({
    ...driver,
    id: generateId(driver.name, driver.country)
  }));
  
  console.log(`  Extracted ${drivers.length} unique drivers from game data`);
  return drivers;
}

/**
 * Extract all teams from teams.ts
 * @returns {Promise<Array>}
 */
export async function extractTeams() {
  const filePath = path.join(DATA_DIR, 'teams.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const teams = [];
  
  // Teams are on single lines, format:
  // { id: 'xxx', name: 'xxx', shortName: 'xxx', country: 'xxx', budget: 'xxx', prestige: N, ... colors: { primary: 'xxx', secondary: 'xxx' }, ... }
  // Use a regex that handles the nested braces in payRange
  const teamLineRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*shortName:\s*'([^']+)',\s*country:\s*'([^']+)',\s*budget:\s*'([^']+)',\s*prestige:\s*(\d+),.*?colors:\s*{\s*primary:\s*'([^']+)',\s*secondary:\s*'([^']+)'\s*}/g;
  
  let match;
  while ((match = teamLineRegex.exec(content)) !== null) {
    teams.push({
      id: match[1],
      name: match[2],
      shortName: match[3],
      country: match[4],
      budget: match[5],
      prestige: parseInt(match[6]),
      colors: {
        primary: match[7],
        secondary: match[8]
      }
    });
  }
  
  // Deduplicate by name
  const uniqueTeams = Array.from(
    new Map(teams.map(t => [t.name, t])).values()
  );
  
  console.log(`  Extracted ${uniqueTeams.length} unique teams from game data`);
  return uniqueTeams;
}

/**
 * Extract sponsors from sponsors.ts
 * @returns {Promise<Array>}
 */
export async function extractSponsors() {
  const filePath = path.join(DATA_DIR, 'sponsors.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const sponsors = [];
  // Match sponsor objects in the SPONSORS array
  const sponsorRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"](?:,\s*tier:\s*['"]([^'"]+)['"])?(?:,\s*country:\s*['"]([^'"]+)['"])?/g;
  
  let match;
  while ((match = sponsorRegex.exec(content)) !== null) {
    sponsors.push({
      id: match[1],
      name: match[2],
      category: match[3],
      tier: match[4] || 'mid',
      country: match[5] || 'International'
    });
  }
  
  console.log(`  Extracted ${sponsors.length} sponsors from game data`);
  return sponsors;
}

/**
 * Extract manufacturers from manufacturers.ts
 * @returns {Promise<Array>}
 */
export async function extractManufacturers() {
  const filePath = path.join(DATA_DIR, 'manufacturers.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const manufacturers = [];
  // Match manufacturer entries
  const mfgRegex = /['"]([^'"]+)['"]\s*:\s*{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*country:\s*['"]([^'"]+)['"],\s*countryCode:\s*['"]([^'"]+)['"](?:,\s*founded:\s*(\d+))?(?:,\s*headquarters:\s*['"]([^'"]+)['"])?(?:,\s*tier:\s*['"]([^'"]+)['"])?/g;
  
  let match;
  while ((match = mfgRegex.exec(content)) !== null) {
    manufacturers.push({
      id: match[2],
      name: match[3],
      country: match[4],
      countryCode: match[5],
      founded: match[6] ? parseInt(match[6]) : null,
      headquarters: match[7] || null,
      tier: match[8] || 'mainstream'
    });
  }
  
  console.log(`  Extracted ${manufacturers.length} manufacturers from game data`);
  return manufacturers;
}

/**
 * Extract banks from financial-extended-config.ts
 * @returns {Promise<Array>}
 */
export async function extractBanks() {
  const filePath = path.join(DATA_DIR, 'financial-extended-config.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const banks = [];
  // Match bank names in BANK_LENDERS array
  const bankRegex = /name:\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = bankRegex.exec(content)) !== null) {
    const name = match[1];
    banks.push({
      id: generateId(name),
      name
    });
  }
  
  console.log(`  Extracted ${banks.length} banks from game data`);
  return banks;
}

/**
 * Extract championships from championships.ts
 * @returns {Promise<Array>}
 */
export async function extractChampionships() {
  const filePath = path.join(DATA_DIR, 'championships.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const championships = [];
  // Match championship objects
  const champRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"](?:,\s*shortName:\s*['"]([^'"]+)['"])?[^}]*?type:\s*['"]([^'"]+)['"][^}]*?region:\s*['"]([^'"]+)['"][^}]*?tier:\s*['"]([^'"]+)['"][^}]*?prestige:\s*(\d+)/gs;
  
  let match;
  while ((match = champRegex.exec(content)) !== null) {
    championships.push({
      id: match[1],
      name: match[2],
      shortName: match[3] || match[2].substring(0, 3).toUpperCase(),
      type: match[4],
      region: match[5],
      tier: match[6],
      prestige: parseInt(match[7])
    });
  }
  
  console.log(`  Extracted ${championships.length} championships from game data`);
  return championships;
}

/**
 * Extract tracks from ams2-tracks.ts
 * @returns {Promise<Array>}
 */
export async function extractTracks() {
  const filePath = path.join(DATA_DIR, 'ams2-tracks.ts');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const tracks = [];
  // Match track objects
  const trackRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"](?:,\s*shortName:\s*['"]([^'"]+)['"])?[^}]*?country:\s*['"]([^'"]+)['"][^}]*?countryCode:\s*['"]([^'"]+)['"][^}]*?region:\s*['"]([^'"]+)['"][^}]*?type:\s*['"]([^'"]+)['"][^}]*?layouts:\s*\[/gs;
  
  let match;
  while ((match = trackRegex.exec(content)) !== null) {
    tracks.push({
      id: match[1],
      name: match[2],
      shortName: match[3] || match[2],
      country: match[4],
      countryCode: match[5],
      region: match[6],
      type: match[7]
    });
  }
  
  console.log(`  Extracted ${tracks.length} tracks from game data`);
  return tracks;
}

/**
 * Generate a URL-safe ID from a name
 */
function generateId(...parts) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract all game data
 * @returns {Promise<Object>}
 */
export async function extractAllGameData() {
  console.log('\n📂 Extracting game data from TypeScript files...\n');
  
  const [drivers, teams, sponsors, manufacturers, banks, championships, tracks] = await Promise.all([
    extractDrivers(),
    extractTeams(),
    extractSponsors(),
    extractManufacturers(),
    extractBanks(),
    extractChampionships(),
    extractTracks()
  ]);
  
  const summary = {
    drivers: drivers.length,
    teams: teams.length,
    sponsors: sponsors.length,
    manufacturers: manufacturers.length,
    banks: banks.length,
    championships: championships.length,
    tracks: tracks.length,
    total: drivers.length + teams.length + sponsors.length + manufacturers.length + banks.length + championships.length + tracks.length
  };
  
  console.log('\n📊 Data extraction complete:');
  console.log(`   Drivers:       ${summary.drivers}`);
  console.log(`   Teams:         ${summary.teams}`);
  console.log(`   Sponsors:      ${summary.sponsors}`);
  console.log(`   Manufacturers: ${summary.manufacturers}`);
  console.log(`   Banks:         ${summary.banks}`);
  console.log(`   Championships: ${summary.championships}`);
  console.log(`   Tracks:        ${summary.tracks}`);
  console.log(`   ─────────────────────`);
  console.log(`   Total entities: ${summary.total}`);
  
  return {
    drivers,
    teams,
    sponsors,
    manufacturers,
    banks,
    championships,
    tracks,
    summary
  };
}

// Country code to full name mapping
export const COUNTRY_NAMES = {
  'AUS': 'Australian',
  'BRA': 'Brazilian',
  'GBR': 'British',
  'DEU': 'German',
  'USA': 'American',
  'FRA': 'French',
  'ITA': 'Italian',
  'ESP': 'Spanish',
  'JPN': 'Japanese',
  'NLD': 'Dutch',
  'BEL': 'Belgian',
  'AUT': 'Austrian',
  'PRT': 'Portuguese',
  'CHE': 'Swiss',
  'MEX': 'Mexican',
  'ARG': 'Argentinian',
  'CAN': 'Canadian',
  'NZL': 'New Zealand',
  'DNK': 'Danish',
  'SWE': 'Swedish',
  'NOR': 'Norwegian',
  'FIN': 'Finnish',
  'POL': 'Polish',
  'CHN': 'Chinese',
  'KOR': 'South Korean',
  'THA': 'Thai',
  'MCO': 'Monegasque',
  'RUS': 'Russian',
  'COL': 'Colombian',
  'VEN': 'Venezuelan',
  'URY': 'Uruguayan',
  'IND': 'Indian',
  'MYS': 'Malaysian',
  'IDN': 'Indonesian',
  'SGP': 'Singaporean',
  'ZAF': 'South African',
  'IRL': 'Irish'
};

// Region-based physical appearance traits for diversity
export const APPEARANCE_BY_REGION = {
  // European
  'GBR': { skinTone: 'fair', hairColors: ['brown', 'blonde', 'black', 'red'], eyeColors: ['blue', 'green', 'brown'] },
  'DEU': { skinTone: 'fair', hairColors: ['blonde', 'brown', 'black'], eyeColors: ['blue', 'green', 'brown'] },
  'FRA': { skinTone: 'fair to olive', hairColors: ['brown', 'black', 'blonde'], eyeColors: ['brown', 'blue', 'green'] },
  'ITA': { skinTone: 'olive', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  'ESP': { skinTone: 'olive', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  'NLD': { skinTone: 'fair', hairColors: ['blonde', 'brown'], eyeColors: ['blue', 'green'] },
  'BEL': { skinTone: 'fair', hairColors: ['brown', 'blonde'], eyeColors: ['blue', 'brown'] },
  'AUT': { skinTone: 'fair', hairColors: ['brown', 'blonde'], eyeColors: ['blue', 'green', 'brown'] },
  'CHE': { skinTone: 'fair', hairColors: ['brown', 'blonde'], eyeColors: ['blue', 'green', 'brown'] },
  'PRT': { skinTone: 'olive', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'DNK': { skinTone: 'fair', hairColors: ['blonde', 'light brown'], eyeColors: ['blue', 'green'] },
  'SWE': { skinTone: 'fair', hairColors: ['blonde', 'light brown'], eyeColors: ['blue', 'green'] },
  'NOR': { skinTone: 'fair', hairColors: ['blonde', 'light brown'], eyeColors: ['blue', 'green'] },
  'FIN': { skinTone: 'fair', hairColors: ['blonde', 'light brown'], eyeColors: ['blue', 'green'] },
  'POL': { skinTone: 'fair', hairColors: ['brown', 'blonde'], eyeColors: ['blue', 'green', 'brown'] },
  'RUS': { skinTone: 'fair', hairColors: ['brown', 'blonde', 'black'], eyeColors: ['blue', 'green', 'brown'] },
  'MCO': { skinTone: 'fair to olive', hairColors: ['brown', 'black'], eyeColors: ['brown', 'blue'] },
  'IRL': { skinTone: 'fair', hairColors: ['red', 'brown', 'black'], eyeColors: ['blue', 'green', 'brown'] },
  'GRC': { skinTone: 'olive to tan', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  'TUR': { skinTone: 'olive to tan', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  'HUN': { skinTone: 'fair to olive', hairColors: ['brown', 'black'], eyeColors: ['brown', 'blue'] },
  'CZE': { skinTone: 'fair', hairColors: ['brown', 'blonde'], eyeColors: ['blue', 'brown'] },
  
  // Americas
  'USA': { skinTone: 'medium brown', hairColors: ['black', 'brown'], eyeColors: ['brown', 'hazel'] },
  'CAN': { skinTone: 'medium brown', hairColors: ['black', 'brown'], eyeColors: ['brown', 'hazel'] },
  'BRA': { skinTone: 'medium brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  'MEX': { skinTone: 'tan to brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'ARG': { skinTone: 'fair to olive', hairColors: ['brown', 'black'], eyeColors: ['brown', 'hazel'] },
  'COL': { skinTone: 'tan to brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'VEN': { skinTone: 'tan to brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'URY': { skinTone: 'fair to olive', hairColors: ['brown', 'black'], eyeColors: ['brown', 'hazel'] },
  'CHL': { skinTone: 'tan to olive', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'PER': { skinTone: 'tan to brown', hairColors: ['black'], eyeColors: ['brown'] },
  'JAM': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'TTO': { skinTone: 'dark brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'DOM': { skinTone: 'medium to dark brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'CUB': { skinTone: 'medium to dark brown', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  
  // Asia-Pacific
  'JPN': { skinTone: 'fair to light tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'CHN': { skinTone: 'fair to light tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'KOR': { skinTone: 'fair to light tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'THA': { skinTone: 'tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'MYS': { skinTone: 'tan to brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'IDN': { skinTone: 'tan to brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'SGP': { skinTone: 'tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'IND': { skinTone: 'brown to dark brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'PAK': { skinTone: 'brown to dark brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'PHL': { skinTone: 'tan to brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'VNM': { skinTone: 'tan', hairColors: ['black'], eyeColors: ['dark brown'] },
  'AUS': { skinTone: 'fair to tan', hairColors: ['brown', 'blonde', 'black'], eyeColors: ['blue', 'brown', 'green'] },
  'NZL': { skinTone: 'fair to tan', hairColors: ['brown', 'blonde', 'black'], eyeColors: ['blue', 'brown', 'green'] },
  
  // Middle East
  'ARE': { skinTone: 'olive to brown', hairColors: ['black'], eyeColors: ['dark brown', 'brown'] },
  'SAU': { skinTone: 'olive to brown', hairColors: ['black'], eyeColors: ['dark brown', 'brown'] },
  'QAT': { skinTone: 'olive to brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'BHR': { skinTone: 'olive to brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'EGY': { skinTone: 'olive to tan', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'MAR': { skinTone: 'olive to tan', hairColors: ['black', 'dark brown'], eyeColors: ['brown'] },
  'LBN': { skinTone: 'olive', hairColors: ['black', 'dark brown'], eyeColors: ['brown', 'hazel'] },
  
  // Africa
  'ZAF': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'NGA': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'GHA': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'KEN': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'ETH': { skinTone: 'dark brown', hairColors: ['black'], eyeColors: ['dark brown'] },
  'SEN': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'CIV': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'CMR': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'AGO': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'TZA': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'UGA': { skinTone: 'dark brown to black', hairColors: ['black'], eyeColors: ['dark brown'] },
  'RWA': { skinTone: 'dark brown', hairColors: ['black'], eyeColors: ['dark brown'] }
};

// Default for unknown countries - use medium brown for neutrality
export const DEFAULT_APPEARANCE = {
  skinTone: 'medium brown',
  hairColors: ['brown', 'black'],
  eyeColors: ['brown']
};
