const express = require('express');
const router = express.Router();
const defectSetupController = require('./controller');
const defectSetupValidation = require('./validation');
const logger = require('../../../config/logger');

router.get('/', 
    defectSetupValidation.getDefectSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] GET request received for defect setup endpoint`);
        next();
    },
    defectSetupController.getDefectSetup
);

module.exports = router;
