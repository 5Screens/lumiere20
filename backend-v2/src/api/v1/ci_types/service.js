/**
 * CI Types Service
 * Handles business logic for Configuration Item types
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

// Translatable fields for ci_types
const TRANSLATABLE_FIELDS = ['label', 'description'];

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
      include: {
        translations: locale ? {
          where: { locale }
        } : true
      },
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    // Transform to include translated values
    return ciTypes.map(ct => transformWithTranslations(ct, locale));
  } catch (error) {
    logger.error('Error fetching CI types:', error);
    throw error;
  }
};

/**
 * Transform CI type with translations applied
 * @param {Object} ciType - CI type with translations relation
 * @param {string} locale - Target locale
 * @returns {Object} CI type with translated fields
 */
const transformWithTranslations = (ciType, locale) => {
  const { translations, ...rest } = ciType;
  const result = { ...rest };
  
  if (translations && translations.length > 0 && locale) {
    for (const t of translations) {
      if (t.locale === locale && TRANSLATABLE_FIELDS.includes(t.field_name)) {
        result[t.field_name] = t.value;
      }
    }
  }
  
  // Include all translations for editing purposes
  result._translations = {};
  if (translations) {
    for (const t of translations) {
      if (!result._translations[t.field_name]) {
        result._translations[t.field_name] = {};
      }
      result._translations[t.field_name][t.locale] = t.value;
    }
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
      where: { code },
      include: {
        translations: locale ? {
          where: { locale }
        } : true
      }
    });
    
    return ciType ? transformWithTranslations(ciType, locale) : null;
  } catch (error) {
    logger.error(`Error fetching CI type ${code}:`, error);
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
      include: {
        translations: {
          where: { 
            locale,
            field_name: 'label'
          }
        }
      },
      orderBy: [
        { display_order: 'asc' },
        { label: 'asc' }
      ]
    });
    
    return ciTypes.map(ct => {
      // Get translated label or fallback to default
      const translatedLabel = ct.translations.find(t => t.field_name === 'label')?.value || ct.label;
      
      return {
        label: translatedLabel,
        value: ct.code,
        icon: ct.icon,
        color: ct.color
      };
    });
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
 * Save translations for a CI type
 * @param {string} ciTypeUuid - CI type UUID
 * @param {Object} translations - Object { fieldName: { locale: value } }
 */
const saveTranslations = async (ciTypeUuid, translations) => {
  for (const [fieldName, locales] of Object.entries(translations)) {
    if (!TRANSLATABLE_FIELDS.includes(fieldName)) continue;
    
    for (const [locale, value] of Object.entries(locales)) {
      if (value !== null && value !== undefined && value !== '') {
        await prisma.ci_types_translation.upsert({
          where: {
            ci_type_uuid_locale_field_name: {
              ci_type_uuid: ciTypeUuid,
              locale,
              field_name: fieldName
            }
          },
          update: { value },
          create: {
            ci_type_uuid: ciTypeUuid,
            locale,
            field_name: fieldName,
            value
          }
        });
      }
    }
  }
};

/**
 * Delete a CI type (translations are cascade deleted)
 * @param {string} uuid - CI type UUID
 * @returns {Promise<Object>} Deleted CI type
 */
const remove = async (uuid) => {
  try {
    // Translations are cascade deleted via Prisma relation
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

module.exports = {
  getAll,
  getByCode,
  getAsOptions,
  create,
  update,
  remove
};
