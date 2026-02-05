const prisma = require('../../../config/prisma');

/**
 * Search service offerings with PrimeVue filters
 */
const search = async ({ filters, page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  // Build where clause from filters
  const where = {};
  if (filters) {
    if (filters.global?.value) {
      where.OR = [
        { name: { contains: filters.global.value, mode: 'insensitive' } },
        { description: { contains: filters.global.value, mode: 'insensitive' } },
        { environment: { contains: filters.global.value, mode: 'insensitive' } },
      ];
    }
    if (filters.service_uuid?.value) {
      where.service_uuid = filters.service_uuid.value;
    }
  }

  const [data, total] = await Promise.all([
    prisma.service_offerings.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        service: true,
        operator_entity: true,
        status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.service_offerings.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all service offerings
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1, serviceUuid = null }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };
  
  const where = serviceUuid ? { service_uuid: serviceUuid } : {};

  const [data, total] = await Promise.all([
    prisma.service_offerings.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        service: true,
        operator_entity: true,
        status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.service_offerings.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get service offerings by service UUID
 */
const getByServiceUuid = async (serviceUuid) => {
  return prisma.service_offerings.findMany({
    where: { service_uuid: serviceUuid },
    orderBy: { updated_at: 'desc' },
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
          workflow: true,
        },
      },
    },
  });
};

/**
 * Get service offering by UUID
 */
const getById = async (uuid) => {
  return prisma.service_offerings.findUnique({
    where: { uuid },
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
          workflow: true,
        },
      },
      subscriptions: {
        include: {
          subscriber_entity: true,
        },
      },
      sla_commitments: true,
      ci_scope: {
        include: {
          ci: true,
        },
      },
    },
  });
};

/**
 * Create new service offering
 */
const create = async (data) => {
  return prisma.service_offerings.create({
    data,
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
        },
      },
    },
  });
};

/**
 * Update service offering
 */
const update = async (uuid, data) => {
  try {
    return await prisma.service_offerings.update({
      where: { uuid },
      data,
      include: {
        service: true,
        operator_entity: true,
        status: {
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
 * Delete service offering
 */
const remove = async (uuid) => {
  try {
    await prisma.service_offerings.delete({
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
 * Delete multiple service offerings
 */
const removeMany = async (uuids) => {
  const result = await prisma.service_offerings.deleteMany({
    where: { uuid: { in: uuids } },
  });
  return result.count;
};

module.exports = {
  search,
  getAll,
  getByServiceUuid,
  getById,
  create,
  update,
  remove,
  removeMany,
};
