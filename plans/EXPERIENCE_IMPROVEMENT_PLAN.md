# AMS2 Career Companion — Experience Improvement Plan

**Goal: Player is racing within 10 minutes of starting a new career.**
**Design principle: Surface drama, hide complexity. Julia handles the world, you make the calls.**

---

## The Core Problem in Numbers

| Issue | Current State | Target |
|---|---|---|
| Career creation steps | 5 steps (personal life, partner traits, 4 contacts) | 3 steps |
| Week 1 mandatory activities | 25+ over 3 weeks | 4 essential, rest optional |
| Emails per week (normal) | 8–15 | 2–4 |
| Navigation items | 27 | 8 primary + collapsible rest |
| Time to first race | ~3–4 weeks of gameplay | End of Week 1 or 2 |
| Fast-forward success rate | Blocked constantly | Works almost every non-race week |

---

## Phase 1 — The Critical Path: 10 Minutes to First Race

**Everything in this phase is about removing friction between "press start" and "your first race result."**

### 1.1 Streamline Career Creation

**Current:** 5 steps including dating preference, partner traits, relationship status, 4 starter contacts with per-slot configuration.
**Problem:** You're asked to design your personal life before you've played a single minute.
**Fix:** 3-step creation. Defer personal life entirely.

**New flow:**
1. **Background** — Pick your owner archetype (unchanged, it's good)
2. **Identity** — Name, team name, HQ country (collapsed to one screen)
3. **Start** — Review + "Found Team" button. That's it.

Everything else — relationship status, partner, contacts, API key — unlocks **in-game** naturally:
- Week 1: Julia introduces herself and says "I'll need a few details from you this week" → triggers a one-time personal life setup activity on the calendar (optional, not mandatory)
- API key: Settings screen, reachable from the sidebar anytime
- Starter contacts: Julia introduces 1–2 contacts organically over the first 2 weeks via phone messages

**Files to change:**
- `src/screens/CareerCreation/index.tsx` — Remove steps 4–5, merge steps 3 into step 2
- `src/store/careerStore.ts` — Personal life setup defaults to sensible values, unlocks gradually

---

### 1.2 Radically Reduce Week 1 Mandatory Activities

**Current:** 13 activities in Week 1 alone (Team Briefing, Facility Walkthrough, Finance Intro, HR Intro, Calendar Training, Sponsor Expectations, Garage Intro, Media Intro, Partner Dinner, Week 1 Wrap, etc.)
**Problem:** The player cannot fast-forward at all in the first 3 weeks. Every day is packed. This is tutorial disguised as gameplay — and it's a chore.
**Fix:** Cut to 4 essential Week 1 activities. Convert the rest to optional "bonus" activities or in-context tooltips.

**Keep as mandatory (Week 1):**
1. **Team Briefing** (Day 1, 1hr) — Introduces the team, unlocks the garage
2. **First Sponsor Call** (Day 3, 1hr) — Teaches the sponsor system by doing it, not explaining it
3. **Pre-Race Strategy** (Day 5, 1hr) — Unlocks race entry, introduces car setup concept
4. **First Race** (Day 7 or Week 2 earliest) — Get them racing

**Convert to optional:**
- Finance Intro → tooltip on first Finances screen visit
- Facility Walkthrough → tooltip on first Facilities screen visit
- Media Intro → tooltip on first Media screen visit
- Calendar Training → contextual hint when first activity is scheduled
- Everything in Weeks 2–3 onboarding → convert to Julia suggestions, not mandatory blocks

**Files to change:**
- `src/simulation/onboardingMandatorySchedule.ts` — Cut to 4 mandatory items
- `src/simulation/activities/mandatoryActivities.ts` — Reduce urgency/warnings for first 4 weeks
- Add contextual first-visit tooltips to key screens instead

---

### 1.3 Make Fast-Forward Actually Work in Week 1

**Current:** Fast-forward is blocked by urgent emails that generate constantly from the onboarding system itself.
**Fix:** Two changes:

1. **Mark all onboarding system emails as non-blocking** — `actionType: 'acknowledge'` emails should never stop fast-forward. Only `accept_decline`, `review_counter`, and genuine dilemmas should.

2. **Add a "first race" fast-forward preset** — When no race has been completed yet, the Skip button shows "Skip to first race" and fast-forwards with relaxed stop conditions (only stops for: a genuine contract decision or negative cash).

**Files to change:**
- `src/store/careerStore.ts` — Update `getFastForwardCriticalStopReason` to exclude `acknowledge` and `activity_reminder` actionTypes from stopping
- `src/store/careerStore.ts` — `startFastForwardToRaceWeek` checks if this is first race, uses relaxed config

---

## Phase 2 — Email Noise Reduction

**Target: Cut email volume by 60–70%. Only genuine decisions reach the inbox.**

### 2.1 Email Audit — Precise Cut List

Full audit of every `addEmail()` call in the codebase. Verdict for each:

#### CUT entirely (5 emails — just delete the addEmail call)
| Context | Subject | Why |
|---|---|---|
| `approveDelegationAction` | "Approved: [action]" | Echo of player's own decision |
| `rejectDelegationAction` | "Noted: [action] — cancelled" | Echo of player's own decision |
| `publishMandatoryActivity` (tomorrow reminder) | "Reminder: [activity] Tomorrow" | Redundant with calendar |
| `publishMandatoryActivity` (today action) | "[activity] Today - Action Required" | Redundant with calendar |
| `publishMandatoryActivity` (today's list) | "Today: [N] activities" | Explicitly tells player to check calendar — skip the middleman |

#### CONVERT to toast (9 emails → brief toast notification instead)
| Context | Subject | Why |
|---|---|---|
| `initiateSponsorApproach` | "Partnership inquiry sent – [name]" | Player just did this, they know |
| `processSeasonEnd` contract renewed | "Contract Renewed!" | Celebratory, no action needed |
| `processSeasonEnd` staff departure | "Staff Departure: [name]" | Informational, no decision |
| `handleMissedActivity` | "Candidate withdrew: [name]" | Consequence notice, no action |
| `publishMandatoryActivity` (scheduled) | "Mandatory: [activity] Required" | Brief alert is enough |
| `scheduleStaffInterview` | "Interview scheduled: [name]" | Already on calendar |
| `delegateStaffAutonomy` | "Taking over [capability]" | Confirmation of player's action |
| Sponsor outreach result (no response) | Various | Routine outcome, no decision |
| Activity completion (non-injury) | Various confirmations | No decision required |

#### KEEP as emails (7 — genuine decisions or important state changes)
| Context | Subject | Why |
|---|---|---|
| Injury report (crash/activity) | "Injury Report: [type]" | Affects race availability, needs acknowledgment |
| Contract termination | "Contract Terminated" | Major career event |
| Vehicle inspection (critical wear) | "Critical Wear on [car]" | Pre-race action needed |
| Vehicle technical inspection (with repair data) | "Technical Inspection Complete" | Data report to reference |
| Staff shortlist approval | "Shortlist for [role] – approval needed" | Requires player decision |
| Sponsor deal accepted (NegotiationModal) | (deal confirmation) | Financial record |
| Sponsor counter-offer (NegotiationModal) | "RE: [sponsor] Partnership" | Active negotiation chain |

**Net result: ~67% reduction in email volume on a normal week.**

**Files to change:**
- `src/store/careerStore.ts` — Remove 5 CUT calls, replace 9 with `addToast()` or silent
- `src/simulation/activities/mandatoryActivities.ts` — Activity reminders → calendar badges only

### 2.2 Julia's Weekly Briefing Card

Replace all the converted emails with a single generated card that appears on the Home screen each Monday.

**Content:**
- One sentence on team finances ("Cash is healthy at $240K — up $18K this week")
- One sentence on driver ("Marco's confidence is high after testing")
- One sentence on sponsors ("TechTír satisfaction steady. No action needed.")
- One call-to-action if relevant ("Worth visiting the Sponsor Market this week — 3 new offers")

**This is not an email. It's a card component on the Home screen that regenerates each week.**

**New file:** `src/components/owner/JuliaBriefingCard.tsx`
**Modified:** `src/screens/Home/index.tsx` — Add briefing card as first visible element

---

## Phase 3 — Home Screen as Mission Control

**Current:** Good bones (7 sections) but no clear "what do I do next."
**Fix:** Restructure so the first thing you see answers three questions: How am I doing? What needs my attention? What's happening in the world?

### 3.1 New Home Screen Layout

**Above the fold (always visible without scrolling):**

```
┌─────────────────────────────────────────────────────────┐
│  JULIA'S BRIEFING                               Week 14  │
│  "Race in 3 days. One thing needs your call."            │
│  → TechTír contract expires in 2 weeks [Go to Sponsors]  │
├────────────────┬────────────────┬───────────────────────┤
│  CHAMPIONSHIP  │   NEXT RACE    │   TEAM HEALTH         │
│  P4 — 12 pts   │  Spa — 3 days  │  ████░░ Good          │
│  behind Müller │  Ready ✓       │                       │
└────────────────┴────────────────┴───────────────────────┘
```

**Below the fold (can scroll to):**
- Recent form chart
- News feed / rival activity
- Weekly schedule overview

### 3.2 The "One Thing" Card

The most important single action the player should take this session. Computed by priority:
1. Urgent email requiring decision (link to inbox)
2. Race in ≤ 3 days and car not ready (link to garage)
3. Contract expiring in ≤ 2 weeks (link to sponsors)
4. Driver confidence very low (link to personal life / phone)
5. Fast-forward available + nothing blocking (show Skip button directly on home screen)

**Files to change:**
- `src/screens/Home/index.tsx` — Full restructure
- New component: `src/components/owner/JuliaBriefingCard.tsx`
- New component: `src/components/owner/OneThingCard.tsx`
- New util: `src/simulation/priorities/getTopPriority.ts` — Returns the single most important action

---

## Phase 4 — Navigation Simplification

**Current:** 27 items across 5 groups. A new player has no idea what matters.
**Fix:** 8 primary items always visible. Everything else behind "More" groups that collapse by default.

### 4.1 New Navigation Hierarchy

**PRIMARY (always visible, 8 items):**
1. Home (Hub)
2. Inbox (with badge)
3. Calendar
4. Race Day (highlighted during race week)
5. Garage
6. Sponsors
7. Finances
8. Phone

**SECONDARY (collapsed groups, expand on click):**
- **Racing:** Paddock, Scouting, Series Entry, Marketplace
- **Operations:** Facilities, Manufacturing, Staff Market, Logistics
- **Personal:** Wealth, Investments, Family, Lifestyle, Social, Media
- **System:** Settings, How to Play, Logs

**Visual treatment:**
- Race week: Race Day item pulses/highlights
- Unread badge on Inbox, Phone
- Dim groups that have nothing urgent

**Files to change:**
- `src/components/layout/Sidebar.tsx` — Restructure nav groups, collapse secondary by default

---

## Phase 5 — Race Week as Peak Experience

**Goal: Race week should feel different. The player should feel anticipation, then climax, then consequence.**

### 5.1 Race Week Mode

When `currentDay === 1` and there's a race this week, the Home screen enters "Race Week" mode:
- Header changes to show the circuit name and country flag
- A race countdown replaces the weekly schedule bar
- Julia's briefing focuses entirely on race prep
- Sidebar highlights Race Day item

### 5.2 Simplified Race Result Presentation

**Current:** Post-race modal with debrief data, modifier breakdown, car condition, points, prize money, all at once.
**Fix:** Beat-by-beat reveal, like a proper game:

1. **The moment:** Large position display. "P3" in race colours. Podium/points/DNF context.
2. **The story:** 2–3 sentences of commentary on what happened. ("Strong start, held off Müller through the middle stint, tyre management cost a place in the final laps.")
3. **The consequences:** Championship standing moves. Sponsor satisfaction delta. Driver confidence change. Cash earned.
4. **The next chapter:** "Next race: Monza in 3 weeks. You're 8 points off the lead." + Skip button right there.

**Files to change:**
- `src/screens/RaceDay/index.tsx` — Restructure post-race modal into sequential beat reveal
- New component: `src/components/race/RaceResultReveal.tsx`

### 5.3 Post-Race Automatic Cleanup

Currently after a race there are mandatory activities (Race Debrief, Damage Assessment) and emails that block fast-forward.

**Fix:** These auto-complete silently unless something is critical:
- Race Debrief → auto-complete, brief summary appears in Julia's next briefing
- Car Damage Assessment → auto-complete unless damage is severe (>70% wear), in which case Julia flags it
- Post-race sponsor satisfaction → computed silently, shows in next briefing

This means **the player can skip to the next race immediately after seeing results.**

---

## Phase 6 — Julia as Proactive Co-Manager

**Goal: Reduce the number of things a player must actively hunt for. Julia brings the world to you.**

### 6.1 Julia's Proactive Nudges

Julia should notice things and surface them without the player having to tour screens:

- "Your front wing wear is at 78%. Worth ordering a replacement before Spa." (link to Manufacturing)
- "Haven't heard from TechTír in 3 weeks. Their satisfaction has dipped — might be worth a check-in." (link to Sponsors)
- "Your driver's confidence has been low for 2 weeks. A training session might help." (link to Calendar)

These appear as **small cards on the Home screen** (not emails), dismissable, maximum 1–2 visible at a time.

**New file:** `src/simulation/julia/nudgeEngine.ts`
Scans game state weekly, produces 0–2 nudges based on thresholds.

### 6.2 Delegate More to Julia

Things Julia should handle silently with a log entry, not an email:
- Routine sponsor check-ins (no decision needed)
- Activity scheduling for non-critical weeks
- Minor car maintenance orders when budget allows
- Press request responses that are clearly positive/neutral

---

## Phase 7 — Long-term Engagement: The Story Arc

**For players who stick past the first race, make them feel the career building toward something.**

### 7.1 Always-Visible Objectives

3 tiered objectives always on the Home screen:
- **This race:** "Finish top 5 at Spa"
- **This season:** "Close the gap to 2nd in championship (currently P4, -12pts)"
- **Career:** "Reach Tier 3 constructor standing" (GOAT progress connection)

### 7.2 Rival Story Feed

Rivals should generate 1–2 story beats per week, shown in the news feed:
- "Santos crashes in qualifying — starts from pit lane"
- "Müller signs star driver — team gets stronger next season"
- "Your series rival TechRace running out of funding — rumours of withdrawal"

This already partially exists in the rival store and news feed. It just needs consistent generation and better surfacing.

---

## Implementation Order

**Sprint 1 (Highest ROI — get to racing fast):**
1. Phase 1.1 — Streamline career creation (remove personal life from creation)
2. Phase 1.2 — Cut Week 1 onboarding to 4 mandatory activities
3. Phase 1.3 — Fast-forward works from Day 1 (fix acknowledge email blocking)

**Sprint 2 (Reduce noise):**
4. Phase 2.1 — Email audit, cut 60%+ of addEmail() calls
5. Phase 2.2 — Julia's weekly briefing card

**Sprint 3 (Better home screen):**
6. Phase 3.1/3.2 — Home screen restructure + One Thing card

**Sprint 4 (Navigation + Race experience):**
7. Phase 4.1 — Navigation simplification
8. Phase 5.2/5.3 — Race result reveal + auto-cleanup

**Sprint 5 (Polish + Depth):**
9. Phase 6 — Julia nudge engine
10. Phase 7 — Objectives + Rival story feed

---

## Success Metrics

| Metric | Current | Target |
|---|---|---|
| Time from "new career" to first race result | ~4 real-world hours | <15 minutes |
| Emails received in a normal (non-race) week | 8–15 | 2–4 |
| Decisions requiring player action per week | 15–20 | 3–6 |
| Fast-forward blocked in a routine week | Often | Almost never |
| Player knows "what to do next" without hunting | No | Yes (One Thing card) |
