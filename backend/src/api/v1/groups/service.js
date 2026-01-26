const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search groups with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { globalSearchFields: ['group_name', 'description'] });
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.groups.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.groups.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all groups with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'group_name', sortOrder = 1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.groups.findMany({
      skip,
      take: limit,
      orderBy,
    }),
    prisma.groups.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get group by UUID
 */
const getById = async (uuid) => {
  return prisma.groups.findUnique({
    where: { uuid },
    include: {
      supervisor: true,
      manager: true,
    },
  });
};

/**
 * Create new group
 */
const create = async (data) => {
  return prisma.groups.create({
    data,
  });
};

/**
 * Update group
 */
const update = async (uuid, data) => {
  try {
    return await prisma.groups.update({
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
 * Delete group
 */
const remove = async (uuid) => {
  try {
    await prisma.groups.delete({
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
 * Delete multiple groups
 */
const removeMany = async (uuids) => {
  const result = await prisma.groups.deleteMany({
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
