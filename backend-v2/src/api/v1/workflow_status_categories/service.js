/**
 * Workflow Status Categories Service
 * Business logic for workflow status categories (Backlog, In Progress, On Hold, Done)
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

const ENTITY_TYPE = 'workflow_status_categories';

/**
 * Get all workflow status categories with translations
 */
const getAll = async ({ activeOnly = true, locale = 'en' } = {}) => {
  const where = activeOnly ? { is_active: true } : {};
  
  const categories = await prisma.workflow_status_categories.findMany({
    where,
    orderBy: { display_order: 'asc' }
  });
  
  // Get ALL translations for all categories
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
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
  
  return categories.map(cat => ({
    ...cat,
    label: translationMap[cat.uuid]?.label || cat.code,
    _translations: allTranslationsMap[cat.uuid] || {}
  }));
};

/**
 * Get workflow status categories as select options
 */
const getAsOptions = async (locale = 'en') => {
  const categories = await getAll({ activeOnly: true, locale });
  
  return categories.map(cat => ({
    label: cat.label,
    value: cat.uuid,
    code: cat.code,
    color: cat.color
  }));
};

/**
 * Get workflow status category by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const category = await prisma.workflow_status_categories.findUnique({
    where: { uuid }
  });
  
  if (!category) return null;
  
  // Get ALL translations
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: uuid
    }
  });
  
  // Map translations for current locale display
  const translationMap = {};
  // Map all translations for _translations
  const allTranslationsMap = {};
  
  for (const t of translations) {
    if (t.locale === locale) {
      translationMap[t.field_name] = t.value;
    }
    
    if (!allTranslationsMap[t.field_name]) {
      allTranslationsMap[t.field_name] = {};
    }
    allTranslationsMap[t.field_name][t.locale] = t.value;
  }
  
  return {
    ...category,
    label: translationMap.label || category.code,
    _translations: allTranslationsMap
  };
};

/**
 * Get workflow status category by code
 */
const getByCode = async (code, locale = 'en') => {
  const category = await prisma.workflow_status_categories.findUnique({
    where: { code }
  });
  
  if (!category) return null;
  
  return getByUuid(category.uuid, locale);
};

/**
 * Create a new workflow status category
 */
const create = async (data) => {
  const { _translations, ...categoryData } = data;
  
  const category = await prisma.workflow_status_categories.create({
    data: categoryData
  });
  
  // Create translations if provided
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'label') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: ENTITY_TYPE,
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
  
  logger.info(`[WORKFLOW STATUS CATEGORIES] Created: ${category.code}`);
  return category;
};

/**
 * Update a workflow status category
 */
const update = async (uuid, data) => {
  const { _translations, ...categoryData } = data;
  
  const category = await prisma.workflow_status_categories.update({
    where: { uuid },
    data: categoryData
  });
  
  // Update translations if provided
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'label') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
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
        }
      }
    }
  }
  
  logger.info(`[WORKFLOW STATUS CATEGORIES] Updated: ${category.code}`);
  return category;
};

/**
 * Delete a workflow status category
 */
const remove = async (uuid) => {
  // Check if category is used by any workflow status
  const usedCount = await prisma.workflow_statuses.count({
    where: { rel_category_uuid: uuid }
  });
  
  if (usedCount > 0) {
    const error = new Error(`Cannot delete category: it is used by ${usedCount} workflow status(es)`);
    error.code = 'CATEGORY_IN_USE';
    error.usedCount = usedCount;
    throw error;
  }
  
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: uuid
    }
  });
  
  const category = await prisma.workflow_status_categories.delete({
    where: { uuid }
  });
  
  logger.info(`[WORKFLOW STATUS CATEGORIES] Deleted: ${category.code}`);
  return category;
};

/**
 * Search workflow status categories with PrimeVue filters
 */
const search = async (filters, locale = 'en') => {
  const { first = 0, rows = 10, sortField = 'display_order', sortOrder = 1, globalFilter } = filters;
  
  let where = {};
  
  // Global filter
  if (globalFilter) {
    where.OR = [
      { code: { contains: globalFilter, mode: 'insensitive' } }
    ];
  }
  
  const [categories, total] = await Promise.all([
    prisma.workflow_status_categories.findMany({
      where,
      skip: first,
      take: rows,
      orderBy: { [sortField]: sortOrder === 1 ? 'asc' : 'desc' }
    }),
    prisma.workflow_status_categories.count({ where })
  ]);
  
  // Get ALL translations
  const categoryUuids = categories.map(c => c.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: categoryUuids }
    }
  });
  
  // Map translations
  const translationMap = {};
  const allTranslationsMap = {};
  
  for (const t of translations) {
    if (t.locale === locale) {
      if (!translationMap[t.entity_uuid]) {
        translationMap[t.entity_uuid] = {};
      }
      translationMap[t.entity_uuid][t.field_name] = t.value;
    }
    
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
    label: translationMap[cat.uuid]?.label || cat.code,
    _translations: allTranslationsMap[cat.uuid] || {}
  }));
  
  return { data, total };
};

module.exports = {
  getAll,
  getAsOptions,
  getByUuid,
  getByCode,
  create,
  update,
  remove,
  search
};
