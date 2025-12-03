/**
 * Seed script for CI Type Fields
 * Defines extended fields for each CI type stored in configuration_items.extended_core_fields
 */

const { prisma } = require('../client');

// Common fields shared across multiple CI types
const commonNetworkFields = [
  { field_name: 'ip_address', label_key: 'ciFields.ipAddress', field_type: 'text', display_order: 1, pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' },
  { field_name: 'mac_address', label_key: 'ciFields.macAddress', field_type: 'text', display_order: 2, pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
  { field_name: 'firmware_version', label_key: 'ciFields.firmwareVersion', field_type: 'text', display_order: 3 },
  { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 10 },
  { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 11 },
  { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 12 },
  { field_name: 'purchase_date', label_key: 'ciFields.purchaseDate', field_type: 'date', data_type: 'date', display_order: 13 },
  { field_name: 'warranty_expiry', label_key: 'ciFields.warrantyExpiry', field_type: 'date', data_type: 'date', display_order: 14 },
];

// Field definitions by CI type code
const fieldsByCiType = {
  // UPS - Uninterruptible Power Supply
  UPS: [
    { field_name: 'power_capacity_va', label_key: 'ciFields.powerCapacityVa', field_type: 'number', data_type: 'number', display_order: 1, unit: 'VA', min_value: 0 },
    { field_name: 'power_capacity_watts', label_key: 'ciFields.powerCapacityWatts', field_type: 'number', data_type: 'number', display_order: 2, unit: 'W', min_value: 0 },
    { field_name: 'battery_count', label_key: 'ciFields.batteryCount', field_type: 'number', data_type: 'number', display_order: 3, min_value: 1 },
    { field_name: 'runtime_minutes', label_key: 'ciFields.runtimeMinutes', field_type: 'number', data_type: 'number', display_order: 4, unit: 'min', min_value: 0 },
    { field_name: 'last_battery_change', label_key: 'ciFields.lastBatteryChange', field_type: 'date', data_type: 'date', display_order: 5 },
    { field_name: 'next_battery_change', label_key: 'ciFields.nextBatteryChange', field_type: 'date', data_type: 'date', display_order: 6 },
    { field_name: 'input_voltage', label_key: 'ciFields.inputVoltage', field_type: 'number', data_type: 'number', display_order: 7, unit: 'V' },
    { field_name: 'output_voltage', label_key: 'ciFields.outputVoltage', field_type: 'number', data_type: 'number', display_order: 8, unit: 'V' },
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 12 },
    { field_name: 'location_rack', label_key: 'ciFields.locationRack', field_type: 'text', display_order: 15 },
  ],

  // APPLICATION - Software Application
  APPLICATION: [
    { field_name: 'version', label_key: 'ciFields.version', field_type: 'text', display_order: 1, show_in_table: true },
    { field_name: 'vendor', label_key: 'ciFields.vendor', field_type: 'text', display_order: 2, show_in_table: true },
    { field_name: 'license_type', label_key: 'ciFields.licenseType', field_type: 'select', display_order: 3, options_source: JSON.stringify([
      { label: 'Perpetual', value: 'PERPETUAL' },
      { label: 'Subscription', value: 'SUBSCRIPTION' },
      { label: 'Open Source', value: 'OPEN_SOURCE' },
      { label: 'Freeware', value: 'FREEWARE' },
      { label: 'Trial', value: 'TRIAL' }
    ])},
    { field_name: 'license_count', label_key: 'ciFields.licenseCount', field_type: 'number', data_type: 'number', display_order: 4, min_value: 0 },
    { field_name: 'license_expiry', label_key: 'ciFields.licenseExpiry', field_type: 'date', data_type: 'date', display_order: 5 },
    { field_name: 'environment', label_key: 'ciFields.environment', field_type: 'select', display_order: 6, show_in_table: true, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' }
    ])},
    { field_name: 'url', label_key: 'ciFields.url', field_type: 'text', display_order: 7 },
    { field_name: 'documentation_url', label_key: 'ciFields.documentationUrl', field_type: 'text', display_order: 8 },
    { field_name: 'support_contact', label_key: 'ciFields.supportContact', field_type: 'text', display_order: 9 },
    { field_name: 'business_owner', label_key: 'ciFields.businessOwner', field_type: 'text', display_order: 10 },
    { field_name: 'technical_owner', label_key: 'ciFields.technicalOwner', field_type: 'text', display_order: 11 },
  ],

  // SERVER - Physical or Virtual Server
  SERVER: [
    { field_name: 'hostname', label_key: 'ciFields.hostname', field_type: 'text', display_order: 1, is_required: true, show_in_table: true },
    { field_name: 'ip_address', label_key: 'ciFields.ipAddress', field_type: 'text', display_order: 2, show_in_table: true },
    { field_name: 'os', label_key: 'ciFields.os', field_type: 'select', display_order: 3, show_in_table: true, options_source: JSON.stringify([
      { label: 'Windows Server', value: 'WINDOWS_SERVER' },
      { label: 'Linux (RHEL)', value: 'LINUX_RHEL' },
      { label: 'Linux (Ubuntu)', value: 'LINUX_UBUNTU' },
      { label: 'Linux (Debian)', value: 'LINUX_DEBIAN' },
      { label: 'Linux (CentOS)', value: 'LINUX_CENTOS' },
      { label: 'VMware ESXi', value: 'VMWARE_ESXI' },
      { label: 'Other', value: 'OTHER' }
    ])},
    { field_name: 'os_version', label_key: 'ciFields.osVersion', field_type: 'text', display_order: 4 },
    { field_name: 'is_virtual', label_key: 'ciFields.isVirtual', field_type: 'boolean', data_type: 'boolean', display_order: 5, default_value: 'false' },
    { field_name: 'hypervisor', label_key: 'ciFields.hypervisor', field_type: 'select', display_order: 6, options_source: JSON.stringify([
      { label: 'VMware vSphere', value: 'VMWARE' },
      { label: 'Microsoft Hyper-V', value: 'HYPERV' },
      { label: 'KVM', value: 'KVM' },
      { label: 'Xen', value: 'XEN' },
      { label: 'Proxmox', value: 'PROXMOX' },
      { label: 'None (Physical)', value: 'NONE' }
    ])},
    { field_name: 'cpu_count', label_key: 'ciFields.cpuCount', field_type: 'number', data_type: 'number', display_order: 7, min_value: 1 },
    { field_name: 'cpu_cores', label_key: 'ciFields.cpuCores', field_type: 'number', data_type: 'number', display_order: 8, min_value: 1 },
    { field_name: 'ram_gb', label_key: 'ciFields.ramGb', field_type: 'number', data_type: 'number', display_order: 9, unit: 'GB', min_value: 1 },
    { field_name: 'storage_gb', label_key: 'ciFields.storageGb', field_type: 'number', data_type: 'number', display_order: 10, unit: 'GB', min_value: 0 },
    { field_name: 'environment', label_key: 'ciFields.environment', field_type: 'select', display_order: 11, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' },
      { label: 'DR', value: 'DR' }
    ])},
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 15 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 16 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 17 },
    { field_name: 'location_datacenter', label_key: 'ciFields.locationDatacenter', field_type: 'text', display_order: 20 },
    { field_name: 'location_rack', label_key: 'ciFields.locationRack', field_type: 'text', display_order: 21 },
    { field_name: 'location_rack_unit', label_key: 'ciFields.locationRackUnit', field_type: 'text', display_order: 22 },
  ],

  // ROUTER
  ROUTER: [
    ...commonNetworkFields.slice(0, 3), // ip, mac, firmware
    { field_name: 'routing_protocols', label_key: 'ciFields.routingProtocols', field_type: 'multiselect', data_type: 'array', display_order: 4, options_source: JSON.stringify([
      { label: 'OSPF', value: 'OSPF' },
      { label: 'BGP', value: 'BGP' },
      { label: 'EIGRP', value: 'EIGRP' },
      { label: 'RIP', value: 'RIP' },
      { label: 'Static', value: 'STATIC' }
    ])},
    { field_name: 'wan_interfaces', label_key: 'ciFields.wanInterfaces', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'lan_interfaces', label_key: 'ciFields.lanInterfaces', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'nat_enabled', label_key: 'ciFields.natEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'vpn_enabled', label_key: 'ciFields.vpnEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    ...commonNetworkFields.slice(3), // manufacturer, model, serial, dates
  ],

  // SWITCH
  SWITCH: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'port_count', label_key: 'ciFields.portCount', field_type: 'number', data_type: 'number', display_order: 4, min_value: 1, show_in_table: true },
    { field_name: 'port_speed', label_key: 'ciFields.portSpeed', field_type: 'select', display_order: 5, options_source: JSON.stringify([
      { label: '100 Mbps', value: '100M' },
      { label: '1 Gbps', value: '1G' },
      { label: '10 Gbps', value: '10G' },
      { label: '25 Gbps', value: '25G' },
      { label: '40 Gbps', value: '40G' },
      { label: '100 Gbps', value: '100G' }
    ])},
    { field_name: 'layer', label_key: 'ciFields.layer', field_type: 'select', display_order: 6, options_source: JSON.stringify([
      { label: 'Layer 2', value: 'L2' },
      { label: 'Layer 3', value: 'L3' }
    ])},
    { field_name: 'managed', label_key: 'ciFields.managed', field_type: 'boolean', data_type: 'boolean', display_order: 7, default_value: 'true' },
    { field_name: 'poe_enabled', label_key: 'ciFields.poeEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'poe_budget_watts', label_key: 'ciFields.poeBudgetWatts', field_type: 'number', data_type: 'number', display_order: 9, unit: 'W', min_value: 0 },
    { field_name: 'vlan_count', label_key: 'ciFields.vlanCount', field_type: 'number', data_type: 'number', display_order: 10, min_value: 0 },
    { field_name: 'stacking_enabled', label_key: 'ciFields.stackingEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 11 },
    ...commonNetworkFields.slice(3),
  ],

  // FIREWALL
  FIREWALL: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'throughput_gbps', label_key: 'ciFields.throughputGbps', field_type: 'number', data_type: 'number', display_order: 4, unit: 'Gbps', min_value: 0 },
    { field_name: 'max_connections', label_key: 'ciFields.maxConnections', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'vpn_enabled', label_key: 'ciFields.vpnEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 6 },
    { field_name: 'vpn_tunnels', label_key: 'ciFields.vpnTunnels', field_type: 'number', data_type: 'number', display_order: 7, min_value: 0 },
    { field_name: 'ips_enabled', label_key: 'ciFields.ipsEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'antivirus_enabled', label_key: 'ciFields.antivirusEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'web_filter_enabled', label_key: 'ciFields.webFilterEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 10 },
    { field_name: 'ha_mode', label_key: 'ciFields.haMode', field_type: 'select', display_order: 11, options_source: JSON.stringify([
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
    { field_name: 'wifi_standards', label_key: 'ciFields.wifiStandards', field_type: 'multiselect', data_type: 'array', display_order: 4, options_source: JSON.stringify([
      { label: 'WiFi 4 (802.11n)', value: 'WIFI4' },
      { label: 'WiFi 5 (802.11ac)', value: 'WIFI5' },
      { label: 'WiFi 6 (802.11ax)', value: 'WIFI6' },
      { label: 'WiFi 6E', value: 'WIFI6E' },
      { label: 'WiFi 7 (802.11be)', value: 'WIFI7' }
    ])},
    { field_name: 'frequency_bands', label_key: 'ciFields.frequencyBands', field_type: 'multiselect', data_type: 'array', display_order: 5, options_source: JSON.stringify([
      { label: '2.4 GHz', value: '2.4GHZ' },
      { label: '5 GHz', value: '5GHZ' },
      { label: '6 GHz', value: '6GHZ' }
    ])},
    { field_name: 'max_clients', label_key: 'ciFields.maxClients', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'poe_powered', label_key: 'ciFields.poePowered', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'controller_managed', label_key: 'ciFields.controllerManaged', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'controller_ip', label_key: 'ciFields.controllerIp', field_type: 'text', display_order: 9 },
    { field_name: 'ssid_count', label_key: 'ciFields.ssidCount', field_type: 'number', data_type: 'number', display_order: 10, min_value: 0 },
    ...commonNetworkFields.slice(3),
  ],

  // LOAD_BALANCER
  LOAD_BALANCER: [
    ...commonNetworkFields.slice(0, 3),
    { field_name: 'throughput_gbps', label_key: 'ciFields.throughputGbps', field_type: 'number', data_type: 'number', display_order: 4, unit: 'Gbps', min_value: 0 },
    { field_name: 'virtual_servers', label_key: 'ciFields.virtualServers', field_type: 'number', data_type: 'number', display_order: 5, min_value: 0 },
    { field_name: 'algorithm', label_key: 'ciFields.algorithm', field_type: 'select', display_order: 6, options_source: JSON.stringify([
      { label: 'Round Robin', value: 'ROUND_ROBIN' },
      { label: 'Least Connections', value: 'LEAST_CONN' },
      { label: 'IP Hash', value: 'IP_HASH' },
      { label: 'Weighted', value: 'WEIGHTED' }
    ])},
    { field_name: 'ssl_offload', label_key: 'ciFields.sslOffload', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'health_check_enabled', label_key: 'ciFields.healthCheckEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'ha_mode', label_key: 'ciFields.haMode', field_type: 'select', display_order: 9, options_source: JSON.stringify([
      { label: 'Standalone', value: 'STANDALONE' },
      { label: 'Active-Passive', value: 'ACTIVE_PASSIVE' },
      { label: 'Active-Active', value: 'ACTIVE_ACTIVE' }
    ])},
    ...commonNetworkFields.slice(3),
  ],

  // STORAGE
  STORAGE: [
    { field_name: 'storage_type', label_key: 'ciFields.storageType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'SAN', value: 'SAN' },
      { label: 'NAS', value: 'NAS' },
      { label: 'DAS', value: 'DAS' },
      { label: 'Object Storage', value: 'OBJECT' },
      { label: 'Tape Library', value: 'TAPE' }
    ])},
    { field_name: 'total_capacity_tb', label_key: 'ciFields.totalCapacityTb', field_type: 'number', data_type: 'number', display_order: 2, unit: 'TB', min_value: 0, show_in_table: true },
    { field_name: 'used_capacity_tb', label_key: 'ciFields.usedCapacityTb', field_type: 'number', data_type: 'number', display_order: 3, unit: 'TB', min_value: 0 },
    { field_name: 'raid_level', label_key: 'ciFields.raidLevel', field_type: 'select', display_order: 4, options_source: JSON.stringify([
      { label: 'RAID 0', value: 'RAID0' },
      { label: 'RAID 1', value: 'RAID1' },
      { label: 'RAID 5', value: 'RAID5' },
      { label: 'RAID 6', value: 'RAID6' },
      { label: 'RAID 10', value: 'RAID10' },
      { label: 'RAID 50', value: 'RAID50' },
      { label: 'RAID 60', value: 'RAID60' }
    ])},
    { field_name: 'disk_type', label_key: 'ciFields.diskType', field_type: 'select', display_order: 5, options_source: JSON.stringify([
      { label: 'SSD', value: 'SSD' },
      { label: 'NVMe', value: 'NVME' },
      { label: 'SAS', value: 'SAS' },
      { label: 'SATA', value: 'SATA' },
      { label: 'Hybrid', value: 'HYBRID' }
    ])},
    { field_name: 'disk_count', label_key: 'ciFields.diskCount', field_type: 'number', data_type: 'number', display_order: 6, min_value: 0 },
    { field_name: 'protocols', label_key: 'ciFields.protocols', field_type: 'multiselect', data_type: 'array', display_order: 7, options_source: JSON.stringify([
      { label: 'iSCSI', value: 'ISCSI' },
      { label: 'FC', value: 'FC' },
      { label: 'NFS', value: 'NFS' },
      { label: 'SMB/CIFS', value: 'SMB' },
      { label: 'S3', value: 'S3' }
    ])},
    { field_name: 'ip_address', label_key: 'ciFields.ipAddress', field_type: 'text', display_order: 8 },
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 12 },
  ],

  // WORKSTATION
  WORKSTATION: [
    { field_name: 'hostname', label_key: 'ciFields.hostname', field_type: 'text', display_order: 1, show_in_table: true },
    { field_name: 'device_type', label_key: 'ciFields.deviceType', field_type: 'select', display_order: 2, show_in_table: true, options_source: JSON.stringify([
      { label: 'Desktop', value: 'DESKTOP' },
      { label: 'Laptop', value: 'LAPTOP' },
      { label: 'Thin Client', value: 'THIN_CLIENT' },
      { label: 'All-in-One', value: 'AIO' }
    ])},
    { field_name: 'os', label_key: 'ciFields.os', field_type: 'select', display_order: 3, options_source: JSON.stringify([
      { label: 'Windows 11', value: 'WIN11' },
      { label: 'Windows 10', value: 'WIN10' },
      { label: 'macOS', value: 'MACOS' },
      { label: 'Linux', value: 'LINUX' },
      { label: 'Chrome OS', value: 'CHROMEOS' }
    ])},
    { field_name: 'os_version', label_key: 'ciFields.osVersion', field_type: 'text', display_order: 4 },
    { field_name: 'cpu', label_key: 'ciFields.cpu', field_type: 'text', display_order: 5 },
    { field_name: 'ram_gb', label_key: 'ciFields.ramGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 1 },
    { field_name: 'storage_gb', label_key: 'ciFields.storageGb', field_type: 'number', data_type: 'number', display_order: 7, unit: 'GB', min_value: 0 },
    { field_name: 'storage_type', label_key: 'ciFields.storageType', field_type: 'select', display_order: 8, options_source: JSON.stringify([
      { label: 'SSD', value: 'SSD' },
      { label: 'HDD', value: 'HDD' },
      { label: 'NVMe', value: 'NVME' }
    ])},
    { field_name: 'ip_address', label_key: 'ciFields.ipAddress', field_type: 'text', display_order: 9 },
    { field_name: 'mac_address', label_key: 'ciFields.macAddress', field_type: 'text', display_order: 10 },
    { field_name: 'assigned_user', label_key: 'ciFields.assignedUser', field_type: 'text', display_order: 11, show_in_table: true },
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 15 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 16 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 17 },
    { field_name: 'asset_tag', label_key: 'ciFields.assetTag', field_type: 'text', display_order: 18 },
  ],

  // PRINTER
  PRINTER: [
    { field_name: 'printer_type', label_key: 'ciFields.printerType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'Laser', value: 'LASER' },
      { label: 'Inkjet', value: 'INKJET' },
      { label: 'Thermal', value: 'THERMAL' },
      { label: 'Dot Matrix', value: 'DOT_MATRIX' },
      { label: 'Multifunction', value: 'MFP' }
    ])},
    { field_name: 'color_capable', label_key: 'ciFields.colorCapable', field_type: 'boolean', data_type: 'boolean', display_order: 2 },
    { field_name: 'duplex_capable', label_key: 'ciFields.duplexCapable', field_type: 'boolean', data_type: 'boolean', display_order: 3 },
    { field_name: 'network_connected', label_key: 'ciFields.networkConnected', field_type: 'boolean', data_type: 'boolean', display_order: 4 },
    { field_name: 'ip_address', label_key: 'ciFields.ipAddress', field_type: 'text', display_order: 5 },
    { field_name: 'pages_per_minute', label_key: 'ciFields.pagesPerMinute', field_type: 'number', data_type: 'number', display_order: 6, unit: 'ppm', min_value: 0 },
    { field_name: 'paper_sizes', label_key: 'ciFields.paperSizes', field_type: 'multiselect', data_type: 'array', display_order: 7, options_source: JSON.stringify([
      { label: 'A4', value: 'A4' },
      { label: 'A3', value: 'A3' },
      { label: 'Letter', value: 'LETTER' },
      { label: 'Legal', value: 'LEGAL' }
    ])},
    { field_name: 'scan_capable', label_key: 'ciFields.scanCapable', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'fax_capable', label_key: 'ciFields.faxCapable', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 12 },
  ],

  // MOBILE_DEVICE
  MOBILE_DEVICE: [
    { field_name: 'device_type', label_key: 'ciFields.deviceType', field_type: 'select', display_order: 1, show_in_table: true, options_source: JSON.stringify([
      { label: 'Smartphone', value: 'SMARTPHONE' },
      { label: 'Tablet', value: 'TABLET' },
      { label: 'E-Reader', value: 'EREADER' }
    ])},
    { field_name: 'os', label_key: 'ciFields.os', field_type: 'select', display_order: 2, options_source: JSON.stringify([
      { label: 'iOS', value: 'IOS' },
      { label: 'Android', value: 'ANDROID' },
      { label: 'iPadOS', value: 'IPADOS' }
    ])},
    { field_name: 'os_version', label_key: 'ciFields.osVersion', field_type: 'text', display_order: 3 },
    { field_name: 'imei', label_key: 'ciFields.imei', field_type: 'text', display_order: 4 },
    { field_name: 'phone_number', label_key: 'ciFields.phoneNumber', field_type: 'text', display_order: 5 },
    { field_name: 'storage_gb', label_key: 'ciFields.storageGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 0 },
    { field_name: 'mdm_enrolled', label_key: 'ciFields.mdmEnrolled', field_type: 'boolean', data_type: 'boolean', display_order: 7 },
    { field_name: 'assigned_user', label_key: 'ciFields.assignedUser', field_type: 'text', display_order: 8, show_in_table: true },
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 10 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 11 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 12 },
  ],

  // DATABASE
  DATABASE: [
    { field_name: 'db_engine', label_key: 'ciFields.dbEngine', field_type: 'select', display_order: 1, show_in_table: true, is_required: true, options_source: JSON.stringify([
      { label: 'PostgreSQL', value: 'POSTGRESQL' },
      { label: 'MySQL', value: 'MYSQL' },
      { label: 'MariaDB', value: 'MARIADB' },
      { label: 'Oracle', value: 'ORACLE' },
      { label: 'SQL Server', value: 'SQLSERVER' },
      { label: 'MongoDB', value: 'MONGODB' },
      { label: 'Redis', value: 'REDIS' },
      { label: 'Elasticsearch', value: 'ELASTICSEARCH' }
    ])},
    { field_name: 'version', label_key: 'ciFields.version', field_type: 'text', display_order: 2 },
    { field_name: 'hostname', label_key: 'ciFields.hostname', field_type: 'text', display_order: 3, show_in_table: true },
    { field_name: 'port', label_key: 'ciFields.port', field_type: 'number', data_type: 'number', display_order: 4, min_value: 1, max_value: 65535 },
    { field_name: 'database_name', label_key: 'ciFields.databaseName', field_type: 'text', display_order: 5 },
    { field_name: 'size_gb', label_key: 'ciFields.sizeGb', field_type: 'number', data_type: 'number', display_order: 6, unit: 'GB', min_value: 0 },
    { field_name: 'environment', label_key: 'ciFields.environment', field_type: 'select', display_order: 7, options_source: JSON.stringify([
      { label: 'Production', value: 'PRODUCTION' },
      { label: 'Staging', value: 'STAGING' },
      { label: 'Development', value: 'DEVELOPMENT' },
      { label: 'Test', value: 'TEST' }
    ])},
    { field_name: 'cluster_enabled', label_key: 'ciFields.clusterEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 8 },
    { field_name: 'replication_enabled', label_key: 'ciFields.replicationEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 9 },
    { field_name: 'backup_enabled', label_key: 'ciFields.backupEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 10 },
    { field_name: 'backup_frequency', label_key: 'ciFields.backupFrequency', field_type: 'select', display_order: 11, options_source: JSON.stringify([
      { label: 'Hourly', value: 'HOURLY' },
      { label: 'Daily', value: 'DAILY' },
      { label: 'Weekly', value: 'WEEKLY' },
      { label: 'Monthly', value: 'MONTHLY' }
    ])},
    { field_name: 'ssl_enabled', label_key: 'ciFields.sslEnabled', field_type: 'boolean', data_type: 'boolean', display_order: 12 },
  ],

  // GENERIC - No specific fields, just common ones
  GENERIC: [
    { field_name: 'manufacturer', label_key: 'ciFields.manufacturer', field_type: 'text', display_order: 1 },
    { field_name: 'model', label_key: 'ciFields.model', field_type: 'text', display_order: 2 },
    { field_name: 'serial_number', label_key: 'ciFields.serialNumber', field_type: 'text', display_order: 3 },
    { field_name: 'asset_tag', label_key: 'ciFields.assetTag', field_type: 'text', display_order: 4 },
    { field_name: 'notes', label_key: 'ciFields.notes', field_type: 'textarea', display_order: 10 },
  ],
};

async function seedCiTypeFields() {
  console.log('Seeding CI type fields...');

  // Get all CI types
  const ciTypes = await prisma.ci_types.findMany();
  const ciTypeMap = new Map(ciTypes.map(ct => [ct.code, ct.uuid]));

  for (const [ciTypeCode, fields] of Object.entries(fieldsByCiType)) {
    const ciTypeUuid = ciTypeMap.get(ciTypeCode);
    
    if (!ciTypeUuid) {
      console.log(`  Warning: CI type '${ciTypeCode}' not found, skipping fields`);
      continue;
    }

    console.log(`  Creating fields for CI type: ${ciTypeCode}`);
    
    for (const field of fields) {
      await prisma.ci_type_fields.upsert({
        where: {
          ci_type_uuid_field_name: {
            ci_type_uuid: ciTypeUuid,
            field_name: field.field_name,
          },
        },
        update: { ...field, ci_type_uuid: ciTypeUuid },
        create: { ...field, ci_type_uuid: ciTypeUuid },
      });
    }
    
    console.log(`    Created ${fields.length} fields`);
  }

  console.log('CI type fields seeding completed!');
}

module.exports = { seedCiTypeFields };
