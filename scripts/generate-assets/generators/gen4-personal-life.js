/**
 * Generator 4: Personal Life Assets
 * Partners (150) + Children (100) + Friends/Contacts (150) + Personal Staff (50)
 * Run in parallel with other generators
 */

import 'dotenv/config';
import ora from 'ora';
import chalk from 'chalk';
import { 
  generatePartnerProfiles,
  generateChildProfiles,
  generateContactProfiles
} from '../lib/profile-generator.js';
import { GeminiClient } from '../lib/gemini-client.js';
import { loadManifest, saveManifest, addPartner, addChild, addContact, assetExists, saveProfiles } from '../lib/manifest.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { COUNTRY_NAMES, APPEARANCE_BY_REGION } from '../lib/data-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '../../../public/images/generated');

const GENERATOR_NAME = 'GEN4-PERSONAL';

// Personal staff generator
function generatePersonalStaffProfiles(count = 50) {
  const staff = [];
  const roles = [
    { id: 'personal_assistant', title: 'Personal Assistant' },
    { id: 'driver', title: 'Personal Driver' },
    { id: 'bodyguard', title: 'Bodyguard' },
    { id: 'housekeeper', title: 'Housekeeper' },
    { id: 'chef', title: 'Personal Chef' },
    { id: 'nanny', title: 'Nanny' },
    { id: 'estate_manager', title: 'Estate Manager' },
    { id: 'financial_advisor', title: 'Financial Advisor' },
    { id: 'publicist', title: 'Publicist' }
  ];
  const genders = ['female', 'male'];
  const countries = Object.keys(COUNTRY_NAMES);

  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const age = 25 + Math.floor(Math.random() * 35); // 25-60
    const appearance = APPEARANCE_BY_REGION[country] || { skinTone: 'medium', hairColors: ['brown'], eyeColors: ['brown'] };
    const hairColor = appearance.hairColors[Math.floor(Math.random() * appearance.hairColors.length)];
    const nationality = COUNTRY_NAMES[country];

    staff.push({
      id: `personal-staff-${String(i + 1).padStart(3, '0')}`,
      role: role.id,
      roleTitle: role.title,
      gender,
      age,
      country,
      nationality,
      portraitPrompt: `Portrait photograph of a ${age}-year-old ${nationality} ${gender} working as a ${role.title}. ${appearance.skinTone} skin, ${hairColor} hair. Professional, trustworthy demeanor. Smart casual or uniform appropriate for the role. High quality portrait, natural lighting. Photorealistic.`
    });
  }

  return staff;
}

async function generateCategory(client, manifest, profiles, category, addToManifest, outputSubdir) {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(chalk.yellow(`\n📷 Generating ${profiles.length} ${category} portraits...\n`));

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const outputPath = `portraits/${outputSubdir}/${profile.id}.png`;
    const fullPath = path.join(OUTPUT_DIR, outputPath);

    // Determine the right check for existing
    const subCategory = outputSubdir.replace('personal/', '');
    if (assetExists(manifest, 'personal', profile.id, subCategory)) {
      skipped++;
      continue;
    }

    const progress = `[${i + 1}/${profiles.length}]`;
    const label = profile.roleTitle || profile.careerTitle || profile.typeTitle || profile.stage || '';
    process.stdout.write(`${progress} ${profile.id} ${label}... `);

    try {
      const imageData = await client.generateImage(profile.portraitPrompt, {
        aspectRatio: '1:1'
      });
      await client.saveImage(imageData, fullPath);
      addToManifest(manifest, profile, outputPath);
      
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

  return { generated, skipped, failed };
}

async function main() {
  console.log(chalk.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.cyan.bold(`  ${GENERATOR_NAME}: Personal Life Assets`));
  console.log(chalk.cyan(`${'═'.repeat(60)}\n`));

  if (!process.env.GEMINI_API_KEY) {
    console.error(chalk.red('✗ GEMINI_API_KEY not found in .env'));
    process.exit(1);
  }

  const client = new GeminiClient(process.env.GEMINI_API_KEY);
  let manifest = await loadManifest();
  
  // Initialize personal section if needed
  if (!manifest.personal) {
    manifest.personal = { partners: {}, children: {}, contacts: {}, staff: {} };
  }

  const spinner = ora('Generating profiles...').start();

  // Generate all profiles
  const partners = generatePartnerProfiles(150);
  const children = generateChildProfiles(10); // 10 base × 10 age stages = 100
  const contacts = generateContactProfiles(150);
  const personalStaff = generatePersonalStaffProfiles(50);

  await saveProfiles(partners, 'partners.json');
  await saveProfiles(children, 'children.json');
  await saveProfiles(contacts, 'contacts.json');
  await saveProfiles(personalStaff, 'personal-staff.json');

  spinner.succeed(`Generated profiles: ${partners.length} partners, ${children.length} children, ${contacts.length} contacts, ${personalStaff.length} staff`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Generate partners
  console.log(chalk.magenta('\n═══ PARTNERS ═══'));
  let result = await generateCategory(client, manifest, partners, 'partners', addPartner, 'personal/partners');
  totalGenerated += result.generated;
  totalSkipped += result.skipped;
  totalFailed += result.failed;

  // Generate children
  console.log(chalk.magenta('\n═══ CHILDREN ═══'));
  result = await generateCategory(client, manifest, children, 'children', addChild, 'personal/children');
  totalGenerated += result.generated;
  totalSkipped += result.skipped;
  totalFailed += result.failed;

  // Generate contacts
  console.log(chalk.magenta('\n═══ CONTACTS/FRIENDS ═══'));
  result = await generateCategory(client, manifest, contacts, 'contacts', addContact, 'personal/contacts');
  totalGenerated += result.generated;
  totalSkipped += result.skipped;
  totalFailed += result.failed;

  // Generate personal staff
  console.log(chalk.magenta('\n═══ PERSONAL STAFF ═══'));
  const addPersonalStaff = (m, p, path) => {
    if (!m.personal.staff) m.personal.staff = {};
    m.personal.staff[p.id] = { ...p, portrait: path, generatedAt: new Date().toISOString() };
    delete m.personal.staff[p.id].portraitPrompt;
  };
  result = await generateCategory(client, manifest, personalStaff, 'personal staff', addPersonalStaff, 'personal/staff');
  totalGenerated += result.generated;
  totalSkipped += result.skipped;
  totalFailed += result.failed;

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
