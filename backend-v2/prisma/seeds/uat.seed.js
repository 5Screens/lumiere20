const bcrypt = require('bcrypt');

const DEFAULT_COUNT = 10000;
const DEFAULT_BATCH_SIZE = 1000;

/**
 * UAT seed for creating a large dataset of persons.
 *
 * Usage:
 *   node prisma/seeds/run-single.js uat
 *
 * Options (env vars):
 *   - UAT_SEED_COUNT: number of persons to generate (default: 10000)
 *   - UAT_SEED_BATCH_SIZE: insert batch size (default: 1000)
 *   - UAT_SEED_EMAIL_PREFIX: email prefix (default: uat.user)
 *   - UAT_SEED_PASSWORD: password for all generated users (default: LumiereUat2025!)
 */

const parseIntOr = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildName = (index) => {
  const firstNames = [
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Jamie', 'Robin', 'Cameron', 'Drew',
    'Charlie', 'Avery', 'Quinn', 'Riley', 'Parker', 'Hayden', 'Reese', 'Rowan', 'Skyler', 'Emerson'
  ];
  const lastNames = [
    'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
    'Simon', 'Michel', 'Lefebvre', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel'
  ];

  const first_name = firstNames[index % firstNames.length];
  const last_name = lastNames[Math.floor(index / firstNames.length) % lastNames.length];

  return { first_name, last_name };
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const seedUat = async (prisma) => {
  const count = parseIntOr(process.env.UAT_SEED_COUNT, DEFAULT_COUNT);
  const batchSize = parseIntOr(process.env.UAT_SEED_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const emailPrefix = (process.env.UAT_SEED_EMAIL_PREFIX || 'uat.user').trim();
  const password = process.env.UAT_SEED_PASSWORD || 'LumiereUat2025!';

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  if (!count || count <= 0) {
    console.log('UAT seed skipped (count <= 0).');
    return;
  }

  console.log(`Seeding UAT persons: count=${count}, batchSize=${batchSize}, emailPrefix=${emailPrefix}`);

  const password_hash = await bcrypt.hash(password, 10);

  const persons = [];
  for (let i = 1; i <= count; i += 1) {
    const { first_name, last_name } = buildName(i);
    const email = `${emailPrefix}.${String(i).padStart(6, '0')}@example.local`;

    persons.push({
      email,
      first_name,
      last_name,
      role: 'user',
      password_hash,
      password_needs_reset: false,
      is_active: true,
      notification: true,
      language: 'fr',
      internal_id: `UAT-${String(i).padStart(6, '0')}`
    });
  }

  const batches = chunk(persons, batchSize);
  let insertedTotal = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];

    const result = await prisma.persons.createMany({
      data: batch,
      skipDuplicates: true
    });

    insertedTotal += result.count;
    console.log(`Inserted batch ${i + 1}/${batches.length} (inserted=${result.count}, totalInserted=${insertedTotal})`);
  }

  console.log(`UAT seed completed (inserted=${insertedTotal}).`);
};

module.exports = { seedUat };
