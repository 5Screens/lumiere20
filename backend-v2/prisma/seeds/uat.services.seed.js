/**
 * UAT seed for creating IT Services and Service Offerings as Configuration Items
 * Based on ITIL4 Service Management best practices
 * 
 * Run with: node prisma/seeds/run-single.js uat.services
 */

const { prisma } = require('../client');

// IT Services definitions (ITIL4 compliant)
const IT_SERVICES = [
  {
    name: 'Email & Collaboration',
    description: 'Enterprise email, calendar, and collaboration services including Microsoft 365',
    extended_core_fields: {
      service_type: 'IT',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'IT Director',
      service_manager: 'Collaboration Team Lead',
      business_unit: 'IT Operations',
      service_hours: '24X7',
      target_availability: 99.9,
      target_response_time: '15 minutes',
      target_resolution_time: '4 hours',
      sla_reference: 'SLA-EMAIL-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'HIGH',
      compliance_requirements: ['GDPR', 'SOC2'],
      data_classification: 'CONFIDENTIAL',
      recovery_time_objective: '1 hour',
      recovery_point_objective: '15 minutes'
    },
    offerings: [
      { name: 'Standard Mailbox', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Premium Mailbox (50GB)', type: 'PREMIUM', audience: 'Managers', price: 5 },
      { name: 'Shared Mailbox', type: 'STANDARD', audience: 'Teams', price: 0 },
      { name: 'Distribution List', type: 'BASIC', audience: 'All Employees', price: 0 }
    ]
  },
  {
    name: 'Identity & Access Management',
    description: 'Centralized identity management, SSO, MFA, and access control services',
    extended_core_fields: {
      service_type: 'INFRASTRUCTURE',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'CISO',
      service_manager: 'IAM Team Lead',
      business_unit: 'IT Security',
      service_hours: '24X7',
      target_availability: 99.99,
      target_response_time: '5 minutes',
      target_resolution_time: '1 hour',
      sla_reference: 'SLA-IAM-001',
      charging_model: 'NO_CHARGE',
      risk_level: 'CRITICAL',
      compliance_requirements: ['GDPR', 'SOX', 'ISO27001'],
      data_classification: 'RESTRICTED',
      recovery_time_objective: '30 minutes',
      recovery_point_objective: '5 minutes'
    },
    offerings: [
      { name: 'Standard User Account', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Privileged Account', type: 'PREMIUM', audience: 'IT Administrators', price: 0 },
      { name: 'Service Account', type: 'STANDARD', audience: 'Applications', price: 0 },
      { name: 'Guest Account', type: 'BASIC', audience: 'External Partners', price: 0 },
      { name: 'MFA Token', type: 'STANDARD', audience: 'All Employees', price: 10 }
    ]
  },
  {
    name: 'End User Computing',
    description: 'Desktop, laptop, and mobile device provisioning and support services',
    extended_core_fields: {
      service_type: 'IT',
      service_status: 'OPERATIONAL',
      service_criticality: 'HIGH',
      service_owner: 'IT Director',
      service_manager: 'EUC Team Lead',
      business_unit: 'IT Operations',
      service_hours: '8X5',
      target_availability: 99.5,
      target_response_time: '30 minutes',
      target_resolution_time: '8 hours',
      sla_reference: 'SLA-EUC-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'MEDIUM',
      compliance_requirements: ['GDPR'],
      data_classification: 'INTERNAL',
      recovery_time_objective: '4 hours',
      recovery_point_objective: '24 hours'
    },
    offerings: [
      { name: 'Standard Laptop', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Developer Workstation', type: 'PREMIUM', audience: 'Developers', price: 200 },
      { name: 'Mobile Device (BYOD)', type: 'BASIC', audience: 'All Employees', price: 0 },
      { name: 'Corporate Mobile Device', type: 'STANDARD', audience: 'Managers', price: 50 },
      { name: 'Virtual Desktop', type: 'STANDARD', audience: 'Remote Workers', price: 30 }
    ]
  },
  {
    name: 'Network Services',
    description: 'Enterprise network connectivity including LAN, WAN, WiFi, and VPN',
    extended_core_fields: {
      service_type: 'INFRASTRUCTURE',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'IT Director',
      service_manager: 'Network Team Lead',
      business_unit: 'IT Infrastructure',
      service_hours: '24X7',
      target_availability: 99.95,
      target_response_time: '10 minutes',
      target_resolution_time: '2 hours',
      sla_reference: 'SLA-NET-001',
      charging_model: 'NO_CHARGE',
      risk_level: 'CRITICAL',
      compliance_requirements: ['ISO27001'],
      data_classification: 'INTERNAL',
      recovery_time_objective: '1 hour',
      recovery_point_objective: 'N/A'
    },
    offerings: [
      { name: 'Office Network Access', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'VPN Remote Access', type: 'STANDARD', audience: 'Remote Workers', price: 0 },
      { name: 'Guest WiFi', type: 'BASIC', audience: 'Visitors', price: 0 },
      { name: 'Dedicated VLAN', type: 'PREMIUM', audience: 'Departments', price: 100 }
    ]
  },
  {
    name: 'Cloud Platform Services',
    description: 'Cloud infrastructure and platform services (IaaS/PaaS) on Azure and AWS',
    extended_core_fields: {
      service_type: 'INFRASTRUCTURE',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'Cloud Architect',
      service_manager: 'Cloud Operations Lead',
      business_unit: 'IT Infrastructure',
      service_hours: '24X7',
      target_availability: 99.9,
      target_response_time: '15 minutes',
      target_resolution_time: '4 hours',
      sla_reference: 'SLA-CLOUD-001',
      charging_model: 'COST_PLUS',
      risk_level: 'HIGH',
      compliance_requirements: ['GDPR', 'SOC2', 'ISO27001'],
      data_classification: 'CONFIDENTIAL',
      recovery_time_objective: '2 hours',
      recovery_point_objective: '1 hour'
    },
    offerings: [
      { name: 'Virtual Machine (Standard)', type: 'STANDARD', audience: 'Project Teams', price: 50 },
      { name: 'Virtual Machine (High Performance)', type: 'PREMIUM', audience: 'Data Teams', price: 200 },
      { name: 'Kubernetes Namespace', type: 'STANDARD', audience: 'Development Teams', price: 100 },
      { name: 'Managed Database', type: 'PREMIUM', audience: 'Applications', price: 150 },
      { name: 'Object Storage (1TB)', type: 'STANDARD', audience: 'All Teams', price: 20 }
    ]
  },
  {
    name: 'Application Hosting',
    description: 'Hosting and management of business applications in production environments',
    extended_core_fields: {
      service_type: 'IT',
      service_status: 'OPERATIONAL',
      service_criticality: 'HIGH',
      service_owner: 'Application Director',
      service_manager: 'App Operations Lead',
      business_unit: 'IT Applications',
      service_hours: '24X7',
      target_availability: 99.5,
      target_response_time: '30 minutes',
      target_resolution_time: '4 hours',
      sla_reference: 'SLA-APP-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'HIGH',
      compliance_requirements: ['GDPR', 'SOC2'],
      data_classification: 'CONFIDENTIAL',
      recovery_time_objective: '4 hours',
      recovery_point_objective: '1 hour'
    },
    offerings: [
      { name: 'Web Application Hosting', type: 'STANDARD', audience: 'Business Units', price: 100 },
      { name: 'API Gateway', type: 'STANDARD', audience: 'Development Teams', price: 50 },
      { name: 'Batch Processing', type: 'STANDARD', audience: 'Finance', price: 75 }
    ]
  },
  {
    name: 'Data & Analytics Platform',
    description: 'Enterprise data warehouse, BI tools, and analytics services',
    extended_core_fields: {
      service_type: 'BUSINESS',
      service_status: 'OPERATIONAL',
      service_criticality: 'HIGH',
      service_owner: 'Chief Data Officer',
      service_manager: 'Data Platform Lead',
      business_unit: 'Data & Analytics',
      service_hours: '12X5',
      target_availability: 99.0,
      target_response_time: '1 hour',
      target_resolution_time: '8 hours',
      sla_reference: 'SLA-DATA-001',
      charging_model: 'COST_PLUS',
      risk_level: 'HIGH',
      compliance_requirements: ['GDPR', 'SOX'],
      data_classification: 'CONFIDENTIAL',
      recovery_time_objective: '8 hours',
      recovery_point_objective: '4 hours'
    },
    offerings: [
      { name: 'BI Dashboard Access', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Power BI Pro License', type: 'PREMIUM', audience: 'Analysts', price: 10 },
      { name: 'Data Warehouse Access', type: 'PREMIUM', audience: 'Data Teams', price: 50 },
      { name: 'Self-Service Analytics', type: 'STANDARD', audience: 'Business Users', price: 20 }
    ]
  },
  {
    name: 'IT Service Desk',
    description: 'Single point of contact for IT support, incident management, and service requests',
    extended_core_fields: {
      service_type: 'SUPPORTING',
      service_status: 'OPERATIONAL',
      service_criticality: 'HIGH',
      service_owner: 'IT Director',
      service_manager: 'Service Desk Manager',
      business_unit: 'IT Operations',
      service_hours: '12X7',
      target_availability: 99.5,
      target_response_time: '15 minutes',
      target_resolution_time: 'Varies by priority',
      sla_reference: 'SLA-SD-001',
      charging_model: 'NO_CHARGE',
      risk_level: 'MEDIUM',
      compliance_requirements: [],
      data_classification: 'INTERNAL',
      recovery_time_objective: '2 hours',
      recovery_point_objective: '1 hour'
    },
    offerings: [
      { name: 'Incident Report', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Service Request', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'VIP Support', type: 'PREMIUM', audience: 'Executives', price: 0 },
      { name: 'On-Site Support', type: 'PREMIUM', audience: 'All Employees', price: 50 }
    ]
  },
  {
    name: 'Backup & Recovery',
    description: 'Enterprise backup, archiving, and disaster recovery services',
    extended_core_fields: {
      service_type: 'INFRASTRUCTURE',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'IT Director',
      service_manager: 'Storage Team Lead',
      business_unit: 'IT Infrastructure',
      service_hours: '24X7',
      target_availability: 99.9,
      target_response_time: '30 minutes',
      target_resolution_time: '4 hours',
      sla_reference: 'SLA-BKP-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'CRITICAL',
      compliance_requirements: ['GDPR', 'SOX'],
      data_classification: 'CONFIDENTIAL',
      recovery_time_objective: '4 hours',
      recovery_point_objective: '24 hours'
    },
    offerings: [
      { name: 'Standard Backup (Daily)', type: 'STANDARD', audience: 'All Systems', price: 0 },
      { name: 'Enhanced Backup (Hourly)', type: 'PREMIUM', audience: 'Critical Systems', price: 50 },
      { name: 'Long-Term Archive', type: 'STANDARD', audience: 'Compliance', price: 10 },
      { name: 'DR Site Replication', type: 'PREMIUM', audience: 'Critical Applications', price: 200 }
    ]
  },
  {
    name: 'Security Operations',
    description: 'Security monitoring, threat detection, vulnerability management, and incident response',
    extended_core_fields: {
      service_type: 'SUPPORTING',
      service_status: 'OPERATIONAL',
      service_criticality: 'CRITICAL',
      service_owner: 'CISO',
      service_manager: 'SOC Manager',
      business_unit: 'IT Security',
      service_hours: '24X7',
      target_availability: 99.99,
      target_response_time: '5 minutes',
      target_resolution_time: '1 hour',
      sla_reference: 'SLA-SEC-001',
      charging_model: 'NO_CHARGE',
      risk_level: 'CRITICAL',
      compliance_requirements: ['GDPR', 'SOX', 'ISO27001', 'SOC2'],
      data_classification: 'RESTRICTED',
      recovery_time_objective: '15 minutes',
      recovery_point_objective: '5 minutes'
    },
    offerings: [
      { name: 'Security Monitoring', type: 'STANDARD', audience: 'All Systems', price: 0 },
      { name: 'Vulnerability Scan', type: 'STANDARD', audience: 'All Systems', price: 0 },
      { name: 'Penetration Test', type: 'PREMIUM', audience: 'Critical Applications', price: 500 },
      { name: 'Security Awareness Training', type: 'STANDARD', audience: 'All Employees', price: 0 }
    ]
  },
  {
    name: 'Print Services',
    description: 'Enterprise printing, scanning, and document management services',
    extended_core_fields: {
      service_type: 'IT',
      service_status: 'OPERATIONAL',
      service_criticality: 'LOW',
      service_owner: 'IT Director',
      service_manager: 'EUC Team Lead',
      business_unit: 'IT Operations',
      service_hours: '8X5',
      target_availability: 95.0,
      target_response_time: '4 hours',
      target_resolution_time: '24 hours',
      sla_reference: 'SLA-PRINT-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'LOW',
      compliance_requirements: [],
      data_classification: 'INTERNAL',
      recovery_time_objective: '24 hours',
      recovery_point_objective: 'N/A'
    },
    offerings: [
      { name: 'Standard Printing', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Color Printing', type: 'STANDARD', audience: 'All Employees', price: 0.10 },
      { name: 'Large Format Printing', type: 'PREMIUM', audience: 'Marketing', price: 5 }
    ]
  },
  {
    name: 'Telephony & Unified Communications',
    description: 'Voice, video conferencing, and unified communications services',
    extended_core_fields: {
      service_type: 'IT',
      service_status: 'OPERATIONAL',
      service_criticality: 'HIGH',
      service_owner: 'IT Director',
      service_manager: 'UC Team Lead',
      business_unit: 'IT Operations',
      service_hours: '24X7',
      target_availability: 99.9,
      target_response_time: '15 minutes',
      target_resolution_time: '4 hours',
      sla_reference: 'SLA-UC-001',
      charging_model: 'COST_RECOVERY',
      risk_level: 'MEDIUM',
      compliance_requirements: ['GDPR'],
      data_classification: 'INTERNAL',
      recovery_time_objective: '2 hours',
      recovery_point_objective: 'N/A'
    },
    offerings: [
      { name: 'Desk Phone', type: 'STANDARD', audience: 'Office Workers', price: 0 },
      { name: 'Softphone', type: 'STANDARD', audience: 'All Employees', price: 0 },
      { name: 'Video Conferencing Room', type: 'PREMIUM', audience: 'Meeting Rooms', price: 100 },
      { name: 'International Calling', type: 'PREMIUM', audience: 'Sales', price: 20 }
    ]
  }
];

async function seedUatServices() {
  console.log('Seeding UAT Services and Service Offerings...');

  // Get CI type UUIDs
  const serviceType = await prisma.ci_types.findUnique({ where: { code: 'SERVICE' } });
  const serviceOfferingType = await prisma.ci_types.findUnique({ where: { code: 'SERVICE_OFFERING' } });

  if (!serviceType) {
    console.error('ERROR: CI type SERVICE not found. Run ci-types seed first.');
    return;
  }
  if (!serviceOfferingType) {
    console.error('ERROR: CI type SERVICE_OFFERING not found. Run ci-types seed first.');
    return;
  }

  console.log(`  Found CI types: SERVICE=${serviceType.uuid}, SERVICE_OFFERING=${serviceOfferingType.uuid}`);

  let servicesCreated = 0;
  let offeringsCreated = 0;

  for (const serviceDef of IT_SERVICES) {
    // Create the Service CI
    const service = await prisma.configuration_items.upsert({
      where: {
        // Use a composite approach - find by name and type
        uuid: (await prisma.configuration_items.findFirst({
          where: { name: serviceDef.name, ci_type: 'SERVICE' }
        }))?.uuid || '00000000-0000-0000-0000-000000000000'
      },
      update: {
        description: serviceDef.description,
        extended_core_fields: serviceDef.extended_core_fields
      },
      create: {
        name: serviceDef.name,
        description: serviceDef.description,
        ci_type: 'SERVICE',
        extended_core_fields: serviceDef.extended_core_fields
      }
    });

    console.log(`  - Service '${serviceDef.name}' created/updated (uuid: ${service.uuid})`);
    servicesCreated++;

    // Create Service Offerings for this service
    for (const offeringDef of serviceDef.offerings) {
      const offeringName = `${serviceDef.name} - ${offeringDef.name}`;
      
      const offeringExtendedFields = {
        rel_parent_service_uuid: service.uuid,
        offering_type: offeringDef.type,
        offering_status: 'PUBLISHED',
        target_audience: offeringDef.audience,
        pricing_model: offeringDef.price === 0 ? 'FREE' : 'ONE_TIME',
        unit_price: offeringDef.price,
        catalog_visibility: 'PUBLIC',
        approval_required: offeringDef.type === 'PREMIUM',
        service_hours: serviceDef.extended_core_fields.service_hours,
        target_availability: serviceDef.extended_core_fields.target_availability
      };

      await prisma.configuration_items.upsert({
        where: {
          uuid: (await prisma.configuration_items.findFirst({
            where: { name: offeringName, ci_type: 'SERVICE_OFFERING' }
          }))?.uuid || '00000000-0000-0000-0000-000000000000'
        },
        update: {
          description: `${offeringDef.name} offering for ${serviceDef.name}`,
          extended_core_fields: offeringExtendedFields
        },
        create: {
          name: offeringName,
          description: `${offeringDef.name} offering for ${serviceDef.name}`,
          ci_type: 'SERVICE_OFFERING',
          extended_core_fields: offeringExtendedFields
        }
      });

      offeringsCreated++;
    }
    console.log(`    - ${serviceDef.offerings.length} offerings created`);
  }

  console.log(`UAT Services seeding completed! Services: ${servicesCreated}, Offerings: ${offeringsCreated}`);
}

module.exports = { seedUatServices };
