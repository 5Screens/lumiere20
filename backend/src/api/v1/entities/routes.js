const express = require('express');
const router = express.Router();
const entityController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/entities
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/entities - Route handler started');
    next();
}, entityController.getAllEntities.bind(entityController));

module.exports = router;
