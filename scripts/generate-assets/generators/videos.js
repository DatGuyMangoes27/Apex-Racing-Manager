/**
 * Video Background Generator
 * Generates background videos using Gemini Veo
 * 
 * Note: Veo API access may require waitlist approval
 * If unavailable, this will provide instructions for alternatives
 */

import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { VIDEO_SCENES } from '../lib/config-loader.js';

export async function generateVideos(client, options) {
  const { outputDir, progress, limit, dryRun, verbose } = options;
  
  const result = {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    cost: 0
  };

  const scenes = limit ? VIDEO_SCENES.slice(0, limit) : VIDEO_SCENES;
  result.total = scenes.length;
  
  console.log(chalk.blue(`  Processing ${scenes.length} background videos...`));
  console.log(chalk.yellow('  Note: Veo API may require separate waitlist approval'));
  console.log();
  
  for (const scene of scenes) {
    const outputPath = path.join(outputDir, 'backgrounds', `${scene.id}.mp4`);
    
    // Check if already exists
    try {
      await fs.access(outputPath);
      if (verbose) console.log(chalk.dim(`  Skipping ${scene.id} (exists)`));
      result.skipped++;
      continue;
    } catch {}
    
    if (progress.completed.includes(`video_${scene.id}`)) {
      result.skipped++;
      continue;
    }
    
    if (dryRun) {
      console.log(chalk.dim(`  [DRY RUN] Would generate: ${scene.name}`));
      console.log(chalk.dim(`    Prompt: ${scene.prompt.substring(0, 80)}...`));
      result.generated++;
      continue;
    }
    
    const spinner = ora(`Generating ${scene.name} video`).start();
    
    try {
      const video = await client.generateVideo(scene.prompt, {
        duration: 8,
        resolution: '720p'
      });
      
      await client.saveVideo(video, outputPath);
      
      progress.completed.push(`video_${scene.id}`);
      result.generated++;
      result.cost += 0.75; // Videos are more expensive
      
      spinner.succeed(chalk.green(`${scene.name} video saved`));
      
    } catch (error) {
      if (error.message.includes('not available') || error.message.includes('waitlist')) {
        spinner.warn(chalk.yellow(`${scene.name}: Veo not available (waitlist required)`));
        
        // Save prompt to a file for manual generation
        const promptFile = path.join(outputDir, 'backgrounds', `${scene.id}_prompt.txt`);
        await fs.writeFile(promptFile, `Video Prompt for ${scene.name}:\n\n${scene.prompt}\n\nAlternative generation options:\n- Google AI Studio: https://aistudio.google.com/\n- Runway ML: https://runwayml.com/\n- Pika Labs: https://pika.art/\n`);
        
        result.failed++;
      } else {
        spinner.fail(chalk.red(`${scene.name} failed: ${error.message}`));
        progress.failed.push({ id: `video_${scene.id}`, error: error.message });
        result.failed++;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000)); // Longer delay for video generation
  }
  
  // If all videos failed due to Veo unavailability, provide alternatives
  if (result.failed === result.total && result.generated === 0) {
    console.log();
    console.log(chalk.yellow('═══════════════════════════════════════════════════════'));
    console.log(chalk.yellow('  VIDEO GENERATION ALTERNATIVES'));
    console.log(chalk.yellow('═══════════════════════════════════════════════════════'));
    console.log();
    console.log('  Veo API requires separate waitlist approval.');
    console.log('  Video prompts have been saved to: public/videos/backgrounds/');
    console.log();
    console.log('  Alternative options:');
    console.log('  1. Google AI Studio (https://aistudio.google.com/)');
    console.log('     - May have Veo preview access');
    console.log();
    console.log('  2. Runway ML (https://runwayml.com/)');
    console.log('     - Gen-3 Alpha for video generation');
    console.log('     - ~$0.50 per 8-second video');
    console.log();
    console.log('  3. Pika Labs (https://pika.art/)');
    console.log('     - Free tier available');
    console.log('     - Good for short looping videos');
    console.log();
    console.log('  4. Stock Footage');
    console.log('     - Pexels: https://www.pexels.com/search/videos/racing/');
    console.log('     - Pixabay: https://pixabay.com/videos/search/motorsport/');
    console.log();
  }
  
  return result;
}
