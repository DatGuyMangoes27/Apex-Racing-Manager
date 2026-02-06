/**
 * Logo Generator
 * Generates sponsor, manufacturer, and bank logos using Gemini Imagen
 */

import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { loadSponsors, loadManufacturers, loadBanks } from '../lib/config-loader.js';

// Logo style guidelines by category
const LOGO_STYLES = {
  energy_drinks: 'bold, aggressive, dynamic, bright colors, action-oriented design',
  oil_fuel: 'professional, technical, premium quality feel, metallic accents',
  tires: 'circular elements, road/grip imagery, professional motorsport style',
  tech_gaming: 'modern, sleek, RGB/tech aesthetic, futuristic design',
  equipment: 'safety-focused, bold, professional racing equipment style',
  watches: 'luxury, elegant, precision-focused, premium materials look',
  lifestyle: 'modern, lifestyle brand aesthetic, clean and trendy',
  automotive: 'automotive heritage, professional, mechanical elements',
  financial: 'trustworthy, professional, corporate, secure and stable',
  local: 'friendly, approachable, regional character',
  
  // Manufacturer tiers
  luxury: 'ultra premium, exclusive, sophisticated, timeless elegance',
  premium: 'high-end, refined, performance-focused, prestigious',
  mainstream: 'reliable, recognizable, balanced design',
  budget: 'value-focused, accessible, friendly design',
  
  // Banks
  bank: 'trustworthy, professional, financial institution, secure and modern'
};

function generateSponsorLogoPrompt(sponsor) {
  const style = LOGO_STYLES[sponsor.category] || LOGO_STYLES.lifestyle;
  
  return `Professional logo design for "${sponsor.name}", a ${sponsor.category.replace('_', ' ')} brand from ${sponsor.country}. ${style}. Clean vector-style logo suitable for racing car livery and merchandise, white background, high contrast, minimalist modern design, no text description just the logo`;
}

function generateManufacturerLogoPrompt(manufacturer) {
  const style = LOGO_STYLES[manufacturer.tier] || LOGO_STYLES.mainstream;
  
  return `Professional automotive manufacturer logo for "${manufacturer.name}" from ${manufacturer.country}. ${style}. Racing heritage, suitable for car badge and team branding, clean vector style, white background, iconic design, no text description just the logo`;
}

function generateBankLogoPrompt(bank) {
  return `Professional financial institution logo for "${bank.name}". ${LOGO_STYLES.bank}. Corporate branding suitable for motorsport sponsorship, clean vector style, white background, trust-inspiring design, no text description just the logo`;
}

export async function generateLogos(client, options) {
  const { outputDir, progress, limit, dryRun, verbose, category } = options;
  
  const result = {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    cost: 0
  };

  // Generate sponsor logos
  if (!category || category === 'sponsors') {
    console.log(chalk.blue('  Generating sponsor logos...'));
    
    let sponsors = await loadSponsors();
    if (limit) sponsors = sponsors.slice(0, limit);
    
    result.total += sponsors.length;
    
    for (const sponsor of sponsors) {
      const outputPath = path.join(outputDir, 'logos/sponsors', `${sponsor.id}.png`);
      
      // Check if already exists
      try {
        await fs.access(outputPath);
        if (verbose) console.log(chalk.dim(`  Skipping ${sponsor.id} (exists)`));
        result.skipped++;
        continue;
      } catch {}
      
      if (progress.completed.includes(`logo_${sponsor.id}`)) {
        result.skipped++;
        continue;
      }
      
      const prompt = generateSponsorLogoPrompt(sponsor);
      
      if (dryRun) {
        console.log(chalk.dim(`  [DRY RUN] Would generate: ${sponsor.name}`));
        result.generated++;
        continue;
      }
      
      const spinner = ora(`Generating ${sponsor.name} logo`).start();
      
      try {
        const image = await client.generateImage(prompt, {
          aspectRatio: '1:1',
          numberOfImages: 1
        });
        
        await client.saveImage(image, outputPath);
        
        progress.completed.push(`logo_${sponsor.id}`);
        result.generated++;
        result.cost += 0.03;
        
        spinner.succeed(chalk.green(`${sponsor.name} logo saved`));
        
      } catch (error) {
        spinner.fail(chalk.red(`${sponsor.name} failed: ${error.message}`));
        progress.failed.push({ id: `logo_${sponsor.id}`, error: error.message });
        result.failed++;
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Generate manufacturer logos
  if (!category || category === 'manufacturers') {
    console.log(chalk.blue('  Generating manufacturer logos...'));
    
    let manufacturers = await loadManufacturers();
    if (limit) manufacturers = manufacturers.slice(0, limit);
    
    result.total += manufacturers.length;
    
    for (const mfg of manufacturers) {
      const outputPath = path.join(outputDir, 'logos/manufacturers', `${mfg.id}.png`);
      
      try {
        await fs.access(outputPath);
        result.skipped++;
        continue;
      } catch {}
      
      if (progress.completed.includes(`logo_mfg_${mfg.id}`)) {
        result.skipped++;
        continue;
      }
      
      const prompt = generateManufacturerLogoPrompt(mfg);
      
      if (dryRun) {
        console.log(chalk.dim(`  [DRY RUN] Would generate: ${mfg.name}`));
        result.generated++;
        continue;
      }
      
      const spinner = ora(`Generating ${mfg.name} logo`).start();
      
      try {
        const image = await client.generateImage(prompt, {
          aspectRatio: '1:1',
          numberOfImages: 1
        });
        
        await client.saveImage(image, outputPath);
        
        progress.completed.push(`logo_mfg_${mfg.id}`);
        result.generated++;
        result.cost += 0.03;
        
        spinner.succeed(chalk.green(`${mfg.name} logo saved`));
        
      } catch (error) {
        spinner.fail(chalk.red(`${mfg.name} failed: ${error.message}`));
        progress.failed.push({ id: `logo_mfg_${mfg.id}`, error: error.message });
        result.failed++;
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Generate bank logos
  if (!category || category === 'banks') {
    console.log(chalk.blue('  Generating bank logos...'));
    
    let banks = await loadBanks();
    if (limit) banks = banks.slice(0, limit);
    
    result.total += banks.length;
    
    for (const bank of banks) {
      const outputPath = path.join(outputDir, 'logos/banks', `${bank.id}.png`);
      
      try {
        await fs.access(outputPath);
        result.skipped++;
        continue;
      } catch {}
      
      if (progress.completed.includes(`logo_bank_${bank.id}`)) {
        result.skipped++;
        continue;
      }
      
      const prompt = generateBankLogoPrompt(bank);
      
      if (dryRun) {
        console.log(chalk.dim(`  [DRY RUN] Would generate: ${bank.name}`));
        result.generated++;
        continue;
      }
      
      const spinner = ora(`Generating ${bank.name} logo`).start();
      
      try {
        const image = await client.generateImage(prompt, {
          aspectRatio: '1:1',
          numberOfImages: 1
        });
        
        await client.saveImage(image, outputPath);
        
        progress.completed.push(`logo_bank_${bank.id}`);
        result.generated++;
        result.cost += 0.03;
        
        spinner.succeed(chalk.green(`${bank.name} logo saved`));
        
      } catch (error) {
        spinner.fail(chalk.red(`${bank.name} failed: ${error.message}`));
        progress.failed.push({ id: `logo_bank_${bank.id}`, error: error.message });
        result.failed++;
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return result;
}
