/**
 * AMS2 Team & Driver Parser
 * 
 * This script reads the CustomAIDrivers XML files from AMS2
 * and extracts real team and driver data to generate a TypeScript database.
 * 
 * Usage: node scripts/parse-ams2-teams.js
 */

const fs = require('fs');
const path = require('path');

// AMS2 installation path - update this if needed
const AMS2_PATH = 'F:\\SteamLibrary\\steamapps\\common\\Automobilista 2';
const CUSTOM_AI_PATH = path.join(AMS2_PATH, 'UserData', 'CustomAIDrivers');

// Car class mappings to internal IDs and tiers
const CAR_CLASS_CONFIG = {
  // KARTS - Entry Level
  'KartRental': { id: 'kart-rental', name: 'Kart Rental', tier: 'entry', repMin: 0, repMax: 5 },
  'KartGX390': { id: 'kart-gx390', name: 'Kart GX390', tier: 'entry', repMin: 0, repMax: 8 },
  'Kart125cc': { id: 'kart-125cc', name: 'Kart 125cc', tier: 'amateur', repMin: 10, repMax: 25 },
  'KartShifter': { id: 'kart-shifter', name: 'Kart Shifter', tier: 'amateur', repMin: 15, repMax: 30 },
  'SuperKart': { id: 'superkart', name: 'Superkart', tier: 'semi-pro', repMin: 25, repMax: 40 },
  'KartCross': { id: 'kart-cross', name: 'Kart Cross', tier: 'amateur', repMin: 10, repMax: 20 },

  // FORMULA - Entry/Amateur
  'F-Vee': { id: 'formula-vee', name: 'Formula Vee', tier: 'entry', repMin: 0, repMax: 10 },
  'F-Vee_Gen2': { id: 'formula-vee-gen2', name: 'Formula Vee Gen2', tier: 'entry', repMin: 0, repMax: 12 },
  'F-Trainer': { id: 'formula-trainer', name: 'Formula Trainer', tier: 'amateur', repMin: 10, repMax: 25 },
  'F-Trainer_A': { id: 'formula-trainer-advanced', name: 'Formula Trainer Advanced', tier: 'amateur', repMin: 15, repMax: 30 },
  'F-Junior': { id: 'formula-junior', name: 'Formula Junior', tier: 'amateur', repMin: 12, repMax: 28 },
  'F-Inter': { id: 'formula-inter', name: 'Formula Inter', tier: 'semi-pro', repMin: 25, repMax: 40 },

  // FORMULA - Professional
  'F-3': { id: 'formula-3', name: 'Formula 3', tier: 'semi-pro', repMin: 30, repMax: 50 },
  'F-Reiza': { id: 'formula-reiza', name: 'Formula Reiza', tier: 'pro', repMin: 45, repMax: 65 },
  'F-Ultimate': { id: 'formula-ultimate', name: 'Formula Ultimate', tier: 'elite', repMin: 65, repMax: 90 },
  'F-Ultimate_Gen2': { id: 'formula-ultimate-gen2', name: 'Formula Ultimate Gen2', tier: 'elite', repMin: 68, repMax: 92 },
  
  // FORMULA USA
  'F-USA_Gen1': { id: 'formula-usa-gen1', name: 'Formula USA Gen1', tier: 'pro', repMin: 50, repMax: 70 },
  'F-USA_Gen2': { id: 'formula-usa-gen2', name: 'Formula USA Gen2', tier: 'pro', repMin: 52, repMax: 72 },
  'F-USA_Gen3': { id: 'formula-usa-gen3', name: 'Formula USA Gen3', tier: 'elite', repMin: 58, repMax: 78 },
  'F-USA_2023': { id: 'formula-usa-2023', name: 'Formula USA 2023', tier: 'elite', repMin: 60, repMax: 80 },

  // FORMULA CLASSIC/RETRO/VINTAGE
  'F-Classic_Gen1': { id: 'formula-classic-gen1', name: 'Formula Classic Gen1', tier: 'pro', repMin: 40, repMax: 60 },
  'F-Classic_Gen2': { id: 'formula-classic-gen2', name: 'Formula Classic Gen2', tier: 'pro', repMin: 42, repMax: 62 },
  'F-Classic_Gen3': { id: 'formula-classic-gen3', name: 'Formula Classic Gen3', tier: 'pro', repMin: 45, repMax: 65 },
  'F-Classic_Gen4': { id: 'formula-classic-gen4', name: 'Formula Classic Gen4', tier: 'elite', repMin: 55, repMax: 75 },
  'F-Retro_Gen1': { id: 'formula-retro-gen1', name: 'Formula Retro Gen1', tier: 'pro', repMin: 35, repMax: 55 },
  'F-Retro_Gen2': { id: 'formula-retro-gen2', name: 'Formula Retro Gen2', tier: 'pro', repMin: 40, repMax: 60 },
  'F-Retro_Gen3': { id: 'formula-retro-gen3', name: 'Formula Retro Gen3', tier: 'pro', repMin: 45, repMax: 65 },
  'F-Vintage_Gen1': { id: 'formula-vintage-gen1', name: 'Formula Vintage Gen1', tier: 'semi-pro', repMin: 30, repMax: 50 },
  'F-Vintage_Gen2': { id: 'formula-vintage-gen2', name: 'Formula Vintage Gen2', tier: 'semi-pro', repMin: 32, repMax: 52 },
  'F-V10_Gen1': { id: 'formula-v10-gen1', name: 'Formula V10 Gen1', tier: 'elite', repMin: 60, repMax: 85 },
  'F-V10_Gen2': { id: 'formula-v10-gen2', name: 'Formula V10 Gen2', tier: 'elite', repMin: 65, repMax: 88 },
  'F-V12': { id: 'formula-v12', name: 'Formula V12', tier: 'elite', repMin: 62, repMax: 85 },
  'F-HiTech_Gen1': { id: 'formula-hitech-gen1', name: 'Formula HiTech Gen1', tier: 'pro', repMin: 45, repMax: 65 },
  'F-HiTech_Gen2': { id: 'formula-hitech-gen2', name: 'Formula HiTech Gen2', tier: 'pro', repMin: 48, repMax: 68 },
  'F-Dirt': { id: 'formula-dirt', name: 'Formula Dirt', tier: 'amateur', repMin: 15, repMax: 30 },

  // GT CARS
  'GT3': { id: 'gt3', name: 'GT3', tier: 'pro', repMin: 45, repMax: 70 },
  'GT3_Gen2': { id: 'gt3-gen2', name: 'GT3 Gen2', tier: 'pro', repMin: 50, repMax: 75 },
  'GT4': { id: 'gt4', name: 'GT4', tier: 'semi-pro', repMin: 30, repMax: 50 },
  'GT5': { id: 'gt5', name: 'GT5', tier: 'amateur', repMin: 15, repMax: 30 },
  'GTE': { id: 'gte', name: 'GTE', tier: 'pro', repMin: 50, repMax: 72 },
  'GT1': { id: 'gt1', name: 'GT1', tier: 'elite', repMin: 60, repMax: 80 },
  'GT1_05': { id: 'gt1-05', name: 'GT1 2005', tier: 'elite', repMin: 58, repMax: 78 },
  'GT2_05': { id: 'gt2-05', name: 'GT2 2005', tier: 'pro', repMin: 48, repMax: 68 },
  'GTOpen': { id: 'gt-open', name: 'GT Open', tier: 'pro', repMin: 45, repMax: 65 },
  'GTR_04': { id: 'gtr-04', name: 'GTR 2004', tier: 'elite', repMin: 55, repMax: 75 },

  // PROTOTYPES
  'P1': { id: 'prototype-1', name: 'P1', tier: 'elite', repMin: 65, repMax: 85 },
  'P1Gen2': { id: 'prototype-1-gen2', name: 'P1 Gen2', tier: 'elite', repMin: 68, repMax: 88 },
  'P2': { id: 'prototype-2', name: 'P2', tier: 'pro', repMin: 50, repMax: 70 },
  'P3': { id: 'prototype-3', name: 'P3', tier: 'semi-pro', repMin: 35, repMax: 55 },
  'P4': { id: 'prototype-4', name: 'P4', tier: 'amateur', repMin: 20, repMax: 38 },
  'LMP1_05': { id: 'lmp1-05', name: 'LMP1 2005', tier: 'elite', repMin: 62, repMax: 82 },
  'LMP2_05': { id: 'lmp2-05', name: 'LMP2 2005', tier: 'pro', repMin: 48, repMax: 68 },
  'LMP2_Gen1': { id: 'lmp2-gen1', name: 'LMP2 Gen1', tier: 'pro', repMin: 50, repMax: 70 },
  'LMP2': { id: 'lmp2', name: 'LMP2', tier: 'pro', repMin: 52, repMax: 72 },
  'LMDh': { id: 'lmdh', name: 'LMDh', tier: 'elite', repMin: 65, repMax: 85 },
  'DPI': { id: 'dpi', name: 'DPI', tier: 'elite', repMin: 62, repMax: 82 },
  'Hypercars': { id: 'hypercar', name: 'Hypercar', tier: 'pinnacle', repMin: 80, repMax: 98 },
  'Group C': { id: 'group-c', name: 'Group C', tier: 'elite', repMin: 60, repMax: 80 },

  // STOCK CARS BRAZIL
  'StockCarV8': { id: 'stock-car-v8', name: 'Stock Car V8', tier: 'pro', repMin: 50, repMax: 75 },
  'StockCarV8_2020': { id: 'stock-car-2020', name: 'Stock Car 2020', tier: 'pro', repMin: 52, repMax: 76 },
  'StockCarV8_2021': { id: 'stock-car-2021', name: 'Stock Car 2021', tier: 'pro', repMin: 53, repMax: 77 },
  'StockCarV8_2022': { id: 'stock-car-2022', name: 'Stock Car 2022', tier: 'pro', repMin: 54, repMax: 78 },
  'StockCarV8_2023': { id: 'stock-car-2023', name: 'Stock Car 2023', tier: 'elite', repMin: 55, repMax: 80 },
  'StockCarV8_2024': { id: 'stock-car-2024', name: 'Stock Car 2024', tier: 'elite', repMin: 58, repMax: 82 },
  'StockCar99': { id: 'stock-car-99', name: 'Stock Car 1999', tier: 'semi-pro', repMin: 35, repMax: 55 },
  'OldStock': { id: 'old-stock', name: 'Old Stock', tier: 'amateur', repMin: 15, repMax: 30 },

  // TOURING CARS
  'Group A': { id: 'group-a', name: 'Group A', tier: 'pro', repMin: 45, repMax: 65 },
  'Supercars': { id: 'supercars', name: 'Supercars', tier: 'elite', repMin: 60, repMax: 80 },
  'SuperV8': { id: 'super-v8', name: 'Super V8', tier: 'elite', repMin: 58, repMax: 78 },
  'Procar': { id: 'procar', name: 'ProCar', tier: 'pro', repMin: 50, repMax: 70 },

  // BRAZILIAN SERIES
  'CopaFusca': { id: 'copa-fusca', name: 'Copa Fusca', tier: 'entry', repMin: 0, repMax: 8 },
  'CopaUno': { id: 'copa-uno', name: 'Copa Uno', tier: 'entry', repMin: 0, repMax: 10 },
  'CopaClassicB': { id: 'copa-classic-b', name: 'Copa Classic B', tier: 'amateur', repMin: 10, repMax: 22 },
  'CopaClassicFL': { id: 'copa-classic-fl', name: 'Copa Classic FL', tier: 'amateur', repMin: 12, repMax: 25 },
  'CopaTruck': { id: 'copa-truck', name: 'Copa Truck', tier: 'semi-pro', repMin: 28, repMax: 48 },
  'Montana': { id: 'montana', name: 'Montana', tier: 'amateur', repMin: 12, repMax: 25 },
  'Opala79': { id: 'opala-79', name: 'Opala 1979', tier: 'amateur', repMin: 15, repMax: 28 },
  'Opala86': { id: 'opala-86', name: 'Opala 1986', tier: 'semi-pro', repMin: 22, repMax: 38 },
  'SprintRace': { id: 'sprint-race', name: 'Sprint Race', tier: 'semi-pro', repMin: 25, repMax: 42 },

  // ONE-MAKE SERIES
  'Carrera Cup': { id: 'carrera-cup', name: 'Carrera Cup', tier: 'semi-pro', repMin: 30, repMax: 50 },
  'Carrera CupB': { id: 'carrera-cup-brasil', name: 'Carrera Cup Brasil', tier: 'semi-pro', repMin: 32, repMax: 52 },
  'Super Trofeo': { id: 'super-trofeo', name: 'Lamborghini Super Trofeo', tier: 'semi-pro', repMin: 35, repMax: 55 },
  'G40Cup': { id: 'g40-cup', name: 'Ginetta G40 Cup', tier: 'entry', repMin: 5, repMax: 18 },
  'G55Supercup': { id: 'g55-supercup', name: 'Ginetta G55 Supercup', tier: 'amateur', repMin: 18, repMax: 35 },
  'MiniChallenge': { id: 'mini-challenge', name: 'Mini Challenge', tier: 'entry', repMin: 5, repMax: 15 },
  'LancerCup': { id: 'lancer-cup', name: 'Lancer Cup', tier: 'amateur', repMin: 12, repMax: 25 },
  'TSICup': { id: 'tsi-cup', name: 'TSI Cup', tier: 'amateur', repMin: 10, repMax: 22 },

  // CATERHAM
  'Cat_Academy': { id: 'caterham-academy', name: 'Caterham Academy', tier: 'entry', repMin: 0, repMax: 10 },
  'Cat_Superlight': { id: 'caterham-superlight', name: 'Caterham Superlight', tier: 'amateur', repMin: 12, repMax: 25 },
  'Cat_Supersport': { id: 'caterham-supersport', name: 'Caterham Supersport', tier: 'amateur', repMin: 15, repMax: 28 },
  'Cat620R': { id: 'caterham-620r', name: 'Caterham 620R', tier: 'semi-pro', repMin: 25, repMax: 42 },

  // AUSSIE RACING CARS / OTHER
  'ARC_Cam': { id: 'arc-camaro', name: 'Aussie Racing Cars Camaro', tier: 'entry', repMin: 5, repMax: 18 },
  'Hot Cars': { id: 'hot-cars', name: 'Hot Cars', tier: 'entry', repMin: 0, repMax: 12 },
  'Street': { id: 'street', name: 'Street', tier: 'entry', repMin: 0, repMax: 10 },
  'RX': { id: 'rallycross', name: 'Rallycross', tier: 'semi-pro', repMin: 28, repMax: 48 },
  'STT': { id: 'stt', name: 'STT', tier: 'amateur', repMin: 15, repMax: 30 },
  'ST96': { id: 'st96', name: 'ST96', tier: 'amateur', repMin: 12, repMax: 25 },
  'TC60S': { id: 'tc60s', name: 'TC 60s', tier: 'amateur', repMin: 18, repMax: 32 },
  'TC60S2': { id: 'tc60s2', name: 'TC 60s 2', tier: 'semi-pro', repMin: 22, repMax: 38 },
  'TC70S': { id: 'tc70s', name: 'TC 70s', tier: 'semi-pro', repMin: 25, repMax: 42 },
  'LES_2025': { id: 'les-2025', name: 'LES 2025', tier: 'amateur', repMin: 15, repMax: 28 },
};

// Team name extraction patterns
function extractTeamName(liveryName) {
  // Pattern: "Team Name - Driver #XX" or "Team Name #XX"
  // Examples:
  // "Eurofarma RC - D.Serra #29" -> "Eurofarma RC"
  // "McLaren 720S GT3 #04" -> "McLaren"
  // "Porsche 911 GT3 R #05" -> "Porsche"
  
  // Remove driver name pattern if present (- X.Name or - Name)
  let teamPart = liveryName.replace(/\s*-\s*[A-Z]\.[A-Za-záéíóúàèìòùäëïöüâêîôûãõç\s'-]+\s*#\d+$/i, '');
  teamPart = teamPart.replace(/\s*-\s*[A-Za-záéíóúàèìòùäëïöüâêîôûãõç\s'-]+\s*#\d+$/i, '');
  
  // Remove car number
  teamPart = teamPart.replace(/\s*#\d+[a-z]?$/i, '').trim();
  
  // For GT cars, extract manufacturer as team base
  const gtPatterns = [
    /^(McLaren)\s+\d+S?\s+GT\d/i,
    /^(Porsche)\s+\d+\s+GT\d/i,
    /^(Mercedes-AMG)\s+GT\d/i,
    /^(Nissan)\s+Nismo\s+GT-?R/i,
    /^(BMW)\s+M\d+\s+GT\d/i,
    /^(Audi)\s+R\d+\s+LMS/i,
    /^(Alpine)\s+A\d+/i,
    /^(AMR|Aston Martin)/i,
    /^(Ginetta)\s+G\d+/i,
    /^(Camaro)\s+GT\d/i,
    /^(Lamborghini)/i,
    /^(Ferrari)/i,
    /^(Corvette)/i,
    /^(Chevrolet)/i,
  ];
  
  for (const pattern of gtPatterns) {
    const match = teamPart.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return teamPart;
}

// Generate a short team name
function generateShortName(teamName) {
  // Special cases
  const specials = {
    'Mercedes-AMG': 'AMG',
    'Eurofarma RC': 'EUR',
    'Crown Racing': 'CRW',
    'Full Time Bassani': 'FTB',
    'Ipiranga Racing': 'IPR',
    'Scuderia Forza': 'FOR',
    'energyX Racing': 'ENX',
    'energyX Faenza': 'ENF',
    'Starward G.P.': 'STW',
    'McLean G.P.': 'MCL',
    'Racing Edge': 'RED',
    'Scuderia Milano': 'MIL',
    'Didcot Racing': 'DID',
    'Team Virystone': 'VIR',
    'DNA-US': 'DNA',
    'RCM Motorsport': 'RCM',
    'KTF Racing': 'KTF',
    'KTF Sports': 'KTF',
    'Pole Motorsport': 'POL',
    'TMG Racing': 'TMG',
    'Cavaleiro Sports': 'CAV',
    'A.Mattheis Vogel': 'AMV',
    'Blau Motorsport': 'BLA',
    'Wokin Garra Racing': 'WGR',
    'MOBIL ALE': 'ALE',
    'ASR': 'ASR',
    'McLaren': 'MCL',
    'Porsche': 'POR',
    'Mercedes-AMG': 'AMG',
    'Nissan': 'NIS',
    'BMW': 'BMW',
    'Audi': 'AUD',
    'Alpine': 'ALP',
    'AMR': 'AMR',
    'Aston Martin': 'AMR',
    'Ginetta': 'GIN',
    'Camaro': 'CAM',
    'Lamborghini': 'LAM',
    'Ferrari': 'FER',
    'Corvette': 'COR',
    'Chevrolet': 'CHV',
    'Brabham': 'BRB',
  };
  
  if (specials[teamName]) {
    return specials[teamName];
  }
  
  // Generate from first letters of words (max 3)
  const words = teamName.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  } else if (words.length === 2) {
    return words[0].substring(0, 2).toUpperCase() + words[1][0].toUpperCase();
  } else {
    return teamName.substring(0, 3).toUpperCase();
  }
}

// Parse a single XML file
function parseXmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const drivers = [];
  
  // Simple regex-based XML parsing
  const driverRegex = /<driver\s+livery_name="([^"]+)">\s*<name>([^<]+)<\/name>\s*<country>([^<]+)<\/country>\s*<\/driver>/gi;
  
  let match;
  while ((match = driverRegex.exec(content)) !== null) {
    drivers.push({
      liveryName: match[1],
      name: match[2].trim(),
      country: match[3].trim()
    });
  }
  
  return drivers;
}

// Main parsing function
function parseAllXmlFiles() {
  const results = {};
  
  // Read all XML files
  const files = fs.readdirSync(CUSTOM_AI_PATH)
    .filter(f => f.endsWith('.xml') && !f.includes('README'));
  
  console.log(`Found ${files.length} XML files to parse...`);
  
  for (const file of files) {
    const className = file.replace('.xml', '');
    const filePath = path.join(CUSTOM_AI_PATH, file);
    
    try {
      const drivers = parseXmlFile(filePath);
      
      if (drivers.length > 0) {
        // Group drivers by team
        const teams = {};
        
        for (const driver of drivers) {
          const teamName = extractTeamName(driver.liveryName);
          
          if (!teams[teamName]) {
            teams[teamName] = {
              name: teamName,
              shortName: generateShortName(teamName),
              liveries: [],
              drivers: []
            };
          }
          
          teams[teamName].liveries.push(driver.liveryName);
          teams[teamName].drivers.push({
            name: driver.name,
            country: driver.country
          });
        }
        
        results[className] = {
          className: className,
          config: CAR_CLASS_CONFIG[className] || { 
            id: className.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: className.replace(/_/g, ' '),
            tier: 'amateur',
            repMin: 15,
            repMax: 35
          },
          teams: Object.values(teams),
          totalDrivers: drivers.length
        };
        
        console.log(`  ${className}: ${Object.keys(teams).length} teams, ${drivers.length} drivers`);
      }
    } catch (err) {
      console.error(`  Error parsing ${file}: ${err.message}`);
    }
  }
  
  return results;
}

// Generate TypeScript output
function generateTypeScript(data) {
  const output = `/**
 * AMS2 Real Teams & Drivers Database
 * Auto-generated from game files
 * Generated: ${new Date().toISOString()}
 */

export type TeamTier = 'entry' | 'amateur' | 'semi-pro' | 'pro' | 'elite' | 'pinnacle';

export interface AMS2Driver {
  name: string;
  country: string;
}

export interface AMS2RealTeam {
  id: string;
  name: string;
  shortName: string;
  carClassId: string;
  carClassName: string;
  liveryNames: string[];
  drivers: AMS2Driver[];
  
  // Career attributes
  tier: TeamTier;
  reputationRequired: number;
  prestige: number;
  budget: 'low' | 'medium' | 'high' | 'factory';
  payDriver: boolean;
  seatCost: number;
  salaryRange: { min: number; max: number };
  color: string;
  country: string;
}

export interface AMS2CarClass {
  id: string;
  name: string;
  tier: TeamTier;
  reputationRange: { min: number; max: number };
  teams: AMS2RealTeam[];
  isModern: boolean;
}

// Team colors by manufacturer/name
const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#FF8700',
  'Porsche': '#D5001C',
  'Mercedes-AMG': '#00D2BE',
  'BMW': '#0066B1',
  'Audi': '#BB0A30',
  'Nissan': '#C3002F',
  'Alpine': '#0090FF',
  'Ferrari': '#DC0000',
  'Lamborghini': '#DDB321',
  'Aston Martin': '#006F62',
  'Corvette': '#F7C600',
  'Ginetta': '#1D428A',
  'Eurofarma RC': '#00A651',
  'Crown Racing': '#FFD700',
  'Ipiranga Racing': '#FF6600',
  'Full Time Bassani': '#E31937',
  'Scuderia Forza': '#DC0000',
  'Starward G.P.': '#00D2BE',
  'energyX Racing': '#1E41FF',
};

function getTeamColor(teamName: string): string {
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamName.includes(key)) return color;
  }
  // Generate consistent color from name hash
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return \`hsl(\${hue}, 70%, 45%)\`;
}

function getTeamCountry(teamName: string, drivers: AMS2Driver[]): string {
  // Try to determine team country from name or majority of drivers
  const countryMap: Record<string, string> = {
    'Eurofarma': 'Brazil',
    'Crown Racing': 'Brazil', 
    'Ipiranga': 'Brazil',
    'Full Time': 'Brazil',
    'KTF': 'Brazil',
    'TMG': 'Brazil',
    'Cavaleiro': 'Brazil',
    'Blau': 'Brazil',
    'McLaren': 'UK',
    'Mercedes': 'Germany',
    'BMW': 'Germany',
    'Audi': 'Germany',
    'Porsche': 'Germany',
    'Ferrari': 'Italy',
    'Lamborghini': 'Italy',
    'Alpine': 'France',
    'Nissan': 'Japan',
    'Ginetta': 'UK',
  };
  
  for (const [key, country] of Object.entries(countryMap)) {
    if (teamName.includes(key)) return country;
  }
  
  // Use majority driver nationality
  const countryCounts: Record<string, number> = {};
  for (const driver of drivers) {
    countryCounts[driver.country] = (countryCounts[driver.country] || 0) + 1;
  }
  const sorted = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    // Map country codes to names
    const codeToName: Record<string, string> = {
      'BRA': 'Brazil', 'GBR': 'UK', 'DEU': 'Germany', 'USA': 'USA',
      'FRA': 'France', 'ITA': 'Italy', 'ESP': 'Spain', 'JPN': 'Japan',
      'AUS': 'Australia', 'NLD': 'Netherlands', 'BEL': 'Belgium',
      'AUT': 'Austria', 'PRT': 'Portugal', 'CHE': 'Switzerland',
      'MEX': 'Mexico', 'ARG': 'Argentina', 'CAN': 'Canada',
      'NZL': 'New Zealand', 'DNK': 'Denmark', 'SWE': 'Sweden',
      'NOR': 'Norway', 'FIN': 'Finland', 'POL': 'Poland',
      'CHN': 'China', 'KOR': 'South Korea', 'THA': 'Thailand',
      'MCO': 'Monaco', 'RUS': 'Russia', 'COL': 'Colombia',
    };
    return codeToName[sorted[0][0]] || sorted[0][0];
  }
  
  return 'International';
}

// Modern classes that can be used for career seasons
const MODERN_CLASS_IDS = new Set([
  'kart-rental', 'kart-gx390', 'kart-125cc', 'kart-shifter', 'superkart',
  'formula-vee', 'formula-vee-gen2', 'formula-trainer', 'formula-trainer-advanced',
  'formula-3', 'formula-reiza', 'formula-ultimate', 'formula-ultimate-gen2',
  'formula-usa-2023',
  'gt3', 'gt3-gen2', 'gt4', 'gte',
  'prototype-1', 'prototype-1-gen2', 'prototype-2', 'prototype-3', 'prototype-4',
  'lmp2', 'lmdh', 'dpi', 'hypercar',
  'stock-car-2024', 'stock-car-2023', 'stock-car-2022',
  'supercars', 'super-v8',
  'carrera-cup', 'carrera-cup-brasil', 'super-trofeo',
  'g40-cup', 'g55-supercup', 'mini-challenge',
  'caterham-academy', 'caterham-superlight', 'caterham-supersport', 'caterham-620r',
  'rallycross',
]);

${Object.entries(data).map(([className, classData]) => {
  const config = classData.config;
  
  return `
// ============================================
// ${config.name.toUpperCase()}
// ============================================
const ${className.replace(/[^a-zA-Z0-9]/g, '_')}_TEAMS: AMS2RealTeam[] = [
${classData.teams.map((team, index) => {
  const repRequired = config.repMin + Math.floor((config.repMax - config.repMin) * (1 - index / Math.max(1, classData.teams.length - 1)));
  const prestige = 100 - Math.floor((100 - 30) * (index / Math.max(1, classData.teams.length)));
  const budget = index < classData.teams.length * 0.2 ? 'factory' : 
                 index < classData.teams.length * 0.4 ? 'high' : 
                 index < classData.teams.length * 0.7 ? 'medium' : 'low';
  const payDriver = ['entry', 'amateur', 'semi-pro', 'professional'].includes(config.tier) && budget !== 'factory';
  
  // Realistic seat costs by tier (full season, USD)
  const seatCostByTier = {
    'entry': 25000,        // $20-40K for karting/academy
    'amateur': 75000,      // $50-100K for Caterham/GT5
    'semi-pro': 200000,    // $150-300K for GT4/Carrera Cup
    'professional': 350000, // $250-500K for GT3 Pro-Am
    'pro': 400000,         // $300-600K (some still pay)
    'elite': 0,            // Factory-supported
    'pinnacle': 0,         // Factory team
  };
  const baseSeatCost = seatCostByTier[config.tier] || 25000;
  const prestigeMultiplier = 0.7 + (prestige / 100) * 0.6;
  const seatCost = payDriver ? Math.round(baseSeatCost * prestigeMultiplier) : 0;
  
  // Realistic salary ranges by tier (annual, USD)
  const salaryRangeByTier = {
    'entry': { min: 0, max: 0 },
    'amateur': { min: 0, max: 0 },
    'semi-pro': { min: 0, max: 50000 },
    'professional': { min: 30000, max: 150000 },
    'pro': { min: 80000, max: 350000 },
    'elite': { min: 200000, max: 800000 },
    'pinnacle': { min: 500000, max: 3000000 },
  };
  const baseRange = salaryRangeByTier[config.tier] || { min: 0, max: 0 };
  const prestigeFactor = prestige / 100;
  const salaryMin = payDriver ? 0 : Math.round(baseRange.min * (0.8 + prestigeFactor * 0.4));
  const salaryMax = payDriver ? 0 : Math.round(baseRange.max * (0.8 + prestigeFactor * 0.4));
  
  return `  {
    id: '${config.id}-${team.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}',
    name: '${team.name.replace(/'/g, "\\'")}',
    shortName: '${team.shortName}',
    carClassId: '${config.id}',
    carClassName: '${config.name}',
    liveryNames: ${JSON.stringify(team.liveries)},
    drivers: ${JSON.stringify(team.drivers)},
    tier: '${config.tier}' as TeamTier,
    reputationRequired: ${repRequired},
    prestige: ${prestige},
    budget: '${budget}' as const,
    payDriver: ${payDriver},
    seatCost: ${seatCost},
    salaryRange: { min: ${salaryMin}, max: ${salaryMax} },
    color: getTeamColor('${team.name.replace(/'/g, "\\'")}'),
    country: getTeamCountry('${team.name.replace(/'/g, "\\'")}', ${JSON.stringify(team.drivers)}),
  }`;
}).join(',\n')}
];
`;
}).join('\n')}

// Export all car classes with their teams
export const AMS2_CAR_CLASSES: AMS2CarClass[] = [
${Object.entries(data).map(([className, classData]) => {
  const config = classData.config;
  const varName = className.replace(/[^a-zA-Z0-9]/g, '_');
  return `  {
    id: '${config.id}',
    name: '${config.name}',
    tier: '${config.tier}' as TeamTier,
    reputationRange: { min: ${config.repMin}, max: ${config.repMax} },
    teams: ${varName}_TEAMS,
    isModern: MODERN_CLASS_IDS.has('${config.id}'),
  }`;
}).join(',\n')}
];

// Helper functions
export function getAllTeams(): AMS2RealTeam[] {
  return AMS2_CAR_CLASSES.flatMap(c => c.teams);
}

export function getTeamById(id: string): AMS2RealTeam | undefined {
  return getAllTeams().find(t => t.id === id);
}

export function getTeamsForClass(classId: string): AMS2RealTeam[] {
  const carClass = AMS2_CAR_CLASSES.find(c => c.id === classId);
  return carClass?.teams ?? [];
}

export function getTeamsByTier(tier: TeamTier): AMS2RealTeam[] {
  return getAllTeams().filter(t => t.tier === tier);
}

export function getTeamsForReputation(reputation: number): AMS2RealTeam[] {
  return getAllTeams().filter(t => t.reputationRequired <= reputation);
}

export function getCarClassById(classId: string): AMS2CarClass | undefined {
  return AMS2_CAR_CLASSES.find(c => c.id === classId);
}

export function getModernCarClasses(): AMS2CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => c.isModern);
}

// Stats
export const TEAMS_STATS = {
  totalClasses: AMS2_CAR_CLASSES.length,
  totalTeams: getAllTeams().length,
  modernClasses: getModernCarClasses().length,
  byTier: {
    entry: getTeamsByTier('entry').length,
    amateur: getTeamsByTier('amateur').length,
    'semi-pro': getTeamsByTier('semi-pro').length,
    pro: getTeamsByTier('pro').length,
    elite: getTeamsByTier('elite').length,
    pinnacle: getTeamsByTier('pinnacle').length,
  }
};
`;

  return output;
}

// Main execution
function main() {
  console.log('AMS2 Team Parser');
  console.log('================');
  console.log(`AMS2 Path: ${AMS2_PATH}`);
  console.log(`XML Path: ${CUSTOM_AI_PATH}`);
  console.log('');
  
  // Check if path exists
  if (!fs.existsSync(CUSTOM_AI_PATH)) {
    console.error(`ERROR: CustomAIDrivers folder not found at: ${CUSTOM_AI_PATH}`);
    console.error('Please update the AMS2_PATH variable at the top of this script.');
    process.exit(1);
  }
  
  // Parse all files
  const data = parseAllXmlFiles();
  
  // Generate TypeScript
  console.log('');
  console.log('Generating TypeScript output...');
  const tsOutput = generateTypeScript(data);
  
  // Write output file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'ams2-teams-real.ts');
  fs.writeFileSync(outputPath, tsOutput);
  console.log(`Written to: ${outputPath}`);
  
  // Summary
  const totalTeams = Object.values(data).reduce((sum, c) => sum + c.teams.length, 0);
  const totalDrivers = Object.values(data).reduce((sum, c) => sum + c.totalDrivers, 0);
  console.log('');
  console.log('Summary:');
  console.log(`  Car Classes: ${Object.keys(data).length}`);
  console.log(`  Total Teams: ${totalTeams}`);
  console.log(`  Total Drivers: ${totalDrivers}`);
}

main();

