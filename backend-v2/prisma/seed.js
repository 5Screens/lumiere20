/**
 * Main seed file for Prisma
 * Orchestrates all seed scripts in the correct order
 * 
 * Run with: npx prisma db seed
 * Or: npx prisma migrate reset (will run seeds automatically after reset)
 */

const { prisma } = require('./client');
const { seedObjectMetadata } = require('./seeds/object-metadata');
const { seedCiTypes } = require('./seeds/ci-types');
const { seedCiTypeFields } = require('./seeds/ci-type-fields');
const { seedLanguages } = require('./seeds/languages.seed');

async function main() {
  console.log('========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  try {
    // 1. Languages (required for multi-language support)
    console.log('[1/4] Seeding languages...');
    await seedLanguages(prisma);
    console.log('');

    // 2. Object metadata (required for dynamic UI)
    console.log('[2/4] Seeding object metadata...');
    await seedObjectMetadata();
    console.log('');

    // 3. CI Types with translations
    console.log('[3/4] Seeding CI types...');
    await seedCiTypes();
    console.log('');

    // 4. CI Type Fields (extended fields per CI type)
    console.log('[4/4] Seeding CI type fields...');
    await seedCiTypeFields();
    console.log('');

    console.log('========================================');
    console.log('Database seeding completed successfully!');
    console.log('========================================');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
