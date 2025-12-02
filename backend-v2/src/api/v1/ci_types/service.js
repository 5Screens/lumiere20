/**
 * CI Types Service
 * Handles business logic for Configuration Item types
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get all CI types
 * @param {boolean} activeOnly - If true, only return active types
 * @returns {Promise<Array>} List of CI types
 */
const getAll = async (activeOnly = true) => {
  try {
    const where = activeOnly ? { is_active: true } : {};
    
    const ciTypes = await prisma.ci_types.findMany({
      where,
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    return ciTypes;
  } catch (error) {
    logger.error('Error fetching CI types:', error);
    throw error;
  }
};

/**
 * Get CI type by code
 * @param {string} code - CI type code
 * @returns {Promise<Object|null>} CI type or null
 */
const getByCode = async (code) => {
  try {
    const ciType = await prisma.ci_types.findUnique({
      where: { code }
    });
    
    return ciType;
  } catch (error) {
    logger.error(`Error fetching CI type ${code}:`, error);
    throw error;
  }
};

/**
 * Get CI types formatted as select options
 * @returns {Promise<Array>} List of options { label, value }
 */
const getAsOptions = async () => {
  try {
    const ciTypes = await prisma.ci_types.findMany({
      where: { is_active: true },
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ],
      select: {
        code: true,
        label: true
      }
    });
    
    return ciTypes.map(ct => ({
      label: ct.label,
      value: ct.code
    }));
  } catch (error) {
    logger.error('Error fetching CI types as options:', error);
    throw error;
  }
};

/**
 * Create a new CI type
 * @param {Object} data - CI type data
 * @returns {Promise<Object>} Created CI type
 */
const create = async (data) => {
  try {
    const ciType = await prisma.ci_types.create({
      data: {
        code: data.code,
        label: data.label,
        description: data.description,
        icon: data.icon,
        color: data.color,
        is_active: data.is_active ?? true,
        display_order: data.display_order ?? 0
      }
    });
    
    logger.info(`CI type created: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error('Error creating CI type:', error);
    throw error;
  }
};

/**
 * Update a CI type
 * @param {string} uuid - CI type UUID
 * @param {Object} data - CI type data
 * @returns {Promise<Object>} Updated CI type
 */
const update = async (uuid, data) => {
  try {
    const ciType = await prisma.ci_types.update({
      where: { uuid },
      data: {
        code: data.code,
        label: data.label,
        description: data.description,
        icon: data.icon,
        color: data.color,
        is_active: data.is_active,
        display_order: data.display_order
      }
    });
    
    logger.info(`CI type updated: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error(`Error updating CI type ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete a CI type
 * @param {string} uuid - CI type UUID
 * @returns {Promise<Object>} Deleted CI type
 */
const remove = async (uuid) => {
  try {
    const ciType = await prisma.ci_types.delete({
      where: { uuid }
    });
    
    logger.info(`CI type deleted: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error(`Error deleting CI type ${uuid}:`, error);
    throw error;
  }
};

module.exports = {
  getAll,
  getByCode,
  getAsOptions,
  create,
  update,
  remove
};
