/**
 * Feedback Loop System
 * 
 * Generates visible notifications and emails that explain the cause-and-effect
 * of game mechanics to the player. Bridges the gap between silent mechanical
 * systems and player-visible outcomes.
 */

// ============================================
// TYPES
// ============================================

export interface FeedbackEmail {
  subject: string
  body: string
  category: string
  sender: string
  senderRole: string
}

export interface FeedbackContext {
  // Staff
  staffCount: number
  staffRoles: Array<{ role: string; name: string; skill: number }>
  previousStaffCount?: number
  
  // R&D
  teamDevPoints: number
  previousTeamDevPoints?: number
  activeResearch: Array<{ name: string; progress: number; total: number }>
  completedUpgrades: string[]
  
  // Facilities
  facilities: Record<string, { level: number; name: string; upgrading?: boolean; weeksRemaining?: number }>
  previousFacilities?: Record<string, { level: number }>
  
  // Sponsors
  sponsors: Array<{ name: string; satisfaction: number; targets: Array<{ description: string; current: number; target: number; met: boolean }> }>
  
  // Performance
  carPerformanceRating: number
  previousCarPerformanceRating?: number
  
  // Privacy / Lifestyle
  privacyLevel: number
  lifestyleAssets: Array<{ name: string; type: string; effect: string }>
  personalStaff: Array<{ name: string; role: string; effect: string }>
  
  // Board
  boardMood: number
  boardTargets: Array<{ description: string; progress: number; target: number }>
  
  // Timing
  currentWeek: number
  currentYear: number
}

// ============================================
// STAFF IMPACT FEEDBACK
// ============================================

export function generateStaffFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  if (ctx.staffCount === 0) return emails
  
  // Monthly staff impact report (every 4 weeks)
  if (ctx.currentWeek % 4 === 0 && ctx.staffRoles.length > 0) {
    const roleEffects = ctx.staffRoles.map(s => {
      const effectDesc = getStaffRoleEffect(s.role, s.skill)
      return `- **${s.name}** (${s.role}): ${effectDesc}`
    }).join('\n')
    
    emails.push({
      subject: '📊 Monthly Staff Performance Report',
      body: `**Staff Impact Report — Week ${ctx.currentWeek}**\n\n` +
        `Your team of ${ctx.staffCount} staff members are contributing the following:\n\n` +
        `${roleEffects}\n\n` +
        `_Higher skilled staff provide greater bonuses. Consider training or recruiting to improve team capabilities._`,
      category: 'team',
      sender: 'HR Department',
      senderRole: 'Human Resources'
    })
  }
  
  return emails
}

function getStaffRoleEffect(role: string, skill: number): string {
  const effectiveness = Math.round(skill / 10)
  const roleEffects: Record<string, string> = {
    'chief_engineer': `+${effectiveness}% R&D speed, improved setup accuracy`,
    'head_mechanic': `+${effectiveness}% pit stop reliability, reduced part wear`,
    'aerodynamicist': `+${effectiveness}% aero development speed`,
    'data_analyst': `+${effectiveness}% qualifying performance insights`,
    'physio': `+${effectiveness}% fatigue recovery rate`,
    'pr_manager': `+${effectiveness}% media score, better sponsor satisfaction`,
    'team_manager': `+${effectiveness}% operational efficiency across all departments`,
    'strategist': `+${effectiveness}% race strategy optimization`,
  }
  return roleEffects[role] || `Contributing ${effectiveness}/10 effectiveness to team operations`
}

// ============================================
// R&D PROGRESS FEEDBACK
// ============================================

export function generateRnDFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  // R&D progress milestone
  if (ctx.previousTeamDevPoints !== undefined) {
    const gained = ctx.teamDevPoints - ctx.previousTeamDevPoints
    if (gained >= 5) {
      emails.push({
        subject: '🔬 R&D Progress: Significant Development Gains',
        body: `**Development Report — Week ${ctx.currentWeek}**\n\n` +
          `Team development points: **${ctx.teamDevPoints.toFixed(1)}** (+${gained.toFixed(1)} this period)\n\n` +
          (ctx.activeResearch.length > 0
            ? `Active research projects:\n${ctx.activeResearch.map(r => `- **${r.name}**: ${Math.round((r.progress / r.total) * 100)}% complete`).join('\n')}\n\n`
            : 'No active research projects. Consider allocating budget to R&D.\n\n') +
          `_R&D points translate directly into car performance. Each point improves your car's competitiveness._`,
        category: 'team',
        sender: 'Chief Engineer',
        senderRole: 'R&D Department'
      })
    }
  }
  
  // Car performance change notification
  if (ctx.previousCarPerformanceRating !== undefined) {
    const change = ctx.carPerformanceRating - ctx.previousCarPerformanceRating
    if (Math.abs(change) >= 2) {
      const improved = change > 0
      emails.push({
        subject: improved 
          ? '📈 Car Performance Improving' 
          : '📉 Car Performance Declining',
        body: `**Performance Analysis — Week ${ctx.currentWeek}**\n\n` +
          `Car competitiveness rating: **${ctx.carPerformanceRating.toFixed(1)}** ` +
          `(${improved ? '+' : ''}${change.toFixed(1)} since last assessment)\n\n` +
          (improved 
            ? 'Your R&D investments and facility upgrades are paying off. The car is becoming more competitive.'
            : 'Rival teams are developing faster. Consider increasing R&D budget or upgrading facilities to keep pace.'),
        category: 'team',
        sender: 'Technical Director',
        senderRole: 'Engineering'
      })
    }
  }
  
  return emails
}

// ============================================
// FACILITY UPGRADE FEEDBACK
// ============================================

export function generateFacilityFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  // Check for facility upgrades in progress
  for (const [key, facility] of Object.entries(ctx.facilities)) {
    if (facility.upgrading && facility.weeksRemaining !== undefined) {
      if (facility.weeksRemaining === 1) {
        emails.push({
          subject: `🏗️ ${facility.name} Upgrade Completing Next Week`,
          body: `**Facility Update — Week ${ctx.currentWeek}**\n\n` +
            `The **${facility.name}** upgrade to Level ${facility.level + 1} will be completed next week!\n\n` +
            `Expected benefits:\n${getFacilityBenefits(key, facility.level + 1)}\n\n` +
            `_This upgrade will automatically take effect once construction is complete._`,
          category: 'team',
          sender: 'Facilities Manager',
          senderRole: 'Infrastructure'
        })
      }
    }
    
    // Notify when facility completed (compare with previous)
    if (ctx.previousFacilities && ctx.previousFacilities[key]) {
      if (facility.level > ctx.previousFacilities[key].level) {
        emails.push({
          subject: `✅ ${facility.name} Upgraded to Level ${facility.level}`,
          body: `**Facility Upgrade Complete — Week ${ctx.currentWeek}**\n\n` +
            `Your **${facility.name}** has been upgraded to **Level ${facility.level}**!\n\n` +
            `New benefits:\n${getFacilityBenefits(key, facility.level)}\n\n` +
            `This improvement will be reflected in your team's performance going forward.`,
          category: 'team',
          sender: 'Facilities Manager',
          senderRole: 'Infrastructure'
        })
      }
    }
  }
  
  return emails
}

function getFacilityBenefits(facilityType: string, level: number): string {
  const benefits: Record<string, string[]> = {
    'aero': [
      '',
      '- Basic wind tunnel access (+5% aero R&D)',
      '- Improved wind tunnel (+10% aero R&D, CFD analysis)',
      '- Advanced aero facility (+20% aero R&D, active DRS development)',
      '- State-of-art aero complex (+35% aero R&D, cutting-edge designs)',
      '- World-class aero facility (+50% aero R&D, innovation leader)'
    ],
    'chassis': [
      '',
      '- Basic chassis workshop (+5% chassis R&D)',
      '- Improved chassis facility (+10% chassis R&D, carbon fiber work)',
      '- Advanced chassis lab (+20% chassis R&D, structural optimization)',
      '- Premium chassis facility (+35% chassis R&D, lightweight builds)',
      '- Elite chassis center (+50% chassis R&D, bespoke construction)'
    ],
    'engine': [
      '',
      '- Basic engine shop (+5% engine R&D)',
      '- Engine dyno facility (+10% engine R&D, power analysis)',
      '- Advanced engine lab (+20% engine R&D, ECU mapping)',
      '- Premium powertrain center (+35% engine R&D, hybrid development)',
      '- World-class engine facility (+50% engine R&D, peak performance)'
    ],
    'sim': [
      '',
      '- Basic simulator (+5% driver preparation)',
      '- Motion simulator (+10% preparation, track learning)',
      '- Full motion sim (+20% preparation, setup testing)',
      '- Professional sim center (+35% preparation, team strategy work)',
      '- Elite simulation complex (+50% preparation, virtual testing lab)'
    ],
    'manufacturing': [
      '',
      '- Basic workshop (standard part quality)',
      '- Improved workshop (+10% part quality, faster repairs)',
      '- Advanced manufacturing (+20% quality, CNC capability)',
      '- Premium factory (+35% quality, rapid prototyping)',
      '- Elite manufacturing (+50% quality, in-house everything)'
    ],
    'marketing': [
      '',
      '- Basic office (standard sponsor attraction)',
      '- Media room (+10% sponsor attraction, press facilities)',
      '- Marketing suite (+20% attraction, hospitality capability)',
      '- Corporate center (+35% attraction, premium events)',
      '- World-class brand center (+50% attraction, global reach)'
    ]
  }
  
  return benefits[facilityType]?.[level] || `- Level ${level} operational benefits`
}

// ============================================
// SPONSOR TARGET FEEDBACK
// ============================================

export function generateSponsorFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  for (const sponsor of ctx.sponsors) {
    // Check for completed targets
    const completedTargets = sponsor.targets.filter(t => t.met)
    const pendingTargets = sponsor.targets.filter(t => !t.met)
    
    // Notify when a target is newly met
    for (const target of completedTargets) {
      if (target.current >= target.target && Math.random() < 0.5) { // Don't spam every week
        emails.push({
          subject: `🎯 Sponsor Target Met: ${sponsor.name}`,
          body: `**Sponsor Performance Update**\n\n` +
            `Great news! You've met a performance target for **${sponsor.name}**.\n\n` +
            `✅ **${target.description}**: ${target.current}/${target.target}\n\n` +
            `Sponsor satisfaction: **${sponsor.satisfaction}%**\n\n` +
            `Meeting targets improves sponsor satisfaction, which can lead to:\n` +
            `- Higher renewal payments\n` +
            `- Performance bonuses\n` +
            `- Better offers from other sponsors\n\n` +
            (pendingTargets.length > 0
              ? `Remaining targets:\n${pendingTargets.map(t => `- ${t.description}: ${t.current}/${t.target}`).join('\n')}`
              : 'All targets for this sponsor have been met! 🎉'),
          category: 'team',
          sender: sponsor.name,
          senderRole: 'Sponsorship Manager'
        })
        break // One email per sponsor per week max
      }
    }
    
    // Low satisfaction warning
    if (sponsor.satisfaction < 30) {
      emails.push({
        subject: `⚠️ ${sponsor.name}: Sponsor Unhappy`,
        body: `**Sponsor Alert**\n\n` +
          `**${sponsor.name}** satisfaction has dropped to **${sponsor.satisfaction}%**.\n\n` +
          `They may not renew their contract if performance doesn't improve.\n\n` +
          `Outstanding targets:\n${pendingTargets.map(t => `- ${t.description}: ${t.current}/${t.target}`).join('\n')}\n\n` +
          `Focus on meeting their expectations to maintain this partnership.`,
        category: 'team',
        sender: sponsor.name,
        senderRole: 'Account Manager'
      })
    }
  }
  
  return emails
}

// ============================================
// PRIVACY & LIFESTYLE FEEDBACK
// ============================================

export function generatePrivacyFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  // Privacy level consequences
  if (ctx.privacyLevel < 30 && Math.random() < 0.2) {
    const events = [
      { subject: '📸 Paparazzi Spotted Outside Your Home', body: 'Photographers have been camping outside your residence. Your low privacy level means more media attention on your personal life.' },
      { subject: '📱 Personal Photos Leaked Online', body: 'Someone has shared private photos of you at a recent outing. This is a consequence of your public profile.' },
      { subject: '🗞️ Tabloid Runs Story About Your Weekend', body: 'A tabloid has published details about your weekend activities. Consider raising your privacy levels to reduce unwanted attention.' },
      { subject: '📸 Fans Recognize You at Restaurant', body: 'You were mobbed by fans during a private dinner. While flattering, it disrupted your evening. Higher privacy settings could help.' }
    ]
    const event = events[Math.floor(Math.random() * events.length)]
    emails.push({
      subject: event.subject,
      body: `${event.body}\n\n` +
        `**Current Privacy Level:** ${ctx.privacyLevel}%\n\n` +
        `Effects of low privacy:\n` +
        `- More media scrutiny and gossip\n` +
        `- Increased stress from public attention\n` +
        `- Higher sponsor visibility (potential positive)\n` +
        `- Reduced personal peace\n\n` +
        `_Adjust your privacy settings in Personal Life to manage your public exposure._`,
      category: 'personal',
      sender: 'Personal Assistant',
      senderRole: 'Lifestyle Management'
    })
  }
  
  return emails
}

// ============================================
// LIFESTYLE ASSET FEEDBACK
// ============================================

export function generateLifestyleFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  // Quarterly lifestyle impact report
  if (ctx.currentWeek % 13 === 0 && (ctx.lifestyleAssets.length > 0 || ctx.personalStaff.length > 0)) {
    const assetSection = ctx.lifestyleAssets.length > 0
      ? `**Your Assets:**\n${ctx.lifestyleAssets.map(a => `- ${a.name} (${a.type}): ${a.effect}`).join('\n')}\n\n`
      : ''
    
    const staffSection = ctx.personalStaff.length > 0
      ? `**Personal Staff:**\n${ctx.personalStaff.map(s => `- ${s.name} (${s.role}): ${s.effect}`).join('\n')}\n\n`
      : ''
    
    emails.push({
      subject: '🏠 Quarterly Lifestyle Impact Report',
      body: `**Personal Lifestyle Report — Q${Math.ceil(ctx.currentWeek / 13)} ${ctx.currentYear}**\n\n` +
        `Your lifestyle choices are having the following effects:\n\n` +
        assetSection +
        staffSection +
        `_Your lifestyle affects stress recovery, public image, and overall wellbeing. Premium assets and staff provide passive benefits every week._`,
      category: 'personal',
      sender: 'Personal Accountant',
      senderRole: 'Financial Advisory'
    })
  }
  
  return emails
}

// ============================================
// BOARD DECISION FEEDBACK
// ============================================

export function generateBoardFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const emails: FeedbackEmail[] = []
  
  if (!ctx.boardTargets || ctx.boardTargets.length === 0) return emails
  
  // Board target progress update (every 8 weeks)
  if (ctx.currentWeek % 8 === 0) {
    const targetProgress = ctx.boardTargets.map(t => {
      const pct = Math.min(100, Math.round((t.progress / t.target) * 100))
      const status = pct >= 100 ? '✅' : pct >= 50 ? '🟡' : '🔴'
      return `${status} **${t.description}**: ${pct}% (${t.progress}/${t.target})`
    }).join('\n')
    
    emails.push({
      subject: ctx.boardMood >= 60 
        ? '📋 Board Review: Positive Outlook'
        : ctx.boardMood >= 40 
          ? '📋 Board Review: Mixed Outlook' 
          : '📋 Board Review: Concerns Raised',
      body: `**Board Performance Review — Week ${ctx.currentWeek}**\n\n` +
        `Board mood: **${ctx.boardMood}/100**\n\n` +
        `Target progress:\n${targetProgress}\n\n` +
        (ctx.boardMood < 40 
          ? '⚠️ The board is growing impatient. Failure to meet targets may result in budget cuts or leadership challenges.'
          : ctx.boardMood >= 70 
            ? '👍 The board is pleased with progress. This may unlock additional investment opportunities.'
            : 'Continue working toward your targets to maintain board confidence.'),
      category: 'team',
      sender: 'Board of Directors',
      senderRole: 'Governance'
    })
  }
  
  return emails
}

// ============================================
// MASTER FEEDBACK GENERATOR
// ============================================

export function generateAllFeedback(ctx: FeedbackContext): FeedbackEmail[] {
  const allEmails: FeedbackEmail[] = []
  
  allEmails.push(...generateStaffFeedback(ctx))
  allEmails.push(...generateRnDFeedback(ctx))
  allEmails.push(...generateFacilityFeedback(ctx))
  allEmails.push(...generateSponsorFeedback(ctx))
  allEmails.push(...generatePrivacyFeedback(ctx))
  allEmails.push(...generateLifestyleFeedback(ctx))
  allEmails.push(...generateBoardFeedback(ctx))
  
  // Cap to prevent email overload - max 3 feedback emails per week
  if (allEmails.length > 3) {
    // Prioritize: warnings > milestones > reports
    const warnings = allEmails.filter(e => e.subject.includes('⚠️') || e.subject.includes('Warning') || e.subject.includes('CRITICAL'))
    const milestones = allEmails.filter(e => e.subject.includes('✅') || e.subject.includes('🎯') || e.subject.includes('Complete'))
    const reports = allEmails.filter(e => !warnings.includes(e) && !milestones.includes(e))
    
    return [...warnings.slice(0, 2), ...milestones.slice(0, 1), ...reports.slice(0, 1)].slice(0, 3)
  }
  
  return allEmails
}
