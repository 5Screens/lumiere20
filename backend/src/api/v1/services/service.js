const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search services with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { globalSearchFields: ['name', 'description', 'version'] });
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.services.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        owning_entity: true,
        owned_by: true,
        managed_by: true,
        cab: true,
        parent: true,
        lifecycle_status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.services.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all services with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.services.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        owning_entity: true,
        owned_by: true,
        managed_by: true,
        lifecycle_status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.services.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get service by UUID
 */
const getById = async (uuid) => {
  return prisma.services.findUnique({
    where: { uuid },
    include: {
      owning_entity: true,
      owned_by: true,
      managed_by: true,
      cab: true,
      parent: true,
      children: true,
      lifecycle_status: {
        include: {
          category: true,
          workflow: true,
        },
      },
      service_offerings: {
        include: {
          operator_entity: true,
          lifecycle_status: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Create new service
 */
const create = async (data) => {
  return prisma.services.create({
    data,
    include: {
      owning_entity: true,
      owned_by: true,
      managed_by: true,
      lifecycle_status: {
        include: {
          category: true,
        },
      },
    },
  });
};

/**
 * Update service
 */
const update = async (uuid, data) => {
  try {
    return await prisma.services.update({
      where: { uuid },
      data,
      include: {
        owning_entity: true,
        owned_by: true,
        managed_by: true,
        cab: true,
        parent: true,
        lifecycle_status: {
          include: {
            category: true,
          },
        },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete service
 */
const remove = async (uuid) => {
  try {
    await prisma.services.delete({
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
 * Delete multiple services
 */
const removeMany = async (uuids) => {
  const result = await prisma.services.deleteMany({
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
