// ============================================
// PERSONAL LIFE ACTIONS HOOK
// ============================================
// Centralized hook for all personal life gameplay actions

import { useCallback, useEffect, useRef } from 'react'
import { useCareerStore } from '@/store/careerStore'
import { getActivityTimeCost, requiresOwnerTime } from '@/data/activity-time-costs'
import { canDoActivityInCurrentPeriod } from '@/data/day-periods-config'
import { routeNotification } from '@/services/notificationRouter'
import type { PersonalLifeState } from '@/components/personal'
import { createDefaultPersonalLifeState } from '@/screens/PersonalLife/usePersonalLifeState'
import type { PersonalTransactionType, PersonalTransactionCategory, ExternalInvestor } from '@/data/personal-finance-config'
import type { LifestyleLevel, StaffRole, HobbyType } from '@/data/lifestyle-config'
import type { CharityCause, Scandal, SocialEvent, SocialEventType } from '@/data/social-events-config'
import { SCANDAL_RESPONSES, SOCIAL_EVENT_TEMPLATES } from '@/data/social-events-config'
import type { DateType, RelationshipStatus, Child } from '@/data/family-config'
import { LIFESTYLE_TIERS } from '@/data/lifestyle-config'
import { HOBBY_TEMPLATES, STAFF_TEMPLATES } from '@/data/lifestyle-config'
import { DATE_OPTIONS } from '@/data/family-config'
import { 
  generateChild, 
  addChildToFamilyTree,
  createFamilyTree 
} from '@/simulation/personal/familyManager'
import {
  canHaveChild,
  createPregnancyState,
  advancePregnancy,
  isReadyToBirth,
  syncPartnerMetersToContact,
  canPromoteToPartner,
  canProposeToPartner,
  type PregnancyState
} from '@/services/familyBridgeService'
import { hostCharityGala, resolveRivalry } from '@/simulation/personal/socialEventsManager'
import type { Partner } from '@/data/family-config'
import { addReputationEvent, addEndorsement, addMediaDeal, interactWithContact, askContactForFavor, canAffordLifestyle, getLifestyleRecommendation, calculateMonthlyCosts, giveStaffRaise, giveStaffBonus, requestStaffReferral } from '@/simulation/personal/lifestyleManager'
import {
  generateId,
  createTransaction,
  calculateProposalAcceptance,
  getDateHappinessBonus,
  getGiftHappinessBonus,
  generateEndorsementOffer,
  createFoundation,
  createHobby,
  createStaffMember,
  initializeChildRacing,
  clamp,
  getLifestyleMonthlyCost
} from '@/utils/personalLifeHelpers'
import {
  purchaseVehicle as purchaseVehicleManager,
  sellVehicle as sellVehicleManager,
  purchaseFurnishing as purchaseFurnishingManager,
  sellFurnishing as sellFurnishingManager,
  joinMembership as joinMembershipManager,
  cancelMembership as cancelMembershipManager,
  subscribeService as subscribeServiceManager,
  cancelService as cancelServiceManager,
  bookExperience as bookExperienceManager,
  purchaseCollectible as purchaseCollectibleManager,
  sellCollectible as sellCollectibleManager,
  adoptPet as adoptPetManager,
  rehomePet as rehomePetManager,
  purchaseWardrobeItem as purchaseWardrobeManager,
  sellWardrobeItem as sellWardrobeManager,
  subscribeDiet as subscribeDietManager,
  cancelDiet as cancelDietManager,
  calculateLifestyleScore,
  getVehicleCatalog,
  getMembershipCatalog,
  getFurnishingCatalog,
  getServiceCatalog,
  getExperienceCatalog,
  getCollectibleCatalog,
  getPetCatalog,
  getWardrobeCatalog,
  getDietCatalog,
  setPrimaryVehicle,
  canAffordAsset,
  type PurchaseResult,
  type SaleResult
} from '@/simulation/personal/lifestyleAssetsManager'
import { createDefaultLifestyleAssets, type LifestyleScoreBreakdown, type FurnishingTier } from '@/data/lifestyle-assets-config'
import { purchaseProperty as purchasePropertyManager, sellProperty as sellPropertyManager, generatePropertyListings } from '@/simulation/investments/realEstateManager'
import { buyStock as buyStockManager, sellStock as sellStockManager, startBusiness as startBusinessManager } from '@/simulation/investments/portfolioManager'
import { STOCKS } from '@/data/investment-config'
import type { BusinessType } from '@/data/investment-config'
import { COURSE_CATALOG, type Course } from '@/data/education-config'
import { getSocialActionById } from '@/data/social-actions-config'
import { 
  getHobbyActivity, 
  getPetActivity, 
  getEducationActivity, 
  FITNESS_ACTIVITIES,
  type LifestyleActivityTemplate
} from '@/data/lifestyle-activities-config'

interface InvestorOffer {
  id: string
  investorName: string
  investorType: 'private_equity' | 'angel' | 'corporate' | 'consortium'
  amount: number
  equityPercent: number
  terms: string
}

interface UsePersonalLifeActionsResult {
  // Finance Actions
  injectCapital: (amount: number) => { success: boolean; message: string }
  withdrawFunds: (amount: number) => { success: boolean; message: string }
  setOwnerSalary: (monthlySalary: number) => { success: boolean; message: string }
  seekInvestors: () => { success: boolean; message: string; offer?: InvestorOffer }
  acceptInvestorOffer: (offer: InvestorOffer) => { success: boolean; message: string }
  
  // Family Actions - Partner
  planDate: (dateType: DateType) => { success: boolean; message: string; happinessGain?: number }
  proposeToPartner: () => { success: boolean; message: string; accepted?: boolean }
  planWedding: (budget: number) => { success: boolean; message: string }
  giveGift: (giftType: string, cost: number) => { success: boolean; message: string; happinessGain?: number }
  exploreDatingScene: () => { success: boolean; message: string }
  
  // Family Actions - Children
  spendTimeWithChild: (childId: string) => { success: boolean; message: string; bondGain?: number }
  startChildRacing: (childId: string) => { success: boolean; message: string }
  announcePregnancy: () => { success: boolean; message: string; pregnancy?: PregnancyState }
  haveChild: (childFirstName?: string) => { success: boolean; message: string; child?: Child }
  getPregnancyStatus: () => PregnancyState | null
  
  // Lifestyle Actions
  upgradeHealthcare: (level: 'basic' | 'standard' | 'premium' | 'executive') => { success: boolean; message: string }
  treatHealthCondition: (conditionId: string) => { success: boolean; message: string }
  startHobby: (hobbyType: string) => { success: boolean; message: string }
  practiceHobby: (hobbyType: string) => { success: boolean; message: string; skillGain?: number }
  quitHobby: (hobbyType: string) => { success: boolean; message: string; refund?: number }
  hireStaff: (role: StaffRole) => { success: boolean; message: string }
  fireStaff: (staffId: string) => { success: boolean; message: string }
  giveStaffRaise: (staffId: string, percentIncrease: number) => { success: boolean; message: string }
  giveStaffBonus: (staffId: string, amount: number) => { success: boolean; message: string }
  requestStaffReferral: (staffId: string, roleNeeded: StaffRole) => { success: boolean; message: string; candidate?: { name: string; competence: number } }
  upgradeLifestyle: () => { success: boolean; message: string; newLevel?: LifestyleLevel }
  
  // Lifestyle Asset Actions
  buyVehicle: (vehicleCatalogIndex: number) => PurchaseResult
  sellOwnedVehicle: (vehicleId: string) => SaleResult
  setAsPrimaryVehicle: (vehicleId: string) => { success: boolean; message: string }
  buyFurnishing: (furnishingId: string, propertyId: string) => PurchaseResult
  sellOwnedFurnishing: (furnishingId: string) => SaleResult
  joinClubMembership: (membershipId: string, tier: 'standard' | 'gold' | 'platinum' | 'founding') => PurchaseResult
  cancelClubMembership: (membershipId: string) => SaleResult
  
  // New Asset Actions
  subscribeToService: (catalogId: string, tier: 'standard' | 'premium' | 'elite') => PurchaseResult
  cancelServiceSubscription: (serviceId: string) => SaleResult
  bookLuxuryExperience: (catalogId: string) => PurchaseResult
  buyCollectible: (catalogId: string) => PurchaseResult
  sellOwnedCollectible: (collectibleId: string) => SaleResult
  adoptNewPet: (catalogId: string, petName: string) => PurchaseResult
  rehomeOwnedPet: (petId: string) => SaleResult
  buyWardrobeItem: (catalogId: string) => PurchaseResult
  sellOwnedWardrobeItem: (itemId: string) => SaleResult
  subscribeToDiet: (catalogId: string) => PurchaseResult
  cancelDietPlan: () => SaleResult
  buyProperty: (listingIndex: number, options?: { paymentMethod: 'cash' | 'mortgage' | 'rent'; downPaymentPercent?: number; mortgageTermYears?: number }) => PurchaseResult
  sellOwnedProperty: (propertyId: string) => SaleResult
  buyStock: (symbol: string, shares: number) => { success: boolean; message: string }
  sellStock: (symbol: string, sharesToSell: number) => { success: boolean; message: string }
  startPersonalBusiness: (type: BusinessType, name: string, investmentAmount: number, ownershipPercent: number, location: string) => { success: boolean; message: string }
  enrollInCourse: (catalogIndex: number) => PurchaseResult
  
  // Time-Consuming Lifestyle Activities
  spendTimeWithPet: (petId: string) => { success: boolean; message: string }
  studyCourse: (courseId: string) => { success: boolean; message: string }
  doWorkout: (fitnessActivityId: string) => { success: boolean; message: string }
  getAvailableFitnessActivities: () => LifestyleActivityTemplate[]
  getHobbyActivityInfo: (hobbyType: string, hobbyName: string) => LifestyleActivityTemplate
  getPetActivityInfo: (petType: string, petName: string) => LifestyleActivityTemplate
  
  // Catalogs
  getAvailableVehicles: () => ReturnType<typeof getVehicleCatalog>
  getAvailableMemberships: () => ReturnType<typeof getMembershipCatalog>
  getAvailableFurnishings: () => ReturnType<typeof getFurnishingCatalog>
  getAvailableServices: () => ReturnType<typeof getServiceCatalog>
  getAvailableExperiences: () => ReturnType<typeof getExperienceCatalog>
  getAvailableCollectibles: () => ReturnType<typeof getCollectibleCatalog>
  getAvailablePets: () => ReturnType<typeof getPetCatalog>
  getAvailableWardrobe: () => ReturnType<typeof getWardrobeCatalog>
  getAvailableDiets: () => ReturnType<typeof getDietCatalog>
  getPropertyListings: () => any[]
  getCourseCatalog: () => typeof COURSE_CATALOG
  getLifestyleScoreBreakdown: () => LifestyleScoreBreakdown | null
  
  // Social Actions
  seekEndorsements: () => { success: boolean; message: string; offer?: { brand: string; value: number } }
  acceptEndorsement: (endorsementId: string) => { success: boolean; message: string }
  startFoundation: (name: string, cause: CharityCause, initialDonation: number) => { success: boolean; message: string }
  donateToFoundation: (foundationId: string, amount: number) => { success: boolean; message: string }
  planGala: (foundationId: string, budget: number) => { success: boolean; message: string }
  respondToScandal: (scandalId: string, responseType: 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin') => { success: boolean; message: string }
  scheduleEvent: (eventType: string, eventWeek: number, options?: { tier?: 'standard' | 'vip' | 'vip_table'; invitedContactIds?: string[] }) => { success: boolean; message: string }
  dismissEvent: (eventId: string) => { success: boolean; message: string }
  changePrivacyLevel: (newLevel: 'open_book' | 'balanced' | 'private' | 'reclusive') => { success: boolean; message: string }
  interactWithContactAction: (contactId: string, quality: 'poor' | 'neutral' | 'good' | 'excellent') => { success: boolean; message: string }
  askContactForFavorAction: (contactId: string, favorType: string) => { success: boolean; message: string; benefitValue?: number }
  
  // Contact Social Actions (gifts, hangouts, dates, invitations, business)
  executeSocialAction: (contactId: string, actionId: string) => { success: boolean; message: string }
  scheduleSocialAction: (contactId: string, actionId: string, week: number, day: number) => { success: boolean; message: string }
  
  // Period validation (for UI to check before showing actions)
  checkActivityPeriod: (activityId: string) => { allowed: boolean; reason?: string }
}

export function usePersonalLifeActions(): UsePersonalLifeActionsResult {
  const { careerState, updateCareerState, updateOwnedTeam, player, consumeHoursFromBudget, addPersonalCalendarEntry, canAffordTime, scheduleSocialAction: storeScheduleSocialAction } = useCareerStore()
  
  const currentWeek = careerState?.currentWeek ?? 1
  const currentDay = careerState?.currentDay ?? 1
  const currentYear = careerState?.currentYear ?? 2024
  
  // Auto-initialize personal life state in an effect (not during render)
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!careerState?.personalLife && player && careerState && !hasInitialized.current) {
      hasInitialized.current = true
      const ownedTeam = careerState.ownedTeam
      const teamValue = ownedTeam?.budgets?.cash || ownedTeam?.finances?.teamValue || 2400000
      const bgId = (player as any).background?.type || (player as any).background?.id
      const defaultState = createDefaultPersonalLifeState(player, teamValue, currentYear, currentWeek, bgId)
      console.log('[PersonalLifeActions] Auto-initializing personal life state')
      updateCareerState({ personalLife: defaultState })
    }
  }, [careerState, player, currentYear, currentWeek, updateCareerState])
  
  // Read-only helper to get personal life state (never triggers setState)
  const getPersonalLife = useCallback((): PersonalLifeState | null => {
    if (careerState?.personalLife) {
      return careerState.personalLife
    }
    return null
  }, [careerState, player, currentYear, currentWeek, updateCareerState])
  
  // Helper to update personal life state
  const updatePersonalLife = useCallback((updates: Partial<PersonalLifeState>) => {
    const current = getPersonalLife()
    if (!current) return
    
    updateCareerState({
      personalLife: { ...current, ...updates }
    })
  }, [getPersonalLife, updateCareerState])
  
  // ============================================
  // PERIOD VALIDATION HELPER
  // ============================================
  // Checks if an activity can be performed at the current time of day.
  // Returns { allowed, reason } — if not allowed, reason explains when it's available.
  
  const checkActivityPeriod = useCallback((activityId: string): { allowed: boolean; reason?: string } => {
    const cost = getActivityTimeCost(activityId)
    const currentHour = careerState?.dayBudget?.currentHour ?? 7
    const result = canDoActivityInCurrentPeriod(cost.allowedPeriods, currentHour)
    return { allowed: result.allowed, reason: result.reason }
  }, [careerState?.dayBudget?.currentHour])
  
  /**
   * Sync family partner meters to the messaging contact
   * Call this after any family action that modifies partner happiness/love/trust
   */
  const syncPartnerToMessagingContact = useCallback((updatedPartner: Partner) => {
    if (!careerState?.messaging?.contacts) return
    
    // Find the partner contact in messaging
    const partnerContact = careerState.messaging.contacts.find(
      c => c.type === 'partner' || c.id === `partner_${updatedPartner.id}`
    )
    
    if (!partnerContact) return
    
    // Sync meters from partner to contact
    const syncedContact = syncPartnerMetersToContact(updatedPartner, partnerContact)
    
    // Update the contact in messaging
    const updatedContacts = careerState.messaging.contacts.map(c => 
      c.id === partnerContact.id ? syncedContact : c
    )
    
    updateCareerState({
      messaging: {
        ...careerState.messaging,
        contacts: updatedContacts
      }
    })
    
    console.log('[Sync] Synced family partner meters to messaging contact')
  }, [careerState?.messaging, updateCareerState])
  
  // ============================================
  // FINANCE ACTIONS
  // ============================================
  
  const injectCapital = useCallback((amount: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (amount <= 0) return { success: false, message: 'Amount must be positive' }
    if (amount > personalLife.finances.liquidCash) {
      return { success: false, message: 'Insufficient funds' }
    }
    
    // Deduct from personal funds
    const newLiquidCash = personalLife.finances.liquidCash - amount
    
    // Add transaction record
    const transaction = createTransaction(
      'expense',
      'business_investment',
      amount,
      'Capital injection to team',
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        liquidCash: newLiquidCash,
        cachedNetWorth: personalLife.finances.cachedNetWorth, // Net worth stays same (cash -> equity)
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Also update team budgets
    const ownedTeam = careerState?.ownedTeam
    if (ownedTeam?.budgets) {
      updateOwnedTeam({
        budgets: {
          ...ownedTeam.budgets,
          cash: ownedTeam.budgets.cash + amount
        }
      })
    }
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'finances',
      subject: `Capital Injection: $${amount.toLocaleString()}`,
      body: `You have injected $${amount.toLocaleString()} from personal funds into the team budget.`,
      emailCategory: 'team',
    })

    return { success: true, message: `Injected $${amount.toLocaleString()} into the team` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, careerState?.ownedTeam, updateOwnedTeam])
  
  const withdrawFunds = useCallback((amount: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (amount <= 0) return { success: false, message: 'Amount must be positive' }
    
    // Check if team has sufficient funds to withdraw
    const ownedTeam = careerState?.ownedTeam
    const teamBalance = ownedTeam?.budgets?.cash ?? 0
    
    if (amount > teamBalance) {
      return { success: false, message: `Team only has $${teamBalance.toLocaleString()} available` }
    }
    
    if (amount > teamBalance * 0.5) { // Can only withdraw up to 50% of team balance
      return { success: false, message: `Cannot withdraw more than 50% of team balance ($${Math.floor(teamBalance * 0.5).toLocaleString()})` }
    }
    
    // Add to personal funds
    const newLiquidCash = personalLife.finances.liquidCash + amount
    
    // Add transaction record
    const transaction = createTransaction(
      'income',
      'dividend',
      amount,
      'Owner withdrawal from team',
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        liquidCash: newLiquidCash,
        cachedNetWorth: personalLife.finances.cachedNetWorth, // Net worth stays same (equity -> cash)
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Also update team budgets
    if (ownedTeam?.budgets) {
      updateOwnedTeam({
        budgets: {
          ...ownedTeam.budgets,
          cash: ownedTeam.budgets.cash - amount
        }
      })
    }
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'finances',
      subject: `Owner Withdrawal: $${amount.toLocaleString()}`,
      body: `You have withdrawn $${amount.toLocaleString()} from the team budget to personal funds.`,
      emailCategory: 'team',
    })

    return { success: true, message: `Withdrew $${amount.toLocaleString()} from the team` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, careerState?.ownedTeam, updateOwnedTeam])
  
  const setOwnerSalary = useCallback((monthlySalary: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (monthlySalary < 0) return { success: false, message: 'Salary cannot be negative' }
    
    // Check if team can afford this salary (rough check: monthly salary vs team cash)
    const ownedTeam = careerState?.ownedTeam
    const teamCash = ownedTeam?.budgets?.cash ?? 0
    const weeksOfRunway = monthlySalary > 0 ? Math.floor(teamCash / (monthlySalary / 4)) : Infinity
    
    let warningMessage = ''
    if (weeksOfRunway < 12 && monthlySalary > 0) {
      warningMessage = ` Warning: team can only sustain this salary for ~${weeksOfRunway} weeks.`
    }
    
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        ownerSalaryConfigured: true, // Mark that the player explicitly set their salary
        monthlyIncome: {
          ...personalLife.finances.monthlyIncome,
          ownerSalary: Math.round(monthlySalary)
        }
      }
    })
    
    return { 
      success: true, 
      message: `Owner salary set to $${Math.round(monthlySalary).toLocaleString()}/month.${warningMessage}` 
    }
  }, [getPersonalLife, updatePersonalLife, careerState?.ownedTeam])
  
  const seekInvestors = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const investorTimeCost = getActivityTimeCost('seek_investors')
    if (investorTimeCost.hours > 0) {
      consumeHoursFromBudget(investorTimeCost.hours, investorTimeCost.drain, 'Seeking Investors', 'seek_investors')
    }
    addPersonalCalendarEntry({
      name: 'Investor Outreach',
      description: 'Meeting with potential investors for the team',
      activityId: 'seek_investors',
      week: currentWeek,
      day: currentDay,
      duration: investorTimeCost.hours,
      drainLevel: investorTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    
    // Random chance to find investors based on team performance and brand
    const brandValue = personalLife.brand?.publicImage ?? 50
    const successChance = brandValue / 150 // ~33% at 50 image, ~66% at 100
    
    if (Math.random() > successChance) {
      return { success: false, message: 'No investors interested at this time. Improve your public image to attract more interest.' }
    }
    
    // Generate investor profile
    const investorTypes: Array<InvestorOffer['investorType']> = ['private_equity', 'angel', 'corporate', 'consortium']
    const investorType = investorTypes[Math.floor(Math.random() * investorTypes.length)]
    
    const investorNames: Record<InvestorOffer['investorType'], string[]> = {
      private_equity: ['Velocity Capital Partners', 'Apex Racing Investments', 'Motorsport Equity Group'],
      angel: ['James Sterling', 'Marcus Chen', 'Victoria Webb'],
      corporate: ['Autotech Industries', 'Global Racing Solutions', 'Speedway Holdings'],
      consortium: ['Racing Legends Group', 'Motorsport Investment Alliance', 'Grid Partners']
    }
    
    const investorName = investorNames[investorType][Math.floor(Math.random() * investorNames[investorType].length)]
    
    // Generate an offer
    const teamValue = personalLife.teamEquity?.currentValuation ?? 2000000
    const investmentAmount = Math.floor(teamValue * (0.1 + Math.random() * 0.2)) // 10-30% of team value
    const equityPercent = Math.floor(investmentAmount / teamValue * 100 * 1.2) // 20% premium on equity
    
    const terms = investorType === 'private_equity' 
      ? 'Board seat required, 5-year commitment'
      : investorType === 'corporate'
      ? 'Branding partnership included'
      : investorType === 'consortium'
      ? 'Multiple investor group, quarterly reporting'
      : 'Silent partner, annual review'
    
    const offer: InvestorOffer = {
      id: generateId(),
      investorName,
      investorType,
      amount: investmentAmount,
      equityPercent: clamp(equityPercent, 5, 40),
      terms
    }
    
    return {
      success: true,
      message: `${investorName} is interested in your team!`,
      offer
    }
  }, [getPersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])
  
  const acceptInvestorOffer = useCallback((offer: InvestorOffer) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const ownedTeam = careerState?.ownedTeam
    if (!ownedTeam?.budgets || !personalLife.teamEquity) {
      return { success: false, message: 'Team ownership not properly initialized' }
    }
    
    const currentOwnership = personalLife.teamEquity.ownershipPercent
    if (currentOwnership - offer.equityPercent < 51) {
      return { success: false, message: 'Cannot sell more than 49% of your team - you must retain majority control' }
    }
    
    // Update team budgets with investment amount
    updateOwnedTeam({
      budgets: {
        ...ownedTeam.budgets,
        cash: ownedTeam.budgets.cash + offer.amount
      }
    })
    
    // Update personal life with new equity stake and investor
    const totalShares = personalLife.teamEquity.totalShares || 1000000
    const sharesOwned = Math.round(totalShares * (offer.equityPercent / 100))
    const newExternalInvestors: ExternalInvestor[] = [
      ...(personalLife.teamEquity.externalInvestors || []),
      {
        id: offer.id,
        name: offer.investorName,
        type: offer.investorType,
        ownershipPercent: offer.equityPercent,
        investmentAmount: offer.amount,
        sharesOwned: sharesOwned,
        investmentDate: { week: currentWeek, year: currentYear },
        terms: {
          minimumReturn: 10,
          exitHorizon: 5,
          liquidationPreference: 1,
          antiDilution: false,
          dragAlongRights: false,
          tagAlongRights: true,
          vetoRights: []
        },
        satisfaction: 75,
        boardSeat: offer.equityPercent >= 10,
        votingRights: true
      }
    ]
    
    updatePersonalLife({
      teamEquity: {
        ...personalLife.teamEquity,
        ownershipPercent: currentOwnership - offer.equityPercent,
        externalInvestors: newExternalInvestors,
        currentValuation: personalLife.teamEquity.currentValuation + offer.amount // Investment increases valuation
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const investorTimeCost = getActivityTimeCost('investor_meeting')
    if (investorTimeCost.hours > 0) {
      consumeHoursFromBudget(investorTimeCost.hours, investorTimeCost.drain, `Investor Meeting: ${offer.investorName}`, 'investor_meeting')
    }
    addPersonalCalendarEntry({
      name: `Investor Meeting: ${offer.investorName}`,
      description: `Signed investment deal with ${offer.investorName} for $${offer.amount.toLocaleString()} (${offer.equityPercent}% equity)`,
      activityId: 'investor_meeting',
      week: currentWeek,
      day: currentDay,
      duration: investorTimeCost.hours,
      drainLevel: investorTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    routeNotification({
      category: 'finances',
      subject: `Investment Deal Closed: ${offer.investorName}`,
      body: `You've accepted a $${offer.amount.toLocaleString()} investment from ${offer.investorName} in exchange for ${offer.equityPercent}% equity. Your ownership is now ${(currentOwnership - offer.equityPercent)}%.`,
      emailCategory: 'team',
    })

    return {
      success: true,
      message: `Accepted $${offer.amount.toLocaleString()} investment from ${offer.investorName} for ${offer.equityPercent}% equity`
    }
  }, [getPersonalLife, updatePersonalLife, careerState?.ownedTeam, updateOwnedTeam, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  // ============================================
  // FAMILY ACTIONS - PARTNER
  // ============================================
  
  const planDate = useCallback((dateType: DateType) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner first!' }
    }
    
    // Check time-of-day period restriction
    const periodCheck = checkActivityPeriod(`date_${dateType}`)
    if (!periodCheck.allowed) {
      return { success: false, message: periodCheck.reason || 'Not available at this time of day' }
    }
    
    // Find date cost from config
    const dateOption = DATE_OPTIONS.find(d => d.type === dateType)
    const cost = dateOption?.cost ?? 100
    
    if (personalLife.finances.liquidCash < cost) {
      return { success: false, message: 'Insufficient funds for this date' }
    }
    
    // Deduct cost and add happiness
    const happinessBonus = getDateHappinessBonus(dateType)
    const newPartner = {
      ...personalLife.partner,
      happiness: clamp(personalLife.partner.happiness + happinessBonus.happiness, 0, 100),
      loveLevel: clamp(personalLife.partner.loveLevel + happinessBonus.love, 0, 100)
    }
    
    // Add transaction
    const transaction = createTransaction(
      'expense',
      'entertainment',
      cost,
      `Date: ${dateType.replace(/_/g, ' ')}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      partner: newPartner,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - cost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Sync partner meters to messaging contact
    syncPartnerToMessagingContact(newPartner as Partner)
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const dateTimeCost = getActivityTimeCost(`date_${dateType}`) ?? getActivityTimeCost('date_casual')
    
    // Consume time from today's budget
    if (dateTimeCost.hours > 0) {
      consumeHoursFromBudget(dateTimeCost.hours, dateTimeCost.drain, `Date: ${dateType.replace(/_/g, ' ')}`, `date_${dateType}`)
    }
    
    // Add calendar entry (immediate - happening today)
    addPersonalCalendarEntry({
      name: `Date: ${dateType.replace(/_/g, ' ')}`,
      description: `A ${dateType.replace(/_/g, ' ')} with ${personalLife.partner ? `${personalLife.partner.firstName} ${personalLife.partner.lastName}` : 'your partner'}`,
      activityId: `date_${dateType}`,
      week: currentWeek,
      day: currentDay,
      duration: dateTimeCost.hours,
      drainLevel: dateTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'romance',
      immediate: true
    })
    
    // Send phone message from partner
    routeNotification({
      category: 'date_reminder',
      subject: 'Date night!',
      body: `Had an amazing time on our ${dateType.replace(/_/g, ' ')}! ❤️ We should do this more often.`,
    })
    
    return {
      success: true,
      message: `Had a wonderful ${dateType.replace(/_/g, ' ')}!`,
      happinessGain: happinessBonus.happiness
    }
  }, [getPersonalLife, updatePersonalLife, syncPartnerToMessagingContact, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const proposeToPartner = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner first!' }
    }
    
    // Validate proposal eligibility using canProposeToPartner
    const proposalCheck = canProposeToPartner(personalLife.partner)
    if (!proposalCheck.canPropose) {
      return { success: false, message: proposalCheck.reason || 'Cannot propose right now' }
    }
    
    // Cost of engagement ring
    const ringCost = 50000
    if (personalLife.finances.liquidCash < ringCost) {
      return { success: false, message: 'Cannot afford engagement ring' }
    }
    
    // Calculate acceptance based on love level
    const accepted = calculateProposalAcceptance(personalLife.partner.loveLevel)
    
    // Add transaction for the ring
    const transaction = createTransaction(
      'expense',
      'family',
      ringCost,
      'Engagement ring',
      currentWeek,
      currentYear
    )
    
    if (accepted) {
      const newPartner = {
        ...personalLife.partner,
        relationshipStatus: 'engaged' as RelationshipStatus,
        engagementDate: { week: currentWeek, year: currentYear },
        happiness: clamp(personalLife.partner.happiness + 25, 0, 100),
        loveLevel: clamp(personalLife.partner.loveLevel + 15, 0, 100)
      }
      
      updatePersonalLife({
        partner: newPartner,
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - ringCost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
      
      // Sync partner meters to messaging contact
      syncPartnerToMessagingContact(newPartner as Partner)
      
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const proposeTimeCost = getActivityTimeCost('propose')
      if (proposeTimeCost.hours > 0) {
        consumeHoursFromBudget(proposeTimeCost.hours, proposeTimeCost.drain, 'Proposal', 'propose')
      }
      addPersonalCalendarEntry({
        name: 'Proposal',
        description: `Proposed to ${personalLife.partner.firstName} - They said yes!`,
        activityId: 'propose',
        week: currentWeek,
        day: currentDay,
        duration: proposeTimeCost.hours,
        drainLevel: proposeTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'romance',
        immediate: true
      })
      routeNotification({
        category: 'partner',
        subject: 'Engagement!',
        body: `Congratulations! You proposed to ${personalLife.partner.firstName} and they said yes! Time to start planning the next chapter.`,
      })
      
      return { success: true, message: 'They said yes! Congratulations!', accepted: true }
    } else {
      // Proposal rejected, but still costs money
      updatePersonalLife({
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - ringCost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
      
      // Still takes time even if rejected
      const proposeTimeCost = getActivityTimeCost('propose')
      if (proposeTimeCost.hours > 0) {
        consumeHoursFromBudget(proposeTimeCost.hours, proposeTimeCost.drain, 'Proposal', 'propose')
      }
      addPersonalCalendarEntry({
        name: 'Proposal',
        description: 'Proposed to partner - declined',
        activityId: 'propose',
        week: currentWeek,
        day: currentDay,
        duration: proposeTimeCost.hours,
        drainLevel: proposeTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'romance',
        immediate: true
      })
      
      return { success: true, message: 'They said no... Maybe try again later.', accepted: false }
    }
  }, [getPersonalLife, updatePersonalLife, syncPartnerToMessagingContact, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const planWedding = useCallback((budget: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner first!' }
    }
    
    if (personalLife.partner.relationshipStatus !== 'engaged') {
      return { success: false, message: 'You need to be engaged first!' }
    }
    
    if (personalLife.finances.liquidCash < budget) {
      return { success: false, message: 'Insufficient funds for wedding' }
    }
    
    // Wedding happens!
    const newPartner = {
      ...personalLife.partner,
      relationshipStatus: 'married' as RelationshipStatus,
      marriageDate: { week: currentWeek, year: currentYear },
      happiness: 100, // Max happiness on wedding day
      loveLevel: clamp(personalLife.partner.loveLevel + 20, 0, 100)
    }
    
    // Add transaction
    const transaction = createTransaction(
      'expense',
      'family',
      budget,
      'Wedding expenses',
      currentWeek,
      currentYear
    )
    
    // Wedding boosts public image (gradual via reputation event)
    const newBrand = addReputationEvent(personalLife.brand, {
      type: 'positive',
      category: 'personal',
      description: 'Your wedding was a beautiful celebration, boosting your public image',
      impact: 10,
      date: { week: currentWeek, year: currentYear },
      decayWeeks: 12
    })
    
    updatePersonalLife({
      partner: newPartner,
      brand: newBrand,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - budget,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Sync partner meters to messaging contact
    syncPartnerToMessagingContact(newPartner as Partner)
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const weddingTimeCost = getActivityTimeCost('wedding_day')
    
    if (weddingTimeCost.hours > 0) {
      consumeHoursFromBudget(weddingTimeCost.hours, weddingTimeCost.drain, 'Wedding Day', 'wedding_day')
    }
    
    addPersonalCalendarEntry({
      name: 'Wedding Day',
      description: `Married ${personalLife.partner ? `${personalLife.partner.firstName} ${personalLife.partner.lastName}` : 'your partner'}!`,
      activityId: 'wedding_day',
      week: currentWeek,
      day: currentDay,
      duration: weddingTimeCost.hours,
      drainLevel: weddingTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'family',
      immediate: true
    })
    
    // Send notification via PR manager (media event)
    routeNotification({
      category: 'media_pr',
      subject: 'Wedding Announcement',
      body: `Congratulations on your wedding! The media has been informed and the announcement has been well received by fans and sponsors alike.`,
    })
    
    return { success: true, message: 'Congratulations on your wedding!' }
  }, [getPersonalLife, updatePersonalLife, syncPartnerToMessagingContact, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const giveGift = useCallback((giftType: string, cost: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner first!' }
    }
    
    if (personalLife.finances.liquidCash < cost) {
      return { success: false, message: 'Insufficient funds for gift' }
    }
    
    const happinessGain = getGiftHappinessBonus(giftType)
    
    const newPartner = {
      ...personalLife.partner,
      happiness: clamp(personalLife.partner.happiness + happinessGain, 0, 100)
    }
    
    const transaction = createTransaction(
      'expense',
      'family',
      cost,
      `Gift: ${giftType}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      partner: newPartner,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - cost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Sync partner meters to messaging contact
    syncPartnerToMessagingContact(newPartner as Partner)
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const giftTimeCost = getActivityTimeCost('gift_shopping')
    if (giftTimeCost.hours > 0) {
      consumeHoursFromBudget(giftTimeCost.hours, giftTimeCost.drain, `Gift Shopping: ${giftType}`, 'gift_shopping')
    }
    addPersonalCalendarEntry({
      name: `Gift: ${giftType}`,
      description: `Bought a ${giftType} for your partner`,
      activityId: 'gift_shopping',
      week: currentWeek,
      day: currentDay,
      duration: giftTimeCost.hours,
      drainLevel: giftTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'romance',
      immediate: true
    })
    routeNotification({
      category: 'partner',
      subject: 'Gift Well Received!',
      body: `Your partner loved the ${giftType}! Their happiness increased by ${happinessGain}.`,
    })
    
    return {
      success: true,
      message: `Your partner loved the ${giftType}!`,
      happinessGain
    }
  }, [getPersonalLife, updatePersonalLife, syncPartnerToMessagingContact, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const exploreDatingScene = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Check time-of-day period restriction
    const periodCheck = checkActivityPeriod('dating_scene')
    if (!periodCheck.allowed) {
      return { success: false, message: periodCheck.reason || 'Not available at this time of day' }
    }
    
    if (personalLife.partner) {
      return { success: false, message: 'You already have a partner!' }
    }
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const datingTimeCost = getActivityTimeCost('dating_scene')
    if (datingTimeCost.hours > 0) {
      consumeHoursFromBudget(datingTimeCost.hours, datingTimeCost.drain, 'Exploring Dating Scene', 'dating_scene')
    }
    addPersonalCalendarEntry({
      name: 'Dating Scene',
      description: 'Spent time socializing and meeting potential partners',
      activityId: 'dating_scene',
      week: currentWeek,
      day: currentDay,
      duration: datingTimeCost.hours,
      drainLevel: datingTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'romance',
      immediate: true
    })
    
    // This would trigger a dating scene/event
    // For now, we just mark that the player is looking
    return {
      success: true,
      message: 'You\'re now looking for potential partners. Keep an eye out at social events!'
    }
  }, [getPersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])
  
  // ============================================
  // FAMILY ACTIONS - CHILDREN
  // ============================================
  
  const spendTimeWithChild = useCallback((childId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const childIndex = personalLife.children.findIndex(c => c.id === childId)
    if (childIndex === -1) {
      return { success: false, message: 'Child not found' }
    }
    
    const child = personalLife.children[childIndex]
    const bondGain = 5 + Math.floor(Math.random() * 5) // 5-10 bond gain
    
    const updatedChild = {
      ...child,
      bondLevel: clamp(child.bondLevel + bondGain, 0, 100),
      happiness: clamp(child.happiness + 3, 0, 100),
      recentInteractions: [
        ...child.recentInteractions,
        {
          type: 'quality_time' as const,
          description: 'Spent quality time together',
          date: { week: currentWeek, year: currentYear },
          bondImpact: bondGain,
          happinessImpact: 3
        }
      ].slice(-10) // Keep last 10 interactions
    }
    
    const newChildren = [...personalLife.children]
    newChildren[childIndex] = updatedChild
    
    updatePersonalLife({ children: newChildren })
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const childTimeCost = getActivityTimeCost('quality_time_child')
    
    if (childTimeCost.hours > 0) {
      consumeHoursFromBudget(childTimeCost.hours, childTimeCost.drain, `Quality time with ${child.firstName}`, 'quality_time_child')
    }
    
    addPersonalCalendarEntry({
      name: `Quality Time: ${child.firstName}`,
      description: `Spent quality time with ${child.firstName}`,
      activityId: 'quality_time_child',
      week: currentWeek,
      day: currentDay,
      duration: childTimeCost.hours,
      drainLevel: childTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'family',
      immediate: true
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'family',
      subject: `Family Time with ${child.firstName}`,
      body: `You spent quality time with ${child.firstName}. Bond strengthened by ${bondGain} points!`,
    })

    return {
      success: true,
      message: `Had a great time with ${child.firstName}!`,
      bondGain
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const startChildRacing = useCallback((childId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const childIndex = personalLife.children.findIndex(c => c.id === childId)
    if (childIndex === -1) {
      return { success: false, message: 'Child not found' }
    }
    
    const child = personalLife.children[childIndex]
    
    if (child.age < 6) {
      return { success: false, message: 'Child must be at least 6 years old to start karting' }
    }
    
    if (child.racingDevelopment?.isActive) {
      return { success: false, message: 'Child is already in a racing program' }
    }
    
    // Initialize racing development
    const updatedChild = initializeChildRacing(child)
    
    // Initial kart investment cost
    const kartCost = 15000
    if (personalLife.finances.liquidCash < kartCost) {
      return { success: false, message: 'Insufficient funds for karting equipment' }
    }
    
    const transaction = createTransaction(
      'expense',
      'family',
      kartCost,
      `Karting equipment for ${child.firstName}`,
      currentWeek,
      currentYear
    )
    
    const newChildren = [...personalLife.children]
    newChildren[childIndex] = updatedChild
    
    updatePersonalLife({
      children: newChildren,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - kartCost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const kartTimeCost = getActivityTimeCost('child_racing_session')
    if (kartTimeCost.hours > 0) {
      consumeHoursFromBudget(kartTimeCost.hours, kartTimeCost.drain, `Kart Setup: ${child.firstName}`, 'child_racing_session')
    }
    addPersonalCalendarEntry({
      name: `Kart Setup: ${child.firstName}`,
      description: `Started ${child.firstName}'s karting journey - equipment setup and registration`,
      activityId: 'child_racing_session',
      week: currentWeek,
      day: currentDay,
      duration: kartTimeCost.hours,
      drainLevel: kartTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'family',
      immediate: true
    })
    routeNotification({
      category: 'family',
      subject: `${child.firstName} Starts Karting!`,
      body: `${child.firstName} has officially started their karting journey! Equipment has been purchased and registration is complete.`,
    })
    
    return {
      success: true,
      message: `${child.firstName} has started their karting journey!`
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  /**
   * Start trying for a child / announce pregnancy
   */
  const announcePregnancy = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner to have children' }
    }
    
    // Check if can have child using bridge service
    const existingPregnancy = personalLife.pregnancy as PregnancyState | undefined
    const validation = canHaveChild(
      personalLife.partner,
      personalLife.children,
      existingPregnancy
    )
    
    if (!validation.canHaveChild) {
      return { success: false, message: validation.reason || 'Cannot have children at this time' }
    }
    
    // Create pregnancy state
    const pregnancy = createPregnancyState(currentWeek, currentYear)
    
    // Update partner happiness - they're excited!
    const newPartner = {
      ...personalLife.partner,
      happiness: clamp(personalLife.partner.happiness + 15, 0, 100),
      loveLevel: clamp(personalLife.partner.loveLevel + 10, 0, 100)
    }
    
    updatePersonalLife({
      partner: newPartner,
      pregnancy
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'partner',
      subject: 'Wonderful News!',
      body: `You and your partner are expecting a baby! Due in about 36 weeks. Congratulations!`,
    })

    return {
      success: true,
      message: `Wonderful news! You're expecting a baby! Due in about 36 weeks.`,
      pregnancy
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  /**
   * Have a child - either from pregnancy or directly (for adoption/etc)
   */
  const haveChild = useCallback((childFirstName?: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (!personalLife.partner) {
      return { success: false, message: 'You need a partner to have children' }
    }
    
    const existingPregnancy = personalLife.pregnancy as PregnancyState | undefined
    
    // Check if we should use the pregnancy system or direct birth
    const isFromPregnancy = existingPregnancy?.isPregnant && isReadyToBirth(existingPregnancy)
    
    if (!isFromPregnancy) {
      // Direct child creation (adoption or instant birth for testing)
      const validation = canHaveChild(
        personalLife.partner,
        personalLife.children,
        existingPregnancy
      )
      
      if (!validation.canHaveChild) {
        return { success: false, message: validation.reason || 'Cannot have children at this time' }
      }
    }
    
    // Get player's last name
    const playerLastName = player?.lastName || careerState?.playerLastName || 'Player'
    
    // Generate the child using familyManager
    const newChild = generateChild(
      playerLastName,
      personalLife.partner,
      player?.traits || [],
      currentWeek,
      currentYear
    )
    
    // Override first name if provided
    if (childFirstName) {
      newChild.firstName = childFirstName
    }
    
    // If from pregnancy, use the known gender
    if (isFromPregnancy && existingPregnancy?.gender && existingPregnancy.gender !== 'unknown') {
      newChild.gender = existingPregnancy.gender
    }
    
    // Update partner's childrenIds
    const newPartner = {
      ...personalLife.partner,
      childrenIds: [...(personalLife.partner.childrenIds || []), newChild.id],
      happiness: clamp(personalLife.partner.happiness + 20, 0, 100)
    }
    
    // Create or get family tree
    let familyTree = personalLife.familyTree
    if (!familyTree) {
      const playerFirstName = player?.firstName || 'Player'
      familyTree = createFamilyTree(playerFirstName, playerLastName, currentWeek, currentYear)
    }
    
    // Add child to family tree
    const updatedFamilyTree = addChildToFamilyTree(familyTree, newChild)
    
    // Add transaction for hospital/birth expenses
    const birthCost = 10000 // Hospital costs, etc.
    const transaction = createTransaction(
      'expense',
      'family',
      birthCost,
      `Birth of ${newChild.firstName}`,
      currentWeek,
      currentYear
    )
    
    // Update state
    updatePersonalLife({
      partner: newPartner,
      children: [...personalLife.children, newChild],
      familyTree: updatedFamilyTree,
      pregnancy: undefined, // Clear pregnancy state
      finances: {
        ...personalLife.finances,
        liquidCash: Math.max(0, personalLife.finances.liquidCash - birthCost),
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // Boost public image for new baby (gradual via reputation event)
    if (personalLife.brand) {
      updatePersonalLife({
        brand: addReputationEvent(personalLife.brand, {
          type: 'positive',
          category: 'personal',
          description: 'Welcoming a new addition to the family!',
          impact: 5,
          date: { week: currentWeek, year: currentYear },
          decayWeeks: 8
        })
      })
    }
    
    console.log(`[Family] Welcome ${newChild.firstName} ${newChild.lastName} to the family!`)
    
    // === CALENDAR + NOTIFICATION INTEGRATION ===
    addPersonalCalendarEntry({
      name: `Welcome ${newChild.firstName}!`,
      description: `${newChild.firstName} ${newChild.lastName} was born!`,
      activityId: 'family_event',
      week: currentWeek,
      day: currentDay,
      duration: 0,
      drainLevel: 'exhausting',
      calendarEntryType: 'personal',
      category: 'family',
      immediate: true
    })
    routeNotification({
      category: 'partner',
      subject: `Welcome ${newChild.firstName}!`,
      body: `${newChild.firstName} has arrived! Wishing you and your growing family all the best.`,
    })
    routeNotification({
      category: 'media_pr',
      subject: `Family News: ${newChild.firstName} Born`,
      body: `Congratulations on the new arrival! The media has picked up on the happy news. This is a great story for your public image.`,
      emailCategory: 'media',
    })

    return {
      success: true,
      message: `Congratulations! Welcome ${newChild.firstName} to the family!`,
      child: newChild
    }
  }, [getPersonalLife, updatePersonalLife, player, careerState?.playerLastName, currentWeek, currentYear, currentDay, addPersonalCalendarEntry])
  
  /**
   * Get the current pregnancy status
   */
  const getPregnancyStatus = useCallback((): PregnancyState | null => {
    const personalLife = getPersonalLife()
    if (!personalLife) return null
    
    return (personalLife.pregnancy as PregnancyState) || null
  }, [getPersonalLife])
  
  // ============================================
  // LIFESTYLE ACTIONS
  // ============================================
  
  const upgradeHealthcare = useCallback((level: 'basic' | 'standard' | 'premium' | 'executive') => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const healthcareCosts: Record<string, number> = {
      basic: 5000,
      standard: 15000,
      premium: 25000,
      executive: 50000
    }
    
    const annualCost = healthcareCosts[level]
    
    updatePersonalLife({
      health: {
        ...personalLife.health,
        healthcareLevel: level,
        annualHealthcareCost: annualCost
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Healthcare Plan Updated: ${level}`,
      body: `Your healthcare plan has been upgraded to **${level}**. Annual cost: $${annualCost.toLocaleString()}.`,
    })

    return {
      success: true,
      message: `Upgraded to ${level} healthcare plan`
    }
  }, [getPersonalLife, updatePersonalLife])
  
  const treatHealthCondition = useCallback((conditionId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const conditionIndex = personalLife.health.activeConditions.findIndex(c => c.id === conditionId)
    if (conditionIndex === -1) {
      return { success: false, message: 'Condition not found' }
    }
    
    const condition = personalLife.health.activeConditions[conditionIndex]
    const treatmentCost = condition.treatmentCost ?? 5000
    
    if (personalLife.finances.liquidCash < treatmentCost) {
      return { success: false, message: 'Insufficient funds for treatment' }
    }
    
    // Remove or improve condition
    const newConditions = personalLife.health.activeConditions.filter((_, i) => i !== conditionIndex)
    
    const transaction = createTransaction(
      'expense',
      'healthcare',
      treatmentCost,
      `Treatment: ${condition.name}`,
      currentWeek,
      currentYear
    )
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const treatmentTimeCost = getActivityTimeCost('treatment_session')
    if (treatmentTimeCost.hours > 0) {
      consumeHoursFromBudget(treatmentTimeCost.hours, treatmentTimeCost.drain, `Treatment: ${condition.name}`, 'treatment_session')
    }
    addPersonalCalendarEntry({
      name: `Health Treatment: ${condition.name}`,
      description: `Medical treatment for ${condition.name}`,
      activityId: 'treatment_session',
      week: currentWeek,
      day: currentDay,
      duration: treatmentTimeCost.hours,
      drainLevel: treatmentTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'wellness',
      immediate: true,
      effectsOnComplete: {
        healthBonus: 10,
      }
    })
    routeNotification({
      category: 'personalStaff.doctor',
      subject: `Treatment Complete: ${condition.name}`,
      body: `Your treatment for ${condition.name} was successful. Physical health has improved. Remember to follow the recovery protocol.`,
    })

    updatePersonalLife({
      health: {
        ...personalLife.health,
        activeConditions: newConditions,
        physicalHealth: clamp(personalLife.health.physicalHealth + 10, 0, 100)
      },
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - treatmentCost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    return { success: true, message: `Successfully treated ${condition.name}` }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentYear, currentDay])
  
  const startHobby = useCallback((hobbyType: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Check if already has this hobby
    if (personalLife.hobbies.some(h => h.type === hobbyType)) {
      return { success: false, message: 'You already have this hobby' }
    }
    
    // Find hobby template
    const template = HOBBY_TEMPLATES[hobbyType as keyof typeof HOBBY_TEMPLATES]
    if (!template) {
      return { success: false, message: 'Unknown hobby type' }
    }
    
    const initialCost = template.initialInvestment ?? 5000
    
    if (personalLife.finances.liquidCash < initialCost) {
      return { success: false, message: 'Insufficient funds to start this hobby' }
    }
    
    const newHobby = createHobby(
      hobbyType,
      template.name,
      template.description ?? '',
      template.initialInvestment ?? 5000,
      template.annualCost ?? 2000
    )
    
    const transaction = createTransaction(
      'expense',
      'entertainment',
      initialCost,
      `Started hobby: ${template.name}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      hobbies: [...personalLife.hobbies, newHobby],
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - initialCost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `New Hobby: ${template.name}`,
      body: `You've started a new hobby: ${template.name}. Initial investment: $${initialCost.toLocaleString()}. Annual upkeep: $${(template.annualCost ?? 2000).toLocaleString()}.`,
    })

    return { success: true, message: `Started new hobby: ${template.name}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const practiceHobby = useCallback((hobbyType: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const hobbyIndex = personalLife.hobbies.findIndex(h => h.type === hobbyType)
    if (hobbyIndex === -1) {
      return { success: false, message: 'You don\'t have this hobby' }
    }
    
    const hobby = personalLife.hobbies[hobbyIndex]
    
    // Get activity config for time cost
    const activity = getHobbyActivity(hobbyType as HobbyType, hobby.name)
    
    // Check time-of-day period restriction
    const hobbyTimeCost = getActivityTimeCost(`hobby_${hobbyType}`) || getActivityTimeCost('hobby_practice')
    const periodCheck = canDoActivityInCurrentPeriod(hobbyTimeCost.allowedPeriods, careerState?.dayBudget?.currentHour ?? 7)
    if (!periodCheck.allowed) {
      return { success: false, message: periodCheck.reason || 'Not available at this time of day' }
    }
    
    // Consume hours from the day budget
    const consumed = consumeHoursFromBudget(
      activity.hoursRequired,
      activity.drainLevel,
      activity.name,
      activity.id
    )
    
    if (!consumed) {
      return { success: false, message: `Not enough hours today (need ${activity.hoursRequired}h)` }
    }
    
    // Calculate progress gain (harder at higher levels)
    const progressGain = Math.max(5, 20 - hobby.skillLevel * 0.15)
    const newProgress = (hobby.progressToNextLevel || 0) + progressGain
    
    // Check for level up
    let newSkillLevel = hobby.skillLevel
    let remainingProgress = newProgress
    let leveledUp = false
    
    if (newProgress >= 100) {
      newSkillLevel = Math.min(100, hobby.skillLevel + 1)
      remainingProgress = newProgress - 100
      leveledUp = true
    }
    
    const updatedHobby = {
      ...hobby,
      skillLevel: newSkillLevel,
      progressToNextLevel: remainingProgress,
      hoursInvested: (hobby.hoursInvested || 0) + activity.hoursRequired
    }
    
    const newHobbies = [...personalLife.hobbies]
    newHobbies[hobbyIndex] = updatedHobby
    
    // Reduce stress when practicing hobbies (use activity config value which varies by hobby type)
    const stressReduction = activity.benefits.stressReduction || hobby.stressReduction || 8
    updatePersonalLife({
      hobbies: newHobbies,
      health: {
        ...personalLife.health,
        stressLevel: clamp(personalLife.health.stressLevel - stressReduction, 0, 100)
      }
    })
    
    // === CALENDAR INTEGRATION (time already consumed above) ===
    addPersonalCalendarEntry({
      name: `Hobby: ${hobby.name}`,
      description: `Practiced ${hobby.name} (skill level ${newSkillLevel})`,
      activityId: `hobby_${hobbyType}`,
      week: currentWeek,
      day: currentDay,
      duration: activity.hoursRequired,
      drainLevel: activity.drainLevel,
      calendarEntryType: 'personal',
      category: 'hobby',
      immediate: true,
      effectsOnComplete: {
        stressReduction,
        skillProgress: activity.benefits.skillProgress || 5,
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    if (leveledUp) {
      routeNotification({
        category: 'personalStaff.instructor',
        subject: `${hobby.name} Level Up!`,
        body: `Great progress! You've reached level ${newSkillLevel} in ${hobby.name}. Keep up the practice!`,
      })
    }

    const message = leveledUp 
      ? `Practiced ${hobby.name} and reached level ${newSkillLevel}!`
      : `Practiced ${hobby.name} and improved!`
    
    return {
      success: true,
      message,
      skillGain: Math.round(progressGain)
    }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])
  
  const quitHobby = useCallback((hobbyType: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const hobbyIndex = personalLife.hobbies.findIndex(h => h.type === hobbyType)
    if (hobbyIndex === -1) {
      return { success: false, message: 'You don\'t have this hobby' }
    }
    
    const hobby = personalLife.hobbies[hobbyIndex]
    
    // Calculate equipment refund (50% of equipment value)
    let equipmentRefund = 0
    if (hobby.equippedItemId) {
      // Equipment cost lookup: use the hobby template's initial investment as a proxy
      const template = HOBBY_TEMPLATES[hobby.type as keyof typeof HOBBY_TEMPLATES]
      if (template) {
        equipmentRefund = Math.round(template.initialInvestment * 0.5)
      }
    }
    
    // Remove hobby from list
    const newHobbies = personalLife.hobbies.filter(h => h.type !== hobbyType)
    
    // Create refund transaction if there's equipment
    const transactions = [...personalLife.finances.transactions]
    if (equipmentRefund > 0) {
      transactions.push(createTransaction(
        'income',
        'other_income',
        equipmentRefund,
        `Sold equipment from hobby: ${hobby.name}`,
        currentWeek,
        currentYear
      ))
    }
    
    updatePersonalLife({
      hobbies: newHobbies,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash + equipmentRefund,
        transactions
      }
    })
    
    const message = equipmentRefund > 0 
      ? `Quit ${hobby.name}. Received $${equipmentRefund.toLocaleString()} equipment refund.`
      : `Quit ${hobby.name}.`
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Hobby Ended: ${hobby.name}`,
      body: `You've quit ${hobby.name}.${equipmentRefund > 0 ? ` Equipment refund: $${equipmentRefund.toLocaleString()}.` : ''}`,
    })

    return {
      success: true,
      message,
      refund: equipmentRefund
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const hireStaff = useCallback((role: StaffRole) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Check if already has this role
    if (personalLife.staff.some(s => s.role === role)) {
      return { success: false, message: 'You already have someone in this role' }
    }
    
    const template = STAFF_TEMPLATES[role]
    if (!template) {
      return { success: false, message: 'Unknown staff role' }
    }
    
    const salary = template.baseSalary ?? 50000
    const newStaff = createStaffMember(role, salary)
    
    updatePersonalLife({
      staff: [...personalLife.staff, newStaff],
      finances: {
        ...personalLife.finances,
        monthlyExpenses: {
          ...personalLife.finances.monthlyExpenses,
          personalStaff: (personalLife.finances.monthlyExpenses.personalStaff ?? 0) + Math.floor(salary / 12)
        }
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const hireTimeCost = getActivityTimeCost('staff_hiring')
    if (hireTimeCost.hours > 0) {
      consumeHoursFromBudget(hireTimeCost.hours, hireTimeCost.drain, `Hiring: ${role.replace(/_/g, ' ')}`, 'staff_hiring')
    }
    addPersonalCalendarEntry({
      name: `Hire: ${newStaff.name}`,
      description: `Interviewed and hired ${newStaff.name} as ${role.replace(/_/g, ' ')}`,
      activityId: 'staff_hiring',
      week: currentWeek,
      day: currentDay,
      duration: hireTimeCost.hours,
      drainLevel: hireTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    routeNotification({
      category: 'personalStaff.instructor',
      subject: 'New Staff Hired',
      body: `${newStaff.name} has been hired as your ${role.replace(/_/g, ' ')}. Annual salary: $${salary.toLocaleString()}.`,
    })
    
    return { success: true, message: `Hired ${newStaff.name} as your ${role.replace(/_/g, ' ')}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const fireStaff = useCallback((staffId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const staff = personalLife.staff.find(s => s.id === staffId)
    if (!staff) {
      return { success: false, message: 'Staff member not found' }
    }
    
    // Severance pay
    const severance = Math.floor(staff.salary * staff.yearsEmployed * 0.1)
    
    if (personalLife.finances.liquidCash < severance) {
      return { success: false, message: 'Cannot afford severance pay' }
    }
    
    const transaction = createTransaction(
      'expense',
      'staff',
      severance,
      `Severance: ${staff.name}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      staff: personalLife.staff.filter(s => s.id !== staffId),
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - severance,
        monthlyExpenses: {
          ...personalLife.finances.monthlyExpenses,
          personalStaff: Math.max(0, (personalLife.finances.monthlyExpenses.personalStaff ?? 0) - staff.salary) // salary is already monthly
        },
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const fireTimeCost = getActivityTimeCost('staff_hiring') // Same time cost as hiring (meeting)
    if (fireTimeCost.hours > 0) {
      consumeHoursFromBudget(fireTimeCost.hours, fireTimeCost.drain, `Dismissal Meeting: ${staff.name}`, 'staff_hiring')
    }
    addPersonalCalendarEntry({
      name: `Staff Dismissal: ${staff.name}`,
      description: `Let go of ${staff.name} (${staff.role.replace(/_/g, ' ')}). Severance: $${severance.toLocaleString()}`,
      activityId: 'staff_hiring',
      week: currentWeek,
      day: currentDay,
      duration: fireTimeCost.hours,
      drainLevel: fireTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    routeNotification({
      category: 'personalStaff.instructor',
      subject: `Staff Change: ${staff.name} Departed`,
      body: `${staff.name} has been let go from their role as ${staff.role.replace(/_/g, ' ')}. Severance paid: $${severance.toLocaleString()}.`,
    })

    return { success: true, message: `${staff.name} has been let go` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])

  const giveStaffRaiseAction = useCallback((staffId: string, percentIncrease: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const staffIndex = personalLife.staff.findIndex(s => s.id === staffId)
    if (staffIndex === -1) {
      return { success: false, message: 'Staff member not found' }
    }
    
    const staff = personalLife.staff[staffIndex]
    
    // Use the lifestyleManager function (imported at top of file)
    const result = giveStaffRaise(staff, percentIncrease, currentWeek, currentYear)
    
    if (!result.success) {
      return { success: false, message: result.message }
    }
    
    // Update staff list
    const newStaff = [...personalLife.staff]
    newStaff[staffIndex] = result.updatedStaff
    
    // Update monthly expenses
    const oldMonthlySalary = staff.salary // salary field is already monthly
    const newMonthlySalary = result.updatedStaff.salary
    const salaryDiff = newMonthlySalary - oldMonthlySalary
    
    updatePersonalLife({
      staff: newStaff,
      finances: {
        ...personalLife.finances,
        monthlyExpenses: {
          ...personalLife.finances.monthlyExpenses,
          personalStaff: (personalLife.finances.monthlyExpenses.personalStaff ?? 0) + salaryDiff
        }
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Staff Raise: ${staff.name}`,
      body: `${staff.name}'s salary has been increased by ${percentIncrease}%. New annual salary: $${(result.updatedStaff.annualSalary || result.updatedStaff.salary * 12).toLocaleString()}.`,
    })

    return { success: true, message: result.message }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const giveStaffBonusAction = useCallback((staffId: string, amount: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const staffIndex = personalLife.staff.findIndex(s => s.id === staffId)
    if (staffIndex === -1) {
      return { success: false, message: 'Staff member not found' }
    }
    
    const staff = personalLife.staff[staffIndex]
    
    // Check if can afford
    if (personalLife.finances.liquidCash < amount) {
      return { success: false, message: 'Insufficient funds for bonus' }
    }
    
    // Use the lifestyleManager function (imported at top of file)
    const result = giveStaffBonus(staff, amount, currentWeek, currentYear)
    
    if (!result.success) {
      return { success: false, message: result.message }
    }
    
    // Update staff list and finances
    const newStaff = [...personalLife.staff]
    newStaff[staffIndex] = result.updatedStaff
    
    const transaction = createTransaction(
      'expense',
      'staff',
      amount,
      `Bonus: ${staff.name}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      staff: newStaff,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - amount,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Staff Bonus: ${staff.name}`,
      body: `A $${amount.toLocaleString()} bonus has been awarded to ${staff.name}.`,
    })

    return { success: true, message: result.message }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const requestStaffReferralAction = useCallback((staffId: string, roleNeeded: StaffRole) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const staff = personalLife.staff.find(s => s.id === staffId)
    if (!staff) {
      return { success: false, message: 'Staff member not found' }
    }
    
    // Use the lifestyleManager function (imported at top of file)
    const result = requestStaffReferral(staff, roleNeeded)
    
    if (!result.success || !result.referredCandidate) {
      return { success: false, message: result.message }
    }
    
    // Update the staff member's referral count
    const staffIndex = personalLife.staff.findIndex(s => s.id === staffId)
    const newStaff = [...personalLife.staff]
    newStaff[staffIndex] = {
      ...staff,
      referralsProvided: (staff.referralsProvided || 0) + 1
    }
    
    updatePersonalLife({ staff: newStaff })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Staff Referral: ${result.referredCandidate.name}`,
      body: `${staff.name} has referred ${result.referredCandidate.name} for the ${roleNeeded.replace(/_/g, ' ')} position. Competence rating: ${result.referredCandidate.competence}.`,
    })

    return { 
      success: true, 
      message: result.message,
      candidate: {
        name: result.referredCandidate.name,
        competence: result.referredCandidate.competence
      }
    }
  }, [getPersonalLife, updatePersonalLife])

  const upgradeLifestyle = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const lifestyleLevels: LifestyleLevel[] = [
      'frugal', 'modest', 'comfortable', 'affluent', 'luxury', 'ultra_luxury'
    ]
    
    const currentIndex = lifestyleLevels.indexOf(personalLife.lifestyleLevel)
    if (currentIndex === lifestyleLevels.length - 1) {
      return { success: false, message: 'Already at maximum lifestyle level' }
    }
    
    const nextLevel = lifestyleLevels[currentIndex + 1]
    
    // Check if player can afford the next lifestyle tier
    const netWorth = personalLife.finances.liquidCash + (personalLife.finances.totalAssets || 0)
    const affordability = canAffordLifestyle(nextLevel, netWorth)
    if (!affordability.canAfford) {
      return { success: false, message: affordability.reason || 'Cannot afford this lifestyle tier' }
    }
    
    const newMonthlyCost = getLifestyleMonthlyCost(nextLevel)
    
    updatePersonalLife({
      lifestyleLevel: nextLevel,
      finances: {
        ...personalLife.finances,
        monthlyExpenses: {
          ...personalLife.finances.monthlyExpenses,
          lifestyle: newMonthlyCost
        }
      }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Lifestyle Upgraded: ${nextLevel.replace(/_/g, ' ')}`,
      body: `You've upgraded your lifestyle to ${nextLevel.replace(/_/g, ' ')}. New monthly cost: $${newMonthlyCost.toLocaleString()}.`,
    })

    return {
      success: true,
      message: `Upgraded to ${nextLevel} lifestyle`,
      newLevel: nextLevel
    }
  }, [getPersonalLife, updatePersonalLife])
  
  // ============================================
  // LIFESTYLE ASSET ACTIONS
  // ============================================
  
  const buyVehicle = useCallback((vehicleCatalogIndex: number): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Check affordability with reserve requirement
    const catalog = getVehicleCatalog()
    const entry = catalog[vehicleCatalogIndex]
    if (entry) {
      const affordCheck = canAffordAsset(entry.price, personalLife.finances.liquidCash)
      if (!affordCheck.canAfford) {
        return { success: false, message: affordCheck.reason || 'Cannot afford this vehicle' }
      }
    }
    
    const result = purchaseVehicleManager(
      vehicleCatalogIndex,
      personalLife.finances,
      currentWeek,
      currentYear
    )
    
    if (result.success && result.item && result.cost) {
      // Initialize lifestyleAssets if needed
      const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
      
      // Add transaction
      const transaction = createTransaction(
        'expense',
        'lifestyle',
        result.cost,
        result.message,
        currentWeek,
        currentYear
      )
      
      // Set as primary if first vehicle
      const vehicle = result.item as any
      if (currentAssets.vehicles.length === 0) {
        vehicle.isPrimaryVehicle = true
      }
      
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          vehicles: [...currentAssets.vehicles, vehicle]
        },
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - result.cost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
      
      // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
      const vehicleTimeCost = getActivityTimeCost('car_shopping')
      if (vehicleTimeCost.hours > 0) {
        consumeHoursFromBudget(vehicleTimeCost.hours, vehicleTimeCost.drain, `Vehicle Purchase`, 'car_shopping')
      }
      addPersonalCalendarEntry({
        name: `Vehicle Purchase`,
        description: result.message,
        activityId: 'car_shopping',
        week: currentWeek,
        day: currentDay,
        duration: vehicleTimeCost.hours,
        drainLevel: vehicleTimeCost.drain,
        calendarEntryType: 'personal',
        category: 'personal',
        immediate: true
      })
      routeNotification({
        category: 'personalStaff.assistant',
        subject: 'Vehicle Purchased',
        body: `${result.message}. Cost: $${result.cost!.toLocaleString()}.`,
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const sellOwnedVehicle = useCallback((vehicleId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const vehicle = currentAssets.vehicles.find(v => v.id === vehicleId)
    
    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }
    
    const result = sellVehicleManager(vehicle)
    
    if (result.success && result.proceeds !== undefined) {
      // Add transaction
      const transaction = createTransaction(
        'income',
        'asset_sale',
        result.proceeds,
        result.message,
        currentWeek,
        currentYear
      )
      
      // Remove vehicle from assets
      const updatedVehicles = currentAssets.vehicles.filter(v => v.id !== vehicleId)
      
      // If sold the primary vehicle, set another as primary
      if (vehicle.isPrimaryVehicle && updatedVehicles.length > 0) {
        updatedVehicles[0].isPrimaryVehicle = true
      }
      
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          vehicles: updatedVehicles
        },
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash + result.proceeds,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
      
      // === NOTIFICATION INTEGRATION ===
      routeNotification({
        category: 'personalStaff.assistant',
        subject: `Vehicle Sold: ${(vehicle as any).brand || ''} ${(vehicle as any).model || ''}`.trim(),
        body: `${result.message}. Proceeds of $${result.proceeds.toLocaleString()} have been added to your account.`,
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const setAsPrimaryVehicle = useCallback((vehicleId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const vehicle = currentAssets.vehicles.find(v => v.id === vehicleId)
    
    if (!vehicle) {
      return { success: false, message: 'Vehicle not found' }
    }
    
    const updatedVehicles = setPrimaryVehicle(currentAssets.vehicles, vehicleId)
    
    updatePersonalLife({
      lifestyleAssets: {
        ...currentAssets,
        vehicles: updatedVehicles
      }
    })
    
    return { 
      success: true, 
      message: `Set ${vehicle.brand} ${vehicle.model} as primary vehicle` 
    }
  }, [getPersonalLife, updatePersonalLife])
  
  const buyFurnishing = useCallback((furnishingId: string, propertyId: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Check affordability with reserve requirement
    const catalog = getFurnishingCatalog()
    const entry = catalog.find(f => f.id === furnishingId)
    if (entry) {
      const affordCheck = canAffordAsset(entry.basePrice, personalLife.finances.liquidCash)
      if (!affordCheck.canAfford) {
        return { success: false, message: affordCheck.reason || 'Cannot afford this furnishing' }
      }
    }
    
    const result = purchaseFurnishingManager(
      furnishingId,
      propertyId,
      personalLife.finances,
      currentWeek,
      currentYear
    )
    
    if (result.success && result.item && result.cost) {
      const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
      
      const transaction = createTransaction(
        'expense',
        'lifestyle',
        result.cost,
        result.message,
        currentWeek,
        currentYear
      )
      
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          furnishings: [...currentAssets.furnishings, result.item as any]
        },
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - result.cost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const sellOwnedFurnishing = useCallback((furnishingId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const furnishing = currentAssets.furnishings.find(f => f.id === furnishingId)
    
    if (!furnishing) {
      return { success: false, message: 'Furnishing not found' }
    }
    
    const result = sellFurnishingManager(furnishing)
    
    if (result.success && result.proceeds !== undefined) {
      const transaction = createTransaction(
        'income',
        'asset_sale',
        result.proceeds,
        result.message,
        currentWeek,
        currentYear
      )
      
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          furnishings: currentAssets.furnishings.filter(f => f.id !== furnishingId)
        },
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash + result.proceeds,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const joinClubMembership = useCallback((
    membershipId: string, 
    tier: 'standard' | 'gold' | 'platinum' | 'founding'
  ): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const netWorth = personalLife.finances.cachedNetWorth || 0
    
    const result = joinMembershipManager(
      membershipId,
      tier,
      personalLife.finances,
      netWorth,
      currentWeek,
      currentYear
    )
    
    if (result.success && result.item && result.cost) {
      const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
      
      const transaction = createTransaction(
        'expense',
        'lifestyle',
        result.cost,
        result.message,
        currentWeek,
        currentYear
      )
      
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          memberships: [...currentAssets.memberships, result.item as any]
        },
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - result.cost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const cancelClubMembership = useCallback((membershipId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const membership = currentAssets.memberships.find(m => m.id === membershipId)
    
    if (!membership) {
      return { success: false, message: 'Membership not found' }
    }
    
    const result = cancelMembershipManager(membership)
    
    if (result.success) {
      updatePersonalLife({
        lifestyleAssets: {
          ...currentAssets,
          memberships: currentAssets.memberships.filter(m => m.id !== membershipId)
        }
      })
    }
    
    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const getAvailableVehicles = useCallback(() => {
    return getVehicleCatalog()
  }, [])
  
  const getAvailableMemberships = useCallback(() => {
    return getMembershipCatalog()
  }, [])
  
  const getAvailableFurnishings = useCallback(() => {
    return getFurnishingCatalog()
  }, [])
  
  const getLifestyleScoreBreakdown = useCallback((): LifestyleScoreBreakdown | null => {
    const personalLife = getPersonalLife()
    if (!personalLife) return null
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    
    // Estimate primary residence value from furnishings (real estate system not fully integrated yet)
    const primaryResidenceValue = (currentAssets.furnishings || [])
      .reduce((sum: number, f: any) => sum + (f.currentValue || f.purchasePrice || 0), 0)
    // Get collections value from personal life collections state
    const collectionsValue = personalLife.collections?.totalPortfolioValue || 0
    
    return calculateLifestyleScore(
      primaryResidenceValue,
      currentAssets,
      collectionsValue,
      personalLife.staff || [],
      personalLife.hobbies || []
    )
  }, [getPersonalLife])
  
  // ============================================
  // NEW ASSET ACTIONS
  // ============================================
  
  const subscribeToService = useCallback((catalogId: string, tier: 'standard' | 'premium' | 'elite'): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = subscribeServiceManager(catalogId, tier, currentWeek, currentYear)
    if (!result.success) return result
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newService = result.item as any
    
    updatePersonalLife({
      lifestyleAssets: { ...currentAssets, services: [...currentAssets.services, newService] }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const cancelServiceSubscription = useCallback((serviceId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const result = cancelServiceManager(serviceId, currentAssets.services)
    if (!result.success) return result
    
    updatePersonalLife({
      lifestyleAssets: { ...currentAssets, services: currentAssets.services.filter(s => s.id !== serviceId) }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const bookLuxuryExperience = useCallback((catalogId: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = bookExperienceManager(catalogId, currentWeek, currentYear)
    if (!result.success) return result
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newExp = result.item as any
    
    // Deduct cost
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash - (result.cost || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, experiences: [...currentAssets.experiences, newExp] }
    })
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const expTimeCost = getActivityTimeCost('luxury_experience')
    
    if (expTimeCost.hours > 0) {
      consumeHoursFromBudget(expTimeCost.hours, expTimeCost.drain, `Experience: ${newExp.name || catalogId}`, 'luxury_experience')
    }
    
    addPersonalCalendarEntry({
      name: `Experience: ${newExp.name || catalogId}`,
      description: `Luxury experience booked`,
      activityId: 'luxury_experience',
      week: currentWeek,
      day: currentDay,
      duration: expTimeCost.hours,
      drainLevel: expTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Experience Booked: ${newExp.name || catalogId}`,
      body: `Your luxury experience has been booked. Cost: $${(result.cost || 0).toLocaleString()}.`,
    })

    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const buyCollectible = useCallback((catalogId: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = purchaseCollectibleManager(catalogId, currentWeek, currentYear)
    if (!result.success) return result
    
    if (personalLife.finances.liquidCash < (result.cost || 0)) {
      return { success: false, message: 'Insufficient funds' }
    }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newCollectible = result.item as any
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash - (result.cost || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, collectibles: [...currentAssets.collectibles, newCollectible] }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const sellOwnedCollectible = useCallback((collectibleId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const collectible = currentAssets.collectibles.find(c => c.id === collectibleId)
    if (!collectible) return { success: false, message: 'Collectible not found' }
    
    const result = sellCollectibleManager(collectible)
    if (!result.success) return result
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash + (result.proceeds || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, collectibles: currentAssets.collectibles.filter(c => c.id !== collectibleId) }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const adoptNewPet = useCallback((catalogId: string, petName: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = adoptPetManager(catalogId, petName, currentWeek, currentYear)
    if (!result.success) return result
    
    if (personalLife.finances.liquidCash < (result.cost || 0)) {
      return { success: false, message: 'Insufficient funds' }
    }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newPet = result.item as any
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash - (result.cost || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, pets: [...(currentAssets.pets || []), newPet] }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `New Pet: ${petName}`,
      body: `Welcome ${petName} to the family! Adoption cost: $${(result.cost || 0).toLocaleString()}.`,
    })

    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const rehomeOwnedPet = useCallback((petId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const pet = (currentAssets.pets || []).find(p => p.id === petId)
    if (!pet) return { success: false, message: 'Pet not found' }
    
    const result = rehomePetManager(pet)
    
    updatePersonalLife({
      lifestyleAssets: { ...currentAssets, pets: (currentAssets.pets || []).filter(p => p.id !== petId) }
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Pet Rehomed: ${(pet as any).name || 'Pet'}`,
      body: `${(pet as any).name || 'Your pet'} has been rehomed to a new family.`,
    })

    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const buyWardrobeItemAction = useCallback((catalogId: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = purchaseWardrobeManager(catalogId, currentWeek, currentYear)
    if (!result.success) return result
    
    if (personalLife.finances.liquidCash < (result.cost || 0)) {
      return { success: false, message: 'Insufficient funds' }
    }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newItem = result.item as any
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash - (result.cost || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, wardrobe: [...(currentAssets.wardrobe || []), newItem] }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const sellOwnedWardrobeItem = useCallback((itemId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const item = (currentAssets.wardrobe || []).find(w => w.id === itemId)
    if (!item) return { success: false, message: 'Item not found' }
    
    const result = sellWardrobeManager(item)
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash + (result.proceeds || 0)
    }
    
    updatePersonalLife({
      finances: newFinances,
      lifestyleAssets: { ...currentAssets, wardrobe: (currentAssets.wardrobe || []).filter(w => w.id !== itemId) }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const subscribeToDiet = useCallback((catalogId: string): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const result = subscribeDietManager(catalogId, currentWeek, currentYear)
    if (!result.success) return result
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    const newPlan = result.item as any
    
    updatePersonalLife({
      lifestyleAssets: { ...currentAssets, dietPlan: newPlan }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const cancelDietPlan = useCallback((): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentAssets = personalLife.lifestyleAssets || createDefaultLifestyleAssets()
    if (!currentAssets.dietPlan) return { success: false, message: 'No diet plan active' }
    
    const result = cancelDietManager()
    
    updatePersonalLife({
      lifestyleAssets: { ...currentAssets, dietPlan: null }
    })
    
    return result
  }, [getPersonalLife, updatePersonalLife])
  
  const buyProperty = useCallback((listingIndex: number, options?: {
    paymentMethod: 'cash' | 'mortgage' | 'rent'
    downPaymentPercent?: number
    mortgageTermYears?: number
  }): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Generate listings the same way getPropertyListings does
    const budgetMin = 50000
    const budgetMax = Math.max(personalLife.finances.liquidCash * 5, 5000000)
    const listings = generatePropertyListings(40, budgetMin, budgetMax)
    const listing = listings[listingIndex]
    if (!listing) return { success: false, message: 'Property listing not found' }
    
    const negotiatedPrice = listing.listPrice
    const paymentMethod = options?.paymentMethod || 'cash'
    const currentProperties = (personalLife as any).properties || []
    
    if (paymentMethod === 'rent') {
      // Rent the property - calculate monthly rent from rental yield
      const monthlyRent = Math.round(negotiatedPrice * 0.04 / 12) // ~4% annual yield
      const leaseMonths = 12
      
      const rentalProperty = {
        ...listing.property,
        id: `prop-rent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        purchasePrice: 0,
        purchaseDate: { week: currentWeek, year: currentYear },
        lastValuationDate: { week: currentWeek, year: currentYear },
        status: 'player_rental' as const,
        isPlayerRental: true,
        monthlyRent,
        leaseMonths,
        mortgageId: undefined,
        rental: undefined,
        renovation: undefined,
      }
      
      updatePersonalLife({
        finances: personalLife.finances,
        properties: [...currentProperties, rentalProperty]
      } as any)
      
      routeNotification({
        category: 'personalStaff.assistant',
        subject: 'Property Rented',
        body: `You've rented ${listing.name} for $${monthlyRent.toLocaleString()}/month. Lease: ${leaseMonths} months.`,
      })
      
      return { success: true, message: `Rented ${listing.name} for $${monthlyRent.toLocaleString()}/month`, cost: 0 }
      
    } else if (paymentMethod === 'mortgage') {
      // Mortgage purchase - only deduct down payment
      const downPaymentPercent = options?.downPaymentPercent || 20
      const termYears = options?.mortgageTermYears || 25
      const downPaymentAmount = Math.round(negotiatedPrice * (downPaymentPercent / 100))
      
      if (personalLife.finances.liquidCash < downPaymentAmount) {
        return { success: false, message: `Insufficient funds for ${downPaymentPercent}% down payment ($${downPaymentAmount.toLocaleString()})` }
      }
      
      // Create mortgage
      const loanAmount = negotiatedPrice - downPaymentAmount
      const creditScore = personalLife.finances.creditScore || 700
      const baseRate = 0.045 // 4.5% base
      const rateAdjust = creditScore >= 750 ? -0.005 : creditScore >= 700 ? 0 : creditScore >= 650 ? 0.01 : 0.025
      const interestRate = baseRate + rateAdjust
      const monthlyRate = interestRate / 12
      const totalPayments = termYears * 12
      const monthlyPayment = Math.round(
        loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
      )
      
      // Check debt-to-income ratio
      const monthlyIncome = (personalLife.finances.monthlyIncome?.ownerSalary || 0) + 
        (personalLife.finances.monthlyIncome?.investmentIncome || 0) +
        (personalLife.finances.monthlyIncome?.rentalIncome || 0)
      const existingDebt = personalLife.finances.mortgages?.reduce((sum: number, m: any) => sum + (m.monthlyPayment || 0), 0) || 0
      const dtiRatio = monthlyIncome > 0 ? (existingDebt + monthlyPayment) / monthlyIncome : 1
      
      if (dtiRatio > 0.5 && monthlyIncome > 0) {
        return { success: false, message: `Mortgage denied: debt-to-income ratio (${Math.round(dtiRatio * 100)}%) exceeds 50% maximum` }
      }
      
      const mortgageId = `mort-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const newMortgage = {
        id: mortgageId,
        propertyId: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lender: 'Premium Property Finance',
        originalAmount: loanAmount,
        remainingBalance: loanAmount,
        interestRate,
        termMonths: totalPayments,
        monthlyPayment,
        startDate: { week: currentWeek, year: currentYear },
        type: 'fixed' as const,
        status: 'active' as const,
      }
      
      const property = {
        ...listing.property,
        id: newMortgage.propertyId,
        purchasePrice: negotiatedPrice,
        purchaseDate: { week: currentWeek, year: currentYear },
        lastValuationDate: { week: currentWeek, year: currentYear },
        status: 'primary_residence' as const,
        mortgageId,
        rental: undefined,
        renovation: undefined,
      }
      
      const existingMortgages = personalLife.finances.mortgages || []
      
      updatePersonalLife({
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - downPaymentAmount,
          mortgages: [...existingMortgages, newMortgage],
        },
        properties: [...currentProperties, property]
      } as any)
      
      routeNotification({
        category: 'personalStaff.assistant',
        subject: 'Mortgage Approved & Property Purchased',
        body: `Mortgage approved for ${listing.name}!\n\nDown payment: $${downPaymentAmount.toLocaleString()} (${downPaymentPercent}%)\nLoan: $${loanAmount.toLocaleString()}\nRate: ${(interestRate * 100).toFixed(1)}%\nTerm: ${termYears} years\nMonthly: $${monthlyPayment.toLocaleString()}`,
      })
      
      return { success: true, message: `Purchased ${listing.name} with mortgage. Down: $${downPaymentAmount.toLocaleString()}, Monthly: $${monthlyPayment.toLocaleString()}`, cost: downPaymentAmount }
      
    } else {
      // Cash purchase - original flow
      if (personalLife.finances.liquidCash < negotiatedPrice) {
        return { success: false, message: `Insufficient cash. Need $${negotiatedPrice.toLocaleString()}, have $${personalLife.finances.liquidCash.toLocaleString()}` }
      }
      
      const property = purchasePropertyManager(listing, negotiatedPrice, negotiatedPrice, undefined, currentWeek, currentYear, false)
      
      updatePersonalLife({
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - negotiatedPrice,
        },
        properties: [...currentProperties, property]
      } as any)
      
      routeNotification({
        category: 'personalStaff.assistant',
        subject: 'Property Acquired',
        body: `You've purchased ${listing.name} for $${negotiatedPrice.toLocaleString()} cash. Congratulations!`,
      })
      
      return { success: true, message: `Purchased ${listing.name} for $${negotiatedPrice.toLocaleString()}`, cost: negotiatedPrice }
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const sellOwnedProperty = useCallback((propertyId: string): SaleResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentProperties = (personalLife as any).properties || []
    const property = currentProperties.find((p: any) => p.id === propertyId)
    if (!property) return { success: false, message: 'Property not found' }
    
    const salePrice = property.currentValue || property.purchasePrice || 0
    const result = sellPropertyManager(property, salePrice, currentWeek, currentYear, undefined)
    
    const finalSalePrice = result.salePrice || property.currentValue || 0
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash + finalSalePrice
    }
    
    updatePersonalLife({
      finances: newFinances,
      properties: currentProperties.filter((p: any) => p.id !== propertyId)
    } as any)
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.assistant',
      subject: `Property Sold: ${property.name || 'Property'}`,
      body: `Your property has been sold for $${finalSalePrice.toLocaleString()}. The funds have been added to your account.`,
    })

    return { success: true, message: `Property sold for $${finalSalePrice.toLocaleString()}`, proceeds: finalSalePrice }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])

  const buyStock = useCallback((symbol: string, shares: number): { success: boolean; message: string } => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    const currentHoldings = (personalLife as any).stockHoldings ?? []
    const result = buyStockManager(symbol, shares, personalLife.finances.liquidCash, currentWeek, currentYear, currentHoldings)
    if (!result.success) return { success: false, message: result.reason ?? 'Purchase failed' }
    const newHoldings = currentHoldings.filter((h: any) => h.stockSymbol !== symbol)
    if (result.holding) newHoldings.push(result.holding)
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash + result.transaction!.amount,
        transactions: [...personalLife.finances.transactions, result.transaction!]
      },
      stockHoldings: newHoldings
    } as any)
    return { success: true, message: `Bought ${shares} shares of ${symbol}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])

  const sellStock = useCallback((symbol: string, sharesToSell: number): { success: boolean; message: string } => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    const currentHoldings = (personalLife as any).stockHoldings ?? []
    const result = sellStockManager(currentHoldings, symbol, sharesToSell, currentWeek, currentYear, STOCKS)
    if (!result.success) return { success: false, message: result.reason ?? 'Sale failed' }
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash + result.transaction!.amount,
        transactions: [...personalLife.finances.transactions, result.transaction!]
      },
      stockHoldings: result.updatedHoldings
    } as any)
    return { success: true, message: `Sold ${sharesToSell} shares of ${symbol} for $${result.proceeds.toLocaleString()}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])

  const startPersonalBusiness = useCallback((
    type: BusinessType,
    name: string,
    investmentAmount: number,
    ownershipPercent: number,
    location: string
  ): { success: boolean; message: string } => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    const rep = player?.reputation ?? 50
    const result = startBusinessManager(type, name, investmentAmount, ownershipPercent, location, personalLife.finances.liquidCash, rep, currentWeek, currentYear)
    if (!result.success) return { success: false, message: result.reason ?? 'Could not start business' }
    const currentVentures = (personalLife as any).businessVentures ?? []
    updatePersonalLife({
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - investmentAmount,
        transactions: [...personalLife.finances.transactions, result.transaction!]
      },
      businessVentures: [...currentVentures, result.business!]
    } as any)
    routeNotification({
      category: 'personalStaff.assistant',
      subject: 'Business Started',
      body: `You've started ${name} (${ownershipPercent}% ownership). Investment: $${investmentAmount.toLocaleString()}.`
    })
    return { success: true, message: `Started ${name}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, player?.reputation])

  const enrollInCourse = useCallback((catalogIndex: number): PurchaseResult => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const template = COURSE_CATALOG[catalogIndex]
    if (!template) return { success: false, message: 'Course not found' }
    
    const enrollmentCost = template.enrollmentFee
    if (personalLife.finances.liquidCash < enrollmentCost) {
      return { success: false, message: 'Insufficient funds for enrollment' }
    }
    
    const course: any = {
      ...template,
      id: `course_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      modulesCompleted: 0,
      currentGrade: 0,
      assignmentsCompleted: 0,
      examsRemaining: template.totalExams,
      certificateEarned: false,
      startDate: { week: currentWeek, year: currentYear }
    }
    
    const currentCourses = (personalLife as any).activeCourses || []
    
    const enrollTransaction = createTransaction(
      'expense',
      'education',
      enrollmentCost,
      `Course enrollment: ${template.name}`,
      currentWeek,
      currentYear
    )
    
    const newFinances = {
      ...personalLife.finances,
      liquidCash: personalLife.finances.liquidCash - enrollmentCost,
      transactions: [...personalLife.finances.transactions, enrollTransaction]
    }
    
    updatePersonalLife({
      finances: newFinances,
      activeCourses: [...currentCourses, course]
    } as any)
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const courseTimeCost = getActivityTimeCost('course_session')
    
    if (courseTimeCost.hours > 0) {
      consumeHoursFromBudget(courseTimeCost.hours, courseTimeCost.drain, `Enroll: ${template.name}`, 'course_session')
    }
    
    addPersonalCalendarEntry({
      name: `Course: ${template.name}`,
      description: `Enrolled in ${template.name}`,
      activityId: 'course_session',
      week: currentWeek,
      day: currentDay,
      duration: courseTimeCost.hours,
      drainLevel: courseTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'education',
      immediate: true
    })
    
    // === NOTIFICATION INTEGRATION ===
    routeNotification({
      category: 'personalStaff.instructor',
      subject: `Course Enrollment: ${template.name}`,
      body: `You've enrolled in ${template.name}. Total modules: ${template.totalModules}. Fee: $${enrollmentCost.toLocaleString()}. Good luck with your studies!`,
    })

    return { success: true, message: `Enrolled in ${template.name}`, cost: enrollmentCost }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  // ============================================
  // TIME-CONSUMING LIFESTYLE ACTIVITIES
  // ============================================

  const spendTimeWithPet = useCallback((petId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const pets = personalLife.assets?.pets || []
    const pet = pets.find((p: any) => p.id === petId)
    if (!pet) return { success: false, message: 'Pet not found' }
    
    const activity = getPetActivity(pet.type, pet.name)
    
    const consumed = consumeHoursFromBudget(
      activity.hoursRequired,
      activity.drainLevel,
      activity.name,
      activity.id
    )
    
    if (!consumed) {
      return { success: false, message: `Not enough hours today (need ${activity.hoursRequired}h)` }
    }
    
    // Update pet happiness + reduce owner stress
    const updatedPets = pets.map((p: any) => 
      p.id === petId 
        ? { ...p, happiness: clamp((p.happiness || 50) + (activity.benefits.petHappiness || 15), 0, 100) }
        : p
    )
    
    updatePersonalLife({
      assets: {
        ...personalLife.assets!,
        pets: updatedPets
      },
      health: {
        ...personalLife.health,
        stressLevel: clamp(personalLife.health.stressLevel - (activity.benefits.stressReduction || 8), 0, 100)
      }
    })
    
    // === CALENDAR INTEGRATION ===
    addPersonalCalendarEntry({
      name: `Pet Time: ${pet.name}`,
      description: `Spent quality time with ${pet.name} (${pet.type})`,
      activityId: activity.id,
      week: currentWeek,
      day: currentDay,
      duration: activity.hoursRequired,
      drainLevel: activity.drainLevel,
      calendarEntryType: 'personal',
      category: 'pet',
      immediate: true,
      effectsOnComplete: {
        petHappiness: activity.benefits.petHappiness || 15,
        stressReduction: activity.benefits.stressReduction || 8,
      }
    })

    return { success: true, message: `Spent quality time with ${pet.name}! (-${activity.benefits.stressReduction || 8} stress)` }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])

  const studyCourse = useCallback((courseId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const courses = (personalLife as any).activeCourses || []
    const courseIndex = courses.findIndex((c: any) => c.id === courseId)
    if (courseIndex === -1) return { success: false, message: 'Course not found' }
    
    const course = courses[courseIndex]
    
    // Already completed?
    if (course.modulesCompleted >= course.totalModules) {
      return { success: false, message: 'Course already completed!' }
    }
    
    const activity = getEducationActivity(course.name)
    
    const consumed = consumeHoursFromBudget(
      activity.hoursRequired,
      activity.drainLevel,
      activity.name,
      `${activity.id}_${courseId}`
    )
    
    if (!consumed) {
      return { success: false, message: `Not enough hours today (need ${activity.hoursRequired}h)` }
    }
    
    // Progress the course (15% of a module per session)
    const moduleProgressGain = activity.benefits.moduleProgress || 0.15
    const currentModuleProgress = course.currentModuleProgress || 0
    const newModuleProgress = currentModuleProgress + moduleProgressGain
    
    let newModulesCompleted = course.modulesCompleted
    let remainingProgress = newModuleProgress
    let completedModule = false
    
    if (newModuleProgress >= 1) {
      newModulesCompleted = Math.min(course.totalModules, course.modulesCompleted + 1)
      remainingProgress = newModuleProgress - 1
      completedModule = true
    }
    
    const updatedCourse = {
      ...course,
      modulesCompleted: newModulesCompleted,
      currentModuleProgress: remainingProgress
    }
    
    const newCourses = [...courses]
    newCourses[courseIndex] = updatedCourse
    
    updatePersonalLife({
      activeCourses: newCourses
    } as any)
    
    // === CALENDAR + NOTIFICATION INTEGRATION ===
    addPersonalCalendarEntry({
      name: `Study: ${course.name}`,
      description: `Study session for ${course.name} (Module ${newModulesCompleted}/${course.totalModules})`,
      activityId: `study_session_${courseId}`,
      week: currentWeek,
      day: currentDay,
      duration: activity.hoursRequired,
      drainLevel: activity.drainLevel,
      calendarEntryType: 'personal',
      category: 'education',
      immediate: true,
      effectsOnComplete: {
        moduleProgress: Math.round((activity.benefits.moduleProgress || 0.15) * 100),
      }
    })
    if (completedModule) {
      routeNotification({
        category: 'personalStaff.instructor',
        subject: `Course Progress: ${course.name}`,
        body: `You completed module ${newModulesCompleted} of ${course.totalModules} in ${course.name}. ${newModulesCompleted >= course.totalModules ? 'Congratulations on finishing the course!' : 'Keep up the great work!'}`,
      })
    }

    const message = completedModule
      ? `Completed module ${newModulesCompleted}/${course.totalModules} of ${course.name}!`
      : `Studied ${course.name} (${Math.round(remainingProgress * 100)}% to next module)`
    
    return { success: true, message }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])

  const doWorkout = useCallback((fitnessActivityId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const activity = FITNESS_ACTIVITIES.find(a => a.id === fitnessActivityId)
    if (!activity) return { success: false, message: 'Fitness activity not found' }
    
    // Check time-of-day period restriction
    const periodCheck = checkActivityPeriod(fitnessActivityId)
    if (!periodCheck.allowed) {
      return { success: false, message: periodCheck.reason || 'Not available at this time of day' }
    }
    
    const consumed = consumeHoursFromBudget(
      activity.hoursRequired,
      activity.drainLevel,
      activity.name,
      activity.id
    )
    
    if (!consumed) {
      return { success: false, message: `Not enough hours today (need ${activity.hoursRequired}h)` }
    }
    
    // Apply fitness & health benefits to personal life stats
    const currentFitness = personalLife.health.fitnessLevel ?? 50
    const currentHealth = personalLife.health.physicalHealth ?? 50
    
    updatePersonalLife({
      health: {
        ...personalLife.health,
        fitnessLevel: clamp(currentFitness + (activity.benefits.fitnessBonus || 0), 0, 100),
        physicalHealth: clamp(currentHealth + (activity.benefits.healthBonus || 0), 0, 100),
        stressLevel: clamp(personalLife.health.stressLevel - (activity.benefits.stressReduction || 0), 0, 100)
      }
    })
    
    // Also apply fitness to driver performance stats (player.stats.fitness)
    // This links personal life fitness activities to actual racing performance
    const { player } = useCareerStore.getState()
    if (player) {
      const fitnessBonus = (activity.benefits.fitnessBonus || 0) * 0.5 // Half the effect on driver stats (slower progression)
      const stressReduction = (activity.benefits.stressReduction || 0) * 0.3 // Partial stress relief
      
      useCareerStore.setState({
        player: {
          ...player,
          stats: {
            ...player.stats,
            fitness: clamp(player.stats.fitness + fitnessBonus, 0, 100)
          },
          mentalState: {
            ...player.mentalState,
            stress: clamp((player.mentalState.stress || 0) - stressReduction, 0, 100)
          }
        }
      })
    }
    
    // === CALENDAR INTEGRATION ===
    addPersonalCalendarEntry({
      name: `Workout: ${activity.name}`,
      description: `${activity.name} session (+${activity.benefits.fitnessBonus || 0} fitness, -${activity.benefits.stressReduction || 0} stress)`,
      activityId: activity.id,
      week: currentWeek,
      day: currentDay,
      duration: activity.hoursRequired,
      drainLevel: activity.drainLevel,
      calendarEntryType: 'personal',
      category: 'fitness',
      immediate: true,
      effectsOnComplete: {
        fitnessBonus: activity.benefits.fitnessBonus || 0,
        healthBonus: activity.benefits.healthBonus || 0,
        stressReduction: activity.benefits.stressReduction || 0,
      }
    })

    return { 
      success: true, 
      message: `Completed ${activity.name}! (+${activity.benefits.fitnessBonus || 0} fitness, -${activity.benefits.stressReduction || 0} stress)` 
    }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentDay])

  // Catalog accessors
  const getAvailableServices = useCallback(() => getServiceCatalog(), [])
  const getAvailableExperiencesCatalog = useCallback(() => getExperienceCatalog(), [])
  const getAvailableCollectiblesCatalog = useCallback(() => getCollectibleCatalog(), [])
  const getAvailablePets = useCallback(() => getPetCatalog(), [])
  const getAvailableWardrobe = useCallback(() => getWardrobeCatalog(), [])
  const getAvailableDiets = useCallback(() => getDietCatalog(), [])
  const getPropertyListings = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return []
    // Generate 40 listings across all global markets with full price range
    const budgetMin = 50000 // Show affordable options too
    const budgetMax = Math.max(personalLife.finances.liquidCash * 5, 5000000) // Show aspirational properties
    return generatePropertyListings(40, budgetMin, budgetMax)
  }, [getPersonalLife])
  const getCourseCatalogFn = useCallback(() => COURSE_CATALOG, [])
  
  // ============================================
  // SOCIAL ACTIONS
  // ============================================
  
  const seekEndorsements = useCallback(() => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const publicImage = personalLife.brand?.publicImage ?? 50
    
    // Try to generate an endorsement offer
    const categories = ['luxury_watches', 'automotive', 'fashion', 'technology', 'beverages']
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    const offer = generateEndorsementOffer(randomCategory, publicImage)
    
    if (!offer) {
      return { success: false, message: 'No endorsement offers available at this time' }
    }
    
    // Add pending endorsement to brand
    const newBrand = {
      ...personalLife.brand,
      endorsements: [...(personalLife.brand.endorsements || []), { ...offer, status: 'pending' as const }]
    }
    
    updatePersonalLife({ brand: newBrand })
    
    return {
      success: true,
      message: `${offer.brandName} is interested in an endorsement deal!`,
      offer: { brand: offer.brandName, value: offer.annualValue }
    }
  }, [getPersonalLife, updatePersonalLife])
  
  const acceptEndorsement = useCallback((endorsementId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const endorsementIndex = personalLife.brand.endorsements?.findIndex(e => e.id === endorsementId) ?? -1
    if (endorsementIndex === -1) {
      return { success: false, message: 'Endorsement not found' }
    }
    
    const endorsement = personalLife.brand.endorsements![endorsementIndex]
    
    // Use addEndorsement to properly update brand value and public image
    const updatedBrand = addEndorsement(personalLife.brand, {
      ...endorsement,
      status: 'active' as const
    })
    
    // Add to monthly income
    const monthlyValue = Math.floor(endorsement.annualValue / 12)
    
    // Also add a reputation event for signing the deal
    const endorsementBrand = addReputationEvent(updatedBrand, {
      type: 'positive',
      category: 'business',
      description: `Signed endorsement deal with ${endorsement.brandName}`,
      impact: endorsement.publicImageBonus ?? 2,
      date: { week: currentWeek, year: currentYear },
      decayWeeks: 10
    })

    updatePersonalLife({
      brand: endorsementBrand,
      finances: {
        ...personalLife.finances,
        monthlyIncome: {
          ...personalLife.finances.monthlyIncome,
          endorsements: (personalLife.finances.monthlyIncome.endorsements ?? 0) + monthlyValue
        }
      }
    })
    
    return { success: true, message: `Signed endorsement deal with ${endorsement.brandName}!` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const acceptMediaDeal = useCallback((deal: { type: string; platform: string; durationWeeks: number; weeklyPay: number; brandName: string }) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Use addMediaDeal to properly update brand and media presence
    const updatedBrand = addMediaDeal(personalLife.brand, {
      type: deal.type as any,
      platform: deal.platform,
      title: `${deal.brandName} ${deal.type}`,
      startDate: { week: currentWeek, year: currentYear },
      durationWeeks: deal.durationWeeks,
      weeklyPay: deal.weeklyPay,
      status: 'active'
    })
    
    const monthlyMediaIncome = Math.floor(deal.weeklyPay * 4)
    
    updatePersonalLife({
      brand: updatedBrand,
      finances: {
        ...personalLife.finances,
        monthlyIncome: {
          ...personalLife.finances.monthlyIncome,
          mediaDeals: (personalLife.finances.monthlyIncome.mediaDeals ?? 0) + monthlyMediaIncome
        }
      }
    })
    
    return { success: true, message: `Signed media deal: ${deal.brandName} ${deal.type}!` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const startFoundation = useCallback((name: string, cause: CharityCause, initialDonation: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    if (personalLife.finances.liquidCash < initialDonation) {
      return { success: false, message: 'Insufficient funds for foundation' }
    }
    
    const foundation = createFoundation(name, cause, initialDonation, currentWeek, currentYear)
    
    const transaction = createTransaction(
      'expense',
      'charity',
      initialDonation,
      `Founded ${name}`,
      currentWeek,
      currentYear,
      { taxDeductible: true }
    )
    
    const foundationBrand = addReputationEvent(personalLife.brand, {
      type: 'positive',
      category: 'charity',
      description: `Founded ${name} - a new charitable foundation`,
      impact: 5,
      date: { week: currentWeek, year: currentYear },
      decayWeeks: 12
    })
    
    updatePersonalLife({
      foundations: [...personalLife.foundations, foundation],
      brand: foundationBrand,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - initialDonation,
        taxDeductionsThisYear: (personalLife.finances.taxDeductionsThisYear || 0) + initialDonation,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    return { success: true, message: `Founded ${name}!` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const donateToFoundation = useCallback((foundationId: string, amount: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const foundationIndex = personalLife.foundations.findIndex(f => f.id === foundationId)
    if (foundationIndex === -1) {
      return { success: false, message: 'Foundation not found' }
    }
    
    if (personalLife.finances.liquidCash < amount) {
      return { success: false, message: 'Insufficient funds' }
    }
    
    const foundation = personalLife.foundations[foundationIndex]
    const newFoundations = [...personalLife.foundations]
    newFoundations[foundationIndex] = {
      ...foundation,
      totalDonated: foundation.totalDonated + amount,
      impactScore: clamp(foundation.impactScore + Math.floor(amount / 10000), 0, 100)
    }
    
    const transaction = createTransaction(
      'expense',
      'charity',
      amount,
      `Donation to ${foundation.name}`,
      currentWeek,
      currentYear,
      { taxDeductible: true }
    )
    
    updatePersonalLife({
      foundations: newFoundations,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - amount,
        taxDeductionsThisYear: personalLife.finances.taxDeductionsThisYear + amount,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    return { success: true, message: `Donated $${amount.toLocaleString()} to ${foundation.name}` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const planGala = useCallback((foundationId: string, budget: number) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const foundationIndex = personalLife.foundations.findIndex(f => f.id === foundationId)
    if (foundationIndex === -1) {
      return { success: false, message: 'Foundation not found' }
    }
    
    if (personalLife.finances.liquidCash < budget) {
      return { success: false, message: 'Insufficient funds for gala' }
    }
    
    const foundation = personalLife.foundations[foundationIndex]
    
    // Use hostCharityGala for proper fundraising, reputation, and donor calculation
    const guestCount = Math.max(20, Math.floor(budget / 500)) // Estimate guests from budget
    const galaResult = hostCharityGala(foundation, budget, guestCount, currentWeek, currentYear)
    
    // Update foundation with gala results
    const newFoundations = [...personalLife.foundations]
    newFoundations[foundationIndex] = {
      ...foundation,
      publicAwareness: clamp((foundation.publicAwareness ?? 0) + galaResult.reputationGain, 0, 100),
      annualGalaDate: { week: currentWeek, year: currentYear },
      totalRaised: (foundation.totalRaised ?? 0) + galaResult.amountRaised,
      events: [...(foundation.events ?? []), galaResult.event]
    }
    
    const transaction = createTransaction(
      'expense',
      'charity',
      budget,
      `Charity gala for ${foundation.name} (raised $${galaResult.amountRaised.toLocaleString()})`,
      currentWeek,
      currentYear,
      { taxDeductible: true }
    )
    
    // Galas boost public image based on actual fundraising results
    const galaBrand = addReputationEvent(personalLife.brand, {
      type: 'positive',
      category: 'charity',
      description: `Hosted a charity gala for ${foundation.name} - raised $${galaResult.amountRaised.toLocaleString()}`,
      impact: galaResult.reputationGain,
      date: { week: currentWeek, year: currentYear },
      decayWeeks: 10
    })
    
    updatePersonalLife({
      foundations: newFoundations,
      brand: galaBrand,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - budget,
        taxDeductionsThisYear: (personalLife.finances.taxDeductionsThisYear || 0) + budget,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const galaTimeCost = getActivityTimeCost('gala')
    
    if (galaTimeCost.hours > 0) {
      consumeHoursFromBudget(galaTimeCost.hours, galaTimeCost.drain, `Charity Gala: ${foundation.name}`, 'gala')
    }
    
    addPersonalCalendarEntry({
      name: `Charity Gala: ${foundation.name}`,
      description: `Hosted a charity gala for ${foundation.name}`,
      activityId: 'gala',
      week: currentWeek,
      day: currentDay,
      duration: galaTimeCost.hours,
      drainLevel: galaTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'social',
      immediate: true
    })
    
    // Send notification about gala (from PR/media)
    routeNotification({
      category: 'media_pr',
      subject: `Charity Gala - ${foundation.name}`,
      body: `Your charity gala for ${foundation.name} was a great success! The event has generated positive media coverage and increased public awareness of the foundation.`,
    })
    
    return { success: true, message: `Hosted a successful charity gala for ${foundation.name}!` }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry])
  
  const respondToScandal = useCallback((
    scandalId: string, 
    responseType: 'deny' | 'apologize' | 'no_comment' | 'legal_action' | 'spin'
  ) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const scandalIndex = personalLife.scandals.findIndex(s => s.id === scandalId)
    if (scandalIndex === -1) {
      return { success: false, message: 'Scandal not found' }
    }
    
    const scandal = personalLife.scandals[scandalIndex]
    
    if (scandal.hasResponded) {
      return { success: false, message: 'You have already responded to this scandal' }
    }
    
    const response = SCANDAL_RESPONSES[responseType]
    if (!response) {
      return { success: false, message: 'Invalid response type' }
    }
    
    // Calculate crisis management cost
    const baseCost = scandal.severity === 'catastrophic' ? 500000 :
                     scandal.severity === 'major' ? 200000 :
                     scandal.severity === 'moderate' ? 75000 : 25000
    const crisisCost = Math.floor(baseCost * response.costMultiplier)
    
    if (personalLife.finances.liquidCash < crisisCost) {
      return { success: false, message: `Insufficient funds. This response costs $${crisisCost.toLocaleString()}` }
    }
    
    // Calculate effectiveness based on whether the scandal has hard evidence (guilty proxy)
    const effectiveness = scandal.hasHardEvidence 
      ? response.effectivenessIfGuilty 
      : response.effectivenessIfInnocent
    
    // Check for backfire
    const backfired = Math.random() * 100 < response.riskOfBackfire
    
    // Calculate reputation impact
    let reputationChange = 0
    if (backfired) {
      // Backfire makes things worse
      reputationChange = -Math.floor(scandal.reputationDamage * 0.5)
    } else {
      // Successful response reduces damage based on effectiveness
      reputationChange = Math.floor(scandal.reputationDamage * (effectiveness / 100) * 0.3)
    }
    
    // Update scandal status
    const newScandals = [...personalLife.scandals]
    newScandals[scandalIndex] = {
      ...scandal,
      hasResponded: true,
      responseType,
      crisisManagementCost: crisisCost,
      status: backfired ? 'peak' : 'declining',
      publicAwareness: backfired 
        ? clamp(scandal.publicAwareness + 20, 0, 100)
        : clamp(scandal.publicAwareness - 10, 0, 100)
    }
    
    // Add transaction
    const transaction = createTransaction(
      'expense',
      'other',
      crisisCost,
      `Crisis management: ${scandal.name}`,
      currentWeek,
      currentYear
    )
    
    // Update state with gradual reputation change via reputation event
    const scandalBrand = addReputationEvent(personalLife.brand, {
      type: reputationChange + response.mediaReaction >= 0 ? 'positive' : 'negative',
      category: 'scandal',
      description: backfired 
        ? `Your ${response.name.toLowerCase()} strategy backfired on the ${scandal.name} scandal`
        : `You responded to the ${scandal.name} scandal with a ${response.name.toLowerCase()} approach`,
      impact: reputationChange + response.mediaReaction,
      date: { week: currentWeek, year: currentYear },
      decayWeeks: backfired ? 12 : 8
    })
    
    updatePersonalLife({
      scandals: newScandals,
      brand: scandalBrand,
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - crisisCost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === TIME BUDGET + NOTIFICATION INTEGRATION ===
    const scandalTimeCost = getActivityTimeCost('respond_scandal')
    if (scandalTimeCost.hours > 0) {
      consumeHoursFromBudget(scandalTimeCost.hours, scandalTimeCost.drain, `Scandal Response: ${scandal.name}`, 'respond_scandal')
    }
    addPersonalCalendarEntry({
      name: `Scandal Response: ${scandal.name}`,
      description: `Responded to scandal with ${response.name.toLowerCase()} strategy`,
      activityId: 'respond_scandal',
      week: currentWeek,
      day: currentDay,
      duration: scandalTimeCost.hours,
      drainLevel: scandalTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'personal',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: `Scandal Response Issued: ${scandal.name}`,
      body: backfired
        ? `Your ${response.name.toLowerCase()} strategy has backfired. The situation has intensified. We need to reassess our approach.`
        : `Your ${response.name.toLowerCase()} response to "${scandal.name}" has been issued. The scandal appears to be declining. Crisis management cost: $${crisisCost.toLocaleString()}.`,
      emailCategory: 'media',
      urgency: backfired ? 'high' : 'normal'
    })

    if (backfired) {
      return { 
        success: true, 
        message: `Your ${response.name.toLowerCase()} backfired! The scandal intensified and your reputation took additional damage.` 
      }
    }
    
    return { 
      success: true, 
      message: `You chose to ${response.name.toLowerCase()}. Spent $${crisisCost.toLocaleString()} on crisis management. The scandal is now declining.` 
    }
  }, [getPersonalLife, updatePersonalLife, consumeHoursFromBudget, addPersonalCalendarEntry, currentWeek, currentYear, currentDay])
  
  const resolveRivalryAction = useCallback((
    rivalryId: string,
    resolution: 'reconciliation' | 'total_victory' | 'defeat' | 'fade_away'
  ) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const rivalries = personalLife.rivalries || []
    const rivalryIndex = rivalries.findIndex((r: any) => r.id === rivalryId)
    if (rivalryIndex === -1) {
      return { success: false, message: 'Rivalry not found' }
    }
    
    const rivalry = rivalries[rivalryIndex]
    const result = resolveRivalry(rivalry, resolution)
    
    // Update rivalries list
    const newRivalries = [...rivalries]
    newRivalries[rivalryIndex] = result.finalRivalry
    
    // Apply reputation effect
    const updatedBrand = result.reputationEffect !== 0
      ? addReputationEvent(personalLife.brand, {
          type: result.reputationEffect > 0 ? 'positive' : 'negative',
          category: 'social',
          description: result.message,
          impact: Math.abs(result.reputationEffect),
          date: { week: currentWeek, year: currentYear },
          decayWeeks: 8
        })
      : personalLife.brand
    
    updatePersonalLife({
      rivalries: newRivalries,
      brand: updatedBrand
    })
    
    return { success: true, message: result.message }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const scheduleEvent = useCallback((eventType: string, eventWeek: number, options?: { tier?: 'standard' | 'vip' | 'vip_table'; invitedContactIds?: string[] }) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    // Find the event template
    const template = SOCIAL_EVENT_TEMPLATES.find(t => t.type === eventType)
    if (!template) {
      return { success: false, message: 'Unknown event type' }
    }
    
    // Check reputation requirements
    if (template.minimumReputation && personalLife.brand.publicImage < template.minimumReputation) {
      return { 
        success: false, 
        message: `You need at least ${template.minimumReputation} public image to attend this event` 
      }
    }
    
    const tier = options?.tier || 'standard'
    const invitedContactIds = options?.invitedContactIds || []
    const tierOpts = template.tierOptions
    
    // Calculate base cost (hosting multiplier if applicable)
    let baseCost = template.isHosting && template.hostingCostMultiplier 
      ? template.cost * template.hostingCostMultiplier 
      : template.cost
    
    // Apply tier cost multiplier
    if (tier === 'vip' && tierOpts) {
      baseCost = Math.floor(baseCost * tierOpts.vipCostMultiplier)
    } else if (tier === 'vip_table' && tierOpts) {
      baseCost = Math.floor(baseCost * tierOpts.tableCostMultiplier)
    }
    
    // Add plus-one costs
    const plusOneCost = tierOpts?.plusOneCost || 0
    const guestCost = invitedContactIds.length * plusOneCost
    const totalCost = baseCost + guestCost
    
    // Validate max plus-ones for the tier
    if (tierOpts && invitedContactIds.length > 0) {
      const maxGuests = tier === 'vip_table' ? tierOpts.tableMaxPlusOnes
        : tier === 'vip' ? tierOpts.vipMaxPlusOnes
        : tierOpts.maxPlusOnes
      if (invitedContactIds.length > maxGuests) {
        return { success: false, message: `This tier allows a maximum of ${maxGuests} guests` }
      }
    }
    
    if (personalLife.finances.liquidCash < totalCost) {
      return { success: false, message: `Insufficient funds. Total cost: $${totalCost.toLocaleString()}` }
    }
    
    // Check if already have too many events scheduled
    const existingEvents = personalLife.upcomingEvents || []
    if (existingEvents.length >= 5) {
      return { success: false, message: 'You have too many events scheduled. Attend some first before adding more.' }
    }
    
    // Create the event with tier and invited contacts
    const newEvent: SocialEvent = {
      id: generateId(),
      ...template,
      date: { week: eventWeek, year: currentYear },
      attendanceTier: tier,
      invitedContactIds: invitedContactIds.length > 0 ? invitedContactIds : undefined
    }
    
    // Build guest description for notifications
    const guestNames: string[] = []
    if (invitedContactIds.length > 0) {
      const contacts = personalLife.contacts || []
      for (const cid of invitedContactIds) {
        const c = contacts.find((ct: any) => ct.id === cid)
        if (c) guestNames.push(c.name)
      }
    }
    
    // Add transaction
    const tierLabel = tier === 'vip' ? ' (VIP)' : tier === 'vip_table' ? ' (VIP Table)' : ''
    const transaction = createTransaction(
      'expense',
      'entertainment',
      totalCost,
      `Event: ${template.name}${tierLabel}`,
      currentWeek,
      currentYear
    )
    
    updatePersonalLife({
      upcomingEvents: [...existingEvents, newEvent],
      finances: {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash - totalCost,
        transactions: [...personalLife.finances.transactions, transaction]
      }
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    
    // Add to the game calendar as a ScheduledActivity
    const timeCost = getActivityTimeCost('social_event')
    addPersonalCalendarEntry({
      name: template.name,
      description: template.description || `Social event: ${template.name}`,
      activityId: `social_event_${eventType}`,
      week: eventWeek,
      day: 6, // Social events default to Saturday
      duration: timeCost.hours,
      drainLevel: timeCost.drain,
      calendarEntryType: 'personal',
      category: 'social'
    })
    
    // Send notification via the routing system (phone from friend/event host)
    const guestInfo = guestNames.length > 0 ? ` Guests: ${guestNames.join(', ')}.` : ''
    routeNotification({
      category: 'social_invitation',
      subject: `${template.name}${tierLabel} - Confirmed`,
      body: `You're all set for ${template.name} in Week ${eventWeek}!${guestInfo} Looking forward to seeing you there.`,
      degradedBody: `Event confirmed for Week ${eventWeek}.`
    })
    
    return { 
      success: true, 
      message: `Scheduled ${template.name}${tierLabel} for Week ${eventWeek}. Cost: $${totalCost.toLocaleString()}${guestNames.length > 0 ? ` (with ${guestNames.join(', ')})` : ''}` 
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear, addPersonalCalendarEntry])
  
  const dismissEvent = useCallback((eventId: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const events = personalLife.upcomingEvents || []
    const eventToRemove = events.find(e => e.id === eventId)
    if (!eventToRemove) return { success: false, message: 'Event not found' }
    
    updatePersonalLife({
      upcomingEvents: events.filter(e => e.id !== eventId)
    })
    
    return { success: true, message: `Declined invitation to ${eventToRemove.name}` }
  }, [getPersonalLife, updatePersonalLife])
  
  const changePrivacyLevel = useCallback((newLevel: 'open_book' | 'balanced' | 'private' | 'reclusive') => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const currentLevel = personalLife.brand.privacyLevel || 'balanced'
    if (currentLevel === newLevel) return { success: false, message: 'Already at this privacy level' }
    
    const levelNames: Record<string, string> = {
      open_book: 'Open Book',
      balanced: 'Balanced',
      private: 'Private',
      reclusive: 'Reclusive'
    }
    
    updatePersonalLife({
      brand: {
        ...personalLife.brand,
        privacyLevel: newLevel
      }
    })
    
    return { success: true, message: `Privacy level changed to ${levelNames[newLevel]}` }
  }, [getPersonalLife, updatePersonalLife])
  
  const interactWithContactAction = useCallback((contactId: string, quality: 'poor' | 'neutral' | 'good' | 'excellent') => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const contacts = personalLife.contacts || []
    const contactIdx = contacts.findIndex(c => c.id === contactId)
    if (contactIdx === -1) return { success: false, message: 'Contact not found' }
    
    const contact = contacts[contactIdx]
    const updated = interactWithContact(contact, quality, currentWeek, currentYear)
    
    const updatedContacts = [...contacts]
    updatedContacts[contactIdx] = updated
    
    updatePersonalLife({ contacts: updatedContacts })
    
    const qualityLabels: Record<string, string> = { poor: 'briefly', neutral: 'casually', good: 'well', excellent: 'extensively' }
    const relChange = updated.relationshipLevel - contact.relationshipLevel
    return { 
      success: true, 
      message: `Spent time ${qualityLabels[quality]} with ${contact.name}. Relationship ${relChange >= 0 ? '+' : ''}${relChange}` 
    }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  const askContactForFavorAction = useCallback((contactId: string, favorType: string) => {
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized' }
    
    const contacts = personalLife.contacts || []
    const contactIdx = contacts.findIndex(c => c.id === contactId)
    if (contactIdx === -1) return { success: false, message: 'Contact not found' }
    
    const contact = contacts[contactIdx]
    const result = askContactForFavor(contact, favorType as keyof typeof contact.benefits)
    
    const updatedContacts = [...contacts]
    updatedContacts[contactIdx] = result.contact
    
    // Apply tangible gameplay effects based on favor type
    let cashBonus = 0
    let reputationEffect = false
    
    if (result.success && result.benefitValue > 0) {
      switch (favorType) {
        case 'investmentTips': {
          // Small cash bonus
          cashBonus = Math.floor(result.benefitValue * 500 + Math.random() * 2000)
          break
        }
        case 'mediaInfluence': {
          // Add positive reputation event
          reputationEffect = true
          break
        }
        case 'legalHelp': {
          // Reduce any active scandal impact: handled via message
          break
        }
        case 'sponsorConnections': {
          // Small endorsement opportunity: handled via message
          break
        }
      }
    }
    
    const updates: Partial<typeof personalLife> = { contacts: updatedContacts }
    
    if (cashBonus > 0) {
      updates.finances = {
        ...personalLife.finances,
        liquidCash: personalLife.finances.liquidCash + cashBonus
      }
    }
    
    if (reputationEffect && result.success) {
      updates.brand = addReputationEvent(personalLife.brand, {
        type: 'positive',
        category: 'personal',
        description: `${contact.name} put in a good word for you in the media`,
        impact: Math.round(result.benefitValue * 0.15),
        date: { week: currentWeek, year: currentYear },
        decayWeeks: 6
      })
    }
    
    updatePersonalLife(updates)
    
    let resultMessage = result.message
    if (result.success && cashBonus > 0) {
      resultMessage += ` Received $${cashBonus.toLocaleString()} from the tip.`
    }
    if (result.success && reputationEffect) {
      resultMessage += ` Your public image got a boost.`
    }
    
    return { success: result.success, message: resultMessage, benefitValue: result.benefitValue }
  }, [getPersonalLife, updatePersonalLife, currentWeek, currentYear])
  
  // ============================================
  // CONTACT SOCIAL ACTIONS (unified gifts/hangouts/dates/invites/business)
  // ============================================
  
  const executeSocialAction = useCallback((contactId: string, actionId: string): { success: boolean; message: string } => {
    const action = getSocialActionById(actionId)
    if (!action) return { success: false, message: 'Unknown action.' }
    
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized.' }
    
    // Find the contact
    const messaging = careerState?.messaging
    if (!messaging) return { success: false, message: 'Messaging not initialized.' }
    const contact = messaging.contacts.find(c => c.id === contactId)
    if (!contact) return { success: false, message: 'Contact not found.' }
    
    // Validate contact type
    if (!action.availableFor.includes(contact.type)) {
      return { success: false, message: 'This action isn\'t available for this contact.' }
    }
    
    // Validate relationship level
    if (action.minRelationship && contact.relationshipLevel < action.minRelationship) {
      return { success: false, message: `Your relationship needs to be at least ${action.minRelationship}% for this.` }
    }
    
    // Validate cooldown
    if (action.cooldownWeeks) {
      const { getSocialActionCooldown } = useCareerStore.getState()
      const weeksSinceLast = getSocialActionCooldown(contactId, actionId)
      if (weeksSinceLast < action.cooldownWeeks) {
        const remaining = action.cooldownWeeks - weeksSinceLast
        return { success: false, message: `You need to wait ${remaining} more week${remaining !== 1 ? 's' : ''} before doing this again.` }
      }
    }
    
    // Validate affordability
    if (action.cost > 0 && personalLife.finances.liquidCash < action.cost) {
      return { success: false, message: `You can't afford this ($${action.cost.toLocaleString()} needed).` }
    }
    
    // Validate time budget (for activities, not gifts)
    if (action.timeCost > 0 && !canAffordTime(action.timeCost)) {
      return { success: false, message: 'You don\'t have enough free time today.' }
    }
    
    // === EXECUTE ===
    
    // 1. Deduct cost
    if (action.cost > 0) {
      const transaction = createTransaction(
        'expense',
        'entertainment',
        action.cost,
        `${action.category === 'gift' ? 'Gift' : 'Social'}: ${action.name} (${contact.name})`,
        currentWeek,
        currentYear
      )
      updatePersonalLife({
        finances: {
          ...personalLife.finances,
          liquidCash: personalLife.finances.liquidCash - action.cost,
          transactions: [...personalLife.finances.transactions, transaction]
        }
      })
    }
    
    // 2. Consume time from day budget
    if (action.timeCost > 0) {
      const timeCost = getActivityTimeCost(action.id)
      consumeHoursFromBudget(
        timeCost.hours || action.timeCost,
        timeCost.drain || 'low',
        `${action.name} with ${contact.name}`,
        action.id
      )
    }
    
    // 3. Apply relationship meter effects
    const isRomantic = contact.type === 'partner' || contact.type === 'potential_date'
    const effects: { affection?: number; romance?: number; trust?: number } = {
      affection: action.effects.affection || undefined,
      trust: action.effects.trust || undefined,
    }
    if (isRomantic && action.effects.romance) {
      effects.romance = action.effects.romance
    }
    
    const { updateRelationshipMeters, recordSocialAction } = useCareerStore.getState()
    updateRelationshipMeters(contactId, effects)
    
    // 4. Record cooldown
    recordSocialAction(contactId, actionId)
    
    // 4b. Event invite integration — attach contact to next matching event
    if (action.category === 'event_invite') {
      const freshPersonalLife = getPersonalLife()
      if (freshPersonalLife) {
        const upcomingEvents = freshPersonalLife.upcomingEvents || []
        let targetEvent = null as any
        
        if (actionId === 'invite_race') {
          // Look for any upcoming event, or just record as a standalone gesture
          targetEvent = upcomingEvents.find((e: any) => e.date?.week > currentWeek || e.date?.year > currentYear)
        } else if (actionId === 'invite_gala') {
          targetEvent = upcomingEvents.find((e: any) =>
            (e.type === 'gala' || e.type === 'charity_dinner' || e.type === 'sponsor_reception' || e.type === 'networking_event') &&
            (e.date?.week > currentWeek || e.date?.year > currentYear)
          )
        } else if (actionId === 'invite_charity') {
          targetEvent = upcomingEvents.find((e: any) =>
            (e.type === 'charity_dinner' || e.type === 'charity_event') &&
            (e.date?.week > currentWeek || e.date?.year > currentYear)
          )
        }
        
        if (targetEvent) {
          const existingGuests = targetEvent.invitedContactIds || []
          if (!existingGuests.includes(contactId)) {
            updatePersonalLife({
              upcomingEvents: upcomingEvents.map((e: any) =>
                e.id === targetEvent.id
                  ? { ...e, invitedContactIds: [...existingGuests, contactId] }
                  : e
              )
            })
          }
        }
      }
    }
    
    // 5. Add calendar entry (if time-consuming)
    if (action.timeCost > 0) {
      // Map social action sub-category to the appropriate ActivityCategory
      const socialCatMap: Record<string, string> = {
        romantic: 'romance', dining: 'social', casual: 'social',
        gift: 'social', event_invite: 'social', professional: 'social',
      }
      addPersonalCalendarEntry({
        name: `${action.name} with ${contact.name}`,
        description: action.description,
        activityId: action.id,
        week: currentWeek,
        day: currentDay,
        duration: action.timeCost,
        drainLevel: 'low',
        calendarEntryType: 'personal',
        category: (socialCatMap[action.category] || 'social') as any,
        immediate: true
      })
    }
    
    // Build result message
    const effectParts: string[] = []
    if (action.effects.affection) effectParts.push(`+${action.effects.affection} Affection`)
    if (action.effects.trust) effectParts.push(`+${action.effects.trust} Trust`)
    if (isRomantic && action.effects.romance) effectParts.push(`+${action.effects.romance} Romance`)
    const effectStr = effectParts.length > 0 ? ` (${effectParts.join(', ')})` : ''
    
    const verb = action.category === 'gift' ? 'Sent' : 'Enjoyed'
    return {
      success: true,
      message: `${verb} ${action.name} with ${contact.name}!${effectStr}`
    }
  }, [getPersonalLife, updatePersonalLife, careerState?.messaging, currentWeek, currentYear, currentDay, consumeHoursFromBudget, addPersonalCalendarEntry, canAffordTime])
  
  // ============================================
  // SCHEDULE SOCIAL ACTION (for time-consuming activities — effects apply on completion day)
  // ============================================
  
  const scheduleSocialAction = useCallback((contactId: string, actionId: string, week: number, day: number): { success: boolean; message: string } => {
    const action = getSocialActionById(actionId)
    if (!action) return { success: false, message: 'Unknown action.' }
    
    const personalLife = getPersonalLife()
    if (!personalLife) return { success: false, message: 'Personal life not initialized.' }
    
    // Find the contact
    const messaging = careerState?.messaging
    if (!messaging) return { success: false, message: 'Messaging not initialized.' }
    const contact = messaging.contacts.find(c => c.id === contactId)
    if (!contact) return { success: false, message: 'Contact not found.' }
    
    // Validate contact type
    if (!action.availableFor.includes(contact.type)) {
      return { success: false, message: 'This action isn\'t available for this contact.' }
    }
    
    // Validate relationship level
    if (action.minRelationship && contact.relationshipLevel < action.minRelationship) {
      return { success: false, message: `Your relationship needs to be at least ${action.minRelationship}% for this.` }
    }
    
    // Validate cooldown
    if (action.cooldownWeeks) {
      const { getSocialActionCooldown } = useCareerStore.getState()
      const weeksSinceLast = getSocialActionCooldown(contactId, actionId)
      if (weeksSinceLast < action.cooldownWeeks) {
        const remaining = action.cooldownWeeks - weeksSinceLast
        return { success: false, message: `You need to wait ${remaining} more week${remaining !== 1 ? 's' : ''} before doing this again.` }
      }
    }
    
    // Validate affordability (check they CAN afford it — cost deducted on completion)
    if (action.cost > 0 && personalLife.finances.liquidCash < action.cost) {
      return { success: false, message: `You can't afford this ($${action.cost.toLocaleString()} needed).` }
    }
    
    // For gifts (no time cost), execute immediately
    if (action.timeCost <= 0) {
      return executeSocialAction(contactId, actionId)
    }
    
    // Build romantic effects
    const isRomantic = contact.type === 'partner' || contact.type === 'potential_date'
    const effects: { affection?: number; trust?: number; romance?: number } = {
      affection: action.effects.affection || undefined,
      trust: action.effects.trust || undefined,
    }
    if (isRomantic && action.effects.romance) {
      effects.romance = action.effects.romance
    }
    
    // Schedule via store
    const scheduled = storeScheduleSocialAction({
      actionId: action.id,
      actionName: action.name,
      contactId,
      contactName: contact.name,
      description: action.description,
      cost: action.cost,
      timeCost: action.timeCost,
      effects,
      category: action.category,
      week,
      day,
    })
    
    if (!scheduled) {
      return { success: false, message: 'That day is too full — pick another day.' }
    }
    
    // Event invite integration — still attach contact immediately for planning purposes
    if (action.category === 'event_invite') {
      const freshPersonalLife = getPersonalLife()
      if (freshPersonalLife) {
        const upcomingEvents = freshPersonalLife.upcomingEvents || []
        let targetEvent = null as any
        
        if (actionId === 'invite_race') {
          targetEvent = upcomingEvents.find((e: any) => e.date?.week > currentWeek || e.date?.year > currentYear)
        } else if (actionId === 'invite_gala') {
          targetEvent = upcomingEvents.find((e: any) =>
            (e.type === 'gala' || e.type === 'charity_dinner' || e.type === 'sponsor_reception' || e.type === 'networking_event') &&
            (e.date?.week > currentWeek || e.date?.year > currentYear)
          )
        } else if (actionId === 'invite_charity') {
          targetEvent = upcomingEvents.find((e: any) =>
            (e.type === 'charity_dinner' || e.type === 'charity_event') &&
            (e.date?.week > currentWeek || e.date?.year > currentYear)
          )
        }
        
        if (targetEvent) {
          const existingGuests = targetEvent.invitedContactIds || []
          if (!existingGuests.includes(contactId)) {
            updatePersonalLife({
              upcomingEvents: upcomingEvents.map((e: any) =>
                e.id === targetEvent.id
                  ? { ...e, invitedContactIds: [...existingGuests, contactId] }
                  : e
              )
            })
          }
        }
      }
    }
    
    // Build result message
    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayLabel = dayNames[day] || `Day ${day}`
    return {
      success: true,
      message: `Scheduled ${action.name} with ${contact.name} for ${dayLabel}, Week ${week}`
    }
  }, [getPersonalLife, updatePersonalLife, careerState?.messaging, currentWeek, currentYear, storeScheduleSocialAction, executeSocialAction])

  return {
    // Finance Actions
    injectCapital,
    withdrawFunds,
    setOwnerSalary,
    seekInvestors,
    acceptInvestorOffer,
    
    // Family Actions - Partner
    planDate,
    proposeToPartner,
    planWedding,
    giveGift,
    exploreDatingScene,
    
    // Family Actions - Children
    spendTimeWithChild,
    startChildRacing,
    announcePregnancy,
    haveChild,
    getPregnancyStatus,
    
    // Lifestyle Actions
    upgradeHealthcare,
    treatHealthCondition,
    startHobby,
    practiceHobby,
    quitHobby,
    hireStaff,
    fireStaff,
    giveStaffRaise: giveStaffRaiseAction,
    giveStaffBonus: giveStaffBonusAction,
    requestStaffReferral: requestStaffReferralAction,
    upgradeLifestyle,
    
    // Lifestyle Asset Actions
    buyVehicle,
    sellOwnedVehicle,
    setAsPrimaryVehicle,
    buyFurnishing,
    sellOwnedFurnishing,
    joinClubMembership,
    cancelClubMembership,
    
    // New Asset Actions
    subscribeToService,
    cancelServiceSubscription,
    bookLuxuryExperience,
    buyCollectible,
    sellOwnedCollectible,
    adoptNewPet,
    rehomeOwnedPet,
    buyWardrobeItem: buyWardrobeItemAction,
    sellOwnedWardrobeItem,
    subscribeToDiet,
    cancelDietPlan,
    buyProperty,
    sellOwnedProperty,
    buyStock,
    sellStock,
    startPersonalBusiness,
    enrollInCourse,
    
    // Time-Consuming Lifestyle Activities
    spendTimeWithPet,
    studyCourse,
    doWorkout,
    getAvailableFitnessActivities: () => FITNESS_ACTIVITIES,
    getHobbyActivityInfo: (hobbyType: string, hobbyName: string) => getHobbyActivity(hobbyType as HobbyType, hobbyName),
    getPetActivityInfo: (petType: string, petName: string) => getPetActivity(petType as any, petName),
    
    // Catalogs
    getAvailableVehicles,
    getAvailableMemberships,
    getAvailableFurnishings,
    getAvailableServices,
    getAvailableExperiences: getAvailableExperiencesCatalog,
    getAvailableCollectibles: getAvailableCollectiblesCatalog,
    getAvailablePets,
    getAvailableWardrobe,
    getAvailableDiets,
    getPropertyListings,
    getCourseCatalog: getCourseCatalogFn,
    getLifestyleScoreBreakdown,
    
    // Social Actions
    seekEndorsements,
    acceptEndorsement,
    startFoundation,
    donateToFoundation,
    planGala,
    respondToScandal,
    resolveRivalryAction,
    scheduleEvent,
    dismissEvent,
    acceptMediaDeal,
    changePrivacyLevel,
    interactWithContactAction,
    askContactForFavorAction,
    
    // Contact Social Actions
    executeSocialAction,
    scheduleSocialAction,
    
    // Period validation
    checkActivityPeriod
  }
}
