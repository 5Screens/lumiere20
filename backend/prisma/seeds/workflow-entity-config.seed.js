/**
 * Seed file for workflow_entity_config table
 * Defines how workflows map to entity subtypes for each entity type
 */

const entityConfigs = [
  {
    entity_type: 'configuration_items',
    subtype_field: 'ci_type',
    subtype_table: 'ci_types',
    subtype_uuid_field: 'uuid',
    subtype_code_field: 'code',
    subtype_label_field: 'label',
    subtype_options: null,
    description: 'Configuration items use ci_type field linked to ci_types table',
    is_active: true
  },
  {
    entity_type: 'tickets',
    subtype_field: 'ticket_type_code',
    subtype_table: 'ticket_types',
    subtype_uuid_field: 'uuid',
    subtype_code_field: 'code',
    subtype_label_field: 'label',
    subtype_options: null,
    description: 'Tickets use ticket_type_code field linked to ticket_types table',
    is_active: true
  },
  {
    entity_type: 'persons',
    subtype_field: 'role',
    subtype_table: null,
    subtype_uuid_field: null,
    subtype_code_field: null,
    subtype_label_field: null,
    subtype_options: ['admin', 'user', 'manager', 'technician', 'analyst'],
    description: 'Persons use role field with static options (no table)',
    is_active: true
  },
  {
    entity_type: 'locations',
    subtype_field: 'type',
    subtype_table: null,
    subtype_uuid_field: null,
    subtype_code_field: null,
    subtype_label_field: null,
    subtype_options: ['building', 'floor', 'room', 'datacenter', 'office', 'warehouse'],
    description: 'Locations use type field with static options (no table)',
    is_active: true
  },
  {
    entity_type: 'entities',
    subtype_field: 'entity_type',
    subtype_table: null,
    subtype_uuid_field: null,
    subtype_code_field: null,
    subtype_label_field: null,
    subtype_options: ['company', 'department', 'division', 'subsidiary', 'partner'],
    description: 'Entities use entity_type field with static options (no table)',
    is_active: true
  },
  {
    entity_type: 'services',
    subtype_field: 'lifecycle_status',
    subtype_table: null,
    subtype_uuid_field: null,
    subtype_code_field: null,
    subtype_label_field: null,
    subtype_options: ['draft', 'active', 'deprecated', 'retired'],
    description: 'Services use lifecycle_status field with static options',
    is_active: true
  }
];

/**
 * Seed workflow entity configurations into the database
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedWorkflowEntityConfig(prisma) {
  console.log('Seeding workflow entity configurations...');
  
  for (const config of entityConfigs) {
    await prisma.workflow_entity_config.upsert({
      where: { entity_type: config.entity_type },
      update: {
        subtype_field: config.subtype_field,
        subtype_table: config.subtype_table,
        subtype_uuid_field: config.subtype_uuid_field,
        subtype_code_field: config.subtype_code_field,
        subtype_label_field: config.subtype_label_field,
        subtype_options: config.subtype_options,
        description: config.description,
        // Don't update is_active to preserve user changes
      },
      create: config,
    });
  }
  
  console.log(`Seeded ${entityConfigs.length} workflow entity configurations`);
}

module.exports = { seedWorkflowEntityConfig, entityConfigs };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedWorkflowEntityConfig(prisma)
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
