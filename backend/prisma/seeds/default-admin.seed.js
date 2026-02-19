/**
 * Seed file for default administrator account
 * Creates a default admin user for initial deployment
 * 
 * IMPORTANT: Change the password after first login!
 * Default credentials:
 *   Email: admin@lumiere.local
 *   Password: Lumiere2024!
 */

const bcrypt = require('bcrypt');
const { prisma } = require('../client');

const DEFAULT_ADMIN = {
  email: 'admin@lumiere.local',
  first_name: 'Admin',
  last_name: 'Lumiere',
  role_code: 'admin',
  password: 'Lumiere2024!',
  password_needs_reset: true,
  is_active: true,
  notification: true,
  language_code: 'fr'
};

/**
 * Seed default admin into the database
 */
async function seedDefaultAdmin() {
  console.log('Seeding default administrator...');
  
  // Check if admin already exists
  const existingAdmin = await prisma.persons.findUnique({
    where: { email: DEFAULT_ADMIN.email }
  });
  
  if (existingAdmin) {
    console.log('Default administrator already exists, skipping...');
    return;
  }
  
  // Lookup role UUID by code
  const adminRole = await prisma.roles.findUnique({
    where: { code: DEFAULT_ADMIN.role_code }
  });
  if (!adminRole) {
    console.log(`Warning: Role '${DEFAULT_ADMIN.role_code}' not found. Run 'roles' seed first.`);
  }

  // Lookup language UUID by code
  const frLanguage = await prisma.languages.findUnique({
    where: { code: DEFAULT_ADMIN.language_code }
  });
  if (!frLanguage) {
    console.log(`Warning: Language '${DEFAULT_ADMIN.language_code}' not found. Run 'languages' seed first.`);
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);
  
  // Create admin user
  const admin = await prisma.persons.create({
    data: {
      email: DEFAULT_ADMIN.email,
      first_name: DEFAULT_ADMIN.first_name,
      last_name: DEFAULT_ADMIN.last_name,
      role: adminRole?.uuid || null,
      password_hash,
      password_needs_reset: DEFAULT_ADMIN.password_needs_reset,
      is_active: DEFAULT_ADMIN.is_active,
      notification: DEFAULT_ADMIN.notification,
      language: frLanguage?.uuid || null
    }
  });
  
  console.log(`Created default administrator: ${admin.email}`);
  console.log('');
  console.log('='.repeat(50));
  console.log('DEFAULT ADMIN CREDENTIALS');
  console.log('='.repeat(50));
  console.log(`Email:    ${DEFAULT_ADMIN.email}`);
  console.log(`Password: ${DEFAULT_ADMIN.password}`);
  console.log('');
  console.log('IMPORTANT: Change the password after first login!');
  console.log('='.repeat(50));
}

module.exports = { seedDefaultAdmin, DEFAULT_ADMIN };
