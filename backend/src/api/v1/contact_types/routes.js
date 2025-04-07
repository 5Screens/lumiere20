const express = require('express');
const router = express.Router();
const { handleGetContactTypes } = require('./controller');
const { validateGetContactTypes } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetContactTypes, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/contact_types');
    handleGetContactTypes(req, res);
});

module.exports = router;
