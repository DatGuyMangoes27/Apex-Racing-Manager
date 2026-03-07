/**
 * Onboarding Guidance System
 * 
 * Sends daily guidance emails and phone messages during the first ~8 weeks
 * of a new career, introducing every major system through the appropriate channel.
 * 
 * Business/team topics → Email (from Team Manager, HR, Finance, etc.)
 * Personal life topics → Phone message (from partner or personal assistant)
 * 
 * Each step is condition-gated: if the player has already completed the relevant
 * task, the guidance message is skipped. Sent IDs are tracked to prevent duplicates.
 */

import type { CareerState, Email, EmailCategory, PlayerDriver } from '@/store/careerStore'

// ============================================
// TYPES
// ============================================

export interface OnboardingStep {
  /** Unique ID for tracking (stored in sentGuidanceIds) */
  id: string
  /** Week to send (1-based) */
  week: number
  /** Day to send (1-7, Monday=1, Sunday=7) */
  day: number
  /** Delivery channel */
  channel: 'email' | 'phone'
  /** Email sender name (for email channel) */
  sender?: string
  /** Email sender role (for email channel) */
  senderRole?: string
  /** Email category for inbox filing */
  emailCategory?: EmailCategory
  /** Phone contact type to look up (for phone channel) */
  phoneContactType?: 'partner' | 'personal_assistant' | 'friend'
  /** Return true to SKIP this step (task already done) */
  skipIf: (state: CareerState, player: PlayerDriver) => boolean
  /** Whether this is an urgent reminder (styles differently) */
  isUrgent?: boolean
  /** Generate the message content */
  generateContent: (state: CareerState, player: PlayerDriver) => {
    subject: string
    body: string
  }
}

export interface OnboardingResult {
  /** Emails to add to the inbox */
  emails: Array<Omit<Email, 'id'>>
  /** Phone messages to send */
  phoneMessages: Array<{
    contactType: string
    message: string
  }>
  /** IDs of steps that were sent */
  newSentIds: string[]
  /** Whether onboarding is now complete */
  markComplete: boolean
}

// ============================================
// HELPER: Team name for templates
// ============================================

function teamName(state: CareerState): string {
  return state.ownedTeam?.name || 'your team'
}

// ============================================
// ONBOARDING STEPS DEFINITION
// ============================================

export const ONBOARDING_STEPS: OnboardingStep[] = [

  // =============================================
  // WEEK 1 — "Setting Up Shop"
  // =============================================

  // Day 1: Your Inbox & Communications
  {
    id: 'w1d1_inbox_intro',
    week: 1, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false, // Always send
    generateContent: (state) => ({
      subject: 'Getting Started — Your Communication Hub',
      body: `Team Principal,

Welcome to your first day at ${teamName(state)}! This inbox is where all your important communications will arrive — sponsor offers, board messages, staff updates, media requests, and more.

A FEW TIPS TO GET STARTED:

1. CHECK YOUR INBOX REGULARLY — Important time-sensitive offers expire if you don't respond.

2. EMAILS ARE CATEGORIZED — Use the category tabs to filter by Sponsors, Board, Team, Contracts, Media, and more.

3. STARRED EMAILS — Star important messages so you can find them later.

4. ACTION REQUIRED — Some emails have buttons to accept/decline offers or navigate to relevant screens.

5. TODAY'S SCHEDULE — You have several mandatory intro meetings today. Check your CALENDAR and complete them to get into the rhythm of the role.

Over the coming days, I'll be sending you guidance on each aspect of running a racing team. Don't feel overwhelmed — take it one step at a time.

Your Team Manager`
    })
  },

  // Day 1: Phone/Messaging introduction
  {
    id: 'w1d1_phone_intro',
    week: 1, day: 1,
    channel: 'phone',
    phoneContactType: 'personal_assistant',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Phone Introduction',
      body: `Hey boss! I'm your personal assistant. I'll be sending you messages here on your phone for anything personal — life stuff, reminders, health tips, that kind of thing. Your work emails go to your inbox, but personal matters come through here. Check your phone whenever you see a notification! 📱`
    })
  },

  // Day 2: Buy a Car
  {
    id: 'w1d2_buy_car',
    week: 1, day: 2,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: (state) => (state.cars?.length ?? 0) > 0,
    generateContent: (state) => ({
      subject: 'Priority: Acquire Your First Car',
      body: `Team Principal,

Your most urgent task right now is to get a car. Without one, ${teamName(state)} can't compete!

HOW TO BUY A CAR:
• Head to the MARKETPLACE from the sidebar menu
• Browse available cars by series and manufacturer
• Check the price against your budget (currently $${((state.ownedTeam?.budgets?.cash ?? 0) / 1000).toFixed(0)}k)
• Consider which racing series you want to compete in — different series require different car types

THINGS TO CONSIDER:
• Cheaper cars leave more budget for staff and development
• Some manufacturers offer better reliability or performance
• You'll need to match your car to a compatible racing series

This is your #1 priority. Everything else depends on having a car to race.

Your Team Manager`
    })
  },

  // Day 2: Understanding Your Finances
  {
    id: 'w1d2_finances_intro',
    week: 1, day: 2,
    channel: 'email',
    sender: 'Finance Department',
    senderRole: 'Team Finance',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: (state) => ({
      subject: 'Your Financial Overview',
      body: `Team Principal,

Let me give you a quick overview of your team's financial situation.

CURRENT BALANCE: $${(state.ownedTeam?.budgets?.cash ?? 0).toLocaleString()}

KEY FINANCIAL CONCEPTS:
• CASH — Your spending power. Monitor it closely.
• WEEKLY COSTS — Staff salaries, facility upkeep, and operating expenses come out every week.
• RUNWAY — How many weeks you can survive at your current burn rate. Keep this above 12 weeks!
• SPONSORS — Your main source of ongoing income. Pursue sponsor deals as soon as possible.
• PRIZE MONEY — Earned from race results. Better finishes = more money.
• COST CAP — Your total season spending is capped. Stay within it or face penalties.

Visit the FINANCES screen from the sidebar to see a full breakdown of income, expenses, and projections.

Finance Department`
    })
  },

  // Day 3: Hire Staff
  {
    id: 'w1d3_hire_staff',
    week: 1, day: 3,
    channel: 'email',
    sender: 'HR Department',
    senderRole: 'Human Resources',
    emailCategory: 'team',
    skipIf: (state) => (state.ownedTeam?.staff?.length ?? 0) >= 2,
    generateContent: () => ({
      subject: 'Building Your Team — Key Hires Needed',
      body: `Team Principal,

A racing team is only as good as its people. Right now you need to hire some key staff members.

PRIORITY HIRES:
1. CHIEF ENGINEER — Your most important hire. They handle car setup and engineering decisions. A good engineer can make a slow car competitive.
2. STRATEGIST — Handles pit timing, tire strategy, and race-day calls. Critical for race performance.

OTHER ROLES TO CONSIDER:
• Team Manager — Operations and logistics
• PR Manager — Media relations and sponsor liaison
• Data Engineer — Telemetry analysis
• Crew Chief — Pit crew and reliability

HOW TO HIRE:
• Visit the STAFF MARKET from the sidebar
• Browse available candidates and compare their skills
• Check salary demands against your budget
• Offer contracts to your preferred candidates

Each staff member has specializations and personality traits that affect team performance and morale. Choose wisely!

HR Department`
    })
  },

  // Day 3: Calendar & Time Budget
  {
    id: 'w1d3_calendar_time',
    week: 1, day: 3,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'How Your Calendar & Time Work',
      body: `Team Principal,

Let me explain how time works in your new role.

THE DAY/WEEK SYSTEM:
• Each week has 7 days (Monday through Sunday)
• You advance one day at a time using the "End Day" button
• Each day you have a limited number of hours to spend on activities
• Race days are always on Sunday

YOUR TIME BUDGET:
• You have ~14 usable hours per day
• Activities consume different amounts of time
• Overworking causes FATIGUE, which hurts your driving performance
• Rest days help you recover — don't skip them before race weeks!

THE CALENDAR:
• Visit the CALENDAR screen to see upcoming races, events, and scheduled activities
• You can schedule meetings, training, media events, and more
• Some activities are MANDATORY (board meetings, race debriefs) — missing them has consequences!

IMPORTANT: Plan your weeks around race weekends. You'll want to be well-rested and prepared when race day arrives.

Your Team Manager`
    })
  },

  // Day 4: Suggestion — Budget allocation
  {
    id: 'suggestion_budgets',
    week: 1, day: 4,
    channel: 'email',
    sender: 'Finance Department',
    senderRole: 'Team Finance',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Budget allocation',
      body: `Team Principal,

Have you looked at **Budget allocation** in Finances? You can shift spending between R&D, operations, and marketing to match your priorities. It's worth a few minutes to set it up.

Finance Department`
    })
  },

  // Day 4: Enter a Series
  {
    id: 'w1d4_enter_series',
    week: 1, day: 4,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: (_, player) => player.currentSeriesId !== undefined && player.currentSeriesId !== null,
    generateContent: (state) => ({
      subject: 'Time to Enter a Racing Series',
      body: `Team Principal,

${(state.cars?.length ?? 0) > 0 
  ? `Now that you have a car, it's time to enter a racing series!` 
  : `Once you have a car, you'll need to enter a racing series to compete.`}

HOW SERIES ENTRY WORKS:
• Visit SERIES ENTRY from the sidebar
• Browse available championship series
• Check entry requirements (car type, entry fee, minimum reputation)
• Register your team and pay the entry fee

CHOOSING YOUR SERIES:
• Match the series to the car you have (or plan to buy)
• Check the race calendar — more races = more chances to earn prize money
• Lower-tier series are less competitive and great for building experience
• Entry fees vary — make sure you can afford it

Once entered, you'll see your race calendar populate with events. This is when the real racing begins!

Your Team Manager`
    })
  },

  // Day 5: Garage Management & Driver Assignment
  {
    id: 'w1d5_garage_drivers',
    week: 1, day: 5,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: (state) => (state.ownedTeam?.drivers?.length ?? 0) > 0,
    generateContent: () => ({
      subject: 'Your Garage — Cars & Drivers',
      body: `Team Principal,

Your GARAGE is the heart of your racing operation.

CAR MANAGEMENT:
• View your cars, their condition, and setup
• Monitor wear and damage levels
• Cars need maintenance between races
• Performance upgrades come from the R&D system

ASSIGNING A DRIVER:
• You need at least one driver assigned to race!
• You can drive yourself (as the owner-driver)
• Or hire a professional driver from the market
• Visit the GARAGE screen and assign a driver to your car

IMPORTANT: Without a driver assigned, you won't be able to participate in races even if you've entered a series.

Your Team Manager`
    })
  },

  // Day 6: Suggestion — Calendar / schedule an activity
  {
    id: 'suggestion_calendar',
    week: 1, day: 6,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Schedule an activity',
      body: `Team Principal,

Try scheduling something on your **Calendar** — it'll help you get used to the time budget and how days work. Even a short block counts.

Your Team Manager`
    })
  },

  // Day 6: Media & Public Image
  {
    id: 'w1d6_media_intro',
    week: 1, day: 6,
    channel: 'email',
    sender: 'PR Department',
    senderRole: 'Public Relations',
    emailCategory: 'media',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Managing Your Public Image',
      body: `Team Principal,

As team principal, you're also the public face of your team. Your media presence matters.

MEDIA ACTIVITIES:
• PRESS CONFERENCES — Held during race weekends. Your answers shape your reputation.
• SOCIAL MEDIA — Post to engage fans and build your following. Sponsors love social engagement!
• INTERVIEWS — Media outlets will request interviews. These can boost or hurt your reputation.

WHY MEDIA MATTERS:
• Higher reputation attracts better sponsors
• Fan sentiment affects merchandise sales
• A strong media persona builds your personal brand
• Sponsors have media obligations — you'll need to do a minimum number of events per season

Visit the MEDIA CENTER from the sidebar to manage your press activities and social media.

PR Department`
    })
  },

  // Day 7: Week 1 Summary
  {
    id: 'w1d7_week_summary',
    week: 1, day: 7,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: (state, player) => {
      const hasCars = (state.cars?.length ?? 0) > 0
      const hasStaff = (state.ownedTeam?.staff?.length ?? 0) >= 2
      const hasSeries = player.currentSeriesId !== undefined && player.currentSeriesId !== null
      const hasDrivers = (state.ownedTeam?.drivers?.length ?? 0) > 0

      const done: string[] = []
      const todo: string[] = []

      if (hasCars) done.push('Acquired a car'); else todo.push('Buy a car from the Marketplace')
      if (hasStaff) done.push('Hired key staff'); else todo.push('Hire staff from the Staff Market')
      if (hasSeries) done.push('Entered a racing series'); else todo.push('Enter a series from Series Entry')
      if (hasDrivers) done.push('Assigned a driver'); else todo.push('Assign a driver in the Garage')

      return {
        subject: 'Week 1 Complete — Progress Report',
        body: `Team Principal,

Your first week at ${teamName(state)} is in the books. Here's where you stand:

${done.length > 0 ? `COMPLETED:\n${done.map(d => `✓ ${d}`).join('\n')}\n` : ''}
${todo.length > 0 ? `STILL TO DO:\n${todo.map(t => `○ ${t}`).join('\n')}\n` : 'Excellent work — you\'ve completed all the essential setup tasks!\n'}
${todo.length > 0 ? `Don't worry if you haven't done everything yet. Next week I'll guide you through more systems including sponsors, development, and facilities.` : `Next week we'll explore more advanced systems like sponsors, R&D, and facilities.`}

Keep up the good work!

Your Team Manager`
      }
    }
  },

  // =============================================
  // WEEK 2 — "Growing the Operation"
  // =============================================

  // Day 1: Sponsors
  {
    id: 'w2d1_sponsors',
    week: 2, day: 1,
    channel: 'email',
    sender: 'Commercial Department',
    senderRole: 'Commercial',
    emailCategory: 'sponsor',
    skipIf: (state) => {
      const activeSponsors = state.ownedTeam?.finances?.sponsors?.filter(s => s.active)?.length ?? 0
      return activeSponsors > 0
    },
    generateContent: () => ({
      subject: 'Finding Sponsors for Your Team',
      body: `Team Principal,

Sponsors are the lifeblood of any racing team. Without them, you'll burn through your cash reserves quickly.

HOW SPONSORSHIP WORKS:
• Visit the SPONSOR MARKET from the sidebar
• Browse available sponsors — they have different budgets, requirements, and expectations
• Higher reputation attracts bigger sponsors
• Sponsors offer regular payments throughout the season
• Some sponsors also offer performance bonuses

SPONSOR OBLIGATIONS:
• Sponsors expect media exposure — press conferences, social media posts, team events
• Each sponsor has satisfaction metrics — keep them happy or they won't renew
• Failing obligations can lead to penalties or contract termination
• Check your sponsor requirements regularly

NEGOTIATION:
• You can negotiate contract terms
• Bigger asks from sponsors mean more obligations for you
• Start with smaller sponsors if your reputation is low — they're easier to land

Don't wait too long! Your weekly expenses are already ticking.

Commercial Department`
    })
  },

  // Day 2: Suggestion — Facilities
  {
    id: 'suggestion_facilities',
    week: 2, day: 2,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Facilities',
      body: `Team Principal,

Try opening **Facilities** from the sidebar — see what upgrades are available and how they affect performance. Even a quick look helps you plan ahead.

Your Team Manager`
    })
  },

  // Day 2: Team Development & R&D
  {
    id: 'w2d2_development',
    week: 2, day: 2,
    channel: 'email',
    sender: 'Technical Department',
    senderRole: 'Technical',
    emailCategory: 'team',
    skipIf: (state) => {
      const teamDev = state.teamDevelopment
      if (!teamDev) return false
      return Object.values(teamDev.areas).some(
        area => area.currentUpgradeId && area.researchProgress > 0
      )
    },
    generateContent: () => ({
      subject: 'Team Development & R&D',
      body: `Team Principal,

Your car's performance isn't fixed — you can improve it through Research & Development.

THE R&D SYSTEM:
• Visit your GARAGE and look for the Development section
• Choose an area to research: aerodynamics, engine, chassis, electronics, etc.
• Each upgrade has a research time and cost
• Once complete, upgrades permanently improve your car's performance

DEVELOPMENT POINTS:
• Earned through race debriefs and team activities
• Spent to accelerate research
• More experienced staff = faster research

STRATEGY:
• Focus on areas where your car is weakest
• Don't try to upgrade everything at once — resources are limited
• Higher-tier upgrades require completing prerequisites first

Start a research project soon — even a small improvement can make the difference on race day.

Technical Department`
    })
  },

  // Day 3: Facilities
  {
    id: 'w2d3_facilities',
    week: 2, day: 3,
    channel: 'email',
    sender: 'Facilities Manager',
    senderRole: 'Facilities',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Your Team Facilities',
      body: `Team Principal,

Your team operates out of several facilities. Upgrading them improves your team's capabilities.

KEY FACILITIES:
• FACTORY — Where your cars are built and maintained. Higher level = faster repairs and manufacturing.
• WIND TUNNEL — Improves aerodynamic development. Essential for top performance.
• SIMULATOR — Used for practice and development. Reduces on-track testing needs.
• DESIGN OFFICE — Where your engineers work on upgrades.

HOW TO UPGRADE:
• Visit FACILITIES from the sidebar
• Each facility can be upgraded with cash investment
• Upgrades take time to complete
• Higher-level facilities unlock better capabilities and staff assignments

FACILITY STAFF:
• You can assign specialized staff to each facility
• Staff effectiveness depends on their skills and the facility's level
• A well-staffed factory produces better quality parts

Visit the Facilities screen to assess your current setup and plan improvements.

Facilities Management`
    })
  },

  // Day 4: Personal Life (Phone)
  {
    id: 'w2d4_personal_life',
    week: 2, day: 4,
    channel: 'phone',
    phoneContactType: 'personal_assistant',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Personal Life',
      body: `Hey! Quick reminder — running a racing team isn't ALL work. Don't forget to take care of yourself! Check out your PERSONAL LIFE screen in the sidebar. You can manage your health, fitness, hobbies, relationships, and more. A balanced life means better performance behind the wheel and in the boardroom. Your body and mind need rest too! 🏋️‍♂️`
    })
  },

  // Day 5: Contracts
  {
    id: 'w2d5_contracts',
    week: 2, day: 5,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'contract',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Understanding Contracts',
      body: `Team Principal,

Contracts govern your relationships with drivers, staff, and even your own position.

DRIVER CONTRACTS:
• Hired drivers have monthly retainers and performance bonuses
• Contract length matters — longer deals give stability but less flexibility
• You can negotiate terms during hiring
• Drivers can become unhappy if the team underperforms

STAFF CONTRACTS:
• Staff members have salaries and contract durations
• Buyout clauses let you release staff early (at a cost)
• Contract renewals happen near expiry — don't let key people leave!

YOUR OWN CONTRACT:
• As team principal, you have a contract with the board
• Meeting board targets keeps your position secure
• Failing consistently could lead to... consequences

Visit the CONTRACTS screen to review all active agreements.

Your Team Manager`
    })
  },

  // Day 5: Suggestion — Media / social post
  {
    id: 'suggestion_media',
    week: 2, day: 5,
    channel: 'email',
    sender: 'PR Department',
    senderRole: 'Public Relations',
    emailCategory: 'media',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Post on Media / Social',
      body: `Team Principal,

Post something on **Media / Social** — sponsors notice engagement and it builds your following. Even a short update helps.

PR Department`
    })
  },

  // Day 6: Scouting
  {
    id: 'w2d6_scouting',
    week: 2, day: 6,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Scouting for Talent',
      body: `Team Principal,

As your team grows, you may want to scout for new driving talent.

THE SCOUTING SYSTEM:
• Visit the SCOUTING screen from the sidebar
• Browse available drivers across different tiers
• Each driver has unique stats, traits, and salary expectations
• You can evaluate drivers before committing to a contract

WHAT TO LOOK FOR:
• Raw speed (pace and consistency stats)
• Experience level and career history
• Personality traits and team compatibility
• Salary demands vs. your budget

Scouting is especially useful when looking for a second driver or planning for future seasons.

Your Team Manager`
    })
  },

  // Day 7: Suggestion — Sponsor Market or Staff Market
  {
    id: 'suggestion_sponsor_staff_market',
    week: 2, day: 7,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Sponsor Market & Staff Market',
      body: `Team Principal,

If you haven't yet, visit the **Sponsor Market** and **Staff Market** from the sidebar. Sponsors keep the lights on; the right staff make the difference on race day.

Your Team Manager`
    })
  },

  // Day 7: Week 2 Summary
  {
    id: 'w2d7_week_summary',
    week: 2, day: 7,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: (state, player) => {
      const hasCars = (state.cars?.length ?? 0) > 0
      const hasStaff = (state.ownedTeam?.staff?.length ?? 0) >= 2
      const hasSeries = player.currentSeriesId !== undefined && player.currentSeriesId !== null
      const hasSponsors = (state.ownedTeam?.finances?.sponsors?.filter(s => s.active)?.length ?? 0) > 0

      const urgent: string[] = []
      if (!hasCars) urgent.push('You STILL don\'t have a car — visit the Marketplace immediately!')
      if (!hasSeries) urgent.push('You haven\'t entered a series yet — you can\'t race without one!')
      if (!hasStaff) urgent.push('You have no key staff — your team is running on fumes!')
      if (!hasSponsors) urgent.push('No sponsors yet — your money will run out!')

      return {
        subject: 'Week 2 Complete — Progress Report',
        body: `Team Principal,

Another week at ${teamName(state)} is in the books.

${urgent.length > 0 
  ? `⚠️ URGENT ATTENTION NEEDED:\n${urgent.map(u => `• ${u}`).join('\n')}\n\nPlease address these critical items as soon as possible.`
  : `Great progress! Your team is taking shape. Focus now on optimizing performance and preparing for races.`}

Next week we'll cover race preparation, mandatory activities, and logistics.

Your Team Manager`
      }
    }
  },

  // =============================================
  // WEEK 3 — "Race Preparation"
  // =============================================

  // Day 1: Mandatory Activities
  {
    id: 'w3d1_mandatory_activities',
    week: 3, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Mandatory Activities — Don\'t Miss These!',
      body: `Team Principal,

Some activities in your schedule are MANDATORY. Missing them has real consequences.

MANDATORY ACTIVITIES:
• RACE DEBRIEF — After every race, you must debrief with the team (within 3 days)
• BOARD MEETINGS — Quarterly meetings with the board to review performance
• FINANCIAL REVIEWS — Monthly financial check-ins
• SPONSOR REVIEWS — Quarterly reviews with your sponsors
• PRE-RACE BRIEFINGS — Required before each race weekend

CONSEQUENCES OF MISSING:
• Team morale drops
• Board mood decreases
• Sponsor satisfaction falls
• Driver morale may suffer

HOW TO MANAGE:
• Check your CALENDAR regularly for upcoming mandatory events
• They'll appear with deadline warnings
• Plan your time budget around them
• Some can be delegated to staff if you can't attend personally

These are non-negotiable parts of running a team. Make them a priority!

Your Team Manager`
    })
  },

  // Day 2: Race Week Expectations
  {
    id: 'w3d2_race_week',
    week: 3, day: 2,
    channel: 'email',
    sender: 'Race Engineer',
    senderRole: 'Race Engineering',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Race Week — What to Expect',
      body: `Team Principal,

When a race week arrives, here's what the weekend looks like:

THE RACE WEEKEND:
• Race weekends are on specific weeks in your calendar
• Sunday (Day 7) is race day — that's when you launch AMS2 and race!
• Before the race, you'll want to prepare during the week

PREPARATION CHECKLIST:
• Ensure your car is in good condition (check the Garage)
• Review any mandatory pre-race activities
• Manage your fatigue — don't be exhausted on race day!
• Check weather forecasts if available
• Review your race strategy

ON RACE DAY:
• Navigate to the RACE DAY screen
• The app will guide you through connecting to AMS2
• Race results are captured automatically via telemetry
• After the race, a debrief will be scheduled

YOUR PERFORMANCE:
• Results depend on your driving skill in AMS2
• But fatigue, car condition, staff quality, and strategy all play a role
• Race finishing positions determine championship points, prize money, and reputation changes

Race Engineering`
    })
  },

  // Day 2: Suggestion — Contracts
  {
    id: 'suggestion_contracts',
    week: 3, day: 2,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'contract',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Review Contracts',
      body: `Team Principal,

Review your **Contracts** screen — see when your staff and sponsor deals expire. You don't want key people or sponsors slipping away unnoticed.

Your Team Manager`
    })
  },

  // Day 3: Parts & Manufacturing
  {
    id: 'w3d3_logistics',
    week: 3, day: 3,
    channel: 'email',
    sender: 'Logistics Department',
    senderRole: 'Logistics',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Parts, Manufacturing & Logistics',
      body: `Team Principal,

Behind the scenes, your team needs a steady supply of spare parts.

SPARE PARTS:
• Cars consume parts through wear, damage, and regular maintenance
• Running out of parts can leave you unable to race!
• The MANUFACTURING screen lets you manage your parts pipeline

MANUFACTURING:
• Queue up production of spare parts
• Manufacturing takes time — plan ahead!
• Higher-level factory facilities produce parts faster
• Some parts are more critical than others

LOGISTICS:
• Parts need to be shipped to race venues
• Track your shipments and deliveries
• Auto-reorder can be enabled for essential parts

MAINTENANCE:
• Between races, inspect and repair your cars
• Preventive maintenance is cheaper than emergency repairs
• Your crew chief's skills affect maintenance quality

Visit MANUFACTURING from the sidebar to manage your parts pipeline.

Logistics Department`
    })
  },

  // Day 4: Your Social Life (Phone)
  {
    id: 'w3d4_social_life',
    week: 3, day: 4,
    channel: 'phone',
    phoneContactType: 'personal_assistant',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Social Life',
      body: `Just a reminder — your personal life is important! In the PERSONAL LIFE screen you can explore hobbies, manage your fitness and health, and build relationships. Hobbies help with stress relief, fitness improves your driving stamina, and good relationships keep you grounded. Don't become a workaholic! 😄`
    })
  },

  // Day 5: Suggestion — Garage / R&D
  {
    id: 'suggestion_garage_rnd',
    week: 3, day: 5,
    channel: 'email',
    sender: 'Technical Department',
    senderRole: 'Technical',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Garage & R&D',
      body: `Team Principal,

In the **Garage**, look at R&D and car setup options. Even small upgrades add up over the season. Check the R&D tab when you have development points to spend.

Technical Department`
    })
  },

  // Day 5: Investments & Loans
  {
    id: 'w3d5_investments',
    week: 3, day: 5,
    channel: 'email',
    sender: 'Finance Department',
    senderRole: 'Team Finance',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Advanced Finances — Investments & Loans',
      body: `Team Principal,

Beyond your team's operating budget, there are advanced financial tools available.

INVESTMENTS:
• Visit INVESTMENTS from the sidebar
• Invest personal funds into various asset classes
• Investments grow over time but carry risk
• Good for building long-term wealth

LOANS:
• Visit LOANS from the sidebar
• Take out loans if you need immediate cash
• Loans have interest rates and repayment schedules
• Use them strategically — don't over-leverage!

PERSONAL FINANCES:
• Your personal wealth is separate from team finances
• Prize money, salary, and investments build your personal fortune
• Personal wealth contributes to your retirement planning

These are optional tools but can give you a financial edge, especially in the early seasons when cash is tight.

Finance Department`
    })
  },

  // =============================================
  // WEEK 4 — "Advanced Systems"
  // =============================================

  // Day 1: Suggestion — Scouting
  {
    id: 'suggestion_scouting',
    week: 4, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Scouting',
      body: `Team Principal,

Check **Scouting** for future driver talent. Even if you're not hiring yet, knowing who's out there helps you plan. You can evaluate drivers before committing.

Your Team Manager`
    })
  },

  // Day 1: Merchandise
  {
    id: 'w4d1_merchandise',
    week: 4, day: 1,
    channel: 'email',
    sender: 'Commercial Department',
    senderRole: 'Commercial',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Merchandise & Brand Building',
      body: `Team Principal,

Your team's brand can generate additional income through merchandise sales.

MERCHANDISE (visit MERCHANDISE from the sidebar):
• Products tab — Add products from templates (caps, shirts, models, etc.), set price and stock.
• Stores tab — Your Team Online Store is ready; use Manage to add products to it so they can sell.
• Collections tab — Run themed campaigns to boost sales for selected products.

Sales depend on fan sentiment and team popularity; higher-profile teams sell more.

BRAND BUILDING:
• Win races and your brand grows
• Social media engagement boosts merchandise sales
• Press coverage increases brand awareness
• Fan events and interactions build loyalty

If you hire a Marketing Manager (or merchandising staff later), they can propose new products and collections for your approval via email.

This is a secondary income stream, but it can become significant as your team gains popularity.

Commercial Department`
    })
  },

  // Day 2: Board Expectations
  {
    id: 'w4d2_board',
    week: 4, day: 2,
    channel: 'email',
    sender: 'Board of Directors',
    senderRole: 'Board',
    emailCategory: 'board',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Board Expectations — Know Your Targets',
      body: `Team Principal,

As your employers, we want to make our expectations clear.

BOARD TARGETS:
• You have mandatory, expected, and bonus targets each season
• Mandatory targets MUST be met — failing them has serious consequences
• Expected targets are important for maintaining board confidence
• Bonus targets earn extra rewards and goodwill

BOARD MOOD:
• Our mood reflects how satisfied we are with your performance
• Meeting targets increases board mood
• Missing targets, overspending, or poor results decrease it
• If board mood drops critically low, your position may be at risk

WHAT WE MONITOR:
• Championship performance (finishing positions, points)
• Financial management (staying within budget, cost cap compliance)
• Sponsor satisfaction
• Team development progress

Review your current board targets on the HOME screen. We expect results.

The Board of Directors`
    })
  },

  // Day 4: Suggestion — Personal Life
  {
    id: 'suggestion_personal_life',
    week: 4, day: 4,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Personal Life',
      body: `Team Principal,

**Personal Life** — health and lifestyle affect your driving. Take a look at the Personal Life screen: fitness, relationships, and balance matter for long-term performance.

Your Team Manager`
    })
  },

  // Day 3: The Paddock
  {
    id: 'w4d3_paddock',
    week: 4, day: 3,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'The Paddock — Your Rivals',
      body: `Team Principal,

You're not alone in the racing world. The PADDOCK is where you can see what's happening with other teams and drivers.

THE PADDOCK:
• Visit PADDOCK from the sidebar
• See rival teams, their drivers, and their performance
• Track the driver market — who's available, who's transferring
• Monitor championship standings across all series

RIVALRIES:
• Rival drivers have their own careers, ambitions, and personalities
• On-track battles create rivalries that can escalate
• Rivals may try to poach your staff or drivers
• Drama between drivers generates media attention

DRIVER MARKET:
• Drivers transfer between teams
• Star drivers become available during the off-season
• Keep an eye on talented drivers coming through the lower series

The racing world is alive and dynamic. Stay informed!

Your Team Manager`
    })
  },

  // =============================================
  // WEEKS 5-8 — Urgent Reminders (condition-gated)
  // =============================================

  // Week 5 Day 1: Suggestion — Manufacturing / logistics
  {
    id: 'suggestion_manufacturing',
    week: 5, day: 1,
    channel: 'email',
    sender: 'Logistics Department',
    senderRole: 'Logistics',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Manufacturing & Logistics',
      body: `Team Principal,

See how **Manufacturing** and **Logistics** work — parts supply and race allocation. Visit the Manufacturing screen to understand the parts pipeline and avoid surprises before race day.

Logistics Department`
    })
  },

  // Week 5 Day 1: URGENT no car
  {
    id: 'w5d1_urgent_no_car',
    week: 5, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    isUrgent: true,
    skipIf: (state) => (state.cars?.length ?? 0) > 0,
    generateContent: () => ({
      subject: '⚠️ URGENT: You Need a Car!',
      body: `Team Principal,

It has been FOUR WEEKS and we still don't have a car. This is critical — without a car, our team cannot compete.

Please visit the MARKETPLACE immediately and purchase a car. Your team's future depends on it.

This cannot wait any longer.

Your Team Manager`
    })
  },

  // Week 5 Day 1: URGENT no series
  {
    id: 'w5d1_urgent_no_series',
    week: 5, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    isUrgent: true,
    skipIf: (_, player) => player.currentSeriesId !== undefined && player.currentSeriesId !== null,
    generateContent: () => ({
      subject: '⚠️ URGENT: Enter a Racing Series!',
      body: `Team Principal,

We've been operational for four weeks and still haven't entered a racing series. Without a series entry, all our preparations are meaningless.

Please visit SERIES ENTRY immediately and register for a championship.

Races won't wait for us.

Your Team Manager`
    })
  },

  // Week 5 Day 2: URGENT no staff
  {
    id: 'w5d2_urgent_no_staff',
    week: 5, day: 2,
    channel: 'email',
    sender: 'HR Department',
    senderRole: 'Human Resources',
    emailCategory: 'team',
    isUrgent: true,
    skipIf: (state) => (state.ownedTeam?.staff?.length ?? 0) >= 1,
    generateContent: () => ({
      subject: '⚠️ URGENT: Your Team Has No Staff!',
      body: `Team Principal,

We have ZERO staff members. Running a racing team alone is impossible. At minimum, you need a Chief Engineer to keep the car running.

Please visit the STAFF MARKET and hire at least one key staff member today.

HR Department`
    })
  },

  // Week 5 Day 4: Suggestion — Investments or Loans
  {
    id: 'suggestion_investments_loans',
    week: 5, day: 4,
    channel: 'email',
    sender: 'Finance Department',
    senderRole: 'Team Finance',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: () => ({
      subject: 'Quick tip: Investments & Loans',
      body: `Team Principal,

If you haven't yet, check **Investments** and **Loans** in Finances. Investments can grow your personal wealth; loans can help in a cash crunch. Use them wisely.

Finance Department`
    })
  },

  // Week 6 Day 1: URGENT no driver
  {
    id: 'w6d1_urgent_no_driver',
    week: 6, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    isUrgent: true,
    skipIf: (state) => (state.ownedTeam?.drivers?.length ?? 0) > 0,
    generateContent: () => ({
      subject: '⚠️ URGENT: No Driver Assigned!',
      body: `Team Principal,

We have no driver assigned to race. Even if we have a car and a series entry, someone needs to be behind the wheel!

Please visit the GARAGE and assign yourself as driver, or hire a professional driver.

Your Team Manager`
    })
  },

  // Week 8 Day 1: Onboarding Complete
  {
    id: 'w8d1_onboarding_complete',
    week: 8, day: 1,
    channel: 'email',
    sender: 'Team Manager',
    senderRole: 'Team Operations',
    emailCategory: 'team',
    skipIf: () => false,
    generateContent: (state) => ({
      subject: `You're On Your Own Now, Boss`,
      body: `Team Principal,

It's been two months since ${teamName(state)} was founded. You've learned the ropes, and from here on out, you're calling the shots.

A FEW PARTING TIPS:
• Check your inbox and phone regularly — opportunities and problems won't wait
• Keep an eye on your finances — cash flow is king
• Balance work and personal life — burnout is real
• Don't be afraid to take risks — fortune favors the bold
• Remember, the HELP button (?) on any screen gives you context-specific guidance

THE JOURNEY AHEAD:
• Chase championships and build a motorsport legacy
• Develop your team from the ground up into a powerhouse
• Manage your career, your wealth, and your personal life
• Write your own story in the world of motorsport

Good luck out there. I'll still be here handling day-to-day operations, but the big decisions are all yours.

Your Team Manager`
    })
  },
]

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

/**
 * Process onboarding guidance for the current day.
 * Called from advanceDay() in careerStore.
 * 
 * Returns emails and phone messages to send, plus tracking data.
 */
export function processOnboardingGuidance(
  careerState: CareerState,
  player: PlayerDriver
): OnboardingResult {
  const result: OnboardingResult = {
    emails: [],
    phoneMessages: [],
    newSentIds: [],
    markComplete: false,
  }

  // Don't process if onboarding is already complete
  if (careerState.onboardingComplete) {
    return result
  }

  const sentIds = careerState.sentGuidanceIds ?? []
  const currentWeek = careerState.currentWeek
  const currentDay = careerState.currentDay ?? 1

  for (const step of ONBOARDING_STEPS) {
    // Skip if already sent
    if (sentIds.includes(step.id)) continue

    // Check if this step is for today
    // Allow steps from past days/weeks to fire (catch-up) as long as we're
    // past their scheduled time and within a reasonable window
    const isCurrentOrPast = 
      (step.week < currentWeek) || 
      (step.week === currentWeek && step.day <= currentDay)
    
    // But don't send steps that are more than 2 weeks old (prevents spam on load)
    const isTooOld = step.week < currentWeek - 2

    if (!isCurrentOrPast || isTooOld) continue

    // Check if the task is already done (skip condition)
    if (step.skipIf(careerState, player)) {
      // Mark as sent so we don't check again
      result.newSentIds.push(step.id)
      continue
    }

    // Generate content
    const content = step.generateContent(careerState, player)

    if (step.channel === 'email') {
      result.emails.push({
        category: step.emailCategory ?? 'team',
        subject: content.subject,
        sender: step.sender ?? 'Team Manager',
        senderRole: step.senderRole ?? 'Team Operations',
        preview: content.body.substring(0, 120).replace(/\n/g, ' '),
        body: content.body,
        receivedDay: currentDay,
        receivedWeek: currentWeek,
        receivedYear: careerState.currentYear,
        read: false,
        starred: step.isUrgent ?? false,
        archived: false,
        actionType: 'acknowledge',
      })
    } else if (step.channel === 'phone') {
      result.phoneMessages.push({
        contactType: step.phoneContactType ?? 'personal_assistant',
        message: content.body,
      })
    }

    result.newSentIds.push(step.id)

    // Check if this is the onboarding-complete step
    if (step.id === 'w8d1_onboarding_complete') {
      result.markComplete = true
    }
  }

  return result
}

/**
 * Check if all critical onboarding tasks are done (can mark complete early).
 */
export function areAllCriticalTasksDone(
  careerState: CareerState,
  player: PlayerDriver
): boolean {
  const hasCars = (careerState.cars?.length ?? 0) > 0
  const hasStaff = (careerState.ownedTeam?.staff?.length ?? 0) >= 2
  const hasSeries = player.currentSeriesId !== undefined && player.currentSeriesId !== null
  const hasDrivers = (careerState.ownedTeam?.drivers?.length ?? 0) > 0
  const hasSponsors = (careerState.ownedTeam?.finances?.sponsors?.filter(s => s.active)?.length ?? 0) > 0

  return hasCars && hasStaff && hasSeries && hasDrivers && hasSponsors
}
