const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validate = require('../../../middleware/validate');
const { getPersonsQuerySchema } = require('./validation');
const logger = require('../../../config/logger');

// Log middleware for this route
router.use((req, res, next) => {
    logger.info('Routes - Accessing persons routes');
    next();
});

// GET /api/v1/persons
router.get('/', 
    validate({ query: getPersonsQuerySchema }),
    controller.getPersons
);

module.exports = router;
