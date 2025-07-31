const express = require('express');
const router = express.Router();
const { handleGetContactTypes, handleGetContactTypeByUuid, handleUpdateContactType, handleCreateContactType } = require('./controller');
const { validateGetContactTypes, validateUpdateContactType, validateCreateContactType } = require('./validation');
const validate = require('../../../middleware/validate');
const logger = require('../../../config/logger');

router.get('/', validateGetContactTypes, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/contact_types');
    handleGetContactTypes(req, res);
});

router.get('/:uuid', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/contact_types/${req.params.uuid}`);
    handleGetContactTypeByUuid(req, res);
});

router.patch('/:uuid', (req, res, next) => {
    logger.info(`[ROUTES] PATCH /api/v1/contact_types/${req.params.uuid}`);
    next();
}, validate(validateUpdateContactType), handleUpdateContactType);

router.post('/', (req, res, next) => {
    logger.info('[ROUTES] POST /api/v1/contact_types');
    next();
}, validate(validateCreateContactType), handleCreateContactType);

module.exports = router;
