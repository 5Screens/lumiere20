const express = require('express');
const router = express.Router();
const { getIncidentPriorityByUrgencyAndImpact } = require('./controller');
const { validateGetIncidentPriority } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetIncidentPriority, (req, res) => {
    logger.info('[ROUTES] Handling GET request for incident priority');
    getIncidentPriorityByUrgencyAndImpact(req, res);
});

module.exports = router;
