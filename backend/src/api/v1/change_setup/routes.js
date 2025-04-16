const express = require('express');
const router = express.Router();
const changeSetupController = require('./controller');
const { validateGetChangeSetupQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_setup
router.get('/', validateGetChangeSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_setup - Route handler started');
    return changeSetupController.getChangeSetup(req, res);
});

module.exports = router;
