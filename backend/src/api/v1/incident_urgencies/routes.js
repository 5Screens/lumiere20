const express = require('express');
const router = express.Router();
const { getAllIncidentUrgencies } = require('./controller');
const { validateGetIncidentUrgencies } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetIncidentUrgencies, (req, res) => {
    logger.info('[ROUTES] Handling GET request for incident urgencies');
    getAllIncidentUrgencies(req, res);
});

module.exports = router;
