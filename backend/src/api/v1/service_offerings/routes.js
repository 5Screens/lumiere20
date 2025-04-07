const express = require('express');
const router = express.Router();
const serviceOfferingsController = require('./controller');
const validate = require('../../../middleware/validate');
const serviceOfferingsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route to get all services
// GET /api/v1/service_offerings
router.get(
    '/',
    (req, res, next) => {
        logger.info('[ROUTES] GET /api/v1/service_offerings - Route handler started');
        next();
    },
    serviceOfferingsController.getAllServices
);

// Route to get the count of subscribed offerings for an entity
// http://localhost:3000/api/v1/service_offerings/getSubscribedOfferings/count?uuid=4af6f1dd-d5fa-45d7-a902-59ab7ad532b6
router.get(
    '/getSubscribedOfferings/count',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/service_offerings/getSubscribedOfferings/count - Route handler started with uuid=${req.query.uuid}`);
        next();
    },
    validate(serviceOfferingsValidation.getSubscribedOfferingsCount),
    serviceOfferingsController.getSubscribedOfferingsCount
);

module.exports = router;
