/**
 * Lifestyle image generation tasks.
 * Generates UNIQUE images for every lifestyle catalog item including tier upgrades.
 * 
 * Categories:
 * - ~42 vehicles (sports cars, supercars, hypercars, SUVs, classics, starter cars)
 * - ~59 property types (location-specific: apartments, houses, villas, etc.)
 * - ~14 memberships (country clubs, yacht clubs, gyms, aviation, etc. with tiers)
 * - ~39 furnishings (per-room, 3 tiers each: standard, premium, luxury)
 * - ~16 services (spa, travel, stylist, security, medical, chef, housekeeper with tiers)
 * - ~13 experiences (resort, safari, ski, jet, yacht, gala, space, etc.)
 * - ~21 collectibles (watches, wine, art, memorabilia, jewelry, rare items with tiers)
 * - ~11 pets (dogs, cats, horses, exotic)
 * - ~33 hobbies (9 hobby types × 3 levels + extras like sim racing, fitness, etc.)
 * - ~6 diet plans
 * - ~15 wardrobe items (casual, suits, formal, sportswear, accessories with tiers)
 * - ~8 courses (education)
 * 
 * ~277 total images
 */

import path from 'path'
import fs from 'fs'
import { GenerationTask } from '../batch-processor'

const BASE_OUTPUT_DIR = 'public/images/generated/lifestyle'

// ============================================================
// VEHICLES
// ============================================================

interface LifestyleImageDef {
  id: string
  filename: string
  prompt: string
  subcategory: string
}

const VEHICLE_IMAGES: LifestyleImageDef[] = [
  { id: 'porsche-911-gt3', filename: 'porsche-911-gt3.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Porsche 911 GT3 in a sleek modern showroom. The sports car gleams under dramatic studio lighting, reflecting off the polished dark floor. Side three-quarter view showing the iconic silhouette. Professional car photography, 8K quality, clean background.' },
  { id: 'ferrari-296-gtb', filename: 'ferrari-296-gtb.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Ferrari 296 GTB in Rosso Corsa red, parked in an elegant Italian courtyard at golden hour. The supercar\'s aggressive curves catch warm sunlight. Low angle front three-quarter view. Professional automotive photography, 8K quality.' },
  { id: 'mclaren-720s', filename: 'mclaren-720s.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A McLaren 720S in papaya orange, displayed in a minimalist white showroom. Dihedral doors open upward. The car\'s flowing aerodynamic body dominates the frame. Professional product photography.' },
  { id: 'mercedes-amg-gt', filename: 'mercedes-amg-gt.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Mercedes-AMG GT in silver, photographed on a deserted mountain road at dusk. Long hood and muscular rear haunches prominent. Cinematic automotive photography with dramatic sky.' },
  { id: 'bmw-m4-csl', filename: 'bmw-m4-csl.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A BMW M4 CSL in Isle of Man Green, parked in a modern underground garage. Sharp aggressive styling with carbon fiber accents visible. Clean professional car photography.' },
  { id: 'aston-martin-vantage', filename: 'aston-martin-vantage.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: An Aston Martin Vantage in British Racing Green, parked outside a stately English manor house. Classic elegance meets modern performance. Professional automotive photography, warm golden hour lighting.' },
  { id: 'lamborghini-huracan', filename: 'lamborghini-huracan.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Lamborghini Huracán in Verde Mantis green, on a dramatic coastal road. The angular supercar profile against deep blue sea and sky. Cinematic wide shot, professional photography.' },
  { id: 'pagani-huayra', filename: 'pagani-huayra.png', subcategory: 'vehicles',
    prompt: 'Photorealistic hypercar photography: A Pagani Huayra in exposed carbon fiber with red accents, in a pristine museum-like setting. Intricate details of the hand-crafted bodywork visible. Ultra-premium automotive photography.' },
  { id: 'bugatti-chiron', filename: 'bugatti-chiron.png', subcategory: 'vehicles',
    prompt: 'Photorealistic hypercar photography: A Bugatti Chiron in blue and black two-tone, parked on a grand château driveway. The ultimate expression of automotive luxury and power. Cinematic photography with dramatic clouds.' },
  { id: 'rolls-royce-ghost', filename: 'rolls-royce-ghost.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Rolls-Royce Ghost in midnight blue, outside a luxury hotel at night. Subtle coach lighting from the Spirit of Ecstasy illuminates the hood. Sophisticated night automotive photography.' },
  { id: 'bentley-continental', filename: 'bentley-continental.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Bentley Continental GT in British Racing Green with chrome details, photographed on a sweeping English country road. Grand touring elegance. Professional automotive photography.' },
  { id: 'range-rover', filename: 'range-rover.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury SUV photography: A Range Rover Autobiography in Carpathian Grey, parked in front of a contemporary glass-and-stone residence. Commanding presence and luxury. Professional automotive photography.' },
  { id: 'ferrari-250-gto', filename: 'ferrari-250-gto.png', subcategory: 'vehicles',
    prompt: 'Photorealistic classic car photography: A Ferrari 250 GTO in classic red with white racing roundel, in a temperature-controlled collector\'s garage. The most valuable car ever made, curves gleaming. Museum-quality photography with warm spot lighting.' },
  { id: 'shelby-cobra', filename: 'shelby-cobra.png', subcategory: 'vehicles',
    prompt: 'Photorealistic classic car photography: A Shelby Cobra 427 in metallic blue with white racing stripes, on a vintage racetrack pit lane. Raw American muscle and racing heritage. Professional classic car photography.' },
  { id: 'tesla-model-s', filename: 'tesla-model-s.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A Tesla Model S Plaid in pearl white, parked in a futuristic urban setting with clean architectural lines. Modern electric performance. Minimalist professional photography.' },
  { id: 'ford-gt', filename: 'ford-gt.png', subcategory: 'vehicles',
    prompt: 'Photorealistic supercar photography: A Ford GT in Gulf Heritage livery (light blue with orange stripe), in a modern collectors garage. The iconic American Le Mans winner. Dramatic studio lighting, professional photography.' },
  { id: 'audi-r8', filename: 'audi-r8.png', subcategory: 'vehicles',
    prompt: 'Photorealistic supercar photography: An Audi R8 V10 in Nardo Grey, in a sleek modern parking structure. The clean Audi design language visible from a low front three-quarter angle. Professional automotive photography.' },
  { id: 'g-wagon', filename: 'g-wagon.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury SUV photography: A Mercedes G-Wagon in matte black, parked in an upscale urban setting at night. Boxy iconic silhouette illuminated by city lights. Professional night automotive photography.' },
  { id: 'porsche-959', filename: 'porsche-959.png', subcategory: 'vehicles',
    prompt: 'Photorealistic classic car photography: A Porsche 959 in silver, displayed in a private collector\'s showroom. The groundbreaking 1980s supercar that defined a generation. Clean museum-quality photography.' },
  { id: 'land-cruiser', filename: 'land-cruiser.png', subcategory: 'vehicles',
    prompt: 'Photorealistic SUV photography: A Toyota Land Cruiser in white, photographed in a rugged Australian outback landscape at golden hour. Adventure-ready reliability and toughness. Professional outdoor automotive photography.' },
  // === NEW: Missing catalog vehicles ===
  { id: 'ford-mustang-gt', filename: 'ford-mustang-gt.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A Ford Mustang GT in Guards Red, on an American highway at sunset. Aggressive front fascia and muscular stance. Cinematic wide shot with warm golden light. Professional automotive photography.' },
  { id: 'chevrolet-corvette', filename: 'chevrolet-corvette.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A Chevrolet Corvette Stingray C8 in Rapid Blue, mid-engine profile visible from a low three-quarter angle in a modern showroom. Dramatic lighting highlighting the aggressive body lines. Professional car photography.' },
  { id: 'porsche-cayman-gts', filename: 'porsche-cayman-gts.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A Porsche Cayman GTS in Python Green, on a winding alpine road. Mid-engine sports car perfection, dynamic driving pose. Professional automotive photography with mountain backdrop.' },
  { id: 'aston-martin-db12', filename: 'aston-martin-db12.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: An Aston Martin DB12 in Sapphire Blue, parked at a luxury marina at twilight. Elegant grand tourer lines reflected in calm water. Professional automotive photography.' },
  { id: 'ferrari-roma', filename: 'ferrari-roma.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Ferrari Roma in Grigio Titanio, on the streets of Rome at dusk. Elegant Italian design against ancient architecture. Cinematic automotive photography with warm Mediterranean light.' },
  { id: 'lamborghini-revuelto', filename: 'lamborghini-revuelto.png', subcategory: 'vehicles',
    prompt: 'Photorealistic supercar photography: A Lamborghini Revuelto in Verde Alceo, in a dramatic modern concrete parking structure. Angular aggressive design, scissor doors open. Professional automotive photography with strong geometric shadows.' },
  { id: 'ferrari-sf90', filename: 'ferrari-sf90.png', subcategory: 'vehicles',
    prompt: 'Photorealistic supercar photography: A Ferrari SF90 Stradale in Rosso Corsa, on a dark racetrack at twilight. LED lights illuminated, hybrid hypercar power. Dramatic low-angle professional automotive photography.' },
  { id: 'mclaren-speedtail', filename: 'mclaren-speedtail.png', subcategory: 'vehicles',
    prompt: 'Photorealistic hypercar photography: A McLaren Speedtail in Silica White, in a futuristic glass showroom. The elongated teardrop shape is stunning. Three-seat layout visible. Ultra-premium professional automotive photography.' },
  { id: 'koenigsegg-jesko', filename: 'koenigsegg-jesko.png', subcategory: 'vehicles',
    prompt: 'Photorealistic hypercar photography: A Koenigsegg Jesko in clear carbon with gold accents, in an exclusive private collection. Massive rear wing and complex aero visible. Museum-quality photography with focused spotlighting.' },
  { id: 'porsche-cayenne-turbo', filename: 'porsche-cayenne-turbo.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury SUV photography: A Porsche Cayenne Turbo GT in Carmine Red, on a mountain road with dramatic scenery. Sports SUV in its element. Professional automotive photography with sweeping landscape.' },
  { id: 'lamborghini-urus', filename: 'lamborghini-urus.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury SUV photography: A Lamborghini Urus Performante in Giallo Inti yellow, in an urban setting at night. Aggressive super-SUV presence. Professional night automotive photography with city lights.' },
  { id: 'porsche-taycan', filename: 'porsche-taycan.png', subcategory: 'vehicles',
    prompt: 'Photorealistic electric car photography: A Porsche Taycan Turbo S in Frozen Blue metallic, at a futuristic charging station. Sleek electric performance sedan. Professional automotive photography with modern architecture.' },
  { id: 'rimac-nevera', filename: 'rimac-nevera.png', subcategory: 'vehicles',
    prompt: 'Photorealistic electric hypercar photography: A Rimac Nevera in silver, on a coastal Croatian road. The world\'s fastest electric car against the Adriatic Sea. Stunning aerodynamic design. Professional automotive photography.' },
  { id: 'rolls-royce-phantom', filename: 'rolls-royce-phantom.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Rolls-Royce Phantom in Arctic White, parked under a grand hotel portico. The ultimate expression of automotive luxury. Starlight headliner visible through the window. Professional photography.' },
  { id: 'maybach-s680', filename: 'maybach-s680.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Mercedes-Maybach S 680 in two-tone black and silver, with a chauffeur opening the door at a gala event. Ultra-luxury limousine. Professional event automotive photography.' },
  { id: 'mercedes-300sl', filename: 'mercedes-300sl.png', subcategory: 'vehicles',
    prompt: 'Photorealistic classic car photography: A Mercedes-Benz 300SL Gullwing in silver, with its iconic gullwing doors open, in a historic European courtyard. One of the most beautiful cars ever made. Warm vintage-tone professional photography.' },
  { id: 'ferrari-288-gto', filename: 'ferrari-288-gto.png', subcategory: 'vehicles',
    prompt: 'Photorealistic classic car photography: A Ferrari 288 GTO in classic red, on an Italian hillside road. The rare Group B homologation special radiating 1980s supercar energy. Professional vintage automotive photography.' },
  // === NEW: Starter vehicles ===
  { id: 'bmw-3-series', filename: 'bmw-3-series.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A BMW 3 Series (G20) in Mineral White, parked in a modern office complex parking area. The quintessential executive sedan. Clean professional automotive photography.' },
  { id: 'mercedes-s-class', filename: 'mercedes-s-class.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury automotive photography: A Mercedes-Benz S-Class in Obsidian Black, parked at a luxury hotel entrance. The benchmark luxury sedan with elegant presence. Professional automotive photography.' },
  { id: 'porsche-911-carrera', filename: 'porsche-911-carrera.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A Porsche 911 Carrera in GT Silver, on a coastal European road. The everyday sports car icon. Classic silhouette from a three-quarter rear view. Professional automotive photography with ocean backdrop.' },
  { id: 'bmw-m4', filename: 'bmw-m4.png', subcategory: 'vehicles',
    prompt: 'Photorealistic automotive photography: A BMW M4 Competition in San Marino Blue, on a mountain road. The aggressive front grille and wide stance prominent. Dynamic angle showing performance character. Professional automotive photography.' },
  { id: 'range-rover-sport', filename: 'range-rover-sport.png', subcategory: 'vehicles',
    prompt: 'Photorealistic luxury SUV photography: A Range Rover Sport in Eiger Grey, photographed in an upscale suburban driveway. The sporty yet elegant luxury SUV. Professional automotive photography with warm lighting.' },
]

// ============================================================
// PROPERTIES
// ============================================================

const PROPERTY_IMAGES: LifestyleImageDef[] = [
  { id: 'prop-apartment', filename: 'apartment.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern luxury apartment interior with floor-to-ceiling windows overlooking a city skyline at dusk. Open plan living with designer furniture, warm ambient lighting. Professional architectural photography.' },
  { id: 'prop-house', filename: 'house.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A beautiful suburban family home with manicured lawn, two-car garage, and welcoming front porch. Classic American architecture at golden hour. Professional real estate photography.' },
  { id: 'prop-villa', filename: 'villa.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Mediterranean luxury villa with terracotta roof, swimming pool, and palm trees. Viewed from the garden with infinity pool in the foreground. Golden hour, professional architectural photography.' },
  { id: 'prop-mansion', filename: 'mansion.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A grand English mansion with sweeping driveway, manicured hedges, and stone facade. The estate\'s grandeur shown in a wide establishing shot at sunset. Professional luxury real estate photography.' },
  { id: 'prop-penthouse', filename: 'penthouse.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern penthouse rooftop terrace at night, with outdoor seating, ambient lighting, and panoramic city views. Sleek contemporary design. Professional luxury interior photography.' },
  { id: 'prop-beach-house', filename: 'beach-house.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A stunning beachfront property with white walls and large windows overlooking turquoise ocean. Wooden deck with loungers. Tropical paradise architecture. Professional real estate photography.' },
  { id: 'prop-ski-chalet', filename: 'ski-chalet.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury ski chalet in the Alps, warm light glowing from windows against a snowy mountain backdrop. Traditional timber and stone construction with modern touches. Cozy winter atmosphere.' },
  { id: 'prop-commercial', filename: 'commercial.png', subcategory: 'properties',
    prompt: 'Photorealistic commercial real estate photography: A modern commercial building with glass facade in a business district. Clean lines, professional appearance. Blue sky reflected in the building\'s windows. Professional architectural photography.' },
  { id: 'prop-land', filename: 'land.png', subcategory: 'properties',
    prompt: 'Photorealistic landscape photography: A beautiful plot of undeveloped land with rolling hills, scattered trees, and distant mountains. The potential of a blank canvas. Golden hour aerial-style shot. Professional landscape photography.' },
  // === NEW: Location-specific apartments ===
  { id: 'prop-apartment-monaco', filename: 'apartment-monaco.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury apartment interior in Monaco with floor-to-ceiling windows overlooking the Monte Carlo harbour and yachts. Mediterranean blue views, marble floors, designer furniture. Professional architectural photography.' },
  { id: 'prop-apartment-new-york', filename: 'apartment-new-york.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern Manhattan apartment with dramatic floor-to-ceiling windows overlooking Central Park and the city skyline at dusk. Sleek minimalist interior, warm ambient lighting. Professional architectural photography.' },
  { id: 'prop-apartment-paris', filename: 'apartment-paris.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury Haussmann apartment in Paris with ornate moldings, herringbone parquet floors, tall French windows and a balcony overlooking a tree-lined boulevard. Elegant Parisian interior design. Professional architectural photography.' },
  { id: 'prop-apartment-dubai', filename: 'apartment-dubai.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern ultra-luxury apartment in a Dubai skyscraper with panoramic desert and skyline views. White marble, gold accents, floor-to-ceiling windows at sunset. Professional architectural photography.' },
  { id: 'prop-apartment-tokyo', filename: 'apartment-tokyo.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A sleek modern apartment in Tokyo with minimalist Japanese interior design, tatami accents, and views of the neon-lit Shibuya skyline at night. Clean lines and zen aesthetics. Professional architectural photography.' },
  { id: 'prop-apartment-miami', filename: 'apartment-miami.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury high-rise apartment in Miami with ocean-facing balcony, tropical plants, white interiors and Biscayne Bay views. Art Deco influences, vibrant sunset. Professional real estate photography.' },
  { id: 'prop-apartment-barcelona', filename: 'apartment-barcelona.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A renovated apartment in Barcelona\'s Eixample district with high ceilings, colourful Catalan tiles, and a balcony overlooking a Gaudi-era street. Mediterranean light flooding in. Professional architectural photography.' },
  { id: 'prop-apartment-amsterdam', filename: 'apartment-amsterdam.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A canal house apartment in Amsterdam with exposed brick, large windows overlooking canals and houseboats. Warm Dutch interior with modern furnishings. Professional architectural photography.' },
  { id: 'prop-apartment-london', filename: 'apartment-london.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury apartment in a converted London warehouse with exposed brick walls, industrial features, and Thames river views. Modern British interior design. Professional architectural photography.' },
  { id: 'prop-apartment-singapore', filename: 'apartment-singapore.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern luxury apartment in Singapore with panoramic Marina Bay views, infinity pool visible from the living room. Tropical modern design with lush greenery. Professional architectural photography.' },
  { id: 'prop-apartment-lisbon', filename: 'apartment-lisbon.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A renovated apartment in Lisbon\'s Chiado district with traditional azulejo tiles, high ceilings, and views over red terracotta rooftops to the Tagus river. Warm Portuguese light. Professional real estate photography.' },
  { id: 'prop-apartment-berlin', filename: 'apartment-berlin.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern loft apartment in Berlin\'s Mitte district with industrial-chic design, exposed concrete, large windows and gallery-white walls. Creative urban living. Professional architectural photography.' },
  // === NEW: Location-specific houses ===
  { id: 'prop-house-surrey', filename: 'house-surrey.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: An English country house in Surrey with red brick, climbing roses, and a large manicured garden. Classic English architecture with green rolling countryside behind. Professional real estate photography.' },
  { id: 'prop-house-munich', filename: 'house-munich.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Bavarian-style house in Munich\'s Bogenhausen district with stucco walls, shuttered windows and a neat German garden. Alpine views in the distance. Professional architectural photography.' },
  { id: 'prop-house-los-angeles', filename: 'house-los-angeles.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern mid-century house in the Hollywood Hills with clean lines, floor-to-ceiling windows and an infinity pool overlooking the LA basin. Palm trees and sunset. Professional real estate photography.' },
  { id: 'prop-house-cape-town', filename: 'house-cape-town.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Cape Dutch style house in Constantia with white-washed walls, thatched roof, and vineyard views with Table Mountain in the background. South African elegance. Professional real estate photography.' },
  { id: 'prop-house-toronto', filename: 'house-toronto.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A grand Victorian mansion in Toronto\'s Rosedale neighbourhood with red brick, turrets, and mature tree-lined streets. Autumn colours. Professional Canadian real estate photography.' },
  { id: 'prop-house-melbourne', filename: 'house-melbourne.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A grand Victorian-era mansion in Melbourne\'s Toorak with ornate wrought-iron lacework, heritage facade, and established gardens. Australian luxury heritage. Professional real estate photography.' },
  { id: 'prop-house-oxford', filename: 'house-oxford.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A charming Cotswold-stone house in North Oxford with wisteria-covered walls, a green front garden and a blue front door. English academic town charm. Professional real estate photography.' },
  { id: 'prop-house-charlotte', filename: 'house-charlotte.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Southern colonial-style home in Charlotte\'s Myers Park with white columns, wraparound porch, and magnolia trees. Classic American South elegance. Professional real estate photography.' },
  // === NEW: Location-specific villas ===
  { id: 'prop-villa-monaco', filename: 'villa-monaco.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern luxury villa in Monaco with infinity pool overlooking the Mediterranean and Monte Carlo harbour. White contemporary architecture with subtropical gardens. Professional architectural photography.' },
  { id: 'prop-villa-nice', filename: 'villa-nice.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A provençal villa on the French Riviera near Nice with terracotta roof, lavender gardens, and views across the deep blue Mediterranean. French Riviera elegance. Professional real estate photography.' },
  { id: 'prop-villa-lake-como', filename: 'villa-lake-como.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A grand Italian villa on the shores of Lake Como with stone balustrades, formal Italian gardens, and calm reflective lake waters with mountains beyond. Professional architectural photography.' },
  { id: 'prop-villa-marbella', filename: 'villa-marbella.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A contemporary white villa in Marbella\'s La Zagaleta with infinity pool, palm trees, and panoramic mountain and sea views. Spanish Costa del Sol luxury. Professional real estate photography.' },
  { id: 'prop-villa-dubai', filename: 'villa-dubai.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A modern villa on Dubai\'s Palm Jumeirah with private beach, glass walls and views of the Atlantis hotel. Opulent Middle Eastern luxury architecture. Professional real estate photography.' },
  { id: 'prop-villa-singapore', filename: 'villa-singapore.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A tropical luxury villa in Singapore\'s Sentosa Cove with lush gardens, pool and modern Asian architecture. Tropical foliage and waterfront views. Professional architectural photography.' },
  { id: 'prop-villa-sydney', filename: 'villa-sydney.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A contemporary waterfront villa in Sydney\'s Point Piper with harbour views, infinity pool, and sandstone terraces. The Opera House visible in the distance. Professional real estate photography.' },
  { id: 'prop-villa-algarve', filename: 'villa-algarve.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A whitewashed villa in the Portuguese Algarve with terracotta accents, pool, and views of dramatic golden limestone cliffs and turquoise ocean. Professional real estate photography.' },
  // === NEW: Location-specific mansions ===
  { id: 'prop-mansion-beverly-hills', filename: 'mansion-beverly-hills.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A sprawling Beverly Hills mega-mansion with manicured grounds, motor court, and panoramic city views. Hollywood glamour architecture, palm-lined driveway. Professional luxury real estate photography.' },
  { id: 'prop-mansion-miami', filename: 'mansion-miami.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A waterfront mansion on Miami\'s Star Island with private dock, tropical gardens, and Art Deco influenced architecture. Biscayne Bay views at sunset. Professional real estate photography.' },
  { id: 'prop-mansion-dubai', filename: 'mansion-dubai.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: An Emirates Hills mega-mansion in Dubai with Arabic-influenced modern architecture, ornate fountains, and desert-adapted gardens. Opulent Gulf luxury. Professional real estate photography.' },
  { id: 'prop-mansion-marbella', filename: 'mansion-marbella.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A hilltop mega-mansion in Marbella\'s La Zagaleta with multiple pools, tennis court, and 360-degree views of mountains and Mediterranean Sea. Spanish luxury estate. Professional real estate photography.' },
  { id: 'prop-mansion-singapore', filename: 'mansion-singapore.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Good Class Bungalow in Singapore surrounded by tropical gardens with a reflecting pool. Modernist tropical architecture blending indoor-outdoor living. Professional real estate photography.' },
  { id: 'prop-mansion-london', filename: 'mansion-london.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A grand stucco-fronted mansion in London\'s Mayfair with Corinthian columns, black railings, and a prestigious garden square view. Georgian architectural grandeur. Professional real estate photography.' },
  // === NEW: Location-specific penthouses ===
  { id: 'prop-penthouse-monaco', filename: 'penthouse-monaco.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A sky penthouse in Monaco overlooking the harbour, grand prix track, and Mediterranean. Wrap-around terrace, private pool, ultra-luxury interiors. Professional architectural photography.' },
  { id: 'prop-penthouse-new-york', filename: 'penthouse-new-york.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Manhattan penthouse with 360-degree skyline views, double-height ceilings, and a private terrace overlooking Central Park. Billionaire\'s Row luxury. Professional architectural photography.' },
  { id: 'prop-penthouse-dubai', filename: 'penthouse-dubai.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A penthouse in Downtown Dubai with views of the Burj Khalifa, Dubai Fountain, and desert beyond. Gold and marble interiors with panoramic windows. Professional architectural photography.' },
  { id: 'prop-penthouse-singapore', filename: 'penthouse-singapore.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A super penthouse in Singapore\'s Marina Bay area with infinity pool, lush sky gardens, and views of the city-state skyline at night. Tropical ultra-luxury. Professional architectural photography.' },
  { id: 'prop-penthouse-paris', filename: 'penthouse-paris.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A penthouse apartment atop a Haussmann building in Paris with a rooftop terrace and the Eiffel Tower visible through wrought iron railings. Champagne on the terrace at sunset. Professional architectural photography.' },
  { id: 'prop-penthouse-miami', filename: 'penthouse-miami.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A beachfront penthouse in Miami\'s Sunny Isles with wraparound ocean views, flow-through floorplan, and private pool. White modern interiors. Professional real estate photography.' },
  { id: 'prop-penthouse-tokyo', filename: 'penthouse-tokyo.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A minimalist penthouse in Tokyo\'s Minato district with views of Tokyo Tower and the city lights. Japanese design sensibility with warm wood and clean lines. Professional architectural photography.' },
  { id: 'prop-penthouse-sao-paulo', filename: 'penthouse-sao-paulo.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A duplex penthouse in Sao Paulo\'s Jardins district with rooftop pool, tropical plants, and views of the sprawling Brazilian megacity at dusk. Contemporary Latin American luxury. Professional real estate photography.' },
  // === NEW: Location-specific beach houses ===
  { id: 'prop-beach-house-malibu', filename: 'beach-house-malibu.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Malibu beach house on Carbon Beach with floor-to-ceiling ocean views, weathered wood and white decor. California coastal luxury with Pacific waves crashing below. Professional real estate photography.' },
  { id: 'prop-beach-house-sydney', filename: 'beach-house-sydney.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A contemporary beach house overlooking Bondi Beach in Sydney with sandstone walls and blue ocean panorama. Australian coastal architecture. Professional real estate photography.' },
  { id: 'prop-beach-house-nice', filename: 'beach-house-nice.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A Mediterranean beach villa in Antibes near Nice with terracotta tiles, blue shutters, and the azure Cote d\'Azur sea. French Riviera charm. Professional real estate photography.' },
  { id: 'prop-beach-house-sitges', filename: 'beach-house-sitges.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A whitewashed beach house in Sitges, Spain, with bougainvillea-covered walls, rooftop terrace, and views of the Mediterranean coast. Catalan coastal charm. Professional real estate photography.' },
  { id: 'prop-beach-house-cancun', filename: 'beach-house-cancun.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury beachfront property in Cancun\'s Hotel Zone with turquoise Caribbean waters, white sand, and modern Mexican architecture with palapa roof accents. Professional real estate photography.' },
  // === NEW: Other location-specific ===
  { id: 'prop-ski-chalet-geneva', filename: 'ski-chalet-geneva.png', subcategory: 'properties',
    prompt: 'Photorealistic real estate photography: A luxury Swiss ski chalet near Geneva with timber and stone construction, floor-to-ceiling windows framing snow-capped Alps. Warm interior glow against a blue winter twilight. Professional architectural photography.' },
  { id: 'prop-land-starnberg', filename: 'land-starnberg.png', subcategory: 'properties',
    prompt: 'Photorealistic landscape photography: A premium plot of land in Starnberg near Munich, overlooking the lake with the Bavarian Alps in the background. Green rolling meadow with scattered birch trees. Professional landscape photography.' },
  { id: 'prop-commercial-london', filename: 'commercial-london.png', subcategory: 'properties',
    prompt: 'Photorealistic commercial real estate photography: A modern glass office building in London\'s Canary Wharf with the Thames river and Docklands skyline. Clean corporate architecture at blue hour. Professional architectural photography.' },
]

// ============================================================
// COLLECTIBLES
// ============================================================

const COLLECTIBLE_IMAGES: LifestyleImageDef[] = [
  // Watches (4 unique)
  { id: 'col-rolex-sub', filename: 'rolex-submariner.png', subcategory: 'collectibles',
    prompt: 'Photorealistic luxury watch photography: A Rolex Submariner with black dial and bezel on dark velvet, dramatic side lighting catching the brushed steel bracelet. Macro detail of the iconic diving bezel. Professional still life photography.' },
  { id: 'col-patek-calatrava', filename: 'patek-calatrava.png', subcategory: 'collectibles',
    prompt: 'Photorealistic luxury watch photography: A Patek Philippe Calatrava with white dial and brown leather strap on dark background. Elegant simplicity of haute horology. Professional product photography with warm lighting.' },
  { id: 'col-patek-nautilus', filename: 'patek-nautilus.png', subcategory: 'collectibles',
    prompt: 'Photorealistic luxury watch photography: A Patek Philippe Nautilus with blue dial and steel bracelet, catching dramatic light. The iconic porthole shape. Professional still life photography on slate background.' },
  { id: 'col-richard-mille', filename: 'richard-mille.png', subcategory: 'collectibles',
    prompt: 'Photorealistic luxury watch photography: A Richard Mille RM 011 with skeleton dial showing complex movement, on a carbon fiber surface. Ultra-modern watchmaking. Professional macro product photography.' },
  // Wine (4 unique - was 2)
  { id: 'col-wine-bordeaux', filename: 'wine-bordeaux.png', subcategory: 'collectibles',
    prompt: 'Photorealistic wine photography: A case of premium Bordeaux wine bottles with aged labels, arranged in a stone wine cellar with candlelight. Rich warm tones, cork and oak visible. Professional still life photography.' },
  { id: 'col-wine-burgundy', filename: 'wine-burgundy.png', subcategory: 'collectibles',
    prompt: 'Photorealistic wine photography: Distinctive slope-shouldered Burgundy bottles arranged in a limestone cave cellar, hand-written domaine labels visible. Earthy tones, delicate pinot noir character. Professional still life photography.' },
  { id: 'col-wine-drc', filename: 'wine-drc.png', subcategory: 'collectibles',
    prompt: 'Photorealistic wine photography: A single bottle of Domaine de la Romanée-Conti Burgundy wine, displayed with reverence in a velvet-lined case under museum spotlight. The holy grail of wine. Professional product photography.' },
  { id: 'col-wine-legendary-cellar', filename: 'wine-legendary-cellar.png', subcategory: 'collectibles',
    prompt: 'Photorealistic wine photography: A museum-quality wine vault with hundreds of historic bottles behind temperature-controlled glass, digital inventory displays, and a tasting table set with Riedel glasses. Professional interior photography.' },
  // Art (4 unique - was 2)
  { id: 'col-art-emerging', filename: 'art-emerging.png', subcategory: 'collectibles',
    prompt: 'Photorealistic art photography: A vibrant emerging artist painting on a white gallery wall, bold abstract colors, small brass nameplate, simple track lighting. Affordable contemporary art. Professional gallery photography.' },
  { id: 'col-art-established', filename: 'art-established.png', subcategory: 'collectibles',
    prompt: 'Photorealistic art gallery photography: A large recognized contemporary painting in a sophisticated interior, professional gallery lighting, leather bench for viewing. Established artist work with prestige. Professional photography.' },
  { id: 'col-art-master', filename: 'art-master.png', subcategory: 'collectibles',
    prompt: 'Photorealistic art gallery photography: A framed museum-quality painting in an ornate gold frame on a dark gallery wall with dedicated museum lighting. Classical art in a prestigious private collection setting.' },
  { id: 'col-art-museum', filename: 'art-museum-masterpiece.png', subcategory: 'collectibles',
    prompt: 'Photorealistic art photography: A historically significant masterwork painting in ornate gilded frame with individual spot lighting, velvet rope barrier, museum-grade glass, climate-controlled private gallery. Professional photography.' },
  // Memorabilia (3 unique - was 1)
  { id: 'col-memorabilia-signed', filename: 'memorabilia-sports.png', subcategory: 'collectibles',
    prompt: 'Photorealistic sports memorabilia photography: A collection of signed championship sports memorabilia displayed in glass cases - jerseys, rings, and trophies with authentication certificates. Professional collector display photography.' },
  { id: 'col-memorabilia-rings', filename: 'championship-rings.png', subcategory: 'collectibles',
    prompt: 'Photorealistic jewelry photography: A collection of authentic championship rings displayed in a custom velvet-lined presentation case, each with engraved team names and diamond settings. Dramatic spot lighting. Professional product photography.' },
  { id: 'col-memorabilia-historic', filename: 'historic-sports-artifact.png', subcategory: 'collectibles',
    prompt: 'Photorealistic museum photography: A game-used historic sports artifact (bat, glove, or helmet) in a museum-quality display case with period photographs, plaque, and authentication documentation. Warm focused lighting. Professional photography.' },
  // Jewelry (3 unique - was 1)
  { id: 'col-diamond', filename: 'diamond-investment.png', subcategory: 'collectibles',
    prompt: 'Photorealistic jewelry photography: A brilliant-cut diamond on black velvet under focused lighting, rainbow refractions dancing across the surface. GIA certification visible nearby. Professional gemstone photography, macro detail.' },
  { id: 'col-fancy-diamond', filename: 'fancy-colored-diamond.png', subcategory: 'collectibles',
    prompt: 'Photorealistic jewelry photography: A vivid pink fancy colored diamond under a jeweler\'s loupe, extraordinary fire and brilliance visible, GIA certificate with "Fancy Vivid" grade. Black velvet background. Professional macro photography.' },
  { id: 'col-royal-jewelry', filename: 'royal-jewelry.png', subcategory: 'collectibles',
    prompt: 'Photorealistic jewelry photography: A historic royal tiara with diamonds and sapphires in a museum display case surrounded by deep blue velvet, provenance documentation visible. Regal and priceless. Professional museum photography.' },
  // Rare Items (3 unique - was 1)
  { id: 'col-rare-book', filename: 'rare-book.png', subcategory: 'collectibles',
    prompt: 'Photorealistic still life photography: A rare first edition book displayed in a climate-controlled glass case, leather binding with gold embossing visible. Library atmosphere with warm spot lighting. Professional archival photography.' },
  { id: 'col-rare-coins', filename: 'historic-coin-collection.png', subcategory: 'collectibles',
    prompt: 'Photorealistic numismatic photography: Ancient gold and silver coins arranged in a professional numismatic display case with individual felt compartments, magnifying glass and reference catalog nearby. Warm focused lighting.' },
  { id: 'col-rare-artifact', filename: 'ancient-artifact.png', subcategory: 'collectibles',
    prompt: 'Photorealistic museum photography: An ancient bronze statue or decorated pottery piece in a climate-controlled display case with museum label and provenance card. Archaeological significance. Professional museum photography.' },
]

// ============================================================
// PETS
// ============================================================

const PET_IMAGES: LifestyleImageDef[] = [
  { id: 'pet-golden', filename: 'golden-retriever.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: A beautiful Golden Retriever sitting in a lush garden, warm afternoon light creating a golden halo around its fur. Happy expression, soft bokeh background. Professional pet portrait photography.' },
  { id: 'pet-frenchie', filename: 'french-bulldog.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: An adorable French Bulldog sitting on a designer sofa in a modern apartment, bat ears perked up, curious expression. Soft natural window light. Professional pet portrait photography.' },
  { id: 'pet-german-shepherd', filename: 'german-shepherd.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: A noble German Shepherd standing alert in a grand estate garden, intelligent eyes focused. Athletic build and proud stance. Professional pet portrait photography with warm lighting.' },
  { id: 'pet-husky', filename: 'husky.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: A stunning Siberian Husky with piercing blue eyes, sitting in a snowy landscape. Thick fluffy coat and wolf-like appearance. Professional outdoor pet photography.' },
  { id: 'pet-persian', filename: 'persian-cat.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: An elegant white Persian cat resting on a velvet cushion in a luxurious interior. Long flowing fur and regal expression. Soft warm lighting. Professional pet portrait photography.' },
  { id: 'pet-bengal', filename: 'bengal-cat.png', subcategory: 'pets',
    prompt: 'Photorealistic animal portrait: A striking Bengal cat with vivid leopard-like markings, perched on a modern cat tree. Alert, exotic appearance with bright green eyes. Professional pet portrait photography.' },
  { id: 'pet-thoroughbred', filename: 'thoroughbred.png', subcategory: 'pets',
    prompt: 'Photorealistic equine photography: A magnificent Thoroughbred horse galloping through a green paddock, mane flowing in the wind. Muscular athletic build, racing pedigree evident. Professional equestrian photography, golden hour.' },
  { id: 'pet-arabian', filename: 'arabian-horse.png', subcategory: 'pets',
    prompt: 'Photorealistic equine photography: A graceful Arabian horse with dished face and high-set tail, standing proudly in a desert landscape at sunset. Elegant and refined. Professional equestrian photography.' },
  { id: 'pet-parrot', filename: 'macaw-parrot.png', subcategory: 'pets',
    prompt: 'Photorealistic bird photography: A vibrant Scarlet Macaw with brilliant red, yellow, and blue plumage, perched on a branch in a tropical conservatory. Stunning colors and intelligent eyes. Professional wildlife portrait.' },
  { id: 'pet-aquarium', filename: 'reef-aquarium.png', subcategory: 'pets',
    prompt: 'Photorealistic aquarium photography: A stunning saltwater reef aquarium with colorful coral, tropical fish, and blue LED lighting. Built into a luxury living room wall. Vibrant marine life. Professional interior and aquarium photography.' },
  { id: 'pet-iguana', filename: 'blue-iguana.png', subcategory: 'pets',
    prompt: 'Photorealistic reptile photography: A rare Blue Iguana with vivid blue-green scales, basking on a rock in a custom terrarium. Exotic and prehistoric appearance. Professional wildlife portrait photography.' },
]

// ============================================================
// EXPERIENCES
// ============================================================

const EXPERIENCE_IMAGES: LifestyleImageDef[] = [
  { id: 'exp-resort', filename: 'luxury-resort.png', subcategory: 'experiences',
    prompt: 'Photorealistic travel photography: An overwater bungalow at a Maldives luxury resort, turquoise lagoon visible through the glass floor. Infinity pool on the deck. Tropical paradise at its finest. Professional destination photography.' },
  { id: 'exp-villa', filename: 'private-villa.png', subcategory: 'experiences',
    prompt: 'Photorealistic travel photography: A private Mediterranean villa terrace overlooking the Amalfi Coast at sunset. Table set for dinner with wine, candles flickering. The epitome of luxury travel. Professional lifestyle photography.' },
  { id: 'exp-safari', filename: 'luxury-safari.png', subcategory: 'experiences',
    prompt: 'Photorealistic safari photography: A luxury safari lodge in the African savanna, open-sided dining area overlooking elephants at a watering hole at sunset. Wild luxury. Professional travel photography.' },
  { id: 'exp-ski', filename: 'ski-experience.png', subcategory: 'experiences',
    prompt: 'Photorealistic winter sports photography: A luxury ski chalet terrace in the Swiss Alps with fresh powder snow, mountains in background, hot tub steaming in the cold air. Cozy après-ski atmosphere. Professional travel photography.' },
  { id: 'exp-private-jet', filename: 'private-jet-weekend.png', subcategory: 'experiences',
    prompt: 'Photorealistic aviation photography: A sleek Gulfstream private jet on the tarmac with red carpet rolled out, luggage being loaded by uniformed crew, modern FBO terminal in background. Clear blue sky. Professional lifestyle photography.' },
  { id: 'exp-yacht', filename: 'yacht-charter.png', subcategory: 'experiences',
    prompt: 'Photorealistic yacht photography: A sleek luxury yacht anchored in a crystal-clear Mediterranean cove. Sun deck with loungers, tender boat alongside. Azure waters and rocky coastline. Professional marine photography.' },
  { id: 'exp-superyacht', filename: 'superyacht.png', subcategory: 'experiences',
    prompt: 'Photorealistic superyacht photography: A massive 80-meter superyacht with helipad and swimming pool on deck, cruising through tropical waters at sunset. The ultimate in floating luxury. Cinematic aerial-style shot.' },
  { id: 'exp-f1-paddock', filename: 'f1-paddock.png', subcategory: 'experiences',
    prompt: 'Photorealistic event photography: VIP hospitality at a Formula 1 Grand Prix, champagne and fine dining with a view of the track from the paddock club. Team personnel and exotic cars visible. Exclusive motorsport experience.' },
  { id: 'exp-superbowl', filename: 'superbowl-vip.png', subcategory: 'experiences',
    prompt: 'Photorealistic event photography: A premium VIP stadium suite with plush leather seats, massive window overlooking a packed football stadium, champagne and gourmet catering spread. Big game atmosphere. Professional event photography.' },
  { id: 'exp-gala', filename: 'charity-gala.png', subcategory: 'experiences',
    prompt: 'Photorealistic event photography: A glamorous black-tie charity gala in a grand ballroom, crystal chandeliers overhead, elegantly dressed guests at round tables. Sparkle and sophistication. Professional event photography.' },
  { id: 'exp-art-basel', filename: 'art-basel-vip.png', subcategory: 'experiences',
    prompt: 'Photorealistic art event photography: VIP preview at Art Basel, collectors and gallery owners viewing massive contemporary art installations in a pristine white exhibition hall. Exclusive cultural event. Professional photography.' },
  { id: 'exp-everest', filename: 'everest-luxury-trek.png', subcategory: 'experiences',
    prompt: 'Photorealistic adventure photography: Luxury glamping tents at Everest Base Camp with dramatic Himalayan peaks in background, a helicopter on a nearby landing pad. The ultimate high-altitude adventure. Professional outdoor photography.' },
  { id: 'exp-space', filename: 'space-tourism.png', subcategory: 'experiences',
    prompt: 'Photorealistic space photography: A view from the window of a space tourism capsule showing Earth\'s curvature and the thin blue atmosphere against the blackness of space. Stars visible. The ultimate adventure. Cinematic photography.' },
]

// ============================================================
// MEMBERSHIPS
// ============================================================

const MEMBERSHIP_IMAGES: LifestyleImageDef[] = [
  // Country Clubs (3 tiers)
  { id: 'mem-country-club', filename: 'country-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic architectural photography: The elegant clubhouse of a regional country club at golden hour. Manicured golf course visible in background, members walking with golf bags. Classic sophistication. Professional real estate photography.' },
  { id: 'mem-country-club-premium', filename: 'country-club-premium.png', subcategory: 'memberships',
    prompt: 'Photorealistic architectural photography: A prestigious championship golf course with grand Tudor-style clubhouse, immaculate fairways, fountains, and luxury cars in the car park. Exclusive atmosphere. Professional real estate photography.' },
  { id: 'mem-country-club-elite', filename: 'country-club-elite.png', subcategory: 'memberships',
    prompt: 'Photorealistic architectural photography: An ultra-exclusive world-class country club entrance with gold-accented gates, security booth, supercars in the valet area, and Mediterranean-style clubhouse. Monaco/NYC caliber. Professional photography.' },
  // Yacht Clubs (2 tiers)
  { id: 'mem-yacht-club', filename: 'yacht-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic architectural photography: A local yacht club marina at sunset, sailboats and small yachts moored, the classic white clubhouse with blue awnings. Casual maritime elegance. Professional architectural photography.' },
  { id: 'mem-yacht-club-monaco', filename: 'yacht-club-monaco.png', subcategory: 'memberships',
    prompt: 'Photorealistic architectural photography: The iconic modern Yacht Club de Monaco building with superyachts moored in the harbour, Monte Carlo skyline behind. The pinnacle of maritime prestige. Professional architectural photography.' },
  // Private Gym (2 tiers)
  { id: 'mem-private-gym', filename: 'private-gym.png', subcategory: 'memberships',
    prompt: 'Photorealistic interior photography: An exclusive private fitness club with state-of-the-art equipment, floor-to-ceiling windows, warm wood and stone finishes. Empty and pristine. Professional interior photography.' },
  { id: 'mem-private-gym-ultra', filename: 'private-gym-ultra.png', subcategory: 'memberships',
    prompt: 'Photorealistic interior photography: An ultra-private health club with marble lobby, individual training suites, medical equipment visible, cryotherapy pods, and a rooftop relaxation pool. Exclusive wellness facility. Professional photography.' },
  // Aviation
  { id: 'mem-aviation', filename: 'aviation-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic aviation photography: A sleek private jet on a tarmac with red carpet and a modern FBO terminal in background. The prestige of private aviation. Professional lifestyle photography, blue sky.' },
  // Concierge (2 tiers)
  { id: 'mem-concierge', filename: 'concierge-premium.png', subcategory: 'memberships',
    prompt: 'Photorealistic interior photography: A premium concierge service office with world map display, multiple screens showing travel and dining options, elegant leather desk and phone. Seamless lifestyle management. Professional photography.' },
  { id: 'mem-concierge-ultra', filename: 'concierge-ultra.png', subcategory: 'memberships',
    prompt: 'Photorealistic interior photography: An ultra-premium lifestyle management family office with multiple staff at workstations, wall of screens tracking property, travel, and investments. Command center for luxury living. Professional photography.' },
  // Wine Club
  { id: 'mem-wine-club', filename: 'wine-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic wine photography: An exclusive wine cellar club with arched stone ceilings, wooden wine racks floor to ceiling, tasting table with decanters. Warm candlelit atmosphere. Professional interior photography.' },
  // Car Club
  { id: 'mem-car-club', filename: 'car-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic automotive photography: Inside an exclusive supercar owners club garage, rows of exotic cars under LED lighting, with a lounge area visible. Enthusiast paradise. Professional automotive and interior photography.' },
  // Social Club
  { id: 'mem-social-club', filename: 'social-club.png', subcategory: 'memberships',
    prompt: 'Photorealistic interior photography: A stylish members-only social club with leather furniture, book-lined walls, cocktail bar, and ambient lighting. Soho House aesthetic. Professional interior photography with warm tones.' },
]

// ============================================================
// FURNISHING CATEGORIES (thumbnails, not per-item)
// ============================================================

const FURNISHING_IMAGES: LifestyleImageDef[] = [
  // === LIVING ROOM (3 tiers) ===
  { id: 'furn-living-standard', filename: 'living-room-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A comfortable modern living room with a fabric sofa, IKEA-style shelving, a 55-inch TV on a media unit, and simple decor. Clean and functional apartment living. Professional real estate photography.' },
  { id: 'furn-living-premium', filename: 'living-room-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A designer living room with Italian leather sectional, walnut coffee table, curated art on walls, soft rug, and designer lighting. Upscale and tasteful. Professional interior photography.' },
  { id: 'furn-living-luxury', filename: 'living-room-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An ultra-luxury penthouse living room with bespoke furniture, museum-quality art, crystal chandelier, floor-to-ceiling windows showing city skyline. Haute design. Professional architectural photography.' },
  // === DINING ROOM (3 tiers) ===
  { id: 'furn-dining-standard', filename: 'dining-room-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A standard dining area with a wooden table for 6, simple chairs, pendant light fixture, and sideboard. Clean, practical dining space. Professional real estate photography.' },
  { id: 'furn-dining-premium', filename: 'dining-room-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An elegant dining room with upholstered chairs around a marble-topped table for 8, modern chandelier, wine cabinet, and textured wallpaper. Stylish entertaining space. Professional interior photography.' },
  { id: 'furn-dining-luxury', filename: 'dining-room-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A grand formal dining room with a 12-seat mahogany table, crystal chandelier, silver candelabras, oil paintings, and butler station. Black-tie dinner setting. Professional photography.' },
  // === BEDROOM (3 tiers) ===
  { id: 'furn-bedroom-standard', filename: 'bedroom-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A cozy standard bedroom with queen bed, cotton bedding, bedside tables, and a wardrobe. Clean and comfortable. Natural light from window. Professional real estate photography.' },
  { id: 'furn-bedroom-premium', filename: 'bedroom-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A stylish master bedroom with king bed, premium linen bedding, designer headboard, ambient lighting, and walk-in closet visible. Hotel-quality comfort. Professional interior photography.' },
  { id: 'furn-bedroom-luxury', filename: 'bedroom-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An extravagant master suite with emperor bed, silk sheets, automated curtains, marble en-suite visible, sitting area, and panoramic windows. Pure opulence. Professional architectural photography.' },
  // === KITCHEN (3 tiers) ===
  { id: 'furn-kitchen-standard', filename: 'kitchen-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A modern standard kitchen with clean white cabinets, stainless steel appliances, laminate countertop, and a breakfast bar. Functional and bright. Professional real estate photography.' },
  { id: 'furn-kitchen-premium', filename: 'kitchen-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A premium kitchen with quartz countertops, high-end range cooker, wine fridge, pendant lights over island, and hardwood floors. Professional chef hobby space. Interior photography.' },
  { id: 'furn-kitchen-luxury', filename: 'kitchen-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A professional-grade luxury kitchen with marble island, La Cornue range, Sub-Zero fridge, copper pots, and butler\'s pantry. A Michelin chef\'s dream. Professional photography.' },
  // === HOME OFFICE (3 tiers) ===
  { id: 'furn-office-standard', filename: 'home-office-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A functional home office with IKEA-style desk, ergonomic chair, dual monitors, and a bookshelf. Clean and productive workspace. Natural light. Professional real estate photography.' },
  { id: 'furn-office-premium', filename: 'home-office-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A sophisticated home office with walnut executive desk, leather Eames chair, built-in shelving, designer lamp, and triple monitors. Professional and stylish. Interior photography.' },
  { id: 'furn-office-luxury', filename: 'home-office-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A lavish private study with hand-carved desk, Chesterfield chair, floor-to-ceiling library walls, antique globe, and panoramic city view. Boardroom-quality workspace at home. Professional photography.' },
  // === OUTDOOR SPACE (3 tiers) ===
  { id: 'furn-outdoor-standard', filename: 'outdoor-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: A standard apartment balcony or small patio with bistro table and chairs, potted plants, and string lights. Cozy urban outdoor space. Professional real estate photography.' },
  { id: 'furn-outdoor-premium', filename: 'outdoor-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: A beautiful garden terrace with designer outdoor sofa, fire pit table, landscaping, and BBQ area. Twilight with ambient lighting. Suburban luxury. Professional real estate photography.' },
  { id: 'furn-outdoor-luxury', filename: 'outdoor-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: An estate-level outdoor living space with covered pavilion, outdoor kitchen, infinity pool edge visible, tropical landscaping, and ocean view. Resort living at home. Professional photography.' },
  // === HOME THEATER (3 tiers) ===
  { id: 'furn-theater-standard', filename: 'home-theater-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A basement media room with a 75-inch TV, surround sound speakers, comfortable reclining sofa, and dark walls. Movie night setup. Professional real estate photography.' },
  { id: 'furn-theater-premium', filename: 'home-theater-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A dedicated home cinema with projector and 120-inch screen, tiered seating for 6, acoustic panels, popcorn machine, and movie poster art. Enthusiast-grade. Professional interior photography.' },
  { id: 'furn-theater-luxury', filename: 'home-theater-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An IMAX-quality home theater with 4K laser projector, Dolby Atmos, leather power recliners for 12, starfield ceiling, and integrated bar. Commercial cinema quality at home. Professional photography.' },
  // === WINE CELLAR (3 tiers) ===
  { id: 'furn-wine-cellar-standard', filename: 'wine-cellar-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A small wine storage room or closet conversion with wooden racks holding 100 bottles, temperature display, and a small tasting shelf. Starter wine collection. Professional photography.' },
  { id: 'furn-wine-cellar-premium', filename: 'wine-cellar-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A custom wine cellar with glass walls, 500-bottle capacity, proper climate control visible, tasting table for 4, and ambient lighting. Serious collector space. Professional interior photography.' },
  { id: 'furn-wine-cellar-luxury', filename: 'wine-cellar-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A sprawling underground wine vault with stone archways, 2000+ bottles, antique tasting table, crystal decanters, and candlelit atmosphere. Museum-quality cellar. Professional photography.' },
  // === HOME GYM (3 tiers) ===
  { id: 'furn-gym-standard', filename: 'home-gym-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A spare room converted to a home gym with a rack of dumbbells, exercise bike, yoga mat, and wall mirror. Functional fitness space. Professional real estate photography.' },
  { id: 'furn-gym-premium', filename: 'home-gym-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A dedicated home gym with power rack, cable machine, treadmill, rubber flooring, mirrors, and garden view windows. Proper training facility. Professional interior photography.' },
  { id: 'furn-gym-luxury', filename: 'home-gym-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An elite home training facility with Technogym equipment, boxing ring corner, sauna door visible, recovery pods, and floor-to-ceiling windows. Professional athlete quality. Professional photography.' },
  // === POOL & SPA (3 tiers) ===
  { id: 'furn-pool-standard', filename: 'pool-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: A standard backyard swimming pool with concrete deck, basic loungers, and pool fence. Family-friendly outdoor pool. Bright sunny day. Professional real estate photography.' },
  { id: 'furn-pool-premium', filename: 'pool-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: A premium pool with spa jets, stone waterfall feature, built-in hot tub, designer loungers, and landscaped surroundings. Resort-inspired backyard. Professional real estate photography.' },
  { id: 'furn-pool-luxury', filename: 'pool-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic exterior photography: A stunning infinity pool with glass edge overlooking a valley, heated spa, underwater LED lighting, pool house, and tropical landscaping. Five-star resort at home. Professional photography.' },
  // === SMART HOME (3 tiers) ===
  { id: 'furn-smart-standard', filename: 'smart-home-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A home with smart speaker, smart lights, video doorbell, and phone showing a basic home automation app. Modern connected living basics. Professional technology photography.' },
  { id: 'furn-smart-premium', filename: 'smart-home-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A tablet wall-mounted control panel showing whole-home automation - lighting scenes, climate zones, security cameras, and motorized blinds. Integrated smart living. Professional photography.' },
  { id: 'furn-smart-luxury', filename: 'smart-home-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A home automation command center with multiple displays showing every system - biometric entry, EV charging, solar panels, AI assistant, and whole-estate surveillance. Cutting-edge technology. Professional photography.' },
  // === BATHROOM (3 tiers) ===
  { id: 'furn-bathroom-standard', filename: 'bathroom-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A clean standard bathroom with walk-in shower, vanity unit, large mirror, and white tiles. Modern and functional. Professional real estate photography.' },
  { id: 'furn-bathroom-premium', filename: 'bathroom-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A premium bathroom with freestanding bathtub, rainfall shower, marble tiles, heated floors, and designer fixtures. Spa-like atmosphere. Professional interior photography.' },
  { id: 'furn-bathroom-luxury', filename: 'bathroom-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: An extraordinary master bathroom with onyx walls, Japanese soaking tub, steam room glass door, gold fixtures, and chandelier. A palatial bathing suite. Professional photography.' },
  // === GARAGE (3 tiers) ===
  { id: 'furn-garage-standard', filename: 'garage-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A clean 2-car garage with epoxy floor, wall-mounted tool storage, workbench, and proper lighting. Organized functional space. Professional real estate photography.' },
  { id: 'furn-garage-premium', filename: 'garage-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A premium 4-car garage with polished checkered floor, car lift, display lighting, and lounge area with mini-fridge. Enthusiast car storage. Professional interior photography.' },
  { id: 'furn-garage-luxury', filename: 'garage-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic interior photography: A climate-controlled 8-car showroom garage with turntable display, LED accent lighting, glass viewing wall, and hospitality bar. Collector\'s dream automotive gallery. Professional photography.' },
  // === SECURITY SYSTEM (3 tiers) ===
  { id: 'furn-security-standard', filename: 'security-standard.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A home security panel on a wall showing armed status, with CCTV camera and motion sensor visible. Basic home protection system. Professional technology photography.' },
  { id: 'furn-security-premium', filename: 'security-premium.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A comprehensive home security setup with multiple CCTV views on a monitor, biometric door lock, alarm panel, and perimeter sensors visible. Advanced protection. Professional technology photography.' },
  { id: 'furn-security-luxury', filename: 'security-luxury.png', subcategory: 'furnishings',
    prompt: 'Photorealistic technology photography: A professional security control room with wall of CCTV screens covering an entire estate, facial recognition displays, safe room door visible, and communication equipment. Military-grade home security. Professional photography.' },
]

// ============================================================
// HOBBIES
// ============================================================

const HOBBY_IMAGES: LifestyleImageDef[] = [
  // Golf (3 levels)
  { id: 'hobby-golf-beginner', filename: 'golf-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sports photography: A beginner golfer at a public driving range, practicing swing with basic clubs, instructor nearby. Casual polo and khakis. Bright daylight, green grass. Professional lifestyle photography.' },
  { id: 'hobby-golf-intermediate', filename: 'golf-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sports photography: A golfer teeing off at a beautiful private golf course at golden hour. Premium club set, glove, and focused stance. Fairway stretching into distance with mountains. Professional sports photography.' },
  { id: 'hobby-golf-advanced', filename: 'golf-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sports photography: A golfer competing in a prestigious amateur tournament at Augusta-style course. Caddy alongside, gallery visible, pristine championship conditions. Pin-seeking iron shot. Professional sports photography.' },
  // Yachting (3 levels)
  { id: 'hobby-yachting-beginner', filename: 'yachting-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sailing photography: A beginner sailor on a small dinghy or day-sailer in calm harbor waters, learning the ropes, life jacket on. Bright sunny day, marina background. Professional marine photography.' },
  { id: 'hobby-yachting-intermediate', filename: 'yachting-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sailing photography: A sleek racing yacht under full sail, heeled over in strong wind with spray flying. Blue ocean and white sails against dramatic sky. Experienced sailor at the helm. Professional marine photography.' },
  { id: 'hobby-yachting-advanced', filename: 'yachting-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic sailing photography: A massive luxury superyacht racing in an offshore regatta, professional crew working sails, sponsor logos visible, helicopter overhead capturing the event. Elite competitive sailing. Professional photography.' },
  // Car Collecting (3 levels)
  { id: 'hobby-car-collecting-beginner', filename: 'car-collecting-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic automotive photography: A first classic car purchase — a vintage sports car in a modest home garage, owner polishing it with pride, basic tools on pegboard. The start of a collection. Professional lifestyle photography.' },
  { id: 'hobby-car-collecting-intermediate', filename: 'car-collecting-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic automotive photography: A curated collection of 5-6 classic and sports cars in a clean, well-lit private garage with checkered floor. Car covers partially pulled back, detail supplies visible. Growing collection. Professional photography.' },
  { id: 'hobby-car-collecting-advanced', filename: 'car-collecting-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic automotive photography: A museum-quality car collection with 15+ rare vehicles on turntable displays, climate-controlled showroom, velvet ropes, and information plaques. Concours-winning collector\'s gallery. Professional photography.' },
  // Horse Racing (3 levels)
  { id: 'hobby-horse-racing-beginner', filename: 'horse-racing-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic equestrian photography: A newcomer at a local racing stable, meeting their first racehorse in a paddock, trainer showing the basics. Casual riding gear, stables in background. Professional lifestyle photography.' },
  { id: 'hobby-horse-racing-intermediate', filename: 'horse-racing-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic equestrian photography: A horse owner watching their horse train on a professional track at dawn, jockey in racing silks, stopwatch in hand, trainer discussing form. Serious racing operation. Professional photography.' },
  { id: 'hobby-horse-racing-advanced', filename: 'horse-racing-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic equestrian photography: A prestigious horse racing event like Royal Ascot, owner in the winner\'s enclosure with a champion racehorse, trophy presentation, press photographers and crowds. Elite ownership. Professional photography.' },
  // Art Collecting (3 levels)
  { id: 'hobby-art-collecting-beginner', filename: 'art-collecting-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic photography: A person browsing a local art gallery opening, examining emerging artist paintings, wine glass in hand, simple gallery space. First steps into collecting. Professional lifestyle photography.' },
  { id: 'hobby-art-collecting-intermediate', filename: 'art-collecting-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic interior photography: A well-curated private art collection displayed on living room walls with professional lighting, mix of contemporary prints and original works. Educated collector\'s home. Professional photography.' },
  { id: 'hobby-art-collecting-advanced', filename: 'art-collecting-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic photography: A private art gallery within a home, museum-quality lighting and climate control, major contemporary works, a private viewing event with dealers and critics. World-class collection. Professional photography.' },
  // Wine Collecting (3 levels)
  { id: 'hobby-wine-collecting-beginner', filename: 'wine-collecting-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic photography: A wine enthusiast at a tasting event, swirling a glass, small personal wine rack with 20 bottles at home visible. Learning about regions and vintages. Professional lifestyle photography.' },
  { id: 'hobby-wine-collecting-intermediate', filename: 'wine-collecting-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic photography: A dedicated wine room with 200+ bottles organized by region, tasting notes on the desk, proper temperature-controlled storage, and a decanting station. Serious collector. Professional interior photography.' },
  { id: 'hobby-wine-collecting-advanced', filename: 'wine-collecting-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic photography: A world-class wine cellar with thousands of bottles including Romanée-Conti and Petrus, auction house catalog on the table, sommelier leading a private tasting. Master collector. Professional photography.' },
  // Flying (3 levels)
  { id: 'hobby-flying-beginner', filename: 'flying-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic aviation photography: A student pilot in a Cessna 172 cockpit doing a pre-flight check with instructor, small airfield visible. Logbook and headset on the seat. Learning to fly. Professional aviation photography.' },
  { id: 'hobby-flying-intermediate', filename: 'flying-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic aviation photography: A single-engine airplane flying above clouds at sunset, golden light on the wings. Confident pilot in cockpit with instrument rating visible on dashboard. Freedom and adventure. Professional aerial photography.' },
  { id: 'hobby-flying-advanced', filename: 'flying-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic aviation photography: A sleek twin-engine turboprop or light jet on a private apron, owner-pilot doing walkaround, logbook showing 1000+ hours. The ultimate personal aircraft. Professional aviation photography.' },
  // Fishing (3 levels)
  { id: 'hobby-fishing-beginner', filename: 'fishing-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic outdoor photography: A relaxed angler fishing from a lakeside dock with basic rod and tackle box, peaceful surroundings, camp chair and thermos nearby. Casual recreational fishing. Professional lifestyle photography.' },
  { id: 'hobby-fishing-intermediate', filename: 'fishing-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic outdoor photography: A fisherman on a center-console boat in open water, fighting a large fish with quality rod and reel, GPS fishfinder visible. Serious sport fishing. Professional marine photography.' },
  { id: 'hobby-fishing-advanced', filename: 'fishing-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic outdoor photography: A deep-sea fishing charter with fighting chair, multiple tournament-grade rods, massive marlin on the line, crew assisting. Big-game fishing adventure on a luxury sportfisher. Professional photography.' },
  // Photography (3 levels)
  { id: 'hobby-photography-beginner', filename: 'photography-beginner.png', subcategory: 'hobbies',
    prompt: 'Photorealistic lifestyle photography: A beginner photographer with an entry-level DSLR exploring a city street, experimenting with angles and composition. Simple camera bag and basic lens. Learning the craft. Professional photography.' },
  { id: 'hobby-photography-intermediate', filename: 'photography-intermediate.png', subcategory: 'hobbies',
    prompt: 'Photorealistic lifestyle photography: A photographer with professional camera and multiple lenses shooting a dramatic landscape at golden hour. Tripod setup, filter kit visible. Dedicated hobbyist. Professional photography.' },
  { id: 'hobby-photography-advanced', filename: 'photography-advanced.png', subcategory: 'hobbies',
    prompt: 'Photorealistic lifestyle photography: A professional-grade photography studio with medium-format camera, studio lighting setup, large prints on walls from exhibitions, editing suite visible. Master photographer\'s workspace. Professional photography.' },
  // Sim Racing & Cooking & Music kept as single but included for completeness
  { id: 'hobby-sim-racing', filename: 'sim-racing.png', subcategory: 'hobbies',
    prompt: 'Photorealistic gaming photography: A premium sim racing rig with direct drive wheel, triple monitors showing a racing game. Dark room with RGB accents. The ultimate home racing setup. Professional gaming photography.' },
  { id: 'hobby-fitness', filename: 'fitness.png', subcategory: 'hobbies',
    prompt: 'Photorealistic fitness photography: An athlete doing strength training in a premium gym, dynamic action shot with dramatic lighting. Focus and determination captured. Professional sports photography.' },
  { id: 'hobby-cooking', filename: 'cooking.png', subcategory: 'hobbies',
    prompt: 'Photorealistic culinary photography: A person preparing gourmet food in a professional kitchen, flame dancing from a pan, fresh ingredients arranged beautifully. The passion of cooking. Professional food photography.' },
  { id: 'hobby-music', filename: 'music.png', subcategory: 'hobbies',
    prompt: 'Photorealistic music photography: A beautiful grand piano in an elegant room with warm lighting, sheet music open. The instrument gleams under soft spotlight. Artistic atmosphere. Professional interior and music photography.' },
  { id: 'hobby-art', filename: 'art.png', subcategory: 'hobbies',
    prompt: 'Photorealistic art photography: An artist\'s studio with easel, paints, and a work in progress. Natural light flooding through large windows. Creative chaos and inspiration. Professional documentary photography.' },
  { id: 'hobby-charity', filename: 'charity-work.png', subcategory: 'hobbies',
    prompt: 'Photorealistic event photography: A charity fundraising event with volunteers and beneficiaries, warm smiles and community spirit. Well-organized event space with banners. Professional event photography, warm tones.' },
]

// ============================================================
// DIET PLANS
// ============================================================

const DIET_IMAGES: LifestyleImageDef[] = [
  { id: 'diet-standard', filename: 'balanced-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food photography: A beautifully arranged balanced meal on a ceramic plate - grilled protein, colorful vegetables, and whole grains. Clean, healthy eating. Professional food photography on a marble countertop.' },
  { id: 'diet-athletic', filename: 'athletic-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food photography: A high-protein athlete\'s meal with grilled chicken, quinoa, green vegetables and protein shake nearby. Macro-counted perfection. Professional sports nutrition photography.' },
  { id: 'diet-organic', filename: 'organic-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food photography: A farm-to-table organic meal with vibrant fresh vegetables, herbs, and whole foods beautifully arranged on a rustic wooden table. Natural and wholesome. Professional food photography.' },
  { id: 'diet-gourmet', filename: 'gourmet-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food photography: A Michelin-star quality plated dish with artistic presentation, micro herbs, and sauce art. Fine dining nutrition by a private chef. Professional haute cuisine photography.' },
  { id: 'diet-personalized', filename: 'personalized-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food and science photography: A precisely measured meal next to a DNA helix diagram and nutritional data tablet. Personalized genomic nutrition. Professional conceptual food photography.' },
  { id: 'diet-elite', filename: 'elite-diet.png', subcategory: 'diet',
    prompt: 'Photorealistic food photography: An elite athlete\'s complete meal prep station with perfectly portioned containers, supplements, and nutritional charts. Performance optimized nutrition. Professional food and lifestyle photography.' },
]

// ============================================================
// COURSES (EDUCATION)
// ============================================================

const COURSE_IMAGES: LifestyleImageDef[] = [
  { id: 'course-mba', filename: 'executive-mba.png', subcategory: 'courses',
    prompt: 'Photorealistic education photography: The prestigious courtyard of a world-renowned business school with modern and classical architecture. Students and professionals walking purposefully. Professional architectural photography.' },
  { id: 'course-strategy', filename: 'business-strategy.png', subcategory: 'courses',
    prompt: 'Photorealistic business photography: A strategic planning session in a modern boardroom, charts and data on screens, world map on wall. Professional corporate environment. Clean professional photography.' },
  { id: 'course-finance', filename: 'investment-management.png', subcategory: 'courses',
    prompt: 'Photorealistic finance photography: A professional investment desk with multiple monitors showing market data, charts, and financial analysis. The world of high finance. Professional corporate photography.' },
  { id: 'course-motorsport-eng', filename: 'motorsport-engineering.png', subcategory: 'courses',
    prompt: 'Photorealistic motorsport photography: Inside a racing team engineering workshop, CFD analysis on screens, carbon fiber parts on benches, and a race car visible. The science behind speed. Professional industrial photography.' },
  { id: 'course-leadership', filename: 'executive-leadership.png', subcategory: 'courses',
    prompt: 'Photorealistic business photography: A confident leader presenting to a small group of executives in a premium conference room. Glass walls, city views, modern furnishings. Professional corporate photography.' },
  { id: 'course-public-speaking', filename: 'public-speaking.png', subcategory: 'courses',
    prompt: 'Photorealistic event photography: A speaker on stage at a TED-style event, dramatic single spotlight, audience in silhouette. The power of communication. Professional event photography.' },
  { id: 'course-ai', filename: 'ai-machine-learning.png', subcategory: 'courses',
    prompt: 'Photorealistic technology photography: A modern tech lab with AI visualizations on large screens, neural network diagrams, and data flowing. Futuristic and cutting-edge. Professional technology photography with blue tones.' },
  { id: 'course-law', filename: 'business-law.png', subcategory: 'courses',
    prompt: 'Photorealistic legal photography: An impressive law library with floor-to-ceiling bookshelves of legal volumes, reading desks, and warm wood paneling. Tradition and authority. Professional architectural interior photography.' },
]

// ============================================================
// SERVICES
// ============================================================

const SERVICE_IMAGES: LifestyleImageDef[] = [
  // Spa & Wellness (3 tiers)
  { id: 'service-spa-basic', filename: 'spa-wellness-basic.png', subcategory: 'services',
    prompt: 'Photorealistic spa photography: A monthly day-spa treatment room with massage table, candles, and soft music. Clean and relaxing local spa environment. Professional wellness photography.' },
  { id: 'service-spa-premium', filename: 'spa-wellness-premium.png', subcategory: 'services',
    prompt: 'Photorealistic spa photography: A luxury weekly spa treatment with hot stones, aromatherapy diffuser, private treatment suite with dim warm lighting and orchids. Premium wellness experience. Professional photography.' },
  { id: 'service-spa-elite', filename: 'spa-wellness-elite.png', subcategory: 'services',
    prompt: 'Photorealistic spa photography: An in-home private wellness suite with professional-grade treatment bed, infrared sauna, cryotherapy chamber, and a dedicated wellness therapist. Elite holistic health. Professional photography.' },
  // Travel Concierge (2 tiers)
  { id: 'service-travel', filename: 'travel-concierge.png', subcategory: 'services',
    prompt: 'Photorealistic travel photography: A passport, premium luggage, and travel documents arranged on a luxury hotel bed with a first-class boarding pass visible. Seamless travel experience. Professional lifestyle photography.' },
  { id: 'service-travel-ultra', filename: 'travel-concierge-ultra.png', subcategory: 'services',
    prompt: 'Photorealistic travel photography: A private jet interior with leather seats, personal butler, luggage monogrammed, and a global itinerary displayed on tablet. Ultimate bespoke travel management. Professional lifestyle photography.' },
  // Personal Stylist (2 tiers)
  { id: 'service-stylist', filename: 'personal-stylist.png', subcategory: 'services',
    prompt: 'Photorealistic fashion photography: A personal stylist reviewing outfits on a rail in a well-lit dressing room, fabric swatches and lookbook visible. Curated wardrobe management. Professional fashion photography.' },
  { id: 'service-stylist-haute', filename: 'personal-stylist-haute.png', subcategory: 'services',
    prompt: 'Photorealistic fashion photography: A haute couture fitting session with multiple designer garment bags, a tailor making adjustments, and a Paris fashion week invitation on the vanity. Bespoke luxury fashion. Professional photography.' },
  // Security (2 tiers)
  { id: 'service-security', filename: 'personal-security.png', subcategory: 'services',
    prompt: 'Photorealistic security photography: A professional close protection specialist in a dark suit with earpiece, scanning an upscale event venue. Vigilant and composed. Professional documentary photography.' },
  { id: 'service-security-team', filename: 'personal-security-team.png', subcategory: 'services',
    prompt: 'Photorealistic security photography: A full executive protection detail with armored SUV convoy, multiple agents in formation, advance team visible. State-level personal security. Professional documentary photography.' },
  // Medical (2 tiers)
  { id: 'service-medical', filename: 'concierge-medicine.png', subcategory: 'services',
    prompt: 'Photorealistic medical photography: A premium concierge medicine office with modern examination equipment, comfortable patient area, and warm design. Medical excellence meets comfort. Professional healthcare photography.' },
  { id: 'service-medical-elite', filename: 'concierge-medicine-elite.png', subcategory: 'services',
    prompt: 'Photorealistic medical photography: A private medical suite with advanced diagnostic imaging equipment, personal physician consultation area, and immediate lab facilities. Hospital-grade care at home. Professional photography.' },
  // Chef (2 tiers)
  { id: 'service-chef', filename: 'private-chef.png', subcategory: 'services',
    prompt: 'Photorealistic culinary photography: A personal chef preparing a gourmet multi-course meal in a luxury home kitchen, fresh ingredients beautifully arranged, professional knives and tools visible. Professional food photography.' },
  { id: 'service-chef-team', filename: 'private-chef-team.png', subcategory: 'services',
    prompt: 'Photorealistic culinary photography: A full catering team of chefs in whites preparing an elaborate banquet in a professional estate kitchen, silver service visible, sommelier decanting wine. Estate-level dining. Professional photography.' },
  // Housekeeper (2 tiers)
  { id: 'service-housekeeper', filename: 'housekeeper.png', subcategory: 'services',
    prompt: 'Photorealistic interior photography: A spotlessly clean luxury home interior with professional cleaning supplies neatly organized, fresh flowers arranged, and pristine surfaces reflecting light. Professional housekeeping. Professional photography.' },
  { id: 'service-estate-manager', filename: 'estate-manager.png', subcategory: 'services',
    prompt: 'Photorealistic interior photography: A grand estate with uniformed staff visible, butler\'s pantry, formal arrangements, and a clipboard with daily schedule. Full estate management operations. Professional documentary photography.' },
]

// ============================================================
// WARDROBE (selected representative items)
// ============================================================

const WARDROBE_IMAGES: LifestyleImageDef[] = [
  // Casual (2 tiers)
  { id: 'ward-casual', filename: 'casual-wear.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: Everyday casual basics displayed flat - clean t-shirt, jeans, and white sneakers. Simple, neat wardrobe essentials. Professional fashion product photography on neutral background.' },
  { id: 'ward-casual-designer', filename: 'casual-designer.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: Designer casual wear displayed on mannequin - Brunello Cucinelli cashmere sweater, premium selvedge denim, and luxury sneakers with visible brand details. Elevated everyday style. Professional photography.' },
  // Business Suits (3 tiers)
  { id: 'ward-suit', filename: 'business-suit.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A well-fitted off-the-rack navy business suit on a mannequin with white shirt and silk tie. Smart and professional. Professional menswear product photography.' },
  { id: 'ward-suit-bespoke', filename: 'bespoke-suit.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A bespoke Savile Row suit being fitted, tailor\'s chalk marks visible, hand-stitched buttonholes, working cuff buttons, and premium cloth draped nearby. The art of tailoring. Professional photography.' },
  { id: 'ward-suit-collection', filename: 'luxury-suit-collection.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A walk-in wardrobe with 12+ bespoke suits organized by color, each in garment bags with designer labels, custom shirt drawers visible, and tie collection. Complete executive wardrobe. Professional photography.' },
  // Formalwear
  { id: 'ward-tuxedo', filename: 'tuxedo.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A classic black tuxedo with satin lapels, displayed with bow tie, cufflinks, and patent leather shoes. Black-tie ready. Professional menswear photography.' },
  // Sportswear (2 tiers)
  { id: 'ward-sportswear', filename: 'sportswear.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: Basic athletic wear laid out flat - standard running shoes, breathable top, and shorts. Functional fitness gear. Professional sportswear product photography.' },
  { id: 'ward-sportswear-premium', filename: 'sportswear-premium.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: Premium performance sportswear - Nike/Lululemon-tier compression gear, carbon-plate running shoes, moisture-wicking fabrics with reflective details. Elite athletic wear. Professional product photography.' },
  // Accessories (unique per item)
  { id: 'ward-shoes', filename: 'designer-shoes.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic shoe photography: A curated collection of designer shoes - hand-stitched leather oxfords, suede loafers, and designer sneakers arranged artfully. Premium craftsmanship. Professional product photography.' },
  { id: 'ward-leather-goods', filename: 'luxury-leather-goods.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic product photography: Luxury leather accessories arranged on marble - Hermès belt, Louis Vuitton wallet, Bottega Veneta card holder, and Goyard passport case. Fine leather craftsmanship details visible. Professional photography.' },
  { id: 'ward-sunglasses', filename: 'designer-sunglasses.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic product photography: A collection of designer sunglasses displayed on a sleek stand - Tom Ford aviators, Cartier panthère, and Dior frames. Luxury eyewear. Professional product photography with dramatic lighting.' },
  { id: 'ward-watch-entry', filename: 'tag-heuer.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic watch photography: A TAG Heuer Carrera chronograph on a dark leather surface, dramatic side lighting catching the steel case and tachymeter bezel. Entry luxury horology. Professional product photography.' },
  // Outerwear (2 tiers)
  { id: 'ward-outerwear', filename: 'designer-outerwear.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A premium overcoat and leather jacket displayed on wooden hangers, cashmere scarf draped. Moncler, Burberry quality visible. Seasonal luxury outerwear. Professional fashion photography.' },
  { id: 'ward-outerwear-couture', filename: 'couture-outerwear.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: A couture fur-lined parka, hand-finished details, alongside a bespoke cashmere overcoat and exotic leather bomber jacket. Ultra-premium winter collection. Professional fashion photography.' },
  // Race Day wardrobe
  { id: 'ward-race-team', filename: 'team-wear.png', subcategory: 'wardrobe',
    prompt: 'Photorealistic fashion photography: Premium motorsport team wear - embroidered polo shirts, lightweight team jacket with sponsor logos, and team cap displayed on a paddock locker. Professional motorsport lifestyle photography.' },
]

// ============================================================
// TASK CREATORS
// ============================================================

export function createLifestyleImageTasks(projectRoot: string): GenerationTask[] {
  const tasks: GenerationTask[] = []

  const allImages = [
    ...VEHICLE_IMAGES,
    ...PROPERTY_IMAGES,
    ...COLLECTIBLE_IMAGES,
    ...PET_IMAGES,
    ...EXPERIENCE_IMAGES,
    ...MEMBERSHIP_IMAGES,
    ...FURNISHING_IMAGES,
    ...HOBBY_IMAGES,
    ...DIET_IMAGES,
    ...COURSE_IMAGES,
    ...SERVICE_IMAGES,
    ...WARDROBE_IMAGES,
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
      id: `lifestyle-image-${img.id}`,
      entityId: img.id,
      entityName: `Lifestyle: ${img.id.replace(/-/g, ' ')}`,
      category: 'lifestyle',
      type: 'image',
      priority: 2,
      prompt: img.prompt,
      outputPath: imagePath,
    })
  }

  return tasks
}

/**
 * Get the total count of lifestyle images that need generation.
 */
export function getLifestyleImageCount(): number {
  return VEHICLE_IMAGES.length
    + PROPERTY_IMAGES.length
    + COLLECTIBLE_IMAGES.length
    + PET_IMAGES.length
    + EXPERIENCE_IMAGES.length
    + MEMBERSHIP_IMAGES.length
    + FURNISHING_IMAGES.length
    + HOBBY_IMAGES.length
    + DIET_IMAGES.length
    + COURSE_IMAGES.length
    + SERVICE_IMAGES.length
    + WARDROBE_IMAGES.length
}
