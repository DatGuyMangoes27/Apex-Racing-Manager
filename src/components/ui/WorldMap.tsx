import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Plane, Package, Star, TrendingUp, AlertTriangle
} from 'lucide-react'
import {
  COUNTRIES,
  getRegionDisplayName,
  getBestSeriesForCountry,
  getWorstSeriesForCountry,
  formatTravelCost,
  getFatigueColor,
  getMotorsportHubs
} from '@/data/travel-logistics';
import { getLocationPerk, getLocationPerkEffectsSummary } from '@/data/owner-backgrounds';

interface WorldMapProps {
  selectedCountry: string | null;
  onSelectCountry: (country: string) => void;
  className?: string;
}

const WORLD_MAP_URL = '/images/world-map.jpg'

const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  // Western Europe
  'UK': { x: 49.7, y: 21.1 },           // 52°N, 1°W
  'Germany': { x: 52.8, y: 21.7 },      // 51°N, 10°E
  'Italy': { x: 53.3, y: 26.7 },        // 42°N, 12°E
  'France': { x: 50.6, y: 24.4 },       // 46°N, 2°E
  'Spain': { x: 48.9, y: 27.8 },        // 40°N, -4°W
  'Netherlands': { x: 51.4, y: 20.6 },  // 52.5°N, 5°E
  'Belgium': { x: 51.2, y: 22.2 },      // 50.5°N, 4.5°E
  'Austria': { x: 54.0, y: 23.6 },      // 47.5°N, 14.5°E
  'Switzerland': { x: 52.2, y: 23.9 },  // 47°N, 8°E
  'Portugal': { x: 47.5, y: 28.3 },     // 39.5°N, -9°W
  'Sweden': { x: 54.2, y: 15.6 },       // 62°N, 15°E
  'Finland': { x: 57.2, y: 14.4 },      // 64°N, 26°E
  'Norway': { x: 52.8, y: 15.6 },       // 62°N, 10°E
  'Denmark': { x: 52.8, y: 18.9 },      // 56°N, 10°E
  
  // Eastern Europe
  'Poland': { x: 55.3, y: 20.6 },       // 52.5°N, 19°E
  'Czech Republic': { x: 54.2, y: 22.2 }, // 50°N, 15°E
  'Hungary': { x: 55.3, y: 23.6 },      // 47.5°N, 19°E
  
  // North America
  'USA': { x: 23.1, y: 28.9 },          // 38°N, 97°W
  'Canada': { x: 25.0, y: 20.0 },       // 56°N, 90°W
  'Mexico': { x: 20.8, y: 36.7 },       // 23°N, 102°W
  
  // South America
  'Brazil': { x: 34.7, y: 55.6 },       // 10°S, 55°W
  'Argentina': { x: 32.2, y: 68.9 },    // 34°S, 64°W
  
  // Asia Pacific
  'Japan': { x: 88.3, y: 30.0 },        // 36°N, 138°E
  'China': { x: 79.2, y: 27.8 },        // 35°N, 105°E
  'South Korea': { x: 85.4, y: 29.4 },  // 37°N, 127.5°E
  
  // Oceania
  'Australia': { x: 87.2, y: 63.9 },    // 25°S, 134°E
  'New Zealand': { x: 97.2, y: 72.8 },  // 41°S, 175°E
  
  // Middle East (UAE)
  'UAE': { x: 65.3, y: 36.7 },          // 24°N, 54°E
  
  // Africa
  'South Africa': { x: 57.5, y: 66.7 }  // 29°S, 25°E
}

export function WorldMap({ selectedCountry, onSelectCountry, className = '' }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  
  const motorsportHubs = useMemo(() => getMotorsportHubs(), [])
  
  const activeCountry = hoveredCountry || selectedCountry
  const activeCountryData = activeCountry ? COUNTRIES[activeCountry] : null
  
  // Get travel estimates for the active country
  const bestSeries = useMemo(() => 
    activeCountry ? getBestSeriesForCountry(activeCountry) : [],
    [activeCountry]
  )
  const worstSeries = useMemo(() => 
    activeCountry ? getWorstSeriesForCountry(activeCountry) : [],
    [activeCountry]
  )
  
  // Get location perks
  const locationPerks = useMemo(() => 
    activeCountry ? getLocationPerkEffectsSummary(activeCountry) : [],
    [activeCountry]
  )
  const locationPerk = useMemo(() =>
    activeCountry ? getLocationPerk(activeCountry) : null,
    [activeCountry]
  )
  
  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-surface-border">
        {/* World Map Background Image */}
        <img 
          src={WORLD_MAP_URL}
          alt="World Map"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.6) saturate(0.7)' }}
        />
        
        {/* Dark gradient overlay for better visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        
        {/* Connection lines from selected country */}
        {selectedCountry && COUNTRY_POSITIONS[selectedCountry] && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {motorsportHubs
              .filter(hub => hub.id !== selectedCountry)
              .map(hub => {
                const from = COUNTRY_POSITIONS[selectedCountry]
                const to = COUNTRY_POSITIONS[hub.id]
                if (!from || !to) return null
                
                return (
                  <motion.line
                    key={hub.id}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                )
              })}
          </svg>
        )}
        
        {/* Country markers */}
        {Object.entries(COUNTRIES).map(([id, country]) => {
          const position = COUNTRY_POSITIONS[id]
          if (!position) return null
          
          const isSelected = selectedCountry === id
          const isHovered = hoveredCountry === id
          const isHub = country.motorsportHub
          const isActive = isSelected || isHovered
          
          return (
            <motion.button
              key={id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              onClick={() => onSelectCountry(id)}
              onMouseEnter={() => setHoveredCountry(id)}
              onMouseLeave={() => setHoveredCountry(null)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulse ring for hubs */}
              {isHub && (
                <motion.div
                  className={`absolute rounded-full ${
                    isSelected ? 'bg-accent-red' : 'bg-accent-gold'
                  }`}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ 
                    width: 16, 
                    height: 16, 
                    left: '50%',
                    top: '50%',
                    marginLeft: -8, 
                    marginTop: -8 
                  }}
                />
              )}
              
              {/* Main marker */}
              <div className={`
                relative rounded-full transition-all duration-200 shadow-lg
                ${isSelected 
                  ? 'w-4 h-4 bg-accent-red ring-2 ring-white/50' 
                  : isHub 
                    ? 'w-3 h-3 bg-accent-gold'
                    : 'w-2.5 h-2.5 bg-white/80'
                }
                ${isActive && !isSelected ? 'w-3.5 h-3.5' : ''}
              `}>
                {isHub && !isSelected && (
                  <Star className="absolute -top-1 -right-1 w-2.5 h-2.5 text-accent-gold fill-accent-gold drop-shadow" />
                )}
              </div>
              
              {/* Country label on hover */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-20"
                  >
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium shadow-lg
                      ${isSelected 
                        ? 'bg-accent-red text-white' 
                        : 'bg-surface text-text-primary border border-surface-border'
                      }
                    `}>
                      <span className="mr-1">{country.flagEmoji}</span>
                      {country.name}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
            <Star className="w-2.5 h-2.5 text-accent-gold fill-accent-gold" />
            <span>Motorsport Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/80" />
            <span>Other Locations</span>
          </div>
        </div>
      </div>
      
      {/* Info Panel */}
      <AnimatePresence mode="wait">
        {activeCountryData && (
          <motion.div
            key={activeCountry}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 grid grid-cols-3 gap-4"
          >
            {/* Country Info */}
            <div className="bg-surface rounded-xl p-4 border border-surface-border">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{activeCountryData.flagEmoji}</span>
                <div>
                  <h3 className="font-display font-semibold text-lg">{activeCountryData.name}</h3>
                  <p className="text-xs text-text-muted">{getRegionDisplayName(activeCountryData.region)}</p>
                </div>
                {activeCountryData.motorsportHub && (
                  <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-accent-gold/20 rounded text-accent-gold text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    Hub
                  </div>
                )}
              </div>
              
              <p className="text-sm text-text-secondary mb-3">{activeCountryData.description}</p>
              
              {/* Location perks */}
              {locationPerk && locationPerk.id !== 'default' && (
                <div className="space-y-1.5">
                  <p className="text-xs text-text-muted uppercase tracking-wide">Location Perks</p>
                  <p className="text-sm font-medium text-accent-blue">{locationPerk.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {locationPerks.slice(0, 3).map((perk, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue rounded">
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Best Series */}
            <div className="bg-surface rounded-xl p-4 border border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-status-success" />
                <h4 className="font-medium text-sm">Best Value Series</h4>
              </div>
              <div className="space-y-2">
                {bestSeries.map((estimate, i) => (
                  <div key={estimate.seriesName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-status-success/20 text-status-success text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="truncate max-w-[140px]">{estimate.seriesName}</span>
                    </div>
                    <span className="text-status-success font-mono text-xs">
                      {formatTravelCost(estimate.totalAnnualCost)}/yr
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
                <Plane className="w-3 h-3" />
                Lower travel & freight costs
              </p>
            </div>
            
            {/* Challenging Series */}
            <div className="bg-surface rounded-xl p-4 border border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                <h4 className="font-medium text-sm">Higher Cost Series</h4>
              </div>
              <div className="space-y-2">
                {worstSeries.map((estimate, _i) => (
                  <div key={estimate.seriesName}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[140px]">{estimate.seriesName}</span>
                      <span className="text-status-warning font-mono text-xs">
                        {formatTravelCost(estimate.totalAnnualCost)}/yr
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className={getFatigueColor(estimate.fatigueImpact)}>
                        {estimate.fatigueImpact} fatigue
                      </span>
                      {estimate.turnaroundDays > 0 && (
                        <span>+{estimate.turnaroundDays}d turnaround</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Consider logistics hub rental
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* No selection prompt */}
      {!activeCountryData && (
        <div className="mt-4 text-center py-8 bg-surface/50 rounded-xl border border-dashed border-surface-border">
          <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted">Click a location on the map to see details</p>
          <p className="text-xs text-text-muted mt-1">
            <Star className="w-3 h-3 inline text-accent-gold fill-accent-gold" /> markers indicate major motorsport hubs
          </p>
        </div>
      )}
    </div>
  )
}

export default WorldMap
