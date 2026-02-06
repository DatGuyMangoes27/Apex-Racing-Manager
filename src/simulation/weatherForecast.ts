/**
 * Weather Forecast & Preparation System
 * 
 * Provides weather forecasts before race weekends and allows
 * player preparation decisions that affect race outcome.
 */

export interface WeatherForecast {
  raceWeek: number
  trackName: string
  /** 3-day forecast: Thursday, Friday/Saturday, Race Day */
  dailyForecast: DayForecast[]
  /** Overall race day prediction */
  raceDayPrediction: WeatherCondition
  /** Confidence in forecast (0-100) */
  forecastConfidence: number
  /** Preparation recommendations */
  recommendations: string[]
}

export interface DayForecast {
  day: string
  condition: WeatherCondition
  temperature: number // Celsius
  rainChance: number // 0-100
  windSpeed: number // km/h
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'overcast' | 'light_rain' | 'heavy_rain' | 'variable' | 'storm'

export interface WeatherPreparation {
  id: string
  name: string
  description: string
  timeCost: number // hours
  bestFor: WeatherCondition[]
  effects: Record<string, number>
}

// ============================================
// WEATHER GENERATION
// ============================================

const CLIMATE_ZONES: Record<string, { baseTemp: number; rainChance: number; variability: number }> = {
  'tropical': { baseTemp: 32, rainChance: 40, variability: 20 },
  'mediterranean': { baseTemp: 26, rainChance: 15, variability: 15 },
  'temperate': { baseTemp: 18, rainChance: 30, variability: 25 },
  'continental': { baseTemp: 20, rainChance: 25, variability: 30 },
  'arid': { baseTemp: 35, rainChance: 5, variability: 10 },
  'nordic': { baseTemp: 12, rainChance: 35, variability: 20 },
  'oceanic': { baseTemp: 16, rainChance: 45, variability: 30 },
}

// Map track regions to climate zones
function getClimateForTrack(trackName: string): { baseTemp: number; rainChance: number; variability: number } {
  const lower = trackName.toLowerCase()
  if (lower.includes('interlagos') || lower.includes('brazil') || lower.includes('buenos') || lower.includes('argentina')) return CLIMATE_ZONES.tropical
  if (lower.includes('monza') || lower.includes('barcelona') || lower.includes('portugal') || lower.includes('mugello') || lower.includes('paul ricard')) return CLIMATE_ZONES.mediterranean
  if (lower.includes('silverstone') || lower.includes('brands') || lower.includes('donington') || lower.includes('oulton')) return CLIMATE_ZONES.oceanic
  if (lower.includes('nürburgring') || lower.includes('hockenheim') || lower.includes('spa') || lower.includes('zolder')) return CLIMATE_ZONES.temperate
  if (lower.includes('dubai') || lower.includes('bahrain') || lower.includes('abu dhabi') || lower.includes('jeddah')) return CLIMATE_ZONES.arid
  if (lower.includes('suzuka') || lower.includes('fuji') || lower.includes('autopolis')) return CLIMATE_ZONES.temperate
  if (lower.includes('mount panorama') || lower.includes('bathurst') || lower.includes('phillip')) return CLIMATE_ZONES.mediterranean
  if (lower.includes('daytona') || lower.includes('sebring') || lower.includes('laguna') || lower.includes('watkins') || lower.includes('road america') || lower.includes('cota') || lower.includes('indianapolis')) return CLIMATE_ZONES.continental
  if (lower.includes('nordschleife') || lower.includes('sachsenring')) return CLIMATE_ZONES.temperate
  if (lower.includes('snetterton') || lower.includes('knockhill') || lower.includes('thruxton')) return CLIMATE_ZONES.oceanic
  return CLIMATE_ZONES.temperate // Default
}

function getSeasonModifier(week: number): { tempMod: number; rainMod: number } {
  // Simple seasonal model: weeks 1-13 winter, 14-26 spring, 27-39 summer, 40-52 autumn
  if (week <= 13) return { tempMod: -8, rainMod: 1.3 }      // Winter
  if (week <= 26) return { tempMod: -2, rainMod: 1.1 }      // Spring
  if (week <= 39) return { tempMod: 5, rainMod: 0.7 }       // Summer
  return { tempMod: -4, rainMod: 1.2 }                       // Autumn
}

export function generateWeatherForecast(trackName: string, raceWeek: number): WeatherForecast {
  const climate = getClimateForTrack(trackName)
  const season = getSeasonModifier(raceWeek)
  
  // Seed-based randomness for consistency within same week/track
  const seed = (trackName.length * 31 + raceWeek * 17) % 100
  const seededRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000
    return x - Math.floor(x)
  }
  
  const dailyForecast: DayForecast[] = []
  let overallRainChance = 0
  
  const days = ['Thursday (Setup)', 'Friday/Saturday (Practice & Qualifying)', 'Sunday (Race Day)']
  
  for (let i = 0; i < 3; i++) {
    const dayVariance = (seededRandom(i * 7) - 0.5) * climate.variability
    const temp = Math.round(climate.baseTemp + season.tempMod + dayVariance)
    const rainChance = Math.round(Math.min(95, Math.max(0, 
      climate.rainChance * season.rainMod + (seededRandom(i * 13) - 0.5) * 30
    )))
    const windSpeed = Math.round(5 + seededRandom(i * 19) * 25)
    
    let condition: WeatherCondition
    if (rainChance >= 70) condition = seededRandom(i * 23) > 0.5 ? 'heavy_rain' : 'storm'
    else if (rainChance >= 50) condition = 'light_rain'
    else if (rainChance >= 30) condition = 'variable'
    else if (rainChance >= 15) condition = 'overcast'
    else if (rainChance >= 5) condition = 'cloudy'
    else condition = 'sunny'
    
    dailyForecast.push({ day: days[i], condition, temperature: temp, rainChance, windSpeed })
    if (i === 2) overallRainChance = rainChance
  }
  
  const raceDayForecast = dailyForecast[2]
  
  // Forecast confidence (lower in variable conditions)
  const forecastConfidence = raceDayForecast.condition === 'variable' ? 45
    : raceDayForecast.condition === 'storm' ? 60
    : raceDayForecast.rainChance > 40 ? 55
    : 75
  
  // Generate recommendations
  const recommendations: string[] = []
  if (raceDayForecast.rainChance >= 50) {
    recommendations.push('Consider wet weather setup tuning — rain is likely')
    recommendations.push('Extra wet-weather practice would be valuable')
  }
  if (raceDayForecast.temperature >= 30) {
    recommendations.push('High temperatures — manage tire wear carefully')
    recommendations.push('Stay hydrated, consider extra fitness preparation')
  }
  if (raceDayForecast.temperature <= 12) {
    recommendations.push('Cold conditions — tire warm-up will be critical')
  }
  if (raceDayForecast.windSpeed >= 20) {
    recommendations.push('Strong winds expected — aero-sensitive setup adjustments recommended')
  }
  if (raceDayForecast.condition === 'variable') {
    recommendations.push('Variable conditions — prepare a flexible strategy')
    recommendations.push('Mixed weather could create opportunities to gain positions')
  }
  if (recommendations.length === 0) {
    recommendations.push('Good conditions expected — standard race preparation advised')
  }
  
  return {
    raceWeek,
    trackName,
    dailyForecast,
    raceDayPrediction: raceDayForecast.condition,
    forecastConfidence,
    recommendations
  }
}

// ============================================
// WEATHER PREPARATION OPTIONS
// ============================================

export const WEATHER_PREPARATIONS: WeatherPreparation[] = [
  {
    id: 'wet_setup',
    name: 'Wet Weather Setup Session',
    description: 'Work with your engineer on a dedicated wet-weather setup. Time-consuming but could be decisive.',
    timeCost: 3,
    bestFor: ['light_rain', 'heavy_rain', 'storm', 'variable'],
    effects: { wetSkill: 3, confidence: 2, fatigue: 5 }
  },
  {
    id: 'data_analysis',
    name: 'Historical Weather Data Analysis',
    description: 'Study past race data at this track in similar conditions. Knowledge is power.',
    timeCost: 2,
    bestFor: ['light_rain', 'heavy_rain', 'variable', 'overcast'],
    effects: { confidence: 3, stress: -2 }
  },
  {
    id: 'tire_strategy',
    name: 'Tire Strategy Planning',
    description: 'Deep dive into tire compounds and degradation models for the expected conditions.',
    timeCost: 2,
    bestFor: ['sunny', 'cloudy', 'overcast'],
    effects: { confidence: 2, morale: 2 }
  },
  {
    id: 'hot_weather_prep',
    name: 'Heat Conditioning',
    description: 'Extra hydration and heat management preparation for hot conditions.',
    timeCost: 1,
    bestFor: ['sunny'],
    effects: { fitness: 1, fatigue: -3 }
  },
  {
    id: 'sim_practice',
    name: 'Simulated Weather Practice',
    description: 'Run the simulator with the expected weather conditions loaded.',
    timeCost: 2,
    bestFor: ['light_rain', 'heavy_rain', 'variable', 'storm'],
    effects: { confidence: 4, wetSkill: 2, fatigue: 3 }
  }
]

export function getRecommendedPreparations(forecast: WeatherForecast): WeatherPreparation[] {
  const raceDayCondition = forecast.raceDayPrediction
  return WEATHER_PREPARATIONS.filter(p => p.bestFor.includes(raceDayCondition))
}

// ============================================
// FORECAST EMAIL GENERATOR
// ============================================

export function generateWeatherForecastEmail(forecast: WeatherForecast): {
  subject: string
  body: string
  category: string
  sender: string
  senderRole: string
} {
  const conditionEmoji: Record<WeatherCondition, string> = {
    'sunny': '☀️',
    'cloudy': '⛅',
    'overcast': '☁️',
    'light_rain': '🌦️',
    'heavy_rain': '🌧️',
    'variable': '🌤️↔️🌧️',
    'storm': '⛈️'
  }
  
  const conditionName: Record<WeatherCondition, string> = {
    'sunny': 'Sunny & Clear',
    'cloudy': 'Partly Cloudy',
    'overcast': 'Overcast',
    'light_rain': 'Light Rain Expected',
    'heavy_rain': 'Heavy Rain Expected',
    'variable': 'Variable/Changeable',
    'storm': 'Storms Expected'
  }
  
  const forecastLines = forecast.dailyForecast.map(d => 
    `  ${conditionEmoji[d.condition]} **${d.day}**: ${conditionName[d.condition]} | ${d.temperature}°C | Rain: ${d.rainChance}% | Wind: ${d.windSpeed}km/h`
  ).join('\n')
  
  const recommended = getRecommendedPreparations(forecast)
  const recSection = recommended.length > 0
    ? `\n**Recommended Preparations:**\n${recommended.map(r => `- ${r.name} (${r.timeCost}h): ${r.description}`).join('\n')}`
    : ''
  
  return {
    subject: `${conditionEmoji[forecast.raceDayPrediction]} Race Week Weather: ${forecast.trackName}`,
    body: `**Weather Forecast — ${forecast.trackName}**\n\n` +
      `Race day prediction: **${conditionName[forecast.raceDayPrediction]}** ${conditionEmoji[forecast.raceDayPrediction]}\n` +
      `Forecast confidence: **${forecast.forecastConfidence}%**\n\n` +
      `**3-Day Forecast:**\n${forecastLines}\n\n` +
      `**Recommendations:**\n${forecast.recommendations.map(r => `• ${r}`).join('\n')}` +
      recSection,
    category: 'team',
    sender: 'Weather Analyst',
    senderRole: 'Meteorology'
  }
}
