/**
 * Workflows Controller
 * Handles HTTP requests for workflow management
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

// ============================================
// WORKFLOWS
// ============================================

/**
 * Get all workflows
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    const entityType = req.query.entity_type || null;
    const search = req.query.search || null;
    
    const workflows = await service.getAll({ activeOnly, locale, entityType, search });
    res.json(workflows);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getAll:', error);
    next(error);
  }
};

/**
 * Get workflow by UUID with full details
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    
    const workflow = await service.getByUuid(uuid, locale);
    
    if (!workflow) {
      return res.status(404).json({
        error: 'Not found',
        message: `Workflow with UUID '${uuid}' not found`
      });
    }
    
    res.json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

/**
 * Create a new workflow
 */
const create = async (req, res, next) => {
  try {
    const workflow = await service.create(req.body);
    res.status(201).json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in create:', error);
    next(error);
  }
};

/**
 * Update a workflow
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const workflow = await service.update(uuid, req.body);
    res.json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in update:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Workflow with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Duplicate a workflow
 */
const duplicateWorkflow = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const workflow = await service.duplicate(uuid, locale);
    res.status(201).json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in duplicate:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Workflow with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete a workflow
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in remove:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Workflow with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Save all workflow changes (statuses and transitions)
 */
const saveAll = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const workflow = await service.saveAll(uuid, req.body, locale);
    res.json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in saveAll:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Workflow with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Search workflows with PrimeVue filters
 */
const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const result = await service.search(req.body, locale);
    res.json(result);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in search:', error);
    next(error);
  }
};

// ============================================
// WORKFLOW STATUSES
// ============================================

/**
 * Create a workflow status
 */
const createStatus = async (req, res, next) => {
  try {
    const { workflowUuid } = req.params;
    const status = await service.createStatus(workflowUuid, req.body);
    res.status(201).json(status);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in createStatus:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid workflow UUID or category UUID'
      });
    }
    
    next(error);
  }
};

/**
 * Update a workflow status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { statusUuid } = req.params;
    const status = await service.updateStatus(statusUuid, req.body);
    res.json(status);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in updateStatus:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Status with UUID '${req.params.statusUuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete a workflow status
 */
const removeStatus = async (req, res, next) => {
  try {
    const { statusUuid } = req.params;
    await service.removeStatus(statusUuid);
    res.status(204).send();
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in removeStatus:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Status with UUID '${req.params.statusUuid}' not found`
      });
    }
    
    next(error);
  }
};

// ============================================
// WORKFLOW TRANSITIONS
// ============================================

/**
 * Create a workflow transition
 */
const createTransition = async (req, res, next) => {
  try {
    const { workflowUuid } = req.params;
    const transition = await service.createTransition(workflowUuid, req.body);
    res.status(201).json(transition);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in createTransition:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid workflow UUID or status UUID'
      });
    }
    
    next(error);
  }
};

/**
 * Update a workflow transition
 */
const updateTransition = async (req, res, next) => {
  try {
    const { transitionUuid } = req.params;
    const transition = await service.updateTransition(transitionUuid, req.body);
    res.json(transition);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in updateTransition:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Transition with UUID '${req.params.transitionUuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete a workflow transition
 */
const removeTransition = async (req, res, next) => {
  try {
    const { transitionUuid } = req.params;
    await service.removeTransition(transitionUuid);
    res.status(204).send();
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in removeTransition:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: `Transition with UUID '${req.params.transitionUuid}' not found`
      });
    }
    
    next(error);
  }
};

// ============================================
// AVAILABLE STATUSES
// ============================================

/**
 * Get available statuses for an object
 */
const getAvailableStatuses = async (req, res, next) => {
  try {
    const { workflowUuid, currentStatusUuid } = req.params;
    const locale = getLocale(req);
    
    const statuses = await service.getAvailableStatuses(workflowUuid, currentStatusUuid, locale);
    res.json(statuses);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getAvailableStatuses:', error);
    next(error);
  }
};

/**
 * Get workflow for a specific entity instance
 * Uses workflow_entity_config to determine the appropriate workflow
 */
const getWorkflowForEntity = async (req, res, next) => {
  try {
    const { entityType, entityUuid } = req.params;
    const locale = getLocale(req);
    
    const workflow = await service.getWorkflowForEntity(entityType, entityUuid, locale);
    
    if (!workflow) {
      return res.status(404).json({
        error: 'Not found',
        message: `No workflow found for entity type '${entityType}' and entity '${entityUuid}'`
      });
    }
    
    res.json(workflow);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getWorkflowForEntity:', error);
    next(error);
  }
};

/**
 * Get available statuses for a specific entity instance
 * Uses workflow_entity_config to determine the workflow and available transitions
 */
const getAvailableStatusesForEntity = async (req, res, next) => {
  try {
    const { entityType, entityUuid } = req.params;
    const { currentStatusUuid } = req.query;
    const locale = getLocale(req);
    
    const statuses = await service.getAvailableStatusesForEntity(
      entityType, 
      entityUuid, 
      currentStatusUuid || null, 
      locale
    );
    
    res.json(statuses);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getAvailableStatusesForEntity:', error);
    next(error);
  }
};

/**
 * Get all statuses for a ticket type (for filter dropdowns)
 */
const getStatusesByTicketType = async (req, res, next) => {
  try {
    const { ticketTypeCode } = req.params;
    const locale = getLocale(req);
    
    logger.info(`[WORKFLOWS CONTROLLER] getStatusesByTicketType called with ticketTypeCode: ${ticketTypeCode}, locale: ${locale}`);
    
    const statuses = await service.getStatusesByTicketType(ticketTypeCode, locale);
    
    logger.info(`[WORKFLOWS CONTROLLER] getStatusesByTicketType returned ${statuses.length} statuses`);
    
    res.json(statuses);
  } catch (error) {
    logger.error('[WORKFLOWS CONTROLLER] Error in getStatusesByTicketType:', error);
    next(error);
  }
};

module.exports = {
  // Workflows
  getAll,
  getByUuid,
  create,
  update,
  remove,
  duplicateWorkflow,
  saveAll,
  search,
  
  // Statuses
  createStatus,
  updateStatus,
  removeStatus,
  
  // Transitions
  createTransition,
  updateTransition,
  removeTransition,
  
  // Available statuses
  getAvailableStatuses,
  getWorkflowForEntity,
  getAvailableStatusesForEntity,
  getStatusesByTicketType
};
