const express = require('express');
const router = express.Router();
const service = require('./service');
const logger = require('../../../config/logger');

/**
 * GET /api/v1/object-types
 * Get all object types
 */
router.get('/', async (req, res) => {
  try {
    const objectTypes = await service.getAll();
    res.json(objectTypes);
  } catch (error) {
    logger.error('[ObjectTypesRoutes] Error getting all object types:', error);
    res.status(500).json({ error: 'Failed to get object types' });
  }
});

/**
 * GET /api/v1/object-types/by-code/:code
 * Get object type by code
 */
router.get('/by-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const objectType = await service.getByCode(code);
    
    if (!objectType) {
      return res.status(404).json({ error: `Object type '${code}' not found` });
    }
    
    res.json(objectType);
  } catch (error) {
    logger.error(`[ObjectTypesRoutes] Error getting object type by code ${req.params.code}:`, error);
    res.status(500).json({ error: 'Failed to get object type' });
  }
});

module.exports = router;
