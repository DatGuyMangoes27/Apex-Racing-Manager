# Missing Imports Analysis - Screen Files

## Summary
This report identifies missing imports that would cause runtime `ReferenceError` in the specified screen files.

---

## 1. `src/screens/Home/index.tsx`
**Status:** ✅ **STUB/PLACEHOLDER** - No issues
- Minimal implementation (just displays "Home" text)
- All imports present

---

## 2. `src/screens/RaceDay/index.tsx`
**Status:** ⚠️ **FULL IMPLEMENTATION** - Missing imports found

### Missing Imports:

#### Line 328, 351, 421: `updateRaceWeekendProgress`
- **Used but not imported:** Function called but not destructured from `useCareerStore()`
- **Location:** `src/store/careerStore.ts` (line 4623)
- **Fix:** Add to destructuring: `const { ..., updateRaceWeekendProgress } = useCareerStore()`

#### Line 395: `completeInvitation`
- **Used but not imported:** Function called but not destructured from `useCareerStore()`
- **Location:** `src/store/careerStore.ts` (line 4638)
- **Fix:** Add to destructuring: `const { ..., completeInvitation } = useCareerStore()`

#### Line 439: `updateFormAfterRace`
- **Used but not imported:** Function called but not destructured from `useRivalStore()`
- **Location:** `src/store/rivalStore.ts` (line 483)
- **Fix:** Add to destructuring: `const { ..., updateFormAfterRace } = useRivalStore()`

---

## 3. `src/screens/Garage/index.tsx`
**Status:** ⚠️ **FULL IMPLEMENTATION** - Missing imports found

### Missing Imports:

#### Line 125, 139, 1196: `TeamStaffRole` (type)
- **Used but not imported:** Type used in function signatures and type assertions
- **Location:** `src/data/facility-staff-config.ts` (line 36) OR `src/store/careerStore.ts` (line 752)
- **Fix:** Add import: `import type { TeamStaffRole } from '@/data/facility-staff-config'` or `import type { TeamStaffRole } from '@/store/careerStore'`

#### Line 166, 433, 1088: `TrainingProgram` (type)
- **Used but not imported:** Type used in function signatures and type assertions
- **Location:** `src/data/driver-development-config.ts` (line 12)
- **Fix:** Add import: `import type { TrainingProgram } from '@/data/driver-development-config'`

#### Line 433, 552, 1088: `TRAINING_PROGRAMS` (constant)
- **Used but not imported:** Constant object accessed but not imported
- **Location:** `src/data/driver-development-config.ts` (line 106)
- **Fix:** Add import: `import { TRAINING_PROGRAMS } from '@/data/driver-development-config'`

#### Line 434: `calculateLevelProgress` (function)
- **Used but not imported:** Function called but not imported
- **Location:** `src/data/driver-development-config.ts` (line 299)
- **Fix:** Add import: `import { calculateLevelProgress } from '@/data/driver-development-config'`

#### Line 179, 257, 419, 2342: `RivalDriver` (type)
- **Used but not imported:** Type used in interface definitions
- **Location:** `src/store/rivalStore.ts` (line 110)
- **Fix:** Add import: `import type { RivalDriver } from '@/store/rivalStore'`

#### Line 256, 418: `TeamDriver` (type)
- **Used but not imported:** Type used in interface definitions
- **Location:** `src/store/careerStore.ts` (line 946)
- **Fix:** Add import: `import type { TeamDriver } from '@/store/careerStore'`

---

## 4. `src/screens/Garage/tabs/RnDTab.tsx`
**Status:** ✅ **STUB/PLACEHOLDER** - No issues
- Minimal implementation
- All imports present

---

## 5. `src/screens/SeasonEnd/index.tsx`
**Status:** ✅ **STUB/PLACEHOLDER** - No issues
- Minimal implementation (just displays "Season End" text)
- All imports present

---

## 6. `src/screens/Manufacturing/index.tsx`
**Status:** ✅ **FULL IMPLEMENTATION** - No issues found
- All imports present
- All components properly imported

---

## 7. `src/screens/Settings/index.tsx`
**Status:** ✅ **FULL IMPLEMENTATION** - No issues found
- All imports present
- All functions properly destructured from stores

---

## 8. `src/screens/SponsorMarket/index.tsx`
**Status:** ✅ **FULL IMPLEMENTATION** - No issues found
- `Input` is imported (line 49) but not actually used in JSX
- All other imports present

---

## 9. `src/screens/Media/index.tsx`
**Status:** ✅ **FULL IMPLEMENTATION** - No issues found
- All imports present
- All functions properly imported

---

## 10. `src/screens/Logs/index.tsx`
**Status:** ✅ **STUB/PLACEHOLDER** - No issues
- Minimal implementation
- All imports present

---

## 11. `src/screens/HowToPlay/index.tsx`
**Status:** ✅ **STUB/PLACEHOLDER** - No issues
- Uses `GameSectionHeader` which is properly imported from `@/components/ui`
- All imports present

---

## Critical Issues Summary

### Files Requiring Immediate Fix:

1. **`src/screens/RaceDay/index.tsx`** - 3 missing imports
   - `updateRaceWeekendProgress` from `useCareerStore()`
   - `completeInvitation` from `useCareerStore()`
   - `updateFormAfterRace` from `useRivalStore()`

2. **`src/screens/Garage/index.tsx`** - 6 missing imports
   - `TeamStaffRole` (type)
   - `TrainingProgram` (type)
   - `TRAINING_PROGRAMS` (constant)
   - `calculateLevelProgress` (function)
   - `RivalDriver` (type)
   - `TeamDriver` (type)

---

## Recommended Fixes

### For `src/screens/RaceDay/index.tsx`:
```typescript
// Line 49-56: Update useCareerStore destructuring
const {
  player,
  careerState,
  isInvitationalWeek,
  getCurrentInvitationalEvent,
  getAIModifier,
  processRaceResult,
  updateRaceWeekendProgress,  // ADD THIS
  completeInvitation           // ADD THIS
} = useCareerStore()

// Line 57-63: Update useRivalStore destructuring
const {
  getSeriesById,
  getDriversWithForm,
  getTeamById,
  seasonStandings,
  prepareRaceWeekend,
  updateFormAfterRace  // ADD THIS
} = useRivalStore()
```

### For `src/screens/Garage/index.tsx`:
```typescript
// Add these imports at the top of the file (after line 55)
import type { TeamStaffRole } from '@/data/facility-staff-config'
import type { TrainingProgram } from '@/data/driver-development-config'
import { TRAINING_PROGRAMS, calculateLevelProgress } from '@/data/driver-development-config'
import type { RivalDriver } from '@/store/rivalStore'
import type { TeamDriver } from '@/store/careerStore'
```

---

## Files That Are Safe (Stubs/Placeholders):
- `src/screens/Home/index.tsx`
- `src/screens/Garage/tabs/RnDTab.tsx`
- `src/screens/SeasonEnd/index.tsx`
- `src/screens/Logs/index.tsx`
- `src/screens/HowToPlay/index.tsx`

## Files That Are Safe (Full Implementation):
- `src/screens/Manufacturing/index.tsx`
- `src/screens/Settings/index.tsx`
- `src/screens/SponsorMarket/index.tsx`
- `src/screens/Media/index.tsx`
