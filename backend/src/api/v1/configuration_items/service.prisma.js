const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const { validateExtendedFields } = require('./schemas');

/**
 * Get all configuration items with pagination and search
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated results
 */
const getConfigurationItems = async (options = {}) => {
  try {
    const {
      search = '',
      ci_type = null,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortDirection = 'asc'
    } = options;
    
    logger.info('[CMDB SERVICE PRISMA] Getting configuration items', { search, ci_type, page, limit });
    
    const skip = (page - 1) * limit;
    
    // Build search conditions
    const where = {};
    
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (ci_type) {
      where.ci_type = ci_type;
    }
    
    // Count total
    const total = await prisma.configuration_items.count({ where });
    
    // Fetch data
    const items = await prisma.configuration_items.findMany({
      where,
      orderBy: { [sortBy]: sortDirection },
      skip,
      take: limit
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Found ${items.length} configuration items`);
    
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error getting configuration items:', error);
    throw error;
  }
};

/**
 * Get configuration item by UUID
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<Object>} - Configuration item details
 */
const getConfigurationItemById = async (uuid) => {
  try {
    logger.info(`[CMDB SERVICE PRISMA] Getting configuration item: ${uuid}`);
    
    const item = await prisma.configuration_items.findUnique({
      where: { uuid }
    });
    
    if (!item) {
      logger.warn(`[CMDB SERVICE PRISMA] Configuration item not found: ${uuid}`);
      return null;
    }
    
    logger.info(`[CMDB SERVICE PRISMA] Found configuration item: ${item.name}`);
    return item;
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error getting configuration item:', error);
    throw error;
  }
};

/**
 * Create new configuration item
 * @param {Object} data - Configuration item data
 * @returns {Promise<Object>} - Created configuration item
 */
const createConfigurationItem = async (data) => {
  try {
    logger.info('[CMDB SERVICE PRISMA] Creating configuration item:', data.name);
    
    // Validate extended fields if provided
    if (data.extended_core_fields && Object.keys(data.extended_core_fields).length > 0) {
      const validation = validateExtendedFields(data.ci_type || 'GENERIC', data.extended_core_fields);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const item = await prisma.configuration_items.create({
      data: {
        name: data.name,
        description: data.description || null,
        ci_type: data.ci_type || 'GENERIC',
        extended_core_fields: data.extended_core_fields || {}
      }
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Created configuration item: ${item.uuid}`);
    return item;
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error creating configuration item:', error);
    throw error;
  }
};

/**
 * Update configuration item
 * @param {string} uuid - Configuration item UUID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated configuration item
 */
const updateConfigurationItem = async (uuid, data) => {
  try {
    logger.info(`[CMDB SERVICE PRISMA] Updating configuration item: ${uuid}`);
    
    // Validate extended fields if provided
    if (data.extended_core_fields && Object.keys(data.extended_core_fields).length > 0) {
      const ciType = data.ci_type || (await getConfigurationItemById(uuid))?.ci_type || 'GENERIC';
      const validation = validateExtendedFields(ciType, data.extended_core_fields);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ci_type !== undefined) updateData.ci_type = data.ci_type;
    if (data.extended_core_fields !== undefined) updateData.extended_core_fields = data.extended_core_fields;
    
    const item = await prisma.configuration_items.update({
      where: { uuid },
      data: updateData
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Updated configuration item: ${uuid}`);
    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CMDB SERVICE PRISMA] Configuration item not found: ${uuid}`);
      return null;
    }
    logger.error('[CMDB SERVICE PRISMA] Error updating configuration item:', error);
    throw error;
  }
};

/**
 * Delete configuration item
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<boolean>} - Success status
 */
const deleteConfigurationItem = async (uuid) => {
  try {
    logger.info(`[CMDB SERVICE PRISMA] Deleting configuration item: ${uuid}`);
    
    await prisma.configuration_items.delete({
      where: { uuid }
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Deleted configuration item: ${uuid}`);
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CMDB SERVICE PRISMA] Configuration item not found: ${uuid}`);
      return false;
    }
    logger.error('[CMDB SERVICE PRISMA] Error deleting configuration item:', error);
    throw error;
  }
};

/**
 * Get available CI type schemas
 * @returns {Object} - CI type schemas
 */
const getCITypeSchemas = () => {
  const { CI_TYPE_SCHEMAS } = require('./schemas');
  return CI_TYPE_SCHEMAS;
};

module.exports = {
  getConfigurationItems,
  getConfigurationItemById,
  createConfigurationItem,
  updateConfigurationItem,
  deleteConfigurationItem,
  getCITypeSchemas
};
