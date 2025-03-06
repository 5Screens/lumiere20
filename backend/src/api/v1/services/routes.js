const express = require('express');
const router = express.Router();
const servicesController = require('./controller');
const validate = require('../../../middleware/validate');
const servicesValidation = require('./validation');
const logger = require('../../../config/logger');

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
