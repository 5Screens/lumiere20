/**
 * Seed script for CI Type Fields
 * Defines extended fields for each CI type stored in configuration_items.extended_core_fields
 * Labels are now stored with translations in translated_fields table
 */

const { prisma } = require('../client');

// Translations dictionary for field labels { field_name: { en: '...', fr: '...' } }
const fieldTranslations = {
  // Common fields
  ip_address: { en: 'IP Address', fr: 'Adresse IP' },
  mac_address: { en: 'MAC Address', fr: 'Adresse MAC' },
  firmware_version: { en: 'Firmware Version', fr: 'Version firmware' },
  serial_number: { en: 'Serial Number', fr: 'Numéro de série' },
  purchase_date: { en: 'Purchase Date', fr: "Date d'achat" },
  warranty_expiry: { en: 'Warranty Expiry', fr: 'Fin de garantie' },
  notes: { en: 'Notes', fr: 'Notes' },
  asset_tag: { en: 'Asset Tag', fr: "Numéro d'inventaire" },
  
  // MODEL fields (logical/template CI)
  manufacturer: { en: 'Manufacturer', fr: 'Fabricant' },
  manufacturer_reference: { en: 'Manufacturer Reference', fr: 'Référence fabricant' },
  product_family: { en: 'Product Family', fr: 'Famille' },
  form_factor: { en: 'Form Factor', fr: 'Facteur de forme' },
  cpu_type: { en: 'CPU Type', fr: 'Type de processeur' },
  standard_ram_gb: { en: 'Standard RAM (GB)', fr: 'RAM standard (Go)' },
  max_ram_gb: { en: 'Max RAM (GB)', fr: 'RAM max (Go)' },
  planned_storage: { en: 'Planned Storage', fr: 'Stockage prévu' },
  os_compatibility: { en: 'OS Compatibility', fr: 'Compatibilité OS' },
  introduction_date: { en: 'Introduction Date', fr: "Date d'introduction" },
  documentation_url: { en: 'Documentation URL', fr: 'Documentation technique' },
  expected_lifecycle_years: { en: 'Expected Lifecycle (years)', fr: 'Cycle de vie prévu (années)' },
  estimated_unit_cost: { en: 'Estimated Unit Cost', fr: 'Coût unitaire estimé' },
  compatible_services: { en: 'Compatible Services', fr: 'Services compatibles' },
  in_it_catalog: { en: 'In IT Catalog', fr: 'Catalogue IT interne' },
  replaced_by: { en: 'Replaced By', fr: 'Remplacé par' },
  
  // Physical CI fields (instance)
  hostname: { en: 'Hostname', fr: "Nom d'hôte" },
  ram_installed_gb: { en: 'Installed RAM (GB)', fr: 'RAM installée (Go)' },
  installed_storage: { en: 'Installed Storage', fr: 'Disques installés' },
  os: { en: 'Operating System', fr: "Système d'exploitation" },
  os_version: { en: 'OS Version', fr: 'Version OS' },
  commissioning_date: { en: 'Commissioning Date', fr: 'Date de mise en service' },
  ci_status: { en: 'CI Status', fr: 'Statut du CI' },
  location: { en: 'Location', fr: 'Localisation' },
  location_datacenter: { en: 'Datacenter', fr: 'Datacenter' },
  location_rack: { en: 'Rack Location', fr: 'Emplacement rack' },
  location_rack_unit: { en: 'Rack Unit', fr: 'Unité rack' },
  estimated_end_of_life: { en: 'Estimated End of Life', fr: 'Durée de vie estimée' },
  accounting_value: { en: 'Accounting Value', fr: 'Valeur comptable' },
  depreciated_value: { en: 'Depreciated Value', fr: 'Valeur amortie' },
  hosted_services: { en: 'Hosted Services', fr: 'Services hébergés' },
  cmdb_reference: { en: 'CMDB Reference', fr: 'Référence CMDB' },
  environment: { en: 'Environment', fr: 'Environnement' },
  
  // UPS fields
  power_capacity_va: { en: 'Power Capacity (VA)', fr: 'Capacité (VA)' },
  power_capacity_watts: { en: 'Power Capacity (W)', fr: 'Capacité (W)' },
  battery_count: { en: 'Battery Count', fr: 'Nombre de batteries' },
  runtime_minutes: { en: 'Runtime (min)', fr: 'Autonomie (min)' },
  last_battery_change: { en: 'Last Battery Change', fr: 'Dernier changement batterie' },
  next_battery_change: { en: 'Next Battery Change', fr: 'Prochain changement batterie' },
  input_voltage: { en: 'Input Voltage', fr: 'Tension entrée' },
  output_voltage: { en: 'Output Voltage', fr: 'Tension sortie' },
  
  // Application fields
  version: { en: 'Version', fr: 'Version' },
  vendor: { en: 'Vendor', fr: 'Éditeur' },
  license_type: { en: 'License Type', fr: 'Type de licence' },
  license_count: { en: 'License Count', fr: 'Nombre de licences' },
  license_expiry: { en: 'License Expiry', fr: 'Expiration licence' },
  url: { en: 'URL', fr: 'URL' },
  support_contact: { en: 'Support Contact', fr: 'Contact support' },
  business_owner: { en: 'Business Owner', fr: 'Responsable métier' },
  technical_owner: { en: 'Technical Owner', fr: 'Responsable technique' },
  
  // Network fields
  routing_protocols: { en: 'Routing Protocols', fr: 'Protocoles de routage' },
  wan_interfaces: { en: 'WAN Interfaces', fr: 'Interfaces WAN' },
  lan_interfaces: { en: 'LAN Interfaces', fr: 'Interfaces LAN' },
  nat_enabled: { en: 'NAT Enabled', fr: 'NAT activé' },
  vpn_enabled: { en: 'VPN Enabled', fr: 'VPN activé' },
  port_count: { en: 'Port Count', fr: 'Nombre de ports' },
  port_speed: { en: 'Port Speed', fr: 'Vitesse des ports' },
  layer: { en: 'Layer', fr: 'Couche' },
  managed: { en: 'Managed', fr: 'Managé' },
  poe_enabled: { en: 'PoE Enabled', fr: 'PoE activé' },
  poe_budget_watts: { en: 'PoE Budget (W)', fr: 'Budget PoE (W)' },
  vlan_count: { en: 'VLAN Count', fr: 'Nombre de VLAN' },
  stacking_enabled: { en: 'Stacking Enabled', fr: 'Stacking activé' },
  throughput_gbps: { en: 'Throughput (Gbps)', fr: 'Débit (Gbps)' },
  max_connections: { en: 'Max Connections', fr: 'Connexions max' },
  vpn_tunnels: { en: 'VPN Tunnels', fr: 'Tunnels VPN' },
  ips_enabled: { en: 'IPS Enabled', fr: 'IPS activé' },
  antivirus_enabled: { en: 'Antivirus Enabled', fr: 'Antivirus activé' },
  web_filter_enabled: { en: 'Web Filter Enabled', fr: 'Filtrage web activé' },
  ha_mode: { en: 'HA Mode', fr: 'Mode HA' },
  wifi_standards: { en: 'WiFi Standards', fr: 'Standards WiFi' },
  frequency_bands: { en: 'Frequency Bands', fr: 'Bandes de fréquence' },
  max_clients: { en: 'Max Clients', fr: 'Clients max' },
  poe_powered: { en: 'PoE Powered', fr: 'Alimenté PoE' },
  controller_managed: { en: 'Controller Managed', fr: 'Géré par contrôleur' },
  controller_ip: { en: 'Controller IP', fr: 'IP contrôleur' },
  ssid_count: { en: 'SSID Count', fr: 'Nombre de SSID' },
  virtual_servers: { en: 'Virtual Servers', fr: 'Serveurs virtuels' },
  algorithm: { en: 'Algorithm', fr: 'Algorithme' },
  ssl_offload: { en: 'SSL Offload', fr: 'Déchargement SSL' },
  health_check_enabled: { en: 'Health Check Enabled', fr: 'Health check activé' },
  
  // Storage fields
  storage_type: { en: 'Storage Type', fr: 'Type de stockage' },
  total_capacity_tb: { en: 'Total Capacity (TB)', fr: 'Capacité totale (To)' },
  used_capacity_tb: { en: 'Used Capacity (TB)', fr: 'Capacité utilisée (To)' },
  raid_level: { en: 'RAID Level', fr: 'Niveau RAID' },
  disk_type: { en: 'Disk Type', fr: 'Type de disque' },
  disk_count: { en: 'Disk Count', fr: 'Nombre de disques' },
  protocols: { en: 'Protocols', fr: 'Protocoles' },
  
  // Workstation/Device fields
  device_type: { en: 'Device Type', fr: 'Type de périphérique' },
  cpu: { en: 'CPU', fr: 'CPU' },
  ram_gb: { en: 'RAM (GB)', fr: 'RAM (Go)' },
  storage_gb: { en: 'Storage (GB)', fr: 'Stockage (Go)' },
  assigned_user: { en: 'Assigned User', fr: 'Utilisateur assigné' },
  
  // Printer fields
  printer_type: { en: 'Printer Type', fr: "Type d'imprimante" },
  color_capable: { en: 'Color Capable', fr: 'Impression couleur' },
  duplex_capable: { en: 'Duplex Capable', fr: 'Recto-verso' },
  network_connected: { en: 'Network Connected', fr: 'Connecté au réseau' },
  pages_per_minute: { en: 'Pages per Minute', fr: 'Pages par minute' },
  paper_sizes: { en: 'Paper Sizes', fr: 'Formats papier' },
  scan_capable: { en: 'Scan Capable', fr: 'Scanner' },
  fax_capable: { en: 'Fax Capable', fr: 'Fax' },
  
  // Mobile device fields
  imei: { en: 'IMEI', fr: 'IMEI' },
  phone_number: { en: 'Phone Number', fr: 'Numéro de téléphone' },
  mdm_enrolled: { en: 'MDM Enrolled', fr: 'Inscrit MDM' },
  
  // Database fields
  db_engine: { en: 'Database Engine', fr: 'Moteur de base de données' },
  port: { en: 'Port', fr: 'Port' },
  database_name: { en: 'Database Name', fr: 'Nom de la base' },
  size_gb: { en: 'Size (GB)', fr: 'Taille (Go)' },
  cluster_enabled: { en: 'Cluster Enabled', fr: 'Cluster activé' },
  replication_enabled: { en: 'Replication Enabled', fr: 'Réplication activée' },
  backup_enabled: { en: 'Backup Enabled', fr: 'Sauvegarde activée' },
  backup_frequency: { en: 'Backup Frequency', fr: 'Fréquence de sauvegarde' },
  ssl_enabled: { en: 'SSL Enabled', fr: 'SSL activé' },
  
  // Virtual machine fields
  is_virtual: { en: 'Virtual', fr: 'Virtuel' },
  hypervisor: { en: 'Hypervisor', fr: 'Hyperviseur' },
  cpu_count: { en: 'CPU Count', fr: 'Nombre de CPU' },
  cpu_cores: { en: 'CPU Cores', fr: 'Cœurs CPU' },
};

// Common fields shared across multiple CI types
const commonNetworkFields = [
  { field_name: 'ip_address', label: 'IP Address', field_type: 'text', display_order: 1, pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' },
  { field_name: 'mac_address', label: 'MAC Address', field_type: 'text', display_order: 2, pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
  { field_name: 'firmware_version', label: 'Firmware Version', field_type: 'text', display_order: 3 },
  { field_name: 'manufacturer', label: 'Manufacturer', field_type: 'text', display_order: 10 },
  { field_name: 'model', label: 'Model', field_type: 'text', display_order: 11 },
  { field_name: 'serial_number', label: 'Serial Number', field_type: 'text', display_order: 12 },
  { field_name: 'purchase_date', label: 'Purchase Date', field_type: 'date', data_type: 'date', display_order: 13 },
  { field_name: 'warranty_expiry', label: 'Warranty Expiry', field_type: 'date', data_type: 'date', display_order: 14 },
];

// Field definitions by CI type code
const fieldsByCiType = {
  // UPS - Uninterruptible Power Supply
  UPS: [
    { field_name: 'power_capacity_va', label: 'powerCapacityVa', field_type: 'number', data_type: 'number', display_order: 1, unit: 'VA', min_value: 0 },
    { field_name: 'power_capacity_watts', label: 'powerCapacityWatts', field_type: 'number', data_type: 'number', display_order: 2, unit: 'W', min_value: 0 },
    { field_name: 'battery_count', label: 'batteryCount', field_type: 'number', data_type: 'number', display_order: 3, min_value: 1 },
    { field_name: 'runtime_minutes', label: 'runtimeMinutes', field_type: 'number', data_type: 'number', display_order: 4, unit: 'min', min_value: 0 },
    { field_name: 'last_battery_change', label: 'lastBatteryChange', field_type: 'date', data_type: 'date', display_order: 5 },
    { field_name: 'next_battery_change', label: 'nextBatteryChange', field_type: 'date', data_type: 'date', display_order: 6 },
    { field_name: 'input_voltage', label: 'inputVoltage', field_type: 'number', data_type: 'number', display_order: 7, unit: 'V' },
    { field_name: 'output_voltage', label: 'outputVoltage', field_type: 'number', data_type: 'number', display_order: 8, unit: 'V' },
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 12 },
    { field_name: 'location_rack', label: 'locationRack', field_type: 'text', display_order: 15 },
  ],

  // APPLICATION - Software Application
  APPLICATION: [
    { field_name: 'version', label: 'version', field_type: 'text', display_order: 1, show_in_table: true },
    { field_name: 'vendor', label: 'vendor', field_type: 'text', display_order: 2, show_in_table: true },
    { field_name: 'license_type', label: 'licenseType', field_type: 'select', display_order: 3, options_source: JSON.stringify([
      { label: 'Perpetual', value: 'PERPETUAL' },
      { label: 'Subscription', value: 'SUBSCRIPTION' },
      { label: 'Open Source', value: 'OPEN_SOURCE' },
      { label: 'Freeware', value: 'FREEWARE' },
      { label: 'Trial', value: 'TRIAL' }
    ])},
    { field_name: 'license_count', label: 'licenseCount', field_type: 'number', data_type: 'number', display_order: 4, min_value: 0 },
    { field_name: 'license_expiry', label: 'licenseExpiry', field_type: 'date', data_type: 'date', display_order: 5 },
    { field_name: 'environment', label: 'environment', field_type: 'select', display_order: 6, show_in_table: true, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' }
    ])},
    { field_name: 'url', label: 'url', field_type: 'text', display_order: 7 },
    { field_name: 'documentation_url', label: 'documentationUrl', field_type: 'text', display_order: 8 },
    { field_name: 'support_contact', label: 'supportContact', field_type: 'text', display_order: 9 },
    { field_name: 'business_owner', label: 'businessOwner', field_type: 'text', display_order: 10 },
    { field_name: 'technical_owner', label: 'technicalOwner', field_type: 'text', display_order: 11 },
  ],

  // SERVER - Physical Server Instance (real CI)
  // Fields specific to a physical server instance, not the model specifications
  SERVER: [
    { field_name: 'hostname', label: 'hostname', field_type: 'text', display_order: 1, is_required: true, show_in_table: true },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 2, show_in_table: true },
    { field_name: 'ip_address', label: 'ipAddress', field_type: 'text', display_order: 3, show_in_table: true, pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' },
    { field_name: 'mac_address', label: 'macAddress', field_type: 'text', display_order: 4, pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
    { field_name: 'ram_installed_gb', label: 'ramInstalledGb', field_type: 'number', data_type: 'number', display_order: 5, unit: 'GB', min_value: 1 },
    { field_name: 'installed_storage', label: 'installedStorage', field_type: 'text', display_order: 6 },
    { field_name: 'os', label: 'os', field_type: 'select', display_order: 7, show_in_table: true, options_source: JSON.stringify([
      { label: 'Windows Server 2022', value: 'WINDOWS_SERVER_2022' },
      { label: 'Windows Server 2019', value: 'WINDOWS_SERVER_2019' },
      { label: 'Linux (RHEL)', value: 'LINUX_RHEL' },
      { label: 'Linux (Ubuntu)', value: 'LINUX_UBUNTU' },
      { label: 'Linux (Debian)', value: 'LINUX_DEBIAN' },
      { label: 'Linux (CentOS)', value: 'LINUX_CENTOS' },
      { label: 'VMware ESXi', value: 'VMWARE_ESXI' },
      { label: 'Other', value: 'OTHER' }
    ])},
    { field_name: 'os_version', label: 'osVersion', field_type: 'text', display_order: 8 },
    { field_name: 'commissioning_date', label: 'commissioningDate', field_type: 'date', data_type: 'date', display_order: 9 },
    { field_name: 'ci_status', label: 'ciStatus', field_type: 'select', display_order: 10, show_in_table: true, options_source: JSON.stringify([
      { label: 'In Service', value: 'IN_SERVICE' },
      { label: 'In Maintenance', value: 'IN_MAINTENANCE' },
      { label: 'Out of Service', value: 'OUT_OF_SERVICE' },
      { label: 'Decommissioned', value: 'DECOMMISSIONED' }
    ])},
    { field_name: 'environment', label: 'environment', field_type: 'select', display_order: 11, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' },
      { label: 'DR', value: 'DR' }
    ])},
    { field_name: 'location_datacenter', label: 'locationDatacenter', field_type: 'text', display_order: 15 },
    { field_name: 'location_rack', label: 'locationRack', field_type: 'text', display_order: 16 },
    { field_name: 'location_rack_unit', label: 'locationRackUnit', field_type: 'text', display_order: 17 },
    { field_name: 'estimated_end_of_life', label: 'estimatedEndOfLife', field_type: 'date', data_type: 'date', display_order: 20 },
    { field_name: 'accounting_value', label: 'accountingValue', field_type: 'number', data_type: 'number', display_order: 21, unit: '€', min_value: 0 },
    { field_name: 'depreciated_value', label: 'depreciatedValue', field_type: 'number', data_type: 'number', display_order: 22, unit: '€', min_value: 0 },
    { field_name: 'hosted_services', label: 'hostedServices', field_type: 'text', display_order: 25 },
    { field_name: 'cmdb_reference', label: 'cmdbReference', field_type: 'text', display_order: 26 },
    { field_name: 'asset_tag', label: 'assetTag', field_type: 'text', display_order: 27 },
    { field_name: 'purchase_date', label: 'purchaseDate', field_type: 'date', data_type: 'date', display_order: 28 },
    { field_name: 'warranty_expiry', label: 'warrantyExpiry', field_type: 'date', data_type: 'date', display_order: 29 },
    { field_name: 'notes', label: 'notes', field_type: 'textarea', display_order: 99 },
  ],

  // MODEL_SERVER - Server Hardware Model (logical/template CI)
  // Specifications for a server model that can be purchased from a vendor
  MODEL_SERVER: [
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 1, is_required: true, show_in_table: true },
    { field_name: 'manufacturer_reference', label: 'manufacturerReference', field_type: 'text', display_order: 2, is_required: true, show_in_table: true },
    { field_name: 'product_family', label: 'productFamily', field_type: 'select', display_order: 3, show_in_table: true, options_source: JSON.stringify([
      { label: 'Rack Server', value: 'RACK' },
      { label: 'Tower Server', value: 'TOWER' },
      { label: 'Blade Server', value: 'BLADE' },
      { label: 'Modular Server', value: 'MODULAR' }
    ])},
    { field_name: 'form_factor', label: 'formFactor', field_type: 'select', display_order: 4, options_source: JSON.stringify([
      { label: '1U', value: '1U' },
      { label: '2U', value: '2U' },
      { label: '4U', value: '4U' },
      { label: 'Blade', value: 'BLADE' },
      { label: 'Tower', value: 'TOWER' }
    ])},
    { field_name: 'cpu_type', label: 'cpuType', field_type: 'text', display_order: 5 },
    { field_name: 'standard_ram_gb', label: 'standardRamGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 0 },
    { field_name: 'max_ram_gb', label: 'maxRamGb', field_type: 'number', data_type: 'number', display_order: 7, unit: 'GB', min_value: 0 },
    { field_name: 'planned_storage', label: 'plannedStorage', field_type: 'text', display_order: 8 },
    { field_name: 'os_compatibility', label: 'osCompatibility', field_type: 'multiselect', data_type: 'array', display_order: 9, options_source: JSON.stringify([
      { label: 'Windows', value: 'WINDOWS' },
      { label: 'Linux', value: 'LINUX' },
      { label: 'VMware', value: 'VMWARE' }
    ])},
    { field_name: 'introduction_date', label: 'introductionDate', field_type: 'date', data_type: 'date', display_order: 10 },
    { field_name: 'documentation_url', label: 'documentationUrl', field_type: 'text', display_order: 11 },
    { field_name: 'expected_lifecycle_years', label: 'expectedLifecycleYears', field_type: 'number', data_type: 'number', display_order: 13, unit: 'years', min_value: 1 },
    { field_name: 'estimated_unit_cost', label: 'estimatedUnitCost', field_type: 'number', data_type: 'number', display_order: 14, unit: '€', min_value: 0 },
    { field_name: 'compatible_services', label: 'compatibleServices', field_type: 'text', display_order: 15 },
    { field_name: 'in_it_catalog', label: 'inItCatalog', field_type: 'boolean', data_type: 'boolean', display_order: 16, default_value: 'true' },
    { field_name: 'replaced_by', label: 'replacedBy', field_type: 'text', display_order: 17 },
    { field_name: 'notes', label: 'notes', field_type: 'textarea', display_order: 99 },
  ],

  // ROUTER
  ROUTER: [
    ...commonNetworkFields.slice(0, 3), // ip, mac, firmware
    { field_name: 'routing_protocols', label: 'routingProtocols', field_type: 'multiselect', data_type: 'array', display_order: 4, options_source: JSON.stringify([
      { label: 'OSPF', value: 'OSPF' },
      { label: 'BGP', value: 'BGP' },
      { label: 'EIGRP', value: 'EIGRP' },
      { label: 'RIP', value: 'RIP' },
      { label: 'Static', value: 'STATIC' }
    ])},
    { field_name: 'wan_interfaces', label: 'wanInterfaces', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'lan_interfaces', label: 'lanInterfaces', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'nat_enabled', label: 'natEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'vpn_enabled', label: 'vpnEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    ...commonNetworkFields.slice(3), // manufacturer, model, serial, dates
  ],

  // SWITCH
  SWITCH: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'port_count', label: 'portCount', field_type: 'number', data_type: 'number', display_order: 4, min_value: 1, show_in_table: true },
    { field_name: 'port_speed', label: 'portSpeed', field_type: 'select', display_order: 5, options_source: JSON.stringify([
      { label: '100 Mbps', value: '100M' },
      { label: '1 Gbps', value: '1G' },
      { label: '10 Gbps', value: '10G' },
      { label: '25 Gbps', value: '25G' },
      { label: '40 Gbps', value: '40G' },
      { label: '100 Gbps', value: '100G' }
    ])},
    { field_name: 'layer', label: 'layer', field_type: 'select', display_order: 6, options_source: JSON.stringify([
      { label: 'Layer 2', value: 'L2' },
      { label: 'Layer 3', value: 'L3' }
    ])},
    { field_name: 'managed', label: 'managed', field_type: 'boolean', data_type: 'boolean', display_order: 7, default_value: 'true' },
    { field_name: 'poe_enabled', label: 'poeEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'poe_budget_watts', label: 'poeBudgetWatts', field_type: 'number', data_type: 'number', display_order: 9, unit: 'W', min_value: 0 },
    { field_name: 'vlan_count', label: 'vlanCount', field_type: 'number', data_type: 'number', display_order: 10, min_value: 0 },
    { field_name: 'stacking_enabled', label: 'stackingEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 11 },
    ...commonNetworkFields.slice(3),
  ],

  // FIREWALL
  FIREWALL: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'throughput_gbps', label: 'throughputGbps', field_type: 'number', data_type: 'number', display_order: 4, unit: 'Gbps', min_value: 0 },
    { field_name: 'max_connections', label: 'maxConnections', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'vpn_enabled', label: 'vpnEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 6 },
    { field_name: 'vpn_tunnels', label: 'vpnTunnels', field_type: 'number', data_type: 'number', display_order: 7, min_value: 0 },
    { field_name: 'ips_enabled', label: 'ipsEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'antivirus_enabled', label: 'antivirusEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'web_filter_enabled', label: 'webFilterEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 10 },
    { field_name: 'ha_mode', label: 'haMode', field_type: 'select', display_order: 11, options_source: JSON.stringify([
      { label: 'Standalone', value: 'STANDALONE' },
      { label: 'Active-Passive', value: 'ACTIVE_PASSIVE' },
      { label: 'Active-Active', value: 'ACTIVE_ACTIVE' },
      { label: 'Cluster', value: 'CLUSTER' }
    ])},
    ...commonNetworkFields.slice(3),
  ],

  // ACCESS_POINT
  ACCESS_POINT: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'wifi_standards', label: 'wifiStandards', field_type: 'multiselect', data_type: 'array', display_order: 4, options_source: JSON.stringify([
      { label: 'WiFi 4 (802.11n)', value: 'WIFI4' },
      { label: 'WiFi 5 (802.11ac)', value: 'WIFI5' },
      { label: 'WiFi 6 (802.11ax)', value: 'WIFI6' },
      { label: 'WiFi 6E', value: 'WIFI6E' },
      { label: 'WiFi 7 (802.11be)', value: 'WIFI7' }
    ])},
    { field_name: 'frequency_bands', label: 'frequencyBands', field_type: 'multiselect', data_type: 'array', display_order: 5, options_source: JSON.stringify([
      { label: '2.4 GHz', value: '2.4GHZ' },
      { label: '5 GHz', value: '5GHZ' },
      { label: '6 GHz', value: '6GHZ' }
    ])},
    { field_name: 'max_clients', label: 'maxClients', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'poe_powered', label: 'poePowered', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'controller_managed', label: 'controllerManaged', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'controller_ip', label: 'controllerIp', field_type: 'text', display_order: 9 },
    { field_name: 'ssid_count', label: 'ssidCount', field_type: 'number', data_type: 'number', display_order: 10, min_value: 0 },
    ...commonNetworkFields.slice(3),
  ],

  // LOAD_BALANCER
  LOAD_BALANCER: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'throughput_gbps', label: 'throughputGbps', field_type: 'number', data_type: 'number', display_order: 4, unit: 'Gbps', min_value: 0 },
    { field_name: 'virtual_servers', label: 'virtualServers', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'algorithm', label: 'algorithm', field_type: 'select', display_order: 6, options_source: JSON.stringify([
      { label: 'Round Robin', value: 'ROUND_ROBIN' },
      { label: 'Least Connections', value: 'LEAST_CONN' },
      { label: 'IP Hash', value: 'IP_HASH' },
      { label: 'Weighted', value: 'WEIGHTED' }
    ])},
    { field_name: 'ssl_offload', label: 'sslOffload', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'health_check_enabled', label: 'healthCheckEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'ha_mode', label: 'haMode', field_type: 'select', display_order: 9, options_source: JSON.stringify([
      { label: 'Standalone', value: 'STANDALONE' },
      { label: 'Active-Passive', value: 'ACTIVE_PASSIVE' },
      { label: 'Active-Active', value: 'ACTIVE_ACTIVE' }
    ])},
    ...commonNetworkFields.slice(3),
  ],

  // STORAGE
  STORAGE: [
    { field_name: 'storage_type', label: 'storageType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'SAN', value: 'SAN' },
      { label: 'NAS', value: 'NAS' },
      { label: 'DAS', value: 'DAS' },
      { label: 'Object Storage', value: 'OBJECT' },
      { label: 'Tape Library', value: 'TAPE' }
    ])},
    { field_name: 'total_capacity_tb', label: 'totalCapacityTb', field_type: 'number', data_type: 'number', display_order: 2, unit: 'TB', min_value: 0, show_in_table: true },
    { field_name: 'used_capacity_tb', label: 'usedCapacityTb', field_type: 'number', data_type: 'number', display_order: 3, unit: 'TB', min_value: 0 },
    { field_name: 'raid_level', label: 'raidLevel', field_type: 'select', display_order: 4, options_source: JSON.stringify([
      { label: 'RAID 0', value: 'RAID0' },
      { label: 'RAID 1', value: 'RAID1' },
      { label: 'RAID 5', value: 'RAID5' },
      { label: 'RAID 6', value: 'RAID6' },
      { label: 'RAID 10', value: 'RAID10' },
      { label: 'RAID 50', value: 'RAID50' },
      { label: 'RAID 60', value: 'RAID60' }
    ])},
    { field_name: 'disk_type', label: 'diskType', field_type: 'select', display_order: 5, options_source: JSON.stringify([
      { label: 'SSD', value: 'SSD' },
      { label: 'NVMe', value: 'NVME' },
      { label: 'SAS', value: 'SAS' },
      { label: 'SATA', value: 'SATA' },
      { label: 'Hybrid', value: 'HYBRID' }
    ])},
    { field_name: 'disk_count', label: 'diskCount', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'protocols', label: 'protocols', field_type: 'multiselect', data_type: 'array', display_order: 7, options_source: JSON.stringify([
      { label: 'iSCSI', value: 'ISCSI' },
      { label: 'FC', value: 'FC' },
      { label: 'NFS', value: 'NFS' },
      { label: 'SMB/CIFS', value: 'SMB' },
      { label: 'S3', value: 'S3' }
    ])},
    { field_name: 'ip_address', label: 'ipAddress', field_type: 'text', display_order: 8 },
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 12 },
  ],

  // WORKSTATION
  WORKSTATION: [
    { field_name: 'hostname', label: 'hostname', field_type: 'text', display_order: 1, show_in_table: true },
    { field_name: 'device_type', label: 'deviceType', field_type: 'select', display_order: 2, show_in_table: true, options_source: JSON.stringify([
      { label: 'Desktop', value: 'DESKTOP' },
      { label: 'Laptop', value: 'LAPTOP' },
      { label: 'Thin Client', value: 'THIN_CLIENT' },
      { label: 'All-in-One', value: 'AIO' }
    ])},
    { field_name: 'os', label: 'os', field_type: 'select', display_order: 3, options_source: JSON.stringify([
      { label: 'Windows 11', value: 'WIN11' },
      { label: 'Windows 10', value: 'WIN10' },
      { label: 'macOS', value: 'MACOS' },
      { label: 'Linux', value: 'LINUX' },
      { label: 'Chrome OS', value: 'CHROMEOS' }
    ])},
    { field_name: 'os_version', label: 'osVersion', field_type: 'text', display_order: 4 },
    { field_name: 'cpu', label: 'cpu', field_type: 'text', display_order: 5 },
    { field_name: 'ram_gb', label: 'ramGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 1 },
    { field_name: 'storage_gb', label: 'storageGb', field_type: 'number', data_type: 'number', display_order: 7, unit: 'GB', min_value: 0 },
    { field_name: 'storage_type', label: 'storageType', field_type: 'select', display_order: 8, options_source: JSON.stringify([
      { label: 'SSD', value: 'SSD' },
      { label: 'HDD', value: 'HDD' },
      { label: 'NVMe', value: 'NVME' }
    ])},
    { field_name: 'ip_address', label: 'ipAddress', field_type: 'text', display_order: 9 },
    { field_name: 'mac_address', label: 'macAddress', field_type: 'text', display_order: 10 },
    { field_name: 'assigned_user', label: 'assignedUser', field_type: 'text', display_order: 11, show_in_table: true },
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 15 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 16 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 17 },
    { field_name: 'asset_tag', label: 'assetTag', field_type: 'text', display_order: 18 },
  ],

  // PRINTER
  PRINTER: [
    { field_name: 'printer_type', label: 'printerType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'Laser', value: 'LASER' },
      { label: 'Inkjet', value: 'INKJET' },
      { label: 'Thermal', value: 'THERMAL' },
      { label: 'Dot Matrix', value: 'DOT_MATRIX' },
      { label: 'Multifunction', value: 'MFP' }
    ])},
    { field_name: 'color_capable', label: 'colorCapable', field_type: 'boolean', data_type: 'boolean', display_order: 2 },
    { field_name: 'duplex_capable', label: 'duplexCapable', field_type: 'boolean', data_type: 'boolean', display_order: 3 },
    { field_name: 'network_connected', label: 'networkConnected', field_type: 'boolean', data_type: 'boolean', display_order: 4 },
    { field_name: 'ip_address', label: 'ipAddress', field_type: 'text', display_order: 5 },
    { field_name: 'pages_per_minute', label: 'pagesPerMinute', field_type: 'number', data_type: 'number', display_order: 6, unit: 'ppm', min_value: 0 },
    { field_name: 'paper_sizes', label: 'paperSizes', field_type: 'multiselect', data_type: 'array', display_order: 7, options_source: JSON.stringify([
      { label: 'A4', value: 'A4' },
      { label: 'A3', value: 'A3' },
      { label: 'Letter', value: 'LETTER' },
      { label: 'Legal', value: 'LEGAL' }
    ])},
    { field_name: 'scan_capable', label: 'scanCapable', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'fax_capable', label: 'faxCapable', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 12 },
  ],

  // MOBILE_DEVICE
  MOBILE_DEVICE: [
    { field_name: 'device_type', label: 'deviceType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'Smartphone', value: 'SMARTPHONE' },
      { label: 'Tablet', value: 'TABLET' },
      { label: 'E-Reader', value: 'EREADER' }
    ])},
    { field_name: 'os', label: 'os', field_type: 'select', display_order: 2, options_source: JSON.stringify([
      { label: 'iOS', value: 'IOS' },
      { label: 'Android', value: 'ANDROID' },
      { label: 'iPadOS', value: 'IPADOS' }
    ])},
    { field_name: 'os_version', label: 'osVersion', field_type: 'text', display_order: 3 },
    { field_name: 'imei', label: 'imei', field_type: 'text', display_order: 4 },
    { field_name: 'phone_number', label: 'phoneNumber', field_type: 'text', display_order: 5 },
    { field_name: 'storage_gb', label: 'storageGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 0 },
    { field_name: 'mdm_enrolled', label: 'mdmEnrolled', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'assigned_user', label: 'assignedUser', field_type: 'text', display_order: 8, show_in_table: true },
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 12 },
  ],

  // DATABASE
  DATABASE: [
    { field_name: 'db_engine', label: 'dbEngine', field_type: 'select', display_order: 1, show_in_table: true, is_required: true, options_source: JSON.stringify([
      { label: 'PostgreSQL', value: 'POSTGRESQL' },
      { label: 'MySQL', value: 'MYSQL' },
      { label: 'MariaDB', value: 'MARIADB' },
      { label: 'Oracle', value: 'ORACLE' },
      { label: 'SQL Server', value: 'SQLSERVER' },
      { label: 'MongoDB', value: 'MONGODB' },
      { label: 'Redis', value: 'REDIS' },
      { label: 'Elasticsearch', value: 'ELASTICSEARCH' }
    ])},
    { field_name: 'version', label: 'version', field_type: 'text', display_order: 2 },
    { field_name: 'hostname', label: 'hostname', field_type: 'text', display_order: 3, show_in_table: true },
    { field_name: 'port', label: 'port', field_type: 'number', data_type: 'number', display_order: 4, min_value: 1, max_value: 65535 },
    { field_name: 'database_name', label: 'databaseName', field_type: 'text', display_order: 5 },
    { field_name: 'size_gb', label: 'sizeGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 0 },
    { field_name: 'environment', label: 'environment', field_type: 'select', display_order: 7, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' }
    ])},
    { field_name: 'cluster_enabled', label: 'clusterEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'replication_enabled', label: 'replicationEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'backup_enabled', label: 'backupEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 10 },
    { field_name: 'backup_frequency', label: 'backupFrequency', field_type: 'select', display_order: 11, options_source: JSON.stringify([
      { label: 'Hourly', value: 'HOURLY' },
      { label: 'Daily', value: 'DAILY' },
      { label: 'Weekly', value: 'WEEKLY' },
      { label: 'Monthly', value: 'MONTHLY' }
    ])},
    { field_name: 'ssl_enabled', label: 'sslEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 12 },
  ],

  // GENERIC - No specific fields, just common ones
  GENERIC: [
    { field_name: 'manufacturer', label: 'manufacturer', field_type: 'text', display_order: 1 },
    { field_name: 'model', label: 'model', field_type: 'text', display_order: 2 },
    { field_name: 'serial_number', label: 'serialNumber', field_type: 'text', display_order: 3 },
    { field_name: 'asset_tag', label: 'assetTag', field_type: 'text', display_order: 4 },
    { field_name: 'notes', label: 'notes', field_type: 'textarea', display_order: 10 },
  ],
};

/**
 * Save translations for a field
 */
async function saveFieldTranslations(fieldUuid, fieldName) {
  const translations = fieldTranslations[fieldName];
  if (!translations) return;
  
  for (const [locale, value] of Object.entries(translations)) {
    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: 'ci_type_fields',
          entity_uuid: fieldUuid,
          field_name: 'label',
          locale
        }
      },
      update: { value },
      create: {
        entity_type: 'ci_type_fields',
        entity_uuid: fieldUuid,
        field_name: 'label',
        locale,
        value
      }
    });
  }
}

async function seedCiTypeFields() {
  console.log('Seeding CI type fields...');

  // Get all CI types
  const ciTypes = await prisma.ci_types.findMany();
  const ciTypeMap = new Map(ciTypes.map(ct => [ct.code, ct.uuid]));

  let totalFields = 0;
  let totalTranslations = 0;

  for (const [ciTypeCode, fields] of Object.entries(fieldsByCiType)) {
    const ciTypeUuid = ciTypeMap.get(ciTypeCode);
    
    if (!ciTypeUuid) {
      console.log(`  Warning: CI type '${ciTypeCode}' not found, skipping fields`);
      continue;
    }

    console.log(`  Creating fields for CI type: ${ciTypeCode}`);
    
    for (const field of fields) {
      // Get the English label from translations dictionary, or use field_name as fallback
      const translations = fieldTranslations[field.field_name];
      const englishLabel = translations?.en || field.label || field.field_name;
      
      // Create/update the field with English label as default
      // Default values: show_in_table and show_in_form are true unless explicitly set to false
      const fieldData = {
        show_in_table: true,
        show_in_form: true,
        ...field,  // Explicit field values override defaults
        label: englishLabel,
        ci_type_uuid: ciTypeUuid
      };
      
      const createdField = await prisma.ci_type_fields.upsert({
        where: {
          ci_type_uuid_field_name: {
            ci_type_uuid: ciTypeUuid,
            field_name: field.field_name,
          },
        },
        update: fieldData,
        create: fieldData,
      });
      
      // Save translations
      if (translations) {
        await saveFieldTranslations(createdField.uuid, field.field_name);
        totalTranslations++;
      }
      
      totalFields++;
    }
    
    console.log(`    Created ${fields.length} fields`);
  }

  console.log(`CI type fields seeding completed! ${totalFields} fields, ${totalTranslations} with translations`);
}

module.exports = { seedCiTypeFields };
