/**
 * Workflow Entity Config Controller
 * Handles HTTP requests for workflow entity configuration
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
 * Get all workflow entity configurations
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const configs = await service.getAll({ activeOnly });
    
    res.json(configs);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in getAll:', error);
    next(error);
  }
};

/**
 * Get workflow entity configuration by entity type
 */
const getByEntityType = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const config = await service.getByEntityType(entityType);
    
    if (!config) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow entity configuration for '${entityType}' not found`
      });
    }
    
    res.json(config);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in getByEntityType:', error);
    next(error);
  }
};

/**
 * Get workflow entity configuration by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const config = await service.getByUuid(uuid);
    
    if (!config) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow entity configuration with UUID '${uuid}' not found`
      });
    }
    
    res.json(config);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

/**
 * Get available subtypes for an entity type
 */
const getSubtypes = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const locale = getLocale(req);
    
    const subtypes = await service.getSubtypes(entityType, locale);
    
    res.json(subtypes);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in getSubtypes:', error);
    next(error);
  }
};

/**
 * Get the subtype value for a specific entity instance
 */
const getEntitySubtype = async (req, res, next) => {
  try {
    const { entityType, entityUuid } = req.params;
    
    const subtype = await service.getEntitySubtype(entityType, entityUuid);
    
    if (!subtype) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Entity '${entityUuid}' of type '${entityType}' not found`
      });
    }
    
    res.json(subtype);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in getEntitySubtype:', error);
    next(error);
  }
};

/**
 * Create a new workflow entity configuration
 */
const create = async (req, res, next) => {
  try {
    const config = await service.create(req.body);
    
    res.status(201).json(config);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in create:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A workflow entity configuration for this entity type already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Update a workflow entity configuration
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const config = await service.update(uuid, req.body);
    
    res.json(config);
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in update:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow entity configuration with UUID '${req.params.uuid}' not found`
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A workflow entity configuration for this entity type already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Delete a workflow entity configuration
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('[WORKFLOW_ENTITY_CONFIG CONTROLLER] Error in remove:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow entity configuration with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

module.exports = {
  getAll,
  getByEntityType,
  getByUuid,
  getSubtypes,
  getEntitySubtype,
  create,
  update,
  remove
};
