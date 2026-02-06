// ============================================
// PERK SYSTEM - Applies owner and location bonuses
// ============================================
// Central utility for calculating and applying perks from:
// - Owner backgrounds (sponsorNegotiationBonus, costManagementBonus, etc.)
// - Team location (operationalCostModifier, aeroDevBonus, etc.)

import { useCareerStore } from '@/store/careerStore'
import { 
  OWNER_BACKGROUNDS, 
  OwnerBackground,
  LOCATION_PERKS,
  LocationPerk,
  DEFAULT_LOCATION_PERK
} from '@/data/owner-backgrounds'

// ============================================
// TYPES
// ============================================

export interface ActivePerks {
  // From owner background
  background: OwnerBackground | null
  
  // From team location
  location: LocationPerk
  
  // Combined modifiers (calculated)
  combined: {
    // Financial
    sponsorDealValueModifier: number      // Multiplier for sponsor deal values (1.0 = no change)
    operationalCostModifier: number       // Multiplier for opex (1.0 = no change)
    staffCostModifier: number             // Multiplier for staff salaries
    facilityCostModifier: number          // Multiplier for facility upgrades
    loanInterestModifier: number          // Multiplier for loan interest rates
    
    // Development
    aeroDevModifier: number               // Multiplier for aero development speed
    chassisDevModifier: number            // Multiplier for chassis development speed
    reliabilityModifier: number           // Multiplier for reliability improvements
    engineerQualityModifier: number       // Bonus to engineer recruitment quality
    
    // Fan/Media/Reputation
    fanEngagementModifier: number         // Multiplier for fan sentiment changes
    mediaCoverageModifier: number         // Multiplier for media coverage
    localSponsorModifier: number          // Bonus to local sponsor interest
    
    // Investment
    investmentAccessBonus: number         // Flat bonus to investment opportunities (%)
    
    // Board
    boardPatienceWeeks: number            // Extra weeks before board gets upset
    
    // Special flags
    hasPaddockRespect: boolean
    hasMediaConnections: boolean
    hasCorporateNetwork: boolean
    hasTechPartners: boolean
    hasGrassrootsSupport: boolean
    hasInvestmentOpportunities: boolean
  }
}

// ============================================
// PERK CALCULATION
// ============================================

/**
 * Get the owner's background from the career state
 */
export function getOwnerBackground(): OwnerBackground | null {
  const player = useCareerStore.getState().player
  if (!player?.background?.scenarioId) return null
  return OWNER_BACKGROUNDS[player.background.scenarioId] || null
}

/**
 * Get the team's location perk
 */
export function getTeamLocationPerk(): LocationPerk {
  const careerState = useCareerStore.getState().careerState
  const ownedTeam = careerState?.ownedTeam
  
  if (!ownedTeam?.baseCountry) return DEFAULT_LOCATION_PERK
  return LOCATION_PERKS[ownedTeam.baseCountry] || DEFAULT_LOCATION_PERK
}

/**
 * Calculate all active perks by combining owner background and location
 */
export function calculateActivePerks(): ActivePerks {
  const background = getOwnerBackground()
  const location = getTeamLocationPerk()
  
  // Helper to convert percentage bonus to multiplier
  // e.g., +15% becomes 1.15, -10% becomes 0.90
  const toMultiplier = (pct: number | undefined) => 1 + (pct || 0) / 100
  
  // Combine background and location modifiers
  const combined = {
    // Financial modifiers
    sponsorDealValueModifier: toMultiplier(background?.sponsorNegotiationBonus),
    operationalCostModifier: toMultiplier(
      (background?.costManagementBonus ? -background.costManagementBonus : 0) + 
      (location.effects.operationalCostModifier || 0)
    ),
    staffCostModifier: toMultiplier(location.effects.staffCostModifier),
    facilityCostModifier: toMultiplier(location.effects.facilityCostModifier),
    loanInterestModifier: toMultiplier(background?.loanTermsBonus ? -background.loanTermsBonus : 0),
    
    // Development modifiers
    aeroDevModifier: toMultiplier(location.effects.aeroDevBonus),
    chassisDevModifier: toMultiplier(location.effects.chassisDevBonus),
    reliabilityModifier: toMultiplier(location.effects.reliabilityBonus),
    engineerQualityModifier: toMultiplier(location.effects.engineerQualityBonus),
    
    // Fan/Media modifiers
    fanEngagementModifier: toMultiplier(
      (background?.fanSentimentBonus || 0) + 
      (location.effects.fanEngagementBonus || 0)
    ),
    mediaCoverageModifier: toMultiplier(
      (background?.hasMediaConnections ? 15 : 0) + 
      (location.effects.mediaCoverageBonus || 0)
    ),
    localSponsorModifier: toMultiplier(location.effects.localSponsorBonus),
    
    // Investment
    investmentAccessBonus: (background?.investmentOpportunities ? 20 : 0) + 
      (location.effects.investmentAccessBonus || 0),
    
    // Board patience
    boardPatienceWeeks: background?.boardPatience || 0,
    
    // Special flags
    hasPaddockRespect: background?.hasPaddockRespect || false,
    hasMediaConnections: background?.hasMediaConnections || false,
    hasCorporateNetwork: background?.hasCorporateNetwork || false,
    hasTechPartners: background?.hasTechPartners || (location.effects as any).hasTechPartners || false,
    hasGrassrootsSupport: background?.hasGrassrootsSupport || false,
    hasInvestmentOpportunities: background?.investmentOpportunities || false,
  }
  
  return {
    background,
    location,
    combined
  }
}

// ============================================
// PERK APPLICATION FUNCTIONS
// ============================================
// These functions apply perks to various game calculations

/**
 * Apply sponsor negotiation bonus to a deal value
 */
export function applySponsorPerk(baseDealValue: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseDealValue * perks.combined.sponsorDealValueModifier)
}

/**
 * Apply cost management perks to operational costs
 */
export function applyOperationalCostPerk(baseCost: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseCost * perks.combined.operationalCostModifier)
}

/**
 * Apply staff cost modifier
 */
export function applyStaffCostPerk(baseSalary: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseSalary * perks.combined.staffCostModifier)
}

/**
 * Apply facility upgrade cost modifier
 */
export function applyFacilityCostPerk(baseCost: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseCost * perks.combined.facilityCostModifier)
}

/**
 * Apply loan interest rate modifier
 */
export function applyLoanInterestPerk(baseRate: number): number {
  const perks = calculateActivePerks()
  return Math.max(0.01, baseRate * perks.combined.loanInterestModifier)
}

/**
 * Apply aero development speed bonus
 */
export function applyAeroDevPerk(baseProgress: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseProgress * perks.combined.aeroDevModifier)
}

/**
 * Apply chassis development speed bonus
 */
export function applyChassisDevPerk(baseProgress: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseProgress * perks.combined.chassisDevModifier)
}

/**
 * Apply reliability improvement bonus
 */
export function applyReliabilityPerk(baseImprovement: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseImprovement * perks.combined.reliabilityModifier)
}

/**
 * Apply engineer quality bonus when recruiting
 */
export function applyEngineerQualityPerk(baseQuality: number): number {
  const perks = calculateActivePerks()
  return Math.min(100, Math.round(baseQuality * perks.combined.engineerQualityModifier))
}

/**
 * Apply fan engagement modifier
 */
export function applyFanEngagementPerk(baseChange: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseChange * perks.combined.fanEngagementModifier)
}

/**
 * Apply media coverage modifier
 */
export function applyMediaCoveragePerk(baseCoverage: number): number {
  const perks = calculateActivePerks()
  return Math.round(baseCoverage * perks.combined.mediaCoverageModifier)
}

/**
 * Check if player has access to investment opportunities
 */
export function hasInvestmentAccess(): boolean {
  const perks = calculateActivePerks()
  return perks.combined.hasInvestmentOpportunities || perks.combined.investmentAccessBonus > 0
}

/**
 * Get investment opportunity bonus percentage
 */
export function getInvestmentBonus(): number {
  const perks = calculateActivePerks()
  return perks.combined.investmentAccessBonus
}

/**
 * Get board patience modifier (weeks before they get upset)
 */
export function getBoardPatienceModifier(): number {
  const perks = calculateActivePerks()
  return perks.combined.boardPatienceWeeks
}

/**
 * Check if player has corporate network (better corporate sponsors)
 */
export function hasCorporateNetwork(): boolean {
  const perks = calculateActivePerks()
  return perks.combined.hasCorporateNetwork
}

/**
 * Check if player has tech partners access
 */
export function hasTechPartners(): boolean {
  const perks = calculateActivePerks()
  return perks.combined.hasTechPartners
}

/**
 * Check if player has paddock respect
 */
export function hasPaddockRespect(): boolean {
  const perks = calculateActivePerks()
  return perks.combined.hasPaddockRespect
}

/**
 * Check if player has grassroots support
 */
export function hasGrassrootsSupport(): boolean {
  const perks = calculateActivePerks()
  return perks.combined.hasGrassrootsSupport
}

// ============================================
// SERIES ACCESS HELPERS
// ============================================

/**
 * Get series IDs with easier entry based on location
 */
export function getSeriesAccessBonuses(): string[] {
  const location = getTeamLocationPerk()
  return location.effects.seriesAccessBonus || []
}

/**
 * Get series IDs with harder entry based on location
 */
export function getSeriesAccessPenalties(): string[] {
  const location = getTeamLocationPerk()
  return location.effects.seriesAccessPenalty || []
}

/**
 * Check if player has easier access to a specific series
 */
export function hasSeriesAccessBonus(seriesId: string): boolean {
  return getSeriesAccessBonuses().some(id => 
    seriesId.toLowerCase().includes(id.toLowerCase())
  )
}

// ============================================
// MANUFACTURER CONNECTION HELPERS
// ============================================

/**
 * Get manufacturer IDs the owner has connections with
 */
export function getManufacturerConnections(): string[] {
  const background = getOwnerBackground()
  return background?.manufacturerConnections || []
}

/**
 * Get the bonus relationship points with connected manufacturers
 */
export function getManufacturerRelationBonus(): number {
  const background = getOwnerBackground()
  return background?.manufacturerRelationBonus || 0
}

/**
 * Check if player has connection to a specific manufacturer
 */
export function hasManufacturerConnection(manufacturerId: string): boolean {
  const connections = getManufacturerConnections()
  return connections.some(id => 
    manufacturerId.toLowerCase().includes(id.toLowerCase()) ||
    id.toLowerCase().includes(manufacturerId.toLowerCase())
  )
}

// ============================================
// SUMMARY DISPLAY HELPERS
// ============================================

/**
 * Get a summary of active perks for display in UI
 */
export function getActivePerksSummary(): { 
  category: string
  name: string 
  effect: string 
  source: 'background' | 'location'
}[] {
  const perks = calculateActivePerks()
  const summary: { category: string; name: string; effect: string; source: 'background' | 'location' }[] = []
  
  // Background perks
  if (perks.background) {
    for (const perk of perks.background.perks) {
      summary.push({
        category: 'Owner Perk',
        name: perk.name,
        effect: perk.effect,
        source: 'background'
      })
    }
    
    if (perks.background.manufacturerConnections && perks.background.manufacturerConnections.length > 0) {
      summary.push({
        category: 'Connections',
        name: 'Manufacturer Contacts',
        effect: `+${perks.background.manufacturerRelationBonus}% with ${perks.background.manufacturerConnections.join(', ')}`,
        source: 'background'
      })
    }
  }
  
  // Location perks
  if (perks.location.id !== 'default') {
    if (perks.location.effects.engineerQualityBonus) {
      summary.push({
        category: 'Location',
        name: perks.location.name,
        effect: `+${perks.location.effects.engineerQualityBonus}% engineer quality`,
        source: 'location'
      })
    }
    if (perks.location.effects.aeroDevBonus) {
      summary.push({
        category: 'Location',
        name: perks.location.name,
        effect: `+${perks.location.effects.aeroDevBonus}% aero development`,
        source: 'location'
      })
    }
    if (perks.location.effects.reliabilityBonus) {
      summary.push({
        category: 'Location',
        name: perks.location.name,
        effect: `+${perks.location.effects.reliabilityBonus}% reliability`,
        source: 'location'
      })
    }
    if (perks.location.effects.operationalCostModifier && perks.location.effects.operationalCostModifier !== 0) {
      const sign = perks.location.effects.operationalCostModifier > 0 ? '+' : ''
      summary.push({
        category: 'Location',
        name: perks.location.name,
        effect: `${sign}${perks.location.effects.operationalCostModifier}% operational costs`,
        source: 'location'
      })
    }
    if (perks.location.effects.sponsorPoolBonus) {
      summary.push({
        category: 'Location',
        name: perks.location.name,
        effect: `+${perks.location.effects.sponsorPoolBonus}% sponsor pool`,
        source: 'location'
      })
    }
  }
  
  return summary
}
