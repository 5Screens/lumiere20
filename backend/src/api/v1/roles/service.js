const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

const ENTITY_TYPE = 'roles';

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
 * Transform role with translations
 */
const transformWithTranslations = (role, translationsMap, locale = 'en') => {
  const entityTranslations = translationsMap[role.uuid] || {};
  
  return {
    ...role,
    label: entityTranslations.label?.[locale] || role.label,
    description: entityTranslations.description?.[locale] || role.description,
    _translations: entityTranslations
  };
};

/**
 * Search roles with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25, locale = 'en' } = params;
  
  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  
  // Extract global filter
  const globalFilter = filters?.global?.value;
  
  // Build base where clause
  let where = {};
  
  // Handle is_active filter
  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }

  // Handle uuid in/notIn filter
  if (filters?.uuid?.value && Array.isArray(filters.uuid.value)) {
    if (filters.uuid.matchMode === 'in') {
      where.uuid = { in: filters.uuid.value };
    } else if (filters.uuid.matchMode === 'notIn') {
      where.uuid = { notIn: filters.uuid.value };
    }
  }
  
  // If there's a global search, search in translations too
  if (globalFilter && globalFilter.trim()) {
    const searchTerm = globalFilter.trim().toLowerCase();
    
    // Find UUIDs of roles that match in translated_fields
    const matchingTranslations = await prisma.translated_fields.findMany({
      where: {
        entity_type: ENTITY_TYPE,
        field_name: { in: ['label', 'description'] },
        value: { contains: searchTerm, mode: 'insensitive' }
      },
      select: { entity_uuid: true }
    });
    const translatedUuids = [...new Set(matchingTranslations.map(t => t.entity_uuid))];
    
    where = {
      ...where,
      OR: [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { label: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        ...(translatedUuids.length > 0 ? [{ uuid: { in: translatedUuids } }] : [])
      ]
    };
  }

  const [data, total] = await Promise.all([
    prisma.roles.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.roles.count({ where }),
  ]);

  // Get all translations for these roles
  const uuids = data.map(r => r.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });

  const translationsMap = buildTranslationsMap(translations);
  const transformedData = data.map(r => transformWithTranslations(r, translationsMap, locale));

  return { data: transformedData, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all roles
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'display_order', sortOrder = 1, locale = 'en', is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };
  
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.roles.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.roles.count({ where }),
  ]);

  // Get all translations
  const uuids = data.map(r => r.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });

  const translationsMap = buildTranslationsMap(translations);
  const transformedData = data.map(r => transformWithTranslations(r, translationsMap, locale));

  return { data: transformedData, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get role by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const role = await prisma.roles.findUnique({
    where: { uuid },
  });

  if (!role) return null;

  // Get ALL translations for this role
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
    ...role,
    label: allTranslationsMap.label?.[locale] || role.label,
    description: allTranslationsMap.description?.[locale] || role.description,
    _translations: allTranslationsMap
  };
};

/**
 * Create new role
 */
const create = async (data) => {
  const { _translations, ...roleData } = data;
  
  const role = await prisma.roles.create({
    data: roleData,
  });

  // Save translations if provided
  if (_translations) {
    const translationRecords = [];
    for (const [fieldName, locales] of Object.entries(_translations)) {
      for (const [locale, value] of Object.entries(locales)) {
        if (value) {
          translationRecords.push({
            entity_type: ENTITY_TYPE,
            entity_uuid: role.uuid,
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

  return role;
};

/**
 * Update role
 */
const update = async (uuid, data) => {
  const { _translations, ...roleData } = data;
  
  try {
    const role = await prisma.roles.update({
      where: { uuid },
      data: roleData,
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

    return role;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete role
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
    
    await prisma.roles.delete({
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
 * Delete multiple roles
 */
const removeMany = async (uuids) => {
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });
  
  const result = await prisma.roles.deleteMany({
    where: {
      uuid: { in: uuids },
    },
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
