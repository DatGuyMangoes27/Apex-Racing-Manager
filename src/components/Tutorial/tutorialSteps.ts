// Tutorial step configuration for first-time players

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector?: string // CSS selector for spotlight element
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    type: 'navigate' | 'next' | 'complete'
    path?: string
  }
  highlight?: boolean // Whether to highlight target element
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Career Mod!',
    description: 'Congratulations on starting your team ownership journey! This quick tutorial will show you around and help you get started on the right track.',
    position: 'center',
    action: {
      label: 'Let\'s Begin',
      type: 'next'
    }
  },
  {
    id: 'dashboard-overview',
    title: 'Your Team HQ',
    description: 'This is your home base. Here you\'ll see your team\'s status at a glance - financial health, upcoming races, staff status, and more. The Quick Stats bar at the top shows your most critical metrics.',
    position: 'top',
    action: {
      label: 'Next',
      type: 'next'
    }
  },
  {
    id: 'objectives',
    title: 'Current Objectives',
    description: 'The Objectives panel shows what you should do next. Start by completing the high-priority tasks - they\'ll guide you through setting up your team.',
    targetSelector: '[data-tutorial="objectives-panel"]',
    position: 'right',
    highlight: true,
    action: {
      label: 'Got it',
      type: 'next'
    }
  },
  {
    id: 'day-controls',
    title: 'Time Progression',
    description: 'Use these controls to advance time. Each week has 7 days, and race day is typically Day 7 of a race week. Advancing time triggers scheduled activities and progresses your career.',
    targetSelector: '[data-tutorial="day-controls"]',
    position: 'bottom',
    highlight: true,
    action: {
      label: 'Understood',
      type: 'next'
    }
  },
  {
    id: 'marketplace',
    title: 'First Step: Get a Car',
    description: 'Your first priority is to purchase a car. Head to the Marketplace to browse available vehicles that fit your budget. Look for cars compatible with series you want to enter.',
    position: 'center',
    action: {
      label: 'Go to Marketplace',
      type: 'navigate',
      path: '/marketplace'
    }
  },
  {
    id: 'marketplace-browse',
    title: 'Browse Available Cars',
    description: 'Here you can see all cars available for purchase. Check the price, class, and series compatibility. As a new team, start with an affordable entry-level car.',
    position: 'top',
    action: {
      label: 'Next',
      type: 'next'
    }
  },
  {
    id: 'series-entry',
    title: 'Next: Enter a Series',
    description: 'After buying a car, you\'ll need to enter a racing series. The Series Entry screen shows championships you can compete in based on your car and budget.',
    position: 'center',
    action: {
      label: 'View Series',
      type: 'navigate',
      path: '/series-entry'
    }
  },
  {
    id: 'series-info',
    title: 'Choose Wisely',
    description: 'Each series has different requirements, entry fees, and prize money. Start with a series that matches your budget - you need to fund the whole season, not just the entry fee.',
    position: 'top',
    action: {
      label: 'Got it',
      type: 'next'
    }
  },
  {
    id: 'garage',
    title: 'Prepare Your Team',
    description: 'The Garage is where you manage your cars, assign drivers, and install upgrades. Make sure to assign yourself (or hire a driver) to your car before race day.',
    position: 'center',
    action: {
      label: 'View Garage',
      type: 'navigate',
      path: '/garage'
    }
  },
  {
    id: 'garage-info',
    title: 'Car Management',
    description: 'Keep an eye on your car\'s condition and part wear. Maintenance between races keeps your car reliable. Worn parts increase the chance of failures.',
    position: 'top',
    action: {
      label: 'Understood',
      type: 'next'
    }
  },
  {
    id: 'finances',
    title: 'Watch Your Finances',
    description: 'The Finances screen is crucial. Monitor your cash, runway (weeks of funding), and sponsor relationships. Running out of money ends your career!',
    position: 'center',
    action: {
      label: 'View Finances',
      type: 'navigate',
      path: '/finances'
    }
  },
  {
    id: 'finances-info',
    title: 'Financial Health',
    description: 'Your "runway" shows how many weeks you can operate. Keep it above 12 weeks for safety. Sponsors provide regular income - keep them happy by meeting performance targets.',
    position: 'top',
    action: {
      label: 'Got it',
      type: 'next'
    }
  },
  {
    id: 'calendar',
    title: 'Plan Your Season',
    description: 'The Calendar shows your race schedule and lets you plan activities. Schedule training, testing, and media events around your race weekends.',
    position: 'center',
    action: {
      label: 'View Calendar',
      type: 'navigate',
      path: '/calendar'
    }
  },
  {
    id: 'calendar-info',
    title: 'Race Weeks',
    description: 'Race weeks are highlighted. Use the days before race day to prepare. Don\'t forget to advance time to reach race day - that\'s when you\'ll record your AMS2 results!',
    position: 'top',
    action: {
      label: 'Understood',
      type: 'next'
    }
  },
  {
    id: 'help-system',
    title: 'Need Help?',
    description: 'Look for the help button (?) in the corner of your screen. It provides context-sensitive help for whatever screen you\'re on. You can also access the full guide from the sidebar.',
    position: 'center',
    action: {
      label: 'Next',
      type: 'next'
    }
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'That covers the basics! Remember: buy a car, enter a series, assign a driver, advance time to race day, then record your AMS2 results. Good luck with your racing career!',
    position: 'center',
    action: {
      label: 'Start My Career',
      type: 'complete'
    }
  }
]

// Get the next step in the tutorial
export function getNextStep(currentStepId: string): TutorialStep | null {
  const currentIndex = tutorialSteps.findIndex(s => s.id === currentStepId)
  if (currentIndex === -1 || currentIndex >= tutorialSteps.length - 1) {
    return null
  }
  return tutorialSteps[currentIndex + 1]
}

// Get step by ID
export function getStepById(stepId: string): TutorialStep | null {
  return tutorialSteps.find(s => s.id === stepId) || null
}

// Get progress percentage
export function getTutorialProgress(currentStepId: string): number {
  const currentIndex = tutorialSteps.findIndex(s => s.id === currentStepId)
  if (currentIndex === -1) return 0
  return Math.round(((currentIndex + 1) / tutorialSteps.length) * 100)
}
