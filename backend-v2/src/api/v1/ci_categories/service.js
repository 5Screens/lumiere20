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
  
  // Get translations for all categories
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: { in: categoryUuids },
      locale
    }
  });
  
  // Map translations to categories
  const translationMap = {};
  for (const t of translations) {
    if (!translationMap[t.entity_uuid]) {
      translationMap[t.entity_uuid] = {};
    }
    translationMap[t.entity_uuid][t.field_name] = t.value;
  }
  
  return categories.map(cat => ({
    ...cat,
    label: translationMap[cat.uuid]?.label || cat.label
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
  
  // Get translations
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: uuid,
      locale
    }
  });
  
  const translationMap = {};
  for (const t of translations) {
    translationMap[t.field_name] = t.value;
  }
  
  return {
    ...category,
    label: translationMap.label || category.label
  };
};

/**
 * Get CI category by code
 */
const getByCode = async (code, locale = 'en') => {
  const category = await prisma.ci_categories.findUnique({
    where: { code }
  });
  
  if (!category) return null;
  
  // Get translations
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: category.uuid,
      locale
    }
  });
  
  const translationMap = {};
  for (const t of translations) {
    translationMap[t.field_name] = t.value;
  }
  
  return {
    ...category,
    label: translationMap.label || category.label
  };
};

/**
 * Create a new CI category
 */
const create = async (data) => {
  const { translations, ...categoryData } = data;
  
  const category = await prisma.ci_categories.create({
    data: categoryData
  });
  
  // Create translations if provided
  if (translations) {
    for (const [locale, trans] of Object.entries(translations)) {
      if (trans.label) {
        await prisma.translated_fields.create({
          data: {
            entity_type: 'ci_categories',
            entity_uuid: category.uuid,
            field_name: 'label',
            locale,
            value: trans.label
          }
        });
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
  const { translations, ...categoryData } = data;
  
  const category = await prisma.ci_categories.update({
    where: { uuid },
    data: categoryData
  });
  
  // Update translations if provided
  if (translations) {
    for (const [locale, trans] of Object.entries(translations)) {
      if (trans.label) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: 'ci_categories',
              entity_uuid: uuid,
              field_name: 'label',
              locale
            }
          },
          update: { value: trans.label },
          create: {
            entity_type: 'ci_categories',
            entity_uuid: uuid,
            field_name: 'label',
            locale,
            value: trans.label
          }
        });
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
  
  // Get translations
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'ci_categories',
      entity_uuid: { in: categoryUuids },
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
  
  const data = categories.map(cat => ({
    ...cat,
    label: translationMap[cat.uuid]?.label || cat.label
  }));
  
  return { data, total };
};

module.exports = {
  getAll,
  getAllWithCiTypes,
  getUncategorizedCiTypes,
  getAsOptions,
  getByUuid,
  getByCode,
  create,
  update,
  remove,
  search
};
