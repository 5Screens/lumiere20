const express = require('express');
const router = express.Router();
const defectSetupController = require('./controller');
const defectSetupValidation = require('./validation');
const logger = require('../../../config/logger');

// GET all defect setup
router.get('/', 
    defectSetupValidation.getAllDefectSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] GET request received for all defect setup endpoint with lang: ${req.query.lang || 'all'}`);
        next();
    },
    defectSetupController.getAllDefectSetup
);

// GET defect setup by UUID
router.get('/:uuid', 
    defectSetupValidation.getDefectSetupByUuid,
    (req, res, next) => {
        logger.info(`[ROUTES] GET request received for defect setup by UUID: ${req.params.uuid}`);
        next();
    },
    defectSetupController.getDefectSetupByUuid
);

// PATCH defect setup by UUID
router.patch('/:uuid', 
    defectSetupValidation.updateDefectSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH request received for defect setup UUID: ${req.params.uuid}`);
        next();
    },
    defectSetupController.updateDefectSetup
);

// POST new defect setup
router.post('/', 
    defectSetupValidation.createDefectSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] POST request received for creating new defect setup`);
        next();
    },
    defectSetupController.createDefectSetup
);

// Legacy route for backward compatibility
router.get('/legacy', 
    defectSetupValidation.getDefectSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] Legacy GET request received for defect setup endpoint`);
        next();
    },
    defectSetupController.getDefectSetup
);

module.exports = router;
