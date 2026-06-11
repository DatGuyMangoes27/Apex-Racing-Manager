# Apex Racing Manager

A motorsport career-management game built on real Automobilista 2 (AMS2) content. Run a team across multiple championships, build a season calendar, and race your weekends in AMS2 while the career layer turns your real results into points, prize money, standings, and stories.

- **Engine:** Godot 4.6 (Mono / .NET 8)
- **Platform:** Windows Desktop
- **Integration:** Live AMS2 shared-memory telemetry + Custom AI Driver XML export

---

## How it works

1. **Create a career** â€” import your AMS2 world, choose your team DNA and staff, and pick your starting championship(s).
2. **Build your calendar** â€” enter one or more series; the game schedules real venues across the season (and across years).
3. **Race in AMS2.** Apex Racing Manager reads live telemetry to detect your Practice / Qualifying / Race sessions automatically, and exports career-tuned AI grids to your install before you load.
4. **Consequences apply.** Results feed championship points, prize money (for you *and* AI teams), driver stats, finances, sponsor satisfaction, and inbox stories. Finales and season rollovers are handled automatically.

## Requirements

- Windows
- Automobilista 2 (for racing your weekends)
- AMS2 shared-memory telemetry enabled
- AMS2 "Customized AI Names" enabled (Options â†’ Gameplay) for AI export

---

# Release Notes

> Newest releases first. Each version keeps its own entry â€” nothing here gets overwritten.

## v0.3

A major step toward a **commercial-quality career manager** â€” career-creation choices now permanently shape the live simulation, a deep **sponsorship and finance economy** carries real stakes into every weekend, new **staff and board** systems add management depth, and **AMS2 integration** is tighter from install-based world import through live telemetry to byte-faithful AI export.

**Career creation with real, permanent effects**
- Every choice in career creation is now wired into the running simulation, and a **"Career DNA â€” Live Effects"** card on the review step shows exactly what your build does before you confirm.
- **Commercial DNA** (background, persona, operational bias) permanently changes sponsor deal value, sponsor interest, inbound offer frequency, and your commercial profile.
- **HQ location & operational build** set a lasting logistics multiplier on weekly operations and race-weekend running costs.
- **Engineering pedigree** reduces car wear every race weekend.
- **Board temperament** (dynasty backgrounds, aggressive launches, risk appetite) tightens or relaxes season targets and scales end-of-season bonus/penalty stakes.
- **Decision tempo, recruitment focus, and risk appetite** each carry distinct gameplay effects on how fast you act, who you can hire, and how leveraged you start.
- **Staffing & recruitment choices** decide how well delegated race weekends go; **media pressure** from your public profile amplifies every sponsor satisfaction swing.

**Game World â€” import your AMS2 install**
- **Career creation now starts with your install.** A first step scans your Automobilista 2 installation and builds the game world from what you actually have â€” custom AI rosters, mod packs, and livery teams â€” with the built-in generated world as fallback.
- **Automatic install detection** through Steam (registry + library folders), including installs on secondary drives; manual locate is remembered for future careers.
- **Custom AI grids (NAMeS & friends).** Scans `UserData/CustomAIDrivers` and reads both XML formats â€” attribute-style files *and* the child-element format used by NAMeS and official grids. Names, nationalities, liveries, and full AMS2 skill ratings come through.
- **Per-class opt-in** with driver/livery counts and ~60 class alias mappings (`F-Classic_Gen1` â†’ Formula Classic G1, `MiniChallenge` â†’ JCW, and more); unmapped grids are shown rather than silently dropped.
- **Livery-aware driver assignment** â€” imported drivers match their actual livery first, and their AMS2 skill ratings merge into the career ratings.
- **Mod previews** extracted from mod archives, plus standalone XML import and built-in roster fallback. A "World State" panel summarizes your world before you commit.

**Staff management**
- A full **Staff hub** â€” roster with morale, wages, and role coverage.
- **Contracts** â€” negotiate accept/lowball, fire with severance, and fill vacancies.
- **Scout & hire** from a live market of varied real profiles (not placeholder seeds).
- Weekly operations cost now uses the **real wage bill**, and career-creation staffing depth shapes delegated weekend quality.

**Board system**
- **Seven board archetypes** derived from your founder background, with a full **board dossier** overlay from Home.
- **Board meetings** are exitable, with **negotiable objectives** and per-series mandates, and **dynamic prize-money objectives** drawn from the real payout ladder.
- **Credit line & bailouts** â€” three missed loan payments trigger a board bailout that clears the debt at the cost of lasting commercial reputation damage and a smaller future credit line.

**Sponsors & finances**
- **A living sponsor market** â€” 2,500 generated brands across five deal tiers, with negotiation, patience, personalities, satisfaction, volatility, and persistent relationship/cooldown history. A full sponsor dossier covers every brand.
- **Full transaction ledger** â€” every cash movement recorded with a running balance on the new Finances screen, plus a finance overview (cash, escrow, debt, weekly ops, sponsor income, 30-day net, cash runway).
- **Weekly operations costs** scale with your fleet and staff wages.
- **Loans** â€” borrow against your commercial profile; debt is serviced weekly with interest, and missed payments are strikes.
- **Commercial stakes in the race loop** â€” a Race Day stakes panel shows guaranteed fees, win/podium bonuses, attendance clauses at risk, and fragile deals before you run; delegating or withdrawing from a clashing round spells out exactly what it costs.

**Nothing is instant**
- Major actions now flow through a **pending-actions pipeline** â€” accepting sponsors (1â€“2 days), series entry (2â€“3 days), car delivery (3â€“7 days, auctions 2â€“5), staff offers (1â€“3 days), workshop locks (1â€“7 days), and loan approval (1â€“2 days) all resolve over time, with confirmations delivered by mail and time advanced via Continue.

**Test days**
- **Book test days from the Calendar** and either drive them in AMS2 or simulate the programme, building track knowledge and shakedown findings, accruing wear, and receiving a debrief mail.

**AMS2 AI export**
- On Race Day load, career-tuned AI files are written to your **AMS2 install folder** (`UserData/CustomAIDrivers/`, not Documents).
- **Byte-faithful** to the NAMeS / Ultimate Companion XML format (BOM, CRLF, exact element order), with **stats-only changes** â€” NAMeS driver names are preserved while the career world seeds from install XML ground truth.
- Requires **"Customized AI Names"** enabled in AMS2 (Options â†’ Gameplay); export diagnostics appear in the live Race Day panel.

**Race loop & support polish**
- **Mail inbox** is newest-first, with FM-style blocking for must-do mail; **tutorials** now run once per career and stay replayable.
- An animated **"SYNCING WITH AMS2"** state shows between sessions on Race Day.
- **Persistent file logging** with a session header (game/engine version, OS, timestamp) and a **Settings â†’ Support** section with live telemetry status, Open Logs Folder, and Report an Issue. The project and exported executable now carry the release version.

**Stability**
- New automated coverage for the full **sponsor lifecycle**, negotiation, weekly ops, the ledger, **loan drawdown / servicing / strike-and-bailout**, race-weekend stakes, staff management, test days, AMS2 AI export, the pending-actions pipeline, and **runtime checks that every career-creation effect actually moves its target system**. The full regression suite passes.
- **AMS2 install import is test-covered end-to-end** against a fixture install and verified against a real install.

**Known issues**
- **Mail filter tab badges** show 0 while the header count is correct (not yet wired).
- **Driver-change rules are advisory** â€” only mandatory pit stops are telemetry-verified today.
- **Reverse-grid multi-race formats are not modeled** â€” AMS2 cannot seed one race's grid from another race's result.

## v0.2

A major pass on the **scheduling, series, and race-weekend loop** â€” making the calendar run on real venues, supporting multi-race weekends, and enforcing series regulations â€” plus a full **ongoing marketplace with live auctions** and a **car condition / scrutineering / maintenance** economy.

**Calendar & venues**
- **Real curated venues for every round.** Race events now load the actual circuit from the championship calendar instead of a generic layout. **All 735 scheduled rounds** across every series now resolve to a real AMS2 track layout (joined on layout name + year so the data lines up across sources).
- **Added Mosport** (Canadian Tire Motorsport Park) to the track-layout pack, closing the last venue gaps.
- **Per-round weekend setup.** Each round now carries dynamic **weather**, **time-of-day / night** running, **race length**, and recommended Practice / Qualifying / Race session lengths â€” surfaced in the Weekend Setup Briefing on the Race Day screen.
- **Round metadata.** Rounds now track round numbers, finale flags, and a **finale points multiplier** (1.5Ã— for endurance finales).

**Series & entries**
- **Per-round multi-class composition.** Multi-class series can vary which car classes appear at each round; the weekend brief tells you exactly which AMS2 classes to add.
- **Eligible classes & regulations** are defined per series and surfaced to the player.
- **Car-platform coverage.** Added 9 missing car platforms so AI fields build correctly for every series.

**Multi-race (double-header) weekends**
- **Sprint championships now run two races per weekend**, each with its **own independent qualifying**.
- Modeled to the real AMS2 constraint: a race's starting grid is **never** seeded from another race's finishing order (no reverse-grid carryover). Results still carry full consequences â€” each race scores points, prize money, and stats into the standings independently.
- The round only completes after its **final** race.
- **Race Day UI:** shows "Race 1 of 2 / Race 2 of 2", a per-race results breakdown, the combined weekend points total, and keeps the previous race's debrief visible while you set up the next one.
- Applied conservatively to the 12 genuine Sprint series (not the broader "short race" bucket).

**Regulation enforcement**
- The Weekend Setup Briefing now surfaces series rules: **mandatory pit stop**, **driver change**, **Balance of Performance**, and **spec-series** notes.
- **Mandatory pit stops are enforced from telemetry.** If a series requires a pit stop and telemetry confirms you took none, your championship points for that race are **voided**, with a clear debrief note. Enforcement only fires on a definite signal, so it never penalizes on missing data.

**Marketplace & auctions**
- **A real, ongoing marketplace** â€” not just a one-time launch purchase. Inventory **refreshes weekly**, you can make direct buys at any time, and you can own and manage **multiple cars** in the garage.
- **Realistic auction house.** Lots are scheduled on the calendar with **hidden reserve prices**, **proxy / max bidding**, and **AI rival bidders** that hold their own private valuations and respond to your bids.
- **Escrow & anti-snipe.** Your bid funds are held in escrow while a lot is live, late bids extend the deadline, and lots resolve silently on the calendar with **win / outbid / unsold** outcomes delivered to your inbox.
- **Live bidding drama.** A turn-based live bidding modal plus an "auction closing â€” attend?" prompt in the continue flow let you fight for a lot in real time.
- **Sell your own cars.** Consign an owned car to auction (guarded so you can't sell your last car or a car committed to an active entry), pay a small sales commission, and collect the payout when it sells â€” or keep the car if the reserve isn't met.

**Car condition, scrutineering & maintenance**
- **Per-system wear.** Each car tracks condition for its **engine, gearbox, brakes, suspension, and chassis** separately, with each system wearing at its own rate and accruing mileage every race weekend.
- **Condition has bite.** Worn cars are **slower** and carry real **DNF risk** â€” including in delegated / auto-simmed races.
- **Scrutineering minimums per series.** Every series has an **authored minimum condition** (resolved by championship â†’ ruleset â†’ tier). A car below the standard is **hard-blocked** from entering the series *and* from taking the race start until it's serviced.
- **Two-part maintenance economy.** An unavoidable **weekend running cost** is charged automatically after each race, and an optional **manual Service** in the garage lets you rebuild systems â€” **per-system or full** â€” with live cost quotes scaled by how worn each system is.
- **Surfaced everywhere.** A new garage **Condition & Service** panel shows per-system condition bars and service buttons; the Series Entry and Race Day screens show your condition vs. the required minimum, with a **"Service car" CTA** when you fall short.
- **Used-vs-new now matters.** A cheaper used car starts worn and costs more to keep above scrutineering, making the buy-new-vs-buy-used decision a real trade-off.

**Simulation realism**
- **Weather & night now affect delegated/auto-simmed races** (higher incident/DNF risk in the rain and at night). Your own races already reflect conditions because they come straight from live AMS2 telemetry.

**Onboarding & tutorial**
- **In-character guided tutorial.** Your Team Manager introduces the game via the launch briefing email, then walks you through it on screen.
- **Per-screen, first-visit walkthroughs.** The first time you open a screen, a prompt offers a tour that dims the UI, spotlights each key element, and explains what it does and how it affects your career. Covers Home, Mail, Marketplace, Garage, Teams, Drivers, Series Entry, Calendar, and Race Day.
- **Replayable** any time via a "?" help button on each screen. Seen walkthroughs and a master enable/disable flag persist with your save.

**Stability**
- **Save/load hardened and test-covered**, including the new multi-race fields, marketplace/auction state, car condition, and tutorial progress. Re-entering a series for a new season correctly resets per-weekend race state.
- Expanded the automated smoke-test suite: multi-race weekends, regulation enforcement, save round-trip, full-season progression, multi-series calendars, the tutorial flow, **auction lifecycle (win / outbid / unsold), ongoing marketplace buy-and-sell, and the scrutineering gate + service economy** all pass.

**Known issues**
- **Telemetry-based pit enforcement requires the recompiled build.** The mandatory-pit-stop check ships in the C# telemetry layer; it takes effect once the game's .NET assembly is rebuilt (next run/export). Until then it safely does nothing rather than mis-penalizing.
- **Driver-change rules are advisory.** Mandatory driver changes are shown in the brief but not auto-verified from telemetry (a pit stop is the only reliably detectable rule today).
- **Reverse-grid multi-race formats are not modeled.** Real series whose second-race grid is derived from the first race's finish (e.g. partial reverse grids) are intentionally single-race here, because AMS2 cannot seed one race's grid from another race's result.
- **Scrutineering can strand an inattentive team.** A car worn below a series' minimum is blocked from racing until serviced; the Race Day "Service car" CTA is the escape hatch if you've ignored maintenance.
- **Save-roundtrip dev test** relies on local fixtures under `data/dev/fixtures/`.

## v0.1

- Initial release: core career loop, AMS2 telemetry integration, championship/series structure, and the per-screen guided tutorial system.

---

*Built on Automobilista 2 by Reiza Studios. This is a fan-made project and is not affiliated with Reiza Studios.*
