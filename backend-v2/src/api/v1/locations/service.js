const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search locations with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { globalSearchFields: ['name', 'city', 'country'] });
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.locations.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.locations.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all locations with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.locations.findMany({
      skip,
      take: limit,
      orderBy,
    }),
    prisma.locations.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get location by UUID
 */
const getById = async (uuid) => {
  return prisma.locations.findUnique({
    where: { uuid },
    include: {
      parent: true,
      primary_entity: true,
      field_service_group: true,
    },
  });
};

/**
 * Create new location
 */
const create = async (data) => {
  return prisma.locations.create({
    data,
  });
};

/**
 * Update location
 */
const update = async (uuid, data) => {
  try {
    return await prisma.locations.update({
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
 * Delete location
 */
const remove = async (uuid) => {
  try {
    await prisma.locations.delete({
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
 * Delete multiple locations
 */
const removeMany = async (uuids) => {
  const result = await prisma.locations.deleteMany({
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
