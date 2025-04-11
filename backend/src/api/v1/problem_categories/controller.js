const { getProblemCategories } = require('./service');
const logger = require('../../../config/logger');

const getAllProblemCategories = async (req, res) => {
    logger.info('[CONTROLLER] Processing get all problem categories request');
    
    try {
        const { lang, toSelect } = req.query;
        const categories = await getProblemCategories(lang, toSelect);
        
        logger.info('[CONTROLLER] Successfully retrieved problem categories');
        res.json(categories);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving problem categories: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllProblemCategories
};
