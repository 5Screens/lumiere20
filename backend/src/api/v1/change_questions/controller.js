const changeQuestionsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les change_questions_codes avec leurs traductions
 */
const getAllChangeQuestions = async (req, res) => {
    logger.info('[CONTROLLER] getAllChangeQuestions - Starting to process request');
    
    const lang = req.query.lang;
    const questionId = req.query.question_id;
    
    // Si question_id est fourni, router vers la méthode legacy qui gère ce cas
    if (questionId) {
        logger.info('[CONTROLLER] getAllChangeQuestions - question_id provided, routing to legacy method');
        return getChangeQuestions(req, res);
    }
    
    try {
        const changeQuestions = await changeQuestionsService.getAllChangeQuestions(lang);
        
        logger.info(`[CONTROLLER] getAllChangeQuestions - Successfully retrieved ${changeQuestions.length} change questions`);
        res.json(changeQuestions);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllChangeQuestions - Error retrieving change questions: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des questions de changement'
        });
    }
};

/**
 * Récupère un change_questions_code par UUID
 */
const getChangeQuestionByUuid = async (req, res) => {
    logger.info(`[CONTROLLER] getChangeQuestionByUuid - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    
    try {
        const changeQuestion = await changeQuestionsService.getChangeQuestionByUuid(uuid);
        
        if (!changeQuestion) {
            logger.info(`[CONTROLLER] getChangeQuestionByUuid - Change question not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Question de changement non trouvée'
            });
        }
        
        logger.info(`[CONTROLLER] getChangeQuestionByUuid - Successfully retrieved change question with UUID: ${uuid}`);
        res.json(changeQuestion);
    } catch (error) {
        logger.error(`[CONTROLLER] getChangeQuestionByUuid - Error retrieving change question: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la question de changement'
        });
    }
};

/**
 * Met à jour un change_questions_code
 */
const updateChangeQuestion = async (req, res) => {
    logger.info(`[CONTROLLER] updateChangeQuestion - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const updateData = req.body;
    
    try {
        const updatedChangeQuestion = await changeQuestionsService.updateChangeQuestion(uuid, updateData);
        
        if (!updatedChangeQuestion) {
            logger.info(`[CONTROLLER] updateChangeQuestion - Change question not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Question de changement non trouvée'
            });
        }
        
        logger.info(`[CONTROLLER] updateChangeQuestion - Successfully updated change question with UUID: ${uuid}`);
        res.json(updatedChangeQuestion);
    } catch (error) {
        logger.error(`[CONTROLLER] updateChangeQuestion - Error updating change question: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la question de changement'
        });
    }
};

/**
 * Crée un nouveau change_questions_code
 */
const createChangeQuestion = async (req, res) => {
    logger.info('[CONTROLLER] createChangeQuestion - Starting to process request');
    
    try {
        const newChangeQuestion = await changeQuestionsService.createChangeQuestion(req.body);
        
        logger.info(`[CONTROLLER] createChangeQuestion - Successfully created change question with UUID: ${newChangeQuestion.uuid}`);
        res.status(201).json(newChangeQuestion);
    } catch (error) {
        logger.error(`[CONTROLLER] createChangeQuestion - Error creating change question: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une question de changement avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la question de changement'
        });
    }
};

/**
 * Get change questions based on optional filters (fonction legacy)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChangeQuestions = async (req, res) => {
    logger.info('[CONTROLLER] getChangeQuestions - Starting to process legacy request');
    
    try {
        const changeQuestions = await changeQuestionsService.getChangeQuestions(
            req.query.lang, 
            req.query.question_id
        );
        
        logger.info(`[CONTROLLER] getChangeQuestions - Successfully retrieved ${changeQuestions.length} change questions`);
        res.json(changeQuestions);
    } catch (error) {
        logger.error(`[CONTROLLER] getChangeQuestions - Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving change questions' 
        });
    }
};

module.exports = {
    getAllChangeQuestions,
    getChangeQuestionByUuid,
    updateChangeQuestion,
    createChangeQuestion,
    getChangeQuestions
};
