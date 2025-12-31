/**
 * Seed script for CI Categories
 * Run with: node prisma/seeds/run-single.js ci-categories
 */

const { prisma } = require('../client');

async function seedCiCategories() {
  console.log('Seeding CI categories...');

  // CI Categories based on AppSidebar menu structure
  const ciCategories = [
    {
      code: 'APPLICATIONS',
      label: 'Applications',
      icon: 'pi-th-large',
      display_order: 1,
      translations: {
        fr: { label: 'Applications' },
        en: { label: 'Applications' },
        es: { label: 'Aplicaciones' },
        pt: { label: 'Aplicações' },
        de: { label: 'Anwendungen' }
      }
    },
    {
      code: 'HARDWARE',
      label: 'Hardware',
      icon: 'pi-microchip',
      display_order: 2,
      translations: {
        fr: { label: 'Matériel' },
        en: { label: 'Hardware' },
        es: { label: 'Hardware' },
        pt: { label: 'Hardware' },
        de: { label: 'Hardware' }
      }
    },
    {
      code: 'NETWORK',
      label: 'Network',
      icon: 'pi-sitemap',
      display_order: 3,
      translations: {
        fr: { label: 'Réseau' },
        en: { label: 'Network' },
        es: { label: 'Red' },
        pt: { label: 'Rede' },
        de: { label: 'Netzwerk' }
      }
    },
    {
      code: 'VIRTUALIZATION',
      label: 'Virtualization',
      icon: 'pi-server',
      display_order: 4,
      translations: {
        fr: { label: 'Virtualisation' },
        en: { label: 'Virtualization' },
        es: { label: 'Virtualización' },
        pt: { label: 'Virtualização' },
        de: { label: 'Virtualisierung' }
      }
    },
    {
      code: 'DATABASE',
      label: 'Database',
      icon: 'pi-database',
      display_order: 5,
      translations: {
        fr: { label: 'Base de données' },
        en: { label: 'Database' },
        es: { label: 'Base de datos' },
        pt: { label: 'Base de dados' },
        de: { label: 'Datenbank' }
      }
    },
    {
      code: 'CONTRACTS',
      label: 'Contracts',
      icon: 'pi-file',
      display_order: 6,
      translations: {
        fr: { label: 'Contrats' },
        en: { label: 'Contracts' },
        es: { label: 'Contratos' },
        pt: { label: 'Contratos' },
        de: { label: 'Verträge' }
      }
    },
    {
      code: 'CLOUD',
      label: 'Cloud',
      icon: 'pi-cloud',
      display_order: 7,
      translations: {
        fr: { label: 'Cloud' },
        en: { label: 'Cloud' },
        es: { label: 'Nube' },
        pt: { label: 'Nuvem' },
        de: { label: 'Cloud' }
      }
    },
    {
      code: 'SERVICES',
      label: 'Services',
      icon: 'pi-cog',
      display_order: 8,
      translations: {
        fr: { label: 'Services' },
        en: { label: 'Services' },
        es: { label: 'Servicios' },
        pt: { label: 'Serviços' },
        de: { label: 'Dienste' }
      }
    },
    {
      code: 'MODELS',
      label: 'Models',
      icon: 'pi-box',
      display_order: 9,
      translations: {
        fr: { label: 'Modèles' },
        en: { label: 'Models' },
        es: { label: 'Modelos' },
        pt: { label: 'Modelos' },
        de: { label: 'Modelle' }
      }
    }
  ];

  for (const category of ciCategories) {
    const { translations, ...categoryData } = category;
    
    // Upsert CI category
    const createdCategory = await prisma.ci_categories.upsert({
      where: { code: category.code },
      update: {
        label: categoryData.label,
        icon: categoryData.icon,
        display_order: categoryData.display_order
      },
      create: categoryData
    });
    console.log(`  - CI category '${category.code}' created/updated`);
    
    // Upsert translations for each locale using translated_fields table
    for (const [locale, trans] of Object.entries(translations)) {
      await prisma.translated_fields.upsert({
        where: {
          entity_type_entity_uuid_field_name_locale: {
            entity_type: 'ci_categories',
            entity_uuid: createdCategory.uuid,
            field_name: 'label',
            locale
          }
        },
        update: { value: trans.label },
        create: {
          entity_type: 'ci_categories',
          entity_uuid: createdCategory.uuid,
          field_name: 'label',
          locale,
          value: trans.label
        }
      });
    }
    console.log(`    - Translations added for ${Object.keys(translations).length} locales`);
  }

  console.log('CI categories seeding completed!');
}

module.exports = { seedCiCategories };
