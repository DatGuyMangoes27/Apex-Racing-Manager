/**
 * Generator 6: Logos (remaining) + Venues + UI Elements
 * Manufacturer Badges (30) + Bank Logos (42) + Championship Logos (52) + Generic Pool (50)
 * Track Venues (252) + Social/Personal/Business Venues (140) + UI (150)
 * Run in parallel with other generators
 */

import 'dotenv/config';
import ora from 'ora';
import chalk from 'chalk';
import { extractManufacturers, extractBanks, extractChampionships, extractTracks } from '../lib/data-reader.js';
import { GeminiClient } from '../lib/gemini-client.js';
import { 
  loadManifest, saveManifest, addManufacturerBadge, addBankLogo, 
  addChampionshipLogo, addTrackVenue, addVenue, addUIElement, assetExists 
} from '../lib/manifest.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../../public/images/generated');

const GENERATOR_NAME = 'GEN6-VENUES-UI';

// Prompt builders
function buildManufacturerPrompt(mfg) {
  const tierStyle = {
    'luxury': 'Elegant, premium luxury automotive brand',
    'premium': 'High-end performance automotive brand',
    'mainstream': 'Established automotive manufacturer',
    'budget': 'Accessible automotive brand'
  };
  return `Automotive manufacturer logo for "${mfg.name}" from ${mfg.country}. ${tierStyle[mfg.tier] || tierStyle.mainstream}. Founded ${mfg.founded || 'decades ago'}. Clean professional badge design suitable for motorsport. Iconic emblem style, no text. Vector design on white background.`;
}

function buildBankPrompt(bank) {
  return `Professional financial institution logo for "${bank.name}". Motorsport-focused bank/finance company. Trustworthy, stable, professional corporate identity. Clean modern design, suitable for sponsor placement. Abstract symbol or monogram, no text. Vector style on white background.`;
}

function buildChampionshipPrompt(champ) {
  const tierDescriptions = {
    'pinnacle': 'Elite world championship series',
    'elite': 'Top-tier professional racing championship',
    'pro': 'Professional racing series',
    'semi-pro': 'Competitive regional championship',
    'amateur': 'Amateur racing series',
    'entry': 'Entry-level racing championship'
  };
  const regionStyle = {
    'Global': 'International world championship feel',
    'Europe': 'European motorsport tradition',
    'Americas': 'American racing heritage',
    'Asia-Pacific': 'Asian motorsport style',
    'Brazil': 'Brazilian racing passion'
  };
  return `Racing championship logo for "${champ.name}". ${tierDescriptions[champ.tier] || 'Professional racing series'}. ${regionStyle[champ.region] || 'International motorsport'}. ${champ.type} series. Dynamic, prestigious championship branding. Trophy or laurel wreath elements. No text, iconic emblem. Vector style on white background.`;
}

function buildTrackPrompt(track, viewType) {
  const viewDescriptions = {
    'aerial': `Aerial bird's eye view photograph of ${track.name} racing circuit in ${track.country}. ${track.type} circuit layout visible from above. High altitude drone shot showing the full track layout, surrounding landscape, grandstands. Cinematic motorsport photography.`,
    'paddock': `Paddock area at ${track.name} racing circuit in ${track.country}. Team garages, hospitality areas, busy race day atmosphere. Professional motorsport photography, vibrant colors.`,
    'grandstand': `Grandstand view at ${track.name} racing circuit in ${track.country}. Spectator perspective overlooking the track, racing action. Crowd atmosphere, race day excitement. Cinematic motorsport photography.`,
    'pitlane': `Pit lane at ${track.name} racing circuit in ${track.country}. Pit boxes, crew activity, cars lined up. Professional motorsport photography showing the technical heart of racing.`
  };
  return viewDescriptions[viewType] || viewDescriptions.aerial;
}

// Venue generators
function generateVenueProfiles() {
  const venues = [];
  
  // Social events
  const socialEvents = [
    'gala_dinner', 'charity_auction', 'sponsor_reception', 'paddock_party', 
    'yacht_party', 'product_launch', 'season_opener', 'championship_celebration',
    'awards_ceremony', 'media_event'
  ];
  socialEvents.forEach((event, i) => {
    venues.push({
      id: `venue-social-${String(i + 1).padStart(3, '0')}`,
      type: 'social',
      subtype: event,
      prompt: `Elegant ${event.replace('_', ' ')} venue for motorsport industry. Luxurious setting, well-dressed guests, sophisticated atmosphere. High-end corporate event photography. Warm lighting, premium decor.`
    });
  });

  // Personal spaces
  const personalSpaces = [
    { type: 'apartment_modest', desc: 'Modern modest city apartment interior' },
    { type: 'apartment_luxury', desc: 'Luxury penthouse apartment with city views' },
    { type: 'house_suburban', desc: 'Comfortable suburban family home interior' },
    { type: 'house_luxury', desc: 'Luxurious mansion interior with high ceilings' },
    { type: 'yacht_interior', desc: 'Luxury yacht interior, nautical elegance' },
    { type: 'private_jet', desc: 'Private jet interior, executive luxury' },
    { type: 'home_office', desc: 'Home office with racing memorabilia' },
    { type: 'gym_personal', desc: 'Personal home gym, fitness equipment' }
  ];
  personalSpaces.forEach((space, i) => {
    for (let j = 0; j < 5; j++) {
      venues.push({
        id: `venue-personal-${String(i * 5 + j + 1).padStart(3, '0')}`,
        type: 'personal',
        subtype: space.type,
        prompt: `${space.desc}. Interior photography, warm inviting atmosphere. High quality architectural photography.`
      });
    }
  });

  // Business venues
  const businessVenues = [
    { type: 'boardroom', desc: 'Corporate boardroom with large table and city views' },
    { type: 'team_hq', desc: 'Racing team headquarters lobby, trophies on display' },
    { type: 'factory_floor', desc: 'Racing car factory floor, cars being built' },
    { type: 'wind_tunnel', desc: 'Aerodynamic wind tunnel facility' },
    { type: 'simulator_room', desc: 'Racing simulator room with professional equipment' },
    { type: 'press_room', desc: 'Press conference room with sponsor backdrop' }
  ];
  businessVenues.forEach((venue, i) => {
    for (let j = 0; j < 5; j++) {
      venues.push({
        id: `venue-business-${String(i * 5 + j + 1).padStart(3, '0')}`,
        type: 'business',
        subtype: venue.type,
        prompt: `${venue.desc}. Professional corporate/industrial photography. Clean modern design, good lighting.`
      });
    }
  });

  return venues;
}

// UI element generators
function generateUIProfiles() {
  const ui = [];
  
  // Achievement badges (simplified - would need more detail in production)
  const achievementTypes = [
    'first_win', 'first_podium', 'first_pole', 'championship', 'perfect_weekend',
    'rookie_of_year', 'comeback', 'milestone_races', 'fan_favorite', 'legend'
  ];
  achievementTypes.forEach((type, i) => {
    for (let j = 0; j < 10; j++) {
      ui.push({
        id: `ui-achievement-${String(i * 10 + j + 1).padStart(3, '0')}`,
        type: 'achievement',
        subtype: type,
        prompt: `Achievement badge icon for "${type.replace('_', ' ')}" in motorsport. Golden/bronze medal style, laurel wreath elements. Clean vector icon design, no text. Celebratory, prestigious achievement symbol.`
      });
    }
  });

  // Trophies
  for (let i = 0; i < 30; i++) {
    const style = ['classic', 'modern', 'ornate'][i % 3];
    ui.push({
      id: `ui-trophy-${String(i + 1).padStart(3, '0')}`,
      type: 'trophy',
      prompt: `${style} motorsport championship trophy. Elegant racing trophy design, silver or gold, with racing motifs. High quality product photography, studio lighting, dark background. Prestigious award.`
    });
  }

  // Loading screens
  for (let i = 0; i < 20; i++) {
    const scenes = ['sunset race', 'night race', 'wet race', 'start grid', 'pit stop', 'podium celebration', 'cockpit view', 'overtake moment', 'speed blur', 'victory lap'];
    ui.push({
      id: `ui-loading-${String(i + 1).padStart(3, '0')}`,
      type: 'loading',
      prompt: `Cinematic ${scenes[i % scenes.length]} motorsport scene. Dramatic lighting, motion blur, high speed racing atmosphere. Widescreen 16:9 composition. Professional motorsport photography, epic and atmospheric.`
    });
  }

  return ui;
}

// Generic logo pool
function generateGenericLogos() {
  const logos = [];
  const styles = ['modern', 'classic', 'aggressive', 'elegant', 'minimalist', 'tech', 'heritage', 'bold', 'dynamic', 'geometric'];
  
  for (let i = 0; i < 50; i++) {
    const style = styles[i % styles.length];
    logos.push({
      id: `logo-generic-${String(i + 1).padStart(3, '0')}`,
      style,
      prompt: `Abstract ${style} racing team logo design. Generic motorsport team identity suitable for player customization. Dynamic shapes, racing aesthetic. No text, iconic emblem. Vector style on white background.`
    });
  }
  
  return logos;
}

async function generateItems(client, manifest, items, category, processItem) {
  let generated = 0, skipped = 0, failed = 0;

  console.log(chalk.yellow(`\n🎨 Generating ${items.length} ${category}...\n`));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await processItem(client, manifest, item, i, items.length);
    
    if (result === 'generated') generated++;
    else if (result === 'skipped') skipped++;
    else failed++;

    if (generated % 10 === 0 && generated > 0) await saveManifest(manifest);
  }

  return { generated, skipped, failed };
}

async function main() {
  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME}: Venues + UI + Remaining Logos`));
  console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('✗ GEMINI_API_KEY not found in .env'));
    process.exit(1);
  }

  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  let manifest = await loadManifest();
  
  if (!manifest.venues) manifest.venues = {};
  if (!manifest.ui) manifest.ui = {};

  const spinner = ora('Loading data...').start();

  const manufacturers = await extractManufacturers();
  const banks = await extractBanks();
  const championships = await extractChampionships();
  const tracks = await extractTracks();
  const venues = generateVenueProfiles();
  const uiElements = generateUIProfiles();
  const genericLogos = generateGenericLogos();

  spinner.succeed(`Loaded: ${manufacturers.length} mfgs, ${banks.length} banks, ${championships.length} champs, ${tracks.length} tracks, ${venues.length} venues, ${uiElements.length} UI, ${genericLogos.length} generic logos`);

  let totalGenerated = 0, totalSkipped = 0, totalFailed = 0;

  // Manufacturer Badges
  console.log(chalk.magenta('\n═══ MANUFACTURER BADGES ═══'));
  let result = await generateItems(client, manifest, manufacturers, 'manufacturer badges', async (c, m, item, i, total) => {
    const outputPath = `logos/manufacturers/${item.id}.png`;
    if (assetExists(m, 'manufacturers', item.id)) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.name}... `);
    try {
      const img = await c.generateImage(buildManufacturerPrompt(item), { aspectRatio: '1:1' });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addManufacturerBadge(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Bank Logos
  console.log(chalk.magenta('\n═══ BANK LOGOS ═══'));
  result = await generateItems(client, manifest, banks, 'bank logos', async (c, m, item, i, total) => {
    const outputPath = `logos/banks/${item.id}.png`;
    if (assetExists(m, 'banks', item.id)) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.name}... `);
    try {
      const img = await c.generateImage(buildBankPrompt(item), { aspectRatio: '1:1' });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addBankLogo(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Championship Logos
  console.log(chalk.magenta('\n═══ CHAMPIONSHIP LOGOS ═══'));
  result = await generateItems(client, manifest, championships, 'championship logos', async (c, m, item, i, total) => {
    const outputPath = `logos/championships/${item.id}.png`;
    if (assetExists(m, 'championships', item.id)) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.name}... `);
    try {
      const img = await c.generateImage(buildChampionshipPrompt(item), { aspectRatio: '1:1' });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addChampionshipLogo(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Generic Logo Pool
  console.log(chalk.magenta('\n═══ GENERIC LOGO POOL ═══'));
  result = await generateItems(client, manifest, genericLogos, 'generic logos', async (c, m, item, i, total) => {
    const outputPath = `logos/generic/${item.id}.png`;
    if (m.ui?.[item.id]) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.style} style... `);
    try {
      const img = await c.generateImage(item.prompt, { aspectRatio: '1:1' });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addUIElement(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Track Venues (4 views each)
  console.log(chalk.magenta('\n═══ TRACK VENUES ═══'));
  const viewTypes = ['aerial', 'paddock', 'grandstand', 'pitlane'];
  for (const track of tracks) {
    for (const viewType of viewTypes) {
      const outputPath = `venues/tracks/${track.id}-${viewType}.png`;
      if (manifest.tracks?.[track.id]?.images?.[viewType]) {
        totalSkipped++;
        continue;
      }
      process.stdout.write(`${track.name} (${viewType})... `);
      try {
        const img = await client.generateImage(buildTrackPrompt(track, viewType), { aspectRatio: '16:9' });
        await client.saveImage(img, path.join(OUTPUT_DIR, outputPath));
        addTrackVenue(manifest, track, viewType, outputPath);
        console.log(chalk.green('✓'));
        totalGenerated++;
        if (totalGenerated % 10 === 0) await saveManifest(manifest);
      } catch (e) {
        console.log(chalk.red(`✗ ${e.message}`));
        totalFailed++;
      }
    }
  }

  // Other Venues
  console.log(chalk.magenta('\n═══ OTHER VENUES ═══'));
  result = await generateItems(client, manifest, venues, 'venue images', async (c, m, item, i, total) => {
    const outputPath = `venues/${item.type}/${item.id}.png`;
    if (m.venues?.[item.id]) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.subtype}... `);
    try {
      const img = await c.generateImage(item.prompt, { aspectRatio: '16:9' });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addVenue(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // UI Elements
  console.log(chalk.magenta('\n═══ UI ELEMENTS ═══'));
  result = await generateItems(client, manifest, uiElements, 'UI elements', async (c, m, item, i, total) => {
    const outputPath = `ui/${item.type}/${item.id}.png`;
    if (m.ui?.[item.id]) return 'skipped';
    process.stdout.write(`[${i + 1}/${total}] ${item.type}... `);
    try {
      const aspectRatio = item.type === 'loading' ? '16:9' : '1:1';
      const img = await c.generateImage(item.prompt, { aspectRatio });
      await c.saveImage(img, path.join(OUTPUT_DIR, outputPath));
      addUIElement(m, item, outputPath);
      console.log(chalk.green('✓'));
      return 'generated';
    } catch (e) { console.log(chalk.red(`✗ ${e.message}`)); return 'failed'; }
  });
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  await saveManifest(manifest);

  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME} COMPLETE`));
  console.log(chalk.cyan(`${'═'.repeat(60)}`));
  console.log(`  Generated: ${chalk.green(totalGenerated)}`);
  console.log(`  Skipped:   ${chalk.yellow(totalSkipped)}`);
  console.log(`  Failed:    ${chalk.red(totalFailed)}`);
  console.log(`  Cost:      ~$${(totalGenerated * 0.03).toFixed(2)}`);
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
