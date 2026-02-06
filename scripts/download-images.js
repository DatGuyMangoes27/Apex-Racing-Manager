/**
 * AMS2 Wiki Image Downloader
 * Downloads all car and track images from the Automobilista 2 wiki
 * 
 * Usage: node scripts/download-images.js [--cars-only] [--tracks-only] [--force]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://automobilista2.wiki.gg/images';
const THUMB_URL = 'https://automobilista2.wiki.gg/images/thumb';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');
const CARS_DIR = path.join(OUTPUT_DIR, 'cars');
const TRACKS_DIR = path.join(OUTPUT_DIR, 'tracks');

// Parse command line arguments
const args = process.argv.slice(2);
const carsOnly = args.includes('--cars-only');
const tracksOnly = args.includes('--tracks-only');
const force = args.includes('--force');

// Car images to download
const CAR_IMAGES = [
  // Karts
  'Kart_4t_rental.jpg',
  'Kart_4t_race.jpg', 
  'Kart_125cc.jpg',
  'Kart_shifter.jpg',
  'Superkart.jpg',
  'Kartcross.jpg',
  
  // Formula
  'F_vee.jpg',
  'F_trainer.jpg',
  'Formula_trainer.jpg',
  'F_trainer_adv.jpg',
  'F3.jpg',
  'F_inter.jpg',
  'F_ultimate.jpg',
  'F_usa_2023.jpg',
  'F_reiza.jpg',
  
  // GT Cars
  'Gt5.jpg',
  'Ginetta_g40.jpg',
  'Cayman_gt5.jpg',
  'Gt4.jpg',
  'Vantage_gt4.jpg',
  'M4_gt4.jpg',
  'Camaro_gt4.jpg',
  'G55_gt4.jpg',
  'Xbow_gt4.jpg',
  'Maserati_gt4.jpg',
  'Mclaren_gt4.jpg',
  'Amg_gt4.jpg',
  'Cayman_gt4_mr.jpg',
  'R8_gt3_v2.jpg',
  'M6_v2.jpg',
  '720s_v2.jpg',
  'Amg_gt3_v2.jpg',
  'Gtr_gt3.jpg',
  '911_gt3r.jpg',
  'Gt3_gen2.jpg',
  'R8_gt3_evo2.jpg',
  'M4_gt3.jpg',
  '296_gt3.jpg',
  'Huracan_gt3_evo2.jpg',
  '720s_gt3_evo.jpg',
  'Amg_gt3_evo.jpg',
  '992_gt3r.jpg',
  'Z06_gt3r.jpg',
  'Gte.jpg',
  'Vantage_gte.jpg',
  'M8_gte.jpg',
  '488_gte.jpg',
  '911_rsr.jpg',
  'Ginetta_g55.jpg',
  'Carrera_cup.jpg',
  'Gt3_cup_38.jpg',
  'Gt3_cup_40.jpg',
  'Super_trofeo.jpg',
  'Caterham_academy.jpg',
  'Caterham_superlight.jpg',
  'Caterham_supersport.jpg',
  'Caterham_620r.jpg',
  'Mini_jcw.jpg',
  
  // Prototypes
  'P4.jpg',
  'Metalmoro_p4.jpg',
  'Sigma_p4.jpg',
  'P3.jpg',
  'Ligier_p3.jpg',
  'Norma_m30.jpg',
  'Ginetta_g57.jpg',
  'P2.jpg',
  'Mcr_2000.jpg',
  'Metalmoro_p2.jpg',
  'Lmp2_gen1.jpg',
  'Oreca_07.jpg',
  'Dallara_p217.jpg',
  'Lmp2_gen2.jpg',
  'Oreca_07_gen2.jpg',
  'Ligier_jsp320.jpg',
  'P1_gen1.jpg',
  'Metalmoro_mg1.jpg',
  'Sigma_p1.jpg',
  'P1_gen2.jpg',
  'Metalmoro_mg1_gen2.jpg',
  'Hypercar.jpg',
  'Gr010.jpg',
  '9x8.jpg',
  '499p.jpg',
  '963.jpg',
  'Cadillac_vlmdh.jpg',
  'Lmdh.jpg',
  'Arx06.jpg',
  'M_hybrid.jpg',
  'Cadillac_lmdh.jpg',
  'Porsche_963.jpg',
  'Sc63.jpg',
  'A424.jpg',
  
  // Touring
  'Tsi_cup.jpg',
  'Golf_tsi.jpg',
  'Virtus_tsi.jpg',
  'Polo_tsi.jpg',
  'Jetta_tsi.jpg',
  'Lancer_cup.jpg',
  'Lancer_rs.jpg',
  'Sprint_race.jpg',
  'Corolla_sr.jpg',
  'Super_v8.jpg',
  'Arc.jpg',
  'Arc_camaro.jpg',
  'Supercar.jpg',
  'Falcon_fg.jpg',
  'Commodore_vf.jpg',
  'Mustang_s550.jpg',
  'Zb_commodore.jpg',
  'Camaro_sc.jpg',
  'Mustang_gen3.jpg',
  
  // Stock Cars
  'Stock_2024.jpg',
  'Cruze_2024.jpg',
  'Corolla_2024.jpg',
  'Stock_2023.jpg',
  'Cruze_2023.jpg',
  'Corolla_2023.jpg',
  'Stock_2022.jpg',
  'Cruze_2022.jpg',
  'Corolla_2022.jpg',
  'Nascar_gen3.jpg',
  'Nascar_gen3_lm.jpg',
  'Nascar_gen2.jpg',
  'Nascar_gen1.jpg',
  'Old_stock.jpg',
  'Opala_old.jpg',
  
  // Rallycross
  'Rallycross.jpg',
  'Fiesta_rx.jpg',
  '208_rx.jpg',
  'Polo_rx.jpg',
  'S1_rx.jpg',
  'Trophy_truck.jpg',
  
  // Road Cars
  'Street_car.jpg',
  'Mclaren_720s.jpg',
  
  // Ligier European
  'Ligier_european.jpg',
  'Ligier_js2r.jpg',
  'Ligier_jsp4.jpg',
  
  // Historic/Vintage
  'F_classic_g1.jpg',
  'Lotus_79.jpg',
  'Brabham_bt46.jpg',
  'F_classic_g2.jpg',
  'Mp4_4.jpg',
  'Lotus_98t.jpg',
  'F_classic_g3.jpg',
  'Fw14b.jpg',
  'Mp4_6.jpg',
  'F_retro.jpg',
  'F2004.jpg',
  'Mp4_20.jpg',
  'Group_c.jpg',
  'Porsche_962c.jpg',
  'Xjr9.jpg',
  'Sauber_c9.jpg',
  'R89c.jpg',
  'Group_a.jpg',
  'Mercedes_190e.jpg',
  'M3_e30.jpg',
  'Alfa_155.jpg',
  'Gt1.jpg',
  'F1_gtr.jpg',
  'Clk_gtr.jpg',
  '911_gt1.jpg',
  'R390.jpg',
  'Gt1_2005.jpg',
  'Mc12_gt1.jpg',
  'S7r.jpg',
  'C6r_gt1.jpg',
  'Dbr9.jpg',
  '550_maranello.jpg',
  'Gt2_2005.jpg',
  'F430_gt2.jpg',
  '996_rsr.jpg',
  'Gt_open.jpg',
  '458_gt_open.jpg',
  '997_gt_open.jpg',
  'Gt_classic.jpg',
  '512m.jpg',
  '917k.jpg',
  'Gt40.jpg',
  'Lmp1_2005.jpg',
  'Audi_r8_lmp.jpg',
  'C60.jpg',
  'Zytek_05s.jpg',
  'Lmp2_2005.jpg',
  'Lola_b05.jpg',
  'Sr9.jpg',
  'Gtr_2004.jpg',
  '575_gtc.jpg',
  'M1_procar.jpg',
  'Hot_cars.jpg',
  'Opala_hot.jpg',
  'Maverick_hot.jpg',
  'Passat_hot.jpg',
  'Charger_hot.jpg',
  'Stock_1979.jpg',
  'Opala_1979.jpg',
  'Stock_1986.jpg',
  'Opala_1986.jpg',
  'Stock_1999.jpg',
  'Omega_1999.jpg',
  'Vtc_t1.jpg',
  'Capri_vtc.jpg',
  'Bmw_csl.jpg',
  'Carrera_rsr.jpg',
  'Vtc_t2.jpg',
  'Mini_65.jpg',
  'Alfa_gta.jpg',
  'Copa_classic_b.jpg',
  'Chevette_classic.jpg',
  'Uno_classic.jpg',
  'Gol_classic.jpg',
  'Passat_classic.jpg',
  'Mini_classic.jpg',
  'Puma_gte.jpg',
  'Copa_classic_fl.jpg',
  'Puma_gtb.jpg',
  'Diablo.jpg',
  'Miura.jpg',
  'S_004858.jpg',
  'S_160307.jpg',
  'S_232255.jpg',
  'S_234740.jpg'
];

// Track images to download
const TRACK_IMAGES = [
  'Adelaide.jpg',
  'Ascurra.jpg',
  'Azure_circuit.jpg',
  'Barcelona.jpg',
  'Bathurst.jpg',
  'Brands_hatch.jpg',
  'Brasilia.jpg',
  'Buenos_aires.jpg',
  'Buskerud.jpg',
  'Cadwell_park.jpg',
  'Campo_grande.jpg',
  'Cascavel.jpg',
  'Cleveland.jpg',
  'Cordoba.jpg',
  'Curitiba.jpg',
  'Curvelo.jpg',
  'Daytona.jpg',
  'Donington.jpg',
  'Estoril.jpg',
  'Fontana.jpg',
  'Foz.jpg',
  'Galeao.jpg',
  'Gateway.jpg',
  'Goiania.jpg',
  'Granja_viana.jpg',
  'Guapore.jpg',
  'Hockenheim.jpg',
  'Hockenheimring.jpg',
  'Ibarra.jpg',
  'Imola.jpg',
  'Indianapolis.jpg',
  'Interlagos.jpg',
  'Jacarepagua.jpg',
  'Jerez.jpg',
  'Kansai.jpg',
  'Suzuka.jpg',
  'Kyalami.jpg',
  'Laguna_seca.jpg',
  'Le_mans.jpg',
  'Londrina.jpg',
  'Long_beach.jpg',
  'Montreal.jpg',
  'Monza.jpg',
  'Mosport.jpg',
  'Nurburgring.jpg',
  'Ortona.jpg',
  'Oulton_park.jpg',
  'Pocono.jpg',
  'Road_america.jpg',
  'Road_atlanta.jpg',
  'Salvador.jpg',
  'Santa_cruz.jpg',
  'Sebring.jpg',
  'Silverstone.jpg',
  'Snetterton.jpg',
  'Spa.jpg',
  'Spa_francorchamps.jpg',
  'Speedland.jpg',
  'Spielberg.jpg',
  'Red_bull_ring.jpg',
  'Taruma.jpg',
  'Termas.jpg',
  'Tykki.jpg',
  'Velo_citta.jpg',
  'Velopark.jpg',
  'Vir.jpg',
  'Virginia.jpg',
  'Watkins_glen.jpg'
];

// Create directories
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Download a single file
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(outputPath);
        downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Download with retry and alternative URLs
async function downloadWithRetry(filename, outputDir, retries = 2) {
  const outputPath = path.join(outputDir, filename);
  
  // Skip if exists and not forcing
  if (!force && fs.existsSync(outputPath)) {
    console.log(`  \x1b[33mSkipping (exists): ${filename}\x1b[0m`);
    return true;
  }
  
  // URLs to try - wiki.gg uses thumb URLs with size prefixes
  const urls = [
    // Primary: Thumbnail at 1280px width
    `${THUMB_URL}/${filename}/1280px-${filename}`,
    // Direct file access
    `${BASE_URL}/${filename}`,
    // With cache buster
    `${BASE_URL}/${filename}?format=original`,
    // Thumbnail at 800px width (fallback)
    `${THUMB_URL}/${filename}/800px-${filename}`,
    // Lowercase version
    `${THUMB_URL}/${filename.toLowerCase()}/1280px-${filename.toLowerCase()}`,
    // Try with spaces encoded
    `${THUMB_URL}/${filename.replace(/_/g, ' ')}/1280px-${filename.replace(/_/g, ' ')}`,
    // PNG variant
    `${THUMB_URL}/${filename.replace('.jpg', '.png')}/1280px-${filename.replace('.jpg', '.png')}`
  ];
  
  for (const url of urls) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`  \x1b[36mDownloading: ${filename}\x1b[0m`);
        await downloadFile(url, outputPath);
        console.log(`    \x1b[32mSuccess!\x1b[0m`);
        return true;
      } catch (err) {
        if (attempt === retries - 1) {
          // Last attempt for this URL, continue to next URL
          continue;
        }
        // Wait before retry
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  
  console.log(`    \x1b[31mFailed: ${filename}\x1b[0m`);
  return false;
}

// Main function
async function main() {
  console.log('\n\x1b[35m========================================\x1b[0m');
  console.log('\x1b[35mAMS2 Wiki Image Downloader\x1b[0m');
  console.log('\x1b[35m========================================\x1b[0m\n');
  
  ensureDir(OUTPUT_DIR);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  // Download car images
  if (!tracksOnly) {
    console.log('\n\x1b[35m--- Downloading Car Images ---\x1b[0m\n');
    ensureDir(CARS_DIR);
    
    let success = 0;
    let failed = 0;
    
    for (const image of CAR_IMAGES) {
      const result = await downloadWithRetry(image, CARS_DIR);
      if (result) success++;
      else failed++;
      
      // Small delay between downloads
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\n\x1b[${failed === 0 ? '32' : '33'}mCar Images: ${success} success, ${failed} failed\x1b[0m`);
    totalSuccess += success;
    totalFailed += failed;
  }
  
  // Download track images
  if (!carsOnly) {
    console.log('\n\x1b[35m--- Downloading Track Images ---\x1b[0m\n');
    ensureDir(TRACKS_DIR);
    
    let success = 0;
    let failed = 0;
    
    for (const image of TRACK_IMAGES) {
      const result = await downloadWithRetry(image, TRACKS_DIR);
      if (result) success++;
      else failed++;
      
      // Small delay between downloads
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\n\x1b[${failed === 0 ? '32' : '33'}mTrack Images: ${success} success, ${failed} failed\x1b[0m`);
    totalSuccess += success;
    totalFailed += failed;
  }
  
  console.log('\n\x1b[32m========================================\x1b[0m');
  console.log(`\x1b[32mDownload Complete!\x1b[0m`);
  console.log(`Total: ${totalSuccess} success, ${totalFailed} failed`);
  console.log(`\x1b[32m========================================\x1b[0m\n`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);

