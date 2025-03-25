const express = require('express');
const router = express.Router();
const { getAllConfigurationItems } = require('./controller');
const { validateGetAll } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/configuration_items
router.get('/', validateGetAll, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/configuration_items - Route handler started');
    return getAllConfigurationItems(req, res);
});

module.exports = router;
