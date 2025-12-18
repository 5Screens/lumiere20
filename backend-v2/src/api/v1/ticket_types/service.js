/**
 * Ticket Types Service
 * Business logic for ticket types (TASK, INCIDENT, PROBLEM, CHANGE, SERVICE_REQUEST)
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

const ENTITY_TYPE = 'ticket_types';

/**
 * Get all ticket types with translations
 */
const getAll = async ({ activeOnly = true, locale = 'en' } = {}) => {
  const where = activeOnly ? { is_active: true } : {};
  
  const ticketTypes = await prisma.ticket_types.findMany({
    where,
    orderBy: { code: 'asc' }
  });
  
  // Get ALL translations for all ticket types
  const uuids = ticketTypes.map(t => t.uuid);
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
  
  return ticketTypes.map(tt => ({
    ...tt,
    label: translationMap[tt.uuid]?.label || tt.label,
    _translations: allTranslationsMap[tt.uuid] || {}
  }));
};

/**
 * Get ticket type by UUID with translations
 */
const getByUuid = async (uuid) => {
  const ticketType = await prisma.ticket_types.findUnique({
    where: { uuid }
  });
  
  if (!ticketType) return null;
  
  // Get ALL translations for this ticket type
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
  
  return { ...ticketType, _translations: allTranslationsMap };
};

/**
 * Get ticket type by code
 */
const getByCode = async (code) => {
  const ticketType = await prisma.ticket_types.findUnique({
    where: { code }
  });
  
  return ticketType;
};

/**
 * Create a new ticket type
 */
const create = async (data, translations = {}) => {
  const { code, label, is_active = true } = data;
  
  const ticketType = await prisma.ticket_types.create({
    data: {
      code,
      label,
      is_active
    }
  });
  
  // Save translations
  if (translations.label) {
    for (const [locale, value] of Object.entries(translations.label)) {
      if (value) {
        await prisma.translated_fields.create({
          data: {
            entity_type: ENTITY_TYPE,
            entity_uuid: ticketType.uuid,
            field_name: 'label',
            locale,
            value
          }
        });
      }
    }
  }
  
  logger.info(`[TICKET_TYPES] Created: ${ticketType.code}`);
  return getByUuid(ticketType.uuid);
};

/**
 * Update a ticket type
 */
const update = async (uuid, data, translations = {}) => {
  const { code, label, is_active } = data;
  
  const updateData = {};
  if (code !== undefined) updateData.code = code;
  if (label !== undefined) updateData.label = label;
  if (is_active !== undefined) updateData.is_active = is_active;
  
  const ticketType = await prisma.ticket_types.update({
    where: { uuid },
    data: updateData
  });
  
  // Update translations
  if (translations.label) {
    for (const [locale, value] of Object.entries(translations.label)) {
      if (value) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: ENTITY_TYPE,
              entity_uuid: uuid,
              field_name: 'label',
              locale
            }
          },
          update: { value },
          create: {
            entity_type: ENTITY_TYPE,
            entity_uuid: uuid,
            field_name: 'label',
            locale,
            value
          }
        });
      }
    }
  }
  
  logger.info(`[TICKET_TYPES] Updated: ${ticketType.code}`);
  return getByUuid(uuid);
};

/**
 * Delete a ticket type
 */
const remove = async (uuid) => {
  // Delete translations first
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: uuid
    }
  });
  
  const ticketType = await prisma.ticket_types.delete({
    where: { uuid }
  });
  
  logger.info(`[TICKET_TYPES] Deleted: ${ticketType.code}`);
  return ticketType;
};

/**
 * Search ticket types with pagination and filters
 */
const search = async (searchParams) => {
  const {
    filters = {},
    page = 1,
    limit = 50,
    sortField = 'code',
    sortOrder = 1,
    locale = 'en'
  } = searchParams;

  const skip = (page - 1) * limit;
  const take = limit;

  // Build where clause
  const where = {};
  
  // Global filter
  if (filters.globalFilter?.value) {
    const searchValue = filters.globalFilter.value.toLowerCase();
    where.OR = [
      { code: { contains: searchValue, mode: 'insensitive' } },
      { label: { contains: searchValue, mode: 'insensitive' } }
    ];
  }
  
  // Column filters
  if (filters.code?.value) {
    where.code = { contains: filters.code.value, mode: 'insensitive' };
  }
  if (filters.label?.value) {
    where.label = { contains: filters.label.value, mode: 'insensitive' };
  }
  if (filters.is_active?.value !== undefined && filters.is_active?.value !== null) {
    where.is_active = filters.is_active.value;
  }

  // Build orderBy
  const orderBy = {};
  if (sortField) {
    orderBy[sortField] = sortOrder === 1 ? 'asc' : 'desc';
  }

  // Execute queries
  const [ticketTypes, totalCount] = await Promise.all([
    prisma.ticket_types.findMany({
      where,
      orderBy,
      skip,
      take
    }),
    prisma.ticket_types.count({ where })
  ]);

  // Get translations
  const uuids = ticketTypes.map(t => t.uuid);
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

  const data = ticketTypes.map(tt => ({
    ...tt,
    label: translationMap[tt.uuid]?.label || tt.label,
    _translations: allTranslationsMap[tt.uuid] || {}
  }));

  return {
    data,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  };
};

module.exports = {
  getAll,
  getByUuid,
  getByCode,
  create,
  update,
  remove,
  search
};
