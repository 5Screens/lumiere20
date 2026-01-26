const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search entities with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { globalSearchFields: ['name', 'entity_id'] });
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.entities.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.entities.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all entities with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.entities.findMany({
      skip,
      take: limit,
      orderBy,
    }),
    prisma.entities.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get entity by UUID
 */
const getById = async (uuid) => {
  return prisma.entities.findUnique({
    where: { uuid },
    include: {
      parent: true,
      headquarters_location: true,
      budget_approver: true,
    },
  });
};

/**
 * Create new entity
 */
const create = async (data) => {
  return prisma.entities.create({
    data,
  });
};

/**
 * Update entity
 */
const update = async (uuid, data) => {
  try {
    return await prisma.entities.update({
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
 * Delete entity
 */
const remove = async (uuid) => {
  try {
    await prisma.entities.delete({
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
 * Delete multiple entities
 */
const removeMany = async (uuids) => {
  const result = await prisma.entities.deleteMany({
    where: {
      uuid: { in: uuids },
    },
  });
  return result.count;
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
