const { prisma } = require('../client');

/**
 * Seed roles table with initial role data
 */
async function seedRoles() {
  console.log('Seeding roles...');

  const rolesData = [
    {
      code: 'user',
      label: 'User',
      description: 'Standard user with basic access',
      is_active: true,
      display_order: 1,
    },
    {
      code: 'technician',
      label: 'Technician',
      description: 'Technical support agent',
      is_active: true,
      display_order: 2,
    },
    {
      code: 'manager',
      label: 'Manager',
      description: 'Team manager with elevated permissions',
      is_active: true,
      display_order: 3,
    },
    {
      code: 'admin',
      label: 'Administrator',
      description: 'Full system administrator',
      is_active: true,
      display_order: 4,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const role of rolesData) {
    const result = await prisma.roles.upsert({
      where: { code: role.code },
      update: {
        label: role.label,
        description: role.description,
        is_active: role.is_active,
        display_order: role.display_order,
      },
      create: role,
    });

    if (result.created_at.getTime() === result.updated_at.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Roles seeding completed: ${created} created, ${updated} updated`);

  // Seed translations
  await seedRolesTranslations();
}

/**
 * Seed translations for roles
 */
async function seedRolesTranslations() {
  console.log('Seeding roles translations...');

  const translations = {
    'user': {
      label: { fr: 'Utilisateur', en: 'User', es: 'Usuario', pt: 'Utilizador' },
      description: { fr: 'Utilisateur standard avec accès de base', en: 'Standard user with basic access', es: 'Usuario estándar con acceso básico', pt: 'Utilizador padrão com acesso básico' },
    },
    'technician': {
      label: { fr: 'Technicien', en: 'Technician', es: 'Técnico', pt: 'Técnico' },
      description: { fr: 'Agent de support technique', en: 'Technical support agent', es: 'Agente de soporte técnico', pt: 'Agente de suporte técnico' },
    },
    'manager': {
      label: { fr: 'Manager', en: 'Manager', es: 'Gerente', pt: 'Gestor' },
      description: { fr: 'Responsable d\'équipe avec permissions élevées', en: 'Team manager with elevated permissions', es: 'Gerente de equipo con permisos elevados', pt: 'Gestor de equipa com permissões elevadas' },
    },
    'admin': {
      label: { fr: 'Administrateur', en: 'Administrator', es: 'Administrador', pt: 'Administrador' },
      description: { fr: 'Administrateur système complet', en: 'Full system administrator', es: 'Administrador completo del sistema', pt: 'Administrador completo do sistema' },
    },
  };

  let count = 0;

  for (const [roleCode, fields] of Object.entries(translations)) {
    // Find the role UUID
    const role = await prisma.roles.findUnique({ where: { code: roleCode } });
    if (!role) {
      console.log(`  Warning: Role '${roleCode}' not found, skipping translations`);
      continue;
    }

    for (const [fieldName, locales] of Object.entries(fields)) {
      for (const [locale, value] of Object.entries(locales)) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: 'roles',
              entity_uuid: role.uuid,
              field_name: fieldName,
              locale,
            },
          },
          update: { value },
          create: {
            entity_type: 'roles',
            entity_uuid: role.uuid,
            field_name: fieldName,
            locale,
            value,
          },
        });
        count++;
      }
    }
  }

  console.log(`  ${count} role translations upserted`);
}

module.exports = { seedRoles };
