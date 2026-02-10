const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Parse utc_offset string (e.g. "+05:30", "-03:00") to numeric minutes
 */
const parseOffsetToMinutes = (offset) => {
  if (!offset) return 0;
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
};

/**
 * Search timezones with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const isSortByOffset = sortField === 'utc_offset';
  const orderBy = isSortByOffset ? { code: 'asc' } : buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['code', 'label', 'utc_offset'],
  });

  if (isSortByOffset) {
    // Fetch all matching rows, sort in-memory by numeric offset, then paginate
    const [allData, total] = await Promise.all([
      prisma.timezones.findMany({ where, orderBy }),
      prisma.timezones.count({ where }),
    ]);

    const direction = (sortOrder === 1 || sortOrder === 'asc') ? 1 : -1;
    allData.sort((a, b) => direction * (parseOffsetToMinutes(a.utc_offset) - parseOffsetToMinutes(b.utc_offset)));

    const skip = (page - 1) * limit;
    const data = allData.slice(skip, skip + limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  const skip = (page - 1) * limit;
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
  const isSortByOffset = sortField === 'utc_offset';
  const orderBy = isSortByOffset ? { code: 'asc' } : { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  if (isSortByOffset) {
    const [allData, total] = await Promise.all([
      prisma.timezones.findMany({ where, orderBy }),
      prisma.timezones.count({ where }),
    ]);

    const direction = sortOrder === 1 ? 1 : -1;
    allData.sort((a, b) => direction * (parseOffsetToMinutes(a.utc_offset) - parseOffsetToMinutes(b.utc_offset)));

    const skip = (page - 1) * limit;
    const data = allData.slice(skip, skip + limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  const skip = (page - 1) * limit;
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
