/**
 * Test the data reader and profile generator
 */

import { extractAllGameData } from './lib/data-reader.js';
import { 
  generateDriverProfile,
  generatePartnerProfiles,
  generateChildProfiles,
  generateStaffProfiles,
  generateContactProfiles,
  generateBoardMemberProfiles,
  generateSponsorExecProfiles
} from './lib/profile-generator.js';

async function test() {
  console.log('Testing Data Reader and Profile Generator\n');
  console.log('='.repeat(60));
  
  // Test data extraction
  const gameData = await extractAllGameData();
  
  console.log('\n' + '='.repeat(60));
  console.log('\nTesting Profile Generation...\n');
  
  // Test driver profile generation
  console.log('📷 Sample Driver Profiles:');
  const sampleDrivers = gameData.drivers.slice(0, 5);
  for (const driver of sampleDrivers) {
    const profile = generateDriverProfile(driver, 'professional');
    console.log(`\n  ${profile.name} (${profile.nationality}, ${profile.age}yo)`);
    console.log(`    Personality: ${profile.personality}`);
    console.log(`    Career Stage: ${profile.careerStage}`);
    console.log(`    Physical: ${profile.physical.description}`);
    console.log(`    Prompt: ${profile.portraitPrompt.substring(0, 100)}...`);
  }
  
  // Test partner profiles
  console.log('\n\n👫 Sample Partner Profiles:');
  const partners = generatePartnerProfiles(5);
  for (const partner of partners) {
    console.log(`\n  ${partner.id}: ${partner.nationality} ${partner.gender}, ${partner.age}yo ${partner.careerTitle}`);
    console.log(`    Style: ${partner.style}`);
    console.log(`    Prompt: ${partner.portraitPrompt.substring(0, 100)}...`);
  }
  
  // Test child profiles
  console.log('\n\n👶 Sample Child Profiles (1 child at different ages):');
  const children = generateChildProfiles(1);
  for (const child of children.slice(0, 5)) {
    console.log(`\n  ${child.id}: ${child.nationality} ${child.gender}, ${child.ageRange}`);
    console.log(`    Prompt: ${child.portraitPrompt.substring(0, 100)}...`);
  }
  
  // Test staff profiles
  console.log('\n\n👔 Sample Staff Profiles:');
  const staff = generateStaffProfiles({ team: 3, facility: 2, media: 2 });
  for (const person of staff.slice(0, 5)) {
    console.log(`\n  ${person.id}: ${person.nationality} ${person.gender}, ${person.age}yo ${person.roleTitle}`);
    console.log(`    Category: ${person.category}`);
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('GENERATION PLAN SUMMARY');
  console.log('='.repeat(60));
  
  const partnerCount = 150;
  const childCount = 10 * 10; // 10 base children × 10 age stages
  const staffCounts = { team: 200, facility: 150, media: 95 };
  const contactCount = 150;
  const boardCount = 25;
  const sponsorExecCount = 25;
  
  const totalPortraits = 
    gameData.drivers.length +
    partnerCount +
    childCount +
    staffCounts.team + staffCounts.facility + staffCounts.media +
    contactCount +
    boardCount +
    sponsorExecCount;
  
  const totalLogos = 
    gameData.teams.length +
    gameData.sponsors.length +
    gameData.manufacturers.length +
    gameData.banks.length +
    gameData.championships.length +
    50; // Generic pool
  
  const totalVenues = gameData.tracks.length * 4; // 4 views per track
  
  console.log(`\n  PORTRAITS: ${totalPortraits}`);
  console.log(`    - Drivers:        ${gameData.drivers.length}`);
  console.log(`    - Partners:       ${partnerCount}`);
  console.log(`    - Children:       ${childCount}`);
  console.log(`    - Team Staff:     ${staffCounts.team}`);
  console.log(`    - Facility Staff: ${staffCounts.facility}`);
  console.log(`    - Media:          ${staffCounts.media}`);
  console.log(`    - Contacts:       ${contactCount}`);
  console.log(`    - Board Members:  ${boardCount}`);
  console.log(`    - Sponsor Execs:  ${sponsorExecCount}`);
  
  console.log(`\n  LOGOS: ${totalLogos}`);
  console.log(`    - Teams:          ${gameData.teams.length}`);
  console.log(`    - Sponsors:       ${gameData.sponsors.length}`);
  console.log(`    - Manufacturers:  ${gameData.manufacturers.length}`);
  console.log(`    - Banks:          ${gameData.banks.length}`);
  console.log(`    - Championships:  ${gameData.championships.length}`);
  console.log(`    - Generic Pool:   50`);
  
  console.log(`\n  VENUES: ${totalVenues}`);
  console.log(`    - Track Views:    ${totalVenues} (${gameData.tracks.length} tracks × 4 views)`);
  
  console.log(`\n  ─────────────────────────────────`);
  console.log(`  GRAND TOTAL: ${totalPortraits + totalLogos + totalVenues} assets`);
  
  const estimatedTime = (totalPortraits + totalLogos + totalVenues) * 10 / 3600;
  console.log(`\n  Estimated generation time: ~${estimatedTime.toFixed(1)} hours`);
  console.log(`  (at 10 seconds per image with rate limiting)`);
}

test().catch(console.error);
