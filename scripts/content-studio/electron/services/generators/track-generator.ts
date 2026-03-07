/**
 * Track narrative and pre-race content generation tasks.
 * Generates LAYOUT-SPECIFIC content — one file per venue+layout combination.
 * File naming: track-{venueId}--{layoutId}.json, prerace-{venueId}--{layoutId}.json
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'
import { DataReader, type TrackData, type TrackLayoutData } from '../data-reader'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/narratives'

export function createTrackTextTasks(reader: DataReader, projectRoot: string): GenerationTask[] {
  const tracks = reader.extractTracks()
  const tasks: GenerationTask[] = []

  for (const track of tracks) {
    for (const layout of track.layouts) {
      const fileKey = `${track.id}--${layout.id}`

      // Layout-specific track narrative
      const narrativePath = path.join(projectRoot, TEXT_OUTPUT_DIR, `track-${fileKey}.json`)
      if (!fs.existsSync(narrativePath)) {
        tasks.push({
          id: `track-text-${fileKey}`,
          entityId: fileKey,
          entityName: `${track.name} – ${layout.name}`,
          category: 'tracks',
          type: 'text',
          priority: 2,
          prompt: buildLayoutNarrativePrompt(track, layout),
          outputPath: narrativePath,
        })
      }

      // Layout-specific pre-race content
      const preracePath = path.join(projectRoot, TEXT_OUTPUT_DIR, `prerace-${fileKey}.json`)
      if (!fs.existsSync(preracePath)) {
        tasks.push({
          id: `prerace-text-${fileKey}`,
          entityId: fileKey,
          entityName: `Pre-Race: ${track.name} – ${layout.name}`,
          category: 'prerace',
          type: 'text',
          priority: 2,
          prompt: buildLayoutPreRacePrompt(track, layout),
          outputPath: preracePath,
        })
      }
    }
  }

  return tasks
}

function buildAllLayoutsSummary(track: TrackData): string {
  return track.layouts
    .map(l => `  • ${l.name} (${l.id}) — ${l.lengthKm}km, ${l.turns} turns`)
    .join('\n')
}

function buildLayoutNarrativePrompt(track: TrackData, layout: TrackLayoutData): string {
  return `You are a motorsport journalist writing for a prestigious racing encyclopedia.
Write about a SPECIFIC LAYOUT of a real-world circuit — use real corner names, real events, and real characteristics that apply to THIS particular layout configuration.

=== VENUE ===
Official name: ${track.officialName || track.name}
Common name: ${track.name}
Country: ${track.country}${track.countryCode ? ` (${track.countryCode})` : ''}
Circuit type: ${track.type}

=== ALL LAYOUTS AT THIS VENUE ===
${buildAllLayoutsSummary(track)}

=== TARGET LAYOUT (write about THIS one) ===
Layout name: ${layout.name}
Layout ID: ${layout.id}
Length: ${layout.lengthKm} km
Turns: ${layout.turns}

CRITICAL RULES:
- Only describe corners, sections, and characteristics that ACTUALLY EXIST on the "${layout.name}" layout (${layout.lengthKm}km, ${layout.turns} turns).
- If this is a shorter/national layout, do NOT reference corners from the full/GP layout that are bypassed.
- If this is a historic layout, reflect the era-specific characteristics (older safety standards, different corner profiles, etc.).
- The famousCorners array must ONLY contain corners present on this specific layout.

Return a JSON object with EXACTLY these fields:
{
  "history": "2-3 paragraphs about THIS venue, with specific mention of races/events held on the ${layout.name} layout if any. Include general venue history.",
  "atmosphere": "A vivid paragraph about being at THIS venue during a race on the ${layout.name} configuration.",
  "trackCharacter": "One paragraph describing THIS LAYOUT's personality — how does the ${layout.lengthKm}km / ${layout.turns}-turn configuration drive? What makes it different from other layouts at the same venue?",
  "nickname": "The track's well-known nickname (e.g. 'The Temple of Speed' for Monza), or a fitting one for this layout variant.",
  "famousCorners": [
    { "name": "Real corner name ON THIS LAYOUT", "description": "What makes it special", "challenge": "The driving challenge it presents" }
  ],
  "keyFactors": ["4-5 key performance factors specific to the ${layout.name} layout"],
  "overtakingSpots": ["3-4 overtaking opportunities that exist on THIS ${layout.turns}-turn layout"],
  "historySnippets": ["5-6 one-liner facts about this venue a commentator could reference"],
  "weatherNotes": "Weather patterns at this venue and how they affect racing on this layout.",
  "drivingAdvice": "Expert racecraft advice specific to the ${layout.name} configuration.",
  "famousRaces": ["3-4 brief descriptions of famous races held at this venue (preferably on this layout if applicable)"],
  "localCulture": "The local area, food, culture, and paddock life."
}

IMPORTANT: Generate 3-5 items for famousCorners — ONLY corners that exist on the ${layout.name} layout (${layout.turns} turns, ${layout.lengthKm}km).
All content must be specific to this venue and layout, not generic filler.`
}

function buildLayoutPreRacePrompt(track: TrackData, layout: TrackLayoutData): string {
  return `You are a top-tier motorsport broadcast commentator (think David Croft, Martin Brundle) preparing commentary material for a race weekend.

=== VENUE ===
Official name: ${track.officialName || track.name}
Common name: ${track.name}
Country: ${track.country}${track.countryCode ? ` (${track.countryCode})` : ''}
Circuit type: ${track.type}

=== RACE LAYOUT ===
Layout: ${layout.name} (${layout.id})
Length: ${layout.lengthKm} km
Turns: ${layout.turns}

Generate broadcast-ready commentary snippets for THIS SPECIFIC LAYOUT. Each snippet should sound natural and be specific to the ${layout.name} configuration (${layout.lengthKm}km, ${layout.turns} turns).

CRITICAL: cornerCallouts must ONLY reference corners/sections that exist on the ${layout.name} layout. Do NOT mention corners from other layout variants that are bypassed on this configuration.

Return a JSON object with EXACTLY these fields (each array must contain the specified number of UNIQUE strings):
{
  "atmosphereSnippets": [
    "// 10 strings. Scene-setting lines specific to THIS venue — grandstands, scenery, crowd character. Can reference the ${layout.name} configuration."
  ],
  "historicalReferences": [
    "// 10 strings. Real historical moments at THIS track — famous overtakes, crashes, title deciders. Prefer events on this layout if known."
  ],
  "cornerCallouts": [
    "// 8 strings. Lines referencing corners/sections that EXIST on the ${layout.name} layout (${layout.turns} turns). Each must name a real corner on THIS configuration."
  ],
  "strategyPoints": [
    "// 8 strings. Strategy talk specific to the ${layout.name} layout — tire wear on this ${layout.lengthKm}km circuit, pit window length, fuel load."
  ],
  "weatherCommentary": [
    "// 5 strings. Weather lines specific to this venue's geography."
  ],
  "gridWalkQuotes": [
    "// 8 strings. Fictional paddock quotes referencing THIS venue and layout."
  ]
}

RULES:
- Every snippet MUST be specific to ${track.officialName || track.name} on the ${layout.name} layout.
- cornerCallouts MUST ONLY reference corners on THIS ${layout.turns}-turn, ${layout.lengthKm}km layout.
- Use REAL corner names, geography, and historical events.
- Vary tone: dramatic, analytical, casual, excited, reflective.
- 1-2 sentences each, broadcast-ready.
- No two snippets should make the same point.`
}
