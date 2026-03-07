/**
 * Merchandise staff proposals: Marketing Manager (or similar) can propose
 * new products or collections; owner approves or rejects via email.
 */

import type { CareerState, Email, EmailCategory } from '@/store/careerStore'
import type {
  PendingProductProposal,
  PendingCollectionProposal,
  MerchandiseFullState,
  MerchRarity,
  CollectionTheme
} from '@/store/careerStore'
import { MERCH_PRODUCT_TEMPLATES, MERCH_RARITY_CONFIG, COLLECTION_THEME_CONFIG } from '@/data/financial-extended-config'
import type { FacilityStaffRole } from '@/data/facility-staff-config'

const PROPOSAL_CHANCE_PER_WEEK = 0.12
const PRODUCT_VS_COLLECTION = 0.5

function generateProposalId(type: string): string {
  return `merch_proposal_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getMarketingManager(
  facilityStaff: { id: string; name: string; role: string }[] | undefined
): { id: string; name: string } | null {
  if (!facilityStaff?.length) return null
  const mm = facilityStaff.find(s => (s.role as FacilityStaffRole) === 'marketing_manager')
  return mm ? { id: mm.id, name: mm.name } : null
}

export function generateMerchandiseProposalEmail(
  type: 'product' | 'collection',
  proposal: PendingProductProposal | PendingCollectionProposal,
  staffName: string,
  staffRole: string,
  careerState: CareerState
): Omit<Email, 'id'> {
  const day = careerState.currentDay ?? 1
  const week = careerState.currentWeek
  const year = careerState.currentYear

  if (type === 'product') {
    const p = proposal as PendingProductProposal
    const template = MERCH_PRODUCT_TEMPLATES.find(t => t.id === p.templateId)
    const productName = template?.name ?? 'New product'
    return {
      category: 'team' as EmailCategory,
      subject: `Merchandise proposal: ${productName}`,
      sender: staffName,
      senderRole,
      preview: `${staffName} has proposed adding "${productName}" to the merchandise line. Review and approve or reject.`,
      body: `Team Principal,

I'd like to propose adding the following product to our merchandise range:

**Product:** ${productName}
**Base price:** $${p.basePrice}
**Rarity:** ${p.rarity}
**Initial stock:** ${p.initialStock}
**Weekly production:** ${p.weeklyProduction}
**Reorder point:** ${p.reorderPoint}

Please review and let me know if you approve this addition.

${staffName}
${staffRole}`,
      receivedDay: day,
      receivedWeek: week,
      receivedYear: year,
      read: false,
      starred: false,
      archived: false,
      actionType: 'merchandise_proposal_product',
      actionData: { proposalId: p.id, proposalType: 'product' }
    }
  } else {
    const c = proposal as PendingCollectionProposal
    return {
      category: 'team' as EmailCategory,
      subject: `Merchandise proposal: ${c.name}`,
      sender: staffName,
      senderRole,
      preview: `${staffName} has proposed a new collection "${c.name}". Review and approve or reject.`,
      body: `Team Principal,

I'd like to propose launching the following collection:

**Collection:** ${c.name}
**Theme:** ${c.theme}
**Products:** ${c.productIds.length} item(s)
**Exclusive to fan club:** ${c.exclusiveToMembers ? 'Yes' : 'No'}
**Marketing budget:** $${c.marketingBudget.toLocaleString()}

${c.description}

Please review and let me know if you approve.

${staffName}
${staffRole}`,
      receivedDay: day,
      receivedWeek: week,
      receivedYear: year,
      read: false,
      starred: false,
      archived: false,
      actionType: 'merchandise_proposal_collection',
      actionData: { proposalId: c.id, proposalType: 'collection' }
    }
  }
}

export interface MerchandiseProposalResult {
  type: 'product' | 'collection'
  proposal: PendingProductProposal | PendingCollectionProposal
  email: Omit<Email, 'id'>
}

/**
 * With some probability, generate a product or collection proposal from the Marketing Manager.
 * Caller must add the proposal to state and the email to inbox.
 */
export function tryGenerateMerchandiseProposal(careerState: CareerState): MerchandiseProposalResult | null {
  const team = careerState?.ownedTeam
  if (!team?.finances?.extended) return null

  const staff = getMarketingManager(team.facilityStaff)
  if (!staff) return null

  if (Math.random() > PROPOSAL_CHANCE_PER_WEEK) return null

  const merch = team.finances.extended.merchandise as MerchandiseFullState
  const pendingProduct = merch.pendingProductProposals ?? []
  const pendingCollection = merch.pendingCollectionProposals ?? []
  const week = careerState.currentWeek ?? 1
  const year = careerState.currentYear ?? 2024
  const activeProducts = merch.products.filter(p => p.active)

  const doProduct = Math.random() < PRODUCT_VS_COLLECTION || activeProducts.length < 2

  if (doProduct) {
    const template = MERCH_PRODUCT_TEMPLATES[Math.floor(Math.random() * MERCH_PRODUCT_TEMPLATES.length)]
    if (!template) return null
    const rarity: MerchRarity = 'standard'
    const rarityConfig = MERCH_RARITY_CONFIG[rarity]
    const minPrice = Math.ceil(template.basePriceRange[0] * rarityConfig.priceMultiplier)
    const maxPrice = Math.ceil(template.basePriceRange[1] * rarityConfig.priceMultiplier)
    const basePrice = Math.round((minPrice + maxPrice) / 2)
    const proposal: PendingProductProposal = {
      id: generateProposalId('product'),
      templateId: template.id,
      basePrice,
      rarity,
      initialStock: 100,
      weeklyProduction: 50,
      reorderPoint: 20,
      proposedByStaffId: staff.id,
      proposedWeek: week,
      proposedYear: year
    }
    const email = generateMerchandiseProposalEmail(
      'product',
      proposal,
      staff.name,
      'Marketing Manager',
      careerState
    )
    return { type: 'product', proposal, email }
  } else {
    if (activeProducts.length < 2) return null
    const theme = Object.keys(COLLECTION_THEME_CONFIG)[Math.floor(Math.random() * Object.keys(COLLECTION_THEME_CONFIG).length)] as CollectionTheme
    const themeConfig = COLLECTION_THEME_CONFIG[theme]
    const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1)
    const name = `${themeLabel} Collection ${year}`
    const description = themeConfig?.description ?? `Official ${theme} collection`
    const count = Math.min(2 + Math.floor(Math.random() * 3), activeProducts.length)
    const shuffled = [...activeProducts].sort(() => Math.random() - 0.5)
    const productIds = shuffled.slice(0, count).map(p => p.id)
    const proposal: PendingCollectionProposal = {
      id: generateProposalId('collection'),
      name,
      description,
      theme,
      productIds,
      exclusiveToMembers: false,
      marketingBudget: 5000,
      proposedByStaffId: staff.id,
      proposedWeek: week,
      proposedYear: year
    }
    const email = generateMerchandiseProposalEmail(
      'collection',
      proposal,
      staff.name,
      'Marketing Manager',
      careerState
    )
    return { type: 'collection', proposal, email }
  }
}
