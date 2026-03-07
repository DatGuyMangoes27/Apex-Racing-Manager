/**
 * Team narrative generation tasks.
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'
import { DataReader } from '../data-reader'

const TEXT_OUTPUT_DIR = 'scripts/content-studio-data/output/narratives'

export function createTeamTextTasks(reader: DataReader, projectRoot: string): GenerationTask[] {
  const teams = reader.extractTeams()
  const tasks: GenerationTask[] = []

  for (const team of teams) {
    const taskId = `team-text-${team.id}`
    const outputPath = path.join(projectRoot, TEXT_OUTPUT_DIR, `team-${team.id}.json`)

    if (fs.existsSync(outputPath)) continue

    const prompt = buildTeamNarrativePrompt(team)

    tasks.push({
      id: taskId,
      entityId: team.id,
      entityName: team.name,
      category: 'teams',
      type: 'text',
      priority: 1, // Highest priority for text
      prompt,
      outputPath,
    })
  }

  return tasks
}

function buildTeamNarrativePrompt(team: any): string {
  return `You are a motorsport historian writing for a premium racing encyclopedia.

Generate a rich narrative for this racing team:

Team Name: ${team.name}
Country: ${team.country}
Tier: ${team.tier || 'amateur'}
Budget Level: ${team.budget || 'low'}
Prestige: ${team.prestige || 50}/100
Facilities: ${team.facilities || 'basic'}

Return a JSON object with EXACTLY these fields:
{
  "origin": "A 2-3 paragraph origin story about how the team was founded, the key people behind it, and pivotal moments in its history.",
  "philosophy": "A paragraph about the team's racing philosophy, approach to car development, and team culture.",
  "achievements": ["List of 3-5 notable achievements or moments in the team's history"],
  "teamPrincipal": {
    "name": "Full name of the team principal",
    "background": "2-3 sentences about their background and leadership style",
    "nationality": "Their nationality"
  },
  "keyFigures": [
    {
      "name": "Full name",
      "role": "Their role (e.g. Technical Director, Chief Designer)",
      "description": "1-2 sentences about them"
    }
  ],
  "headquarters": "Description of where the team is based and their facilities",
  "reputation": "A short phrase capturing the team's reputation (e.g. 'The Giant Killers', 'Old Money Excellence')",
  "fanBase": "Description of the team's supporter culture and identity"
}

Make the narrative consistent with the team's tier and budget.
A low-tier amateur team should have a scrappy underdog story.
A high-tier professional team should have a prestigious legacy.
Be creative and make each team feel unique and memorable.`
}
