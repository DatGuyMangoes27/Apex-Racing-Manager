# Apex Racing Manager

A motorsport career-management game built on real Automobilista 2 (AMS2) content. Run a team across multiple championships, build a season calendar, and race your weekends in AMS2 while the career layer turns your real results into points, prize money, standings, and stories.

- **Engine:** Godot 4.6 (Mono / .NET 8)
- **Platform:** Windows Desktop
- **Integration:** Live AMS2 shared-memory telemetry

---

## What's New in v0.2

This build is a major pass on the **scheduling, series, and race-weekend loop** — making the calendar run on real venues, supporting multi-race weekends, and enforcing series regulations.

### Calendar & venues
- **Real curated venues for every round.** Race events now load the actual circuit from the championship calendar instead of a generic layout. **All 735 scheduled rounds** across every series now resolve to a real AMS2 track layout (joined on layout name + year so the data lines up across sources).
- **Added Mosport** (Canadian Tire Motorsport Park) to the track-layout pack, closing the last venue gaps.
- **Per-round weekend setup.** Each round now carries dynamic **weather**, **time-of-day / night** running, **race length**, and recommended Practice / Qualifying / Race session lengths — surfaced in the Weekend Setup Briefing on the Race Day screen.
- **Round metadata.** Rounds now track round numbers, finale flags, and a **finale points multiplier** (1.5× for endurance finales).

### Series & entries
- **Per-round multi-class composition.** Multi-class series can vary which car classes appear at each round; the weekend brief tells you exactly which AMS2 classes to add.
- **Eligible classes & regulations** are defined per series and surfaced to the player.
- **Car-platform coverage.** Added 9 missing car platforms so AI fields build correctly for every series.

### Multi-race (double-header) weekends
- **Sprint championships now run two races per weekend**, each with its **own independent qualifying**.
- Modeled to the real AMS2 constraint: a race's starting grid is **never** seeded from another race's finishing order (no reverse-grid carryover). Results still carry full consequences — each race scores points, prize money, and stats into the standings independently.
- The round only completes after its **final** race.
- **Race Day UI:** shows "Race 1 of 2 / Race 2 of 2", a per-race results breakdown, the combined weekend points total, and keeps the previous race's debrief visible while you set up the next one.
- Applied conservatively to the 12 genuine Sprint series (not the broader "short race" bucket).

### Regulation enforcement
- The Weekend Setup Briefing now surfaces series rules: **mandatory pit stop**, **driver change**, **Balance of Performance**, and **spec-series** notes.
- **Mandatory pit stops are enforced from telemetry.** If a series requires a pit stop and telemetry confirms you took none, your championship points for that race are **voided**, with a clear debrief note. Enforcement only fires on a definite signal, so it never penalizes on missing data.

### Simulation realism
- **Weather & night now affect delegated/auto-simmed races** (higher incident/DNF risk in the rain and at night). Your own races already reflect conditions because they come straight from live AMS2 telemetry.

### Onboarding & tutorial
- **In-character guided tutorial.** Your Team Manager introduces the game via the launch briefing email, then walks you through it on screen.
- **Per-screen, first-visit walkthroughs.** The first time you open a screen, a prompt offers a tour that dims the UI, spotlights each key element, and explains what it does and how it affects your career. Covers Home, Mail, Marketplace, Garage, Teams, Drivers, Series Entry, Calendar, and Race Day.
- **Replayable** any time via a "?" help button on each screen. Seen walkthroughs and a master enable/disable flag persist with your save.

### Stability
- **Save/load hardened and test-covered**, including the new multi-race fields and tutorial progress. Re-entering a series for a new season correctly resets per-weekend race state.
- Expanded the automated smoke-test suite: multi-race weekends, regulation enforcement, save round-trip, full-season progression, multi-series calendars, and the tutorial flow all pass.

---

## How it works

1. **Create a career** and pick your team and starting championship(s).
2. **Build your calendar** — enter one or more series; the game schedules real venues across the season (and across years).
3. **Race in AMS2.** Apex Racing Manager reads live telemetry to detect your Practice / Qualifying / Race sessions automatically.
4. **Consequences apply.** Results feed championship points, prize money (for you *and* AI teams), driver stats, finances, and inbox stories. Finales and season rollovers are handled automatically.

## Requirements

- Windows
- Automobilista 2 (for racing your weekends)
- AMS2 shared-memory telemetry enabled

## Known issues

- **Telemetry-based pit enforcement requires the recompiled build.** The mandatory-pit-stop check ships in the C# telemetry layer; it takes effect once the game's .NET assembly is rebuilt (next run/export). Until then it safely does nothing rather than mis-penalizing.
- **Driver-change rules are advisory.** Mandatory driver changes are shown in the brief but not auto-verified from telemetry (a pit stop is the only reliably detectable rule today).
- **Reverse-grid multi-race formats are not modeled.** Real series whose second-race grid is derived from the first race's finish (e.g. partial reverse grids) are intentionally single-race here, because AMS2 cannot seed one race's grid from another race's result.
- **Save-roundtrip dev test** relies on local fixtures under `data/dev/fixtures/`.

---

*Built on Automobilista 2 by Reiza Studios. This is a fan-made project and is not affiliated with Reiza Studios.*
