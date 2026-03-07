# Missing Imports Report - src/screens/ Directory

This report identifies missing imports that would cause `ReferenceError` at runtime in `.tsx` files within `src/screens/`.

## Analysis Methodology

For each file, checked:
1. Component references (PascalCase JSX tags) - verified imports/local definitions
2. Function calls - verified imports/local definitions  
3. Constants/variables - verified imports/local definitions
4. lucide-react icons - verified import statements
5. TypeScript types used in JSX/props (only if they cause runtime errors)

---

## Files Analyzed

### ✅ src/screens/CareerCreation/index.tsx
**Status:** All imports present ✓

### ❌ src/screens/Phone/index.tsx
**Status:** Missing imports found

#### Missing Functions:
- `generateMessageChoices` - **Function**
  - Used at: line 335
  - Should import from: `@/services/dialogueAI`
  
- `generateNpcResponse` - **Function**
  - Used at: line 376
  - Should import from: `@/services/dialogueAI`
  
- `isDialogueAIAvailable` - **Function**
  - Used at: line 520
  - Should import from: `@/services/dialogueAI`

#### Missing Types:
- `TextMessage` - **Type**
  - Used at: line 129 (function parameter type)
  - Should import from: `@/data/messaging-config`
  
- `PotentialDate` - **Type**
  - Used at: line 675 (function parameter type)
  - Should import from: `@/types/personalLife`

---

### ❌ src/screens/Paddock/DriversTab.tsx
**Status:** Missing imports and undefined variables found

#### Missing Store Values (from useRivalStore):
- `rivals` - **Variable**
  - Used at: lines 54, 241, 1093
  - Should get from: `const { rivals } = useRivalStore()`
  
- `seasonStandings` - **Variable**
  - Used at: lines 60, 97
  - Should get from: `const { seasonStandings } = useRivalStore()`
  
- `getTeamById` - **Function**
  - Used at: lines 77, 716
  - Should get from: `const { getTeamById } = useRivalStore()`
  
- `getSeriesById` - **Function**
  - Used at: lines 78, 717
  - Should get from: `const { getSeriesById } = useRivalStore()`
  
- `series` - **Variable**
  - Used at: lines 330, 420
  - Should get from: `const { series } = useRivalStore()`

#### Missing Store Values (from useCareerStore):
- `enteredSeriesIds` - **Variable**
  - Used at: lines 79, 97, 157
  - Should derive from: `const enteredSeriesIds = careerState?.seriesEntries?.map(e => e.seriesId) || []`
  
- `currentYear` - **Variable**
  - Used at: lines 81, 97
  - Should get from: `const currentYear = careerState?.currentYear || 2024`
  
- `seriesEntries` - **Variable**
  - Used at: lines 695
  - Should get from: `const seriesEntries = careerState?.seriesEntries || []`
  
- `ownedTeam` - **Variable**
  - Used at: lines 721
  - Should get from: `const ownedTeam = careerState?.ownedTeam`

#### Missing Store Hook Import:
- `useScoutingStore` - **Hook**
  - Used at: line 749 (inside DriverDetailView component)
  - Should import: `import { useScoutingStore } from '@/store/scoutingStore'`

#### Missing Store Values (from useScoutingStore):
- `getScoutingLevel` - **Function**
  - Used at: lines 88, 751
  - Should get from: `const { getScoutingLevel } = useScoutingStore()` (line 749 already has this, but missing at component level line 40)
  
- `getDriverIntelligence` - **Function**
  - Used at: lines 89, 752
  - Should get from: `const { getDriverIntelligence } = useScoutingStore()` (line 747 already has this, but missing at component level line 40)
  
- `scoutDriver` - **Function**
  - Used at: line 210
  - Should get from: `const { scoutDriver } = useScoutingStore()` (needs to be added to main component)
  
- `calculateScoutingCost` - **Function**
  - Used at: line 765
  - Should import from: `@/store/scoutingStore` OR get from `useScoutingStore()` hook

#### Missing State Variables:
- `activeSubTab` - **State Variable**
  - Used at: lines 221, 224, 234, 237, 249, 352, 441, 568, 710, 720
  - Should define: `const [activeSubTab, setActiveSubTab] = useState<'market' | 'intel'>('market')`
  
- `setActiveSubTab` - **State Setter**
  - Used at: lines 221, 234
  - Should define: (see above)
  
- `marketFilter` - **State Variable**
  - Used at: lines 104, 314
  - Should define: `const [marketFilter, setMarketFilter] = useState<MarketFilterType>('all')`
  
- `setMarketFilter` - **State Setter**
  - Used at: line 315
  - Should define: (see above)

#### Missing Type Definitions:
- `SubTab` - **Type**
  - Used at: line 737
  - Should define: `type SubTab = 'market' | 'intel'`
  
- `MarketFilterType` - **Type**
  - Used at: line 315
  - Should define: `type MarketFilterType = 'all' | 'expiring' | 'free-agents' | 'prospects'`
  
- `TeamTier` - **Type**
  - Used at: line 91
  - Should import from: `@/store/scoutingStore`
  
- `ScoutingLevel` - **Type**
  - Used at: line 756
  - Should import from: `@/store/scoutingStore`
  
- `DriverNarrative` - **Type**
  - Used at: line 1090
  - Likely should be: `type DriverNarrative = RivalDriver['narrative']` or import from appropriate source
  
- `DriverMilestone` - **Type**
  - Used at: line 1257
  - Need to locate definition or create type
  
- `OwnedTeam` - **Type**
  - Used at: line 738
  - Should import from: `@/store/careerStore`

#### Missing Utility Functions:
- `getDriverPortrait` - **Function**
  - Used at: lines 470, 597, 773
  - Should import from: `@/utils/generated-assets`
  
- `getTrackById` - **Function**
  - Used at: line 1258
  - Should import from: `@/data/ams2-tracks`

#### Missing Constants:
- `SKILL_LABELS` - **Constant**
  - Used at: line 892
  - **NOT FOUND** - This constant is referenced but doesn't exist in the codebase
  - Likely needs to be defined or imported from a data file
  - Should be an array of objects with `{ key, label, icon }` structure for driver stats

---

### ❌ src/screens/Paddock/TeamsTab.tsx
**Status:** Missing imports and undefined variables found

#### Missing Store Values (from useRivalStore):
- `rivals` - **Variable**
  - Used at: line 241
  - Should get from: `const { rivals } = useRivalStore()`
  
- `getSeriesById` - **Function**
  - Used at: lines 66, 382
  - Should get from: `const { getSeriesById } = useRivalStore()`
  
- `series` - **Variable**
  - Used at: lines 205, 420
  - Should get from: `const { series } = useRivalStore()`

#### Missing Store Values (from useCareerStore):
- `seriesEntries` - **Variable**
  - Used at: line 362
  - Should get from: `const seriesEntries = careerState?.seriesEntries || []`

#### Missing State Variables:
- `filter` - **State Variable**
  - Used at: lines 77, 190
  - Should define: `const [filter, setFilter] = useState<FilterType>('your-series')`
  
- `setFilter` - **State Setter**
  - Used at: line 191
  - Should define: (see above)
  
- `selectedChampionship` - **State Variable**
  - Used at: lines 82, 200
  - Should define: `const [selectedChampionship, setSelectedChampionship] = useState<string>('all')`
  
- `setSelectedChampionship` - **State Setter**
  - Used at: line 201
  - Should define: (see above)
  
- `selectedManufacturer` - **State Variable**
  - Used at: lines 87, 212
  - Should define: `const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')`
  
- `setSelectedManufacturer` - **State Setter**
  - Used at: line 213
  - Should define: (see above)
  
- `sort` - **State Variable**
  - Used at: lines 104, 223
  - Should define: `const [sort, setSort] = useState<SortType>('performance')`
  
- `setSort` - **State Setter**
  - Used at: line 225
  - Should define: (see above)
  
- `showTeamModal` - **State Variable**
  - Used at: lines 374
  - Should define: `const [showTeamModal, setShowTeamModal] = useState(false)`
  
- `setShowTeamModal` - **State Setter**
  - Used at: lines 131, 375
  - Should define: (see above)

#### Missing Type Definitions:
- `FilterType` - **Type**
  - Used at: line 191
  - Should define: `type FilterType = 'your-series' | 'all'`
  
- `SortType` - **Type**
  - Used at: line 225
  - Should define: `type SortType = 'performance' | 'prestige' | 'budget' | 'name'`
  
- `OwnedTeam` - **Type**
  - Used at: line 397
  - Should import from: `@/store/careerStore`
  
- `SeasonStanding` - **Type**
  - Used at: line 399
  - Should import from: `@/store/rivalStore`

#### Missing Utility Functions:
- `getTeamLogo` - **Function**
  - Used at: lines 265, 435
  - Should import from: `@/utils/generated-assets`
  
- `getTeamNarrative` - **Function**
  - Used at: line 405
  - Should import from: `@/data/team-narratives` OR `@/services/preGeneratedContentService`

---

## Summary

### Critical Issues (Will Cause Runtime Errors):
1. **Phone/index.tsx**: Missing 3 function imports from `@/services/dialogueAI`
2. **DriversTab.tsx**: Missing multiple store hooks, state variables, and utility functions
3. **TeamsTab.tsx**: Missing multiple store hooks, state variables, and utility functions
4. **SKILL_LABELS constant**: Referenced but doesn't exist - needs to be created or imported

### Type-Only Issues (May cause TypeScript errors but not runtime):
- Various TypeScript type imports missing (these won't cause runtime ReferenceErrors but should be fixed)

---

## Next Steps

1. Add missing imports to each file
2. Add missing state variable declarations
3. Create or locate `SKILL_LABELS` constant
4. Continue analysis of remaining files in `src/screens/` directory
