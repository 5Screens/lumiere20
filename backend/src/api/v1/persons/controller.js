const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all persons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersons = async (req, res) => {
    try {
        logger.info('Controller - Getting all persons');
        const { lang } = req.query;
        const persons = await service.getAllPersons(lang);
        logger.info('Controller - Successfully retrieved persons');
        res.json(persons);
    } catch (error) {
        logger.error('Controller - Error getting persons:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

module.exports = {
    getPersons
};
