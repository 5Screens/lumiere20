/**
 * CI Categories Service
 * Business logic for Configuration Item categories
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

/**
 * Get all CI categories with translations
 */
const getAll = async ({ activeOnly = true, locale = 'en' } = {}) => {
  const where = activeOnly ? { is_active: true } : {};
  
  const categories = await prisma.ci_categories.findMany({
    where,
    orderBy: { display_order: 'asc' }
  });
  
  // Get ALL translations for all categories (not just current locale)
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: { in: categoryUuids }
    }
  });
  
  // Map translations to categories - grouped by uuid, then by field_name, then by locale
  const translationMap = {};
  const allTranslationsMap = {};
  
  for (const t of translations) {
    // For current locale display
    if (t.locale === locale) {
      if (!translationMap[t.entity_uuid]) {
        translationMap[t.entity_uuid] = {};
      }
      translationMap[t.entity_uuid][t.field_name] = t.value;
    }
    
    // For _translations (all locales)
    if (!allTranslationsMap[t.entity_uuid]) {
      allTranslationsMap[t.entity_uuid] = {};
    }
    if (!allTranslationsMap[t.entity_uuid][t.field_name]) {
      allTranslationsMap[t.entity_uuid][t.field_name] = {};
    }
    allTranslationsMap[t.entity_uuid][t.field_name][t.locale] = t.value;
  }
  
  return categories.map(cat => ({
    ...cat,
    label: translationMap[cat.uuid]?.label || cat.label,
    _translations: allTranslationsMap[cat.uuid] || {}
  }));
};

/**
 * Get all CI categories with their CI types (for menu building)
 */
const getAllWithCiTypes = async ({ activeOnly = true, locale = 'en' } = {}) => {
  const where = activeOnly ? { is_active: true } : {};
  
  const categories = await prisma.ci_categories.findMany({
    where,
    include: {
      ci_types: {
        where: activeOnly ? { is_active: true } : {},
        orderBy: { display_order: 'asc' }
      }
    },
    orderBy: { display_order: 'asc' }
  });
  
  // Get translations for categories and CI types
  const categoryUuids = categories.map(c => c.uuid);
  const ciTypeUuids = categories.flatMap(c => c.ci_types.map(t => t.uuid));
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      OR: [
        { entity_type: 'ci_categories', entity_uuid: { in: categoryUuids } },
        { entity_type: 'ci_types', entity_uuid: { in: ciTypeUuids } }
      ],
      locale
    }
  });
  
  // Map translations
  const translationMap = {};
  for (const t of translations) {
    const key = `${t.entity_type}:${t.entity_uuid}`;
    if (!translationMap[key]) {
      translationMap[key] = {};
    }
    translationMap[key][t.field_name] = t.value;
  }
  
  return categories.map(cat => ({
    ...cat,
    label: translationMap[`ci_categories:${cat.uuid}`]?.label || cat.label,
    ci_types: cat.ci_types.map(ciType => ({
      ...ciType,
      label: translationMap[`ci_types:${ciType.uuid}`]?.label || ciType.label,
      description: translationMap[`ci_types:${ciType.uuid}`]?.description || ciType.description
    }))
  }));
};

/**
 * Get CI types without category (for "Others" menu)
 */
const getUncategorizedCiTypes = async ({ activeOnly = true, locale = 'en' } = {}) => {
  const where = {
    rel_category_uuid: null,
    ...(activeOnly ? { is_active: true } : {})
  };
  
  const ciTypes = await prisma.ci_types.findMany({
    where,
    orderBy: { display_order: 'asc' }
  });
  
  // Get translations
  const ciTypeUuids = ciTypes.map(t => t.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_types',
      entity_uuid: { in: ciTypeUuids },
      locale
    }
  });
  
  const translationMap = {};
  for (const t of translations) {
    if (!translationMap[t.entity_uuid]) {
      translationMap[t.entity_uuid] = {};
    }
    translationMap[t.entity_uuid][t.field_name] = t.value;
  }
  
  return ciTypes.map(ciType => ({
    ...ciType,
    label: translationMap[ciType.uuid]?.label || ciType.label,
    description: translationMap[ciType.uuid]?.description || ciType.description
  }));
};

/**
 * Get CI categories as select options
 */
const getAsOptions = async (locale = 'en') => {
  const categories = await getAll({ activeOnly: true, locale });
  
  return categories.map(cat => ({
    label: cat.label,
    value: cat.uuid
  }));
};

/**
 * Get CI category by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const category = await prisma.ci_categories.findUnique({
    where: { uuid }
  });
  
  if (!category) return null;
  
  // Get ALL translations (not just current locale)
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: uuid
    }
  });
  
  // Map translations for current locale display
  const translationMap = {};
  // Map all translations for _translations
  const allTranslationsMap = {};
  
  for (const t of translations) {
    // For current locale display
    if (t.locale === locale) {
      translationMap[t.field_name] = t.value;
    }
    
    // For _translations (all locales)
    if (!allTranslationsMap[t.field_name]) {
      allTranslationsMap[t.field_name] = {};
    }
    allTranslationsMap[t.field_name][t.locale] = t.value;
  }
  
  return {
    ...category,
    label: translationMap.label || category.label,
    _translations: allTranslationsMap
  };
};

/**
 * Create a new CI category
 */
const create = async (data) => {
  const { _translations, ...categoryData } = data;
  
  const category = await prisma.ci_categories.create({
    data: categoryData
  });
  
  // Create translations if provided (format: { fieldName: { locale: value } })
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'label') continue; // ci_categories only has label as translatable
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: 'ci_categories',
              entity_uuid: category.uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`CI category created: ${category.code}`);
  return category;
};

/**
 * Update a CI category
 */
const update = async (uuid, data) => {
  const { _translations, ...categoryData } = data;
  
  const category = await prisma.ci_categories.update({
    where: { uuid },
    data: categoryData
  });
  
  // Update translations if provided (format: { fieldName: { locale: value } })
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'label') continue; // ci_categories only has label as translatable
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.upsert({
            where: {
              entity_type_entity_uuid_field_name_locale: {
                entity_type: 'ci_categories',
                entity_uuid: uuid,
                field_name: fieldName,
                locale
              }
            },
            update: { value },
            create: {
              entity_type: 'ci_categories',
              entity_uuid: uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`CI category updated: ${category.code}`);
  return category;
};

/**
 * Delete a CI category
 */
const remove = async (uuid) => {
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: uuid
    }
  });
  
  const category = await prisma.ci_categories.delete({
    where: { uuid }
  });
  
  logger.info(`CI category deleted: ${category.code}`);
  return category;
};

/**
 * Search CI categories with PrimeVue filters
 */
const search = async (filters, locale = 'en') => {
  const { first = 0, rows = 10, sortField = 'display_order', sortOrder = 1, globalFilter } = filters;
  
  let where = {};
  
  // Global filter
  if (globalFilter) {
    where.OR = [
      { code: { contains: globalFilter, mode: 'insensitive' } },
      { label: { contains: globalFilter, mode: 'insensitive' } }
    ];
  }
  
  const [categories, total] = await Promise.all([
    prisma.ci_categories.findMany({
      where,
      skip: first,
      take: rows,
      orderBy: { [sortField]: sortOrder === 1 ? 'asc' : 'desc' }
    }),
    prisma.ci_categories.count({ where })
  ]);
  
  // Get ALL translations (not just current locale)
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: { in: categoryUuids }
    }
  });
  
  // Map translations - grouped by uuid, then by field_name, then by locale
  const translationMap = {};
  const allTranslationsMap = {};
  
  for (const t of translations) {
    // For current locale display
    if (t.locale === locale) {
      if (!translationMap[t.entity_uuid]) {
        translationMap[t.entity_uuid] = {};
      }
      translationMap[t.entity_uuid][t.field_name] = t.value;
    }
    
    // For _translations (all locales)
    if (!allTranslationsMap[t.entity_uuid]) {
      allTranslationsMap[t.entity_uuid] = {};
    }
    if (!allTranslationsMap[t.entity_uuid][t.field_name]) {
      allTranslationsMap[t.entity_uuid][t.field_name] = {};
    }
    allTranslationsMap[t.entity_uuid][t.field_name][t.locale] = t.value;
  }
  
  const data = categories.map(cat => ({
    ...cat,
    label: translationMap[cat.uuid]?.label || cat.label,
    _translations: allTranslationsMap[cat.uuid] || {}
  }));
  
  return { data, total };
};

module.exports = {
  getAll,
  getAllWithCiTypes,
  getUncategorizedCiTypes,
  getAsOptions,
  getByUuid,
  create,
  update,
  remove,
  search
};
