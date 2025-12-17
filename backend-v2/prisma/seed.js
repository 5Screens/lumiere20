/**
 * Main seed file for Prisma
 * Orchestrates all seed scripts in the correct order
 * 
 * Run with: npx prisma db seed
 * Or: npx prisma migrate reset (will run seeds automatically after reset)
 */

const { prisma } = require('./client');
const { seedLanguages } = require('./seeds/languages.seed');
const { seedObjectMetadata } = require('./seeds/object-metadata');
const { seedCiTypes } = require('./seeds/ci-types');
const { seedCiTypeFields } = require('./seeds/ci-type-fields');
const { seedDefaultAdmin } = require('./seeds/default-admin.seed');
const { seedWorkflowStatusCategories } = require('./seeds/workflow-status-categories.seed');
const { seedWorkflowEntityConfig } = require('./seeds/workflow-entity-config.seed');

async function main() {
  console.log('========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  try {
    // 1. Languages (required for multi-language support)
    console.log('[1/7] Seeding languages...');
    await seedLanguages(prisma);
    console.log('');

    // 2. Object metadata (required for dynamic UI)
    console.log('[2/7] Seeding object metadata...');
    await seedObjectMetadata();
    console.log('');

    // 3. CI Types with translations (includes CI Categories)
    console.log('[3/7] Seeding CI types...');
    await seedCiTypes();
    console.log('');

    // 4. CI Type Fields (extended fields per CI type)
    console.log('[4/7] Seeding CI type fields...');
    await seedCiTypeFields();
    console.log('');

    // 5. Workflow Status Categories
    console.log('[5/7] Seeding workflow status categories...');
    await seedWorkflowStatusCategories(prisma);
    console.log('');

    // 6. Workflow Entity Config
    console.log('[6/7] Seeding workflow entity config...');
    await seedWorkflowEntityConfig(prisma);
    console.log('');

    // 7. Default Admin (last, after all dependencies)
    console.log('[7/7] Seeding default admin...');
    await seedDefaultAdmin();
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
