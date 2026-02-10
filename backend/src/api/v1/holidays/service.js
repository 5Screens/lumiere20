const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search holidays with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['name', 'country_code'],
  });

  const [data, total] = await Promise.all([
    prisma.holidays.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        holidays_calendars: {
          include: {
            calendar: {
              select: { uuid: true, name: true },
            },
          },
        },
      },
    }),
    prisma.holidays.count({ where }),
  ]);

  // Flatten calendars for frontend display
  const enriched = data.map((h) => ({
    ...h,
    calendars: h.holidays_calendars.map((hc) => hc.calendar),
  }));

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all holidays
 */
const getAll = async ({ page = 1, limit = 200, sortField = 'date', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.holidays.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        holidays_calendars: {
          include: {
            calendar: {
              select: { uuid: true, name: true },
            },
          },
        },
      },
    }),
    prisma.holidays.count({ where }),
  ]);

  const enriched = data.map((h) => ({
    ...h,
    calendars: h.holidays_calendars.map((hc) => hc.calendar),
  }));

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get holiday by UUID
 */
const getByUuid = async (uuid) => {
  const holiday = await prisma.holidays.findUnique({
    where: { uuid },
    include: {
      holidays_calendars: {
        include: {
          calendar: {
            select: { uuid: true, name: true },
          },
        },
      },
    },
  });

  if (!holiday) return null;

  return {
    ...holiday,
    calendars: holiday.holidays_calendars.map((hc) => hc.calendar),
  };
};

/**
 * Create new holiday
 */
const create = async (data) => {
  const { calendar_uuids, ...rest } = data;

  const createData = {
    ...rest,
  };

  if (calendar_uuids && calendar_uuids.length > 0) {
    createData.holidays_calendars = {
      create: calendar_uuids.map((uuid) => ({
        rel_calendar_uuid: uuid,
      })),
    };
  }

  const holiday = await prisma.holidays.create({
    data: createData,
    include: {
      holidays_calendars: {
        include: {
          calendar: {
            select: { uuid: true, name: true },
          },
        },
      },
    },
  });

  return {
    ...holiday,
    calendars: holiday.holidays_calendars.map((hc) => hc.calendar),
  };
};

/**
 * Update holiday
 */
const update = async (uuid, data) => {
  const { calendar_uuids, ...rest } = data;

  try {
    // If calendar_uuids is provided, update the many-to-many relation
    if (calendar_uuids !== undefined) {
      // Delete existing links and recreate
      await prisma.holidays_calendars.deleteMany({
        where: { rel_holiday_uuid: uuid },
      });

      if (calendar_uuids.length > 0) {
        await prisma.holidays_calendars.createMany({
          data: calendar_uuids.map((calUuid) => ({
            rel_holiday_uuid: uuid,
            rel_calendar_uuid: calUuid,
          })),
        });
      }
    }

    const holiday = await prisma.holidays.update({
      where: { uuid },
      data: rest,
      include: {
        holidays_calendars: {
          include: {
            calendar: {
              select: { uuid: true, name: true },
            },
          },
        },
      },
    });

    return {
      ...holiday,
      calendars: holiday.holidays_calendars.map((hc) => hc.calendar),
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete holiday
 */
const remove = async (uuid) => {
  try {
    await prisma.holidays.delete({
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
 * Delete multiple holidays
 */
const removeMany = async (uuids) => {
  const result = await prisma.holidays.deleteMany({
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
