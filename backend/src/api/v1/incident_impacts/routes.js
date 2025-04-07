const express = require('express');
const router = express.Router();
const { getAllIncidentImpacts } = require('./controller');
const { validateGetIncidentImpacts } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetIncidentImpacts, (req, res) => {
    logger.info('[ROUTES] Handling GET request for incident impacts');
    getAllIncidentImpacts(req, res);
});

module.exports = router;
