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

async function main() {
  console.log('========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  try {
    // 1. Object metadata (required for dynamic UI)
    console.log('[1/2] Seeding object metadata...');
    await seedObjectMetadata();
    console.log('');

    // 2. CI Types with translations
    console.log('[2/2] Seeding CI types...');
    await seedCiTypes();
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
