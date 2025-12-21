/**
 * Ticket Type Fields Controller
 * Handles HTTP requests for ticket type extended fields
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get locale from request (header or query param)
 */
const getLocale = (req) => {
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return req.query.locale || headerLocale || 'en';
};

/**
 * Get all fields for a ticket type
 */
const getByTypeUuid = async (req, res, next) => {
  try {
    const { ticketTypeUuid } = req.params;
    const locale = getLocale(req);
    const fields = await service.getByTypeUuid(ticketTypeUuid, locale);
    res.json(fields);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - getByTypeUuid:', error);
    next(error);
  }
};

/**
 * Get a single field by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const field = await service.getByUuid(uuid, locale);
    
    if (!field) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Field with UUID '${uuid}' not found`
      });
    }
    
    res.json(field);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - getByUuid:', error);
    next(error);
  }
};

/**
 * Create a new field
 */
const create = async (req, res, next) => {
  try {
    const field = await service.create(req.body);
    res.status(201).json(field);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - create field:', error);
    next(error);
  }
};

/**
 * Update a field
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const field = await service.update(uuid, req.body);
    res.json(field);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - update field:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Field with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete a field
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - delete field:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Field with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete multiple fields
 */
const removeMany = async (req, res, next) => {
  try {
    const { uuids } = req.body;
    
    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'uuids array is required'
      });
    }
    
    const count = await service.removeMany(uuids);
    res.json({ deleted: count });
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - delete many fields:', error);
    next(error);
  }
};

/**
 * Reorder fields
 */
const reorder = async (req, res, next) => {
  try {
    const { ticketTypeUuid } = req.params;
    const { orderedUuids } = req.body;
    
    if (!orderedUuids || !Array.isArray(orderedUuids)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'orderedUuids array is required'
      });
    }
    
    await service.reorder(ticketTypeUuid, orderedUuids);
    res.json({ success: true });
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - reorder fields:', error);
    next(error);
  }
};

/**
 * Toggle field visibility
 */
const toggleVisibility = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { property } = req.body;
    
    if (!['show_in_form', 'show_in_table'].includes(property)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'property must be show_in_form or show_in_table'
      });
    }
    
    const field = await service.toggleVisibility(uuid, property);
    res.json(field);
  } catch (error) {
    logger.error('[TICKET_TYPE_FIELDS] Controller error - toggle visibility:', error);
    next(error);
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
