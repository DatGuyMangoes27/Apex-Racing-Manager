/**
 * Regulation Change System
 * 
 * Generates pre-season regulation change announcements and
 * in-season technical directive notifications.
 */

export interface RegulationChange {
  id: string
  title: string
  description: string
  type: 'major' | 'minor' | 'technical_directive'
  area: 'aero' | 'engine' | 'chassis' | 'safety' | 'sporting' | 'financial'
  effectiveWeek: number
  effectiveYear: number
  effects: RegulationEffect[]
}

export interface RegulationEffect {
  stat: string
  change: number
  description: string
}

// ============================================
// REGULATION TEMPLATES
// ============================================

const REGULATION_TEMPLATES: Omit<RegulationChange, 'id' | 'effectiveWeek' | 'effectiveYear'>[] = [
  // Major regulation changes (pre-season)
  {
    title: 'New Aerodynamic Regulations',
    description: 'Significant changes to aero regulations will reduce downforce by 15%. Teams must redesign front and rear wing packages.',
    type: 'major',
    area: 'aero',
    effects: [
      { stat: 'aeroDevReset', change: -20, description: 'Aero development progress partially reset' },
      { stat: 'teamDevelopment', change: -5, description: 'Overall development disrupted' }
    ]
  },
  {
    title: 'Engine Performance Parity Rules',
    description: 'New balance of performance rules aim to bring engine manufacturers closer together. Power unit homologation changes.',
    type: 'major',
    area: 'engine',
    effects: [
      { stat: 'engineDevReset', change: -10, description: 'Engine development progress adjusted' }
    ]
  },
  {
    title: 'Cost Cap Introduction',
    description: 'A new cost cap limits team spending. Bigger teams face restrictions, while smaller teams gain competitive opportunity.',
    type: 'major',
    area: 'financial',
    effects: [
      { stat: 'budgetCap', change: -15, description: 'Maximum spending reduced by 15%' },
      { stat: 'competitiveness', change: 5, description: 'Field becomes more competitive' }
    ]
  },
  {
    title: 'Safety Cell Standards Update',
    description: 'Updated crash structure requirements mean chassis modifications are needed across all teams.',
    type: 'major',
    area: 'safety',
    effects: [
      { stat: 'chassisDevReset', change: -10, description: 'Chassis development progress adjusted' },
      { stat: 'teamCash', change: -5000, description: 'Compliance costs' }
    ]
  },
  
  // Minor regulation changes (mid-season possible)
  {
    title: 'Tire Compound Changes',
    description: 'The tire supplier has introduced a new compound for the second half of the season. Teams need to adapt setups.',
    type: 'minor',
    area: 'chassis',
    effects: [
      { stat: 'setupDifficulty', change: 5, description: 'Setup window becomes tighter' }
    ]
  },
  {
    title: 'Minimum Weight Increase',
    description: 'The minimum weight limit has been raised by 10kg, affecting car balance and performance.',
    type: 'minor',
    area: 'chassis',
    effects: [
      { stat: 'lapTimeAdjust', change: 2, description: 'Slightly slower lap times expected' }
    ]
  },
  {
    title: 'Track Limits Enforcement Tightened',
    description: 'Stricter track limits enforcement with electronic monitoring. Penalties will be automatic.',
    type: 'minor',
    area: 'sporting',
    effects: [
      { stat: 'penaltyRisk', change: 10, description: 'Higher chance of time penalties' }
    ]
  },
  
  // Technical directives (can happen anytime)
  {
    title: 'Technical Directive on Floor Flexibility',
    description: 'A new TD clarifies floor flexibility limits. Some teams may need to make adjustments.',
    type: 'technical_directive',
    area: 'aero',
    effects: [
      { stat: 'teamDevelopment', change: -2, description: 'Minor design adjustment needed' }
    ]
  },
  {
    title: 'Fuel Flow Regulation Clarification',
    description: 'Updated fuel flow monitoring requirements. All teams must comply within 2 races.',
    type: 'technical_directive',
    area: 'engine',
    effects: [
      { stat: 'enginePerformance', change: -1, description: 'Marginal engine mode restriction' }
    ]
  },
  {
    title: 'DRS Activation Zone Changes',
    description: 'DRS zones have been modified at several circuits to improve overtaking opportunities.',
    type: 'technical_directive',
    area: 'sporting',
    effects: [
      { stat: 'overtakingChance', change: 10, description: 'More overtaking opportunities' }
    ]
  }
]

// ============================================
// GENERATION FUNCTIONS
// ============================================

export function generatePreSeasonRegulations(year: number): RegulationChange[] {
  const changes: RegulationChange[] = []
  
  // Always 1-2 changes per pre-season
  const count = 1 + (Math.random() < 0.4 ? 1 : 0)
  
  const majorChanges = REGULATION_TEMPLATES.filter(t => t.type === 'major')
  const shuffled = [...majorChanges].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    changes.push({
      ...shuffled[i],
      id: `reg_${year}_preseason_${i}`,
      effectiveWeek: 1,
      effectiveYear: year
    })
  }
  
  return changes
}

export function generateMidSeasonDirective(week: number, year: number): RegulationChange | null {
  // 5% chance per week during mid-season
  if (week < 10 || week > 45) return null
  if (Math.random() > 0.05) return null
  
  const eligible = REGULATION_TEMPLATES.filter(t => 
    t.type === 'minor' || t.type === 'technical_directive'
  )
  
  if (eligible.length === 0) return null
  
  const template = eligible[Math.floor(Math.random() * eligible.length)]
  
  return {
    ...template,
    id: `reg_${year}_w${week}_${Math.random().toString(36).substr(2, 4)}`,
    effectiveWeek: week + 2, // Takes effect 2 weeks later
    effectiveYear: year
  }
}

// ============================================
// EMAIL GENERATION
// ============================================

export function generateRegulationEmail(change: RegulationChange): {
  subject: string
  body: string
  category: string
  sender: string
  senderRole: string
} {
  const typeEmoji = change.type === 'major' ? '📋' : change.type === 'minor' ? '📝' : '⚙️'
  const areaEmoji: Record<string, string> = {
    'aero': '💨', 'engine': '🔧', 'chassis': '🏗️',
    'safety': '🛡️', 'sporting': '🏁', 'financial': '💰'
  }
  
  return {
    subject: `${typeEmoji} Regulation ${change.type === 'technical_directive' ? 'Directive' : 'Change'}: ${change.title}`,
    body: `**${change.type === 'major' ? 'MAJOR ' : ''}Regulation ${change.type === 'technical_directive' ? 'Directive' : 'Change'}** ${areaEmoji[change.area] || ''}\n\n` +
      `${change.description}\n\n` +
      `**Effective:** Week ${change.effectiveWeek}, ${change.effectiveYear}\n` +
      `**Area:** ${change.area.charAt(0).toUpperCase() + change.area.slice(1)}\n\n` +
      `**Impact on your team:**\n${change.effects.map(e => `- ${e.description}`).join('\n')}\n\n` +
      (change.type === 'major' 
        ? 'This is a significant change that will require strategic adaptation. Discuss with your engineering team.'
        : 'Monitor the impact and adjust your approach as needed.'),
    category: 'team',
    sender: 'Series Administration',
    senderRole: 'Technical Regulations'
  }
}
