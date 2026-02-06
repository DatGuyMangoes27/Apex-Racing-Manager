/**
 * AMS2 Racing Programs Database
 * 
 * Racing Programs represent a manufacturer's or team's participation across
 * multiple series/championships. For example, BMW M Motorsport's LMDh program
 * includes entries in both IMSA (#24, #25) and WEC (#42, #43).
 * 
 * Program Types:
 * - works: Factory-run team entries (highest tier)
 * - factory-supported: Independent team with official manufacturer backing
 * - customer: Independent team buying/leasing equipment
 * - independent: Not affiliated with any manufacturer
 * - spec-series: Spec series where all cars are the same
 */

export type ProgramType = 'works' | 'factory-supported' | 'customer' | 'independent' | 'spec-series';

export interface RacingProgram {
  id: string;
  name: string;
  shortName: string;
  manufacturerId: string | null;  // null for independent teams
  programType: ProgramType;
  /** AMS2 team entry IDs that belong to this program */
  teamEntryIds: string[];
  /** Car class IDs this program competes in */
  seriesIds: string[];
  headquarters: string;
  color: string;
  description: string;
  /** Prestige modifier (1.0 = standard, >1 = more prestigious) */
  prestigeMultiplier: number;
  /** Salary multiplier for contracts */
  salaryMultiplier: number;
}

/**
 * Racing Programs in AMS2
 * Groups related team entries across different series
 */
export const AMS2_RACING_PROGRAMS: RacingProgram[] = [
  // ============================================
  // BMW PROGRAMS
  // ============================================
  {
    id: 'bmw-m-motorsport-lmdh',
    name: 'BMW M Motorsport LMDh',
    shortName: 'BMW M',
    manufacturerId: 'bmw',
    programType: 'works',
    teamEntryIds: [
      'lmdh-bmw-m-hybrid-v8--24--imsa-2024-',
      'lmdh-bmw-m-hybrid-v8--25--imsa-2024-',
      'lmdh-bmw-m-hybrid-v8',
    ],
    seriesIds: ['lmdh'],
    headquarters: 'Munich, Germany',
    color: '#0066B1',
    description: 'BMW M Motorsport factory LMDh program with the M Hybrid V8. Competing in IMSA (RLL) and WEC (WRT partnership).',
    prestigeMultiplier: 1.3,
    salaryMultiplier: 1.4,
  },
  {
    id: 'bmw-m-gt',
    name: 'BMW M Customer Racing',
    shortName: 'BMW M',
    manufacturerId: 'bmw',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-bmw',
      'gt3-gen2-bmw',
      'gt4-bmw',
    ],
    seriesIds: ['gt3', 'gt3-gen2', 'gt4'],
    headquarters: 'Munich, Germany',
    color: '#0066B1',
    description: 'BMW M Customer Racing GT program. Factory-supported teams running M4 GT3 and M4 GT4 worldwide.',
    prestigeMultiplier: 1.1,
    salaryMultiplier: 1.0,
  },

  // ============================================
  // PORSCHE PROGRAMS
  // ============================================
  {
    id: 'porsche-penske-motorsport',
    name: 'Porsche Penske Motorsport',
    shortName: 'PPM',
    manufacturerId: 'porsche',
    programType: 'works',
    teamEntryIds: [
      'lmdh-porsche-963--5--imsa-2024-',
      'lmdh-porsche-963--6--imsa-2024-',
      'lmdh-porsche-963--7--imsa-2024-',
      'lmdh-porsche-963--85--imsa-2024-',
    ],
    seriesIds: ['lmdh'],
    headquarters: 'Mooresville, USA / Weissach, Germany',
    color: '#D5001C',
    description: 'Porsche Penske Motorsport factory LMDh program. Joint venture running Porsche 963 in IMSA and WEC.',
    prestigeMultiplier: 1.35,
    salaryMultiplier: 1.5,
  },
  {
    id: 'porsche-gt',
    name: 'Porsche Motorsport GT',
    shortName: 'POR GT',
    manufacturerId: 'porsche',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-porsche',
      'gt3-gen2-porsche',
      'gt4-porsche-cayman-gt4-cs-mr',
      'gte-porsche-911-rsr-gte',
    ],
    seriesIds: ['gt3', 'gt3-gen2', 'gt4', 'gte'],
    headquarters: 'Weissach, Germany',
    color: '#D5001C',
    description: 'Porsche factory-supported GT program. 911 GT3 R and Cayman GT4 competing worldwide.',
    prestigeMultiplier: 1.15,
    salaryMultiplier: 1.1,
  },
  {
    id: 'porsche-carrera-cup',
    name: 'Porsche Carrera Cup',
    shortName: 'PCC',
    manufacturerId: 'porsche',
    programType: 'spec-series',
    teamEntryIds: [
      'carrera-cup-porsche',
      'carrera-cup-brasil-porsche',
    ],
    seriesIds: ['carrera-cup', 'carrera-cup-brasil'],
    headquarters: 'Weissach, Germany',
    color: '#D5001C',
    description: 'Porsche Carrera Cup spec series. Single-make championship using 911 GT3 Cup cars.',
    prestigeMultiplier: 0.9,
    salaryMultiplier: 0.7,
  },

  // ============================================
  // MERCEDES-AMG PROGRAMS
  // ============================================
  {
    id: 'mercedes-amg-gt',
    name: 'Mercedes-AMG Customer Racing',
    shortName: 'AMG',
    manufacturerId: 'mercedes-amg',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-mercedes-amg',
      'gt3-gen2-mercedes-amg',
      'gt4-mercedes-amg',
    ],
    seriesIds: ['gt3', 'gt3-gen2', 'gt4'],
    headquarters: 'Affalterbach, Germany',
    color: '#00D2BE',
    description: 'Mercedes-AMG Customer Racing program. GT3 and GT4 teams worldwide with factory support.',
    prestigeMultiplier: 1.1,
    salaryMultiplier: 1.0,
  },

  // ============================================
  // AUDI PROGRAMS
  // ============================================
  {
    id: 'audi-sport-gt',
    name: 'Audi Sport Customer Racing',
    shortName: 'AUD',
    manufacturerId: 'audi',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-audi',
      'gt3-gen2-audi',
      'gt4-audi',
    ],
    seriesIds: ['gt3', 'gt3-gen2', 'gt4'],
    headquarters: 'Neuburg, Germany',
    color: '#BB0A30',
    description: 'Audi Sport customer racing program. R8 LMS GT3 and GT4 competing globally.',
    prestigeMultiplier: 1.1,
    salaryMultiplier: 1.0,
  },

  // ============================================
  // LAMBORGHINI PROGRAMS
  // ============================================
  {
    id: 'lamborghini-squadra-corse-lmdh',
    name: 'Lamborghini Squadra Corse LMDh',
    shortName: 'LAM',
    manufacturerId: 'lamborghini',
    programType: 'works',
    teamEntryIds: [
      'lmdh-lamborghini',
    ],
    seriesIds: ['lmdh'],
    headquarters: "Sant'Agata Bolognese, Italy",
    color: '#DDB321',
    description: 'Lamborghini Squadra Corse factory LMDh program with SC63.',
    prestigeMultiplier: 1.2,
    salaryMultiplier: 1.2,
  },
  {
    id: 'lamborghini-gt',
    name: 'Lamborghini Squadra Corse GT',
    shortName: 'LAM GT',
    manufacturerId: 'lamborghini',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-gen2-lamborghini',
      'super-trofeo-lamborghini',
    ],
    seriesIds: ['gt3-gen2', 'super-trofeo'],
    headquarters: "Sant'Agata Bolognese, Italy",
    color: '#DDB321',
    description: 'Lamborghini Squadra Corse GT and Super Trofeo program.',
    prestigeMultiplier: 1.0,
    salaryMultiplier: 0.9,
  },

  // ============================================
  // CADILLAC PROGRAMS
  // ============================================
  {
    id: 'cadillac-racing',
    name: 'Cadillac Racing',
    shortName: 'CAD',
    manufacturerId: 'cadillac',
    programType: 'works',
    teamEntryIds: [
      'lmdh-cadillac-v-series-r--01--imsa-2024-',
      'lmdh-cadillac-v-series-r--31--imsa-2024-',
      'lmdh-cadillac-v-series-r',
      'dpi-cadillac-dpi',
    ],
    seriesIds: ['lmdh', 'dpi'],
    headquarters: 'Detroit, USA',
    color: '#C4A747',
    description: 'Cadillac Racing factory prototype program. V-Series.R LMDh in IMSA and WEC.',
    prestigeMultiplier: 1.25,
    salaryMultiplier: 1.3,
  },

  // ============================================
  // ALPINE PROGRAMS
  // ============================================
  {
    id: 'alpine-endurance',
    name: 'Alpine Endurance Team',
    shortName: 'ALP',
    manufacturerId: 'alpine',
    programType: 'works',
    teamEntryIds: [
      'lmdh-alpine',
      'gt4-alpine',
    ],
    seriesIds: ['lmdh', 'gt4'],
    headquarters: 'Dieppe, France',
    color: '#0090FF',
    description: 'Alpine factory endurance program with A424 LMDh and A110 GT4.',
    prestigeMultiplier: 1.15,
    salaryMultiplier: 1.1,
  },

  // ============================================
  // ASTON MARTIN PROGRAMS
  // ============================================
  {
    id: 'aston-martin-racing',
    name: 'Aston Martin Racing',
    shortName: 'AMR',
    manufacturerId: 'aston-martin',
    programType: 'works',
    teamEntryIds: [
      'lmdh-aston-martin',
      'gt3-gen2-amr',
      'gt4-amr',
    ],
    seriesIds: ['lmdh', 'gt3-gen2', 'gt4'],
    headquarters: 'Gaydon, UK',
    color: '#006F62',
    description: 'Aston Martin Racing factory program. Valkyrie LMH in WEC/IMSA, Vantage GT3 and GT4.',
    prestigeMultiplier: 1.2,
    salaryMultiplier: 1.15,
  },

  // ============================================
  // MCLAREN PROGRAMS
  // ============================================
  {
    id: 'mclaren-gt',
    name: 'McLaren Customer Racing',
    shortName: 'MCL',
    manufacturerId: 'mclaren',
    programType: 'customer',
    teamEntryIds: [
      'gt3-mclaren',
      'gt3-gen2-mclaren',
      'gt4-mclaren',
    ],
    seriesIds: ['gt3', 'gt3-gen2', 'gt4'],
    headquarters: 'Woking, UK',
    color: '#FF8700',
    description: 'McLaren customer racing program. 720S GT3 and Artura GT4 in customer hands.',
    prestigeMultiplier: 1.0,
    salaryMultiplier: 0.9,
  },

  // ============================================
  // NISSAN PROGRAMS
  // ============================================
  {
    id: 'nissan-nismo-gt',
    name: 'Nissan NISMO',
    shortName: 'NIS',
    manufacturerId: 'nissan',
    programType: 'factory-supported',
    teamEntryIds: [
      'gt3-nissan',
    ],
    seriesIds: ['gt3'],
    headquarters: 'Yokohama, Japan',
    color: '#C3002F',
    description: 'Nissan NISMO factory-supported GT program. GT-R GT3 competing worldwide.',
    prestigeMultiplier: 1.0,
    salaryMultiplier: 0.95,
  },

  // ============================================
  // GINETTA PROGRAMS
  // ============================================
  {
    id: 'ginetta-factory',
    name: 'Ginetta Cars',
    shortName: 'GIN',
    manufacturerId: 'ginetta',
    programType: 'works',
    teamEntryIds: [
      'gt4-ginetta',
      'lmp3-ginetta',
      'ginetta-g55-supercup-ginetta',
      'ginetta-g40-cup-ginetta-g40-cup',
    ],
    seriesIds: ['gt4', 'lmp3', 'ginetta-g55', 'ginetta-g40'],
    headquarters: 'Leeds, UK',
    color: '#1D428A',
    description: 'Ginetta factory racing program. GT4, LMP3, and spec series championships.',
    prestigeMultiplier: 0.85,
    salaryMultiplier: 0.75,
  },

  // ============================================
  // CATERHAM PROGRAMS
  // ============================================
  {
    id: 'caterham-motorsport',
    name: 'Caterham Motorsport',
    shortName: 'CAT',
    manufacturerId: 'caterham',
    programType: 'spec-series',
    teamEntryIds: [
      'caterham-academy-caterham-academy',
      'caterham-superlight-caterham-superlight',
      'caterham-supersport-caterham-supersport',
      'caterham-620r-caterham-620r',
    ],
    seriesIds: ['caterham-academy', 'caterham-superlight', 'caterham-supersport', 'caterham-620r'],
    headquarters: 'Crawley, UK',
    color: '#006400',
    description: 'Caterham Motorsport spec series ladder. From Academy to 620R championship.',
    prestigeMultiplier: 0.7,
    salaryMultiplier: 0.5,
  },

  // ============================================
  // INDEPENDENT/CUSTOMER EXAMPLES
  // ============================================
  {
    id: 'stock-car-brasil',
    name: 'Stock Car Brasil',
    shortName: 'SCB',
    manufacturerId: null,
    programType: 'independent',
    teamEntryIds: [], // Teams are individual entries, not manufacturer-based
    seriesIds: ['stock-car-2024', 'stock-car-2023', 'stock-car-2022'],
    headquarters: 'São Paulo, Brazil',
    color: '#00A651',
    description: 'Brazilian Stock Car Pro Series. Independent teams with spec Cruze cars.',
    prestigeMultiplier: 1.0,
    salaryMultiplier: 1.0,
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get a racing program by ID
 */
export function getProgramById(id: string): RacingProgram | undefined {
  return AMS2_RACING_PROGRAMS.find(p => p.id === id);
}

/**
 * Get all programs for a manufacturer
 */
export function getProgramsByManufacturer(manufacturerId: string): RacingProgram[] {
  return AMS2_RACING_PROGRAMS.filter(p => p.manufacturerId === manufacturerId);
}

/**
 * Get all programs competing in a series
 */
export function getProgramsInSeries(seriesId: string): RacingProgram[] {
  return AMS2_RACING_PROGRAMS.filter(p => p.seriesIds.includes(seriesId));
}

/**
 * Get programs by type
 */
export function getProgramsByType(type: ProgramType): RacingProgram[] {
  return AMS2_RACING_PROGRAMS.filter(p => p.programType === type);
}

/**
 * Find the program that contains a specific team entry
 */
export function getProgramForTeamEntry(teamEntryId: string): RacingProgram | undefined {
  return AMS2_RACING_PROGRAMS.find(p => p.teamEntryIds.includes(teamEntryId));
}

/**
 * Get all works programs (highest tier)
 */
export function getWorksPrograms(): RacingProgram[] {
  return AMS2_RACING_PROGRAMS.filter(p => p.programType === 'works');
}

/**
 * Check if a team entry belongs to a works program
 */
export function isWorksTeamEntry(teamEntryId: string): boolean {
  const program = getProgramForTeamEntry(teamEntryId);
  return program?.programType === 'works';
}

/**
 * Get multi-series programs (programs that compete in more than one series)
 */
export function getMultiSeriesPrograms(): RacingProgram[] {
  return AMS2_RACING_PROGRAMS.filter(p => p.seriesIds.length > 1);
}










