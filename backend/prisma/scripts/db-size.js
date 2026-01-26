/**
 * Script to display database size information
 * Usage: npm run db:size
 */

const { prisma } = require('../client');

async function main() {
  console.log('Database Size Information');
  console.log('========================================');

  // Get database size
  const dbSize = await prisma.$queryRaw`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size
  `;
  console.log(`Database size: ${dbSize[0].database_size}`);

  // Get size per schema
  const schemasSizes = await prisma.$queryRaw`
    SELECT 
      schemaname AS schema,
      pg_size_pretty(SUM(pg_total_relation_size(schemaname || '.' || tablename))) AS size
    FROM pg_tables
    WHERE schemaname IN ('data', 'core', 'configuration', 'translations', 'audit', 'workflow')
    GROUP BY schemaname
    ORDER BY SUM(pg_total_relation_size(schemaname || '.' || tablename)) DESC
  `;

  console.log('\nSize per schema:');
  for (const schema of schemasSizes) {
    console.log(`  - ${schema.schema}: ${schema.size}`);
  }

  // Get row counts for main tables
  const tableCounts = await prisma.$queryRaw`
    SELECT 
      schemaname || '.' || relname AS table_name,
      n_live_tup AS row_count,
      pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS size
    FROM pg_stat_user_tables
    WHERE schemaname IN ('data', 'core', 'configuration', 'translations', 'audit', 'workflow')
    ORDER BY n_live_tup DESC
    LIMIT 15
  `;

  console.log('\nTop 15 tables by row count:');
  for (const table of tableCounts) {
    console.log(`  - ${table.table_name}: ${table.row_count.toLocaleString()} rows (${table.size})`);
  }

  console.log('========================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
