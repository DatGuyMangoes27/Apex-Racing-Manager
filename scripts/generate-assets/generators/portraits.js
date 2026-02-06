/**
 * Portrait Generator
 * Generates driver and staff portraits using Gemini Imagen
 */

import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { NATIONALITIES, STAFF_ROLES } from '../lib/config-loader.js';

// First and last name pools by region for generating diverse driver names
const NAME_POOLS = {
  european: {
    first: ['Max', 'Lewis', 'Charles', 'Carlos', 'Lando', 'George', 'Pierre', 'Daniel', 'Fernando', 'Valtteri', 'Sebastian', 'Nico', 'Kevin', 'Romain', 'Stoffel', 'Mick', 'Nyck', 'Antonio', 'Oscar', 'Logan', 'Zhou', 'Yuki'],
    last: ['Verstappen', 'Hamilton', 'Leclerc', 'Sainz', 'Norris', 'Russell', 'Gasly', 'Ricciardo', 'Alonso', 'Bottas', 'Vettel', 'Hulkenberg', 'Magnussen', 'Grosjean', 'Vandoorne', 'Schumacher', 'de Vries', 'Giovinazzi', 'Piastri', 'Sargeant']
  },
  american: {
    first: ['Chase', 'Kyle', 'Ryan', 'Denny', 'Kevin', 'Joey', 'Brad', 'Austin', 'Tyler', 'Alex', 'William', 'Bubba', 'Ross', 'Daniel', 'Christopher', 'Martin', 'Colton', 'Pato', 'Scott', 'Josef'],
    last: ['Elliott', 'Busch', 'Blaney', 'Hamlin', 'Harvick', 'Logano', 'Keselowski', 'Dillon', 'Reddick', 'Bowman', 'Byron', 'Wallace', 'Chastain', 'Suarez', 'Bell', 'Truex', 'Herta', 'O\'Ward', 'McLaughlin', 'Newgarden']
  },
  latinAmerican: {
    first: ['Ayrton', 'Rubens', 'Felipe', 'Bruno', 'Pedro', 'Ricardo', 'Sergio', 'Esteban', 'Helio', 'Tony', 'Juan', 'Carlos', 'Miguel', 'Roberto', 'Diego', 'Gabriel', 'Lucas', 'Mateo', 'Nicolas', 'Rafael'],
    last: ['Senna', 'Barrichello', 'Massa', 'Fittipaldi', 'Piquet', 'Rosset', 'Perez', 'Gutierrez', 'Castroneves', 'Kanaan', 'Montoya', 'Reutemann', 'Gonzalez', 'Moreno', 'Pizzonia', 'Di Grassi', 'Drugovich', 'Camara', 'Fittipaldi', 'Merhi']
  },
  asian: {
    first: ['Takuma', 'Kamui', 'Kazuki', 'Ukyo', 'Satoru', 'Yuki', 'Ayumu', 'Ryo', 'Kenta', 'Naoki', 'Guanyu', 'Ho-Pin', 'Ma', 'David', 'Jazeman', 'Alex', 'Sean', 'Jann', 'Rio', 'Afiq'],
    last: ['Sato', 'Kobayashi', 'Nakajima', 'Katayama', 'Nakajima', 'Tsunoda', 'Iwasa', 'Hirakawa', 'Yamashita', 'Yamamoto', 'Zhou', 'Tung', 'Qinghua', 'Cheng', 'Jaafar', 'Yoong', 'Gelael', 'Mardenborough', 'Haryanto', 'Yazid']
  },
  oceanian: {
    first: ['Daniel', 'Mark', 'Oscar', 'Jack', 'Shane', 'Will', 'Scott', 'James', 'David', 'Fabian', 'Anton', 'Brenton', 'Chaz', 'Nick', 'Todd', 'Craig', 'Jamie', 'Garth', 'Tim', 'Lee'],
    last: ['Ricciardo', 'Webber', 'Piastri', 'Doohan', 'van Gisbergen', 'Power', 'McLaughlin', 'Courtney', 'Reynolds', 'Coulthard', 'De Pasquale', 'Grove', 'Mostert', 'Percat', 'Kelly', 'Lowndes', 'Whincup', 'Tander', 'Slade', 'Holdsworth']
  }
};

// Age ranges for different driver types
const AGE_RANGES = {
  rookie: { min: 18, max: 23 },
  rising: { min: 22, max: 28 },
  prime: { min: 26, max: 34 },
  veteran: { min: 32, max: 42 },
  legend: { min: 38, max: 50 }
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAge(type = 'prime') {
  const range = AGE_RANGES[type] || AGE_RANGES.prime;
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generateDriverPrompt(driver) {
  const genders = ['male', 'female'];
  const gender = getRandomElement(genders);
  const expressions = ['confident', 'determined', 'focused', 'friendly', 'intense'];
  const expression = getRandomElement(expressions);
  
  return `Professional motorsport portrait photograph of a ${driver.nationality} ${driver.age}-year-old ${gender} racing driver, ${expression} expression, wearing a racing suit with sponsor patches, studio lighting with dramatic shadows, dark gradient background, photorealistic, high quality headshot, 4K resolution`;
}

function generateStaffPrompt(staff, category) {
  const genders = ['male', 'female'];
  const gender = getRandomElement(genders);
  const nationality = getRandomElement(NATIONALITIES);
  const ages = [28, 32, 35, 38, 42, 45, 48, 52, 55];
  const age = getRandomElement(ages);
  
  return `Professional corporate headshot of a ${nationality.name} ${age}-year-old ${gender} ${staff.name.toLowerCase()}, ${staff.description}, working for a motorsport racing team, clean neutral background, studio lighting, photorealistic, high quality portrait`;
}

export async function generatePortraits(client, options) {
  const { outputDir, progress, limit, dryRun, verbose, category } = options;
  
  const result = {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    cost: 0
  };

  // Generate driver portraits
  if (!category || category === 'drivers') {
    console.log(chalk.blue('  Generating driver portraits...'));
    
    const driverCount = limit || 150;
    const driversToGenerate = [];
    
    // Create diverse driver list
    for (let i = 0; i < driverCount; i++) {
      const nationality = getRandomElement(NATIONALITIES);
      const ageType = getRandomElement(['rookie', 'rising', 'prime', 'prime', 'veteran']);
      const age = getRandomAge(ageType);
      
      driversToGenerate.push({
        id: `driver_${i + 1}`,
        nationality: nationality.name,
        country: nationality.country,
        countryCode: nationality.code,
        age: age,
        ageType: ageType
      });
    }
    
    result.total += driversToGenerate.length;
    
    for (const driver of driversToGenerate) {
      const outputPath = path.join(outputDir, 'avatars/drivers', `${driver.id}.png`);
      
      // Check if already exists
      try {
        await fs.access(outputPath);
        if (verbose) console.log(chalk.dim(`  Skipping ${driver.id} (exists)`));
        result.skipped++;
        continue;
      } catch {}
      
      // Check if in progress (already completed)
      if (progress.completed.includes(driver.id)) {
        result.skipped++;
        continue;
      }
      
      const prompt = generateDriverPrompt(driver);
      
      if (dryRun) {
        console.log(chalk.dim(`  [DRY RUN] Would generate: ${driver.id}`));
        console.log(chalk.dim(`    Prompt: ${prompt.substring(0, 80)}...`));
        result.generated++;
        continue;
      }
      
      const spinner = ora(`Generating ${driver.id} (${driver.nationality}, ${driver.age}yo)`).start();
      
      try {
        const image = await client.generateImage(prompt, {
          aspectRatio: '1:1',
          numberOfImages: 1
        });
        
        await client.saveImage(image, outputPath);
        
        progress.completed.push(driver.id);
        result.generated++;
        result.cost += 0.03;
        
        spinner.succeed(chalk.green(`${driver.id} saved`));
        
      } catch (error) {
        spinner.fail(chalk.red(`${driver.id} failed: ${error.message}`));
        progress.failed.push({ id: driver.id, error: error.message });
        result.failed++;
      }
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Generate staff portraits
  if (!category || category === 'staff') {
    for (const [categoryName, roles] of Object.entries(STAFF_ROLES)) {
      console.log(chalk.blue(`  Generating ${categoryName} staff portraits...`));
      
      const staffCount = limit ? Math.ceil(limit / 3) : (categoryName === 'team' ? 50 : categoryName === 'facility' ? 30 : 20);
      
      for (let i = 0; i < staffCount; i++) {
        const role = getRandomElement(roles);
        const staffId = `${categoryName}_${role.id}_${i + 1}`;
        const outputPath = path.join(outputDir, `avatars/staff/${categoryName}`, `${staffId}.png`);
        
        result.total++;
        
        // Check if already exists
        try {
          await fs.access(outputPath);
          result.skipped++;
          continue;
        } catch {}
        
        if (progress.completed.includes(staffId)) {
          result.skipped++;
          continue;
        }
        
        const prompt = generateStaffPrompt(role, categoryName);
        
        if (dryRun) {
          console.log(chalk.dim(`  [DRY RUN] Would generate: ${staffId}`));
          result.generated++;
          continue;
        }
        
        const spinner = ora(`Generating ${staffId}`).start();
        
        try {
          const image = await client.generateImage(prompt, {
            aspectRatio: '1:1',
            numberOfImages: 1
          });
          
          await client.saveImage(image, outputPath);
          
          progress.completed.push(staffId);
          result.generated++;
          result.cost += 0.03;
          
          spinner.succeed(chalk.green(`${staffId} saved`));
          
        } catch (error) {
          spinner.fail(chalk.red(`${staffId} failed: ${error.message}`));
          progress.failed.push({ id: staffId, error: error.message });
          result.failed++;
        }
        
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  
  return result;
}
