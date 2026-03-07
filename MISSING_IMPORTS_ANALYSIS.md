# Missing Imports Analysis Report

## File 1: `src/screens/Phone/index.tsx`

### Missing Imports from dialogueAI Service

**Line 335:** `generateMessageChoices`
- **Type:** Function (async)
- **Used:** Called to generate message choices for conversation
- **Exported from:** `src/services/dialogueAI.ts` (line 228)
- **Import needed:** `import { generateMessageChoices } from '@/services/dialogueAI'`

**Line 376:** `generateNpcResponse`
- **Type:** Function (async)
- **Used:** Called to generate NPC response after player sends message
- **Exported from:** `src/services/dialogueAI.ts` (line 333)
- **Import needed:** `import { generateNpcResponse } from '@/services/dialogueAI'`

**Line 520:** `isDialogueAIAvailable`
- **Type:** Function
- **Used:** Check if dialogue AI service is available
- **Exported from:** `src/services/dialogueAI.ts` (line 102)
- **Import needed:** `import { isDialogueAIAvailable } from '@/services/dialogueAI'`

### Additional Missing Type Imports

**Line 129:** `TextMessage`
- **Type:** Type/Interface
- **Used:** Type annotation for message parameter
- **Exported from:** `src/data/messaging-config.ts` (line 35)
- **Import needed:** `import type { TextMessage } from '@/data/messaging-config'`

**Line 675:** `PotentialDate`
- **Type:** Type/Interface
- **Used:** Type annotation for potentialDates prop
- **Exported from:** `src/types/personalLife.ts` (line 59)
- **Import needed:** `import type { PotentialDate } from '@/types/personalLife'`

---

## File 2: `src/screens/Paddock/DriversTab.tsx`

### Missing Store Hooks and State Variables

**Line 54:** `rivals`
- **Type:** Array (from store)
- **Used:** Filtering active drivers
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { rivals } = useRivalStore()`

**Line 60:** `seasonStandings`
- **Type:** Record<string, SeasonStanding[]> (from store)
- **Used:** Getting driver performance stats
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { seasonStandings } = useRivalStore()`

**Line 77:** `getTeamById`
- **Type:** Function (from store)
- **Used:** Getting team data for driver
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook (line 2137)
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { getTeamById } = useRivalStore()`

**Line 78:** `getSeriesById`
- **Type:** Function (from store)
- **Used:** Getting series data for driver
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook (line 2143)
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { getSeriesById } = useRivalStore()`

**Line 79:** `enteredSeriesIds`
- **Type:** Array<string> (from careerStore)
- **Used:** Checking if driver is in player's series
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring: `const { enteredSeriesIds } = useCareerStore()`

**Line 81:** `currentYear`
- **Type:** Number (from careerStore)
- **Used:** Checking contract expiration
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring: `const { currentYear } = useCareerStore()` OR access via `careerState?.currentYear`

**Line 88:** `getScoutingLevel`
- **Type:** Function (from scoutingStore)
- **Used:** Getting scouting level for driver
- **Exported from:** `src/store/scoutingStore.ts` via `useScoutingStore()` hook
- **Import needed:** `import { useScoutingStore } from '@/store/scoutingStore'` and add to destructuring

**Line 89:** `getDriverIntelligence`
- **Type:** Function (from scoutingStore)
- **Used:** Getting driver intelligence data
- **Exported from:** `src/store/scoutingStore.ts` via `useScoutingStore()` hook
- **Import needed:** Add to `useScoutingStore()` destructuring

**Line 104:** `marketFilter`
- **Type:** State variable (string)
- **Used:** Filtering market drivers
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [marketFilter, setMarketFilter] = useState<MarketFilterType>('all')`

**Line 221:** `activeSubTab`
- **Type:** State variable (string)
- **Used:** Tracking active sub-tab ('market' or 'intel')
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [activeSubTab, setActiveSubTab] = useState<'market' | 'intel'>('market')`

**Line 330:** `series`
- **Type:** Array (from store)
- **Used:** Filtering series dropdown
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { series } = useRivalStore()`

**Line 695:** `seriesEntries`
- **Type:** Array (from careerStore)
- **Used:** Checking if player has entered any series
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring

**Line 721:** `ownedTeam`
- **Type:** Object (from careerStore)
- **Used:** Checking if player owns a team
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring: `const { ownedTeam } = useCareerStore()`

### Missing Utility Functions

**Line 470:** `getDriverPortrait`
- **Type:** Function
- **Used:** Getting driver portrait image path
- **Exported from:** `src/utils/generated-assets.ts` (line 243)
- **Import needed:** `import { getDriverPortrait } from '@/utils/generated-assets'`

**Line 210:** `scoutDriver`
- **Type:** Function
- **Used:** Scouting a driver
- **Status:** NOT FOUND - may need to be implemented or imported from scoutingStore
- **Check:** May be `scoutDriver` from scoutingStore actions

**Line 765:** `calculateScoutingCost`
- **Type:** Function
- **Used:** Calculating scouting cost
- **Exported from:** `src/store/scoutingStore.ts` (line 148)
- **Import needed:** Import as named export (not from hook)

**Line 892:** `SKILL_LABELS`
- **Type:** Constant (array)
- **Used:** Mapping driver skills for display
- **Status:** NOT FOUND - needs to be defined or imported
- **Check:** May be in driver config or utils

**Line 1258:** `getTrackById`
- **Type:** Function
- **Used:** Getting track data for milestone
- **Exported from:** `src/data/ams2-tracks.ts` (line 7, imported in rivalStore)
- **Import needed:** `import { getTrackById } from '@/data/ams2-tracks'`

### Missing Type Imports

**Line 91:** `TeamTier`
- **Type:** Type
- **Used:** Type annotation
- **Exported from:** `src/store/rivalStore.ts` (line 204, re-exported from ams2-teams-real)
- **Import needed:** `import type { TeamTier } from '@/store/rivalStore'`

**Line 315:** `MarketFilterType`
- **Type:** Type
- **Used:** Type annotation for marketFilter state
- **Status:** NOT DEFINED - needs type definition
- **Fix needed:** `type MarketFilterType = 'all' | 'expiring' | 'free-agents' | 'prospects'`

**Line 737:** `SubTab`
- **Type:** Type
- **Used:** Type annotation for viewMode prop
- **Status:** NOT DEFINED - needs type definition
- **Fix needed:** `type SubTab = 'market' | 'intel'`

**Line 733:** `Team`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Exported from:** `src/store/rivalStore.ts` (line 178)
- **Import needed:** `import type { Team } from '@/store/rivalStore'`

**Line 739:** `OwnedTeam`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Exported from:** `src/store/careerStore.ts` (line 1674)
- **Import needed:** `import type { OwnedTeam } from '@/store/careerStore'`

**Line 739:** `SeasonStanding`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Exported from:** `src/store/rivalStore.ts` (line 258)
- **Import needed:** `import type { SeasonStanding } from '@/store/rivalStore'`

**Line 756:** `ScoutingLevel`
- **Type:** Type
- **Used:** Type annotation
- **Exported from:** `src/store/scoutingStore.ts` (line 20)
- **Import needed:** `import type { ScoutingLevel } from '@/store/scoutingStore'`

**Line 1090:** `DriverNarrative`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Exported from:** `src/services/preGeneratedContentService.ts` (line 103 as PreGenDriverNarrative)
- **Import needed:** `import type { PreGenDriverNarrative as DriverNarrative } from '@/services/preGeneratedContentService'`

**Line 1257:** `DriverMilestone`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Status:** NOT FOUND - needs to be defined or imported
- **Check:** May be in driver narrative types

---

## File 3: `src/screens/Paddock/TeamsTab.tsx`

### Missing Store Hooks and State Variables

**Line 34:** `getAllSeries`
- **Type:** Function (from store)
- **Used:** Getting all series
- **Status:** NOT FOUND in useRivalStore - should be `series` array instead
- **Fix needed:** Use `series` from `useRivalStore()` instead

**Line 46:** `getManufacturerById`
- **Type:** Function
- **Used:** Getting manufacturer data
- **Exported from:** `src/data/manufacturers.ts` (imported via AMS2_MANUFACTURERS)
- **Import needed:** `import { getManufacturerById } from '@/data/manufacturers'`

**Line 66:** `getSeriesById`
- **Type:** Function (from store)
- **Used:** Getting series data for team
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { getSeriesById } = useRivalStore()`

**Line 68:** `enteredSeriesIds`
- **Type:** Array<string> (from careerStore)
- **Used:** Checking if team is in player's series
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring

**Line 77:** `filter`
- **Type:** State variable (string)
- **Used:** Filtering teams ('your-series' or 'all')
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [filter, setFilter] = useState<FilterType>('your-series')`

**Line 104:** `sort`
- **Type:** State variable (string)
- **Used:** Sorting teams
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [sort, setSort] = useState<SortType>('performance')`

**Line 82:** `selectedChampionship`
- **Type:** State variable (string)
- **Used:** Filtering by championship
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [selectedChampionship, setSelectedChampionship] = useState<string>('all')`

**Line 87:** `selectedManufacturer`
- **Type:** State variable (string)
- **Used:** Filtering by manufacturer
- **Status:** NOT DEFINED - needs `useState` declaration
- **Fix needed:** `const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')`

**Line 131:** `setShowTeamModal`
- **Type:** State setter function
- **Used:** Opening team detail modal
- **Status:** NOT DEFINED - `showDetailModal` exists but setter name mismatch
- **Fix needed:** Either rename `showDetailModal` to `showTeamModal` or use `setShowDetailModal`

**Line 205:** `series`
- **Type:** Array (from store)
- **Used:** Filtering series dropdown
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { series } = useRivalStore()`

**Line 241:** `rivals`
- **Type:** Array (from store)
- **Used:** Getting team drivers
- **Exported from:** `src/store/rivalStore.ts` via `useRivalStore()` hook
- **Import needed:** Add to existing `useRivalStore()` destructuring: `const { rivals } = useRivalStore()`

**Line 265:** `getTeamLogo`
- **Type:** Function
- **Used:** Getting team logo image path
- **Exported from:** `src/utils/generated-assets.ts` (line 321)
- **Import needed:** `import { getTeamLogo } from '@/utils/generated-assets'`

**Line 362:** `seriesEntries`
- **Type:** Array (from careerStore)
- **Used:** Checking if player has entered any series
- **Exported from:** `src/store/careerStore.ts` via `useCareerStore()` hook
- **Import needed:** Add to existing `useCareerStore()` destructuring

**Line 374:** `showTeamModal`
- **Type:** State variable (boolean)
- **Used:** Controlling team detail modal visibility
- **Status:** NOT DEFINED - `showDetailModal` exists but name mismatch
- **Fix needed:** Either rename state or use `showDetailModal`

**Line 404:** `getTeamNarrative`
- **Type:** Function
- **Used:** Getting team narrative/story
- **Exported from:** `src/services/preGeneratedContentService.ts` (line 459) OR `src/data/team-narratives.ts` (line 90)
- **Import needed:** `import { getTeamNarrative } from '@/services/preGeneratedContentService'` OR `import { getTeamNarrative } from '@/data/team-narratives'`

### Missing Type Imports

**Line 399:** `SeasonStanding`
- **Type:** Type/Interface
- **Used:** Type annotation
- **Exported from:** `src/store/rivalStore.ts` (line 258)
- **Import needed:** `import type { SeasonStanding } from '@/store/rivalStore'`

**Line 191:** `FilterType`
- **Type:** Type
- **Used:** Type annotation for filter state
- **Status:** NOT DEFINED - needs type definition
- **Fix needed:** `type FilterType = 'your-series' | 'all'`

**Line 225:** `SortType`
- **Type:** Type
- **Used:** Type annotation for sort state
- **Status:** NOT DEFINED - needs type definition
- **Fix needed:** `type SortType = 'performance' | 'prestige' | 'budget' | 'name'`

---

## File 4: `src/components/logistics/RaceAllocationPanel.tsx`

### Missing Imports (11 total)

**Line 137:** `SparePartType`
- **Type:** Type
- **Used:** Type annotation for partType parameter
- **Exported from:** `src/data/spare-parts-config.ts` (line 15)
- **Import needed:** `import type { SparePartType } from '@/data/spare-parts-config'`

**Line 222:** `RaceSparesKit`
- **Type:** Type/Interface
- **Used:** Type annotation for kit prop
- **Exported from:** `src/store/careerStore.ts` (line 1183)
- **Import needed:** `import type { RaceSparesKit } from '@/store/careerStore'`

**Line 223:** `SparePartsState`
- **Type:** Type/Interface
- **Used:** Type annotation for state prop
- **Exported from:** `src/store/careerStore.ts` (interface definition)
- **Import needed:** `import type { SparePartsState } from '@/store/careerStore'`

**Line 224:** `WorldRegion`
- **Type:** Type
- **Used:** Type annotation for hqRegion prop
- **Exported from:** `src/data/travel-logistics.ts` (type definition)
- **Import needed:** `import type { WorldRegion } from '@/data/travel-logistics'`

**Line 232:** `ShippingMethod`
- **Type:** Type
- **Used:** Type annotation for method parameter
- **Exported from:** `src/data/spare-parts-config.ts` (line 39)
- **Import needed:** `import type { ShippingMethod } from '@/data/spare-parts-config'`

**Line 248:** `getKitAllocationStatus`
- **Type:** Function
- **Used:** Getting kit allocation status
- **Exported from:** `src/simulation/logistics/raceAllocation.ts` (line 583)
- **Import needed:** `import { getKitAllocationStatus } from '@/simulation/logistics/raceAllocation'`

**Line 250:** `getKitShippingUrgency`
- **Type:** Function
- **Used:** Getting shipping urgency for kit
- **Exported from:** `src/simulation/logistics/raceAllocation.ts` (line 296)
- **Import needed:** `import { getKitShippingUrgency } from '@/simulation/logistics/raceAllocation'`

**Line 257:** `getShippingOptions`
- **Type:** Function
- **Used:** Getting shipping options with costs
- **Exported from:** `src/simulation/logistics/partsShipping.ts` (line 440)
- **Import needed:** `import { getShippingOptions } from '@/simulation/logistics/partsShipping'`

**Line 258:** `SPARE_PART_TYPES`
- **Type:** Constant (array)
- **Used:** Iterating over part types
- **Exported from:** `src/data/spare-parts-config.ts` (line 17)
- **Import needed:** `import { SPARE_PART_TYPES } from '@/data/spare-parts-config'`

**Line 165:** `SPARE_PART_NAMES`
- **Type:** Constant (record)
- **Used:** Getting display name for part type
- **Exported from:** `src/data/spare-parts-config.ts` (line 19)
- **Import needed:** `import { SPARE_PART_NAMES } from '@/data/spare-parts-config'`

**Line 340:** `countPartsByTypeAtLocation`
- **Type:** Function
- **Used:** Counting available parts at HQ
- **Exported from:** `src/simulation/logistics/partsInventory.ts` (line 98)
- **Import needed:** `import { countPartsByTypeAtLocation } from '@/simulation/logistics/partsInventory'`

**Line 382:** `SHIPPING_METHODS`
- **Type:** Constant (record)
- **Used:** Getting shipping method configuration
- **Exported from:** `src/data/spare-parts-config.ts` (line 50)
- **Import needed:** `import { SHIPPING_METHODS } from '@/data/spare-parts-config'`

**Line 389:** `ButtonVariant`
- **Type:** Type
- **Used:** Type annotation for button variant
- **Exported from:** `src/components/ui/Button.tsx` (line 5) OR `src/components/ui/index.ts` (line 3)
- **Import needed:** `import type { ButtonVariant } from '@/components/ui'`

**Line 293:** `getRegionDisplayName`
- **Type:** Function
- **Used:** Getting display name for region
- **Exported from:** `src/data/travel-logistics.ts` (line 855)
- **Import needed:** `import { getRegionDisplayName } from '@/data/travel-logistics'`

---

## Summary

### File 1: Phone/index.tsx
- **3 function imports** from dialogueAI service
- **2 type imports** (TextMessage, PotentialDate)

### File 2: DriversTab.tsx
- **Multiple store hooks** (rivals, seasonStandings, getTeamById, getSeriesById, series, ownedTeam)
- **Multiple state variables** (marketFilter, activeSubTab, enteredSeriesIds, currentYear, seriesEntries)
- **Multiple utility functions** (getDriverPortrait, calculateScoutingCost, getTrackById, scoutDriver, SKILL_LABELS)
- **Multiple type imports** (TeamTier, MarketFilterType, SubTab, Team, OwnedTeam, SeasonStanding, ScoutingLevel, DriverNarrative, DriverMilestone)

### File 3: TeamsTab.tsx
- **Multiple store hooks** (getSeriesById, series, rivals, enteredSeriesIds, seasonStandings)
- **Multiple state variables** (filter, sort, selectedChampionship, selectedManufacturer, showTeamModal)
- **Multiple utility functions** (getManufacturerById, getTeamLogo, getTeamNarrative)
- **Multiple type imports** (FilterType, SortType, SeasonStanding)

### File 4: RaceAllocationPanel.tsx
- **11 imports** (types, functions, constants) from various modules

---

## Notes

1. **Runtime Errors Only**: This analysis focuses on actual runtime errors (undefined references), not TypeScript type errors that don't affect runtime.

2. **State Variables**: Several files are missing `useState` declarations for state variables that are being used but never declared.

3. **Store Hooks**: Many files are not destructuring all needed values from store hooks (`useRivalStore`, `useCareerStore`, `useScoutingStore`).

4. **Type Definitions**: Some types need to be defined locally (MarketFilterType, FilterType, SortType, SubTab) as they appear to be component-specific.

5. **Function vs Hook**: Some functions like `getManufacturerById` and `getTrackById` are direct imports, not from hooks.
