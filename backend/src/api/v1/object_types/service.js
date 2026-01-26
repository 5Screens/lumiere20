const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

/**
 * Get object type by code
 * @param {string} code - Object type code (e.g., 'symptoms', 'tickets', 'configuration_items')
 * @returns {Promise<Object|null>} Object type metadata or null if not found
 */
const getByCode = async (code) => {
  try {
    const objectType = await prisma.object_types.findUnique({
      where: { code }
    });
    
    return objectType;
  } catch (error) {
    logger.error(`[ObjectTypesService] Error getting object type by code ${code}:`, error);
    throw error;
  }
};

/**
 * Get all object types
 * @returns {Promise<Array>} Array of object types
 */
const getAll = async () => {
  try {
    const objectTypes = await prisma.object_types.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' }
    });
    
    return objectTypes;
  } catch (error) {
    logger.error('[ObjectTypesService] Error getting all object types:', error);
    throw error;
  }
};

module.exports = {
  getByCode,
  getAll
};
