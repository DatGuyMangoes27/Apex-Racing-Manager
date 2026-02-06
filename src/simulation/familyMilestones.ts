/**
 * Family Milestone System
 * 
 * Generates narrative emails for family events, dynasty progression,
 * and personal life milestones. Surfaces the deep personal life simulation
 * through the email system.
 */

export interface FamilyMilestoneEmail {
  subject: string
  body: string
  category: string
  sender: string
  senderRole: string
}

export interface FamilyContext {
  // Partner
  hasPartner: boolean
  partnerName?: string
  partnerHappiness?: number
  relationshipLength?: number // weeks
  isMarried?: boolean
  weddingAnniversaryWeek?: number
  
  // Children
  children: Array<{
    name: string
    age: number
    personality?: string
  }>
  
  // Dynasty
  dynastyGeneration?: number
  dynastyLegacyPoints?: number
  familyReputation?: number
  
  // Personal milestones
  playerAge: number
  yearsInSport: number
  totalWins: number
  totalChampionships: number
  
  // Timing
  currentWeek: number
  currentYear: number
}

// ============================================
// FAMILY EVENT GENERATORS
// ============================================

export function generateFamilyMilestones(ctx: FamilyContext): FamilyMilestoneEmail[] {
  const emails: FamilyMilestoneEmail[] = []
  
  // Partner relationship milestones
  if (ctx.hasPartner && ctx.partnerName) {
    emails.push(...generatePartnerEvents(ctx))
  }
  
  // Children events
  if (ctx.children.length > 0) {
    emails.push(...generateChildrenEvents(ctx))
  }
  
  // Dynasty events
  if (ctx.dynastyGeneration && ctx.dynastyGeneration > 1) {
    emails.push(...generateDynastyEvents(ctx))
  }
  
  // Career personal milestones
  emails.push(...generatePersonalMilestones(ctx))
  
  // Cap to 1 family email per week to not overwhelm
  return emails.slice(0, 1)
}

function generatePartnerEvents(ctx: FamilyContext): FamilyMilestoneEmail[] {
  const emails: FamilyMilestoneEmail[] = []
  const partner = ctx.partnerName!
  
  // Wedding anniversary (if married and it's the anniversary week)
  if (ctx.isMarried && ctx.weddingAnniversaryWeek === ctx.currentWeek) {
    emails.push({
      subject: `💍 Happy Anniversary, ${partner}!`,
      body: `Today marks your wedding anniversary with **${partner}**.\n\n` +
        `Your partner has left a card on the kitchen table with a note:\n\n` +
        `_"Through all the race weekends, the early flights, the late-night strategy calls... I wouldn't change a thing. Happy anniversary."_\n\n` +
        `Consider taking some time off to celebrate. Your relationship is as important as any championship.`,
      category: 'personal',
      sender: partner,
      senderRole: 'Partner'
    })
  }
  
  // Relationship happiness warnings
  if (ctx.partnerHappiness !== undefined && ctx.partnerHappiness < 30 && Math.random() < 0.15) {
    const unhappyEvents = [
      {
        subject: `${partner} Seems Distant Lately`,
        body: `You've noticed **${partner}** has been quiet and withdrawn.\n\n` +
          `Partner happiness: **${ctx.partnerHappiness}%**\n\n` +
          `The demanding schedule of a racing driver-owner leaves little time for relationships. ` +
          `If things continue like this, your relationship could be at risk.\n\n` +
          `_Schedule quality time in your Personal Life to improve the situation._`
      },
      {
        subject: `${partner}: "We Need to Talk"`,
        body: `**${partner}** wants to have a serious conversation about your relationship.\n\n` +
          `Partner happiness: **${ctx.partnerHappiness}%**\n\n` +
          `_"I feel like I'm competing with the team for your attention, and I'm always losing."_\n\n` +
          `This is a warning sign. Prioritize some personal time before things get worse.`
      }
    ]
    const event = unhappyEvents[Math.floor(Math.random() * unhappyEvents.length)]
    emails.push({
      ...event,
      category: 'personal',
      sender: partner,
      senderRole: 'Partner'
    })
  }
  
  // Positive relationship events
  if (ctx.partnerHappiness !== undefined && ctx.partnerHappiness >= 80 && Math.random() < 0.08) {
    emails.push({
      subject: `❤️ ${partner} Left You a Note`,
      body: `You find a note from **${partner}** in your bag before heading to the track:\n\n` +
        `_"Go get 'em today. I'll be watching and cheering louder than anyone. So proud of you."_\n\n` +
        `Partner happiness: **${ctx.partnerHappiness}%**\n\n` +
        `A strong personal life fuels your racing. +2 confidence boost this week.`,
      category: 'personal',
      sender: partner,
      senderRole: 'Partner'
    })
  }
  
  // Relationship length milestones
  if (ctx.relationshipLength && ctx.relationshipLength % 52 === 0) {
    const years = Math.floor(ctx.relationshipLength / 52)
    emails.push({
      subject: `📅 ${years} Year${years > 1 ? 's' : ''} Together with ${partner}`,
      body: `It's been **${years} year${years > 1 ? 's' : ''}** since you and **${partner}** got together.\n\n` +
        `Through ${ctx.yearsInSport} seasons of racing, team management, and everything in between, ` +
        `you've built something special together.\n\n` +
        (ctx.children.length > 0 
          ? `And you've grown the family to include ${ctx.children.map(c => c.name).join(', ')}. ` 
          : '') +
        `Here's to many more.`,
      category: 'personal',
      sender: partner,
      senderRole: 'Partner'
    })
  }
  
  return emails
}

function generateChildrenEvents(ctx: FamilyContext): FamilyMilestoneEmail[] {
  const emails: FamilyMilestoneEmail[] = []
  
  for (const child of ctx.children) {
    // Birthday (simplified - trigger once per year at a semi-random week based on name hash)
    const nameHash = child.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const birthdayWeek = (nameHash % 48) + 2 // Weeks 2-50
    
    if (ctx.currentWeek === birthdayWeek) {
      emails.push({
        subject: `🎂 ${child.name}'s Birthday!`,
        body: `**${child.name}** turns **${child.age + 1}** today!\n\n` +
          getChildBirthdayMessage(child.name, child.age + 1, child.personality) +
          `\n\n_Don't forget to take some time to celebrate. Family moments like these don't come back._`,
        category: 'personal',
        sender: child.name,
        senderRole: 'Family'
      })
    }
    
    // Child interested in racing (at certain ages)
    if (child.age >= 6 && child.age <= 10 && ctx.currentWeek === birthdayWeek + 1 && Math.random() < 0.3) {
      emails.push({
        subject: `🏎️ ${child.name} Wants to Go Karting!`,
        body: `**${child.name}** has been watching you race and is begging to try karting.\n\n` +
          `_"Dad/Mum, can I drive a kart? I want to be like you!"_\n\n` +
          `This could be the start of a racing dynasty... or just a fun weekend activity. ` +
          `Either way, it's a heartwarming moment.`,
        category: 'personal',
        sender: ctx.partnerName || 'Family',
        senderRole: 'Family'
      })
    }
  }
  
  return emails
}

function getChildBirthdayMessage(name: string, age: number, personality?: string): string {
  if (age <= 3) return `Little ${name} is growing up so fast! They toddle around the motorhome like they own the place.`
  if (age <= 6) return `${name} blew out the candles and immediately asked for a toy race car. The apple doesn't fall far from the tree.`
  if (age <= 10) return `${name} is at that wonderful age where everything is exciting. They insisted on wearing a racing suit to their party.`
  if (age <= 14) return `${name} is becoming their own person now${personality ? ` — definitely showing a ${personality} personality` : ''}. They're proud of what you do but starting to find their own interests too.`
  return `${name} is growing into a young adult. They've got their own ambitions now, but still look up to you.`
}

function generateDynastyEvents(ctx: FamilyContext): FamilyMilestoneEmail[] {
  const emails: FamilyMilestoneEmail[] = []
  
  // Dynasty legacy milestone
  if (ctx.dynastyLegacyPoints && ctx.dynastyLegacyPoints % 100 === 0 && ctx.currentWeek === 26) {
    emails.push({
      subject: `👑 Dynasty Legacy: ${ctx.dynastyLegacyPoints} Points`,
      body: `**The ${ctx.currentYear} Dynasty Report**\n\n` +
        `Your family's legacy in motorsport continues to grow.\n\n` +
        `Dynasty Generation: **${ctx.dynastyGeneration}**\n` +
        `Legacy Points: **${ctx.dynastyLegacyPoints}**\n` +
        `Family Reputation: **${ctx.familyReputation || 0}**\n\n` +
        `Combined family achievements:\n` +
        `- Total wins: ${ctx.totalWins}\n` +
        `- Championships: ${ctx.totalChampionships}\n` +
        `- Years in the sport: ${ctx.yearsInSport}\n\n` +
        `_"The [family name] legacy is becoming legendary in motorsport circles."_`,
      category: 'personal',
      sender: 'Motorsport Historian',
      senderRole: 'Heritage'
    })
  }
  
  return emails
}

function generatePersonalMilestones(ctx: FamilyContext): FamilyMilestoneEmail[] {
  const emails: FamilyMilestoneEmail[] = []
  
  // Career anniversary
  if (ctx.yearsInSport > 0 && ctx.currentWeek === 1) {
    emails.push({
      subject: `📆 ${ctx.yearsInSport} Year${ctx.yearsInSport > 1 ? 's' : ''} in Motorsport`,
      body: `As the new season begins, it marks **${ctx.yearsInSport} year${ctx.yearsInSport > 1 ? 's' : ''}** since you first stepped into a race car.\n\n` +
        `Career stats:\n` +
        `- 🏆 Championships: ${ctx.totalChampionships}\n` +
        `- 🥇 Wins: ${ctx.totalWins}\n` +
        `- 📅 Seasons: ${ctx.yearsInSport}\n\n` +
        (ctx.yearsInSport >= 15 
          ? `You're now a veteran of the sport. Have you considered your post-racing future?`
          : ctx.yearsInSport >= 10 
            ? `A decade in motorsport — you're becoming a true veteran.`
            : ctx.yearsInSport >= 5 
              ? `Five years and counting. You're established now.`
              : `Still building your legacy. Every race writes a new chapter.`),
      category: 'personal',
      sender: 'Career Analyst',
      senderRole: 'Motorsport Media'
    })
  }
  
  return emails
}
