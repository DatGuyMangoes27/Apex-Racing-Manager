# Handoff Plan: Fix Remaining Import Errors + Build Home Hub

## Current State Summary

Multiple screens have missing imports causing `ReferenceError` crashes at runtime. Some files have been fixed already, some still need work.

---

## ALREADY FIXED (do NOT re-do these)

### 1. `src/screens/Emails/index.tsx` - FIXED
- `useToast`, `GameSectionHeader`, `Input` added to `@/components/ui` import (line 25)
- `Search`, `Clock`, `AlertCircle`, `X`, `Check`, `Handshake`, `MessageSquare` added to lucide-react imports
- **NOTE**: The browser may show stale cached errors for this file. The file on disk is correct.

### 2. `src/screens/Phone/index.tsx` - FIXED
- Added `generateMessageChoices`, `generateNpcResponse`, `isDialogueAIAvailable` from `@/services/dialogueAI`
- Added `TextMessage` type from `@/data/messaging-config`
- Added `PotentialDate` type from `@/types/personalLife`

### 3. `src/screens/RaceDay/index.tsx` - FIXED
- Added `updateRaceWeekendProgress`, `completeInvitation` to `useCareerStore()` destructure
- Added `updateFormAfterRace` to `useRivalStore()` destructure

### 4. `src/screens/Garage/index.tsx` - FIXED
- Added `TRAINING_PROGRAMS`, `calculateLevelProgress` from `@/data/driver-development-config`
- Added `TrainingProgram` type from `@/data/driver-development-config`
- Added `TeamStaffRole` type from `@/data/facility-staff-config`
- Added `TeamDriver` type from `@/store/careerStore`
- Added `RivalDriver` type from `@/store/rivalStore`

### 5. `src/components/finances/TeamFinancesDashboard.tsx` - FIXED
- Added `RunwayStatus`, `CostCapStatus` types from `@/simulation/finances/teamFinances`
- Added `TeamTransaction` type from `@/store/careerStore`

### 6. `src/components/finances/LoansPanel.tsx` - FIXED
- Moved `createDefaultExtendedFinancialState` import from wrong source (`@/data/financial-extended-config`) to correct source (`@/store/careerStore`)

### 7. `src/components/ui/WorldMap.tsx` - FIXED
- Added `getLocationPerk`, `getLocationPerkEffectsSummary` from `@/data/owner-backgrounds`
- Added `WorldMapProps` interface locally

### 8. `src/screens/CareerCreation/index.tsx` - FIXED
- Changed `navigate('/')` to `navigate('/home')` for both "Found Team" and "Continue" buttons

### 9. `src/screens/Paddock/DriversTab.tsx` - FIXED
- Added `useScoutingStore` from `@/store/scoutingStore`
- Added `getDriverPortrait` from `@/utils/generated-assets`
- Added `getTrackById` from `@/data/ams2-tracks`
- Added `OwnedTeam` type from `@/store/careerStore`, `TeamTier` type from `@/store/rivalStore`
- Added store destructures: `ownedTeam`, `careerState` from `useCareerStore`, `rivals`, `seasonStandings`, `getTeamById`, `getSeriesById` from `useRivalStore`, `getScoutingLevel`, `getDriverIntelligence` from `useScoutingStore`
- Derived `currentYear` and `enteredSeriesIds` from `careerState`
- Added `marketFilter`, `activeSubTab` state variables
- Added local `MarketFilterType`, `DriverNarrative`, `DriverMilestone` type definitions

### 10. `src/components/media/InterviewModal.tsx` - FIXED
- `InterviewModalProps` interface and `InterviewResult` export already present and correctly exported

---

## STILL NEEDS FIXING

### A. `src/screens/Paddock/TeamsTab.tsx`
**Problem**: Uses `getSeriesById` and `enteredSeriesIds` which aren't properly available.
**What to do**:
1. Add `getSeriesById` to the `useRivalStore()` destructure (currently only has `teams, getAllSeries, getManufacturerById, seasonStandings`)
2. Get `careerState` from `useCareerStore()` and derive `enteredSeriesIds`:
   ```tsx
   const { ownedTeam, careerState } = useCareerStore()
   const enteredSeriesIds = (careerState?.seriesEntries || []).map(e => e.seriesId)
   ```
3. Add `getTeamLogo` import from `@/utils/generated-assets` (used on lines 265, 435)
4. Remove the `as any` casts once the proper destructuring is in place
**Export locations**:
- `getSeriesById` -> `src/store/rivalStore.ts` (line 455)
- `getTeamLogo` -> `src/utils/generated-assets.ts`
- `seriesEntries` -> derived from `careerState.seriesEntries` in `useCareerStore`

### B. `src/components/logistics/RaceAllocationPanel.tsx`
**Problem**: Missing 11+ imports for types, constants, and functions.
**What to add** (add-only, don't remove existing imports):
```tsx
// After existing imports, add:
import type { SparePartType } from '@/data/spare-parts-config'
import type { WorldRegion } from '@/data/travel-logistics'
import type { ShippingMethod } from '@/data/spare-parts-config'
import { SPARE_PART_TYPES, SPARE_PART_NAMES, SHIPPING_METHODS } from '@/data/spare-parts-config'
import { getKitAllocationStatus, getKitShippingUrgency } from '@/simulation/logistics/raceAllocation'
import { getShippingOptions } from '@/simulation/logistics/partsShipping'
import { countPartsByTypeAtLocation } from '@/simulation/logistics/partsInventory'
import { getRegionDisplayName } from '@/data/travel-logistics'
```
**Also check**: `RaceSparesKit` type may be needed — search for where it's exported.

### C. `src/screens/Home/index.tsx` - BUILD HOME HUB
**Problem**: Currently just shows "Home" text. Should be a full dashboard hub.
**What to build**: A dashboard using the existing owner widgets:
```tsx
import { useNavigate } from 'react-router-dom'
import { PageHeader, GameSectionHeader, Card } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import {
  RaceReadinessWidget,
  BoardMoodWidget,
  SponsorHealthWidget,
  UpcomingCostsWidget,
  RunwayWidget,
  FleetHealthWidget,
  TeamReadinessWidget,
  DriverLineupWidget,
  DevelopmentProgressWidget,
  StaffStatusWidget
} from '@/components/owner'
```
All these widgets are exported from `src/components/owner/index.ts`.

Layout should include:
- PageHeader with title "Team Hub" or "Dashboard"
- Grid of owner widgets (2-3 columns)
- Quick navigation cards to key screens (Calendar, Garage, Finances, etc.)
- Use lucide-react icons for navigation cards

**IMPORTANT**: Each widget component may itself have missing imports. Before wiring them up, read each widget file in `src/components/owner/` and verify their imports are correct. The widgets are:
- `BoardMoodWidget.tsx`
- `RunwayWidget.tsx`
- `FleetHealthWidget.tsx`
- `TeamReadinessWidget.tsx`
- `DriverLineupWidget.tsx`
- `DevelopmentProgressWidget.tsx`
- `SponsorHealthWidget.tsx`
- `StaffStatusWidget.tsx`
- `UpcomingCostsWidget.tsx`
- `RaceReadinessWidget.tsx`

---

## RULES FOR FIXING

1. **ADD-ONLY**: Only add missing imports. Do NOT remove or modify existing imports or code logic.
2. **Verify exports**: Before adding an import, grep to confirm the export exists: `export.*IDENTIFIER_NAME`
3. **Consolidate**: If adding to a module that's already imported, add to the existing import statement.
4. **Local types**: If a type doesn't exist anywhere in the codebase, define it locally in the file with a sensible shape matching its usage.
5. **Derived values**: For things like `enteredSeriesIds`, derive them from available store data rather than trying to import them.
6. **No `as any`**: Where possible, properly type store destructures rather than casting with `as any`.

---

## FILE LOCATIONS QUICK REFERENCE

| Export | Source File |
|--------|------------|
| `useCareerStore` | `src/store/careerStore.ts` |
| `useRivalStore` | `src/store/rivalStore.ts` |
| `useScoutingStore` | `src/store/scoutingStore.ts` |
| `getDriverPortrait` | `src/utils/generated-assets.ts` |
| `getTeamLogo` | `src/utils/generated-assets.ts` |
| `getTrackById` | `src/data/ams2-tracks.ts` |
| `SPARE_PART_TYPES`, `SPARE_PART_NAMES`, `SHIPPING_METHODS` | `src/data/spare-parts-config.ts` |
| `getKitAllocationStatus`, `getKitShippingUrgency` | `src/simulation/logistics/raceAllocation.ts` |
| `getShippingOptions` | `src/simulation/logistics/partsShipping.ts` |
| `countPartsByTypeAtLocation` | `src/simulation/logistics/partsInventory.ts` |
| `getRegionDisplayName` | `src/data/travel-logistics.ts` |
| `WorldRegion` type | `src/data/travel-logistics.ts` |
| `SparePartType`, `ShippingMethod` types | `src/data/spare-parts-config.ts` |
| Owner widgets | `src/components/owner/index.ts` |
| `PageHeader`, `GameSectionHeader` | `src/components/ui/index.ts` |
