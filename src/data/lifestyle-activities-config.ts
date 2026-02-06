// ============================================
// LIFESTYLE ACTIVITIES CONFIGURATION
// ============================================
// Defines activities that consume hours from the daily time budget.
// Each lifestyle item (hobby, pet, education, etc.) maps to an activity
// that the player can perform during the day.

import type { DrainLevel } from '@/store/careerStore'
import type { HobbyType } from '@/data/lifestyle-config'
import type { PetType } from '@/data/lifestyle-assets-config'

// ============================================
// TYPES
// ============================================

export type LifestyleActivityCategory =
  | 'hobby'
  | 'pet'
  | 'education'
  | 'fitness'
  | 'experience'

export interface LifestyleActivityBenefits {
  stressReduction?: number
  skillProgress?: number      // Hobby skill progress points
  fitnessBonus?: number       // Added to fitness stat
  healthBonus?: number        // Added to physical health
  happinessBoost?: number     // General happiness
  moduleProgress?: number     // Education module progress (0-1 = fraction of module)
  petHappiness?: number       // Pet happiness boost
}

export interface LifestyleActivityTemplate {
  id: string
  category: LifestyleActivityCategory
  name: string                // Display name (supports {name} placeholder)
  hoursRequired: number
  drainLevel: DrainLevel
  cooldownType: 'once_per_day' | 'hours' | 'none'
  cooldownValue: number       // Hours if cooldownType is 'hours', ignored otherwise
  benefits: LifestyleActivityBenefits
  description: string
}

// ============================================
// HOBBY ACTIVITIES
// ============================================

export const HOBBY_ACTIVITY_CONFIG: Record<HobbyType, { hoursRequired: number; drainLevel: DrainLevel }> = {
  golf: { hoursRequired: 3, drainLevel: 'low' },
  yachting: { hoursRequired: 4, drainLevel: 'low' },
  car_collecting: { hoursRequired: 2, drainLevel: 'low' },
  horse_racing: { hoursRequired: 3, drainLevel: 'normal' },
  art_collecting: { hoursRequired: 2, drainLevel: 'low' },
  wine_collecting: { hoursRequired: 1, drainLevel: 'restorative' },
  flying: { hoursRequired: 3, drainLevel: 'normal' },
  fishing: { hoursRequired: 3, drainLevel: 'restorative' },
  photography: { hoursRequired: 2, drainLevel: 'low' },
}

export function getHobbyActivity(hobbyType: HobbyType, hobbyName: string): LifestyleActivityTemplate {
  const config = HOBBY_ACTIVITY_CONFIG[hobbyType] || { hoursRequired: 2, drainLevel: 'low' as DrainLevel }
  return {
    id: `hobby_${hobbyType}`,
    category: 'hobby',
    name: `Practice ${hobbyName}`,
    hoursRequired: config.hoursRequired,
    drainLevel: config.drainLevel,
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      stressReduction: 10,
      skillProgress: 8,
    },
    description: `Spend time practicing ${hobbyName} to improve your skill and reduce stress.`
  }
}

// ============================================
// PET ACTIVITIES
// ============================================

export const PET_ACTIVITY_CONFIG: Record<PetType, { hoursRequired: number; drainLevel: DrainLevel; activityName: string }> = {
  dog: { hoursRequired: 1, drainLevel: 'restorative', activityName: 'Walk & play with' },
  cat: { hoursRequired: 1, drainLevel: 'restorative', activityName: 'Spend time with' },
  horse: { hoursRequired: 2, drainLevel: 'low', activityName: 'Ride & groom' },
  exotic_bird: { hoursRequired: 1, drainLevel: 'restorative', activityName: 'Train & interact with' },
  aquarium: { hoursRequired: 1, drainLevel: 'restorative', activityName: 'Maintain & observe' },
  reptile: { hoursRequired: 1, drainLevel: 'restorative', activityName: 'Care for' },
}

export function getPetActivity(petType: PetType, petName: string): LifestyleActivityTemplate {
  const config = PET_ACTIVITY_CONFIG[petType] || { hoursRequired: 1, drainLevel: 'restorative' as DrainLevel, activityName: 'Spend time with' }
  return {
    id: `pet_${petType}_${petName}`,
    category: 'pet',
    name: `${config.activityName} ${petName}`,
    hoursRequired: config.hoursRequired,
    drainLevel: config.drainLevel,
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      stressReduction: 8,
      happinessBoost: 5,
      petHappiness: 15,
    },
    description: `Quality time with ${petName} reduces stress and keeps them happy.`
  }
}

// ============================================
// EDUCATION ACTIVITIES
// ============================================

export const EDUCATION_ACTIVITY: LifestyleActivityTemplate = {
  id: 'education_study',
  category: 'education',
  name: 'Study Session',
  hoursRequired: 2,
  drainLevel: 'normal',
  cooldownType: 'once_per_day',
  cooldownValue: 0,
  benefits: {
    moduleProgress: 0.15,     // 15% of a module per session (~7 sessions per module)
    stressReduction: -2,      // Studying is slightly stressful
  },
  description: 'Dedicate focused time to coursework.'
}

export function getEducationActivity(courseName: string): LifestyleActivityTemplate {
  return {
    ...EDUCATION_ACTIVITY,
    id: `education_${courseName.toLowerCase().replace(/\s+/g, '_')}`,
    name: `Study ${courseName}`,
    description: `Focused study session for ${courseName}.`
  }
}

// ============================================
// FITNESS ACTIVITIES
// ============================================

export const FITNESS_ACTIVITIES: LifestyleActivityTemplate[] = [
  {
    id: 'fitness_workout',
    category: 'fitness',
    name: 'Gym Workout',
    hoursRequired: 1.5,
    drainLevel: 'high',
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      fitnessBonus: 2,
      healthBonus: 1,
      stressReduction: 5,
    },
    description: 'Hit the gym for a strength and cardio session.'
  },
  {
    id: 'fitness_yoga',
    category: 'fitness',
    name: 'Yoga & Meditation',
    hoursRequired: 1,
    drainLevel: 'restorative',
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      fitnessBonus: 1,
      stressReduction: 12,
      happinessBoost: 3,
    },
    description: 'Yoga and meditation for flexibility and mental clarity.'
  },
  {
    id: 'fitness_run',
    category: 'fitness',
    name: 'Morning Run',
    hoursRequired: 1,
    drainLevel: 'normal',
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      fitnessBonus: 2,
      healthBonus: 1,
      stressReduction: 6,
    },
    description: 'A brisk run to start the day right.'
  },
  {
    id: 'fitness_swim',
    category: 'fitness',
    name: 'Swimming Session',
    hoursRequired: 1.5,
    drainLevel: 'normal',
    cooldownType: 'once_per_day',
    cooldownValue: 0,
    benefits: {
      fitnessBonus: 2,
      healthBonus: 1,
      stressReduction: 8,
    },
    description: 'Low-impact full-body workout in the pool.'
  },
]

// ============================================
// EXPERIENCE ACTIVITIES
// ============================================

export function getExperienceActivity(experienceName: string, _durationWeeks: number): LifestyleActivityTemplate {
  return {
    id: `experience_${experienceName.toLowerCase().replace(/\s+/g, '_')}`,
    category: 'experience',
    name: `Enjoy ${experienceName}`,
    hoursRequired: 3,
    drainLevel: 'low',
    cooldownType: 'none',
    cooldownValue: 0,
    benefits: {
      stressReduction: 15,
      happinessBoost: 10,
    },
    description: `Immerse yourself in the ${experienceName} experience.`
  }
}

// ============================================
// HELPERS
// ============================================

/** Get all available fitness activities */
export function getAvailableFitnessActivities(): LifestyleActivityTemplate[] {
  return FITNESS_ACTIVITIES
}

/** Check if an activity has been done today based on dayLog activity IDs */
export function hasCompletedActivityToday(activityId: string, completedActivities: string[]): boolean {
  return completedActivities.includes(activityId)
}
