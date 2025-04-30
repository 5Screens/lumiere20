const express = require('express');
const router = express.Router();
const projectSetupController = require('./controller');
const { validateGetProjectSetupQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/project_setup
router.get('/', validateGetProjectSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/project_setup - Route handler started');
    return projectSetupController.getProjectSetup(req, res);
});

module.exports = router;
