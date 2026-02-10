const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search timezones with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['code', 'label', 'utc_offset'],
  });

  const [data, total] = await Promise.all([
    prisma.timezones.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.timezones.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all timezones
 */
const getAll = async ({ page = 1, limit = 200, sortField = 'utc_offset', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.timezones.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.timezones.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get timezone by UUID
 */
const getByUuid = async (uuid) => {
  return prisma.timezones.findUnique({
    where: { uuid },
    include: {
      calendars: {
        select: { uuid: true, name: true },
      },
    },
  });
};

/**
 * Create new timezone
 */
const create = async (data) => {
  return prisma.timezones.create({
    data,
  });
};

/**
 * Update timezone
 */
const update = async (uuid, data) => {
  try {
    return await prisma.timezones.update({
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
 * Delete timezone
 */
const remove = async (uuid) => {
  try {
    await prisma.timezones.delete({
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
 * Delete multiple timezones
 */
const removeMany = async (uuids) => {
  const result = await prisma.timezones.deleteMany({
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
