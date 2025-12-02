/**
 * Translations Service
 * Handles dynamic translations for entities with translatable fields
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get translations for a specific entity
 * @param {string} entityType - Entity type (e.g., 'ci_types')
 * @param {string} entityUuid - Entity UUID
 * @param {string} locale - Optional locale filter
 * @returns {Promise<Object>} Translations grouped by field and locale
 */
const getTranslations = async (entityType, entityUuid, locale = null) => {
  try {
    const where = {
      entity_type: entityType,
      entity_uuid: entityUuid
    };
    
    if (locale) {
      where.locale = locale;
    }
    
    const translations = await prisma.translated_fields.findMany({
      where,
      orderBy: [
        { field_name: 'asc' },
        { locale: 'asc' }
      ]
    });
    
    // Group by field_name -> locale -> value
    const grouped = {};
    for (const t of translations) {
      if (!grouped[t.field_name]) {
        grouped[t.field_name] = {};
      }
      grouped[t.field_name][t.locale] = t.value;
    }
    
    return grouped;
  } catch (error) {
    logger.error(`Error fetching translations for ${entityType}/${entityUuid}:`, error);
    throw error;
  }
};

/**
 * Get translated value for a specific field
 * @param {string} entityType - Entity type
 * @param {string} entityUuid - Entity UUID
 * @param {string} fieldName - Field name
 * @param {string} locale - Locale
 * @param {string} fallback - Fallback value if no translation found
 * @returns {Promise<string>} Translated value or fallback
 */
const getTranslatedValue = async (entityType, entityUuid, fieldName, locale, fallback = null) => {
  try {
    const translation = await prisma.translated_fields.findUnique({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: entityType,
          entity_uuid: entityUuid,
          field_name: fieldName,
          locale
        }
      }
    });
    
    return translation?.value || fallback;
  } catch (error) {
    logger.error(`Error fetching translation for ${entityType}/${entityUuid}/${fieldName}/${locale}:`, error);
    return fallback;
  }
};

/**
 * Set translation for a specific field
 * @param {string} entityType - Entity type
 * @param {string} entityUuid - Entity UUID
 * @param {string} fieldName - Field name
 * @param {string} locale - Locale
 * @param {string} value - Translation value
 * @returns {Promise<Object>} Created/updated translation
 */
const setTranslation = async (entityType, entityUuid, fieldName, locale, value) => {
  try {
    const translation = await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: entityType,
          entity_uuid: entityUuid,
          field_name: fieldName,
          locale
        }
      },
      update: { value },
      create: {
        entity_type: entityType,
        entity_uuid: entityUuid,
        field_name: fieldName,
        locale,
        value
      }
    });
    
    logger.info(`Translation set: ${entityType}/${entityUuid}/${fieldName}/${locale}`);
    return translation;
  } catch (error) {
    logger.error(`Error setting translation for ${entityType}/${entityUuid}/${fieldName}/${locale}:`, error);
    throw error;
  }
};

/**
 * Set multiple translations for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityUuid - Entity UUID
 * @param {Object} translations - Object { fieldName: { locale: value } }
 * @returns {Promise<number>} Number of translations set
 */
const setTranslations = async (entityType, entityUuid, translations) => {
  try {
    let count = 0;
    
    for (const [fieldName, locales] of Object.entries(translations)) {
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined) {
          await setTranslation(entityType, entityUuid, fieldName, locale, value);
          count++;
        }
      }
    }
    
    logger.info(`Set ${count} translations for ${entityType}/${entityUuid}`);
    return count;
  } catch (error) {
    logger.error(`Error setting translations for ${entityType}/${entityUuid}:`, error);
    throw error;
  }
};

/**
 * Delete all translations for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityUuid - Entity UUID
 * @returns {Promise<number>} Number of deleted translations
 */
const deleteTranslations = async (entityType, entityUuid) => {
  try {
    const result = await prisma.translated_fields.deleteMany({
      where: {
        entity_type: entityType,
        entity_uuid: entityUuid
      }
    });
    
    logger.info(`Deleted ${result.count} translations for ${entityType}/${entityUuid}`);
    return result.count;
  } catch (error) {
    logger.error(`Error deleting translations for ${entityType}/${entityUuid}:`, error);
    throw error;
  }
};

/**
 * Get all available locales for an entity type
 * @param {string} entityType - Entity type
 * @returns {Promise<Array<string>>} List of locales
 */
const getAvailableLocales = async (entityType) => {
  try {
    const locales = await prisma.translated_fields.findMany({
      where: { entity_type: entityType },
      select: { locale: true },
      distinct: ['locale']
    });
    
    return locales.map(l => l.locale);
  } catch (error) {
    logger.error(`Error fetching locales for ${entityType}:`, error);
    throw error;
  }
};

/**
 * Enrich entity with translations for a specific locale
 * @param {Object} entity - Entity object
 * @param {string} entityType - Entity type
 * @param {string} locale - Target locale
 * @param {Array<string>} translatableFields - List of translatable field names
 * @returns {Promise<Object>} Entity with translated fields
 */
const enrichWithTranslations = async (entity, entityType, locale, translatableFields) => {
  if (!entity || !translatableFields.length) return entity;
  
  try {
    const translations = await getTranslations(entityType, entity.uuid, locale);
    
    const enriched = { ...entity };
    for (const field of translatableFields) {
      if (translations[field] && translations[field][locale]) {
        enriched[field] = translations[field][locale];
      }
      // Keep original value as fallback if no translation
    }
    
    return enriched;
  } catch (error) {
    logger.error(`Error enriching entity with translations:`, error);
    return entity;
  }
};

/**
 * Enrich multiple entities with translations
 * @param {Array<Object>} entities - Array of entities
 * @param {string} entityType - Entity type
 * @param {string} locale - Target locale
 * @param {Array<string>} translatableFields - List of translatable field names
 * @returns {Promise<Array<Object>>} Entities with translated fields
 */
const enrichManyWithTranslations = async (entities, entityType, locale, translatableFields) => {
  if (!entities.length || !translatableFields.length) return entities;
  
  try {
    // Batch fetch all translations for these entities
    const uuids = entities.map(e => e.uuid);
    
    const translations = await prisma.translated_fields.findMany({
      where: {
        entity_type: entityType,
        entity_uuid: { in: uuids },
        locale
      }
    });
    
    // Group by entity_uuid
    const translationsByEntity = {};
    for (const t of translations) {
      if (!translationsByEntity[t.entity_uuid]) {
        translationsByEntity[t.entity_uuid] = {};
      }
      translationsByEntity[t.entity_uuid][t.field_name] = t.value;
    }
    
    // Enrich entities
    return entities.map(entity => {
      const entityTranslations = translationsByEntity[entity.uuid] || {};
      const enriched = { ...entity };
      
      for (const field of translatableFields) {
        if (entityTranslations[field]) {
          enriched[field] = entityTranslations[field];
        }
      }
      
      return enriched;
    });
  } catch (error) {
    logger.error(`Error enriching entities with translations:`, error);
    return entities;
  }
};

module.exports = {
  getTranslations,
  getTranslatedValue,
  setTranslation,
  setTranslations,
  deleteTranslations,
  getAvailableLocales,
  enrichWithTranslations,
  enrichManyWithTranslations
};
