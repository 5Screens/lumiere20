/**
 * Seed script for CI Types
 * Run with: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCiTypes() {
  console.log('Seeding CI types...');

  const ciTypes = [
    {
      code: 'UPS',
      label: 'UPS',
      description: 'Uninterruptible Power Supply',
      icon: 'pi-bolt',
      color: 'yellow',
      display_order: 1
    },
    {
      code: 'APPLICATION',
      label: 'Application',
      description: 'Software application',
      icon: 'pi-desktop',
      color: 'blue',
      display_order: 2
    },
    {
      code: 'SERVER',
      label: 'Server',
      description: 'Physical or virtual server',
      icon: 'pi-server',
      color: 'green',
      display_order: 3
    },
    {
      code: 'NETWORK_DEVICE',
      label: 'Network Device',
      description: 'Router, switch, firewall, etc.',
      icon: 'pi-sitemap',
      color: 'purple',
      display_order: 4
    },
    {
      code: 'STORAGE',
      label: 'Storage',
      description: 'SAN, NAS, storage arrays',
      icon: 'pi-database',
      color: 'orange',
      display_order: 5
    },
    {
      code: 'WORKSTATION',
      label: 'Workstation',
      description: 'Desktop computer or laptop',
      icon: 'pi-desktop',
      color: 'cyan',
      display_order: 6
    },
    {
      code: 'PRINTER',
      label: 'Printer',
      description: 'Printer or multifunction device',
      icon: 'pi-print',
      color: 'gray',
      display_order: 7
    },
    {
      code: 'MOBILE_DEVICE',
      label: 'Mobile Device',
      description: 'Smartphone, tablet',
      icon: 'pi-mobile',
      color: 'teal',
      display_order: 8
    },
    {
      code: 'DATABASE',
      label: 'Database',
      description: 'Database instance',
      icon: 'pi-database',
      color: 'indigo',
      display_order: 9
    },
    {
      code: 'GENERIC',
      label: 'Generic',
      description: 'Generic configuration item',
      icon: 'pi-box',
      color: 'gray',
      display_order: 99
    }
  ];

  for (const ciType of ciTypes) {
    await prisma.ci_types.upsert({
      where: { code: ciType.code },
      update: {
        label: ciType.label,
        description: ciType.description,
        icon: ciType.icon,
        color: ciType.color,
        display_order: ciType.display_order
      },
      create: ciType
    });
    console.log(`  - CI type '${ciType.code}' created/updated`);
  }

  console.log('CI types seeding completed!');
}

module.exports = { seedCiTypes };

// Allow running directly
if (require.main === module) {
  seedCiTypes()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
