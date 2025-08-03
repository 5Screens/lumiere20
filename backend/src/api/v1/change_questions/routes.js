const express = require('express');
const router = express.Router();
const changeQuestionsController = require('./controller');
const { 
    validateGetChangeQuestionsQuery, 
    validateGetChangeQuestionByUuid, 
    validateUpdateChangeQuestion, 
    validateCreateChangeQuestion 
} = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_questions - Récupère tous les change_questions_codes ou route vers legacy
router.get('/', validateGetChangeQuestionsQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_questions - Route handler started');
    return changeQuestionsController.getAllChangeQuestions(req, res);
});

// GET /api/v1/change_questions/:uuid - Récupère un change_questions_code par UUID
router.get('/:uuid', validateGetChangeQuestionByUuid, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/change_questions/${req.params.uuid} - Route handler started`);
    return changeQuestionsController.getChangeQuestionByUuid(req, res);
});

// PATCH /api/v1/change_questions/:uuid - Met à jour un change_questions_code
router.patch('/:uuid', validateUpdateChangeQuestion, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_questions/${req.params.uuid} - Route handler started`);
    return changeQuestionsController.updateChangeQuestion(req, res);
});

// POST /api/v1/change_questions - Crée un nouveau change_questions_code
router.post('/', validateCreateChangeQuestion, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_questions - Route handler started');
    return changeQuestionsController.createChangeQuestion(req, res);
});

module.exports = router;
