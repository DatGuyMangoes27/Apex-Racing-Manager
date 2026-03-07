/**
 * Miscellaneous image generation tasks.
 * Generates images for various app features that currently lack visual assets.
 * 
 * Categories:
 * - 10 merchandise products (team-branded items)
 * - 5 manufacturing facility levels
 * - 6 weather conditions (for Race Day)
 * - 10 news feed thumbnails (generic racing scenes)
 * - 8 season end celebration images
 * 
 * ~39 total images
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'

const BASE_OUTPUT_DIR = 'public/images/generated/misc'

interface MiscImageDef {
  id: string
  filename: string
  prompt: string
  subcategory: string
}

// ============================================================
// MERCHANDISE PRODUCTS
// ============================================================

const MERCHANDISE_IMAGES: MiscImageDef[] = [
  { id: 'merch-tshirt', filename: 'team-tshirt.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A premium cotton racing team t-shirt with motorsport graphic design, displayed flat on dark background. Clean product mockup with professional lighting. Product catalog photography.' },
  { id: 'merch-cap', filename: 'team-cap.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A racing team baseball cap in dark blue with embroidered logo, shown on a clean white display stand. Clean professional product photography with soft shadows.' },
  { id: 'merch-hoodie', filename: 'team-hoodie.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A premium racing team hoodie in black with embroidered team branding, displayed on a mannequin torso. Professional apparel product photography.' },
  { id: 'merch-model-car', filename: 'model-car.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A detailed 1:18 scale model race car on a display plinth, showing intricate livery details and sponsor decals. Collector-grade quality. Professional product photography with dramatic lighting.' },
  { id: 'merch-poster', filename: 'race-poster.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A premium motorsport art print poster in a frame, showing a stylized race car design in vibrant colors. Vintage racing poster aesthetic. Professional product photography.' },
  { id: 'merch-jacket', filename: 'team-jacket.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A racing team bomber jacket in team colors with sponsor patches, displayed on a mannequin. Premium quality team merchandise. Professional apparel photography.' },
  { id: 'merch-mug', filename: 'team-mug.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A ceramic coffee mug with racing team logo and car livery design, on a dark surface with steam rising. Professional product photography with warm lighting.' },
  { id: 'merch-flag', filename: 'team-flag.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A racing team flag unfurled showing full livery colors and team name, on a flagpole against blue sky. Fan merchandise. Professional product and outdoor photography.' },
  { id: 'merch-keychain', filename: 'team-keychain.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A premium metal keychain in the shape of a race car, with team branding engraved. Displayed on dark leather surface. Professional product macro photography.' },
  { id: 'merch-decal', filename: 'team-decal.png', subcategory: 'merchandise',
    prompt: 'Photorealistic product photography: A set of racing team vinyl decals and stickers in team colors, arranged on a clean white background. Professional product flat-lay photography.' },
]

// ============================================================
// MANUFACTURING FACILITY LEVELS
// ============================================================

const MANUFACTURING_IMAGES: MiscImageDef[] = [
  { id: 'factory-level-1', filename: 'factory-basic.png', subcategory: 'manufacturing',
    prompt: 'Photorealistic industrial photography: A small basic motorsport workshop with a single car lift, basic hand tools on pegboards, and a workbench. Modest but functional garage space. Natural light from roller door. Professional industrial photography.' },
  { id: 'factory-level-2', filename: 'factory-improved.png', subcategory: 'manufacturing',
    prompt: 'Photorealistic industrial photography: An improved motorsport workshop with two car bays, professional tool chests, a small CNC machine, and organized parts shelving. Clean concrete floors. Better lighting. Professional industrial photography.' },
  { id: 'factory-level-3', filename: 'factory-professional.png', subcategory: 'manufacturing',
    prompt: 'Photorealistic industrial photography: A professional racing team factory with multiple car bays, dedicated fabrication area, composite layup room visible, and digital display screens. LED lighting, clean organization. Professional industrial photography.' },
  { id: 'factory-level-4', filename: 'factory-elite.png', subcategory: 'manufacturing',
    prompt: 'Photorealistic industrial photography: An elite motorsport facility with advanced CNC machines, carbon fiber autoclaves, inspection room with CMM, and a paint booth. Multiple cars being built simultaneously. Professional industrial photography.' },
  { id: 'factory-level-5', filename: 'factory-world-class.png', subcategory: 'manufacturing',
    prompt: 'Photorealistic industrial photography: A world-class Formula 1 style factory with wind tunnel model visible, massive composites facility, clean rooms, and rows of precision machines. Immaculate floors reflecting LED strips. State-of-the-art motorsport manufacturing. Professional industrial photography.' },
]

// ============================================================
// WEATHER CONDITIONS
// ============================================================

const WEATHER_IMAGES: MiscImageDef[] = [
  { id: 'weather-dry', filename: 'weather-dry.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit under clear blue skies with bright sunshine. Dry track surface with visible rubber marks on the racing line. Grandstands and green grass visible. Perfect race day conditions. Professional motorsport photography.' },
  { id: 'weather-overcast', filename: 'weather-overcast.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit under heavy grey overcast skies. Flat light, cool atmosphere, track dry but threatening rain. Moody atmospheric conditions. Professional motorsport photography.' },
  { id: 'weather-light-rain', filename: 'weather-light-rain.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit in light drizzle, track surface glistening with a thin layer of water. Light spray from cars in the distance. Changeable conditions. Atmospheric motorsport photography.' },
  { id: 'weather-heavy-rain', filename: 'weather-heavy-rain.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit in heavy rain with standing water on track. Massive spray behind cars, headlights on, reduced visibility. Dark dramatic skies. Intense wet weather motorsport photography.' },
  { id: 'weather-fog', filename: 'weather-fog.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit shrouded in thick morning fog. Track barely visible beyond 100 meters, ethereal atmosphere with car headlights glowing through the mist. Moody atmospheric photography.' },
  { id: 'weather-mixed', filename: 'weather-mixed.png', subcategory: 'weather',
    prompt: 'Photorealistic motorsport photography: A racing circuit with mixed conditions - dry on one side, wet on the other, with dramatic sun breaking through dark clouds. Changing conditions that test driver judgment. Dynamic atmospheric motorsport photography.' },
]

// ============================================================
// NEWS FEED THUMBNAILS
// ============================================================

const NEWS_IMAGES: MiscImageDef[] = [
  { id: 'news-overtake', filename: 'news-overtake.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A dramatic wheel-to-wheel overtake between two GT race cars going into a braking zone. One car diving inside, the other defending. Peak racing action. Professional motorsport photography.' },
  { id: 'news-podium', filename: 'news-podium.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A podium ceremony with three drivers celebrating, champagne spraying, confetti falling. Victory and celebration. Professional sports photography.' },
  { id: 'news-pit-stop', filename: 'news-pit-stop.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A synchronized pit stop with crew changing tires and fueling. Organized chaos of a professional pit stop. High-speed action photography.' },
  { id: 'news-crash', filename: 'news-incident.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: The aftermath of a racing incident with a car in the gravel trap, safety car lights visible, marshals waving flags. Dramatic racing incident without injury. Professional motorsport photography.' },
  { id: 'news-transfer', filename: 'news-transfer.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A racing driver shaking hands with a team principal in a modern team headquarters, contract visible on a table. A driver transfer announcement. Professional corporate motorsport photography.' },
  { id: 'news-testing', filename: 'news-testing.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A race car on track during a private test session, data engineer watching from pit wall with laptop. Pre-season testing atmosphere, few spectators. Professional motorsport photography.' },
  { id: 'news-night-race', filename: 'news-night-race.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: Race cars streaming through a floodlit corner at night, headlights blazing, light trails in the frame. The spectacle of night racing. Professional motorsport photography.' },
  { id: 'news-start', filename: 'news-race-start.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: The dramatic first corner of a race start, cars funneling in from multiple rows, tire smoke and sparks. The most exciting moment in racing. Professional motorsport photography.' },
  { id: 'news-strategy', filename: 'news-strategy.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: Inside a team pit wall with engineers watching multiple screens showing live timing and telemetry data. The strategic brain of a race team. Professional motorsport photography.' },
  { id: 'news-trophy', filename: 'news-championship.png', subcategory: 'news',
    prompt: 'Photorealistic motorsport photography: A championship trophy on display with team and driver names engraved, surrounded by flowers and ceremonial setting. Championship glory. Professional trophy and awards photography.' },
]

// ============================================================
// SEASON END CELEBRATIONS
// ============================================================

const CELEBRATION_IMAGES: MiscImageDef[] = [
  { id: 'season-champion', filename: 'champion-celebration.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: A racing driver lifting a championship trophy above their head on a podium, gold confetti raining down, team cheering below. The ultimate motorsport achievement. Professional sports photography.' },
  { id: 'season-team-celebrate', filename: 'team-celebration.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: An entire racing team celebrating a championship win in the pit lane, jumping and hugging. The car draped in a champion banner. Raw joy and emotion. Professional sports photography.' },
  { id: 'season-podium-spray', filename: 'champagne-podium.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: Close-up of champagne being sprayed on a podium, golden liquid catching the lights, droplets frozen in mid-air. Pure celebration. Professional action sports photography.' },
  { id: 'season-trophy-room', filename: 'trophy-display.png', subcategory: 'celebrations',
    prompt: 'Photorealistic interior photography: A championship trophy display room with multiple trophies on illuminated shelves, photos of victories on the walls. The legacy of racing success. Professional interior and product photography.' },
  { id: 'season-victory-lap', filename: 'victory-lap.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: A race car doing a victory lap with the driver waving from the open cockpit, flag draped over the car. Grandstands erupting. The culmination of a season. Professional motorsport photography.' },
  { id: 'season-awards-gala', filename: 'awards-gala.png', subcategory: 'celebrations',
    prompt: 'Photorealistic event photography: An end-of-season motorsport awards gala, drivers in formal wear on stage receiving trophies. Elegant ballroom setting with professional lighting. Professional event photography.' },
  { id: 'season-reflection', filename: 'season-reflection.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: An empty racing circuit at sunset after the final race of the season. Track markings still visible, champagne bottles scattered near the podium. Beautiful and melancholic end-of-season atmosphere. Professional landscape photography.' },
  { id: 'season-growth', filename: 'team-growth.png', subcategory: 'celebrations',
    prompt: 'Photorealistic motorsport photography: A small racing team gathered around their car in a modest garage, looking proud and determined. The underdog story of a growing team. Warm documentary-style photography with golden hour light.' },
]

// ============================================================
// TASK CREATORS
// ============================================================

export function createMiscImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []

  const allImages = [
    ...MERCHANDISE_IMAGES,
    ...MANUFACTURING_IMAGES,
    ...WEATHER_IMAGES,
    ...NEWS_IMAGES,
    ...CELEBRATION_IMAGES,
  ]

  for (const img of allImages) {
    const outputDir = path.join(projectRoot, BASE_OUTPUT_DIR, img.subcategory)
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const imagePath = path.join(outputDir, img.filename)

    if (fs.existsSync(imagePath)) continue

    tasks.push({
      id: `misc-image-${img.id}`,
      entityId: img.id,
      entityName: `Misc: ${img.id.replace(/-/g, ' ')}`,
      category: 'misc',
      type: 'image',
      priority: 3,
      prompt: img.prompt,
      outputPath: imagePath,
    })
  }

  return tasks
}

/**
 * Get the total count of misc images that need generation.
 */
export function getMiscImageCount(): number {
  return MERCHANDISE_IMAGES.length
    + MANUFACTURING_IMAGES.length
    + WEATHER_IMAGES.length
    + NEWS_IMAGES.length
    + CELEBRATION_IMAGES.length
}
