/**
 * AMS2 Career Mode Teams Database
 * Realistic team names and attributes for each car class
 * 
 * Teams are organized by car class and have various attributes
 * that affect contract offers and career progression
 */

export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  budget: 'low' | 'medium' | 'high' | 'factory';
  prestige: number; // 1-100, affects reputation gain
  reputationRequired: number; // Minimum reputation to get a contract offer
  payRange: { min: number; max: number }; // Base pay per race ($)
  facilities: 'basic' | 'standard' | 'professional' | 'elite';
  colors: { primary: string; secondary: string };
  description?: string;
}

export interface ClassTeams {
  classId: string;
  className: string;
  teams: Team[];
}

export const TEAMS_BY_CLASS: ClassTeams[] = [
  // ============================================
  // KARTS
  // ============================================
  {
    classId: 'kart-4t-rental',
    className: 'Karting 4T Rental',
    teams: [
      { id: 'kart-academy', name: 'Kart Academy', shortName: 'KAC', country: 'Brazil', budget: 'low', prestige: 15, reputationRequired: 0, payRange: { min: 0, max: 0 }, facilities: 'basic', colors: { primary: '#2563eb', secondary: '#60a5fa' }, description: 'Entry-level karting school' },
      { id: 'speed-kart', name: 'Speed Kart Racing', shortName: 'SPK', country: 'Brazil', budget: 'low', prestige: 20, reputationRequired: 5, payRange: { min: 100, max: 300 }, facilities: 'basic', colors: { primary: '#dc2626', secondary: '#fca5a5' } },
      { id: 'junior-kart', name: 'Junior Kart Team', shortName: 'JKT', country: 'Brazil', budget: 'low', prestige: 18, reputationRequired: 3, payRange: { min: 50, max: 200 }, facilities: 'basic', colors: { primary: '#16a34a', secondary: '#86efac' } }
    ]
  },
  {
    classId: 'kart-125cc',
    className: 'Karting 2T 125cc',
    teams: [
      { id: 'birel-art', name: 'Birel ART Factory', shortName: 'BRL', country: 'Italy', budget: 'medium', prestige: 65, reputationRequired: 25, payRange: { min: 500, max: 1500 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'tony-kart', name: 'Tony Kart Racing', shortName: 'TKR', country: 'Italy', budget: 'high', prestige: 80, reputationRequired: 35, payRange: { min: 800, max: 2500 }, facilities: 'elite', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'crg-racing', name: 'CRG Racing Team', shortName: 'CRG', country: 'Italy', budget: 'medium', prestige: 70, reputationRequired: 30, payRange: { min: 600, max: 1800 }, facilities: 'professional', colors: { primary: '#f59e0b', secondary: '#1f2937' } },
      { id: 'kosmic-kart', name: 'Kosmic Kart', shortName: 'KOS', country: 'Italy', budget: 'medium', prestige: 60, reputationRequired: 20, payRange: { min: 400, max: 1200 }, facilities: 'standard', colors: { primary: '#3b82f6', secondary: '#fbbf24' } }
    ]
  },
  {
    classId: 'kart-shifter',
    className: 'Karting 2T Shifter',
    teams: [
      { id: 'praga-racing', name: 'Praga Racing', shortName: 'PRG', country: 'Czech Republic', budget: 'high', prestige: 75, reputationRequired: 40, payRange: { min: 1000, max: 3000 }, facilities: 'elite', colors: { primary: '#7c3aed', secondary: '#ffffff' } },
      { id: 'sodi-kart', name: 'Sodi Kart Factory', shortName: 'SOD', country: 'France', budget: 'medium', prestige: 68, reputationRequired: 35, payRange: { min: 700, max: 2200 }, facilities: 'professional', colors: { primary: '#0284c7', secondary: '#f59e0b' } }
    ]
  },
  {
    classId: 'superkart',
    className: 'Superkart',
    teams: [
      { id: 'anderson-racing', name: 'Anderson Racing', shortName: 'AND', country: 'UK', budget: 'medium', prestige: 70, reputationRequired: 40, payRange: { min: 2000, max: 5000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } },
      { id: 'pex-motorsport', name: 'PEX Motorsport', shortName: 'PEX', country: 'Netherlands', budget: 'high', prestige: 80, reputationRequired: 50, payRange: { min: 3000, max: 8000 }, facilities: 'elite', colors: { primary: '#f97316', secondary: '#1f2937' } }
    ]
  },

  // ============================================
  // FORMULA - Entry Level
  // ============================================
  {
    classId: 'formula-vee',
    className: 'Formula Vee',
    teams: [
      { id: 'fvee-brasil', name: 'FVee Brasil', shortName: 'FVB', country: 'Brazil', budget: 'low', prestige: 25, reputationRequired: 10, payRange: { min: 200, max: 800 }, facilities: 'basic', colors: { primary: '#16a34a', secondary: '#fbbf24' } },
      { id: 'racing-start', name: 'Racing Start Academy', shortName: 'RSA', country: 'Brazil', budget: 'low', prestige: 30, reputationRequired: 5, payRange: { min: 100, max: 500 }, facilities: 'basic', colors: { primary: '#2563eb', secondary: '#ffffff' } },
      { id: 'vee-masters', name: 'Vee Masters', shortName: 'VEM', country: 'Brazil', budget: 'medium', prestige: 40, reputationRequired: 15, payRange: { min: 400, max: 1200 }, facilities: 'standard', colors: { primary: '#dc2626', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'formula-trainer',
    className: 'Formula Trainer',
    teams: [
      { id: 'reiza-academy', name: 'Reiza Racing Academy', shortName: 'RRA', country: 'Brazil', budget: 'medium', prestige: 45, reputationRequired: 15, payRange: { min: 500, max: 1500 }, facilities: 'standard', colors: { primary: '#0891b2', secondary: '#fbbf24' } },
      { id: 'mp-motorsport', name: 'MP Motorsport Junior', shortName: 'MPJ', country: 'Netherlands', budget: 'medium', prestige: 55, reputationRequired: 20, payRange: { min: 800, max: 2000 }, facilities: 'professional', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'prema-junior', name: 'Prema Junior', shortName: 'PRJ', country: 'Italy', budget: 'high', prestige: 70, reputationRequired: 30, payRange: { min: 1200, max: 3500 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#ffffff' } }
    ]
  },
  {
    classId: 'formula-trainer-advanced',
    className: 'Formula Trainer Advanced',
    teams: [
      { id: 'art-academy', name: 'ART Grand Prix Academy', shortName: 'ART', country: 'France', budget: 'high', prestige: 75, reputationRequired: 35, payRange: { min: 2000, max: 5000 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'carlin-academy', name: 'Carlin Academy', shortName: 'CAR', country: 'UK', budget: 'medium', prestige: 65, reputationRequired: 30, payRange: { min: 1500, max: 4000 }, facilities: 'professional', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'hitech-dev', name: 'Hitech Development', shortName: 'HTD', country: 'UK', budget: 'medium', prestige: 60, reputationRequired: 25, payRange: { min: 1200, max: 3500 }, facilities: 'standard', colors: { primary: '#1f2937', secondary: '#fbbf24' } }
    ]
  },

  // ============================================
  // FORMULA - Professional
  // ============================================
  {
    classId: 'f3',
    className: 'Formula 3',
    teams: [
      { id: 'prema-f3', name: 'Prema Racing', shortName: 'PRE', country: 'Italy', budget: 'factory', prestige: 95, reputationRequired: 55, payRange: { min: 5000, max: 15000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'art-f3', name: 'ART Grand Prix', shortName: 'ART', country: 'France', budget: 'high', prestige: 88, reputationRequired: 50, payRange: { min: 4000, max: 12000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'trident-f3', name: 'Trident', shortName: 'TRI', country: 'Italy', budget: 'medium', prestige: 75, reputationRequired: 45, payRange: { min: 3000, max: 9000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } },
      { id: 'mp-f3', name: 'MP Motorsport', shortName: 'MPM', country: 'Netherlands', budget: 'medium', prestige: 78, reputationRequired: 45, payRange: { min: 3200, max: 9500 }, facilities: 'professional', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'carlin-f3', name: 'Carlin', shortName: 'CAR', country: 'UK', budget: 'medium', prestige: 80, reputationRequired: 48, payRange: { min: 3500, max: 10000 }, facilities: 'professional', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'hitech-f3', name: 'Hitech GP', shortName: 'HIT', country: 'UK', budget: 'medium', prestige: 72, reputationRequired: 42, payRange: { min: 2800, max: 8500 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#fbbf24' } }
    ]
  },
  {
    classId: 'formula-reiza',
    className: 'Formula Reiza',
    teams: [
      { id: 'reiza-factory', name: 'Reiza Studios Factory', shortName: 'REI', country: 'Brazil', budget: 'factory', prestige: 90, reputationRequired: 60, payRange: { min: 10000, max: 30000 }, facilities: 'elite', colors: { primary: '#0891b2', secondary: '#fbbf24' } },
      { id: 'brasil-racing', name: 'Brasil Racing', shortName: 'BRR', country: 'Brazil', budget: 'high', prestige: 82, reputationRequired: 55, payRange: { min: 8000, max: 25000 }, facilities: 'elite', colors: { primary: '#16a34a', secondary: '#fbbf24' } },
      { id: 'hot-racing', name: 'Hot Racing Team', shortName: 'HOT', country: 'Brazil', budget: 'medium', prestige: 70, reputationRequired: 48, payRange: { min: 5000, max: 15000 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'formula-ultimate',
    className: 'Formula Ultimate',
    teams: [
      { id: 'red-bull-fu', name: 'Red Bull Racing', shortName: 'RBR', country: 'Austria', budget: 'factory', prestige: 98, reputationRequired: 85, payRange: { min: 50000, max: 500000 }, facilities: 'elite', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } },
      { id: 'ferrari-fu', name: 'Scuderia Ferrari', shortName: 'FER', country: 'Italy', budget: 'factory', prestige: 99, reputationRequired: 88, payRange: { min: 60000, max: 600000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'mercedes-fu', name: 'Mercedes-AMG', shortName: 'MER', country: 'Germany', budget: 'factory', prestige: 97, reputationRequired: 85, payRange: { min: 50000, max: 550000 }, facilities: 'elite', colors: { primary: '#0d9488', secondary: '#1f2937' } },
      { id: 'mclaren-fu', name: 'McLaren Racing', shortName: 'MCL', country: 'UK', budget: 'high', prestige: 92, reputationRequired: 80, payRange: { min: 35000, max: 350000 }, facilities: 'elite', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'aston-fu', name: 'Aston Martin', shortName: 'AST', country: 'UK', budget: 'high', prestige: 88, reputationRequired: 75, payRange: { min: 25000, max: 250000 }, facilities: 'elite', colors: { primary: '#065f46', secondary: '#fbbf24' } },
      { id: 'alpine-fu', name: 'Alpine F1', shortName: 'ALP', country: 'France', budget: 'high', prestige: 85, reputationRequired: 72, payRange: { min: 20000, max: 200000 }, facilities: 'elite', colors: { primary: '#2563eb', secondary: '#ec4899' } },
      { id: 'williams-fu', name: 'Williams Racing', shortName: 'WIL', country: 'UK', budget: 'medium', prestige: 78, reputationRequired: 65, payRange: { min: 12000, max: 120000 }, facilities: 'professional', colors: { primary: '#1e40af', secondary: '#0ea5e9' } },
      { id: 'sauber-fu', name: 'Stake Sauber', shortName: 'SAU', country: 'Switzerland', budget: 'medium', prestige: 72, reputationRequired: 60, payRange: { min: 10000, max: 100000 }, facilities: 'professional', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'haas-fu', name: 'Haas F1 Team', shortName: 'HAS', country: 'USA', budget: 'low', prestige: 65, reputationRequired: 55, payRange: { min: 8000, max: 80000 }, facilities: 'standard', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'racing-bulls-fu', name: 'Racing Bulls', shortName: 'RBL', country: 'Italy', budget: 'medium', prestige: 70, reputationRequired: 58, payRange: { min: 9000, max: 90000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#dc2626' } }
    ]
  },
  {
    classId: 'formula-usa-2023',
    className: 'Formula USA 2023',
    teams: [
      { id: 'penske-usa', name: 'Team Penske', shortName: 'PEN', country: 'USA', budget: 'factory', prestige: 95, reputationRequired: 70, payRange: { min: 30000, max: 200000 }, facilities: 'elite', colors: { primary: '#fbbf24', secondary: '#1f2937' } },
      { id: 'ganassi-usa', name: 'Chip Ganassi Racing', shortName: 'CGR', country: 'USA', budget: 'factory', prestige: 92, reputationRequired: 68, payRange: { min: 25000, max: 180000 }, facilities: 'elite', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'andretti-usa', name: 'Andretti Global', shortName: 'AND', country: 'USA', budget: 'high', prestige: 88, reputationRequired: 65, payRange: { min: 20000, max: 150000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'mclaren-usa', name: 'Arrow McLaren', shortName: 'AMC', country: 'USA', budget: 'high', prestige: 85, reputationRequired: 62, payRange: { min: 18000, max: 130000 }, facilities: 'professional', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'rahal-usa', name: 'Rahal Letterman Lanigan', shortName: 'RLL', country: 'USA', budget: 'medium', prestige: 78, reputationRequired: 58, payRange: { min: 12000, max: 100000 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#1f2937' } },
      { id: 'meyer-usa', name: 'Meyer Shank Racing', shortName: 'MSR', country: 'USA', budget: 'medium', prestige: 75, reputationRequired: 55, payRange: { min: 10000, max: 85000 }, facilities: 'professional', colors: { primary: '#ec4899', secondary: '#1f2937' } }
    ]
  },

  // ============================================
  // GT4
  // ============================================
  {
    classId: 'gt4',
    className: 'GT4',
    teams: [
      { id: 'century-gt4', name: 'Century Motorsport', shortName: 'CEN', country: 'UK', budget: 'medium', prestige: 70, reputationRequired: 35, payRange: { min: 3000, max: 10000 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'academy-gt4', name: 'Academy Motorsport', shortName: 'ACM', country: 'UK', budget: 'medium', prestige: 65, reputationRequired: 30, payRange: { min: 2500, max: 8000 }, facilities: 'standard', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'prosport-gt4', name: 'ProSport Racing', shortName: 'PRO', country: 'Germany', budget: 'medium', prestige: 68, reputationRequired: 32, payRange: { min: 2800, max: 9000 }, facilities: 'standard', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'allied-gt4', name: 'Allied Racing', shortName: 'ALL', country: 'Germany', budget: 'low', prestige: 55, reputationRequired: 25, payRange: { min: 2000, max: 6000 }, facilities: 'basic', colors: { primary: '#2563eb', secondary: '#ffffff' } },
      { id: 'team-gtechniq', name: 'Team Gtechniq', shortName: 'GTQ', country: 'UK', budget: 'medium', prestige: 72, reputationRequired: 38, payRange: { min: 3200, max: 10500 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } }
    ]
  },

  // ============================================
  // GT3
  // ============================================
  {
    classId: 'gt3',
    className: 'GT3',
    teams: [
      { id: 'walkenhorst', name: 'Walkenhorst Motorsport', shortName: 'WLK', country: 'Germany', budget: 'high', prestige: 82, reputationRequired: 55, payRange: { min: 8000, max: 25000 }, facilities: 'elite', colors: { primary: '#1e3a8a', secondary: '#ffffff' } },
      { id: 'rowe-racing', name: 'ROWE Racing', shortName: 'ROW', country: 'Germany', budget: 'factory', prestige: 90, reputationRequired: 65, payRange: { min: 12000, max: 40000 }, facilities: 'elite', colors: { primary: '#0284c7', secondary: '#1f2937' } },
      { id: 'manthey-racing', name: 'Manthey Racing', shortName: 'MAN', country: 'Germany', budget: 'factory', prestige: 92, reputationRequired: 68, payRange: { min: 15000, max: 50000 }, facilities: 'elite', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'garage-59', name: 'Garage 59', shortName: 'G59', country: 'UK', budget: 'high', prestige: 78, reputationRequired: 50, payRange: { min: 6000, max: 20000 }, facilities: 'professional', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'team-wrt', name: 'Team WRT', shortName: 'WRT', country: 'Belgium', budget: 'factory', prestige: 95, reputationRequired: 72, payRange: { min: 18000, max: 60000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'akkodis-asp', name: 'Akkodis ASP Team', shortName: 'ASP', country: 'France', budget: 'factory', prestige: 88, reputationRequired: 62, payRange: { min: 10000, max: 35000 }, facilities: 'elite', colors: { primary: '#0d9488', secondary: '#1f2937' } },
      { id: 'iron-lynx', name: 'Iron Lynx', shortName: 'ILX', country: 'Italy', budget: 'high', prestige: 85, reputationRequired: 58, payRange: { min: 8500, max: 28000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'af-corse', name: 'AF Corse', shortName: 'AFC', country: 'Italy', budget: 'factory', prestige: 94, reputationRequired: 70, payRange: { min: 16000, max: 55000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } }
    ]
  },
  {
    classId: 'gt3-gen2',
    className: 'GT3 Gen 2',
    teams: [
      { id: 'wrt-gen2', name: 'Team WRT', shortName: 'WRT', country: 'Belgium', budget: 'factory', prestige: 96, reputationRequired: 75, payRange: { min: 20000, max: 70000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'manthey-gen2', name: 'Manthey EMA', shortName: 'MAN', country: 'Germany', budget: 'factory', prestige: 94, reputationRequired: 72, payRange: { min: 18000, max: 60000 }, facilities: 'elite', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'iron-dames', name: 'Iron Dames', shortName: 'IRD', country: 'Italy', budget: 'high', prestige: 80, reputationRequired: 55, payRange: { min: 8000, max: 25000 }, facilities: 'elite', colors: { primary: '#ec4899', secondary: '#1f2937' } },
      { id: 'boutsen-gen2', name: 'Boutsen VDS', shortName: 'BVD', country: 'Belgium', budget: 'high', prestige: 82, reputationRequired: 58, payRange: { min: 9000, max: 30000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#dc2626' } }
    ]
  },

  // ============================================
  // PROTOTYPES
  // ============================================
  {
    classId: 'lmp2-gen2',
    className: 'LMP2 Gen 2',
    teams: [
      { id: 'united-auto', name: 'United Autosports', shortName: 'UNI', country: 'UK', budget: 'high', prestige: 88, reputationRequired: 60, payRange: { min: 15000, max: 50000 }, facilities: 'elite', colors: { primary: '#1e40af', secondary: '#fbbf24' } },
      { id: 'jota-sport', name: 'JOTA Sport', shortName: 'JOT', country: 'UK', budget: 'high', prestige: 90, reputationRequired: 65, payRange: { min: 18000, max: 60000 }, facilities: 'elite', colors: { primary: '#f59e0b', secondary: '#1f2937' } },
      { id: 'inter-europol', name: 'Inter Europol Competition', shortName: 'IEC', country: 'Poland', budget: 'medium', prestige: 75, reputationRequired: 50, payRange: { min: 10000, max: 35000 }, facilities: 'professional', colors: { primary: '#ffffff', secondary: '#dc2626' } },
      { id: 'cool-racing', name: 'Cool Racing', shortName: 'COO', country: 'Switzerland', budget: 'medium', prestige: 78, reputationRequired: 52, payRange: { min: 11000, max: 38000 }, facilities: 'professional', colors: { primary: '#0284c7', secondary: '#ffffff' } }
    ]
  },
  {
    classId: 'hypercar',
    className: 'Hypercar',
    teams: [
      { id: 'toyota-gazoo', name: 'Toyota Gazoo Racing', shortName: 'TGR', country: 'Japan', budget: 'factory', prestige: 98, reputationRequired: 85, payRange: { min: 80000, max: 500000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'ferrari-af', name: 'Ferrari AF Corse', shortName: 'FER', country: 'Italy', budget: 'factory', prestige: 99, reputationRequired: 88, payRange: { min: 100000, max: 600000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'porsche-penske', name: 'Porsche Penske Motorsport', shortName: 'PPM', country: 'Germany', budget: 'factory', prestige: 97, reputationRequired: 85, payRange: { min: 75000, max: 450000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'peugeot-th', name: 'Peugeot TotalEnergies', shortName: 'PEU', country: 'France', budget: 'factory', prestige: 85, reputationRequired: 75, payRange: { min: 40000, max: 250000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#16a34a' } },
      { id: 'cadillac-wtr', name: 'Cadillac Racing', shortName: 'CAD', country: 'USA', budget: 'factory', prestige: 90, reputationRequired: 78, payRange: { min: 50000, max: 300000 }, facilities: 'elite', colors: { primary: '#fbbf24', secondary: '#1f2937' } }
    ]
  },

  // ============================================
  // STOCK CARS - BRAZIL
  // ============================================
  {
    classId: 'stock-car-2024',
    className: 'Stock Car Pro Series 2024',
    teams: [
      { id: 'eurofarma', name: 'Eurofarma RC', shortName: 'EUR', country: 'Brazil', budget: 'factory', prestige: 95, reputationRequired: 70, payRange: { min: 25000, max: 150000 }, facilities: 'elite', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'full-time', name: 'Full Time Sports', shortName: 'FTS', country: 'Brazil', budget: 'high', prestige: 88, reputationRequired: 65, payRange: { min: 18000, max: 100000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#1f2937' } },
      { id: 'crown-racing', name: 'Crown Racing', shortName: 'CRW', country: 'Brazil', budget: 'high', prestige: 85, reputationRequired: 60, payRange: { min: 15000, max: 85000 }, facilities: 'professional', colors: { primary: '#f59e0b', secondary: '#1f2937' } },
      { id: 'ipiranga-racing', name: 'Ipiranga Racing', shortName: 'IPR', country: 'Brazil', budget: 'high', prestige: 82, reputationRequired: 58, payRange: { min: 12000, max: 75000 }, facilities: 'professional', colors: { primary: '#f97316', secondary: '#ffffff' } },
      { id: 'cavaleiro-sports', name: 'Cavaleiro Sports', shortName: 'CAV', country: 'Brazil', budget: 'medium', prestige: 75, reputationRequired: 52, payRange: { min: 8000, max: 50000 }, facilities: 'professional', colors: { primary: '#1e40af', secondary: '#fbbf24' } },
      { id: 'blau-motorsport', name: 'Blau Motorsport', shortName: 'BLA', country: 'Brazil', budget: 'medium', prestige: 72, reputationRequired: 48, payRange: { min: 6000, max: 40000 }, facilities: 'standard', colors: { primary: '#0284c7', secondary: '#ffffff' } }
    ]
  },

  // ============================================
  // NASCAR / STOCK USA
  // ============================================
  {
    classId: 'stock-usa-gen3',
    className: 'Stock USA Gen 3 (NASCAR Next Gen)',
    teams: [
      { id: 'hendrick', name: 'Hendrick Motorsports', shortName: 'HMS', country: 'USA', budget: 'factory', prestige: 98, reputationRequired: 80, payRange: { min: 50000, max: 400000 }, facilities: 'elite', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'joe-gibbs', name: 'Joe Gibbs Racing', shortName: 'JGR', country: 'USA', budget: 'factory', prestige: 96, reputationRequired: 78, payRange: { min: 45000, max: 350000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'team-penske-nascar', name: 'Team Penske', shortName: 'PEN', country: 'USA', budget: 'factory', prestige: 95, reputationRequired: 76, payRange: { min: 42000, max: 320000 }, facilities: 'elite', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } },
      { id: 'stewart-haas', name: 'Stewart-Haas Racing', shortName: 'SHR', country: 'USA', budget: 'high', prestige: 88, reputationRequired: 70, payRange: { min: 30000, max: 200000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'trackhouse', name: 'Trackhouse Racing', shortName: 'TRK', country: 'USA', budget: 'high', prestige: 85, reputationRequired: 65, payRange: { min: 25000, max: 150000 }, facilities: 'professional', colors: { primary: '#7c3aed', secondary: '#ffffff' } },
      { id: '23xi', name: '23XI Racing', shortName: '23X', country: 'USA', budget: 'high', prestige: 82, reputationRequired: 62, payRange: { min: 20000, max: 130000 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#f97316' } },
      { id: 'rcr', name: 'Richard Childress Racing', shortName: 'RCR', country: 'USA', budget: 'medium', prestige: 78, reputationRequired: 58, payRange: { min: 15000, max: 100000 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'roush-fenway', name: 'RFK Racing', shortName: 'RFK', country: 'USA', budget: 'medium', prestige: 75, reputationRequired: 55, payRange: { min: 12000, max: 85000 }, facilities: 'professional', colors: { primary: '#1e40af', secondary: '#ffffff' } }
    ]
  },

  // ============================================
  // RALLYCROSS
  // ============================================
  {
    classId: 'rallycross',
    className: 'Rallycross',
    teams: [
      { id: 'hansen-rx', name: 'Hansen World RX Team', shortName: 'HAN', country: 'Sweden', budget: 'factory', prestige: 92, reputationRequired: 65, payRange: { min: 15000, max: 80000 }, facilities: 'elite', colors: { primary: '#fbbf24', secondary: '#1f2937' } },
      { id: 'eks-rx', name: 'EKS JC', shortName: 'EKS', country: 'Sweden', budget: 'high', prestige: 88, reputationRequired: 60, payRange: { min: 12000, max: 60000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'gck', name: 'GCK Motorsport', shortName: 'GCK', country: 'France', budget: 'high', prestige: 85, reputationRequired: 55, payRange: { min: 10000, max: 50000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#fbbf24' } },
      { id: 'all-inkl', name: 'ALL-INKL.COM Münnich Motorsport', shortName: 'AIM', country: 'Germany', budget: 'medium', prestige: 78, reputationRequired: 50, payRange: { min: 8000, max: 40000 }, facilities: 'professional', colors: { primary: '#ffffff', secondary: '#dc2626' } }
    ]
  },

  // ============================================
  // TOURING CARS
  // ============================================
  {
    classId: 'supercar',
    className: 'Supercar (V8 Supercars)',
    teams: [
      { id: 'triple-8', name: 'Triple Eight Race Engineering', shortName: 'T8R', country: 'Australia', budget: 'factory', prestige: 95, reputationRequired: 70, payRange: { min: 30000, max: 200000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'dick-johnson', name: 'Dick Johnson Racing', shortName: 'DJR', country: 'Australia', budget: 'factory', prestige: 92, reputationRequired: 68, payRange: { min: 25000, max: 180000 }, facilities: 'elite', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'walkinshaw', name: 'Walkinshaw Andretti United', shortName: 'WAU', country: 'Australia', budget: 'high', prestige: 88, reputationRequired: 62, payRange: { min: 20000, max: 140000 }, facilities: 'elite', colors: { primary: '#1f2937', secondary: '#dc2626' } },
      { id: 'tickford', name: 'Tickford Racing', shortName: 'TIC', country: 'Australia', budget: 'high', prestige: 85, reputationRequired: 58, payRange: { min: 15000, max: 100000 }, facilities: 'professional', colors: { primary: '#0284c7', secondary: '#ffffff' } },
      { id: 'erebus', name: 'Erebus Motorsport', shortName: 'ERE', country: 'Australia', budget: 'medium', prestige: 80, reputationRequired: 52, payRange: { min: 12000, max: 80000 }, facilities: 'professional', colors: { primary: '#1f2937', secondary: '#fbbf24' } },
      { id: 'bjr', name: 'Brad Jones Racing', shortName: 'BJR', country: 'Australia', budget: 'medium', prestige: 75, reputationRequired: 48, payRange: { min: 8000, max: 55000 }, facilities: 'standard', colors: { primary: '#dc2626', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'super-v8',
    className: 'Super V8',
    teams: [
      { id: 'v8-masters', name: 'V8 Masters Racing', shortName: 'V8M', country: 'Brazil', budget: 'high', prestige: 80, reputationRequired: 50, payRange: { min: 8000, max: 40000 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'sprint-v8', name: 'Sprint V8 Team', shortName: 'SV8', country: 'Brazil', budget: 'medium', prestige: 70, reputationRequired: 42, payRange: { min: 5000, max: 25000 }, facilities: 'standard', colors: { primary: '#1e40af', secondary: '#ffffff' } }
    ]
  },

  // ============================================
  // ONE-MAKE SERIES
  // ============================================
  {
    classId: 'carrera-cup',
    className: 'Porsche Carrera Cup',
    teams: [
      { id: 'herberth', name: 'Herberth Motorsport', shortName: 'HER', country: 'Germany', budget: 'high', prestige: 85, reputationRequired: 45, payRange: { min: 5000, max: 20000 }, facilities: 'professional', colors: { primary: '#ffffff', secondary: '#1f2937' } },
      { id: 'lechner', name: 'Lechner Racing', shortName: 'LEC', country: 'Austria', budget: 'high', prestige: 88, reputationRequired: 48, payRange: { min: 6000, max: 25000 }, facilities: 'elite', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'premotion', name: 'Proton by Premotion', shortName: 'PRO', country: 'Germany', budget: 'medium', prestige: 75, reputationRequired: 40, payRange: { min: 4000, max: 15000 }, facilities: 'standard', colors: { primary: '#f97316', secondary: '#1f2937' } },
      { id: 'almeras', name: 'CLRT by Almeras', shortName: 'ALM', country: 'France', budget: 'medium', prestige: 78, reputationRequired: 42, payRange: { min: 4500, max: 18000 }, facilities: 'professional', colors: { primary: '#0284c7', secondary: '#fbbf24' } }
    ]
  },
  {
    classId: 'ginetta-g55-supercup',
    className: 'Ginetta G55 Supercup',
    teams: [
      { id: 'tolman-motorsport', name: 'Tolman Motorsport', shortName: 'TOL', country: 'UK', budget: 'medium', prestige: 75, reputationRequired: 35, payRange: { min: 3000, max: 12000 }, facilities: 'professional', colors: { primary: '#1e3a8a', secondary: '#ffffff' } },
      { id: 'jhr-developments', name: 'JHR Developments', shortName: 'JHR', country: 'UK', budget: 'medium', prestige: 70, reputationRequired: 30, payRange: { min: 2500, max: 10000 }, facilities: 'standard', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'elite-motorsport', name: 'Elite Motorsport', shortName: 'ELI', country: 'UK', budget: 'low', prestige: 60, reputationRequired: 25, payRange: { min: 2000, max: 8000 }, facilities: 'basic', colors: { primary: '#16a34a', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'super-trofeo',
    className: 'Lamborghini Super Trofeo',
    teams: [
      { id: 'target-racing', name: 'Target Racing', shortName: 'TGT', country: 'Italy', budget: 'high', prestige: 82, reputationRequired: 48, payRange: { min: 6000, max: 22000 }, facilities: 'professional', colors: { primary: '#f59e0b', secondary: '#1f2937' } },
      { id: 'oregon-team', name: 'Oregon Team', shortName: 'ORE', country: 'Italy', budget: 'medium', prestige: 75, reputationRequired: 42, payRange: { min: 4500, max: 16000 }, facilities: 'standard', colors: { primary: '#16a34a', secondary: '#ffffff' } },
      { id: 'rexal-fmi', name: 'Rexal FMI Racing', shortName: 'RFM', country: 'Italy', budget: 'medium', prestige: 70, reputationRequired: 38, payRange: { min: 4000, max: 14000 }, facilities: 'standard', colors: { primary: '#dc2626', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'caterham-academy',
    className: 'Caterham Academy',
    teams: [
      { id: 'caterham-academy-team', name: 'Caterham Academy', shortName: 'CAT', country: 'UK', budget: 'low', prestige: 40, reputationRequired: 10, payRange: { min: 0, max: 500 }, facilities: 'basic', colors: { primary: '#16a34a', secondary: '#fbbf24' }, description: 'Official Caterham entry-level program' }
    ]
  },
  {
    classId: 'caterham-620r',
    className: 'Caterham 620R',
    teams: [
      { id: 'caterham-motorsport', name: 'Caterham Motorsport', shortName: 'CTM', country: 'UK', budget: 'medium', prestige: 70, reputationRequired: 40, payRange: { min: 3000, max: 12000 }, facilities: 'professional', colors: { primary: '#16a34a', secondary: '#fbbf24' } },
      { id: 'signature-caterham', name: 'Signature Racing', shortName: 'SIG', country: 'UK', budget: 'medium', prestige: 65, reputationRequired: 35, payRange: { min: 2500, max: 10000 }, facilities: 'standard', colors: { primary: '#1f2937', secondary: '#ffffff' } }
    ]
  },
  {
    classId: 'tsi-cup',
    className: 'TSI Cup',
    teams: [
      { id: 'vw-racing-br', name: 'VW Racing Brasil', shortName: 'VWB', country: 'Brazil', budget: 'medium', prestige: 55, reputationRequired: 20, payRange: { min: 1500, max: 6000 }, facilities: 'standard', colors: { primary: '#1e40af', secondary: '#ffffff' } },
      { id: 'hot-car-comp', name: 'Hot Car Competições', shortName: 'HCC', country: 'Brazil', budget: 'low', prestige: 45, reputationRequired: 15, payRange: { min: 1000, max: 4000 }, facilities: 'basic', colors: { primary: '#dc2626', secondary: '#fbbf24' } },
      { id: 'rsc-motorsport', name: 'RSC Motorsport', shortName: 'RSC', country: 'Brazil', budget: 'low', prestige: 40, reputationRequired: 10, payRange: { min: 800, max: 3000 }, facilities: 'basic', colors: { primary: '#16a34a', secondary: '#1f2937' } }
    ]
  },
  {
    classId: 'lancer-cup',
    className: 'Lancer Cup',
    teams: [
      { id: 'mitsubishi-motorsport', name: 'Mitsubishi Motorsport', shortName: 'MMT', country: 'Brazil', budget: 'medium', prestige: 65, reputationRequired: 30, payRange: { min: 2500, max: 10000 }, facilities: 'professional', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'evo-racing', name: 'EVO Racing Team', shortName: 'EVO', country: 'Brazil', budget: 'low', prestige: 55, reputationRequired: 25, payRange: { min: 2000, max: 7000 }, facilities: 'standard', colors: { primary: '#1f2937', secondary: '#dc2626' } }
    ]
  },
  {
    classId: 'sprint-race',
    className: 'Sprint Race',
    teams: [
      { id: 'sprint-master', name: 'Sprint Masters', shortName: 'SPM', country: 'Brazil', budget: 'low', prestige: 35, reputationRequired: 12, payRange: { min: 500, max: 2000 }, facilities: 'basic', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'toyota-gazoo-br', name: 'Toyota Gazoo Racing BR', shortName: 'TGB', country: 'Brazil', budget: 'medium', prestige: 50, reputationRequired: 18, payRange: { min: 1000, max: 4000 }, facilities: 'standard', colors: { primary: '#1f2937', secondary: '#dc2626' } }
    ]
  },
  {
    classId: 'old-stock-race',
    className: 'Old Stock Race',
    teams: [
      { id: 'nostalgia-racing', name: 'Nostalgia Racing', shortName: 'NOS', country: 'Brazil', budget: 'low', prestige: 45, reputationRequired: 20, payRange: { min: 1000, max: 4000 }, facilities: 'basic', colors: { primary: '#f59e0b', secondary: '#1f2937' } },
      { id: 'opala-legends', name: 'Opala Legends', shortName: 'OPL', country: 'Brazil', budget: 'low', prestige: 40, reputationRequired: 15, payRange: { min: 800, max: 3000 }, facilities: 'basic', colors: { primary: '#dc2626', secondary: '#fbbf24' } }
    ]
  }
];

// Helper functions

/**
 * Get teams for a specific car class
 */
export function getTeamsForClass(classId: string): Team[] {
  const classTeams = TEAMS_BY_CLASS.find(ct => ct.classId === classId);
  return classTeams?.teams ?? [];
}

/**
 * Get teams that would offer a contract based on player reputation
 */
export function getAvailableTeams(classId: string, playerReputation: number): Team[] {
  const teams = getTeamsForClass(classId);
  return teams.filter(team => team.reputationRequired <= playerReputation);
}

/**
 * Calculate contract offer based on team and player reputation
 */
export function calculateContractOffer(team: Team, playerReputation: number): {
  salary: number;
  bonusPerWin: number;
  bonusPerPodium: number;
  duration: number; // seasons
} {
  // Higher reputation = closer to max pay
  const reputationFactor = Math.min(1, (playerReputation - team.reputationRequired) / 50);
  const baseSalary = team.payRange.min + (team.payRange.max - team.payRange.min) * reputationFactor;
  
  // Bonuses scale with team prestige
  const prestigeFactor = team.prestige / 100;
  
  return {
    salary: Math.round(baseSalary),
    bonusPerWin: Math.round(baseSalary * 0.3 * prestigeFactor),
    bonusPerPodium: Math.round(baseSalary * 0.1 * prestigeFactor),
    duration: playerReputation > team.reputationRequired + 20 ? 2 : 1
  };
}

/**
 * Get all teams across all classes
 */
export function getAllTeams(): Team[] {
  return TEAMS_BY_CLASS.flatMap(ct => ct.teams);
}

/**
 * Get teams by budget level
 */
export function getTeamsByBudget(budget: Team['budget']): Team[] {
  return getAllTeams().filter(team => team.budget === budget);
}

/**
 * Get factory-backed teams (highest tier)
 */
export function getFactoryTeams(): Team[] {
  return getAllTeams().filter(team => team.budget === 'factory');
}

/**
 * Get team by ID
 */
export function getTeamById(teamId: string): Team | undefined {
  return getAllTeams().find(team => team.id === teamId);
}











