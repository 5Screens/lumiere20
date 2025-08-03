const express = require('express');
const router = express.Router();
const { 
    getAllProblemCategories,
    getProblemCategoryById,
    updateProblemCategoryById,
    createProblemCategoryController
} = require('./controller');
const { 
    validateGetProblemCategories,
    validateGetProblemCategoryById,
    validateUpdateProblemCategory,
    validateCreateProblemCategory
} = require('./validation');
const logger = require('../../../config/logger');

// GET toutes les problem_categories
router.get('/', validateGetProblemCategories, (req, res) => {
    logger.info('[ROUTES] Handling GET request for all problem categories');
    getAllProblemCategories(req, res);
});

// GET une problem_category par UUID
router.get('/:uuid', validateGetProblemCategoryById, (req, res) => {
    logger.info(`[ROUTES] Handling GET request for problem category by UUID: ${req.params.uuid}`);
    getProblemCategoryById(req, res);
});

// POST créer une nouvelle problem_category
router.post('/', validateCreateProblemCategory, (req, res) => {
    logger.info('[ROUTES] Handling POST request to create problem category');
    createProblemCategoryController(req, res);
});

// PATCH mettre à jour une problem_category
router.patch('/:uuid', validateUpdateProblemCategory, (req, res) => {
    logger.info(`[ROUTES] Handling PATCH request for problem category UUID: ${req.params.uuid}`);
    updateProblemCategoryById(req, res);
});

module.exports = router;
