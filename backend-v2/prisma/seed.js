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
const { seedCiCategories } = require('./seeds/ci-categories');
const { seedCiTypes } = require('./seeds/ci-types');
const { seedCiTypeFields } = require('./seeds/ci-type-fields');
const { seedConfigurationItems } = require('./seeds/ci-models');
const { seedDefaultAdmin } = require('./seeds/default-admin.seed');
const { seedWorkflowStatusCategories } = require('./seeds/workflow-status-categories.seed');
const { seedWorkflowEntityConfig } = require('./seeds/workflow-entity-config.seed');
const { seedTicketTypes } = require('./seeds/ticket-types.seed');
const { seedTicketTypeFields } = require('./seeds/ticket-type-fields.seed');
const { seedTaskWorkflow } = require('./seeds/task-workflow.seed');

async function main() {
  console.log('========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  try {
    // 1. Languages (required for multi-language support)
    console.log('[1/9] Seeding languages...');
    await seedLanguages(prisma);
    console.log('');

    // 2. Object metadata (required for dynamic UI)
    console.log('[2/9] Seeding object metadata...');
    await seedObjectMetadata();
    console.log('');

    // 3. CI Categories (required before CI Types)
    console.log('[3/9] Seeding CI categories...');
    await seedCiCategories();
    console.log('');

    // 4. CI Types with translations
    console.log('[4/9] Seeding CI types...');
    await seedCiTypes();
    console.log('');

    // 5. CI Type Fields (extended fields per CI type)
    console.log('[5/9] Seeding CI type fields...');
    await seedCiTypeFields();
    console.log('');

    // 6. CI Models (demo server models catalog)
    console.log('[6/9] Seeding CI models (demo data)...');
    await seedConfigurationItems();
    console.log('');

    // 7. Ticket Types (required before tickets)
    console.log('[7/12] Seeding ticket types...');
    await seedTicketTypes(prisma);
    console.log('');

    // 8. Ticket Type Fields (extended fields per ticket type)
    console.log('[8/12] Seeding ticket type fields...');
    await seedTicketTypeFields();
    console.log('');

    // 9. Workflow Status Categories
    console.log('[9/12] Seeding workflow status categories...');
    await seedWorkflowStatusCategories(prisma);
    console.log('');

    // 10. Workflow Entity Config
    console.log('[10/12] Seeding workflow entity config...');
    await seedWorkflowEntityConfig(prisma);
    console.log('');

    // 11. Task Workflow (statuses and transitions for TASK tickets)
    console.log('[11/12] Seeding task workflow...');
    await seedTaskWorkflow(prisma);
    console.log('');

    // 12. Default Admin (last, after all dependencies)
    console.log('[12/12] Seeding default admin...');
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
