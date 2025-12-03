/**
 * Seed script for CI Types
 * Run with: npx prisma db seed
 */

const { prisma } = require('../client');

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
      code: 'ROUTER',
      label: 'Router',
      description: 'Network router for traffic routing between networks',
      icon: 'pi-sitemap',
      color: 'purple',
      display_order: 4,
      translations: {
        fr: { label: 'Routeur', description: 'Routeur réseau pour le routage du trafic entre réseaux' },
        en: { label: 'Router', description: 'Network router for traffic routing between networks' },
        es: { label: 'Router', description: 'Router de red para enrutamiento de tráfico entre redes' },
        pt: { label: 'Router', description: 'Router de rede para roteamento de tráfego entre redes' },
        de: { label: 'Router', description: 'Netzwerk-Router für Verkehrsweiterleitung zwischen Netzwerken' }
      }
    },
    {
      code: 'SWITCH',
      label: 'Switch',
      description: 'Network switch for local network connectivity',
      icon: 'pi-share-alt',
      color: 'violet',
      display_order: 5,
      translations: {
        fr: { label: 'Switch', description: 'Commutateur réseau pour la connectivité locale' },
        en: { label: 'Switch', description: 'Network switch for local network connectivity' },
        es: { label: 'Switch', description: 'Conmutador de red para conectividad de red local' },
        pt: { label: 'Switch', description: 'Switch de rede para conectividade de rede local' },
        de: { label: 'Switch', description: 'Netzwerk-Switch für lokale Netzwerkverbindung' }
      }
    },
    {
      code: 'FIREWALL',
      label: 'Firewall',
      description: 'Network security firewall',
      icon: 'pi-shield',
      color: 'red',
      display_order: 6,
      translations: {
        fr: { label: 'Pare-feu', description: 'Pare-feu de sécurité réseau' },
        en: { label: 'Firewall', description: 'Network security firewall' },
        es: { label: 'Firewall', description: 'Firewall de seguridad de red' },
        pt: { label: 'Firewall', description: 'Firewall de segurança de rede' },
        de: { label: 'Firewall', description: 'Netzwerk-Sicherheits-Firewall' }
      }
    },
    {
      code: 'ACCESS_POINT',
      label: 'Access Point',
      description: 'Wireless access point for WiFi connectivity',
      icon: 'pi-wifi',
      color: 'sky',
      display_order: 7,
      translations: {
        fr: { label: 'Point d\'accès', description: 'Point d\'accès sans fil pour la connectivité WiFi' },
        en: { label: 'Access Point', description: 'Wireless access point for WiFi connectivity' },
        es: { label: 'Punto de acceso', description: 'Punto de acceso inalámbrico para conectividad WiFi' },
        pt: { label: 'Ponto de acesso', description: 'Ponto de acesso sem fio para conectividade WiFi' },
        de: { label: 'Access Point', description: 'Drahtloser Zugangspunkt für WiFi-Konnektivität' }
      }
    },
    {
      code: 'LOAD_BALANCER',
      label: 'Load Balancer',
      description: 'Load balancer for traffic distribution',
      icon: 'pi-arrows-h',
      color: 'amber',
      display_order: 8,
      translations: {
        fr: { label: 'Répartiteur de charge', description: 'Répartiteur de charge pour la distribution du trafic' },
        en: { label: 'Load Balancer', description: 'Load balancer for traffic distribution' },
        es: { label: 'Balanceador de carga', description: 'Balanceador de carga para distribución de tráfico' },
        pt: { label: 'Balanceador de carga', description: 'Balanceador de carga para distribuição de tráfego' },
        de: { label: 'Load Balancer', description: 'Lastverteiler für Verkehrsverteilung' }
      }
    },
    {
      code: 'STORAGE',
      label: 'Storage',
      description: 'SAN, NAS, storage arrays',
      icon: 'pi-database',
      color: 'orange',
      display_order: 9,
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
      display_order: 10,
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
      display_order: 11,
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
      display_order: 12,
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
      display_order: 13,
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
