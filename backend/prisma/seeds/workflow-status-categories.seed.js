/**
 * Seed file for workflow_status_categories table
 * Contains the 4 default status categories: Backlog, In Progress, On Hold, Done
 */

const categories = [
  { 
    code: 'BACKLOG', 
    color: '#6b7280',  // Gray
    display_order: 1,
    is_active: true
  },
  { 
    code: 'IN_PROGRESS', 
    color: '#3b82f6',  // Blue
    display_order: 2,
    is_active: true
  },
  { 
    code: 'ON_HOLD', 
    color: '#f59e0b',  // Orange/Amber
    display_order: 3,
    is_active: true
  },
  { 
    code: 'DONE', 
    color: '#22c55e',  // Green
    display_order: 4,
    is_active: true
  },
];

// Translations for each category
const translations = [
  // BACKLOG
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'fr', code: 'BACKLOG', value: 'À faire' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'en', code: 'BACKLOG', value: 'To do' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'es', code: 'BACKLOG', value: 'Por hacer' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'pt', code: 'BACKLOG', value: 'A fazer' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'de', code: 'BACKLOG', value: 'Zu erledigen' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'it', code: 'BACKLOG', value: 'Da fare' },
  
  // IN_PROGRESS
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'fr', code: 'IN_PROGRESS', value: 'En cours' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'en', code: 'IN_PROGRESS', value: 'In progress' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'es', code: 'IN_PROGRESS', value: 'En progreso' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'pt', code: 'IN_PROGRESS', value: 'Em andamento' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'de', code: 'IN_PROGRESS', value: 'In Bearbeitung' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'it', code: 'IN_PROGRESS', value: 'In corso' },
  
  // ON_HOLD
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'fr', code: 'ON_HOLD', value: 'En attente' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'en', code: 'ON_HOLD', value: 'On hold' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'es', code: 'ON_HOLD', value: 'En espera' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'pt', code: 'ON_HOLD', value: 'Em espera' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'de', code: 'ON_HOLD', value: 'Wartend' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'it', code: 'ON_HOLD', value: 'In attesa' },
  
  // DONE
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'fr', code: 'DONE', value: 'Terminé' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'en', code: 'DONE', value: 'Done' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'es', code: 'DONE', value: 'Hecho' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'pt', code: 'DONE', value: 'Concluído' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'de', code: 'DONE', value: 'Erledigt' },
  { entity_type: 'workflow_status_categories', field_name: 'label', locale: 'it', code: 'DONE', value: 'Completato' },
];

/**
 * Seed workflow status categories into the database
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedWorkflowStatusCategories(prisma) {
  console.log('Seeding workflow status categories...');
  
  // Create a map to store category UUIDs by code
  const categoryUuids = {};
  
  // Upsert categories
  for (const category of categories) {
    const result = await prisma.workflow_status_categories.upsert({
      where: { code: category.code },
      update: {
        color: category.color,
        display_order: category.display_order,
        // Don't update is_active to preserve user changes
      },
      create: category,
    });
    categoryUuids[category.code] = result.uuid;
  }
  
  console.log(`Seeded ${categories.length} workflow status categories`);
  
  // Upsert translations
  console.log('Seeding workflow status category translations...');
  
  for (const translation of translations) {
    const entityUuid = categoryUuids[translation.code];
    if (!entityUuid) {
      console.warn(`Category not found for code: ${translation.code}`);
      continue;
    }
    
    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: translation.entity_type,
          entity_uuid: entityUuid,
          field_name: translation.field_name,
          locale: translation.locale,
        },
      },
      update: {
        value: translation.value,
      },
      create: {
        entity_type: translation.entity_type,
        entity_uuid: entityUuid,
        field_name: translation.field_name,
        locale: translation.locale,
        value: translation.value,
      },
    });
  }
  
  console.log(`Seeded ${translations.length} translations for workflow status categories`);
}

module.exports = { seedWorkflowStatusCategories, categories, translations };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedWorkflowStatusCategories(prisma)
    .then(() => {
      console.log('Seed completed successfully');
      prisma.$disconnect();
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}
