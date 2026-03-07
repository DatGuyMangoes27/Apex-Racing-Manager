// ============================================
// REAL ESTATE CONFIGURATION
// ============================================
// Configuration for personal property ownership including
// primary residences, investment properties, and commercial real estate.

import type { Country } from './personal-finance-config'

// ============================================
// PROPERTY TYPES
// ============================================

export type PropertyType = 
  | 'apartment'       // Urban living, lower maintenance
  | 'house'           // Suburban family home
  | 'villa'           // Luxury residence
  | 'mansion'         // Ultra-luxury estate
  | 'penthouse'       // Top-floor luxury apartment
  | 'beach_house'     // Vacation property
  | 'ski_chalet'      // Mountain retreat
  | 'commercial'      // Business property (shops, offices)
  | 'land'            // Undeveloped land for appreciation

export type PropertyStatus = 
  | 'primary_residence'   // Where you live
  | 'vacation_home'       // Second home for personal use
  | 'rental'              // Income-generating rental
  | 'vacant'              // Owned but unused
  | 'under_renovation'    // Being upgraded
  | 'for_sale'            // Listed for sale
  | 'player_rental'       // Player is renting this property (not owning)

// ============================================
// PROPERTY INTERFACE
// ============================================

export interface Property {
  id: string
  name: string
  type: PropertyType
  status: PropertyStatus
  
  // Location
  country: Country
  city: string
  neighborhood: string    // e.g., "Monaco - Monte Carlo", "London - Mayfair"
  
  // Value
  purchasePrice: number
  purchaseDate: { week: number; year: number }
  currentValue: number
  lastValuationDate: { week: number; year: number }
  appreciationRate: number  // Annual rate, varies by location
  
  // Costs
  monthlyMaintenance: number
  annualPropertyTax: number
  insuranceCost: number
  
  // Mortgage (if any)
  mortgageId?: string
  
  // Rental (if status is 'rental')
  rental?: PropertyRental
  
  // Renovation
  renovation?: PropertyRenovation
  
  // Features and perks
  features: PropertyFeature[]
  perks: PropertyPerk[]
  
  // Quality and condition
  quality: PropertyQuality
  condition: number       // 0-100, degrades over time without maintenance
  
  // Size
  squareMeters: number
  bedrooms: number
  bathrooms: number
  garageSpaces: number
  
  // Player rental fields (when player rents rather than owns)
  isPlayerRental?: boolean     // Player is renting this (not owning)
  monthlyRent?: number         // Rent cost if renting
  leaseMonths?: number         // Lease term in months
}

export interface PropertyRental {
  isRented: boolean
  monthlyRent: number
  tenantQuality: 'excellent' | 'good' | 'average' | 'problematic'
  leaseStartDate?: { week: number; year: number }
  leaseEndDate?: { week: number; year: number }
  occupancyRate: number     // Historical occupancy %
  managementFee: number     // % of rent for property management
  lastMaintenanceRequest?: { week: number; year: number; cost: number }
}

export interface PropertyRenovation {
  type: RenovationType
  startDate: { week: number; year: number }
  completionDate: { week: number; year: number }
  cost: number
  valueIncrease: number     // How much it adds to property value
  qualityUpgrade?: PropertyQuality
  inProgress: boolean
}

export type RenovationType = 
  | 'basic_refresh'       // Paint, minor fixes
  | 'kitchen_upgrade'     // Modern kitchen
  | 'bathroom_upgrade'    // Luxury bathrooms
  | 'full_renovation'     // Complete overhaul
  | 'luxury_conversion'   // Convert to higher tier
  | 'extension'           // Add space
  | 'smart_home'          // Technology upgrades
  | 'eco_upgrade'         // Energy efficiency

export type PropertyFeature = 
  | 'pool'
  | 'gym'
  | 'home_cinema'
  | 'wine_cellar'
  | 'spa'
  | 'tennis_court'
  | 'helipad'
  | 'boat_dock'
  | 'racing_simulator'
  | 'car_collection_garage'
  | 'staff_quarters'
  | 'security_system'
  | 'smart_home'
  | 'solar_panels'
  | 'garden'
  | 'rooftop_terrace'
  | 'private_elevator'
  | 'concierge'

export type PropertyQuality = 
  | 'basic'           // Standard quality
  | 'good'            // Above average
  | 'premium'         // High quality
  | 'luxury'          // Luxury finishes
  | 'ultra_luxury'    // The best money can buy

// ============================================
// PROPERTY PERKS
// ============================================

export interface PropertyPerk {
  type: PropertyPerkType
  value: number
  description: string
}

export type PropertyPerkType = 
  | 'reputation_bonus'        // Living in prestigious area
  | 'sponsor_attraction'      // Impressive address for meetings
  | 'staff_discount'          // Easier staff recruitment
  | 'family_happiness'        // Better for family life
  | 'stress_reduction'        // Relaxing environment
  | 'networking'              // Neighbors are influential
  | 'media_appeal'            // Good for photoshoots
  | 'privacy'                 // Away from paparazzi
  | 'tax_benefit'             // Location-based tax advantages

// ============================================
// LOCATION-BASED PROPERTY DATA
// ============================================

export interface LocationPropertyMarket {
  country: Country
  city: string
  neighborhoods: NeighborhoodData[]
  averageAppreciation: number   // Annual %
  rentalYield: number           // Annual % of property value
  propertyTaxRate: number       // Annual % of property value
  marketHeat: 'cold' | 'normal' | 'hot' | 'bubble'  // Affects appreciation
}

export interface NeighborhoodData {
  name: string
  prestige: 'modest' | 'middle_class' | 'affluent' | 'prestigious' | 'ultra_elite'
  priceMultiplier: number       // Relative to city average
  rentalDemand: 'low' | 'medium' | 'high' | 'very_high'
  perks: PropertyPerk[]
  availableTypes: PropertyType[]
  description: string
}

// ============================================
// PROPERTY MARKET DATA
// ============================================

export const PROPERTY_MARKETS: LocationPropertyMarket[] = [
  // ============================================================
  // EUROPE (~25 cities)
  // ============================================================
  
  // --- Monaco ---
  {
    country: 'Monaco',
    city: 'Monaco',
    averageAppreciation: 0.03,
    rentalYield: 0.025,
    propertyTaxRate: 0,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Monte Carlo',
        prestige: 'ultra_elite',
        priceMultiplier: 1.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'reputation_bonus', value: 30, description: 'The most prestigious address in racing' },
          { type: 'sponsor_attraction', value: 25, description: 'Sponsors love Monaco meetings' },
          { type: 'networking', value: 30, description: 'Billionaire neighbors' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['penthouse', 'apartment', 'villa'],
        description: 'The heart of luxury living, home to racing royalty and billionaires'
      },
      {
        name: 'Fontvieille',
        prestige: 'prestigious',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Monaco address' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'More residential area of Monaco, slightly more affordable'
      },
      {
        name: 'La Condamine',
        prestige: 'middle_class',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment'],
        description: 'The commercial center of Monaco, more accessible pricing'
      }
    ]
  },

  // --- United Kingdom ---
  {
    country: 'United Kingdom',
    city: 'London',
    averageAppreciation: 0.04,
    rentalYield: 0.035,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Mayfair',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Most exclusive London address' },
          { type: 'sponsor_attraction', value: 20, description: 'Prime location for business' },
          { type: 'networking', value: 25, description: 'Elite social circle' }
        ],
        availableTypes: ['apartment', 'penthouse', 'mansion'],
        description: 'The pinnacle of London luxury, home to aristocrats and tycoons'
      },
      {
        name: 'Chelsea',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Fashionable address' },
          { type: 'family_happiness', value: 10, description: 'Good schools nearby' }
        ],
        availableTypes: ['house', 'apartment', 'mansion'],
        description: 'Affluent and fashionable, popular with celebrities and families'
      },
      {
        name: 'Surrey Countryside',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 20, description: 'Space and nature for family' },
          { type: 'stress_reduction', value: 15, description: 'Peaceful countryside' },
          { type: 'privacy', value: 20, description: 'Away from city attention' }
        ],
        availableTypes: ['house', 'villa', 'mansion', 'land'],
        description: 'Motorsport Valley adjacent, many F1 team principals live here'
      },
      {
        name: 'Canary Wharf',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'networking', value: 15, description: 'Financial district connections' },
          { type: 'sponsor_attraction', value: 10, description: 'Business hub location' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Modern financial district with river views and skyline apartments'
      },
      {
        name: 'Knightsbridge',
        prestige: 'ultra_elite',
        priceMultiplier: 1.8,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 22, description: 'World-renowned luxury address' },
          { type: 'media_appeal', value: 15, description: 'Near Harrods and Hyde Park' }
        ],
        availableTypes: ['apartment', 'penthouse', 'mansion'],
        description: 'Home to Harrods and some of London\'s most expensive real estate'
      },
      {
        name: 'Notting Hill',
        prestige: 'prestigious',
        priceMultiplier: 1.4,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'Trendy and fashionable area' },
          { type: 'stress_reduction', value: 10, description: 'Charming village feel' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Charming townhouses and colourful streets in West London'
      },
      {
        name: 'Shoreditch',
        prestige: 'middle_class',
        priceMultiplier: 0.7,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 10, description: 'Creative and trendy area' }
        ],
        availableTypes: ['apartment'],
        description: 'East London\'s creative hub with a vibrant nightlife scene'
      }
    ]
  },
  {
    country: 'United Kingdom',
    city: 'Oxford',
    averageAppreciation: 0.035,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Summertown',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 15, description: 'Excellent schools' },
          { type: 'networking', value: 10, description: 'Academic connections' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Leafy north Oxford suburb popular with academics and professionals'
      },
      {
        name: 'Jericho',
        prestige: 'middle_class',
        priceMultiplier: 0.35,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Canal-side walks' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Bohemian neighbourhood with independent shops and cafes'
      }
    ]
  },
  {
    country: 'United Kingdom',
    city: 'Edinburgh',
    averageAppreciation: 0.035,
    rentalYield: 0.04,
    propertyTaxRate: 0.011,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'New Town',
        prestige: 'prestigious',
        priceMultiplier: 0.7,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'UNESCO World Heritage site' },
          { type: 'stress_reduction', value: 10, description: 'Georgian architecture and gardens' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Elegant Georgian terraces in the heart of Edinburgh'
      },
      {
        name: 'Stockbridge',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Village atmosphere in the city' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Charming village-like area with weekend farmers market'
      }
    ]
  },
  {
    country: 'United Kingdom',
    city: 'Manchester',
    averageAppreciation: 0.04,
    rentalYield: 0.05,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Didsbury',
        prestige: 'middle_class',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Parks and good schools' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Popular leafy suburb with a village feel and great restaurants'
      },
      {
        name: 'Deansgate',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'networking', value: 10, description: 'City centre business connections' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Manchester\'s premier city centre street with sleek high-rises'
      }
    ]
  },
  {
    country: 'United Kingdom',
    city: 'Silverstone Area',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.011,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Brackley',
        prestige: 'middle_class',
        priceMultiplier: 0.25,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 15, description: 'Heart of Motorsport Valley' },
          { type: 'privacy', value: 10, description: 'Quiet countryside living' }
        ],
        availableTypes: ['house', 'land'],
        description: 'Home to Mercedes F1 HQ and the heart of UK motorsport'
      }
    ]
  },

  // --- France ---
  {
    country: 'France',
    city: 'Nice',
    averageAppreciation: 0.03,
    rentalYield: 0.035,
    propertyTaxRate: 0.01,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Cap Ferrat',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'French Riviera prestige' },
          { type: 'stress_reduction', value: 25, description: 'Mediterranean paradise' },
          { type: 'privacy', value: 25, description: 'Secluded peninsula' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'The most exclusive peninsula on the French Riviera'
      },
      {
        name: 'Antibes',
        prestige: 'affluent',
        priceMultiplier: 0.7,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Seaside relaxation' }
        ],
        availableTypes: ['apartment', 'beach_house', 'villa'],
        description: 'Historic coastal town with beautiful beaches and old town charm'
      },
      {
        name: 'Cannes',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 18, description: 'Festival and glamour city' },
          { type: 'media_appeal', value: 20, description: 'Film festival connections' }
        ],
        availableTypes: ['apartment', 'penthouse', 'villa'],
        description: 'Glamorous city famous for its film festival and luxury yachts'
      }
    ]
  },
  {
    country: 'France',
    city: 'Paris',
    averageAppreciation: 0.03,
    rentalYield: 0.03,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: '16th Arrondissement',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Paris\' most prestigious district' },
          { type: 'networking', value: 20, description: 'Old money social circles' }
        ],
        availableTypes: ['apartment', 'penthouse', 'mansion'],
        description: 'The aristocratic heart of Paris with Haussmann apartments and embassies'
      },
      {
        name: 'Le Marais',
        prestige: 'prestigious',
        priceMultiplier: 1.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 15, description: 'Trendy historic district' },
          { type: 'stress_reduction', value: 10, description: 'Charming streets and cafes' }
        ],
        availableTypes: ['apartment'],
        description: 'Historic district with medieval architecture and trendy boutiques'
      },
      {
        name: 'Saint-Germain',
        prestige: 'prestigious',
        priceMultiplier: 1.7,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 18, description: 'Intellectual Left Bank prestige' },
          { type: 'networking', value: 15, description: 'Literary and arts connections' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'The intellectual heart of Paris on the Left Bank'
      },
      {
        name: 'Montmartre',
        prestige: 'middle_class',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Artistic bohemian atmosphere' }
        ],
        availableTypes: ['apartment'],
        description: 'Artistic hilltop neighbourhood with views of the city'
      }
    ]
  },
  {
    country: 'France',
    city: 'Lyon',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Presqu\'ile',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Riverside living between two rivers' }
        ],
        availableTypes: ['apartment'],
        description: 'The peninsula between the Rhone and Saone rivers'
      },
      {
        name: 'Croix-Rousse',
        prestige: 'middle_class',
        priceMultiplier: 0.35,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 8, description: 'Village atmosphere on a hill' }
        ],
        availableTypes: ['apartment'],
        description: 'Former silk-weaving district with bohemian charm'
      }
    ]
  },

  // --- Switzerland ---
  {
    country: 'Switzerland',
    city: 'Geneva',
    averageAppreciation: 0.02,
    rentalYield: 0.025,
    propertyTaxRate: 0.005,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Cologny',
        prestige: 'ultra_elite',
        priceMultiplier: 1.8,
        rentalDemand: 'medium',
        perks: [
          { type: 'tax_benefit', value: 50, description: 'Favorable Swiss taxation' },
          { type: 'privacy', value: 30, description: 'Discreet Swiss banking culture' },
          { type: 'networking', value: 20, description: 'Global elite neighbors' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'Exclusive lakeside community, home to racing drivers and billionaires'
      },
      {
        name: 'Champel',
        prestige: 'prestigious',
        priceMultiplier: 1.2,
        rentalDemand: 'medium',
        perks: [
          { type: 'tax_benefit', value: 50, description: 'Swiss tax advantages' },
          { type: 'family_happiness', value: 12, description: 'Parks and international schools' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Upscale residential area near parks and international organisations'
      }
    ]
  },
  {
    country: 'Switzerland',
    city: 'Zurich',
    averageAppreciation: 0.02,
    rentalYield: 0.025,
    propertyTaxRate: 0.005,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Seefeld',
        prestige: 'prestigious',
        priceMultiplier: 1.5,
        rentalDemand: 'high',
        perks: [
          { type: 'tax_benefit', value: 40, description: 'Swiss tax benefits' },
          { type: 'stress_reduction', value: 15, description: 'Lake views and waterfront walks' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Lakeside district with beautiful views and upscale restaurants'
      },
      {
        name: 'Enge',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'high',
        perks: [
          { type: 'tax_benefit', value: 40, description: 'Swiss tax advantages' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Charming district on the west bank of Lake Zurich'
      }
    ]
  },

  // --- Germany ---
  {
    country: 'Germany',
    city: 'Munich',
    averageAppreciation: 0.035,
    rentalYield: 0.03,
    propertyTaxRate: 0.01,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Bogenhausen',
        prestige: 'prestigious',
        priceMultiplier: 1.2,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Munich\'s most exclusive district' },
          { type: 'networking', value: 12, description: 'BMW and Siemens executives nearby' }
        ],
        availableTypes: ['villa', 'house', 'apartment'],
        description: 'Munich\'s prestigious district with stately homes and embassies'
      },
      {
        name: 'Starnberg',
        prestige: 'affluent',
        priceMultiplier: 0.8,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Lakeside relaxation' },
          { type: 'family_happiness', value: 12, description: 'Nature and excellent schools' }
        ],
        availableTypes: ['house', 'villa', 'land'],
        description: 'Idyllic lakeside town south of Munich, popular with the wealthy'
      },
      {
        name: 'Schwabing',
        prestige: 'middle_class',
        priceMultiplier: 0.6,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 8, description: 'Vibrant student atmosphere' }
        ],
        availableTypes: ['apartment'],
        description: 'Bohemian university district with cafes and art galleries'
      }
    ]
  },
  {
    country: 'Germany',
    city: 'Stuttgart',
    averageAppreciation: 0.03,
    rentalYield: 0.035,
    propertyTaxRate: 0.01,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Killesberg',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 15, description: 'Porsche and Mercedes executives' },
          { type: 'reputation_bonus', value: 10, description: 'Automotive industry hub' }
        ],
        availableTypes: ['villa', 'house', 'apartment'],
        description: 'Stuttgart\'s upscale hilltop area near Porsche and Mercedes HQs'
      },
      {
        name: 'Esslingen',
        prestige: 'middle_class',
        priceMultiplier: 0.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Medieval town charm' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Charming medieval town on the outskirts of Stuttgart'
      }
    ]
  },
  {
    country: 'Germany',
    city: 'Berlin',
    averageAppreciation: 0.04,
    rentalYield: 0.04,
    propertyTaxRate: 0.01,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Charlottenburg',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 10, description: 'Classic West Berlin elegance' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Elegant West Berlin district with palace gardens and boutiques'
      },
      {
        name: 'Mitte',
        prestige: 'middle_class',
        priceMultiplier: 0.4,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 10, description: 'Cultural capital vibe' }
        ],
        availableTypes: ['apartment'],
        description: 'The beating heart of Berlin with history and nightlife'
      },
      {
        name: 'Prenzlauer Berg',
        prestige: 'middle_class',
        priceMultiplier: 0.35,
        rentalDemand: 'very_high',
        perks: [
          { type: 'family_happiness', value: 10, description: 'Family-friendly with parks' }
        ],
        availableTypes: ['apartment'],
        description: 'Trendy family-friendly neighbourhood with tree-lined streets'
      }
    ]
  },

  // --- Italy ---
  {
    country: 'Italy',
    city: 'Milan',
    averageAppreciation: 0.025,
    rentalYield: 0.03,
    propertyTaxRate: 0.015,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Quadrilatero della Moda',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Fashion district address' },
          { type: 'sponsor_attraction', value: 25, description: 'Luxury brand HQ proximity' },
          { type: 'media_appeal', value: 20, description: 'Fashion week proximity' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'The golden quadrangle of fashion, home to luxury brands'
      },
      {
        name: 'Brera',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Artistic atmosphere' },
          { type: 'media_appeal', value: 10, description: 'Art gallery district' }
        ],
        availableTypes: ['apartment'],
        description: 'Milan\'s artistic heart with galleries, cafes, and cobbled streets'
      },
      {
        name: 'Navigli',
        prestige: 'middle_class',
        priceMultiplier: 0.6,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 8, description: 'Canal-side atmosphere' }
        ],
        availableTypes: ['apartment'],
        description: 'Trendy canal district with nightlife, restaurants and art studios'
      }
    ]
  },
  {
    country: 'Italy',
    city: 'Rome',
    averageAppreciation: 0.02,
    rentalYield: 0.035,
    propertyTaxRate: 0.015,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Parioli',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Rome\'s Beverly Hills' },
          { type: 'family_happiness', value: 12, description: 'Quiet and green' }
        ],
        availableTypes: ['apartment', 'villa'],
        description: 'Leafy upscale residential area known as Rome\'s Beverly Hills'
      },
      {
        name: 'Trastevere',
        prestige: 'affluent',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Charming cobblestone streets' }
        ],
        availableTypes: ['apartment'],
        description: 'Bohemian medieval quarter with ivy-covered buildings and piazzas'
      }
    ]
  },
  {
    country: 'Italy',
    city: 'Lake Como',
    averageAppreciation: 0.03,
    rentalYield: 0.02,
    propertyTaxRate: 0.012,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Bellagio',
        prestige: 'ultra_elite',
        priceMultiplier: 1.8,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 22, description: 'Pearl of Lake Como' },
          { type: 'stress_reduction', value: 25, description: 'Idyllic lakeside paradise' },
          { type: 'privacy', value: 20, description: 'Secluded waterfront living' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'The jewel of Lake Como, where George Clooney and celebrities reside'
      },
      {
        name: 'Cernobbio',
        prestige: 'prestigious',
        priceMultiplier: 1.2,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 20, description: 'Lakeside tranquility' },
          { type: 'networking', value: 15, description: 'Annual Ambrosetti Forum' }
        ],
        availableTypes: ['villa', 'house'],
        description: 'Elegant lakeside town hosting the famous Ambrosetti Forum'
      }
    ]
  },
  {
    country: 'Italy',
    city: 'Maranello',
    averageAppreciation: 0.02,
    rentalYield: 0.04,
    propertyTaxRate: 0.015,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Town Center',
        prestige: 'middle_class',
        priceMultiplier: 0.25,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 20, description: 'Ferrari HQ next door' },
          { type: 'reputation_bonus', value: 8, description: 'Home of the Prancing Horse' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Live near Ferrari HQ in the spiritual home of motorsport'
      }
    ]
  },

  // --- Spain ---
  {
    country: 'Spain',
    city: 'Barcelona',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Eixample',
        prestige: 'prestigious',
        priceMultiplier: 0.8,
        rentalDemand: 'very_high',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'Iconic Gaudi architecture' },
          { type: 'stress_reduction', value: 10, description: 'Mediterranean lifestyle' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Barcelona\'s elegant grid district with Gaudi masterpieces'
      },
      {
        name: 'Sitges',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Beach town relaxation' },
          { type: 'privacy', value: 10, description: 'Quiet coastal escape' }
        ],
        availableTypes: ['beach_house', 'apartment', 'villa'],
        description: 'Chic coastal town south of Barcelona with stunning beaches'
      },
      {
        name: 'Gracia',
        prestige: 'middle_class',
        priceMultiplier: 0.4,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Village feel in the city' }
        ],
        availableTypes: ['apartment'],
        description: 'Bohemian neighbourhood with a village atmosphere and festivals'
      }
    ]
  },
  {
    country: 'Spain',
    city: 'Madrid',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Salamanca',
        prestige: 'prestigious',
        priceMultiplier: 0.9,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Madrid\'s most exclusive district' },
          { type: 'sponsor_attraction', value: 10, description: 'Luxury shopping district' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Madrid\'s prime upscale shopping and residential quarter'
      },
      {
        name: 'Chamberi',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 10, description: 'Traditional neighbourhood feel' }
        ],
        availableTypes: ['apartment'],
        description: 'Authentic middle-class neighbourhood with local charm'
      }
    ]
  },
  {
    country: 'Spain',
    city: 'Marbella',
    averageAppreciation: 0.035,
    rentalYield: 0.04,
    propertyTaxRate: 0.01,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Puerto Banus',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 18, description: 'Playground of the rich' },
          { type: 'media_appeal', value: 15, description: 'Celebrity hotspot' }
        ],
        availableTypes: ['apartment', 'penthouse', 'villa'],
        description: 'Glamorous marina town frequented by celebrities and yacht owners'
      },
      {
        name: 'La Zagaleta',
        prestige: 'ultra_elite',
        priceMultiplier: 1.8,
        rentalDemand: 'low',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Europe\'s most exclusive gated community' },
          { type: 'privacy', value: 30, description: 'Maximum security and privacy' },
          { type: 'networking', value: 20, description: 'Billionaire neighbors' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'Ultra-exclusive gated hillside community, Europe\'s Beverly Hills'
      }
    ]
  },
  {
    country: 'Spain',
    city: 'Mallorca',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.01,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Palma Old Town',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Mediterranean island life' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Charming old town with cathedral views and cobbled streets'
      },
      {
        name: 'Port d\'Andratx',
        prestige: 'prestigious',
        priceMultiplier: 0.9,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 20, description: 'Stunning harbour views' },
          { type: 'privacy', value: 15, description: 'Peaceful harbour village' }
        ],
        availableTypes: ['villa', 'beach_house'],
        description: 'Exclusive harbour town surrounded by mountains and sea'
      }
    ]
  },

  // --- Portugal ---
  {
    country: 'Portugal',
    city: 'Lisbon',
    averageAppreciation: 0.04,
    rentalYield: 0.045,
    propertyTaxRate: 0.008,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Chiado',
        prestige: 'prestigious',
        priceMultiplier: 0.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Historic cultural quarter' },
          { type: 'media_appeal', value: 10, description: 'Photogenic cobbled streets' }
        ],
        availableTypes: ['apartment'],
        description: 'Lisbon\'s elegant cultural quarter with theatres and bookshops'
      },
      {
        name: 'Alfama',
        prestige: 'middle_class',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Fado music and narrow streets' }
        ],
        availableTypes: ['apartment'],
        description: 'Oldest district with winding streets, Fado bars, and castle views'
      }
    ]
  },
  {
    country: 'Portugal',
    city: 'Algarve',
    averageAppreciation: 0.035,
    rentalYield: 0.045,
    propertyTaxRate: 0.008,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Lagos',
        prestige: 'affluent',
        priceMultiplier: 0.4,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Golden cliffs and beaches' }
        ],
        availableTypes: ['villa', 'beach_house', 'apartment'],
        description: 'Historic town with dramatic cliff beaches and golden shores'
      },
      {
        name: 'Vilamoura',
        prestige: 'prestigious',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'networking', value: 10, description: 'Golf and marina community' },
          { type: 'stress_reduction', value: 15, description: 'Resort lifestyle' }
        ],
        availableTypes: ['villa', 'apartment'],
        description: 'Upscale resort town with marina, golf courses, and nightlife'
      }
    ]
  },

  // --- Netherlands ---
  {
    country: 'Netherlands',
    city: 'Amsterdam',
    averageAppreciation: 0.04,
    rentalYield: 0.035,
    propertyTaxRate: 0.01,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Canal Ring',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'very_high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'UNESCO World Heritage canals' },
          { type: 'stress_reduction', value: 12, description: 'Picturesque canal views' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Iconic 17th-century canal houses in the UNESCO-listed centre'
      },
      {
        name: 'Oud-Zuid',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Near Vondelpark' },
          { type: 'reputation_bonus', value: 10, description: 'Museum quarter adjacent' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Elegant area near museums and Vondelpark, popular with families'
      },
      {
        name: 'Jordaan',
        prestige: 'middle_class',
        priceMultiplier: 0.7,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Cozy neighbourhood atmosphere' }
        ],
        availableTypes: ['apartment'],
        description: 'Charming former working-class area with indie shops and cafes'
      }
    ]
  },

  // --- Austria ---
  {
    country: 'Austria',
    city: 'Vienna',
    averageAppreciation: 0.025,
    rentalYield: 0.035,
    propertyTaxRate: 0.008,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Innere Stadt',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Historic city centre' },
          { type: 'stress_reduction', value: 12, description: 'Cultural capital atmosphere' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Vienna\'s historic first district with imperial architecture'
      },
      {
        name: 'Dobling',
        prestige: 'affluent',
        priceMultiplier: 0.7,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 15, description: 'Vineyards and green spaces' },
          { type: 'stress_reduction', value: 12, description: 'Wine country in the city' }
        ],
        availableTypes: ['house', 'villa', 'apartment'],
        description: 'Leafy wine-growing district on the edge of the Vienna Woods'
      }
    ]
  },

  // ============================================================
  // MIDDLE EAST (~3 cities)
  // ============================================================
  
  // --- United Arab Emirates ---
  {
    country: 'United Arab Emirates',
    city: 'Dubai',
    averageAppreciation: 0.05,
    rentalYield: 0.06,
    propertyTaxRate: 0,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Palm Jumeirah',
        prestige: 'ultra_elite',
        priceMultiplier: 1.5,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Iconic man-made island' },
          { type: 'media_appeal', value: 20, description: 'Instantly recognisable address' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['villa', 'mansion', 'penthouse', 'apartment'],
        description: 'The iconic palm-shaped island, a symbol of Dubai\'s ambition'
      },
      {
        name: 'Downtown Dubai',
        prestige: 'prestigious',
        priceMultiplier: 1.2,
        rentalDemand: 'very_high',
        perks: [
          { type: 'reputation_bonus', value: 18, description: 'Burj Khalifa address' },
          { type: 'sponsor_attraction', value: 15, description: 'Business hub' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Home to the Burj Khalifa and Dubai Mall, the city\'s showpiece'
      },
      {
        name: 'Dubai Marina',
        prestige: 'affluent',
        priceMultiplier: 0.8,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Waterfront living' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Stunning waterfront towers lining the marina canal'
      },
      {
        name: 'JVC',
        prestige: 'middle_class',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment'],
        description: 'Affordable community with parks, affordable for young professionals'
      }
    ]
  },
  {
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    averageAppreciation: 0.04,
    rentalYield: 0.05,
    propertyTaxRate: 0,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Saadiyat Island',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Cultural district with Louvre' },
          { type: 'stress_reduction', value: 15, description: 'Beach and art museums' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['villa', 'apartment', 'penthouse'],
        description: 'Cultural island home to the Louvre Abu Dhabi and pristine beaches'
      },
      {
        name: 'Yas Island',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'networking', value: 15, description: 'Near Yas Marina F1 circuit' },
          { type: 'stress_reduction', value: 10, description: 'Theme parks and entertainment' },
          { type: 'tax_benefit', value: 100, description: 'No income tax' }
        ],
        availableTypes: ['apartment', 'villa'],
        description: 'Entertainment island home to the Yas Marina F1 circuit'
      }
    ]
  },

  // ============================================================
  // ASIA-PACIFIC (~10 cities)
  // ============================================================
  
  // --- Japan ---
  {
    country: 'Japan',
    city: 'Tokyo',
    averageAppreciation: 0.015,
    rentalYield: 0.03,
    propertyTaxRate: 0.014,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Minato',
        prestige: 'prestigious',
        priceMultiplier: 1.5,
        rentalDemand: 'high',
        perks: [
          { type: 'networking', value: 15, description: 'Business district access' },
          { type: 'sponsor_attraction', value: 15, description: 'Japanese corporate HQs' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Upscale district home to embassies and corporations'
      },
      {
        name: 'Shibuya',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 12, description: 'Iconic Tokyo district' }
        ],
        availableTypes: ['apartment'],
        description: 'The famous crossing district, a hub of fashion and entertainment'
      },
      {
        name: 'Azabu',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Expat elite neighbourhood' },
          { type: 'networking', value: 12, description: 'International community' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Prestigious residential area popular with diplomats and executives'
      },
      {
        name: 'Setagaya',
        prestige: 'middle_class',
        priceMultiplier: 0.6,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Green and residential' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Tokyo\'s largest residential ward with parks and quiet streets'
      }
    ]
  },
  {
    country: 'Japan',
    city: 'Suzuka',
    averageAppreciation: 0.01,
    rentalYield: 0.04,
    propertyTaxRate: 0.014,
    marketHeat: 'cold',
    neighborhoods: [
      {
        name: 'Shiroko',
        prestige: 'modest',
        priceMultiplier: 0.2,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 10, description: 'Near Suzuka Circuit' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Quiet area near the legendary Suzuka Circuit, budget-friendly'
      }
    ]
  },

  // --- Singapore ---
  {
    country: 'Singapore',
    city: 'Singapore',
    averageAppreciation: 0.03,
    rentalYield: 0.03,
    propertyTaxRate: 0.004,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Sentosa Cove',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Singapore\'s most exclusive address' },
          { type: 'privacy', value: 25, description: 'Gated island community' },
          { type: 'stress_reduction', value: 15, description: 'Waterfront resort living' }
        ],
        availableTypes: ['villa', 'mansion'],
        description: 'Ultra-exclusive gated waterfront community on Sentosa Island'
      },
      {
        name: 'Marina Bay',
        prestige: 'prestigious',
        priceMultiplier: 1.5,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 18, description: 'Singapore\'s showpiece skyline' },
          { type: 'sponsor_attraction', value: 15, description: 'Financial district hub' },
          { type: 'networking', value: 15, description: 'Near F1 street circuit' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Spectacular skyline living near the F1 street circuit'
      },
      {
        name: 'Holland Village',
        prestige: 'affluent',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Expat-friendly with good schools' }
        ],
        availableTypes: ['house', 'apartment'],
        description: 'Popular expat neighbourhood with international schools and cafes'
      },
      {
        name: 'Tiong Bahru',
        prestige: 'middle_class',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Artisan cafes and retro charm' }
        ],
        availableTypes: ['apartment'],
        description: 'Singapore\'s oldest housing estate turned hipster haven'
      }
    ]
  },

  // --- Australia ---
  {
    country: 'Australia',
    city: 'Sydney',
    averageAppreciation: 0.04,
    rentalYield: 0.03,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Point Piper',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'low',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'Australia\'s most expensive street' },
          { type: 'stress_reduction', value: 20, description: 'Harbour views' }
        ],
        availableTypes: ['mansion', 'villa'],
        description: 'Sydney\'s most exclusive waterfront suburb'
      },
      {
        name: 'Bondi Beach',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Iconic beach lifestyle' },
          { type: 'media_appeal', value: 12, description: 'World-famous beach' }
        ],
        availableTypes: ['apartment', 'beach_house'],
        description: 'World-famous beach suburb with surf culture and ocean views'
      },
      {
        name: 'Mosman',
        prestige: 'prestigious',
        priceMultiplier: 1.3,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 15, description: 'Harbour beaches and bushland' },
          { type: 'stress_reduction', value: 12, description: 'Nature and harbour views' }
        ],
        availableTypes: ['house', 'villa'],
        description: 'Leafy harbour suburb with bushwalks and secluded beaches'
      },
      {
        name: 'Surry Hills',
        prestige: 'middle_class',
        priceMultiplier: 0.6,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 8, description: 'Trendy inner-city vibe' }
        ],
        availableTypes: ['apartment'],
        description: 'Trendy inner-city neighbourhood with cafes and creative scene'
      }
    ]
  },
  {
    country: 'Australia',
    city: 'Melbourne',
    averageAppreciation: 0.035,
    rentalYield: 0.035,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Toorak',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 15, description: 'Melbourne\'s most exclusive suburb' },
          { type: 'networking', value: 12, description: 'Old money social circles' }
        ],
        availableTypes: ['mansion', 'house', 'villa'],
        description: 'Melbourne\'s old-money suburb with grand mansions and tree-lined avenues'
      },
      {
        name: 'South Yarra',
        prestige: 'affluent',
        priceMultiplier: 0.7,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 10, description: 'Fashionable and lively' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Fashionable inner suburb with Chapel Street shopping and dining'
      },
      {
        name: 'St Kilda',
        prestige: 'middle_class',
        priceMultiplier: 0.45,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Beach and pier walks' }
        ],
        availableTypes: ['apartment'],
        description: 'Eclectic seaside suburb with beach, markets and live music'
      }
    ]
  },
  {
    country: 'Australia',
    city: 'Gold Coast',
    averageAppreciation: 0.04,
    rentalYield: 0.045,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Surfers Paradise',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Beach lifestyle' }
        ],
        availableTypes: ['apartment', 'beach_house'],
        description: 'Australia\'s most famous beach resort strip with high-rise living'
      },
      {
        name: 'Main Beach',
        prestige: 'prestigious',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Premium beachfront' },
          { type: 'privacy', value: 10, description: 'Quieter than Surfers Paradise' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Upscale beachfront suburb just north of the Surfers Paradise strip'
      }
    ]
  },

  // ============================================================
  // AMERICAS (~12 cities)
  // ============================================================
  
  // --- United States ---
  {
    country: 'United States',
    city: 'Miami',
    averageAppreciation: 0.05,
    rentalYield: 0.045,
    propertyTaxRate: 0.02,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Star Island',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'Celebrity island address' },
          { type: 'media_appeal', value: 30, description: 'Perfect for lifestyle content' },
          { type: 'privacy', value: 25, description: 'Gated island community' }
        ],
        availableTypes: ['mansion', 'villa'],
        description: 'Exclusive island home to celebrities and sports stars'
      },
      {
        name: 'Brickell',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'networking', value: 15, description: 'Business district connections' },
          { type: 'sponsor_attraction', value: 15, description: 'Central business location' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Miami\'s financial district with stunning high-rises'
      },
      {
        name: 'Coconut Grove',
        prestige: 'affluent',
        priceMultiplier: 0.8,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Lush greenery and waterfront' },
          { type: 'stress_reduction', value: 12, description: 'Tropical village atmosphere' }
        ],
        availableTypes: ['house', 'villa', 'apartment'],
        description: 'Miami\'s oldest neighbourhood with tropical gardens and bay views'
      },
      {
        name: 'Sunny Isles',
        prestige: 'prestigious',
        priceMultiplier: 1.2,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Oceanfront towers' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Oceanfront high-rise community known as Little Moscow'
      }
    ]
  },
  {
    country: 'United States',
    city: 'New York',
    averageAppreciation: 0.03,
    rentalYield: 0.03,
    propertyTaxRate: 0.019,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Upper East Side',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 25, description: 'NYC old money address' },
          { type: 'networking', value: 25, description: 'Social elite neighbors' },
          { type: 'sponsor_attraction', value: 20, description: 'Museum Mile proximity' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Manhattan\'s most exclusive residential neighbourhood'
      },
      {
        name: 'Tribeca',
        prestige: 'prestigious',
        priceMultiplier: 2.0,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 20, description: 'A-list celebrity neighbourhood' },
          { type: 'media_appeal', value: 18, description: 'Film festival district' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Celebrity-packed loft neighbourhood in Lower Manhattan'
      },
      {
        name: 'Brooklyn Heights',
        prestige: 'affluent',
        priceMultiplier: 1.0,
        rentalDemand: 'very_high',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Historic brownstone neighbourhood' },
          { type: 'stress_reduction', value: 10, description: 'Promenade and park views' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Historic brownstone neighbourhood with Manhattan skyline views'
      },
      {
        name: 'Astoria',
        prestige: 'middle_class',
        priceMultiplier: 0.5,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 5, description: 'Diverse food scene' }
        ],
        availableTypes: ['apartment'],
        description: 'Diverse Queens neighbourhood with great food and parks'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Los Angeles',
    averageAppreciation: 0.04,
    rentalYield: 0.035,
    propertyTaxRate: 0.012,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Beverly Hills',
        prestige: 'ultra_elite',
        priceMultiplier: 2.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 30, description: 'The most famous ZIP code' },
          { type: 'media_appeal', value: 25, description: 'Celebrity capital' },
          { type: 'networking', value: 20, description: 'Entertainment industry elite' }
        ],
        availableTypes: ['mansion', 'villa'],
        description: 'The world\'s most famous luxury neighbourhood, 90210'
      },
      {
        name: 'Malibu',
        prestige: 'ultra_elite',
        priceMultiplier: 2.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 25, description: 'Beach paradise' },
          { type: 'privacy', value: 20, description: 'Coastal seclusion' },
          { type: 'media_appeal', value: 18, description: 'Celebrity beach retreat' }
        ],
        availableTypes: ['beach_house', 'mansion', 'villa'],
        description: 'Iconic coastal enclave with celebrity beach houses'
      },
      {
        name: 'Santa Monica',
        prestige: 'affluent',
        priceMultiplier: 1.2,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Beach city living' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Beachside city with the famous pier and vibrant lifestyle'
      },
      {
        name: 'Silver Lake',
        prestige: 'middle_class',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'media_appeal', value: 8, description: 'Hipster creative community' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Trendy hillside neighbourhood with indie shops and reservoir views'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Austin',
    averageAppreciation: 0.05,
    rentalYield: 0.045,
    propertyTaxRate: 0.018,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'Westlake Hills',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Top-rated schools' },
          { type: 'privacy', value: 10, description: 'Hill country seclusion' }
        ],
        availableTypes: ['house', 'villa'],
        description: 'Upscale hill country suburb with top schools and lake access'
      },
      {
        name: 'East Austin',
        prestige: 'middle_class',
        priceMultiplier: 0.3,
        rentalDemand: 'very_high',
        perks: [
          { type: 'media_appeal', value: 8, description: 'Music and food scene' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Rapidly growing creative district near COTA F1 circuit'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Indianapolis',
    averageAppreciation: 0.03,
    rentalYield: 0.05,
    propertyTaxRate: 0.015,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Meridian-Kessler',
        prestige: 'middle_class',
        priceMultiplier: 0.2,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 10, description: 'Near Indianapolis Motor Speedway' },
          { type: 'family_happiness', value: 10, description: 'Historic homes and parks' }
        ],
        availableTypes: ['house'],
        description: 'Charming neighbourhood near the legendary Indy 500 oval'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Charlotte',
    averageAppreciation: 0.04,
    rentalYield: 0.05,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Myers Park',
        prestige: 'affluent',
        priceMultiplier: 0.4,
        rentalDemand: 'medium',
        perks: [
          { type: 'family_happiness', value: 12, description: 'Tree-lined streets and parks' }
        ],
        availableTypes: ['house', 'villa'],
        description: 'Charlotte\'s premier neighbourhood with grand homes'
      },
      {
        name: 'NoDa',
        prestige: 'middle_class',
        priceMultiplier: 0.25,
        rentalDemand: 'high',
        perks: [
          { type: 'media_appeal', value: 5, description: 'Arts district' },
          { type: 'networking', value: 8, description: 'Near NASCAR country' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Artsy revitalised district in the heart of NASCAR country'
      }
    ]
  },
  {
    country: 'United States',
    city: 'Scottsdale',
    averageAppreciation: 0.04,
    rentalYield: 0.045,
    propertyTaxRate: 0.008,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'North Scottsdale',
        prestige: 'affluent',
        priceMultiplier: 0.5,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Desert tranquility' },
          { type: 'privacy', value: 12, description: 'Spacious desert lots' }
        ],
        availableTypes: ['house', 'villa'],
        description: 'Desert luxury living with mountain views and golf courses'
      },
      {
        name: 'Old Town',
        prestige: 'middle_class',
        priceMultiplier: 0.35,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 8, description: 'Western charm' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Historic downtown with western art galleries and nightlife'
      }
    ]
  },

  // --- Canada ---
  {
    country: 'Canada',
    city: 'Montreal',
    averageAppreciation: 0.035,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Westmount',
        prestige: 'prestigious',
        priceMultiplier: 0.7,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'Montreal\'s most exclusive area' },
          { type: 'family_happiness', value: 12, description: 'Excellent schools' }
        ],
        availableTypes: ['house', 'villa', 'mansion'],
        description: 'Montreal\'s affluent English-speaking enclave on the mountainside'
      },
      {
        name: 'Plateau Mont-Royal',
        prestige: 'middle_class',
        priceMultiplier: 0.4,
        rentalDemand: 'very_high',
        perks: [
          { type: 'networking', value: 10, description: 'Near F1 Circuit Gilles Villeneuve' },
          { type: 'stress_reduction', value: 10, description: 'Vibrant cultural scene' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Bohemian neighbourhood near the Canadian Grand Prix circuit'
      }
    ]
  },
  {
    country: 'Canada',
    city: 'Toronto',
    averageAppreciation: 0.035,
    rentalYield: 0.035,
    propertyTaxRate: 0.011,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Rosedale',
        prestige: 'prestigious',
        priceMultiplier: 0.8,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'Toronto\'s most prestigious area' },
          { type: 'family_happiness', value: 12, description: 'Ravines and gardens' }
        ],
        availableTypes: ['house', 'mansion'],
        description: 'Toronto\'s wealthiest neighbourhood with ravine-backed estates'
      },
      {
        name: 'Yorkville',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'sponsor_attraction', value: 10, description: 'Luxury retail district' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Toronto\'s upscale shopping and dining district'
      }
    ]
  },
  {
    country: 'Canada',
    city: 'Vancouver',
    averageAppreciation: 0.035,
    rentalYield: 0.03,
    propertyTaxRate: 0.003,
    marketHeat: 'hot',
    neighborhoods: [
      {
        name: 'West Vancouver',
        prestige: 'prestigious',
        priceMultiplier: 1.0,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Mountain and ocean views' },
          { type: 'reputation_bonus', value: 12, description: 'Most exclusive area in BC' }
        ],
        availableTypes: ['house', 'villa', 'mansion'],
        description: 'Stunning waterfront homes with mountain and Pacific Ocean views'
      },
      {
        name: 'Kitsilano',
        prestige: 'affluent',
        priceMultiplier: 0.6,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 12, description: 'Beach and mountain lifestyle' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Laid-back beach neighbourhood with stunning mountain backdrops'
      }
    ]
  },

  // --- Mexico ---
  {
    country: 'Mexico',
    city: 'Mexico City',
    averageAppreciation: 0.04,
    rentalYield: 0.05,
    propertyTaxRate: 0.005,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Polanco',
        prestige: 'prestigious',
        priceMultiplier: 0.4,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 10, description: 'Mexico City\'s Beverly Hills' },
          { type: 'sponsor_attraction', value: 8, description: 'Business district' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Mexico City\'s upscale district with embassies and luxury shops'
      },
      {
        name: 'Condesa',
        prestige: 'middle_class',
        priceMultiplier: 0.2,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 10, description: 'Art deco parks and cafes' }
        ],
        availableTypes: ['apartment'],
        description: 'Trendy art deco neighbourhood with parks and vibrant cafe culture'
      }
    ]
  },
  {
    country: 'Mexico',
    city: 'Cancun',
    averageAppreciation: 0.03,
    rentalYield: 0.06,
    propertyTaxRate: 0.003,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Hotel Zone',
        prestige: 'affluent',
        priceMultiplier: 0.3,
        rentalDemand: 'very_high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Caribbean paradise' }
        ],
        availableTypes: ['beach_house', 'apartment'],
        description: 'Caribbean beachfront strip with turquoise waters and resorts'
      }
    ]
  },

  // --- Brazil ---
  {
    country: 'Brazil',
    city: 'Sao Paulo',
    averageAppreciation: 0.03,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Jardins',
        prestige: 'prestigious',
        priceMultiplier: 0.6,
        rentalDemand: 'high',
        perks: [
          { type: 'reputation_bonus', value: 12, description: 'Sao Paulo\'s most upscale area' },
          { type: 'sponsor_attraction', value: 10, description: 'Business hub' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Sao Paulo\'s most upscale neighbourhood with luxury shopping'
      },
      {
        name: 'Vila Madalena',
        prestige: 'middle_class',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'media_appeal', value: 8, description: 'Street art capital' }
        ],
        availableTypes: ['apartment'],
        description: 'Bohemian neighbourhood famous for street art and nightlife'
      }
    ]
  },
  {
    country: 'Brazil',
    city: 'Rio de Janeiro',
    averageAppreciation: 0.025,
    rentalYield: 0.04,
    propertyTaxRate: 0.012,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Leblon',
        prestige: 'prestigious',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 18, description: 'Beach lifestyle' },
          { type: 'reputation_bonus', value: 10, description: 'Rio\'s most exclusive beach suburb' }
        ],
        availableTypes: ['apartment', 'penthouse'],
        description: 'Rio\'s most exclusive beach neighbourhood with stunning views'
      },
      {
        name: 'Barra da Tijuca',
        prestige: 'affluent',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'family_happiness', value: 10, description: 'Modern gated communities' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Modern beachside suburb with gated communities and malls'
      }
    ]
  },
  {
    country: 'Brazil',
    city: 'Interlagos Area',
    averageAppreciation: 0.02,
    rentalYield: 0.05,
    propertyTaxRate: 0.012,
    marketHeat: 'cold',
    neighborhoods: [
      {
        name: 'Santo Amaro',
        prestige: 'modest',
        priceMultiplier: 0.15,
        rentalDemand: 'medium',
        perks: [
          { type: 'networking', value: 10, description: 'Near Interlagos circuit' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Budget-friendly neighbourhood near the legendary Interlagos circuit'
      }
    ]
  },

  // ============================================================
  // AFRICA (~2 cities)
  // ============================================================
  
  // --- South Africa ---
  {
    country: 'South Africa',
    city: 'Cape Town',
    averageAppreciation: 0.04,
    rentalYield: 0.06,
    propertyTaxRate: 0.008,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Camps Bay',
        prestige: 'prestigious',
        priceMultiplier: 0.5,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 20, description: 'Stunning mountain and beach views' },
          { type: 'media_appeal', value: 15, description: 'Africa\'s Riviera' }
        ],
        availableTypes: ['villa', 'beach_house'],
        description: 'Cape Town\'s Riviera with stunning mountain and ocean views'
      },
      {
        name: 'Constantia',
        prestige: 'affluent',
        priceMultiplier: 0.35,
        rentalDemand: 'medium',
        perks: [
          { type: 'stress_reduction', value: 15, description: 'Wine estates and gardens' },
          { type: 'family_happiness', value: 12, description: 'Nature and top schools' }
        ],
        availableTypes: ['house', 'villa'],
        description: 'Historic wine-making valley with grand estates and gardens'
      },
      {
        name: 'Observatory',
        prestige: 'middle_class',
        priceMultiplier: 0.15,
        rentalDemand: 'high',
        perks: [
          { type: 'stress_reduction', value: 5, description: 'Bohemian village feel' }
        ],
        availableTypes: ['apartment', 'house'],
        description: 'Budget-friendly bohemian neighbourhood near the university'
      }
    ]
  },
  {
    country: 'South Africa',
    city: 'Johannesburg',
    averageAppreciation: 0.035,
    rentalYield: 0.07,
    propertyTaxRate: 0.01,
    marketHeat: 'normal',
    neighborhoods: [
      {
        name: 'Sandton',
        prestige: 'affluent',
        priceMultiplier: 0.3,
        rentalDemand: 'high',
        perks: [
          { type: 'networking', value: 12, description: 'Africa\'s business capital' },
          { type: 'sponsor_attraction', value: 8, description: 'Financial hub' }
        ],
        availableTypes: ['apartment', 'penthouse', 'house'],
        description: 'The financial capital of Africa with modern skyscrapers'
      },
      {
        name: 'Hyde Park',
        prestige: 'prestigious',
        priceMultiplier: 0.4,
        rentalDemand: 'medium',
        perks: [
          { type: 'reputation_bonus', value: 10, description: 'Johannesburg\'s most exclusive suburb' }
        ],
        availableTypes: ['house', 'villa', 'mansion'],
        description: 'Exclusive leafy suburb with grand homes behind high walls'
      }
    ]
  }
]

// ============================================
// BASE PROPERTY PRICES
// ============================================

export interface PropertyPriceConfig {
  type: PropertyType
  basePriceRange: { min: number; max: number }  // Before location multiplier
  maintenancePercent: number    // Annual maintenance as % of value
  insurancePercent: number      // Annual insurance as % of value
  defaultBedrooms: { min: number; max: number }
  defaultBathrooms: { min: number; max: number }
  defaultSquareMeters: { min: number; max: number }
  availableFeatures: PropertyFeature[]
  qualityMultipliers: Record<PropertyQuality, number>
}

export const PROPERTY_PRICE_CONFIGS: Record<PropertyType, PropertyPriceConfig> = {
  apartment: {
    type: 'apartment',
    basePriceRange: { min: 200000, max: 800000 },
    maintenancePercent: 0.01,
    insurancePercent: 0.003,
    defaultBedrooms: { min: 1, max: 3 },
    defaultBathrooms: { min: 1, max: 2 },
    defaultSquareMeters: { min: 50, max: 150 },
    availableFeatures: ['gym', 'concierge', 'smart_home', 'security_system', 'rooftop_terrace'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.8, ultra_luxury: 2.5 }
  },
  house: {
    type: 'house',
    basePriceRange: { min: 400000, max: 1500000 },
    maintenancePercent: 0.015,
    insurancePercent: 0.004,
    defaultBedrooms: { min: 3, max: 5 },
    defaultBathrooms: { min: 2, max: 4 },
    defaultSquareMeters: { min: 150, max: 400 },
    availableFeatures: ['pool', 'garden', 'gym', 'home_cinema', 'smart_home', 'security_system', 'racing_simulator'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  villa: {
    type: 'villa',
    basePriceRange: { min: 1500000, max: 5000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 4, max: 7 },
    defaultBathrooms: { min: 3, max: 6 },
    defaultSquareMeters: { min: 300, max: 800 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'garden', 'staff_quarters', 'smart_home', 'security_system', 'racing_simulator', 'tennis_court'],
    qualityMultipliers: { basic: 0.7, good: 0.9, premium: 1.2, luxury: 1.6, ultra_luxury: 2.2 }
  },
  mansion: {
    type: 'mansion',
    basePriceRange: { min: 5000000, max: 25000000 },
    maintenancePercent: 0.025,
    insurancePercent: 0.006,
    defaultBedrooms: { min: 6, max: 15 },
    defaultBathrooms: { min: 5, max: 12 },
    defaultSquareMeters: { min: 600, max: 2000 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'tennis_court', 'helipad', 'car_collection_garage', 'staff_quarters', 'smart_home', 'security_system', 'racing_simulator', 'garden', 'private_elevator'],
    qualityMultipliers: { basic: 0.6, good: 0.8, premium: 1.1, luxury: 1.5, ultra_luxury: 2.0 }
  },
  penthouse: {
    type: 'penthouse',
    basePriceRange: { min: 2000000, max: 15000000 },
    maintenancePercent: 0.015,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 3, max: 6 },
    defaultBathrooms: { min: 3, max: 5 },
    defaultSquareMeters: { min: 200, max: 600 },
    availableFeatures: ['pool', 'spa', 'gym', 'home_cinema', 'wine_cellar', 'rooftop_terrace', 'concierge', 'smart_home', 'security_system', 'private_elevator'],
    qualityMultipliers: { basic: 0.7, good: 0.9, premium: 1.2, luxury: 1.6, ultra_luxury: 2.2 }
  },
  beach_house: {
    type: 'beach_house',
    basePriceRange: { min: 800000, max: 4000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.008,  // Higher due to coastal risks
    defaultBedrooms: { min: 3, max: 6 },
    defaultBathrooms: { min: 2, max: 4 },
    defaultSquareMeters: { min: 150, max: 400 },
    availableFeatures: ['pool', 'boat_dock', 'garden', 'smart_home', 'security_system'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  ski_chalet: {
    type: 'ski_chalet',
    basePriceRange: { min: 1000000, max: 6000000 },
    maintenancePercent: 0.02,
    insurancePercent: 0.005,
    defaultBedrooms: { min: 4, max: 8 },
    defaultBathrooms: { min: 3, max: 6 },
    defaultSquareMeters: { min: 200, max: 500 },
    availableFeatures: ['spa', 'gym', 'home_cinema', 'wine_cellar', 'smart_home', 'security_system'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.3, luxury: 1.7, ultra_luxury: 2.3 }
  },
  commercial: {
    type: 'commercial',
    basePriceRange: { min: 500000, max: 10000000 },
    maintenancePercent: 0.01,
    insurancePercent: 0.004,
    defaultBedrooms: { min: 0, max: 0 },
    defaultBathrooms: { min: 1, max: 4 },
    defaultSquareMeters: { min: 100, max: 2000 },
    availableFeatures: ['security_system', 'smart_home'],
    qualityMultipliers: { basic: 0.8, good: 1.0, premium: 1.2, luxury: 1.5, ultra_luxury: 1.8 }
  },
  land: {
    type: 'land',
    basePriceRange: { min: 100000, max: 5000000 },
    maintenancePercent: 0.005,
    insurancePercent: 0.001,
    defaultBedrooms: { min: 0, max: 0 },
    defaultBathrooms: { min: 0, max: 0 },
    defaultSquareMeters: { min: 1000, max: 50000 },
    availableFeatures: [],
    qualityMultipliers: { basic: 1.0, good: 1.0, premium: 1.0, luxury: 1.0, ultra_luxury: 1.0 }
  }
}

// ============================================
// RENOVATION CONFIGS
// ============================================

export interface RenovationConfig {
  type: RenovationType
  name: string
  description: string
  costPercentOfValue: number    // Cost as % of current property value
  durationWeeks: number
  valueIncreasePercent: number  // How much it adds to value
  qualityUpgrade?: boolean      // Can upgrade quality level
  requiredMinQuality?: PropertyQuality  // Minimum quality to perform
}

export const RENOVATION_CONFIGS: Record<RenovationType, RenovationConfig> = {
  basic_refresh: {
    type: 'basic_refresh',
    name: 'Basic Refresh',
    description: 'Fresh paint, minor repairs, and cleaning',
    costPercentOfValue: 0.02,
    durationWeeks: 2,
    valueIncreasePercent: 0.03,
    qualityUpgrade: false
  },
  kitchen_upgrade: {
    type: 'kitchen_upgrade',
    name: 'Kitchen Upgrade',
    description: 'Modern kitchen with premium appliances',
    costPercentOfValue: 0.05,
    durationWeeks: 4,
    valueIncreasePercent: 0.07
  },
  bathroom_upgrade: {
    type: 'bathroom_upgrade',
    name: 'Bathroom Upgrade',
    description: 'Luxury bathroom finishes and fixtures',
    costPercentOfValue: 0.04,
    durationWeeks: 3,
    valueIncreasePercent: 0.05
  },
  full_renovation: {
    type: 'full_renovation',
    name: 'Full Renovation',
    description: 'Complete interior overhaul',
    costPercentOfValue: 0.15,
    durationWeeks: 12,
    valueIncreasePercent: 0.20,
    qualityUpgrade: true
  },
  luxury_conversion: {
    type: 'luxury_conversion',
    name: 'Luxury Conversion',
    description: 'Transform into ultra-luxury specification',
    costPercentOfValue: 0.25,
    durationWeeks: 20,
    valueIncreasePercent: 0.35,
    qualityUpgrade: true,
    requiredMinQuality: 'premium'
  },
  extension: {
    type: 'extension',
    name: 'Extension',
    description: 'Add additional living space',
    costPercentOfValue: 0.20,
    durationWeeks: 16,
    valueIncreasePercent: 0.25
  },
  smart_home: {
    type: 'smart_home',
    name: 'Smart Home Installation',
    description: 'Full home automation and technology',
    costPercentOfValue: 0.03,
    durationWeeks: 2,
    valueIncreasePercent: 0.04
  },
  eco_upgrade: {
    type: 'eco_upgrade',
    name: 'Eco Upgrade',
    description: 'Solar panels, insulation, and efficiency',
    costPercentOfValue: 0.06,
    durationWeeks: 4,
    valueIncreasePercent: 0.05
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generatePropertyPrice(
  type: PropertyType,
  quality: PropertyQuality,
  locationMultiplier: number,
  marketHeat: 'cold' | 'normal' | 'hot' | 'bubble'
): number {
  const config = PROPERTY_PRICE_CONFIGS[type]
  
  // Random within base range
  const basePrice = config.basePriceRange.min + 
    Math.random() * (config.basePriceRange.max - config.basePriceRange.min)
  
  // Apply quality multiplier
  const qualityPrice = basePrice * config.qualityMultipliers[quality]
  
  // Apply location multiplier
  const locationPrice = qualityPrice * locationMultiplier
  
  // Apply market heat
  const heatMultipliers = { cold: 0.85, normal: 1.0, hot: 1.15, bubble: 1.35 }
  const finalPrice = locationPrice * heatMultipliers[marketHeat]
  
  // Round to nearest 10,000
  return Math.round(finalPrice / 10000) * 10000
}

export function calculatePropertyMaintenanceCost(property: Property): number {
  const config = PROPERTY_PRICE_CONFIGS[property.type]
  const annualMaintenance = property.currentValue * config.maintenancePercent
  
  // Condition affects maintenance (lower condition = higher maintenance)
  const conditionMultiplier = 1 + ((100 - property.condition) / 100) * 0.5
  
  return Math.round((annualMaintenance * conditionMultiplier) / 12)  // Monthly
}

export function calculatePropertyInsuranceCost(property: Property): number {
  const config = PROPERTY_PRICE_CONFIGS[property.type]
  return Math.round((property.currentValue * config.insurancePercent) / 12)  // Monthly
}

export function calculatePropertyTax(property: Property, market: LocationPropertyMarket): number {
  return Math.round((property.currentValue * market.propertyTaxRate) / 12)  // Monthly
}

export function calculateRentalIncome(property: Property): number {
  if (!property.rental || !property.rental.isRented) return 0
  
  const grossRent = property.rental.monthlyRent
  const managementFee = grossRent * property.rental.managementFee
  
  return Math.round(grossRent - managementFee)
}

export function estimateRentalValue(property: Property, market: LocationPropertyMarket): number {
  // Base rental is property value * rental yield / 12
  const baseMonthlyRent = (property.currentValue * market.rentalYield) / 12
  
  // Quality affects rental
  const qualityMultipliers: Record<PropertyQuality, number> = {
    basic: 0.8,
    good: 1.0,
    premium: 1.15,
    luxury: 1.3,
    ultra_luxury: 1.5
  }
  
  const adjustedRent = baseMonthlyRent * qualityMultipliers[property.quality]
  
  // Condition affects rental
  const conditionMultiplier = 0.8 + (property.condition / 100) * 0.2
  
  return Math.round(adjustedRent * conditionMultiplier)
}

export function updatePropertyValue(
  property: Property,
  market: LocationPropertyMarket,
  weeksElapsed: number
): number {
  // Weekly appreciation (convert annual to weekly)
  const weeklyAppreciation = market.averageAppreciation / 52
  
  // Apply over elapsed weeks
  const appreciationMultiplier = Math.pow(1 + weeklyAppreciation, weeksElapsed)
  
  // Condition affects value
  const conditionPenalty = property.condition < 50 
    ? 1 - ((50 - property.condition) / 100) * 0.2 
    : 1
  
  return Math.round(property.currentValue * appreciationMultiplier * conditionPenalty)
}

export function degradePropertyCondition(currentCondition: number, weeksElapsed: number): number {
  // Property degrades ~2% per year (0.04% per week)
  const degradation = weeksElapsed * 0.0004 * 100
  return Math.max(0, Math.round(currentCondition - degradation))
}

export function getMarketForProperty(country: Country, city: string): LocationPropertyMarket | undefined {
  return PROPERTY_MARKETS.find(m => m.country === country && m.city === city)
}

export function getNeighborhoodData(
  market: LocationPropertyMarket,
  neighborhoodName: string
): NeighborhoodData | undefined {
  return market.neighborhoods.find(n => n.name === neighborhoodName)
}

// ============================================
// PROPERTY LISTING GENERATION
// ============================================

export interface PropertyListing {
  property: Omit<Property, 'id' | 'purchaseDate' | 'lastValuationDate' | 'mortgageId' | 'rental' | 'renovation'>
  name: string
  askingPrice: number
  listPrice: number
  daysOnMarket: number
  sellerMotivation: 'normal' | 'motivated' | 'desperate'  // Affects negotiation
  negotiationRoom: number  // % below asking they'll accept
}

export function generatePropertyListing(
  country: Country,
  city: string,
  neighborhoodName: string,
  type: PropertyType,
  quality: PropertyQuality
): PropertyListing | null {
  const market = getMarketForProperty(country, city)
  if (!market) return null
  
  const neighborhood = getNeighborhoodData(market, neighborhoodName)
  if (!neighborhood) return null
  
  if (!neighborhood.availableTypes.includes(type)) return null
  
  const config = PROPERTY_PRICE_CONFIGS[type]
  
  // Generate property details
  const price = generatePropertyPrice(type, quality, neighborhood.priceMultiplier, market.marketHeat)
  
  const bedrooms = Math.floor(
    config.defaultBedrooms.min + 
    Math.random() * (config.defaultBedrooms.max - config.defaultBedrooms.min + 1)
  )
  const bathrooms = Math.floor(
    config.defaultBathrooms.min + 
    Math.random() * (config.defaultBathrooms.max - config.defaultBathrooms.min + 1)
  )
  const squareMeters = Math.floor(
    config.defaultSquareMeters.min + 
    Math.random() * (config.defaultSquareMeters.max - config.defaultSquareMeters.min)
  )
  
  // Random features from available
  const numFeatures = Math.floor(Math.random() * 4) + 1
  const features = config.availableFeatures
    .sort(() => Math.random() - 0.5)
    .slice(0, numFeatures)
  
  // Seller motivation
  const motivationRoll = Math.random()
  const sellerMotivation = motivationRoll < 0.1 ? 'desperate' : 
                          motivationRoll < 0.3 ? 'motivated' : 'normal'
  
  const negotiationRoom = sellerMotivation === 'desperate' ? 15 :
                         sellerMotivation === 'motivated' ? 8 : 3
  
  return {
    property: {
      name: `${neighborhood.name} ${type.replace('_', ' ')}`,
      type,
      status: 'vacant',
      country,
      city,
      neighborhood: neighborhoodName,
      purchasePrice: 0,  // Will be set on purchase
      currentValue: price,
      appreciationRate: market.averageAppreciation,
      monthlyMaintenance: Math.round((price * config.maintenancePercent) / 12),
      annualPropertyTax: Math.round(price * market.propertyTaxRate),
      insuranceCost: Math.round((price * config.insurancePercent) / 12),
      features,
      perks: neighborhood.perks,
      quality,
      condition: 85 + Math.floor(Math.random() * 15),  // 85-99
      squareMeters,
      bedrooms,
      bathrooms,
      garageSpaces: type === 'mansion' ? 4 : type === 'villa' ? 2 : type === 'house' ? 2 : 0
    },
    name: `${neighborhood.name} ${type.replace('_', ' ')}`,
    askingPrice: price,
    listPrice: price,
    daysOnMarket: Math.floor(Math.random() * 180),
    sellerMotivation,
    negotiationRoom
  }
}
