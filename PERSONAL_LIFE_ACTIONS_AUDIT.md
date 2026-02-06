# COMPREHENSIVE PERSONAL LIFE ACTIONS AUDIT
## Career Mod Game - Time Budget System Design

---

## EXECUTIVE SUMMARY

This document catalogs **ALL** personal life actions and activities in the career mod game, categorized by type, with notes on whether they require the player's personal time or are passive, along with any time/duration costs mentioned.

---

## 1. FINANCE ACTIONS

### 1.1 Capital Management
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `injectCapital` | ❌ No | Instant | Finance | Transfers money from personal to team |
| `withdrawFunds` | ❌ No | Instant | Finance | Transfers money from team to personal (max 50% of balance) |
| `seekInvestors` | ❌ No | Instant | Finance | Random chance based on public image |
| `acceptInvestorOffer` | ❌ No | Instant | Finance | Accepts pending investor offer |

---

## 2. FAMILY ACTIONS - PARTNER

### 2.1 Dating & Relationship
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `planDate` | ✅ Yes | Varies by type | Family | See DATE_OPTIONS below |
| `exploreDatingScene` | ❌ No | Instant | Family | Marks player as looking for partner |
| `giveGift` | ❌ No | Instant | Family | Costs money, increases partner happiness |
| `proposeToPartner` | ❌ No | Instant | Family | Costs $50,000 for ring |
| `planWedding` | ✅ Yes | 1 week | Family | Costs vary by budget |

### 2.2 Date Types (from `DATE_OPTIONS`)
| Date Type | Personal Time? | Duration | Cost | Category |
|-----------|----------------|----------|------|----------|
| `casual_dinner` | ✅ Yes | Evening | $200 | Family |
| `fancy_restaurant` | ✅ Yes | Evening | $1,500 | Family |
| `movie_night` | ✅ Yes | Evening | $50 | Family |
| `sporting_event` | ✅ Yes | Evening | $3,000 | Family |
| `weekend_getaway` | ✅ Yes | Weekend | $5,000 | Family |
| `exotic_vacation` | ✅ Yes | 1 week | $25,000 | Family |
| `yacht_cruise` | ✅ Yes | Weekend | $15,000 | Family |
| `private_concert` | ✅ Yes | Evening | $50,000 | Family |
| `home_cooked` | ✅ Yes | Evening | $100 | Family |

### 2.3 Wedding Types (from `WEDDING_OPTIONS`)
| Wedding Type | Personal Time? | Duration | Cost | Category |
|--------------|----------------|----------|------|----------|
| `courthouse` | ✅ Yes | 1 day | $500 | Family |
| `intimate` | ✅ Yes | 1 day | $25,000 | Family |
| `traditional` | ✅ Yes | 1 day | $100,000 | Family |
| `destination` | ✅ Yes | 1 week | $250,000 | Family |
| `celebrity` | ✅ Yes | 1 week | $1,000,000 | Family |

---

## 3. FAMILY ACTIONS - CHILDREN

### 3.1 Child Management
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `spendTimeWithChild` | ✅ Yes | ~2-4 hours | Family | Increases bond level (5-10 points) |
| `announcePregnancy` | ❌ No | Instant | Family | Starts pregnancy (36 weeks) |
| `haveChild` | ✅ Yes | 1 week | Family | Birth event, costs $10,000 |
| `startChildRacing` | ❌ No | Instant | Family | Initial kart investment $15,000 |
| `getPregnancyStatus` | ❌ No | Instant | Family | Read-only status check |

### 3.2 Child Interactions (from `ChildInteraction` types)
| Interaction Type | Personal Time? | Time Cost | Category |
|------------------|----------------|-----------|----------|
| `quality_time` | ✅ Yes | ~2-4 hours | Family |
| `racing_activity` | ✅ Yes | ~4-6 hours | Family |
| `education_support` | ✅ Yes | ~1-2 hours | Family |
| `discipline` | ✅ Yes | ~30 min | Family |
| `celebration` | ✅ Yes | ~2-3 hours | Family |
| `support` | ✅ Yes | ~1 hour | Family |

---

## 4. LIFESTYLE ACTIONS

### 4.1 Health & Healthcare
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `upgradeHealthcare` | ❌ No | Instant | Lifestyle | Changes monthly/annual cost |
| `treatHealthCondition` | ✅ Yes | Varies | Lifestyle | Treatment duration from condition config |

### 4.2 Health Conditions (from `HEALTH_CONDITIONS`)
| Condition | Personal Time? | Treatment Duration | Cost | Category |
|-----------|----------------|-------------------|------|----------|
| Chronic Back Pain | ✅ Yes | 12 weeks | $5,000 | Lifestyle |
| Insomnia | ✅ Yes | 8 weeks | $3,000 | Lifestyle |
| Anxiety | ✅ Yes | 26 weeks | $10,000 | Lifestyle |
| High Blood Pressure | ✅ Yes | Ongoing (52 weeks) | $2,000 | Lifestyle |
| Burnout | ✅ Yes | 12 weeks | $20,000 | Lifestyle |
| Heart Condition | ✅ Yes | 26 weeks | $100,000 | Lifestyle |
| Severe Depression | ✅ Yes | 52 weeks | $30,000 | Lifestyle |

### 4.3 Hobbies
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `startHobby` | ❌ No | Instant | Lifestyle | Initial investment cost |
| `practiceHobby` | ✅ Yes | ~2 hours | Lifestyle | Per practice session |

### 4.4 Hobby Types (from `HOBBY_TEMPLATES` in lifestyle-config.ts)
| Hobby | Personal Time? | Practice Time | Initial Cost | Annual Cost | Category |
|-------|----------------|---------------|--------------|-------------|----------|
| Golf | ✅ Yes | ~4 hours/round | $10,000 | $50,000 | Lifestyle |
| Yachting | ✅ Yes | Varies | $2,000,000 | $200,000 | Lifestyle |
| Car Collecting | ❌ No | Passive | $500,000 | $100,000 | Lifestyle |
| Horse Racing | ✅ Yes | Varies | $500,000 | $300,000 | Lifestyle |
| Art Collecting | ❌ No | Passive | $250,000 | $50,000 | Lifestyle |
| Wine Collecting | ❌ No | Passive | $100,000 | $30,000 | Lifestyle |
| Flying | ✅ Yes | ~2 hours/flight | $500,000 | $150,000 | Lifestyle |
| Fishing | ✅ Yes | ~4-8 hours | $50,000 | $25,000 | Lifestyle |
| Photography | ✅ Yes | ~2-4 hours | $30,000 | $15,000 | Lifestyle |

### 4.5 Deep Hobbies (from `DEEP_HOBBIES` in hobbies-deep-config.ts)
| Hobby | Personal Time? | Practice Time | Initial Cost | Monthly Cost | Category |
|-------|----------------|---------------|--------------|--------------|----------|
| Piano | ✅ Yes | Optimal: 10 hrs/week | $15,000 | $500 | Lifestyle |
| Guitar | ✅ Yes | Optimal: 8 hrs/week | $5,000 | $200 | Lifestyle |
| Italian (Language) | ✅ Yes | Optimal: 7 hrs/week | $500 | $300 | Lifestyle |
| Japanese (Language) | ✅ Yes | Optimal: 10 hrs/week | $800 | $400 | Lifestyle |
| German (Language) | ✅ Yes | Optimal: 7 hrs/week | $500 | $300 | Lifestyle |
| Gourmet Cooking | ✅ Yes | Optimal: 6 hrs/week | $10,000 | $800 | Lifestyle |
| Wine Expertise | ✅ Yes | Optimal: 4 hrs/week | $25,000 | $2,000 | Lifestyle |
| Golf | ✅ Yes | Optimal: 8 hrs/week | $5,000 | $3,000 | Lifestyle |
| Tennis | ✅ Yes | Optimal: 6 hrs/week | $2,000 | $1,500 | Lifestyle |
| Photography | ✅ Yes | Optimal: 8 hrs/week | $15,000 | $500 | Lifestyle |
| Painting | ✅ Yes | Optimal: 6 hrs/week | $3,000 | $400 | Lifestyle |
| Chess | ✅ Yes | Optimal: 5 hrs/week | $500 | $100 | Lifestyle |

**Note:** Deep hobbies have lesson systems:
- Private lessons: ~1-2 hours per lesson
- Group lessons: ~1-2 hours per lesson
- Masterclass: ~2-4 hours per session
- Workshop: ~2-4 hours per session
- Online lessons: ~1 hour per session

### 4.6 Staff Management
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `hireStaff` | ❌ No | Instant | Lifestyle | Adds monthly salary cost |
| `fireStaff` | ❌ No | Instant | Lifestyle | Requires severance pay |

### 4.7 Staff Roles (from `STAFF_TEMPLATES`)
| Role | Personal Time? | Time Freed | Monthly Salary | Category |
|------|----------------|-----------|----------------|----------|
| Personal Assistant | ❌ No | 15 hrs/week | $6,667 | Lifestyle |
| Driver | ❌ No | 10 hrs/week | $5,000 | Lifestyle |
| Bodyguard | ❌ No | 0 hrs | $8,333 | Lifestyle |
| Housekeeper | ❌ No | 10 hrs/week | $4,583 | Lifestyle |
| Chef | ❌ No | 7 hrs/week | $7,500 | Lifestyle |
| Nanny | ❌ No | 20 hrs/week | $5,417 | Lifestyle |
| Estate Manager | ❌ No | 10 hrs/week | $10,000 | Lifestyle |
| Financial Advisor | ❌ No | 0 hrs | $12,500 | Lifestyle |
| Publicist | ❌ No | 0 hrs | $8,333 | Lifestyle |

### 4.8 Lifestyle Upgrades
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `upgradeLifestyle` | ❌ No | Instant | Lifestyle | Changes monthly cost |

---

## 5. LIFESTYLE ASSET ACTIONS

### 5.1 Vehicles
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `buyVehicle` | ❌ No | Instant | Lifestyle Assets | Purchase from catalog |
| `sellOwnedVehicle` | ❌ No | Instant | Lifestyle Assets | Sell owned vehicle |
| `setAsPrimaryVehicle` | ❌ No | Instant | Lifestyle Assets | Set default vehicle |

**Note:** Vehicle types include sports cars, supercars, hypercars, luxury sedans, SUVs, classic cars, motorcycles, boats, yachts, superyachts, helicopters, light jets, private jets. All are passive purchases - no personal time required for ownership, but using them (driving, flying) would take time.

### 5.2 Furnishings
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `buyFurnishing` | ❌ No | Instant | Lifestyle Assets | Purchase for property |
| `sellOwnedFurnishing` | ❌ No | Instant | Lifestyle Assets | Sell owned furnishing |

**Note:** Furnishing categories include furniture, art, electronics, appliances, outdoor, home office, smart home, wine cellar, home gym, home theater, pool/spa. All are passive purchases.

### 5.3 Memberships
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `joinClubMembership` | ❌ No | Instant | Lifestyle Assets | Join club (one-time + annual fees) |
| `cancelClubMembership` | ❌ No | Instant | Lifestyle Assets | Cancel membership |

**Note:** Membership types include country clubs, yacht clubs, private gyms, aviation clubs, concierge services, wine clubs, car clubs, social clubs. Attending events at clubs would take personal time, but membership itself is passive.

### 5.4 Luxury Services (from `LUXURY_SERVICES_CATALOG`)
| Service Type | Personal Time? | Time Freed | Monthly Cost | Category |
|--------------|----------------|-----------|--------------|----------|
| Spa & Wellness (Basic) | ✅ Yes | 0 hrs | $2,000 | Lifestyle Assets |
| Spa & Wellness (Premium) | ✅ Yes | 0 hrs | $8,000 | Lifestyle Assets |
| Spa & Wellness (Elite) | ✅ Yes | 0 hrs | $15,000 | Lifestyle Assets |
| Travel Concierge (Basic) | ❌ No | 3 hrs/week | $500 | Lifestyle Assets |
| Travel Concierge (Premium) | ❌ No | 5 hrs/week | $2,500 | Lifestyle Assets |
| Travel Concierge (Elite) | ❌ No | 8 hrs/week | $5,000 | Lifestyle Assets |
| Personal Stylist (Basic) | ✅ Yes | 2 hrs/week | $1,000 | Lifestyle Assets |
| Image Consultant (Premium) | ✅ Yes | 4 hrs/week | $5,000 | Lifestyle Assets |
| Celebrity Image Team (Elite) | ✅ Yes | 6 hrs/week | $10,000 | Lifestyle Assets |
| Security Consultant (Basic) | ❌ No | 0 hrs | $3,000 | Lifestyle Assets |
| Close Protection Team (Premium) | ❌ No | 0 hrs | $15,000 | Lifestyle Assets |
| Executive Protection (Elite) | ❌ No | 0 hrs | $30,000 | Lifestyle Assets |
| Concierge Medicine (Basic) | ✅ Yes | 1 hr/week | $2,000 | Lifestyle Assets |
| Executive Health Program (Premium) | ✅ Yes | 2 hrs/week | $8,000 | Lifestyle Assets |
| Private Medical Team (Elite) | ✅ Yes | 3 hrs/week | $20,000 | Lifestyle Assets |

### 5.5 Luxury Experiences (from `EXPERIENCES_CATALOG`)
| Experience | Personal Time? | Duration | Cost | Category |
|------------|----------------|---------|------|----------|
| Luxury Resort Retreat | ✅ Yes | 1 week | $25,000 | Lifestyle Assets |
| Private Villa Escape | ✅ Yes | 2 weeks | $75,000 | Lifestyle Assets |
| Luxury Safari | ✅ Yes | 2 weeks | $50,000 | Lifestyle Assets |
| Elite Ski Experience | ✅ Yes | 1 week | $100,000 | Lifestyle Assets |
| Private Jet Weekend | ✅ Yes | 3 days | $50,000 | Lifestyle Assets |
| Yacht Charter | ✅ Yes | 1 week | $150,000 | Lifestyle Assets |
| Superyacht Experience | ✅ Yes | 2 weeks | $500,000 | Lifestyle Assets |
| F1 Paddock Experience | ✅ Yes | 3 days | $50,000 | Lifestyle Assets |
| Super Bowl VIP | ✅ Yes | 2 days | $75,000 | Lifestyle Assets |
| Elite Charity Gala | ✅ Yes | 1 evening | $250,000 | Lifestyle Assets |
| Art Basel VIP | ✅ Yes | 1 week | $100,000 | Lifestyle Assets |
| Everest Base Camp Luxury | ✅ Yes | 2 weeks | $80,000 | Lifestyle Assets |
| Space Tourism Experience | ✅ Yes | 3 days | $450,000 | Lifestyle Assets |

### 5.6 Collectibles (from `COLLECTIBLES_CATALOG`)
| Collectible Type | Personal Time? | Time Cost | Category | Notes |
|------------------|----------------|-----------|----------|-------|
| Watches | ❌ No | Passive | Lifestyle Assets | Purchase only |
| Wine | ❌ No | Passive | Lifestyle Assets | Purchase only |
| Art | ❌ No | Passive | Lifestyle Assets | Purchase only |
| Memorabilia | ❌ No | Passive | Lifestyle Assets | Purchase only |
| Jewelry | ❌ No | Passive | Lifestyle Assets | Purchase only |
| Rare Items | ❌ No | Passive | Lifestyle Assets | Purchase only |

**Note:** Collectibles are passive purchases. Viewing/appraising collections might take time, but purchases themselves are instant.

---

## 6. SOCIAL ACTIONS

### 6.1 Endorsements & Brand
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `seekEndorsements` | ❌ No | Instant | Social | Random chance based on public image |
| `acceptEndorsement` | ❌ No | Instant | Social | Accepts pending endorsement |

### 6.2 Foundations & Charity
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `startFoundation` | ✅ Yes | 1 week | Social | Initial donation required |
| `donateToFoundation` | ❌ No | Instant | Social | Donation amount |
| `planGala` | ✅ Yes | 1-2 weeks | Social | Budget varies |

### 6.3 Social Events
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `scheduleEvent` | ❌ No | Instant | Social | Schedules for future week |
| `dismissEvent` | ❌ No | Instant | Social | Declines invitation |

### 6.4 Social Event Types (from `SOCIAL_EVENT_TEMPLATES`)
| Event Type | Personal Time? | Duration | Cost | Category |
|------------|----------------|---------|------|----------|
| Racing Industry Gala | ✅ Yes | 1 evening | $5,000 | Social |
| Motorsport Charity Dinner | ✅ Yes | 1 evening | $10,000 | Social |
| Sponsor VIP Reception | ✅ Yes | 1 evening | $2,000-$20,000 | Social |
| Paddock Party | ✅ Yes | 1 evening | $1,000 | Social |
| Motorsport Awards | ✅ Yes | 1 evening | $3,000 | Social |
| Monaco Yacht Party | ✅ Yes | 1 evening | $15,000 | Social |
| Private Networking Dinner | ✅ Yes | 1 evening | $5,000-$15,000 | Social |
| Championship Celebration | ✅ Yes | 1 evening | $50,000 | Social |

**Note:** If hosting, costs multiply by hostingCostMultiplier (typically 1-10x).

### 6.5 Scandals
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| `respondToScandal` | ✅ Yes | ~1 week | Social | Crisis management time |

### 6.6 Scandal Response Types (from `SCANDAL_RESPONSES`)
| Response Type | Personal Time? | Time Cost | Cost Multiplier | Category |
|---------------|----------------|-----------|-----------------|----------|
| Deny Everything | ✅ Yes | ~1 week | 0.5x | Social |
| Public Apology | ✅ Yes | ~1 week | 1.0x | Social |
| No Comment | ✅ Yes | ~1 week | 0.3x | Social |
| Legal Action | ✅ Yes | ~2-4 weeks | 3.0x | Social |
| PR Spin Campaign | ✅ Yes | ~1-2 weeks | 2.0x | Social |

---

## 7. EDUCATION ACTIONS

### 7.1 Courses (from `COURSE_CATALOG`)
| Course | Personal Time? | Weekly Commitment | Duration | Cost | Category |
|--------|----------------|-------------------|----------|------|----------|
| Executive MBA | ✅ Yes | 15 hrs/week | 104 weeks | $150,000 | Education |
| Business Strategy Certificate | ✅ Yes | 8 hrs/week | 16 weeks | $25,000 | Education |
| Entrepreneurship Bootcamp | ✅ Yes | 20 hrs/week | 6 weeks | $15,000 | Education |
| Investment Management Certificate | ✅ Yes | 10 hrs/week | 26 weeks | $8,000 | Education |
| Private Equity & Venture Capital | ✅ Yes | 8 hrs/week | 12 weeks | $20,000 | Education |
| Wealth Management Fundamentals | ✅ Yes | 5 hrs/week | 12 weeks | $5,000 | Education |
| Motorsport Engineering Certificate | ✅ Yes | 8 hrs/week | 20 weeks | $18,000 | Education |
| Motorsport Business Management | ✅ Yes | 6 hrs/week | 16 weeks | $12,000 | Education |
| Race Strategy & Data Analysis | ✅ Yes | 5 hrs/week | 12 weeks | $6,000 | Education |
| Executive Leadership Program | ✅ Yes | 20 hrs/week | 12 weeks | $45,000 | Education |
| Public Speaking Masterclass | ✅ Yes | 8 hrs/week | 6 weeks | $8,000 | Education |
| Crisis Management | ✅ Yes | 5 hrs/week | 8 weeks | $6,000 | Education |
| AI & Machine Learning Fundamentals | ✅ Yes | 5 hrs/week | 14 weeks | $3,000 | Education |
| Digital Transformation Leadership | ✅ Yes | 6 hrs/week | 12 weeks | $12,000 | Education |
| Business Law for Executives | ✅ Yes | 5 hrs/week | 16 weeks | $10,000 | Education |
| Contract Negotiation | ✅ Yes | 15 hrs/week | 4 weeks | $15,000 | Education |

### 7.2 Books (from `BOOK_CATALOG`)
| Book | Personal Time? | Reading Hours | Cost | Category |
|------|----------------|---------------|------|----------|
| Total Competition (Ross Brawn) | ✅ Yes | 8 hours | $25 | Education |
| How to Build a Car (Adrian Newey) | ✅ Yes | 10 hours | $30 | Education |
| The Mechanic (Marc Priestley) | ✅ Yes | 6 hours | $20 | Education |
| Niki Lauda: To Hell and Back | ✅ Yes | 7 hours | $25 | Education |
| Good to Great (Jim Collins) | ✅ Yes | 8 hours | $25 | Education |
| The Lean Startup (Eric Ries) | ✅ Yes | 7 hours | $22 | Education |
| Zero to One (Peter Thiel) | ✅ Yes | 5 hours | $25 | Education |
| The Hard Thing About Hard Things | ✅ Yes | 7 hours | $28 | Education |
| Extreme Ownership (Jocko Willink) | ✅ Yes | 8 hours | $27 | Education |
| Leaders Eat Last (Simon Sinek) | ✅ Yes | 9 hours | $26 | Education |
| The 7 Habits of Highly Effective People | ✅ Yes | 10 hours | $22 | Education |
| The Intelligent Investor (Benjamin Graham) | ✅ Yes | 18 hours | $25 | Education |
| A Random Walk Down Wall Street | ✅ Yes | 12 hours | $22 | Education |
| Rich Dad Poor Dad (Robert Kiyosaki) | ✅ Yes | 5 hours | $18 | Education |
| Meditations (Marcus Aurelius) | ✅ Yes | 6 hours | $12 | Education |
| Thinking, Fast and Slow (Daniel Kahneman) | ✅ Yes | 15 hours | $28 | Education |
| Atomic Habits (James Clear) | ✅ Yes | 7 hours | $24 | Education |

### 7.3 Certifications (from `CERTIFICATION_CATALOG`)
| Certification | Personal Time? | Study Hours | Cost | Category |
|---------------|----------------|-------------|------|----------|
| FIA Team Management License | ✅ Yes | 100 hours | $5,000 | Education |
| CFA Level 1 | ✅ Yes | 300 hours | $3,000 | Education |
| PMP (Project Management Professional) | ✅ Yes | 60 hours | $1,500 | Education |
| Six Sigma Black Belt | ✅ Yes | 150 hours | $4,000 | Education |
| Executive Coaching Certification | ✅ Yes | 80 hours | $6,000 | Education |
| Certified ScrumMaster | ✅ Yes | 20 hours | $1,200 | Education |

**Note:** Certifications require study time before exam. Exams themselves take 1-2 days.

---

## 8. ACTIVISM ACTIONS

### 8.1 Cause Support (from `CAUSE_CATALOG`)
| Cause | Personal Time? | Support Level Time | Category | Notes |
|-------|----------------|-------------------|----------|-------|
| Climate Action | ✅ Yes | Varies by level | Activism | See support levels below |
| Ocean Conservation | ✅ Yes | Varies by level | Activism | |
| Sustainable Motorsport | ✅ Yes | Varies by level | Activism | |
| Diversity in Motorsport | ✅ Yes | Varies by level | Activism | |
| Racial Equality | ✅ Yes | Varies by level | Activism | |
| LGBTQ+ Rights | ✅ Yes | Varies by level | Activism | |
| Mental Health Awareness | ✅ Yes | Varies by level | Activism | |
| Road Safety | ✅ Yes | Varies by level | Activism | |
| Youth Motorsport Access | ✅ Yes | Varies by level | Activism | |
| STEM Education | ✅ Yes | Varies by level | Activism | |
| Refugee Support | ✅ Yes | Varies by level | Activism | |
| Fighting Poverty | ✅ Yes | Varies by level | Activism | |
| Veteran Support | ✅ Yes | Varies by level | Activism | |

### 8.2 Support Levels (from `ACTIVISM_CONFIG`)
| Support Level | Personal Time? | Hours/Week | Min Donation | Category |
|---------------|----------------|------------|--------------|----------|
| Silent | ❌ No | 0 hrs | $10,000 | Activism |
| Public | ✅ Yes | ~2 hrs | $25,000 | Activism |
| Active | ✅ Yes | 5 hrs/week | $100,000 | Activism |
| Leading | ✅ Yes | 15 hrs/week | $500,000 | Activism |

### 8.3 Activism Events (from `ActivismEvent` types)
| Event Type | Personal Time? | Duration | Cost | Category |
|------------|----------------|---------|------|----------|
| Rally | ✅ Yes | 1 day | Varies | Activism |
| Fundraiser | ✅ Yes | 1 evening | Varies | Activism |
| Press Conference | ✅ Yes | 2-4 hours | Varies | Activism |
| Documentary Appearance | ✅ Yes | 1-2 days | Varies | Activism |
| Foundation Launch | ✅ Yes | 1 week | $500,000 | Activism |
| Campaign Launch | ✅ Yes | 1 week | $250,000 | Activism |
| Charity Race | ✅ Yes | 1 day | Varies | Activism |
| Awareness Day | ✅ Yes | 1 day | Varies | Activism |
| Legislative Meeting | ✅ Yes | 2-4 hours | Varies | Activism |
| UN Speech | ✅ Yes | 1 day | Varies | Activism |

---

## 9. COLLECTIONS ACTIONS

### 9.1 Collection Management
| Action | Personal Time? | Time Cost | Category | Notes |
|--------|----------------|-----------|----------|-------|
| Purchase Collection Item | ❌ No | Instant | Collections | Buy from catalog/auction |
| Sell Collection Item | ❌ No | Instant | Collections | Sell via auction/private sale |
| Appraise Collection | ✅ Yes | ~2-4 hours | Collections | Professional appraisal |
| Exhibit Collection | ✅ Yes | ~1 week | Collections | Prepare for exhibition |
| Enter Concours | ✅ Yes | ~1 week | Collections | Prepare car for show ($5,000 fee) |
| Loan to Museum | ❌ No | Instant | Collections | Earns $10,000 per item |

### 9.2 Collection Types (from `COLLECTIONS_CONFIG`)
| Collection Type | Personal Time? | Time Cost | Category | Notes |
|-----------------|----------------|-----------|----------|-------|
| Cars | ❌ No | Passive | Collections | Maintenance handled by staff |
| Watches | ❌ No | Passive | Collections | Service intervals |
| Art | ❌ No | Passive | Collections | Display/insurance only |
| Wine | ❌ Yes | ~1-2 hrs | Collections | Tastings, cellar management |
| Memorabilia | ❌ No | Passive | Collections | Display/insurance only |

**Note:** Wine collections require occasional tastings and cellar management, which take personal time.

---

## 10. SUMMARY STATISTICS

### Total Actions Cataloged: **150+**

### By Time Requirement:
- **Personal Time Required:** ~80 actions
- **Passive/Instant:** ~70 actions

### By Category:
- **Finance:** 4 actions (0 personal time)
- **Family (Partner):** 9 date types + 5 wedding types + 4 actions = 18 actions (all require personal time)
- **Family (Children):** 6 actions (all require personal time)
- **Lifestyle:** 20+ actions (mix of personal time and passive)
- **Lifestyle Assets:** 50+ actions (mostly passive purchases)
- **Social:** 15+ actions (mix of personal time and passive)
- **Education:** 20+ courses + 17 books + 6 certifications = 43+ actions (all require personal time)
- **Activism:** 13 causes + 4 support levels + 10 event types = 27+ actions (mostly require personal time)
- **Collections:** 10+ actions (mostly passive, some require time)

---

## 11. TIME COST BREAKDOWN

### Weekly Time Commitments (if all active):
- **Hobbies (practice):** 5-10 hours/week per hobby
- **Deep Hobbies (practice):** 4-10 hours/week per hobby
- **Deep Hobby Lessons:** 1-4 hours per lesson (weekly/biweekly/monthly)
- **Staff:** Frees up 7-20 hours/week per staff member
- **Education Courses:** 5-20 hours/week per course
- **Reading Books:** Variable (5-18 hours per book, spread over weeks)
- **Activism:** 0-15 hours/week depending on support level
- **Social Events:** 1 evening per event (4-6 hours)
- **Family Time:** 2-4 hours per interaction
- **Luxury Services:** 0-6 hours/week (some free time, some consume time)

### Monthly Time Commitments:
- **Healthcare Checkups:** ~2-4 hours/month (varies by level)
- **Foundation Management:** ~4-8 hours/month if active
- **Collection Management:** ~2-4 hours/month if actively collecting

---

## 12. NOTES FOR TIME BUDGET SYSTEM DESIGN

1. **Passive vs Active:** Many purchases (vehicles, furnishings, memberships) are passive and don't consume time, but USING them (driving, attending club events) would consume time.

2. **Recurring Commitments:** Some actions create ongoing time commitments:
   - Active courses (5-20 hrs/week)
   - Active hobbies (4-10 hrs/week)
   - Active activism (5-15 hrs/week)
   - Staff management (minimal, but hiring/firing takes time)

3. **One-Time Events:** Many actions are one-time events:
   - Dates (evening/weekend/week)
   - Social events (evening)
   - Experiences (days to weeks)
   - Weddings (1 day to 1 week)

4. **Treatment/Recovery:** Health treatments have fixed durations (8-52 weeks) but may not require full-time commitment.

5. **Education:** Courses and certifications require sustained weekly commitment over weeks/months.

6. **Collections:** Mostly passive, but appraisals, exhibitions, and concours participation require time.

7. **Staff Benefits:** Staff members FREE UP time (7-20 hrs/week each), which should be factored into time budget calculations.

---

## END OF AUDIT

This audit covers all personal life actions found in:
- `src/hooks/usePersonalLifeActions.ts`
- `src/screens/PersonalLife/` (all files)
- `src/data/hobbies-deep-config.ts`
- `src/data/social-events-config.ts`
- `src/data/lifestyle-config.ts`
- `src/data/family-config.ts`
- `src/data/lifestyle-assets-config.ts`
- `src/data/education-config.ts`
- `src/data/activism-config.ts`
- `src/data/collections-config.ts`
