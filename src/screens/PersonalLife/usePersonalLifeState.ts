import { useMemo, useEffect } from 'react'
import { useCareerStore } from '@/store/careerStore'
import type { PersonalLifeState } from '@/components/personal'
import { createDefaultLifestyleAssets } from '@/data/lifestyle-assets-config'
import { calculateLifestyleScore } from '@/simulation/personal/lifestyleAssetsManager'
import { OWNER_BACKGROUNDS } from '@/data/owner-backgrounds'

// ============================================
// BACKGROUND-SPECIFIC STARTER ASSETS
// ============================================

interface StarterVehicle {
  brand: string; model: string; type: string; purchasePrice: number; currentValue: number
  isCollectible?: boolean; depreciationRate?: number; appreciationRate?: number
}
interface StarterProperty {
  name: string; type: string; status: string; country: string; city: string; neighborhood: string
  purchasePrice: number; currentValue: number; appreciationRate: number
  isPlayerRental?: boolean; monthlyRent?: number; leaseMonths?: number
  mortgageId?: string
  monthlyMaintenance: number; annualPropertyTax: number; insuranceCost: number
  bedrooms: number; bathrooms: number; squareMeters: number; garageSpaces: number
  quality: string; condition: number; features: string[]; perks: any[]
}
interface StarterMortgage {
  id: string; propertyId: string; propertyName: string; lender: string; originalAmount: number
  principal: number; remainingBalance: number; interestRate: number; termMonths: number
  termYears: number; yearsRemaining: number; monthlyPayment: number
  downPaymentAmount: number; downPaymentPercent: number
  totalInterestPaid: number; nextPaymentDue: number; currentEquity: number
  startDate: { week: number; year: number }; type: string; status: string
}
interface StarterPet {
  id: string; type: string; name: string; breed: string; monthlyUpkeep: number
  happiness: number; health: number; bondLevel: number; purchasePrice: number
}
interface StarterCollectible {
  id: string; name: string; category: string; rarity: string
  purchasePrice: number; currentValue: number; appreciationRate: number
}

function getBackgroundStarterAssets(backgroundId: string, currentWeek: number, currentYear: number): {
  vehicles: any[]; properties: StarterProperty[]; mortgages: StarterMortgage[]
  pets: StarterPet[]; collectibles: StarterCollectible[]; hobbies: any[]
  cashAdjustment: number // negative for down payments
} {
  const ts = { week: currentWeek, year: currentYear }
  const emptyResult = { vehicles: [], properties: [], mortgages: [], pets: [], collectibles: [], hobbies: [], cashAdjustment: 0 }

  const makeVehicle = (v: StarterVehicle) => ({
    id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brand: v.brand, model: v.model, category: v.type,
    purchasePrice: v.purchasePrice, currentValue: v.currentValue,
    purchaseDate: ts, lastServiceDate: ts,
    isCollectible: v.isCollectible || false,
    depreciationRate: v.depreciationRate || 0.12,
    appreciationRate: v.appreciationRate || 0,
    monthlyMaintenanceCost: Math.round(v.currentValue * 0.003),
    monthlyInsuranceCost: Math.round(v.currentValue * 0.004),
    condition: 90 + Math.floor(Math.random() * 10),
    isPrimaryVehicle: true, mileage: Math.floor(Math.random() * 5000),
    customizations: [], name: `${v.brand} ${v.model}`
  })

  const makeProperty = (p: StarterProperty, propId: string): StarterProperty => ({
    ...p, id: propId } as any)

  const makeMortgage = (propId: string, propName: string, loanAmount: number, rate: number, termYears: number, downPaymentAmount: number, downPaymentPercent: number): StarterMortgage => {
    const mortId = `mort-starter-${Math.random().toString(36).slice(2, 8)}`
    const monthlyRate = rate / 12
    const n = termYears * 12
    const payment = Math.round(loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
    return {
      id: mortId, propertyId: propId, propertyName: propName, lender: 'Premier Property Finance',
      originalAmount: loanAmount, principal: loanAmount, remainingBalance: loanAmount,
      interestRate: rate, termMonths: n, termYears, yearsRemaining: termYears,
      monthlyPayment: payment, downPaymentAmount, downPaymentPercent,
      totalInterestPaid: 0, nextPaymentDue: currentWeek + 4, currentEquity: downPaymentAmount,
      startDate: ts, type: 'fixed', status: 'active'
    }
  }

  switch (backgroundId) {
    case 'self_made': {
      // Self-Made Entrepreneur: BMW 3 Series + rented apartment
      const vehicle = makeVehicle({ brand: 'BMW', model: '3 Series', type: 'luxury_sedan', purchasePrice: 45000, currentValue: 38000, depreciationRate: 0.15 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const property: any = {
        id: propId, name: 'City Apartment', type: 'apartment', status: 'player_rental',
        country: 'United Kingdom', city: 'London', neighborhood: 'Shoreditch',
        purchasePrice: 0, currentValue: 450000, appreciationRate: 0.04,
        isPlayerRental: true, monthlyRent: 2500, leaseMonths: 12,
        monthlyMaintenance: 0, annualPropertyTax: 0, insuranceCost: 0,
        bedrooms: 2, bathrooms: 1, squareMeters: 65, garageSpaces: 0,
        quality: 'good', condition: 85, features: ['smart_home'], perks: [],
        purchaseDate: ts, lastValuationDate: ts
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], cashAdjustment: 0 }
    }

    case 'racing_dynasty': {
      // Racing Dynasty Heir: Porsche 911 Carrera + inherited house + pet + collectible
      const vehicle = makeVehicle({ brand: 'Porsche', model: '911 Carrera', type: 'sports', purchasePrice: 120000, currentValue: 120000, depreciationRate: 0.08 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const property: any = {
        id: propId, name: 'Family Estate', type: 'house', status: 'primary_residence',
        country: 'United Kingdom', city: 'London', neighborhood: 'Surrey Countryside',
        purchasePrice: 1200000, currentValue: 1200000, appreciationRate: 0.04,
        monthlyMaintenance: 1500, annualPropertyTax: 14400, insuranceCost: 400,
        bedrooms: 5, bathrooms: 4, squareMeters: 350, garageSpaces: 3,
        quality: 'luxury', condition: 82, features: ['garden', 'pool', 'racing_simulator'],
        perks: [{ type: 'privacy', value: 20, description: 'Country estate' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const pet: StarterPet = {
        id: `pet-starter-${Math.random().toString(36).slice(2, 8)}`,
        type: 'dog', name: 'Champion', breed: 'Golden Retriever',
        monthlyUpkeep: 200, happiness: 90, health: 95, bondLevel: 80, purchasePrice: 2500
      }
      const collectible: StarterCollectible = {
        id: `col-starter-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Signed Ayrton Senna Helmet', category: 'motorsport_memorabilia', rarity: 'rare',
        purchasePrice: 35000, currentValue: 42000, appreciationRate: 0.06
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], pets: [pet], collectibles: [collectible], cashAdjustment: 0 }
    }

    case 'tech_investor': {
      // Tech Investor: Tesla Model S Plaid + mortgage condo + hobby
      const vehicle = makeVehicle({ brand: 'Tesla', model: 'Model S Plaid', type: 'electric', purchasePrice: 130000, currentValue: 115000, depreciationRate: 0.10 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const downPayment = Math.round(1100000 * 0.30)
      const loanAmount = 1100000 - downPayment
      const mortgage = makeMortgage(propId, 'Luxury Penthouse', loanAmount, 0.04, 25, downPayment, 30)
      const property: any = {
        id: propId, name: 'Luxury Penthouse', type: 'penthouse', status: 'primary_residence',
        country: 'United States', city: 'Miami', neighborhood: 'Brickell',
        purchasePrice: 1100000, currentValue: 1100000, appreciationRate: 0.05,
        mortgageId: mortgage.id,
        monthlyMaintenance: 900, annualPropertyTax: 22000, insuranceCost: 460,
        bedrooms: 3, bathrooms: 2, squareMeters: 180, garageSpaces: 1,
        quality: 'luxury', condition: 95, features: ['gym', 'concierge', 'smart_home', 'rooftop_terrace'],
        perks: [{ type: 'networking', value: 15, description: 'Business district' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const hobby: any = {
        id: `hobby-starter-sim`,
        type: 'sim_racing' as any, name: 'Sim Racing',
        currentLevel: 2, hoursInvested: 50,
        currentMonthlyCost: 50, annualCost: 600,
        startedDate: ts, lastPracticedDate: ts,
        enjoyment: 85, skillGrowthRate: 1.2
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], mortgages: [mortgage], hobbies: [hobby], cashAdjustment: -downPayment }
    }

    case 'former_driver': {
      // Former Racing Driver: BMW M4 + rented apartment + collectible
      const vehicle = makeVehicle({ brand: 'BMW', model: 'M4', type: 'sports', purchasePrice: 75000, currentValue: 68000, depreciationRate: 0.10 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const property: any = {
        id: propId, name: 'Monaco Apartment', type: 'apartment', status: 'player_rental',
        country: 'Monaco', city: 'Monaco', neighborhood: 'Fontvieille',
        purchasePrice: 0, currentValue: 800000, appreciationRate: 0.03,
        isPlayerRental: true, monthlyRent: 3500, leaseMonths: 12,
        monthlyMaintenance: 0, annualPropertyTax: 0, insuranceCost: 0,
        bedrooms: 2, bathrooms: 1, squareMeters: 75, garageSpaces: 1,
        quality: 'premium', condition: 90, features: ['concierge', 'security_system'],
        perks: [{ type: 'tax_benefit', value: 100, description: 'No income tax' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const collectible: StarterCollectible = {
        id: `col-starter-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Race-Worn Helmet Collection', category: 'motorsport_memorabilia', rarity: 'uncommon',
        purchasePrice: 8000, currentValue: 12000, appreciationRate: 0.05
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], collectibles: [collectible], cashAdjustment: 0 }
    }

    case 'finance_mogul': {
      // Finance Mogul: Mercedes S-Class + mortgage apartment + pet + collectible
      const vehicle = makeVehicle({ brand: 'Mercedes', model: 'S-Class', type: 'luxury_sedan', purchasePrice: 110000, currentValue: 105000, depreciationRate: 0.12 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const downPayment = Math.round(950000 * 0.25)
      const loanAmount = 950000 - downPayment
      const mortgage = makeMortgage(propId, 'Upscale City Apartment', loanAmount, 0.042, 25, downPayment, 25)
      const property: any = {
        id: propId, name: 'Upscale City Apartment', type: 'apartment', status: 'primary_residence',
        country: 'United Kingdom', city: 'London', neighborhood: 'Canary Wharf',
        purchasePrice: 950000, currentValue: 950000, appreciationRate: 0.04,
        mortgageId: mortgage.id,
        monthlyMaintenance: 600, annualPropertyTax: 11400, insuranceCost: 240,
        bedrooms: 3, bathrooms: 2, squareMeters: 120, garageSpaces: 1,
        quality: 'premium', condition: 92, features: ['gym', 'concierge', 'smart_home'],
        perks: [{ type: 'networking', value: 15, description: 'Financial district' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const pet: StarterPet = {
        id: `pet-starter-${Math.random().toString(36).slice(2, 8)}`,
        type: 'cat', name: 'Aspen', breed: 'Bengal',
        monthlyUpkeep: 150, happiness: 85, health: 95, bondLevel: 75, purchasePrice: 3000
      }
      const collectible: StarterCollectible = {
        id: `col-starter-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Patek Philippe Nautilus', category: 'watches', rarity: 'rare',
        purchasePrice: 45000, currentValue: 52000, appreciationRate: 0.08
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], mortgages: [mortgage], pets: [pet], collectibles: [collectible], cashAdjustment: -downPayment }
    }

    case 'passionate_fan': {
      // Passionate Enthusiast: Mazda MX-5 Miata + small rented flat
      const vehicle = makeVehicle({ brand: 'Mazda', model: 'MX-5 Miata', type: 'sports', purchasePrice: 35000, currentValue: 30000, depreciationRate: 0.14 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const property: any = {
        id: propId, name: 'Small Flat', type: 'apartment', status: 'player_rental',
        country: 'United Kingdom', city: 'Silverstone Area', neighborhood: 'Brackley',
        purchasePrice: 0, currentValue: 180000, appreciationRate: 0.03,
        isPlayerRental: true, monthlyRent: 1800, leaseMonths: 12,
        monthlyMaintenance: 0, annualPropertyTax: 0, insuranceCost: 0,
        bedrooms: 1, bathrooms: 1, squareMeters: 45, garageSpaces: 0,
        quality: 'basic', condition: 80, features: [],
        perks: [{ type: 'networking', value: 15, description: 'Heart of Motorsport Valley' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], cashAdjustment: 0 }
    }

    case 'corporate_exec': {
      // Corporate Executive: Range Rover Sport + mortgage apartment + pet + golf hobby
      const vehicle = makeVehicle({ brand: 'Range Rover', model: 'Sport', type: 'suv', purchasePrice: 85000, currentValue: 80000, depreciationRate: 0.12 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const downPayment = Math.round(750000 * 0.20)
      const loanAmount = 750000 - downPayment
      const mortgage = makeMortgage(propId, 'City Apartment', loanAmount, 0.045, 25, downPayment, 20)
      const property: any = {
        id: propId, name: 'City Apartment', type: 'apartment', status: 'primary_residence',
        country: 'United Kingdom', city: 'London', neighborhood: 'Chelsea',
        purchasePrice: 750000, currentValue: 750000, appreciationRate: 0.04,
        mortgageId: mortgage.id,
        monthlyMaintenance: 500, annualPropertyTax: 9000, insuranceCost: 190,
        bedrooms: 2, bathrooms: 2, squareMeters: 100, garageSpaces: 1,
        quality: 'premium', condition: 88, features: ['gym', 'security_system'],
        perks: [{ type: 'reputation_bonus', value: 15, description: 'Fashionable address' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const pet: StarterPet = {
        id: `pet-starter-${Math.random().toString(36).slice(2, 8)}`,
        type: 'dog', name: 'Winston', breed: 'French Bulldog',
        monthlyUpkeep: 250, happiness: 90, health: 90, bondLevel: 85, purchasePrice: 4000
      }
      const hobby: any = {
        id: `hobby-starter-golf`,
        type: 'golf' as any, name: 'Golf',
        currentLevel: 3, hoursInvested: 100,
        currentMonthlyCost: 500, annualCost: 6000,
        startedDate: ts, lastPracticedDate: ts,
        enjoyment: 70, skillGrowthRate: 0.8
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], mortgages: [mortgage], pets: [pet], hobbies: [hobby], cashAdjustment: -downPayment }
    }

    case 'lottery_winner': {
      // Lottery Winner: Corvette Stingray + rented penthouse + pet + collectible
      const vehicle = makeVehicle({ brand: 'Chevrolet', model: 'Corvette Stingray', type: 'sports', purchasePrice: 70000, currentValue: 70000, depreciationRate: 0.10 })
      const propId = `prop-starter-${Math.random().toString(36).slice(2, 8)}`
      const property: any = {
        id: propId, name: 'Rented Penthouse', type: 'penthouse', status: 'player_rental',
        country: 'United States', city: 'Miami', neighborhood: 'Brickell',
        purchasePrice: 0, currentValue: 2000000, appreciationRate: 0.05,
        isPlayerRental: true, monthlyRent: 5000, leaseMonths: 12,
        monthlyMaintenance: 0, annualPropertyTax: 0, insuranceCost: 0,
        bedrooms: 3, bathrooms: 2, squareMeters: 180, garageSpaces: 1,
        quality: 'luxury', condition: 95, features: ['pool', 'gym', 'concierge', 'rooftop_terrace'],
        perks: [{ type: 'media_appeal', value: 15, description: 'Penthouse living' }],
        purchaseDate: ts, lastValuationDate: ts
      }
      const pet: StarterPet = {
        id: `pet-starter-${Math.random().toString(36).slice(2, 8)}`,
        type: 'bird', name: 'Rio', breed: 'Macaw',
        monthlyUpkeep: 120, happiness: 80, health: 90, bondLevel: 60, purchasePrice: 3500
      }
      const collectible: StarterCollectible = {
        id: `col-starter-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Vintage Racing Poster Collection', category: 'art', rarity: 'common',
        purchasePrice: 5000, currentValue: 5000, appreciationRate: 0.03
      }
      return { ...emptyResult, vehicles: [vehicle], properties: [property], pets: [pet], collectibles: [collectible], cashAdjustment: 0 }
    }

    default:
      return emptyResult
  }
}

// Create a default personal life state for team owners
export function createDefaultPersonalLifeState(
  player: { firstName: string; lastName: string; age: number }, 
  teamValue: number,
  currentYear: number,
  currentWeek: number,
  backgroundId?: string
): PersonalLifeState {
  // Determine starting cash from background or default
  const bg = backgroundId ? OWNER_BACKGROUNDS[backgroundId] : undefined
  const baseLiquidCash = bg?.personalBuffer ?? bg?.startingCash ?? 500000
  const equityValue = teamValue || 0
  
  // Get background-specific starter assets
  const starterAssets = backgroundId 
    ? getBackgroundStarterAssets(backgroundId, currentWeek, currentYear) 
    : { vehicles: [], properties: [], mortgages: [], pets: [], collectibles: [], hobbies: [], cashAdjustment: 0 }
  
  const liquidCash = baseLiquidCash + starterAssets.cashAdjustment
  const cachedNetWorth = liquidCash + equityValue
  
  const defaultLifestyleAssets = createDefaultLifestyleAssets()
  
  // Merge starter vehicles into lifestyle assets
  if (starterAssets.vehicles.length > 0) {
    defaultLifestyleAssets.vehicles = starterAssets.vehicles
  }
  // Merge starter pets
  if (starterAssets.pets.length > 0) {
    (defaultLifestyleAssets as any).pets = starterAssets.pets
  }
  // Merge starter collectibles
  if (starterAssets.collectibles.length > 0) {
    (defaultLifestyleAssets as any).collectibles = starterAssets.collectibles
  }
  
  const state: any = {
    finances: {
      // Core wealth
      liquidCash,
      cachedNetWorth,
      lastNetWorthUpdate: currentWeek,
      
      // Monthly income breakdown
      monthlyIncome: {
        ownerSalary: 0,
        dividends: 0,
        rentalIncome: 0,
        investmentIncome: 0,
        endorsements: 0,
        speakingFees: 0,
        other: 0
      },
      
      // Monthly expenses breakdown - populated from actual starter lifestyle assets
      monthlyExpenses: {
        lifestyle: 0,
        mortgagePayments: starterAssets.mortgages.reduce((s, m) => s + m.monthlyPayment, 0),
        loanPayments: 0,
        familyExpenses: 0,
        personalStaff: Math.floor(55000 / 12),  // Julia Green PA salary
        hobbies: starterAssets.hobbies.reduce((s: number, h: any) => s + (h.currentMonthlyCost || Math.round(h.annualCost / 12) || 0), 0),
        philanthropy: 0,
        insurance: 0,
        services: 0,
        dietPlan: 0,
        petUpkeep: starterAssets.pets.reduce((s, p) => s + p.monthlyUpkeep, 0),
        vehicleCosts: starterAssets.vehicles.reduce((s: number, v: any) => s + (v.monthlyMaintenanceCost || 0) + (v.monthlyInsuranceCost || 0), 0),
        membershipFees: 0,
        rent: starterAssets.properties.filter(p => p.isPlayerRental).reduce((s, p) => s + (p.monthlyRent || 0), 0),
        other: 0
      },
      
      // Credit profile
      creditScore: 750,
      creditHistory: [],
      
      // Tax information
      taxResidency: 'United States',
      lastTaxYear: currentYear - 1,
      taxesPaidThisYear: 0,
      taxDeductionsThisYear: 0,
      
      // Loans and mortgages
      personalLoans: [],
      mortgages: starterAssets.mortgages as any[],
      personalGuarantees: [],
      
      // Transaction history
      transactions: []
    },
    teamEquity: {
      ownershipPercent: 100,
      sharesOwned: 1000,
      totalShares: 1000,
      totalInvested: equityValue,
      investmentHistory: [],
      currentValuation: equityValue,
      lastValuationDate: { week: currentWeek, year: currentYear },
      valuationMethod: 'revenue_multiple',
      unrealizedGain: 0,
      totalDividendsReceived: 0,
      externalInvestors: [],
      dividendPolicy: {
        enabled: false,
        frequency: 'annually',
        percentOfProfit: 0,
        minimumCashReserve: 500000
      }
    },
    // Family - start single with no children
    partner: undefined,
    children: [],
    familyTree: undefined,
    // Lifestyle
    health: {
      physicalHealth: 75,
      fitness: 60,
      mentalHealth: 70,
      stressLevel: 40,
      burnoutRisk: 20,
      age: player.age,
      lifeExpectancy: 82,
      activeConditions: [],
      healthcareLevel: 'premium',
      annualHealthcareCost: 25000,
      lastCheckupWeek: 1,
      lastCheckupYear: 2024
    },
    lifestyleAssets: defaultLifestyleAssets,
    hobbies: starterAssets.hobbies,
    staff: [
      // Julia Green — the player's PA from day one ($55K salary)
      {
        id: 'pa_julia_green',
        role: 'personal_assistant' as any,
        name: 'Julia Green',
        yearsEmployed: 0,
        salary: Math.floor(55000 / 12),   // ~$4,583/mo
        annualSalary: 55000,
        competence: 80,
        loyalty: 85,
        satisfaction: 90,
        benefits: { timeFreedPerWeek: 10, stressReduction: 5 } as any,
        totalRaisesThisYear: 0,
        weeksAtLowSatisfaction: 0,
        hasGivenNotice: false,
        canProvideReferral: false,
        referralsProvided: 0,
      },
    ],
    // Social
    brand: {
      brandValue: 25,
      publicImage: 35,
      mediaPresence: 20,
      endorsements: [],
      mediaDeals: [],
      speakingFee: 2500,
      annualAppearances: 0,
      reputationEvents: [],
      privacyLevel: 'balanced',
      socialMediaFollowing: 10000
    },
    contacts: [],
    rivalries: [],
    scandals: [],
    foundations: [],
    upcomingEvents: [],
    socialLog: [],
    stockHoldings: [],
    businessVentures: [],
    properties: starterAssets.properties as any[]
  }

  // Compute initial lifestyle score and level from actual starter assets
  const primaryResidenceValue = (starterAssets.properties || [])
    .filter((p: any) => !p.isPlayerRental)
    .reduce((max: number, p: any) => Math.max(max, p.currentValue || p.purchasePrice || 0), 0)
  const collectionsValue = (starterAssets.collectibles || [])
    .reduce((sum: number, c: any) => sum + (c.currentValue || c.purchasePrice || 0), 0)
  const initialScore = calculateLifestyleScore(
    primaryResidenceValue,
    defaultLifestyleAssets,
    collectionsValue,
    state.staff,
    state.hobbies
  )
  state.lifestyleLevel = initialScore.level
  state.lifestyleScore = initialScore

  return state
}

// Hook to get personal life state with defaults
export function usePersonalLifeState() {
  const { player, careerState, updateCareerState } = useCareerStore()

  const ownedTeam = careerState?.ownedTeam

  // Check if we need to initialize personal life state
  const needsInitialization = player && careerState && !careerState.personalLife

  const personalLifeState = useMemo(() => {
    if (!player || !careerState) return null
    
    // If we have existing personal life state, use it
    if (careerState.personalLife) {
      return careerState.personalLife
    }
    
    // Create a default state for team owners
    // Use budgets.balance as team value if available, otherwise fall back
    const teamValue = ownedTeam?.budgets?.cash || ownedTeam?.finances?.teamValue || 2400000
    const bgId = (player as any)?.background?.type || (player as any)?.background?.id
    return createDefaultPersonalLifeState(player, teamValue, careerState.currentYear, careerState.currentWeek, bgId)
  }, [careerState?.personalLife, ownedTeam, player, careerState?.currentYear, careerState?.currentWeek])

  // Initialize personal life in the store if it doesn't exist
  useEffect(() => {
    if (needsInitialization && personalLifeState) {
      console.log('[PersonalLife] Initializing personal life state in store')
      updateCareerState({ personalLife: personalLifeState })
    }
  }, [needsInitialization, personalLifeState, updateCareerState])

  return {
    player,
    careerState,
    ownedTeam,
    personalLifeState,
    teamName: ownedTeam?.name || 'My Team'
  }
}
