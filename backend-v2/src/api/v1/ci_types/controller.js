/**
 * CI Types Controller
 * Handles HTTP requests for Configuration Item types
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all CI types
 */
const getAll = async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const ciTypes = await service.getAll(activeOnly);
    
    res.json(ciTypes);
  } catch (error) {
    logger.error('Controller error - getAll CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI types'
    });
  }
};

/**
 * Get CI types as select options
 */
const getOptions = async (req, res) => {
  try {
    const options = await service.getAsOptions();
    
    res.json(options);
  } catch (error) {
    logger.error('Controller error - getOptions CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type options'
    });
  }
};

/**
 * Get CI type by code
 */
const getByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const ciType = await service.getByCode(code);
    
    if (!ciType) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `CI type '${code}' not found`
      });
    }
    
    res.json(ciType);
  } catch (error) {
    logger.error('Controller error - getByCode CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type'
    });
  }
};

/**
 * Create a new CI type
 */
const create = async (req, res) => {
  try {
    const ciType = await service.create(req.body);
    
    res.status(201).json(ciType);
  } catch (error) {
    logger.error('Controller error - create CI type:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A CI type with this code already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create CI type'
    });
  }
};

/**
 * Update a CI type
 */
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    const ciType = await service.update(uuid, req.body);
    
    res.json(ciType);
  } catch (error) {
    logger.error('Controller error - update CI type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'CI type not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update CI type'
    });
  }
};

/**
 * Delete a CI type
 */
const remove = async (req, res) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete CI type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'CI type not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete CI type'
    });
  }
};

module.exports = {
  getAll,
  getOptions,
  getByCode,
  create,
  update,
  remove
};
