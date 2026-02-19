const { prisma } = require('../client');

/**
 * E2E CRUD Test Data Seed
 * Creates predictable test data for E2E CRUD tests
 * 
 * Naming convention: All E2E test data uses 'E2E-' prefix for easy identification
 */

// Test persons for relations (role_code will be resolved to UUID at seed time)
const e2ePersons = [
  {
    email: 'e2e-requester@test.local',
    first_name: 'E2E',
    last_name: 'Requester',
    is_active: true,
    role_code: 'user'
  },
  {
    email: 'e2e-assignee@test.local',
    first_name: 'E2E',
    last_name: 'Assignee',
    is_active: true,
    role_code: 'technician'
  },
  {
    email: 'e2e-writer@test.local',
    first_name: 'E2E',
    last_name: 'Writer',
    is_active: true,
    role_code: 'user'
  }
];

// Test group for assignment
const e2eGroups = [
  {
    group_name: 'E2E-Test-Group',
    description: 'Group for E2E CRUD tests',
    support_level: 1
  }
];

// Test tasks for Read/Update/Delete tests
const e2eTasks = [
  {
    title: 'E2E-READ-TASK-001',
    description: 'Task for read test - do not modify',
    ticket_type_code: 'TASK'
  },
  {
    title: 'E2E-UPDATE-INLINE-001',
    description: 'Original description for inline update test',
    ticket_type_code: 'TASK'
  },
  {
    title: 'E2E-UPDATE-DRAWER-001',
    description: 'Task for drawer update test',
    ticket_type_code: 'TASK'
  },
  {
    title: 'E2E-DELETE-SINGLE-001',
    description: 'Task to delete in single delete test',
    ticket_type_code: 'TASK'
  },
  {
    title: 'E2E-DELETE-MULTI-001',
    description: 'First task for multi-delete test',
    ticket_type_code: 'TASK'
  },
  {
    title: 'E2E-DELETE-MULTI-002',
    description: 'Second task for multi-delete test',
    ticket_type_code: 'TASK'
  }
];

async function seedE2eCrud() {
  console.log('Seeding E2E CRUD test data...');

  // 1. Create or update test persons
  console.log('  Creating E2E test persons...');
  const personUuids = {};
  
  // Lookup role UUIDs
  const rolesMap = {};
  const roleCodes = [...new Set(e2ePersons.map(p => p.role_code))];
  for (const code of roleCodes) {
    const role = await prisma.roles.findUnique({ where: { code } });
    if (role) rolesMap[code] = role.uuid;
  }

  for (const person of e2ePersons) {
    const { role_code, ...personData } = person;
    const roleUuid = rolesMap[role_code] || null;
    const result = await prisma.persons.upsert({
      where: { email: person.email },
      update: {
        first_name: person.first_name,
        last_name: person.last_name,
        is_active: person.is_active,
        role_uuid: roleUuid
      },
      create: { ...personData, role_uuid: roleUuid }
    });
    personUuids[person.email] = result.uuid;
    console.log(`    - Person '${person.email}' created/updated (${result.uuid})`);
  }

  // 2. Create or update test groups
  console.log('  Creating E2E test groups...');
  const groupUuids = {};
  
  for (const group of e2eGroups) {
    const result = await prisma.groups.upsert({
      where: { group_name: group.group_name },
      update: {
        description: group.description,
        support_level: group.support_level
      },
      create: group
    });
    groupUuids[group.group_name] = result.uuid;
    console.log(`    - Group '${group.group_name}' created/updated (${result.uuid})`);
  }

  // 3. Get initial workflow status for TASK
  console.log('  Getting initial workflow status for TASK...');
  
  // Find workflow config for TASK
  const workflowConfig = await prisma.workflow_entity_config.findFirst({
    where: {
      entity_type: 'tickets',
      ticket_type_code: 'TASK'
    }
  });

  let initialStatusUuid = null;
  if (workflowConfig) {
    // Find initial status in this workflow
    const initialStatus = await prisma.workflow_statuses.findFirst({
      where: {
        rel_workflow_uuid: workflowConfig.rel_workflow_uuid,
        is_initial: true
      }
    });
    if (initialStatus) {
      initialStatusUuid = initialStatus.uuid;
      console.log(`    - Initial status found: ${initialStatus.name} (${initialStatus.uuid})`);
    }
  }

  // 4. Create or update test tasks
  console.log('  Creating E2E test tasks...');
  const writerUuid = personUuids['e2e-writer@test.local'];
  const requesterUuid = personUuids['e2e-requester@test.local'];
  const assigneeUuid = personUuids['e2e-assignee@test.local'];
  const groupUuid = groupUuids['E2E-Test-Group'];

  for (const task of e2eTasks) {
    // Check if task already exists by title
    const existing = await prisma.tickets.findFirst({
      where: { title: task.title }
    });

    if (existing) {
      // Update existing task
      await prisma.tickets.update({
        where: { uuid: existing.uuid },
        data: {
          description: task.description,
          ticket_type_code: task.ticket_type_code,
          writer_uuid: writerUuid,
          requested_by_uuid: requesterUuid,
          assigned_person_uuid: assigneeUuid,
          assigned_group_uuid: groupUuid,
          rel_status_uuid: initialStatusUuid
        }
      });
      console.log(`    - Task '${task.title}' updated (${existing.uuid})`);
    } else {
      // Create new task
      const created = await prisma.tickets.create({
        data: {
          title: task.title,
          description: task.description,
          ticket_type_code: task.ticket_type_code,
          writer_uuid: writerUuid,
          requested_by_uuid: requesterUuid,
          assigned_person_uuid: assigneeUuid,
          assigned_group_uuid: groupUuid,
          rel_status_uuid: initialStatusUuid
        }
      });
      console.log(`    - Task '${task.title}' created (${created.uuid})`);
    }
  }

  console.log('E2E CRUD test data seeding completed!');
  
  // Return UUIDs for reference
  return {
    persons: personUuids,
    groups: groupUuids,
    initialStatusUuid
  };
}

// Cleanup function to remove E2E test data
async function cleanupE2eCrud() {
  console.log('Cleaning up E2E CRUD test data...');

  // Delete tasks with E2E- prefix
  const deletedTasks = await prisma.tickets.deleteMany({
    where: {
      title: { startsWith: 'E2E-' }
    }
  });
  console.log(`  - Deleted ${deletedTasks.count} E2E tasks`);

  // Delete groups with E2E- prefix
  const deletedGroups = await prisma.groups.deleteMany({
    where: {
      group_name: { startsWith: 'E2E-' }
    }
  });
  console.log(`  - Deleted ${deletedGroups.count} E2E groups`);

  // Delete persons with e2e- prefix in email
  const deletedPersons = await prisma.persons.deleteMany({
    where: {
      email: { startsWith: 'e2e-' }
    }
  });
  console.log(`  - Deleted ${deletedPersons.count} E2E persons`);

  console.log('E2E CRUD test data cleanup completed!');
}

module.exports = { 
  seedE2eCrud, 
  cleanupE2eCrud,
  e2ePersons,
  e2eGroups,
  e2eTasks
};
