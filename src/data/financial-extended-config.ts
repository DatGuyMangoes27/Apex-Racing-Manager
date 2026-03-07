// ============================================
// EXTENDED FINANCIAL CONFIGURATION
// ============================================
// Configuration for loans, investments, and merchandise systems

import type { TeamTier } from '@/store/rivalStore'
import type { 
  RiskLevel, 
  PropertyType, 
  SideBusinessType, 
  MerchCategory, 
  MerchRarity,
  StoreType,
  CollectionTheme
} from '@/store/careerStore'

// ============================================
// LOANS CONFIGURATION
// ============================================

export interface LoanTermsConfig {
  minAmount: number
  maxAmount: number
  baseInterestRate: number    // Annual %
  minTerm: number             // Weeks
  maxTerm: number             // Weeks
  requiresCollateral: boolean
  approvalThreshold: number   // Minimum credit score
}

// Bank loan terms by team tier (higher tier = better terms)
export const BANK_LOAN_TERMS_BY_TIER: Record<TeamTier, LoanTermsConfig> = {
  entry: {
    minAmount: 10000,
    maxAmount: 100000,
    baseInterestRate: 12,
    minTerm: 26,
    maxTerm: 104,
    requiresCollateral: true,
    approvalThreshold: 600
  },
  amateur: {
    minAmount: 25000,
    maxAmount: 300000,
    baseInterestRate: 10,
    minTerm: 26,
    maxTerm: 156,
    requiresCollateral: true,
    approvalThreshold: 580
  },
  'semi-pro': {
    minAmount: 50000,
    maxAmount: 750000,
    baseInterestRate: 8.5,
    minTerm: 26,
    maxTerm: 208,
    requiresCollateral: false,
    approvalThreshold: 560
  },
  professional: {
    minAmount: 100000,
    maxAmount: 2000000,
    baseInterestRate: 7,
    minTerm: 26,
    maxTerm: 260,
    requiresCollateral: false,
    approvalThreshold: 540
  },
  pro: {
    minAmount: 250000,
    maxAmount: 5000000,
    baseInterestRate: 5.5,
    minTerm: 52,
    maxTerm: 260,
    requiresCollateral: false,
    approvalThreshold: 520
  },
  elite: {
    minAmount: 500000,
    maxAmount: 15000000,
    baseInterestRate: 4.5,
    minTerm: 52,
    maxTerm: 312,
    requiresCollateral: false,
    approvalThreshold: 500
  },
  pinnacle: {
    minAmount: 1000000,
    maxAmount: 50000000,
    baseInterestRate: 3.5,
    minTerm: 52,
    maxTerm: 520,
    requiresCollateral: false,
    approvalThreshold: 480
  }
}

// Credit line terms by tier
export interface CreditLineConfig {
  maxCredit: number
  minCredit?: number          // Optional minimum for a single line (default 0)
  interestRate: number         // Annual % on drawn amount
  maintenanceFeePercent: number // Weekly % of max credit
  approvalThreshold: number
}

export const CREDIT_LINE_TERMS_BY_TIER: Record<TeamTier, CreditLineConfig> = {
  entry: { maxCredit: 50000, minCredit: 10000, interestRate: 15, maintenanceFeePercent: 0.05, approvalThreshold: 620 },
  amateur: { maxCredit: 150000, minCredit: 25000, interestRate: 12, maintenanceFeePercent: 0.04, approvalThreshold: 600 },
  'semi-pro': { maxCredit: 400000, minCredit: 50000, interestRate: 10, maintenanceFeePercent: 0.035, approvalThreshold: 580 },
  professional: { maxCredit: 1000000, minCredit: 100000, interestRate: 8, maintenanceFeePercent: 0.03, approvalThreshold: 560 },
  pro: { maxCredit: 3000000, minCredit: 250000, interestRate: 6.5, maintenanceFeePercent: 0.025, approvalThreshold: 540 },
  elite: { maxCredit: 10000000, minCredit: 500000, interestRate: 5, maintenanceFeePercent: 0.02, approvalThreshold: 520 },
  pinnacle: { maxCredit: 30000000, minCredit: 1000000, interestRate: 4, maintenanceFeePercent: 0.015, approvalThreshold: 500 }
}

// Bank/Lender names for variety
export const BANK_LENDERS = [
  'First Motorsport Bank',
  'Racing Capital Finance',
  'Velocity Financial',
  'Grid Position Lending',
  'Apex Credit Union',
  'Motorsport Mutual',
  'Trackside Banking',
  'Championship Finance Corp',
  'Pit Lane Capital',
  'Start Line Credit'
]

// Private investor configuration
export interface PrivateInvestorConfig {
  minInvestment: number
  maxInvestment: number
  minEquityPercent: number
  maxEquityPercent: number
  typicalMilestoneCount: number
  buybackMultipleRange: [number, number]
}

export const PRIVATE_INVESTOR_CONFIG_BY_TIER: Record<TeamTier, PrivateInvestorConfig> = {
  entry: { minInvestment: 25000, maxInvestment: 200000, minEquityPercent: 5, maxEquityPercent: 25, typicalMilestoneCount: 2, buybackMultipleRange: [1.5, 2.5] },
  amateur: { minInvestment: 50000, maxInvestment: 500000, minEquityPercent: 5, maxEquityPercent: 30, typicalMilestoneCount: 3, buybackMultipleRange: [1.5, 2.5] },
  'semi-pro': { minInvestment: 100000, maxInvestment: 1500000, minEquityPercent: 5, maxEquityPercent: 35, typicalMilestoneCount: 3, buybackMultipleRange: [1.75, 3.0] },
  professional: { minInvestment: 250000, maxInvestment: 4000000, minEquityPercent: 5, maxEquityPercent: 40, typicalMilestoneCount: 4, buybackMultipleRange: [2.0, 3.5] },
  pro: { minInvestment: 500000, maxInvestment: 10000000, minEquityPercent: 5, maxEquityPercent: 45, typicalMilestoneCount: 4, buybackMultipleRange: [2.0, 4.0] },
  elite: { minInvestment: 1000000, maxInvestment: 30000000, minEquityPercent: 5, maxEquityPercent: 49, typicalMilestoneCount: 5, buybackMultipleRange: [2.5, 4.5] },
  pinnacle: { minInvestment: 5000000, maxInvestment: 100000000, minEquityPercent: 5, maxEquityPercent: 49, typicalMilestoneCount: 5, buybackMultipleRange: [3.0, 5.0] }
}

// Investor names
export const PRIVATE_INVESTOR_NAMES = [
  'Marcus Sterling',
  'Victoria Chen',
  'Alessandro Rossi',
  'Helena Schmidt',
  'James Whitfield',
  'Sophia Nakamura',
  'Ricardo Santos',
  'Emma Blackwood',
  'Viktor Petrov',
  'Alexandra Dubois',
  'Horizon Ventures',
  'Apex Investments',
  'Velocity Capital Partners',
  'Racing Syndicate Holdings',
  'Checkered Flag Equity',
  'Podium Partners LLC',
  'Grid Position Ventures'
]

// Credit score impact factors
export const CREDIT_SCORE_FACTORS = {
  onTimePayment: 5,        // Per payment
  latePayment: -15,        // Per late payment
  missedPayment: -30,      // Per missed payment
  loanPaidOff: 20,         // Per loan paid off
  newLoan: -5,             // Per new loan (temporary)
  highDebtRatio: -10,      // If debt/equity > 0.5
  profitableSeason: 10,    // Season with profit
  unprofitableSeason: -5,  // Season with loss
  /** When total drawn / total credit limit > this (0–1), apply highUtilizationCreditDelta weekly */
  highUtilizationThreshold: 0.75,
  /** Weekly credit delta when utilization is above threshold */
  highUtilizationCreditDelta: -2,
  minScore: 300,
  maxScore: 850
}

// ============================================
// INVESTMENTS CONFIGURATION
// ============================================

export interface IndexFundTemplate {
  id: string
  name: string
  description: string
  riskLevel: RiskLevel
  expectedReturnMin: number    // Annual %
  expectedReturnMax: number    // Annual %
  weeklyVolatility: number     // % variance per week
  minInvestment: number
  managementFee: number        // Annual %
}

export const INDEX_FUND_TEMPLATES: IndexFundTemplate[] = [
  {
    id: 'motorsport_etf',
    name: 'Motorsport Industry ETF',
    description: 'Diversified fund tracking automotive and motorsport companies',
    riskLevel: 'medium',
    expectedReturnMin: 6,
    expectedReturnMax: 12,
    weeklyVolatility: 2.5,
    minInvestment: 10000,
    managementFee: 0.5
  },
  {
    id: 'tech_growth',
    name: 'Technology Growth Fund',
    description: 'High-growth tech companies with above-market returns',
    riskLevel: 'high',
    expectedReturnMin: 10,
    expectedReturnMax: 25,
    weeklyVolatility: 5,
    minInvestment: 25000,
    managementFee: 0.75
  },
  {
    id: 'stable_income',
    name: 'Stable Income Bond Fund',
    description: 'Conservative bond fund with steady, predictable returns',
    riskLevel: 'low',
    expectedReturnMin: 3,
    expectedReturnMax: 5,
    weeklyVolatility: 0.5,
    minInvestment: 5000,
    managementFee: 0.25
  },
  {
    id: 'global_market',
    name: 'Global Market Index',
    description: 'Tracks major global markets for balanced exposure',
    riskLevel: 'medium',
    expectedReturnMin: 7,
    expectedReturnMax: 14,
    weeklyVolatility: 3,
    minInvestment: 15000,
    managementFee: 0.4
  },
  {
    id: 'auto_industry',
    name: 'Automotive Leaders Fund',
    description: 'Top automotive manufacturers and suppliers',
    riskLevel: 'medium',
    expectedReturnMin: 5,
    expectedReturnMax: 15,
    weeklyVolatility: 3.5,
    minInvestment: 20000,
    managementFee: 0.6
  },
  {
    id: 'emerging_markets',
    name: 'Emerging Markets Fund',
    description: 'High-risk, high-reward exposure to developing economies',
    riskLevel: 'high',
    expectedReturnMin: 8,
    expectedReturnMax: 30,
    weeklyVolatility: 6,
    minInvestment: 30000,
    managementFee: 0.85
  }
]

// Real estate configuration
export interface RealEstateTemplate {
  propertyType: PropertyType
  name: string
  description: string
  basePurchasePrice: number
  monthlyRentalBase: number
  monthlyExpensesBase: number
  appreciationMin: number      // Annual %
  appreciationMax: number
  occupancyRateBase: number    // %
}

export const REAL_ESTATE_TEMPLATES: Record<PropertyType, RealEstateTemplate> = {
  warehouse: {
    propertyType: 'warehouse',
    name: 'Industrial Warehouse',
    description: 'Storage and logistics space rentable to racing teams and suppliers',
    basePurchasePrice: 500000,
    monthlyRentalBase: 8000,
    monthlyExpensesBase: 2000,
    appreciationMin: 2,
    appreciationMax: 5,
    occupancyRateBase: 85
  },
  office: {
    propertyType: 'office',
    name: 'Office Complex',
    description: 'Professional office space for motorsport-related businesses',
    basePurchasePrice: 1200000,
    monthlyRentalBase: 18000,
    monthlyExpensesBase: 5000,
    appreciationMin: 3,
    appreciationMax: 7,
    occupancyRateBase: 80
  },
  sim_center: {
    propertyType: 'sim_center',
    name: 'Simulator Center',
    description: 'Racing simulator facility for training and entertainment',
    basePurchasePrice: 800000,
    monthlyRentalBase: 25000,
    monthlyExpensesBase: 10000,
    appreciationMin: 4,
    appreciationMax: 10,
    occupancyRateBase: 70
  },
  retail_space: {
    propertyType: 'retail_space',
    name: 'Retail Location',
    description: 'Storefront for merchandise and fan experiences',
    basePurchasePrice: 400000,
    monthlyRentalBase: 6000,
    monthlyExpensesBase: 1500,
    appreciationMin: 2,
    appreciationMax: 6,
    occupancyRateBase: 90
  }
}

// Side business configuration
export interface SideBusinessTemplate {
  businessType: SideBusinessType
  name: string
  description: string
  initialInvestmentMin: number
  initialInvestmentMax: number
  weeklyRevenueBase: number
  weeklyExpensesBase: number
  staffRequired: number
  reputationGrowthRate: number  // Per week when performing well
  upgradeCount: number          // Max upgrade level
  upgradeMultipliers: number[]  // Revenue multiplier per level
  upgradeCosts: number[]        // Cost per upgrade level
}

export const SIDE_BUSINESS_TEMPLATES: Record<SideBusinessType, SideBusinessTemplate> = {
  racing_school: {
    businessType: 'racing_school',
    name: 'Racing School',
    description: 'Professional driving instruction for aspiring racers',
    initialInvestmentMin: 200000,
    initialInvestmentMax: 500000,
    weeklyRevenueBase: 8000,
    weeklyExpensesBase: 3500,
    staffRequired: 4,
    reputationGrowthRate: 1,
    upgradeCount: 5,
    upgradeMultipliers: [1, 1.3, 1.6, 2.0, 2.5, 3.0],
    upgradeCosts: [0, 75000, 150000, 300000, 500000, 800000]
  },
  sim_center: {
    businessType: 'sim_center',
    name: 'Public Sim Racing Center',
    description: 'Pay-per-hour simulator experience for enthusiasts',
    initialInvestmentMin: 150000,
    initialInvestmentMax: 400000,
    weeklyRevenueBase: 6000,
    weeklyExpensesBase: 2500,
    staffRequired: 3,
    reputationGrowthRate: 1.5,
    upgradeCount: 5,
    upgradeMultipliers: [1, 1.25, 1.55, 1.9, 2.3, 2.8],
    upgradeCosts: [0, 50000, 100000, 200000, 350000, 550000]
  },
  karting_track: {
    businessType: 'karting_track',
    name: 'Karting Track',
    description: 'Indoor or outdoor karting facility',
    initialInvestmentMin: 400000,
    initialInvestmentMax: 1000000,
    weeklyRevenueBase: 12000,
    weeklyExpensesBase: 6000,
    staffRequired: 6,
    reputationGrowthRate: 0.8,
    upgradeCount: 5,
    upgradeMultipliers: [1, 1.35, 1.75, 2.2, 2.7, 3.3],
    upgradeCosts: [0, 100000, 200000, 400000, 700000, 1100000]
  },
  parts_shop: {
    businessType: 'parts_shop',
    name: 'Racing Parts Shop',
    description: 'Retail and online store for racing equipment and parts',
    initialInvestmentMin: 100000,
    initialInvestmentMax: 300000,
    weeklyRevenueBase: 5000,
    weeklyExpensesBase: 2000,
    staffRequired: 2,
    reputationGrowthRate: 2,
    upgradeCount: 5,
    upgradeMultipliers: [1, 1.2, 1.45, 1.75, 2.1, 2.5],
    upgradeCosts: [0, 40000, 80000, 150000, 250000, 400000]
  },
  driving_experience: {
    businessType: 'driving_experience',
    name: 'Driving Experience',
    description: 'Track day experiences in high-performance vehicles',
    initialInvestmentMin: 300000,
    initialInvestmentMax: 800000,
    weeklyRevenueBase: 15000,
    weeklyExpensesBase: 8000,
    staffRequired: 5,
    reputationGrowthRate: 1.2,
    upgradeCount: 5,
    upgradeMultipliers: [1, 1.4, 1.85, 2.35, 2.9, 3.5],
    upgradeCosts: [0, 80000, 175000, 350000, 600000, 950000]
  }
}

// ============================================
// MERCHANDISE CONFIGURATION
// ============================================

export interface MerchProductTemplate {
  id: string
  name: string
  category: MerchCategory
  description: string
  basePriceRange: [number, number]
  productionCostPercent: number   // % of base price
  demandBase: number              // Weekly units at 50k followers
  demandPerFollower: number       // Additional units per 1000 followers
}

export const MERCH_PRODUCT_TEMPLATES: MerchProductTemplate[] = [
  // Apparel
  { id: 'team_tshirt', name: 'Team T-Shirt', category: 'apparel', description: 'Official team t-shirt with logo', basePriceRange: [25, 40], productionCostPercent: 35, demandBase: 50, demandPerFollower: 0.5 },
  { id: 'team_polo', name: 'Team Polo Shirt', category: 'apparel', description: 'Premium polo with embroidered logo', basePriceRange: [45, 70], productionCostPercent: 40, demandBase: 30, demandPerFollower: 0.3 },
  { id: 'team_hoodie', name: 'Team Hoodie', category: 'apparel', description: 'Comfortable hoodie with team branding', basePriceRange: [60, 90], productionCostPercent: 38, demandBase: 40, demandPerFollower: 0.4 },
  { id: 'team_jacket', name: 'Team Jacket', category: 'apparel', description: 'Premium softshell team jacket', basePriceRange: [120, 180], productionCostPercent: 45, demandBase: 15, demandPerFollower: 0.15 },
  { id: 'race_suit_replica', name: 'Race Suit Replica', category: 'apparel', description: 'Replica driver race suit', basePriceRange: [200, 400], productionCostPercent: 50, demandBase: 5, demandPerFollower: 0.05 },
  { id: 'team_cap', name: 'Team Cap', category: 'apparel', description: 'Official team baseball cap', basePriceRange: [25, 35], productionCostPercent: 30, demandBase: 60, demandPerFollower: 0.6 },
  
  // Accessories
  { id: 'team_keychain', name: 'Team Keychain', category: 'accessories', description: 'Metal keychain with team logo', basePriceRange: [8, 15], productionCostPercent: 25, demandBase: 80, demandPerFollower: 0.8 },
  { id: 'team_mug', name: 'Team Mug', category: 'accessories', description: 'Ceramic mug with team design', basePriceRange: [12, 20], productionCostPercent: 30, demandBase: 45, demandPerFollower: 0.45 },
  { id: 'team_water_bottle', name: 'Team Water Bottle', category: 'accessories', description: 'Reusable water bottle with branding', basePriceRange: [18, 28], productionCostPercent: 35, demandBase: 35, demandPerFollower: 0.35 },
  { id: 'phone_case', name: 'Team Phone Case', category: 'accessories', description: 'Protective phone case with team livery', basePriceRange: [20, 35], productionCostPercent: 40, demandBase: 25, demandPerFollower: 0.25 },
  { id: 'team_lanyard', name: 'Team Lanyard', category: 'accessories', description: 'Neck lanyard with pass holder', basePriceRange: [10, 18], productionCostPercent: 25, demandBase: 70, demandPerFollower: 0.7 },
  { id: 'team_umbrella', name: 'Team Umbrella', category: 'accessories', description: 'Large umbrella in team colors', basePriceRange: [30, 50], productionCostPercent: 40, demandBase: 20, demandPerFollower: 0.2 },
  
  // Collectibles
  { id: 'diecast_car', name: 'Diecast Model Car', category: 'collectibles', description: '1:43 scale model of team car', basePriceRange: [40, 75], productionCostPercent: 45, demandBase: 25, demandPerFollower: 0.25 },
  { id: 'diecast_premium', name: 'Premium Diecast (1:18)', category: 'collectibles', description: 'Large scale detailed model', basePriceRange: [150, 250], productionCostPercent: 50, demandBase: 8, demandPerFollower: 0.08 },
  { id: 'team_flag', name: 'Team Flag', category: 'collectibles', description: 'Large team flag for display', basePriceRange: [25, 40], productionCostPercent: 35, demandBase: 30, demandPerFollower: 0.3 },
  { id: 'poster_set', name: 'Poster Set', category: 'collectibles', description: 'Set of official team posters', basePriceRange: [20, 35], productionCostPercent: 30, demandBase: 40, demandPerFollower: 0.4 },
  
  // Memorabilia
  { id: 'signed_photo', name: 'Signed Driver Photo', category: 'memorabilia', description: 'Authentic signed driver photograph', basePriceRange: [50, 100], productionCostPercent: 20, demandBase: 15, demandPerFollower: 0.15 },
  { id: 'signed_cap', name: 'Signed Team Cap', category: 'memorabilia', description: 'Cap signed by team driver', basePriceRange: [75, 150], productionCostPercent: 35, demandBase: 10, demandPerFollower: 0.1 },
  { id: 'race_used_part', name: 'Race-Used Part', category: 'memorabilia', description: 'Authentic component from race car', basePriceRange: [200, 500], productionCostPercent: 10, demandBase: 3, demandPerFollower: 0.03 },
  { id: 'race_helmet_mini', name: 'Mini Race Helmet', category: 'memorabilia', description: '1:2 scale replica helmet', basePriceRange: [100, 200], productionCostPercent: 45, demandBase: 12, demandPerFollower: 0.12 },
  
  // Digital
  { id: 'digital_wallpaper', name: 'Digital Wallpaper Pack', category: 'digital', description: 'HD wallpapers and backgrounds', basePriceRange: [5, 10], productionCostPercent: 5, demandBase: 100, demandPerFollower: 1 },
  { id: 'nft_collectible', name: 'Digital Collectible NFT', category: 'digital', description: 'Limited edition digital artwork', basePriceRange: [25, 100], productionCostPercent: 10, demandBase: 20, demandPerFollower: 0.2 },
  { id: 'digital_membership', name: 'Digital Fan Pass', category: 'digital', description: 'Access to exclusive digital content', basePriceRange: [15, 30], productionCostPercent: 5, demandBase: 50, demandPerFollower: 0.5 }
]

// Rarity multipliers
export const MERCH_RARITY_CONFIG: Record<MerchRarity, { priceMultiplier: number; demandMultiplier: number; productionLimit?: number }> = {
  standard: { priceMultiplier: 1, demandMultiplier: 1 },
  limited: { priceMultiplier: 1.5, demandMultiplier: 0.6, productionLimit: 500 },
  exclusive: { priceMultiplier: 2.5, demandMultiplier: 0.3, productionLimit: 100 },
  ultra_rare: { priceMultiplier: 5, demandMultiplier: 0.1, productionLimit: 25 }
}

// Store configuration
export interface StoreConfig {
  type: StoreType
  name: string
  weeklyCostBase: number
  weeklyFootTrafficBase: number
  conversionRateBase: number    // %
  setupCost: number
}

export const STORE_CONFIGS: Record<StoreType, StoreConfig> = {
  online: {
    type: 'online',
    name: 'Online Store',
    weeklyCostBase: 500,
    weeklyFootTrafficBase: 5000,
    conversionRateBase: 3,
    setupCost: 5000
  },
  physical: {
    type: 'physical',
    name: 'Physical Store',
    weeklyCostBase: 5000,
    weeklyFootTrafficBase: 1000,
    conversionRateBase: 15,
    setupCost: 100000
  },
  popup: {
    type: 'popup',
    name: 'Pop-Up Store',
    weeklyCostBase: 2000,
    weeklyFootTrafficBase: 2000,
    conversionRateBase: 20,
    setupCost: 15000
  },
  event: {
    type: 'event',
    name: 'Race Weekend Store',
    weeklyCostBase: 3000,
    weeklyFootTrafficBase: 8000,
    conversionRateBase: 25,
    setupCost: 10000
  }
}

// Predefined store locations for physical / popup / event stores (no free-text)
export const STORE_LOCATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'hq_lobby', label: 'HQ Lobby' },
  { value: 'track_shop', label: 'Track Shop' },
  { value: 'partner_retailer', label: 'Partner Retailer' },
  { value: 'event_booth', label: 'Event Booth' },
  { value: 'paddock_store', label: 'Paddock Store' },
  { value: 'fan_zone', label: 'Fan Zone' }
]

// Collection themes and their sales multipliers
export const COLLECTION_THEME_CONFIG: Record<CollectionTheme, { salesMultiplier: number; durationWeeks: number; marketingMultiplier: number; description: string }> = {
  season: { salesMultiplier: 1.2, durationWeeks: 52, marketingMultiplier: 1, description: 'A comprehensive collection celebrating the racing season' },
  victory: { salesMultiplier: 2.0, durationWeeks: 4, marketingMultiplier: 1.5, description: 'Limited edition celebrating race victories' },
  anniversary: { salesMultiplier: 1.5, durationWeeks: 8, marketingMultiplier: 1.3, description: 'Special collection marking team milestones' },
  driver: { salesMultiplier: 1.3, durationWeeks: 26, marketingMultiplier: 1.1, description: 'Exclusive collection featuring driver themes' },
  collaboration: { salesMultiplier: 1.8, durationWeeks: 12, marketingMultiplier: 1.4, description: 'Collaborative collection with partner brands' },
  holiday: { salesMultiplier: 1.6, durationWeeks: 6, marketingMultiplier: 1.2, description: 'Seasonal holiday-themed collection' }
}

// Collaboration partners
export const COLLABORATION_PARTNERS = [
  'Supreme',
  'Nike',
  'Puma',
  'TAG Heuer',
  'Ray-Ban',
  'Boss',
  'Tommy Hilfiger',
  'Palm Angels',
  'A Bathing Ape',
  'Off-White',
  'Lego',
  'Hot Wheels',
  'PlayStation',
  'Monster Energy',
  'Red Bull'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateLoanWeeklyPayment(principal: number, annualRate: number, totalWeeks: number): number {
  const weeklyRate = annualRate / 100 / 52
  if (weeklyRate === 0) return principal / totalWeeks
  const payment = principal * (weeklyRate * Math.pow(1 + weeklyRate, totalWeeks)) / (Math.pow(1 + weeklyRate, totalWeeks) - 1)
  return Math.round(payment)
}

export function calculateCreditLineWeeklyInterest(drawnAmount: number, annualRate: number): number {
  return Math.round(drawnAmount * (annualRate / 100 / 52))
}

export function calculateCreditLineMaintenanceFee(maxCredit: number, weeklyPercent: number): number {
  return Math.round(maxCredit * (weeklyPercent / 100))
}

export function calculateMerchDemand(
  baseProductDemand: number,
  demandPerFollower: number,
  socialFollowers: number,
  fanClubMembers: number,
  recentWins: number,
  recentPodiums: number,
  mediaScore: number,
  collectionMultiplier: number = 1,
  rarityMultiplier: number = 1
): number {
  // Base demand from product
  let demand = baseProductDemand
  
  // Social media boost (per 1000 followers)
  demand += (socialFollowers / 1000) * demandPerFollower
  
  // Fan club boost (members buy 3x more)
  demand += fanClubMembers * 0.1
  
  // Performance boost
  demand *= 1 + (recentWins * 0.15) + (recentPodiums * 0.05)
  
  // Media score multiplier (0.5x at 0, 1.5x at 100)
  demand *= 0.5 + (mediaScore / 100)
  
  // Collection and rarity multipliers
  demand *= collectionMultiplier * rarityMultiplier
  
  return Math.round(Math.max(1, demand))
}

export function getRandomLenderName(): string {
  return BANK_LENDERS[Math.floor(Math.random() * BANK_LENDERS.length)]
}

export function getRandomInvestorName(): string {
  return PRIVATE_INVESTOR_NAMES[Math.floor(Math.random() * PRIVATE_INVESTOR_NAMES.length)]
}

export function getRandomCollaborationPartner(): string {
  return COLLABORATION_PARTNERS[Math.floor(Math.random() * COLLABORATION_PARTNERS.length)]
}
