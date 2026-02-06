import fs from 'fs';

const content = fs.readFileSync('../../src/data/ams2-teams-real.ts', 'utf-8');

// Count driver entries
const driverMatches = content.match(/"name":"[^"]+","country":"[^"]+"/g);
console.log('Total driver entries:', driverMatches?.length || 0);

// Get unique drivers
const uniqueDrivers = new Set(driverMatches);
console.log('Unique drivers:', uniqueDrivers.size);

// Count teams
const teamMatches = content.match(/id: '[^']+'/g);
console.log('Total teams:', teamMatches?.length || 0);

// Sample some drivers
console.log('\nSample drivers:');
Array.from(uniqueDrivers).slice(0, 10).forEach(d => console.log(' ', d));
