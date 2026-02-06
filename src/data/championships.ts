/**
 * AMS2 Career Mode Championships Database
 * Realistic championship definitions based on actual AMS2 car classes
 * 
 * Class Status (as of 2024-2026):
 * - CURRENT: lmdh, gt3-gen2, gt4, gt3, gt5
 * - HISTORIC: hypercar (track-day), gte (retired 2023), dpi (phased out)
 * - LIMITED: lmp2 (Le Mans only)
 * - CLASSIC: group-c, gt1, group-a, etc.
 */

import type { TeamTier } from './ams2-teams-real';
import type { SeriesCategory } from './series-commentary';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ChampionshipType = 
  | 'spec-series'      // Single make (Porsche, Caterham, etc.)
  | 'national'         // Country-specific (Stock Car Brasil, Supercars)
  | 'continental'      // Regional multi-team (GT Europe, Formula Euro)
  | 'international'    // Global (WEC-style, IMSA-style)
  | 'historic'         // Vintage/classic invitational events
  | 'multi-class';     // Combined classes (endurance format)

export type ChampionshipRegion = 'Global' | 'Europe' | 'Americas' | 'Asia-Pacific' | 'Brazil' | 'Australia' | 'USA';

export type ChampionshipFormat = 'sprint' | 'endurance' | 'mixed';

export type ClassStatus = 'current' | 'historic' | 'limited' | 'classic';

export interface ChampionshipClass {
  classId: string;
  className: string;
  status: ClassStatus;
}

export interface Championship {
  id: string;
  name: string;
  shortName: string;
  type: ChampionshipType;
  carClassIds: string[];           // AMS2 car class IDs
  region: ChampionshipRegion;
  tier: TeamTier;
  description: string;
  format: ChampionshipFormat;
  multiClass: boolean;
  seasonRounds: number;
  prestige: number;                // 1-100
  prizePool: number;               // Total season prize pool
  historicEra?: string;            // For historic championships
  manufacturer?: string;           // For spec series
  
  // NEW: Points system and series category for authentic commentary
  pointsSystemId: string;          // Reference to POINTS_SYSTEMS in points-systems.ts
  seriesCategory: SeriesCategory;  // For commentary routing
  youtubeId?: string;              // Trailer or intro video
  
  // Multi-car team management
  maxTeamCars: number;             // Maximum cars a team can run in this series (1-4)
}

// ============================================
// CLASS STATUS MAPPING
// ============================================

export const CLASS_STATUS: Record<string, ClassStatus> = {
  // Current classes
  'lmdh': 'current',
  'gt3-gen2': 'current',
  'gt3': 'current',
  'gt4': 'current',
  'gt5': 'current',
  'lmp2': 'limited',
  'prototype-3': 'current',
  'prototype-4': 'current',
  
  // Historic/Retired classes
  'hypercar': 'historic',       // AMS2 hypercars are track-day cars, not WEC prototypes
  'gte': 'historic',            // Retired end of 2023
  'dpi': 'historic',            // Phased out for GTP/LMDh
  
  // Classic classes
  'group-c': 'classic',
  'group-a': 'classic',
  'gt1': 'classic',
  'formula-classic-gen1': 'classic',
  'formula-classic-gen2': 'classic',
  'formula-classic-gen3': 'classic',
  'formula-vintage-gen1': 'classic',
  'formula-vintage-gen2': 'classic',
  'tc60s': 'classic',
  'tc70s': 'classic',
  'opala-79': 'classic',
  'opala-86': 'classic',
  
  // Spec series (current)
  'carrera-cup': 'current',
  'carrera-cup-brasil': 'current',
  'super-trofeo': 'current',
  'caterham-academy': 'current',
  'caterham-superlight': 'current',
  'caterham-supersport': 'current',
  'caterham-620r': 'current',
  'g40-cup': 'current',
  'g55-supercup': 'current',
  'mini-challenge': 'current',
  
  // Formula (current)
  'formula-vee': 'current',
  'formula-trainer': 'current',
  'formula-3': 'current',
  'formula-inter': 'current',
  'formula-reiza': 'current',
  'formula-usa-2023': 'current',
  'formula-ultimate-gen2': 'current',
  
  // National (current)
  'stock-car-2024': 'current',
  'supercars': 'current',
  'super-v8': 'current',
  'arc-camaro': 'current',
  'sprint-race': 'current',
  'copa-truck': 'current',
  
  // Brazilian classics
  'copa-fusca': 'current',
  'copa-uno': 'current',
  'copa-classic-b': 'current',
  'copa-classic-fl': 'current',
};

// ============================================
// CHAMPIONSHIP DEFINITIONS
// ============================================

export const CHAMPIONSHIPS: Championship[] = [
  // ============================================
  // CURRENT PROTOTYPE / ENDURANCE (International)
  // ============================================
  {
    id: 'wec',
    name: 'FIA World Endurance Championship',
    shortName: 'WEC',
    type: 'multi-class',
    carClassIds: ['lmdh', 'gt3-gen2'],
    region: 'Global',
    tier: 'pinnacle',
    description: 'The pinnacle of sports car racing. LMDh prototypes battle alongside GT3 machinery across iconic circuits worldwide, culminating at the 24 Hours of Le Mans.',
    format: 'endurance',
    multiClass: true,
    seasonRounds: 8,
    prestige: 98,
    prizePool: 22000000,
    pointsSystemId: 'endurance',
    seriesCategory: 'endurance',
    maxTeamCars: 2,
  },
  {
    id: 'imsa-gtp',
    name: 'IMSA WeatherTech SportsCar Championship',
    shortName: 'IMSA GTP',
    type: 'multi-class',
    carClassIds: ['lmdh', 'gt3-gen2'],
    region: 'Americas',
    tier: 'elite',
    description: 'North America\'s premier sports car series featuring GTP prototypes and GT3 cars racing together at legendary venues like Daytona, Sebring, and Road Atlanta.',
    format: 'endurance',
    multiClass: true,
    seasonRounds: 11,
    prestige: 95,
    prizePool: 16000000,
    pointsSystemId: 'endurance',
    seriesCategory: 'endurance',
    maxTeamCars: 2,
  },
  {
    id: 'lmdh-sprint',
    name: 'LMDh Sprint Series',
    shortName: 'LMDh Sprint',
    type: 'international',
    carClassIds: ['lmdh'],
    region: 'Global',
    tier: 'elite',
    description: 'Pure prototype racing in sprint format. Factory and privateer LMDh teams compete in short, intense races.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 10,
    prestige: 90,
    prizePool: 8000000,
    pointsSystemId: 'prototype',
    seriesCategory: 'prototype',
    maxTeamCars: 2,
  },
  {
    id: 'lmp2-proam',
    name: 'LMP2 European Series',
    shortName: 'LMP2 Euro',
    type: 'continental',
    carClassIds: ['lmp2'],
    region: 'Europe',
    tier: 'pro',
    description: 'The proving ground for prototype racing. Pro-Am format allows gentleman drivers to compete alongside professionals.',
    format: 'endurance',
    multiClass: false,
    seasonRounds: 6,
    prestige: 78,
    prizePool: 3000000,
    pointsSystemId: 'prototype',
    seriesCategory: 'prototype',
    maxTeamCars: 2,
  },
  {
    id: 'prototype-3-challenge',
    name: 'Prototype 3 Challenge',
    shortName: 'P3 Challenge',
    type: 'continental',
    carClassIds: ['prototype-3'],
    region: 'Europe',
    tier: 'semi-pro',
    description: 'Entry-level prototype racing with spec LMP3 machinery. The first step for drivers aspiring to Le Mans.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 55,
    prizePool: 800000,
    pointsSystemId: 'prototype',
    seriesCategory: 'prototype',
    maxTeamCars: 2,
  },
  {
    id: 'prototype-4-development',
    name: 'Prototype 4 Development Series',
    shortName: 'P4 Dev',
    type: 'continental',
    carClassIds: ['prototype-4'],
    region: 'Europe',
    tier: 'amateur',
    description: 'Introduction to prototype racing with affordable P4 machinery. Perfect for developing sportscar skills.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 35,
    prizePool: 300000,
    pointsSystemId: 'entry-level',
    seriesCategory: 'prototype',
    maxTeamCars: 3,
  },

  // ============================================
  // CURRENT GT CHAMPIONSHIPS
  // ============================================
  {
    id: 'gt-world-challenge-europe',
    name: 'GT World Challenge Europe',
    shortName: 'GTWC Europe',
    type: 'multi-class',
    carClassIds: ['gt3-gen2', 'gt4'],
    region: 'Europe',
    tier: 'pro',
    description: 'Europe\'s premier GT racing series. Factory-backed GT3 teams battle for supremacy with GT4 providing intense support racing.',
    format: 'mixed',
    multiClass: true,
    seasonRounds: 10,
    prestige: 88,
    prizePool: 5000000,
    pointsSystemId: 'gt-sprint',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 3,
  },
  {
    id: 'gt3-sprint-series',
    name: 'GT3 Sprint Series',
    shortName: 'GT3 Sprint',
    type: 'continental',
    carClassIds: ['gt3-gen2'],
    region: 'Europe',
    tier: 'pro',
    description: 'Pure GT3 racing in sprint format. No multi-class complexity, just wheel-to-wheel GT3 action.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 82,
    prizePool: 3500000,
    pointsSystemId: 'gt-sprint',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 3,
  },
  {
    id: 'gt4-european-series',
    name: 'GT4 European Series',
    shortName: 'GT4 Europe',
    type: 'continental',
    carClassIds: ['gt4'],
    region: 'Europe',
    tier: 'semi-pro',
    description: 'The stepping stone to GT3. Competitive GT4 racing with factory support from major manufacturers.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 7,
    prestige: 65,
    prizePool: 1500000,
    pointsSystemId: 'gt-sprint',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 3,
  },
  {
    id: 'gt5-challenge',
    name: 'GT5 Challenge',
    shortName: 'GT5 Challenge',
    type: 'continental',
    carClassIds: ['gt5'],
    region: 'Europe',
    tier: 'amateur',
    description: 'Entry-level GT racing with affordable machinery. The perfect introduction to production-based racing.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 40,
    prizePool: 400000,
    pointsSystemId: 'entry-level',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 3,
  },
  {
    id: 'gt-america',
    name: 'GT America',
    shortName: 'GT America',
    type: 'continental',
    carClassIds: ['gt3-gen2', 'gt4'],
    region: 'Americas',
    tier: 'pro',
    description: 'North American GT racing series supporting IMSA events. GT3 and GT4 compete for class honors.',
    format: 'sprint',
    multiClass: true,
    seasonRounds: 8,
    prestige: 75,
    prizePool: 2000000,
    pointsSystemId: 'gt-sprint',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 3,
  },

  // ============================================
  // SPEC SERIES - PORSCHE
  // ============================================
  {
    id: 'carrera-cup-world',
    name: 'Porsche Carrera Cup World',
    shortName: 'Carrera Cup World',
    type: 'spec-series',
    carClassIds: ['carrera-cup'],
    region: 'Global',
    tier: 'semi-pro',
    description: 'The global Porsche one-make series. Identical 911 GT3 Cup cars ensure pure driver competition.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 10,
    prestige: 72,
    prizePool: 2500000,
    manufacturer: 'Porsche',
    pointsSystemId: 'carrera-cup',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },
  {
    id: 'carrera-cup-brasil',
    name: 'Porsche Carrera Cup Brasil',
    shortName: 'Carrera Cup Brasil',
    type: 'spec-series',
    carClassIds: ['carrera-cup-brasil'],
    region: 'Brazil',
    tier: 'semi-pro',
    description: 'Brazil\'s premier Porsche one-make championship. Highly competitive racing at iconic Brazilian circuits.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 68,
    prizePool: 1800000,
    manufacturer: 'Porsche',
    pointsSystemId: 'carrera-cup',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },
  {
    id: 'porsche-supercup',
    name: 'Porsche Mobil 1 Supercup',
    shortName: 'Supercup',
    type: 'spec-series',
    carClassIds: ['carrera-cup'],
    region: 'Global',
    tier: 'pro',
    description: 'The most prestigious Porsche one-make series, racing as support to Formula 1 at Grand Prix weekends.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 85,
    prizePool: 3000000,
    manufacturer: 'Porsche',
    pointsSystemId: 'carrera-cup',
    seriesCategory: 'spec-series',
    maxTeamCars: 2,
  },

  // ============================================
  // SPEC SERIES - LAMBORGHINI
  // ============================================
  {
    id: 'super-trofeo-europe',
    name: 'Lamborghini Super Trofeo Europe',
    shortName: 'Super Trofeo EU',
    type: 'spec-series',
    carClassIds: ['super-trofeo'],
    region: 'Europe',
    tier: 'semi-pro',
    description: 'Europe\'s Lamborghini one-make series featuring the Huracán Super Trofeo EVO2.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 70,
    prizePool: 2000000,
    manufacturer: 'Lamborghini',
    pointsSystemId: 'super-trofeo',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },
  {
    id: 'super-trofeo-world',
    name: 'Lamborghini Super Trofeo World Finals',
    shortName: 'Super Trofeo Finals',
    type: 'spec-series',
    carClassIds: ['super-trofeo'],
    region: 'Global',
    tier: 'semi-pro',
    description: 'The annual showdown bringing together Lamborghini champions from all regional series.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 1,
    prestige: 78,
    prizePool: 1500000,
    manufacturer: 'Lamborghini',
    pointsSystemId: 'super-trofeo',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },

  // ============================================
  // SPEC SERIES - CATERHAM
  // ============================================
  {
    id: 'caterham-academy',
    name: 'Caterham Academy Championship',
    shortName: 'Caterham Academy',
    type: 'spec-series',
    carClassIds: ['caterham-academy'],
    region: 'Europe',
    tier: 'entry',
    description: 'The ultimate entry point into motorsport. Learn to race in identical Caterham Sevens.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 7,
    prestige: 25,
    prizePool: 50000,
    manufacturer: 'Caterham',
    pointsSystemId: 'caterham',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },
  {
    id: 'caterham-superlight',
    name: 'Caterham Superlight Championship',
    shortName: 'Superlight',
    type: 'spec-series',
    carClassIds: ['caterham-superlight'],
    region: 'Europe',
    tier: 'amateur',
    description: 'Step up from Academy with more powerful Superlight R300 Caterhams.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 7,
    prestige: 35,
    prizePool: 100000,
    manufacturer: 'Caterham',
    pointsSystemId: 'caterham',
    seriesCategory: 'spec-series',
    maxTeamCars: 4,
  },
  {
    id: 'caterham-supersport',
    name: 'Caterham Supersport Championship',
    shortName: 'Supersport',
    type: 'spec-series',
    carClassIds: ['caterham-supersport'],
    region: 'Europe',
    tier: 'amateur',
    description: 'The intermediate Caterham series with Supersport R400 machinery.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 7,
    prestige: 40,
    prizePool: 120000,
    manufacturer: 'Caterham',
    pointsSystemId: 'caterham',
    seriesCategory: 'spec-series',
    maxTeamCars: 4,
  },
  {
    id: 'caterham-620r',
    name: 'Caterham 620R Championship',
    shortName: '620R Championship',
    type: 'spec-series',
    carClassIds: ['caterham-620r'],
    region: 'Europe',
    tier: 'semi-pro',
    description: 'The pinnacle of Caterham racing with the ferocious 620R. Raw speed and skill required.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 7,
    prestige: 55,
    prizePool: 250000,
    manufacturer: 'Caterham',
    pointsSystemId: 'caterham',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },

  // ============================================
  // SPEC SERIES - GINETTA
  // ============================================
  {
    id: 'ginetta-g40-cup',
    name: 'Ginetta G40 Cup',
    shortName: 'G40 Cup',
    type: 'spec-series',
    carClassIds: ['g40-cup'],
    region: 'Europe',
    tier: 'entry',
    description: 'Affordable entry-level racing in the lightweight Ginetta G40. The British motorsport ladder starts here.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 30,
    prizePool: 75000,
    manufacturer: 'Ginetta',
    pointsSystemId: 'ginetta',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },
  {
    id: 'ginetta-g55-supercup',
    name: 'Ginetta G55 Supercup',
    shortName: 'G55 Supercup',
    type: 'spec-series',
    carClassIds: ['g55-supercup'],
    region: 'Europe',
    tier: 'amateur',
    description: 'The premier Ginetta series featuring the GT4-spec G55. Competitive pro-am format.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 48,
    prizePool: 200000,
    manufacturer: 'Ginetta',
    pointsSystemId: 'ginetta',
    seriesCategory: 'spec-series',
    maxTeamCars: 3,
  },

  // ============================================
  // SPEC SERIES - OTHER
  // ============================================
  {
    id: 'mini-challenge',
    name: 'MINI Challenge',
    shortName: 'MINI Challenge',
    type: 'spec-series',
    carClassIds: ['mini-challenge'],
    region: 'Europe',
    tier: 'entry',
    description: 'Close racing in identical MINI Cooper JCWs. Front-wheel drive fun at its best.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 28,
    prizePool: 60000,
    manufacturer: 'MINI',
    pointsSystemId: 'mini-challenge',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },

  // ============================================
  // NATIONAL CHAMPIONSHIPS - BRAZIL
  // ============================================
  {
    id: 'stock-car-brasil',
    name: 'Stock Car Pro Series',
    shortName: 'Stock Car Brasil',
    type: 'national',
    carClassIds: ['stock-car-2024'],
    region: 'Brazil',
    tier: 'pro',
    description: 'Brazil\'s premier touring car championship. Intense competition with factory backing from Chevrolet and Toyota.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 12,
    prestige: 85,
    prizePool: 6000000,
    pointsSystemId: 'stock-car-brasil',
    seriesCategory: 'touring',
    maxTeamCars: 2,
  },
  {
    id: 'copa-truck',
    name: 'Copa Truck Brasil',
    shortName: 'Copa Truck',
    type: 'national',
    carClassIds: ['copa-truck'],
    region: 'Brazil',
    tier: 'semi-pro',
    description: 'Big rig racing Brazilian style. Massive trucks battle at high speeds on proper racing circuits.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 58,
    prizePool: 1500000,
    pointsSystemId: 'copa-truck',
    seriesCategory: 'touring',
    maxTeamCars: 2,
  },
  {
    id: 'sprint-race-brasil',
    name: 'Sprint Race Brasil',
    shortName: 'Sprint Race',
    type: 'national',
    carClassIds: ['sprint-race'],
    region: 'Brazil',
    tier: 'semi-pro',
    description: 'Toyota Corolla one-make racing in Brazil. Close competition and manufacturer support.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 45,
    prizePool: 500000,
    pointsSystemId: 'stock-car-brasil',
    seriesCategory: 'touring',
    maxTeamCars: 2,
  },
  {
    id: 'copa-fusca',
    name: 'Copa Fusca Brasil',
    shortName: 'Copa Fusca',
    type: 'spec-series',
    carClassIds: ['copa-fusca'],
    region: 'Brazil',
    tier: 'entry',
    description: 'Classic VW Beetle racing! Affordable entry into Brazilian motorsport with iconic machinery.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 22,
    prizePool: 30000,
    manufacturer: 'Volkswagen',
    pointsSystemId: 'entry-level',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },
  {
    id: 'copa-uno',
    name: 'Copa Uno Brasil',
    shortName: 'Copa Uno',
    type: 'spec-series',
    carClassIds: ['copa-uno'],
    region: 'Brazil',
    tier: 'entry',
    description: 'Fiat Uno one-make racing. The accessible path to Brazilian motorsport.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 20,
    prizePool: 25000,
    manufacturer: 'Fiat',
    pointsSystemId: 'entry-level',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },

  // ============================================
  // NATIONAL CHAMPIONSHIPS - AUSTRALIA
  // ============================================
  {
    id: 'supercars-championship',
    name: 'Repco Supercars Championship',
    shortName: 'Supercars',
    type: 'national',
    carClassIds: ['supercars'],
    region: 'Australia',
    tier: 'elite',
    description: 'Australia\'s premier motorsport category. Ford Mustangs battle Chevrolet Camaros in the ultimate V8 showdown.',
    format: 'mixed',
    multiClass: false,
    seasonRounds: 13,
    prestige: 92,
    prizePool: 8000000,
    pointsSystemId: 'supercars',
    seriesCategory: 'touring',
    maxTeamCars: 2,
  },
  {
    id: 'super-v8',
    name: 'Super V8 Championship',
    shortName: 'Super V8',
    type: 'national',
    carClassIds: ['super-v8'],
    region: 'Australia',
    tier: 'elite',
    description: 'Classic V8 Supercar racing with traditional Holden and Ford machinery.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 10,
    prestige: 88,
    prizePool: 5000000,
    pointsSystemId: 'supercars',
    seriesCategory: 'touring',
    maxTeamCars: 2,
  },
  {
    id: 'aussie-racing-cars',
    name: 'Aussie Racing Cars Championship',
    shortName: 'Aussie Racing',
    type: 'national',
    carClassIds: ['arc-camaro'],
    region: 'Australia',
    tier: 'entry',
    description: '5/8 scale replica touring cars providing affordable, close racing. The fun entry to Australian motorsport.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 25,
    prizePool: 50000,
    pointsSystemId: 'entry-level',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },

  // ============================================
  // FORMULA CHAMPIONSHIPS
  // ============================================
  {
    id: 'formula-vee',
    name: 'Formula Vee Championship',
    shortName: 'Formula Vee',
    type: 'spec-series',
    carClassIds: ['formula-vee'],
    region: 'Global',
    tier: 'entry',
    description: 'The classic entry point to single-seater racing. VW-powered simplicity breeds pure racing.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 28,
    prizePool: 40000,
    pointsSystemId: 'entry-level',
    seriesCategory: 'formula',
    maxTeamCars: 4,
  },
  {
    id: 'formula-trainer',
    name: 'Formula Trainer Series',
    shortName: 'F-Trainer',
    type: 'spec-series',
    carClassIds: ['formula-trainer'],
    region: 'Global',
    tier: 'amateur',
    description: 'Development series for aspiring single-seater racers. Modern spec formula car competition.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 38,
    prizePool: 150000,
    pointsSystemId: 'entry-level',
    seriesCategory: 'formula',
    maxTeamCars: 3,
  },
  {
    id: 'formula-3',
    name: 'FIA Formula 3 Championship',
    shortName: 'F3',
    type: 'international',
    carClassIds: ['formula-3'],
    region: 'Europe',
    tier: 'semi-pro',
    description: 'The final step before Formula 2. Top junior drivers battle for F1 attention at GP weekends.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 9,
    prestige: 80,
    prizePool: 3000000,
    pointsSystemId: 'formula',
    seriesCategory: 'formula',
    maxTeamCars: 2,
  },
  {
    id: 'formula-inter',
    name: 'Formula Inter Championship',
    shortName: 'F-Inter',
    type: 'national',
    carClassIds: ['formula-inter'],
    region: 'Brazil',
    tier: 'semi-pro',
    description: 'Brazilian intermediate single-seater series. The path to Stock Car Brasil.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 8,
    prestige: 52,
    prizePool: 400000,
    pointsSystemId: 'formula',
    seriesCategory: 'formula',
    maxTeamCars: 2,
  },
  {
    id: 'formula-reiza',
    name: 'Formula Reiza Series',
    shortName: 'F-Reiza',
    type: 'national',
    carClassIds: ['formula-reiza'],
    region: 'Brazil',
    tier: 'pro',
    description: 'Brazil\'s top single-seater category. High-powered formula cars at legendary Brazilian circuits.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 10,
    prestige: 75,
    prizePool: 2500000,
    pointsSystemId: 'formula',
    seriesCategory: 'formula',
    maxTeamCars: 2,
  },
  {
    id: 'formula-usa',
    name: 'Formula USA Championship',
    shortName: 'F-USA',
    type: 'national',
    carClassIds: ['formula-usa-2023'],
    region: 'USA',
    tier: 'pro',
    description: 'North American high-level single-seater racing with IndyCar-style machinery.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 10,
    prestige: 78,
    prizePool: 3000000,
    pointsSystemId: 'formula',
    seriesCategory: 'formula',
    maxTeamCars: 2,
  },
  {
    id: 'formula-ultimate',
    name: 'Formula Ultimate Championship',
    shortName: 'F-Ultimate',
    type: 'international',
    carClassIds: ['formula-ultimate-gen2'],
    region: 'Global',
    tier: 'pinnacle',
    description: 'The pinnacle of single-seater racing. Cutting-edge hybrid formula cars at world-class venues.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 23,
    prestige: 100,
    prizePool: 750000000,
    pointsSystemId: 'standard',
    seriesCategory: 'formula-f1',
    maxTeamCars: 2,
  },

  // ============================================
  // HISTORIC / INVITATIONAL CHAMPIONSHIPS
  // ============================================
  {
    id: 'hypercar-trackday',
    name: 'Hypercar Track Day Series',
    shortName: 'Hypercar TD',
    type: 'historic',
    carClassIds: ['hypercar'],
    region: 'Global',
    tier: 'elite',
    description: 'Exclusive track day events for the world\'s most exotic hypercars. Brabham BT62, Lamborghini Essenza, and more.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 88,
    prizePool: 500000,
    historicEra: 'Modern',
    pointsSystemId: 'historic',
    seriesCategory: 'gt-sportscar',
    maxTeamCars: 2,
  },
  {
    id: 'gte-legends',
    name: 'GTE Legends Trophy',
    shortName: 'GTE Legends',
    type: 'historic',
    carClassIds: ['gte'],
    region: 'Global',
    tier: 'pro',
    description: 'Celebration of the GTE era. Classic Porsche RSR, BMW M8 GTE, and Aston Martin Vantage GTE compete once more.',
    format: 'endurance',
    multiClass: false,
    seasonRounds: 4,
    prestige: 75,
    prizePool: 1000000,
    historicEra: '2020s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'dpi-invitational',
    name: 'DPi Invitational Series',
    shortName: 'DPi Invite',
    type: 'historic',
    carClassIds: ['dpi'],
    region: 'Americas',
    tier: 'elite',
    description: 'Tribute to IMSA\'s DPi era. Acura ARX-05, Cadillac DPi-V.R, and Mazda RT24-P in historic competition.',
    format: 'endurance',
    multiClass: false,
    seasonRounds: 4,
    prestige: 82,
    prizePool: 1500000,
    historicEra: '2020s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'group-c-revival',
    name: 'Group C Revival Series',
    shortName: 'Group C',
    type: 'historic',
    carClassIds: ['group-c'],
    region: 'Global',
    tier: 'elite',
    description: 'Return of the legendary Group C prototypes. Porsche 962, Jaguar XJR, and Mercedes C9 thunder again.',
    format: 'endurance',
    multiClass: false,
    seasonRounds: 4,
    prestige: 90,
    prizePool: 2000000,
    historicEra: '1980s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'group-a-historic',
    name: 'Group A Historic Trophy',
    shortName: 'Group A',
    type: 'historic',
    carClassIds: ['group-a'],
    region: 'Global',
    tier: 'pro',
    description: 'Touring car legends reborn. DTM Fords, Sierra Cosworths, and BMW M3s in authentic Group A racing.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 5,
    prestige: 72,
    prizePool: 800000,
    historicEra: '1990s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'gt1-championship',
    name: 'GT1 FIA Championship',
    shortName: 'GT1',
    type: 'historic',
    carClassIds: ['gt1'],
    region: 'Global',
    tier: 'elite',
    description: 'The golden age of GT racing returns. McLaren F1 GTR, Porsche 911 GT1, and Mercedes CLK-GTR.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 5,
    prestige: 92,
    prizePool: 3000000,
    historicEra: 'Late 90s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'formula-classic-86',
    name: 'Formula Classic \'86 Revival',
    shortName: 'F-Classic 86',
    type: 'historic',
    carClassIds: ['formula-classic-gen1'],
    region: 'Global',
    tier: 'pro',
    description: 'Relive the turbo era of Formula 1. 1986-spec cars with incredible power and drama.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 78,
    prizePool: 1200000,
    historicEra: '1986',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'formula-classic-88',
    name: 'Formula Classic \'88 Masters',
    shortName: 'F-Classic 88',
    type: 'historic',
    carClassIds: ['formula-classic-gen2'],
    region: 'Global',
    tier: 'pro',
    description: 'The naturally-aspirated era begins. 1988-spec Formula 1 cars in historic competition.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 80,
    prizePool: 1400000,
    historicEra: '1988',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'formula-classic-90',
    name: 'Formula Classic \'90 Challenge',
    shortName: 'F-Classic 90',
    type: 'historic',
    carClassIds: ['formula-classic-gen3'],
    region: 'Global',
    tier: 'pro',
    description: 'The start of the modern F1 era. 1990-spec cars with semi-automatic gearboxes.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 82,
    prizePool: 1500000,
    historicEra: '1990',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },
  {
    id: 'tc-legends-brasil',
    name: 'TC Legends Brasil',
    shortName: 'TC Legends',
    type: 'historic',
    carClassIds: ['tc60s', 'tc70s'],
    region: 'Brazil',
    tier: 'amateur',
    description: 'Brazilian touring car history. Classic Opalas and DKWs from the golden age of Brazilian motorsport.',
    format: 'sprint',
    multiClass: true,
    seasonRounds: 5,
    prestige: 45,
    prizePool: 150000,
    historicEra: '1960-70s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 3,
  },
  {
    id: 'opala-historic',
    name: 'Opala Historic Cup',
    shortName: 'Opala Cup',
    type: 'historic',
    carClassIds: ['opala-79', 'opala-86'],
    region: 'Brazil',
    tier: 'amateur',
    description: 'Celebration of the Chevrolet Opala. Brazil\'s iconic muscle car in period-correct racing.',
    format: 'sprint',
    multiClass: true,
    seasonRounds: 5,
    prestige: 42,
    prizePool: 120000,
    historicEra: '1980s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 3,
  },
  {
    id: 'formula-vintage',
    name: 'Formula Vintage Festival',
    shortName: 'F-Vintage',
    type: 'historic',
    carClassIds: ['formula-vintage-gen1'],
    region: 'Global',
    tier: 'semi-pro',
    description: 'Classic 1970s Formula 1 machinery. Ground effect and wings arrive in this pivotal era.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 5,
    prestige: 68,
    prizePool: 800000,
    historicEra: '1970s',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 2,
  },

  // ============================================
  // BRAZILIAN CLASSICS (UNIQUE AMS2 CONTENT)
  // ============================================
  {
    id: 'copa-classic-brasil',
    name: 'Copa Classic Brasil',
    shortName: 'Copa Classic',
    type: 'historic',
    carClassIds: ['copa-classic-b'],
    region: 'Brazil',
    tier: 'amateur',
    description: 'Classic Brazilian touring cars from multiple eras competing together.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 38,
    prizePool: 80000,
    historicEra: 'Various',
    pointsSystemId: 'historic',
    seriesCategory: 'historic',
    maxTeamCars: 3,
  },
  {
    id: 'copa-classic-fusca-liga',
    name: 'Copa Classic Fusca Liga',
    shortName: 'Fusca Liga',
    type: 'historic',
    carClassIds: ['copa-classic-fl'],
    region: 'Brazil',
    tier: 'amateur',
    description: 'Classic VW Beetle racing with period-correct machinery. Affordable historic racing.',
    format: 'sprint',
    multiClass: false,
    seasonRounds: 6,
    prestige: 32,
    prizePool: 50000,
    historicEra: 'Various',
    pointsSystemId: 'historic',
    seriesCategory: 'entry-level',
    maxTeamCars: 4,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all championships
 */
export function getAllChampionships(): Championship[] {
  return CHAMPIONSHIPS;
}

/**
 * Get championship by ID
 */
export function getChampionshipById(id: string): Championship | undefined {
  return CHAMPIONSHIPS.find(c => c.id === id);
}

/**
 * Get championships by type
 */
export function getChampionshipsByType(type: ChampionshipType): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.type === type);
}

/**
 * Get championships by region
 */
export function getChampionshipsByRegion(region: ChampionshipRegion): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.region === region);
}

/**
 * Get championships by tier
 */
export function getChampionshipsByTier(tier: TeamTier): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.tier === tier);
}

/**
 * Get championships that use a specific car class
 */
export function getChampionshipsForClass(classId: string): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.carClassIds.includes(classId));
}

/**
 * Get current (non-historic) championships
 */
export function getCurrentChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.type !== 'historic');
}

/**
 * Get historic championships
 */
export function getHistoricChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.type === 'historic');
}

/**
 * Get multi-class championships
 */
export function getMultiClassChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.multiClass);
}

/**
 * Get spec series championships
 */
export function getSpecSeriesChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.type === 'spec-series');
}

/**
 * Get championships by manufacturer (for spec series)
 */
export function getChampionshipsByManufacturer(manufacturer: string): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.manufacturer?.toLowerCase() === manufacturer.toLowerCase());
}

/**
 * Get class status
 */
export function getClassStatus(classId: string): ClassStatus {
  return CLASS_STATUS[classId] || 'current';
}

/**
 * Check if a class is current/active
 */
export function isCurrentClass(classId: string): boolean {
  const status = getClassStatus(classId);
  return status === 'current' || status === 'limited';
}

/**
 * Get championships sorted by prestige
 */
export function getChampionshipsByPrestige(descending = true): Championship[] {
  return [...CHAMPIONSHIPS].sort((a, b) => 
    descending ? b.prestige - a.prestige : a.prestige - b.prestige
  );
}

/**
 * Get championships grouped by type
 */
export function getChampionshipsGroupedByType(): Record<ChampionshipType, Championship[]> {
  const grouped: Record<ChampionshipType, Championship[]> = {
    'spec-series': [],
    'national': [],
    'continental': [],
    'international': [],
    'historic': [],
    'multi-class': [],
  };
  
  CHAMPIONSHIPS.forEach(c => {
    grouped[c.type].push(c);
  });
  
  return grouped;
}

/**
 * Get entry-level championships (for new careers)
 */
export function getEntryLevelChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.tier === 'entry' || c.tier === 'amateur');
}

/**
 * Get pinnacle championships (end-game content)
 */
export function getPinnacleChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter(c => c.tier === 'pinnacle' || c.tier === 'elite');
}

/**
 * Get maximum team cars allowed for a series
 * Returns the series-specific limit or default of 2
 */
export function getSeriesMaxTeamCars(seriesId: string): number {
  const championship = CHAMPIONSHIPS.find(c => c.id === seriesId);
  return championship?.maxTeamCars ?? 2;
}









