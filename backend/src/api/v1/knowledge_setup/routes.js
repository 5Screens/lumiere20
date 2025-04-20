const express = require('express');
const router = express.Router();
const knowledgeSetupController = require('./controller');
const { validateGetKnowledgeSetupQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/knowledge_setup
router.get('/', validateGetKnowledgeSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/knowledge_setup - Route handler started');
    return knowledgeSetupController.getKnowledgeSetup(req, res);
});

module.exports = router;
