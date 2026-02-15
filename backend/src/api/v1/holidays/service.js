const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

const ENTITY_TYPE = 'holidays';

/**
 * Build translations map from translations array
 */
const buildTranslationsMap = (translations) => {
  const map = {};
  for (const t of translations) {
    if (!map[t.entity_uuid]) {
      map[t.entity_uuid] = {};
    }
    if (!map[t.entity_uuid][t.field_name]) {
      map[t.entity_uuid][t.field_name] = {};
    }
    map[t.entity_uuid][t.field_name][t.locale] = t.value;
  }
  return map;
};

/**
 * Transform holiday with translations
 */
const transformWithTranslations = (holiday, translationsMap, locale = 'en') => {
  const entityTranslations = translationsMap[holiday.uuid] || {};

  return {
    ...holiday,
    name: entityTranslations.name?.[locale] || holiday.name,
    _translations: entityTranslations
  };
};

/**
 * Search holidays with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25, locale = 'en' } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  // Extract global filter
  const globalFilter = filters?.global?.value;

  // Build base where clause from filters (excluding global)
  let where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: ['name'],
  });

  // If there's a global search, also search in translations
  if (globalFilter && globalFilter.trim()) {
    const searchTerm = globalFilter.trim().toLowerCase();

    const matchingTranslations = await prisma.translated_fields.findMany({
      where: {
        entity_type: ENTITY_TYPE,
        field_name: 'name',
        value: { contains: searchTerm, mode: 'insensitive' }
      },
      select: { entity_uuid: true }
    });
    const translatedUuids = [...new Set(matchingTranslations.map(t => t.entity_uuid))];

    where = {
      ...where,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { country_codes: { has: searchTerm.toUpperCase() } },
        ...(translatedUuids.length > 0 ? [{ uuid: { in: translatedUuids } }] : [])
      ]
    };
  }

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

  // Get translations for these holidays
  const uuids = data.map(h => h.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });
  const translationsMap = buildTranslationsMap(translations);

  // Flatten calendars + apply translations
  const enriched = data.map((h) => {
    const transformed = transformWithTranslations(h, translationsMap, locale);
    return {
      ...transformed,
      calendars: h.holidays_calendars.map((hc) => hc.calendar),
    };
  });

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all holidays
 */
const getAll = async ({ page = 1, limit = 200, sortField = 'date', sortOrder = 1, is_active, locale = 'en' } = {}) => {
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

  // Get translations
  const uuids = data.map(h => h.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });
  const translationsMap = buildTranslationsMap(translations);

  const enriched = data.map((h) => {
    const transformed = transformWithTranslations(h, translationsMap, locale);
    return {
      ...transformed,
      calendars: h.holidays_calendars.map((hc) => hc.calendar),
    };
  });

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get holiday by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
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

  // Get ALL translations for this holiday
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: uuid
    }
  });

  // Build _translations object: { fieldName: { locale: value } }
  const allTranslationsMap = {};
  for (const t of translations) {
    if (!allTranslationsMap[t.field_name]) {
      allTranslationsMap[t.field_name] = {};
    }
    allTranslationsMap[t.field_name][t.locale] = t.value;
  }

  return {
    ...holiday,
    name: allTranslationsMap.name?.[locale] || holiday.name,
    calendars: holiday.holidays_calendars.map((hc) => hc.calendar),
    _translations: allTranslationsMap
  };
};

/**
 * Create new holiday
 */
const create = async (data) => {
  const { calendar_uuids, _translations, ...rest } = data;

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

  // Save translations if provided
  if (_translations) {
    const translationRecords = [];
    for (const [fieldName, locales] of Object.entries(_translations)) {
      for (const [locale, value] of Object.entries(locales)) {
        if (value) {
          translationRecords.push({
            entity_type: ENTITY_TYPE,
            entity_uuid: holiday.uuid,
            field_name: fieldName,
            locale,
            value
          });
        }
      }
    }
    if (translationRecords.length > 0) {
      await prisma.translated_fields.createMany({ data: translationRecords });
    }
  }

  return {
    ...holiday,
    calendars: holiday.holidays_calendars.map((hc) => hc.calendar),
  };
};

/**
 * Update holiday
 */
const update = async (uuid, data) => {
  const { calendar_uuids, _translations, holidays_calendars, calendars, uuid: _uuid, created_at, updated_at, ...rest } = data;

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

    // Update translations if provided
    if (_translations) {
      for (const [fieldName, locales] of Object.entries(_translations)) {
        for (const [locale, value] of Object.entries(locales)) {
          if (value) {
            await prisma.translated_fields.upsert({
              where: {
                entity_type_entity_uuid_field_name_locale: {
                  entity_type: ENTITY_TYPE,
                  entity_uuid: uuid,
                  field_name: fieldName,
                  locale
                }
              },
              update: { value },
              create: {
                entity_type: ENTITY_TYPE,
                entity_uuid: uuid,
                field_name: fieldName,
                locale,
                value
              }
            });
          } else {
            // Delete translation if value is empty
            await prisma.translated_fields.deleteMany({
              where: {
                entity_type: ENTITY_TYPE,
                entity_uuid: uuid,
                field_name: fieldName,
                locale
              }
            });
          }
        }
      }
    }

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
    // Delete translations first
    await prisma.translated_fields.deleteMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: uuid
      }
    });

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
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });

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
