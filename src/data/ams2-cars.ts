/**
 * AMS2 Car Classes Database
 * Comprehensive data on all car classes in Automobilista 2
 * Data sourced from https://automobilista2.wiki.gg/wiki/Cars
 * 
 * IMPORTANT: Historic/vintage cars (pre-2000) can only be used for one-off special events, not full seasons
 */

export interface Car {
  id: string;
  name: string;
  manufacturer: string;
  year: number;
  imageFile?: string; // Filename from wiki
  description?: string;
}

// Championship tiers from lowest to highest
export type ChampionshipTier = 'entry' | 'amateur' | 'semi-pro' | 'professional' | 'pro' | 'elite' | 'pinnacle' | 'historic';

export interface CarClass {
  id: string;
  name: string;
  description: string;
  tier: ChampionshipTier;
  era: string; // Year or year range
  isModern: boolean; // If false, only available for one-off special events
  cars: Car[];
  suitableTrackTypes: ('road' | 'oval' | 'street' | 'kart' | 'rallycross')[];
  category: 'formula' | 'gt' | 'prototype' | 'touring' | 'stock' | 'kart' | 'rallycross' | 'road' | 'vintage';
  gridSize: number; // Typical grid size
  raceLength: 'sprint' | 'medium' | 'endurance'; // Typical race format
  imageFile?: string; // Class representative image
}

export const AMS2_CAR_CLASSES: CarClass[] = [
  // ============================================
  // ENTRY LEVEL - Starter classes for new careers
  // ============================================
  {
    id: 'kart-4t-rental',
    name: 'Karting 4T Rental',
    description: 'Entry-level rental karts with 4-stroke engines. Perfect for beginners to learn racing fundamentals.',
    tier: 'entry',
    era: '2016',
    isModern: true,
    category: 'kart',
    suitableTrackTypes: ['kart'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Kart_4t_rental.jpg',
    cars: [
      { id: 'kart-4t-rental', name: 'Kart 4T Rental', manufacturer: 'Generic', year: 2016, imageFile: 'Kart_4t_rental.jpg' }
    ]
  },
  {
    id: 'kart-4t-race',
    name: 'Karting 4T Race',
    description: 'Competitive 4-stroke racing karts. A step up from rentals with more performance.',
    tier: 'entry',
    era: '2016',
    isModern: true,
    category: 'kart',
    suitableTrackTypes: ['kart'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Kart_4t_race.jpg',
    cars: [
      { id: 'kart-4t-race', name: 'Kart 4T Race', manufacturer: 'Generic', year: 2016, imageFile: 'Kart_4t_race.jpg' }
    ]
  },
  {
    id: 'kart-125cc',
    name: 'Karting 2T 125cc',
    description: '125cc 2-stroke direct-drive karts. The traditional karting formula with high-revving engines.',
    tier: 'entry',
    era: '2016',
    isModern: true,
    category: 'kart',
    suitableTrackTypes: ['kart'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Kart_125cc.jpg',
    cars: [
      { id: 'kart-125cc', name: 'Kart 2T 125cc', manufacturer: 'Generic', year: 2016, imageFile: 'Kart_125cc.jpg' }
    ]
  },
  {
    id: 'kart-shifter',
    name: 'Karting 2T Shifter',
    description: '125cc 2-stroke shifter karts with 6-speed gearbox. The fastest and most demanding kart category.',
    tier: 'amateur',
    era: '2016',
    isModern: true,
    category: 'kart',
    suitableTrackTypes: ['kart'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Kart_shifter.jpg',
    cars: [
      { id: 'kart-shifter', name: 'Kart 2T Shifter', manufacturer: 'Generic', year: 2016, imageFile: 'Kart_shifter.jpg' }
    ]
  },
  {
    id: 'superkart',
    name: 'Superkart',
    description: 'The ultimate karting experience - 250cc superkarts reaching speeds over 250 km/h on full circuits.',
    tier: 'semi-pro',
    era: '2019',
    isModern: true,
    category: 'kart',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Superkart.jpg',
    cars: [
      { id: 'superkart-250', name: 'Superkart 250cc', manufacturer: 'Generic', year: 2019, imageFile: 'Superkart.jpg' }
    ]
  },
  {
    id: 'kartcross',
    name: 'Kartcross',
    description: 'Off-road kart racing with purpose-built machines for dirt and rallycross tracks.',
    tier: 'entry',
    era: '2016',
    isModern: true,
    category: 'rallycross',
    suitableTrackTypes: ['rallycross'],
    gridSize: 16,
    raceLength: 'sprint',
    imageFile: 'Kartcross.jpg',
    cars: [
      { id: 'kartcross', name: 'Kartcross', manufacturer: 'Generic', year: 2016, imageFile: 'Kartcross.jpg' }
    ]
  },

  // ============================================
  // FORMULA - Open wheel racing categories
  // ============================================
  {
    id: 'formula-vee',
    name: 'Formula Vee',
    description: 'Entry-level single-seater formula based on Volkswagen Beetle components. A legendary training ground for future champions.',
    tier: 'entry',
    era: '2017',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'F_vee.jpg',
    cars: [
      { id: 'formula-vee', name: 'Formula Vee', manufacturer: 'Reiza', year: 2017, imageFile: 'F_vee.jpg' }
    ]
  },
  {
    id: 'formula-trainer',
    name: 'Formula Trainer',
    description: 'Modern single-seater designed for driver development. Balanced performance for learning racing techniques.',
    tier: 'entry',
    era: '2015',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'F_trainer.jpg',
    cars: [
      { id: 'formula-trainer', name: 'Formula Trainer', manufacturer: 'Reiza', year: 2015, imageFile: 'F_trainer.jpg' }
    ]
  },
  {
    id: 'formula-trainer-advanced',
    name: 'Formula Trainer Advanced',
    description: 'Enhanced version of the Formula Trainer with more power and downforce. The final step before professional single-seaters.',
    tier: 'amateur',
    era: '2015',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'F_trainer_adv.jpg',
    cars: [
      { id: 'formula-trainer-advanced', name: 'Formula Trainer Advanced', manufacturer: 'Reiza', year: 2015, imageFile: 'F_trainer_adv.jpg' }
    ]
  },
  {
    id: 'f3',
    name: 'Formula 3',
    description: 'FIA Formula 3 specification single-seater. A key stepping stone to F2 and F1.',
    tier: 'semi-pro',
    era: '2019',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 30,
    raceLength: 'sprint',
    imageFile: 'F3.jpg',
    cars: [
      { id: 'f3-2019', name: 'Formula 3 2019', manufacturer: 'Dallara', year: 2019, imageFile: 'F3.jpg' }
    ]
  },
  {
    id: 'formula-inter',
    name: 'Formula Inter',
    description: 'Brazilian Formula Intermediate championship car. A powerful open-wheel racer for developing talent.',
    tier: 'semi-pro',
    era: '2018',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'F_inter.jpg',
    cars: [
      { id: 'formula-inter', name: 'Formula Inter', manufacturer: 'Reiza', year: 2018, imageFile: 'F_inter.jpg' }
    ]
  },
  {
    id: 'formula-ultimate',
    name: 'Formula Ultimate',
    description: 'The pinnacle of single-seater racing. A modern F1-spec car with hybrid power unit producing over 1000 HP.',
    tier: 'elite',
    era: '2023',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 20,
    raceLength: 'medium',
    imageFile: 'F_ultimate.jpg',
    cars: [
      { id: 'formula-ultimate-gen2', name: 'Formula Ultimate Gen 2', manufacturer: 'Reiza', year: 2023, imageFile: 'F_ultimate.jpg' }
    ]
  },
  {
    id: 'formula-usa-2023',
    name: 'Formula USA 2023',
    description: 'Modern IndyCar-style open wheel racer. Versatile car for road courses, street circuits, and ovals.',
    tier: 'pro',
    era: '2023',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street', 'oval'],
    gridSize: 24,
    raceLength: 'medium',
    imageFile: 'F_usa_2023.jpg',
    cars: [
      { id: 'formula-usa-2023', name: 'Formula USA 2023', manufacturer: 'Dallara', year: 2023, imageFile: 'F_usa_2023.jpg' }
    ]
  },
  {
    id: 'formula-reiza',
    name: 'Formula Reiza',
    description: 'Reiza Studios\' flagship Formula car. A high-downforce single-seater with modern V10 power.',
    tier: 'pro',
    era: '2022',
    isModern: true,
    category: 'formula',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'F_reiza.jpg',
    cars: [
      { id: 'formula-reiza', name: 'Formula Reiza', manufacturer: 'Reiza', year: 2022, imageFile: 'F_reiza.jpg' }
    ]
  },

  // ============================================
  // GT RACING - Production-based sports cars
  // ============================================
  {
    id: 'gt5',
    name: 'GT5',
    description: 'Entry-level GT racing with production-based sports cars. Affordable and competitive.',
    tier: 'amateur',
    era: '2011-2017',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Gt5.jpg',
    cars: [
      { id: 'ginetta-g40', name: 'Ginetta G40 Cup', manufacturer: 'Ginetta', year: 2010, imageFile: 'Ginetta_g40.jpg' },
      { id: 'porsche-cayman-gt5', name: 'Porsche Cayman GT5', manufacturer: 'Porsche', year: 2017, imageFile: 'Cayman_gt5.jpg' }
    ]
  },
  {
    id: 'gt4',
    name: 'GT4',
    description: 'SRO GT4 category featuring production-derived sports cars with controlled modifications. Great balance of performance and accessibility.',
    tier: 'semi-pro',
    era: '2012-2019',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Gt4.jpg',
    cars: [
      { id: 'alpine-a110-gt4', name: 'Alpine A110 GT4 Evo', manufacturer: 'Alpine', year: 2020, imageFile: 'A110_gt4.jpg' },
      { id: 'aston-martin-v8-vantage-gt4', name: 'Aston Martin V8 Vantage GT4', manufacturer: 'Aston Martin', year: 2019, imageFile: 'Vantage_gt4.jpg' },
      { id: 'audi-r8-lms-gt4', name: 'Audi R8 LMS GT4', manufacturer: 'Audi', year: 2018, imageFile: 'R8_gt4.jpg' },
      { id: 'bmw-m4-gt4', name: 'BMW M4 GT4', manufacturer: 'BMW', year: 2018, imageFile: 'M4_gt4.jpg' },
      { id: 'chevrolet-camaro-gt4', name: 'Chevrolet Camaro GT4.R', manufacturer: 'Chevrolet', year: 2017, imageFile: 'Camaro_gt4.jpg' },
      { id: 'ginetta-g55-gt4', name: 'Ginetta G55 GT4', manufacturer: 'Ginetta', year: 2014, imageFile: 'G55_gt4.jpg' },
      { id: 'ktm-x-bow-gt4', name: 'KTM X-Bow GT4', manufacturer: 'KTM', year: 2016, imageFile: 'Xbow_gt4.jpg' },
      { id: 'maserati-granturismo-gt4', name: 'Maserati GranTurismo MC GT4', manufacturer: 'Maserati', year: 2016, imageFile: 'Maserati_gt4.jpg' },
      { id: 'mclaren-570s-gt4', name: 'McLaren 570S GT4', manufacturer: 'McLaren', year: 2017, imageFile: 'Mclaren_gt4.jpg' },
      { id: 'mercedes-amg-gt4', name: 'Mercedes-AMG GT4', manufacturer: 'Mercedes-AMG', year: 2018, imageFile: 'Amg_gt4.jpg' },
      { id: 'porsche-cayman-gt4-mr', name: 'Porsche Cayman GT4 Clubsport MR', manufacturer: 'Porsche', year: 2019, imageFile: 'Cayman_gt4_mr.jpg' }
    ]
  },
  {
    id: 'gt3',
    name: 'GT3',
    description: 'FIA GT3 specification cars. The premier GT racing category worldwide with heavily modified supercars.',
    tier: 'professional',
    era: '2015-2019',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 30,
    raceLength: 'medium',
    imageFile: 'R8_gt3_v2.jpg',
    cars: [
      { id: 'audi-r8-lms-gt3', name: 'Audi R8 LMS GT3', manufacturer: 'Audi', year: 2019, imageFile: 'R8_gt3_v2.jpg' },
      { id: 'bmw-m6-gt3', name: 'BMW M6 GT3', manufacturer: 'BMW', year: 2016, imageFile: 'M6_v2.jpg' },
      { id: 'mclaren-720s-gt3', name: 'McLaren 720S GT3', manufacturer: 'McLaren', year: 2019, imageFile: '720s_v2.jpg' },
      { id: 'mercedes-amg-gt3', name: 'Mercedes-AMG GT3', manufacturer: 'Mercedes-AMG', year: 2016, imageFile: 'Amg_gt3_v2.jpg' },
      { id: 'nissan-gtr-nismo-gt3', name: 'Nissan GT-R NISMO GT3', manufacturer: 'Nissan', year: 2018, imageFile: 'Gtr_gt3.jpg' },
      { id: 'porsche-911-gt3-r', name: 'Porsche 911 GT3 R', manufacturer: 'Porsche', year: 2019, imageFile: '911_gt3r.jpg' }
    ]
  },
  {
    id: 'gt3-gen2',
    name: 'GT3 Gen 2',
    description: 'Second generation GT3 cars with improved aerodynamics and hybrid technology options.',
    tier: 'pro',
    era: '2022-2023',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 30,
    raceLength: 'medium',
    imageFile: 'Gt3_gen2.jpg',
    cars: [
      { id: 'audi-r8-lms-gt3-evo2', name: 'Audi R8 LMS GT3 Evo 2', manufacturer: 'Audi', year: 2022, imageFile: 'R8_gt3_evo2.jpg' },
      { id: 'bmw-m4-gt3', name: 'BMW M4 GT3', manufacturer: 'BMW', year: 2022, imageFile: 'M4_gt3.jpg' },
      { id: 'ferrari-296-gt3', name: 'Ferrari 296 GT3', manufacturer: 'Ferrari', year: 2023, imageFile: '296_gt3.jpg' },
      { id: 'lamborghini-huracan-gt3-evo2', name: 'Lamborghini Huracán GT3 Evo 2', manufacturer: 'Lamborghini', year: 2022, imageFile: 'Huracan_gt3_evo2.jpg' },
      { id: 'mclaren-720s-gt3-evo', name: 'McLaren 720S GT3 Evo', manufacturer: 'McLaren', year: 2022, imageFile: '720s_gt3_evo.jpg' },
      { id: 'mercedes-amg-gt3-evo', name: 'Mercedes-AMG GT3 Evo', manufacturer: 'Mercedes-AMG', year: 2022, imageFile: 'Amg_gt3_evo.jpg' },
      { id: 'porsche-992-gt3-r', name: 'Porsche 992 GT3 R', manufacturer: 'Porsche', year: 2022, imageFile: '992_gt3r.jpg' },
      { id: 'corvette-z06-gt3-r', name: 'Corvette Z06 GT3.R', manufacturer: 'Chevrolet', year: 2023, imageFile: 'Z06_gt3r.jpg' }
    ]
  },
  {
    id: 'gte',
    name: 'GTE',
    description: 'Grand Touring Endurance cars built for 24-hour races. Factory-backed machines with extreme durability.',
    tier: 'professional',
    era: '2017-2020',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'endurance',
    imageFile: 'Gte.jpg',
    cars: [
      { id: 'aston-martin-vantage-gte', name: 'Aston Martin Vantage GTE', manufacturer: 'Aston Martin', year: 2018, imageFile: 'Vantage_gte.jpg' },
      { id: 'bmw-m8-gte', name: 'BMW M8 GTE', manufacturer: 'BMW', year: 2018, imageFile: 'M8_gte.jpg' },
      { id: 'ferrari-488-gte', name: 'Ferrari 488 GTE', manufacturer: 'Ferrari', year: 2017, imageFile: '488_gte.jpg' },
      { id: 'porsche-911-rsr', name: 'Porsche 911 RSR', manufacturer: 'Porsche', year: 2020, imageFile: '911_rsr.jpg' }
    ]
  },
  {
    id: 'ginetta-g55-supercup',
    name: 'Ginetta G55 Supercup',
    description: 'British single-make series featuring the quick and agile Ginetta G55.',
    tier: 'amateur',
    era: '2011',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Ginetta_g55.jpg',
    cars: [
      { id: 'ginetta-g55-supercup', name: 'Ginetta G55 Supercup', manufacturer: 'Ginetta', year: 2011, imageFile: 'Ginetta_g55.jpg' }
    ]
  },
  {
    id: 'carrera-cup',
    name: 'Porsche Carrera Cup',
    description: 'The world\'s most popular one-make racing series. Factory-built 911 GT3 Cup cars.',
    tier: 'semi-pro',
    era: '2016-2019',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Carrera_cup.jpg',
    cars: [
      { id: 'porsche-911-gt3-cup-38', name: 'Porsche 911 GT3 Cup 3.8', manufacturer: 'Porsche', year: 2016, imageFile: 'Gt3_cup_38.jpg' },
      { id: 'porsche-911-gt3-cup-40', name: 'Porsche 911 GT3 Cup 4.0', manufacturer: 'Porsche', year: 2019, imageFile: 'Gt3_cup_40.jpg' }
    ]
  },
  {
    id: 'super-trofeo',
    name: 'Lamborghini Super Trofeo',
    description: 'Lamborghini\'s single-make championship with the aggressive Huracán Super Trofeo.',
    tier: 'semi-pro',
    era: '2018',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Super_trofeo.jpg',
    cars: [
      { id: 'lamborghini-huracan-st', name: 'Lamborghini Huracán Super Trofeo', manufacturer: 'Lamborghini', year: 2018, imageFile: 'Super_trofeo.jpg' }
    ]
  },
  {
    id: 'caterham-academy',
    name: 'Caterham Academy',
    description: 'The entry point to Caterham racing. Lightweight Seven-based racers for newcomers.',
    tier: 'entry',
    era: '2015',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Caterham_academy.jpg',
    cars: [
      { id: 'caterham-academy', name: 'Caterham Academy', manufacturer: 'Caterham', year: 2015, imageFile: 'Caterham_academy.jpg' }
    ]
  },
  {
    id: 'caterham-superlight',
    name: 'Caterham Superlight',
    description: 'Lightweight British sports car with excellent handling characteristics.',
    tier: 'amateur',
    era: '2017',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Caterham_superlight.jpg',
    cars: [
      { id: 'caterham-superlight', name: 'Caterham Superlight', manufacturer: 'Caterham', year: 2017, imageFile: 'Caterham_superlight.jpg' }
    ]
  },
  {
    id: 'caterham-supersport',
    name: 'Caterham Supersport',
    description: 'Mid-tier Caterham racer with increased power and grip.',
    tier: 'amateur',
    era: '2017',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Caterham_supersport.jpg',
    cars: [
      { id: 'caterham-supersport', name: 'Caterham Supersport', manufacturer: 'Caterham', year: 2017, imageFile: 'Caterham_supersport.jpg' }
    ]
  },
  {
    id: 'caterham-620r',
    name: 'Caterham 620R',
    description: 'The ultimate Caterham. Supercharged engine with incredible power-to-weight ratio.',
    tier: 'semi-pro',
    era: '2013',
    isModern: true,
    category: 'gt',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Caterham_620r.jpg',
    cars: [
      { id: 'caterham-620r', name: 'Caterham 620R', manufacturer: 'Caterham', year: 2013, imageFile: 'Caterham_620r.jpg' }
    ]
  },
  {
    id: 'jcw',
    name: 'MINI JCW',
    description: 'MINI John Cooper Works one-make series. Compact front-wheel drive racing.',
    tier: 'entry',
    era: '2014',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Mini_jcw.jpg',
    cars: [
      { id: 'mini-jcw', name: 'MINI JCW', manufacturer: 'MINI', year: 2014, imageFile: 'Mini_jcw.jpg' }
    ]
  },

  // ============================================
  // PROTOTYPES - Purpose-built racing cars
  // ============================================
  {
    id: 'p4',
    name: 'P4',
    description: 'Entry-level prototype class. Small displacement sports prototypes.',
    tier: 'amateur',
    era: '2009-2013',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'P4.jpg',
    cars: [
      { id: 'metalmoro-asr-p4', name: 'Metalmoro ASR P4', manufacturer: 'Metalmoro', year: 2013, imageFile: 'Metalmoro_p4.jpg' },
      { id: 'sigma-p4', name: 'Sigma P4', manufacturer: 'Sigma', year: 2009, imageFile: 'Sigma_p4.jpg' }
    ]
  },
  {
    id: 'p3',
    name: 'P3',
    description: 'Lightweight sports prototypes with enclosed cockpits. Great balance of speed and safety.',
    tier: 'semi-pro',
    era: '2009-2018',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'P3.jpg',
    cars: [
      { id: 'ligier-js-p3', name: 'Ligier JS P3', manufacturer: 'Ligier', year: 2017, imageFile: 'Ligier_p3.jpg' },
      { id: 'norma-m30', name: 'Norma M30', manufacturer: 'Norma', year: 2018, imageFile: 'Norma_m30.jpg' },
      { id: 'ginetta-g57', name: 'Ginetta G57', manufacturer: 'Ginetta', year: 2015, imageFile: 'Ginetta_g57.jpg' }
    ]
  },
  {
    id: 'p2',
    name: 'P2',
    description: 'Mid-tier prototype class bridging the gap to top-level endurance racing.',
    tier: 'semi-pro',
    era: '2017-2018',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'medium',
    imageFile: 'P2.jpg',
    cars: [
      { id: 'mcr-2000', name: 'MCR 2000', manufacturer: 'MCR', year: 2017, imageFile: 'Mcr_2000.jpg' },
      { id: 'metalmoro-asr-p2', name: 'Metalmoro ASR P2', manufacturer: 'Metalmoro', year: 2018, imageFile: 'Metalmoro_p2.jpg' }
    ]
  },
  {
    id: 'lmp2-gen1',
    name: 'LMP2 Gen 1',
    description: 'First generation Le Mans Prototype 2 cars. Professional-level endurance racers.',
    tier: 'professional',
    era: '2017',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'endurance',
    imageFile: 'Lmp2_gen1.jpg',
    cars: [
      { id: 'oreca-07', name: 'Oreca 07', manufacturer: 'Oreca', year: 2017, imageFile: 'Oreca_07.jpg' },
      { id: 'dallara-p217', name: 'Dallara P217', manufacturer: 'Dallara', year: 2017, imageFile: 'Dallara_p217.jpg' }
    ]
  },
  {
    id: 'lmp2-gen2',
    name: 'LMP2 Gen 2',
    description: 'Second generation LMP2 with improved safety and performance.',
    tier: 'pro',
    era: '2022',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'endurance',
    imageFile: 'Lmp2_gen2.jpg',
    cars: [
      { id: 'oreca-07-gen2', name: 'Oreca 07 Gen 2', manufacturer: 'Oreca', year: 2022, imageFile: 'Oreca_07_gen2.jpg' },
      { id: 'ligier-jsp320', name: 'Ligier JS P320', manufacturer: 'Ligier', year: 2022, imageFile: 'Ligier_jsp320.jpg' }
    ]
  },
  {
    id: 'p1-gen1',
    name: 'P1 Gen 1',
    description: 'Top-tier Brazilian prototype series. Extremely fast closed-cockpit sports cars.',
    tier: 'professional',
    era: '2017-2018',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'P1_gen1.jpg',
    cars: [
      { id: 'metalmoro-mg1', name: 'Metalmoro MG1', manufacturer: 'Metalmoro', year: 2017, imageFile: 'Metalmoro_mg1.jpg' },
      { id: 'sigma-p1-g1', name: 'Sigma P1 G1', manufacturer: 'Sigma', year: 2018, imageFile: 'Sigma_p1.jpg' }
    ]
  },
  {
    id: 'p1-gen2',
    name: 'P1 Gen 2',
    description: 'Second generation of Brazilian P1 prototypes with even more performance.',
    tier: 'elite',
    era: '2023',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'P1_gen2.jpg',
    cars: [
      { id: 'metalmoro-mg1-gen2', name: 'Metalmoro MG1 Gen 2', manufacturer: 'Metalmoro', year: 2023, imageFile: 'Metalmoro_mg1_gen2.jpg' }
    ]
  },
  {
    id: 'hypercar',
    name: 'Hypercar',
    description: 'Le Mans Hypercar class - the pinnacle of sports car racing with hybrid technology.',
    tier: 'elite',
    era: '2022',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 16,
    raceLength: 'endurance',
    imageFile: 'Hypercar.jpg',
    cars: [
      { id: 'toyota-gr010', name: 'Toyota GR010 Hybrid', manufacturer: 'Toyota', year: 2022, imageFile: 'Gr010.jpg' },
      { id: 'peugeot-9x8', name: 'Peugeot 9X8', manufacturer: 'Peugeot', year: 2022, imageFile: '9x8.jpg' },
      { id: 'ferrari-499p', name: 'Ferrari 499P', manufacturer: 'Ferrari', year: 2023, imageFile: '499p.jpg' },
      { id: 'porsche-963', name: 'Porsche 963', manufacturer: 'Porsche', year: 2023, imageFile: '963.jpg' },
      { id: 'cadillac-v-lmdh', name: 'Cadillac V-Series.R', manufacturer: 'Cadillac', year: 2023, imageFile: 'Cadillac_vlmdh.jpg' }
    ]
  },
  {
    id: 'lmdh-gtp',
    name: 'LMDh/GTP',
    description: 'Le Mans Daytona hybrid cars. Factory-backed prototypes racing in IMSA and WEC.',
    tier: 'elite',
    era: '2023',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 18,
    raceLength: 'endurance',
    imageFile: 'Lmdh.jpg',
    cars: [
      { id: 'acura-arx-06', name: 'Acura ARX-06', manufacturer: 'Acura', year: 2023, imageFile: 'Arx06.jpg' },
      { id: 'bmw-m-hybrid-v8', name: 'BMW M Hybrid V8', manufacturer: 'BMW', year: 2023, imageFile: 'M_hybrid.jpg' },
      { id: 'cadillac-v-lmdh-2', name: 'Cadillac V-Series.R LMDh', manufacturer: 'Cadillac', year: 2023, imageFile: 'Cadillac_lmdh.jpg' },
      { id: 'porsche-963-lmdh', name: 'Porsche 963 LMDh', manufacturer: 'Porsche', year: 2023, imageFile: 'Porsche_963.jpg' },
      { id: 'lamborghini-sc63', name: 'Lamborghini SC63', manufacturer: 'Lamborghini', year: 2024, imageFile: 'Sc63.jpg' },
      { id: 'alpine-a424', name: 'Alpine A424', manufacturer: 'Alpine', year: 2024, imageFile: 'A424.jpg' }
    ]
  },

  // ============================================
  // TOURING CARS - Saloon/sedan racing
  // ============================================
  {
    id: 'tsi-cup',
    name: 'TSI Cup',
    description: 'Brazilian Volkswagen single-make series with turbocharged Golf TSI.',
    tier: 'entry',
    era: '2021',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road'],
    gridSize: 32,
    raceLength: 'sprint',
    imageFile: 'Tsi_cup.jpg',
    cars: [
      { id: 'vw-golf-tsi', name: 'Volkswagen Golf TSI Cup', manufacturer: 'Volkswagen', year: 2021, imageFile: 'Golf_tsi.jpg' },
      { id: 'vw-virtus-tsi', name: 'Volkswagen Virtus TSI Cup', manufacturer: 'Volkswagen', year: 2021, imageFile: 'Virtus_tsi.jpg' },
      { id: 'vw-polo-tsi', name: 'Volkswagen Polo TSI Cup', manufacturer: 'Volkswagen', year: 2021, imageFile: 'Polo_tsi.jpg' },
      { id: 'vw-jetta-tsi', name: 'Volkswagen Jetta TSI Cup', manufacturer: 'Volkswagen', year: 2021, imageFile: 'Jetta_tsi.jpg' }
    ]
  },
  {
    id: 'lancer-cup',
    name: 'Lancer Cup',
    description: 'Mitsubishi Lancer Evolution one-make series. AWD turbo sedan racing.',
    tier: 'amateur',
    era: '2007',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Lancer_cup.jpg',
    cars: [
      { id: 'mitsubishi-lancer-rs', name: 'Mitsubishi Lancer Evo X RS', manufacturer: 'Mitsubishi', year: 2007, imageFile: 'Lancer_rs.jpg' },
      { id: 'mitsubishi-lancer-cup', name: 'Mitsubishi Lancer Evo X Cup', manufacturer: 'Mitsubishi', year: 2007, imageFile: 'Lancer_cup.jpg' }
    ]
  },
  {
    id: 'sprint-race',
    name: 'Sprint Race',
    description: 'Brazilian entry-level touring car series with affordable production-based cars.',
    tier: 'entry',
    era: '2016',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road'],
    gridSize: 32,
    raceLength: 'sprint',
    imageFile: 'Sprint_race.jpg',
    cars: [
      { id: 'toyota-corolla-sr', name: 'Toyota Corolla Sprint Race', manufacturer: 'Toyota', year: 2016, imageFile: 'Corolla_sr.jpg' }
    ]
  },
  {
    id: 'super-v8',
    name: 'Super V8',
    description: 'Australian V8 Supercars-style racing with powerful rear-wheel drive touring cars.',
    tier: 'professional',
    era: '2018',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 26,
    raceLength: 'medium',
    imageFile: 'Super_v8.jpg',
    cars: [
      { id: 'super-v8', name: 'Super V8', manufacturer: 'Generic', year: 2018, imageFile: 'Super_v8.jpg' }
    ]
  },
  {
    id: 'arc',
    name: 'ARC (Aussie Racing Cars)',
    description: '5/8 scale Australian touring car replicas with identical specifications for close racing.',
    tier: 'entry',
    era: '2019',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road'],
    gridSize: 30,
    raceLength: 'sprint',
    imageFile: 'Arc.jpg',
    cars: [
      { id: 'arc-camaro', name: 'Aussie Racing Camaro', manufacturer: 'Chevrolet', year: 2019, imageFile: 'Arc_camaro.jpg' }
    ]
  },
  {
    id: 'supercar',
    name: 'Supercar',
    description: 'Australian Supercars Championship cars - V8-powered touring car legends.',
    tier: 'professional',
    era: '1995-2022',
    isModern: true,
    category: 'touring',
    suitableTrackTypes: ['road', 'street'],
    gridSize: 26,
    raceLength: 'medium',
    imageFile: 'Supercar.jpg',
    cars: [
      { id: 'ford-falcon-fg', name: 'Ford Falcon FG', manufacturer: 'Ford', year: 2015, imageFile: 'Falcon_fg.jpg' },
      { id: 'holden-commodore-vf', name: 'Holden Commodore VF', manufacturer: 'Holden', year: 2015, imageFile: 'Commodore_vf.jpg' },
      { id: 'ford-mustang-s550', name: 'Ford Mustang S550', manufacturer: 'Ford', year: 2019, imageFile: 'Mustang_s550.jpg' },
      { id: 'holden-zb-commodore', name: 'Holden ZB Commodore', manufacturer: 'Holden', year: 2018, imageFile: 'Zb_commodore.jpg' },
      { id: 'chevrolet-camaro-sc', name: 'Chevrolet Camaro Supercar', manufacturer: 'Chevrolet', year: 2022, imageFile: 'Camaro_sc.jpg' },
      { id: 'ford-mustang-gen3', name: 'Ford Mustang Gen3', manufacturer: 'Ford', year: 2023, imageFile: 'Mustang_gen3.jpg' }
    ]
  },

  // ============================================
  // STOCK CARS - Brazilian and American stock car racing
  // ============================================
  {
    id: 'stock-car-2024',
    name: 'Stock Car Pro Series 2024',
    description: 'The premier Brazilian touring car championship. Modern Cruze-based race cars.',
    tier: 'pro',
    era: '2024',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 30,
    raceLength: 'medium',
    imageFile: 'Stock_2024.jpg',
    cars: [
      { id: 'chevrolet-cruze-2024', name: 'Chevrolet Cruze Stock 2024', manufacturer: 'Chevrolet', year: 2024, imageFile: 'Cruze_2024.jpg' },
      { id: 'toyota-corolla-2024', name: 'Toyota Corolla Stock 2024', manufacturer: 'Toyota', year: 2024, imageFile: 'Corolla_2024.jpg' }
    ]
  },
  {
    id: 'stock-car-2023',
    name: 'Stock Car Pro Series 2023',
    description: 'Brazilian Stock Car championship with Cruze and Corolla.',
    tier: 'pro',
    era: '2023',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 30,
    raceLength: 'medium',
    imageFile: 'Stock_2023.jpg',
    cars: [
      { id: 'chevrolet-cruze-2023', name: 'Chevrolet Cruze Stock 2023', manufacturer: 'Chevrolet', year: 2023, imageFile: 'Cruze_2023.jpg' },
      { id: 'toyota-corolla-2023', name: 'Toyota Corolla Stock 2023', manufacturer: 'Toyota', year: 2023, imageFile: 'Corolla_2023.jpg' }
    ]
  },
  {
    id: 'stock-car-2022',
    name: 'Stock Car Pro Series 2022',
    description: 'Brazilian Stock Car with the new generation of race cars.',
    tier: 'professional',
    era: '2022',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 30,
    raceLength: 'medium',
    imageFile: 'Stock_2022.jpg',
    cars: [
      { id: 'chevrolet-cruze-2022', name: 'Chevrolet Cruze Stock 2022', manufacturer: 'Chevrolet', year: 2022, imageFile: 'Cruze_2022.jpg' },
      { id: 'toyota-corolla-2022', name: 'Toyota Corolla Stock 2022', manufacturer: 'Toyota', year: 2022, imageFile: 'Corolla_2022.jpg' }
    ]
  },
  {
    id: 'stock-usa-gen3',
    name: 'Stock USA Gen 3 (NASCAR Next Gen)',
    description: 'Modern NASCAR Cup Series car. The cutting-edge of American stock car racing.',
    tier: 'professional',
    era: '2022',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 40,
    raceLength: 'endurance',
    imageFile: 'Nascar_gen3.jpg',
    cars: [
      { id: 'nascar-nextgen', name: 'NASCAR Next Gen', manufacturer: 'Generic', year: 2022, imageFile: 'Nascar_gen3.jpg' }
    ]
  },
  {
    id: 'stock-usa-gen3-lm',
    name: 'Stock USA Gen 3 LM',
    description: 'NASCAR Cup car configured for Le Mans-style endurance racing.',
    tier: 'professional',
    era: '2023',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road'],
    gridSize: 30,
    raceLength: 'endurance',
    imageFile: 'Nascar_gen3_lm.jpg',
    cars: [
      { id: 'nascar-nextgen-lm', name: 'NASCAR Next Gen LM', manufacturer: 'Generic', year: 2023, imageFile: 'Nascar_gen3_lm.jpg' }
    ]
  },
  {
    id: 'stock-usa-gen2',
    name: 'Stock USA Gen 2',
    description: 'Previous generation NASCAR Cup cars (2013-2021 era).',
    tier: 'professional',
    era: '2013-2021',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 40,
    raceLength: 'endurance',
    imageFile: 'Nascar_gen2.jpg',
    cars: [
      { id: 'nascar-gen2', name: 'NASCAR Gen 2', manufacturer: 'Generic', year: 2018, imageFile: 'Nascar_gen2.jpg' }
    ]
  },
  {
    id: 'stock-usa-gen1',
    name: 'Stock USA Gen 1',
    description: 'Classic NASCAR Cup cars from the Car of Tomorrow era.',
    tier: 'professional',
    era: '2007-2012',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road', 'oval'],
    gridSize: 40,
    raceLength: 'endurance',
    imageFile: 'Nascar_gen1.jpg',
    cars: [
      { id: 'nascar-gen1', name: 'NASCAR Gen 1', manufacturer: 'Generic', year: 2010, imageFile: 'Nascar_gen1.jpg' }
    ]
  },
  {
    id: 'old-stock-race',
    name: 'Old Stock Race',
    description: 'Brazilian classic stock car racing with restored vintage machines.',
    tier: 'amateur',
    era: '2014',
    isModern: true,
    category: 'stock',
    suitableTrackTypes: ['road'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Old_stock.jpg',
    cars: [
      { id: 'opala-old-stock', name: 'Chevrolet Opala Old Stock', manufacturer: 'Chevrolet', year: 2014, imageFile: 'Opala_old.jpg' }
    ]
  },

  // ============================================
  // RALLYCROSS
  // ============================================
  {
    id: 'rallycross',
    name: 'Rallycross',
    description: 'World Rallycross Championship-style cars. High-powered 4WD machines for mixed surfaces.',
    tier: 'professional',
    era: '2013-2016',
    isModern: true,
    category: 'rallycross',
    suitableTrackTypes: ['rallycross'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Rallycross.jpg',
    cars: [
      { id: 'ford-fiesta-rx', name: 'Ford Fiesta RX', manufacturer: 'Ford', year: 2015, imageFile: 'Fiesta_rx.jpg' },
      { id: 'peugeot-208-rx', name: 'Peugeot 208 RX', manufacturer: 'Peugeot', year: 2015, imageFile: '208_rx.jpg' },
      { id: 'vw-polo-rx', name: 'Volkswagen Polo RX', manufacturer: 'Volkswagen', year: 2016, imageFile: 'Polo_rx.jpg' },
      { id: 'audi-s1-rx', name: 'Audi S1 RX', manufacturer: 'Audi', year: 2016, imageFile: 'S1_rx.jpg' }
    ]
  },
  {
    id: 'super-trophy-truck',
    name: 'Super Trophy Truck',
    description: 'Off-road racing truck for desert and rallycross events.',
    tier: 'semi-pro',
    era: '2020',
    isModern: true,
    category: 'rallycross',
    suitableTrackTypes: ['rallycross'],
    gridSize: 16,
    raceLength: 'sprint',
    imageFile: 'Trophy_truck.jpg',
    cars: [
      { id: 'trophy-truck', name: 'Super Trophy Truck', manufacturer: 'Generic', year: 2020, imageFile: 'Trophy_truck.jpg' }
    ]
  },

  // ============================================
  // ROAD CARS - Street-legal vehicles
  // ============================================
  {
    id: 'street-car',
    name: 'Street Car',
    description: 'Road-legal supercars and sports cars for track day events.',
    tier: 'amateur',
    era: '2019',
    isModern: true,
    category: 'road',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'Street_car.jpg',
    cars: [
      { id: 'mclaren-720s-road', name: 'McLaren 720S', manufacturer: 'McLaren', year: 2019, imageFile: 'Mclaren_720s.jpg' }
    ]
  },

  // ============================================
  // LIGIER EUROPEAN SERIES (NEW)
  // ============================================
  {
    id: 'ligier-european',
    name: 'Ligier European Series',
    description: 'European prototype series with Ligier JS2 R and JS P4 cars.',
    tier: 'semi-pro',
    era: '2025',
    isModern: true,
    category: 'prototype',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Ligier_european.jpg',
    cars: [
      { id: 'ligier-js2-r', name: 'Ligier JS2 R', manufacturer: 'Ligier', year: 2025, imageFile: 'Ligier_js2r.jpg' },
      { id: 'ligier-jsp4', name: 'Ligier JS P4', manufacturer: 'Ligier', year: 2025, imageFile: 'Ligier_jsp4.jpg' }
    ]
  },

  // ============================================
  // HISTORIC/VINTAGE CLASSES - ONE-OFF EVENTS ONLY
  // ============================================
  {
    id: 'formula-classic-g1',
    name: 'Formula Classic Gen 1',
    description: '1970s Formula 1 cars. Ground-effect era single-seaters with incredible handling challenges.',
    tier: 'historic',
    era: '1977-1979',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'F_classic_g1.jpg',
    cars: [
      { id: 'lotus-79', name: 'Lotus 79', manufacturer: 'Lotus', year: 1978, imageFile: 'Lotus_79.jpg' },
      { id: 'brabham-bt46', name: 'Brabham BT46', manufacturer: 'Brabham', year: 1978, imageFile: 'Brabham_bt46.jpg' }
    ]
  },
  {
    id: 'formula-classic-g2',
    name: 'Formula Classic Gen 2',
    description: '1980s turbo Formula 1 cars. The most powerful F1 era with over 1000 HP.',
    tier: 'historic',
    era: '1986-1988',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'F_classic_g2.jpg',
    cars: [
      { id: 'mclaren-mp4-4', name: 'McLaren MP4/4', manufacturer: 'McLaren', year: 1988, imageFile: 'Mp4_4.jpg' },
      { id: 'lotus-98t', name: 'Lotus 98T', manufacturer: 'Lotus', year: 1986, imageFile: 'Lotus_98t.jpg' }
    ]
  },
  {
    id: 'formula-classic-g3',
    name: 'Formula Classic Gen 3',
    description: 'Early 1990s naturally aspirated F1 cars. The beginning of the modern era.',
    tier: 'historic',
    era: '1991-1992',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'F_classic_g3.jpg',
    cars: [
      { id: 'williams-fw14b', name: 'Williams FW14B', manufacturer: 'Williams', year: 1992, imageFile: 'Fw14b.jpg' },
      { id: 'mclaren-mp4-6', name: 'McLaren MP4/6', manufacturer: 'McLaren', year: 1991, imageFile: 'Mp4_6.jpg' }
    ]
  },
  {
    id: 'formula-retro-v10',
    name: 'Formula Retro (V10)',
    description: 'Late 1990s-2000s V10 Formula 1 cars. The screaming naturally aspirated era.',
    tier: 'historic',
    era: '1997-2005',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'F_retro.jpg',
    cars: [
      { id: 'ferrari-f2004', name: 'Ferrari F2004', manufacturer: 'Ferrari', year: 2004, imageFile: 'F2004.jpg' },
      { id: 'mclaren-mp4-20', name: 'McLaren MP4-20', manufacturer: 'McLaren', year: 2005, imageFile: 'Mp4_20.jpg' }
    ]
  },
  {
    id: 'group-c',
    name: 'Group C',
    description: '1980s Le Mans prototypes. Legendary endurance racing cars from the golden era.',
    tier: 'historic',
    era: '1987-1989',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'endurance',
    imageFile: 'Group_c.jpg',
    cars: [
      { id: 'porsche-962c', name: 'Porsche 962C', manufacturer: 'Porsche', year: 1988, imageFile: 'Porsche_962c.jpg' },
      { id: 'jaguar-xjr-9', name: 'Jaguar XJR-9', manufacturer: 'Jaguar', year: 1988, imageFile: 'Xjr9.jpg' },
      { id: 'sauber-c9', name: 'Sauber C9', manufacturer: 'Mercedes', year: 1989, imageFile: 'Sauber_c9.jpg' },
      { id: 'nissan-r89c', name: 'Nissan R89C', manufacturer: 'Nissan', year: 1989, imageFile: 'R89c.jpg' }
    ]
  },
  {
    id: 'group-a',
    name: 'Group A',
    description: 'Touring car champions from the early 1990s. Iconic DTM-era racers.',
    tier: 'historic',
    era: '1992',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Group_a.jpg',
    cars: [
      { id: 'mercedes-190e', name: 'Mercedes 190E EVO II', manufacturer: 'Mercedes', year: 1992, imageFile: 'Mercedes_190e.jpg' },
      { id: 'bmw-m3-e30', name: 'BMW M3 E30', manufacturer: 'BMW', year: 1992, imageFile: 'M3_e30.jpg' },
      { id: 'alfa-romeo-155', name: 'Alfa Romeo 155 V6 TI', manufacturer: 'Alfa Romeo', year: 1993, imageFile: 'Alfa_155.jpg' }
    ]
  },
  {
    id: 'gt1',
    name: 'GT1',
    description: 'Late 1990s GT1 homologation specials. Barely road-legal supercars built to win Le Mans.',
    tier: 'historic',
    era: '1997-1998',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'endurance',
    imageFile: 'Gt1.jpg',
    cars: [
      { id: 'mclaren-f1-gtr', name: 'McLaren F1 GTR', manufacturer: 'McLaren', year: 1997, imageFile: 'F1_gtr.jpg' },
      { id: 'mercedes-clk-gtr', name: 'Mercedes CLK GTR', manufacturer: 'Mercedes', year: 1998, imageFile: 'Clk_gtr.jpg' },
      { id: 'porsche-911-gt1', name: 'Porsche 911 GT1', manufacturer: 'Porsche', year: 1998, imageFile: '911_gt1.jpg' },
      { id: 'nissan-r390-gt1', name: 'Nissan R390 GT1', manufacturer: 'Nissan', year: 1998, imageFile: 'R390.jpg' }
    ]
  },
  {
    id: 'gt1-2005',
    name: 'GT1 2005',
    description: 'FIA GT Championship 2005 cars. The last of the ultra-powerful GT machines.',
    tier: 'historic',
    era: '2005',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'endurance',
    imageFile: 'Gt1_2005.jpg',
    cars: [
      { id: 'maserati-mc12-gt1', name: 'Maserati MC12 GT1', manufacturer: 'Maserati', year: 2005, imageFile: 'Mc12_gt1.jpg' },
      { id: 'saleen-s7r', name: 'Saleen S7R', manufacturer: 'Saleen', year: 2005, imageFile: 'S7r.jpg' },
      { id: 'corvette-c6r-gt1', name: 'Corvette C6.R GT1', manufacturer: 'Chevrolet', year: 2005, imageFile: 'C6r_gt1.jpg' },
      { id: 'aston-martin-dbr9', name: 'Aston Martin DBR9', manufacturer: 'Aston Martin', year: 2005, imageFile: 'Dbr9.jpg' },
      { id: 'ferrari-550-maranello', name: 'Ferrari 550 Maranello', manufacturer: 'Ferrari', year: 2005, imageFile: '550_maranello.jpg' }
    ]
  },
  {
    id: 'gt2-2005',
    name: 'GT2 2005',
    description: 'FIA GT2 class from 2005. Production-based supercars.',
    tier: 'historic',
    era: '2005',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'medium',
    imageFile: 'Gt2_2005.jpg',
    cars: [
      { id: 'ferrari-f430-gt2', name: 'Ferrari F430 GT2', manufacturer: 'Ferrari', year: 2005, imageFile: 'F430_gt2.jpg' },
      { id: 'porsche-996-gt3-rsr', name: 'Porsche 996 GT3 RSR', manufacturer: 'Porsche', year: 2005, imageFile: '996_rsr.jpg' }
    ]
  },
  {
    id: 'gt-open',
    name: 'GT Open',
    description: 'International GT Open series cars from 2006-2011.',
    tier: 'historic',
    era: '2006-2011',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'medium',
    imageFile: 'Gt_open.jpg',
    cars: [
      { id: 'ferrari-458-gt-open', name: 'Ferrari 458 GT Open', manufacturer: 'Ferrari', year: 2011, imageFile: '458_gt_open.jpg' },
      { id: 'porsche-997-gt-open', name: 'Porsche 997 GT Open', manufacturer: 'Porsche', year: 2010, imageFile: '997_gt_open.jpg' }
    ]
  },
  {
    id: 'gt-classic',
    name: 'GT Classic',
    description: 'Legendary 1970s GT racing cars. The era of the original supercar racers.',
    tier: 'historic',
    era: '1971-1974',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'medium',
    imageFile: 'Gt_classic.jpg',
    cars: [
      { id: 'ferrari-512m', name: 'Ferrari 512M', manufacturer: 'Ferrari', year: 1971, imageFile: '512m.jpg' },
      { id: 'porsche-917k', name: 'Porsche 917K', manufacturer: 'Porsche', year: 1971, imageFile: '917k.jpg' },
      { id: 'ford-gt40', name: 'Ford GT40 Mk IV', manufacturer: 'Ford', year: 1967, imageFile: 'Gt40.jpg' }
    ]
  },
  {
    id: 'lmp1-2005',
    name: 'LMP1 2005',
    description: 'Le Mans Prototype 1 from 2005. Open-top sports car racing.',
    tier: 'historic',
    era: '2005',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'endurance',
    imageFile: 'Lmp1_2005.jpg',
    cars: [
      { id: 'audi-r8-lmp', name: 'Audi R8 LMP', manufacturer: 'Audi', year: 2005, imageFile: 'Audi_r8_lmp.jpg' },
      { id: 'pescarolo-c60', name: 'Pescarolo C60', manufacturer: 'Pescarolo', year: 2005, imageFile: 'C60.jpg' },
      { id: 'zytek-05s', name: 'Zytek 05S', manufacturer: 'Zytek', year: 2005, imageFile: 'Zytek_05s.jpg' }
    ]
  },
  {
    id: 'lmp2-2005',
    name: 'LMP2 2005',
    description: 'Le Mans Prototype 2 from 2005. Smaller displacement endurance racers.',
    tier: 'historic',
    era: '2005',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'endurance',
    imageFile: 'Lmp2_2005.jpg',
    cars: [
      { id: 'lola-b05-40', name: 'Lola B05/40', manufacturer: 'Lola', year: 2005, imageFile: 'Lola_b05.jpg' },
      { id: 'radical-sr9', name: 'Radical SR9', manufacturer: 'Radical', year: 2005, imageFile: 'Sr9.jpg' }
    ]
  },
  {
    id: 'gtr-2004',
    name: 'GTR 2004',
    description: 'FIA GT Championship 2004 car.',
    tier: 'historic',
    era: '2004',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 22,
    raceLength: 'medium',
    imageFile: 'Gtr_2004.jpg',
    cars: [
      { id: 'ferrari-575-gtc', name: 'Ferrari 575 GTC', manufacturer: 'Ferrari', year: 2004, imageFile: '575_gtc.jpg' }
    ]
  },
  {
    id: 'm1-procar',
    name: 'BMW M1 Procar',
    description: 'The legendary BMW M1 Procar series from 1979-1980.',
    tier: 'historic',
    era: '1979',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 20,
    raceLength: 'sprint',
    imageFile: 'M1_procar.jpg',
    cars: [
      { id: 'bmw-m1-procar', name: 'BMW M1 Procar', manufacturer: 'BMW', year: 1979, imageFile: 'M1_procar.jpg' }
    ]
  },
  {
    id: 'hot-cars',
    name: 'Hot Cars',
    description: 'Brazilian Hot Cars series from 1983. Classic stock car racing.',
    tier: 'historic',
    era: '1983',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Hot_cars.jpg',
    cars: [
      { id: 'opala-hot', name: 'Chevrolet Opala Hot Cars', manufacturer: 'Chevrolet', year: 1983, imageFile: 'Opala_hot.jpg' },
      { id: 'maverick-hot', name: 'Ford Maverick Hot Cars', manufacturer: 'Ford', year: 1983, imageFile: 'Maverick_hot.jpg' },
      { id: 'passat-hot', name: 'Volkswagen Passat Hot Cars', manufacturer: 'Volkswagen', year: 1983, imageFile: 'Passat_hot.jpg' },
      { id: 'charger-hot', name: 'Dodge Charger Hot Cars', manufacturer: 'Dodge', year: 1983, imageFile: 'Charger_hot.jpg' }
    ]
  },
  {
    id: 'stock-car-1979',
    name: 'Stock Car Brasil 1979',
    description: 'The first year of Brazilian Stock Car championship.',
    tier: 'historic',
    era: '1979',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Stock_1979.jpg',
    cars: [
      { id: 'opala-1979', name: 'Chevrolet Opala 1979', manufacturer: 'Chevrolet', year: 1979, imageFile: 'Opala_1979.jpg' }
    ]
  },
  {
    id: 'stock-car-1986',
    name: 'Stock Car Brasil 1986',
    description: 'Brazilian Stock Car from the mid-1980s.',
    tier: 'historic',
    era: '1986',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Stock_1986.jpg',
    cars: [
      { id: 'opala-1986', name: 'Chevrolet Opala 1986', manufacturer: 'Chevrolet', year: 1986, imageFile: 'Opala_1986.jpg' }
    ]
  },
  {
    id: 'stock-car-1999',
    name: 'Stock Car Brasil 1999',
    description: 'Brazilian Stock Car from the Omega/Vectra era.',
    tier: 'historic',
    era: '1999',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Stock_1999.jpg',
    cars: [
      { id: 'omega-1999', name: 'Chevrolet Omega 1999', manufacturer: 'Chevrolet', year: 1999, imageFile: 'Omega_1999.jpg' }
    ]
  },
  {
    id: 'vintage-touring-t1',
    name: 'Vintage Touring Cars Tier 1',
    description: '1970s touring car racing with powerful American and European machines.',
    tier: 'historic',
    era: '1973',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Vtc_t1.jpg',
    cars: [
      { id: 'ford-capri-vtc', name: 'Ford Capri RS3100', manufacturer: 'Ford', year: 1973, imageFile: 'Capri_vtc.jpg' },
      { id: 'bmw-3500-csl', name: 'BMW 3.5 CSL', manufacturer: 'BMW', year: 1973, imageFile: 'Bmw_csl.jpg' },
      { id: 'porsche-carrera-rsr', name: 'Porsche Carrera RSR', manufacturer: 'Porsche', year: 1973, imageFile: 'Carrera_rsr.jpg' }
    ]
  },
  {
    id: 'vintage-touring-t2',
    name: 'Vintage Touring Cars Tier 2',
    description: '1960s touring car racing with smaller displacement cars.',
    tier: 'historic',
    era: '1962-1965',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 26,
    raceLength: 'sprint',
    imageFile: 'Vtc_t2.jpg',
    cars: [
      { id: 'mini-cooper-s-1965', name: 'MINI Cooper S 1965', manufacturer: 'MINI', year: 1965, imageFile: 'Mini_65.jpg' },
      { id: 'alfa-gta', name: 'Alfa Romeo GTA', manufacturer: 'Alfa Romeo', year: 1965, imageFile: 'Alfa_gta.jpg' }
    ]
  },
  {
    id: 'copa-classic-b',
    name: 'Copa Classic B',
    description: 'Brazilian classic car racing series featuring iconic 1980s cars.',
    tier: 'historic',
    era: '2011',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 28,
    raceLength: 'sprint',
    imageFile: 'Copa_classic_b.jpg',
    cars: [
      { id: 'chevette-classic', name: 'Chevrolet Chevette Classic B', manufacturer: 'Chevrolet', year: 2011, imageFile: 'Chevette_classic.jpg' },
      { id: 'uno-classic', name: 'Fiat Uno Classic B', manufacturer: 'Fiat', year: 2011, imageFile: 'Uno_classic.jpg' },
      { id: 'gol-classic', name: 'Volkswagen Gol Classic B', manufacturer: 'Volkswagen', year: 2011, imageFile: 'Gol_classic.jpg' },
      { id: 'passat-classic', name: 'Volkswagen Passat Classic B', manufacturer: 'Volkswagen', year: 2011, imageFile: 'Passat_classic.jpg' },
      { id: 'mini-classic', name: 'MINI Cooper S 1965 Classic B', manufacturer: 'MINI', year: 2011, imageFile: 'Mini_classic.jpg' },
      { id: 'puma-gte', name: 'Puma GTE', manufacturer: 'Puma', year: 2011, imageFile: 'Puma_gte.jpg' }
    ]
  },
  {
    id: 'copa-classic-fl',
    name: 'Copa Classic FL',
    description: 'Brazilian classic car racing with rear-engine sportscars.',
    tier: 'historic',
    era: '2011',
    isModern: false, // ONE-OFF EVENTS ONLY
    category: 'vintage',
    suitableTrackTypes: ['road'],
    gridSize: 24,
    raceLength: 'sprint',
    imageFile: 'Copa_classic_fl.jpg',
    cars: [
      { id: 'puma-gtb', name: 'Puma GTB', manufacturer: 'Puma', year: 2011, imageFile: 'Puma_gtb.jpg' }
    ]
  }
];

// Helper functions

/**
 * Get all modern car classes suitable for full season racing
 */
export function getModernClasses(): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => c.isModern);
}

/**
 * Get all historic car classes (one-off events only)
 */
export function getHistoricClasses(): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => !c.isModern);
}

/**
 * Get car classes by tier
 */
export function getClassesByTier(tier: CarClass['tier']): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => c.tier === tier);
}

/**
 * Get car classes by category
 */
export function getClassesByCategory(category: CarClass['category']): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => c.category === category);
}

/**
 * Get entry-level classes for career start
 */
export function getEntryLevelClasses(): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => c.tier === 'entry' && c.isModern);
}

/**
 * Get the career progression ladder
 * Returns classes organized by tier for career advancement
 * Tier order: entry -> amateur -> semi-pro -> professional -> pro -> elite -> pinnacle
 */
export function getCareerLadder(): { tier: ChampionshipTier; classes: CarClass[] }[] {
  const tiers: ChampionshipTier[] = ['entry', 'amateur', 'semi-pro', 'professional', 'pro', 'elite', 'pinnacle'];
  return tiers.map(tier => ({
    tier,
    classes: AMS2_CAR_CLASSES.filter(c => c.tier === tier && c.isModern)
  }));
}

/**
 * Get reputation requirements for each tier
 */
export const TIER_REPUTATION_REQUIREMENTS: Record<ChampionshipTier, { min: number; max: number }> = {
  'entry': { min: 0, max: 20 },
  'amateur': { min: 15, max: 35 },
  'semi-pro': { min: 30, max: 50 },
  'professional': { min: 45, max: 65 },
  'pro': { min: 60, max: 80 },
  'elite': { min: 75, max: 90 },
  'pinnacle': { min: 85, max: 100 },
  'historic': { min: 0, max: 100 } // Historic events available at any reputation
};

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: ChampionshipTier): string {
  const names: Record<ChampionshipTier, string> = {
    'entry': 'Entry Level',
    'amateur': 'Amateur',
    'semi-pro': 'Semi-Professional',
    'professional': 'Professional',
    'pro': 'Pro Series',
    'elite': 'Elite',
    'pinnacle': 'Pinnacle',
    'historic': 'Historic'
  };
  return names[tier] || tier;
}

/**
 * Get minimum reputation for a tier
 */
export function getMinReputationForTier(tier: ChampionshipTier): number {
  return TIER_REPUTATION_REQUIREMENTS[tier]?.min ?? 0;
}

/**
 * Get all image files that need to be downloaded
 */
export function getAllImageFiles(): string[] {
  const images: string[] = [];
  AMS2_CAR_CLASSES.forEach(carClass => {
    if (carClass.imageFile) images.push(carClass.imageFile);
    carClass.cars.forEach(car => {
      if (car.imageFile) images.push(car.imageFile);
    });
  });
  return [...new Set(images)]; // Remove duplicates
}

/**
 * Get total car count
 */
export function getTotalCarCount(): number {
  return AMS2_CAR_CLASSES.reduce((sum, c) => sum + c.cars.length, 0);
}

