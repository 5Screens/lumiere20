const changeQuestionsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Get change questions based on optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChangeQuestions = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getChangeQuestions request');
    
    try {
        const changeQuestions = await changeQuestionsService.getChangeQuestions(
            req.query.lang, 
            req.query.code
        );
        
        logger.info(`[CONTROLLER] Successfully retrieved ${changeQuestions.length} change questions`);
        res.json(changeQuestions);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving change questions' 
        });
    }
};

module.exports = {
    getChangeQuestions
};
