#!/usr/bin/env node
/**
 * Rebuild Generated-Manifest from Image Files on Disk
 *
 * Scans public/images/generated/ for all image assets and cross-references
 * pre-generated staff/partner/contact JSON data to build a complete
 * generated-manifest.json.
 *
 * This recovers the manifest after a destructive publish-to-app overwrote it.
 *
 * Usage:  node scripts/rebuild-manifest.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GENERATED_DIR = path.join(ROOT, 'public', 'images', 'generated')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'generated-manifest.json')

// Helper: list image files in a directory (non-recursive)
function listImages(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
}

// Helper: list image files recursively
function listImagesRecursive(dir) {
  if (!fs.existsSync(dir)) return []
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const sub of listImagesRecursive(path.join(dir, entry.name))) {
        results.push(path.join(entry.name, sub).replace(/\\/g, '/'))
      }
    } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
      results.push(entry.name)
    }
  }
  return results
}

// Helper: strip extension
function stripExt(filename) {
  return filename.replace(/\.(png|jpg|jpeg|webp)$/i, '')
}

// Helper: try to read a JSON file, return null on failure
function tryReadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  } catch {
    return null
  }
}

console.log('[Rebuild] Scanning image directories...\n')

const manifest = {
  version: '1.0.0',
  generated: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  stats: { totalAssets: 0, byCategory: {} },
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
  ui: {},
  cutscenes: {}
}

// ============================================================
// 1. STAFF PORTRAITS — cross-reference with pre-gen JSON data
// ============================================================
const staffImgDir = path.join(GENERATED_DIR, 'staff')
const staffDataDir = path.join(DATA_DIR, 'staff-pool')

if (fs.existsSync(staffImgDir)) {
  const images = listImages(staffImgDir)
  console.log(`[Rebuild] Staff images: ${images.length}`)

  for (const img of images) {
    const basename = stripExt(img)
    // Staff images are named like: ai-23xi-fac-00.png
    // Staff IDs in pre-gen data are: staff-ai-23xi-fac-00
    const staffId = `staff-${basename}`
    const portraitPath = `staff/${img}`

    // Try to load pre-gen JSON for metadata
    const jsonPath = path.join(staffDataDir, `${staffId}.json`)
    const data = tryReadJSON(jsonPath)

    manifest.personal.staff[staffId] = {
      id: staffId,
      category: basename.includes('-fac-') ? 'facility' : basename.includes('-team-') ? 'team' : 'personal',
      role: data?.role || 'unknown',
      roleTitle: data?.role || 'Staff',
      gender: data?.gender || 'male',
      age: data?.age || 30,
      country: data?.nationality || 'Unknown',
      nationality: data?.nationality || 'Unknown',
      style: 'professional',
      physical: data?.physical || {},
      portrait: portraitPath,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 2. DRIVER PORTRAITS
// ============================================================
const driverImgDir = path.join(GENERATED_DIR, 'drivers')
const driverPortraitDir = path.join(GENERATED_DIR, 'portraits', 'drivers')

function processDriverImages(dir, prefix) {
  if (!fs.existsSync(dir)) return
  const images = listImages(dir)
  console.log(`[Rebuild] Driver images (${prefix}): ${images.length}`)

  for (const img of images) {
    const basename = stripExt(img)
    const id = basename

    // Parse name and country from filename: "a-j-allmendinger-usa.png"
    const parts = basename.split('-')
    const country = parts.pop() || ''
    const nameParts = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))
    const name = nameParts.join(' ')

    manifest.drivers[id] = {
      name,
      country: country.toUpperCase(),
      nationality: country.toUpperCase(),
      age: 25,
      careerStage: 'mid',
      personality: 'determined',
      physical: {},
      teams: [],
      portrait: `${prefix}/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

processDriverImages(driverImgDir, 'drivers')
processDriverImages(driverPortraitDir, 'portraits/drivers')

// ============================================================
// 3. PARTNER PORTRAITS
// ============================================================
const partnerImgDir = path.join(GENERATED_DIR, 'partners')
const partnerDataDir = path.join(DATA_DIR, 'partner-pool')

if (fs.existsSync(partnerImgDir)) {
  const images = listImages(partnerImgDir)
  console.log(`[Rebuild] Partner images: ${images.length}`)

  for (const img of images) {
    const basename = stripExt(img)
    // Partner images: partner-partner-0000.png.jpg or partner-partner-0000.png
    // Normalize: strip double extensions
    const cleanImg = img.replace('.png.jpg', '.png')
    const cleanBasename = stripExt(cleanImg)
    const partnerId = cleanBasename

    const jsonPath = path.join(partnerDataDir, `${partnerId}.json`)
    const data = tryReadJSON(jsonPath)

    manifest.personal.partners[partnerId] = {
      id: partnerId,
      gender: data?.gender || 'female',
      age: data?.age || 28,
      ageRange: data?.ageRange || '25-35',
      career: data?.career || '',
      careerTitle: data?.careerTitle || '',
      country: data?.country || 'Unknown',
      nationality: data?.nationality || 'Unknown',
      style: data?.style || 'professional',
      physical: data?.physical || {},
      portrait: `partners/${cleanImg}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 4. CONTACT PORTRAITS
// ============================================================
const contactImgDir = path.join(GENERATED_DIR, 'contacts')
const contactDataDir = path.join(DATA_DIR, 'contact-pool')

if (fs.existsSync(contactImgDir)) {
  const images = listImages(contactImgDir)
  console.log(`[Rebuild] Contact images: ${images.length}`)

  for (const img of images) {
    const basename = stripExt(img)
    const contactId = basename

    const jsonPath = path.join(contactDataDir, `${contactId}.json`)
    const data = tryReadJSON(jsonPath)

    manifest.personal.contacts[contactId] = {
      id: contactId,
      name: data?.name || contactId,
      contactType: data?.contactType || 'friend',
      gender: data?.gender || 'male',
      portrait: `contacts/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 5. CHAMPIONSHIP LOGOS
// ============================================================
const champDir = path.join(GENERATED_DIR, 'logos', 'championships')
if (fs.existsSync(champDir)) {
  const images = listImages(champDir)
  console.log(`[Rebuild] Championship logos: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.championships[id] = {
      name: id,
      shortName: id.substring(0, 6).toUpperCase(),
      type: 'unknown',
      region: 'unknown',
      tier: 'unknown',
      logo: `logos/championships/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 6. MANUFACTURER LOGOS
// ============================================================
const mfrDir = path.join(GENERATED_DIR, 'logos', 'manufacturers')
if (fs.existsSync(mfrDir)) {
  const images = listImages(mfrDir)
  console.log(`[Rebuild] Manufacturer logos: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.manufacturers[id] = {
      name: id,
      country: '',
      tier: 'mid',
      badge: `logos/manufacturers/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 7. SPONSOR LOGOS
// ============================================================
const sponsorLogoDir = path.join(GENERATED_DIR, 'logos', 'sponsors')
if (fs.existsSync(sponsorLogoDir)) {
  const images = listImages(sponsorLogoDir)
  console.log(`[Rebuild] Sponsor logos: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.sponsors[id] = {
      name: id,
      category: 'general',
      tier: 'mid',
      logo: `logos/sponsors/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 8. BANK LOGOS
// ============================================================
const bankDir = path.join(GENERATED_DIR, 'logos', 'banks')
if (fs.existsSync(bankDir)) {
  const images = listImages(bankDir)
  console.log(`[Rebuild] Bank logos: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.banks[id] = {
      name: id,
      logo: `logos/banks/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 9. CUTSCENE / SCENE IMAGES
// ============================================================
const cutsceneDir = path.join(GENERATED_DIR, 'cutscenes')
const sceneDir = path.join(GENERATED_DIR, 'scenes')

function processCutscenes(dir, prefix) {
  if (!fs.existsSync(dir)) return
  const images = listImages(dir)
  console.log(`[Rebuild] Cutscene/scene images (${prefix}): ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.cutscenes[id] = {
      id,
      name: id,
      description: '',
      path: `${prefix}/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

processCutscenes(cutsceneDir, 'cutscenes')
processCutscenes(sceneDir, 'scenes')

// ============================================================
// 10. UI TEXTURES
// ============================================================
const uiDir = path.join(GENERATED_DIR, 'ui')
if (fs.existsSync(uiDir)) {
  const images = listImages(uiDir)
  console.log(`[Rebuild] UI textures: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.ui[id] = {
      id,
      name: id,
      type: 'texture',
      path: `ui/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 11. VENUE IMAGES
// ============================================================
const venueDir = path.join(GENERATED_DIR, 'venues')
if (fs.existsSync(venueDir)) {
  const images = listImages(venueDir)
  console.log(`[Rebuild] Venue images: ${images.length}`)

  for (const img of images) {
    const id = stripExt(img)
    manifest.venues[id] = {
      id,
      name: id,
      image: `venues/${img}`,
      generatedAt: new Date().toISOString()
    }
  }
}

// ============================================================
// 12. TRACK IMAGES (may be in a tracks/ subdirectory)
// ============================================================
const tracksDir = path.join(GENERATED_DIR, 'tracks')
if (fs.existsSync(tracksDir)) {
  const images = listImagesRecursive(tracksDir)
  console.log(`[Rebuild] Track images: ${images.length}`)

  for (const relPath of images) {
    const basename = stripExt(path.basename(relPath))
    // Try to identify view type from filename
    let viewType = 'aerial'
    if (basename.includes('grandstand')) viewType = 'grandstand'
    else if (basename.includes('paddock')) viewType = 'paddock'
    else if (basename.includes('pitlane')) viewType = 'pitlane'

    // Track ID: strip the view type suffix
    const trackId = basename.replace(/-?(aerial|grandstand|paddock|pitlane)$/i, '') || basename

    if (!manifest.tracks[trackId]) {
      manifest.tracks[trackId] = {
        name: trackId,
        country: '',
        images: {}
      }
    }
    manifest.tracks[trackId].images[viewType] = `tracks/${relPath}`
  }
}

// ============================================================
// Compute stats
// ============================================================
let total = 0
const byCategory = {}

for (const [category, items] of Object.entries(manifest)) {
  if (typeof items !== 'object' || Array.isArray(items) || ['stats', 'version', 'generated', 'lastUpdated'].includes(category)) continue

  if (category === 'personal') {
    for (const [subcat, subItems] of Object.entries(items)) {
      const count = Object.keys(subItems).length
      if (count > 0) {
        byCategory[`personal.${subcat}`] = count
        total += count
      }
    }
  } else if (category === 'business') {
    for (const [subcat, subItems] of Object.entries(items)) {
      const count = Object.keys(subItems).length
      if (count > 0) {
        byCategory[`business.${subcat}`] = count
        total += count
      }
    }
  } else {
    const count = Object.keys(items).length
    if (count > 0) {
      byCategory[category] = count
      total += count
    }
  }
}

manifest.stats = { totalAssets: total, byCategory }

// ============================================================
// Write manifest
// ============================================================
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

console.log('\n[Rebuild] Manifest written to:', MANIFEST_PATH)
console.log(`[Rebuild] Total assets: ${total}`)
console.log('[Rebuild] By category:')
for (const [cat, count] of Object.entries(byCategory).sort()) {
  console.log(`  ${cat}: ${count}`)
}
console.log('\n[Rebuild] Done!')
