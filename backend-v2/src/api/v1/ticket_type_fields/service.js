/**
 * Ticket Type Fields Service
 * Handles CRUD operations for ticket type extended fields
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

// Entity type for translations table
const ENTITY_TYPE = 'ticket_type_fields';
// Translatable fields
const TRANSLATABLE_FIELDS = ['label', 'description'];

/**
 * Fetch translations for fields from translated_fields table
 * @param {string[]} uuids - Array of field UUIDs
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
 * Transform field with translations applied
 * @param {Object} field - Field object
 * @param {Array} translations - Array of translation records
 * @param {string} locale - Target locale
 * @returns {Object} Field with translated fields
 */
const transformWithTranslations = (field, translations = [], locale = null) => {
  // Parse options_source - can be JSON array or API endpoint URL
  let options = null;
  if (field.options_source) {
    try {
      options = JSON.parse(field.options_source);
    } catch {
      // Not JSON - might be an API endpoint URL, keep as string
      options = field.options_source;
    }
  }
  
  const result = {
    ...field,
    options
  };
  
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
 * Save translations for a field
 * @param {string} uuid - Field UUID
 * @param {Object} translations - Translations object { field_name: { locale: value } }
 */
const saveTranslations = async (uuid, translations) => {
  if (!translations) return;
  
  for (const [fieldName, locales] of Object.entries(translations)) {
    if (!TRANSLATABLE_FIELDS.includes(fieldName)) continue;
    
    for (const [locale, value] of Object.entries(locales)) {
      if (!value || !value.trim()) {
        // Delete empty translations
        await prisma.translated_fields.deleteMany({
          where: {
            entity_type: ENTITY_TYPE,
            entity_uuid: uuid,
            field_name: fieldName,
            locale
          }
        });
      } else {
        // Upsert translation
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: ENTITY_TYPE,
              entity_uuid: uuid,
              field_name: fieldName,
              locale
            }
          },
          update: { value: value.trim() },
          create: {
            entity_type: ENTITY_TYPE,
            entity_uuid: uuid,
            field_name: fieldName,
            locale,
            value: value.trim()
          }
        });
      }
    }
  }
};

/**
 * Get all fields for a ticket type
 * @param {string} ticketTypeUuid - Ticket type UUID
 * @param {string} locale - Locale for translations (optional)
 * @returns {Promise<Array>} List of fields
 */
const getByTypeUuid = async (ticketTypeUuid, locale = null) => {
  try {
    const fields = await prisma.ticket_type_fields.findMany({
      where: { ticket_type_uuid: ticketTypeUuid },
      orderBy: { display_order: 'asc' }
    });
    
    // Fetch translations with locale filter
    const uuids = fields.map(f => f.uuid);
    const translationsMap = await fetchTranslations(uuids, locale);
    
    logger.info(`[TICKET_TYPE_FIELDS] getByTypeUuid - ticketTypeUuid: ${ticketTypeUuid}, locale: ${locale}, fieldsCount: ${fields.length}, translationsCount: ${Object.keys(translationsMap).length}`);
    
    // Transform with translations
    return fields.map(field => 
      transformWithTranslations(field, translationsMap[field.uuid] || [], locale)
    );
  } catch (error) {
    logger.error(`[TICKET_TYPE_FIELDS] Error fetching fields for ticket type ${ticketTypeUuid}:`, error);
    throw error;
  }
};

/**
 * Get a single field by UUID
 * @param {string} uuid - Field UUID
 * @param {string} locale - Locale for translations (optional)
 * @returns {Promise<Object|null>} Field or null
 */
const getByUuid = async (uuid, locale = null) => {
  try {
    const field = await prisma.ticket_type_fields.findUnique({
      where: { uuid }
    });
    
    if (!field) return null;
    
    // Fetch translations with locale filter
    const translationsMap = await fetchTranslations([uuid], locale);
    logger.info(`[TICKET_TYPE_FIELDS] getByUuid - uuid: ${uuid}, locale: ${locale}, translationsCount: ${(translationsMap[uuid] || []).length}`);
    return transformWithTranslations(field, translationsMap[uuid] || [], locale);
  } catch (error) {
    logger.error(`[TICKET_TYPE_FIELDS] Error fetching field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Create a new field
 * @param {Object} data - Field data including _translations
 * @returns {Promise<Object>} Created field
 */
const create = async (data) => {
  try {
    logger.info(`[TICKET_TYPE_FIELDS] Creating field: ${data.field_name} for type ${data.ticket_type_uuid}`);
    
    const { _translations, options, ...fieldData } = data;
    
    // Convert options array to JSON string if present
    if (options) {
      fieldData.options_source = JSON.stringify(options);
    }
    
    const field = await prisma.ticket_type_fields.create({
      data: fieldData
    });
    
    // Save translations if provided
    if (_translations) {
      await saveTranslations(field.uuid, _translations);
    }
    
    // Fetch and return with translations
    const translationsMap = await fetchTranslations([field.uuid]);
    return transformWithTranslations(field, translationsMap[field.uuid] || [], null);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Error creating field:', error);
    throw error;
  }
};

/**
 * Update a field
 * @param {string} uuid - Field UUID
 * @param {Object} data - Field data including _translations
 * @returns {Promise<Object>} Updated field
 */
const update = async (uuid, data) => {
  try {
    logger.info(`[TICKET_TYPE_FIELDS] Updating field: ${uuid}`);
    
    const { _translations, options, ...fieldData } = data;
    
    // Convert options array to JSON string if present
    if (options !== undefined) {
      fieldData.options_source = options ? JSON.stringify(options) : null;
    }
    
    const field = await prisma.ticket_type_fields.update({
      where: { uuid },
      data: fieldData
    });
    
    // Save translations if provided
    if (_translations) {
      await saveTranslations(uuid, _translations);
    }
    
    // Fetch and return with translations
    const translationsMap = await fetchTranslations([uuid]);
    return transformWithTranslations(field, translationsMap[uuid] || [], null);
  } catch (error) {
    logger.error(`[TICKET_TYPE_FIELDS] Error updating field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete a field
 * @param {string} uuid - Field UUID
 * @returns {Promise<void>}
 */
const remove = async (uuid) => {
  try {
    logger.info(`[TICKET_TYPE_FIELDS] Deleting field: ${uuid}`);
    
    // Delete translations first
    await prisma.translated_fields.deleteMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: uuid
      }
    });
    
    await prisma.ticket_type_fields.delete({
      where: { uuid }
    });
  } catch (error) {
    logger.error(`[TICKET_TYPE_FIELDS] Error deleting field ${uuid}:`, error);
    throw error;
  }
};

/**
 * Delete multiple fields
 * @param {string[]} uuids - Array of UUIDs
 * @returns {Promise<number>} Number of deleted items
 */
const removeMany = async (uuids) => {
  try {
    logger.info(`[TICKET_TYPE_FIELDS] Deleting ${uuids.length} fields`);
    
    // Delete translations first
    await prisma.translated_fields.deleteMany({
      where: {
        entity_type: ENTITY_TYPE,
        entity_uuid: { in: uuids }
      }
    });
    
    const result = await prisma.ticket_type_fields.deleteMany({
      where: { uuid: { in: uuids } }
    });
    
    return result.count;
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Error deleting many fields:', error);
    throw error;
  }
};

/**
 * Reorder fields
 * @param {string} ticketTypeUuid - Ticket type UUID
 * @param {Array} orderedUuids - Array of field UUIDs in new order
 * @returns {Promise<void>}
 */
const reorder = async (ticketTypeUuid, orderedUuids) => {
  try {
    logger.info(`[TICKET_TYPE_FIELDS] Reordering ${orderedUuids.length} fields for type ${ticketTypeUuid}`);
    
    // Update display_order for each field
    const updates = orderedUuids.map((uuid, index) => 
      prisma.ticket_type_fields.update({
        where: { uuid },
        data: { display_order: index }
      })
    );
    
    await prisma.$transaction(updates);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Error reordering fields:', error);
    throw error;
  }
};

/**
 * Toggle field visibility (show_in_form / show_in_table)
 * @param {string} uuid - Field UUID
 * @param {string} property - Property to toggle (show_in_form or show_in_table)
 * @returns {Promise<Object>} Updated field
 */
const toggleVisibility = async (uuid, property) => {
  try {
    const field = await prisma.ticket_type_fields.findUnique({ where: { uuid } });
    if (!field) throw new Error('Field not found');
    
    const newValue = !field[property];
    logger.info(`[TICKET_TYPE_FIELDS] Toggling ${property} to ${newValue} for field ${uuid}`);
    
    const updated = await prisma.ticket_type_fields.update({
      where: { uuid },
      data: { [property]: newValue }
    });
    
    return {
      ...updated,
      options: updated.options_source ? JSON.parse(updated.options_source) : null
    };
  } catch (error) {
    logger.error(`[TICKET_TYPE_FIELDS] Error toggling visibility for field ${uuid}:`, error);
    throw error;
  }
};

module.exports = {
  getByTypeUuid,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  reorder,
  toggleVisibility
};
