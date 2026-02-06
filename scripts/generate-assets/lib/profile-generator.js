/**
 * Profile Generator
 * Generates expanded profiles for drivers and other characters using Gemini
 * These profiles are then used to generate consistent portraits
 */

import { COUNTRY_NAMES, APPEARANCE_BY_REGION, DEFAULT_APPEARANCE } from './data-reader.js';

// Personality types for drivers
const PERSONALITIES = ['aggressive', 'calculating', 'steady', 'flashy', 'defensive', 'inconsistent'];

// Career stages
const CAREER_STAGES = ['rookie', 'rising', 'peak', 'veteran', 'declining'];

// Hair styles
const HAIR_STYLES = ['short cropped', 'medium length', 'slicked back', 'curly', 'wavy', 'buzz cut'];

// Facial hair options
const FACIAL_HAIR = ['clean shaven', 'light stubble', 'full beard', 'goatee', 'mustache'];

/**
 * Generate a deterministic random value from a seed string
 */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Pick from array using seeded random
 */
function pickFrom(array, seed) {
  const index = seededRandom(seed) % array.length;
  return array[index];
}

/**
 * Detect if a driver name is likely female
 */
function isFemaleDriver(name) {
  const femaleNames = [
    'charlotte', 'sarah', 'emma', 'anna', 'maria', 'laura', 'julia', 'sophie',
    'chloe', 'emily', 'jessica', 'ashley', 'amanda', 'nicole', 'stephanie',
    'michelle', 'christina', 'katherine', 'elizabeth', 'jennifer', 'rachel',
    'samantha', 'victoria', 'alexandra', 'natalie', 'rebecca', 'megan',
    'hannah', 'danielle', 'brittany', 'vanessa', 'gabriella', 'isabella',
    'tatiana', 'simona', 'danica', 'pippa', 'jamie', 'susie', 'carmen',
    'sabine', 'katherine', 'kat', 'kate'
  ];
  const firstName = name.split(' ')[0].toLowerCase();
  return femaleNames.includes(firstName);
}

/**
 * Generate age based on tier and career stage
 */
function generateAge(seed, tier) {
  const baseRandom = seededRandom(seed);
  
  // Entry tier: younger drivers (18-28)
  // Elite tier: wider range (20-42)
  const tierAgeRanges = {
    'entry': { min: 18, max: 28 },
    'amateur': { min: 19, max: 32 },
    'semi-pro': { min: 20, max: 35 },
    'professional': { min: 21, max: 38 },
    'pro': { min: 21, max: 38 },
    'elite': { min: 22, max: 42 },
    'pinnacle': { min: 23, max: 40 }
  };
  
  const range = tierAgeRanges[tier] || tierAgeRanges['professional'];
  return range.min + (baseRandom % (range.max - range.min + 1));
}

/**
 * Determine career stage from age
 */
function getCareerStage(age) {
  if (age <= 21) return 'rookie';
  if (age <= 26) return 'rising';
  if (age <= 33) return 'peak';
  if (age <= 38) return 'veteran';
  return 'declining';
}

/**
 * Generate physical description based on country, seed, and gender
 */
function generatePhysicalDescription(countryCode, seed, gender = 'male') {
  const appearance = APPEARANCE_BY_REGION[countryCode] || DEFAULT_APPEARANCE;
  
  const skinTone = appearance.skinTone;
  const hairColor = pickFrom(appearance.hairColors, seed + 'hair');
  const eyeColor = pickFrom(appearance.eyeColors, seed + 'eye');
  const hairStyle = pickFrom(HAIR_STYLES, seed + 'style');
  
  // Only add facial hair for males
  const facialHair = gender === 'male' ? pickFrom(FACIAL_HAIR, seed + 'facial') : null;
  
  return {
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    facialHair,
    description: gender === 'male'
      ? `${skinTone} skin, ${hairColor} ${hairStyle} hair, ${eyeColor} eyes, ${facialHair}`
      : `${skinTone} skin, ${hairColor} ${hairStyle} hair, ${eyeColor} eyes`
  };
}

/**
 * Generate a driver profile from basic data
 */
export function generateDriverProfile(driver, teamTier = 'professional') {
  const seed = driver.id || `${driver.name}-${driver.country}`;
  
  const age = generateAge(seed, teamTier);
  const careerStage = getCareerStage(age);
  const personality = pickFrom(PERSONALITIES, seed + 'personality');
  // Most racing drivers are male, but detect female names
  const gender = isFemaleDriver(driver.name) ? 'female' : 'male';
  const physical = generatePhysicalDescription(driver.country, seed, gender);
  const nationality = COUNTRY_NAMES[driver.country] || driver.country;
  
  return {
    ...driver,
    nationality,
    nationalityAdjective: nationality,
    age,
    careerStage,
    personality,
    physical,
    // Build the portrait prompt
    portraitPrompt: buildDriverPortraitPrompt({
      name: driver.name,
      age,
      nationality,
      careerStage,
      personality,
      physical
    })
  };
}

/**
 * Build a portrait prompt for a driver
 */
function buildDriverPortraitPrompt({ name, age, nationality, careerStage, personality, physical }) {
  const careerDescriptions = {
    'rookie': 'young and eager, fresh-faced',
    'rising': 'confident and determined',
    'peak': 'experienced and focused',
    'veteran': 'weathered and wise, experienced features',
    'declining': 'mature, seasoned veteran'
  };
  
  const personalityExpressions = {
    'aggressive': 'intense, fierce competitive expression',
    'calculating': 'thoughtful, analytical gaze',
    'steady': 'calm, composed demeanor',
    'flashy': 'charismatic, confident smile',
    'defensive': 'cautious, observant expression',
    'inconsistent': 'energetic, unpredictable look'
  };
  
  return `Professional motorsport portrait photograph of a ${age}-year-old ${nationality} racing driver named ${name}. ${careerDescriptions[careerStage]}. ${physical.description}. ${personalityExpressions[personality]}. Wearing a racing suit. High quality professional headshot, studio lighting, neutral gray background. Photorealistic.`;
}

/**
 * Generate profiles for all drivers
 */
export function generateAllDriverProfiles(drivers, getTeamTier = () => 'professional') {
  return drivers.map(driver => {
    // Get the highest tier team this driver is associated with
    const tier = getTeamTier(driver);
    return generateDriverProfile(driver, tier);
  });
}

// ============================================
// PERSONAL LIFE CHARACTER GENERATORS
// ============================================

// Partner career types
const PARTNER_CAREERS = [
  { id: 'model', title: 'Model', style: 'glamorous' },
  { id: 'athlete', title: 'Professional Athlete', style: 'athletic' },
  { id: 'business_exec', title: 'Business Executive', style: 'professional' },
  { id: 'doctor', title: 'Doctor', style: 'professional' },
  { id: 'lawyer', title: 'Lawyer', style: 'professional' },
  { id: 'entrepreneur', title: 'Entrepreneur', style: 'stylish' },
  { id: 'artist', title: 'Artist', style: 'bohemian' },
  { id: 'journalist', title: 'Journalist', style: 'smart casual' },
  { id: 'scientist', title: 'Scientist', style: 'academic' },
  { id: 'socialite', title: 'Socialite', style: 'elegant' },
  { id: 'racing_driver', title: 'Racing Driver', style: 'athletic' },
  { id: 'engineer', title: 'Engineer', style: 'smart casual' },
  { id: 'team_staff', title: 'Team Staff', style: 'professional' }
];

// Partner appearance styles
const PARTNER_STYLES = ['elegant', 'casual', 'sporty', 'glamorous', 'bohemian', 'professional'];

/**
 * Generate partner profiles for the partner pool
 */
export function generatePartnerProfiles(count = 150) {
  const partners = [];
  const genders = ['female', 'male'];
  const ageRanges = [
    { min: 22, max: 28, label: 'young' },
    { min: 28, max: 35, label: 'thirties' },
    { min: 35, max: 45, label: 'mature' }
  ];
  
  // Get all country codes for diversity
  const countries = Object.keys(APPEARANCE_BY_REGION);
  
  for (let i = 0; i < count; i++) {
    const seed = `partner-${i}`;
    const gender = pickFrom(genders, seed + 'gender');
    const career = pickFrom(PARTNER_CAREERS, seed + 'career');
    const country = pickFrom(countries, seed + 'country');
    const ageRange = pickFrom(ageRanges, seed + 'agerange');
    const age = ageRange.min + (seededRandom(seed + 'age') % (ageRange.max - ageRange.min + 1));
    const style = pickFrom(PARTNER_STYLES, seed + 'style');
    const physical = generatePhysicalDescription(country, seed, gender);
    const nationality = COUNTRY_NAMES[country] || country;
    
    partners.push({
      id: `partner-${String(i + 1).padStart(4, '0')}`,
      gender,
      age,
      ageRange: ageRange.label,
      career: career.id,
      careerTitle: career.title,
      country,
      nationality,
      style,
      physical,
      portraitPrompt: buildPartnerPortraitPrompt({
        gender, age, nationality, career, style, physical
      })
    });
  }
  
  return partners;
}

function buildPartnerPortraitPrompt({ gender, age, nationality, career, style, physical }) {
  return `Portrait photograph of a ${age}-year-old ${nationality} ${gender}, working as a ${career.title}. ${physical.description}. ${style} style clothing. Attractive, ${gender === 'female' ? 'beautiful' : 'handsome'}. High quality portrait, natural lighting, soft background. Photorealistic.`;
}

// ============================================
// CHILD AGE STAGES
// ============================================

const CHILD_AGE_STAGES = [
  { id: 'newborn', ageRange: '0-6 months', description: 'newborn baby' },
  { id: 'infant', ageRange: '6-12 months', description: 'infant baby' },
  { id: 'toddler', ageRange: '1-3 years', description: 'toddler' },
  { id: 'preschool', ageRange: '4-5 years', description: 'preschool age child' },
  { id: 'young_child', ageRange: '6-8 years', description: 'young child' },
  { id: 'child', ageRange: '9-11 years', description: 'child' },
  { id: 'preteen', ageRange: '12-13 years', description: 'preteen' },
  { id: 'young_teen', ageRange: '14-15 years', description: 'young teenager' },
  { id: 'teen', ageRange: '16-17 years', description: 'teenager' },
  { id: 'young_adult', ageRange: '18-21 years', description: 'young adult' }
];

/**
 * Generate child profiles for the child pool
 * Each child base gets portraits at all age stages
 */
export function generateChildProfiles(baseCount = 10) {
  const children = [];
  const genders = ['female', 'male'];
  const countries = Object.keys(APPEARANCE_BY_REGION);
  
  for (let i = 0; i < baseCount; i++) {
    const seed = `child-base-${i}`;
    const gender = pickFrom(genders, seed + 'gender');
    const country = pickFrom(countries, seed + 'country');
    const physical = generatePhysicalDescription(country, seed, gender);
    const nationality = COUNTRY_NAMES[country] || country;
    
    // Generate a portrait for each age stage
    for (const stage of CHILD_AGE_STAGES) {
      children.push({
        id: `child-${String(i + 1).padStart(3, '0')}-${stage.id}`,
        baseId: `child-${String(i + 1).padStart(3, '0')}`,
        gender,
        stage: stage.id,
        ageRange: stage.ageRange,
        country,
        nationality,
        physical,
        portraitPrompt: buildChildPortraitPrompt({
          gender, stage, nationality, physical
        })
      });
    }
  }
  
  return children;
}

function buildChildPortraitPrompt({ gender, stage, nationality, physical }) {
  const genderWord = gender === 'female' ? 'girl' : 'boy';
  
  if (stage.id === 'newborn' || stage.id === 'infant') {
    return `Portrait of a cute ${nationality} ${stage.description}, ${physical.hairColor} hair. Adorable baby portrait, soft lighting, warm tones. Photorealistic.`;
  }
  
  return `Portrait photograph of a ${nationality} ${stage.description} ${genderWord}. ${physical.description}. Cheerful, natural expression. High quality child portrait, natural lighting, soft background. Photorealistic.`;
}

// ============================================
// STAFF GENERATORS
// ============================================

const STAFF_ROLES = {
  team: [
    { id: 'chief_engineer', title: 'Chief Engineer', style: 'technical professional' },
    { id: 'technical_director', title: 'Technical Director', style: 'senior executive' },
    { id: 'strategist', title: 'Race Strategist', style: 'analytical professional' },
    { id: 'race_engineer', title: 'Race Engineer', style: 'technical professional' },
    { id: 'team_principal', title: 'Team Principal', style: 'executive leader' },
    { id: 'team_manager', title: 'Team Manager', style: 'management professional' },
    { id: 'mechanic', title: 'Mechanic', style: 'technical worker' },
    { id: 'data_analyst', title: 'Data Analyst', style: 'technical professional' },
    { id: 'performance_engineer', title: 'Performance Engineer', style: 'technical professional' }
  ],
  facility: [
    { id: 'aerodynamicist', title: 'Aerodynamicist', style: 'technical scientist' },
    { id: 'designer', title: 'Car Designer', style: 'creative professional' },
    { id: 'production_manager', title: 'Production Manager', style: 'industrial professional' },
    { id: 'marketing_manager', title: 'Marketing Manager', style: 'corporate professional' },
    { id: 'hr_manager', title: 'HR Manager', style: 'corporate professional' },
    { id: 'finance_director', title: 'Finance Director', style: 'corporate executive' }
  ],
  media: [
    { id: 'journalist_technical', title: 'Technical Journalist', style: 'smart casual media' },
    { id: 'journalist_paddock', title: 'Paddock Reporter', style: 'broadcast media' },
    { id: 'commentator', title: 'Commentator', style: 'broadcast professional' },
    { id: 'analyst', title: 'TV Analyst', style: 'broadcast media' }
  ]
};

/**
 * Generate staff profiles
 */
export function generateStaffProfiles(counts = { team: 200, facility: 150, media: 95 }) {
  const staff = [];
  const genders = ['female', 'male', 'male', 'male']; // Weighted toward male for realism in motorsport
  const countries = Object.keys(APPEARANCE_BY_REGION);
  const ageRanges = [
    { min: 28, max: 40 },
    { min: 35, max: 50 },
    { min: 45, max: 60 }
  ];
  
  for (const [category, roleList] of Object.entries(STAFF_ROLES)) {
    const count = counts[category] || 50;
    
    for (let i = 0; i < count; i++) {
      const seed = `staff-${category}-${i}`;
      const role = pickFrom(roleList, seed + 'role');
      const gender = pickFrom(genders, seed + 'gender');
      const country = pickFrom(countries, seed + 'country');
      const ageRange = pickFrom(ageRanges, seed + 'agerange');
      const age = ageRange.min + (seededRandom(seed + 'age') % (ageRange.max - ageRange.min + 1));
      const physical = generatePhysicalDescription(country, seed, gender);
      const nationality = COUNTRY_NAMES[country] || country;
      
      staff.push({
        id: `staff-${category}-${String(i + 1).padStart(4, '0')}`,
        category,
        role: role.id,
        roleTitle: role.title,
        gender,
        age,
        country,
        nationality,
        style: role.style,
        physical,
        portraitPrompt: buildStaffPortraitPrompt({
          gender, age, nationality, role, physical
        })
      });
    }
  }
  
  return staff;
}

function buildStaffPortraitPrompt({ gender, age, nationality, role, physical }) {
  return `Professional portrait of a ${age}-year-old ${nationality} ${gender} working as a ${role.title} in motorsport. ${physical.description}. ${role.style} attire. Competent, professional demeanor. High quality corporate portrait, office/paddock setting, professional lighting. Photorealistic.`;
}

// ============================================
// CONTACT/FRIEND GENERATORS
// ============================================

const CONTACT_TYPES = [
  { id: 'business_mogul', title: 'Business Mogul', style: 'wealthy executive' },
  { id: 'celebrity', title: 'Celebrity', style: 'glamorous' },
  { id: 'politician', title: 'Politician', style: 'formal political' },
  { id: 'athlete', title: 'Professional Athlete', style: 'athletic' },
  { id: 'musician', title: 'Musician', style: 'artistic' },
  { id: 'actor', title: 'Actor', style: 'glamorous' },
  { id: 'sponsor_exec', title: 'Sponsor Executive', style: 'corporate' },
  { id: 'banker', title: 'Investment Banker', style: 'financial professional' },
  { id: 'lawyer', title: 'Sports Lawyer', style: 'legal professional' },
  { id: 'agent', title: 'Sports Agent', style: 'slick professional' }
];

/**
 * Generate contact/friend profiles
 */
export function generateContactProfiles(count = 150) {
  const contacts = [];
  const genders = ['female', 'male'];
  const countries = Object.keys(APPEARANCE_BY_REGION);
  const ageRanges = [
    { min: 30, max: 45 },
    { min: 40, max: 55 },
    { min: 50, max: 65 }
  ];
  
  for (let i = 0; i < count; i++) {
    const seed = `contact-${i}`;
    const type = pickFrom(CONTACT_TYPES, seed + 'type');
    const gender = pickFrom(genders, seed + 'gender');
    const country = pickFrom(countries, seed + 'country');
    const ageRange = pickFrom(ageRanges, seed + 'agerange');
    const age = ageRange.min + (seededRandom(seed + 'age') % (ageRange.max - ageRange.min + 1));
    const physical = generatePhysicalDescription(country, seed, gender);
    const nationality = COUNTRY_NAMES[country] || country;
    
    contacts.push({
      id: `contact-${String(i + 1).padStart(4, '0')}`,
      type: type.id,
      typeTitle: type.title,
      gender,
      age,
      country,
      nationality,
      style: type.style,
      physical,
      portraitPrompt: buildContactPortraitPrompt({
        gender, age, nationality, type, physical
      })
    });
  }
  
  return contacts;
}

function buildContactPortraitPrompt({ gender, age, nationality, type, physical }) {
  return `Portrait of a ${age}-year-old ${nationality} ${gender} who is a ${type.title}. ${physical.description}. ${type.style} appearance. Successful, confident demeanor. High quality portrait, professional setting, good lighting. Photorealistic.`;
}

// ============================================
// BOARD MEMBER GENERATORS
// ============================================

export function generateBoardMemberProfiles(count = 25) {
  const members = [];
  const genders = ['female', 'male', 'male', 'male']; // Weighted
  const countries = Object.keys(APPEARANCE_BY_REGION);
  
  for (let i = 0; i < count; i++) {
    const seed = `board-${i}`;
    const gender = pickFrom(genders, seed + 'gender');
    const country = pickFrom(countries, seed + 'country');
    const age = 45 + (seededRandom(seed + 'age') % 20); // 45-65
    const physical = generatePhysicalDescription(country, seed, gender);
    const nationality = COUNTRY_NAMES[country] || country;
    
    members.push({
      id: `board-${String(i + 1).padStart(3, '0')}`,
      gender,
      age,
      country,
      nationality,
      physical,
      portraitPrompt: `Portrait of a ${age}-year-old ${nationality} ${gender} corporate board member. ${physical.description}. Executive business attire. Authoritative, successful demeanor. High quality corporate portrait, boardroom setting. Photorealistic.`
    });
  }
  
  return members;
}

// ============================================
// SPONSOR EXECUTIVE GENERATORS  
// ============================================

export function generateSponsorExecProfiles(count = 25) {
  const execs = [];
  const genders = ['female', 'male', 'male'];
  const countries = Object.keys(APPEARANCE_BY_REGION);
  
  for (let i = 0; i < count; i++) {
    const seed = `sponsor-exec-${i}`;
    const gender = pickFrom(genders, seed + 'gender');
    const country = pickFrom(countries, seed + 'country');
    const age = 35 + (seededRandom(seed + 'age') % 25); // 35-60
    const physical = generatePhysicalDescription(country, seed, gender);
    const nationality = COUNTRY_NAMES[country] || country;
    
    execs.push({
      id: `sponsor-exec-${String(i + 1).padStart(3, '0')}`,
      gender,
      age,
      country,
      nationality,
      physical,
      portraitPrompt: `Portrait of a ${age}-year-old ${nationality} ${gender} sponsor executive. ${physical.description}. Corporate business attire, branded polo or suit. Professional, friendly demeanor. High quality corporate portrait, hospitality or office setting. Photorealistic.`
    });
  }
  
  return execs;
}
