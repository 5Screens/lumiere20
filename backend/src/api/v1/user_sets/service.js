const prisma = require('../../../config/prisma');
const { buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search user sets with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = {};

  if (filters?.global?.value) {
    const searchTerm = filters.global.value.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }

  const [data, total] = await Promise.all([
    prisma.user_sets.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user_sets.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all user sets
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.user_sets.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.user_sets.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get user set by UUID
 */
const getByUuid = async (uuid) => {
  return prisma.user_sets.findUnique({
    where: { uuid },
  });
};

/**
 * Create new user set
 */
const create = async (data) => {
  return prisma.user_sets.create({ data });
};

/**
 * Update user set
 */
const update = async (uuid, data) => {
  try {
    return await prisma.user_sets.update({
      where: { uuid },
      data,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete user set
 */
const remove = async (uuid) => {
  try {
    await prisma.user_sets.delete({
      where: { uuid },
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

/**
 * Delete multiple user sets
 */
const removeMany = async (uuids) => {
  const result = await prisma.user_sets.deleteMany({
    where: { uuid: { in: uuids } },
  });
  return result.count;
};

module.exports = {
  search,
  getAll,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
};
