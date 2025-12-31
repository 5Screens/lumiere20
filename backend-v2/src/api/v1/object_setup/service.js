/**
 * Object Setup Service
 * Business logic for business objects metadata configuration
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');
const { buildPrismaWhereFromFilters } = require('../../../utils/primeVueFilters');

const ENTITY_TYPE = 'object_setup';

/**
 * Get all object setup records with translations
 */
const getAll = async ({ activeOnly = true, locale = 'en', objectType = null } = {}) => {
  const where = {
    ...(activeOnly ? { is_active: true } : {}),
    ...(objectType ? { object_type: objectType } : {})
  };
  
  const records = await prisma.object_setup.findMany({
    where,
    orderBy: [
      { object_type: 'asc' },
      { metadata: 'asc' },
      { display_order: 'asc' }
    ]
  });
  
  // Get ALL translations for all records
  const uuids = records.map(r => r.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
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
  
  return records.map(record => ({
    ...record,
    label: translationMap[record.uuid]?.label || record.code, // Fallback to code
    _translations: allTranslationsMap[record.uuid] || {}
  }));
};

/**
 * Get distinct object types from object_setup as select options
 * This returns the unique object_type values used in object_setup (entity, location, incident, etc.)
 */
const getObjectTypesAsOptions = async () => {
  const records = await prisma.object_setup.findMany({
    distinct: ['object_type'],
    select: { object_type: true },
    orderBy: { object_type: 'asc' }
  });
  
  return records.map(r => ({
    label: r.object_type.charAt(0).toUpperCase() + r.object_type.slice(1),
    value: r.object_type
  }));
};

/**
 * Get object setup records as select options (for dropdowns)
 */
const getAsOptions = async ({ locale = 'en', objectType, metadata } = {}) => {
  if (!objectType || !metadata) {
    return [];
  }
  
  const records = await prisma.object_setup.findMany({
    where: {
      object_type: objectType,
      metadata: metadata,
      is_active: true
    },
    orderBy: { display_order: 'asc' }
  });
  
  // Get translations
  const uuids = records.map(r => r.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids },
      field_name: 'label',
      locale
    }
  });
  
  const translationMap = {};
  for (const t of translations) {
    translationMap[t.entity_uuid] = t.value;
  }
  
  return records.map(record => ({
    label: translationMap[record.uuid] || record.code,
    value: record.code,
    icon: record.icon,
    color: record.color
  }));
};

/**
 * Get object setup by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const record = await prisma.object_setup.findUnique({
    where: { uuid }
  });
  
  if (!record) return null;
  
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
    ...record,
    label: translationMap.label || record.code,
    _translations: allTranslationsMap
  };
};

/**
 * Create a new object setup record
 */
const create = async (data) => {
  const { _translations, label, ...recordData } = data;
  
  const record = await prisma.object_setup.create({
    data: recordData
  });
  
  // Create translations if provided
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'label') continue; // Only label is translatable
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: ENTITY_TYPE,
              entity_uuid: record.uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`Object setup created: ${record.object_type}/${record.metadata}/${record.code}`);
  return record;
};

/**
 * Update an object setup record
 */
const update = async (uuid, data) => {
  const { _translations, label, ...recordData } = data;
  
  const record = await prisma.object_setup.update({
    where: { uuid },
    data: recordData
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
  
  logger.info(`Object setup updated: ${record.object_type}/${record.metadata}/${record.code}`);
  return record;
};

/**
 * Delete an object setup record
 */
const remove = async (uuid) => {
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: uuid
    }
  });
  
  const record = await prisma.object_setup.delete({
    where: { uuid }
  });
  
  logger.info(`Object setup deleted: ${record.object_type}/${record.metadata}/${record.code}`);
  return record;
};

/**
 * Search object setup records with PrimeVue filters
 */
const search = async (searchParams = {}, locale = 'en') => {
  const { 
    filters = {},
    page = 1, 
    limit = 50, 
    sortField = 'display_order', 
    sortOrder = 1,
    objectSetupType = null
  } = searchParams;
  
  logger.info(`[object_setup.search] searchParams: ${JSON.stringify(searchParams)}`);
  logger.info(`[object_setup.search] filters: ${JSON.stringify(filters)}`);
  
  const skip = (page - 1) * limit;
  const take = limit;
  
  // Helper to extract filter value and matchMode from PrimeVue format
  const getFilterInfo = (filter) => {
    if (!filter) return null;
    // Simple format
    if (filter.value !== undefined && filter.value !== null) {
      return { value: filter.value, matchMode: filter.matchMode || 'contains' };
    }
    // Constraints format - get first non-null constraint
    if (filter.constraints && Array.isArray(filter.constraints)) {
      for (const c of filter.constraints) {
        if (c.value !== undefined && c.value !== null && c.value !== '') {
          return { value: c.value, matchMode: c.matchMode || 'contains' };
        }
      }
    }
    return null;
  };
  
  // Build filters for non-translated fields (exclude label which is translated)
  const filtersForDb = { ...filters };
  delete filtersForDb.label; // label is a translated field, handled separately
  
  // Build where clause using the utility for standard fields
  let where = buildPrismaWhereFromFilters(filtersForDb, {
    globalSearchFields: ['code', 'metadata', 'object_type'],
    dateColumns: ['created_at', 'updated_at'],
    uuidColumns: ['uuid']
  });
  
  // Filter by objectSetupType if provided as top-level param (for filtered views like entity_setup)
  if (objectSetupType) {
    where = { ...where, object_type: objectSetupType };
  }
  
  // Filter by label (translated field) - search in translated_fields table
  const labelInfo = getFilterInfo(filters.label);
  if (labelInfo) {
    // Build the translation search condition based on matchMode
    let translationWhere = {
      entity_type: ENTITY_TYPE,
      field_name: 'label'
    };
    
    switch (labelInfo.matchMode) {
      case 'startsWith':
        translationWhere.value = { startsWith: labelInfo.value, mode: 'insensitive' };
        break;
      case 'endsWith':
        translationWhere.value = { endsWith: labelInfo.value, mode: 'insensitive' };
        break;
      case 'equals':
        translationWhere.value = labelInfo.value;
        break;
      case 'notEquals':
        translationWhere.value = { not: labelInfo.value };
        break;
      case 'notContains':
        translationWhere.value = { not: { contains: labelInfo.value, mode: 'insensitive' } };
        break;
      case 'contains':
      default:
        translationWhere.value = { contains: labelInfo.value, mode: 'insensitive' };
        break;
    }
    
    const matchingTranslations = await prisma.translated_fields.findMany({
      where: translationWhere,
      select: { entity_uuid: true },
      distinct: ['entity_uuid']
    });
    const matchingUuids = matchingTranslations.map(t => t.entity_uuid);
    logger.info(`[object_setup.search] label filter "${labelInfo.value}" (${labelInfo.matchMode}) matched ${matchingUuids.length} UUIDs`);
    
    if (matchingUuids.length > 0) {
      where = { ...where, uuid: { in: matchingUuids } };
    } else {
      // No matches found - return empty result
      where = { ...where, uuid: { in: [] } };
    }
  }
  
  logger.info(`[object_setup.search] where: ${JSON.stringify(where)}`);
  
  const [records, total] = await Promise.all([
    prisma.object_setup.findMany({
      where,
      skip,
      take,
      orderBy: { [sortField]: sortOrder === 1 ? 'asc' : 'desc' }
    }),
    prisma.object_setup.count({ where })
  ]);
  
  // Get ALL translations
  const uuids = records.map(r => r.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: uuids }
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
  
  const data = records.map(record => ({
    ...record,
    label: translationMap[record.uuid]?.label || record.code,
    _translations: allTranslationsMap[record.uuid] || {}
  }));
  
  return { data, total };
};

/**
 * Get distinct object types (for filter dropdown)
 */
const getObjectTypes = async () => {
  const result = await prisma.object_setup.findMany({
    distinct: ['object_type'],
    select: { object_type: true },
    orderBy: { object_type: 'asc' }
  });
  
  return result.map(r => ({
    label: r.object_type.charAt(0).toUpperCase() + r.object_type.slice(1),
    value: r.object_type
  }));
};

/**
 * Get distinct metadata types for a given object_type
 */
const getMetadataTypes = async (objectType) => {
  const result = await prisma.object_setup.findMany({
    where: { object_type: objectType },
    distinct: ['metadata'],
    select: { metadata: true },
    orderBy: { metadata: 'asc' }
  });
  
  return result.map(r => ({
    label: r.metadata,
    value: r.metadata
  }));
};

module.exports = {
  getAll,
  getAsOptions,
  getObjectTypesAsOptions,
  getByUuid,
  create,
  update,
  remove,
  search,
  getObjectTypes,
  getMetadataTypes
};
