// ============================================
// EDUCATION & LEARNING CONFIGURATION
// ============================================
// Configuration for courses, certifications, books, and knowledge progression.

// ============================================
// EDUCATION TYPES
// ============================================

export type CourseCategory =
  | 'business'
  | 'finance'
  | 'engineering'
  | 'leadership'
  | 'language'
  | 'creative'
  | 'wellness'
  | 'motorsport'
  | 'technology'
  | 'law'

export type CourseFormat =
  | 'online_self_paced'
  | 'online_live'
  | 'in_person'
  | 'hybrid'
  | 'executive'
  | 'intensive'

export type BookCategory =
  | 'biography'
  | 'business'
  | 'self_help'
  | 'technical'
  | 'fiction'
  | 'philosophy'
  | 'motorsport'
  | 'finance'
  | 'leadership'

// ============================================
// COURSE INTERFACE
// ============================================

export interface Course {
  id: string
  name: string
  category: CourseCategory
  provider: string              // University, online platform, etc.
  description: string
  
  // Structure
  format: CourseFormat
  totalModules: number
  modulesCompleted: number
  hoursPerModule: number
  totalHours: number
  
  // Cost & Time
  totalCost: number
  enrollmentFee: number
  weeklyCommitment: number      // Hours required per week
  
  // Schedule
  startDate?: { week: number; year: number }
  estimatedCompletionWeeks: number
  
  // Progress
  currentGrade: number          // 0-100
  assignmentsCompleted: number
  totalAssignments: number
  examsRemaining: number
  totalExams: number
  
  // Completion
  completionDate?: { week: number; year: number }
  certificateEarned: boolean
  finalGrade?: string           // A, B, C, etc.
  
  // Benefits
  skillBoosts: Record<string, number>   // What skills improve
  networkingContacts?: string[]         // Meet classmates
  careerOpportunities?: string[]        // What it unlocks
  reputationBonus: number
  
  // Prerequisites
  prerequisiteCourses?: string[]
  prerequisiteLevel?: number            // Minimum skill level needed
}

// ============================================
// BOOK INTERFACE
// ============================================

export interface Book {
  id: string
  title: string
  author: string
  category: BookCategory
  description: string
  
  // Reading
  totalPages: number
  pagesRead: number
  estimatedReadingHours: number
  
  // Progress
  startDate?: { week: number; year: number }
  completionDate?: { week: number; year: number }
  isComplete: boolean
  
  // Benefits
  knowledgeGain: Record<string, number>
  insightsUnlocked: string[]     // Special insights from the book
  quotesCollected: string[]      // Memorable quotes
  
  // Rating
  personalRating?: number        // 1-5 stars
  
  // Cost
  cost: number
}

// ============================================
// CERTIFICATION INTERFACE
// ============================================

export interface Certification {
  id: string
  name: string
  issuingBody: string
  category: CourseCategory
  description: string
  
  // Requirements
  prerequisiteCourses?: string[]
  examRequired: boolean
  examDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  studyHoursRecommended: number
  
  // Status
  isEarned: boolean
  earnedDate?: { week: number; year: number }
  expiresAfterYears?: number    // Some certifications need renewal
  renewalCost?: number
  
  // Value
  cost: number                  // Exam/certification cost
  industryRecognition: number   // 0-100, how impressive is it
  careerBenefit: string         // What it enables
  reputationBonus: number
  
  // Skill requirements
  skillRequirements: Record<string, number>
}

// ============================================
// KNOWLEDGE AREAS
// ============================================

export interface KnowledgeArea {
  id: string
  name: string
  category: CourseCategory
  currentLevel: number          // 0-100
  
  // Learning
  experiencePoints: number
  hoursStudied: number
  coursesCompleted: string[]
  booksRead: string[]
  certificationsEarned: string[]
  
  // Application
  timesApplied: number          // Used this knowledge in decisions
  successRate: number           // How well it's worked
}

// ============================================
// COURSE CATALOG
// ============================================

export const COURSE_CATALOG: Omit<Course, 'id' | 'modulesCompleted' | 'currentGrade' | 'assignmentsCompleted' | 'examsRemaining' | 'certificateEarned'>[] = [
  // ============================================
  // BUSINESS
  // ============================================
  {
    name: 'Executive MBA',
    category: 'business',
    provider: 'London Business School',
    description: 'Comprehensive business education for senior leaders',
    format: 'hybrid',
    totalModules: 24,
    hoursPerModule: 30,
    totalHours: 720,
    totalCost: 150000,
    enrollmentFee: 5000,
    weeklyCommitment: 15,
    estimatedCompletionWeeks: 104,
    totalAssignments: 48,
    totalExams: 12,
    skillBoosts: { business_acumen: 30, leadership: 25, networking: 20, finance: 15 },
    careerOpportunities: ['Board positions', 'Team ownership readiness', 'Executive consulting'],
    reputationBonus: 25
  },
  {
    name: 'Business Strategy Certificate',
    category: 'business',
    provider: 'Harvard Business School Online',
    description: 'Strategic thinking for competitive advantage',
    format: 'online_live',
    totalModules: 8,
    hoursPerModule: 15,
    totalHours: 120,
    totalCost: 25000,
    enrollmentFee: 1000,
    weeklyCommitment: 8,
    estimatedCompletionWeeks: 16,
    totalAssignments: 16,
    totalExams: 2,
    skillBoosts: { business_acumen: 20, strategic_thinking: 25 },
    careerOpportunities: ['Strategic planning roles'],
    reputationBonus: 15
  },
  {
    name: 'Entrepreneurship Bootcamp',
    category: 'business',
    provider: 'Stanford Online',
    description: 'Build and scale successful ventures',
    format: 'intensive',
    totalModules: 6,
    hoursPerModule: 20,
    totalHours: 120,
    totalCost: 15000,
    enrollmentFee: 500,
    weeklyCommitment: 20,
    estimatedCompletionWeeks: 6,
    totalAssignments: 12,
    totalExams: 0,
    skillBoosts: { entrepreneurship: 30, business_acumen: 15, networking: 15 },
    careerOpportunities: ['Launch own ventures', 'Business angel investing'],
    reputationBonus: 10
  },
  
  // ============================================
  // FINANCE
  // ============================================
  {
    name: 'Investment Management Certificate',
    category: 'finance',
    provider: 'CFA Institute',
    description: 'Professional investment analysis and portfolio management',
    format: 'online_self_paced',
    totalModules: 12,
    hoursPerModule: 20,
    totalHours: 240,
    totalCost: 8000,
    enrollmentFee: 500,
    weeklyCommitment: 10,
    estimatedCompletionWeeks: 26,
    totalAssignments: 24,
    totalExams: 3,
    skillBoosts: { finance: 30, investment: 35, risk_management: 20 },
    careerOpportunities: ['Better personal investment decisions'],
    reputationBonus: 12
  },
  {
    name: 'Private Equity & Venture Capital',
    category: 'finance',
    provider: 'Wharton Online',
    description: 'Understanding PE/VC for wealthy individuals',
    format: 'online_live',
    totalModules: 8,
    hoursPerModule: 12,
    totalHours: 96,
    totalCost: 20000,
    enrollmentFee: 1000,
    weeklyCommitment: 8,
    estimatedCompletionWeeks: 12,
    totalAssignments: 16,
    totalExams: 2,
    skillBoosts: { finance: 20, investment: 25, networking: 15 },
    careerOpportunities: ['Access to PE/VC deals', 'Better deal evaluation'],
    reputationBonus: 15
  },
  {
    name: 'Wealth Management Fundamentals',
    category: 'finance',
    provider: 'Yale School of Management',
    description: 'Managing significant personal wealth',
    format: 'online_self_paced',
    totalModules: 6,
    hoursPerModule: 10,
    totalHours: 60,
    totalCost: 5000,
    enrollmentFee: 200,
    weeklyCommitment: 5,
    estimatedCompletionWeeks: 12,
    totalAssignments: 12,
    totalExams: 1,
    skillBoosts: { finance: 15, investment: 15, risk_management: 10 },
    reputationBonus: 5
  },
  
  // ============================================
  // MOTORSPORT SPECIFIC
  // ============================================
  {
    name: 'Motorsport Engineering Certificate',
    category: 'motorsport',
    provider: 'Cranfield University',
    description: 'Technical fundamentals of motorsport engineering',
    format: 'online_live',
    totalModules: 10,
    hoursPerModule: 15,
    totalHours: 150,
    totalCost: 18000,
    enrollmentFee: 1000,
    weeklyCommitment: 8,
    estimatedCompletionWeeks: 20,
    totalAssignments: 20,
    totalExams: 3,
    skillBoosts: { technical_knowledge: 30, car_development: 25, engineering: 20 },
    careerOpportunities: ['Better understand R&D', 'Technical director path'],
    reputationBonus: 18
  },
  {
    name: 'Motorsport Business Management',
    category: 'motorsport',
    provider: 'FIA Institute',
    description: 'Business side of running a racing team',
    format: 'hybrid',
    totalModules: 8,
    hoursPerModule: 12,
    totalHours: 96,
    totalCost: 12000,
    enrollmentFee: 500,
    weeklyCommitment: 6,
    estimatedCompletionWeeks: 16,
    totalAssignments: 16,
    totalExams: 2,
    skillBoosts: { business_acumen: 20, motorsport_management: 30, sponsorship: 15 },
    careerOpportunities: ['Team principal readiness', 'FIA roles'],
    reputationBonus: 20
  },
  {
    name: 'Race Strategy & Data Analysis',
    category: 'motorsport',
    provider: 'Oxford Brookes University',
    description: 'Advanced race strategy and telemetry analysis',
    format: 'online_self_paced',
    totalModules: 6,
    hoursPerModule: 10,
    totalHours: 60,
    totalCost: 6000,
    enrollmentFee: 300,
    weeklyCommitment: 5,
    estimatedCompletionWeeks: 12,
    totalAssignments: 12,
    totalExams: 1,
    skillBoosts: { technical_knowledge: 15, strategy: 25, data_analysis: 20 },
    reputationBonus: 10
  },
  
  // ============================================
  // LEADERSHIP
  // ============================================
  {
    name: 'Executive Leadership Program',
    category: 'leadership',
    provider: 'INSEAD',
    description: 'Leadership for senior executives and owners',
    format: 'executive',
    totalModules: 6,
    hoursPerModule: 40,
    totalHours: 240,
    totalCost: 45000,
    enrollmentFee: 2000,
    weeklyCommitment: 20,
    estimatedCompletionWeeks: 12,
    totalAssignments: 12,
    totalExams: 0,
    skillBoosts: { leadership: 35, communication: 20, strategic_thinking: 20 },
    careerOpportunities: ['C-suite readiness', 'Board positions'],
    reputationBonus: 25
  },
  {
    name: 'Public Speaking Masterclass',
    category: 'leadership',
    provider: 'Dale Carnegie',
    description: 'Command any room and communicate with impact',
    format: 'in_person',
    totalModules: 6,
    hoursPerModule: 8,
    totalHours: 48,
    totalCost: 8000,
    enrollmentFee: 500,
    weeklyCommitment: 8,
    estimatedCompletionWeeks: 6,
    totalAssignments: 6,
    totalExams: 0,
    skillBoosts: { charisma: 25, communication: 30, media_handling: 20 },
    careerOpportunities: ['Speaking engagements', 'Better media presence'],
    reputationBonus: 12
  },
  {
    name: 'Crisis Management',
    category: 'leadership',
    provider: 'MIT Sloan',
    description: 'Navigate organizational crises effectively',
    format: 'online_live',
    totalModules: 4,
    hoursPerModule: 10,
    totalHours: 40,
    totalCost: 6000,
    enrollmentFee: 300,
    weeklyCommitment: 5,
    estimatedCompletionWeeks: 8,
    totalAssignments: 8,
    totalExams: 1,
    skillBoosts: { leadership: 15, crisis_management: 35, communication: 15 },
    reputationBonus: 8
  },
  
  // ============================================
  // TECHNOLOGY
  // ============================================
  {
    name: 'AI & Machine Learning Fundamentals',
    category: 'technology',
    provider: 'Google',
    description: 'Understanding AI for business leaders',
    format: 'online_self_paced',
    totalModules: 8,
    hoursPerModule: 8,
    totalHours: 64,
    totalCost: 3000,
    enrollmentFee: 100,
    weeklyCommitment: 5,
    estimatedCompletionWeeks: 14,
    totalAssignments: 16,
    totalExams: 2,
    skillBoosts: { technology: 25, data_analysis: 20, innovation: 15 },
    careerOpportunities: ['Tech investment readiness'],
    reputationBonus: 8
  },
  {
    name: 'Digital Transformation Leadership',
    category: 'technology',
    provider: 'Berkeley Haas',
    description: 'Leading organizations through digital change',
    format: 'hybrid',
    totalModules: 6,
    hoursPerModule: 12,
    totalHours: 72,
    totalCost: 12000,
    enrollmentFee: 500,
    weeklyCommitment: 6,
    estimatedCompletionWeeks: 12,
    totalAssignments: 12,
    totalExams: 1,
    skillBoosts: { technology: 15, leadership: 20, innovation: 25 },
    reputationBonus: 12
  },
  
  // ============================================
  // LAW
  // ============================================
  {
    name: 'Business Law for Executives',
    category: 'law',
    provider: 'Columbia Law School',
    description: 'Legal fundamentals for business leaders',
    format: 'online_live',
    totalModules: 8,
    hoursPerModule: 10,
    totalHours: 80,
    totalCost: 10000,
    enrollmentFee: 500,
    weeklyCommitment: 5,
    estimatedCompletionWeeks: 16,
    totalAssignments: 16,
    totalExams: 2,
    skillBoosts: { legal_knowledge: 30, negotiation: 15, risk_management: 15 },
    reputationBonus: 10
  },
  {
    name: 'Contract Negotiation',
    category: 'law',
    provider: 'Northwestern Kellogg',
    description: 'Master high-stakes negotiations',
    format: 'executive',
    totalModules: 4,
    hoursPerModule: 15,
    totalHours: 60,
    totalCost: 15000,
    enrollmentFee: 1000,
    weeklyCommitment: 15,
    estimatedCompletionWeeks: 4,
    totalAssignments: 8,
    totalExams: 0,
    skillBoosts: { negotiation: 35, legal_knowledge: 15, business_acumen: 10 },
    careerOpportunities: ['Better sponsor deals', 'Driver contract negotiations'],
    reputationBonus: 15
  }
]

// ============================================
// BOOK CATALOG
// ============================================

export const BOOK_CATALOG: Omit<Book, 'id' | 'pagesRead' | 'startDate' | 'completionDate' | 'isComplete' | 'insightsUnlocked' | 'quotesCollected' | 'personalRating'>[] = [
  // ============================================
  // MOTORSPORT BIOGRAPHIES
  // ============================================
  {
    title: 'Total Competition',
    author: 'Ross Brawn',
    category: 'motorsport',
    description: 'Strategic lessons from Formula 1',
    totalPages: 350,
    estimatedReadingHours: 8,
    knowledgeGain: { strategy: 15, motorsport_management: 20, leadership: 10 },
    cost: 25
  },
  {
    title: 'How to Build a Car',
    author: 'Adrian Newey',
    category: 'motorsport',
    description: 'Engineering genius behind F1 success',
    totalPages: 400,
    estimatedReadingHours: 10,
    knowledgeGain: { engineering: 20, technical_knowledge: 25, innovation: 15 },
    cost: 30
  },
  {
    title: 'The Mechanic',
    author: 'Marc Priestley',
    category: 'motorsport',
    description: 'Life inside an F1 pit crew',
    totalPages: 280,
    estimatedReadingHours: 6,
    knowledgeGain: { motorsport_management: 15, team_culture: 15 },
    cost: 20
  },
  {
    title: 'Niki Lauda: To Hell and Back',
    author: 'Niki Lauda',
    category: 'biography',
    description: 'Legendary champion\'s autobiography',
    totalPages: 320,
    estimatedReadingHours: 7,
    knowledgeGain: { mental_toughness: 20, determination: 15, racing_mindset: 15 },
    cost: 25
  },
  
  // ============================================
  // BUSINESS BOOKS
  // ============================================
  {
    title: 'Good to Great',
    author: 'Jim Collins',
    category: 'business',
    description: 'Why some companies make the leap',
    totalPages: 300,
    estimatedReadingHours: 8,
    knowledgeGain: { business_acumen: 20, leadership: 15, strategic_thinking: 15 },
    cost: 25
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'business',
    description: 'Building successful companies efficiently',
    totalPages: 280,
    estimatedReadingHours: 7,
    knowledgeGain: { entrepreneurship: 25, innovation: 15, business_acumen: 10 },
    cost: 22
  },
  {
    title: 'Zero to One',
    author: 'Peter Thiel',
    category: 'business',
    description: 'Notes on startups and building the future',
    totalPages: 210,
    estimatedReadingHours: 5,
    knowledgeGain: { entrepreneurship: 20, innovation: 20, strategic_thinking: 15 },
    cost: 25
  },
  {
    title: 'The Hard Thing About Hard Things',
    author: 'Ben Horowitz',
    category: 'business',
    description: 'Building a business when there are no easy answers',
    totalPages: 290,
    estimatedReadingHours: 7,
    knowledgeGain: { leadership: 20, crisis_management: 20, business_acumen: 15 },
    cost: 28
  },
  
  // ============================================
  // LEADERSHIP BOOKS
  // ============================================
  {
    title: 'Extreme Ownership',
    author: 'Jocko Willink',
    category: 'leadership',
    description: 'Navy SEAL leadership principles',
    totalPages: 320,
    estimatedReadingHours: 8,
    knowledgeGain: { leadership: 25, mental_toughness: 20, team_management: 15 },
    cost: 27
  },
  {
    title: 'Leaders Eat Last',
    author: 'Simon Sinek',
    category: 'leadership',
    description: 'Why some teams pull together',
    totalPages: 350,
    estimatedReadingHours: 9,
    knowledgeGain: { leadership: 20, team_culture: 20, communication: 10 },
    cost: 26
  },
  {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen Covey',
    category: 'self_help',
    description: 'Personal and professional effectiveness',
    totalPages: 380,
    estimatedReadingHours: 10,
    knowledgeGain: { productivity: 20, leadership: 15, self_management: 20 },
    cost: 22
  },
  
  // ============================================
  // FINANCE BOOKS
  // ============================================
  {
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    category: 'finance',
    description: 'Definitive book on value investing',
    totalPages: 640,
    estimatedReadingHours: 18,
    knowledgeGain: { investment: 30, finance: 25, risk_management: 20 },
    cost: 25
  },
  {
    title: 'A Random Walk Down Wall Street',
    author: 'Burton Malkiel',
    category: 'finance',
    description: 'Time-tested investment strategies',
    totalPages: 450,
    estimatedReadingHours: 12,
    knowledgeGain: { investment: 25, finance: 20 },
    cost: 22
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert Kiyosaki',
    category: 'finance',
    description: 'Fundamentals of wealth building',
    totalPages: 240,
    estimatedReadingHours: 5,
    knowledgeGain: { finance: 15, investment: 10, mindset: 15 },
    cost: 18
  },
  
  // ============================================
  // PHILOSOPHY & SELF-IMPROVEMENT
  // ============================================
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    category: 'philosophy',
    description: 'Stoic philosophy from a Roman emperor',
    totalPages: 180,
    estimatedReadingHours: 6,
    knowledgeGain: { mental_toughness: 20, wisdom: 25, self_management: 15 },
    cost: 12
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'self_help',
    description: 'Two systems that drive how we think',
    totalPages: 500,
    estimatedReadingHours: 15,
    knowledgeGain: { decision_making: 30, psychology: 20, self_awareness: 15 },
    cost: 28
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'self_help',
    description: 'Small changes, remarkable results',
    totalPages: 320,
    estimatedReadingHours: 7,
    knowledgeGain: { productivity: 25, self_management: 20, discipline: 15 },
    cost: 24
  }
]

// ============================================
// CERTIFICATION CATALOG
// ============================================

export const CERTIFICATION_CATALOG: Omit<Certification, 'id' | 'isEarned' | 'earnedDate'>[] = [
  {
    name: 'FIA Team Management License',
    issuingBody: 'FIA',
    category: 'motorsport',
    description: 'Official certification for team leadership in motorsport',
    examRequired: true,
    examDifficulty: 'hard',
    studyHoursRecommended: 100,
    cost: 5000,
    industryRecognition: 95,
    careerBenefit: 'Required for certain FIA championship team principal roles',
    reputationBonus: 30,
    skillRequirements: { motorsport_management: 60, leadership: 50 }
  },
  {
    name: 'Chartered Financial Analyst (CFA) Level 1',
    issuingBody: 'CFA Institute',
    category: 'finance',
    description: 'Gold standard in investment analysis',
    examRequired: true,
    examDifficulty: 'expert',
    studyHoursRecommended: 300,
    cost: 3000,
    industryRecognition: 100,
    careerBenefit: 'Credential for serious investors',
    reputationBonus: 20,
    expiresAfterYears: undefined, // Never expires
    skillRequirements: { finance: 70, investment: 60 }
  },
  {
    name: 'Project Management Professional (PMP)',
    issuingBody: 'PMI',
    category: 'business',
    description: 'Globally recognized project management certification',
    examRequired: true,
    examDifficulty: 'medium',
    studyHoursRecommended: 60,
    cost: 1500,
    industryRecognition: 85,
    careerBenefit: 'Better project execution and team management',
    reputationBonus: 12,
    expiresAfterYears: 3,
    renewalCost: 500,
    skillRequirements: { project_management: 50, leadership: 40 }
  },
  {
    name: 'Six Sigma Black Belt',
    issuingBody: 'ASQ',
    category: 'business',
    description: 'Process improvement and quality management',
    examRequired: true,
    examDifficulty: 'hard',
    studyHoursRecommended: 150,
    cost: 4000,
    industryRecognition: 80,
    careerBenefit: 'Operational excellence in team management',
    reputationBonus: 15,
    skillRequirements: { operations: 60, data_analysis: 50 }
  },
  {
    name: 'Executive Coaching Certification',
    issuingBody: 'ICF',
    category: 'leadership',
    description: 'Professional coaching skills for leaders',
    examRequired: true,
    examDifficulty: 'medium',
    studyHoursRecommended: 80,
    cost: 6000,
    industryRecognition: 75,
    careerBenefit: 'Better driver and staff development',
    reputationBonus: 10,
    skillRequirements: { leadership: 60, communication: 50 }
  },
  {
    name: 'Certified ScrumMaster',
    issuingBody: 'Scrum Alliance',
    category: 'technology',
    description: 'Agile project management methodology',
    examRequired: true,
    examDifficulty: 'easy',
    studyHoursRecommended: 20,
    cost: 1200,
    industryRecognition: 70,
    careerBenefit: 'Modern management techniques',
    reputationBonus: 5,
    expiresAfterYears: 2,
    renewalCost: 300,
    skillRequirements: { project_management: 30 }
  }
]

// ============================================
// CONFIGURATION
// ============================================

export const EDUCATION_CONFIG = {
  // Learning rates
  hoursPerWeekMax: 30,          // Maximum study hours before burnout
  optimalHoursPerWeek: 15,      // Sweet spot for learning
  
  // Course completion
  passingGrade: 70,             // Minimum to pass
  honorsGrade: 90,              // With honors
  
  // Reading
  pagesPerHourBase: 30,         // Average reading speed
  pagesPerHourFast: 50,         // Quick reader
  
  // Benefits decay
  knowledgeDecayPerYear: 5,     // Lose 5% skill per year if not applied
  
  // Study effects
  stressPerStudyHour: 0.5,      // Stress impact
  reputationPerCourse: 5,       // Base reputation gain per completed course
  
  // Book benefits
  bookCompletionBonus: 1.5,     // 50% bonus for finishing a book
  
  // Certification
  certificationStudyMultiplier: 0.8   // Studying for cert is 80% as effective as course
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createCourse(catalogIndex: number, startDate: { week: number; year: number }): Course {
  const template = COURSE_CATALOG[catalogIndex]
  if (!template) throw new Error('Course not found in catalog')
  
  return {
    id: `course_${Date.now()}_${catalogIndex}`,
    ...template,
    modulesCompleted: 0,
    currentGrade: 0,
    assignmentsCompleted: 0,
    examsRemaining: template.totalExams,
    certificateEarned: false,
    startDate
  }
}

export function createBook(catalogIndex: number): Book {
  const template = BOOK_CATALOG[catalogIndex]
  if (!template) throw new Error('Book not found in catalog')
  
  return {
    id: `book_${Date.now()}_${catalogIndex}`,
    ...template,
    pagesRead: 0,
    isComplete: false,
    insightsUnlocked: [],
    quotesCollected: []
  }
}

export function createCertification(catalogIndex: number): Certification {
  const template = CERTIFICATION_CATALOG[catalogIndex]
  if (!template) throw new Error('Certification not found in catalog')
  
  return {
    id: `cert_${Date.now()}_${catalogIndex}`,
    ...template,
    isEarned: false
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateCourseProgress(course: Course): number {
  return Math.round((course.modulesCompleted / course.totalModules) * 100)
}

export function calculateReadingProgress(book: Book): number {
  return Math.round((book.pagesRead / book.totalPages) * 100)
}

export function estimateCompletionWeeks(
  course: Course,
  hoursPerWeek: number
): number {
  const remainingModules = course.totalModules - course.modulesCompleted
  const remainingHours = remainingModules * course.hoursPerModule
  return Math.ceil(remainingHours / hoursPerWeek)
}

export function getCourseByCategoryList(category: CourseCategory): typeof COURSE_CATALOG {
  return COURSE_CATALOG.filter(c => c.category === category)
}

export function getBookByCategoryList(category: BookCategory): typeof BOOK_CATALOG {
  return BOOK_CATALOG.filter(b => b.category === category)
}

export function canEnrollInCourse(
  course: typeof COURSE_CATALOG[0],
  completedCourses: string[],
  skills: Record<string, number>
): { canEnroll: boolean; reason?: string } {
  // Check prerequisites
  if (course.prerequisiteCourses) {
    const missing = course.prerequisiteCourses.filter(p => !completedCourses.includes(p))
    if (missing.length > 0) {
      return { canEnroll: false, reason: `Missing prerequisites: ${missing.join(', ')}` }
    }
  }
  
  // Check skill level
  if (course.prerequisiteLevel !== undefined) {
    const relevantSkills = Object.entries(course.skillBoosts)
    for (const [skill] of relevantSkills) {
      if ((skills[skill] || 0) < (course.prerequisiteLevel || 0)) {
        return { canEnroll: false, reason: `Insufficient ${skill} skill level` }
      }
    }
  }
  
  return { canEnroll: true }
}

export function canAttemptCertification(
  cert: typeof CERTIFICATION_CATALOG[0],
  skills: Record<string, number>
): { canAttempt: boolean; reason?: string } {
  for (const [skill, required] of Object.entries(cert.skillRequirements)) {
    if ((skills[skill] || 0) < required) {
      return { 
        canAttempt: false, 
        reason: `Need ${required} ${skill} (have ${skills[skill] || 0})` 
      }
    }
  }
  return { canAttempt: true }
}
