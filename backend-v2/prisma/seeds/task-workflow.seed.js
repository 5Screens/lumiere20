/**
 * Seed file for Task workflow
 * Creates a default workflow with statuses and transitions for TASK ticket type
 */

// Status definitions with their categories
const taskStatuses = [
  { code: 'NEW', name: 'New', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'IN_PROGRESS', name: 'In Progress', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 350, posY: 100 },
  { code: 'WAITING', name: 'Waiting', categoryCode: 'ON_HOLD', isInitial: false, posX: 350, posY: 300 },
  { code: 'COMPLETED', name: 'Completed', categoryCode: 'DONE', isInitial: false, posX: 600, posY: 150 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 600, posY: 300 },
];

// Translations for status names
const statusTranslations = [
  // NEW
  { code: 'NEW', locale: 'fr', value: 'Nouveau' },
  { code: 'NEW', locale: 'en', value: 'New' },
  { code: 'NEW', locale: 'es', value: 'Nuevo' },
  { code: 'NEW', locale: 'pt', value: 'Novo' },
  { code: 'NEW', locale: 'de', value: 'Neu' },
  { code: 'NEW', locale: 'it', value: 'Nuovo' },
  // IN_PROGRESS
  { code: 'IN_PROGRESS', locale: 'fr', value: 'En cours' },
  { code: 'IN_PROGRESS', locale: 'en', value: 'In Progress' },
  { code: 'IN_PROGRESS', locale: 'es', value: 'En progreso' },
  { code: 'IN_PROGRESS', locale: 'pt', value: 'Em andamento' },
  { code: 'IN_PROGRESS', locale: 'de', value: 'In Bearbeitung' },
  { code: 'IN_PROGRESS', locale: 'it', value: 'In corso' },
  // WAITING
  { code: 'WAITING', locale: 'fr', value: 'En attente' },
  { code: 'WAITING', locale: 'en', value: 'Waiting' },
  { code: 'WAITING', locale: 'es', value: 'En espera' },
  { code: 'WAITING', locale: 'pt', value: 'Aguardando' },
  { code: 'WAITING', locale: 'de', value: 'Wartend' },
  { code: 'WAITING', locale: 'it', value: 'In attesa' },
  // COMPLETED
  { code: 'COMPLETED', locale: 'fr', value: 'Terminé' },
  { code: 'COMPLETED', locale: 'en', value: 'Completed' },
  { code: 'COMPLETED', locale: 'es', value: 'Completado' },
  { code: 'COMPLETED', locale: 'pt', value: 'Concluído' },
  { code: 'COMPLETED', locale: 'de', value: 'Abgeschlossen' },
  { code: 'COMPLETED', locale: 'it', value: 'Completato' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

// Transition definitions: from -> to with label
const taskTransitions = [
  // From NEW
  { from: 'NEW', to: 'IN_PROGRESS', name: 'Start work', nameFr: 'Démarrer' },
  { from: 'NEW', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'WAITING', name: 'Put on hold', nameFr: 'Mettre en attente' },
  { from: 'IN_PROGRESS', to: 'COMPLETED', name: 'Complete', nameFr: 'Terminer' },
  { from: 'IN_PROGRESS', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From WAITING
  { from: 'WAITING', to: 'IN_PROGRESS', name: 'Resume', nameFr: 'Reprendre' },
  { from: 'WAITING', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From COMPLETED (reopen)
  { from: 'COMPLETED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
];

/**
 * Seed task workflow into the database
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedTaskWorkflow(prisma) {
  console.log('Seeding task workflow...');

  // 1. Get ticket type TASK uuid
  const taskTicketType = await prisma.ticket_types.findUnique({
    where: { code: 'TASK' }
  });

  if (!taskTicketType) {
    console.error('Ticket type TASK not found. Run ticket-types seed first.');
    return;
  }

  // 2. Get workflow status categories
  const categories = await prisma.workflow_status_categories.findMany();
  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.code] = cat.uuid;
  }

  if (Object.keys(categoryMap).length === 0) {
    console.error('No workflow status categories found. Run workflow-status-categories seed first.');
    return;
  }

  // 3. Check if workflow already exists for TASK
  let workflow = await prisma.workflows.findFirst({
    where: {
      entity_type: 'tickets',
      rel_entity_type_uuid: taskTicketType.uuid
    }
  });

  if (workflow) {
    console.log(`  - Workflow for TASK already exists (uuid: ${workflow.uuid})`);
  } else {
    // Create workflow
    workflow = await prisma.workflows.create({
      data: {
        entity_type: 'tickets',
        rel_entity_type_uuid: taskTicketType.uuid,
        name: 'Task Workflow',
        description: 'Default workflow for task tickets',
        is_active: true
      }
    });
    console.log(`  - Created workflow for TASK (uuid: ${workflow.uuid})`);
  }

  // 4. Create or update statuses
  const statusUuidMap = {};
  
  for (const status of taskStatuses) {
    const categoryUuid = categoryMap[status.categoryCode];
    if (!categoryUuid) {
      console.warn(`  - Category ${status.categoryCode} not found, skipping status ${status.code}`);
      continue;
    }

    // Check if status exists
    let existingStatus = await prisma.workflow_statuses.findFirst({
      where: {
        rel_workflow_uuid: workflow.uuid,
        name: status.name
      }
    });

    if (existingStatus) {
      statusUuidMap[status.code] = existingStatus.uuid;
      console.log(`  - Status '${status.name}' already exists`);
    } else {
      const newStatus = await prisma.workflow_statuses.create({
        data: {
          rel_workflow_uuid: workflow.uuid,
          name: status.name,
          rel_category_uuid: categoryUuid,
          is_initial: status.isInitial,
          allow_all_inbound: false,
          position_x: status.posX,
          position_y: status.posY
        }
      });
      statusUuidMap[status.code] = newStatus.uuid;
      console.log(`  - Created status '${status.name}'`);
    }
  }

  // 5. Create translations for statuses
  console.log('  - Creating status translations...');
  for (const trans of statusTranslations) {
    const statusUuid = statusUuidMap[trans.code];
    if (!statusUuid) continue;

    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: 'workflow_statuses',
          entity_uuid: statusUuid,
          field_name: 'name',
          locale: trans.locale
        }
      },
      update: { value: trans.value },
      create: {
        entity_type: 'workflow_statuses',
        entity_uuid: statusUuid,
        field_name: 'name',
        locale: trans.locale,
        value: trans.value
      }
    });
  }

  // 6. Create transitions
  console.log('  - Creating transitions...');
  for (const trans of taskTransitions) {
    const fromStatusUuid = statusUuidMap[trans.from];
    const toStatusUuid = statusUuidMap[trans.to];

    if (!fromStatusUuid || !toStatusUuid) {
      console.warn(`  - Skipping transition ${trans.from} -> ${trans.to}: status not found`);
      continue;
    }

    // Check if transition already exists
    const existingTransition = await prisma.workflow_transitions.findFirst({
      where: {
        rel_workflow_uuid: workflow.uuid,
        rel_to_status_uuid: toStatusUuid,
        sources: {
          some: {
            rel_from_status_uuid: fromStatusUuid
          }
        }
      }
    });

    if (existingTransition) {
      console.log(`  - Transition '${trans.name}' (${trans.from} -> ${trans.to}) already exists`);
      continue;
    }

    // Create transition
    const newTransition = await prisma.workflow_transitions.create({
      data: {
        rel_workflow_uuid: workflow.uuid,
        name: trans.name,
        rel_to_status_uuid: toStatusUuid
      }
    });

    // Create transition source
    await prisma.workflow_transition_sources.create({
      data: {
        rel_transition_uuid: newTransition.uuid,
        rel_from_status_uuid: fromStatusUuid
      }
    });

    console.log(`  - Created transition '${trans.name}' (${trans.from} -> ${trans.to})`);
  }

  console.log('Task workflow seeding completed!');
}

module.exports = { seedTaskWorkflow };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedTaskWorkflow(prisma)
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
