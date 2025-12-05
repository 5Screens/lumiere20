/**
 * CI Types Service
 * Handles business logic for Configuration Item types
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

// Entity type for translations table
const ENTITY_TYPE = 'ci_types';
// Translatable fields for ci_types
const TRANSLATABLE_FIELDS = ['label', 'description'];

/**
 * Fetch translations for CI types from translated_fields table
 * @param {string[]} uuids - Array of CI type UUIDs
 * @param {string} locale - Locale filter (optional)
 * @returns {Promise<Object>} Translations grouped by entity_uuid
 */
const fetchTranslations = async (uuids, locale = null) => {
  const where = {
    entity_type: ENTITY_TYPE,
    entity_uuid: { in: uuids }
  };
  if (locale) {
    where.locale = locale;
  }
  
  const translations = await prisma.translated_fields.findMany({ where });
  
  // Group by entity_uuid
  const grouped = {};
  for (const t of translations) {
    if (!grouped[t.entity_uuid]) {
      grouped[t.entity_uuid] = [];
    }
    grouped[t.entity_uuid].push(t);
  }
  return grouped;
};

/**
 * Get all CI types with translations
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - If true, only return active types
 * @param {string} options.locale - Locale for translations (optional)
 * @returns {Promise<Array>} List of CI types with translations
 */
const getAll = async ({ activeOnly = true, locale = null } = {}) => {
  try {
    const where = activeOnly ? { is_active: true } : {};
    
    const ciTypes = await prisma.ci_types.findMany({
      where,
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    // Fetch ALL translations (not filtered by locale) so admin can see all languages
    const uuids = ciTypes.map(ct => ct.uuid);
    const translationsMap = await fetchTranslations(uuids, null);
    
    // Transform to include translated values (locale used only for main field value)
    return ciTypes.map(ct => transformWithTranslations(ct, translationsMap[ct.uuid] || [], locale));
  } catch (error) {
    logger.error('Error fetching CI types:', error);
    throw error;
  }
};

/**
 * Transform CI type with translations applied
 * @param {Object} ciType - CI type object
 * @param {Array} translations - Array of translation records
 * @param {string} locale - Target locale
 * @returns {Object} CI type with translated fields
 */
const transformWithTranslations = (ciType, translations = [], locale = null) => {
  const result = { ...ciType };
  
  if (translations.length > 0 && locale) {
    for (const t of translations) {
      if (t.locale === locale && TRANSLATABLE_FIELDS.includes(t.field_name)) {
        result[t.field_name] = t.value;
      }
    }
  }
  
  // Include all translations for editing purposes
  result._translations = {};
  for (const t of translations) {
    if (!result._translations[t.field_name]) {
      result._translations[t.field_name] = {};
    }
    result._translations[t.field_name][t.locale] = t.value;
  }
  
  return result;
};

/**
 * Get CI type by code with translations
 * @param {string} code - CI type code
 * @param {string} locale - Locale for translations (optional)
 * @returns {Promise<Object|null>} CI type or null
 */
const getByCode = async (code, locale = null) => {
  try {
    const ciType = await prisma.ci_types.findUnique({
      where: { code }
    });
    
    if (!ciType) return null;
    
    // Fetch ALL translations so admin can see all languages
    const translationsMap = await fetchTranslations([ciType.uuid], null);
    return transformWithTranslations(ciType, translationsMap[ciType.uuid] || [], locale);
  } catch (error) {
    logger.error(`Error fetching CI type ${code}:`, error);
    throw error;
  }
};

/**
 * Get CI type by UUID with translations
 * @param {string} uuid - CI type UUID
 * @param {string} locale - Locale for translations (optional)
 * @returns {Promise<Object|null>} CI type or null
 */
const getByUuid = async (uuid, locale = null) => {
  try {
    const ciType = await prisma.ci_types.findUnique({
      where: { uuid }
    });
    
    if (!ciType) return null;
    
    // Fetch ALL translations so admin can see all languages
    const translationsMap = await fetchTranslations([ciType.uuid], null);
    return transformWithTranslations(ciType, translationsMap[ciType.uuid] || [], locale);
  } catch (error) {
    logger.error(`Error fetching CI type by UUID ${uuid}:`, error);
    throw error;
  }
};

/**
 * Get CI types formatted as select options with translations
 * @param {string} locale - Locale for translations
 * @returns {Promise<Array>} List of options { label, value, icon, color }
 */
const getAsOptions = async (locale = 'en') => {
  try {
    const ciTypes = await prisma.ci_types.findMany({
      where: { is_active: true },
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    // Fetch translations for label field only
    const uuids = ciTypes.map(ct => ct.uuid);
    const translations = await prisma.translated_fields.findMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: { in: uuids },
        locale,
        field_name: 'label'
      }
    });
    
    // Map translations by uuid
    const translationsByUuid = {};
    for (const t of translations) {
      translationsByUuid[t.entity_uuid] = t.value;
    }
    
    return ciTypes.map(ct => ({
      label: translationsByUuid[ct.uuid] || ct.label,
      value: ct.code,
      icon: ct.icon,
      color: ct.color
    }));
  } catch (error) {
    logger.error('Error fetching CI types as options:', error);
    throw error;
  }
};

/**
 * Create a new CI type with translations
 * @param {Object} data - CI type data including _translations
 * @returns {Promise<Object>} Created CI type
 */
const create = async (data) => {
  try {
    const { _translations, ...ciTypeData } = data;
    
    const ciType = await prisma.ci_types.create({
      data: {
        code: ciTypeData.code,
        label: ciTypeData.label,
        description: ciTypeData.description,
        icon: ciTypeData.icon,
        color: ciTypeData.color,
        is_active: ciTypeData.is_active ?? true,
        display_order: ciTypeData.display_order ?? 0
      }
    });
    
    // Create translations if provided
    if (_translations) {
      await saveTranslations(ciType.uuid, _translations);
    }
    
    logger.info(`CI type created: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error('Error creating CI type:', error);
    throw error;
  }
};

/**
 * Update a CI type with translations
 * @param {string} uuid - CI type UUID
 * @param {Object} data - CI type data including _translations
 * @returns {Promise<Object>} Updated CI type
 */
const update = async (uuid, data) => {
  try {
    const { _translations, ...ciTypeData } = data;
    
    const ciType = await prisma.ci_types.update({
      where: { uuid },
      data: {
        code: ciTypeData.code,
        label: ciTypeData.label,
        description: ciTypeData.description,
        icon: ciTypeData.icon,
        color: ciTypeData.color,
        is_active: ciTypeData.is_active,
        display_order: ciTypeData.display_order
      }
    });
    
    // Update translations if provided
    if (_translations) {
      await saveTranslations(uuid, _translations);
    }
    
    logger.info(`CI type updated: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error(`Error updating CI type ${uuid}:`, error);
    throw error;
  }
};

/**
 * Save translations for a CI type using translated_fields table
 * @param {string} entityUuid - CI type UUID
 * @param {Object} translations - Object { fieldName: { locale: value } }
 */
const saveTranslations = async (entityUuid, translations) => {
  for (const [fieldName, locales] of Object.entries(translations)) {
    if (!TRANSLATABLE_FIELDS.includes(fieldName)) continue;
    
    for (const [locale, value] of Object.entries(locales)) {
      if (value !== null && value !== undefined && value !== '') {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: ENTITY_TYPE,
              entity_uuid: entityUuid,
              field_name: fieldName,
              locale
            }
          },
          update: { value },
          create: {
            entity_type: ENTITY_TYPE,
            entity_uuid: entityUuid,
            field_name: fieldName,
            locale,
            value
          }
        });
      }
    }
  }
};

/**
 * Delete a CI type and its translations
 * @param {string} uuid - CI type UUID
 * @returns {Promise<Object>} Deleted CI type
 */
const remove = async (uuid) => {
  try {
    // Delete translations first (no cascade since generic table)
    await prisma.translated_fields.deleteMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: uuid
      }
    });
    
    const ciType = await prisma.ci_types.delete({
      where: { uuid }
    });
    
    logger.info(`CI type deleted: ${ciType.code}`);
    return ciType;
  } catch (error) {
    logger.error(`Error deleting CI type ${uuid}:`, error);
    throw error;
  }
};

/**
 * Search for UUIDs matching a text query in translated_fields
 * @param {string} searchText - Text to search for
 * @param {string} locale - Locale to search in
 * @returns {Promise<string[]>} Array of matching entity UUIDs
 */
const searchInTranslations = async (searchText, locale) => {
  if (!searchText) return [];
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      locale,
      field_name: { in: TRANSLATABLE_FIELDS },
      value: { contains: searchText, mode: 'insensitive' }
    },
    select: { entity_uuid: true },
    distinct: ['entity_uuid']
  });
  
  return translations.map(t => t.entity_uuid);
};

/**
 * Search CI types with PrimeVue filters
 * @param {Object} searchParams - Search parameters
 * @param {string} locale - Locale for translations
 * @returns {Promise<Object>} - Search results with pagination
 */
const search = async (searchParams = {}, locale = 'en') => {
  try {
    const { filters = {}, sortField = 'display_order', sortOrder = 1, page = 1, limit = 50 } = searchParams;

    logger.info('[CI_TYPES] Searching with PrimeVue filters', {
      filters,
      sortField,
      sortOrder,
      page,
      limit,
      locale,
    });

    const skip = (page - 1) * limit;

    // Extract global search value if present
    const globalSearchValue = filters.global?.value || null;
    
    // Build base Prisma where clause (excludes translatable fields from global search)
    const baseWhere = buildPrismaWhereFromFilters(filters, {
      globalSearchFields: ['code'],  // Only non-translatable fields
      booleanColumns: ['is_active'],
    });

    let where = baseWhere;

    // If there's a global search, also search in translations
    if (globalSearchValue) {
      // Search in translated_fields for the current locale
      const translatedUuids = await searchInTranslations(globalSearchValue, locale);
      
      // Combine: match in ci_types OR match in translations
      if (translatedUuids.length > 0) {
        // If baseWhere has conditions, combine with OR for translations
        const baseConditions = baseWhere.OR || [baseWhere];
        where = {
          AND: [
            // Keep non-global filters (like is_active)
            ...(baseWhere.is_active !== undefined ? [{ is_active: baseWhere.is_active }] : []),
            {
              OR: [
                // Original search in code
                { code: { contains: globalSearchValue, mode: 'insensitive' } },
                // Search in default label/description (fallback)
                { label: { contains: globalSearchValue, mode: 'insensitive' } },
                { description: { contains: globalSearchValue, mode: 'insensitive' } },
                // Match UUIDs found in translations
                { uuid: { in: translatedUuids } }
              ]
            }
          ]
        };
      } else {
        // No translation matches, search in ci_types fields only
        where = buildPrismaWhereFromFilters(filters, {
          globalSearchFields: ['code', 'label', 'description'],
          booleanColumns: ['is_active'],
        });
      }
    }

    // Count total
    const total = await prisma.ci_types.count({ where });

    // Fetch data
    const items = await prisma.ci_types.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
    });

    // Fetch ALL translations (not filtered by locale) so admin can see all languages
    const uuids = items.map(ct => ct.uuid);
    const translationsMap = await fetchTranslations(uuids, null);

    // Transform with translations (locale used only for main field value, _translations contains all)
    const transformedItems = items.map(ct => transformWithTranslations(ct, translationsMap[ct.uuid] || [], locale));

    logger.info(`[CI_TYPES] Found ${items.length} items (total: ${total})`);

    return {
      data: transformedItems,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error('[CI_TYPES] Error searching:', error);
    throw error;
  }
};

/**
 * Get extended fields definition for a CI type by code
 * @param {string} code - CI type code
 * @returns {Promise<Array>} List of field definitions
 */
const getFieldsByCode = async (code) => {
  try {
    const ciType = await prisma.ci_types.findUnique({
      where: { code },
      include: {
        fields: {
          orderBy: { display_order: 'asc' }
        }
      }
    });
    
    if (!ciType) {
      return [];
    }
    
    return ciType.fields;
  } catch (error) {
    logger.error(`Error fetching fields for CI type ${code}:`, error);
    throw error;
  }
};

/**
 * Get extended fields definition for a CI type by UUID
 * @param {string} uuid - CI type UUID
 * @returns {Promise<Array>} List of field definitions
 */
const getFieldsByUuid = async (uuid) => {
  try {
    const fields = await prisma.ci_type_fields.findMany({
      where: { ci_type_uuid: uuid },
      orderBy: { display_order: 'asc' }
    });
    
    return fields;
  } catch (error) {
    logger.error(`Error fetching fields for CI type UUID ${uuid}:`, error);
    throw error;
  }
};

/**
 * Get CI type with its fields included
 * @param {string} code - CI type code
 * @param {string} locale - Locale for translations (optional)
 * @returns {Promise<Object|null>} CI type with fields or null
 */
const getByCodeWithFields = async (code, locale = null) => {
  try {
    const ciType = await prisma.ci_types.findUnique({
      where: { code },
      include: {
        fields: {
          orderBy: { display_order: 'asc' }
        }
      }
    });
    
    if (!ciType) return null;
    
    // Fetch ALL translations so admin can see all languages
    const translationsMap = await fetchTranslations([ciType.uuid], null);
    const result = transformWithTranslations(ciType, translationsMap[ciType.uuid] || [], locale);
    
    // Parse options_source JSON for select fields
    result.fields = ciType.fields.map(field => ({
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    }));
    
    return result;
  } catch (error) {
    logger.error(`Error fetching CI type with fields ${code}:`, error);
    throw error;
  }
};

/**
 * Delete multiple CI types
 * @param {string[]} uuids - Array of UUIDs to delete
 * @returns {Promise<number>} - Number of deleted items
 */
const removeMany = async (uuids) => {
  try {
    logger.info(`[CI_TYPES] Deleting ${uuids.length} items`);

    // First delete translations from generic table
    await prisma.translated_fields.deleteMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: { in: uuids }
      }
    });

    const result = await prisma.ci_types.deleteMany({
      where: { uuid: { in: uuids } },
    });

    logger.info(`[CI_TYPES] Deleted ${result.count} items`);
    return result.count;
  } catch (error) {
    logger.error('[CI_TYPES] Error deleting many:', error);
    throw error;
  }
};

module.exports = {
  getAll,
  getByCode,
  getByUuid,
  getByCodeWithFields,
  getFieldsByCode,
  getFieldsByUuid,
  getAsOptions,
  create,
  update,
  remove,
  search,
  removeMany
};
