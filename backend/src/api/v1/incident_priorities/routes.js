const express = require('express');
const router = express.Router();
const { getIncidentPriorityByUrgencyAndImpact, getAllIncidentPriorities } = require('./controller');
const { validateGetIncidentPriority } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', (req, res) => {
    // If query parameters are provided, get specific priority
    if (req.query.incident_urgencies && req.query.incident_impacts) {
        logger.info('[ROUTES] Handling GET request for specific incident priority');
        validateGetIncidentPriority(req, res, () => {
            getIncidentPriorityByUrgencyAndImpact(req, res);
        });
    } else {
        // Otherwise, get all unique priorities
        logger.info('[ROUTES] Handling GET request for all incident priorities');
        getAllIncidentPriorities(req, res);
    }
});

module.exports = router;
