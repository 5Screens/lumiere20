const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

const ENTITY_TYPE = 'symptoms';

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
 * Transform symptom with translations
 */
const transformWithTranslations = (symptom, translationsMap, locale = 'en') => {
  const entityTranslations = translationsMap[symptom.uuid] || {};
  
  return {
    ...symptom,
    label: entityTranslations.label?.[locale] || symptom.label,
    _translations: entityTranslations
  };
};

/**
 * Search symptoms with PrimeVue filters
 * Searches in both base fields and translated fields
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25, locale = 'en' } = params;
  
  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  
  // Extract global filter
  const globalFilter = filters?.global?.value;
  
  // Build base where clause (excluding global search on translated fields)
  let where = {};
  
  // Handle is_active filter
  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }
  
  // If there's a global search, we need to search in translations too
  if (globalFilter && globalFilter.trim()) {
    const searchTerm = globalFilter.trim().toLowerCase();
    
    // First, find UUIDs of symptoms that match in translated_fields
    const matchingTranslations = await prisma.translated_fields.findMany({
      where: {
        entity_type: ENTITY_TYPE,
        field_name: 'label',
        value: { contains: searchTerm, mode: 'insensitive' }
      },
      select: { entity_uuid: true }
    });
    const translatedUuids = [...new Set(matchingTranslations.map(t => t.entity_uuid))];
    
    // Search in code, label (base), OR in translated UUIDs
    where = {
      ...where,
      OR: [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { label: { contains: searchTerm, mode: 'insensitive' } },
        ...(translatedUuids.length > 0 ? [{ uuid: { in: translatedUuids } }] : [])
      ]
    };
  }

  const [data, total] = await Promise.all([
    prisma.symptoms.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.symptoms.count({ where }),
  ]);

  // Get all translations for these symptoms
  const uuids = data.map(s => s.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });

  const translationsMap = buildTranslationsMap(translations);
  const transformedData = data.map(s => transformWithTranslations(s, translationsMap, locale));

  return { data: transformedData, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all symptoms
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'code', sortOrder = 1, locale = 'en', is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };
  
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.symptoms.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.symptoms.count({ where }),
  ]);

  // Get all translations
  const uuids = data.map(s => s.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });

  const translationsMap = buildTranslationsMap(translations);
  const transformedData = data.map(s => transformWithTranslations(s, translationsMap, locale));

  return { data: transformedData, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get symptom by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const symptom = await prisma.symptoms.findUnique({
    where: { uuid },
  });

  if (!symptom) return null;

  // Get ALL translations for this symptom
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
    ...symptom,
    label: allTranslationsMap.label?.[locale] || symptom.label,
    _translations: allTranslationsMap
  };
};

/**
 * Create new symptom
 */
const create = async (data) => {
  const { _translations, ...symptomData } = data;
  
  const symptom = await prisma.symptoms.create({
    data: symptomData,
  });

  // Save translations if provided
  if (_translations) {
    const translationRecords = [];
    for (const [fieldName, locales] of Object.entries(_translations)) {
      for (const [locale, value] of Object.entries(locales)) {
        if (value) {
          translationRecords.push({
            entity_type: ENTITY_TYPE,
            entity_uuid: symptom.uuid,
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

  return symptom;
};

/**
 * Update symptom
 */
const update = async (uuid, data) => {
  const { _translations, ...symptomData } = data;
  
  try {
    const symptom = await prisma.symptoms.update({
      where: { uuid },
      data: symptomData,
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

    return symptom;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete symptom
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
    
    await prisma.symptoms.delete({
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
 * Delete multiple symptoms
 */
const removeMany = async (uuids) => {
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
    }
  });
  
  const result = await prisma.symptoms.deleteMany({
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
