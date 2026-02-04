/**
 * Seed file for Service Management workflows
 * Creates workflows for: SERVICE, SERVICE_OFFERING
 * Based on ITIL Service Lifecycle best practices
 */

// ============================================
// SERVICE WORKFLOW (Service Lifecycle)
// ============================================
const serviceStatuses = [
  { code: 'DRAFT', name: 'Draft', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'DESIGN', name: 'Design', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 250, posY: 150 },
  { code: 'DEVELOPMENT', name: 'Development', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 150 },
  { code: 'TESTING', name: 'Testing', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 550, posY: 150 },
  { code: 'APPROVED', name: 'Approved', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 700, posY: 100 },
  { code: 'OPERATIONAL', name: 'Operational', categoryCode: 'DONE', isInitial: false, posX: 850, posY: 150 },
  { code: 'RETIRING', name: 'Retiring', categoryCode: 'ON_HOLD', isInitial: false, posX: 850, posY: 300 },
  { code: 'RETIRED', name: 'Retired', categoryCode: 'DONE', isInitial: false, posX: 1000, posY: 200 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 350 },
];

const serviceStatusTranslations = [
  // DRAFT
  { code: 'DRAFT', locale: 'fr', value: 'Brouillon' },
  { code: 'DRAFT', locale: 'en', value: 'Draft' },
  { code: 'DRAFT', locale: 'es', value: 'Borrador' },
  { code: 'DRAFT', locale: 'pt', value: 'Rascunho' },
  { code: 'DRAFT', locale: 'de', value: 'Entwurf' },
  { code: 'DRAFT', locale: 'it', value: 'Bozza' },
  // DESIGN
  { code: 'DESIGN', locale: 'fr', value: 'Conception' },
  { code: 'DESIGN', locale: 'en', value: 'Design' },
  { code: 'DESIGN', locale: 'es', value: 'Diseño' },
  { code: 'DESIGN', locale: 'pt', value: 'Design' },
  { code: 'DESIGN', locale: 'de', value: 'Design' },
  { code: 'DESIGN', locale: 'it', value: 'Progettazione' },
  // DEVELOPMENT
  { code: 'DEVELOPMENT', locale: 'fr', value: 'Développement' },
  { code: 'DEVELOPMENT', locale: 'en', value: 'Development' },
  { code: 'DEVELOPMENT', locale: 'es', value: 'Desarrollo' },
  { code: 'DEVELOPMENT', locale: 'pt', value: 'Desenvolvimento' },
  { code: 'DEVELOPMENT', locale: 'de', value: 'Entwicklung' },
  { code: 'DEVELOPMENT', locale: 'it', value: 'Sviluppo' },
  // TESTING
  { code: 'TESTING', locale: 'fr', value: 'Test' },
  { code: 'TESTING', locale: 'en', value: 'Testing' },
  { code: 'TESTING', locale: 'es', value: 'Pruebas' },
  { code: 'TESTING', locale: 'pt', value: 'Teste' },
  { code: 'TESTING', locale: 'de', value: 'Test' },
  { code: 'TESTING', locale: 'it', value: 'Test' },
  // APPROVED
  { code: 'APPROVED', locale: 'fr', value: 'Approuvé' },
  { code: 'APPROVED', locale: 'en', value: 'Approved' },
  { code: 'APPROVED', locale: 'es', value: 'Aprobado' },
  { code: 'APPROVED', locale: 'pt', value: 'Aprovado' },
  { code: 'APPROVED', locale: 'de', value: 'Genehmigt' },
  { code: 'APPROVED', locale: 'it', value: 'Approvato' },
  // OPERATIONAL
  { code: 'OPERATIONAL', locale: 'fr', value: 'Opérationnel' },
  { code: 'OPERATIONAL', locale: 'en', value: 'Operational' },
  { code: 'OPERATIONAL', locale: 'es', value: 'Operacional' },
  { code: 'OPERATIONAL', locale: 'pt', value: 'Operacional' },
  { code: 'OPERATIONAL', locale: 'de', value: 'Betriebsbereit' },
  { code: 'OPERATIONAL', locale: 'it', value: 'Operativo' },
  // RETIRING
  { code: 'RETIRING', locale: 'fr', value: 'En retrait' },
  { code: 'RETIRING', locale: 'en', value: 'Retiring' },
  { code: 'RETIRING', locale: 'es', value: 'En retiro' },
  { code: 'RETIRING', locale: 'pt', value: 'Em retirada' },
  { code: 'RETIRING', locale: 'de', value: 'Wird zurückgezogen' },
  { code: 'RETIRING', locale: 'it', value: 'In ritiro' },
  // RETIRED
  { code: 'RETIRED', locale: 'fr', value: 'Retiré' },
  { code: 'RETIRED', locale: 'en', value: 'Retired' },
  { code: 'RETIRED', locale: 'es', value: 'Retirado' },
  { code: 'RETIRED', locale: 'pt', value: 'Retirado' },
  { code: 'RETIRED', locale: 'de', value: 'Zurückgezogen' },
  { code: 'RETIRED', locale: 'it', value: 'Ritirato' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const serviceTransitions = [
  // From DRAFT
  { from: 'DRAFT', to: 'DESIGN', name: 'Start design', nameFr: 'Démarrer la conception' },
  { from: 'DRAFT', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From DESIGN
  { from: 'DESIGN', to: 'DEVELOPMENT', name: 'Start development', nameFr: 'Démarrer le développement' },
  { from: 'DESIGN', to: 'DRAFT', name: 'Back to draft', nameFr: 'Retour au brouillon' },
  { from: 'DESIGN', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From DEVELOPMENT
  { from: 'DEVELOPMENT', to: 'TESTING', name: 'Start testing', nameFr: 'Démarrer les tests' },
  { from: 'DEVELOPMENT', to: 'DESIGN', name: 'Back to design', nameFr: 'Retour à la conception' },
  { from: 'DEVELOPMENT', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From TESTING
  { from: 'TESTING', to: 'APPROVED', name: 'Approve', nameFr: 'Approuver' },
  { from: 'TESTING', to: 'DEVELOPMENT', name: 'Back to development', nameFr: 'Retour au développement' },
  { from: 'TESTING', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From APPROVED
  { from: 'APPROVED', to: 'OPERATIONAL', name: 'Go live', nameFr: 'Mise en production' },
  { from: 'APPROVED', to: 'TESTING', name: 'Back to testing', nameFr: 'Retour aux tests' },
  { from: 'APPROVED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From OPERATIONAL
  { from: 'OPERATIONAL', to: 'RETIRING', name: 'Start retirement', nameFr: 'Démarrer le retrait' },
  { from: 'OPERATIONAL', to: 'DESIGN', name: 'Major revision', nameFr: 'Révision majeure' },
  // From RETIRING
  { from: 'RETIRING', to: 'RETIRED', name: 'Complete retirement', nameFr: 'Terminer le retrait' },
  { from: 'RETIRING', to: 'OPERATIONAL', name: 'Cancel retirement', nameFr: 'Annuler le retrait' },
  // From RETIRED (reactivate)
  { from: 'RETIRED', to: 'DESIGN', name: 'Reactivate', nameFr: 'Réactiver' },
];

// ============================================
// SERVICE OFFERING WORKFLOW (Offering Lifecycle)
// ============================================
const serviceOfferingStatuses = [
  { code: 'DRAFT', name: 'Draft', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'PENDING_APPROVAL', name: 'Pending Approval', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 250, posY: 150 },
  { code: 'APPROVED', name: 'Approved', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 100 },
  { code: 'CATALOG', name: 'In Catalog', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 150 },
  { code: 'SUSPENDED', name: 'Suspended', categoryCode: 'ON_HOLD', isInitial: false, posX: 550, posY: 300 },
  { code: 'DEPRECATED', name: 'Deprecated', categoryCode: 'ON_HOLD', isInitial: false, posX: 700, posY: 300 },
  { code: 'RETIRED', name: 'Retired', categoryCode: 'DONE', isInitial: false, posX: 850, posY: 200 },
  { code: 'REJECTED', name: 'Rejected', categoryCode: 'DONE', isInitial: false, posX: 400, posY: 350 },
];

const serviceOfferingStatusTranslations = [
  // DRAFT
  { code: 'DRAFT', locale: 'fr', value: 'Brouillon' },
  { code: 'DRAFT', locale: 'en', value: 'Draft' },
  { code: 'DRAFT', locale: 'es', value: 'Borrador' },
  { code: 'DRAFT', locale: 'pt', value: 'Rascunho' },
  { code: 'DRAFT', locale: 'de', value: 'Entwurf' },
  { code: 'DRAFT', locale: 'it', value: 'Bozza' },
  // PENDING_APPROVAL
  { code: 'PENDING_APPROVAL', locale: 'fr', value: 'En attente d\'approbation' },
  { code: 'PENDING_APPROVAL', locale: 'en', value: 'Pending Approval' },
  { code: 'PENDING_APPROVAL', locale: 'es', value: 'Pendiente de aprobación' },
  { code: 'PENDING_APPROVAL', locale: 'pt', value: 'Aguardando aprovação' },
  { code: 'PENDING_APPROVAL', locale: 'de', value: 'Genehmigung ausstehend' },
  { code: 'PENDING_APPROVAL', locale: 'it', value: 'In attesa di approvazione' },
  // APPROVED
  { code: 'APPROVED', locale: 'fr', value: 'Approuvé' },
  { code: 'APPROVED', locale: 'en', value: 'Approved' },
  { code: 'APPROVED', locale: 'es', value: 'Aprobado' },
  { code: 'APPROVED', locale: 'pt', value: 'Aprovado' },
  { code: 'APPROVED', locale: 'de', value: 'Genehmigt' },
  { code: 'APPROVED', locale: 'it', value: 'Approvato' },
  // CATALOG
  { code: 'CATALOG', locale: 'fr', value: 'Au catalogue' },
  { code: 'CATALOG', locale: 'en', value: 'In Catalog' },
  { code: 'CATALOG', locale: 'es', value: 'En catálogo' },
  { code: 'CATALOG', locale: 'pt', value: 'No catálogo' },
  { code: 'CATALOG', locale: 'de', value: 'Im Katalog' },
  { code: 'CATALOG', locale: 'it', value: 'Nel catalogo' },
  // SUSPENDED
  { code: 'SUSPENDED', locale: 'fr', value: 'Suspendu' },
  { code: 'SUSPENDED', locale: 'en', value: 'Suspended' },
  { code: 'SUSPENDED', locale: 'es', value: 'Suspendido' },
  { code: 'SUSPENDED', locale: 'pt', value: 'Suspenso' },
  { code: 'SUSPENDED', locale: 'de', value: 'Ausgesetzt' },
  { code: 'SUSPENDED', locale: 'it', value: 'Sospeso' },
  // DEPRECATED
  { code: 'DEPRECATED', locale: 'fr', value: 'Obsolète' },
  { code: 'DEPRECATED', locale: 'en', value: 'Deprecated' },
  { code: 'DEPRECATED', locale: 'es', value: 'Obsoleto' },
  { code: 'DEPRECATED', locale: 'pt', value: 'Obsoleto' },
  { code: 'DEPRECATED', locale: 'de', value: 'Veraltet' },
  { code: 'DEPRECATED', locale: 'it', value: 'Obsoleto' },
  // RETIRED
  { code: 'RETIRED', locale: 'fr', value: 'Retiré' },
  { code: 'RETIRED', locale: 'en', value: 'Retired' },
  { code: 'RETIRED', locale: 'es', value: 'Retirado' },
  { code: 'RETIRED', locale: 'pt', value: 'Retirado' },
  { code: 'RETIRED', locale: 'de', value: 'Zurückgezogen' },
  { code: 'RETIRED', locale: 'it', value: 'Ritirato' },
  // REJECTED
  { code: 'REJECTED', locale: 'fr', value: 'Rejeté' },
  { code: 'REJECTED', locale: 'en', value: 'Rejected' },
  { code: 'REJECTED', locale: 'es', value: 'Rechazado' },
  { code: 'REJECTED', locale: 'pt', value: 'Rejeitado' },
  { code: 'REJECTED', locale: 'de', value: 'Abgelehnt' },
  { code: 'REJECTED', locale: 'it', value: 'Rifiutato' },
];

const serviceOfferingTransitions = [
  // From DRAFT
  { from: 'DRAFT', to: 'PENDING_APPROVAL', name: 'Submit for approval', nameFr: 'Soumettre pour approbation' },
  // From PENDING_APPROVAL
  { from: 'PENDING_APPROVAL', to: 'APPROVED', name: 'Approve', nameFr: 'Approuver' },
  { from: 'PENDING_APPROVAL', to: 'REJECTED', name: 'Reject', nameFr: 'Rejeter' },
  { from: 'PENDING_APPROVAL', to: 'DRAFT', name: 'Request changes', nameFr: 'Demander des modifications' },
  // From APPROVED
  { from: 'APPROVED', to: 'CATALOG', name: 'Publish to catalog', nameFr: 'Publier au catalogue' },
  { from: 'APPROVED', to: 'DRAFT', name: 'Return to draft', nameFr: 'Retourner en brouillon' },
  // From CATALOG
  { from: 'CATALOG', to: 'SUSPENDED', name: 'Suspend', nameFr: 'Suspendre' },
  { from: 'CATALOG', to: 'DEPRECATED', name: 'Deprecate', nameFr: 'Marquer obsolète' },
  { from: 'CATALOG', to: 'DRAFT', name: 'Revise', nameFr: 'Réviser' },
  // From SUSPENDED
  { from: 'SUSPENDED', to: 'CATALOG', name: 'Reactivate', nameFr: 'Réactiver' },
  { from: 'SUSPENDED', to: 'DEPRECATED', name: 'Deprecate', nameFr: 'Marquer obsolète' },
  { from: 'SUSPENDED', to: 'RETIRED', name: 'Retire', nameFr: 'Retirer' },
  // From DEPRECATED
  { from: 'DEPRECATED', to: 'RETIRED', name: 'Retire', nameFr: 'Retirer' },
  { from: 'DEPRECATED', to: 'CATALOG', name: 'Restore', nameFr: 'Restaurer' },
  // From REJECTED
  { from: 'REJECTED', to: 'DRAFT', name: 'Revise', nameFr: 'Réviser' },
  // From RETIRED (reactivate)
  { from: 'RETIRED', to: 'DRAFT', name: 'Reactivate', nameFr: 'Réactiver' },
];

// ============================================
// GENERIC WORKFLOW SEEDING FUNCTION FOR SERVICES
// ============================================

/**
 * Create a workflow for services (not tickets)
 * @param {import('@prisma/client').PrismaClient} prisma 
 * @param {string} entityType - 'services' or 'service_offerings'
 * @param {string} workflowName 
 * @param {string} workflowDescription 
 * @param {Array} statuses 
 * @param {Array} statusTranslations 
 * @param {Array} transitions 
 */
async function createServiceWorkflow(prisma, entityType, workflowName, workflowDescription, statuses, statusTranslations, transitions) {
  console.log(`\nSeeding ${entityType} workflow...`);

  // 1. Get workflow status categories
  const categories = await prisma.workflow_status_categories.findMany();
  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.code] = cat.uuid;
  }

  if (Object.keys(categoryMap).length === 0) {
    console.error('  - No workflow status categories found. Run workflow-status-categories seed first.');
    return;
  }

  // 2. Check if workflow already exists for this entity type
  let workflow = await prisma.workflows.findFirst({
    where: {
      entity_type: entityType,
      rel_entity_type_uuid: null // Services don't have a type UUID like tickets
    }
  });

  if (workflow) {
    console.log(`  - Workflow for ${entityType} already exists (uuid: ${workflow.uuid})`);
  } else {
    // Create workflow
    workflow = await prisma.workflows.create({
      data: {
        entity_type: entityType,
        rel_entity_type_uuid: null,
        name: workflowName,
        description: workflowDescription,
        is_active: true
      }
    });
    console.log(`  - Created workflow for ${entityType} (uuid: ${workflow.uuid})`);
  }

  // 3. Create or update statuses
  const statusUuidMap = {};
  
  for (const status of statuses) {
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

  // 4. Create translations for statuses
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

  // 5. Create transitions
  console.log('  - Creating transitions...');
  for (const trans of transitions) {
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

  console.log(`${entityType} workflow seeding completed!`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

/**
 * Seed all Service Management workflows
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedServiceWorkflows(prisma) {
  console.log('='.repeat(50));
  console.log('Seeding Service Management workflows...');
  console.log('='.repeat(50));

  // Service workflow
  await createServiceWorkflow(
    prisma,
    'services',
    'Service Lifecycle Workflow',
    'ITIL-based service lifecycle management workflow',
    serviceStatuses,
    serviceStatusTranslations,
    serviceTransitions
  );

  // Service Offering workflow
  await createServiceWorkflow(
    prisma,
    'service_offerings',
    'Service Offering Workflow',
    'Service offering catalog lifecycle workflow',
    serviceOfferingStatuses,
    serviceOfferingStatusTranslations,
    serviceOfferingTransitions
  );

  console.log('\n' + '='.repeat(50));
  console.log('Service Management workflows seeding completed!');
  console.log('='.repeat(50));
}

module.exports = { seedServiceWorkflows };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedServiceWorkflows(prisma)
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
