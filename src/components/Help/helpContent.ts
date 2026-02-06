// Help content for each screen/feature in the Career Mod

export interface HelpSection {
  title: string
  description: string
  tips?: string[]
  relatedScreens?: { name: string; path: string }[]
}

export interface ScreenHelp {
  title: string
  overview: string
  sections: HelpSection[]
  quickTips: string[]
}

export const helpContent: Record<string, ScreenHelp> = {
  home: {
    title: 'Team HQ',
    overview: 'Your home base for managing your racing team. This dashboard shows your team\'s current status at a glance, including financial health, upcoming races, and key performance indicators.',
    sections: [
      {
        title: 'Quick Stats Bar',
        description: 'The top row shows your most critical metrics: Board Mood (how happy team leadership is), Financial Runway (weeks of funding remaining), Fleet Health (car condition), Team Readiness (preparation level), Driver Lineup, and Upcoming Costs.',
        tips: [
          'Keep your runway above 12 weeks to avoid financial stress',
          'Board mood below 40% puts your job at risk',
          'Fleet health affects reliability during races'
        ]
      },
      {
        title: 'Next Event',
        description: 'Shows your upcoming race with track information. On race day (Day 7 of a race week), the "Start Race" button appears.',
        tips: [
          'Click the card to see track details and history',
          'Race weekends span an entire week - plan activities accordingly'
        ]
      },
      {
        title: 'Championship Status',
        description: 'Your current series entry showing cars entered, championship points, and races completed.',
      },
      {
        title: 'Team Operations',
        description: 'Middle column shows driver lineup, staff status, and development progress. Keep these healthy for optimal performance.',
      },
      {
        title: 'Business & Finance',
        description: 'Right column displays sponsor health, board status, and upcoming costs. Managing these is crucial for team survival.',
      }
    ],
    quickTips: [
      'Check your emails daily for important communications',
      'Use the day advance controls to progress time',
      'Keep an eye on the runway - running out of money ends your career',
      'Meet board targets to keep your job secure'
    ]
  },

  finances: {
    title: 'Finances',
    overview: 'Manage your team\'s financial health. Track income, expenses, sponsor deals, and budget allocation to keep your team running.',
    sections: [
      {
        title: 'Financial Overview',
        description: 'The top cards show your current cash, year-to-date income and expenses, and monthly sponsor income.',
        tips: [
          'Team cash is your working capital - don\'t let it go negative',
          'Monitor the balance between income and expenses'
        ]
      },
      {
        title: 'Financial Runway',
        description: 'Shows how many weeks your team can operate with current funds. Based on your weekly burn rate minus expected income.',
        tips: [
          'Healthy: 26+ weeks',
          'Stable: 12-26 weeks',
          'Caution: 6-12 weeks',
          'Critical: 2-6 weeks',
          'Emergency: Less than 2 weeks'
        ]
      },
      {
        title: 'Cost Cap',
        description: 'In higher-tier series, spending is limited by regulations. Exceeding the cost cap results in penalties.',
        tips: [
          'Cost cap applies to Pro tier and above',
          'Not all expenses count toward the cap',
          'Entry fees and marketing are typically exempt'
        ]
      },
      {
        title: 'Sponsors',
        description: 'Your team sponsors provide regular income. Keep them satisfied by meeting performance targets.',
        tips: [
          'Satisfaction below 40% risks contract termination',
          'Meet or exceed targets for bonus payments',
          'Better results attract better sponsors'
        ]
      },
      {
        title: 'Budget Allocation',
        description: 'Divide your budget between Development, Travel, Marketing, and Contingency. Each allocation affects different aspects of operations.',
        tips: [
          'Development budget fuels R&D progress',
          'Travel budget affects logistics costs',
          'Contingency covers unexpected repairs'
        ]
      }
    ],
    quickTips: [
      'Sponsor income is your primary revenue source - keep them happy',
      'Monitor weekly burn rate vs income to maintain sustainability',
      'Allocate budgets based on your current priorities',
      'Check the Analytics tab for spending trends'
    ]
  },

  garage: {
    title: 'Garage',
    overview: 'Manage your racing fleet. Assign drivers, maintain cars, install upgrades, and prepare for race weekends.',
    sections: [
      {
        title: 'Car Management',
        description: 'Each car shows its current condition, assigned driver, and installed components. Cars degrade over races and need maintenance.',
        tips: [
          'Worn parts have higher failure risk',
          'Schedule maintenance between races',
          'Balance performance vs reliability upgrades'
        ]
      },
      {
        title: 'Driver Assignment',
        description: 'Assign drivers to cars for race weekends. Each driver has different skills that affect performance.',
        tips: [
          'Match driver strengths to track characteristics',
          'Reserve drivers can substitute for injuries',
          'Contract terms may require race starts'
        ]
      },
      {
        title: 'Upgrades & Parts',
        description: 'Install developed upgrades to improve performance. Parts wear out and need replacement.',
        tips: [
          'Upgrades come from your Development program',
          'Some upgrades trade reliability for speed',
          'Track the wear level of critical components'
        ]
      }
    ],
    quickTips: [
      'Check car condition before each race weekend',
      'Keep spare parts for critical failures',
      'Driver fatigue affects performance',
      'Consider track type when assigning drivers'
    ]
  },

  calendar: {
    title: 'Calendar',
    overview: 'Plan your season and daily activities. Schedule training, testing, press events, and manage your race calendar.',
    sections: [
      {
        title: 'Race Calendar',
        description: 'Shows all races in your entered series with track information. Race weeks are highlighted.',
        tips: [
          'Plan activities around race weekends',
          'Consider travel time between events',
          'Back-to-back races increase team fatigue'
        ]
      },
      {
        title: 'Activities',
        description: 'Schedule various activities like training, testing, sponsor events, and media appearances.',
        tips: [
          'Some activities are mandatory (contract obligations)',
          'Training improves driver skills',
          'Sponsor events boost satisfaction',
          'Don\'t overwork - fatigue hurts performance'
        ]
      },
      {
        title: 'Day Progression',
        description: 'Each week has 7 days. Advance time to trigger scheduled activities and reach race day.',
        tips: [
          'Race day is typically Day 7',
          'Some activities span multiple days',
          'Check for conflicts before advancing'
        ]
      }
    ],
    quickTips: [
      'Balance activities to avoid driver burnout',
      'Schedule maintenance during non-race weeks',
      'Mandatory activities cannot be skipped',
      'Media duties affect public image'
    ]
  },

  facilities: {
    title: 'Facilities',
    overview: 'Upgrade your team\'s infrastructure. Better facilities enable faster development and improved performance.',
    sections: [
      {
        title: 'Facility Types',
        description: 'Different facilities serve different purposes: Aerodynamics, Chassis, Engine, Simulator, Manufacturing, and Marketing.',
        tips: [
          'Aero Facility: Improves downforce development',
          'Chassis Facility: Better handling upgrades',
          'Engine Facility: Power and reliability',
          'Simulator: Driver training and setup testing',
          'Manufacturing: Faster part production',
          'Marketing: Better sponsor attraction'
        ]
      },
      {
        title: 'Upgrade Process',
        description: 'Facility upgrades cost money and take time. Higher levels unlock better development options.',
        tips: [
          'Prioritize facilities matching your development focus',
          'Upgrades cannot be cancelled once started',
          'Staff efficiency improves with better facilities'
        ]
      },
      {
        title: 'Staff Assignment',
        description: 'Assign facility staff to departments to boost their effectiveness.',
        tips: [
          'Skilled staff work faster',
          'Understaffed facilities are less efficient',
          'Staff quality matters more than quantity'
        ]
      }
    ],
    quickTips: [
      'Start with the simulator for driver development',
      'Manufacturing speeds up all production',
      'Match facility investment to your race tier',
      'Better facilities attract better staff'
    ]
  },

  staffMarket: {
    title: 'Staff Market',
    overview: 'Hire key personnel for your team. Staff skills directly impact car performance, strategy, and development.',
    sections: [
      {
        title: 'Role Types',
        description: 'Different roles affect different aspects of your team:',
        tips: [
          'Chief Engineer: Car setup and reliability',
          'Strategist: Race strategy and pit timing',
          'Performance Analyst: Data analysis and development',
          'Mechanics: Pit stop speed and repairs',
          'Designers: Development speed in their specialty'
        ]
      },
      {
        title: 'Hiring Process',
        description: 'Browse available staff, review their skills and salary demands, then make offers.',
        tips: [
          'Higher-skilled staff demand higher salaries',
          'Reputation affects who will work for you',
          'Some staff may reject offers from low-tier teams'
        ]
      },
      {
        title: 'Contracts',
        description: 'Staff contracts have duration and buyout clauses. Plan your hiring strategy.',
        tips: [
          'Long contracts provide stability',
          'Buyouts can be expensive',
          'Staff may demand raises at renewal'
        ]
      }
    ],
    quickTips: [
      'Prioritize Chief Engineer and Strategist',
      'Balance skill vs budget constraints',
      'Check contract length before committing',
      'Invest in staff as your budget grows'
    ]
  },

  media: {
    title: 'Media Center',
    overview: 'Manage your public image and media relationships. Handle press conferences, social media, and public relations.',
    sections: [
      {
        title: 'Press Conferences',
        description: 'Mandatory media events where your responses affect public perception and sponsor satisfaction.',
        tips: [
          'Honest answers build trust over time',
          'Controversial statements increase scrutiny',
          'Sponsors monitor your public image'
        ]
      },
      {
        title: 'Social Media',
        description: 'Post updates, engage with fans, and build your following. Social presence affects marketability.',
        tips: [
          'Regular posts maintain engagement',
          'Positive results boost follower growth',
          'Controversial posts can backfire'
        ]
      },
      {
        title: 'Media Scrutiny',
        description: 'Higher-profile teams face more media attention. Mistakes are more costly at higher scrutiny levels.',
        tips: [
          'Good results reduce negative coverage',
          'Scandals increase scrutiny',
          'Low-tier teams have more privacy'
        ]
      }
    ],
    quickTips: [
      'Complete mandatory media duties on time',
      'Build a consistent media persona',
      'Monitor public image trends',
      'Engage with sponsors through media'
    ]
  },

  seriesEntry: {
    title: 'Series Entry',
    overview: 'Enter racing championships. Choose series that match your budget, cars, and skill level.',
    sections: [
      {
        title: 'Available Series',
        description: 'Browse championships you can enter. Requirements include compatible cars, entry fees, and minimum reputation.',
        tips: [
          'Check car compatibility before entering',
          'Entry fees vary by prestige',
          'Some series require specific licenses'
        ]
      },
      {
        title: 'Entry Requirements',
        description: 'Each series has requirements: cars, budget, and sometimes reputation minimums.',
        tips: [
          'Budget for the entire season, not just entry',
          'Higher-tier series have cost caps',
          'Multi-class series allow different cars'
        ]
      },
      {
        title: 'Progression',
        description: 'Win championships to unlock higher tiers and earn invitations to prestigious events.',
        tips: [
          'Start in appropriate tier for your resources',
          'Championships unlock sponsor opportunities',
          'Building reputation opens doors'
        ]
      }
    ],
    quickTips: [
      'Start with series matching your budget',
      'Buy a car before trying to enter a series',
      'Consider travel costs in your budget',
      'Higher tiers have better prize money'
    ]
  },

  marketplace: {
    title: 'Marketplace',
    overview: 'Buy and sell cars, equipment, and liveries. Build your racing fleet and acquire competitive machinery.',
    sections: [
      {
        title: 'Car Purchases',
        description: 'Browse available cars by class, manufacturer, and series compatibility.',
        tips: [
          'Check series compatibility before buying',
          'Used cars are cheaper but may need work',
          'Manufacturer support provides benefits'
        ]
      },
      {
        title: 'Liveries',
        description: 'Customize your cars with team liveries. Some sponsors require specific branding.',
        tips: [
          'Team colors build brand recognition',
          'Sponsor logos must be displayed correctly',
          'Custom liveries cost extra'
        ]
      },
      {
        title: 'Selling',
        description: 'Sell cars you no longer need. Used cars depreciate based on condition and age.',
        tips: [
          'Maintain cars to retain value',
          'Market demand affects prices',
          'Consider keeping backup cars'
        ]
      }
    ],
    quickTips: [
      'New players should buy a reliable entry-level car first',
      'Check part condition on used purchases',
      'Match cars to your intended series',
      'Some manufacturers offer factory support'
    ]
  },

  contracts: {
    title: 'Contracts',
    overview: 'Manage driver and staff contracts. Review terms, negotiate renewals, and handle personnel changes.',
    sections: [
      {
        title: 'Driver Contracts',
        description: 'Driver agreements specify salary, duration, race commitments, and performance bonuses.',
        tips: [
          'Review race start requirements',
          'Performance bonuses motivate drivers',
          'Buyout clauses protect both parties'
        ]
      },
      {
        title: 'Staff Contracts',
        description: 'Staff agreements cover salary and duration. Key staff are harder to replace.',
        tips: [
          'Plan succession for key roles',
          'Renewals often include raise demands',
          'Notice periods affect timing'
        ]
      },
      {
        title: 'Negotiations',
        description: 'When contracts expire, negotiate terms with personnel or find replacements.',
        tips: [
          'Start negotiations before expiry',
          'Market rates change over time',
          'Reputation affects negotiating power'
        ]
      }
    ],
    quickTips: [
      'Track contract expiration dates',
      'Budget for salary increases',
      'Keep backup candidates in mind',
      'Read all terms before signing'
    ]
  },

  raceDay: {
    title: 'Race Day',
    overview: 'Enter race results from your AMS2 sessions. Record finishing positions, incidents, and earn championship points.',
    sections: [
      {
        title: 'Results Entry',
        description: 'After racing in AMS2, enter your finishing position and any notable events.',
        tips: [
          'Enable UDP telemetry for automatic detection',
          'Manual entry is always available',
          'Include all drivers if running multiple cars'
        ]
      },
      {
        title: 'AMS2 Integration',
        description: 'The mod can detect your AMS2 races via UDP telemetry and auto-fill some data.',
        tips: [
          'Configure AMS2 path in Settings',
          'UDP port default is 5606',
          'Shared memory provides additional data'
        ]
      },
      {
        title: 'Points & Standings',
        description: 'Results update championship standings and trigger sponsor satisfaction changes.',
        tips: [
          'Points vary by series',
          'DNFs affect reliability reputation',
          'Podiums boost sponsor satisfaction'
        ]
      }
    ],
    quickTips: [
      'Configure AMS2 settings first',
      'Save results immediately after racing',
      'Check standings after each race',
      'DNFs have consequences beyond the race'
    ]
  },

  stats: {
    title: 'Career Statistics',
    overview: 'Track your career progress, achievements, and racing history. View milestones and work toward GOAT status.',
    sections: [
      {
        title: 'Career Overview',
        description: 'Summary of your racing career including total races, wins, podiums, and championships.',
      },
      {
        title: 'GOAT Progress',
        description: 'Track your progression through driver tiers: Rookie to Club Racer to Professional to Legend to GOAT.',
        tips: [
          'Each tier has milestone requirements',
          'Track mastery unlocks achievements',
          'Historical records provide extra prestige'
        ]
      },
      {
        title: 'Achievements',
        description: 'Unlock achievements for career milestones, streaks, and special accomplishments.',
        tips: [
          'First-time achievements are permanent',
          'Streaks require consecutive results',
          'Special challenges offer unique rewards'
        ]
      }
    ],
    quickTips: [
      'Check required milestones for next tier',
      'Track mastery requires multiple wins',
      'Some achievements unlock special features'
    ]
  },

  settings: {
    title: 'Settings',
    overview: 'Configure game options, AMS2 integration, and preferences.',
    sections: [
      {
        title: 'AMS2 Configuration',
        description: 'Set up the connection to Automobilista 2 for race detection and AI driver export.',
        tips: [
          'AMS2 path is usually auto-detected',
          'Enable UDP telemetry in AMS2 settings',
          'Default UDP port is 5606'
        ]
      },
      {
        title: 'AI Commentary',
        description: 'Optional AI-powered commentary using Gemini and ElevenLabs APIs.',
        tips: [
          'Requires API keys',
          'Commentary adds immersion',
          'Can be disabled for performance'
        ]
      },
      {
        title: 'Data Management',
        description: 'Export, import, or reset your career data.',
        tips: [
          'Backup saves regularly',
          'Export before major updates',
          'Reset cannot be undone'
        ]
      }
    ],
    quickTips: [
      'Configure AMS2 path before your first race',
      'Test UDP connection in AMS2',
      'Keep backups of important saves'
    ]
  }
}

// Get help content for a route/screen
export function getHelpForScreen(pathname: string): ScreenHelp | null {
  // Remove leading slash and get base route
  const route = pathname.replace(/^\//, '').split('/')[0] || 'home'
  
  // Map routes to help content keys
  const routeMap: Record<string, string> = {
    '': 'home',
    'home': 'home',
    'finances': 'finances',
    'garage': 'garage',
    'calendar': 'calendar',
    'facilities': 'facilities',
    'staff-market': 'staffMarket',
    'media': 'media',
    'series-entry': 'seriesEntry',
    'marketplace': 'marketplace',
    'contracts': 'contracts',
    'race-day': 'raceDay',
    'stats': 'stats',
    'settings': 'settings',
    'sponsor-market': 'finances', // Redirect to finances help
    'paddock': 'home', // General help
    'emails': 'home', // General help
    'logs': 'settings' // Redirect to settings help
  }
  
  const helpKey = routeMap[route] || 'home'
  return helpContent[helpKey] || null
}
