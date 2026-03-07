# TypeScript remaining errors – repair plan

**Generated:** From `npx tsc --noEmit` output.  
**Total:** ~2,342 errors across 114 files.  
**Constraint:** Use **StrReplace** only; no scripts or bulk file-modifying commands.

---

## 1. Verification

- **Check:** `cd "c:\Users\st3ph\Carrer Mod"; npx tsc --noEmit`
- **Full output:** `tsc_errors.txt` (project root) for line-by-line errors.

---

## 2. Error counts by file (high → low)

| Count | File |
|------:|------|
| 219 | `src/screens/RaceDay/index.tsx` |
| 127 | `src/screens/Garage/index.tsx` |
| 113 | `src/components/personal/VacationPlanner.tsx` |
| 110 | `src/screens/Paddock/DriversTab.tsx` |
| 102 | `src/components/finances/LoansPanel.tsx` |
| 95 | `src/screens/Phone/index.tsx` |
| 87 | `src/screens/Calendar/components/EventGameplayModal.tsx` |
| 87 | `src/screens/Marketplace/index.tsx` |
| 81 | `src/screens/Paddock/TeamsTab.tsx` |
| 80 | `src/screens/Calendar/index.tsx` |
| 77 | `src/screens/Facilities/index.tsx` |
| 76 | `src/components/GOATProgress.tsx` |
| 75 | `src/components/finances/TeamFinancesDashboard.tsx` |
| 56 | `src/components/logistics/PartsInventoryDashboard.tsx` |
| 55 | `src/screens/Settings/index.tsx` |
| 50 | `src/screens/CareerCreation/index.tsx` |
| 49 | `src/components/logistics/ManufacturingQueue.tsx` |
| 49 | `src/screens/Finances/index.tsx` |
| 46 | `src/simulation/logistics/raceAllocation.ts` |
| 46 | `src/screens/Contracts/index.tsx` |
| 45 | `src/components/finances/TransactionHistory.tsx` |
| 38 | `src/components/logistics/RaceAllocationPanel.tsx` |
| 36 | `src/screens/Paddock/ChampionshipsTab.tsx` |
| 31 | `src/types/personalLife.ts` |
| 28 | `src/components/personal/SocialPanel.tsx` |
| 26 | `src/simulation/personal/lifestyleAssetsManager.ts` |
| 25 | `src/simulation/personal/lifestyleManager.ts` |
| 25 | `src/components/personal/LifestylePanel.tsx` |
| 23 | `src/screens/Calendar/components/DayDetailPanel.tsx` |
| 22 | `src/hooks/usePersonalLifeActions.ts` |
| 20 | `src/simulation/staffMarket/index.ts` |
| 19 | `src/screens/Stats/index.tsx` |
| 18 | `src/components/Objectives/ObjectivesPanel.tsx` |
| 15 | `src/simulation/personal/relationshipEvents.ts` |
| 14 | `src/screens/Emails/index.tsx` |
| 14 | `src/components/media/InterviewModal.tsx` |
| 13 | `src/components/opportunities/OpportunityResponseModal.tsx` |
| 12 | `src/App.tsx` |
| 12 | `src/simulation/finances/index.ts` |
| 11 | `src/simulation/emailGeneration.ts` |
| 10 | `src/components/media/ComposePostModal.tsx` |
| 10 | `src/components/ui/index.ts` |
| 10 | `src/simulation/weeklySystemsProcessor.ts` |
| 10 | `src/screens/index.ts` |
| 9 | `src/simulation/finances/investments.ts` |
| 8 | `src/simulation/logistics/partsShipping.ts` |
| 7 | `src/components/personal/PersonalLifeDashboard.tsx` |
| 7 | `src/data/lifestyle-config.ts` |
| 7 | `src/data/lifestyle-assets-config.ts` |
| 7 | `src/utils/personalLifeHelpers.ts` |
| 6 | `src/components/ui/WorldMap.tsx` |
| 5 | `src/simulation/personal/socialEventsManager.ts` |
| 4 | `src/simulation/finances/teamFinances.ts` |
| 3 | `src/components/owner/index.ts` |
| 3 | `src/simulation/events/expandedChains.ts` |
| 3 | `src/screens/Scouting/index.tsx` |
| 3 | `src/services/familyBridgeService.ts` |
| 3 | `src/screens/SponsorMarket/index.tsx` |
| 3 | `src/hooks/index.ts` |
| 3 | `src/screens/Calendar/components/index.ts` |
| 3 | `src/screens/Paddock/ManufacturersTab.tsx` |
| 2 | Multiple (Layout, dialogueAI, media/index, PersonalLife/Social, Tutorial, FinancialCharts, negotiation, Wealth) |
| 1 | Multiple (portfolioManager, family-config, weeklyProcessing, real-driver-facts, BudgetAllocationPanel, CalendarDayCell, layout/index, finances/index, relationshipManager, health/index, FamilyPanel, DayAdvanceControls, WealthOverview, usePersonalLifeState, NewsTab, PersonalLife/index, Lifestyle, NegotiationModal, Investments, GameCard, worldContactService, opportunities/index, contactService, Merchandise) |

---

## 3. Recurring patterns

### 3.1 App and default vs named exports (12 errors in App.tsx)

- **App.tsx** expects **named** exports but many screens use **default** export.
- Fix either:
  - **Option A:** In App: `import RaceDay from "./screens/RaceDay"` (and similar for Contracts, Media, SponsorMarket), and fix missing exports for: `useAutosave`, `Home`, `Stats`, `SeasonEnd`, `CareerCreation`, `Logs`, `HowToPlay`, `Manufacturing`.
  - **Option B:** In each screen: add `export { X }` (or rename default to named) and fix hooks/screens that don’t export the expected name.
- **Recommendation:** Option A in App (use default imports where the module has `export default`) and fix the few modules that are missing the exported name.

### 3.2 Barrel / index files

- **screens/index.ts**, **hooks/index.ts**, **components/ui/index.ts**, **components/finances/index.ts**, **components/layout/index.ts**, **components/owner/index.ts**, **components/media/index.ts**, **components/opportunities/index.ts**  
- Typical issues: re-exporting a default as a named member (e.g. `export { X } from './Y'` when `Y` has `export default X`) or missing/incorrect exports. Fix the barrel to match how the target file exports (default vs named).

### 3.3 Missing imports (most files)

- **Cannot find name 'X'** → add import from the correct module (store, `@/components/ui`, `lucide-react`, `@/data/*`, `@/simulation/*`, etc.).
- **Module has no exported member 'X'** → fix the exporting file (add/export `X`) or fix the importing file (use the name that is actually exported, or use default import).

### 3.4 Implicit `any` (TS7006)

- Add types to parameters and variables (callbacks, `.map`/`.filter` args, props).
- Often in: LoansPanel, TransactionHistory, ManufacturingQueue, PartsInventoryDashboard, GOATProgress, etc.

### 3.5 Type-only vs value imports

- If a name is used as a value (e.g. component, function, constant) it must be a **value** import, not `import type`.
- Already handled in handover for: SocialPanel, VacationPlanner, portfolioManager, lifestyleAssetsManager; apply same rule elsewhere if needed.

### 3.6 Personal-life and lifestyle types (31 in `types/personalLife.ts` + related)

- Many “Cannot find name” in `personalLife.ts`: `SocialBio`, `DeepHobby`, `HobbyLesson`, `Course`, `Certification`, `Book`, `Collection`, `CollectionEvent`, `SocialMediaProfile`, `SocialPost`, `TrollEncounter`, `PrivacyState`, `PaparazziSighting`, `LeakedStory`, `BookDeal`, `DocumentaryDeal`, `PodcastDeal`, `SpeakingEngagement`, `CauseSupport`, `PoliticalStance`, `ActivismEvent`, `Vacation`, `LifestyleAssets`, `LifestyleScoreBreakdown`.
- Fix by: defining these in a data/types module and importing them in `personalLife.ts`, or moving the definitions into `personalLife.ts`.

### 3.7 Simulation layer

- **raceAllocation.ts**, **staffMarket/index.ts**, **finances/index.ts**, **emailGeneration.ts**, **weeklySystemsProcessor.ts**, **investments.ts**, **partsShipping.ts**, **teamFinances.ts**, **expandedChains.ts**, **lifestyleAssetsManager.ts**, **lifestyleManager.ts**, **relationshipEvents.ts**, **relationshipManager.ts**
- Fix missing or wrong exports/imports so that callers (e.g. careerStore, screens) see the correct types and functions.

---

## 4. Suggested order of work (by impact)

### Phase A – Entry and barrels (fast wins)

1. **App.tsx** (12) – Switch to default imports where screens use `export default`; fix `useAutosave`, `Home`, `Stats`, `SeasonEnd`, `CareerCreation`, `Logs`, `HowToPlay`, `Manufacturing` (export or import correctly).
2. **screens/index.ts** (10) – Re-exports: use default where applicable.
3. **hooks/index.ts** (3), **components/ui/index.ts** (10), **components/finances/index.ts** (1), **components/layout/index.ts** (1), **components/owner/index.ts** (3), **components/media/index.ts** (2), **components/opportunities/index.ts** (1) – Align barrel exports with actual module exports.

### Phase B – Types and data (unblocks many files)

4. **src/types/personalLife.ts** (31) – Add or import missing types (`SocialBio`, `DeepHobby`, etc.).
5. **src/data/lifestyle-config.ts** (7), **lifestyle-assets-config.ts** (7) – Export types/values that `personalLife.ts`, `utils/personalLifeHelpers.ts`, and lifestyle components expect.
6. **src/utils/personalLifeHelpers.ts** (7) – Fix `Hobby`/`PersonalStaff`/`StaffRole` imports and `LifestyleLevel` index usage.

### Phase C – Finances (high count, shared UI)

7. **LoansPanel.tsx** (102) – Add: `formatCurrency`, `CreditLine`, `PrivateInvestor`, `TeamTier`, `BANK_LOAN_TERMS_BY_TIER`, `LoanApplicationResult`, `calculateLoanWeeklyPayment`, `applyForBankLoan`, `Modal`, `PRIVATE_INVESTOR_CONFIG_BY_TIER`, `InvestorOfferResult`, `generateInvestorOffer`, `useToast`, `LoansState`, `createDefaultExtendedFinancialState`, `TeamTransaction`, `getActivityTimeCost`, `applyForCreditLine`, `routeNotification`, `CreditScoreGauge`, `Landmark`, `CreditCard`, `Users`, `Wallet`, `Target`, `LoansPanelProps`; fix prop names `_currentWeek`/`_currentYear`; type callbacks.
8. **TeamFinancesDashboard.tsx** (75) – Add missing UI/store/data imports (Tabs, TabsList, TabsTrigger, TabsContent, Modal, useToast, TeamSponsorDeal, TeamTier, calculateCostCapStatus, calculateTeamRunway, Wallet, Receipt, FACILITY_COSTS_BY_TIER, DEVELOPMENT_COSTS_BY_TIER, getSponsorSlotLabel, Trophy, Award, Factory, Coins, CreditCard, FlaskConical, Truck, Megaphone, BudgetAllocationPanel, FinancialCharts, TransactionHistory, RunwayStatus, Gauge, CostCapStatus, Shield, formatCurrency, TeamTransaction, ArrowUpRight, ArrowDownRight, TRANSACTION_CATEGORY_LABELS, SponsorLogo, getSponsorLogo, Target); fix index types for status maps.
9. **TransactionHistory.tsx** (45) – Add props/state: `transactions`, `typeFilter`, `categoryFilter`, `searchQuery`, `setSearchQuery`, `setTypeFilter`, `setCategoryFilter`, `FilterType`, `TeamTransactionCategory`, `CATEGORY_LABELS`, `CATEGORY_COLORS`, `formatCurrency`, `Tag`, `ArrowUpCircle`, `ArrowDownCircle`; type comparators and list items.
10. **BudgetAllocationPanel.tsx** (1), **FinancialCharts.tsx** (2) – Fix self-reference and Card/CardHeader import (from `@/components/ui` or Card module).

### Phase D – Screens (by error count)

11. **RaceDay/index.tsx** (219)  
12. **Garage/index.tsx** (127)  
13. **VacationPlanner.tsx** (113)  
14. **Paddock/DriversTab.tsx** (110)  
15. **Phone/index.tsx** (95)  
16. **EventGameplayModal.tsx** (87)  
17. **Marketplace/index.tsx** (87)  
18. **TeamsTab.tsx** (81)  
19. **Calendar/index.tsx** (80)  
20. **Facilities/index.tsx** (77)  
21. **Settings/index.tsx** (55)  
22. **CareerCreation/index.tsx** (50)  
23. **Contracts/index.tsx** (46)  
24. **Finances/index.tsx** (49)  
25. Then: Stats, Emails, Scouting, SponsorMarket, PersonalLife/*, Investments, Merchandise, etc.

### Phase E – Components (non-finances)

26. **GOATProgress.tsx** (76) – Fix achievements import (Trophy, Star, Award, Target from correct module), add Milestone, PlayerDriver, GOATTier, Circle, Medal, Crown, GOAT_TIERS, ALL_MILESTONES, MilestoneRarity, MilestoneCategory, GOATProgressType, TRIPLE_CROWNS, HISTORICAL_RECORDS, Card, CardHeader, Badge, CheckCircle2, TrendingUp; fix props (`_currentYear`); type callbacks.
27. **PartsInventoryDashboard.tsx** (56), **ManufacturingQueue.tsx** (49), **RaceAllocationPanel.tsx** (38) – Add facility/logistics types and UI imports; fix props and callback types.
28. **SocialPanel.tsx** (28), **LifestylePanel.tsx** (25), **ObjectivesPanel.tsx** (18), **PersonalLifeDashboard.tsx** (7), **InterviewModal.tsx** (14), **OpportunityResponseModal.tsx** (13), **ComposePostModal.tsx** (10), **Layout.tsx** (2), **DayDetailPanel.tsx** (23), etc.

### Phase F – Simulation

29. **simulation/logistics/raceAllocation.ts** (46)  
30. **simulation/finances/index.ts** (12), **investments.ts** (9), **teamFinances.ts** (4)  
31. **simulation/staffMarket/index.ts** (20)  
32. **simulation/emailGeneration.ts** (11)  
33. **simulation/weeklySystemsProcessor.ts** (10) – Fix pressure/relationships/mediaEffects imports.  
34. **simulation/personal/** (lifestyleAssetsManager, lifestyleManager, relationshipEvents, relationshipManager, socialEventsManager)  
35. **simulation/logistics/partsShipping.ts** (8), **weeklyProcessing.ts** (1)  
36. **simulation/events/expandedChains.ts** (3)  
37. **simulation/health/index.ts** (1) – If any re-export/type conflicts remain.

### Phase G – Services, hooks, remaining

38. **hooks/usePersonalLifeActions.ts** (22)  
39. **services/** (familyBridgeService, dialogueAI, worldContactService, contactService)  
40. **Remaining 1–2 error files** – Clean up individually.

---

## 5. Safety rules (from master plan)

- Use **StrReplace** only for edits; no scripts or terminal commands that modify files.
- Read the file (or relevant section) before each edit.
- Use terminal only for read-only checks (`tsc --noEmit`).
- After each file or small batch, run `npx tsc --noEmit` and optionally `Select-String -Path tsc_errors.txt -Pattern "path/to/file"` to confirm errors decrease.

---

## 6. Quick reference – where things live

- **formatCurrency:** e.g. `@/data/backgrounds` or a shared util.
- **useToast:** `@/components/ui` or `@/components/ui/Toast`.
- **Card, CardHeader, Tabs, Modal, etc.:** `@/components/ui`.
- **Lucide icons:** `lucide-react` (value imports).
- **TeamTier, TeamTransaction, TeamSponsorDeal, etc.:** careerStore or financial types.
- **Loans/credit:** financial-extended config or simulation (BANK_LOAN_TERMS_BY_TIER, applyForBankLoan, etc.).
- **getActivityTimeCost, routeNotification:** `@/data/activity-time-costs`, `@/services/notificationRouter`.

Use `tsc_errors.txt` and in-editor “Go to definition” / “Find all references” to confirm exact modules before adding imports.
