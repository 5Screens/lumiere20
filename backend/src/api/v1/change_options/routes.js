const express = require('express');
const router = express.Router();
const changeOptionsController = require('./controller');
const { validateGetChangeOptionsQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_options
router.get('/', validateGetChangeOptionsQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_options - Route handler started');
    return changeOptionsController.getChangeOptions(req, res);
});

module.exports = router;
