const express = require('express');
const router = express.Router();
const servicesController = require('./controller');
const validate = require('../../../middleware/validate');
const servicesValidation = require('./validation');
const logger = require('../../../config/logger');

// Route to get all services
// GET /api/v1/services?lang=fr
router.get(
    '/',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/services - Route handler started with lang=${req.query.lang || 'en'}`);
        
        // Check for unrecognized query parameters
        const allowedParams = ['lang'];
        const queryParams = Object.keys(req.query);
        
        const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
        if (invalidParams.length > 0) {
            logger.warn(`[ROUTES] GET /api/v1/services - Invalid query parameters detected: ${invalidParams.join(', ')}`);
            return res.status(400).json({
                error: 'Invalid query parameters',
                invalidParams: invalidParams
            });
        }
        
        next();
    },
    validate(servicesValidation.getAllServices),
    servicesController.getAllServices
);

// Route to get the count of services for an entity
// http://localhost:3000/api/v1/service/getServicesPerEntity/Count?uuid=4af6f1dd-d5fa-45d7-a902-59ab7ad532b6
router.get(
    '/getServicesPerEntity/Count',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/service/getServicesPerEntity/Count - Route handler started with uuid=${req.query.uuid}`);
        next();
    },
    validate(servicesValidation.getServicesPerEntityCount),
    servicesController.getServicesPerEntityCount
);

module.exports = router;
