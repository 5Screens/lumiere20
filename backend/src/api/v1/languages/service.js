/**
 * Languages Service
 * Handles business logic for language management
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search languages with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  
  // Extract global filter
  const globalFilter = filters?.global?.value;
  
  // Build base where clause
  let where = {};
  
  // Handle is_active filter
  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }

  // Handle uuid in/notIn filter
  if (filters?.uuid?.value && Array.isArray(filters.uuid.value)) {
    if (filters.uuid.matchMode === 'in') {
      where.uuid = { in: filters.uuid.value };
    } else if (filters.uuid.matchMode === 'notIn') {
      where.uuid = { notIn: filters.uuid.value };
    }
  }
  
  // Global search
  if (globalFilter && globalFilter.trim()) {
    const searchTerm = globalFilter.trim().toLowerCase();
    
    where = {
      ...where,
      OR: [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { name_en: { contains: searchTerm, mode: 'insensitive' } },
      ]
    };
  }

  const [data, total] = await Promise.all([
    prisma.languages.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.languages.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all languages
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - If true, only return active languages
 * @returns {Promise<Array>} List of languages
 */
const getAll = async ({ activeOnly = false } = {}) => {
  try {
    const where = activeOnly ? { is_active: true } : {};
    
    const languages = await prisma.languages.findMany({
      where,
      orderBy: [
        { is_active: 'desc' },
        { name_en: 'asc' }
      ]
    });
    
    return languages;
  } catch (error) {
    logger.error('Error fetching languages:', error);
    throw error;
  }
};

/**
 * Get active languages only (for frontend language selector)
 * @returns {Promise<Array>} List of active languages
 */
const getActive = async () => {
  try {
    const languages = await prisma.languages.findMany({
      where: { is_active: true },
      orderBy: { name_en: 'asc' }
    });
    
    return languages;
  } catch (error) {
    logger.error('Error fetching active languages:', error);
    throw error;
  }
};

/**
 * Get language by code
 * @param {string} code - Language code (e.g., 'fr', 'en')
 * @returns {Promise<Object|null>} Language or null
 */
const getByCode = async (code) => {
  try {
    const language = await prisma.languages.findUnique({
      where: { code }
    });
    
    return language;
  } catch (error) {
    logger.error(`Error fetching language ${code}:`, error);
    throw error;
  }
};

/**
 * Get language by UUID
 * @param {string} uuid - Language UUID
 * @returns {Promise<Object|null>} Language or null
 */
const getByUuid = async (uuid) => {
  try {
    const language = await prisma.languages.findUnique({
      where: { uuid }
    });
    
    return language;
  } catch (error) {
    logger.error(`Error fetching language by UUID ${uuid}:`, error);
    throw error;
  }
};

/**
 * Create a new language
 * @param {Object} data - Language data
 * @returns {Promise<Object>} Created language
 */
const create = async (data) => {
  try {
    const language = await prisma.languages.create({
      data: {
        code: data.code,
        name: data.name,
        name_en: data.name_en,
        flag_code: data.flag_code,
        is_active: data.is_active ?? false
      }
    });
    
    logger.info(`Language created: ${language.code}`);
    return language;
  } catch (error) {
    logger.error('Error creating language:', error);
    throw error;
  }
};

/**
 * Update a language
 * @param {string} uuid - Language UUID
 * @param {Object} data - Language data
 * @returns {Promise<Object>} Updated language
 */
const update = async (uuid, data) => {
  try {
    const language = await prisma.languages.update({
      where: { uuid },
      data: {
        code: data.code,
        name: data.name,
        name_en: data.name_en,
        flag_code: data.flag_code,
        is_active: data.is_active
      }
    });
    
    logger.info(`Language updated: ${language.code}`);
    return language;
  } catch (error) {
    logger.error(`Error updating language ${uuid}:`, error);
    throw error;
  }
};

/**
 * Toggle language active status
 * @param {string} uuid - Language UUID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Updated language
 */
const toggleActive = async (uuid, isActive) => {
  try {
    const language = await prisma.languages.update({
      where: { uuid },
      data: { is_active: isActive }
    });
    
    logger.info(`Language ${language.code} ${isActive ? 'activated' : 'deactivated'}`);
    return language;
  } catch (error) {
    logger.error(`Error toggling language ${uuid}:`, error);
    throw error;
  }
};

/**
 * Bulk update active status for multiple languages
 * @param {Object[]} updates - Array of { uuid, is_active }
 * @returns {Promise<number>} Number of updated languages
 */
const bulkToggleActive = async (updates) => {
  try {
    let count = 0;
    
    for (const { uuid, is_active } of updates) {
      await prisma.languages.update({
        where: { uuid },
        data: { is_active }
      });
      count++;
    }
    
    logger.info(`Bulk updated ${count} languages`);
    return count;
  } catch (error) {
    logger.error('Error bulk updating languages:', error);
    throw error;
  }
};

/**
 * Delete a language
 * @param {string} uuid - Language UUID
 * @returns {Promise<Object>} Deleted language
 */
const remove = async (uuid) => {
  try {
    const language = await prisma.languages.delete({
      where: { uuid }
    });
    
    logger.info(`Language deleted: ${language.code}`);
    return language;
  } catch (error) {
    logger.error(`Error deleting language ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete multiple languages
 */
const removeMany = async (uuids) => {
  const result = await prisma.languages.deleteMany({
    where: {
      uuid: { in: uuids },
    },
  });
  return result.count;
};

module.exports = {
  search,
  getAll,
  getActive,
  getByCode,
  getByUuid,
  create,
  update,
  toggleActive,
  bulkToggleActive,
  remove,
  removeMany
};
