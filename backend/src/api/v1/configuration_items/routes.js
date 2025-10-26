const express = require('express');
const router = express.Router();
const { getAllConfigurationItems, searchConfigurationItems } = require('./controller');
const { validateGetAll, validateSearch } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/configuration_items - Get all (legacy)
router.get('/', validateGetAll, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/configuration_items - Route handler started');
    
    // If search parameters are present, use search endpoint
    if (req.query.search || req.query.page || req.query.limit) {
        logger.info('[ROUTES] Redirecting to search endpoint');
        return validateSearch(req, res, () => searchConfigurationItems(req, res));
    }
    
    return getAllConfigurationItems(req, res);
});

module.exports = router;
