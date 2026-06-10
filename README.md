# Apex Racing Manager

A motorsport career-management game built on real **Automobilista 2 (AMS2)** content. Run a team across multiple championships, build a season calendar, and race your weekends in AMS2 while the career layer turns your real results into points, prize money, standings, and stories.

![Version](https://img.shields.io/badge/Version-0.3.0-blue) ![Engine](https://img.shields.io/badge/Godot-4.6-478CBF) ![Platform](https://img.shields.io/badge/Platform-Windows-0078D6)

| | |
|---|---|
| **Active project** | `godot-career-prototype/` |
| **Engine** | Godot 4.6 (Mono / .NET 8) |
| **Platform** | Windows Desktop |
| **AMS2 integration** | Shared-memory telemetry + Custom AI Driver XML export |

> **Note:** The repository also contains an older Electron/React prototype at the repo root. **v0.3 development happens in `godot-career-prototype/`** ΓÇö that is the game described here.

---

## What is v0.3?

v0.3 is a major step toward a **commercial-quality AMS2 career manager**. Career creation choices permanently shape the live simulation, sponsors and finances carry real stakes into every race weekend, staff and board systems add management depth, and AMS2 integration is tighter ΓÇö from install-based world import through live telemetry to byte-faithful AI export.

### Career creation ΓåÆ live effects

Every choice in career creation is wired into the running career:

- **Commercial DNA** (background, persona, operational bias) changes sponsor deal value, inbound offer frequency, and your commercial profile.
- **HQ location & operational build** set a lasting logistics multiplier on weekly operations and race-weekend costs.
- **Engineering pedigree** reduces car wear every race weekend.
- **Board temperament** (dynasty backgrounds, aggressive launches, risk appetite) tightens or relaxes season targets and end-of-season bonus/penalty stakes.
- **Decision tempo, recruitment focus, and risk appetite** each have distinct gameplay effects on how fast you act, who you can hire, and how much financial risk you carry.
- **Staffing depth** decides how well delegated race weekends perform.
- **Media pressure** from your public profile amplifies sponsor satisfaction swings.

### Game World ΓÇö import your AMS2 install

Career creation starts with your actual AMS2 installation:

- **Automatic install detection** via Steam (registry + library folders), including secondary drives; manual override is remembered.
- **Custom AI grids** scanned from `UserData/CustomAIDrivers` ΓÇö both attribute-style XML and child-element formats (NAMeS, official grids).
- **Per-class opt-in** with driver/livery counts and ~60 class alias mappings (`F-Classic_Gen1` ΓåÆ Formula Classic G1, `MiniChallenge` ΓåÆ JCW, etc.).
- **Livery-aware driver assignment** ΓÇö imported drivers match their AMS2 livery first; skill ratings merge into career ratings.
- **Mod previews** extracted from mod archives; manual XML import and built-in roster fallback remain available.
- **Live world summary** panel before you commit.

### Staff management

Full staff hub (`Staff` screen):

- Roster with morale, wages, and role coverage.
- **Contracts** ΓÇö negotiate accept/lowball, fire with severance, fill vacancies.
- **Scout & hire** from a live market with varied real profiles (not placeholder seeds).
- Weekly operations cost uses the **real wage bill**.
- Career creation staffing choices affect delegated weekend quality.

### Board system

- **Seven board archetypes** derived from founder background.
- **Board dossier** overlay from Home (`VIEW BOARD`).
- **Board meetings** ΓÇö exitable, negotiable objectives, per-series mandates.
- **Dynamic prize-money objectives** from the real payout ladder.
- **Credit line & bailouts** ΓÇö three missed loan payments trigger board intervention with lasting commercial reputation damage.

### Sponsors & finances

- **2,500 generated brands** across five deal tiers with negotiation, patience, personalities, satisfaction, volatility, and persistent relationship history.
- **Full transaction ledger** ΓÇö every cash movement recorded with running balance on the Finances screen.
- **Weekly operations costs** scale with fleet and real staff wages.
- **Loans** ΓÇö draw against commercial profile; weekly servicing with strike-and-bailout paths.
- **Race Day stakes panel** ΓÇö guaranteed fees, win/podium bonuses, attendance clauses, and deals near termination before you run the weekend.

### Nothing is instant

Major actions flow through a **pending-actions pipeline** ΓÇö accept sponsors (1ΓÇô2 days), series entry (2ΓÇô3 days), car delivery (3ΓÇô7 days), staff offers (1ΓÇô3 days), workshop locks (1ΓÇô7 days), loan approval (1ΓÇô2 days). Confirmations arrive by mail; advance time with **Continue** to resolve them.

### Calendar, test days & race loop

- Calendar starts **January 5, 2026** (no snap to first race).
- **Test days** ΓÇö book from Calendar, drive in AMS2 or simulate; track knowledge, shakedown findings, wear, and debrief mail.
- **Multi-race weekends** for Sprint championships ΓÇö independent qualifying per race, combined weekend scoring.
- **Regulation enforcement** ΓÇö mandatory pit stops void points when telemetry confirms no stop.
- **Delegated weekends** reflect your actual staff quality.
- **Mail inbox** newest-first; `must_do` mails block Continue (FM-style).
- **Tutorials** once per career, replayable via `?` help buttons.

### AMS2 integration

#### Live telemetry

- Shared-memory telemetry auto-detects Practice / Qualifying / Race sessions.
- Results commit to championship standings, prize money, and stats.
- Animated **SYNCING WITH AMS2** state between sessions on Race Day.

#### Custom AI Driver export

On Race Day load, the game writes career-tuned AI files to your **AMS2 install folder**:

```
<AMS2 install>/UserData/CustomAIDrivers/
```

**Not** Documents ΓÇö the install path only.

- Byte-faithful to NAMeS / Ultimate Companion XML format (BOM, CRLF, exact element order).
- **Stats-only changes** ΓÇö NAMeS driver names are preserved; career world seeds from install XML ground truth.
- Enable **"Customized AI Names"** in AMS2: **Options ΓåÆ Gameplay**.
- AMS2 reads Custom AI files at session load; export diagnostics appear in the live Race Day panel.

### Marketplace, garage & cars

- Ongoing marketplace with weekly refresh, live auctions (proxy bidding, AI rivals, escrow, anti-snipe), and consignment sales.
- Per-system car wear (engine, gearbox, brakes, suspension, chassis) with scrutineering minimums per series.
- Two-part maintenance ΓÇö automatic weekend running cost plus manual per-system or full service in the garage.
- Buy-now with delivery delay; auction wins deliver in 2ΓÇô5 days; cars show **IN TRANSIT** until arrival.

### Support & diagnostics

- Persistent file logging with session header (version, engine, OS, timestamp); logs rotate automatically.
- **Settings ΓåÆ Support** ΓÇö live AMS2 telemetry status, Open Logs Folder, Report an Issue (GitHub).
- Version stamped in `project.godot` and exported builds.

---

## How it works

1. **Create a career** ΓÇö import your AMS2 world, pick team DNA, staff, and starting championship(s).
2. **Build your programme** ΓÇö enter series, hire staff, sign sponsors, buy cars, book test days.
3. **Advance the calendar** ΓÇö resolve mail, pending actions, board meetings, and auctions between race weeks.
4. **Race in AMS2** ΓÇö Apex Racing Manager reads live telemetry; AI export syncs the field before you load the session.
5. **Consequences apply** ΓÇö points, prize money, sponsor satisfaction, wear, finances, and inbox stories update automatically.

---

## Requirements

- **Windows**
- **Godot 4.6** with .NET support (Mono build)
- **Automobilista 2** (Steam)
- AMS2 **shared-memory telemetry** enabled
- AMS2 **"Customized AI Names"** enabled (Options ΓåÆ Gameplay) for AI export

---

## Getting started

### Open the project

1. Install [Godot 4.6 .NET](https://godotengine.org/download).
2. Open `godot-career-prototype/project.godot` in the Godot editor.
3. Press **F5** (or Play) ΓÇö main scene is `res://scenes/intro.tscn`.

### AMS2 paths

The game auto-detects your AMS2 Steam install. Custom AI export writes to:

```
<your AMS2 install>/UserData/CustomAIDrivers/
```

If detection fails, set the path manually during career creation (Game World step); it is saved for future careers.

### Headless smoke tests

From a terminal, using the Godot **console** executable:

```powershell
$godot = "C:\path\to\Godot_v4.6.1-stable_win64_console.exe"
$project = "C:\path\to\Carrer Mod\godot-career-prototype"

& $godot --headless --path $project --script res://scripts/dev/pending_actions_smoke_test.gd
```

Key regression suites (all passing as of v0.3):

| Suite | Script |
|---|---|
| Pending actions (17 tests) | `pending_actions_smoke_test.gd` |
| Staff management | `staff_management_smoke_test.gd` |
| Test days | `test_day_smoke_test.gd` |
| AMS2 AI export | `ams2_ai_export_smoke_test.gd` |
| Sponsor & finance lifecycle | `sponsor_finance_smoke_test.gd` |
| Career choice effects | `career_choice_effects_smoke_test.gd` |
| AMS2 install import | `ams2_install_import_smoke_test.gd` |
| Full world checks | `run_all_world_checks.gd` |

---

## Project structure

```
Carrer Mod/
Γö£ΓöÇΓöÇ godot-career-prototype/          # ΓåÉ Active v0.3 game
Γöé   Γö£ΓöÇΓöÇ scenes/                      # UI scenes (intro, home, race day, staff, ΓÇª)
Γöé   Γö£ΓöÇΓöÇ scripts/
Γöé   Γöé   Γö£ΓöÇΓöÇ prototype_state.gd     # Core career state & pending actions
Γöé   Γöé   Γö£ΓöÇΓöÇ career_creation_flow.gd
Γöé   Γöé   Γö£ΓöÇΓöÇ adapters/                # AMS2 import/export, career creation
Γöé   Γöé   Γö£ΓöÇΓöÇ dev/                     # Headless smoke tests
Γöé   Γöé   ΓööΓöÇΓöÇ *_screen.gd              # Screen controllers
Γöé   Γö£ΓöÇΓöÇ data/                        # Series, tracks, sponsors, fixtures
Γöé   ΓööΓöÇΓöÇ project.godot                # config/version = 0.3.0
Γö£ΓöÇΓöÇ electron/                        # Legacy Electron prototype (not v0.3)
ΓööΓöÇΓöÇ src/                             # Legacy React UI (not v0.3)
```

---

## Known issues & roadmap

| Status | Item |
|---|---|
| Known | Mail filter tab badges show `0` while the header count is correct (unwired). |
| Known | Driver-change rules are advisory ΓÇö only pit stops are telemetry-verified today. |
| Known | Reverse-grid multi-race formats are intentionally single-race (AMS2 cannot seed one race grid from another). |
| Planned | Road to Round 1 pre-season milestone checklist |
| Planned | Development screen (nav placeholder) |
| Planned | Facilities screen (placeholder) |
| Planned | Media system |

---

## Contributing

This is a fan project for the AMS2 community. The active codebase is `godot-career-prototype/`. Issues and PRs welcome.

## License

MIT License ΓÇö see LICENSE file for details.

## Acknowledgments

- Reiza Studios for Automobilista 2
- The AMS2 modding community (NAMeS, Custom AI documentation, Ultimate Companion format)
- Project CARS 2 shared-memory telemetry specification

---

*Built on Automobilista 2 by Reiza Studios. This is a fan-made project and is not affiliated with Reiza Studios.*
