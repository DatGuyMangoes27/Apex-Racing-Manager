# Player Actions Analysis - Complete Inventory

## Overview
This document catalogs all player actions found across the Media screen, Career Store, Email, Phone, and related config files. Each action is categorized and analyzed for time requirements, duration costs, and personal time usage.

---

## MEDIA SCREEN ACTIONS (`src/screens/Media/index.tsx`)

### Social Media Actions

#### 1. **Publish Social Post**
- **Action**: `handlePublishSocialPost()`
- **What it does**: Publishes a social media post (Instagram, Twitter, TikTok, YouTube, LinkedIn) with AI-generated content
- **Requires Personal Time**: ❌ NO - Team social media account, can be delegated
- **Duration/Time Cost**: None specified (instant action)
- **Category**: Media / Social Media
- **Effects**: 
  - Updates followers, engagement metrics
  - Can go viral or receive backlash
  - Affects fan sentiment
  - Creates team post history

#### 2. **Open Social Post Modal** (Selection)
- **Action**: `handleOpenSocialPostModal(postType)`
- **What it does**: Opens modal to select/create social post options
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Social Media

### Press Release Actions

#### 3. **Publish Press Release**
- **Action**: `handlePublishPressRelease()`
- **What it does**: Publishes an official team press release with AI-generated content
- **Requires Personal Time**: ⚠️ UNCLEAR - Could be team PR staff or driver involvement
- **Duration/Time Cost**: None specified
- **Category**: Media / Press
- **Effects**:
  - Creates headlines
  - Affects fan sentiment
  - Updates board mood
  - Can generate controversy

#### 4. **Open Press Release Modal** (Selection)
- **Action**: `handleOpenPressReleaseModal(releaseType)`
- **What it does**: Opens modal to select/create press release options
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Press

### Fan Event Actions

#### 5. **Schedule Fan Event**
- **Action**: `handleScheduleEvent()`
- **What it does**: Schedules a fan meet & greet, autograph session, or other fan engagement event
- **Requires Personal Time**: ✅ YES - Driver must attend (meet & greet requires driver presence)
- **Duration/Time Cost**: Not explicitly tracked, but events likely span several hours
- **Category**: Media / Fan Engagement
- **Effects**:
  - Costs money (checked before scheduling)
  - Increases fan sentiment
  - Gains followers
  - Expected attendance tracked

#### 6. **Open Event Modal** (Selection)
- **Action**: `handleOpenEventModal()`
- **What it does**: Opens modal to select/create fan event options
- **Requires Personal Time**: ❌ NO (just planning)
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Fan Engagement

### Exclusive Content Actions

#### 7. **Release Exclusive Content**
- **Action**: `handleReleaseExclusiveContent()`
- **What it does**: Releases exclusive content for fan club members (behind-the-scenes videos, photos, etc.)
- **Requires Personal Time**: ⚠️ PARTIAL - May require filming time, but content can be produced by team
- **Duration/Time Cost**: Production cost tracked, but time cost not explicit
- **Category**: Media / Fan Club
- **Effects**:
  - Production cost deducted
  - Increases fan club member satisfaction
  - Gains followers
  - Increases member count

#### 8. **Open Exclusive Content Modal** (Selection)
- **Action**: `handleOpenExclusiveContentModal()`
- **What it does**: Opens modal to select/create exclusive content options
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Fan Club

### Press Conference Actions

#### 9. **Start Press Conference**
- **Action**: `handleStartPressConference()`
- **What it does**: Begins a press conference where player answers questions
- **Requires Personal Time**: ✅ YES - Driver must attend and answer questions
- **Duration/Time Cost**: Multiple questions, likely 30-60 minutes total
- **Category**: Media / Press Conference
- **Effects**:
  - Media score increases based on answers
  - Fan sentiment affected by performance

#### 10. **Answer Press Conference Question**
- **Action**: `handleAnswerQuestion(answerId)`
- **What it does**: Selects an answer to a press conference question
- **Requires Personal Time**: ✅ YES - Part of press conference
- **Duration/Time Cost**: Instant (choice selection)
- **Category**: Media / Press Conference
- **Effects**:
  - Media score changes based on answer quality
  - Moves to next question or completes conference

#### 11. **Open Press Conference Modal** (Selection)
- **Action**: `handleOpenPressConferenceModal()`
- **What it does**: Opens modal to select/create press conference options
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Press Conference

### Media Duty Actions

#### 12. **Complete Media Duty**
- **Action**: `handleCompleteDuty()`
- **What it does**: Completes a mandatory media duty (post-race interviews, podium interviews, etc.)
- **Requires Personal Time**: ✅ YES - Driver must attend mandatory duties
- **Duration/Time Cost**: Not explicitly tracked, but duties are time-bound
- **Category**: Media / Mandatory Duty
- **Effects**:
  - Completes duty (avoids penalties)
  - Applies selected response effects

#### 13. **Skip Media Duty**
- **Action**: `handleSkipDuty()`
- **What it does**: Skips a mandatory media duty (incurs penalties)
- **Requires Personal Time**: ❌ NO (skipping means not doing it)
- **Duration/Time Cost**: None (skipped)
- **Category**: Media / Mandatory Duty
- **Effects**:
  - Fine applied
  - Other penalties (fan sentiment, reputation)

#### 14. **Open Media Duty** (Selection)
- **Action**: `handleOpenDuty(duty)`
- **What it does**: Opens duty modal to select response options
- **Requires Personal Time**: ✅ YES (if completing) - Part of duty completion
- **Duration/Time Cost**: None (UI interaction)
- **Category**: Media / Mandatory Duty

### Controversy Response Actions

#### 15. **Respond to Controversy**
- **Action**: `handleRespondToControversy(controversyId, responseType)`
- **What it does**: Responds to media controversies (apologize, defend, no comment, deflect)
- **Requires Personal Time**: ⚠️ UNCLEAR - Could be quick statement or require time
- **Duration/Time Cost**: Not tracked
- **Category**: Media / Crisis Management
- **Response Types**:
  - `apologize` - Apologetic response
  - `defend` - Defensive response
  - `no_comment` - No comment
  - `deflect` - Deflect attention

### Interview Request Actions

#### 16. **Accept Interview Request**
- **Action**: `handleInterviewRequest(requestId, true)` (from store)
- **What it does**: Accepts a media interview request
- **Requires Personal Time**: ✅ YES - Driver must attend interview
- **Duration/Time Cost**: Not explicitly tracked, but interviews take time
- **Category**: Media / Interview
- **Effects**: Interview scheduled, reputation/media effects

#### 17. **Decline Interview Request**
- **Action**: `handleInterviewRequest(requestId, false)` (from store)
- **What it does**: Declines a media interview request
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None
- **Category**: Media / Interview
- **Effects**: May affect relationship with journalist/outlet

---

## EMAIL SCREEN ACTIONS (`src/screens/Emails/index.tsx`)

### Email Management Actions

#### 18. **Mark Email Read**
- **Action**: `markEmailRead(emailId)`
- **What it does**: Marks an email as read
- **Requires Personal Time**: ❌ NO (just reading)
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

#### 19. **Mark Email Unread**
- **Action**: `markEmailUnread(emailId)`
- **What it does**: Marks an email as unread
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

#### 20. **Star/Unstar Email**
- **Action**: `toggleEmailStarred(emailId)`
- **What it does**: Toggles starred status of email
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

#### 21. **Archive Email**
- **Action**: `archiveEmail(emailId)`
- **What it does**: Archives an email
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

#### 22. **Delete Email**
- **Action**: `deleteEmail(emailId)`
- **What it does**: Deletes an email permanently
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

### Email Response Actions

#### 23. **Accept/Decline Email Action**
- **Action**: Button click with `actionType: 'accept_decline'`
- **What it does**: Accepts or declines an invitation/offer from email
- **Requires Personal Time**: ⚠️ DEPENDS - Accepting may schedule activities requiring time
- **Duration/Time Cost**: Varies by action type
- **Category**: Communication / Response

#### 24. **Acknowledge Email**
- **Action**: Button click with `actionType: 'acknowledge'`
- **What it does**: Acknowledges receipt of email
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None (instant)
- **Category**: Communication

#### 25. **Navigate from Email**
- **Action**: Button click with `actionType: 'navigate'`
- **What it does**: Navigates to related screen (e.g., view negotiation, view opportunity)
- **Requires Personal Time**: ❌ NO (just navigation)
- **Duration/Time Cost**: None
- **Category**: Communication / Navigation

#### 26. **Open Negotiation from Email**
- **Action**: Button click with `actionType: 'negotiate_sponsor'` or `'review_counter'`
- **What it does**: Opens sponsor negotiation modal from email
- **Requires Personal Time**: ⚠️ UNCLEAR - Negotiations may require time
- **Duration/Time Cost**: Not tracked
- **Category**: Communication / Business

#### 27. **Open Opportunity from Email**
- **Action**: Button click with `actionType: 'opportunity_media'`, `'opportunity_manufacturer'`, or `'opportunity_special'`
- **What it does**: Opens team opportunity modal from email
- **Requires Personal Time**: ⚠️ DEPENDS - Accepting may schedule activities
- **Duration/Time Cost**: Varies
- **Category**: Communication / Opportunities

---

## PHONE SCREEN ACTIONS (`src/screens/Phone/index.tsx`)

### Messaging Actions

#### 28. **Send Text Message**
- **Action**: `addMessage(conversationId, message)` via `handleSendMessage(choice)`
- **What it does**: Sends a text message to a contact (partner, family, friend, business contact)
- **Requires Personal Time**: ⚠️ MINIMAL - Quick text, but counts toward daily message limit
- **Duration/Time Cost**: 
  - Config: `maxMessagesPerDay: 10`
  - `optimalMessagesPerWeek: 5`
  - NPC response delay: 5-120 minutes
- **Category**: Communication / Personal
- **Effects**:
  - Updates relationship meters (affection, romance, trust)
  - Affects NPC mood
  - Can trigger desires/grievances

#### 29. **Select Message Choice**
- **Action**: `handleSendMessage(choice)` - Player selects from AI-generated message choices
- **What it does**: Chooses response option in conversation
- **Requires Personal Time**: ⚠️ MINIMAL - Same as sending message
- **Duration/Time Cost**: Same as message sending
- **Category**: Communication / Personal
- **Choice Categories**:
  - greeting, small_talk, check_in, compliment, flirt, deep_talk
  - apology, invitation, gift, support, tease, romantic
  - goodbye, question, share_news, make_plans

### Gift Actions

#### 30. **Send Gift**
- **Action**: `sendGift(contactId, giftName, giftValue)` via `handleSendGift(gift)`
- **What it does**: Sends a gift to a contact (flowers, chocolates, jewelry, watch, trip, car)
- **Requires Personal Time**: ❌ NO - Gift is sent, doesn't require player's time
- **Duration/Time Cost**: 
  - Cost: $30-$50,000 (gift value)
  - No time cost
- **Category**: Communication / Personal / Relationship
- **Effects**:
  - Increases affection (3-25 points)
  - Increases romance (0-15 points)
  - Increases trust (0-10 points)
  - Based on gift value and type

### Date Planning Actions

#### 31. **Plan Date / Send Date Invite**
- **Action**: `sendDateInvite(contactId, dateType, location, week)` via `handlePlanDate(date)`
- **What it does**: Invites contact on a date (coffee, dinner, movie, concert, weekend getaway, adventure)
- **Requires Personal Time**: ✅ YES - Date requires player's personal time when it occurs
- **Duration/Time Cost**:
  - Coffee: 1 hour, $50
  - Dinner: 2-3 hours, $300
  - Movie: 2 hours, $100
  - Concert: 4 hours, $500
  - Weekend Getaway: 2 days, $3,000
  - Adventure Date: 4-6 hours, $800
- **Category**: Communication / Personal / Dating
- **Effects**:
  - Acceptance based on relationship level
  - Increases relationship meters when completed
  - Scheduled for future week/day

---

## CAREER STORE ACTIONS (`src/store/careerStore.ts`)

### Activity Scheduling Actions

#### 32. **Schedule Activity**
- **Action**: `scheduleActivity(templateId, week, day, sponsorId?)`
- **What it does**: Schedules an activity from templates (sponsor events, team activities, development, media, personal, etc.)
- **Requires Personal Time**: ⚠️ DEPENDS - Based on `requiresDriver` and `requiresOwner` flags
  - `requiresDriver: true` → ✅ YES (driver must attend)
  - `requiresOwner: true` → ✅ YES (owner must attend)
  - Neither → ❌ NO (can delegate)
- **Duration/Time Cost**:
  - `duration`: Hours per day (affects fatigue)
  - `spanDays`: Number of days activity spans (default 1)
  - Activities can span multiple days
- **Category**: Activities / Scheduling
- **Activity Categories**:
  - `sponsor` - Sponsor events
  - `team` - Team activities
  - `development` - Development/R&D
  - `media` - Media activities
  - `personal` - Personal activities (training, rest)
  - `maintenance` - Maintenance activities
- **Effects**: Applied on completion via `effectsOnComplete`

#### 33. **Cancel Activity**
- **Action**: `cancelActivity(activityId)`
- **What it does**: Cancels a scheduled activity (if not mandatory)
- **Requires Personal Time**: ❌ NO
- **Duration/Time Cost**: None
- **Category**: Activities / Scheduling
- **Restrictions**: Cannot cancel mandatory activities

#### 34. **Reschedule Activity**
- **Action**: `rescheduleActivity(activityId, newWeek, newDay)`
- **What it does**: Moves activity to different week/day
- **Requires Personal Time**: ❌ NO (just rescheduling)
- **Duration/Time Cost**: 
  - Reschedule cost: Base cost * (rescheduleCostPercent / 100)
  - Cost increases with each reschedule: `baseCost * (1 + timesRescheduled * 0.5)`
- **Category**: Activities / Scheduling
- **Effects**: May cause budget overspending

#### 35. **Complete Activity**
- **Action**: `completeActivity(activityId)`
- **What it does**: Marks activity as completed and applies effects
- **Requires Personal Time**: ⚠️ DEPENDS - Based on activity requirements
- **Duration/Time Cost**: Activity duration already consumed when scheduled
- **Category**: Activities / Completion
- **Effects Applied**:
  - `driverFatigue`: +/- fatigue
  - `driverMorale`: +/- morale
  - `reputation`: +/- reputation
  - `cash`: +/- cash
  - `boardMood`: +/- board mood
  - `teamMorale`: +/- team morale
  - `fanSentiment`: +/- fan sentiment
  - `sponsorSatisfaction`: +/- sponsor satisfaction
  - `developmentPoints`: + development points

#### 36. **Miss Activity**
- **Action**: `missActivity(activityId)`
- **What it does**: Marks activity as missed and applies penalties
- **Requires Personal Time**: ❌ NO (missed means didn't do it)
- **Duration/Time Cost**: None
- **Category**: Activities / Missed
- **Effects**: Applies `effectsOnMiss` penalties

### Activity Processing (Automatic)

#### 37. **Process Scheduled Activities**
- **Action**: `processScheduledActivities()` - Called during `advanceDay()`
- **What it does**: Automatically processes activities scheduled for current day
- **Requires Personal Time**: ⚠️ DEPENDS - Based on activity requirements
- **Duration/Time Cost**: Based on activity duration
- **Category**: Activities / Automatic Processing

### Day Advancement

#### 38. **Advance Day**
- **Action**: `advanceDay()`
- **What it does**: Advances game day, processes daily events
- **Requires Personal Time**: ❌ NO (automatic progression)
- **Duration/Time Cost**: None (time progression)
- **Category**: Time / Progression
- **What Happens**:
  - Advances day counter
  - If week changes, calls `advanceWeek()`
  - Processes missed media duties
  - Updates duty statuses (upcoming → available)
  - Generates activity reminders
  - Generates mandatory activities
  - Processes overspend consequences

---

## PERSONAL BRAND ACTIONS (`src/data/personal-brand-expanded-config.ts`)

### Book Deal Actions

#### 39. **Accept Book Deal**
- **Action**: Accept autobiography/business book deal offer
- **Requires Personal Time**: ✅ YES - Writing requires time
- **Duration/Time Cost**:
  - `bookWritingHoursPerWeek: 10` hours per week
  - Multiple weeks/months to complete
- **Category**: Personal Brand / Media Deal
- **Effects**: Advance payment, royalties, reputation boost

#### 40. **Negotiate Book Deal**
- **Action**: Negotiate book deal terms
- **Requires Personal Time**: ⚠️ MINIMAL - Negotiation time
- **Duration/Time Cost**: Not tracked
- **Category**: Personal Brand / Media Deal

### Documentary Actions

#### 41. **Accept Documentary Deal**
- **Action**: Accept documentary/docuseries deal
- **Requires Personal Time**: ✅ YES - Filming requires time
- **Duration/Time Cost**:
  - `documentaryFilmingHoursPerWeek: 20` hours per week
  - `filmingWeeksRequired: 4-52` weeks
- **Category**: Personal Brand / Media Deal
- **Effects**: Upfront payment, backend percentage, reputation boost

### Podcast Actions

#### 42. **Accept Podcast Deal**
- **Action**: Accept podcast hosting/interview deal
- **Requires Personal Time**: ✅ YES - Recording requires time
- **Duration/Time Cost**:
  - `podcastHoursPerWeek: 5` hours per week
  - `hoursPerEpisode: 3` (recording + prep)
  - `episodesPerMonth: 4`
- **Category**: Personal Brand / Media Deal
- **Effects**: Per-episode payment, sponsorship revenue, reputation boost

### Speaking Engagement Actions

#### 43. **Accept Speaking Engagement**
- **Action**: Accept keynote/panel/speech invitation
- **Requires Personal Time**: ✅ YES - Must attend and speak
- **Duration/Time Cost**:
  - `duration`: Minutes (varies by type)
  - `prepHoursRequired`: Preparation time
  - Travel time (if not local)
- **Category**: Personal Brand / Speaking
- **Effects**: Fee payment, reputation boost, networking value

### Masterclass Actions

#### 44. **Accept Masterclass Deal**
- **Action**: Accept masterclass teaching deal
- **Requires Personal Time**: ✅ YES - Filming requires time
- **Duration/Time Cost**:
  - `filmingDays`: Number of filming days
  - Multiple lessons to film
- **Category**: Personal Brand / Media Deal
- **Effects**: Upfront payment, revenue share, reputation boost

---

## SOCIAL MEDIA ACTIONS (`src/data/social-media-config.ts`)

### Posting Actions

#### 45. **Post to Social Media** (Personal Account)
- **Action**: Create and post to personal social media (Instagram, Twitter, TikTok, YouTube, LinkedIn)
- **Requires Personal Time**: ⚠️ MINIMAL - Quick post, but can take time for quality content
- **Duration/Time Cost**: 
  - `maxPostsPerDay: 5`
  - `optimalPostsPerWeek: 10`
- **Category**: Social Media / Personal Brand
- **Effects**:
  - Follower changes
  - Engagement metrics
  - Can go viral
  - Controversy risk
  - Sponsor reactions

#### 46. **Schedule Social Post**
- **Action**: Schedule post for future date/time
- **Requires Personal Time**: ❌ NO (scheduled, not immediate)
- **Duration/Time Cost**: None (scheduling)
- **Category**: Social Media / Personal Brand

#### 47. **Respond to Troll**
- **Action**: Respond to troll attack on social media
- **Requires Personal Time**: ⚠️ MINIMAL - Quick response
- **Duration/Time Cost**: None tracked
- **Category**: Social Media / Crisis Management
- **Response Types**:
  - `ignore` - Ignore and move on
  - `classy_response` - Respond with class
  - `funny_comeback` - Hit back with humor
  - `aggressive` - Fight fire with fire
  - `block` - Block the user
  - `legal_threat` - Threaten legal action
  - `call_out` - Publicly call out

---

## PRIVACY ACTIONS (`src/data/privacy-config.ts`)

### Privacy Management Actions

#### 48. **Change Privacy Level**
- **Action**: Set privacy level (open, balanced, private, reclusive)
- **Requires Personal Time**: ❌ NO (setting preference)
- **Duration/Time Cost**: None
- **Category**: Privacy / Personal
- **Effects**:
  - Affects paparazzi interest
  - Affects public image
  - Affects privacy risk

#### 49. **Hire Security Team**
- **Action**: Increase security team size
- **Requires Personal Time**: ❌ NO (hiring, not personal time)
- **Duration/Time Cost**: 
  - `baseSecurityCost: $10,000/month`
  - `securityPerBodyguard: $8,000/month`
- **Category**: Privacy / Security
- **Effects**: Reduces paparazzi encounters

#### 50. **Upgrade Home Security**
- **Action**: Install home security or secure compound
- **Requires Personal Time**: ❌ NO (installation, not personal time)
- **Duration/Time Cost**:
  - `homeSecurityInstallation: $50,000`
  - `secureCompoundCost: $500,000`
- **Category**: Privacy / Security
- **Effects**: Reduces paparazzi access

#### 51. **Prevent Leak**
- **Action**: Use prevention option (NDA, payoff, legal threat, buy exclusive, preemptive statement)
- **Requires Personal Time**: ⚠️ MINIMAL - May require meeting/negotiation
- **Duration/Time Cost**: 
  - `ndaCost: $25,000`
  - `payoffRange: $50,000-$500,000`
  - `exclusiveRightsCost: $100,000`
- **Category**: Privacy / Crisis Management
- **Effects**: Prevents or reduces leak damage

#### 52. **Respond to Leak**
- **Action**: Respond to leaked story (deny, confirm, no comment, legal action, spin, emotional plea, full statement)
- **Requires Personal Time**: ⚠️ MINIMAL - Statement/response time
- **Duration/Time Cost**: Not tracked
- **Category**: Privacy / Crisis Management
- **Effects**: Affects reputation, partner trust, sponsor concerns

---

## MESSAGING ACTIONS (`src/data/messaging-config.ts`)

### Message Configuration (Reference)

- **Max Messages Per Day**: 10
- **Optimal Messages Per Week**: 5
- **NPC Response Delay**: 5-120 minutes
- **No Contact Decay**: Starts after 7 days
- **Decay Per Week**: 2 affection points lost per week of no contact

---

## SUMMARY BY TIME REQUIREMENT

### ✅ REQUIRES PERSONAL TIME (Driver/Owner Must Attend)

1. Schedule Fan Event (meet & greet)
2. Start Press Conference
3. Answer Press Conference Question
4. Complete Media Duty
5. Accept Interview Request
6. Plan Date / Send Date Invite (when date occurs)
7. Schedule Activity (if `requiresDriver: true` or `requiresOwner: true`)
8. Complete Activity (if requires driver/owner)
9. Accept Book Deal (writing time)
10. Accept Documentary Deal (filming time)
11. Accept Podcast Deal (recording time)
12. Accept Speaking Engagement (attendance + prep)
13. Accept Masterclass Deal (filming time)

### ⚠️ PARTIAL/MINIMAL PERSONAL TIME

1. Publish Press Release (may require driver involvement)
2. Release Exclusive Content (may require filming)
3. Respond to Controversy (quick statement)
4. Send Text Message (quick, but counts toward daily limit)
5. Post to Social Media (quick, but can take time for quality)
6. Respond to Troll (quick response)
7. Prevent Leak (may require meeting)
8. Respond to Leak (statement time)

### ❌ NO PERSONAL TIME REQUIRED

1. Publish Social Post (team account)
2. Open Modals (UI interactions)
3. Email Management (read, archive, delete, etc.)
4. Send Gift (gift sent, no time cost)
5. Cancel/Reschedule Activity (just scheduling)
6. Change Privacy Level (setting preference)
7. Hire Security Team (hiring, not personal time)
8. Upgrade Home Security (installation, not personal time)
9. Schedule Social Post (scheduled, not immediate)
10. Skip Media Duty (skipping means not doing it)
11. Decline Interview Request (not doing it)

---

## KEY FINDINGS

### Time/Energy/Fatigue System

- **Fatigue**: Tracked in `player.mentalState.fatigue` (0-100)
- **Activities affect fatigue**: `driverFatigue` property in activity effects
- **Fatigue recovery**: Happens during `advanceDay()` based on:
  - Base recovery + fitness bonus
  - More recovery on off-weeks, less on race weeks
- **Activity duration**: Tracked in `duration` (hours per day)
- **Activity span**: Activities can span multiple days (`spanDays`)

### Scheduled Activities System

- **Structure**: `scheduledActivities: ScheduledActivity[]`
- **Status**: `'scheduled' | 'completed' | 'missed'`
- **Processing**: `processScheduledActivities()` called during `advanceDay()`
- **Mandatory activities**: Cannot be cancelled, have deadlines
- **Conflict checking**: Checks for driver/owner conflicts
- **Rescheduling**: Costs money, increases with each reschedule

### Activity Categories

1. **Sponsor Activities**: Sponsor events, appearances
2. **Team Activities**: Team meetings, morale events
3. **Development Activities**: R&D, testing, simulator work
4. **Media Activities**: Press conferences, interviews, social media
5. **Personal Activities**: Training, rest, personal time
6. **Maintenance Activities**: Car maintenance, facility upkeep

### Personal Time Requirements

- **Driver Required**: `requiresDriver: true` in activity template
- **Owner Required**: `requiresOwner: true` in activity template
- **Both can be required**: Some activities need both
- **Conflict Resolution**: Reserve driver can sometimes substitute

---

## RECOMMENDATIONS FOR TIME SYSTEM IMPLEMENTATION

1. **Track Personal Time Hours**: Add `personalTimeHours` or `availableTimeHours` per day
2. **Activity Time Costs**: Each activity should specify hours required
3. **Daily Time Budget**: Limit activities per day based on available time
4. **Fatigue Integration**: Activities that require personal time should increase fatigue
5. **Time Categories**: 
   - **Work Time**: Racing, team activities, media duties
   - **Personal Time**: Dating, family, hobbies, rest
   - **Delegatable**: Team social media, some PR (if staff available)
6. **Time Conflicts**: Prevent scheduling multiple time-consuming activities same day
7. **Rest Requirements**: Enforce rest periods to prevent fatigue buildup

---

## NOTES

- Many actions don't explicitly track time costs - this is a gap
- Some actions are instant (UI interactions) vs. time-consuming (activities)
- The distinction between "team" actions (delegatable) vs. "personal" actions (require player) is not always clear
- Fatigue system exists but may not be fully integrated with all time-consuming actions
- Activity scheduling system is comprehensive but time costs may need refinement
