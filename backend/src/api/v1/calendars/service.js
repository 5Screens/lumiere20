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
    globalSearchFields: ['name', 'description'],
    uuidColumns: ['rel_timezone_uuid'],
  });

  const [data, total] = await Promise.all([
    prisma.calendars.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        timezone: {
          select: { uuid: true, code: true, label: true, utc_offset: true },
        },
        holidays_calendars: {
          include: {
            holiday: {
              select: { uuid: true, name: true, date: true, country_code: true, is_recurring: true },
            },
          },
        },
      },
    }),
    prisma.calendars.count({ where }),
  ]);

  const enriched = data.map((c) => ({
    ...c,
    holidays: c.holidays_calendars.map((hc) => hc.holiday),
  }));

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
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
        timezone: {
          select: { uuid: true, code: true, label: true, utc_offset: true },
        },
        holidays_calendars: {
          include: {
            holiday: {
              select: { uuid: true, name: true, date: true, country_code: true, is_recurring: true },
            },
          },
        },
      },
    }),
    prisma.calendars.count({ where }),
  ]);

  const enriched = data.map((c) => ({
    ...c,
    holidays: c.holidays_calendars.map((hc) => hc.holiday),
  }));

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get calendar by UUID
 */
const getByUuid = async (uuid) => {
  const calendar = await prisma.calendars.findUnique({
    where: { uuid },
    include: {
      timezone: {
        select: { uuid: true, code: true, label: true, utc_offset: true },
      },
      slas: {
        select: { uuid: true, name: true, metric_type: true },
      },
      holidays_calendars: {
        include: {
          holiday: {
            select: { uuid: true, name: true, date: true, country_code: true, is_recurring: true },
          },
        },
      },
    },
  });

  if (!calendar) return null;

  return {
    ...calendar,
    holidays: calendar.holidays_calendars.map((hc) => hc.holiday),
  };
};

/**
 * Create new calendar
 */
const create = async (data) => {
  const { rel_timezone_uuid, holiday_uuids, holidays, holidays_calendars, _translations, parent_uuid, slas, uuid, created_at, updated_at, timezone, ...rest } = data;

  const createData = { ...rest };

  if (rel_timezone_uuid) {
    createData.timezone = { connect: { uuid: rel_timezone_uuid } };
  }

  if (holiday_uuids && holiday_uuids.length > 0) {
    createData.holidays_calendars = {
      create: holiday_uuids.map((hUuid) => ({
        rel_holiday_uuid: hUuid,
      })),
    };
  }

  const calendar = await prisma.calendars.create({
    data: createData,
    include: {
      timezone: {
        select: { uuid: true, code: true, label: true, utc_offset: true },
      },
      holidays_calendars: {
        include: {
          holiday: {
            select: { uuid: true, name: true, date: true, country_code: true, is_recurring: true },
          },
        },
      },
    },
  });

  return {
    ...calendar,
    holidays: calendar.holidays_calendars.map((hc) => hc.holiday),
  };
};

/**
 * Update calendar
 */
const update = async (uuid, data) => {
  const { rel_timezone_uuid, holiday_uuids, holidays, holidays_calendars, _translations, parent_uuid, slas, uuid: _uuid, created_at, updated_at, timezone, ...rest } = data;
  const updateData = { ...rest };

  if (rel_timezone_uuid !== undefined) {
    updateData.timezone = rel_timezone_uuid
      ? { connect: { uuid: rel_timezone_uuid } }
      : { disconnect: true };
  }

  try {
    // Update holidays many-to-many if provided
    if (holiday_uuids !== undefined) {
      await prisma.holidays_calendars.deleteMany({
        where: { rel_calendar_uuid: uuid },
      });

      if (holiday_uuids.length > 0) {
        await prisma.holidays_calendars.createMany({
          data: holiday_uuids.map((hUuid) => ({
            rel_holiday_uuid: hUuid,
            rel_calendar_uuid: uuid,
          })),
        });
      }
    }

    const calendar = await prisma.calendars.update({
      where: { uuid },
      data: updateData,
      include: {
        timezone: {
          select: { uuid: true, code: true, label: true, utc_offset: true },
        },
        holidays_calendars: {
          include: {
            holiday: {
              select: { uuid: true, name: true, date: true, country_code: true, is_recurring: true },
            },
          },
        },
      },
    });

    return {
      ...calendar,
      holidays: calendar.holidays_calendars.map((hc) => hc.holiday),
    };
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
