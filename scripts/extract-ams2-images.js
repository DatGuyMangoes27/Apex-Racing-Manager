/**
 * AMS2 Game Image Extractor
 * Extracts and converts DDS images from AMS2 game files to PNG/JPG
 * 
 * Usage: node scripts/extract-ams2-images.js
 * 
 * Requires: npm install sharp @pnpm/parse-dds
 */

const fs = require('fs');
const path = require('path');

// AMS2 installation path
const AMS2_PATH = 'F:\\SteamLibrary\\steamapps\\common\\Automobilista 2';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

// Source folders in AMS2
const SOURCE_FOLDERS = {
  vehicleClasses: path.join(AMS2_PATH, 'GUI', 'VehicleClassLogosHUD'),
  manufacturers: path.join(AMS2_PATH, 'GUI', 'ManufacturerPosters'),
  motorsport: path.join(AMS2_PATH, 'GUI', 'MotorsportBackgrounds'),
  series: path.join(AMS2_PATH, 'GUI', 'SeriesBackgrounds'),
  tracks: path.join(AMS2_PATH, 'GUI', 'MotorsportLogos'),
};

// Output folders
const OUTPUT_FOLDERS = {
  vehicleClasses: path.join(OUTPUT_DIR, 'classes'),
  manufacturers: path.join(OUTPUT_DIR, 'manufacturers'),
  motorsport: path.join(OUTPUT_DIR, 'motorsport'),
  series: path.join(OUTPUT_DIR, 'series'),
  tracks: path.join(OUTPUT_DIR, 'tracks'),
};

// Create directories
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('\x1b[33mNote: sharp is not installed. Installing it will allow direct DDS to PNG conversion.\x1b[0m');
  console.log('Run: npm install sharp\n');
}

// Simple DDS header parser to extract dimensions and raw data
function parseDDSHeader(buffer) {
  // DDS files start with "DDS " magic number
  const magic = buffer.toString('ascii', 0, 4);
  if (magic !== 'DDS ') {
    throw new Error('Not a valid DDS file');
  }

  // Header structure (starting at offset 4)
  const headerSize = buffer.readUInt32LE(4);
  const flags = buffer.readUInt32LE(8);
  const height = buffer.readUInt32LE(12);
  const width = buffer.readUInt32LE(16);
  const pitchOrLinearSize = buffer.readUInt32LE(20);
  const depth = buffer.readUInt32LE(24);
  const mipMapCount = buffer.readUInt32LE(28);

  // Pixel format starts at offset 76
  const pfFlags = buffer.readUInt32LE(80);
  const fourCC = buffer.toString('ascii', 84, 88);

  // Data starts after header (128 bytes for DDS header)
  let dataOffset = 128;
  
  // Check for DX10 extended header
  if (fourCC === 'DX10') {
    dataOffset += 20; // DX10 header is 20 bytes
  }

  return {
    width,
    height,
    fourCC,
    dataOffset,
    format: fourCC || 'RGBA',
  };
}

// Convert DDS to PNG using sharp (handles common formats)
async function convertDDSToPNG(inputPath, outputPath) {
  try {
    const buffer = fs.readFileSync(inputPath);
    const header = parseDDSHeader(buffer);
    
    console.log(`  Processing: ${path.basename(inputPath)} (${header.width}x${header.height}, format: ${header.fourCC || 'uncompressed'})`);
    
    // For DXT1/DXT5 compressed textures, we need special handling
    // Sharp doesn't directly support DDS, so we'll copy as-is for now
    // and note which files need manual conversion
    
    // Just copy the DDS file for now - we'll add conversion later
    const ddsOutputPath = outputPath.replace('.png', '.dds');
    fs.copyFileSync(inputPath, ddsOutputPath);
    console.log(`    Copied to: ${ddsOutputPath}`);
    
    return true;
  } catch (err) {
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
    return false;
  }
}

// Copy DDS files from source to destination
async function copyDDSFiles(sourceDir, destDir, category) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`\x1b[33mSource folder not found: ${sourceDir}\x1b[0m`);
    return { success: 0, failed: 0 };
  }

  ensureDir(destDir);
  
  const files = fs.readdirSync(sourceDir).filter(f => f.toLowerCase().endsWith('.dds'));
  let success = 0;
  let failed = 0;

  console.log(`\n\x1b[35mProcessing ${category}: ${files.length} files\x1b[0m`);

  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    const baseName = path.basename(file, '.dds');
    const outputPath = path.join(destDir, `${baseName}.png`);
    
    const result = await convertDDSToPNG(inputPath, outputPath);
    if (result) success++;
    else failed++;
  }

  return { success, failed };
}

// Generate a mapping file for the images
function generateImageMapping() {
  const mapping = {
    vehicleClasses: {},
    manufacturers: {},
    motorsport: {},
  };

  // Map vehicle class DDS names to our car class IDs
  const classMapping = {
    'GT3': 'gt3',
    'GT3_Gen2': 'gt3-gen2',
    'GT4': 'gt4',
    'GT5': 'gt5',
    'GTE': 'gte',
    'F-Vee': 'formula-vee',
    'F-Trainer': 'formula-trainer',
    'F-Trainer_A': 'formula-trainer-advanced',
    'F-3': 'formula-3',
    'F-Inter': 'formula-inter',
    'F-Ultimate': 'formula-ultimate',
    'F-Ultimate_Gen2': 'formula-ultimate-gen2',
    'F-USA_2023': 'formula-usa-2023',
    'F-Reiza': 'formula-reiza',
    'Kart': 'kart',
    'Kart125cc': 'kart-125cc',
    'KartRental': 'kart-rental',
    'Kartcross': 'kartcross',
    'Superkart': 'superkart',
    'LMP1_05': 'lmp1-2005',
    'LMP2': 'lmp2',
    'LMP2_Gen1': 'lmp2-gen1',
    'LMP3': 'lmp3',
    'P1': 'p1',
    'P1Gen2': 'p1-gen2',
    'P2': 'p2',
    'P3': 'p3',
    'P4': 'p4',
    'Hypercars': 'hypercar',
    'LMDh': 'lmdh',
    'CarreraCup': 'porsche-carrera-cup',
    'SuperTrofeo': 'lamborghini-super-trofeo',
    'G40Cup': 'ginetta-g40-cup',
    'G55Supercup': 'ginetta-g55-supercup',
    'Cat_Academy': 'caterham-academy',
    'Cat_Superlight': 'caterham-superlight',
    'Cat_Supersport': 'caterham-supersport',
    'Cat620R': 'caterham-620r',
    'Mini': 'mini-challenge',
    'TSICup': 'vw-tsi-cup',
    'SprintRace': 'sprint-race',
    'LancerCup': 'lancer-cup',
    'SuperV8': 'super-v8',
    'Supercars': 'v8-supercars',
    'ARC_Cam': 'arc-camaro',
    'StockCarV8_2024': 'stock-car-brasil-2024',
    'StockCarV8_2023': 'stock-car-brasil-2023',
    'StockCarV8_2022': 'stock-car-brasil-2022',
    'Stock_USA_Gen3': 'nascar-cup-gen3',
    'Stock_USA_Gen2': 'nascar-cup-gen2',
    'Stock_USA_Gen1': 'nascar-cup-gen1',
    'OldStock': 'old-stock',
    'RX': 'rallycross',
    'STT': 'super-trophy-truck',
    'Street': 'street-car',
    'GroupA': 'group-a',
    'GroupC': 'group-c',
    'GT1': 'gt1',
    'GT1_05': 'gt1-2005',
    'GT2_05': 'gt2-2005',
    'GTOpen': 'gt-open',
    'GTClassic': 'gt-classic',
    'F-Classic_Gen1': 'f-classic-gen1',
    'F-Classic_Gen2': 'f-classic-gen2',
    'F-Classic_Gen3': 'f-classic-gen3',
    'F-Retro': 'f-retro',
    'F-Vintage_Gen1': 'f-vintage-gen1',
    'F-Vintage_Gen2': 'f-vintage-gen2',
    'Procar': 'm1-procar',
    'HotCars': 'hot-cars',
    'Opala79': 'stock-1979',
    'Opala86': 'stock-1986',
    'StockCar99': 'stock-1999',
    'TC60S': 'vtc-t1',
    'TC70S': 'vtc-t2',
    'CopaClassicB': 'copa-classic-b',
    'CopaClassicFL': 'copa-classic-fl',
    'LES_2025': 'ligier-european-series',
  };

  mapping.vehicleClasses = classMapping;
  return mapping;
}

// Main function
async function main() {
  console.log('\n\x1b[35m========================================\x1b[0m');
  console.log('\x1b[35mAMS2 Image Extractor\x1b[0m');
  console.log('\x1b[35m========================================\x1b[0m');
  console.log(`\nAMS2 Path: ${AMS2_PATH}`);
  console.log(`Output Path: ${OUTPUT_DIR}\n`);

  // Check if AMS2 exists
  if (!fs.existsSync(AMS2_PATH)) {
    console.log('\x1b[31mError: AMS2 installation not found at expected path.\x1b[0m');
    console.log('Please update AMS2_PATH in this script to point to your AMS2 installation.');
    return;
  }

  ensureDir(OUTPUT_DIR);

  let totalSuccess = 0;
  let totalFailed = 0;

  // Process each source folder
  for (const [category, sourceDir] of Object.entries(SOURCE_FOLDERS)) {
    const destDir = OUTPUT_FOLDERS[category];
    const result = await copyDDSFiles(sourceDir, destDir, category);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  // Generate mapping file
  const mapping = generateImageMapping();
  const mappingPath = path.join(OUTPUT_DIR, 'image-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`\nGenerated mapping file: ${mappingPath}`);

  console.log('\n\x1b[32m========================================\x1b[0m');
  console.log(`\x1b[32mExtraction Complete!\x1b[0m`);
  console.log(`Total: ${totalSuccess} success, ${totalFailed} failed`);
  console.log(`\x1b[32m========================================\x1b[0m`);
  
  console.log('\n\x1b[33mNote: DDS files have been copied. To convert to PNG/JPG:\x1b[0m');
  console.log('1. Use GIMP with DDS plugin');
  console.log('2. Use Paint.NET with DDS plugin');
  console.log('3. Use online converter: https://convertio.co/dds-png/');
  console.log('4. Use ImageMagick: magick convert input.dds output.png\n');
}

main().catch(console.error);









