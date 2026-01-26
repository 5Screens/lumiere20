/**
 * Workflow Entity Config Service
 * Business logic for workflow entity configuration (mapping entity types to subtypes)
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

/**
 * Get all workflow entity configurations
 */
const getAll = async ({ activeOnly = true } = {}) => {
  const where = activeOnly ? { is_active: true } : {};
  
  const configs = await prisma.workflow_entity_config.findMany({
    where,
    orderBy: { entity_type: 'asc' }
  });
  
  return configs;
};

/**
 * Get workflow entity configuration by entity type
 */
const getByEntityType = async (entityType) => {
  const config = await prisma.workflow_entity_config.findUnique({
    where: { entity_type: entityType }
  });
  
  return config;
};

/**
 * Get workflow entity configuration by UUID
 */
const getByUuid = async (uuid) => {
  const config = await prisma.workflow_entity_config.findUnique({
    where: { uuid }
  });
  
  return config;
};

/**
 * Get available subtypes for an entity type
 * Returns the list of subtypes from the configured table or static options
 */
const getSubtypes = async (entityType, locale = 'en') => {
  const config = await getByEntityType(entityType);
  
  if (!config) {
    logger.warn(`[WORKFLOW_ENTITY_CONFIG] No configuration found for entity type: ${entityType}`);
    return [];
  }
  
  // If static options are defined, return them
  if (config.subtype_options && Array.isArray(config.subtype_options)) {
    return config.subtype_options.map(option => ({
      value: option,
      label: option,
      code: option
    }));
  }
  
  // If a table is defined, query it dynamically
  if (config.subtype_table) {
    try {
      const tableName = config.subtype_table;
      const uuidField = config.subtype_uuid_field || 'uuid';
      const codeField = config.subtype_code_field || 'code';
      const labelField = config.subtype_label_field || 'label';
      
      // Use dynamic Prisma query
      const items = await prisma[tableName].findMany({
        where: { is_active: true },
        orderBy: { [labelField]: 'asc' }
      });
      
      // Get translations if available
      const uuids = items.map(item => item[uuidField]);
      const translations = await prisma.translated_fields.findMany({
        where: {
          entity_type: tableName,
          entity_uuid: { in: uuids },
          field_name: labelField,
          locale
        }
      });
      
      const translationMap = {};
      for (const t of translations) {
        translationMap[t.entity_uuid] = t.value;
      }
      
      return items.map(item => ({
        value: item[uuidField],
        label: translationMap[item[uuidField]] || item[labelField] || item[codeField],
        code: item[codeField]
      }));
    } catch (error) {
      logger.error(`[WORKFLOW_ENTITY_CONFIG] Error fetching subtypes from table ${config.subtype_table}:`, error);
      return [];
    }
  }
  
  return [];
};

/**
 * Get the subtype value for a specific entity instance
 * Given an entity UUID and type, returns the subtype value (e.g., ci_type code for a configuration_item)
 */
const getEntitySubtype = async (entityType, entityUuid) => {
  const config = await getByEntityType(entityType);
  
  if (!config) {
    logger.warn(`[WORKFLOW_ENTITY_CONFIG] No configuration found for entity type: ${entityType}`);
    return null;
  }
  
  try {
    // Query the entity to get its subtype field value
    const entity = await prisma[entityType].findUnique({
      where: { uuid: entityUuid },
      select: { [config.subtype_field]: true }
    });
    
    if (!entity) {
      return null;
    }
    
    const subtypeValue = entity[config.subtype_field];
    
    // If there's a subtype table, resolve the UUID
    if (config.subtype_table && config.subtype_code_field) {
      // The subtype value might be a code, we need to get the UUID
      const subtypeRecord = await prisma[config.subtype_table].findFirst({
        where: { [config.subtype_code_field]: subtypeValue }
      });
      
      return subtypeRecord ? {
        code: subtypeValue,
        uuid: subtypeRecord[config.subtype_uuid_field || 'uuid']
      } : { code: subtypeValue, uuid: null };
    }
    
    return { code: subtypeValue, uuid: null };
  } catch (error) {
    logger.error(`[WORKFLOW_ENTITY_CONFIG] Error getting entity subtype:`, error);
    return null;
  }
};

/**
 * Create a new workflow entity configuration
 */
const create = async (data) => {
  const config = await prisma.workflow_entity_config.create({
    data
  });
  
  logger.info(`[WORKFLOW_ENTITY_CONFIG] Created: ${config.entity_type}`);
  return config;
};

/**
 * Update a workflow entity configuration
 */
const update = async (uuid, data) => {
  const config = await prisma.workflow_entity_config.update({
    where: { uuid },
    data
  });
  
  logger.info(`[WORKFLOW_ENTITY_CONFIG] Updated: ${config.entity_type}`);
  return config;
};

/**
 * Delete a workflow entity configuration
 */
const remove = async (uuid) => {
  const config = await prisma.workflow_entity_config.delete({
    where: { uuid }
  });
  
  logger.info(`[WORKFLOW_ENTITY_CONFIG] Deleted: ${config.entity_type}`);
  return config;
};

module.exports = {
  getAll,
  getByEntityType,
  getByUuid,
  getSubtypes,
  getEntitySubtype,
  create,
  update,
  remove
};
