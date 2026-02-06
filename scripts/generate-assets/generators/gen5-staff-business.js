/**
 * Generator 5: Staff + Media + Business + Team/Sponsor Logos
 * Team Staff (200) + Facility Staff (150) + Media (95) + Business (50) + Team Logos (117) + Sponsor Logos (154)
 * Run in parallel with other generators
 */

import 'dotenv/config';
import ora from 'ora';
import chalk from 'chalk';
import { 
  generateStaffProfiles,
  generateBoardMemberProfiles,
  generateSponsorExecProfiles
} from '../lib/profile-generator.js';
import { extractTeams, extractSponsors } from '../lib/data-reader.js';
import { GeminiClient } from '../lib/gemini-client.js';
import { 
  loadManifest, saveManifest, addStaff, addMedia, addBoardMember, addSponsorExec,
  addTeamLogo, addSponsorLogo, assetExists, saveProfiles 
} from '../lib/manifest.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../../public/images/generated');

const GENERATOR_NAME = 'GEN5-STAFF-BIZ';

// Logo prompt builders
function buildTeamLogoPrompt(team) {
  const prestigeLevel = team.prestige > 70 ? 'elite factory-backed' : team.prestige > 40 ? 'professional' : 'grassroots';
  return `Professional motorsport team logo design for "${team.name}" racing team from ${team.country}. ${prestigeLevel} racing team identity. Primary color: ${team.colors.primary}, secondary color: ${team.colors.secondary}. Clean modern design, suitable for racing livery. No text, abstract geometric shapes, dynamic and aerodynamic feel. Vector style logo on white background.`;
}

function buildSponsorLogoPrompt(sponsor) {
  const categoryStyles = {
    'energy_drinks': 'Bold, aggressive, neon accents, high energy feel',
    'oil_fuel': 'Industrial, mechanical, technical precision',
    'tires': 'Circular motifs, rubber texture, grip imagery',
    'tech_gaming': 'Modern, digital, clean lines, futuristic',
    'equipment': 'Professional, functional, engineering focus',
    'watches': 'Elegant, precise, luxury timepiece aesthetic',
    'lifestyle': 'Trendy, aspirational, lifestyle brand feel',
    'automotive': 'Speed, engineering excellence, automotive heritage',
    'financial': 'Professional, trustworthy, conservative banking',
    'local': 'Regional character, authentic local business'
  };
  const style = categoryStyles[sponsor.category] || 'Professional corporate branding';
  
  return `Corporate logo design for "${sponsor.name}", a ${sponsor.category.replace('_', ' ')} brand. ${style}. Clean professional design suitable for motorsport sponsorship. No text, iconic symbol or abstract mark. Modern vector style on white background.`;
}

async function generatePortraits(client, manifest, profiles, category, addToManifest, outputSubdir) {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(chalk.yellow(`\n📷 Generating ${profiles.length} ${category} portraits...\n`));

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const outputPath = `portraits/${outputSubdir}/${profile.id}.png`;
    const fullPath = path.join(OUTPUT_DIR, outputPath);

    const existsInCategory = category === 'media' 
      ? manifest.media?.[profile.id]?.portrait
      : category.includes('board') 
        ? manifest.business?.boardMembers?.[profile.id]?.portrait
        : category.includes('sponsor')
          ? manifest.business?.sponsorExecs?.[profile.id]?.portrait
          : manifest.personal?.staff?.[profile.id]?.portrait;

    if (existsInCategory) {
      skipped++;
      continue;
    }

    const progress = `[${i + 1}/${profiles.length}]`;
    const label = profile.roleTitle || profile.category || '';
    process.stdout.write(`${progress} ${profile.id} ${label}... `);

    try {
      const imageData = await client.generateImage(profile.portraitPrompt, { aspectRatio: '1:1' });
      await client.saveImage(imageData, fullPath);
      addToManifest(manifest, profile, outputPath);
      
      if (generated % 10 === 0) await saveManifest(manifest);
      
      console.log(chalk.green('✓'));
      generated++;
    } catch (error) {
      console.log(chalk.red(`✗ ${error.message}`));
      failed++;
    }
  }

  return { generated, skipped, failed };
}

async function generateLogos(client, manifest, items, category, addToManifest, buildPrompt, outputSubdir) {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(chalk.yellow(`\n🏷️ Generating ${items.length} ${category} logos...\n`));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const outputPath = `logos/${outputSubdir}/${item.id}.png`;
    const fullPath = path.join(OUTPUT_DIR, outputPath);

    if (assetExists(manifest, category === 'teams' ? 'teams' : 'sponsors', item.id)) {
      skipped++;
      continue;
    }

    const progress = `[${i + 1}/${items.length}]`;
    process.stdout.write(`${progress} ${item.name}... `);

    try {
      const prompt = buildPrompt(item);
      const imageData = await client.generateImage(prompt, { aspectRatio: '1:1' });
      await client.saveImage(imageData, fullPath);
      addToManifest(manifest, item, outputPath);
      
      if (generated % 10 === 0) await saveManifest(manifest);
      
      console.log(chalk.green('✓'));
      generated++;
    } catch (error) {
      console.log(chalk.red(`✗ ${error.message}`));
      failed++;
    }
  }

  return { generated, skipped, failed };
}

async function main() {
  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME}: Staff + Business + Logos`));
  console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('✗ GEMINI_API_KEY not found in .env'));
    process.exit(1);
  }

  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  let manifest = await loadManifest();
  
  // Initialize sections
  if (!manifest.personal) manifest.personal = { partners: {}, children: {}, contacts: {}, staff: {} };
  if (!manifest.media) manifest.media = {};
  if (!manifest.business) manifest.business = { boardMembers: {}, sponsorExecs: {} };

  const spinner = ora('Generating profiles and loading data...').start();

  // Generate staff profiles
  const allStaff = generateStaffProfiles({ team: 200, facility: 150, media: 95 });
  const teamStaff = allStaff.filter(s => s.category === 'team');
  const facilityStaff = allStaff.filter(s => s.category === 'facility');
  const mediaStaff = allStaff.filter(s => s.category === 'media');

  // Business profiles
  const boardMembers = generateBoardMemberProfiles(25);
  const sponsorExecs = generateSponsorExecProfiles(25);

  // Load logo data
  const teams = await extractTeams();
  const sponsors = await extractSponsors();

  await saveProfiles(teamStaff, 'team-staff.json');
  await saveProfiles(facilityStaff, 'facility-staff.json');
  await saveProfiles(mediaStaff, 'media-staff.json');
  await saveProfiles(boardMembers, 'board-members.json');
  await saveProfiles(sponsorExecs, 'sponsor-execs.json');

  spinner.succeed(`Loaded: ${teamStaff.length} team staff, ${facilityStaff.length} facility staff, ${mediaStaff.length} media, ${boardMembers.length} board, ${sponsorExecs.length} execs, ${teams.length} teams, ${sponsors.length} sponsors`);

  let totalGenerated = 0, totalSkipped = 0, totalFailed = 0;

  // Team Staff
  console.log(chalk.magenta('\n═══ TEAM STAFF ═══'));
  let result = await generatePortraits(client, manifest, teamStaff, 'team staff', 
    (m, p, path) => { m.personal.staff[p.id] = { ...p, portrait: path }; delete m.personal.staff[p.id].portraitPrompt; },
    'staff/team');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Facility Staff
  console.log(chalk.magenta('\n═══ FACILITY STAFF ═══'));
  result = await generatePortraits(client, manifest, facilityStaff, 'facility staff',
    (m, p, path) => { m.personal.staff[p.id] = { ...p, portrait: path }; delete m.personal.staff[p.id].portraitPrompt; },
    'staff/facility');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Media
  console.log(chalk.magenta('\n═══ MEDIA ═══'));
  result = await generatePortraits(client, manifest, mediaStaff, 'media', addMedia, 'media');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Board Members
  console.log(chalk.magenta('\n═══ BOARD MEMBERS ═══'));
  result = await generatePortraits(client, manifest, boardMembers, 'board members', addBoardMember, 'business/board');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Sponsor Execs
  console.log(chalk.magenta('\n═══ SPONSOR EXECUTIVES ═══'));
  result = await generatePortraits(client, manifest, sponsorExecs, 'sponsor execs', addSponsorExec, 'business/execs');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Team Logos
  console.log(chalk.magenta('\n═══ TEAM LOGOS ═══'));
  result = await generateLogos(client, manifest, teams, 'teams', addTeamLogo, buildTeamLogoPrompt, 'teams');
  totalGenerated += result.generated; totalSkipped += result.skipped; totalFailed += result.failed;

  // Sponsor Logos
  console.log(chalk.magenta('\n═══ SPONSOR LOGOS ═══'));
  result = await generateLogos(client, manifest, sponsors, 'sponsors', addSponsorLogo, buildSponsorLogoPrompt, 'sponsors');
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
