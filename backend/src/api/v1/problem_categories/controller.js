const { 
    getAllProblemCategories: getAllProblemCategoriesService,
    getProblemCategories,
    getProblemCategoryByUuid,
    updateProblemCategory,
    createProblemCategory
} = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère toutes les problem_categories avec leurs traductions
 */
const getAllProblemCategories = async (req, res) => {
    logger.info('[CONTROLLER] getAllProblemCategories - Processing get all problem categories request');
    
    try {
        const { lang, toSelect } = req.query;
        
        // Si toSelect est fourni, router vers la méthode legacy getProblemCategories
        if (toSelect) {
            logger.info('[CONTROLLER] getAllProblemCategories - Routing to legacy getProblemCategories method');
            const categories = await getProblemCategories(lang, toSelect);
            logger.info('[CONTROLLER] getAllProblemCategories - Successfully retrieved problem categories via legacy method');
            return res.json(categories);
        }
        
        const categories = await getAllProblemCategoriesService(lang, toSelect);
        
        logger.info('[CONTROLLER] getAllProblemCategories - Successfully retrieved problem categories');
        res.json(categories);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllProblemCategories - Error retrieving problem categories: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Récupère une problem_category par UUID
 */
const getProblemCategoryById = async (req, res) => {
    logger.info('[CONTROLLER] getProblemCategoryById - Processing get problem category by UUID request');
    
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        
        logger.info(`[CONTROLLER] getProblemCategoryById - Fetching problem category with UUID: ${uuid}, language: ${lang}`);
        const problemCategory = await getProblemCategoryByUuid(uuid, lang);
        
        if (!problemCategory) {
            logger.info(`[CONTROLLER] getProblemCategoryById - Problem category not found with UUID: ${uuid}`);
            return res.status(404).json({ error: 'Problem category not found' });
        }
        
        logger.info('[CONTROLLER] getProblemCategoryById - Successfully retrieved problem category');
        res.json(problemCategory);
    } catch (error) {
        logger.error(`[CONTROLLER] getProblemCategoryById - Error retrieving problem category: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Met à jour une problem_category
 */
const updateProblemCategoryById = async (req, res) => {
    logger.info('[CONTROLLER] updateProblemCategoryById - Processing update problem category request');
    
    try {
        const { uuid } = req.params;
        const updateData = req.body;
        
        logger.info(`[CONTROLLER] updateProblemCategoryById - Updating problem category with UUID: ${uuid}`);
        const updatedProblemCategory = await updateProblemCategory(uuid, updateData);
        
        logger.info('[CONTROLLER] updateProblemCategoryById - Successfully updated problem category');
        res.json(updatedProblemCategory);
    } catch (error) {
        logger.error(`[CONTROLLER] updateProblemCategoryById - Error updating problem category: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une catégorie de problème avec ce code existe déjà'
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Crée une nouvelle problem_category
 */
const createProblemCategoryController = async (req, res) => {
    logger.info('[CONTROLLER] createProblemCategoryController - Processing create problem category request');
    
    try {
        const problemCategoryData = req.body;
        
        logger.info(`[CONTROLLER] createProblemCategoryController - Creating problem category with code: ${problemCategoryData.code}`);
        const createdProblemCategory = await createProblemCategory(problemCategoryData);
        
        logger.info('[CONTROLLER] createProblemCategoryController - Successfully created problem category');
        res.status(201).json(createdProblemCategory);
    } catch (error) {
        logger.error(`[CONTROLLER] createProblemCategoryController - Error creating problem category: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une catégorie de problème avec ce code existe déjà'
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllProblemCategories,
    getProblemCategoryById,
    updateProblemCategoryById,
    createProblemCategoryController
};
