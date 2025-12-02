/**
 * Cleanup script to remove old ci_types fields (label_key, description_key)
 * and ensure only the new fields (label, description) exist
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up old ci_types fields...');

  // Get ci_types object type
  const ciTypesObject = await prisma.object_types.findUnique({
    where: { code: 'ci_types' }
  });

  if (!ciTypesObject) {
    console.log('ci_types object type not found');
    return;
  }

  // Delete old fields that no longer exist in schema
  const oldFields = ['label_key', 'description_key'];
  
  for (const fieldName of oldFields) {
    const result = await prisma.object_fields.deleteMany({
      where: {
        object_type_uuid: ciTypesObject.uuid,
        field_name: fieldName
      }
    });
    
    if (result.count > 0) {
      console.log(`  - Deleted field '${fieldName}'`);
    }
  }

  console.log('Cleanup completed!');
}

cleanup()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
