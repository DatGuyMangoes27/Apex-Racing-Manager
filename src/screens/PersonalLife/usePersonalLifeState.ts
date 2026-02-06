import { useMemo, useEffect } from 'react'
import { useCareerStore } from '@/store/careerStore'
import type { PersonalLifeState } from '@/components/personal'
import { createDefaultLifestyleAssets } from '@/data/lifestyle-assets-config'

// Create a default personal life state for team owners
export function createDefaultPersonalLifeState(
  player: { firstName: string; lastName: string; age: number }, 
  teamValue: number,
  currentYear: number,
  currentWeek: number
): PersonalLifeState {
  const liquidCash = 500000
  const equityValue = teamValue || 5000000
  const cachedNetWorth = liquidCash + equityValue // No debt initially
  
  return {
    finances: {
      // Core wealth
      liquidCash,
      cachedNetWorth,
      lastNetWorthUpdate: currentWeek,
      
      // Monthly income breakdown
      monthlyIncome: {
        ownerSalary: 15000,      // Owner salary from team
        dividends: 0,            // No dividends initially
        rentalIncome: 0,         // No properties initially
        investmentIncome: 0,     // No investments initially
        endorsements: 0,         // No endorsements initially
        speakingFees: 0,         // No speaking gigs initially
        other: 0
      },
      
      // Monthly expenses breakdown
      monthlyExpenses: {
        lifestyle: 8000,         // Comfortable lifestyle costs
        mortgagePayments: 0,     // No mortgages initially
        loanPayments: 0,         // No loans initially
        familyExpenses: 0,       // No family initially
        personalStaff: 0,        // No staff initially
        hobbies: 0,              // No hobbies initially
        philanthropy: 0,         // No foundations initially
        insurance: 2000,         // Basic insurance
        other: 1000
      },
      
      // Credit profile
      creditScore: 750,
      creditHistory: [],
      
      // Tax information
      taxResidency: 'United States',
      lastTaxYear: currentYear - 1,
      taxesPaidThisYear: 0,
      taxDeductionsThisYear: 0,
      
      // Loans and mortgages (empty initially)
      personalLoans: [],
      mortgages: [],
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
    lifestyleLevel: 'comfortable',  // Legacy field - now calculated from assets
    lifestyleAssets: createDefaultLifestyleAssets(),  // Vehicles, furnishings, memberships
    hobbies: [],
    staff: [],
    // Social
    brand: {
      brandValue: 25,               // 0-100 brand recognition/value score
      publicImage: 35,              // 0-100 public perception (starts modest)
      mediaPresence: 20,            // 0-100 media visibility (low for new owner)
      endorsements: [],
      mediaDeals: [],
      speakingFee: 2500,            // Lower starting speaking fee
      annualAppearances: 0,
      reputationEvents: [],
      privacyLevel: 'balanced',
      socialMediaFollowing: 10000   // Modest starting followers
    },
    contacts: [],
    rivalries: [],
    scandals: [],
    foundations: [],
    upcomingEvents: [],
    socialLog: []
  }
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
    return createDefaultPersonalLifeState(player, teamValue, careerState.currentYear, careerState.currentWeek)
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
