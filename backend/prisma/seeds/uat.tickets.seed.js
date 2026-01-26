/**
 * UAT seed for creating a large dataset of tickets.
 * Creates 50,000 tickets for each ticket type.
 *
 * Usage:
 *   node prisma/seeds/run-single.js uat-tickets
 *
 * Options (env vars):
 *   - UAT_TICKETS_PER_TYPE: number of tickets per type (default: 50000)
 *   - UAT_TICKETS_BATCH_SIZE: insert batch size (default: 1000)
 */

const DEFAULT_TICKETS_PER_TYPE = 10000;
const DEFAULT_BATCH_SIZE = 1000;

const parseIntOr = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

// Ticket title templates per type
const TITLE_TEMPLATES = {
  TASK: [
    'Complete documentation for {subject}',
    'Review {subject} configuration',
    'Update {subject} settings',
    'Prepare {subject} report',
    'Validate {subject} requirements',
    'Configure {subject} parameters',
    'Test {subject} functionality',
    'Deploy {subject} changes',
    'Audit {subject} compliance',
    'Optimize {subject} performance'
  ],
  INCIDENT: [
    '{subject} is not responding',
    'Error accessing {subject}',
    '{subject} performance degradation',
    'Unable to connect to {subject}',
    '{subject} service unavailable',
    'Timeout when accessing {subject}',
    '{subject} authentication failure',
    'Data sync issue with {subject}',
    '{subject} returning errors',
    'Unexpected behavior in {subject}'
  ],
  PROBLEM: [
    'Recurring {subject} failures',
    'Root cause analysis for {subject}',
    'Investigate {subject} instability',
    'Pattern of {subject} errors',
    'Systematic {subject} issues',
    'Underlying {subject} defect',
    'Chronic {subject} performance issues',
    'Repeated {subject} outages',
    'Persistent {subject} connectivity problems',
    'Ongoing {subject} reliability concerns'
  ],
  CHANGE: [
    'Upgrade {subject} to latest version',
    'Migrate {subject} to new infrastructure',
    'Implement {subject} security patch',
    'Reconfigure {subject} settings',
    'Replace {subject} hardware',
    'Expand {subject} capacity',
    'Consolidate {subject} instances',
    'Standardize {subject} configuration',
    'Automate {subject} deployment',
    'Modernize {subject} architecture'
  ],
  KNOWLEDGE: [
    'How to configure {subject}',
    'Troubleshooting {subject} issues',
    'Best practices for {subject}',
    '{subject} installation guide',
    '{subject} FAQ',
    'Understanding {subject} architecture',
    '{subject} security guidelines',
    'Optimizing {subject} performance',
    '{subject} integration patterns',
    '{subject} maintenance procedures'
  ],
  USER_STORY: [
    'As a user, I want to access {subject}',
    'As an admin, I need to configure {subject}',
    'As a developer, I want to integrate {subject}',
    'As a manager, I need {subject} reports',
    'As a support agent, I want to monitor {subject}',
    'As an operator, I need to manage {subject}',
    'As a customer, I want to use {subject}',
    'As a tester, I need to validate {subject}',
    'As an analyst, I want to query {subject}',
    'As a stakeholder, I need {subject} visibility'
  ],
  SPRINT: [
    'Sprint {number} - {subject} Development',
    'Sprint {number} - {subject} Testing',
    'Sprint {number} - {subject} Integration',
    'Sprint {number} - {subject} Deployment',
    'Sprint {number} - {subject} Optimization',
    'Sprint {number} - {subject} Refactoring',
    'Sprint {number} - {subject} Documentation',
    'Sprint {number} - {subject} Security',
    'Sprint {number} - {subject} Performance',
    'Sprint {number} - {subject} Stabilization'
  ],
  EPIC: [
    '{subject} Platform Modernization',
    '{subject} Cloud Migration',
    '{subject} Security Enhancement',
    '{subject} Performance Optimization',
    '{subject} User Experience Redesign',
    '{subject} API Development',
    '{subject} Data Analytics',
    '{subject} Automation Initiative',
    '{subject} Integration Hub',
    '{subject} Compliance Program'
  ],
  DEFECT: [
    'Bug in {subject} validation',
    '{subject} calculation error',
    'UI glitch in {subject}',
    '{subject} data corruption',
    'Memory leak in {subject}',
    '{subject} race condition',
    'Incorrect {subject} output',
    '{subject} null pointer exception',
    '{subject} encoding issue',
    'Broken {subject} functionality'
  ],
  PROJECT: [
    '{subject} Implementation Project',
    '{subject} Upgrade Project',
    '{subject} Migration Project',
    '{subject} Integration Project',
    '{subject} Rollout Project',
    '{subject} Transformation Project',
    '{subject} Consolidation Project',
    '{subject} Expansion Project',
    '{subject} Optimization Project',
    '{subject} Modernization Project'
  ]
};

// Subjects for ticket titles
const SUBJECTS = [
  'Email System', 'Database Server', 'Web Application', 'Network Infrastructure', 'VPN Gateway',
  'Active Directory', 'File Server', 'Backup System', 'Monitoring Platform', 'Security Scanner',
  'Load Balancer', 'DNS Server', 'DHCP Service', 'Print Server', 'Collaboration Platform',
  'CRM System', 'ERP Module', 'HR Portal', 'Finance Application', 'Inventory System',
  'Customer Portal', 'Partner Gateway', 'API Gateway', 'Identity Provider', 'SSO Service',
  'Data Warehouse', 'BI Dashboard', 'Analytics Engine', 'Machine Learning Pipeline', 'ETL Process',
  'Mobile App', 'Desktop Client', 'Web Portal', 'Admin Console', 'Self-Service Portal',
  'Ticketing System', 'Knowledge Base', 'Chat Platform', 'Video Conferencing', 'Phone System',
  'Cloud Storage', 'Container Platform', 'Kubernetes Cluster', 'CI/CD Pipeline', 'Source Control',
  'Test Environment', 'Staging Server', 'Production Cluster', 'DR Site', 'Edge Location'
];

// Description templates
const DESCRIPTION_TEMPLATES = [
  'This ticket addresses an issue with {subject}. Please review and take appropriate action.',
  'User reported a concern regarding {subject}. Investigation required.',
  'Scheduled work for {subject}. Follow standard procedures.',
  'Priority request for {subject}. Please expedite.',
  'Routine maintenance for {subject}. Standard SLA applies.',
  'Critical issue affecting {subject}. Immediate attention needed.',
  'Enhancement request for {subject}. Evaluate feasibility.',
  'Security-related item for {subject}. Handle with care.',
  'Performance optimization needed for {subject}. Analyze and recommend.',
  'Compliance requirement for {subject}. Document all actions.'
];

const buildTicketTitle = (ticketTypeCode, index) => {
  const templates = TITLE_TEMPLATES[ticketTypeCode] || TITLE_TEMPLATES.TASK;
  const template = templates[index % templates.length];
  const subject = SUBJECTS[index % SUBJECTS.length];
  const sprintNumber = Math.floor(index / 100) + 1;
  
  return template
    .replace('{subject}', subject)
    .replace('{number}', sprintNumber);
};

const buildTicketDescription = (index) => {
  const template = DESCRIPTION_TEMPLATES[index % DESCRIPTION_TEMPLATES.length];
  const subject = SUBJECTS[index % SUBJECTS.length];
  return template.replace('{subject}', subject);
};

const seedUatTickets = async (prisma) => {
  const ticketsPerType = parseIntOr(process.env.UAT_TICKETS_PER_TYPE, DEFAULT_TICKETS_PER_TYPE);
  const batchSize = parseIntOr(process.env.UAT_TICKETS_BATCH_SIZE, DEFAULT_BATCH_SIZE);

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  console.log(`UAT Tickets seed starting: ticketsPerType=${ticketsPerType}, batchSize=${batchSize}`);

  // Get all active ticket types
  const ticketTypes = await prisma.ticket_types.findMany({
    where: { is_active: true },
    select: { code: true }
  });

  if (ticketTypes.length === 0) {
    console.log('No active ticket types found. Run ticket-types seed first.');
    return;
  }

  console.log(`Found ${ticketTypes.length} active ticket types: ${ticketTypes.map(t => t.code).join(', ')}`);

  // Get a writer (first person found)
  const writer = await prisma.persons.findFirst({
    where: { is_active: true },
    select: { uuid: true }
  });

  if (!writer) {
    console.log('No active person found to use as writer. Run uat seed first.');
    return;
  }

  console.log(`Using writer: ${writer.uuid}`);

  // Get some persons for requested_by, requested_for, and assignment
  const persons = await prisma.persons.findMany({
    where: { is_active: true },
    select: { uuid: true },
    take: 1000
  });

  const personUuids = persons.map(p => p.uuid);
  console.log(`Found ${personUuids.length} persons for assignment`);

  // Get groups for assignment
  const groups = await prisma.groups.findMany({
    select: { uuid: true },
    take: 100
  });

  const groupUuids = groups.map(g => g.uuid);
  console.log(`Found ${groupUuids.length} groups for assignment`);

  if (groupUuids.length === 0) {
    console.log('Warning: No groups found. Tickets will be created without group assignment.');
  }

  let totalInserted = 0;

  for (const ticketType of ticketTypes) {
    console.log(`\nSeeding tickets for type: ${ticketType.code}`);
    
    const tickets = [];
    // Half of tickets per type = 25000 (if default 50000)
    const halfCount = Math.floor(ticketsPerType / 2);
    
    for (let i = 0; i < ticketsPerType; i++) {
      const requestedByUuid = personUuids[i % personUuids.length];
      const requestedForUuid = personUuids[(i + 1) % personUuids.length];
      
      // Determine assignment based on ticket index
      let assignedGroupUuid = null;
      let assignedPersonUuid = null;
      
      if (groupUuids.length > 0) {
        // All tickets get a group assignment
        assignedGroupUuid = groupUuids[i % groupUuids.length];
        
        // Second half of tickets (25000) also get a person assignment
        if (i >= halfCount && personUuids.length > 0) {
          assignedPersonUuid = personUuids[(i + 2) % personUuids.length];
        }
      }
      
      tickets.push({
        title: buildTicketTitle(ticketType.code, i),
        description: buildTicketDescription(i),
        ticket_type_code: ticketType.code,
        writer_uuid: writer.uuid,
        requested_by_uuid: requestedByUuid,
        requested_for_uuid: requestedForUuid,
        assigned_group_uuid: assignedGroupUuid,
        assigned_person_uuid: assignedPersonUuid
      });
    }

    const batches = chunk(tickets, batchSize);
    let typeInserted = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const result = await prisma.tickets.createMany({
        data: batch,
        skipDuplicates: true
      });
      typeInserted += result.count;
      
      // Log progress every 10 batches
      if ((i + 1) % 10 === 0 || i === batches.length - 1) {
        console.log(`  ${ticketType.code}: batch ${i + 1}/${batches.length} (inserted=${typeInserted})`);
      }
    }

    totalInserted += typeInserted;
    console.log(`  ${ticketType.code}: completed (${typeInserted} tickets)`);
  }

  console.log(`\nUAT Tickets seed completed: total=${totalInserted} tickets across ${ticketTypes.length} types`);
  console.log(`  - First half: assigned to group only`);
  console.log(`  - Second half: assigned to group + person`);
};

module.exports = { seedUatTickets };
