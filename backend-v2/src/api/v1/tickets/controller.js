const service = require('./service');
const logger = require('../../../config/logger');

const getLocale = (req) => {
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return req.query.locale || headerLocale || 'en';
};

/**
 * Get ticket_type_code from query params or route
 */
const getTicketTypeCode = (req) => {
  return req.query.ticket_type_code || req.params.ticketType || null;
};

const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const ticketTypeCode = getTicketTypeCode(req);
    const result = await service.search(req.body, locale, ticketTypeCode);
    res.json(result);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in search:', error);
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const ticketTypeCode = getTicketTypeCode(req);
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'updated_at',
      sortOrder: parseInt(sortOrder) || -1,
      ticketTypeCode,
    });
    res.json(result);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in getAll:', error);
    next(error);
  }
};

const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const ticketTypeCode = getTicketTypeCode(req);
    const item = await service.getByUuid(uuid, locale, ticketTypeCode);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Ticket not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const ticketTypeCode = getTicketTypeCode(req) || req.body.ticket_type_code;
    const item = await service.create(req.body, ticketTypeCode);
    res.status(201).json(item);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in create:', error);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const ticketTypeCode = getTicketTypeCode(req);
    const item = await service.update(uuid, req.body, ticketTypeCode);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Ticket not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in update:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Ticket with UUID '${req.params.uuid}' not found`,
      });
    }

    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const ticketTypeCode = getTicketTypeCode(req);
    const success = await service.remove(uuid, ticketTypeCode);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Ticket not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in remove:', error);
    next(error);
  }
};

const removeMany = async (req, res, next) => {
  try {
    const { uuids } = req.body;
    const ticketTypeCode = getTicketTypeCode(req);

    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'uuids must be a non-empty array',
      });
    }

    const count = await service.removeMany(uuids, ticketTypeCode);
    res.json({ deleted: count });
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in removeMany:', error);
    next(error);
  }
};

/**
 * Get extended fields definition for a ticket type
 */
const getTypeFields = async (req, res, next) => {
  try {
    const { ticketType } = req.params;
    const fields = await service.getTicketTypeFields(ticketType);
    res.json(fields);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in getTypeFields:', error);
    next(error);
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
  getTypeFields,
};
