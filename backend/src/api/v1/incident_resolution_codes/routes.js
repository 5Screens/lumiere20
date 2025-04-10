const express = require('express');
const router = express.Router();
const resolutionCodeController = require('./controller');
const { validateGetResolutionCodesQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/incident_resolution_codes/:uuid
router.get('/:uuid', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/incident_resolution_codes/${req.params.uuid} - Route handler started`);
    return resolutionCodeController.getResolutionCodeByUuid(req, res);
});

// GET /api/v1/incident_resolution_codes
router.get('/', validateGetResolutionCodesQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/incident_resolution_codes - Route handler started');
    return resolutionCodeController.getResolutionCodes(req, res);
});

module.exports = router;
