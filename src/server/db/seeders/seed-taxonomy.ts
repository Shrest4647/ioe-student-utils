#!/usr/bin/env tsx

/**
 * Import taxonomy data into IOESU database
 * This script imports countries, degrees, and fields of study
 */

import countries from '@/data/countries.json';
import degrees from '@/data/degrees.json';
import fields from '@/data/fields-of-study.json';

async function importCountries() {
  console.log('Importing countries...');
  let successCount = 0;
  let failCount = 0;

  for (const country of countries) {
    try {
      // Make API call to create country
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mcp/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(country),
      });

      if (response.ok) {
        successCount++;
        console.log(`✓ Created: ${country.name}`);
      } else {
        failCount++;
        console.error(`✗ Failed: ${country.name} - ${response.statusText}`);
      }
    } catch (error) {
      failCount++;
      console.error(`✗ Error: ${country.name}`, error);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nCountries: ${successCount} succeeded, ${failCount} failed`);
}

async function importDegrees() {
  console.log('\nImporting degrees...');
  let successCount = 0;
  let failCount = 0;

  for (const degree of degrees) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mcp/degrees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(degree),
      });

      if (response.ok) {
        successCount++;
        console.log(`✓ Created: ${degree.name}`);
      } else {
        failCount++;
        console.error(`✗ Failed: ${degree.name} - ${response.statusText}`);
      }
    } catch (error) {
      failCount++;
      console.error(`✗ Error: ${degree.name}`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nDegrees: ${successCount} succeeded, ${failCount} failed`);
}

async function importFields() {
  console.log('\nImporting fields of study...');
  let successCount = 0;
  let failCount = 0;

  for (const field of fields) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mcp/fields-of-study`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field),
      });

      if (response.ok) {
        successCount++;
        console.log(`✓ Created: ${field.name}`);
      } else {
        failCount++;
        console.error(`✗ Failed: ${field.name} - ${response.statusText}`);
      }
    } catch (error) {
      failCount++;
      console.error(`✗ Error: ${field.name}`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nFields of Study: ${successCount} succeeded, ${failCount} failed`);
}

async function main() {
  console.log('Starting taxonomy import...\n');

  await importCountries();
  await importDegrees();
  await importFields();

  console.log('\nImport complete!');
}

main().catch(console.error);
