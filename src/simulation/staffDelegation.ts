/**
 * Staff Delegation System
 * 
 * Processes auto-managed decisions by staff members when delegation is enabled.
 * Each delegated domain produces actions based on staff skill quality.
 * Better staff = better decisions. Bad staff = suboptimal but functional.
 * 
 * Domain processors return:
 * - actions[]: Narrative descriptions for reports
 * - effects{}: Numeric stat changes (budget, morale, reputation)
 * - emails[]: Weekly report emails from the staff member
 * - gameActions[]: Structured commands executed by careerStore (real game state changes)
 */

import { 
  STAFF_DELEGATION_MAP, 
  calculateDelegationQuality, 
  getDelegationEffectiveness,
  type StaffRole,
  type DelegationDomain 
} from '@/data/facility-staff-config'

// ============================================
// TYPES
// ============================================

/** Structured game-state commands returned by domain processors */
export type DelegationGameAction =
  | { type: 'set_dev_focus'; area: string }
  | { type: 'start_research'; upgradeId: string; upgradeName: string; area: string; cost: number }
  | { type: 'add_spare_parts'; count: number; source: 'purchased' | 'manufactured' }
  | { type: 'add_social_post'; content: string; tone: string; viralChance: number }
  | { type: 'schedule_mandatory'; activityTemplateId: string; week: number; day: number }
  | { type: 'run_marketing_campaign'; campaignType: 'social_media' | 'pr_campaign' | 'sponsor_event' | 'media_day' }
  | { type: 'request_delegated_search'; role: string }
  | { type: 'approval_request'; id: string; description: string; cost?: number; approvalDomain: DelegationDomain; payload: DelegationGameAction }

export interface DelegationContext {
  // Team state
  teamCash: number
  teamReputation: number
  boardMood: number
  teamMorale: number
  
  // Logistics state
  sparePartsCount?: number
  manufacturingQueueLength?: number
  upcomingRaceWeeks?: number
  
  // R&D state  
  devAreas?: Record<string, number>  // area -> points (to find weakest)
  devCurrentFocus?: string           // Current focus area name
  devCurrentResearch?: Record<string, string | null>  // area -> currentUpgradeId (null if idle)
  devAvailableUpgrades?: { id: string; name: string; area: string; cost: number; tier: number }[]  // Upgrades that can be started
  
  // Media state
  socialFollowers?: number
  lastPostWeek?: number
  pendingMediaRequests?: number
  teamName?: string
  
  // Manufacturing
  manufacturingFacilityLevel?: number
  partsInManufacturing?: number
  
  // Marketing
  marketingBudget?: number
  merchProductCount?: number
  
  // Scheduling
  pendingMandatoryCount?: number
  scheduledActivityCount?: number
  
  // Scouting
  scoutingBudgetRemaining?: number
  vacantRoles?: string[]  // Roles not yet filled
  lastScoutingSearchWeek?: number
  
  // General
  currentWeek: number
  currentYear: number
  isRaceWeek: boolean
  teamTier?: string
  ownerName?: string
}

export interface DelegationResult {
  domain: DelegationDomain
  staffName: string
  staffRole: string
  quality: number
  actions: string[]
  effects: Record<string, number>
  emails: DelegationEmail[]
  gameActions: DelegationGameAction[]
}

export interface DelegationEmail {
  subject: string
  body: string
  sender: string
  senderRole: string
  category: string
}

export interface StaffInfo {
  name: string
  role: StaffRole
  skill: number
  experience?: number
  secondarySkill?: number
}

// ============================================
// CONSTANTS
// ============================================

/** Cost threshold above which logistics orders need owner approval */
const LOGISTICS_APPROVAL_THRESHOLD = 20000
/** Cost threshold above which manufacturing batches need owner approval */
const MANUFACTURING_APPROVAL_THRESHOLD = 15000
/** How often (in weeks) the scouting delegation triggers a delegated search */
const SCOUTING_SEARCH_INTERVAL = 4

// ============================================
// SOCIAL POST CONTENT GENERATION
// ============================================

const POST_TEMPLATES = {
  race_week: [
    'Race week preparations underway! The team is focused and ready.',
    'Final checks complete. Bring on race day! 🏁',
    'The crew has been working around the clock. We\'re ready.',
  ],
  development: [
    'Exciting progress in the development department this week.',
    'The engineers have been pushing boundaries. Updates coming soon.',
    'R&D is delivering results. The car keeps getting better.',
  ],
  general: [
    'Another productive week in the books. The team spirit is high.',
    'Hard work continues behind the scenes. Great things ahead.',
    'Building momentum week by week. Proud of this team.',
  ],
  results: [
    'Reflecting on our recent performance and looking ahead.',
    'Learning from every race. The data never lies.',
    'Every lap is a lesson. We keep pushing forward.',
  ]
}

function generatePostContent(context: DelegationContext, quality: number): { content: string; type: string } {
  const templates = context.isRaceWeek ? POST_TEMPLATES.race_week :
    quality >= 0.8 ? POST_TEMPLATES.development :
    POST_TEMPLATES.general
  const content = templates[Math.floor(Math.random() * templates.length)]
  const type = context.isRaceWeek ? 'race_update' : quality >= 0.8 ? 'team_update' : 'general'
  return { content, type }
}

// ============================================
// MAIN DELEGATION PROCESSOR
// ============================================

/**
 * Process all active delegation domains for the week.
 * Returns a list of results with actions taken, effects, and gameActions to execute.
 */
export function processWeeklyDelegation(
  delegationFlags: Record<string, boolean>,
  staff: StaffInfo[],
  context: DelegationContext
): DelegationResult[] {
  const results: DelegationResult[] = []
  
  for (const [domain, enabled] of Object.entries(delegationFlags)) {
    if (!enabled) continue
    
    // Find the staff member responsible for this domain
    const responsibleStaff = findResponsibleStaff(domain as DelegationDomain, staff)
    if (!responsibleStaff) continue
    
    // Calculate delegation quality
    const quality = calculateDelegationQuality(
      responsibleStaff.skill,
      responsibleStaff.experience || 1,
      responsibleStaff.secondarySkill
    )
    
    const effectiveness = getDelegationEffectiveness(quality)
    
    // Process the domain
    const result = processDomain(
      domain as DelegationDomain,
      responsibleStaff,
      quality,
      effectiveness.multiplier,
      context
    )
    
    if (result) {
      results.push(result)
    }
  }
  
  return results
}

/**
 * Find the staff member responsible for a given delegation domain
 */
function findResponsibleStaff(domain: DelegationDomain, staff: StaffInfo[]): StaffInfo | null {
  for (const [role, capabilities] of Object.entries(STAFF_DELEGATION_MAP)) {
    if (capabilities?.some(cap => cap.domain === domain)) {
      const match = staff.find(s => s.role === role)
      if (match) return match
    }
  }
  return null
}

// ============================================
// DOMAIN PROCESSORS
// ============================================

function processDomain(
  domain: DelegationDomain,
  staffMember: StaffInfo,
  quality: number,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const base: DelegationResult = {
    domain,
    staffName: staffMember.name,
    staffRole: staffMember.role,
    quality,
    actions: [],
    effects: {},
    emails: [],
    gameActions: []
  }
  
  switch (domain) {
    case 'logistics':
      return processLogisticsDelegation(base, multiplier, context)
    case 'rnd_focus':
      return processRnDDelegation(base, multiplier, context)
    case 'race_strategy':
      return processRaceStrategyDelegation(base, multiplier, context)
    case 'media_management':
      return processMediaDelegation(base, multiplier, context)
    case 'manufacturing':
      return processManufacturingDelegation(base, multiplier, context)
    case 'marketing':
      return processMarketingDelegation(base, multiplier, context)
    case 'scouting':
      return processScoutingDelegation(base, multiplier, context)
    case 'mandatory_scheduling':
      return processMandatorySchedulingDelegation(base, multiplier, context)
    default:
      return base
  }
}

// ────────────────────────────────────────────
// DOMAIN 1: R&D Direction (Technical Director)
// ────────────────────────────────────────────

function processRnDDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  const gameActions: DelegationGameAction[] = []
  
  const areaKeys = ['aerodynamics', 'chassis', 'powertrain', 'electronics']
  
  // ── STEP 1: Choose development focus area ──
  if (multiplier >= 0.8) {
    // HIGH QUALITY: Identify the weakest area and focus there
    let focusArea = 'aerodynamics'
    if (context.devAreas) {
      let minPoints = Infinity
      for (const [area, points] of Object.entries(context.devAreas)) {
        if (areaKeys.includes(area) && points < minPoints) {
          minPoints = points
          focusArea = area
        }
      }
    }
    
    gameActions.push({ type: 'set_dev_focus', area: focusArea })
    actions.push(`Analyzed performance data and redirected R&D focus to **${focusArea}** — identified as our biggest development gap`)
    effects.teamMorale = 2
  } else if (multiplier >= 0.5) {
    // MEDIUM QUALITY: Pick a reasonable area
    const shuffled = [...areaKeys].sort(() => Math.random() - 0.5)
    const focusArea = shuffled[0]
    
    gameActions.push({ type: 'set_dev_focus', area: focusArea })
    actions.push(`Set R&D focus to **${focusArea}** — reasonable allocation based on available data`)
    effects.teamMorale = 1
  } else {
    // LOW QUALITY: Set balanced (no real direction)
    gameActions.push({ type: 'set_dev_focus', area: 'balanced' })
    actions.push('R&D allocation set to balanced spread — not optimized for current needs')
    effects.teamMorale = -1
  }
  
  // ── STEP 2: Start research projects in idle areas ──
  const available = context.devAvailableUpgrades || []
  const currentResearch = context.devCurrentResearch || {}
  
  // Find areas that don't have active research
  const idleAreas = areaKeys.filter(area => !currentResearch[area])
  
  if (idleAreas.length > 0 && available.length > 0) {
    for (const area of idleAreas) {
      // Find available upgrades for this area
      const areaUpgrades = available.filter(u => u.area === area)
      if (areaUpgrades.length === 0) continue
      
      let chosen: typeof areaUpgrades[0]
      
      if (multiplier >= 0.8) {
        // HIGH QUALITY: Pick the best upgrade (lowest tier first for prerequisites, then highest value)
        chosen = areaUpgrades.sort((a, b) => a.tier - b.tier)[0]
      } else if (multiplier >= 0.5) {
        // MEDIUM: Pick any available upgrade
        chosen = areaUpgrades[Math.floor(Math.random() * areaUpgrades.length)]
      } else {
        // LOW: Only start cheap projects, might miss better ones
        const cheapOnes = areaUpgrades.filter(u => u.cost <= 20000)
        if (cheapOnes.length === 0) continue
        chosen = cheapOnes[Math.floor(Math.random() * cheapOnes.length)]
      }
      
      // Check if we can afford it
      if (chosen.cost > (context.teamCash * 0.3)) {
        // Too expensive relative to budget — request approval
        const approvalId = `rnd_project_${chosen.id}_w${context.currentWeek}`
        gameActions.push({
          type: 'approval_request',
          id: approvalId,
          description: `Start research project: "${chosen.name}" (${chosen.area}, Tier ${chosen.tier}) — $${chosen.cost.toLocaleString()}`,
          cost: chosen.cost,
          approvalDomain: 'rnd_focus',
          payload: { type: 'start_research', upgradeId: chosen.id, upgradeName: chosen.name, area: chosen.area, cost: chosen.cost }
        })
        actions.push(`Proposing research project: **${chosen.name}** ($${chosen.cost.toLocaleString()}) — awaiting your approval`)
      } else {
        // Auto-start (affordable)
        gameActions.push({ type: 'start_research', upgradeId: chosen.id, upgradeName: chosen.name, area: chosen.area, cost: chosen.cost })
        actions.push(`Started research: **${chosen.name}** (${chosen.area}, Tier ${chosen.tier}) — $${chosen.cost.toLocaleString()}`)
      }
    }
  } else if (idleAreas.length === 0 && Object.keys(currentResearch).length > 0) {
    actions.push('All development areas have active research projects — monitoring progress')
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = gameActions
  result.emails = [{
    subject: '🔬 R&D Development Report',
    body: `Here's this week's development update:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\n${context.devAreas ? `Current area levels: ${Object.entries(context.devAreas).map(([a, p]) => `${a}: ${p} pts`).join(' | ')}\n\n` : ''}I'll continue monitoring performance data and adjust as needed. Let me know if you'd like to override any decisions.\n\n${result.staffName}\nTechnical Director`,
    sender: result.staffName,
    senderRole: 'Technical Director',
    category: 'development'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 2: Logistics Management (Team Manager)
// ────────────────────────────────────────────

function processLogisticsDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  const gameActions: DelegationGameAction[] = []
  
  // Auto-manage spare parts ordering
  if (context.sparePartsCount !== undefined && context.upcomingRaceWeeks !== undefined) {
    if (context.sparePartsCount < 5 && context.upcomingRaceWeeks <= 2) {
      // CRITICAL: Low parts with race imminent
      const partsToOrder = multiplier >= 0.8 ? 5 : multiplier >= 0.5 ? 3 : 2
      const orderCost = Math.round(partsToOrder * 3000 * (2 - multiplier))
      
      if (orderCost > LOGISTICS_APPROVAL_THRESHOLD) {
        // Big order — needs approval
        const approvalId = `logistic_order_w${context.currentWeek}_${context.currentYear}`
        gameActions.push({
          type: 'approval_request',
          id: approvalId,
          description: `Emergency spare parts order: ${partsToOrder} parts for $${orderCost.toLocaleString()}. Race is ${context.upcomingRaceWeeks === 0 ? 'THIS WEEK' : `in ${context.upcomingRaceWeeks} week(s)`}.`,
          cost: orderCost,
          approvalDomain: 'logistics',
          payload: { type: 'add_spare_parts', count: partsToOrder, source: 'purchased' }
        })
        actions.push(`Requesting approval for emergency parts order: ${partsToOrder} parts ($${orderCost.toLocaleString()})`)
      } else {
        // Small enough to auto-approve
        effects.budgetImpact = -orderCost
        gameActions.push({ type: 'add_spare_parts', count: partsToOrder, source: 'purchased' })
        actions.push(`Ordered ${partsToOrder} spare parts ($${orderCost.toLocaleString()})`)
      }
    } else if (context.sparePartsCount < 8 && context.upcomingRaceWeeks !== undefined && context.upcomingRaceWeeks <= 4) {
      // Moderate: Parts getting low, order a small batch
      const partsToOrder = multiplier >= 0.8 ? 3 : 2
      const orderCost = Math.round(partsToOrder * 2500 * (2 - multiplier))
      effects.budgetImpact = -orderCost
      gameActions.push({ type: 'add_spare_parts', count: partsToOrder, source: 'purchased' })
      actions.push(`Proactively ordered ${partsToOrder} spare parts ($${orderCost.toLocaleString()}) — maintaining healthy stock levels`)
    } else if (context.sparePartsCount > 15) {
      actions.push('Spare parts inventory healthy — optimized warehouse storage')
    } else {
      actions.push('Parts inventory within target range — no orders needed')
    }
  }
  
  // Shipping optimization for race weeks
  if (context.isRaceWeek) {
    if (multiplier >= 0.8) {
      actions.push('Selected optimal shipping route for race equipment (cost-effective and on-time)')
    } else {
      const wastage = Math.round(2000 * (1 - multiplier))
      effects.budgetImpact = (effects.budgetImpact || 0) - wastage
      actions.push(`Arranged race equipment shipping (slight overspend: $${wastage.toLocaleString()})`)
    }
  }
  
  if (actions.length === 0) {
    actions.push('No logistics actions needed this week')
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = gameActions
  result.emails = [{
    subject: '📦 Weekly Logistics Report',
    body: `Boss,\n\nHere's your logistics summary for the week:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\n${context.sparePartsCount !== undefined ? `Current inventory: ${context.sparePartsCount} spare parts\n` : ''}Everything is under control.\n\nBest regards,\n${result.staffName}`,
    sender: result.staffName,
    senderRole: 'Team Manager',
    category: 'team'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 3: Activity Scheduling (Team Manager)
// ────────────────────────────────────────────

function processMandatorySchedulingDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const gameActions: DelegationGameAction[] = []
  
  const pending = context.pendingMandatoryCount ?? 0
  
  if (pending > 0) {
    // Schedule mandatory activities
    // High quality picks optimal days, low quality picks any available day
    const optimalDay = multiplier >= 0.8 ? 2 : multiplier >= 0.5 ? 3 : 5 // Early in week is better
    const targetWeek = context.currentWeek + 1 // Schedule for next week
    
    gameActions.push({
      type: 'schedule_mandatory',
      activityTemplateId: 'auto_scheduled',
      week: targetWeek,
      day: optimalDay
    })
    
    if (multiplier >= 0.8) {
      actions.push(`Optimally scheduled ${pending} mandatory activit${pending === 1 ? 'y' : 'ies'} for next week — minimal impact on your other commitments`)
    } else if (multiplier >= 0.5) {
      actions.push(`Scheduled ${pending} mandatory activit${pending === 1 ? 'y' : 'ies'} — some slots may need rearranging`)
    } else {
      actions.push(`Scheduled ${pending} mandatory activit${pending === 1 ? 'y' : 'ies'} — timing is not ideal but they're on the calendar`)
    }
  } else {
    actions.push('No mandatory activities pending — calendar is clear')
  }
  
  result.actions = actions
  result.effects = {}
  result.gameActions = gameActions
  result.emails = [{
    subject: '📅 Schedule Update',
    body: `I've reviewed the upcoming schedule:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\n${pending > 0 ? 'Check your calendar for the updated schedule. ' : ''}Let me know if you want to adjust anything.\n\n${result.staffName}\nTeam Manager`,
    sender: result.staffName,
    senderRole: 'Team Manager',
    category: 'team'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 4: Race Strategy (Strategist)
// ────────────────────────────────────────────

function processRaceStrategyDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  
  if (context.isRaceWeek) {
    if (multiplier >= 0.8) {
      actions.push('Prepared optimal race strategy with multiple contingency plans')
      actions.push('Analyzed competitor data for potential undercut/overcut windows')
      actions.push('Briefed the engineers on setup recommendations')
      effects.teamMorale = 2 // Team feels confident with clear strategy
    } else if (multiplier >= 0.5) {
      actions.push('Prepared standard race strategy with basic tire allocation plan')
      actions.push('Reviewed track data from previous events')
      effects.teamMorale = 1
    } else {
      actions.push('Prepared basic strategy — may need review before race day')
      effects.teamMorale = -1 // Team doubts the strategy
    }
  } else {
    if (multiplier >= 0.8) {
      actions.push('Analyzed data from recent races to improve future strategy')
      actions.push('Monitoring competitor performance trends')
    } else {
      actions.push('No race this week — monitoring competitor strategies for future reference')
    }
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = [] // Strategy is effects-only (no persistent strategy state)
  result.emails = [{
    subject: context.isRaceWeek ? '🏁 Race Strategy Prepared' : '📊 Strategy Update',
    body: `${context.isRaceWeek ? 'Race week!' : 'Quiet week'} strategy update:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\n${context.isRaceWeek ? 'I\'m confident in our approach. Let me know if you want to discuss alternatives.' : 'Keeping an eye on the competition.'}\n\nBest,\n${result.staffName}`,
    sender: result.staffName,
    senderRole: 'Race Strategist',
    category: 'team'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 5: Media Management (PR Manager)
// ────────────────────────────────────────────

function processMediaDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  const gameActions: DelegationGameAction[] = []
  
  // Generate and publish a social media post
  const { content, type: _postType } = generatePostContent(context, multiplier)
  const viralChance = multiplier >= 0.8 ? 0.15 : multiplier >= 0.5 ? 0.05 : 0.01
  const tone = multiplier >= 0.8 ? 'professional' : multiplier >= 0.5 ? 'casual' : 'generic'
  
  gameActions.push({
    type: 'add_social_post',
    content,
    tone,
    viralChance
  })
  
  const postQuality = multiplier >= 0.8 ? 'an engaging' : multiplier >= 0.5 ? 'a standard' : 'a generic'
  actions.push(`Published ${postQuality} social media update${context.socialFollowers ? ` (${context.socialFollowers.toLocaleString()} followers)` : ''}`)
  effects.reputation = multiplier >= 0.8 ? 1 : 0
  
  // Handle pending media requests
  if (context.pendingMediaRequests && context.pendingMediaRequests > 0) {
    if (multiplier >= 0.8) {
      actions.push(`Accepted ${Math.min(2, context.pendingMediaRequests)} high-value interview requests`)
      effects.reputation = (effects.reputation || 0) + 1
    } else if (multiplier >= 0.5) {
      actions.push('Accepted 1 media request and politely declined others')
    } else {
      actions.push('Declined all media requests this week')
      effects.reputation = (effects.reputation || 0) - 1
    }
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = gameActions
  result.emails = [{
    subject: '📰 Media Management Report',
    body: `Media activity this week:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\nOur public presence remains ${multiplier >= 0.5 ? 'strong' : 'manageable'}.\n\n${result.staffName}\nPR Manager`,
    sender: result.staffName,
    senderRole: 'PR Manager',
    category: 'media'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 6: Manufacturing Queue (Crew Chief)
// ────────────────────────────────────────────

function processManufacturingDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  const gameActions: DelegationGameAction[] = []
  
  const partsCount = context.sparePartsCount ?? 10
  const inManufacturing = context.partsInManufacturing ?? 0
  
  if (partsCount < 8 && inManufacturing < 3) {
    // Stock is low and not much in the pipeline — manufacture more
    const batchSize = multiplier >= 0.8 ? 4 : multiplier >= 0.5 ? 3 : 2
    const batchCost = Math.round(batchSize * 2000 * (2 - multiplier))
    
    if (batchCost > MANUFACTURING_APPROVAL_THRESHOLD) {
      // Large batch — needs approval
      const approvalId = `mfg_batch_w${context.currentWeek}_${context.currentYear}`
      gameActions.push({
        type: 'approval_request',
        id: approvalId,
        description: `Manufacturing batch: ${batchSize} parts for $${batchCost.toLocaleString()}. Current stock: ${partsCount} parts.`,
        cost: batchCost,
        approvalDomain: 'manufacturing',
        payload: { type: 'add_spare_parts', count: batchSize, source: 'manufactured' }
      })
      actions.push(`Requesting approval for manufacturing batch: ${batchSize} parts ($${batchCost.toLocaleString()})`)
    } else {
      effects.budgetImpact = -batchCost
      gameActions.push({ type: 'add_spare_parts', count: batchSize, source: 'manufactured' })
      actions.push(`Queued ${batchSize} parts for manufacturing ($${batchCost.toLocaleString()})`)
      
      if (multiplier >= 0.8) {
        actions.push('Optimized manufacturing sequence to minimize downtime')
      }
    }
  } else if (partsCount >= 8 && partsCount < 12) {
    actions.push('Parts stock adequate — monitoring levels')
  } else {
    actions.push('Manufacturing queue in good shape — no urgent orders needed')
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = gameActions
  result.emails = [{
    subject: '🔧 Manufacturing Queue Update',
    body: `Manufacturing status:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\nCurrent stock: ${partsCount} parts${inManufacturing > 0 ? ` (${inManufacturing} in production)` : ''}.\n\n${result.staffName}\nCrew Chief`,
    sender: result.staffName,
    senderRole: 'Crew Chief',
    category: 'team'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 7: Marketing & Merch (Marketing Manager)
// ────────────────────────────────────────────

function processMarketingDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const effects: Record<string, number> = {}
  const gameActions: DelegationGameAction[] = []
  
  // Auto-run a social media campaign (low cost, auto-approved)
  gameActions.push({ type: 'run_marketing_campaign', campaignType: 'social_media' })
  
  if (multiplier >= 0.8) {
    actions.push('Launched targeted social media campaign aligned with sponsor goals')
    effects.reputation = 1
    effects.sponsorSatisfaction = 1
    
    // High quality manager also considers bigger campaigns (needs approval)
    if (context.teamCash > 50000 && (context.marketingBudget ?? 0) > 10000) {
      // Propose a PR campaign every few weeks
      if (context.currentWeek % 4 === 0) {
        const prCost = Math.round((context.marketingBudget ?? 10000) * 0.1)
        const approvalId = `mktg_pr_w${context.currentWeek}_${context.currentYear}`
        gameActions.push({
          type: 'approval_request',
          id: approvalId,
          description: `PR Campaign proposal: $${prCost.toLocaleString()} investment for significant media exposure and sponsor visibility boost.`,
          cost: prCost,
          approvalDomain: 'marketing',
          payload: { type: 'run_marketing_campaign', campaignType: 'pr_campaign' }
        })
        actions.push(`Proposing a PR campaign ($${prCost.toLocaleString()}) for additional exposure — awaiting your approval`)
      }
    }
  } else if (multiplier >= 0.5) {
    actions.push('Maintained standard marketing presence across channels')
  } else {
    actions.push('Basic marketing output this week — could be more impactful')
    effects.sponsorSatisfaction = -1
  }
  
  result.actions = actions
  result.effects = effects
  result.gameActions = gameActions
  result.emails = [{
    subject: '📢 Marketing Weekly Report',
    body: `Marketing activities this week:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\n${context.socialFollowers ? `Social following: ${context.socialFollowers.toLocaleString()}\n` : ''}${(context.merchProductCount ?? 0) > 0 ? `Active merchandise products: ${context.merchProductCount}\n` : ''}\n${result.staffName}\nMarketing Manager`,
    sender: result.staffName,
    senderRole: 'Marketing Manager',
    category: 'media'
  }]
  
  return result
}

// ────────────────────────────────────────────
// DOMAIN 8: Scouting Reports (Data Analyst)
// ────────────────────────────────────────────

function processScoutingDelegation(
  result: DelegationResult,
  multiplier: number,
  context: DelegationContext
): DelegationResult {
  const actions: string[] = []
  const gameActions: DelegationGameAction[] = []
  
  // Weekly talent assessment
  if (multiplier >= 0.8) {
    actions.push('Compiled detailed scouting report on promising candidates')
    actions.push('Analyzed rival team staff movements and contract situations')
  } else if (multiplier >= 0.5) {
    actions.push('Reviewed available driver and staff market listings')
  } else {
    actions.push('Brief scan of available talent — no standout candidates identified')
  }
  
  // Every N weeks, trigger a delegated search if there are vacant roles
  const weeksSinceLastSearch = context.lastScoutingSearchWeek 
    ? context.currentWeek - context.lastScoutingSearchWeek 
    : SCOUTING_SEARCH_INTERVAL + 1 // Force first search
  
  if (weeksSinceLastSearch >= SCOUTING_SEARCH_INTERVAL && (context.vacantRoles?.length ?? 0) > 0) {
    const targetRole = context.vacantRoles![0] // Pick the first vacant role
    gameActions.push({ type: 'request_delegated_search', role: targetRole })
    actions.push(`Prepared a shortlist of candidates for the ${targetRole.replace(/_/g, ' ')} position — sent to your inbox for review`)
  }
  
  result.actions = actions
  result.effects = {}
  result.gameActions = gameActions
  result.emails = [{
    subject: '🔍 Scouting Report',
    body: `Weekly talent assessment:\n\n${actions.map(a => `• ${a}`).join('\n')}\n\nFull reports available on request. Let me know if you want me to focus on a specific role.\n\n${result.staffName}\nData Analyst`,
    sender: result.staffName,
    senderRole: 'Data Analyst',
    category: 'team'
  }]
  
  return result
}
