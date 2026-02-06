/**
 * Config Loader
 * Extracts configuration data from the TypeScript source files
 * to generate prompts for asset generation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../../../src');

// Nationality data for generating diverse portraits
export const NATIONALITIES = [
  { code: 'BR', name: 'Brazilian', country: 'Brazil' },
  { code: 'GB', name: 'British', country: 'United Kingdom' },
  { code: 'DE', name: 'German', country: 'Germany' },
  { code: 'IT', name: 'Italian', country: 'Italy' },
  { code: 'FR', name: 'French', country: 'France' },
  { code: 'ES', name: 'Spanish', country: 'Spain' },
  { code: 'US', name: 'American', country: 'United States' },
  { code: 'JP', name: 'Japanese', country: 'Japan' },
  { code: 'AU', name: 'Australian', country: 'Australia' },
  { code: 'NL', name: 'Dutch', country: 'Netherlands' },
  { code: 'BE', name: 'Belgian', country: 'Belgium' },
  { code: 'AT', name: 'Austrian', country: 'Austria' },
  { code: 'CH', name: 'Swiss', country: 'Switzerland' },
  { code: 'PT', name: 'Portuguese', country: 'Portugal' },
  { code: 'MX', name: 'Mexican', country: 'Mexico' },
  { code: 'AR', name: 'Argentine', country: 'Argentina' },
  { code: 'FI', name: 'Finnish', country: 'Finland' },
  { code: 'SE', name: 'Swedish', country: 'Sweden' },
  { code: 'DK', name: 'Danish', country: 'Denmark' },
  { code: 'PL', name: 'Polish', country: 'Poland' },
  { code: 'CZ', name: 'Czech', country: 'Czech Republic' },
  { code: 'NZ', name: 'New Zealand', country: 'New Zealand' },
  { code: 'ZA', name: 'South African', country: 'South Africa' },
  { code: 'CA', name: 'Canadian', country: 'Canada' },
  { code: 'KR', name: 'South Korean', country: 'South Korea' },
];

// Staff roles with descriptions for portrait generation
export const STAFF_ROLES = {
  team: [
    { id: 'chief_engineer', name: 'Chief Engineer', description: 'Senior technical leader, analytical, often with glasses or technical attire' },
    { id: 'race_engineer', name: 'Race Engineer', description: 'Race day strategist, wearing team gear, headset around neck' },
    { id: 'mechanic', name: 'Mechanic', description: 'Hands-on worker, may have grease marks, work gloves' },
    { id: 'data_analyst', name: 'Data Analyst', description: 'Tech-focused, younger, casual professional attire' },
    { id: 'strategist', name: 'Strategist', description: 'Focused expression, professional, often with tablet or clipboard' },
    { id: 'team_manager', name: 'Team Manager', description: 'Leadership presence, business casual, confident posture' },
    { id: 'aerodynamicist', name: 'Aerodynamicist', description: 'Technical specialist, lab coat or smart casual' },
    { id: 'tire_engineer', name: 'Tire Engineer', description: 'Specialist technician, analytical appearance' },
  ],
  facility: [
    { id: 'factory_manager', name: 'Factory Manager', description: 'Industrial setting, hard hat optional, clipboard' },
    { id: 'quality_control', name: 'Quality Control', description: 'Meticulous appearance, safety glasses' },
    { id: 'cnc_operator', name: 'CNC Operator', description: 'Technical worker, safety gear, workshop environment' },
    { id: 'composite_tech', name: 'Composites Technician', description: 'Clean room attire, precision focus' },
    { id: 'logistics', name: 'Logistics Coordinator', description: 'Organized appearance, business casual' },
  ],
  personal: [
    { id: 'personal_assistant', name: 'Personal Assistant', description: 'Professional, organized, smart business attire' },
    { id: 'driver_coach', name: 'Driver Coach', description: 'Athletic build, casual sporty attire, stopwatch' },
    { id: 'physio', name: 'Physiotherapist', description: 'Athletic, medical professional appearance' },
    { id: 'pr_manager', name: 'PR Manager', description: 'Polished appearance, media-ready, confident' },
    { id: 'chef', name: 'Personal Chef', description: 'Chef whites, professional kitchen appearance' },
    { id: 'trainer', name: 'Fitness Trainer', description: 'Athletic, sporty attire, energetic appearance' },
  ]
};

/**
 * Extract sponsors from the TypeScript source
 */
export async function loadSponsors() {
  try {
    const content = await fs.readFile(path.join(SRC_DIR, 'data/sponsors.ts'), 'utf-8');
    
    // Parse sponsor entries from the SPONSORS array
    const sponsors = [];
    const sponsorRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*tier:\s*'([^']+)',\s*description:\s*'([^']+)',\s*country:\s*'([^']+)'/g;
    
    let match;
    while ((match = sponsorRegex.exec(content)) !== null) {
      sponsors.push({
        id: match[1],
        name: match[2],
        category: match[3],
        tier: match[4],
        description: match[5],
        country: match[6]
      });
    }
    
    return sponsors;
  } catch (error) {
    console.warn('Could not load sponsors from source:', error.message);
    return getDefaultSponsors();
  }
}

/**
 * Extract manufacturers from the TypeScript source
 */
export async function loadManufacturers() {
  try {
    const content = await fs.readFile(path.join(SRC_DIR, 'data/manufacturers.ts'), 'utf-8');
    
    const manufacturers = [];
    const mfgRegex = /'([^']+)':\s*{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*country:\s*'([^']+)',[\s\S]*?tier:\s*'([^']+)'/g;
    
    let match;
    while ((match = mfgRegex.exec(content)) !== null) {
      manufacturers.push({
        id: match[2],
        name: match[3],
        country: match[4],
        tier: match[5]
      });
    }
    
    return manufacturers;
  } catch (error) {
    console.warn('Could not load manufacturers from source:', error.message);
    return getDefaultManufacturers();
  }
}

/**
 * Extract banks from the TypeScript source
 */
export async function loadBanks() {
  try {
    const content = await fs.readFile(path.join(SRC_DIR, 'data/financial-extended-config.ts'), 'utf-8');
    
    const bankMatch = content.match(/BANK_LENDERS\s*=\s*\[([\s\S]*?)\]/);
    if (bankMatch) {
      const banks = [];
      const nameRegex = /'([^']+)'/g;
      let match;
      while ((match = nameRegex.exec(bankMatch[1])) !== null) {
        banks.push({
          id: match[1].toLowerCase().replace(/\s+/g, '-'),
          name: match[1]
        });
      }
      return banks;
    }
    
    return getDefaultBanks();
  } catch (error) {
    console.warn('Could not load banks from source:', error.message);
    return getDefaultBanks();
  }
}

// Fallback data if parsing fails
function getDefaultSponsors() {
  return [
    { id: 'monster-energy', name: 'Monster Energy', category: 'energy_drinks', tier: 'high', country: 'USA' },
    { id: 'red-bull', name: 'Red Bull', category: 'energy_drinks', tier: 'elite', country: 'Austria' },
    { id: 'rockstar-energy', name: 'Rockstar Energy', category: 'energy_drinks', tier: 'mid', country: 'USA' },
    { id: 'mobil-1', name: 'Mobil 1', category: 'oil_fuel', tier: 'high', country: 'USA' },
    { id: 'shell', name: 'Shell', category: 'oil_fuel', tier: 'elite', country: 'Netherlands' },
    { id: 'castrol', name: 'Castrol', category: 'oil_fuel', tier: 'high', country: 'UK' },
    { id: 'michelin', name: 'Michelin', category: 'tires', tier: 'elite', country: 'France' },
    { id: 'pirelli', name: 'Pirelli', category: 'tires', tier: 'elite', country: 'Italy' },
    { id: 'goodyear', name: 'Goodyear', category: 'tires', tier: 'high', country: 'USA' },
    { id: 'logitech', name: 'Logitech', category: 'tech_gaming', tier: 'high', country: 'Switzerland' },
    { id: 'razer', name: 'Razer', category: 'tech_gaming', tier: 'mid', country: 'USA' },
    { id: 'nvidia', name: 'NVIDIA', category: 'tech_gaming', tier: 'high', country: 'USA' },
    { id: 'sparco', name: 'Sparco', category: 'equipment', tier: 'high', country: 'Italy' },
    { id: 'bell-helmets', name: 'Bell Helmets', category: 'equipment', tier: 'mid', country: 'USA' },
    { id: 'rolex', name: 'Rolex', category: 'watches', tier: 'elite', country: 'Switzerland' },
    { id: 'tag-heuer', name: 'TAG Heuer', category: 'watches', tier: 'elite', country: 'Switzerland' },
    { id: 'omega', name: 'Omega', category: 'watches', tier: 'high', country: 'Switzerland' },
  ];
}

function getDefaultManufacturers() {
  return [
    { id: 'mclaren', name: 'McLaren', country: 'United Kingdom', tier: 'luxury' },
    { id: 'lamborghini', name: 'Lamborghini', country: 'Italy', tier: 'luxury' },
    { id: 'porsche', name: 'Porsche', country: 'Germany', tier: 'premium' },
    { id: 'mercedes-amg', name: 'Mercedes-AMG', country: 'Germany', tier: 'premium' },
    { id: 'aston-martin', name: 'Aston Martin', country: 'United Kingdom', tier: 'premium' },
    { id: 'ferrari', name: 'Ferrari', country: 'Italy', tier: 'luxury' },
    { id: 'audi', name: 'Audi', country: 'Germany', tier: 'mainstream' },
    { id: 'bmw', name: 'BMW', country: 'Germany', tier: 'mainstream' },
    { id: 'ford', name: 'Ford', country: 'United States', tier: 'mainstream' },
    { id: 'chevrolet', name: 'Chevrolet', country: 'United States', tier: 'mainstream' },
    { id: 'nissan', name: 'Nissan', country: 'Japan', tier: 'mainstream' },
    { id: 'toyota', name: 'Toyota', country: 'Japan', tier: 'mainstream' },
    { id: 'alpine', name: 'Alpine', country: 'France', tier: 'mainstream' },
    { id: 'ginetta', name: 'Ginetta', country: 'United Kingdom', tier: 'budget' },
    { id: 'caterham', name: 'Caterham', country: 'United Kingdom', tier: 'budget' },
  ];
}

function getDefaultBanks() {
  return [
    { id: 'first-motorsport-bank', name: 'First Motorsport Bank' },
    { id: 'racing-capital-finance', name: 'Racing Capital Finance' },
    { id: 'velocity-financial', name: 'Velocity Financial' },
    { id: 'grid-position-lending', name: 'Grid Position Lending' },
    { id: 'apex-credit-union', name: 'Apex Credit Union' },
    { id: 'motorsport-mutual', name: 'Motorsport Mutual' },
    { id: 'trackside-banking', name: 'Trackside Banking' },
    { id: 'championship-finance-corp', name: 'Championship Finance Corp' },
    { id: 'pit-lane-capital', name: 'Pit Lane Capital' },
    { id: 'start-line-credit', name: 'Start Line Credit' },
  ];
}

// Video background scenes
export const VIDEO_SCENES = [
  { id: 'paddock-timelapse', name: 'Paddock Timelapse', prompt: 'Smooth cinematic timelapse of a Formula 1 paddock at dawn, teams preparing cars, crew members walking, motorhomes and equipment, professional motorsport atmosphere, 8 seconds seamless loop' },
  { id: 'aerial-circuit', name: 'Aerial Circuit', prompt: 'Sweeping aerial drone shot of a modern racing circuit, flowing track layout visible, green runoff areas, empty grandstands, golden hour lighting, cinematic motion, 8 seconds seamless loop' },
  { id: 'onboard-loop', name: 'Onboard Loop', prompt: 'POV cockpit view of a GT race car driving on track, steering wheel visible, speed blur effects, professional sim racing perspective, 8 seconds seamless loop' },
  { id: 'workshop', name: 'Workshop', prompt: 'Interior of a high-tech racing team workshop, GT3 car being worked on, bright lighting, tools and equipment, mechanics in background, industrial motorsport atmosphere, 8 seconds seamless loop' },
  { id: 'office', name: 'Office', prompt: 'Modern racing team office space, multiple monitors showing telemetry, glass walls, professional environment, subtle activity in background, 8 seconds seamless loop' },
  { id: 'press-room', name: 'Press Room', prompt: 'Empty motorsport press conference room, sponsor backdrop, microphones on table, professional lighting, subtle camera flashes, 8 seconds seamless loop' },
  { id: 'gym', name: 'Gym', prompt: 'High-end athlete training facility, racing simulator visible, fitness equipment, modern interior, subtle movement, professional sports atmosphere, 8 seconds seamless loop' },
  { id: 'team-facility', name: 'Team Facility', prompt: 'Exterior shot of modern racing team headquarters building, glass and steel architecture, team logo area, cars in parking, professional motorsport facility, 8 seconds seamless loop' },
  { id: 'data-room', name: 'Data Room', prompt: 'Dark room with multiple screens showing racing telemetry and data, graphs and charts, engineer silhouettes, high-tech motorsport analytics environment, 8 seconds seamless loop' },
];

// Venue scenes for cutscenes
export const VENUE_SCENES = [
  { id: 'podium-celebration', prompt: 'Racing podium celebration scene, champagne spray, trophies, confetti, excited drivers, professional motorsport victory moment' },
  { id: 'pit-stop-drama', prompt: 'Intense pit stop scene, crew working on race car, tire change in progress, dramatic lighting, motorsport action' },
  { id: 'contract-signing', prompt: 'Professional contract signing scene in modern office, racing memorabilia visible, two people at desk, formal business setting' },
  { id: 'press-conference', prompt: 'Motorsport press conference, driver at microphone, sponsor logos backdrop, media cameras, professional setting' },
  { id: 'garage-reveal', prompt: 'New race car reveal in team garage, dramatic lighting, covered car being unveiled, team members watching' },
  { id: 'championship-trophy', prompt: 'Close-up of motorsport championship trophy, gleaming gold and silver, engraved details, dramatic lighting' },
  { id: 'race-start', prompt: 'GT3 race start grid, multiple cars lined up, marshals and crew, anticipation before green flag' },
  { id: 'night-race', prompt: 'Night racing scene, race cars with headlights on track, sparks flying, dramatic atmosphere' },
];
