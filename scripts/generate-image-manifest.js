/**
 * Generate image manifest for car liveries and tracks
 * This creates a JSON file listing all available images
 * 
 * Run: node scripts/generate-image-manifest.js
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'image-manifest.json');

function getFilesRecursive(dir, baseDir = dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.isDirectory()) {
      results.push(...getFilesRecursive(fullPath, baseDir));
    } else if (item.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      results.push(relativePath.replace(/\\/g, '/'));
    }
  }
  
  return results;
}

function generateManifest() {
  console.log('Generating image manifest...\n');
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    cars: {},
    flat: [],  // Flat files directly in cars folder
    tracks: []
  };
  
  // Process car images
  const carsDir = path.join(IMAGES_DIR, 'cars');
  if (fs.existsSync(carsDir)) {
    const items = fs.readdirSync(carsDir, { withFileTypes: true });
    
    // Separate folders from flat files
    const carFolders = items.filter(d => d.isDirectory()).map(d => d.name);
    const flatFiles = items
      .filter(d => d.isFile() && d.name.match(/\.(png|jpg|jpeg|webp)$/i))
      .map(d => d.name);
    
    console.log(`Found ${carFolders.length} car class folders:`);
    
    // Process subfolders (legacy structure)
    for (const folder of carFolders) {
      const folderPath = path.join(carsDir, folder);
      const files = fs.readdirSync(folderPath)
        .filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
      
      if (files.length > 0) {
        manifest.cars[folder] = files;
        console.log(`  ${folder}: ${files.length} liveries`);
      }
    }
    
    // Process flat files (new structure)
    if (flatFiles.length > 0) {
      manifest.flat = flatFiles;
      console.log(`\nFound ${flatFiles.length} flat livery files in cars folder`);
    }
  }
  
  // Process track images
  const tracksDir = path.join(IMAGES_DIR, 'tracks');
  if (fs.existsSync(tracksDir)) {
    const trackFiles = fs.readdirSync(tracksDir)
      .filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
    
    manifest.tracks = trackFiles;
    console.log(`\nFound ${trackFiles.length} track images`);
  }
  
  // Write manifest
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${OUTPUT_FILE}`);
  
  // Summary
  const totalFolderCars = Object.values(manifest.cars).reduce((sum, arr) => sum + arr.length, 0);
  const totalCars = totalFolderCars + manifest.flat.length;
  console.log(`\n=== Summary ===`);
  console.log(`Car class folders: ${Object.keys(manifest.cars).length}`);
  console.log(`Folder liveries: ${totalFolderCars}`);
  console.log(`Flat liveries: ${manifest.flat.length}`);
  console.log(`Total car liveries: ${totalCars}`);
  console.log(`Track images: ${manifest.tracks.length}`);
}

generateManifest();









