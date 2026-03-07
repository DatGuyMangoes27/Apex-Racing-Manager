/**
 * Reads existing profile data from the generate-assets output
 * and source TypeScript config files from the main app.
 */
import fs from 'fs'
import path from 'path'

export interface ExistingDriver {
  id: string
  name: string
  country: string
  nationality: string
  nationalityAdjective?: string
  age: number
  careerStage: string
  personality: string
  physical: {
    skinTone: string
    hairColor: string
    hairStyle: string
    eyeColor: string
    facialHair: string | null
    description: string
  }
  portraitPrompt: string
  teams: string[]
}

export interface TeamData {
  id: string
  name: string
  shortName?: string
  country: string
  tier: string
  budget: string
  prestige: number
  facilities: string
  colors?: { primary: string; secondary: string }
  description?: string
}

export interface TrackLayoutData {
  id: string
  name: string
  lengthKm: number
  turns: number
}

export interface TrackData {
  id: string
  name: string
  officialName: string
  country: string
  countryCode: string
  type: string
  layouts: TrackLayoutData[]
}

export interface SponsorData {
  id: string
  name: string
  category: string
  tier: string
}

export class DataReader {
  private projectRoot: string
  private profilesDir: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.profilesDir = path.join(projectRoot, 'scripts', 'generate-assets', 'output', 'profiles')
  }

  // ---- Profile JSONs ----

  loadDriverProfiles(batch: 1 | 2 | 3): ExistingDriver[] {
    const files: Record<number, string> = {
      1: 'drivers-batch1.json',
      2: 'drivers-batch2.json',
      3: 'drivers-batch3-rookies.json',
    }
    return this.loadJson(path.join(this.profilesDir, files[batch])) || []
  }

  loadAllDriverProfiles(): ExistingDriver[] {
    return [
      ...this.loadDriverProfiles(1),
      ...this.loadDriverProfiles(2),
      ...this.loadDriverProfiles(3),
    ]
  }

  loadPartnerProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'partners.json')) || []
  }

  loadContactProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'contacts.json')) || []
  }

  loadTeamStaffProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'team-staff.json')) || []
  }

  loadFacilityStaffProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'facility-staff.json')) || []
  }

  loadMediaStaffProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'media-staff.json')) || []
  }

  loadPersonalStaffProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'personal-staff.json')) || []
  }

  loadBoardMemberProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'board-members.json')) || []
  }

  loadSponsorExecProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'sponsor-execs.json')) || []
  }

  loadChildrenProfiles(): any[] {
    return this.loadJson(path.join(this.profilesDir, 'children.json')) || []
  }

  // ---- Source data extraction ----

  extractTeams(): TeamData[] {
    const teamsContent = this.readSourceFile('src/data/teams.ts')
    if (!teamsContent) return []

    const teams: TeamData[] = []
    // Parse team objects from the TS file
    const teamRegex = /{\s*id:\s*['"]([^'"]+)['"].*?name:\s*['"]([^'"]+)['"].*?country:\s*['"]([^'"]+)['"].*?}/gs
    let match
    while ((match = teamRegex.exec(teamsContent)) !== null) {
      const block = match[0]
      teams.push({
        id: match[1],
        name: match[2],
        country: match[3],
        tier: this.extractField(block, 'tier') || 'amateur',
        budget: this.extractField(block, 'budget') || 'low',
        prestige: parseInt(this.extractField(block, 'prestige') || '50'),
        facilities: this.extractField(block, 'facilities') || 'basic',
      })
    }
    return teams
  }

  extractTracks(): TrackData[] {
    const content = this.readSourceFile('src/data/ams2-tracks.ts')
    if (!content) return []

    // Parse the AMS2_SOURCE_SYNC_AUDIT.unmatchedLayouts to know which layouts are unverified
    const unverifiedSet = this.getUnverifiedLayouts(content)

    const tracks: TrackData[] = []

    // Match venue-level objects by requiring officialName (only present on venues, not layouts).
    // Split on top-level object boundaries: lines starting with `  {` at 2-space indent.
    const venueBlocks = content.split(/\n  \{/).slice(1) // skip content before first venue

    for (const rawBlock of venueBlocks) {
      const block = '{' + rawBlock.split(/\n  \},?\s*\n/)[0]

      if (!block.includes('officialName')) continue

      const id = this.extractField(block, 'id')
      const name = this.extractField(block, 'name')
      const officialName = this.extractField(block, 'officialName')
      const country = this.extractField(block, 'country')
      const countryCode = this.extractField(block, 'countryCode')
      const type = this.extractField(block, 'type')

      if (!id || !name || !country) continue

      // Parse layouts sub-array
      const allLayouts: TrackLayoutData[] = []
      const layoutRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*lengthKm:\s*([\d.]+),\s*turns:\s*(\d+)/g
      let lm
      while ((lm = layoutRegex.exec(block)) !== null) {
        allLayouts.push({
          id: lm[1],
          name: lm[2],
          lengthKm: parseFloat(lm[3]),
          turns: parseInt(lm[4]),
        })
      }

      // Filter out unverified layouts (not present in the authoritative AMS2 reference)
      const layouts = unverifiedSet.size > 0
        ? allLayouts.filter(l => !unverifiedSet.has(`${id}:${l.id}`))
        : allLayouts

      if (layouts.length === 0) continue

      tracks.push({ id, name, officialName: officialName || name, country, countryCode: countryCode || '', type, layouts })
    }

    return tracks
  }

  private getUnverifiedLayouts(trackFileContent: string): Set<string> {
    // The ams2-tracks.ts file computes unmatchedLayouts at the bottom as AMS2_SOURCE_SYNC_AUDIT.
    // We can't run the TS, but we can parse the unmatchedLayouts array from the audit export.
    // However, it's computed at runtime. Instead, we'll check the authoritative reference count
    // against BASE_TRACKS to identify which are unverified by checking layout reference file.
    const refContent = this.readSourceFile('src/data/ams2-layout-reference.ts')
    if (!refContent) return new Set()

    // Build a set of "trackName::layoutName" from the reference (lowercased for matching)
    const refEntries = new Set<string>()
    // Parse pairs of track+layout from the reference array
    const entryRegex = /"track":\s*"([^"]+)"[\s\S]*?"layout":\s*"([^"]+)"/g
    let m
    while ((m = entryRegex.exec(refContent)) !== null) {
      refEntries.add(`${m[1].toLowerCase()}::${m[2].toLowerCase()}`)
    }

    // Now determine which venueId:layoutId combos are NOT in the reference
    // We need to match BASE_TRACKS layout names to reference layout names
    const unverified = new Set<string>()
    const venueBlocks = trackFileContent.split(/\n  \{/).slice(1)

    for (const rawBlock of venueBlocks) {
      const block = '{' + rawBlock.split(/\n  \},?\s*\n/)[0]
      if (!block.includes('officialName')) continue

      const venueId = this.extractField(block, 'id')
      const venueName = this.extractField(block, 'name')
      if (!venueId || !venueName) continue

      const layoutRegex2 = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*lengthKm:\s*([\d.]+),\s*turns:\s*(\d+)/g
      let lm
      while ((lm = layoutRegex2.exec(block)) !== null) {
        const layoutId = lm[1]
        const layoutName = lm[2]
        // Reference uses full names like "Silverstone National" not just "National"
        const fullName = `${venueName} ${layoutName}`.toLowerCase()
        const shortName = layoutName.toLowerCase()
        const trackKey = venueName.toLowerCase()

        // Check various name formats against the reference
        const matched =
          refEntries.has(`${trackKey}::${fullName}`) ||
          refEntries.has(`${trackKey}::${shortName}`) ||
          refEntries.has(`${trackKey}::${trackKey} ${shortName}`) ||
          refEntries.has(`${trackKey}::${trackKey}`) && layoutName.toLowerCase() === venueName.toLowerCase()

        if (!matched) {
          unverified.add(`${venueId}:${layoutId}`)
        }
      }
    }

    return unverified
  }

  extractRealDriverFacts(): Record<string, { realAge?: number; knownFor?: string }> {
    const content = this.readSourceFile('src/data/real-driver-facts.ts')
    if (!content) return {}

    const facts: Record<string, { realAge?: number; knownFor?: string }> = {}
    const factRegex = /['"]([^'"]+)['"]\s*:\s*{[^}]*knownFor:\s*['"]([^'"]*)['"]/g
    let match
    while ((match = factRegex.exec(content)) !== null) {
      facts[match[1]] = { knownFor: match[2] }
    }
    return facts
  }

  // ---- Existing manifest ----

  loadManifest(): any {
    return this.loadJson(path.join(this.projectRoot, 'scripts', 'generate-assets', 'output', 'manifest.json'))
  }

  // ---- Image counts ----

  countImages(relativePath: string): number {
    const dir = path.join(this.projectRoot, 'public', 'images', 'generated', relativePath)
    if (!fs.existsSync(dir)) return 0
    return fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length
  }

  imageExists(relativePath: string): boolean {
    return fs.existsSync(path.join(this.projectRoot, 'public', 'images', 'generated', relativePath))
  }

  // ---- Helpers ----

  private readSourceFile(relativePath: string): string | null {
    const fullPath = path.join(this.projectRoot, relativePath)
    if (!fs.existsSync(fullPath)) return null
    return fs.readFileSync(fullPath, 'utf-8')
  }

  private loadJson(filePath: string): any {
    if (!fs.existsSync(filePath)) return null
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      return null
    }
  }

  private extractField(block: string, field: string): string {
    const regex = new RegExp(`${field}:\\s*['"]([^'"]+)['"]`)
    const match = block.match(regex)
    return match ? match[1] : ''
  }
}
