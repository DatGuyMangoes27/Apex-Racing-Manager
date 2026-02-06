/**
 * Manifest System
 * Tracks all generated assets and links them to entity IDs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../output/manifest.json');
const PROFILES_DIR = path.join(__dirname, '../output/profiles');

/**
 * Initialize empty manifest structure
 */
function createEmptyManifest() {
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    stats: {
      totalAssets: 0,
      byCategory: {}
    },
    drivers: {},
    teams: {},
    sponsors: {},
    manufacturers: {},
    banks: {},
    championships: {},
    tracks: {},
    personal: {
      partners: {},
      children: {},
      contacts: {},
      staff: {}
    },
    media: {},
    business: {
      boardMembers: {},
      sponsorExecs: {}
    },
    venues: {},
    ui: {}
  };
}

/**
 * Load existing manifest or create new one
 */
export async function loadManifest() {
  try {
    const content = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return createEmptyManifest();
  }
}

/**
 * Save manifest to disk with merge support for parallel generators
 * This reloads the manifest before saving to merge any changes from other generators
 */
export async function saveManifest(manifest) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  
  // Load existing manifest to merge with (for parallel generator support)
  let existingManifest;
  try {
    const content = await fs.readFile(MANIFEST_PATH, 'utf-8');
    existingManifest = JSON.parse(content);
  } catch (error) {
    existingManifest = createEmptyManifest();
  }
  
  // Deep merge: combine existing data with new data
  const merged = deepMerge(existingManifest, manifest);
  merged.lastUpdated = new Date().toISOString();
  
  // Update stats
  let total = 0;
  const byCategory = {};
  
  for (const [category, items] of Object.entries(merged)) {
    if (typeof items === 'object' && !Array.isArray(items) && category !== 'stats' && category !== 'version' && category !== 'generated' && category !== 'lastUpdated') {
      const count = Object.keys(items).length;
      if (count > 0 && category !== 'personal' && category !== 'business') {
        byCategory[category] = count;
        total += count;
      }
    }
  }
  
  // Handle nested categories
  if (merged.personal) {
    for (const [subcat, items] of Object.entries(merged.personal)) {
      const count = Object.keys(items).length;
      if (count > 0) {
        byCategory[`personal.${subcat}`] = count;
        total += count;
      }
    }
  }
  
  if (merged.business) {
    for (const [subcat, items] of Object.entries(merged.business)) {
      const count = Object.keys(items).length;
      if (count > 0) {
        byCategory[`business.${subcat}`] = count;
        total += count;
      }
    }
  }
  
  merged.stats = { totalAssets: total, byCategory };
  
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(merged, null, 2));
  
  return merged;
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object') {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Add a driver to the manifest
 */
export function addDriver(manifest, driver, portraitPath) {
  manifest.drivers[driver.id] = {
    name: driver.name,
    country: driver.country,
    nationality: driver.nationality,
    age: driver.age,
    careerStage: driver.careerStage,
    personality: driver.personality,
    physical: driver.physical,
    teams: driver.teams,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a team logo to the manifest
 */
export function addTeamLogo(manifest, team, logoPath) {
  manifest.teams[team.id] = {
    name: team.name,
    shortName: team.shortName,
    tier: team.tier,
    prestige: team.prestige,
    logo: logoPath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a sponsor logo to the manifest
 */
export function addSponsorLogo(manifest, sponsor, logoPath) {
  manifest.sponsors[sponsor.id] = {
    name: sponsor.name,
    category: sponsor.category,
    tier: sponsor.tier,
    logo: logoPath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a manufacturer badge to the manifest
 */
export function addManufacturerBadge(manifest, manufacturer, badgePath) {
  manifest.manufacturers[manufacturer.id] = {
    name: manufacturer.name,
    country: manufacturer.country,
    tier: manufacturer.tier,
    badge: badgePath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a bank logo to the manifest
 */
export function addBankLogo(manifest, bank, logoPath) {
  manifest.banks[bank.id] = {
    name: bank.name,
    logo: logoPath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a championship logo to the manifest
 */
export function addChampionshipLogo(manifest, championship, logoPath) {
  manifest.championships[championship.id] = {
    name: championship.name,
    shortName: championship.shortName,
    type: championship.type,
    region: championship.region,
    tier: championship.tier,
    logo: logoPath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a track venue image to the manifest
 */
export function addTrackVenue(manifest, track, viewType, imagePath) {
  if (!manifest.tracks[track.id]) {
    manifest.tracks[track.id] = {
      name: track.name,
      country: track.country,
      type: track.type,
      images: {}
    };
  }
  manifest.tracks[track.id].images[viewType] = imagePath;
}

/**
 * Add a partner portrait to the manifest
 */
export function addPartner(manifest, partner, portraitPath) {
  manifest.personal.partners[partner.id] = {
    ...partner,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.personal.partners[partner.id].portraitPrompt;
}

/**
 * Add a child portrait to the manifest
 */
export function addChild(manifest, child, portraitPath) {
  manifest.personal.children[child.id] = {
    ...child,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.personal.children[child.id].portraitPrompt;
}

/**
 * Add a contact portrait to the manifest
 */
export function addContact(manifest, contact, portraitPath) {
  manifest.personal.contacts[contact.id] = {
    ...contact,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.personal.contacts[contact.id].portraitPrompt;
}

/**
 * Add a staff portrait to the manifest
 */
export function addStaff(manifest, staff, portraitPath) {
  manifest.personal.staff[staff.id] = {
    ...staff,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.personal.staff[staff.id].portraitPrompt;
}

/**
 * Add a media portrait to the manifest
 */
export function addMedia(manifest, person, portraitPath) {
  manifest.media[person.id] = {
    ...person,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.media[person.id].portraitPrompt;
}

/**
 * Add a board member portrait to the manifest
 */
export function addBoardMember(manifest, member, portraitPath) {
  manifest.business.boardMembers[member.id] = {
    ...member,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.business.boardMembers[member.id].portraitPrompt;
}

/**
 * Add a sponsor exec portrait to the manifest
 */
export function addSponsorExec(manifest, exec, portraitPath) {
  manifest.business.sponsorExecs[exec.id] = {
    ...exec,
    portrait: portraitPath,
    generatedAt: new Date().toISOString()
  };
  delete manifest.business.sponsorExecs[exec.id].portraitPrompt;
}

/**
 * Add a venue image to the manifest
 */
export function addVenue(manifest, venue, imagePath) {
  manifest.venues[venue.id] = {
    ...venue,
    image: imagePath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Add a UI element to the manifest
 */
export function addUIElement(manifest, element, imagePath) {
  manifest.ui[element.id] = {
    ...element,
    image: imagePath,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Check if an asset already exists in the manifest
 */
export function assetExists(manifest, category, id, subCategory = null) {
  if (subCategory) {
    return manifest[category]?.[subCategory]?.[id]?.portrait || 
           manifest[category]?.[subCategory]?.[id]?.logo ||
           manifest[category]?.[subCategory]?.[id]?.image;
  }
  return manifest[category]?.[id]?.portrait || 
         manifest[category]?.[id]?.logo ||
         manifest[category]?.[id]?.badge ||
         manifest[category]?.[id]?.image;
}

/**
 * Save profiles to separate JSON files for reference
 */
export async function saveProfiles(profiles, filename) {
  await fs.mkdir(PROFILES_DIR, { recursive: true });
  const filePath = path.join(PROFILES_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(profiles, null, 2));
  console.log(`  Saved ${profiles.length} profiles to ${filename}`);
  return filePath;
}

/**
 * Load profiles from JSON file
 */
export async function loadProfiles(filename) {
  const filePath = path.join(PROFILES_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Get progress for a generation run
 */
export function getProgress(manifest, category, total) {
  let completed = 0;
  
  if (category === 'drivers') {
    completed = Object.keys(manifest.drivers).length;
  } else if (category.startsWith('personal.')) {
    const subcat = category.split('.')[1];
    completed = Object.keys(manifest.personal?.[subcat] || {}).length;
  } else if (category.startsWith('business.')) {
    const subcat = category.split('.')[1];
    completed = Object.keys(manifest.business?.[subcat] || {}).length;
  } else {
    completed = Object.keys(manifest[category] || {}).length;
  }
  
  return {
    completed,
    total,
    remaining: total - completed,
    percentage: Math.round((completed / total) * 100)
  };
}

/**
 * Print manifest summary
 */
export function printManifestSummary(manifest) {
  console.log('\n📊 Manifest Summary:');
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Last Updated: ${manifest.lastUpdated}`);
  console.log(`   Total Assets: ${manifest.stats.totalAssets}`);
  console.log('\n   By Category:');
  
  for (const [category, count] of Object.entries(manifest.stats.byCategory)) {
    console.log(`     ${category}: ${count}`);
  }
}
