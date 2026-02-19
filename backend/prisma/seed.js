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
const { seedItsmWorkflows } = require('./seeds/itsm-workflows.seed');
const { seedAgileWorkflows } = require('./seeds/agile-workflows.seed');
const { seedServiceWorkflows } = require('./seeds/service-workflows.seed');
const { seedObjectSetup } = require('./seeds/object-setup');
const { seedSymptoms } = require('./seeds/symptoms.seed');
const { seedTicketTypeFieldsTranslations } = require('./seeds/ticket-type-fields-translations.seed');
const { seedTimezones } = require('./seeds/timezones.seed');
const { seedRoles } = require('./seeds/roles.seed');

async function main() {
  console.log('========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  try {
    // 1. Languages (required for multi-language support)
    console.log('[1/20] Seeding languages...');
    await seedLanguages(prisma);
    console.log('');

    // 2. Object metadata (required for dynamic UI)
    console.log('[2/20] Seeding object metadata...');
    await seedObjectMetadata();
    console.log('');

    // 3. CI Categories (required before CI Types)
    console.log('[3/20] Seeding CI categories...');
    await seedCiCategories();
    console.log('');

    // 4. CI Types with translations
    console.log('[4/20] Seeding CI types...');
    await seedCiTypes();
    console.log('');

    // 5. CI Type Fields (extended fields per CI type)
    console.log('[5/20] Seeding CI type fields...');
    await seedCiTypeFields();
    console.log('');

    // 6. CI Models (demo server models catalog)
    console.log('[6/20] Seeding CI models (demo data)...');
    await seedConfigurationItems();
    console.log('');

    // 7. Ticket Types (required before tickets)
    console.log('[7/20] Seeding ticket types...');
    await seedTicketTypes(prisma);
    console.log('');

    // 8. Ticket Type Fields (extended fields per ticket type)
    console.log('[8/20] Seeding ticket type fields...');
    await seedTicketTypeFields();
    console.log('');

    // 9. Ticket Type Fields Translations
    console.log('[9/20] Seeding ticket type fields translations...');
    await seedTicketTypeFieldsTranslations();
    console.log('');

    // 10. Workflow Status Categories
    console.log('[10/20] Seeding workflow status categories...');
    await seedWorkflowStatusCategories(prisma);
    console.log('');

    // 11. Workflow Entity Config
    console.log('[11/20] Seeding workflow entity config...');
    await seedWorkflowEntityConfig(prisma);
    console.log('');

    // 12. Task Workflow (statuses and transitions for TASK tickets)
    console.log('[12/20] Seeding task workflow...');
    await seedTaskWorkflow(prisma);
    console.log('');

    // 13. ITSM Workflows (Incident, Problem, Change, Knowledge)
    console.log('[13/20] Seeding ITSM workflows...');
    await seedItsmWorkflows(prisma);
    console.log('');

    // 14. Agile Workflows (User Story, Project, Sprint, Epic, Defect)
    console.log('[14/20] Seeding Agile workflows...');
    await seedAgileWorkflows(prisma);
    console.log('');

    // 15. Service Workflows (Service, Service Offering)
    console.log('[15/20] Seeding Service workflows...');
    await seedServiceWorkflows(prisma);
    console.log('');

    // 16. Timezones (reference data for calendars)
    console.log('[16/20] Seeding timezones...');
    await seedTimezones();
    console.log('');

    // 17. Object Setup (business objects metadata configuration)
    console.log('[17/20] Seeding object setup...');
    await seedObjectSetup();
    console.log('');

    // 18. Symptoms (for incident classification)
    console.log('[18/20] Seeding symptoms...');
    await seedSymptoms();
    console.log('');

    // 19. Roles (reference data for persons)
    console.log('[19/20] Seeding roles...');
    await seedRoles();
    console.log('');

    // 20. Default Admin (last, after all dependencies)
    console.log('[20/20] Seeding default admin...');
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
