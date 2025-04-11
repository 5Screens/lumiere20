const express = require('express');
const router = express.Router();
const { getAllProblemCategories } = require('./controller');
const { validateGetProblemCategories } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetProblemCategories, (req, res) => {
    logger.info('[ROUTES] Handling GET request for problem categories');
    getAllProblemCategories(req, res);
});

module.exports = router;
