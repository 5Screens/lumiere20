const { PrismaClient } = require('@prisma/client');

const ticketTypes = [
  { code: 'TASK' },
  { code: 'INCIDENT' },
  { code: 'PROBLEM' },
  { code: 'CHANGE' },
  { code: 'SERVICE_REQUEST' },
];

async function seedTicketTypes(prisma) {
  console.log('Seeding ticket types...');

  for (const ticketType of ticketTypes) {
    await prisma.ticket_types.upsert({
      where: { code: ticketType.code },
      update: {},
      create: ticketType,
    });
    console.log(`  - Ticket type '${ticketType.code}' created/updated`);
  }

  console.log('Ticket types seeding completed!');
}

module.exports = { seedTicketTypes };
