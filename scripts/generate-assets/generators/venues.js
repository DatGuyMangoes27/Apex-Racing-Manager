/**
 * Venue & Cutscene Generator
 * Generates venue photos and cutscene images using Gemini Imagen
 */

import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { VENUE_SCENES } from '../lib/config-loader.js';

// Additional venue and cutscene prompts
const ADDITIONAL_SCENES = [
  // Venue exteriors
  { id: 'venue-silverstone', category: 'venues', prompt: 'Exterior view of Silverstone racing circuit main entrance, British motorsport heritage, professional facility, overcast British weather' },
  { id: 'venue-monza', category: 'venues', prompt: 'Exterior view of Monza circuit historic main entrance, Italian racing heritage, parabolica grandstand visible, classic motorsport atmosphere' },
  { id: 'venue-spa', category: 'venues', prompt: 'Scenic view of Spa-Francorchamps circuit nestled in Belgian Ardennes forest, iconic racing venue, misty atmosphere' },
  { id: 'venue-nurburgring', category: 'venues', prompt: 'View of Nurburgring circuit entrance and paddock area, German precision, historic racing venue' },
  { id: 'venue-lemans', category: 'venues', prompt: 'Le Mans 24h circuit main grandstand and start/finish straight, French endurance racing heritage, evening atmosphere' },
  
  // Paddock scenes
  { id: 'paddock-morning', category: 'cutscenes', prompt: 'Racing paddock in early morning light, team trucks and motorhomes, crew members preparing for race day, professional motorsport atmosphere' },
  { id: 'paddock-night', category: 'cutscenes', prompt: 'Racing paddock at night, dramatic lighting from motorhomes, GT race cars visible through garage doors, atmospheric' },
  
  // Garage scenes
  { id: 'garage-preparation', category: 'cutscenes', prompt: 'GT3 race car in team garage being prepared, mechanics working, bright workshop lighting, professional racing team environment' },
  { id: 'garage-celebration', category: 'cutscenes', prompt: 'Racing team celebrating in garage after race win, champagne, team members hugging, race car in background with winner number 1' },
  
  // Career milestone scenes
  { id: 'first-win', category: 'cutscenes', prompt: 'Young racing driver celebrating first career win, emotional moment, standing on race car, team cheering, confetti' },
  { id: 'championship-moment', category: 'cutscenes', prompt: 'Racing driver lifting championship trophy above head, golden trophy, celebration, professional motorsport ceremony' },
  { id: 'team-photo', category: 'cutscenes', prompt: 'Racing team group photo in front of race car, mechanics, engineers, drivers, team uniforms, professional atmosphere' },
  { id: 'retirement-ceremony', category: 'cutscenes', prompt: 'Emotional racing driver retirement ceremony, guard of honor from other drivers, last walk down pit lane' },
  
  // Business scenes
  { id: 'sponsor-meeting', category: 'cutscenes', prompt: 'Business meeting in modern conference room, racing driver meeting with sponsors, presentation screen, professional setting' },
  { id: 'media-interview', category: 'cutscenes', prompt: 'Racing driver being interviewed by media, microphones, cameras, sponsor backdrop, professional press setting' },
  { id: 'factory-tour', category: 'cutscenes', prompt: 'VIP guests touring racing team factory, car chassis visible, clean industrial environment, guided tour' },
  
  // Weather/atmosphere scenes
  { id: 'rain-race', category: 'cutscenes', prompt: 'GT race car racing in heavy rain, spray from tires, headlights on, dramatic wet weather racing' },
  { id: 'sunset-track', category: 'cutscenes', prompt: 'Beautiful sunset over racing circuit, golden hour light, empty track after race, peaceful atmosphere' },
  { id: 'night-lights', category: 'cutscenes', prompt: 'Racing circuit at night with floodlights illuminating the track, race car passing with light trails' },
  
  // UI Background scenes
  { id: 'ui-carbon-texture', category: 'ui', prompt: 'Carbon fiber texture close-up, dark gray weave pattern, premium motorsport material, subtle lighting' },
  { id: 'ui-metal-texture', category: 'ui', prompt: 'Brushed aluminum texture, metallic surface, industrial quality, premium automotive finish' },
  { id: 'ui-abstract-speed', category: 'ui', prompt: 'Abstract speed lines and blur effect, dark background with motion blur streaks, racing aesthetic' },
  { id: 'ui-cockpit-blur', category: 'ui', prompt: 'Blurred cockpit background, steering wheel out of focus, dashboard gauges, atmospheric depth' },
];

export async function generateVenues(client, options) {
  const { outputDir, progress, limit, dryRun, verbose } = options;
  
  const result = {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    cost: 0
  };

  // Combine all scenes
  const allScenes = [...VENUE_SCENES, ...ADDITIONAL_SCENES];
  const scenes = limit ? allScenes.slice(0, limit) : allScenes;
  
  result.total = scenes.length;
  
  console.log(chalk.blue(`  Processing ${scenes.length} venue/cutscene images...`));
  
  for (const scene of scenes) {
    const category = scene.category || 'cutscenes';
    const outputPath = path.join(outputDir, category, `${scene.id}.png`);
    
    // Check if already exists
    try {
      await fs.access(outputPath);
      if (verbose) console.log(chalk.dim(`  Skipping ${scene.id} (exists)`));
      result.skipped++;
      continue;
    } catch {}
    
    if (progress.completed.includes(`scene_${scene.id}`)) {
      result.skipped++;
      continue;
    }
    
    // Build prompt
    const prompt = `${scene.prompt}, photorealistic, high quality, 4K resolution, professional photography`;
    
    if (dryRun) {
      console.log(chalk.dim(`  [DRY RUN] Would generate: ${scene.id}`));
      console.log(chalk.dim(`    Category: ${category}`));
      result.generated++;
      continue;
    }
    
    const spinner = ora(`Generating ${scene.id}`).start();
    
    try {
      const image = await client.generateImage(prompt, {
        aspectRatio: '16:9',  // Widescreen for backgrounds
        numberOfImages: 1
      });
      
      await client.saveImage(image, outputPath);
      
      progress.completed.push(`scene_${scene.id}`);
      result.generated++;
      result.cost += 0.03;
      
      spinner.succeed(chalk.green(`${scene.id} saved to ${category}/`));
      
    } catch (error) {
      spinner.fail(chalk.red(`${scene.id} failed: ${error.message}`));
      progress.failed.push({ id: `scene_${scene.id}`, error: error.message });
      result.failed++;
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  return result;
}
