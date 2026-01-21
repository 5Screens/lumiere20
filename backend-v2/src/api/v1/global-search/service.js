const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Global search configuration for each object type
 * Only includes objects that should be searchable globally
 */
const SEARCH_CONFIG = {
  tickets: {
    label: 'Tickets',
    icon: 'pi-ticket',
    table: 'tickets',
    displayField: 'title',
    secondaryField: 'ticket_type_code',
    searchFields: ['title', 'uuid'],
  },
  configuration_items: {
    label: 'Configuration Items',
    icon: 'pi-cog',
    table: 'configuration_items',
    displayField: 'name',
    secondaryField: 'ci_type',
    searchFields: ['name', 'uuid'],
  },
  entities: {
    label: 'Entities',
    icon: 'pi-building',
    table: 'entities',
    displayField: 'name',
    secondaryField: 'entity_id',
    searchFields: ['name', 'entity_id', 'uuid'],
  },
  locations: {
    label: 'Locations',
    icon: 'pi-map-marker',
    table: 'locations',
    displayField: 'name',
    secondaryField: 'city',
    searchFields: ['name', 'city', 'uuid'],
  },
  groups: {
    label: 'Groups',
    icon: 'pi-users',
    table: 'groups',
    displayField: 'group_name',
    secondaryField: 'email',
    searchFields: ['group_name', 'email', 'uuid'],
  },
  persons: {
    label: 'Persons',
    icon: 'pi-user',
    table: 'persons',
    displayField: 'last_name',
    secondaryField: 'email',
    searchFields: ['first_name', 'last_name', 'email', 'uuid'],
    // Special handling for display: first_name + last_name
    customDisplay: (item) => `${item.first_name || ''} ${item.last_name || ''}`.trim(),
  },
  symptoms: {
    label: 'Symptoms',
    icon: 'pi-exclamation-circle',
    table: 'symptoms',
    displayField: 'label',
    secondaryField: 'code',
    searchFields: ['label', 'code', 'uuid'],
    isTranslatable: true,
    translatableFields: ['label'],
  },
};

/**
 * Check if a string looks like a valid UUID or partial UUID
 * @param {string} str - String to check
 * @returns {boolean}
 */
const looksLikeUuid = (str) => {
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // Accept if it contains only hex chars and dashes, and is at least 8 chars
  return str.length >= 8 && /^[0-9a-f-]+$/i.test(str);
};

/**
 * Build OR conditions for search fields
 * @param {string} query - Search query
 * @param {string[]} fields - Fields to search in
 * @returns {Object[]} Prisma OR conditions
 */
const buildSearchConditions = (query, fields) => {
  const conditions = [];
  
  for (const field of fields) {
    if (field === 'uuid') {
      // For UUID field, only search if query looks like a UUID
      // Use raw SQL cast to search UUID as text
      if (looksLikeUuid(query)) {
        // Prisma doesn't support contains on UUID, so we use equals for exact match
        // or startsWith if it's a partial UUID prefix
        if (query.length === 36) {
          // Full UUID - exact match
          conditions.push({ uuid: query });
        }
        // For partial UUIDs, we skip - Prisma doesn't support partial UUID search easily
        // Users can copy-paste full UUIDs
      }
    } else {
      conditions.push({ [field]: { contains: query, mode: 'insensitive' } });
    }
  }
  
  return conditions;
};

/**
 * Search in a single object type
 * @param {string} objectType - Object type code
 * @param {string} query - Search query
 * @param {number} limit - Max results per type
 * @param {string} locale - Locale for translations
 * @returns {Promise<{items: Object[], count: number}>}
 */
const searchInObjectType = async (objectType, query, limit, locale) => {
  const config = SEARCH_CONFIG[objectType];
  if (!config) return { items: [], count: 0 };

  try {
    const orConditions = buildSearchConditions(query, config.searchFields);
    
    if (orConditions.length === 0) {
      return { items: [], count: 0 };
    }

    const where = { OR: orConditions };

    // Get count and items in parallel
    const [count, items] = await Promise.all([
      prisma[config.table].count({ where }),
      prisma[config.table].findMany({
        where,
        take: limit,
        orderBy: { [config.displayField]: 'asc' },
      }),
    ]);

    // Handle translations for translatable fields
    let translatedItems = items;
    if (config.isTranslatable && config.translatableFields && items.length > 0) {
      const uuids = items.map(item => item.uuid);
      const translations = await prisma.translated_fields.findMany({
        where: {
          entity_type: objectType,
          entity_uuid: { in: uuids },
          field_name: { in: config.translatableFields },
          locale,
        },
      });

      const translationMap = {};
      for (const t of translations) {
        if (!translationMap[t.entity_uuid]) translationMap[t.entity_uuid] = {};
        translationMap[t.entity_uuid][t.field_name] = t.value;
      }

      translatedItems = items.map(item => {
        const itemTranslations = translationMap[item.uuid] || {};
        const translated = { ...item };
        for (const field of config.translatableFields) {
          if (itemTranslations[field]) {
            translated[field] = itemTranslations[field];
          }
        }
        return translated;
      });
    }

    // Transform items to standard format
    const transformedItems = translatedItems.map(item => ({
      uuid: item.uuid,
      display: config.customDisplay ? config.customDisplay(item) : item[config.displayField],
      secondary: item[config.secondaryField] || null,
      objectType,
    }));

    return { items: transformedItems, count };
  } catch (error) {
    logger.error(`[GLOBAL-SEARCH] Error searching in ${objectType}:`, error);
    return { items: [], count: 0 };
  }
};

/**
 * Perform global search across all configured object types
 * @param {string} query - Search query (min 2 chars)
 * @param {number} limitPerType - Max results per object type (default 5)
 * @param {string} locale - Locale for translations (default 'en')
 * @returns {Promise<{groups: Object[], totalCount: number}>}
 */
const globalSearch = async (query, limitPerType = 5, locale = 'en') => {
  if (!query || query.length < 2) {
    return { groups: [], totalCount: 0 };
  }

  const trimmedQuery = query.trim();
  
  // Search all object types in parallel
  const searchPromises = Object.keys(SEARCH_CONFIG).map(async (objectType) => {
    const result = await searchInObjectType(objectType, trimmedQuery, limitPerType, locale);
    const config = SEARCH_CONFIG[objectType];
    
    return {
      code: objectType,
      label: config.label,
      icon: config.icon,
      count: result.count,
      items: result.items,
    };
  });

  const results = await Promise.all(searchPromises);

  // Filter out empty groups and calculate total
  const groups = results.filter(group => group.items.length > 0);
  const totalCount = results.reduce((sum, group) => sum + group.count, 0);

  logger.info(`[GLOBAL-SEARCH] Query "${trimmedQuery}" found ${totalCount} results across ${groups.length} types`);

  return { groups, totalCount };
};

module.exports = {
  globalSearch,
  SEARCH_CONFIG,
};
