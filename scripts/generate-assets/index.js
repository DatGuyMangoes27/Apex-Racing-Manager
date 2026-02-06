/**
 * Career Mod Asset Generator
 * 
 * Standalone tool to generate all visual assets using Gemini API (Imagen + Veo)
 * Run this independently while developing - assets are saved to public/images/
 */

import 'dotenv/config';
import { program } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { GeminiClient } from './lib/gemini-client.js';
import { generatePortraits } from './generators/portraits.js';
import { generateLogos } from './generators/logos.js';
import { generateVenues } from './generators/venues.js';
import { generateVideos } from './generators/videos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public/images/generated');

// ASCII art banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏎️  CAREER MOD ASSET GENERATOR                              ║
║                                                               ║
║   Powered by Gemini API (Imagen 3/4 + Veo 3.1)               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

async function ensureDirectories() {
  const dirs = [
    path.join(OUTPUT_DIR, 'avatars/drivers'),
    path.join(OUTPUT_DIR, 'avatars/staff/team'),
    path.join(OUTPUT_DIR, 'avatars/staff/facility'),
    path.join(OUTPUT_DIR, 'avatars/staff/personal'),
    path.join(OUTPUT_DIR, 'logos/sponsors'),
    path.join(OUTPUT_DIR, 'logos/manufacturers'),
    path.join(OUTPUT_DIR, 'logos/banks'),
    path.join(OUTPUT_DIR, 'logos/teams'),
    path.join(OUTPUT_DIR, 'venues'),
    path.join(OUTPUT_DIR, 'cutscenes'),
    path.join(OUTPUT_DIR, 'ui/backgrounds'),
    path.join(OUTPUT_DIR, 'ui/badges'),
    path.join(ROOT_DIR, 'public/videos/backgrounds'),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function loadProgress() {
  const progressFile = path.join(__dirname, '.progress.json');
  try {
    const data = await fs.readFile(progressFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { completed: [], failed: [], lastRun: null };
  }
}

async function saveProgress(progress) {
  const progressFile = path.join(__dirname, '.progress.json');
  await fs.writeFile(progressFile, JSON.stringify(progress, null, 2));
}

async function main() {
  console.log(chalk.cyan(banner));

  program
    .name('generate-assets')
    .description('Generate visual assets for Career Mod using AI')
    .version('1.0.0')
    .option('-t, --type <type>', 'Asset type: portraits, logos, venues, videos, all', 'all')
    .option('-c, --category <category>', 'Subcategory: drivers, staff, sponsors, manufacturers, banks')
    .option('-l, --limit <number>', 'Limit number of assets to generate', parseInt)
    .option('-r, --resume', 'Resume from last progress', false)
    .option('-d, --dry-run', 'Show what would be generated without calling API', false)
    .option('-v, --verbose', 'Verbose output', false)
    .parse();

  const options = program.opts();

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('❌ GEMINI_API_KEY not found in .env file'));
    process.exit(1);
  }

  console.log(chalk.green('✓ API key loaded'));
  console.log(chalk.dim(`  Output directory: ${OUTPUT_DIR}`));
  console.log();

  // Initialize
  await ensureDirectories();
  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  const progress = options.resume ? await loadProgress() : { completed: [], failed: [], lastRun: null };

  const stats = {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    cost: 0
  };

  try {
    // Run selected generators
    if (options.type === 'all' || options.type === 'portraits') {
      console.log(chalk.yellow('\n📷 GENERATING PORTRAITS\n'));
      const result = await generatePortraits(client, {
        ...options,
        outputDir: OUTPUT_DIR,
        progress,
        category: options.category
      });
      stats.total += result.total;
      stats.generated += result.generated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
      stats.cost += result.cost;
    }

    if (options.type === 'all' || options.type === 'logos') {
      console.log(chalk.yellow('\n🏷️  GENERATING LOGOS\n'));
      const result = await generateLogos(client, {
        ...options,
        outputDir: OUTPUT_DIR,
        progress,
        category: options.category
      });
      stats.total += result.total;
      stats.generated += result.generated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
      stats.cost += result.cost;
    }

    if (options.type === 'all' || options.type === 'venues') {
      console.log(chalk.yellow('\n🏟️  GENERATING VENUES\n'));
      const result = await generateVenues(client, {
        ...options,
        outputDir: OUTPUT_DIR,
        progress
      });
      stats.total += result.total;
      stats.generated += result.generated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
      stats.cost += result.cost;
    }

    if (options.type === 'all' || options.type === 'videos') {
      console.log(chalk.yellow('\n🎬 GENERATING VIDEOS\n'));
      const result = await generateVideos(client, {
        ...options,
        outputDir: path.join(ROOT_DIR, 'public/videos'),
        progress
      });
      stats.total += result.total;
      stats.generated += result.generated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
      stats.cost += result.cost;
    }

    // Save progress
    progress.lastRun = new Date().toISOString();
    await saveProgress(progress);

    // Summary
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════'));
    console.log(chalk.cyan('                    GENERATION COMPLETE'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════\n'));
    console.log(`  Total assets:    ${stats.total}`);
    console.log(chalk.green(`  Generated:       ${stats.generated}`));
    console.log(chalk.dim(`  Skipped:         ${stats.skipped}`));
    console.log(chalk.red(`  Failed:          ${stats.failed}`));
    console.log(chalk.yellow(`  Estimated cost:  $${stats.cost.toFixed(2)}`));
    console.log();

  } catch (error) {
    console.error(chalk.red('\n❌ Generation failed:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
