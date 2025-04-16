const express = require('express');
const router = express.Router();
const changeQuestionsController = require('./controller');
const { validateGetChangeQuestionsQuery } = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_questions
router.get('/', validateGetChangeQuestionsQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_questions - Route handler started');
    return changeQuestionsController.getChangeQuestions(req, res);
});

module.exports = router;
