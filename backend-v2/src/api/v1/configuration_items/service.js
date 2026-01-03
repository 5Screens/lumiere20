const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

// Entity type for translations table
const ENTITY_TYPE = 'configuration_items';
// Translatable fields for configuration_items
const TRANSLATABLE_FIELDS = ['name', 'description'];

/**
 * Fetch translations for configuration items from translated_fields table
 * @param {string[]} uuids - Array of item UUIDs
 * @param {string} locale - Locale filter (optional)
 * @returns {Promise<Object>} Translations grouped by entity_uuid
 */
const fetchTranslations = async (uuids, locale = null) => {
  if (!uuids || uuids.length === 0) return {};
  
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
 * Transform item with translations applied
 * @param {Object} item - Configuration item object
 * @param {Array} translations - Array of translation records
 * @param {string} locale - Target locale
 * @returns {Object} Item with translated fields
 */
const transformWithTranslations = (item, translations = [], locale = null) => {
  const result = { ...item };
  
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
 * Save translations for a configuration item using translated_fields table
 * @param {string} entityUuid - Item UUID
 * @param {Object} translations - Object { fieldName: { locale: value } }
 */
const saveTranslations = async (entityUuid, translations) => {
  logger.info(`[CONFIGURATION_ITEMS] saveTranslations called for ${entityUuid}`);
  logger.info(`[CONFIGURATION_ITEMS] translations received: ${JSON.stringify(translations)}`);
  
  for (const [fieldName, locales] of Object.entries(translations)) {
    if (!TRANSLATABLE_FIELDS.includes(fieldName)) {
      logger.info(`[CONFIGURATION_ITEMS] Skipping non-translatable field: ${fieldName}`);
      continue;
    }
    
    for (const [locale, value] of Object.entries(locales)) {
      logger.info(`[CONFIGURATION_ITEMS] Processing translation: field=${fieldName}, locale=${locale}, value=${value}`);
      
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
        logger.info(`[CONFIGURATION_ITEMS] Saved translation for ${fieldName}/${locale}`);
      } else {
        logger.info(`[CONFIGURATION_ITEMS] Skipping empty value for ${fieldName}/${locale}`);
      }
    }
  }
};

/**
 * Search configuration items with PrimeVue filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} - Search results
 */
const search = async (searchParams = {}) => {
  try {
    const { filters = {}, sortField = 'name', sortOrder = 1, page = 1, limit = 50, ciTypeUuid = null } = searchParams;

    logger.info('[CONFIGURATION_ITEMS] ========== SEARCH START ==========' );
    logger.info(`[CONFIGURATION_ITEMS] Raw searchParams: ${JSON.stringify(searchParams)}`);
    logger.info(`[CONFIGURATION_ITEMS] ciTypeUuid value: ${ciTypeUuid}`);
    logger.info(`[CONFIGURATION_ITEMS] ciTypeUuid type: ${typeof ciTypeUuid}`);

    const skip = (page - 1) * limit;

    // Extract special filters that are not direct columns of configuration_items
    const { is_model_for_ci_type_code: modelFilter, ...standardFilters } = filters;

    // Build Prisma where clause (excluding special filters)
    const where = buildPrismaWhereFromFilters(standardFilters, {
      globalSearchFields: ['name', 'description', 'ci_type'],
      dateColumns: ['created_at', 'updated_at'],
    });

    logger.info(`[CONFIGURATION_ITEMS] Initial where clause: ${JSON.stringify(where)}`);

    // Handle is_model_for_ci_type_code filter (dynamic filter for rel_model_uuid)
    // This finds CIs whose ci_type has is_model_for_ci_type_code matching the provided value
    if (modelFilter?.value) {
      const targetCiTypeCode = modelFilter.value;
      logger.info(`[CONFIGURATION_ITEMS] Filtering models for ci_type_code: ${targetCiTypeCode}`);
      
      // Find all CI types that are models for this target CI type
      const modelTypes = await prisma.ci_types.findMany({
        where: { is_model_for_ci_type_code: targetCiTypeCode },
        select: { code: true }
      });
      
      if (modelTypes.length > 0) {
        const modelTypeCodes = modelTypes.map(t => t.code);
        logger.info(`[CONFIGURATION_ITEMS] Found model types: ${modelTypeCodes.join(', ')}`);
        
        if (where.AND) {
          where.AND.push({ ci_type: { in: modelTypeCodes } });
        } else {
          where.AND = [{ ci_type: { in: modelTypeCodes } }];
        }
      } else {
        logger.info(`[CONFIGURATION_ITEMS] No model types found for ${targetCiTypeCode}, returning empty`);
        // No model types found, return empty result
        if (where.AND) {
          where.AND.push({ ci_type: '__NO_MATCH__' });
        } else {
          where.AND = [{ ci_type: '__NO_MATCH__' }];
        }
      }
    }

    // If ciTypeUuid is provided, filter by CI type code
    if (ciTypeUuid) {
      logger.info('[CONFIGURATION_ITEMS] ciTypeUuid is truthy, looking up ci_type...');
      const ciType = await prisma.ci_types.findUnique({
        where: { uuid: ciTypeUuid },
        select: { code: true },
      });
      logger.info(`[CONFIGURATION_ITEMS] Found ciType: ${JSON.stringify(ciType)}`);
      
      if (ciType) {
        // Add ci_type filter to where clause
        if (where.AND) {
          where.AND.push({ ci_type: ciType.code });
        } else {
          where.AND = [{ ci_type: ciType.code }];
        }
        logger.info(`[CONFIGURATION_ITEMS] Added filter for ci_type: ${ciType.code}`);
      } else {
        logger.warn(`[CONFIGURATION_ITEMS] ciType not found for UUID: ${ciTypeUuid}`);
      }
    } else {
      logger.info('[CONFIGURATION_ITEMS] No ciTypeUuid provided, no type filter applied');
    }

    logger.info(`[CONFIGURATION_ITEMS] Final where clause: ${JSON.stringify(where)}`);

    // Count total
    const total = await prisma.configuration_items.count({ where });
    logger.info(`[CONFIGURATION_ITEMS] Total count: ${total}`);

    // Fetch data with status included
    const items = await prisma.configuration_items.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
      include: {
        status: {
          include: {
            category: true
          }
        }
      }
    });

    // Fetch translations for all items
    const uuids = items.map(item => item.uuid);
    const translationsMap = await fetchTranslations(uuids, null);
    
    // Fetch status translations
    const statusUuids = items.filter(i => i.status).map(i => i.status.uuid);
    const statusTranslationsMap = {};
    if (statusUuids.length > 0) {
      const statusTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'workflow_statuses',
          entity_uuid: { in: statusUuids },
          field_name: 'name'
        }
      });
      for (const t of statusTranslations) {
        if (!statusTranslationsMap[t.entity_uuid]) {
          statusTranslationsMap[t.entity_uuid] = {};
        }
        statusTranslationsMap[t.entity_uuid][t.locale] = t.value;
      }
    }
    
    // Transform items with translations
    const transformedItems = items.map(item => {
      const transformed = transformWithTranslations(item, translationsMap[item.uuid] || [], null);
      // Add status translations
      if (transformed.status && statusTranslationsMap[transformed.status.uuid]) {
        transformed.status._translations = { name: statusTranslationsMap[transformed.status.uuid] };
      }
      return transformed;
    });

    logger.info(`[CONFIGURATION_ITEMS] Found ${items.length} items (total: ${total})`);

    return {
      data: transformedItems,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error searching:', error);
    throw error;
  }
};

/**
 * Get all configuration items (simple list)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated results
 */
const getAll = async (options = {}) => {
  try {
    const { page = 1, limit = 50, sortField = 'name', sortOrder = 1 } = options;

    logger.info('[CONFIGURATION_ITEMS] Getting all items', { page, limit });

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.configuration_items.findMany({
        orderBy: buildPrismaOrderBy(sortField, sortOrder),
        skip,
        take: limit,
      }),
      prisma.configuration_items.count(),
    ]);

    return {
      data: items,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting all:', error);
    throw error;
  }
};

/**
 * Get configuration item by UUID with translations
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<Object|null>} - Configuration item or null
 */
const getByUuid = async (uuid, locale = 'en') => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Getting item: ${uuid}`);

    const item = await prisma.configuration_items.findUnique({
      where: { uuid },
      include: {
        status: {
          include: {
            category: true
          }
        }
      }
    });

    if (!item) {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return null;
    }

    // Get ALL translations for this item
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

    // Get status name translation if status exists
    let statusWithTranslation = null;
    if (item.status) {
      const statusTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'workflow_statuses',
          entity_uuid: item.status.uuid,
          field_name: 'name',
          locale
        }
      });
      statusWithTranslation = {
        ...item.status,
        name: statusTranslations[0]?.value || item.status.name
      };
    }

    return {
      ...item,
      status: statusWithTranslation,
      _translations: allTranslationsMap
    };
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting by ID:', error);
    throw error;
  }
};

/**
 * Get initial status UUID for a CI type from workflow
 * @param {string} ciTypeCode - CI type code (e.g., 'SERVER')
 * @returns {Promise<string|null>} - Initial status UUID or null
 */
const getInitialStatusForCiType = async (ciTypeCode) => {
  try {
    // Get CI type UUID from code
    const ciType = await prisma.ci_types.findUnique({
      where: { code: ciTypeCode },
      select: { uuid: true }
    });
    
    if (!ciType) {
      logger.info(`[CONFIGURATION_ITEMS] No CI type found for code: ${ciTypeCode}`);
      return null;
    }
    
    // Try to find a specific workflow for this CI type
    let workflow = await prisma.workflows.findFirst({
      where: {
        entity_type: 'configuration_items',
        rel_entity_type_uuid: ciType.uuid,
        is_active: true
      },
      include: {
        statuses: {
          where: { is_initial: true },
          take: 1
        }
      }
    });
    
    // If no specific workflow, try generic workflow for configuration_items
    if (!workflow) {
      workflow = await prisma.workflows.findFirst({
        where: {
          entity_type: 'configuration_items',
          rel_entity_type_uuid: null,
          is_active: true
        },
        include: {
          statuses: {
            where: { is_initial: true },
            take: 1
          }
        }
      });
    }
    
    if (workflow && workflow.statuses.length > 0) {
      logger.info(`[CONFIGURATION_ITEMS] Found initial status: ${workflow.statuses[0].uuid} for CI type: ${ciTypeCode}`);
      return workflow.statuses[0].uuid;
    }
    
    logger.info(`[CONFIGURATION_ITEMS] No initial status found for CI type: ${ciTypeCode}`);
    return null;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting initial status:', error);
    return null;
  }
};

/**
 * Create new configuration item with translations
 * @param {Object} data - Configuration item data including _translations
 * @returns {Promise<Object>} - Created item
 */
const create = async (data) => {
  try {
    const { _translations, ...itemData } = data;
    
    logger.info('[CONFIGURATION_ITEMS] Creating item:', itemData.name);

    // Get initial status from workflow if not provided
    let statusUuid = itemData.rel_status_uuid || null;
    if (!statusUuid && itemData.ci_type) {
      statusUuid = await getInitialStatusForCiType(itemData.ci_type);
    }

    const item = await prisma.configuration_items.create({
      data: {
        name: itemData.name,
        description: itemData.description || null,
        ci_type: itemData.ci_type || 'GENERIC',
        rel_model_uuid: itemData.rel_model_uuid || null,
        rel_status_uuid: statusUuid,
        extended_core_fields: itemData.extended_core_fields || {},
      },
    });

    // Save translations if provided
    if (_translations) {
      await saveTranslations(item.uuid, _translations);
    }

    logger.info(`[CONFIGURATION_ITEMS] Created item: ${item.uuid} with status: ${statusUuid}`);
    return item;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error creating:', error);
    throw error;
  }
};

/**
 * Update configuration item with translations
 * @param {string} uuid - Configuration item UUID
 * @param {Object} data - Update data including _translations
 * @returns {Promise<Object|null>} - Updated item or null
 */
const update = async (uuid, data) => {
  try {
    const { _translations, ...itemData } = data;
    
    logger.info(`[CONFIGURATION_ITEMS] Updating item: ${uuid}`);

    const updateData = {};
    if (itemData.name !== undefined) updateData.name = itemData.name;
    if (itemData.description !== undefined) updateData.description = itemData.description;
    if (itemData.ci_type !== undefined) updateData.ci_type = itemData.ci_type;
    if (itemData.rel_model_uuid !== undefined) updateData.rel_model_uuid = itemData.rel_model_uuid;
    if (itemData.rel_status_uuid !== undefined) updateData.rel_status_uuid = itemData.rel_status_uuid;
    if (itemData.extended_core_fields !== undefined)
      updateData.extended_core_fields = itemData.extended_core_fields;

    const item = await prisma.configuration_items.update({
      where: { uuid },
      data: updateData,
    });

    // Save translations if provided
    if (_translations) {
      await saveTranslations(uuid, _translations);
    }

    logger.info(`[CONFIGURATION_ITEMS] Updated item: ${uuid}`);
    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return null;
    }
    logger.error('[CONFIGURATION_ITEMS] Error updating:', error);
    throw error;
  }
};

/**
 * Delete configuration item
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<boolean>} - Success status
 */
const remove = async (uuid) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Deleting item: ${uuid}`);

    await prisma.configuration_items.delete({
      where: { uuid },
    });

    logger.info(`[CONFIGURATION_ITEMS] Deleted item: ${uuid}`);
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`[CONFIGURATION_ITEMS] Item not found: ${uuid}`);
      return false;
    }
    logger.error('[CONFIGURATION_ITEMS] Error deleting:', error);
    throw error;
  }
};

/**
 * Delete multiple configuration items
 * @param {string[]} uuids - Array of UUIDs to delete
 * @returns {Promise<number>} - Number of deleted items
 */
const removeMany = async (uuids) => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Deleting ${uuids.length} items`);

    const result = await prisma.configuration_items.deleteMany({
      where: { uuid: { in: uuids } },
    });

    logger.info(`[CONFIGURATION_ITEMS] Deleted ${result.count} items`);
    return result.count;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error deleting many:', error);
    throw error;
  }
};

/**
 * Get models for a specific CI type
 * Finds CIs whose ci_type has is_model_for_ci_type_uuid pointing to the given CI type
 * @param {string} ciTypeCode - Physical CI type code (e.g., 'SERVER')
 * @param {string} locale - Locale for translations
 * @returns {Promise<Array>} - Array of model CIs
 */
const getModelsForType = async (ciTypeCode, locale = 'en') => {
  try {
    logger.info(`[CONFIGURATION_ITEMS] Getting models for CI type: ${ciTypeCode}`);

    // First, find the CI type UUID from the code
    const targetCiType = await prisma.ci_types.findUnique({
      where: { code: ciTypeCode },
    });

    if (!targetCiType) {
      logger.warn(`[CONFIGURATION_ITEMS] CI type not found: ${ciTypeCode}`);
      return [];
    }

    // Find all CI types that are models for this target CI type
    const modelTypes = await prisma.ci_types.findMany({
      where: { is_model_for_ci_type_uuid: targetCiType.uuid },
    });

    if (modelTypes.length === 0) {
      logger.info(`[CONFIGURATION_ITEMS] No model types found for CI type: ${ciTypeCode}`);
      return [];
    }

    // Get all model type codes
    const modelTypeCodes = modelTypes.map(mt => mt.code);

    // Find all CIs of these model types
    const items = await prisma.configuration_items.findMany({
      where: { ci_type: { in: modelTypeCodes } },
      orderBy: { name: 'asc' },
    });

    if (items.length === 0) {
      logger.info(`[CONFIGURATION_ITEMS] No model CIs found for CI type: ${ciTypeCode}`);
      return [];
    }

    // Fetch translations for all items
    const uuids = items.map(item => item.uuid);
    const translationsMap = await fetchTranslations(uuids, locale);
    
    // Transform items with translations
    const transformedItems = items.map(item => {
      const translations = translationsMap[item.uuid] || [];
      const result = { ...item };
      
      // Apply locale-specific translation
      for (const t of translations) {
        if (t.locale === locale && TRANSLATABLE_FIELDS.includes(t.field_name)) {
          result[t.field_name] = t.value;
        }
      }
      
      return result;
    });

    logger.info(`[CONFIGURATION_ITEMS] Found ${transformedItems.length} models for CI type: ${ciTypeCode}`);
    return transformedItems;
  } catch (error) {
    logger.error('[CONFIGURATION_ITEMS] Error getting models for type:', error);
    throw error;
  }
};

module.exports = {
  search,
  getAll,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  getModelsForType,
};
