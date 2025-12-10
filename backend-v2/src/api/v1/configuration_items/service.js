const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

/**
 * Search configuration items with PrimeVue filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} - Search results
 */
const search = async (searchParams = {}) => {
  try {
    const { filters = {}, sortField = 'name', sortOrder = 1, page = 1, limit = 50, ciTypeUuid = null } = searchParams;

    logger.info('[CONFIGURATION_ITEMS] ========== SEARCH START ==========' );
    logger.info(`[CONFIGURATION_ITEMS] Raw searchParams: ${JSON.stringify(searchParams)}`);
    logger.info(`[CONFIGURATION_ITEMS] ciTypeUuid value: ${ciTypeUuid}`);
    logger.info(`[CONFIGURATION_ITEMS] ciTypeUuid type: ${typeof ciTypeUuid}`);

    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where = buildPrismaWhereFromFilters(filters, {
      globalSearchFields: ['name', 'description', 'ci_type'],
      dateColumns: ['created_at', 'updated_at'],
    });

    logger.info(`[CONFIGURATION_ITEMS] Initial where clause: ${JSON.stringify(where)}`);

    // If ciTypeUuid is provided, filter by CI type code
    if (ciTypeUuid) {
      logger.info('[CONFIGURATION_ITEMS] ciTypeUuid is truthy, looking up ci_type...');
      const ciType = await prisma.ci_types.findUnique({
        where: { uuid: ciTypeUuid },
        select: { code: true },
      });
      logger.info(`[CONFIGURATION_ITEMS] Found ciType: ${JSON.stringify(ciType)}`);
      
      if (ciType) {
        // Add ci_type filter to where clause
        if (where.AND) {
          where.AND.push({ ci_type: ciType.code });
        } else {
          where.AND = [{ ci_type: ciType.code }];
        }
        logger.info(`[CONFIGURATION_ITEMS] Added filter for ci_type: ${ciType.code}`);
      } else {
        logger.warn(`[CONFIGURATION_ITEMS] ciType not found for UUID: ${ciTypeUuid}`);
      }
    } else {
      logger.info('[CONFIGURATION_ITEMS] No ciTypeUuid provided, no type filter applied');
    }

    logger.info(`[CONFIGURATION_ITEMS] Final where clause: ${JSON.stringify(where)}`);

    // Count total
    const total = await prisma.configuration_items.count({ where });
    logger.info(`[CONFIGURATION_ITEMS] Total count: ${total}`);

    // Fetch data
    const items = await prisma.configuration_items.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
    });

    logger.info(`[CONFIGURATION_ITEMS] Found ${items.length} items (total: ${total})`);

    return {
      data: items,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error searching:', error);
    throw error;
  }
};

/**
 * Get all configuration items (simple list)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated results
 */
const getAll = async (options = {}) => {
  try {
    const { page = 1, limit = 50, sortField = 'name', sortOrder = 1 } = options;

    logger.info('[CONFIGURATION_ITEMS] Getting all items', { page, limit });

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.configuration_items.findMany({
        orderBy: buildPrismaOrderBy(sortField, sortOrder),
        skip,
        take: limit,
      }),
      prisma.configuration_items.count(),
    ]);

    return {
      data: items,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting all:', error);
    throw error;
  }
};

/**
 * Get configuration item by UUID
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<Object|null>} - Configuration item or null
 */
const getById = async (uuid) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Getting item: ${uuid}`);

    const item = await prisma.configuration_items.findUnique({
      where: { uuid },
    });

    if (!item) {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return null;
    }

    return item;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting by ID:', error);
    throw error;
  }
};

/**
 * Create new configuration item
 * @param {Object} data - Configuration item data
 * @returns {Promise<Object>} - Created item
 */
const create = async (data) => {
  try {
    logger.info('[CONFIGURATION_ITEMS] Creating item:', data.name);

    const item = await prisma.configuration_items.create({
      data: {
        name: data.name,
        description: data.description || null,
        ci_type: data.ci_type || 'GENERIC',
        extended_core_fields: data.extended_core_fields || {},
      },
    });

    logger.info(`[CONFIGURATION_ITEMS] Created item: ${item.uuid}`);
    return item;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error creating:', error);
    throw error;
  }
};

/**
 * Update configuration item
 * @param {string} uuid - Configuration item UUID
 * @param {Object} data - Update data
 * @returns {Promise<Object|null>} - Updated item or null
 */
const update = async (uuid, data) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Updating item: ${uuid}`);

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ci_type !== undefined) updateData.ci_type = data.ci_type;
    if (data.extended_core_fields !== undefined)
      updateData.extended_core_fields = data.extended_core_fields;

    const item = await prisma.configuration_items.update({
      where: { uuid },
      data: updateData,
    });

    logger.info(`[CONFIGURATION_ITEMS] Updated item: ${uuid}`);
    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return null;
    }
    logger.error('[CONFIGURATION_ITEMS] Error updating:', error);
    throw error;
  }
};

/**
 * Delete configuration item
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<boolean>} - Success status
 */
const remove = async (uuid) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Deleting item: ${uuid}`);

    await prisma.configuration_items.delete({
      where: { uuid },
    });

    logger.info(`[CONFIGURATION_ITEMS] Deleted item: ${uuid}`);
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return false;
    }
    logger.error('[CONFIGURATION_ITEMS] Error deleting:', error);
    throw error;
  }
};

/**
 * Delete multiple configuration items
 * @param {string[]} uuids - Array of UUIDs to delete
 * @returns {Promise<number>} - Number of deleted items
 */
const removeMany = async (uuids) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Deleting ${uuids.length} items`);

    const result = await prisma.configuration_items.deleteMany({
      where: { uuid: { in: uuids } },
    });

    logger.info(`[CONFIGURATION_ITEMS] Deleted ${result.count} items`);
    return result.count;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error deleting many:', error);
    throw error;
  }
};

module.exports = {
  search,
  getAll,
  getById,
  create,
  update,
  remove,
  removeMany,
};
