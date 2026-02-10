const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search SLAs with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['name', 'description', 'metric_type', 'priority_code'],
    uuidColumns: ['rel_calendar_uuid'],
  });

  const [data, total] = await Promise.all([
    prisma.slas.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        calendar: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.slas.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all SLAs
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.slas.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        calendar: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.slas.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get SLA by UUID
 */
const getByUuid = async (uuid) => {
  return prisma.slas.findUnique({
    where: { uuid },
    include: {
      calendar: {
        select: { uuid: true, name: true },
      },
      commitments: {
        include: {
          service_offering: {
            select: { uuid: true, name: true },
          },
        },
      },
    },
  });
};

/**
 * Create new SLA
 */
const ALLOWED_FIELDS = ['name', 'description', 'metric_type', 'priority_code', 'target_value', 'target_unit', 'is_active'];

const pickAllowedFields = (data) => {
  const picked = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) {
      picked[key] = data[key];
    }
  }
  return picked;
};

const create = async (data) => {
  const { rel_calendar_uuid } = data;
  const filtered = pickAllowedFields(data);

  const createData = {
    ...filtered,
    calendar: { connect: { uuid: rel_calendar_uuid } },
  };

  return prisma.slas.create({
    data: createData,
    include: {
      calendar: {
        select: { uuid: true, name: true },
      },
    },
  });
};

/**
 * Update SLA
 */
const update = async (uuid, data) => {
  const { rel_calendar_uuid } = data;
  const updateData = pickAllowedFields(data);

  if (rel_calendar_uuid !== undefined) {
    updateData.calendar = rel_calendar_uuid
      ? { connect: { uuid: rel_calendar_uuid } }
      : { disconnect: true };
  }

  try {
    return await prisma.slas.update({
      where: { uuid },
      data: updateData,
      include: {
        calendar: {
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
 * Delete SLA
 */
const remove = async (uuid) => {
  try {
    await prisma.slas.delete({
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
 * Delete multiple SLAs
 */
const removeMany = async (uuids) => {
  const result = await prisma.slas.deleteMany({
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
