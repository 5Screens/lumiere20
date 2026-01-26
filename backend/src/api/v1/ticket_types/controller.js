/**
 * Ticket Types Controller
 * Handles HTTP requests for ticket types
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get locale from request
 */
const getLocale = (req) => {
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return req.query.locale || headerLocale || 'en';
};

/**
 * Get all ticket types
 */
const getAll = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const activeOnly = req.query.active !== 'false';
    
    const ticketTypes = await service.getAll({ activeOnly, locale });
    res.json(ticketTypes);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in getAll:', error);
    next(error);
  }
};

/**
 * Get ticket type by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const ticketType = await service.getByUuid(uuid);
    
    if (!ticketType) {
      return res.status(404).json({
        error: 'Not found',
        message: `Ticket type with UUID '${uuid}' not found`
      });
    }
    
    res.json(ticketType);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

/**
 * Create a new ticket type
 */
const create = async (req, res, next) => {
  try {
    const { _translations, ...data } = req.body;
    const ticketType = await service.create(data, _translations || {});
    
    res.status(201).json(ticketType);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in create:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A ticket type with this code already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Update a ticket type
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { _translations, ...data } = req.body;
    
    const ticketType = await service.update(uuid, data, _translations || {});
    res.json(ticketType);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in update:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Ticket type with UUID '${req.params.uuid}' not found`
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A ticket type with this code already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Delete a ticket type
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in remove:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Ticket type with UUID '${req.params.uuid}' not found`
      });
    }
    
    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete ticket type: it is referenced by existing tickets'
      });
    }
    
    next(error);
  }
};

/**
 * Search ticket types with pagination
 */
const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const searchParams = {
      ...req.body,
      locale
    };
    
    const result = await service.search(searchParams);
    res.json(result);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in search:', error);
    next(error);
  }
};

/**
 * Get ticket types as options for select fields
 */
const getOptions = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const options = await service.getOptions({ locale });
    res.json(options);
  } catch (error) {
    logger.error('[TICKET_TYPES CONTROLLER] Error in getOptions:', error);
    next(error);
  }
};

module.exports = {
  getAll,
  getByUuid,
  create,
  update,
  remove,
  search,
  getOptions
};
