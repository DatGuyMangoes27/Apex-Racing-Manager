/**
 * Generator 2: Drivers Batch 2 (IDs 851-1700)
 * Run in parallel with other generators
 */

import 'dotenv/config';
import ora from 'ora';
import chalk from 'chalk';
import { extractDrivers } from '../lib/data-reader.js';
import { generateDriverProfile } from '../lib/profile-generator.js';
import { GeminiClient } from '../lib/gemini-client.js';
import { loadManifest, saveManifest, addDriver, assetExists, saveProfiles } from '../lib/manifest.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../../public/images/generated');

const BATCH_START = 850;
const BATCH_END = 1700;
const GENERATOR_NAME = 'GEN2-DRIVERS-B';

async function main() {
  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME}: Drivers Batch 2 (${BATCH_START + 1}-${BATCH_END})`));
  console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('✗ GEMINI_API_KEY not found in .env'));
    process.exit(1);
  }

  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  const manifest = await loadManifest();
  
  // Extract all drivers and take our batch
  const spinner = ora('Loading driver data...').start();
  const allDrivers = await extractDrivers();
  const batchDrivers = allDrivers.slice(BATCH_START, BATCH_END);
  spinner.succeed(`Loaded ${batchDrivers.length} drivers for this batch`);

  // Generate profiles for our batch
  spinner.start('Generating driver profiles...');
  const profiles = batchDrivers.map(d => generateDriverProfile(d, 'professional'));
  await saveProfiles(profiles, `drivers-batch2.json`);
  spinner.succeed(`Generated ${profiles.length} driver profiles`);

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
    process.stdout.write(`${progress} ${profile.name} (${profile.nationality}, ${profile.age}yo)... `);

    try {
      const imageData = await client.generateImage(profile.portraitPrompt, {
        aspectRatio: '1:1'
      });
      await client.saveImage(imageData, fullPath);
      addDriver(manifest, profile, outputPath);
      
      // Save manifest periodically
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

  // Final save
  await saveManifest(manifest);

  // Summary
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
