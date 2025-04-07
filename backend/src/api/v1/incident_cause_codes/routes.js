const express = require('express');
const router = express.Router();
const { getIncidentCauseCodesController } = require('./controller');
const { validateGetIncidentCauseCodes } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetIncidentCauseCodes, (req, res) => {
    logger.info('[ROUTES] Handling GET request for incident cause codes');
    getIncidentCauseCodesController(req, res);
});

module.exports = router;
