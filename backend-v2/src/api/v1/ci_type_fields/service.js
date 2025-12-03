/**
 * CI Type Fields Service
 * Handles CRUD operations for CI type extended fields
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get all fields for a CI type
 * @param {string} ciTypeUuid - CI type UUID
 * @returns {Promise<Array>} List of fields
 */
const getByTypeUuid = async (ciTypeUuid) => {
  try {
    const fields = await prisma.ci_type_fields.findMany({
      where: { ci_type_uuid: ciTypeUuid },
      orderBy: { display_order: 'asc' }
    });
    
    // Parse options_source JSON
    return fields.map(field => ({
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    }));
  } catch (error) {
    logger.error(`Error fetching fields for CI type ${ciTypeUuid}:`, error);
    throw error;
  }
};

/**
 * Get a single field by UUID
 * @param {string} uuid - Field UUID
 * @returns {Promise<Object|null>} Field or null
 */
const getByUuid = async (uuid) => {
  try {
    const field = await prisma.ci_type_fields.findUnique({
      where: { uuid }
    });
    
    if (!field) return null;
    
    return {
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    };
  } catch (error) {
    logger.error(`Error fetching field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Create a new field
 * @param {Object} data - Field data
 * @returns {Promise<Object>} Created field
 */
const create = async (data) => {
  try {
    logger.info(`[CI_TYPE_FIELDS] Creating field: ${data.field_name} for type ${data.ci_type_uuid}`);
    
    // Convert options array to JSON string if present
    const fieldData = {
      ...data,
      options_source: data.options ? JSON.stringify(data.options) : data.options_source
    };
    delete fieldData.options;
    
    const field = await prisma.ci_type_fields.create({
      data: fieldData
    });
    
    return {
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    };
  } catch (error) {
    logger.error('[CI_TYPE_FIELDS] Error creating field:', error);
    throw error;
  }
};

/**
 * Update a field
 * @param {string} uuid - Field UUID
 * @param {Object} data - Field data
 * @returns {Promise<Object>} Updated field
 */
const update = async (uuid, data) => {
  try {
    logger.info(`[CI_TYPE_FIELDS] Updating field: ${uuid}`);
    
    // Convert options array to JSON string if present
    const fieldData = { ...data };
    if (data.options !== undefined) {
      fieldData.options_source = data.options ? JSON.stringify(data.options) : null;
      delete fieldData.options;
    }
    
    const field = await prisma.ci_type_fields.update({
      where: { uuid },
      data: fieldData
    });
    
    return {
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    };
  } catch (error) {
    logger.error(`[CI_TYPE_FIELDS] Error updating field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete a field
 * @param {string} uuid - Field UUID
 * @returns {Promise<void>}
 */
const remove = async (uuid) => {
  try {
    logger.info(`[CI_TYPE_FIELDS] Deleting field: ${uuid}`);
    
    await prisma.ci_type_fields.delete({
      where: { uuid }
    });
  } catch (error) {
    logger.error(`[CI_TYPE_FIELDS] Error deleting field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete multiple fields
 * @param {string[]} uuids - Array of UUIDs
 * @returns {Promise<number>} Number of deleted items
 */
const removeMany = async (uuids) => {
  try {
    logger.info(`[CI_TYPE_FIELDS] Deleting ${uuids.length} fields`);
    
    const result = await prisma.ci_type_fields.deleteMany({
      where: { uuid: { in: uuids } }
    });
    
    return result.count;
  } catch (error) {
    logger.error('[CI_TYPE_FIELDS] Error deleting many fields:', error);
    throw error;
  }
};

/**
 * Reorder fields
 * @param {string} ciTypeUuid - CI type UUID
 * @param {Array} orderedUuids - Array of field UUIDs in new order
 * @returns {Promise<void>}
 */
const reorder = async (ciTypeUuid, orderedUuids) => {
  try {
    logger.info(`[CI_TYPE_FIELDS] Reordering ${orderedUuids.length} fields for type ${ciTypeUuid}`);
    
    // Update display_order for each field
    const updates = orderedUuids.map((uuid, index) => 
      prisma.ci_type_fields.update({
        where: { uuid },
        data: { display_order: index }
      })
    );
    
    await prisma.$transaction(updates);
  } catch (error) {
    logger.error('[CI_TYPE_FIELDS] Error reordering fields:', error);
    throw error;
  }
};

/**
 * Toggle field visibility (show_in_form / show_in_table)
 * @param {string} uuid - Field UUID
 * @param {string} property - Property to toggle (show_in_form or show_in_table)
 * @returns {Promise<Object>} Updated field
 */
const toggleVisibility = async (uuid, property) => {
  try {
    const field = await prisma.ci_type_fields.findUnique({ where: { uuid } });
    if (!field) throw new Error('Field not found');
    
    const newValue = !field[property];
    logger.info(`[CI_TYPE_FIELDS] Toggling ${property} to ${newValue} for field ${uuid}`);
    
    const updated = await prisma.ci_type_fields.update({
      where: { uuid },
      data: { [property]: newValue }
    });
    
    return {
      ...updated,
      options: updated.options_source ? JSON.parse(updated.options_source) : null
    };
  } catch (error) {
    logger.error(`[CI_TYPE_FIELDS] Error toggling visibility for field ${uuid}:`, error);
    throw error;
  }
};

module.exports = {
  getByTypeUuid,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  reorder,
  toggleVisibility
};
