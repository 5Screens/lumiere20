const express = require('express');
const router = express.Router();
const portalsController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/portals - List all portals
router.get('/', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals');
  next();
}, portalsController.list);

// GET /api/v1/portals/:code/full - Get full portal with actions, alerts, widgets
router.get('/:code/full', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/${req.params.code}/full`);
  next();
}, portalsController.getFull);

// GET /api/v1/portals/:code - Get portal by code
router.get('/:code', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/${req.params.code}`);
  next();
}, portalsController.getByCode);

module.exports = router;
