#!/usr/bin/env node
/**
 * Bundle Content — merges individual JSON files per category into single bundle files.
 *
 * Instead of 8,219 individual HTTP fetch requests at startup, the app loads 7 bundle files.
 *
 * Usage:  node scripts/bundle-content.js
 *
 * Input:  public/data/<category>/<id>.json   (thousands of individual files)
 * Output: public/data/<category>.bundle.json  (one file per category, array of objects)
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'public', 'data')

/** Categories to bundle — maps directory name to output bundle filename */
const CATEGORIES = [
  { dir: 'staff-pool',        bundle: 'staff-pool.bundle.json' },
  { dir: 'partner-pool',      bundle: 'partner-pool.bundle.json' },
  { dir: 'contact-pool',      bundle: 'contact-pool.bundle.json' },
  { dir: 'sponsor-pool',      bundle: 'sponsor-pool.bundle.json' },
  { dir: 'driver-narratives', bundle: 'driver-narratives.bundle.json' },
  { dir: 'team-narratives',   bundle: 'team-narratives.bundle.json' },
  { dir: 'prerace-pools',     bundle: 'prerace-pools.bundle.json' },
  { dir: 'tracks',            bundle: 'tracks.bundle.json' },
]

let totalFiles = 0
let totalBundles = 0

for (const { dir, bundle } of CATEGORIES) {
  const dirPath = path.join(DATA_DIR, dir)

  if (!fs.existsSync(dirPath)) {
    console.warn(`[bundle-content] Skipping "${dir}" — directory not found at ${dirPath}`)
    continue
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))

  if (files.length === 0) {
    console.warn(`[bundle-content] Skipping "${dir}" — no JSON files found`)
    continue
  }

  const items = []
  let failures = 0

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8')
      const obj = JSON.parse(raw)
      // Ensure each item has an id field matching its filename (without .json)
      const id = file.replace(/\.json$/, '')
      if (!obj.id) obj.id = id
      items.push(obj)
    } catch (err) {
      failures++
      console.warn(`[bundle-content] Failed to read ${dir}/${file}: ${err.message}`)
    }
  }

  const outPath = path.join(DATA_DIR, bundle)
  fs.writeFileSync(outPath, JSON.stringify(items))

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1)
  console.log(`[bundle-content] ${dir}: ${items.length} items → ${bundle} (${sizeMB} MB)${failures > 0 ? ` [${failures} failures]` : ''}`)

  totalFiles += items.length
  totalBundles++
}

console.log(`\n[bundle-content] Done: ${totalFiles} items across ${totalBundles} bundles`)
