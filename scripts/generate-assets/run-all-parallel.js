/**
 * Parallel Asset Generator Launcher
 * Runs all 6 generators simultaneously for maximum speed
 * 
 * Usage: node run-all-parallel.js
 * 
 * Each generator runs in its own process and writes to the shared manifest.
 * Total generation time: ~2-3 hours (vs ~12 hours sequential)
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATORS = [
  { name: 'GEN1', file: 'gen1-drivers-batch1.js', desc: 'Drivers A (1-850)' },
  { name: 'GEN2', file: 'gen2-drivers-batch2.js', desc: 'Drivers B (851-1700)' },
  { name: 'GEN3', file: 'gen3-drivers-batch3.js', desc: 'Drivers C + Rookies' },
  { name: 'GEN4', file: 'gen4-personal-life.js', desc: 'Personal Life' },
  { name: 'GEN5', file: 'gen5-staff-business.js', desc: 'Staff + Business + Logos' },
  { name: 'GEN6', file: 'gen6-venues-ui.js', desc: 'Venues + UI' }
];

const colors = [
  chalk.red,
  chalk.green,
  chalk.yellow,
  chalk.blue,
  chalk.magenta,
  chalk.cyan
];

console.log(chalk.bold.white(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏎️  PARALLEL ASSET GENERATOR                                ║
║                                                               ║
║   Running ${GENERATORS.length} generators simultaneously                       ║
║   Estimated time: ~2-3 hours                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

console.log(chalk.gray('Starting generators...\n'));

const startTime = Date.now();
const processes = [];
const results = [];

for (let i = 0; i < GENERATORS.length; i++) {
  const gen = GENERATORS[i];
  const color = colors[i];
  
  console.log(color(`[${gen.name}] Starting: ${gen.desc}`));
  
  const proc = spawn('node', [path.join(__dirname, 'generators', gen.file)], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Buffer output and prefix with generator name
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      console.log(color(`[${gen.name}] ${line}`));
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      console.log(color.dim(`[${gen.name}] ${line}`));
    }
  });

  proc.on('close', (code) => {
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    if (code === 0) {
      console.log(color.bold(`\n[${gen.name}] ✓ COMPLETED in ${elapsed} minutes\n`));
      results.push({ name: gen.name, success: true, elapsed });
    } else {
      console.log(chalk.red.bold(`\n[${gen.name}] ✗ FAILED with code ${code}\n`));
      results.push({ name: gen.name, success: false, code });
    }

    // Check if all done
    if (results.length === GENERATORS.length) {
      printSummary();
    }
  });

  processes.push(proc);
}

function printSummary() {
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(chalk.bold.white(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏁 ALL GENERATORS COMPLETE                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total time:  ${chalk.cyan(totalTime + ' minutes')}`);
  console.log(`  Successful:  ${chalk.green(successful)}`);
  console.log(`  Failed:      ${chalk.red(failed)}`);
  console.log(`\n  Assets saved to: ${chalk.yellow('public/images/generated/')}`);
  console.log(`  Manifest:        ${chalk.yellow('scripts/generate-assets/output/manifest.json')}`);
  
  if (failed > 0) {
    console.log(chalk.red('\n  Failed generators:'));
    results.filter(r => !r.success).forEach(r => {
      console.log(chalk.red(`    - ${r.name} (exit code: ${r.code})`));
    });
  }

  console.log('\n');
}

// Handle Ctrl+C - kill all child processes
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nStopping all generators...'));
  processes.forEach(p => p.kill());
  process.exit(1);
});
