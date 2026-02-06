/**
 * Historic Invitational Events System
 * 
 * Special one-off events between race weekends where players can be invited
 * to race historic/vintage cars. Events are organized by different entities
 * (sponsors, manufacturers, historic clubs, tracks, teams) with varied rewards.
 */

import { AMS2_CAR_CLASSES, CarClass } from './ams2-cars'
import { AMS2Track, ALL_TRACKS } from './ams2-tracks'

// ============================================
// TYPE DEFINITIONS
// ============================================

export type InvitationalOrganizer = 
  | 'sponsor'           // Your sponsors want you at an event
  | 'manufacturer'      // Factory heritage events
  | 'historic-club'     // Goodwood, Le Mans Classic style
  | 'team'              // Team-organized exhibition
  | 'track'             // Circuit anniversary/special event

export type InvitationalStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface InvitationalRewards {
  prize: number                    // Prize money
  reputationBonus: number          // General reputation boost
  organizerRelationBonus: number   // Bonus with the specific organizer
}

export interface DeclineConsequences {
  organizerRelationPenalty: number
  reputationPenalty: number
  description: string
}

// How often an event can occur
export type EventFrequency = 
  | 'multiple'      // Can happen multiple times per year (like smaller club events)
  | 'annual'        // Once per year maximum
  | 'biennial'      // Once every 2 years (like Le Mans Classic, Monaco Historic)
  | 'quadrennial'   // Once every 4 years (rare special anniversaries)

export interface InvitationalEventTemplate {
  id: string
  name: string
  organizer: InvitationalOrganizer
  organizerId?: string              // Specific sponsor/manufacturer/club ID
  organizerName: string             // Display name for the organizer
  carClassIds: string[]             // Historic car classes eligible
  preferredTrackIds?: string[]      // Tracks that match the event theme
  preferredTrackRegion?: string     // Region preference for track selection
  description: string
  prestige: number                  // 0-100
  minReputation: number             // Minimum player reputation to receive invite
  frequency: EventFrequency         // How often this event can occur
  rewards: InvitationalRewards
  declineConsequences: DeclineConsequences
  // Conditions for this event to be offered
  conditions?: {
    requiresManufacturer?: string[] // Player must be with one of these manufacturers
    requiresSponsor?: string[]      // Player must have one of these sponsors
    requiresNationality?: string[]  // Player nationality requirement
    seasonOnly?: number[]           // Only offered in specific seasons (e.g., anniversary years)
  }
}

export interface InvitationalEvent extends InvitationalEventTemplate {
  instanceId: string                // Unique instance ID for this specific invitation
  week: number                      // Week the event takes place
  year: number                      // Year of the event
  trackId: string                   // Selected track for this instance
  trackName: string                 // Track display name
  layoutId: string                  // Selected layout
  layoutName: string                // Layout display name
  carClassId: string                // Selected car class for this instance
  carClassName: string              // Car class display name
  // Assigned car/livery details
  assignedCar: {
    id: string                      // Car ID
    name: string                    // e.g., "Porsche 962C"
    manufacturer: string            // e.g., "Porsche"
    liveryNumber: number            // e.g., 17
    liveryName: string              // e.g., "Rothmans Porsche" or "Shell Dunlop Racing"
  }
  status: InvitationalStatus
  expiresWeek: number               // Week by which player must respond
  result?: {
    position: number
    prize: number
    reputationGained: number
  }
}

// ============================================
// HISTORIC CLUBS & ORGANIZATIONS
// ============================================

export interface HistoricClub {
  id: string
  name: string
  description: string
  country: string
  prestige: number
  specialties: string[]  // Car class IDs they specialize in
}

export const HISTORIC_CLUBS: HistoricClub[] = [
  {
    id: 'goodwood',
    name: 'Goodwood Revival',
    description: 'The world\'s greatest historic motor racing event, celebrating the glory days of Goodwood Motor Circuit.',
    country: 'UK',
    prestige: 95,
    specialties: ['group-a', 'gt1', 'gt-classic', 'vintage-touring-t1', 'vintage-touring-t2']
  },
  {
    id: 'le-mans-classic',
    name: 'Le Mans Classic',
    description: 'Biennial celebration of Le Mans racing history at the legendary Circuit de la Sarthe.',
    country: 'France',
    prestige: 92,
    specialties: ['group-c', 'gt1', 'lmp1-2005', 'gt-classic']
  },
  {
    id: 'historic-grand-prix',
    name: 'Historic Grand Prix Association',
    description: 'International organization dedicated to preserving the heritage of Formula 1 racing.',
    country: 'International',
    prestige: 88,
    specialties: ['formula-classic-g1', 'formula-classic-g2', 'formula-classic-g3', 'formula-retro-v10']
  },
  {
    id: 'brazilian-motorsport-heritage',
    name: 'Brazilian Motorsport Heritage Foundation',
    description: 'Preserving the rich history of Brazilian racing from the golden era of Stock Car and touring cars.',
    country: 'Brazil',
    prestige: 75,
    specialties: ['stock-car-1979', 'stock-car-1986', 'stock-car-1999', 'hot-cars', 'copa-classic-b', 'copa-classic-fl']
  },
  {
    id: 'group-c-club',
    name: 'Group C Racing Club',
    description: 'International club dedicated to the legendary Group C prototypes of the 1980s.',
    country: 'International',
    prestige: 85,
    specialties: ['group-c']
  },
  {
    id: 'gt-legends',
    name: 'GT Legends Club',
    description: 'Celebrating the golden era of GT racing from the 1990s and 2000s.',
    country: 'International',
    prestige: 82,
    specialties: ['gt1', 'gt1-2005', 'gt2-2005', 'gt-open']
  },
  {
    id: 'procar-association',
    name: 'BMW M1 Procar Association',
    description: 'Keepers of the legendary BMW M1 Procar legacy.',
    country: 'Germany',
    prestige: 80,
    specialties: ['m1-procar']
  }
]

// ============================================
// EVENT TEMPLATES DATABASE
// ============================================

export const INVITATIONAL_TEMPLATES: InvitationalEventTemplate[] = [
  // ============================================
  // HISTORIC CLUB EVENTS (High prestige, high rewards)
  // ============================================
  {
    id: 'goodwood-revival-touring',
    name: 'Goodwood Revival - Touring Car Trophy',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'Goodwood Revival',
    carClassIds: ['group-a', 'vintage-touring-t1', 'vintage-touring-t2'],
    preferredTrackIds: ['brands_hatch', 'silverstone', 'donington', 'oulton_park'],
    preferredTrackRegion: 'europe',
    description: 'An invitation to race at the prestigious Goodwood Revival, celebrating the golden age of touring car racing with legendary Group A and classic touring machinery.',
    prestige: 95,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'Declining an invitation from Goodwood may reduce future invitations from prestigious historic events.'
    }
  },
  {
    id: 'goodwood-revival-gt',
    name: 'Goodwood Revival - RAC TT Celebration',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'Goodwood Revival',
    carClassIds: ['gt1', 'gt-classic'],
    preferredTrackIds: ['brands_hatch', 'silverstone', 'donington'],
    preferredTrackRegion: 'europe',
    description: 'Join the RAC TT Celebration at Goodwood Revival, featuring legendary GT machinery from the golden era.',
    prestige: 95,
    minReputation: 70,
    frequency: 'annual',
    rewards: {
      prize: 20000,
      reputationBonus: 2,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 3,
      description: 'The Goodwood Revival is motorsport\'s most prestigious historic event. Declining may affect your reputation.'
    }
  },
  {
    id: 'le-mans-classic-group-c',
    name: 'Le Mans Classic - Group C Festival',
    organizer: 'historic-club',
    organizerId: 'le-mans-classic',
    organizerName: 'Le Mans Classic',
    carClassIds: ['group-c'],
    preferredTrackIds: ['le_mans', 'spa', 'monza'],
    preferredTrackRegion: 'europe',
    description: 'Experience the thunderous Group C prototypes at Le Mans Classic, celebrating the golden era of sports car racing.',
    prestige: 92,
    minReputation: 65,
    frequency: 'biennial', // Le Mans Classic is every 2 years
    rewards: {
      prize: 25000,
      reputationBonus: 3,
      organizerRelationBonus: 20
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 3,
      description: 'Le Mans Classic is a once-in-a-lifetime opportunity. Declining may significantly impact future invitations.'
    }
  },
  {
    id: 'historic-gp-f1-legends',
    name: 'Historic Grand Prix - F1 Legends Trophy',
    organizer: 'historic-club',
    organizerId: 'historic-grand-prix',
    organizerName: 'Historic Grand Prix Association',
    carClassIds: ['formula-classic-g1', 'formula-classic-g2', 'formula-classic-g3'],
    preferredTrackIds: ['monaco', 'spa', 'monza', 'silverstone', 'interlagos'],
    preferredTrackRegion: 'europe',
    description: 'Race classic Formula 1 machinery from the turbo and naturally-aspirated eras at iconic Grand Prix circuits.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'The Historic Grand Prix Association values committed drivers. Declining may affect future invitations.'
    }
  },
  {
    id: 'historic-gp-v10-era',
    name: 'Historic Grand Prix - V10 Screamer Festival',
    organizer: 'historic-club',
    organizerId: 'historic-grand-prix',
    organizerName: 'Historic Grand Prix Association',
    carClassIds: ['formula-retro-v10'],
    preferredTrackIds: ['spa', 'monza', 'suzuka', 'interlagos', 'silverstone'],
    preferredTrackRegion: 'europe',
    description: 'Experience the incredible sound and speed of V10-era Formula 1 cars at legendary circuits.',
    prestige: 85,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 2,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'V10 F1 cars are becoming increasingly rare. This is a special opportunity.'
    }
  },
  {
    id: 'brazilian-heritage-stock-car',
    name: 'Brazilian Stock Car Masters',
    organizer: 'historic-club',
    organizerId: 'brazilian-motorsport-heritage',
    organizerName: 'Brazilian Motorsport Heritage Foundation',
    carClassIds: ['stock-car-1979', 'stock-car-1986', 'stock-car-1999'],
    preferredTrackIds: ['interlagos', 'goiania', 'curitiba', 'londrina', 'taruma'],
    preferredTrackRegion: 'brazil',
    description: 'Celebrate the rich history of Brazilian Stock Car racing with classic Opalas and touring cars.',
    prestige: 75,
    minReputation: 40,
    frequency: 'annual',
    rewards: {
      prize: 8000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 5,
      reputationPenalty: 1,
      description: 'The Brazilian motorsport community values participation in heritage events.'
    },
    conditions: {
      requiresNationality: ['Brazil', 'Argentina', 'Portugal']
    }
  },
  {
    id: 'brazilian-heritage-hot-cars',
    name: 'Hot Cars Revival',
    organizer: 'historic-club',
    organizerId: 'brazilian-motorsport-heritage',
    organizerName: 'Brazilian Motorsport Heritage Foundation',
    carClassIds: ['hot-cars'],
    preferredTrackIds: ['interlagos', 'goiania', 'curitiba'],
    preferredTrackRegion: 'brazil',
    description: 'Relive the excitement of 1980s Brazilian Hot Cars racing at iconic circuits.',
    prestige: 70,
    minReputation: 35,
    frequency: 'multiple', // Regional events happen several times a year
    rewards: {
      prize: 6000,
      reputationBonus: 1,
      organizerRelationBonus: 8
    },
    declineConsequences: {
      organizerRelationPenalty: 4,
      reputationPenalty: 1,
      description: 'Brazilian historic racing events are popular and well-attended.'
    }
  },
  {
    id: 'group-c-festival',
    name: 'Group C Festival',
    organizer: 'historic-club',
    organizerId: 'group-c-club',
    organizerName: 'Group C Racing Club',
    carClassIds: ['group-c'],
    preferredTrackIds: ['spa', 'nurburgring', 'le_mans', 'silverstone'],
    preferredTrackRegion: 'europe',
    description: 'A celebration of the legendary Group C prototypes - Porsche 962, Jaguar XJR, and Sauber-Mercedes.',
    prestige: 85,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 18000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Group C cars are among the most sought-after historic racers.'
    }
  },
  {
    id: 'gt-legends-90s',
    name: 'GT Legends - 90s Supercar Showdown',
    organizer: 'historic-club',
    organizerId: 'gt-legends',
    organizerName: 'GT Legends Club',
    carClassIds: ['gt1'],
    preferredTrackIds: ['spa', 'monza', 'le_mans', 'laguna_seca'],
    preferredTrackRegion: 'europe',
    description: 'Race legendary GT1 homologation specials - McLaren F1 GTR, Porsche 911 GT1, and Mercedes CLK-GTR.',
    prestige: 90,
    minReputation: 65,
    frequency: 'annual',
    rewards: {
      prize: 25000,
      reputationBonus: 3,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 3,
      description: 'GT1 cars are incredibly valuable and opportunities to race them are rare.'
    }
  },
  {
    id: 'procar-revival',
    name: 'BMW M1 Procar Revival',
    organizer: 'historic-club',
    organizerId: 'procar-association',
    organizerName: 'BMW M1 Procar Association',
    carClassIds: ['m1-procar'],
    preferredTrackIds: ['hockenheim', 'nurburgring', 'monaco', 'monza'],
    preferredTrackRegion: 'europe',
    description: 'Relive the legendary Procar series with the iconic BMW M1.',
    prestige: 80,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'The Procar series was a unique chapter in motorsport history.'
    }
  },

  // ============================================
  // MANUFACTURER HERITAGE EVENTS (Medium prestige, relationship focus)
  // ============================================
  {
    id: 'porsche-heritage-cup',
    name: 'Porsche Heritage Cup',
    organizer: 'manufacturer',
    organizerId: 'porsche',
    organizerName: 'Porsche Motorsport Heritage',
    carClassIds: ['group-c', 'gt1'],
    preferredTrackIds: ['nurburgring', 'spa', 'le_mans', 'hockenheim'],
    preferredTrackRegion: 'europe',
    description: 'Porsche invites you to their exclusive Heritage Cup, featuring legendary 962 and 911 GT1 machinery.',
    prestige: 85,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 20
    },
    declineConsequences: {
      organizerRelationPenalty: 15,
      reputationPenalty: 2,
      description: 'Porsche values loyalty. Declining their heritage invitation may affect your relationship with the factory.'
    },
    conditions: {
      requiresManufacturer: ['porsche']
    }
  },
  {
    id: 'bmw-motorsport-legends',
    name: 'BMW Motorsport Legends Day',
    organizer: 'manufacturer',
    organizerId: 'bmw',
    organizerName: 'BMW M Motorsport Heritage',
    carClassIds: ['m1-procar', 'group-a'],
    preferredTrackIds: ['nurburgring', 'hockenheim', 'spa'],
    preferredTrackRegion: 'europe',
    description: 'BMW M Motorsport invites you to drive legendary M1 Procar and Group A machinery.',
    prestige: 82,
    minReputation: 45,
    frequency: 'annual',
    rewards: {
      prize: 8000,
      reputationBonus: 1,
      organizerRelationBonus: 18
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 1,
      description: 'BMW values their motorsport heritage. This invitation represents trust in you as a driver.'
    },
    conditions: {
      requiresManufacturer: ['bmw']
    }
  },
  {
    id: 'mercedes-classic-day',
    name: 'Mercedes-AMG Classic Experience',
    organizer: 'manufacturer',
    organizerId: 'mercedes-amg',
    organizerName: 'Mercedes-AMG Heritage',
    carClassIds: ['group-c', 'gt1'],
    preferredTrackIds: ['hockenheim', 'nurburgring', 'spa'],
    preferredTrackRegion: 'europe',
    description: 'Experience legendary Mercedes-Benz racing history with Sauber C9 and CLK-GTR machinery.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 1,
      organizerRelationBonus: 20
    },
    declineConsequences: {
      organizerRelationPenalty: 15,
      reputationPenalty: 2,
      description: 'Mercedes values their racing heritage. This is a prestigious invitation.'
    },
    conditions: {
      requiresManufacturer: ['mercedes-amg']
    }
  },
  {
    id: 'audi-quattro-heritage',
    name: 'Audi Sport Heritage Day',
    organizer: 'manufacturer',
    organizerId: 'audi',
    organizerName: 'Audi Sport Tradition',
    carClassIds: ['group-a'],
    preferredTrackIds: ['nurburgring', 'hockenheim', 'spa'],
    preferredTrackRegion: 'europe',
    description: 'Audi Sport invites you to experience the legendary quattro heritage in Group A machinery.',
    prestige: 78,
    minReputation: 45,
    frequency: 'annual',
    rewards: {
      prize: 8000,
      reputationBonus: 1,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 1,
      description: 'Audi\'s motorsport heritage runs deep. Your participation would be valued.'
    },
    conditions: {
      requiresManufacturer: ['audi']
    }
  },

  // ============================================
  // TRACK ANNIVERSARY EVENTS (Medium prestige, regional focus)
  // ============================================
  {
    id: 'interlagos-anniversary',
    name: 'Interlagos 80th Anniversary',
    organizer: 'track',
    organizerId: 'interlagos',
    organizerName: 'Autódromo José Carlos Pace',
    carClassIds: ['formula-classic-g2', 'formula-classic-g3', 'stock-car-1986', 'stock-car-1999'],
    preferredTrackIds: ['interlagos'],
    description: 'Celebrate 80 years of racing at the legendary Interlagos circuit with classic F1 and Stock Cars.',
    prestige: 80,
    minReputation: 45,
    frequency: 'quadrennial', // Special anniversary - every 4 years
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 5,
      reputationPenalty: 1,
      description: 'Interlagos is hallowed ground in motorsport. Anniversary celebrations are special.'
    }
  },
  {
    id: 'spa-centenary',
    name: 'Spa-Francorchamps Heritage Festival',
    organizer: 'track',
    organizerId: 'spa',
    organizerName: 'Circuit de Spa-Francorchamps',
    carClassIds: ['group-c', 'formula-classic-g2', 'gt1'],
    preferredTrackIds: ['spa'],
    description: 'Celebrate the rich history of Spa-Francorchamps with legendary racing machinery.',
    prestige: 90,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Spa is one of motorsport\'s most iconic venues. This is a prestigious invitation.'
    }
  },
  {
    id: 'bathurst-legends',
    name: 'Bathurst Legends Revival',
    organizer: 'track',
    organizerId: 'bathurst',
    organizerName: 'Mount Panorama Circuit',
    carClassIds: ['group-a', 'vintage-touring-t1'],
    preferredTrackIds: ['bathurst'],
    description: 'Conquer The Mountain in classic touring cars at the legendary Bathurst 1000 Revival.',
    prestige: 85,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Bathurst is a bucket-list circuit for any touring car enthusiast.'
    }
  },
  {
    id: 'nurburgring-nordschleife-classic',
    name: 'Nürburgring Nordschleife Classic',
    organizer: 'track',
    organizerId: 'nurburgring',
    organizerName: 'Nürburgring GmbH',
    carClassIds: ['group-c', 'gt1', 'f-vintage'],
    preferredTrackIds: ['nurburgring'],
    description: 'Take on the legendary Green Hell in classic racing machinery at the Nordschleife Classic.',
    prestige: 92,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 20000,
      reputationBonus: 2,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'The Nordschleife is motorsport\'s ultimate challenge. This is a rare opportunity.'
    }
  },

  // ============================================
  // SPONSOR EVENTS (Lower prestige, relationship focused)
  // ============================================
  {
    id: 'energy-drink-showcase',
    name: 'Red Bull Historic Racing Showcase',
    organizer: 'sponsor',
    organizerId: 'red-bull',
    organizerName: 'Red Bull Racing Heritage',
    carClassIds: ['formula-classic-g3', 'formula-retro-v10'],
    preferredTrackIds: ['spielberg', 'silverstone', 'suzuka'],
    description: 'Red Bull invites you to their exclusive historic F1 showcase event.',
    prestige: 70,
    minReputation: 40,
    frequency: 'annual',
    rewards: {
      prize: 25000,
      reputationBonus: 3,
      organizerRelationBonus: 25
    },
    declineConsequences: {
      organizerRelationPenalty: 20,
      reputationPenalty: 1,
      description: 'Your sponsor expects you to attend their events. Declining may affect your relationship.'
    },
    conditions: {
      requiresSponsor: ['red-bull', 'red-bull-racing']
    }
  },
  {
    id: 'oil-company-heritage',
    name: 'Shell Heritage Racing Day',
    organizer: 'sponsor',
    organizerId: 'shell',
    organizerName: 'Shell Motorsport Heritage',
    carClassIds: ['group-c', 'gt1', 'formula-classic-g2'],
    preferredTrackIds: ['spa', 'monza', 'le_mans'],
    description: 'Shell invites you to their exclusive motorsport heritage celebration.',
    prestige: 72,
    minReputation: 40,
    frequency: 'annual',
    rewards: {
      prize: 30000,
      reputationBonus: 3,
      organizerRelationBonus: 22
    },
    declineConsequences: {
      organizerRelationPenalty: 18,
      reputationPenalty: 1,
      description: 'Shell has a rich motorsport heritage. They value driver participation at heritage events.'
    },
    conditions: {
      requiresSponsor: ['shell', 'shell-v-power']
    }
  },

  // ============================================
  // TEAM EXHIBITION EVENTS (Variable prestige)
  // ============================================
  {
    id: 'team-centenary',
    name: 'Team Heritage Exhibition',
    organizer: 'team',
    organizerName: 'Your Team\'s Heritage Department',
    carClassIds: ['group-c', 'gt1', 'group-a', 'formula-classic-g2'],
    description: 'Your team invites you to participate in their heritage exhibition event.',
    prestige: 65,
    minReputation: 30,
    frequency: 'multiple', // Teams host multiple heritage events per year
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 0,
      description: 'Your team would appreciate your participation, though they understand your busy schedule.'
    }
  },

  // ============================================
  // DECADE-THEMED EVENTS
  // ============================================
  {
    id: 'glory-days-70s',
    name: 'Glory Days of the 70s',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'Goodwood Revival',
    carClassIds: ['formula-classic-g1', 'gt-classic', 'vintage-touring-t1'],
    preferredTrackIds: ['brands_hatch', 'silverstone', 'monza', 'spa'],
    description: 'A celebration of 1970s motorsport featuring ground-effect F1, powerful GT cars, and thundering touring cars.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'The 1970s were a golden era. Declining this invitation may affect your standing with historic events.'
    }
  },
  {
    id: 'turbo-era-festival',
    name: 'Turbo Era Festival',
    organizer: 'historic-club',
    organizerId: 'historic-grand-prix',
    organizerName: 'Historic Grand Prix Association',
    carClassIds: ['formula-classic-g2', 'group-c', 'group-a'],
    preferredTrackIds: ['hockenheim', 'monza', 'spa', 'silverstone'],
    description: 'Experience the raw power of 1980s turbo technology - from 1000+ HP F1 cars to screaming Group C prototypes.',
    prestige: 90,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 18000,
      reputationBonus: 2,
      organizerRelationBonus: 14
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'The turbo era defined a generation. This is a prestigious invitation.'
    }
  },
  {
    id: 'nineties-nostalgia',
    name: '90s Supercar Showdown',
    organizer: 'historic-club',
    organizerId: 'gt-legends',
    organizerName: 'GT Legends Club',
    carClassIds: ['gt1', 'formula-classic-g3', 'group-a'],
    preferredTrackIds: ['suzuka', 'laguna_seca', 'spa', 'nurburgring'],
    description: 'The 1990s brought us the McLaren F1, Porsche GT1, and the last naturally-aspirated F1 cars. Relive it all.',
    prestige: 92,
    minReputation: 65,
    frequency: 'annual',
    rewards: {
      prize: 22000,
      reputationBonus: 3,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 3,
      description: 'The 90s were peak motorsport. Declining may significantly impact future invitations.'
    }
  },
  {
    id: 'millennium-machines',
    name: 'Millennium Machines - 2000s Revival',
    organizer: 'historic-club',
    organizerId: 'group-c-club',
    organizerName: 'Sports Prototype Heritage',
    carClassIds: ['formula-retro-v10', 'gt1-2005', 'lmp1-2005', 'lmp2-2005'],
    preferredTrackIds: ['le_mans', 'spa', 'sebring', 'monza'],
    description: 'The 2000s brought V10 F1 screaming into the new millennium alongside revolutionary prototype and GT machinery.',
    prestige: 82,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'The 2000s are becoming classic. This is a great opportunity.'
    }
  },
  {
    id: 'swinging-sixties',
    name: 'Swinging Sixties Sprint',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'Goodwood Revival',
    carClassIds: ['vintage-touring-t2', 'gt-classic'],
    preferredTrackIds: ['brands_hatch', 'silverstone', 'oulton_park', 'donington'],
    description: 'Step back to the 1960s with nimble touring cars and early GT racers on classic British circuits.',
    prestige: 85,
    minReputation: 45,
    frequency: 'annual',
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'The 60s were motorsport\'s romantic era. This is a charming invitation.'
    }
  },

  // ============================================
  // MORE BRAZILIAN EVENTS
  // ============================================
  {
    id: 'brazilian-legends-opala',
    name: 'Chevrolet Opala Legends',
    organizer: 'historic-club',
    organizerId: 'brazilian-motorsport-heritage',
    organizerName: 'Brazilian Motorsport Heritage Foundation',
    carClassIds: ['stock-car-1979', 'stock-car-1986'],
    preferredTrackIds: ['interlagos', 'goiania', 'curitiba', 'taruma'],
    preferredTrackRegion: 'brazil',
    description: 'Celebrate the legendary Chevrolet Opala, the car that defined Brazilian Stock Car racing for decades.',
    prestige: 72,
    minReputation: 35,
    frequency: 'annual',
    rewards: {
      prize: 7000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 5,
      reputationPenalty: 1,
      description: 'The Opala is an icon of Brazilian motorsport.'
    }
  },
  {
    id: 'copa-classic-challenge',
    name: 'Copa Classic Challenge',
    organizer: 'historic-club',
    organizerId: 'brazilian-motorsport-heritage',
    organizerName: 'Brazilian Motorsport Heritage Foundation',
    carClassIds: ['copa-classic-b', 'copa-classic-fl'],
    preferredTrackIds: ['interlagos', 'goiania', 'curitiba', 'londrina', 'cascavel'],
    preferredTrackRegion: 'brazil',
    description: 'Race the iconic cars of Copa Classic - from Passats to Pumas in pure Brazilian racing spirit.',
    prestige: 68,
    minReputation: 30,
    frequency: 'multiple', // Regional events happen several times a year
    rewards: {
      prize: 6000,
      reputationBonus: 1,
      organizerRelationBonus: 8
    },
    declineConsequences: {
      organizerRelationPenalty: 4,
      reputationPenalty: 0,
      description: 'Copa Classic events are beloved in Brazil.'
    }
  },
  {
    id: 'interlagos-memories',
    name: 'Interlagos Memories - Senna Tribute',
    organizer: 'track',
    organizerId: 'interlagos',
    organizerName: 'Autódromo José Carlos Pace',
    carClassIds: ['formula-classic-g2', 'formula-classic-g3', 'formula-retro-v10'],
    preferredTrackIds: ['interlagos'],
    description: 'A special tribute event at Interlagos honoring Brazil\'s greatest racing heroes in the cars they drove.',
    prestige: 95,
    minReputation: 65,
    frequency: 'annual',
    rewards: {
      prize: 20000,
      reputationBonus: 3,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 3,
      description: 'This is one of motorsport\'s most emotional events. Declining would be noticed.'
    }
  },
  {
    id: 'taruma-thunder',
    name: 'Tarumã Thunder Classic',
    organizer: 'track',
    organizerId: 'taruma',
    organizerName: 'Autódromo Internacional de Tarumã',
    carClassIds: ['stock-car-1979', 'stock-car-1986', 'hot-cars', 'copa-classic-b'],
    preferredTrackIds: ['taruma'],
    preferredTrackRegion: 'brazil',
    description: 'Experience the history of southern Brazilian motorsport at the legendary Tarumã circuit.',
    prestige: 70,
    minReputation: 35,
    frequency: 'annual',
    rewards: {
      prize: 6000,
      reputationBonus: 1,
      organizerRelationBonus: 8
    },
    declineConsequences: {
      organizerRelationPenalty: 4,
      reputationPenalty: 0,
      description: 'Tarumã is a historic venue for Brazilian racing.'
    }
  },

  // ============================================
  // MORE EUROPEAN EVENTS
  // ============================================
  {
    id: 'monaco-historic-gp',
    name: 'Monaco Historic Grand Prix',
    organizer: 'track',
    organizerId: 'monaco',
    organizerName: 'Automobile Club de Monaco',
    carClassIds: ['formula-classic-g1', 'formula-classic-g2', 'formula-classic-g3'],
    preferredTrackIds: ['monaco'],
    description: 'The most glamorous historic racing event in the world. Race classic F1 cars through the streets of Monte Carlo.',
    prestige: 98,
    minReputation: 75,
    frequency: 'biennial', // Monaco Historic GP is every 2 years
    rewards: {
      prize: 30000,
      reputationBonus: 4,
      organizerRelationBonus: 20
    },
    declineConsequences: {
      organizerRelationPenalty: 15,
      reputationPenalty: 5,
      description: 'Monaco Historic is the pinnacle of historic racing. Declining this invitation is a serious matter.'
    }
  },
  {
    id: 'silverstone-classic',
    name: 'Silverstone Classic Festival',
    organizer: 'track',
    organizerId: 'silverstone',
    organizerName: 'Silverstone Heritage',
    carClassIds: ['formula-classic-g1', 'formula-classic-g2', 'group-a', 'gt-classic'],
    preferredTrackIds: ['silverstone'],
    description: 'The UK\'s biggest classic motorsport festival celebrating the heritage of the Home of British Motor Racing.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Silverstone Classic is a major event on the historic racing calendar.'
    }
  },
  {
    id: 'spa-six-hours',
    name: 'Spa Six Hours Classic',
    organizer: 'track',
    organizerId: 'spa',
    organizerName: 'Circuit de Spa-Francorchamps',
    carClassIds: ['gt-classic', 'vintage-touring-t1', 'vintage-touring-t2'],
    preferredTrackIds: ['spa'],
    description: 'A classic endurance event at Spa featuring pre-1966 GT and touring cars racing into the Belgian sunset.',
    prestige: 86,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 2,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Spa Six Hours is a beloved event for vintage car enthusiasts.'
    }
  },
  {
    id: 'mugello-classic',
    name: 'Mugello Classic',
    organizer: 'track',
    organizerId: 'mugello',
    organizerName: 'Autodromo del Mugello',
    carClassIds: ['group-c', 'gt1', 'formula-classic-g3'],
    preferredTrackIds: ['mugello'],
    preferredTrackRegion: 'europe',
    description: 'Experience the flowing Tuscan hills in legendary racing machinery at the Ferrari-owned Mugello circuit.',
    prestige: 84,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Mugello is one of the world\'s great driver\'s circuits.'
    }
  },
  {
    id: 'imola-memorial',
    name: 'Imola Memorial Trophy',
    organizer: 'track',
    organizerId: 'imola',
    organizerName: 'Autodromo Enzo e Dino Ferrari',
    carClassIds: ['formula-classic-g2', 'formula-classic-g3', 'formula-retro-v10'],
    preferredTrackIds: ['imola'],
    description: 'A respectful tribute event at Imola honoring the legends who raced at this historic Italian circuit.',
    prestige: 90,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 16000,
      reputationBonus: 2,
      organizerRelationBonus: 14
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'Imola holds a special place in motorsport history. This is a meaningful invitation.'
    }
  },
  {
    id: 'hockenheim-historic',
    name: 'Hockenheim Historic Festival',
    organizer: 'track',
    organizerId: 'hockenheim',
    organizerName: 'Hockenheimring',
    carClassIds: ['group-a', 'm1-procar', 'formula-classic-g2', 'group-c'],
    preferredTrackIds: ['hockenheim'],
    description: 'Relive the glory days of German motorsport at the legendary Hockenheimring.',
    prestige: 82,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Hockenheim has hosted legendary battles throughout motorsport history.'
    }
  },
  {
    id: 'zandvoort-historic',
    name: 'Zandvoort Historic Grand Prix',
    organizer: 'track',
    organizerId: 'zandvoort',
    organizerName: 'Circuit Zandvoort',
    carClassIds: ['formula-classic-g1', 'formula-classic-g2', 'group-a'],
    preferredTrackIds: ['zandvoort'],
    description: 'Race through the legendary dunes of Zandvoort in classic Grand Prix and touring cars.',
    prestige: 85,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Zandvoort\'s unique character makes it a favorite for historic racing.'
    }
  },

  // ============================================
  // AUSTRALIAN & ASIAN EVENTS
  // ============================================
  {
    id: 'phillip-island-classic',
    name: 'Phillip Island Classic',
    organizer: 'track',
    organizerId: 'phillip_island',
    organizerName: 'Phillip Island Circuit',
    carClassIds: ['group-a', 'gt-classic', 'vintage-touring-t1'],
    preferredTrackIds: ['phillip_island'],
    description: 'Australia\'s premier historic motorsport event featuring the best of touring car and GT racing heritage.',
    prestige: 80,
    minReputation: 45,
    frequency: 'annual',
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 5,
      reputationPenalty: 1,
      description: 'Phillip Island Classic is a major event in Australian motorsport.'
    }
  },
  {
    id: 'suzuka-sound-of-engine',
    name: 'Suzuka Sound of Engine',
    organizer: 'track',
    organizerId: 'suzuka',
    organizerName: 'Suzuka Circuit',
    carClassIds: ['formula-retro-v10', 'gt1', 'group-c'],
    preferredTrackIds: ['suzuka'],
    description: 'Experience the legendary acoustics of Suzuka with screaming V10 F1 cars and legendary sports cars.',
    prestige: 92,
    minReputation: 65,
    frequency: 'annual',
    rewards: {
      prize: 20000,
      reputationBonus: 3,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 3,
      description: 'Suzuka\'s Sound of Engine is one of the most spectacular historic events in the world.'
    }
  },
  {
    id: 'fuji-speedway-classic',
    name: 'Fuji Speedway Classic',
    organizer: 'track',
    organizerId: 'fuji',
    organizerName: 'Fuji Speedway',
    carClassIds: ['gt1-2005', 'lmp1-2005', 'formula-retro-v10'],
    preferredTrackIds: ['fuji'],
    description: 'Race at the foot of Mount Fuji in the cars that made this circuit famous worldwide.',
    prestige: 85,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Fuji Speedway has hosted some of the most dramatic races in history.'
    }
  },

  // ============================================
  // AMERICAN EVENTS
  // ============================================
  {
    id: 'laguna-seca-historics',
    name: 'Laguna Seca Historics',
    organizer: 'track',
    organizerId: 'laguna_seca',
    organizerName: 'WeatherTech Raceway Laguna Seca',
    carClassIds: ['group-c', 'gt1', 'formula-classic-g1', 'formula-classic-g2'],
    preferredTrackIds: ['laguna_seca'],
    description: 'Challenge the legendary Corkscrew in some of the greatest racing cars ever built.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 16000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'Laguna Seca Historics is one of America\'s premier vintage racing events.'
    }
  },
  {
    id: 'road-america-vintage',
    name: 'Road America Vintage Weekend',
    organizer: 'track',
    organizerId: 'road_america',
    organizerName: 'Road America',
    carClassIds: ['gt-classic', 'vintage-touring-t1', 'group-a', 'group-c'],
    preferredTrackIds: ['road_america'],
    description: 'Experience America\'s National Park of Speed with classic racing machinery on 4 miles of rolling Wisconsin terrain.',
    prestige: 82,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Road America is a bucket-list circuit for any racing enthusiast.'
    }
  },
  {
    id: 'watkins-glen-vintage-festival',
    name: 'Watkins Glen Vintage Grand Prix',
    organizer: 'track',
    organizerId: 'watkins_glen',
    organizerName: 'Watkins Glen International',
    carClassIds: ['formula-classic-g1', 'gt-classic', 'lmp1-2005'],
    preferredTrackIds: ['watkins_glen'],
    description: 'Celebrate the legacy of Watkins Glen, home of the first post-war US Grand Prix.',
    prestige: 85,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Watkins Glen\'s history is deeply intertwined with international motorsport.'
    }
  },
  {
    id: 'sebring-historic',
    name: 'Sebring Historic Endurance',
    organizer: 'track',
    organizerId: 'sebring',
    organizerName: 'Sebring International Raceway',
    carClassIds: ['group-c', 'lmp1-2005', 'lmp2-2005', 'gt1-2005'],
    preferredTrackIds: ['sebring'],
    description: 'Race on the legendary concrete and asphalt of Sebring in the cars that conquered America\'s oldest sports car race.',
    prestige: 90,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 18000,
      reputationBonus: 2,
      organizerRelationBonus: 14
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'Sebring is one of motorsport\'s most legendary venues.'
    }
  },

  // ============================================
  // ADDITIONAL MANUFACTURER EVENTS
  // ============================================
  {
    id: 'ferrari-corse-clienti',
    name: 'Ferrari Corse Clienti Heritage',
    organizer: 'manufacturer',
    organizerId: 'ferrari',
    organizerName: 'Ferrari Corse Clienti',
    carClassIds: ['gt1', 'gt1-2005', 'gt2-2005'],
    preferredTrackIds: ['fiorano', 'mugello', 'monza', 'imola'],
    preferredTrackRegion: 'europe',
    description: 'Ferrari\'s exclusive heritage program invites you to drive legendary Prancing Horse GT racers.',
    prestige: 95,
    minReputation: 70,
    frequency: 'annual',
    rewards: {
      prize: 25000,
      reputationBonus: 3,
      organizerRelationBonus: 25
    },
    declineConsequences: {
      organizerRelationPenalty: 20,
      reputationPenalty: 4,
      description: 'A Ferrari Corse Clienti invitation is among the most prestigious in motorsport.'
    },
    conditions: {
      requiresManufacturer: ['ferrari']
    }
  },
  {
    id: 'mclaren-heritage-programme',
    name: 'McLaren Heritage Programme',
    organizer: 'manufacturer',
    organizerId: 'mclaren',
    organizerName: 'McLaren Heritage',
    carClassIds: ['gt1', 'formula-retro-v10'],
    preferredTrackIds: ['silverstone', 'spa', 'monza'],
    description: 'McLaren invites you to experience their legendary F1 GTR and classic Formula 1 heritage.',
    prestige: 94,
    minReputation: 68,
    frequency: 'annual',
    rewards: {
      prize: 22000,
      reputationBonus: 3,
      organizerRelationBonus: 22
    },
    declineConsequences: {
      organizerRelationPenalty: 18,
      reputationPenalty: 3,
      description: 'McLaren\'s heritage programme is exclusive and highly regarded.'
    },
    conditions: {
      requiresManufacturer: ['mclaren']
    }
  },
  {
    id: 'jaguar-heritage-racing',
    name: 'Jaguar Heritage Racing Experience',
    organizer: 'manufacturer',
    organizerId: 'jaguar',
    organizerName: 'Jaguar Heritage Trust',
    carClassIds: ['group-c', 'gt-classic'],
    preferredTrackIds: ['silverstone', 'brands_hatch', 'spa', 'le_mans'],
    description: 'Drive the legendary XJR-9 and XJR-14 that brought Le Mans glory back to Jaguar.',
    prestige: 88,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 18
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 2,
      description: 'Jaguar\'s Le Mans heritage is legendary. This is a special opportunity.'
    },
    conditions: {
      requiresManufacturer: ['jaguar']
    }
  },
  {
    id: 'toyota-gazoo-heritage',
    name: 'Toyota Gazoo Racing Heritage',
    organizer: 'manufacturer',
    organizerId: 'toyota',
    organizerName: 'Toyota Gazoo Racing',
    carClassIds: ['group-c', 'gt1', 'lmp1-2005'],
    preferredTrackIds: ['fuji', 'suzuka', 'le_mans', 'spa'],
    description: 'Experience Toyota\'s motorsport heritage from Group C to their relentless pursuit of Le Mans glory.',
    prestige: 85,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 16
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'Toyota\'s motorsport journey is one of determination and ultimate triumph.'
    },
    conditions: {
      requiresManufacturer: ['toyota']
    }
  },
  {
    id: 'nissan-nismo-heritage',
    name: 'Nissan NISMO Heritage Experience',
    organizer: 'manufacturer',
    organizerId: 'nissan',
    organizerName: 'NISMO Heritage',
    carClassIds: ['group-c', 'gt1'],
    preferredTrackIds: ['suzuka', 'fuji', 'le_mans'],
    description: 'Drive the legendary Group C cars that made Nissan a force at Le Mans.',
    prestige: 82,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 1,
      organizerRelationBonus: 14
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 1,
      description: 'NISMO\'s heritage program celebrates their global motorsport achievements.'
    },
    conditions: {
      requiresManufacturer: ['nissan']
    }
  },
  {
    id: 'lamborghini-squadra-corse-heritage',
    name: 'Lamborghini Squadra Corse Heritage',
    organizer: 'manufacturer',
    organizerId: 'lamborghini',
    organizerName: 'Lamborghini Squadra Corse',
    carClassIds: ['gt1', 'gt1-2005'],
    preferredTrackIds: ['imola', 'monza', 'mugello', 'spa'],
    description: 'Experience the wild side of Italian GT racing with Lamborghini\'s historic race cars.',
    prestige: 86,
    minReputation: 55,
    frequency: 'annual',
    rewards: {
      prize: 15000,
      reputationBonus: 2,
      organizerRelationBonus: 18
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 2,
      description: 'Lamborghini brings passion and drama to everything they do.'
    },
    conditions: {
      requiresManufacturer: ['lamborghini']
    }
  },
  {
    id: 'aston-martin-heritage-racing',
    name: 'Aston Martin Heritage Racing',
    organizer: 'manufacturer',
    organizerId: 'aston-martin',
    organizerName: 'Aston Martin Racing Heritage',
    carClassIds: ['gt1', 'gt1-2005', 'gt-open'],
    preferredTrackIds: ['silverstone', 'le_mans', 'spa', 'nurburgring'],
    description: 'Race the beautiful and brutal Aston Martin GT machines that have graced Le Mans and beyond.',
    prestige: 88,
    minReputation: 58,
    frequency: 'annual',
    rewards: {
      prize: 16000,
      reputationBonus: 2,
      organizerRelationBonus: 18
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 2,
      description: 'Aston Martin\'s racing heritage is steeped in elegance and speed.'
    },
    conditions: {
      requiresManufacturer: ['aston-martin']
    }
  },

  // ============================================
  // SPECIAL THEMED EVENTS
  // ============================================
  {
    id: 'dtm-legends',
    name: 'DTM Legends Reunion',
    organizer: 'historic-club',
    organizerId: 'group-c-club',
    organizerName: 'German Touring Car Heritage',
    carClassIds: ['group-a'],
    preferredTrackIds: ['nurburgring', 'hockenheim', 'norisring'],
    preferredTrackRegion: 'europe',
    description: 'Relive the glory days of DTM with legendary Group A touring cars from BMW, Mercedes, and Audi.',
    prestige: 85,
    minReputation: 50,
    frequency: 'annual',
    rewards: {
      prize: 12000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'DTM\'s Group A era was peak touring car racing.'
    }
  },
  {
    id: 'group-c-masters',
    name: 'Group C Masters Series',
    organizer: 'historic-club',
    organizerId: 'group-c-club',
    organizerName: 'Group C Racing Club',
    carClassIds: ['group-c'],
    preferredTrackIds: ['spa', 'le_mans', 'nurburgring', 'silverstone', 'brands_hatch'],
    description: 'The ultimate celebration of Group C racing - Porsche 962, Jaguar XJR, Sauber-Mercedes, and more.',
    prestige: 92,
    minReputation: 62,
    frequency: 'annual',
    rewards: {
      prize: 22000,
      reputationBonus: 3,
      organizerRelationBonus: 15
    },
    declineConsequences: {
      organizerRelationPenalty: 12,
      reputationPenalty: 3,
      description: 'Group C was the golden age of sports car racing. This is a prestigious invitation.'
    }
  },
  {
    id: 'f1-v10-screamer-fest',
    name: 'V10 Screamer Fest',
    organizer: 'historic-club',
    organizerId: 'historic-grand-prix',
    organizerName: 'Historic Grand Prix Association',
    carClassIds: ['formula-retro-v10'],
    preferredTrackIds: ['monza', 'spa', 'silverstone', 'suzuka', 'interlagos'],
    description: 'Experience the incredible 19,000 RPM V10 symphony at its finest. The last era of F1 before the hybrid age.',
    prestige: 90,
    minReputation: 60,
    frequency: 'annual',
    rewards: {
      prize: 18000,
      reputationBonus: 2,
      organizerRelationBonus: 14
    },
    declineConsequences: {
      organizerRelationPenalty: 10,
      reputationPenalty: 2,
      description: 'V10 F1 cars represent the pinnacle of naturally-aspirated performance.'
    }
  },
  {
    id: 'touring-car-worlds',
    name: 'Touring Car World Challenge',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'World Touring Car Heritage',
    carClassIds: ['group-a', 'vintage-touring-t1', 'vintage-touring-t2'],
    preferredTrackIds: ['brands_hatch', 'spa', 'bathurst', 'monza', 'interlagos'],
    description: 'A global celebration of touring car racing spanning three decades of close-quarters action.',
    prestige: 84,
    minReputation: 48,
    frequency: 'annual',
    rewards: {
      prize: 11000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 6,
      reputationPenalty: 1,
      description: 'Touring car racing has always been about wheel-to-wheel action.'
    }
  },
  {
    id: 'gt-classic-50s-60s',
    name: 'GT Classic - Gentlemen Drivers',
    organizer: 'historic-club',
    organizerId: 'goodwood',
    organizerName: 'Goodwood Revival',
    carClassIds: ['gt-classic', 'vintage-touring-t2'],
    preferredTrackIds: ['goodwood', 'brands_hatch', 'silverstone'],
    description: 'Step into the shoes of the original gentleman racers with beautiful 1960s GT and touring machinery.',
    prestige: 88,
    minReputation: 52,
    frequency: 'annual',
    rewards: {
      prize: 13000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'The Gentlemen Drivers era was motorsport at its most romantic.'
    }
  },
  {
    id: 'prototype-legends',
    name: 'Prototype Legends - Le Mans Winners',
    organizer: 'historic-club',
    organizerId: 'le-mans-classic',
    organizerName: 'Le Mans Classic',
    carClassIds: ['group-c', 'lmp1-2005', 'gt1'],
    preferredTrackIds: ['le_mans', 'spa', 'sebring'],
    description: 'Race the cars that conquered the 24 Hours of Le Mans across three decades of prototype evolution.',
    prestige: 95,
    minReputation: 68,
    frequency: 'biennial', // Part of Le Mans Classic - every 2 years
    rewards: {
      prize: 28000,
      reputationBonus: 3,
      organizerRelationBonus: 18
    },
    declineConsequences: {
      organizerRelationPenalty: 15,
      reputationPenalty: 4,
      description: 'These are the machines that wrote Le Mans history. This is an exceptional invitation.'
    }
  },
  {
    id: 'gt-open-revival',
    name: 'GT Open Revival Series',
    organizer: 'historic-club',
    organizerId: 'gt-legends',
    organizerName: 'GT Legends Club',
    carClassIds: ['gt-open', 'gt1-2005', 'gt2-2005'],
    preferredTrackIds: ['spa', 'monza', 'barcelona', 'portimao'],
    description: 'Celebrate the International GT Open era with exotic machinery from the late 2000s.',
    prestige: 78,
    minReputation: 45,
    frequency: 'annual',
    rewards: {
      prize: 10000,
      reputationBonus: 1,
      organizerRelationBonus: 10
    },
    declineConsequences: {
      organizerRelationPenalty: 5,
      reputationPenalty: 1,
      description: 'GT Open brought exciting racing to European circuits.'
    }
  },
  {
    id: 'lmp-challenge',
    name: 'LMP Challenge - Prototype Pursuit',
    organizer: 'historic-club',
    organizerId: 'le-mans-classic',
    organizerName: 'Le Mans Classic',
    carClassIds: ['lmp1-2005', 'lmp2-2005'],
    preferredTrackIds: ['le_mans', 'spa', 'sebring', 'monza'],
    description: 'Race the 2005-era Le Mans Prototypes that bridged the gap between Group C and modern hypercars.',
    prestige: 82,
    minReputation: 52,
    frequency: 'biennial', // Part of Le Mans Classic - every 2 years
    rewards: {
      prize: 14000,
      reputationBonus: 2,
      organizerRelationBonus: 12
    },
    declineConsequences: {
      organizerRelationPenalty: 8,
      reputationPenalty: 2,
      description: 'The 2005-era prototypes were incredibly fast and spectacular.'
    }
  }
]

// ============================================
// GENERATION LOGIC
// ============================================

/**
 * Get all historic car classes (isModern: false)
 */
export function getHistoricCarClasses(): CarClass[] {
  return AMS2_CAR_CLASSES.filter(c => !c.isModern)
}

/**
 * Get suitable tracks for a historic car class
 */
export function getSuitableTracksForClass(carClass: CarClass): AMS2Track[] {
  return ALL_TRACKS.filter(track => {
    // Match track types
    const trackTypeMatches = carClass.suitableTrackTypes.some(
      type => track.type === type || (type === 'road' && track.type === 'permanent')
    )
    return trackTypeMatches
  })
}

/**
 * Check if player is eligible for an event template
 */
export function isPlayerEligibleForEvent(
  template: InvitationalEventTemplate,
  playerReputation: number,
  playerManufacturerId?: string,
  playerSponsorIds?: string[],
  playerNationality?: string,
  currentYear?: number
): boolean {
  // Check minimum reputation
  if (playerReputation < template.minReputation) {
    return false
  }

  // Check conditions
  if (template.conditions) {
    const { requiresManufacturer, requiresSponsor, requiresNationality, seasonOnly } = template.conditions

    // Manufacturer requirement
    if (requiresManufacturer && playerManufacturerId) {
      if (!requiresManufacturer.includes(playerManufacturerId)) {
        return false
      }
    } else if (requiresManufacturer && !playerManufacturerId) {
      return false
    }

    // Sponsor requirement
    if (requiresSponsor && playerSponsorIds) {
      const hasSponsor = requiresSponsor.some(id => playerSponsorIds.includes(id))
      if (!hasSponsor) {
        return false
      }
    } else if (requiresSponsor && !playerSponsorIds?.length) {
      return false
    }

    // Nationality requirement
    if (requiresNationality && playerNationality) {
      if (!requiresNationality.includes(playerNationality)) {
        return false
      }
    }

    // Season requirement
    if (seasonOnly && currentYear) {
      if (!seasonOnly.includes(currentYear)) {
        return false
      }
    }
  }

  return true
}

// ============================================
// HISTORIC LIVERIES DATABASE
// Famous liveries for historic car classes
// ============================================

interface HistoricLivery {
  carId: string
  carName: string
  manufacturer: string
  liveryNumber: number
  liveryName: string
}

const HISTORIC_LIVERIES: Record<string, HistoricLivery[]> = {
  'group-c': [
    { carId: 'porsche-962c', carName: 'Porsche 962C', manufacturer: 'Porsche', liveryNumber: 17, liveryName: 'Rothmans Porsche' },
    { carId: 'porsche-962c', carName: 'Porsche 962C', manufacturer: 'Porsche', liveryNumber: 1, liveryName: 'Shell Dunlop Racing' },
    { carId: 'porsche-962c', carName: 'Porsche 962C', manufacturer: 'Porsche', liveryNumber: 2, liveryName: 'Blaupunkt Joest Racing' },
    { carId: 'jaguar-xjr9', carName: 'Jaguar XJR-9', manufacturer: 'Jaguar', liveryNumber: 2, liveryName: 'Silk Cut Jaguar' },
    { carId: 'jaguar-xjr9', carName: 'Jaguar XJR-9', manufacturer: 'Jaguar', liveryNumber: 22, liveryName: 'Castrol Jaguar' },
    { carId: 'sauber-c9', carName: 'Sauber-Mercedes C9', manufacturer: 'Mercedes', liveryNumber: 63, liveryName: 'Sauber Mercedes' },
    { carId: 'sauber-c9', carName: 'Sauber-Mercedes C9', manufacturer: 'Mercedes', liveryNumber: 61, liveryName: 'AEG Sauber' },
    { carId: 'nissan-r89c', carName: 'Nissan R89C', manufacturer: 'Nissan', liveryNumber: 23, liveryName: 'Nissan Motorsport' },
    { carId: 'toyota-88c', carName: 'Toyota 88C-V', manufacturer: 'Toyota', liveryNumber: 36, liveryName: 'Minolta Toyota' },
  ],
  'group-a': [
    { carId: 'bmw-m3-e30', carName: 'BMW M3 E30', manufacturer: 'BMW', liveryNumber: 1, liveryName: 'Schnitzer BMW' },
    { carId: 'bmw-m3-e30', carName: 'BMW M3 E30', manufacturer: 'BMW', liveryNumber: 15, liveryName: 'Warsteiner BMW' },
    { carId: 'mercedes-190e', carName: 'Mercedes 190E 2.5-16 Evo II', manufacturer: 'Mercedes', liveryNumber: 6, liveryName: 'AMG Mercedes' },
    { carId: 'mercedes-190e', carName: 'Mercedes 190E 2.5-16 Evo II', manufacturer: 'Mercedes', liveryNumber: 11, liveryName: 'Zakspeed Mercedes' },
    { carId: 'audi-v8-dtm', carName: 'Audi V8 DTM', manufacturer: 'Audi', liveryNumber: 44, liveryName: 'Audi Sport Team AZR' },
    { carId: 'ford-sierra-rs500', carName: 'Ford Sierra RS500', manufacturer: 'Ford', liveryNumber: 7, liveryName: 'Texaco Ford' },
    { carId: 'ford-sierra-rs500', carName: 'Ford Sierra RS500', manufacturer: 'Ford', liveryNumber: 25, liveryName: 'Eggenberger Ford' },
  ],
  'gt1': [
    { carId: 'mclaren-f1-gtr', carName: 'McLaren F1 GTR', manufacturer: 'McLaren', liveryNumber: 59, liveryName: 'Ueno Clinic McLaren' },
    { carId: 'mclaren-f1-gtr', carName: 'McLaren F1 GTR', manufacturer: 'McLaren', liveryNumber: 41, liveryName: 'Gulf McLaren' },
    { carId: 'porsche-911-gt1', carName: 'Porsche 911 GT1', manufacturer: 'Porsche', liveryNumber: 25, liveryName: 'Mobil 1 Porsche' },
    { carId: 'porsche-911-gt1', carName: 'Porsche 911 GT1', manufacturer: 'Porsche', liveryNumber: 26, liveryName: 'Porsche AG' },
    { carId: 'mercedes-clk-gtr', carName: 'Mercedes CLK-GTR', manufacturer: 'Mercedes', liveryNumber: 11, liveryName: 'D2 AMG Mercedes' },
    { carId: 'mercedes-clk-gtr', carName: 'Mercedes CLK-GTR', manufacturer: 'Mercedes', liveryNumber: 12, liveryName: 'Warsteiner AMG' },
    { carId: 'toyota-gt-one', carName: 'Toyota GT-One', manufacturer: 'Toyota', liveryNumber: 3, liveryName: 'Esso Toyota' },
    { carId: 'nissan-r390', carName: 'Nissan R390 GT1', manufacturer: 'Nissan', liveryNumber: 32, liveryName: 'Nissan Motorsport' },
    { carId: 'panoz-gtr1', carName: 'Panoz GTR-1', manufacturer: 'Panoz', liveryNumber: 45, liveryName: 'Team Panoz' },
  ],
  'm1-procar': [
    { carId: 'bmw-m1', carName: 'BMW M1 Procar', manufacturer: 'BMW', liveryNumber: 1, liveryName: 'Project Four Racing' },
    { carId: 'bmw-m1', carName: 'BMW M1 Procar', manufacturer: 'BMW', liveryNumber: 5, liveryName: 'Cassani BMW' },
    { carId: 'bmw-m1', carName: 'BMW M1 Procar', manufacturer: 'BMW', liveryNumber: 25, liveryName: 'Osella BMW' },
    { carId: 'bmw-m1', carName: 'BMW M1 Procar', manufacturer: 'BMW', liveryNumber: 81, liveryName: 'BASF BMW' },
    { carId: 'bmw-m1', carName: 'BMW M1 Procar', manufacturer: 'BMW', liveryNumber: 8, liveryName: 'Pooh Jeans BMW' },
  ],
  'formula-classic-g1': [
    { carId: 'lotus-79', carName: 'Lotus 79', manufacturer: 'Lotus', liveryNumber: 5, liveryName: 'JPS Lotus' },
    { carId: 'lotus-79', carName: 'Lotus 79', manufacturer: 'Lotus', liveryNumber: 6, liveryName: 'Essex Lotus' },
    { carId: 'brabham-bt49', carName: 'Brabham BT49', manufacturer: 'Brabham', liveryNumber: 5, liveryName: 'Parmalat Brabham' },
    { carId: 'williams-fw07', carName: 'Williams FW07', manufacturer: 'Williams', liveryNumber: 27, liveryName: 'Saudia Williams' },
    { carId: 'ferrari-312t4', carName: 'Ferrari 312 T4', manufacturer: 'Ferrari', liveryNumber: 11, liveryName: 'Scuderia Ferrari' },
  ],
  'formula-classic-g2': [
    { carId: 'lotus-98t', carName: 'Lotus 98T', manufacturer: 'Lotus', liveryNumber: 12, liveryName: 'JPS Lotus' },
    { carId: 'mclaren-mp4-2', carName: 'McLaren MP4/2', manufacturer: 'McLaren', liveryNumber: 1, liveryName: 'Marlboro McLaren' },
    { carId: 'williams-fw11', carName: 'Williams FW11', manufacturer: 'Williams', liveryNumber: 5, liveryName: 'Canon Williams' },
    { carId: 'ferrari-f1-87', carName: 'Ferrari F1/87', manufacturer: 'Ferrari', liveryNumber: 27, liveryName: 'Scuderia Ferrari' },
    { carId: 'brabham-bt55', carName: 'Brabham BT55', manufacturer: 'Brabham', liveryNumber: 7, liveryName: 'Olivetti Brabham' },
  ],
  'formula-classic-g3': [
    { carId: 'mclaren-mp4-6', carName: 'McLaren MP4/6', manufacturer: 'McLaren', liveryNumber: 1, liveryName: 'Marlboro McLaren' },
    { carId: 'williams-fw14b', carName: 'Williams FW14B', manufacturer: 'Williams', liveryNumber: 5, liveryName: 'Canon Williams' },
    { carId: 'ferrari-643', carName: 'Ferrari 643', manufacturer: 'Ferrari', liveryNumber: 27, liveryName: 'Scuderia Ferrari' },
    { carId: 'benetton-b191', carName: 'Benetton B191', manufacturer: 'Benetton', liveryNumber: 19, liveryName: 'Camel Benetton' },
    { carId: 'jordan-191', carName: 'Jordan 191', manufacturer: 'Jordan', liveryNumber: 32, liveryName: '7Up Jordan' },
  ],
  'formula-retro-v10': [
    { carId: 'ferrari-f2004', carName: 'Ferrari F2004', manufacturer: 'Ferrari', liveryNumber: 1, liveryName: 'Marlboro Ferrari' },
    { carId: 'mclaren-mp4-20', carName: 'McLaren MP4-20', manufacturer: 'McLaren', liveryNumber: 9, liveryName: 'West McLaren' },
    { carId: 'renault-r25', carName: 'Renault R25', manufacturer: 'Renault', liveryNumber: 5, liveryName: 'Mild Seven Renault' },
    { carId: 'williams-fw26', carName: 'Williams FW26', manufacturer: 'Williams', liveryNumber: 3, liveryName: 'BMW Williams' },
    { carId: 'benetton-b195', carName: 'Benetton B195', manufacturer: 'Benetton', liveryNumber: 1, liveryName: 'Mild Seven Benetton' },
    { carId: 'jordan-ej15', carName: 'Jordan EJ15', manufacturer: 'Jordan', liveryNumber: 18, liveryName: 'DHL Jordan' },
  ],
  'gt-classic': [
    { carId: 'ferrari-250-gto', carName: 'Ferrari 250 GTO', manufacturer: 'Ferrari', liveryNumber: 22, liveryName: 'NART Ferrari' },
    { carId: 'shelby-cobra', carName: 'Shelby Cobra Daytona', manufacturer: 'Shelby', liveryNumber: 5, liveryName: 'Shelby American' },
    { carId: 'porsche-911-rsr', carName: 'Porsche 911 RSR', manufacturer: 'Porsche', liveryNumber: 46, liveryName: 'Martini Racing' },
    { carId: 'ford-gt40', carName: 'Ford GT40', manufacturer: 'Ford', liveryNumber: 1, liveryName: 'Gulf Ford' },
    { carId: 'jaguar-e-type', carName: 'Jaguar E-Type', manufacturer: 'Jaguar', liveryNumber: 15, liveryName: 'Briggs Cunningham' },
  ],
  'vintage-touring-t1': [
    { carId: 'ford-capri-rs3100', carName: 'Ford Capri RS3100', manufacturer: 'Ford', liveryNumber: 3, liveryName: 'Cologne Capri' },
    { carId: 'bmw-3.0-csl', carName: 'BMW 3.0 CSL', manufacturer: 'BMW', liveryNumber: 25, liveryName: 'BMW Motorsport' },
    { carId: 'chevrolet-camaro-z28', carName: 'Chevrolet Camaro Z28', manufacturer: 'Chevrolet', liveryNumber: 7, liveryName: 'Penske Racing' },
    { carId: 'opala-stock-79', carName: 'Chevrolet Opala', manufacturer: 'Chevrolet', liveryNumber: 1, liveryName: 'Copersucar' },
  ],
  'vintage-touring-t2': [
    { carId: 'lotus-cortina', carName: 'Lotus Cortina', manufacturer: 'Ford', liveryNumber: 1, liveryName: 'Team Lotus' },
    { carId: 'mini-cooper-s', carName: 'Mini Cooper S', manufacturer: 'Mini', liveryNumber: 37, liveryName: 'BMC Works' },
    { carId: 'alfa-romeo-gta', carName: 'Alfa Romeo GTA', manufacturer: 'Alfa Romeo', liveryNumber: 33, liveryName: 'Autodelta' },
    { carId: 'ford-mustang-boss', carName: 'Ford Mustang Boss 302', manufacturer: 'Ford', liveryNumber: 15, liveryName: 'Bud Moore Racing' },
  ],
  'stock-car-1979': [
    { carId: 'opala-79', carName: 'Chevrolet Opala 1979', manufacturer: 'Chevrolet', liveryNumber: 1, liveryName: 'Copersucar Shell' },
    { carId: 'opala-79', carName: 'Chevrolet Opala 1979', manufacturer: 'Chevrolet', liveryNumber: 2, liveryName: 'Copersucar Castrol' },
    { carId: 'opala-79', carName: 'Chevrolet Opala 1979', manufacturer: 'Chevrolet', liveryNumber: 9, liveryName: 'Moura Racing' },
    { carId: 'opala-79', carName: 'Chevrolet Opala 1979', manufacturer: 'Chevrolet', liveryNumber: 15, liveryName: 'STP Racing' },
  ],
  'stock-car-1986': [
    { carId: 'opala-86', carName: 'Chevrolet Opala 1986', manufacturer: 'Chevrolet', liveryNumber: 1, liveryName: 'Shell Helix' },
    { carId: 'opala-86', carName: 'Chevrolet Opala 1986', manufacturer: 'Chevrolet', liveryNumber: 3, liveryName: 'Mobil 1' },
    { carId: 'opala-86', carName: 'Chevrolet Opala 1986', manufacturer: 'Chevrolet', liveryNumber: 7, liveryName: 'Texaco Racing' },
    { carId: 'opala-86', carName: 'Chevrolet Opala 1986', manufacturer: 'Chevrolet', liveryNumber: 12, liveryName: 'Bardahl Racing' },
  ],
  'stock-car-1999': [
    { carId: 'omega-99', carName: 'Chevrolet Omega 1999', manufacturer: 'Chevrolet', liveryNumber: 10, liveryName: 'Medley Racing' },
    { carId: 'omega-99', carName: 'Chevrolet Omega 1999', manufacturer: 'Chevrolet', liveryNumber: 18, liveryName: 'Full Time Sports' },
    { carId: 'vectra-99', carName: 'Chevrolet Vectra 1999', manufacturer: 'Chevrolet', liveryNumber: 21, liveryName: 'Ipiranga Racing' },
    { carId: 'vectra-99', carName: 'Chevrolet Vectra 1999', manufacturer: 'Chevrolet', liveryNumber: 5, liveryName: 'Shell V-Power' },
  ],
  'hot-cars': [
    { carId: 'passat-ts', carName: 'Volkswagen Passat TS', manufacturer: 'Volkswagen', liveryNumber: 1, liveryName: 'Pirelli Racing' },
    { carId: 'maverick', carName: 'Ford Maverick', manufacturer: 'Ford', liveryNumber: 7, liveryName: 'STP Ford' },
    { carId: 'chevette', carName: 'Chevrolet Chevette', manufacturer: 'Chevrolet', liveryNumber: 10, liveryName: 'Copersucar' },
    { carId: 'corcel', carName: 'Ford Corcel', manufacturer: 'Ford', liveryNumber: 15, liveryName: 'Texaco Ford' },
  ],
  'copa-classic-b': [
    { carId: 'passat-copa', carName: 'Volkswagen Passat Copa', manufacturer: 'Volkswagen', liveryNumber: 11, liveryName: 'Pirelli Racing' },
    { carId: 'chevette-copa', carName: 'Chevrolet Chevette Copa', manufacturer: 'Chevrolet', liveryNumber: 5, liveryName: 'Shell Racing' },
    { carId: 'escort-copa', carName: 'Ford Escort Copa', manufacturer: 'Ford', liveryNumber: 22, liveryName: 'Motorcraft' },
  ],
  'copa-classic-fl': [
    { carId: 'puma-gtb', carName: 'Puma GTB', manufacturer: 'Puma', liveryNumber: 8, liveryName: 'Pirelli Puma' },
    { carId: 'puma-gtb', carName: 'Puma GTB', manufacturer: 'Puma', liveryNumber: 3, liveryName: 'Shell Racing' },
    { carId: 'puma-gtb', carName: 'Puma GTB', manufacturer: 'Puma', liveryNumber: 17, liveryName: 'Ipiranga Puma' },
  ],
  'lmp1-2005': [
    { carId: 'audi-r8-lmp', carName: 'Audi R8 LMP', manufacturer: 'Audi', liveryNumber: 1, liveryName: 'Audi Sport Team Joest' },
    { carId: 'audi-r8-lmp', carName: 'Audi R8 LMP', manufacturer: 'Audi', liveryNumber: 2, liveryName: 'Champion Racing' },
    { carId: 'pescarolo-c60', carName: 'Pescarolo C60', manufacturer: 'Pescarolo', liveryNumber: 16, liveryName: 'Pescarolo Sport' },
    { carId: 'zytek-04s', carName: 'Zytek 04S', manufacturer: 'Zytek', liveryNumber: 31, liveryName: 'Team Zytek' },
  ],
  'gt1-2005': [
    { carId: 'saleen-s7r', carName: 'Saleen S7R', manufacturer: 'Saleen', liveryNumber: 50, liveryName: 'Konrad Motorsport' },
    { carId: 'corvette-c5r', carName: 'Corvette C5-R', manufacturer: 'Chevrolet', liveryNumber: 3, liveryName: 'Corvette Racing' },
    { carId: 'maserati-mc12', carName: 'Maserati MC12', manufacturer: 'Maserati', liveryNumber: 33, liveryName: 'Vitaphone Racing' },
    { carId: 'aston-martin-dbr9', carName: 'Aston Martin DBR9', manufacturer: 'Aston Martin', liveryNumber: 9, liveryName: 'Gulf Aston Martin' },
  ],
  'gt2-2005': [
    { carId: 'ferrari-f430-gt', carName: 'Ferrari F430 GT', manufacturer: 'Ferrari', liveryNumber: 62, liveryName: 'Risi Competizione' },
    { carId: 'porsche-996-gt3-rsr', carName: 'Porsche 996 GT3 RSR', manufacturer: 'Porsche', liveryNumber: 80, liveryName: 'Flying Lizard' },
    { carId: 'lamborghini-murcielago', carName: 'Lamborghini Murciélago R-GT', manufacturer: 'Lamborghini', liveryNumber: 7, liveryName: 'Reiter Engineering' },
  ],
  'gt-open': [
    { carId: 'ferrari-f430-challenge', carName: 'Ferrari F430 Challenge', manufacturer: 'Ferrari', liveryNumber: 51, liveryName: 'AF Corse' },
    { carId: 'lamborghini-gallardo-gt3', carName: 'Lamborghini Gallardo GT3', manufacturer: 'Lamborghini', liveryNumber: 25, liveryName: 'Reiter Engineering' },
    { carId: 'porsche-997-gt3-cup', carName: 'Porsche 997 GT3 Cup', manufacturer: 'Porsche', liveryNumber: 77, liveryName: 'Porsche Zentrum' },
  ],
}

// Default liveries for classes without specific data
const DEFAULT_LIVERY_TEMPLATES = [
  { liveryNumber: 1, liveryName: 'Works Team' },
  { liveryNumber: 7, liveryName: 'Privateer Entry' },
  { liveryNumber: 22, liveryName: 'Guest Driver Entry' },
  { liveryNumber: 88, liveryName: 'Heritage Collection' },
]

/**
 * Get a random livery for a car class
 */
function getRandomLivery(carClassId: string, carClassName: string): HistoricLivery {
  const liveries = HISTORIC_LIVERIES[carClassId]
  
  if (liveries && liveries.length > 0) {
    return liveries[Math.floor(Math.random() * liveries.length)]
  }
  
  // Fallback for classes without specific liveries
  const defaultTemplate = DEFAULT_LIVERY_TEMPLATES[Math.floor(Math.random() * DEFAULT_LIVERY_TEMPLATES.length)]
  return {
    carId: carClassId,
    carName: carClassName,
    manufacturer: 'Various',
    liveryNumber: defaultTemplate.liveryNumber,
    liveryName: defaultTemplate.liveryName
  }
}

/**
 * Generate an invitational event instance from a template
 */
export function generateInvitationalEvent(
  template: InvitationalEventTemplate,
  week: number,
  year: number
): InvitationalEvent {
  // Select a car class
  const availableClasses = AMS2_CAR_CLASSES.filter(c => template.carClassIds.includes(c.id))
  const selectedClass = availableClasses[Math.floor(Math.random() * availableClasses.length)]

  // Select a track
  let availableTracks: AMS2Track[] = []
  
  if (template.preferredTrackIds?.length) {
    availableTracks = ALL_TRACKS.filter(t => template.preferredTrackIds!.includes(t.id))
  }
  
  if (availableTracks.length === 0 && template.preferredTrackRegion) {
    availableTracks = ALL_TRACKS.filter(t => t.region === template.preferredTrackRegion)
  }
  
  if (availableTracks.length === 0) {
    // Fallback to any suitable track
    availableTracks = getSuitableTracksForClass(selectedClass)
  }

  const selectedTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)]
  const selectedLayout = selectedTrack.layouts[Math.floor(Math.random() * selectedTrack.layouts.length)]

  // Get a livery/team for this car class
  const livery = getRandomLivery(selectedClass.id, selectedClass.name)

  return {
    ...template,
    instanceId: `inv-${template.id}-${year}-${week}-${Math.random().toString(36).substr(2, 9)}`,
    week,
    year,
    trackId: selectedTrack.id,
    trackName: selectedTrack.name,
    layoutId: selectedLayout.id,
    layoutName: selectedLayout.name,
    carClassId: selectedClass.id,
    carClassName: selectedClass.name,
    assignedCar: {
      id: livery.carId,
      name: livery.carName,
      manufacturer: livery.manufacturer,
      liveryNumber: livery.liveryNumber,
      liveryName: livery.liveryName
    },
    status: 'pending',
    expiresWeek: week - 1 // Must respond before the event week
  }
}

/**
 * Calculate the chance of receiving an invitation in a given week
 * Returns a value between 0 and 1
 */
export function calculateInvitationChance(
  playerReputation: number,
  weeksUntilNextRace: number,
  invitationsThisSeason: number,
  declinesThisSeason: number,
  targetInvitationsPerSeason: number = 5
): number {
  // Base chance increases with reputation
  let chance = Math.min(playerReputation / 200, 0.3) // Max 30% base from reputation

  // Higher chance if there's a gap week (2+ weeks until next race)
  if (weeksUntilNextRace >= 2) {
    chance += 0.15
  } else if (weeksUntilNextRace >= 3) {
    chance += 0.25
  }

  // Reduce chance if we've already had many invitations this season
  if (invitationsThisSeason >= targetInvitationsPerSeason) {
    chance *= 0.2
  } else if (invitationsThisSeason >= targetInvitationsPerSeason - 1) {
    chance *= 0.5
  }

  // Reduce chance if player has declined many invitations (organizers talk)
  if (declinesThisSeason >= 3) {
    chance *= 0.5
  } else if (declinesThisSeason >= 2) {
    chance *= 0.7
  }

  return Math.min(chance, 0.5) // Cap at 50%
}

/**
 * Check if an event is available this year based on its frequency
 * @param template The event template
 * @param currentYear The current career year
 * @param eventsUsedThisYear Array of template IDs that have been used this year
 * @param eventHistory Array of { templateId, year } for tracking multi-year events
 * @returns true if the event can be offered this year
 */
export function isEventAvailableThisYear(
  template: InvitationalEventTemplate,
  currentYear: number,
  eventsUsedThisYear: string[],
  eventHistory: { templateId: string; year: number }[] = []
): boolean {
  // Multiple frequency events can happen unlimited times
  if (template.frequency === 'multiple') {
    return true
  }

  // Annual events: check if already used this year
  if (template.frequency === 'annual') {
    return !eventsUsedThisYear.includes(template.id)
  }

  // Biennial events: every 2 years
  if (template.frequency === 'biennial') {
    // Check if used this year
    if (eventsUsedThisYear.includes(template.id)) {
      return false
    }
    // Check if used last year
    const lastUse = eventHistory.filter(e => e.templateId === template.id).sort((a, b) => b.year - a.year)[0]
    if (lastUse && currentYear - lastUse.year < 2) {
      return false
    }
    return true
  }

  // Quadrennial events: every 4 years
  if (template.frequency === 'quadrennial') {
    // Check if used this year
    if (eventsUsedThisYear.includes(template.id)) {
      return false
    }
    // Check if used in last 3 years
    const lastUse = eventHistory.filter(e => e.templateId === template.id).sort((a, b) => b.year - a.year)[0]
    if (lastUse && currentYear - lastUse.year < 4) {
      return false
    }
    return true
  }

  return true
}

/**
 * Get eligible event templates for a player
 * @param eventsUsedThisYear Array of template IDs already used this year
 * @param eventHistory Array of { templateId, year } for tracking multi-year events
 */
export function getEligibleEventTemplates(
  playerReputation: number,
  playerManufacturerId?: string,
  playerSponsorIds?: string[],
  playerNationality?: string,
  currentYear?: number,
  eventsUsedThisYear: string[] = [],
  eventHistory: { templateId: string; year: number }[] = []
): InvitationalEventTemplate[] {
  return INVITATIONAL_TEMPLATES.filter(template => {
    // First check basic eligibility (reputation, conditions)
    const basicEligible = isPlayerEligibleForEvent(
      template,
      playerReputation,
      playerManufacturerId,
      playerSponsorIds,
      playerNationality,
      currentYear
    )
    
    if (!basicEligible) return false
    
    // Then check frequency availability
    return isEventAvailableThisYear(
      template,
      currentYear || 1,
      eventsUsedThisYear,
      eventHistory
    )
  })
}

/**
 * Select a random event template weighted by prestige and eligibility
 */
export function selectEventTemplate(
  eligibleTemplates: InvitationalEventTemplate[],
  playerReputation: number
): InvitationalEventTemplate | null {
  if (eligibleTemplates.length === 0) return null

  // Weight events by how appropriate they are for the player's reputation
  const weighted = eligibleTemplates.map(template => {
    const repDiff = Math.abs(template.minReputation - playerReputation)
    // Prefer events slightly above player's level for aspiration
    const weight = repDiff <= 20 ? 3 : repDiff <= 40 ? 2 : 1
    return { template, weight }
  })

  // Calculate total weight
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)

  // Random selection
  let random = Math.random() * totalWeight
  for (const { template, weight } of weighted) {
    random -= weight
    if (random <= 0) {
      return template
    }
  }

  return weighted[0].template
}

