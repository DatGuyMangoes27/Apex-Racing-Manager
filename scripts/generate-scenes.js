/**
 * Standalone Scene Image Generator
 * 
 * Generates all stock/atmosphere images that replace the old Unsplash URLs.
 * Uses Nano Banana Pro (gemini-3-pro-image-preview) for maximum quality.
 * 
 * Usage:
 *   node scripts/generate-scenes.js
 * 
 * Requires: GEMINI_API_KEY environment variable or .env file
 * 
 * Features:
 *   - Skips already-generated images (safe to re-run)
 *   - Rate limit handling with exponential backoff
 *   - Progress tracking
 *   - Sequential generation (1 at a time for Pro model rate limits)
 */

import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'public/images/generated/scenes')

const MODEL = 'gemini-3-pro-image-preview'
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 15000 // 15s base delay for Pro model
const INTER_REQUEST_DELAY = 15000 // 15s between requests for Pro model

// ============================================================
// ALL SCENE DEFINITIONS
// These match exactly what stock-images.ts expects
// ============================================================

const SCENES = [
  // --- GT Racing (4) ---
  {
    filename: 'gt-racing-001.png',
    prompt: `Photorealistic motorsport photography: A pack of modern GT3 race cars battling through a sweeping corner at a European circuit during golden hour. Multiple cars in close formation, tires smoking slightly, with grandstands and sponsor banners visible in the background. Dramatic warm lighting with lens flare from the setting sun. Shot from a low trackside angle with motion blur on the background. Professional motorsport photography, 8K quality, vibrant colors, high contrast.`,
  },
  {
    filename: 'gt-racing-002.png',
    prompt: `Photorealistic motorsport scene: A sleek GT race car accelerating out of a chicane on a famous circuit, rear tires laying down rubber. The car has an aggressive wide body kit with a prominent rear wing. Late afternoon light creates dramatic shadows across the track surface. Catch fencing and tire barriers visible at the edge of frame. Professional sports car photography with shallow depth of field, cinematic quality.`,
  },
  {
    filename: 'gt-racing-003.png',
    prompt: `Photorealistic motorsport image: A Porsche 911 GT3 RS style race car in an aggressive cornering stance on a flowing circuit, front inside tire slightly lifting. Vivid racing livery with sponsor decals. Track surface shows rubber marks and racing lines. Trees and hills in the background under a dramatic cloudy sky. Wide-angle trackside shot, professional race photography quality.`,
  },
  {
    filename: 'gt-racing-004.png',
    prompt: `Photorealistic motorsport photography: Close-up front three-quarter view of a BMW M4 GT3 style race car on a straight at high speed, headlights blazing. The aggressive front splitter and aero elements are prominent. Motion blur streaks the background while the car is tack-sharp. Professional automotive photography with rich saturation and contrast.`,
  },

  // --- Prototype / Endurance (3) ---
  {
    filename: 'prototype-001.png',
    prompt: `Photorealistic endurance racing scene: A modern LMDh prototype race car speeding through the night at a 24-hour race, LED headlights cutting through the darkness. The car's sleek aerodynamic body reflects pit lane lights. Illuminated grandstands and the glow of the pit complex visible in the background. Long exposure feel with light trails from other cars. Dramatic night motorsport photography.`,
  },
  {
    filename: 'prototype-002.png',
    prompt: `Photorealistic motorsport scene: A group of Le Mans Hypercar prototypes racing through the famous Porsche Curves at dawn during a 24-hour race. The sky is painted in deep purple and orange. Cars are packed tightly in multi-class traffic. Exhaustion and drama of endurance racing captured in the moment. Wide cinematic shot, professional motorsport photography.`,
  },
  {
    filename: 'prototype-003.png',
    prompt: `Photorealistic motorsport image: An LMP2 prototype race car crossing a start-finish line at an endurance event, timing tower and pit wall visible. The car's flowing body shape and massive rear wing dominate the frame. Pit crew members are visible behind the wall. Bright daylight conditions with blue sky and white clouds. Clean professional racing photography.`,
  },

  // --- Formula / Open Wheel (3) ---
  {
    filename: 'formula-001.png',
    prompt: `Photorealistic motorsport photography: A modern formula single-seater race car launching off a start line, rear wheels spinning with tire smoke billowing. Open cockpit with driver's helmet visible, dramatic front and rear wings. Circuit starting lights visible overhead. Action-packed motorsport moment captured with fast shutter speed. High-end professional racing photography, 8K quality.`,
  },
  {
    filename: 'formula-002.png',
    prompt: `Photorealistic motorsport scene: An open-wheel formula car navigating a tight street circuit, concrete walls close on either side, sparks flying from the floor as the car bottoms out. The urban backdrop includes buildings and packed spectator areas. The car's complex front wing endplates catch the afternoon sun. Dramatic low-angle photograph.`,
  },
  {
    filename: 'formula-003.png',
    prompt: `Photorealistic motorsport image: An aerial view of a formula racing grid formation before the start, with 20+ cars lined up in formation. The cars gleam with colorful liveries on the dark track surface. The straight stretches ahead with the first corner visible in the distance. Grandstands packed with spectators. Overhead drone-style shot with rich colors, professional race photography.`,
  },

  // --- Touring / Stock Cars (3) ---
  {
    filename: 'touring-001.png',
    prompt: `Photorealistic motorsport photography: Touring cars battling door-to-door through a tight corner, touring car bodywork almost touching. Recognizable sedan silhouettes with aggressive race aero - splitters, wings, and wide arches. Sparks and tire smoke add drama. Packed grandstands in the background. Intense close racing captured at the perfect moment. Professional BTCC/WTCC style race photography.`,
  },
  {
    filename: 'touring-002.png',
    prompt: `Photorealistic motorsport scene: A Brazilian Stock Car V8 style touring car at speed on an oval-style circuit, aggressive stance with wide bodywork and large rear spoiler. The car has a vibrant colorful livery with Brazilian sponsors. Warm tropical light conditions with palm trees visible beyond the circuit. Wide-angle action shot, professional motorsport photography.`,
  },
  {
    filename: 'touring-003.png',
    prompt: `Photorealistic motorsport image: A trio of muscle car touring racers drifting in formation through a hairpin, rear ends stepping out with tire smoke. V8 race cars with aggressive hood scoops and rear spoilers. The track surface shows heavy rubber buildup. Dramatic side-on panning shot with motion blur background. Professional race photography quality.`,
  },

  // --- Spec Series (3) ---
  {
    filename: 'spec-series-001.png',
    prompt: `Photorealistic motorsport photography: A grid of identical Porsche Cup race cars, all in slightly different liveries, racing in a tight pack through a fast sweeping corner. The one-make nature of the series is evident with identical body shapes but varied color schemes. Close wheel-to-wheel racing with aggressive driving. Professional Porsche Carrera Cup style race photography.`,
  },
  {
    filename: 'spec-series-002.png',
    prompt: `Photorealistic motorsport scene: A single-make Ginetta or similar sports car race with identical cars battling for position on a British circuit. Lush green grass runoff areas and traditional circuit infrastructure visible. Overcast British sky adding moody atmosphere. Cars are nearly bumper to bumper. Clean professional sports car racing photography.`,
  },
  {
    filename: 'spec-series-003.png',
    prompt: `Photorealistic motorsport image: A pack of identical Lamborghini Super Trofeo style race cars exiting pit lane in formation at the start of a race. The sleek low sports cars have dramatic angular body shapes. Pit buildings and team garages visible behind. Golden hour light creates long shadows on the pit straight. Professional motorsport photography.`,
  },

  // --- Historic / Vintage (3) ---
  {
    filename: 'historic-001.png',
    prompt: `Photorealistic vintage motorsport photography: A 1960s Group C Le Mans style sports car racing at speed, its long flowing body shape evoking the golden age of endurance racing. Classic round headlights and wire wheels. The car has a period-correct number roundel and vintage livery. Slightly desaturated warm tones giving a period feel. Professional classic car photography.`,
  },
  {
    filename: 'historic-002.png',
    prompt: `Photorealistic vintage racing scene: A collection of classic 1970s-era Formula cars racing on a circuit with period-correct armco barriers and hay bales. Open cockpits, large front and rear wings, and wide rear tires visible. Rich warm color palette reminiscent of period photography. Nostalgic motorsport atmosphere captured beautifully.`,
  },
  {
    filename: 'historic-003.png',
    prompt: `Photorealistic classic car image: A stunning vintage 1950s sports car in silver with a red racing stripe, photographed on a European hill climb road. Mountains and cypress trees in the background. The car's elegant curves and chrome details catch the Mediterranean sunlight. Timeless beauty of classic motorsport, magazine-quality photography.`,
  },

  // --- Karting (2) ---
  {
    filename: 'karting-001.png',
    prompt: `Photorealistic karting photography: Karts racing wheel-to-wheel through a tight hairpin on a karting circuit. Drivers in full race suits and helmets, leaning hard into the corner. Low camera angle emphasizes the speed and proximity of the karts. Tire barriers and colored kerbs visible. The raw grassroots energy of motorsport's starting point. Professional karting photography.`,
  },
  {
    filename: 'karting-002.png',
    prompt: `Photorealistic karting scene: A young kart racer accelerating out of a corner, kart chassis flexing slightly, rear tires leaving black marks. Simple karting circuit with flat terrain and colorful barriers. Clear blue sky above. The driver's visor reflects the track ahead. Ground-level tracking shot capturing the speed and thrill. Professional action photography.`,
  },

  // --- Paddock (3) ---
  {
    filename: 'paddock-001.png',
    prompt: `Photorealistic motorsport scene: A busy Formula-style paddock at a major race weekend. Team motorhomes and hospitality units line both sides, with team personnel in branded clothing walking between them. Sponsor logos and flags visible. Late afternoon golden light filtering between the structures. The buzzing atmosphere of race weekend captured. Wide establishing shot, professional motorsport photography.`,
  },
  {
    filename: 'paddock-002.png',
    prompt: `Photorealistic motorsport image: Inside a modern race team garage, a GT3 car being worked on by mechanics in team uniforms. Tool chests, tire warmers, and data screens surround the car. Fluorescent and LED lighting creates a clinical atmosphere. The car's bodywork panels are partially removed showing the roll cage. Professional behind-the-scenes motorsport photography.`,
  },
  {
    filename: 'paddock-003.png',
    prompt: `Photorealistic motorsport scene: A pit lane at night during a 24-hour race, illuminated by harsh work lights. Multiple team garages open with cars being serviced. Pit crew members in fire suits move with urgency. The track beyond is a river of headlights. Dramatic industrial atmosphere of endurance racing at night. Professional motorsport photography.`,
  },

  // --- Victory (2) ---
  {
    filename: 'victory-001.png',
    prompt: `Photorealistic motorsport celebration: A race winner standing on the top step of a podium, spraying champagne with explosive joy. Confetti fills the air catching the stadium lights. The podium has race branding and sponsor logos. Second and third place drivers celebrate below. Packed grandstands in the background erupting with excitement. Iconic motorsport celebration moment, professional sports photography.`,
  },
  {
    filename: 'victory-002.png',
    prompt: `Photorealistic motorsport scene: A racing driver climbing out of their car in parc ferme after winning a race, pumping their fist in triumph. The car still has tire marbles and battle scars from the race. Team members rush towards the car. Trophy and champagne visible on a nearby table. Raw emotional victory moment captured. Professional race photography.`,
  },

  // --- Night Racing (2) ---
  {
    filename: 'night-racing-001.png',
    prompt: `Photorealistic night racing photography: Multiple race cars streaming through a floodlit section of track at night, their headlights creating dramatic light trails. The dark sky above contrasts with the brilliant artificial lighting. Tire barriers and catch fencing glow in the car lights. The intensity and beauty of night racing. Long exposure motorsport photography, 8K quality.`,
  },
  {
    filename: 'night-racing-002.png',
    prompt: `Photorealistic night motorsport scene: A single race car streaking through a dark section of circuit with only its headlights and LED running lights illuminating the way. The car's reflection shimmers on the dark track surface. Stars visible in the sky above the treeline. The solitary beauty of night endurance racing. Atmospheric motorsport photography.`,
  },

  // --- Sim Racing (2) ---
  {
    filename: 'sim-racing-001.png',
    prompt: `Photorealistic gaming setup photography: A premium sim racing cockpit setup with triple ultrawide monitors showing a racing game. High-end direct drive steering wheel, load cell pedals, and buttkicker visible. The screens cast blue and white light across the dark room. RGB lighting accents the setup. Professional gaming/esports photography with dramatic lighting.`,
  },
  {
    filename: 'sim-racing-002.png',
    prompt: `Photorealistic esports scene: A sim racing esports competition stage with multiple racing rigs arranged in a row. Large projection screens show the race. Dramatic stage lighting in blue and purple. Competitors focused on their screens wearing headsets. The atmosphere of competitive sim racing. Professional esports event photography.`,
  },

  // --- Track Aerial (2) ---
  {
    filename: 'track-aerial-001.png',
    prompt: `Photorealistic aerial photograph: A stunning bird's-eye view of a modern racing circuit cutting through green countryside. The smooth dark track surface contrasts with green grass runoff areas and red/white kerbing. Multiple corners and a long main straight visible. Grandstands and pit buildings along the start-finish line. Drone photography, crystal clear conditions, 8K quality.`,
  },
  {
    filename: 'track-aerial-002.png',
    prompt: `Photorealistic aerial motorsport image: An overhead view of a race in progress, with cars spread around a circuit like colorful ants on a ribbon of dark track. The circuit winds through varied terrain with elevation changes visible from above. Medical helicopters and paddock areas visible. Stunning scale and beauty of motorsport from the air. Professional aerial photography.`,
  },

  // --- Garage (2) ---
  {
    filename: 'garage-001.png',
    prompt: `Photorealistic automotive workshop: A pristine professional racing team workshop with multiple race cars in various states of assembly. Polished concrete floors, overhead gantry cranes, and professional tool stations. The workshop is immaculately clean and organized. LED lighting creates a bright clinical atmosphere. Professional industrial photography.`,
  },
  {
    filename: 'garage-002.png',
    prompt: `Photorealistic workshop scene: Close-up of a race car engine being assembled on a stand in a high-end motorsport workshop. Precision tools, carbon fiber components, and titanium fasteners visible. A mechanic's gloved hands work on the engine. Shallow depth of field focuses on the craftsmanship. Professional automotive photography with warm workshop lighting.`,
  },

  // --- Pit Stop (1) ---
  {
    filename: 'pit-stop-001.png',
    prompt: `Photorealistic motorsport action: A perfectly choreographed pit stop in progress. The race car is jacked up with tire changers and fuel crew working in perfect synchronization. The pit crew wear matching fire suits and helmets. Wheel guns blur with speed. Compressed air and tire smoke in the air. The organized chaos of a professional pit stop captured at the perfect moment. High-speed professional motorsport photography.`,
  },

  // --- Rain Racing (1) ---
  {
    filename: 'rain-racing-001.png',
    prompt: `Photorealistic wet weather motorsport: Race cars navigating a soaking wet circuit in heavy rain. Massive rooster tails of spray erupt behind each car, reducing visibility. The track surface is a mirror reflecting car lights and sky. Rain drops are visible in the air. Dramatic and dangerous conditions that test true racing skill. Moody atmospheric motorsport photography with desaturated tones.`,
  },

  // --- Owner Backgrounds (8) ---
  {
    filename: 'owner-bg-self-made.png',
    prompt: `Photorealistic business scene: A modern entrepreneur's corner office in a glass skyscraper. Floor-to-ceiling windows showing a vibrant city skyline at dusk. Sleek minimalist desk with a laptop and premium coffee cup. Warm ambient lighting from designer fixtures. Success and ambition embodied in the space. Professional interior photography, wide angle, 8K quality.`,
  },
  {
    filename: 'owner-bg-racing-dynasty.png',
    prompt: `Photorealistic luxury scene: A grand hallway in a historic European manor house displaying a collection of vintage racing memorabilia. Framed photos of classic race cars and trophies in glass cabinets line the walls. Rich wood paneling and warm lighting. Heritage and prestige in every detail. The ancestral home of a racing family dynasty. Professional architectural photography.`,
  },
  {
    filename: 'owner-bg-tech-investor.png',
    prompt: `Photorealistic tech scene: A futuristic tech company headquarters with open plan design, large digital displays showing data visualizations, and a modern race car prototype on display in the lobby. Clean lines, glass walls, and premium materials. Silicon Valley meets motorsport innovation. Professional architectural and technology photography.`,
  },
  {
    filename: 'owner-bg-former-driver.png',
    prompt: `Photorealistic motorsport scene: A retired racing driver's personal trophy room. Glass cases filled with racing helmets, suits, and championship trophies from different eras. A vintage race car is mounted on the wall. Photos of podium celebrations and racing moments. The legacy of a racing career beautifully preserved. Warm dramatic spotlighting. Professional interior photography.`,
  },
  {
    filename: 'owner-bg-finance-mogul.png',
    prompt: `Photorealistic corporate scene: A prestigious executive boardroom in a major financial district. Panoramic views of a gleaming city skyline through floor-to-ceiling windows. Long polished conference table reflecting city lights. Dark wood and leather furnishings. Power and wealth radiating from every surface. Professional architectural photography at blue hour.`,
  },
  {
    filename: 'owner-bg-passionate-enthusiast.png',
    prompt: `Photorealistic automotive scene: An enthusiast's dream garage with a personal collection of sports cars and racing memorabilia. A pristine classic race car center stage with modern sports cars flanking it. Checkered flag details, neon brand signs, and racing artwork on the walls. The passion project of a true motorsport fan. Warm inviting lighting. Professional automotive photography.`,
  },
  {
    filename: 'owner-bg-corporate-executive.png',
    prompt: `Photorealistic corporate scene: A sophisticated corporate meeting room with a long glass table and premium ergonomic chairs. Large screen showing a racing team's performance analytics. Views of a modern business campus through the windows. Professional, clean, and authoritative. Corporate motorsport management at its finest. Professional interior photography.`,
  },
  {
    filename: 'owner-bg-lottery-winner.png',
    prompt: `Photorealistic luxury scene: An extravagant luxury lifestyle montage - a gleaming supercar parked in front of a Mediterranean villa with a pool. Champagne on a table by the pool, yacht visible in a nearby marina. The dream life of a sudden windfall brought to reality. Bright sunny day with vivid colors. Professional lifestyle photography.`,
  },

  // --- Hero / Banner Images (8) ---
  {
    filename: 'hero-main-menu.png',
    prompt: `Photorealistic wide panoramic motorsport image: An epic establishing shot of a world-class racing circuit at sunset. The track stretches into the distance with packed grandstands on both sides. Multiple race cars are visible on track in a formation lap. The sky is ablaze with orange, purple and gold. Dramatic and inspiring - the essence of professional motorsport. Ultra-wide cinematic aspect ratio, 8K quality, professional motorsport photography.`,
  },
  {
    filename: 'hero-career-hub.png',
    prompt: `Photorealistic panoramic motorsport banner: A stunning wide shot of a racing team's factory floor. Multiple race cars in various stages of preparation under bright LED lights. Engineers and mechanics work at stations surrounded by carbon fiber parts. The organized industrial beauty of a professional racing operation. Ultra-wide establishing shot, professional motorsport photography.`,
  },
  {
    filename: 'hero-paddock.png',
    prompt: `Photorealistic panoramic scene: A vibrant paddock scene at a prestigious international motor race. Team motorhomes, hospitality suites, and fans mingle in the paddock area. Banners and flags of racing teams flutter in the breeze. The buzz and excitement of race weekend atmosphere. Ultra-wide establishing shot with warm golden hour lighting. Professional event photography.`,
  },
  {
    filename: 'hero-contracts.png',
    prompt: `Photorealistic panoramic business scene: A sleek modern conference room where a contract signing is taking place. Racing team branding visible on the walls. A contract document and premium pen on the polished table. Through the windows, a racing circuit is visible in the distance. The business side of motorsport. Ultra-wide shot, professional corporate photography with warm tones.`,
  },
  {
    filename: 'hero-calendar.png',
    prompt: `Photorealistic panoramic global motorsport collage: A cinematic wide shot showing a modern GT race car speeding past, with a montage feel suggesting different worldwide circuits. Different lighting conditions and landscapes hint at a global championship calendar. Movement and journey captured in one frame. Ultra-wide cinematic composition, professional motorsport photography.`,
  },
  {
    filename: 'hero-garage.png',
    prompt: `Photorealistic panoramic garage scene: Inside a top-tier racing team garage during a race weekend. A race car sits center-stage with its bodywork panels removed revealing the roll cage and mechanicals. Tool stations, tire warmers, and data screens surround it. Mechanics work under bright strip lighting. Ultra-wide establishing shot capturing the entire garage bay. Professional motorsport photography.`,
  },
  {
    filename: 'hero-achievements.png',
    prompt: `Photorealistic panoramic trophy scene: A stunning display of motorsport championship trophies and awards arranged on illuminated glass shelves. Each trophy gleams under individual spotlights. Racing helmets and laurel wreaths complement the collection. The background fades to a dark gradient. The legacy of racing excellence. Ultra-wide shot, premium product photography lighting.`,
  },
  {
    filename: 'hero-race-day.png',
    prompt: `Photorealistic panoramic motorsport action: The dramatic moment of a race start as cars launch from the grid with tire smoke and sparks. Multiple rows of race cars accelerate toward the first corner. Packed grandstands roar with excitement. Dramatic low-angle wide shot capturing the full grid. The most exciting moment in motorsport. Ultra-wide cinematic composition, professional motorsport photography.`,
  },

  // --- Fallback (1) ---
  {
    filename: 'scene-fallback.png',
    prompt: `Photorealistic motorsport scene: A beautiful modern race car on a deserted circuit in the early morning mist. The car sits still on the track as dawn light breaks through low clouds. Dew glistens on the track surface. Peaceful yet full of potential energy. The calm before the storm of race day. Professional automotive photography with moody atmospheric lighting, 8K quality.`,
  },
]

// ============================================================
// IMAGE GENERATION
// ============================================================

async function generateImage(apiKey, prompt, retries = MAX_RETRIES) {
  const ai = new GoogleGenAI({ apiKey })

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseModalities: ['image', 'text'],
          temperature: 0.9,
        }
      })

      const parts = response.candidates?.[0]?.content?.parts
      if (!parts) throw new Error('No parts in response')

      for (const part of parts) {
        if (part.inlineData) {
          return Buffer.from(part.inlineData.data, 'base64')
        }
      }

      throw new Error('No image data in response')
    } catch (err) {
      const isRateLimit = err?.message?.includes('429') ||
        err?.message?.includes('QUOTA') ||
        err?.message?.includes('rate') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')

      const isSafety = err?.message?.includes('SAFETY') ||
        err?.message?.includes('safety') ||
        err?.message?.includes('blocked')

      if (isSafety) {
        console.error(`  SAFETY FILTER blocked this prompt. Skipping.`)
        return null
      }

      if (isRateLimit && attempt < retries - 1) {
        const delay = RETRY_BASE_DELAY * (attempt + 1) + Math.random() * 5000
        console.log(`  Rate limited, waiting ${(delay / 1000).toFixed(1)}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      if (attempt < retries - 1) {
        console.log(`  Error attempt ${attempt + 1}: ${err.message}`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        continue
      }

      console.error(`  FAILED after ${retries} attempts: ${err.message}`)
      return null
    }
  }

  return null
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY environment variable is required.')
    console.error('Set it in .env or export it before running this script.')
    process.exit(1)
  }

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   SCENE IMAGE GENERATOR                                       ║
║   Replacing Unsplash stock images with AI-generated scenes    ║
║   Model: ${MODEL}                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`)

  // Filter to only scenes that need generating
  const pending = []
  for (const scene of SCENES) {
    const outputPath = path.join(OUTPUT_DIR, scene.filename)
    try {
      await fs.access(outputPath)
      // File exists, skip
    } catch {
      pending.push(scene)
    }
  }

  const alreadyDone = SCENES.length - pending.length
  console.log(`Total scenes: ${SCENES.length}`)
  console.log(`Already generated: ${alreadyDone}`)
  console.log(`Remaining: ${pending.length}`)
  console.log()

  if (pending.length === 0) {
    console.log('All scene images are already generated! Nothing to do.')
    return
  }

  let completed = 0
  let failed = 0

  for (const scene of pending) {
    const outputPath = path.join(OUTPUT_DIR, scene.filename)
    const progress = `[${completed + failed + 1}/${pending.length}]`

    console.log(`${progress} Generating: ${scene.filename}`)

    const imageBuffer = await generateImage(apiKey, scene.prompt)

    if (imageBuffer) {
      await fs.writeFile(outputPath, imageBuffer)
      completed++
      console.log(`  Done (${(imageBuffer.length / 1024).toFixed(0)} KB)`)
    } else {
      failed++
      console.log(`  FAILED - skipping`)
    }

    // Wait between requests to respect Pro model rate limits
    if (pending.indexOf(scene) < pending.length - 1) {
      console.log(`  Waiting ${INTER_REQUEST_DELAY / 1000}s before next request...`)
      await new Promise(resolve => setTimeout(resolve, INTER_REQUEST_DELAY))
    }
  }

  console.log()
  console.log('═══════════════════════════════════════════')
  console.log(`  COMPLETE`)
  console.log(`  Generated: ${completed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total in directory: ${alreadyDone + completed}/${SCENES.length}`)
  console.log('═══════════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
