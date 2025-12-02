/**
 * Seed script for CI Types
 * Run with: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCiTypes() {
  console.log('Seeding CI types...');

  // CI Types with default labels (English as fallback)
  const ciTypes = [
    {
      code: 'UPS',
      label: 'UPS',
      description: 'Uninterruptible Power Supply',
      icon: 'pi-bolt',
      color: 'yellow',
      display_order: 1,
      translations: {
        fr: { label: 'Onduleur (UPS)', description: 'Alimentation sans interruption' },
        en: { label: 'UPS', description: 'Uninterruptible Power Supply' },
        es: { label: 'SAI', description: 'Sistema de alimentación ininterrumpida' },
        pt: { label: 'UPS', description: 'Fonte de alimentação ininterrupta' },
        de: { label: 'USV', description: 'Unterbrechungsfreie Stromversorgung' }
      }
    },
    {
      code: 'APPLICATION',
      label: 'Application',
      description: 'Software application',
      icon: 'pi-desktop',
      color: 'blue',
      display_order: 2,
      translations: {
        fr: { label: 'Application', description: 'Application logicielle' },
        en: { label: 'Application', description: 'Software application' },
        es: { label: 'Aplicación', description: 'Aplicación de software' },
        pt: { label: 'Aplicação', description: 'Aplicação de software' },
        de: { label: 'Anwendung', description: 'Softwareanwendung' }
      }
    },
    {
      code: 'SERVER',
      label: 'Server',
      description: 'Physical or virtual server',
      icon: 'pi-server',
      color: 'green',
      display_order: 3,
      translations: {
        fr: { label: 'Serveur', description: 'Serveur physique ou virtuel' },
        en: { label: 'Server', description: 'Physical or virtual server' },
        es: { label: 'Servidor', description: 'Servidor físico o virtual' },
        pt: { label: 'Servidor', description: 'Servidor físico ou virtual' },
        de: { label: 'Server', description: 'Physischer oder virtueller Server' }
      }
    },
    {
      code: 'NETWORK_DEVICE',
      label: 'Network Device',
      description: 'Router, switch, firewall, etc.',
      icon: 'pi-sitemap',
      color: 'purple',
      display_order: 4,
      translations: {
        fr: { label: 'Équipement réseau', description: 'Routeur, switch, firewall, etc.' },
        en: { label: 'Network Device', description: 'Router, switch, firewall, etc.' },
        es: { label: 'Dispositivo de red', description: 'Router, switch, firewall, etc.' },
        pt: { label: 'Dispositivo de rede', description: 'Router, switch, firewall, etc.' },
        de: { label: 'Netzwerkgerät', description: 'Router, Switch, Firewall, etc.' }
      }
    },
    {
      code: 'STORAGE',
      label: 'Storage',
      description: 'SAN, NAS, storage arrays',
      icon: 'pi-database',
      color: 'orange',
      display_order: 5,
      translations: {
        fr: { label: 'Stockage', description: 'SAN, NAS, baies de stockage' },
        en: { label: 'Storage', description: 'SAN, NAS, storage arrays' },
        es: { label: 'Almacenamiento', description: 'SAN, NAS, matrices de almacenamiento' },
        pt: { label: 'Armazenamento', description: 'SAN, NAS, matrizes de armazenamento' },
        de: { label: 'Speicher', description: 'SAN, NAS, Speicher-Arrays' }
      }
    },
    {
      code: 'WORKSTATION',
      label: 'Workstation',
      description: 'Desktop or laptop computer',
      icon: 'pi-desktop',
      color: 'cyan',
      display_order: 6,
      translations: {
        fr: { label: 'Poste de travail', description: 'Ordinateur de bureau ou portable' },
        en: { label: 'Workstation', description: 'Desktop or laptop computer' },
        es: { label: 'Estación de trabajo', description: 'Ordenador de escritorio o portátil' },
        pt: { label: 'Estação de trabalho', description: 'Computador de mesa ou portátil' },
        de: { label: 'Arbeitsstation', description: 'Desktop- oder Laptop-Computer' }
      }
    },
    {
      code: 'PRINTER',
      label: 'Printer',
      description: 'Printer or multifunction device',
      icon: 'pi-print',
      color: 'gray',
      display_order: 7,
      translations: {
        fr: { label: 'Imprimante', description: 'Imprimante ou multifonction' },
        en: { label: 'Printer', description: 'Printer or multifunction device' },
        es: { label: 'Impresora', description: 'Impresora o dispositivo multifunción' },
        pt: { label: 'Impressora', description: 'Impressora ou dispositivo multifuncional' },
        de: { label: 'Drucker', description: 'Drucker oder Multifunktionsgerät' }
      }
    },
    {
      code: 'MOBILE_DEVICE',
      label: 'Mobile Device',
      description: 'Smartphone, tablet',
      icon: 'pi-mobile',
      color: 'teal',
      display_order: 8,
      translations: {
        fr: { label: 'Appareil mobile', description: 'Smartphone, tablette' },
        en: { label: 'Mobile Device', description: 'Smartphone, tablet' },
        es: { label: 'Dispositivo móvil', description: 'Smartphone, tableta' },
        pt: { label: 'Dispositivo móvel', description: 'Smartphone, tablet' },
        de: { label: 'Mobilgerät', description: 'Smartphone, Tablet' }
      }
    },
    {
      code: 'DATABASE',
      label: 'Database',
      description: 'Database instance',
      icon: 'pi-database',
      color: 'indigo',
      display_order: 9,
      translations: {
        fr: { label: 'Base de données', description: 'Instance de base de données' },
        en: { label: 'Database', description: 'Database instance' },
        es: { label: 'Base de datos', description: 'Instancia de base de datos' },
        pt: { label: 'Base de dados', description: 'Instância de base de dados' },
        de: { label: 'Datenbank', description: 'Datenbankinstanz' }
      }
    },
    {
      code: 'GENERIC',
      label: 'Generic',
      description: 'Generic configuration item',
      icon: 'pi-box',
      color: 'gray',
      display_order: 99,
      translations: {
        fr: { label: 'Générique', description: 'Élément de configuration générique' },
        en: { label: 'Generic', description: 'Generic configuration item' },
        es: { label: 'Genérico', description: 'Elemento de configuración genérico' },
        pt: { label: 'Genérico', description: 'Item de configuração genérico' },
        de: { label: 'Generisch', description: 'Generisches Konfigurationselement' }
      }
    }
  ];

  for (const ciType of ciTypes) {
    const { translations, ...ciTypeData } = ciType;
    
    // Upsert CI type
    const createdCiType = await prisma.ci_types.upsert({
      where: { code: ciType.code },
      update: {
        label: ciTypeData.label,
        description: ciTypeData.description,
        icon: ciTypeData.icon,
        color: ciTypeData.color,
        display_order: ciTypeData.display_order
      },
      create: ciTypeData
    });
    console.log(`  - CI type '${ciType.code}' created/updated`);
    
    // Upsert translations for each locale using translated_fields table
    for (const [locale, trans] of Object.entries(translations)) {
      // Label translation
      await prisma.translated_fields.upsert({
        where: {
          entity_type_entity_uuid_field_name_locale: {
            entity_type: 'ci_types',
            entity_uuid: createdCiType.uuid,
            field_name: 'label',
            locale
          }
        },
        update: { value: trans.label },
        create: {
          entity_type: 'ci_types',
          entity_uuid: createdCiType.uuid,
          field_name: 'label',
          locale,
          value: trans.label
        }
      });
      
      // Description translation
      if (trans.description) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: 'ci_types',
              entity_uuid: createdCiType.uuid,
              field_name: 'description',
              locale
            }
          },
          update: { value: trans.description },
          create: {
            entity_type: 'ci_types',
            entity_uuid: createdCiType.uuid,
            field_name: 'description',
            locale,
            value: trans.description
          }
        });
      }
    }
    console.log(`    - Translations added for ${Object.keys(translations).length} locales`);
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
