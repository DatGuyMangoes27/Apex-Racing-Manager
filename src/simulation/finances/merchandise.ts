// ============================================
// MERCHANDISE SYSTEM LOGIC
// ============================================
// Handles products, collections, stores, and sales

import {
  MerchProduct,
  MerchCollection,
  MerchStore,
  MerchandiseFullState,
  TeamTransaction,
  MerchCategory,
  MerchRarity,
  StoreType,
  CollectionTheme
} from '@/store/careerStore'
import {
  MERCH_PRODUCT_TEMPLATES,
  MERCH_RARITY_CONFIG,
  STORE_CONFIGS,
  COLLECTION_THEME_CONFIG,
  calculateMerchDemand,
  getRandomCollaborationPartner,
  MerchProductTemplate
} from '@/data/financial-extended-config'
import { createTeamTransaction } from './teamFinances'

// ============================================
// ID GENERATION
// ============================================

let merchIdCounter = 0

function generateMerchId(type: string): string {
  return `${type}_${Date.now()}_${++merchIdCounter}`
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

export function getProductTemplates(): MerchProductTemplate[] {
  return MERCH_PRODUCT_TEMPLATES
}

export function getProductTemplatesByCategory(category: MerchCategory): MerchProductTemplate[] {
  return MERCH_PRODUCT_TEMPLATES.filter(p => p.category === category)
}

export interface CreateProductParams {
  templateId: string
  customName?: string
  customDescription?: string
  basePrice: number
  rarity: MerchRarity
  initialStock: number
  weeklyProduction: number
  reorderPoint: number
  currentWeek: number
  currentYear: number
}

export function createProduct(params: CreateProductParams): { product: MerchProduct; transaction: TeamTransaction } | { error: string } {
  const template = MERCH_PRODUCT_TEMPLATES.find(t => t.id === params.templateId)
  if (!template) {
    return { error: 'Invalid product template.' }
  }

  const rarityConfig = MERCH_RARITY_CONFIG[params.rarity]
  
  // Validate price is within range
  const minPrice = template.basePriceRange[0] * rarityConfig.priceMultiplier
  const maxPrice = template.basePriceRange[1] * rarityConfig.priceMultiplier * 1.5  // Allow some markup
  if (params.basePrice < minPrice || params.basePrice > maxPrice) {
    return { error: `Price should be between $${minPrice.toFixed(0)} and $${maxPrice.toFixed(0)} for this product and rarity.` }
  }

  // Calculate production cost
  const productionCost = Math.round(params.basePrice * (template.productionCostPercent / 100))

  // Initial inventory production cost
  const initialProductionCost = productionCost * params.initialStock

  const product: MerchProduct = {
    id: generateMerchId('product'),
    name: params.customName || template.name,
    category: template.category,
    description: params.customDescription || template.description,
    basePrice: params.basePrice,
    productionCost,
    rarity: params.rarity,
    stockLevel: params.initialStock,
    reorderPoint: params.reorderPoint,
    weeklyProduction: params.weeklyProduction,
    totalSold: 0,
    weeklyAverageSold: 0,
    lastRestockWeek: params.currentWeek,
    active: true,
    launchWeek: params.currentWeek,
    launchYear: params.currentYear
  }

  const transaction = createTeamTransaction(
    'expense',
    'merchandise_production',
    initialProductionCost,
    `Initial production of ${product.name} (${params.initialStock} units)`,
    params.currentWeek,
    params.currentYear,
    { countsTowardCostCap: false }
  )

  return { product, transaction }
}

export function discontinueProduct(
  product: MerchProduct,
  week: number
): MerchProduct {
  return {
    ...product,
    active: false,
    discontinuedWeek: week,
    weeklyProduction: 0
  }
}

export function updateProductPrice(
  product: MerchProduct,
  newPrice: number
): MerchProduct | { error: string } {
  const _template = MERCH_PRODUCT_TEMPLATES.find(t => t.name === product.name || t.id === product.name)
  const _rarityConfig = MERCH_RARITY_CONFIG[product.rarity]
  
  // Basic validation
  if (newPrice < 1) {
    return { error: 'Price must be at least $1.' }
  }

  // Update production cost proportionally
  const costRatio = product.productionCost / product.basePrice
  const newProductionCost = Math.round(newPrice * costRatio)

  return {
    ...product,
    basePrice: newPrice,
    productionCost: newProductionCost
  }
}

// ============================================
// COLLECTION FUNCTIONS
// ============================================

export interface CreateCollectionParams {
  name: string
  description: string
  theme: CollectionTheme
  productIds: string[]
  collaborationPartner?: string
  exclusiveToMembers: boolean
  marketingBudget: number
  currentWeek: number
  currentYear: number
}

export function createCollection(params: CreateCollectionParams): { collection: MerchCollection; transaction?: TeamTransaction } | { error: string } {
  if (params.productIds.length === 0) {
    return { error: 'Collection must include at least one product.' }
  }

  const themeConfig = COLLECTION_THEME_CONFIG[params.theme]
  
  // Calculate sales multiplier from marketing
  const baseMultiplier = themeConfig.salesMultiplier
  const marketingMultiplier = 1 + (Math.log10(params.marketingBudget + 1) / 10) * themeConfig.marketingMultiplier
  const finalMultiplier = baseMultiplier * marketingMultiplier

  const collection: MerchCollection = {
    id: generateMerchId('collection'),
    name: params.name,
    description: params.description,
    theme: params.theme,
    products: params.productIds,
    launchWeek: params.currentWeek,
    launchYear: params.currentYear,
    endWeek: params.currentWeek + themeConfig.durationWeeks,
    endYear: params.currentYear + Math.floor((params.currentWeek + themeConfig.durationWeeks) / 52),
    collaborationPartner: params.theme === 'collaboration' 
      ? (params.collaborationPartner || getRandomCollaborationPartner())
      : undefined,
    exclusiveToMembers: params.exclusiveToMembers,
    marketingBudget: params.marketingBudget,
    salesMultiplier: finalMultiplier,
    active: true
  }

  let transaction: TeamTransaction | undefined
  if (params.marketingBudget > 0) {
    transaction = createTeamTransaction(
      'expense',
      'marketing',
      params.marketingBudget,
      `Marketing campaign for ${params.name} collection`,
      params.currentWeek,
      params.currentYear,
      { countsTowardCostCap: false }
    )
  }

  return { collection, transaction }
}

export function endCollection(
  collection: MerchCollection,
  week: number,
  year: number
): MerchCollection {
  return {
    ...collection,
    active: false,
    endWeek: week,
    endYear: year
  }
}

export function isCollectionActive(
  collection: MerchCollection,
  currentWeek: number,
  currentYear: number
): boolean {
  if (!collection.active) return false
  
  const endWeek = collection.endWeek || collection.launchWeek + 52
  const endYear = collection.endYear || collection.launchYear + 1
  
  if (currentYear > endYear) return false
  if (currentYear === endYear && currentWeek > endWeek) return false
  
  return true
}

// ============================================
// STORE FUNCTIONS
// ============================================

export function openStore(
  type: StoreType,
  customName: string | undefined,
  location: string | undefined,
  productIds: string[],
  currentWeek: number,
  currentYear: number
): { store: MerchStore; transaction: TeamTransaction } | { error: string } {
  const config = STORE_CONFIGS[type]
  if (!config) {
    return { error: 'Invalid store type.' }
  }

  const store: MerchStore = {
    id: generateMerchId('store'),
    name: customName || `${location || 'Main'} ${config.name}`,
    type,
    location,
    weeklyCost: config.weeklyCostBase,
    weeklyFootTraffic: config.weeklyFootTrafficBase,
    conversionRate: config.conversionRateBase,
    opened: { week: currentWeek, year: currentYear },
    products: productIds,
    active: true
  }

  const transaction = createTeamTransaction(
    'expense',
    'merchandise_store_costs',
    config.setupCost,
    `Setup costs for ${store.name}`,
    currentWeek,
    currentYear,
    { countsTowardCostCap: false }
  )

  return { store, transaction }
}

export function closeStore(
  store: MerchStore,
  week: number,
  year: number
): MerchStore {
  return {
    ...store,
    active: false,
    closed: { week, year }
  }
}

export function updateStoreProducts(
  store: MerchStore,
  productIds: string[]
): MerchStore {
  return {
    ...store,
    products: productIds
  }
}

// ============================================
// SALES PROCESSING
// ============================================

export interface SalesContext {
  socialFollowers: number
  fanClubMembers: number
  recentWins: number       // Last 4 weeks
  recentPodiums: number    // Last 4 weeks
  mediaScore: number       // 0-100
  isRaceWeek: boolean
  seasonWeek: number       // For seasonal demand
}

export function calculateProductSales(
  product: MerchProduct,
  stores: MerchStore[],
  activeCollections: MerchCollection[],
  context: SalesContext
): number {
  if (!product.active || product.stockLevel <= 0) {
    return 0
  }

  const template = MERCH_PRODUCT_TEMPLATES.find(t => t.name === product.name || t.id === product.name)
  if (!template) {
    // Use default values if no template found
    const baseDemand = 10
    return Math.min(baseDemand, product.stockLevel)
  }

  // Get rarity multiplier
  const rarityConfig = MERCH_RARITY_CONFIG[product.rarity]

  // Check if product is in any active collection
  let collectionMultiplier = 1
  for (const collection of activeCollections) {
    if (collection.products.includes(product.id)) {
      collectionMultiplier = Math.max(collectionMultiplier, collection.salesMultiplier)
    }
  }

  // Base demand calculation
  let demand = calculateMerchDemand(
    template.demandBase,
    template.demandPerFollower,
    context.socialFollowers,
    context.fanClubMembers,
    context.recentWins,
    context.recentPodiums,
    context.mediaScore,
    collectionMultiplier,
    rarityConfig.demandMultiplier
  )

  // Race week boost
  if (context.isRaceWeek) {
    demand = Math.round(demand * 1.5)
  }

  // Seasonal adjustments (higher demand at start and end of season)
  if (context.seasonWeek <= 4 || context.seasonWeek >= 48) {
    demand = Math.round(demand * 1.3)
  }

  // Store traffic multiplier
  const storesCarryingProduct = stores.filter(s => s.active && s.products.includes(product.id))
  let storeMultiplier = 0
  for (const store of storesCarryingProduct) {
    storeMultiplier += (store.weeklyFootTraffic / 5000) * (store.conversionRate / 100)
  }
  if (storeMultiplier > 0) {
    demand = Math.round(demand * Math.max(1, storeMultiplier))
  }

  // Can't sell more than stock
  return Math.min(demand, product.stockLevel)
}

export function processWeeklySales(
  merchState: MerchandiseFullState,
  context: SalesContext,
  week: number,
  year: number
): { 
  updatedState: MerchandiseFullState; 
  transactions: TeamTransaction[]; 
  totalRevenue: number; 
  totalCosts: number;
  productsSold: { productId: string; quantity: number; revenue: number }[];
} {
  const transactions: TeamTransaction[] = []
  let totalRevenue = 0
  let totalCosts = 0
  const productsSold: { productId: string; quantity: number; revenue: number }[] = []

  // Get active collections
  const activeCollections = merchState.collections.filter(c => 
    isCollectionActive(c, week, year)
  )

  // Process sales for each product
  const updatedProducts = merchState.products.map(product => {
    const unitsSold = calculateProductSales(
      product,
      merchState.stores,
      activeCollections,
      context
    )

    if (unitsSold <= 0) {
      return product
    }

    const revenue = unitsSold * product.basePrice
    totalRevenue += revenue

    productsSold.push({
      productId: product.id,
      quantity: unitsSold,
      revenue
    })

    // Update product stats
    return {
      ...product,
      stockLevel: product.stockLevel - unitsSold,
      totalSold: product.totalSold + unitsSold,
      weeklyAverageSold: Math.round((product.weeklyAverageSold * 3 + unitsSold) / 4)  // Rolling average
    }
  })

  // Create sales revenue transaction
  if (totalRevenue > 0) {
    transactions.push(createTeamTransaction(
      'income',
      'merchandise_sales',
      totalRevenue,
      `Merchandise sales (${productsSold.reduce((sum, p) => sum + p.quantity, 0)} items)`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
  }

  // Process store costs
  let storesCost = 0
  merchState.stores.filter(s => s.active).forEach(store => {
    storesCost += store.weeklyCost
  })
  
  if (storesCost > 0) {
    transactions.push(createTeamTransaction(
      'expense',
      'merchandise_store_costs',
      storesCost,
      `Store operating costs (${merchState.stores.filter(s => s.active).length} stores)`,
      week,
      year,
      { countsTowardCostCap: false }
    ))
    totalCosts += storesCost
  }

  // Process production/restocking
  const restockedProducts: MerchProduct[] = []
  let productionCost = 0

  updatedProducts.forEach(product => {
    if (!product.active || product.weeklyProduction <= 0) {
      restockedProducts.push(product)
      return
    }

    // Check if we need to restock (at or below reorder point)
    if (product.stockLevel <= product.reorderPoint) {
      const unitsToProducer = product.weeklyProduction
      const cost = unitsToProducer * product.productionCost
      productionCost += cost

      restockedProducts.push({
        ...product,
        stockLevel: product.stockLevel + unitsToProducer,
        lastRestockWeek: week
      })
    } else {
      restockedProducts.push(product)
    }
  })

  if (productionCost > 0) {
    transactions.push(createTeamTransaction(
      'expense',
      'merchandise_production',
      productionCost,
      'Weekly merchandise production',
      week,
      year,
      { countsTowardCostCap: false }
    ))
    totalCosts += productionCost
  }

  // Calculate low stock alerts
  const lowStockAlerts = restockedProducts
    .filter(p => p.active && p.stockLevel <= p.reorderPoint)
    .map(p => p.id)

  // Calculate top selling products
  const topSellingProducts = [...restockedProducts]
    .filter(p => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5)
    .map(p => p.id)

  // Update revenue history
  const profit = totalRevenue - totalCosts
  const newHistoryEntry = { week, year, revenue: totalRevenue, profit }
  const revenueHistory = [...merchState.revenueHistory, newHistoryEntry].slice(-52)  // Keep last year

  // Calculate member exclusive revenue (fan club members)
  const memberExclusiveRevenue = Math.round(totalRevenue * (context.fanClubMembers / (context.socialFollowers + 1)) * 0.3)

  const updatedState: MerchandiseFullState = {
    ...merchState,
    products: restockedProducts,
    totalRevenue: merchState.totalRevenue + totalRevenue,
    totalCosts: merchState.totalCosts + totalCosts,
    weeklyRevenue: totalRevenue,
    weeklyCosts: totalCosts,
    weeklyProfit: profit,
    topSellingProducts,
    revenueHistory,
    lowStockAlerts,
    memberExclusiveRevenue
  }

  return {
    updatedState,
    transactions,
    totalRevenue,
    totalCosts,
    productsSold
  }
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export function calculateMerchProfitMargin(merchState: MerchandiseFullState): number {
  if (merchState.totalRevenue === 0) return 0
  return ((merchState.totalRevenue - merchState.totalCosts) / merchState.totalRevenue) * 100
}

export function getProductPerformance(products: MerchProduct[]): {
  bestSellers: MerchProduct[];
  lowPerformers: MerchProduct[];
  outOfStock: MerchProduct[];
} {
  const activeProducts = products.filter(p => p.active)
  
  const bestSellers = [...activeProducts]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5)

  const lowPerformers = [...activeProducts]
    .filter(p => p.weeklyAverageSold < 5 && p.totalSold > 0)
    .sort((a, b) => a.weeklyAverageSold - b.weeklyAverageSold)
    .slice(0, 5)

  const outOfStock = activeProducts.filter(p => p.stockLevel === 0)

  return { bestSellers, lowPerformers, outOfStock }
}

export function getRevenueByCategory(products: MerchProduct[]): Record<MerchCategory, number> {
  const result: Record<MerchCategory, number> = {
    apparel: 0,
    accessories: 0,
    collectibles: 0,
    memorabilia: 0,
    digital: 0
  }

  products.forEach(product => {
    result[product.category] += product.totalSold * product.basePrice
  })

  return result
}

export function getInventoryValue(products: MerchProduct[]): number {
  return products.reduce((total, product) => {
    return total + (product.stockLevel * product.productionCost)
  }, 0)
}

export function getRetailValue(products: MerchProduct[]): number {
  return products.reduce((total, product) => {
    return total + (product.stockLevel * product.basePrice)
  }, 0)
}

// ============================================
// COLLECTION SUGGESTIONS
// ============================================

export function suggestVictoryCollection(
  existingProducts: MerchProduct[],
  raceWon: string,
  driverName: string
): CreateCollectionParams | null {
  // Select appropriate products for a victory collection
  const victoryProducts = existingProducts
    .filter(p => p.active && ['apparel', 'collectibles', 'memorabilia'].includes(p.category))
    .slice(0, 5)
    .map(p => p.id)

  if (victoryProducts.length === 0) return null

  return {
    name: `${raceWon} Victory Collection`,
    description: `Commemorating ${driverName}'s victory at ${raceWon}`,
    theme: 'victory',
    productIds: victoryProducts,
    exclusiveToMembers: false,
    marketingBudget: 5000,
    currentWeek: 0,  // To be filled
    currentYear: 0   // To be filled
  }
}

export function suggestSeasonCollection(
  year: number,
  teamName: string
): Partial<CreateCollectionParams> {
  return {
    name: `${year} ${teamName} Season Collection`,
    description: `Official merchandise for the ${year} racing season`,
    theme: 'season',
    exclusiveToMembers: false,
    marketingBudget: 10000
  }
}
