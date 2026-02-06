/**
 * Generator 3: Drivers Batch 3 (IDs 1701-2030) + Rookie Pool (500)
 * Run in parallel with other generators
 */

import 'dotenv/config';
import ora from 'ora';
import chalk from 'chalk';
import { extractDrivers, COUNTRY_NAMES, APPEARANCE_BY_REGION } from '../lib/data-reader.js';
import { generateDriverProfile } from '../lib/profile-generator.js';
import { GeminiClient } from '../lib/gemini-client.js';
import { loadManifest, saveManifest, addDriver, assetExists, saveProfiles } from '../lib/manifest.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../../public/images/generated');

const BATCH_START = 1700;
const ROOKIE_COUNT = 500;
const GENERATOR_NAME = 'GEN3-DRIVERS-C';

// Generate rookie pool drivers
function generateRookiePool(count) {
  const rookies = [];
  const countries = Object.keys(COUNTRY_NAMES);
  const firstNames = {
    male: ['Alex', 'Max', 'Lucas', 'Oscar', 'Liam', 'Noah', 'Oliver', 'James', 'Leo', 'Jack', 'Carlos', 'Pedro', 'Marco', 'Yuki', 'Zhou', 'Kimi', 'Mika', 'Nico', 'Pierre', 'Charles'],
    female: ['Maya', 'Sofia', 'Emma', 'Olivia', 'Mia', 'Luna', 'Chloe', 'Aria', 'Zoe', 'Lily', 'Isabella', 'Valentina', 'Camila', 'Yuna', 'Hana', 'Nina', 'Eva', 'Clara', 'Sara', 'Anna']
  };
  const lastNames = ['Silva', 'Smith', 'Mueller', 'Rossi', 'Garcia', 'Martinez', 'Anderson', 'Williams', 'Brown', 'Jones', 'Wilson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Nakamura', 'Tanaka', 'Kim', 'Park', 'Chen', 'Wang', 'Petrov', 'Novak', 'Fernandez', 'Lopez'];

  for (let i = 0; i < count; i++) {
    const isFemale = Math.random() < 0.15; // 15% female rookies
    const names = isFemale ? firstNames.female : firstNames.male;
    const firstName = names[Math.floor(Math.random() * names.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    rookies.push({
      id: `rookie-${String(i + 1).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      country,
      teams: [],
      isRookie: true,
      gender: isFemale ? 'female' : 'male'
    });
  }
  
  return rookies;
}

async function main() {
  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME}: Drivers Batch 3 + Rookies`));
  console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('✗ GEMINI_API_KEY not found in .env'));
    process.exit(1);
  }

  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  const manifest = await loadManifest();
  
  // Extract remaining drivers
  const spinner = ora('Loading driver data...').start();
  const allDrivers = await extractDrivers();
  const batchDrivers = allDrivers.slice(BATCH_START);
  spinner.succeed(`Loaded ${batchDrivers.length} remaining drivers`);

  // Generate rookie pool
  spinner.start('Generating rookie pool...');
  const rookies = generateRookiePool(ROOKIE_COUNT);
  spinner.succeed(`Generated ${rookies.length} rookie drivers`);

  // Combine both sets
  const allBatchDrivers = [...batchDrivers, ...rookies];

  // Generate profiles
  spinner.start('Generating driver profiles...');
  const profiles = allBatchDrivers.map(d => {
    const profile = generateDriverProfile(d, d.isRookie ? 'entry' : 'professional');
    if (d.gender) profile.gender = d.gender;
    if (d.isRookie) {
      profile.age = 16 + Math.floor(Math.random() * 6); // 16-21 for rookies
      profile.careerStage = 'rookie';
      // Update prompt for rookies
      profile.portraitPrompt = `Professional motorsport portrait photograph of a ${profile.age}-year-old ${profile.nationality} ${d.gender || 'male'} racing driver. Young rookie, fresh-faced and eager. ${profile.physical.description}. Determined, ambitious expression. Wearing a racing suit. High quality professional headshot, studio lighting, neutral gray background. Photorealistic.`;
    }
    return profile;
  });
  await saveProfiles(profiles, `drivers-batch3-rookies.json`);
  spinner.succeed(`Generated ${profiles.length} driver profiles (${batchDrivers.length} regular + ${rookies.length} rookies)`);

  // Generate portraits
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(chalk.yellow(`\n📷 Generating ${profiles.length} driver portraits...\n`));

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const outputPath = `portraits/drivers/${profile.id}.png`;
    const fullPath = path.join(OUTPUT_DIR, outputPath);

    // Skip if already exists
    if (assetExists(manifest, 'drivers', profile.id)) {
      skipped++;
      continue;
    }

    const progress = `[${i + 1}/${profiles.length}]`;
    const rookieTag = profile.id.startsWith('rookie') ? chalk.magenta('[ROOKIE] ') : '';
    process.stdout.write(`${progress} ${rookieTag}${profile.name} (${profile.nationality}, ${profile.age}yo)... `);

    try {
      const imageData = await client.generateImage(profile.portraitPrompt, {
        aspectRatio: '1:1'
      });
      await client.saveImage(imageData, fullPath);
      addDriver(manifest, profile, outputPath);
      
      if (generated % 10 === 0) {
        await saveManifest(manifest);
      }
      
      console.log(chalk.green('✓'));
      generated++;
    } catch (error) {
      console.log(chalk.red(`✗ ${error.message}`));
      failed++;
    }
  }

  await saveManifest(manifest);

  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME} COMPLETE`));
  console.log(chalk.cyan(`${'═'.repeat(60)}`));
  console.log(`  Generated: ${chalk.green(generated)}`);
  console.log(`  Skipped:   ${chalk.yellow(skipped)}`);
  console.log(`  Failed:    ${chalk.red(failed)}`);
  console.log(`  Cost:      ~$${(generated * 0.03).toFixed(2)}`);
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
