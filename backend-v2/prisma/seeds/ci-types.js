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
      label_key: 'ciTypes.ups',
      description_key: 'ciTypes.upsDesc',
      icon: 'pi-bolt',
      color: 'yellow',
      display_order: 1
    },
    {
      code: 'APPLICATION',
      label_key: 'ciTypes.application',
      description_key: 'ciTypes.applicationDesc',
      icon: 'pi-desktop',
      color: 'blue',
      display_order: 2
    },
    {
      code: 'SERVER',
      label_key: 'ciTypes.server',
      description_key: 'ciTypes.serverDesc',
      icon: 'pi-server',
      color: 'green',
      display_order: 3
    },
    {
      code: 'NETWORK_DEVICE',
      label_key: 'ciTypes.networkDevice',
      description_key: 'ciTypes.networkDeviceDesc',
      icon: 'pi-sitemap',
      color: 'purple',
      display_order: 4
    },
    {
      code: 'STORAGE',
      label_key: 'ciTypes.storage',
      description_key: 'ciTypes.storageDesc',
      icon: 'pi-database',
      color: 'orange',
      display_order: 5
    },
    {
      code: 'WORKSTATION',
      label_key: 'ciTypes.workstation',
      description_key: 'ciTypes.workstationDesc',
      icon: 'pi-desktop',
      color: 'cyan',
      display_order: 6
    },
    {
      code: 'PRINTER',
      label_key: 'ciTypes.printer',
      description_key: 'ciTypes.printerDesc',
      icon: 'pi-print',
      color: 'gray',
      display_order: 7
    },
    {
      code: 'MOBILE_DEVICE',
      label_key: 'ciTypes.mobileDevice',
      description_key: 'ciTypes.mobileDeviceDesc',
      icon: 'pi-mobile',
      color: 'teal',
      display_order: 8
    },
    {
      code: 'DATABASE',
      label_key: 'ciTypes.database',
      description_key: 'ciTypes.databaseDesc',
      icon: 'pi-database',
      color: 'indigo',
      display_order: 9
    },
    {
      code: 'GENERIC',
      label_key: 'ciTypes.generic',
      description_key: 'ciTypes.genericDesc',
      icon: 'pi-box',
      color: 'gray',
      display_order: 99
    }
  ];

  for (const ciType of ciTypes) {
    await prisma.ci_types.upsert({
      where: { code: ciType.code },
      update: {
        label_key: ciType.label_key,
        description_key: ciType.description_key,
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
