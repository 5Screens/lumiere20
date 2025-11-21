/**
 * Validation schemas for Configuration Items types
 */
const CI_TYPE_SCHEMAS = {
  UPS: {
    required: ['voltage', 'capacity_va'],
    optional: ['battery_autonomy_min', 'brand', 'model', 'serial_number'],
    types: {
      voltage: 'number',
      capacity_va: 'number',
      battery_autonomy_min: 'number',
      brand: 'string',
      model: 'string',
      serial_number: 'string'
    }
  },
  APPLICATION: {
    required: ['version'],
    optional: ['deployment_date', 'server_count', 'language', 'framework', 'repository_url'],
    types: {
      version: 'string',
      deployment_date: 'string',
      server_count: 'number',
      language: 'string',
      framework: 'string',
      repository_url: 'string'
    }
  },
  SERVER: {
    required: ['hostname'],
    optional: ['ip_address', 'cpu_cores', 'ram_gb', 'disk_gb', 'os', 'location'],
    types: {
      hostname: 'string',
      ip_address: 'string',
      cpu_cores: 'number',
      ram_gb: 'number',
      disk_gb: 'number',
      os: 'string',
      location: 'string'
    }
  },
  NETWORK_DEVICE: {
    required: ['device_type'],
    optional: ['ip_address', 'mac_address', 'port_count', 'vlan_support'],
    types: {
      device_type: 'string',
      ip_address: 'string',
      mac_address: 'string',
      port_count: 'number',
      vlan_support: 'boolean'
    }
  },
  GENERIC: {
    required: [],
    optional: [],
    types: {}
  }
};

/**
 * Validate extended fields based on CI type
 * @param {string} ciType - Type of configuration item
 * @param {Object} extendedFields - Extended fields to validate
 * @returns {Object} - Validation result with valid flag and errors array
 */
const validateExtendedFields = (ciType, extendedFields) => {
  const schema = CI_TYPE_SCHEMAS[ciType];
  
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown CI type: ${ciType}. Valid types: ${Object.keys(CI_TYPE_SCHEMAS).join(', ')}`]
    };
  }
  
  const errors = [];
  
  // Check required fields
  for (const field of schema.required) {
    if (!(field in extendedFields)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check field types
  for (const [field, value] of Object.entries(extendedFields)) {
    const expectedType = schema.types[field];
    
    if (!expectedType) {
      errors.push(`Unknown field: ${field} for CI type ${ciType}`);
      continue;
    }
    
    const actualType = typeof value;
    if (actualType !== expectedType) {
      errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  CI_TYPE_SCHEMAS,
  validateExtendedFields
};
