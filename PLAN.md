# AMS2 Team-Owner Manager — Implementation Plan

## End-State Vision (Full-Blown)
- Team ownership & identity: create/buy teams, branding (name/colors/livery presets), HQ/base country, fan sentiment, board politics/approval.
- Multi-series ecosystem: multiple series (GT, prototypes, open-wheel, touring, regional), multi-car entries, BoP/reg changes per season, calendar conflicts, wildcards.
- Vehicle program: works vs customer chassis/engine, lease/purchase, homologation cycles, BoP swings, part inventory/wear/failures, scrutineering risk, R&D/upgrade trees with lead times and quality variance.
- Staffing & org: roles (technical director, chief engineer, performance/tyre/sim analysts, strategist, pit crew, mechanics, PR), skills/traits, contracts/options/buyouts, training, fatigue, morale, error modeling (pit mistakes, setup quality, reliability).
- Drivers & pipeline: senior/reserve/academy, scouting by region/series, personalities/synergy, marketability, development curves, injuries/fatigue.
- Finances & economics: capex/opex, cash flow, loans/credit lines, board-set budgets and cost caps, sponsorship tiers/activations, prize money, fees/fines/taxes, investor events.
- Operations & logistics: travel/freight choices, turnaround times affecting readiness, weather/supply disruption risk, event staffing caps.
- Weekend simulation: practice programs, setup feedback, tyre/fuel/energy strategy, SC/VSC probabilities, pit error/reliability checks, AMS2 result ingest, debrief data pack, wear deltas and dev insights.
- Manufacturer relations: reputation ladder, works perks and demands, mid-season reassignments, tech sharing, political pressure.
- Narrative & media: headlines/controversies, rivalries (driver/team/manufacturer), media duties with consequences, fan sentiment impacting sponsors/board.
- World aging: seasonal regulation changes, tech resets, retirements/rookies, team expansions/contractions, economic cycles.
- Multiplayer/async (later): shared worlds, commissioner tools, anti-exploit checks.

## Delivery Stages (toward full vision)
- Stage 1 — Owner foundation & single-series operations.
- Stage 2 — Depth: parts, staff org, facilities, logistics, scouting/academy.
- Stage 3 — Multi-series programs and advanced economics.
- Stage 4 — World simulation, regulations, manufacturer politics.
- Stage 5 — Multiplayer/async and polish.

## Stage 1 Scope (deep detail)
Goal: You own one team (up to 2 cars) in a chosen series, operate with works/customer choice, manage drivers + basic staff, run upgrades/maintenance, satisfy board and sponsors, ingest AMS2 results to drive finances/morale/wear.

Features
- Team creation/branding: team name/colors/logo preset, base country, manufacturer alignment, reputation + fanSentiment seeds.
- Series entry: choose series, pay entry fee, set carCount (1–2), select works/customer manufacturer; store entry status and costCap if series defines one.
- Roster/contracts: drivers (primary + reserve), contract options/bonuses, targets (champ position, points, DNF limit). Staff slot v1: chief engineer + strategist with skills affecting reliability and pit/strategy quality.
- Car program: chassis + engine assignment per car; attributes (performance, reliability, wear %, mileage, compliance flags). Part wear per race; maintenance action (cost + restores wear/reliability).
- Upgrades v1: simple queue with two branches — performance and reliability — with lead time and cost; quality variance; applies to both cars’ base performance/reliability.
- Board & expectations: boardTargets (champ position, points_min, budget_cap, dnf_limit, development_milestone), severity, mood impacts; boardMood displayed on HQ dashboard.
- Finances: cash, capex/opex buckets, entry/lease costs, salaries (drivers/staff), maintenance costs, prize money ingestion, sponsor income; runway calc on dashboard.
- Sponsors: reuse existing sponsor system; tie satisfaction deltas to results/targets; allow team-level sponsor slots.
- Race weekend loop: lineup assignment to cars, pre-race cost summary, condition warnings. Post-race ingest from AMS2 results → prize, wear hits, morale, sponsor/board updates.
- UI surfaces: HQ dashboard (cash/runway, board mood, next event, car health), Series Entry, Roster/Contracts, Cars & Upgrades, Race Weekend panel, Board & Sponsors block.

Initial data model targets
- Team: id, name, colors, baseCountry, reputation, fanSentiment, boardMood, cash, budgets {capex, opex}, identity/manufacturerAlignment, facilities {aero, chassis, engine, sim, mfg, marketing}, staffSlots.
- SeriesEntry: seriesId, carCount, entryFee, manufacturerId, worksCustomer, status, costCap (optional), conflictRules (reserved for later).
- Car: carId, seriesId, chassisId, engineId, perf, reliability, wear, mileage, complianceFlags, upgradeQueue[], nextServiceWeek.
- StaffContract: role (chief_engineer, strategist), skills {reliability, strategy, pit, aeroAssist}, salary, bonuses, fatigue/morale.
- DriverContract: existing schema + role (primary/reserve), synergy tags.
- BoardTargets: type (champ_position, points_min, budget_cap, dnf_limit, development_milestone), severity, progress, moodImpact.

Implementation ordering for Stage 1
1) Schema/store: add Team, SeriesEntry, Car, BoardTargets, staff contracts; wire defaults/hydration/migrations. ✅ DONE
2) Creation flow: owner backgrounds with perks/connections/cash; team naming + base country; navigate to home to buy car + enter series. ✅ DONE
3) Roster/staff UI: drivers table with contracts/targets; staff slots with skills and salaries; assignment to cars.
4) Cars & Upgrades: car cards showing perf/reliability/wear; maintenance action; simple perf/reliability upgrade queue with cost/lead-time.
5) Board & finances: board mood + targets panel; runway calc; integrate costs (entry, salaries, maintenance, upgrades) and prize payouts from results.
6) Race loop: pre-race panel (lineups, costs, condition warnings); post-race ingest (results → prize, wear, morale, sponsor/board adjustments).
7) Sponsors integration: allow team-level slots; tie satisfaction to results/targets; reuse existing sponsor UI with team context.
8) Car marketplace: buy/sell cars, acquire liveries, enter series from in-game flow (not creation).

## Owner Backgrounds (Implemented)
Eight owner backgrounds with distinct starting conditions:
- **Self-Made Entrepreneur** ($350K, 40 rep) - Negotiation bonus, cost management
- **Racing Dynasty Heir** ($850K, 60 rep) - Manufacturer connections, family contacts
- **Tech Investor** ($2.5M, 35 rep) - Investment opportunities, tech partnerships
- **Former Racing Driver** ($450K, 55 rep) - Paddock respect, driver insight
- **Finance Mogul** ($1.4M, 30 rep) - Loan terms, investor network, cost control
- **Passionate Enthusiast** ($280K, 45 rep) - Fan favorite, grassroots support
- **Corporate Executive** ($900K, 35 rep) - Corporate sponsors, professional network
- **Lottery Winner** ($1M, 20 rep) - Lucky streak, nothing to lose (but penalties)

Each background provides:
- Starting cash and reputation
- Unique perks with gameplay effects
- Manufacturer connection bonuses
- Financial modifiers (sponsor negotiation, loan terms, cost management)
- Board patience and initial mood
- Special flags (paddock respect, media connections, etc.)
- Story bio for immersion

## Location Perks (Implemented)
Team base country affects operations and opportunities:
- **UK** (Motorsport Valley) - +20% engineer quality, +15% aero dev, higher staff costs
- **Germany** (Engineering Excellence) - +20% chassis dev, +15% reliability
- **Italy** (Racing Passion) - +25% fan engagement, +15% sponsor pool, +20% media
- **USA** (Commercial Powerhouse) - +30% sponsor pool, +25% media, +20% investment access
- **Japan** (Manufacturing Precision) - +25% reliability, +10% chassis dev
- **Brazil** (Emerging Market) - -20% operational costs, -15% staff/facility costs
- **France** (Endurance Heritage) - +10% aero/reliability, endurance series access
- **Netherlands** (Strategic Hub) - -5% operational costs, +10% investment access
- **Australia** (Pacific Gateway) - +10% fan engagement, +10% sponsor pool

## Travel & Logistics System (Implemented)
Interactive world map for HQ selection with real cost implications:

**Travel Cost Multipliers by Region:**
| From → To | Same Region | Cross-Atlantic | Cross-Pacific |
|-----------|------------|----------------|---------------|
| Multiplier | 1.0x | 1.5-2.0x | 1.8-2.5x |

**What Gets Affected:**
- Per-race travel costs (staff flights, accommodation)
- Freight/shipping costs (cars, spares, equipment)
- Turnaround time (days lost between races)
- Staff fatigue (affects development speed)

**Logistics Hubs** (rent to reduce costs in other regions):
- UK Logistics Center ($8K/week, -40% freight)
- German Operations Base ($7.5K/week, -35% freight)
- US East/West Coast Facilities ($9K/week, -45% freight)
- Japan Technical Center ($10K/week, -50% freight)
- São Paulo Center ($5K/week, -35% freight)
- Dubai Freight Hub ($12K/week, -50% freight)

**Example Series Costs** (shown when selecting location):
- Best value series for your location
- High cost series with fatigue/turnaround warnings
- Annual travel + freight cost estimates

Perks affect:
- Development bonuses (aero, chassis, reliability)
- Cost modifiers (operational, staff, facilities)
- Sponsor and investment opportunities
- Media coverage and fan engagement
- Series access bonuses

## Perk System Integration (Implemented)
Central utility (`src/simulation/perkSystem.ts`) that applies bonuses:

**Sponsor System Integration:**
- `applySponsorPerk()` - Boosts sponsor deal values based on owner negotiation bonus
- Corporate network attracts elite/business sponsors (+3 weight)
- Tech partners attract tech/gaming sponsors (+3 weight)
- Grassroots support attracts local/entry sponsors (+2 weight)

**Cost System Integration:**
- `applyOperationalCostPerk()` - Reduces equipment/operational costs
- Location-based cost modifiers (e.g., Brazil -20%, USA +5%)
- Owner cost management bonus stacks with location

**Available Perk Functions:**
- `applySponsorPerk(baseValue)` - Sponsor negotiation bonus
- `applyOperationalCostPerk(baseCost)` - Operational cost modifier
- `applyStaffCostPerk(baseSalary)` - Staff salary modifier
- `applyFacilityCostPerk(baseCost)` - Facility upgrade modifier
- `applyLoanInterestPerk(baseRate)` - Loan interest modifier
- `applyAeroDevPerk(baseProgress)` - Aero development bonus
- `applyChassisDevPerk(baseProgress)` - Chassis development bonus
- `applyReliabilityPerk(baseImprovement)` - Reliability bonus
- `applyEngineerQualityPerk(baseQuality)` - Engineer recruitment bonus
- `applyFanEngagementPerk(baseChange)` - Fan sentiment modifier
- `getBoardPatienceModifier()` - Board patience weeks
- `hasInvestmentAccess()` - Check for investment opportunities
- `getManufacturerConnections()` - Get connected manufacturer IDs
- `getSeriesAccessBonuses()` - Get series with easier entry

## Team Financial System (Implemented)

Comprehensive team-level financial management replacing personal driver finances:

**Income Sources:**
- Team Sponsors - Monthly payments from sponsors based on team tier and reputation
- Race Prizes - Position-based payouts (winner gets 2-10% of pool)
- Championship Prizes - Season-end bonuses for standings
- Manufacturer Support - Works team quarterly payments ($10K-$150K)
- Series Revenue Share - TV and participation money

**Expense Categories:**
- Entry Fees - Series entry costs ($500-$4M by tier)
- Development/R&D - Weekly burn rate ($500-$75K by tier)
- Facility Operations - Weekly costs ($200-$50K by tier)
- Travel & Logistics - Per-race and annual freight costs
- Manufacturer Lease - Customer team quarterly payments ($2.5K-$50K)

**Financial Config (`src/data/financial-config.ts`):**
- 7-tier system: entry, amateur, semi-pro, professional, pro, elite, pinnacle
- Entry fees, prize pools, manufacturer payments defined per tier
- Development and facility costs with weekly burn rates
- Cost cap amounts and exclusions
- Team sponsor payment tiers (local through global)

**Team Budgets Interface:**
- `cash` - Operating cash balance
- `totalBudget` - Season operating budget
- `developmentBudget` - Allocated for R&D/upgrades
- `travelBudget` - Allocated for logistics
- `contingencyBudget` - Emergency fund
- `costCapSpending` - Tracked cap-applicable expenses
- `projectedEndOfYear` - Financial projections

**Team Sponsor System (`src/simulation/finances/teamSponsors.ts`):**
- Sponsor generation based on team reputation
- Sponsor slots: title (3x payout), primary (1.5x), secondary (1x), associate (0.5x)
- Performance targets: races entered, podiums, wins, championship position
- Satisfaction tracking with warnings and termination risk
- Perk bonuses: corporate network, tech partners, grassroots support

**Financial Processing (`src/simulation/finances/teamFinances.ts`):**
- `processTeamSponsorPayments()` - Weekly sponsor income
- `processWeeklyFacilityCosts()` - Operational expenses
- `processWeeklyDevelopmentCosts()` - R&D burn rate
- `processManufacturerPayment()` - Quarterly works support or lease payments
- `processEntryFeePayment()` - Series entry costs
- `processPrizePayment()` - Race/championship prizes
- `calculateCostCapStatus()` - Cap compliance checking
- `calculateTeamRunway()` - Financial health and runway weeks

**Cost Cap System:**
- Applies to pro tier and above
- Cap amounts: Pro $2M, Elite $5M, Pinnacle $140M
- Tracks cap-applicable spending vs excluded expenses
- Status indicators: healthy (<80%), warning (80-90%), critical (90-100%), exceeded
- Entry fees excluded from cap

**Team Finances Dashboard (`src/components/finances/TeamFinancesDashboard.tsx`):**
- Overview: Cash balance, YTD income/expenses, monthly sponsor income
- Financial health: Runway indicator, cost cap tracker (if applicable)
- Transactions: Recent transaction history with categories
- Income tab: Breakdown by source with YTD totals
- Expenses tab: Breakdown by category with cost cap indicators
- Sponsors tab: Active sponsors, pending offers, satisfaction tracking
- Budget tab: Allocation bars, cost cap detail, series entries

**Integration Points:**
- `advanceWeek()` in careerStore processes weekly team finances
- CareerCreation initializes team with `createDefaultTeamBudgets()` and `createDefaultTeamFinancialState()`
- Finances screen conditionally renders team dashboard when `ownedTeam` exists

Notes
- Reuse existing sponsor/finance/contract plumbing where possible; extend types carefully.
- Keep migration/backwards compatibility in store hydration.
- AMS2 integration: extend AI XML generator for team-branded entries and ingest telemetry/results for wear/prize updates.
