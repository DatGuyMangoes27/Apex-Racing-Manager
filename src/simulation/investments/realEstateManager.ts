// ============================================
// REAL ESTATE MANAGER
// ============================================
// Handles property purchases, sales, rentals,
// maintenance, and value calculations.

import {
  Property,
  PropertyType,
  PropertyStatus,
  PropertyQuality,
  PropertyListing,
  PropertyRental,
  PropertyRenovation,
  RenovationType,
  LocationPropertyMarket,
  PROPERTY_MARKETS,
  PROPERTY_PRICE_CONFIGS,
  RENOVATION_CONFIGS,
  generatePropertyListing,
  getMarketForProperty,
  calculatePropertyMaintenanceCost,
  calculatePropertyInsuranceCost,
  calculatePropertyTax,
  calculateRentalIncome,
  estimateRentalValue,
  updatePropertyValue,
  degradePropertyCondition
} from '@/data/real-estate-config'
import { Country } from '@/data/personal-finance-config'
import { createPersonalTransaction } from '../finances/personalFinances'
import type { PersonalTransaction, Mortgage } from '@/data/personal-finance-config'

// ============================================
// ID GENERATION
// ============================================

let propertyIdCounter = 0

function generatePropertyId(): string {
  return `property_${Date.now()}_${++propertyIdCounter}`
}

// ============================================
// PROPERTY PURCHASE
// ============================================

export interface PropertyPurchaseResult {
  success: boolean
  reason?: string
  property?: Property
  transactions?: PersonalTransaction[]
  mortgage?: Mortgage
}

export function purchaseProperty(
  listing: PropertyListing,
  negotiatedPrice: number,
  downPaymentAmount: number,
  mortgageId: string | undefined,
  week: number,
  year: number,
  useAsPrimary: boolean = false
): PropertyPurchaseResult {
  // Validate negotiated price is within acceptable range
  const minAcceptable = listing.askingPrice * (1 - listing.negotiationRoom / 100)
  if (negotiatedPrice < minAcceptable) {
    return {
      success: false,
      reason: `Offer of $${negotiatedPrice.toLocaleString()} is too low. Minimum acceptable is $${Math.round(minAcceptable).toLocaleString()}`
    }
  }
  
  const transactions: PersonalTransaction[] = []
  
  // Create purchase transaction
  transactions.push(createPersonalTransaction(
    'expense',
    'property_purchase',
    negotiatedPrice,
    `Property purchase: ${listing.property.name} in ${listing.property.neighborhood}, ${listing.property.city}`,
    week,
    year,
    { taxDeductible: false }
  ))
  
  // If paying with mortgage, only the down payment comes from cash
  if (mortgageId) {
    // The down payment transaction replaces the full purchase
    transactions[0] = createPersonalTransaction(
      'expense',
      'property_purchase',
      downPaymentAmount,
      `Down payment for ${listing.property.name}`,
      week,
      year,
      { taxDeductible: false }
    )
  }
  
  // Create the property
  const property: Property = {
    id: generatePropertyId(),
    ...listing.property,
    purchasePrice: negotiatedPrice,
    purchaseDate: { week, year },
    currentValue: negotiatedPrice,
    lastValuationDate: { week, year },
    mortgageId,
    status: useAsPrimary ? 'primary_residence' : 'vacant'
  }
  
  return {
    success: true,
    property,
    transactions
  }
}

// ============================================
// PROPERTY SALE
// ============================================

export interface PropertySaleResult {
  success: boolean
  reason?: string
  salePrice?: number
  capitalGain?: number
  transactions?: PersonalTransaction[]
}

export function sellProperty(
  property: Property,
  salePrice: number,
  week: number,
  year: number,
  remainingMortgageBalance?: number
): PropertySaleResult {
  const transactions: PersonalTransaction[] = []
  
  // Calculate capital gain
  const capitalGain = salePrice - property.purchasePrice
  
  // Sale proceeds
  let netProceeds = salePrice
  
  // If there's a mortgage, pay it off first
  if (remainingMortgageBalance && remainingMortgageBalance > 0) {
    netProceeds -= remainingMortgageBalance
    
    transactions.push(createPersonalTransaction(
      'expense',
      'mortgage_payment',
      remainingMortgageBalance,
      `Mortgage payoff on sale of ${property.name}`,
      week,
      year,
      { relatedPropertyId: property.id }
    ))
  }
  
  // Sale income
  transactions.push(createPersonalTransaction(
    'income',
    'property_sale',
    salePrice,
    `Sale of ${property.name} in ${property.neighborhood}, ${property.city}`,
    week,
    year,
    { relatedPropertyId: property.id }
  ))
  
  // Capital gains will be taxed at year end
  if (capitalGain > 0) {
    // Note: This is tracked for tax purposes, not an immediate transaction
  }
  
  return {
    success: true,
    salePrice,
    capitalGain,
    transactions
  }
}

// ============================================
// RENTAL MANAGEMENT
// ============================================

export interface RentalSetupResult {
  success: boolean
  reason?: string
  monthlyRent?: number
  rental?: PropertyRental
}

export function setupRental(
  property: Property,
  market: LocationPropertyMarket,
  week: number,
  year: number
): RentalSetupResult {
  if (property.status === 'primary_residence') {
    return { success: false, reason: 'Cannot rent out primary residence' }
  }
  
  if (property.status === 'under_renovation') {
    return { success: false, reason: 'Property is under renovation' }
  }
  
  // Calculate rental value
  const monthlyRent = estimateRentalValue(property, market)
  
  // Random tenant quality
  const qualityRoll = Math.random()
  const tenantQuality = qualityRoll < 0.1 ? 'problematic' :
                       qualityRoll < 0.3 ? 'average' :
                       qualityRoll < 0.7 ? 'good' : 'excellent'
  
  // Management fee based on property type
  const managementFee = property.type === 'commercial' ? 0.08 : 0.10
  
  const rental: PropertyRental = {
    isRented: true,
    monthlyRent,
    tenantQuality,
    leaseStartDate: { week, year },
    leaseEndDate: { week, year: year + 1 },  // 1 year lease
    occupancyRate: 1.0,
    managementFee
  }
  
  return {
    success: true,
    monthlyRent,
    rental
  }
}

export function processMonthlyRentalIncome(
  property: Property,
  week: number,
  year: number
): PersonalTransaction | null {
  const income = calculateRentalIncome(property)
  if (income <= 0) return null
  
  return createPersonalTransaction(
    'income',
    'rental_income',
    income,
    `Rental income from ${property.name}`,
    week,
    year,
    { relatedPropertyId: property.id, taxDeductible: false }
  )
}

// ============================================
// RENOVATION MANAGEMENT
// ============================================

export interface RenovationStartResult {
  success: boolean
  reason?: string
  renovation?: PropertyRenovation
  cost?: number
  transaction?: PersonalTransaction
}

export function startRenovation(
  property: Property,
  renovationType: RenovationType,
  personalCash: number,
  week: number,
  year: number
): RenovationStartResult {
  const config = RENOVATION_CONFIGS[renovationType]
  
  // Check quality requirements
  if (config.requiredMinQuality) {
    const qualityOrder: PropertyQuality[] = ['basic', 'good', 'premium', 'luxury', 'ultra_luxury']
    const currentIndex = qualityOrder.indexOf(property.quality)
    const requiredIndex = qualityOrder.indexOf(config.requiredMinQuality)
    
    if (currentIndex < requiredIndex) {
      return {
        success: false,
        reason: `Property must be at least ${config.requiredMinQuality} quality for this renovation`
      }
    }
  }
  
  // Calculate cost
  const cost = Math.round(property.currentValue * config.costPercentOfValue)
  
  if (cost > personalCash) {
    return {
      success: false,
      reason: `Renovation costs $${cost.toLocaleString()} but you only have $${personalCash.toLocaleString()}`
    }
  }
  
  // Calculate value increase
  const valueIncrease = Math.round(property.currentValue * config.valueIncreasePercent)
  
  // Determine quality upgrade
  let qualityUpgrade: PropertyQuality | undefined
  if (config.qualityUpgrade) {
    const qualityOrder: PropertyQuality[] = ['basic', 'good', 'premium', 'luxury', 'ultra_luxury']
    const currentIndex = qualityOrder.indexOf(property.quality)
    if (currentIndex < qualityOrder.length - 1) {
      qualityUpgrade = qualityOrder[currentIndex + 1]
    }
  }
  
  const renovation: PropertyRenovation = {
    type: renovationType,
    startDate: { week, year },
    completionDate: { week: week + config.durationWeeks, year },  // Simplified, doesn't handle year rollover
    cost,
    valueIncrease,
    qualityUpgrade,
    inProgress: true
  }
  
  const transaction = createPersonalTransaction(
    'expense',
    'other_expense',
    cost,
    `${config.name} renovation on ${property.name}`,
    week,
    year,
    { relatedPropertyId: property.id }
  )
  
  return {
    success: true,
    renovation,
    cost,
    transaction
  }
}

export function completeRenovation(
  property: Property,
  renovation: PropertyRenovation
): Property {
  return {
    ...property,
    currentValue: property.currentValue + renovation.valueIncrease,
    quality: renovation.qualityUpgrade || property.quality,
    condition: Math.min(100, property.condition + 20),  // Renovation improves condition
    status: property.status === 'under_renovation' ? 'vacant' : property.status,
    renovation: undefined
  }
}

// ============================================
// WEEKLY PROCESSING
// ============================================

export interface WeeklyPropertyResult {
  propertyId: string
  updatedValue: number
  updatedCondition: number
  transactions: PersonalTransaction[]
  events: PropertyEvent[]
}

export interface PropertyEvent {
  type: 'tenant_issue' | 'maintenance_needed' | 'value_milestone' | 'lease_ending' | 'renovation_complete'
  propertyId: string
  description: string
  actionRequired: boolean
}

export function processWeeklyProperty(
  property: Property,
  market: LocationPropertyMarket,
  week: number,
  year: number,
  isMonthEnd: boolean
): WeeklyPropertyResult {
  const transactions: PersonalTransaction[] = []
  const events: PropertyEvent[] = []
  
  // Update property value
  const updatedValue = updatePropertyValue(property, market, 1)
  
  // Degrade condition
  const updatedCondition = degradePropertyCondition(property.condition, 1)
  
  // Check for low condition
  if (updatedCondition < 50 && property.condition >= 50) {
    events.push({
      type: 'maintenance_needed',
      propertyId: property.id,
      description: `${property.name} needs maintenance - condition is declining`,
      actionRequired: true
    })
  }
  
  // Monthly processing
  if (isMonthEnd) {
    // Maintenance costs
    const maintenanceCost = calculatePropertyMaintenanceCost(property)
    transactions.push(createPersonalTransaction(
      'expense',
      'other_expense',
      maintenanceCost,
      `Monthly maintenance for ${property.name}`,
      week,
      year,
      { relatedPropertyId: property.id }
    ))
    
    // Insurance
    const insuranceCost = calculatePropertyInsuranceCost(property)
    transactions.push(createPersonalTransaction(
      'expense',
      'insurance',
      insuranceCost,
      `Insurance for ${property.name}`,
      week,
      year,
      { relatedPropertyId: property.id }
    ))
    
    // Property tax
    const taxCost = calculatePropertyTax(property, market)
    if (taxCost > 0) {
      transactions.push(createPersonalTransaction(
        'expense',
        'tax_payment',
        taxCost,
        `Property tax for ${property.name}`,
        week,
        year,
        { relatedPropertyId: property.id, taxDeductible: true }
      ))
    }
    
    // Rental income
    if (property.status === 'rental' && property.rental?.isRented) {
      const rentalIncome = processMonthlyRentalIncome(property, week, year)
      if (rentalIncome) {
        transactions.push(rentalIncome)
      }
      
      // Random tenant issues
      if (property.rental.tenantQuality === 'problematic' && Math.random() < 0.2) {
        events.push({
          type: 'tenant_issue',
          propertyId: property.id,
          description: `Tenant issue at ${property.name} - may require attention`,
          actionRequired: true
        })
      }
    }
  }
  
  // Check renovation completion
  if (property.renovation?.inProgress && 
      property.renovation.completionDate.week <= week &&
      property.renovation.completionDate.year <= year) {
    events.push({
      type: 'renovation_complete',
      propertyId: property.id,
      description: `${RENOVATION_CONFIGS[property.renovation.type].name} complete on ${property.name}`,
      actionRequired: true
    })
  }
  
  return {
    propertyId: property.id,
    updatedValue,
    updatedCondition,
    transactions,
    events
  }
}

// ============================================
// PROPERTY PORTFOLIO SUMMARY
// ============================================

export interface PropertyPortfolioSummary {
  totalProperties: number
  totalValue: number
  totalEquity: number        // Value minus mortgages
  totalMortgageDebt: number
  monthlyRentalIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  byType: Record<PropertyType, { count: number; value: number }>
  byCountry: Record<string, { count: number; value: number }>
}

export function calculatePropertyPortfolioSummary(
  properties: Property[],
  mortgages: Mortgage[]
): PropertyPortfolioSummary {
  let totalValue = 0
  let totalMortgageDebt = 0
  let monthlyRentalIncome = 0
  let monthlyExpenses = 0
  
  const byType: Record<string, { count: number; value: number }> = {}
  const byCountry: Record<string, { count: number; value: number }> = {}
  
  for (const property of properties) {
    totalValue += property.currentValue
    
    // Rental income
    if (property.status === 'rental') {
      monthlyRentalIncome += calculateRentalIncome(property)
    }
    
    // Expenses
    monthlyExpenses += calculatePropertyMaintenanceCost(property)
    monthlyExpenses += calculatePropertyInsuranceCost(property)
    
    const market = PROPERTY_MARKETS.find(m => m.country === property.country && m.city === property.city)
    if (market) {
      monthlyExpenses += calculatePropertyTax(property, market)
    }
    
    // By type
    if (!byType[property.type]) {
      byType[property.type] = { count: 0, value: 0 }
    }
    byType[property.type].count++
    byType[property.type].value += property.currentValue
    
    // By country
    if (!byCountry[property.country]) {
      byCountry[property.country] = { count: 0, value: 0 }
    }
    byCountry[property.country].count++
    byCountry[property.country].value += property.currentValue
  }
  
  // Sum mortgage debt
  for (const mortgage of mortgages) {
    totalMortgageDebt += mortgage.remainingBalance
  }
  
  // Add mortgage payments to expenses
  for (const mortgage of mortgages) {
    monthlyExpenses += mortgage.monthlyPayment
  }
  
  return {
    totalProperties: properties.length,
    totalValue,
    totalEquity: totalValue - totalMortgageDebt,
    totalMortgageDebt,
    monthlyRentalIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyRentalIncome - monthlyExpenses,
    byType: byType as Record<PropertyType, { count: number; value: number }>,
    byCountry
  }
}

// ============================================
// LISTING GENERATION
// ============================================

export function generatePropertyListings(
  count: number,
  budgetMin: number,
  budgetMax: number,
  preferredCountries?: Country[]
): PropertyListing[] {
  const listings: PropertyListing[] = []
  const markets = preferredCountries 
    ? PROPERTY_MARKETS.filter(m => preferredCountries.includes(m.country))
    : PROPERTY_MARKETS
  
  if (markets.length === 0) return []
  
  let attempts = 0
  const maxAttempts = count * 10
  
  while (listings.length < count && attempts < maxAttempts) {
    attempts++
    
    // Random market
    const market = markets[Math.floor(Math.random() * markets.length)]
    
    // Random neighborhood
    const neighborhood = market.neighborhoods[Math.floor(Math.random() * market.neighborhoods.length)]
    
    // Random type from available
    const type = neighborhood.availableTypes[Math.floor(Math.random() * neighborhood.availableTypes.length)]
    
    // Random quality (weighted toward middle)
    const qualities: PropertyQuality[] = ['basic', 'good', 'premium', 'luxury', 'ultra_luxury']
    const qualityWeights = [0.1, 0.25, 0.35, 0.2, 0.1]
    const qualityRoll = Math.random()
    let cumulativeWeight = 0
    let quality: PropertyQuality = 'good'
    for (let i = 0; i < qualities.length; i++) {
      cumulativeWeight += qualityWeights[i]
      if (qualityRoll < cumulativeWeight) {
        quality = qualities[i]
        break
      }
    }
    
    const listing = generatePropertyListing(
      market.country,
      market.city,
      neighborhood.name,
      type,
      quality
    )
    
    if (listing && listing.askingPrice >= budgetMin && listing.askingPrice <= budgetMax) {
      listings.push(listing)
    }
  }
  
  return listings
}
