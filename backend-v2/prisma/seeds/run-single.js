/**
 * Run a single seed script
 * Usage: node prisma/seeds/run-single.js <seed-name>
 * Example: node prisma/seeds/run-single.js ci-type-fields
 */

const { prisma } = require('../client');

const seedMap = {
  'ci-categories': () => require('./ci-categories').seedCiCategories(),
  'ci-type-fields': () => require('./ci-type-fields').seedCiTypeFields(),
  'ci-types': () => require('./ci-types').seedCiTypes(),
  'ci': () => require('./ci').seedConfigurationItems(),
  'object-metadata': () => require('./object-metadata').seedObjectMetadata(),
  'languages': () => require('./languages.seed').seedLanguages(prisma),
  'default-admin': () => require('./default-admin.seed').seedDefaultAdmin(),
};

async function main() {
  const seedName = process.argv[2];
  
  if (!seedName) {
    console.error('Usage: node prisma/seeds/run-single.js <seed-name>');
    console.error('Available seeds:', Object.keys(seedMap).join(', '));
    process.exit(1);
  }
  
  const seedFn = seedMap[seedName];
  
  if (!seedFn) {
    console.error(`Unknown seed: ${seedName}`);
    console.error('Available seeds:', Object.keys(seedMap).join(', '));
    process.exit(1);
  }
  
  console.log(`Running seed: ${seedName}...`);
  console.log('========================================');
  
  try {
    await seedFn();
    console.log('========================================');
    console.log(`Seed ${seedName} completed successfully!`);
  } catch (error) {
    console.error(`Error running seed ${seedName}:`, error);
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
