/**
 * Master generator index - creates and combines all generation tasks.
 */

import { GenerationTask } from '../batch-processor'
import { DataReader } from '../data-reader'
import { createDriverTextTasks, createDriverImageTasks } from './driver-generator'
import { createTeamTextTasks } from './team-generator'
import { createTrackTextTasks } from './track-generator'
import { createStaffPoolTextTasks, createAITeamStaffTextTasks, createStaffImageTasks } from './staff-generator'
import { createPartnerTextTasks, createPartnerImageTasks } from './partner-generator'
import { createContactTextTasks, createContactImageTasks } from './contact-generator'
import { createSponsorTextTasks, createSponsorImageTasks } from './sponsor-generator'
import { createSceneImageTasks } from './scene-generator'
import { createLifestyleImageTasks } from './lifestyle-generator'
import { createMiscImageTasks } from './misc-generator'
import { createChampionshipImageTasks } from './championship-generator'

export interface GenerationSummary {
  textTasks: number
  imageTasks: number
  byCategory: Record<string, { text: number; image: number }>
  estimatedApiCalls: number
  estimatedDays: number
}

export function createAllTextTasks(projectRoot: string): GenerationTask[] {
  const reader = new DataReader(projectRoot)

  const tasks: GenerationTask[] = [
    ...createTeamTextTasks(reader, projectRoot),
    ...createTrackTextTasks(reader, projectRoot),
    ...createDriverTextTasks(reader, projectRoot),
    ...createStaffPoolTextTasks(projectRoot),
    ...createAITeamStaffTextTasks(reader, projectRoot),
    ...createPartnerTextTasks(projectRoot),
    ...createContactTextTasks(projectRoot),
    ...createSponsorTextTasks(projectRoot),
  ]

  return tasks.sort((a, b) => a.priority - b.priority)
}

export function createAllImageTasks(projectRoot: string): GenerationTask[] {
  const reader = new DataReader(projectRoot)

  const tasks: GenerationTask[] = [
    // Scene images first (priority 1) - most visible in the app
    ...createSceneImageTasks(projectRoot),
    // Lifestyle images (priority 2) - catalog items, vehicles, pets, etc.
    ...createLifestyleImageTasks(projectRoot),
    // Championship logos (priority 3) - series identity
    ...createChampionshipImageTasks(projectRoot),
    // Miscellaneous images (priority 3) - merchandise, weather, news, celebrations
    ...createMiscImageTasks(projectRoot),
    // Non-driver images (priority 4-5)
    ...createStaffImageTasks(projectRoot),
    ...createPartnerImageTasks(projectRoot),
    ...createContactImageTasks(projectRoot),
    ...createSponsorImageTasks(projectRoot),
    // Driver images last (priority 10)
    ...createDriverImageTasks(reader, projectRoot),
  ]

  return tasks.sort((a, b) => a.priority - b.priority)
}

export function getGenerationSummary(projectRoot: string, dailyBudget: number = 2000): GenerationSummary {
  const textTasks = createAllTextTasks(projectRoot)
  const imageTasks = createAllImageTasks(projectRoot)

  const byCategory: Record<string, { text: number; image: number }> = {}

  for (const task of textTasks) {
    if (!byCategory[task.category]) byCategory[task.category] = { text: 0, image: 0 }
    byCategory[task.category].text++
  }

  for (const task of imageTasks) {
    if (!byCategory[task.category]) byCategory[task.category] = { text: 0, image: 0 }
    byCategory[task.category].image++
  }

  return {
    textTasks: textTasks.length,
    imageTasks: imageTasks.length,
    byCategory,
    estimatedApiCalls: textTasks.length + imageTasks.length,
    estimatedDays: Math.ceil(imageTasks.length / dailyBudget),
  }
}
