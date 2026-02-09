const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search calendars with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['name', 'description', 'timezone'],
    uuidColumns: ['parent_uuid'],
  });

  const [data, total] = await Promise.all([
    prisma.calendars.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        parent: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.calendars.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all calendars
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.calendars.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        parent: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.calendars.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get calendar by UUID
 */
const getByUuid = async (uuid) => {
  return prisma.calendars.findUnique({
    where: { uuid },
    include: {
      parent: {
        select: { uuid: true, name: true },
      },
      children: {
        select: { uuid: true, name: true },
      },
      slas: {
        select: { uuid: true, name: true, metric_type: true },
      },
    },
  });
};

/**
 * Create new calendar
 */
const create = async (data) => {
  const { parent_uuid, ...rest } = data;

  const createData = { ...rest };

  if (parent_uuid) {
    createData.parent = { connect: { uuid: parent_uuid } };
  }

  return prisma.calendars.create({
    data: createData,
    include: {
      parent: {
        select: { uuid: true, name: true },
      },
    },
  });
};

/**
 * Update calendar
 */
const update = async (uuid, data) => {
  const { parent_uuid, ...rest } = data;
  const updateData = { ...rest };

  if (parent_uuid !== undefined) {
    updateData.parent = parent_uuid
      ? { connect: { uuid: parent_uuid } }
      : { disconnect: true };
  }

  try {
    return await prisma.calendars.update({
      where: { uuid },
      data: updateData,
      include: {
        parent: {
          select: { uuid: true, name: true },
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
 * Delete calendar
 */
const remove = async (uuid) => {
  try {
    await prisma.calendars.delete({
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
 * Delete multiple calendars
 */
const removeMany = async (uuids) => {
  const result = await prisma.calendars.deleteMany({
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
