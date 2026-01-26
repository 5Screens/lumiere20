/**
 * Seed script for Configuration Items (CI) - Product Catalog
 * Creates server models as a starting catalog for Lumiere
 * Run with: node prisma/seeds/run-single.js ci
 */

const { prisma } = require('../client');

async function seedConfigurationItems() {
  console.log('Seeding Configuration Items (Server Models Catalog)...');

  // Get CI types to map them
  const ciTypes = await prisma.ci_types.findMany({
    include: { category: true }
  });
  const ciTypeMap = {};
  for (const ct of ciTypes) {
    ciTypeMap[ct.code] = ct.uuid;
  }
  console.log(`  Found ${ciTypes.length} CI types`);


  // Server Models Catalog - 10 popular server models
  const serverModels = [
    {
      name: 'HP ProLiant DL380 Gen10',
      description: 'Enterprise-class 2U rack server with dual Intel Xeon Scalable processors',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'HP',
        manufacturer_reference: 'P19737-B21',
        product_family: 'RACK',
        form_factor: '2U',
        cpu_type: 'Intel Xeon Gold 5220',
        standard_ram_gb: 64,
        max_ram_gb: 3072,
        planned_storage: '4x600 Go SAS 10k',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2022-01-01',
        documentation_url: 'https://support.hpe.com/hpesc/public/docDisplay?docId=a00018313en_us',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 5000,
        compatible_services: 'Virtualization, Database, Web Server',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'HP ProLiant DL380 Gen10', description: 'Serveur rack 2U de classe entreprise avec double processeur Intel Xeon Scalable' },
        en: { name: 'HP ProLiant DL380 Gen10', description: 'Enterprise-class 2U rack server with dual Intel Xeon Scalable processors' }
      }
    },
    {
      name: 'HP ProLiant DL360 Gen10',
      description: 'Compact 1U rack server for dense computing environments',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'HP',
        manufacturer_reference: 'P19777-B21',
        product_family: 'RACK',
        form_factor: '1U',
        cpu_type: 'Intel Xeon Gold 6248',
        standard_ram_gb: 32,
        max_ram_gb: 1536,
        planned_storage: '2x480 Go SSD',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2021-06-01',
        documentation_url: 'https://support.hpe.com/hpesc/public/docDisplay?docId=a00018314en_us',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 4200,
        compatible_services: 'Web Server, Application Server',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'HP ProLiant DL360 Gen10', description: 'Serveur rack 1U compact pour environnements de calcul denses' },
        en: { name: 'HP ProLiant DL360 Gen10', description: 'Compact 1U rack server for dense computing environments' }
      }
    },
    {
      name: 'Dell PowerEdge R750',
      description: 'High-performance 2U rack server with 3rd Gen Intel Xeon Scalable processors',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Dell',
        manufacturer_reference: 'R750-BASE',
        product_family: 'RACK',
        form_factor: '2U',
        cpu_type: 'Intel Xeon Gold 6330',
        standard_ram_gb: 128,
        max_ram_gb: 2048,
        planned_storage: '8x960 Go SSD NVMe',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2023-01-15',
        documentation_url: 'https://www.dell.com/support/manuals/en-us/poweredge-r750',
        expected_lifecycle_years: 6,
        estimated_unit_cost: 7500,
        compatible_services: 'Database, Virtualization, AI/ML',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Dell PowerEdge R750', description: 'Serveur rack 2U haute performance avec processeurs Intel Xeon Scalable 3e génération' },
        en: { name: 'Dell PowerEdge R750', description: 'High-performance 2U rack server with 3rd Gen Intel Xeon Scalable processors' }
      }
    },
    {
      name: 'Dell PowerEdge R650',
      description: 'Versatile 1U rack server optimized for dense scale-out computing',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Dell',
        manufacturer_reference: 'R650-BASE',
        product_family: 'RACK',
        form_factor: '1U',
        cpu_type: 'Intel Xeon Silver 4314',
        standard_ram_gb: 64,
        max_ram_gb: 1024,
        planned_storage: '4x480 Go SSD',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2022-09-01',
        documentation_url: 'https://www.dell.com/support/manuals/en-us/poweredge-r650',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 4800,
        compatible_services: 'Web Server, Container Host',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Dell PowerEdge R650', description: 'Serveur rack 1U polyvalent optimisé pour le calcul dense scale-out' },
        en: { name: 'Dell PowerEdge R650', description: 'Versatile 1U rack server optimized for dense scale-out computing' }
      }
    },
    {
      name: 'Lenovo ThinkSystem SR650 V2',
      description: 'Enterprise 2U rack server with exceptional performance and reliability',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Lenovo',
        manufacturer_reference: '7Z73A03LEA',
        product_family: 'RACK',
        form_factor: '2U',
        cpu_type: 'Intel Xeon Gold 5318Y',
        standard_ram_gb: 64,
        max_ram_gb: 2048,
        planned_storage: '8x600 Go SAS 15k',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2022-03-01',
        documentation_url: 'https://lenovopress.lenovo.com/lp1392-thinksystem-sr650-v2-server',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 5500,
        compatible_services: 'Database, ERP, Virtualization',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Lenovo ThinkSystem SR650 V2', description: 'Serveur rack 2U entreprise avec performances et fiabilité exceptionnelles' },
        en: { name: 'Lenovo ThinkSystem SR650 V2', description: 'Enterprise 2U rack server with exceptional performance and reliability' }
      }
    },
    {
      name: 'Lenovo ThinkSystem SR630 V2',
      description: 'Compact 1U rack server for mainstream enterprise workloads',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Lenovo',
        manufacturer_reference: '7Z71A03MEA',
        product_family: 'RACK',
        form_factor: '1U',
        cpu_type: 'Intel Xeon Silver 4310',
        standard_ram_gb: 32,
        max_ram_gb: 1024,
        planned_storage: '4x480 Go SSD',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2022-02-15',
        documentation_url: 'https://lenovopress.lenovo.com/lp1391-thinksystem-sr630-v2-server',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 3800,
        compatible_services: 'Web Server, File Server',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Lenovo ThinkSystem SR630 V2', description: 'Serveur rack 1U compact pour charges de travail entreprise courantes' },
        en: { name: 'Lenovo ThinkSystem SR630 V2', description: 'Compact 1U rack server for mainstream enterprise workloads' }
      }
    },
    {
      name: 'Cisco UCS C240 M6',
      description: 'High-performance 2U rack server for demanding enterprise applications',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Cisco',
        manufacturer_reference: 'UCSC-C240-M6SX',
        product_family: 'RACK',
        form_factor: '2U',
        cpu_type: 'Intel Xeon Gold 6338',
        standard_ram_gb: 128,
        max_ram_gb: 4096,
        planned_storage: '12x1.2 To SAS 10k',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2021-09-01',
        documentation_url: 'https://www.cisco.com/c/en/us/products/servers-unified-computing/ucs-c240-m6-rack-server/',
        expected_lifecycle_years: 6,
        estimated_unit_cost: 8500,
        compatible_services: 'Database, Big Data, Virtualization',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Cisco UCS C240 M6', description: 'Serveur rack 2U haute performance pour applications entreprise exigeantes' },
        en: { name: 'Cisco UCS C240 M6', description: 'High-performance 2U rack server for demanding enterprise applications' }
      }
    },
    {
      name: 'Supermicro SuperServer 1029P-WTR',
      description: 'Cost-effective 1U twin server for high-density deployments',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Supermicro',
        manufacturer_reference: 'SYS-1029P-WTR',
        product_family: 'RACK',
        form_factor: '1U',
        cpu_type: 'Intel Xeon Silver 4210R',
        standard_ram_gb: 32,
        max_ram_gb: 768,
        planned_storage: '8x2.5" SSD/HDD',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2020-06-01',
        documentation_url: 'https://www.supermicro.com/en/products/system/1U/1029/SYS-1029P-WTR.cfm',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 2800,
        compatible_services: 'Web Hosting, Container Host',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'Supermicro SuperServer 1029P-WTR', description: 'Serveur twin 1U économique pour déploiements haute densité' },
        en: { name: 'Supermicro SuperServer 1029P-WTR', description: 'Cost-effective 1U twin server for high-density deployments' }
      }
    },
    {
      name: 'Dell PowerEdge T640',
      description: 'Powerful tower server for remote offices and small data centers',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'Dell',
        manufacturer_reference: 'T640-BASE',
        product_family: 'TOWER',
        form_factor: 'TOWER',
        cpu_type: 'Intel Xeon Gold 5218',
        standard_ram_gb: 64,
        max_ram_gb: 1536,
        planned_storage: '8x2 To SATA',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2020-01-01',
        documentation_url: 'https://www.dell.com/support/manuals/en-us/poweredge-t640',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 4500,
        compatible_services: 'File Server, Backup Server',
        in_it_catalog: true,
        replaced_by: 'Dell PowerEdge T650'
      },
      translations: {
        fr: { name: 'Dell PowerEdge T640', description: 'Serveur tour puissant pour bureaux distants et petits datacenters' },
        en: { name: 'Dell PowerEdge T640', description: 'Powerful tower server for remote offices and small data centers' }
      }
    },
    {
      name: 'HP ProLiant BL460c Gen10',
      description: 'High-density blade server for enterprise blade systems',
      ci_type: 'MODEL_SERVER',
      extended_core_fields: {
        manufacturer: 'HP',
        manufacturer_reference: '863442-B21',
        product_family: 'BLADE',
        form_factor: 'BLADE',
        cpu_type: 'Intel Xeon Gold 6140',
        standard_ram_gb: 64,
        max_ram_gb: 1536,
        planned_storage: '2x480 Go SSD',
        os_compatibility: ['WINDOWS', 'LINUX', 'VMWARE'],
        introduction_date: '2019-06-01',
        documentation_url: 'https://support.hpe.com/hpesc/public/docDisplay?docId=a00018315en_us',
        expected_lifecycle_years: 5,
        estimated_unit_cost: 6000,
        compatible_services: 'Virtualization, HPC',
        in_it_catalog: true,
        replaced_by: null
      },
      translations: {
        fr: { name: 'HP ProLiant BL460c Gen10', description: 'Serveur blade haute densité pour systèmes blade entreprise' },
        en: { name: 'HP ProLiant BL460c Gen10', description: 'High-density blade server for enterprise blade systems' }
      }
    }
  ];

  for (const ci of serverModels) {
    const { translations, ...ciData } = ci;
    
    // Upsert CI
    const createdCi = await prisma.configuration_items.upsert({
      where: { 
        // Use name + ci_type as unique identifier for upsert
        uuid: await getExistingCiUuid(ci.name, ci.ci_type) || '00000000-0000-0000-0000-000000000000'
      },
      update: {
        name: ciData.name,
        description: ciData.description,
        ci_type: ciData.ci_type,
        extended_core_fields: ciData.extended_core_fields
      },
      create: ciData
    });
    console.log(`  - CI '${ci.name}' created/updated`);
    
    // Upsert translations
    for (const [locale, trans] of Object.entries(translations)) {
      // Name translation
      await prisma.translated_fields.upsert({
        where: {
          entity_type_entity_uuid_field_name_locale: {
            entity_type: 'configuration_items',
            entity_uuid: createdCi.uuid,
            field_name: 'name',
            locale
          }
        },
        update: { value: trans.name },
        create: {
          entity_type: 'configuration_items',
          entity_uuid: createdCi.uuid,
          field_name: 'name',
          locale,
          value: trans.name
        }
      });
      
      // Description translation
      if (trans.description) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: 'configuration_items',
              entity_uuid: createdCi.uuid,
              field_name: 'description',
              locale
            }
          },
          update: { value: trans.description },
          create: {
            entity_type: 'configuration_items',
            entity_uuid: createdCi.uuid,
            field_name: 'description',
            locale,
            value: trans.description
          }
        });
      }
    }
    console.log(`    - Translations added for ${Object.keys(translations).length} locales`);
  }

  console.log('Configuration Items seeding completed!');
}

/**
 * Helper to find existing CI by name and type
 */
async function getExistingCiUuid(name, ciType) {
  const existing = await prisma.configuration_items.findFirst({
    where: { name, ci_type: ciType }
  });
  return existing?.uuid || null;
}

module.exports = { seedConfigurationItems };
