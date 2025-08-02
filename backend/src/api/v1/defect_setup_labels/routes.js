const express = require('express');
const router = express.Router();
const defectSetupLabelsController = require('./controller');
const defectSetupLabelsValidation = require('./validation');
const logger = require('../../../config/logger');

// POST new defect setup label
router.post('/', 
    defectSetupLabelsValidation.createDefectSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] POST request received for creating new defect setup label`);
        next();
    },
    defectSetupLabelsController.createDefectSetupLabel
);

// PATCH defect setup label by UUID
router.patch('/:uuid', 
    defectSetupLabelsValidation.patchDefectSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH request received for defect setup label UUID: ${req.params.uuid}`);
        next();
    },
    defectSetupLabelsController.patchDefectSetupLabel
);

module.exports = router;
